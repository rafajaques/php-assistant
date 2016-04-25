'use strict';

// Libraries
var app = require("app");
var Tray = require("tray");
var Menu = require("menu");
var Path = require("path");
var BrowserWindow = require("browser-window");
var shortcuts = require("global-shortcut");
const ipc = require('electron').ipcMain;
const dialog = require("dialog");

// Config stuff
const Configstore = require('configstore');
const pkg = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(pkg.name);

// Icon, window and app name
const appName = "PHP Assistant"
var appIcon = null;
var mainWindow = null;

// Translation
global.i18n = require("i18n");

// Force quit variable (quitting  deppends on app mode)
var forceQuit = false;

/**
 * Starting app
 */
app.on('ready', function() {
  // Localize (prepares i18n)
  localize();

  // Set menu
  createMenu();

  // Creates window
  mainWindow = new BrowserWindow({
      "title": appName,
      "height": 600,
      "width": 900,
      "icon": Path.join(__dirname, "gfx", "app-icon.png"),
      "skipTaskbar": conf.get("general.mode") == "tray" ? true : false
  });

  // Close behavior
  mainWindow.on('close', function(e) {
    // Clicking "X" should quit application only in "regular" mode
    if (conf.get("general.mode") == "regular") {
      app.quit();
    } else {
      if (!forceQuit)
        e.preventDefault();
      this.hide();
    }
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

  appIcon.setToolTip(appName);
  appIcon.on("click", focusBehavior);
}

// Hides app from taskbar/dock
function hideAppIcon() {
  if (app.dock)
    app.dock.hide();
}

// Behavior when clicking tray icon
function focusBehavior() {
  if (!mainWindow.isFocused())
    mainWindow.show();
  else
    mainWindow.hide();
}

// Runs JS code on window main window
function runOnApp(func) {
  mainWindow.webContents.executeJavaScript(func);
}

// First run check
function runCheck() {
  mainWindow.loadURL('file://' + Path.join(__dirname, 'check.html'));
}

/**
 * Quitting app
 */
// Force quit behavior
ipc.on('asynchronous-message', function(event, arg) {
  if (arg == "force-quit")
    terminateApp();
});

// Forces the quit
function terminateApp() {
  forceQuit = true;
  app.quit();
}

/**
 * Localization
 */
// Get translations
function localize() {
  if (!conf.get("general.locale"))
    conf.set("general.locale", app.getLocale());

  i18n.configure({
      locales:["en", "pt-BR", "fr"],
      directory: Path.join(__dirname , "locales")
  });

  i18n.setLocale(conf.get("general.locale"));
}

/**
 * Menu... A long, long menu...
 */

// Creates app menu
function createMenu() {
  var template = [
  {
    label: i18n.__('Actions'),
    submenu: [
      {
        label: i18n.__('Run code'),
        accelerator: 'CmdOrCtrl+Return',
        click: function() { runOnApp('runCode()'); }
      },
      {
        label: i18n.__('Clear'),
        accelerator: 'CmdOrCtrl+Shift+C',
        click: function() { runOnApp('clear()'); }
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Import from file'),
        accelerator: 'CmdOrCtrl+I',
        click: function() { runOnApp('importFromFile()'); }
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Toggle mode'),
        accelerator: 'CmdOrCtrl+T',
        click: function() { runOnApp('toggleMode()'); }
      },
    ]
  },
  {
    label: i18n.__('Edit'),
    submenu: [
      {
        label: i18n.__('Undo'),
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo'
      },
      {
        label: i18n.__('Redo'),
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo'
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Cut'),
        accelerator: 'CmdOrCtrl+X',
        role: 'cut'
      },
      {
        label: i18n.__('Copy'),
        accelerator: 'CmdOrCtrl+C',
        role: 'copy'
      },
      {
        label: i18n.__('Paste'),
        accelerator: 'CmdOrCtrl+V',
        role: 'paste'
      },
      {
        label: i18n.__('Select All'),
        accelerator: 'CmdOrCtrl+A',
        role: 'selectall'
      },
    ]
  },
  {
    label: i18n.__('View'),
    submenu: [
      {
        label: i18n.__('Toggle Full Screen'),
        accelerator: (function() {
          if (process.platform == 'darwin')
            return 'Ctrl+Command+F';
          else
            return 'F11';
        })(),
        click: function(item, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        }
      },
    ]
  },
  {
    label: i18n.__('Window'),
    role: 'window',
    submenu: [
      {
        label: i18n.__('Minimize'),
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
      },
    ]
  },
  {
    label: i18n.__('Help'),
    role: 'help',
    submenu: [
      {
        label: appName + ' ' + i18n.__('on GitHub'),
        click: function() { require('electron').shell.openExternal('https://github.com/rafajaques/php-assistant') }
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Submit an issue'),
        click: function() { require('electron').shell.openExternal('https://github.com/rafajaques/php-assistant/issues') }
      },
    ]
  },
];

// OSX specific menu
if (process.platform == 'darwin') {
  template.unshift({
    label: appName,
    submenu: [
      {
        label: i18n.__('About') + ' ' + appName,
        click: function() { runOnApp("$('#about').modal('toggle');"); }
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Preferences') + '...',
        accelerator: 'Cmd+,',
        click: function() { runOnApp("$('#settings').modal('show');"); }
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Services'),
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Hide') + ' ' + appName,
        accelerator: 'Command+H',
        role: 'hide'
      },
      {
        label: i18n.__('Hide Others'),
        accelerator: 'Command+Alt+H',
        role: 'hideothers'
      },
      {
        label: i18n.__('Show All'),
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Quit'),
        accelerator: 'Command+Q',
        click: function() { app.quit(); }
      },
    ]
  });
  // Window menu.
  template[3].submenu.push(
    {
      type: 'separator'
    },
    {
      label: i18n.__('Bring All to Front'),
      role: 'front'
    }
  );
}

// If this is not OSX, set missing menus somewhere else...
else {
  template[0].submenu.push(
    {
      type: 'separator'
    },
    {
      label: i18n.__('Preferences'),
      accelerator: 'Ctrl+P',
      click: function() { runOnApp("$('#settings').modal('show');"); }
    },
    {
      type: 'separator'
    },
    {
      label: i18n.__('Quit'),
      accelerator: 'Ctrl+Q',
      click: function() { app.quit(); }
    }
  );

  template[4].submenu.push(
    {
      type: 'separator'
    },
    {
      label: i18n.__('About') + ' ' + appName,
      click: function() { runOnApp("$('#about').modal('toggle');"); }
    }
  );
}

var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
}
