export function createSnake(x, y, len = 3) {
  const cells = [];
  for (let i = 0; i < len; i++) cells.push({ x: x - i, y });
  return {
    cells,
    prev: cells.map((c) => ({ x: c.x, y: c.y })),
    dir: [1, 0],
    queue: [],
    grow: 0,
    hp: 4,
    maxHp: 5,
    hunger: 100,
    venom: 3,
    venomMax: 3,
    invuln: 0,
    alive: true,
    stalled: false,
    tongue: 0,
  };
}

export function repositionSnake(snake, x, y) {
  const n = snake.cells.length;
  snake.cells = [];
  for (let i = 0; i < n; i++) snake.cells.push({ x, y });
  snake.prev = snake.cells.map((c) => ({ x: c.x, y: c.y }));
  snake.dir = [1, 0];
  snake.queue = [];
}

export function snakePoints(snake, alpha) {
  const { cells, prev } = snake;
  const out = [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    const p = prev[Math.min(i, prev.length - 1)];
    out.push({
      x: p.x + (c.x - p.x) * alpha,
      y: p.y + (c.y - p.y) * alpha,
    });
  }
  return out;
}
