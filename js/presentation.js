var presentationMode = false;
$("#presentation-sidebar").hide();

// Single window mode
function presentationSingle() {

  $('#presentation').modal('hide');

  if (presentationMode) {
    singleLayoutOff();
    presentationMode = false;
    return;
  }

  presentationMode = true;

  // Adjust screen elements
  singleLayout();

}

function presentationMulti() {
  if (presentationMode) {
    multiLayoutOff();
    presentationMode = false;
    return;
  }
}

/**
 * Layout helpers
 */
function singleLayout() {
  $("#sidebar").hide();
  $("#presentation-sidebar").show();
  $("#content").addClass("full");

  // Let's go fullscreen! :)
  goFullScreen(true);
}

function singleLayoutOff() {
  $("#sidebar").show();
  $("#presentation-sidebar").hide();
  $("#content").removeClass("full");

  // Let's go back! :)
  goFullScreen(false);
}
