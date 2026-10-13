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

The reading list (`/reading/`) works the same way: `python3 scripts/goodreads_feed.py` turns Panda's public Goodreads
shelves (their RSS feeds; the API is closed) into `reading/books.json`, gitignored, refreshed hourly on the server by
`goodreads-feed.timer`. Read dates and reviews added on Goodreads show up on the page automatically. The ★ Favourites section is the Goodreads
shelf named `favorites` (hidden while it doesn't exist or is empty).

The recipe book is generated from `content/recipes.md` (an export of the recipe doc: `## Course`, `### Recipe`,
`**Verdict:**`, a "Serves · Source" line, then `**Ingredients**` / `**Method**` / `**Notes**` sections). After
editing it, run `python3 scripts/build_recipes.py`, which writes `templates/recipes.html` and
`templates/recipes/<slug>.html`, then rebuild with microtemplate. Short URLs, the links between recipes, the
"★ Starred" list and Holo's face per verdict (`HOLO_FACES`, `HOLO_OVERRIDES`) are set at the top of the script; the pancakes and katsudon pages are hand-written
(listed under Mains via `OLDER` in the script).

# The house: Home (the living room) and Panda's Room

`/living-room.html` (Home, the sidebar's kotatsu) and `/room.html` (the bedroom, through the living room's left door)
are PC-98 rooms drawn live from Panda's real house: the time of day, the lamps (on/off, brightness, colour), the
blinds, the thermostat, the TV, music on the speakers, the kotatsu's plug. Plain JS, no libraries, no build step:

- `js/house-render.js`: paints a room's index map in the current time of day's 16 colours plus each lit lamp's light.
- `js/house-room.js`: loads the room's scene and the house state, draws, and redraws every minute.
- `js/scene.js`: the hotspots and Panda's dialogue box. It runs both rooms and every Explore page.
- `js/living-room-data.js`, `js/room-data.js`: each room's objects; `data/dialogue.json`: every line Panda says
  (hand-edited; its `_readme` lists the variants and placeholders).
- `js/scene-music.js`: the music and the mute speaker (the site's shared `muted` setting).
- `templates/t_scene.html`, `css/scene.css`: the scene page's markup and style. Each page sets its music, alt text
  and noscript fallback through `{{ define }}` blocks.
- `img/living-room/`, `img/room/house/`: the exported scenes. They're made in pc98-assets
  (`easel/pieces/living-room`, `easel/pieces/panda-room`): edit the passages there, run the export, copy the
  output here, and bump the room's `house.v` (and the scene `?v=`) in its data file.

**Explore** uses the same engine. `js/explore-locations.js` lists every place: its art, music, exits (rects in
the 740×528 picture), objects, views and layers (pictures over the art, e.g. lanterns, glints). Its adapter at the
bottom turns the current place (`?loc=` or the page's `data-scene`) into the scene. Explore's lines are in
`data/dialogue.json` under `explore.<place>`. Explore has no LOOK button, and its exits aren't outlined: the map is
meant to be poked at.
- What there is to do (games, menus, animals, ambient motion) is `js/explore-play.js`, keyed by place.
- Plain menus are data: a choice can `say`, `pick` one line at random, open a `menu`, `serve` a drink, change the
  `song`, `go` somewhere, or need something you've heard (`need`).
- New art for a place goes in `img/explore/layers/`, drawn on the picture's own pixel grid in its own inks.
- It rains on the outdoor night streets about one hour in three (the same hour everywhere); add `&rain` to a URL
  to see it.

The map (→ an exit; ⇢ a hidden or unlocked way; ↺ joins somewhere else on the map):
```
Home ─ Main Street ─┬─ Casino (pans; roulette)
                    ├─ Tokugawa Tower lobby ─┬─ Penthouse
                    │                         └─ Tower Bar (drinks)
                    ├─ Picrew Plaza ─┬─ Pumpo Park (lanterns) ─ Summer Festival (goldfish) ─ Shrine (fortunes) ─ ↺ Forest Edge
                    │                ├─ Residential (─ Konbini) ─ Houses ─┬─ the girl ─ Acacia Apartments ─┬─ the Roof (shooting stars; drawn)
                    │                │                        │                                 └⇢ (the cat) Back Passage
                    │                │                        │      ─ Old House ─┬─ its room (the cat; pet it)
                    │                │                        │                   └─ ↺ Shrine
                    │                │                        └─ Andy's House
                    │                └─ Forest Edge (fireflies) ─ Hidden Glade (pond: the house key) ─ train.html
                    └─ Isogashii Blvd ─┬─ Taito Game Centre (claw machine: prizes to your pockets; drawn)
                                       ├─ Club Polka (dance) ─ Agency (Johnny: the hunt, rumours) ─ Denchi's (symphoslots)
                                       ├─ Crossing ─ Platform 1 ─ On the train ─┬─ train.html
                                       │                                        └─ Otojima Station ─ Half Pipe ─ Beach
                                       │                                           ─ Sunset ─ Harbour (fishing) ─┬─ ↺ Otojima Station
                                       │                                                                         └─ Riverboat ─ ↺ Glade
                                       └─ Alley ─┬─ Shizuka St ─┬─ Erratic Errata ⇢ (second edition) Hidden Garden
                                                 │              ├─ Namba Bears (song requests) ─ Bathhouse ─ inner bath
                                                 ├─ Ghandi's ─ Rabu Rabu (drinks)
                                                 └─ Ramen stall (Taisho; drawn for the city) ─ recipes
```

**The house key.** Visitors who find Panda's spare key can switch the living room's lamps, blinds and AC on and off
(nothing else). `js/house-key.js` runs on every scene page: the key slot and the hunt's items by the dialog box's ▼,
Johnny Uppercut's hunt (four favours around Explore, dropped in the Hidden Glade's pond), the bedroom PC's login (the
real password, or an SQL injection), and the living room's switches. Lines: `data/dialogue.json` under `house_key`.
- `scripts/house_key.py` (VPS, `house-key.service`, nginx `/house/api/`): issues keys (permanent, signed tokens) and
  forwards switches to rodney's `POST /api/house/act` with its own write token (`/etc/vivalapanda/house_write_token`).
  Per-key and global rate limits; every key and action is logged with its key id and IP to
  `/var/log/vivalapanda/house_keys.jsonl` (rodney logs each action too, in `~/.config/home-mcp/house_actions.jsonl`).
- **Kill switch:** `touch /etc/vivalapanda/house_writes_off` on the VPS, or `home-mcp house-write-token --off` on
  rodney. Revoke one key: add its id to `revoked` in `/etc/vivalapanda/house_keys.json`; all: change its `secret`.
- **The PC password** is in `~/.config/vivalapanda/house_pc_password` on rodney (hashed on the VPS). To change it:
  `ssh root@<vps> python3 /var/www/html/vivalapanda.moe/scripts/house_key.py set-password < newfile`.
- **The hunt's words** are in `js/house-key.js` (ITEMS); after changing them, run `house_key.py set-hunt` with the four.

**The feed.** The house state is a static file, `house/state.json` (gitignored), so visitors never reach the house:

1. rodney (Panda's home server) runs home-mcp, which answers `GET /api/house` at `home.vivalapanda.moe` through its
   Cloudflare tunnel, only for this site's server: a read-only token plus an IP allowlist.
2. On the VPS, `house-feed.timer` runs `scripts/house_feed.py` every minute (Python standard library only).
   - It writes `house/state.json` atomically.
   - A failed fetch leaves the last good file in place.
   - The token is in `/etc/vivalapanda/house_token` (mode 600).
   - The unit files' headers say how to install them.
3. The pages fetch the file every minute.

**When it breaks.** Nothing on the page depends on the feed being up:
- **State older than 30 minutes, or missing:** the devices count as unknown, so lamps are off and the dialogue uses
  its `hover_unknown` lines. The time of day still follows the house's clock, worked out in the browser from the
  sun at San Francisco. The readout says "offline".
- **Scene can't load,** or the browser blocks canvas readback: the room is its static picture
  (`img/living-room/noon@4x.png`, `img/room/room@4x.png`). Its hotspots still work, and the living room's two doors
  keep fallback outlines so you can always go on or out.
- **To check the feed:** `systemctl list-timers house-feed.timer` and `journalctl -u house-feed.service` on the VPS.

**Timers on the VPS** (all in `scripts/systemd/`, installed by copying to `/etc/systemd/system/`):
- `house-feed`: every minute.
- `substack-feed` (the blog) and `goodreads-feed` (the reading list): hourly.

**Dev.** `dev.vivalapanda.moe` serves rodney's working tree, through the same tunnel:
- It runs `scripts/dev_server.py` from the user unit `scripts/systemd/vivalapanda-dev.service`.
- It serves only git-tracked files and the generated feeds.
- It always reads `house/state.json` from production, since only the VPS may call the house.
- Untracked files 404 on dev until you `git add` them.

**Cache-busting.** Scripts and styles are versioned by hand in the templates (`?version=N`). When you change a JS or
CSS file, bump its number in every template that loads it, then rebuild.

**Fonts.** The pc-98 font is split so pages load fast:
- `fonts/pc-9800-core.woff2` (and the bold one) holds the glyphs the site uses, 12KB. It's made by
  `scripts/subset_fonts.py`; re-run that after adding text in a new script.
- `css/style.css` gives every other character to the full font through `unicode-range`. A new character therefore
  still renders, just with a bigger download.
- If the core file can't load, the full font stands in.

**microtemplate on Linux.** The committed `microtemplate` binary is for macOS (arm64). Elsewhere, build it with Go:
`git clone https://github.com/VivaLaPanda/microtemplate && cd microtemplate && go build -o ~/.local/bin/microtemplate .`
