'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');
var fs = require('fs');

var php_path;

var mainWindow = null;

app.on('ready', function() {
  // Creates window
  mainWindow = new BrowserWindow({
      height: 600,
      width: 800
  });

  // Check if php_path is already known
  fs.exists('php_path', function(exists) {
    if (exists) {
      // Yes! I know where PHP is!
      startApp();
    } else {
      // Nope! Go and find it!
      mainWindow.loadURL('file://' + __dirname + '/check.html');
    }
  });
});

function startApp() {
  // @TODO Tmp dir cleanup
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
