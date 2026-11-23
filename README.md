# Crossing Persia website: where everything is

The pages people open sit at the top of the folder, so their addresses never change
(www.crossingpersia.com/maps.html and so on). Everything behind them is in folders.

| Where | What is in it |
|---|---|
| `index.html` | The cover |
| `journal.html` | The Travel Journal: one card per day, grouped by week |
| `day.html` | One day's article: `day.html?day=1` |
| `week.html` | One week's summary video: `week.html?week=1` |
| `maps.html` | The route map |
| `map-sources.html` | The sources for the route map |
| `about.html` | About the project |
| `css/` | One style sheet per page, named after the page |
| `js/` | One script per page, named after the page |
| `data/articles.js` | The English articles. Made by `tools/make_articles.py` from the Obsidian vault; never edit it by hand |
| `data/videos.js` | The YouTube link of each week's summary video. Add one line per week |
| `map-layers/` | The map's data: the states of Greece and the Persian Empire in 500 BCE, the ancient place names, and every place named in the diary. Made by Map Maker and by `tools/mentioned_places.py` in the Crossing Persia program folder |
| `pictures/` | Each day's picture. Copied in by `tools/make_articles.py` |
| `reader/` | The Dari and Kurmanji readings and the Dari recordings. Copied in by `tools/make_articles.py` |
| `assets/` | The site's own pictures: the cover, the About page, the tab icon, the share picture |
| `fonts/`, `vendor/` | Fonts, and MapLibre, the program that draws the map |
| `tools/` | Programs and notes for making the site. `make_day_pages.py` goes online because GitHub runs it; the others stay on this computer |

## Made on GitHub, not kept here

`day-1.html`, `day-2.html` ... and `sitemap.xml` are made by `tools/make_day_pages.py` on GitHub
every time the site is uploaded (`.github/workflows/daily.yml`). They are a copy of each day's
article written straight into the page, for search engines and chatbots that do not run scripts.
Because they are made fresh at each upload, they are not in this folder, however many days there are.

## Uploading

Rufus's "Update Crossing Persia Website" button, or `python rufus_website.py cp` in the Rufus folder,
runs `tools/make_articles.py` and uploads the folder to GitHub.
