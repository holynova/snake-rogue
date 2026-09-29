export function computeFov(grid, W, H, sx, sy, radius, visible, explored) {
  visible.fill(0);
  const mark = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x;
    visible[i] = 1;
    explored[i] = 1;
  };
  mark(sx, sy);
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const tx = sx + dx;
      const ty = sy + dy;
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      if (los(grid, W, sx, sy, tx, ty)) mark(tx, ty);
    }
  }
}

function los(grid, W, x0, y0, x1, y1) {
  if (x0 === x1 && y0 === y1) return true;
  let x = x0;
  let y = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (x !== x1 || y !== y1) {
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
    if (x < 0 || y < 0 || x >= W) return false;
    const i = y * W + x;
    if ((x !== x1 || y !== y1) && grid[i] === 1) return false;
  }
  return true;
}
