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

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function inkGradient(g, x, y, w, h) {
  const grad = g.createRadialGradient(x, y + h, 0, x, y + h, Math.hypot(w * 0.8, h));
  grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#d6ecff");
  return grad;
}

// The screen that appears after the cable is plugged in. 1440×1080 = 4:3 glass.
export function makeHeroTexture(config) {
  const W = 1440, H = 1080;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#061a2b"; g.fillRect(0, 0, W, H);

  // giant faint watermark
  g.save();
  g.globalAlpha = 0.07; g.fillStyle = "#d6ecff";
  g.font = '400 900px "Anton", sans-serif'; g.textBaseline = "middle"; g.textAlign = "center";
  g.fillText(config.watermark.toUpperCase(), W / 2, H / 2 + 40);
  g.restore();

  // pill: glass ring → blue core → label, with a little cursor hanging off its corner
  g.font = '500 54px "Inter", sans-serif'; g.textBaseline = "alphabetic";
  const tw = g.measureText(config.pill).width;
  const px = 150, py = 230, pw = Math.round(tw + 100), ph = 104;
  roundRect(g, px, py, pw, ph, ph / 2); g.fillStyle = "rgba(255,255,255,0.18)"; g.fill();
  roundRect(g, px + 10, py + 10, pw - 20, ph - 20, (ph - 20) / 2); g.fillStyle = "#2f9bff"; g.fill();
  g.save();
  roundRect(g, px + 10, py + 10, pw - 20, ph - 20, (ph - 20) / 2); g.clip();
  g.filter = "blur(30px)"; g.fillStyle = "rgba(255,255,255,.5)";
  g.beginPath(); g.ellipse(px + pw * 0.3, py + 20, pw * 0.3, 18, -0.15, 0, Math.PI * 2); g.fill();
  g.restore();
  g.fillStyle = inkGradient(g, px + 50, py + 30, tw, 44);
  g.fillText(config.pill, px + 50, py + 70);
  g.save();                                                   // cursor arrow
  g.translate(px + pw - 30, py + ph - 26); g.rotate(-0.25);
  g.fillStyle = "#2f9bff"; g.strokeStyle = "#d6ecff"; g.lineWidth = 5; g.lineJoin = "round";
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 60); g.lineTo(16, 46); g.lineTo(28, 70); g.lineTo(38, 65); g.lineTo(26, 41); g.lineTo(46, 40); g.closePath();
  g.fill(); g.stroke();
  g.restore();

  // headline: tall condensed caps, tight leading, same white→ice-blue gradient as the loader
  const size = 280, lh = size * 0.9, top = 385, maxW = W - 300;
  g.font = `400 ${size}px "Anton", sans-serif`;
  g.fillStyle = inkGradient(g, 150, top, maxW, lh * config.headline.length);
  config.headline.forEach((line, i) => {
    const k = Math.min(1, maxW / g.measureText(line).width);
    g.save(); g.translate(150, top + size * 0.82 + lh * i); g.scale(k, k); g.fillText(line, 0, 0); g.restore();
  });

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}
