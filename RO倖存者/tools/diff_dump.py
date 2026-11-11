# 比較兩次 _wiki_dump.json：找出數值／結構有變的（能力、掉率、關卡…）和只改文字的
# 用法：抽新版資料「之前」先把 rs-crawl\_wiki_dump.json 複製一份，抽完再執行
#   python tools\diff_dump.py 舊的_wiki_dump.json
import json, os, sys
sys.stdout.reconfigure(encoding="utf-8")
a = json.load(open(sys.argv[1], encoding="utf-8"))
b = json.load(open(os.path.expanduser(r"~\Desktop\爬蟲\ro-survivors-tool\rs-crawl\_wiki_dump.json"), encoding="utf-8"))
print("version", a.get("version"), "->", b.get("version"))

def walk(x, y, p, out):
    if isinstance(x, dict) and isinstance(y, dict):
        for k in sorted(set(x) | set(y)):
            if k not in x: out.append(("+", p + "." + k, y[k]))
            elif k not in y: out.append(("-", p + "." + k, x[k]))
            else: walk(x[k], y[k], p + "." + k, out)
    elif isinstance(x, list) and isinstance(y, list) and len(x) == len(y):
        for i, (u, v) in enumerate(zip(x, y)): walk(u, v, p + "[%d]" % i, out)
    elif x != y:
        out.append(("~", p, (x, y)))

def keyed(lst):
    if isinstance(lst, list) and lst and isinstance(lst[0], dict) and "id" in lst[0]:
        return {str(e["id"]): e for e in lst}
    return lst

for sec in b:
    if sec in ("dumpedAt", "log", "version"): continue
    out = []
    walk(keyed(a.get(sec)), keyed(b.get(sec)), sec, out)
    num = [o for o in out if o[0] != "~" or not (isinstance(o[2][0], str) and isinstance(o[2][1], str))]
    txt = [o for o in out if o not in num]
    print("\n=== %s：文字改 %d、其他改 %d" % (sec, len(txt), len(num)))
    for o in num[:60]:
        print(" ", o[0], o[1], json.dumps(o[2], ensure_ascii=False)[:200])
    for o in txt[:8]:
        print("  [文字]", o[1], json.dumps(o[2], ensure_ascii=False)[:160])
