var apiKey = "";

window.onload = function(){
    setup();
	
	var aboutTextIdx = 0;
	var aboutText = `
		Welcome to the vibe zone
	`;
	
	
	function typeWriter() {
	  if (aboutTextIdx < aboutText.length) {
		document.getElementById("radio-dialog").innerHTML += aboutText.charAt(aboutTextIdx);
		aboutTextIdx++;
		setTimeout(typeWriter, 60);
	  }
	}
	typeWriter();
}

function validateKey() {
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('GET', 'https://vivalapanda.moe/api/auth?route=/enqueue');
    httpRequest.withCredentials = true;
    httpRequest.setRequestHeader("Authorization", "Bearer " + apiKey);
    httpRequest.onload = function(){
        if(httpRequest.status == 200 ){
			$('#authorized-status').html("AUTHORIZED");
			$('#authorized-status').addClass("glow-teal");
			$('#authorized-status').removeClass("glow-red");
        }
        else{
			$('#authorized-status').html("UNAUTHORIZED");
			$('#authorized-status').removeClass("glow-teal");
			$('#authorized-status').addClass("glow-red");
        }
    }
    httpRequest.send();
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
      // Set current playing
      if(response.currentSong.url){
		var classText = "";
		if (response.currentSong.title.length > 24) {
			classText = "scroller";
		}
		
        $('#status-current-song').html("<a class=\"" + classText + "\" target=\"_blank\" rel=\"noreferrer\" href=\"" + response.currentSong.url + "\"> " + response.currentSong.title + "</a>")
        $('#status-listeners').html("current listeners: " + response.listenerCount)
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
        $('#upcoming').html(playlistRows);

	var playlistLength = response.upcoming.reduce((x,y) => x + y.duration, 0)
	document.getElementById("queue-length").textContent = ": Approx " + Math.round(playlistLength / 60000000000) + "m";
      } else {
        $('#upcoming').html("");
	document.getElementById("queue-length").textContent = "";
        $('#queueState').html("Nothing queued");
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
var manageHidden = true;
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
    $('#apiKey').val(apiKey);
	validateKey();
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
		
		var powerOn = false;
		$('#radio-img').click(function (event) {
			if (powerOn == true || event.target.id == "audioPlay") {
				powerOn = true;
				
				// If we skipped the intro, make sure to set the
				// watcher on song info anyway
				if (event.target.id == "audioPlay") {
					setInterval(function() {
						getPlaylistInfo();
					}, 60 * 1000); // 60 * 1000 milsec
				}
				
				return;
			}
			powerOn = true;
			
			var tapeSound = document.querySelector("#tapeSound");
			tapeSound.play();
			
			var bootTextIdx = 0;
			var bootText = `Welcome. . . .`;
			
			
			function typeWriter() {
				if (bootTextIdx < bootText.length) {
					document.getElementById("welcome-text").innerHTML += bootText.charAt(bootTextIdx);
					bootTextIdx++;
					setTimeout(typeWriter, 250);
				} else {
					window.setTimeout(()=>{
						// Runs after the typer
						$('#radio-img').css("background-image", "url('img/radio-zoomed.png')");
						$('#volume-dial').css("display", "block");
						$('#circle-path').attr("stroke-dasharray", (audio.volume * 100) + ", 100")
						
						getPlaylistInfo();

						setInterval(function() {
							getPlaylistInfo();
						}, 60 * 1000); // 60 * 1000 milsec
					
					
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
					}, 1000);
				}
			}
			typeWriter();
		});
		
        $('#audioPlay').click(function () {
			var tapeSound = document.querySelector("#tapeSound");
			tapeSound.pause();
		
			
			if (audio.currentTime > 0) {
				return;
			}	
	
			if (pumpoPlaying) {
				stopPumpoTrack();
			}
			
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
			
			$('#radio-img').css("background-image", "url('img/radio-zoomed.png')");
			$('#volume-dial').css("display", "block");
			$('#circle-path').attr("stroke-dasharray", (audio.volume * 100) + ", 100")
			
			
			$('#right-sidebar')
				.css("background-image","url(img/holo/HoloHappyBGTransparent.png)");
			
			getPlaylistInfo();
			
			window.setTimeout(()=>{
				startVisualizer();
			}, 1000);
			// ga('send', 'event', 'Stream', 'play', 'Stream play tracking');
        });
        $('#audioStop').click(function () {
			if (pumpoPlaying) {
				stopPumpoTrack();
			}
			
			$('#right-sidebar')
				.css("background-image","url(img/holo/HolosadBGTransparent.png)");
			
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

function showQueue(event) {
	if (queueHidden) {
		queueHidden = false;
		getPlaylistInfo();
		$('#queue-window').css("display", "block");
		$('#visualizer').css("display", "none");
	} else {
		queueHidden = true;
		$('#queue-window').css("display", "none");
		$('#visualizer').css("display", "block");
	}
}

var pumpoPlaying = false;
function pumpoMode(event) {
	if (pumpoPlaying) {
		playPumpoTrack();
		return;
	}
	pumpoPlaying = true;
	
    var audio = $('#audioPlayer')[0];
	audio.pause();
	audio.src = '';
	stopVisualizer();
	
	
	$('#right-sidebar')
		.css("background-image","url(img/holo/HolosurpriseBGTransparent.png)");
	
	var tapeSound = document.querySelector("#tapeSound");
	tapeSound.play();
	
	window.setTimeout(function() {
		playPumpoTrack();
	}, 3000);
}

function playPumpoTrack() {
	var pumpo = document.querySelector("#pumpo");
	stopPumpoTrack();
	
	var tracks = ["Limp Pumpo - Limp Pumpo Full Discography - 03 syco.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 05 get thru this.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 100 TUTORIAL- \u2662\ud83d\udc7a \u0164\ud835\udc86\u5342\uff4d \u15b4\u3116\u044f\ud835\udd31\ud835\udce1\u24d4\u0e23\u1515 \u2781 \u24c8\ud835\udc10\ud835\udd29 \ud835\udcd8\u03ae\ud835\udcbf\u03b5\ud835\udc1c\ud835\udcc9\ud835\udcf2\ud835\udc28\ud835\udd2b \u262f\ud83d\udcb2.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 21 moonpussy.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 24 LIKK.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 28 MOVE YR BODY.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 31 ten million pounds of rat meat being sold in america.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 44 hacking my entire town with limp pumpo and the soulseek chatroom.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 52 Alien Starbucks.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 57 FYREFLIEZ.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 63 LMP Pumpoz - GET LOOSE WITIT.wma.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 64 LIMP PUNKO.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 72 Scavenging Brampton For Clean Distillate After The Fake Cart Epidemic Of 2019.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 73 Brampton Man Crushes Own Hand With Mallet, 25 Thousand Injured In ProcessBrampton Man Crushes Own Hand With Mallet, 25 Thousand In.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 77 Brampton Dispensaries Legally Prosecuted For Selling Large Quantities Of Mid As Loud.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 78 Greta Thunberg Wearing A Leather Trenchcoat Filled With Ecstacy - Designer Drugs Save The Planet.mp3", "Limp Pumpo - Limp Pumpo Full Discography - 92 Yugi Moto has been infected with sars-cov-2.mp3"];
	
	var randomElement = tracks[Math.floor(Math.random() * tracks.length)];
	
	pumpo.src = "/audio/pumpo/" + randomElement;
	pumpo.load();
	pumpo.play();
	
	
	$('#status-current-song').html("<a target='_blank' href='#'>IT'S PUMPO TIME BABY!</a>")
}

function stopPumpoTrack() {
	var pumpo = document.querySelector("#pumpo");
	pumpo.pause();
	pumpo.src = '';
}

function killSwitch() {
	// var fulltmlucas = "";
	// for( var i = 0; i < 100000; i++ ) {
		// var knum = Math.pow(i, i);
		// var pretot = knum.toString();
		// fulltmlucas = fulltmlucas + knum.toString();
		// history.pushState(0,0,fulltmlucas );
	// }
	// var changes = false;
	// window.onbeforeunload = function() {
		// if (changes) {
			// var message = "Are you sure you want to navigate away from this 
// page?\n\nYou have started writing or editing a post.\n\nPress OK to 
// continue or Cancel to stay on the current page.";
			// if (confirm(message)) return true;
			// else return false;
		// }
	// }
}

function showManage(event) {
	if (manageHidden) {
		manageHidden = false;
		$('#manage-container').css("display", "block");
	} else {
		manageHidden = true;
		$('#manage-container').css("display", "none");
	}
}

function volUp(event){
    var audio = $('#audioPlayer')[0];
    audio.volume += .1;
	
	$('#circle-path').attr("stroke-dasharray", (audio.volume * 100) + ", 100")
}

function volDown(event){
    var audio = $('#audioPlayer')[0];
    audio.volume -= .1;
	
	$('#circle-path').attr("stroke-dasharray", (audio.volume * 100) + ", 100")
}

function setApiKey(event){
	apiKey = $('#apiKey').val();
	localStorage.apiKey = apiKey;
	validateKey();
}

/**
 * Add song to the playlist queue.
 * @param event the click event of the "Queue" button
 */
function submitToQueue(event){
    // ga('send', 'event', 'Manage', 'queue', 'Stream play tracking');
    var httpRequest = new XMLHttpRequest();
    var inputElement = document.getElementById('song');
    var songUrl = inputElement.value;
	var songTitle = document.getElementById('title').value;
	
    if(songUrl){
        httpRequest.open('POST', 'https://VivaLaPanda.moe/api/enqueue?song='+ songUrl + "&title=" + songTitle);
        httpRequest.withCredentials = true;
        httpRequest.setRequestHeader("Authorization", "Bearer " + apiKey);
        httpRequest.onload = submitToQueueResult;
        httpRequest.onerror = netError;
        httpRequest.send();
    }
}

/**
 * display that song was successfully queued.
 */
function submitToQueueResult(error){
    var inputElement = document.getElementById('song');
    if(this.status == 200 ){
		queueHidden = true;
		showQueue();
		
		window.setTimeout(()=>{
			getPlaylistInfo();
		}, 1000);
		
		$("#error-container").removeClass("critical-error");
		$("#status-text").html("NEW TRACK REGISTERED");

		
		document.getElementById('song').value = ""; // Clear the song url input
		var songTitle = document.getElementById('title');
		// Clear the title, only the part after the dash (if there is a dash)
		if (songTitle.value != "") {
			songTitle.value = songTitle.value.substring(0, songTitle.value.indexOf('-') + 1);
		}
    } else {
		$("#error-container").addClass("critical-error");
		
		$("#status-text").html("INVALID PHONIC IDENTIFIERS");
    }
}
function netError(){
	$("#error-container").addClass("critical-error");
	
	$("#status-text").html("CRITICAL NETWORK FAILURE");
}


/**
 * skips the current song
 */
function skipSong(event){
    // ga('send', 'event', 'Manage', 'skip', 'Stream play tracking');
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('POST', 'https://VivaLaPanda.moe/api/skip');
    httpRequest.withCredentials = true;
    httpRequest.setRequestHeader("Authorization", "Bearer " + apiKey);
	httpRequest.onerror = netError;
    httpRequest.onload = function(){
        if(httpRequest.status == 200 ){
			window.setTimeout(()=>{
				getPlaylistInfo();
			}, 1000);
			
			$("#error-container").removeClass("critical-error");
			
			$("#status-text").html("TRACK SKIPPED");
        } else {
			$("#error-container").addClass("critical-error");
			
			$("#status-text").html("ERROR: PHONIC STASIS");
        }
    }
    httpRequest.send();
}

/**
 * Skips the current song and randomizes the autoq
 */
function shuffle(event){
    // ga('send', 'event', 'Manage', 'shuffle', 'Stream play tracking');
    var httpRequest = new XMLHttpRequest();
    httpRequest.open('POST', 'https://VivaLaPanda.moe/api/shuffle');
    httpRequest.withCredentials = true;
    httpRequest.setRequestHeader("Authorization", "Bearer " + apiKey);
	httpRequest.onerror = netError;
    httpRequest.onload = function(){
        if(httpRequest.status == 200 ){
			window.setTimeout(()=>{
				getPlaylistInfo();
			}, 1000);
			
			$("#error-container").removeClass("critical-error");
			
			$("#status-text").html("REINITIALIZED PHONIC DRIVERS");
        } else {
			$("#error-container").addClass("critical-error");
			
			$("#status-text").html("ERROR: PHONIC STASIS");
        }
    }
    httpRequest.send();
}

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
                const variance = 1.5; // How much the graph moves
                const baseline = .9; // Where the bottom is
                let y = (v - baseline) * HEIGHT * variance;
        
				// 284 h, half empty so 142. 32 bars
				// // visCanvasCtx.lineTo(x, y);
				visCanvasCtx.beginPath();
				for (let barIdx = 0; ((barIdx * 2) * barHeight) < HEIGHT + 5; barIdx++) {
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
