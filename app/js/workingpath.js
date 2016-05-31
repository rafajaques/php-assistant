/* Changes working path global */
function updateWorkingPath(which) {
  chdir = which;
}

/* Updates the text of working path shown in dialog */
function updateWorkingPathShown() {
  $('#workingpath-span').html(chdir || i18n.__('None'));
}

/* Change working path button */
$('#workingpath-change').click(() => {
  const newPath = dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!newPath) return;
  updateWorkingPath(newPath[0]);
  updateWorkingPathShown();
});

/* Reset working path button */
$('#workingpath-reset').click(() => {
  updateWorkingPath(false);
  updateWorkingPathShown();
});

$('#workingpath').on('show.bs.modal', () => {
  // Change working path shown
  updateWorkingPathShown();
});
