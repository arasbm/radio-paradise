require.config({
    baseUrl: 'scripts',
    shim: {
      'helper/async_storage': {
        exports: 'asyncStorage'
      },
      'helper/gesture_detector': {
        exports: 'gesture'
      },
      'helper/setting': {
        exports: 'setting'
      },
      'helper/brick': {
        exports: 'brick'
      }
    }
});

requirejs(['app']);
