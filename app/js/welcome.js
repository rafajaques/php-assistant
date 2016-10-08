/**
 * welcome.js
 * First time run check routines
 */
const app = require('electron').remote.app;
const Configstore = require('configstore');
const pkg = require('./package.json');
const fs = require('fs');
const runner = require('child_process');

const conf = new Configstore(pkg.name);

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

// Hide instructions div
$('#instructions,#choose-mode').hide();

/* Fills language options */
$.each(i18n.fullLocaleList, (i, v) => {
  $('#locales-list').append($('<option>').text(v).attr('value', i));
});

// Try to figure out user's language
$('#locales-list').val(app.getLocale() ? app.getLocale() : 'en');

/* Go button action */
$('#go').click(() => {
  i18n.setLocale($('#locales-list').val());
  $('#lang-select').hide();
  $('#instructions').show();
  $('#logo img').attr('width', '70');
  translateInterface();
});

/* Next step action */
$('#next-step').click(() => {
  $('#instructions').hide();
  $('#choose-mode').show();
});

/* Enable start button */
$('#radio-regular,#radio-tray').click(() => {
  $('#start-app').prop('disabled', false);
});

/* Checks automatically for php binaries in known paths */
function checkPhpPath(list) {
  // Try to find a binary in every known path
  list.every((path) => {
    binaryAdd(path);
    return true;
  });
  return true;
}

/* Let's get it started in here! :) */
$('#start-app').click(() => {
  // Saving configs
  // Mode (regular/tray)
  conf.set('general.mode', $('input[name=app-mode]:checked').val());

  // Locale
  conf.set('general.locale', $('#locales-list').val());

  // Check OS and searches for PHP binaries in known paths
  if (process.platform === 'win32') {
    conf.set('system.os', 'win');
    checkPhpPath(winPaths);
  } else if (process.platform === 'darwin') {
    conf.set('system.os', 'osx');
    checkPhpPath(unixPaths);
  } else {
    conf.set('system.os', 'linux');
    checkPhpPath(unixPaths);
  }

  // Set bundled PHP version as default
  conf.set('php.default', 'bundled');

  // Restarts the app to finish setup
  app.relaunch();
  app.exit(0);
});

/* Close button action */
$('#close-button button').click(() => {
  app.quit();
});
