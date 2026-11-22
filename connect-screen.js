// "Plug me in" screen for the CRT: a pixel monitor, a pixel globe and a cable with a plug.
// Drawn on a tiny 360×270 canvas, then scaled ×4 without smoothing, so every shape is made of crisp square pixels.
import * as THREE from "three";

export const LW = 360, LH = 270;
const K = 4;          // upscale → 1440×1080 texture
const P = 3;          // one sprite cell = 3 low-res px
const COL = { navy: "#061a2b", ink: "#d6ecff", dim: "#3e5c7a", blue: "#2f9bff", deep: "#0b3463", off: "#0d2c4a", white: "#ffffff" };

const MONITOR = [
  ".XXXXXXXXXXXXXXXXXXXX.",
  "X....................X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X.SSSSSSSSSSSSSSSSSS.X",
  "X....................X",
  "X..............XX.XX.X",
  ".XXXXXXXXXXXXXXXXXXXX.",
  ".........XXXX.........",
  ".........XXXX.........",
  "......XXXXXXXXXX......",
  "......XXXXXXXXXX......",
];
const PLUG = [            // cable enters on the left, contacts face right
  "..XXXXXX.",
  "XXXBBBBXX",
  "XXXBBBBX.",
  "XXXBBBBXX",
  "..XXXXXX.",
];
// globe: built from maths instead of typed out — outline, equator, two latitudes, a meridian and its ellipse
const GN = 17;
const GLOBE = (() => {
  const g = [], c = (GN - 1) / 2;
  for (let j = 0; j < GN; j++) {
    let row = "";
    for (let i = 0; i < GN; i++) {
      const dx = i - c, dy = j - c, r = Math.hypot(dx, dy), inside = r < c + 0.2;
      const outline = Math.abs(r - c + 0.3) < 0.62;
      const lat = inside && (j === c || j === 4 || j === GN - 5);
      const mer = inside && (i === c || Math.abs((dx / 3.6) ** 2 + (dy / c) ** 2 - 1) < 0.2);
      row += outline || lat || mer ? "X" : ".";
    }
    g.push(row);
  }
  return g;
})();

export const LAYOUT = {
  mon: { x: 52, y: 64 },
  port: { x: 52 + 22 * P, y: 64 + 6 * P },
  globe: { x: 244, y: 66 },
  socket: { x: 236, y: 66 + 8 * P + 1 },
  rest: { x: 100, y: 146 },                 // where the plug hangs before anyone takes it
};
LAYOUT.target = { x: LAYOUT.socket.x - 31, y: LAYOUT.socket.y - 7 };   // plug position when it sits in the socket

function sprite(g, rows, x, y, colors) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => {
    if (colors[ch]) { g.fillStyle = colors[ch]; g.fillRect(x + i * P, y + j * P, P, P); }
  }));
}
// crisp pixel text: render with a pixel font, keep only solid pixels (no grey anti-aliasing)
function pixelText(g, text, y, size, color) {
  const c = document.createElement("canvas"); c.width = LW; c.height = size * 2;
  const t = c.getContext("2d");
  t.font = `400 ${size}px "Silkscreen", monospace`; t.textBaseline = "top"; t.textAlign = "left";
  const w = Math.round(t.measureText(text).width);
  t.fillStyle = "#fff"; t.fillText(text, Math.round((LW - w) / 2), 1);
  const d = t.getImageData(0, 0, c.width, c.height).data;
  g.fillStyle = color;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (d[(j * c.width + i) * 4 + 3] > 110) g.fillRect(i, y + j, 1, 1);
}
// cable: a sagging quadratic curve stamped with 2×2 pixels
function cable(g, a, b, sag, color) {
  const mx = (a.x + b.x) / 2, my = Math.max(a.y, b.y) + sag;
  const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 1.4) + 8;
  g.fillStyle = color;
  for (let k = 0; k <= n; k++) {
    const t = k / n, u = 1 - t;
    g.fillRect(Math.round(u * u * a.x + 2 * u * t * mx + t * t * b.x), Math.round(u * u * a.y + 2 * u * t * my + t * t * b.y), 2, 2);
  }
}

export function makeConnectScreen(config) {
  const lo = document.createElement("canvas"); lo.width = LW; lo.height = LH;
  const g = lo.getContext("2d");
  const hi = document.createElement("canvas"); hi.width = LW * K; hi.height = LH * K;
  const h = hi.getContext("2d"); h.imageSmoothingEnabled = false;
  const tex = new THREE.CanvasTexture(hi);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;

  // captions never change: draw once, stamp every frame
  const cap = document.createElement("canvas"); cap.width = LW; cap.height = LH;
  const cg = cap.getContext("2d");
  pixelText(cg, config.connect[0], 180, 24, "#cfe3f7");
  pixelText(cg, config.connect[1], 212, 16, "#a9c6e4");

  let lastKey = "";
  function draw({ plug = LAYOUT.rest, near = 0, done = false, time = 0 } = {}) {
    const key = done ? "" : `${Math.round(plug.x)},${Math.round(plug.y)},${near > 0.15},${near > 0.6}`;
    if (key && key === lastKey && near <= 0.15) return;      // nothing visible changed → no redraw, no GPU upload
    lastKey = key;
    const { mon, port, globe, socket, target } = LAYOUT;
    g.fillStyle = COL.navy; g.fillRect(0, 0, LW, LH);

    sprite(g, MONITOR, mon.x, mon.y, { X: COL.ink, S: done ? COL.blue : COL.off });

    if (!done) {                                              // dashed arrow towards the globe
      g.fillStyle = near > 0.15 ? COL.ink : COL.dim;
      for (let x = 136; x < 214; x += 8) g.fillRect(x, 90, 4, 2);
      for (let k = 0; k < 6; k++) { g.fillRect(214 + k, 84 + k, 2, 2); g.fillRect(214 + k, 96 - k, 2, 2); }
    }

    const gc = done ? COL.white : near > 0.15 ? COL.ink : COL.dim;
    if (done) { g.fillStyle = COL.deep; g.beginPath(); g.arc(globe.x + 8.5 * P, globe.y + 8.5 * P, 7.6 * P, 0, Math.PI * 2); g.fill(); }
    sprite(g, GLOBE, globe.x, globe.y, { X: gc });
    if (!done && near > 0.15) {                               // pulsing ring of pixels around the globe
      const r = 36 + Math.sin(time * 6) * 3, cx = globe.x + 8.5 * P, cy = globe.y + 8.5 * P;
      g.fillStyle = COL.blue;
      for (let a = 0; a < Math.PI * 2; a += 0.085) g.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 2, 2);
    }

    // socket
    g.fillStyle = done || near > 0.6 ? COL.blue : COL.navy; g.fillRect(socket.x - 4, socket.y - 6, 8, 12);
    g.fillStyle = gc;
    g.fillRect(socket.x - 6, socket.y - 8, 12, 2); g.fillRect(socket.x - 6, socket.y + 6, 12, 2);
    g.fillRect(socket.x - 6, socket.y - 8, 2, 16); g.fillRect(socket.x + 4, socket.y - 8, 2, 16);

    // cable + plug
    const end = done ? target : plug;
    cable(g, port, { x: end.x, y: end.y + 7 }, done ? 4 : 28 - near * 16, done ? COL.blue : COL.ink);
    sprite(g, PLUG, end.x, end.y, { X: COL.ink, B: COL.blue });
    if (done) {                                               // data packets running down the cable
      g.fillStyle = COL.white;
      for (let k = 0; k < 3; k++) {
        const t = (time * 0.9 + k / 3) % 1;
        g.fillRect(Math.round(port.x + (end.x - port.x) * t), Math.round(port.y + 6 + 5 * Math.sin(t * Math.PI)), 3, 3);
      }
    }

    g.drawImage(cap, 0, 0);
    h.drawImage(lo, 0, 0, hi.width, hi.height);
    tex.needsUpdate = true;
  }
  draw();
  return { tex, draw };
}
