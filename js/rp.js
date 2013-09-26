var audio = document.getElementById('audio');
var btn = document.getElementById('play-btn');
var btn_img = document.getElementById('play-btn-img');
var body = document.getElementsByTagName('body')[0];
var cover = document.getElementById('cover');
var title_el = document.getElementById('song-title');
var ogg_stream = {
  '32k': 'http://stream-dv1.radioparadise.com/ogg-192',
  '96k': 'http://stream-dv1.radioparadise.com/ogg-192',
  '192k': 'http://stream-dv1.radioparadise.com/ogg-192'
};

var state = 'paused';

document.addEventListener('DOMContentLoaded', function() {
  console.log('loaded§');
  audio.src = ogg_stream['192k'];
  get_current_songinfo();
});

btn.addEventListener('click', pause_play, false);
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
  var img = document.querySelector('img.cover_art').src;

  // The HTML response has a duplicate element id for title,
  // so this is a workaround to access title
  var title = document.querySelector('a > b').innerHTML;

  cover.classList.remove('playing');
  setTimeout(function() {
    cover.src = img;
    cover.classList.add('playing');
  }, 1500);
  btn_img.src = img;
  title_el.innerHTML = title;
}

