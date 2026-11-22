// Music: the playlist in CONFIG.music, played through YouTube's IFrame Player (youtube-nocookie). YouTube's terms want
// the player visible (≥ 200×200), so it lives in a small "now playing" card at the bottom left that shows while music
// plays; closing the card pauses. Other parts listen for "hw-music" events (the radio's LCD, the SOUND button).
import { CONFIG } from "./config.js";

const LIST = CONFIG.music || [];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
let player = null, created = false, ready = false, wantPlay = false, index = 0, playing = false, failed = new Set(), card = null, tick = 0;

export const state = () => ({ index, playing, track: LIST[index], ready });
const emit = () => dispatchEvent(new CustomEvent("hw-music", { detail: state() }));

// ---------------------------------------------------------------- the card
function buildCard() {
  card = document.createElement("aside");
  card.className = "mp"; card.hidden = true; card.setAttribute("aria-label", "Music player");
  card.innerHTML = `
    <header class="mp-head"><span class="mp-dot"></span><b>Now playing</b>
      <button type="button" class="mp-listbtn" aria-expanded="false" aria-label="Playlist">≡</button>
      <button type="button" class="mp-x" aria-label="Stop and close">×</button></header>
    <div class="mp-video"><div id="mp-yt"></div></div>
    <div class="mp-meta"><b class="mp-title"></b><span class="mp-artist"></span></div>
    <div class="mp-bar"><i></i></div>
    <div class="mp-ctl">
      <button type="button" data-act="prev" aria-label="Previous">⏮</button>
      <button type="button" data-act="toggle" class="mp-play" aria-label="Play">▶</button>
      <button type="button" data-act="next" aria-label="Next">⏭</button>
    </div>
    <ol class="mp-list" hidden>${LIST.map((t, i) => `<li><button type="button" data-i="${i}"><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></button></li>`).join("")}</ol>
    <p class="mp-err" hidden></p>`;
  document.body.appendChild(card);
  card.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.classList.contains("mp-x")) { pause(); card.hidden = true; return; }
    if (b.classList.contains("mp-listbtn")) { const l = card.querySelector(".mp-list"); l.hidden = !l.hidden; b.setAttribute("aria-expanded", String(!l.hidden)); return; }
    if (b.dataset.i) { pick(+b.dataset.i); return; }
    ({ prev, next, toggle })[b.dataset.act]?.();
  });
}
function paint() {
  if (!card) return;
  const t = LIST[index];
  card.querySelector(".mp-title").textContent = t.title;
  card.querySelector(".mp-artist").textContent = t.artist;
  const pb = card.querySelector(".mp-play"); pb.textContent = playing ? "❚❚" : "▶"; pb.setAttribute("aria-label", playing ? "Pause" : "Play");
  card.classList.toggle("is-playing", playing);
  card.querySelectorAll(".mp-list button").forEach((b) => b.setAttribute("aria-current", String(+b.dataset.i === index)));
}
function progress() {
  if (!ready || !card || card.hidden) return;
  const d = player.getDuration?.() || 0, c = player.getCurrentTime?.() || 0;
  card.querySelector(".mp-bar i").style.width = d ? `${((c / d) * 100).toFixed(2)}%` : "0";
}

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
export function toggle() { (playing || (wantPlay && !ready)) ? pause() : play(); }
export function next() { create(); load(index + 1); }
export function prev() { create(); load(index - 1); }
export function pick(i) { create(); wantPlay = true; card.hidden = false; load(i); if (ready) player.playVideo(); }
export const isOn = () => wantPlay;

// warm up after the page has loaded, so the first play (inside the plug-in gesture) starts at once
if (document.readyState === "complete") setTimeout(create, 1500); else addEventListener("load", () => setTimeout(create, 1500), { once: true });
window.hwMusic = { play, pause, toggle, next, prev, pick, state };
