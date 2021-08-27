window.onload = function(){
	var body = document.querySelector("body");
	var musicBtn = document.querySelector("#mute");
	var music = document.querySelector("#music");

    music.play();
    musicBtn.style.filter = "grayscale(0%)";
}

function toggleMute() {
	var musicBtn = document.querySelector("#mute");
	
	if (music.muted) {
		music.play();
		music.muted = false;
		musicBtn.style.filter = "grayscale(0%)";
	} else {
		music.muted = true;
		musicBtn.style.filter = "grayscale(100%)";
	}
}

function goTo(location) {
	window.location.href = location + ".html";
}