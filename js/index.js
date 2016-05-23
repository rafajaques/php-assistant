'use strict';

// Imports
const electron = require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;
const shell = electron.shell;
const dialog = remote.dialog;
const fs = require('fs');
const Path = require('path');
const runner = require('child_process');

// Output mode
let mode = 'raw';

// Config stuff
const Configstore = require('configstore');
const package_info = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(package_info.name);
const settings_default = {
  // Defaults
  'general.locale': 'en',
  'general.mode': 'both',
  'general.autorun': 'true',
  'editor.font-size': '16',
  'editor.theme': 'monokai',
  'editor.wordwrap': 'true',
  'editor.highlight-line': 'true',
  'presentation.font-size': '33',
  'presentation.try-secondary-display': 'true',
}

// Editor
let php_path;
let editor = ace.edit('editor');
editor.$blockScrolling = Infinity;
editorUnbind(['cmd+,', 'ctrl+t', 'ctrl+p']);

if (isMainWindow)
  updatePhpPath();

// PHP-exec cache bypass (temporary workaround)
let count = 0;
let tmp_file;

// Set missing settings to default
settingsDefault(true);

// Everything setup! Let's render the app!
renderApp();

function renderApp(refresh) {
  // refresh = render only stuff modified by settings

  // Render editor
  editor.setTheme('ace/theme/' + conf.get('editor.theme')); // This is not a path
  editor.setShowPrintMargin(false);
  editor.getSession().setMode('ace/mode/php');
  $('#editor').css('font-size', conf.get('editor.font-size') + 'px');
  editor.setHighlightActiveLine($.parseJSON(conf.get('editor.highlight-line')));
  editor.getSession().setUseWrapMode($.parseJSON(conf.get('editor.wordwrap')));

  // Set translations
  if (refresh)
    i18n.setLocale(conf.get('general.locale')); // Set new locale

  // Translate interface, populate binaries path and start tooltips (presentation)
  if (isMainWindow) {
    translateInterface();
    binaryUpdateList();
    $('[data-tooltip="true"]').tooltip({
      'container': 'body',
      'delay': { show: 400 }
    });
  }

  // Populate language list
  $('#locales-list').empty();
  $.each(i18n.fullLocaleList, function(i, v) {
      $('#locales-list').append($('<option>').text(v).attr('value', i));
  });

  // First run
  if (!refresh) {
    // Prepares the editor
    clear();

    // Links to open in OS default
    preventLinkDefault();

    // Set version on "about" modal
    $('#version').html(package_info.version);

    // Split pane behavior
    Split(['#editor', '#output'], {
        sizes: [75, 25],
        direction: 'vertical',
        onDragEnd: function() {
          editor.resize();
        }
    });

    // Sidebar
    if (isMainWindow) {
      // "Run code" button click
      $('*[data-event="sidebar-run"]').click(runCode); // Invoke runCode()

      // "Clear" button click
      $('*[data-event="sidebar-clear"]').click(clear); // Invoke clear()

      // "Import from file" button click
      $('*[data-event="sidebar-import"]').click(importFromFile); // Invoke importFromFile()

      // "Quit" butotn click
      $('*[data-event="sidebar-quit"]').click(quit); // Invoke quit();

      // "Toggle mode" button click
      $('#toggle-mode').click(toggleMode); // Invoke toggleMode()

      // Presentation mode
      $('*[data-event="sidebar-fullscreen"]').click(toggleFullscreen); // Invoke quit();
      $('*[data-event="sidebar-presentation-off"]').click(presentationSingle); // Invoke quit();

      $('*[data-event="sidebar-presentation"]').click(checkPresentation); // Invoke checkPresentation();

      // Presentation modal
      $('#presentation-single-button').click(presentationSingle);
      $('#presentation-multi-button').click(presentationMulti);

      // Settings modal
      // "Save" button click
      $('#settings-save').click(saveSettings) // Invoke saveSettings()

      // Binary add
      $('#binary-add').click(binaryAdd); // Invoke binaryAdd()
    }

    // Shows the app
    $('body').css('visibility', 'visible');
  }

  // Back to the editor...
  editor.focus();

}

/**
 * "Run the code" stuff
 */
// Sends code to PHP
function runCode() {

  // Is there any PHP for us to work with?
  if (!php_path) {
    setOutput(i18n.__('Error') + ': ' + i18n.__("You don't have any PHP binary. Add one using the settings screen and try again."));
    return;
  }

  setBusy(true);
  editor.focus();

  let code = editor.getValue();
  let tmp_file = Path.join(__dirname, 'tmp', 'tmpcode'+(count++));
  fs.writeFileSync(tmp_file, code);

  runner.exec(php_path + ' -d"error_reporting=E_ALL" -d"display_errors=On" "' + tmp_file + '"', function(err, phpResponse, stderr) {
    fs.unlink(tmp_file);
    // User doesn't need to know where the file is
    setOutput(phpResponse.replace(' in ' + tmp_file, ''));
    setBusy(false);
  });
}

// Toggle RAW and HTML modes
function toggleMode() {
  let btn = $('#toggle-mode');
  btn.toggleClass('btn-primary btn-success');
  if (mode == 'raw') {
    btn.html(i18n.__('HTML mode'));
    mode = 'html';
    $('#console').css('display', 'none');
    $('#console-html').css('display', 'block');
  } else {
    btn.html(i18n.__('RAW mode'));
    mode = 'raw';
    $('#console').css('display', 'block');
    $('#console-html').css('display', 'none');
  }

  editor.focus();
}

function clear() {
  // 1 = Cursor at the end
  editor.setValue('<?php\n', 1);
}

function setOutput(text) {
  // Raw version
  $('#console').html($('<div/>').text(text).html());

  // HTML Version
  $('#console-html').html(text);

  // Send the text to detached output window (if sent by main window)
  if (isMainWindow)
    ipc.send('output-channel', { code: editor.getValue(), output: text });

  editor.focus();
}

function setBusy(set) {
  if (set) {
    $('#busy').css('visibility', 'visible');
  } else {
    $('#busy').css('visibility', 'hidden');
  }
}

/**
 * Import from file stuff
 */
function importFromFile() {
  let file = dialog.showOpenDialog({
    title: i18n.__('Import from file'),
    filters: [{
      name: 'PHP files',
      extensions: ['php', 'phtml', 'tpl', 'ctp']
    }],
  });

  if (file) {
    fs.readFile(file[0], 'utf8', importReady);
  }
}

function importReady(err, data) {
  if (err) {
    return dialog.showErrorBox(i18n.__('Error'), i18n.__('Could not import from file.'));
  }

  // Set value and moves the cursor to the start
  editor.setValue(data, -1);
  editor.focus();
}

/**
 * Change font size stuff
 */
function increaseFontSize() {
  let size = parseInt($('#editor').css('font-size'));
  size += 2;
  $('#editor').css('font-size', size);

  let consSize = parseInt($('#console,#console-html').css('font-size'));
  consSize += 2;
  $('#console,#console-html').css('font-size', consSize);
}

function decreaseFontSize() {
  let size = parseInt($('#editor').css('font-size'));
  size -= 2;
  $('#editor').css('font-size', size);

  let consSize = parseInt($('#console,#console-html').css('font-size'));
  consSize -= 2;
  $('#console,#console-html').css('font-size', consSize);
}

/**
 * Settings stuff
 */
/* Reload config on modal open */
$('#settings').on('show.bs.modal', function () {
  // Let's load the options!
  for (let s in settings_default) {
    $('*[data-settings="'+s+'"]').val(conf.get(s));
  }
});

/* Save settings to config file */
function saveSettings() {
  $('*[data-settings]').each(function() {
    conf.set($(this).attr('data-settings'), $(this).val());
  });

  renderApp(true);
}

/* Restore settings to default */
function settingsDefault(missing) {
  // missing = only missing options
  for (let s in settings_default) {
    // Check if it's not null (to not change things that are not intended to be)
    if (settings_default[s] && (!missing || !conf.get(s))) {
      conf.set(s, settings_default[s]);
    }
  }
}

/**
 * Full screen stuff
 */
/* Reverts current full screen mode */
function toggleFullscreen() {
  let currWin = remote.getCurrentWindow();
  currWin.setFullScreen(!currWin.isFullScreen());
}

/* Enter or exit full screen mode */
function goFullScreen(full) {
  remote.getCurrentWindow().setFullScreen(full);
}

/**
 * Quit stuff
 */
function quit() {
  ipc.send('asynchronous-message', 'force-quit');
}

/* Unbind shortcuts from editor */
function editorUnbind(which) {
  for (let x in which) {
    editor.commands.commandKeyBinding[which[x]] = null;
    editor.commands.commandKeyBinding[which[x].replace(/\+/g, '-')] = null;
  }
}

/* Prevents link default action */
function preventLinkDefault() {
  $('a').on('click', function(e) {
    e.preventDefault();
    let target = $(this).attr('href');

    // Open only if it's not a #ID
    if (target.indexOf('#') !== 0) {
      shell.openExternal(target);
    }
  });
}
