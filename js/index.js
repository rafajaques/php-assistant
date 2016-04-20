'use strict';

// Imports
var execPhp = require("exec-php");
var fs = require("fs");
var remote = require('electron').remote;
var Path = require("path")
var i18n = remote.getGlobal('i18n');
const shell = require("electron").shell;
const dialog = remote.dialog;

// Output mode
var mode = "raw";

// Config stuff
const Configstore = require("configstore");
const package_info = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(package_info.name);
const settings_default = {
  // php.path doesn't matter, because it's responsability of check.js
  "php.path": null,
  // Defaults
  "general.locale": "en",
  "general.mode": "both",
  "editor.font-size": "16",
  "editor.theme": "monokai",
  "editor.wordwrap": "true",
  "editor.highlight-line": "true"
}

// Editor
var php_path = conf.get("php.path");
var editor = ace.edit("editor");
editor.$blockScrolling = Infinity;
// Prevents ACE bindings
editor.keyBinding.setDefaultHandler(null);

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
  editor.setTheme("ace/theme/" + conf.get("editor.theme")); // This is not a path
  editor.setShowPrintMargin(false);
  editor.getSession().setMode("ace/mode/php");
  $("#editor").css("font-size", conf.get("editor.font-size") + "px");
  editor.setHighlightActiveLine($.parseJSON(conf.get("editor.highlight-line")));
  editor.getSession().setUseWrapMode($.parseJSON(conf.get("editor.wordwrap")));

  // Set translations
  if (refresh)
    i18n.setLocale(conf.get("general.locale")); // Set new locale
  translateInterface();

  // First run
  if (!refresh) {
    // Prepares the editor
    clear();

    // Links to open in OS default
    preventLinkDefault();

    // Set version on "about" modal
    $("#version").html(package_info.version);

    // Split pane behavior
    Split(['#editor', '#output'], {
        "sizes": [75, 25],
        "direction": "vertical",
        onDragEnd: function() {
          editor.resize();
        }
    });

    // Sidebar
    // "Run code" button click
    $("#sidebar-run").click(runCode); // Invoke runCode()

    // "Clear" button click
    $("#sidebar-clear").click(clear); // Invoke clear()

    // "Import from file" button click
    $("#sidebar-import").click(importFromFile); // Invoke importFromFile()

    // "Quit" butotn click
    $("#sidebar-quit").click(quit); // Invoke quit();

    // "Toggle mode" button click
    $("#toggle-mode").click(toggleMode); // Invoke toggleMode()

    // Settings modal
    // "Save" button click
    $("#settings-save").click(saveSettings) // Invoke saveSettings()

    // Shows the app
    $("body").css("visibility", "visible");
  }

  // Back to the editor...
  editor.focus();

}

/**
 * "Run the code" stuff
 */
// Sends code to PHP
function runCode() {
  setBusy(true);
  editor.focus();

  var code = editor.getValue();
  var tmp_file = Path.join(__dirname, "tmp", "tmpcode"+(count++));
  fs.writeFileSync(tmp_file, code);

  execPhp(tmp_file, php_path, function(err, php, out)
  {
    fs.unlink(tmp_file);
    if (err) {
      setBusy(false);
      setOutput("Debug: " + err);
      return dialog.showErrorBox(i18n.__("Error"), i18n.__("An error has occurred."));
    }
    setOutput(out);
    setBusy(false);
  });
}

// Toggle RAW and HTML modes
function toggleMode() {
  var btn = $("#toggle-mode");
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

  editor.focus();
}

function clear() {
  // 1 = Cursor at the end
  editor.setValue("<?php\n", 1);
}

function setOutput(text) {
  // Raw version
  $("#console").html($('<div/>').text(text).html());

  // HTML Version
  $("#console-html").html(text);

  editor.focus();
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

/**
 * Import from file stuff
 */

function importFromFile() {
  var file = dialog.showOpenDialog({
    "title": i18n.__("Import from file"),
    "filters": [{
      "name": 'PHP files',
      "extensions": ['php', 'phtml', 'tpl', 'ctp']
    }],
  });

  if (file) {
    fs.readFile(file[0], "utf8", importReady);
  }
}

function importReady(err, data) {
  if (err) {
    return dialog.showErrorBox(i18n.__("Error"), i18n.__("Could not import from file."));
  }

  // Set value and moves the cursor to the start
  editor.setValue(data, -1);
  editor.focus();
}

/**
 * Settings stuff
 */
// Reload config on modal open
$('#settings').on('show.bs.modal', function () {
  // Let's load the options!
  for (var s in settings_default) {
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
  for (var s in settings_default) {
    // Check if it's not null (to not change things that are not intended to be)
    if ( settings_default[s] && (!missing || !conf.get(s)) ) {
      conf.set(s, settings_default[s]);
    }
  }
}

/**
 * Quit
 */
function quit() {
  require("remote").app.quit();
}

/**
 * Prevent link default action
 */
function preventLinkDefault() {
  $("a").click(function(e){
    e.preventDefault();
    shell.openExternal($(this).attr("href"));
  });
}
