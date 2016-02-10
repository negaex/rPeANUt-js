/*jshint latedef: false */

//############################### set up # ###################################
// sets machine up
/*
  ___ ___ _____    _   _ ___
/ __| __|_   _|__ | | | | _ \
\__ \ _|  | ||___ | |_| |  _/
|___/___| |_|     \___/|_|

*/

var R0=   {value:0,   permission: "wr", hex: "0"  };
var R1=   {value:0,   permission: "wr", hex: "1"  };
var R2=   {value:0,   permission: "wr", hex: "2"  };
var R3=   {value:0,   permission: "wr", hex: "3"  };
var R4=   {value:0,   permission: "wr", hex: "4"  };
var R5=   {value:0,   permission: "wr", hex: "5"  };
var R6=   {value:0,   permission: "wr", hex: "6"  };
var R7=   {value:0,   permission: "wr", hex: "7"  };
var SP=   {value:0,   permission: "wr", hex: "8"  };
var SR=   {value:0,   permission: "wr", hex: "9"  };
var PC=   {value:0,   permission: "wr", hex: "A"  };
var IR=   {value:0,   permission: "",   hex: ""    };
var ONE=  {value:1,   permission: "r",  hex: "B"   };
var ZERO= {value:0,   permission: "r",  hex: "C"   };
var MONE= {value:-1,  permission: "r",  hex: "D"   };

var register_obj={
  "R0": R0,
  "R1": R1,
  "R2": R2,
  "R3": R3,
  "R4": R4,
  "R5": R5,
  "R6": R6,
  "R7": R7,
  "SP": SP,
  "SR": SR,
  "PC": PC,
  "ONE": ONE,
  "ZERO": ZERO,
  "MONE": MONE
};

var register_names=["R0","R1","R2","R3","R4","R5","R6","R7","SP","SR","PC","ONE","ZERO","MONE"];


var bit_names = ["OF", "IM", "TI"]

var bit_index_in_sr = {
  "OF": 0,
  "IM": 1,
  "TI": 2
} // same as bit_name.index_of

//MEMORY
var memory = [], mem_counter=0;
var memory_key = [];
var memory_label = [];
var memory_break = [];
var memory_profiling = [];

//CLOCK
var clock_count=0;

var interrupt_que=-1;

var stopper;
var halted;
var notfast=true;

function reset() {
  "use strict";
  //var zero = "assemble("halt",-1)";
  var zero = 0x00000000, memsize = 16 * 16 * 16 * 16, i;
  memory=[];
  memory_key=[];
  memory_label=[];
  memory_break=[];
  memory_profiling=[];

  clock_count=0;
  interrupt_que=-1;

  $("#terminal_s").text('');


  for (i = 1; i <= memsize; i += 1) {
    memory.push(zero);
    memory_key.push("halt");
    memory_label.push("");
    memory_break.push(0);
    memory_profiling.push(0);
  }
  memory[0xFFF0]=null;
  mem_counter = 0;
  halted=false;
  R0.value=0;
  R1.value=0;
  R2.value=0;
  R3.value=0;
  R4.value=0;
  R5.value=0;
  R6.value=0;
  R7.value=0;
  SP.value=0x7000;
  SR.value=0;
  PC.value=256;

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
  if(memory_break[address]){
    memory_break[address]=0;
  }
  else{
    memory_break[address]=1;
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
      if(memory_profiling[address]>0){
        row.cells[0].innerHTML = memory_profiling[address];
      }
      done++;
    }
    address=parseInt(row.cells[2].innerHTML,16);
    if(address==PC.value){
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
      if(memory_profiling[address_in]>0){
        row.cells[0].innerHTML = memory_profiling[address_in];
      }
      row.cells[3].innerHTML = print(memory[address_in],8);
      row.cells[4].innerHTML = memory_key[address_in];
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
      if(memory_profiling[address_in]>0){
        cell0.innerHTML = memory_profiling[address_in];
      }
      cell2.innerHTML = print(address_in, 4);
      cell3.innerHTML = print(memory[address_in],8);
      cell4.innerHTML = memory_key[address_in];
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
    if(memory_profiling[address_in]>0){
      cell0.innerHTML = memory_profiling[address_in];
    }
    cell2.innerHTML = print(address_in, 4);
    cell3.innerHTML = print(memory[address_in],8);
    cell4.innerHTML = memory_key[address_in];
    return;
}

function show_memory () {

  var table = document.getElementById("selectable").getElementsByTagName('tbody')[0];
  table.innerHTML="";

  last=0;


  for (var j = 0; j < 0x8000; j++) {
    if(memory[j]!="0x00000000" || last>0){
     var row = table.insertRow(table.rows.length);
     if(j==PC.value){row.className="selected";
     //$('#selectable').scrollTop(0);
     }
     var cell0 = row.insertCell(0);
     cell0.className="register-ignore";
     var cell1 = row.insertCell(1);
     var cell2 = row.insertCell(2);
     var cell3 = row.insertCell(3);
     var cell4 = row.insertCell(4);
     if(memory_profiling[j]>0){
       cell0.innerHTML = memory_profiling[j];
     }
     cell1.innerHTML = memory_label[j];
     cell2.innerHTML = print(j, 4);
     cell3.innerHTML = print(memory[j],8);
     cell4.innerHTML = memory_key[j];

     if(memory[j]!="0x00000000"){
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
     var name = register_names[i];
     if(i==10){cell1.className="register-last register";cell2.className="register-last register-ignore";}
     else{cell1.className="register";}
     cell1.innerHTML = name;
     if(i>7 && i<10){cell2.className="register-ignore";}
     cell2.innerHTML = print(register_obj[name].value, 8);
  }


  return 0;
}
