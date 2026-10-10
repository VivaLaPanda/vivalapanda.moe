// Panda's living room (Home): the front room of the site, a live copy of Panda's real house.
//
// The scene (art, outlines, anchors) comes from the easel piece pc98-assets/easel/pieces/living-room (export.py ->
// img/living-room/scene.json and its maps); js/living-room.js renders it with the house's state and fills each
// object's outline in before the room is built. Every line is in /data/dialogue.json, section "living_room": an
// object's line can depend on the house (a lamp on or off), so the keys there come in variants (hover_on, hover_off,
// hover_unknown, ...) and may hold {placeholders}; the functions below pick the variant and fill it in.
// Two doors: the bedroom (Panda's Room, /room.html) on the left wall, and the front door beside it on the back wall
// (outside: the explore map). The balcony's sliding doors on the right belong to the blinds over them.
window.HOUSE = window.HOUSE || {};

(function () {
    var H = window.HOUSE;
    var R;

    function said(id) {
        return (R.said && R.said.objects && R.said.objects[id]) || {};
    }

    // "{name}" from vars; a line whose placeholder has no value falls back to `fallback`
    function fill(line, vars, fallback) {
        if (line == null) return fallback;
        var missing = false;
        var out = String(line).replace(/\{(\w+)\}/g, function (_, k) {
            if (vars[k] == null) { missing = true; return ""; }
            return vars[k];
        });
        return missing ? fallback : out;
    }

    function fillAll(lines, vars, fallback) {
        return (lines || []).map(function (l) { return fill(l, vars, fallback); });
    }

    function warmth(k) {
        if (k == null) return null;
        return k < 3000 ? "warm" : k < 4500 ? "soft white" : "daylight";
    }

    function lampVars(lamp) {
        var l = H.light ? H.light(lamp) : null;
        if (!l) return {};
        return { brightness: l.brightness_pct, kelvin: l.kelvin, warmth: warmth(l.kelvin), color: l.color };
    }

    // a lamp: hover_on / hover_off / hover_unknown, lines; {brightness} {kelvin} {warmth}
    function lamp(id, name) {
        return {
            hover: function () {
                var s = said(id), on = H.lampOn ? H.lampOn(name) : null, v = lampVars(name);
                return fill(on === null ? s.hover_unknown : on ? s.hover_on : s.hover_off, v, s.hover_unknown);
            },
            lines: function () {
                var s = said(id), on = H.lampOn ? H.lampOn(name) : null;
                return fillAll(on === null ? s.lines : on ? (s.lines_on || s.lines) : (s.lines_off || s.lines),
                               lampVars(name), "...");
            }
        };
    }

    function climateVars() {
        var c = H.climate ? H.climate() : null;
        if (!c || c.temperature_f == null) return {};
        return { temp: Math.round(c.temperature_f), heat: c.heating ? "on" : "off", humidity: c.humidity_pct };
    }

    function speaker(id) {
        return {
            hover: function () {
                var s = said(id), m = H.music ? H.music() : null;
                return m == null ? s.hover_unknown : m.playing ? s.hover_playing : s.hover_quiet;
            },
            lines: function () {
                var s = said(id), m = H.music ? H.music() : null;
                return m && m.playing ? (s.lines_playing || s.lines) : s.lines;
            }
        };
    }

    // a roller blind: hover_open / hover_partial / hover_closed / hover_unknown, lines; {pct} (percent open)
    function blind(id, name) {
        function pct() { return H.blindPct ? H.blindPct(name) : null; }
        function variant(s) {
            var p = pct();
            return p === null ? "unknown" : p >= 95 ? "open" : p <= 5 ? "closed" : "partial";
        }
        return {
            hover: function () {
                var s = said(id);
                return fill(s["hover_" + variant(s)], { pct: pct() }, s.hover_unknown);
            },
            lines: function () {
                var s = said(id);
                return fillAll(s["lines_" + variant(s)] || s.lines, { pct: pct() }, "...");
            }
        };
    }

    var sun = lamp("lamp_sun", "sun"), dining = lamp("lamp_dining", "dining"),
        corner = lamp("lamp_corner", "corner"), windowside = lamp("lamp_window", "window"),
        spkL = speaker("speaker_l"), spkR = speaker("speaker_r"),
        blindL = blind("blind_living", "Living Room Blinds"), blindD = blind("blind_dining", "Dining Room Blinds");

    R = window.ROOM = {
        dialogue: "living_room",
        house: { base: "/img/living-room/", v: "13", hud: true },
        seenKey: "pandaLivingRoomSeen",
        scene: { src: "/img/living-room/noon@4x.png?v=13", width: 500, height: 357 },

        zOrder: ["lamp_dining", "lamp_window", "speaker_r", "kotatsu", "lamp_sun", "lamp_corner", "speaker_l",
                 "thermostat", "tv", "blind_living", "blind_dining", "door_bedroom", "door_outside"],

        objects: [
            { id: "door_bedroom", rank: 1, go: "/room.html" },         // hover: its line; click: through it
            { id: "door_outside", rank: 2, go: "/explore/explore.html" },   // the front door: out to the city
            {
                id: "tv", rank: 3,
                hover: function () {
                    var s = said("tv"), tv = H.tv ? H.tv() : null;
                    return !tv ? s.hover_unknown : tv.playing ? s.hover_playing : tv.on ? s.hover_on : s.hover_off;
                },
                lines: function () {
                    var s = said("tv"), tv = H.tv ? H.tv() : null;
                    return tv && tv.playing ? (s.lines_playing || s.lines) : s.lines;
                }
            },
            {
                id: "kotatsu", rank: 4,
                hover: function () {
                    var s = said("kotatsu"), on = H.kotatsuOn ? H.kotatsuOn() : null;
                    return on === null ? s.hover_unknown : on ? s.hover_on : s.hover_off;
                },
                lines: function () {
                    var s = said("kotatsu"), on = H.kotatsuOn ? H.kotatsuOn() : null;
                    return on ? (s.lines_on || s.lines) : s.lines;
                }
            },
            { id: "lamp_sun", rank: 5, hover: sun.hover, lines: sun.lines },
            { id: "lamp_dining", rank: 6, hover: dining.hover, lines: dining.lines },
            { id: "lamp_corner", rank: 7, hover: corner.hover, lines: corner.lines },
            { id: "lamp_window", rank: 8, hover: windowside.hover, lines: windowside.lines },
            { id: "speaker_l", rank: 9, hover: spkL.hover, lines: spkL.lines },
            { id: "speaker_r", rank: 10, hover: spkR.hover, lines: spkR.lines },
            { id: "blind_living", rank: 12, hover: blindL.hover, lines: blindL.lines },
            { id: "blind_dining", rank: 13, hover: blindD.hover, lines: blindD.lines },
            {
                id: "thermostat", rank: 11,
                hover: function () {
                    var s = said("thermostat");
                    return fill(s.hover, climateVars(), s.hover_unknown);
                },
                lines: function () {
                    var s = said("thermostat");
                    return fillAll(s.lines, climateVars(), s.hover_unknown);
                }
            }
        ]
    };
})();
