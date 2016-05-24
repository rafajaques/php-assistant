/**
 * index.js
 * Startup routines at the end of the file
 */

// Imports
const electron = require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;
const shell = electron.shell;
const dialog = remote.dialog;
const fs = require('fs');
const Path = require('path');
const runner = require('child_process');

// Output mode
/* eslint-disable prefer-const */
let mode = 'raw';
/* eslint-enable prefer-const */

// Config stuff
const Configstore = require('configstore');
const packageInfo = require(Path.join(__dirname, 'package.json'));
const conf = new Configstore(packageInfo.name);
const settingsDefault = {
  // Defaults
  'general.locale': 'en',
  'general.mode': 'regular',
  'general.autorun': 'true',
  'editor.font-size': '16',
  'editor.theme': 'monokai',
  'editor.wordwrap': 'true',
  'editor.highlight-line': 'true',
  'presentation.font-size': '33',
  'presentation.try-secondary-display': 'true',
};

// Editor
let phpPath;
const editor = ace.edit('editor');
editor.$blockScrolling = Infinity;

// Cache bypass
/* eslint-disable prefer-const */
let count = 0;
/* eslint-enable prefer-const */

/* Startup routine */
$(() => {
  editorUnbind(['cmd+,', 'ctrl+t', 'ctrl+p']);

  if (isMainWindow) {
    updatePhpPath();
  }

  // Set missing settings to default
  setDefaultSettings(true);

  // Everything setup! Let's render the app!
  renderApp();
});
