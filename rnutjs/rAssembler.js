

//############################### assembly ###################################
// converts assebly code to machine code.
//
// Why does rnutjs assemble into machine code? With an emulator, it would
// be easier to skip this step, but the plan is to eventually implement
// a simulator. Already having an assembler will facilitate this process.
/*
    _   ___ ___ ___ __  __ ___ _    ___ ___
   /_\ / __/ __| __|  \/  | _ ) |  | __| _ \
  / _ \\__ \__ \ _|| |\/| | _ \ |__| _||   /
 /_/ \_\___/___/___|_|  |_|___/____|___|_|_\

*/

instr = {
  "halt":   {""   :"0x00000000"},
  "add":    {"RRR":"0x1%0%1%20000"},
  "sub":    {"RRR":"0x2%0%1%20000"},
  "mult":   {"RRR":"0x3%0%1%20000"},
  "div":    {"RRR":"0x4%0%1%20000"},
  "mod":    {"RRR":"0x5%0%1%20000"},
  "and":    {"RRR":"0x6%0%1%20000"},
  "or":     {"RRR":"0x7%0%1%20000"},
  "xor":    {"RRR":"0x8%0%1%20000"},
  "neg":    {"RR" :"0xA0%0%10000"},                                             // RD <- - RS
  "not":    {"RR" :"0xA1%0%10000"},                                             // RD <- ~ RS
  "move":   {"RR" :"0xA2%0%10000"},                                             // RD <- RS
  "call":   {"A"  :"0xA300%0"},                                                 // SP <- SP +1, mem[SP] <- PC, PC <- address
  "return": {""   :"0xA3010000"},                                               // PC <- mem[SP], SP <- SP-1
  "trap":   {""   :"0xA3020000"},                                               //  SP <- SP +1, mem[SP] <- PC, PC <- 0x0002, SR <- SR | (1<<1)
  "jump":   {"A"  :"0xA400%0"},                                                 // PC <- address
  "jumpz":  {"RA" :"0xA41%0%1"},                                                // if (R == 0x00000000) { PC <- address  }
  "jumpn":  {"RA" :"0xA42%0%1"},                                                // if ((R&0x80000000) != 0x00000000) { PC <- address  }
  "jumpnz": {"RA" :"0xA43%0%1"},                                                // if (R != 0x00000000) {PC <- address}
  "reset":  {"B"  :"0xA50%00000"},                                               // SR <- SR & ~(1<<BIT)
  "set":    {"B"  :"0xA51%00000"},                                              // SR <- SR | (1<<BIT)
  "push":   {"R"  :"0xA60%00000"},                                              // SP <- SP+1, mem[SP]<-RS
  "pop":    {"R"  :"0xA61%00000"},                                              // RD <- mem[SP], SP <- SP -1
  "rotate": {"VRR":"0xB0%1%2%0",                                                // RD <- RS << amount | RS >>> (32-amount)
             "RRR":"0xE%0%1%2"},                                                // RD <- RS << RA | RS >>> (32 - RA)
  "load":   {"VR" :"0xC00%1%0",
             "AR" :"0xC10%1%0",
             "RR" :"0xC2%0%10000",
             "RVR":"0xC3%0%2%1"},
  "store":  {"RA" :"0xD1%0%1",
             "RR" :"0xD2%0%1",
             "RVR":"0xD3%0%2%1"},                                               // mem[addr] <- RS
  "block":  {"V"  :"0x0000%0",
             "A"  :"0x00000000"},
};

var label_address=[];
var label_name=[];


function run_assembler() {
  "use strict";

  
  /* Order of assembly:
   *
   * 1. Split code by newlines
   * 2. Include #include files
   * 3. Expand macros (not implemented yet)
   * 4. Resolve labels
   * 5. Assemble
   *
   */

  

  stop();

  reset();

  label_address=[];
  label_name=[];

  var code = editor.getValue();

  // Split into lines.
  var codes=code.split("\n");
  //var codes=code.match(/\n[^"]*\n|[^\s"]+/g);


  // Used for Error Codes. Eg: "Error at line XX".
  var lines=[];
  for(var ji=0;ji<codes.length;ji++){
    lines.push(ji+1);
  }

  //Check for #includes (quite messy! needs cleaning up)
  j=0;
  while(j<codes.length){
     var line = $.trim(codes[j]);
     line=line.match(/[^;]*/)[0];
     line=line.replace(/ +(?= )/g,'');
     line=line.replace(/\t+/g,' ');
     if(line.substr(0,10)=='#include "'){
       var filename=line.substr(10, line.length-11);
       var newcodes=fs_open(filename);
       if(newcodes===-1){
         //newcodes=db_open(filename);
         if(filename in db_cache){
           newcodes=db_cache[filename];
         }
         else{
           alert("ParseException at line "+lines[j]+".\nFile not found in local-storage: "+filename);
           return -1;
         }
       }
       newcodes=newcodes.split("\n");
       codes.splice(j,1);
       for(var jplus=0;jplus<newcodes.length;jplus++){
         codes.splice(j+jplus,0,newcodes[jplus]);
       }
     }
     j++;
   }

   lines=[];
   for(ji=0;ji<codes.length;ji++){
     lines.push(ji+1);
   }

  // Loop through each line and pre-process it, resolving labels
  for (j = 0; j < codes.length; j++) {
     var ret = preprocessor(codes[j],lines[j]);
     if(ret!==0){
      mem_counter++;
    }
   }

  mem_counter=0;
  for (var j = 0; j < codes.length; j++) {
     var tmp = assemble(codes[j],lines[j]);
     if(tmp==-2){
       return;
     }
     if(tmp!==-1){
       memory[mem_counter]=tmp;
      mem_counter++;
    }
   }


  PC.value=256;
  show_memory();

}


// Resolves labels.
function preprocessor(line,linenu){
  line=line.match(/[^;]*/)[0];
  line=line.replace(/ +(?= )/g,'');
  line=line.replace(/\t+/g,' ');
  line=line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  line=line.replace(" :",":");

  //var words = line.split(" ");
  var words = line.match(/'[^"]*'|[^\s"]+/g);
  var mac="";

  //ignore empty lines
  if(words===null){
    return 0;
  }

  // Take care of code jumps
  if(words[0].slice(-1)==":"){
    token=words[0].substr(0, words[0].length-1 );
    words.shift();
    if(!isNaN(token)){
      mem_counter=parseInt(token);
    } else {
      if(label_name.indexOf(token)==-1){
        label_name.push(token);
        memory_label[mem_counter]=token;
        label_address.push(fix_len(mem_counter.toString(16),4));
      } else{label_address[label_name.indexOf(token)]=mem_counter;
      }
    }
  }

  if(words==''){
    return 0;
  }

  if(words[0]=="block" && words[1][0]!="#"){
    mem_counter=mem_counter+parseInt(words[1])-1;
  }
}


function Token(type, value){
  this.type=type;
  this.value=value;
}

function token_type(token,linenu){
  var obj_token = new Token("halt",token);
  if(token == ""){ //Change === to ==
    return  obj_token;
  } else
  if(token in register_obj){
    obj_token.type="R";
    obj_token.value=register_obj[token].hex;
  } else
  if(token in bit_index_in_sr){
    obj_token.type="B";
    obj_token.value=bit_index_in_sr[token];
  } else
  if( !isNaN(token)){
    obj_token.type="A";
    obj_token.value=parseInt(token).toString(16).toUpperCase();
    if(obj_token.value.length<4){
      obj_token.value = "0"+obj_token.value;
    }
  } else
  if( token[0]=="#"){
    token=token.substr(1);
    obj_token.type="V";
    if(token[0]=="'" && token[token.length-1]=="'"){
      obj_token.value = token[1].charCodeAt(0).toString(16).toUpperCase();
    }
    else{
      obj_token.value=two_comp(parseInt(token));
    }
    while(obj_token.value.length<4){
      obj_token.value = "0"+obj_token.value;
    }
  } else
  if(label_name.indexOf(token)>-1){ // Token is a LABEL
    obj_token.type="A";
    obj_token.value=label_address[label_name.indexOf(token)];
  }
  else {
      alert("ParseException at line "+linenu+".\nUnrecognized symbol: "+token);
      return -1;
  }
  return obj_token;
}


function assemble (line,linenu) {
    line=line.match(/[^;]*/)[0];
    line=line.replace(/ +(?= )/g,'');
    line=line.replace(/\t+/g,' ');
    line=line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    line=line.replace(" :",":");

    //var words = line.split(" ");
    var words = line.match(/'[^"]*'|[^\s"]+/g);
    var mac="";

    //ignore empty lines
    if(words===null){
      return -1;
    }

    // Take care of code jumps
    if(words[0].slice(-1)==":"){
      token=words[0].substr(0, words[0].length-1 );
      words.shift();
      if(!isNaN(token)){
        mem_counter=parseInt(token);
      }
    }

    if(words==''){
      return -1;
    }

    var template_m=[];
    var parameters=[];
    var inst = words[0];
    for(var i=1;i<words.length;i++){
      obj_token = token_type(words[i],linenu);
      if(obj_token==-1){
        return -2;
      }
      template_m+=obj_token.type;
      parameters.push(obj_token.value);
    }

    if (inst in instr){
      templates=instr[inst];
    } else {alert("ParseException at line "+linenu+"\nUnknown command: "+inst); return -1;}
    if (template_m in templates){
      template = templates[template_m];
    } else {alert("ParseException at line "+linenu+"\nIncompatible parameter types for command "+inst); return -1;}
    template = template.replace("%0",parameters[0]);
    template = template.replace("%1",parameters[1]);
    template = template.replace("%2",parameters[2]);

    memory_key[mem_counter]=inst;

    //return parseInt(template,16);
    //return template;

    if(inst=="block" && template_m==["A"]){
      mem_counter=mem_counter+parseInt(parameters[0]);
      return -1;
    }

    return parseInt(template);

}

// val = val.substr(1);
// if(isNaN(val)){alert("Parse error!");}
