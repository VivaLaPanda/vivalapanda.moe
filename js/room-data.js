// Panda's Room: everything that isn't mechanics.
//
// Art, polygons, anchors and lit (hover) sprites come from pc98-assets/assets/panda-room/out/final
// (room.png, hotspots.json, lit/). All coordinates are the scene's native 448x320 pixels; the images
// are nearest-neighbour 4x copies that the browser scales down smoothly, so pixels stay crisp and even.
// rank = prominence (how much Panda uses the account): 1 is most. It orders the LOOK list,
// keyboard focus and which unvisited object glints first.
// Dialogue: lines are borrowed from real visual novels (verbatim where possible, a word swapped
// otherwise; PC-98-era lines translated from the Japanese); every line's source is in
// pc98-assets/assets/panda-room/dialogue-sources.md.
// Keep each box <= 48 characters and use straight quotes (the pc-98 font draws curly ones full-width).
window.ROOM = {
    scene: {
        src: "/img/room/room@4x.png",
        width: 448,
        height: 320,
        // city lights: an 8-frame strip stepped like PC-98 palette cycling (pc98-assets twinkle.json)
        twinkle: { src: "/img/room/twinkle@4x.png", x: 28, y: 30, w: 180, h: 154, frames: 8, fps: 2 }
    },

    greeting: [
        "Welcome, traveler, to my room of mysteries.",
        "Don't be shy now, come on in.",
        "If you get lost, press LOOK, okay?"
    ],

    objects: [
        {
            id: "window",
            name: "Window",
            service: "Twitter",
            rank: 1,
            polygon: [[20, 10], [241, 42], [244, 169], [244, 199], [122, 194], [121, 164], [63, 166], [43, 165], [38, 168], [38, 175], [20, 176], [20, 11]],
            anchor: [132, 104],
            lit: { src: "/img/room/lit/window@4x.png", x: 19, y: 9, w: 226, h: 191 },
            hover: "E-everything looks so p-pretty at night...",
            click: [
                "The town, the people... we're all family.",
                "I talk about it on Twitter. A lot."
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
            polygon: [[295, 242], [297, 242], [313, 258], [310, 262], [292, 270], [276, 253], [279, 249], [295, 243]],
            anchor: [294, 255],
            lit: { src: "/img/room/lit/phone@4x.png", x: 275, y: 241, w: 39, h: 30 },
            hit: [[272, 238], [316, 238], [316, 273], [272, 273]], // padded: the object itself is tiny
            hover: "I'm so gonna text you weird memes.",
            click: [
                "You can call me vivalapanda.",
                "Don't worry, your secret's safe with me."
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
            polygon: [[101, 164], [121, 164], [123, 227], [91, 228], [92, 232], [101, 232], [104, 234], [131, 229], [136, 241], [72, 252], [66, 241], [69, 239], [60, 239], [62, 234], [70, 234], [72, 228], [42, 229], [42, 225], [38, 223], [38, 242], [0, 254], [0, 178], [6, 176], [38, 175], [38, 168], [43, 165], [101, 165]],
            anchor: [63, 206],
            lit: { src: "/img/room/lit/pc@4x.png", x: 0, y: 163, w: 137, h: 92 },
            hover: "Oh crap... fell asleep at the computer again.",
            click: [
                "But my lover has always been my computer.",
                "Everything I make ends up on GitHub."
            ],
            repeat: ["This is... An Infinitely Repeating Game."],
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
            polygon: [[39, 241], [77, 255], [77, 257], [41, 269], [36, 268], [3, 255], [3, 253], [39, 242]],
            anchor: [40, 254],
            lit: { src: "/img/room/lit/newspaper@4x.png", x: 2, y: 240, w: 76, h: 30 },
            hover: "Heh. Who knew newspapers could be interesting?",
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
            polygon: [[352, 44], [354, 44], [355, 49], [359, 44], [361, 44], [359, 52], [367, 48], [367, 51], [361, 58], [367, 56], [371, 57], [369, 60], [364, 62], [368, 64], [368, 66], [360, 67], [359, 74], [393, 70], [393, 172], [386, 178], [386, 219], [356, 220], [355, 213], [360, 209], [360, 204], [356, 200], [348, 200], [345, 204], [333, 204], [330, 200], [322, 200], [318, 204], [318, 209], [322, 212], [321, 221], [273, 221], [270, 219], [270, 82], [278, 81], [278, 61], [307, 59], [311, 64], [312, 78], [312, 62], [332, 62], [330, 59], [339, 59], [333, 54], [332, 51], [336, 51], [341, 54], [339, 47], [346, 51], [346, 46], [350, 49], [352, 45]],
            anchor: [330, 137],
            lit: { src: "/img/room/lit/bookshelf@4x.png", x: 269, y: 43, w: 125, h: 179 },
            hover: "If it's books you want, leave it to me.",
            click: [
                "My reading list isn't ready yet. Soon!",
                "I barely got to do any reading today, so..."
            ],
            repeat: ["Why would you waste that on the top shelf?"],
            choices: [
                { label: "Look at something else" }
            ]
        },
        {
            id: "butterfly",
            name: "Butterfly",
            service: "Bluesky",
            rank: 6,
            polygon: [[203, 164], [205, 164], [209, 169], [214, 164], [219, 167], [219, 171], [217, 172], [218, 176], [212, 181], [207, 181], [201, 176], [202, 172], [200, 171], [200, 167], [203, 165]],
            anchor: [209, 172],
            lit: { src: "/img/room/lit/butterfly@4x.png", x: 199, y: 163, w: 21, h: 19 },
            hit: [[194, 158], [224, 158], [224, 186], [194, 186]], // padded: the object itself is tiny
            hover: "I love butterflies. They are the best animal.",
            click: [
                "That one's my Bluesky. I'm there sometimes.",
                "It wouldn't be so bad to be the sky."
            ],
            repeat: ["Chicken? Why would I be a bird?"],
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
            polygon: [[438, 169], [448, 169], [448, 218], [386, 219], [386, 178], [389, 174], [392, 172], [402, 171], [438, 170]],
            anchor: [417, 194],
            lit: { src: "/img/room/lit/tv@4x.png", x: 385, y: 168, w: 63, h: 52 },
            hover: "You've found the television, then.",
            click: [
                "That's where I log all the movies I watch.",
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
            polygon: [[322, 200], [330, 200], [333, 204], [345, 204], [348, 200], [356, 200], [360, 204], [360, 209], [355, 213], [356, 221], [352, 225], [352, 227], [357, 231], [358, 243], [356, 246], [360, 250], [359, 255], [354, 259], [348, 259], [345, 256], [332, 256], [329, 259], [323, 259], [317, 253], [318, 248], [321, 246], [319, 243], [321, 231], [326, 227], [321, 221], [322, 212], [318, 209], [318, 204], [322, 201]],
            anchor: [338, 230],
            lit: { src: "/img/room/lit/plush@4x.png", x: 316, y: 199, w: 45, h: 61 },
            hover: "The panda says, 'Gao, gao!'",
            lines: [
                "Of course the panda can't win. It's a panda.",
                "Sorry, I was born cute."
            ]
        }
    ],

    lines: {
        idle: [
            "It's nice and quiet in here, isn't it?",
            "Do... would you like some tea?",
            "Luck comes to those who smile. So, smile!"
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
