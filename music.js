// Music: the playlist in CONFIG.music, played through YouTube's IFrame Player (youtube-nocookie) in a "now playing" card
// at the bottom left. The card can be minimized into a small tape at the left edge (the player keeps running off-screen
// — the owner chose this, knowing YouTube's embed rules ask for a visible player). The boombox on the desk opens a menu
// with the playlist and prev / play / next / stop. Other parts listen for "hw-music" events (the radio's LCD).
import { CONFIG } from "./config.js";

const LIST = CONFIG.music || [];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let player = null, created = false, ready = false, wantPlay = false, index = 0, playing = false, failed = new Set(), card = null, tick = 0;

export const state = () => ({ index, playing, track: LIST[index], ready });
const emit = () => dispatchEvent(new CustomEvent("hw-music", { detail: state() }));

// ---------------------------------------------------------------- the card, the tape, the boombox menu
let tape = null, pop = null, popAnchor = null, popRaf = 0, autoClosed = 0;
const trackList = () => LIST.map((t, i) => `<li><button type="button" data-i="${i}"><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></button></li>`).join("");
function buildCard() {
  card = document.createElement("aside");
  card.className = "mp"; card.hidden = true; card.setAttribute("aria-label", "Music player");
  card.innerHTML = `
    <header class="mp-head"><span class="mp-dot"></span><b>Now playing</b>
      <button type="button" class="mp-listbtn" aria-expanded="false" aria-label="Playlist">≡</button>
      <button type="button" class="mp-min" aria-label="Minimize to a tape" title="Minimize">–</button>
      <button type="button" class="mp-x" aria-label="Stop and close">×</button></header>
    <div class="mp-video"><div id="mp-yt"></div></div>
    <div class="mp-meta"><b class="mp-title"></b><span class="mp-artist"></span></div>
    <div class="mp-bar"><i></i></div>
    <div class="mp-ctl">
      <button type="button" data-act="prev" aria-label="Previous">⏮</button>
      <button type="button" data-act="toggle" class="mp-play" aria-label="Play">▶</button>
      <button type="button" data-act="next" aria-label="Next">⏭</button>
    </div>
    <ol class="mp-list" hidden>${trackList()}</ol>
    <p class="mp-err" hidden></p>`;
  document.body.appendChild(card);
  // minimized: a small cassette at the left edge of the screen; the player keeps running off-screen
  tape = document.createElement("button");
  tape.type = "button"; tape.className = "mp-tape"; tape.hidden = true; tape.setAttribute("aria-label", "Open the music player");
  tape.innerHTML = `<span class="mp-tape-body"><span class="mp-tape-label"><i></i></span><span class="mp-tape-win"><b></b><b></b></span></span>`;
  document.body.appendChild(tape);
  // drag it up or down the edge so it never sits on top of something you want to tap; a plain tap opens the card
  let ty = 0.5, dragY = null, moved = false;
  try { const v = parseFloat(localStorage.getItem("mp-tape-y")); if (v >= 0 && v <= 1) ty = v; } catch {}
  const placeTape = () => { tape.style.top = `${Math.round(Math.min(innerHeight - 48, Math.max(48, ty * innerHeight)))}px`; };
  placeTape(); addEventListener("resize", placeTape);
  tape.addEventListener("pointerdown", (e) => { dragY = { y: e.clientY, top: tape.getBoundingClientRect().top + tape.offsetHeight / 2 }; moved = false; tape.setPointerCapture(e.pointerId); });
  tape.addEventListener("pointermove", (e) => {
    if (!dragY) return;
    const dy = e.clientY - dragY.y;
    if (!moved && Math.abs(dy) < 6) return;
    moved = true; tape.classList.add("is-drag");
    ty = (dragY.top + dy) / innerHeight; placeTape();
  });
  const drop = () => { if (!dragY) return; dragY = null; tape.classList.remove("is-drag"); if (moved) try { localStorage.setItem("mp-tape-y", ty.toFixed(3)); } catch {} };
  tape.addEventListener("pointerup", drop); tape.addEventListener("pointercancel", drop);
  tape.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; return; } setTape(false); });
  try { if (localStorage.getItem("mp-tape") === "1") card.classList.add("is-tape"); } catch {}
  card.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("mp-x")) { stop(); return; }
    if (b.classList.contains("mp-min")) { setTape(true); return; }
    if (b.classList.contains("mp-listbtn")) { const l = card.querySelector(".mp-list"); l.hidden = !l.hidden; b.setAttribute("aria-expanded", String(!l.hidden)); return; }
    if (b.dataset.i) { pick(+b.dataset.i); return; }
    ({ prev, next, toggle })[b.dataset.act]?.();
  });
}
function setTape(on) {
  card.classList.toggle("is-tape", on);
  try { localStorage.setItem("mp-tape", on ? "1" : "0"); } catch {}
  paint();
}
function paint() {
  if (!card) return;
  const t = LIST[index];
  card.querySelector(".mp-title").textContent = t.title;
  card.querySelector(".mp-artist").textContent = t.artist;
  card.querySelector(".mp-play").textContent = playing ? "❚❚" : "▶"; card.querySelector(".mp-play").setAttribute("aria-label", playing ? "Pause" : "Play");
  card.classList.toggle("is-playing", playing);
  card.querySelectorAll(".mp-list button").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.i === index)));
  tape.hidden = card.hidden || !card.classList.contains("is-tape");
  tape.classList.toggle("is-playing", playing);
  tape.querySelector(".mp-tape-label i").textContent = `${t.title} · ${t.artist}`;
  if (pop) paintPop();
}
function progress() {
  if (!ready || !card || card.hidden) return;
  const d = player.getDuration?.() || 0, c = player.getCurrentTime?.() || 0;
  card.querySelector(".mp-bar i").style.width = d ? `${((c / d) * 100).toFixed(2)}%` : "0";
}

// the boombox's menu: opens over the radio on the desk (anchor() → screen point, followed every frame)
function paintPop() {
  const t = LIST[index];
  pop.querySelector(".mp-pop-now").innerHTML = `<b>${esc(t.title)}</b><span>${esc(t.artist)}</span>`;
  pop.querySelector("[data-act=toggle]").textContent = playing ? "❚❚" : "▶";
  pop.querySelectorAll(".mp-list button").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.i === index && (playing || wantPlay))));
}
export function openMenu(anchor) {
  create();
  if (!pop) {
    pop = document.createElement("div");
    pop.className = "mp-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Boombox");
    pop.innerHTML = `<header><span>BOOMBOX</span><button type="button" class="mp-pop-x" aria-label="Close">×</button></header>
      <div class="mp-pop-now"></div>
      <div class="mp-ctl">
        <button type="button" data-act="prev" aria-label="Previous">⏮</button>
        <button type="button" data-act="toggle" class="mp-play" aria-label="Play or pause">▶</button>
        <button type="button" data-act="next" aria-label="Next">⏭</button>
        <button type="button" data-act="stop" aria-label="Stop">■</button>
      </div>
      <ol class="mp-list">${trackList()}</ol>`;
    document.body.appendChild(pop);
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("mp-pop-x")) { closeMenu(); return; }
      if (b.dataset.i) { pick(+b.dataset.i); return; }
      ({ prev, next, toggle, stop })[b.dataset.act]?.();
    });
    addEventListener("pointerdown", (e) => { if (pop && !pop.hidden && !pop.contains(e.target)) { closeMenu(); autoClosed = performance.now(); } });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && pop && !pop.hidden) closeMenu(); });
  }
  popAnchor = anchor; pop.hidden = false; paintPop();
  const follow = () => {
    if (pop.hidden) return;
    const p = popAnchor?.(); if (p) pop.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -100%)`;
    popRaf = requestAnimationFrame(follow);
  };
  cancelAnimationFrame(popRaf); follow();
}
export function closeMenu() { if (pop) pop.hidden = true; cancelAnimationFrame(popRaf); }
export const menuOpen = () => !!pop && !pop.hidden;
// the boombox click: open, or close if this same click just closed it (pointerdown outside the menu closes it first)
export function toggleMenu(anchor) { if (menuOpen()) closeMenu(); else if (performance.now() - autoClosed > 350) openMenu(anchor); }

// ---------------------------------------------------------------- the player
function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((ok) => {
    const prevCb = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prevCb?.(); ok(); };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; document.head.appendChild(s);
  });
}
function create() {
  if (created || !LIST.length) return;
  created = true; buildCard(); paint();
  loadApi().then(() => {
    new YT.Player("mp-yt", {
      host: "https://www.youtube-nocookie.com", width: 216, height: 216, videoId: LIST[index].id,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1 },
      events: {
        onReady: (e) => { player = e.target; ready = true; if (wantPlay) player.loadVideoById(LIST[index].id); emit(); },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) { playing = true; failed.clear(); card.querySelector(".mp-err").hidden = true; }
          else if (e.data === YT.PlayerState.PAUSED) playing = false;
          else if (e.data === YT.PlayerState.ENDED) { playing = false; next(); return; }
          paint(); emit();
        },
        onError: (e) => {                                          // e.g. the owner disabled embedding: say so, try the next one
          failed.add(index);
          const err = card.querySelector(".mp-err"); err.dataset.code = e.data;
          err.innerHTML = `“${esc(LIST[index].title)}” can’t play here — <a href="https://youtu.be/${LIST[index].id}" target="_blank" rel="noopener">open on YouTube ↗</a>`; err.hidden = false;
          if (failed.size < LIST.length) setTimeout(next, 1200);
        },
      },
    });
    clearInterval(tick); tick = setInterval(progress, 500);
  });
}
function load(i) {
  index = (i + LIST.length) % LIST.length; paint(); emit();
  if (ready) wantPlay ? player.loadVideoById(LIST[index].id) : player.cueVideoById(LIST[index].id);
}

// ---------------------------------------------------------------- controls
export function play() { create(); wantPlay = true; card.hidden = false; if (ready) player.playVideo(); paint(); emit(); }
export function pause() { wantPlay = false; if (ready) player.pauseVideo(); playing = false; paint(); emit(); }
export function stop() { wantPlay = false; if (ready) { player.pauseVideo(); player.seekTo(0, true); } playing = false; card.hidden = true; paint(); emit(); }
export function toggle() { (playing || (wantPlay && !ready)) ? pause() : play(); }
export function next() { create(); load(index + 1); }
export function prev() { create(); load(index - 1); }
export function pick(i) { create(); wantPlay = true; card.hidden = false; load(i); if (ready) player.playVideo(); }
export const isOn = () => wantPlay;

// warm up after the page has loaded, so the first play (inside the plug-in gesture) starts at once
if (document.readyState === "complete") setTimeout(create, 1500); else addEventListener("load", () => setTimeout(create, 1500), { once: true });
window.hwMusic = { play, pause, stop, toggle, next, prev, pick, state, openMenu };
