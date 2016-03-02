'use strict';

var app = require("app");
var BrowserWindow = require("browser-window");
var Tray = require("tray");
var Menu = require("menu");
var Path = require("path")
const dialog = require("dialog");

const Configstore = require('configstore');
const pkg = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(pkg.name);

var appIcon = null;

var mainWindow = null;

app.on('ready', function() {
  // Creates window
  mainWindow = new BrowserWindow({
      height: 600,
      width: 900,
      icon: Path.join(__dirname, 'gfx', 'app-icon.png'),
  });

  // Check if php_path is already known
  if (conf.get("php.path")) {
    // Yes! I know where PHP is!
    startApp();
  } else {
    // Nope! Go and find it!
    runCheck();
  }
});

function startApp() {
  mainWindow.loadURL('file://' + Path.join(__dirname, 'index.html'));

  // Set tray icon
  var trayIcon = Path.join(__dirname, 'gfx');
  if (process.platform !== 'darwin') {
    trayIcon = Path.join(trayIcon, 'tray.png');
  } else {
    trayIcon = Path.join(trayIcon, 'tray-black.png');
  }

  appIcon = new Tray(trayIcon);
  // var contextMenu = Menu.buildFromTemplate([
  //   {
  //     label: 'Show assistant'
  //   },
  //   { label: 'Quit',
  //     selector: 'terminate:',
  //   }
  // ]);
  appIcon.setToolTip('PHP Assistant');
  appIcon.on('click', focusBehavior);
}

function runCheck() {
  mainWindow.loadURL('file://' + Path.join(__dirname, 'check.html'));
}

function focusBehavior() {
  if (!mainWindow.isFocused())
    mainWindow.show();
  else
    mainWindow.hide();
}

// OS X Bug Fixer
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
