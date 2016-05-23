/**
 * presentation.js
 * Presentation mode routines
 */
let presentationMode = false;

$('#presentation-sidebar').hide();

/**
 * Layout helpers
 */

/* Signal to create another output window */
function detachOutput() {
  ipc.send('asynchronous-message', 'detach-output');
}

/* Prepares single layout presentation mode */
function singleLayout() {
  $('#sidebar').hide();
  $('#presentation-sidebar').show();
  $('#content').addClass('full');

  // Let's go fullscreen! :)
  goFullScreen(true);

  // Font size
  $('#editor,#console,#console-html').css('font-size', conf.get('presentation.font-size') + 'px');
}

/* Deactivate stuff needed in single layout presentation mode */
function singleLayoutOff() {
  $('#sidebar').show();
  $('#presentation-sidebar').hide();
  $('#content').removeClass('full');

  // Let's go back! :)
  goFullScreen(false);

  // Return default sizes
  $('#editor').css('font-size', conf.get('editor.font-size') + 'px');
  $('#console,#console-html').css('font-size', '');
}

/* Prepares multi layout presentation mode */
function multiLayout() {
  $('*[data-event="sidebar-presentation"]').addClass('active');
}

/* Deactivate stuff needed in single layout presentation mode */
function multiLayoutOff() {
  ipc.send('asynchronous-message', 'attach-output');
  $('*[data-event="sidebar-presentation"]').removeClass('active');
}

/* Starts single layout presentation mode */
function presentationSingle() {
  $('#presentation').modal('hide');

  if (presentationMode) {
    singleLayoutOff();
    presentationMode = false;
    return;
  }

  presentationMode = 'single';

  // Adjust screen elements
  singleLayout();
}

/* Starts multi layout presentation mode */
function presentationMulti() {
  $('#presentation').modal('hide');

  if (presentationMode) {
    multiLayoutOff();
    presentationMode = false;
    return;
  }

  presentationMode = 'multi';

  // Adjust screen elements
  multiLayout();

  detachOutput();
}

/* Stops any presentation mode */
function presentationEnd() {
  if (presentationMode === 'single') {
    presentationSingle();
  } else if (presentationMode === 'multi') {
    presentationMulti();
  }
}

/* Starts or stops presentation mode when clicking button */
function checkPresentation() {
  if (presentationMode) {
    presentationEnd();
  } else {
    $('#presentation').modal('show');
  }
}

/* Signal when output window is closed */
function outputClosed() {
  presentationEnd();
}
