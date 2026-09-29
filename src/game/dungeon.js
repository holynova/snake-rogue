import { MAP_W, MAP_H, MAX_FLOOR, T } from './constants.js';

const WALL = 1;
const FLOOR = 0;

function idx(x, y) {
  return y * MAP_W + x;
}

export function generateFloor(rng, floor) {
  const grid = new Uint8Array(MAP_W * MAP_H);
  grid.fill(WALL);
  const rooms = [];
  const targetRooms = 7 + Math.min(4, floor);
  let tries = 0;
  while (rooms.length < targetRooms && tries < 400) {
    tries++;
    const w = rng.int(5, 10);
    const h = rng.int(4, 8);
    const x = rng.int(1, MAP_W - w - 1);
    const y = rng.int(1, MAP_H - h - 1);
    const overlap = rooms.some(
      (o) =>
        x < o.x + o.w + 2 &&
        x + w + 2 > o.x &&
        y < o.y + o.h + 2 &&
        y + h + 2 > o.y
    );
    if (overlap) continue;
    const room = { x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1) };
    rooms.push(room);
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) grid[idx(xx, yy)] = FLOOR;
    }
  }

  const carve = (x1, y1, x2, y2) => {
    let x = x1;
    let y = y1;
    while (x !== x2) {
      grid[idx(x, y)] = FLOOR;
      x += Math.sign(x2 - x);
    }
    while (y !== y2) {
      grid[idx(x, y)] = FLOOR;
      y += Math.sign(y2 - y);
    }
    grid[idx(x, y)] = FLOOR;
  };

  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1];
    const b = rooms[i];
    if (rng.chance(0.5)) {
      carve(a.cx, a.cy, b.cx, a.cy);
      carve(b.cx, a.cy, b.cx, b.cy);
    } else {
      carve(a.cx, a.cy, a.cx, b.cy);
      carve(a.cx, b.cy, b.cx, b.cy);
    }
  }
  const extra = 1 + (rooms.length >> 2);
  for (let i = 0; i < extra; i++) {
    const a = rng.pick(rooms);
    const b = rng.pick(rooms);
    if (a !== b) carve(a.cx, a.cy, b.cx, b.cy);
  }

  const startRoom = rooms[0];
  const start = { x: startRoom.cx, y: startRoom.cy };

  let exitRoom = startRoom;
  let far = -1;
  for (const r of rooms) {
    const d = Math.abs(r.cx - start.x) + Math.abs(r.cy - start.y);
    if (d > far) {
      far = d;
      exitRoom = r;
    }
  }
  const exit = { x: exitRoom.cx, y: exitRoom.cy };
  const inStartRoom = (x, y) =>
    x >= startRoom.x && x < startRoom.x + startRoom.w &&
    y >= startRoom.y && y < startRoom.y + startRoom.h;
  const isExit = (x, y) => x === exit.x && y === exit.y;

  const floorCells = [];
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (grid[idx(x, y)] === FLOOR && !inStartRoom(x, y) && !isExit(x, y)) {
        floorCells.push({ x, y });
      }
    }
  }
  rng.shuffle(floorCells);
  let cursor = 0;
  const take = () => (cursor < floorCells.length ? floorCells[cursor++] : null);

  const decor = [];
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (grid[idx(x, y)] !== WALL) continue;
      const openBelow = y + 1 < MAP_H && grid[idx(x, y + 1)] === FLOOR;
      const openRight = x + 1 < MAP_W && grid[idx(x + 1, y)] === FLOOR;
      if (openBelow && rng.chance(0.10)) decor.push({ x, y, tile: T.TORCH, kind: 'wall' });
      else if (openRight && rng.chance(0.05)) decor.push({ x, y, tile: T.TORCH, kind: 'wall' });
      else if (openBelow && rng.chance(0.06)) decor.push({ x, y, tile: T.WEB, kind: 'wall' });
    }
  }
  for (const c of floorCells) {
    if (rng.chance(0.045)) {
      decor.push({ x: c.x, y: c.y, tile: rng.pick([T.SKULL, T.BLADE]), kind: 'floor' });
    }
  }

  const enemyDefs = [
    { type: 'spider', maxFloor: 10 },
    { type: 'zombie', maxFloor: 10 },
    { type: 'ghost', minFloor: 2, maxFloor: 10 },
    { type: 'demon', minFloor: 4, maxFloor: 10 },
  ];
  const pool = enemyDefs.filter((d) => (d.minFloor || 1) <= floor && floor <= d.maxFloor);
  const enemies = [];
  const enemyCount = Math.min(13, 2 + floor * 2);
  for (let i = 0; i < enemyCount; i++) {
    const cell = take();
    if (!cell) break;
    enemies.push({ ...cell, type: rng.pick(pool).type });
  }

  const items = [];
  const appleCount = 3;
  for (let i = 0; i < appleCount; i++) {
    const cell = take();
    if (cell) items.push({ ...cell, kind: 'apple' });
  }
  const goldCount = 4 + rng.int(0, 2);
  for (let i = 0; i < goldCount; i++) {
    const cell = take();
    if (cell) items.push({ ...cell, kind: 'gold' });
  }
  const redCount = 1 + (rng.chance(0.5) ? 1 : 0);
  for (let i = 0; i < redCount; i++) {
    const cell = take();
    if (cell) items.push({ ...cell, kind: 'potionRed' });
  }
  for (let i = 0; i < 1; i++) {
    const cell = take();
    if (cell) items.push({ ...cell, kind: 'potionBlue' });
  }
  const chestCount = 1 + (floor >= 3 && rng.chance(0.6) ? 1 : 0);
  for (let i = 0; i < chestCount; i++) {
    const cell = take();
    if (cell) items.push({ ...cell, kind: 'chest', opened: false });
  }
  if (floor === MAX_FLOOR) {
    items.push({ x: exit.x, y: exit.y, kind: 'amulet' });
  }

  const traps = [];
  const trapCount = Math.min(7, 1 + (floor >> 1));
  for (let i = 0; i < trapCount; i++) {
    const cell = take();
    if (cell) traps.push({ ...cell });
  }

  return {
    grid,
    rooms,
    start,
    exit,
    isExitCell: isExit,
    enemies,
    items,
    traps,
    decor,
    floor,
  };
}
