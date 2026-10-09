// A room's music, the explore pages' way: it plays unless the visitor muted it (localStorage "muted", shared with
// every room on the site); the speaker in the scene's corner toggles it. Starts once the page has loaded, so the
// track doesn't compete with the room's art; if the browser refuses sound before a touch, it starts on the first one.
(function () {
    "use strict";

    var music = document.getElementById("music");
    var btn = document.getElementById("mute");
    if (!music || !btn) return;
    if (music.dataset.volume) music.volume = parseFloat(music.dataset.volume);   // evens out loud rips

    var muted = false;
    try {
        muted = window.localStorage.getItem("muted") === "true";
    } catch (e) { /* storage blocked: unmuted, this page only */ }

    function show() {
        music.muted = muted;
        btn.style.filter = muted ? "grayscale(100%)" : "grayscale(0%)";
        btn.setAttribute("aria-pressed", muted ? "true" : "false");
    }

    function onFirstTouch() {
        ["pointerdown", "keydown"].forEach(function (ev) { document.removeEventListener(ev, onFirstTouch, true); });
        if (!muted) music.play().catch(function () {});
    }

    function play() {
        music.play().catch(function () {
            ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, onFirstTouch, true); });
        });
    }

    btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();          // not a click on the room (that would advance Panda's line)
        muted = !muted;
        try {
            window.localStorage.setItem("muted", muted);
        } catch (err) { /* storage blocked */ }
        show();
        if (!muted) play();
    });

    show();
    function start() {
        if (!muted) play();
    }
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
})();
