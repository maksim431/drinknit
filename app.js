(() => {
  'use strict';

  const W = 1920, H = 1080;
  const body = document.body;
  const scene = document.getElementById('scene');
  const layer = document.getElementById('layer');
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const skipBtn = document.querySelector('.skip');
  const soundBtn = document.querySelector('.sound');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- layout
  let s = 1, tx = 0, ty = 0, vw = 0, vh = 0, dpr = 1, mobile = false;

  function layout() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    mobile = vw < 821 || vw / vh < 1;
    body.classList.toggle('m', mobile);

    if (!mobile) {
      s = Math.min(vw / W, vh / H);
      tx = (vw - W * s) / 2;
      ty = (vh - H * s) / 2;
      layer.style.setProperty('--s', s);
      layer.style.setProperty('--tx', tx + 'px');
      layer.style.setProperty('--ty', ty + 'px');
    } else {
      // the gift (stage x 435…1573, y −369…917) fills the top of the screen
      const boxW = 1138;
      s = Math.min((vw * 1.12) / boxW, 0.6);
      tx = vw / 2 - 1004 * s;
      ty = 70 + 369 * s;
      const mh = ty + 905 * s;
      layer.style.setProperty('--mh', Math.round(mh) + 'px');
    }
    scene.style.setProperty('--s', s);
    scene.style.setProperty('--tx', tx + 'px');
    scene.style.setProperty('--ty', ty + 'px');

    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
  }
  window.addEventListener('resize', layout);
  layout();

  // stagger for interface elements
  const uiOrder = [
    ['.logo', 0], ['.sound', .08], ['.stock', .2], ['.title', .25],
    ['.title__line:nth-child(1)', .3], ['.title__line:nth-child(2)', .4], ['.title__line:nth-child(3)', .5],
    ['.offer__text', .55], ['.btn--primary', .68], ['.btn--ghost', .78],
  ];
  uiOrder.forEach(([sel, d]) => {
    const el = layer.querySelector(sel);
    if (el) el.style.setProperty('--d', d + 's');
  });

  // ---------------------------------------------------------------- particles
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const BOX = { x: 960, y: 470 };       // gift centre on the artboard
  const MOUTH = { x: 960, y: 380 };     // where the magic bursts out

  const parts = [];   // artboard-space particles
  const flakes = [];  // screen-space snow
  let flash = 0;
  let ring = null;

  const confettiColors = ['#c3222f', '#e8394a', '#f6d58e', '#ffe9b0', '#e1d2b2', '#ffffff', '#4fae72'];

  function spawnDust() {
    const a = rand(0, Math.PI * 2);
    const r = rand(520, 900);
    parts.push({
      type: 'dust', a, r, r0: r,
      w: rand(1.6, 2.6) * (Math.random() < .5 ? -1 : 1),
      size: rand(2.5, 6), life: 0, max: rand(1, 1.6),
      hue: pick(['255,226,150', '255,244,214', '255,200,120']),
    });
  }

  function burst() {
    flash = 1;
    ring = { r: 40, life: 0 };
    for (let i = 0; i < 110; i++) {
      const a = rand(-Math.PI * .95, -Math.PI * .05) + rand(-.25, .25);
      const v = rand(500, 1500);
      parts.push({
        type: 'confetti', x: MOUTH.x + rand(-160, 160), y: MOUTH.y + rand(-30, 60),
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        rot: rand(0, Math.PI * 2), vr: rand(-12, 12), flip: rand(0, Math.PI * 2), vf: rand(6, 14),
        w: rand(10, 18), h: rand(6, 11), color: pick(confettiColors),
        life: 0, max: rand(2.4, 3.6),
      });
    }
    for (let i = 0; i < 70; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(250, 1100);
      parts.push({
        type: 'star', x: MOUTH.x, y: MOUTH.y + 40,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 - 200,
        size: rand(8, 26), rot: rand(0, 1), vr: rand(-3, 3),
        life: 0, max: rand(1.2, 2.4), tw: rand(8, 16),
      });
    }
    for (let i = 0; i < 90; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(900, 2200);
      parts.push({
        type: 'spark', x: MOUTH.x, y: MOUTH.y + 40,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0, max: rand(.45, .9),
      });
    }
  }

  function spawnTwinkle() {
    parts.push({
      type: 'twinkle',
      x: rand(470, 1480), y: rand(60, 860),
      size: rand(7, 16), life: 0, max: rand(1, 1.8), rot: rand(0, 1),
    });
  }

  function initSnow() {
    const n = mobile ? 45 : 90;
    flakes.length = 0;
    for (let i = 0; i < n; i++) flakes.push(newFlake(true));
  }
  function newFlake(anywhere) {
    return {
      x: rand(0, vw), y: anywhere ? rand(0, vh) : rand(-40, -5),
      r: rand(.8, 2.6), vy: rand(18, 55), sway: rand(10, 30), ph: rand(0, Math.PI * 2),
      a: rand(.25, .7),
    };
  }

  function drawStar(x, y, size, rot, alpha, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 1.6);
    g.addColorStop(0, `rgba(${color},.9)`);
    g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffaf0';
    ctx.beginPath();
    const k = size * .16;
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(k, -k, size, 0);
    ctx.quadraticCurveTo(k, k, 0, size);
    ctx.quadraticCurveTo(-k, k, -size, 0);
    ctx.quadraticCurveTo(-k, -k, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  let dustUntil = 0, twinkleOn = false, twinkleAcc = 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    const sy = mobile ? window.scrollY : 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // snow (screen space)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff';
    for (const f of flakes) {
      f.y += f.vy * dt;
      f.ph += dt;
      if (f.y > vh + 10) Object.assign(f, newFlake(false));
      ctx.globalAlpha = f.a;
      ctx.beginPath();
      ctx.arc(f.x + Math.sin(f.ph) * f.sway, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // artboard space
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * tx, dpr * (ty - sy));

    if (now < dustUntil) for (let i = 0; i < 4; i++) spawnDust();
    if (twinkleOn) {
      twinkleAcc += dt;
      while (twinkleAcc > .32) { twinkleAcc -= .32; spawnTwinkle(); }
    }

    if (flash > 0) {
      const g = ctx.createRadialGradient(MOUTH.x, MOUTH.y, 0, MOUTH.x, MOUTH.y, 1300);
      g.addColorStop(0, `rgba(255,250,230,${flash})`);
      g.addColorStop(.35, `rgba(255,230,170,${flash * .55})`);
      g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-500, -500, W + 1000, H + 1000);
      flash = Math.max(0, flash - dt * 1.6);
    }

    if (ring) {
      ring.life += dt;
      ring.r += dt * 1700;
      const a = Math.max(0, 1 - ring.life / .8);
      ctx.strokeStyle = `rgba(255,236,190,${a * a * .35})`;
      ctx.lineWidth = 3 + 14 * a;
      ctx.beginPath();
      ctx.ellipse(MOUTH.x, MOUTH.y + 60, ring.r, ring.r * .55, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (a <= 0) ring = null;
    }

    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) { parts.splice(i, 1); continue; }

      if (p.type === 'dust') {
        p.a += p.w * dt * (1 + 2 * (1 - p.r / p.r0));
        p.r = p.r0 * (1 - t) * (1 - t);
        const x = BOX.x + Math.cos(p.a) * p.r;
        const y = BOX.y + Math.sin(p.a) * p.r * .7;
        const alpha = Math.sin(t * Math.PI);
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.size * 4);
        g.addColorStop(0, `rgba(${p.hue},${alpha})`);
        g.addColorStop(1, `rgba(${p.hue},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'spark') {
        p.vx *= 1 - 2.6 * dt;
        p.vy *= 1 - 2.6 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.strokeStyle = `rgba(255,232,170,${1 - t})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * .05, p.y - p.vy * .05);
        ctx.stroke();
      } else if (p.type === 'star') {
        p.vx *= 1 - 1.8 * dt;
        p.vy = p.vy * (1 - 1.8 * dt) + 140 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        const tw = .6 + .4 * Math.sin(p.life * p.tw);
        drawStar(p.x, p.y, p.size * (1 - t * .5), p.rot, (1 - t) * tw, '255,214,120');
      } else if (p.type === 'twinkle') {
        const a = Math.sin(t * Math.PI);
        drawStar(p.x, p.y, p.size * (.4 + .6 * a), p.rot, a * .85, '255,225,160');
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    // confetti drawn normally (not additive) so colours stay true
    for (const p of parts) {
      if (p.type !== 'confetti') continue;
      const t = p.life / p.max;
      p.vx *= 1 - 1.4 * dt;
      p.vy = p.vy * (1 - 1.4 * dt) + 520 * dt;
      p.x += p.vx * dt + Math.sin(p.life * 3 + p.flip) * 40 * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.flip += p.vf * dt;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.flip));
      ctx.globalAlpha = t > .75 ? (1 - t) / .25 : 1;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- sound
  let audio = null, musicOn = false, loopTimer = null;
  const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5 };
  // public-domain “Jingle Bells” refrain, music-box style
  const TUNE = [
    ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2],
    ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', .5], ['E5', 4],
    ['F5', 1], ['F5', 1], ['F5', 1.5], ['F5', .5], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', .5], ['E5', .5],
    ['E5', 1], ['D5', 1], ['D5', 1], ['E5', 1], ['D5', 2], ['G5', 2],
    ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2],
    ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', .5], ['E5', 4],
    ['F5', 1], ['F5', 1], ['F5', 1.5], ['F5', .5], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', .5], ['E5', .5],
    ['G5', 1], ['G5', 1], ['F5', 1], ['D5', 1], ['C5', 4],
  ];
  const BEAT = .3;

  function ensureAudio() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
      audio.master = audio.createGain();
      audio.master.gain.value = .22;
      audio.master.connect(audio.destination);
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }

  function bell(freq, at, len = 1.2, vol = .5) {
    const a = audio;
    [[1, 1], [2.01, .35], [3.98, .12]].forEach(([m, v]) => {
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = 'sine';
      o.frequency.value = freq * m;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol * v, at + .006);
      g.gain.exponentialRampToValueAtTime(.0001, at + len / m);
      o.connect(g).connect(a.master);
      o.start(at);
      o.stop(at + len + .05);
    });
  }

  function playTune() {
    if (!musicOn || !ensureAudio()) return;
    let t = audio.currentTime + .08;
    for (const [n, d] of TUNE) { bell(NOTE[n], t, 1.1, .45); t += d * BEAT; }
    const total = TUNE.reduce((acc, [, d]) => acc + d, 0) * BEAT;
    loopTimer = setTimeout(playTune, (total + 1.2) * 1000);
  }

  function magicChime() {
    if (!musicOn || !ensureAudio()) return;
    const t = audio.currentTime;
    ['C5', 'E5', 'G5', 'C6', 'E5', 'G5', 'A5', 'C6'].forEach((n, i) =>
      bell(NOTE[n] * (i > 3 ? 2 : 1), t + i * .055, 1.6, .3));
  }

  soundBtn.addEventListener('click', () => {
    musicOn = !musicOn;
    soundBtn.setAttribute('aria-pressed', String(musicOn));
    soundBtn.setAttribute('aria-label', musicOn ? 'Выключить музыку' : 'Включить музыку');
    clearTimeout(loopTimer);
    if (musicOn) { magicChime(); playTune(); }
  });

  // ---------------------------------------------------------------- timeline
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  function finish() {
    timers.forEach(clearTimeout);
    dustUntil = 0;
    body.classList.add('is-charging', 'is-open', 'is-frame', 'is-ui', 'is-done');
    body.classList.remove('is-intro-lock');
    twinkleOn = true;
  }

  function start() {
    body.classList.remove('is-loading');
    initSnow();
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });

    if (reduced) { finish(); return; }

    body.classList.add('is-intro-lock');
    at(700, () => {
      body.classList.add('is-charging');
      dustUntil = performance.now() + 1500;
    });
    at(2400, () => {
      body.classList.add('is-open');
      burst();
      magicChime();
    });
    at(3000, () => body.classList.add('is-frame'));
    at(3500, () => {
      body.classList.add('is-ui');
      body.classList.remove('is-intro-lock');
    });
    at(5200, () => { body.classList.add('is-done'); twinkleOn = true; });
  }

  skipBtn.addEventListener('click', finish);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') finish(); });

  const imgs = [...document.querySelectorAll('.closed__img, .open--back')];
  Promise.all(imgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {})))
    .then(() => (document.fonts ? document.fonts.ready : null))
    .then(start, start);
})();
