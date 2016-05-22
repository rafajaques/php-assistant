'use strict';

// Libraries
const electron = require("electron");
const app = electron.app;
const Tray = electron.Tray;
const Menu = electron.Menu;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const dialog = electron.Dialog;
const Path = require("path");
let screen;

// Check for debug option
const debug = /--debug/.test(process.argv[2])

// Config stuff
const Configstore = require("configstore");
const pkg = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(pkg.name);

// Icon, window and app name
const appName = "PHP Assistant"
let appIcon;
let mainWindow;
let outputWindow;

// Translation
global.i18n = require("i18n");
let locales = {
  "da": "Danish",
  "de": "Deutsch",
  "en": "English",
  "fr": "Français",
  "pt-BR": "Português (Brasil)",
};

// Force quit variable (quitting  deppends on app mode)
var forceQuit = false;

/**
 * Starting app
 */
app.on('ready', function() {
  // Get screen (display) object
  screen = electron.screen;

  // Localize (prepares i18n)
  localize();

  // Set menu
  createMenu();

  // Creates window
  mainWindow = new BrowserWindow({
      "title": appName,
      "height": 700,
      "width": 900,
      "center": true,
      "icon": Path.join(__dirname, "gfx", "app-icon.png"),
      "skipTaskbar": conf.get("general.mode") == "tray" ? true : false
  });

  // Open DevTools and maximize in debug mode
  if (debug) {
    mainWindow.openDevTools();
    mainWindow.maximize();
  }

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
  if (conf.get("php.default")) {
    // Yes! I know where PHP is!
    startApp();
    console.log('Starting');
  } else {
    // Nope! Go and find it!
    runCheck();
    console.log('Checking');
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
 * Output window management
 */
ipc.on('asynchronous-message', function(event, arg) {

  // Signal to detach output window
  if (arg == "detach-output") {
    var outputWindowInfo = {
      "title": "PHP Assistant: " + i18n.__("Output"),
      "height": 500,
      "width": 1000,
      "icon": Path.join(__dirname, "gfx", "app-icon.png"),
      "skipTaskbar": true
    }

    // Is there any external display?
    var externalBounds = getExternalDisplayBounds();
    if (externalBounds && conf.get("presentation.try-secondary-display") == "true") {
      outputWindowInfo["x"] = externalBounds["x"];
      outputWindowInfo["y"] = externalBounds["y"];
    }

    outputWindow = new BrowserWindow(outputWindowInfo);

    outputWindow.loadURL('file://' + Path.join(__dirname, 'output.html'));

    if (externalBounds) {
      outputWindow.setFullScreen(true);
    }

    // We need to tell main window that output window was closed
    outputWindow.on('closed', function() {
      // Trying that on application exit means an error
      try {
        mainWindow.webContents.executeJavaScript('outputClosed();');
      } catch (e) {
        console.log("Exiting application");
      }
    });

    // Debug
    if (debug)
      outputWindow.toggleDevTools();
  }
  // Signal to re-attach output window
  else if (arg == "attach-output") {
    outputWindow.destroy();
  }
});
ipc.on('output-channel', function (event, arg) {
  // Is there any output window?
  if (outputWindow) {
    // Best way to avoid problems with special characters
    global.output = arg;
    outputWindow.webContents.executeJavaScript("receiveOutput()");
  }
});

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
      locales: Object.keys(locales),
      directory: Path.join(__dirname , "locales")
  });

  i18n.fullLocaleList = locales;

  i18n.setLocale(conf.get("general.locale"));
}

/**
 * External display detection
 */
function getExternalDisplayBounds() {
  var displays = screen.getAllDisplays();
  var externalDisplay = false;

  for (let i in displays) {
    if (displays[i].bounds.x !== 0 || displays[i].bounds.y !== 0) {
      externalDisplay = displays[i];
      break;
    }
  }

  if (externalDisplay) {
    return {
      x: externalDisplay.bounds.x + 50,
      y: externalDisplay.bounds.y + 50,
    };
  } else {
    return false;
  }
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
        label: i18n.__('Increase font size'),
        accelerator: 'CmdOrCtrl+=',
        click: function() { runOnApp("increaseFontSize();"); }
      },
      {
        label: i18n.__('Decrease font size'),
        accelerator: 'CmdOrCtrl+-',
        click: function() { runOnApp("decreaseFontSize();"); }
      },
      {
        type: 'separator'
      },
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
        click: function() { electron.shell.openExternal('https://github.com/rafajaques/php-assistant') }
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Submit an issue'),
        click: function() { electron.shell.openExternal('https://github.com/rafajaques/php-assistant/issues') }
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
