// Measures each day's walk along the route line drawn on the map in maps.js.
// This is the same measurement the "Arion" box on the map uses, so the numbers here match the box.
// Run it from any folder with:  node "C:\Users\Zachar\Documents\Hatra\Crossing Persia Website\measure-route.js"
// It reads the stops, the places passed on the road and the drawn road lines straight out of maps.js,
// so when a new day's stop and road line are added to maps.js, running this again gives the new day's distance.

const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'maps.js'), 'utf8');
// The route data sits between "const P =" and the heading "which day it is on the map" in maps.js.
const start = src.indexOf('const P =');
const end = src.indexOf('/* ================= which day it is on the map');
if (start < 0 || end < 0) throw new Error('Could not find the route data in maps.js');
const { stops, waypoints, roads } = new Function(src.slice(start, end) + '\nreturn {stops, waypoints, roads};')();

// Distance between two points [longitude, latitude] along the curve of the earth, in km.
const rad = x => x * Math.PI / 180;
const kmBetween = ([lng1, lat1], [lng2, lat2]) =>
  2 * 6371 * Math.asin(Math.sqrt(Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2));

// The whole route in travel order: each stop, then any places passed on the road after it.
// The map draws one line from each place to the next: place, the road line's points, next place.
const order = [];
stops.forEach((s, i) => { order.push({ ...s, stopIdx: i }); waypoints.filter(w => w.after === i).forEach(w => order.push(w)); });
const legKm = new Array(stops.length).fill(0);
for (let i = 1; i < order.length; i++) {
  const a = order[i - 1], b = order[i];
  const line = [[a.lng, a.lat], ...(roads[i - 1] || []), [b.lng, b.lat]];
  let km = 0;
  for (let k = 1; k < line.length; k++) km += kmBetween(line[k - 1], line[k]);
  // Add this piece to the overnight stop it leads towards.
  let j = i; while (order[j].stopIdx === undefined) j++;
  legKm[order[j].stopIdx] += km;
}

let total = 0;
console.log('Day | From -> To | km along the map line | running total');
for (let i = 1; i < stops.length; i++) {
  total += legKm[i];
  const day = stops[i].days[0][0].match(/\d+/)[0];
  console.log(`${day} | ${stops[i - 1].name} -> ${stops[i].name} | ${Math.round(legKm[i])} | ${Math.round(total)}`);
}
