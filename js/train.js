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
    music.play();
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
            'controls': 0,
            'autohide': 0, 
            'index':randomSong,
            'showinfo':0
        },
        events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
	//alert("onPlayerReady"+event.data)
	//event.target.setShuffle(true);
	//event.target.mute();
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