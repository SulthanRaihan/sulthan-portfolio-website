// Work tunnel extras: a little orange crab mascot typing at a keyboard where the tunnel starts, and a splash of desk-toy
// props (keyboard switches, keycaps, PlayStation-style symbols, game pads, a cursor, a pixel heart) that bursts out of
// its keyboard as you scroll in and then floats between the cards, all the way down the tunnel. works.js owns the scene,
// the camera and the render loop; this module only builds the meshes and moves them.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05, ...extra });
function box(w, h, d, m, x = 0, y = 0, z = 0, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); parent?.add(o); return o; }

// ---------------------------------------------------------------- the mascot
const ORANGE = "#d97757";
function makeMascot() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const skin = std(ORANGE, { roughness: 0.6 }), dark = std("#1d1b22", { roughness: 0.4 });
  box(1.0, 0.56, 0.46, skin, 0, 0.42, 0, body);                         // the blocky body
  for (const x of [-0.2, 0.2]) box(0.075, 0.15, 0.02, dark, x, 0.5, 0.235, body);   // two tall pixel eyes
  for (const x of [-0.38, -0.22, 0.22, 0.38]) box(0.08, 0.2, 0.1, skin, x, 0.08, -0.04, body);  // four little legs
  // arms: reach forward from the sides onto the keys
  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.52, 0.42, 0.05); body.add(pivot);
    box(0.16, 0.13, 0.42, skin, 0, 0, 0.2, pivot);
    return pivot;
  });
  // keyboard in front
  const kb = new THREE.Group(); kb.position.set(0, 0.04, 0.62); g.add(kb);
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.5, 0.08, 0.5, 2, 0.03), std("#2b2f3a")); kb.add(base);
  const keyGeo = new RoundedBoxGeometry(0.095, 0.06, 0.095, 1, 0.02), keys = [];
  const cream = std("#ece6da"), accent = std(ORANGE), teal = std("#5fb7a8");
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const m = (r === 0 && c === 0) || (r === 3 && c === 11) ? accent : r === 2 && c === 10 ? teal : cream;
    const k = new THREE.Mesh(keyGeo, m); k.position.set(-0.6 + c * 0.11, 0.06, -0.17 + r * 0.115); kb.add(k); keys.push(k);
  }
  const space = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.06, 0.095, 1, 0.02), cream); space.position.set(0, 0.06, 0.29); kb.add(space); keys.push(space);
  base.scale.z = 1.25; base.position.z = 0.06;
  // code glyphs that float up off the keys while it types
  const glyphs = ["</>", "{ }", ";", "01", "=>", "⌘", "()"].map((txt, i) => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 64; const x = c.getContext("2d");
    x.font = '700 40px "JetBrains Mono", monospace'; x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = i % 3 === 0 ? "#ffb48f" : i % 3 === 1 ? "#d6ecff" : "#9fe6d6"; x.fillText(txt, 64, 34);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(0.36, 0.18, 1); g.add(s); s.userData.t = i / 7; return s;
  });
  g.rotation.x = 0.32;                                                  // tipped toward the camera so the keys show

  let next = 0, pressed = null;
  function update(dt, now, typing) {
    const t = now / 1000;
    body.position.y = Math.abs(Math.sin(t * 7)) * 0.025 * typing;      // bobs with each keystroke
    arms[0].rotation.x = 0.35 + Math.max(0, Math.sin(t * 14)) * 0.35 * typing;
    arms[1].rotation.x = 0.35 + Math.max(0, Math.sin(t * 14 + Math.PI)) * 0.35 * typing;
    if (t > next) {                                                     // press a random key
      next = t + 0.07 + Math.random() * 0.08;
      if (pressed) pressed.position.y = 0.06;
      pressed = keys[(Math.random() * keys.length) | 0]; pressed.position.y = 0.06 - 0.025 * typing;
    }
    for (const s of glyphs) {
      s.userData.t = (s.userData.t + dt * 0.35) % 1; const k = s.userData.t;
      s.position.set(Math.sin(k * 9 + s.id) * 0.5, 0.75 + k * 1.1, 0.4);
      s.material.opacity = typing * Math.sin(k * Math.PI) * 0.9;
    }
  }
  return { group: g, update };
}

// ---------------------------------------------------------------- the props (shared geometry + materials)
const PS = { tri: "#38d7a8", circ: "#ff5c70", cross: "#6fa8ff", sq: "#ff92d0" };
let SHARED = null;
function shared() {
  if (SHARED) return SHARED;
  const ringShape = (pts, inset) => {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const c = pts.reduce((a, [x, y]) => [a[0] + x / pts.length, a[1] + y / pts.length], [0, 0]);
    s.holes.push(new THREE.Path(pts.map(([x, y]) => new THREE.Vector2(c[0] + (x - c[0]) * inset, c[1] + (y - c[1]) * inset)).reverse()));
    return s;
  };
  const ext = (shape) => { const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2 }); geo.center(); return geo; };
  const r = 0.2, tri = [[0, r], [r * 0.87, -r * 0.5], [-r * 0.87, -r * 0.5]];
  const heart = new THREE.Shape(); heart.moveTo(0, -0.16); heart.bezierCurveTo(-0.3, 0.02, -0.14, 0.24, 0, 0.1); heart.bezierCurveTo(0.14, 0.24, 0.3, 0.02, 0, -0.16);
  const cursor = new THREE.Shape([[0, 0], [0, -0.3], [0.08, -0.22], [0.14, -0.34], [0.19, -0.31], [0.13, -0.2], [0.23, -0.2]].map(([x, y]) => new THREE.Vector2(x, y)));
  SHARED = {
    geo: {
      tri: ext(ringShape(tri, 0.55)), sq: ext(ringShape([[-0.16, 0.16], [0.16, 0.16], [0.16, -0.16], [-0.16, -0.16]], 0.6)),
      circ: new THREE.TorusGeometry(0.16, 0.042, 12, 36), bar: new RoundedBoxGeometry(0.42, 0.085, 0.07, 2, 0.03),
      heart: ext(heart), cursor: ext(cursor),
      swBase: new RoundedBoxGeometry(0.34, 0.13, 0.34, 2, 0.03), swTop: new RoundedBoxGeometry(0.28, 0.12, 0.28, 2, 0.04),
      stemA: new THREE.BoxGeometry(0.13, 0.12, 0.04), stemB: new THREE.BoxGeometry(0.04, 0.12, 0.13),
      cap: new RoundedBoxGeometry(0.42, 0.22, 0.42, 3, 0.07), capTop: new THREE.PlaneGeometry(0.3, 0.3),
      padBody: new RoundedBoxGeometry(0.66, 0.24, 0.16, 3, 0.08), grip: new THREE.CapsuleGeometry(0.085, 0.16, 6, 12),
      stick: new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), btn: new THREE.SphereGeometry(0.028, 12, 8), dpad: new THREE.BoxGeometry(0.12, 0.035, 0.03),
    },
    mat: {
      tri: std(PS.tri, { emissive: PS.tri, emissiveIntensity: 0.25 }), circ: std(PS.circ, { emissive: PS.circ, emissiveIntensity: 0.25 }),
      cross: std(PS.cross, { emissive: PS.cross, emissiveIntensity: 0.25 }), sq: std(PS.sq, { emissive: PS.sq, emissiveIntensity: 0.25 }),
      heart: std("#ff5a6e", { emissive: "#ff5a6e", emissiveIntensity: 0.3 }), white: std("#f4f5f8"), dark: std("#25262e"),
      clear: std("#cfd8e6", { roughness: 0.15, transparent: true, opacity: 0.75 }),
      stems: ["#e0463f", "#3b7bff", "#a06a3c", "#e8c93a"].map((c) => std(c)),
      caps: ["#ece6da", ORANGE, "#5fb7a8", "#2b2f3a"].map((c) => std(c)),
    },
    letters: {},
  };
  return SHARED;
}
function letterMat(txt, dark) {
  const S = shared(), key = txt + dark; if (S.letters[key]) return S.letters[key];
  const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
  x.font = `700 ${txt.length > 1 ? 40 : 58}px "Inter", sans-serif`; x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = dark ? "#2b2f3a" : "#f4f5f8"; x.fillText(txt, 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (S.letters[key] = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
}

const LETTERS = ["ESC", "⌘", "A", "S", "D", "W", "↵", "fn", "Z", "K"];
function makeProp(kind, r) {
  const S = shared(), G = S.geo, M = S.mat, g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); g.add(o); return o; };
  if (kind === "switch") {
    add(G.swBase, M.dark); add(G.swTop, M.clear, 0, 0.11, 0);
    const stem = M.stems[(r() * 4) | 0]; add(G.stemA, stem, 0, 0.21, 0); add(G.stemB, stem, 0, 0.21, 0);
  } else if (kind === "cap") {
    const i = (r() * 4) | 0; add(G.cap, M.caps[i]);
    add(G.capTop, letterMat(LETTERS[(r() * LETTERS.length) | 0], i === 0), 0, 0.112, 0, -Math.PI / 2);
  } else if (kind === "pad") {
    add(G.padBody, M.white);
    add(G.grip, M.white, -0.24, -0.12, 0, 0, 0.5); add(G.grip, M.white, 0.24, -0.12, 0, 0, -0.5);
    add(G.stick, M.dark, -0.1, -0.04, 0.09, Math.PI / 2); add(G.stick, M.dark, 0.1, -0.04, 0.09, Math.PI / 2);
    add(G.dpad, M.dark, -0.2, 0.04, 0.085); add(G.dpad, M.dark, -0.2, 0.04, 0.085, 0, Math.PI / 2);
    [[0.2, 0.09, M.tri], [0.25, 0.04, M.circ], [0.2, -0.01, M.cross], [0.15, 0.04, M.sq]].forEach(([x, y, m]) => add(G.btn, m, x, y, 0.08));
  } else if (kind === "tri") add(G.tri, M.tri);
  else if (kind === "circ") add(G.circ, M.circ);
  else if (kind === "sq") add(G.sq, M.sq);
  else if (kind === "cross") { add(G.bar, M.cross, 0, 0, 0, 0, Math.PI / 4); add(G.bar, M.cross, 0, 0, 0, 0, -Math.PI / 4); }
  else if (kind === "heart") add(G.heart, M.heart);
  else add(G.cursor, M.white);
  return g;
}
const KINDS = ["switch", "switch", "switch", "cap", "cap", "tri", "circ", "cross", "sq", "pad", "heart", "cursor"];

// ---------------------------------------------------------------- the whole splash
// origin: where the mascot sits; zFrom / zTo: the stretch of tunnel the props spread over
// zones: [near z, far z] of each chapter's cards; the first one gets the biggest share (that's the splash you watch)
export function makeSplash({ origin, zones, count, size = 1, mascotScale = 1 }) {
  const mascot = makeMascot();
  mascot.group.position.copy(origin); mascot.group.scale.setScalar(mascotScale);
  const props = new THREE.Group(), list = [], r = rand(42);
  for (let i = 0; i < count; i++) {
    const kind = KINDS[i % KINDS.length], m = makeProp(kind, r);
    const first = Math.round(count * 0.4), per = Math.ceil((count - first) / Math.max(1, zones.length - 1));
    const zi = i < first ? 0 : 1 + Math.floor((i - first) / per), n = zi === 0 ? first : per, j = zi === 0 ? i : (i - first) % per;
    const [z0, z1] = zones[Math.min(zi, zones.length - 1)], z = z0 + (z1 - z0) * (j + r() * 0.8) / n;
    const a = r() * Math.PI * 2, rad = 2.4 + r() * 2.2;
    const s = size * (kind === "pad" ? 1.25 : 1) * (0.85 + r() * 0.45);
    m.userData = { home: new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad * 0.8, z), delay: r() * 0.45, s,
      spin: new THREE.Vector3((r() - 0.5) * 1.2, (r() - 0.5) * 1.6, (r() - 0.5) * 0.8), rot0: new THREE.Euler(r() * 6, r() * 6, r() * 6), bob: r() * 6 };
    m.rotation.copy(m.userData.rot0);
    props.add(m); list.push(m);
  }
  // the flash of the pop: a soft orange-white glow sprite
  const fc = document.createElement("canvas"); fc.width = fc.height = 256;
  { const x = fc.getContext("2d"), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,200,160,.9)"); gr.addColorStop(0.6, "rgba(217,119,87,.35)"); gr.addColorStop(1, "rgba(217,119,87,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256); }
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: ft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flash.position.set(origin.x, origin.y + 0.35, origin.z + 0.2); flash.visible = false;
  props.add(flash);
  const from = new THREE.Vector3(origin.x, origin.y + 0.2, origin.z + 0.6), tmp = new THREE.Vector3();
  let time = 0;
  // burst 0 → 1: the props shoot out of the keyboard to their spots; eye: the camera's z
  function update(dt, now, { burst, eye, motion }) {
    time += dt * motion;
    const dm = eye - origin.z;
    // the pop: it puffs up and shakes (burst 0.08 → 0.3), then bursts in a flash (0.3 → 0.4) and the props fly out
    const puff = smooth(0.08, 0.3, burst), gone = smooth(0.3, 0.4, burst);
    const shake = puff * (1 - gone) * 0.05;
    mascot.group.scale.setScalar(mascotScale * (1 + puff * 0.35) * (1 - gone) + 0.0001);
    mascot.group.position.set(origin.x + Math.sin(now * 0.09) * shake, origin.y + Math.cos(now * 0.11) * shake, origin.z);
    mascot.group.visible = gone < 0.99 && dm > 0.3 && dm < 24;
    const fl = smooth(0.28, 0.36, burst) * (1 - smooth(0.36, 0.55, burst));
    flash.visible = fl > 0.01; flash.material.opacity = fl; flash.scale.setScalar(0.5 + smooth(0.28, 0.55, burst) * 4.5);
    burst = clamp01((burst - 0.3) / 0.7);                            // the props only leave once it has popped
    mascot.update(dt, now, motion * (1 - smooth(0.6, 1, burst) * 0.6));
    for (const m of list) {
      const u = m.userData, k = easeOut(clamp01((burst - u.delay) / (1 - u.delay)));
      tmp.lerpVectors(from, u.home, k);
      tmp.y += Math.sin(time * 0.9 + u.bob) * 0.06 + Math.sin(k * Math.PI) * 0.8;   // arcs up as it flies
      m.position.copy(tmp);
      m.rotation.set(u.rot0.x + time * u.spin.x + k * 4, u.rot0.y + time * u.spin.y, u.rot0.z + time * u.spin.z);
      const d = eye - m.position.z, fade = smooth(22, 14, d) * smooth(0.2, 1.4, d);
      const sc = u.s * fade * (0.15 + 0.85 * k);
      m.visible = sc > 0.01 && k > 0; m.scale.setScalar(Math.max(sc, 0.0001));
    }
  }
  return { mascot: mascot.group, props, update };
}
