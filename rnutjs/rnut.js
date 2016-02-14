/*jshint latedef: false */

//############################### set up # ###################################
// sets machine up
/*
  ___ ___ _____    _   _ ___
/ __| __|_   _|__ | | | | _ \
\__ \ _|  | ||___ | |_| |  _/
|___/___| |_|     \___/|_|

*/

var machine = {};

machine.R0=   {value:0,   permission: "wr", hex: "0"  };
machine.R1=   {value:0,   permission: "wr", hex: "1"  };
machine.R2=   {value:0,   permission: "wr", hex: "2"  };
machine.R3=   {value:0,   permission: "wr", hex: "3"  };
machine.R4=   {value:0,   permission: "wr", hex: "4"  };
machine.R5=   {value:0,   permission: "wr", hex: "5"  };
machine.R6=   {value:0,   permission: "wr", hex: "6"  };
machine.R7=   {value:0,   permission: "wr", hex: "7"  };
machine.SP=   {value:0,   permission: "wr", hex: "8"  };
machine.SR=   {value:0,   permission: "wr", hex: "9"  };
machine.PC=   {value:0,   permission: "wr", hex: "A"  };
machine.IR=   {value:0,   permission: "",   hex: ""    };
machine.ONE=  {value:1,   permission: "r",  hex: "B"   };
machine.ZERO= {value:0,   permission: "r",  hex: "C"   };
machine.MONE= {value:-1,  permission: "r",  hex: "D"   };


machine.registers={
  "R0": machine.R0,
  "R1": machine.R1,
  "R2": machine.R2,
  "R3": machine.R3,
  "R4": machine.R4,
  "R5": machine.R5,
  "R6": machine.R6,
  "R7": machine.R7,
  "SP": machine.SP,
  "SR": machine.SR,
  "PC": machine.PC,
  "ONE": machine.ONE,
  "ZERO": machine.ZERO,
  "MONE": machine.MONE
};

machine.register_names=["R0","R1","R2","R3","R4","R5","R6","R7","SP","SR","PC","ONE","ZERO","MONE"];


var bit_names = ["OF", "IM", "TI"]

var bit_index_in_sr = {
  "OF": 0,
  "IM": 1,
  "TI": 2
} // same as bit_name.index_of

//MEMORY
machine.memory = [];
machine.memory_key = [];
machine.memory_label = [];
machine.memory_break = [];
machine.memory_profiling = [];

//CLOCK
machine.clock=0;

machine.interrupt_que=-1;

var stopper;
var halted;
var notfast=true;

function reset() {
  "use strict";
  //var zero = "assemble("halt",-1)";
  var zero = 0x00000000, memsize = 16 * 16 * 16 * 16, i;
  machine.memory = [];
  machine.memory_key=[];
  machine.memory_label=[];
  machine.memory_break=[];
  machine.memory_profiling=[];

  machine.clock=0;
  machine.interrupt_que=-1;

  $("#terminal_s").text('');


  for (i = 1; i <= memsize; i += 1) {
    machine.memory.push(zero);
    machine.memory_key.push("halt");
    machine.memory_label.push("");
    machine.memory_break.push(0);
    machine.memory_profiling.push(0);
  }
  machine.memory[0xFFF0] = null;
  halted=false;
  machine.R0.value=0;
  machine.R1.value=0;
  machine.R2.value=0;
  machine.R3.value=0;
  machine.R4.value=0;
  machine.R5.value=0;
  machine.R6.value=0;
  machine.R7.value=0;
  machine.SP.value=0x7000;
  machine.SR.value=0;
  machine.PC.value=256;

  show_regs();

  show_memory();

  term_reset();


}

//editor.focus();


// ######################## DISPLAY ##########################################

function print (number, len){
  if (number < 0)
    {
      number = 0xFFFFFFFF + number+1;
    }
  var hstr = number.toString(16).toUpperCase();
  hstr=fix_len(hstr,len);
  hstr="0x"+hstr;
  return hstr;
}

function fix_len (hstr, len){
  while(hstr.length<len){
   hstr="0"+hstr;
  }
  return hstr;
}

function two_comp (number){
  len=4;
  if (number < 0)
    {
      number = 0xFFFF + number+1;
    }
  var hstr = number.toString(16).toUpperCase();
  hstr=fix_len(hstr,4);
  return hstr;

}

function set_break(address){
  if(machine.memory_break[address]){
    machine.memory_break[address]=0;
  }
  else{
    machine.memory_break[address]=1;
  }
  update_break(address);
}

function update_break (address_in) {
  var table = document.getElementById("selectable");
  var row;
  for (var i = 1; i<table.rows.length; i++) {
    row=table.rows[i];
    address=parseInt(row.cells[2].innerHTML,16);
    if(address==address_in){
      if($(row).hasClass("breaker")){
        $(row).removeClass("breaker");
      }
      else{
        $(row).addClass("breaker");
      }
      return;
    }
  }
}


function update_current () {
  var table = document.getElementById("selectable");
  var row;
  var done=0;
  for (var i = 1; i<table.rows.length; i++) {
    row=table.rows[i];
    if($(row).hasClass("selected")){
      $(row).removeClass("selected");
      address=parseInt(row.cells[2].innerHTML,16);
      if(machine.memory_profiling[address]>0){
        row.cells[0].innerHTML = machine.memory_profiling[address];
      }
      done++;
    }
    address=parseInt(row.cells[2].innerHTML,16);
    if(address==machine.PC.value){
      $(row).addClass("selected");
      done++;
    }
  }
}

function update_value (address_in) {
  var table = document.getElementById("selectable");
  var row;
  var cell1,cell2,cell3,cell4;
  for (var i = 1; i<table.rows.length; i++) {
    row=table.rows[i];
    address=parseInt(row.cells[2].innerHTML,16);
    if(address==address_in){
      if(machine.memory_profiling[address_in]>0){
        row.cells[0].innerHTML = machine.memory_profiling[address_in];
      }
      row.cells[3].innerHTML = print(machine.memory[address_in],8);
      row.cells[4].innerHTML = machine.memory_key[address_in];
      return;
    }
    if(address>address_in){
      row = table.insertRow(i);
      cell0 = row.insertCell(0);
      cell0.className="register-ignore";
      cell1 = row.insertCell(1);
      cell2 = row.insertCell(2);
      cell3 = row.insertCell(3);
      cell4 = row.insertCell(4);
      if(machine.memory_profiling[address_in]>0){
        cell0.innerHTML = machine.memory_profiling[address_in];
      }
      cell2.innerHTML = print(address_in, 4);
      cell3.innerHTML = print(machine.memory[address_in],8);
      cell4.innerHTML = machine.memory_key[address_in];
      return;
    }
  }
    row = table.insertRow(table.rows.length);
    cell0 = row.insertCell(0);
    cell0.className="register-ignore";
    cell1 = row.insertCell(1);
    cell2 = row.insertCell(2);
    cell3 = row.insertCell(3);
    cell4 = row.insertCell(4);
    if(machine.memory_profiling[address_in]>0){
      cell0.innerHTML = machine.memory_profiling[address_in];
    }
    cell2.innerHTML = print(address_in, 4);
    cell3.innerHTML = print(machine.memory[address_in],8);
    cell4.innerHTML = machine.memory_key[address_in];
    return;
}

function show_memory () {

  var table = document.getElementById("selectable").getElementsByTagName('tbody')[0];
  table.innerHTML="";

  last=0;


  for (var j = 0; j < 0x8000; j++) {
    if(machine.memory[j]!="0x00000000" || last>0){
     var row = table.insertRow(table.rows.length);
     if(j==machine.PC.value){row.className="selected";
     //$('#selectable').scrollTop(0);
     }
     if(machine.memory_break[j]) {
       $(row).addClass("breaker");
     }
     var cell0 = row.insertCell(0);
     cell0.className="register-ignore";
     var cell1 = row.insertCell(1);
     var cell2 = row.insertCell(2);
     var cell3 = row.insertCell(3);
     var cell4 = row.insertCell(4);
     if(machine.memory_profiling[j]>0){
       cell0.innerHTML = machine.memory_profiling[j];
     }
     cell1.innerHTML = machine.memory_label[j];
     cell2.innerHTML = print(j, 4);
     cell3.innerHTML = print(machine.memory[j],8);
     cell4.innerHTML = machine.memory_key[j];

     if(machine.memory[j]!="0x00000000"){
       last=2;
     } else {
       last--;
     }
   }

 }

    $('#selectable').find('tr').click( function(){
      set_break(parseInt($(this).context.cells[2].innerHTML));
    });




}


function show_regs () {

  var table = document.getElementById("reg_table").getElementsByTagName('tbody')[0];
  table.innerHTML="";

  for(var i=0;i<11;i++){
     var row = table.insertRow(i);
     var cell1 = row.insertCell(0);
     var cell2 = row.insertCell(1);
     var name = machine.register_names[i];
     if(i==10){cell1.className="register-last register";cell2.className="register-last register-ignore";}
     else{cell1.className="register";}
     cell1.innerHTML = name;
     if(i>7 && i<10){cell2.className="register-ignore";}
     cell2.innerHTML = print(machine.registers[name].value, 8);
  }


  return 0;
}








function run_assembler() {

  stop();

  reset();

  var assembled_machine = Assembler.run(editor.getValue(), machine);

  if(assembled_machine==-1) {
    return;
  }

  machine = assembled_machine;
  show_memory();
}
