const SFX = {
  bite: ['knifeSlice.ogg', 'knifeSlice2.ogg'],
  hurt: ['metalPot1.ogg', 'metalPot2.ogg'],
  eat: ['chop.ogg', 'cloth1.ogg'],
  coin: ['handleCoins.ogg', 'handleCoins2.ogg'],
  chest: ['metalLatch.ogg'],
  stairs: ['doorOpen_1.ogg', 'doorOpen_2.ogg'],
  pick: ['bookFlip1.ogg', 'bookFlip2.ogg'],
  ui: ['metalClick.ogg'],
  spit: ['drawKnife1.ogg', 'drawKnife2.ogg'],
  win: ['doorClose_1.ogg', 'doorClose_2.ogg'],
  die: ['bookClose.ogg'],
};

const VOLUMES = {
  bite: 0.32,
  hurt: 0.4,
  eat: 0.35,
  coin: 0.4,
  chest: 0.45,
  stairs: 0.5,
  pick: 0.35,
  ui: 0.35,
  spit: 0.3,
  win: 0.5,
  die: 0.5,
};

export class AudioSys {
  constructor(sfxBase = 'assets/rpg-audio/Audio/', musicSrc = 'assets/music-dungeon.mp3') {
    this.sfxBase = sfxBase;
    this.musicSrc = musicSrc;
    this.muted = false;
    this.unlocked = false;
    this.pools = {};
    this.music = null;
  }

  init() {
    for (const key of Object.keys(SFX)) {
      this.pools[key] = SFX[key].map((file) => {
        const a = new Audio(this.sfxBase + file);
        a.volume = VOLUMES[key] ?? 0.35;
        a.preload = 'auto';
        return a;
      });
    }
    this.music = new Audio(this.musicSrc);
    this.music.loop = true;
    this.music.volume = 0.28;
    this.music.preload = 'auto';
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    if (!this.muted && this.music) this.music.play().catch(() => {});
  }

  play(name) {
    if (this.muted || !this.unlocked) return;
    const pool = this.pools[name];
    if (!pool || !pool.length) return;
    let a = pool.find((x) => x.paused || x.ended);
    if (!a) a = pool[0];
    try {
      a.currentTime = 0;
      a.play().catch(() => {});
    } catch (_) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    if (!this.music) return this.muted;
    if (this.muted) this.music.pause();
    else if (this.unlocked) this.music.play().catch(() => {});
    return this.muted;
  }
}
