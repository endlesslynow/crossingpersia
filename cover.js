/* Crossing Persia, front cover behaviour.
   Place names and translations follow Wayne Horowitz, "The Babylonian Map of the World",
   Iraq 50 (1988), 147-165. Numbers are his label numbers. Positions are percentages of the disk image. */

(() => {
  const PLACES = [
    { no: 13, name: "Babylon",   ak: "tin.tir<sup>ki</sup>", note: "at the centre of the world", x: 58.1, y: 43.6 },
    { no: 1,  name: "Mountain",  ak: "šadû",           note: "where the river begins, at the top of the map", x: 53.4, y: 30.0 },
    { no: 2,  name: "City",      ak: "uru",            note: "a city with no name", x: 63.7, y: 36.3 },
    { no: 3,  name: "Urartu",    ak: "urašṭu",         note: "the kingdom in the northern mountains", x: 68.6, y: 41.4 },
    { no: 4,  name: "Assyria",   ak: "aššur",          note: "upriver, to the north", x: 68.4, y: 46.8 },
    { no: 5,  name: "Der",       ak: "dēr",            note: "a city on the border with Elam", x: 70.2, y: 60.3 },
    { no: 7,  name: "Swamp",     ak: "appāru",         note: "the marshes where the river ends", x: 59.6, y: 63.8 },
    { no: 8,  name: "Susa",      ak: "šušan",          note: "later a capital of the Persian kings", x: 44.2, y: 71.6, susa: true },
    { no: 9,  name: "Channel",   ak: "bitqu",          note: "a channel in the south", x: 33.6, y: 66.6, left: true },
    { no: 10, name: "Bit Yakin", ak: "bīt-yakīn",      note: "a Chaldean land by the southern marshes", x: 35.9, y: 60.7, left: true },
    { no: 11, name: "City",      ak: "uru",            note: "a city with no name", x: 28.3, y: 55.0, left: true },
    { no: 12, name: "Habban",    ak: "habban",         note: "a place on the western side of the map", x: 33.1, y: 36.9, left: true },
    { no: 14, name: "Ocean",     ak: "marratu",        note: "the salt sea that rings the whole land", x: 19.2, y: 49.4, left: true },
    { no: 18, name: "Region",    ak: "nagû",           note: "past the ocean, &ldquo;where the Sun is not seen&rdquo;", x: 58.4, y: 7.6 },
    { no: 19, name: "Region",    ak: "nagû",           note: "past the ocean, &ldquo;6 leagues in between&rdquo;", x: 26.0, y: 15.0, left: true },
    { no: 22, name: "Region",    ak: "nagû",           note: "past the ocean, &ldquo;8 leagues in between&rdquo;", x: 88.6, y: 40.2, up: true },
  ];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const cover = $("#cover");
  const disk = $("#disk");
  const spots = $("#spots");
  let frame = $("#mapFrame");
  const mapFrame = frame;      // the page shown behind the cover; the About card swaps in its own
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- place markers */

  for (const p of PLACES) {
    const s = document.createElement("span");
    s.className = "spot" + (p.left ? " left" : "") + (p.up ? " up" : "") + (p.susa ? " susa" : "");
    s.style.left = p.x + "%";
    s.style.top = p.y + "%";
    s.innerHTML = `<i></i><b>${p.name}</b>`;
    s.dataset.no = p.no;
    spots.appendChild(s);
  }

  let shown = null;

  function show(p) {
    const key = p ? p.no : null;
    if (key === shown) return;
    shown = key;
    $$(".spot", spots).forEach(s => s.classList.toggle("active", !!p && +s.dataset.no === p.no));
  }

  // nearest place to the pointer, within a small radius, undoing the disk's turn
  const TURN = -32;
  function nearest(e) {
    const r = disk.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width) * 100 - 50;
    const dy = ((e.clientY - r.top) / r.height) * 100 - 50;
    const a = (disk.classList.contains("peek") ? -TURN : 0) * Math.PI / 180;
    const px = 50 + dx * Math.cos(a) - dy * Math.sin(a);
    const py = 50 + dx * Math.sin(a) + dy * Math.cos(a);
    let best = null, bd = 4.2;
    for (const p of PLACES) {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  disk.addEventListener("pointermove", e => {
    if (e.pointerType === "touch") return;
    const p = nearest(e);
    show(p);
    disk.classList.toggle("on-spot", !!p);
  });
  disk.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") peek(true); });
  disk.addEventListener("pointerleave", () => {
    show(null);
    disk.classList.remove("on-spot");
    peek(false);
  });

  /* ---------------- today's date, in 500 BCE */

  // Day 1 of the diary is 17 November. These are the approved days, from the audio files of weeks 1 and 2.
  const DAYS = ["Athens to Eleusis", "Eleusis", "Eleusis to Oinoe", "Oinoe", "Oinoe to Hysiai",
    "Hysiai to Plataea", "Plataea", "Plataea to Thebes", "Thebes", "Thebes",
    "Thebes to Haliartos", "Haliartos", "Haliartos to Koroneia", "Koroneia"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  // Two clocks, the same for every reader wherever they are.
  // The date and the day number change at midnight in Berlin.
  // Where Arion is changes at 22:00 UTC, when his new post goes up (the UTC date 22 hours ago).
  const dateFormat = tz => new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric" });
  const berlinFormat = dateFormat("Europe/Berlin"), utcFormat = dateFormat("UTC");
  function ymd(format, when) {
    const parts = format.formatToParts(when);
    const get = t => +parts.find(x => x.type === t).value;
    return { y: get("year"), m: get("month"), d: get("day") };
  }
  const dayNumber = ({ y, m, d }) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(2026, 10, 17)) / 864e5) + 1;
  const dcToday = () => ymd(berlinFormat, new Date());
  const postDay = () => dayNumber(ymd(utcFormat, new Date(Date.now() - 22 * 3600e3)));
  /* ---------------- words that can turn into Old Persian cuneiform

     Persia and Persian Empire are real Old Persian words: Parsa, and Parsa xshacam ("the kingdom of Persia").
     Day is the real Old Persian word rauca. Every other word is spelled out by its sound in the Old Persian
     signs, the way the Persians wrote foreign names. Each sign stands for a consonant with a vowel. */
  const OP_SIGN = { a: 0x103A0, i: 0x103A1, u: 0x103A2, ka: 0x103A3, ku: 0x103A4, ga: 0x103A5, gu: 0x103A6, xa: 0x103A7,
    ca: 0x103A8, ja: 0x103A9, ji: 0x103AA, ta: 0x103AB, tu: 0x103AC, da: 0x103AD, di: 0x103AE, du: 0x103AF,
    tha: 0x103B0, pa: 0x103B1, ba: 0x103B2, fa: 0x103B3, na: 0x103B4, nu: 0x103B5, ma: 0x103B6, mi: 0x103B7,
    mu: 0x103B8, ya: 0x103B9, va: 0x103BA, vi: 0x103BB, ra: 0x103BC, ru: 0x103BD, la: 0x103BE, sa: 0x103BF,
    za: 0x103C0, sha: 0x103C1, ssa: 0x103C2, ha: 0x103C3 };
  const opers = s => s.split(" ").map(x => String.fromCodePoint(OP_SIGN[x])).join("");
  const CUN = {
    "Crossing": "ku ra u sa i na ga",
    "Persia":   "pa a ra sa",                 // Parsa
    "Today":    "tu u da a i",
    "November": "na u va ma ba ra",
    "December": "da i sa ma ba ra",
    "Day":      "ra u ca",                    // rauca, day
    "Arion\u2019s": "a ra i ya u na sa",
    "Arion":    "a ra i ya u na",
    "Journey":  "ja u ra na i",
    "Maps":     "ma a pa sa",
    "Substack": "sa ba sa ta a ka",
    "About":    "a ba a u ta",
    "Project":  "pa ra a ja ka ta",
  };
  const cun = w => CUN[w]
    ? `<span class="swap-stack" data-cun><span class="main">${w}</span><span class="alt opers" lang="peo" aria-hidden="true">${opers(CUN[w])}</span></span>`
    : w;
  $$("[data-cunify]").forEach(el => { el.outerHTML = cun(el.textContent.trim()); });
  // only rewrite a line when its words change, so a word that is showing cuneiform is not reset every minute
  const setHTML = (el, html) => { if (el.dataset.last !== html) { el.dataset.last = html; el.innerHTML = html; } };

  function setDate() {
    const { y, m, d } = dcToday();
    setHTML($("#today"), `${d} ${cun(MONTHS[m - 1])} 500&nbsp;BCE`);
    const dayNo = dayNumber({ y, m, d });
    const journey = $("#journeyLine"), where = $("#whereLine");
    journey.hidden = dayNo < 1;
    setHTML($("#dayNo"), `${cun("Day")} ${dayNo}`);
    const posted = postDay();
    const place = posted >= 1 ? DAYS[posted - 1] : null;
    if (!place) { setHTML(where, ""); return; }
    const leg = place.split(" to ");
    setHTML(where, leg.length === 2
      ? `${cun("Arion")} is currently on the road from ${leg[0]} to ${leg[1]}`
      : `${cun("Arion")} is currently in ${place}`);
  }
  // Each paper holds exactly one line. If a line is wider than the card, shrink that paper's text
  // (and its padding, which is measured in em) just enough to fit. Rerun when the window or the words change.
  // Then, where the tablet bites into the card, check that the papers end above the space kept for the tablet;
  // if they reach into it, shrink every paper by the same amount so the last line still shows.
  function fitPapers() {
    const top = $(".stone-top"), card = $(".card-stone");
    const room = top.clientWidth;
    if (!room) return;
    const papers = $$(".card-stone .paper").filter(el => !el.hidden);
    $$(".card-stone .paper").forEach(el => { el.style.fontSize = ""; el.style.marginTop = ""; el.classList.remove("wrap"); });
    const MIN = 13;   // never smaller than 13px; a line that cannot fit at 13px wraps onto two lines instead
    const size = (el, px) => {
      el.style.fontSize = Math.max(MIN, px) + "px";
      el.classList.toggle("wrap", px < MIN);
    };
    // width: offsetLeft and offsetWidth ignore the load animation's transforms, so they measure the resting layout
    // a paper that is too wide for its place first moves left (never past its own left start of 0),
    // and only shrinks its text if it still does not fit
    papers.forEach(el => {
      el.style.marginLeft = "";
      if (el.offsetLeft > 0 && el.offsetLeft + el.offsetWidth > room) el.style.marginLeft = Math.max(0, room - el.offsetWidth) + "px";
      const free = room - Math.max(0, el.offsetLeft);
      if (el.offsetWidth > free) size(el, parseFloat(getComputedStyle(el).fontSize) * free / el.offsetWidth * .98);
    });
    // height: only on the wide layout, where the card has a fixed height and the tablet sits in its bottom
    const cs = getComputedStyle(card);
    if (cs.position !== "absolute") return;
    // When the papers are too tall, take the space from these in order, so the day line and the place line
    // keep the size that fills the card's width for as long as possible:
    //   1. the spaces between the papers, down to 4px each
    //   2. the title, the date and the countdown, down to the size of the two long lines (the title to 1.4 times it)
    //   3. only then every paper
    const long = papers.filter(el => el.matches(".journey, .where"));
    const others = papers.filter(el => !long.includes(el));
    const px = el => parseFloat(getComputedStyle(el).fontSize);
    const longSize = long.length ? Math.max(...long.map(px)) : 0;
    const floor = el => el.matches("h1") ? longSize * 1.4 : longSize;
    const avail = card.clientHeight - parseFloat(cs.paddingBottom) - top.offsetTop;
    const over = () => { const last = papers[papers.length - 1]; return last.offsetTop + last.offsetHeight - avail; };
    let extra = over();
    if (extra > 0) {
      const gaps = papers.slice(1).map(el => parseFloat(getComputedStyle(el).marginTop));
      const spare = gaps.reduce((a, g) => a + Math.max(0, g - 4), 0);
      const f = spare ? Math.min(1, extra / spare) : 0;
      papers.slice(1).forEach((el, i) => { el.style.marginTop = (gaps[i] - Math.max(0, gaps[i] - 4) * f) + "px"; });
    }
    for (let i = 0; i < 30 && (extra = over()) > 0; i++) {
      const shrinkable = others.filter(el => px(el) > floor(el) + .5);
      const group = shrinkable.length ? shrinkable : papers.filter(el => !el.classList.contains("wrap"));
      group.forEach(el => size(el, shrinkable.length ? Math.max(floor(el), px(el) * .96) : px(el) * .96));
      if (!shrinkable.length && group.every(el => px(el) <= MIN)) break;
    }
  }
  const setDateAndFit = () => { setDate(); fitPapers(); };
  setDateAndFit();
  setInterval(setDateAndFit, 60e3);
  addEventListener("resize", fitPapers);
  addEventListener("load", fitPapers);
  // measure again whenever a font finishes loading (a line measured in the stand-in font is the wrong width)
  // and whenever the card's width changes for any reason, not only when the window is resized
  if (document.fonts) { document.fonts.ready.then(fitPapers); document.fonts.addEventListener("loadingdone", fitPapers); }
  let fitWidth = 0;
  new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w !== fitWidth) { fitWidth = w; fitPapers(); } }).observe($(".stone-top"));

  // Countdown to the next post at 22:00 UTC. Hidden once the last written day is already posted.
  function setCountdown() {
    const line = $("#countdownLine");
    const wasHidden = line.hidden;
    line.hidden = postDay() >= DAYS.length;
    if (line.hidden) { if (!wasHidden) fitPapers(); return; }
    const now = new Date();
    let next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22);
    if (next <= now.getTime()) next += 864e5;
    const s = Math.ceil((next - now.getTime()) / 1e3);
    const two = n => String(n).padStart(2, "0");
    $("#countdown").textContent = `${Math.floor(s / 3600)}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`;
    if (wasHidden) fitPapers();   // the first time the countdown shows, fit it with its numbers in place
    if (s <= 1) setTimeout(setDateAndFit, 1500);   // show the new place as soon as the post is up
  }
  setCountdown();
  setInterval(setCountdown, 1e3);

  /* ---------------- flicker between two versions of the same words */

  function flicker(el, on) {
    if (reduce) { el.classList.toggle("alt-on", on); return; }
    el.classList.add("glitch");
    [0, 70, 130, 210, 260, 380, 440].forEach((t, i) =>
      setTimeout(() => el.classList.toggle("alt-on", i % 2 === 0 ? on : !on), t));
    setTimeout(() => el.classList.remove("glitch"), 520);
  }
  // Travel Journal: ten seconds in Dari, ten seconds in English
  const journal = $("#journalSwap");
  let dari = false;
  setInterval(() => { dari = !dari; flicker(journal, dari); }, 10e3);
  // One word at a time switches to Old Persian cuneiform at uneven times, like a failing signal.
  // Each time a different word is picked at random from every word marked data-cun.
  // Each switch is a random burst of blinks, and the waits between switches are random too.
  const rand = (a, b) => a + Math.random() * (b - a);
  function flickerRandom(el, on) {
    if (reduce) { el.classList.toggle("alt-on", on); return; }
    el.classList.add("glitch");
    const blinks = 2 * Math.floor(rand(1, 5)) + 1;          // an odd number, so it ends on the new state
    let t = 0;
    for (let i = 0; i < blinks; i++) {
      setTimeout(() => el.classList.toggle("alt-on", i % 2 === 0 ? on : !on), t);
      t += rand(25, i > blinks - 3 ? 260 : 140);              // the last blinks can hang a little longer
    }
    setTimeout(() => el.classList.remove("glitch"), t + 60);
  }
  let lastWord = null;
  function empireCycle() {
    setTimeout(() => {
      const pool = $$("[data-cun]").filter(el => el.offsetParent !== null && el !== lastWord);
      const empire = lastWord = pool[Math.floor(Math.random() * pool.length)] || $("#empireSwap");
      flickerRandom(empire, true);
      // sometimes a brief false start back to English partway through
      if (Math.random() < .4) setTimeout(() => { flickerRandom(empire, false); setTimeout(() => flickerRandom(empire, true), rand(150, 600)); }, rand(1200, 3000));
      setTimeout(() => { flickerRandom(empire, false); empireCycle(); }, rand(5500, 8500));
    }, rand(8000, 20000));
  }
  empireCycle();

  /* ---------------- the cuneiform on the Darius picture, typed line by line */

  // each line of writing in tablet-text-gold.png (1100 px wide): top, bottom, first ink, last ink, in image pixels
  const LINES = [[0,60,4,1086],[60,110,0,1094],[110,156,1,1094],[156,204,19,1084],[204,256,10,1084],[256,310,0,1086],[310,353,3,1061],[353,398,14,1067],[398,454,0,1089],[454,547,0,1095],[547,619,504,665],[619,683,443,749],[683,733,373,790],[733,810,258,841],[810,865,200,891],[865,948,80,1054],[948,1002,69,905],[1002,1080,57,907],[1080,1152,41,908],[1152,1212,43,906],[1212,1273,118,903],[1273,1335,144,894],[1335,1393,210,886],[1393,1446,72,881],[1446,1504,264,835],[1504,1559,211,799],[1559,1605,205,777],[1605,1660,177,797],[1660,1718,157,828],[1718,1777,71,837],[1777,1833,3,837],[1833,1905,19,837],[1905,1979,7,1049],[1979,2038,9,1095],[2038,2111,0,1080],[2111,2172,221,1069],[2172,2228,266,1097],[2228,2288,260,1100],[2288,2368,338,1100]];
  const W = 1100, SIGN = 38, PER_SIGN = 34, RETURN = 140;
  const gold = $("#tabletGold");
  // the lower block of writing (from line 11 down) is pushed to the right edge of the panel,
  // so the word Sources stays readable; its widest lines end at about pixel 908 of 1100
  const SHIFT_FROM = 10, SHIFT = (1100 - 908) / 1100 * 100;
  const lineEls = LINES.map(([y0, y1], i) => {
    const el = document.createElement("div");
    el.className = "type-line";
    if (i >= SHIFT_FROM) el.style.translate = `calc(${SHIFT.toFixed(2)} * 1cqw) 0`;
    el.style.top = `calc(${(y0 / W * 100).toFixed(4)} * 1cqw)`;
    el.style.height = `calc(${((y1 - y0) / W * 100).toFixed(4)} * 1cqw)`;
    el.style.backgroundPosition = `0 calc(${(-y0 / W * 100).toFixed(4)} * 1cqw)`;
    if (!reduce) el.style.clipPath = "inset(0 100% 0 0)";
    gold.appendChild(el);
    return el;
  });
  function typeCuneiform() {
    if (reduce) return;
    let t = 500;
    LINES.forEach(([, , x0, x1], i) => {
      const signs = Math.max(2, Math.round((x1 - x0) / SIGN));
      const dur = signs * PER_SIGN;
      lineEls[i].animate(
        [{ clipPath: `inset(0 ${(100 - x0 / W * 100).toFixed(2)}% 0 0)` }, { clipPath: "inset(0 0% 0 0)" }],
        { duration: dur, delay: t, easing: `steps(${signs}, jump-start)`, fill: "both" });
      t += dur + RETURN;
    });
  }

  /* ---------------- intro */

  // the round back button on maps.html comes here as index.html#close: show the maps page in the frame,
  // with the cover's pieces already in place but hidden, and then close the cover over it (see the end of this file)
  const returning = location.hash === "#close";
  if (returning) {
    history.replaceState(null, "", location.pathname);
    document.body.classList.add("map-open", "returning");
    frame.src = frame.dataset.src;
    frame.style.opacity = "1";
    cover.classList.add("instant", "ready");
  }

  let typed = false;
  const start = () => {
    if (returning) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cover.classList.add("ready", "drawing");
      if (!typed) { typed = true; typeCuneiform(); }
      setTimeout(() => cover.classList.remove("drawing"), 4200);
    }));
  };
  const lines = new Image();
  lines.src = "assets/disk-ink.png";
  (lines.decode ? lines.decode() : Promise.resolve()).catch(() => {}).then(() => document.fonts.ready).then(start);
  setTimeout(() => cover.classList.contains("ready") || start(), 1800);

  // load the route map behind the cover once the cover has drawn
  const loadMap = () => { if (!frame.src) frame.src = frame.dataset.src; };
  addEventListener("load", () => setTimeout(loadMap, 2600));

  // the About page loads in a second frame behind the cover a little later, so clicking the card does not
  // have to wait for it (loading it at the click froze the page for most of a second)
  const pageFrames = new Map();
  const loadPage = href => {
    if (!pageFrames.has(href)) {
      const f = document.createElement("iframe");
      f.className = "map-frame";
      f.title = "Next page";
      f.tabIndex = -1;
      f.setAttribute("aria-hidden", "true");
      f.src = href;
      f.style.opacity = ".01";        // drawn already, under the dark sheet, so showing it costs nothing
      frame.after(f);
      pageFrames.set(href, f);
    }
    return pageFrames.get(href);
  };
  addEventListener("load", () => setTimeout(() => $$(".card-paper, .card-rust, .photo-fog").forEach(c => c.getAttribute("href") !== mapFrame.dataset.src && loadPage(c.getAttribute("href"))), 4200));

  const fig = $(".photo-darius"), notch = $(".notch");

  // wide layout: cut the paper card's corner out of the Darius photograph, with rounded corners
  // where the photograph turns around it
  const photo = $(".photo-darius > .panel-fill");
  function cutCorner() {
    const W = photo.offsetWidth, H = photo.offsetHeight, nw = notch.offsetWidth, nh = notch.offsetHeight;
    if (nw >= W - 1) { photo.style.clipPath = ""; return; }   // phone layout: the card sits above the photograph
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;width:var(--r);height:var(--gap);visibility:hidden";
    fig.appendChild(probe);
    const r = probe.offsetWidth, g = probe.offsetHeight, R = r + g;
    probe.remove();
    const x = W - nw;
    photo.style.clipPath = `path("M0 ${r}A${r} ${r} 0 0 1 ${r} 0H${x - r}A${r} ${r} 0 0 1 ${x} ${r}V${nh - R}` +
      `A${R} ${R} 0 0 0 ${x + R} ${nh}H${W - r}A${r} ${r} 0 0 1 ${W} ${nh + r}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}` +
      `H${r}A${r} ${r} 0 0 1 0 ${H - r}Z")`;
  }
  new ResizeObserver(cutCorner).observe(fig);
  new ResizeObserver(cutCorner).observe(notch);

  /* ---------------- opening: each piece of the cover leaves on its own path */

  let busy = false;
  let outAnims = [];

  // a dark sheet between the map and the cover, so the gaps between cards stay dark until the cards leave
  const veil = document.createElement("div");
  veil.className = "veil";
  cover.before(veil);

  // where each piece goes: a direction (x, y), a tilt, and when it starts
  const PIECES = [
    { sel: ".notch",         dir: [1, -1],    rot: 0,  delay: 90 },
    { sel: ".card-stone",    dir: [0, -1],    rot: 0,  delay: 220 },
    { sel: ".card-rust",     dir: [-1, -1],   rot: 0,  delay: 260 },
    { sel: ".photo-darius",  dir: [1, .18],   rot: 0,  delay: 330 },
    { sel: ".photo-fog",     dir: [-1, .18],  rot: 0,  delay: 380 },
  ];
  const MARGIN = 80;

  // the distance that takes a piece fully off the screen in its direction
  function offscreen(el, [dx, dy]) {
    const r = el.getBoundingClientRect();
    let tx = dx < 0 ? -(r.right + MARGIN) : dx > 0 ? innerWidth - r.left + MARGIN : 0;
    let ty = dy <= -1 ? -(r.bottom + MARGIN) : dy >= 1 ? innerHeight - r.top + MARGIN : 0;
    if (Math.abs(dy) < 1 && dx) ty = dy * Math.abs(tx);
    if (Math.abs(dx) < 1 && dy && !tx) tx = dx * Math.abs(ty);
    return [Math.round(tx), Math.round(ty)];
  }

  function diskPath() {
    const r = disk.getBoundingClientRect();
    return innerHeight - r.top + MARGIN;           // rolls down and away
  }

  // hovering the disk: it turns a little and the cards part, so the map shows through the gaps
  const PEEK = 40;                 // how far every piece moves, in pixels, in its own direction
  function peek(on) {
    if (busy || reduce || document.body.classList.contains("map-open")) return;
    if (on) loadMap();
    disk.classList.toggle("peek", on);
    frame.style.opacity = on ? "1" : "";
    veil.style.transition = "opacity .7s ease";
    veil.style.opacity = on ? ".2" : "";
    PIECES.forEach((p, i) => {
      const el = $(p.sel), [dx, dy] = p.dir;
      el.style.transition = "transform .8s cubic-bezier(.22, .8, .2, 1)";
      el.style.transform = on
        ? `translate(${Math.round(dx * PEEK)}px, ${Math.round(dy * PEEK)}px) scale(.99)`
        : "";
    });
  }
  function clearPeek() {
    disk.classList.remove("peek");
    veil.style.transition = ""; veil.style.opacity = "";
    for (const p of PIECES) { const el = $(p.sel); el.style.transition = "none"; el.style.transform = ""; }
  }

  // opening from the disk: the disk turns, then the cover opens onto the maps page
  function openMap() {
    if (busy || document.body.classList.contains("map-open")) return;
    loadMap();
    disk.classList.add("turning");
    outAnims = [];
    openCover(true, 420);
  }

  // opening from a card: the card goes backwards and the cover opens at the same time,
  // the way it does for the disk, but the disk slides straight down without turning
  function openFromCard(card) {
    if (busy || document.body.classList.contains("map-open")) return;
    const href = card.getAttribute("href");
    frame.style.opacity = "";
    if (href === mapFrame.dataset.src) { frame = mapFrame; loadMap(); } else frame = loadPage(href);
    outAnims = [];
    if (!reduce) {
      outAnims.push(card.animate([
        { scale: getComputedStyle(card).scale, filter: "brightness(1)" },
        { scale: ".6", filter: "brightness(.45)" },
      ], { duration: 980, easing: "cubic-bezier(.3, 0, .2, 1)", fill: "forwards" }));   // the same timing as its flight
    }
    openCover(false, 0, PIECES.find(p => card.closest(p.sel)).sel);
  }

  // turn: whether the disk spins as it leaves. wait: how long the cards wait before they leave
  // clicked: the piece that was clicked, which shrinks and flies in one movement, starting at once
  function openCover(turn, wait, clicked) {
    busy = true;
    show(null);
    frame.style.opacity = "1";

    if (reduce) {
      outAnims = [cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }),
                  veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" })];
      outAnims[0].finished.then(finishOpen);
      return;
    }

    // 1. the tablet turns a quarter like a dial, then rolls away downward,
    //    or, when a card was clicked, it only slides down and away
    const down = diskPath();
    outAnims.push(turn
      ? disk.animate([
          { transform: "translateY(0) rotate(0deg) scale(1)" },
          { transform: "translateY(-6px) rotate(-90deg) scale(1.035)", offset: .42, easing: "cubic-bezier(.5, 0, .75, 0)" },
          { transform: `translateY(${down}px) rotate(-250deg) scale(1)` },
        ], { duration: 1350, easing: "cubic-bezier(.65, 0, .35, 1)", fill: "forwards" })
      : disk.animate([
          { transform: "translateY(0)" },
          { transform: "translateY(-8px)", offset: .2, easing: "cubic-bezier(.55, 0, .8, .2)" },
          { transform: `translateY(${down}px)` },
        ], { duration: 1050, delay: 200, easing: "cubic-bezier(.3, 0, .2, 1)", fill: "forwards" }));

    // 2. the cards leave one after another, each in its own direction, with a small wind-up first
    for (const p of PIECES) {
      const el = $(p.sel);
      const [tx, ty] = offscreen(el, p.dir);
      const from = el.style.transform || "translate(0px, 0px) rotate(0deg) scale(1)";
      const now = p.sel === clicked;
      const keys = [
        { transform: from },
        ...(now ? [] : [{ transform: `translate(${-tx * .012}px, ${-ty * .012}px) rotate(${-p.rot * .1}deg) scale(.985)`, offset: .22, easing: "cubic-bezier(.55, 0, .8, .2)" }]),
        { transform: `translate(${tx}px, ${ty}px) rotate(${p.rot}deg) scale(.94)` },
      ];
      const opts = { duration: 980, delay: now ? 0 : p.delay + wait, easing: "cubic-bezier(.3, 0, .2, 1)", fill: "forwards" };
      outAnims.push(el.animate(keys, opts));
    }

    // 3. the dark sheet lifts and the map comes forward from behind
    outAnims.push(veil.animate([{ opacity: getComputedStyle(veil).opacity }, { opacity: 0 }],
      { duration: 900, delay: 700, easing: "ease-out", fill: "forwards" }));
    frame.animate(
      [{ transform: "scale(.93)", filter: "brightness(.45)" }, { transform: "scale(1)", filter: "brightness(1)" }],
      { duration: 1250, delay: 650, easing: "cubic-bezier(.2, .7, .2, 1)", fill: "backwards" });

    Promise.all(outAnims.map(a => a.finished)).then(finishOpen);
  }

  function finishOpen() {
    clearPeek();
    document.body.classList.add("map-open");
    disk.classList.remove("turning");
    frame.removeAttribute("aria-hidden");
    frame.removeAttribute("tabindex");
    frame.focus({ preventScroll: true });
    // the maps page is already loaded in the frame, so keep it and only change the address to maps.html,
    // rather than loading the whole map a second time. Other pages still go to the real page.
    if (frame === mapFrame && keepMapFrame()) { busy = false; return; }
    location.href = frame.src;
  }

  const coverTitle = document.title;
  function keepMapFrame() {
    // opened from a file, the browser will not change the address to another file, so add #map instead
    try { history.pushState({ map: true }, "", frame.dataset.src); }
    catch (e) { history.pushState({ map: true }, "", "#map"); }
    document.title = "Crossing Persia: Maps";
    // the Journal and About pages wait in frames on top of the map frame; move them out of the way
    pageFrames.forEach(f => { f.style.display = "none"; });
    return true;
  }
  // the round back button on the maps page, when it is shown here in the frame, sends this message
  // (maps.js); going back in history closes the cover over the map
  addEventListener("message", e => {
    if (e.data === "close-map" && e.source === mapFrame.contentWindow &&
        document.body.classList.contains("map-open")) history.back();
  });

  function closeMap() {
    if (busy || !document.body.classList.contains("map-open")) return;
    busy = true;
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("tabindex", "-1");
    document.body.classList.remove("map-open");     // the cover is visible again, its pieces still off screen

    outAnims.forEach(a => a.cancel());              // same task, so nothing is painted in between
    outAnims = [];
    const back = [];
    if (reduce) {
      back.push(cover.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: "forwards" }),
                veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: "forwards" }));
    } else {
      // the dark sheet returns, then the pieces fly home in the opposite order, the tablet last
      back.push(veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: "ease-in", fill: "forwards" }));
      const order = [...PIECES].reverse();
      order.forEach((p, i) => {
        const el = $(p.sel);
        const [tx, ty] = offscreen(el, p.dir);
        back.push(el.animate([
          { transform: `translate(${tx}px, ${ty}px) rotate(${p.rot}deg) scale(.94)` },
          { transform: "translate(0, 0) rotate(0deg) scale(1)" },
        ], { duration: 900, delay: 120 + i * 70, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "backwards" }));
      });
      const down = diskPath();
      back.push(disk.animate([
        { transform: `translateY(${down}px) rotate(-250deg)` },
        { transform: "translateY(0) rotate(0deg)" },
      ], { duration: 1150, delay: 380, easing: "cubic-bezier(.16, 1, .3, 1)", fill: "backwards" }));
    }
    Promise.all(back.map(a => a.finished)).then(() => {
      back.forEach(a => a.cancel());
      frame.style.opacity = "";
      busy = false;
    });
  }

  disk.addEventListener("click", openMap);
  // a plain click on these cards opens the cover onto their page; a click with Ctrl, Shift or the middle button
  // still opens a new tab as usual
  $$(".card-paper, .card-rust, .photo-fog").forEach(card => card.addEventListener("click", e => {
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openFromCard(card);
  }));
  disk.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openMap(); }
  });
  addEventListener("popstate", () => {
    const atMap = location.pathname.endsWith("/" + mapFrame.dataset.src) || location.hash === "#map";
    if (document.body.classList.contains("map-open") && !atMap) {
      document.title = coverTitle;
      pageFrames.forEach(f => { f.style.display = ""; });
      closeMap();
    }
    else if (atMap && !document.body.classList.contains("map-open")) location.replace(mapFrame.dataset.src);   // the Forward button
  });
  // reloading at index.html#map: show the maps page itself
  if (location.hash === "#map") location.replace(mapFrame.dataset.src);
  // coming back from maps.html with the Back button: the browser may restore this page as it was left, opened,
  // so start the cover again from the beginning
  addEventListener("pageshow", e => { if (e.persisted) location.reload(); });

  // returning from maps.html: once the maps page has drawn in the frame, play the opening backwards
  if (returning) {
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        cover.classList.remove("instant");
        document.body.classList.remove("returning");
        closeMap();
        if (!typed) { typed = true; setTimeout(typeCuneiform, 900); }
      }));
    };
    // decode the cover's photographs first, or the page stalls while it decodes them and the cards jump into place
    const ready = Promise.all([document.fonts.ready, ...$$("#cover img").map(i => i.decode().catch(() => {}))]);
    // maps.html turns its layer buttons on once the route map inside it has loaded, so wait for that
    const mapDrawn = () => {
      try { const b = frame.contentDocument.querySelector(".layer-btn[data-layer]"); return b && !b.disabled; }
      catch (e) { return true; }         // the frame cannot be read (opened from a file), so do not wait
    };
    const wait = setInterval(() => {
      if (mapDrawn()) { clearInterval(wait); ready.then(() => setTimeout(close, 400)); }
    }, 100);
    setTimeout(() => ready.then(close), 6000);    // in case the map is slow to load
  }
})();
