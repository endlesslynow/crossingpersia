"""Writes the pages that depend on today's date:
  - day-1.html, day-2.html ... one finished page for every day written so far, with the English
    story, picture, caption and sources written into the page, so chatbots can read them.
    In a browser day.js still runs on them, so the language buttons, the Dari recording and
    the word slips work as on day.html.
  - sitemap.xml, the list of pages for search engines.

It reads only articles.js and day.html, both already on the website. make_articles.py runs it
after copying the articles, and GitHub runs it again on every upload.

Every written day is made at once, including days still to come. No daily upload is needed:
in a browser, day.js sends a reader who opens a day before its date to the journal page, so
each day appears by itself at 22:00 UTC on its date (17 November 2026 is Day 1).
"""
import datetime
import html
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
text = (HERE / "articles.js").read_text(encoding="utf-8")
articles = {int(k): v for k, v in json.loads(text[text.index("{"):text.rindex("}") + 1]).items()}

SITE = "https://www.crossingpersia.com/"
today = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=22)).date()   # Day 1 began at 22:00 UTC on 17 November
released = sorted(articles, key=int)   # every written day; day.js hides a day until its date
pages = ["", "journal.html", "maps.html", "about.html", "map-sources.html"]
pages += [f"day-{n}.html" for n in released]
(HERE / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url>\n    <loc>{html.escape(SITE + p)}</loc>\n    <lastmod>{today.isoformat()}</lastmod>\n  </url>\n"
              for p in pages)
    + "</urlset>\n", encoding="utf-8")
print(f"sitemap.xml: {len(pages)} pages")


# Every written day as a finished page, day-1.html, day-2.html ..., with the English
# story, picture, caption and sources already written into the page. Chatbots that do not run
# the page's code can read these. In a browser day.js still runs on them, so the language
# buttons, the Dari recording and the word slips work as on day.html.
TEMPLATE = (HERE / "day.html").read_text(encoding="utf-8")


def plain(text):
    return html.unescape(re.sub(r"<[^>]+>", "", text))


def day_page(n):
    a = articles[n]
    url = f"{SITE}day-{n}.html"
    summary = plain(a["paragraphs"][0] if a["paragraphs"] else "")
    if len(summary) > 160:
        summary = re.sub(r"\s+\S*$", "", summary[:157]) + "…"
    published = (datetime.date(2026, 11, 16) + datetime.timedelta(days=int(n))).isoformat()
    facts = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": f"Day {n}: {a['title']}", "description": summary, "url": url,
        "datePublished": published, "inLanguage": "en",
        "isPartOf": {"@type": "WebSite", "name": "Crossing Persia", "url": SITE},
    }
    if a["pic"]:
        facts["image"] = SITE + "pictures/" + a["pic"]
    attr = lambda s: html.escape(s, quote=True)
    page = TEMPLATE
    swaps = [
        ("<title>Crossing Persia</title>", f"<title>Crossing Persia: Day {n}</title>"),
        ('<meta name="description" content="One day of Arion\'s journey, in English, Dari and Kurmanji.">',
         f'<meta name="description" content="{attr(summary)}">\n<link rel="canonical" href="{url}">\n'
         f'<script type="application/ld+json">{json.dumps(facts, ensure_ascii=False)}</script>'),
        ('<meta property="og:title" content="Crossing Persia">',
         f'<meta property="og:title" content="Crossing Persia: Day {n}, {attr(a["title"])}">\n'
         f'<meta property="og:url" content="{url}">'),
        ('<meta property="og:description" content="One day of Arion\'s journey, in English, Dari and Kurmanji.">',
         f'<meta property="og:description" content="{attr(summary)}">'),
        ('<img id="hero-img" alt="">',
         f'<img id="hero-img" src="pictures/{attr(a["pic"] or "")}" alt="{attr(plain(a["caption"]))}">'),
        ('<p class="when" id="when"></p>', f'<p class="when" id="when">{html.escape(a["heading"])}</p>'),
        ('<h1 class="title" id="title"></h1>', f'<h1 class="title" id="title">{html.escape(a["title"])}</h1>'),
        ('<div id="story"></div>',
         '<div id="story">' + "".join(f'<p class="para">{p}</p>' for p in a["paragraphs"]) + "</div>"),
        ('<footer class="notes" id="notes"></footer>', f'<footer class="notes" id="notes">{a["notes"]}</footer>'),
        ('<nav class="days" id="days" aria-label="Other days"></nav>',
         '<nav class="days" id="days" aria-label="Other days">'
         + (f'<a class="prev" href="day-{int(n) - 1}.html"><b>← Day {int(n) - 1}</b><span>{articles[n - 1]["title"]}</span></a>'
            if n - 1 in articles else "")
         + (f'<a class="next" href="day-{int(n) + 1}.html"><b>Day {int(n) + 1} →</b><span>{articles[n + 1]["title"]}</span></a>'
            if n + 1 in released else "")
         + "</nav>"),
        ('<script>var READINGS = [];</script>', f'<script>var READINGS = [], DAY_PAGE = {int(n)};</script>'),
    ]
    for old, new in swaps:
        if old not in page:
            raise SystemExit(f"day.html has changed, cannot find: {old}")
        page = page.replace(old, new, 1)
    (HERE / f"day-{n}.html").write_text(page, encoding="utf-8")


for n in released:
    day_page(n)
print(f"finished day pages: day-1.html to day-{released[-1]}.html" if released else "finished day pages: none yet")
