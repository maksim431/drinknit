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
    body.style.setProperty('--s', s);
    body.style.setProperty('--tx', tx + 'px');
    body.style.setProperty('--ty', ty + 'px');

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
    const n = mobile ? 25 : 40;
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
  const frameHooks = [];
  let onSets = false;

  function mote(x, y, opts = {}) {
    parts.push(Object.assign({
      type: 'mote', x, y,
      vx: rand(-40, 40), vy: rand(-90, -20),
      size: rand(2, 4.5), life: 0, max: rand(.7, 1.5),
      star: Math.random() < .3, rot: rand(0, 1),
      hue: pick(['255,226,150', '255,244,214', '255,200,120']),
    }, opts));
  }

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
    if (frameHooks.length) frameHooks.forEach(fn => fn(dt, now));
    if (twinkleOn && !onSets) {
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
      } else if (p.type === 'mote') {
        p.vx *= 1 - 1.2 * dt;
        p.vy = p.vy * (1 - 1.2 * dt) - 30 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const a = Math.sin(t * Math.PI);
        if (p.star) drawStar(p.x, p.y, p.size * 2.6 * (.5 + .5 * a), p.rot, a * .9, p.hue);
        else {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          g.addColorStop(0, `rgba(${p.hue},${a})`);
          g.addColorStop(1, `rgba(${p.hue},0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
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

  // ---------------------------------------------------------------- content
  // Item texts: only the «Зелёный воришка» copy comes from the design,
  // the others are drafts — edit them here.
  const ITEMS = [
    // front-to-back order matters for hit testing
    { id: 'lamb', x: 864.7, y: 454.7, w: 161.7, h: 223.5,
      title: 'Игрушка\n«Барашек»',
      body: 'Связан мной вручную.\nМягкий, с красным шарфиком.',
      note: 'Каждая игрушка может немного отличаться от фото, потому что связана вручную.' },
    { id: 'mitten', x: 651, y: 440.9, w: 198, h: 272.6,
      title: 'Варежка-подвеска\nна ёлку',
      body: 'Связана мной вручную.\nМожно повесить на ёлку или положить в неё сладость.',
      note: 'Каждая игрушка может немного отличаться от фото, потому что связана вручную.' },
    { id: 'cream', x: 1015.6, y: 483.1, w: 272.4, h: 231.4,
      title: 'Крем для рук',
      body: 'Приятный зимний уход в дополнение к игрушкам.',
      note: '' },
    { id: 'goat', x: 577.5, y: 198.8, w: 428.3, h: 339.2,
      title: 'Игрушка\n«Белый козлик»',
      body: 'Мягкий козлик с красным шарфом — символ уюта и праздника.',
      note: 'Каждая игрушка может немного отличаться от фото, потому что сделана вручную.' },
    { id: 'grinch', x: 1008.7, y: 121.3, w: 326.3, h: 420.6,
      title: 'Игрушка\n«Зелёный воришка»',
      body: 'Связано мной за 7 часов.\nРазмер: 14 см.\nСостав: Хлопок и акрил, мелкие детали на безопасном креплении.',
      note: 'Каждая игрушка может немного отличатся от фото, потому что связана вручную.',
      photos: ['assets/items/grinch-photo.webp'] },
    { id: 'card', x: 818.6, y: 23.3, w: 290.1, h: 345.1,
      title: 'Открытка\nс вашим текстом',
      body: 'Подпишу открытку от руки — пришлите текст, когда будете заказывать набор.',
      note: '' },
  ];

  // Sets: S comes from the design; M and L are drafts — edit them here.
  const SETS = {
    S: { hours: '4 часа вязания', desc: 'Небольшой подарок учителю, воспитателю или коллеге', price: '1600 ₽' },
    M: { hours: '7 часов вязания', desc: 'Подарок другу или родным: больше игрушек и открытка вашим текстом', price: '1 400 ₽' },
    L: { hours: '12 часов вязания', desc: 'Большой набор для самых близких — все игрушки из коробки', price: '1 900 ₽' },
  };

  // ---------------------------------------------------------------- items
  const BOX_RECT = { x: -229, y: -516, w: 2352, h: 1757 };
  const BOX_SHIFT = { x: 13, y: 116 };   // the set moves down a bit on screen 2
  const off = { x: 0, y: 0 };
  const itemsHost = document.getElementById('items');
  const itemsHostM = document.getElementById('items-m');
  const focusHost = document.getElementById('focus');

  function itemEl(it) {
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.id = it.id;
    el.style.left = ((it.x - BOX_RECT.x) / BOX_RECT.w * 100) + '%';
    el.style.top = ((it.y - BOX_RECT.y) / BOX_RECT.h * 100) + '%';
    el.style.width = (it.w / BOX_RECT.w * 100) + '%';
    el.style.height = (it.h / BOX_RECT.h * 100) + '%';
    el.innerHTML = `<img src="assets/items/${it.id}.webp" alt="" draggable="false">`;
    return el;
  }
  ITEMS.forEach(it => {
    it.el = itemEl(it);
    it.elM = itemEl(it);
    itemsHost.appendChild(it.el);
    itemsHostM.appendChild(it.elM);
  });

  // alpha maps for pixel-exact hover and the contour points for sparkles
  ITEMS.forEach(it => {
    const img = new Image();
    img.src = `assets/items/${it.id}.webp`;
    img.decode().then(() => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      it.alpha = { w: c.width, h: c.height, d };
      const kx = it.w / c.width, ky = it.h / c.height, edge = [];
      const A = (x, y) => d[(y * c.width + x) * 4 + 3];
      for (let y = 2; y < c.height - 2; y += 3) {
        for (let x = 2; x < c.width - 2; x += 3) {
          if (A(x, y) > 128 && (A(x - 3, y) < 64 || A(x + 3, y) < 64 || A(x, y - 3) < 64 || A(x, y + 3) < 64)) {
            edge.push([it.x + x * kx, it.y + y * ky]);
          }
        }
      }
      it.edge = edge;
    }).catch(() => {});
  });

  function hitItem(sx, sy, noOffset) {
    if (!noOffset) { sx -= off.x; sy -= off.y; }
    for (const it of ITEMS) {
      if (!it.alpha || sx < it.x || sy < it.y || sx > it.x + it.w || sy > it.y + it.h) continue;
      const px = Math.floor((sx - it.x) / it.w * it.alpha.w);
      const py = Math.floor((sy - it.y) / it.h * it.alpha.h);
      if (it.alpha.d[(py * it.alpha.w + px) * 4 + 3] > 90) return it;
    }
    return null;
  }

  function sparkleEdge(it, n, opts) {
    if (!it.edge || !it.edge.length) return;
    for (let i = 0; i < n; i++) {
      const [x, y] = pick(it.edge);
      mote(x + off.x + rand(-3, 3), y + off.y + rand(-3, 3), opts);
    }
  }

  // idle: the items light up one after another; hover: the item under the cursor
  let hoverItem = null, litIdx = -1, litTimer = 0, openItem = null;
  function setHover(it) {
    if (hoverItem === it) return;
    if (hoverItem) { hoverItem.el.classList.remove('is-hover'); hoverItem.elM.classList.remove('is-hover'); }
    hoverItem = it;
    body.classList.toggle('is-pointing', !!it);
    if (it) {
      it.el.classList.add('is-hover'); it.elM.classList.add('is-hover');
      sparkleEdge(it, 26, { vy: rand(-140, -60) });
      softChime(it);
    }
  }
  function setLit(i) {
    ITEMS.forEach((it, k) => { it.el.classList.toggle('is-lit', k === i); it.elM.classList.toggle('is-lit', k === i); });
    litIdx = i;
  }

  let sparkAcc = 0;
  frameHooks.push((dt) => {
    const active = (onSets || mobile) && !reduced;
    if (!active) { if (litIdx !== -1) setLit(-1); return; }
    if (hoverItem && litIdx !== -1) setLit(-1);
    if (!openItem && !hoverItem) {
      litTimer -= dt;
      if (litTimer <= 0) {
        // order the idle wave left → right
        const order = ['goat', 'mitten', 'lamb', 'card', 'cream', 'grinch'];
        const next = (order.indexOf(ITEMS[litIdx] ? ITEMS[litIdx].id : '') + 1) % order.length;
        setLit(ITEMS.findIndex(it => it.id === order[next]));
        litTimer = 1.9;
      }
    }
    if (mobile) return; // sparkles are drawn on the artboard only
    sparkAcc += dt;
    while (sparkAcc > .05) {
      sparkAcc -= .05;
      const target = openItem || hoverItem || (litIdx >= 0 ? ITEMS[litIdx] : null);
      if (target) sparkleEdge(target, openItem || hoverItem ? 2 : 1);
    }
  });

  function toStage(cx, cy) { return [(cx - tx) / s, (cy - ty) / s]; }

  window.addEventListener('pointermove', e => {
    if (mobile || !onSets || openItem || e.target.closest('a, button, .panel')) { if (!openItem) setHover(null); return; }
    const [x, y] = toStage(e.clientX, e.clientY);
    setHover(hitItem(x, y));
  }, { passive: true });

  window.addEventListener('click', e => {
    if (e.target.closest('a, button, .modal')) return;
    if (openItem) return;
    if (mobile) {
      const r = itemsHostM.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      const x = BOX_RECT.x + (e.clientX - r.left) / r.width * BOX_RECT.w;
      const y = BOX_RECT.y + (e.clientY - r.top) / r.height * BOX_RECT.h;
      const it = hitItem(x, y, true);
      if (it) openModal(it);
      return;
    }
    if (!onSets) return;
    const [x, y] = toStage(e.clientX, e.clientY);
    const it = hitItem(x, y);
    if (it) openModal(it);
  });

  // keyboard access to the items
  const srList = document.createElement('div');
  srList.className = 'sr-only';
  ITEMS.forEach(it => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = it.title.replace('\n', ' ');
    b.addEventListener('focus', () => { if (!mobile) setHover(it); });
    b.addEventListener('blur', () => setHover(null));
    b.addEventListener('click', () => openModal(it, b));
    srList.appendChild(b);
  });
  document.getElementById('s2').appendChild(srList);

  // ---------------------------------------------------------------- modal
  const dim = document.getElementById('dim');
  const modal = document.getElementById('modal');
  const mTitle = document.getElementById('modal-title');
  const mBody = document.getElementById('modal-body');
  const mNote = document.getElementById('modal-note');
  const mSlides = document.getElementById('modal-slides');
  const mNav = modal.querySelector('.modal__nav');
  let slideIdx = 0, returnFocus = null;

  function showSlide(i) {
    const slides = [...mSlides.children];
    slideIdx = (i + slides.length) % slides.length;
    slides.forEach((sl, k) => sl.classList.toggle('is-active', k === slideIdx));
  }

  function openModal(it, from) {
    openItem = it;
    returnFocus = from || document.activeElement;
    setHover(null);
    setLit(-1);
    mTitle.textContent = it.title;
    mBody.textContent = it.body;
    mNote.textContent = it.note || '';
    const photos = (it.photos || []).map(src => `<img class="modal__slide" src="${src}" alt="${it.title.replace('\n', ' ')}">`);
    photos.push(`<img class="modal__slide modal__slide--cut" src="assets/items/${it.id}.webp" alt="${it.title.replace('\n', ' ')} в наборе">`);
    mSlides.innerHTML = photos.join('');
    mNav.hidden = photos.length < 2;
    showSlide(0);

    if (!mobile) {
      // the item stays lit above the dimmer, the window opens next to it
      focusHost.innerHTML = '<div class="items"></div>';
      focusHost.firstChild.appendChild(itemEl(it));
      const ix = it.x + off.x;
      const cx = ix + it.w / 2;
      let left = cx >= 960 ? ix - 24 - 700 : ix + it.w + 24;
      left = Math.max(60, Math.min(left, W - 60 - 700));
      const top = 291; // as in the design
      modal.style.left = left + 'px';
      modal.style.top = top + 'px';
      sparkleEdge(it, 60, { vy: rand(-200, -80) });
    }
    modal.hidden = false;
    requestAnimationFrame(() => body.classList.add('is-modal'));
    modal.querySelector('.modal__close').focus({ preventScroll: true });
    softChime(it, true);
  }

  function closeModal() {
    if (!openItem) return;
    body.classList.remove('is-modal');
    openItem = null;
    setTimeout(() => { if (!openItem) { modal.hidden = true; focusHost.innerHTML = ''; } }, 450);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
    litTimer = .6;
  }

  modal.querySelector('.modal__close').addEventListener('click', closeModal);
  modal.querySelector('.modal__arrow--prev').addEventListener('click', () => showSlide(slideIdx - 1));
  modal.querySelector('.modal__arrow--next').addEventListener('click', () => showSlide(slideIdx + 1));
  dim.addEventListener('click', closeModal);
  window.addEventListener('keydown', e => {
    if (!openItem) return;
    if (e.key === 'Escape') { e.stopImmediatePropagation(); closeModal(); }
    if (e.key === 'ArrowLeft') showSlide(slideIdx - 1);
    if (e.key === 'ArrowRight') showSlide(slideIdx + 1);
    if (e.key === 'Tab') { // keep focus inside the window
      const f = [...modal.querySelectorAll('button:not([hidden] *)')].filter(b => b.offsetParent);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }, true);

  function softChime(it, strong) {
    if (!musicOn || !ensureAudio()) return;
    const t = audio.currentTime;
    const base = [NOTE.C6, NOTE.E5 * 2, NOTE.G5 * 2, NOTE.A5 * 2, NOTE.C6 * 1.5, NOTE.D5 * 2][ITEMS.indexOf(it) % 6];
    bell(base, t, 1.2, strong ? .32 : .16);
    if (strong) bell(base * 1.5, t + .08, 1.4, .2);
  }

  // ---------------------------------------------------------------- sets
  const tabs = [...document.querySelectorAll('.tab')];
  const setHours = document.getElementById('set-hours');
  const setDesc = document.getElementById('set-desc');
  const setPrice = document.getElementById('set-price');
  const setCta = document.getElementById('set-cta');
  function swap(el, text) {
    el.textContent = text;
    el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
  }
  function selectSet(key) {
    const d = SETS[key];
    tabs.forEach(t => { const on = t.dataset.set === key; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); });
    swap(setHours, d.hours);
    swap(setDesc, d.desc);
    swap(setPrice, d.price);
    swap(setCta, 'Хочу набор ' + key);
    if (!mobile) {
      for (let i = 0; i < 26; i++) mote(rand(1469, 1700), rand(960, 1030), { vy: rand(-160, -40), vx: rand(-60, 60) });
    }
  }
  tabs.forEach(t => t.addEventListener('click', () => selectSet(t.dataset.set)));

  // ---------------------------------------------------------------- scroll morph
  const s1 = document.getElementById('s1');
  const s2 = document.getElementById('s2');
  const q = sel => layer.querySelector(sel);
  const frameEl = scene.querySelector('.frame');
  const cropEl = scene.querySelector('.open-crop');
  // screen-1 element → the screen-2 element it turns into
  const PAIRS = [
    [q('.logo'), q('.hint')],
    [q('.stock'), q('.chip')],
    [q('.title'), q('.title2')],
    [q('.offer__text'), q('.tabsbar')],
    [q('.offer__text'), q('.desc')],
    [q('.offer__actions'), q('.buy')],
  ];
  const S1_ELS = [...new Set(PAIRS.map(p => p[0]))];
  const S2_ELS = [q('.hint'), q('.title2'), q('.panel'), q('.tabsbar'), q('.fade-bottom')];
  let geo = null, p = 0, lastP = 0, morphReady = false;

  const centre = el => {
    const r = el.getBoundingClientRect();
    return [(r.left + r.width / 2 - tx) / s, (r.top + r.height / 2 - ty) / s, r.width / s, r.height / s];
  };
  function measure() {
    if (mobile) { geo = null; return; }
    [...S1_ELS, ...PAIRS.map(p => p[1]), ...S2_ELS].forEach(el => { el.style.translate = ''; });
    S1_ELS.forEach(el => { el.style.opacity = ''; el.dataset.o = parseFloat(getComputedStyle(el).opacity) || 1; });
    geo = PAIRS.map(([a, b]) => { const A = centre(a), B = centre(b); return { a, b, dx: B[0] - A[0], dy: B[1] - A[1], A, B }; });
    morphReady = true;
    applyMorph(true);
  }
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  function applyMorph(force) {
    if (!geo || mobile) return;
    const a = smooth(0, .55, p);      // screen 1 leaving
    const b = smooth(.45, 1, p);      // screen 2 arriving
    body.style.setProperty('--p', p.toFixed(4));
    const bo = smooth(0, 1, p);
    body.style.setProperty('--bo', bo.toFixed(4));
    off.x = BOX_SHIFT.x * bo; off.y = BOX_SHIFT.y * bo;
    layer.style.setProperty('--sp', smooth(.15, .85, p).toFixed(4));
    if (body.classList.contains('is-done') || force) {
      const seen = new Set();
      geo.forEach(g => {
        if (!seen.has(g.a)) {
          seen.add(g.a);
          g.a.style.opacity = (1 - a) * g.a.dataset.o;
          g.a.style.filter = a > .001 ? `blur(${(a * 14).toFixed(1)}px)` : '';
          g.a.style.translate = `${(g.dx * a * .55).toFixed(1)}px ${(g.dy * a * .55).toFixed(1)}px`;
        }
        const k = 1 - b;
        g.b.style.translate = `${(-g.dx * k * .55).toFixed(1)}px ${(-g.dy * k * .55).toFixed(1)}px`;
      });
      S2_ELS.forEach(el => {
        el.style.opacity = b;
        el.style.filter = b < .999 ? `blur(${((1 - b) * 14).toFixed(1)}px)` : '';
      });
      frameEl.style.opacity = 1 - a;
      frameEl.style.scale = 1 + a * .03;
      frameEl.style.filter = a > .001 ? `blur(${(a * 8).toFixed(1)}px) brightness(${1 + a})` : '';
      cropEl.style.opacity = 1 - a;
    }
    const was = onSets;
    onSets = p > .5 && storyQ < .3;
    body.classList.toggle('on-sets', onSets);
    if (!onSets && was) { setHover(null); }
  }

  function morphParticles(dp) {
    if (reduced || mobile || !geo) return;
    const n = Math.min(60, Math.round(dp * 520));
    for (let i = 0; i < n; i++) {
      if (p < .6 && Math.random() < .55) {
        // the frame dissolves into sparkles
        const side = Math.random() * 4 | 0;
        const x = side < 2 ? rand(59, 1861) : (side === 2 ? 59 : 1861);
        const y = side < 2 ? (side === 0 ? 71 : 1009) : rand(71, 1009);
        mote(x, y, { vy: rand(-160, -40) });
      } else {
        const g = pick(geo);
        const [cx, cy, w, h] = p < .5 ? g.A : g.B;
        mote(cx + rand(-w / 2, w / 2), cy + rand(-h / 2, h / 2), { vy: rand(-120, -30), size: rand(2, 5) });
      }
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (mobile) return;
      updateStory();
      p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight || 1)));
      const dp = Math.abs(p - lastP);
      const nowSets = p > .5 && storyQ < .3;
      if (nowSets !== onSets) applyMorph(true);
      if (dp > 0) {
        applyMorph();
        morphParticles(dp);
        if (p > .97 && lastP <= .97) arrive();
        lastP = p;
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { if (morphReady) measure(); onScroll(); });

  // ---------------------------------------------------------------- block 3: slides
  const story = document.getElementById('story');
  const storyPin = document.getElementById('story-pin');
  const viewportEl = document.querySelector('.viewport');
  const storyTitle = story.querySelector('.story__title');
  const storySub = story.querySelector('.story__sub');
  const slides = [...story.querySelectorAll('.slide')];
  let storyQ = 0, lastQ = 0, slideR = 0, lastR = 0, lastSlideIdx = 0;
  const SLIDE_C = { x: 960, y: 470 };

  function updateStory() {
    if (mobile) { // the block is desktop-only for now
      viewportEl.style.opacity = viewportEl.style.filter = viewportEl.style.scale = viewportEl.style.visibility = '';
      storyQ = 0;
      body.classList.remove('in-story');
      return;
    }
    const vhh = window.innerHeight || 1;
    // 0 → 1 while the block rises over the set
    const top = story.getBoundingClientRect().top;
    storyQ = Math.min(1, Math.max(0, 1 - top / vhh));
    const dq = Math.abs(storyQ - lastQ);
    story.style.setProperty('--sq', storyQ.toFixed(4));
    body.classList.toggle('in-story', storyQ > .5);

    // the set dissolves into magic as the block arrives
    const k = smooth(0, .85, storyQ);
    viewportEl.style.opacity = 1 - k;
    viewportEl.style.filter = k > .001 ? `blur(${(k * 10).toFixed(1)}px)` : '';
    viewportEl.style.scale = 1 - k * .05;
    viewportEl.style.visibility = storyQ >= 1 ? 'hidden' : '';
    const hk = smooth(.35, 1, storyQ);
    storyTitle.style.opacity = storySub.style.opacity = '';
    storyTitle.style.filter = hk < .999 ? `blur(${((1 - hk) * 12).toFixed(1)}px)` : '';
    storyTitle.style.letterSpacing = `${((1 - hk) * .12).toFixed(3)}em`;
    storyTitle.style.opacity = hk;
    storySub.style.opacity = hk * .7;
    storySub.style.filter = hk < .999 ? `blur(${((1 - hk) * 8).toFixed(1)}px)` : '';
    if (dq > 0 && !reduced) {
      const n = Math.min(40, Math.round(dq * 320));
      for (let i = 0; i < n; i++) {
        if (Math.random() < .6) sparkleEdge(pick(ITEMS), 1, { vy: rand(-260, -80), max: rand(.8, 1.6) });
        else mote(rand(0, W), (top - ty) / s + rand(-40, 40), { vy: rand(-140, -40) });
      }
    }
    lastQ = storyQ;

    // slides: 0 … 2 while the pinned area scrolls
    const pt = storyPin.getBoundingClientRect().top;
    slideR = Math.min(slides.length - 1, Math.max(0, -pt / vhh));
    const dr = Math.abs(slideR - lastR);
    slides.forEach((sl, i) => {
      const img = sl.firstElementChild, cap = sl.lastElementChild;
      const fIn = Math.min(1, Math.max(0, slideR - (i - 1)));   // reveal of this slide
      const fOut = Math.min(1, Math.max(0, slideR - i));        // the next one covering it
      if (i > 0) {
        const R = smooth(0, 1, fIn) * 1700;
        const m = fIn >= 1 ? 'none' : `radial-gradient(circle at ${SLIDE_C.x}px ${SLIDE_C.y}px, #000 ${(R - 180).toFixed(0)}px, transparent ${R.toFixed(0)}px)`;
        sl.style.visibility = fIn <= 0 ? 'hidden' : '';
        sl.style.webkitMaskImage = sl.style.maskImage = m;
        img.style.scale = 1.08 - .08 * smooth(0, 1, fIn);
      }
      img.style.filter = fOut > .001 ? `blur(${(fOut * 6).toFixed(1)}px) brightness(${(1 - fOut * .35).toFixed(2)})` : '';
      if (i < slides.length - 1) img.style.scale = 1 + fOut * .06;
      const ci = i === 0 ? 1 : smooth(.55, 1, fIn);
      const co = 1 - smooth(0, .4, fOut);
      cap.style.opacity = Math.min(ci, co);
      cap.style.filter = Math.min(ci, co) < .999 ? `blur(${((1 - Math.min(ci, co)) * 8).toFixed(1)}px)` : '';
      cap.style.translate = `0 ${((1 - ci) * 20 - (1 - co) * 20).toFixed(1)}px`;
    });
    if (dr > 0 && !reduced) {
      const f = slideR % 1;
      if (f > .001 && f < .999) {
        const R = smooth(0, 1, f) * 1700 - 90;
        const n = Math.min(60, Math.round(dr * 500));
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const x = SLIDE_C.x + Math.cos(a) * R, y = SLIDE_C.y + Math.sin(a) * R;
          if (x > -20 && x < W + 20 && y > -20 && y < H + 20) mote(x, y, { vx: Math.cos(a) * rand(40, 140), vy: Math.sin(a) * rand(40, 140) - 40, size: rand(2, 5) });
        }
      }
      const idx = Math.round(slideR);
      if (idx !== lastSlideIdx && musicOn && ensureAudio()) {
        const t = audio.currentTime;
        [NOTE.G5, NOTE.C6, NOTE.E5 * 2].forEach((fq, i) => bell(fq, t + i * .07, 1.4, .18));
      }
      lastSlideIdx = idx;
    }
    lastR = slideR;
  }

  function arrive() {
    // a short wave over all items when screen 2 settles
    if (reduced) return;
    ITEMS.forEach((it, i) => setTimeout(() => sparkleEdge(it, 18, { vy: rand(-120, -40) }), i * 90));
    litTimer = 0;
  }

  document.querySelectorAll('[data-goto="sets"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    if (mobile) s2.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    else window.scrollTo({ top: window.innerHeight, behavior: reduced ? 'auto' : 'smooth' });
  }));

  // ---------------------------------------------------------------- timeline
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  function finish() {
    timers.forEach(clearTimeout);
    dustUntil = 0;
    body.classList.add('is-charging', 'is-open', 'is-frame', 'is-ui', 'is-done');
    body.classList.remove('is-intro-lock');
    document.documentElement.classList.remove('is-locked');
    twinkleOn = true;
    measure();
    updateStory();
    onScroll();
  }

  function start() {
    body.classList.remove('is-loading');
    initSnow();
    requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });

    if (reduced) { finish(); return; }

    body.classList.add('is-intro-lock');
    document.documentElement.classList.add('is-locked');
    window.scrollTo(0, 0);
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
    at(5200, finish);
  }

  skipBtn.addEventListener('click', finish);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && !body.classList.contains('is-done')) finish(); });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const imgs = [...document.querySelectorAll('.closed__img, .open--back')];
  Promise.all(imgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {})))
    .then(() => (document.fonts ? document.fonts.ready : null))
    .then(start, start);
})();
