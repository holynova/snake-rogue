export class Particles {
  constructor() {
    this.list = [];
  }

  clear() {
    this.list.length = 0;
  }

  burst(x, y, color, n = 8, speed = 90, life = 0.45, size = 3) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.8);
      this.list.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: life * (0.6 + Math.random() * 0.7),
        color,
        size: size * (0.6 + Math.random() * 0.8),
      });
    }
  }

  trail(x, y, color, n = 3) {
    this.burst(x, y, color, n, 30, 0.3, 2);
  }

  update(dt) {
    const list = this.list;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += dt;
      if (p.t >= p.life) {
        list[i] = list[list.length - 1];
        list.pop();
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
    }
  }

  draw(ctx, cam) {
    for (const p of this.list) {
      const a = 1 - p.t / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(
        Math.round(p.x - cam.x - s / 2),
        Math.round(p.y - cam.y - s / 2),
        Math.ceil(s),
        Math.ceil(s)
      );
    }
    ctx.globalAlpha = 1;
  }
}
