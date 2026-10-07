// Renders /reading/books.json (written hourly on the server by scripts/goodreads_feed.py) into the reading list:
// what Panda's reading now, the five-star favourites as a shelf of covers, then everything read, newest first
// (by date read where Goodreads has one, grouped by year; the undated backlog after that). Covers go through the
// PC-98 filter (js/pc98.js) as they scroll into view; Goodreads' image CDN allows that (Access-Control-Allow-Origin).
(function () {
    var root = document.getElementById("reading");

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

    function dotted(date) {
        return date.replace(/-/g, ".");
    }

    // covers are filtered only once they're near the screen: a hundred canvases at load would be wasteful
    var pending = new Map();
    var observer = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            var job = pending.get(entry.target);
            pending.delete(entry.target);
            if (job) job();
        });
    }, { rootMargin: "300px" }) : null;

    function cover(book, width, large) {
        var img = new Image();
        img.crossOrigin = "anonymous";
        img.alt = book.title;
        img.className = "reading-cover";
        img.width = width;
        var src = large ? book.cover_large : book.cover;
        if (!src) return el("span", "reading-cover reading-cover-missing", "?");
        var start = function () {
            if (window.PC98 && typeof window.PC98.render === "function") {
                img.addEventListener("load", function () {
                    try {
                        var art = window.PC98.render(img, { width: width });
                        art.className = "reading-cover";
                        art.setAttribute("role", "img");
                        art.setAttribute("aria-label", book.title);
                        img.replaceWith(art);
                    } catch (err) {
                        console.warn("pc98 filter failed for", book.title, err);
                    }
                }, { once: true });
            }
            img.src = src;
        };
        if (observer) {
            pending.set(img, start);
            observer.observe(img);
        } else {
            start();
        }
        return img;
    }

    function section(label) {
        root.appendChild(el("div", "recipe-section", label));
    }

    // a book with its cover: what's being read now
    function coverCard(book) {
        var card = el("article", "reading-current");
        card.appendChild(outLink(book.link, cover(book, 98, true), "reading-current-cover"));
        var meta = el("div", "reading-meta");
        meta.appendChild(outLink(book.link, book.title, "reading-title"));
        if (book.series) meta.appendChild(el("span", "reading-series", "(" + book.series + ")"));
        meta.appendChild(el("div", "reading-author", book.author));
        card.appendChild(meta);
        return card;
    }

    // the favourites shelf: covers with their titles underneath
    function shelfItem(book) {
        var li = el("li", "reading-shelf-item");
        var a = outLink(book.link, cover(book, 98, false), "reading-shelf-link");
        a.title = book.title + " by " + book.author;
        a.appendChild(el("span", "reading-shelf-title", book.title));
        li.appendChild(a);
        return li;
    }

    // a row in the list: title (series), author, stars and date read; the review underneath when there is one
    function row(book) {
        var li = el("li", "reading-book");
        var main = el("div", "reading-meta");
        main.appendChild(outLink(book.link, book.title, "reading-title"));
        if (book.series) main.appendChild(el("span", "reading-series", "(" + book.series + ")"));
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
        root.appendChild(ul);
    }

    function render(data) {
        var shelves = data.shelves || {};
        var reading = shelves["currently-reading"] || [];
        var read = shelves.read || [];
        if (!read.length && !reading.length) throw new Error("empty shelves");
        root.replaceChildren();

        if (reading.length) {
            section("Currently reading");
            var now = el("div", "reading-now");
            reading.forEach(function (b) { now.appendChild(coverCard(b)); });
            root.appendChild(now);
        }

        var favourites = read.filter(function (b) { return b.rating === 5; });
        if (favourites.length) {
            section("★ Favourites");
            var shelf = el("ul", "reading-shelf");
            favourites.forEach(function (b) { shelf.appendChild(shelfItem(b)); });
            root.appendChild(shelf);
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
    }

    function fail() {
        root.replaceChildren();
        var p = el("p", "reading-status", "The shelves are out of reach right now. They're on ");
        p.appendChild(outLink("https://www.goodreads.com/user/show/29012397-vivalapanda", "Goodreads"));
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
