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

const TAPS = ['Space', 'Enter', 'KeyP', 'Escape', 'KeyM', 'KeyR'];

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

  _onKeyDown(e) {
    const d = DIRS[e.code];
    if (d) {
      e.preventDefault();
      if (!this.enabled) return;
      const last = this.lastPushed || this.dirQueue[this.dirQueue.length - 1];
      if (last && last[0] === d[0] && last[1] === d[1]) return;
      if (this.dirQueue.length < 3) {
        this.dirQueue.push(d);
        this.lastPushed = d;
      }
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
