define(['helper/async_storage'], function(asyncStorage) {
  var setting = {
    values: {
      quality: 'high',
      play_on_start: false,
      prevent_lock: false,
      stream_type: 'ogg'
    },
    get_quality: function() {
      return setting.values.quality;
    },
    set_quality: function(q) {
      setting.values.quality = q;
      setting.save();
    },
    get_play_on_start: function() {
      return setting.values.play_on_start;
    },
    set_play_on_start: function(p) {
      setting.values.play_on_start = p;
      setting.save();
    },
    save: function() {
      asyncStorage.setItem('setting', setting.values);
    },
    load: function(callback) {
      asyncStorage.getItem('setting', function(values_obj) {
        if (values_obj) {
          setting.values = values_obj;
        } else {
          setting.save();
        }
        callback();
      });
    }
  };
  return setting;
});
