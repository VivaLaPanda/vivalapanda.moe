window.onload = function(){
	var body = document.querySelector("body");
	var musicBtn = document.querySelector("#mute");
	var music = document.querySelector("#music");

	
	window.localStorage.setItem('muted', true);

	music.muted = window.localStorage.getItem('muted') == 'true'; // Localstorage always gives strings, not bools

    music.play();
    updateMute();
}

function toggleMute() {
	if (window.localStorage.getItem('muted') == 'true') {
		music.play();
		window.localStorage.setItem('muted', false);
	} else {
		window.localStorage.setItem('muted', true);
	}
	
	updateMute();
}

function updateMute() {
	var musicBtn = document.querySelector("#mute");
	
	if (window.localStorage.getItem('muted') == 'true') {
		musicBtn.style.filter = "grayscale(100%)";
	} else {
		musicBtn.style.filter = "grayscale(0%)";
	}
	
	music.muted = window.localStorage.getItem('muted') == 'true';
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