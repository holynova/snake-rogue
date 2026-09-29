export const ENEMY_TYPES = {
  spider: { tile: 122, name: '毒蛛', hp: 1, cd: 2, dmg: 1, score: 15, wander: 0.45 },
  zombie: { tile: 109, name: '狂徒', hp: 2, cd: 2, dmg: 1, score: 20, wander: 0.2 },
  ghost: { tile: 108, name: '怨灵', hp: 2, cd: 1, dmg: 1, score: 30, wander: 0.12 },
  demon: { tile: 110, name: '赤甲怪', hp: 4, cd: 2, dmg: 2, score: 50, wander: 0.15 },
};

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export function enemyAt(enemies, x, y) {
  for (const e of enemies) {
    if (e.x === x && e.y === y) return e;
  }
  return null;
}

function bfsNext(grid, W, H, blocked, sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return null;
  const total = W * H;
  const prev = new Int32Array(total).fill(-1);
  const start = sy * W + sx;
  const target = ty * W + tx;
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  prev[start] = start;
  let found = false;
  while (head < tail && !found) {
    const cur = queue[head++];
    const cx = cur % W;
    const cy = (cur / W) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIRS[d][0];
      const ny = cy + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (prev[ni] !== -1) continue;
      const isTarget = ni === target;
      if (!isTarget && (grid[ni] === 1 || blocked(ni))) continue;
      prev[ni] = cur;
      if (isTarget) {
        found = true;
        break;
      }
      queue[tail++] = ni;
    }
  }
  if (!found) return null;
  let p = target;
  while (prev[p] !== start) p = prev[p];
  return { x: p % W, y: (p / W) | 0 };
}

export function stepEnemies(world) {
  const W = world.W;
  const H = world.H;
  const snake = world.snake;
  const head = snake.cells[0];
  const body = new Set();
  for (let i = 1; i < snake.cells.length; i++) {
    const c = snake.cells[i];
    body.add(c.y * W + c.x);
  }
  const occ = new Set();
  for (const e of world.enemies) occ.add(e.y * W + e.x);

  for (const e of world.enemies) {
    const type = ENEMY_TYPES[e.type];
    e.px = e.x;
    e.py = e.y;
    e.cd--;
    if (e.cd > 0) continue;
    e.cd = type.cd;

    const dist = Math.abs(e.x - head.x) + Math.abs(e.y - head.y);
    if (dist === 1) {
      world.hurtPlayer(type.name + '的攻击', type.dmg);
      e.bump = { x: head.x - e.x, y: head.y - e.y };
      continue;
    }

    occ.delete(e.y * W + e.x);
    const step = bfsNext(world.grid, W, H, (i) => body.has(i) || occ.has(i), e.x, e.y, head.x, head.y);
    if (step && !(step.x === head.x && step.y === head.y)) {
      e.x = step.x;
      e.y = step.y;
    } else if (world.rng.chance(type.wander)) {
      const opts = [];
      for (const d of DIRS) {
        const nx = e.x + d[0];
        const ny = e.y + d[1];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx;
        if (world.grid[ni] === 1 || body.has(ni) || occ.has(ni)) continue;
        if (nx === head.x && ny === head.y) continue;
        opts.push({ x: nx, y: ny });
      }
      if (opts.length) {
        const p = world.rng.pick(opts);
        e.x = p.x;
        e.y = p.y;
      }
    }
    occ.add(e.y * W + e.x);
  }
}
