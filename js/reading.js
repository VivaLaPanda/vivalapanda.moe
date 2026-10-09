// Renders /reading/books.json (written daily on the server by scripts/goodreads_feed.py) into the reading list:
// what Panda's reading now, the favourites (Goodreads "favorites" shelf) as a shelf of covers, then everything read, newest first
// (by date read where Goodreads has one, grouped by year; the undated backlog after that). Covers go through the
// PC-98 filter (js/pc98.js); Goodreads' image CDN allows that (Access-Control-Allow-Origin).
(function () {
    var root = document.getElementById("reading");
    var PROFILE = "https://www.goodreads.com/user/show/89085265-vivalapanda";

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function outLink(href, child, className) {
        var a = el("a", className);
        a.href = href;
        a.target = "_blank";
        a.rel = "noopener";
        a.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
        return a;
    }

    function stars(rating) {
        if (!rating) return "";
        return "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
    }

    // "Bog Standard Isekai #1" / "Butcher of Gadobhra, #3" / "Dune, #1-6" -> "Bog Standard Isekai · book 1"
    function seriesLabel(series) {
        var m = /^(.*?),?\s*#\s*(\S+)$/.exec(series);
        if (!m) return series;
        return m[1] + " · book" + (/[-–]/.test(m[2]) ? "s " : " ") + m[2].replace("-", "–");
    }

    function dotted(date) {
        return date.replace(/-/g, ".");
    }

    // Covers sit in a fixed 2:3 frame from the start (a PC-98 checker until the art is ready), so nothing below moves
    // as they arrive. Each is cropped to 2:3 and run through the PC-98 filter in a worker (js/pc98-worker.js; a
    // cover takes 25-75ms to filter, which on the main thread made scrolling hitch), one at a time, then fades in.
    // Without workers it falls back to the main-thread filter, with a breather between covers.
    var queue = [];
    var worker = null, waiting = {}, nextId = 0;
    try {
        worker = new Worker("/js/pc98-worker.js?version=1");
        worker.onmessage = function (e) {
            var cb = waiting[e.data.id];
            delete waiting[e.data.id];
            if (cb) cb(e.data);
        };
        worker.onerror = function (e) {
            console.warn("pc98 worker failed, filtering on the main thread:", e.message);
            worker = null;
            Object.keys(waiting).forEach(function (id) { waiting[id]({ error: "worker failed" }); });
            waiting = {};
        };
    } catch (err) {
        worker = null;
    }

    // the filtered art as a canvas, from the worker or (fallback) the main thread
    function filter(source, width, callback) {
        if (!worker) {
            if (!window.PC98 || typeof window.PC98.render !== "function") return callback(null);
            try { return callback(window.PC98.render(source, { width: width })); }
            catch (err) { console.warn("pc98 filter failed:", err); return callback(null); }
        }
        var id = nextId++;
        waiting[id] = function (res) {
            if (res.error) {
                // the worker can't do this one: try the main thread before giving up
                if (window.PC98 && typeof window.PC98.render === "function") {
                    try { return callback(window.PC98.render(source, { width: width })); } catch (err) { /* plain */ }
                }
                return callback(null);
            }
            var c = document.createElement("canvas");
            c.width = res.width;
            c.height = res.height;
            c.getContext("2d").putImageData(new ImageData(res.data, res.width, res.height), 0, 0);
            callback(c);
        };
        var px = source.getContext("2d").getImageData(0, 0, source.width, source.height);
        worker.postMessage({ id: id, rgba: px.data, width: source.width, height: source.height, opts: { width: width } },
            [px.data.buffer]);
    }
    var running = false;

    function next() {
        var job = queue.shift();
        if (!job) { running = false; return; }
        running = true;
        job(function () { setTimeout(next, worker ? 0 : 16); });
    }

    function enqueue(job) {
        queue.push(job);
        if (!running) next();
    }

    function show(frame, art) {
        art.classList.add("reading-cover-art");
        frame.appendChild(art);
        requestAnimationFrame(function () { art.classList.add("shown"); });
    }

    // the middle of the image at 2:3, at its own resolution
    function cropTo2by3(img) {
        var w = img.naturalWidth, h = img.naturalHeight;
        var cw = Math.min(w, Math.round(h * 2 / 3)), ch = Math.min(h, Math.round(w * 3 / 2));
        var c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        c.getContext("2d", { willReadFrequently: true }).drawImage(img, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, cw, ch);
        return c;
    }

    // no cover art: the title lettered on a plain frame
    function missing(frame, book) {
        frame.classList.add("reading-cover-missing");
        frame.appendChild(el("span", "reading-cover-text", book.title));
    }

    function cover(book, width, large) {
        var frame = el("span", "reading-cover");
        frame.setAttribute("role", "img");
        frame.setAttribute("aria-label", book.title);
        var src = large ? book.cover_large : book.cover;
        if (!src) {
            missing(frame, book);
            return frame;
        }
        enqueue(function (done) {
            var img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = function () {
                var cropped;
                try { cropped = cropTo2by3(img); } catch (err) { cropped = null; }
                if (!cropped) { show(frame, img); return done(); } // the plain cover, still in its frame
                filter(cropped, width, function (art) {
                    show(frame, art || img);
                    done();
                });
            };
            img.onerror = function () {
                missing(frame, book);
                done();
            };
            img.src = src;
        });
        return frame;
    }

    var out = null; // the fragment being built; swapped in all at once

    function section(label) {
        out.appendChild(el("div", "recipe-section", label));
    }

    function elsewhere(profile) {
        out.appendChild(el("div", "recipe-section", "Elsewhere"));
        var ul = el("ul", "recipe-index recipe-elsewhere");
        var li = el("li");
        var a = outLink(profile, el("span", "recipe-title", "Follow along on Goodreads"));
        a.appendChild(el("span", "recipe-host", "goodreads.com"));
        li.appendChild(a);
        ul.appendChild(li);
        out.appendChild(ul);
    }

    // a labelled grid of covers with titles and authors (what's being read now)
    function coverGrid(label, books) {
        if (!books.length) return;
        section(label);
        var grid = el("ul", "reading-shelf reading-now");
        books.forEach(function (b) { grid.appendChild(shelfItem(b, true)); });
        out.appendChild(grid);
    }

    // the favourites shelf: covers with their titles underneath
    function shelfItem(book, withAuthor) {
        var li = el("li", "reading-shelf-item");
        var a = outLink(book.link, cover(book, 98, false), "reading-shelf-link");
        a.title = book.title + " by " + book.author;
        a.appendChild(el("span", "reading-shelf-title", book.title));
        if (withAuthor) a.appendChild(el("span", "reading-shelf-author", book.author));
        li.appendChild(a);
        return li;
    }

    // a row in the list: title (series), author, stars and date read; the review underneath when there is one
    function row(book) {
        var li = el("li", "reading-book");
        var main = el("div", "reading-meta");
        main.appendChild(outLink(book.link, book.title, "reading-title"));
        if (book.series) main.appendChild(el("span", "reading-series", seriesLabel(book.series)));
        main.appendChild(el("div", "reading-author", book.author));
        if (book.review) {
            var review = el("p", "reading-review", book.review);
            main.appendChild(review);
            main.appendChild(outLink(book.review_link, "→ Full review", "reading-review-link"));
        }
        li.appendChild(main);
        var side = el("div", "reading-side");
        if (book.rating) {
            var s = el("span", "reading-stars", stars(book.rating));
            s.setAttribute("aria-label", book.rating + " out of 5 stars");
            side.appendChild(s);
        }
        if (book.read) {
            var t = el("time", "reading-date", dotted(book.read));
            t.dateTime = book.read;
            side.appendChild(t);
        }
        li.appendChild(side);
        return li;
    }

    function list(books) {
        var ul = el("ul", "reading-list");
        books.forEach(function (b) { ul.appendChild(row(b)); });
        out.appendChild(ul);
    }

    function render(data) {
        var shelves = data.shelves || {};
        var reading = shelves["currently-reading"] || [];
        var read = shelves.read || [];
        if (!read.length && !reading.length) throw new Error("empty shelves");
        out = document.createDocumentFragment();

        var caughtUp = reading.filter(function (b) { return (b.shelves || []).indexOf("caught-up") >= 0; });
        var active = reading.filter(function (b) { return caughtUp.indexOf(b) < 0; });
        coverGrid("Currently reading", active);
        coverGrid("Caught up, waiting for more", caughtUp);

        // the "favorites" shelf Panda curates on Goodreads (hidden until it has books)
        var favourites = shelves.favorites || [];
        if (favourites.length) {
            section("★ Favourites");
            var shelf = el("ul", "reading-shelf");
            favourites.forEach(function (b) { shelf.appendChild(shelfItem(b)); });
            out.appendChild(shelf);
        }

        // books with a date read, by year; the books from before Panda logged dates come after, as "Read"
        // (or "Earlier", once there are dated ones above them)
        var byYear = {};
        var undated = [];
        read.forEach(function (b) {
            if (b.read) (byYear[b.read.slice(0, 4)] = byYear[b.read.slice(0, 4)] || []).push(b);
            else undated.push(b);
        });
        var years = Object.keys(byYear).sort().reverse();
        years.forEach(function (year) {
            section("Read in " + year);
            list(byYear[year]);
        });
        if (undated.length) {
            section(years.length ? "Earlier" : "Read");
            list(undated);
        }
        elsewhere(data.profile || PROFILE);

        root.replaceChildren(out);
        root.classList.add("reading-in");
    }

    function fail() {
        root.replaceChildren();
        var p = el("p", "reading-status", "The shelves are out of reach right now. They're on ");
        p.appendChild(outLink(PROFILE, "Goodreads"));
        p.appendChild(document.createTextNode("."));
        root.appendChild(p);
    }

    fetch("/reading/books.json", { cache: "no-cache" })
        .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(render)
        .catch(function (err) {
            console.warn("reading list unavailable:", err);
            fail();
        });
})();
