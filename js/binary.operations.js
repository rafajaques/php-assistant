/**
 * Modal functions
 */
function binaryAdd() {
  let file = dialog.showOpenDialog({
    title: i18n.__('Find PHP binary')
  });

  if (file && file[0]) {
    // Get path
    let path = file[0];

    // Get version
    // We cannot save data with dots with "configstore" package :(
    // Workaround = replace . with : (the "true" is for returning replaced)
    let version = binaryGetVersion(path, true);

    // Oops! Invalid PHP binary!
    if (!version) {
      dialog.showErrorBox(i18n.__('Error'), i18n.__('Invalid PHP binary'));
      return;
    }

    // Save new version to config
    conf.set('php.versions.' + version, path);

    // Is this our first?
    if (binaryGetCount() == 1) {
      // Please, set it as our new default
      binarySetNewDefault();
    }

    // Update list
    binaryUpdateList();
  }
}

function binaryRemove(version) {
  conf.del('php.versions.' + version)
  // Are you deleting your default version?
  if (conf.get('php.default') == version) {
    binarySetNewDefault();
  }
}

function binaryMakeDefault(version) {
  binarySetNewDefault(binaryConvertVersionToSave(version));
}

/* Converts binary string to a save-safe string */
function binaryConvertVersionToSave(version) {
  return version.replace(/\./g, ':');
}

/* Converts binary save-safe string to regular string */
function binaryConvertVersionToShow(version) {
  return version.replace(/\:/g, '.');
}

/**
 * @param {string} path - path to php binary
 * @param {string} replaced - replacing . with : (configstore workaround)
 */
function binaryGetVersion(path, replaced) {
  let response = runner.execSync(path + ' --version', {'encoding': 'utf8'});

  // Is this PHP?
  if (/^PHP/.test(response)) {
    // Get PHP version
    let result = response.match(/^PHP ([0-9\.]+)/);
    if (result && result[1]) {
      if (replaced)
        return binaryConvertVersionToSave(result[1]);
      else
        return result[1];
    }
    return false;
  }
}

/* Count of associated php binaries */
function binaryGetCount() {
  return Object.keys(conf.get('php.versions')).length;
}

/**
 * Commands from modal
 */

/**
 * Set default PHP version to run code
 * @param {string} version - version to set as default
 */
function makeDefaultVersion(version) {
  binaryMakeDefault(version);
  binaryUpdateList();
  php_path = conf.get('php.versions.' + conf.get('php.default'));
}

/**
 * Remove a PHP version from the listing
 * @param {string} version - version to remove
 */
function removeVersion(version) {
  let opt = dialog.showMessageBox({
    'type': 'question',
    'title': i18n.__('Are you sure?'),
    'message': i18n.__('Removing {{version}} version. Are you sure?', {'version': binaryConvertVersionToShow(version)}),
    'buttons': [i18n.__('Yes'), i18n.__('No')],
  });

  // Yes = 0; No = 1
  if (opt == 0) {
    binaryRemove(version);
    binaryUpdateList();
  }
}

function binarySetNewDefault(which) {
  if (which) {
    conf.set('php.default', which);
  } else if (binaryGetCount()) {
    // Set first option on the list as default (if we have any)
    let v_keys = Object.keys(conf.get('php.versions'));
    conf.set('php.default', v_keys[0]);
  } else {
    conf.del('php.default');
  }
  updatePhpPath();
}

function updatePhpPath() {
  // Change php_path letiable for runner
  php_path = conf.get('php.versions.' + conf.get('php.default'));

  // Change PHP version number shown in app
  $('#run-version').html(phpGetCurrVersion());
}

/**
 * Get current version
 */
function phpGetCurrVersion() {
  return binaryConvertVersionToShow(conf.get('php.default'));
}

/**
 * Binary list functions
 */
function binaryUpdateList() {
  $('#binary-list').empty();

  let versions = conf.get('php.versions');
  let in_use = conf.get('php.default');

  for (let v in versions) {
    $('#binary-list').append(binaryLineGetTemplate(v, versions[v], (in_use == v)));
  }
}

function binaryLineGetTemplate(version, path, in_use) {
  return [
    '<tr ' + (in_use ? 'class="info"' : '') + '>',
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
  ].join('\n');
}
