import {
  VIEW_W,
  VIEW_H,
  MAP_W,
  MAP_H,
  COLORS,
  MAX_FLOOR,
} from './constants.js';

const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.uiPanel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.uiLine;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x + s * 0.5, y + s * 0.92);
  ctx.bezierCurveTo(x - s * 0.08, y + s * 0.5, x + s * 0.02, y - s * 0.02, x + s * 0.5, y + s * 0.28);
  ctx.bezierCurveTo(x + s * 0.98, y - s * 0.02, x + s * 1.08, y + s * 0.5, x + s * 0.5, y + s * 0.92);
  ctx.closePath();
}

function hungerColor(v) {
  if (v > 55) return COLORS.hungerHigh;
  if (v > 25) return COLORS.hungerMid;
  return COLORS.hungerLow;
}

export function drawHUD(ctx, world) {
  const s = world.snake;
  ctx.save();
  ctx.textBaseline = 'top';

  panel(ctx, 12, 12, 240, 96);

  for (let i = 0; i < s.maxHp; i++) {
    const x = 24 + i * 30;
    const y = 22;
    heartPath(ctx, x, y, 24);
    if (i < s.hp) {
      ctx.fillStyle = COLORS.heart;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath();
      ctx.ellipse(x + 8, y + 7, 3.5, 2.5, -0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = COLORS.heartEmpty;
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.5;
    heartPath(ctx, x, y, 24);
    ctx.stroke();
  }

  const hx = 24;
  const hy = 56;
  const hw = 176;
  const hh = 12;
  ctx.fillStyle = '#141725';
  ctx.fillRect(hx, hy, hw, hh);
  ctx.fillStyle = hungerColor(s.hunger);
  ctx.fillRect(hx, hy, (hw * s.hunger) / 100, hh);
  ctx.strokeStyle = COLORS.uiLine;
  ctx.strokeRect(hx + 0.5, hy + 0.5, hw - 1, hh - 1);
  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('饱食', hx + hw + 8, hy - 1);

  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('毒液', 24, 78);
  for (let i = 0; i < s.venomMax; i++) {
    const cx = 62 + i * 20;
    const cy = 84;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = i < s.venom ? COLORS.venom : COLORS.venomEmpty;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('[空格]', 132, 78);

  panel(ctx, VIEW_W - 232, 12, 220, 78);
  ctx.textAlign = 'right';
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`第 ${world.floor} 层`, VIEW_W - 24, 22);
  ctx.font = `20px ${FONT}`;
  ctx.fillStyle = COLORS.accent;
  ctx.fillText(`${world.score} 分`, VIEW_W - 24, 44);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText(`最高 ${world.best}`, VIEW_W - 24, 70);
  ctx.textAlign = 'left';

  const logX = 16;
  const logY = VIEW_H - 16 - world.msgs.length * 20;
  ctx.font = `13px ${FONT}`;
  world.msgs.forEach((m, i) => {
    const fade = m.t > 30 ? Math.max(0, 1 - (m.t - 30) / 15) : 1;
    const isLast = i === world.msgs.length - 1;
    ctx.globalAlpha = fade * (isLast ? 1 : 0.55);
    ctx.fillStyle = isLast ? COLORS.text : COLORS.textDim;
    ctx.fillText(m.text, logX, logY + i * 20);
  });
  ctx.globalAlpha = 1;

  drawMinimap(ctx, world);

  ctx.font = `11px ${FONT}`;
  ctx.fillStyle = 'rgba(127,132,153,0.7)';
  ctx.fillText('P 暂停 · M 静音', 16, VIEW_H - 14 - 0);

  ctx.restore();
}

function drawMinimap(ctx, world) {
  const sc = 3;
  const w = MAP_W * sc;
  const h = MAP_H * sc;
  const ox = VIEW_W - w - 14;
  const oy = VIEW_H - h - 14;
  ctx.fillStyle = 'rgba(6,7,14,0.85)';
  ctx.fillRect(ox - 6, oy - 6, w + 12, h + 12);
  ctx.strokeStyle = COLORS.uiLine;
  ctx.strokeRect(ox - 5.5, oy - 5.5, w + 11, h + 11);

  const { grid, explored, visible, W, H } = world;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!explored[i]) continue;
      let c;
      if (grid[i] === 1) c = visible[i] ? '#4d5678' : '#333a52';
      else c = visible[i] ? '#2c3450' : '#1c2133';
      ctx.fillStyle = c;
      ctx.fillRect(ox + x * sc, oy + y * sc, sc, sc);
    }
  }

  if (world.floor < MAX_FLOOR && explored[world.exit.y * W + world.exit.x]) {
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(ox + world.exit.x * sc, oy + world.exit.y * sc, sc, sc);
  }
  for (const e of world.enemies) {
    if (!visible[e.y * W + e.x]) continue;
    ctx.fillStyle = '#d4564a';
    ctx.fillRect(ox + e.x * sc, oy + e.y * sc, sc, sc);
  }
  const head = world.snake.cells[0];
  ctx.fillStyle = COLORS.snakeHead;
  ctx.fillRect(ox + head.x * sc - 1, oy + head.y * sc - 1, sc + 2, sc + 2);
}
