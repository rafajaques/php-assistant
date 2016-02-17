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
const settings_default = {
  // php.path doesn't matter, because it's responsability of check.js
  "php.path": null,
  // Defaults
  "general.locale": "en",
  "editor.font-size": "16",
  "editor.theme": "monokai"
}

// Editor
var php_path = conf.get("php.path");
var editor = ace.edit("editor");

// PHP-exec cache bypass (temporary workaround)
var count = 0;
var tmp_file;

// Set missing settings to default
settingsDefault(true);

// Everything setup! Let's render the app!
renderApp();

//** @TODO Probably a good idea to move the functions to another file **//

function renderApp(refresh) {
  // refresh = render only stuff modified by settings
  // @TODO Do a "wait" screen with a progress bar or something

  // Render editor
  editor.setTheme("ace/theme/" + conf.get("editor.theme"));
  editor.setShowPrintMargin(false);
  editor.getSession().setMode("ace/mode/php");
  $("#editor").css("font-size", conf.get("editor.font-size") + "px");

  // Localization (i18n) - Prepare to translate
  localize();

  // Set translations
  translateInterface();

  // First run
  if (!refresh) {
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

    // Sidebar
    // "Run code" button click
    $("#sidebar-run").click(runCode); // Invoke runCode()

    // "Toggle mode" button click
    $("#toggle-mode").click(toggleMode); // Invoke toggleMode()

    // "Clear" button click
    $("#sidebar-clear").click(clear); // Invoke clear()

    // Settings modal
    // "Save" button click
    $("#settings-save").click(saveSettings) // Invoke saveSettings()

    // Shows the app
    $("body").css("visibility", "visible");
  }

}

/**
 * "Run the code" stuff
 */
// Sends code to PHP
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

// Toggle RAW and HTML modes
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

/**
 * Translation stuff
 */
// I've researched a lot and this looked one of the best solutions.
// Any improvements will be very welcome!
function translateInterface() {
  $('*[data-string]').each(function(index) {
    $(this).html(i18n.__($(this).attr('data-string')));
  });
}

// Get translations
function localize() {
  if (!conf.get("general.locale"))
    conf.set("general.locale", window.navigator.userLanguage || window.navigator.language)

  i18n.configure({
      locales:["en", "pt-BR", "fr"],
      directory: __dirname + "/locales"
  });

  i18n.setLocale(conf.get("general.locale"));
}

/**
 * Settings stuff
 */
// Reload config on modal open
$('#settings').on('show.bs.modal', function () {
  // Let's load the options!
  for (s in settings_default) {
    $("*[data-settings='"+s+"']").val(conf.get(s));
  }
});

// Save settings to config file
function saveSettings() {
  $('*[data-settings]').each(function() {
    conf.set($(this).attr("data-settings"), $(this).val());
  });

  renderApp(true);
}

// Restore settings to default
function settingsDefault(missing) {
  // missing = only missing options
  for (s in settings_default) {
    // Check if it's not null (to not change things that are not intended to be)
    if ( settings_default[s] && (!missing || !conf.get(s)) ) {
      conf.set(s, settings_default[s]);
    }
  }
}
