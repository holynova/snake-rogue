export class Camera {
  constructor(viewW, viewH) {
    this.x = 0;
    this.y = 0;
    this.viewW = viewW;
    this.viewH = viewH;
    this.snap = true;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.snap = true;
  }

  follow(px, py, worldW, worldH) {
    let tx = px - this.viewW / 2;
    let ty = py - this.viewH / 2;
    tx = Math.max(0, Math.min(worldW - this.viewW, tx));
    ty = Math.max(0, Math.min(worldH - this.viewH, ty));
    if (this.snap) {
      this.x = tx;
      this.y = ty;
      this.snap = false;
      return;
    }
    this.x += (tx - this.x) * 0.16;
    this.y += (ty - this.y) * 0.16;
  }
}
