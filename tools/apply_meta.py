"""Copy Canva sizes from tools/canva_meta.json into data/designs.json, and write tools/link-report.md.

Run after tools/canva_meta.py: python3 tools/apply_meta.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DESIGNS = os.path.join(ROOT, 'data', 'designs.json')


LANGS = r'RUSSIAN|SPANISH|PORT BRAZIL|PORTUGUESE|FRENCH|VIETNAMESE|ALBANIAN|ARABIC|CHINESE|KOREAN|GERMAN|ROMANIAN|UKRAINIAN|INDONESIAN'


def words(s):
    return set(re.findall(r'[A-Z0-9]{3,}', s.upper().replace('’', "'").replace("'", '')))


def main():
    meta = json.load(open(os.path.join(HERE, 'canva_meta.json')))
    data = json.load(open(DESIGNS))
    broken, odd, other_lang, seen = [], [], [], {}

    def visit(where, study, img):
        m = meta.get(img['url'])
        seen.setdefault(img['url'], []).append(f'{where} / {study} / {img["name"]}')
        if not m:
            return
        if 'error' in m:
            broken.append((where, study, img, m['error']))
            return
        if m.get('w') and m.get('h'):
            img['w'], img['h'] = m['w'], m['h']
        title = m.get('title') or ''
        lang = re.search(LANGS, title.upper())
        if lang:
            other_lang.append((where, study, img, title))
        elif study and not (words(study) & words(title)) and img.get('type') != 'Header':
            odd.append((where, study, img, title))

    for L in data['levels']:
        for se in L['series']:
            for st in se['studies']:
                for img in st['images']:
                    visit(L['name'], st['name'], img)
    for g in data['appWeb']:
        for img in g['images']:
            visit('App & Web', '', img)

    json.dump(data, open(DESIGNS, 'w'), indent=1, ensure_ascii=False)

    lines = ['# Link report', '', f'From tools/canva_meta.json. {len(meta)} links checked.', '']
    lines += ['## Links to another language\'s copy', '', 'Canva\'s title names a language, so translators may be starting from a translated version instead of English.', '']
    lines += [f'- {w} / {s} / **{i["name"]}**: Canva calls it "{t}" ({i["url"]})' for w, s, i, t in other_lang] or ['- None']
    lines += ['', '## Links Canva would not open', '', '401 usually means the design\'s public link sharing is off, so translators can\'t open it. 404 means Canva can\'t find it.', '']
    lines += [f'- {w} / {s} / **{i["name"]}**: {e} ({i["url"]})' for w, s, i, e in broken] or ['- None']
    lines += ['', '## Canva title does not mention the study', '', 'Might be the wrong design, or just a different name in Canva.', '']
    lines += [f'- {w} / {s} / **{i["name"]}**: Canva calls it "{t}" ({i["url"]})' for w, s, i, t in odd] or ['- None']
    dups = {u: p for u, p in seen.items() if len(p) > 1}
    lines += ['', '## Same link used more than once', '']
    lines += [f'- {", ".join(p)}' for p in dups.values()] or ['- None']
    open(os.path.join(HERE, 'link-report.md'), 'w').write('\n'.join(lines) + '\n')
    print(f'{len(broken)} broken, {len(other_lang)} other-language copies, {len(odd)} odd titles, {len(dups)} repeated links')


if __name__ == '__main__':
    main()
