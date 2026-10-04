// Panda's Room: hotspots over the scene, Panda narrating in the dialog box.
// Content (art, polygons, lines, links) lives in js/room-data.js; this file is only mechanics.
(function () {
    "use strict";

    var R = window.ROOM;
    var SVGNS = "http://www.w3.org/2000/svg";
    var TYPE_MS = 22;          // per character for typed lines
    var IDLE_FIRST_MS = 30000; // first idle line after this long without input
    var IDLE_NEXT_MS = 45000;  // then this often...
    var IDLE_MAX = 3;          // ...at most this many per visit
    var GLINT_MS = 9000;
    var SEEN_KEY = "pandaRoomSeen";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var frame = document.getElementById("room-frame");
    var stage = document.getElementById("room-stage");
    var art = document.getElementById("room-art");
    var svg = document.getElementById("room-hotspots");
    var lookBtn = document.getElementById("room-look");
    var textBox = document.getElementById("text-box");
    var text = document.getElementById("room-text");
    var choicesEl = document.getElementById("room-choices");
    var arrow = document.getElementById("text-arrow");

    var byRank = R.objects.slice().sort(function (a, b) { return a.rank - b.rank; });
    // every hotspot: the linked objects by rank, then knick-knacks that are drawn in the scene
    var spots = byRank.concat(R.knickKnacks.filter(function (k) { return k.polygon; }));
    var shapes = {};       // id -> polygon element
    var seen = loadSeen(); // id -> true
    var state = "idle";    // idle | talking | choosing
    var typing = null;     // { timer, line, onDone }
    var advance = null;    // called by click/Enter when a ▼ is showing
    var inGreeting = false; // the opening lines are up; once a box is typed, a hover replaces them
    var announcedAllSeen = allSeen();
    var emptyIdx = 0;
    var idleTimer = null;
    var idleCount = 0;
    var glintIdx = 0;

    // ---------- scene ----------

    function el(tag, attrs, ns) {
        var node = ns ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
        Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
        return node;
    }

    function points(poly) {
        return poly.map(function (p) { return p.join(","); }).join(" ");
    }

    function area(poly) {
        var a = 0;
        for (var i = 0; i < poly.length; i++) {
            var p = poly[i], q = poly[(i + 1) % poly.length];
            a += p[0] * q[1] - q[0] * p[1];
        }
        return Math.abs(a / 2);
    }

    function buildScene() {
        var s = R.scene;
        art.src = s.src;
        document.getElementById("room-standin").hidden = !s.standIn;
        svg.setAttribute("viewBox", "0 0 " + s.width + " " + s.height);

        // dim everything except the hotspots, so the objects read as lit
        var defs = el("defs", {}, true);
        var mask = el("mask", { id: "room-lit" }, true);
        mask.appendChild(el("rect", { width: s.width, height: s.height, fill: "white" }, true));
        spots.forEach(function (o) {
            mask.appendChild(el("polygon", { points: points(o.polygon), fill: "black" }, true));
        });
        defs.appendChild(mask);
        svg.appendChild(defs);
        svg.appendChild(el("rect", { "class": "room-shade", width: s.width, height: s.height, mask: "url(#room-lit)" }, true));

        // largest first, so small objects sit on top and win the pointer where they overlap
        var g = el("g", {}, true);
        spots.slice().sort(function (a, b) { return area(b.polygon) - area(a.polygon); }).forEach(function (o) {
            var poly = el("polygon", {
                "class": "room-hotspot",
                points: points(o.polygon),
                role: "button",
                tabindex: o === spots[0] ? "0" : "-1",
                "aria-label": o.service ? o.name + " (" + o.service + ")" : o.name,
                "data-id": o.id
            }, true);
            poly.addEventListener("mouseenter", function () { hover(o); });
            poly.addEventListener("mouseleave", function () { unhover(o); });
            poly.addEventListener("focus", function () { rove(o); hover(o); });
            poly.addEventListener("blur", function () { unhover(o); });
            poly.addEventListener("click", function (e) { e.stopPropagation(); open(o); });
            poly.addEventListener("keydown", function (e) { hotspotKey(e, o); });
            shapes[o.id] = poly;
            g.appendChild(poly);
        });
        svg.appendChild(g);
        svg.appendChild(el("g", { id: "room-marks" }, true));
        svg.appendChild(el("g", { id: "room-glints" }, true));
        drawMarks();

        // clicking the room itself (not an object)
        stage.addEventListener("click", function () {
            if (state === "talking") { next(); return; }
            say([R.lines.empty[emptyIdx++ % R.lines.empty.length]], toIdle);
        });

        layout();
        if (window.ResizeObserver) new ResizeObserver(layout).observe(frame);
        else window.addEventListener("resize", layout);
    }

    // fit the art in the scene window (on phones the window is as tall as the art, so fit the width)
    var narrow = window.matchMedia("(max-width: 768px)");
    function layout() {
        var s = R.scene;
        var scale = frame.clientWidth / s.width;
        if (!narrow.matches) scale = Math.min(scale, frame.clientHeight / s.height);
        stage.style.width = Math.round(s.width * scale) + "px";
        stage.style.height = Math.round(s.height * scale) + "px";
    }

    function drawMarks() {
        var marks = document.getElementById("room-marks");
        marks.textContent = "";
        spots.forEach(function (o) {
            shapes[o.id].classList.toggle("seen", !!seen[o.id]);
            if (!seen[o.id]) return;
            var x = o.anchor[0], y = o.anchor[1];
            // a small diamond: "you've looked at this"
            marks.appendChild(el("polygon", {
                "class": "room-seen-mark",
                points: points([[x, y - 4], [x + 4, y], [x, y + 4], [x - 4, y]])
            }, true));
        });
    }

    function glint() {
        if (document.hidden) return;
        var unseen = byRank.filter(function (o) { return !seen[o.id]; });
        if (!unseen.length) return;
        var o = unseen[glintIdx++ % unseen.length];
        var x = o.anchor[0], y = o.anchor[1];
        var star = el("polygon", {
            "class": "room-glint",
            points: points([[x, y - 9], [x + 2, y - 2], [x + 9, y], [x + 2, y + 2], [x, y + 9], [x - 2, y + 2], [x - 9, y], [x - 2, y - 2]])
        }, true);
        document.getElementById("room-glints").appendChild(star);
        setTimeout(function () { star.remove(); }, 1300);
    }

    // ---------- dialog ----------

    function show(line, instant, onDone) {
        stopTyping();
        if (instant || reduceMotion) {
            text.textContent = line;
            if (onDone) onDone();
            return;
        }
        var chars = Array.from(line);
        var i = 0;
        text.textContent = "";
        typing = { line: line, onDone: onDone, timer: null };
        (function step() {
            text.textContent += chars[i++];
            if (i < chars.length) {
                typing.timer = setTimeout(step, TYPE_MS);
            } else {
                var done = typing.onDone;
                typing = null;
                if (done) done();
            }
        })();
    }

    function stopTyping() {
        if (typing) clearTimeout(typing.timer);
        typing = null;
    }

    // first click finishes the line being typed, the next one moves on
    function next() {
        if (typing) {
            var done = typing.onDone;
            stopTyping();
            text.textContent = text.dataset.full;
            if (done) done();
        } else if (advance) {
            var go = advance;
            advance = null;
            arrow.hidden = true;
            go();
        }
    }

    // say lines one box at a time (▼ between them), then run `after`
    function say(lines, after, greeting) {
        inGreeting = !!greeting;
        state = "talking";
        clearChoices();
        arrow.hidden = true;
        advance = null;
        var i = 0;
        (function box() {
            text.dataset.full = lines[i];
            show(lines[i], false, function () {
                if (i < lines.length - 1) {
                    arrow.hidden = false;
                    advance = function () { i++; box(); };
                } else if (after) {
                    after();
                } else {
                    toIdle();
                }
            });
        })();
    }

    function toIdle() {
        inGreeting = false;
        state = "idle";
        clearChoices();
        arrow.hidden = true;
        advance = null;
        if (!announcedAllSeen && allSeen()) {
            announcedAllSeen = true;
            say([R.lines.allSeen]);
        }
    }

    function clearChoices() {
        choicesEl.textContent = "";
        choicesEl.classList.remove("room-choices-grid");
    }

    // choices: { label, href } opens a link, { label, copy } copies text, { label, object } opens
    // that object (the LOOK list), { label } goes back to the room
    function offer(choices, grid) {
        state = "choosing";
        clearChoices();
        choicesEl.classList.toggle("room-choices-grid", !!grid);
        choices.forEach(function (c) {
            var item;
            if (c.href) {
                item = el("a", { href: c.href, target: "_blank", rel: "noopener noreferrer" });
                item.addEventListener("click", function () { say([R.lines.leaving]); });
            } else {
                item = el("button", { type: "button" });
                item.addEventListener("click", function (e) {
                    e.stopPropagation();
                    if (c.copy) copy(c.copy);
                    else if (c.object) open(c.object);
                    else say([R.lines.backToRoom]);
                });
            }
            item.className = "room-choice" + (c.dim ? " dim" : "");
            item.setAttribute("role", "menuitem");
            item.textContent = "→ " + c.label;
            item.addEventListener("keydown", choiceKey);
            choicesEl.appendChild(item);
        });
        var first = choicesEl.firstElementChild;
        if (first) first.focus({ preventScroll: true });
    }

    function choiceKey(e) {
        var items = Array.from(choicesEl.children);
        var i = items.indexOf(e.currentTarget);
        var cols = choicesEl.classList.contains("room-choices-grid") ? 2 : 1;
        var to = null;
        if (e.key === "ArrowDown") to = i + cols;
        else if (e.key === "ArrowUp") to = i - cols;
        else if (e.key === "ArrowRight" && cols > 1) to = i + 1;
        else if (e.key === "ArrowLeft" && cols > 1) to = i - 1;
        else if (e.key === "Escape") { e.preventDefault(); say([R.lines.backToRoom]); return; }
        if (to === null) return;
        e.preventDefault();
        items[(to + items.length) % items.length].focus();
    }

    function copy(value) {
        var done = function () { say([R.lines.copied]); };
        var fail = function () { say([R.lines.copyFailed]); };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(value).then(done, fail);
            return;
        }
        var ta = el("textarea", { readonly: "" });
        ta.value = value;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        ta.remove();
        if (ok) done(); else fail();
    }

    // ---------- objects ----------

    function hover(o) {
        shapes[o.id].classList.add("active");
        // a greeting box that's finished typing gives way to the first thing you point at
        if (inGreeting && !typing) toIdle();
        // the line stays up after the pointer leaves (WCAG 1.4.13), until something else replaces it
        if (state === "idle") show(o.hover, true);
    }

    function unhover(o) {
        shapes[o.id].classList.remove("active");
    }

    function open(o) {
        seen[o.id] = true;
        saveSeen();
        drawMarks();
        if (!o.choices) { // a knick-knack: just a line
            say(o.lines);
            return;
        }
        // the first click this visit gets the full lines; clicking again gets the repeat joke
        say(o.visited && o.repeat ? o.repeat : o.click, function () { offer(o.choices); });
        o.visited = true;
    }

    function look() {
        svg.classList.remove("reveal");
        void svg.getBoundingClientRect(); // restart the outline flash
        svg.classList.add("reveal");
        setTimeout(function () { svg.classList.remove("reveal"); }, 1600);

        var list = byRank.concat(R.knickKnacks).map(function (o) {
            return { label: o.name, object: o, dim: seen[o.id] };
        });
        list.push({ label: "Never mind" });
        inGreeting = false;
        state = "talking";
        stopTyping();
        text.dataset.full = R.lines.lookPrompt;
        show(R.lines.lookPrompt, true);
        offer(list, true);
    }

    // keyboard on hotspots: Tab and the arrow keys walk the objects in rank order
    function rove(o) {
        spots.forEach(function (x) { shapes[x.id].setAttribute("tabindex", x === o ? "0" : "-1"); });
    }

    function hotspotKey(e, o) {
        var i = spots.indexOf(o);
        var to = null;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation(); // don't also count as "advance the dialog"
            open(o);
            return;
        }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (i + 1) % spots.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (i - 1 + spots.length) % spots.length;
        else if (e.key === "Tab" && !e.shiftKey && i < spots.length - 1) to = i + 1;
        else if (e.key === "Tab" && e.shiftKey && i > 0) to = i - 1;
        if (to === null) return; // Tab past either end leaves the room as usual
        e.preventDefault();
        shapes[spots[to].id].focus();
    }

    // ---------- seen state (a per-visitor nicety; works without storage too) ----------

    function loadSeen() {
        try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) { return {}; }
    }

    function saveSeen() {
        try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* private mode */ }
    }

    function allSeen() {
        return R.objects.every(function (o) { return seen[o.id]; });
    }

    // ---------- idle lines ----------

    function resetIdle() {
        clearTimeout(idleTimer);
        if (idleCount >= IDLE_MAX) return;
        idleTimer = setTimeout(function () {
            if (state === "idle") say([R.lines.idle[idleCount % R.lines.idle.length]]);
            idleCount++;
            resetIdle();
        }, idleCount === 0 ? IDLE_FIRST_MS : IDLE_NEXT_MS);
    }

    // ---------- wiring ----------

    textBox.addEventListener("click", function (e) {
        if (e.target.closest(".room-choice")) return;
        if (state === "talking") next();
    });

    document.addEventListener("keydown", function (e) {
        if (state !== "talking" || !advance && !typing) return;
        if (e.target.closest && e.target.closest(".room-choice")) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            next();
        }
    });

    lookBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        look();
    });

    ["pointermove", "pointerdown", "keydown", "touchstart"].forEach(function (ev) {
        document.addEventListener(ev, resetIdle, { passive: true });
    });

    buildScene();
    say(R.greeting, null, true);
    resetIdle();
    if (!reduceMotion) setInterval(glint, GLINT_MS);
})();
