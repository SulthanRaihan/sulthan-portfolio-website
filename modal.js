// Project / certificate / moment detail popup. Opens from the tunnel and from the All Work page.
// ← → step through the same category, Esc or the backdrop closes it. Aiko reacts when it opens.
import { cardPicture, pictureURL, catLabel, metaLine } from "./works-data.js";

const dlg = document.createElement("dialog");
dlg.className = "pm"; dlg.setAttribute("aria-label", "Project details");
dlg.innerHTML = `
  <div class="pm-in">
    <button class="pm-x" type="button" aria-label="Close">×</button>
    <figure class="pm-media"><img alt=""></figure>
    <div class="pm-info">
      <p class="pm-cat"></p>
      <h3 class="pm-title"></h3>
      <p class="pm-meta"></p>
      <p class="pm-role"></p>
      <p class="pm-text"></p>
      <ul class="pm-tags"></ul>
      <div class="pm-actions"></div>
      <nav class="pm-nav" aria-label="More in this category">
        <button type="button" class="pm-prev" aria-label="Previous">←</button><span class="pm-count"></span><button type="button" class="pm-next" aria-label="Next">→</button>
      </nav>
    </div>
  </div>`;
document.body.appendChild(dlg);
const $ = (s) => dlg.querySelector(s);
let list = [], at = 0;
const cache = new Map();

async function show(i) {
  at = (i + list.length) % list.length;
  const it = list[at];
  dlg.dataset.type = it.type;
  $(".pm-cat").textContent = catLabel(it.cat);
  $(".pm-title").textContent = it.title;
  $(".pm-meta").textContent = metaLine(it);
  $(".pm-role").textContent = it.role || "";
  $(".pm-text").textContent = it.summary || "";
  $(".pm-tags").innerHTML = (it.stack || []).map((s) => `<li>${s.replace(/</g, "&lt;")}</li>`).join("");
  const label = it.type === "cert" ? "View credential" : it.type === "project" ? "Visit live" : "";
  $(".pm-actions").innerHTML = it.link && label ? `<a class="pm-btn" href="${encodeURI(it.link)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span></a>` : "";
  $(".pm-count").textContent = `${at + 1} / ${list.length}`;
  $(".pm-nav").hidden = list.length < 2;
  const img = $(".pm-media img");
  img.classList.remove("in");
  if (!cache.has(it.id)) cache.set(it.id, cardPicture(it, list.indexOf(it)).then(pictureURL));
  img.src = await cache.get(it.id);
  img.alt = it.title;
  requestAnimationFrame(() => img.classList.add("in"));
}

export function openDetail(item, siblings) {
  list = siblings && siblings.length ? siblings : [item];
  show(Math.max(0, list.findIndex((x) => x.id === item.id)));
  if (!dlg.open) { dlg.showModal(); document.documentElement.classList.add("pm-open"); }
}

$(".pm-x").addEventListener("click", () => dlg.close());
$(".pm-prev").addEventListener("click", () => show(at - 1));
$(".pm-next").addEventListener("click", () => show(at + 1));
dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });     // backdrop
dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
dlg.addEventListener("close", () => document.documentElement.classList.remove("pm-open"));
