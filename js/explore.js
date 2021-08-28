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

var haveTalkedToBarshoujo = false;
function talkToBarshoujo(event) {
	if (haveTalkedToBarshoujo) {
		haveTalkedToBarshoujo = false;
		document.getElementById("explore-img").setAttribute("style", "");
		document.getElementById("towerbar-text").innerHTML = "\"Come over here friend, grab yourself a seat!\""
		document.getElementById("towerbar-speaker").innerHTML = "T o n y"
	} else {
		haveTalkedToBarshoujo = true;
		document.getElementById("explore-img").setAttribute("style", "background-image: url('/img/explore/portraits/bar_lady.png');background-position: center;");
		document.getElementById("towerbar-text").innerHTML = "\"Hey cutie, haven't seen you here before. Come share a drink with me\""
		document.getElementById("towerbar-speaker").innerHTML = "B a r s h o u j o"
	}
}