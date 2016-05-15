// Startup routines of Presentation Output in Multi mode
$(function(){
  // Prepare layout
  $("#sidebar").hide();
  $("#presentation-sidebar").show();
  $("#content").addClass("full");

  // Hide "editor" stuff
  editor.setOptions({
    readOnly: true, // No editing
    highlightActiveLine: false, // No active line
    highlightGutterLine: false // No active line number
  });
  editor.renderer.$cursorLayer.element.style.opacity=0; // No cursor
});

function receiveOutput() {
  var arg = require("electron").remote.getGlobal('output');

  editor.setValue(arg["code"]);
  setOutput(arg["output"]);
  //console.log(arg["output"]);
}
