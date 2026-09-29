import { MAP_W, MAP_H, FOV_R, MAX_FLOOR, BEST_KEY, SCORE, TILE } from './constants.js';
import { RNG } from '../engine/rng.js';
import { Particles } from '../engine/particles.js';
import { generateFloor } from './dungeon.js';
import { computeFov } from './fov.js';
import { createSnake, repositionSnake } from './snake.js';
import { ENEMY_TYPES, enemyAt, stepEnemies } from './enemies.js';
import { itemAt, removeItem } from './items.js';

export class World {
  constructor(seed, audio) {
    this.W = MAP_W;
    this.H = MAP_H;
    this.rng = new RNG(seed);
    this.audio = audio;
    this.floor = 1;
    this.score = 0;
    let storedBest = 0;
    try {
      storedBest = Number(localStorage.getItem(BEST_KEY) || 0);
    } catch (_) {}
    this.best = storedBest;
    this.state = 'play';
    this.deadReason = '';
    this.ticks = 0;
    this.msgs = [];
    this.particles = new Particles();
    this.loadFloor(true);
  }

  msg(text) {
    this.msgs.push({ text, t: 0 });
    if (this.msgs.length > 5) this.msgs.shift();
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch (_) {}
    }
  }

  loadFloor(first) {
    const data = generateFloor(this.rng, this.floor);
    this.grid = data.grid;
    this.rooms = data.rooms;
    this.start = data.start;
    this.exit = data.exit;
    this.items = data.items;
    this.traps = data.traps;
    this.decor = data.decor;
    this.explored = new Uint8Array(MAP_W * MAP_H);
    this.visible = new Uint8Array(MAP_W * MAP_H);
    if (first) this.snake = createSnake(data.start.x, data.start.y, 3);
    else repositionSnake(this.snake, data.start.x, data.start.y);
    this.enemies = data.enemies.map((e) => ({
      x: e.x,
      y: e.y,
      px: e.x,
      py: e.y,
      type: e.type,
      hp: ENEMY_TYPES[e.type].hp,
      cd: this.rng.int(1, ENEMY_TYPES[e.type].cd),
      bump: null,
    }));
    this.updateFov();
  }

  isFloor(x, y) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return false;
    return this.grid[y * MAP_W + x] === 0;
  }

  updateFov() {
    const head = this.snake.cells[0];
    computeFov(this.grid, MAP_W, MAP_H, head.x, head.y, FOV_R, this.visible, this.explored);
  }

  pushDir(d) {
    if (this.state !== 'play') return;
    const q = this.snake.queue;
    if (q.length < 3) q.push(d);
  }

  tick() {
    if (this.state !== 'play') return;
    this.ticks++;
    const s = this.snake;
    if (s.invuln > 0) s.invuln--;
    for (const m of this.msgs) m.t++;
    if (this.msgs.length && this.msgs[0].t > 45) this.msgs.shift();
    this.stepSnake();
    if (this.state !== 'play') return;
    for (const e of this.enemies) e.bump = null;
    stepEnemies(this);
    this.stepHunger();
    this.stepVenom();
    this.updateFov();
  }

  stepSnake() {
    const s = this.snake;
    s.prev = s.cells.map((c) => ({ x: c.x, y: c.y }));
    s.tongue++;

    while (s.queue.length) {
      const d = s.queue.shift();
      if (d[0] === s.dir[0] && d[1] === s.dir[1]) continue;
      const reverse = d[0] === -s.dir[0] && d[1] === -s.dir[1];
      if (reverse) {
        const tail = s.cells[s.cells.length - 1];
        const tx = tail.x + d[0];
        const ty = tail.y + d[1];
        if (this.isFloor(tx, ty) && !enemyAt(this.enemies, tx, ty)) {
          for (const c of s.cells) {
            c.x += d[0];
            c.y += d[1];
          }
          s.dir = d;
          s.stalled = false;
          return;
        }
        break;
      }
      s.dir = d;
      break;
    }

    const head = s.cells[0];
    const nx = head.x + s.dir[0];
    const ny = head.y + s.dir[1];

    if (!this.isFloor(nx, ny)) {
      s.stalled = true;
      return;
    }
    s.stalled = false;

    const e = enemyAt(this.enemies, nx, ny);
    if (e) {
      e.hp -= 1;
      this.audio.play('bite');
      this.particles.burst((e.x + 0.5) * TILE, (e.y + 0.5) * TILE, '#d4564a', 10, 130);
      if (e.hp <= 0) {
        this.killEnemy(e, true);
      } else {
        this.hurtPlayer(ENEMY_TYPES[e.type].name + '的反咬', 1);
        if (!s.alive) return;
        const bx = e.x - s.dir[0];
        const by = e.y - s.dir[1];
        if (this.isFloor(bx, by) && !enemyAt(this.enemies, bx, by)) {
          e.x = bx;
          e.y = by;
          e.px = bx;
          e.py = by;
        } else {
          s.stalled = true;
          return;
        }
      }
    }

    s.cells.unshift({ x: nx, y: ny });
    if (s.grow > 0) s.grow--;
    else s.cells.pop();
    this.onHeadCell(nx, ny);
  }

  onHeadCell(x, y) {
    const item = itemAt(this.items, x, y);
    if (item) this.pickItem(item);
    if (this.state !== 'play') return;
    const trap = this.traps.find((t) => t.x === x && t.y === y);
    if (trap) this.hurtPlayer('地刺陷阱', 1);
    if (this.state !== 'play') return;
    if (this.floor < MAX_FLOOR && this.exit.x === x && this.exit.y === y) this.descend();
  }

  hurtPlayer(source, dmg = 1) {
    const s = this.snake;
    if (!s.alive || s.invuln > 0) return;
    s.hp -= dmg;
    s.invuln = 5;
    this.audio.play('hurt');
    const head = s.cells[0];
    this.particles.burst((head.x + 0.5) * TILE, (head.y + 0.5) * TILE, '#e04848', 12, 120);
    this.msg(`受到${source}，HP -${dmg}`);
    if (s.hp <= 0) {
      s.hp = 0;
      this.die(source);
    }
  }

  die(source) {
    this.snake.alive = false;
    this.state = 'dead';
    this.deadReason = source;
    this.saveBest();
    this.audio.play('die');
    const head = this.snake.cells[0];
    this.particles.burst((head.x + 0.5) * TILE, (head.y + 0.5) * TILE, '#e8c15a', 30, 160, 0.9, 4);
    this.msg('你被' + source + '杀死了');
  }

  killEnemy(e, eaten) {
    const type = ENEMY_TYPES[e.type];
    const i = this.enemies.indexOf(e);
    if (i >= 0) this.enemies.splice(i, 1);
    this.score += type.score;
    if (eaten) this.snake.grow = Math.min(this.snake.grow + 1, 40);
    this.particles.burst((e.x + 0.5) * TILE, (e.y + 0.5) * TILE, '#d4564a', 16, 140, 0.55, 4);
    this.audio.play(eaten ? 'eat' : 'bite');
    this.msg(
      eaten
        ? `击杀${type.name} +${type.score}，身长+1`
        : `毒杀${type.name} +${type.score}`
    );
    if (this.rng.chance(0.28)) {
      this.items.push({ x: e.x, y: e.y, kind: 'apple' });
    }
  }

  pickItem(item) {
    const s = this.snake;
    const px = (item.x + 0.5) * TILE;
    const py = (item.y + 0.5) * TILE;
    switch (item.kind) {
      case 'apple':
        removeItem(this.items, item);
        s.hunger = Math.min(100, s.hunger + 30);
        s.grow = Math.min(s.grow + 1, 40);
        this.score += SCORE.apple;
        this.audio.play('eat');
        this.particles.burst(px, py, '#7fc46a', 10, 90);
        this.msg(`吃下苹果 +${SCORE.apple} 分，饱食度回升`);
        break;
      case 'gold':
        removeItem(this.items, item);
        this.score += SCORE.gold;
        this.audio.play('coin');
        this.particles.burst(px, py, '#e8c15a', 10, 100);
        this.msg(`拾取金币 +${SCORE.gold} 分`);
        break;
      case 'potionRed':
        removeItem(this.items, item);
        this.audio.play('pick');
        if (s.hp < s.maxHp) {
          s.hp++;
          this.msg('饮下治疗药水，HP +1');
        } else {
          this.score += 5;
          this.msg('HP 已满，药水转化为 +5 分');
        }
        this.particles.burst(px, py, '#e04848', 10, 90);
        break;
      case 'potionBlue':
        removeItem(this.items, item);
        s.venom = s.venomMax;
        this.audio.play('pick');
        this.particles.burst(px, py, '#6ab4e8', 10, 90);
        this.msg('饮下毒液药水，毒液补满');
        break;
      case 'chest':
        removeItem(this.items, item);
        this.audio.play('chest');
        this.score += SCORE.chest;
        this.openChest(px, py);
        break;
      case 'amulet':
        removeItem(this.items, item);
        this.score += SCORE.amulet;
        this.state = 'win';
        this.saveBest();
        this.audio.play('win');
        this.particles.burst(px, py, '#e8c15a', 40, 180, 1.1, 5);
        this.msg(`获得古代圣物 +${SCORE.amulet} 分，你逃出了蛇渊！`);
        break;
      default:
        break;
    }
  }

  openChest(px, py) {
    const s = this.snake;
    const roll = this.rng.next();
    if (roll < 0.3) {
      if (s.hp < s.maxHp) {
        s.hp++;
        this.msg('宝箱：治疗药剂，HP +1');
      } else {
        this.score += 20;
        this.msg('宝箱：HP 已满，转化为 +20 分');
      }
      this.particles.burst(px, py, '#e04848', 12, 110);
    } else if (roll < 0.6) {
      s.venom = s.venomMax;
      this.msg('宝箱：一瓶毒液，毒液补满');
      this.particles.burst(px, py, '#7ad67a', 12, 110);
    } else if (roll < 0.85) {
      this.score += 40;
      this.msg('宝箱：一大把金币，+40 分');
      this.audio.play('coin');
      this.particles.burst(px, py, '#e8c15a', 14, 120);
    } else {
      s.grow = Math.min(s.grow + 2, 40);
      this.msg('宝箱：古老血肉，身长 +2');
      this.particles.burst(px, py, '#4fbf63', 14, 120);
    }
    this.msg(`开启宝箱 +${SCORE.chest} 分`);
  }

  descend() {
    this.floor++;
    this.score += SCORE.floor;
    this.audio.play('stairs');
    this.loadFloor(false);
    this.msg(`拾级而下，抵达第 ${this.floor} 层 +${SCORE.floor} 分`);
  }

  stepHunger() {
    const s = this.snake;
    if (this.ticks % 4 === 0) {
      s.hunger = Math.max(0, s.hunger - 1);
    }
    if (s.hunger <= 0 && this.ticks % 9 === 0) {
      this.hurtPlayer('饥饿', 1);
    }
  }

  stepVenom() {
    const s = this.snake;
    if (s.venom < s.venomMax && this.ticks % 40 === 0) s.venom++;
  }

  spit() {
    const s = this.snake;
    if (this.state !== 'play') return false;
    if (s.venom <= 0) {
      this.audio.play('ui');
      this.msg('毒液耗尽，稍等回复');
      return false;
    }
    s.venom--;
    this.audio.play('spit');
    const head = s.cells[0];
    const dx = s.dir[0];
    const dy = s.dir[1];
    let x = head.x;
    let y = head.y;
    for (let step = 0; step < 6; step++) {
      x += dx;
      y += dy;
      if (!this.isFloor(x, y)) {
        this.particles.burst(
          (x - dx + 0.5) * TILE,
          (y - dy + 0.5) * TILE,
          '#7ad67a',
          7,
          70
        );
        break;
      }
      this.particles.trail((x + 0.5) * TILE, (y + 0.5) * TILE, '#7ad67a', 2);
      const e = enemyAt(this.enemies, x, y);
      if (e) {
        e.hp -= 2;
        this.particles.burst((x + 0.5) * TILE, (y + 0.5) * TILE, '#7ad67a', 14, 130);
        if (e.hp <= 0) {
          this.killEnemy(e, false);
        } else {
          this.audio.play('bite');
          this.msg(`毒液命中${ENEMY_TYPES[e.type].name}`);
        }
        break;
      }
    }
    return true;
  }
}
