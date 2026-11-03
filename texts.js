/* Тексты страницы: поиск всех текстовых элементов шаблона, ключи и подстановка правок из content.js.
   Один и тот же модуль использует сайт (применяет правки) и админка (показывает список текстов).
   Ключ текста: «блок|исходный текст». Одинаковые тексты в одном блоке (например, пункт меню в двух шапках)
   правятся вместе. Если исходный текст в вёрстке поменяют, старая правка просто перестанет применяться */
(function () {
  'use strict';

  // названия блоков для админки
  const SECTIONS = {
    header: 'Шапка и меню', hero: '1. Первый экран', sets: '2. Наборы', time: '3. Сколько вяжу', kids: '4. Можно дарить детям',
    left: '5. Сколько осталось', terms: '6. Сроки', about: '7. Обо мне', book: '8. Займите набор', faq: '9. Частые вопросы',
    footer: 'Подвал', other: 'Прочее',
  };
  // элементы, которые заполняет скрипт (таймер), не редактируются
  const SKIP = '.b5-days, .b5-hm, script, style, template, svg';

  // вставки, которые нельзя стирать: цифры из настроек и перенос строки только на телефоне
  const TOKENS = [
    { sel: '[data-free]', tok: '{свободно}' },
    { sel: '[data-total]', tok: '{всего}' },
    { sel: '[data-set-price]', tok: '{цена}' },
    { sel: '[data-price="S"]', tok: '{цена S}' },
    { sel: '[data-price="M"]', tok: '{цена M}' },
    { sel: '[data-price="L"]', tok: '{цена L}' },
    { sel: 'br.br-p', tok: '{перенос на телефоне}' },
  ];

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // html элемента → текст для редактирования: <br> — новая строка, служебные вставки — {метки}
  const toPlain = el => {
    let out = '';
    el.childNodes.forEach(n => {
      if (n.nodeType === 3) { out += n.textContent; return; }
      if (n.nodeType !== 1) return;
      const t = TOKENS.find(x => n.matches(x.sel));
      if (t) { out += t.tok; return; }
      if (n.tagName === 'BR') { out += '\n'; return; }
      out += toPlain(n);
    });
    return out;
  };
  // текст из админки → html. Метки превращаются обратно в те же элементы, что были в вёрстке
  const fromPlain = (text, el) => {
    let html = esc(String(text)).replace(/\r?\n/g, '<br>');
    TOKENS.forEach(t => {
      const src = el && el.querySelector(t.sel);
      const rep = src ? src.outerHTML : '';
      html = html.split(esc(t.tok)).join(rep);
    });
    return html;
  };
  const norm = s => s.replace(/\s+/g, ' ').trim();

  // все текстовые элементы: элемент, в котором есть собственный текст (не только в потомках)
  const collect = root => {
    const out = [];
    const walk = el => {
      for (const n of el.children) {
        if (n.matches(SKIP)) continue;
        const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim());
        if (own) {
          const host = n.closest('section, header, footer');
          const section = host && SECTIONS[host.id] ? host.id : host && host.tagName === 'FOOTER' ? 'footer' : host && host.tagName === 'HEADER' ? 'header' : 'other';
          const plain = toPlain(n);
          out.push({ el: n, section, key: section + '|' + norm(plain), plain });
        } else walk(n);
      }
    };
    walk(root);
    return out;
  };

  // правки из content.js → страница
  const apply = (root, texts) => {
    if (!texts) return;
    collect(root).forEach(it => {
      const v = texts[it.key];
      if (typeof v === 'string') it.el.innerHTML = fromPlain(v, it.el);
    });
  };
  const applyMeta = meta => {
    if (!meta) return;
    if (meta.title) document.title = meta.title;
    const set = (sel, v) => { const m = document.querySelector(sel); if (m && v) m.setAttribute('content', v); };
    set('meta[name="description"]', meta.description);
    set('meta[property="og:title"]', meta.ogTitle);
    set('meta[property="og:description"]', meta.ogDescription);
  };

  window.DrinknitTexts = { SECTIONS, TOKENS, collect, apply, applyMeta, toPlain, fromPlain, norm };
})();
