// Panda's Room: everything that isn't mechanics.
//
// Art, polygons, anchors and lit (hover) sprites come from the easel piece pc98-assets/easel/pieces/panda-room
// (export.py -> out/site: room.png, hotspots.json, lit/, twinkle). All coordinates are the scene's native
// 500x357 pixels; the images are nearest-neighbour 4x copies that the browser scales down smoothly, so
// pixels stay crisp and even.
// rank = prominence (how much Panda uses the account): 1 is most. It orders the LOOK list,
// keyboard focus and which unvisited object glints first.
// Dialogue: real visual-novel lines where they fit this room (verbatim, adapted or interpolated;
// PC-98-era lines translated from the Japanese) and plain lines in the same register where they
// don't; every line has to make sense coming from Panda, about that object, in this night room.
// Each line's kind and source is in pc98-assets/assets/panda-room/dialogue-sources.md.
// Keep each box <= 48 characters and use straight quotes (the pc-98 font draws curly ones full-width).
window.ROOM = {
    scene: {
        src: "/img/room/room@4x.png?v=3",
        width: 500,
        height: 357,
        // city lights: an 8-frame strip stepped like PC-98 palette cycling (the export's twinkle.json)
        twinkle: { src: "/img/room/twinkle@4x.png?v=3", x: 189, y: 68, w: 91, h: 133, frames: 8, fps: 2 }
    },

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
            polygon: [[146, 60], [328, 60], [328, 162], [308, 162], [306, 164], [301, 241], [163, 241], [162, 209], [159, 206], [146, 205], [146, 61]],
            anchor: [233, 145],
            lit: { src: "/img/room/lit/window@4x.png?v=3", x: 145, y: 59, w: 184, h: 183 },
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
            lit: { src: "/img/room/lit/phone@4x.png?v=3", x: 94, y: 235, w: 25, h: 12 },
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
            lit: { src: "/img/room/lit/pc@4x.png?v=3", x: 372, y: 134, w: 60, h: 59 },
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
            lit: { src: "/img/room/lit/newspaper@4x.png?v=3", x: 358, y: 176, w: 32, h: 16 },
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
            polygon: [[468, 65], [472, 65], [472, 318], [438, 287], [431, 285], [431, 73], [468, 66]],
            anchor: [452, 184],
            lit: { src: "/img/room/lit/bookshelf@4x.png?v=3", x: 430, y: 64, w: 43, h: 255 },
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
            polygon: [[212, 147], [216, 150], [221, 147], [219, 152], [214, 152], [212, 148]],
            anchor: [216, 150],
            lit: { src: "/img/room/lit/butterfly@4x.png?v=3", x: 211, y: 146, w: 11, h: 7 },
            hit: [[206, 141], [227, 141], [227, 158], [206, 158]], // padded: the object itself is tiny
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
            polygon: [[460, 40], [468, 41], [468, 66], [442, 71], [442, 48], [460, 41]],
            anchor: [455, 55],
            lit: { src: "/img/room/lit/tv@4x.png?v=3", x: 441, y: 34, w: 28, h: 38 },
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
        }
    ],

    // no link: just a line. With a polygon they're hotspots too; without one, LOOK list only.
    knickKnacks: [
        {
            id: "plush",
            name: "Panda plush",
            polygon: [[38, 167], [43, 168], [45, 171], [54, 171], [58, 167], [63, 168], [64, 173], [62, 178], [64, 180], [64, 185], [59, 193], [65, 198], [65, 203], [60, 207], [61, 210], [59, 212], [55, 211], [54, 213], [45, 213], [44, 211], [40, 212], [38, 210], [39, 207], [34, 203], [34, 198], [40, 193], [35, 185], [35, 180], [37, 178], [35, 170], [38, 168]],
            anchor: [49, 190],
            lit: { src: "/img/room/lit/plush@4x.png?v=3", x: 33, y: 166, w: 33, h: 48 },
            hover: "The panda says, 'Gao, gao!'",
            lines: [
                "He's the original Panda. I'm the sequel.",
                "Sorry, I was born cute."
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
