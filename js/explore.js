window.onload = function(){
	loadLocation();
}

// Location.json template (may not be up to date)
// var loc = {
// 	mainImage: "",
// 	mainImagePos: "center",
// 	frameMode: "dark",
// 	music: "",

// 	speakerText: "P a n d a",
// 	dialogText: "Example dialog box text",
// 	links: [
// 		{
// 			to: "",

// 			width: "50px",
// 			height: "50px",
// 			right: "100px",
// 			bottom: "100px"
// 		}
// 	]
// }

function loadLocation(event) {
	const urlSearchParams = new URLSearchParams(window.location.search);
	let location = urlSearchParams.get('loc');
	if (!location) {
		location = "mainstreet";
	}

	const debug = urlSearchParams.get('debug'); // Allow debug specific actions

	const loc = locations[location];
	if (!loc) {
		window.location.href = "explore.html";
	}

	// Load the main assets
	// load the images
	const exploreImage = document.getElementById("explore-img");
	const frame = document.getElementById("frame");
	const holoImage =  document.getElementById("right-sidebar");

	exploreImage.style.backgroundImage = "url(" + loc.mainImage + ")";
	exploreImage.style.backgroundPosition = loc.mainImagePos;

	if (loc.frameMode == "dark") {
		frame.style.backgroundImage = "../img/background-frame-dark.png";
	} else {
		frame.style.backgroundImage = "../img/background-frame.png"
	}

	holoImage.style.backgroundImage = "url(" + loc.holoImage + ")";

	// load the audio
	const music =  document.getElementById("music");
	music.src = loc.music;
	music.muted = window.localStorage.getItem('muted') == 'true'; // Localstorage always gives strings, not bools

	music.load();
    music.play();
    updateMute();

	// Set strings
	const speakerText = document.getElementsByClassName("speaker-text")[0];
	const dialogText = document.getElementsByClassName("dialog-text");
	const textContainer = document.getElementsByClassName("text-container")[0];

	speakerText.innerHTML = loc.speakerText;

	// Load text
	// Start by removing any old text
	for (const elem of dialogText) {
		elem.remove()
	}
	loc.dialogText.forEach((text) => {
		const newText = textContainer.appendChild(document.createElement("p"));
		newText.className = "dialog-text";

		newText.innerHTML = text;
	});


	// Set title
	const title = document.getElementsByTagName("title")[0];
	title.innerText = loc.title;

	// Load buttons
	const imageBox = document.getElementById("main-image");
	const buttons = document.getElementsByClassName("explore-link");
	// Start by removing any old ones
	for (const elem of buttons) {
		elem.remove()
	}

	// Create the new buttons based on the loc
	loc.links.forEach((link) => {
		const newLink = imageBox.appendChild(document.createElement("a"));
		newLink.className = "explore-link";
		newLink.href = link.to;

		newLink.style.width = link.width;
		newLink.style.height = link.height;
		newLink.style.right = link.right;
		newLink.style.bottom = link.bottom;

		if (debug == true) {
			newLink.style.backgroundColor = "red";
		}
	});
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