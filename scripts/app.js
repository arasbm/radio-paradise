define(['helper/setting', 'helper/gesture_detector'],
function(setting, gesture) {
  var audio = document.getElementById('audio');
  var btn = document.getElementById('play-btn');
  var btn_img = document.getElementById('play-btn-img');
  var body = document.getElementsByTagName('body')[0];
  var cover = document.getElementById('cover');
  var title_el = document.getElementById('song-title');
  var lock = window.navigator.requestWakeLock('screen');
  var left_canvas = document.getElementById('left-canvas');
  var right_canvas = document.getElementById('right-canvas');
  var left_cover = document.getElementById('left-cover');
  var right_cover = document.getElementById('right-cover');
  var bottom = document.getElementById('bottom-div');
  var low_q = document.getElementById('low');
  var medium_q = document.getElementById('medium');
  var high_q = document.getElementById('high');
  var play_start = document.getElementById('play-on-start');
  var last_pan_x = -1;
  var width, height;
  var next_song;
  var ogg_stream = {
    '32k': 'http://stream-dv1.radioparadise.com/ogg-192',
    '96k': 'http://stream-dv1.radioparadise.com/ogg-192',
    '192k': 'http://stream-dv1.radioparadise.com/ogg-192'
  };
  var state = 'stop';
  var setting_is_open = false;

  if (document.readyState == 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  function init() {
    setting.load(function() {
      get_current_songinfo();
      set_quality();
      play_start.checked = setting.get_play_on_start();
    });

    new GestureDetector(cover).startDetecting();
  }

  // Accepts 'low', 'medium', or 'high'
  // if no argument is provided, will set to default
  function set_quality(quality) {
    if (quality) {
      setting.set_quality(quality);
    }
    switch (setting.get_quality()) {
      case 'high':
        audio.src = ogg_stream['192k'];
        high_q.checked = true;
        break;
      case 'medium':
        audio.src = ogg_stream['96k'];
        medium_q.checked = true;
        break;
      case 'low':
        audio.src = ogg_stream['32k'];
        low_q.checked = true;
        break;
    }
  }

  btn.addEventListener('click', stop_play, false);
  audio.addEventListener('loadedmetadata', loaded_metadata, false);
  cover.addEventListener('pan', function(event) {
    event.stopPropagation();
    var position = event.detail.position;
    if (last_pan_x == -1) {
      last_pan_x = position.clientX;
    } else {
      var direction = (last_pan_x > width / 2) ?
          position.clientX - last_pan_x : last_pan_x - position.clientX;
      slide_setting_to(direction);
    }
  });

  cover.addEventListener('swipe', function(event) {
    var swipe_threshold = width / 10;
    var to_right = event.detail.direction === 'right';
    var distance = event.detail.dx;
    var on_left = event.detail.start.clientX < width / 2;

    if (Math.abs(distance) > swipe_threshold) {
      // if swipe was on left side and toward right OR if it was on right
      // side and toward left then close detail panel, otherwise open it
      if (on_left != to_right) {
        open_setting();
      } else {
        close_setting();
      }
    } else {
      // not enough force to change, go back to current state
      if (setting_is_open) {
        open_setting();
      } else {
        close_setting();
      }
    }

    event.stopPropagation();
    last_pan_x = -1;
  });

  low_q.addEventListener('click', function() {
    stop();
    set_quality('low');
    play();
  });

  medium_q.addEventListener('click', function() {
    stop();
    set_quality('medium');
    play();
  });

  high_q.addEventListener('click', function() {
    stop();
    set_quality('high');
    play();
  });

  play_start.addEventListener('click', function() {
    setting.set_play_on_start(play_start.checked);
  });

  window.addEventListener('resize', function() {
    update_info();
  }, false);

  function loaded_metadata() {
    if (setting.get_play_on_start()) {
      play();
    }
  }

  function play() {
    audio.play();
    state = 'playing';
    btn.classList.remove('stop');
    btn.classList.add('playing');
  }

  function stop() {
    audio.pause();
    state = 'stop';
    btn.classList.add('stop');
    btn.classList.remove('playing');
  }

  // toggle between play and stop state
  function stop_play() {
    (state == 'stop') ? play() : stop();
  }

  function get_current_songinfo() {
    var cache_killer = Math.floor(Math.random() * 10000);
    var playlist_url = 'http://www.radioparadise.com/ajax_rp2_playlist.php?' +
      cache_killer;
    var song_info = document.getElementById('song-info-holder');
    var crossxhr = new XMLHttpRequest({mozSystem: true});
    crossxhr.onload = function() {
      var infoArray = crossxhr.responseText.split('|');
      song_info.innerHTML = infoArray[1];
      next_song = setInterval(get_current_songinfo, infoArray[0]);
      update_info();
    };
    crossxhr.onerror = function() {
      console.log('Error getting current song info', crossxhr);
      nex_song = setInterval(get_current_singinfo, 200000);
    };
    crossxhr.open('GET', playlist_url);
    crossxhr.send();
    clearInterval(next_song);
  }

  function update_info() {
    var img_src = document.querySelector('img.cover_art').src;

    // The HTML response has a duplicate element id for title,
    // so this is a workaround to access title
    var title = document.querySelector('a > b').innerHTML;
    cover.classList.remove('playing');
    setTimeout(function() {

      //>cover_left.src = img;
      draw(img_src);
      cover.classList.add('playing');
    }, 1500);
    btn_img.src = img_src;
    title_el.innerHTML = title;
  }

  function draw(img_src) {
    width = cover.clientWidth;
    height = cover.clientHeight;
    draw_half(left_canvas, 'left');
    draw_half(right_canvas, 'right');
    function draw_half(canvas, side) {
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      var ctx = canvas.getContext('2d');
      var img = new Image();
      var clip_img = new Image();
      ctx.fillStyle = 'rgba(255,255,255,0.01)';

      ctx.beginPath();
      if (side == 'left') {
        ctx.moveTo(0, 0);
        // add one pixel to ensure there is no gap between the two canvas
        var center = (width / 2) + 1;
      } else {
        ctx.moveTo(width, 0);
        var center = (width / 2) - 1;
      }

      ctx.lineTo(width / 2, 0);

      // Draw a wavy pattern down the center
      var step = 40;
      var count = parseInt(height / step);
      for (var i = 0; i < count; i++) {
        ctx.lineTo(center, i * step);

        // alternate curve control point 20 pixels, every other time
        ctx.quadraticCurveTo((i % 2) ? center - 20 :
          center + 20, i * step + step * 0.5, center, (i + 1) * step);
      }
      ctx.lineTo(center, height);
      if (side == 'left') {
        ctx.lineTo(0, height);
        ctx.lineTo(0, 0);
      } else {
        ctx.lineTo(width, height);
        ctx.lineTo(width, 0);
      }

      ctx.closePath();
      ctx.fill();
      ctx.clip();

      img.onload = function() {
        var h = width * img.height / img.width;
        ctx.drawImage(img, 0, 0, width, h);
      };
      img.src = img_src;
    }
  }

  function open_setting() {
    cover.classList.add('open');
    bottom.classList.add('move-out');
    setting_is_open = true;
    left_cover.style.transform = 'translateX(-40%)';
    right_cover.style.transform = 'translateX(40%)';
  }

  function close_setting() {
    cover.classList.remove('open');
    bottom.classList.remove('move-out');
    setting_is_open = false;
    left_cover.style.transform = 'translateX(0)';
    right_cover.style.transform = 'translateX(0)';
  }

  function slide_setting_to(x) {
    var new_pos = left_cover.style.left - x;
    // user can move image up to 20px in the wrong direction
    if (new_pos < 20 && new_pos > -width && x < width / 2 - width * 0.05) {
      left_cover.style.transform = 'translateX(' + (-x) + 'px)';
      right_cover.style.transform = 'translateX(' + x + 'px)';
    }
  }
});
