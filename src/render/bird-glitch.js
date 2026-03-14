// Glitch effect for bird sprite (canvas only)
// Usage: glitchBirdImage(img, w, h, options) => returns a glitched offscreen canvas
export function glitchBirdImage(img, w, h, options = {}) {
  const {
    bands = 6,
    maxOffset = 8,
    rgb = true,
    seed = Math.random() * 10000
  } = options;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  // Draw base
  ctx.drawImage(img, 0, 0, w, h);
  // Glitch bands
  for (let i = 0; i < bands; i++) {
    const bandH = Math.floor(h / bands * (0.7 + Math.random() * 0.6));
    const y = Math.floor((h / bands) * i + Math.random() * 2);
    const offset = Math.floor((Math.random() - 0.5) * maxOffset * 2);
    if (rgb && Math.random() < 0.7) {
      // RGB split
      for (const [dx, color] of [[-1, 'red'], [1, 'lime'], [0, 'white']]) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = color === 'white' ? 0.7 : 0.5;
        ctx.filter = color === 'white' ? 'none' : `drop-shadow(${dx * 2}px 0 ${color})`;
        ctx.drawImage(img, offset + dx * 2, y, w, bandH, 0, y, w, bandH);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
    } else {
      ctx.drawImage(img, offset, y, w, bandH, 0, y, w, bandH);
    }
  }
  return out;
}
