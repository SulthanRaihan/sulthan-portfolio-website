// Tiny synthesized sounds (no audio files): a plug "click" and a start-up chime.
// The first one plays inside the drag gesture, which is what lets the browser start audio.
let ctx = null, muted = false;
function ac() {
  if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
export const setMuted = (m) => { muted = m; };

export function click() {
  const c = !muted && ac(); if (!c) return;
  const len = Math.floor(c.sampleRate * 0.05), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 7);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2400; f.Q.value = 0.9;
  const gain = c.createGain(); gain.gain.value = 0.7;
  src.connect(f).connect(gain).connect(c.destination); src.start();
}

export function chime() {
  const c = !muted && ac(); if (!c) return;
  [523.25, 659.25, 987.77].forEach((freq, i) => {
    const t = c.currentTime + i * 0.09;
    const o = c.createOscillator(); o.type = i === 2 ? "sine" : "triangle"; o.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(0.12, t + 0.015); gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(gain).connect(c.destination); o.start(t); o.stop(t + 1);
  });
}
