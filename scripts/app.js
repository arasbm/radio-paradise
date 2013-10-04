define(['helper/setting', 'helper/gesture_detector'],
function(setting, gesture) {
  var audio, btn, btn_img, body, cover, title_el, lock, left_canvas,
    right_canvas, left_cover, right_cover, bottom, low_q, medium_q,
    high_q, play_start;

  var last_pan_x = -1;
  var width, height;
  var img_src, title;
  var next_song;
  var initialized = false;

  var high_stream = [
    'http://stream-tx2.radioparadise.com/ogg-192',
    'http://stream-tx3.radioparadise.com/ogg-192',
    'http://stream-tx4.radioparadise.com/ogg-192',
    'http://stream-tx1.radioparadise.com:80/mp3-192',
    'http://stream-tx4.radioparadise.com:80/mp3-192',
    'http://stream-tx1.radioparadise.com:80/aac-128',
    'http://stream-uk1.radioparadise.com:80/aac-128',
    'http://scfire-m26.websys.aol.com:80/radio_paradise_mp3_128kbps',
    'http://scfire-d15.websys.aol.com:80/radio_paradise_mp3_128kbps',
    'http://scfire-n15.websys.aol.com:80/radio_paradise_mp3_128kbps',
    'http://scfire-a78.websys.aol.com:80/radio_paradise_mp3_128kbps',
    'http://scfire-a32.websys.aol.com:80/radio_paradise_mp3_128kbps'
  ];
  var high_index = 0;

  var medium_stream = [
    'http://stream-tx1.radioparadise.com/ogg-96',
    'http://stream-tx2.radioparadise.com/ogg-96',
    'http://stream-tx3.radioparadise.com/ogg-96',
    'http://stream-tx4.radioparadise.com/ogg-96',
    'http://stream-sd.radioparadise.com/rp_96m.ogg',
    'http://scstr06.egslb.aol.com:8000/radio_paradise_mp3_64kbps'
  ];
  var medium_index = 0;

  var low_stream = [
    'http://stream-tx1.radioparadise.com:80/mp3-32',
    'http://stream-tx4.radioparadise.com:80/mp3-32',
    'http://stream-sd.radioparadise.com:80/mp3-32',
    'http://stream-tx1.radioparadise.com/ogg-32',
    'http://stream-tx2.radioparadise.com/ogg-32',
    'http://stream-tx3.radioparadise.com/ogg-32',
    'http://stream-tx4.radioparadise.com/ogg-32'
  ];
  var low_index = 0;

  var state = 'stop';
  var setting_is_open = false;
  var can_play = false;

  if (document.readyState == 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
  // XXX -- sometime the above does not work
  // if things did not start after 3 seconds give another push
  setTimeout(function() {
    console.log('DOM state is ', document.readyState);
    if (!initialized) init();
  }, 1000);

  function init() {
    audio = new Audio();
    //audio.preload = true;
    //audio.mozaudiochannel = 'content';
    audio.mozAudioChannelType = 'content';
    console.log('RP§ Can I play OGG? ', audio.canPlayType('audio/ogg'));
    console.log('RP§ Can I play mp3? ', audio.canPlayType('audio/mp3'));

    btn = document.getElementById('play-btn');
    btn_img = document.getElementById('play-btn-img');
    body = document.getElementsByTagName('body')[0];
    cover = document.getElementById('cover');
    title_el = document.getElementById('song-title');
    lock = window.navigator.requestWakeLock('screen');
    left_canvas = document.getElementById('left-canvas');
    right_canvas = document.getElementById('right-canvas');
    left_cover = document.getElementById('left-cover');
    right_cover = document.getElementById('right-cover');
    bottom = document.getElementById('bottom-div');
    low_q = document.getElementById('low');
    medium_q = document.getElementById('medium');
    high_q = document.getElementById('high');
    play_start = document.getElementById('play-on-start');

    setting.load(start);

    new GestureDetector(cover).startDetecting();
    setup_event_listeners();
    initialized = true;
  }

  function start() {
    play_start.checked = setting.get_play_on_start();
    set_quality('default');
    if (setting.get_play_on_start()) {
      play();
    }
    get_current_songinfo();
  }

  // Accepts 'default', 'low', 'medium', or 'high'
  function set_quality(quality) {
    can_play = false;
    show_loading();

    if (quality != 'default') {
      setting.set_quality(quality);
    }
    switch (setting.get_quality()) {
      case 'high':
        audio.src = high_stream[high_index];
        high_q.checked = true;
        break;
      case 'medium':
        audio.src = medium_stream[medium_index];
        medium_q.checked = true;
        break;
      case 'low':
        audio.src = low_stream[low_index];
        low_q.checked = true;
        break;
    }
  }

  function setup_event_listeners() {
    btn.addEventListener('click', stop_play);

    audio.addEventListener('canplay', function() {
      if (!can_play) {
        can_play = true;
        show_btn_img();
      }
    });

    audio.addEventListener('loadedmetadata', function() {
      if (!can_play) {
        can_play = true;
        show_btn_img();
      }
    });

    audio.addEventListener('error', function() {
      console.log('RP: this stream caused an error: ', audio.src);
      switch (setting.get_quality()) {
        case 'low':
          low_index = (low_index + 1) % low_stream.length;
          set_quality('low');
          break;
        case 'medium':
          medium_index = (medium_index + 1) % medium_stream.length;
          set_quality('medium');
          break;
        case 'high':
          high_index = (high_index + 1) % high_stream.length;
          set_quality('high');
          break;
      }
      play();
    });

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
      set_quality('low');
      play();
    });

    medium_q.addEventListener('click', function() {
      set_quality('medium');
      play();
    });

    high_q.addEventListener('click', function() {
      set_quality('high');
      play();
    });

    play_start.addEventListener('click', function() {
      setting.set_play_on_start(play_start.checked);
    });

    window.addEventListener('resize', function() {
      update_info();
    }, false);
  }

  function play() {
    console.log('RP: attempted to play()', audio.src);

    audio.play();
    state = 'playing';
    btn.classList.remove('stop');
    btn.classList.add('playing');
  }

  function stop() {
    console.log('RP§ attempted stop()', audio.src);
    audio.pause();
    //audio.currentTime = 0;
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
      console.log('Radio Paradise: Error getting current song info', crossxhr);
      next_song = setInterval(get_current_singinfo, 20000);
    };
    crossxhr.open('GET', playlist_url);
    crossxhr.send();
    clearInterval(next_song);
  }

  function show_loading() {
    btn_img.src = 'img/loading.gif';
    title_el.innerHTML = 'Loading | make sure you are connected to Internet';
  }

  // shows button image and song title text
  function show_btn_img() {
    btn_img.src = img_src;
    title_el.innerHTML = title;
  }

  function update_info() {
    img_src = document.querySelector('img.cover_art').src;

    // The HTML response has a duplicate element id for title,
    // so this is a workaround to access title
    title = document.querySelector('a > b').innerHTML;

    cover.classList.remove('playing');
    setTimeout(function() {
      draw(img_src);
      cover.classList.add('playing');
    }, 1500);

    if (can_play || (state == 'stop')) {
      show_btn_img();
    } else {
      show_loading();
    }
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
