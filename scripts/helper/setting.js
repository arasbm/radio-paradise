define(['helper/async_storage'], function(storage) {
  console.log('defining setting module, storage helper is' + storage);

  // TODO: load stored setting object first,
  // if does not exist create one with default values
  var setting = {
    quality: 'high',
    prevent_lock: false,
    stream_type: 'ogg'
  };


  return setting;
});

