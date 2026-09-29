const COLS = 12;
const ROWS = 11;
const COUNT = 132;
const TS = 16;

function loadTile(base, i) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('tile load failed: ' + i));
    img.src = base + 'tile_' + String(i).padStart(4, '0') + '.png';
  });
}

export async function loadAtlas(base = 'assets/tiny-dungeon/Tiles/') {
  const imgs = await Promise.all(
    Array.from({ length: COUNT }, (_, i) => loadTile(base, i))
  );
  const canvas = document.createElement('canvas');
  canvas.width = COLS * TS;
  canvas.height = ROWS * TS;
  const cx = canvas.getContext('2d');
  cx.imageSmoothingEnabled = false;
  imgs.forEach((img, i) => {
    cx.drawImage(img, (i % COLS) * TS, Math.floor(i / COLS) * TS);
  });

  return {
    canvas,
    tileW: TS,
    tileH: TS,
    draw(ctx, id, x, y, size) {
      const sx = (id % COLS) * TS;
      const sy = Math.floor(id / COLS) * TS;
      ctx.drawImage(canvas, sx, sy, TS, TS, Math.round(x), Math.round(y), size, size);
    },
    drawScaled(ctx, id, x, y, w, h) {
      const sx = (id % COLS) * TS;
      const sy = Math.floor(id / COLS) * TS;
      ctx.drawImage(canvas, sx, sy, TS, TS, Math.round(x), Math.round(y), w, h);
    },
  };
}
