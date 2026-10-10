var trainmusic = [
    "/audio/train-music/sufjan-stevens-seven-swans.mp3",
    "/audio/train-music/tenniscoats-tantan-therapy.mp3",
    "/audio/train-music/tenniscoats-papas-ear.mp3"
];

function randomTrainMusic() {
    return trainmusic[Math.floor(Math.random()*trainmusic.length)];
}

window.onload = function(){
    // load the audio
    const music =  document.getElementById("music");
    music.src = randomTrainMusic();
    
    music.load();
    var played = music.play();                 // held back until a tap or key on a first visit (soundOn retries)
    if (played && played.catch) played.catch(function () {});
}

// mostly all copied from http://vimutv.com/

var getRandom = function(min, max) {
	return Math.floor(Math.random() * max);
};

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var playlistID = "PLVBUsmE3WihINwYoXTDDPGT0kE2rVelby";

var randomSong = getRandom(0,27) - 1;

var video;
function onYouTubeIframeAPIReady() {
    video = new YT.Player('tallvideo', {
        listType: 'playlist',
        list: playlistID,
        playerVars: {
            'list': playlistID,
            'autoplay': 1,
            'controls': 0,          // no control bar
            'disablekb': 1,         // no keyboard shortcuts
            'fs': 0,                // no fullscreen button
            'iv_load_policy': 3,    // no annotations
            'playsinline': 1,
            'index': randomSong
        },
        events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError
        }
    });
}

// the player can't be clicked (css/train.css), so it starts muted, which browsers always let autoplay; the first tap or
// key anywhere on the page turns its sound on, and starts the music if the browser held that back too
function soundOn() {
	if (video && video.unMute) video.unMute();
	var music = document.getElementById("music");
	if (music && music.paused) {
		var played = music.play();
		if (played && played.catch) played.catch(function () {});
	}
}
["pointerdown", "keydown"].forEach(function (ev) {
	document.addEventListener(ev, soundOn, { once: true });
});

function onPlayerReady(event) {
	event.target.mute();
	event.target.playVideo();
	event.target.setLoop(true);  
	setTimeout(setShuffleFunction, 1000);
}

function setShuffleFunction(){
	video.setShuffle(true);      	
}

function onPlayerError(event) {  				
	console.log("onPlayerError"+event.data)	
	//playlist error	
	if(event.data==2){
		//alert("onPlayerError"+event.data)	
		setTimeout(playlistError, 1000);		
	}else{
		setTimeout(playNext, 1000);	
	}
}

function playlistError(){
	videoID = ''
	video.loadPlaylist({
		//vi/mu Pop Music Playlist
		list:'PL9fT1eiD70UGSPtLnOrnuH87w_g-mr7k1',
		'index':randomSong
	}) 
	video.setLoop(true);  
	setTimeout(setShuffleFunction, 1000);
	hasHash = 0		
}

function playNext(){
	video.nextVideo();
}