/* Crossing Persia, the Travel Journal page.

   THE LAYOUT IS FINISHED AND APPROVED (19 November 2026). Read tools/JOURNAL-LAYOUT.md in the website folder before changing it.

   One group of eight cards per week: seven days and the week's summary video, always in the bottom right.
   The summary card opens week.html?week=N, which shows only that week's video; the links are in data/videos.js.
   The weeks repeat in a cycle of four, forever:
     week 1, 5, 9 ...   arrangement A
     week 2, 6, 10 ...  arrangement B
     week 3, 7, 11 ...  arrangement A turned upside down
     week 4, 8, 12 ...  arrangement B turned upside down
   To add a day, add its line to DAYS below; the right week and card are worked out automatically.
   A week with no articles yet shows placeholder pictures taken from week 1 or week 2.
   Each day card opens its article, day.html?day=N. To send a day somewhere else, add href: "..." to its entry in DAYS. */

(() => {
  // the article pictures, copied into pictures/ by tools/make_articles.py.
  // crop is the part of the picture a card shows, as [left, top, width, height], each a fraction of the whole picture.
  // It is drawn entirely inside the object so no background shows. Pictures without a crop simply fill their card.
  // tint is the average colour of the part of the picture the card shows; it is laid over the picture as a light wash.
  const PICS = "pictures/";
  const DAYS = [
    { pic: "w01-day-1-silver-owl.jpg", tint: "#696361", crop: [0.1533, 0.2267, 0.64, 0.64] },
    { pic: "w01-day-2-eleusis-plaque.jpg", tint: "#655449", crop: [0.575, 0.2, 0.232, 0.56] },
    { pic: "w01-day-3-ploughing-cup.jpg", tint: "#6b492d", crop: [0.38, 0.16, 0.36, 0.72] },
    { pic: "w01-day-4-olive-gathering.jpg", tint: "#d98429", crop: [0.03, 0.38, 0.9, 0.2316] },
    { pic: "w01-day-5-cithaeron-south-east.jpg", tint: "#212f37" },
    { pic: "w01-day-6-cithaeron-from-erythres.jpg", tint: "#4f7da4" },
    { pic: "w01-day-7-corinthian-aryballos.jpg", tint: "#66584b", crop: [0.25, 0.28, 0.5, 0.333] },
    { pic: "w02-day-8-asopos.jpg", tint: "#988f7a" },
    { pic: "w02-day-9-theban-stater.jpg", tint: "#898987", crop: [0.5233, 0.2273, 0.4267, 0.5779] },
    { pic: "w02-day-10-kneading-figurine.jpg", tint: "#6e6352", crop: [0.5967, 0.1506, 0.3133, 0.8313] },
    { pic: "w02-day-11-helikon.jpg", tint: "#8ea0ab" },
    { pic: "w02-day-12-bird-jug.jpg", tint: "#9a7a5e", crop: [0.2, 0.66, 0.6, 0.183] },
    { pic: "w02-day-13-copais-rottmann.jpg", tint: "#908176" },
    { pic: "w02-day-14-thebes-figurines.jpg", tint: "#a28c7b", crop: [0.535, 0.165, 0.25, 0.1664] },
    { pic: "w03-day-15-athena-lekanis.jpg", tint: "#755b4b", crop: [0.234, 0.17, 0.45, 0.63] },
    { pic: "w03-day-16-trophonios-springs.jpg", tint: "#666851" },
    { pic: "w03-day-17-chaeronea-plain.jpg", tint: "#9b9f98" },
    { pic: "w03-day-18-panopeus-view.jpg", tint: "#6f756a" },
    { pic: "w03-day-19-parnassus.jpg", tint: "#6f747e" },
    { pic: "w03-day-20-apollo-marble-torsos.jpg", tint: "#646b72", crop: [0.03, 0.38, 0.94, 0.21] },
    { pic: "w03-day-21-kleobis-biton.jpg", tint: "#9a8577", crop: [0.64, 0.05, 0.22, 0.32] },
  ];

  /* Each arrangement fills two square halves. Slot letters match the shapes in journal.css.
     Slots are listed column by column, so Day 1 comes first. "s" is the week summary. */
  const LAYOUTS = {
    A: [["a", "b", "c", "d"], ["e", "g", "f", "h"]],
    B: [["i", "l", "j", "k"], ["m", "o", "n", "p"]],
  };
  // The order the days run in, column by column as the reader sees them.
  // A turned-over week is the same layout rotated half a turn, so its days run in the reverse spots.
  // The summary always stays in the bottom right: in a turned-over week that is the card that started in the top left,
  // and the day that card would have held moves to the top left spot instead.
  const ORDER = {
    A: ["a", "b", "c", "d", "e", "g", "f"],
    B: ["i", "l", "j", "k", "m", "o", "n"],
    Aflip: ["h", "f", "g", "e", "d", "c", "b"],
    Bflip: ["p", "n", "o", "m", "k", "j", "l"],
  };
  const SUMMARY = { A: "h", B: "p", Aflip: "a", Bflip: "i" };
  const SUMMARY_COLOUR = { A: "var(--orange)", B: "var(--pink)" };
  // Today's day of the journey, worked out the same way as on the cover: by the UTC date 22 hours ago, so a new day starts at 22:00 UTC,
  // with 17 November 2026 as Day 1. Cards for days after today are hidden; their spots stay empty.
  const dcFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  function dayNumber() {
    const parts = dcFormat.formatToParts(new Date(Date.now() - 22 * 3600e3));
    const get = t => +parts.find(x => x.type === t).value;
    return Math.round((Date.UTC(get("year"), get("month") - 1, get("day")) - Date.UTC(2026, 10, 17)) / 864e5) + 1;
  }
  const TODAY = dayNumber();

  // The four-week cycle. The page shows the weeks up to and including the current one, and nothing after it.
  // In a turned-over week with no articles yet, each card keeps the week 1 or week 2 picture it had before turning.
  const CYCLE = [{ key: "A" }, { key: "B" }, { key: "A", flip: true }, { key: "B", flip: true }];
  const weekCount = Math.max(1, Math.ceil(TODAY / 7));
  const WEEKS = Array.from({ length: weekCount }, (_, i) => CYCLE[i % 4]);

  // A crop is shrunk to the card's shape (never widened), keeping the picture's true proportions,
  // so it always stays inside the object and the picture is never stretched.
  const cropStyle = c => c ? ` class="cropped" data-crop="${c.join(",")}"` : "";
  function place(img) {
    const [x, y, w, h] = img.dataset.crop.split(",").map(Number);
    const card = img.parentElement, a = card.offsetWidth / card.offsetHeight;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !a) return;
    let cx = x, cy = y, cw = w, ch = h;
    const ra = (w * nw) / (h * nh);
    if (ra > a) { cw = (h * nh * a) / nw; cx = x + (w - cw) / 2; }   // crop too wide for the card: trim the sides
    else { ch = (w * nw) / (a * nh); cy = y + (h - ch) / 2; }         // crop too tall: trim top and bottom
    Object.assign(img.style, { width: 100 / cw + "%", height: 100 / ch + "%", left: -100 * cx / cw + "%", top: -100 * cy / ch + "%" });
    img.classList.add("placed");
  }

  // Every label switches between English and Dari, like Travel Journal on the cover.
  const faDigits = n => String(n).replace(/\d/g, x => "۰۱۲۳۴۵۶۷۸۹"[x]);
  const swap = (en, fa) => `<span class="swap-stack"><span class="main">${en}</span><span class="alt dari" lang="prs" dir="rtl">${fa}</span></span>`;
  const label = n => swap(`Day ${n}`, `\u0631\u0648\u0632 ${faDigits(n)}`);

  const journal = document.getElementById("journal");
  // the picture each card shape carries in the first two weeks, used again when the week is turned over
  const slotPic = {};
  for (const k of ["A", "B"]) ORDER[k].forEach((slot, i) => { slotPic[slot] = DAYS[(k === "A" ? 0 : 7) + i]; });
  slotPic.h = slotPic.a; slotPic.p = slotPic.i;   // the summary's old spot takes the picture of the card the summary moved into
  let html = "";
  WEEKS.forEach(({ key, flip }, wi) => {
    const w = wi + 1, first = wi * 7 + 1;
    const kind = key + (flip ? "flip" : "");
    const order = ORDER[kind];
    html += `<section class="week${flip ? " flip" : ""}" aria-label="Week ${w}">`;
    for (const half of LAYOUTS[key]) {
      html += `<div class="half">`;
      for (const slot of half) {
        if (slot === SUMMARY[kind]) {
          if (TODAY < first + 6) continue;          // the summary is hidden until the last day of its week
          // a button to the week's video once its link is in data/videos.js; until then a plain card with the same words
          const video = (window.WEEK_VIDEOS || {})[w];
          const tag = video ? `a href="week.html?week=${w}"` : "div";
          html += `<${tag} class="card summary s-${slot}" style="background:${SUMMARY_COLOUR[key]}"><span class="sum-title">Week ${w} Summary Video</span></${video ? "a" : "div"}>`;
          continue;
        }
        const n = first + order.indexOf(slot);
        if (n > TODAY) continue;                    // a day that has not happened yet: its card is hidden
        const real = DAYS[n - 1];                 // the day's own article, once it exists
        const d = real || slotPic[slot];           // otherwise a placeholder picture that fits this card
        const href = real ? (real.href || `day.html?day=${n}`) : null;   // each day opens its article page, day.html
        const tag = href ? `a href="${href}"` : "div";
        html += `<${tag} class="card day s-${slot}">
            <span class="pic"><img src="${encodeURI(PICS + d.pic)}" alt="" decoding="async"${cropStyle(d.crop)}>
            <span class="tint" style="background:${d.tint}"></span></span>
            <span class="badge">${label(n)}</span>
          </${href ? "a" : "div"}>`;
      }
      html += `</div>`;
    }
    html += `</section>`;
  });
  journal.innerHTML = html;
  journal.querySelectorAll("img.cropped").forEach(img => img.complete ? place(img) : img.addEventListener("load", () => place(img)));

  // the same flicker as Travel Journal on the cover
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function flicker(el, on) {
    if (reduce) { el.classList.toggle("alt-on", on); return; }
    el.classList.add("glitch");
    [0, 70, 130, 210, 260, 380, 440].forEach((t, i) =>
      setTimeout(() => el.classList.toggle("alt-on", i % 2 === 0 ? on : !on), t));
    setTimeout(() => el.classList.remove("glitch"), 520);
  }
  // Each week switches one day at a time: a random day turns to Dari, holds for a few seconds,
  // turns back to English, and after a short pause another random day (never the same one twice running) takes its turn.
  const rand = (a, b) => a + Math.random() * (b - a);
  journal.querySelectorAll(".week").forEach(week => {
    const days = [...week.querySelectorAll(".swap-stack")];
    if (!days.length) return;
    let last = null;
    function turn() {
      let el;
      do { el = days[Math.floor(Math.random() * days.length)]; } while (days.length > 1 && el === last);
      last = el;
      flicker(el, true);
      setTimeout(() => {
        flicker(el, false);
        setTimeout(turn, rand(1500, 4000));
      }, rand(4000, 7000));
    }
    setTimeout(turn, rand(1500, 5000));   // the weeks start at different moments, so they do not switch together
  });

})();
