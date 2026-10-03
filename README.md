# VivaLaPanda.moe frontend

The code for my personal website.
This mainly consists of the radio page, the exploration pages, and the blog.
I do try to credit assets, but I'm pretty bad at it...

# Art and assets

New PC-98-style art (nav icons, sprites, scenes) is made in a separate workspace:
**[VivaLaPanda/pc98-assets](https://github.com/VivaLaPanda/pc98-assets)**. It has the tools, the source for each asset,
and the [PC-98 style guide](https://github.com/VivaLaPanda/pc98-assets/blob/main/filter/PC98_STYLE_GUIDE.md).
Only finished PNGs get copied into `img/` here. This repo is served as-is, so working files stay over there.

`js/pc98.js` is the in-browser PC-98 filter the blog runs its cover images through. Its research, lint and test
harness are in that repo's `filter/` folder.

# Developing

Pages are compiled from `templates/` with [microtemplate](https://github.com/VivaLaPanda/microtemplate). To rebuild
on every change while serving the site locally:

```
cd templates && ../microtemplate --watch --out ../ --path .
python3 -m http.server 8765        # from the repo root, in another terminal
```

The blog reads `blog/posts.json`, generated from the Substack feed (and its pinned posts) by
`python3 scripts/substack_feed.py`. It's gitignored. On the server, a systemd timer refreshes it hourly
(`scripts/systemd/`).
