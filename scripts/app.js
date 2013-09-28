define(function(require) {
  var setting = require('helper/setting');
  //var brick = require('brick');
  var brick = require('helper/brick-1.0beta8.byob.min');

  var audio = document.getElementById('audio');
  var btn = document.getElementById('play-btn');
  var btn_img = document.getElementById('play-btn-img');
  var body = document.getElementsByTagName('body')[0];
  var cover = document.getElementById('cover');
  var title_el = document.getElementById('song-title');
  var lock = window.navigator.requestWakeLock('screen');

  var ogg_stream = {
    '32k': 'http://stream-dv1.radioparadise.com/ogg-192',
    '96k': 'http://stream-dv1.radioparadise.com/ogg-192',
    '192k': 'http://stream-dv1.radioparadise.com/ogg-192'
  };

  var state = 'playing';
  var setting_is_open = false;

  console.log('document ready? ' + document.readyState);
  if (document.readyState == 'complete') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  function init() {
    audio.src = ogg_stream['192k'];
    get_current_songinfo();
  }

  btn.addEventListener('click', pause_play, false);
  cover.addEventListener('click', cover_tapped, false);
  audio.addEventListener('loadedmetadata', loadedMetadata, false);

  function loadedMetadata() {
    console.log('loaded metadata: ', this);
    audio.play();
  }

  function pause_play() {
    if (state == 'paused') {
      audio.play();
      state = 'playing';
      btn.classList.remove('paused');
      btn.classList.add('playing');
    } else {
      audio.pause();
      state = 'paused';
      btn.classList.add('paused');
      btn.classList.remove('playing');
    }
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
      setTimeout('get_current_songinfo()', infoArray[0]);
      update_info();
    };
    crossxhr.onerror = function() {
      console.log('Error getting current song info', crossxhr);
      setTimeout('get_current_singinfo()', 200000);
    };
    crossxhr.open('GET', playlist_url);
    crossxhr.send();
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
    var left_canvas = document.getElementById('left-canvas');
    var right_canvas = document.getElementById('right-canvas');
    var width = cover.clientWidth;
    var height = cover.clientHeight;
    draw_half(left_canvas, 'left');
    draw_half(right_canvas, 'right');
    function draw_half(canvas, side) {
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      var ctx = canvas.getContext('2d');
      var img = new Image();
      ctx.fillStyle = 'rgb(200,0,0)';
      if (side == 'left') {
        ctx.rect(0, 0, width / 2, height);
      } else {
        ctx.rect(width / 2, 0, width / 2, height);
      }
      ctx.clip();
      img.onload = function() {
        var h = width * img.height / img.width;
        ctx.drawImage(img, 0, 0, width, h);
      };
      img.src = img_src;
    }
  }

  function cover_tapped() {
    if (setting_is_open) {
      close_setting();
    } else {
      open_setting();
    }
    console.log('toggled setting');
  }

  function open_setting() {
    cover.classList.add('open');
    setting_is_open = true;
  }

  function close_setting() {
    cover.classList.remove('open');
    setting_is_open = false;
  }

});
