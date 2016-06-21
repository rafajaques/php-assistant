/* eslint prefer-arrow-callback: 0 */ /* needed for jquery */
// Startup routines of Presentation Output in Multi mode
$(function () {
  // Prepare layout
  $('#sidebar').hide();
  $('#presentation-sidebar').show();
  $('#content').addClass('full');

  // Hide "editor" stuff
  editor.setOptions({
    readOnly: true, // No editing
    highlightActiveLine: false, // No active line
    highlightGutterLine: false // No active line number
  });
  editor.renderer.$cursorLayer.element.style.opacity = 0; // No cursor
  // Is there any new theme?
  if (conf.get('presentation.theme') !== 'false') {
    editor.setTheme('ace/theme/' + conf.get('presentation.theme')); // This is not a path
  }
  $('#editor').css('font-size', conf.get('presentation.font-size') + 'px');
  $('#console,#console-html').css('font-size', conf.get('presentation.font-size') + 'px');
});

function receiveOutput() {
  const arg = electron.remote.getGlobal('output');
  editor.setValue(arg.code);
  if (arg.output) setOutput(arg.output);
}
