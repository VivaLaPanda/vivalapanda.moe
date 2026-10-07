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
        src: "/img/room/room@4x.png?v=6",
        width: 500,
        height: 357,
        // city lights: an 8-frame strip stepped like PC-98 palette cycling (the export's twinkle.json)
        twinkle: { src: "/img/room/twinkle@4x.png?v=6", x: 191, y: 68, w: 92, h: 87, frames: 8, fps: 2 }
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
            polygon: [[146, 60], [328, 60], [328, 162], [320, 162], [319, 160], [317, 160], [316, 162], [308, 162], [308, 163], [306, 164], [306, 168], [304, 169], [304, 184], [303, 184], [303, 217], [302, 217], [302, 233], [301, 233], [301, 241], [163, 241], [163, 224], [162, 224], [162, 209], [161, 209], [161, 208], [160, 208], [159, 206], [151, 206], [151, 205], [146, 205], [146, 61]],
            anchor: [234, 146],
            lit: { src: "/img/room/lit/window@4x.png?v=6", x: 145, y: 59, w: 184, h: 183 },
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
            polygon: [[112, 249], [124, 249], [124, 250], [132, 250], [132, 251], [138, 251], [138, 252], [139, 252], [139, 256], [138, 256], [138, 257], [137, 257], [137, 258], [136, 258], [136, 259], [135, 259], [135, 260], [134, 260], [134, 261], [133, 261], [133, 262], [132, 262], [132, 263], [131, 263], [131, 264], [130, 264], [130, 265], [129, 265], [128, 267], [126, 267], [125, 269], [119, 270], [119, 271], [113, 271], [113, 270], [107, 270], [107, 269], [101, 269], [101, 268], [94, 268], [94, 267], [92, 266], [92, 264], [93, 264], [93, 262], [94, 262], [95, 260], [97, 260], [97, 259], [98, 259], [98, 258], [99, 258], [100, 256], [102, 256], [102, 255], [103, 255], [104, 253], [106, 253], [107, 251], [109, 251], [109, 250], [112, 250]],
            anchor: [115, 259],
            lit: { src: "/img/room/lit/phone@4x.png?v=6", x: 91, y: 248, w: 49, h: 24 },
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
            polygon: [[373, 135], [396, 135], [396, 136], [421, 136], [421, 137], [425, 137], [425, 138], [428, 138], [428, 180], [427, 180], [427, 181], [426, 181], [426, 182], [425, 182], [424, 184], [425, 184], [426, 186], [429, 186], [429, 187], [431, 187], [431, 192], [390, 192], [390, 189], [389, 189], [389, 188], [388, 188], [387, 186], [385, 186], [385, 185], [381, 184], [381, 183], [384, 183], [384, 182], [385, 182], [386, 180], [385, 180], [385, 179], [384, 179], [384, 178], [383, 178], [382, 176], [376, 176], [376, 175], [375, 175], [375, 138], [374, 138], [374, 136], [373, 136]],
            anchor: [402, 161],
            lit: { src: "/img/room/lit/pc@4x.png?v=6", x: 372, y: 134, w: 60, h: 59 },
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
            polygon: [[240, 294], [249, 294], [249, 295], [260, 295], [260, 296], [270, 296], [270, 297], [281, 297], [281, 298], [291, 298], [291, 299], [296, 299], [296, 303], [297, 303], [297, 310], [298, 310], [298, 317], [299, 317], [299, 325], [300, 325], [300, 332], [301, 332], [301, 339], [302, 339], [302, 344], [297, 344], [297, 343], [289, 343], [289, 342], [281, 342], [281, 341], [272, 341], [272, 340], [264, 340], [264, 339], [255, 339], [255, 338], [247, 338], [247, 337], [239, 337], [239, 336], [234, 336], [234, 330], [235, 330], [235, 324], [236, 324], [236, 318], [237, 318], [237, 312], [238, 312], [238, 306], [239, 306], [239, 300], [240, 300], [240, 295]],
            anchor: [268, 318],
            lit: { src: "/img/room/lit/newspaper@4x.png?v=6", x: 233, y: 293, w: 70, h: 52 },
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
            polygon: [[468, 65], [472, 65], [472, 318], [471, 318], [471, 317], [470, 317], [470, 316], [469, 316], [468, 314], [466, 314], [466, 313], [465, 313], [465, 312], [464, 312], [464, 311], [463, 311], [463, 310], [462, 310], [462, 309], [461, 309], [461, 308], [460, 308], [460, 307], [459, 307], [458, 305], [456, 305], [456, 304], [455, 304], [455, 303], [454, 303], [454, 302], [453, 302], [453, 301], [452, 301], [452, 300], [451, 300], [451, 299], [450, 299], [450, 298], [449, 298], [449, 297], [448, 297], [448, 296], [447, 296], [446, 294], [444, 294], [444, 293], [443, 293], [443, 292], [442, 292], [442, 291], [441, 291], [441, 290], [440, 290], [440, 289], [439, 289], [438, 287], [436, 287], [436, 261], [435, 261], [434, 259], [432, 259], [432, 258], [431, 258], [431, 73], [433, 73], [433, 72], [438, 72], [438, 71], [443, 71], [443, 70], [448, 70], [448, 69], [453, 69], [453, 68], [458, 68], [458, 67], [463, 67], [463, 66], [468, 66]],
            anchor: [452, 183],
            lit: { src: "/img/room/lit/bookshelf@4x.png?v=6", x: 430, y: 64, w: 43, h: 255 },
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
            polygon: [[153, 101], [156, 101], [156, 102], [158, 102], [158, 103], [160, 103], [160, 104], [162, 104], [162, 105], [166, 106], [167, 108], [170, 108], [171, 106], [173, 106], [173, 105], [175, 105], [175, 104], [177, 104], [177, 103], [179, 103], [179, 102], [181, 102], [181, 101], [184, 101], [184, 108], [183, 108], [183, 111], [182, 111], [182, 113], [180, 114], [180, 116], [181, 116], [181, 120], [180, 120], [180, 121], [179, 121], [178, 123], [175, 123], [175, 122], [174, 122], [174, 121], [173, 121], [173, 120], [172, 120], [172, 119], [171, 119], [171, 118], [170, 118], [169, 116], [168, 116], [168, 117], [167, 117], [167, 118], [166, 118], [166, 119], [165, 119], [165, 120], [164, 120], [164, 121], [163, 121], [162, 123], [159, 123], [159, 122], [158, 122], [158, 121], [156, 120], [156, 116], [157, 116], [157, 114], [156, 114], [156, 113], [155, 113], [155, 111], [154, 111], [154, 108], [153, 108], [153, 102]],
            anchor: [168, 111],
            lit: { src: "/img/room/lit/butterfly@4x.png?v=6", x: 152, y: 100, w: 33, h: 24 },
            hit: [[153, 101], [156, 101], [156, 102], [158, 102], [158, 103], [160, 103], [160, 104], [162, 104], [162, 105], [166, 106], [167, 108], [170, 108], [171, 106], [173, 106], [173, 105], [175, 105], [175, 104], [177, 104], [177, 103], [179, 103], [179, 102], [181, 102], [181, 101], [184, 101], [184, 108], [183, 108], [183, 111], [182, 111], [182, 113], [180, 114], [180, 116], [181, 116], [181, 120], [180, 120], [180, 121], [179, 121], [178, 123], [175, 123], [175, 122], [174, 122], [174, 121], [173, 121], [173, 120], [172, 120], [172, 119], [171, 119], [171, 118], [170, 118], [169, 116], [168, 116], [168, 117], [167, 117], [167, 118], [166, 118], [166, 119], [165, 119], [165, 120], [164, 120], [164, 121], [163, 121], [162, 123], [159, 123], [159, 122], [158, 122], [158, 121], [156, 120], [156, 116], [157, 116], [157, 114], [156, 114], [156, 113], [155, 113], [155, 111], [154, 111], [154, 108], [153, 108], [153, 102]], // padded, so it's easy to catch
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
            polygon: [[388, 247], [392, 247], [392, 249], [394, 250], [394, 252], [395, 252], [395, 253], [396, 253], [396, 254], [397, 254], [397, 255], [398, 255], [398, 256], [399, 256], [399, 257], [400, 257], [400, 258], [401, 258], [401, 259], [402, 259], [402, 260], [403, 260], [404, 262], [430, 262], [430, 258], [429, 258], [428, 256], [430, 256], [430, 257], [431, 257], [432, 259], [434, 259], [434, 260], [436, 261], [436, 288], [437, 288], [437, 289], [438, 289], [438, 290], [439, 290], [439, 291], [440, 291], [440, 292], [441, 292], [441, 293], [442, 293], [443, 295], [445, 295], [445, 296], [446, 296], [446, 297], [447, 297], [447, 298], [448, 298], [448, 299], [450, 300], [450, 307], [418, 307], [418, 306], [416, 305], [416, 302], [408, 302], [408, 304], [403, 304], [403, 303], [402, 303], [402, 302], [401, 302], [401, 301], [399, 300], [399, 298], [398, 298], [398, 297], [397, 297], [397, 296], [395, 295], [395, 293], [394, 293], [394, 292], [392, 291], [392, 289], [391, 289], [391, 288], [390, 288], [390, 287], [388, 286], [388, 268], [389, 268], [389, 266], [388, 266], [388, 248]],
            anchor: [415, 281],
            lit: { src: "/img/room/lit/tv@4x.png?v=6", x: 387, y: 246, w: 64, h: 62 },
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
            polygon: [[347, 155], [373, 155], [373, 173], [347, 173], [347, 156]],
            anchor: [359, 163],
            lit: { src: "/img/room/lit/letter@4x.png?v=6", x: 346, y: 154, w: 28, h: 20 },
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
            polygon: [[408, 302], [416, 302], [416, 305], [418, 306], [418, 308], [419, 308], [419, 309], [420, 309], [420, 310], [421, 310], [421, 311], [423, 312], [423, 314], [424, 314], [424, 315], [425, 315], [425, 316], [426, 316], [426, 317], [428, 318], [428, 320], [429, 320], [429, 321], [431, 322], [431, 330], [407, 330], [407, 329], [404, 329], [404, 330], [399, 330], [399, 329], [403, 329], [403, 328], [404, 328], [405, 326], [403, 325], [403, 323], [401, 322], [401, 320], [400, 320], [400, 319], [398, 318], [398, 316], [397, 316], [397, 315], [395, 314], [395, 312], [394, 312], [394, 304], [408, 304], [408, 303]],
            anchor: [402, 321],
            lit: { src: "/img/room/lit/controller@4x.png?v=6", x: 351, y: 301, w: 81, h: 44 },
            hit: [[394, 302], [401, 302], [402, 304], [408, 304], [408, 302], [416, 302], [416, 305], [418, 306], [418, 308], [423, 308], [423, 309], [424, 309], [424, 310], [426, 311], [426, 313], [427, 313], [427, 314], [429, 315], [429, 317], [430, 317], [430, 318], [432, 319], [432, 321], [434, 322], [434, 331], [433, 331], [432, 333], [428, 333], [428, 334], [424, 334], [424, 335], [419, 335], [419, 336], [415, 336], [415, 337], [411, 337], [411, 338], [407, 338], [407, 339], [402, 339], [402, 340], [398, 340], [398, 341], [394, 341], [394, 342], [390, 342], [390, 343], [386, 343], [386, 344], [381, 344], [381, 345], [377, 345], [377, 346], [373, 346], [373, 347], [354, 347], [354, 346], [353, 346], [353, 345], [352, 345], [352, 344], [350, 343], [350, 338], [351, 338], [351, 337], [352, 337], [352, 336], [353, 336], [353, 335], [354, 335], [355, 333], [357, 333], [357, 332], [358, 332], [358, 331], [359, 331], [360, 329], [362, 329], [362, 328], [363, 328], [363, 327], [364, 327], [365, 325], [367, 325], [367, 324], [368, 324], [368, 323], [369, 323], [370, 321], [372, 321], [372, 320], [373, 320], [373, 319], [374, 319], [375, 317], [377, 317], [377, 316], [378, 316], [378, 315], [379, 315], [380, 313], [382, 313], [382, 312], [383, 312], [383, 311], [384, 311], [385, 309], [387, 309], [387, 308], [388, 308], [388, 307], [389, 307], [390, 305], [392, 305], [392, 304], [394, 303]], // console, cartridge and pad
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
            polygon: [[63, 233], [71, 233], [71, 234], [82, 234], [82, 235], [88, 235], [88, 243], [87, 243], [87, 244], [85, 244], [84, 246], [82, 246], [81, 248], [79, 248], [78, 250], [74, 251], [74, 252], [73, 252], [73, 253], [71, 253], [70, 255], [68, 255], [68, 256], [63, 256], [63, 255], [55, 255], [55, 254], [54, 254], [54, 255], [53, 255], [53, 256], [51, 257], [51, 256], [50, 256], [49, 254], [47, 254], [47, 253], [42, 253], [42, 245], [43, 245], [43, 244], [45, 244], [46, 242], [48, 242], [48, 241], [50, 241], [50, 240], [54, 239], [55, 237], [57, 237], [57, 236], [59, 236], [59, 235], [63, 234]],
            anchor: [64, 244],
            lit: { src: "/img/room/lit/lesswrong@4x.png?v=6", x: 41, y: 232, w: 48, h: 27 },
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
            polygon: [[316, 161], [317, 161], [317, 163], [320, 163], [321, 165], [323, 165], [323, 166], [325, 166], [325, 167], [327, 167], [327, 168], [329, 169], [329, 184], [330, 184], [330, 201], [329, 201], [329, 204], [327, 204], [327, 203], [324, 203], [324, 202], [323, 202], [323, 201], [321, 201], [321, 200], [320, 200], [320, 199], [319, 199], [319, 198], [318, 198], [317, 196], [316, 196], [316, 197], [315, 197], [315, 198], [314, 198], [314, 199], [313, 199], [312, 201], [310, 201], [309, 203], [307, 203], [307, 204], [304, 204], [304, 202], [303, 202], [303, 184], [304, 184], [304, 169], [305, 169], [306, 167], [308, 167], [309, 165], [311, 165], [311, 164], [314, 164], [314, 163], [316, 163], [316, 162]],
            anchor: [316, 183],
            lit: { src: "/img/room/lit/linkedin@4x.png?v=6", x: 302, y: 159, w: 29, h: 46 },
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
            polygon: [[392, 245], [416, 245], [416, 246], [418, 246], [418, 247], [419, 247], [420, 249], [422, 249], [422, 250], [423, 250], [424, 252], [426, 252], [426, 253], [428, 254], [428, 257], [430, 258], [430, 262], [404, 262], [404, 261], [403, 261], [403, 260], [402, 260], [402, 259], [401, 259], [401, 258], [400, 258], [400, 257], [399, 257], [399, 256], [398, 256], [398, 255], [397, 255], [397, 254], [396, 254], [396, 253], [394, 252], [394, 250], [392, 249], [392, 246]],
            anchor: [411, 253],
            lit: { src: "/img/room/lit/kitsu@4x.png?v=6", x: 391, y: 244, w: 40, h: 19 },
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
            polygon: [[374, 177], [378, 177], [378, 178], [379, 178], [379, 179], [381, 180], [381, 181], [380, 181], [381, 185], [380, 185], [379, 187], [370, 187], [370, 186], [368, 185], [368, 181], [369, 181], [369, 182], [371, 183], [371, 182], [373, 181], [373, 178], [374, 178]],
            anchor: [375, 182],
            lit: { src: "/img/room/lit/stackoverflow@4x.png?v=6", x: 367, y: 176, w: 15, h: 12 },
            hit: [[373, 175], [375, 175], [376, 177], [381, 177], [381, 178], [382, 178], [382, 179], [384, 180], [383, 182], [381, 182], [381, 185], [383, 185], [383, 186], [382, 186], [382, 187], [381, 187], [381, 188], [380, 188], [379, 190], [370, 190], [370, 189], [369, 189], [369, 188], [368, 188], [368, 187], [367, 187], [367, 186], [365, 185], [365, 181], [366, 181], [366, 180], [367, 180], [368, 178], [370, 179], [370, 178], [371, 178], [371, 177], [373, 176]], // padded: the duck is tiny
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
            polygon: [[352, 27], [377, 27], [377, 44], [352, 44], [352, 28]],
            anchor: [364, 35],
            lit: { src: "/img/room/lit/bump@4x.png?v=6", x: 351, y: 26, w: 27, h: 19 },
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
            polygon: [[38, 167], [41, 167], [41, 168], [43, 168], [43, 169], [44, 169], [45, 171], [54, 171], [54, 170], [55, 170], [56, 168], [58, 168], [58, 167], [61, 167], [61, 168], [63, 168], [63, 170], [64, 170], [64, 173], [63, 173], [63, 175], [62, 175], [62, 178], [63, 178], [63, 180], [64, 180], [64, 185], [63, 185], [62, 189], [61, 189], [61, 190], [59, 191], [59, 193], [60, 193], [60, 194], [61, 194], [61, 195], [62, 195], [62, 196], [63, 196], [63, 197], [65, 198], [65, 203], [64, 203], [64, 204], [63, 204], [63, 205], [62, 205], [62, 206], [60, 207], [60, 209], [61, 209], [61, 210], [60, 210], [59, 212], [56, 212], [56, 211], [55, 211], [54, 213], [45, 213], [44, 211], [43, 211], [43, 212], [40, 212], [40, 211], [38, 210], [38, 209], [39, 209], [39, 207], [38, 207], [38, 206], [37, 206], [37, 205], [36, 205], [36, 204], [34, 203], [34, 198], [35, 198], [35, 197], [36, 197], [36, 196], [37, 196], [37, 195], [38, 195], [38, 194], [40, 193], [40, 191], [39, 191], [39, 190], [37, 189], [37, 187], [36, 187], [36, 185], [35, 185], [35, 180], [36, 180], [36, 178], [37, 178], [37, 175], [36, 175], [36, 173], [35, 173], [35, 170], [36, 170], [36, 168], [38, 168]],
            anchor: [49, 190],
            lit: { src: "/img/room/lit/plush@4x.png?v=6", x: 33, y: 166, w: 33, h: 48 },
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
            lit: { src: "/img/room/lit/poster@4x.png?v=6", x: 63, y: 66, w: 69, h: 85 },
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
