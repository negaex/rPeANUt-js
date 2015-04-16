
//############################### EMULATOR ###################################
// takes in machine code and runs it
// Note: This is NOT a simulator. It does attempt to implement the
// insides of an rPeanut processor. It is simply an emulator, mimicing the
// outwardly behaviour.
//
// Hence, this emulator should not be used as the main method of
// verifying correctness of code.
//
/*
 ___ __  __ _   _ _      _ _____ ___  ___
| __|  \/  | | | | |    /_\_   _/ _ \| _ \
| _|| |\/| | |_| | |__ / _ \| || (_) |   /
|___|_|  |_|\___/|____/_/ \_\_| \___/|_|_\

*/

var instr_inv = {
  "0x0":        ["halt",    ["0x0"]],
  "0x1":        ["add",     ["0x1","R","R","R"]],
  "0x2":        ["sub",     ["0x2","R","R","R"]],
  "0x3":        ["mult",    ["0x3","R","R","R"]],
  "0x4":        ["div",     ["0x4","R","R","R"]],
  "0x5":        ["mod",     ["0x5","R","R","R"]],
  "0x6":        ["and",     ["0x6","R","R","R"]],
  "0x7":        ["or",      ["0x7","R","R","R"]],
  "0x8":        ["xor",     ["0x8","R","R","R"]],
  "0xA0":       ["neg",     ["0xA0","R","R"]],
  "0xA1":       ["not",     ["0xA1","R","R"]],
  "0xA2":       ["move",    ["0xA2","R","R"]],                               // RD <- RS
  "0xA300":     ["call",    ["0xA300","ADDR"]],                                     // SP <- SP +1, mem[SP] <- PC, PC <- address
  "0xA3010000": ["return",  ["0xA3010000"]],                                      // PC <- mem[SP], SP <- SP-1
  "0xA3020000": ["trap",    ["0xA3020000"]],                                        //  SP <- SP +1, mem[SP] <- PC, PC <- 0x0002, SR <- SR | (1<<1)
  "0xA400":     ["jump",    ["0xA400","ADDR"]],                                     // PC <- address
  "0xA41":      ["jumpz",   ["0xA41","R","ADDR"]],                                 // if (R == 0x00000000) { PC <- address  }
  "0xA42":      ["jumpn",   ["0xA42","R","ADDR"]],                                 // if ((R&0x80000000) != 0x00000000) { PC <- address  }
  "0xA43":      ["jumpnz",  ["0xA43","R","ADDR"]],                                // if (R != 0x00000000) {PC <- address}
  "0xA50":      ["reset",   ["0xA50","B"]],                                // SR <- SR & ~(1<<BIT)
  "0xA51":      ["set",     ["0xA51","B"]],                                   // SR <- SR | (1<<BIT)
  "0xA60":      ["push",   ["0xA60","R"]],                                 // SP <- SP+1, mem[SP]<-RS
  "0xA61":      ["pop",     ["0xA61","R"]],                                   // RD <- mem[SP], SP <- SP -1
  "0xB0":       ["rotate_0",["0xB0","R","R","VALU"]],                            // RD <- RS << amount | RS >>> (32-amount)
  "0xE":        ["rotate_1",["0xE","R","R","R"]],                         // RD <- RS << RA | RS >>> (32 - RA)
  "0xC00":      ["load_0",  ["0xC00","R","VALU"]],                                 // RD <- ext(value)
  "0xC10":      ["load_1",  ["0xC10","R","ADDR"]],                                // RD <- mem[address]
  "0xC2":       ["load_2",  ["0xC2","R","R"]],                                     // RD <- mem[RSA]
  "0xC3":       ["load_3",  ["0xC3","R","R","VALU"]],                            // RD <- mem[RSA+ext(value)]
  "0xD1":       ["store_0", ["0xD1","R","ADDR"]],                           // mem[addr] <- RS
  "0xD2":       ["store_1", ["0xD2","R","R"]],                                     // mem[RDA] <- RS
  "0xD3":       ["store_2", ["0xD3","R","R","VALU"]],                            // mem[RDA+ext(value)] <- RS
};

function f_halt   ()              {halted=true;}
function f_add    (RS1, RS2, RD)  { r_write(RD, RS1.value + RS2.value);}
function f_sub    (RS1, RS2, RD)  { r_write(RD, RS1.value - RS2.value);}
function f_mult   (RS1, RS2, RD)  { r_write(RD, RS1.value * RS2.value);}
function f_div    (RS1, RS2, RD)  { r_write(RD, Math.floor(RS1.value / RS2.value) );}
function f_mod    (RS1, RS2, RD)  { r_write(RD, RS1.value % RS2.value);}
function f_and    (RS1, RS2, RD)  { r_write(RD, RS1.value & RS2.value);}
function f_or     (RS1, RS2, RD)  { r_write(RD, RS1.value | RS2.value);}
function f_xor    (RS1, RS2, RD)  { r_write(RD, RS1.value ^ RS2.value);}
function f_neg    (RS, RD)        { r_write(RD, (0xFFFFFFFF+RS1.value) ^ 0xFFFFFFFF);}
function f_not    (RS, RD)        { r_write(RD, ~ RS.value);}
function f_move   (RS, RD)        { r_write(RD, RS.value);}
function f_call   (address)       { SP.value = SP.value+1; m_write(SP.value, PC.value); PC.value = address-1;}
function f_return ()              { PC.value = m_read(SP.value);SP.value=SP.value-1;}
function f_trap   ()              { SP.value = SP.value +1; m_write(SP.value, PC.value); PC.value = 0x0002; SR.value = SR.value | (1<<1);}
function f_jump   (address)       { PC.value = address-1;}
function f_jumpz  (RS, address)   { if (RS.value === 0) { PC.value = address-1;} }
function f_jumpn  (RS, address)   { if (RS.value < 0) { PC.value = address-1;} }
function f_jumpnz (RS, address)   { if (RS.value !== 0) { PC.value = address-1; } }
function f_reset  (bit)           { SR.value = SR.value & ~(1<<bit);}
function f_set    (bit)           { SR.value = SR.value | (1<<bit);}
function f_push   (RS)            { SP.value++; m_write(SP.value, RS.value); }
function f_pop    (RD)            { r_write( RD, m_read(SP.value)); SP.value--;}
function f_rotate_0(value,RS,RD)  { r_write( RD, RS.value << value | RS.value >>> (32-value)); }
function f_rotate_1(RS, RA, RD)   { r_write( RD, RS.value << RA.value | RS.value >>> (32 - RA.value)); }
function f_load_0 (RD, value)     { r_write( RD, value);}
function f_load_1 (RD,address)    { r_write( RD, m_read(address));}
function f_load_2 (RSA, RD)       { r_write( RD, m_read(RSA.value));}
function f_load_3 (RSA, RD, value){ r_write( RD, m_read(RSA.value+value));}
function f_store_0(RS, address)   { m_write( address, RS.value);}
function f_store_1(RS, RDA)       { m_write( RDA.value,RS.value);}
function f_store_2(RS,RDA,value)  { m_write( RDA.value+value, RS.value);}

function r_write(register, value){
  if(register.permission=="wr" || register.permission=="w"){
    register.value=value;
  }
}

function m_read(address){
  if(address==0xFFF0){
    terminal.status=terminal.status & 0x10;
    memory[0xFFF1]=terminal.status;
    return terminal.input;
  }
  return memory[address];
}

function m_write(address, value){
  if(address==0xFFF0){
    terminal.output.push(value);
    update_screen();
    return;
  }
  memory[address]=value;
  memory_key[address]="";
  if(notfast){
    update_value (address);
  }
  if(address>=0x7C40 && address<0x8000){
    term_update_word(address);
  }
}

function control_unit(input){

    var ij=0;
    template=[];
    while(ij<=input.length){
      var start = input.substring(0,ij);
      if(start in instr_inv){
        template=instr_inv[start];
        break;
      }
      ij++;
    }
    if(template==""){return 0;}
    var instruction=[];

    for(ij=0;ij<template[1].length;ij++){

      if(ij===0){instruction.push(template[0]);input=input.substring(template[1][0].length);continue;}

      var value = parseInt(input.substring(0,template[1][ij].length), 16);
      var instr_add="";
      switch(template[1][ij]) {

        case "R":
           instr_add = register_obj[ register_names[value]];
          break;

        case "ADDR":
          instr_add = value;
          break;

        case "VALU":
          if(value>=0x8000){
            value=value-1-0xFFFF;
          }
          instr_add = value;
          break;

      }
      input=input.substring( template[1][ij].length);
      instruction.push( instr_add );

    }

    instruction.push("");
    instruction.push("");
    instruction.push("");
    window[ "f_"+instruction[0] ] ( instruction[1],instruction[2],instruction[3] );

}

function Terminal(){
  this.output=[];
  this.input=0;
  this.status=0x10;
}

var terminal = new Terminal();

function update_screen(){
  while(terminal.output.length>0){
  if((terminal.status&0x10)==0x10){
    screen_write(String.fromCharCode(terminal.output.pop()));
  }
}
}

function screen_write(char){
  $("#terminal_s").append(char);
}

function term_reset(){

	for (var i=0;i<imgData.data.length/4;i+=1)
	  {
	  imgData.data[4*i+0]=55;
	  imgData.data[4*i+1]=64;
	  imgData.data[4*i+2]=70;
	  imgData.data[4*i+3]=255;
	  }
	context.putImageData(imgData,0,0);
}

function term_update_word(address) {
  var data = memory[address];
  var x = ((address-0x7C40)*32)%192;
  var y = Math.floor((((address-0x7C40)*32)-x)/192);
  for(var i=0;i<32;i++){
    var pixel_data = (data >> i) & 1;
    term_update_pixel(x+i,y,pixel_data);
  }
}


function term_update_pixel(x,y,onoff){
  if(x>=192 || y>=160){
    return;
  }

  var new_data=[55,64,70];
  if(onoff){
    new_data=[255,255,255];
  }

  imgData.data[(y*192+x)*4+0]=new_data[0];
  imgData.data[(y*192+x)*4+1]=new_data[1];
  imgData.data[(y*192+x)*4+2]=new_data[2];
  imgData.data[(y*192+x)*4+3]=255;

	context.putImageData(imgData,0,0);

}



var running=0;
var halted=false;


function run(timeout){
  //if(running){stop();}
  running=1;
  $('.button_hide').hide();
  $('.button_show').show();
  run_loop(timeout);
}

function run_loop(timeout){
  var rcode = step();
  if(rcode==-1){
    halted=true;
    stop();
    return;
  }
  else{
    stopper = setZeroTimeout(function(){ run_loop(timeout); });
    //run_loop(timeout);
  }
}

function call_step(){
  running=1;
  step();
  running=0;
}

function step(){
  if(halted || running===0){
    stop();
    return 0;
  }
  var data = memory[PC.value];
  data_s=print(data);
  var rcode=control_unit(data_s);
  PC.value++;
  if(notfast){
    show_regs();
    update_current();
  }
  if(data=="0"){
    return -1;
  }
}

function stop() {
  notfast=true;
  running=0;
  clearTimeout(stopper);
  $('.button_hide').show();
  $('.button_show').hide();
}
