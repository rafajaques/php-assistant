
//runner.

/**
 * Modal functions
 */
function binaryAdd() {
  var file = dialog.showOpenDialog({
    "title": i18n.__("Find PHP binary")
  });

  if (file && file[0]) {
    // Get path
    var path = file[0];

    // Get version
    // We cannot save data with dots with "configstore" package :(
    // Workaround = replace . with : (the "true" is for returning replaced)
    var version = binaryGetVersion(path, true);

    // Oops! Invalid PHP binary!
    if (!version)
      dialog.showErrorBox(i18n.__("Error"), i18n.__("Invalid PHP binary"));

    // Save new version to config
    conf.set("php.versions." + version, path);

    // Update list
    binaryUpdateList();
  }
}

function binaryRemove() {

}

function binaryMakeDefault(version) {
  conf.set("php.default", binaryConvertVersionToSave(version));
}

function binaryConvertVersionToSave(version) {
  return version.replace(/\./g, ":");
}

function binaryConvertVersionToShow(version) {
  return version.replace(/\:/g, ".");
}

/**
 * replaced = replacing . with : (configstore workaround)
 */
function binaryGetVersion(path, replaced) {
  var response = runner.execSync(path + " --version", {"encoding": "utf8"});

  // Is this PHP?
  if (/^PHP/.test(response)) {
    // Get PHP version
    var result = response.match(/^PHP ([0-9\.]+)/);
    if (result && result[1]) {
      if (replaced)
        return binaryConvertVersionToSave(result[1]);
      else
        return result[1];
    }
    return false;
  }
}

/**
 * Binary list functions
 */
function binaryUpdateList() {
  $("#binary-list").empty();

  var versions = conf.get("php.versions");
  var inUse = conf.get("php.default");

  for (var v in versions) {
    $("#binary-list").append(binaryLineGetTemplate(v, versions[v], (inUse == v)));
  }
}

function binaryLineGetTemplate(version, path, inUse) {
  return [
    '<tr ' + (inUse ? 'class="info"' : '') + '>',
    '  <td>' + binaryConvertVersionToShow(version) + '</td>',
    '  <td>' + path + '</td>',
    '  <td class="text-right">',
    '    <div class="btn-group">',
    '      <button class="btn btn-default btn-xs" onclick="makeDefaultVersion(\'' + version + '\')">',
    '        <span class="glyphicon glyphicon-ok" aria-hidden="true"></span>',
    '      </button>',
    '      <button class="btn btn-default btn-xs" onclick="removeVersion(\'' + version + '\')">',
    '        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>',
    '      </button>',
    '    </div>',
    '  </td>',
    '</tr>'
  ].join("\n");
}

/**
 * Commands from modal
 */
function makeDefaultVersion(version) {
  binaryMakeDefault(version);
  binaryUpdateList();
  php_path = conf.get("php.versions." + conf.get("php.default"));
}

function removeVersion(version) {
  var opt = dialog.showMessageBox({
    "type": "question",
    "title": i18n.__("Are you sure?"),
    "message": i18n.__("Removing {{version}} version. Are you sure?", {"version": binaryConvertVersionToShow(version)}),
    "buttons": [i18n.__("Yes"), i18n.__("No")],
  });

  console.log(opt);
}
