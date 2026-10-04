// Panda's Room: everything that isn't mechanics. Swap the scene + polygons when the real art lands.
//
// Polygons and anchors are in the scene image's native pixels; js/room.js scales them with the art.
// rank = prominence (how much Panda uses the account): 1 is most. It orders the LOOK list,
// keyboard focus and which unvisited object glints first.
// Dialogue: lines are borrowed from real visual novels (verbatim where possible, a word swapped
// otherwise; PC-98-era lines translated from the Japanese); every line's source is in
// pc98-assets/assets/panda-room/dialogue-sources.md.
// Keep each box <= 48 characters and use straight quotes (the pc-98 font draws curly ones full-width).
window.ROOM = {
    scene: {
        src: "/img/room/room-standin.png", // layout B, rough PC-98 pass (pc98-assets/assets/panda-room)
        width: 448,
        height: 320,
        standIn: true // labels the art as a placeholder until the real room is drawn
    },

    greeting: [
        "Welcome, traveler, to my room of mysteries.",
        "Sorryyy! The train was totally packed...",
        "If you get lost, press LOOK, okay?"
    ],

    objects: [
        {
            id: "window",
            name: "Window",
            service: "Twitter",
            rank: 1,
            polygon: [[20, 46], [212, 52], [212, 184], [20, 184]],
            anchor: [150, 90],
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
            polygon: [[266, 240], [316, 236], [322, 268], [274, 276]],
            anchor: [294, 256],
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
            polygon: [[46, 164], [124, 164], [124, 228], [138, 230], [134, 250], [62, 250], [64, 230], [46, 228]],
            anchor: [85, 190],
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
            polygon: [[6, 248], [62, 240], [76, 258], [20, 268]],
            anchor: [40, 254],
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
            polygon: [[268, 76], [364, 74], [364, 222], [268, 222]],
            anchor: [300, 110],
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
            polygon: [[196, 158], [228, 158], [228, 192], [196, 192]],
            anchor: [212, 174],
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
            polygon: [[380, 172], [440, 172], [440, 236], [380, 236]],
            anchor: [410, 200],
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
            polygon: [[318, 200], [360, 200], [362, 254], [318, 254]],
            anchor: [340, 222],
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
