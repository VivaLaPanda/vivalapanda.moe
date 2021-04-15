window.onload = function(){
    setup();
    getPlaylistInfo();

    setInterval(function() {
        getPlaylistInfo();
    }, 60 * 1000); // 60 * 1000 milsec
}

/**
 * detects if the current Object is a String element.
 * @param {Object} object object which gets checked for being a String.
 * @return true if a form of String, false if not.
 */
function isString(object){
    return typeof(object) === "string" || object instanceof String;
}

/**
 * gets info about the current playlist
 */
function getPlaylistInfo(){
  var httpRequest = new XMLHttpRequest();
  httpRequest.open('GET', 'https://VivaLaPanda.moe/api/playing');
  httpRequest.onload = function(){
    response = JSON.parse(httpRequest.response)
    if(httpRequest.status == 200 ){
      console.log(response);
	  
	  
      // Set current playing
      if(response.currentSong.url){
        $('#status-current-song').html("<a target=\"_blank\" rel=\"noreferrer\" href=\"" + response.currentSong.url + "\"> " + response.currentSong.title + "</a>")
      } else {
        $('#status-current-song').html(response.currentSong.title)
      }

      // // Set playlist
      // if (response.upcoming.length != 0) {
        // $('#queueState').html("")
        // playlistRows = response.upcoming.map(function(song) {
          // return "<li>" + "<a target=\"_blank\" rel=\"noreferrer\" href=\"" + song.url + "\"> " + song.title + "</a>" + "</li>\n"
        // })
        // playlistRows = playlistRows.join("")
        // $('#upcoming').html(playlistRows)
      // } else {
        // $('#upcoming').html("")
        // $('#queueState').html("Nothing queued")
      // }
    }
    else{
      createErrorMessage(httpRequest.responseText);
    }
  }
  httpRequest.send();
}

function setup(){
    var audio = $('#audioPlayer')[0];
    var src = 'https://VivaLaPanda.moe/stream.mp3';
    audio.volume = 1;

    function preload(imgurl) {
        $('<img/>').attr('src', imgurl).hide().appendTo('body');
    }

    apiKey = localStorage.apiKey;
    // $('#apiKey').val(apiKey);
    // ga('set', 'userId', apiKey);

    $('#audioPlay').hover(function () {
            // onhover
        }, function () {
            // offhover
        });
    $('#audioStop').hover(function () {
            // onhover
        }, function () {
            // offhover
        });
    $.bindAudioControls = function() {
        $('#audioPlay').off('click');
        $('#audioStop').off('click');
        $('#audioMute').off('click');
        $('#audioVolume').off('input change');
        $('#statusRefresh').click(function() {
          getPlaylistInfo();
        })
        $('#audioPlay').click(function () {
            if (!audio.canPlayType('audio/mpeg')) {
                alert("Your browser very probably can't play mp3 streams! Stop using Opera.");
                return;
            }
            //This might seem kind of weird, but this is the surest way to beat the
            //goddamn automatic caching that Firefox kept doing - which itself is
            //a hard problem to actually run up against; the user has to close the
            //tab and then open the closed tab (i.e, Ctrl+Shift+T) and resume play,
            //at which point the play would be resumed from the start of the audio
            //which had been buffered up until that point, instead of starting fresh.
            //if (navigator.userAgent.match(/Firefox/)) {
            var data = $(audio).data('src');
            audio.src = data ? data : (src + '?nocache=' + Date.now());
            //}
            //else
            //{
            //    audio.src = src;
            //}
            audio.load();
            audio.play();
            // ga('send', 'event', 'Stream', 'play', 'Stream play tracking');
        });
        $('#audioStop').click(function () {
            audio.pause();
            // ga('send', 'event', 'Stream', 'stop', 'Stream play tracking');
            audio.src = '';
        });
        $('#audioMute').click(function () {
            audio.muted = !audio.muted;
            // ga('send', 'event', 'Stream', 'mute', 'Stream play tracking', audio.muted);
            this.src = audio.muted ? 'assets/img/muted.png' :
                'assets/img/not-muted.png';
        });
        // $('#audioVolume').on('input change', function () {
            // audio.volume = this.value / 100;
            // ga('send', 'event', 'Stream', 'changeVolume', 'Stream play tracking', audio.volume);
        // });
    }
    $.bindAudioControls();
};