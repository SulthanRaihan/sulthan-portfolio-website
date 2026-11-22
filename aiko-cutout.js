// Cuts Aiko's poses out of the sticker sheet (black background) at load time: a flood fill from the crop's edges
// clears the near-black background. The character's inside is never touched, even where it is dark (hair),
// because the fill only reaches what is connected to the crop's edge.
export const SHEET = "assets/aiko/aiko-sheet.jpg";
// [x, y, w, h] in the 1402×1122 sheet
export const POSES = {
  read:   [758, 50, 300, 332],
  cheer:  [1080, 45, 322, 352],
  think:  [765, 405, 306, 345],
  laptop: [1080, 405, 316, 330],
  sleep:  [760, 765, 314, 318],
  star:   [1080, 765, 316, 322],
};

export function cutPose(img, [sx, sy, w, h], T = 30) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.drawImage(img, sx, sy, w, h, 0, 0, w, h);
  const im = g.getImageData(0, 0, w, h), d = im.data, n = w * h, bg = new Uint8Array(n);
  const dark = (i) => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) < T;
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !dark(i)) continue;
    bg[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w); if (i < n - w) stack.push(i + w);
  }
  for (let i = 0; i < n; i++) {                            // alpha, with a 1-px feather at the cut
    if (bg[i]) { d[i * 4 + 3] = 0; continue; }
    const x = i % w; let k = 0;
    if (x > 0 && bg[i - 1]) k++; if (x < w - 1 && bg[i + 1]) k++; if (i >= w && bg[i - w]) k++; if (i < n - w && bg[i + w]) k++;
    if (k) d[i * 4 + 3] = 255 - k * 45;
  }
  g.putImageData(im, 0, 0);
  return c;
}

export async function loadAiko(src = SHEET) {
  const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
  return Object.fromEntries(Object.entries(POSES).map(([k, r]) => [k, cutPose(img, r)]));
}
