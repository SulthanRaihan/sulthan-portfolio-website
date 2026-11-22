// (03) Journey: the education & experience story as one big canvas of giant rows, pinned while the scroll pans a
// "camera" across it: first the headline, then down to row 1, along it, diagonally to row 2, and so on (turns are
// rounded). Letters rise out of their masks as they come into view, tape strips lay down on the photos, the
// hand-drawn arrows between rows draw themselves. Layout in px is measured here; looks are in journey.css.
import { CONFIG } from "./config.js";

const J = CONFIG.journey;
const root = document.getElementById("journey");
const stage = root.querySelector(".jr-stage"), canvas = root.querySelector(".jr-canvas");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const chars = (text, from = 0) => [...text].map((ch, i) => `<span class="clip" style="--i:${from + i}"><span class="char">${ch === " " ? "&nbsp;" : esc(ch)}</span></span>`).join("");

// ---------------------------------------------------------------- placeholder photos (until real ones are added)
function placeholder(row, k) {
  const c = document.createElement("canvas"); c.width = 600; c.height = 740;
  const g = c.getContext("2d");
  const pal = [["#2f9bff", "#0b3463"], ["#ff8a3d", "#7a1f06"], ["#7b61ff", "#1b1050"], ["#16c79a", "#06302a"], ["#ff4f79", "#3a0718"]][(row + k) % 5];
  const gr = g.createLinearGradient(0, 0, 600, 740); gr.addColorStop(0, pal[0]); gr.addColorStop(1, pal[1]);
  g.fillStyle = gr; g.fillRect(0, 0, 600, 740);
  g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 10; g.lineJoin = "round";             // a camera outline
  g.beginPath(); g.roundRect(180, 250, 240, 170, 26); g.stroke();
  g.beginPath(); g.arc(300, 335, 50, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(245, 250); g.lineTo(265, 220); g.lineTo(335, 220); g.lineTo(355, 250); g.stroke();
  g.fillStyle = "#fff"; g.textAlign = "center";
  g.font = '600 34px "Inter", sans-serif'; g.fillText("your photo here", 300, 510);
  g.font = '500 24px "JetBrains Mono", monospace'; g.globalAlpha = 0.8; g.fillText(J.rows[row].badge, 300, 556);
  return c.toDataURL("image/jpeg", 0.85);
}
const ARROW = `<svg class="jr-arrow" viewBox="0 0 400 220" aria-hidden="true"><path class="ln" pathLength="1" d="M10 20 C 120 10, 230 40, 300 120 S 360 190, 385 200"/><path class="hd" pathLength="1" d="M352 196 L387 201 L372 168"/></svg>`;

// ---------------------------------------------------------------- markup
canvas.innerHTML = `
  <div class="jr-title">
    <p class="jr-tag">${esc(J.tag)}</p>
    <h2 class="jr-head" aria-label="${esc(J.headline.join(" "))}">${J.headline.map((l) => `<span class="line">${chars(l)}</span>`).join("")}</h2>
  </div>
  ${J.rows.map((r, i) => `
  <div class="jr-row" data-row="${i}">
    ${r.group ? `<p class="jr-group">${esc(r.group)}</p>` : ""}
    <h3 class="jr-giant" aria-label="TO ${esc(r.word)} — ${esc(r.place)}">
      <span class="jr-index" aria-hidden="true"><svg viewBox="0 0 60 60"><path pathLength="1" d="M30 5c14 0 25 10 25 24 0 15-12 26-26 26C15 55 5 44 6 30 7 16 17 6 31 7"/></svg><b>${i + 1}</b></span>
      <span class="jr-word">${chars("TO")}</span>
      <span class="jr-slot" aria-hidden="true" style="--tilt:${[3, -4, 5, -3, 4][i % 5]}deg"><img alt=""><span class="jr-tape"></span></span>
      <span class="jr-word">${chars(r.word, 2)}</span>
    </h3>
    <figure class="jr-prop jr-photo2" aria-hidden="true" style="--r:${[-8, 7, -6, 9, -7][i % 5]}deg"><img alt=""><span class="jr-tape"></span></figure>
    <div class="jr-prop jr-info" style="--r:${[-3, 2.5, -2, 3, -2.5][i % 5]}deg">
      <span class="jr-tape"></span>
      <span class="jr-chip">${esc(r.stage)}</span>
      <b>${esc(r.place)}</b>
      <span class="jr-city">${esc(r.city)}</span>
      <span class="jr-years">${esc(r.years)}</span>
      <p>${esc(r.detail)}</p>
    </div>
    <svg class="jr-prop jr-badge" viewBox="0 0 200 200" aria-hidden="true" style="--r:${[12, -10, 8, -14, 10][i % 5]}deg">
      <defs><path id="jr-ring-${i}" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0"/></defs>
      <circle cx="100" cy="100" r="96" class="b-out"/><circle cx="100" cy="100" r="56" class="b-in"/>
      <text class="b-ring"><textPath href="#jr-ring-${i}">${esc((r.ring || "").repeat(3)).slice(0, 120)}</textPath></text>
      <text class="b-mid" x="100" y="112" text-anchor="middle">${esc(r.badge)}</text>
    </svg>
    <p class="jr-prop jr-note" aria-hidden="true">${r.note.map((l) => `<span>${esc(l)}</span>`).join("")}</p>
  </div>
  ${i < J.rows.length - 1 ? `<div class="jr-arrowbox" data-after="${i}">${ARROW}</div>` : ""}`).join("")}`;

const rows = [...canvas.querySelectorAll(".jr-row")], arrows = [...canvas.querySelectorAll(".jr-arrowbox")];
const title = canvas.querySelector(".jr-title");
rows.forEach((row, i) => {
  const imgs = row.querySelectorAll("img");
  imgs.forEach((img, k) => (img.src = J.rows[i].photos[k] || placeholder(i, k)));
});

// ---------------------------------------------------------------- layout: a staircase of rows, measured in px
let path = [], total = 0, W = 0, H = 0;
function layout() {
  W = stage.clientWidth; H = stage.clientHeight;
  const fs = Math.min(H * 0.34, W * (W < 700 ? 0.36 : 0.24));
  canvas.style.setProperty("--fs", `${fs}px`);
  const inset = Math.max(20, W * 0.05);
  // headline centred at the top of the canvas
  title.style.left = `${(W - title.offsetWidth) / 2}px`; title.style.top = "0px";
  let top = title.offsetHeight + H * 0.5, left = inset + fs * 0.25;
  const stops = [{ x: 0, y: title.offsetHeight / 2 - H * 0.5 }];
  rows.forEach((row, i) => {
    row.style.left = `${left}px`; row.style.top = `${top}px`;
    const rw = row.offsetWidth, rh = row.offsetHeight;
    // everything that belongs to the row (props hang outside its box)
    let minX = left, maxX = left + rw, minY = top, maxY = top + rh;
    const rr = row.getBoundingClientRect();                     // (the badge is an SVG: no offsetLeft, so rects)
    row.querySelectorAll(".jr-prop, .jr-info, .jr-group").forEach((p) => {
      const q = p.getBoundingClientRect();
      minX = Math.min(minX, left + q.left - rr.left); maxX = Math.max(maxX, left + q.right - rr.left);
      if (!p.classList.contains("jr-photo2")) { minY = Math.min(minY, top + q.top - rr.top); maxY = Math.max(maxY, top + q.bottom - rr.top); }
    });
    // the whole row (word, label, info card under it) centred vertically, never taller than the screen allows
    const cy = Math.min((minY + maxY) / 2 - H / 2, minY - 70);
    if (maxX - minX <= W - 2 * inset) stops.push({ x: (minX + maxX) / 2 - W / 2, y: cy });
    else { stops.push({ x: minX - inset, y: cy }); stops.push({ x: maxX - (W - inset), y: cy }); }
    // the arrow to the next row starts under this row's end; the next row begins a little left of it (diagonal down)
    const nextLeft = Math.max(inset, maxX - W * 0.62);
    const nextTop = Math.max(top + rh + fs * 0.85, maxY + fs * 0.45);   // never under this row's info card
    const a = arrows[i];
    if (a) { a.style.left = `${maxX - W * 0.5}px`; a.style.top = `${top + rh * 0.92}px`; a.style.width = `${Math.min(W * 0.32, 420)}px`; }
    left = nextLeft; top = nextTop;
  });
  // rounded turns: where the path bends, cut the corner with a short curve (sampled)
  path = [stops[0]];
  for (let i = 1; i < stops.length; i++) {
    const p = stops[i - 1], c = stops[i], n = stops[i + 1];
    if (!n) { path.push(c); break; }
    const d1 = Math.hypot(c.x - p.x, c.y - p.y), d2 = Math.hypot(n.x - c.x, n.y - c.y), r = 0.18 * Math.min(d1, d2);
    if (d1 < 1 || d2 < 1) { path.push(c); continue; }                // no turn to round
    const a = { x: c.x - ((c.x - p.x) / d1) * r, y: c.y - ((c.y - p.y) / d1) * r }, b = { x: c.x + ((n.x - c.x) / d2) * r, y: c.y + ((n.y - c.y) / d2) * r };
    for (let k = 0; k <= 6; k++) { const t = k / 6, u = 1 - t; path.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }); }
  }
  // arc length → scroll length (1 px of path per px of scroll, plus a short hold at the start and the end)
  path.forEach((p, i) => (p.s = i ? path[i - 1].s + Math.hypot(p.x - path[i - 1].x, p.y - path[i - 1].y) : 0));
  total = path[path.length - 1].s;
  root.style.height = `${H + total + H * 0.6}px`;
  dirty = true; kick();
}
function at(s) {
  s = Math.max(0, Math.min(total, s));
  let i = 1; while (i < path.length - 1 && path[i].s < s) i++;
  const a = path[i - 1], b = path[i], t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ---------------------------------------------------------------- reveals: whatever comes into view
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
  { root: null, rootMargin: "0px -6% -10% 0px", threshold: 0.12 });
[title, ...rows, ...arrows, ...canvas.querySelectorAll(".jr-prop, .jr-slot, .jr-word")].forEach((el) => io.observe(el));

// ---------------------------------------------------------------- the camera
let cam = null, raf = 0, dirty = true, visible = false;
function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
function frame() {
  raf = 0;
  const r = root.getBoundingClientRect();
  const s = Math.max(0, -r.top - H * 0.15);                 // a short hold on the headline before panning
  const want = at(s);
  if (!cam || reduce) cam = { ...want };
  else { cam.x += (want.x - cam.x) * 0.12; cam.y += (want.y - cam.y) * 0.12; }   // trails the scroll a little, like scrub
  canvas.style.transform = `translate3d(${(-cam.x).toFixed(1)}px, ${(-cam.y).toFixed(1)}px, 0)`;
  if (Math.abs(want.x - cam.x) > 0.3 || Math.abs(want.y - cam.y) > 0.3 || dirty) { dirty = false; kick(); }
}
addEventListener("scroll", kick, { passive: true });
new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(root);
new ResizeObserver(() => layout()).observe(stage);
document.fonts.ready.then(layout);
