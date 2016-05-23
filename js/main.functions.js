/**
 * main.functions.js
 * Functions to make main window work
 */

/* Prevents link default action */
function preventLinkDefault() {
  $('a').on('click', function (e) {
    e.preventDefault();
    const target = $(this).attr('href');

    // Open only if it's not a #ID
    if (target.indexOf('#') !== 0) {
      shell.openExternal(target);
    }
  });
}

/**
 * "Run the code" stuff
 */

/* Toggle RAW and HTML modes */
function toggleMode() {
  const btn = $('#toggle-mode');
  btn.toggleClass('btn-primary btn-success');
  if (mode === 'raw') {
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

/* Clears editor value */
function clear() {
  // 1 = Cursor at the end
  editor.setValue('<?php\n', 1);
}

/* Send text to output window */
function setOutput(text) {
  // Raw version
  $('#console').html($('<div/>').text(text).html());

  // HTML Version
  $('#console-html').html(text);

  // Send the text to detached output window (if sent by main window)
  if (isMainWindow) {
    ipc.send('output-channel', { code: editor.getValue(), output: text });
  }

  editor.focus();
}

function setBusy(set) {
  if (set) {
    $('#busy').css('visibility', 'visible');
  } else {
    $('#busy').css('visibility', 'hidden');
  }
}

// Sends code to PHP
function runCode() {
  // Is there any PHP for us to work with?
  if (!phpPath) {
    setOutput(
      i18n.__('Error') + ': ' +
      i18n.__('You don\'t have any PHP binary. Add one using the settings screen and try again.')
    );
    return;
  }

  setBusy(true);
  editor.focus();

  const code = editor.getValue();
  const tmpFile = Path.join(__dirname, 'tmp', 'tmpcode' + (count++));
  fs.writeFileSync(tmpFile, code);

  const runtimeOpts = ' -d"error_reporting=E_ALL" -d"display_errors=On" "';

  runner.exec(phpPath + runtimeOpts + tmpFile + '"', (err, phpResponse, stderr) => {
    fs.unlink(tmpFile);
    // User doesn't need to know where the file is
    setOutput(phpResponse.replace(' in ' + tmpFile, ''));
    setBusy(false);
  });
}

/**
 * Import from file stuff
 */
/* Called when file is imported */
function importReady(err, data) {
  if (err) {
    return dialog.showErrorBox(i18n.__('Error'), i18n.__('Could not import from file.'));
  }

  // Set value and moves the cursor to the start
  editor.setValue(data, -1);
  editor.focus();

  return true;
}

/* Triggered when clicking "Import from file" button */
function importFromFile() {
  const file = dialog.showOpenDialog({
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

/**
 * Change font size stuff
 */
function increaseFontSize() {
  let size = parseInt($('#editor').css('font-size'), 10);
  size += 2;
  $('#editor').css('font-size', size);

  let consSize = parseInt($('#console,#console-html').css('font-size'), 10);
  consSize += 2;
  $('#console,#console-html').css('font-size', consSize);
}

function decreaseFontSize() {
  let size = parseInt($('#editor').css('font-size'), 10);
  size -= 2;
  $('#editor').css('font-size', size);

  let consSize = parseInt($('#console,#console-html').css('font-size'), 10);
  consSize -= 2;
  $('#console,#console-html').css('font-size', consSize);
}
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
  if (refresh) {
    i18n.setLocale(conf.get('general.locale')); // Set new locale
  }

  // Translate interface, populate binaries path and start tooltips (presentation)
  if (isMainWindow) {
    translateInterface();
    binaryUpdateList();
    $('[data-tooltip="true"]').tooltip({
      container: 'body',
      delay: { show: 400 }
    });
  }

  // Populate language list
  $('#locales-list').empty();
  $.each(i18n.fullLocaleList, (i, v) => {
    $('#locales-list').append($('<option>').text(v).attr('value', i));
  });

  // First run
  if (!refresh) {
    // Prepares the editor
    clear();

    // Links to open in OS default
    preventLinkDefault();

    // Set version on "about" modal
    $('#version').html(packageInfo.version);

    // Split pane behavior
    /* eslint-disable new-cap */
    Split(['#editor', '#output'], {
      sizes: [75, 25],
      direction: 'vertical',
      onDragEnd: () => {
        editor.resize();
      }
    });
    /* eslint-enable new-cap */

    // Sidebar
    if (isMainWindow) {
      /* eslint-disable no-use-before-define */
      // "Run code" button click
      $('*[data-event="sidebar-run"]').click(runCode);

      // "Clear" button click
      $('*[data-event="sidebar-clear"]').click(clear);

      // "Import from file" button click
      $('*[data-event="sidebar-import"]').click(importFromFile);

      // "Quit" butotn click
      $('*[data-event="sidebar-quit"]').click(quit);

      // "Toggle mode" button click
      $('#toggle-mode').click(toggleMode);

      // Presentation mode
      $('*[data-event="sidebar-fullscreen"]').click(toggleFullscreen);
      $('*[data-event="sidebar-presentation"]').click(checkPresentation);
      $('*[data-event="sidebar-presentation-off"]').click(presentationSingle);

      // Presentation modal
      $('#presentation-single-button').click(presentationSingle);
      $('#presentation-multi-button').click(presentationMulti);

      // Settings modal
      // "Save" button click
      $('#settings-save').click(saveSettings);

      // Binary add
      $('#binary-add').click(binaryAdd);
      /* eslint-enable no-use-before-define */
    }

    // Shows the app
    $('body').css('visibility', 'visible');
  }

  // Back to the editor...
  editor.focus();
}

/**
 * Settings stuff
 */
/* Reload config on modal open */
$('#settings').on('show.bs.modal', () => {
  // Loads all keys from "default" to populate fields
  Object.keys(settingsDefault).forEach((key) => {
    $('*[data-settings="' + key + '"]').val(conf.get(key));
  });
});

/* Save settings to config file */
function saveSettings() {
  // Does not work with arrow functions :(
  $('*[data-settings]').each(function () {
    conf.set($(this).attr('data-settings'), $(this).val());
  });

  renderApp(true);
}

/**
 * @param {missing} boolean - set only missing options
 */
function setDefaultSettings(missing) {
  Object.keys(settingsDefault).forEach((key) => {
    // Check if it's not null (to not change things that are not intended to be)
    if (!missing || !conf.get(settingsDefault[key])) {
      conf.set(key, settingsDefault[key]);
    }
  });
}

/**
 * Full screen stuff
 */
/* Reverts current full screen mode */
function toggleFullscreen() {
  const currWin = remote.getCurrentWindow();
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
  which.forEach((cmd) => {
    editor.commands.commandKeyBinding[cmd] = null;
    editor.commands.commandKeyBinding[cmd.replace(/\+/g, '-')] = null;
  });
}
