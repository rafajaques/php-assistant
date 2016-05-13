/**
 * Translation stuff
 */

var i18n = require("electron").remote.getGlobal('i18n');

// I've researched a lot and this looked one of the best solutions.
// Any improvements will be very welcome!
function translateInterface() {
  $('*[data-string]').each(function(index) {
    $(this).html(i18n.__($(this).attr('data-string')));
  });
}
