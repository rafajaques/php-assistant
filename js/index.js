// PHP Exec
var execPhp = require('exec-php');
var fs = require('fs');

// Output mode
var mode = "raw";

// Config stuff
const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name)

var php_path = conf.get("php_path");
var editor = ace.edit("editor");

// PHP-exec cache bypass (temporary workaround)
var count = 0;
var tmp_file;

renderApp();

function renderApp() {
  // @TODO Do a "wait" screen

  // Render editor
  editor.setTheme("ace/theme/monokai");
  editor.setShowPrintMargin(false);
  editor.getSession().setMode("ace/mode/php");

  // Prepares the editor
  clear();

  // Split pane behavior
  Split(['#editor', '#output'], {
      sizes: [75, 25],
      direction: 'vertical',
      onDragEnd: function() {
        editor.resize();
      }
  });

  // "Run code" button click
  $("#sidebar-run").click(runCode); // Invoke runCode()

  // "Toggle mode" button click
  $("#toggle-mode").click(toggleMode); // Invoke toggleMode()

  // "Clear" button click
  $("#sidebar-clear").click(clear); // Invoke clear()

  // Shows the app
  $("body").css("visibility", "visible");
}

function runCode() {
  code = editor.getValue();
  tmp_file = __dirname + "/tmpcode"+(count++)
  fs.writeFileSync(tmp_file, code);

  setBusy(true);

  execPhp(tmp_file, php_path, function(err, php, out)
  {
    if (err) {
      return console.log(err);
    }
    fs.unlink(tmp_file);
    setOutput(out);
    setBusy(false);
  });
}

function toggleMode() {
  btn = $("#toggle-mode");
  btn.toggleClass("btn-primary btn-success");
  if (mode == "raw") {
    btn.html("HTML mode");
    mode = "html";
    $("#console").css("display", "none");
    $("#console-html").css("display", "block");
  } else {
    btn.html("RAW mode");
    mode = "raw";
    $("#console").css("display", "block");
    $("#console-html").css("display", "none");
  }
}

function clear() {
  editor.setValue("<?php\n");
}

function setOutput(text) {
  // Raw version
  $("#console").html($('<div/>').text(text).html());

  // HTML Version
  $("#console-html").html(text);
}

function setBusy(set) {
  if (set) {
    $("#busy").css("visibility", "visible");
  } else {
    $("#busy").css("visibility", "hidden");
  }
}
