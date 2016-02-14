// PHP Exec
var execPhp = require('exec-php');
var fs = require('fs');
var php_path;

// PHP-exec cache bypass (temporary workaround)
var count = 0;
var tmp_file;

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
    tmp_file = "tmpcode"+(count++)
    fs.writeFileSync(tmp_file, code);
    runCode();
  });

  $("#clear").click(function(){
    editor.setValue("<?php\n");
  });
}

function runCode() {

  setStatus("Running...");

  execPhp(tmp_file, php_path, function(err, php, out)
  {
    if (err) {
      return console.log(err);
    }
    fs.unlink(tmp_file);
    setOutput(out);
    setStatus("Done.")
  });
}

function setOutput(text) {
  $("#console").html(text);
}

function setStatus(text) {
  $("#status").html(text);
}
