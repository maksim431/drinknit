(() => {
  'use strict';

  /* ===== Настройки: заменить заглушки на реальные данные ===== */
  const CONFIG = {
    free: 10,                // сколько наборов осталось
    total: 10,
    deadline: '2026-12-25T23:59:59+03:00', // последний день приёма заказов
    links: {                 // ссылки на мессенджеры, пока не заданы
      telegram: '',          // например: 'https://t.me/username'
      vk: '',                // например: 'https://vk.me/username'
      max: '',
      vkGroup: '',
    },
  };

  const SETS = {
    S: { price: 900, img: 'assets/d/set-S.webp', forWhom: 'Небольшой подарок учителю, воспитателю или коллеге', hours: '4 часа вязания', small: true },
    M: { price: 1700, img: 'assets/d/set-M.webp', forWhom: 'Подарок другу или родным: больше игрушек и открытка вашим текстом', hours: '11 часов вязания' },
    L: { price: 2400, img: 'assets/d/hero-product.webp', forWhom: 'Большой набор для самых близких, с козликом', hours: '11 часов вязания' },
  };

  // Тексты предметов: «Зелёный воришка» из макета, остальные черновики с прошлой версии сайта
  const NOTE_HAND = 'Каждая игрушка может немного отличаться от фото, потому что связана вручную.';
  const DETAILS = {
    grinch: { title: 'Игрушка<br>«Зелёный воришка»', text: 'Связано мной за 7 часов.<br>Размер: 14 см.<br>Состав: хлопок и акрил, мелкие детали на безопасном креплении.', note: NOTE_HAND, photos: ['assets/items/grinch-photo.webp'] },
    lamb: { title: 'Игрушка<br>«Барашек»', text: 'Связан мной вручную.<br>Мягкий, с красным шарфиком.', note: NOTE_HAND, photos: [] },
    mitten: { title: 'Варежка-подвеска<br>на ёлку', text: 'Связана мной вручную.<br>Можно повесить на ёлку или положить в неё сладость.', note: NOTE_HAND, photos: [] },
    goat: { title: 'Игрушка<br>«Белый козлик»', text: 'Мягкий козлик с красным шарфом.<br>Готовая игрушка, я подобрала её к набору.', note: '', photos: [] },
    cream: { title: 'Крем для рук', text: 'Приятный зимний уход в дополнение к игрушкам.', note: '', photos: [] },
    card: { title: 'Открытка<br>с вашим текстом', text: 'Подпишу открытку от руки: пришлите текст, когда будете заказывать набор.', note: '', photos: [] },
  };

  // Набор L: предметы вырезаны по контуру (assets/items), координаты на картинке коробки 2352×1757 со сдвигом −229, −516
  const BOX = { x: -229, y: -516, w: 2352, h: 1757 };
  const cut = (id, nw, nh, x, y, w, h) => ({ id, cut: { nw, nh }, box: [(x - BOX.x) / BOX.w * 100, (y - BOX.y) / BOX.h * 100, w / BOX.w * 100, h / BOX.h * 100] });
  // M и S: предметы отмечены овалами, позиции в процентах от картинки набора
  const oval = (id, l, t, w, h) => ({ id, box: [l, t, w, h] });

  // порядок спереди назад: так определяется, по какому предмету кликнули
  const ITEMS = {
    L: [
      cut('lamb', 165, 228, 864.7, 454.7, 161.7, 223.5),
      cut('mitten', 202, 278, 651, 440.9, 198, 272.6),
      oval('cream', 54.2, 58.0, 10.4, 11.7), // в новом макете другой крем, вырезки для него нет
      cut('goat', 437, 346, 577.5, 198.8, 428.3, 339.2),
      cut('grinch', 333, 429, 1008.7, 121.3, 326.3, 420.6),
      cut('card', 296, 352, 818.6, 23.3, 290.1, 345.1),
    ],
    M: [
      oval('cream', 48.3, 53.0, 10.0, 16.7),
      oval('mitten', 54.2, 55.8, 11.7, 14.5),
      oval('lamb', 58.3, 45.8, 8.3, 12.3),
      oval('grinch', 35.4, 41.9, 14.6, 27.9),
      oval('card', 49.6, 30.7, 14.2, 22.3),
    ],
    S: [
      oval('lamb', 37.1, 53.6, 11.7, 23.4),
      oval('mitten', 45.8, 52.5, 14.6, 26.2),
      oval('cream', 58.3, 43.0, 8.8, 33.5),
      oval('card', 40.4, 25.1, 19.6, 29.6),
    ],
  };
  Object.values(ITEMS).flat().forEach(it => Object.assign(it, DETAILS[it.id]));

  // альфа-маски вырезанных предметов: клик и наведение точно по контуру
  const ALPHA = {};
  ITEMS.L.filter(it => it.cut).forEach(it => {
    const img = new Image();
    img.src = `assets/items/${it.id}.webp`;
    img.decode().then(() => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      ALPHA[it.id] = { w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data };
    }).catch(() => {});
  });
  // x, y — доли от картинки набора (0…1)
  const hitItem = (key, x, y) => ITEMS[key].find(it => {
    const [l, t, w, h] = it.box;
    const u = (x * 100 - l) / w, v = (y * 100 - t) / h;
    if (u < 0 || u > 1 || v < 0 || v > 1) return false;
    if (!it.cut) return (u - .5) ** 2 + (v - .5) ** 2 <= .25;
    const a = ALPHA[it.id];
    if (!a) return true;
    return a.d[(Math.floor(v * (a.h - 1)) * a.w + Math.floor(u * (a.w - 1))) * 4 + 3] > 100;
  });

  const CARDS = [
    { src: 'assets/d/card-gingerbread.webp', w: 1393.988, h: 645.189, dx: -0.09, dy: -0.17,
      cap: 'Каждую деталь вяжу крючком сама, потом сшиваю и набиваю игрушку вручную.' },
    { src: 'assets/d/card-wash.webp', w: 347, h: 465, dx: -0.44, dy: -0.09,
      cap: 'Пряжа: хлопок и акрил.<br>Игрушки мягкие и после стирки держат форму.' },
    { src: 'assets/d/card-scales.webp', w: 459, h: 643, dx: -10.44, dy: -11.09,
      cap: 'Одна вязаная игрушка в сетевом магазине стоит около 1 600 ₽.<br>В наборе «M» их три.' },
  ];

  // Стикеры: [картинка, left, top, w, h, ширина, высота, поворот, img left%, top%, w%, h%, глубина параллакса, тень]
  const STICKERS = {
    hero: [
      ['st-5', -20, 734, 330.38, 345.929, 273.205, 293.68, 12.52, -147.43, -40.89, 268.46, 186.47, 30],
      ['st-4', 1602.94, 149, 232.594, 232, 196.026, 195.253, -12.1, -215.37, 0, 315.37, 236.41, 22],
      ['st-3', 1622.94, 823, 239.152, 239.188, 169.632, 168.742, 46.63, -139.9, 0, 314.96, 236.41, 34],
      ['st-2', 319.9, 609, 204.302, 216.841, 153.826, 174.793, -19.99, -67.9, 0, 305.73, 200.9, 18],
      ['st-1', 91, 240, 266.09, 281.492, 206.117, 229.82, -17.65, 0, 0, 300, 200.9, 26],
      ['st-gift', 1448.98, 467, 269.796, 269.796, 218.656, 218.656, 15.75, 0, 0, 100, 100, 20],
    ],
    kids: [
      ['sheet-ackw', 1488.85, 218.57, 207.227, 220.359, 185, 200, -6.75, 0, 0, 277.14, 191.66, 24],
      ['sheet-5pryb', 75, 631, 542.483, 582.393, 467.731, 515.717, -8.98, 0, 0, 283.02, 191.66, 18],
      ['sheet-5pryb', 1062.98, 782, 278.627, 298.438, 227.73, 254.074, 12.88, -107.33, 0, 308.48, 206.45, 30],
    ],
    left: [
      ['st-santaclock', 773.92, 58, 415.717, 415.717, 372.835, 372.835, 7.04, 0, 0, 100, 100, 0],
      ['sheet-ackw', 200, 683, 394.445, 396.87, 334.671, 337.763, -11.32, 0, -105.03, 277.14, 205.03, 0],
      ['sheet-ackw', 60, 427, 247.77, 250.092, 201.63, 204.912, 14.99, -100.7, -105.03, 279.07, 205.03, 0],
      ['sheet-ackw', 221, 82, 412.159, 437.183, 339.858, 372.733, -12.44, -201.51, 0, 301.51, 205.27, 0],
      ['sheet-5pryb', 1329.04, 142, 268.851, 269.676, 214.591, 215.843, 17.21, 0, -107.89, 280.05, 207.89, 0],
      ['sheet-5pryb', 1367.04, 751, 241.388, 285.602, 231, 277, 2.18, -106.17, -92.07, 308.48, 192.07, 0],
      ['sheet-k4', 1539.94, 332, 338, 390, 338, 390, 0, -245.82, -123.72, 345.82, 223.72, 0],
    ],
    terms: [
      ['sheet-8nimtu', 116, 700, 371, 472, 371, 472, 0, 0, 0, 294.25, 231.67, 26],
    ],
    about: [
      ['sheet-x79', 97, 116, 487.045, 442.63, 425, 369, -10.89, 0, 0, 230.33, 197.79, 22],
      ['st-11', 39.95, 116.89, 268.331, 298.588, 213.501, 254.872, 13.86, -71.45, -51.74, 242.91, 203.48, 32],
      ['sheet-x79', 144, 715, 320, 292, 320, 292, 0, -23.92, -102.03, 246.41, 202.03, 18],
      ['sheet-x79', 1326.04, 132, 392.379, 367.856, 316.757, 275.414, 20.2, -117.37, 0, 230.33, 197.79, 24],
      ['sheet-x79', 1271.08, 582, 423.501, 425.112, 364, 366, -10.29, -147.76, -99.78, 269.06, 199.78, 16],
      ['sheet-cdp', 1539.94, 698, 201, 282, 201, 282, 0, 0, 0, 266.32, 189.81, 28],
      ['st-9', 1640.94, 352.05, 244.612, 296.848, 231.036, 285.997, -2.78, -62.86, -41.17, 225.72, 182.34, 34],
      ['st-10', 298.38, 576.36, 273.854, 293.352, 233, 257, 9.94, -62.14, -51.74, 224.28, 203.48, 26],
    ],
    book: [
      ['st-8', 24, 0, 298.913, 325.397, 198, 263, 28.26, -71.45, -41.17, 242.91, 182.34, 24, false],
      ['sheet-8nimtu', 24, 570, 446.26, 493.109, 341.117, 411.554, -16.95, -102.06, -2.44, 302.06, 250.37, 30, false],
      ['st-9', 1626.94, 42, 285.861, 331.721, 237, 294, 10.33, -62.86, -41.17, 225.72, 182.34, 20, false],
      ['sheet-ackw', 1546.94, 626, 313, 343, 313, 343, 0, -201.51, 0, 301.51, 205.27, 28, false],
    ],
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Стикеры ===== */
  for (const [set, list] of Object.entries(STICKERS)) {
    const host = $(`.stickers[data-set="${set}"]`);
    list.forEach(([src, l, t, w, h, iw, ih, rot, il, it, iwp, ihp, d, shadow = true], i) => {
      const el = document.createElement('div');
      el.className = 'stk pop';
      el.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px;--d:${(set === 'hero' ? .5 : .55) + i * .09}s`;
      if (d) el.dataset.d = d;
      el.innerHTML = `<div class="stk-r${shadow ? '' : ' ns'}" style="width:${iw}px;height:${ih}px;transform:rotate(${rot}deg)"><i><img src="assets/d/${src}.webp" alt="" style="left:${il}%;top:${it}%;width:${iwp}%;height:${ihp}%"></i></div>`;
      host.appendChild(el);
    });
  }

  /* ===== Экран стоит на месте: сцена вписана в окно ===== */
  const html = document.documentElement;
  const body = document.body;
  const vp = $('#vp');
  const header = $('#header');
  const fx = $('#fx');
  const ctx = fx.getContext('2d');
  let s = 1, tx = 0, ty = 0, cdpr = 1;
  const resize = () => {
    const vw = innerWidth, vh = innerHeight;
    s = Math.min(vw / 1920, vh / 1080);
    tx = (vw - 1920 * s) / 2;
    ty = (vh - 1080 * s) / 2;
    vp.style.setProperty('--s', s);
    vp.style.setProperty('--tx', `${tx}px`);
    vp.style.setProperty('--ty', `${ty}px`);
    cdpr = Math.min(devicePixelRatio || 1, 1.25);
    fx.width = Math.round(vw * cdpr);
    fx.height = Math.round(vh * cdpr);
  };

  /* ===== Частицы «новогоднего волшебства» (движок с прошлой версии сайта), координаты сцены 1920 × 1080 ===== */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const MOUTH = { x: 960, y: 380 };     // откуда вырывается волшебство при открытии
  const BOXC = { x: 960, y: 470 };
  const parts = [];
  const MAX_PARTS = 420;
  let flash = 0, ring = null, dustUntil = 0, twinkleOn = false, twinkleAcc = 0;
  const GOLD = ['255,226,150', '255,244,214', '255,200,120'];
  const CONFETTI = ['#c3222f', '#e8394a', '#f6d58e', '#ffe9b0', '#e1d2b2', '#ffffff', '#4fae72'];

  const mote = (x, y, o = {}) => {
    if (reduce || parts.length >= MAX_PARTS) return;
    parts.push(Object.assign({ type: 'mote', x, y, vx: rand(-40, 40), vy: rand(-90, -20), size: rand(2, 4.5),
      life: 0, max: rand(.7, 1.5), star: Math.random() < .3, hue: pick(GOLD) }, o));
  };
  // искры из точки
  const burst = (x, y, n = 60, spread = 1) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(60, 320) * spread;
      mote(x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, size: rand(2, 5), max: rand(.8, 1.8) });
    }
  };
  // искры по площади
  const area = (x, y, w, h, n) => {
    for (let i = 0; i < n; i++) mote(x + rand(0, w), y + rand(0, h), { vy: rand(-140, -30), size: rand(2, 5) });
  };
  const spawnDust = () => {
    const a = rand(0, Math.PI * 2), r = rand(520, 900);
    parts.push({ type: 'dust', a, r, r0: r, w: rand(1.6, 2.6) * (Math.random() < .5 ? -1 : 1),
      size: rand(2.5, 6), life: 0, max: rand(1, 1.6), hue: pick(GOLD) });
  };
  const openBurst = () => {
    flash = 1;
    ring = { r: 40, life: 0 };
    for (let i = 0; i < 110; i++) {
      const a = rand(-Math.PI * .95, -Math.PI * .05) + rand(-.25, .25), v = rand(500, 1500);
      parts.push({ type: 'confetti', x: MOUTH.x + rand(-160, 160), y: MOUTH.y + rand(-30, 60), vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        rot: rand(0, 6.3), vr: rand(-12, 12), flip: rand(0, 6.3), vf: rand(6, 14), w: rand(10, 18), h: rand(6, 11),
        color: pick(CONFETTI), life: 0, max: rand(2.4, 3.6) });
    }
    for (let i = 0; i < 70; i++) {
      const a = rand(0, Math.PI * 2), v = rand(250, 1100);
      parts.push({ type: 'star', x: MOUTH.x, y: MOUTH.y + 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v * .8 - 200,
        size: rand(8, 26), life: 0, max: rand(1.2, 2.4), tw: rand(8, 16) });
    }
    for (let i = 0; i < 90; i++) {
      const a = rand(0, Math.PI * 2), v = rand(900, 2200);
      parts.push({ type: 'spark', x: MOUTH.x, y: MOUTH.y + 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: rand(.45, .9) });
    }
  };

  // заранее нарисованные спрайты: картинка дешевле градиента на каждую частицу
  const sprites = new Map();
  const sprite = (kind, color) => {
    const key = kind + color;
    let c = sprites.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(${color},${kind === 'dot' ? 1 : .9})`);
    grad.addColorStop(kind === 'dot' ? .35 : .25, `rgba(${color},${kind === 'dot' ? .45 : .25})`);
    grad.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    if (kind === 'star') {
      const sz = 40, k = sz * .16;
      g.translate(64, 64);
      g.fillStyle = '#fffaf0';
      g.beginPath();
      g.moveTo(0, -sz);
      g.quadraticCurveTo(k, -k, sz, 0); g.quadraticCurveTo(k, k, 0, sz);
      g.quadraticCurveTo(-k, k, -sz, 0); g.quadraticCurveTo(-k, -k, 0, -sz);
      g.fill();
    }
    sprites.set(key, c);
    return c;
  };
  const drawStar = (x, y, size, alpha, color) => {
    if (alpha <= .01 || size <= .2) return;
    const d = size * 3.2;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(sprite('star', color), x - d / 2, y - d / 2, d, d);
  };
  const drawDot = (x, y, r, alpha, color) => {
    if (alpha <= .01) return;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(sprite('dot', color), x - r, y - r, r * 2, r * 2);
  };

  let last = performance.now(), dirty = true;
  const drawFx = now => {
    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    if (now < dustUntil) for (let i = 0; i < 4; i++) spawnDust();
    if (twinkleOn && scene === 0) {
      twinkleAcc += dt;
      while (twinkleAcc > .45) {
        twinkleAcc -= .45;
        parts.push({ type: 'twinkle', x: rand(470, 1480), y: rand(60, 860), size: rand(7, 16), life: 0, max: rand(1, 1.8) });
      }
    }
    if (!parts.length && flash <= 0 && !ring) {
      if (dirty) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fx.width, fx.height); dirty = false; }
      return;
    }
    dirty = true;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, fx.width, fx.height);
    ctx.setTransform(cdpr * s, 0, 0, cdpr * s, cdpr * tx, cdpr * ty);

    if (flash > 0) {
      const g = ctx.createRadialGradient(MOUTH.x, MOUTH.y, 0, MOUTH.x, MOUTH.y, 1300);
      g.addColorStop(0, `rgba(255,250,230,${flash})`);
      g.addColorStop(.35, `rgba(255,230,170,${flash * .55})`);
      g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(-500, -500, 2920, 2080);
      flash = Math.max(0, flash - dt * 1.6);
    }
    if (ring) {
      ring.life += dt;
      ring.r += dt * 1700;
      const a = Math.max(0, 1 - ring.life / .8);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(255,236,190,${a * a * .35})`;
      ctx.lineWidth = 3 + 14 * a;
      ctx.beginPath();
      ctx.ellipse(MOUTH.x, MOUTH.y + 60, ring.r, ring.r * .55, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (a <= 0) ring = null;
    }

    ctx.globalCompositeOperation = 'lighter';
    let w = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) continue;
      parts[w++] = p;
      if (p.type === 'dust') {
        p.a += p.w * dt * (1 + 2 * (1 - p.r / p.r0));
        p.r = p.r0 * (1 - t) * (1 - t);
        drawDot(BOXC.x + Math.cos(p.a) * p.r, BOXC.y + Math.sin(p.a) * p.r * .7, p.size * 4, Math.sin(t * Math.PI), p.hue);
      } else if (p.type === 'spark') {
        p.vx *= 1 - 2.6 * dt; p.vy *= 1 - 2.6 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = 'rgb(255,232,170)';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .05, p.y - p.vy * .05); ctx.stroke();
      } else if (p.type === 'star') {
        p.vx *= 1 - 1.8 * dt; p.vy = p.vy * (1 - 1.8 * dt) + 140 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        drawStar(p.x, p.y, p.size * (1 - t * .5), (1 - t) * (.6 + .4 * Math.sin(p.life * p.tw)), '255,214,120');
      } else if (p.type === 'mote') {
        p.vx *= 1 - 1.2 * dt; p.vy = p.vy * (1 - 1.2 * dt) - 30 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const a = Math.sin(t * Math.PI);
        if (p.star) drawStar(p.x, p.y, p.size * 2.6 * (.5 + .5 * a), a * .9, p.hue);
        else drawDot(p.x, p.y, p.size * 3, a, p.hue);
      } else if (p.type === 'twinkle') {
        const a = Math.sin(t * Math.PI);
        drawStar(p.x, p.y, p.size * (.4 + .6 * a), a * .85, '255,225,160');
      }
    }
    parts.length = w;
    ctx.globalCompositeOperation = 'source-over';
    // конфетти без сложения цветов, чтобы цвета оставались честными
    for (const p of parts) {
      if (p.type !== 'confetti') continue;
      const t = p.life / p.max;
      p.vx *= 1 - 1.4 * dt; p.vy = p.vy * (1 - 1.4 * dt) + 520 * dt;
      p.x += p.vx * dt + Math.sin(p.life * 3 + p.flip) * 40 * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt; p.flip += p.vf * dt;
      const c = Math.cos(p.rot), sn = Math.sin(p.rot), f = Math.cos(p.flip);
      ctx.setTransform(cdpr * s * c, cdpr * s * sn, -cdpr * s * sn * f, cdpr * s * c * f, cdpr * (tx + p.x * s), cdpr * (ty + p.y * s));
      ctx.globalAlpha = t > .75 ? (1 - t) / .25 : 1;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.globalAlpha = 1;
  };

  /* ===== Наборы ===== */
  const product = $('#product');
  const prodInner = $('.prod-inner', product);
  const prodImg = $('.prod-img', product);
  const hots = $('.hots', product);
  const b2 = $('#sets');
  let current = 'L';

  // предмет: вырезка по контуру со свечением (набор L) или овал (M, S)
  const itemEl = (it, i, tag = 'button') => {
    const [l, t, w, h] = it.box;
    const el = document.createElement(tag);
    el.style.cssText = `left:${l}%;top:${t}%;width:${w}%;height:${h}%;--i:${i}`;
    if (it.cut) {
      const P = 48, { nw, nh } = it.cut;
      el.className = 'item';
      el.innerHTML = `<img class="halo" src="assets/items/${it.id}-halo.webp" alt="" draggable="false" style="left:${-P / nw * 100}%;top:${-P / nh * 100}%;width:${(nw + 2 * P) / nw * 100}%;height:${(nh + 2 * P) / nh * 100}%"><img class="cut" src="assets/items/${it.id}.webp" alt="" draggable="false">`;
    } else {
      el.className = 'hot';
    }
    return el;
  };

  // наборы сзади вперёд для отрисовки, спереди назад для клика
  const renderHots = key => {
    hots.innerHTML = '';
    const list = ITEMS[key];
    [...list].reverse().forEach(it => {
      const i = list.indexOf(it);
      const b = itemEl(it, list.length - 1 - i);
      b.type = 'button';
      b.dataset.i = i;
      b.setAttribute('aria-label', `Подробнее: ${it.title.replace(/<br>/g, ' ')}`);
      b.addEventListener('click', e => { if (e.detail === 0) openItem(key, i); }); // клавиатура
      hots.appendChild(b);
    });
  };

  // наведение и клик по контуру предмета
  const hitAt = e => {
    const r = hots.getBoundingClientRect();
    const it = hitItem(current, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    return it ? ITEMS[current].indexOf(it) : -1;
  };
  let hoverIdx = -1;
  hots.addEventListener('mousemove', e => {
    const i = hitAt(e);
    if (i === hoverIdx) return;
    hoverIdx = i;
    $$('[data-i]', hots).forEach(b => b.classList.toggle('is-hover', Number(b.dataset.i) === i));
    hots.style.cursor = i >= 0 ? 'pointer' : '';
  });
  hots.addEventListener('mouseleave', () => {
    hoverIdx = -1;
    $$('[data-i]', hots).forEach(b => b.classList.remove('is-hover'));
  });
  hots.addEventListener('click', e => {
    const i = hitAt(e);
    if (i >= 0) openItem(current, i);
  });

  const renderPanel = key => {
    const d = SETS[key];
    $$('[data-set-tab]').forEach(t => t.setAttribute('aria-selected', String(t.dataset.setTab === key)));
    $('[data-set-for]').textContent = d.forWhom;
    $('[data-set-hours]').textContent = d.hours;
    $('[data-set-price]').textContent = d.price;
    const btn = $('[data-set-btn]');
    btn.textContent = `Хочу набор ${key}`;
    btn.dataset.text = `Здравствуйте! Хочу набор ${key}`;
  };

  const selectSet = key => {
    if (key === current) return;
    current = key;
    renderPanel(key);
    magicChime();
    // смена картинки волной + частицы
    const wave = document.createElement('img');
    wave.className = 'prod-wave';
    wave.src = SETS[key].img;
    wave.alt = '';
    prodInner.appendChild(wave);
    prodInner.classList.toggle('small', !!SETS[key].small);
    hots.style.opacity = '0';
    burst(1016, 560, 90, 1.3);
    area(600, 250, 830, 700, 70);
    setTimeout(() => {
      prodImg.src = SETS[key].img;
      prodImg.alt = `Новогодний набор ${key}`;
      wave.remove();
      renderHots(key);
      hots.style.opacity = '';
    }, reduce ? 0 : 900);
  };

  $$('[data-set-tab]').forEach(t => t.addEventListener('click', () => selectSet(t.dataset.setTab)));
  $$('[data-price]').forEach(el => { el.textContent = SETS[el.dataset.price].price; });
  $$('[data-set-pick]').forEach(el => el.addEventListener('click', () => {
    const k = el.dataset.setPick;
    goTo('#sets');
    setTimeout(() => selectSet(k), 500);
  }));

  /* ===== Модальное окно предмета ===== */
  const modal = $('#modal');
  const dim = $('#dim');
  let focusClone = null;
  let photoIdx = 0;
  let openData = null;

  const renderPhoto = () => {
    const box = $('#modal-img');
    const photos = openData.photos;
    box.innerHTML = photos.length
      ? `<img src="${photos[photoIdx]}" alt="">`
      : '<div class="ph">[Фото предмета]</div>';
    $('.modal-arrows').classList.toggle('single', photos.length < 2);
  };

  const openItem = (key, i) => {
    openData = ITEMS[key][i];
    photoIdx = 0;
    $('#modal-title').innerHTML = openData.title;
    $('#modal-text').innerHTML = openData.text;
    const note = $('#modal-note');
    note.textContent = openData.note;
    note.hidden = !openData.note;
    renderPhoto();
    ding(i);
    // выбранный предмет остаётся подсвеченным поверх затемнения
    focusClone = product.cloneNode(true);
    focusClone.id = 'focus';
    focusClone.querySelectorAll('.prod-wave').forEach(n => n.remove());
    const [l, t, w, h] = openData.box;
    const img = focusClone.querySelector('.prod-img');
    if (openData.cut) img.style.opacity = '0';
    else img.style.clipPath = `ellipse(${w / 2 + 1}% ${h / 2 + 1}% at ${l + w / 2}% ${t + h / 2}%)`;
    const fh = focusClone.querySelector('.hots');
    fh.innerHTML = '';
    fh.style.opacity = '1';
    const one = itemEl(openData, 0, 'span');
    one.classList.add('is-focus');
    fh.appendChild(one);
    $('#stage').appendChild(focusClone);
    dim.classList.add('on');
    modal.hidden = false;
    $('#modal-close').focus();
  };

  const closeItem = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    dim.classList.remove('on');
    focusClone?.remove();
    focusClone = null;
  };
  $('#modal-close').addEventListener('click', closeItem);
  dim.addEventListener('click', closeItem);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeItem(); });
  $$('[data-photo]').forEach(b => b.addEventListener('click', () => {
    const n = openData.photos.length;
    if (n < 2) return;
    photoIdx = (photoIdx + Number(b.dataset.photo) + n) % n;
    renderPhoto();
  }));

  /* ===== Карточка с переворотом (блок 3) ===== */
  const flip = $('#flip');
  const flipImg = $('#flip-img');
  const flipCap = $('#flip-cap');
  let cardIdx = -1;
  let flipBusy = false;
  let cardWanted = 0;
  const setCard = i => {
    const c = CARDS[i];
    flipImg.src = c.src;
    flipImg.style.cssText = `width:${c.w}px;height:${c.h}px;transform:translate(calc(-50% + ${c.dx}px), calc(-50% + ${c.dy}px))`;
    flipCap.innerHTML = c.cap;
    cardIdx = i;
  };
  const flipTo = i => {
    cardWanted = i;
    if (flipBusy || i === cardIdx) return;
    if (reduce) { setCard(i); return; }
    flipBusy = true;
    flip.classList.add('flip-out');
    setTimeout(() => {
      setCard(i);
      flip.classList.remove('flip-out');
      flip.classList.add('flip-in');
      setTimeout(() => {
        flip.classList.remove('flip-in');
        flipBusy = false;
        if (cardWanted !== cardIdx) flipTo(cardWanted);
      }, 330);
    }, 280);
  };
  setCard(0);

  /* ===== Таймер ===== */
  const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
  const tick = () => {
    let ms = Math.max(0, new Date(CONFIG.deadline) - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4);
    $('#t-days').textContent = `${d} ${plural(d, ['день', 'дня', 'дней'])},`;
    $('#t-hm').textContent = `${h} ${plural(h, ['час', 'часа', 'часов'])}, ${m} ${plural(m, ['минута', 'минуты', 'минут'])}`;
  };
  tick();
  setInterval(tick, 15000);
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
    const full = text && a.dataset.msg === 'telegram' ? `${url}?text=${encodeURIComponent(text)}` : url;
    open(full, '_blank', 'noopener');
  }));

  /* ===== Музыкальная шкатулка (с прошлой версии сайта) ===== */
  const sound = $('#sound');
  let audio = null, musicOn = false, loopTimer = null;
  const NOTE = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, C6: 1046.5 };
  // «Jingle Bells», общественное достояние
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
  const ensureAudio = () => {
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
  };
  const bell = (freq, at, len = 1.2, vol = .5) => {
    [[1, 1], [2.01, .35], [3.98, .12]].forEach(([m, v]) => {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = 'sine';
      o.frequency.value = freq * m;
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(vol * v, at + .006);
      g.gain.exponentialRampToValueAtTime(.0001, at + len / m);
      o.connect(g).connect(audio.master);
      o.start(at);
      o.stop(at + len + .05);
    });
  };
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
  function ding(i) {
    if (!musicOn || !ensureAudio()) return;
    bell([NOTE.C6, NOTE.E5 * 2, NOTE.G5 * 2, NOTE.A5 * 2, NOTE.C6 * 1.5, NOTE.D5 * 2][i % 6], audio.currentTime, 1.4, .35);
  }
  sound.addEventListener('click', () => {
    musicOn = !musicOn;
    sound.setAttribute('aria-pressed', String(musicOn));
    sound.setAttribute('aria-label', musicOn ? 'Выключить музыку' : 'Включить музыку');
    clearTimeout(loopTimer);
    if (musicOn) { magicChime(); playTune(); }
  });

  /* ===== Скролл: 10 остановок, экран стоит, сцены сменяются ===== */
  // остановка → сцена: 0 первый экран, 1 наборы, 2–4 «сколько вяжу» (три карточки), 5 для детей, 6 таймер, 7 сроки, 8 обо мне, 9 финал
  const STOP_SCENE = ['hero', 'sets', 'time', 'time', 'time', 'kids', 'left', 'terms', 'about', 'book'];
  const STOPS = { hero: 0, sets: 1, time: 2, kids: 5, left: 6, terms: 7, about: 8, book: 9 };
  const scenes = $$('.scene');
  const sceneEl = id => $(`#${id}`);
  let scene = 0;            // текущая остановка
  let sceneId = 'hero';

  const goTo = hash => {
    const id = hash.slice(1);
    if (!(id in STOPS) || html.classList.contains('is-locked')) return;
    scrollTo({ top: STOPS[id] * innerHeight, behavior: reduce ? 'auto' : 'smooth' });
  };
  $$('[data-nav]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goTo(a.getAttribute('href')); }));

  // один жест колесом или тачпадом = одна остановка, инерция тачпада не перелистывает дальше
  let wheelUntil = 0;
  const step = dir => {
    const target = clamp(Math.round(scrollY / innerHeight) + dir, 0, STOP_SCENE.length - 1);
    scrollTo({ top: target * innerHeight, behavior: reduce ? 'auto' : 'smooth' });
  };
  addEventListener('wheel', e => {
    if (e.ctrlKey) return;                         // масштаб страницы
    e.preventDefault();
    if (html.classList.contains('is-locked') || !modal.hidden) return;
    const now = performance.now();
    if (now < wheelUntil) { wheelUntil = Math.max(wheelUntil, now + 120); return; }
    if (Math.abs(e.deltaY) < 3) return;
    wheelUntil = now + 900;
    step(Math.sign(e.deltaY));
  }, { passive: false });
  addEventListener('keydown', e => {
    if (html.classList.contains('is-locked') || !modal.hidden || e.target.closest('input, textarea')) return;
    const k = e.key;
    let dir = 0;
    if (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) dir = 1;
    else if (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) dir = -1;
    else if (k === 'Home') dir = -99;
    else if (k === 'End') dir = 99;
    if (!dir) return;
    e.preventDefault();
    step(dir);
  });

  /* ===== Параллакс от мыши ===== */
  const depthEls = $$('[data-d]');
  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('mousemove', e => {
    mx = e.clientX / innerWidth * 2 - 1;
    my = e.clientY / innerHeight * 2 - 1;
  });
  const heroProdDepth = 12;   // коробка и стикеры первого экрана двигаются рассинхронно

  /* ===== Смена сцен ===== */
  const heroFadeEls = [$('.hero-ray'), $('.hero-ellipse'), $('.hero-fade'), $('.hero-content'), $('.stickers[data-set="hero"]')];
  const left = $('#left');
  const aboutSec = $('#about');
  // карточки финала вылетают из карточки Кати (центр 960, 683)
  [534.5, 960.5, 1386.5].forEach((x, i) => {
    const c = $$('.b8-card')[i];
    c.style.setProperty('--ox', `${960 - x}px`);
    c.style.setProperty('--oy', '324.5px');
    c.style.setProperty('--or', `${(i - 1) * 8}deg`);
    c.style.zIndex = i === 1 ? 2 : 1;
  });
  let b2on = false, heroBurst = false;

  // волшебство при входе сцены
  const SPARK = {
    time: () => { area(500, 120, 920, 260, 60); burst(960, 672, 70, 1.2); },
    kids: () => { area(60, 160, 820, 240, 60); burst(1100, 520, 60); },
    left: () => area(560, 300, 800, 500, 80),
    terms: () => { area(60, 60, 600, 200, 50); burst(1290, 470, 70); },
    about: () => burst(960, 683, 90, 1.3),
    book: () => { burst(960, 683, 120, 1.6); area(363, 119, 1195, 479, 80); },
  };

  const setScene = stop => {
    if (stop === scene) return;
    const prevId = sceneId;
    scene = stop;
    sceneId = STOP_SCENE[stop];
    header.classList.toggle('scrolled', stop > 0);
    if (sceneId === 'time') flipTo(stop - 2);
    if (sceneId === prevId) return;
    aboutSec.classList.toggle('leave-book', prevId === 'about' && sceneId === 'book');
    // к первому экрану возвращаемся через растворение: он лежит ниже остальных сцен
    const prevSc = sceneEl(prevId);
    if (prevSc && prevSc.classList.contains('scene') && (sceneId === 'hero' || sceneId === 'sets')) {
      prevSc.classList.add('leave-fade');
      setTimeout(() => prevSc.classList.remove('leave-fade'), 800);
    }
    scenes.forEach(sc => {
      if (sc === left) return;   // таймер управляется скроллом напрямую
      sc.classList.toggle('is-on', sc.id === sceneId);
    });
    // карточка Кати остаётся на месте, пока из неё вылетают карточки наборов
    if (prevId === 'about' && sceneId === 'book') {
      aboutSec.classList.add('is-on');
      setTimeout(() => { if (sceneId === 'book') aboutSec.classList.remove('is-on'); }, 700);
    }
    if (sceneId !== 'sets' && sceneId !== 'hero') closeItem();
    SPARK[sceneId]?.();
    ding(stop);
  };

  const update = () => {
    const P = scrollY / (innerHeight || 1);          // 0…9: позиция в остановках
    setScene(Math.round(P));

    // 1 → 2: продукт едет из первого экрана во второй, элементы растворяются и появляются
    const grpA = P < 1.5;
    body.classList.toggle('grp-a', grpA);
    const p = clamp(P);
    const k = 1.1834 + (1 - 1.1834) * p;
    const dx = -59.47 * (1 - p) + cx * heroProdDepth * (1 - p);
    const dy = -251.5 * (1 - p) + cy * heroProdDepth * (1 - p);
    product.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
    if (focusClone) focusClone.style.transform = product.style.transform;
    const fade = clamp(1 - p * 2.6);
    heroFadeEls.forEach(el => { el.style.opacity = fade; });
    if (p > .12 && !heroBurst) { heroBurst = true; area(300, 200, 1320, 800, 120); }
    if (p < .05) heroBurst = false;
    if (p >= .9 && !b2on) {
      b2on = true;
      b2.classList.add('b2-on');
      product.classList.add('b2-on');
      area(60, 120, 1800, 900, 160);
    } else if (p < .75 && b2on) {
      b2on = false;
      b2.classList.remove('b2-on');
      product.classList.remove('b2-on');
      closeItem();
    }

    // 5 ↔ 6 ↔ 7: жёсткий параллакс — объекты таймера стоят, рамка наезжает снизу и уезжает вверх
    const ct = clamp(6 - P) * 100;     // верхний край рамки при въезде
    const cb = clamp(P - 6) * 100;     // нижний край при выезде
    left.style.setProperty('--ct', `${ct}%`);
    left.style.setProperty('--cb', `${cb}%`);
    const leftVisible = P > 5 && P < 7;
    left.style.visibility = leftVisible ? 'visible' : 'hidden';
    left.classList.toggle('is-on', leftVisible);
    // соседние сцены не исчезают, пока рамка таймера их закрывает
    $('#kids').classList.toggle('is-on', sceneId === 'kids' || (P > 5 && P < 6));
    $('#terms').classList.toggle('is-on', sceneId === 'terms' || (P > 6 && P < 7));
  };

  const loop = now => {
    cx += (mx - cx) * .06;
    cy += (my - cy) * .06;
    if (!reduce) {
      depthEls.forEach(el => {
        const d = Number(el.dataset.d);
        if (d) el.style.translate = `${cx * d}px ${cy * d}px`;
      });
    }
    update();
    if (!document.hidden) drawFx(now);
    requestAnimationFrame(loop);
  };

  /* ===== Интро первого экрана: коробка качается, собирает пыль, открывается со вспышкой ===== */
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const finish = () => {
    timers.forEach(clearTimeout);
    dustUntil = 0;
    body.classList.add('is-charging', 'is-open', 'is-frame', 'is-ui', 'is-done');
    html.classList.remove('is-locked');
    twinkleOn = true;
    setTimeout(() => body.classList.remove('intro'), 50);
  };
  const start = () => {
    body.classList.add('intro');
    renderPanel(current);
    renderHots(current);
    addEventListener('resize', resize);
    resize();
    requestAnimationFrame(t => { last = t; loop(t); });
    if (reduce) { finish(); return; }
    html.classList.add('is-locked');
    scrollTo(0, 0);
    at(700, () => { body.classList.add('is-charging'); dustUntil = performance.now() + 1500; });
    at(2400, () => { body.classList.add('is-open'); openBurst(); magicChime(); });
    at(3000, () => body.classList.add('is-frame'));
    at(3500, () => body.classList.add('is-ui'));
    at(5200, finish);
  };
  $('.skip').addEventListener('click', finish);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !body.classList.contains('is-done')) finish(); });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const introImgs = [$('.closed img'), prodImg];
  Promise.all(introImgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {})))
    .then(() => (document.fonts ? document.fonts.ready : null))
    .then(start, start);
})();
