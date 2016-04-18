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
      "height": 600,
      "width": 900,
      "icon": Path.join(__dirname, "gfx", "app-icon.png"),
      "skip-taskbar": conf.get("general.mode") == "tray" ? true : false
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
  // Loading main HTML
  mainWindow.loadURL("file://" + Path.join(__dirname, 'index.html'));

  // Checks app mode (regular, tray, both)
  var mode = conf.get("general.mode");
  if (!mode) mode = "both"

  switch (mode) {
    case "both":
      createTrayIcon();
      break;
    case "tray":
      createTrayIcon();
      hideAppIcon();
      break;
  }
}

function createTrayIcon() {
  // Set tray icon
  var trayIcon = Path.join(__dirname, "gfx");
  if (process.platform !== "darwin")
    trayIcon = Path.join(trayIcon, "tray.png");
  else
    trayIcon = Path.join(trayIcon, "tray-black.png");

  appIcon = new Tray(trayIcon);

  appIcon.setToolTip("PHP Assistant");
  appIcon.on("click", focusBehavior);
}

// Hides app from taskbar/dock
function hideAppIcon() {
  if (app.dock)
    app.dock.hide();
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
