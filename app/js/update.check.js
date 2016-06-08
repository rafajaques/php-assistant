const request = require('request');

/**
 * Compares two versions numbers
 * @param {string} a - first version
 * @param {string} b - second version
 * @return {integer} (< 0) if (a < b)
 * Thanks to LeJared (http://stackoverflow.com/a/16187766/1592352)
 */
function compareVersions(a, b) {
  let i;
  let diff;
  const regExStrip0 = /(\.0+)+$/;
  const segmentsA = a.replace(regExStrip0, '').split('.');
  const segmentsB = b.replace(regExStrip0, '').split('.');
  const l = Math.min(segmentsA.length, segmentsB.length);

  for (i = 0; i < l; i++) {
    diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
    if (diff) return diff;
  }

  return segmentsA.length - segmentsB.length;
}

/* Check for new version */
function checkForUpdates() {
  // Turns on loading bar
  setSearchingUpdate(true);

  // Sends a request to github api
  request({
    url: 'https://api.github.com/repos/rafajaques/php-assistant/tags',
    json: true,
    headers: {
      'User-Agent': 'PHP-Assistant'
    }
  }, (error, response, body) => {
    // Turns off loading bar
    setSearchingUpdate(false);

    // Everything ok with our update?
    if (!error && response.statusCode === 200) {
      const currentVersion = packageInfo.version;
      let newestVersion = body[0].name;

      // Remove "v" from "v1.0.0"
      if (newestVersion.charAt(0) === 'v') {
        newestVersion = newestVersion.slice(1);
      }

      // Any result lower than 0 means new version available
      if (compareVersions(currentVersion, newestVersion) < 0) {
        $('#sidebar .update-available').css('visibility', 'visible');
        $('#version-current').html(currentVersion);
        $('#version-newest').html(newestVersion);
      }
    }
  });
}
