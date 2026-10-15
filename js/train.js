var trainmusic = [
    "/audio/train-music/sufjan-stevens-seven-swans.mp3",
    "/audio/train-music/tenniscoats-tantan-therapy.mp3",
    "/audio/train-music/tenniscoats-papas-ear.mp3"
];

function randomTrainMusic() {
    return trainmusic[Math.floor(Math.random()*trainmusic.length)];
}

window.addEventListener("load", function () {
    // load the audio
    const music =  document.getElementById("music");
    music.src = randomTrainMusic();
    
    music.load();
    var played = music.play();                 // held back until a tap or key on a first visit (soundOn retries)
    if (played && played.catch) played.catch(function () {});
});

// the train window: Panda's own clips (media/train/, in Git LFS; listed in its index.json),
// one after another in a shuffled order. They start muted, which every browser lets autoplay; the first tap or key
// turns the sound on and starts whatever the browser held back (the train, the music).
var clips = [], at = 0, failures = 0;

function shuffle(a) {
	for (var i = a.length - 1; i > 0; i--) {
		var j = Math.floor(Math.random() * (i + 1)), t = a[i];
		a[i] = a[j];
		a[j] = t;
	}
	return a;
}

function nextClip() {
	var video = document.getElementById("tallvideo");
	if (!video || !clips.length) return;
	video.src = "/media/train/" + clips[at++ % clips.length];
	var played = video.play();
	if (played && played.catch) played.catch(function () {});
}

function soundOn() {
	var video = document.getElementById("tallvideo");
	if (video) {
		video.muted = false;
		if (video.paused && video.src) video.play().catch(function () {});
	}
	var music = document.getElementById("music");
	if (music && music.paused) {
		var played = music.play();
		if (played && played.catch) played.catch(function () {});
	}
}
["pointerdown", "keydown"].forEach(function (ev) {
	document.addEventListener(ev, soundOn, { once: true });
});

window.addEventListener("load", function () {
	var video = document.getElementById("tallvideo");
	video.addEventListener("ended", nextClip);
	video.addEventListener("playing", function () { failures = 0; });
	video.addEventListener("error", function () {   // a clip that won't play: on to the next (not forever)
		if (++failures < clips.length) setTimeout(nextClip, 500);
	});
	fetch("/media/train/index.json").then(function (r) { return r.json(); }).then(function (list) {
		clips = shuffle(list);
		nextClip();
	}).catch(function () {});
});
