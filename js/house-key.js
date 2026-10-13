// Panda's spare key, and the hunt for it. Whoever holds the key can switch the living room's lamps, blinds and AC on
// and off. Two ways to get it: Explore (Johnny Uppercut names four people who owe Panda a favour; each hands over an
// item, and the four dropped in the Hidden Glade's pond bring up the key), or the bedroom PC's login (the real
// password, or an SQL injection). The key is a token from /house/api/key (scripts/house_key.py), kept in this
// browser with the hunt's progress; the server checks it on every switch. Lines: dialogue.json "house_key".
// Runs on every scene page (after js/scene.js); what it adds depends on the page.
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE;
    var KEY = "pandaHouseKey", HUNT = "pandaHunt";
    var API = "/house/api/";
    // the four favours and the word on each. The server holds the words' hash: change them together
    // (scripts/house_key.py set-hunt)
    var ITEMS = { matchbook: "dials", token: "belly", ticket: "purred", pick: "homer" };
    var ORDER = ["matchbook", "token", "ticket", "pick"];
    var LAMPS = { lamp_sun: "sun", lamp_dining: "dining", lamp_corner: "corner", lamp_window: "window" };
    var BLINDS = { blind_living: "Living Room Blinds", blind_dining: "Dining Room Blinds" };
    var AC = "Air Conditioner";
    var place = (R.dialogue || "").replace(/^explore\./, "");   // an Explore location, or "living_room", "bedroom"
    var inv = null;

    // ---------- what this browser holds (works without storage too: nothing sticks) ----------

    function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) {
        try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* private */ }
    }
    function key() { return get(KEY); }
    function hunt() {                     // { started, items: { id: true }, dropped: { id: true } }
        var h;
        try { h = JSON.parse(get(HUNT)) || {}; } catch (e) { h = {}; }
        h.items = h.items || {};
        h.dropped = h.dropped || {};
        return h;
    }
    function saveHunt(h) { put(HUNT, JSON.stringify(h)); }
    function pockets() {                         // one of each prize, in the order won
        var got = [];
        try { got = JSON.parse(get("pandaPockets")) || []; } catch (e) { got = []; }
        return got.filter(function (id, i) { return got.indexOf(id) === i; });
    }
    function carrying(h) { return ORDER.filter(function (id) { return h.items[id] && !h.dropped[id]; }); }
    function collected(h) { return ORDER.filter(function (id) { return h.items[id]; }).length; }

    // ---------- lines ----------

    function T() { return R.dialogueAll && R.dialogueAll.house_key; }
    function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
    function arr(x) { return x == null ? [] : Array.isArray(x) ? x : [x]; }
    function itemName(id) { return T().items[id].name; }

    // ---------- the server ----------

    // { ...reply, status } (status 0: unreachable)
    function post(path, body, headers) {
        var h = { "Content-Type": "application/json" };
        Object.keys(headers || {}).forEach(function (k) { h[k] = headers[k]; });
        return fetch(API + path, { method: "POST", headers: h, body: JSON.stringify(body) }).then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) { j.status = r.status; return j; });
        }, function () { return { status: 0 }; });
    }

    function gotKey(token) {
        put(KEY, token);
        put("pandaHeard_house_key", "1");   // Explore's places can notice (dialogue.json greeting_after)
        drawInventory();
    }

    // ---------- the inventory, by the dialog box's ▼ ----------

    function button(src, label, onClick) {
        var b = document.createElement("button");
        b.type = "button";
        b.title = label;
        b.setAttribute("aria-label", label);
        var im = document.createElement("img");
        im.src = "/img/house-key/" + src;
        im.alt = "";
        b.appendChild(im);
        b.addEventListener("click", function (e) { e.stopPropagation(); onClick(); });
        inv.appendChild(b);
    }

    // everything you're carrying: [icon, name, look, new?]; few enough show as icons, more go in a bag (a list)
    function carried() {
        var t = T(), out = [];
        pockets().forEach(function (id) {       // finds and prizes from Explore (js/explore-*.js)
            var it = (R.dialogueAll.pockets || {})[id];
            if (!it) return;
            out.push({ icon: (it.icon || "plush-" + id) + ".png", name: it.name,
                       look: function () {   // a pocket whose words change (the stamp card), looked up when clicked
                           var look = window.POCKET_LOOK && window.POCKET_LOOK[id], said = look ? look(it) : arr(it.look);
                           if (said && said.lines) S.say(said.lines, function () { S.offer(said.choices); });   // a pocket you can use
                           else S.say(said);
                           if (look) drawInventory();
                       },
                       fresh: (id === "rally" && get("pandaRallyNew") === "1") || (id === "letters" && get("pandaLettersNew") === "1") });
        });
        carrying(hunt()).forEach(function (id) {
            out.push({ icon: id + ".png", name: itemName(id), look: function () { S.say([fill(t.items[id].look, { word: ITEMS[id] })]); } });
        });
        return out;
    }

    var BAG_AT = 4;   // more things than this and they go in the bag (a row of icons would cover the menu)

    function drawInventory() {
        var t = T(), box = document.getElementById("text-box");
        if (!t || !box) return;
        if (!inv) {
            inv = document.createElement("div");
            inv.id = "hk-inventory";
            box.appendChild(inv);
        }
        inv.textContent = "";
        var things = carried();
        if (things.length > BAG_AT) {
            button("bag.png", fill(t.bag, { n: things.length }), function () {
                S.offer(things.map(function (th) { return { label: th.name, act: th.look }; }).concat([{ label: t.bag_close }]), 3);
            });
            if (things.some(function (th) { return th.fresh; })) inv.lastChild.classList.add("hk-new");
        } else {
            things.forEach(function (th) {
                button(th.icon, th.name, th.look);
                if (th.fresh) inv.lastChild.classList.add("hk-new");
            });
        }
        if (key()) button("key.png", "Panda's spare key", function () { S.say(arr(t.slot_key)); });
        else button("key-empty.png", "An empty key slot", function () { S.say(arr(t.slot_empty)); });
    }


    // ---------- the hunt (Explore) ----------

    function johnny() {
        var t = T().johnny, h = hunt();
        var again = function () { S.offer([{ label: t.choice, act: johnny }]); };
        if (!h.started) {
            h.started = true;
            saveHunt(h);
            S.say(arr(t.job).concat(arr(t.names)), again);
        } else if (collected(h) < ORDER.length) {
            S.say([fill(t.short, { left: ORDER.length - collected(h) })].concat(arr(t.names)), again);
        } else {
            S.say(arr(t.done), again);
        }
    }

    function give(id) {
        var it = T().items[id], h = hunt();
        h.items[id] = true;
        saveHunt(h);
        drawInventory();
        S.say(arr(it.give).concat([fill(it.got, { word: ITEMS[id] })]));
    }

    // who here owes Panda a favour you haven't collected (once Johnny's sent you)
    function owedHere() {
        var t = T(), h = hunt();
        if (!h.started || key()) return null;
        return ORDER.filter(function (id) { return t.items[id].place === place && !h.items[id]; })[0] || null;
    }

    (R.afterGreeting = R.afterGreeting || []).push(function () {
        var t = T();
        if (!t) return null;
        if (place === "agency") return key() ? null : [{ label: t.johnny.choice, act: johnny }];
        var id = owedHere();
        if (!id) return null;
        var it = t.items[id];
        if (it.ask) {   // the attendant: "did you drop this?"
            S.say(arr(it.ask), function () { S.offer([{ label: it.take, act: function () { give(id); } }]); });
            return true;
        }
        return [{ label: t.favour_choice, act: function () { give(id); } }];
    });

    // the Hidden Glade's pond: the sword's lake. Drop in the four favours, and a hand brings up the key
    function pondChoices() {
        var t = T(), h = hunt();
        if (t && key() && t.pond.coin) {   // the key's found: the pond's just a pond again, good for a wish
            return [{ label: t.pond.coin, act: function () { S.say(arr(t.pond.coin_lines[Math.floor(Math.random() * t.pond.coin_lines.length)])); } }];
        }
        if (!t || key() || collected(h) < ORDER.length) return null;
        return carrying(h).map(function (id) {
            return { label: fill(t.pond.drop, { item: itemName(id) }), act: function () { drop(id); } };
        });
    }

    function drop(id) {
        var t = T(), h = hunt();
        h.dropped[id] = true;
        saveHunt(h);
        drawInventory();
        var line = fill(t.pond.sinks, { item: itemName(id) });
        if (carrying(h).length) {
            S.say([line], function () { S.offer(pondChoices()); });
            return;
        }
        S.say([line], function () {
            post("key", { route: "lake", words: ORDER.map(function (x) { return ITEMS[x]; }) }).then(function (r) {
                if (r.key) {
                    S.say(arr(t.pond.rises), function () {
                        S.offer([{ label: t.pond.take, act: function () { gotKey(r.key); S.say(arr(t.pickup)); } }]);
                    });
                    return;
                }
                h.dropped = {};          // the favours come back: try again later (or the words changed)
                saveHunt(h);
                drawInventory();
                S.say(arr(r.status === 401 ? t.pond.refused : t.pond.offline));
            });
        });
    }

    // ---------- the bedroom PC's login ----------

    S.actions.pc_login = function () {
        var t = T().pc;
        if (key()) { S.say(arr(t.already)); return; }
        (function prompt(before) {
            S.ask([(before ? before + "\n" : "") + t.prompt], function (password) {
                if (!password) return;
                post("key", { route: "pc", password: password }).then(function (r) {
                    if (r.key) { gotKey(r.key); S.say(arr(t.welcome).concat(arr(T().pickup))); }
                    else if (r.sql) prompt(r.sql);
                    else if (r.status === 401) prompt(t.denied);
                    else if (r.status === 429) S.say(arr(T().switch.slow));
                    else S.say(arr(t.offline));
                });
            });
        })(null);
    };

    // ---------- the living room's switches ----------

    function onOff(on, s, labels, act) {        // the choices for a thing that's on (true), off, or unknown (null)
        var c = [];
        if (on !== true) c.push({ label: s[labels[0]], act: function () { act(true); } });
        if (on !== false) c.push({ label: s[labels[1]], act: function () { act(false); } });
        c.push({ label: s.leave });
        return c;
    }

    function toggle(device, on, done, patch) {
        var s = T().switch, H = window.HOUSE || {};
        post("act", { device: device, on: on }, { "X-House-Key": key() }).then(function (r) {
            if (r.ok) {
                if (patch && H.patch) H.patch(patch);
                S.say(arr(s[done]));
                if (H.refresh) setTimeout(H.refresh, 75000);   // the feed has it by then (blinds included)
            } else if (r.status === 403) { put(KEY, null); drawInventory(); S.say(arr(s.bad_key)); }
            else if (r.status === 429) S.say(arr(s.slow));
            else if (r.status === 503) S.say(arr(s.off_now));
            else S.say(arr(s.failed));
        });
    }

    function switches(o) {
        var H = window.HOUSE || {};
        if (LAMPS[o.id]) {
            o.choices = function () {
                var dev = key() && T() && H.lampDevice ? H.lampDevice(LAMPS[o.id]) : null;
                if (!dev) return null;
                return onOff(H.lampOn(LAMPS[o.id]), T().switch, ["on", "off"], function (on) {
                    toggle(dev, on, "lamp_done", function (st) {
                        (st.lights || []).forEach(function (l) { if (l.name === dev) l.on = on; });
                    });
                });
            };
        } else if (BLINDS[o.id]) {
            o.choices = function () {
                if (!key() || !T()) return null;
                var pct = H.blindPct ? H.blindPct(BLINDS[o.id]) : null;
                var open = pct === null ? null : pct >= 100 ? true : pct <= 0 ? false : null;
                return onOff(open, T().switch, ["open", "close"], function (on) {
                    toggle(BLINDS[o.id], on, "blind_done", null);   // shown as they move, from the feed
                });
            };
        } else if (o.id === "ac") {
            o.choices = function () {
                if (!key() || !T()) return null;
                var ac = H.aircon ? H.aircon() : null;
                return onOff(ac ? ac.on : null, T().switch, ["on", "off"], function (on) {
                    toggle(AC, on, "ac_done", function (st) { if (st.aircon) st.aircon.on = on; });
                });
            };
        }
    }

    // ---------- wiring ----------

    R.objects.forEach(function (o) {
        if (place === "living_room") switches(o);
        if (place === "forestglade" && o.id === "pond") {
            o.lines = function () { return T() ? arr(T().pond.still) : ["..."]; };
            o.click = function () { return arr(T().pond.waiting); };
            o.choices = pondChoices;
        }
    });
    // ---------- letters: people you've helped in Explore write to you; they arrive when you come home ----------

    function lettersHome() {
        var all = R.dialogueAll && R.dialogueAll.letters;
        if (!all || place !== "living_room") return;
        var got;
        try { got = JSON.parse(get("pandaLetters")) || []; } catch (e) { got = []; }
        var fresh = Object.keys(all).filter(function (k) {
            return k.charAt(0) !== "_" && got.indexOf(k) < 0 && get("pandaHeard_" + all[k].need) === "1";
        });
        if (!fresh.length) return;
        put("pandaLetters", JSON.stringify(got.concat(fresh)));
        var pk;
        try { pk = JSON.parse(get("pandaPockets")) || []; } catch (e) { pk = []; }
        if (pk.indexOf("letters") < 0) put("pandaPockets", JSON.stringify(pk.concat("letters")));
        put("pandaLettersNew", "1");
        drawInventory();
        S.say(arr(fill(R.dialogueAll.pockets.letters.arrived, { n: fresh.length })));
    }
    window.POCKET_LOOK = window.POCKET_LOOK || {};
    window.POCKET_LOOK.letters = function (it) {
        var all = R.dialogueAll.letters, got;
        try { got = JSON.parse(get("pandaLetters")) || []; } catch (e) { got = []; }
        put("pandaLettersNew", "");
        var out = [];
        got.forEach(function (k) { if (all[k]) out = out.concat(arr(all[k].text)); });
        return out.length ? out : arr(it.look);
    };

    document.addEventListener("scenestart", drawInventory);
    document.addEventListener("scenestart", function () {   // after the greeting's done, never over it
        (function whenFree() {
            var arrow = document.getElementById("text-arrow");
            if (arrow && !arrow.hidden) { setTimeout(whenFree, 800); return; }
            lettersHome();
        })();
    });
    document.addEventListener("pockets", drawInventory);
})();
