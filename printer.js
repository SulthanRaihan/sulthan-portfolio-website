// CV printer: a floating chrome printer that feeds a sheet out line by line, drops it with a sway and a flip,
// and lets it land leaning on the floor with a curled corner. Click the page to flip it, the printer to print again.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;

export function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

export function mountPrinter(stage, opts = {}) {
  const reduced = !!opts.reduced, coarse = matchMedia("(pointer: coarse)").matches;
  const ACCENT = opts.accent || "#2f9bff";

  // ---------------------------------------------------------------- renderer, scene, light
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0, 0);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  const canvas = renderer.domElement; canvas.setAttribute("aria-hidden", "true"); stage.appendChild(canvas);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.8;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight("#ffffff", "#d9dde4", 0.3));
  const sun = new THREE.DirectionalLight("#fffaf0", 0.9);
  sun.position.set(-0.7, 1.7, 4.6); sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -2.6, right: 2.6, top: 2.2, bottom: -4.2, near: 0.5, far: 12 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01;
  scene.add(sun, sun.target);

  // world layout (paper is 1 wide, √2 tall — A4)
  const D = Math.SQRT2, SLOT_Y = D / 2 + 0.06, FLOOR = SLOT_Y - D - 0.62, TONGUE = 0.07;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ color: "#1a2430", opacity: 0.085 }));
  wall.position.z = -0.42; wall.receiveShadow = true; scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), new THREE.ShadowMaterial({ color: "#1a2430", opacity: 0.16 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, FLOOR, 1); floor.receiveShadow = true; scene.add(floor);

  // ---------------------------------------------------------------- printer
  const printer = new THREE.Group(); scene.add(printer);
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.34, 0.17, 0.3, 5, 0.06), new THREE.MeshStandardMaterial({ color: "#e9e9ea", metalness: 1, roughness: 0.14 }));
  body.position.y = 0.089; body.castShadow = true; printer.add(body);
  const lip = new THREE.Mesh(new RoundedBoxGeometry(1.14, 0.022, 0.09, 2, 0.008), new THREE.MeshStandardMaterial({ color: "#111", roughness: 0.4, metalness: 0.3 }));
  lip.position.y = 0.008; printer.add(lip);
  const ledMat = new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: reduced ? 0.35 : 0 });
  for (const z of [0.026, -0.026]) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.004, 0.012), ledMat); s.position.set(0, -0.004, z); printer.add(s); }
  const glow = new THREE.PointLight(ACCENT, 0, 0.9, 1.6); glow.position.set(0, -0.06, 0.16); printer.add(glow);
  const rollerGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.04, 18, 1); rollerGeo.rotateZ(Math.PI / 2);
  const rollers = [0.02, -0.02].map((z) => {
    const r = new THREE.Mesh(rollerGeo, new THREE.MeshStandardMaterial({ color: "#2b2b2b", roughness: 0.75, metalness: 0.1 }));
    r.position.set(0, -0.006, z); printer.add(r);
    for (let i = -4; i <= 4; i++) { const n = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.026, 0.004), new THREE.MeshStandardMaterial({ color: "#8a8a8a", metalness: 0.6, roughness: 0.4 })); n.position.x = i * 0.12; r.add(n); }
    return r;
  });
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.013, 20, 12), new THREE.MeshStandardMaterial({ color: "#0b2a48", emissive: ACCENT, emissiveIntensity: 0.25, roughness: 0.2 }));
  dot.position.set(0.56, 0.095, 0.152); dot.scale.z = 0.5; printer.add(dot);
  // badge: a chrome four-point sparkle that spins while printing
  const sp = new THREE.Shape(), k = 0.14;
  sp.moveTo(0, 1); sp.quadraticCurveTo(k, k, 1, 0); sp.quadraticCurveTo(k, -k, 0, -1); sp.quadraticCurveTo(-k, -k, -1, 0); sp.quadraticCurveTo(-k, k, 0, 1);
  const spGeo = new THREE.ExtrudeGeometry(sp, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 4, curveSegments: 16 });
  spGeo.center(); spGeo.scale(0.048, 0.048, 0.048);
  const badge = new THREE.Mesh(spGeo, new THREE.MeshPhysicalMaterial({ color: ACCENT, metalness: 1, roughness: 0.25, clearcoat: 0.6, clearcoatRoughness: 0.08 }));
  badge.position.set(-0.55, 0.092, 0.162); badge.castShadow = true; printer.add(badge);

  // ---------------------------------------------------------------- paper
  const COLS = 22, ROWS = 32, NV = (COLS + 1) * (ROWS + 1);
  const geo = new THREE.PlaneGeometry(1, D, COLS, ROWS);
  const pos = geo.attributes.position.array, snap = new Float32Array(NV * 3);
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), SLOT_Y);       // keeps only what is below the slot
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const toTex = (src) => { const t = src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.needsUpdate = true; return t; };
  const frontTex = toTex(opts.pages[0]), backTex = toTex(opts.pages[1] || opts.pages[0]);
  backTex.wrapS = THREE.RepeatWrapping; backTex.repeat.x = -1;              // un-mirror the back side
  const paper = { roughness: 0.8, metalness: 0, sheen: 0.2, sheenRoughness: 0.5, sheenColor: new THREE.Color("#ffffff"), specularIntensity: 0.16,
    envMapIntensity: 0.42, clippingPlanes: [clip], clipShadows: true, transparent: true, opacity: 1 };
  const front = new THREE.MeshPhysicalMaterial({ map: frontTex, side: THREE.FrontSide, ...paper });
  const back = new THREE.MeshPhysicalMaterial({ map: backTex, side: THREE.BackSide, ...paper });
  const sheetF = new THREE.Mesh(geo, front), sheetB = new THREE.Mesh(geo, back);
  sheetF.castShadow = true; sheetF.frustumCulled = sheetB.frustumCulled = false;
  scene.add(sheetF, sheetB);

  const v3 = new THREE.Vector3(), q = new THREE.Quaternion(), eul = new THREE.Euler(), nrm = new THREE.Vector3();
  // hanging from the slot: `printed` = how much of the sheet is out (bottom edge first); `wave` = ripple while feeding
  function hangShape(printed, wave, t) {
    printer.updateMatrixWorld(true);
    const m = printer.matrixWorld;
    for (let iy = 0; iy <= ROWS; iy++) {
      const s = printed - (1 - iy / ROWS) * D;                              // depth below the slot (<0: still inside)
      for (let ix = 0; ix <= COLS; ix++) {
        let x = ix / COLS - 0.5, z = 0;
        if (s > 0) {
          const r = s / D;
          z = 0.06 * r * r + (reduced ? 0 : 0.012 * Math.sin(t * 0.8 + x * 1.7 + s * 0.6) * r);
          if (wave > 0) { z += wave * 0.03 * Math.sin(s * 5 - t * 7.5) * smooth(0.02, 0.4, s); x += wave * 0.003 * Math.sin(s * 3 - t * 5 + x * 2); }
        }
        v3.set(x, -s, z).applyMatrix4(m);
        const i = (iy * (COLS + 1) + ix) * 3; pos[i] = v3.x; pos[i + 1] = v3.y; pos[i + 2] = v3.z;
      }
    }
  }
  // free sheet: a pose plus bend (belly, flutter while falling, a curled corner once it lands)
  const pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0 };
  const FINAL = { x: 0.06, z: -0.1, rx: -0.2, rz: -0.1 }, finalY = () => FLOOR + (D / 2) * Math.cos(FINAL.rx) + 0.004;
  const FALL = 2.7, SWAY = opts.sway ?? 0.42;
  let start = { x: 0, y: 0, z: 0 }, flutter = 0, curl = 0, flipK = 0, flipTarget = 0;
  function fallPose(time) {
    const t = clamp(time / FALL, 0, 1), sw = Math.sin(Math.PI * 2 * 1.3 * t), cw = Math.cos(Math.PI * 2 * 1.3 * t);
    const env = (1 - t) ** 0.8 * smooth(0, 0.22, t), land = smooth(0.62, 1, t);
    const drop = clamp(smooth(0, 1, t) * 0.45 + Math.min(1, t * 1.05) * 0.55, 0, 1);
    pose.y = start.y + (finalY() - start.y) * drop;
    pose.x = start.x + SWAY * sw * env + (FINAL.x - start.x) * land;
    pose.z = start.z + 0.16 * Math.sin(Math.PI * t) + (FINAL.z - start.z) * land;
    pose.rz = 0.5 * cw * env * (1 - land) + FINAL.rz * land;
    pose.ry = Math.PI * smooth(0.06, 0.62, t) + 0.32 * sw * env * (1 - land);
    pose.rx = 0.55 * Math.sin(Math.PI * 2 * 0.95 * t) * env * (1 - land) + FINAL.rx * land;
    flutter = (1 - land) * smooth(0, 0.15, t);
    curl = smooth(0.82, 1, t);
  }
  function settle() { Object.assign(pose, { x: FINAL.x, y: finalY(), z: FINAL.z, rx: FINAL.rx, ry: Math.PI, rz: FINAL.rz }); flutter = 0; curl = 1; }
  function sheetShape(blend, t) {
    const lift = Math.sin(Math.PI * flipK), fold = 2.1 * curl * Math.cos(Math.PI * flipK);
    q.setFromEuler(eul.set(pose.rx, pose.ry + Math.PI * easeInOut(flipK), pose.rz, "ZXY"));
    const o = -Math.SQRT1_2, c0 = -0.5 * o + (-D / 2) * o - 0.17;       // fold line across the bottom-left corner
    for (let iy = 0; iy <= ROWS; iy++) for (let ix = 0; ix <= COLS; ix++) {
      let x = ix / COLS - 0.5, y = D / 2 - (iy / ROWS) * D;
      let z = 0.05 * (y / (D / 2)) ** 2 * (1 - 0.6 * curl) + flutter * 0.05 * Math.sin(y * 3.2 + t * 9) * Math.cos(x * 1.6 + t * 4);
      if (Math.abs(fold) > 0.001) {
        const d = x * o + y * o - c0;
        if (d > 0) { const bx = x - d * o, by = y - d * o; x = bx + d * Math.cos(fold) * o; y = by + d * Math.cos(fold) * o; z -= d * Math.sin(fold); }
      }
      v3.set(x, y, z).applyQuaternion(q);
      const i = (iy * (COLS + 1) + ix) * 3, px = pose.x + v3.x, py = pose.y + v3.y + lift * 0.05, pz = pose.z + v3.z + lift * 0.14;
      if (blend < 1) { pos[i] = snap[i] + (px - snap[i]) * blend; pos[i + 1] = snap[i + 1] + (py - snap[i + 1]) * blend; pos[i + 2] = snap[i + 2] + (pz - snap[i + 2]) * blend; }
      else { pos[i] = px; pos[i + 1] = py; pos[i + 2] = pz; }
    }
  }

  // ---------------------------------------------------------------- phases: idle → warm → feed → hold → fall → settled (→ clear → warm…)
  let phase = "idle", T = 0, clock = 0, printed = TONGUE, feedFrom = TONGUE, wave = 0;
  const FEED_STEPS = 46, FEED_RATE = 15;                                   // 46 line feeds, 15 per second
  const setPhase = (p) => { phase = p; T = 0; opts.onPhase?.(p); };
  const ledTo = (v, dt, k = 6) => { ledMat.opacity += (v - ledMat.opacity) * Math.min(1, dt * k); glow.intensity = ledMat.opacity * 0.55; };
  const idleLights = (dt) => {
    if (reduced) { ledMat.opacity = 0.35; glow.intensity = 0.2; dot.material.emissiveIntensity = 1.2; return; }
    const b = 0.5 + 0.5 * Math.sin(clock * 2.6);
    ledTo(0.18 + 0.3 * b, dt, 4); dot.material.emissiveIntensity = 0.4 + 1.4 * b;
  };
  function floatPrinter(t) {
    const a = reduced ? 0 : 1;
    printer.position.set(Math.sin(t * 0.5) * 0.025 * a, SLOT_Y + Math.sin(t * 1.1) * 0.03 * a, Math.sin(t * 0.7) * 0.02 * a);
    printer.rotation.set(Math.sin(t * 0.6) * 0.03 * a, Math.sin(t * 0.4) * 0.05 * a, Math.sin(t * 0.9) * 0.018 * a);
    printer.updateMatrixWorld(true);
    clip.setFromNormalAndCoplanarPoint(nrm.set(0, -1, 0).applyQuaternion(printer.quaternion), printer.position);
  }
  function update(dt) {
    clock += dt; T += dt;
    floatPrinter(clock);
    if (phase === "idle") {
      idleLights(dt); printed = TONGUE + (reduced ? 0 : 0.008 * Math.sin(clock * 1.6)); hangShape(printed, 0, clock);
    } else if (phase === "warm") {
      ledTo(1, dt, 5); dot.material.emissiveIntensity = Math.floor(T * 10) % 2 ? 2.4 : 0.5;
      rollers.forEach((r) => (r.rotation.x -= dt * 6 * smooth(0, 0.55, T)));
      hangShape(printed, 0, clock);
      if (T >= 0.55) { feedFrom = printed; setPhase("feed"); }
    } else if (phase === "feed") {
      const f = T * FEED_RATE, n = Math.floor(f), prev = printed, step = (D - feedFrom) / FEED_STEPS;
      printed = Math.min(D, feedFrom + step * (n + easeInOut(clamp((f - n) / 0.62, 0, 1))));   // stepped, like real line feeds
      rollers.forEach((r, i) => (r.rotation.x += ((i ? 1 : -1) * (printed - prev)) / 0.012));
      wave = smooth(0, 0.6, T) * (1 - smooth(FEED_STEPS / FEED_RATE - 0.5, FEED_STEPS / FEED_RATE, T));
      ledTo(0.85 + 0.15 * Math.sin(T * 22), dt); dot.material.emissiveIntensity = 1.6 + Math.sin(T * 18) * 0.9;
      hangShape(printed, wave, clock);
      if (printed >= D - 1e-5) { printed = D; setPhase("hold"); opts.onPrinted?.(); }
    } else if (phase === "hold") {
      ledTo(0.25, dt, 4); dot.material.emissiveIntensity = 0.25; hangShape(D, 0, clock);
      if (T >= 0.32) {
        snap.set(pos); let sx = 0, sy = 0, sz = 0;
        for (let i = 0; i < NV; i++) { sx += pos[i * 3]; sy += pos[i * 3 + 1]; sz += pos[i * 3 + 2]; }
        start = { x: sx / NV, y: sy / NV, z: sz / NV };
        setPhase("fall");
      }
    } else if (phase === "fall") {
      ledTo(0, dt, 3); fallPose(T); sheetShape(easeOut(clamp(T / 0.35, 0, 1)), T);
      if (T >= FALL) { settle(); setPhase("settled"); }
    } else if (phase === "settled") {
      idleLights(dt); flipK = reduced ? flipTarget : flipK + (flipTarget - flipK) * Math.min(1, dt * 5); sheetShape(1, clock);
    } else if (phase === "clear") {
      const k = clamp(T / 0.45, 0, 1); front.opacity = back.opacity = 1 - k; sheetShape(1, clock);
      if (k >= 1) { front.opacity = back.opacity = 1; printed = 0; flipK = flipTarget = 0; curl = 0; hangShape(0, 0, clock); setPhase("warm"); }
    }
    badge.rotation.z += dt * (phase === "feed" ? 6 : phase === "warm" ? 3 : 0);
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  }

  // ---------------------------------------------------------------- actions
  function print() {
    if (reduced) {                                                          // calm version: the page simply appears
      if (phase !== "idle" && phase !== "settled") return;
      flipK = flipTarget = 0; settle(); sheetShape(1, 0); setPhase("settled"); opts.onPrinted?.(); kick(); return;
    }
    if (phase === "idle") setPhase("warm"); else if (phase === "settled") setPhase("clear");
    kick();
  }
  const flip = () => { if (phase === "settled") { flipTarget = flipTarget ? 0 : 1; kick(); } };

  // pointer: hover shows a hand over the printer / the landed page; a click (not a drag) acts
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const target = (e) => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return null;
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.intersectObject(printer, true).length) return "printer";
    if (phase === "settled" && ray.intersectObjects([sheetF, sheetB], false).length) return "sheet";
    return null;
  };
  const ready = () => phase === "idle" || phase === "settled";
  let down = null;
  const onMove = (e) => stage.classList.toggle("is-hot", ready() && !!target(e));
  const onDown = (e) => { const t = target(e); down = t && ready() ? { x: e.clientX, y: e.clientY, t } : null; };
  const onUp = (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) { down = null; return; }
    const t = down.t; down = null;
    if (t === "sheet") flip(); else print();
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);

  // ---------------------------------------------------------------- framing + loop
  function layout() {
    const r = stage.getBoundingClientRect(); if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    const top = SLOT_Y + 0.34, bottom = FLOOR - 0.06, frameW = opts.frameW ?? 1.9;
    const tan2 = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const d = Math.max(top - bottom, frameW / camera.aspect) / tan2, visH = d * tan2;
    camera.position.set(0, bottom + visH / 2, d);                           // the floor always sits at the bottom edge
    camera.lookAt(0, bottom + visH / 2, 0);
    camera.near = d * 0.3; camera.far = d * 3; camera.updateProjectionMatrix();
    kick();
  }
  new ResizeObserver(layout).observe(stage);

  let active = false, raf = 0, last = performance.now();
  function loop(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt);
    renderer.render(scene, camera);
    if (active && !(reduced && (phase === "idle" || phase === "settled"))) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  floatPrinter(0); hangShape(TONGUE, 0, 0); geo.computeVertexNormals(); layout();
  return {
    print, flip, resize: layout,
    get phase() { return phase; },
    setActive(on) { active = on; if (on) kick(); },
  };
}
