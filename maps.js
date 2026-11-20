/* Crossing Persia, the Maps page: the circle with the day, the layer buttons and slider, and the route map itself */

(async () => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // shown inside the homepage's frame: the round back button asks the homepage to close its cover over
  // the map, and every other link opens in the whole window, not inside the frame
  if (window.top !== window) {
    document.addEventListener("click", e => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (a.classList.contains("back-btn")) { e.preventDefault(); parent.postMessage("close-map", "*"); return; }
      if (!a.target) a.target = "_top";
    });
  }

  /* ================= the circle: the day, which changes at 22:00 UTC. Day 1 is 17 November 2026. */

  const dcFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
  function dcDay() {
    const parts = dcFormat.formatToParts(new Date(Date.now() - 22 * 3600e3));
    const get = t => +parts.find(x => x.type === t).value;
    return Math.round((Date.UTC(get("year"), get("month") - 1, get("day")) - Date.UTC(2026, 10, 17)) / 864e5) + 1;
  }
  function setDialDay() { $("#dialDay").textContent = `Day ${Math.max(dcDay(), 1)}`; }
  setDialDay();
  setInterval(setDialDay, 60e3);

  // The circle says the day. When something on the map is clicked, the day ripples away like water,
  // the name of what was clicked ripples in, holds still for one second, then the day ripples back.
  const dial = $("#dial"), dialDay = $("#dialDay"), dialName = $("#dialName"), dialText = $(".dial-text");
  const rippleWarp = $("#dialRippleWarp"), rippleNoise = $("#dialRippleNoise");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const RIPPLE_OUT = 800, RIPPLE_IN = 1100, HOLD = 1000;
  let rippleRun = 0;
  // ripple rings spreading out from the middle of the circle, like a stone dropped in a puddle
  function rings() {
    for (let k = 0; k < 2; k++) {
      const r = document.createElement("span"); r.className = "dial-ring"; r.style.animationDelay = (k * 400) + "ms";
      dial.appendChild(r); r.addEventListener("animationend", () => r.remove());
    }
  }
  // one ripple: the text wobbles and fades out (show=false) or wobbles in and settles solid (show=true)
  function ripple(el, show, ms, run) {
    return new Promise(done => {
      const t0 = performance.now();
      el.hidden = false;
      (function frame(now) {
        if (run !== rippleRun) return done(false);
        const p = Math.min((now - t0) / ms, 1);
        const wobble = show ? 1 - p : p;        // 1 = fully rippled, 0 = solid
        el.style.opacity = show ? p : 1 - p;
        rippleWarp.setAttribute("scale", (wobble * 7).toFixed(2));
        rippleNoise.setAttribute("baseFrequency", `${(0.010 + 0.002 * Math.sin(now / 300)).toFixed(4)} ${(0.035 + 0.006 * Math.sin(now / 250)).toFixed(4)}`);
        if (p < 1) requestAnimationFrame(frame);
        else { if (!show) el.hidden = true; el.style.opacity = ""; rippleWarp.setAttribute("scale", 0); done(true); }
      })(t0);
    });
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function placeOpened(name) {
    if (!name) return;   // closing a box changes nothing; the day comes back by itself
    const run = ++rippleRun;
    if (calm) {          // for readers who switched off motion: a plain swap, no ripple
      dialDay.hidden = true; dialName.textContent = name; dialName.hidden = false;
      await wait(HOLD + 600); if (run !== rippleRun) return;
      dialName.hidden = true; dialDay.hidden = false; return;
    }
    dialText.classList.add("rippling");
    rings();
    if (!dialDay.hidden && !(await ripple(dialDay, false, RIPPLE_OUT, run))) return;
    if (!dialName.hidden && dialName.textContent !== name && !(await ripple(dialName, false, RIPPLE_OUT, run))) return;
    dialDay.hidden = true;
    dialName.textContent = name;
    if (!(await ripple(dialName, true, RIPPLE_IN, run))) return;
    await wait(HOLD); if (run !== rippleRun) return;
    rings();
    if (!(await ripple(dialName, false, RIPPLE_OUT, run))) return;
    if (!(await ripple(dialDay, true, RIPPLE_IN, run))) return;
    dialText.classList.remove("rippling");
  }

  /* ================= the route data: places, places passed on the road, and the walking lines */

  const P = id => `https://pleiades.stoa.org/places/${id}`;
  // Overnight places, in order. Facts from Route and Calendar/Journey Log.md (approved weeks 01 and 02).
  const stops = [
    {name:'Athens', greek:'Ἀθῆναι', week:1, lat:37.975791, lng:23.722756, url:P(676120270),
     label:'17 Nov · day 1 · set out', where:'The Altar of the Twelve Gods in the agora',
     days:[['Day 1 · 17 Nov','Set out from the Altar of the Twelve Gods in the agora, on foot with the pack donkey.']]},
    {name:'Eleusis', greek:'Ἐλευσίς', week:1, lat:38.041101, lng:23.537401, url:P(579920),
     label:'17–18 Nov · days 1–2 · with Philon', where:'In the house of Philon',
     days:[['Day 1 · 17 Nov','Athens to Eleusis, about 23 km. Stayed in the house of Philon.'],
           ['Day 2 · 18 Nov','Rest day. Walked up to the sanctuary of Demeter and Kore.']]},
    {name:'Oinoe', greek:'Οἰνόη', week:1, lat:38.168677, lng:23.449807, url:P(580040),
     label:'19–20 Nov · days 3–4 · with Glaukos', where:'In the high plain, in the house of Glaukos',
     days:[['Day 3 · 19 Nov','Eleusis to Oinoe, about 27 km, across the Thriasian plain and up into the plain of Oinoe. Stayed in the house of Glaukos.'],
           ['Day 4 · 20 Nov','Kept indoors by rain.']]},
    {name:'Hysiai', greek:'Ὑσιαί', week:1, lat:38.217217, lng:23.344419, url:P(540831),
     label:'21 Nov · day 5 · with Nikarete', where:'In the house of Nikarete',
     days:[['Day 5 · 21 Nov','Oinoe to Hysiai, about 18 km, past Eleutherai over the pass of Mount Cithaeron, in cold rain and cloud. Stayed in the house of Nikarete.']]},
    {name:'Plataea', greek:'Πλάταιαι', week:1, lat:38.221075, lng:23.273538, url:P(541063),
     label:'22–23 Nov · days 6–7 · with Damon', where:'In the house of Damon',
     days:[['Day 6 · 22 Nov','Hysiai to Plataea, about 8 km, west along the foot of Mount Cithaeron. Stayed in the house of Damon.'],
           ['Day 7 · 23 Nov','Rest day.']]},
    {name:'Thebes', greek:'Θῆβαι', week:2, lat:38.319949, lng:23.317653, url:P(541138),
     label:'24–26 Nov · days 8–10 · with Polykritos', where:'In the house of Polykritos',
     days:[['Day 8 · 24 Nov','Plataea to Thebes, about 14 km, north across the fields of Plataea, wading the river Asopos, past the village of Potniai and up to the Kadmeia. Stayed in the house of Polykritos.'],
           ['Day 9 · 25 Nov','Rest day. Changed an owl for Theban silver in the market.'],
           ['Day 10 · 26 Nov','Rest day. Walked up to the temple of Apollo Ismenios.']]},
    {name:'Haliartos', greek:'Ἁλίαρτος', week:2, lat:38.378323, lng:23.086604, url:P(540801),
     label:'27–28 Nov · days 11–12 · with Kaphisias', where:'In the house of Kaphisias',
     days:[['Day 11 · 27 Nov','Thebes to Haliartos, about 27 km, west across the plain to Onchestos, then along Lake Copais. Stayed in the house of Kaphisias.'],
           ['Day 12 · 28 Nov','Kept indoors by rain.']]},
    {name:'Koroneia', greek:'Κορώνεια', week:2, lat:38.391204, lng:22.957112, url:P(540717),
     label:'29–30 Nov · days 13–14 · with Hermaios', where:'In the house of Hermaios',
     days:[['Day 13 · 29 Nov','Haliartos to Koroneia, about 17 km, by the spring Tilphossa and along the strip of land between the lake and the mountain. Stayed in the house of Hermaios.'],
           ['Day 14 · 30 Nov','Rest day.']]}
  ];
  // Places passed on the road, with the overnight stop they come after.
  const waypoints = [
    {name:'Eleutherai', greek:'Ἐλευθεραί', week:1, after:2, lat:38.179445, lng:23.375622, url:P(540756), text:'Day 5. Passed on the way over the pass of Mount Cithaeron.'},
    {name:'Potniai', greek:'Ποτνιαί', week:2, after:4, lat:38.29991, lng:23.311633, url:P(541070), text:'Day 8. A village passed on the way from the Asopos up to the Kadmeia of Thebes.'},
    {name:'Onchestos', greek:'Ὀγχηστός', week:2, after:5, lat:38.373269, lng:23.150267, url:P(540984), text:'Day 11. Reached across the plain west of Thebes, before the walk along Lake Copais.'},
    {name:'Tilphossa', greek:'Τιλφῶσσα', week:2, after:6, lat:38.371064, lng:22.994538, url:P(541148), text:'Day 13. The spring passed between Haliartos and Koroneia. Pleiades marks its location as uncertain.'}
  ];
  const weekColour = {1:'#b5762f', 2:'#365b9b'};
  // Walking lines, one per stretch between consecutive places, traced along today's roads where they follow the old routes
  // (Athens to Eleusis through Daphni, the Sacred Way). Made with the routing.openstreetmap.de route planner, 17 November 2026.
  const roads = [[[23.72302,37.97711],[23.72125,37.97737],[23.72111,37.97794],[23.72227,37.97887],[23.72073,37.98083],[23.71675,37.97913],[23.71475,37.9796],[23.71674,37.97902],[23.71823,37.97973],[23.71878,37.97898],[23.72124,37.9801],[23.71796,37.98463],[23.71532,37.9841],[23.71099,37.9852],[23.6901,37.9992],[23.68562,38.00138],[23.67884,38.00386],[23.66716,38.01162],[23.66507,38.01255],[23.66351,38.01271],[23.65594,38.01256],[23.64895,38.01065],[23.64573,38.0111],[23.63536,38.01364],[23.62473,38.0135],[23.61634,38.01232],[23.61491,38.01252],[23.61082,38.0116],[23.60802,38.01201],[23.6004,38.0138],[23.59929,38.01462],[23.59868,38.01586],[23.59915,38.02234],[23.59782,38.02871],[23.59312,38.03702],[23.59006,38.03973],[23.58593,38.04248],[23.57568,38.0474],[23.57287,38.04853],[23.56852,38.0497],[23.56131,38.05026],[23.55886,38.05],[23.5526,38.04802],[23.54915,38.0464],[23.54592,38.04545],[23.54427,38.04459],[23.54443,38.0438],[23.53975,38.03815],[23.53704,38.03916],[23.53746,38.03984],[23.53711,38.04]],[[23.53711,38.04],[23.53921,38.03913],[23.54213,38.04323],[23.5355,38.04476],[23.53391,38.04544],[23.52418,38.05135],[23.52172,38.05307],[23.52108,38.05381],[23.51888,38.05778],[23.51686,38.06005],[23.51331,38.06486],[23.5099,38.07226],[23.50248,38.07382],[23.50007,38.07383],[23.49689,38.07493],[23.49609,38.07567],[23.49474,38.07845],[23.49489,38.07858],[23.4944,38.079],[23.49284,38.08145],[23.4931,38.08201],[23.49208,38.08254],[23.49089,38.08404],[23.48947,38.08469],[23.48562,38.08522],[23.4839,38.08611],[23.48062,38.08866],[23.47942,38.08905],[23.47712,38.08931],[23.47639,38.09044],[23.4762,38.09179],[23.47328,38.09451],[23.46976,38.09597],[23.46768,38.09556],[23.46491,38.09729],[23.46249,38.09747],[23.45917,38.09916],[23.45835,38.09905],[23.45627,38.09811],[23.44991,38.09814],[23.44852,38.0989],[23.44775,38.09992],[23.44788,38.10149],[23.44719,38.10246],[23.44562,38.10296],[23.44125,38.10364],[23.43701,38.10547],[23.43414,38.10591],[23.43066,38.10602],[23.42593,38.10654],[23.42471,38.1059],[23.42338,38.10562],[23.42196,38.10498],[23.4213,38.10524],[23.42044,38.10629],[23.42049,38.10744],[23.42024,38.10824],[23.42033,38.11141],[23.41902,38.11322],[23.41911,38.11404],[23.41835,38.11463],[23.41828,38.11518],[23.41772,38.11583],[23.41852,38.11686],[23.41874,38.11787],[23.41713,38.11913],[23.41569,38.1219],[23.41572,38.12239],[23.41628,38.12297],[23.4174,38.12333],[23.41779,38.12445],[23.41625,38.12516],[23.415,38.12614],[23.41277,38.12694],[23.4109,38.12718],[23.41067,38.12768],[23.41106,38.12812],[23.41284,38.12881],[23.41518,38.13012],[23.41542,38.13039],[23.41522,38.13117],[23.41538,38.13167],[23.41745,38.13325],[23.42034,38.13417],[23.42097,38.13499],[23.42063,38.13622],[23.42205,38.1372],[23.42204,38.13821],[23.42233,38.13865],[23.42444,38.13876],[23.425,38.13919],[23.425,38.13963],[23.42468,38.13995],[23.42193,38.14126],[23.42105,38.14134],[23.41957,38.14084],[23.41904,38.14107],[23.4188,38.14155],[23.4191,38.14202],[23.42055,38.14248],[23.4221,38.14374],[23.42301,38.14703],[23.42341,38.1476],[23.42641,38.14849],[23.42704,38.14889],[23.42783,38.1521],[23.4303,38.15409],[23.43147,38.15539],[23.43139,38.15617],[23.42943,38.15781],[23.42911,38.15843],[23.42968,38.16048],[23.42949,38.16097],[23.42876,38.16152],[23.42884,38.16733],[23.42847,38.16903],[23.43762,38.16936],[23.44399,38.1707],[23.44733,38.17183],[23.44859,38.16705],[23.45013,38.16719],[23.45015,38.16767],[23.45059,38.16774],[23.45053,38.16834]],[[23.45053,38.16834],[23.45059,38.16774],[23.45015,38.16767],[23.45013,38.16719],[23.44859,38.16705],[23.44733,38.17183],[23.44399,38.1707],[23.43724,38.16931],[23.42974,38.16911],[23.41999,38.16846],[23.41905,38.16997],[23.41863,38.16993],[23.41807,38.17169],[23.41645,38.17235],[23.40623,38.17391],[23.40169,38.17553],[23.38328,38.17504],[23.37945,38.17731],[23.37832,38.17751],[23.37623,38.1773],[23.37422,38.17812],[23.37375,38.17861],[23.37232,38.18137],[23.37021,38.18176],[23.37119,38.18181],[23.37192,38.18223],[23.3724,38.18214],[23.37447,38.18001]],[[23.37447,38.18001],[23.37243,38.18212],[23.37192,38.18223],[23.37119,38.18181],[23.37021,38.18176],[23.35926,38.18887],[23.35551,38.18968],[23.35385,38.19029],[23.35195,38.19144],[23.35095,38.19177],[23.35126,38.19125],[23.34964,38.19192],[23.34834,38.19261],[23.34434,38.19592],[23.344,38.19652],[23.34403,38.19719],[23.34493,38.19903],[23.34541,38.19939],[23.34592,38.20147],[23.34339,38.20316],[23.34176,38.20279],[23.33797,38.20359],[23.33803,38.20387],[23.33926,38.20446],[23.3395,38.20493],[23.3378,38.20718],[23.33946,38.2071],[23.33997,38.20728],[23.3402,38.20791],[23.33993,38.20871],[23.33844,38.2103],[23.33663,38.21156],[23.33573,38.2117],[23.33489,38.21226],[23.3336,38.21191],[23.33448,38.21253],[23.33542,38.21271],[23.3361,38.21236],[23.34003,38.21204],[23.33964,38.21247],[23.33799,38.2127],[23.33711,38.21343],[23.33865,38.2132],[23.34058,38.21361],[23.33897,38.21507],[23.33826,38.2169],[23.33694,38.21809],[23.33801,38.21956],[23.3388,38.21974],[23.33974,38.2195],[23.34123,38.21778],[23.34095,38.21707],[23.34119,38.21665],[23.34223,38.21597],[23.34282,38.21598]],[[23.34282,38.21598],[23.34223,38.21597],[23.34119,38.21665],[23.34095,38.21707],[23.34123,38.21778],[23.33974,38.2195],[23.3388,38.21974],[23.33801,38.21956],[23.3368,38.22046],[23.33659,38.22123],[23.33708,38.22349],[23.33485,38.22292],[23.33216,38.22281],[23.33069,38.22234],[23.3287,38.22228],[23.32463,38.21995],[23.32463,38.21977],[23.31932,38.21976],[23.31785,38.22045],[23.30535,38.22301],[23.30112,38.22238],[23.29712,38.22104],[23.29336,38.22055],[23.29075,38.221],[23.28773,38.22105],[23.28714,38.22071],[23.28606,38.22184],[23.28321,38.22338],[23.2783,38.22506],[23.27628,38.22371],[23.2741,38.22331],[23.27213,38.222]],[[23.27213,38.222],[23.27163,38.22142],[23.27182,38.22798],[23.27713,38.23897],[23.27804,38.24176],[23.27945,38.24373],[23.28425,38.24902],[23.28469,38.24988],[23.28838,38.24934],[23.2888,38.2496],[23.28906,38.25012],[23.28515,38.25021],[23.28607,38.25369],[23.28598,38.25449],[23.28674,38.25597],[23.28676,38.25696],[23.28737,38.25746],[23.28852,38.25748],[23.2884,38.26414],[23.28893,38.26483],[23.28968,38.26721],[23.29094,38.26956],[23.29163,38.27217],[23.29212,38.27557],[23.29865,38.2741],[23.29967,38.27452],[23.30301,38.27446],[23.30383,38.27752],[23.3048,38.27867],[23.30845,38.28684],[23.31102,38.29122],[23.31163,38.2927],[23.31248,38.29715],[23.31243,38.29883],[23.31178,38.29996]],[[23.31178,38.29996],[23.31125,38.30122],[23.31364,38.30259],[23.31427,38.30423],[23.31644,38.30652],[23.31807,38.30898],[23.31786,38.31151],[23.31816,38.31343],[23.31866,38.31466],[23.31785,38.31685],[23.31717,38.31731],[23.31712,38.31766],[23.31711,38.31858],[23.31741,38.31859],[23.31747,38.31923],[23.31796,38.31922],[23.31797,38.31994]],[[23.31797,38.31994],[23.31798,38.32041],[23.31709,38.32041],[23.31712,38.32074],[23.31545,38.32065],[23.31552,38.32193],[23.31411,38.3223],[23.31296,38.32339],[23.31082,38.3234],[23.31067,38.32275],[23.31036,38.32274],[23.30998,38.32201],[23.3088,38.32208],[23.30685,38.3215],[23.30641,38.32215],[23.30555,38.32258],[23.30311,38.32294],[23.29981,38.324],[23.29562,38.32474],[23.28623,38.32514],[23.28428,38.32569],[23.2816,38.32554],[23.27693,38.32586],[23.27443,38.32556],[23.27194,38.32491],[23.26829,38.32483],[23.26318,38.3239],[23.25631,38.32445],[23.25272,38.32451],[23.243,38.3261],[23.22951,38.32746],[23.22785,38.32733],[23.22568,38.32751],[23.22164,38.32689],[23.2146,38.32679],[23.21437,38.32763],[23.21294,38.32873],[23.21145,38.32946],[23.20879,38.33009],[23.2032,38.33077],[23.19792,38.33105],[23.19495,38.33035],[23.19383,38.33029],[23.18954,38.33065],[23.18589,38.33149],[23.18336,38.3301],[23.184,38.33161],[23.18346,38.33229],[23.17742,38.33553],[23.17559,38.33718],[23.17312,38.33867],[23.17279,38.33928],[23.17045,38.34157],[23.16341,38.34817],[23.16065,38.35179],[23.15833,38.35422],[23.14997,38.35788],[23.14924,38.36013],[23.14792,38.36121],[23.14538,38.36261],[23.14463,38.36388],[23.14421,38.36419],[23.14418,38.36752],[23.14687,38.37247],[23.14751,38.37451],[23.15038,38.37344]],[[23.15038,38.37344],[23.14751,38.37451],[23.14749,38.37703],[23.14682,38.37764],[23.14272,38.37717],[23.13983,38.37749],[23.13911,38.37781],[23.13164,38.37871],[23.12056,38.38134],[23.11839,38.38141],[23.1177,38.38134],[23.11655,38.37971],[23.11641,38.37908],[23.1131,38.3794],[23.113,38.37906],[23.11229,38.37907],[23.11033,38.37708],[23.10137,38.37267],[23.10073,38.37276],[23.10065,38.37181],[23.09854,38.37187],[23.09856,38.37212],[23.09739,38.37175],[23.09511,38.37172],[23.09089,38.3725],[23.09111,38.3738],[23.08562,38.37488],[23.08364,38.37487],[23.08236,38.37528],[23.0821,38.37555],[23.08208,38.37647],[23.08268,38.37703],[23.08358,38.3785]],[[23.08358,38.3785],[23.08268,38.37703],[23.08208,38.37647],[23.08207,38.37571],[23.08236,38.37528],[23.08364,38.37487],[23.08141,38.37485],[23.07821,38.37541],[23.07501,38.37484],[23.07209,38.37463],[23.07138,38.37214],[23.07148,38.37171],[23.07089,38.37009],[23.0678,38.36992],[23.06574,38.37028],[23.06275,38.3693],[23.0623,38.36889],[23.06183,38.36959],[23.06106,38.36955],[23.05823,38.37023],[23.05773,38.37096],[23.05752,38.37072],[23.057,38.37087],[23.05681,38.37068],[23.05588,38.37097],[23.05334,38.37107],[23.0515,38.3721],[23.05106,38.3726],[23.05075,38.37257],[23.05018,38.37336],[23.04952,38.37331],[23.04753,38.37375],[23.04581,38.37359],[23.04486,38.37252],[23.04266,38.37194],[23.04243,38.37152],[23.04203,38.37141],[23.04095,38.37161],[23.03943,38.37096],[23.03845,38.37004],[23.03745,38.36975],[23.03516,38.36943],[23.03403,38.37017],[23.03326,38.37021],[23.03084,38.36937],[23.02739,38.3695],[23.0249,38.36916],[23.024,38.36875],[23.02211,38.36936],[23.02164,38.37028],[23.02093,38.37032],[23.02002,38.37087],[23.01957,38.37088],[23.01932,38.3713],[23.01755,38.37192],[23.01531,38.37153],[23.01459,38.37162],[23.01431,38.37203],[23.01409,38.37151],[23.0124,38.37004],[23.01147,38.37007],[23.01034,38.36936],[23.00974,38.36932],[23.009,38.36868],[23.00851,38.36914],[23.00759,38.36895],[22.9993,38.36583],[22.99885,38.36595],[22.9992,38.36659],[22.99899,38.3678],[22.99823,38.36861],[22.99682,38.36891],[22.99588,38.3685],[22.99483,38.36691],[22.99452,38.36711],[22.99427,38.3676],[22.99521,38.36859],[22.99538,38.36921],[22.99506,38.37014],[22.99425,38.37072],[22.99429,38.37108]],[[22.99429,38.37108],[22.99417,38.3727],[22.99479,38.37453],[22.99582,38.37543],[22.9964,38.3765],[22.9964,38.37702],[22.99719,38.37777],[22.99715,38.37822],[22.99536,38.37909],[22.99276,38.37862],[22.99326,38.37897],[22.99335,38.38141],[22.99267,38.38175],[22.99266,38.38222],[22.9923,38.38244],[22.99177,38.3839],[22.99186,38.38419],[22.99159,38.38428],[22.99171,38.38466],[22.99121,38.38511],[22.98941,38.38572],[22.98873,38.38563],[22.98862,38.38626],[22.98808,38.38683],[22.98615,38.38779],[22.98478,38.38904],[22.98306,38.39005],[22.98123,38.39088],[22.97938,38.39135],[22.97478,38.39042],[22.97427,38.39006],[22.97376,38.39015],[22.96763,38.39187],[22.96562,38.39207],[22.9643,38.39306],[22.96357,38.39283],[22.96299,38.39304],[22.96195,38.39411],[22.96225,38.39222],[22.96188,38.39091],[22.96121,38.39037],[22.95589,38.3891],[22.95554,38.38965],[22.95573,38.39023],[22.95561,38.39088]]];

  /* ================= which day it is on the map */

  // Where he is today. Day 1 began at 22:00 UTC on 17 November 2026, one day per date after that.
  // nightAt[d] = the stop where he sleeps at the end of day d.
  const nightAt = {1:1,2:1,3:2,4:2,5:3,6:4,7:4,8:5,9:5,10:5,11:6,12:6,13:7,14:7};
  // A new day starts at 22:00 UTC, the same as every other page. Same for every reader, wherever they are.
  function berlinDay(){
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date(Date.now() - 22 * 3600e3)).map(x=>[x.type,x.value]));
    const d=Date.UTC(+parts.year,+parts.month-1,+parts.day);
    return Math.floor((d-Date.UTC(2026,10,17))/86400000)+1;
  }
  const dayNow = berlinDay();
  // If the page stays open past 22:00 UTC, reload it so the walking man moves.
  setInterval(()=>{ if(berlinDay()!==dayNow) location.reload(); }, 60000);
  const lastDay = Math.max(...Object.keys(nightAt).map(Number));
  const hereIdx = dayNow < 1 ? 0 : nightAt[Math.min(dayNow,lastDay)];
  const manSVG = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="13.5" cy="3.6" r="2.4" fill="currentColor"/><path d="M12.2 7.2c-.9-.3-1.9 0-2.5.8L7.3 11.3l1.6 1.2 1.9-2.6.6 3.9-2.6 7.6 2 .7 2.3-6.5 1.9 2.7.4 4.3h2.1l-.5-5.1-2.3-3.4-.5-3 1.4 1.6h3v-2h-2.1l-2.3-3.1c-.3-.3-.6-.4-1-.4z" fill="currentColor"/><path d="M17.6 8.2l1.1-.3 3.1 14.6-1 .2z" fill="currentColor"/></svg>';
  // Only show the road as far as he has walked.
  stops.length = hereIdx + 1;
  for(let i=waypoints.length-1;i>=0;i--) if(waypoints[i].after >= hereIdx) waypoints.splice(i,1);
  const hereLabel = dayNow < 1 ? 'Setting out soon' : dayNow > lastDay ? `Last known place, day ${lastDay}` : `Today · day ${dayNow}`;

  // The full path in travel order: each stop, then any waypoints that follow it.
  const path = [];
  stops.forEach((s,i)=>{path.push(s); waypoints.filter(w=>w.after===i).forEach(w=>path.push(w));});
  function geo(){
    const features=[];
    for(let i=1;i<path.length;i++){
      const a=path[i-1], b=path[i];
      features.push({type:'Feature',properties:{colour:weekColour[b.week]},geometry:{type:'LineString',coordinates:[[a.lng,a.lat],...roads[i-1],[b.lng,b.lat]]}});
    }
    return {type:'FeatureCollection',features};
  }

  // A stop's box: the name, "Arion is here today" if he is, then each day spent there up to today.
  // Each day opens that day's journal entry in a new tab. Days that have not happened yet are not shown.
  function stopHTML(s,i){
    const days=s.days.filter(d=>+d[0].match(/\d+/)[0]<=dayNow).map(d=>{
      const n=+d[0].match(/\d+/)[0];
      return `<a class="popup-day" href="day.html?day=${n}" target="_blank" rel="noopener"><b>${d[0]}</b><br>${d[1]}</a>`;
    }).join('');
    return `<h2 class="popup-title">${s.name}</h2>${i===hereIdx&&dayNow>=1&&dayNow<=lastDay?`<div class="popup-here">${manSVG} Arion is here today</div>`:''}${days}`;
  }
  function wpHTML(w){
    return `<div class="popup-sub">Week ${w.week} · passed on the road</div><h2 class="popup-title">${w.name}</h2><div><em>${w.greek}</em></div><p style="margin:8px 0 0">${w.text}</p><a class="popup-day" style="margin:12px 0 0" target="_blank" rel="noopener noreferrer" href="${w.url}">Pleiades place record ↗</a>`;
  }
  // When a place's box opens, the circle says Travel Journal; when it closes, the day comes back.
  // Only one box is ever open: opening one closes whichever was open before.
  let openPopup=null;
  function watch(popup,name){
    popup.on('open',()=>{ if(openPopup&&openPopup!==popup) openPopup.remove(); openPopup=popup; placeOpened(name); });
    popup.on('close',()=>{ if(openPopup===popup) openPopup=null; placeOpened(null); });
    return popup;
  }

  /* ================= the map */

  let map=null, markers=[], wpMarkers=[];
  function fit(duration=650){
    const pts=[...stops,...waypoints];
    const lngs=pts.map(p=>p.lng), lats=pts.map(p=>p.lat);
    map.fitBounds([[Math.min(...lngs)-.03,Math.min(...lats)-.03],[Math.max(...lngs)+.03,Math.max(...lats)+.03]],
      {padding:{top:120,bottom:60,left:60,right:60},duration,maxZoom:11});
  }
  function focusStop(i){
    if(!map||!markers[i]) return;
    map.flyTo({center:[stops[i].lng,stops[i].lat],zoom:12,offset:[0,160],essential:true});
    markers.forEach((m,k)=>{if(k!==i&&m.getPopup().isOpen()) m.togglePopup();});
    if(!markers[i].getPopup().isOpen()) markers[i].togglePopup();
  }

  // ---------- Route layer: the walking line, the numbered places, the passing places and the walking man ----------
  let routeOn=true;
  function setRoute(on){
    routeOn=on;
    $('#map').classList.toggle('route-off',!on);
    ['path-white','path-dashes'].forEach(id=>{ if(map&&map.getLayer(id)) map.setLayoutProperty(id,'visibility',on?'visible':'none'); });
    if(!on) [...markers,...wpMarkers].forEach(m=>{ if(m.getPopup().isOpen()) m.togglePopup(); });
  }

  // ---------- Political layer: Greece in 500 BCE (data in greece_500bc_layer.js) ----------
  const GR = window.GREECE_500BC || null;
  // The Lake Copais outline was traced from grid squares on a printed figure, so its edge is a staircase.
  // Cut the corners: take the middle of each step, then round it off three times.
  function smoothRing(r){
    let pts=r.slice(0,-1).map((p,i,a)=>{const q=a[(i+1)%a.length];return [(p[0]+q[0])/2,(p[1]+q[1])/2];});
    for(let k=0;k<3;k++){
      const out=[];
      pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];out.push([.75*p[0]+.25*q[0],.75*p[1]+.25*q[1]],[.25*p[0]+.75*q[0],.25*p[1]+.75*q[1]]);});
      pts=out;
    }
    return [...pts,pts[0]];
  }
  // Map Maker left about 1,400 tiny three- and four-cornered holes in the state and city shapes, where its border
  // lines did not quite meet. They show as small triangles. Drop every hole with six corners or fewer;
  // real holes, such as Lake Copais inside the Boeotian League, have many more.
  if(GR) [GR.states,GR.cities].forEach(fc=>fc&&fc.features.forEach(f=>{
    // The Boeotian League's one big hole is Lake Copais, cut with square steps. Fill it: the smoothed lake is drawn on top.
    const bl=f.properties.name==='Boeotian League';
    const g=f.geometry, keep=p=>[p[0],...p.slice(1).filter(r=>!bl&&r.length>6)];
    if(g.type==='Polygon') g.coordinates=keep(g.coordinates);
    else if(g.type==='MultiPolygon') g.coordinates=g.coordinates.map(keep);
  }));
  if(GR&&GR.lake){
    (GR.lake.features||[GR.lake]).forEach(f=>{
      const g=f.geometry;
      if(g.type==='Polygon') g.coordinates=g.coordinates.map(smoothRing);
      else if(g.type==='MultiPolygon') g.coordinates=g.coordinates.map(p=>p.map(smoothRing));
    });
  }
  const GR_LAYERS = ['gr-fill','gr-hatch','gr-citylines','gr-outline','gr-hover','gr-lake','gr-labels'];
  let politicsOn = false, polPopup = null;
  // Line patterns as in Map Maker: each state has its own colour and lines, set in greece_500bc_layer.js.
  const GR_PATTERNS=['lines','lines-back','horizontal','vertical','cross','grid'];
  function hatchImage(kind){
    const size=16, c=document.createElement('canvas'); c.width=c.height=size;
    const g=c.getContext('2d'); g.strokeStyle='rgba(11,17,24,0.55)'; g.lineWidth=1.6;
    const line=(x1,y1,x2,y2)=>{ g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); };
    const up=()=>{ for(const o of [-size,0,size]) line(o,size,o+size,0); };
    const down=()=>{ for(const o of [-size,0,size]) line(o,0,o+size,size); };
    const flat=()=>line(0,size/2,size,size/2), tall=()=>line(size/2,0,size/2,size);
    ({'lines':up,'lines-back':down,'horizontal':flat,'vertical':tall,'cross':()=>{up();down();},'grid':()=>{flat();tall();}})[kind]();
    return g.getImageData(0,0,size,size);
  }
  function addPolitics(){
    if(!GR) return;
    GR_PATTERNS.forEach(k=>map.addImage('gr-pat-'+k, hatchImage(k), {pixelRatio:2}));
    const vis={visibility:'none'};
    // under the background map's own place names, so those stay readable
    const under=(map.getStyle().layers.find(l=>l.type==='symbol')||{}).id;
    map.addSource('gr-states',{type:'geojson',data:GR.states});
    map.addSource('gr-cities',{type:'geojson',data:GR.cities});
    map.addSource('gr-citylines',{type:'geojson',data:GR.cityLines});
    map.addSource('gr-lake',{type:'geojson',data:GR.lake});
    map.addSource('gr-labels',{type:'geojson',data:GR.labels});
    map.addLayer({id:'gr-fill',type:'fill',source:'gr-states',layout:vis,paint:{'fill-color':['get','colour'],'fill-opacity':['interpolate',['linear'],['zoom'],5,0.3,10,0.18]}},under);
    map.addLayer({id:'gr-hatch',type:'fill',source:'gr-states',layout:vis,filter:['in',['get','pattern'],['literal',GR_PATTERNS]],paint:{'fill-pattern':['concat','gr-pat-',['get','pattern']],'fill-opacity':0.35}},under);
    map.addLayer({id:'gr-citylines',type:'line',source:'gr-citylines',layout:vis,minzoom:6,paint:{'line-color':'#1b2733','line-opacity':0.45,'line-width':['interpolate',['linear'],['zoom'],6,0.5,11,1.4]}},under);
    map.addLayer({id:'gr-outline',type:'line',source:'gr-states',layout:{...vis,'line-join':'round'},paint:{'line-color':'#1b2733','line-opacity':0.85,'line-width':['interpolate',['linear'],['zoom'],5,1,10,2.4]}},under);
    map.addLayer({id:'gr-hover',type:'line',source:'gr-states',layout:{...vis,'line-join':'round'},filter:['==',['get','name'],''],paint:{'line-color':'#ffffff','line-width':3.5}},under);
    map.addLayer({id:'gr-lake',type:'fill',source:'gr-lake',layout:vis,paint:{'fill-color':'#8fc3dc','fill-opacity':0.9,'fill-outline-color':'#4f86a6'}},under);
    map.addLayer({id:'gr-labels',type:'symbol',source:'gr-labels',layout:{...vis,'text-field':['get','name'],'text-font':['Noto Sans Bold'],
      'text-size':['interpolate',['linear'],['zoom'],5,['case',['get','big'],13,10],9,['case',['get','big'],18,14]],
      'text-transform':'uppercase','text-letter-spacing':0.08,'text-max-width':9,'symbol-sort-key':['case',['get','big'],0,1]},
      paint:{'text-color':'#1b2733','text-halo-color':'rgba(255,255,255,0.9)','text-halo-width':1.6}});
    map.on('mousemove','gr-fill',e=>{ if(!politicsOn) return; map.getCanvas().style.cursor='pointer'; map.setFilter('gr-hover',['==',['get','name'],e.features[0].properties.name]); });
    map.on('mouseleave','gr-fill',()=>{ map.getCanvas().style.cursor=''; map.setFilter('gr-hover',['==',['get','name'],'']); });
    map.on('click','gr-fill',e=>{
      if(!politicsOn) return;
      // a click on a place marker belongs to that place, not to the country underneath it
      if(e.originalEvent.target.closest('.maplibregl-marker')) return;
      const name=e.features[0].properties.name;
      if(polPopup) polPopup.remove();
      // just the name, in the same white box with an X as a stop's box
      polPopup=watch(new window.maplibregl.Popup({maxWidth:'290px'}),name).setLngLat(e.lngLat)
        .setHTML(`<h2 class="popup-title">${name}</h2>`).addTo(map);
    });
  }
  function setPolitics(on){
    politicsOn=on;
    GR_LAYERS.forEach(id=>{ if(map&&map.getLayer(id)) map.setLayoutProperty(id,'visibility',on?'visible':'none'); });
    if(!on&&polPopup) polPopup.remove();
  }

  // ---------- Geography layer: height, mountains, lakes, rivers, plains ----------
  // Height: Mapzen terrain tiles on Amazon's open data service, coloured in bands of metres.
  const HEIGHT_BANDS = [[0,'#5f9e5a'],[200,'#a3c47a'],[500,'#e3d690'],[800,'#d6a960'],[1100,'#b07a45'],[1400,'#8a5a3a'],[1700,'#c9bfb5']];
  // Names and positions from Pleiades, only places it marks as precisely located. Ancient Lake Copais is the same shape as in the political layer.
  const GEO_NAMES = [
    ['mountain','Mount Cithaeron',540714,23.2491897,38.1842024],
    ['mountain','Mount Helicon',540808,22.8225,38.352778],
    ['mountain','Mount Parnes',580059,23.7174,38.1734],
    ['mountain','Mount Aigaleos',579851,23.65,38.033333],
    ['mountain','Mount Kerata',579977,23.3870078,38.0809376],
    ['mountain','Mount Hymettos',579955,23.8174219,37.9414944],
    ['mountain','Mount Pentelikon',580065,23.899722,38.080833],
    ['mountain','Mount Ptoion',307983955,23.2285,38.4686],
    ['mountain','Mount Laphystion',973726783,22.9166,38.4151],
    ['mountain','Mount Akontion',524604228,22.9174011,38.5066031],
    ['mountain','Mount Parnassus',541012,22.6220614,38.5351604],
    ['mountain','Mount Geraneia',570050,23.0947124,38.0168403],
    ['lake','Lake Copais',540715,23.068726,38.447092],
    ['lake','Lake Hylike',540826,23.3515630,38.4580888],
    ['river','Asopos',540672,23.6132632,38.2922606],
    ['river','Kephisos',540700,22.8942123,38.5112154],
    ['river','Ismenos',899305140,23.3244,38.3248],
    ['river','Oeroe',540967,23.1605817,38.2209913],
    ['river','Kephisos',579974,23.7424269,38.0444603],
    ['plain','Tenerian plain',541132,23.3381461,38.3654892],
  ];
  const GEO_LAYERS = ['geo-height','geo-shade','geo-lake','geo-names'];
  let geographyOn = false;
  function addGeography(){
    const vis={visibility:'none'};
    const under=(map.getStyle().layers.find(l=>l.type==='symbol')||{}).id;
    map.addSource('geo-dem',{type:'raster-dem',tiles:['https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'],
      encoding:'terrarium',tileSize:256,maxzoom:13,attribution:'Heights: <a href="https://registry.opendata.aws/terrain-tiles/">Mapzen terrain tiles</a>'});
    const relief=['interpolate',['linear'],['elevation'],-12000,'rgba(0,0,0,0)',-0.1,'rgba(0,0,0,0)'];   // the sea stays clear
    HEIGHT_BANDS.forEach(([m,c],i)=>{ if(i>0) relief.push(m-0.1,HEIGHT_BANDS[i-1][1]); relief.push(m,c); });
    map.addLayer({id:'geo-height',type:'color-relief',source:'geo-dem',layout:vis,paint:{'color-relief-color':relief,'color-relief-opacity':0.75}},under);
    map.addLayer({id:'geo-shade',type:'hillshade',source:'geo-dem',layout:vis,paint:{'hillshade-exaggeration':0.55,'hillshade-shadow-color':'#2b2118','hillshade-highlight-color':'#ffffff'}},under);
    // Draw the background map's sea, lakes and rivers again on top of the height colours, so the water stays blue.
    ['water','waterway_river','waterway_other'].forEach(id=>{
      const l=map.getStyle().layers.find(x=>x.id===id); if(!l) return;
      const copy={...l,id:'geo-'+id,layout:{...(l.layout||{}),visibility:'none'}};
      if(id==='water') copy.paint={...l.paint,'fill-color':'#8fc3dc'};
      map.addLayer(copy,under); GEO_LAYERS.push(copy.id);
    });
    if(GR){
      map.addSource('geo-lake',{type:'geojson',data:GR.lake});
      map.addLayer({id:'geo-lake',type:'fill',source:'geo-lake',layout:vis,paint:{'fill-color':'#8fc3dc','fill-opacity':0.9,'fill-outline-color':'#4f86a6'}},under);
    }
    map.addSource('geo-names',{type:'geojson',data:{type:'FeatureCollection',features:GEO_NAMES.map(([kind,name,id,lng,lat])=>({type:'Feature',properties:{kind,name,id},geometry:{type:'Point',coordinates:[lng,lat]}}))}});
    const kindIs=k=>['==',['get','kind'],k];
    map.addLayer({id:'geo-names',type:'symbol',source:'geo-names',layout:{...vis,
      'text-field':['case',kindIs('mountain'),['concat','▲ ',['get','name']],['get','name']],
      'text-font':['case',kindIs('mountain'),['literal',['Noto Sans Bold']],['literal',['Noto Sans Italic']]],
      'text-size':['interpolate',['linear'],['zoom'],7,['case',kindIs('river'),10,12],11,['case',kindIs('river'),13,16]],
      'text-max-width':8,'symbol-sort-key':['case',kindIs('mountain'),0,kindIs('lake'),1,2]},
      paint:{'text-color':['case',kindIs('mountain'),'#4a2e17',kindIs('plain'),'#2f5a24','#1f5f8b'],'text-halo-color':'rgba(255,255,255,0.9)','text-halo-width':1.6}});
  }
  function setGeography(on){
    geographyOn=on;
    GEO_LAYERS.forEach(id=>{ if(map&&map.getLayer(id)) map.setLayoutProperty(id,'visibility',on?'visible':'none'); });
  }

  // ---------- Ancient place names (data in ancient_names_layer.js), always shown ----------
  // The places on Arion's road are named as in the diary. Pleiades' own label for the same place,
  // or any other within 1.5 km of it, is left out so the name does not appear twice.
  function addAncientNames(){
    const AN = window.ANCIENT_NAMES; if(!AN) return;
    const route=[...stops.map(s=>({...s,rank:-1})),...waypoints.map(w=>({...w,rank:1}))];
    const km=(a,b)=>Math.hypot((a[0]-b[0])*88,(a[1]-b[1])*111);
    const feats=AN.features.filter(f=>!route.some(r=>km(f.geometry.coordinates,[r.lng,r.lat])<1.5));
    route.forEach(r=>feats.push({type:'Feature',properties:{name:r.name,kind:r.rank<0?'stop':'town',rank:r.rank},geometry:{type:'Point',coordinates:[r.lng,r.lat]}}));
    map.addSource('anc',{type:'geojson',data:{type:'FeatureCollection',features:feats}});
    const k=v=>['==',['get','kind'],v], big=['<=',['get','rank'],0];
    const text={'text-field':['get','name'],'text-variable-anchor':['top','bottom','left','right'],'text-radial-offset':['case',k('stop'),1.5,0.55],
      'text-justify':'auto','text-max-width':8,'symbol-sort-key':['get','rank'],'text-padding':3};
    const paint={'text-color':['case',k('island'),'#1f5f8b','#1b2733'],'text-halo-color':'rgba(255,255,255,0.92)','text-halo-width':1.6};
    // towns and cities: a small dot, and the name beside it
    map.addLayer({id:'anc-dots',type:'circle',source:'anc',filter:['all',['!',k('island')],['any',big,['>=',['zoom'],9.5]]],
      paint:{'circle-radius':['case',big,3.2,2.2],'circle-color':'#1b2733','circle-stroke-color':'#fff','circle-stroke-width':1}});
    // the small names first, so that where labels collide the cities and the places on his road win
    map.addLayer({id:'anc-names-small',type:'symbol',source:'anc',minzoom:9.5,filter:['all',['!',big],['!',k('island')]],
      layout:{...text,'text-font':['literal',['Noto Sans Regular']],'text-size':['interpolate',['linear'],['zoom'],9.5,11,13,14]},paint});
    map.addLayer({id:'anc-names-big',type:'symbol',source:'anc',filter:['any',big,k('island')],
      layout:{...text,'text-font':['case',k('island'),['literal',['Noto Sans Italic']],['literal',['Noto Sans Bold']]],
        'text-size':['interpolate',['linear'],['zoom'],6,10,10,14,13,17]},paint});
  }

  /* ================= the buttons and slider on the left */

  // One strength slider. It changes the layer whose button was pressed last.
  const STRENGTH={politics:30,geography:75,route:100};
  function applyStrength(){
    const s=k=>STRENGTH[k]/100, set=(id,prop,v)=>{ if(map&&map.getLayer(id)) map.setPaintProperty(id,prop,v); };
    set('gr-fill','fill-opacity',s('politics'));
    set('gr-hatch','fill-opacity',0.6*s('politics'));
    set('geo-height','color-relief-opacity',s('geography'));
    set('path-white','line-opacity',0.9*s('route'));
    set('path-dashes','line-opacity',s('route'));
    $('#map').style.setProperty('--route-strength',s('route'));
  }
  const layerBtns = $$(".layer-btn[data-layer]");
  const slider = $("#strength");
  let chosen = "politics";
  function choose(layer) {
    chosen = layer;
    layerBtns.forEach(b => b.classList.toggle("chosen", b.dataset.layer === layer));
    slider.value = STRENGTH[layer];
    slider.style.setProperty("--v", slider.value + "%");
  }
  const setLayer = { politics: setPolitics, geography: setGeography, route: setRoute };
  layerBtns.forEach(b => b.addEventListener("click", () => {
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on);
    choose(b.dataset.layer);
    setLayer[b.dataset.layer](on);
  }));
  slider.addEventListener("input", () => {
    STRENGTH[chosen] = +slider.value;
    slider.style.setProperty("--v", slider.value + "%");
    applyStrength();
  });
  choose(chosen);

  /* ================= start the map */

  try{
    await new Promise((ok,fail)=>{const s=document.createElement('script');s.src='vendor/maplibre-gl.js';s.onload=ok;s.onerror=fail;document.head.appendChild(s);});
    const maplibregl=window.maplibregl;
    map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/liberty',center:[23.34,38.2],zoom:9.3,attributionControl:false});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
    map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
    map.on('load',()=>{
      addGeography();  // first, so the states and the route lines are drawn on top of it
      addPolitics();   // before the route lines, so they are drawn on top of it
      // The state shapes run out over the sea, so draw the water above their colours too.
      { const under=(map.getStyle().layers.find(l=>l.type==='symbol')||{}).id;
        ['geo-water','geo-waterway_river','geo-waterway_other'].forEach(id=>{ if(map.getLayer(id)) map.moveLayer(id,under); });
        // and ancient Lake Copais above today's drainage canals, which cross where the lake was
        ['geo-lake','gr-lake'].forEach(id=>{ if(map.getLayer(id)) map.moveLayer(id,under); }); }
      // Both layers start switched on.
      setGeography(true); if(GR) setPolitics(true);
      // Hide today's roads, railways, road names and number signs, airports, town and village names,
      // shops and other points of interest, modern names of seas and rivers, and modern borders.
      map.getStyle().layers.forEach(l=>{
        if(['transportation','transportation_name','aeroway','aerodrome_label','place','poi','water_name','boundary'].includes(l['source-layer'])
           || l.id==='waterway_line_label') map.setLayoutProperty(l.id,'visibility','none');
      });
      addAncientNames();
      // Hide modern man-made lakes. The numbers are OpenStreetMap's, looked up on 17 November 2026:
      // reservoirs (Marathon, Mornos, Evinos, Kremasta, Kastraki, Stratos, Plastiras, Pineios, Ladon, Doxa, Taka, Smokovo, Aoos and two unnamed),
      // the Schinias Olympic rowing lake, two salt works and a fish farm.
      // Natural lakes stay, and so does Lake Karla, which is partly a reservoir now but was a lake in antiquity.
      const MODERN_LAKES=[1712983,2806576,1478179,36275,7778004,1351956,1880660,7792247,31537881,130164056,222417938,7814155,2326593,12309926,329613697,2389936,8287370,955975916,8904925];
      ['water','geo-water'].forEach(id=>{ if(map.getLayer(id)) map.setFilter(id,['all',['!=',['get','brunnel'],'tunnel'],['!',['in',['get','id'],['literal',MODERN_LAKES]]]]); });
      map.addSource('journey',{type:'geojson',data:geo()});
      map.addLayer({id:'path-white',type:'line',source:'journey',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ffffff','line-width':7,'line-opacity':.9}});
      map.addLayer({id:'path-dashes',type:'line',source:'journey',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':['get','colour'],'line-width':4,'line-dasharray':[2,2]}});
      applyStrength();
      markers=stops.map((s,i)=>{
        const el=document.createElement('button');el.className='marker';el.type='button';el.textContent=String(i+1);el.style.background=weekColour[s.week];el.title=s.name;el.setAttribute('aria-label',s.name);
        const popup=watch(new maplibregl.Popup({offset:22,maxWidth:'290px'}),s.name).setHTML(stopHTML(s,i));
        return new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([s.lng,s.lat]).setPopup(popup).addTo(map);
      });
      wpMarkers=waypoints.map(w=>{
        const el=document.createElement('button');el.className='waypoint';el.type='button';el.title=w.name;el.setAttribute('aria-label',w.name);
        const popup=watch(new maplibregl.Popup({offset:12,maxWidth:'270px'}),w.name).setHTML(wpHTML(w));
        return new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([w.lng,w.lat]).setPopup(popup).addTo(map);
      });
      const wrap=document.createElement('div');wrap.style.cssText='width:40px;height:44px;display:grid;place-items:center;z-index:5';
      const man=document.createElement('button');man.className='man';man.type='button';man.innerHTML=manSVG;wrap.appendChild(man);man.title='Where Arion is: '+stops[hereIdx].name;man.setAttribute('aria-label',man.title);
      // clicking Arion opens a small box titled "Arion", saying how far he has walked and in how many days,
      // in the same white box with an X as a stop's box. The distance is the length of the route line drawn on the map,
      // which only goes as far as he has walked. Each piece of the line is measured along the curve of the earth.
      const daysSoFar=Math.max(0,Math.min(dayNow,lastDay));
      const rad=x=>x*Math.PI/180;
      const kmBetween=([lng1,lat1],[lng2,lat2])=>2*6371*Math.asin(Math.sqrt(Math.sin(rad(lat2-lat1)/2)**2+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(rad(lng2-lng1)/2)**2));
      const kmSoFar=Math.round(geo().features.reduce((sum,f)=>{
        const c=f.geometry.coordinates; for(let k=1;k<c.length;k++) sum+=kmBetween(c[k-1],c[k]); return sum;},0));
      const manPopup=watch(new maplibregl.Popup({maxWidth:'290px',offset:[0,-58]}),"Arion")
        .setHTML(`<h2 class="popup-title">Arion</h2><p style="margin:8px 0 0">Arion has travelled ${kmSoFar} km in ${daysSoFar} ${daysSoFar===1?'day':'days'}.</p>`);
      man.addEventListener('click',e=>{e.stopPropagation(); if(!manPopup.isOpen()) manPopup.setLngLat([stops[hereIdx].lng,stops[hereIdx].lat]).addTo(map);});
      new maplibregl.Marker({element:wrap,anchor:'bottom',offset:[0,-14]}).setLngLat([stops[hereIdx].lng,stops[hereIdx].lat]).addTo(map);
      fit(0);
      // The map is ready: switch on the buttons and slider, showing which layers are on.
      layerBtns.forEach(b=>{
        if(b.dataset.layer==='politics'&&!GR) return;
        b.disabled=false;
        b.setAttribute('aria-pressed', String({politics:politicsOn,geography:geographyOn,route:routeOn}[b.dataset.layer]));
      });
      slider.disabled=false;
    });
  }catch(e){
    console.error('The map could not load',e);
  }
})();
