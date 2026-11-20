/* Crossing Persia, About the Project page.
   Puts each lithographed frame (pages 2 and 3) at the exact position and angles it has in its photograph.

   The photographed frames are not neat turned rectangles: each edge slopes by its own amount.
   So instead of turning the box, the page bends it so its four corners land on the four corners
   of the frame in the photograph, measured in that photograph's pixels.

   The boxes are taller than the printed frames, because they hold more text. Each side is extended
   along its own slope, so all four edges keep the exact angle they have in the photograph. */

(function () {
  // Corners of each frame in its photograph, with the 6 blank pixels the frame picture has round its lines.
  // photoW and photoH are the photograph's size; srcH is the height of the straightened frame picture in the same pixels.
  const PAGES = {
    p2: { photoW: 680, photoH: 1090, srcH: 834,
          tl: [164, 115], tr: [639, 131], bl: [148, 950], br: [626, 953] },
    p3: { photoW: 680, photoH: 1055, srcH: 813,
          tl: [39, 152],  tr: [501, 143], bl: [51, 962],  br: [521, 960] },
    p4: { photoW: 658, photoH: 1027, srcH: 768,
          tl: [34, 138],  tr: [484, 135], bl: [44, 905],  br: [486, 903] },
  };

  const narrow = window.matchMedia('(max-width: 700px)');

  // The 3D matrix that takes a W x H box to the four corners q0 (top left), q1 (top right), q2 (bottom right), q3 (bottom left).
  function boxToCorners(W, H, q0, q1, q2, q3) {
    const [x0, y0] = q0, [x1, y1] = q1, [x2, y2] = q2, [x3, y3] = q3;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den;
    const h = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
    const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
    return `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${h / H},0,0,1,0,${c},${f},0,1)`;
  }

  function place(plate) {
    const key = Object.keys(PAGES).find(k => plate.classList.contains(k));
    const P = PAGES[key];
    const box = plate.querySelector('.page-inner');
    const litho = box.querySelector('.litho');
    const text = box.querySelector('.litho-text');

    // start from a straight box every time, so the measurements below are of the box as laid out
    litho.style.removeProperty('--warp');
    text.style.transform = '';

    const k = plate.clientWidth / P.photoW;        // screen pixels per photograph pixel
    const W = box.offsetWidth, H = box.offsetHeight;
    // phones keep the simpler layout set in about.css; and a box that has no size yet
    // (a hidden tab, a preview pane still opening) is left straight until it has one
    if (narrow.matches || !(k > 0 && W > 0 && H > 0)) { plate.style.paddingBottom = ''; return; }

    const s = (H / k) / P.srcH;                    // how many times taller the box is than the printed frame

    // corners relative to the box's own top left corner, in screen pixels
    const rel = ([x, y]) => [(x - P.tl[0]) * k, (y - P.tl[1]) * k];
    const tl = rel(P.tl), tr = rel(P.tr);
    const bl = rel([P.tl[0] + (P.bl[0] - P.tl[0]) * s, P.tl[1] + (P.bl[1] - P.tl[1]) * s]);
    const br = rel([P.tr[0] + (P.br[0] - P.tr[0]) * s, P.tr[1] + (P.br[1] - P.tr[1]) * s]);

    // the frame layer: bent so all four corners land exactly
    litho.style.setProperty('--warp', boxToCorners(W, H, tl, tr, br, bl));

    // the text layer: the flat tilt and lean that comes closest to all four corners at once
    const a = ((tr[0] - tl[0]) + (br[0] - bl[0])) / (2 * W);
    const b = ((tr[1] - tl[1]) + (br[1] - bl[1])) / (2 * W);
    const c = ((bl[0] - tl[0]) + (br[0] - tr[0])) / (2 * H);
    const d = ((bl[1] - tl[1]) + (br[1] - tr[1])) / (2 * H);
    const e = (tl[0] + tr[0] + bl[0] + br[0]) / 4 - a * W / 2 - c * H / 2;
    const f = (tl[1] + tr[1] + bl[1] + br[1]) / 4 - b * W / 2 - d * H / 2;
    const bx = box.getBoundingClientRect(), tx = text.getBoundingClientRect();
    text.style.transformOrigin = `${bx.left - tx.left}px ${bx.top - tx.top}px`;   // the box's top left corner
    text.style.transform = `matrix(${a},${b},${c},${d},${e},${f})`;

    // below the frame, the same gap as in the photograph
    const bottomGap = (P.photoH - Math.max(P.bl[1], P.br[1])) * k;
    const overhang = Math.max(bl[1], br[1]) - H;
    plate.style.paddingBottom = `${bottomGap + overhang}px`;
  }

  function placeAll() { document.querySelectorAll('.litho-plate').forEach(place); }

  const ro = new ResizeObserver(placeAll);
  document.querySelectorAll('.litho-plate').forEach(p => ro.observe(p));
  narrow.addEventListener('change', placeAll);
  if (document.fonts) document.fonts.ready.then(placeAll);
  placeAll();
})();

/* Language buttons and the contact popup. */
(function () {
  const buttons = document.querySelectorAll('.sq[data-lang]');
  buttons.forEach(b => b.addEventListener('click', () => {
    document.documentElement.dataset.lang = b.dataset.lang;
    document.documentElement.lang = b.dataset.lang;
    buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));
  const dialog = document.getElementById('contact');
  // the address is put together here, not written in the page, so spam programs that read pages do not find it
  dialog.querySelector('p').textContent = ['zacahopkins', 'gmail.com'].join(String.fromCharCode(64));
  document.getElementById('contactBtn').addEventListener('click', () => dialog.showModal());
  // Copy puts the address on the clipboard and says "Copied" for a moment
  const copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', async () => {
    const email = dialog.querySelector('p').textContent.trim();
    try { await navigator.clipboard.writeText(email); }
    catch (e) {                                   // older browsers, or a page opened from a file
      const r = document.createRange(); r.selectNodeContents(dialog.querySelector('p'));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); document.execCommand('copy');
    }
    copyBtn.textContent = 'Copied';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });
})();
