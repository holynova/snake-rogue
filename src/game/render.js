import {
  TILE,
  MAP_W,
  MAP_H,
  VIEW_W,
  VIEW_H,
  WALL_TILES,
  FLOOR_TILES,
  T,
  COLORS,
  MAX_FLOOR,
} from './constants.js';
import { ENEMY_TYPES } from './enemies.js';
import { snakePoints } from './snake.js';

function variant(x, y) {
  return Math.abs((x * 73856093) ^ (y * 19349663)) % 97;
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawApple(ctx, x, y, s) {
  const r = s * 0.26;
  ctx.fillStyle = '#7a1f24';
  circle(ctx, x, y + s * 0.03, r + 1.5);
  ctx.fillStyle = '#d8453f';
  circle(ctx, x, y, r);
  ctx.fillStyle = '#f07a6a';
  circle(ctx, x - r * 0.35, y - r * 0.35, r * 0.3);
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.3, y - r * 1.5);
  ctx.stroke();
  ctx.fillStyle = '#4fbf63';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.7, y - r * 1.3, r * 0.5, r * 0.26, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGold(ctx, x, y, s) {
  const r = s * 0.24;
  ctx.fillStyle = '#6b4a12';
  circle(ctx, x, y, r + 1.5);
  ctx.fillStyle = '#e8c15a';
  circle(ctx, x, y, r);
  ctx.fillStyle = '#f7e2a0';
  circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.35);
  ctx.fillStyle = '#8a6a1e';
  circle(ctx, x, y, r * 0.42);
  ctx.fillStyle = '#e8c15a';
  circle(ctx, x, y, r * 0.22);
}

function drawTrap(ctx, x, y, s) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.fillStyle = 'rgba(20,22,32,0.55)';
  ctx.fillRect(x + s * 0.16, y + s * 0.16, s * 0.68, s * 0.68);
  ctx.fillStyle = '#9aa1b5';
  for (let i = 0; i < 4; i++) {
    const ox = (i % 2 ? 0.62 : 0.22) * s;
    const oy = (i > 1 ? 0.62 : 0.22) * s;
    ctx.beginPath();
    ctx.moveTo(x + ox, y + oy + s * 0.18);
    ctx.lineTo(x + ox + s * 0.09, y + oy + s * 0.18);
    ctx.lineTo(x + ox + s * 0.045, y + oy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(154,161,181,0.35)';
  ctx.fillRect(cx - s * 0.04, cy - s * 0.04, s * 0.08, s * 0.08);
}

function drawAmulet(ctx, x, y, s, time) {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  const r = s * (0.3 + pulse * 0.05);
  ctx.save();
  ctx.globalAlpha = 0.25 + pulse * 0.25;
  ctx.fillStyle = '#e8c15a';
  circle(ctx, cx, cy, r * 1.7);
  ctx.restore();
  ctx.fillStyle = '#8a6a1e';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.75, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r * 0.75, cy);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7e2a0';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.6);
  ctx.lineTo(cx + r * 0.4, cy);
  ctx.lineTo(cx, cy + r * 0.15);
  ctx.lineTo(cx - r * 0.4, cy);
  ctx.closePath();
  ctx.fill();
}

function drawEnemy(ctx, world, e, atlas, cam, alpha, time) {
  const type = ENEMY_TYPES[e.type];
  const ix = e.px + (e.x - e.px) * alpha;
  const iy = e.py + (e.y - e.py) * alpha;
  let sx = ix * TILE - cam.x;
  let sy = iy * TILE - cam.y;
  const bob = Math.sin(time * 5 + e.x * 1.7) * 2;
  if (e.bump) {
    const t = Math.sin(Math.min(1, alpha) * Math.PI);
    sx += e.bump.x * t * TILE * 0.35;
    sy += e.bump.y * t * TILE * 0.35;
  }
  ctx.save();
  if (e.type === 'ghost') ctx.globalAlpha = 0.82;
  atlas.draw(ctx, type.tile, sx, sy + bob, TILE);
  ctx.restore();
  if (e.hp < type.hp) {
    const w = TILE * 0.6;
    const bx = sx + (TILE - w) / 2;
    const by = sy + bob - 6;
    ctx.fillStyle = 'rgba(8,9,16,0.85)';
    ctx.fillRect(bx - 1, by - 1, w + 2, 5);
    ctx.fillStyle = '#d4564a';
    ctx.fillRect(bx, by, (w * e.hp) / type.hp, 3);
  }
}

function drawSnake(ctx, world, cam, alpha, time) {
  const s = world.snake;
  const pts = snakePoints(s, alpha);
  const n = pts.length;
  ctx.save();
  if (s.invuln > 0 && Math.floor(time * 12) % 2 === 0) ctx.globalAlpha = 0.4;

  for (let i = n - 1; i >= 1; i--) {
    const p = pts[i];
    const q = pts[Math.max(1, i - 1)];
    const t = i / n;
    const r = TILE * (0.4 - 0.18 * t);
    const x = p.x * TILE + TILE / 2 - cam.x;
    const y = p.y * TILE + TILE / 2 - cam.y;
    const qx = q.x * TILE + TILE / 2 - cam.x;
    const qy = q.y * TILE + TILE / 2 - cam.y;
    ctx.lineCap = 'round';
    ctx.strokeStyle = COLORS.snakeOutline;
    ctx.lineWidth = r * 2 + 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(qx, qy);
    ctx.stroke();
    ctx.strokeStyle = i % 2 === 0 ? COLORS.snake : COLORS.snakeDark;
    ctx.lineWidth = r * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(qx, qy);
    ctx.stroke();
    ctx.fillStyle = i % 2 === 0 ? COLORS.snake : COLORS.snakeDark;
    circle(ctx, x, y, r);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    circle(ctx, x - r * 0.3, y - r * 0.3, r * 0.34);
    if (i % 3 === 0) {
      ctx.fillStyle = 'rgba(18,58,30,0.7)';
      circle(ctx, x + r * 0.35, y + r * 0.3, r * 0.22);
    }
  }

  const h = pts[0];
  const hx = h.x * TILE + TILE / 2 - cam.x;
  const hy = h.y * TILE + TILE / 2 - cam.y;
  const r = TILE * 0.44;
  const dx = s.dir[0];
  const dy = s.dir[1];
  const px = -dy;
  const py = dx;

  const flick = s.tongue % 9 < 3;
  if (flick) {
    ctx.strokeStyle = '#e05a5a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const tx = hx + dx * r * 0.9;
    const ty = hy + dy * r * 0.9;
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + dx * 9, ty + dy * 9);
    ctx.moveTo(tx + dx * 9, ty + dy * 9);
    ctx.lineTo(tx + dx * 13 + px * 4, ty + dy * 13 + py * 4);
    ctx.moveTo(tx + dx * 9, ty + dy * 9);
    ctx.lineTo(tx + dx * 13 - px * 4, ty + dy * 13 - py * 4);
    ctx.stroke();
  }

  ctx.fillStyle = COLORS.snakeOutline;
  circle(ctx, hx, hy, r + 2);
  ctx.fillStyle = s.stalled ? '#e8a15a' : COLORS.snakeHead;
  circle(ctx, hx, hy, r);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  circle(ctx, hx + dx * r * 0.2 - px * r * 0.25, hy + dy * r * 0.2 - py * r * 0.25, r * 0.35);

  const ex = dx * r * 0.34;
  const ey = dy * r * 0.34;
  for (const side of [-1, 1]) {
    const lx = hx + ex + px * side * r * 0.46;
    const ly = hy + ey + py * side * r * 0.46;
    ctx.fillStyle = '#f4f6ff';
    circle(ctx, lx, ly, r * 0.24);
    ctx.fillStyle = '#14181f';
    circle(ctx, lx + dx * r * 0.1, ly + dy * r * 0.1, r * 0.13);
  }
  ctx.restore();
}

export function renderWorld(ctx, world, atlas, cam, alpha, time) {
  const { grid, explored, visible, decor, items, traps, enemies, W, H } = world;
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const x0 = Math.max(0, Math.floor(cam.x / TILE));
  const x1 = Math.min(W - 1, Math.ceil((cam.x + VIEW_W) / TILE));
  const y0 = Math.max(0, Math.floor(cam.y / TILE));
  const y1 = Math.min(H - 1, Math.ceil((cam.y + VIEW_H) / TILE));

  let decorByCell = world._decorIndex;
  if (world._decorFor !== decor) {
    decorByCell = new Map();
    for (const d of decor) {
      const k = d.y * MAP_W + d.x;
      if (!decorByCell.has(k)) decorByCell.set(k, []);
      decorByCell.get(k).push(d);
    }
    world._decorFor = decor;
    world._decorIndex = decorByCell;
  }

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      if (!explored[i]) continue;
      const h = variant(x, y);
      const sx = Math.round(x * TILE - cam.x);
      const sy = Math.round(y * TILE - cam.y);
      if (grid[i] === 1) {
        atlas.draw(ctx, WALL_TILES[h % WALL_TILES.length], sx, sy, TILE);
      } else {
        atlas.draw(ctx, FLOOR_TILES[h % FLOOR_TILES.length], sx, sy, TILE);
      }
      const ds = decorByCell.get(i);
      if (ds) {
        for (const d of ds) {
          atlas.draw(ctx, d.tile, sx, sy, TILE);
          if (d.tile === T.TORCH) {
            const flick = 0.55 + 0.45 * Math.sin(time * 9 + d.x * 3.1 + d.y);
            const g = ctx.createRadialGradient(
              sx + TILE / 2,
              sy + TILE / 2,
              2,
              sx + TILE / 2,
              sy + TILE / 2,
              TILE * 1.5
            );
            g.addColorStop(0, `rgba(255,190,90,${0.35 * flick})`);
            g.addColorStop(1, 'rgba(255,150,60,0)');
            ctx.fillStyle = g;
            ctx.fillRect(sx - TILE, sy - TILE, TILE * 3, TILE * 3);
          }
        }
      }
      if (
        world.floor < MAX_FLOOR &&
        x === world.exit.x &&
        y === world.exit.y
      ) {
        atlas.draw(ctx, T.STAIRS, sx, sy, TILE);
      }
      if (!visible[i]) {
        ctx.fillStyle = COLORS.fog;
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }

  for (const t of traps) {
    const i = t.y * W + t.x;
    if (!visible[i]) continue;
    drawTrap(ctx, t.x * TILE - cam.x, t.y * TILE - cam.y, TILE);
  }

  for (const it of items) {
    const i = it.y * W + it.x;
    if (!visible[i]) continue;
    const sx = it.x * TILE - cam.x;
    const sy = it.y * TILE - cam.y;
    switch (it.kind) {
      case 'apple':
        drawApple(ctx, sx, sy, TILE);
        break;
      case 'gold':
        drawGold(ctx, sx, sy, TILE);
        break;
      case 'potionRed':
        atlas.draw(ctx, T.POT_RED, sx, sy, TILE);
        break;
      case 'potionBlue':
        atlas.draw(ctx, T.POT_BLUE, sx, sy, TILE);
        break;
      case 'chest':
        atlas.draw(ctx, it.opened ? T.CHEST_OPEN : T.CHEST, sx, sy, TILE);
        break;
      case 'amulet':
        drawAmulet(ctx, sx, sy, TILE, time);
        break;
      default:
        break;
    }
  }

  for (const e of enemies) {
    const i = e.y * W + e.x;
    if (!visible[i]) continue;
    drawEnemy(ctx, world, e, atlas, cam, alpha, time);
  }

  drawSnake(ctx, world, cam, alpha, time);

  world.particles.draw(ctx, cam);

  ctx.save();
  ctx.strokeStyle = 'rgba(120,130,170,0.16)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, VIEW_W - 1, VIEW_H - 1);
  ctx.restore();
}
