// Renders /blog/posts.json (written hourly on the server by scripts/substack_feed.py)
// into the blog page. Covers go through the PC-98 filter (js/pc98.js) when it's loaded.
(function () {
    var list = document.getElementById("blog-posts");

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node;
    }

    function link(href, child) {
        var a = el("a");
        a.href = href;
        a.target = "_blank";
        a.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
        return a;
    }

    function cover(post) {
        var img = new Image();
        img.crossOrigin = "anonymous"; // substackcdn sends ACAO: *, so the canvas stays readable
        img.alt = "";
        img.loading = "lazy";
        img.className = "blog-cover-art";
        if (window.PC98 && typeof window.PC98.render === "function") {
            img.addEventListener("load", function () {
                try {
                    var art = window.PC98.render(img, { width: 240 });
                    art.className = "blog-cover-art";
                    img.replaceWith(art);
                } catch (err) {
                    console.warn("pc98 filter failed for", post.link, err);
                }
            }, { once: true });
        }
        img.src = post.thumb;
        return img;
    }

    function postCard(post) {
        var card = el("article", "blog-post");
        if (post.thumb) {
            card.appendChild(link(post.link, cover(post))).className = "blog-cover";
        }
        var meta = el("div", "blog-meta");
        var when = el("time", "blog-date", post.date.slice(0, 10).replace(/-/g, "."));
        when.dateTime = post.date;
        meta.appendChild(when);
        meta.appendChild(el("h2", "blog-title")).appendChild(link(post.link, post.title));
        if (post.subtitle) meta.appendChild(el("p", "blog-subtitle", post.subtitle));
        card.appendChild(meta);
        return card;
    }

    function fail() {
        list.replaceChildren();
        var p = el("p", "blog-status", "The signal's down right now. Read the posts on ");
        p.appendChild(link("https://vlpanda.substack.com", "Substack"));
        p.appendChild(document.createTextNode("."));
        list.appendChild(p);
    }

    fetch("/blog/posts.json", { cache: "no-cache" })
        .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.json();
        })
        .then(function (feed) {
            if (!feed.posts || !feed.posts.length) throw new Error("no posts");
            if (feed.logo) {
                var logo = document.getElementById("blog-logo");
                logo.addEventListener("load", function () {
                    logo.parentElement.hidden = false;
                }, { once: true });
                logo.src = feed.logo;
            }
            list.replaceChildren();
            // posts pinned on the Substack homepage go first, featured; the rest by date
            var pinned = feed.posts
                .filter(function (p) { return p.pinned; })
                .sort(function (a, b) { return a.pinned - b.pinned; });
            var rest = feed.posts.filter(function (p) { return !p.pinned; });
            if (pinned.length) {
                list.appendChild(el("h2", "blog-section", "★ Pinned"));
                pinned.forEach(function (post) {
                    var card = postCard(post);
                    card.classList.add("blog-post-latest", "blog-post-pinned");
                    list.appendChild(card);
                });
                list.appendChild(el("h2", "blog-section", "All posts"));
            }
            rest.forEach(function (post, i) {
                var card = postCard(post);
                if (i === 0 && !pinned.length) card.classList.add("blog-post-latest");
                list.appendChild(card);
            });
        })
        .catch(function (err) {
            console.warn("blog feed unavailable:", err);
            fail();
        });
})();
