"""Уменьшенные копии картинок сайта: name.webp → name.h.webp (вдвое меньше по каждой стороне) и name.q.webp (вчетверо).
Сайт берёт самую маленькую копию, пикселей которой хватает на экране (обычный монитор, маленький масштаб),
на телефонах и Retina — полную. Запуск из корня репозитория: python3 tools/make-half.py
Пишет imgsizes.js — список картинок с копиями и ширины копий [половинная, четвертная]."""
import json
import os
from PIL import Image

ROOTS = ['assets/d', 'assets/box-closed.webp']
SKIP = ('assets/d/trans/',)          # кадры видео-перехода рисуются на холсте, у них своя логика
MIN_W = 200                           # совсем маленькие картинки не трогаем
MIN_Q = 400                           # четвертная копия — для картинок от 400 px

files = []
for r in ROOTS:
    if r.endswith('.webp'):
        files.append(r)
        continue
    for dp, _, fs in os.walk(r):
        for f in fs:
            p = os.path.join(dp, f).replace('\\', '/')
            if p.endswith('.webp') and not p.endswith('.h.webp') and not p.startswith(SKIP):
                files.append(p)

# только картинки, на которые ссылается сайт (старые листы стикеров не нужны)
CODE = ''.join(open(f, encoding='utf-8').read() for f in ['index.html', 'desktop.js', 'data.js', 'desktop.css', 'portrait.css', 'content.js'])
half = {}
for p in sorted(files):
    base = os.path.basename(p)[:-5]
    if base not in CODE and '/sets/' not in p:   # слои наборов собираются в коде из имени набора и предмета
        continue
    im = Image.open(p)
    w, h = im.size
    if w < MIN_W:
        continue
    out = p[:-5] + '.h.webp'
    hw, hh = (w + 1) // 2, (h + 1) // 2
    if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(p):
        im.load()
        im.resize((hw, hh), Image.LANCZOS).save(out, quality=95, method=6, alpha_quality=100, use_sharp_yuv=True)
    q = 0
    if w >= MIN_Q:
        outq = p[:-5] + '.q.webp'
        q = (w + 3) // 4
        if not os.path.exists(outq) or os.path.getmtime(outq) < os.path.getmtime(p):
            im.load()
            im.resize((q, (h + 3) // 4), Image.LANCZOS).save(outq, quality=95, method=6, alpha_quality=100, use_sharp_yuv=True)
    half[p] = [hw, q] if q else [hw]

with open('imgsizes.js', 'w') as f:
    f.write('// создаётся tools/make-half.py: картинки с уменьшенными копиями и их ширины [.h.webp, .q.webp]\n')
    f.write('window.DRINKNIT_HALF = ' + json.dumps(half, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(half), 'half copies')
