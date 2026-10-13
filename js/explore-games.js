// Explore's games: the festival's goldfish and ring toss, Club Polka's dance, the claw machine and purikura, fishing
// off the pier, the casino (a panorama you pan along, roulette) and its lounge, Gonta's jan-ken-pon, Ruri's high-low,
// the observatory's moon and stars. Lines are in dialogue.json under each place's "play".
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE, X = window.EXPLORE, place = X.place;
    var P = X.P, arr = X.arr, canvasPoint = X.canvasPoint, fill = X.fill, get = X.get, has = X.has, hear = X.hear,
        heard = X.heard, obj = X.obj, overlay = X.overlay, pocket = X.pocket, put = X.put, rand = X.rand;
    var PLAY = {};   // place id -> its setup, run once this file has loaded

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
            if (caught >= 3) hear("goldfish_master");
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
            if (acc >= .9) hear("dance_star");
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

    function claw() {
        var p = P().claw, o = overlay(), cv = o.cv, ctx = o.ctx, W = cv.width, H = cv.height;
        var CHUTE = 18, TOP = 14, FLOOR = 118, tries = 3, over = false, raf, last = performance.now();
        var c = { x: CHUTE, tx: CHUTE, y: TOP, state: "aim", hold: null, open: 1 };   // aim|down|grab|up|home|drop
        var pile = [];
        for (var i = 0; i < 14; i++) {   // a heap of plushes on the floor (one panda, somewhere awkward)
            var kind = i === 0 && !has("panda") ? "panda" : PLUSHES[Math.floor(Math.random() * 4)];   // one panda, until it's yours
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
                    if (won === "panda") hear("panda_won");
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
        m.click = function () { var c = P().claw; return arr(has("panda") && c.intro_after ? c.intro_after : c.intro); };
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

    // the lounge's cashier: your roulette chips, counted
    PLAY.casinolounge = function () {
        S.actions.cashout = function () {
            var p = P().cashout, n = chips();
            S.say([fill(n >= 500 ? p.many : p.few, { chips: n }), p.keep], function () { S.home(false); });
        };
    };

    // ---------- the casino: a panorama you pan along, and roulette ----------

    // casino.png is a 500x134 strip; cover-fitted it's 3.94x, so the window shows a third of it. Three views
    // (object-position 0%, 50%, 100%); clicking near an edge slides to the next. Rects are per view, in scene px.
    var CASINO_S = 528 / 134, CASINO_OX = [0, 615, 1230];
    var CASINO_SPOTS = [
        [{ id: "roulette", src: [62, 42, 92, 64] }],
        [{ id: "door", src: [200, 6, 46, 36], go: "?loc=casinolounge" }, { id: "bar", src: [170, 40, 240, 45] }],
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
                    hit(r, R.said.objects[o.id].name, o.go ? function () { location.href = o.go; } : o.id === "roulette" ? roulette : function () {
                        var t = R.said.objects[o.id];
                        S.say(arr(t.lines_after && heard(t.lines_after.need) ? t.lines_after.lines : t.lines));   // seen something since
                    });
                });
                hit([90, 478, 560, 50], "Back out to Main Street", function () { location.href = "?loc=mainstreet"; });
                if (v > 0) hit([0, 0, 90, 528], "Look left", function () { show(v - 1); });     // the edges win
                if (v < 2) hit([650, 0, 90, 478], "Look right", function () { show(v + 1); });
            }
            show(0);
        });
    };

    // jan-ken-pon with Gonta: loser buys the yakitori; he takes it very seriously
    S.actions.janken = function () {
        var p = P().janken, hands = ["rock", "paper", "scissors"];
        function throwHand(mine) {
            var his = Math.floor(Math.random() * 3), r = (mine - his + 3) % 3;   // 0 draw, 1 you win, 2 he wins
            var line = fill(p.thrown, { you: p.hands[hands[mine]], him: p.hands[hands[his]] });
            if (r === 0) { S.say([line, p.draw], offerHands); return; }
            if (r === 1) hear("gonta_beaten");
            S.say([line].concat(arr(r === 1 ? p.you_win : p.he_wins)), function () { S.home(false); });
        }
        function offerHands() {
            S.offer(hands.map(function (h, i) { return { label: p.hands[h], act: function () { throwHand(i); } }; }));
        }
        S.say(arr(p.ready), offerHands);
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
                    hear("ruri_beaten");
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

    // the Ferris wheel: up, up, and at the top a round window onto the city's skyline
    S.actions.ferris = function () {
        var p = P().ferris;
        S.say(arr(p.up), function () {
            var view = document.createElement("div");
            view.className = "play-telescope";
            view.style.backgroundImage = "url(/img/explore/places/city_overlook.png)";
            view.style.backgroundPosition = "center";
            S.stage.appendChild(view);
            function down(e) { if (e) e.stopPropagation(); view.remove(); S.say(arr(p.down), function () { S.home(false); }); }
            view.addEventListener("click", down);
            S.say(arr(p.top), function () { S.offer([{ label: p.stop, act: down }]); });
        });
    };

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

    if (PLAY[place]) PLAY[place]();
})();
