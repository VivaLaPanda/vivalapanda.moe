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
    // things you've heard around town (a rumour, a mumble) open choices elsewhere: a choice's "need"
    function heard(flag) { return get("pandaHeard_" + flag) === "1"; }
    function hear(flag) {   // one flag or a list of them
        [].concat(flag || []).forEach(function (f) { put("pandaHeard_" + f, "1"); });
    }
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
            if (caught) pocket("goldfish_bag");
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

    // ---------- the festival: ring toss ----------

    // a marker sweeps along a row of pegs; click (or Space) to throw; a ring that lands within a hair of a peg
    // rings it. Three rings, two ringers for the prize (a fox mask, to your pockets)
    function ringToss() {
        var p = P().ringtoss, o = overlay(), cv = o.cv, ctx = o.ctx, W = cv.width, H = cv.height;
        var PEGS = [36, 64, 92, 120, 148], ROW = 66, rings = 3, ringers = 0, landed = [], flying = null, over = false, raf;
        var t0 = performance.now(), speed = 1.1;
        function marker(now) { return 24 + (Math.sin((now - t0) / 1000 * speed * 2) * .5 + .5) * 136; }
        function px(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); }
        function ring(x, y, col) {
            for (var a = 0; a < 6.28; a += .25) px(col, x + Math.cos(a) * 6, y + Math.sin(a) * 2);
        }
        function show(extra) { S.status(fill(p.status, { rings: rings, ringers: ringers }) + (extra ? "   " + extra : "")); }
        function end() {
            if (over) return;
            over = true;
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", key, true);
            o.box.remove();
            if (ringers >= 2) pocket("fox_mask");
            S.say(arr(ringers >= 2 ? p.won : ringers === 1 ? p.close : p.none), function () { S.home(false); });
        }
        function toss() {
            if (flying || rings <= 0 || over) return;
            rings--;
            flying = { x: marker(performance.now()), t: 0 };
            show();
        }
        function key(e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); e.stopPropagation(); toss(); } }
        document.addEventListener("keydown", key, true);
        cv.addEventListener("pointerdown", toss);
        (function step(now) {
            px("#7a3a1e", 0, 0, W, H);                                     // the stall's back boards
            for (var x = 0; x < W; x += 12) px("#5a2a14", x, 0, 1, 92);
            px("#c06a3a", 0, 88, W, 6); px("#e8a070", 0, 88, W, 1);          // the counter's edge
            px("#3a1a0a", 0, 94, W, H - 94);
            PEGS.forEach(function (x, i) {                                  // bottles on a shelf
                px("#2a6a3a", x - 3, ROW - 14, 7, 16); px("#4aaa5a", x - 2, ROW - 13, 1, 12);
                px("#2a6a3a", x - 1, ROW - 20, 3, 6); px("#ffcc33", x - 1, ROW - 21, 3, 1);
            });
            px("#a05a2e", 10, ROW + 2, W - 20, 3);
            landed.forEach(function (l) { ring(l.x, l.y, l.hit ? "#ffee55" : "#aa8833"); });
            if (!flying && rings > 0) {                                     // the aim marker
                var m = marker(now);
                px("#ff3333", m - 2, 8, 5, 1); px("#ff3333", m - 1, 9, 3, 1); px("#ff3333", m, 10, 1, 1);
            }
            if (flying) {
                flying.t += 1 / 40;
                var k = flying.t, y = H - 10 - (H - 10 - (ROW - 18)) * k, arc = Math.sin(k * Math.PI) * 30;
                ring(W / 2 + (flying.x - W / 2) * k, y - arc, "#ffee55");
                if (k >= 1) {
                    var peg = PEGS.filter(function (x) { return Math.abs(x - flying.x) < 3.5; })[0];
                    if (peg != null) { ringers++; landed.push({ x: peg, y: ROW - 6, hit: true }); show(p.ringer); }
                    else { landed.push({ x: flying.x, y: ROW + 4, hit: false }); show(p.miss); }
                    flying = null;
                    speed += .35;
                    if (rings <= 0) setTimeout(end, 800);
                }
            }
            if (!over) raf = requestAnimationFrame(step);
        })(performance.now());
        S.say(arr(p.how), function () { show(); S.offer([{ label: p.stop, act: end }]); });
    }

    PLAY.festival = function () {
        S.actions.ringtoss = ringToss;
        var g = obj("goldfish");
        g.click = function () {
            var best = +(get("pandaGoldfish") || 0), p = P().goldfish;
            return [p.intro].concat(best ? [fill(p.best, { n: best })] : []);
        };
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

    // ---------- the game centre: the claw machine ----------

    // prizes go in your pockets (localStorage pandaPockets; js/house-key.js shows them by the dialog box's ▼)
    var PLUSHES = ["cat", "tabby", "duck", "goldfish", "panda"];
    var plushImg = {};
    PLUSHES.forEach(function (n) { var im = new Image(); im.src = "/img/explore/layers/plush-" + n + ".png"; plushImg[n] = im; });

    function pocket(id) {
        var got = [];
        try { got = JSON.parse(get("pandaPockets")) || []; } catch (e) { got = []; }
        got.push(id);
        put("pandaPockets", JSON.stringify(got));
        document.dispatchEvent(new Event("pockets"));
    }

    function pockets() { try { return JSON.parse(get("pandaPockets")) || []; } catch (e) { return []; } }
    function has(id) { return pockets().indexOf(id) >= 0; }
    function unpocket(id) {
        var got = pockets(), i = got.indexOf(id);
        if (i >= 0) got.splice(i, 1);
        put("pandaPockets", JSON.stringify(got));
        document.dispatchEvent(new Event("pockets"));
    }

    // giving: a place or an object can accept things from your pockets (dialogue.json "accepts": item id ->
    // { label, say, take (it's theirs now), pocket (they give you something back), hear (a flag) })
    function givesFor(accepts, after) {
        return Object.keys(accepts || {}).filter(function (id) {
            var a = accepts[id];
            return has(id) && (!a.need || heard(a.need)) && (!a.unless || !heard(a.unless));
        }).map(function (id) {
            var a = accepts[id];
            return { label: a.label, act: function () {
                if (a.take) unpocket(id);
                if (a.pocket && !has(a.pocket)) pocket(a.pocket);
                if (a.action && S.actions[a.action]) S.actions[a.action]();   // a game effect (the casino's chips)
                hear(a.hear);
                S.say(arr(a.say), after);
            } };
        });
    }

    function claw() {
        var p = P().claw, o = overlay(), cv = o.cv, ctx = o.ctx, W = cv.width, H = cv.height;
        var CHUTE = 18, TOP = 14, FLOOR = 118, tries = 3, over = false, raf, last = performance.now();
        var c = { x: CHUTE, tx: CHUTE, y: TOP, state: "aim", hold: null, open: 1 };   // aim|down|grab|up|home|drop
        var pile = [];
        for (var i = 0; i < 14; i++) {   // a heap of plushes on the floor (one panda, somewhere awkward)
            var kind = i === 0 ? "panda" : PLUSHES[Math.floor(Math.random() * 4)];
            pile.push({ kind: kind, x: rand(42, 168), y: FLOOR - 10 - rand(0, 14) });
        }
        pile.sort(function (a, b) { return a.y - b.y; });

        function show(extra) { S.status(fill(p.status, { tries: tries }) + (extra ? "   " + extra : "")); }

        function drop() {
            if (c.state !== "aim" || tries <= 0) return;
            tries--;
            c.state = "down";
            show();
        }

        function settle(line) {   // back to aiming, or the end
            c.state = "aim";
            c.hold = null;
            if (tries <= 0) setTimeout(function () { end(line); }, 900);
            else show(line);
        }

        function end(line) {
            if (over) return;
            over = true;
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", key, true);
            o.box.remove();
            S.say(arr(line || p.done));
        }

        function key(e) {
            if (e.key === "ArrowLeft") c.tx = Math.max(CHUTE, c.tx - 6);
            else if (e.key === "ArrowRight") c.tx = Math.min(W - 14, c.tx + 6);
            else if (e.key === " " || e.key === "Enter") drop();
            else return;
            e.preventDefault();
            e.stopPropagation();
        }
        document.addEventListener("keydown", key, true);
        cv.addEventListener("pointermove", function (e) { if (c.state === "aim") c.tx = Math.max(CHUTE, Math.min(W - 14, canvasPoint(cv, e)[0])); });
        cv.addEventListener("pointerdown", function (e) { c.tx = Math.max(CHUTE, Math.min(W - 14, canvasPoint(cv, e)[0])); });
        cv.addEventListener("pointerup", drop);

        function topAt(x) {   // the highest plush under x
            var hit = null;
            pile.forEach(function (q) { if (Math.abs(q.x + 6 - x) < 6 && (!hit || q.y < hit.y)) hit = q; });
            return hit;
        }

        function step(now) {
            var dt = Math.min(.05, (now - last) / 1000);
            last = now;
            if (c.state === "aim") c.x += (c.tx - c.x) * Math.min(1, dt * 6);
            else if (c.state === "down") {
                var under = topAt(c.x), stop = under ? under.y - 4 : FLOOR - 6;
                c.y += 40 * dt;
                if (c.y >= stop) {
                    c.y = stop;
                    c.state = "grab";
                    c.open = 1;
                }
            } else if (c.state === "grab") {
                c.open -= dt * 2.5;
                if (c.open <= 0) {
                    c.open = 0;
                    var q = topAt(c.x), centred = q && Math.abs(q.x + 6 - c.x) < 5;
                    if (q && centred && Math.random() < (q.kind === "panda" ? .4 : .75)) {
                        c.hold = q;
                        pile.splice(pile.indexOf(q), 1);
                    }
                    c.state = "up";
                }
            } else if (c.state === "up") {
                c.y -= 30 * dt;
                if (c.hold && c.y < 60 && Math.random() < dt * .5) {   // it slips...
                    c.hold.y = FLOOR - 10;
                    pile.push(c.hold);
                    c.hold = null;
                    show(p.slipped);
                }
                if (c.y <= TOP) { c.y = TOP; c.state = c.hold ? "home" : "aim"; if (!c.hold) settle(p.missed); }
            } else if (c.state === "home") {
                c.x -= 30 * dt;
                if (c.x <= CHUTE) {
                    c.x = CHUTE;
                    var won = c.hold.kind;
                    pocket(won);
                    c.open = 1;
                    settle(won === "panda" ? p.panda : fill(p.won, { name: p.names[won] }));
                }
            }
            if (c.state === "aim" || c.state === "home") c.open = c.state === "aim" ? 1 : 0;
            draw();
            if (!over) raf = requestAnimationFrame(step);
        }

        function px(col, x, y, w, h) { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); }

        function draw() {
            px("#1a1a55", 0, 0, W, H);                                    // the cabinet's back
            for (var yy = 0; yy < H; yy += 2) for (var xx = (yy / 2) % 2; xx < W; xx += 4) px("#22227a", xx, yy);
            px("#ffdd88", 0, 0, W, 6); px("#ffffff", 0, 2, W, 1);         // the light strip
            px("#333355", 0, 9, W, 2);                                    // the rail
            px("#000000", 4, FLOOR - 26, CHUTE + 6, H);                   // the chute
            px("#8899cc", CHUTE + 10, FLOOR - 28, 2, H);
            px("#555588", 0, FLOOR, W, H - FLOOR);                        // the floor
            pile.forEach(function (q) { ctx.drawImage(plushImg[q.kind], Math.round(q.x), Math.round(q.y)); });
            px("#aab0c8", c.x - .5, 10, 1, c.y - 10);                     // the cable
            px("#d0d4e8", c.x - 4, c.y, 9, 3); px("#ffffff", c.x - 3, c.y, 4, 1);   // the claw's head
            var spread = 2 + c.open * 3;                                  // and its fingers
            for (var f = 0; f < 6; f++) {
                px("#d0d4e8", c.x - spread - f * .3, c.y + 3 + f, 1, 1);
                px("#d0d4e8", c.x + spread + f * .3, c.y + 3 + f, 1, 1);
            }
            if (c.hold) ctx.drawImage(plushImg[c.hold.kind], Math.round(c.x - 6), Math.round(c.y + 5));
            px("rgba(255,255,255,.18)", 150, 0, 6, H); px("rgba(255,255,255,.12)", 160, 0, 2, H);   // the glass
        }

        S.say([p.how], function () {
            show();
            S.offer([{ label: p.stop, act: function () { end(); } }]);
            raf = requestAnimationFrame(step);
        });
    }

    function purikura() {   // a photo booth: a flash, and a sticker in your pockets
        var p = P().purikura, flash = document.createElement("div");
        S.say(arr(p.pose), function () {
            flash.className = "play-flash";
            S.stage.appendChild(flash);
            setTimeout(function () { flash.remove(); }, 450);
            pocket("sticker");
            S.say(arr(p.printed), function () { S.home(false); });
        });
    }

    PLAY.gamecentre = function () {
        S.actions.purikura = purikura;
        var m = obj("claw");
        m.click = function () { return arr(P().claw.intro); };
        m.choices = function () { var p = P().claw; return [{ label: p.play, act: claw }, { label: p.watch }]; };
    };

    // ---------- the harbour: fishing off the pier ----------

    // cast, wait for the float to go under, then click (or Space) within a moment; too soon and it's gone
    var FLOAT = [31, 66];   // on the water, canvas px

    function fish() {
        var p = P().fishing, o = overlay(), cv = o.cv, ctx = o.ctx, raf, over = false;
        var bite = performance.now() + rand(2500, 8000), window_ms = 750, state = "wait";
        o.box.style.background = "transparent";
        function px(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w || 1, h || 1); }
        function finish(lines, item) {
            if (over) return;
            over = true;
            cancelAnimationFrame(raf);
            document.removeEventListener("keydown", key, true);
            o.box.remove();
            if (item) pocket(item);
            S.say(lines, function () { S.home(false); });
        }
        function reel() {
            var now = performance.now();
            if (state === "wait") { finish([p.too_soon]); return; }
            if (state !== "bite") return;
            var pool = p.catches.filter(function (c) { return !c.need || heard(c.need); });
            var roll = Math.random() * pool.reduce(function (n, c) { return n + c.weight; }, 0), got = pool[0];
            for (var i = 0; i < pool.length; i++) { roll -= pool[i].weight; if (roll <= 0) { got = pool[i]; break; } }
            if (got.keep && has(got.keep)) { finish(arr(got.release || got.say)); return; }   // one's enough
            finish(arr(got.say), got.pocket || got.keep);
        }
        function key(e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); e.stopPropagation(); reel(); } }
        document.addEventListener("keydown", key, true);
        cv.addEventListener("pointerdown", reel);
        (function step(now) {
            ctx.clearRect(0, 0, 185, 132);
            if (state === "wait" && now >= bite) { state = "bite"; S.status(p.bite); }
            if (state === "bite" && now > bite + window_ms) { finish([p.got_away]); return; }
            var bob = state === "bite" ? 2 : Math.round(Math.sin(now / 400));
            for (var t = 0; t < 1; t += .015) {                           // the line, from you at the rail out to the float
                px("#cfd8ff", 160 - (160 - FLOAT[0]) * t, 132 - (132 - FLOAT[1]) * (1 - (1 - t) * (1 - t)), 1, 1);
            }
            if (state !== "bite") { px("#ff3333", FLOAT[0] - 1, FLOAT[1] - 2 + bob, 3, 2); px("#ffffff", FLOAT[0] - 1, FLOAT[1] + bob, 3, 1); }
            else for (var r = 3; r < 7; r += 2) for (var a = 0; a < 6.28; a += .5) px("#cfd8ff", FLOAT[0] + Math.cos(a) * r, FLOAT[1] + Math.sin(a) * r * .5, 1, 1);
            if (!over) raf = requestAnimationFrame(step);
        })(performance.now());
        S.say([p.cast], function () { S.status(p.waiting); S.offer([{ label: p.stop, act: function () { finish([p.reel_in]); } }]); });
    }

    PLAY.harbour = function () { S.actions.fish = fish; };

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
        S.actions.ruris_ace = function () { chips(chips() * 2); };
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
                hit([70, 478, 570, 50], "Back out to Main Street", function () { location.href = "?loc=mainstreet"; });
                if (v > 0) hit([0, 0, 70, 528], "Look left", function () { show(v - 1); });     // the edges win
                if (v < 2) hit([670, 0, 70, 430], "Look right", function () { show(v + 1); });
            }
            show(0);
        });
    };

    // ---------- ambient life: particles over the picture, in its own inks ----------

    // a canvas over the scene at a quarter of its 740x528 (each dot one fat pixel, like the art's), not clickable;
    // draw(ctx, dt, t) each frame; still for visitors who prefer less motion
    function ambient(draw) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        document.addEventListener("scenestart", function () {
            var cv = document.createElement("canvas");
            cv.width = 185;
            cv.height = 132;
            cv.className = "play-ambient";
            S.stage.appendChild(cv);
            var ctx = cv.getContext("2d"), last = performance.now();
            (function step(now) {
                var dt = Math.min(.1, (now - last) / 1000);
                last = now;
                if (!document.hidden) { ctx.clearRect(0, 0, 185, 132); draw(ctx, dt, now / 1000); }
                requestAnimationFrame(step);
            })(last);
        });
    }

    function fireflies(region, n, core, glow) {   // region [x, y, w, h] in canvas px
        var flies = [];
        for (var i = 0; i < n; i++) {
            flies.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]),
                         a: rand(0, 6.28), phase: rand(0, 6.28), rate: rand(.5, 1.1) });
        }
        ambient(function (ctx, dt, t) {
            flies.forEach(function (f) {
                f.a += rand(-1.2, 1.2) * dt;
                f.x += Math.cos(f.a) * 3 * dt;
                f.y += Math.sin(f.a) * 2 * dt;
                if (f.x < region[0] || f.x > region[0] + region[2]) f.a = Math.PI - f.a;
                if (f.y < region[1] || f.y > region[1] + region[3]) f.a = -f.a;
                var b = Math.sin(t * f.rate * 2 + f.phase);   // a slow blink: dark half the time
                if (b < .1) return;
                var x = Math.round(f.x), y = Math.round(f.y);
                if (b > .6) {
                    ctx.fillStyle = glow;
                    ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x, y + 1, 1, 1);
                }
                ctx.fillStyle = core;
                ctx.fillRect(x, y, 1, 1);
            });
        });
    }

    function steam(region, inks, most) {   // wisps rising off water, thinning as they go (dithered, never blended)
        var puffs = [];
        most = most || 44;
        ambient(function (ctx, dt, t) {
            if (puffs.length < most && Math.random() < dt * most / 3) {
                puffs.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]),
                             age: 0, life: rand(2.5, 4.5), drift: rand(-2, 2), ink: inks[Math.floor(Math.random() * inks.length)] });
            }
            puffs = puffs.filter(function (p) { return p.age < p.life; });
            puffs.forEach(function (p) {
                p.age += dt;
                p.y -= 5 * dt;
                p.x += (p.drift + Math.sin(t + p.y * .3)) * dt;
                var k = p.age / p.life, x = Math.round(p.x), y = Math.round(p.y), frame = Math.floor(t * 6);
                ctx.fillStyle = p.ink;
                // a 5x3 wisp, fewer of its pixels as it fades: a checker that thins out
                for (var dy = 0; dy < 3; dy++) {
                    for (var dx = 0; dx < 5; dx++) {
                        if ((dy === 0 || dy === 2) && (dx === 0 || dx === 4)) continue;   // rounded
                        if ((dx + dy + frame) % 2 && k > .3) continue;
                        if (k > .7 && (dx + dy * 2 + frame) % 3) continue;
                        ctx.fillRect(x + dx, y + dy, 1, 1);
                    }
                }
            });
        });
    }

    // a train's headlights coming up the tunnel now and then: two dots from the vanishing point, spreading and
    // growing, a flash as it reaches the platform (vp: the tunnel's vanishing point, canvas px)
    function headlights(vp, every) {
        var next = 6, t = -1;
        ambient(function (ctx, dt) {
            next -= dt;
            if (t < 0 && next <= 0) { t = 0; next = every + rand(0, every / 2); }
            if (t < 0) return;
            t += dt / 3.2;
            if (t >= 1) { t = -1; return; }
            var k = t * t * t, gap = 1 + k * 40, size = Math.max(1, Math.round(k * 5)), y = vp[1] + k * 50;
            [-1, 1].forEach(function (side) {
                var x = Math.round(vp[0] + side * gap / 2);
                ctx.fillStyle = "#ffddbb";
                for (var dy = -size; dy <= size; dy++) {       // a dithered glow round each lamp
                    for (var dx = -size; dx <= size; dx++) {
                        if ((dx + dy) % 2 === 0 && dx * dx + dy * dy <= size * size * 2) ctx.fillRect(x + dx, Math.round(y) + dy, 1, 1);
                    }
                }
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - (size >> 1), Math.round(y) - (size >> 1), Math.max(1, size), Math.max(1, size));
            });
            if (t > .9) {                                      // it's here: the platform lights up for a moment
                ctx.fillStyle = "rgba(255,255,230," + (1 - t) * 4 + ")";
                ctx.fillRect(0, 0, 185, 132);
            }
        });
    }

    // rain on the city's outdoor night streets: about one hour in three, the same hour everywhere
    var RAINY = ["mainstreet", "partystreet", "nightalley", "shizukastreet", "nightplaza", "nightresidential",
                 "nightresidential2", "nightapartments", "nightresidential_girl", "backpassage", "oldhouse", "ramen"];
    function raining() {
        var hour = Math.floor(Date.now() / 3600000), x = Math.sin(hour * 12.9898) * 43758.5453;
        return x - Math.floor(x) < .33;
    }
    function rain() {
        var drops = [], splashes = [];
        for (var i = 0; i < 120; i++) drops.push({ x: rand(0, 200), y: rand(-132, 132), v: rand(140, 190) });
        ambient(function (ctx, dt) {
            ctx.fillStyle = "#bbccff";
            drops.forEach(function (d) {
                d.y += d.v * dt;
                d.x -= d.v * .25 * dt;
                if (d.y > 132) {
                    if (Math.random() < .5) splashes.push({ x: d.x, y: rand(110, 131), age: 0 });
                    d.y = rand(-20, 0);
                    d.x = rand(0, 215);
                }
                for (var k = 0; k < 5; k++) ctx.fillRect(Math.round(d.x + k * .25), Math.round(d.y - k), 1, 1);   // a streak
            });
            splashes = splashes.filter(function (sp) { return (sp.age += dt) < .15; });
            splashes.forEach(function (sp) {
                ctx.fillRect(Math.round(sp.x - 1), Math.round(sp.y), 1, 1);
                ctx.fillRect(Math.round(sp.x + 1), Math.round(sp.y), 1, 1);
            });
        });
    }

    // the rooftop's shooting stars: one now and then; click the sky while it's falling to wish on it
    var starAt = -1e9;
    function shootingStars() {
        var star = null, next = 4;
        ambient(function (ctx, dt, t) {
            next -= dt;
            if (!star && next <= 0) {
                star = { x: rand(60, 180), y: rand(4, 30), age: 0 };
                next = rand(6, 14);
                starAt = performance.now();
            }
            if (!star) return;
            star.age += dt;
            var k = star.age / .9;
            if (k >= 1) { star = null; return; }
            var hx = star.x - k * 55, hy = star.y + k * 22;
            for (var i = 0; i < 9; i++) {                      // a tail that thins out
                if (i > 3 && i % 2) continue;
                ctx.fillStyle = i < 2 ? "#ffffff" : "#aaccff";
                ctx.fillRect(Math.round(hx + i * 2.5), Math.round(hy - i), 1, 1);
            }
        });
    }

    PLAY.rooftop = function () {
        shootingStars();
        obj("sky").lines = function () {
            var p = P();
            if (performance.now() - starAt > 1500) return arr(p.no_star);
            var n = +(get("pandaWishes") || 0) + 1;
            put("pandaWishes", n);
            return n === 3 ? arr(p.third_wish) : [p.wishes[Math.floor(Math.random() * p.wishes.length)]];
        };
    };

    // a beacon's beam sweeping round from a light (canvas px), seen side-on: it reaches out left, shrinks as it
    // turns toward you (a flash), reaches out right, then goes round the back
    function beacon(o) {
        ambient(function (ctx, dt, t) {
            var a = t * .8, reach = Math.cos(a), front = Math.sin(a);
            if (front < -.6) return;                                 // round the back
            if (front > .92) {                                       // facing us
                ctx.fillStyle = "#ffffff";
                for (var r = 1; r < 4; r++) for (var k = 0; k < 8; k++) ctx.fillRect(Math.round(o[0] + Math.cos(k) * r), Math.round(o[1] + Math.sin(k) * r), 1, 1);
            }
            var len = 30 + 110 * Math.abs(reach), dir = reach < 0 ? -1 : 1;
            for (var d = 2; d < len; d++) {                           // a widening cone, dithered thinner with distance
                var half = 1 + d * .1, x = Math.round(o[0] + dir * d);
                for (var w = -half; w <= half; w++) {
                    var y = Math.round(o[1] - d * .16 + w);   // up over the dark sky
                    if ((x + y) % 2 || (d > 70 && (x * 3 + y) % 3 === 0)) continue;
                    ctx.fillStyle = d < 10 ? "#ffffff" : "#ffff00";
                    ctx.fillRect(x, y, 1, 1);
                }
            }
        });
    }

    // water rushing past a boat: streaks born at the river's vanishing point that grow and spread toward you,
    // hidden behind the bow (picture px, mapped to the canvas with s and ox)
    function river(vp, s, ox, bow) {
        var streaks = [];
        function at(sx, sy) { return [(sx * s - ox) / 4, sy * s / 4]; }
        ambient(function (ctx, dt) {
            if (streaks.length < 40 && Math.random() < dt * 20) streaks.push({ p: 0, lane: rand(-1, 1), v: rand(.35, .55) });
            streaks = streaks.filter(function (k) { return k.p < 1; });
            streaks.forEach(function (k) {
                k.p += k.v * dt * (0.4 + k.p * 1.6);                // slow far away, quick up close
                var sx = vp[0] + k.lane * (6 + k.p * 70), sy = vp[1] + k.p * k.p * 55;
                if (sx > bow[0] && sx < bow[1] && sy > bow[2]) return;
                var c = at(sx, sy), len = 1 + Math.round(k.p * 4);
                ctx.fillStyle = k.p < .5 ? "#bbbbcc" : "#ffffff";
                ctx.fillRect(Math.round(c[0]), Math.round(c[1]), len, 1);
            });
        });
    }

    // jellyfish drifting up in the water outside the aquarium's tunnel, their bells pulsing
    function jellyfish(n, region) {
        var jellies = [];
        for (var i = 0; i < n; i++) jellies.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]), ph: rand(0, 6.28), v: rand(1.5, 3) });
        ambient(function (ctx, dt, t) {
            jellies.forEach(function (j) {
                j.y -= j.v * dt;
                if (j.y < region[1] - 10) { j.y = region[1] + region[3]; j.x = rand(region[0], region[0] + region[2]); }
                var pulse = Math.sin(t * 2.4 + j.ph), w = 3 + (pulse > 0 ? 1 : 0), x = Math.round(j.x + Math.sin(t * .6 + j.ph) * 3), y = Math.round(j.y);
                ctx.fillStyle = "#70d0f1";
                for (var dx = -w; dx <= w; dx++) ctx.fillRect(x + dx, y + 2, 1, 1);                  // the bell's rim
                for (var dx2 = -w + 1; dx2 <= w - 1; dx2++) ctx.fillRect(x + dx2, y + 1, 1, 1);
                for (var dx3 = -w + 2; dx3 <= w - 2; dx3++) ctx.fillRect(x + dx3, y, 1, 1);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(x - 1, y + 1, 1, 1);
                ctx.fillStyle = "#4b98e0";
                for (var k = -1; k <= 1; k++) {                                                      // tentacles, waving
                    for (var l = 0; l < 4; l++) ctx.fillRect(x + k * 2 + Math.round(Math.sin(t * 3 + l + k) * .8), y + 3 + l, 1, 1);
                }
            });
        });
    }

    // the festival's fireworks, far off over the skyline: a rocket, a burst of dithered sparks that fall and fade
    function fireworks(region, inks, every) {
        var shells = [], next = 3;
        ambient(function (ctx, dt) {
            next -= dt;
            if (next <= 0) {
                next = rand(every * .5, every * 1.5);
                shells.push({ x: rand(region[0], region[0] + region[2]), y: region[1] + region[3], top: rand(region[1], region[1] + region[3] * .6),
                              t: 0, ink: inks[Math.floor(Math.random() * inks.length)], sparks: null });
            }
            shells = shells.filter(function (sh) { return sh.t < 3.2; });
            shells.forEach(function (sh) {
                sh.t += dt;
                if (!sh.sparks) {                                         // rising
                    sh.y -= 30 * dt;
                    ctx.fillStyle = "#ffffff";
                    ctx.fillRect(Math.round(sh.x), Math.round(sh.y), 1, 1);
                    if (sh.y <= sh.top) {
                        sh.sparks = [];
                        for (var i = 0; i < 18; i++) { var a = i / 18 * 6.28; sh.sparks.push({ a: a, v: rand(7, 10) }); }
                        sh.burst = sh.t;
                    }
                    return;
                }
                var k = sh.t - sh.burst;
                if (k > 1.8) return;
                sh.sparks.forEach(function (sp, i) {
                    if (k > 1.1 && (i + Math.floor(k * 10)) % 2) return;     // thinning as they fade
                    var r = sp.v * Math.min(k, .8) / .8 * 1.6;
                    ctx.fillStyle = k < .3 ? "#ffffff" : sh.ink;
                    ctx.fillRect(Math.round(sh.x + Math.cos(sp.a) * r), Math.round(sh.top + Math.sin(sp.a) * r + k * k * 3), 1, 1);
                });
            });
        });
    }

    // a campfire's embers: sparks rising, wobbling, winking out
    function embers(at) {
        var sparks = [];
        ambient(function (ctx, dt) {
            if (Math.random() < dt * 14) sparks.push({ x: at[0] + rand(-4, 4), y: at[1], life: rand(1, 2.2), age: 0, wob: rand(0, 6) });
            sparks = sparks.filter(function (sp) { return (sp.age += dt) < sp.life; });
            sparks.forEach(function (sp) {
                sp.y -= 9 * dt;
                var x = Math.round(sp.x + Math.sin(sp.age * 4 + sp.wob) * 1.5);
                ctx.fillStyle = sp.age < sp.life * .5 ? "#ffdd66" : "#ff7733";
                if (sp.age < sp.life * .85 || Math.floor(sp.age * 20) % 2) ctx.fillRect(x, Math.round(sp.y), 1, 1);
            });
        });
    }

    // laundry tumbling behind a washing machine's round window: a few socks and shirts going round, with a lurch
    function tumble(c, r) {
        var bits = [{ a: 0, ink: "#c06a6a" }, { a: 2.1, ink: "#e8e0c8" }, { a: 4.2, ink: "#7a9ac8" }, { a: 1, ink: "#d8c070" }];
        ambient(function (ctx, dt, t) {
            var spin = t * 3 + Math.sin(t * 1.3) * .8;
            bits.forEach(function (b, i) {
                var a = b.a + spin, rr = r * (.45 + .25 * Math.sin(t * 2 + i));
                ctx.fillStyle = b.ink;
                var x = Math.round(c[0] + Math.cos(a) * rr), y = Math.round(c[1] + Math.sin(a) * rr + 1);
                ctx.fillRect(x, y, 2, 1);
                ctx.fillRect(x, y + 1, 1, 1);
            });
        });
    }

    // a soft noise bed under the music (made, not recorded: no files): rain on the night streets, crickets in the
    // hills at night. Only after a touch (browsers' sound rules) and never if the visitor muted the site
    function soundBed(kind) {
        var started = false;
        function start() {
            if (started) return;
            started = true;
            var muted = false;
            try { muted = localStorage.getItem("muted") === "true"; } catch (e) { /* storage blocked */ }
            var AC = window.AudioContext || window.webkitAudioContext;
            if (muted || !AC) return;
            var ac = new AC(), out = ac.createGain();
            out.gain.value = 0;
            out.connect(ac.destination);
            out.gain.linearRampToValueAtTime(kind === "rain" ? .05 : .03, ac.currentTime + 3);
            if (kind === "rain") {                        // brown-ish noise through a bandpass: rain on pavement
                var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0), last = 0;
                for (var i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
                var src = ac.createBufferSource(), bp = ac.createBiquadFilter();
                src.buffer = buf; src.loop = true; bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = .4;
                src.connect(bp); bp.connect(out); src.start();
            } else {                                      // crickets: short chirps on a high tone, irregular
                (function chirp() {
                    var t = ac.currentTime;
                    for (var k = 0; k < 3; k++) {
                        var o = ac.createOscillator(), g = ac.createGain();
                        o.frequency.value = 4200 + Math.random() * 300; g.gain.value = 0;
                        g.gain.setValueAtTime(0, t + k * .06); g.gain.linearRampToValueAtTime(.5, t + k * .06 + .01);
                        g.gain.linearRampToValueAtTime(0, t + k * .06 + .04);
                        o.connect(g); g.connect(out); o.start(t + k * .06); o.stop(t + k * .06 + .05);
                    }
                    setTimeout(chirp, rand(500, 1800));
                })();
            }
            var mute = document.getElementById("mute");   // the site's speaker button mutes this too
            if (mute) mute.addEventListener("click", function () { out.gain.value = out.gain.value ? 0 : (kind === "rain" ? .05 : .03); });
        }
        ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, start, { once: true }); });
    }
    if (RAINY.indexOf(place) >= 0 && (raining() || /[?&]rain\b/.test(location.search))) soundBed("rain");
    if (place === "campsite") soundBed("crickets");

    // December (or ?season=winter): snow on the outdoor places, drifting, never in a hurry
    function winter() {
        return /[?&]season=winter\b/.test(location.search) || new Date().getMonth() === 11 || (new Date().getMonth() === 0 && new Date().getDate() <= 7);
    }
    var SNOWY = RAINY.concat(["nightpark", "festival", "shrine", "forestedge", "rooftop", "nightplaza", "hilltop", "campsite"]);
    if (SNOWY.indexOf(place) >= 0 && winter()) {
        var flakes = [];
        for (var fi = 0; fi < 70; fi++) flakes.push({ x: rand(0, 185), y: rand(0, 132), v: rand(5, 11), ph: rand(0, 6) });
        ambient(function (ctx, dt, t) {
            ctx.fillStyle = "#ffffff";
            flakes.forEach(function (f) {
                f.y += f.v * dt;
                if (f.y > 132) { f.y = -2; f.x = rand(0, 185); }
                ctx.fillRect(Math.round(f.x + Math.sin(t * .8 + f.ph) * 2), Math.round(f.y), 1, 1);
            });
        });
    }

    // shrine petals on the river, drifting downstream
    function petals(region, n) {
        var ps = [];
        for (var i = 0; i < n; i++) ps.push({ x: rand(region[0], region[0] + region[2]), y: rand(region[1], region[1] + region[3]), v: rand(2, 4) });
        ambient(function (ctx, dt, t) {
            ps.forEach(function (p, i) {
                p.x -= p.v * dt; p.y += p.v * .5 * dt;
                if (p.x < region[0] || p.y > region[1] + region[3]) { p.x = region[0] + region[2]; p.y = rand(region[1], region[1] + region[3] * .5); }
                ctx.fillStyle = (i + Math.floor(t * 2)) % 3 ? "#e86a8a" : "#ffb0c4";
                ctx.fillRect(Math.round(p.x), Math.round(p.y + Math.sin(t + i) * .6), 1, 1);
            });
        });
    }

    var AMBIENT = {
        underbridge: function () { petals([75, 60, 110, 70], 14); },
        laundromat: function () { tumble([8, 96], 5); },
        campsite: function () { embers([92, 72]); },
        rooftop: function () { fireworks([20, 30, 150, 30], ["#ffddbb", "#aaccff", "#eebb11"], 7); },
        penthouse: function () { fireworks([30, 15, 120, 25], ["#ff6688", "#ffdd55", "#88ddff"], 9); },
        aquarium: function () { jellyfish(7, [8, 6, 170, 70]); },
        riverboat: function () { river([175, 139], 528 / 273, 63.2, [148, 192, 158]); },
        harbour: function () { beacon([37, 43]); },
        trainplatform: function () { headlights([130, 46], 30); },
        forestedge: function () { fireflies([0, 25, 152, 66], 18, "#ffffff", "#99cc66"); },
        smallbathhouse: function () { steam([0, 64, 185, 28], ["#ffffff", "#bdceff"]); },
        ramen: function () {   // off the two pots, either side of the chef (not over his face)
            steam([80, 62, 17, 3], ["#ffffff", "#ffddcc"], 12);
            steam([120, 61, 16, 3], ["#ffffff", "#ffddcc"], 12);
        }
    };
    if (AMBIENT[place]) AMBIENT[place]();
    if (RAINY.indexOf(place) >= 0 && (raining() || /[?&]rain\b/.test(location.search))) rain();   // ?rain to see it

    // ---------- Johnny's rumours: one at a time, in order, each pointing somewhere ----------

    PLAY.agency = function () {
        S.actions.askjohnny = function () {   // type anything; Johnny answers if he knows the word
            var p = P().ask;
            S.ask(arr(p.prompt), function (q) {
                var words = " " + q.toLowerCase().replace(/[^a-z0-9' ]+/g, " ") + " ", hit = p.topics.filter(function (t) {
                    return t.keys.some(function (k) { return words.indexOf(" " + k + " ") >= 0; });   // whole words
                })[0];
                if (!q.trim()) { S.home(false); return; }
                S.say(arr(hit ? hit.say : p.unknown[Math.floor(Math.random() * p.unknown.length)]), function () { S.home(false); });
            });
        };
        (R.afterGreeting = R.afterGreeting || []).push(function () {
            var p = P();
            if (!p.rumours) return null;
            function tell() {
                var i = +(get("pandaRumour") || 0) % p.rumours.length, r = p.rumours[i];
                put("pandaRumour", i + 1);
                hear(r.hear);
                S.say(arr(r.say), function () { S.offer([{ label: p.rumour_label, act: tell }]); });
            }
            return [{ label: p.rumour_label, act: tell }];
        });
    };

    PLAY.ramen = function () { hear("taisho_met"); };

    // the girl on the residential street, once she has her charm back: gone (
    // the picture is the same street with her painted out: night_residential_empty.png)
    PLAY.nightresidential_girl = function () {
        if (!heard("ghost_free")) return;
        R.objects = R.objects.filter(function (o) { return o.id !== "girl"; });
        document.addEventListener("scenestart", function () {
            var art = document.getElementById("room-art");
            art.src = "/img/explore/pathways/night_residential_empty.png";
            var poly = document.querySelector("#room-hotspots .room-hotspot[data-id='girl']");
            if (poly) poly.remove();
        });
    };

    // Izakaya Gonta, under the tracks: every so often a train goes over and the whole place shakes
    PLAY.izakaya = function () {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        document.addEventListener("scenestart", function () {
            (function rumble() {
                setTimeout(function () {
                    S.stage.classList.add("play-rumble");
                    setTimeout(function () { S.stage.classList.remove("play-rumble"); rumble(); }, 1600);
                }, rand(20000, 40000));
            })();
        });
    };

    // Net Cafe Noa: post on the old forum, and somebody, somewhere, still answers
    PLAY.netcafe = function () {
        var booth = obj("booth");
        booth.click = function () {   // in the small hours the screen isn't quite itself
            var t = R.said.objects.booth;
            if (new Date().getHours() >= 5 || !t.click_late) return arr(t.click);
            var g = document.createElement("div");
            g.className = "play-glitch";
            S.stage.appendChild(g);
            setTimeout(function () { g.remove(); }, 1400);
            return arr(t.click_late);
        };
        S.actions.post = function () {
            var p = P().forum;
            S.ask(arr(p.prompt), function (msg) {
                if (!msg.trim()) { S.home(false); return; }
                S.say([fill(p.posted, { msg: msg.trim().slice(0, 40) }), p.replies[Math.floor(Math.random() * p.replies.length)]], function () { S.home(false); });
            });
        };
    };

    // ---------- Ruri's high-low: guess the next card; three in a row wins her ace ----------

    PLAY.cardroom = function () {
        var CARDS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        function draw(not) { var c; do { c = Math.floor(Math.random() * 13); } while (c === not); return c; }
        S.actions.highlow = function () {
            var p = P().highlow, card = draw(-1), streak = 0;
            function deal(line) {
                S.say([line], function () {
                    S.offer([{ label: p.higher, act: function () { guess(1); } }, { label: p.lower, act: function () { guess(-1); } },
                             { label: p.fold, act: function () { S.say(arr(p.folded), function () { S.home(false); }); } }]);
                });
            }
            function guess(dir) {
                var next = draw(card), right = (next - card) * dir > 0;
                card = next;
                if (!right) { S.say([fill(p.wrong, { card: CARDS[next] })], function () { S.home(false); }); return; }
                streak++;
                if (streak >= 3) {
                    if (!has("ace")) pocket("ace");
                    S.say([fill(p.right, { card: CARDS[next] })].concat(arr(p.won)), function () { S.home(false); });
                    return;
                }
                deal(fill(p.right, { card: CARDS[next] }) + " " + p.again);
            }
            deal(fill(p.first, { card: CARDS[card] }));
        };
    };

    // ---------- the hill observatory: tonight's moon, as it really is ----------

    function moonAge() {   // days since a new moon (synodic month 29.53 days; new moon 2000-01-06 18:14 UTC)
        var days = (Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
        return ((days % 29.530589) + 29.530589) % 29.530589;
    }
    function moonName(age) {
        var p = P().moon.phases;
        return p[Math.floor((age / 29.530589) * 8 + .5) % 8];
    }
    function drawMoon(age) {   // a lit disc: the terminator's ellipse moves across as the month goes
        var cv = document.createElement("canvas"), n = 48, ctx;
        cv.width = cv.height = n;
        ctx = cv.getContext("2d");
        var f = age / 29.530589, k = Math.cos(f * 2 * Math.PI), waxing = f < .5;
        for (var y = 0; y < n; y++) {
            for (var x = 0; x < n; x++) {
                var dx = (x + .5 - n / 2) / (n / 2), dy = (y + .5 - n / 2) / (n / 2);
                if (dx * dx + dy * dy > 1) continue;
                var edge = Math.sqrt(1 - dy * dy), t = dx / edge;           // -1 at the left limb, 1 at the right
                var lit = waxing ? t > k : t < -k;
                var crater = [[20, 18, 12], [30, 28, 20], [15, 32, 8], [33, 14, 6], [24, 38, 10]].some(function (c) {
                    return (x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]) < c[2];   // a few seas, like the real one
                });
                ctx.fillStyle = lit ? (crater ? "#c8c4b0" : ((x + y) % 2 ? "#f4f0dc" : "#e8e2c8")) : ((x + y) % 2 ? "#1a1a2a" : "#22223a");
                ctx.fillRect(x, y, 1, 1);
            }
        }
        return cv;
    }
    // join the stars: click them, lines follow your clicks; when they're all joined the constellation draws itself
    var CONSTELLATIONS = [
        { id: "dipper", stars: [[40, 40], [62, 44], [80, 52], [98, 60], [104, 84], [130, 86], [128, 62]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
        { id: "cat", stars: [[72, 52], [80, 42], [104, 42], [112, 52], [112, 74], [92, 86], [72, 74], [68, 34], [116, 34],
                             [84, 62], [100, 62], [92, 72]],
          lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [7, 0], [7, 1], [8, 2], [8, 3], [9, 11], [10, 11]] },
        { id: "panda", stars: [[78, 48], [106, 48], [114, 66], [92, 86], [70, 66],              // the head
                               [68, 32], [76, 26], [84, 32], [76, 40], [100, 32], [108, 26], [116, 32], [108, 40],   // ears
                               [80, 58], [86, 64], [80, 70], [104, 58], [98, 64], [104, 70]],    // eye patches
          lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 6], [6, 7], [7, 8], [8, 5], [9, 10], [10, 11], [11, 12], [12, 9],
                  [13, 14], [14, 15], [15, 13], [16, 17], [17, 18], [18, 16]] }
    ];
    function stars() {
        var p = P().stars, c = CONSTELLATIONS[Math.floor(Math.random() * CONSTELLATIONS.length)];
        var o = overlay(), cv = o.cv, ctx = o.ctx, clicked = [], done = false, t0 = performance.now(), raf;
        function draw(now) {
            ctx.fillStyle = "#06061a"; ctx.fillRect(0, 0, 185, 132);
            for (var i = 0; i < 120; i++) { ctx.fillStyle = i % 7 ? "#2a2a4a" : "#5a5a8a"; ctx.fillRect((i * 53) % 185, (i * 31) % 132, 1, 1); }
            ctx.strokeStyle = done ? "#ffe9a0" : "#8a9ad8"; ctx.lineWidth = 1;
            var pairs = done ? c.lines : clicked.slice(1).map(function (s, i) { return [clicked[i], s]; });
            pairs.forEach(function (l) {
                var a = c.stars[l[0]], b = c.stars[l[1]];
                ctx.beginPath(); ctx.moveTo(a[0] + .5, a[1] + .5); ctx.lineTo(b[0] + .5, b[1] + .5); ctx.stroke();
            });
            c.stars.forEach(function (st, i) {
                var on = clicked.indexOf(i) >= 0, tw = Math.sin((now - t0) / 300 + i) > 0;
                ctx.fillStyle = on ? "#fff6c0" : (tw ? "#ffffff" : "#c8c8ff");
                ctx.fillRect(st[0] - 1, st[1], 3, 1); ctx.fillRect(st[0], st[1] - 1, 1, 3);
            });
            if (!done) raf = requestAnimationFrame(draw);
        }
        cv.addEventListener("pointerdown", function (e) {
            if (done) return;
            var pt = canvasPoint(cv, e), best = -1, bd = 1e9;
            c.stars.forEach(function (st, i) { var dd = Math.hypot(st[0] - pt[0], st[1] - pt[1]); if (dd < bd) { bd = dd; best = i; } });
            if (bd > 12 || clicked.indexOf(best) >= 0) return;
            clicked.push(best);
            if (clicked.length === c.stars.length) {
                done = true; cancelAnimationFrame(raf); draw(performance.now());
                S.say(arr(p.names[c.id]), function () { S.offer([{ label: p.stop, act: function () { o.box.remove(); S.home(false); } }]); });
            }
        });
        S.say(arr(p.how), function () { S.offer([{ label: p.stop, act: function () { cancelAnimationFrame(raf); o.box.remove(); S.home(false); } }]); });
        raf = requestAnimationFrame(draw);
    }

    PLAY.observatory = function () {
        S.actions.stars = stars;
        S.actions.moon = function () {
            var age = moonAge(), view = document.createElement("div"), cv = drawMoon(age);
            view.className = "play-telescope";
            view.style.background = "#05050c";
            cv.style.cssText = "position:absolute;left:50%;top:48%;width:44%;transform:translate(-50%,-50%);image-rendering:pixelated";
            view.appendChild(cv);
            S.stage.appendChild(view);
            function away(e) { if (e) e.stopPropagation(); view.remove(); S.home(false); }
            view.addEventListener("click", away);
            S.say([fill(P().moon.seen, { phase: moonName(age), days: Math.round(age) })], function () { S.offer([{ label: P().moon.stop, act: away }]); });
        };
    };

    // the girl under the bridge: she counts the petals; sometimes a wish floats by, and sometimes it's yours
    PLAY.underbridge = function () {
        S.actions.wishes = function () {
            var p = P(), mine = get("pandaEma");
            S.say(mine ? [fill(p.your_wish, { wish: mine })].concat(arr(p.hope)) : arr(p.no_wish), function () { S.home(false); });
        };
    };

    // ---------- the shrine's ema: write a wish on a wooden plaque; it's still hanging next time ----------

    PLAY.shrine = function () {
        S.actions.ema = function () {
            var p = P().ema, mine = get("pandaEma");
            if (mine) { S.say([fill(p.still, { wish: mine })], function () { S.home(false); }); return; }
            S.ask(arr(p.prompt), function (wish) {
                wish = wish.trim().slice(0, 60);
                if (!wish) { S.home(false); return; }
                put("pandaEma", wish);
                S.say(arr(p.hung), function () { S.home(false); });
            });
        };
    };

    // ---------- Erratic Errata's staff door: the garden, once you know to ask ----------

    PLAY.weirdstore = function () {
        var door = obj("backdoor");
        if (heard("secondedition")) door.go = "?loc=zengarden";
    };

    // ---------- the zen garden behind Erratic Errata ----------

    PLAY.zengarden = function () {
        S.actions.sit = function () {
            var p = P(), m = document.getElementById("music"), was = m && !m.paused;
            if (was) m.pause();
            S.say([p.sit], function () {
                var done = false;
                function up() {
                    if (done) return;
                    done = true;
                    document.removeEventListener("pointerdown", up, true);
                    if (was) m.play().catch(function () {});
                    S.say([p.stand], function () { S.home(false); });
                }
                setTimeout(up, 20000);
                setTimeout(function () { document.addEventListener("pointerdown", up, true); }, 400);
            });
        };
    };

    // ---------- the night bookshop: a book Panda gave five stars (from the reading list, /reading/books.json) ----------

    PLAY.bookshop = function () {
        var books = null;
        fetch("/reading/books.json").then(function (r) { return r.json(); }).then(function (d) {
            books = ((d.shelves && d.shelves.read) || []).filter(function (b) { return b.rating >= 5; });
        }).catch(function () { books = []; });
        S.actions.poem = function () {   // the poem of the night: the same one for everyone today
            var ps = P().poems, day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
            S.say(arr(P().poem_intro).concat(arr(ps[day % ps.length])), function () { S.home(false); });
        };
        S.actions.recommend = function () {
            var p = P();
            if (!books || !books.length) { S.say(arr(p.no_books), function () { S.home(false); }); return; }
            var b = books[Math.floor(Math.random() * books.length)];
            var title = b.title.replace(/\s*\(.*\)$/, "").split(":")[0];
            S.say([fill(p.recommend, { title: title, author: b.author })], function () { S.home(false); });
        };
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
        var h = new Date().getHours();
        if ((h >= 2 && h < 4) || /[?&]late\b/.test(location.search)) {   // Bar 25: a door that's only there 2-4am
            document.addEventListener("scenestart", function () {
                hiddenWay([500, 300, 90, 140], "?loc=bar25", "A door you haven't seen before");
                setTimeout(function () { if (!S.stage.querySelector(".play-overlay")) S.say(arr(P().late_door)); }, 2600);
            });
        }
        var drifter = obj("drifter");
        drifter.lines = function () { hear("secondedition"); return arr(P().drifter); };
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
        hear("catroom_seen");
        obj("tea").lines = function () {   // whose tea? once you've met Taisho, there's a note under the cup
            var t = R.said.objects.tea;
            return arr(heard("taisho_met") && t.note ? t.note : t.lines);
        };
        cat.choices = function () {
            var p = P();
            return [{ label: p.pet_label, act: function () {
                var lines = heard("cat_fed") && p.pets_fed ? p.pets_fed : p.pets;   // fed it once: it trusts you
                S.say(arr(lines[pets % lines.length]), function () { S.offer(cat.choices()); });
                pets++;
                if (pets >= 2) hear("catfriend");   // friends now: it turns up around town (CAT_SPOTS)
            } }, { label: p.leave_label }];
        };
    };

    // ---------- a place's menu (dialogue.json "menu": a bar's drinks, a chat, an errand) ----------

    // offered after the greeting, and again after each answer. A choice with "serve" puts that drink in front of
    // you: the place's SERVE spot, drawn in its own inks (img/explore/layers/<prefix><drink>.png); one with "song"
    // changes the music
    var SERVE = {
        cutiebar: { prefix: "rabu-", rect: [179, 258, 26, 50] },
        towerbar: { prefix: "tower-", rect: [459, 214, 17, 17] },
        ramen: { prefix: "ramen-", rect: [412, 286, 30, 13] }
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

    // a request: the place's music swaps to another track (still muted if the visitor muted it)
    function song(src) {
        var m = document.getElementById("music");
        if (!m) return;
        m.src = src;
        if (!m.muted) m.play().catch(function () {});
    }

    // Rabu Rabu's stamp card: a stamp a drink; the fifth makes you a regular ("the usual" opens: need "regular")
    function stamp() {
        var p = P().stamps, n = +(get("pandaStamps") || 0) + 1;
        put("pandaStamps", n);
        if (n === p.full) { hear("regular"); return arr(p.regular); }
        return n < p.full ? [fill(p.stamped, { n: n, full: p.full })] : [];
    }

    // an object's choices from dialogue.json, with a menu's extras (song, serve, pocket, hear), back to the object
    function objMenu(list) {
        return list.filter(function (c) {
            return (!c.need || heard(c.need)) && (!c.unless || !heard(c.unless));
        }).map(function (c) {
            if (!c.song && !c.serve && !c.pocket && !c.hear) return c;
            return { label: c.label, act: function () {
                if (c.serve) serve(c.serve);
                if (c.song) song(c.song);
                if (c.pocket && !has(c.pocket)) pocket(c.pocket);
                hear(c.hear);
                S.say(c.pick ? [c.pick[Math.floor(Math.random() * c.pick.length)]] : arr(c.say));
            } };
        });
    }

    function menuOf(list) {
        return list.filter(function (c) {
            return (!c.need || heard(c.need)) && (!c.unless || !heard(c.unless));
        }).map(function (c) {
            if (c.menu) return { label: c.label, say: c.say, menu: menuOf(c.menu) };
            if (c.cycle) return { label: c.label, act: function () {   // the next of its lines each time, remembered
                var key = "pandaCycle_" + place + "_" + c.label, i = +(get(key) || 0);
                put(key, Math.min(i + 1, c.cycle.length - 1));
                S.say(arr(c.cycle[i]), function () { S.home(false); });
            } };
            if (!c.say && !c.pick) return c;
            return { label: c.label, act: function () {
                if (c.serve) serve(c.serve);
                if (c.song) song(c.song);
                if (c.pocket && !has(c.pocket)) pocket(c.pocket);   // an errand: something to carry
                hear(c.hear);
                var lines = c.pick ? [c.pick[Math.floor(Math.random() * c.pick.length)]] : c.say;
                if (c.serve && P().stamps) lines = lines.concat(stamp());
                S.say(lines, function () {
                    if (c.go) location.href = c.go;   // shown through somewhere
                    else S.home(false);
                });
            } };
        });
    }

    (R.afterGreeting = R.afterGreeting || []).push(function () {
        return R.said && R.said.menu ? menuOf(R.said.menu) : null;
    });

    // once you've made friends (petted it at the old house), the cat sometimes turns up sitting around town
    var CAT_SPOTS = {
        mainstreet: [210, 485, 35, 22], nightplaza: [318, 462, 31, 19], ramen: [588, 475, 27, 17],
        shrine: [343, 503, 27, 17], festival: [150, 506, 29, 18], rooftop: [500, 309, 31, 19], laundromat: [615, 360, 31, 19]
    };
    if (CAT_SPOTS[place] && heard("catfriend") && Math.random() < .4) {
        document.addEventListener("scenestart", function () {
            var r = CAT_SPOTS[place], cat = sprite("sit"), visits = (R.lines && R.lines.cat_visits) || ["Mrrp."];
            S.placeNative(cat, r[0], r[1], r[2], r[3]);
            cat.setAttribute("role", "button");
            cat.setAttribute("aria-label", "The cat");
            S.stage.appendChild(cat);
            cat.addEventListener("click", function (e) {
                e.stopPropagation();
                var feed = ((R.dialogueAll.explore || {}).catroom || {}).objects;
                var a = feed && feed.cat && feed.cat.accepts && feed.cat.accepts.mackerel;
                if (a && has("mackerel")) {   // it smells the fish
                    unpocket("mackerel");
                    if (a.pocket && !has(a.pocket)) pocket(a.pocket);
                    hear(a.hear);
                    S.say(arr(a.say));
                    return;
                }
                cat.remove();
                S.say([visits[Math.floor(Math.random() * visits.length)]]);
                scamper(sprite("runA"), r[0], r[0] + 260, r[1] + r[3] * .2, r[2], r[3] * .9, 1100);
            });
        });
    }

    // ---------- the stamp rally: a card in your pockets, a stamp for each special place you find ----------

    var RALLY = ["festival", "oldhouse", "zengarden", "rooftop", "otojima", "gamecentre", "ramen", "casino"];
    function rally() { try { return JSON.parse(get("pandaRally")) || {}; } catch (e) { return {}; } }
    if (RALLY.indexOf(place) >= 0 && !rally()[place]) {
        var got = rally();
        got[place] = 1;
        put("pandaRally", JSON.stringify(got));
        put("pandaRallyNew", "1");   // the card pulses in your pockets until you look at it
        if (Object.keys(got).length === 1) pocket("rally");
        if (RALLY.every(function (k) { return got[k]; })) hear("rally_complete");
        else document.dispatchEvent(new Event("pockets"));
    }
    // what the card says (js/house-key.js asks this when it's clicked)
    window.POCKET_LOOK = window.POCKET_LOOK || {};
    window.POCKET_LOOK.rally = function (it) {
        var got = rally(), n = RALLY.filter(function (k) { return got[k]; }).length;
        put("pandaRallyNew", "");
        var names = RALLY.map(function (k) { return got[k] ? it.places[k] : "???"; }).join(", ");
        if (n === RALLY.length && (get("pandaPockets") || "").indexOf("\"pin\"") < 0) setTimeout(function () { pocket("pin"); }, 0);
        if (n === RALLY.length) hear("rally_complete");   // the roof's ending opens
        return [fill(it.card, { n: n, total: RALLY.length }), names].concat(n === RALLY.length ? arr(it.complete) : []);
    };

    // Main Street: Panda hints at a stamp you haven't found yet (the map stays unlabelled; this is the nudge)
    if (place === "mainstreet") {
        (R.afterGreeting = R.afterGreeting || []).push(function () {
            var hints = (R.said.play || {}).hints;
            if (!hints) return null;
            return [{ label: hints.label, act: function hint() {
                var got = rally(), left = RALLY.filter(function (k) { return !got[k]; });
                var line = left.length ? hints[left[Math.floor(Math.random() * left.length)]] : hints.done;
                S.say(arr(line), function () { S.offer([{ label: hints.label, act: hint }]); });
            } }];
        });
    }

    // the penthouse telescope: a round view of somewhere else in the city; click to look away
    PLAY.penthouse = function () {
        S.actions.telescope = function () {
            var p = P().telescope, v = p.views[Math.floor(Math.random() * p.views.length)];
            var lens = document.createElement("div");
            lens.className = "play-telescope";
            lens.style.backgroundImage = "url(" + v.src + ")";
            lens.style.backgroundPosition = v.pos || "center";
            S.stage.appendChild(lens);
            function away(e) { if (e) e.stopPropagation(); lens.remove(); S.say(arr(p.away), function () { S.home(false); }); }
            lens.addEventListener("click", away);
            S.say(arr(v.say), function () { S.offer([{ label: p.stop, act: away }]); });
        };
    };

    // up, up, down, down, left, right, left, right, B, A
    var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    var konami = 0;
    document.addEventListener("keydown", function (e) {
        konami = e.key === KONAMI[konami] ? konami + 1 : e.key === KONAMI[0] ? 1 : 0;
        if (konami === KONAMI.length) {
            konami = 0;
            var all = (R.dialogueAll && R.dialogueAll.explore && R.dialogueAll.explore.lines) || {};
            if (all.konami) S.say(arr(all.konami));
        }
    });

    if (PLAY[place]) PLAY[place]();

    // ---------- the disposable camera (from Half Pipe): photos at scenic spots, an album in your pockets ----------

    var PHOTO_SPOTS = ["sunset", "rooftop", "penthouse", "festival", "forestglade", "beach", "aquarium", "zengarden",
                       "shrine", "harbour", "hilltop", "lilyfield", "campsite", "lighthouse", "lake", "observatory",
                       "nighttrain", "karaoke"];
    var EXPOSURES = 24;
    function photos() { try { return JSON.parse(get("pandaPhotos")) || []; } catch (e) { return []; } }
    if (PHOTO_SPOTS.indexOf(place) >= 0) {
        (R.afterGreeting = R.afterGreeting || []).push(function () {
            var p = (R.dialogueAll.pockets || {}).camera;
            if (!p || !has("camera") || photos().indexOf(place) >= 0) return null;
            return [{ label: p.take_label, act: function () {
                var got = photos();
                got.push(place);
                put("pandaPhotos", JSON.stringify(got));
                if (got.length >= 3) hear("photographer");   // enough for an exhibition (the gallery)
                var flash = document.createElement("div");
                flash.className = "play-flash";
                S.stage.appendChild(flash);
                setTimeout(function () { flash.remove(); }, 450);
                S.say([fill(p.taken, { left: EXPOSURES - got.length })], function () { S.home(false); });
            } }];
        });
    }
    // the album: your photos laid out like prints on a table (click to put them away)
    window.POCKET_LOOK = window.POCKET_LOOK || {};
    window.POCKET_LOOK.camera = function (it) {
        var got = photos();
        if (!got.length || !window.LOCATIONS) return arr(it.look);
        var album = document.createElement("div");
        album.className = "play-album";
        got.forEach(function (k, i) {
            var L = LOCATIONS[k], ph = document.createElement("div");
            if (!L) return;
            ph.className = "play-photo";
            ph.style.backgroundImage = "url(" + (k === "penthouse" ? "/img/explore/settings/skyling-normal-flicker.gif" : L.image) + ")";
            ph.style.transform = "rotate(" + ((i * 37 % 11) - 5) + "deg)";
            ph.title = L.title;
            album.appendChild(ph);
        });
        album.addEventListener("click", function (e) { e.stopPropagation(); album.remove(); });
        S.stage.appendChild(album);
        return [fill(it.album, { n: got.length })];
    };

    // Halloween week (your clock; ?season=halloween to see it): jack-o'-lanterns out on the streets
    function halloween() {
        var d = new Date();
        return /[?&]season=halloween\b/.test(location.search) || (d.getMonth() === 9 && d.getDate() >= 24);
    }
    var PUMPKINS = { mainstreet: [[130, 470], [470, 476]], festival: [[200, 488]], shrine: [[250, 500]] };
    if (PUMPKINS[place] && halloween()) {
        document.addEventListener("scenestart", function () {
            PUMPKINS[place].forEach(function (xy) {
                var im = document.createElement("img");
                im.src = "/img/explore/layers/pumpkin.png";
                im.alt = "";
                im.className = "scene-layer scene-pixel scene-anim-flicker";
                S.placeNative(im, xy[0], xy[1], 23, 19);
                S.stage.appendChild(im);
            });
        });
    }

    // ---------- Panda's notebook: what you've done and what you said you'd do (pockets.notebook in dialogue.json) ----------

    if (!has("notebook")) setTimeout(function () { pocket("notebook"); }, 0);   // everyone gets one on their first walk
    window.POCKET_LOOK.notebook = function (it) {
        function ok(e) {
            return (e.flags || []).every(heard) && !(e.not || []).some(heard) &&
                   (e.rally || []).every(function (k) { return rally()[k]; }) &&
                   !(e.no_rally || []).some(function (k) { return rally()[k]; });
        }
        var todo = it.todo.filter(ok).map(function (e) { return e.text; });
        var done = it.done.filter(ok).map(function (e) { return e.text; });
        var out = [];
        if (window.LOCATIONS && it.visited) {       // how much of the city you've walked
            var all = Object.keys(LOCATIONS), been = all.filter(function (k) { return get("pandaVisits_" + k); }).length;
            out.push(fill(it.visited, { n: Math.max(been, 1), total: all.length }));
        }
        if (todo.length) out.push(it.todo_head + " " + todo.join(" "));
        if (done.length) out.push(it.done_head + " " + done.join(" "));
        return out.length > 1 || todo.length || done.length ? out : arr(it.empty).concat(out);
    };

    // the gallery's exhibition of your photos: the album, framed as a show
    S.actions.exhibition = function () {
        var cam = (R.dialogueAll.pockets || {}).camera;
        if (!cam || !window.POCKET_LOOK.camera) return;
        window.POCKET_LOOK.camera(cam);
        S.say(arr(P().exhibition), function () { S.home(false); });
    };

    // the Pandopolis Times (the konbini): its headlines are whatever you've been up to, and the city's own news
    S.actions.newspaper = function () {
        var p = P().times;
        var news = p.headlines.filter(function (h) { return !h.need || heard(h.need); });
        var mine = news.filter(function (h) { return h.need; }), city = news.filter(function (h) { return !h.need; });
        var pick = mine.slice(-2).concat(city.sort(function () { return Math.random() - .5; }).slice(0, 3 - Math.min(2, mine.length)));
        S.say(arr(p.intro).concat(pick.map(function (h) { return h.text; })), function () { S.home(false); });
    };

    // the pocket radio (Sakura fixed Ghandi's old one): tune it and the music changes, wherever you are
    window.POCKET_LOOK.radio = function (it) {
        var st = it.stations[Math.floor(Math.random() * it.stations.length)];
        song(st.src);
        return [fill(it.tuned, { station: st.name })];
    };

    // the city notices when you're here: a place can greet you differently in the rain (greeting_rain) or in the
    // small hours by your own clock (greeting_late, midnight to five)
    var greetingNow = null;   // chosen once per visit (it's shown again when a branch ends)
    R.greeting = function () { return greetingNow || (greetingNow = pickGreeting()); };
    function pickGreeting() {
        var d = R.said || {}, now = new Date(), h = now.getHours();
        var day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
        var visits = +(get("pandaVisits_" + place) || 0) + 1;
        put("pandaVisits_" + place, visits);
        var after = (d.greeting_after || []).filter(function (g) { return heard(g.need); })[0];
        if (after) return after.greeting;   // because of something you did (Andy, at the cafe with Sakura)
        if (d.greeting_halloween && halloween()) return d.greeting_halloween;
        if (d.greeting_newyear && now.getMonth() === 0 && now.getDate() <= 3) return d.greeting_newyear;
        if (d.greeting_winter && winter()) return d.greeting_winter;
        if (d["greeting_" + day]) return d["greeting_" + day];   // a weekly thing (Andy's Thursday show)
        if (d.greeting_regular && visits >= 5 && Math.random() < .7) return d.greeting_regular;   // a regular now
        if (d.greeting_return && visits > 1 && Math.random() < .6) {   // you've been here before
            return [d.greeting_return[Math.floor(Math.random() * d.greeting_return.length)]];
        }
        if (d.greeting_rain && RAINY.indexOf(place) >= 0 && (raining() || /[?&]rain\b/.test(location.search))) return d.greeting_rain;
        if (d.greeting_late && h < 5) return d.greeting_late;
        return d.greeting;
    };

    // what a place and its objects accept: a "Give..." choice for each thing you're carrying that they'd take
    (R.afterGreeting = R.afterGreeting || []).push(function () {
        return givesFor(R.said && R.said.accepts, function () { S.home(false); });
    });
    R.objects.concat(R.knickKnacks || []).forEach(function (o) {
        var own = o.choices;   // a menu made here (a function), or the dialogue's own
        o.choices = function () {
            var t = (R.said && R.said.objects && R.said.objects[o.id]) || {};
            var base = typeof own === "function" ? own() : (t.choices ? objMenu(t.choices) : null);
            var gives = givesFor(t.accepts);
            if (!gives.length) return base;
            return (base || [{ label: (R.lines && R.lines.never_mind) || "Never mind" }]).concat(gives);
        };
    });
})();
