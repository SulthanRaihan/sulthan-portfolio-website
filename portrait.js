// (02) Portrait: one continuous motion scrubbed by the scroll (scrolling back plays it backwards).
// · the panel arrives full-screen, then its window closes in from the screen edges into the photo box,
//   framed like a viewfinder: corner brackets, a hairline and a file-name tag
// · the two name words ride the frame's sides: as tall as the frame at first, shrinking with it to their own size
// · inside the box, a dark fill climbs over the cover with a stepped pixel edge; the photo rises from the box's bottom
// · the eras, numbered like a code listing, rise out of line masks one after another
import { CONFIG } from "./config.js";
import { makeHeroTexture } from "./crt.js";

const section = document.getElementById("portrait");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const INK = "#061a2b";

// ---------------------------------------------------------------- eases (cubic-bezier like CSS) and timing
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const at = (t) => ((ax * t + bx) * t + cx) * t;
  return (x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 20; i++) { if (at(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return ((ay * t + by) * t + cy) * t;
  };
}
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(t));
const MAIN = bezier(0.625, 0.05, 0, 1), PUNCHY = bezier(0.32, 0.72, 0, 1);
const soft = (t) => 0.5 * MAIN(t) + 0.5 * sine(t);     // the main ease snaps over a long scroll: half of it is a sine
// [start, duration] in screens of scroll after the stage pins
const T = { close: [0, 1.05, soft], photo: [0.3, 0.6, PUNCHY], black: [0.35, 0.8, (t) => t], eras: [1.0, 0.45, PUNCHY] };
const HOLD = 0.35;                                       // the finished composition stays a moment before the page moves on
const BUILD = Math.max(...Object.values(T).map(([s, d]) => s + d));
const seg = ([s, d, e], t) => e(clamp01((t - s) / d));

// ---------------------------------------------------------------- markup from config
const stage = section.querySelector(".pt-stage");
const words = [...section.querySelectorAll(".pt-word")];
words.forEach((w, i) => (w.firstElementChild.textContent = CONFIG.portrait.name[i] || ""));
const erasEl = section.querySelector(".pt-eras");
CONFIG.portrait.eras.forEach(([name, years], n) => {
  const li = document.createElement("li");
  li.innerHTML = `<span class="pt-mask"><span class="pt-era"><em></em><b></b><i></i></span></span>`;
  li.querySelector("em").textContent = String(n + 1).padStart(2, "0");
  li.querySelector("b").textContent = name; li.querySelector("i").textContent = years;
  erasEl.appendChild(li);
});
const eraRows = [...erasEl.querySelectorAll(".pt-era")];
section.querySelector(".pt-sr").textContent = `${CONFIG.portrait.name.join(" ")} — ${CONFIG.portrait.eras.map(([n, y]) => `${n} ${y}`).join(", ")}`;
const canvas = stage.querySelector("canvas"), g = canvas.getContext("2d");
const outline = stage.querySelector(".pt-outline path");

// ---------------------------------------------------------------- images: photo + cover (with stand-ins)
function pixelPortrait() {
  const rows = [
    "......HHHH......", "....HHHHHHHH....", "...HHHHHHHHHH...", "...SSSSSSSSSS...", "...SGGGSSGGGS...", "...SGGGSSGGGS...",
    "...SSSSSSSSSS...", "...SSSSSSSSSS...", "....SSSMMSSS....", ".....SSSSSS.....", "......SSSS......", "....JJJSSJJJ....",
    "..JJJJJJJJJJJJ..", ".JJJJJJWWJJJJJJ.", "JJJJJJJWWJJJJJJJ", "JJJJJJJWWJJJJJJJ",
  ];
  const col = { H: INK, S: "#d6ecff", G: INK, M: "#8fb3d6", J: INK, W: "#ffffff" };
  const c = document.createElement("canvas"); c.width = 640; c.height = 800;
  const x = c.getContext("2d");
  const bg = x.createLinearGradient(0, 0, 0, 800); bg.addColorStop(0, "#2f9bff"); bg.addColorStop(1, "#0b3463");
  x.fillStyle = bg; x.fillRect(0, 0, 640, 800);
  const p = 40, oy = 800 - rows.length * p;
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (col[ch]) { x.fillStyle = col[ch]; x.fillRect(i * p, oy + j * p, p, p); } }));
  return c;
}
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
let photo = null, cover = null;

// ---------------------------------------------------------------- geometry (measured on resize)
let geo = null;
const PAD = 10, GAP_MIN = 18;
function measure() {
  const W = stage.clientWidth, H = stage.clientHeight, narrow = W < 700;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // the photo box, with the eras under it, centred as one block
  const bw = narrow ? W * 0.44 : Math.min(420, Math.max(220, W * 0.21)), bh = bw * 1.24;
  erasEl.style.fontSize = `${Math.max(22, bh * 0.11)}px`;
  const erasH = erasEl.offsetHeight + 18;
  const top = Math.max(narrow ? 90 : 70, (H - (bh + 2 * PAD + erasH)) / 2 + PAD);
  const I1 = { l: (W - bw) / 2, t: top, r: (W + bw) / 2, b: top + bh };
  const F = { l: I1.l - PAD, t: I1.t - PAD, r: I1.r + PAD, b: I1.b + PAD };
  erasEl.style.top = `${F.b + 16}px`;
  // the name: one size for both words, each centred in its side (never closer to the frame than GAP_MIN)
  const Fh = F.b - F.t, margin = Math.max(16, W * 0.03);
  const glyphs = words.map((w) => w.firstElementChild);
  words.forEach((w) => { w.style.transform = ""; w.style.paddingLeft = w.style.paddingRight = ""; });
  let size = (0.42 * Fh) / 0.73;                         // cap height ≈ 0.42 of the frame (JetBrains Mono caps ≈ 0.73em)
  glyphs.forEach((gl) => (gl.style.fontSize = `${size}px`));
  const sides = [F.l, W - F.r];
  const k = Math.min(1, ...glyphs.map((gl, i) => Math.max(0, sides[i] - GAP_MIN - margin) / Math.max(1, gl.offsetWidth)));
  if (k < 1) { size *= k; glyphs.forEach((gl) => (gl.style.fontSize = `${size}px`)); }
  const gaps = glyphs.map((gl, i) => Math.max(GAP_MIN, (sides[i] - gl.offsetWidth) / 2));
  words[0].style.paddingRight = `${gaps[0]}px`; words[1].style.paddingLeft = `${gaps[1]}px`;
  words[0].style.right = `${W - F.l}px`; words[1].style.left = `${F.r}px`;
  words.forEach((w) => (w.style.top = `${(F.t + F.b) / 2 - w.offsetHeight / 2}px`));
  geo = { W, H, I1, F, gaps, glyph: size * 0.73, R0h: H + 2 * PAD };
  draw();
}

// ---------------------------------------------------------------- the scroll → every part
let progress = 0, boil = 0;
function pose(t) {
  return { k: seg(T.close, t), photo: 1 - seg(T.photo, t), black: seg(T.black, t), eras: clamp01((t - T.eras[0]) / T.eras[1]) };
}
const mix = (a, b, k) => a + (b - a) * k;
function frameAt(k) {
  const { W, H, I1, F } = geo;
  const I = { l: mix(0, I1.l, k), t: mix(0, I1.t, k), r: mix(W, I1.r, k), b: mix(H, I1.b, k) };
  return { I, R: { l: I.l - (I1.l - F.l), t: I.t - (I1.t - F.t), r: I.r + (F.r - I1.r), b: I.b + (F.b - I1.b) } };
}
function coverFit(img, x, y, w, h) {
  const s = Math.max(w / img.width, h / img.height), dw = img.width * s, dh = img.height * s;
  g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
// viewfinder corners: an L at each corner of the frame, a little outside it
function frameMarks(R) {
  const L = 26, o = 4, l = R.l - o, t = R.t - o, rr = R.r + o, b = R.b + o;
  return `M${l} ${t + L}V${t}H${l + L}M${rr - L} ${t}H${rr}V${t + L}M${rr} ${b - L}V${b}H${rr - L}M${l + L} ${b}H${l}V${b - L}`;
}

function draw() {
  if (!geo || !photo) return;
  const t = reduce ? BUILD : progress, p = pose(t), { W, H, I1, F, gaps, glyph, R0h } = geo;
  const { I, R } = frameAt(p.k);
  g.clearRect(0, 0, W, H);
  g.save(); g.beginPath(); g.rect(I.l, I.t, I.r - I.l, I.b - I.t); g.clip();
  // the cover shrinks a little with the frame, towards its centre
  const s = 1 - 0.7 * (1 - (R.b - R.t) / R0h), cx = (R.l + R.r) / 2, cy = (R.t + R.b) / 2;
  g.save(); g.translate(cx * (1 - s), cy * (1 - s)); g.scale(s, s); coverFit(cover, 0, 0, W, H); g.restore();
  // the dark front climbs the window in pixel steps: columns of square cells, each column a little ahead or behind
  if (p.black > 0) {
    const bh = I.b - I.t, cell = Math.max(14, (I.r - I.l) / 18), amp = bh * 0.14;
    const front = I.b + amp - p.black * (bh + 2 * amp);
    g.fillStyle = INK;
    for (let x = I.l, i = 0; x < I.r; x += cell, i++) {
      const n = (Math.sin(i * 12.9898 + boil * 0.9) * 43758.5453) % 1, lag = Math.abs(n) * amp * (1 - p.black * p.black);
      const top = Math.round((front + lag - I.t) / cell) * cell + I.t;
      if (top < I.b) g.fillRect(x, top, cell + 0.5, I.b - top);
    }
    // a few loose pixels just above the front
    g.fillStyle = "#2f9bff";
    for (let x = I.l, i = 0; x < I.r && p.black < 0.98; x += cell, i++) {
      const n = Math.abs((Math.sin(i * 7.31 + boil * 1.3) * 9137.13) % 1);
      if (n > 0.72) g.fillRect(x, Math.round((front - cell * (1 + n * 2) - I.t) / cell) * cell + I.t, cell, cell);
    }
  }
  // the photo rides the window's bottom, starting just under it
  if (p.photo < 1) {
    const ox = (I.l + I.r - I1.l - I1.r) / 2, oy = I.b - I1.b + p.photo * (I1.b - I1.t);
    g.save(); g.beginPath(); g.rect(I1.l + ox, I1.t + oy, I1.r - I1.l, I1.b - I1.t); g.clip();
    coverFit(photo, I1.l + ox, I1.t + oy, I1.r - I1.l, I1.b - I1.t); g.restore();
  }
  g.restore();
  // frame: a hairline, viewfinder corners and a file-name tag (off screen at first, so it comes in rather than appears)
  g.strokeStyle = "rgba(47,155,255,.45)"; g.lineWidth = 1; g.strokeRect(R.l + 0.5, R.t + 0.5, R.r - R.l - 1, R.b - R.t - 1);
  outline.setAttribute("d", frameMarks(R));
  if (p.k > 0.6) {
    g.globalAlpha = clamp01((p.k - 0.6) / 0.3);
    g.font = '500 12px "JetBrains Mono", monospace'; g.fillStyle = "#2f9bff"; g.textBaseline = "bottom";
    g.fillText("sulthan.webp", R.l, R.t - 10);
    g.textAlign = "right"; g.fillStyle = "rgba(6,26,43,.5)"; g.fillText(`${Math.round(I1.r - I1.l)}×${Math.round(I1.b - I1.t)}`, R.r, R.t - 10);
    g.textAlign = "left"; g.textBaseline = "alphabetic"; g.globalAlpha = 1;
  }
  // the words: frame-tall at first, shrinking with it; each pivots on the side it hangs from
  const Fh = F.b - F.t, gl = R0h > Fh ? glyph + (R.b - R.t - Fh) * ((R0h - glyph) / (R0h - Fh)) : glyph, sc = gl / glyph;
  const dy = (R.t + R.b - F.t - F.b) / 2;
  // (padding scales with the word, so the shift adds it back: the gap to the frame stays the same)
  words[0].style.transform = `translate(${R.l - F.l + gaps[0] * (sc - 1)}px, ${dy}px) scale(${sc})`;
  words[1].style.transform = `translate(${R.r - F.r - gaps[1] * (sc - 1)}px, ${dy}px) scale(${sc})`;
  words[0].style.visibility = R.l - gaps[0] > 0 ? "" : "hidden";
  words[1].style.visibility = R.r + gaps[1] < W ? "" : "hidden";
  // eras: name and years together, one era after another
  eraRows.forEach((row, i) => {
    const e = PUNCHY(clamp01((p.eras - i * 0.12) / (1 - 0.12 * (eraRows.length - 1))));
    row.style.transform = `translateY(${(1 - e) * 105}%)`;
  });
}

// ---------------------------------------------------------------- loop: scroll position + an 8 fps boil while on screen
let visible = false, raf = 0, lastBoil = -1;
function tick(now) {
  raf = 0;
  if (!visible) return;
  const r = section.getBoundingClientRect();
  progress = Math.max(0, -r.top) / innerHeight;
  const b = Math.floor(now / 125) % 8;                 // 8 drawings, swapped 8 times a second
  if (b !== lastBoil) { lastBoil = b; boil = b; }
  draw();
  raf = requestAnimationFrame(tick);
}
async function init() {
  section.style.setProperty("--build", reduce ? 0 : BUILD + HOLD);
  await document.fonts.load('800 100px "JetBrains Mono"').catch(() => {});
  await document.fonts.load('500 12px "JetBrains Mono"').catch(() => {});
  await document.fonts.load('italic 400 40px "Instrument Serif"').catch(() => {});
  [photo, cover] = await Promise.all([
    CONFIG.portrait.image ? loadImg(CONFIG.portrait.image) : null,
    CONFIG.portrait.cover ? loadImg(CONFIG.portrait.cover) : null,
  ]);
  photo ||= pixelPortrait();
  cover ||= makeHeroTexture(CONFIG).image;              // the monitor's first screen, from the intro
  measure();
  new ResizeObserver(measure).observe(stage);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(tick); }).observe(section);
}
init();
