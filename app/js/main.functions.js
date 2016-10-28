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
function toggleMode(switchMode) {
  if (switchMode === 'html') {
    // Swap classes
    $('.toggle-mode-html').addClass('btn-primary').removeClass('btn-dark');
    $('.toggle-mode-raw').addClass('btn-dark').removeClass('btn-primary');

    // Swap consoles
    $('#console').css('display', 'none');
    $('#console-html').css('display', 'block');
  } else {
    // Swap classes
    $('.toggle-mode-html').addClass('btn-dark').removeClass('btn-primary');
    $('.toggle-mode-raw').addClass('btn-primary').removeClass('btn-dark');

    // Swap consoles
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

/**
 * Send text to output window (generally PHP return)
 * @param {text} string - text to show
 */
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

/**
 * Toggle busy animation
 * @param {set} boolean - show or hide animation
 */
function setBusy(set) {
  if (set) {
    $('#code-running').css('visibility', 'visible');
  } else {
    $('#code-running').css('visibility', 'hidden');
  }
}

/**
 * Toggle searching for update animation
 * @param {set} boolean - show or hide animation
 */
function setSearchingUpdate(set) {
  if (set) {
    $('#progress-running').css('visibility', 'visible');
  } else {
    $('#progress-running').css('visibility', 'hidden');
  }
}

/* Gets the code from editor and run it */
function runCode() {
  // Is there any PHP for us to work with?
  if (!phpPath) {
    setOutput(
      i18n.__('Error') + ': ' +
      i18n.__('You don\'t have any PHP binary. Add one using the settings screen and try again.')
    );
    return;
  }

  // Start busy animation
  setBusy(true);
  editor.focus();

  // Get the code from editor
  let code = editor.getValue();

  // Create temporary file path
  const tmpFile = Path.join(tmpDir, dummyName);

  // In case of using another working path, then we simulate it!
  if (chdir) {
    // Simulate a filename in the working path
    const simulateFilename = Path.join(chdir, dummyName);

    // Simulate php path variables
    // @TODO may be replaced by chdir option in execFile
    let simulateEnv = 'chdir(\'' + chdir + '\'); ';
    simulateEnv += '$_SERVER["DOCUMENT_ROOT"] = \'' + chdir + '\'; ';
    simulateEnv += '$_SERVER["PHP_SELF"] = \'' + simulateFilename + '\'; ';
    simulateEnv += '$_SERVER["SCRIPT_NAME"] = \'' + simulateFilename + '\'; ';
    simulateEnv += '$_SERVER["SCRIPT_FILENAME"] = \'' + simulateFilename + '\'; ';

    // Inject variables at the first <?php occurence
    code = code.replace('<?php', '<?php ' + simulateEnv);
  }

  // Creates temporary file to run
  fs.writeFileSync(tmpFile, code);

  // Prepares PHP call
  // const commandToRun = Path.resolve(phpPath);
  const commandToRun = phpPath;

  // Activates error reporting
  const runtimeOpts = ['-d"error_reporting=E_ALL"', '-d"display_errors=On"', tmpFile];

  // Runs the code in shell
  runner.execFile(commandToRun, runtimeOpts, (err, phpResponse, stderr) => {
    fs.unlink(tmpFile);
    // User doesn't need to know where the file is
    setOutput(phpResponse.replace(new RegExp(' in ' + tmpFile, 'g'), ''));
    setBusy(false);
    // Prevent link default (if returned output has links)
    preventLinkDefault();
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

/**
 * Import file handler
 */
function importFile(file, charset = 'utf8') {
  if (!file) {
    dialog.showErrorBox(i18n.__('Error'), i18n.__('No file specified!'));
    return;
  }

  const extensions = ['php', 'phtml', 'tpl', 'ctp'];
  const fileparts = file.split('.');
  if (extensions.indexOf(fileparts[fileparts.length - 1]) < 0) {
    const msg = 'Drag & Drop file loading is only allowed for php files\n'
              + ' with one of the following extensions:\n'
              + ' .php, .phtml, .tpl, .ctp';
    dialog.showErrorBox(i18n.__('Error'), i18n.__(msg));
    return;
  }

  fs.readFile(file, charset, importReady);
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
    importFile(file[0]);
  }
}

/**
 * Change font size stuff
 */
/* Increase editor font size */
function increaseFontSize() {
  let size = parseInt($('#editor').css('font-size'), 10);
  size += 2;
  $('#editor').css('font-size', size);

  let consSize = parseInt($('#console,#console-html').css('font-size'), 10);
  consSize += 2;
  $('#console,#console-html').css('font-size', consSize);
}

/* Decrease editor font size */
function decreaseFontSize() {
  let size = parseInt($('#editor').css('font-size'), 10);
  size -= 2;
  $('#editor').css('font-size', size);

  let consSize = parseInt($('#console,#console-html').css('font-size'), 10);
  consSize -= 2;
  $('#console,#console-html').css('font-size', consSize);
}

/* Editor font size back to default */
function defaultFontSize() {
  const size = parseInt(conf.get('editor.font-size'), 10);
  $('#editor').css('font-size', size);
  $('#console,#console-html').css('font-size', 16); // Hardcoded for a while...
}

/* Insert themes into a list */
function populateThemes(where) {
  $(where).empty();
  $(where).append($('<option>').text(i18n.__('Don\'t change')).attr('value', 'false'));
  $.each(themesList, (i, v) => {
    $(where).append($('<option>').text(v).attr('value', i));
  });
}

/**
 * Configure app UI
 * @param {refresh} boolean - render only stuff modified by settings
 */
function renderApp(refresh) {
  // Handle drag/drop file import:
  document.ondragover = document.ondrop = (ev) => {
    ev.preventDefault();
  };
  document.body.ondrop = (ev) => {
    importFile(ev.dataTransfer.files[0].path);
    ev.preventDefault();
  };

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

    // OSX specific tuning
    if (conf.get('system.os') === 'osx') {
      // Padding sidebar buttons to not be under traffic lights
      $('#sidebar ul').css('margin-top', '22px');
    } else {
      // Remove draggable area to avoid bugs
      $('#draggable-area').remove(); // OSX only draggable area
    }
  }

  // Populate language list
  $('#locales-list').empty();
  $.each(i18n.fullLocaleList, (i, v) => {
    $('#locales-list').append($('<option>').text(v).attr('value', i));
  });

  // Populate themes
  populateThemes('#editor-theme');
  populateThemes('#presentation-theme');

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

      // "Toggle mode" button click
      $('.toggle-mode-raw').click(() => toggleMode('raw'));
      $('.toggle-mode-html').click(() => toggleMode('html'));

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
      $('#binary-add').click(binaryDialogAdd);

      // Check for updates
      $('#check-updates').click(checkForUpdates);
      /* eslint-enable no-use-before-define */
    }

    // Shows the app
    $('body').css('visibility', 'visible');
  }

  // Back to the editor...
  editor.focus();

  // Check automatically for updates
  if (isMainWindow && !refresh && conf.get('general.updates') === 'true') {
    checkForUpdates();
  }
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
 * Fill settings with default values
 * @param {missing} boolean - set only missing values
 */
function setDefaultSettings(missing) {
  Object.keys(settingsDefault).forEach((key) => {
    // Check if it's not null (to not change things that are not intended to be)
    if (!missing || !conf.get(key)) {
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
/* Send a signal to force quit */
function quit() {
  ipc.send('asynchronous-message', 'force-quit');
}

/**
 * Unbind shortcuts from editor
 * @param {which} array = list of commands to unbind (ace editor)
 */
function editorUnbind(which) {
  which.forEach((cmd) => {
    editor.commands.commandKeyBinding[cmd] = null;
    editor.commands.commandKeyBinding[cmd.replace(/\+/g, '-')] = null;
  });
}
