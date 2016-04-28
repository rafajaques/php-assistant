var presentationMode = false;
var outputDetached = false;

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

// Multi window mode
function presentationMulti() {

  $('#presentation').modal('hide');

  if (presentationMode) {
    multiLayoutOff();
    presentationMode = false;
    return;
  }

  presentationMode = true;

  // Adjust screen elements
  multiLayout();

  detachOutput();
}

/**
 * Output manipulation
 */
function attachOutput() {

}

function detachOutput() {
  ipc.send("asynchronous-message", "detach-output");
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

function multiLayout() {
  $("*[data-event='sidebar-presentation']").addClass("active");
}

function multiLayoutOff() {

}
