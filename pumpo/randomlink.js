var random = new Array();

random[0] = "https://lmgtfy.com/?q=LIMP+PUMPO&s=k";
random[1] = "https://www.youtube.com/jesusbelluci";
random[2] = "https://github.kdex.de/earthbound-battle-backgrounds/?163/319";
random[3] = "https://en.wikipedia.org/wiki/Special:Random";
random[4] = "https://youtu.be/ze1aYe6Y7Oo?list=PLIQA1CWXAWg_c4vIC_Hgz2mHJ65GP3fq1";
random[6] = "http://play.wetgenes.com/tv";
random[7] = "http://www.geocities.ws/surf_digby/bass.html";
random[8] = "https://tss.asenheim.org/";
random[9] = "http://animeboards.com/showthread.php?t=60133";
random[10] = "https://zeldauniverse.net/forums/Thread/33933-UFO-s-are-they-real/?s=01e8f9b6052669215d5cb29739abf6a3119264b6";
random[11] = "http://scmapdb.com/map:party-3";
random[12] = "https://www.youtube.com/watch?v=QbanWtSGB9Q";
random[13] = "http://angryalien.com/amys_diary.html";
random[14] = "https://artport.whitney.org/collection/DouglasDavis/live/";
random[15] = "http://www.finerecordingstudio.com/buscards.html";
random[16] = "http://www.g45central.com/g45/summary.php";
random[17] = "http://www.geocities.ws/kreaterz/interviews.html";
function randomlink() {
    window.location = random[Math.floor(Math.random()*random.length)];
    }