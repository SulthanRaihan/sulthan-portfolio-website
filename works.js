// (03) Work: the work as a tunnel of cards. Scrolling flies the camera down the axis and stops at one chapter per
// category (Websites & Apps, Skills, Certificates, Moments); between chapters it rushes forward with a zoom blur and
// a little roll, and the spiral turns as you fly. Click a card to open its details (skills just are what they are).
import * as THREE from "three";
import { CONFIG } from "./config.js";
import { allItems, cardPicture } from "./works-data.js";
import { openDetail } from "./modal.js";

const STEP = 0.46;       // depth between two cards of one chapter's spiral
const TRAVEL = 12;       // empty run to the next chapter, so its cards stay hidden behind this title
const INTRO = 14;        // the camera starts this far back and rushes in while the block slides up
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const root = document.getElementById("work");
const CH = CONFIG.works.chapters, ITEMS = allItems();
// fill the dots before anything loads
const dotsNav = root.querySelector(".works-dots");
CH.forEach((ch, i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", ch.title); if (!i) b.className = "on"; dotsNav.appendChild(b); });
// the WebGL context is made only when the block gets close
const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); init(); } }, { rootMargin: "200% 0px" });
near.observe(root);

// cards are small on screen: cap each texture so ~40 photos fit in a phone's GPU memory (full-size photos used ~350 MB
// with mipmaps, and iPhones silently dropped them — only the small skill cards showed)
const TEX_MAX = innerWidth < 800 || matchMedia("(pointer: coarse)").matches ? 640 : 1280;
function fitTexture(pic) {
  const w = pic.naturalWidth || pic.width, h = pic.naturalHeight || pic.height, k = TEX_MAX / Math.max(w, h);
  if (k >= 1) return pic;
  const c = document.createElement("canvas"); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(pic, 0, 0, c.width, c.height);
  return c;
}

async function init() {
  const stage = root.querySelector(".works-stage"), canvas = root.querySelector(".works-gl"), copy = root.querySelector(".works-copy");
  const titleEl = copy.querySelector(".works-title"), subEl = copy.querySelector(".works-sub"), viewAll = copy.querySelector(".works-btn");
  const dots = [...dotsNav.children];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 800 ? 1 : 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);

  // post: cards → transparent target → zoom blur + navy backdrop with a soft centre light + vignette
  const rt = new THREE.WebGLRenderTarget(2, 2, { samples: 2, type: THREE.HalfFloatType });
  const post = new THREE.ShaderMaterial({
    uniforms: { tex: { value: rt.texture }, uBlur: { value: 0 }, uAspect: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: `uniform sampler2D tex; uniform float uBlur, uAspect; varying vec2 vUv;
      void main(){
        vec2 d = vUv - .5; vec4 s;
        if (uBlur < .01) s = texture2D(tex, vUv);
        else { float w = 0.; s = vec4(0.);
          for (int i = 0; i < 10; i++) { float k = float(i) / 9.; float wi = 1. - k * .6; s += texture2D(tex, .5 + d * (1. - uBlur * k * .07)) * wi; w += wi; }
          s /= w; }
        float g = clamp(length(d) / .707, 0., 1.);                     // navy, lighter in the middle (linear light)
        vec3 bg = g < .45 ? mix(vec3(.006, .047, .162), vec3(.003, .020, .065), g / .45) : mix(vec3(.003, .020, .065), vec3(.0015, .008, .020), (g - .45) / .55);
        vec3 c = s.rgb + bg * (1. - s.a);
        float r = length(d * vec2(uAspect, 1.)); c *= mix(1., smoothstep(1.2, .5, r), .25 + uBlur * .45);
        gl_FragColor = vec4(c, 1.);
        #include <colorspace_fragment>
      }`,
    depthTest: false, depthWrite: false,
  });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));

  // cards: a spiral per chapter, one chapter behind the other
  const geo = new THREE.PlaneGeometry(1, 1), spiral = new THREE.Group(); scene.add(spiral);
  const cards = [], uploads = [];
  const LEN = CH.map((ch) => Math.max(4, ((ITEMS[ch.key] || []).length - 1) * STEP));
  const STATION = []; LEN.reduce((z, l, c) => { STATION[c] = z; return z - l - TRAVEL; }, 0);
  const W8 = LEN.map((l) => 1 + l / 10), W_IN = 0.45, W8SUM = W_IN + W8.reduce((a, b) => a + b, 0);
  // TAIL: one more screen at the end where the stage stays pinned and shrinks into the desk's monitor (outro.js), with
  // the desk section overlapping it (outro.css pulls it up by 100vh)
  const TAIL = document.getElementById("outro") ? 1 : 0;
  root.style.height = `${Math.round(W8SUM * 110) + TAIL * 100}vh`;
  CH.forEach((ch, c) => {
    const list = ITEMS[ch.key] || [];
    list.forEach((it, i) => {
      const a = c * 1.9 + i * Math.max(0.55, 5.8 / list.length), dz = i * STEP, z = STATION[c] - 3 - dz;
      const r = 2.5 + Math.min(dz, 6) * 0.3 + ((i * 7) % 3) * 0.08;   // near cards keep away from the title in the centre
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const m = new THREE.Mesh(geo, mat);
      m.position.set(Math.cos(a) * r, Math.sin(a) * r, z);
      m.lookAt(m.position.x * 0.25, m.position.y * 0.25, z + 6);     // tilted like cards inside a tunnel
      m.rotateZ(Math.sin(a * 1.7) * 0.22);
      m.userData = { item: it, ch: c, ready: 0, hover: 0 };
      m.visible = false;
      spiral.add(m); cards.push(m);
      cardPicture(it, i).then((pic) => {                              // textures go to the GPU one per frame
        pic = fitTexture(pic);
        const t = pic instanceof HTMLCanvasElement ? new THREE.CanvasTexture(pic) : new THREE.Texture(pic);
        t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true;
        const asp = pic.width / pic.height, s = it.type === "skill" ? 1.3 : 1.9;
        m.scale.set(asp >= 1 ? s : s * asp, asp >= 1 ? s / asp : s, 1); m.userData.base = m.scale.clone();
        uploads.push([m, t]); loop();
      });
    });
  });

  // layout
  let W = 1, H = 1, visible = false, dirty = true;
  const resize = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false); rt.setSize(W * renderer.getPixelRatio(), H * renderer.getPixelRatio());
    camera.aspect = W / H; camera.fov = W < H ? 68 : 50; camera.updateProjectionMatrix();
    post.uniforms.uAspect.value = W / H; dirty = true; loop();
  };
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting; root.classList.toggle("is-on", visible);
    if (visible) { dirty = true; loop(); }
  }).observe(root);

  // scroll → where the camera is
  const progress = () => { const r = root.getBoundingClientRect(); return clamp01(-r.top / Math.max(1, r.height - (1 + TAIL) * innerHeight)); };
  let enter = 0;
  const state = (p) => {
    let u = Math.max(0, p * W8SUM - W_IN), c = 0;
    const docked = clamp01((p * W8SUM) / W_IN), open = (enter + docked) / 2;
    while (c < CH.length - 1 && u > W8[c]) { u -= W8[c]; c++; }
    const f = clamp01(u / W8[c]), last = c === CH.length - 1;
    const drift = LEN[c] * (last ? 0.5 : 0.85) * smooth(0, last ? 1 : 0.7, f);   // rest: drift slowly down this chapter (the last one
    // stops halfway, so its cards are still around when the stage shrinks into the monitor)
    const travel = last ? 0 : ease(smooth(0.7, 1, f));                   // then rush to the next station
    const z = STATION[c] - drift - travel * (STATION[c] - drift - (STATION[c + 1] ?? 0)) + (1 - open) * INTRO;
    const out = 1 - smooth(0.3, 0.42, f);
    let show = c, alpha = (c === 0 ? smooth(0.25, 0.6, open) : 1) * out;
    if (!last && f > 0.42) { show = c + 1; alpha = smooth(18, 15, z + 1.5 - (STATION[c + 1] - 3)); }
    return { c: show, z, roll: (c + travel) * 0.7 + f * 0.15, alpha };
  };
  dots.forEach((b, i) => b.addEventListener("click", () => {
    const span = root.offsetHeight - (1 + TAIL) * innerHeight, before = W8.slice(0, i).reduce((a, b) => a + b, 0);
    scrollTo({ top: root.getBoundingClientRect().top + scrollY + (span * (W_IN + before + W8[i] * 0.08)) / W8SUM, behavior: reduce ? "auto" : "smooth" });
  }));

  // pointer: hover lifts a card (and shows the "view" cursor); click opens it
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hovered = null, px = -1, py = -1;
  const pick = (x, y) => {
    const r = canvas.getBoundingClientRect();
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null;
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cards.filter((m) => m.visible && m.material.opacity > 0.5), false)[0];
    return hit && hit.object.userData.item.type !== "skill" ? hit.object : null;
  };
  const setHover = (m) => {
    if (m === hovered) return;
    hovered = m; document.documentElement.classList.toggle("view", !!m); loop();
  };
  canvas.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; if (e.pointerType === "mouse") setHover(pick(px, py)); });
  canvas.addEventListener("pointerleave", () => setHover(null));
  let down = null;
  canvas.addEventListener("pointerdown", (e) => (down = { x: e.clientX, y: e.clientY }));
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const m = pick(e.clientX, e.clientY); down = null;
    if (m) { const it = m.userData.item; openDetail(it, ITEMS[it.cat]); }
  });

  // render
  let raf = 0, camZ = INTRO, lastZ = camZ, blur = 0, shown = -1;
  function loop() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    if (!visible) return;
    enter = clamp01(1 - root.getBoundingClientRect().top / innerHeight);
    if (uploads.length) { const [m, t] = uploads.shift(); renderer.initTexture(t); m.material.map = t; m.material.needsUpdate = true; m.userData.ready = now; }
    const s = state(progress());
    camZ += (s.z - camZ) * (reduce ? 1 : 0.14);
    const v = Math.abs(camZ - lastZ); lastZ = camZ;
    blur += ((reduce ? 0 : Math.min(1, v * 1.1)) - blur) * 0.2;
    camera.position.set(0, 0, camZ + 1.5);
    camera.rotation.z += (s.roll - camera.rotation.z) * 0.14;
    spiral.rotation.z = -camZ * 0.045;                                  // cards sweep along the spiral as we fly
    let busy = false;
    const eye = camZ + 1.5;
    for (const m of cards) {
      const t = m.userData.ready ? clamp01((now - m.userData.ready) / 600) : 0, d = eye - m.position.z;
      const o = t * smooth(20, 13, d) * smooth(0.2, 1.2, d);
      m.visible = o > 0.002; m.material.opacity = o;
      if (t > 0 && t < 1) busy = true;
      const h = m === hovered ? 1 : 0;                                 // hover: the card comes forward a little
      m.userData.hover += (h - m.userData.hover) * 0.2;
      if (m.userData.base) m.scale.copy(m.userData.base).multiplyScalar(1 + 0.08 * m.userData.hover);
      if (Math.abs(h - m.userData.hover) > 0.005) busy = true;
    }
    if (s.c !== shown) {                                               // copy, dots, View all, Aiko
      shown = s.c; const ch = CH[s.c];
      titleEl.textContent = ch.title; subEl.textContent = `( ${ch.sub} )`;
      viewAll.hidden = ch.key === "skills";                           // skills need no "view all"
      viewAll.href = `work.html#${ch.key}`;
      dots.forEach((b, i) => b.classList.toggle("on", i === s.c));
    }
    copy.style.opacity = s.alpha.toFixed(3);
    copy.style.transform = `translateY(${((1 - s.alpha) * 18).toFixed(1)}px)`;
    copy.style.pointerEvents = s.alpha > 0.5 ? "" : "none";
    post.uniforms.uBlur.value = blur;
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    const moving = Math.abs(s.z - camZ) > 0.002 || blur > 0.01 || Math.abs(s.roll - camera.rotation.z) > 0.001 || busy || uploads.length > 0 || enter < 1;
    if (moving || dirty) { dirty = false; loop(); }
  }
  addEventListener("scroll", () => { loop(); if (hovered && px >= 0) setHover(pick(px, py)); }, { passive: true });
  resize();
  renderer.compileAsync(scene, camera).then(() => renderer.compileAsync(postScene, postCam)).catch(() => {});
}
