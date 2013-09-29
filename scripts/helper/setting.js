define(function(require) {
  var storage = require('helper/async_storage');
  console.log('defining setting module, storage helper is' + storage);

  // TODO: load stored setting object first,
  // if does not exist create one with default values
  var setting = {
    quality: 'high',
    play_on_start: false,
    prevent_lock: false,
    stream_type: 'ogg'
  };


  return setting;
});

