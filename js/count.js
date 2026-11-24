/* Counts visits with GoatCounter (www.goatcounter.com): no cookies, nothing personal is kept.
   Every page loads this file. The numbers are at crossingpersia.goatcounter.com.
   An empty ACCOUNT below turns counting off.

   It also counts: a press of the Subscribe button, a click through to Substack, and a reader
   choosing English, Dari or Kurmanji. A link ending in ?utm_campaign=... shows in GoatCounter
   under that campaign. */
(function () {
  var ACCOUNT = "crossingpersia";
  if (!ACCOUNT || !/(^|\.)crossingpersia\.com$/.test(location.hostname)) return;   // off, or opened on this computer
  if (window.top !== window) return;   // the map behind the cover is not a visit of its own

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', 'https://' + ACCOUNT + '.goatcounter.com/count');
  document.head.appendChild(s);

  function event(name) {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true });
  }
  document.addEventListener('submit', function (e) {
    if (e.target.matches('.signup')) event('subscribe-button');
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="crossingpersia.substack.com"]');
    if (a) event('click-to-substack');
    var b = e.target.closest && e.target.closest('.langs button[data-lang]');
    if (b) event('language-' + b.dataset.lang);
  });
})();
