/* Страницы под запросы покупателей. Подключается из tools/build-seo.mjs, отдельно не запускается.
   Все цены, составы, сроки, ссылки и ответы берутся из content.js — после правок в админке страницы обновляются
   тем же запуском `node tools/build-seo.mjs`.

   Принципы (по рекомендациям Яндекса для Поиска и Алисы AI): страница отвечает на конкретный вопрос покупателя,
   главный ответ стоит в начале, заголовки — вопросы, только проверяемые факты о наборах, доставке и мастере. */

export function buildPages(ctx) {
  const { C, SITE, links, orgId, deadlineText, today, total, SETS, COMP, LABEL, STEPS, ABOUT, ABOUT_TITLE, kidsText, NAV, YM, esc, plain, dot, fmt } = ctx;

  const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
  const price = k => `${fmt(C.sets[k].price)} ₽`;
  const D = C.details || {};
  const dTitle = k => plain((D[k] || {}).title || '');
  const dPhoto = k => { const p = ((D[k] || {}).photos || [])[0]; return p ? '/' + p.replace(/^\//, '') : ''; };
  const KNIT = new Set(['grinch', 'grinch2', 'lamb', 'mitten']);
  const hoursOf = k => { const m = plain((D[k] || {}).text || '').match(/за (\d+) час/); return m ? +m[1] : 0; };
  const heightOf = k => { const m = plain((D[k] || {}).text || '').match(/Высота: (\d+(?:[.,]\d+)?) см/); return m ? m[1] : ''; };
  const hoursWord = n => (n % 10 === 1 && n % 100 !== 11 ? 'час' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'часа' : 'часов');
  const faqA = start => { const f = C.faq.find(([q]) => plain(q).startsWith(start)); return f ? plain(f[1]) : ''; };
  const setLabel = k => COMP[k].map(i => LABEL[i]).join('; ');
  const tg = links.telegram, vk = links.vk, mx = links.max;

  const btn = (href, label, cls = '') => (href ? `<a class="btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>` : '');
  const cta = `    <section class="cta">
      <h2>Заказать набор</h2>
      <p>Напишите, какой набор хотите и что подписать на открытке. Остальное подскажу в переписке. Всего к Новому году делаю ${total} наборов, приём заказов до ${esc(deadlineText)}.</p>
      <div class="btns">
        ${[btn(tg, 'Написать в Telegram'), btn(vk, 'Написать в ВК'), btn(mx, 'Написать в MAX')].filter(Boolean).join('\n        ')}
        <a class="btn btn-ghost" href="/">Все наборы на главной</a>
      </div>
    </section>`;
  const photoStrip = ids => {
    const items = ids.filter(i => dPhoto(i)).map(i => `<img src="${esc(dPhoto(i))}" width="1200" height="1600" loading="lazy" alt="${esc(`Набор для подарка: ${LABEL[i]}`)}">`);
    return items.length ? `    <div class="photos">\n      ${items.join('\n      ')}\n    </div>` : '';
  };
  const itemList = ids => `    <ul>\n${ids.map(i => `      <li><strong>${esc(dTitle(i))}.</strong> ${esc(dot(plain((D[i] || {}).text || '')))}</li>`).join('\n')}\n    </ul>`;

  /* ---------- оболочка страницы ---------- */
  const shell = ({ slug, navLabel, title, description, h1, body }) => {
    const url = `${SITE}/${slug}/`;
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: h1, description, inLanguage: 'ru-RU', dateModified: today, isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': orgId } },
        { '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: navLabel, item: url },
        ] },
      ],
    };
    return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
  <meta name="theme-color" content="#0b3a20">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Drinknit">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${SITE}/assets/og-cover.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/assets/favicon-32.png" type="image/png" sizes="32x32">
  <link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>
  <link rel="stylesheet" href="/assets/pages.css?v=${today.replace(/-/g, '')}">
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2).replace(/<\/script/gi, '<\\/script').replace(/^/gm, '  ')}
  </script>
  <!-- Yandex.Metrika counter -->
  <script type="text/javascript">
      (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
      })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM}', 'ym');

      ym(${YM}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
  </script>
  <!-- /Yandex.Metrika counter -->
</head>
<body>
  <noscript><div><img src="https://mc.yandex.ru/watch/${YM}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
  <header class="site-head">
    <div class="wrap">
      <a class="logo" href="/"><img src="/assets/d/logo.svg" width="198" height="112" alt="Drinknit — вещи ручной работы"></a>
      <nav class="nav" aria-label="Разделы">
        <a href="/">Главная</a>
${NAV.map(([href, label]) => `        <a href="${href}"${href === `/${slug}/` ? ' aria-current="page"' : ''}>${esc(label)}</a>`).join('\n')}
      </nav>
    </div>
  </header>
  <main>
    <div class="wrap">
    <nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a> / ${esc(navLabel)}</nav>
    <h1>${esc(h1)}</h1>
${body}
${cta}
    </div>
  </main>
  <footer class="site-foot">
    <div class="wrap">
      <nav aria-label="Разделы"><a href="/">Главная</a>${NAV.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join('')}</nav>
      <p>Drinknit — новогодние наборы с вязаными игрушками ручной работы. Нижний Новгород, доставка по России.</p>
      <p>Цены указаны в рублях. Изделия ручной работы, внешний вид может немного отличаться от фото. Доставка оплачивается отдельно по тарифу службы.</p>
      <p>© ${today.slice(0, 4)} Drinknit</p>
    </div>
  </footer>
</body>
</html>
`;
  };

  const pages = [];

  /* ---------- 1. Какой набор выбрать ---------- */
  {
    const slug = 'kakoy-nabor-vybrat';
    const knit = k => COMP[k].filter(i => KNIT.has(i)).map(i => LABEL[i]).join('; ');
    const ready = k => COMP[k].filter(i => !KNIT.has(i)).map(i => LABEL[i]).join('; ');
    const rows = [
      ['Цена', k => price(k)],
      ['Для кого', k => plain(C.sets[k].forWhom)],
      ['Время вязания', k => plain(C.sets[k].hours)],
      ['Вязаные игрушки', knit],
      ['Готовые предметы', ready],
    ];
    const diffL = hoursOf('grinch2') && hoursOf('grinch') ? hoursOf('grinch2') - hoursOf('grinch') : 0;
    const body = `    <p class="lead">Коротко: набор S за ${price('S')} — ${esc(lc(plain(C.sets.S.forWhom)))}. Набор M за ${price('M')} — ${esc(lc(plain(C.sets.M.forWhom)))}. Набор L за ${price('L')} — ${esc(lc(plain(C.sets.L.forWhom)))}.</p>
    <div class="grid">
${SETS.map(k => `      <div class="card">
        <img src="/assets/d/card-${k}.webp" width="1100" height="821" loading="lazy" alt="Новогодний набор ${k} с вязаными игрушками">
        <div class="pad"><h3>Набор ${k} — ${price(k)}</h3><p>${esc(dot(plain(C.sets[k].forWhom)))}</p></div>
      </div>`).join('\n')}
    </div>
    <h2>Чем отличаются наборы S, M и L</h2>
    <div class="tbl"><table>
      <thead><tr><th scope="col"></th>${SETS.map(k => `<th scope="col">Набор ${k}</th>`).join('')}</tr></thead>
      <tbody>
${rows.map(([name, fn]) => `        <tr><th scope="row">${name}</th>${SETS.map(k => `<td>${esc(fn(k))}</td>`).join('')}</tr>`).join('\n')}
      </tbody>
    </table></div>
    <p>Набор S собирается в подарочный пакет, набор M — в коробку. Состав наборов собран заранее и не меняется, но можно написать мне и обсудить детали. Открытку в любом наборе подпишу от руки вашим текстом.</p>
    <h2>Какой набор выбрать для учителя, воспитателя или коллеги?</h2>
    <p>${esc(dot(plain(C.sets.S.forWhom)))} Набор S за ${price('S')}: ${esc(setLabel('S'))}. Подробнее — на странице <a href="/podarok-uchitelyu/">«Подарок учителю, воспитателю и коллеге»</a>.</p>
    <h2>Какой набор выбрать ребёнку?</h2>
    <p>${esc(kidsText)}</p>
    <h2>Чем набор L отличается от набора M?</h2>
    <p>В наборе M (${price('M')}) большая игрушка «Зелёный воришка»${heightOf('grinch') ? ` высотой ${esc(heightOf('grinch'))} см` : ''}. В наборе L (${price('L')}) — более детализированная и проработанная версия этой игрушки${heightOf('grinch2') ? ` высотой ${esc(heightOf('grinch2'))} см` : ''} и в придачу мягкий козлик${heightOf('goat') ? ` высотой ${esc(heightOf('goat'))} см` : ''}.${diffL ? ` На детализированную игрушку уходит на ${diffL} ${hoursWord(diffL)} больше ручной работы, чем на игрушку в наборе M.` : ''}</p>
    <h2>Из чего сделаны игрушки?</h2>
    <p>${esc(faqA('Из чего') || 'Игрушки связаны из хлопковой и акриловой пряжи.')} Мелкие детали держатся на безопасном креплении. Каждая игрушка немного отличается от фото, потому что связана вручную.</p>
    <h2>Сколько наборов осталось?</h2>
    <p>К Новому году я успеваю сделать только ${total} наборов, приём заказов до ${esc(deadlineText)}. Сколько наборов ещё свободно, показано на <a href="/">главной странице</a>. Как получить и оплатить набор — на странице <a href="/dostavka-i-oplata/">«Доставка и оплата»</a>.</p>`;
    pages.push({
      slug, html: shell({
        slug, navLabel: NAV[0][1],
        title: 'Какой новогодний набор выбрать: S, M или L — Drinknit',
        description: `Сравнение новогодних наборов с вязаными игрушками: S за ${price('S')}, M за ${price('M')}, L за ${price('L')}. Состав, время вязания и для кого подходит каждый набор.`,
        h1: 'Какой новогодний набор выбрать: S, M или L', body,
      }),
    });
  }

  /* ---------- 2. Подарок учителю, воспитателю и коллеге ---------- */
  {
    const slug = 'podarok-uchitelyu';
    const body = `    <p class="lead">Недорогой личный подарок на Новый год — набор S за ${price('S')}: ${esc(setLabel('S'))}. Игрушки вяжу вручную, набор собираю за 1–3 дня после предоплаты.</p>
    <h2>Сколько стоит подарок учителю или воспитателю?</h2>
    <p>Набор S стоит ${price('S')}: две маленькие вязаные игрушки, крем для рук и открытка в подарочном пакете. Если нужен подарок побольше, есть набор M за ${price('M')}: в нём ещё и большая игрушка. Сравнение всех наборов — на странице <a href="/kakoy-nabor-vybrat/">«Какой набор выбрать»</a>.</p>
    <h2>Что входит в набор S?</h2>
${itemList(COMP.S)}
${photoStrip(['lamb', 'mitten', 'card'])}
    <h2>Что написать на открытке учителю или коллеге?</h2>
    <p>Текст может быть любым: пришлите его в сообщении, когда будете заказывать, и я подпишу открытку от руки. Несколько идей:</p>
    <ul class="ideas">
      <li>«Спасибо, что вкладываете в детей душу и время. С Новым годом!»</li>
      <li>«Спасибо за терпение и тёплое слово. Пусть в новом году будет больше радостных дней.»</li>
      <li>«С Новым годом! Спасибо, что с вами легко и надёжно работать.»</li>
      <li>«Пусть новый год принесёт спокойствие, хорошие новости и время для себя.»</li>
    </ul>
    <h2>Как заказать и до какого числа успеть?</h2>
    <ol>
${STEPS.map(s => `      <li>${esc(s)}</li>`).join('\n')}
    </ol>
    <p>Заказы принимаю до ${esc(deadlineText)} или пока не закончатся ${total} наборов. Чтобы подарок успел к празднику, напишите заранее: отправка по России зависит от службы доставки. Подробнее — на странице <a href="/dostavka-i-oplata/">«Доставка и оплата»</a>.</p>`;
    pages.push({
      slug, html: shell({
        slug, navLabel: NAV[1][1],
        title: 'Подарок учителю, воспитателю и коллеге на Новый год — Drinknit',
        description: `Подарок учителю, воспитателю или коллеге на Новый год: набор S с вязаными игрушками, кремом и открыткой с вашим текстом за ${price('S')}. Нижний Новгород, доставка по России.`,
        h1: `Подарок учителю, воспитателю и коллеге на Новый год: вязаный набор за ${price('S')}`, body,
      }),
    });
  }

  /* ---------- 3. Доставка и оплата ---------- */
  {
    const slug = 'dostavka-i-oplata';
    const body = `    <p class="lead">Набор можно забрать самовывозом в Нижнем Новгороде (район ТЦ «Фантастика»), получить Яндекс Доставкой по городу или отправкой по России: СДЭК, Яндекс, Ozon или Почта России. Оплата — 100% предоплата за набор переводом на карту. Доставку оплачиваете отдельно по тарифу службы.</p>
    <h2>Как получить набор?</h2>
    <ul>
      <li><strong>Самовывоз в Нижнем Новгороде</strong> — район ТЦ «Фантастика».</li>
      <li><strong>Яндекс Доставка по городу</strong> — доставка по Нижнему Новгороду.</li>
      <li><strong>Отправка по России</strong> — СДЭК, Яндекс, Ozon или Почта России, на выбор.</li>
    </ul>
    <h2>Сколько стоит доставка?</h2>
    <p>Доставка не входит в цену набора и оплачивается отдельно по тарифу выбранной службы. Цены наборов: S — ${price('S')}, M — ${price('M')}, L — ${price('L')}.</p>
    <h2>Как оплатить набор?</h2>
    <p>Я ставлю ваш набор в очередь, и вы вносите 100% предоплату за набор переводом на карту.</p>
    <h2>Сколько делается набор?</h2>
    <p>${esc(faqA('Сколько делается') || 'От 1 до 3 дней с момента предоплаты, в зависимости от размера набора.')} На вязание уходит: набор S — ${esc(plain(C.sets.S.hours))}, набор M — ${esc(plain(C.sets.M.hours))}, набор L — ${esc(plain(C.sets.L.hours))}.</p>
    <h2>До какого числа можно заказать?</h2>
    <p>До ${esc(deadlineText)} или пока не закончатся ${total} наборов — что наступит раньше. Чтобы набор успел к празднику, пишите заранее: сначала набор делается 1–3 дня, а потом его отправляет служба доставки.</p>
    <h2>Как заказать?</h2>
    <ol>
${STEPS.map(s => `      <li>${esc(s)}</li>`).join('\n')}
    </ol>
    <h2>Можно ли изменить состав набора или текст открытки?</h2>
    <p>${esc(faqA('Можно поменять') || 'Наборы собраны заранее, их состав не меняется. Но вы можете написать мне, и мы обсудим детали.')} На открытке можно написать любой текст: пришлите его при заказе, я подпишу от руки. Какой набор выбрать — на странице <a href="/kakoy-nabor-vybrat/">«Какой набор выбрать»</a>.</p>`;
    pages.push({
      slug, html: shell({
        slug, navLabel: NAV[2][1],
        title: 'Доставка и оплата наборов с вязаными игрушками — Drinknit',
        description: 'Доставка и оплата наборов с вязаными игрушками: самовывоз в Нижнем Новгороде, доставка по городу и по России (СДЭК, Яндекс, Ozon, Почта). Предоплата 100%.',
        h1: 'Доставка и оплата новогодних наборов с вязаными игрушками', body,
      }),
    });
  }

  /* ---------- 4. О мастере ---------- */
  {
    const slug = 'o-masterskoy';
    const rows = ['grinch', 'grinch2', 'lamb', 'mitten'].filter(k => D[k]).map(k => {
      const h = hoursOf(k), cm = heightOf(k);
      return `        <tr><td>${esc(dTitle(k))}</td><td>${cm ? esc(cm) + ' см' : '—'}</td><td>${h ? `${h} ${hoursWord(h)}` : '—'}</td></tr>`;
    });
    const contact = (href, label) => (href ? `<li><a href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a></li>` : '');
    const body = `    <p class="lead">${esc(ABOUT_TITLE)}. Drinknit — это новогодние наборы с вязаными игрушками ручной работы из Нижнего Новгорода. Вязаные игрушки для наборов делаю вручную сама, а открытку подписываю от руки.</p>
    <h2>Кто делает наборы?</h2>
    <figure class="about-photo"><img src="/assets/d/katya.webp" width="1280" height="958" loading="lazy" alt="Катя, мастер Drinknit, вяжет игрушки 30 лет"></figure>
    <p>${esc(ABOUT)}</p>
    <h2>Как вяжутся игрушки?</h2>
    <p>${esc((C.cards || [])[0] ? plain(C.cards[0]) : 'Каждую деталь вяжу крючком сама, потом сшиваю и набиваю игрушку вручную.')} Поэтому к Новому году я успеваю сделать только ${total} наборов.</p>
    <div class="tbl"><table>
      <thead><tr><th scope="col">Игрушка</th><th scope="col">Высота</th><th scope="col">Время вязания</th></tr></thead>
      <tbody>
${rows.join('\n')}
      </tbody>
    </table></div>
    <h2>Из каких материалов сделаны игрушки?</h2>
    <p>${esc(faqA('Из чего') || 'Игрушки связаны из хлопковой и акриловой пряжи.')} Мелкие детали держатся на безопасном креплении.</p>
    <h2>Почему каждая игрушка немного отличается от фото?</h2>
    <p>Вязаные игрушки я делаю вручную, поэтому каждая получается чуть-чуть другой, и наборы тоже получаются немного разными.</p>
    <h2>Где находится мастерская и как со мной связаться?</h2>
    <p>Мастерская находится в Нижнем Новгороде. Самовывоз — район ТЦ «Фантастика», отправка по России — СДЭК, Яндекс, Ozon или Почтой России. Подробнее — на странице <a href="/dostavka-i-oplata/">«Доставка и оплата»</a>. Написать мне можно здесь:</p>
    <ul>
      ${[contact(tg, 'Telegram'), contact(vk, 'ВКонтакте (личные сообщения)'), contact(mx, 'MAX'), contact(links.vkGroup, 'Группа ВКонтакте'), contact(links.avito, 'Профиль на Авито')].filter(Boolean).join('\n      ')}
    </ul>`;
    pages.push({
      slug, html: shell({
        slug, navLabel: NAV[3][1],
        title: 'О мастере: Катя, вязаные игрушки ручной работы — Drinknit',
        description: 'Катя вяжет игрушки 30 лет: как делаются новогодние наборы Drinknit, из какой пряжи, сколько времени уходит на каждую игрушку. Нижний Новгород.',
        h1: ABOUT_TITLE, body,
      }),
    });
  }

  return pages;
}
