window.onload = function () {
	document.body.addEventListener('click', playmusic, true); 
}
function playmusic() {
	// load the audio
	const music =  document.getElementById("music");

	music.load();
	music.play();
}
