export function createLoop({ step, update, render }) {
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  let running = false;

  function frame(now) {
    if (!running) return;
    let dt = now - last;
    last = now;
    if (dt < 0) dt = 0;
    if (dt > 250) dt = 250;
    acc += dt;
    let guard = 0;
    try {
      while (acc >= step && guard < 8) {
        update(step);
        acc -= step;
        guard++;
      }
      if (acc > step) acc = step;
      render(acc / step);
    } catch (err) {
      console.error('LOOPERR', err);
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
  };
}
