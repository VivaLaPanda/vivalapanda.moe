// Panda's Room: everything that isn't mechanics. Swap the scene + polygons when the real art lands.
//
// Polygons and anchors are in the scene image's native pixels; js/room.js scales them with the art.
// rank = prominence (how much Panda uses the account): 1 is most. It orders the LOOK list,
// keyboard focus and which unvisited object glints first.
// Dialogue rules (see pc98-assets research notes): <= 48 characters per box, one idea per box,
// the setup and punchline split across boxes, at most one ellipsis per box.
window.ROOM = {
    scene: {
        src: "/img/room/room-standin.png", // layout B, rough PC-98 pass (pc98-assets/assets/panda-room)
        width: 448,
        height: 320,
        standIn: true // labels the art as a placeholder until the real room is drawn
    },

    greeting: [
        "Oh, you made it! Come in, mind the cables.",
        "Poke at anything that glows. I'll narrate.",
        "Lost? Hit LOOK and I'll point things out."
    ],

    objects: [
        {
            id: "window",
            name: "Window",
            service: "Twitter",
            rank: 1,
            polygon: [[20, 46], [212, 52], [212, 184], [20, 184]],
            anchor: [150, 90],
            hover: "The city at night. Someone's always awake.",
            click: [
                "Every lit window is somebody's whole world.",
                "I yell about zoning at a few of them on Twitter."
            ],
            repeat: ["Yes, I'm on Twitter. Yes, right now."],
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
            hover: "My phone. It's buzzing. It's always buzzing.",
            click: [
                "Want to talk? I'm vivalapanda on Discord.",
                "Signal works too, if it's secret-ish."
            ],
            repeat: ["Still buzzing. You could make it buzz more."],
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
            hover: "My PC! Code goes here when it's done. So, never.",
            click: [
                "Radio servers, PC-98 filters, this very site...",
                "Most of it works! Some of it on purpose."
            ],
            repeat: ["Same PC. Still not done. Never will be."],
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
            hover: "Today's paper. I wrote it, so it's biased.",
            click: [
                "The Portentous Portal! Long posts on cities.",
                "Grab some tea first. They run long."
            ],
            repeat: ["Same paper. New issue soon. Probably."],
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
            hover: "Bookshelf. Seeing Like a State is load-bearing.",
            click: [
                "These are the books I'd actually hand you.",
                "The list is still being shelved. Soon!"
            ],
            repeat: ["Yes, I've read them all. Mostly. Okay, some."],
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
            hover: "A butterfly on the sill. It's very blue.",
            click: [
                "That's my Bluesky. I'm there sometimes.",
                "Mostly I just admire it from here."
            ],
            repeat: ["Still blue. Still a butterfly. Still me."],
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
            hover: "A little TV. I'm logging what I watch now.",
            click: [
                "My Letterboxd! I made it, like, today.",
                "Zero films logged. Peak mystery."
            ],
            repeat: ["Still empty? Give me a weekend."],
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
            hover: "Panda plush. The original Panda, actually.",
            lines: [
                "She's been here longer than the furniture.",
                "Be nice. She hears everything."
            ]
        }
    ],

    lines: {
        idle: [
            "No rush. The city's not going anywhere.",
            "Want some tea? I'll put the kettle on.",
            "Hear that? Last train heading home."
        ],
        empty: [
            "Nothing special there. Just vibes.",
            "That's just the room. A very good room.",
            "Hm? Try the glowing stuff.",
            "That's the floor. Mind the cables."
        ],
        lookPrompt: "What should I tell you about?",
        leaving: "Have fun out there! I'll be right here.",
        copied: "Copied! Add me: vivalapanda.",
        copyFailed: "Couldn't copy... it's vivalapanda!",
        backToRoom: "Sure! Look around.",
        allSeen: "Okay, you've found everything. I'm impressed."
    }
};
