// Inside the old computer: a macOS-style desktop (an old beige tube, a modern OS — after pradiplabs.dev's screen).
// Menu bar with a live clock, desktop icons, a magnifying dock, windows you can drag, close, minimise and zoom.
// Apps: Work, About me, Skills, Certificates, Photos (moments), Contact, Terminal, Aiko (chat), Notes.
// "Back to the desk" or Esc leaves. Opened by outro.js.
import { CONFIG } from "./config.js";
import { allItems, cardPicture, pictureURL, metaLine } from "./works-data.js";
import { openDetail } from "./modal.js";
import { greeting, suggestions, reply } from "./aiko-chat.js";
import { loadAiko } from "./aiko-cutout.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ITEMS = allItems(), first = CONFIG.name.split(" ")[0];
let aikoFace = "";
loadAiko().then((p) => { aikoFace = p.cheer.toDataURL("image/png"); document.querySelectorAll("img[data-aiko]").forEach((i) => (i.src = aikoFace)); }).catch(() => {});

// ---------------------------------------------------------------- app icons (drawn, no image files)
const ICON = {
  work: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#2f7fe0"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="#fff"/><path d="M12 22a4 4 0 0 1 4-4h10l4 4h18a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="url(#gw)"/></svg>`,
  about: `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#fff"/><circle cx="32" cy="25" r="9" fill="none" stroke="#2f9bff" stroke-width="4"/><path d="M16 50c2-9 8-13 16-13s14 4 16 13" fill="none" stroke="#2f9bff" stroke-width="4" stroke-linecap="round"/></svg>`,
  skills: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gs" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b61ff"/><stop offset="1" stop-color="#3b0de7"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#gs)"/><path d="M24 22 14 32l10 10M40 22l10 10-10 10M35 18l-6 28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  certs: `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#ffd23f"/><circle cx="32" cy="27" r="11" fill="#fff"/><circle cx="32" cy="27" r="6" fill="#ff8a3d"/><path d="M25 36l-4 14 7-3 4 6 3-13M39 36l4 14-7-3-4 6" fill="#ff8a3d"/></svg>`,
  photos: `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#fff"/>${["#ff5f57", "#febc2e", "#28c840", "#2f9bff", "#7b61ff", "#ff4f79"].map((c, i) => `<ellipse cx="32" cy="21" rx="6" ry="11" fill="${c}" opacity=".85" transform="rotate(${i * 60} 32 32)"/>`).join("")}</svg>`,
  mail: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fb6ff"/><stop offset="1" stop-color="#1f52f6"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#gm)"/><rect x="13" y="19" width="38" height="27" rx="4" fill="#fff"/><path d="m14 21 18 14 18-14" fill="none" stroke="#1f52f6" stroke-width="3"/></svg>`,
  terminal: `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#1d1f24"/><path d="m16 24 9 8-9 8M30 42h16" fill="none" stroke="#e6e6e6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  aiko: `<svg viewBox="0 0 64 64"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8b2ff"/><stop offset="1" stop-color="#6b5fe0"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#ga)"/><path d="M14 30c0-9 8-15 18-15s18 6 18 15-8 15-18 15c-3 0-6-.5-8-1.5L15 47l2-7c-2-3-3-6-3-10z" fill="#fff"/><path d="M24 26l2-6 4 4M40 26l-2-6-4 4" fill="#6b5fe0"/><circle cx="27" cy="31" r="2" fill="#6b5fe0"/><circle cx="37" cy="31" r="2" fill="#6b5fe0"/></svg>`,
  notes: `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="15" fill="#fff"/><rect x="0" y="0" width="64" height="18" rx="15" fill="#ffd23f"/><rect y="9" width="64" height="9" fill="#ffd23f"/><path d="M16 30h32M16 39h32M16 48h20" stroke="#cfcfcf" stroke-width="3"/></svg>`,
};
const APPS = [
  { id: "work", title: "Work", w: 920, h: 600 },
  { id: "about", title: "About me", w: 720, h: 560 },
  { id: "skills", title: "Skills", w: 640, h: 460 },
  { id: "certs", title: "Certificates", w: 680, h: 500 },
  { id: "photos", title: "Photos", w: 820, h: 560 },
  { id: "mail", title: "Contact", w: 560, h: 520 },
  { id: "terminal", title: "Terminal", w: 640, h: 400 },
  { id: "aiko", title: "Aiko", w: 420, h: 560 },
  { id: "notes", title: "Notes", w: 420, h: 420 },
];

// ---------------------------------------------------------------- app contents
const thumbs = new Map();
const pic = (it, i) => { if (!thumbs.has(it.id)) thumbs.set(it.id, cardPicture(it, i).then(pictureURL)); return thumbs.get(it.id); };
function fillImgs(root, list) { root.querySelectorAll("img[data-i]").forEach((img) => pic(list[+img.dataset.i], +img.dataset.i).then((u) => (img.src = u))); }
const RENDER = {
  work(el) {
    const list = ITEMS.web;
    el.innerHTML = `<div class="os-pad"><h2 class="os-h">${list.length} projects, built with care.</h2><p class="os-sub">Open one to see what it is, who it was for and how it was made.</p>
      <div class="os-grid">${list.map((it, i) => `<button class="os-card" data-i="${i}"><span class="os-thumb"><img data-i="${i}" alt=""></span><b>${esc(it.title)}</b><span>${esc(it.kind)} · ${esc(it.year)}</span></button>`).join("")}</div></div>`;
    fillImgs(el, list);
    el.addEventListener("click", (e) => { const b = e.target.closest(".os-card"); if (b) openDetail(list[+b.dataset.i], list); });
  },
  about(el) {
    const rows = CONFIG.journey.rows, cut = rows.findIndex((r) => r.group === "Experience");
    const line = (r) => `<li><span class="os-chip">${esc(r.stage)}</span><b>${esc(r.place)}</b><span>${esc(r.city)} · ${esc(r.years)}</span></li>`;
    el.innerHTML = `<div class="os-pad os-about">
      <div class="os-me"><div class="os-avatar">${CONFIG.portrait.image ? `<img src="${esc(CONFIG.portrait.image)}" alt="">` : esc(CONFIG.name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</div>
        <div><h2 class="os-h">${esc(CONFIG.name)}</h2><p class="os-sub">${esc(CONFIG.about.role)}</p></div></div>
      <p>${esc(CONFIG.cv.intro)}</p>
      <h3>Education</h3><ul class="os-tl">${(cut < 0 ? rows : rows.slice(0, cut)).map(line).join("")}</ul>
      ${cut < 0 ? "" : `<h3>Experience</h3><ul class="os-tl">${rows.slice(cut).map(line).join("")}</ul>`}
      <div class="os-actions"><a class="os-btn" href="#about" data-leave>Print my CV ↗</a><button class="os-btn ghost" data-open="mail">Say hi</button></div></div>`;
  },
  skills(el) {
    const list = ITEMS.skills;
    el.innerHTML = `<div class="os-pad"><h2 class="os-h">Toolbox</h2><p class="os-sub">What ${esc(first)} works with, every day.</p>
      <div class="os-skills">${list.map((it, i) => `<figure><img data-i="${i}" alt=""><figcaption>${esc(it.name)}</figcaption></figure>`).join("")}</div></div>`;
    fillImgs(el, list);
  },
  certs(el) {
    const list = ITEMS.certs;
    el.innerHTML = `<div class="os-pad"><h2 class="os-h">Certificates</h2><ul class="os-list">${list.map((it, i) => `<li><button data-i="${i}"><img data-i="${i}" alt=""><span><b>${esc(it.title)}</b><span>${esc(it.issuer)} · ${esc(it.year)}</span></span><i>›</i></button></li>`).join("")}</ul></div>`;
    fillImgs(el, list);
    el.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) openDetail(list[+b.dataset.i], list); });
  },
  photos(el) {
    const list = ITEMS.moments;
    el.innerHTML = `<div class="os-photos">${list.map((it, i) => `<button data-i="${i}" title="${esc(it.title)}"><img data-i="${i}" alt="${esc(it.title)}"></button>`).join("")}</div>`;
    fillImgs(el, list);
    el.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) openDetail(list[+b.dataset.i], list); });
  },
  mail(el) {
    el.innerHTML = `<form class="os-pad os-mail"><h2 class="os-h">Say hello</h2><p class="os-sub">Goes straight to ${esc(CONFIG.cv.email)}</p>
      <label>Your name<input name="n" required autocomplete="name"></label><label>Your email<input name="e" type="email" required autocomplete="email"></label>
      <label>Message<textarea name="m" rows="5" required placeholder="A project, a role, or just hi…"></textarea></label>
      <button class="os-btn">Send ↗</button>
      <p class="os-links">${Object.entries(CONFIG.desk.links).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(k)} ↗</a>`).join("")}</p></form>`;
    el.querySelector("form").addEventListener("submit", (e) => {
      e.preventDefault(); const f = new FormData(e.target);
      location.href = `mailto:${CONFIG.cv.email}?subject=${encodeURIComponent(`Hello from ${f.get("n")}`)}&body=${encodeURIComponent(`${f.get("m")}\n\n— ${f.get("n")} (${f.get("e")})`)}`;
    });
  },
  terminal(el) {
    el.innerHTML = `<div class="os-term"><pre></pre><form><span>${esc(first.toLowerCase())}@sulthan-raihan ~ %</span><input aria-label="Command" autocomplete="off" spellcheck="false"></form></div>`;
    const out = el.querySelector("pre"), form = el.querySelector("form"), input = form.querySelector("input"), hist = []; let hi = 0;
    const print = (s) => { out.textContent += `${s}\n`; out.parentElement.scrollTop = 1e9; };
    print(`Last login: ${new Date().toDateString()} on ttys000\nType 'help' to see what I can do.\n`);
    const CMD = {
      help: () => "help · whoami · about · education · skills · projects · contact · open <app> · aiko <question> · date · clear · sudo hire-me · exit",
      whoami: () => `${CONFIG.name}${CONFIG.nameZh ? ` (${CONFIG.nameZh})` : ""} — ${CONFIG.about.role}`,
      about: () => CONFIG.cv.intro,
      education: () => reply("education").text,
      skills: () => ITEMS.skills.map((s) => s.name).join("  "),
      projects: () => ITEMS.web.map((p, i) => `${String(i + 1).padStart(2, "0")}  ${p.title.padEnd(24)} ${p.kind}`).join("\n"),
      contact: () => `${CONFIG.cv.email}\n${CONFIG.cv.email2 ? `${CONFIG.cv.email2}\n` : ""}${Object.entries(CONFIG.desk.links).map(([k, u]) => `${k}: ${u}`).join("\n")}`,
      date: () => new Date().toString(),
      "sudo": (a) => (a.join(" ") === "hire-me" ? `[sudo] password for visitor: ********\nAccess granted ✦ Opening Contact…` : "sudo: try 'sudo hire-me'"),
      open: (a) => (APPS.some((x) => x.id === a[0]) ? (openApp(a[0]), `opening ${a[0]}…`) : `open: no such app. Try: ${APPS.map((x) => x.id).join(", ")}`),
      aiko: (a) => `aiko> ${reply(a.join(" ") || "hello").text}`,
      clear: () => { out.textContent = ""; return null; },
      exit: () => { closeWin("terminal"); return null; },
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault(); const line = input.value.trim(); input.value = ""; if (!line) return;
      hist.push(line); hi = hist.length;
      print(`${first.toLowerCase()}@sulthan-raihan ~ % ${line}`);
      const [c, ...args] = line.split(/\s+/), fn = CMD[c.toLowerCase()];
      const r = fn ? fn(args) : `zsh: command not found: ${c}`;
      if (r !== null) print(r);
      if (c === "sudo" && args.join(" ") === "hire-me") setTimeout(() => openApp("mail"), 700);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" && hi > 0) { input.value = hist[--hi]; e.preventDefault(); }
      if (e.key === "ArrowDown") { input.value = hist[++hi] ?? ""; hi = Math.min(hi, hist.length); e.preventDefault(); }
    });
    el.addEventListener("click", () => input.focus());
  },
  aiko(el) {
    el.innerHTML = `<div class="os-chat"><header><img data-aiko src="${aikoFace}" alt=""><div><b>Aiko</b><span>study buddy · online</span></div></header>
      <ol></ol><div class="os-sugg">${suggestions().map((s) => `<button type="button">${esc(s)}</button>`).join("")}</div>
      <form><input placeholder="iMessage Aiko…" aria-label="Message Aiko"><button aria-label="Send">↑</button></form></div>`;
    const log = el.querySelector("ol"), form = el.querySelector("form"), input = form.querySelector("input");
    const add = (who, t) => { const li = document.createElement("li"); li.className = who; li.textContent = t; log.appendChild(li); log.scrollTop = 1e9; return li; };
    const answer = (q) => { add("me", q); const li = add("her typing", "…"); setTimeout(() => { li.className = "her"; li.textContent = reply(q).text; log.scrollTop = 1e9; }, 650); };
    add("her", greeting());
    el.querySelector(".os-sugg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) answer(b.textContent); });
    form.addEventListener("submit", (e) => { e.preventDefault(); const q = input.value.trim(); if (q) { input.value = ""; answer(q); } });
  },
  notes(el) {
    el.innerHTML = `<div class="os-pad os-notes"><h2 class="os-h">Now</h2><ul>${CONFIG.desk.now.map((n) => `<li>${esc(n)}</li>`).join("")}</ul><p class="os-sub">Updated whenever ${esc(first)} remembers to.</p></div>`;
  },
};

// ---------------------------------------------------------------- the desktop
let root = null, onClose = null, zTop = 10;
const wins = new Map();
function build() {
  root = document.createElement("div");
  root.className = "os"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", `${first}’s computer`);
  root.innerHTML = `
    <div class="os-bar-top"><button class="os-back" type="button">← Back to the desk</button><span class="os-esc">Esc</span></div>
    ${CONFIG.desk.notes.map((n, i) => `<div class="os-sticky s${i}"><p>${esc(n).replace(/\n/g, "<br>")}</p></div>`).join("")}
    <div class="os-bezel"><div class="os-screen">
      <header class="os-menu"><b class="os-logo">✦</b><b>${esc(CONFIG.name)}</b>${["work", "about", "mail", "aiko"].map((id) => `<button data-open="${id}">${APPS.find((a) => a.id === id).title}</button>`).join("")}<span class="os-clock"></span></header>
      <nav class="os-icons">${["work", "about", "mail", "terminal", "aiko"].map((id) => `<button data-open="${id}"><span class="os-ico">${ICON[id]}</span><span>${APPS.find((a) => a.id === id).title}</span></button>`).join("")}</nav>
      <div class="os-wins"></div>
      <nav class="os-dock">${APPS.map((a) => `<button data-open="${a.id}" aria-label="${a.title}"><span class="os-ico">${ICON[a.id]}</span><i></i><em>${a.title}</em></button>`).join("")}</nav>
    </div><span class="os-glass" aria-hidden="true"></span></div>`;
  document.body.appendChild(root);
  root.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]"); if (o) { openApp(o.dataset.open); return; }
    const leave = e.target.closest("[data-leave]"); if (leave) { e.preventDefault(); closeOS(); setTimeout(() => document.querySelector(leave.getAttribute("href"))?.scrollIntoView({ behavior: "smooth" }), 900); }
  });
  root.querySelector(".os-back").addEventListener("click", () => closeOS());
  // dock magnification
  const dock = root.querySelector(".os-dock");
  dock.addEventListener("pointermove", (e) => dock.querySelectorAll("button").forEach((b) => {
    const r = b.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2));
    b.style.setProperty("--m", (1 + 0.55 * Math.max(0, 1 - d / 150)).toFixed(3));
  }));
  dock.addEventListener("pointerleave", () => dock.querySelectorAll("button").forEach((b) => b.style.setProperty("--m", 1)));
  const clock = root.querySelector(".os-clock");
  const tick = () => { clock.textContent = `${CONFIG.desk.city}  ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: CONFIG.desk.timeZone })}`; };
  tick(); setInterval(tick, 20000);
}

function openApp(id) {
  const app = APPS.find((a) => a.id === id); if (!app) return;
  const ex = wins.get(id);
  if (ex) { ex.hidden = false; ex.classList.remove("min"); focus(ex); return; }
  const screen = root.querySelector(".os-screen"), sr = screen.getBoundingClientRect();
  const w = Math.min(app.w, sr.width - 40), h = Math.min(app.h, sr.height - 130), n = wins.size;
  const win = document.createElement("section");
  win.className = "os-win"; win.dataset.app = id; win.setAttribute("aria-label", app.title);
  win.style.width = `${w}px`; win.style.height = `${h}px`;
  win.style.left = `${Math.max(10, (sr.width - w) / 2 - 60 + n * 28)}px`; win.style.top = `${Math.max(40, (sr.height - h) / 2 - 30 + n * 24)}px`;
  win.innerHTML = `<header class="os-title"><span class="os-lights"><button class="r" aria-label="Close"></button><button class="y" aria-label="Minimise"></button><button class="g" aria-label="Zoom"></button></span><b>${app.title}</b></header><div class="os-body"></div>`;
  root.querySelector(".os-wins").appendChild(win);
  RENDER[id](win.querySelector(".os-body"));
  wins.set(id, win); focus(win);
  if (id === "terminal" || id === "aiko") setTimeout(() => win.querySelector("input")?.focus({ preventScroll: true }), 60);
  root.querySelector(`.os-dock [data-open="${id}"]`)?.classList.add("on");
  win.querySelector(".r").addEventListener("click", () => closeWin(id));
  win.querySelector(".y").addEventListener("click", () => { win.classList.add("min"); setTimeout(() => (win.hidden = true), 300); });
  win.querySelector(".g").addEventListener("click", () => win.classList.toggle("max"));
  win.addEventListener("pointerdown", () => focus(win));
  // drag by the title bar
  const bar = win.querySelector(".os-title");
  bar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || win.classList.contains("max")) return;
    const sx = e.clientX - win.offsetLeft, sy = e.clientY - win.offsetTop; bar.setPointerCapture(e.pointerId);
    const mv = (ev) => { win.style.left = `${ev.clientX - sx}px`; win.style.top = `${Math.max(28, ev.clientY - sy)}px`; };
    const up = () => { bar.removeEventListener("pointermove", mv); bar.removeEventListener("pointerup", up); };
    bar.addEventListener("pointermove", mv); bar.addEventListener("pointerup", up);
  });
  bar.addEventListener("dblclick", () => win.classList.toggle("max"));
}
function closeWin(id) {
  const w = wins.get(id); if (!w) return;
  w.classList.add("closing"); setTimeout(() => w.remove(), 220); wins.delete(id);
  root.querySelector(`.os-dock [data-open="${id}"]`)?.classList.remove("on");
}
function focus(win) { win.style.zIndex = ++zTop; root.querySelectorAll(".os-win").forEach((w) => w.classList.toggle("front", w === win)); }

function onKey(e) {
  if (e.key !== "Escape" || document.querySelector(".pm[open]")) return;
  closeOS();
}
export function openOS(opts = {}) {
  onClose = opts.onClose || null;
  if (!root) build();
  root.hidden = false; requestAnimationFrame(() => root.classList.add("on"));
  if (opts.app) openApp(opts.app); else if (!wins.size) openApp("work");
  addEventListener("keydown", onKey);
  setTimeout(() => root.querySelector(".os-back").focus({ preventScroll: true }), 400);
}
export function closeOS() {
  if (!root || root.hidden) return;
  removeEventListener("keydown", onKey);
  root.classList.remove("on");
  setTimeout(() => { root.hidden = true; }, 450);
  onClose?.();
}
