(() => {
  'use strict';

  /* ===== Данные: настройки, наборы, тексты и вопросы — в data.js ===== */
  const { CONFIG, SETS, FAQ, DETAILS, LAYERS, CARDS } = window.DRINKNIT;
  // цели Яндекс Метрики (analytics.js); без счётчика вызовы ничего не делают
  const track = (goal, params, once) => { if (window.DrinknitAnalytics) window.DrinknitAnalytics.track(goal, params, once); };

  const PORTRAIT0 = document.documentElement.classList.contains('is-p');
  // масштаб набора внутри коробки и сдвиг (в % от размера коробки). На телефоне наборы S и M (пакет и коробка M
  // выше и левее, чем L) уменьшаем и сдвигаем, чтобы они целиком помещались между заголовком и панелью, как L
  const SET_K = PORTRAIT0 ? { S: .8179, M: .9673, L: 1 } : { S: .7314, M: 1, L: 1 };   // набор S в макете меньше
  const SET_T = PORTRAIT0 ? { S: [.03, -5.815], M: [.01, .124], L: [0, 0] } : { S: [0, 0], M: [0, 0], L: [0, 0] };

  // Две раскладки одного лендинга: горизонтальный кадр 1920 × 1080 (компьютер, планшет в альбомной ориентации)
  // и вертикальный 600 × 1200 (телефон, вертикальный планшет). Анимации одни и те же, меняются только координаты
  const PORTRAIT = document.documentElement.classList.contains('is-p');
  // телефон: свободный скролл — блоки идут друг за другом, как обычная страница. На месте стоят только
  // карточки блока 3 (листаются по одной на свайп) и видео-переход к блоку 4
  const FLOW = PORTRAIT;
  const FW = PORTRAIT ? 390 : 1920, FH = PORTRAIT ? 844 : 1080, CX = FW / 2, CY = FH / 2;
  const L = PORTRAIT ? {                              // мобильный макет Figma, кадр 390 × 844
    prod: { x: -203.5, y: 192.6, w: 788.2, h: 588.6 }, // коробка на экране наборов
    hero: { dx: 11.9, dy: -94.4, k: 1.1639 },          // на первом экране: (-256.2, 50, 917.4 × 685)
    mouth: { x: 203.8, y: 431.3 }, boxc: { x: 203.8, y: 470.7 }, gift: { x: 203.8, y: 453.4 },
    // блок 3 (1633 px): экран спускается, пока карточка не встанет по центру (409,7 px), карточки листаются,
    // затем свободный спуск к домику (ещё 379,3 px) и только потом видео
    b3pan: 409.74, b3pan2: 379.26, b3origin: [195 + 157.5, 422 + 11.17 + 789],
    v0: { x: -147.56, y: 151.06, w: 1232.07, h: 692.77 }, vanchor: [150, 552], vcover: false,   // первый кадр = низ фона блока 3
    kidsBg: { x: -695, y: 135, w: 1270, h: 709 },
    flip: [195, 422],
    b3cardTop: 599.5,
    kidsPan: 0, termsPan: 0, bookPan: 0,               // свободный скролл: спусков по блокам нет
  } : {
    prod: { x: 122.97, y: -125, w: 1787, h: 1334 },
    hero: { dx: -59.47, dy: -251.5, k: 1.1834 },
    mouth: { x: 960, y: 380 }, boxc: { x: 960, y: 470 }, gift: { x: 960, y: 430 },
    b3pan: 1316, b3origin: [960 + 15, 540 + 166 + 1316],
    v0: { x: 0, y: 0, w: 1920, h: 1080 }, vanchor: [300, 820], vcover: true,
    kidsBg: { x: -236, y: -22, w: 2156, h: 1203 },
    flip: [960, 672],
    termsPan: 0, bookPan: 0,
  };
  const PROD = L.prod;
  // координаты искр, заданные для кадра 1920 × 1080, в текущем кадре
  const sx0 = x => x * FW / 1920, sy0 = y => y * FH / 1080;

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
      ['sheet-5pryb', 65, 632, 542.483, 582.393, 467.731, 515.717, -8.98, 0, 0, 283.02, 191.66, 18],
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
    faq: [
      ['st-8', 40, 40, 298.913, 325.397, 198, 263, 18, -71.45, -41.17, 242.91, 182.34, 24, false],
      ['st-9', 1640, 720, 285.861, 331.721, 237, 294, -8, -62.86, -41.17, 225.72, 182.34, 20, false],
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
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scene = 0;            // ближайшая остановка скролла

  /* ===== Стикеры ===== */
  // вертикальный кадр: свои места и размер стикеров [left, top, масштаб]; null — стикер не показываем
  // мобильный макет: [left, top, ширина и высота рамки, ширина и высота наклейки, поворот (или transform)]; null — стикер не показываем
  const STICKERS_P = {
    hero: [null, [273, 175, 140.45, 140.24, 106.32, 105.9, 24.26], null,
      [133.95, 93.01, 141.26, 155.04, 121.35, 137.89, 8.92], [-24, 126, 189.68, 200.66, 146.93, 163.82, -17.65], null],
    kids: [[275, 367, 126.84, 131.49, 97.02, 104.75, 19.86], [44, 810, 240.66, 258.37, 207.5, 228.79, -8.98], [166.33, 554.3, 155.27, 166.23, 126.61, 141.26, -13.07]],
    left: [[85.79, 36, 238.5, 238.5, 213.9, 213.9, 7.04], [15, 661, 183.91, 184.67, 142.29, 143.6, 20.73], null, [-43.97, 113.61, 171.54, 181.95, 141.45, 155.13, -12.44],
      null, null, [285, 159.96, 130, 150.04, 130, 150.04, 0]],
    terms: [[86, 921, 344.77, 397.4, 269.12, 341.81, 'rotate(-165.79deg) scaleY(-1)']],
    about: [[6.56, 181, 158.34, 144.04, 138.14, 120.11, -10.89], [-12, 181.29, 87.28, 97.12, 69.45, 82.9, 13.86], [30, 744.63, 104, 95, 104, 95, 0],
      [254, 169, 127.63, 119.65, 103.03, 89.58, 20.2], null, null,
      [316.46, 240.57, 79.56, 96.56, 75.15, 93.03, -2.78], [79.76, 700, 89.1, 95.39, 75.81, 83.57, 9.94]],
    book: [[217, 607, 288.92, 340.69, 220.43, 293.65, 15], [-61, 197, 233.66, 258.19, 178.61, 215.49, -16.95], [-80, 1052, 243.71, 270.38, 180.73, 223.74, 18.99],
      [236.24, 1425.35, 219.25, 234.93, 191.33, 209.84, 8.18]],
    faq: [null, null],
  };
  // стикеры, которые есть только в мобильном макете: [картинка, left, top, рамка, наклейка, поворот, положение картинки]
  const STICKERS_PX = {
    terms: [['sheet-5pryb', 214, -39.72, 139.66, 140.27, 123.11, 123.83, -8.28, 0, -107.89, 280.05, 207.89]],
    book: [['sheet-x79', 210, -60, 137.75, 138.28, 118.39, 119.06, -10.29, -147.76, -99.78, 269.06, 199.78],
      ['sheet-cdp', 297.91, -22.2, 65, 92, 65, 92, 0, 0, 0, 266.32, 189.81]],
  };
  for (const [set, list0] of Object.entries(STICKERS)) {
    const host = $(`.stickers[data-set="${set}"]`);
    const list = PORTRAIT && STICKERS_PX[set] ? list0.concat(STICKERS_PX[set].map(x => x.concat([0, true, 'px']))) : list0;
    list.forEach(([src, l, t, w, h, iw, ih, rot, il, it, iwp, ihp, d, shadow = true, px], i) => {
      if (PORTRAIT && !px) {
        const pp = STICKERS_P[set] && STICKERS_P[set][i];
        if (!pp) return;
        [l, t, w, h, iw, ih, rot] = pp;
      }
      const tf = typeof rot === 'string' ? rot : `rotate(${rot}deg)`;
      const el = document.createElement('div');
      el.className = 'stk pop';
      el.style.cssText = `left:${l}px;top:${t}px;width:${w}px;height:${h}px;--d:${(set === 'hero' ? .5 : .55) + i * .09}s`;
      if (d) el.dataset.d = d;
      el.innerHTML = `<div class="stk-r${shadow ? '' : ' ns'}" style="width:${iw}px;height:${ih}px;transform:${tf}"><i><img src="assets/d/${src}.webp" alt="" style="left:${il}%;top:${it}%;width:${iwp}%;height:${ihp}%"></i></div>`;
      host.appendChild(el);
    });
  }

  // телефон, экран «Осталось»: Дед Мороз за панелью, боковые стикеры поверх неё
  if (PORTRAIT) {
    const santa = $('#left .stickers .stk'), back = document.createElement('div');
    back.className = 'stickers stickers-back';
    santa.parentNode.parentNode.insertBefore(back, santa.parentNode);
    back.appendChild(santa);
  }
  // копия карточки Кати на финальном экране: карточки наборов вылетают из-за неё
  const katyaCopy = $('#about .b7-card-wrap').cloneNode(true);
  katyaCopy.className = 'b7-card-wrap b8-katya';
  katyaCopy.removeAttribute('data-split');
  katyaCopy.removeAttribute('style');
  katyaCopy.setAttribute('aria-hidden', 'true');
  katyaCopy.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  $('#book .fr').appendChild(katyaCopy);

  /* ===== Экран стоит на месте: кадр 1920 × 1080 вписан в окно, фоны доходят до краёв ===== */
  const html = document.documentElement;
  const body = document.body;
  const vp = $('#vp');
  const header = $('#header');
  const fx = $('#fx');
  const ctx = fx.getContext('2d');
  const bgls = $$('.bgl');
  let s = 1, tx = 0, ty = 0, cdpr = 1, lastVW = 0, lastVH = 0;
  // фоны растягиваются от центра кадра; считаем один раз, координаты кадра от размера окна не зависят
  bgls.forEach(el => { el.style.transformOrigin = `${CX - el.offsetLeft}px ${CY - el.offsetTop}px`; });
  // фон блока 3 растягиваем от точки, которая в конце спуска стоит в центре экрана — там он совмещён с первым кадром видео
  $('.b3-l01').style.transformOrigin = `${L.b3origin[0]}px ${L.b3origin[1]}px`;
  /* ===== Телефон с экраном короче кадра 390 × 844 =====
     Кадр по ширине экрана, сверху и снизу обрезано по CUT px. Элементы верхней части экрана (центр выше 272 px)
     сдвигаются вниз на CUT, нижней (ниже 572 px) — вверх на CUT, между ними — плавно. Коробка первого экрана
     уменьшается, чтобы поместиться между шапкой и текстом. Высокие блоки начинаются от верха экрана,
     спуск по ним длиннее на 2 × CUT */
  let CUT = 0, cutTargets = null, EXTF = 0;
  const BASE = PORTRAIT ? JSON.parse(JSON.stringify({ hero: L.hero, mouth: L.mouth, boxc: L.boxc, gift: L.gift, v0: L.v0,
    b3pan: L.b3pan, b3pan2: L.b3pan2, kidsPan: L.kidsPan, termsPan: L.termsPan, bookPan: L.bookPan })) : null;
  const FIXED = /(^|\s)(b\d-bg|b2-bg|dim|modal|b3-world|b3-video|b3-vshade|b4-shade|b6-shade|bgl)(\s|$)/;
  const BOXED = /(^|\s)(glow|rays|hero-ray|gift-shadow|hero-ellipse|closed)(\s|$)/;
  const HOSTS = /(^|\s)(stickers|pin|gift-hint)(\s|$)/;
  // ручные привязки для тесных экранов: [селектор или «#сцена stkN», k], k = 1 — к верху экрана, −1 — к низу
  // таймер и «Обо мне» сдвигаются целиком (стикеры лежат на панели и карточке), вопросы прижаты к верху
  const CUT_K = [['#sets .hint', 1], ['#left .b5-center', .5], ['#left stk*', .5], ['#about .b7-card-wrap', .3], ['#about stk*', .3],
    ['#faq .h2', 1], ['#faq .faq-list', 1], ['#faq .faq-side', 1]];
  function measureCut() {
    cutTargets = [];
    // свободный скролл: подгоняются под высоту экрана только первый экран и наборы
    const secs = (FLOW ? ['hero', 'sets'] : ['hero', 'sets', 'time', 'left', 'about', 'faq']).map(id => $(`#${id}`));
    const saved = secs.map(sec => [sec.style.display, sec.style.visibility]);
    secs.forEach(sec => { sec.style.display = ''; sec.style.visibility = 'hidden'; });
    const walk = (el, oy, list) => {
      [...el.children].forEach(n => {
        const cls = typeof n.className === 'string' ? n.className : '';
        if (cls.includes('hero-fade')) { cutTargets.push({ n, k: -1 }); return; }   // затемнение едет вместе с текстом
        if (FIXED.test(cls)) return;
        if (BOXED.test(cls)) { cutTargets.push({ n, box: true }); return; }
        if (HOSTS.test(cls)) { walk(n, oy + n.offsetTop, list); return; }
        const t = oy + n.offsetTop, h = n.offsetHeight, c = t + h / 2;
        list.push({ n, t, b: t + h, stk: cls.includes('stk'), k: Math.max(-1, Math.min(1, (CY - c) / 150)) });
      });
    };
    secs.forEach(sec => {
      const list = [];
      walk(sec.querySelector('.fr'), 0, list);
      // стикер, лежащий на блоке (панель, карточка, облачко), двигается вместе с этим блоком
      const blocks = list.filter(o => !o.stk && o.b - o.t > 120);
      list.forEach(o => {
        if (o.stk) {
          let best = null, bestOv = 0;
          blocks.forEach(bk => { const ov = Math.min(o.b, bk.b) - Math.max(o.t, bk.t); if (ov > bestOv) { bestOv = ov; best = bk; } });
          if (best && bestOv > (o.b - o.t) * .5) o.k = best.k;
        }
        const ov = CUT_K.find(([sel]) => !sel.includes(' stk') && o.n.matches(sel));
        if (ov) o.k = ov[1];
        cutTargets.push({ n: o.n, k: o.k, stk: o.stk });
      });
      $$('.stickers .stk', sec).forEach((n, i) => {
        const ov = CUT_K.find(([sel]) => sel === `${'#' + sec.id} stk${i}` || sel === `${'#' + sec.id} stk*`);
        const t = cutTargets.find(o => o.n === n);
        if (ov && t) t.k = ov[1];
      });
    });
    secs.forEach((sec, i) => { sec.style.display = saved[i][0]; sec.style.visibility = saved[i][1]; });
  }
  function applyCut(cut) {
    cut = Math.round(cut * 10) / 10;
    if (cutTargets && cut === CUT) return;
    if (!cutTargets) measureCut();
    CUT = cut;
    // коробка первого экрана: верх под шапкой, низ над плашкой «Свободно…»
    const top = 110 - Math.min(30, cut * .5);                       // верх коробки на экране
    const hk = Math.max(.6, Math.min(1, (527 - 2 * cut + 43 + Math.min(40, cut * .6) - top) / 460));   // низ коробки может уйти под затемнение
    const delta = top + cut - (392.5 - 282.5 * hk);                // сдвиг центра коробки
    L.hero.k = BASE.hero.k * hk;
    L.hero.dy = BASE.hero.dy + delta;
    // коробка на экране наборов: верх под заголовком, низ над панелью выбора; подсказка едет вместе с коробкой
    const sTop = 240 - Math.min(60, cut * .75), pc = L.prod.y + L.prod.h / 2;   // видимый верх коробки 244 px над центром, низ 122 px под ним
    L.setK = Math.max(.55, Math.min(1, (622 - 2 * cut - 12 - sTop) / 366));
    L.setDy = sTop + cut - pc + 244 * L.setK;
    L.mouth.y = BASE.mouth.y + delta; L.boxc.y = BASE.boxc.y + delta; L.gift.y = BASE.gift.y + delta;
    // стикеры на низком экране немного меньше
    const sk = fmt(1 - cut / FH * .6);
    cutTargets.forEach(({ n, k, box, stk }) => {
      n.style.translate = box ? `0 ${fmt(delta)}px` : (k * cut ? `0 ${fmt(k * cut)}px` : '');
      if (stk) n.style.scale = cut ? String(sk) : '';
    });
    // копия карточки Кати на финальном экране стоит ровно там же, где карточка на экране «Обо мне»
    const kt = cutTargets.find(o => o.n === $('#about .b7-card-wrap'));
    katyaCopy.style.translate = cut ? `0 ${fmt((kt ? kt.k * cut : 0) - cut)}px` : '';
    B8 = null;
    // блок 3 и высокие блоки: начало у верха экрана, спуск длиннее
    L.b3pan = BASE.b3pan + cut; L.b3pan2 = BASE.b3pan2 + cut;
    L.kidsPan = BASE.kidsPan + 2 * cut; L.termsPan = BASE.termsPan + 2 * cut; L.bookPan = BASE.bookPan + 2 * cut;
    L.v0.y = BASE.v0.y - cut;                                      // первый кадр видео совпадает с низом блока 3
    vp.style.setProperty('--cut', `${cut}px`);
    buildSegs();
    if (typeof sizeFooterRef === 'function') sizeFooterRef();
  }
  let sizeFooterRef = null;
  // высота экрана для раскладки и прокрутки. На телефоне адресная строка браузера прячется и появляется при прокрутке,
  // и innerHeight меняется на лету — раскладка и соответствие «прокрутка ↔ экран» от этого прыгали.
  // Поэтому берём наименьшую высоту при текущей ширине; лишняя полоса снизу просто заполняется фоном (--ext)
  let VHs = innerHeight;
  const VH = () => VHs;
  const resize = () => {
    const vw = html.clientWidth, vhNow = innerHeight;
    if (!PORTRAIT || Math.abs(vw - lastVW) > 1 || !lastVH) VHs = vhNow; else VHs = Math.min(VHs, vhNow);
    const vh = VHs;
    // телефон: кадр 390 px по ширине экрана. Если экран короче кадра, кадр обрезается сверху и снизу поровну,
    // а элементы сдвигаются к краям (applyCut). Совсем низкие окна — кадр не короче 640 px
    s = PORTRAIT ? Math.min(vw / FW, vh / 640) : Math.min(vw / FW, vh / FH);
    tx = (vw - FW * s) / 2;
    ty = (vh - FH * s) / 2;
    const px = tx / s, py = ty / s;
    vp.style.setProperty('--s', s);
    html.style.setProperty('--s', s);
    vp.style.setProperty('--tx', `${tx}px`);
    vp.style.setProperty('--ty', `${ty}px`);
    vp.style.setProperty('--px', `${px}px`);
    vp.style.setProperty('--py', `${py}px`);
    vp.style.setProperty('--k', Math.max((FW + 2 * px) / FW, (FH + 2 * py) / FH).toFixed(4));
    // высота экрана прокрутки в пикселях: на телефоне 100vh не совпадает с видимой высотой окна
    if (vh !== lastVH || Math.abs(vw - lastVW) > 1) { lastVW = vw; lastVH = vh; html.style.setProperty('--vh', `${vh / 100}px`); }
    EXTF = Math.max(0, vhNow - vh) / s;
    vp.style.setProperty('--ext', `${EXTF}px`);
    // фоны растягиваются от центра кадра
    cdpr = Math.min(devicePixelRatio || 1, 1.25);
    if (PORTRAIT) applyCut(Math.max(0, (FH - vh / s) / 2));
    fx.width = Math.round(vw * cdpr);
    fx.height = Math.round(vhNow * cdpr);
  };

  /* ===== Частицы «новогоднего волшебства» (движок с прошлой версии сайта), координаты сцены 1920 × 1080 ===== */
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];
  const MOUTH = L.mouth;     // откуда вырывается волшебство при открытии
  const BOXC = L.boxc;
  const parts = [];
  const MAX_PARTS = 280;
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
      ctx.fillRect(-1500, -1500, FW + 3000, FH + 3000);
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

  /* ===== Наборы: слои из макета ===== */
  const product = $('#product');
  const prodInner = $('.prod-inner', product);
  const b2 = $('#sets');
  let current = 'L';
  let busy = false;          // идёт смена набора
  const groups = {};
  const ITEMS = {};

  Object.entries(LAYERS).forEach(([key, list]) => {
    const g = document.createElement('div');
    g.className = 'setg';
    g.dataset.set = key;
    g.hidden = key !== current;
    g.innerHTML = `<img class="base" src="assets/d/sets/${key}-base.webp" alt="Новогодний набор ${key}" draggable="false">`;
    ITEMS[key] = list.map(([id, l, t, w, h], i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'it';
      b.style.cssText = `left:${l}%;top:${t}%;width:${w}%;height:${h}%`;
      b.innerHTML = `<img src="assets/d/sets/${key}-${id}.webp" alt="" draggable="false">`;
      b.setAttribute('aria-label', `Подробнее: ${DETAILS[id].title.replace(/<br>/g, ' ')}`);
      b.addEventListener('click', e => { if (e.detail === 0) openItem(key, i); }); // клавиатура
      g.appendChild(b);
      const it = { id, key, i, box: [l, t, w, h], el: b, ...DETAILS[id] };
      // альфа-маска: клик и наведение точно по контуру, точки контура для искр
      const img = b.firstChild;
      const read = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const cg = c.getContext('2d', { willReadFrequently: true });
        cg.drawImage(img, 0, 0);
        let d;
        try { d = cg.getImageData(0, 0, c.width, c.height).data; } catch { return; }   // file:// — без маски, клик по рамке
        it.alpha = { w: c.width, h: c.height, d };
        const A = (x, y) => d[(y * c.width + x) * 4 + 3];
        it.edge = [];
        for (let y = 3; y < c.height - 3; y += 4) {
          for (let x = 3; x < c.width - 3; x += 4) {
            if (A(x, y) > 128 && (A(x - 3, y) < 64 || A(x + 3, y) < 64 || A(x, y - 3) < 64 || A(x, y + 3) < 64)) it.edge.push([x / c.width, y / c.height]);
          }
        }
      };
      if (img.complete && img.naturalWidth) read(); else img.addEventListener('load', read, { once: true });
      return it;
    });
    groups[key] = g;
    prodInner.appendChild(g);
  });

  // точка на предмете (u, v — доли от его рамки) → координаты кадра
  const toStage = (it, u, v) => {
    const [l, t, w, h] = it.box, k = SET_K[it.key], [tx, ty] = SET_T[it.key];
    const x = PROD.x + (l + u * w) / 100 * PROD.w, y = PROD.y + (t + v * h) / 100 * PROD.h;
    const cx = PROD.x + PROD.w / 2, cy = PROD.y + PROD.h / 2;
    return [cx + (x - cx) * k + tx / 100 * PROD.w, cy + (y - cy) * k + ty / 100 * PROD.h];
  };
  const sparkleEdge = (it, n, o = {}) => {
    if (!it.edge || !it.edge.length) return;
    for (let i = 0; i < n; i++) {
      const [u, v] = pick(it.edge);
      const [x, y] = toStage(it, u, v);
      mote(x, y, Object.assign({ vy: rand(-110, -30), size: rand(2, 4.5) }, o));
    }
  };

  // какой предмет под курсором: спереди назад, по альфа-каналу
  const hitAt = e => {
    const r = groups[current].getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
    const list = ITEMS[current];
    for (let i = list.length - 1; i >= 0; i--) {
      const it = list[i], [l, t, w, h] = it.box;
      const u = (x - l) / w, v = (y - t) / h;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const a = it.alpha;
      if (!a || a.d[(Math.floor(v * (a.h - 1)) * a.w + Math.floor(u * (a.w - 1))) * 4 + 3] > 90) return it;
    }
    return null;
  };
  let hoverIt = null;
  const setHover = it => {
    if (it === hoverIt) return;
    hoverIt?.el.classList.remove('is-hover');
    hoverIt = it;
    it?.el.classList.add('is-hover');
    product.classList.toggle('is-pointer', !!it);
    if (it) sparkleEdge(it, 10);
  };
  product.addEventListener('mousemove', e => { if (product.classList.contains('b2-on') && !busy) setHover(hitAt(e)); });
  product.addEventListener('mouseleave', () => setHover(null));
  product.addEventListener('click', e => {
    if (!product.classList.contains('b2-on') || busy) return;
    const it = hitAt(e);
    if (it) openItem(it.key, it.i);
  });

  // бегущая подсветка: предметы загораются по очереди, с искрами по контуру
  let litIdx = -1;
  setInterval(() => {
    if (!product.classList.contains('b2-on') || busy || !modal.hidden || document.hidden) return;
    const list = ITEMS[current];
    list.forEach(it => it.el.classList.remove('lit'));
    litIdx = (litIdx + 1) % list.length;
    const it = list[litIdx];
    it.el.classList.add('lit');
    sparkleEdge(it, 16);
  }, 1100);

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

  // смена набора: новый набор расходится волной от центра коробки, по фронту волны — искры
  const selectSet = key => {
    if (key === current || busy) return;
    track('set_select', { set: key });
    const fromKey = current, from = groups[current], to = groups[key];
    busy = true;
    setHover(null);
    ITEMS[current].forEach(it => it.el.classList.remove('lit'));
    current = key;
    renderPanel(key);
    to.hidden = false;
    to.style.zIndex = 2;
    from.style.zIndex = 1;
    const k = SET_K[key];
    const cx = PROD.x + PROD.w / 2 + SET_T[key][0] / 100 * PROD.w, cy = PROD.y + PROD.h * .55 + SET_T[key][1] / 100 * PROD.h;
    const DUR = reduce ? 1 : 1100, MAXR = 1250 * PROD.w / 1787, FEATHER = 160 * PROD.w / 1787;
    const t0 = performance.now();
    const step = now => {
      const t = clamp((now - t0) / DUR);
      const R = easeIO(t) * (MAXR + FEATHER);
      const m = `radial-gradient(circle at 50% 55%, #000 ${Math.max(0, R - FEATHER)}px, rgba(0,0,0,.5) ${Math.max(0, R - FEATHER / 2)}px, transparent ${R}px)`;
      to.style.webkitMaskImage = to.style.maskImage = m;
      // старый набор стирается той же волной: где прошёл фронт, его уже нет (радиус в его масштабе)
      const Ro = R * k / SET_K[fromKey];
      const mo = `radial-gradient(circle at 50% 55%, transparent ${Math.max(0, Ro - FEATHER)}px, rgba(0,0,0,.5) ${Math.max(0, Ro - FEATHER / 2)}px, #000 ${Ro}px)`;
      from.style.webkitMaskImage = from.style.maskImage = mo;
      // искры по фронту волны
      for (let i = 0; i < 9; i++) {
        const a = rand(0, Math.PI * 2), r = R * k * rand(.92, 1.02);
        const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * .9;
        if (x > 0 && x < FW && y > -100 && y < FH + 20) mote(x, y, { vx: Math.cos(a) * rand(40, 160), vy: Math.sin(a) * rand(40, 160) - 50, size: rand(2, 5) });
      }
      if (t < 1) { requestAnimationFrame(step); return; }
      to.style.webkitMaskImage = to.style.maskImage = '';
      from.hidden = true;
      from.style.webkitMaskImage = from.style.maskImage = '';
      from.style.zIndex = to.style.zIndex = '';
      busy = false;
      litIdx = -1;
      ITEMS[key].forEach((it, i) => setTimeout(() => sparkleEdge(it, 14), i * 90));
    };
    requestAnimationFrame(step);
  };

  $$('[data-set-tab]').forEach(t => t.addEventListener('click', () => selectSet(t.dataset.setTab)));
  $$('[data-price]').forEach(el => { el.textContent = SETS[el.dataset.price].price; });

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
    if (FLOW) flowOpenModal();
    track('item_open', { item: openData.id, set: key });
    photoIdx = 0;
    $('#modal-title').innerHTML = openData.title;
    $('#modal-text').innerHTML = openData.text;
    const note = $('#modal-note');
    note.textContent = openData.note;
    note.hidden = !openData.note;
    renderPhoto();
    setHover(null);
    // выбранный предмет остаётся подсвеченным поверх затемнения
    focusClone = product.cloneNode(true);
    focusClone.id = 'focus';
    focusClone.removeAttribute('aria-label');
    focusClone.querySelectorAll('.setg').forEach(g => { if (g.dataset.set !== key) g.remove(); });
    focusClone.querySelector('.base').remove();
    focusClone.querySelectorAll('.it').forEach((b, j) => {
      b.tabIndex = -1;
      if (j !== i) b.remove(); else { b.classList.remove('lit', 'is-hover'); b.classList.add('is-focus'); }
    });
    (FLOW ? $('#sets .fr') : $('#stage')).appendChild(focusClone);
    dim.classList.add('on');
    modal.hidden = false;
    sparkleEdge(openData, 30, { vy: rand(-160, -60) });
    $('#modal-close').focus();
  };

  const closeItem = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    html.classList.remove('flow-lock');
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

  /* ===== Карточка с переворотом (блок 3): угол зависит от скролла ===== */
  const flip = $('#flip');
  const flipImg = $('#flip-img');
  const flipCap = $('#flip-cap');
  let cardIdx = -1;
  const setCard = i => {
    if (i === cardIdx) return;
    const c = CARDS[i];
    flipImg.src = c.src;
    flipImg.style.cssText = `width:${c.w}px;height:${c.h}px;transform:translate(calc(-50% + ${c.dx}px), calc(-50% + ${c.dy}px))`;
    flipCap.innerHTML = c.cap;
    if (cardIdx >= 0) burst(L.flip[0], L.flip[1], 50, 1.1);
    cardIdx = i;
  };
  setCard(0);
  // карточка переворачивается целиком за 0,7 с, когда посетитель дошёл до следующей (один свайп или шаг колеса);
  // если нужно перелистнуть через одну, перевороты идут по очереди
  let flipShown = 0, flipWant = 0, flipFrom = 0, flipDest = 0, flipT0 = 0, flipping = false;
  const flipTo = ci => { flipWant = ci; };
  const stepFlip = now => {
    if (!flipping) {
      if (flipWant === flipShown) return;
      flipping = true; flipFrom = flipShown; flipDest = flipShown + Math.sign(flipWant - flipShown); flipT0 = now;
    }
    const t = reduce ? 1 : clamp((now - flipT0) / 700), tt = easeIO(t), dir = flipDest > flipFrom ? 1 : -1;
    const r = v => Math.round(v * 100) / 100;
    if (tt < .5) { setCard(flipFrom); flip.style.transform = `rotateX(${r(dir * tt * 180)}deg)`; }
    else { setCard(flipDest); flip.style.transform = `rotateX(${r(dir * (tt - 1) * 180)}deg)`; }
    if (t >= 1) { flipping = false; flipShown = flipDest; flip.style.transform = ''; }
  };

  /* ===== Таймер ===== */
  const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
  const tick = () => {
    let ms = Math.max(0, new Date(CONFIG.deadline) - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4); ms -= m * 6e4;
    const sec = Math.floor(ms / 1e3);
    $('#t-days').textContent = `${d} ${plural(d, ['день', 'дня', 'дней'])},`;
    $('#t-hm').textContent = `${h} ${plural(h, ['час', 'часа', 'часов'])}, ${m} ${plural(m, ['минута', 'минуты', 'минут'])}, ${sec} ${plural(sec, ['секунда', 'секунды', 'секунд'])}`;
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

  /* ===== Частые вопросы: слева список, справа ответ ===== */
  const faqList = $('#faq-list'), faqCard = $('#faq-card');
  const showFaq = i => {
    $$('button', faqList).forEach((b, j) => { b.setAttribute('aria-selected', String(j === i)); b.tabIndex = j === i ? 0 : -1; });
    $('#faq-q').textContent = FAQ[i][0];
    $('#faq-a').textContent = FAQ[i][1];
    faqCard.setAttribute('aria-labelledby', `faq-t${i}`);
    faqCard.classList.remove('swap'); void faqCard.offsetWidth; faqCard.classList.add('swap');
  };
  FAQ.forEach(([q], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.id = `faq-t${i}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', 'faq-card');
    b.textContent = q;
    b.addEventListener('click', () => { showFaq(i); track('faq_open', { q: FAQ[i][0] }); });
    b.addEventListener('keydown', e => {
      const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault(); e.stopPropagation();
      const n = (i + d + FAQ.length) % FAQ.length;
      showFaq(n); faqList.children[n].focus();
    });
    faqList.appendChild(b);
  });
  showFaq(0);
  $$('[data-msg]').forEach(a => a.addEventListener('click', e => {
    const url = CONFIG.links[a.dataset.msg];
    track('msg_' + a.dataset.msg); track('msg_any', { channel: a.dataset.msg });
    if (a.closest('.set-panel')) track('want_set', { set: current });
    e.preventDefault();
    if (!url) { toast(`Ссылка на ${NAMES[a.dataset.msg]} появится позже`); return; }
    const text = a.dataset.text;
    const full = text && a.dataset.msg === 'telegram' ? `${url}?text=${encodeURIComponent(text)}` : url;
    open(full, '_blank', 'noopener');
  }));

  /* ===== Фоновая музыка: Vlad Gluschenko — Winter Time, по кругу без паузы на стыке.
     Приглушённый эффект 40 %: фильтр срезает верхние частоты (как музыка из соседней комнаты).
     Играет всегда, пока не выключить кнопкой в шапке. Браузер разрешает звук только после первого
     действия посетителя (клик, клавиша, касание), поэтому до него музыка ждёт ===== */
  const MUSIC = { src: 'assets/audio/winter-time.mp3', muffle: .4, volume: .1 };   // громкость 10 % от исходной
  const sounds = $$('.js-sound');
  let soundOn = true, actx = null, mgain = null, msrc = null, mbuf = null, mloading = null;
  const syncSound = () => sounds.forEach(b => {
    b.setAttribute('aria-pressed', String(soundOn));
    b.setAttribute('aria-label', soundOn ? 'Музыка играет' : 'Музыка выключена');
  });
  const setupAudio = () => {
    if (actx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    actx = new AC();
    // приглушение: срез частот от 20 кГц (0 %) до ~600 Гц (100 %) по логарифмической шкале
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 20000 * Math.pow(600 / 20000, MUSIC.muffle);
    lp.Q.value = .7;
    mgain = actx.createGain();
    mgain.gain.value = 0;
    lp.connect(mgain).connect(actx.destination);
    mgain.lp = lp;
    mloading = fetch(MUSIC.src).then(r => r.arrayBuffer())
      .then(b => new Promise((ok, no) => actx.decodeAudioData(b, ok, no)))
      .then(buf => { mbuf = buf; if (soundOn) playMusic(); })
      .catch(() => {});
    return true;
  };
  const playMusic = () => {
    if (!actx || !mbuf) return;
    if (actx.state === 'suspended') actx.resume();
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
    mgain.gain.linearRampToValueAtTime(MUSIC.volume, t + 1.2);   // мягкое появление
  };
  const pauseMusic = () => {
    if (!actx) return;
    const t = actx.currentTime;
    mgain.gain.cancelScheduledValues(t);
    mgain.gain.setValueAtTime(mgain.gain.value, t);
    mgain.gain.linearRampToValueAtTime(0, t + .4);
  };
  syncSound();
  // iOS: музыка играет и при беззвучном режиме (как видео), а не как звук интерфейса
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* нет поддержки */ }
  // браузеры на телефоне разрешают звук только в момент, когда палец отпущен (touchend, click),
  // а не при касании (touchstart, pointerdown). Слушаем и те, и другие и снимаем, только когда звук реально пошёл
  const KICK = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];
  const unkick = () => KICK.forEach(ev => removeEventListener(ev, kick, true));
  const kick = e => {
    if (e.target.closest && e.target.closest('.js-sound')) return;   // кнопка звука решает сама
    if (!soundOn || !setupAudio()) return;
    // iOS «разблокирует» звук только если в обработчике жеста что-то проиграть: короткая тишина
    try {
      const s = actx.createBufferSource();
      s.buffer = actx.createBuffer(1, 1, 22050);
      s.connect(actx.destination);
      s.start(0);
    } catch (err) { /* не важно */ }
    const p = actx.resume();
    playMusic();
    const done = () => { if (actx.state === 'running') unkick(); };
    if (p && p.then) p.then(done, () => {}); else done();
  };
  KICK.forEach(ev => addEventListener(ev, kick, true));
  // пробуем включить сразу при загрузке: браузер разрешит, если посетитель уже бывал на сайте
  // или разрешил звук для него; иначе музыка начнётся с первого клика или нажатия клавиши
  if (soundOn && setupAudio()) {
    actx.resume().then(() => { if (actx.state === 'running') unkick(); }).catch(() => {});
  }
  sounds.forEach(btn => btn.addEventListener('click', () => {
    soundOn = !soundOn;
    syncSound();
    if (soundOn) { if (setupAudio()) { actx.resume(); playMusic(); } }
    else pauseMusic();
  }));
  // вкладка скрыта — музыка на паузе, вернулись — продолжается
  document.addEventListener('visibilitychange', () => {
    if (!actx) return;
    if (document.hidden) actx.suspend(); else if (soundOn) actx.resume();
  });

  /* ===== Скролл: каждая смена сцены — процесс, привязанный к положению скролла ===== */
  // P — положение в «экранах»: 0 первый экран, 1 наборы, 2 «сколько вяжу» (заголовок), 3–5 там же три карточки, 6 для детей, 7 таймер, 8 сроки, 9 обо мне, 10 финал
  const LAST = 11;
  const STOPS = { hero: 0, sets: 1, time: 2, kids: 6, left: 7, terms: 8, about: 9, book: 10, faq: 11 };
  // прокрутка ↔ положение P в экранах. Видео-переход (P 5 → 6) занимает 1,5 экрана прокрутки:
  // за одно движение колеса пролистывается на 36 % меньше кадров, чем у обычного блока (два раза по 20 %)
  // На телефоне блоки «Сроки» и финальный выше экрана: на них прокрутка не переключает сцену, а спускает экран
  // по блоку (участки hold, P стоит на месте). Длина участка = высота спуска, палец и блок двигаются вместе
  const V_START = 5, V_SLOW = 1.875;   // ещё на 20 % медленнее: 1,5 / 0,8
  // длина спуска в экранах: высота спуска делится на видимую высоту кадра — палец и блок двигаются вместе
  const SEGS = [];
  let HOLD_TOTAL = 0;
  const buildSegs = () => {
    const vis = FH - 2 * CUT;
    SEGS.length = 0;
    if (L.b3pan2) SEGS.push({ p: V_START, len: L.b3pan2 / vis, span: 0 });   // спуск к домику перед видео
    SEGS.push({ p: V_START, len: V_SLOW, span: 1 });
    if (L.kidsPan) SEGS.push({ p: 6, len: L.kidsPan / vis, span: 0 });
    if (L.termsPan) SEGS.push({ p: 8, len: L.termsPan / vis, span: 0 });
    if (L.bookPan) SEGS.push({ p: 10, len: L.bookPan / vis, span: 0 });
    HOLD_TOTAL = SEGS.filter(g => !g.span).reduce((a, g) => a + g.len, 0);
  };
  buildSegs();
  const holdF = {};                 // насколько пройден спуск по высокому блоку, 0…1
  const toP = y => {
    const u = y / VH();
    let off = 0;
    for (const g of SEGS) holdF[g.p] = 0;
    for (const g of SEGS) {
      const st = g.p + off;
      if (u < st) return u - off;
      if (u <= st + g.len) {
        const f = (u - st) / g.len;
        if (!g.span) { holdF[g.p] = f; return g.p; }
        return g.p + f * g.span;
      }
      if (!g.span) holdF[g.p] = 1;
      off += g.len - g.span;
    }
    return u - off;
  };
  const toY = P => {
    let off = 0;
    for (const g of SEGS) {
      if (P <= g.p) break;
      if (g.span && P < g.p + g.span) return (g.p + off + (P - g.p) * g.len) * VH();
      off += g.len - g.span;
    }
    return (P + off) * VH();
  };
  let auto = false;          // прокрутку ведёт сам сайт (меню, доезжание)
  const goTo = hash => {
    const id = hash.slice(1);
    if (!(id in STOPS) || html.classList.contains('is-locked')) return;
    if (FLOW) { flowGoTo(id); return; }
    auto = true;                 // переход по меню проезжает блоки без стопора
    scrollTo({ top: toY(STOPS[id]), behavior: reduce ? 'auto' : 'smooth' });
  };
  // меню разделов на телефоне: открывается кнопкой в шапке, закрывается выбором раздела, тапом мимо или Esc
  const menuBtn = $('.hd-menu'), mnav = $('#mnav');
  const setMenu = open => {
    if (!menuBtn) return;
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    mnav.hidden = !open;
  };
  if (menuBtn) {
    menuBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(!header.classList.contains('menu-open')); });
    document.addEventListener('click', e => { if (!e.target.closest('#mnav, .hd-menu')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }
  $$('[data-nav]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); setMenu(false);
    if (a.getAttribute('href') === '#book') track('book_click', { from: (a.closest('section, header, footer') || {}).id || '' });
    goTo(a.getAttribute('href'));
  }));
  $$('[data-set-pick]').forEach(el => el.addEventListener('click', () => {
    const k = el.dataset.setPick;
    goTo('#sets');
    setTimeout(() => selectSet(k), 900);
  }));

  // прилипание только рядом с экраном: остановились ближе 16 % от него — страница доезжает
  // стопор на каждом блоке: если скролл проскакивает экран, страница останавливается на нём.
  // Стопор держит экран 0,3 с, колесо и инерция тачпада в это время не листают дальше,
  // потом прокрутка снова свободная
  const HOLD_MIN = 300, HOLD_MAX = 300, HOLD_GAP = 180;   // стопор держит экран 0,3 с
  let settleT = 0, holdUntil = 0, holdStart = 0, holdStop = 0, lastY = scrollY, lastDir = 1;
  let lastWheel = 0;
  // палец на экране: пока посетитель тянет страницу, ни стопор, ни доезжание её не двигают —
  // иначе на телефоне страница уезжала из-под пальца (особенно внутри видео-перехода)
  let touching = false;
  addEventListener('touchstart', () => { touching = true; auto = false; clearTimeout(settleT); }, { passive: true });
  const touchEnd = e => { if (!e.touches || !e.touches.length) { touching = false; lastY = scrollY; } };
  addEventListener('touchend', touchEnd, { passive: true });
  addEventListener('touchcancel', touchEnd, { passive: true });
  addEventListener('wheel', e => {
    const now = performance.now();
    lastWheel = now;
    auto = false;                // посетитель крутит колесо — доезжание и переход по меню отменяются
    if (now < holdUntil && !e.ctrlKey) {
      e.preventDefault();
      holdUntil = Math.min(holdStart + HOLD_MAX, Math.max(holdUntil, now + HOLD_GAP));
    }
  }, { passive: false });
  // у высокого блока (участок спуска) два края: верх — toY(k), низ — после спуска. Сверху страница встаёт на верх,
  // снизу — на низ; доезжание выбирает ближайший край
  const holdPx = k => { const g = SEGS.find(g => !g.span && g.p === k); return g ? g.len * VH() : 0; };
  const edgeY = (k, bottom) => toY(k) + (bottom ? holdPx(k) : 0);
  let holdY = 0;
  addEventListener('scroll', () => {
    if (FLOW) { flowScroll(); return; }
    const P = toP(scrollY), P0 = toP(lastY), now = performance.now();
    if (scrollY !== lastY) lastDir = Math.sign(scrollY - lastY);
    lastY = scrollY;
    if (!auto && !touching && !html.classList.contains('is-locked') && modal.hidden) {
      if (now < holdUntil) {
        // во время стопора держим экран на месте (клавиши, полоса прокрутки)
        if (Math.abs(scrollY - holdY) > VH() * .006) { scrollTo({ top: holdY, behavior: 'instant' }); lastY = holdY; }
      } else {
        // первый экран, который скролл проскочил за это событие
        // допуск 0,01 экрана: позиция прокрутки округляется до пикселей, и экран может оказаться чуть дальше целого —
        // без допуска стопор снова ловил тот же экран и не отпускал прокрутку
        const EPS = .01;
        const k = P > P0 ? Math.floor(P0 + EPS) + 1 : Math.ceil(P0 - EPS) - 1;
        const crossed = P > P0 ? P >= k - EPS : P <= k + EPS;   // дошёл до экрана или проскочил его
        // большой скачок за одно событие — это полоса прокрутки или End/Home: стопор не мешает
        if (crossed && k >= 0 && k <= LAST && Math.abs(P - P0) < .5) {
          holdStop = k;
          holdStart = now;
          holdUntil = now + HOLD_MIN;
          holdY = edgeY(k, P < P0);         // прокрутка вверх встаёт на нижний край высокого блока
          scrollTo({ top: holdY, behavior: 'instant' });
          lastY = holdY;
        }
      }
    }
    clearTimeout(settleT);
    const settle = () => {
      auto = false;
      if (html.classList.contains('is-locked') || !modal.hidden) return;
      if (touching) { settleT = setTimeout(settle, 200); return; }   // палец ещё на экране
      // колесо ещё крутят — проверим чуть позже
      if (performance.now() - lastWheel < 260) { settleT = setTimeout(settle, 120); return; }
      // доезжаем до ближайшего экрана в любую сторону, в том числе назад к тому, с которого уходят
      const P = toP(scrollY), target = Math.round(P), d = Math.abs(P - target);
      // карточки блока 3: одно движение — одна карточка, доезжаем до следующей в сторону прокрутки
      if (P > 3 && P < 5 && d > .003) {
        auto = true;
        scrollTo({ top: toY(lastDir > 0 ? Math.ceil(P) : Math.floor(P)), behavior: reduce ? 'auto' : 'smooth' });
        return;
      }
      // зона прилипания: у блока с наборами 30 %, у карточек блока 3 — на 30 % больше обычной (20,8 %), у остальных 16 %
      // внутри видео-перехода (P 5…6) зона узкая: видео прокручивается свободно и не отскакивает к началу
      const inVideo = P > V_START && P < V_START + 1;
      const zone = inVideo ? .06 : target === STOPS.sets ? .3 : target >= 3 && target <= 5 ? .208 : .16;
      const y0 = edgeY(target, false), y1 = edgeY(target, true);
      const ty = Math.abs(scrollY - y1) < Math.abs(scrollY - y0) ? y1 : y0;   // ближайший край высокого блока
      if (d > .003 && d < zone) { auto = true; scrollTo({ top: ty, behavior: reduce ? 'auto' : 'smooth' }); }
    };
    settleT = setTimeout(settle, 160);
  }, { passive: true });

  /* ===== Параллакс от мыши ===== */
  const depthEls = $$('[data-d]');
  let mx = 0, my = 0, cx = 0, cy = 0;
  const noParallax = PORTRAIT || matchMedia('(hover: none)').matches;   // на телефоне и планшете параллакса от мыши нет
  if (!noParallax) addEventListener('mousemove', e => {
    mx = e.clientX / innerWidth * 2 - 1;
    my = e.clientY / innerHeight * 2 - 1;
  });
  const heroProdDepth = 12;   // коробка и стикеры первого экрана двигаются рассинхронно

  /* сцены: a…b — остановки, на которых сцена полностью на экране;
     enter/leave: fade — растворение и элементы по очереди, clip — рамка наезжает (объекты стоят),
     under — сцена уже лежит под уезжающей рамкой, cover — сцена стоит, пока её закрывают, split — карточка Кати раскладывается на три */
  const SCENES = [
    { id: 'time', a: 2, b: 5, enter: 'fade', leave: 'video' },
    { id: 'kids', a: 6, b: 6, enter: 'video', leave: 'cover' },
    { id: 'left', a: 7, b: 7, enter: 'clip', leave: 'clip' },
    { id: 'terms', a: 8, b: 8, enter: 'under', leave: 'fade' },
    { id: 'about', a: 9, b: 9, enter: 'fade', leave: 'split' },
    { id: 'book', a: 10, b: 10, enter: 'split', leave: 'fade' },
    { id: 'faq', a: 11, b: 11, enter: 'fade', leave: 'none' },
  ].map(sc => {
    const el = $(`#${sc.id}`);
    const num = v => parseFloat(v) || 0;
    return Object.assign(sc, {
      el,
      rv: $$('.rv', el).map(n => ({ n, d: num(n.style.getPropertyValue('--d')), keep: n.hasAttribute('data-split') })),
      st: $$('.stk', el).map(n => ({ n, d: num(n.style.getPropertyValue('--d')) - .5 })),
    });
  });
  const b2bg = $('.b2-bg');
  const b2els = $$('.b2-el').map(n => ({ n, d: parseFloat(n.style.getPropertyValue('--d')) || 0 }));
  const heroFadeEls = [$('.hero-ray'), $('.hero-ellipse'), $('.hero-fade'), $('.hero-content'), $('.stickers[data-set="hero"]')];
  const left = $('#left');
  /* ===== Видео-переход: кадры assets/d/trans/000…144.webp, грузятся, когда посетитель дошёл до блока 3 ===== */
  const FRAMES = 145;
  const frames = new Array(FRAMES);
  const vcan = $('#b3-video'), vctx = vcan.getContext('2d');
  const b3fades = $$('.b3-fade');
  let framesRequested = false, lastFrame = -1;
  const loadFrames = () => {
    if (framesRequested) return;
    framesRequested = true;
    // сначала каждый 8-й кадр, потом остальные — переход работает сразу, а плавность догружается
    const order = [];
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
    if (!order.includes(FRAMES - 1)) order.splice(1, 0, FRAMES - 1);
    let next = 0;
    const pump = () => {
      if (next >= order.length) return;
      const i = order[next++];
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { frames[i] = img; lastFrame = -1; pump(); };
      img.onerror = pump;
      img.src = `assets/d/trans/${String(i).padStart(3, '0')}.webp`;
    };
    for (let k = 0; k < 4; k++) pump();
  };
  // геометрия кадра: в начале — ровно экран (низ фона блока 3 и есть первый кадр), в конце — как фон блока 4
  // последний кадр видео относительно фона блока 4 (подобрано по совпадению кадров с фоном)
  const KB = L.kidsBg;
  const V0 = L.v0, V1 = { x: KB.x + .1040 * KB.w, y: KB.y + .0143 * KB.h, w: .9000 * KB.w, h: .9073 * KB.h };
  const drawFrame = t => {
    let i = Math.round(t * (FRAMES - 1));
    if (!frames[i]) {   // ближайший загруженный
      let d = 1;
      while (d < FRAMES && !frames[i - d] && !frames[i + d]) d++;
      i = frames[i - d] ? i - d : i + d;
      if (!frames[i]) return;
    }
    // на телефоне видео показывает треть кадра 1280 × 720 — холст в полном разрешении экрана, чтобы не размывать дважды
    const vd = PORTRAIT ? Math.min(devicePixelRatio || 1, 2.5) : cdpr;
    const W = Math.round(vcan.clientWidth * vd * s), H = Math.round(vcan.clientHeight * vd * s);
    if (vcan.width !== W || vcan.height !== H) { vcan.width = W; vcan.height = H; lastFrame = -1; }
    const key = i * 1000 + Math.round(t * 999);
    if (key === lastFrame) return;
    lastFrame = key;
    const e = easeIO(t);
    const v1y = V1.y + (L.kidsPan || FLOW ? CUT : 0);   // блок «Для детей» на телефоне начинается от верха экрана
    let r = { x: V0.x + (V1.x - V0.x) * e, y: V0.y + (v1y - V0.y) * e, w: V0.w + (V1.w - V0.w) * e, h: V0.h + (V1.h - V0.h) * e };
    // координаты кадра 1920 × 1080 → холст (с полями до краёв окна и растяжением фонов --k)
    const px = tx / s, py = ty / s, k = Math.max((FW + 2 * px) / FW, (FH + 2 * py) / FH);
    const sx = W / (FW + 2 * px), sy = H / (FH + 2 * py);
    const X = x => (CX + (x - CX) * k + px) * sx, Y = y => (CY + (y - CY) * k + py) * sy;
    let x0 = X(r.x), y0 = Y(r.y), x1 = X(r.x + r.w), y1 = Y(r.y + r.h);
    // кадр всегда закрывает весь экран: если не хватает, увеличиваем его от домика (точки совмещения с блоком 3)
    const ax = X(L.vanchor[0]), ay = Y(L.vanchor[1]);
    // в самом начале кадр точно совмещён с блоком 3, а непокрытый край закрывает фон блока 3 под холстом
    const fc = Math.max(1, ax / Math.max(1e-3, ax - x0), (W - ax) / Math.max(1e-3, x1 - ax), ay / Math.max(1e-3, ay - y0), (H - ay) / Math.max(1e-3, y1 - ay));
    const f = L.vcover ? 1 + (fc - 1) * clamp(t / .15) : 1;
    x0 = ax + (x0 - ax) * f; x1 = ax + (x1 - ax) * f; y0 = ay + (y0 - ay) * f; y1 = ay + (y1 - ay) * f;
    vctx.clearRect(0, 0, W, H);
    vctx.imageSmoothingQuality = 'high';
    vctx.drawImage(frames[i], x0, y0, x1 - x0, y1 - y0);
  };

  const vshade = PORTRAIT ? $('#b3-vshade') : null, termsFr = $('#terms .fr'), bookFr = $('#book .fr'), kidsFr = $('#kids .fr');
  const b3bg = $('#b3-bg'), b3fg = $('#b3-fg'), b3text = $('#b3-textwrap'), b3card = $('#b3-card');
  const b8cards = $$('.b8-card');
  const b8fill = $('.b8-fill');
  // где карточки наборов стоят под карточкой Кати: считаем по раскладке, чтобы работало в обоих кадрах
  let B8 = null;
  const measureB8 = () => {
    const kSaved = katyaCopy.style.transform;
    katyaCopy.style.transform = 'none';             // мерим по карточке в покое, а не в середине её анимации
    const kr = katyaCopy.getBoundingClientRect();
    katyaCopy.style.transform = kSaved;
    const kx = kr.left + kr.width / 2, ky = kr.top + kr.height / 2;
    const saved = b8cards.map(c => c.style.transform);
    b8cards.forEach(c => { c.style.transform = 'none'; });
    B8 = b8cards.map(c => {
      const r = c.getBoundingClientRect(), u = r.width / c.offsetWidth;
      return { ox: (kx - (r.left + r.width / 2)) / u, oy: (ky - (r.top + r.height / 2)) / u, k: kr.width / r.width - 1 };
    });
    b8cards.forEach((c, j) => { c.style.transform = saved[j]; });
  };

  const fmt = v => Math.round(v * 1000) / 1000;
  // запись в стиль только если значение изменилось: без лишних пересчётов страницы
  const put = (n, prop, v) => {
    const c = n._st || (n._st = {});
    if (c[prop] === v) return;
    c[prop] = v;
    n.style[prop] = v;
  };
  const styleEl = (n, op, ty, blur) => {
    put(n, 'opacity', String(fmt(op)));
    put(n, 'transform', `translateY(${Math.round(ty * 10) / 10}px)`);
    // размытие только для небольших элементов: на больших фонах оно дорого и почти не заметно
    put(n, 'filter', blur > .3 && !n.classList.contains('bgl') && !n.classList.contains('noblur') ? `blur(${Math.round(blur * 2) / 2}px)` : '');
  };
  const show = (n, on) => put(n, 'display', on ? '' : 'none');
  const heroContent = $('.hero-content');
  const heroSec = $('#hero');

  let lastH = -1, lastP = -1, heroBurst = false, mouseMoving = true;
  // подвал: после последнего экрана сцена вопросов и подвал вместе едут вверх, как обычная страница
  const faqSec = $('#faq'), footer = $('#footer'), trackFooter = $('#track-footer');
  let footerP = 0;   // высота подвала в «экранах»
  const sizeFooter = () => {
    if (FLOW) { flowLayout(); return; }
    const h = footer.offsetHeight;            // в координатах кадра
    footerP = h * s / VH();
    trackFooter.style.height = `${h * s + HOLD_TOTAL * VH()}px`;
  };
  addEventListener('resize', sizeFooter);
  sizeFooterRef = sizeFooter;
  // подсказка «листайте дальше»: 4 с без прокрутки — появляется, прокрутка — пропадает.
  // Не показываем, пока подарок не открыт, открыто окно предмета или страница уже в самом низу
  const idle = $('#idle-hint');
  let idleT = 0;
  const idleOff = () => { idle.classList.remove('on'); body.classList.remove('idle'); };
  // 4 с считаются от последней прокрутки или от момента, когда страница стала доступной (после интро, закрытия окна)
  let idleFrom = performance.now();
  const idleArm = () => {
    clearTimeout(idleT);
    idleT = setTimeout(function check() {
      const atEnd = scrollY + VH() >= document.documentElement.scrollHeight - 4;
      if (html.classList.contains('is-locked') || !modal.hidden || atEnd || document.hidden) { idleFrom = performance.now(); idleT = setTimeout(check, 400); return; }
      if (performance.now() - idleFrom < 2000) { idleT = setTimeout(check, 300); return; }
      idle.classList.add('on'); body.classList.add('idle');
    }, 300);
  };
  const idleReset = () => { idleOff(); idleFrom = performance.now(); idleArm(); };
  addEventListener('scroll', idleReset, { passive: true });
  addEventListener('wheel', idleReset, { passive: true });
  addEventListener('touchmove', idleReset, { passive: true });
  addEventListener('keydown', e => { if (/Arrow|Page|Home|End|Space| /.test(e.key || e.code)) idleReset(); });
  idleArm();

  // до каких блоков дошёл посетитель (цели Метрики, по разу за визит)
  const REACH = [[1, 'block_sets'], [2, 'block_time'], [6, 'video_done'], [6, 'block_kids'], [7, 'block_left'], [8, 'block_terms'], [9, 'block_about'], [10, 'block_book'], [11, 'block_faq']];
  let reachI = 0;
  const render = P => {
    while (reachI < REACH.length && P >= REACH[reachI][0] - .05) track(REACH[reachI++][1], null, true);
    const dP = Math.abs(P - lastP);
    const hsum = (holdF[8] || 0) + (holdF[10] || 0) * 7 + (holdF[5] || 0) * 3 + (holdF[6] || 0) * 13;
    const moved = dP > 0 || hsum !== lastH;
    lastH = hsum;
    const up = Math.max(0, P - LAST) * VH() / s;
    put(faqSec, 'transform', up ? `translateY(${fmt(-up)}px)` : '');
    put(footer, 'transform', up ? `translateY(${fmt(-up)}px)` : '');
    const rawP = P;
    P = Math.min(P, LAST);
    if (!moved && !(mouseMoving && P < 1)) return;   // ничего не изменилось — кадр пропускаем
    lastP = rawP;
    scene = Math.round(P);
    const scrolled = P > .05;
    if (scrolled !== header.classList.contains('scrolled')) {
      header.classList.toggle('scrolled', scrolled);
      $$('.hd a, .hd button').forEach(n => { n.tabIndex = scrolled ? -1 : 0; });
      $$('.hd2 a, .hd2 button').forEach(n => { n.tabIndex = scrolled || PORTRAIT ? 0 : -1; });
    }

    // 0 → 1: элементы первого экрана растворяются, коробка едет на место, появляются элементы наборов
    const p = clamp(P);
    const lS = clamp(P - 1);                 // наборы уходят
    const grpA = P < 1.6;
    if (grpA !== body.classList.contains('grp-a')) body.classList.toggle('grp-a', grpA);
    // первый экран и наборы не рисуются, когда их полностью закрыла следующая сцена
    show(heroSec, P < 1.6); show(b2, P < 1.6); show(product, P < 1.6);
    const k = L.hero.k * (1 - p) + (L.setK || 1) * p;
    const dx = L.hero.dx * (1 - p) + cx * heroProdDepth * (1 - p);
    const dy = L.hero.dy * (1 - p) + (L.setDy || 0) * p + cy * heroProdDepth * (1 - p);
    put(product, 'transform', `translate(${fmt(dx)}px, ${fmt(dy)}px) scale(${fmt(k)})`);
    put(product, 'opacity', String(fmt(1 - clamp((lS - .05) * 2.4))));
    if (focusClone) focusClone.style.transform = product.style.transform;
    const fade = clamp(1 - p * 2.4);
    heroFadeEls.forEach(el => put(el, 'opacity', String(fmt(fade))));
    show(heroContent.parentNode.querySelector('.hero-ray'), fade > 0);
    put(heroContent, 'transform', `translateY(${fmt(-40 * (1 - fade))}px)`);
    put(heroContent, 'pointerEvents', fade > .5 ? '' : 'none');
    if (noParallax) mouseMoving = false;
    if (p > .1 && !heroBurst && body.classList.contains('is-done')) { heroBurst = true; area(sx0(300), sy0(200), sx0(1320), sy0(800), 120); }
    if (p < .05) heroBurst = false;
    if (!moved) return;                      // дальше всё зависит только от скролла
    b2els.forEach(({ n, d }) => {
      // интерьер проявляется с первых пикселей скролла, остальные элементы — когда коробка почти на месте
      const pe = n === b2bg ? clamp(p / .85) : clamp((p - .5 - d * .3) / .3), pl = clamp((lS - d * .15) / .35);
      styleEl(n, pe * (1 - pl), (1 - pe) * 30 - pl * 30, (1 - pe + pl) * 8);
      // невидимые элементы наборов не перехватывают тапы (на телефоне подсказка лежит над подарком)
      put(n, 'pointerEvents', pe * (1 - pl) > .5 ? '' : 'none');
    });
    const onSets = p > .96 && lS < .04;
    if (onSets !== product.classList.contains('b2-on')) {
      product.classList.toggle('b2-on', onSets);
      b2.classList.toggle('b2-on', onSets);
      if (onSets) ITEMS[current].forEach((it, i) => setTimeout(() => sparkleEdge(it, 14), i * 90));
      else { setHover(null); closeItem(); ITEMS[current].forEach(it => it.el.classList.remove('lit')); }
    }

    // остальные сцены
    SCENES.forEach(sc => {
      const e = clamp(P - (sc.a - 1)), l = clamp(P - sc.b);
      const visible = e > 0 && (['cover', 'split', 'clip', 'video'].includes(sc.leave) ? l < 1 : l < .6);
      // невидимые сцены убираются из отрисовки целиком
      put(sc.el, 'display', visible ? '' : 'none');
      put(sc.el, 'visibility', visible ? 'visible' : 'hidden');
      // клики и наведение получает только сцена, которая сейчас главная на экране: следующая сцена в самом
      // начале появления (даже с прозрачностью 0,1 %) больше не перекрывает кнопки и карточки текущей
      put(sc.el, 'pointerEvents', visible && e >= .5 && l < .5 ? '' : 'none');
      if (!visible) return;
      // video: сцена проявляется только в самом конце видео-перехода, поверх последнего кадра
      put(sc.el, 'opacity', String(sc.enter === 'fade' ? fmt(clamp(e / .5)) : sc.enter === 'video' ? fmt(clamp((e - .84) / .14)) : 1));
      const still = sc.enter === 'clip' || sc.enter === 'under';
      const vid = sc.enter === 'video';
      sc.rv.forEach(({ n, d, keep }) => {
        const pe = still ? 1 : vid ? clamp((e - .86 - Math.min(d, 1) * .06) / .12) : clamp((e - .25 - Math.min(d, 1) * .3) / .4);
        // video: элементы гаснут в начале перехода
        let pl = sc.leave === 'fade' || sc.leave === 'split' ? clamp((l - d * .12) / .4) : sc.leave === 'video' ? clamp((l - d * .05) / .16) : 0;
        if (keep) { n.style.opacity = P > 9 ? 0 : fmt(pe); n.style.transform = `translateY(${fmt((1 - pe) * 30)}px)`; n.style.filter = ''; return; }
        styleEl(n, pe * (1 - pl), (1 - pe) * 40 - pl * 40, (1 - pe + pl) * 8);
      });
      sc.st.forEach(({ n, d }) => {
        const pe = still ? 1 : vid ? clamp((e - .88 - Math.min(d, .7) * .08) / .1) : clamp((e - .3 - Math.min(d, .7) * .3) / .4);
        const pl = sc.leave === 'fade' || sc.leave === 'split' ? clamp((l - d * .1) / .4) : sc.leave === 'video' ? clamp(l / .16) : 0;
        const sc1 = (.5 + .5 * easeBack(pe)) * (1 - .25 * pl);
        n.style.opacity = fmt(Math.min(1, pe * 1.4) * (1 - pl));
        n.style.transform = `scale(${fmt(sc1)}) rotate(${fmt((1 - pe) * -12)}deg)`;
      });
    });

    // 2…4: карточка переворачивается по вертикали, угол — от скролла
    // 2 → 3: свободный скролл по высокому блоку — фон и карточка едут ровно вместе со скроллом, без замедлений;
    // заголовок и обе ветки стоят на месте, заголовок постепенно гаснет, карточка появляется
    const pan = clamp(P - 2);
    const panY = `translateY(${fmt(CUT - L.b3pan * pan - (L.b3pan2 || 0) * (holdF[5] || 0))}px)`;
    put(b3bg, 'transform', panY);
    put(b3fg, 'transform', panY);
    put(b3text, 'opacity', String(fmt(1 - clamp(pan / .55))));
    const ce = clamp((pan - .4) / .45);
    put(b3card, 'opacity', String(fmt(ce)));
    const stick = L.b3cardStick ? Math.max(0, L.b3cardStick - (L.b3cardTop - L.b3pan * pan)) : 0;
    put(b3card, 'transform', `translateY(${fmt((1 - ce) * 50 + stick)}px) scale(${fmt(.94 + .06 * ce)})`);

    // 5 → 6: переход из блока 3 в блок 4 по кадрам видео. Элементы блока 3 гаснут в начале,
    // кадры сменяются вместе со скроллом, элементы блока 4 появляются у последнего кадра
    const vt = clamp(P - 5);
    if (P > 4.5) loadFrames();
    const vOut = clamp(vt / .16);
    b3fades.forEach(n => put(n, 'opacity', String(fmt(1 - vOut))));
    put(b3text, 'visibility', vt > 0 ? 'hidden' : '');
    put(b3card, 'visibility', vt >= .16 ? 'hidden' : '');
    if (vt > 0) put(b3card, 'opacity', String(fmt(1 - vOut)));
    put(vcan, 'opacity', String(fmt(clamp(vt / .015))));   // быстро: камера в видео начинает двигаться сразу
    if (vt > 0 && vt < 1) drawFrame(vt);
    if (vshade) {
      // затемнение над видео плавно меняет цвет и высоту от блока 3 к блоку 4
      put(vshade, 'opacity', String(fmt(clamp(vt / .015))));
      const c0 = [72, 84, 102], c1 = [84, 116, 144], e2 = easeIO(vt);
      const col = c0.map((v, j) => Math.round(v + (c1[j] - v) * e2)).join(',');
      // координаты от верха экрана: в начале — как в кадре видео (низ блока 3 у низа экрана), в конце — как у блока «Для детей»
      const a0 = 153 - 2 * CUT, b0 = 442 - 2 * CUT;
      put(vshade, 'background', `linear-gradient(180deg, rgb(${col}) ${fmt(Math.max(0, a0 + (144.5 - a0) * e2))}px, rgba(${col},0) ${fmt(b0 + (316.6 - b0) * e2)}px)`);
    }
    // высокие блоки на телефоне: спуск экрана по блоку
    if (L.kidsPan) put(kidsFr, 'transform', `translateY(${fmt(CUT - L.kidsPan * (holdF[6] || 0))}px)`);
    if (L.termsPan) put(termsFr, 'transform', `translateY(${fmt(CUT - L.termsPan * (holdF[8] || 0))}px)`);
    if (L.bookPan) put(bookFr, 'transform', `translateY(${fmt(CUT - L.bookPan * (holdF[10] || 0))}px)`);

    // 3 → 4 → 5: блок стоит, карточка переворачивается по вертикали, угол — от скролла
    flipTo(P < 3.5 ? 0 : P < 4.5 ? 1 : 2);

    // 6 ↔ 7 ↔ 8: жёсткий параллакс — объекты таймера стоят, рамка наезжает снизу и уезжает вверх
    left.style.setProperty('--ct', `${fmt(clamp(7 - P) * 100)}%`);
    left.style.setProperty('--cb', `${fmt(clamp(P - 7) * 100)}%`);

    // 9 → 10: из-за карточки Кати вылетают три карточки наборов — соосно, без поворота, потом карточка Кати исчезает
    const eb = clamp(P - 9), eq = easeIO(clamp((eb - .08) / .72));
    if (!B8 && eb > 0) measureB8();
    b8fill.style.opacity = fmt(clamp(eb / .6));
    b8cards.forEach((c, j) => {
      const o = B8 && B8[j];
      if (!o) return;
      c.style.transform = `translate(${fmt(o.ox * (1 - eq))}px, ${fmt(o.oy * (1 - eq))}px) scale(${fmt(1 + o.k * (1 - eq))})`;
      c.style.opacity = eb > 0 ? 1 : 0;
      c.style.zIndex = j === 1 ? 2 : 1;
    });
    // карточка Кати уходит вниз, пока карточки наборов поднимаются, — без наложения полупрозрачных слоёв
    const kf = easeIO(clamp((eb - .22) / .5));
    katyaCopy.style.opacity = fmt(1 - clamp((kf - .35) / .65));
    katyaCopy.style.transform = `translateY(${fmt(kf * FH * .39)}px) scale(${fmt(1 - .12 * kf)})`;
    katyaCopy.style.visibility = kf >= 1 ? 'hidden' : '';

    // искры во время смены сцен, сколько — зависит от скорости скролла
    const f = P - Math.floor(P);
    if (dP > 0 && dP < 1 && f > .04 && f < .96 && !reduce) {
      const n = Math.min(14, Math.round(dP * 180));
      for (let j = 0; j < n; j++) mote(rand(0, FW), rand(FH * .07, FH * .93), { vy: rand(-150, -40), size: rand(2, 4.5) });
    }
  };

  /* ===== Телефон: свободный скролл =====
     Блоки стоят друг под другом в «документе» (координаты кадра 390 px), вся сцена сдвигается вместе со скроллом.
     Два места, где экран стоит: карточки блока 3 (по центру экрана, по одной на свайп) и видео-переход к блоку 4.
     Первый экран и наборы подогнаны под высоту экрана (обрезка CUT сверху и снизу), остальные блоки — во всю высоту */
  const FLOW_SECS = [['hero', 844, 1], ['sets', 844, 1], ['time', 1633, 0], ['kids', 1096, 0], ['left', 844, 0],
    ['terms', 1305, 0], ['about', 844, 0], ['book', 1940, 0], ['faq', 844, 0]];
  const FL = { secs: [], vC: 0, vA: 0, vB: 0, D: 1, CL: 0, VL: 0, docFooter: 0 };
  const flowSec = id => FL.secs.find(o => o.id === id);
  // прокрутка (в px кадра) → что видно: view — координата документа у верха экрана
  function flowAt(f) {
    const { vC, vA, vB, CL, VL, D } = FL;
    if (f <= vC) return { view: f, u: 0, vt: 0, stage: 0 };
    if (f <= vC + CL) return { view: vC, u: (f - vC) / D, vt: 0, stage: 1 };              // карточки
    if (f <= vA + CL) return { view: f - CL, u: 2, vt: 0, stage: 2 };
    if (f <= vA + CL + VL) return { view: vA, u: 2, vt: (f - vA - CL) / VL, stage: 3 };   // видео
    return { view: vB + f - (vA + CL + VL), u: 2, vt: 1, stage: 4 };
  }
  function fFromView(v) {
    if (v <= FL.vC) return v;
    if (v <= FL.vA) return v + FL.CL;
    return FL.vA + FL.CL + FL.VL + Math.max(0, v - FL.vB);
  }
  function flowLayout() {
    if (!FLOW) return;
    let c = 0;
    FL.secs = FLOW_SECS.map(([id, H, cutSec]) => {
      const el = $(`#${id}`), fr = $('.fr', el);
      const r0 = cutSec ? CUT : 0, r1 = cutSec ? H - CUT : H;
      el.style.top = `${r0}px`; el.style.height = `${r1 - r0}px`;
      fr.style.top = `${-r0}px`; fr.style.height = `${H}px`;
      // top — где начало кадра блока при view = 0 (в координатах сцены)
      const o = { id, el, fr, H, r0, r1, top: CUT + c - r0 };
      c += r1 - r0;
      return o;
    });
    FL.docFooter = c;
    const time = flowSec('time'), kids = flowSec('kids');
    FL.vC = time.top + L.b3cardTop + 232 - FH / 2;     // карточка по центру экрана
    FL.vA = time.top + 1633 - (FH - CUT);              // низ блока 3 у низа экрана — начало видео
    FL.vB = kids.top - CUT;                            // блок «Для детей» от верха экрана — конец видео
    FL.D = .45 * VH() / s; FL.CL = 2 * FL.D; FL.VL = V_SLOW * VH() / s;
    const viewMax = FL.docFooter + footer.offsetHeight + 2 * CUT - FH - EXTF;
    $('.track').style.height = `${Math.ceil(fFromView(viewMax) * s + innerHeight)}px`;
    flowLast = -1;
  }
  function flowGoTo(id) {
    const o = flowSec(id);
    if (!o) return;
    auto = true;
    scrollTo({ top: fFromView(o.top + o.r0 - CUT) * s, behavior: reduce ? 'auto' : 'smooth' });
  }
  // окно предмета: наборы встают ровно на экран, пока окно открыто, страница не листается
  function flowOpenModal() {
    const o = flowSec('sets');
    scrollTo({ top: fFromView(o.top + o.r0 - CUT) * s, behavior: 'instant' });
    lastY = scrollY;
    html.classList.add('flow-lock');
    flowLast = -1;
  }
  // прилипание только у карточек: на каждой карточке стопор, между ними — доезжание в сторону свайпа
  function flowScroll() {
    const now = performance.now(), y = scrollY, y0 = lastY;
    if (y !== y0) lastDir = Math.sign(y - y0);
    lastY = y;
    const stops = [FL.vC, FL.vC + FL.D, FL.vC + 2 * FL.D].map(v => Math.round(v * s));
    if (!auto && !touching && !html.classList.contains('is-locked') && modal.hidden) {
      if (now < holdUntil) {
        if (Math.abs(y - holdY) > 2) { scrollTo({ top: holdY, behavior: 'instant' }); lastY = holdY; }
      } else {
        const cross = y > y0 ? stops.find(v => v > y0 + 1 && v <= y + 1) : [...stops].reverse().find(v => v < y0 - 1 && v >= y - 1);
        if (cross !== undefined && Math.abs(y - y0) < VH() * .6) {
          holdStart = now; holdUntil = now + HOLD_MIN; holdY = cross;
          scrollTo({ top: holdY, behavior: 'instant' }); lastY = holdY;
        }
      }
    }
    clearTimeout(settleT);
    const settle = () => {
      auto = false;
      if (html.classList.contains('is-locked') || !modal.hidden) return;
      if (touching) { settleT = setTimeout(settle, 200); return; }
      if (performance.now() - lastWheel < 260) { settleT = setTimeout(settle, 120); return; }
      const yy = scrollY;
      if (yy > stops[0] + 2 && yy < stops[2] - 2 && !stops.some(v => Math.abs(v - yy) <= 2)) {
        const t = lastDir > 0 ? stops.find(v => v > yy) : [...stops].reverse().find(v => v < yy);
        auto = true;
        scrollTo({ top: t, behavior: reduce ? 'auto' : 'smooth' });
      }
    };
    settleT = setTimeout(settle, 140);
  }
  // начальное состояние: все блоки видимы целиком, без появлений и параллаксов
  let flowLast = -1, heroBox = null;
  if (FLOW) {
    body.classList.add('grp-a');
    SCENES.forEach(sc => {
      sc.el.style.visibility = 'visible'; sc.el.style.opacity = 1; sc.el.style.pointerEvents = '';
      sc.rv.forEach(({ n }) => { n.style.opacity = 1; n.style.transform = ''; n.style.filter = ''; });
      sc.st.forEach(({ n }) => { n.style.opacity = 1; n.style.transform = ''; });
    });
    b2els.forEach(({ n }) => { n.style.opacity = 1; n.style.transform = ''; n.style.filter = ''; n.style.pointerEvents = ''; });
    heroFadeEls.forEach(el => { el.style.opacity = 1; });
    left.style.setProperty('--ct', '0%'); left.style.setProperty('--cb', '0%');
    katyaCopy.style.display = 'none';
    b8fill.style.opacity = 1;
    b8cards.forEach(c => { c.style.transform = 'none'; c.style.opacity = 1; });
    [b3bg, b3fg].forEach(n => { n.style.transform = 'none'; });
    // открытая коробка на первом экране — отдельная картинка: набор на экране наборов едет со своим блоком
    heroBox = document.createElement('div');
    heroBox.className = 'hero-box';
    heroBox.innerHTML = '<div class="prod-inner"><img src="assets/d/sets/L-base.webp" alt="" draggable="false"></div>';
    $('#hero .fr').insertBefore(heroBox, $('#hero .hero-fade'));
    // набор — внутри блока наборов: едет вместе с ним, окно предмета открывается поверх
    $('#sets .fr').appendChild(product);
  }
  const FLOW_GOALS = { sets: 'block_sets', time: 'block_time', kids: 'block_kids', left: 'block_left', terms: 'block_terms', about: 'block_about', book: 'block_book', faq: 'block_faq' };
  const kidsScene = SCENES.find(sc => sc.id === 'kids');
  function renderFlow() {
    const f = scrollY / s;
    if (f === flowLast && !(mouseMoving && f < 1)) return;
    flowLast = f;
    const st = flowAt(f), view = st.view, vt = st.vt;
    const scrTop = CUT, scrBot = FH - CUT + EXTF;
    scene = view < 60 ? 0 : 1;
    const scrolled = view > 5;
    if (scrolled !== header.classList.contains('scrolled')) header.classList.toggle('scrolled', scrolled);
    // блоки
    FL.secs.forEach(o => {
      const v = o.id === 'kids' && st.stage === 3 ? FL.vB : view;
      const tY = o.top - v;
      let vis = tY + o.r1 > scrTop - 100 && tY + o.r0 < scrBot + 100;
      if (o.id === 'kids' && st.stage === 3) vis = vt > .84;
      put(o.el, 'transform', `translateY(${fmt(tY)}px)`);
      put(o.el, 'display', vis ? '' : 'none');
      if (FLOW_GOALS[o.id] && tY + o.r0 < FH / 2) track(FLOW_GOALS[o.id], null, true);
    });
    if (st.stage === 4) track('video_done', null, true);
    // первый экран: коробка по раскладке под высоту экрана
    if (heroBox) put(heroBox, 'transform', `translate(${fmt(L.hero.dx)}px, ${fmt(L.hero.dy)}px) scale(${fmt(L.hero.k)})`);
    // набор едет вместе с блоком наборов
    const so = flowSec('sets'), tS = so.top - view;
    put(product, 'opacity', '1');
    put(product, 'transform', `translate(0px, ${fmt(L.setDy || 0)}px) scale(${fmt(L.setK || 1)})`);
    if (focusClone) focusClone.style.transform = product.style.transform;
    const onSets = Math.abs(tS) < (FH - 2 * CUT) * .35;
    if (onSets !== product.classList.contains('b2-on')) {
      product.classList.toggle('b2-on', onSets);
      b2.classList.toggle('b2-on', onSets);
      if (onSets) ITEMS[current].forEach((it, i) => setTimeout(() => sparkleEdge(it, 14), i * 90));
      else { setHover(null); closeItem(); ITEMS[current].forEach(it => it.el.classList.remove('lit')); }
    }
    // блок 3: текст гаснет по мере прокрутки к карточке, карточки листаются по одной
    const time = flowSec('time'), tStart = time.top - CUT;
    put(b3text, 'opacity', String(fmt(1 - clamp((view - tStart) / Math.max(1, (FL.vC - tStart) * .55)))));
    flipTo(st.stage === 0 ? 0 : st.stage === 1 ? (st.u < .5 ? 0 : st.u < 1.5 ? 1 : 2) : 2);
    if (view > FL.vC - FH) loadFrames();
    // видео-переход: кадры и затемнение стоят на экране, элементы блока 3 гаснут, блок 4 проявляется в конце
    const vOut = clamp(vt / .16);
    b3fades.forEach(n => put(n, 'opacity', String(fmt(1 - vOut))));
    put(b3text, 'visibility', vt > 0 ? 'hidden' : '');
    put(b3card, 'opacity', String(fmt(1 - vOut)));
    put(b3card, 'visibility', vt >= .16 ? 'hidden' : '');
    const comp = `translateY(${fmt(FL.vA - time.top)}px)`;
    put(vcan, 'transform', comp);
    put(vcan, 'opacity', String(fmt(st.stage === 3 ? clamp(vt / .015) : 0)));
    if (vt > 0 && vt < 1) drawFrame(vt);
    if (vshade) {
      put(vshade, 'transform', comp);
      put(vshade, 'opacity', String(fmt(st.stage === 3 ? clamp(vt / .015) : 0)));
      const c0 = [72, 84, 102], c1 = [84, 116, 144], e2 = easeIO(vt);
      const col = c0.map((v, j) => Math.round(v + (c1[j] - v) * e2)).join(',');
      const a0 = 153 - 2 * CUT, b0 = 442 - 2 * CUT;
      put(vshade, 'background', `linear-gradient(180deg, rgb(${col}) ${fmt(Math.max(0, a0 + (144.5 - a0) * e2))}px, rgba(${col},0) ${fmt(b0 + (316.6 - b0) * e2)}px)`);
    }
    const ve = st.stage >= 4 ? 2 : st.stage === 3 ? vt : 0;
    put(kidsScene.el, 'opacity', String(fmt(st.stage === 3 ? clamp((vt - .84) / .14) : 1)));
    kidsScene.rv.forEach(({ n, d }) => { const pe = clamp((ve - .86 - Math.min(d, 1) * .06) / .12); styleEl(n, pe, (1 - pe) * 40, (1 - pe) * 8); });
    kidsScene.st.forEach(({ n, d }) => {
      const pe = clamp((ve - .88 - Math.min(d, .7) * .08) / .1);
      n.style.opacity = fmt(Math.min(1, pe * 1.4));
      n.style.transform = pe >= 1 ? '' : `scale(${fmt(.5 + .5 * easeBack(pe))}) rotate(${fmt((1 - pe) * -12)}deg)`;
    });
    // подвал после последнего блока
    put(footer, 'transform', `translateY(${fmt(CUT + FL.docFooter - view - (FH - CUT + EXTF))}px)`);
  }

  const depth = depthEls.map(el => ({ el, d: Number(el.dataset.d), sec: el.closest('section') })).filter(o => o.d);
  const loop = now => {
    const ddx = mx - cx, ddy = my - cy;
    mouseMoving = Math.abs(ddx) + Math.abs(ddy) > .0004;
    if (mouseMoving && !reduce) {
      cx += ddx * .06;
      cy += ddy * .06;
      depth.forEach(({ el, d, sec }) => {
        if (sec && (sec.style.display === 'none' || sec.style.visibility === 'hidden')) return;
        put(el, 'translate', `${fmt(cx * d)}px ${fmt(cy * d)}px`);
      });
    }
    // ошибка в одном кадре не должна останавливать отрисовку: цикл продолжается в любом случае
    requestAnimationFrame(loop);
    try {
      stepFlip(now);
      if (FLOW) renderFlow(); else render(clamp(toP(scrollY), 0, LAST + footerP));
    } catch (err) { console.error(err); }
    if (!document.hidden) drawFx(now);
  };

  /* ===== Интро первого экрана: коробка качается, собирает пыль, открывается со вспышкой ===== */
  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const finish = () => {
    timers.forEach(clearTimeout);
    body.classList.remove('is-waiting');
    dustUntil = 0;
    body.classList.add('is-charging', 'is-open', 'is-frame', 'is-ui', 'is-done');
    html.classList.remove('is-locked');
    twinkleOn = true;
    setTimeout(() => body.classList.remove('intro'), 50);
  };
  const start = () => {
    body.classList.add('intro');
    renderPanel(current);
    addEventListener('resize', resize);
    resize();
    sizeFooter();
    requestAnimationFrame(t => { last = t; loop(t); });
    if (reduce) { finish(); return; }
    html.classList.add('is-locked');
    scrollTo(0, 0);
    body.classList.add('is-waiting');   // подарок покачивается в воздухе и ждёт клика
  };
  // клик по подарку запускает открытие и переход к лендингу
  const openGift = () => {
    track('gift_open', null, true);
    if (!body.classList.contains('is-waiting')) return;
    body.classList.remove('is-waiting');
    body.classList.add('is-charging');
    dustUntil = performance.now() + 1500;
    at(1700, () => { body.classList.add('is-open'); openBurst(); });
    at(2300, () => body.classList.add('is-frame'));
    at(2800, () => body.classList.add('is-ui'));
    at(4500, finish);
  };
  $('#gift').addEventListener('click', openGift);
  // стикеры вылетают из центра коробки, по очереди
  $$('.stickers[data-set="hero"] .stk').forEach((el, i) => {
    const x = el.offsetLeft + el.offsetWidth / 2, y = el.offsetTop + el.offsetHeight / 2;
    el.style.setProperty('--fx', `${L.gift.x - x}px`);
    el.style.setProperty('--fy', `${L.gift.y - y}px`);
    el.style.setProperty('--fr', `${(i % 2 ? 1 : -1) * (25 + i * 7)}deg`);
    el.style.setProperty('--fd', `${.05 + i * .07}s`);
  });
  $('.skip').addEventListener('click', finish);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !body.classList.contains('is-done')) finish(); });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const introImgs = [$('.closed img'), $('.base', groups.L)];
  Promise.all(introImgs.map(img => (img.decode ? img.decode() : Promise.resolve()).catch(() => {})))
    .then(() => (document.fonts ? document.fonts.ready : null))
    .then(start, start);
})();
