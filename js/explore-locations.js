var locations = {
    "mainstreet": {
        "title": "Pandopolis",
        "mainImage": "../img/explore/pathways/mainstreet_night.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
        "speakerText": "P a n d a",
        "dialogText": ["Welcome to Pandopolis, take a look around and seek your fortune in the city of adventure."],
        "links": []
    },
    "casino": {
        "title": "Club Polka",
        "mainImage": "../img/explore/places/club.png",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "music": "../audio/dance_in_the_memories.mp3",
    
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
        "title": "The Party Street",
        "mainImage": "../img/explore/pathways/partydistrict.webp",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/dance_in_the_memories.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": [
            "This part of a town is a blast! Just don't accept any mysterious packages from strangers...",
        ],
        "links": [
            {
                to: "?loc=club",
    
                width: "235px",
                height: "277px",
                right: "0px",
                bottom: "27px"
            },
            {
                to: "?loc=agency",
    
                width: "155px",
                height: "177px",
                right: "210px",
                bottom: "297px"
            },
            {
                to: "?loc=weaponshop",
    
                width: "85px",
                height: "87px",
                right: "400px",
                bottom: "227px"
            },
        ]
    },
    "weaponshop": {
        "title": "Ghandi's Surplus Suprises",
        "mainImage": "../img/explore/places/weaponshop.gif",
        "mainImagePos": "center",
        "holoImage": "../img/holo/HoloHappyBGTransparent.png",
        "frameMode": "dark",
        "music": "../audio/dance_in_the_memories.mp3",
    
        "speakerText": "Ｐａｎｄａ",
        "dialogText": [
            "I uhh, promise this place is definitely legal...",
            "probably."
        ],
        "links": []
    },
}