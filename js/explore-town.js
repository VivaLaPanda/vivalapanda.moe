// Explore's town life and the threads that cross it: Johnny's rumours, the net cafe, the shrine's ema, the hidden
// garden, the bookshop, the stray cat, the stamp rally, the camera, Panda's notebook, the Pandopolis Times, the
// pocket radio, the rooftop ending.
(function () {
    "use strict";

    var R = window.ROOM, S = window.SCENE, X = window.EXPLORE;
    var P = X.P, arr = X.arr, fill = X.fill, get = X.get, has = X.has, hear = X.hear, heard = X.heard, obj = X.obj,
        place = X.place, pocket = X.pocket, put = X.put, song = X.song, unpocket = X.unpocket, whenIdle = X.whenIdle;
    var PLAY = {};   // place id -> its setup, run once this file has loaded

    // the rooftop ending: the party, plus a line for each thread you closed (dialogue.json play.finale_extra)
    S.actions.finale = function () {
        var p = P(), extra = (p.finale_extra || []).filter(function (x) { return heard(x.need); }).map(function (x) { return x.line; });
        var lines = p.finale.slice(0, -1).concat(extra, p.finale.slice(-1));
        S.say(lines, function () { S.home(false); });
    };

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
    if (place === "observatory") hear("observatory_seen");
    PLAY.bar25 = function () { hear("bar25_seen"); };
    if (place === "otojima") hear("visited_otojima");   // a postcard arrives at home (dialogue.json letters)

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
                var words = " " + msg.toLowerCase().replace(/[^a-z0-9 ]+/g, " ") + " ";
                var special = (p.special || []).filter(function (r) { return r.keys.some(function (k) { return words.indexOf(" " + k + " ") >= 0; }); })[0];
                var reply = special ? special.reply : p.replies[Math.floor(Math.random() * p.replies.length)];
                S.say([fill(p.posted, { msg: msg.trim().slice(0, 40) }), reply], function () { S.home(false); });
            });
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
            hear("poem_read");
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
                hiddenWay([622, 285, 100, 175], "?loc=bar25", "A door you haven't seen before");
                (function sayWhenFree() {   // after the greeting's done, never over it
                    var arrow = document.getElementById("text-arrow");
                    if ((arrow && !arrow.hidden) || document.getElementById("room-text").textContent.length < 3) { setTimeout(sayWhenFree, 800); return; }
                    if (!S.stage.querySelector(".play-overlay")) S.say(arr(P().late_door));
                })();
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
    // once you've made friends (petted it at the old house), the cat sometimes turns up sitting around town
    var CAT_SPOTS = {
        mainstreet: [210, 485, 35, 22], nightplaza: [318, 462, 31, 19], ramen: [588, 475, 27, 17],
        shrine: [343, 503, 27, 17], festival: [150, 506, 29, 18], rooftop: [500, 309, 31, 19], laundromat: [615, 360, 31, 19],
        catcafe: [604, 318, 31, 19]
    };
    // (at the cat cafe, once you've fed it, it's always there: the greeting says so)
    if (CAT_SPOTS[place] && heard("catfriend") && (Math.random() < .4 || (place === "catcafe" && heard("cat_fed")))) {
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
    function rally() { return window.PANDA.json("pandaRally", {}); }
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
    window.PANDA.looks.rally = function (it) {
        var got = rally(), n = RALLY.filter(function (k) { return got[k]; }).length;
        put("pandaRallyNew", "");
        var names = RALLY.map(function (k) { return got[k] ? it.places[k] : "???"; }).join(", ");
        if (n === RALLY.length && !has("pin")) setTimeout(function () { pocket("pin"); }, 0);
        if (n === RALLY.length) hear("rally_complete");   // the roof's ending opens
        return [fill(it.card, { n: n, total: RALLY.length }), names].concat(n === RALLY.length ? arr(it.complete) : []);
    };


    // ---------- the disposable camera (from Half Pipe): photos at scenic spots, an album in your pockets ----------

    var PHOTO_SPOTS = ["sunset", "rooftop", "penthouse", "festival", "forestglade", "beach", "aquarium", "zengarden",
                       "shrine", "harbour", "hilltop", "lilyfield", "campsite", "lighthouse", "lake", "observatory",
                       "nighttrain", "karaoke", "inari", "underbridge", "catcafe", "bar25", "gallery", "pier"];
    var EXPOSURES = 24;
    function photos() { return window.PANDA.json("pandaPhotos", []); }
    function camLines() { return (R.dialogueAll.pockets || {}).camera; }
    function snap(after) {
        var p = camLines(), got = photos();
        got.push(place);
        put("pandaPhotos", JSON.stringify(got));
        if (got.length >= 3) hear("photographer");   // enough for an exhibition (the gallery)
        var flash = document.createElement("div");
        flash.className = "play-flash";
        S.stage.appendChild(flash);
        setTimeout(function () { flash.remove(); }, 450);
        var lines = [fill(p.taken, { left: EXPOSURES - got.length })];
        if (got.length >= 3 && !heard("camera_bagged")) { hear("camera_bagged"); lines = lines.concat(arr(p.bagged)); }
        S.say(lines, after);
    }
    // the first few scenic spots offer a photo by themselves; after that the camera's in your bag (click it)
    if (PHOTO_SPOTS.indexOf(place) >= 0) {
        (R.afterGreeting = R.afterGreeting || []).push(function () {
            var p = camLines();
            if (!p || !has("camera") || heard("camera_bagged") || photos().length >= 3 || photos().indexOf(place) >= 0) return null;
            return [{ label: p.take_label, act: function () { snap(function () { S.home(false); }); } }];
        });
    }
    // a print to keep: the place's picture, framed like a photo, saved as a PNG on your device
    function savePrint(src, title) {
        var im = new Image();
        im.onload = function () {
            var w = im.naturalWidth * 2, h = im.naturalHeight * 2, pad = 24, cv = document.createElement("canvas");
            cv.width = w + pad * 2; cv.height = h + pad * 4;
            var ctx = cv.getContext("2d");
            ctx.fillStyle = "#f4efe4"; ctx.fillRect(0, 0, cv.width, cv.height);
            ctx.imageSmoothingEnabled = false; ctx.drawImage(im, pad, pad, w, h);
            ctx.fillStyle = "#3a3048"; ctx.font = "20px monospace"; ctx.fillText(title + " · Pandopolis", pad, h + pad * 2.6);
            var a = document.createElement("a");
            a.download = "pandopolis-" + place + ".png"; a.href = cv.toDataURL("image/png"); a.click();
        };
        im.src = src;
    }

    // the album: your photos laid out like prints on a table (click to put them away)
    window.PANDA.looks.camera = function (it) {
        var got = photos(), here = PHOTO_SPOTS.indexOf(place) >= 0, choices = [];
        if (here && got.indexOf(place) < 0 && got.length < EXPOSURES) {
            choices.push({ label: it.take_label, act: function () { snap(function () { S.home(false); }); } });
        } else if (here && it.print_label) {
            choices.push({ label: it.print_label, act: function () {
                savePrint(LOCATIONS[place].image, LOCATIONS[place].title);
                S.say(arr(it.printed), function () { S.home(false); });
            } });
        }
        if (choices.length) {
            choices.push({ label: it.album_label, act: function () { S.say(album(it), function () { S.home(false); }); } });
            return { lines: [fill(it.ready, { left: EXPOSURES - got.length })], choices: choices.concat([{ label: it.away_label }]) };
        }
        return album(it);
    };
    function album(it) {
        var got = photos();
        if (!got.length || !window.LOCATIONS) return arr(it.look);
        var table = document.createElement("div");
        table.className = "play-album";
        got.forEach(function (k, i) {
            var L = LOCATIONS[k], ph = document.createElement("div");
            if (!L) return;
            ph.className = "play-photo";
            ph.style.backgroundImage = "url(" + (k === "penthouse" ? "/img/explore/settings/skyling-normal-flicker.gif" : L.image) + ")";
            ph.style.transform = "rotate(" + ((i * 37 % 11) - 5) + "deg)";
            ph.title = L.title;
            table.appendChild(ph);
        });
        table.addEventListener("click", function (e) { e.stopPropagation(); table.remove(); });
        S.stage.appendChild(table);
        return [fill(it.album, { n: got.length })];
    }

    // ---------- Panda's notebook: what you've done and what you said you'd do (pockets.notebook in dialogue.json) ----------

    if (!has("notebook")) setTimeout(function () { pocket("notebook"); }, 0);   // everyone gets one on their first walk
    window.PANDA.looks.notebook = function (it) {
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
        function boxes(head, items) {   // as many boxes as it takes, each short enough for the dialog box
            var cur = head;
            items.forEach(function (t) {
                if ((cur + " " + t).length > 90) { out.push(cur); cur = t; } else cur += " " + t;
            });
            out.push(cur);
        }
        if (todo.length) boxes(it.todo_head, todo);
        if (done.length) boxes(it.done_head, done);
        var nudge = (it.nudges || []).filter(ok)[0];   // the first thing you haven't done, gently
        if (nudge) out.push(it.nudge_head + " " + nudge.text);
        return out.length > 1 || todo.length || done.length ? out : arr(it.empty).concat(out);
    };

    // the gallery's exhibition of your photos: the album, framed as a show
    S.actions.exhibition = function () {
        var cam = (R.dialogueAll.pockets || {}).camera;
        if (!cam) return;
        album(cam);
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
    window.PANDA.looks.radio = function (it) {
        var st = it.stations[Math.floor(Math.random() * it.stations.length)];
        song(st.src);
        return [fill(it.tuned, { station: st.name })];
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
})();
