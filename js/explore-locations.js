// Explore: the city of Pandopolis, one scene per location, run by js/scene.js like the rooms. explore/explore.html
// shows the location named by ?loc= (Main Street without one); the tower's own pages and the girl's street are pages
// of their own (their <body data-scene="...">). Everything anyone says is in /data/dialogue.json, section "explore".
// Per location: title (the page title), image and pos (the picture, cover-fitted, at that object-position), holo
// (the right sidebar), music, frame ("light" for the light window frame; dark otherwise), links (exits: to, and rect
// [x, y, w, h] in the 740x528 scene window; sprite: a visible button there), objects (things to click that aren't
// exits: id, rect, and view to switch to one of views), under (a picture under the main one: src, rect), layers (pictures over it: src, rect, pixel, anim).
// What there is to do in a place (games, menus, animals) is js/explore-play.js.
// The map is meant to be illegible: exits are plain click areas, no outlines, no LOOK (R.illegible).
var LOCATIONS = {
    "mainstreet": {
        title: "Pandopolis", image: "../img/explore/pathways/mainstreet_night.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/possessioner-possessioner.mp3",
        links: [
            { to: "frontdesk.html", rect: [505, 379, 141, 127] },
            { to: "?loc=casino", rect: [0, 303, 123, 130] },
            { to: "?loc=nightplaza", rect: [409, 399, 85, 77] },
            { to: "?loc=partystreet", rect: [264, 378, 106, 87] }
        ]
    },
    "agency": {
        title: "The Agency", image: "../img/explore/places/agency.gif", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/kavinsky-nightcall.mp3",
        links: []
    },
    "casino": {
        title: "The Casino", image: "../img/explore/places/casino.png", pos: "left",   // a panorama: explore-play.js pans it
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/sonic-casino-night-zone.mp4",
        links: []
    },
    "club": {
        title: "Club Polka", image: "../img/explore/places/club.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/control-your-music.mp3",
        links: [],
        objects: [{ id: "floor", rect: [166, 217, 415, 170] }]
    },
    "forestedge": {
        title: "The Edge of the Forest", image: "../img/explore/pathways/forest.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/death-bringer-forest.mp3",
        links: [
            { to: "?loc=forestglade", rect: [174, 189, 416, 297] }
        ]
    },
    "forestglade": {
        title: "The Hidden Glade", image: "../img/explore/places/forestglade.png", pos: "left",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
        links: [
            { to: "../train.html", rect: [174, 189, 416, 297] }
        ],
        objects: [{ id: "pond", rect: [0, 420, 740, 108] }]   // the house key's hunt ends here (js/house-key.js)
    },
    "musicianbedroom": {
        title: "Andy's House", image: "../img/explore/places/night_musician_bedroom.png", pos: "left",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/andypls-kurisu-muffled.mp3",
        links: [
            { to: "https://www.beepbox.co", rect: [-3, 188, 230, 207] },
            { to: "https://youtu.be/edgcGDWhMNM", rect: [437, 28, 230, 437] }
        ]
    },
    "nightapartments": {
        title: "Acacia Apartments", image: "../img/explore/pathways/night_apartments.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/kara-no-naka-wht-vrgn-blk-slv.mp3",
        links: [
            { to: "?loc=nightapartments", rect: [317, 208, 80, 47] }
        ]
    },
    // the stray cat's way home: only open once you've chased it (js/explore-play.js)
    "backpassage": {
        title: "A Back Passage", image: "../img/explore/pathways/ghetto.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/possessioner-abandoned-district.mp3",
        links: [
            { to: "?loc=oldhouse", rect: [202, 410, 142, 107] }
        ],
        objects: [{ id: "drifter", rect: [71, 482, 107, 46] }]
    },
    "oldhouse": {
        title: "The Old House", image: "../img/explore/places/night_home_front.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [
            { to: "?loc=catroom", rect: [336, 255, 141, 113] },
            { to: "?loc=shrine", rect: [0, 377, 207, 151] }
        ]
    },
    "catroom": {
        title: "The Old House", image: "../img/explore/places/night_room_traditional.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [],
        layers: [{ src: "../img/explore/layers/cat-sleeping.png", rect: [431, 469, 50, 29], pixel: true }],
        objects: [{ id: "cat", rect: [420, 455, 72, 48] }, { id: "tea", rect: [316, 326, 107, 63] },
                  { id: "tv", rect: [567, 277, 89, 143] }, { id: "daruma", rect: [0, 283, 62, 86] },
                  { id: "scroll", rect: [110, 89, 81, 242] }, { id: "window", rect: [266, 98, 72, 125] }]
    },
    "nightpark": {
        title: "Pumpo Park", image: "../img/explore/pathways/night_park.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/viper-moon.mp3",
        links: [
            { to: "?loc=festival", rect: [483, 377, 257, 151] }
        ],
        // far back in the trees, the festival's lanterns
        layers: [{ src: "../img/explore/layers/park-lanterns.png", rect: [-83, 0, 905, 528], pixel: true, anim: "flicker" }]
    },
    "festival": {
        title: "The Summer Festival", image: "../img/explore/pathways/night_festival.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/dance_in_the_memories.mp3",
        links: [
            { to: "?loc=shrine", rect: [0, 275, 187, 253] }
        ],
        objects: [{ id: "goldfish", rect: [183, 407, 169, 73] }, { id: "wataame", rect: [352, 202, 183, 321] },
                  { id: "yakisoba", rect: [608, 202, 132, 321] }]
    },
    "shrine": {
        title: "Pumpo Shrine", image: "../img/explore/places/night_temple_festival.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/dance_in_the_memories.mp3",
        links: [
            { to: "?loc=forestedge", rect: [543, 101, 126, 201] }
        ],
        objects: [{ id: "offering", rect: [266, 201, 218, 184] }]
    },
    "nightplaza": {
        title: "Picrew Plaza", image: "../img/explore/pathways/night_city_plaza.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/viper-moon.mp3",
        links: [
            { to: "?loc=nightpark", rect: [545, 219, 101, 97] },
            { to: "?loc=nightresidential", rect: [659, 319, 85, 127] },
            { to: "?loc=forestedge", rect: [2, 209, 415, 87] }
        ]
    },
    "nightresidential": {
        title: "Residential District", image: "../img/explore/pathways/night_residential.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac01.mp3",
        links: [
            { to: "?loc=nightresidential2", rect: [264, 398, 246, 47] }
        ]
    },
    "nightresidential2": {
        title: "Residential District Houses", image: "../img/explore/pathways/night_residential_2.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac01.mp3",
        links: [
            { to: "nightresidential_girl.html", rect: [317, 208, 80, 47] },
            { to: "?loc=musicianbedroom", rect: [47, 78, 130, 287] }
        ]
    },
    "partystreet": {
        title: "Isogashii Boulevard", image: "../img/explore/pathways/night_street_busy.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/animahjong-x-10.mp3",
        links: [
            { to: "?loc=club", rect: [621, 276, 91, 174] },
            { to: "?loc=agency", rect: [609, 4, 115, 167] },
            { to: "?loc=nightalley", rect: [423, 290, 85, 103] },
            { to: "?loc=stationcrossing", rect: [223, 290, 85, 103] },
            { to: "?loc=electronicstore", rect: [39, 285, 85, 179] },
            { to: "/recipes.html", rect: [155, 285, 85, 179] }
        ]
    },
    "stationcrossing": {
        title: "Isogashii Crossing", image: "../img/explore/pathways/day_trainstation_crossing.png", pos: "center right",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=trainplatform", rect: [524, 276, 216, 174] }
        ]
    },
    "trainplatform": {
        title: "Platform 1", image: "../img/explore/places/train_platform.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-begin.mp3",
        links: [
            { to: "?loc=trainwetlands", rect: [481, 96, 151, 354] }
        ]
    },
    "trainwetlands": {
        title: "On the train", image: "../img/explore/places/day_wetlands_bridge.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doradora-emotion-dor02.mp3",
        links: [
            { to: "../train.html", rect: [299, 316, 441, 54] },
            { to: "?loc=otojima", rect: [0, 349, 102, 87] }
        ]
    },
    // the train's last stop: a day by the sea, a sunset, the harbour, and a boat back upriver to the glade
    "otojima": {
        title: "Otojima Station", image: "../img/explore/pathways/day_train_station.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac09.mp3",
        links: [
            { to: "?loc=surfshop", rect: [0, 373, 740, 155] },
            { to: "?loc=trainplatform", rect: [268, 261, 269, 78] }
        ]
    },
    "surfshop": {
        title: "Half Pipe", image: "../img/explore/places/day_beach_shop.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac09.mp3",
        links: [
            { to: "?loc=beach", rect: [655, 180, 85, 348] }
        ],
        objects: [{ id: "shop", rect: [98, 196, 425, 249] }]
    },
    "beach": {
        title: "Otojima Beach", image: "../img/explore/pathways/day_beach.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/caught-a-star-in-your-eye.mp3",
        links: [
            { to: "?loc=sunset", rect: [470, 262, 270, 158] }
        ],
        layers: [{ src: "../img/explore/layers/beach-glints-a.png", rect: [0, 0, 740, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/beach-glints-b.png", rect: [0, 0, 740, 528], pixel: true, anim: "twinkle-b" }],
        objects: [{ id: "drink", rect: [20, 326, 64, 98] }, { id: "chair", rect: [220, 330, 120, 198] },
                  { id: "sea", rect: [0, 240, 470, 100] }]
    },
    "sunset": {
        title: "The Shore at Sunset", image: "../img/explore/places/sunset.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/college-electric-youth-real-hero.mp3",
        links: [
            { to: "?loc=harbour", rect: [0, 446, 284, 82] }
        ],
        layers: [{ src: "../img/explore/layers/sunset-glints-a.png", rect: [-59, 0, 857, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/sunset-glints-b.png", rect: [-59, 0, 857, 528], pixel: true, anim: "twinkle-b" }],
        objects: [{ id: "sun", rect: [627, 257, 113, 103] }]
    },
    "harbour": {
        title: "Otojima Harbour", image: "../img/explore/pathways/night_coast.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-office-marina.mp3",
        links: [
            { to: "?loc=riverboat", rect: [573, 179, 167, 55] },
            { to: "?loc=otojima", rect: [492, 345, 248, 183] }
        ]
    },
    "riverboat": {
        title: "Up the River", image: "../img/explore/pathways/riverboat.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
        links: [
            { to: "?loc=forestglade", rect: [208, 271, 116, 96] }
        ]
    },
    "electronicstore": {
        title: "Denchi's Delights", image: "../img/explore/places/electronics_store.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/ippatsu-jang-see-you-later.mp3",
        links: [
            { to: "../sympho-slots/index.html", rect: [183, 204, 237, 287] }
        ]
    },
    "weaponshop": {
        title: "Ghandi's Surplus Suprises", image: "../img/explore/places/weaponshop.gif", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-hacking.mp3",
        links: []
    },
    "nightalley": {
        title: "The Alley", image: "../img/explore/pathways/night_busy_alley.png", pos: "center right",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=shizukastreet", rect: [483, 214, 67, 87] },
            { to: "?loc=weaponshop", rect: [425, 207, 45, 119] },
            { to: "?loc=cutiebar", rect: [238, 113, 77, 357] }
        ]
    },
    "cutiebar": {
        title: "Rabu Rabu", image: "../img/explore/places/bar_with_cutie.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-sweetheart.mp3",
        links: []
    },
    "shizukastreet": {
        title: "Shizuka Street", image: "../img/explore/pathways/night_city_street.png", pos: "center left",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=weirdstore", rect: [557, 193, 114, 197] },
            { to: "?loc=livehouse", rect: [306, 277, 48, 85] },
            { to: "?loc=bathhouseentry", rect: [206, 277, 48, 85] }
        ]
    },
    "weirdstore": {
        title: "Erratic Errata", image: "../img/explore/places/shop_misc_interior.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: []
    },
    "livehouse": {
        title: "Namba Bears", image: "../img/explore/places/night_weird_bar.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/mesuneko-hishoshitsu-staff-roll.mp3",
        links: []
    },
    "smallbathhouse": {
        title: "Brownie's Bathhouse", image: "../img/explore/places/bathhouse_small.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-room-marina.mp3",
        links: []
    },
    "bathhouseentry": {
        title: "Brownie's Bathhouse", image: "../img/explore/portraits/bath.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-room-marina.mp3",
        links: [
            { to: "?loc=smallbathhouse", rect: [58, 428, 597, 100] }
        ]
    },
    "frontdesk": {
        title: "Tokugawa Tower Lobby", image: "/img/explore/places/front_desk.gif", pos: "left",
        frame: "light", music: "/audio/possessioner-abandoned-district.mp3",
        links: [
            { to: "penthouse.html", rect: [146, 7, 113, 23], sprite: "/img/explore/overlays/penthouse-button.png" },
            { to: "towerbar.html", rect: [170, 98, 70, 26], sprite: "/img/explore/overlays/bar-button.png" }
        ]
    },
    "penthouse": {
        title: "Tokugawa Tower Penthouse", image: "/img/explore/places/city_overlook_transparent.png", pos: "center",
        holo: "/img/holo/HolosurpriseBGTransparent.png", frame: "light", music: "/audio/possessioner-city-a.mp3",
        links: [],
        under: {"src": "/img/explore/settings/skyling-normal-flicker.gif", "rect": [-1, -332, 780, 780]}
    },
    "nightresidential_girl": {
        title: "Residential District", image: "/img/explore/pathways/night_residential_girl.png", pos: "center",
        music: "/audio/iskaku-horror-1.mp3",
        links: [
            { to: "explore.html?loc=nightapartments", rect: [17, 278, 80, 157] }
        ],
        objects: [{ id: "girl", rect: [377, 328, 80, 187] }]
    },
    "towerbar": {
        title: "Tokugawa Tower Bar", image: "/img/explore/places/bar_crowded.png", pos: "left",
        frame: "light", music: "/audio/cosmic-psycho-bar.mp3",
        links: [],
        objects: [{ id: "regular", rect: [485, 59, 141, 357], view: "barshoujo" }],
        views: {"barshoujo": {"src": "/img/explore/portraits/bar_lady.png", "pos": "center"}}
    }
};

// the location this page shows, as a scene for js/scene.js
(function () {
    "use strict";
    var id = document.body.dataset.scene || new URLSearchParams(location.search).get("loc") || "mainstreet";
    var L = LOCATIONS[id];
    if (!L) {
        location.replace("/explore/explore.html");
        return;
    }
    function poly(r) { return [[r[0], r[1]], [r[0] + r[2], r[1]], [r[0] + r[2], r[1] + r[3]], [r[0], r[1] + r[3]]]; }
    function titleOf(to) {                           // an exit's name, for screen readers: where it goes
        var m = /[?&]loc=(\w+)/.exec(to), page = /(\w+)\.html/.exec(to);
        var dest = m ? LOCATIONS[m[1]] : page && LOCATIONS[page[1]];
        return "Go to " + (dest ? dest.title : to.replace(/^\.\.\/|^\//, ""));
    }
    var objects = L.links.map(function (l, i) {
        return { id: "exit" + i, rank: i + 1, go: l.to, polygon: poly(l.rect), name: titleOf(l.to),
                 sprite: l.sprite ? { src: l.sprite, x: l.rect[0], y: l.rect[1], w: l.rect[2], h: l.rect[3] } : null };
    }).concat((L.objects || []).map(function (o, i) {
        return { id: o.id, rank: 100 + i, polygon: poly(o.rect), view: o.view };
    }));
    window.ROOM = {
        dialogue: "explore." + id,
        illegible: true,
        typeMs: 7,
        title: L.title,
        alt: L.title,
        frame: L.frame === "light" ? null : "dark",
        holo: L.holo,
        music: L.music,
        back: id === "mainstreet" ? "/living-room.html" : "/explore/explore.html",
        seenKey: "pandaExploreSeen",
        scene: {
            src: L.image, width: 740, height: 528, fit: "cover", pos: L.pos,
            layers: (L.under ? [{ src: L.under.src, x: L.under.rect[0], y: L.under.rect[1], w: L.under.rect[2],
                                  h: L.under.rect[3], under: true }] : []).concat((L.layers || []).map(function (l) {
                return { src: l.src, x: l.rect[0], y: l.rect[1], w: l.rect[2], h: l.rect[3], pixel: l.pixel, anim: l.anim };
            }))
        },
        views: L.views,
        objects: objects,
        knickKnacks: []
    };
})();
