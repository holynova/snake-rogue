import { createLoop } from './engine/loop.js';
import { Input } from './engine/input.js';
import { AudioSys } from './engine/audio.js';
import { Camera } from './engine/camera.js';
import { loadAtlas } from './engine/atlas.js';
import {
  TICK_MS,
  VIEW_W,
  VIEW_H,
  WORLD_W,
  WORLD_H,
  TILE,
} from './game/constants.js';
import { World } from './game/world.js';
import { enemyAt } from './game/enemies.js';
import { snakePoints } from './game/snake.js';
import { renderWorld } from './game/render.js';
import { drawHUD } from './game/hud.js';
import { drawTitle, drawPause, drawDeath, drawWin } from './game/screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const loading = document.getElementById('loading');
const params = new URLSearchParams(location.search);
const autotest = params.has('autotest');
const ticksParam = params.get('ticks');
const autotestTicks = /^\d+$/.test(ticksParam || '') ? Number(ticksParam) : 500;

const audio = new AudioSys();
if (!autotest) audio.init();
const input = new Input();
input.attach(window);
const cam = new Camera(VIEW_W, VIEW_H);

let atlas = null;
let world = null;
let screen = 'title';
let lastFloor = 1;
let manualDrive = false;

function newGame(seed) {
  world = new World(seed, audio);
  input.clear();
  cam.snap = true;
  lastFloor = 1;
  manualDrive = false;
  screen = 'play';
}

function handleTaps() {
  for (const code of input.takeTaps()) {
    audio.unlock();
    if (code === 'KeyM') {
      const muted = audio.toggleMute();
      if (world) world.msg(muted ? '已静音' : '声音已开启');
      continue;
    }
    if (screen === 'title') {
      if (code === 'Enter' || code === 'Space') {
        audio.play('ui');
        newGame((Math.random() * 1e9) | 0);
      }
      continue;
    }
    if (screen === 'play') {
      if (code === 'KeyP' || code === 'Escape') {
        screen = 'pause';
        audio.play('ui');
      } else if (code === 'Space') {
        world.spit();
      }
      continue;
    }
    if (screen === 'pause') {
      if (code === 'KeyP' || code === 'Escape' || code === 'Enter') {
        screen = 'play';
        audio.play('ui');
      }
      continue;
    }
    if (screen === 'dead' || screen === 'win') {
      if (code === 'KeyR') {
        audio.play('ui');
        newGame((Math.random() * 1e9) | 0);
      } else if (code === 'Enter') {
        audio.play('ui');
        world = null;
        screen = 'title';
      }
    }
  }
}

function autopilot() {
  const s = world.snake;
  const head = s.cells[0];
  const d = s.dir;
  const cands = [d, [-d[1], d[0]], [d[1], -d[0]], [-d[0], -d[1]]];

  let target = null;
  let targetDist = 7;
  for (const e of world.enemies) {
    const dx = e.x - head.x;
    const dy = e.y - head.y;
    const aligned = (d[0] !== 0 && dy === 0 && Math.sign(dx) === d[0]) ||
      (d[1] !== 0 && dx === 0 && Math.sign(dy) === d[1]);
    if (!aligned) continue;
    const dist = Math.abs(dx) + Math.abs(dy);
    if (dist < targetDist && world.isFloor(e.x, e.y)) {
      let clear = true;
      let x = head.x;
      let y = head.y;
      while (x !== e.x || y !== e.y) {
        x += d[0];
        y += d[1];
        if (enemyAt(world.enemies, x, y) || !world.isFloor(x, y)) {
          clear = false;
          break;
        }
      }
      if (clear) {
        target = e;
        targetDist = dist;
      }
    }
  }
  if (target) world.spit();

  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < cands.length; i++) {
    const dir = cands[i];
    const nx = head.x + dir[0];
    const ny = head.y + dir[1];
    if (!world.isFloor(nx, ny)) continue;
    if (enemyAt(world.enemies, nx, ny)) continue;
    let score = -i;
    const ex = Math.sign(world.exit.x - nx);
    const ey = Math.sign(world.exit.y - ny);
    score += (dir[0] * ex + dir[1] * ey) * 0.9;
    for (const t of world.traps) {
      if (t.x === nx && t.y === ny) score -= 10;
    }
    for (const it of world.items) {
      if (it.kind !== 'apple') continue;
      const dist = Math.abs(it.x - nx) + Math.abs(it.y - ny);
      if (dist <= 2) score += 3 - dist;
    }
    for (const e of world.enemies) {
      const dist = Math.abs(e.x - nx) + Math.abs(e.y - ny);
      if (dist <= 1) score -= 6;
      else if (dist <= 3) score -= 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = dir;
    }
  }
  if (best) input.dirQueue.push(best);
}

function stepGame() {
  if (input.dirQueue.length) manualDrive = true;
  if (autotest && !manualDrive) autopilot();
  while (input.dirQueue.length) {
    world.pushDir(input.dirQueue.shift());
  }
  world.tick();
}

function update(step) {
  handleTaps();
  if (screen !== 'play' || !world) {
    input.dirQueue.length = 0;
    input.lastPushed = null;
    return;
  }
  stepGame();
  world.particles.update(step / 1000);
  if (world.state !== 'play') screen = world.state;
  if (world.floor !== lastFloor) {
    lastFloor = world.floor;
    cam.snap = true;
  }
}

function render(alpha) {
  ctx.imageSmoothingEnabled = false;
  const time = performance.now() / 1000;
  if (!world || screen === 'title') {
    drawTitle(ctx, time);
    return;
  }
  const head = snakePoints(world.snake, alpha)[0];
  cam.follow(head.x * TILE + TILE / 2, head.y * TILE + TILE / 2, WORLD_W, WORLD_H);
  renderWorld(ctx, world, atlas, cam, alpha, time);
  drawHUD(ctx, world);
  if (screen === 'pause') drawPause(ctx, world);
  else if (screen === 'dead') drawDeath(ctx, world);
  else if (screen === 'win') drawWin(ctx, world);
}

const loop = createLoop({ step: TICK_MS, update, render });

window.__snake = {
  get world() { return world; },
  get screen() { return screen; },
  input,
};

async function boot() {
  try {
    atlas = await loadAtlas();
  } catch (err) {
    if (loading) loading.textContent = '素材加载失败：' + err.message;
    throw err;
  }
  if (loading) loading.style.display = 'none';
  if (autotest) {
    newGame(20260929);
    const trace = [];
    for (let i = 0; i < autotestTicks && world.state === 'play'; i++) {
      stepGame();
      if (i % 15 === 0) {
        const h = world.snake.cells[0];
        trace.push(`${i}:${h.x},${h.y}${world.snake.dir.join('')}`);
      }
    }
    if (world.state !== 'play') screen = world.state;
    cam.snap = true;
    console.log(
      'AUTOTEST',
      JSON.stringify({
        ticks: world.ticks,
        state: world.state,
        dead: world.deadReason,
        floor: world.floor,
        score: world.score,
        hp: world.snake.hp,
        len: world.snake.cells.length,
        hunger: world.snake.hunger,
        enemies: world.enemies.length,
        explored: world.explored.reduce((a, b) => a + b, 0),
        trace,
        msgs: world.msgs.map((m) => m.text),
      })
    );
  }
  loop.start();
}

boot();
