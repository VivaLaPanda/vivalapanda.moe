// Explore's shared runtime, for every place: what this browser remembers (flags you've heard, your pockets), menus
// and gifts from dialogue.json, the greeting (by visit, date, season, weather and hour), lingering, and the clock
// and the sky. The feature scripts (js/explore-games.js, explore-town.js, explore-ambient.js) load after it and use
// it through window.EXPLORE; each runs its own PLAY[place]. Plain menus need no code: an object's choices in
// dialogue.json say or pick lines themselves, and a place's "menu" (a bar's drinks) is offered after its greeting.
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
                var base = typeof own === "function" ? own() : (t.choices ? objMenu(t.choices) : null);
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
