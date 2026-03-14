export function glitchBirdImage(img, w, h, options = {}) {
  const {
    bands = 3,          // fewer tear bands
    maxOffset = 2,      // smaller horizontal shifts
    rgb = true,
    glitchChance = 0.1  // only glitch ~10% of frames
  } = options;

  // Most frames: return clean sprite
  if (Math.random() > glitchChance) {
    const clean = document.createElement("canvas");
    clean.width = w;
    clean.height = h;
    const cctx = clean.getContext("2d");
    cctx.drawImage(img, 0, 0, w, h);
    return clean;
  }

  const source = document.createElement("canvas");
  source.width = w;
  source.height = h;
  const sctx = source.getContext("2d");

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d");

  // draw original sprite once
  sctx.drawImage(img, 0, 0, w, h);

  const bandHeight = Math.floor(h / bands);

  for (let i = 0; i < bands; i++) {
    const y = i * bandHeight;
    const offset = Math.floor((Math.random() - 0.5) * maxOffset * 2);

    if (rgb && Math.random() < 0.15) {

      ctx.globalAlpha = 0.5;
      ctx.drawImage(source, 0, y, w, bandHeight, offset - 1, y, w, bandHeight);

      ctx.globalAlpha = 0.5;
      ctx.drawImage(source, 0, y, w, bandHeight, offset + 1, y, w, bandHeight);

      ctx.globalAlpha = 1;
      ctx.drawImage(source, 0, y, w, bandHeight, offset, y, w, bandHeight);

    } else {

      ctx.globalAlpha = 1;
      ctx.drawImage(source, 0, y, w, bandHeight, offset, y, w, bandHeight);

    }
  }

  ctx.globalAlpha = 1;
  return out;
}