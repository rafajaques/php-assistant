// PHP Exec
var execPhp = require('exec-php');
var fs = require('fs');

// Output mode
var mode = "raw";

// Config stuff
const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name)

var php_path;

// PHP-exec cache bypass (temporary workaround)
var count = 0;
var tmp_file;

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/php");

php_path = conf.get("php_path");
renderApp();

function renderApp() {
  // @TODO Do a "wait" screen
  $("body").css("visibility", "visible");

  // "Run code" button click
  $("#run").click(runCode); // Invoke runCode()

  // "Toggle mode" button click
  $("#toggle-mode").click(toggleMode); // Invoke toggleMode()

  // "Clear" button click
  $("#clear").click(clear); // Invoke clear()
}

function runCode() {
  code = editor.getValue();
  tmp_file = __dirname + "/tmpcode"+(count++)
  fs.writeFileSync(tmp_file, code);

  setStatus("Running...");

  execPhp(tmp_file, php_path, function(err, php, out)
  {
    if (err) {
      return console.log(err);
    }
    fs.unlink(tmp_file);
    setOutput(out);
    setStatus("Done.")
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

function setStatus(text) {
  $("#status-message").html(text);
}
