/* Статистика: Яндекс Метрика. Номер счётчика задаётся в админке (content.js → config.metrikaId).
   Цели — JavaScript-события; админка создаёт их в Метрике одной кнопкой и показывает по ним отчёты */
(function () {
  'use strict';

  // цели сайта: идентификатор в Метрике и понятное название
  const GOALS = [
    ['gift_open', 'Открыл подарок на первом экране'],
    ['book_click', 'Нажал «Забронировать набор»'],
    ['want_set', 'Нажал «Хочу набор»'],
    ['msg_telegram', 'Перешёл в Telegram'],
    ['msg_vk', 'Перешёл во ВКонтакте'],
    ['msg_max', 'Перешёл в MAX'],
    ['msg_any', 'Перешёл в любой мессенджер'],
    ['set_select', 'Переключил набор S / M / L'],
    ['item_open', 'Открыл описание предмета'],
    ['faq_open', 'Открыл вопрос в FAQ'],
    ['video_done', 'Досмотрел видео-переход'],
    ['block_sets', 'Дошёл до блока «Наборы»'],
    ['block_time', 'Дошёл до блока «Сколько вяжу»'],
    ['block_kids', 'Дошёл до блока «Можно дарить детям»'],
    ['block_left', 'Дошёл до блока «Сколько осталось»'],
    ['block_terms', 'Дошёл до блока «Сроки»'],
    ['block_about', 'Дошёл до блока «Обо мне»'],
    ['block_book', 'Дошёл до блока «Займите набор»'],
    ['block_faq', 'Дошёл до блока «Частые вопросы»'],
  ];

  const C = window.DRINKNIT_CONTENT || {};
  const pageId = document.currentScript?.dataset.metrikaId;
  const id = Number(pageId ?? C.config?.metrikaId) || 0;
  const sent = {};

  let started = false;
  function start() {
    if (started || !id || /[?&]noym\b/.test(location.search)) return;
    started = true;

    window.ym = function () { (window.ym.a ||= []).push(arguments); };
    window.ym.l = Date.now();
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(tag);
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  if (window.DrinknitCookies?.accepted()) start();
  window.addEventListener('drinknit:analytics-accepted', start);

  // событие → цель Метрики. once — только один раз за визит (дошёл до блока, досмотрел видео)
  const track = (goal, params, once) => {
    if (!started) return;
    if (once) { if (sent[goal]) return; sent[goal] = 1; }
    window.ym(id, 'reachGoal', goal, params || undefined);
  };

  window.DrinknitAnalytics = { GOALS, track };
})();
