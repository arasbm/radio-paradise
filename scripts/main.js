require.config({
    baseUrl: 'scripts',
    shim: {
      'helper/async_storage': {
        exports: 'asyncStorage'
      },
      'helper/brick': {
        exports: 'brick'
      }
    }
});

requirejs(['app']);
