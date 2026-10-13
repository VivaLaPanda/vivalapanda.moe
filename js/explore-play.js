// What there is to do in Explore besides walking: games and things that move or react. Each place's play is a
// function under PLAY, keyed by its location id (js/explore-locations.js), run before the scene starts; it hangs
// choices and actions on the place's objects. Its lines are in dialogue.json, under the place's "play".
// Plain menus (a stall, a bar's drinks) need no code: their choices in dialogue.json say or pick lines themselves.
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE;
    var place = (R.dialogue || "").replace(/^explore\./, "");

    function P() { return (R.said && R.said.play) || {}; }
    function obj(id) { return R.objects.filter(function (o) { return o.id === id; })[0]; }
    function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
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

        S.say([p.how], function () {
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
                    S.say([P().cat_bolts]);
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
                S.say([P().cat_runs]);
                scamper(sprite("runA", "play-cat-far"), r[0], r[0] - 60, r[1], 19, 12, 900);
            });
        });
    };

    PLAY.catroom = function () {
        var pets = 0, cat = obj("cat");   // (asleep on the cushion: a layer in explore-locations.js)
        cat.choices = function () {
            var p = P();
            return [{ label: p.pet_label, act: function () {
                S.say([p.pets[pets % p.pets.length]], function () { S.offer(cat.choices()); });
                pets++;
            } }, { label: p.leave_label }];
        };
    };

    if (PLAY[place]) PLAY[place]();
})();
