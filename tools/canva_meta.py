"""Ask Canva about every design link: title and size. Saves tools/canva_meta.json.

Run: python3 tools/canva_meta.py data/designs.json
Only looks up links it hasn't seen before, unless you pass --all.
"""
import json, sys, os, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'canva_meta.json')

def urls_in(path):
    text = open(path).read()
    import re
    return sorted(set(re.findall(r'https://www\.canva\.com/design/[A-Za-z0-9_-]+/[A-Za-z0-9_-]+/view', text)))

def look(u):
    q = 'https://www.canva.com/_oembed?url=' + urllib.parse.quote(u, safe='')
    for wait in (0, 5, 15, 40, 90):
        time.sleep(wait + 0.6)
        try:
            with urllib.request.urlopen(urllib.request.Request(q, headers={'User-Agent': 'Mozilla/5.0'}), timeout=20) as r:
                d = json.load(r)
            return u, {'title': d.get('title'), 'w': d.get('width'), 'h': d.get('height')}
        except Exception as e:
            err = str(e)[:80]
            if '429' not in err:
                break
    return u, {'error': err}

if __name__ == '__main__':
    meta = json.load(open(OUT)) if os.path.exists(OUT) else {}
    todo = [u for u in urls_in(sys.argv[1]) if '--all' in sys.argv or u not in meta or 'error' in meta[u]]
    with ThreadPoolExecutor(2) as ex:
        for u, m in ex.map(look, todo):
            meta[u] = m
    json.dump(meta, open(OUT, 'w'), indent=1, sort_keys=True)
    bad = {u: m for u, m in meta.items() if 'error' in m}
    print(f'{len(todo)} looked up, {len(meta)} total, {len(bad)} with errors')
