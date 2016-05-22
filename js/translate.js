/**
 * Translation stuff
 */

/* eslint no-unused-vars: 0 */

const i18n = require('electron').remote.getGlobal('i18n');

// I've researched a lot and this looked one of the best solutions.
// Any improvements will be very welcome!
function translateInterface() {
  $('*[data-string]').each(function () {
    $(this).html(i18n.__($(this).attr('data-string')));
  });

  // Translation of tooltips on sidebar
  $('[data-tooltip="true"]').each(function () {
    $(this).attr('title', i18n.__($(this).attr('title')));
  });
}
