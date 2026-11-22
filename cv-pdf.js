// A minimal PDF writer: one A4 page per canvas, each page a full-bleed JPEG. Used when no real CV file is configured.
export async function pagesToPdf(canvases) {
  const enc = new TextEncoder(), parts = [], offsets = [];
  let len = 0;
  const push = (x) => { const b = typeof x === "string" ? enc.encode(x) : x; parts.push(b); len += b.length; };
  const obj = (n, body) => { offsets[n] = len; push(`${n} 0 obj\n`); body(); push("\nendobj\n"); };
  const jpegs = await Promise.all(canvases.map((c) => new Promise((ok) => c.toBlob((b) => b.arrayBuffer().then((a) => ok(new Uint8Array(a))), "image/jpeg", 0.92))));

  push("%PDF-1.4\n");
  obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => push(`<< /Type /Pages /Kids [${canvases.map((_, i) => `${3 + 3 * i} 0 R`).join(" ")}] /Count ${canvases.length} >>`));
  canvases.forEach((c, i) => {
    const PW = 595.28, PH = 841.89, p = 3 + 3 * i, draw = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(p, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`));
    obj(p + 1, () => push(`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`));
    obj(p + 2, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegs[i].length} >>\nstream\n`);
      push(jpegs[i]); push("\nendstream");
    });
  });
  const xref = len, count = 3 + 3 * canvases.length;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let k = 1; k < count; k++) push(`${String(offsets[k]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(parts, { type: "application/pdf" });
}
