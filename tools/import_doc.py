"""One-time import: turn the Thrive Images Google Doc (saved as Markdown) into data/designs.json.

After this, data/designs.json is the source of truth. Edit it directly; don't re-run this
unless you want to start over from the doc.

Run: python3 tools/import_doc.py tools/thrive-images-doc-2026-10-31.md
"""
import json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

LEVELS = [('start', 'START', 'Start'), ('walk', 'WALK', 'Walk'), ('run', 'RUN', 'Run'), ('guide', 'GUIDE', 'Guide')]
APP_GROUPS = {'General': 'Logos', 'APP HEADERS': 'App Headers', 'APP ICONS': 'App Icons',
              'THRIVE CAROUSELS': 'Carousels', 'WEBSITE IMAGES': 'Website Images'}


def norm(s):
    s = re.sub(r'\bTHE\b', '', s.upper().replace('’', "'").replace('&', 'AND'))
    return re.sub(r'[^A-Z0-9]', '', s)


def clean_url(u):
    m = re.match(r'(https://www\.canva\.com/design/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/view)', u)
    return m.group(1) if m else u


def image(i, **extra):
    d = {'name': i['n'], 'type': i['t'], 'url': clean_url(i['u']), 'words': i['w']}
    if i.get('dark'):
        d['dark'] = True
    if 'share/preview' in i['u'] and 'role=EDITOR' in i['u']:
        d['note'] = 'Editor link: opens the master design, not a copy'
    d.update(extra)
    return d


def main(doc):
    raw_path = os.path.join(tempfile.mkdtemp(), 'raw.json')
    subprocess.run([sys.executable, '-I', os.path.join(HERE, 'parse_doc.py'), doc, raw_path], check=True, capture_output=True)
    raw = json.load(open(raw_path))
    by = {L['name']: L for L in raw}

    levels = []
    for lid, key, title in LEVELS:
        series = []
        for se in by[key]['series']:
            sname = re.sub(r'\s*\d+/\d+/\d+$', '', se['name']).strip() or f'{title} studies'
            is_extra = 'OTHER' in sname.upper()
            studies = []
            for s in se['studies']:
                if not s['images']:
                    continue
                name = s['name']
                if name == 'General':
                    name = 'Other images'
                studies.append({'name': name, 'images': [image(i) for i in s['images']]})
            if studies:
                series.append({'name': 'Series images and extras' if is_extra else sname, 'studies': studies})
        levels.append({'id': lid, 'name': title, 'series': series})

    # Old study headers: put each one in its study, marked old.
    old = by['OLD HEADERS']
    cur = 'START'
    leftovers = {k: [] for _, k, _ in LEVELS}
    level_of = {k: L for (_, k, _), L in zip(LEVELS, levels)}
    for se in old['series']:
        if se['name'] in leftovers:
            cur = se['name']
        for s in se['studies']:
            if s['name'] in leftovers:
                cur = s['name']
            for i in s['images']:
                img = image({'n': 'Header', 'u': i['u'], 'w': True, 't': 'Header'}, status='old')
                target = None
                for ser in level_of[cur]['series']:
                    for st in ser['studies']:
                        if norm(st['name']) == norm(s['name']) or norm(st['name']).startswith(norm(s['name'])) and len(norm(s['name'])) > 4:
                            target = st
                if target:
                    target['images'].append(img)
                else:
                    img['name'] = f"{s['name'].title()} header"
                    leftovers[cur].append(img)
    for key, imgs in leftovers.items():
        if imgs:
            level_of[key]['series'].append({'name': 'Older study headers', 'studies': [{'name': 'Headers for studies no longer in the doc', 'images': imgs}]})

    # App and website images.
    groups = []
    for se in by['OTHER THRIVE DESIGNS']['series']:
        for s in se['studies']:
            if s['images']:
                gname = APP_GROUPS.get(s['name'], s['name'].title())
                groups.append({'name': gname, 'images': [image(dict(i, t=gname)) for i in s['images']]})

    out = {
        'updated': '2026-10-31',
        'types': {
            'Square': {'about': 'Plain photo, no words. Used in the app on review cards.'},
            'Square Shaded': {'about': 'Photo with a dark shade.'},
            'Review Card': {'about': 'Review card for the app. Has words.'},
            'Vertical': {'about': 'Tall phone image. Has words.'},
            'Circle': {'about': 'Round photo for the app.'},
            'Study Extra': {'about': 'One-off images for a single study: charts, diagrams, icons.'},
            'Series Image': {'about': 'One per series, with a dark mode copy.'},
            'Series App Image': {'about': 'Series image for the app.'},
            'Header': {'about': 'The old study headers. The doc marked them "not in use", but some countries still use them.'},
        },
        'levels': levels,
        'appWeb': groups,
    }
    path = os.path.join(ROOT, 'data', 'designs.json')
    json.dump(out, open(path, 'w'), indent=1, ensure_ascii=False)
    n = sum(len(st['images']) for L in levels for se in L['series'] for st in se['studies']) + sum(len(g['images']) for g in groups)
    print(f'wrote {path}: {n} images')
    for key, imgs in leftovers.items():
        if imgs:
            print(f'  {key}: {len(imgs)} old headers with no matching study:', [i['name'] for i in imgs])


if __name__ == '__main__':
    main(sys.argv[1])
