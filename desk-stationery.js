// Desk stationery modelled in code (my own low-poly versions, so the public repository carries no third-party files):
// a ceramic pencil cup with pencils, a spiral notebook with a pen, a stapler, a tape dispenser, a memo pad, a ruler
// and a few brass paper clips. Units match the room (~3.1× life size); the desk top is y = 0.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const mat = (color, roughness = 0.6, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
function mesh(geo, m, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent?.add(o); return o;
}
function place(obj, x, z, rotDeg, y = 0) { obj.position.set(x, y, z); obj.rotation.y = THREE.MathUtils.degToRad(rotDeg); return obj; }

function pencil(color = "#d9a441") {
  const g = new THREE.Group(), L = 0.5;
  mesh(new THREE.CylinderGeometry(0.014, 0.014, L, 6), mat(color, 0.55), 0, L / 2, 0, g);                 // hex body
  mesh(new THREE.ConeGeometry(0.014, 0.05, 6), mat("#e8c9a0", 0.7), 0, L + 0.025, 0, g);                 // sharpened wood
  mesh(new THREE.ConeGeometry(0.005, 0.016, 6), mat("#2a2a2a", 0.4), 0, L + 0.045, 0, g);                // graphite
  mesh(new THREE.CylinderGeometry(0.0145, 0.0145, 0.03, 10), mat("#b9b9b4", 0.3, 0.8), 0, 0.012, 0, g);  // ferrule
  return g;
}
function pencilCup() {
  const g = new THREE.Group(), r = 0.1, h = 0.28;
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(r, 0), new THREE.Vector2(r * 1.04, h), new THREE.Vector2(r * 0.9, h), new THREE.Vector2(r * 0.86, 0.02), new THREE.Vector2(0, 0.02)];
  mesh(new THREE.LatheGeometry(pts, 32), mat("#e7e1d3", 0.35), 0, 0, 0, g);
  mesh(new THREE.TorusGeometry(r * 1.02, 0.006, 6, 32), mat("#2f5f8f", 0.4), 0, h * 0.7, 0, g).rotation.x = Math.PI / 2;   // glaze stripe
  [["#d9a441", 0.03, 0.02, 0.18, 0.1], ["#3c6e47", -0.035, 0.01, -0.12, 0.15], ["#b9412f", 0.0, -0.035, 0.05, -0.2]].forEach(([c, x, z, rx, rz]) => {
    const p = pencil(c); p.position.set(x, 0.02, z); p.rotation.set(rx, 0, rz); g.add(p);
  });
  return g;
}
function notebook() {
  const g = new THREE.Group(), w = 0.33, d = 0.46, t = 0.03;
  const [c, x] = canvas(256, 356);                                         // cover: kraft with a label and a band
  x.fillStyle = "#2f4a5f"; x.fillRect(0, 0, 256, 356); x.fillStyle = "rgba(255,255,255,.06)"; for (let i = 0; i < 900; i++) x.fillRect(Math.random() * 256, Math.random() * 356, 1.5, 1.5);
  x.fillStyle = "#e9e1cf"; x.fillRect(48, 120, 160, 70); x.fillStyle = "#2f4a5f"; x.font = '600 18px "JetBrains Mono", monospace'; x.fillText("NOTES", 60, 150); x.font = '500 13px "JetBrains Mono", monospace'; x.fillText("2026 — 27", 60, 175);
  x.fillStyle = "#c9a45c"; x.fillRect(0, 300, 256, 10);
  const cover = mat("#2f4a5f", 0.8); const top = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.8 });
  const pages = mat("#f2ede0", 0.9);
  const body = mesh(new THREE.BoxGeometry(w, t, d), [pages, pages, top, cover, pages, pages], 0, t / 2, 0, g);
  body.material = [pages, pages, top, cover, pages, pages];
  for (let i = 0; i < 9; i++) mesh(new THREE.TorusGeometry(0.014, 0.003, 6, 12), mat("#9a9a96", 0.3, 0.9), -w / 2 + 0.03 + i * 0.034, t / 2, -d / 2 + 0.008, g).rotation.y = Math.PI / 2;
  const pen = new THREE.Group();                                           // pen lying on the cover
  mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.4, 12), mat("#151515", 0.3), 0, 0, 0, pen);
  mesh(new THREE.ConeGeometry(0.011, 0.04, 12), mat("#c9a45c", 0.3, 0.8), 0, 0.22, 0, pen);
  mesh(new THREE.BoxGeometry(0.006, 0.12, 0.016), mat("#c9a45c", 0.3, 0.8), 0.012, -0.12, 0, pen);
  pen.rotation.set(0, 0, Math.PI / 2); pen.position.set(0.02, t + 0.012, 0.04); pen.rotation.y = 0.7; g.add(pen);
  return g;
}
function stapler() {
  const g = new THREE.Group();
  mesh(new RoundedBoxGeometry(0.42, 0.04, 0.11, 3, 0.015), mat("#262626", 0.5), 0, 0.02, 0, g);           // base
  const arm = mesh(new RoundedBoxGeometry(0.4, 0.06, 0.1, 3, 0.025), mat("#b23a2c", 0.35), 0.0, 0.075, 0, g); arm.rotation.z = 0.04;
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.105, 12), mat("#262626", 0.5), -0.19, 0.06, 0, g).rotation.x = Math.PI / 2;   // hinge
  return g;
}
function tapeDispenser() {
  const g = new THREE.Group();
  mesh(new RoundedBoxGeometry(0.32, 0.1, 0.13, 3, 0.03), mat("#2c2c30", 0.45), 0, 0.05, 0, g);
  const roll = mesh(new THREE.TorusGeometry(0.06, 0.028, 10, 24), new THREE.MeshPhysicalMaterial({ color: "#e9e6da", roughness: 0.2, transmission: 0.3, thickness: 0.02 }), -0.02, 0.15, 0, g);
  mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.06, 16), mat("#d6d0c0", 0.6), -0.02, 0.15, 0, g).rotation.x = Math.PI / 2;
  mesh(new THREE.BoxGeometry(0.03, 0.05, 0.07), mat("#9a9a96", 0.3, 0.8), 0.15, 0.12, 0, g);            // cutter
  return g;
}
function memoPad() {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) mesh(new THREE.BoxGeometry(0.25, 0.006, 0.25), mat(i % 2 ? "#f2d76b" : "#efd05e", 0.9), (Math.random() - 0.5) * 0.004, 0.003 + i * 0.006, (Math.random() - 0.5) * 0.004, g);
  const [c, x] = canvas(256, 256); x.fillStyle = "#f4da70"; x.fillRect(0, 0, 256, 256); x.fillStyle = "#3a3020"; x.font = '700 30px "Caveat", cursive';
  x.fillText("research ✓", 30, 80); x.fillText("thesis ch.3", 30, 130); x.fillText("call home ♥", 30, 180);
  const top = mesh(new THREE.PlaneGeometry(0.25, 0.25), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.9 }), 0, 0.0505, 0, g); top.rotation.x = -Math.PI / 2;
  return g;
}
function ruler() {
  const [c, x] = canvas(1024, 96);
  x.fillStyle = "#d8c08c"; x.fillRect(0, 0, 1024, 96); x.fillStyle = "#3a2a12"; x.font = '500 16px "JetBrains Mono", monospace';
  for (let i = 0; i <= 300; i++) { const px = 12 + i * 3.33, l = i % 10 === 0 ? 30 : i % 5 === 0 ? 20 : 11; x.fillRect(px, 0, 1.4, l); if (i % 10 === 0 && i) x.fillText(String(i / 10), px - 5, 50); }
  const g = new THREE.Group();
  mesh(new THREE.BoxGeometry(0.93, 0.01, 0.09), [mat("#c7ad78"), mat("#c7ad78"), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.55 }), mat("#c7ad78"), mat("#c7ad78"), mat("#c7ad78")], 0, 0.005, 0, g);
  return g;
}
function clips() {
  const g = new THREE.Group(), brass = mat("#c9a45c", 0.3, 0.9);
  const path = new THREE.CurvePath();                                      // one paper clip outline (two nested loops)
  const pts = [[0, 0], [0.07, 0], [0.07, 0.03], [0.005, 0.03], [0.005, 0.006], [0.06, 0.006], [0.06, 0.022], [0.015, 0.022]];
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(pts[i][0], 0, pts[i][1]), new THREE.Vector3(pts[i + 1][0], 0, pts[i + 1][1])));
  const geo = new THREE.TubeGeometry(path, 48, 0.0025, 5, false);
  [[0, 0, 0.2], [0.05, 0.05, -0.6], [-0.04, 0.06, 1.1], [0.02, -0.06, 2.4]].forEach(([x, z, r]) => { const m = mesh(geo, brass, x, 0.003, z, g); m.rotation.y = r; });
  return g;
}

export function makeStationery() {
  const g = new THREE.Group(); g.name = "stationery";
  g.add(place(pencilCup(), -1.15, 1.0, 0));
  g.add(place(notebook(), -0.75, 1.95, 18));
  g.add(place(stapler(), -1.62, 1.05, 50));
  g.add(place(tapeDispenser(), 1.5, 1.25, -35));
  g.add(place(memoPad(), -1.5, 1.6, 12));
  g.add(place(clips(), 0.32, 1.8, 20));
  g.add(place(ruler(), 0.2, 2.0, -4));
  return g;
}
