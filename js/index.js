// Imports
var execPhp = require("exec-php");
var fs = require("fs");
var express = require("express")
var i18n = require("i18n");

// Output mode
var mode = "raw";

// Config stuff
const Configstore = require("configstore");
const pkg = require("./package.json");
const conf = new Configstore(pkg.name)

// Editor
var php_path = conf.get("php_path");
var editor = ace.edit("editor");

// PHP-exec cache bypass (temporary workaround)
var count = 0;
var tmp_file;

// Localization (i18n)
localize();

// Everything setup! Let's render the app!
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

  // Set translations
  translateInterface();

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
    btn.html(i18n.__("HTML mode"));
    mode = "html";
    $("#console").css("display", "none");
    $("#console-html").css("display", "block");
  } else {
    btn.html(i18n.__("RAW mode"));
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

// I've researched a lot and this looked one of the best solutions.
// Any improvements will be very welcome!
function translateInterface() {
  $('*[data-string]').each(function(index) {
    $(this).html(i18n.__($(this).attr('data-string')));
  });
}

function localize() {
  if (!conf.get("locale"))
    conf.set("locale", window.navigator.userLanguage || window.navigator.language)

  i18n.configure({
      locales:["en", "pt-BR", "fr"],
      directory: __dirname + "/locales"
  });

  i18n.setLocale(conf.get("locale"));
}
