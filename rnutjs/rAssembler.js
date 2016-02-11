

// DISCLAIMER! THIS CODE IS ALL A BIT OF AN AWFUL HACK, IS FULL OF BUGS AND IT
// SHOULD BE FIXED. IT WAS WRITTEN BEFORE I KNEW OF OBJECTS, SYNTAX TREES AND
// BEFORE I HAD LEARNED THE CONCEPT OF MODULARIZING CODE.
// Signed: ***REMOVED***, ***REMOVED***













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
  "add":    {"RRR":"0x1%0%1%20000",
             "VRR":"0x1E%1%2%0",
             "RVR":"0x1%0E%2%1"},
  "sub":    {"RRR":"0x2%0%1%20000",
             "VRR":"0x2E%1%2%0",
             "RVR":"0x2%0E%2%1"},
  "mult":   {"RRR":"0x3%0%1%20000",
             "VRR":"0x3E%1%2%0",
             "RVR":"0x3%0E%2%1"},
  "div":    {"RRR":"0x4%0%1%20000",
             "VRR":"0x4E%1%2%0",
             "RVR":"0x4%0E%2%1"},
  "mod":    {"RRR":"0x5%0%1%20000",
             "VRR":"0x5E%1%2%0",
             "RVR":"0x5%0E%2%1"},
  "and":    {"RRR":"0x6%0%1%20000",
             "VRR":"0x6E%1%2%0",
             "RVR":"0x6%0E%2%1"},
  "or":     {"RRR":"0x7%0%1%20000",
             "VRR":"0x7E%1%2%0",
             "RVR":"0x7%0E%2%1"},
  "xor":    {"RRR":"0x8%0%1%20000",
             "VRR":"0x8E%1%2%0",
             "RVR":"0x8%0E%2%1"},
  "neg":    {"RR" :"0xA0%0%10000",
             "VR" :"0xA0E%1%0"},
  "not":    {"RR" :"0xA1%0%10000",
             "VR" :"0xA1E%1%0"},                                                 // RD <- ~ RS
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

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var label_address=[];
var label_name=[];


function run_assembler() {
  "use strict";


  /* Order of assembly:
   *
   * 1. Split code by newlines
   * 2. Include #include files
   * 3. Define #defines
   * 4. Expand macros
   * 5. Resolve labels
   * 6. Assemble
   *
   */



  stop();

  reset();

  label_address=[];
  label_name=[];

  var code = editor.getValue();
  code="\n"+code+"\n";

  // Split into lines.
  var codes=code.split("\n");
  //var codes=code.match(/\n[^"]*\n|[^\s"]+/g);

  // Used for Error Codes. Eg: "Error at line XX".
  var lines=[];
  for(var ji=0;ji<codes.length;ji++){
    lines.push([codes[ji],ji]);
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
           alert("ParseException at line "+lines[j][1]+".\nFile not found in local-storage: "+filename);
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

   // CLEAN UP LINES, ADD LINE NUMBER FOR ERRORS
  var lines=[];
  for(var ji=0;ji<codes.length;ji++){
    line = codes[ji];
   line=line.match(/[^;]*/)[0];
   line=line.replace(/ +(?= )/g,'');
   line=line.replace(/\t+/g,' ');
   line=line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
   line=line.replace(" :",":");
   lines.push([line,ji]);

  }


  // macros
  var macros = {};
  loop1:
  for (var j=0; j<lines.length; j++) {

    //alert("j: "+j+", lines: "+lines);
    if(lines[j][0].toLowerCase()=="macro") {
      for(var ji=j+1;ji<lines.length; ji++) {
        if(lines[ji][0].toLowerCase()=="mend") {
          var macro = lines.splice(j,ji-j+1);
          var header = macro[1][0].split(" ");
          var name = header.splice(0,1);
          var args = header;
          var body = macro.splice(2,macro.length-3);
          macros[name] = {args:args, body:body}
          continue loop1;
        }
      }
      alert("Expected MEND");
      return -1;
    }
    var line = lines[j][0].split(" ");
    if(line==[""] || line=="" || line==null) {continue;}
    var maddr = "";
    if(line[0].slice(-1)==":") {maddr = line[0]; line = line.splice(1)}
    if(line[0] in macros) {
      // We've hit a macro!
      var name = line[0];
      var args = line.splice(1);
      var macro = macros[name];
      if(args.length != macro.args.length) {
        alert("ParseException on line "+": "+"\nCalling macro with wrong number of arguments.");
        return -1;
      }
      lines[j][0] = maddr;
      for(var ji = 0; ji<macro.body.length;ji++) {
        var ln = macro.body[ji][0];
        for(var arg = 0; arg<args.length; arg++) {
          ln = ln.replace(macro.args[arg]+" ",args[arg]+" ");
        }
        for(var arg = 0; arg<args.length; arg++) {
          ln = ln.replace(macro.args[arg],args[arg]);
        }
        lines.splice(j+1,0,[ln,macro.body[ji][1]]);
        j++;
      }
    }


  }


  // Loop through each line and pre-process it, resolving labels
  for (j = 0; j < lines.length; j++) {
     var ret = preprocessor(lines[j][0],lines[j][1]);
     if(ret==-1) {
       alert("ParseException on line "+lines[j][1]+": "+lines[j][0]+"\nGoing back! (Your code appears to be trying to assemble into memory that has already passed)");
       return -1;
     }
     if(ret!==0){
      mem_counter++;
    }
   }

   var copy = lines.length;
   var offset = 0;
   for(var j=0; j<copy; j++) {
     line = lines[j+offset][0];
     if(line==null) {continue;}
     var sp = line.match(/(?:[^\s"]+|"[^"]*")+/g)
     if(sp==null) {continue;}
     var block = 0;
     if(sp[0]=="block") {block=1}
     if(sp[1]=="block") {block=2}
     if(block>0) {
       if (sp[block].substring(0,2)=="#\"") {
         var oldoff=offset;
         while(sp[block].length>4) {
           last = sp[block].slice(3,4);
           //alert(JSON.stringify(sp[block]));
           sp[block]="#\""+sp[block][2]+sp[block].slice(4,sp[block].length);
           lines.splice(j+offset+1,0,["\t\tblock #'"+last+"'",j]);
           offset++;
         }
         current = "\t\tblock #'"+sp[block][2]+"'"
         if(block==2) {current = sp[0] + current; }
         lines[j+oldoff]=[current,j];
         lines.splice(j+offset+1,0,["halt",j]);
       }
     }
   }

  mem_counter=0;
  for (var j = 0; j < lines.length; j++) {
     var tmp = assemble(lines[j][0],lines[j][1]);
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
  //var words = line.match(/'[^"]*'|[^\s"]+/g);
  var words = line.match(/'[^]*'|[^\s]+/g);
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
      var ntoken = parseInt(token);
      if(ntoken<mem_counter) {
        return -1;
      }
      mem_counter=ntoken;
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
  if(words[0]=="block" && words[1][1]=="\""){
    mem_counter=mem_counter+(words[1].length-3);
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
      if(label_name.indexOf(token)>-1) {
        token = "0x"+label_address[label_name.indexOf(token)];
      }
      if(isNaN(token)) {
        alert("ParseException at line "+linenu+".\nUnrecognized symbol: "+token);
        return -1;
      }
      obj_token.value=two_comp(parseInt(token)%Math.pow(2,16));
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
    var words = line.match(/(?:[^\s']+|'[^']*')+/g);
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
