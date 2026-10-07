// Panda's Room: everything that isn't mechanics.
//
// Art, polygons, anchors and lit (hover) sprites come from the easel piece pc98-assets/easel/pieces/panda-room
// (export.py -> out/site: room.png, hotspots.json, lit/, twinkle). All coordinates are the scene's native
// 500x357 pixels; the images are nearest-neighbour 4x copies that the browser scales down smoothly, so
// pixels stay crisp and even.
// The room is only for places elsewhere on the web (accounts, email); the site's own pages are in the sidenav.
// rank = prominence (how much Panda uses the account): 1 is most. It orders the LOOK list,
// keyboard focus and which unvisited object glints first.
// zOrder = the art's objects front to back (hotspots.json z_order_front_to_back): where hit areas
// overlap (the blazer over the window, the console over the TV), the front one wins.
// Dialogue: real visual-novel lines where they fit this room (verbatim, adapted or interpolated;
// PC-98-era lines translated from the Japanese) and plain lines in the same register where they
// don't; every line has to make sense coming from Panda, about that object, in this night room.
// Each line's kind and source is in pc98-assets/assets/panda-room/dialogue-sources.md.
// Keep each box <= 48 characters and use straight quotes (the pc-98 font draws curly ones full-width).
window.ROOM = {
    scene: {
        src: "/img/room/room@4x.png?v=5",
        width: 500,
        height: 357,
        // city lights: an 8-frame strip stepped like PC-98 palette cycling (the export's twinkle.json)
        twinkle: { src: "/img/room/twinkle@4x.png?v=5", x: 191, y: 68, w: 92, h: 87, frames: 8, fps: 2 }
    },

    zOrder: ["controller", "kitsu", "tv", "butterfly", "linkedin", "letter", "stackoverflow", "phone", "lesswrong",
             "plush", "pc", "newspaper", "bookshelf", "poster", "bump", "window"],

    greeting: [
        "Welcome, traveler, to my room of mysteries.",
        "Don't be shy now, come on in.",
        "Poke around all you like! Lost? Press LOOK."
    ],

    objects: [
        {
            id: "window",
            name: "Window",
            service: "Twitter",
            rank: 1,
            polygon: [[146, 60], [328, 60], [328, 162], [308, 162], [306, 164], [306, 168], [304, 169], [301, 241], [163, 241], [162, 209], [159, 206], [146, 205], [146, 61]],
            anchor: [233, 145],
            lit: { src: "/img/room/lit/window@4x.png?v=5", x: 145, y: 59, w: 184, h: 183 },
            hover: "E-everything looks so p-pretty at night...",
            click: [
                "The town, the people... we're all family.",
                "I tweet about it way too much. Mostly zoning."
            ],
            repeat: ["Pleeease... take me somewhere~"],
            choices: [
                { label: "Visit Twitter", href: "https://twitter.com/vivalapanda" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "phone",
            name: "Phone",
            service: "Discord / Signal",
            rank: 2,
            polygon: [[102, 236], [118, 239], [118, 241], [113, 245], [107, 246], [95, 244], [95, 242], [102, 237]],
            anchor: [106, 241],
            lit: { src: "/img/room/lit/phone@4x.png?v=5", x: 94, y: 235, w: 25, h: 12 },
            hit: [[90, 231], [123, 231], [123, 251], [90, 251]], // padded: the object itself is tiny
            hover: "Eh? My phone's buzzing... is that you?",
            click: [
                "On Discord, you can call me vivalapanda.",
                "Secrets go on Signal. They're safe with me."
            ],
            repeat: ["If friends gossip about us... how embarrassing."],
            choices: [
                { label: "Copy my Discord handle", copy: "vivalapanda" },
                { label: "Message on Signal", href: "https://signal.me/#eu/MIrm4ig1ASPFMk21aOIshA8-K9WukBzeRf-EyQ0YWOGqG6brSNlHlqtuk1IbLs5H" },
                { label: "Never mind" }
            ]
        },
        {
            id: "pc",
            name: "PC",
            service: "GitHub",
            rank: 3,
            polygon: [[373, 135], [421, 136], [428, 138], [428, 180], [424, 184], [431, 187], [431, 192], [390, 192], [390, 189], [387, 186], [381, 184], [386, 180], [382, 176], [375, 175], [375, 138], [373, 136]],
            anchor: [402, 161],
            lit: { src: "/img/room/lit/pc@4x.png?v=5", x: 372, y: 134, w: 60, h: 59 },
            hover: "I keep falling asleep at that computer...",
            click: [
                "My true love has always been my computer.",
                "Everything I make ends up on GitHub."
            ],
            repeat: ["Back again? It's an infinitely repeating game."],
            choices: [
                { label: "Visit GitHub", href: "https://github.com/VivaLaPanda" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "newspaper",
            name: "Newspaper",
            service: "Substack",
            rank: 4,
            polygon: [[86, 246], [127, 249], [127, 251], [106, 271], [98, 271], [60, 268], [61, 264], [86, 247]],
            anchor: [94, 258],
            lit: { src: "/img/room/lit/newspaper@4x.png?v=5", x: 59, y: 245, w: 69, h: 27 },
            hover: "Heh. Who knew my essays could be interesting?",
            click: [
                "I write about cities on my Substack.",
                "Well, you can read it at your own pace."
            ],
            repeat: ["Are you ready to continue reading?"],
            choices: [
                { label: "Read the Portal", href: "https://vlpanda.substack.com" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "bookshelf",
            name: "Bookshelf",
            service: "Reading list",
            rank: 5,
            polygon: [[468, 65], [472, 65], [472, 316], [464, 308], [459, 306], [455, 300], [439, 286], [439, 255], [431, 250], [431, 73], [468, 66]],
            anchor: [452, 181],
            lit: { src: "/img/room/lit/bookshelf@4x.png?v=5", x: 430, y: 64, w: 43, h: 252 },
            hover: "If it's books you want, leave it to me.",
            click: [
                "My reading list isn't ready yet. Soon!",
                "I barely got to do any reading today, so..."
            ],
            repeat: ["Still not ready! Reading takes time, okay?"],
            choices: [
                { label: "Look at something else" }
            ]
        },
        {
            id: "butterfly",
            name: "Butterfly",
            service: "Bluesky",
            rank: 6,
            polygon: [[162, 110], [169, 112], [171, 115], [174, 112], [181, 110], [181, 115], [178, 118], [180, 122], [178, 124], [175, 124], [173, 121], [165, 124], [163, 122], [165, 118], [162, 115], [162, 111]],
            anchor: [171, 116],
            lit: { src: "/img/room/lit/butterfly@4x.png?v=5", x: 161, y: 109, w: 21, h: 16 },
            hit: [[159, 107], [184, 107], [184, 127], [159, 127]], // padded, so it's easy to catch
            hover: "I love butterflies. They are the best animal.",
            click: [
                "That one's my Bluesky. I'm there sometimes.",
                "It wouldn't be so bad to be the sky."
            ],
            repeat: ["Why would it be a bird? It's a butterfly!"],
            choices: [
                { label: "Visit Bluesky", href: "https://bsky.app/profile/vivalapanda.moe" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "tv",
            name: "TV",
            service: "Letterboxd",
            rank: 7,
            polygon: [[388, 239], [404, 239], [416, 245], [426, 245], [431, 250], [436, 252], [439, 255], [439, 286], [455, 300], [455, 302], [430, 302], [428, 307], [422, 307], [418, 304], [419, 302], [415, 298], [404, 298], [403, 300], [397, 300], [388, 289], [388, 240]],
            anchor: [414, 273],
            lit: { src: "/img/room/lit/tv@4x.png?v=5", x: 387, y: 238, w: 69, h: 70 },
            hover: "You've found the television, then.",
            click: [
                "Every movie I watch goes on my Letterboxd.",
                "Let's go watch!"
            ],
            repeat: ["It's pro wrestling! Woo! Woo!"],
            choices: [
                { label: "Visit Letterboxd", href: "https://letterboxd.com/VivaLaPanda/" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "letter",
            name: "Letter",
            service: "Email",
            rank: 8,
            polygon: [[349, 161], [368, 161], [368, 173], [349, 173], [349, 162]],
            anchor: [358, 166],
            lit: { src: "/img/room/lit/letter@4x.png?v=5", x: 348, y: 160, w: 21, h: 14 },
            hit: [[346, 158], [371, 158], [371, 176], [346, 176]], // padded: the object itself is small
            hover: "I wrote to my parents last week.",
            click: [
                "You can write to me too! I'm at me@panda.moe.",
                "Everything that you write is a treasure to me."
            ],
            repeat: ["Write to me, okay? I'll write back."],
            choices: [
                { label: "Write to me@panda.moe", href: "mailto:me@panda.moe" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "controller",
            name: "Game console",
            service: "Steam",
            rank: 9,
            polygon: [[403, 298], [416, 298], [420, 305], [436, 322], [436, 332], [405, 332], [401, 326], [394, 325], [398, 321], [389, 309], [389, 300], [403, 299]],
            anchor: [403, 318],
            lit: { src: "/img/room/lit/controller@4x.png?v=5", x: 339, y: 297, w: 98, h: 45 },
            hit: [[338, 335], [342, 331], [389, 298], [403, 296], [416, 296], [418, 298], [435, 318], [438, 322], [438, 332], [436, 334], [360, 343], [342, 343], [338, 339]], // console, cartridge and pad
            hover: "Eh? Just playing some Cities: Skylines.",
            click: [
                "I play games rarely. ...Very rarely.",
                "Hey, what's your favorite game?"
            ],
            repeat: ["Fancy another game?"],
            choices: [
                // verified 2026-10-04: profile "VivaLaPanda", summary "I play games rarely."
                { label: "Visit Steam", href: "https://steamcommunity.com/id/vivalapanda" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "lesswrong",
            name: "Tome",
            service: "LessWrong",
            rank: 10,
            polygon: [[63, 233], [88, 235], [88, 243], [70, 255], [63, 256], [54, 254], [51, 257], [47, 253], [42, 253], [42, 245], [63, 234]],
            anchor: [64, 244],
            lit: { src: "/img/room/lit/lesswrong@4x.png?v=5", x: 41, y: 232, w: 48, h: 27 },
            hover: "Ah, now I started thinking again. This is bad.",
            click: [
                "My nerdier essays go up on LessWrong.",
                "I could go on, but I think you get the point..."
            ],
            repeat: ["As rational as ever, I see."],
            choices: [
                { label: "Visit LessWrong", href: "https://www.lesswrong.com/users/vivalapanda" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "linkedin",
            name: "Blazer",
            service: "LinkedIn",
            rank: 11,
            polygon: [[317, 160], [320, 161], [319, 163], [321, 165], [329, 169], [330, 201], [329, 204], [324, 203], [316, 196], [307, 204], [304, 204], [303, 202], [304, 169], [317, 161]],
            anchor: [316, 183],
            lit: { src: "/img/room/lit/linkedin@4x.png?v=5", x: 302, y: 159, w: 29, h: 46 },
            hover: "Is it hard, being an adult?",
            click: [
                "I wear it to interviews. And on LinkedIn.",
                "Need me for work stuff? LinkedIn's the place."
            ],
            repeat: ["Thank you for your hard work today."],
            choices: [
                { label: "Visit LinkedIn", href: "https://www.linkedin.com/in/smithdevio/" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "kitsu",
            name: "Anime tapes",
            service: "Kitsu",
            rank: 12,
            polygon: [[428, 302], [456, 302], [481, 324], [481, 328], [478, 328], [476, 331], [445, 331], [431, 315], [431, 309], [428, 307], [428, 303]],
            anchor: [453, 316],
            lit: { src: "/img/room/lit/kitsu@4x.png?v=5", x: 427, y: 301, w: 55, h: 31 },
            hover: "Gaze upon my anime tapes and despair!",
            click: [
                "Kitsu says I've watched 93 days of anime.",
                "...And I stopped logging in 2022. Oops."
            ],
            repeat: ["Holy moly! Anime is so extreme these days"],
            choices: [
                // verified 2026-10-06: last list update 2022-07-10, 544 entries, lifeSpentOnAnime 134017 min (~93 days);
                // more current than MAL (myanimelist.net/profile/VivaLaPanda: last list update 2018-05-17)
                { label: "Visit Kitsu", href: "https://kitsu.io/users/VivaLaPanda" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "stackoverflow",
            name: "Rubber duck",
            service: "Stack Overflow",
            rank: 13,
            polygon: [[374, 177], [378, 177], [381, 180], [381, 185], [379, 187], [370, 187], [368, 185], [368, 181], [371, 183], [374, 178]],
            anchor: [375, 182],
            lit: { src: "/img/room/lit/stackoverflow@4x.png?v=5", x: 367, y: 176, w: 15, h: 12 },
            hit: [[366, 175], [383, 175], [383, 189], [366, 189]], // padded: the duck is tiny
            hover: "You think rubber ducks are creepy?",
            click: [
                "I asked the duck for an answer. It was no use.",
                "So I took my question to Stack Overflow."
            ],
            repeat: ["That's a good question. ...Closed as duplicate."],
            choices: [
                { label: "Visit Stack Overflow", href: "https://stackoverflow.com/users/4951118/adrian-smith" },
                { label: "Look at something else" }
            ]
        },
        {
            id: "bump",
            name: "City map",
            service: "Bump",
            rank: 14,
            polygon: [[346, 23], [382, 23], [382, 47], [346, 47], [346, 24]],
            anchor: [363, 34],
            lit: { src: "/img/room/lit/bump@4x.png?v=5", x: 345, y: 22, w: 38, h: 26 },
            hover: "I'm not lost. I just don't know where I am.",
            click: [
                "On Bump, my friends are pins on a map.",
                "I can tell where you went without a GPS."
            ],
            repeat: ["I've got to go meet up with a friend of mine."],
            choices: [
                { label: "Add me on Bump", href: "https://bump.app/p/pAIOBwqINtUQR" },
                { label: "Look at something else" }
            ]
        }
    ],

    // no link: just a line. With a polygon they're hotspots too; without one, LOOK list only.
    knickKnacks: [
        {
            id: "plush",
            name: "Panda plush",
            polygon: [[38, 167], [43, 168], [45, 171], [54, 171], [58, 167], [63, 168], [64, 173], [62, 178], [64, 180], [64, 185], [59, 193], [65, 198], [65, 203], [60, 207], [61, 210], [59, 212], [55, 211], [54, 213], [45, 213], [44, 211], [40, 212], [38, 210], [39, 207], [34, 203], [34, 198], [40, 193], [35, 185], [35, 180], [37, 178], [35, 170], [38, 168]],
            anchor: [49, 190],
            lit: { src: "/img/room/lit/plush@4x.png?v=5", x: 33, y: 166, w: 33, h: 48 },
            hover: "The panda says, 'Gao, gao!'",
            lines: [
                "He's the original Panda. I'm the sequel.",
                "Sorry, I was born cute."
            ]
        },
        {
            id: "poster",
            name: "Poster",
            polygon: [[64, 67], [131, 67], [131, 150], [64, 150], [64, 68]],
            anchor: [97, 108],
            lit: { src: "/img/room/lit/poster@4x.png?v=5", x: 63, y: 66, w: 69, h: 85 },
            hover: "Cuteness wins in the end. Cuteness is justice!",
            lines: [
                "That's my favorite magical girl!",
                "Abracadabra! Welcome to life as a magical girl!"
            ]
        }
    ],

    lines: {
        idle: [
            "It's nice and quiet in here, isn't it?",
            "Do... would you like some tea?",
            "Luck comes to those who smile. So, smile!",
            "Hear that? The last train's heading home."
        ],
        empty: [
            "Hm? Are you talking to moi?",
            "If you need something, just say it!",
            "Hey, don't make that face.",
            "Uguu..."
        ],
        lookPrompt: "What do you want to look at?",
        leaving: "It's not good bye, it's see you again.",
        copied: "Copied! It's vivalapanda.",
        copyFailed: "Huh? It didn't copy... it's vivalapanda!",
        backToRoom: "Okkei!",
        allSeen: "Congratulations! You found everything~!"
    }
};
