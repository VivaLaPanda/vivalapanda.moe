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


// DOMContentLoaded, not onload: onload also waits for the preloaded font, and clicks on the
// boot screen before then would be ignored
document.addEventListener("DOMContentLoaded", function () {
	var body = document.querySelector("body");
	var musicBtn = document.querySelector("#mute");
	var bootSound = document.querySelector("#bootSound");
	var music = document.querySelector("#music");
	music.muted = true;
	
	musicBtn.addEventListener('click', event => {
		toggleMute()
	});

	if (window.localStorage.getItem('hasVisited')) {
		document.querySelector("#boot-screen").style.display = "none";
		document.querySelector(".main-window").style.display = "block";
	} else {
		document.querySelector("#boot-screen").addEventListener('click', event => {
			window.localStorage.setItem('hasVisited', true);
			bootSound.play(); // must start inside the click for autoplay rules
			// don't type until pc-98 is ready, or the text shows up in a fallback font and
			// then jumps when it swaps; give up after 3s rather than hang on a slow network
			var timeout = new Promise(resolve => setTimeout(resolve, 3000));
			Promise.race([document.fonts.load("30px pc-98", "ｼ"), timeout])
				.catch(() => {})
				.then(animateBootscreen);
		}, { once: true });
	}
});

function animateBootscreen() {
	var container = document.getElementById("boot-container");
	// one text node we append to: no re-parsing the whole block on every character
	var output = document.createTextNode("");
	document.getElementById("boot-text").appendChild(output);

	// Types `text` a character at a time, keeping the newest line in view like a terminal
	function type(text, delay, done) {
		var chars = Array.from(text); // whole code points, never half a character
		var i = 0;
		(function next() {
			if (i < chars.length) {
				output.appendData(chars[i++]);
				container.scrollTop = container.scrollHeight;
				setTimeout(next, delay);
			} else {
				done();
			}
		})();
	}

	var necTxt = `
		Booting...
		
		
		NEC PC-9800 ｼﾘｰｽﾞ ﾊﾟｰｿﾅﾙ ｺﾝﾋﾟｭｰﾀ
		Copyright (C) 1981,1990 Microsoft Corp. / NEC Corporation
		
		ﾏｲｸﾛｿﾌﾄ MS-DOS ﾊﾞｰｼﾞｮﾝ 3.3C'
		ＥＭＳメモリが使用可能です ＫＫＣＦＵＮＣが組み込まれました
	`;

	var pandaTxt = `
		.
		.
		.
		.
		.
		
		Welcome to VivaLaPanda's digital home!
	`;

	type(necTxt, 15, function () {
		type(pandaTxt, 120, function () {
			document.querySelector("#boot-screen").style.display = "none";
			document.querySelector(".main-window").style.display = "block";

			toggleMute();
			document.querySelector("#bootSound").pause();
		});
	});
}
