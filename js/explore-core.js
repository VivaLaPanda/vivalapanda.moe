// Explore's shared runtime, for every place: what this browser remembers (flags you've heard, your pockets), menus
// and gifts from dialogue.json, the greeting (by visit, date, season, weather and hour), lingering, and the clock
// and the sky. The feature scripts (js/explore-games.js, explore-town.js, explore-ambient.js) load after it and use
// it through window.EXPLORE; each runs its own PLAY[place]. Plain menus need no code: an object's choices in
// dialogue.json say or pick lines themselves, and a place's "menu" (a bar's drinks) is offered after its greeting.
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE, D = window.PANDA;
    var place = (R.dialogue || "").replace(/^explore\./, "");
    var get = D.get, put = D.put, heard = D.heard, hear = D.hear, fill = D.fill, arr = D.arr,
        has = D.has, pocket = D.pocket, unpocket = D.unpocket;

    function P() { return (R.said && R.said.play) || {}; }
    function obj(id) { return R.objects.filter(function (o) { return o.id === id; })[0]; }
    function rand(a, b) { return a + Math.random() * (b - a); }

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

    // rain on the city's outdoor night streets: about one hour in three, the same hour everywhere
    var RAINY = ["mainstreet", "partystreet", "nightalley", "shizukastreet", "nightplaza", "nightresidential",
                 "nightresidential2", "nightapartments", "nightresidential_girl", "backpassage", "oldhouse", "ramen"];
    function raining() {
        var hour = Math.floor(Date.now() / 3600000), x = Math.sin(hour * 12.9898) * 43758.5453;
        return x - Math.floor(x) < .33;
    }
    // December (or ?season=winter): snow on the outdoor places, drifting, never in a hurry
    function winter() {
        return /[?&]season=winter\b/.test(location.search) || new Date().getMonth() === 11 || (new Date().getMonth() === 0 && new Date().getDate() <= 7);
    }
    var SNOWY = RAINY.concat(["nightpark", "festival", "shrine", "forestedge", "rooftop", "nightplaza", "hilltop", "campsite"]);
    function spring() {   // cherry blossom season (or ?season=spring)
        var d = new Date(), m = d.getMonth(), day = d.getDate();
        return /[?&]season=spring\b/.test(location.search) || (m === 2 && day >= 25) || (m === 3 && day <= 15);
    }
    // after ms without a click or a key, run fn (again each time it's re-armed)
    function whenIdle(ms, fn) {
        var t = null;
        function arm() { clearTimeout(t); t = setTimeout(fn, ms); }
        ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, arm, { passive: true }); });
        arm();
        return function () { clearTimeout(t); t = null; ["pointerdown", "keydown"].forEach(function (ev) { document.removeEventListener(ev, arm); }); };
    }


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

    // choices from dialogue.json, with what plain choices can't do: need/unless (flags), serve, song, pocket, hear,
    // cycle (the next of its lines each time, remembered) and go. after: what follows a choice's lines (a place's
    // menu comes back; an object's plain lines are left to the scene)
    function choicesOf(list, after) {
        return list.filter(function (c) {
            return (!c.need || heard(c.need)) && (!c.unless || !heard(c.unless));
        }).map(function (c) {
            if (c.menu) return { label: c.label, say: c.say, menu: choicesOf(c.menu, after) };
            if (c.cycle) return { label: c.label, act: function () {
                var key = "pandaCycle_" + place + "_" + c.label, i = +(get(key) || 0);
                put(key, Math.min(i + 1, c.cycle.length - 1));
                S.say(arr(c.cycle[i]), after);
            } };
            if (!c.say && !c.pick) return c;
            if (!after && !c.serve && !c.song && !c.pocket && !c.hear && !c.go) return c;
            return { label: c.label, act: function () {
                if (c.serve) serve(c.serve);
                if (c.song) song(c.song);
                if (c.pocket && !has(c.pocket)) pocket(c.pocket);   // an errand: something to carry
                hear(c.hear);
                var lines = c.pick ? [c.pick[Math.floor(Math.random() * c.pick.length)]] : arr(c.say);
                if (c.serve && P().stamps) lines = lines.concat(stamp());
                S.say(lines, c.go ? function () { travel(c); } : after);
            } };
        });
    }
    function backHome() { S.home(false); }

    // a choice that ends somewhere else (go): its last line is read first (a click on the ▼); one that only asks the
    // way ("Ask about the red gates") then offers going as a choice of its own (go_label)
    function travel(c) {
        function go() { location.href = c.go; }
        if (c.go_label) S.offer([{ label: c.go_label, act: go }, { label: (R.lines && R.lines.never_mind) || "Never mind", act: backHome }]);
        else S.pause(go);
    }

    (R.afterGreeting = R.afterGreeting || []).push(function () {
        return R.said && R.said.menu ? choicesOf(R.said.menu, backHome) : null;
    });

    // Halloween week (your clock; ?season=halloween to see it): jack-o'-lanterns out on the streets
    function halloween() {
        var d = new Date();
        return /[?&]season=halloween\b/.test(location.search) || (d.getMonth() === 9 && d.getDate() >= 24);
    }
    // linger somewhere quiet and something small happens (dialogue.json "linger": one line, once a visit)
    {
        document.addEventListener("scenestart", function () {
            var lines = R.said && R.said.linger;
            if (!lines) return;
            var stop = whenIdle(40000, function () {
                // only at rest: not mid-conversation (a ▼ waiting), not in a game or a view
                var arrow = document.getElementById("text-arrow");
                if ((arrow && !arrow.hidden) || S.stage.querySelector(".play-overlay, .play-telescope, .play-album")) return;
                stop();
                S.say([lines[Math.floor(Math.random() * lines.length)]]);
            });
        });
    }

    // the city notices when you're here: a place can greet you differently in the rain (greeting_rain) or in the
    // small hours by your own clock (greeting_late, midnight to five)
    var greetingNow = null;   // chosen once per visit (it's shown again when a branch ends)
    R.greeting = function () { return greetingNow || (greetingNow = pickGreeting()); };
    function pickGreeting() {
        var d = R.said || {}, now = new Date(), h = now.getHours();
        var day = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][now.getDay()];
        var visits = +(get("pandaVisits_" + place) || 0) + 1;
        put("pandaVisits_" + place, visits);
        var after = (d.greeting_after || []).filter(function (g) {
            return heard(g.need) && !(g.once && heard("said_" + place + "_" + g.need));
        })[0];
        if (after) {   // because of something you did (Andy, at the cafe with Sakura); "once": just the first time
            if (after.once) hear("said_" + place + "_" + after.need);
            return after.greeting;
        }
        var md = ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
        if (d.greeting_on && d.greeting_on[md]) return d.greeting_on[md];   // a date on the calendar ("05-02")
        if (d.greeting_halloween && halloween()) return d.greeting_halloween;
        if (d.greeting_newyear && now.getMonth() === 0 && now.getDate() <= 3) return d.greeting_newyear;
        if (d.greeting_winter && winter()) return d.greeting_winter;
        if (d.greeting_spring && spring()) return d.greeting_spring;
        if (d["greeting_" + day]) return d["greeting_" + day];   // a weekly thing (Andy's Thursday show)
        if (d.rare && visits > 1 && Math.random() < .08) return [d.rare[Math.floor(Math.random() * d.rare.length)]];   // once in a while
        if (d.greeting_regular && visits >= 5 && Math.random() < .7) return d.greeting_regular;   // a regular now
        if (d.greeting_return && visits > 1 && Math.random() < .6) {   // you've been here before
            return [d.greeting_return[Math.floor(Math.random() * d.greeting_return.length)]];
        }
        if (d.greeting_rain && RAINY.indexOf(place) >= 0 && (raining() || /[?&]rain\b/.test(location.search))) return d.greeting_rain;
        if (d.greeting_late && h < 5) return d.greeting_late;
        if (d.greeting_dawn && h >= 5 && h < 7) return d.greeting_dawn;   // first light, by your clock
        return d.greeting;
    };

    // once every feature script has added its own (scene.js runs these just before the scene starts): what a place
    // and its objects accept, a "Give..." choice for each thing you're carrying that they'd take
    (R.beforeStart = R.beforeStart || []).push(function () {
        (R.afterGreeting = R.afterGreeting || []).push(function () {
            return givesFor(R.said && R.said.accepts, function () { S.home(false); });
        });
        R.objects.concat(R.knickKnacks || []).forEach(function (o) {
            var own = o.choices;   // a menu made here (a function), or the dialogue's own
            o.choices = function () {
                var t = (R.said && R.said.objects && R.said.objects[o.id]) || {};
                var base = typeof own === "function" ? own() : (t.choices ? choicesOf(t.choices) : null);
                var gives = givesFor(t.accepts);
                if (!gives.length) return base;
                return (base || [{ label: (R.lines && R.lines.never_mind) || "Never mind" }]).concat(gives);
            };
        });
    });

    window.EXPLORE = { P: P, RAINY: RAINY, SNOWY: SNOWY, arr: arr, canvasPoint: canvasPoint, fill: fill, get: get,
                       halloween: halloween, has: has, hear: hear, heard: heard, obj: obj, overlay: overlay,
                       place: place, pocket: pocket, put: put, raining: raining, rand: rand, song: song,
                       spring: spring, unpocket: unpocket, whenIdle: whenIdle, winter: winter };
})();
