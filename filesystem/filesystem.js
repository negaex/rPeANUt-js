

var current_col = 0;
var current_row = 0;
var current_is_showing=0;

var files=localStorage.getItem("files");

if(files===null||files.length===0){
  files=["HelloWorld"];
  localStorage.setItem("files",files);
  localStorage.setItem("f-HelloWorld",";; Hello World \n\
\n\
\n\
0x100: \n\
\n\
\t\tload\t#string R0\t; Start at first character \n\
loop:\tload\tR0 R1\t\t; Load character into R1 \n\
\t\tjumpz\tR1 end\t\t; Check for end of string \n\
\t\tstore\tR1 0xFFF0\t; Print character \n\
\t\tadd\t\tONE R0 R0\t; Go to next character \n\
\t\tjump\tloop \n\
\n\
end:\thalt \n\
\n\
\n\
string: block #\"Hello World!\"");
}
else {files=files.split(",");}


var current=localStorage.getItem("current");
if(current===null||current.length===0){
  current="default";
  localStorage.setItem("current",current);
}


editor.on("change", function() {
  if(current_is_showing==1){
    fs_save(current, editor.getValue());
  }
});

function fs_save(filename, content) {
  localStorage.setItem("f-"+filename, content);
}

function fs_open(filename) {
  var cookieval = localStorage.getItem("f-"+filename);
  if(cookieval===null || cookieval.length===0){
    return "";
  }
  return cookieval;
}

function fs_list () {
  var i;
  $('#local').empty();
  for(i=0;i<files.length;i++){
    file=files[i];
    var filecontent = fs_open(file);
    if(filecontent==-1){
      files.splice(i,1);
      localStorage.setItem("files",files);
      i--;
      continue;
    }
    var length = filecontent.replace(/%[A-F\d]{2}/g, 'U').length
    $('#local').append('<li class="files" onclick="open_file(\''+file+'\');return false;"><a class="files"><span class="icon file f-text">.rpe</span><div class="rightf"><span class="name">'+file+'</span> <span class="details">'+length+'kB</span><a class="del" href="#" hidefocus="hidefocus" onclick="delete_file(\''+file+'\')"><i class="fa fa-times"></i></a></div></a></li>');
  }
  $('#local').append('<li class="files"><a href="#" onclick="new_file();return false;" class="files"><span class="icon file f-js">New</span><div class="rightf"><span class="name">New File</span> <span class="details"></span></div></a></li>');
}

$("#settings").click(function(e){
    e.preventDefault();
    hide_editor(current_col,current_row);
});

function hide_editor(col,row) {
  current_is_showing=false;
  //stop();
  $('#settings').hide();
  $('#save').hide();
  var ml=31*col+2*col;
  var mt=118*row+14*row;
  var mtp=row*2;
  $( "#editor" ).animate({
    width: "00px",
}, 500, function (){

$( "#editor" ).animate({
  opacity: "0"
}, 200, function(){$('#editor').hide();editor.setValue("");});

});
}

function show_editor(col,row,type) {

  current_is_showing=type;

  var ml=31*col+2*col;
  var mt=120*row;
  var mtp=2*row;

  editor.refresh();

  $('#editor').css({
    width: "0",
});

  $('#editor').show();
  $( "#editor" ).animate({
    opacity: "1"
}, 200, function (){

$( "#editor" ).animate({
  width: "100%",
}, 500, function() { $('#settings').show(); $('#save').show(); editor.refresh(); editor.focus();});

});
}

function open_file (name) {
  var pos=files.indexOf(name);
  current_col=pos%3;
  current_row=Math.floor(pos/3);
  current=name;
  editor.setValue(fs_open(name));
  show_editor(current_col,current_row,1);
}

function new_file () {

  swal({
		title: "New File",
		text: 'Enter file name:',
		type: 'input',
		showCancelButton: true,
		closeOnConfirm: false,
		animation: "slide-from-top"
	},
	function(name){
		if (name === false) return false;

		if (name==="" || name===null) {
			swal.showInputError("You need to write something!");
			return false;
		}
    if(files.indexOf(name)>-1){
      swal.showInputError("File already exists!");
			return false;
    }

    files.push(name);
    localStorage.setItem("files",files);
    fs_save(name,"0x0100: ");
    fs_list();

		swal("Nice!", 'New file created: ' + name, "success");

	});



}

function delete_file (name) {
  swal({
		title: "Are you sure?",
		text: "You will not be able to recover this file!",
		type: "warning",
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: 'Yes, delete it!',
		closeOnConfirm: false
	},
	function(){
    localStorage.setItem("f-"+name,"");
    files.splice(files.indexOf(name),1);
    localStorage.setItem("files",files);
    fs_list();
		swal("Deleted!", "Your file has been deleted!", "success");
	});

}

$('#editor').hide();
fs_list();
