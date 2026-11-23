// Aiko in 3D: a chibi built from primitives with toon shading, after the sticker sheet — dark long hair with an
// ahoge, white cat-ear headphones with glowing lavender rings, a white suit with the cat logo, big violet eyes.
// The face is a canvas on the front of the head, so expressions swap by redrawing it.
// Left alone she wanders the desk on her own ("gabut"): walks between spots, hops, spins, sits, peeks at the monitor,
// walks over the keyboard, and dozes off when nobody plays with her. Talking to her stops her and turns her to you.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// the rigged, animated model (rigged in Blender from the single-pose sculpt); the primitive chibi below is the
// fallback if it cannot load, and stays as an invisible hit-box for clicks
const MODEL_URL = "assets/models/aiko.glb";

const SCALE = 0.42;                    // her height on the desk (the monitor is 1.3 tall)
const INK = "#2b1d24", WHITE = "#dcd8ec", LAV = "#8f86ff", SKIN = "#ffe6db";

// spots on the desk she likes to go to (x, z); the keyboard is walkable (she climbs onto the keys)
const SPOTS = [[0, 0.74], [-0.5, 0.74], [0.55, 0.74], [-1.0, 0.62], [-1.05, 1.3], [0.98, 0.45], [0.92, 1.3], [0, 1.72], [-0.45, 1.62], [0.62, 1.82], [0, 1.15], [-0.35, 1.08], [0.38, 1.2]];
const onKeyboard = (x, z) => Math.abs(x) < 0.66 && z > 0.94 && z < 1.36;
const groundAt = (x, z) => (onKeyboard(x, z) ? 0.087 : 0);

function toonGradient() {
  const t = new THREE.DataTexture(new Uint8Array([70, 150, 230, 255]), 4, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}

// ---------------------------------------------------------------- the face, drawn
function drawFace(g, mood, talk) {
  const W = 512, H = 420;
  g.clearRect(0, 0, W, H);
  const eye = (cx, cy, kind) => {
    if (kind === "closed") { g.strokeStyle = "#3a2440"; g.lineWidth = 12; g.lineCap = "round"; g.beginPath(); g.moveTo(cx - 40, cy + 8); g.quadraticCurveTo(cx, cy + 30, cx + 40, cy + 8); g.stroke(); return; }
    if (kind === "happy") { g.strokeStyle = "#3a2440"; g.lineWidth = 13; g.lineCap = "round"; g.beginPath(); g.moveTo(cx - 40, cy + 18); g.quadraticCurveTo(cx, cy - 26, cx + 40, cy + 18); g.stroke(); return; }
    const up = kind === "up" ? -14 : 0;
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cx, cy, 56, 70, 0, 0, Math.PI * 2); g.fill();
    const gr = g.createLinearGradient(0, cy - 60, 0, cy + 60); gr.addColorStop(0, "#2a1a4a"); gr.addColorStop(1, "#8a72f0");
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy + 5 + up, 47, 61, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1b1030"; g.beginPath(); g.ellipse(cx, cy + 8 + up, 22, 31, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#fff"; g.beginPath(); g.ellipse(cx - 17, cy - 20 + up, 16, 20, -0.4, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx + 17, cy + 27 + up, 8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#2b1622"; g.lineWidth = 12; g.lineCap = "round";                 // lashes
    g.beginPath(); g.ellipse(cx, cy + 2, 58, 72, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  };
  const L = 168, R = 344, Y = 205;
  const left = mood === "sleep" ? "closed" : mood === "happy" ? "happy" : mood === "think" ? "up" : "open";
  const right = mood === "wink" ? "happy" : left;
  eye(L, Y, left); eye(R, Y, right);
  g.fillStyle = "rgba(255,120,150,.35)";                                                 // blush
  g.beginPath(); g.ellipse(118, 292, 38, 20, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(394, 292, 38, 20, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#7a2a3a"; g.strokeStyle = "#5a1f2c"; g.lineWidth = 7; g.lineCap = "round";
  if (talk || mood === "happy" || mood === "wink") {                                  // open smile
    g.beginPath(); g.moveTo(232, 300); g.quadraticCurveTo(256, talk ? 352 : 340, 280, 300); g.closePath(); g.fill();
    g.fillStyle = "#ff8fa3"; g.beginPath(); g.ellipse(256, talk ? 330 : 322, 12, 7, 0, 0, Math.PI * 2); g.fill();
  } else if (mood === "sleep") { g.beginPath(); g.ellipse(256, 312, 9, 7, 0, 0, Math.PI * 2); g.stroke(); }
  else if (mood === "think") { g.beginPath(); g.moveTo(240, 314); g.lineTo(272, 308); g.stroke(); }
  else { g.beginPath(); g.moveTo(240, 306); g.quadraticCurveTo(256, 320, 272, 306); g.stroke(); }
}

function catLogo() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#c9c4ff"; g.beginPath(); g.roundRect(14, 22, 100, 86, 22); g.fill();
  g.fillStyle = "#fff"; g.beginPath(); g.moveTo(30, 54); g.lineTo(38, 26); g.lineTo(54, 44); g.lineTo(74, 44); g.lineTo(90, 26); g.lineTo(98, 54);
  g.quadraticCurveTo(100, 94, 64, 94); g.quadraticCurveTo(28, 94, 30, 54); g.fill();
  g.fillStyle = "#6b5fe0"; g.beginPath(); g.arc(50, 66, 5, 0, 7); g.arc(78, 66, 5, 0, 7); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function spriteText(text, color = "#8f86ff") {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"); g.font = "bold 46px 'Caveat', 'Inter', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 8; g.fillText(text, 32, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
}

export function makeAiko3D() {
  const grad = toonGradient();
  const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra });
  const glow = (color, k = 2.2) => new THREE.MeshToonMaterial({ color, emissive: color, emissiveIntensity: k, gradientMap: grad });
  const mWhite = toon(WHITE), mInk = toon(INK), mSkin = toon(SKIN), mDark = toon("#3a3550"), mLav = glow(LAV), mLavSoft = toon("#c9c4ff");
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };

  const root = new THREE.Group(); root.scale.setScalar(SCALE);
  const body = new THREE.Group(); root.add(body);

  // legs (pivot at the hip) with boots and a glowing ring
  const leg = (side) => {
    const p = new THREE.Group(); p.position.set(0.075 * side, 0.3, 0);
    p.add(mesh(new THREE.CapsuleGeometry(0.055, 0.13, 6, 12), mWhite, 0, -0.12, 0));
    p.add(mesh(new THREE.CapsuleGeometry(0.065, 0.05, 6, 12), mDark, 0, -0.25, 0.02));
    const ring = mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 20), mLav, 0, -0.2, 0); ring.rotation.x = Math.PI / 2; p.add(ring);
    body.add(p); return p;
  };
  const legL = leg(-1), legR = leg(1);

  // the suit: a bell, a glowing hem, the cat logo, a dark collar
  const suit = mesh(new THREE.LatheGeometry([[0, 0.27], [0.21, 0.28], [0.2, 0.33], [0.165, 0.45], [0.125, 0.55], [0.1, 0.59], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y)), 28), mWhite);
  body.add(suit);
  const hem = mesh(new THREE.TorusGeometry(0.205, 0.014, 8, 32), mLav, 0, 0.285, 0); hem.rotation.x = Math.PI / 2; body.add(hem);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), new THREE.MeshBasicMaterial({ map: catLogo(), transparent: true }));
  logo.position.set(0, 0.44, 0.158); logo.rotation.x = -0.28; body.add(logo);
  const collar = mesh(new THREE.TorusGeometry(0.085, 0.02, 8, 20), mDark, 0, 0.585, 0); collar.rotation.x = Math.PI / 2; body.add(collar);

  // arms (pivot at the shoulder): puffy sleeve, dark band, white glove
  const arm = (side) => {
    const p = new THREE.Group(); p.position.set(0.13 * side, 0.535, 0);
    p.add(mesh(new THREE.CapsuleGeometry(0.055, 0.1, 6, 12), mWhite, 0.02 * side, -0.09, 0));
    const band = mesh(new THREE.TorusGeometry(0.052, 0.014, 8, 16), mDark, 0.025 * side, -0.15, 0); band.rotation.x = Math.PI / 2; p.add(band);
    p.add(mesh(new THREE.SphereGeometry(0.058, 14, 12), mWhite, 0.03 * side, -0.2, 0.01));
    p.rotation.z = 0.28 * side; body.add(p); return p;
  };
  const armL = arm(-1), armR = arm(1);

  // head
  const head = new THREE.Group(); head.position.y = 0.6; body.add(head);
  const HC = 0.24;                                                     // head centre above the neck
  const skull = mesh(new THREE.SphereGeometry(0.25, 32, 24), mSkin, 0, HC, 0); skull.scale.set(1, 0.95, 0.95); head.add(skull);
  const faceCanvas = document.createElement("canvas"); faceCanvas.width = 512; faceCanvas.height = 420;
  const faceG = faceCanvas.getContext("2d"), faceTex = new THREE.CanvasTexture(faceCanvas); faceTex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.252, 32, 24, Math.PI / 2 - 0.95, 1.9, Math.PI / 2 - 0.62, 1.12),
    new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false }));
  face.position.y = HC; face.scale.set(1, 0.95, 0.95); head.add(face);
  // hair: a cap open at the face, bangs with tips, side locks, the long back, the ahoge
  const cap = mesh(new THREE.SphereGeometry(0.275, 32, 24, Math.PI / 2 + 0.92, Math.PI * 2 - 1.84, 0, 2.1), mInk, 0, HC + 0.01, -0.005); head.add(cap);
  const bangs = mesh(new THREE.SphereGeometry(0.272, 32, 16, Math.PI / 2 - 1.0, 2.0, 0, 1.18), mInk, 0, HC + 0.01, 0); head.add(bangs);
  for (let i = 0; i < 6; i++) {                                         // a soft, uneven fringe just above the eyes
    const a = Math.PI / 2 - 0.75 + i * 0.3, th = 1.2 + (i % 2) * 0.06;
    const strand = mesh(new THREE.SphereGeometry(0.055, 10, 8), mInk);
    strand.scale.set(0.95, 1.5, 0.45);
    strand.position.set(-Math.cos(a) * Math.sin(th) * 0.262, HC + Math.cos(th) * 0.262 * 0.95, Math.sin(a) * Math.sin(th) * 0.262 * 0.95);
    strand.lookAt(strand.position.x * 3, HC + Math.cos(th) * 0.8, strand.position.z * 3); strand.rotateX(Math.PI / 2); head.add(strand);
  }
  for (const s of [-1, 1]) {                                            // side locks, wavy at the ends
    const lock = mesh(new THREE.CapsuleGeometry(0.06, 0.32, 6, 10), mInk, 0.215 * s, HC - 0.17, 0.05); lock.rotation.z = -0.12 * s; head.add(lock);
    const end = mesh(new THREE.SphereGeometry(0.07, 10, 8), mInk, 0.24 * s, HC - 0.36, 0.06); end.scale.set(1, 0.7, 0.8); head.add(end);
  }
  const back = mesh(new THREE.CapsuleGeometry(0.21, 0.34, 8, 16), mInk, 0, HC - 0.2, -0.1); back.scale.z = 0.55; head.add(back);
  const ahoge = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, HC + 0.26, 0), new THREE.Vector3(0.015, HC + 0.36, 0.02), new THREE.Vector3(0.08, HC + 0.38, 0.07), new THREE.Vector3(0.1, HC + 0.31, 0.09)]), 20, 0.013, 6), mInk);
  head.add(ahoge);
  // headphones with cat ears
  for (const s of [-1, 1]) {
    const cup = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.075, 24), mWhite, 0.275 * s, HC, 0); cup.rotation.z = Math.PI / 2; head.add(cup);
    const ring = mesh(new THREE.TorusGeometry(0.066, 0.013, 8, 24), mLav, 0.315 * s, HC, 0); ring.rotation.y = Math.PI / 2; head.add(ring);
    const disc = mesh(new THREE.CircleGeometry(0.05, 20), mLavSoft, 0.316 * s, HC, 0); disc.rotation.y = (Math.PI / 2) * s; head.add(disc);
    const ear = mesh(new THREE.ConeGeometry(0.075, 0.14, 3), mWhite, 0.17 * s, HC + 0.25, -0.02); ear.rotation.set(-0.15, 0, -0.42 * s); head.add(ear);
    const inner = mesh(new THREE.ConeGeometry(0.045, 0.09, 3), mLav, 0.172 * s, HC + 0.245, 0.012); inner.rotation.copy(ear.rotation); head.add(inner);
  }
  const band = mesh(new THREE.TorusGeometry(0.285, 0.022, 8, 32, Math.PI), mWhite, 0, HC, -0.01); head.add(band);
  const clip = mesh(new THREE.SphereGeometry(0.045, 12, 10), mWhite, 0.15, HC + 0.17, 0.19); head.add(clip);
  // a soft lavender glow that walks with her
  // (kept faint and away from her: a point light this close to the surfaces burns them white)
  const aura = new THREE.PointLight(LAV, 0.035, 0.6, 1); aura.position.set(0, 0.9, 1.4); root.add(aura);

  // floating sprites: zzz when asleep, hearts when poked
  const sprites = [];
  const puff = (text, color) => {
    const s = spriteText(text, color); s.scale.setScalar(0.18); s.position.set((Math.random() - 0.5) * 0.3, 1.1, 0.1);
    s.userData = { life: 0, vx: (Math.random() - 0.5) * 0.2 }; root.add(s); sprites.push(s);
  };

  // ---------------------------------------------------------------- expressions
  let mood = "", talking = false, mouthT = 0, blinkT = 2 + Math.random() * 3, blinking = 0;
  const setMood = (m) => { if (m === mood) return; mood = m; drawFace(faceG, blinking > 0 && m !== "sleep" ? "sleep" : m, false); faceTex.needsUpdate = true; };
  setMood("open");

  // ---------------------------------------------------------------- behaviour
  const pos = new THREE.Vector3(0.55, 0, 0.74), target = new THREE.Vector3(), tmp = new THREE.Vector3();
  let heading = Math.PI * 0.15, act = { name: "idle", t: 0, dur: 2 }, walkPhase = 0, idleFor = 0, chat = false, hover = false, jumpY = 0;
  let poseSit = 0, spin = 0, waveK = 0, baseY = 0;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  function next() {
    if (idleFor > 28) { act = { name: "sleep", t: 0, dur: 1e9 }; return; }
    const r = Math.random();
    if (r < 0.45) { const [x, z] = pick(SPOTS); target.set(x, 0, z); act = { name: "walk", t: 0, dur: 12 }; }
    else if (r < 0.58) act = { name: "look", t: 0, dur: 2.4 };
    else if (r < 0.68) act = { name: "hop", t: 0, dur: 1.4 };
    else if (r < 0.77) act = { name: "spin", t: 0, dur: 1.8 };
    else if (r < 0.88) act = { name: "sit", t: 0, dur: 3 + Math.random() * 3 };
    else { target.set(0, 0, 0.72); act = { name: "peek", t: 0, dur: 12 }; }
  }
  root.position.copy(pos);

  // ---------------------------------------------------------------- the real model + its animation clips
  let model = null, mixer = null, current = null;
  const clips = {};
  // phones can fail the first load under memory pressure (then she fell back to the old primitive chibi): try again
  const loadModel = (tries = 3) => new GLTFLoader().loadAsync(MODEL_URL).catch((e) => {
    if (tries <= 1) throw e;
    return new Promise((ok) => setTimeout(ok, 2500)).then(() => loadModel(tries - 1));
  });
  loadModel().then((g) => {
    model = g.scene; model.scale.setScalar(1.05);
    const small = innerWidth < 800 || matchMedia("(pointer: coarse)").matches, done = new Set();
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true; o.frustumCulled = false;
      for (const m of [].concat(o.material)) for (const k of ["map", "emissiveMap"]) {   // phones: 2048² → 1024² textures
        const t = m?.[k], im = t?.image;
        if (!small || !im || done.has(t) || Math.max(im.width, im.height) <= 1024) continue;
        const c = document.createElement("canvas"), r = 1024 / Math.max(im.width, im.height);
        c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        t.image = c; t.needsUpdate = true; done.add(t);
      }
    });
    root.add(model); body.visible = false;
    mixer = new THREE.AnimationMixer(model);
    for (const c of g.animations) clips[c.name] = mixer.clipAction(c);
    if (clips.jump) { clips.jump.setLoop(THREE.LoopOnce); clips.jump.clampWhenFinished = true; }
    play("idle", 0);
  }).catch((e) => console.warn("Aiko model not loaded, using the built-in one", e));
  function play(name, fade = 0.25) {
    const a = clips[name] || clips.idle;
    if (!a || a === current) return;
    a.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (current) current.fadeOut(fade);
    current = a;
  }

  function update(dt, now, camera) {
    act.t += dt; idleFor += dt;
    let moving = false, wantHeading = heading, wantSit = 0, armWave = 0;
    const toCam = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z);
    if (chat) { wantHeading = toCam; armWave = act.name === "hello" && act.t < 1.6 ? 1 : 0; }
    else if (act.name === "walk" || act.name === "peek") {
      tmp.subVectors(target, pos); tmp.y = 0;
      const d = tmp.length();
      if (d < 0.03) { if (act.name === "peek") act = { name: "peeking", t: 0, dur: 2.5 }; else next(); }
      else { wantHeading = Math.atan2(tmp.x, tmp.z); const step = Math.min(d, 0.26 * dt); pos.addScaledVector(tmp.normalize(), step); moving = true; }
      if (act.t > act.dur) next();
    } else if (act.name === "peeking") { wantHeading = Math.PI; if (act.t > act.dur) next(); }
    else if (act.name === "look") { wantHeading = heading + Math.sin(act.t * 3) * 0.02; if (act.t > act.dur) next(); }
    else if (act.name === "hello") { wantHeading = toCam; armWave = 1; if (act.t > act.dur) next(); }
    else if (act.name === "sit") { wantSit = 1; if (act.t > act.dur) next(); }
    else if (act.name === "sleep") { wantSit = 1; if (Math.random() < dt * 0.9) puff("z", "#b8b2ff"); }
    else if (act.name === "spin") { spin = act.t < 1.2 ? act.t / 1.2 : 1; if (act.t > act.dur) { spin = 0; next(); } }
    else if (act.name === "hop") { const t = act.t / 0.6; jumpY = model ? 0 : t < 1 ? Math.sin(t * Math.PI) * 0.16 : 0; if (act.t > act.dur) next(); }   // the model jumps in its clip
    else if (act.t > act.dur) next();
    if (hover && !chat && act.name !== "sleep") wantHeading = toCam;

    // turn smoothly (shortest way)
    let dh = ((wantHeading - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    heading += dh * Math.min(1, dt * 6);
    root.rotation.y = heading + (act.name === "spin" ? spin * Math.PI * 2 * (1 - (1 - spin) ** 3) : 0);
    // feet on the desk (or on the keys), plus a hop
    baseY += (groundAt(pos.x, pos.z) - baseY) * Math.min(1, dt * 10);
    if (act.name !== "hop") jumpY *= 0.8;
    root.position.set(pos.x, baseY + jumpY, pos.z);

    // limbs
    poseSit += (wantSit - poseSit) * Math.min(1, dt * 5);
    walkPhase += dt * (moving ? 9 : 0);
    const sw = moving ? Math.sin(walkPhase) : 0;
    legL.rotation.x = sw * 0.6 - poseSit * 1.45; legR.rotation.x = -sw * 0.6 - poseSit * 1.45;
    body.position.y = (moving ? Math.abs(Math.sin(walkPhase)) * 0.03 : Math.sin(now / 1000 * 2.2) * 0.008) - poseSit * 0.2;
    waveK += (armWave - waveK) * Math.min(1, dt * 8);
    armL.rotation.x = -sw * 0.5; armR.rotation.x = sw * 0.5 * (1 - waveK);
    armR.rotation.z = 0.28 + waveK * (2.4 + Math.sin(now / 1000 * 14) * 0.35);
    armL.rotation.z = -0.28 - (act.name === "hop" ? 1.2 : 0) * Math.min(1, jumpY * 8);
    // head: looks around when idle, at the camera when hovered / chatting, nods while talking
    const look = act.name === "look" ? Math.sin(act.t * 2.2) * 0.6 : act.name === "peeking" ? Math.sin(act.t * 3) * 0.15 : 0;
    head.rotation.y += (look - head.rotation.y) * Math.min(1, dt * 4);
    head.rotation.x = (act.name === "sleep" ? 0.35 : 0) + (talking ? Math.sin(now / 1000 * 9) * 0.03 : 0);
    head.rotation.z = act.name === "sleep" ? 0.25 : Math.sin(now / 1000 * 1.3) * 0.04;

    // face: blinks, talks, sleeps
    blinkT -= dt;
    if (blinkT < 0 && blinking <= 0) { blinking = 0.12; blinkT = 2.5 + Math.random() * 3.5; }
    const base = act.name === "sleep" ? "sleep" : chat ? (talkMood || "happy") : hover ? "happy" : act.name === "peeking" ? "think" : "open";
    const shown = blinking > 0 && base === "open" ? "sleep" : base;
    if (blinking > 0) blinking -= dt;
    mouthT -= dt;
    const mouthOpen = talking && Math.sin(now / 1000 * 18) > 0;
    if (shown !== mood || mouthOpen !== lastMouth) { mood = shown; lastMouth = mouthOpen; drawFace(faceG, shown, mouthOpen); faceTex.needsUpdate = true; }

    // the model: pick the clip that matches what she is doing
    if (mixer) {
      let want = "idle";
      if (act.name === "sleep") want = "sleep";
      else if (act.name === "sit") want = "sit";
      else if (moving) want = "walk";
      else if (act.name === "hop") want = "jump";
      else if (act.name === "spin") want = "happy";
      else if (act.name === "hello" || (hover && !chat)) want = "wave";
      else if (chat && talking) want = "talk";
      play(want);
      mixer.update(dt);
    }
    // sprites float up and fade
    for (let i = sprites.length - 1; i >= 0; i--) {
      const s = sprites[i]; s.userData.life += dt;
      s.position.y += dt * 0.35; s.position.x += s.userData.vx * dt;
      s.material.opacity = 1 - s.userData.life / 1.6;
      if (s.userData.life > 1.6) { root.remove(s); sprites.splice(i, 1); }
    }
  }
  let lastMouth = false, talkMood = "";

  const hitMeshes = [];
  root.traverse((o) => o.isMesh && hitMeshes.push(o));
  return {
    root, update,
    hit: (ray) => ray.intersectObjects(hitMeshes, false).length > 0,
    headWorld: (v = new THREE.Vector3()) => (model ? root.localToWorld(v.set(0, 1.12, 0)) : head.localToWorld(v.set(0, HC + 0.42, 0))),
    setHover(on) { hover = on; },
    setChat(on) { chat = on; idleFor = 0; if (on) act = { name: "hello", t: 0, dur: 1.6 }; else next(); },
    talk(on, m = "") { talking = on; talkMood = m; },
    poke() { idleFor = 0; for (let i = 0; i < 5; i++) setTimeout(() => puff(i % 2 ? "♥" : "✦", "#ff8fb8"), i * 90); if (act.name === "sleep") act = { name: "hop", t: 0, dur: 1.2 }; else if (!chat) act = { name: Math.random() < 0.5 ? "hop" : "spin", t: 0, dur: 1.6 }; },
    wake() { idleFor = 0; if (act.name === "sleep") { act = { name: "hello", t: 0, dur: 1.4 }; } },
    get asleep() { return act.name === "sleep"; },
    react(kind) { idleFor = 0; if (kind === "surprised") act = { name: "hop", t: 0, dur: 1 }; },
  };
}
