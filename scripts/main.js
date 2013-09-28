require.config({
    baseUrl: 'scripts',
    shim: {
      'helper/async_storage': {
        exports: 'asyncStorage'
      },
      'helper/brick-1.0beta8.byob.min': {
        exports: 'brick'
      }
    }
});

requirejs(['app']);
