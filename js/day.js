/* Crossing Persia, one day's article: day.html?day=1

   The picture in its arched frame, the title, and three buttons: English, دری (Dari) and Kurdî.
   English comes from data/articles.js (made by tools/make_articles.py from the Obsidian vault).
   Dari and Kurmanji come from the reader in "The Website/reader": the same reading files,
   with the same slips, copied into reader/ here by tools/make_articles.py. A click on a word shows its sound and meaning; a click on the small
   number after a sentence shows the sentence in English. The Dari version has the reader's
   player for the recording.
   A language whose file is not made yet keeps its button, greyed out. */
(function () {
  'use strict';
  var READER = 'reader/';
  var PICS = 'pictures/';
  var $ = function (id) { return document.getElementById(id); };
  function fa(n) { return String(n).replace(/\d/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'[d]; }); }
  function pad(n) { return ('0' + n).slice(-2); }
  function clean(word) { return word.replace(/[،,.؟?!:;"«»؛()\-–]/g, '').trim(); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Where each picture's object sits, as a fraction across and down, so the wide frame centres on it.
  // Taken from the middle of each day's crop in journal.js. A picture not listed is centred.
  var FOCUS = { 1: [.47, .55], 2: [.69, .48], 3: [.56, .52], 4: [.48, .5], 7: [.5, .45],
                9: [.74, .52], 10: [.75, .57], 12: [.5, .75], 14: [.66, .25] };

  // Today's day of the journey, as on the cover and the journal: the UTC date 22 hours ago, so a new day starts at 22:00 UTC,
  // with 17 November 2026 as Day 1. A day after today is not shown yet.
  function dayNumber() {
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' })
      .formatToParts(new Date(Date.now() - 22 * 3600e3));
    var get = function (t) { return +parts.filter(function (x) { return x.type === t; })[0].value; };
    return Math.round((Date.UTC(get('year'), get('month') - 1, get('day')) - Date.UTC(2026, 10, 17)) / 864e5) + 1;
  }
  var TODAY = dayNumber();
  // a finished page (day-3.html, made by tools/make_day_pages.py when the site is uploaded) names its day; day.html takes it from the address
  var DAY = window.DAY_PAGE || parseInt(new URLSearchParams(location.search).get('day'), 10) || 1;
  var article = window.ARTICLES[DAY];
  if (!article || DAY > TODAY) { location.replace('journal.html'); return; }

  // ---------- for Google and chatbots ----------
  // This day's own address, a summary from its first paragraph, and hidden facts
  // (title, date, picture) that search engines read directly.
  (function () {
    if (window.DAY_PAGE) return;   // a finished day page already has these written in
    var SITE = 'https://www.crossingpersia.com/';
    var url = SITE + 'day-' + DAY + '.html';
    var summary = (article.paragraphs[0] || '').replace(/<[^>]+>/g, '');
    if (summary.length > 160) summary = summary.slice(0, 157).replace(/\s+\S*$/, '') + '…';
    var head = document.head;
    var canon = document.createElement('link');
    canon.rel = 'canonical'; canon.href = url;
    head.appendChild(canon);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && summary) desc.content = summary;
    var published = new Date(Date.UTC(2026, 10, 16 + DAY)).toISOString().slice(0, 10);
    var facts = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Day ' + DAY + ': ' + article.title,
      description: summary,
      url: url,
      datePublished: published,
      inLanguage: 'en',
      isPartOf: { '@type': 'WebSite', name: 'Crossing Persia', url: SITE }
    };
    if (article.pic) facts.image = SITE + encodeURI(PICS + article.pic);
    var ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = JSON.stringify(facts);
    head.appendChild(ld);
  })();

  // ---------- the picture ----------
  // The picture covers the top of the card without stretching, centred on its object.
  (function () {
    var img = $('hero-img'), f = FOCUS[DAY] || [.5, .5];
    img.src = encodeURI(PICS + article.pic);
    img.style.objectPosition = (f[0] * 100) + '% ' + (f[1] * 100) + '%';
    img.alt = article.caption.replace(/<[^>]+>/g, '');
  })();

  // ---------- the title on one line ----------
  // Starts at the biggest size and steps down until the whole title fits the card's width.
  function fitTitle() {
    var t = $('title');
    t.style.fontSize = '';
    var size = parseFloat(getComputedStyle(t).fontSize);
    while (t.scrollWidth > t.clientWidth && size > 16) {
      size -= 1;
      t.style.fontSize = size + 'px';
    }
  }
  window.addEventListener('resize', fitTitle);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);

  // ---------- the reader's files for this day ----------
  var readings = { en: article, fa: null, kmr: null };
  var waiting = 2;
  function load(src, done) {
    var s = document.createElement('script');
    s.src = READER + src;
    s.onload = s.onerror = done;
    document.head.appendChild(s);
  }
  function loaded() {
    if (--waiting) return;
    readings.fa = READINGS.filter(function (r) { return r.id === 'crossing-day-' + pad(DAY); })[0] || null;
    readings.kmr = READINGS.filter(function (r) { return r.id === 'crossing-kmr-day-' + pad(DAY); })[0] || null;
    [].forEach.call(document.querySelectorAll('.langs button'), function (b) {
      var off = !readings[b.dataset.lang];
      b.disabled = off;
      if (off) b.title = 'Not written yet';
    });
    // the language named in the address (day.html?day=1&lang=fa), or the one chosen last time
    var want = new URLSearchParams(location.search).get('lang');
    if (!readings[want]) try { want = localStorage.getItem('crossing-day-lang'); } catch (e) { /* not needed */ }
    show(readings[want] ? want : 'en');
  }
  load('readings/crossing_day_' + pad(DAY) + '.js', loaded);
  load('readings/kurmanji_crossing_day_' + pad(DAY) + '.js', loaded);

  [].forEach.call(document.querySelectorAll('.langs button'), function (b) {
    b.addEventListener('click', function () {
      show(b.dataset.lang);
      try { localStorage.setItem('crossing-day-lang', b.dataset.lang); } catch (e) { /* not needed */ }
    });
  });

  // ---------- one language ----------
  var lang = null, reading = null, sentences = [], slipFor = null;
  function show(which) {
    lang = which;
    reading = which === 'en' ? null : readings[which];
    hideSlip();
    audio.pause();
    [].forEach.call(document.querySelectorAll('.langs button'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.lang === which ? 'true' : 'false');
    });
    var paper = $('paper'), title = $('title'), when = $('when');
    document.body.dataset.lang = which;
    if (which === 'en') {
      title.textContent = article.title;
      title.dir = 'ltr'; title.lang = 'en';
      when.textContent = article.heading;
      when.dir = 'ltr';
      paper.dir = 'ltr'; paper.lang = 'en';
      fillEnglish();
    } else if (which === 'fa') {
      title.textContent = reading.title.words.map(function (w) { return clean(w[0]); }).join(' ');
      title.dir = 'rtl'; title.lang = 'prs';
      // the date of this day, counting from 17 November for Day 1, so Day 15 is 1 December, not 31 November
      var date = new Date(Date.UTC(2026, 10, 16 + DAY));
      var month = ['جنوری', 'فبروری', 'مارچ', 'اپریل', 'می', 'جون', 'جولای', 'اگست', 'سپتمبر', 'اکتوبر', 'نوامبر', 'دسمبر'][date.getUTCMonth()];
      when.textContent = 'روز ' + fa(DAY) + '  •  ' + fa(date.getUTCDate()) + ' ' + month + '، ' + fa(500) + ' پیش از میلاد';
      when.dir = 'rtl';
      paper.dir = 'rtl'; paper.lang = 'fa';
      fillReading();
    } else {
      title.textContent = reading.name;
      title.dir = 'ltr'; title.lang = 'ku';
      // the same date as the other languages, e.g. "Roja 1 · 17ê Mijdarê, 500 berî zayînê"
      var kDate = new Date(Date.UTC(2026, 10, 16 + DAY));
      var kMonth = ['Rêbendanê', 'Reşemiyê', 'Adarê', 'Avrêlê', 'Gulanê', 'Pûşperê', 'Tîrmehê', 'Tebaxê', 'Îlonê', 'Cotmehê', 'Mijdarê', 'Berfanbarê'][kDate.getUTCMonth()];
      when.textContent = 'Roja ' + DAY + ' · ' + kDate.getUTCDate() + 'ê ' + kMonth + ', 500 berî zayînê';
      when.dir = 'ltr';
      paper.dir = 'ltr'; paper.lang = 'kmr';
      fillReading();
    }
    // the browser tab, the same in every language: "Crossing Persia: Day 1"
    document.title = 'Crossing Persia: Day ' + DAY;
    title.dataset.text = title.textContent;
    fitTitle();
    loadSound(which === 'fa' ? reading.audio : null);
  }

  function fillEnglish() {
    var story = $('story');
    story.textContent = '';
    article.paragraphs.forEach(function (text) {
      var p = el('p', 'para');
      p.innerHTML = text;
      story.appendChild(p);
    });
  }

  // the reader's way: every word a button for its slip, a small number after each sentence
  function wordsOf(s, si, into) {
    s.words.forEach(function (w, ti) {
      if (ti) into.appendChild(document.createTextNode(' '));
      var span = el('span', 'w', w[0]);
      span.dataset.s = si;
      span.dataset.t = ti;
      into.appendChild(span);
    });
  }
  function fillReading() {
    var r = reading, story = $('story');
    story.textContent = '';
    sentences = [r.title || { words: [] }];
    r.paragraphs.forEach(function (para) {
      if (para.heading) { story.appendChild(el('h3', 'section', para.heading)); return; }
      if (!Array.isArray(para)) return;
      var p = el('p', 'para');
      para.forEach(function (s, k) {
        var si = sentences.length;
        sentences.push(s);
        if (k) p.appendChild(document.createTextNode(' '));
        wordsOf(s, si, p);
        var end = el('span', 'end'), n = el('button', 'num', r.dir === 'ltr' ? String(si) : fa(si));
        n.type = 'button';
        n.dataset.s = si;
        n.setAttribute('aria-label', 'Sentence ' + si + ' in English');
        end.appendChild(p.lastChild);
        end.appendChild(document.createTextNode(' '));
        end.appendChild(n);
        p.appendChild(end);
      });
      story.appendChild(p);
    });
  }

  // ---------- the slip, as in the reader ----------
  function entryText(entry) { return entry.text || entry.fa; }
  function wordSoundOn() { return reading.showWordSay === true || reading.showSay !== false; }
  function script(e) { e.dir = reading.dir || 'rtl'; e.lang = reading.lang || 'fa'; return e; }
  function ltr(e) { e.dir = 'ltr'; e.lang = 'en'; return e; }
  function hideSlip() {
    $('slip').hidden = true;
    slipFor = null;
    [].forEach.call(document.querySelectorAll('#paper .on, #paper .mate, #paper .lit'), function (e) {
      e.classList.remove('on', 'mate', 'lit');
    });
  }
  function pairLine(entry, say) {
    var d = el('div', 'pair');
    d.dir = 'ltr';
    d.appendChild(script(el('span', 'ph', entryText(entry))));
    if (wordSoundOn()) d.appendChild(el('i', 'ph-say', entry.say || say));
    d.appendChild(el('span', 'eq', '='));
    d.appendChild(el('span', 'en', entry.mean));
    return d;
  }
  function showWord(span) {
    var si = +span.dataset.s, w = sentences[si].words[+span.dataset.t];
    var say = w[1], ids = w.slice(2), slip = $('slip');
    hideSlip();
    slip.textContent = '';
    slip.appendChild(script(el('b', 'slip-word', clean(span.textContent))));
    var own = reading.words[say];
    if (wordSoundOn()) slip.appendChild(ltr(el('i', 'slip-say', own && own.say || say)));
    if (own && ids.indexOf(say) >= 0 && own.spoken && own.spoken !== say) {
      var sp = el('div', 'spoken');
      sp.dir = 'ltr';
      sp.appendChild(el('span', 'tag', 'spoken'));
      sp.appendChild(el('i', null, own.spoken));
      var spFa = el('span', 'sp-fa', own.spokenFa);
      spFa.dir = 'rtl'; spFa.lang = 'fa';
      sp.appendChild(spFa);
      slip.appendChild(sp);
    }
    var mean = ltr(el('div', 'mean'));
    ids.forEach(function (id) {
      var e = reading.words[id];
      if (e) mean.appendChild(id === say ? el('div', 'own', e.mean) : pairLine(e, id));
    });
    slip.appendChild(mean);
    span.classList.add('on');
    var phrases = ids.filter(function (id) { return / /.test(reading.words[id] ? entryText(reading.words[id]) : ''); });
    [].forEach.call(document.querySelectorAll('#paper .w[data-s="' + si + '"]'), function (other) {
      if (other === span) return;
      var theirs = sentences[si].words[+other.dataset.t].slice(2);
      if (phrases.some(function (id) { return theirs.indexOf(id) >= 0; })) other.classList.add('mate');
    });
    place(span);
  }
  function showSentence(btn) {
    var si = +btn.dataset.s, s = sentences[si], slip = $('slip');
    hideSlip();
    slip.textContent = '';
    if (reading.showSay !== false) slip.appendChild(ltr(el('i', 'slip-say', s.say)));
    slip.appendChild(ltr(el('div', 'slip-en', s.mean)));
    btn.classList.add('on');
    [].forEach.call(document.querySelectorAll('#paper .w[data-s="' + si + '"]'), function (w) { w.classList.add('lit'); });
    place(btn);
  }
  // under the word, kept inside the text column; above it when there is no room below
  function place(target) {
    var slip = $('slip'), paper = $('paper');
    slipFor = target;
    slip.style.left = '0px';
    slip.style.top = '0px';
    slip.hidden = false;
    var p = paper.getBoundingClientRect(), t = target.getBoundingClientRect();
    var W = paper.clientWidth, H = paper.clientHeight;
    var left = t.left - p.left + t.width / 2 - slip.offsetWidth / 2;
    left = Math.max(0, Math.min(W - slip.offsetWidth, left));
    var top = t.bottom - p.top + 6;
    if (top + slip.offsetHeight > H) top = t.top - p.top - slip.offsetHeight - 6;
    slip.style.left = left + 'px';
    slip.style.top = top + 'px';
  }
  $('paper').addEventListener('click', function (e) {
    if (!reading) return;
    var target = e.target.closest ? e.target.closest('.w, .num') : null;
    if (!target || $('slip').contains(e.target)) return;
    if (slipFor === target) { hideSlip(); return; }
    if (target.classList.contains('num')) showSentence(target); else showWord(target);
  });
  document.addEventListener('pointerdown', function (e) {
    if ($('slip').hidden || $('slip').contains(e.target)) return;
    if (!(e.target.closest && e.target.closest('#paper .w, #paper .num'))) hideSlip();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideSlip(); });
  window.addEventListener('resize', function () { if (slipFor) place(slipFor); });

  // ---------- the Dari recording, as in the reader ----------
  // The sound comes in a script from the reader's audio folder, holding the mp3 as text.
  var audio = $('audio'), dragging = false, soundTag = null, soundUrl = null, wanted = null;
  function loadSound(path) {
    wanted = path || null;
    audio.pause();
    if (soundTag) { soundTag.remove(); soundTag = null; }
    if (soundUrl) { URL.revokeObjectURL(soundUrl); soundUrl = null; }
    audio.removeAttribute('src');
    audio.load();
    $('player').hidden = true;
    showTime();
    if (!path) return;
    soundTag = document.createElement('script');
    soundTag.src = READER + path;
    document.head.appendChild(soundTag);
  }
  window.READER_SOUND = function (path, text) {
    if (path !== wanted) return;
    var s = atob(text), b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    soundUrl = URL.createObjectURL(new Blob([b], { type: 'audio/mpeg' }));
    audio.src = soundUrl;
    $('download').href = soundUrl;
    $('download').download = 'Crossing Persia - Day ' + DAY + ' - Dari.mp3';
    $('player').hidden = false;
    showTime();
  };

  // the volume, 1 to 10; 7 plays the recording as it is, 10 is 10/7 of that
  var volume = 7, mixer = null, gain = null;
  try { volume = Math.max(1, Math.min(10, Number(localStorage.getItem('chai-reader-volume')) || 7)); } catch (e) { /* not needed */ }
  function mixerOn() {
    if (mixer) { if (mixer.state === 'suspended') mixer.resume(); return; }
    var Mixer = window.AudioContext || window.webkitAudioContext;
    if (!Mixer) return;
    try {
      mixer = new Mixer();
      gain = mixer.createGain();
      var limit = mixer.createDynamicsCompressor();
      limit.threshold.value = -2; limit.knee.value = 0; limit.ratio.value = 20;
      limit.attack.value = 0.002; limit.release.value = 0.1;
      mixer.createMediaElementSource(audio).connect(gain).connect(limit).connect(mixer.destination);
    } catch (e) { mixer = null; gain = null; }
    setVolume(volume);
  }
  for (var n = 1; n <= 10; n++) {
    var step = el('i');
    step.style.height = (5 + n * 1.6) + 'px';
    $('volbars').appendChild(step);
  }
  function setVolume(v) {
    volume = Math.max(1, Math.min(10, v));
    [].forEach.call($('volbars').children, function (e, i) { e.classList.toggle('on', i < volume); });
    $('volnum').textContent = fa(volume);
    $('volume').setAttribute('aria-valuenow', volume);
    $('volume').title = 'صدا ' + fa(volume) + ' از ۱۰ (۷ همان صدای ضبط‌شده است)';
    if (gain) { gain.gain.value = volume / 7; audio.volume = 1; } else audio.volume = Math.min(1, volume / 7);
    try { localStorage.setItem('chai-reader-volume', String(volume)); } catch (e) { /* not needed */ }
  }
  var bars = $('volbars'), sliding = false;
  function stepAt(e) {
    var r = bars.getBoundingClientRect();
    setVolume(Math.ceil(Math.min(1, Math.max(0.01, (e.clientX - r.left) / r.width)) * 10));
  }
  $('volume').addEventListener('pointerdown', function (e) { sliding = true; $('volume').setPointerCapture(e.pointerId); stepAt(e); });
  $('volume').addEventListener('pointermove', function (e) { if (sliding) stepAt(e); });
  $('volume').addEventListener('pointerup', function () { sliding = false; });
  $('volume').addEventListener('wheel', function (e) { e.preventDefault(); setVolume(volume + (e.deltaY < 0 ? 1 : -1)); }, { passive: false });
  $('volume').addEventListener('keydown', function (e) {
    var d = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];
    if (d) { e.preventDefault(); setVolume(volume + d); }
  });
  setVolume(volume);

  function playPause() { mixerOn(); if (audio.paused) audio.play(); else audio.pause(); }
  $('play').addEventListener('click', playPause);
  $('rewind').addEventListener('click', function () { audio.currentTime = Math.max(0, audio.currentTime - 1); showTime(); });
  function soundOn() { return lang === 'fa' && !$('player').hidden; }
  document.addEventListener('keydown', function (e) {
    if (e.key !== ' ' || !soundOn()) return;
    e.preventDefault();
    if (!e.repeat) playPause();
  });
  function clock(t) {
    t = Math.floor(isFinite(t) ? t : 0);
    return fa(Math.floor(t / 60) + ':' + ('0' + t % 60).slice(-2));
  }
  function showTime() {
    var d = audio.duration;
    $('track-fill').style.width = (d ? audio.currentTime / d * 100 : 0) + '%';
    $('clock').textContent = clock(audio.currentTime) + ' / ' + clock(d);
  }
  audio.addEventListener('timeupdate', showTime);
  audio.addEventListener('loadedmetadata', showTime);
  audio.addEventListener('play', function () { $('player').classList.add('playing'); });
  audio.addEventListener('pause', function () { $('player').classList.remove('playing'); });
  function seek(e) {
    var r = $('track').getBoundingClientRect();
    if (!audio.duration) return;
    audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
    showTime();
  }
  $('track').addEventListener('pointerdown', function (e) { dragging = true; $('track').setPointerCapture(e.pointerId); seek(e); });
  $('track').addEventListener('pointermove', function (e) { if (dragging) seek(e); });
  $('track').addEventListener('pointerup', function () { dragging = false; });

  // ---------- the notes and the way to the next day ----------
  (function () {
    var notes = $('notes'), html = article.notes || '';
    // the notes as written in the vault; the pieces below are only for an older articles.js
    if (!html) {
    if (article.caption) html += '<p class="caption">' + article.caption + '</p>';
    if (article.credit) html += '<p class="credit">' + article.credit + '</p>';
    if (article.evidence) html += '<h2>Based on evidence</h2><p>' + article.evidence + '</p>';
    if (article.sources.length) html += '<h2>Sources</h2><ul>' + article.sources.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul>';
    }
    notes.innerHTML = html;
    var days = $('days');
    days.innerHTML = '';   // a finished day page comes with its own buttons; these replace them
    // each button names the day and its place, e.g. "Day 3 →" over "Eleusis to Oinoe"
    function dayButton(n, cls, label) {
      return '<a class="' + cls + '" href="day.html?day=' + n + '"><b>' + label + '</b><span>' + window.ARTICLES[n].title + '</span></a>';
    }
    if (window.ARTICLES[DAY - 1]) days.innerHTML += dayButton(DAY - 1, 'prev', '← Day ' + (DAY - 1));
    if (window.ARTICLES[DAY + 1] && DAY + 1 <= TODAY) days.innerHTML += dayButton(DAY + 1, 'next', 'Day ' + (DAY + 1) + ' →');
    // on the newest day, where the next day's button will go: a countdown to the next entry at 22:00 UTC, as on the home page
    if (window.ARTICLES[DAY + 1] && DAY + 1 > TODAY) {
      days.innerHTML += '<div class="wait"><b>Expecting journal entry for Day ' + (DAY + 1) + ' in</b><span id="wait-clock"></span></div>';
      var clock = $('wait-clock');
      var tick = function () {
        var now = new Date(), next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 22);
        if (next <= now.getTime()) next += 864e5;
        var t = Math.ceil((next - now.getTime()) / 1e3), two = function (n) { return (n < 10 ? '0' : '') + n; };
        clock.textContent = Math.floor(t / 3600) + ':' + two(Math.floor(t / 60) % 60) + ':' + two(t % 60);
        if (t <= 1) setTimeout(function () { location.reload(); }, 1500);   // the new day is up: reload to show its button
      };
      tick();
      setInterval(tick, 1e3);
    }
  })();
})();
