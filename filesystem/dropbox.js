var client = new Dropbox.Client({key: "ay68winb8z8uuib"});

// Try to finish OAuth authorization.
client.authenticate({interactive: false}, function (error) {
    if (error) {
        alert('Authentication error: ' + error);
    }
});

$("#dropbox-login").show();
$(".dropbox-hide").hide();




var db_files=[];


var current_col = 0;
var current_row = 0;
var current_is_showing=0;

var files=localStorage.getItem("files");

if(files===null||files.length===0){
  files=["HelloWorld"];
  localStorage.setItem("files",files);
  localStorage.setItem("f-HelloWorld",";; Hello World\n\
\n\
\n\
0x100:\n\
\n\
\tload\t#string R0	; Start at first character\n\
loop: load\tR0 R1		; Load character into R1\n\
\tjumpz\tR1 end		; Check for end of string\n\
\tstore\tR1 0xFFF0	; Print character\n\
\tadd\tONE R0 R0	; Go to next character\n\
\tjump\tloop\n\
\n\
end:	halt\n\
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
  if(current_is_showing==2){
    db_save(current, editor.getValue());
  }
});


$("#save").click(function(e){
    e.preventDefault();
    db_save(current, editor.getValue());
});

function db_save(filename, content) {
  //localStorage.setItem("f-"+filename, content);
  db_cache[filename]=content;
  client.writeFile(filename, content, function(error, stat) {
  if (error) {
    return error;  // Something went wrong.
  }
  });
}

var db_cache = {};

function db_open_to_cache(filename) {
  client.readFile(filename, function(error, data) {
  if (error) {
    return error;
  }
  db_cache[filename]=data;
});
}

function db_open(filename) {
  client.readFile(filename, function(error, data) {
  if (error) {
    return error;
  }
  editor.setValue(data);
});
}

function db_list () {
  var i;
  $('#dropbox').empty();
  client.readdir("/", function(error, files) {
    db_files=files;
  if (error) {
    return error;  // Something went wrong.
  }
  for(i=0;i<files.length;i++){
    file=files[i];
    db_open_to_cache(file);
    $('#dropbox').append('<li class="files"><a href="#" onclick="db_open_file(\''+file+'\');return false;" class="files"><span class="icon file f-text">.rpe</span><div class="rightf"><span class="name">'+file+'</span> <span class="details"></span></li>');
  }
  $('#dropbox').append('<li class="files"><a href="#" onclick="db_new_file();return false;" class="files"><span class="icon file f-js">New</span><div class="rightf"><span class="name">New File</span> <span class="details"></span></div></a></li>');
  });
}

function db_open_file (name) {
  var pos=files.indexOf(name);
  current_col=pos%3;
  current_row=Math.floor(pos/3);
  current=name;
  show_editor(current_col,current_row,2);
  db_open(name);
}

function db_new_file () {

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
    if(db_files.indexOf(name)>-1){
      swal.showInputError("File already exists!");
			return false;
    }

    db_save(name,"0x0100: ");
    setTimeout(function(){db_list();},2000);

		swal("Nice!", 'New file created: ' + name, "success");

	});



}


if (client.isAuthenticated()) {
  $("#dropbox-login").hide();
  $(".dropbox-hide").show();
  setTimeout(function(){db_list();},0);
}
