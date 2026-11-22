// A little two-tone cassette boombox for the desk (modelled here, own design): speakers that pulse while music plays,
// a cassette window with turning reels, and a green LCD that scrolls the current track. Clicking it plays / pauses
// the playlist in music.js; outro.js places it and routes raycasts here.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as music from "./music.js";

const mat = (color, roughness = 0.55, metalness = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
function mesh(geo, m, x, y, z, parent) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }

function grille() {
  const [c, g] = canvas(256, 256);
  g.fillStyle = "#26272b"; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#4a4b52";
  for (let y = 8; y < 256; y += 14) for (let x = 8 + ((y / 14) % 2) * 7; x < 256; x += 14) { const dx = x - 128, dy = y - 128; if (dx * dx + dy * dy < 118 * 118) { g.beginPath(); g.arc(x, y, 3.2, 0, 7); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function makeRadio() {
  const group = new THREE.Group(), W = 0.64, H = 0.34, D = 0.2;
  const body = new THREE.Group(); group.add(body);
  mesh(new RoundedBoxGeometry(W, H * 0.62, D, 4, 0.035), mat("#e3d6bb", 0.5), 0, H * 0.31, 0, body);             // cream lower half
  mesh(new RoundedBoxGeometry(W, H * 0.42, D * 0.98, 4, 0.035), mat("#3f6f78", 0.45), 0, H * 0.75, -0.002, body); // teal top
  // speakers
  const cones = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.2;
    mesh(new THREE.TorusGeometry(0.085, 0.012, 10, 32), mat("#b9ab8c", 0.35, 0.6), x, 0.17, D / 2 + 0.004, body);
    const cone = mesh(new THREE.CircleGeometry(0.082, 32), new THREE.MeshStandardMaterial({ map: grille(), roughness: 0.8 }), x, 0.17, D / 2 + 0.003, body);
    cones.push(cone);
  }
  // cassette window with two reels
  mesh(new THREE.BoxGeometry(0.17, 0.09, 0.01), mat("#141418", 0.2, 0, { transparent: true, opacity: 0.92 }), 0, 0.14, D / 2 + 0.002, body);
  const reels = [-0.04, 0.04].map((x) => {
    const r = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 6), mat("#d9d4c8", 0.4), x, 0.14, D / 2 + 0.008, body);
    r.rotation.x = Math.PI / 2; return r;
  });
  // LCD on the teal band
  const [lc, lg] = canvas(512, 96); const lcdTex = new THREE.CanvasTexture(lc); lcdTex.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.BoxGeometry(0.3, 0.07, 0.01), mat("#1a1f1a", 0.3), 0, 0.27, D / 2 + 0.001, body);
  mesh(new THREE.PlaneGeometry(0.28, 0.055), new THREE.MeshBasicMaterial({ map: lcdTex }), 0, 0.27, D / 2 + 0.007, body);
  // keys on top, handle, antenna
  const keys = ["#c9563f", "#e3d6bb", "#e3d6bb", "#e3d6bb"].map((c, i) => mesh(new RoundedBoxGeometry(0.05, 0.03, 0.06, 2, 0.008), mat(c, 0.5), -0.09 + i * 0.06, H + 0.01, 0.03, body));
  const handle = mesh(new THREE.TorusGeometry(0.2, 0.014, 8, 32, Math.PI), mat("#2b2b30", 0.4, 0.3), 0, H + 0.0, -0.05, body);
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.42, 6), mat("#b9b9b4", 0.25, 0.9), 0.26, H + 0.18, -0.06, body).rotation.z = -0.5;
  // feet
  for (const sx of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, 0.012, D * 0.8), mat("#2b2b30", 0.6), sx * 0.22, 0.006, 0, body);
  body.position.y = 0.006;

  let scroll = 0, text = "", beat = 0, lcdT = 0;
  function drawLcd() {
    const s = music.state(), t = s.track;
    text = t ? `${s.playing ? "▶" : "❚❚"}  ${t.title.toUpperCase()} — ${t.artist.toUpperCase()}     ` : "NO MUSIC     ";
  }
  function paintLcd() {
    lg.fillStyle = "#9fc27a"; lg.fillRect(0, 0, 512, 96);
    lg.fillStyle = "rgba(0,0,0,.06)"; for (let x = 0; x < 512; x += 4) lg.fillRect(x, 0, 1, 96);
    lg.fillStyle = "#1f2f16"; lg.font = '700 44px "JetBrains Mono", monospace'; lg.textBaseline = "middle";
    const w = lg.measureText(text).width || 1, x = -(scroll % w);
    lg.fillText(text, x + 12, 50); lg.fillText(text, x + 12 + w, 50);
    lcdTex.needsUpdate = true;
  }
  drawLcd(); paintLcd();
  addEventListener("hw-music", () => { drawLcd(); paintLcd(); keys[0].position.y = H + (music.state().playing ? 0.0 : 0.01); });

  let hot = false, hover = 0;
  return {
    group,
    pick(ray) { return ray.intersectObject(body, true).length > 0; },
    label: () => (music.state().playing ? `Boombox · ${music.state().track.title}` : "Open the boombox"),
    setHot(h) { hot = h; },
    click(anchor) { music.toggleMenu(anchor); },
    topWorld(v) { return group.localToWorld(v.set(0, H + 0.12, 0)); },
    update(dt) {
      const on = music.state().playing;
      beat += dt * (on ? 7.5 : 0);
      const k = on ? 1 + Math.max(0, Math.sin(beat)) * 0.06 : 1;
      cones.forEach((c) => c.scale.setScalar(k));
      reels.forEach((r) => (r.rotation.y += dt * (on ? 3 : 0)));
      if (on) { scroll += dt * 90; lcdT += dt; if (lcdT > 0.05) { lcdT = 0; paintLcd(); } }
      hover += ((hot ? 1 : 0) - hover) * (1 - Math.exp(-dt * 12));
      body.position.y = 0.006 + hover * 0.03;
    },
  };
}
