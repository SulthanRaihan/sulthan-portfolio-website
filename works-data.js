// The items of the Work section, from config, and their card pictures. An item with `image` uses that picture;
// without one a placeholder card is drawn (project mock-up, certificate, polaroid, skill tile with its logo).
import { CONFIG } from "./config.js";

const ICONS = "https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/";
const INK = "#061a2b", BLUE = "#2f9bff";

export function allItems() {
  const w = CONFIG.works;
  return {
    web: w.projects.map((p, i) => ({ ...p, type: "project", cat: "web", id: `web-${i}` })),
    skills: w.skills.map((s, i) => ({ ...s, type: "skill", cat: "skills", id: `skill-${i}` })),
    certs: w.certificates.map((c, i) => ({ ...c, type: "cert", cat: "certs", id: `cert-${i}` })),
    moments: w.moments.map((m, i) => ({ ...m, type: "moment", cat: "moments", id: `moment-${i}` })),
  };
}
export const catLabel = (cat) => CONFIG.works.chapters.find((c) => c.key === cat)?.title || cat;
export const metaLine = (it) => it.type === "project" ? `${it.kind} · ${it.year}` : it.type === "cert" ? `${it.issuer} · ${it.year}` : it.type === "moment" ? `${it.place} · ${it.year}` : it.name;

const fontsReady = Promise.all(['400 60px "Anton"', '600 40px "Inter"', '500 20px "JetBrains Mono"', 'italic 400 60px "Instrument Serif"']
  .map((f) => document.fonts.load(f).catch(() => {})));
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function wrap(g, text, x, y, maxW, lh, maxLines = 3) {
  let line = "", n = 0;
  for (const word of text.split(" ")) {
    const t = line ? `${line} ${word}` : word;
    if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = word; if (++n >= maxLines - 1) break; } else line = t;
  }
  if (line) g.fillText(line, x, y);
}
const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function projectCard(it, i) {
  const [c, g] = canvas(1200, 760), [a, b] = it.color || [BLUE, INK];
  const bg = g.createLinearGradient(0, 0, 1200, 760); bg.addColorStop(0, a); bg.addColorStop(1, b);
  g.fillStyle = bg; g.fillRect(0, 0, 1200, 760);
  const r = rand(i + 7);
  if (/app/i.test(it.kind) && /mobile/i.test(it.kind)) {           // phone mock-up
    g.fillStyle = "rgba(255,255,255,.95)"; rr(g, 760, 70, 300, 600, 44); g.fill();
    g.fillStyle = a; rr(g, 780, 130, 260, 150, 18); g.fill();
    for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? "rgba(6,26,43,.12)" : "rgba(6,26,43,.22)"; rr(g, 780, 300 + k * 80, 260, 60, 14); g.fill(); }
    g.fillStyle = INK; rr(g, 870, 88, 80, 16, 8); g.fill();
  } else {                                                              // browser window
    g.fillStyle = "rgba(255,255,255,.95)"; rr(g, 560, 80, 580, 420, 22); g.fill();
    g.fillStyle = "rgba(6,26,43,.08)"; g.fillRect(560, 120, 580, 2);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, k) => { g.fillStyle = col; g.beginPath(); g.arc(590 + k * 24, 100, 7, 0, 7); g.fill(); });
    g.fillStyle = a; rr(g, 590, 150, 300, 150, 14); g.fill();
    g.fillStyle = INK; rr(g, 590, 320, 220 + r() * 60, 22, 6); g.fill();
    g.fillStyle = "rgba(6,26,43,.25)"; rr(g, 590, 356, 360, 14, 6); g.fill(); rr(g, 590, 380, 300, 14, 6); g.fill();
    g.fillStyle = b; rr(g, 590, 420, 140, 46, 23); g.fill();
    g.fillStyle = "rgba(6,26,43,.1)"; rr(g, 910, 150, 200, 316, 14); g.fill();
  }
  g.fillStyle = "#fff"; g.font = '400 92px "Anton", sans-serif'; g.textBaseline = "alphabetic";
  wrap(g, it.title.toUpperCase(), 60, 560, 640, 92, 2);
  g.font = '500 24px "JetBrains Mono", monospace'; g.fillStyle = "rgba(255,255,255,.8)";
  g.fillText(`${it.kind} · ${it.year}`.toUpperCase(), 60, 700);
  return c;
}
function certCard(it) {
  const [c, g] = canvas(1200, 850);
  g.fillStyle = "#fbf7ee"; g.fillRect(0, 0, 1200, 850);
  g.strokeStyle = INK; g.lineWidth = 4; g.strokeRect(36, 36, 1128, 778); g.lineWidth = 1.5; g.strokeRect(52, 52, 1096, 746);
  g.textAlign = "center"; g.fillStyle = INK;
  g.font = '400 64px "Anton", sans-serif'; g.letterSpacing = "14px"; g.fillText("CERTIFICATE", 600, 190); g.letterSpacing = "0px";
  g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = "rgba(6,26,43,.6)"; g.fillText("OF COMPLETION", 600, 236);
  g.font = 'italic 400 84px "Instrument Serif", Georgia, serif'; g.fillStyle = INK; wrap(g, it.title, 600, 400, 960, 86, 2);
  g.font = '500 30px "Inter", sans-serif'; g.fillStyle = "rgba(6,26,43,.75)"; g.fillText(`${it.issuer} — ${it.year}`, 600, 600);
  g.fillStyle = "rgba(6,26,43,.2)"; g.fillRect(380, 650, 440, 2);
  g.fillStyle = BLUE; g.beginPath(); g.arc(1010, 690, 70, 0, 7); g.fill();          // seal with a sparkle
  g.fillStyle = "#fff"; g.beginPath(); const s = 40, k = 6;
  g.moveTo(1010, 690 - s); g.quadraticCurveTo(1010 + k, 690 - k, 1010 + s, 690); g.quadraticCurveTo(1010 + k, 690 + k, 1010, 690 + s);
  g.quadraticCurveTo(1010 - k, 690 + k, 1010 - s, 690); g.quadraticCurveTo(1010 - k, 690 - k, 1010, 690 - s); g.fill();
  g.textAlign = "left";
  return c;
}
function momentCard(it, i) {
  const [c, g] = canvas(820, 1000), r = rand(i * 31 + 5);
  g.fillStyle = "#fdfcf9"; g.fillRect(0, 0, 820, 1000);
  const skies = [["#ffb36b", "#ff5f7e"], ["#7bd3ff", "#2f9bff"], ["#ffd56b", "#ff8a3d"], ["#b69bff", "#3b2a8a"], ["#7df0c4", "#1a8a7a"]][i % 5];
  const sky = g.createLinearGradient(0, 40, 0, 780); sky.addColorStop(0, skies[0]); sky.addColorStop(1, skies[1]);
  g.fillStyle = sky; g.fillRect(40, 40, 740, 740);
  g.fillStyle = "rgba(255,255,255,.75)"; g.beginPath(); g.arc(200 + r() * 420, 230 + r() * 120, 60 + r() * 40, 0, 7); g.fill();
  for (let k = 0; k < 3; k++) {                                          // hills
    g.fillStyle = `rgba(6,26,43,${0.25 + k * 0.22})`; g.beginPath(); g.moveTo(40, 780);
    for (let x = 40; x <= 780; x += 20) g.lineTo(x, 560 + k * 60 + Math.sin(x * 0.01 + k * 2 + r() * 0.2) * (40 - k * 8));
    g.lineTo(780, 780); g.fill();
  }
  g.fillStyle = INK; g.font = 'italic 400 64px "Instrument Serif", Georgia, serif'; g.fillText(it.title, 60, 880);
  g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = "rgba(6,26,43,.6)"; g.fillText(`${it.place} · ${it.year}`.toUpperCase(), 60, 935);
  return c;
}
async function skillCard(it) {
  const [c, g] = canvas(600, 600);
  g.fillStyle = "#ffffff"; rr(g, 0, 0, 600, 600, 70); g.fill();
  const svg = it.icon ? await fetch(ICONS + it.icon + ".svg").then((r) => (r.ok ? r.text() : null)).catch(() => null) : null;
  const col = it.color || INK;
  if (svg) {
    const img = await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", `<svg fill="${col}" `)));
    if (img) g.drawImage(img, 170, 110, 260, 260);
  } else {                                                                // monogram fallback
    g.fillStyle = col; rr(g, 170, 110, 260, 260, 60); g.fill();
    g.fillStyle = "#fff"; g.font = '400 150px "Anton", sans-serif'; g.textAlign = "center"; g.fillText(it.name.slice(0, 2).toUpperCase(), 300, 300); g.textAlign = "left";
  }
  g.fillStyle = INK; g.font = '600 52px "Inter", sans-serif'; g.textAlign = "center"; g.fillText(it.name, 300, 480); g.textAlign = "left";
  return c;
}

// → a canvas or an <img> (its own aspect ratio)
export async function cardPicture(it, i = 0) {
  await fontsReady;
  if (it.image) { const img = await loadImg(it.image); if (img) return img; }
  if (it.type === "project") return projectCard(it, i);
  if (it.type === "cert") return certCard(it);
  if (it.type === "moment") return momentCard(it, i);
  return skillCard(it);
}
export const pictureURL = (p) => (p instanceof HTMLCanvasElement ? p.toDataURL("image/jpeg", 0.88) : p.src);
