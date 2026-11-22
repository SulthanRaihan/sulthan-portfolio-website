// (01) About: split headline that comes out of a blur word by word, lines that drift with the scroll,
// and the CV printer on the right (printer.js), loaded only when the section gets close.
import { CONFIG } from "./config.js";
import { drawCvPage } from "./cv-pages.js";
import { pagesToPdf } from "./cv-pdf.js";

const $ = (id) => document.getElementById(id);
const content = $("content");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
content.classList.add("js-motion");

// ---------------------------------------------------------------- text from config
$("about-label").textContent = CONFIG.about.label;
$("about-role").textContent = CONFIG.about.role;
const title = $("about-title");
for (const [text, col, drift] of CONFIG.about.lines) {
  const ln = document.createElement("span");
  ln.className = `ln c${col}`; ln.dataset.drift = drift; ln.textContent = text;
  title.appendChild(ln);
}

// ---------------------------------------------------------------- split words: each word gets its own delay
for (const el of content.querySelectorAll("[data-split]")) {
  let i = 0;
  const targets = el.querySelectorAll(".ln").length ? el.querySelectorAll(".ln") : [el];
  for (const t of targets) {
    const words = t.textContent.split(/\s+/).filter(Boolean);
    t.textContent = "";
    words.forEach((w, k) => {
      const o = document.createElement("span"); o.className = "w";
      const n = document.createElement("span"); n.textContent = w; n.style.setProperty("--i", i++);
      o.appendChild(n); t.appendChild(o);
      if (k < words.length - 1) t.appendChild(document.createTextNode(" "));
    });
  }
}
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}, { rootMargin: "0px 0px 8% 0px", threshold: 0 });
content.querySelectorAll("[data-split], [data-reveal]").forEach((el) => io.observe(el));

// ---------------------------------------------------------------- drifting lines (kinetic type)
const drifters = [...content.querySelectorAll(".ln[data-drift]")];
let raf = 0;
const drift = () => {
  raf = 0;
  if (reduce) return;
  for (const el of drifters) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > innerHeight + 200) continue;
    const p = (r.top + r.height / 2) / innerHeight - 0.5;
    el.style.transform = `translate3d(${(-p * Number(el.dataset.drift) * 7).toFixed(2)}vw, 0, 0)`;
  }
};
addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(drift); }, { passive: true });

// ---------------------------------------------------------------- the CV printer
const stage = $("cv-stage"), status = $("cv-status"), cvFig = $("cv");
let printer = null, pages = null, pdfUrl = CONFIG.cv.file || "";

async function getPdfUrl() {
  if (!pdfUrl) pdfUrl = URL.createObjectURL(await pagesToPdf(pages));
  return pdfUrl;
}
async function download() {
  const url = await getPdfUrl();
  const a = document.createElement("a");
  a.href = url; a.download = CONFIG.cv.downloadName; a.rel = "noopener"; a.style.display = "none";
  document.body.appendChild(a); a.click(); a.remove();
  status.innerHTML = `<span class="cv-ok">Printed — it’s in your downloads.</span> Not there? <a href="${url}" download="${CONFIG.cv.downloadName}">Get the PDF</a>`;
}
const say = (phase) => {
  cvFig.dataset.phase = phase;
  if (phase === "idle") status.textContent = "Click the printer to print my CV.";
  else if (phase === "warm" || phase === "clear") status.textContent = "Warming up the ink…";
  else if (phase === "feed") status.textContent = "Printing, one line at a time…";
};

async function loadPages() {
  if (CONFIG.cv.pageImages.length) {
    return Promise.all(CONFIG.cv.pageImages.map((src) => new Promise((ok, fail) => {
      const img = new Image(); img.onload = () => {
        const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0); ok(c);
      }; img.onerror = fail; img.src = src;
    })));
  }
  await Promise.all(['400 100px "Anton"', '400 30px "Inter"', '600 30px "Inter"', '800 30px "JetBrains Mono"'].map((f) => document.fonts.load(f).catch(() => {})));
  return [drawCvPage(1, CONFIG), drawCvPage(2, CONFIG)];
}

async function initPrinter() {
  pages = await loadPages();
  const { mountPrinter, webglAvailable } = await import("./printer.js");
  if (!webglAvailable()) {                                       // no 3D: show the page flat, the button still downloads
    cvFig.classList.add("is-flat");
    const img = document.createElement("img"); img.src = pages[0].toDataURL("image/jpeg", 0.85); img.alt = "";
    stage.appendChild(img);
    stage.addEventListener("click", download);
    status.textContent = "Click the page to download my CV.";
    return;
  }
  printer = mountPrinter(stage, { pages, reduced: reduce, onPhase: say, onPrinted: download });
  say("idle");
  new IntersectionObserver(([e]) => printer.setActive(e.isIntersecting)).observe(stage);
  stage.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); printer.print(); } });
}
// "Download CV" from elsewhere on the page (the pin board, the chat, the last section)
addEventListener("hw-cv-download", async () => { if (!pages) pages = await loadPages(); download(); });
// load it before it is needed: once the section is within a screen of the viewport
const near = new IntersectionObserver(([e]) => { if (e.isIntersecting) { near.disconnect(); initPrinter().catch((err) => { console.error(err); status.textContent = "The printer is out of ink. Please refresh."; }); } },
  { rootMargin: "100% 0px" });
near.observe(cvFig);
