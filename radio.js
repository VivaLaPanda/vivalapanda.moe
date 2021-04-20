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

      // Set playlist
      if (response.upcoming.length != 0) {
        $('#queueState').css("display", "none");
        playlistRows = response.upcoming.map(function(song) {
          return "<li>" + "<a target=\"_blank\" rel=\"noreferrer\" href=\"" + song.url + "\"> " + song.title + "</a>" + "</li>\n"
        })
        playlistRows = playlistRows.join("")
        $('#upcoming').html(playlistRows)
      } else {
        $('#upcoming').html("")
        $('#queueState').html("Nothing queued")
        $('#queueState').css("display", "block");
      }
    }
    else{
      createErrorMessage(httpRequest.responseText);
    }
  }
  httpRequest.send();
}

var queueHidden = true;
var aboutShowing = false;
var typeWriterRunning = false;
var moreTextClicked = false;
var typewriterInterrupt = false;
function setup(){
    var audio = $('#audioPlayer')[0];
    var src = 'https://VivaLaPanda.moe/stream.mp3';
    // var src = '/audio/mercurius_pretty-the_birth_of_homunculus.mp3';
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
			
            audio.load();
            audio.play();
			
			window.setTimeout(()=>{
				startVisualizer();
			}, 1000);
            // ga('send', 'event', 'Stream', 'play', 'Stream play tracking');
        });
        $('#audioStop').click(function () {
            audio.pause();
            // ga('send', 'event', 'Stream', 'stop', 'Stream play tracking');
            audio.src = '';
			stopVisualizer();
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
	
	$('#show-queue').click(function () {
		if (queueHidden) {
			queueHidden = false;
			$('#queue-window').css("display", "block");
			$('#visualizer').css("display", "none");
		} else {
			queueHidden = true;
			$('#queue-window').css("display", "none");
			$('#visualizer').css("display", "block");
		}
	})
	
	
	var aboutText = `
		This radio app runs on the UtaStream backend that I wrote. It's a lightweight Go app that allows for creating an online radio. Anyone who has an API key can queue music here, so the stuff you hear is from me and my frens.
	`;
	$('#about').click(function () {
		
		if (aboutShowing) {
		} else {
			aboutShowing = true;
			typeWriterRunning = true;
			
			$('#radio-dialog').html("");
			
			var aboutTextIdx = 0;

			function typeWriter() {
			  if (aboutTextIdx < aboutText.length && !typewriterInterrupt) {
				document.getElementById("radio-dialog").innerHTML += aboutText.charAt(aboutTextIdx);
				aboutTextIdx++;
				setTimeout(typeWriter, 30);
			  } else {
				$('#radio-dialog').html(aboutText);
				$('#text-arrow').css("display", "block");
				typeWriterRunning = false;
				typewriterInterrupt = false;
			  }
			}
			typeWriter();
		}
	});
	
	$('#radio-dialog').click(function () {
		if (aboutShowing && !moreTextClicked) {
			if (typeWriterRunning) {
				typewriterInterrupt = true;
				
				$('#text-arrow').css("display", "block");
				typeWriterRunning = false;
				
				return;
			}
			
			moreTextClicked = true;
			$('#radio-dialog').html("");
			$('#text-arrow').css("display", "none");
			
			
			var aboutTextIdx = 0;
			var aboutText = `
				You can check out the source code below. Enjoy the tunes!
				
				
			`;
			
			
			function typeWriter() {
			  if (aboutTextIdx < aboutText.length) {
				document.getElementById("radio-dialog").innerHTML += aboutText.charAt(aboutTextIdx);
				aboutTextIdx++;
				setTimeout(typeWriter, 30);
			  } else {
				  document.getElementById("radio-dialog").innerHTML += "<br><a target='_blank' href='https://github.com/VivaLaPanda/uta-stream'>GitHub</a>";
			  }
			}
			typeWriter();
		}
	});
};

var visualizerStopped = true;
var firstClick = true;
function startVisualizer() {
	stream = document.getElementById("audioPlayer").captureStream();
	
    //main block for doing the audio recording
    let chunks = [];
    const mediaRecorder = new MediaRecorder(stream);

    // visualiser setup - create web audio api context and canvas

    let audioCtx;
    const visCanvas = document.querySelector('#visualizer');
    const visCanvasCtx = visCanvas.getContext("2d");
	
	if (firstClick) {
		visCanvasCtx.scale(8,4);
		firstClick = false;
	}
	
    visualizerStopped = false;

    // Do the visualizer stuff
    visualize(stream);
    mediaRecorder.start();
    console.log(mediaRecorder.state);
    console.log("recorder started");

    mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
    }

    function visualize() {
        if(!audioCtx) {
            audioCtx = new AudioContext();
        }
    
        const source = audioCtx.createMediaStreamSource(stream);
    
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
    
        source.connect(analyser);
        //analyser.connect(audioCtx.destination);
    
        let index = 0;
        draw()
    
        function draw() {
            index++;
            if (visualizerStopped) {
                return;
            }

            const WIDTH = visCanvas.width / 8;
            const HEIGHT = visCanvas.height / 4;
			const barHeight = 8;
        
            requestAnimationFrame(draw);
			
			if (index % 4 == 0) {
				analyser.getByteTimeDomainData(dataArray);
			}
			
            visCanvasCtx.lineWidth = 1;
        
        
            let sliceWidth = WIDTH * 1.0 / bufferLength;
            let x = 0;
        
        
            for(let i = 0; i < bufferLength; i++) {
        
                let v = dataArray[i] / 128.0;
                let y = (v - .7) * HEIGHT;
        
				// 284 h, half empty so 142. 32 bars
				// // visCanvasCtx.lineTo(x, y);
				visCanvasCtx.beginPath();
				for (let barIdx = 0; ((barIdx * 2) * barHeight) < HEIGHT; barIdx++) {
					let barY = (barIdx * 2) * barHeight;
					visCanvasCtx.rect(x + .5, HEIGHT - barY, sliceWidth - 1, barHeight);
				}
				visCanvasCtx.fillStyle = "rgba(0,0,0,.1)";
				visCanvasCtx.fill();
				
				for (let barIdx = 0; ((barIdx * 2) * barHeight) < y; barIdx++) {
					visCanvasCtx.beginPath();
					let barY = (barIdx * 2) * barHeight;
					visCanvasCtx.rect(x + .5, HEIGHT - barY, sliceWidth - 1, barHeight);
					
					if (barIdx < 8) {
						visCanvasCtx.fillStyle = "#ffee55";
					} else if (barIdx < 9) {
						visCanvasCtx.fillStyle = "#ff0066";
					} else {
						visCanvasCtx.fillStyle = "#00eebb";
					}
					
					visCanvasCtx.fill();
				}
        
                x += sliceWidth;
            }
        }
    }
}

function stopVisualizer() {
    visualizerStopped = true;
    const visCanvas = document.querySelector('#visualizer');
    const visCanvasCtx = visCanvas.getContext("2d");
    visCanvasCtx.clearRect(0,0, visCanvas.width, visCanvas.height)
}