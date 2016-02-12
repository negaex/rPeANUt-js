
	var editor = CodeMirror.fromTextArea(document.getElementById("editor-m"), {
		lineNumbers: true,
		styleActiveLine: true,
		matchBrackets: true,
		theme: "eclipse",
		indentWithTabs: true,
		mode: {name: "gas", architecture: "rpeanut"},
		extraKeys: {
        "Ctrl-A": function(cm) {
            run_assembler(); //function called when 'ctrl+s' is used when instance is in focus
        },
				"Ctrl-S": function(cm) {
            call_step(); //function called when 'ctrl+s' is used when instance is in focus
        },
				"Ctrl-R": function(cm) {
            if(running){stop();}else{run(0);} //function called when 'ctrl+s' is used when instance is in focus
        },
				"Alt-A": function(cm) {
            run_assembler(); //function called when 'ctrl+s' is used when instance is in focus
        },
				"Alt-S": function(cm) {
            call_step(); //function called when 'ctrl+s' is used when instance is in focus
        },
				"Alt-R": function(cm) {
					if(running){stop();}else{run(0);} //function called when 'ctrl+s' is used when instance is in focus
        },
    }
	});

	$(document).ready(function(){editor.refresh(); show_regs();});

	$('#terminal_s').keypress(function(event) {
		terminal.status=terminal.status | 0b10;
		event.preventDefault();
		terminal.input.push(event.which);
		terminal.status=terminal.status | 0b01;
    machine.memory[0xFFF1]=terminal.status;

		// if interrupts are set, then interrupt
    if( machine.memory[0xFFF2] & 1 == 1){
      machine.interrupt_que = 1;
    }
		terminal.status=terminal.status ^ 0b10;
	});

	$('#terminal_s').keydown(function(event) {
			if(event.keyCode==8){
				event.preventDefault();
			}
    });

	document.onkeypress = function(e) {
	  e = e || window.event;
		if(e.keyCode==1){run_assembler();}
		if(e.keyCode==18){if(running){stop();}else{run(0);}}
		if(e.keyCode==19){call_step();}
	};

	$("#canvas").attr("width", "192px");
	$("#canvas").attr("height", "160px");


divH = divW = 0;
jQuery(document).ready(function(){
    divW = jQuery("#canvas").width();
});
function checkResize(){
    var w = jQuery("#canvas").width();
    if (w != divW) {
        /*what ever*/
      $("#terminal_s").css("width","calc( 100% - "+($("#canvas").width()+20)+"px )");
        divW = w;
    }
}
jQuery(window).resize(checkResize);
var timer = setInterval(checkResize, 2000);



	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	var imgData=context.createImageData(192,160);
  //context.imageSmoothingEnabled= false;
  //context.webkitImageSmoothingEnabled = context.imageSmoothingEnabled = context.mozImageSmoothingEnabled = context.oImageSmoothingEnabled = false;

	reset();



$(document).ready(function () {

  // OUTER-LAYOUT
  $('body').layout({
    center__paneSelector:	".outer-west"
    ,	east__paneSelector:		".outer-center"
    ,	east__size:				550
    , triggerEventsOnLoad: true
    ,	spacing_open:			10  // ALL panes
    ,	spacing_closed:			6 // ALL panes
    //,	north__spacing_open:	0
    //,	south__spacing_open:	0
    ,	north__size:			68


    // INNER-LAYOUT (child of middle-center-pane)
    ,	east__childOptions: {
      center__paneSelector:	".inner-east"
      ,	east__paneSelector:		".center"
      ,	east__size:				200
      ,	spacing_open:			20  // ALL panes
      ,	spacing_closed:			6  // ALL panes
      ,	south__size:			200
    }

  });


});




(function($) {
   $(document).ready(function() {
      setTimeout(function () {
         window.scrollTo(0, 0);
      }, 100);
   });
})(jQuery);


var scrollable = document.getElementById("scrollable");
new ScrollFix(scrollable);

var scrollabletwo = document.getElementsByClassName('CodeMirror-scroll');
new ScrollFix(scrollabletwo[0]);
