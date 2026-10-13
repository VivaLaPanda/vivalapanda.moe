// What this browser remembers for the scenes (localStorage; without storage nothing sticks): flags you've heard
// around town (pandaHeard_*), your pockets (pandaPockets), and what a pocket says when clicked (looks). Loads before
// js/house-key.js and Explore's scripts, which use it through window.PANDA.
(function () {
    "use strict";

    function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) {   // null forgets it
        try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private */ }
    }
    function json(k, fallback) { try { return JSON.parse(get(k)) || fallback; } catch (e) { return fallback; } }

    // things you've heard around town (a rumour, a mumble) open choices elsewhere: a choice's "need"
    function heard(flag) { return get("pandaHeard_" + flag) === "1"; }
    function hear(flag) {   // one flag or a list of them
        [].concat(flag || []).forEach(function (f) { put("pandaHeard_" + f, "1"); });
    }

    // your pockets, in the order you got things; "pockets" tells the inventory (js/house-key.js) to redraw
    function pockets() { return json("pandaPockets", []); }
    function has(id) { return pockets().indexOf(id) >= 0; }
    function pocket(id) {
        put("pandaPockets", JSON.stringify(pockets().concat(id)));
        document.dispatchEvent(new Event("pockets"));
    }
    function unpocket(id) {
        var got = pockets(), i = got.indexOf(id);
        if (i >= 0) got.splice(i, 1);
        put("pandaPockets", JSON.stringify(got));
        document.dispatchEvent(new Event("pockets"));
    }

    function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
    function arr(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }

    // looks[id](item): what a pocket says when clicked, when it changes (the stamp card): lines, or
    // { lines, choices } for a pocket you can use (the camera)
    window.PANDA = { get: get, put: put, json: json, heard: heard, hear: hear, pockets: pockets, has: has,
                     pocket: pocket, unpocket: unpocket, fill: fill, arr: arr, looks: {} };
})();
