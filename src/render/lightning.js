// Lightning effect for Theme 3
// Adapted from the provided CodePen logic, but for a single canvas overlay

export class LightningEffect {
  constructor() {
    this.lightning = [];
    this.lightTimeCurrent = 0;
    this.lightTimeTotal = 0;
    this.lastW = 0;
    this.lastH = 0;
  }

  random(min, max) {
    return Math.random() * (max - min + 1) + min;
  }

  createLightning(w, h) {
    const x = this.random(100, w - 100);
    const y = this.random(0, h / 4);
    const createCount = Math.floor(this.random(1, 2)); // sparser
    for (let i = 0; i < createCount; i++) {
      const single = {
        x: x,
        y: y,
        xRange: this.random(5, 30),
        yRange: this.random(10, 25),
        path: [{ x: x, y: y }],
        pathLimit: this.random(30, 45) // sparser, shorter
      };
      this.lightning.push(single);
    }
  }

  clearLightning(ctx, w, h) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.13)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  drawLightning(ctx, w, h, options = {}) {
    const color = options.color || 'white';
    for (let i = 0; i < this.lightning.length; i++) {
      const light = this.lightning[i];
      light.path.push({
        x: light.path[light.path.length - 1].x + (this.random(0, light.xRange) - (light.xRange / 2)),
        y: light.path[light.path.length - 1].y + (this.random(0, light.yRange))
      });
      if (light.path.length > light.pathLimit) {
        this.lightning.splice(i, 1);
        i--;
        continue;
      }
      ctx.save();
      // Make lower lightning more transparent
      const lastY = light.path[light.path.length - 1].y;
      let alpha = 0.13;
      if (lastY > h * 0.6) alpha = 0.07;
      else if (lastY > h * 0.4) alpha = 0.10;
      if (color === 'red') {
        ctx.strokeStyle = `rgba(255,0,0,${alpha})`;
      } else {
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      }
      ctx.lineWidth = 3;
      if (Math.floor(this.random(0, 15)) === 0) ctx.lineWidth = 6;
      if (Math.floor(this.random(0, 30)) === 0) ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(light.x, light.y);
      for (let pc = 0; pc < light.path.length; pc++) {
        ctx.lineTo(light.path[pc].x, light.path[pc].y);
      }
      ctx.lineJoin = 'miter';
      ctx.stroke();
      ctx.restore();
      if (Math.floor(this.random(0, 30)) === 1) {
        ctx.save();
        ctx.globalAlpha = this.random(0.01, 0.03);
        ctx.fillStyle = color === 'red' ? 'red' : '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }
  }

  animate(ctx, w, h, options = {}) {
    if (w !== this.lastW || h !== this.lastH) {
      this.lastW = w;
      this.lastH = h;
      this.lightning = [];
    }
    this.clearLightning(ctx, w, h);
    this.lightTimeCurrent++;
    if (this.lightTimeCurrent >= this.lightTimeTotal) {
      this.createLightning(w, h);
      this.lightTimeCurrent = 0;
      this.lightTimeTotal = Math.floor(this.random(320, 700)); // much less frequent flashes
    }
    this.drawLightning(ctx, w, h, options);
  }
}
