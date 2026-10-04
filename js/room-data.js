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
        src: "/img/room/room@4x.png?v=4",
        width: 500,
        height: 357,
        // city lights: an 8-frame strip stepped like PC-98 palette cycling (the export's twinkle.json)
        twinkle: { src: "/img/room/twinkle@4x.png?v=4", x: 191, y: 68, w: 92, h: 87, frames: 8, fps: 2 }
    },

    zOrder: ["controller", "tv", "butterfly", "linkedin", "letter", "phone", "lesswrong", "plush",
             "pc", "newspaper", "bookshelf", "poster", "window"],

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
            lit: { src: "/img/room/lit/window@4x.png?v=4", x: 145, y: 59, w: 184, h: 183 },
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
            lit: { src: "/img/room/lit/phone@4x.png?v=4", x: 94, y: 235, w: 25, h: 12 },
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
            lit: { src: "/img/room/lit/pc@4x.png?v=4", x: 372, y: 134, w: 60, h: 59 },
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
            polygon: [[359, 177], [380, 178], [385, 182], [384, 184], [390, 188], [390, 191], [370, 189], [359, 178]],
            anchor: [374, 183],
            lit: { src: "/img/room/lit/newspaper@4x.png?v=4", x: 358, y: 176, w: 32, h: 16 },
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
            polygon: [[468, 65], [472, 65], [472, 318], [458, 305], [456, 305], [455, 300], [444, 291], [444, 259], [434, 248], [431, 248], [431, 73], [468, 66]],
            anchor: [452, 179],
            lit: { src: "/img/room/lit/bookshelf@4x.png?v=4", x: 430, y: 64, w: 43, h: 255 },
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
            lit: { src: "/img/room/lit/butterfly@4x.png?v=4", x: 161, y: 109, w: 21, h: 16 },
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
            polygon: [[389, 238], [412, 241], [422, 247], [434, 248], [444, 259], [444, 291], [455, 300], [455, 307], [422, 307], [418, 304], [419, 302], [415, 298], [396, 300], [396, 298], [388, 290], [389, 239]],
            anchor: [417, 274],
            lit: { src: "/img/room/lit/tv@4x.png?v=4", x: 387, y: 237, w: 69, h: 71 },
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
            lit: { src: "/img/room/lit/letter@4x.png?v=4", x: 348, y: 160, w: 21, h: 14 },
            hit: [[346, 158], [371, 158], [371, 176], [346, 176]], // padded: the object itself is small
            hover: "Letters are a lost art, you know.",
            click: [
                "You can always write to me.",
                "I'm at me@panda.moe. I read everything!"
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
            lit: { src: "/img/room/lit/controller@4x.png?v=4", x: 339, y: 297, w: 98, h: 45 },
            hit: [[338, 335], [342, 331], [389, 298], [403, 296], [416, 296], [418, 298], [435, 318], [438, 322], [438, 332], [436, 334], [360, 343], [342, 343], [338, 339]], // console, cartridge and pad
            hover: "My console! Don't look at my hours played.",
            click: [
                "I play games rarely. ...Very rarely.",
                "I'll go easy on you. Maybe."
            ],
            repeat: ["One more game. Then sleep. Probably."],
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
            lit: { src: "/img/room/lit/lesswrong@4x.png?v=4", x: 41, y: 232, w: 48, h: 27 },
            hover: "That tome? It changed how I think. Really.",
            click: [
                "Bedtime reading. Very light, as you can see.",
                "My long-winded thoughts live on LessWrong."
            ],
            repeat: ["Change my mind! Really. Bring evidence."],
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
            lit: { src: "/img/room/lit/linkedin@4x.png?v=4", x: 302, y: 159, w: 29, h: 46 },
            hover: "My interview blazer. It's seen things.",
            click: [
                "I put it on when I have to be an adult.",
                "My job title? Mad scientist. ...Sort of."
            ],
            repeat: ["Business casual is a lie, you know."],
            choices: [
                { label: "Visit LinkedIn", href: "https://www.linkedin.com/in/smithdevio/" },
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
            lit: { src: "/img/room/lit/plush@4x.png?v=4", x: 33, y: 166, w: 33, h: 48 },
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
            lit: { src: "/img/room/lit/poster@4x.png?v=4", x: 63, y: 66, w: 69, h: 85 },
            hover: "Don't judge my poster. She's a hero!",
            lines: [
                "That's my favorite magical girl!",
                "...I've rewatched it more than I'll admit."
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
