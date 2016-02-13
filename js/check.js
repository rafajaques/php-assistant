var fs = require('fs');

var unix_paths = ["/usr/bin/php", "/usr/sbin/php", "/etc/php", "/usr/lib/php", "/usr/share/php"]

$(function() {

  // Check OS
  checkWrite("Detecting system... ",0);
  var os;

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
      // @TODO Implement Windows
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
  checkWrite("Storing data...", 1);
  fs.writeFile("php_path", path, function(err) {
    if(err) {
        // Do something!
        return console.log(err);
    }
    checkWrite("Done!",1);
    checkWrite("Starting app...");
    // Wait for 1.5 second, just in the first run
    setTimeout('window.location = "index.html"', 1500);
  });
}

function phpNotFound() {
  // @TODO Implement
}

function checkWrite(text, br) {
  if (br)
    $("body").append(text + "<br>");
  else
    $("body").append(text);
}
