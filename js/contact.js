// The contact page's VN choice menu. Panda types out the question; each choice opens its link (or copies the
// Discord handle) and she answers it, and the menu stays up so you can pick another. The choices are plain links in
// the HTML, so without JS the page still works.
// Lines follow Panda's Room's rules: real VN lines where they fit (sources below), <= 48 characters, straight quotes.
(function () {
    var LINES = {
        // DDLC, Monika: "Don't be shy, I'd love to see what you wrote." (interpolated)
        twitter: "Don't be shy, I'd love to hear from you.",
        // Katawa Shoujo, Misha (verbatim; the room's phone line is built from it too)
        signal: "Don't worry, your secret's safe with me.",
        // Katawa Shoujo, Rin: "You can call me Rin." (interpolated, as on the room's phone)
        discord: "Copied! You can call me vivalapanda.",
        discordFail: "Huh? It didn't copy... it's vivalapanda!",
        // the room's letter line, with the address for anyone without a mail app
        letter: "Write to me@panda.moe, okay? I'll write back."
    };
    var TYPE_MS = 32;

    var text = document.getElementById("contact-text");
    var menu = document.getElementById("contact-choices");
    var choices = Array.prototype.slice.call(menu.querySelectorAll(".contact-choice"));
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var typing = null;

    function finish() {
        if (!typing) return;
        clearTimeout(typing.timer);
        text.textContent = typing.line;
        typing = null;
        menu.classList.remove("waiting");
    }

    // types a line the PC-98 way, a character at a time; a click or key finishes it at once
    function say(line, then) {
        finish();
        if (reduceMotion) {
            text.textContent = line;
            if (then) then();
            return;
        }
        var i = 0;
        typing = { line: line };
        text.textContent = "";
        (function step() {
            text.textContent = line.slice(0, ++i);
            if (i < line.length) typing.timer = setTimeout(step, TYPE_MS);
            else { typing = null; if (then) then(); }
        })();
    }

    function copy(value, done, fail) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(done, fail);
            return;
        }
        var ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
        ta.remove();
        (ok ? done : fail)();
    }

    choices.forEach(function (choice) {
        choice.addEventListener("click", function () {
            var key = choice.dataset.line;
            if (!key) return; // a plain link (the room): just go
            choice.classList.add("dim");
            if (choice.dataset.copy) {
                copy(choice.dataset.copy,
                    function () { say(LINES.discord); },
                    function () { say(LINES.discordFail); });
            } else {
                say(LINES[key]);
            }
        });
        // arrow keys move through the menu like a PC-98 game's cursor
        choice.addEventListener("keydown", function (e) {
            var i = choices.indexOf(choice), to = null;
            if (e.key === "ArrowDown") to = (i + 1) % choices.length;
            else if (e.key === "ArrowUp") to = (i - 1 + choices.length) % choices.length;
            if (to === null) return;
            e.preventDefault();
            choices[to].focus();
        });
    });

    // a click or Enter/Space anywhere in the box finishes the typing early
    document.getElementById("text-box").addEventListener("click", finish);
    document.addEventListener("keydown", function (e) {
        if (typing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); finish(); }
    });

    // the question types out, then the menu appears
    menu.classList.add("waiting");
    say(text.textContent, function () { menu.classList.remove("waiting"); });
})();
