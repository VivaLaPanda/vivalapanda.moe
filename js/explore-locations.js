var locations = {
    "mainstreet": {
        "title": "Pandopolis",
        "mainImage": "../img/explore/pathways/mainstreet_night.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/possessioner-possessioner.mp3",
    
        
        "speakerText": "P a n d a",
        "dialogText": ["Welcome to Pandopolis, take a look around and seek your fortune in the city of adventure."],
        "links": [
            {
                to: "frontdesk.html",
    
                width: "141px",
                height: "127px",
                right: "94px",
                bottom: "22px"
            },
            {
                to: "?loc=nightplaza",
    
                width: "85px",
                height: "77px",
                right: "246px",
                bottom: "52px"
            },
            {
                to: "?loc=partystreet",
    
                width: "106px",
                height: "87px",
                right: "370px",
                bottom: "63px"
            }
        ]
    },
    "agency": {
        "title": "The Agency",
        "mainImage": "../img/explore/places/agency.gif",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/kavinsky-nightcall.mp3",
    
        "speakerText": "J o h n n y  U p p e r c u t",
        "dialogText": [
            "\"Welcome stranger, to my humble office. I'm this town's information broker.",
            "What are you looking to find out?\""
        ],
        "links": []
    },
    "casino": {
        "title": "The Casino",
        "mainImage": "../img/explore/places/casino.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "light",
        "music": "../audio/sonic-casino-night-zone.mp4",
    
        "speakerText": "P a n d a",
        "dialogText": ["Welcome to Pandopolis, take a look around and seek your fortune in the city of adventure."],
        "links": []
    },
    "club": {
        "title": "Club Polka",
        "mainImage": "../img/explore/places/club.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/control-your-music.mp3",
    
        "speakerText": "P a n d a",
        "dialogText": [":cattodance:"],
        "links": []
    },
    "forestedge": {
        "title": "The Edge of the Forest",
        "mainImage": "../img/explore/pathways/forest.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/death-bringer-forest.mp3",
    
        "speakerText": "P a n d a",
        "dialogText": ["It's almost sunrise, perfect time to wander into the mysterious forest!"],
        "links": [
            {
                to: "?loc=forestglade",
    
                width: "416px",
                height: "297px",
                right: "150px",
                bottom: "42px"
            },
        ]
    },
    "forestglade": {
        "title": "The Hidden Glade",
        "mainImage": "../img/explore/places/forestglade.png",
        "mainImagePos": "left",
        "holoImage": "../img/holo/HolosurpriseBGTransparent.png",
        "frameMode": "light",
        "music": "../audio/mercurius_pretty-the_birth_of_homunculus.mp3",
    
        "speakerText": "P a n d a",
        "dialogText": ["There's definitely a mythical sword somewhere around here..."],
        "links": []
    },
    "musicianbedroom": {
        "title": "Andy's House",
        "mainImage": "../img/explore/places/night_musician_bedroom.png",
        "mainImagePos": "left",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "light",
        "music": "../audio/andypls-kurisu-muffled.mp3",
    
        "speakerText": "A n d y",
        "dialogText": ["*You hear muffled breakcore, but Andy doesn't turn around*"],
        "links": [
            {
                to: "https://www.beepbox.co",
    
                width: "230px",
                height: "207px",
                right: "513px",
                bottom: "133px"
            },
            {
                to: "https://youtu.be/edgcGDWhMNM",
    
                width: "230px",
                height: "437px",
                right: "73px",
                bottom: "63px"
            },
        ]
    },
    "nightapartments": {
        "title": "Acacia Apartments",
        "mainImage": "../img/explore/pathways/night_apartments.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/kara-no-naka-wht-vrgn-blk-slv.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": ["Hey you don't think these people will mind us wandering into their houses right?"],
        "links": [
            {
                to: "?loc=nightapartments",
    
                width: "80px",
                height: "47px",
                right: "343px",
                bottom: "273px"
            },
        ]
    },
    "nightpark": {
        "title": "Pumpo Park",
        "mainImage": "../img/explore/pathways/night_park.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/viper-moon.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": [
            "Wow this seems like a great spot to get murdered.",
            "...Maybe we should leave?"
        ],
        "links": []
    },
    "nightplaza": {
        "title": "Picrew Plaza",
        "mainImage": "../img/explore/pathways/night_city_plaza.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/viper-moon.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": ["It's so quiet here at night..."],
        "links": [
            {
                to: "?loc=nightpark",
    
                width: "101px",
                height: "97px",
                right: "94px",
                bottom: "212px"
            },
            {
                to: "?loc=nightresidential",
    
                width: "85px",
                height: "127px",
                right: "-4px",
                bottom: "82px"
            },
            {
                to: "?loc=forestedge",
    
                width: "415px",
                height: "87px",
                right: "323px",
                bottom: "232px"
            },
        ]
    },
    "nightresidential": {
        "title": "Residential District",
        "mainImage": "../img/explore/pathways/night_residential.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/doki-doki-vac01.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": [
            "Hey you don't think these people will mind us wandering into their houses right?",
        ],
        "links": [
            {
                to: "?loc=nightresidential2",
    
                width: "246px",
                height: "47px",
                right: "230px",
                bottom: "83px"
            },]
    },
    "nightresidential2": {
        "title": "Residential District Houses",
        "mainImage": "../img/explore/pathways/night_residential_2.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/doki-doki-vac01.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": [
            "Hey you don't think these people will mind us wandering into their houses right?",
        ],
        "links": [
            {
                to: "nightresidential_girl.html",
    
                width: "80px",
                height: "47px",
                right: "343px",
                bottom: "273px"
            },
            {
                to: "?loc=musicianbedroom",
    
                width: "130px",
                height: "287px",
                right: "563px",
                bottom: "163px"
            },
        ]
    },
    "partystreet": {
        "title": "Isogashii Boulevard",
        "mainImage": "../img/explore/pathways/night_street_busy.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/animahjong-x-10.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": [
            "This part of a town is a blast! Just don't accept any mysterious packages from strangers...",
        ],
        "links": [
            {
                to: "?loc=club",
    
                width: "91px",
                height: "174px",
                right: "28px",
                bottom: "78px"
            },
            {
                to: "?loc=agency",
    
                width: "115px",
                height: "167px",
                right: "16px",
                bottom: "357px"
            },
            {
                to: "?loc=nightalley",
    
                width: "85px",
                height: "103px",
                right: "232px",
                bottom: "135px"
            },
            {
                to: "?loc=electronicstore",
    
                width: "85px",
                height: "179px",
                right: "616px",
                bottom: "64px"
            },
        ]
    },
    "electronicstore": {
        "title": "Denchi's Delights",
        "mainImage": "../img/explore/places/electronics_store.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "S a k u r a",
        "dialogText": [
            "\"Go ahead, go for a spin!\"",
        ],
        "links": []
    },
    "weaponshop": {
        "title": "Ghandi's Surplus Suprises",
        "mainImage": "../img/explore/places/weaponshop.gif",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/possessioner-in-the-boutique.mp3",
    
        "speakerText": "P a n d a",
        "dialogText": [
            "I uhh, promise this place is definitely legal...",
            "probably."
        ],
        "links": []
    },
    "nightalley": {
        "title": "The Alley",
        "mainImage": "../img/explore/pathways/night_busy_alley.png",
        "mainImagePos": "center right",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "P a n d a",
        "dialogText": [
            "Ah, now we're exploring properly"
        ],
        "links": [
            {
                to: "?loc=shizukastreet",
    
                width: "67px",
                height: "87px",
                right: "190px",
                bottom: "227px"
            },
            {
                to: "?loc=weaponshop",
    
                width: "45px",
                height: "119px",
                right: "270px",
                bottom: "202px"
            },
            {
                to: "?loc=cutiebar",
    
                width: "77px",
                height: "357px",
                right: "425px",
                bottom: "58px"
            },
        ]
    },
    "cutiebar": {
        "title": "Rabu Rabu",
        "mainImage": "../img/explore/places/bar_with_cutie.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "S a b r i n a",
        "dialogText": [
            "\"Wow anon, you finally made it\""
        ],
        "links": []
    },
    "shizukastreet": {
        "title": "Shizuka Street",
        "mainImage": "../img/explore/pathways/night_city_street.png",
        "mainImagePos": "center left",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "P a n d a",
        "dialogText": [
            "Ah, now we're exploring properly"
        ],
        "links": [
            {
                to: "?loc=weirdstore",
    
                width: "114px",
                height: "197px",
                right: "69px",
                bottom: "138px"
            },
            {
                to: "?loc=livehouse",
    
                width: "48px",
                height: "85px",
                right: "386px",
                bottom: "166px"
            },
            {
                to: "?loc=bathhouseentry",
    
                width: "48px",
                height: "85px",
                right: "486px",
                bottom: "166px"
            },
        ]
    },
    "weirdstore": {
        "title": "Erratic Errata",
        "mainImage": "../img/explore/places/shop_misc_interior.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "P a n d a",
        "dialogText": [
            "This place is definitely a front for *something*"
        ],
        "links": []
    },
    "livehouse": {
        "title": "Namba Bears",
        "mainImage": "../img/explore/places/night_weird_bar.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "P a n d a",
        "dialogText": [
            "Namba is the place to be for fun obscure music shows"
        ],
        "links": []
    },
    "smallbathhouse": {
        "title": "Brownie's Bathhouse",
        "mainImage": "../img/explore/places/bathhouse_small.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "P a n d a",
        "dialogText": [
            "Let's take a break and relax a while"
        ],
        "links": []
    },
    "bathhouseentry": {
        "title": "Brownie's Bathhouse",
        "mainImage": "../img/explore/portraits/bath.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/TODO",
    
        "speakerText": "Brownie",
        "dialogText": [
            "\"Welcome to my fine establishment, hope you enjoy yourself\""
        ],
        "links": [
            {
                to: "?loc=smallbathhouse",
    
                width: "100%",
                height: "100%",
                right: "0px",
                bottom: "0px"
            },
        ]
    },
}