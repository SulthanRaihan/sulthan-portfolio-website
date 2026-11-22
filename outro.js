// (05) Back at the desk: the last screen of the page drops the visitor back into the 3D room from the intro.
// · Aiko (aiko3d.js) wanders the desk; click her to chat (aiko-chat.js)
// · the old computer shows a "welcome back" desktop: Look inside → the camera dives into the tube and a macOS-style
//   desktop opens (os.js); Unplug → the real plug comes out of the power strip and the tube switches off
// · diamonds mark what can be played with (after raomuhammadhamza.tech); hovering a thing tells what it does
//   (after pradiplabs.dev): the lamp switches, the mug can be sipped
import { CONFIG } from "./config.js";
import { makeAiko3D } from "./aiko3d.js";
import { greeting, suggestions, reply } from "./aiko-chat.js";
import { bulgeUv } from "./crt.js";
import { loadAiko } from "./aiko-cutout.js";
import { makePinboard } from "./pinboard.js";

const section = document.getElementById("outro");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - (1 - t) ** 3;
const tween = (ms, fn) => new Promise((done) => {
  if (reduce) { fn(1); return done(); }
  const t0 = performance.now();
  (function f(now) { const t = Math.min(1, (now - t0) / ms); fn(t); if (t < 1) requestAnimationFrame(f); else done(); })(t0);
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

if (window.hwRoom) init(window.hwRoom); else addEventListener("hw-room-ready", () => init(window.hwRoom), { once: true });

function init(R) {
  const { THREE, scene, camera, canvas, crtMat, screenMesh, heroTex, cs, SCREEN, CLOSE, OUT, ROOM, sound } = R;
  const html = document.documentElement;

  // ---------------------------------------------------------------- the CRT's "welcome back" desktop
  const DW = 1440, DH = 1080, BTN = { look: [400, 600, 300, 100], unplug: [740, 600, 300, 100] };
  const deskCanvas = document.createElement("canvas"); deskCanvas.width = DW; deskCanvas.height = DH;
  const deskTex = new THREE.CanvasTexture(deskCanvas); deskTex.colorSpace = THREE.SRGBColorSpace; deskTex.anisotropy = 8;
  function drawDesk(hot = "") {
    const g = deskCanvas.getContext("2d");
    const bg = g.createRadialGradient(DW * 0.3, DH * 1.1, 0, DW * 0.5, DH * 0.6, DW * 0.9);
    bg.addColorStop(0, "#2f9bff"); bg.addColorStop(0.5, "#0b3463"); bg.addColorStop(1, "#061a2b");
    g.fillStyle = bg; g.fillRect(0, 0, DW, DH);
    g.strokeStyle = "rgba(255,255,255,.07)"; g.lineWidth = 3;
    for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(DW * 0.5, DH * 1.2, 300 + i * 140, 200 + i * 90, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.88)"; g.fillRect(0, 0, DW, 58);                       // menu bar
    g.fillStyle = "#061a2b"; g.font = '700 28px "Inter", sans-serif'; g.textBaseline = "middle";
    g.fillText("✦   hello_world      File      Edit      View      Go", 84, 30);
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    g.textAlign = "right"; g.fillText(time, DW - 84, 30); g.textAlign = "left";
    // the welcome window
    const wx = 330, wy = 230, ww = 780, wh = 560;
    g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.roundRect(wx + 10, wy + 18, ww, wh, 30); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(wx, wy, ww, wh, 30); g.fill();
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(wx + 40 + i * 34, wy + 38, 11, 0, 7); g.fill(); });
    g.fillStyle = "#061a2b"; g.textAlign = "center";
    g.font = '400 110px "Anton", sans-serif'; g.fillText("WELCOME BACK ✦", DW / 2, wy + 200);
    g.font = '500 34px "Inter", sans-serif'; g.fillStyle = "rgba(6,26,43,.65)"; g.fillText("You made it to the end. Now what?", DW / 2, wy + 290);
    for (const [k, [x, y, w, h]] of Object.entries(BTN)) {
      g.fillStyle = k === "look" ? (hot === k ? "#1f7fe0" : "#2f9bff") : hot === k ? "#000" : "#061a2b";
      g.beginPath(); g.roundRect(x, y, w, h, 22); g.fill();
      g.fillStyle = "#fff"; g.font = '400 40px "Anton", sans-serif'; g.fillText(k === "look" ? "LOOK INSIDE →" : "⏻  UNPLUG", x + w / 2, y + h / 2 + 2);
    }
    g.textAlign = "left";
    g.fillStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.roundRect(DW / 2 - 300, DH - 120, 600, 90, 28); g.fill();   // dock
    ["#2f9bff", "#ffffff", "#ff8a3d", "#7b61ff", "#16c79a", "#ff4f79"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.roundRect(DW / 2 - 270 + i * 92, DH - 105, 64, 64, 16); g.fill(); });
    deskTex.needsUpdate = true;
  }
  drawDesk();

  // ---------------------------------------------------------------- a power strip with a real plug
  const plastic = new THREE.MeshStandardMaterial({ color: "#efece4", roughness: 0.45 });
  const strip = new THREE.Group(); strip.position.set(1.0, 0, 1.66); strip.rotation.y = -0.35; scene.add(strip);
  const stripBody = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.13), plastic); stripBody.position.y = 0.025; stripBody.castShadow = stripBody.receiveShadow = true; strip.add(stripBody);
  const sw = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.06), new THREE.MeshStandardMaterial({ color: "#d63a2f", emissive: "#ff3a2a", emissiveIntensity: 0.8 })); sw.position.set(0.18, 0.055, 0); strip.add(sw);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.004, 0.06), new THREE.MeshStandardMaterial({ color: "#3a3a3a" })); s.position.set(-0.15 + i * 0.1, 0.051, 0); strip.add(s); }
  const plug = new THREE.Group(); strip.add(plug);
  const plugBody = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.055, 0.075), plastic); plugBody.castShadow = true; plug.add(plugBody);
  const plugHome = new THREE.Vector3(-0.15, 0.08, 0);
  plug.position.copy(plugHome);
  const cableMat = new THREE.MeshStandardMaterial({ color: "#2b2b2e", roughness: 0.6 });
  let cable = null;
  const behindMonitor = [new THREE.Vector3(1.1, 0.02, 1.2), new THREE.Vector3(1.1, 0.02, 0.6), new THREE.Vector3(0.9, 0.04, 0.0), new THREE.Vector3(0.62, 0.3, -0.35)];
  const wp = new THREE.Vector3();
  function rebuildCable() {
    plug.updateMatrixWorld(true);
    const a = plug.localToWorld(wp.set(0, 0.03, -0.03)).clone();
    const lift = a.clone(); lift.y += 0.06; lift.z -= 0.05;
    const curve = new THREE.CatmullRomCurve3([a, lift, ...behindMonitor]);
    if (cable) { cable.geometry.dispose(); scene.remove(cable); }
    cable = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.012, 8), cableMat); cable.castShadow = true; scene.add(cable);
  }
  rebuildCable();
  function setPlug(k) {                                     // 0 = in the socket, 1 = pulled out and dropped beside it
    plug.position.set(plugHome.x - 0.05 * k, plugHome.y + Math.sin(k * Math.PI) * 0.12 + 0.01 * k, plugHome.z + 0.16 * k);
    plug.rotation.set(-0.9 * k, 0.4 * k, 0.5 * k);
    rebuildCable();
  }

  // ---------------------------------------------------------------- pin board on the wall (photo + links)
  let pinboard = null;
  makePinboard().then((pb) => { pinboard = pb; pb.group.position.set(1.9, 1.22, -1.56); pb.group.scale.setScalar(1.12); scene.add(pb.group); }).catch((e) => console.warn("pin board", e));

  // ---------------------------------------------------------------- desk dressing: plants + stationery, one file
  // (Tiny Treats House Plants by Isa Lousberg, CC0 · ATELIER Desktop Props by yumeno3d, embedded per its licence)
  import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => new GLTFLoader().loadAsync("assets/models/desk-props.glb")).then((g) => {
    g.scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g.scene);
  }).catch((e) => console.warn("desk props not loaded", e));

  // ---------------------------------------------------------------- Aiko
  const aiko = makeAiko3D(); scene.add(aiko.root); aiko.root.visible = false;

  // ---------------------------------------------------------------- camera poses
  const DESK = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 42 }, IN = { pos: new THREE.Vector3(), tgt: new THREE.Vector3(), fov: 30 };
  function poses() {
    const a = innerWidth / innerHeight;
    if (a >= 1) { DESK.pos.set(0, 1.6, 4.1); DESK.fov = 42; } else { DESK.pos.set(0, 2.1, 6.2); DESK.fov = 54; }
    DESK.tgt.set(0, 0.6, 0.6);
    IN.pos.copy(CLOSE.pos); IN.pos.z = SCREEN.center.z + (CLOSE.pos.z - SCREEN.center.z) * 0.42; IN.tgt.copy(SCREEN.center); IN.fov = CLOSE.fov;
  }
  poses(); addEventListener("resize", poses);

  // ---------------------------------------------------------------- state
  let state = "desk", inside = 0, chatOpen = false, k = 0, lampOn = true;
  const ui = section.querySelector(".ou-ui"), spotsEl = section.querySelector(".ou-spots"), tip = section.querySelector(".ou-tip");
  const bubble = section.querySelector(".ou-bubble");

  const SPOTS = [
    { id: "look", label: "Look inside", at: () => wp.set(0.42, 1.38, 0.66), act: () => lookInside() },
    { id: "aiko", label: "Talk to Aiko", at: () => aiko.headWorld(wp), act: () => openChat() },
    { id: "plug", label: () => (state === "off" ? "Plug it back in" : "Unplug"), at: () => plug.localToWorld(wp.set(0, 0.12, 0)), act: () => (state === "off" ? plugIn() : unplug()) },
    { id: "lamp", label: () => (lampOn ? "Turn the lamp off" : "Turn the lamp on"), at: () => wp.set(-1.3, 1.5, 0.47), act: () => toggleLamp() },
    { id: "mug", label: "Take a sip", at: () => wp.set(1.25, 0.36, 0.85), act: () => sip() },
  ];
  for (const s of SPOTS) {
    const b = document.createElement("button"); b.type = "button"; b.className = "ou-spot"; b.dataset.spot = s.id;
    b.innerHTML = `<i aria-hidden="true"></i><span></span>`; b.addEventListener("click", s.act); s.el = b; spotsEl.appendChild(b);
  }

  // ---------------------------------------------------------------- per frame (driven by main.js's render loop)
  const v = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
  function project(p) { v.copy(p).project(camera); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, front: v.z < 1 }; }
  // the work tunnel's last screen: the desk opens through it as a circle from the middle that wipes out to the whole
  // screen (a hole cut in the pinned stage with a mask), while the camera settles on the desk behind it
  const wStage = document.querySelector(".works-stage");
  let wasCut = false;
  function shrinkWorks(q) {
    if (!wStage) return;
    document.body.classList.toggle("desk-in", q > 0);           // the page's white paper steps aside so the desk shows behind
    if (q <= 0 || reduce) { if (wasCut) { wStage.style.maskImage = wStage.style.webkitMaskImage = ""; wasCut = false; } return; }
    wasCut = true;
    const R = easeIO(clamp01(q / 0.9)) * (Math.hypot(innerWidth, innerHeight) / 2 + 30);
    const m = `radial-gradient(circle at 50% 50%, transparent ${R.toFixed(1)}px, #000 ${(R + 1).toFixed(1)}px)`;
    wStage.style.maskImage = wStage.style.webkitMaskImage = m;
  }
  OUT.tickers.push((dt, now) => {
    const r = section.getBoundingClientRect();
    // before the cable is plugged in the section is display:none (its rect reads 0) — that's not "here"
    const want = document.body.classList.contains("entered") ? clamp01(1 - r.top / innerHeight) : 0;
    k = reduce ? want : want * want * (3 - 2 * want);
    OUT.k = k; OUT.parallax = 0.5 * (1 - inside);
    shrinkWorks(want);
    const active = k > 0.02;
    aiko.root.visible = active && state !== "inside";
    section.classList.toggle("is-here", k > 0.96 && state !== "inside");
    if (!active) { if (crtMat.uniforms.map.value === deskTex) crtMat.uniforms.map.value = heroTex; return; }
    if (state === "desk" && k > 0.5 && crtMat.uniforms.map.value === heroTex) { drawDesk(); crtMat.uniforms.map.value = deskTex; }
    if (k < 0.5 && crtMat.uniforms.map.value === deskTex) crtMat.uniforms.map.value = heroTex;
    // camera: the desk, leaning toward Aiko while chatting, or into the tube
    tmpP.copy(DESK.pos); tmpT.copy(DESK.tgt);
    if (chatOpen) { const a = aiko.root.position; tmpT.lerp(wp.set(a.x, a.y + 0.2, a.z), 0.5); tmpP.lerp(wp.set(a.x * 0.6, 0.9, a.z + 1.9), 0.4); }
    const e = easeIO(inside);
    OUT.pos.lerpVectors(tmpP, IN.pos, e); OUT.tgt.lerpVectors(tmpT, IN.tgt, e); OUT.fov = DESK.fov + (IN.fov - DESK.fov) * e;
    aiko.update(dt, now, camera);
    pinboard?.update(dt);
    // diamonds + the bubble follow what they mark
    const here = k > 0.96 && state !== "inside";
    for (const s of SPOTS) {
      const p = project(s.at()), hide = !here || !p.front || (s.id === "look" && state === "off") || (s.id === "aiko" && chatOpen);
      s.el.hidden = hide;
      if (!hide) { s.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`; s.el.querySelector("span").textContent = typeof s.label === "function" ? s.label() : s.label; }
    }
    if (bubble.classList.contains("on")) {
      const p = project(aiko.headWorld(tmpP));
      bubble.style.transform = `translate(${Math.min(innerWidth - 160, Math.max(160, p.x)).toFixed(1)}px, ${(p.y - 18).toFixed(1)}px)`;
    }
  });

  // ---------------------------------------------------------------- pointer: hover tells, click does
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const lampParts = [ROOM.bulb, ROOM.shade].filter(Boolean);
  function pick(e) {
    ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (aiko.hit(ray)) return { id: "aiko", label: chatOpen ? "Pat Aiko" : "Tap to talk to Aiko" };
    const card = pinboard?.pick(ray);
    if (card) return { id: "pin", card, label: card.def.label };
    if (ray.intersectObjects(plug.children.concat(stripBody), false).length) return { id: "plug", label: state === "off" ? "Plug it back in" : "Pull the plug" };
    if (lampParts.length && ray.intersectObjects(lampParts, false).length) return { id: "lamp", label: lampOn ? "Turn the lamp off" : "Turn the lamp on" };
    if (ROOM.mug && ray.intersectObject(ROOM.mug, false).length) return { id: "mug", label: "Take a sip" };
    const hit = ray.intersectObject(screenMesh, false)[0];
    if (hit && state === "desk") {
      const b = bulgeUv(hit.uv.x, hit.uv.y), x = b.u * DW, y = (1 - b.v) * DH;
      for (const [id, [bx, by, bw, bh]] of Object.entries(BTN)) if (x > bx && x < bx + bw && y > by && y < by + bh) return { id: id === "look" ? "look" : "plug", screen: id, label: id === "look" ? "Look inside" : "Unplug" };
      return { id: "look", label: "Look inside" };
    }
    return null;
  }
  let hot = null, hotScreen = "";
  section.addEventListener("pointermove", (e) => {
    if (!section.classList.contains("is-here") || e.target.closest(".ac, .ou-nav, .ou-spot, .ou-off, button")) { setHot(null); return; }
    setHot(pick(e), e);
  });
  section.addEventListener("pointerleave", () => setHot(null));
  function setHot(h, e) {
    hot = h; html.classList.toggle("hand", !!h); pinboard?.setHot(h?.card || null);
    aiko.setHover(h?.id === "aiko");
    const scr = h?.screen || "";
    if (scr !== hotScreen) { hotScreen = scr; drawDesk(scr); }
    tip.hidden = !h;
    if (h && e) { tip.textContent = h.label; tip.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 18}px)`; }
  }
  section.addEventListener("click", (e) => {
    if (!section.classList.contains("is-here") || e.target.closest(".ac, .ou-nav, .ou-spot, .ou-off, button, a, input")) return;
    const h = pick(e); if (!h) return;
    if (h.id === "pin") { pinAction(h.card.def); return; }
    if (h.id === "aiko") { if (chatOpen) { aiko.poke(); say("Hehe ♥"); } else openChat(); }
    else if (h.id === "look") lookInside();
    else if (h.id === "plug") state === "off" ? plugIn() : unplug();
    else if (h.id === "lamp") toggleLamp();
    else if (h.id === "mug") sip();
  });

  // ---------------------------------------------------------------- Aiko's bubble + chat panel
  let bubbleT = 0;
  function say(text, ms = 3800) {
    bubble.textContent = text.length > 120 ? `${text.slice(0, 117)}…` : text;
    bubble.classList.add("on"); clearTimeout(bubbleT); bubbleT = setTimeout(() => bubble.classList.remove("on"), ms);
  }
  const chat = section.querySelector(".ac"), log = chat.querySelector(".ac-log"), sugg = chat.querySelector(".ac-sugg");
  const form = chat.querySelector("form"), input = form.querySelector("input"), send = form.querySelector("button");
  let face = "";
  loadAiko().then((p) => { face = p.cheer.toDataURL("image/png"); chat.querySelector(".ac-av").src = face; log.querySelectorAll(".ac-mini").forEach((i) => (i.src = face)); }).catch(() => {});
  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const linkify = (t) => esc(t).replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => `<a href="mailto:${m}">${m}</a>`);
  const time = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  let lastWho = "";
  function add(who, html) {
    if (!log.children.length) log.insertAdjacentHTML("beforeend", `<li class="ac-day"><span>Today</span></li>`);
    const li = document.createElement("li");
    li.className = `ac-msg ac-${who}${lastWho === who ? " cont" : ""}`; lastWho = who;
    li.innerHTML = `${who === "aiko" ? `<img class="ac-mini" src="${face}" alt=""><span class="ac-who">Aiko</span>` : ""}<div class="ac-bub">${html}</div><time>${time()}</time>`;
    log.appendChild(li); log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    return li;
  }
  // buttons under an answer, from what the answer is about
  function actionsFor(text) {
    const a = [];
    if (text.includes(CONFIG.cv.email)) a.push(["copy", "Copy email"], ["mail", "Write an email ↗"]);
    if (/\bWork\b|projects?/i.test(text)) a.push(["work", "Open Work"]);
    if (/Skills/.test(text)) a.push(["skills", "Open Skills"]);
    if (/CV|printer/i.test(text)) a.push(["cv", "Download CV"]);
    return a.slice(0, 3);
  }
  async function aikoSays(text, mood = "happy") {
    const li = add("aiko", `<span class="ac-dots"><i></i><i></i><i></i></span>`); li.classList.add("typing");
    aiko.talk(false, "think");
    await wait(reduce ? 0 : 500 + Math.min(900, text.length * 6));
    li.classList.remove("typing");
    const acts = actionsFor(text);
    li.querySelector(".ac-bub").innerHTML = linkify(text) + (acts.length ? `<span class="ac-acts">${acts.map(([k, l]) => `<button type="button" data-do="${k}">${l}</button>`).join("")}</span>` : "");
    log.scrollTo({ top: log.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    aiko.talk(true, mood); say(text, 4200);
    setTimeout(() => aiko.talk(false, mood), Math.min(4200, 900 + text.length * 38));
  }
  log.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-do]"); if (!b) return;
    const k = b.dataset.do;
    if (k === "copy") { try { await navigator.clipboard.writeText(CONFIG.cv.email); b.textContent = "Copied ✓"; } catch { b.textContent = CONFIG.cv.email; } }
    else if (k === "mail") location.href = `mailto:${CONFIG.cv.email}`;
    else if (k === "work" || k === "skills") lookInside(k);
    else if (k === "cv") dispatchEvent(new Event("hw-cv-download"));
  });
  // suggestions: the ones not asked yet, plus a "surprise me"
  const pool = suggestions(), asked = new Set();
  function drawSugg() {
    const left = pool.filter((q) => !asked.has(q)).slice(0, 3);
    sugg.innerHTML = [...left, "Surprise me ✦"].map((q) => `<button type="button">${esc(q)}</button>`).join("");
  }
  drawSugg();
  sugg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) ask(b.textContent === "Surprise me ✦" ? "fun fact" : b.textContent, b.textContent); });
  input.addEventListener("input", () => (send.disabled = !input.value.trim()));
  form.addEventListener("submit", (e) => { e.preventDefault(); const q = input.value.trim(); if (q) { input.value = ""; send.disabled = true; ask(q); } });
  function ask(q, shown = q) { asked.add(shown); add("me", esc(shown)); drawSugg(); const r = reply(q); aikoSays(r.text, r.mood); }
  function openChat() {
    if (state === "inside") return;
    if (chatOpen) { input.focus(); return; }
    chatOpen = true; chat.hidden = false; aiko.wake(); aiko.setChat(true);
    if (!log.children.length) aikoSays(greeting(), "happy");
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }
  function closeChat() { chatOpen = false; chat.hidden = true; aiko.setChat(false); aiko.talk(false); }
  chat.querySelector(".ac-new").addEventListener("click", () => { log.innerHTML = ""; lastWho = ""; asked.clear(); drawSugg(); aikoSays(greeting(), "happy"); });
  chat.querySelector(".ac-x").addEventListener("click", closeChat);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && chatOpen) closeChat(); });

  // ---------------------------------------------------------------- actions
  async function pinAction(d) {
    sound.click();
    if (d.href) { window.open(d.href, "_blank", "noopener"); say(`Off to ${d.id === "github" ? "GitHub" : "LinkedIn"}! ✦`, 2200); }
    else if (d.copy) { try { await navigator.clipboard.writeText(d.copy); say(`Copied! ${d.copy}`, 3000); } catch { say(d.copy, 4000); } }
    else if (d.id === "cv") { dispatchEvent(new Event("hw-cv-download")); say("Printing the CV… check your downloads!", 3000); }
    else if (d.id === "photo") { aiko.poke(); say(`That’s ${CONFIG.name.split(" ")[0]}! Looking sharp, right?`, 3000); }
    else say("Yes — open to freelance work and internships ✦", 3200);
  }
  async function lookInside(app) {
    if (state !== "desk") return;
    if (typeof app !== "string") app = undefined;
    state = "busy"; closeChat(); setHot(null);
    const os = import("./os.js");
    drawBoot(0); crtMat.uniforms.map.value = bootTex;
    await tween(1300, (t) => { inside = t; drawBoot(t); });
    state = "inside"; html.classList.add("os-open");
    (await os).openOS({ onClose: backToDesk, app });
  }
  async function backToDesk() {
    state = "busy"; html.classList.remove("os-open");
    drawDesk(); crtMat.uniforms.map.value = deskTex;
    await tween(1000, (t) => (inside = 1 - t));
    inside = 0; state = "desk";
    say("Welcome back to the desk ✦");
  }
  async function unplug() {
    if (state !== "desk") return;
    state = "busy"; closeChat(); setHot(null); sound.click();
    await tween(500, (t) => setPlug(easeOut(t)));
    crtMat.uniforms.map.value = cs.tex;                       // the tube shows the cable leaving the socket…
    const { LAYOUT } = await import("./connect-screen.js");
    await tween(650, (t) => cs.draw({ plug: { x: LAYOUT.target.x + (LAYOUT.rest.x - LAYOUT.target.x) * easeOut(t), y: LAYOUT.target.y + (LAYOUT.rest.y - LAYOUT.target.y) * easeOut(t) }, near: 1 - t, done: false, time: performance.now() / 1000 }));
    await tween(750, (t) => { crtMat.uniforms.off.value = t; OUT.power = 1 - t * t; });   // …then switches off
    OUT.power = 0; ROOM.led && (ROOM.led.material.emissiveIntensity = 0); sw.material.emissiveIntensity = 0;
    state = "off";
    window.hwSayHi?.setUnlocked(true);                       // the last screen opens below once the computer is off
    aiko.react("surprised"); say("Hey!! Who turned off the computer?! (╥﹏╥)", 4500);
  }
  async function plugIn() {
    if (state !== "off") return;
    state = "busy";
    window.hwSayHi?.setUnlocked(false);
    await tween(450, (t) => setPlug(1 - easeOut(t)));
    sound.click(); sw.material.emissiveIntensity = 0.8; ROOM.led && (ROOM.led.material.emissiveIntensity = 2);
    cs.draw({ done: true, time: performance.now() / 1000 }); crtMat.uniforms.map.value = cs.tex;
    await tween(380, (t) => { crtMat.uniforms.off.value = 1 - t; OUT.power = t; });
    crtMat.uniforms.off.value = 0; OUT.power = 1; sound.chime();
    await wait(700);
    drawDesk(); crtMat.uniforms.map.value = deskTex; state = "desk";
    aiko.poke(); say("Power’s back! Yay ✦");
  }
  function toggleLamp() {
    lampOn = !lampOn;
    if (ROOM.lamp) ROOM.lamp.intensity = lampOn ? 18 : 0;
    if (ROOM.fill) ROOM.fill.intensity = lampOn ? 2.2 : 0.35;
    if (ROOM.bulb) ROOM.bulb.material.emissiveIntensity = lampOn ? 6 : 0;
    sound.click();
    say(lampOn ? "Ahh, light! Much better." : "Ooh, spooky… I like it.", 2400);
  }
  let sipping = false;
  async function sip() {
    if (sipping || !ROOM.mug) return; sipping = true;
    const m = ROOM.mug, y0 = m.position.y;
    await tween(900, (t) => { const s = Math.sin(t * Math.PI); m.position.y = y0 + s * 0.35; m.rotation.x = s * 0.9; });
    m.position.y = y0; m.rotation.x = 0; sipping = false;
    say(["Is that coffee? Can I have some?", "Careful, it’s hot!", "Third cup today… just saying."][Math.floor(Math.random() * 3)], 2600);
  }

  // ---------------------------------------------------------------- boot screen on the tube while diving in
  const bootCanvas = document.createElement("canvas"); bootCanvas.width = DW; bootCanvas.height = DH;
  const bootTex = new THREE.CanvasTexture(bootCanvas); bootTex.colorSpace = THREE.SRGBColorSpace;
  function drawBoot(t) {
    const g = bootCanvas.getContext("2d");
    g.fillStyle = "#0b0d12"; g.fillRect(0, 0, DW, DH);
    g.fillStyle = "#ffffff"; g.font = '400 180px "Inter", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("✦", DW / 2, DH / 2 - 70);
    g.fillStyle = "rgba(255,255,255,.2)"; g.beginPath(); g.roundRect(DW / 2 - 200, DH / 2 + 110, 400, 12, 6); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.roundRect(DW / 2 - 200, DH / 2 + 110, 400 * clamp01(t * 1.15), 12, 6); g.fill();
    bootTex.needsUpdate = true;
  }
}
