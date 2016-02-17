// Configuration check routine
var fs = require('fs');
const Configstore = require('configstore');
const pkg = require('./package.json');
const conf = new Configstore(pkg.name)
var os;

var unix_paths = [
  "/usr/bin/php",
  "/usr/sbin/php",
  "/etc/php",
  "/usr/lib/php",
  "/usr/share/php"
]

var win_paths = [
  "C:\\php\\php.exe",
  "C:\\xampp\\php\\php.exe"
]

var locale = window.navigator.userLanguage || window.navigator.language;

$(function() {

  // Save locale
  if (locale)
    conf.set("general.locale", locale);
  else
    conf.set("general.locale", "en");

  // Check OS
  checkWrite("Detecting system... ",0);

  if (process.platform == "win32") {
    os = "win";
    checkWrite("Windows",1);
  }
  else if (process.platform == 'darwin') {
    os = "osx";
    checkWrite("Mac OSX",1);
  }
  else {
    os = "linux";
    checkWrite("Linux",1);
  }

  // Searching for PHP binary
  checkWrite("Trying to find PHP binary... ",0);
  switch (os) {
    case "osx":
    case "linux":
      checkPhpPath(unix_paths, 0);
      break;
    case "win":
      checkPhpPath(win_paths, 0);
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
  checkWrite("Found! ("+path+")", 1);
  checkWrite("Storing data...", 0);
  conf.set("php.path", path);
  checkWrite("Done!",1);
  checkWrite("Starting app...");
  // Wait for 1.5 second, just in the first run
  setTimeout('window.location = "index.html"', 1500);
}

function phpNotFound() {
  // @TODO Implement instructions and possibility to search for PHP binary
  checkWrite("Not found. Install PHP and try again.");
}

function checkWrite(text, br) {
  if (br)
    $("body").append(text + "<br>");
  else
    $("body").append(text);
}
