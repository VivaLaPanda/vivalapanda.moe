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
            { to: "?loc=partystreet", rect: [264, 378, 106, 87] },
            { to: "/living-room.html", rect: [0, 478, 640, 50] }   // behind you
        ],
        // a neon sign by the canopy (the casino's door), its N on the blink
        layers: [{ src: "../img/explore/layers/casino-sign.png", rect: [-115, 0, 969, 528], pixel: true },
                 { src: "../img/explore/layers/casino-sign-n.png", rect: [-115, 0, 969, 528], pixel: true, anim: "buzz" }]
    },
    "agency": {
        title: "The Agency", image: "../img/explore/places/agency.gif", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/kavinsky-nightcall.mp3",
        links: [
            { to: "?loc=partystreet", rect: [0, 478, 640, 50] }
        ]
    },
    "casino": {
        title: "The Casino", image: "../img/explore/places/casino.png", pos: "left",   // a panorama: explore-play.js pans it
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/sonic-casino-night-zone.mp4",
        links: []
    },
    "club": {
        title: "Club Polka", image: "../img/explore/places/club.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/control-your-music.mp3",
        links: [
            { to: "?loc=cardroom", rect: [600, 100, 140, 150] },   // a door marked PRIVATE, behind the lights
            { to: "?loc=partystreet", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "floor", rect: [166, 217, 415, 170] }]
    },
    "forestedge": {
        title: "The Edge of the Forest", image: "../img/explore/pathways/forest.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/death-bringer-forest.mp3",
        links: [
            { to: "?loc=forestglade", rect: [174, 189, 416, 297] },
            { to: "?loc=forestpath", rect: [590, 380, 150, 95] },   // the dirt path, uphill
            { to: "?loc=nightplaza", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    // the hills: a quiet trail from the forest's edge, round to a campfire and back down to the glade
    "forestpath": {
        title: "A Sunlit Path", image: "../img/explore/places/day_forest.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: [
            { to: "?loc=teaparty", rect: [270, 150, 200, 250] },
            { to: "?loc=forestedge", rect: [0, 478, 640, 50] }
        ]
    },
    "teaparty": {
        title: "A Clearing", image: "../img/explore/places/day_forest_teaparty.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: [
            { to: "?loc=hilltop", rect: [580, 0, 160, 220] },
            { to: "?loc=forestpath", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "table", rect: [230, 230, 290, 150] }]
    },
    "hilltop": {
        title: "The Hilltop", image: "../img/explore/pathways/day_hilltop.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac09.mp3",
        links: [
            { to: "?loc=lilyfield", rect: [0, 380, 260, 95] },
            { to: "?loc=observatory", rect: [440, 120, 120, 80] },   // a little dome on the far ridge
            { to: "?loc=teaparty", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "view", rect: [0, 120, 440, 200] }, { id: "kids", rect: [470, 330, 170, 110] }]
    },
    // drawn for the city (FAL, quantized to its own inks); the telescope shows tonight's real moon (js/explore-play.js)
    "observatory": {
        title: "The Hill Observatory", image: "../img/explore/places/observatory.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: [
            { to: "?loc=hilltop", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "telescope", rect: [475, 66, 199, 382] }, { id: "desk", rect: [143, 232, 232, 216] },
                  { id: "charts", rect: [380, 100, 120, 100] }]
    },
    "lilyfield": {
        title: "The Lily Field", image: "../img/explore/pathways/flower_plain.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
        links: [
            { to: "?loc=campsite", rect: [250, 200, 300, 110] },
            { to: "?loc=hilltop", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "lilies", rect: [0, 380, 740, 98] }]
    },
    "campsite": {
        title: "A Campfire", image: "../img/explore/places/night_forest_campsite.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/death-bringer-forest.mp3",
        links: [
            { to: "?loc=inari", rect: [0, 0, 130, 240] },   // red gates, between the trees
            { to: "?loc=forestglade", rect: [600, 0, 140, 200] },
            { to: "?loc=lilyfield", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "fire", rect: [300, 220, 130, 140] }, { id: "campers", rect: [430, 150, 180, 260] }]
    },
    // drawn for the city (FAL, quantized); off the campfire, up through the gates and out at the city shrine
    "inari": {
        title: "The Fox Gates", image: "../img/explore/places/inari.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
        links: [
            { to: "?loc=shrine", rect: [309, 100, 133, 249] },   // up through the gates
            { to: "?loc=campsite", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "fox_l", rect: [1, 183, 149, 216] }, { id: "fox_r", rect: [591, 183, 149, 216] }]
    },
    "forestglade": {
        title: "The Hidden Glade", image: "../img/explore/places/forestglade.png", pos: "left",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
        links: [
            { to: "../train.html", rect: [174, 189, 416, 297] }
        ],
        layers: [{ src: "../img/explore/layers/glade-glints-a.png", rect: [0, 0, 1022, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/glade-glints-b.png", rect: [0, 0, 1022, 528], pixel: true, anim: "twinkle-b" }],
        objects: [{ id: "pond", rect: [0, 420, 740, 108] }]   // the house key's hunt ends here (js/house-key.js)
    },
    "musicianbedroom": {
        title: "Andy's House", image: "../img/explore/places/night_musician_bedroom.png", pos: "left",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/andypls-kurisu-muffled.mp3",
        links: [
            { to: "https://www.beepbox.co", rect: [-3, 188, 230, 207] },
            { to: "https://youtu.be/edgcGDWhMNM", rect: [437, 28, 230, 437] },
            { to: "?loc=nightresidential2", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    "nightapartments": {
        title: "Acacia Apartments", image: "../img/explore/pathways/night_apartments.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/kara-no-naka-wht-vrgn-blk-slv.mp3",
        links: [
            { to: "?loc=rooftop", rect: [427, 330, 98, 152] },   // up the outside stairs
            { to: "nightresidential_girl.html", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    // the stray cat's way home: only open once you've chased it (js/explore-play.js)
    "backpassage": {
        title: "A Back Passage", image: "../img/explore/pathways/ghetto.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/possessioner-abandoned-district.mp3",
        links: [
            { to: "?loc=oldhouse", rect: [202, 410, 142, 107] },
            { to: "?loc=nightapartments", rect: [0, 478, 640, 50] }   // behind you
        ],
        objects: [{ id: "drifter", rect: [71, 482, 107, 46] }]
    },
    "oldhouse": {
        title: "The Old House", image: "../img/explore/places/night_home_front.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [
            { to: "?loc=catroom", rect: [336, 255, 141, 113] },
            { to: "?loc=shrine", rect: [0, 377, 207, 151] },
            { to: "?loc=backpassage", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    "catroom": {
        title: "The Old House", image: "../img/explore/places/night_room_traditional.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [
            { to: "?loc=oldhouse", rect: [0, 0, 60, 280] },
            { to: "?loc=zengarden", rect: [266, 98, 72, 125] }
        ],
        layers: [{ src: "../img/explore/layers/cat-sleeping.png", rect: [431, 469, 50, 29], pixel: true },
                 { src: "../img/explore/layers/cat-sleeping-in.png", rect: [431, 469, 50, 29], pixel: true, anim: "breathe" }],
        objects: [{ id: "cat", rect: [420, 455, 72, 48] }, { id: "tea", rect: [316, 326, 107, 63] },
                  { id: "tv", rect: [567, 277, 89, 143] }, { id: "daruma", rect: [0, 283, 62, 86] },
                  { id: "scroll", rect: [110, 89, 81, 242] }]
    },
    // behind Erratic Errata, for those who ask for the second edition (js/explore-play.js)
    "zengarden": {
        title: "A Hidden Garden", image: "../img/explore/pathways/zengarden.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: [
            { to: "?loc=weirdstore", rect: [0, 330, 200, 148] },
            { to: "?loc=catroom", rect: [137, 243, 122, 78] }
        ],
        objects: [{ id: "teahouse", rect: [476, 122, 156, 165] }, { id: "bridge", rect: [137, 243, 122, 78] },
                  { id: "pond", rect: [415, 295, 325, 190] }]
    },
    // drawn for the city (FAL, quantized to Acacia Apartments' inks); shooting stars in js/explore-play.js
    "rooftop": {
        title: "Acacia Apartments, the Roof", image: "../img/explore/places/rooftop.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/kara-no-naka-wht-vrgn-blk-slv.mp3",
        links: [
            { to: "?loc=nightapartments", rect: [0, 330, 100, 148] }
        ],
        objects: [{ id: "sky", rect: [0, 0, 740, 230] }, { id: "laundry", rect: [209, 249, 216, 133] },
                  { id: "tank", rect: [458, 249, 100, 149] }, { id: "chair", rect: [541, 398, 116, 116] }]
    },
    "nightpark": {
        title: "Pumpo Park", image: "../img/explore/pathways/night_park.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/viper-moon.mp3",
        links: [
            { to: "?loc=festival", rect: [483, 377, 257, 151] },
            { to: "?loc=nightplaza", rect: [0, 478, 640, 50] }   // behind you
        ],
        objects: [{ id: "flyer", rect: [423, 430, 80, 45] }],   // on the restroom hut
        // far back in the trees, the festival's lanterns
        layers: [{ src: "../img/explore/layers/park-lanterns.png", rect: [-83, 0, 905, 528], pixel: true, anim: "flicker" }]
    },
    "festival": {
        title: "The Summer Festival", image: "../img/explore/pathways/night_festival.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/dance_in_the_memories.mp3",
        links: [
            { to: "?loc=shrine", rect: [0, 275, 187, 253] },
            { to: "?loc=nightpark", rect: [0, 478, 640, 50] }   // behind you
        ],
        objects: [{ id: "goldfish", rect: [183, 407, 169, 73] }, { id: "wataame", rect: [352, 202, 183, 321] },
                  { id: "yakisoba", rect: [608, 202, 132, 321] }]
    },
    "shrine": {
        title: "Pumpo Shrine", image: "../img/explore/places/night_temple_festival.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/dance_in_the_memories.mp3",
        links: [
            { to: "?loc=forestedge", rect: [543, 101, 126, 201] },
            { to: "?loc=underbridge", rect: [0, 250, 80, 160] },   // steps down to the river
            { to: "?loc=festival", rect: [0, 478, 640, 50] }   // behind you
        ],
        objects: [{ id: "offering", rect: [266, 201, 218, 184] }]
    },
    "nightplaza": {
        title: "Picrew Plaza", image: "../img/explore/pathways/night_city_plaza.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/viper-moon.mp3",
        links: [
            { to: "?loc=nightpark", rect: [545, 219, 101, 97] },
            { to: "?loc=nightresidential", rect: [659, 319, 85, 127] },
            { to: "?loc=forestedge", rect: [2, 209, 415, 87] },
            { to: "?loc=bookshop", rect: [415, 204, 130, 87] },   // the little building at the back
            { to: "?loc=nightcafe", rect: [100, 200, 120, 90] }   // a lit window between the trees
        ],
        layers: [{ src: "../img/explore/layers/plaza-glints-a.png", rect: [-80, 0, 901, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/plaza-glints-b.png", rect: [-80, 0, 901, 528], pixel: true, anim: "twinkle-b" }]
    },
    "bookshop": {
        title: "The Night Bookshop", image: "../img/explore/pathways/night_minilibrary.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/viper-moon.mp3",
        links: [
            { to: "?loc=nightplaza", rect: [0, 380, 150, 98] },
            { to: "?loc=nightresidential", rect: [600, 380, 140, 70] }
        ]
    },
    "nightresidential": {
        title: "Residential District", image: "../img/explore/pathways/night_residential.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac01.mp3",
        links: [
            { to: "?loc=catcafe", rect: [560, 160, 120, 160] },   // a warm window behind the wall: cats in it
            { to: "?loc=nightresidential2", rect: [264, 398, 246, 47] },
            { to: "?loc=konbini", rect: [168, 184, 113, 223] }   // the shop glowing on the left
        ]
    },
    "konbini": {
        title: "The Konbini", image: "../img/explore/places/conbini.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac01.mp3",
        links: [
            { to: "?loc=nightresidential", rect: [0, 478, 640, 50] }
        ]
    },
    // drawn for the city (FAL, quantized to its own inks); the tumbling laundry in js/explore-play.js
    "laundromat": {
        title: "Coin Laundry", image: "../img/explore/places/laundromat.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [
            { to: "?loc=nightresidential2", rect: [380, 130, 280, 190] },   // the glass door, out to the street
            { to: "?loc=nightresidential2", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "machine", rect: [0, 330, 90, 120] }, { id: "machines", rect: [90, 50, 260, 380] },
                  { id: "vending", rect: [682, 149, 58, 208] }, { id: "chairs", rect: [549, 330, 130, 145] },
                  { id: "sock", rect: [258, 462, 62, 40] }]
    },
    // under Tokugawa Tower (the lobby's lift goes down here)
    "garage": {
        title: "Tokugawa Tower, B1", image: "../img/explore/places/garage.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/possessioner-abandoned-district.mp3",
        links: [
            { to: "frontdesk.html", rect: [410, 210, 60, 85] },   // the lift, under the green sign
            { to: "frontdesk.html", rect: [0, 478, 420, 50] }
        ],
        objects: [{ id: "bluecar", rect: [430, 300, 230, 228] }, { id: "redcar", rect: [170, 280, 260, 140] }]
    },
    // behind the door marked PRIVATE at the back of Club Polka: Ruri's table (high-low in js/explore-play.js)
    "cardroom": {
        title: "A Back Room", image: "../img/explore/places/day_tavernlady.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/kavinsky-nightcall.mp3",
        links: [
            { to: "?loc=club", rect: [560, 0, 180, 300] },   // back down the stairs
            { to: "?loc=club", rect: [0, 478, 640, 50] }
        ]
    },
    // floor 3 of Tokugawa Tower (the lift)
    "gallery": {
        title: "Tokugawa Gallery", image: "../img/explore/places/gallery.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: [
            { to: "frontdesk.html", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "dots", rect: [313, 255, 85, 94] }, { id: "nude", rect: [436, 279, 141, 57] },
                  { id: "ufo", rect: [625, 260, 66, 94] }, { id: "big", rect: [31, 0, 160, 349] },
                  { id: "visitors", rect: [500, 340, 110, 110] }]
    },
    // under the tracks by Isogashii Crossing (trains rumble overhead: js/explore-play.js)
    "izakaya": {
        title: "Izakaya Gonta", image: "../img/explore/places/day_izakaya.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/ippatsu-jang-see-you-later.mp3",
        links: [
            { to: "?loc=stationcrossing", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "salarymen", rect: [0, 200, 150, 160] }]
    },
    "nightcafe": {
        title: "A Late Cafe", image: "../img/explore/places/night_cafe.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/viper-moon.mp3",
        links: [
            { to: "?loc=nightplaza", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "window", rect: [150, 300, 440, 170] }]
    },
    // drawn for the city (FAL, quantized to its own inks); through the purple door by the ramen stall
    "karaoke": {
        title: "Karaoke Box", image: "../img/explore/places/karaoke.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/college-electric-youth-real-hero.mp3",
        links: [
            { to: "?loc=ramen", rect: [0, 478, 640, 50] }
        ],
        // the disco ball's spots, changing colour in turn
        layers: [{ src: "../img/explore/layers/karaoke-spots-a.png", rect: [-24, 0, 787, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/karaoke-spots-b.png", rect: [-24, 0, 787, 528], pixel: true, anim: "twinkle-b" }],
        objects: [{ id: "tv", rect: [100, 60, 210, 230] }, { id: "table", rect: [250, 330, 260, 140] }]
    },
    // only reachable 2-4am, through a door in the back passage (js/explore-play.js)
    "bar25": {
        title: "Bar 25", image: "../img/explore/places/bar.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/eve-burst-error-room-marina.mp3",
        links: [
            { to: "?loc=backpassage", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "bartender", rect: [181, 17, 216, 415] }, { id: "lady", rect: [430, 133, 216, 382] }]
    },
    // downstream of the shrine: petals float by (js/explore-play.js); so, sometimes, do wishes
    "underbridge": {
        title: "Under the Bridge", image: "../img/explore/places/dark_bridge.png", pos: "center",
        holo: "../img/holo/HolosurpriseBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [
            { to: "?loc=shrine", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "girl", rect: [146, 211, 79, 79] }, { id: "river", rect: [300, 300, 440, 178] }]
    },
    // drawn for the city (FAL, quantized); the cats are in the picture, each one clickable
    "catcafe": {
        title: "Neko no Ma", image: "../img/explore/places/cat_cafe.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-neptune.mp3",
        links: [
            { to: "?loc=nightresidential", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "calico", rect: [30, 140, 90, 70] }, { id: "grey", rect: [280, 130, 80, 70] },
                  { id: "smallginger", rect: [150, 205, 70, 55] }, { id: "ginger", rect: [200, 310, 110, 70] },
                  { id: "white", rect: [490, 220, 100, 110] }, { id: "cream", rect: [590, 400, 120, 78] }]
    },
    "nightresidential2": {
        title: "Residential District Houses", image: "../img/explore/pathways/night_residential_2.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac01.mp3",
        links: [
            { to: "nightresidential_girl.html", rect: [317, 208, 80, 47] },
            { to: "?loc=musicianbedroom", rect: [47, 78, 130, 287] },
            { to: "?loc=laundromat", rect: [455, 200, 65, 100] },   // the gap in the wall, a light on behind it
            { to: "?loc=nightresidential", rect: [0, 478, 640, 50] }   // behind you
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
            { to: "/recipes.html", rect: [155, 285, 85, 179] },
            { to: "?loc=gamecentre", rect: [0, 147, 102, 64] }
        ]
    },
    // drawn for the city like the ramen stall (FAL, quantized to Isogashii Boulevard's inks)
    "gamecentre": {
        title: "Taito Game Centre", image: "../img/explore/places/game_centre.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/animahjong-x-10.mp3",
        links: [
            { to: "?loc=partystreet", rect: [0, 478, 640, 50] },
            { to: "?loc=club", rect: [610, 140, 90, 200] }
        ],
        objects: [{ id: "claw", rect: [250, 100, 230, 400] }, { id: "cabinets", rect: [0, 150, 220, 300] },
                  { id: "cabinets2", rect: [520, 150, 220, 300] }]
    },
    "stationcrossing": {
        title: "Isogashii Crossing", image: "../img/explore/pathways/day_trainstation_crossing.png", pos: "center right",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=trainplatform", rect: [524, 276, 216, 174] },
            { to: "?loc=izakaya", rect: [280, 215, 60, 90] },   // the shadow under the tracks
            { to: "?loc=partystreet", rect: [0, 478, 640, 50] }   // behind you
        ],
        // the walk signal changes now and then
        layers: [{ src: "../img/explore/layers/signal-red-off.png", rect: [-105, 0, 845, 528], pixel: true, anim: "signal" },
                 { src: "../img/explore/layers/signal-walk-on.png", rect: [-105, 0, 845, 528], pixel: true, anim: "signal" }]
    },
    "trainplatform": {
        title: "Platform 1", image: "../img/explore/places/train_platform.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-begin.mp3",
        links: [
            { to: "?loc=trainwetlands", rect: [481, 96, 151, 354] },
            { to: "?loc=stationcrossing", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    "trainwetlands": {
        // the bridge without its train (a FAL plate, only where the train was), and the train crossing it, behind the
        // masts (img/explore/layers/train*.png, cut from the original picture)
        title: "On the train", image: "../img/explore/places/day_wetlands_bridge_empty.png", pos: "center",
        layers: [{ src: "../img/explore/layers/train.png", rect: [308, 307, 466, 64], pixel: true, anim: "train" },
                 { src: "../img/explore/layers/train-pole.png", rect: [-34, 0, 808, 528], pixel: true }],
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
            { to: "?loc=nighttrain", rect: [268, 261, 269, 78] }   // the train home
        ]
    },
    // the last train home: drawn for the city (FAL, quantized); its windows are cut out, and the town's lights
    // scroll past underneath (night-train-lights.png, twice the picture's width, tiles)
    "nighttrain": {
        title: "The Last Train", image: "../img/explore/places/night_train_windows.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/train-music/tenniscoats-tantan-therapy.mp3",
        under: { src: "../img/explore/layers/night-train-lights.png", rect: [-24, 0, 1574, 528], anim: "lights" },
        links: [
            { to: "?loc=trainplatform", rect: [588, 200, 64, 115] },   // the door at the end: off at Platform 1
            { to: "?loc=otojima", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "seat", rect: [0, 330, 420, 140] }]
    },
    "surfshop": {
        title: "Half Pipe", image: "../img/explore/places/day_beach_shop.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/doki-doki-vac09.mp3",
        links: [
            { to: "?loc=beach", rect: [655, 180, 85, 348] },
            { to: "?loc=otojima", rect: [0, 478, 640, 50] }   // behind you
        ],
        objects: [{ id: "shop", rect: [98, 196, 425, 249] }]
    },
    "beach": {
        title: "Otojima Beach", image: "../img/explore/pathways/day_beach.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/caught-a-star-in-your-eye.mp3",
        links: [
            { to: "?loc=sunset", rect: [470, 262, 270, 158] },
            { to: "?loc=surfshop", rect: [0, 478, 640, 50] }   // behind you
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
            { to: "?loc=harbour", rect: [0, 446, 284, 82] },
            { to: "?loc=beach", rect: [0, 478, 640, 50] }   // behind you
        ],
        layers: [{ src: "../img/explore/layers/sunset-glints-a.png", rect: [-59, 0, 857, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/sunset-glints-b.png", rect: [-59, 0, 857, 528], pixel: true, anim: "twinkle-b" }],
        objects: [{ id: "sun", rect: [627, 257, 113, 103] }]
    },
    "harbour": {
        title: "Otojima Harbour", image: "../img/explore/pathways/night_coast.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-office-marina.mp3",
        links: [
            { to: "?loc=lake", rect: [573, 179, 167, 55] },   // the little boat upriver
            { to: "?loc=aquarium", rect: [0, 138, 142, 69] },   // the lit building along the shore
            { to: "?loc=lighthouse", rect: [143, 110, 60, 90] },   // the beacon, up the steps
            { to: "?loc=pier", rect: [250, 150, 200, 60] },   // the lights along the shore
            { to: "?loc=otojima", rect: [492, 345, 248, 183] }
        ]
    },
    // drawn for the city (FAL, quantized to its own 16 blues); jellyfish in js/explore-play.js
    "aquarium": {
        title: "Otojima Aquarium", image: "../img/explore/places/aquarium.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-office-marina.mp3",
        links: [
            { to: "?loc=beach", rect: [500, 180, 100, 150] },
            { to: "?loc=harbour", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "bench", rect: [306, 408, 125, 72] }, { id: "ray", rect: [558, 45, 152, 143] }]
    },
    // a stop on the riverboat line: the lake under the mountain, a ferry crossing it (cut out of the picture, the
    // lake behind it filled from the same rows further along)
    "lake": {
        title: "Lake Otojima", image: "../img/explore/places/day_park_coast_noboat.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
        layers: [{ src: "../img/explore/layers/ferry.png", rect: [40, 188, 157, 49], pixel: true, anim: "ferry" }],
        links: [
            { to: "?loc=riverboat", rect: [0, 230, 500, 120] },   // on, upriver
            { to: "?loc=harbour", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "flowers", rect: [200, 400, 300, 78] }, { id: "tree", rect: [580, 0, 160, 420] }]
    },
    // drawn for the city (FAL, quantized); the lens's lit glass flashes as it turns past (lighthouse-flash.png)
    "lighthouse": {
        title: "The Lighthouse", image: "../img/explore/places/lighthouse.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/train-music/sufjan-stevens-seven-swans.mp3",
        layers: [{ src: "../img/explore/layers/lighthouse-flash.png", rect: [-24, 0, 787, 528], pixel: true, anim: "flash" },
                 { src: "../img/explore/layers/lighthouse-glints-a.png", rect: [-24, 0, 787, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/lighthouse-glints-b.png", rect: [-24, 0, 787, 528], pixel: true, anim: "twinkle-b" }],
        links: [
            { to: "?loc=harbour", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "lamp", rect: [0, 33, 150, 266] }, { id: "town", rect: [430, 190, 310, 90] },
                  { id: "sea", rect: [200, 300, 540, 178] }]
    },
    // drawn for the city (FAL, quantized); the wheel's bulbs chase (pier-bulbs-a/b: bulb pixels from the full-colour
    // drawing, in two alternating sets)
    "pier": {
        title: "Otojima Pier", image: "../img/explore/places/pier.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/caught-a-star-in-your-eye.mp3",
        layers: [{ src: "../img/explore/layers/pier-bulbs-a.png", rect: [-24, 0, 787, 528], pixel: true, anim: "twinkle-a" },
                 { src: "../img/explore/layers/pier-bulbs-b.png", rect: [-24, 0, 787, 528], pixel: true, anim: "twinkle-b" }],
        links: [
            { to: "?loc=harbour", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "wheel", rect: [474, 0, 266, 415] }, { id: "carousel", rect: [0, 199, 210, 216] },
                  { id: "booth", rect: [383, 307, 91, 141] }]
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
            { to: "../sympho-slots/index.html", rect: [183, 204, 237, 287] },
            { to: "?loc=partystreet", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    "weaponshop": {
        title: "Ghandi's Surplus Suprises", image: "../img/explore/places/weaponshop.gif", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-hacking.mp3",
        links: [
            { to: "?loc=nightalley", rect: [0, 478, 640, 50] }
        ]
    },
    "nightalley": {
        title: "The Alley", image: "../img/explore/pathways/night_busy_alley.png", pos: "center right",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=shizukastreet", rect: [483, 214, 67, 87] },
            { to: "?loc=weaponshop", rect: [425, 207, 45, 119] },
            { to: "?loc=cutiebar", rect: [238, 113, 77, 357] },
            { to: "?loc=ramen", rect: [522, 308, 110, 220] }
        ]
    },
    // drawn for the city: FAL from the Alley's and the festival's pictures, quantized to the Alley's 16 inks
    "ramen": {
        title: "A Ramen Stall", image: "../img/explore/places/ramen_yatai.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=karaoke", rect: [100, 170, 65, 140] },   // the purple-lit door in the alley wall
            { to: "?loc=nightalley", rect: [0, 300, 90, 178] },
            { to: "?loc=cutiebar", rect: [680, 230, 60, 190] }
        ],
        objects: [{ id: "sign_ramen", rect: [100, 0, 50, 120] }, { id: "sign_cashier", rect: [170, 30, 40, 100] }, { id: "sign_ramen2", rect: [612, 0, 50, 100] },
                  { id: "lantern", rect: [184, 125, 75, 133] }, { id: "stools", rect: [275, 374, 315, 116] }]
    },
    "cutiebar": {
        title: "Rabu Rabu", image: "../img/explore/places/bar_with_cutie.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-sweetheart.mp3",
        links: [
            { to: "?loc=nightalley", rect: [0, 478, 640, 50] }
        ]
    },
    "shizukastreet": {
        title: "Shizuka Street", image: "../img/explore/pathways/night_city_street.png", pos: "center left",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/cosmic-psycho-settle.mp3",
        links: [
            { to: "?loc=weirdstore", rect: [557, 193, 114, 197] },
            { to: "?loc=livehouse", rect: [306, 277, 48, 85] },
            { to: "?loc=bathhouseentry", rect: [206, 277, 48, 85] },
            { to: "?loc=netcafe", rect: [40, 60, 75, 240] }   // Cafe Noa's sign, on the left
        ],
        objects: [{ id: "sign_coffee", rect: [95, 70, 30, 120] }, { id: "sign_slot", rect: [400, 0, 45, 220] }, { id: "sign_karaoke", rect: [595, 50, 45, 80] }]
    },
    // drawn for the city (FAL, quantized to Shizuka Street's inks); its booth links out to Panda's old haunts
    "netcafe": {
        title: "Net Cafe Noa", image: "../img/explore/places/net_cafe.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-hacking.mp3",
        links: [
            { to: "?loc=shizukastreet", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "booth", rect: [441, 274, 166, 133] }, { id: "drinkbar", rect: [267, 141, 166, 75] },
                  { id: "manga", rect: [0, 66, 93, 200] }, { id: "clock", rect: [686, 66, 42, 58] }]
    },
    "weirdstore": {
        title: "Erratic Errata", image: "../img/explore/places/shop_misc_interior.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/crystal-rinal-school-days.mp3",
        links: [
            { to: "?loc=shizukastreet", rect: [0, 478, 640, 50] }
        ],
        objects: [{ id: "backdoor", rect: [418, 180, 66, 160] }]   // the staff door (js/explore-play.js)
    },
    "livehouse": {
        title: "Namba Bears", image: "../img/explore/places/night_weird_bar.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/mesuneko-hishoshitsu-staff-roll.mp3",
        links: [
            { to: "?loc=shizukastreet", rect: [0, 478, 640, 50] }
        ]
    },
    "smallbathhouse": {
        title: "Brownie's Bathhouse", image: "../img/explore/places/bathhouse_small.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-room-marina.mp3",
        links: [
            { to: "?loc=bathhouseentry", rect: [620, 100, 120, 100] }
        ]
    },
    "bathhouseentry": {
        title: "Brownie's Bathhouse", image: "../img/explore/portraits/bath.png", pos: "center",
        holo: "../img/holo/HoloHappyBGTransparent.png", music: "../audio/eve-burst-error-room-marina.mp3",
        links: [
            { to: "?loc=smallbathhouse", rect: [58, 428, 597, 100] },
            { to: "?loc=shizukastreet", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    "frontdesk": {
        title: "Tokugawa Tower Lobby", image: "/img/explore/places/front_desk.gif", pos: "left",
        frame: "light", music: "/audio/possessioner-abandoned-district.mp3",
        links: [
            { to: "penthouse.html", rect: [146, 7, 113, 23], sprite: "/img/explore/overlays/penthouse-button.png" },
            { to: "towerbar.html", rect: [170, 98, 70, 26], sprite: "/img/explore/overlays/bar-button.png" },
            { to: "explore.html", rect: [0, 478, 640, 50] }   // behind you
        ]
    },
    "penthouse": {
        title: "Tokugawa Tower Penthouse", image: "/img/explore/places/city_overlook_transparent.png", pos: "center",
        holo: "/img/holo/HolosurpriseBGTransparent.png", frame: "light", music: "/audio/possessioner-city-a.mp3",
        links: [
            { to: "frontdesk.html", rect: [0, 478, 640, 50] }
        ],
        under: {"src": "/img/explore/settings/skyling-normal-flicker.gif", "rect": [-1, -332, 780, 780]}
    },
    "nightresidential_girl": {
        title: "Residential District", image: "/img/explore/pathways/night_residential_girl.png", pos: "center",
        music: "/audio/iskaku-horror-1.mp3",
        links: [
            { to: "explore.html?loc=nightapartments", rect: [17, 278, 80, 157] },
            { to: "explore.html?loc=nightresidential2", rect: [0, 478, 640, 50] }   // behind you
        ],
        objects: [{ id: "girl", rect: [377, 328, 80, 187] }]
    },
    "towerbar": {
        title: "Tokugawa Tower Bar", image: "/img/explore/places/bar_crowded.png", pos: "left",
        frame: "light", music: "/audio/cosmic-psycho-bar.mp3",
        links: [
            { to: "frontdesk.html", rect: [0, 478, 640, 50] }
        ],
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
                                  h: L.under.rect[3], under: true, pixel: true, anim: L.under.anim }] : []).concat((L.layers || []).map(function (l) {
                return { src: l.src, x: l.rect[0], y: l.rect[1], w: l.rect[2], h: l.rect[3], pixel: l.pixel, anim: l.anim };
            }))
        },
        views: L.views,
        objects: objects,
        knickKnacks: []
    };
})();
