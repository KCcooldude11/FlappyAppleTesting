const source = document.createElement("canvas");
const out = document.createElement("canvas");

export function glitchBirdImage(img, w, h, options = {}) {

  const {
    bands = 4,
    maxOffset = 4,
    rgb = true,
    glitchChance = 0.15
  } = options;

  if (Math.random() > glitchChance) {
    return img;
  }

  source.width = w;
  source.height = h;
  out.width = w;
  out.height = h;

  const sctx = source.getContext("2d");
  const ctx = out.getContext("2d");

  sctx.clearRect(0,0,w,h);
  ctx.clearRect(0,0,w,h);

  sctx.drawImage(img,0,0,w,h);

  const bandHeight = Math.max(2, Math.floor(h / bands));

  for (let i = 0; i < bands; i++) {

    const y = i * bandHeight;
    const offset = Math.floor((Math.random() - 0.5) * maxOffset * 2);

    if (rgb && Math.random() < 0.25) {

      ctx.globalAlpha = 0.6;
      ctx.drawImage(source,0,y,w,bandHeight,offset-1,y,w,bandHeight);

      ctx.globalAlpha = 0.6;
      ctx.drawImage(source,0,y,w,bandHeight,offset+1,y,w,bandHeight);

      ctx.globalAlpha = 1;

    }

    ctx.drawImage(source,0,y,w,bandHeight,offset,y,w,bandHeight);

  }

  ctx.globalAlpha = 1;

  return out;
}