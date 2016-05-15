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

  presentationMode = "single";

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

  presentationMode = "multi";

  // Adjust screen elements
  multiLayout();

  detachOutput();
}

function checkPresentation() {
  if (presentationMode) {
    presentationEnd();
  } else {
    $('#presentation').modal('show');
  }
}

function presentationEnd() {
  if (presentationMode == "single")
    presentationSingle();
  else if (presentationMode == "multi")
    presentationMulti();
}

/**
 * Output manipulation
 */
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

  // Font size
  $("#editor,#console,#console-html").css("font-size", conf.get("presentation.font-size") + "px");
}

function singleLayoutOff() {
  $("#sidebar").show();
  $("#presentation-sidebar").hide();
  $("#content").removeClass("full");

  // Let's go back! :)
  goFullScreen(false);

  // Return default sizes
  $("#editor").css("font-size", conf.get("editor.font-size") + "px");
  $("#console,#console-html").css("font-size", "");
}

function multiLayout() {
  $("*[data-event='sidebar-presentation']").addClass("active");
}

function multiLayoutOff() {
  ipc.send("asynchronous-message", "attach-output");
  $("*[data-event='sidebar-presentation']").removeClass("active");
}
