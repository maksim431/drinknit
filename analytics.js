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
  const id = Number(C.config && C.config.metrikaId) || 0;
  const sent = {};

  if (id && !/[?&]noym\b/.test(location.search)) {
    // стандартный код счётчика Метрики
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      // сам скрипт Метрики грузится после показа первого экрана: на медленной сети он не отнимает канал у страницы.
      // До этого вызовы ym копятся в очереди и отправляются, когда скрипт загрузится
      const add = () => { k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a); };
      // скрипт Метрики — через 3,5 с после показа первого экрана, в свободное время браузера:
      // не мешает загрузке страницы (PageSpeed). Посещения короче этого времени в статистику не попадают
      const html = e.documentElement;
      const later = () => setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(add, { timeout: 2000 }) : add()), 3500);
      if (html.classList.contains('flow-ready')) later();
      else {
        const mo = new MutationObserver(() => { if (html.classList.contains('flow-ready')) { mo.disconnect(); later(); } });
        mo.observe(html, { attributes: true, attributeFilter: ['class'] });
      }
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(id, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
  }

  // событие → цель Метрики. once — только один раз за визит (дошёл до блока, досмотрел видео)
  const track = (goal, params, once) => {
    if (once) { if (sent[goal]) return; sent[goal] = 1; }
    if (id && window.ym) window.ym(id, 'reachGoal', goal, params || undefined);
  };

  window.DrinknitAnalytics = { GOALS, track };
})();
