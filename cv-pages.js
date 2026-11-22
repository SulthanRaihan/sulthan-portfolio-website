// Draws the CV pages (A4, 1240×1754) from config. Used as the paper texture in the printer and for the generated PDF.
const W = 1240, H = 1754, M = 90;
const PAPER = "#fbfbf8", INK = "#061a2b", INK2 = "#5b6b7a", BLUE = "#2f9bff", NAVY = "#061a2b";

function wrap(g, text, x, y, maxW, lh) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); line = word; y += lh; } else line = test;
  }
  if (line) g.fillText(line, x, y);
  return y + lh;
}
function sparkle(g, cx, cy, r, color) {
  const k = r * 0.14;
  g.fillStyle = color; g.beginPath();
  g.moveTo(cx, cy - r); g.quadraticCurveTo(cx + k, cy - k, cx + r, cy); g.quadraticCurveTo(cx + k, cy + k, cx, cy + r);
  g.quadraticCurveTo(cx - k, cy + k, cx - r, cy); g.quadraticCurveTo(cx - k, cy - k, cx, cy - r); g.fill();
}
function topBar(g, cfg, n) {
  g.fillStyle = INK; g.font = '800 30px "JetBrains Mono", monospace'; g.textBaseline = "alphabetic";
  g.fillText("Sulthan", M, 118); g.fillText("Raihan", M, 146);
  g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = INK2; g.textAlign = "right";
  g.fillText(`CV — ${cfg.cv.year} · ${n}/2`, W - M, 140); g.textAlign = "left";
  g.fillStyle = "rgba(6,26,43,.14)"; g.fillRect(M, 186, W - 2 * M, 2);
}
function footer(g, cfg) {
  g.fillStyle = NAVY; g.fillRect(0, H - 230, W, 230);
  g.font = '400 66px "Anton", sans-serif'; g.fillStyle = "#ffffff";
  g.fillText("PAPER IS THE PREVIEW.", M, H - 128);
  g.fillStyle = BLUE; g.fillText(`THE REST IS AT ${cfg.cv.site.toUpperCase()}`, M, H - 52);
  sparkle(g, W - M - 40, H - 118, 46, BLUE);
}

function page1(g, cfg) {
  topBar(g, cfg, 1);
  // name, fitted to the text width
  g.font = '400 250px "Anton", sans-serif';
  const name = cfg.name.toUpperCase(), k = Math.min(1, (W - 2 * M) / g.measureText(name).width);
  g.save(); g.translate(M, 470); g.scale(k, k); g.fillStyle = INK; g.fillText(name, 0, 0); g.restore();
  g.font = '500 44px "Inter", sans-serif'; g.fillStyle = BLUE; g.fillText(cfg.about.role, M, 560);
  g.font = '400 38px "Inter", sans-serif'; g.fillStyle = INK;
  let y = wrap(g, cfg.cv.intro, M, 680, 860, 54);
  // contact rows
  y += 60;
  const rows = [["Email", cfg.cv.email], ...(cfg.cv.email2 ? [["Email", cfg.cv.email2]] : []), ["GitHub", cfg.cv.site], ["Based in", cfg.cv.location]];
  for (const [label, value] of rows) {
    g.fillStyle = "rgba(6,26,43,.14)"; g.fillRect(M, y - 52, W - 2 * M, 2);
    g.font = '500 22px "JetBrains Mono", monospace'; g.fillStyle = INK2; g.fillText(label.toUpperCase(), M, y);
    g.font = '500 36px "Inter", sans-serif'; g.fillStyle = INK; g.fillText(value, M + 300, y);
    y += 84;
  }
  const sy = Math.max(1240, y + 120);                     // under the contact rows, whatever their count
  sparkle(g, W - M - 150, sy, Math.min(150, H - 260 - sy), BLUE);
  sparkle(g, W - M - 330, sy - 120, 46, INK);
  footer(g, cfg);
}

function page2(g, cfg) {
  topBar(g, cfg, 2);
  g.font = '600 56px "Inter", sans-serif'; g.fillStyle = INK; g.fillText("Selected work", M, 290);
  const tw = g.measureText("Selected work").width;
  g.font = '400 26px "Inter", sans-serif'; g.fillStyle = INK2; g.fillText("each one lives on the site", M + tw + 24, 290);
  // 3×2 work tiles
  const cols = 3, gap = 36, tileW = (W - 2 * M - gap * (cols - 1)) / cols, tileH = 230;
  const fills = [["#2f9bff", "#061a2b"], ["#061a2b", "#3b5bdb"], ["#d6ecff", "#2f9bff"], ["#0b3463", "#2f9bff"], ["#2f9bff", "#9cd0ff"], ["#061a2b", "#0b3463"]];
  cfg.cv.work.slice(0, 6).forEach(([title, sub], i) => {
    const x = M + (i % cols) * (tileW + gap), y = 340 + Math.floor(i / cols) * (tileH + 150);
    const gr = g.createLinearGradient(x, y, x + tileW, y + tileH);
    gr.addColorStop(0, fills[i][0]); gr.addColorStop(1, fills[i][1]);
    g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, tileW, tileH, 14); g.fill();
    g.font = '400 120px "Anton", sans-serif'; g.fillStyle = "rgba(255,255,255,.85)"; g.fillText(String(i + 1).padStart(2, "0"), x + 22, y + tileH - 24);
    g.font = '600 28px "Inter", sans-serif'; g.fillStyle = INK; g.fillText(title, x, y + tileH + 46);
    g.font = '400 22px "Inter", sans-serif'; g.fillStyle = INK2; g.fillText(sub, x, y + tileH + 80);
  });
  // three columns
  const colW = (W - 2 * M - 2 * gap) / 3, top = 1130;
  [["Experience", cfg.cv.experience.map(([when, what]) => `${when}  ${what}`)], ["What I do", cfg.cv.services], ["Tools", cfg.cv.tools]].forEach(([head, rows], i) => {
    const x = M + i * (colW + gap);
    g.font = '600 36px "Inter", sans-serif'; g.fillStyle = INK; g.fillText(head, x, top);
    g.font = '400 24px "Inter", sans-serif'; g.fillStyle = INK2;
    let y = top + 56;
    for (const r of rows) y = wrap(g, r, x, y, colW - 10, 34) + 6;
  });
  footer(g, cfg);
}

export function drawCvPage(n, cfg) {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
  (n === 1 ? page1 : page2)(g, cfg);
  return c;
}
