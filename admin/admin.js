/* Админка Drinknit: тексты, фото предметов, подключения и статистика Яндекс Метрики.
   Правки сохраняются в репозиторий сайта через GitHub API (content.js и фото в assets/items/),
   GitHub Pages публикует их примерно за минуту. Статистика читается из API Метрики */
(() => {
  'use strict';

  const REPO = 'maksim431/drinknit', BRANCH = 'main';
  const GH = `https://api.github.com/repos/${REPO}`;
  const LS = { gh: 'dk_gh_token', ym: 'dk_ym_token', ymClient: 'dk_ym_client', days: 'dk_days' };
  const T = window.DrinknitTexts;
  const GOALS = window.DrinknitAnalytics.GOALS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const store = { get: k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) { /* приватный режим */ } } };

  let toastT;
  const toast = (msg, ms = 3200) => {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms);
  };

  /* ===== GitHub ===== */
  const b64enc = s => btoa(unescape(encodeURIComponent(s)));
  const b64dec = s => decodeURIComponent(escape(atob(s.replace(/\n/g, ''))));
  const gh = async (path, opts = {}) => {
    const r = await fetch(GH + path, { ...opts, headers: { Authorization: `Bearer ${store.get(LS.gh)}`, Accept: 'application/vnd.github+json', ...(opts.headers || {}) } });
    if (!r.ok) { const e = new Error(`GitHub ${r.status}`); e.status = r.status; try { e.body = await r.json(); } catch (x) { /* пусто */ } throw e; }
    return r.status === 204 ? null : r.json();
  };
  const getFile = async path => {
    const j = await gh(`/contents/${path}?ref=${BRANCH}&t=${Date.now()}`);
    return { sha: j.sha, text: b64dec(j.content) };
  };
  const putFile = (path, base64, message, sha) =>
    gh(`/contents/${path}`, { method: 'PUT', body: JSON.stringify({ message, content: base64, branch: BRANCH, ...(sha ? { sha } : {}) }) });
  const deleteFile = async (path, message) => {
    const j = await gh(`/contents/${path}?ref=${BRANCH}`);
    return gh(`/contents/${path}`, { method: 'DELETE', body: JSON.stringify({ message, sha: j.sha, branch: BRANCH }) });
  };

  /* ===== Состояние ===== */
  let content = null;       // рабочая копия content.js
  let saved = '';           // опубликованная версия (для «есть правки»)
  let sha = '';
  let textItems = [];       // тексты вёрстки: { key, section, plain, tag, count }
  const newPhotos = {};     // загруженные, но не опубликованные фото: id → { url, b64, ext }
  const removed = new Set();// фото, которые нужно удалить из репозитория при публикации

  const parseContent = text => JSON.parse(text.slice(text.indexOf('=') + 1).trim().replace(/;\s*$/, ''));
  const serialize = c => '/* Содержимое сайта: тексты, цифры, вопросы, фото предметов. Файл редактируется из админки (admin/), правьте через неё */\n'
    + `window.DRINKNIT_CONTENT = ${JSON.stringify(c, null, 2)};\n`;
  const dirty = () => JSON.stringify(content) !== saved;
  const updatePublish = () => {
    const d = content && dirty();
    $('#publish').hidden = !d;
    if (d) $('#publish-text').textContent = 'Есть несохранённые правки — они появятся на сайте после публикации';
    $$('#text-nav a').forEach(a => { const g = a.dataset.g; a.querySelector('.dot').hidden = !groupChanged(g); });
  };
  addEventListener('beforeunload', e => { if (content && dirty()) { e.preventDefault(); e.returnValue = ''; } });

  /* ===== html ↔ текст для полей с переносами (описания предметов, подписи карточек) ===== */
  const htmlToPlain = html => { const t = document.createElement('textarea'); t.innerHTML = String(html || '').replace(/<br\s*\/?>/gi, '\n'); return t.value; };
  const plainToHtml = text => esc(text).replace(/&quot;/g, '"').replace(/\r?\n/g, '<br>');

  /* ===== Загрузка ===== */
  const loadAll = async () => {
    const [c, page] = await Promise.all([getFile('content.js'), getFile('index.html')]);
    sha = c.sha;
    content = parseContent(c.text);
    content.texts = content.texts || {};
    content.config.links = content.config.links || {};
    saved = JSON.stringify(content);
    // тексты вёрстки: тот же модуль, что применяет правки на сайте
    const tpl = new DOMParser().parseFromString(page.text, 'text/html').getElementById('tpl-desktop').content;
    const byKey = new Map();
    T.collect(tpl).forEach(it => {
      if (byKey.has(it.key)) { byKey.get(it.key).count++; return; }
      byKey.set(it.key, { key: it.key, section: it.section, plain: it.plain, tag: it.el.tagName, cls: it.el.className, count: 1 });
    });
    textItems = [...byKey.values()];
  };

  /* ===== Вход ===== */
  const showApp = async () => {
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#stats-body').innerHTML = '<div class="skeleton"></div>';
    try {
      await loadAll();
    } catch (e) {
      if (e.status === 401 || e.status === 403 || e.status === 404) { store.set(LS.gh, ''); showLogin('Токен не подходит: нет доступа к репозиторию maksim431/drinknit. Проверьте права Contents: Read and write.'); return; }
      toast('Не удалось загрузить данные сайта. Проверьте интернет и обновите страницу.', 6000);
      return;
    }
    renderTexts(); renderPhotos(); renderSettings();
    const tab = (location.hash.match(/tab=(\w+)/) || [])[1] || 'stats';
    openTab(tab);
    loadStats();
  };
  const showLogin = msg => {
    $('#app').hidden = true;
    $('#login').hidden = false;
    $('#login-error').hidden = !msg;
    if (msg) $('#login-error').textContent = msg;
  };
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const t = $('#gh-token').value.trim();
    if (!t) return;
    store.set(LS.gh, t);
    try { await gh(''); } catch (err) { store.set(LS.gh, ''); showLogin('Токен не подходит или нет доступа к репозиторию.'); return; }
    showApp();
  });
  $('#logout').addEventListener('click', () => {
    if (content && dirty() && !confirm('Есть неопубликованные правки. Выйти без сохранения?')) return;
    store.set(LS.gh, ''); content = null; location.hash = ''; showLogin();
  });

  /* ===== Вкладки ===== */
  const openTab = name => {
    if (!$(`#tab-${name}`)) name = 'stats';
    $$('#nav button').forEach(b => { if (b.dataset.tab === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $$('.tab').forEach(s => { s.hidden = s.id !== `tab-${name}`; });
    $$(`#tab-${name} textarea`).forEach(autosize);   // в скрытой вкладке высота не считается
    history.replaceState(null, '', `#tab=${name}`);
  };
  $$('#nav button').forEach(b => b.addEventListener('click', () => openTab(b.dataset.tab)));

  /* ===== Поля ===== */
  const autosize = ta => { if (!ta.offsetParent) return; ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight + 2}px`; };
  const field = ({ label, value, def, multiline = true, type = 'text', onInput, hint }) => {
    const w = document.createElement('div');
    w.className = 'titem';
    const changed = () => def !== undefined && String(val()) !== String(def);
    w.innerHTML = `<div class="t-top"><span>${esc(label)}</span>${hint ? `<span class="tag">${esc(hint)}</span>` : ''}<button type="button" class="link reset" hidden>Вернуть исходный</button></div>`;
    const inp = document.createElement(multiline ? 'textarea' : 'input');
    if (!multiline) inp.type = type;
    else inp.rows = 1;
    inp.value = value;
    inp.setAttribute('aria-label', label);
    w.appendChild(inp);
    const val = () => inp.value;
    const sync = () => {
      w.classList.toggle('changed', changed());
      $('.reset', w).hidden = !changed();
      if (multiline) autosize(inp);
    };
    inp.addEventListener('input', () => { onInput(inp.value); sync(); updatePublish(); });
    $('.reset', w).addEventListener('click', () => { inp.value = def; onInput(def); sync(); updatePublish(); });
    requestAnimationFrame(sync);
    w._sync = sync; w._inp = inp;
    return w;
  };

  /* ===== Тексты ===== */
  const KIND = (tag, cls) => tag === 'H1' || tag === 'H2' ? 'Заголовок' : tag === 'A' || tag === 'BUTTON' ? 'Кнопка или ссылка'
    : tag === 'LI' ? 'Пункт списка' : /cap|lead/.test(cls) ? 'Подпись' : 'Текст';
  const groups = [];      // { id, title, changed() }
  const groupChanged = id => { const g = groups.find(x => x.id === id); return g ? g.changed() : false; };

  const renderTexts = () => {
    const body = $('#text-body'), nav = $('#text-nav');
    body.innerHTML = ''; nav.innerHTML = ''; groups.length = 0;
    const base = JSON.parse(saved);
    const addGroup = (id, title, build, changed) => {
      const sec = document.createElement('section');
      sec.className = 'tgroup'; sec.id = `g-${id}`;
      sec.innerHTML = `<h2>${esc(title)}</h2>`;
      build(sec);
      body.appendChild(sec);
      groups.push({ id, title, changed });
      const a = document.createElement('a');
      a.href = `#g-${id}`; a.dataset.g = id;
      a.innerHTML = `<span>${esc(title)}</span><span class="dot" hidden></span>`;
      a.addEventListener('click', e => { e.preventDefault(); sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      nav.appendChild(a);
    };

    // тексты вёрстки по блокам
    Object.entries(T.SECTIONS).forEach(([sid, title]) => {
      const list = textItems.filter(t => t.section === sid);
      if (!list.length) return;
      addGroup(sid, title, sec => {
        list.forEach(t => {
          const cur = t.key in content.texts ? content.texts[t.key] : t.plain;
          const f = field({ label: KIND(t.tag, t.cls), hint: t.count > 1 ? `в ${t.count} местах` : '', value: cur, def: t.plain,
            onInput: v => { if (v === t.plain) delete content.texts[t.key]; else content.texts[t.key] = v; } });
          f.dataset.search = `${t.plain} ${cur}`.toLowerCase();
          sec.appendChild(f);
        });
      }, () => list.some(t => t.key in content.texts));
    });

    // цифры и наборы
    addGroup('numbers', 'Цифры, цены и наборы', sec => {
      const c = content.config, b = base.config;
      const r = document.createElement('div'); r.className = 'row3';
      r.appendChild(field({ label: 'Свободно наборов', value: c.free, def: b.free, multiline: false, type: 'number', onInput: v => { c.free = Number(v); } }));
      r.appendChild(field({ label: 'Всего наборов', value: c.total, def: b.total, multiline: false, type: 'number', onInput: v => { c.total = Number(v); } }));
      const toLocal = iso => iso ? iso.slice(0, 16) : '';
      r.appendChild(field({ label: 'Приём заказов до', value: toLocal(c.deadline), def: toLocal(b.deadline), multiline: false, type: 'datetime-local',
        onInput: v => { c.deadline = v ? `${v}:59+03:00` : b.deadline; } }));   // время московское
      sec.appendChild(r);
      ['S', 'M', 'L'].forEach(k => {
        const s = content.sets[k], o = base.sets[k];
        const h = document.createElement('h3'); h.textContent = `Набор ${k}`; sec.appendChild(h);
        const row = document.createElement('div'); row.className = 'row3';
        row.appendChild(field({ label: 'Цена, ₽', value: s.price, def: o.price, multiline: false, type: 'number', onInput: v => { s.price = Number(v); } }));
        row.appendChild(field({ label: 'Для кого', value: s.forWhom, def: o.forWhom, onInput: v => { s.forWhom = v; } }));
        row.appendChild(field({ label: 'Часы вязания', value: s.hours, def: o.hours, multiline: false, onInput: v => { s.hours = v; } }));
        sec.appendChild(row);
      });
    }, () => JSON.stringify([content.config.free, content.config.total, content.config.deadline, content.sets]) !== JSON.stringify([base.config.free, base.config.total, base.config.deadline, base.sets]));

    // карточки блока 3
    addGroup('cards', 'Карточки «Сколько вяжу»', sec => {
      content.cards.forEach((cap, i) => sec.appendChild(field({ label: `Подпись карточки ${i + 1}`, value: htmlToPlain(cap), def: htmlToPlain(base.cards[i]),
        onInput: v => { content.cards[i] = plainToHtml(v); } })));
    }, () => JSON.stringify(content.cards) !== JSON.stringify(base.cards));

    // описания предметов (окно по клику на предмет)
    const NAMES = { grinch: 'Зелёный воришка (набор M)', grinch2: 'Зелёный воришка v2 (набор L)', lamb: 'Барашек', mitten: 'Варежка-подвеска', goat: 'Белый козлик', cream: 'Крем для рук', card: 'Открытка' };
    addGroup('items', 'Описания предметов', sec => {
      Object.entries(content.details).forEach(([id, d]) => {
        const o = base.details[id];
        const h = document.createElement('h3'); h.textContent = NAMES[id] || id; sec.appendChild(h);
        sec.appendChild(field({ label: 'Название', value: htmlToPlain(d.title), def: htmlToPlain(o.title), onInput: v => { d.title = plainToHtml(v); } }));
        sec.appendChild(field({ label: 'Описание', value: htmlToPlain(d.text), def: htmlToPlain(o.text), onInput: v => { d.text = plainToHtml(v); } }));
        sec.appendChild(field({ label: 'Примечание мелким шрифтом', value: htmlToPlain(d.note), def: htmlToPlain(o.note), onInput: v => { d.note = plainToHtml(v); } }));
      });
    }, () => Object.keys(content.details).some(id => ['title', 'text', 'note'].some(k => content.details[id][k] !== base.details[id][k])));

    // частые вопросы
    addGroup('faqdata', 'Частые вопросы: вопросы и ответы', sec => {
      const wrap = document.createElement('div'); wrap.style.display = 'grid'; wrap.style.gap = '10px';
      const draw = () => {
        wrap.innerHTML = '';
        content.faq.forEach((qa, i) => {
          const it = document.createElement('div'); it.className = 'faq-item';
          it.innerHTML = `<div class="f-bar"><span>Вопрос ${i + 1}</span><span class="sp"></span>
            <button type="button" class="icon-btn" data-a="up" aria-label="Выше" ${i ? '' : 'disabled'}>↑</button>
            <button type="button" class="icon-btn" data-a="down" aria-label="Ниже" ${i < content.faq.length - 1 ? '' : 'disabled'}>↓</button>
            <button type="button" class="icon-btn" data-a="del" aria-label="Удалить вопрос">✕</button></div>`;
          const q = field({ label: 'Вопрос', value: qa[0], onInput: v => { qa[0] = v; } });
          const a = field({ label: 'Ответ', value: qa[1], onInput: v => { qa[1] = v; } });
          it.append(q, a);
          it.querySelector('[data-a="up"]').onclick = () => { [content.faq[i - 1], content.faq[i]] = [content.faq[i], content.faq[i - 1]]; draw(); updatePublish(); };
          it.querySelector('[data-a="down"]').onclick = () => { [content.faq[i + 1], content.faq[i]] = [content.faq[i], content.faq[i + 1]]; draw(); updatePublish(); };
          it.querySelector('[data-a="del"]').onclick = () => { if (confirm('Удалить этот вопрос?')) { content.faq.splice(i, 1); draw(); updatePublish(); } };
          wrap.appendChild(it);
        });
        const add = document.createElement('button');
        add.type = 'button'; add.className = 'btn btn-ghost'; add.textContent = '+ Добавить вопрос';
        add.onclick = () => { content.faq.push(['Новый вопрос', 'Ответ']); draw(); updatePublish(); };
        wrap.appendChild(add);
      };
      draw();
      sec.appendChild(wrap);
    }, () => JSON.stringify(content.faq) !== JSON.stringify(base.faq));

    // страница в поиске
    addGroup('meta', 'Страница в поиске и соцсетях', sec => {
      const m = content.meta, o = base.meta;
      sec.appendChild(field({ label: 'Заголовок вкладки и поиска', value: m.title, def: o.title, onInput: v => { m.title = v; } }));
      sec.appendChild(field({ label: 'Описание для поиска', value: m.description, def: o.description, onInput: v => { m.description = v; } }));
      sec.appendChild(field({ label: 'Заголовок при отправке ссылки', value: m.ogTitle, def: o.ogTitle, onInput: v => { m.ogTitle = v; } }));
      sec.appendChild(field({ label: 'Описание при отправке ссылки', value: m.ogDescription, def: o.ogDescription, onInput: v => { m.ogDescription = v; } }));
    }, () => JSON.stringify(content.meta) !== JSON.stringify(base.meta));

    updatePublish();
  };
  $('#text-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    $$('#text-body .titem').forEach(f => {
      const s = (f.dataset.search || '') + ' ' + (f._inp ? f._inp.value.toLowerCase() : '');
      f.hidden = !!q && !s.includes(q);
    });
    $$('#text-body .tgroup').forEach(g => { g.hidden = !!q && !$$('.titem', g).some(f => !f.hidden); });
  });

  /* ===== Фото предметов ===== */
  const ITEM_NAMES = { grinch: 'Игрушка «Зелёный воришка» — набор M', grinch2: 'Игрушка «Зелёный воришка» v2 — набор L', lamb: 'Игрушка «Барашек»', mitten: 'Варежка-подвеска на ёлку', goat: 'Игрушка «Белый козлик»', cream: 'Крем для рук', card: 'Открытка с вашим текстом' };
  // фото → webp (или jpeg, если браузер не умеет webp), не больше 1600 px по длинной стороне
  const compress = file => new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const done = blob => {
        if (!blob) { rej(new Error('compress')); return; }
        const fr = new FileReader();
        fr.onload = () => res({ url: URL.createObjectURL(blob), b64: String(fr.result).split(',')[1], ext: blob.type === 'image/webp' ? 'webp' : 'jpg' });
        fr.readAsDataURL(blob);
      };
      c.toBlob(b => { if (b && b.type === 'image/webp') done(b); else c.toBlob(done, 'image/jpeg', .86); }, 'image/webp', .86);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => rej(new Error('image'));
    img.src = url;
  });
  const renderPhotos = () => {
    const body = $('#photos-body');
    body.innerHTML = '';
    Object.keys(content.details).forEach(id => {
      const d = content.details[id];
      const card = document.createElement('div');
      card.className = 'card pcard';
      card.innerHTML = `<div class="card-head"><h2>${esc(ITEM_NAMES[id] || id)}</h2><span class="muted">${d.photos.length} фото</span></div><div class="pgrid"></div>`;
      const grid = $('.pgrid', card);
      d.photos.forEach((p, i) => {
        const np = newPhotos[p];
        const ph = document.createElement('div');
        ph.className = 'ph' + (np ? ' new' : '');
        ph.innerHTML = `<img src="${np ? np.url : `../${esc(p)}`}" alt="Фото ${i + 1}" loading="lazy">${i === 0 ? '<span class="first">первое</span>' : ''}
          <div class="ph-bar"><button type="button" data-a="left" aria-label="Левее" ${i ? '' : 'hidden'}>←</button>
          <button type="button" data-a="del" aria-label="Удалить фото">✕</button>
          <button type="button" data-a="right" aria-label="Правее" ${i < d.photos.length - 1 ? '' : 'hidden'}>→</button></div>`;
        ph.querySelector('[data-a="left"]').onclick = () => { [d.photos[i - 1], d.photos[i]] = [d.photos[i], d.photos[i - 1]]; renderPhotos(); updatePublish(); };
        ph.querySelector('[data-a="right"]').onclick = () => { [d.photos[i + 1], d.photos[i]] = [d.photos[i], d.photos[i + 1]]; renderPhotos(); updatePublish(); };
        ph.querySelector('[data-a="del"]').onclick = () => {
          if (!confirm('Удалить это фото?')) return;
          d.photos.splice(i, 1);
          if (newPhotos[p]) delete newPhotos[p]; else if (p.startsWith('assets/items/')) removed.add(p);
          renderPhotos(); updatePublish();
        };
        grid.appendChild(ph);
      });
      const add = document.createElement('label');
      add.className = 'add';
      add.innerHTML = '<span>+ Добавить фото<br><small>можно несколько</small></span><input type="file" accept="image/*" multiple hidden>';
      $('input', add).addEventListener('change', async e => {
        const files = [...e.target.files];
        if (!files.length) return;
        toast('Готовлю фото…');
        for (const f of files) {
          try {
            const r = await compress(f);
            const key = `pending:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
            newPhotos[key] = { ...r, id };
            d.photos.push(key);
          } catch (err) { toast(`Не получилось прочитать «${f.name}». Попробуйте JPG или PNG.`, 5000); }
        }
        renderPhotos(); updatePublish();
      });
      grid.appendChild(add);
      body.appendChild(card);
    });
  };

  /* ===== Публикация ===== */
  $('#discard').addEventListener('click', () => {
    if (!confirm('Отменить все неопубликованные правки?')) return;
    content = JSON.parse(saved);
    Object.keys(newPhotos).forEach(k => delete newPhotos[k]);
    removed.clear();
    renderTexts(); renderPhotos(); renderSettings(); updatePublish();
  });
  $('#save').addEventListener('click', async () => {
    const btn = $('#save');
    btn.disabled = true; btn.textContent = 'Публикую…';
    try {
      // 1. новые фото — в assets/items/
      for (const [id, d] of Object.entries(content.details)) {
        for (let i = 0; i < d.photos.length; i++) {
          const key = d.photos[i], np = newPhotos[key];
          if (!np) continue;
          const path = `assets/items/${id}-${Date.now().toString(36)}${i}.${np.ext}`;
          $('#publish-text').textContent = 'Загружаю фото…';
          await putFile(path, np.b64, `Админка: фото «${id}»`);
          d.photos[i] = path;
          delete newPhotos[key];
        }
      }
      // 2. content.js
      $('#publish-text').textContent = 'Сохраняю тексты…';
      const r = await putFile('content.js', b64enc(serialize(content)), 'Админка: правки содержимого сайта', sha);
      sha = r.content.sha;
      saved = JSON.stringify(content);
      // 3. удалённые фото
      for (const p of removed) { try { await deleteFile(p, 'Админка: удалено фото'); } catch (e) { /* уже удалено */ } }
      removed.clear();
      renderPhotos(); renderTexts(); updatePublish();
      toast('Опубликовано. Сайт обновится примерно через минуту.', 5000);
    } catch (e) {
      if (e.status === 409 || e.status === 422) toast('Файл на сайте уже изменился (например, из другой вкладки). Обновите страницу и повторите правки.', 8000);
      else if (e.status === 401 || e.status === 403) toast('GitHub не принял токен. Войдите заново.', 6000);
      else toast('Не удалось опубликовать. Проверьте интернет и попробуйте ещё раз.', 6000);
    } finally {
      btn.disabled = false; btn.textContent = 'Опубликовать';
      if (dirty()) $('#publish-text').textContent = 'Есть несохранённые правки — они появятся на сайте после публикации';
    }
  });

  /* ===== Подключения ===== */
  const REDIRECT = `${location.origin}${location.pathname}`;
  const renderSettings = () => {
    const body = $('#settings-body');
    const c = content.config, base = JSON.parse(saved).config;
    const hasToken = !!store.get(LS.ym);
    body.innerHTML = `<div class="settings">
      <div class="card" id="set-ym">
        <h2>Яндекс Метрика</h2>
        <p class="muted">Метрика считает посещения и действия на сайте. Номер счётчика публикуется на сайт, токен хранится только в этом браузере и нужен, чтобы показывать статистику здесь.</p>
        <div class="f-num"></div>
        <div class="titem"><div class="t-top"><span>Доступ к статистике</span></div>
          <p>${hasToken ? '<span class="ok">Подключено ✓</span> <button type="button" class="link" id="ym-off">Отключить</button>' : 'Не подключено'}</p></div>
        <div class="f-tok"></div>
        <details class="howto"><summary>Как подключить Метрику</summary>
          <ol class="steps">
            <li>Создайте счётчик на <a href="https://metrika.yandex.ru/add" target="_blank" rel="noopener">metrika.yandex.ru</a>: адрес сайта <code>maksim431.github.io</code>, включите Вебвизор. Номер счётчика вставьте выше и нажмите «Опубликовать» — сайт начнёт отправлять данные.</li>
            <li>Создайте приложение на <a href="https://oauth.yandex.ru/client/new" target="_blank" rel="noopener">oauth.yandex.ru</a>: платформа «Веб-сервисы», Redirect URI <code>${esc(REDIRECT)}</code>, доступ «Яндекс Метрика → Получение статистики, чтение параметров своих и доверенных счётчиков».</li>
            <li>Скопируйте ClientID приложения в поле ниже и нажмите «Войти через Яндекс». Либо получите токен вручную и вставьте его в поле «OAuth-токен».</li>
            <li>Создайте цели из списка «Цели» ниже (раздел «Цели» в настройках счётчика → «JavaScript-событие»).</li>
          </ol>
        </details>
        <div class="f-client"></div>
      </div>
      <div class="card">
        <div class="card-head"><h2>Цели</h2><span class="muted" id="goals-state"></span></div>
        <p class="muted">В Метрике: настройки счётчика → «Цели» → «Добавить цель» → тип «JavaScript-событие», идентификатор — из таблицы. Нажмите на идентификатор, чтобы скопировать.</p>
        <table class="tbl" id="goals-tbl"><thead><tr><th>Цель</th><th>Идентификатор</th><th>В Метрике</th></tr></thead><tbody></tbody></table>
      </div>
      <div class="card">
        <h2>Мессенджеры</h2>
        <p class="muted">Куда ведут кнопки «Написать в Telegram / ВК / MAX». Пока ссылки пустые, кнопки показывают «Ссылка появится позже».</p>
        <div class="f-links" style="display:grid;gap:12px"></div>
      </div>
      <div class="card">
        <h2>Доступ к сайту</h2>
        <p>Вход через токен GitHub: <span class="ok">подключено ✓</span>. Правки сохраняются в репозиторий <code>${REPO}</code>.</p>
      </div>
    </div>`;
    $('.f-num', body).appendChild(field({ label: 'Номер счётчика', value: c.metrikaId || '', def: base.metrikaId || '', multiline: false,
      onInput: v => { c.metrikaId = v.replace(/\D/g, ''); } }));
    const tok = field({ label: 'OAuth-токен (только для этого браузера)', value: '', multiline: false, type: 'password', onInput: () => {} });
    const tb = document.createElement('button'); tb.type = 'button'; tb.className = 'btn btn-ghost btn-sm'; tb.textContent = 'Сохранить токен';
    tb.onclick = () => { const v = tok._inp.value.trim(); if (!v) return; store.set(LS.ym, v); toast('Токен сохранён'); renderSettings(); loadStats(); };
    tok.appendChild(tb); $('.f-tok', body).appendChild(tok);
    const cl = field({ label: 'ClientID приложения Яндекса', value: store.get(LS.ymClient), multiline: false, onInput: v => store.set(LS.ymClient, v.trim()) });
    const lb = document.createElement('button'); lb.type = 'button'; lb.className = 'btn btn-primary btn-sm'; lb.textContent = 'Войти через Яндекс';
    lb.onclick = () => {
      const id = store.get(LS.ymClient);
      if (!id) { toast('Сначала вставьте ClientID'); return; }
      location.href = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${encodeURIComponent(id)}&redirect_uri=${encodeURIComponent(REDIRECT)}`;
    };
    cl.appendChild(lb); $('.f-client', body).appendChild(cl);
    const off = $('#ym-off', body);
    if (off) off.onclick = () => { store.set(LS.ym, ''); renderSettings(); loadStats(); };
    const L = c.links, LB = base.links || {};
    [['telegram', 'Telegram', 'https://t.me/username'], ['vk', 'ВКонтакте (личные сообщения)', 'https://vk.me/username'], ['max', 'MAX', 'https://max.ru/…'], ['vkGroup', 'Группа ВКонтакте', 'https://vk.com/group']]
      .forEach(([k, label, ph]) => {
        const f = field({ label, value: L[k] || '', def: LB[k] || '', multiline: false, type: 'url', onInput: v => { L[k] = v.trim(); } });
        f._inp.placeholder = ph;
        $('.f-links', body).appendChild(f);
      });
    renderGoals();
  };
  let ymGoals = null;   // идентификатор цели → id цели в Метрике
  const renderGoals = () => {
    const tb = $('#goals-tbl tbody');
    if (!tb) return;
    tb.innerHTML = GOALS.map(([gid, name]) => {
      const st = !ymGoals ? '<span class="tag">—</span>' : ymGoals[gid] ? '<span class="tag good">создана</span>' : '<span class="tag warn">не создана</span>';
      return `<tr><td>${esc(name)}</td><td><button type="button" class="copy" data-copy="${gid}">${gid}</button></td><td>${st}</td></tr>`;
    }).join('');
    $$('[data-copy]', tb).forEach(b => b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(b.dataset.copy); toast(`Скопировано: ${b.dataset.copy}`); });
    const s = $('#goals-state');
    if (s) s.textContent = ymGoals ? `создано ${GOALS.filter(g => ymGoals[g[0]]).length} из ${GOALS.length}` : '';
  };

  /* ===== Статистика ===== */
  const YM = 'https://api-metrika.yandex.net';
  const ym = async (path, params) => {
    const qs = new URLSearchParams({ lang: 'ru', accuracy: 'full', ...params });
    const r = await fetch(`${YM}${path}?${qs}`, { headers: { Authorization: `OAuth ${store.get(LS.ym)}` } });
    if (!r.ok) { const e = new Error(`YM ${r.status}`); e.status = r.status; try { e.body = await r.json(); } catch (x) { /* пусто */ } throw e; }
    return r.json();
  };
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let period = { days: Number(store.get(LS.days) || 7) };
  const range = () => {
    if (period.d1) return [period.d1, period.d2];
    const to = new Date(), from = new Date();
    from.setDate(to.getDate() - Math.max(0, period.days - 1));
    return [ymd(from), ymd(to)];
  };
  const syncPeriod = () => {
    $$('#period button').forEach(b => b.setAttribute('aria-pressed', String(!period.d1 && Number(b.dataset.days) === period.days)));
    const [a, b] = range(); $('#d1').value = a; $('#d2').value = b;
  };
  $$('#period button').forEach(b => b.addEventListener('click', () => { period = { days: Number(b.dataset.days) }; store.set(LS.days, b.dataset.days); syncPeriod(); loadStats(); }));
  ['#d1', '#d2'].forEach(s => $(s).addEventListener('change', () => {
    const a = $('#d1').value, b = $('#d2').value;
    if (a && b && a <= b) { period = { d1: a, d2: b }; syncPeriod(); loadStats(); }
  }));

  const fmt = n => Math.round(n).toLocaleString('ru-RU');
  const pct = (a, b) => b ? `${(a / b * 100).toLocaleString('ru-RU', { maximumFractionDigits: a / b < .1 ? 1 : 0 })}%` : '—';
  const dur = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

  const onboarding = () => {
    const id = content.config.metrikaId, tok = store.get(LS.ym);
    $('#stats-sub').textContent = 'Данные Яндекс Метрики';
    $('#stats-body').innerHTML = `<div class="card empty">
      <h2>${id ? 'Осталось открыть доступ к статистике' : 'Подключите Яндекс Метрику'}</h2>
      <p class="muted">Сайт уже отправляет события: открытие подарка, переключение наборов, клики «Забронировать» и переходы в мессенджеры, до какого блока дочитали. Чтобы видеть их здесь, ${id ? 'нужен токен доступа к Метрике' : 'нужен счётчик Метрики и токен доступа'}.</p>
      <ol class="steps">
        <li>${id ? '✓ Номер счётчика указан' : 'Создайте счётчик и укажите его номер'}</li>
        <li>${tok ? '✓ Токен сохранён' : 'Откройте доступ к статистике (токен)'}</li>
        <li>Создайте цели по списку</li>
      </ol>
      <button type="button" class="btn btn-primary" id="go-settings">Перейти к подключению</button>
    </div>`;
    $('#go-settings').onclick = () => openTab('settings');
  };

  const SRC_EMPTY = 'Нет данных за этот период';
  // столбики по дням: одна серия, подписи оси Y и дат, подсказка при наведении
  const columns = (days, vals, extra) => {
    const W = 760, H = 240, padL = 36, padB = 26, padT = 10;
    const max = Math.max(1, ...vals), step = niceStep(max);
    const top = Math.ceil(max / step) * step;
    const n = vals.length, slot = (W - padL) / n, bw = Math.min(24, Math.max(3, slot * .62));
    const y = v => padT + (H - padT - padB) * (1 - v / top);
    let g = '';
    for (let v = 0; v <= top; v += step) g += `<line class="gridline" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${padL - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`;
    const every = Math.ceil(n / 8);
    let bars = '';
    vals.forEach((v, i) => {
      const x = padL + slot * i + (slot - bw) / 2, yy = y(v), h = Math.max(0, H - padB - yy);
      const r = Math.min(4, bw / 2, h);
      const d = h > 0 ? `M${x},${H - padB} V${yy + r} Q${x},${yy} ${x + r},${yy} H${x + bw - r} Q${x + bw},${yy} ${x + bw},${yy + r} V${H - padB} Z` : '';
      bars += `<rect class="hit" x="${padL + slot * i}" y="${padT}" width="${slot}" height="${H - padT - padB}" data-i="${i}"/>${d ? `<path class="bar" d="${d}"/>` : ''}`;
      if (i % every === 0) bars += `<text class="axis" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle">${days[i].slice(8, 10)}.${days[i].slice(5, 7)}</text>`;
    });
    const wrap = document.createElement('div');
    wrap.className = 'chart';
    wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Визиты по дням">${g}${bars}</svg><div class="tip" hidden></div>`;
    const tip = $('.tip', wrap), svg = $('svg', wrap);
    $$('.hit', svg).forEach(h => {
      h.addEventListener('mouseenter', () => {
        const i = Number(h.dataset.i);
        const rs = svg.getBoundingClientRect(), k = rs.width / W;
        const d = new Date(days[i]);
        tip.innerHTML = `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}<br><b>${fmt(vals[i])}</b> визитов${extra ? ` · ${fmt(extra[i])} посетителей` : ''}`;
        tip.style.left = `${(padL + slot * i + slot / 2) * k}px`;
        tip.style.top = `${y(vals[i]) * k}px`;
        tip.hidden = false;
      });
      h.addEventListener('mouseleave', () => { tip.hidden = true; });
    });
    return wrap;
  };
  const niceStep = max => { const raw = max / 4, p = 10 ** Math.floor(Math.log10(raw)), f = raw / p; return Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p); };
  const hbars = (rows, total) => {
    const max = Math.max(1, ...rows.map(r => r[1]));
    if (!rows.length) return `<p class="muted">${SRC_EMPTY}</p>`;
    return `<div class="hbars">${rows.map(([name, v, note]) => `<div class="hbar" title="${esc(name)}: ${fmt(v)}">
      <span class="h-name">${esc(name)}</span><span class="h-track"><span class="h-fill" style="width:${v / max * 100}%"></span></span>
      <span class="h-val">${fmt(v)}${total ? `<small>${note || pct(v, total)}</small>` : ''}</span></div>`).join('')}</div>`;
  };

  let statsReq = 0;
  const loadStats = async () => {
    if (!content) return;
    const id = content.config.metrikaId, tok = store.get(LS.ym);
    syncPeriod();
    if (!id || !tok) { onboarding(); return; }
    const req = ++statsReq;
    const [date1, date2] = range();
    const P = { ids: id, date1, date2 };
    $('#stats-body').innerHTML = '<div class="kpis">' + '<div class="card skeleton" style="height:96px"></div>'.repeat(4) + '</div><div class="card"><div class="skeleton" style="height:240px"></div></div>';
    $('#stats-sub').innerHTML = `Счётчик ${esc(id)} · <a href="https://metrika.yandex.ru/dashboard?id=${esc(id)}" target="_blank" rel="noopener">Открыть в Метрике</a> · <a href="https://metrika.yandex.ru/stat/visor?id=${esc(id)}" target="_blank" rel="noopener">Вебвизор</a>`;
    try {
      const [tot, byt, gl, src, dev] = await Promise.all([
        ym('/stat/v1/data', { ...P, metrics: 'ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds' }),
        ym('/stat/v1/data/bytime', { ...P, metrics: 'ym:s:visits,ym:s:users', group: 'day' }),
        ym(`/management/v1/counter/${id}/goals`, {}),
        ym('/stat/v1/data', { ...P, metrics: 'ym:s:visits', dimensions: 'ym:s:lastTrafficSource', sort: '-ym:s:visits', limit: 8 }),
        ym('/stat/v1/data', { ...P, metrics: 'ym:s:visits', dimensions: 'ym:s:deviceCategory', sort: '-ym:s:visits' }),
      ]);
      // цели: идентификатор JavaScript-события → id цели
      ymGoals = {};
      (gl.goals || []).forEach(g => (g.conditions || []).forEach(cnd => { if (cnd.url) ymGoals[cnd.url] = g.id; }));
      renderGoals();
      const found = GOALS.filter(([gid]) => ymGoals[gid]);
      const gv = {};   // идентификатор → [визиты с целью, достижения]
      for (let i = 0; i < found.length; i += 10) {
        const part = found.slice(i, i + 10);
        const r = await ym('/stat/v1/data', { ...P, metrics: part.map(([gid]) => `ym:s:goal${ymGoals[gid]}visits,ym:s:goal${ymGoals[gid]}reaches`).join(',') });
        part.forEach(([gid], j) => { gv[gid] = [r.totals[j * 2] || 0, r.totals[j * 2 + 1] || 0]; });
      }
      if (req !== statsReq) return;
      renderStats({ tot: tot.totals, byt, gv, src, dev, found });
    } catch (e) {
      if (req !== statsReq) return;
      const msg = e.status === 401 || e.status === 403 ? 'Метрика не приняла токен: он устарел или у него нет доступа к этому счётчику. Получите новый в «Подключениях».'
        : e.status === 404 || e.status === 400 ? 'Метрика не нашла счётчик с таким номером. Проверьте номер в «Подключениях».'
          : 'Не удалось загрузить статистику. Проверьте интернет и обновите страницу.';
      $('#stats-body').innerHTML = `<div class="card empty"><h2>Статистика недоступна</h2><p class="muted">${msg}</p><button type="button" class="btn btn-ghost" id="go-settings">Подключения</button></div>`;
      $('#go-settings').onclick = () => openTab('settings');
    }
  };

  const renderStats = ({ tot, byt, gv, src, dev, found }) => {
    const [visits, users, views, bounce, avg] = tot;
    const g = id => (gv[id] || [0, 0]);
    const leads = g('msg_any')[0];
    const body = $('#stats-body');
    body.innerHTML = '';
    const wrap = document.createElement('div'); wrap.className = 'stats';
    // главные цифры
    const kpi = (label, val, sub) => `<div class="card kpi"><span class="k-label">${label}</span><span class="k-val">${val}</span><span class="k-sub">${sub || '&nbsp;'}</span></div>`;
    wrap.insertAdjacentHTML('beforeend', `<div class="kpis">
      ${kpi('Визиты', fmt(visits), `${fmt(views)} просмотров`)}
      ${kpi('Посетители', fmt(users), visits ? `${(visits / Math.max(1, users)).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} визита на человека` : '')}
      ${kpi('Заявки в мессенджеры', fmt(leads), ymGoals.msg_any ? `${pct(leads, visits)} визитов` : 'цель msg_any не создана')}
      ${kpi('Отказы', `${Math.round(bounce || 0)}%`, `время на сайте ${dur(avg || 0)}`)}
    </div>`);
    // визиты по дням
    const days = (byt.time_intervals || []).map(t => t[0].slice(0, 10));
    const row = (byt.data && byt.data[0]) || { metrics: [[], []] };
    const daily = document.createElement('div'); daily.className = 'card';
    daily.innerHTML = '<div class="card-head"><h2>Визиты по дням</h2></div>';
    if (days.length) daily.appendChild(columns(days, row.metrics[0].map(Number), row.metrics[1].map(Number)));
    else daily.insertAdjacentHTML('beforeend', `<p class="muted">${SRC_EMPTY}</p>`);
    wrap.appendChild(daily);
    // воронка по блокам
    const FUNNEL = [['gift_open', 'Открыли подарок'], ['block_sets', 'Наборы'], ['block_time', 'Сколько вяжу'], ['video_done', 'Видео до конца'], ['block_left', 'Сколько осталось'], ['block_terms', 'Сроки'], ['block_about', 'Обо мне'], ['block_book', 'Займите набор'], ['block_faq', 'Частые вопросы'], ['msg_any', 'Написали в мессенджер']];
    const fr = [['Все визиты', visits]].concat(FUNNEL.filter(([id]) => ymGoals[id]).map(([id, n]) => [n, g(id)[0]]));
    const grid = document.createElement('div'); grid.className = 'grid2';
    grid.insertAdjacentHTML('beforeend', `<div class="card"><div class="card-head"><h2>До какого блока дочитали</h2><p class="muted">% от всех визитов</p></div>
      ${found.length ? hbars(fr, visits) : '<p class="muted">Создайте цели в «Подключениях», и здесь появится воронка по блокам.</p>'}</div>`);
    const ACT = [['set_select', 'Переключали наборы'], ['item_open', 'Открывали описание предмета'], ['want_set', 'Нажали «Хочу набор»'], ['book_click', 'Нажали «Забронировать»'], ['faq_open', 'Читали частые вопросы'], ['msg_telegram', 'Telegram'], ['msg_vk', 'ВКонтакте'], ['msg_max', 'MAX']];
    const ar = ACT.filter(([id]) => ymGoals[id]).map(([id, n]) => [n, g(id)[0], `${fmt(g(id)[1])} раз`]);
    grid.insertAdjacentHTML('beforeend', `<div class="card"><div class="card-head"><h2>Что делали на сайте</h2><p class="muted">визиты · сколько раз всего</p></div>
      ${ar.length ? hbars(ar, visits) : '<p class="muted">Создайте цели в «Подключениях».</p>'}</div>`);
    const srcRows = (src.data || []).map(d => [d.dimensions[0].name || 'Не определено', d.metrics[0]]);
    const devRows = (dev.data || []).map(d => [d.dimensions[0].name || 'Не определено', d.metrics[0]]);
    grid.insertAdjacentHTML('beforeend', `<div class="card"><div class="card-head"><h2>Откуда пришли</h2></div>${hbars(srcRows, visits)}</div>`);
    grid.insertAdjacentHTML('beforeend', `<div class="card"><div class="card-head"><h2>Устройства</h2></div>${hbars(devRows, visits)}</div>`);
    wrap.appendChild(grid);
    // все цели таблицей
    wrap.insertAdjacentHTML('beforeend', `<div class="card"><div class="card-head"><h2>Все цели</h2><p class="muted">таблица для точных чисел</p></div>
      <table class="tbl"><thead><tr><th>Цель</th><th class="num">Визиты с целью</th><th class="num">Конверсия</th><th class="num">Достижения</th></tr></thead><tbody>
      ${GOALS.map(([id, name]) => ymGoals[id] ? `<tr><td>${esc(name)}</td><td class="num">${fmt(g(id)[0])}</td><td class="num">${pct(g(id)[0], visits)}</td><td class="num">${fmt(g(id)[1])}</td></tr>`
        : `<tr><td>${esc(name)}</td><td colspan="3" class="num"><span class="tag warn">не создана в Метрике</span></td></tr>`).join('')}
      </tbody></table></div>`);
    body.appendChild(wrap);
  };

  /* ===== Запуск ===== */
  // возврат после входа через Яндекс: токен приходит в адресе после #
  const m = location.hash.match(/access_token=([^&]+)/);
  if (m) { store.set(LS.ym, decodeURIComponent(m[1])); history.replaceState(null, '', `${location.pathname}#tab=stats`); setTimeout(() => toast('Метрика подключена'), 300); }
  if (store.get(LS.gh)) showApp(); else showLogin();
})();
