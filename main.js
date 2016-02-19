'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
const dialog = require('dialog');

const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name);
var php_path;

var mainWindow = null;

app.on('ready', function() {
  // Creates window
  mainWindow = new BrowserWindow({
      height: 600,
      width: 900,
      icon: __dirname + '/gfx/app-icon.png',
  });

  // Check if php_path is already known
  if (conf.get("php.path")) {
    // Yes! I know where PHP is!
    startApp();
  } else {
    // Nope! Go and find it!
    mainWindow.loadURL('file://' + __dirname + '/check.html');
  }
});

function startApp() {
  mainWindow.loadURL('file://' + __dirname + '/index.html');
}

// OS X Bug Fixer
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
