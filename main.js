// Intro: boot loader → 3D close-up of an old CRT → plug the cable into the globe → tube flickers → first screen → scroll back into the room.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { CONFIG } from "./config.js";
import { makeConnectScreen, LAYOUT, LW, LH } from "./connect-screen.js";
import { makeCrtMaterial, makeHeroTexture, bulgeUv } from "./crt.js";
import * as sound from "./sound.js";
import * as music from "./music.js";

const $ = (id) => document.getElementById(id);
const body = document.body, root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
scrollTo(0, 0);

$("who-name").textContent = CONFIG.name;
$("who-role").textContent = CONFIG.role;
$("sr-title").textContent = `${CONFIG.pill} — ${CONFIG.headline.join(" ")}`;

// ------------------------------------------------------------------ loader
// `real` is honest progress (fonts → scene → shaders → smooth frames); the number on screen eases toward it,
// never faster than MIN_LOADER_MS for the full run, so the boot sequence is always readable.
const loaderNum = $("loader-num"), loaderStatus = $("loader-status"), loaderEl = $("loader");
const MIN_LOADER_MS = 1800, bootT0 = performance.now();
let real = 0, shown = 0;
const progress = (v) => { real = Math.max(real, v); };
const loaderTick = setInterval(() => {
  const cap = Math.min(100, ((performance.now() - bootT0) / MIN_LOADER_MS) * 100);
  const goal = Math.floor(Math.min(real, cap));
  if (shown < goal) shown = Math.min(goal, shown + Math.max(1, Math.round((goal - shown) * 0.25)));
  loaderNum.textContent = shown;
  let st = 0; CONFIG.boot.forEach(([at], i) => { if (shown >= at) st = i; });
  if (loaderStatus.textContent !== CONFIG.boot[st][1]) loaderStatus.textContent = CONFIG.boot[st][1];
}, 40);
{ // glow eases toward the pointer
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
  (function glow() {
    if (body.classList.contains("ready")) return;
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    loaderEl.style.setProperty("--gx", `${gx.toFixed(0)}px`); loaderEl.style.setProperty("--gy", `${gy.toFixed(0)}px`);
    requestAnimationFrame(glow);
  })();
}

// ------------------------------------------------------------------ renderer + post
const canvas = $("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
const DPR = Math.min(window.devicePixelRatio || 1, coarse ? 2 : 1.5);
renderer.setPixelRatio(DPR);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0d0b12");
scene.fog = new THREE.FogExp2("#1c1410", 0.07);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.18;
const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.5, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// lens pass: chromatic fringe at the edges, edge blur, warm grade, soft S-curve, grain, vignette
const film = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, res: { value: new THREE.Vector2(1, 1) }, blur: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float time, blur; uniform vec2 res; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - .5; float r2 = dot(d, d);
      vec2 ca = d * r2 * .016;
      vec3 c = vec3(texture2D(tDiffuse, vUv + ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - ca).b);
      vec2 dq = d * vec2(min(res.x / res.y, 1.), 1.);
      float b = blur * smoothstep(.05, .24, dot(dq, dq));
      if (b > .0005) {
        vec2 px = b * vec2(res.y / res.x, 1.);
        vec3 acc = c;
        for (int i = 0; i < 8; i++) { float a = float(i) * .785398; acc += texture2D(tDiffuse, vUv + px * vec2(cos(a), sin(a))).rgb; }
        c = acc / 9.;
      }
      c *= vec3(1.06, 1., .88);                       // warm tungsten grade
      c = mix(c, c * c * (3. - 2. * c), .25);           // gentle S-curve
      c += vec3(.012, .006, 0.);                        // lifted, warm blacks
      c += (hash(vUv * res + fract(time) * 61.) - .5) * .04;   // grain
      c *= 1. - r2 * .75;                               // vignette
      gl_FragColor = vec4(c, 1.);
    }`,
});
composer.addPass(film);

// ------------------------------------------------------------------ the room (all procedural — no model file)
const SCREEN = { w: 1.14, h: 0.855, center: new THREE.Vector3(0, 0.88, 0.59) };
let screenMesh, screenLight;
const ROOM = {};                                   // handles for outro.js: lights, props

function roundRectPath(path, w, h, r, cx = 0, cy = 0) {
  const x = cx - w / 2, y = cy - h / 2;
  path.moveTo(x + r, y); path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

function buildRoom() {
  const beige = new THREE.MeshStandardMaterial({ color: "#cdbfa3", roughness: 0.55 });
  const beigeDark = new THREE.MeshStandardMaterial({ color: "#a99b80", roughness: 0.65 });
  const dark = new THREE.MeshStandardMaterial({ color: "#1d1a18", roughness: 0.8 });
  const add = (geo, mat, x, y, z, opts = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
    m.castShadow = opts.cast ?? true; m.receiveShadow = true;
    if (opts.rot) m.rotation.set(...opts.rot);
    scene.add(m); return m;
  };

  // desk + wall
  add(new THREE.BoxGeometry(7, 0.08, 3.4), new THREE.MeshStandardMaterial({ color: "#5a3d2b", roughness: 0.62 }), 0, -0.04, 0.4, { cast: false });
  add(new THREE.PlaneGeometry(16, 9), new THREE.MeshStandardMaterial({ color: "#2b2330", roughness: 0.95 }), 0, 3, -1.6, { cast: false });
  // a few frames on the wall, to read depth when the camera pulls back
  [[-2.1, 2.2, 0.9, 1.2, "#3b5a7a"], [-0.8, 2.5, 0.7, 0.7, "#8a5a3c"], [1.9, 2.1, 1.1, 0.8, "#c9b48a"]].forEach(([x, y, w, h, col]) => {
    add(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03), new THREE.MeshStandardMaterial({ color: "#191514", roughness: 0.6 }), x, y, -1.58);
    add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 }), x, y, -1.56, { cast: false });
  });

  // CRT: body, tapered back, stand, bezel with a hole, dark recess, curved glass
  add(new RoundedBoxGeometry(1.56, 1.3, 1.15, 6, 0.07), beige, 0, 0.8, -0.02);
  add(new RoundedBoxGeometry(1.12, 0.96, 0.7, 6, 0.08), beigeDark, 0, 0.78, -0.82);
  add(new RoundedBoxGeometry(1.0, 0.12, 0.8, 4, 0.03), beigeDark, 0, 0.07, -0.1);
  const bezelShape = roundRectPath(new THREE.Shape(), 1.5, 1.24, 0.07);
  bezelShape.holes.push(roundRectPath(new THREE.Path(), 1.2, 0.92, 0.08, 0, 0.08));
  add(new THREE.ExtrudeGeometry(bezelShape, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3, curveSegments: 10 }),
    new THREE.MeshStandardMaterial({ color: "#d6c9ae", roughness: 0.5 }), 0, 0.8, 0.555);
  add(new THREE.PlaneGeometry(1.22, 0.94), new THREE.MeshBasicMaterial({ color: "#020203" }), 0, 0.88, 0.54, { cast: false });
  const glass = new THREE.PlaneGeometry(SCREEN.w, SCREEN.h, 40, 30);
  const pos = glass.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) / (SCREEN.w / 2), ny = pos.getY(i) / (SCREEN.h / 2);
    pos.setZ(i, 0.035 * (1 - 0.5 * (nx * nx + ny * ny)));
  }
  glass.computeVertexNormals();
  screenMesh = add(glass, new THREE.MeshBasicMaterial({ color: "#000" }), 0, 0.88, 0.555, { cast: false });
  // details: floppy slot, power LED, vents, a sticky note
  add(new THREE.BoxGeometry(0.38, 0.03, 0.02), dark, 0.36, 0.3, 0.6, { cast: false });
  ROOM.led = add(new THREE.BoxGeometry(0.03, 0.03, 0.02), new THREE.MeshStandardMaterial({ color: "#7dff9a", emissive: "#4dff7a", emissiveIntensity: 2 }), -0.55, 0.3, 0.6, { cast: false });
  for (let i = 0; i < 5; i++) add(new THREE.BoxGeometry(0.012, 0.08, 0.02), dark, -0.3 + i * 0.03, 0.3, 0.6, { cast: false });   // vents
  add(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ color: "#e8c95a", roughness: 0.9, side: THREE.DoubleSide }), 0.66, 1.36, 0.63, { rot: [0, 0, 0.12], cast: false });

  // keyboard with instanced keys
  add(new RoundedBoxGeometry(1.36, 0.06, 0.44, 3, 0.02), beige, 0, 0.03, 1.15);
  const keys = new THREE.InstancedMesh(new RoundedBoxGeometry(0.075, 0.03, 0.075, 2, 0.01), new THREE.MeshStandardMaterial({ color: "#e3d8c2", roughness: 0.5 }), 56);
  const mtx = new THREE.Matrix4(); let n = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 14; c++) { mtx.makeTranslation(-0.55 + c * 0.085, 0.07, 1.0 + r * 0.09); keys.setMatrixAt(n++, mtx); }
  keys.castShadow = true; keys.receiveShadow = true; scene.add(keys);

  // mug + desk lamp
  ROOM.mug = add(new THREE.CylinderGeometry(0.1, 0.09, 0.22, 24), new THREE.MeshStandardMaterial({ color: "#b0583a", roughness: 0.4 }), 1.25, 0.11, 0.85);
  add(new THREE.CylinderGeometry(0.16, 0.18, 0.04, 24), dark, -1.45, 0.02, 0.3);
  add(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 8), dark, -1.45, 0.67, 0.3);
  const shade = add(new THREE.ConeGeometry(0.17, 0.26, 24, 1, true), new THREE.MeshStandardMaterial({ color: "#2b3a2e", roughness: 0.5, side: THREE.DoubleSide }), -1.32, 1.3, 0.45, { rot: [0.5, 0, -0.5] });
  ROOM.bulb = add(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#ffcf8a", emissiveIntensity: 6 }), -1.3, 1.24, 0.47, { cast: false });
  ROOM.shade = shade;
  shade.castShadow = false;

  // lights: warm lamp from the left, faint cool sky, the screen's own glow
  ROOM.hemi = new THREE.HemisphereLight("#6b7fa8", "#2a1a10", 0.35); scene.add(ROOM.hemi);
  const lamp = new THREE.SpotLight("#ffb070", 18, 0, 0.85, 0.85, 2);
  lamp.position.set(-1.3, 1.25, 0.5); lamp.target.position.set(-0.2, 0.2, 1.1);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0006; lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target); ROOM.lamp = lamp;
  const fill = new THREE.PointLight("#ff9a5a", 2.2, 0, 2); fill.position.set(-1.1, 0.4, 1.9); scene.add(fill); ROOM.fill = fill;
  screenLight = new THREE.PointLight("#7fb6ff", 1.4, 0, 2); screenLight.position.set(0, 0.88, 1.2); scene.add(screenLight);
  const rim = new THREE.DirectionalLight("#9fb4ff", 0.5); rim.position.set(3, 3, -2); scene.add(rim);
}

// ------------------------------------------------------------------ camera: close on the glass → pulled back into the room
const CLOSE = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 36 };
const WIDE = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 40 };
function layout() {
  const a = innerWidth / innerHeight, t = 2 * Math.tan(THREE.MathUtils.degToRad(CLOSE.fov / 2));
  const d = Math.max(SCREEN.h / 0.8, SCREEN.w / ((a < 0.8 ? 1.04 : 0.92) * a)) / t;   // glass fills ~80% of the height (phones: the width)
  CLOSE.pos.set(SCREEN.center.x, SCREEN.center.y, SCREEN.center.z + d);
  CLOSE.tgt.copy(SCREEN.center);
  if (a >= 1) { WIDE.pos.set(1.0, 1.6, 4.3); WIDE.fov = 40; } else { WIDE.pos.set(0.5, 1.8, 6.6); WIDE.fov = 50; }
  WIDE.tgt.set(0, 0.75, 0);
}
const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2();
addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") mouse.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1); });
const tmpPos = new THREE.Vector3(), tmpTgt = new THREE.Vector3();
// the desk section at the end of the page (outro.js) blends the camera to its own pose by OUT.k, and dims or powers the tube
const OUT = { k: 0, pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 40, power: 1, parallax: 1, tickers: [] };
function applyCamera(p) {
  const t = ease(clamp01(p / 0.85));
  tmpPos.lerpVectors(CLOSE.pos, WIDE.pos, t);
  tmpTgt.lerpVectors(CLOSE.tgt, WIDE.tgt, t);
  let fov = THREE.MathUtils.lerp(CLOSE.fov, WIDE.fov, t);
  if (OUT.k > 0) { tmpPos.lerp(OUT.pos, OUT.k); tmpTgt.lerp(OUT.tgt, OUT.k); fov = THREE.MathUtils.lerp(fov, OUT.fov, OUT.k); }
  const k = reduceMotion ? 0 : (0.3 + 0.7 * t) * (1 - OUT.k * (1 - OUT.parallax));                        // hand-held parallax, stronger once pulled back
  tmpPos.x += mouseS.x * 0.18 * k; tmpPos.y -= mouseS.y * 0.08 * k;
  tmpTgt.x += mouseS.x * 0.04 * k; tmpTgt.y -= mouseS.y * 0.02 * k;
  camera.position.copy(tmpPos);
  camera.fov = fov;
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  camera.lookAt(tmpTgt);
  camera.rotateZ(-mouseS.x * 0.006 * k);
  return t;
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  film.uniforms.res.value.set(innerWidth * DPR, innerHeight * DPR);
  layout();
}
addEventListener("resize", resize);

// ------------------------------------------------------------------ scroll
const track = $("track");
const scrollP = () => clamp01(scrollY / Math.max(1, track.offsetHeight - innerHeight));
addEventListener("scroll", () => body.classList.toggle("scrolled", scrollY > 40), { passive: true });
$("home").addEventListener("click", (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });
$("snd").addEventListener("click", (e) => {
  const on = e.currentTarget.getAttribute("aria-pressed") !== "true";
  e.currentTarget.setAttribute("aria-pressed", String(on)); sound.setMuted(!on);
  if (on) { if (body.classList.contains("entered")) music.play(); } else music.pause();   // the SOUND switch also runs the music
});

// ------------------------------------------------------------------ render loop
let crtMat, flick = 1, prog = 0, last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  prog += ((body.classList.contains("entered") ? scrollP() : 0) - prog) * (1 - Math.exp(-dt * 5));
  mouseS.lerp(mouse, 1 - Math.exp(-dt * 4));
  const t = applyCamera(prog);
  crtMat.uniforms.time.value = now / 1000;
  crtMat.uniforms.power.value = flick * (1 - 0.2 * t * (1 - OUT.k)) * OUT.power;
  screenLight.intensity = 1.4 * flick * OUT.power;
  film.uniforms.time.value = now / 1000;
  film.uniforms.blur.value = body.classList.contains("entered") ? (0.001 + 0.004 * t) * (1 - 0.85 * OUT.k) : 0;   // connect screen stays sharp
  for (const f of OUT.tickers) f(dt, now);
  composer.render(dt);
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ "plug me in"
function startConnect(cs, heroTex) {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const plug = { ...LAYOUT.rest }, target = LAYOUT.target;
  const reach = coarse ? 1.8 : 1;                                       // fingers are bigger than a mouse pointer
  let drag = null, done = false, raf = 0;

  // screen pixel → low-res connect-canvas pixel, through the same bulge the shader uses
  const toCanvas = (cx, cy) => {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(screenMesh, false)[0];
    if (!hit || !hit.uv) return null;
    const b = bulgeUv(hit.uv.x, hit.uv.y);
    return { x: b.u * LW, y: (1 - b.v) * LH };
  };
  const onPlug = (p) => p && p.x > plug.x - 14 * reach && p.x < plug.x + 27 + 14 * reach && p.y > plug.y - 16 * reach && p.y < plug.y + 15 + 16 * reach;
  const dist = () => Math.hypot(plug.x - target.x, plug.y - target.y);

  const draw = (now) => {
    raf = 0;
    if (!drag && !done) { plug.x += (LAYOUT.rest.x - plug.x) * 0.2; plug.y += (LAYOUT.rest.y - plug.y) * 0.2; }   // spring back to the hook
    const near = done ? 1 : drag ? Math.max(0, 1 - dist() / 80) : 0;
    cs.draw({ plug, near, done, time: now / 1000 });
    if (crtMat.uniforms.map.value !== cs.tex) return;                  // first screen already swapped in
    if (drag || done || Math.hypot(plug.x - LAYOUT.rest.x, plug.y - LAYOUT.rest.y) > 0.5 || near > 0.05) raf = requestAnimationFrame(draw);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

  const connect = () => {
    if (done) return;
    done = true; drag = null; root.classList.remove("hand", "grab");
    Object.assign(plug, target); kick();
    sound.click(); setTimeout(sound.chime, 180);
    if ($("snd").getAttribute("aria-pressed") === "true") music.play();   // plugged in → the first track (Mean It) starts, inside this gesture
    setTimeout(() => flicker(() => { crtMat.uniforms.map.value = heroTex; }, () => body.classList.add("entered")), 1100);
  };

  addEventListener("pointerdown", (e) => {
    if (done || !body.classList.contains("ready") || e.target.closest?.("button, a")) return;
    const p = toCanvas(e.clientX, e.clientY);
    if (!onPlug(p)) return;
    drag = { dx: plug.x - p.x, dy: plug.y - p.y }; root.classList.add("grab"); kick();
    if (e.cancelable) e.preventDefault();
  });
  addEventListener("pointermove", (e) => {
    if (done || !body.classList.contains("ready")) return;
    const p = toCanvas(e.clientX, e.clientY);
    if (!drag) { root.classList.toggle("hand", !!onPlug(p)); return; }
    if (!p) return;
    plug.x = p.x + drag.dx; plug.y = p.y + drag.dy;
    if (dist() < 18 * reach) connect(); else kick();
  });
  const release = () => {                                              // let go near the socket: it snaps in like a magnet
    if (!drag || done) return;
    drag = null; root.classList.remove("grab");
    if (dist() < 45 * reach) connect(); else kick();
  };
  addEventListener("pointerup", release); addEventListener("pointercancel", release);
  addEventListener("keydown", (e) => {                                 // keyboard: Enter / Space slides it in
    if (done || !body.classList.contains("ready") || !["Enter", " "].includes(e.key)) return;
    e.preventDefault();
    const s = { ...plug }, t0 = performance.now();
    (function slide(now) {
      const t = Math.min(1, (now - t0) / 500), q = t * t * (3 - 2 * t);
      plug.x = s.x + (target.x - s.x) * q; plug.y = s.y + (target.y - s.y) * q; kick();
      if (t < 1) requestAnimationFrame(slide); else connect();
    })(t0);
  });
  draw(performance.now());
}

// The tube dips almost to black, the picture is swapped while it is dark, then it overshoots bright and settles.
function flicker(swap, done) {
  if (reduceMotion) { swap(); done(); return; }
  const t0 = performance.now(); let swapped = false;
  (function f(now) {
    const t = (now - t0) / 650;
    flick = t < 0.35 ? 1 - (t / 0.35) * 0.95 : t < 0.5 ? 0.05 : t < 1 ? 0.05 + ((t - 0.5) / 0.5) * 1.15 : t < 1.25 ? 1.2 - ((t - 1) / 0.25) * 0.2 : 1;
    if (t > 0.5 && t < 1) flick *= 0.9 + Math.random() * 0.2;          // unstable while warming up
    if (t >= 0.42 && !swapped) { swapped = true; swap(); }
    if (t < 1.25) requestAnimationFrame(f); else { flick = 1; done(); }
  })(t0);
}

// ------------------------------------------------------------------ boot
async function init() {
  progress(5);
  await Promise.all(['400 100px "Anton"', '400 24px "Silkscreen"', '500 54px "Inter"', '800 19px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => {})));
  progress(35);
  buildRoom();
  progress(60);
  const heroTex = makeHeroTexture(CONFIG), cs = makeConnectScreen(CONFIG);
  crtMat = makeCrtMaterial(cs.tex);
  screenMesh.material = crtMat;
  progress(70);
  resize(); applyCamera(0);
  renderer.initTexture(heroTex); renderer.initTexture(cs.tex);
  if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
  composer.render(0);
  progress(90);
  requestAnimationFrame(frame);
  // hold the loader until frames are smooth (20 in a row under 34 ms, at most 2.5 s — also in a background tab, where rAF pauses)
  await Promise.race([wait(2500), new Promise((ok) => {
    let good = 0, prev = performance.now(); const t0 = prev;
    (function check(now) {
      good = now - prev < 34 ? good + 1 : 0; prev = now;
      if (good >= 20 || now - t0 > 2500) ok(); else requestAnimationFrame(check);
    })(prev);
  })]);
  progress(100);
  while (shown < 100) await wait(40);
  await wait(350);
  clearInterval(loaderTick);
  body.classList.add("ready");
  startConnect(cs, heroTex);
  window.hwRoom = { THREE, scene, camera, renderer, canvas, crtMat, screenMesh, heroTex, cs, SCREEN, CLOSE, WIDE, OUT, ROOM, sound, flicker };
  dispatchEvent(new Event("hw-room-ready"));
}
init().catch((err) => {
  clearInterval(loaderTick);
  loaderStatus.textContent = "Couldn’t start the 3D scene. Please refresh.";
  console.error(err);
});
