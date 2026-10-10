// A room of Panda's house, live: the house's state (/house/state.json, written every minute on the server from the
// home API on rodney) drawn into the room by js/house-render.js. Both rooms follow the real time of day (the
// registers) and show their lamps at their real brightness and colour. What else a room shows is whatever its scene has: the living room's blinds come down to their real height,
// its thermostat's face warms when the heat is on, its kotatsu glows when plugged in, its TV shows a picture when on
// (a moving one when something plays), notes rise off its speakers while music plays, and a small readout gives the
// house's clock and temperature; the bedroom's city lights twinkle only after dark. Without the state (the feed down)
// a room is noon with everything off. The room's data sets R.house = { base, v, hud }.
(function () {
    "use strict";

    var R = window.ROOM;
    var BASE = R.house.base;
    var V = R.house.v;
    var REFRESH_MS = 60 * 1000;         // the file changes every minute
    var STALE_MIN = 30;

    var scene = null, state = null, api = null;
    var overlays = {};                  // id -> element on the stage
    var hud = null, noteTimer = null;

    // ---------- the state, read for the dialogue (living-room-data.js) ----------

    var H = window.HOUSE = window.HOUSE || {};

    function light(lamp) {
        if (!state || !state.lights || !scene) return null;
        var hit = null;
        state.lights.forEach(function (l) {
            if (scene.light_names[l.name] === lamp && (!hit || l.on)) hit = l;
        });
        return hit;
    }

    function plug(name) {
        if (!state || !state.plugs) return null;
        var p = state.plugs.filter(function (x) { return x.name === name; })[0];
        return p ? p.on : null;
    }

    function blindPct(name) {
        if (!state || !state.blinds) return null;
        var b = state.blinds.filter(function (x) { return x.name === name; })[0];
        return b && b.open_pct != null ? b.open_pct : null;
    }

    H.light = light;
    H.lampOn = function (lamp) { var l = light(lamp); return l ? l.on : null; };
    H.climate = function () { return state && state.climate; };
    H.tv = function () { return state && state.tv; };
    H.music = function () { return state && state.music; };
    H.kotatsuOn = function () { return scene && scene.kotatsu ? plug(scene.kotatsu.plug) : null; };
    H.blindPct = blindPct;
    H.redraw = function () { draw(); };

    // ---------- rendering ----------

    function phaseNow() {
        return state && scene.phases[state.phase] ? state.phase : "noon";
    }

    function lightsNow() {
        var out = {};
        Object.keys(scene.light_names).forEach(function (real) {
            var lamp = scene.light_names[real], l = light(lamp);
            if (l) out[lamp] = l;
        });
        if (scene.lights.daylight) {
            // the day through the glass, as far as the blinds let it in (all of it where the house has no blinds)
            var names = Object.keys(scene.blinds || {}), open = 0, known = 0;
            names.forEach(function (n) { var p = blindPct(n); if (p !== null) { open += p; known++; } });
            out.daylight = { on: true, brightness_pct: known ? Math.max(8, open / known) : 100 };
        }
        var tv = scene.tv && H.tv();
        if (tv && tv.on) out.tv = { on: true, brightness_pct: tv.playing ? 100 : 70 };
        if (scene.kotatsu && H.kotatsuOn()) out.kotatsu = { on: true, brightness_pct: 100 };
        return out;
    }

    // index overrides: the blinds' cloth down to the real position, the thermostat's face when heating
    function overrides() {
        var w = scene.w, n = w * scene.h, o = new Uint8Array(n).fill(255);
        var I = scene.registers;
        Object.keys(scene.blinds || {}).forEach(function (name) {
            var pct = blindPct(name);
            if (pct === null || pct >= 98) return;
            // per column: the roll's foot and the track (both run to the VP), the weave's threads (spaced by depth),
            // and the cloth's mask (nothing over the sofa or the arc lamp, which stand in front)
            var b = scene.blinds[name], cloth = b.mask ? scene.mask[b.mask] : null;
            for (var x = b.x0; x <= b.x1; x++) {
                var i = x - b.x0, top = b.top[i], bot = b.bottom[i];
                var end = Math.round(top + (bot - top) * (100 - pct) / 100);
                for (var y = Math.ceil(top); y <= end; y++) {
                    var p = y * w + x;
                    if (cloth && !cloth[p]) continue;
                    var ink = b.weave[i] ? I.desk : I.paper;              // a cream cloth, a faint weave
                    if (y >= end - 1) ink = y === end ? I.dark : I.wood;  // its bottom bar
                    o[p] = ink;
                }
            }
        });
        var c = scene.thermostat && H.climate();
        if (c && c.heating) {
            var face = scene.mask["mask-thermostat_face.png"];
            for (var p = 0; p < n; p++) if (face[p]) o[p] = (p % 3) ? I.bedspread : I.red;
        }
        return o;
    }

    function stateNow(extra) {
        return { phase: phaseNow(), lights: lightsNow(), override: extra || overrides() };
    }

    function draw() {
        if (!scene || !api) return;
        var wait = HouseRender.need(scene, phaseNow(), lightsNow());
        if (wait) { wait.then(draw); return; }          // a lamp just came on, or a new time of day: its file first
        var ov = overrides();
        var px = HouseRender.renderPixels(scene, stateNow(ov));
        api.art.src = HouseRender.toURL(px, scene.w, scene.h, 4);
        if (scene.tv) drawTV();
        if (scene.speakers) drawMusic();
        if (R.house.hud) drawHud();
        if (scene.twinkle_phases) {
            var tw = document.getElementById("room-twinkle");
            if (tw) tw.hidden = scene.twinkle_phases.indexOf(phaseNow()) < 0;
        }
    }

    function overlay(id, tag) {
        var node = overlays[id];
        if (!node) {
            node = document.createElement(tag || "div");
            node.className = "lr-layer";
            node.setAttribute("aria-hidden", "true");
            api.stage.insertBefore(node, api.svg);
            overlays[id] = node;
        }
        return node;
    }

    function drawTV() {
        var tv = H.tv(), s = scene.tv.screen;
        var node = overlay("tv");
        if (!tv || !tv.on) { node.hidden = true; return; }
        node.hidden = false;
        api.placeNative(node, s.x, s.y, s.w, s.h);
        if (tv.playing) {
            node.className = "lr-layer lr-tv lr-tv-play";
            node.style.backgroundImage = "url(" + BASE + scene.tv.play.src + "?v=" + V + ")";
            node.style.setProperty("--frames", scene.tv.play.frames);
        } else {
            node.className = "lr-layer lr-tv";
            node.style.backgroundImage = "url(" + BASE + scene.tv.backdrop + "?v=" + V + ")";
        }
    }

    function drawMusic() {
        var m = H.music(), playing = !!(m && m.playing);
        clearInterval(noteTimer);
        scene.speakers.at.forEach(function (a, i) {
            var led = overlay("led" + i);
            led.className = "lr-layer lr-led";
            api.placeNative(led, a[0] - 2, a[1] - 4, 4, 1);
            led.hidden = !playing;
        });
        if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        var k = 0;
        noteTimer = setInterval(function () {
            if (document.hidden) return;
            var a = scene.speakers.at[k++ % scene.speakers.at.length];
            var n = document.createElement("img");
            n.src = BASE + scene.speakers.note + "?v=" + V;
            n.alt = "";
            n.className = "lr-layer lr-note";
            api.placeNative(n, a[0] - 2, a[1] - 14, 6, 8);
            api.stage.insertBefore(n, api.svg);
            setTimeout(function () { n.remove(); }, 2600);
        }, 900);
    }

    function drawHud() {
        if (!hud) {
            hud = document.createElement("div");
            hud.id = "lr-hud";
            hud.setAttribute("role", "status");
            api.stage.appendChild(hud);
        }
        if (!state) { hud.textContent = "Panda's house · offline"; return; }
        var parts = [houseClock(), phaseNow().toUpperCase()];
        var c = state.climate;
        if (c && c.temperature_f != null) parts.push(Math.round(c.temperature_f) + "°F");
        var age = (Date.now() - Date.parse(state.updated)) / 60000;
        hud.textContent = parts.join(" · ") + (age > STALE_MIN ? " (as of " + Math.round(age / 60) + "h ago)" : "");
        hud.title = "Panda's real house, updated every minute";
    }

    // the house's clock now: its UTC offset from the feed (local_time against updated), applied to this browser's clock,
    // so the readout ticks instead of showing the feed's 5-minute-old time
    function houseClock() {
        var hm = /^(\d\d):(\d\d)$/.exec(state.local_time || "");
        var u = new Date(state.updated);
        if (!hm || isNaN(u)) return state.local_time;
        var off = (+hm[1] * 60 + +hm[2]) - (u.getUTCHours() * 60 + u.getUTCMinutes());
        off = ((off + 720) % 1440 + 1440) % 1440 - 720;          // into -12h..+12h
        off = Math.round(off / 15) * 15;
        var t = new Date(Date.now() + off * 60000);
        var pad = function (n) { return (n < 10 ? "0" : "") + n; };
        return pad(t.getUTCHours()) + ":" + pad(t.getUTCMinutes());
    }

    // ---------- loading ----------

    function getState() {
        return fetch("/house/state.json", { cache: "no-cache" }).then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        }).then(function (s) { state = s; }, function (err) {
            console.warn("house state unavailable:", err);
        });
    }

    // room.js waits for this before building: the hotspots' outlines come from the scene, and the first frame's files
    // (the state comes in alongside, so the room starts drawn as the house is)
    var firstState = getState();
    R.ready = Promise.all([HouseRender.load(BASE, V), firstState]).then(function (got) {
        scene = got[0];
        R.objects.concat(R.knickKnacks || []).forEach(function (o) {
            var hs = scene.hotspots[o.id];
            if (!hs) return;
            if (hs.polygon && !o.polygon) {
                o.polygon = hs.polygon;
                o.anchor = hs.anchor;
            }
            o.lit = { src: (o.lit && o.lit.src) || "data:,", x: hs.lit.x, y: hs.lit.y, w: hs.lit.w, h: hs.lit.h };
        });
        return HouseRender.need(scene, phaseNow(), lightsNow());
    }).catch(function (err) {
        scene = null;                                    // the room stays the picture it was drawn as
        console.warn("house scene unavailable:", err);
    });

    R.onBuilt = function (a) {
        api = a;
        draw();
        setInterval(function () {
            if (!document.hidden) getState().then(draw);
        }, REFRESH_MS);
        if (R.house.hud) setInterval(function () { if (state) drawHud(); }, 20000);
    };
})();
