#!/usr/bin/env node
/* Сборка SEO-блоков из content.js (тексты, цены, вопросы — то, что правится в админке).

   Запуск из корня репозитория:   node tools/build-seo.mjs

   Что делает:
   1. index.html, между метками <!-- seo:jsonld:start/end --> в <head>: разметка schema.org (JSON-LD) —
      организация, три набора с ценами, частые вопросы.
   2. index.html, между метками <!-- seo:static:start/end --> в <body>: статический текст страницы для роботов,
      которые не выполняют JavaScript (ИИ-сервисы, часть поисковых роботов). Когда сайт запускается в браузере,
      скрипт в конце index.html убирает этот блок — посетитель его не видит.
   3. Обновляет title, description, og:title, og:description в index.html по content.js → meta.
   4. llms.txt — краткое описание сайта для ИИ.
   5. sitemap.xml — дата изменения становится сегодняшней.

   После правки текстов, цен или вопросов в админке запустите скрипт ещё раз и закоммитьте результат. */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPages } from './seo-pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://drinknit.ru';
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);

const sandbox = { window: {} };
vm.runInNewContext(read('content.js'), sandbox);
const C = sandbox.window.DRINKNIT_CONTENT;
if (!C || !C.sets || !C.faq) throw new Error('content.js: не найдено содержимое сайта');

/* ---------- помощники ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = s => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();
const dot = s => (/[.!?…»]$/.test(s) ? s : s + '.');
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const T = C.texts || {};
const override = (keyStart, fallback) => {
  const k = Object.keys(T).find(x => x.startsWith(keyStart) && typeof T[x] === 'string' && T[x].trim());
  return k ? plain(T[k]) : fallback;
};

const total = C.config.total;
const links = C.config.links || {};
// счётчик Метрики на обычных страницах (тот же код, что в index.html) и список разделов
const YM = Number(C.config?.metrikaId) || 0;
const NAV = [
  ['/kakoy-nabor-vybrat/', 'Какой набор выбрать'],
  ['/podarok-uchitelyu/', 'Подарок учителю'],
  ['/dostavka-i-oplata/', 'Доставка и оплата'],
  ['/o-masterskoy/', 'О мастере'],
];
const deadline = new Date(C.config.deadline);
const deadlineText = deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).replace(/\s*г\.$/, '');
const deadlineDate = new Date(deadline.getTime() + 3 * 3600 * 1000).toISOString().slice(0, 10);
const today = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(0, 10);

// состав наборов (как в LAYERS из data.js) и подписи предметов
const SETS = ['S', 'M', 'L'];
const COMP = {
  S: ['lamb', 'mitten', 'cream', 'card'],
  M: ['grinch', 'lamb', 'mitten', 'cream', 'card'],
  L: ['grinch2', 'goat', 'lamb', 'mitten', 'cream', 'card'],
};
const LABEL = {
  grinch: 'игрушка «Зелёный воришка», 20 см',
  grinch2: 'детализированная игрушка «Зелёный воришка», 22 см',
  lamb: 'вязаный козлик, 7 см',
  mitten: 'вязаная варежка, 7 см',
  goat: 'мягкий козлик с красным шарфом, 16 см',
  cream: 'крем для рук, 30 мл',
  card: 'открытка с вашим текстом, подписанная от руки',
};
const setLine = k => `${dot(plain(C.sets[k].forWhom))} ${dot(plain(C.sets[k].hours))}`;
const compLine = k => COMP[k].map(i => LABEL[i]).join('; ');

const STEPS = [
  'Напишите мне, какой набор хотите и какой текст написать на открытке.',
  'Я ставлю ваш набор в очередь. Вы вносите 100% предоплату за набор переводом на карту.',
  'Вяжу и собираю набор за 1–3 дня, в зависимости от размера набора.',
  'Получаете набор: самовывоз Нижний Новгород (район ТЦ Фантастика), Яндекс Доставка по городу или отправка по России (СДЭК / Яндекс / Озон / Почта). Доставку оплачиваете отдельно по тарифу службы.',
];
const ABOUT = 'Первые игрушки я вязала по схемам из журнала «Валентина». Сейчас придумываю свои: идеи беру из природы и ищу на небольших сайтах мастеров, куда редко заходят производители массовых игрушек.';
const ABOUT_TITLE = 'Привет, я Катя, вяжу игрушки 30 лет';

const timeTitle = override('time|Маленькую игрушку', 'Маленькую игрушку я вяжу 2 часа, среднюю 7 часов');
const timeLead = override('time|Поэтому', 'Поэтому к Новому году получится только 10 наборов, и все они будут немного разными');
const kidsText = override('kids|Пряжа', 'Глазки и мелкие детали держатся на безопасном креплении.');

/* ---------- JSON-LD ---------- */
const orgId = `${SITE}/#organization`;
const sameAs = [links.vkGroup, links.telegram, links.avito].filter(Boolean);
const graph = [
  { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Drinknit', inLanguage: 'ru-RU', publisher: { '@id': orgId } },
  {
    '@type': 'Organization', '@id': orgId, name: 'Drinknit', url: `${SITE}/`,
    logo: `${SITE}/assets/apple-touch-icon.png`,
    description: 'Новогодние наборы с вязаными игрушками ручной работы. Мастер Катя вяжет игрушки 30 лет, упаковывает набор и подписывает открытку вашим текстом.',
    address: { '@type': 'PostalAddress', addressLocality: 'Нижний Новгород', addressCountry: 'RU' },
    areaServed: { '@type': 'Country', name: 'Россия' },
    ...(sameAs.length ? { sameAs } : {}),
  },
  ...SETS.map(k => ({
    '@type': 'Product',
    '@id': `${SITE}/#set-${k.toLowerCase()}`,
    name: `Новогодний набор ${k} с вязаными игрушками`,
    description: `${setLine(k)} В наборе: ${compLine(k)}. Игрушки связаны вручную из хлопковой и акриловой пряжи.`,
    image: `${SITE}/assets/d/card-${k}.webp`,
    brand: { '@type': 'Brand', name: 'Drinknit' },
    material: 'хлопок, акрил',
    offers: {
      '@type': 'Offer', url: `${SITE}/#sets`,
      price: String(C.sets[k].price), priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: deadlineDate, seller: { '@id': orgId },
    },
  })),
  {
    '@type': 'FAQPage', '@id': `${SITE}/#faq`, inLanguage: 'ru-RU',
    mainEntity: C.faq.map(([q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } })),
  },
];
const jsonld = `  <script type="application/ld+json">\n${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/<\/script/gi, '<\\/script').replace(/^/gm, '  ')}\n  </script>`;

/* ---------- статический текст ---------- */
const contact = (href, label) => (href ? `<li><a href="${esc(href)}">${esc(label)}</a></li>` : '');
const statics = `  <main id="seo-static">
    <header>
      <p>Drinknit — вещи ручной работы</p>
      <h1>Новогодние наборы с вязаными игрушками ручной работы</h1>
      <p>Свяжу, упакую и подпишу открытку вашим текстом. Мастерская в Нижнем Новгороде, доставка по России. До Нового года успею сделать только ${total} наборов. Приём заказов до ${esc(deadlineText)}.</p>
    </header>
    <section>
      <h2>Три набора: выберите для того, кому дарите</h2>
${SETS.map(k => `      <article>
        <h3>Набор ${k} — ${fmt(C.sets[k].price)} ₽</h3>
        <p>${esc(setLine(k))}</p>
        <p>В наборе: ${esc(compLine(k))}.</p>
      </article>`).join('\n')}
    </section>
    <section>
      <h2>Что входит в наборы</h2>
${Object.values(C.details).map(d => `      <article>
        <h3>${esc(plain(d.title))}</h3>
        <p>${esc(dot(plain(d.text)))}${d.note ? ' ' + esc(dot(plain(d.note))) : ''}</p>
      </article>`).join('\n')}
    </section>
    <section>
      <h2>Можно дарить детям</h2>
      <p>${esc(kidsText)}</p>
    </section>
    <section>
      <h2>${esc(timeTitle)}</h2>
      <p>${esc(timeLead)}</p>
${(C.cards || []).map(c => `      <p>${esc(plain(c))}</p>`).join('\n')}
    </section>
    <section>
      <h2>Чтобы набор успел к празднику, напишите до ${esc(deadlineText)}</h2>
      <ol>
${STEPS.map(s => `        <li>${esc(s)}</li>`).join('\n')}
      </ol>
    </section>
    <section>
      <h2>${esc(ABOUT_TITLE)}</h2>
      <p>${esc(ABOUT)}</p>
    </section>
    <section>
      <h2>Частые вопросы</h2>
${C.faq.map(([q, a]) => `      <h3>${esc(plain(q))}</h3>\n      <p>${esc(plain(a))}</p>`).join('\n')}
    </section>
    <footer>
      <h2>Как заказать</h2>
      <p>Напишите мне, какой набор хотите и что подписать на открытке. Остальное подскажу в переписке.</p>
      <ul>
        ${[contact(links.telegram, 'Telegram'), contact(links.vk, 'ВКонтакте'), contact(links.max, 'MAX'), contact(links.vkGroup, 'Группа ВКонтакте'), contact(links.avito, 'Авито')].filter(Boolean).join('\n        ')}
      </ul>
      <p>Подробнее:</p>
      <ul>
        ${NAV.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('\n        ')}
      </ul>
      <p>Цены указаны в рублях. Изделия ручной работы, внешний вид может немного отличаться от фото. Доставка оплачивается отдельно по тарифу службы.</p>
    </footer>
  </main>`;

/* ---------- index.html ---------- */
let html = read('index.html');
const inject = (src, name, block, place) => {
  const start = `<!-- seo:${name}:start -->`, end = `<!-- seo:${name}:end -->`;
  const wrapped = `  ${start}\n${block}\n  ${end}`;
  const re = new RegExp(`[ \\t]*${start}[\\s\\S]*?${end}`);
  if (re.test(src)) return src.replace(re, () => wrapped);
  return place(src, wrapped);
};
html = inject(html, 'jsonld', jsonld, (s, w) => {
  const a = '  <!-- Yandex.Metrika counter -->';
  if (!s.includes(a)) throw new Error('index.html: не найден якорь для JSON-LD');
  return s.replace(a, () => `${w}\n${a}`);
});
html = inject(html, 'static', statics, (s, w) => {
  const a = '<!-- /Yandex.Metrika counter (noscript) -->';
  if (!s.includes(a)) throw new Error('index.html: не найден якорь для статического текста');
  return s.replace(a, () => `${a}\n${w}`);
});
if (C.meta) {
  const m = C.meta;
  if (m.title) html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(m.title)}</title>`);
  const attr = (sel, v) => { if (v) html = html.replace(new RegExp(`(<meta ${sel} content=")[^"]*(")`), (_, a, b) => a + esc(v) + b); };
  attr('name="description"', m.description);
  attr('property="og:title"', m.ogTitle);
  attr('property="og:description"', m.ogDescription);
}
write('index.html', html);

/* ---------- llms.txt ---------- */
const llms = `# Drinknit

> Новогодние наборы с вязаными игрушками ручной работы. Мастер Катя вяжет игрушки 30 лет: вяжет, упаковывает набор и подписывает открытку вашим текстом. Нижний Новгород, доставка по России. До Нового года доступно только ${total} наборов, приём заказов до ${deadlineText}.

## Наборы и цены

${SETS.map(k => `- Набор ${k} — ${fmt(C.sets[k].price)} ₽. ${setLine(k)} В наборе: ${compLine(k)}.`).join('\n')}

Игрушки связаны вручную из хлопковой и акриловой пряжи YarnArt jeans, мелкие детали держатся на безопасном креплении. Каждая игрушка может немного отличаться от фото.

## Как заказать и получить

${STEPS.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Частые вопросы

${C.faq.map(([q, a]) => `- ${plain(q)} ${plain(a)}`).join('\n')}

## Страницы сайта

${NAV.map(([href, label]) => `- [${label}](${SITE}${href})`).join('\n')}

## Ссылки

- [Сайт: наборы, сроки, вопросы](${SITE}/)
${links.telegram ? `- [Написать в Telegram](${links.telegram})\n` : ''}${links.vk ? `- [Написать во ВКонтакте](${links.vk})\n` : ''}${links.vkGroup ? `- [Группа ВКонтакте](${links.vkGroup})\n` : ''}${links.avito ? `- [Профиль на Авито](${links.avito})\n` : ''}`;
write('llms.txt', llms);

/* ---------- обычные страницы под запросы покупателей ---------- */
const pages = buildPages({ C, SITE, links, orgId, deadlineText, today, total, SETS, COMP, LABEL, STEPS, ABOUT, ABOUT_TITLE, kidsText, NAV, YM, esc, plain, dot, fmt });
pages.forEach(p => {
  fs.mkdirSync(path.join(root, p.slug), { recursive: true });
  write(`${p.slug}/index.html`, p.html);
});

/* ---------- sitemap.xml ---------- */
const urlEntry = (loc, prio, freq) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${prio}</priority>
  </url>`;
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[urlEntry(`${SITE}/`, '1.0', 'weekly'), ...pages.map(p => urlEntry(`${SITE}/${p.slug}/`, '0.8', 'monthly'))].join('\n')}
</urlset>
`);

console.log(`Готово: index.html (JSON-LD, статический текст, meta), llms.txt, sitemap.xml, страницы: ${pages.map(p => '/' + p.slug + '/').join(' ')}`);
