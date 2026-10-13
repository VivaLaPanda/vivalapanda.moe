// A scene: a picture with hotspots, someone narrating in the dialog box. The rooms (js/room-data.js,
// js/living-room-data.js) and every Explore location (js/explore-locations.js) run on this; their data sets
// window.ROOM, and every line anyone says lives in /data/dialogue.json (R.dialogue names the section, e.g.
// "living_room" or "explore.agency"), merged in before the scene starts. This file is only mechanics.
// A scene's data may give a line as a function instead, for state that changes (the living room's lamps), and
// R.onBuilt(api) hands the built scene to its own script. Options, all optional (the rooms use the defaults):
//   R.illegible   Explore's way: no LOOK, no outlines, no glints, no idle or "seen it all" lines, no reply to a click
//                 on nothing (the map is meant to be poked at, not read)
//   R.typeMs      ms per typed character (22)                 R.speaker  the name over the box (from dialogue.json)
//   R.title       the page's title                             R.frame    "dark" for the dark window frame
//   R.holo        the right sidebar's picture                  R.back     where BACK goes when you didn't come from the site
//   R.scene       { src, width, height, fit, pos, layers: [{ src, x, y, w, h, under, pixel, anim }] }  (fit/pos: the
//                 art's object-fit; pixel: crisp scaling; anim: a scene.css animation, scene-anim-<name>)
//   an object's   go (a link), sprite ({ src, x, y, w, h }: a visible button), view (a name in R.views: clicking
//                 swaps to that picture and speaker and back again), choices (may be a function; null: just lines)
//   R.beforeStart  functions run once every page script has loaded, just before the lines are applied
//   R.afterGreeting  functions (scripts push theirs) giving choices to offer once the greeting's typed (or none;
//                 true: it took the box over itself)
// Other scripts (js/house-key.js) drive the box through window.SCENE: say, offer, ask, actions (a choice's
// "action" names one), lines; a choice may also carry act (a function). In dialogue.json a choice can just talk:
// say (its boxes), pick (one of them, at random), or menu (more choices, after its say).
(function () {
    "use strict";

    var R = window.ROOM;
    var SVGNS = "http://www.w3.org/2000/svg";
    var TYPE_MS = R.typeMs || 22;   // per character for typed lines
    var IDLE_FIRST_MS = 30000; // first idle line after this long without input
    var IDLE_NEXT_MS = 45000;  // then this often...
    var IDLE_MAX = 3;          // ...at most this many per visit
    var GLINT_MS = 9000;
    var MAX_LINE = 96;         // characters in two dialog-box lines (longer still wraps, but crowds the menu)
    var DIALOGUE = "/data/dialogue.json";
    var SEEN_KEY = R.seenKey || "pandaRoomSeen";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var frame = document.getElementById("room-frame");
    var stage = document.getElementById("room-stage");
    var art = document.getElementById("room-art");
    var svg = document.getElementById("room-hotspots");
    var lookBtn = document.getElementById("room-look");
    var speakerEl = document.getElementById("room-speaker");
    var view = null;       // the R.views entry showing, if any
    var backBtn = document.getElementById("room-back");
    var textBox = document.getElementById("text-box");
    var text = document.getElementById("room-text");
    var choicesEl = document.getElementById("room-choices");
    var arrow = document.getElementById("text-arrow");

    var byRank = R.objects.slice().sort(function (a, b) { return a.rank - b.rank; });
    // every hotspot: the linked objects by rank, then knick-knacks that are drawn in the scene
    var knickKnacks = R.knickKnacks || [];
    var spots = [];        // filled at start: a room may get its outlines late (R.ready)
    var shapes = {};       // id -> hit polygon (the focusable element)
    var outlines = {};     // id -> exact outline polygon (LOOK's flash)
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

    // place an element over the art by native-pixel rect, in % so it scales with the stage
    function placeNative(node, x, y, w, h) {
        var s = R.scene;
        node.style.left = (100 * x / s.width) + "%";
        node.style.top = (100 * y / s.height) + "%";
        node.style.width = (100 * w / s.width) + "%";
        node.style.height = (100 * h / s.height) + "%";
    }

    function buildScene() {
        var s = R.scene;
        art.src = s.src;
        if (s.fit) art.style.objectFit = s.fit;
        if (s.pos) art.style.objectPosition = s.pos;
        if (R.alt) art.alt = R.alt;
        svg.setAttribute("viewBox", "0 0 " + s.width + " " + s.height);
        if (R.illegible) stage.classList.add("scene-illegible");

        // more pictures in the scene (the penthouse's skyline under its window), and visible buttons (the tower's
        // lobby signs): images at native rects, under or over the art
        (s.layers || []).forEach(function (l) {
            var im = el("img", { src: l.src, alt: "", "class": "scene-layer" + (l.pixel ? " scene-pixel" : "") +
                                                                 (l.anim ? " scene-anim-" + l.anim : "") });
            placeNative(im, l.x, l.y, l.w, l.h);
            if (l.under) { im.style.zIndex = "-1"; stage.insertBefore(im, art); } else stage.insertBefore(im, svg);
        });
        R.objects.concat(knickKnacks).forEach(function (o) {
            if (!o.sprite) return;
            var im = el("img", { src: o.sprite.src, alt: "", "class": "scene-layer" });
            placeNative(im, o.sprite.x, o.sprite.y, o.sprite.w, o.sprite.h);
            stage.insertBefore(im, svg);
        });

        // city lights: step through the twinkle strip's frames, like PC-98 palette cycling
        if (s.twinkle && !reduceMotion) {
            var t = s.twinkle;
            var tw = el("div", { id: "room-twinkle", "aria-hidden": "true" });
            placeNative(tw, t.x, t.y, t.w, t.h);
            tw.style.backgroundImage = "url(" + t.src + ")";
            tw.style.backgroundSize = (t.frames * 100) + "% 100%";
            tw.style.animationDuration = (t.frames / t.fps) + "s";
            tw.style.animationTimingFunction = "steps(" + t.frames + ", jump-none)";
            stage.insertBefore(tw, svg);
        }

        // (no hover glow and no shade over the rest: the user found both made the room's light read wrong;
        // the magnifier cursor and LOOK's outline flash are how things are found)

        // exact outlines, for LOOK's flash (none where the map is meant to stay illegible)
        if (!R.illegible) {
            var og = el("g", {}, true);
            spots.forEach(function (o) {
                outlines[o.id] = el("polygon", { "class": "room-outline", points: points(o.polygon) }, true);
                og.appendChild(outlines[o.id]);
            });
            svg.appendChild(og);
        }

        // hit areas back to front, so the front object wins the pointer where they overlap (the
        // blazer over the window, the console over the TV): the art's zOrder (front to back) when
        // there is one, then largest first, so small objects sit on top
        function hitArea(o) { return o.hit || o.polygon; }
        var z = R.zOrder || [];
        function depth(o) { var i = z.indexOf(o.id); return i < 0 ? z.length : i; }
        var g = el("g", {}, true);
        spots.slice().sort(function (a, b) {
            return (depth(b) - depth(a)) || (area(hitArea(b)) - area(hitArea(a)));
        }).forEach(function (o) {
            var poly = el("polygon", {
                "class": "room-hotspot",
                points: points(hitArea(o)),
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
        svg.appendChild(el("g", { id: "room-glints" }, true));
        markSeen();

        // clicking the room itself (not an object)
        stage.addEventListener("click", function () {
            if (state === "talking") { next(); return; }
            if (R.illegible) return;
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

    // seen state never marks the scene itself: it only shows while LOOK is up (the dimmed names
    // in its list, and a blue rather than pink flash), plus which objects still glint
    function markSeen() {
        spots.forEach(function (o) {
            if (outlines[o.id]) outlines[o.id].classList.toggle("seen", !!seen[o.id]);
        });
    }

    function glint() {
        if (document.hidden) return;
        var unseen = byRank.filter(function (o) { return o.anchor && !seen[o.id]; });
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
        lines = lines.slice();
        var i = 0;
        (function box() {
            var pages = fitPages(lines[i]);
            if (pages.length > 1) lines.splice.apply(lines, [i, 1].concat(pages));
            text.dataset.full = lines[i];
            show(lines[i], false, function () {
                if (i < lines.length - 1) {
                    arrow.hidden = false;
                    advance = function () { i++; box(); };
                } else if (after) {
                    after();
                } else if (!greeting && R.illegible && (R.afterGreeting || []).length) {
                    // a line that ends a branch: one more click goes back to the place's own menu
                    arrow.hidden = false;
                    advance = function () { home(true); };
                } else {
                    toIdle();
                }
            });
        })();
    }

    // the place's default state: its greeting's last line (when coming back to it) and every script's choices
    // together (R.afterGreeting; one returning true took the box over itself)
    function home(reshow) {
        var hooks = R.afterGreeting || [], all = [];
        if (reshow) {
            var g = [].concat(lines(R.greeting) || []), last = g[g.length - 1] || "";
            text.dataset.full = last;
            show(last, true);
        }
        for (var i = 0; i < hooks.length; i++) {
            var c = hooks[i]();
            if (c === true) return;
            all = all.concat(c || []);
        }
        if (all.length) offer(all); else toIdle();
    }

    // split a line into pieces that each fit the dialog box (measured, so it works at any width)
    function fitPages(line) {
        if (typeof line !== "string") return [line];
        text.textContent = line;
        if (!overflowing()) return [line];
        var words = line.split(" "), out = [], cur = "";
        words.forEach(function (w) {
            var next = cur ? cur + " " + w : w;
            text.textContent = next;
            if (overflowing() && cur) { out.push(cur); cur = w; } else cur = next;
        });
        if (cur) out.push(cur);
        text.textContent = "";
        return out;
    }

    function toIdle() {
        inGreeting = false;
        state = "idle";
        clearChoices();
        arrow.hidden = true;
        advance = null;
        if (!R.illegible && !announcedAllSeen && allSeen()) {
            announcedAllSeen = true;
            say([R.lines.allSeen]);
        }
    }

    function clearChoices() {
        choicesEl.textContent = "";
        choicesEl.classList.remove("room-choices-grid", "room-choices-grid3");
    }

    // choices: { label, href } opens a link, { label, copy } copies text, { label, object } opens
    // that object (the LOOK list), { label } goes back to the room
    // a menu too tall for the dialog box shows a page at a time, with "More..." to go on (and round again)
    function overflowing() { return textBox.scrollHeight > textBox.clientHeight + 2; }

    function offer(choices, grid, page) {
        page = page || 0;
        renderChoices(choices, grid);
        if (!overflowing() || choices.length < 3) return;
        var fit = choices.length;
        while (fit > 1 && overflowing()) {   // shrink the page (leaving room for "More...") until it fits
            fit--;
            renderChoices(choices.slice(0, fit).concat([{ label: "x" }]), grid);
        }
        var pages = Math.ceil(choices.length / fit), start = (page % pages) * fit;
        var more = { label: (R.lines && R.lines.more) || "More...", act: function () { offer(choices, grid, page + 1); } };
        renderChoices(choices.slice(start, start + fit).concat([more]), grid);
    }

    function renderChoices(choices, grid) {
        state = "choosing";
        clearChoices();
        choicesEl.classList.toggle("room-choices-grid", !!grid);
        choicesEl.classList.toggle("room-choices-grid3", grid === 3);   // longer names: three columns
        choices.forEach(function (c) {
            var item;
            if (c.href) {
                // other sites open in a new tab; the site's own pages (the reading list) in this one
                item = /^https?:/.test(c.href)
                    ? el("a", { href: c.href, target: "_blank", rel: "noopener noreferrer" })
                    : el("a", { href: c.href });
                item.addEventListener("click", function () { say([R.lines.leaving]); });
            } else {
                item = el("button", { type: "button" });
                item.addEventListener("click", function (e) {
                    e.stopPropagation();
                    if (c.copy) copy(c.copy);
                    else if (c.object) open(c.object);
                    else if (c.act) c.act();
                    else if (c.action && SCENE.actions[c.action]) SCENE.actions[c.action](c);
                    else if (c.menu) say(c.say || [R.lines.lookPrompt], function () { offer(c.menu); });
                    else if (c.say) say(c.say);
                    else if (c.pick) say([c.pick[Math.floor(Math.random() * c.pick.length)]]);
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
        var cols = choicesEl.classList.contains("room-choices-grid")
            ? getComputedStyle(choicesEl).gridTemplateColumns.split(" ").length : 1;
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
        if (inGreeting && !typing && state !== "choosing") toIdle();   // never a menu that's up
        // the line stays up after the pointer leaves (WCAG 1.4.13), until something else replaces it
        if (state === "idle" && o.hover != null) show(lines(o.hover), true);
    }

    function unhover(o) {
        shapes[o.id].classList.remove("active");
    }

    // a line, or a function giving it now (a room with live state)
    function lines(x) {
        return typeof x === "function" ? x() : x;
    }

    function open(o) {
        seen[o.id] = true;
        saveSeen();
        markSeen();
        if (o.go) {       // a door: its hover line says where it goes, a click goes there
            window.location.href = o.go;
            return;
        }
        if (o.view) {     // a picture of its own (the tower bar's regular): there, and back again
            showView(view === R.views[o.view] ? null : R.views[o.view]);
            return;
        }
        var choices = lines(o.choices);
        if (!choices) {   // a knick-knack: just a line
            say(lines(o.lines));
            return;
        }
        // the first click this visit gets the full lines; clicking again gets the repeat joke
        say(lines(o.visited && o.repeat ? o.repeat : o.click || o.lines), function () { offer(choices); });
        o.visited = true;
    }

    // swap the scene to one of R.views ({ src, pos, speaker, greeting }), or back to its own (null)
    function showView(v) {
        view = v;
        var d = v || { src: R.scene.src, pos: R.scene.pos, speaker: R.speaker, greeting: R.greeting };
        art.src = d.src;
        art.style.objectPosition = d.pos || "";
        if (d.speaker) speakerEl.textContent = d.speaker;
        say(lines(d.greeting));
    }

    // a typed answer: the prompt, then a text field in the menu's place; Enter hands its value to onAnswer
    function ask(prompt, onAnswer) {
        say(prompt, function () {
            state = "choosing";
            clearChoices();
            var input = el("input", { type: "text", "class": "room-input", maxlength: "80", autocomplete: "off",
                                      autocapitalize: "off", spellcheck: "false", "aria-label": prompt[prompt.length - 1] });
            input.addEventListener("click", function (e) { e.stopPropagation(); });
            input.addEventListener("keydown", function (e) {
                e.stopPropagation();
                if (e.key === "Enter") { e.preventDefault(); onAnswer(input.value); }
                else if (e.key === "Escape") { e.preventDefault(); say([R.lines.backToRoom]); }
            });
            choicesEl.appendChild(input);
            input.focus({ preventScroll: true });
        });
    }

    function look() {
        svg.classList.remove("reveal");
        void svg.getBoundingClientRect(); // restart the outline flash
        svg.classList.add("reveal");
        setTimeout(function () { svg.classList.remove("reveal"); }, 1600);

        var list = spots.map(function (o) {
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
        if (R.illegible) return;
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

    // BACK: the page before this one if it was on this site, else the room's own way out (R.back); with neither
    // (the living room opened directly) there's nowhere to go, so no button
    function cameFromSite() {
        try {
            return history.length > 1 && !!document.referrer && new URL(document.referrer).origin === location.origin;
        } catch (e) {
            return false;
        }
    }

    if (backBtn && (cameFromSite() || R.back)) {
        backBtn.hidden = false;
        backBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            if (cameFromSite()) history.back();
            else window.location.href = R.back;
        });
    }

    ["pointermove", "pointerdown", "keydown", "touchstart"].forEach(function (ev) {
        document.addEventListener(ev, resetIdle, { passive: true });
    });

    // ---------- dialogue ----------

    // the room's section of dialogue.json onto R and its objects (keys starting with _ are notes; a field the data
    // gives as a function stays, and reads R.said itself)
    function applyDialogue(all) {
        var parent = null, d = all;
        R.dialogue.split(".").forEach(function (k) { parent = d; d = d && d[k]; });   // "explore.agency": a nested one
        if (!d) {
            d = { objects: {}, greeting: ["Hm, my lines didn't load. Try reloading?"], lines: FALLBACK_LINES };
            console.warn("dialogue: no section " + R.dialogue + " in " + DIALOGUE);
        }
        d.objects = d.objects || {};
        R.said = d;
        R.dialogueAll = all || {};
        if (typeof R.greeting !== "function") R.greeting = d.greeting;
        R.lines = d.lines || (parent && parent !== all && parent.lines) || FALLBACK_LINES;
        if (d.speaker) R.speaker = d.speaker;
        if (R.views) {
            Object.keys(R.views).forEach(function (k) {              // a view's words live beside the scene's
                var vt = d.views && d.views[k];
                if (vt) { R.views[k].speaker = vt.speaker; R.views[k].greeting = vt.greeting; }
            });
        }
        R.objects.concat(knickKnacks).forEach(function (o) {
            var t = d.objects[o.id] || {};
            Object.keys(t).forEach(function (k) {
                if (k.charAt(0) !== "_" && typeof o[k] !== "function") o[k] = t[k];
            });
            if (!o.name) o.name = o.id;
            if (!o.choices && !o.lines) o.lines = ["..."];
        });
        checkLengths(d, R.dialogue);
    }

    var FALLBACK_LINES = { empty: ["..."], idle: ["..."], allSeen: "...", leaving: "...", backToRoom: "...",
                           lookPrompt: "Look at:", copied: "Copied!", copyFailed: "That didn't copy." };

    // a warning for any line too long for the box, so hand edits show up in the console
    function checkLengths(x, path) {
        if (typeof x === "string") {
            if (x.length > MAX_LINE && !/^(https?:|mailto:|\/)/.test(x)) {
                console.warn("dialogue: " + path + " is " + x.length + " characters (max " + MAX_LINE + "): " + x);
            }
        } else if (x && typeof x === "object") {
            Object.keys(x).forEach(function (k) {
                if (k.charAt(0) !== "_" && k !== "href" && k !== "copy") checkLengths(x[k], path + "." + k);
            });
        }
    }

    function start() {
        // only what has an outline (the living room's come from its scene; without one, only the doors' fallbacks)
        spots = byRank.concat(knickKnacks).filter(function (o) { return o.polygon; });
        if (R.speaker) speakerEl.textContent = R.speaker;
        if (R.title) document.title = R.title;
        if (R.frame === "dark") document.getElementById("frame").style.backgroundImage = "url(/img/background-frame-dark.png)";
        if (R.holo) document.getElementById("right-sidebar").style.backgroundImage = "url(" + R.holo + ")";
        if (R.illegible) lookBtn.hidden = true;
        buildScene();
        if (R.onBuilt) R.onBuilt({ stage: stage, art: art, svg: svg, placeNative: placeNative });
        say(lines(R.greeting), (R.afterGreeting || []).length ? function () { home(false); } : null, true);
        document.dispatchEvent(new Event("scenestart"));
        resetIdle();
        if (!reduceMotion && !R.illegible) setInterval(glint, GLINT_MS);
    }

    // status: a line shown at once, without changing what the box is doing (a minigame's score)
    function status(line) { stopTyping(); text.textContent = line; }

    var SCENE = window.SCENE = { say: say, offer: offer, ask: ask, lines: lines, actions: {}, status: status,
                                 toIdle: toIdle, home: home, stage: stage, placeNative: placeNative };

    // a room's own setup (R.ready: the living room loads its scene first) and the lines, then the room
    Promise.all([
        fetch(DIALOGUE, { cache: "no-cache" }).then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        }).catch(function (err) {
            console.warn("dialogue unavailable:", err);
            return null;
        }),
        R.ready || null,
        new Promise(function (ok) {   // every page script has run, so all their hooks are in
            if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ok); else ok();
        })
    ]).then(function (got) {
        (R.beforeStart || []).forEach(function (f) { f(); });
        applyDialogue(got[0]);
        start();
    });
})();
