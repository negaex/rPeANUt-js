

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
