// A cork pin board on the wall beside the monitor: your photo pinned in the middle as a polaroid, cards for LinkedIn,
// Email and GitHub around it, a CV ticket and an "open to work" note. Every card is a canvas texture on a plane with a
// push-pin; outro.js picks them with its raycaster, lifts the one under the pointer and runs its action on click.
import * as THREE from "three";
import { CONFIG } from "./config.js";

const W = 1.5, H = 1.04;                                   // board size in scene units (the desk is ~3.1× life size)
const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
const canvas = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

function cork() {
  const [c, g] = canvas(1024, 712);
  g.fillStyle = "#b98a56"; g.fillRect(0, 0, 1024, 712);
  for (let i = 0; i < 26000; i++) {                          // granules
    const s = Math.random() * 3 + 0.6, l = Math.random();
    g.fillStyle = l < 0.45 ? `rgba(90,55,25,${0.25 + Math.random() * 0.35})` : l < 0.8 ? `rgba(220,175,120,${0.2 + Math.random() * 0.3})` : `rgba(60,35,15,${0.3 + Math.random() * 0.3})`;
    g.fillRect(Math.random() * 1024, Math.random() * 712, s, s * (0.6 + Math.random()));
  }
  const v = g.createRadialGradient(512, 356, 200, 512, 356, 640); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(40,20,5,.35)");
  g.fillStyle = v; g.fillRect(0, 0, 1024, 712);
  return c;
}
function paper(g, w, h, color = "#fbf8f1") { g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,.04)"; for (let i = 0; i < 1400; i++) g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
function card({ w = 512, h = 330, bg = "#fbf8f1", draw }) { const [c, g] = canvas(w, h); paper(g, w, h, bg); draw(g, w, h); return c; }
function label(g, text, x, y, size, color = "#061a2b", weight = 600, font = '"Inter", sans-serif') { g.fillStyle = color; g.font = `${weight} ${size}px ${font}`; g.fillText(text, x, y); }

async function polaroid(photoSrc) {
  const [c, g] = canvas(600, 720);
  paper(g, 600, 720, "#fdfdfb");
  const img = photoSrc ? await loadImg(photoSrc) : null;
  g.fillStyle = "#dde3ea"; g.fillRect(40, 40, 520, 520);
  if (img) { const s = Math.max(520 / img.width, 520 / img.height); g.drawImage(img, 40 + (520 - img.width * s) / 2, 40 + (520 - img.height * s) / 2, img.width * s, img.height * s); }
  g.textAlign = "center";
  label(g, CONFIG.name, 300, 625, 54, "#061a2b", 700, '"Caveat", cursive');
  label(g, "hi, that’s me ✦", 300, 680, 34, "#2f9bff", 700, '"Caveat", cursive');
  return c;
}
async function githubCard() {
  const svg = await fetch("https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/github.svg").then((r) => (r.ok ? r.text() : null)).catch(() => null);
  const mark = svg ? await loadImg("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg fill="#ffffff" '))) : null;
  return card({ bg: "#1d2128", draw: (g, w, h) => {
    if (mark) g.drawImage(mark, 40, 48, 92, 92); else label(g, "GH", 48, 120, 64, "#fff", 800);
    label(g, "GitHub", 40, 210, 58, "#ffffff", 700);
    label(g, (CONFIG.desk.links.GitHub || "").replace(/^https?:\/\/(www\.)?/, ""), 40, 266, 26, "rgba(255,255,255,.7)", 500, '"JetBrains Mono", monospace');
  } });
}

// ---------------------------------------------------------------- the board
export async function makePinboard() {
  await Promise.all(['700 40px "Caveat"', '400 40px "Anton"', '600 30px "JetBrains Mono"', '700 40px "Inter"'].map((f) => document.fonts.load(f).catch(() => {})));
  const group = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, H + 0.08, 0.05), new THREE.MeshStandardMaterial({ color: "#6b4a2e", roughness: 0.7 }));
  frame.castShadow = frame.receiveShadow = true; group.add(frame);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshStandardMaterial({ map: tex(cork()), roughness: 0.95 }));
  board.position.z = 0.026; board.receiveShadow = true; group.add(board);

  const links = CONFIG.desk.links, email = CONFIG.cv.email;
  const defs = [
    { id: "photo", canvas: await polaroid(CONFIG.desk.photo), at: [0, 0.02], w: 0.42, rot: -0.04, pin: "#e0453a", label: "That’s me!" },
    { id: "linkedin", at: [-0.46, 0.25], w: 0.36, rot: 0.06, pin: "#2f9bff", label: "Open LinkedIn ↗", href: links.LinkedIn,
      canvas: card({ bg: "#0a66c2", draw: (g) => { g.fillStyle = "#fff"; g.beginPath(); g.roundRect(40, 44, 96, 96, 18); g.fill(); label(g, "in", 58, 120, 72, "#0a66c2", 800); label(g, "LinkedIn", 40, 214, 58, "#fff", 700); label(g, "let’s connect →", 40, 268, 28, "rgba(255,255,255,.8)", 500); } }) },
    { id: "email", at: [-0.46, -0.2], w: 0.38, rot: -0.07, pin: "#f2b33d", label: "Copy my email", copy: email,
      canvas: card({ draw: (g, w) => {
        g.strokeStyle = "#061a2b"; g.lineWidth = 7; g.lineJoin = "round"; g.strokeRect(40, 48, 120, 84); g.beginPath(); g.moveTo(40, 52); g.lineTo(100, 100); g.lineTo(160, 52); g.stroke();
        label(g, "Email", 190, 112, 58, "#061a2b", 700);
        g.font = '600 30px "JetBrains Mono", monospace'; const k = Math.min(1, (w - 80) / g.measureText(email).width);
        g.save(); g.translate(40, 220); g.scale(k, 1); label(g, email, 0, 0, 30, "#2f9bff", 600, '"JetBrains Mono", monospace'); g.restore();
        label(g, "tap to copy ✎", 40, 280, 26, "rgba(6,26,43,.55)", 500);
      } }) },
    { id: "github", canvas: await githubCard(), at: [0.47, 0.24], w: 0.36, rot: -0.05, pin: "#16c79a", label: "Open GitHub ↗", href: links.GitHub },
    { id: "cv", at: [0.47, -0.2], w: 0.36, rot: 0.07, pin: "#e0453a", label: "Download my CV",
      canvas: card({ w: 512, h: 260, bg: "#fff4d6", draw: (g, w, h) => {
        g.setLineDash([10, 8]); g.strokeStyle = "rgba(6,26,43,.35)"; g.lineWidth = 3; g.strokeRect(16, 16, w - 32, h - 32); g.setLineDash([]);
        label(g, "ADMIT ONE", 44, 78, 26, "rgba(6,26,43,.6)", 600, '"JetBrains Mono", monospace');
        label(g, "My CV ↓", 44, 160, 74, "#061a2b", 400, '"Anton", sans-serif');
        label(g, "PDF · 2 pages", 44, 210, 26, "rgba(6,26,43,.6)", 500);
      } }) },
    { id: "note", at: [0.14, -0.39], w: 0.22, rot: -0.12, pin: "#7b61ff", label: "Open to work ✦",
      canvas: card({ w: 360, h: 340, bg: "#ffe066", draw: (g) => { g.textAlign = "left"; label(g, "open to", 34, 120, 70, "#3a2a00", 700, '"Caveat", cursive'); label(g, "work ✦", 34, 200, 70, "#3a2a00", 700, '"Caveat", cursive'); label(g, "freelance · intern", 34, 280, 34, "#6a5200", 700, '"Caveat", cursive'); } }) },
  ];
  const items = [];
  const pinGeo = new THREE.SphereGeometry(0.022, 16, 12), needle = new THREE.CylinderGeometry(0.004, 0.004, 0.04, 6);
  defs.forEach((d, i) => {
    const asp = d.canvas.width / d.canvas.height, w = d.w, h = w / asp;
    const holder = new THREE.Group(); holder.position.set(d.at[0], d.at[1], 0.03 + i * 0.002); holder.rotation.z = d.rot;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(d.canvas), roughness: 0.85 }));
    m.castShadow = true; m.userData = d; holder.add(m);
    const pin = new THREE.Mesh(pinGeo, new THREE.MeshStandardMaterial({ color: d.pin, roughness: 0.3, metalness: 0.1 }));
    pin.position.set(0, h / 2 - 0.045, 0.03); pin.castShadow = true; holder.add(pin);
    const n = new THREE.Mesh(needle, new THREE.MeshStandardMaterial({ color: "#c9c9c9", metalness: 0.8, roughness: 0.3 })); n.rotation.x = Math.PI / 2; n.position.set(0, h / 2 - 0.045, 0.01); holder.add(n);
    group.add(holder); items.push({ mesh: m, holder, def: d, lift: 0 });
  });

  let hot = null;
  return {
    group,
    pick(ray) { const h = ray.intersectObjects(items.map((i) => i.mesh), false)[0]; return h ? items.find((i) => i.mesh === h.object) : null; },
    setHot(item) { hot = item; },
    update(dt) {                                            // the card under the pointer comes off the cork a little
      for (const it of items) {
        it.lift += ((it === hot ? 1 : 0) - it.lift) * Math.min(1, dt * 10);
        it.mesh.position.z = it.lift * 0.035; it.mesh.scale.setScalar(1 + it.lift * 0.05);
        it.mesh.rotation.z = it.lift * -it.def.rot * 0.6;
      }
    },
  };
}
