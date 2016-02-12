// PHP Exec
var execPhp = require('exec-php');
var fs = require('fs');
var php_path;

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/php");

fs.readFile('php_path', 'utf8', function(err,path) {
  if (err) {
    // @TODO Implement
  } else {
    php_path = path;
    renderApp();
  }
});

function renderApp() {
  // @TODO Do a "wait" screen
  $("body").css("visibility", "visible");

  // "Run code" button click
  $("#run").click(function(){
    code = editor.getValue();
    fs.writeFile("tmp_code.php", code, function(err) {
      if(err) {
          // @TODO Do something!
          return console.log(err);
      }

      runCode();
    });
  });
}

function runCode() {
  execPhp("tmp_code.php", php_path, function(err, php, out)
  {
    if (err) {
      return console.log(err);
    }
alert(out);
    $("#console").html(out);
  });
}
