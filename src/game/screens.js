import { VIEW_W, VIEW_H, COLORS, MAX_FLOOR } from './constants.js';

const FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif';

function overlay(ctx, alpha = 0.72) {
  ctx.fillStyle = `rgba(4,5,10,${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centered(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, y);
}

function panelBox(ctx, w, h) {
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = 'rgba(9,10,18,0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.uiLine;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(232,193,90,0.35)';
  ctx.strokeRect(x + 7, y + 7, w - 14, h - 14);
  return { x, y };
}

export function drawTitle(ctx, time) {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  for (let i = 0; i < 40; i++) {
    const x = (i * 213 + time * (10 + (i % 5) * 6)) % VIEW_W;
    const y = (i * 97 + Math.sin(time * 0.6 + i) * 30 + VIEW_H) % VIEW_H;
    ctx.globalAlpha = 0.15 + (i % 4) * 0.08;
    ctx.fillStyle = i % 3 === 0 ? '#4fbf63' : '#e8c15a';
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.restore();

  const glow = 0.5 + 0.5 * Math.sin(time * 1.6);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = `rgba(79,191,99,${0.35 + glow * 0.3})`;
  ctx.shadowBlur = 30;
  centered(ctx, '蛇 渊', VIEW_H * 0.28, `bold 88px ${FONT}`, '#eaf6ea');
  ctx.shadowBlur = 0;
  centered(ctx, 'S N A K E   R O G U E', VIEW_H * 0.28 + 74, `16px ${FONT}`, COLORS.accent);
  ctx.restore();

  centered(
    ctx,
    '一条会法术的蛇，一座会咬人的地牢',
    VIEW_H * 0.46,
    `16px ${FONT}`,
    COLORS.textDim
  );

  const blink = Math.floor(time * 2) % 2 === 0;
  centered(
    ctx,
    '按  Enter  开始',
    VIEW_H * 0.56,
    `bold 26px ${FONT}`,
    blink ? COLORS.accent : 'rgba(232,193,90,0.35)'
  );

  const lines = [
    '方向键 / WASD 移动 · 会吞掉自己身后的空间掉头',
    '空格 吐毒液 · 撞墙会停住但不掉血',
    '吃苹果回饱食度并变长 · 饥饿归零会持续掉血',
    `走下楼梯深入地底 · 第 ${MAX_FLOOR} 层拿到圣物即胜利`,
    'P 暂停 · M 静音 · 死亡后按 R 重开',
  ];
  lines.forEach((t, i) => {
    centered(ctx, t, VIEW_H * 0.66 + i * 24, `14px ${FONT}`, COLORS.text);
  });

  centered(
    ctx,
    'Kenney 素材 · CC0',
    VIEW_H * 0.94,
    `12px ${FONT}`,
    'rgba(127,132,153,0.7)'
  );
}

export function drawPause(ctx, world) {
  overlay(ctx, 0.66);
  panelBox(ctx, 420, 220);
  centered(ctx, '暂 停', VIEW_H / 2 - 62, `bold 40px ${FONT}`, '#eaf6ea');
  centered(ctx, `第 ${world.floor} 层 · ${world.score} 分`, VIEW_H / 2 - 12, `16px ${FONT}`, COLORS.text);
  centered(
    ctx,
    '按  P  或  Esc  继续',
    VIEW_H / 2 + 36,
    `bold 18px ${FONT}`,
    COLORS.accent
  );
  centered(
    ctx,
    'M 静音 · 蛇在等你',
    VIEW_H / 2 + 76,
    `13px ${FONT}`,
    COLORS.textDim
  );
}

function resultPanel(ctx, world, title, titleColor, note) {
  overlay(ctx, 0.74);
  const { y } = panelBox(ctx, 460, 300);
  centered(ctx, title, y + 56, `bold 46px ${FONT}`, titleColor);
  centered(ctx, note, y + 104, `15px ${FONT}`, COLORS.textDim);
  centered(ctx, `抵达第 ${world.floor} 层`, y + 146, `16px ${FONT}`, COLORS.text);
  centered(ctx, `本局得分  ${world.score}`, y + 178, `bold 22px ${FONT}`, COLORS.accent);
  const isBest = world.score >= world.best && world.score > 0;
  centered(
    ctx,
    isBest ? `新纪录！  历史最高 ${world.best}` : `历史最高 ${world.best}`,
    y + 212,
    `14px ${FONT}`,
    isBest ? COLORS.accent : COLORS.textDim
  );
  const blink = Math.floor(performance.now() / 500) % 2 === 0;
  centered(
    ctx,
    blink ? '按  R  再来一局 ·  Enter  返回标题' : ' ',
    y + 256,
    `bold 15px ${FONT}`,
    COLORS.text
  );
}

export function drawDeath(ctx, world) {
  resultPanel(ctx, world, '你 死 了', '#e0564a', world.deadReason ? `死因：${world.deadReason}` : '');
}

export function drawWin(ctx, world) {
  resultPanel(ctx, world, '逃 出 蛇 渊', COLORS.accent, '圣物的光芒刺破了最深层的黑暗');
}
