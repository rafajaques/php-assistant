const i18n = require('electron').remote.getGlobal('i18n');
const app = require('electron').remote.app;

// Hide instructions div
$('#instructions').hide();

/* Fills language options */
$.each(i18n.fullLocaleList, (i, v) => {
  $('#locales-list').append($('<option>').text(v).attr('value', i));
});

// Try to figure out user's language
$('#locales-list').val(app.getLocale());

/* Go button action */
$('#go').click(() => {
  i18n.setLocale($('#locales-list').val());
  $('#lang-select').hide();
  $('#instructions').show();
  $('#logo img').attr('width', '70');
});


/* Close button action */
$('#close-button button').click(() => {
  app.quit();
});
