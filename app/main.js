/**
 * main.js
 */
// This will be fixed when porting functions to modules
/* eslint-disable no-use-before-define */

// Libraries
const electron = require('electron');
const Path = require('path');
const Configstore = require('configstore');

const { app, Tray, Menu, BrowserWindow } = electron;
const ipc = electron.ipcMain;
const dialog = electron.Dialog;

let screen;

// Check for debug option
const debug = /--debug/.test(process.argv[2]);

// Config stuff
const pkg = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(pkg.name);

// Icon, window and app name
const appName = 'PHP Assistant';
let appIcon;
let mainWindow;
let outputWindow;
let welcomeWindow;

// Translation
global.i18n = require('i18n');

const locales = {
  be: 'Беларускі',
  cs: 'Česky',
  da: 'Dansk',
  de: 'Deutsch',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  hi: 'हिन्दी',
  it: 'Italiano',
  id: 'Indonesia',
  nl: 'Nederlands',
  pl: 'Polski',
  'pt-BR': 'Português (Brasil)',
  ru: 'Русский',
  'sv-SE': 'Svenska (Sverige)',
  tr: 'Türkçe',
  uk: 'Українська'
  ms: 'Malay'
};

/**
 * Starting app
 */
app.on('ready', () => {
  // Update version in config file
  conf.set('version', pkg.version);

  // Wake up i18n!
  prepareLocalize();

  // First run?
  if (!(conf.get('general.locale'))) {
    welcome();
    return;
  }

  startupRoutine();
});

function welcome() {
  createWelcomeMenu();

  // Creates welcome window
  welcomeWindow = new BrowserWindow({
    title: appName,
    height: 620,
    width: 680,
    center: true,
    frame: false,
    resizable: false,
    icon: Path.join(__dirname, 'gfx', 'app-icon.png'),
    transparent: (process.platform !== 'win32' || systemPreferences.isAeroGlassEnabled())
  });

  welcomeWindow.loadURL('file://' + Path.join(__dirname, 'welcome.html'));
}

/* Prepares app to run */
function startupRoutine() {
  // Get screen (display) object
  screen = electron.screen;

  // Localize (set i18n stuff)
  localize();

  // Set menu
  createMenu();

  // Creates window
  mainWindow = new BrowserWindow({
    title: appName,
    height: 700,
    width: 900,
    center: true,
    titleBarStyle: 'hidden',
    icon: Path.join(__dirname, 'gfx', 'app-icon.png'),
    skipTaskbar: conf.get('general.mode') === 'tray',
  });

  // Open DevTools and maximize in debug mode
  if (debug) {
    mainWindow.openDevTools();
    mainWindow.maximize();
  }

  /* In case of closing main window */
  mainWindow.on('close', () => {
    app.quit();
  });

  startApp();
}

/* In case of all windows are closed */
app.on('window-all-closed', () => {
  app.quit();
});

function startApp() {
  // Loading main HTML
  mainWindow.loadURL('file://' + Path.join(__dirname, 'index.html'));

  // Checks app mode (regular, tray)
  const mode = conf.get('general.mode');

  if (mode === 'tray') {
    createTrayIcon();
    hideAppIcon();
  }
}

function createTrayIcon() {
  // Set tray icon
  let trayIcon = Path.join(__dirname, 'gfx');
  if (process.platform !== 'darwin') {
    trayIcon = Path.join(trayIcon, 'tray.png');
  } else {
    trayIcon = Path.join(trayIcon, 'tray-black.png');
  }

  appIcon = new Tray(trayIcon);

  appIcon.setToolTip(appName);
  appIcon.on('click', focusBehavior);
}

// Hides app from taskbar/dock
function hideAppIcon() {
  if (app.dock) app.dock.hide();
}

// Behavior when clicking tray icon
function focusBehavior() {
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  } else {
    mainWindow.hide();
  }
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
ipc.on('asynchronous-message', (evt, arg) => {
  // Signal to detach output window
  if (arg === 'detach-output') {
    const outputWindowInfo = {
      title: 'PHP Assistant: ' + i18n.__('Output'),
      height: 500,
      width: 1000,
      icon: Path.join(__dirname, 'gfx', 'app-icon.png'),
      skipTaskbar: true,
    };

    // Is there any external display?
    const externalBounds = getExternalDisplayBounds();
    if (externalBounds && conf.get('presentation.try-secondary-display') === 'true') {
      outputWindowInfo.x = externalBounds.x;
      outputWindowInfo.y = externalBounds.y;
    }

    outputWindow = new BrowserWindow(outputWindowInfo);

    outputWindow.loadURL('file://' + Path.join(__dirname, 'output.html'));

    if (externalBounds) {
      outputWindow.setFullScreen(true);
    }

    // We need to tell main window that output window was closed
    outputWindow.on('closed', () => {
      // Trying that on application exit means an error
      try {
        mainWindow.webContents.executeJavaScript('outputClosed();');
      } catch (e) {
        // None... It's just exiting application...
      }
    });

    // Debug
    if (debug) {
      outputWindow.toggleDevTools();
    }
  } else if (arg === 'attach-output') {
    // Signal to re-attach output window
    outputWindow.destroy();
  }
});

ipc.on('output-channel', (evt, arg) => {
  // Is there any output window?
  if (outputWindow) {
    // Best way to avoid problems with special characters
    global.output = arg;
    outputWindow.webContents.executeJavaScript('receiveOutput()');
  }
});

/**
 * Quitting app
 */
// Force quit behavior
ipc.on('asynchronous-message', (evt, arg) => {
  if (arg === 'force-quit') terminateApp();
});

// Forces the quit
function terminateApp() {
  app.quit();
}

/**
 * Localization
 */
function prepareLocalize() {
  i18n.configure({
    locales: Object.keys(locales),
    directory: Path.join(__dirname, 'locales'),
  });

  i18n.fullLocaleList = locales;
}
// Get translations
function localize() {
  if (!conf.get('general.locale')) {
    conf.set('general.locale', app.getLocale());
  }

  i18n.setLocale(conf.get('general.locale'));
}

/**
 * External display detection
 */
function getExternalDisplayBounds() {
  const displays = screen.getAllDisplays();
  let externalDisplay = false;

  displays.every((display) => {
    if (display.bounds.x !== 0 || display.bounds.y !== 0) {
      externalDisplay = display;
      return false; // We found it! No more searching;
    }
    return true; // Go on...
  });

  if (externalDisplay) {
    return {
      x: externalDisplay.bounds.x + 50,
      y: externalDisplay.bounds.y + 50,
    };
  }

  return false;
}

/**
 * Menu... A long, long menu...
 */

// Creates app menu
function createMenu() {
  const template = [
    {
      label: i18n.__('File'),
      submenu: [
        {
          label: i18n.__('Run code'),
          accelerator: 'CmdOrCtrl+Return',
          click: () => runOnApp('runCode()'),
        },
        {
          label: i18n.__('Clear'),
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => runOnApp('clear()'),
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__('Import from file'),
          accelerator: 'CmdOrCtrl+I',
          click: () => runOnApp('importFromFile()'),
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__('Toggle mode'),
          accelerator: 'CmdOrCtrl+T',
          click: () => runOnApp('toggleMode()'),
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
          click: () => runOnApp('increaseFontSize();'),
        },
        {
          label: i18n.__('Decrease font size'),
          accelerator: 'CmdOrCtrl+-',
          click: () => runOnApp('decreaseFontSize();'),
        },
        {
          label: i18n.__('Default font size'),
          accelerator: 'CmdOrCtrl+0',
          click: () => runOnApp('defaultFontSize();'),
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__('Toggle Full Screen'),
          accelerator: (() => {
            if (process.platform === 'darwin') {
              return 'Ctrl+Command+F';
            }

            return 'F11';
          })(),
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
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
        {
          label: i18n.__('Hide'),
          accelerator: 'CmdOrCtrl+H',
          role: 'hide',
          click: () => mainWindow.hide()
        },
      ]
    },
    {
      label: i18n.__('Help'),
      role: 'help',
      submenu: [
        {
          label: appName + ' ' + i18n.__('on GitHub'),
          click: () => electron.shell.openExternal('https://github.com/rafajaques/php-assistant'),
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__('Submit an issue'),
          click: () => electron.shell.openExternal('https://github.com/rafajaques/php-assistant/issues'),
        },
      ]
    },
  ];

  // OSX specific menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: appName,
      submenu: [
        {
          label: i18n.__('About') + ' ' + appName,
          click: () => runOnApp('$("#about").modal("toggle");'),
        },
        {
          type: 'separator'
        },
        {
          label: i18n.__('Preferences') + '...',
          accelerator: 'Cmd+,',
          click: () => runOnApp('$("#settings").modal("show");'),
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
          click: () => app.quit(),
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
  } else {
    // If this is not OSX, set missing menus somewhere else...
    template[0].submenu.push(
      {
        type: 'separator'
      },
      {
        label: i18n.__('Preferences'),
        accelerator: 'Ctrl+P',
        click: () => runOnApp('$("#settings").modal("show");'),
      },
      {
        type: 'separator'
      },
      {
        label: i18n.__('Quit'),
        accelerator: 'Ctrl+Q',
        click: () => app.quit(),
      }
    );

    template[4].submenu.push(
      {
        type: 'separator'
      },
      {
        label: i18n.__('About') + ' ' + appName,
        click: () => runOnApp('$("#about").modal("toggle");'),
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Creates app menu
function createWelcomeMenu() {
  const template = [
    {
      label: 'File',
      submenu: []
    },
  ];

  // OSX specific menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: appName,
      submenu: [
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide ' + appName,
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => app.quit(),
        },
      ]
    });
    // Window menu
    template[1].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        role: 'front'
      }
    );
  } else {
    // If this is not OSX, set missing menus somewhere else...
    template[0].submenu.push(
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'Ctrl+Q',
        click: () => app.quit(),
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
