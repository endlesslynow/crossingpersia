/* Crossing Persia, one week's summary video: week.html?week=1.
   The video's YouTube link comes from data/videos.js. A week whose last day has not come yet,
   or whose video is not listed, sends the reader to the Travel Journal instead. */
(() => {
  const week = parseInt(new URLSearchParams(location.search).get("week"), 10);

  // Today's day of the journey, worked out as on the cover and the Travel Journal: by the UTC date 22 hours ago,
  // so a new day starts at 22:00 UTC, with 17 November 2026 as Day 1. The video comes out with the week's last day.
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  const parts = fmt.formatToParts(new Date(Date.now() - 22 * 3600e3));
  const get = t => +parts.find(x => x.type === t).value;
  const today = Math.round((Date.UTC(get("year"), get("month") - 1, get("day")) - Date.UTC(2026, 10, 17)) / 864e5) + 1;

  const link = (window.WEEK_VIDEOS || {})[week];
  // the video's id, from any usual form of YouTube link: youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID
  const id = link && (link.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([\w-]{11})/) || [])[1];
  if (!week || !id || today < week * 7) { location.replace("journal.html"); return; }

  const name = `Week ${week} Summary Video`;
  document.title = `Crossing Persia: ${name}`;
  document.getElementById("title").textContent = name;
  // the same colour as the week's card on the Travel Journal: weeks 1, 3, 5 ... orange, weeks 2, 4, 6 ... pink
  if (week % 2 === 0) document.getElementById("bar").classList.add("pink");

  const frame = document.createElement("iframe");
  frame.src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`;
  frame.title = name;
  frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  frame.allowFullscreen = true;
  document.getElementById("player").appendChild(frame);
})();
