// The CRT tube: a shader for the curved glass, and the first "real" screen drawn to a canvas.
import * as THREE from "three";

// One bulge formula, shared with the pointer picking in main.js (so dragging lines up with the curved picture).
export const BULGE = { k: 0.36, scale: 0.94 };
export function bulgeUv(u, v) {
  const cx = u - 0.5, cy = v - 0.5, f = (1 + BULGE.k * (cx * cx + cy * cy)) * BULGE.scale;
  return { u: 0.5 + cx * f, v: 0.5 + cy * f };
}

export function makeCrtMaterial(map) {
  return new THREE.ShaderMaterial({
    toneMapped: false, fog: false,
    uniforms: { map: { value: map }, time: { value: 0 }, power: { value: 1 }, off: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      uniform sampler2D map; uniform float time, power, off; varying vec2 vUv;
      void main(){
        vec2 c = vUv - .5;
        vec2 uv = .5 + c * (1. + ${BULGE.k.toFixed(3)} * dot(c, c)) * ${BULGE.scale.toFixed(3)};   // picture bulges like a convex tube
        if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) { gl_FragColor = vec4(0., 0., 0., 1.); return; }
        // switching off (off 0 → 1): the picture squashes into a bright line, the line into a dot, the dot fades
        float vy = clamp(off / .6, 0., 1.), vx = clamp((off - .6) / .4, 0., 1.);
        if (off > 0.) {
          vec2 q = uv - .5, s = vec2(mix(1., .006, vx), mix(1., .006, vy * vy));
          if (abs(q.x) > .5 * s.x || abs(q.y) > .5 * s.y) { gl_FragColor = vec4(0., 0., 0., 1.); return; }
          uv = .5 + q / s;
        }
        vec3 col = texture2D(map, uv).rgb;
        col *= (1. + vy * 3.) * (1. - smoothstep(.85, 1., off));
        // scanlines, faded out when the screen is too small on screen to show them (they would alias into stripes)
        float lines = fwidth(uv.y) * 540.;
        col *= 1. - .14 * (.5 - .5 * cos(uv.y * 540. * 6.28318)) * (1. - smoothstep(.5, 1., lines));
        col *= 1. + .03 * sin(uv.y * 7. - time * 1.4);                          // slow rolling brightness band
        col *= mix(.5, 1., smoothstep(.78, .28, length(c * vec2(1., 1.15))));   // darker tube corners
        col += vec3(.003, .006, .012);                                          // phosphor never quite black
        gl_FragColor = vec4(col * power * 1.05, 1.);
      }`,
  });
}

// The screen that appears after the cable is plugged in. 1440×1080 = 4:3 glass.
// A code-editor / terminal look built around the site's logo: the "Sulthan / Raihan" mark top left, a status pill,
// the headline as a prompt line with a block cursor, a code comment with the eras, and an editor status bar.
export function makeHeroTexture(config) {
  const W = 1440, H = 1080, M = "JetBrains Mono", BLUE = "#2f9bff", ICE = "#d6ecff", DIM = "#5f83a6";
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#061a2b"; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.3, H * 0.55, 0, W * 0.3, H * 0.55, W * 0.75);
  glow.addColorStop(0, "rgba(47,155,255,.22)"); glow.addColorStop(0.5, "rgba(47,155,255,.06)"); glow.addColorStop(1, "rgba(47,155,255,0)");
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.fillStyle = "rgba(214,236,255,.075)";                               // dot grid
  for (let y = 18; y < H; y += 36) for (let x = 18; x < W; x += 36) g.fillRect(x - 1.5, y - 1.5, 3, 3);
  // a faint giant </> in the corner
  g.save(); g.globalAlpha = 0.05; g.fillStyle = ICE; g.font = `800 330px "${M}"`; g.textAlign = "right"; g.textBaseline = "alphabetic";
  g.fillText("</>", W - 110, H - 200); g.restore();

  // logo block, top left — the same mark as the site header
  const lx = 150, ly = 150;
  g.fillStyle = "#ffffff"; g.font = `800 66px "${M}"`; g.textBaseline = "alphabetic";
  const tight = (txt, x, y, sp) => { let cx = x; for (const ch of txt) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + sp; } return cx; };
  const w1 = tight("Sulthan", lx, ly + 52, -3), w2 = tight("Raihan", lx, ly + 52 + 57, -3);
  const dx = Math.max(w1, w2) + 34;
  g.fillStyle = "rgba(214,236,255,.25)"; g.fillRect(dx, ly + 4, 2, 104);
  g.font = `500 27px "${M}"`; g.fillStyle = ICE;
  g.fillText(`${config.nameZh || ""} · ${config.role || "software engineer"}`, dx + 30, ly + 42);
  g.fillStyle = DIM; g.fillText("nanjing, cn — gmt+8", dx + 30, ly + 88);

  // status pill, top right
  g.font = `500 25px "${M}"`; const pt = "available for work", pw = g.measureText(pt).width + 82, px = W - 150 - pw, py = ly + 22;
  g.beginPath(); g.roundRect(px, py, pw, 58, 29); g.strokeStyle = "rgba(214,236,255,.35)"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#3ddc84"; g.beginPath(); g.arc(px + 32, py + 29, 8, 0, 7); g.fill();
  g.fillStyle = ICE; g.fillText(pt, px + 54, py + 38);

  // the headline as a prompt: "> I build things" / "that think▌"
  const [l1, l2] = config.headline;
  let size = 124; g.font = `800 ${size}px "${M}"`;
  const maxW = W - 300, wide = Math.max(g.measureText("> " + l1).width, g.measureText(l2).width + size * 0.7);
  if (wide > maxW) { size = Math.floor(size * maxW / wide); g.font = `800 ${size}px "${M}"`; }
  const hx = 150, y1 = 520, y2 = y1 + size * 1.08, sp = -size * 0.035;
  g.fillStyle = BLUE; let x = tight(">", hx, y1, sp) + size * 0.3;
  g.fillStyle = "#ffffff"; tight(l1, x, y1, sp);
  const words = l2.split(" "), last = words.pop(), lead = words.length ? words.join(" ") + " " : "";
  g.fillStyle = "#ffffff"; x = tight(lead, hx, y2, sp);
  const grad = g.createLinearGradient(x, 0, x + size * 3, 0); grad.addColorStop(0, BLUE); grad.addColorStop(1, "#8fd0ff");
  g.fillStyle = grad; x = tight(last, x, y2, sp);
  g.fillStyle = BLUE; g.fillRect(x + size * 0.08, y2 - size * 0.74, size * 0.5, size * 0.84);   // block cursor

  // the eras as a code comment
  g.font = `500 31px "${M}"`; g.fillStyle = DIM;
  const eras = (config.portrait?.eras || []).map(([n]) => n.toLowerCase()).join(" · ");
  g.fillText(`// ${eras || "full-stack · mobile · ai"}`, hx, y2 + 96);

  // editor status bar
  const by = H - 170;
  g.fillStyle = "rgba(214,236,255,.14)"; g.fillRect(150, by, W - 300, 2);
  g.font = `500 23px "${M}"`; g.fillStyle = DIM;
  g.fillText("~/sulthan-raihan", 150, by + 44);
  g.fillStyle = BLUE; g.fillText("● main", 150 + g.measureText("~/sulthan-raihan  ").width, by + 44);
  g.fillStyle = DIM; g.textAlign = "right"; g.fillText("ln 1, col 1   utf-8   scroll ↓", W - 150, by + 44); g.textAlign = "left";

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
