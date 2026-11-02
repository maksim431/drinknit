(() => {
  'use strict';

  /* ===== Мобильная версия. Данные — в data.js, общие с десктопом ===== */
  const { CONFIG, SETS, FAQ, DETAILS, LAYERS, CARDS } = window.DRINKNIT;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const body = document.body;

  /* ===== Стикеры: те же вырезки из листов, что на десктопе, уменьшенные под экран =====
     [картинка, ширина, высота, поворот, img left %, top %, width %, height %, отражение по вертикали] и место на экране */
  const ST = {
    hintGoat: ['sheet-5pryb', 303.3, 334.4, -171.02, 0, 0, 283.02, 191.66, true],
    hero1: ['st-1', 206.1, 229.8, -17.65, 0, 0, 300, 200.9],
    hero2: ['st-2', 153.8, 174.8, -19.99, -67.9, 0, 305.73, 200.9],
    hero4: ['st-4', 196, 195.3, -12.1, -215.37, 0, 315.37, 236.41],
    heroGift: ['st-gift', 218.7, 218.7, 15.75, 0, 0, 100, 100],
    kidsSanta: ['sheet-ackw', 185, 200, -6.75, 0, 0, 277.14, 191.66],
    kidsGoat: ['sheet-5pryb', 467.7, 515.7, -8.98, 0, 0, 283.02, 191.66],
    kidsDeer: ['sheet-5pryb', 227.7, 254.1, 12.88, -107.33, 0, 308.48, 206.45],
    leftClock: ['st-santaclock', 372.8, 372.8, 7.04, 0, 0, 100, 100],
    leftDeer: ['sheet-ackw', 334.7, 337.8, -11.32, 0, -105.03, 277.14, 205.03],
    leftBear: ['sheet-ackw', 201.6, 204.9, 14.99, -100.7, -105.03, 279.07, 205.03],
    leftGinger: ['sheet-5pryb', 231, 277, 2.18, -106.17, -92.07, 308.48, 192.07],
    termsGoat: ['sheet-8nimtu', 371, 472, 0, 0, 0, 294.25, 231.67],
    aboutMag1: ['sheet-x79', 425, 369, -10.89, 0, 0, 230.33, 197.79],
    aboutMag2: ['sheet-x79', 364, 366, -10.29, -147.76, -99.78, 269.06, 199.78],
    aboutSnow: ['st-9', 231, 286, -2.78, -62.86, -41.17, 225.72, 182.34],
    bookTree: ['st-8', 198, 263, 18, -71.45, -41.17, 242.91, 182.34],
    bookSnow: ['st-9', 237, 294, -8, -62.86, -41.17, 225.72, 182.34],
  };
  // масштаб стикеров и их место в блоке
  const PLACE = {
    hintGoat: [.42, 'right:-6px;bottom:0'],
    kidsSanta: [.5, 'right:4%;top:9vh'],
    kidsGoat: [.36, 'left:-14px;bottom:-34px'],
    kidsDeer: [.48, 'right:6%;bottom:-20px'],
    leftClock: [.42, 'left:50%;top:26px;margin-left:-80px'],
    leftDeer: [.36, 'left:-10px;bottom:20px'],
    leftBear: [.42, 'left:-6px;top:120px'],
    leftGinger: [.42, 'right:-4px;bottom:24px'],
    termsGoat: [.36, 'right:-6px;bottom:-14px'],
    aboutMag1: [.34, 'left:-18px;top:52%'],
    aboutMag2: [.36, 'right:-14px;bottom:10px'],
    aboutSnow: [.44, 'right:4px;top:36px'],
    bookTree: [.46, 'left:0;top:12px'],
    bookSnow: [.42, 'right:0;top:10px'],
  };
  const unit = () => clamp(innerWidth / 390, 1, 1.7);
  const stickerInner = (name, k) => {
    const [src, w, h, rot, il, it, iwp, ihp, flip] = ST[name];
    return `<div class="stk-r" style="width:${w * k}px;height:${h * k}px;transform:rotate(${rot}deg)${flip ? ' scaleY(-1)' : ''}"><i><img src="assets/d/${src}.webp" alt="" style="left:${il}%;top:${it}%;width:${iwp}%;height:${ihp}%"></i></div>`;
  };
  $$('[data-st]').forEach(el => {
    const name = el.dataset.st, [k, css] = PLACE[name];
    el.style.cssText += ';' + css;
    el.innerHTML = stickerInner(name, k * unit());
  });

  /* ===== Шапка и меню ===== */
  const mh = $('#mh'), menu = $('#m-menu'), menuBtn = $('#m-menu-btn');
  const setMenu = open => {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    html.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('scroll', () => mh.classList.toggle('solid', scrollY > 40), { passive: true });

  /* ===== Частицы: золотая пыль, вспышка, конфетти — только для открытия подарка ===== */
  const fx = $('#m-fx'), ctx = fx.getContext('2d');
  const parts = [];
  let fxOn = false, flash = 0, dustUntil = 0, last = 0;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const sizeFx = () => { fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; };
  const CONF = ['#c3222f', '#e8394a', '#f6d58e', '#ffe9b0', '#ffffff', '#4fae72'];
  const giftCenter = () => { const r = $('.m-gift-wrap').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .42, w: r.width }; };
  const burst = () => {
    const c = giftCenter();
    flash = 1;
    for (let i = 0; i < 90; i++) {
      const a = rand(-Math.PI * .95, -Math.PI * .05), v = rand(260, 760);
      parts.push({ t: 'c', x: c.x + rand(-60, 60), y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rand(0, 6), vr: rand(-10, 10), w: rand(6, 11), h: rand(4, 7), col: pick(CONF), life: 0, max: rand(2, 3) });
    }
    for (let i = 0; i < 60; i++) {
      const a = rand(0, Math.PI * 2), v = rand(120, 620);
      parts.push({ t: 's', x: c.x, y: c.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0, max: rand(.8, 1.8), size: rand(2, 5) });
    }
    runFx();
  };
  const runFx = () => { if (!fxOn) { fxOn = true; last = performance.now(); requestAnimationFrame(drawFx); } };
  const drawFx = now => {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    if (now < dustUntil) {
      const c = giftCenter();
      for (let i = 0; i < 3; i++) {
        const a = rand(0, Math.PI * 2), r = rand(c.w * .45, c.w * .8);
        parts.push({ t: 'd', cx: c.x, cy: c.y, a, r0: r, r, w: rand(1.6, 2.6) * (Math.random() < .5 ? -1 : 1), life: 0, max: rand(1, 1.5), size: rand(1.5, 3.5) });
      }
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (flash > 0) {
      const c = giftCenter();
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, innerWidth * 1.4);
      g.addColorStop(0, `rgba(255,250,230,${flash})`); g.addColorStop(.35, `rgba(255,230,170,${flash * .5})`); g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, innerWidth, innerHeight);
      flash = Math.max(0, flash - dt * 1.7);
    }
    let w = 0;
    for (const p of parts) {
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) continue;
      parts[w++] = p;
      ctx.globalAlpha = 1;
      if (p.t === 'd') {
        p.a += p.w * dt; p.r = p.r0 * (1 - t) * (1 - t);
        ctx.globalAlpha = Math.sin(t * Math.PI);
        ctx.fillStyle = '#ffe2a0';
        ctx.beginPath(); ctx.arc(p.cx + Math.cos(p.a) * p.r, p.cy + Math.sin(p.a) * p.r * .7, p.size, 0, Math.PI * 2); ctx.fill();
      } else if (p.t === 's') {
        p.vx *= 1 - 2 * dt; p.vy = p.vy * (1 - 2 * dt) + 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = 1 - t; ctx.fillStyle = '#ffd98a';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      } else {
        p.vx *= 1 - 1.4 * dt; p.vy = p.vy * (1 - 1.4 * dt) + 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        ctx.globalAlpha = t > .75 ? (1 - t) / .25 : 1;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 1.7)); ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
    }
    parts.length = w;
    ctx.globalAlpha = 1;
    if (parts.length || flash > 0 || now < dustUntil) requestAnimationFrame(drawFx);
    else { ctx.clearRect(0, 0, innerWidth, innerHeight); fxOn = false; }
  };
  sizeFx();
  addEventListener('resize', sizeFx);

  /* ===== Первый экран: подарок открывается по нажатию ===== */
  const heroSt = $('#m-hero-stickers');
  [['hero1', 'left:2%;top:13%'], ['hero4', 'right:3%;top:11%'], ['hero2', 'left:1%;top:44%'], ['heroGift', 'right:1%;top:42%']].forEach(([name, css], i) => {
    const el = document.createElement('div');
    el.style.cssText = css;
    el.innerHTML = stickerInner(name, .5 * unit());
    heroSt.appendChild(el);
    el.dataset.i = i;
  });
  const aimStickers = () => {
    const c = giftCenter(), hr = $('#m-hero').getBoundingClientRect();
    $$('div', heroSt).forEach(el => {
      const i = +el.dataset.i;
      const x = el.offsetLeft + el.offsetWidth / 2, y = el.offsetTop + el.offsetHeight / 2;
      el.style.setProperty('--fx', `${c.x - hr.left - x}px`);
      el.style.setProperty('--fy', `${c.y - hr.top - y}px`);
      el.style.setProperty('--fr', `${(i % 2 ? 1 : -1) * (25 + i * 8)}deg`);
      el.style.setProperty('--fd', `${.05 + i * .08}s`);
    });
  };
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const finish = () => {
    timers.forEach(clearTimeout);
    body.classList.remove('m-waiting', 'm-intro');
    body.classList.add('is-charging', 'is-open', 'is-ui', 'is-done');
    html.classList.remove('is-locked');
    dustUntil = 0;
  };
  const openGift = () => {
    if (!body.classList.contains('m-waiting')) return;
    body.classList.remove('m-waiting');
    body.classList.add('is-charging');
    dustUntil = performance.now() + 1500;
    runFx();
    if (navigator.vibrate) navigator.vibrate(30);
    at(1600, () => { body.classList.add('is-open'); burst(); if (navigator.vibrate) navigator.vibrate([20, 40, 60]); });
    at(2400, () => body.classList.add('is-ui'));
    at(3600, finish);
  };
  $('#m-gift').addEventListener('click', openGift);
  $('#m-skip').addEventListener('click', finish);

  /* ===== Наборы: слои из макета, предметы кликабельны ===== */
  const stage = $('#m-stage');
  let current = 'L', busy = false;
  const groups = {}, ITEMS = {};
  Object.entries(LAYERS).forEach(([key, list]) => {
    const g = document.createElement('div');
    g.className = 'm-setg';
    g.dataset.set = key;
    g.hidden = key !== current;
    g.innerHTML = `<img class="base" src="assets/d/sets/${key}-base.webp" alt="Новогодний набор ${key}" loading="lazy" draggable="false">`;
    ITEMS[key] = list.map(([id, l, t, w, h], i) => {
      const b = document.createElement('span');
      b.className = 'it';
      b.style.cssText = `left:${l}%;top:${t}%;width:${w}%;height:${h}%`;
      b.innerHTML = `<img src="assets/d/sets/${key}-${id}.webp" alt="" loading="lazy" draggable="false">`;
      g.appendChild(b);
      const it = { id, key, i, box: [l, t, w, h], el: b, ...DETAILS[id] };
      const img = b.firstChild;
      const read = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const cg = c.getContext('2d', { willReadFrequently: true });
          cg.drawImage(img, 0, 0);
          it.alpha = { w: c.width, h: c.height, d: cg.getImageData(0, 0, c.width, c.height).data };
        } catch { /* без маски: попадание по рамке предмета */ }
      };
      if (img.complete && img.naturalWidth) read(); else img.addEventListener('load', read, { once: true });
      return it;
    });
    groups[key] = g;
    stage.appendChild(g);
  });
  // какой предмет под пальцем: спереди назад, по прозрачности картинки
  const hitAt = (cx, cy) => {
    const r = groups[current].getBoundingClientRect();
    const x = (cx - r.left) / r.width * 100, y = (cy - r.top) / r.height * 100;
    const list = ITEMS[current];
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i], [l, t, w, h] = it.box;
      const u = (x - l) / w, v = (y - t) / h;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const a = it.alpha;
      if (!a || a.d[(Math.floor(v * (a.h - 1)) * a.w + Math.floor(u * (a.w - 1))) * 4 + 3] > 90) return it;
    }
    // промахнулись на пару миллиметров — берём ближайший предмет
    let best = null, bd = 6;
    for (const it of list) {
      const [l, t, w, h] = it.box;
      const dx = Math.max(l - x, 0, x - l - w), dy = Math.max(t - y, 0, y - t - h), d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  };
  stage.addEventListener('click', e => { if (busy) return; const it = hitAt(e.clientX, e.clientY); if (it) openItem(it); });

  // бегущая подсветка предметов по очереди, пока блок на экране
  let stageVisible = false, litIdx = -1;
  setInterval(() => {
    if (!stageVisible || busy || !sheet.hidden || document.hidden) return;
    const list = ITEMS[current];
    list.forEach(it => it.el.classList.remove('lit'));
    litIdx = (litIdx + 1) % list.length;
    list[litIdx].el.classList.add('lit');
  }, 1100);

  const renderPanel = key => {
    const d = SETS[key];
    $$('[data-m-tab]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.mTab === key)));
    $('#m-for').textContent = d.forWhom;
    $('#m-hours').textContent = d.hours;
    $('#m-price').textContent = d.price;
    const want = $('#m-want');
    want.textContent = `Хочу набор ${key}`;
    want.dataset.text = `Здравствуйте! Хочу набор ${key}`;
  };
  const selectSet = key => {
    if (key === current || busy) return;
    busy = true;
    const from = groups[current], to = groups[key];
    ITEMS[current].forEach(it => it.el.classList.remove('lit'));
    current = key;
    renderPanel(key);
    to.hidden = false;
    to.style.zIndex = 2;
    to.classList.add('m-wave');
    setTimeout(() => {
      from.hidden = true;
      to.classList.remove('m-wave');
      to.style.zIndex = '';
      busy = false;
      litIdx = -1;
    }, reduce ? 0 : 900);
  };
  $$('[data-m-tab]').forEach(t => t.addEventListener('click', () => selectSet(t.dataset.mTab)));
  renderPanel(current);
  $$('[data-price]').forEach(el => { el.textContent = SETS[el.dataset.price].price; });
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => {
    $('#m-sets').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => selectSet(b.dataset.pick), 700);
  }));

  /* ===== Окно предмета: лист снизу ===== */
  const sheet = $('#m-sheet'), dim = $('#m-dim');
  const openItem = it => {
    const photo = $('#m-sheet-photo');
    photo.className = 'm-sheet-photo' + (it.photos.length ? '' : ' ph');
    photo.innerHTML = it.photos.length ? `<img src="${it.photos[0]}" alt="">` : '[Фото предмета]';
    $('#m-sheet-title').innerHTML = it.title;
    $('#m-sheet-text').innerHTML = it.text;
    $('#m-sheet-note').textContent = it.note;
    ITEMS[current].forEach(x => x.el.classList.toggle('on', x === it));
    sheet.hidden = dim.hidden = false;
    html.style.overflow = 'hidden';
    $('#m-sheet-close').focus();
  };
  const closeItem = () => {
    if (sheet.hidden) return;
    sheet.hidden = dim.hidden = true;
    html.style.overflow = '';
    ITEMS[current].forEach(x => x.el.classList.remove('on'));
  };
  $('#m-sheet-close').addEventListener('click', closeItem);
  dim.addEventListener('click', closeItem);
  addEventListener('keydown', e => { if (e.key === 'Escape') { closeItem(); setMenu(false); } });
  // смахнуть лист вниз
  let sy = null;
  sheet.addEventListener('touchstart', e => { sy = sheet.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
  sheet.addEventListener('touchmove', e => { if (sy !== null) { const d = Math.max(0, e.touches[0].clientY - sy); sheet.style.transform = `translateY(${d}px)`; } }, { passive: true });
  sheet.addEventListener('touchend', e => {
    if (sy === null) return;
    const d = e.changedTouches[0].clientY - sy;
    sheet.style.transform = '';
    sy = null;
    if (d > 90) closeItem();
  });

  /* ===== Блок 3: карточки листаются вбок ===== */
  const cardsEl = $('#m-cards'), dots = $$('#m-dots i');
  CARDS.forEach(c => {
    const el = document.createElement('div');
    el.className = 'm-stamp';
    el.innerHTML = `<div class="m-stamp-win"><img src="${c.src}" alt="" loading="lazy"></div><p>${c.cap}</p>`;
    cardsEl.appendChild(el);
  });
  const syncDots = () => {
    const cards = $$('.m-stamp', cardsEl), mid = cardsEl.scrollLeft + cardsEl.clientWidth / 2;
    let bi = 0, bd = Infinity;
    cards.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; bi = i; } });
    dots.forEach((d, i) => d.classList.toggle('on', i === bi));
  };
  cardsEl.addEventListener('scroll', syncDots, { passive: true });
  syncDots();

  /* ===== Видео-переход: кадры сменяются вместе с прокруткой ===== */
  const FRAMES = 145;
  const frames = new Array(FRAMES);
  const vSec = $('#m-video'), vcan = $('#m-video-canvas'), vctx = vcan.getContext('2d');
  let framesRequested = false, lastKey = -1;
  const loadFrames = () => {
    if (framesRequested) return;
    framesRequested = true;
    const order = [];
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
    if (!order.includes(FRAMES - 1)) order.splice(1, 0, FRAMES - 1);
    let next = 0;
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { frames[i] = img; lastKey = -1; drawVideo(); pump(); };
      img.onerror = pump;
      img.src = `assets/d/trans/${String(i).padStart(3, '0')}.webp`;
    };
    for (let k = 0; k < 3; k++) pump();
  };
  const drawVideo = () => {
    const r = vSec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const t = clamp(-r.top / Math.max(1, r.height - innerHeight));
    let i = Math.round(t * (FRAMES - 1));
    if (!frames[i]) {
      let d = 1;
      while (d < FRAMES && !frames[i - d] && !frames[i + d]) d++;
      i = frames[i - d] ? i - d : i + d;
      if (!frames[i]) return;
    }
    const W = Math.round(vcan.clientWidth * dpr), H = Math.round(vcan.clientHeight * dpr);
    if (vcan.width !== W || vcan.height !== H) { vcan.width = W; vcan.height = H; lastKey = -1; }
    const key = i * 1000 + Math.round(t * 999);
    if (key === lastKey) return;
    lastKey = key;
    // кадр 16:9 на вертикальном экране: заполняем по высоте, центр кадра смещается от домика к малышу
    const img = frames[i], k = Math.max(W / img.width, H / img.height), dw = img.width * k, dh = img.height * k;
    const focus = .3 + .38 * t;
    const x = clamp(W / 2 - dw * focus, W - dw, 0);
    vctx.drawImage(img, x, (H - dh) / 2, dw, dh);
  };

  /* ===== Появление элементов при прокрутке ===== */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.rv, .m-st').forEach(el => io.observe(el));
  new IntersectionObserver(([en]) => { stageVisible = en.isIntersecting; }, { threshold: .3 }).observe(stage);
  new IntersectionObserver(([en]) => { if (en.isIntersecting) loadFrames(); }, { rootMargin: '150% 0px' }).observe(vSec);
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; drawVideo(); });
  }, { passive: true });
  addEventListener('resize', () => { lastKey = -1; drawVideo(); });

  /* ===== Частые вопросы: аккордеон ===== */
  const faqList = $('#m-faq-list');
  FAQ.forEach(([q, a], i) => {
    const item = document.createElement('div');
    item.className = 'm-faq-item';
    item.innerHTML = `<button type="button" aria-expanded="false" aria-controls="m-faq-a${i}" id="m-faq-q${i}"></button><div class="m-faq-a" id="m-faq-a${i}" role="region" aria-labelledby="m-faq-q${i}"><div><p></p></div></div>`;
    item.querySelector('button').textContent = q;
    item.querySelector('p').textContent = a;
    item.querySelector('button').addEventListener('click', () => {
      const open = !item.classList.contains('open');
      $$('.m-faq-item.open', faqList).forEach(x => { x.classList.remove('open'); x.querySelector('button').setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', open);
      item.querySelector('button').setAttribute('aria-expanded', String(open));
    });
    faqList.appendChild(item);
  });

  /* ===== Таймер ===== */
  const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
  const tick = () => {
    let ms = Math.max(0, new Date(CONFIG.deadline) - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const sec = Math.floor(ms / 1e3);
    $('#m-days').textContent = `${d} ${plural(d, ['день', 'дня', 'дней'])},`;
    $('#m-hms').textContent = `${h} ${plural(h, ['час', 'часа', 'часов'])}, ${m} ${plural(m, ['минута', 'минуты', 'минут'])}, ${sec} ${plural(sec, ['секунда', 'секунды', 'секунд'])}`;
  };
  tick();
  setInterval(tick, 1000);
  $$('[data-free]').forEach(el => { el.textContent = CONFIG.free; });
  $$('[data-total]').forEach(el => { el.textContent = CONFIG.total; });

  /* ===== Ссылки на мессенджеры ===== */
  const toastEl = $('#toast');
  let toastT;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), 2600);
  };
  const NAMES = { telegram: 'Telegram', vk: 'ВК', max: 'MAX', vkGroup: 'группу ВК' };
  $$('[data-msg]').forEach(a => a.addEventListener('click', e => {
    const url = CONFIG.links[a.dataset.msg];
    e.preventDefault();
    if (!url) { toast(`Ссылка на ${NAMES[a.dataset.msg]} появится позже`); return; }
    const text = a.dataset.text;
    open(text && a.dataset.msg === 'telegram' ? `${url}?text=${encodeURIComponent(text)}` : url, '_blank', 'noopener');
  }));

  /* ===== Фоновая музыка, как на десктопе: Winter Time по кругу, приглушение 40 %, громкость 10 % ===== */
  const MUSIC = { src: 'assets/audio/winter-time.mp3', muffle: .4, volume: .1 };
  const sounds = $$('.js-sound');
  let soundOn = true, actx = null, mgain = null, msrc = null, mbuf = null;
  const syncSound = () => sounds.forEach(b => {
    b.setAttribute('aria-pressed', String(soundOn));
    b.setAttribute('aria-label', soundOn ? 'Музыка играет' : 'Музыка выключена');
  });
  const setupAudio = () => {
    if (actx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    actx = new AC();
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 20000 * Math.pow(600 / 20000, MUSIC.muffle);
    lp.Q.value = .7;
    mgain = actx.createGain();
    mgain.gain.value = 0;
    lp.connect(mgain).connect(actx.destination);
    mgain.lp = lp;
    fetch(MUSIC.src).then(r => r.arrayBuffer())
      .then(b => new Promise((ok, no) => actx.decodeAudioData(b, ok, no)))
      .then(buf => { mbuf = buf; if (soundOn) playMusic(); })
      .catch(() => {});
    return true;
  };
  const playMusic = () => {
    if (!actx) return;
    if (actx.state === 'suspended') actx.resume();
    if (!mbuf) return;
    if (!msrc) {
      msrc = actx.createBufferSource();
      msrc.buffer = mbuf;
      msrc.loop = true;
      msrc.connect(mgain.lp);
      msrc.start();
    }
    const t = actx.currentTime;
    mgain.gain.cancelScheduledValues(t);
    mgain.gain.setValueAtTime(mgain.gain.value, t);
    mgain.gain.linearRampToValueAtTime(MUSIC.volume, t + 1.2);
  };
  const pauseMusic = () => {
    if (!actx) return;
    const t = actx.currentTime;
    mgain.gain.cancelScheduledValues(t);
    mgain.gain.setValueAtTime(mgain.gain.value, t);
    mgain.gain.linearRampToValueAtTime(0, t + .4);
  };
  syncSound();
  const KICK = ['pointerdown', 'touchstart', 'keydown'];
  const kick = e => {
    if (e.target.closest && e.target.closest('.js-sound')) return;
    KICK.forEach(ev => removeEventListener(ev, kick, true));
    if (soundOn && setupAudio()) playMusic();
  };
  KICK.forEach(ev => addEventListener(ev, kick, true));
  if (soundOn && setupAudio()) actx.resume().then(() => { if (actx.state === 'running') KICK.forEach(ev => removeEventListener(ev, kick, true)); }).catch(() => {});
  sounds.forEach(btn => btn.addEventListener('click', () => {
    soundOn = !soundOn;
    syncSound();
    if (soundOn) { KICK.forEach(ev => removeEventListener(ev, kick, true)); if (setupAudio()) playMusic(); }
    else pauseMusic();
  }));
  document.addEventListener('visibilitychange', () => {
    if (!actx) return;
    if (document.hidden) actx.suspend(); else if (soundOn) actx.resume();
  });

  /* ===== Старт ===== */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  if (reduce) finish();
  else {
    html.classList.add('is-locked');
    body.classList.add('m-intro', 'm-waiting');
    requestAnimationFrame(aimStickers);
    addEventListener('resize', aimStickers);
  }
})();
