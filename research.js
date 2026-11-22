// The research archive on the desk: a two-step wooden file stand with a manila folder per research project (from
// CONFIG.research). Hovering a folder lifts it out of its slot; clicking it opens a paper-style overview (title block,
// abstract, figures, sections, GitHub link) over the page. outro.js places the stand and routes its raycasts here.
import * as THREE from "three";
import { CONFIG } from "./config.js";

const R = CONFIG.research || [];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

// ---------------------------------------------------------------- folder cover (manila card, printed label, stamp)
function cover(r, i) {
  const [c, g] = canvas(512, 720);
  g.fillStyle = "#d9b98a"; g.fillRect(0, 0, 512, 720);
  for (let k = 0; k < 5000; k++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? "120,85,40" : "255,240,210"},${Math.random() * 0.12})`; g.fillRect(Math.random() * 512, Math.random() * 720, 2, 2); }
  // tab on top (drawn as part of the texture; the mesh has the tab shape)
  g.fillStyle = "#cfac78"; g.fillRect(0, 0, 512, 70);
  g.fillStyle = "#3a2a14"; g.font = '700 30px "JetBrains Mono", monospace'; g.textBaseline = "middle";
  g.fillText(r.tab, i ? 250 : 40, 38);
  // archive label
  g.fillStyle = "#fbf6ea"; g.fillRect(48, 140, 416, 300);
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 2; g.strokeRect(48, 140, 416, 300);
  g.fillStyle = r.color; g.fillRect(48, 140, 416, 16);
  g.fillStyle = "#5b4a33"; g.font = '600 20px "JetBrains Mono", monospace'; g.textBaseline = "alphabetic";
  g.fillText(`FILE ${r.code} · ${r.kind.toUpperCase()}`, 70, 196);
  g.fillStyle = "#1d1710"; g.font = '400 52px "Anton", sans-serif';
  g.fillText(r.tab, 70, 262);
  g.font = '500 19px "Inter", sans-serif'; g.fillStyle = "#3d3324";
  const words = r.title.split(":").slice(-1)[0].trim().split(" "); let line = "", y = 302;
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > 370 && line) { g.fillText(line, 70, y); y += 26; line = w; if (y > 410) break; } else line = t; }
  if (line && y <= 410) g.fillText(line, 70, y);
  // ruled lines + stamp
  g.strokeStyle = "rgba(60,40,15,.25)"; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(70, 500 + k * 36); g.lineTo(440, 500 + k * 36); g.stroke(); }
  g.save(); g.translate(360, 610); g.rotate(-0.18);
  g.strokeStyle = r.color; g.fillStyle = r.color; g.lineWidth = 5; g.strokeRect(-110, -36, 220, 72);
  g.font = '700 30px "JetBrains Mono", monospace'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(r.period.replace(/\s/g, ""), 0, 2);
  g.restore();
  return tex(c);
}

function stand() {
  const wood = new THREE.MeshStandardMaterial({ color: "#7a5434", roughness: 0.7 }), dark = new THREE.MeshStandardMaterial({ color: "#5c3d24", roughness: 0.75 });
  const g = new THREE.Group(), W = 0.5, D = 0.36;
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  box(W, 0.025, D, wood, 0, 0.0125, 0);                                     // base
  for (const sx of [-1, 1]) {                                               // stepped side panels
    const s = new THREE.Shape(); s.moveTo(-D / 2, 0); s.lineTo(D / 2, 0); s.lineTo(D / 2, 0.16); s.lineTo(0.02, 0.16); s.lineTo(0.02, 0.3); s.lineTo(-D / 2, 0.3); s.closePath();
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false }), dark);
    m.rotation.y = Math.PI / 2; m.position.set(sx * W / 2 - (sx > 0 ? 0.02 : 0), 0, 0); m.castShadow = true; g.add(m);
  }
  box(W, 0.16, 0.018, wood, 0, 0.08, D / 2 - 0.009);                        // front lip (low step)
  box(W, 0.3, 0.018, wood, 0, 0.15, 0.011);                                 // middle wall (high step)
  box(W, 0.3, 0.018, dark, 0, 0.15, -D / 2 + 0.009);                        // back
  // brass label plate
  const [c, gx] = canvas(256, 64); gx.fillStyle = "#c9a45c"; gx.fillRect(0, 0, 256, 64); gx.fillStyle = "#3a2a10"; gx.font = '700 24px "JetBrains Mono", monospace'; gx.textAlign = "center"; gx.textBaseline = "middle"; gx.fillText("RESEARCH", 128, 34);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.042), new THREE.MeshStandardMaterial({ map: tex(c), metalness: 0.5, roughness: 0.35 }));
  plate.position.set(0, 0.085, D / 2 + 0.001); g.add(plate);
  return g;
}

function folderMesh(r, i) {
  const w = 0.42, h = 0.5;
  const s = new THREE.Shape();                                              // folder outline with a tab on top
  const tx = i ? 0.06 : -0.19, tw = 0.14;
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h);
  s.lineTo(tx + tw + 0.02, h); s.lineTo(tx + tw, h + 0.05); s.lineTo(tx, h + 0.05); s.lineTo(tx - 0.02, h); s.lineTo(-w / 2, h); s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  const uv = geo.attributes.uv, pos = geo.attributes.position;               // map the cover texture over the whole outline
  for (let k = 0; k < pos.count; k++) uv.setXY(k, (pos.getX(k) + w / 2) / w, pos.getY(k) / (h + 0.05));
  const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: cover(r, i), roughness: 0.85, side: THREE.DoubleSide }));
  front.castShadow = true;
  const g = new THREE.Group(); g.add(front);
  for (let k = 1; k <= 3; k++) {                                            // pages peeking out behind the cover
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.03, h - 0.02), new THREE.MeshStandardMaterial({ color: k % 2 ? "#f3efe4" : "#e9e3d4", roughness: 0.9 }));
    p.position.set(0.004 * k, h / 2 + 0.008 * k, -0.006 * k); g.add(p);
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: "#c9a774", roughness: 0.9 }));
  back.position.set(0, h / 2, -0.03); g.add(back);
  front.userData.research = r.id; g.children.forEach((o) => (o.userData.research = r.id));
  return g;
}

export function makeArchive() {
  const group = new THREE.Group();
  group.add(stand());
  // the back folder stands on the high step, the front one in the low slot
  const slots = [{ y: 0.03, z: 0.1, rx: -0.12 }, { y: 0.15, z: -0.08, rx: -0.08 }];
  const folders = R.slice(0, 2).map((r, i) => {
    const f = folderMesh(r, i); const sl = slots[i];
    f.position.set(i ? 0.015 : -0.01, sl.y, sl.z); f.rotation.x = sl.rx;
    f.userData = { id: r.id, baseY: sl.y, lift: 0, label: `Open research · ${r.tab}` };
    group.add(f); return f;
  });
  let hot = null;
  return {
    group,
    pick(ray) {
      const hit = ray.intersectObjects(folders, true)[0];
      return hit ? folders.find((f) => f.userData.id === hit.object.userData.research)?.userData : null;
    },
    setHot(id) { hot = id; },
    update(dt) {
      for (const f of folders) {
        const want = f.userData.id === hot ? 0.09 : 0;
        f.userData.lift += (want - f.userData.lift) * (1 - Math.exp(-dt * 12));
        f.position.y = f.userData.baseY + f.userData.lift;
      }
    },
    topWorld(v) { return group.localToWorld(v.set(0, 0.62, 0)); },
  };
}

// ---------------------------------------------------------------- the paper overlay
let root = null, current = "";
function build() {
  root = document.createElement("div");
  root.className = "rp"; root.hidden = true; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Research archive");
  root.innerHTML = `<div class="rp-scrim" data-close></div>
    <div class="rp-shell">
      <header class="rp-bar"><span class="rp-crumb">Research archive</span>
        <nav class="rp-tabs">${R.map((r) => `<button type="button" data-id="${r.id}"><i style="background:${r.color}"></i>${esc(r.code)} · ${esc(r.tab)}</button>`).join("")}</nav>
        <button type="button" class="rp-x" data-close aria-label="Close">×</button></header>
      <article class="rp-paper" tabindex="-1"></article>
    </div>`;
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) close();
    const t = e.target.closest(".rp-tabs button"); if (t) show(t.dataset.id);
  });
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
}
function paperHTML(r) {
  const sec = (s) => `<section><h2>${esc(s.h)}</h2>${s.p ? `<p>${esc(s.p)}</p>` : ""}${s.list ? `<ul>${s.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${s.table ? `<div class="rp-tw"><table><thead><tr>${s.table.head.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${s.table.rows.map((row) => `<tr>${row.map((x) => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}${s.note ? `<p class="rp-note">${esc(s.note)}</p>` : ""}</section>`;
  const fig = (f) => `<figure><a href="${esc(f.src)}" target="_blank" rel="noopener"><img src="${esc(f.src)}" alt="" loading="lazy"></a><figcaption>${esc(f.caption)}</figcaption></figure>`;
  const [first, ...rest] = r.figures || [];
  return `<p class="rp-kicker" style="--c:${r.color}">${esc(r.kind)} · File ${esc(r.code)} · ${esc(r.period)}</p>
    <h1>${esc(r.title)}</h1>
    <p class="rp-auth">${esc(r.authors)}</p><p class="rp-aff">${esc(r.affil)}</p>
    <p class="rp-status"><b>Status</b> ${esc(r.status)}</p>
    <div class="rp-abs"><h3>Abstract</h3><p>${esc(r.abstract)}</p><p class="rp-kw"><b>Keywords:</b> ${r.keywords.map(esc).join(" · ")}</p></div>
    ${first ? fig(first) : ""}
    ${r.sections.map(sec).join("")}
    ${rest.map(fig).join("")}
    <footer class="rp-links">${r.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.22 1.88.87 2.34.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>${esc(l.label)} ↗</a>`).join("")}</footer>`;
}
function show(id) {
  const r = R.find((x) => x.id === id) || R[0]; if (!r) return;
  current = r.id;
  const paper = root.querySelector(".rp-paper");
  paper.innerHTML = paperHTML(r); paper.scrollTop = 0; root.querySelector(".rp-shell").scrollTop = 0;
  root.querySelectorAll(".rp-tabs button").forEach((b) => b.setAttribute("aria-current", b.dataset.id === r.id ? "true" : "false"));
}
export function openPaper(id) {
  if (!root) build();
  show(id); root.hidden = false; document.documentElement.classList.add("rp-open");
  requestAnimationFrame(() => root.querySelector(".rp-paper").focus({ preventScroll: true }));
}
function close() { root.hidden = true; document.documentElement.classList.remove("rp-open"); }
