(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const R = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  /* ---------- Жүректер мен жарқыраулар (canvas) ---------- */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  const HEART = new Path2D('M50 85 C20 62 4 44 4 27 C4 13 15 4 28 4 C38 4 46 9 50 17 C54 9 62 4 72 4 C85 4 96 13 96 27 C96 44 80 62 50 85 Z');
  const COLORS = ['#ff2d55', '#e11d48', '#ff6b81', '#be123c'];
  let W = 0, H = 0, DPR = 1;

  const sprites = COLORS.map(c => {
    const s = document.createElement('canvas'); s.width = s.height = 128;
    const x = s.getContext('2d');
    x.translate(32, 35); x.scale(.64, .64);
    x.shadowColor = c; x.shadowBlur = 38;
    const g = x.createLinearGradient(0, 0, 100, 90);
    g.addColorStop(0, '#ff9fb2'); g.addColorStop(.45, c); g.addColorStop(1, '#7f0f2f');
    x.fillStyle = g; x.fill(HEART);
    return s;
  });
  const glow = (() => {
    const s = document.createElement('canvas'); s.width = s.height = 32;
    const x = s.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,235,240,1)'); g.addColorStop(.25, 'rgba(255,120,150,.55)'); g.addColorStop(1, 'rgba(255,60,100,0)');
    x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    return s;
  })();

  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[(Math.random() * a.length) | 0];
  let ambient = [], sparks = [], parts = [];

  const newHeart = (fromBottom) => ({
    x: rnd(0, W), y: fromBottom ? H + 40 : rnd(0, H), s: rnd(10, 34), v: rnd(12, 34),
    ph: rnd(0, 6.28), sw: rnd(8, 26), a: rnd(.22, .6), spr: pick(sprites)
  });
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = R ? 8 : (W < 600 ? 14 : 26), m = R ? 14 : (W < 600 ? 34 : 60);
    ambient = Array.from({ length: n }, () => newHeart(false));
    sparks = Array.from({ length: m }, () => ({ x: rnd(0, W), y: rnd(0, H), s: rnd(5, 16), ph: rnd(0, 6.28), sp: rnd(.4, 1.2) }));
  }

  function burst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), v = rnd(110, 430);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 260, life: 0, max: rnd(1.6, 3),
        rot: rnd(-1, 1), vr: rnd(-3, 3), s: rnd(12, 36), spr: pick(sprites) });
    }
  }
  function shower(ms) {
    const end = performance.now() + ms;
    const id = setInterval(() => {
      if (performance.now() > end) return clearInterval(id);
      for (let i = 0; i < (R ? 1 : 3); i++)
        parts.push({ x: rnd(0, W), y: H + 30, vx: rnd(-20, 20), vy: -rnd(130, 280), g: 0, life: 0, max: rnd(3, 5),
          rot: rnd(-.4, .4), vr: rnd(-.8, .8), s: rnd(14, 40), spr: pick(sprites) });
    }, 140);
  }

  let last = 0;
  function frame(t) {
    const dt = Math.min((t - last) / 1000, .05); last = t;
    ctx.clearRect(0, 0, W, H);

    for (const p of sparks) {
      p.ph += dt * p.sp * 2;
      const a = .5 + .5 * Math.sin(p.ph);
      ctx.globalAlpha = a * .8;
      ctx.drawImage(glow, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
    }
    for (const h of ambient) {
      h.y -= h.v * dt; h.ph += dt * .7;
      const x = h.x + (R ? 0 : Math.sin(h.ph) * h.sw);
      const f = Math.max(0, Math.min(1, (H - h.y) / 120, (h.y + 40) / 160));
      ctx.globalAlpha = h.a * f;
      const d = h.s * 2;
      ctx.drawImage(h.spr, x - d / 2, h.y - d / 2, d, d);
      if (h.y < -50) Object.assign(h, newHeart(true));
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt; p.vy += p.g * dt; p.vx *= (1 - .6 * dt);
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      const k = p.life / p.max;
      if (k >= 1 || p.y < -80) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, (1 - k) * 1.4);
      const d = p.s * 2;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.spr, -d / 2, -d / 2, d, d); ctx.restore();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  addEventListener('resize', resize);
  resize(); requestAnimationFrame(frame);

  /* ---------- Батырмалар ---------- */
  const ask = $('#ask'), reply = $('#reply'), yes = $('#yes'), maybe = $('#maybe'), note = $('#maybeNote');
  const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  yes.addEventListener('click', () => {
    if (body.classList.contains('yes')) return;
    const [x, y] = center(yes);
    burst(x, y, R ? 24 : 90);
    shower(4500);
    setTimeout(() => burst(innerWidth / 2, innerHeight * .4, R ? 12 : 50), 700);
    body.classList.add('yes');
    ask.classList.add('out');
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => {
      ask.hidden = true; reply.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => reply.classList.add('in')));
    }, 560);
  });

  maybe.addEventListener('click', () => {
    note.textContent = 'Жарайды, асықпай ойлан. Бірақ сенімен барғым келіп тұр 🥹❤️';
    note.classList.remove('in'); void note.offsetWidth; note.classList.add('in');
    const [x, y] = center(maybe);
    burst(x, y, R ? 4 : 14);
  });

  /* ---------- Музыка (Web Audio, тек батырма басылғанда) ---------- */
  const mBtn = $('#music'), mLabel = mBtn.querySelector('.label');
  const Music = (() => {
    let ac, master, bus, timer, off, nextT = 0, step = 0, playing = false;
    const chords = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 65], [48, 55, 59, 64]]; // Fmaj7 Am7 Dm7 Cmaj7
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);

    function init() {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
      master.connect(lp); lp.connect(ac.destination);
      bus = ac.createGain(); bus.connect(master);
      const d = ac.createDelay(1.5); d.delayTime.value = .5;
      const fb = ac.createGain(); fb.gain.value = .4;
      const wet = ac.createGain(); wet.gain.value = .45;
      bus.connect(d); d.connect(fb); fb.connect(d); d.connect(wet); wet.connect(master);
    }
    function pad(m, t, dur, vol) {
      [['triangle', -6], ['sine', 6]].forEach(([type, det]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = hz(m); o.detune.value = det;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 1.8);
        g.gain.setValueAtTime(vol, t + dur - .4);
        g.gain.linearRampToValueAtTime(0, t + dur + 1.6);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 1.8);
      });
    }
    function bell(m, t) {
      [[1, .07], [2, .018]].forEach(([mul, v]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = hz(m) * mul;
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(v, t + .03);
        g.gain.exponentialRampToValueAtTime(.0001, t + 3);
        o.connect(g); g.connect(bus); o.start(t); o.stop(t + 3.1);
      });
    }
    function schedule() {
      while (nextT < ac.currentTime + 2) {
        const c = chords[step % chords.length], dur = 6;
        pad(c[0] - 12, nextT, dur, .07);
        c.forEach(n => pad(n, nextT, dur, .035));
        [2, 3, 1, 3].forEach((idx, i) => bell(c[idx] + (i % 2 ? 24 : 12), nextT + .6 + i * 1.4));
        nextT += dur; step++;
      }
    }
    return {
      get on() { return playing; },
      start() {
        if (!ac) init();
        clearTimeout(off);
        ac.resume();
        if (nextT < ac.currentTime) nextT = ac.currentTime + .1;
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(.9, ac.currentTime, .7);
        schedule(); clearInterval(timer); timer = setInterval(schedule, 500);
        playing = true;
      },
      stop() {
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.setTargetAtTime(0, ac.currentTime, .25);
        clearInterval(timer);
        off = setTimeout(() => ac.suspend(), 1200);
        playing = false;
      }
    };
  })();

  mBtn.addEventListener('click', () => {
    try {
      Music.on ? Music.stop() : Music.start();
    } catch (e) { return; }
    mBtn.classList.toggle('on', Music.on);
    mBtn.setAttribute('aria-pressed', String(Music.on));
    mLabel.textContent = Music.on ? 'Музыканы өшіру' : 'Музыканы қосу';
  });
})();
