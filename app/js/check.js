/**
 * check.js
 * First time run check routines
 * Startup routines at the end of the file
 */
// Configuration check routine
const electron = require('electron');
const Configstore = require('configstore');
const fs = require('fs');
const runner = require('child_process');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name);
const remote = electron.remote;
const dialog = remote.dialog;
let os;

const unixPaths = [
  '/usr/sbin/php',
  '/etc/php',
  '/usr/lib/php',
  '/usr/bin/php',
  '/usr/local/bin/php',
  '/usr/share/php'
];

const winPaths = [
  'C:\\php\\php.exe',
  'C:\\xampp\\php\\php.exe'
];

/* Writes a message to the user */
function checkWrite(text) {
  $('#output').html(text);
}

/**
 * Shows options for the user to search a PHP binary
 * @param {boolean} show - Show or hide
 */
function phpSearchOptions(show) {
  if (show) {
    $('#find-or-quit').css('visibility', 'visible');
  } else {
    $('#find-or-quit').css('visibility', 'hidden');
  }
}

/* Leave check mode and go to app */
function startApp() {
  window.location = 'index.html';
}

/* Called when app has a PHP binary and is ready to start */
function phpFound() {
  $('#output').toggleClass('alert-danger alert-success');

  // Hide search options
  phpSearchOptions(false);

  // Prepares a default PHP binary
  binarySetNewDefault();

  // Binary found!
  checkWrite(i18n.__('PHP binary found!') + '<br>' + i18n.__('Starting app...'));

  // Wait for 2 seconds, just in the first run
  setTimeout(startApp, 2000);
}

/* Called when it was not possible to find a valid php binary automatically */
function phpNotFound() {
  checkWrite(i18n.__('Could not find PHP binary!'));
  phpSearchOptions(true);
}

/* Called when wrong path or invalid binary is given */
function phpWrong() {
  $('#output').html(i18n.__('Oops! Invalid binary or the file doesn\'t exists.'));
}

/* Checks automatically for php binaries in known paths */
function checkPhpPath(list) {
  let count = 0;

  // Try to find a binary in every known path
  list.every((path) => {
    if (binaryAdd(path)) {
      count++;
    }
    return true;
  });

  // No binaries found?
  if (!count) {
    phpNotFound();
    return false;
  }

  // Nice!
  phpFound();

  return true;
}

/* Browser for PHP binary */
function browse() {
  const file = dialog.showOpenDialog({
    title: i18n.__('Find PHP binary')
  });

  // Try to add this binary
  if (file && binaryAdd(file[0])) {
    phpSearchOptions(false);
    phpFound();
  } else {
    phpWrong();
  }
}

/* Allows the user to type binary path */
function type() {
  $('#type').css('display', 'none');
  $('#type-input').css('display', 'block');
  $('form').on('submit', () => false); // Prevents form default
  $('#path').focus();
}

/* Called when user has finished typing binary path */
function typeDone() {
  const path = $('#path').val();
  if (binaryAdd(path)) {
    $('#type-input').css('display', 'none');
    phpFound();
  } else {
    $('#type-input').css('display', 'block');
    phpWrong();
  }
}

/* Startup routines */
$(() => {
  // Buttons actions
  $('#browse').click(browse); // Invoke browse();
  $('#type').click(type); // Invoke type();
  $('#type-done').click(typeDone); // Invoke typeDone();
  $('#quit').click(() => remote.app.quit());

  // Startup routines

  // Translate interface
  translateInterface();

  // Check OS
  if (process.platform === 'win32') {
    os = 'win';
  } else if (process.platform === 'darwin') {
    os = 'osx';
  } else {
    os = 'linux';
  }

  conf.set('system.os', os);

  // Searching for PHP binary
  switch (os) {
    case 'osx':
    case 'linux':
      checkPhpPath(unixPaths);
      break;
    case 'win':
      checkPhpPath(winPaths);
      break;
    // Oops!
    default:
      break;
  }
});
