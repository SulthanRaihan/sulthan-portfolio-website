// (06) Say hi — the last screen (after danyloklochko.com's closing note): a cream enamel mailbox (rendered in Blender,
// tools/blender/mailbox.py) with a sealed letter you push into the slot to copy the email address; the local clock,
// live weather and links in the corners. Hidden until the old computer on the desk is unplugged (outro.js unlocks it).
// The way in: scrolling down from the dark desk opens the cream page as a growing circle, while a letter flies out
// of the switched-off tube and lands in the mailbox's slot.
import { CONFIG } from "./config.js";
import * as sound from "./sound.js";

const S = CONFIG.sayhi, email = CONFIG.cv.email;
const root = document.getElementById("sayhi");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// where the slot sits in mailbox.webp (measured when it was rendered: mailbox.json)
const SLOT = { y: 0.1894, x0: 0.1995, x1: 0.8005 };

root.innerHTML = `
  <div class="hi-info">
    <b>${esc(CONFIG.name.toUpperCase())}</b>
    <span>${esc(CONFIG.desk.city.toUpperCase())} ${S.flag}</span>
    <span class="hi-time"></span>
    <span class="hi-weather" hidden></span>
  </div>
  <nav class="hi-links" aria-label="Elsewhere">
    ${Object.entries(CONFIG.desk.links).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k.toUpperCase())}</a>`).join("")}
    <a href="mailto:${esc(email)}">EMAIL</a>
    <button type="button" data-cv>DOWNLOAD CV</button>
  </nav>
  <div class="hi-center">
    <div class="mb" role="group" aria-label="Mailbox" style="--slot-y:${SLOT.y};--slot-x0:${SLOT.x0};--slot-x1:${SLOT.x1}">
      <div class="mb-slot"><button type="button" class="mb-letter" aria-label="Post the letter: copies ${esc(email)}"><img src="assets/mailbox/envelope.webp" alt="" draggable="false"></button></div>
      <img class="mb-box" src="assets/mailbox/mailbox.webp" alt="" draggable="false">
      <span class="mb-flap" aria-hidden="true"></span>
      <span class="mb-tag" role="status" aria-live="polite"></span>
    </div>
    <p class="hi-hint">PUSH THE LETTER IN TO SAY HI</p>
    <h2>${S.title.map(esc).join("<br>")}</h2>
    <p class="hi-sub">${esc(S.sub)}</p>
  </div>
  <footer class="hi-foot"><span>© ${new Date().getFullYear()} ${esc(CONFIG.name)}</span><button type="button" data-top>Back to the top ↑</button></footer>`;
// the letter that waits on the switched-off tube, the cream page that floods out of it, and the little "scroll" cue
const flyer = document.createElement("div"), flood = document.createElement("div"), cue = document.createElement("button");
flyer.className = "hi-flyer"; flyer.hidden = true; flyer.innerHTML = `<img src="assets/mailbox/envelope.webp" alt="" draggable="false">`;
flood.className = "hi-flood"; flood.hidden = true;
cue.type = "button"; cue.className = "hi-cue"; cue.hidden = true; cue.innerHTML = `<b><span>A LETTER FOR YOU</span><i aria-hidden="true">↓</i></b>`;
document.body.append(flood, flyer, cue);
const goDown = () => scrollTo({ top: scrollY + root.getBoundingClientRect().top, behavior: reduce ? "auto" : "smooth" });
flyer.addEventListener("click", goDown); cue.addEventListener("click", goDown);

// ---------------------------------------------------------------- clock + weather
const timeEl = root.querySelector(".hi-time");
const tick = () => { timeEl.textContent = `${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: CONFIG.desk.timeZone })} ${S.gmt}`; };
tick(); setInterval(tick, 20000);
let weatherAsked = false;
function weather() {
  if (weatherAsked) return; weatherAsked = true;
  const kind = (c) => (c >= 71 && c <= 77) || c === 85 || c === 86 ? ["Snow", "❄️"] : (c >= 51 && c <= 82) || c >= 95 ? ["Rain", "🌧️"] : c === 45 || c === 48 ? ["Fog", "🌫️"] : c === 3 || c === 2 ? ["Cloudy", "☁️"] : ["Clear", "☀️"];
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${S.lat}&longitude=${S.lon}&current=temperature_2m,weather_code`)
    .then((r) => r.json()).then((d) => {
      const [name, icon] = kind(d.current.weather_code), el = root.querySelector(".hi-weather");
      el.textContent = `${Math.round(d.current.temperature_2m)}°C · ${name.toUpperCase()} ${icon}`; el.hidden = false;
    }).catch(() => {});                                       // no weather: the line simply stays hidden
}

// ---------------------------------------------------------------- the letter: push it in (drag down), or click / Enter
const box = root.querySelector(".mb"), letter = root.querySelector(".mb-letter"), tag = root.querySelector(".mb-tag");
let push = null, dragged = false, hideTag = 0;
function say(html) { tag.innerHTML = html; tag.classList.add("on"); clearTimeout(hideTag); hideTag = setTimeout(() => tag.classList.remove("on"), 4200); }
async function post() {
  if (box.classList.contains("sent")) return;
  letter.style.transform = ""; box.classList.add("sent"); sound.click();
  setTimeout(() => box.classList.remove("sent"), reduce ? 400 : 1800);
  try { await navigator.clipboard.writeText(email); say(`Email copied — <b>${esc(email)}</b> · <a href="mailto:${esc(email)}">open mail ↗</a>`); }
  catch { say(`My email — <a href="mailto:${esc(email)}">${esc(email)}</a>`); }
}
letter.addEventListener("pointerdown", (e) => { push = { y: e.clientY, travel: letter.offsetHeight * 0.9, p: 0 }; dragged = false; letter.setPointerCapture(e.pointerId); });
letter.addEventListener("pointermove", (e) => {
  if (!push) return;
  const d = e.clientY - push.y;
  if (!dragged && Math.abs(d) < 4) return;
  dragged = true; box.classList.add("pushing");
  push.p = Math.max(0, Math.min(1, d / push.travel));
  letter.style.transform = `translateY(${(push.p * 92).toFixed(1)}%) rotate(.6deg)`;
});
const letGo = () => { if (!push) return; const p = push.p; push = null; box.classList.remove("pushing"); if (!dragged) return; if (p > 0.4) post(); else letter.style.transform = ""; };
letter.addEventListener("pointerup", letGo);
letter.addEventListener("pointercancel", () => { if (push) push.p = 0; letGo(); });
letter.addEventListener("click", () => { if (dragged) { dragged = false; return; } post(); });

root.querySelector("[data-cv]").addEventListener("click", () => dispatchEvent(new Event("hw-cv-download")));
root.querySelector("[data-top]").addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));

// ---------------------------------------------------------------- the way in (scrubbed by the scroll)
// rest: the letter floats on the dead tube with a ↓ cue. Phase A (first half of the scroll): it grows into the middle of
// the screen while the cream page floods out of it as a circle. Phase B: the page's content fades in and the letter
// shrinks down into the mailbox's slot, where the real (pushable) letter takes over.
const outroUI = document.querySelector(".outro .ou-ui");
const lerp = (a, b, t) => a + (b - a) * t;
let raf = 0;
function tubeOnScreen() {                                    // the centre of the switched-off tube, from the 3D camera
  const R = window.hwRoom;
  if (!R) return { x: innerWidth / 2, y: innerHeight * 0.35 };
  const v = R.SCREEN.center.clone().project(R.camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
}
function hideAll() { flyer.hidden = flood.hidden = cue.hidden = true; }
function frame() {
  raf = 0;
  if (root.hidden) { hideAll(); return; }
  const W = innerWidth, H = innerHeight, r = root.getBoundingClientRect();
  const p = reduce ? (r.top < H * 0.5 ? 1 : 0) : clamp01(1 - r.top / H);
  const pa = easeIO(clamp01(p / 0.5)), pb = easeIO(clamp01((p - 0.5) / 0.48));
  const away = r.top > H * 1.02, landed = reduce || p > 0.985;   // away: the desk isn't the screen right now
  root.classList.toggle("arrived", landed);
  root.style.setProperty("--in", easeIO(clamp01((p - 0.42) / 0.5)).toFixed(3));
  if (outroUI) outroUI.style.opacity = (1 - clamp01(p * 3)).toFixed(3);
  // where the letter is: tube → middle of the screen (growing) → the slot (shrinking)
  const s = tubeOnScreen(), lr = letter.getBoundingClientRect();
  const w0 = Math.min(210, W * 0.2), wBig = Math.min(W * 0.62, 560);
  let x = lerp(s.x, W / 2, pa), y = lerp(s.y, H / 2, pa), w = lerp(w0, wBig, pa), rot = -5 * (1 - pa);
  if (pb > 0) {
    const ex = lr.left + lr.width / 2, ey = lr.top + lr.height / 2;
    x = lerp(W / 2, ex, pb); y = lerp(H / 2, ey, pb) - Math.sin(pb * Math.PI) * H * 0.06; w = lerp(wBig, lr.width, pb); rot = Math.sin(pb * Math.PI) * -4;
  }
  // the cream page floods out from the letter (the fixed layer covers the desk; the section itself shows the same circle)
  const R = pa * (Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 4);
  if (p >= 0.999 || reduce) { root.style.clipPath = "none"; flood.hidden = true; }
  else {
    root.style.clipPath = `circle(${R.toFixed(1)}px at ${x.toFixed(1)}px ${(y - r.top).toFixed(1)}px)`;
    flood.hidden = away || pa <= 0;
    if (!flood.hidden) flood.style.clipPath = `circle(${R.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
  }
  if (reduce || landed || away) flyer.hidden = true;
  else {
    flyer.hidden = false;
    flyer.classList.toggle("rest", p < 0.02);
    flyer.style.setProperty("--bob", (1 - clamp01(p * 6)).toFixed(3));
    flyer.style.width = `${w.toFixed(1)}px`;
    flyer.style.translate = `${(x - w / 2).toFixed(1)}px ${(y - (w * 0.711) / 2).toFixed(1)}px`;   // translate + rotate (not transform), so the
    flyer.style.rotate = `${rot.toFixed(2)}deg`;                                                    // pop's scale grows from the letter's centre
    // the last stretch: the part of the letter below the slot's line is already inside the box
    const slotY = box.getBoundingClientRect().top + SLOT.y * box.offsetHeight, bottom = y + (w * 0.711) / 2;
    flyer.style.clipPath = pb > 0.75 && bottom > slotY ? `inset(-40% -40% ${(((bottom - slotY) / (w * 0.711)) * 100).toFixed(1)}% -40%)` : "";
  }
  cue.hidden = reduce || away || p > 0.08;
  if (!cue.hidden) {
    cue.style.opacity = (1 - clamp01(p / 0.08)).toFixed(3);
    cue.style.translate = `calc(${s.x.toFixed(1)}px - 50%) ${(s.y + w0 * 0.5 + 26).toFixed(1)}px`;
    cue.style.setProperty("--rise", `${-(w0 * 0.5 + 26).toFixed(1)}px`);                    // it slides out of the tube's centre
  }
  if (p > 0.6) weather();
  if (!reduce && !away && p < 0.999) kick();                // keep the letter glued to the tube while the camera drifts
}
const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
addEventListener("scroll", kick, { passive: true }); addEventListener("resize", kick);

// unlocked by outro.js when the computer is unplugged; locked again when it is plugged back in
export function setUnlocked(on) {
  root.hidden = !on; document.body.classList.toggle("unplugged", on);
  if (on) for (const el of [flyer, cue]) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  else { hideAll(); if (outroUI) outroUI.style.opacity = ""; }
  kick();
}
window.hwSayHi = { setUnlocked };
