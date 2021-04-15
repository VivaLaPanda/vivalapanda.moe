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


window.onload = function(){
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
			bootSound.play();
			animateBootscreen();
		});
	}
}

function animateBootscreen() {
	function completeAnimation() {
		
	}
	
	var necTxtIdx = 0;
	var necTxt = `
		Booting...
		
		
		NEC PC-9800 ｼﾘｰｽﾞ ﾊﾟｰｿﾅﾙ ｺﾝﾋﾟｭｰﾀ
		Copyright (C) 1981,1990 Microsoft Corp. / NEC Corporation
		
		ﾏｲｸﾛｿﾌﾄ MS-DOS ﾊﾞｰｼﾞｮﾝ 3.3C'
		ＥＭＳメモリが使用可能です ＫＫＣＦＵＮＣが組み込まれました
	`;

	function typeWriter1() {
	  if (necTxtIdx < necTxt.length) {
		document.getElementById("boot-text").innerHTML += necTxt.charAt(necTxtIdx);
		necTxtIdx++;
		setTimeout(typeWriter1, 15);
	  } else {
		typeWriter2();
	  }
	}
	
	typeWriter1();
	
	
	var pandaTxtIdx = 0;
	var pandaTxt = `
		.
		.
		.
		.
		.
		
		Welcome to VivaLaPanda's digital home!
	`;

	function typeWriter2() {
	  if (pandaTxtIdx < pandaTxt.length) {
		document.getElementById("boot-text").innerHTML += pandaTxt.charAt(pandaTxtIdx);
		pandaTxtIdx++;
		setTimeout(typeWriter2, 120);
	  } else {
		document.querySelector("#boot-screen").style.display = "none";
		document.querySelector(".main-window").style.display = "block";
		
		var music = document.querySelector("#music");
		var bootSound = document.querySelector("#bootSound");
		toggleMute()
		bootSound.pause();
	  }
	}
	
}