const DIRS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

const TAPS = ['Space', 'Enter', 'KeyP', 'Escape', 'KeyM', 'KeyR', 'KeyQ'];

export class Input {
  constructor() {
    this.dirQueue = [];
    this.taps = [];
    this.lastPushed = null;
    this.enabled = true;
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  attach(target = window) {
    target.addEventListener('keydown', this._onKeyDown);
  }

  // Touch steering: swipe in a direction to turn. Taps are left to the DOM
  // buttons (start / spit / pause), so a tap never steers by accident.
  attachTouch(el) {
    let sx = 0;
    let sy = 0;
    let active = false;
    el.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
      active = true;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      this.pushDir(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
    }, { passive: true });
    el.addEventListener('touchcancel', () => { active = false; }, { passive: true });
  }

  pushDir(d) {
    if (!this.enabled) return;
    const last = this.lastPushed || this.dirQueue[this.dirQueue.length - 1];
    if (last && last[0] === d[0] && last[1] === d[1]) return;
    if (this.dirQueue.length < 3) {
      this.dirQueue.push(d);
      this.lastPushed = d;
    }
  }

  _onKeyDown(e) {
    const d = DIRS[e.code];
    if (d) {
      e.preventDefault();
      this.pushDir(d);
      return;
    }
    if (TAPS.includes(e.code)) {
      e.preventDefault();
      if (!e.repeat) this.taps.push(e.code);
    }
  }

  takeTaps() {
    const t = this.taps;
    this.taps = [];
    return t;
  }

  clear() {
    this.dirQueue.length = 0;
    this.taps.length = 0;
    this.lastPushed = null;
  }
}
