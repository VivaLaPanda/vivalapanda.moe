// What there is to do in Explore besides walking: games and things that move or react. Each place's play is a
// function under PLAY, keyed by its location id (js/explore-locations.js), run before the scene starts; it hangs
// choices and actions on the place's objects. Its lines are in dialogue.json, under the place's "play".
// Plain menus need no code: an object's choices in dialogue.json say or pick lines themselves, and a place's
// "menu" (a bar's drinks) is offered after its greeting.
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE;
    var place = (R.dialogue || "").replace(/^explore\./, "");

    function P() { return (R.said && R.said.play) || {}; }
    function obj(id) { return R.objects.filter(function (o) { return o.id === id; })[0]; }
    function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
    function arr(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }
    function rand(a, b) { return a + Math.random() * (b - a); }
    function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private */ } }

    // a full-scene canvas over the picture at a quarter of the scene's 740x528, scaled up crisp
    function overlay() {
        var box = document.createElement("div");
        box.className = "play-overlay";
        var cv = document.createElement("canvas");
        cv.width = 185;
        cv.height = 132;
        box.appendChild(cv);
        ["click", "pointerdown", "pointerup"].forEach(function (ev) {
            box.addEventListener(ev, function (e) { e.stopPropagation(); });
        });
        S.stage.appendChild(box);
        return { box: box, cv: cv, ctx: cv.getContext("2d") };
    }

    function canvasPoint(cv, e) {
        var r = cv.getBoundingClientRect();
        return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height];
    }

    var PLAY = {};

    // ---------- the festival: goldfish scooping ----------

    // a goldfish facing right; b body, f fin/patch, e eye, t tail (two tail frames)
    var FISH = [
        ["....bb...", "t.bbbbb..", "ttbbbbbeb", "t.bbbbb..", "....bb..."],
        ["....bb...", ".tbbbbb..", ".tbbbbbeb", ".tbbbbb..", "....bb..."]
    ];
    var KINDS = [
        { b: "#ff6a2a", f: "#ffb070", n: 6, weight: .22 },
        { b: "#e8331f", f: "#ff9a7a", n: 4, weight: .22 },
        { b: "#fff2e0", f: "#ff6a2a", n: 3, weight: .26, patch: true },   // calico
        { b: "#2a2633", f: "#6a6090", n: 1, weight: .34, fast: true }      // a black demekin: quick and heavy
    ];

    function goldfish() {
        var p = P().goldfish, o = overlay(), cv = o.cv, ctx = o.ctx, W = cv.width, H = cv.height;
        var fish = [], scoops = 3, caught = 0, paper = 1, down = false, x = W / 2, y = H / 2, speed = 0;
        var last = performance.now(), raf = null, over = false, splash = 0;
        KINDS.forEach(function (k) {
            for (var i = 0; i < k.n; i++) {
                fish.push({ k: k, x: rand(20, W - 20), y: rand(20, H - 20), a: rand(0, 6.28), v: rand(9, 15), t: rand(0, 1) });
            }
        });

        function show() {
            S.status(fill(p.status, { scoops: "●".repeat(scoops) + "○".repeat(3 - scoops), fish: caught }));
        }

        function tear() {
            splash = 1;
            scoops--;
            paper = 1;
            down = false;
            if (scoops <= 0) setTimeout(end, 700);
            else show();
        }

        function lift() {
            down = false;
            var got = fish.filter(function (f) { return Math.hypot(f.x - x, f.y - y) < 9; }).slice(0, 2);
            var weight = got.reduce(function (w, f) { return w + f.k.weight; }, 0);
            if (got.length && paper - weight <= 0) { tear(); return; }   // too heavy: the paper goes, the fish too
            paper -= weight;
            got.forEach(function (f) { fish.splice(fish.indexOf(f), 1); });
            caught += got.length;
            show();
        }

        function end() {
            if (over) return;
            over = true;
            cancelAnimationFrame(raf);
            o.box.remove();
            var best = +(get("pandaGoldfish") || 0);
            if (caught > best) put("pandaGoldfish", caught);
            S.say([fill(p.result[Math.min(caught, p.result.length - 1)], { n: caught })]);
        }

        cv.addEventListener("pointerdown", function (e) {
            cv.setPointerCapture(e.pointerId);
            var pt = canvasPoint(cv, e);
            x = pt[0]; y = pt[1];
            down = true;
            speed = 0;
            splash = .6;
        });
        cv.addEventListener("pointermove", function (e) {
            var pt = canvasPoint(cv, e);
            speed = down ? Math.min(6, Math.hypot(pt[0] - x, pt[1] - y)) : 0;
            x = pt[0]; y = pt[1];
        });
        cv.addEventListener("pointerup", function () { if (down) lift(); });

        function step(now) {
            var dt = Math.min(.05, (now - last) / 1000);
            last = now;
            if (down) {                                      // paper soaks; dragging it fast tears it sooner
                paper -= dt * .22 + speed * .006;
                if (paper <= 0) tear();
            }
            speed *= .5;
            splash = Math.max(0, splash - dt * 2);
            fish.forEach(function (f) {
                var d = Math.hypot(f.x - x, f.y - y), fast = f.k.fast ? 1.6 : 1;
                if (down && d < 22 && (splash > .3 || speed > 1.5)) {   // a splash or a fast scoop scatters them
                    f.a = Math.atan2(f.y - y, f.x - x) + rand(-.4, .4);
                    f.v = 30 * fast;
                } else {
                    f.a += rand(-1.5, 1.5) * dt;
                    f.v += (rand(6, 14) * fast - f.v) * dt;
                }
                f.x += Math.cos(f.a) * f.v * dt;
                f.y += Math.sin(f.a) * f.v * dt;
                if (f.x < 12 || f.x > W - 12) { f.a = Math.PI - f.a; f.x = Math.max(12, Math.min(W - 12, f.x)); }
                if (f.y < 12 || f.y > H - 12) { f.a = -f.a; f.y = Math.max(12, Math.min(H - 12, f.y)); }
                f.t += dt * (2 + f.v / 6);
            });
            draw(now);
            if (!over) raf = requestAnimationFrame(step);
        }

        function px(c, X, Y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(X), Math.round(Y), w || 1, h || 1); }

        function draw(now) {
            // the tank from above: blue water, dithered, light bands drifting; a pale plastic rim
            px("#1c3c96", 0, 0, W, H);
            ctx.fillStyle = "#2a52b4";
            var drift = Math.floor(now / 180);
            for (var yy = 6; yy < H - 6; yy++) {
                for (var xx = 6 + (yy % 2); xx < W - 6; xx += 2) {
                    if (((xx + yy * 3 + drift) >> 3) % 5 === 0) ctx.fillRect(xx, yy, 1, 1);
                }
            }
            px("#a9bdff", 0, 0, W, 4); px("#a9bdff", 0, H - 4, W, 4); px("#a9bdff", 0, 0, 4, H); px("#a9bdff", W - 4, 0, 4, H);
            px("#6f84d6", 4, 4, W - 8, 2); px("#6f84d6", 4, 4, 2, H - 8);
            fish.forEach(function (f) {
                var rows = FISH[Math.floor(f.t) % 2], right = Math.cos(f.a) >= 0;
                var ox = f.x - 4, oy = f.y - 2;
                rows.forEach(function (row, ry) {
                    for (var rx = 0; rx < row.length; rx++) {
                        var ch = row[right ? rx : row.length - 1 - rx];
                        if (ch === ".") continue;
                        var c = ch === "e" ? "#101018" : ch === "t" ? f.k.f : f.k.patch && (rx + ry) % 3 === 0 ? f.k.f : f.k.b;
                        px(c, ox + rx, oy + ry);
                    }
                });
            });
            // the scoop: a paper disc on a ring, a stick; under water it's paler and rippled
            var r = 9;
            if (down || splash) {
                ctx.fillStyle = "rgba(200,220,255," + (.35 + splash * .4) + ")";
                for (var a = 0; a < 6.28; a += .2) ctx.fillRect(Math.round(x + Math.cos(a) * (r + 3 + splash * 4)), Math.round(y + Math.sin(a) * (r + 3 + splash * 4)), 1, 1);
            }
            ctx.fillStyle = down ? "rgba(255,255,240,.28)" : "rgba(255,255,240,.6)";
            for (var dy = -r + 1; dy < r; dy++) {
                var half = Math.floor(Math.sqrt((r - 1) * (r - 1) - dy * dy));
                ctx.fillRect(Math.round(x - half), Math.round(y + dy), half * 2 + 1, 1);
            }
            if (paper < .45) { px("#1c3c96", x - 2, y - 1, 3, 1); px("#1c3c96", x + 1, y, 1, 2); }   // it's going
            for (var b = 0; b < 6.28; b += .12) px("#f2e6c4", x + Math.cos(b) * r, y + Math.sin(b) * r);
            for (var s = 0; s < 14; s++) px("#c0782c", x + r * .7 + s * .7, y + r * .7 + s * .7, 2, 1);
        }

        S.say(arr(p.how), function () {
            show();
            S.offer([{ label: p.stop, act: end }]);
            raf = requestAnimationFrame(step);
        });
    }

    PLAY.festival = function () {
        var g = obj("goldfish");
        g.click = function () { return [P().goldfish.intro]; };
        g.choices = function () { var p = P().goldfish; return [{ label: p.play, act: goldfish }, { label: p.watch }]; };
    };

    // ---------- Club Polka: dance ----------

    var DANCE_BPM = 147, DANCE_OFFSET = .173;   // control-your-music.mp3's beat (measured from the track)
    var LANES = ["ArrowLeft", "ArrowDown", "ArrowUp", "ArrowRight"];
    var ARROW = ["....x....", "...xxx...", "..xxxxx..", ".xxxxxxx.", "xxxxxxxxx", "...xxx...", "...xxx...", "...xxx...", "...xxx..."];
    var LANE_INK = ["#ff44aa", "#55ddff", "#55ddff", "#ff44aa"];

    function dance() {
        var p = P().dance, o = overlay(), cv = o.cv, ctx = o.ctx, W = cv.width, H = cv.height;
        var music = document.getElementById("music"), beat = 60 / DANCE_BPM;
        var t0 = performance.now() / 1000, useMusic = music && !music.paused && music.currentTime > 0;
        function now() { return useMusic ? music.currentTime : performance.now() / 1000 - t0; }
        var TRAVEL = 1.5, X0 = 56, LANE_W = 18, TOP = 14;
        var start = Math.ceil((now() + 2.2 - DANCE_OFFSET) / beat) * beat + DANCE_OFFSET;   // two beats' lead-in
        var notes = [];
        for (var i = 0; i < 32; i++) {
            notes.push({ t: start + i * beat, lane: Math.floor(Math.random() * 4) });
            if (i > 12 && i % 4 === 3 && i < 31) notes.push({ t: start + (i + .5) * beat, lane: Math.floor(Math.random() * 4) });
        }
        var score = { perfect: 0, good: 0, miss: 0 }, combo = 0, flash = [0, 0, 0, 0], last = "", over = false, raf;
        o.box.style.background = "transparent";

        function judge(text) { last = text; S.status(fill(p.status, { judge: last, combo: combo })); }

        function hit(lane) {
            var t = now(), best = null;
            notes.forEach(function (n) {
                if (!n.done && n.lane === lane && Math.abs(n.t - t) < .2 && (!best || Math.abs(n.t - t) < Math.abs(best.t - t))) best = n;
            });
            flash[lane] = .15;
            if (!best) return;
            best.done = true;
            var d = Math.abs(best.t - t);
            if (d < .07) { score.perfect++; combo++; judge(p.perfect); }
            else { score.good++; combo++; judge(p.good); }
        }

        function key(e) {
            var lane = LANES.indexOf(e.key);
            if (lane < 0) return;
            e.preventDefault();
            e.stopPropagation();
            if (!e.repeat) hit(lane);
        }
        document.addEventListener("keydown", key, true);
        cv.addEventListener("pointerdown", function (e) {   // phones: tap the lane
            var x = canvasPoint(cv, e)[0], lane = Math.floor((x - X0) / LANE_W);
            if (lane >= 0 && lane < 4) hit(lane);
        });

        function end() {
            if (over) return;
            over = true;
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", key, true);
            o.box.remove();
            var acc = (score.perfect + score.good * .5) / notes.length;
            var line = acc >= .9 ? p.results[0] : acc >= .6 ? p.results[1] : acc >= .3 ? p.results[2] : p.results[3];
            S.say([fill(line, { perfect: score.perfect, n: notes.length })]);
        }

        function arrow(lane, x, y, ink, outline) {
            for (var ry = 0; ry < 9; ry++) {
                for (var rx = 0; rx < 9; rx++) {
                    // rotate the up arrow into the lane's direction
                    var sx = rx, sy = ry;
                    if (lane === 0) { sx = 8 - ry; sy = rx; }
                    else if (lane === 1) { sx = rx; sy = 8 - ry; }
                    else if (lane === 3) { sx = ry; sy = 8 - rx; }
                    if (ARROW[sy][sx] !== "x") continue;
                    var edge = outline && sx > 0 && sx < 8 && sy > 0 && sy < 8 && ARROW[sy - 1][sx] === "x" && ARROW[sy + 1] &&
                               ARROW[sy + 1][sx] === "x" && ARROW[sy][sx - 1] === "x" && ARROW[sy][sx + 1] === "x";
                    if (edge) continue;
                    ctx.fillStyle = ink;
                    ctx.fillRect(x + rx, y + ry, 1, 1);
                }
            }
        }

        function step() {
            var t = now();
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = "rgba(0,0,24,.55)";
            ctx.fillRect(X0 - 3, 0, LANE_W * 4 + 6, H);
            for (var l = 0; l < 4; l++) {
                var lx = X0 + l * LANE_W + 4;
                flash[l] = Math.max(0, flash[l] - 1 / 60);
                arrow(l, lx, TOP, flash[l] > 0 ? "#ffffff" : "#8a9ad8", flash[l] <= 0);
            }
            var left = 0;
            notes.forEach(function (n) {
                if (n.done) return;
                if (t - n.t > .2) { n.done = true; score.miss++; combo = 0; judge(p.miss); return; }
                left++;
                var y = TOP + (n.t - t) / TRAVEL * (H - TOP);
                if (y < H) arrow(n.lane, X0 + n.lane * LANE_W + 4, Math.round(y), LANE_INK[n.lane], false);
            });
            if (!left && t > notes[notes.length - 1].t + .5) { end(); return; }
            raf = requestAnimationFrame(step);
        }

        S.say([useMusic ? p.how : p.how_quiet], function () {
            judge(p.ready);
            S.offer([{ label: p.stop, act: end }]);
            raf = requestAnimationFrame(step);
        });
    }

    PLAY.club = function () {
        var f = obj("floor");
        f.click = function () { return [P().dance.intro]; };
        f.choices = function () { var p = P().dance; return [{ label: p.play, act: dance }, { label: p.watch }]; };
    };

    // ---------- the casino: a panorama you pan along, and roulette ----------

    // casino.png is a 500x134 strip; cover-fitted it's 3.94x, so the window shows a third of it. Three views
    // (object-position 0%, 50%, 100%); clicking near an edge slides to the next. Rects are per view, in scene px.
    var CASINO_S = 528 / 134, CASINO_OX = [0, 615, 1230];
    var CASINO_SPOTS = [
        [{ id: "roulette", src: [62, 42, 92, 64] }],
        [{ id: "bar", src: [180, 20, 140, 114] }],
        [{ id: "poster", src: [425, 15, 65, 95] }]
    ];
    var RED = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    function chips(n) {
        if (n != null) put("pandaChips", n);
        var c = get("pandaChips");
        return c == null ? 100 : +c;
    }

    function spinBall(done) {   // a ball round the wheel's rim, slowing, dropping into the numbers
        var ball = document.createElement("div"), start = performance.now(), a0 = rand(0, 6.28);
        ball.className = "play-ball";
        S.stage.appendChild(ball);
        (function step(now) {
            var t = Math.min(1, (now - start) / 3200), ease = 1 - Math.pow(1 - t, 3);
            var a = a0 + ease * 26, drop = t > .7 ? (t - .7) / .3 : 0;
            var rx = 30 - drop * 5, ry = 13 - drop * 3;
            var sx = 111 + Math.cos(a) * rx, sy = 68 + Math.sin(a) * ry;
            S.placeNative(ball, sx * CASINO_S - CASINO_OX[0] - 6, sy * CASINO_S - 6, 12, 12);
            if (t < 1) requestAnimationFrame(step);
            else setTimeout(function () { ball.remove(); done(); }, 600);
        })(start);
    }

    function roulette() {
        var p = P().roulette;
        function bet(kind) {
            return { label: p.bets[kind], act: function () {
                if (chips() < 10) chips(50);
                S.say([p.no_more_bets], function () {
                    spinBall(function () {
                        var n = Math.floor(Math.random() * 37), color = n === 0 ? p.green : RED.indexOf(n) >= 0 ? p.red : p.black;
                        var win = kind === "red" ? color === p.red && 10 : kind === "black" ? color === p.black && 10 : n === 7 && 350;
                        chips(chips() + (win || -10));
                        var line = fill(p.result, { n: n, color: color, outcome: win ? fill(p.win, { won: win }) : p.lose, chips: chips() });
                        S.say(chips() < 10 ? [line, p.broke] : [line], function () { S.offer(menu()); });
                        if (chips() < 10) chips(50);
                    });
                });
            } };
        }
        function menu() { return [bet("red"), bet("black"), bet("seven"), { label: p.leave }]; }
        S.say([fill(p.intro, { chips: chips() })], function () { S.offer(menu()); });
    }

    PLAY.casino = function () {
        document.addEventListener("scenestart", function () {
            var art = document.getElementById("room-art"), view = 0, hits = [];
            art.style.transition = "object-position .7s ease-in-out";
            function hit(r, label, fn) {
                var d = document.createElement("div");
                d.className = "play-hit";
                d.setAttribute("role", "button");
                d.setAttribute("aria-label", label);
                S.placeNative(d, r[0], r[1], r[2], r[3]);
                d.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
                S.stage.appendChild(d);
                hits.push(d);
            }
            function show(v) {
                view = v;
                art.style.objectPosition = v * 50 + "% 50%";
                hits.forEach(function (d) { d.remove(); });
                hits = [];
                CASINO_SPOTS[v].forEach(function (o) {
                    var r = [o.src[0] * CASINO_S - CASINO_OX[v], o.src[1] * CASINO_S, o.src[2] * CASINO_S, o.src[3] * CASINO_S];
                    hit(r, R.said.objects[o.id].name, o.id === "roulette" ? roulette : function () { S.say(arr(R.said.objects[o.id].lines)); });
                });
                if (v > 0) hit([0, 0, 70, 528], "Look left", function () { show(v - 1); });     // the edges win
                if (v < 2) hit([670, 0, 70, 430], "Look right", function () { show(v + 1); });
            }
            show(0);
        });
    };

    // ---------- the stray cat ----------

    // img/explore/layers/cat.png: six 16x10 frames, drawn in the apartments' inks (black, rim, yellow eyes)
    var CAT = { peek: 0, blink: 1, runA: 2, runB: 3, sit: 4, sleep: 5 };
    var CAT_PATH = "pandaCatPath";   // set once you've chased it: the way it went stays open

    function sprite(frame, cls) {
        var d = document.createElement("div");
        d.className = "play-cat" + (cls ? " " + cls : "");
        d.style.backgroundPosition = CAT[frame] * 20 + "% 0";
        return d;
    }
    function frame(d, f) { d.style.backgroundPosition = CAT[f] * 20 + "% 0"; }
    function rect(r) { return [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]]]; }

    // scamper from x0 to x1 (scene px) at height y, then vanish
    function scamper(d, x0, x1, y, w, h, ms, done) {
        var start = performance.now();
        S.stage.appendChild(d);
        (function step(now) {
            var t = Math.min(1, (now - start) / ms);
            frame(d, Math.floor((now - start) / 90) % 2 ? "runB" : "runA");
            d.style.transform = x1 < x0 ? "scaleX(-1)" : "";
            S.placeNative(d, x0 + (x1 - x0) * t, y, w, h);
            if (t < 1) requestAnimationFrame(step);
            else { d.remove(); if (done) done(); }
        })(start);
    }

    // after ms without a click or a key, run fn (again each time it's re-armed)
    function whenIdle(ms, fn) {
        var t = null;
        function arm() { clearTimeout(t); t = setTimeout(fn, ms); }
        ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, arm, { passive: true }); });
        arm();
        return function () { clearTimeout(t); t = null; ["pointerdown", "keydown"].forEach(function (ev) { document.removeEventListener(ev, arm); }); };
    }

    // a way on that isn't drawn as one: an invisible spot, added after the scene's built
    function hiddenWay(r, to, label) {
        var d = document.createElement("a");
        d.className = "play-hit";
        d.href = to;
        d.setAttribute("aria-label", label);
        d.addEventListener("click", function (e) { e.stopPropagation(); });
        S.placeNative(d, r[0], r[1], r[2], r[3]);
        S.stage.appendChild(d);
    }

    var APT_WALL = [570, 437, 29, 18], APT_PATH = [664, 300, 76, 135];

    PLAY.nightapartments = function () {
        if (get(CAT_PATH)) {   // found before: the gap the cat ran through is a way on
            R.knickKnacks.push({ id: "catpath", rank: 50, go: "?loc=backpassage", polygon: rect(APT_PATH), name: "After the cat" });
            return;
        }
        document.addEventListener("scenestart", function () {
            var stop = null, peeking = false;
            function peek() {
                if (peeking) return;
                peeking = true;
                var box = document.createElement("div"), cat = sprite("peek"), blink, duck;
                box.className = "play-catbox";
                S.placeNative(box, APT_WALL[0], APT_WALL[1], APT_WALL[2], APT_WALL[3]);
                cat.style.transform = "translateY(100%)";
                box.appendChild(cat);
                S.stage.appendChild(box);
                requestAnimationFrame(function () { requestAnimationFrame(function () { cat.style.transform = ""; }); });
                blink = setInterval(function () { frame(cat, "blink"); setTimeout(function () { frame(cat, "peek"); }, 160); }, 2600);
                duck = setTimeout(function () {     // ignored: it gets bored and ducks back down
                    cat.style.transform = "translateY(100%)";
                    clearInterval(blink);
                    setTimeout(function () { box.remove(); peeking = false; }, 600);
                }, 15000);
                cat.addEventListener("click", function (e) {
                    e.stopPropagation();
                    clearInterval(blink);
                    clearTimeout(duck);
                    stop();
                    box.remove();
                    S.say(arr(P().cat_bolts));
                    scamper(sprite("runA"), APT_WALL[0] - 4, 760, APT_WALL[1] + 1, 29, 18, 1100, function () {
                        put(CAT_PATH, "1");
                        hiddenWay(APT_PATH, "?loc=backpassage", "After the cat");
                    });
                });
            }
            stop = whenIdle(9000, peek);
        });
    };

    PLAY.backpassage = function () {
        document.addEventListener("scenestart", function () {
            var cat = sprite("sit"), r = [243, 489, 19, 12];
            S.placeNative(cat, r[0], r[1], r[2], r[3]);
            S.stage.appendChild(cat);
            cat.addEventListener("click", function (e) {
                e.stopPropagation();
                cat.remove();
                S.say(arr(P().cat_runs));
                scamper(sprite("runA", "play-cat-far"), r[0], r[0] - 60, r[1], 19, 12, 900);
            });
        });
    };

    PLAY.catroom = function () {
        var pets = 0, cat = obj("cat");   // (asleep on the cushion: a layer in explore-locations.js)
        cat.choices = function () {
            var p = P();
            return [{ label: p.pet_label, act: function () {
                S.say(arr(p.pets[pets % p.pets.length]), function () { S.offer(cat.choices()); });
                pets++;
            } }, { label: p.leave_label }];
        };
    };

    // ---------- a place's menu (dialogue.json "menu": a bar's drinks, a chat) ----------

    // offered after the greeting, and again after each answer. A choice with "serve" puts that drink in front of
    // you: the place's SERVE spot, drawn in its own inks (img/explore/layers/<prefix><drink>.png)
    var SERVE = {
        cutiebar: { prefix: "rabu-", rect: [179, 258, 26, 50] },
        towerbar: { prefix: "tower-", rect: [459, 214, 17, 17] }
    };
    var served = null;

    function serve(drink) {
        var spot = SERVE[place];
        if (!spot) return;
        if (!served) {
            served = document.createElement("img");
            served.className = "scene-layer scene-pixel";
            served.alt = "";
            S.placeNative(served, spot.rect[0], spot.rect[1], spot.rect[2], spot.rect[3]);
            S.stage.appendChild(served);
        }
        served.src = "/img/explore/layers/" + spot.prefix + drink + ".png";
    }

    function menuOf(list) {
        return list.map(function (c) {
            if (c.menu) return { label: c.label, say: c.say, menu: menuOf(c.menu) };
            if (!c.say && !c.pick) return c;
            return { label: c.label, act: function () {
                if (c.serve) serve(c.serve);
                S.say(c.pick ? [c.pick[Math.floor(Math.random() * c.pick.length)]] : c.say, function () {
                    S.offer(menuOf(R.said.menu));
                });
            } };
        });
    }

    (R.afterGreeting = R.afterGreeting || []).push(function () {
        return R.said && R.said.menu ? menuOf(R.said.menu) : null;
    });

    if (PLAY[place]) PLAY[place]();
})();
