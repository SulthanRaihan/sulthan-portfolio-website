// Pixel cursor in 3D: an arrow, a pointing hand and a "view" magnifier built from voxels; it tilts with the pointer's
// speed and pops when it changes shape. Fine pointers only (mouse / trackpad); touch screens keep their own behaviour.
import * as THREE from "three";

const SHAPES = {
  arrow: { hot: [0, 0], rows: [
    "X...........", "XX..........", "X.X.........", "X..X........", "X...X.......", "X....X......", "X.....X.....", "X......X....",
    "X.......X...", "X........X..", "X.........X.", "X......XXXXX", "X...X..X....", "X..XX..X....", "X.X..X..X...", "XX...X..X...",
    "X.....X..X..", "......X..X..", ".......XX...",
  ] },
  hand: { hot: [4.5, 0], rows: [
    "....XX..........", "...X..X.........", "...X..X.........", "...X..X.........", "...X..XXX.......", "...X..X..XXX....",
    "...X..X..X..XX..", "...X..X..X..X.X.", "XXXX..X..X..X..X", "X..X...........X", "X..X...........X", ".X.............X",
    "..X............X", "..X...........X.", "...X..........X.", "...X.........X..", "....X........X..", "....XXXXXXXXXX..",
  ] },
  view: { hot: [6.5, 6.5], rows: [                                     // magnifier: "open this"
    "....XXXXX.......", "..XX.....XX.....", ".X.........X....", ".X.........X....", "X...........X...", "X...........X...",
    "X...........X...", "X...........X...", "X...........X...", ".X.........X....", ".X.........XX...", "..XX.....XX.XX..",
    "....XXXXX....XX.", ".............XXX", "..............XX",
  ] },
};
// outline + the cells enclosed by it (flood fill from the outside)
function cells(rows) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length)), g = rows.map((r) => r.padEnd(w, "."));
  const out = g.map((r) => [...r].map(() => false)), st = [];
  for (let x = 0; x < w; x++) st.push([x, 0], [x, h - 1]);
  for (let y = 0; y < h; y++) st.push([0, y], [w - 1, y]);
  while (st.length) {
    const [x, y] = st.pop();
    if (x < 0 || y < 0 || x >= w || y >= h || out[y][x] || g[y][x] === "X") continue;
    out[y][x] = true; st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const ink = [], fill = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) (g[y][x] === "X" ? ink : !out[y][x] ? fill : []).push([x, y]);
  return { ink, fill };
}

const fine = matchMedia("(pointer: fine)").matches && !matchMedia("(hover: none)").matches;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (fine) {
  const PX = 2.6, SIZE = 128, HOT = 36;
  const canvas = document.createElement("canvas");
  canvas.className = "cursor-3d"; canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  document.documentElement.classList.add("has-3d-cursor");
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(SIZE, SIZE, false);
  const scene = new THREE.Scene(), half = SIZE / PX / 2, cam = new THREE.OrthographicCamera(-half, half, half, -half, -50, 50);
  scene.add(new THREE.AmbientLight("#ffffff", 1.6));
  const key = new THREE.DirectionalLight("#fff3e2", 2.4); key.position.set(-4, 6, 9); scene.add(key);
  const rim = new THREE.DirectionalLight("#8fb0ff", 1.4); rim.position.set(6, -3, 2); scene.add(rim);
  const box = new THREE.BoxGeometry(1, 1, 1);
  const inkMat = new THREE.MeshStandardMaterial({ color: "#061a2b", roughness: 0.4, metalness: 0.1 });
  const fillMat = new THREE.MeshStandardMaterial({ color: "#f6f1e7", roughness: 0.45 });
  const viewFill = new THREE.MeshStandardMaterial({ color: "#2f9bff", roughness: 0.35, emissive: "#0b3463", emissiveIntensity: 0.4 });
  const pivot = new THREE.Group(); scene.add(pivot);
  const models = {};
  for (const [name, s] of Object.entries(SHAPES)) {
    const { ink, fill } = cells(s.rows), grp = new THREE.Group(), o = new THREE.Object3D();
    const add = (list, mat, depth, z) => {
      const m = new THREE.InstancedMesh(box, mat, list.length);
      list.forEach(([x, y], i) => { o.position.set(x - s.hot[0] + 0.5, -(y - s.hot[1]) - 0.5, z); o.scale.set(1, 1, depth); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
      grp.add(m);
    };
    add(ink, inkMat, 3.2, 0);                                           // outline stands proud
    add(fill, name === "view" ? viewFill : fillMat, 1.4, -0.4);         // fill sits recessed
    grp.visible = false; pivot.add(grp); models[name] = grp;
  }
  const offset = (SIZE / 2 - HOT) / PX;
  pivot.position.set(-offset, offset, 0);

  let shape = "arrow"; models.arrow.visible = true;
  let x = -200, y = -200, px = x, py = y, vx = 0, vy = 0, tiltX = 0, tiltY = 0, press = 1, pop = 1, shown = false, last = performance.now(), sig = "";
  const HAND = "a, button, [role=button], label, select, summary, .is-hot, [data-cursor=hand]";
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { px = x; py = y; shown = true; canvas.style.opacity = "1"; }
    const hc = document.documentElement.classList, t = e.target.closest ? e.target : null;
    const want = hc.contains("view") || t?.closest("[data-cursor=view]") ? "view" : t?.closest(HAND) || hc.contains("hand") || hc.contains("grab") ? "hand" : "arrow";
    if (want !== shape) { models[shape].visible = false; shape = want; models[shape].visible = true; pop = 0.75; }
  }, { passive: true });
  document.addEventListener("pointerleave", () => { canvas.style.opacity = "0"; shown = false; });
  addEventListener("pointerdown", () => (press = 0.8));
  addEventListener("pointerup", () => (press = 1));
  (function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    vx += ((x - px) / Math.max(dt, 1e-3) - vx) * 0.25; vy += ((y - py) / Math.max(dt, 1e-3) - vy) * 0.25; px = x; py = y;
    const k = reduce ? 0 : 1;
    const tx = THREE.MathUtils.clamp(vy * 0.0009, -0.7, 0.7) * k + 0.3, ty = THREE.MathUtils.clamp(vx * 0.0011, -0.8, 0.8) * k - 0.36;
    tiltX += (tx - tiltX) * (1 - Math.exp(-dt * 12)); tiltY += (ty - tiltY) * (1 - Math.exp(-dt * 12));
    pivot.rotation.set(tiltX, tiltY, 0);
    pop += (1 - pop) * (1 - Math.exp(-dt * 14));
    const s = pop * (press < 1 ? 0.88 : 1);
    pivot.scale.setScalar(s);
    canvas.style.transform = `translate3d(${x - HOT}px, ${y - HOT}px, 0)`;
    const now2 = `${tiltX.toFixed(3)}|${tiltY.toFixed(3)}|${s.toFixed(3)}|${shape}`;
    if (now2 !== sig) { renderer.render(scene, cam); sig = now2; }             // re-render only while it moves
    requestAnimationFrame(tick);
  })(last);
}
