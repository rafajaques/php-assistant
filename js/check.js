// Configuration check routine
const electron = require('electron');
const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name);
const dialog = electron.remote.dialog;
const fs = require('fs');
const runner = require('child_process');
let os;

var unixPaths = [
  '/usr/bin/php',
  '/usr/sbin/php',
  '/etc/php',
  '/usr/lib/php',
  '/usr/share/php'
];

var winPaths = [
  'C:\\php\\php.exe',
  'C:\\xampp\\php\\php.exe'
];

$(function() {
  // Buttons actions
  $('#browse').click(browse); // Invoke browse();
  $('#type').click(type); // Invoke type();
  $('#type-done').click(typeDone); // Invoke typeDone();
  $('#quit').click(function(){ require('remote').app.quit(); });

  // Startup routines

  // Translate interface
  translateInterface();

  // Check OS
  console.log('Detecting system... ');

  if (process.platform === 'win32') {
    os = 'win';
    console.log('Windows');
  }
  else if (process.platform === 'darwin') {
    os = 'osx';
    console.log('Mac OSX');
  }
  else {
    os = 'linux';
    console.log('Linux');
  }

  conf.set('system.os', os);

  // Searching for PHP binary
  console.log('Trying to find PHP binary... ');
  switch (os) {
    case 'osx':
    case 'linux':
      checkPhpPath(unixPaths, 0);
      break;
    case 'win':
      checkPhpPath(winPaths, 0);
      break;
  }
});

function checkPhpPath(list, index) {
  if (list[index] == null) {
    phpNotFound();
  } else {
    fs.exists(list[index], function(exists) {
      if (exists) {
        phpFound(list[index]);
      } else {
        checkPhpPath(list, ++index);
      }
    });
  }
}

function phpFound(path) {
  $('#output').toggleClass('alert-danger alert-success');
  console.log('Found! (' + path + ')');
  console.log('Storing data...');

  let ver = binaryGetVersion(path, true);
  conf.set('php.versions.' + ver, path);
  conf.set('php.default', ver);

  console.log('Done!');
  console.log('Starting app...');

  checkWrite(i18n.__('PHP binary found!') + ' ('+path+')<br>'+i18n.__('Starting app...'));
  // Wait for 2 seconds, just in the first run
  setTimeout('window.location = "index.html"', 2000);
}

function phpNotFound() {
  console.log('PHP Not found.');

  checkWrite(i18n.__('Could not find PHP binary!'));
  phpSearchOptions(true);
}

function checkWrite(text) {
    $('#output').html(text);
}

function browse() {
  var file = dialog.showOpenDialog({
    title: i18n.__('Find PHP binary')
  });

  if (file) {
    phpSearchOptions(false);
    phpFound(file);
  }
}

function type() {
  $('#type').css('display', 'none');
  $('#type-input').css('display', 'block');
  $('form').on('submit', function() { return false; }); // Prevents form default
  $('#path').focus();
}

function typeDone() {
  var tPath = $('#path').val();
  if (fs.lstatSync(tPath).isFile())
    phpFound(tPath);
  else
    $('#output').html(i18n.__('Oops! Invalid binary or the file doesn\'t exists.'));
}

function phpSearchOptions(show) {
  if (show)
    $('#find-or-quit').css('visibility', 'visible');
  else
    $('#find-or-quit').css('visibility', 'hidden');
}
