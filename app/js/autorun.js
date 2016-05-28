// Auto run behavior
editor.getSession().on('changeAnnotation', () => {
  // No errors? More than "default" characters?
  if (!editor.getSession().getAnnotations().length
      && editor.getValue().length > 6
      && conf.get('general.autorun') === 'true') {
    runCode();
  }
});
