// Aiko's brain: a small scripted Q&A over the config (no server, no AI API). The visitor's words are matched against
// keywords (English + Indonesian); answers are filled from the portfolio data, so they stay true when the config changes.
import { CONFIG } from "./config.js";

const A = CONFIG.aiko, first = CONFIG.name.split(" ")[0];
const rows = CONFIG.journey.rows;
const fmtRows = (list) => list.map((r) => `${r.stage}: ${r.place} (${r.years})`).join(" → ");
const cut = rows.findIndex((r) => r.group === "Experience");       // rows before it are education
const edu = cut < 0 ? rows : rows.slice(0, cut), exp = cut < 0 ? [] : rows.slice(cut);
const VARS = {
  name: CONFIG.name, first, role: CONFIG.role, email: CONFIG.cv.email,
  education: `${fmtRows(edu)}. Quite the journey from Balikpapan to Nanjing!`,
  experience: exp.length ? `${fmtRows(exp)}.` : `${first} is just getting started ✦`,
  skills: (() => { const s = CONFIG.works.skills.map((k) => k.name); return s.length > 1 ? `${s.slice(0, -1).join(", ")} and ${s.at(-1)}` : s.join(""); })(),
  projects: (() => { const p = CONFIG.works.projects; return `${p.length} projects so far — like ${p.slice(0, 3).map((x) => x.title).join(", ")}.`; })(),
};
const fill = (s) => s.replace(/\{(\w+)\}/g, (_, k) => (k === "fact" ? fill(A.facts[Math.floor(Math.random() * A.facts.length)]) : VARS[k] ?? ""));

export const greeting = () => fill(A.hello);
export const suggestions = () => A.suggestions.map(fill);
// → { text, mood }
export function reply(input) {
  const q = ` ${input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ")} `;
  let best = null, score = 0;
  for (const item of A.qa) {
    const s = item.keys.reduce((n, k) => n + (q.includes(` ${k}`) ? k.length : 0), 0);
    if (s > score) { score = s; best = item; }
  }
  return best ? { text: fill(best.a), mood: best.mood || "happy" } : { text: fill(A.fallback), mood: "think" };
}
