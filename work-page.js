// All Work page: every project, certificate and moment (skills live only in the tunnel), filter chips,
// and the same detail popup. work.html#web / #certs / #moments opens with that filter on.
import { CONFIG } from "./config.js";
import { allItems, cardPicture, pictureURL, metaLine } from "./works-data.js";
import { openDetail } from "./modal.js";

document.getElementById("who-name").textContent = CONFIG.name;
document.getElementById("who-role").textContent = CONFIG.role;
const ITEMS = allItems();
const cats = CONFIG.works.chapters.filter((c) => c.key !== "skills");
const all = cats.flatMap((c) => ITEMS[c.key]);
const chips = document.getElementById("chips"), tiles = document.getElementById("tiles"), count = document.getElementById("count");

[{ key: "all", title: "All" }, ...cats].forEach((c) => {
  const b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.dataset.filter = c.key; b.textContent = c.title;
  chips.appendChild(b);
});
all.forEach((it) => {
  const a = document.createElement("button");
  a.type = "button"; a.className = `tile tile-${it.type}`; a.dataset.cat = it.cat; a.dataset.cursor = "view";
  a.innerHTML = `<span class="tile-img"><img alt="" loading="lazy"></span>
    <span class="tile-meta"><span class="pill"></span><b></b><span class="tile-sub"></span></span>`;
  a.querySelector(".pill").textContent = { project: "Project", cert: "Certificate", moment: "Moment" }[it.type];
  a.querySelector("b").textContent = it.title;
  a.querySelector(".tile-sub").textContent = metaLine(it);
  const img = a.querySelector("img"); img.alt = it.title;
  cardPicture(it, ITEMS[it.cat].indexOf(it)).then((p) => { img.src = pictureURL(p); img.onload = () => img.classList.add("in"); });
  a.addEventListener("click", () => openDetail(it, visible()));
  tiles.appendChild(a);
});
const visible = () => [...tiles.children].filter((t) => !t.hidden).map((t) => all[[...tiles.children].indexOf(t)]);

function filter(key) {
  if (![...chips.children].some((c) => c.dataset.filter === key)) key = "all";
  [...chips.children].forEach((c) => c.classList.toggle("on", c.dataset.filter === key));
  [...tiles.children].forEach((t) => (t.hidden = key !== "all" && t.dataset.cat !== key));
  count.textContent = `(${[...tiles.children].filter((t) => !t.hidden).length})`;
  tiles.dataset.filter = key;
}
chips.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { filter(b.dataset.filter); history.replaceState(null, "", b.dataset.filter === "all" ? location.pathname : `#${b.dataset.filter}`); } });
filter(location.hash.slice(1) || "all");
