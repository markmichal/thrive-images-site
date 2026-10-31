import re, json, sys
t = open(sys.argv[1]).read().split('\n')
def clean(s):
    s = s.replace('\\','').replace('*','').replace('#','').strip()
    return re.sub(r'\s+',' ',s).strip(' -')
LEVELS = ['START','WALK','RUN','GUIDE','OTHER THRIVE DESIGNS']
out = []; lvl = ser = st = None; old = False; grp = None
def typ(name, inother):
    n = name.lower()
    if 'dark mode' in n: base = re.sub(r'(?i)\s*dark mode','',name).strip()
    else: base = name
    b = base.lower()
    for k,v in [('square shaded','Square Shaded'),('review card','Review Card'),('vertical','Vertical'),('circle','Circle'),('series app','Series App Image'),('series image','Series Image'),('header','Header')]:
        if k in b: return v
    if b.strip()=='square': return 'Square'
    return None
for l in t:
    if 'OLD HEADERS' in l: old = True; lvl = {'name':'OLD HEADERS','series':[]}; out.append(lvl); ser=None; st=None; continue
    m = re.match(r'^#\s+\*\*(.+?)\*\*', l)
    if m and not old:
        name = clean(m.group(1))
        if name in LEVELS:
            lvl = {'name':name,'series':[]}; out.append(lvl); ser=None; st=None
        continue
    if lvl is None: continue
    m = re.match(r'^##\s+\*\*(.+?)\*\*', l)
    if m:
        ser = {'name':clean(m.group(1)),'studies':[]}; lvl['series'].append(ser); st=None; continue
    links = [(a,u) for a,u in re.findall(r'\[([^\]]+)\]\((https?://[^)]+)\)', l) if 'canva' in u]
    m = re.search(r'\\\*\\\*(.+?)\\\*\\\*', l) or (None if old else re.match(r'^\s*-\s*\*\*([^*\\]+?)\*\*\s*$', l))
    if m and not links:
        if ser is None: ser = {'name':'','studies':[]}; lvl['series'].append(ser)
        st = {'name':clean(m.group(1)),'images':[]}; ser['studies'].append(st); continue
    if old and not links:
        mm = re.match(r'^\s*-\s*\*\*(.+?)\*\*', l)
        if mm: ser = {'name':clean(mm.group(1)),'studies':[]}; lvl['series'].append(ser); st=None
        continue
    for a,u in links:
        a = clean(a)
        pre = l.split('[')[0]
        words = '\\*' in pre or l.strip().startswith('\\*') or '* ' in pre
        if old:
            sname = clean(re.sub(r'\\\*.*','',l).replace('-','',1))
            stt = {'name':sname,'images':[]}
            if ser is None: ser={'name':'','studies':[]}; lvl['series'].append(ser)
            ser['studies'].append(stt)
            stt['images'].append({'n':'Header','u':u,'w':True,'t':'Header','dark':False,'old':True}); continue
        if st is None:
            if ser is None: ser = {'name':'','studies':[]}; lvl['series'].append(ser)
            st = {'name':'General','images':[]}; ser['studies'].append(st)
        u = re.sub(r'\?.*','',u)
        st['images'].append({'n':a,'u':u,'w':bool(words),'t':typ(a, lvl['name']=='OTHER THRIVE DESIGNS') or 'Study Extra','dark':'dark mode' in a.lower()})
json.dump(out, open(sys.argv[2],'w'), ensure_ascii=False, indent=0)
for L in out:
    print(L['name'], sum(len(s['images']) for se in L['series'] for s in se['studies']))
    for se in L['series']: print('   ', repr(se['name']), [s['name'] for s in se['studies']][:30])
