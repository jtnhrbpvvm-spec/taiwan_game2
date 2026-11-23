# -*- coding: utf-8 -*-
r"""RO 倖存者小百科：把遊戲資料轉成 wiki\data\*.js

用法（在 RO倖存者 資料夾）：
    python tools\build_wiki.py                 讀 桌面\爬蟲\ro-survivors-tool\rs-crawl\_wiki_dump.json
    python tools\build_wiki.py 某個dump.json   指定 dump 檔

dump 由 tools\wiki_dump.js 在離線版遊戲（繁體中文）裡產生，流程寫在 翻譯說明.md 的「小百科」一節。
怪物、物品、卡片名稱：優先用官方譯名（tools\zh\official.json，check_zh.js 產生），
官方沒翻的才用 tools\zh\names.txt（台版譯名）。
"""
import io
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'wiki', 'data')
DEFAULT_DUMP = os.path.join(os.path.expanduser('~'), 'Desktop', '爬蟲', 'ro-survivors-tool', 'rs-crawl', '_wiki_dump.json')


def load_names():
    names = {}
    path = os.path.join(HERE, 'zh', 'names.txt')
    for line in io.open(path, encoding='utf-8-sig'):
        line = line.rstrip('\n')
        if line.startswith('@') and '\t' in line:
            en, zh = line[1:].split('\t', 1)
            if zh.strip():
                names[en] = zh.strip()
    return names


def load_official():
    """官方譯名（tools\\check_zh.js 從遊戲程式抽出，2026-11-18 起遊戲自己翻物品、卡片、怪物名稱）。"""
    path = os.path.join(HERE, 'zh', 'official.json')
    if not os.path.exists(path):
        return '', {}
    o = json.load(io.open(path, encoding='utf-8'))
    return o.get('version', ''), o.get('names', {})


def write_js(name, var, data):
    os.makedirs(OUT, exist_ok=True)
    text = '/* 由 tools\\build_wiki.py 產生，不要手動改 */\nRSW.%s = %s;\n' % (var, json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    with io.open(os.path.join(OUT, name), 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    return len(text.encode('utf-8'))


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    dump_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DUMP
    d = json.load(io.open(dump_path, encoding='utf-8'))
    NM = load_names()
    off_ver, OFFICIAL = load_official()
    dump_ver = d.get('version') or ''
    if not OFFICIAL:
        print('⚠ 沒有 tools\\zh\\official.json：先跑 node tools\\check_zh.js（名稱會只用 names.txt）')
    elif dump_ver and off_ver != dump_ver:
        print('⚠ official.json 是 %s 的，資料是 %s 的：先跑 node tools\\check_zh.js %s' % (off_ver, dump_ver, dump_ver))
    NM.update(OFFICIAL)          # 官方有翻就用官方的，names.txt 只補官方沒翻的
    missing = set()
    festival = d.get('festival')
    festival_balls = festival['balls'] if festival else []
    festival_cards = {cid: ball['id'] for ball in festival_balls for cid in ball['cards']}

    # 官方中文漏翻、還是英文的技能名（Esma、Ruwach…）：官方說明文字裡也夾著英文（「學習技能Esma:」）。
    # 只改「含中文」的字串，英文原文欄位不動。
    eng_skills = sorted({s['name'] for s in d.get('skills', [])
                         if isinstance(s.get('name'), str) and re.fullmatch(r"[A-Za-z][A-Za-z' -]*", s['name']) and s['name'] in NM},
                        key=len, reverse=True)
    if eng_skills:
        rx = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(n) for n in eng_skills) + r")(?![A-Za-z])")
        cjk = re.compile(r"[一-鿿]")

        eng_set = set(eng_skills)

        def fix_text(o):
            if isinstance(o, str):
                if o in eng_set:      # 整個字串就是技能名（天賦名「Esma」）
                    return NM[o]
                return rx.sub(lambda m: NM[m.group(1)], o) if cjk.search(o) else o
            if isinstance(o, list):
                return [fix_text(x) for x in o]
            if isinstance(o, dict):
                return {k: (v if k in ('en', 'id') else fix_text(v)) for k, v in o.items()}
            return o
        for sec in ('skills', 'talents', 'branches', 'items', 'cards', 'pets', 'jobs', 'deities', 'runItems'):
            if sec in d:
                d[sec] = fix_text(d[sec])

    def zh(en):
        if not en:
            return None
        if en in NM:
            return NM[en]
        missing.add(en)
        return None

    # ---------- 關卡 ----------
    scripts = d['scripts']
    stages = []
    for s in d['stages']:
        sc = scripts.get(s['id'])
        st = dict(s)
        if sc:
            st.update(runLength=sc['runLength'], jobCap=sc['jobCap'], pool=sc['pool'], bosses=sc['bosses'], reward=sc.get('reward'))
            story = scripts.get(s['story']) if s.get('story') else None
            if story:
                st['storyInfo'] = {'id': s['story'], 'runLength': story['runLength'], 'bosses': story['bosses'],
                                   'pool': story['pool'], 'jobWeapon': story.get('jobWeapon')}
        stages.append(st)

    # 怪物 → 出現在哪些關卡
    mon_where = {}

    def seen(mon, stage, role, minute=None, story=False):
        mon_where.setdefault(mon, []).append({'stage': stage, 'role': role, 'minute': minute, 'story': story})

    for st in stages:
        if not st.get('open'):
            for m in (st.get('planned') or {}).get('monsters', []):
                seen(m, st['id'], 'planned')
            if (st.get('planned') or {}).get('mvp'):
                seen(st['planned']['mvp'], st['id'], 'planned')
            continue
        boss_ids = {b['id'] for b in st.get('bosses', [])}
        for m in st.get('pool', []):
            if m not in boss_ids:
                seen(m, st['id'], 'normal')
        for i, b in enumerate(st.get('bosses', [])):
            seen(b['id'], st['id'], 'mvp' if i == len(st['bosses']) - 1 else 'mini', round(b['t'] / 60, 1))
        si = st.get('storyInfo')
        if si:
            for i, b in enumerate(si['bosses']):
                seen(b['id'], st['id'], 'mvp' if i == len(si['bosses']) - 1 else 'mini', round(b['t'] / 60, 1), True)

    if festival and festival.get('incense'):
        festival['incense']['zh'] = zh(festival['incense'].get('nameEN'))
    if festival:
        st = next(s for s in stages if s['id'] == festival['stage'])
        scheduled = {b['id'] for b in st.get('bosses', [])}
        st['optionalBosses'] = [mid for mid in festival['bossBalls'] if mid not in scheduled]
        for mid in st['optionalBosses']:
            seen(mid, st['id'], 'optional')
        for mid in ('ink_snake', 'ink_serpent'):
            if any(m['id'] == mid for m in d['monsters']):
                seen(mid, st['id'], 'summon')

    # ---------- 怪物 ----------
    card_of = {c['monster']: c['id'] for c in d['cards']}
    monsters = []
    for m in d['monsters']:
        info = d['monInfo'].get(m['id'], {})
        monsters.append({
            'id': m['id'], 'en': m['name'], 'zh': zh(m['name']), 'level': m.get('level'), 'hp': m.get('hp'),
            'damage': m.get('damage'), 'exp': m.get('exp'), 'speed': m.get('speed'), 'boss': m.get('boss'),
            'ranged': bool(m.get('ranged')), **info,
            'drops': d['drops'].get(m['id'], []), 'card': card_of.get(m['id']),
            'where': mon_where.get(m['id'], []),
            'festivalBall': festival['bossBalls'].get(m['id']) if festival else None,
            'seasonOnly': bool(mon_where.get(m['id'])) and all(
                next((s.get('season') for s in stages if s['id'] == w['stage']), False)
                for w in mon_where[m['id']]),
        })
    mon_by_id = {m['id']: m for m in monsters}

    # ---------- 物品 ----------
    job_name = {j['id']: j['name'] for j in d['jobs']}
    sources = {}
    for m in monsters:
        for dr in m['drops']:
            sources.setdefault(dr['id'], []).append({'type': 'drop', 'monster': m['id'], 'chance': dr['chance'], 'rate': dr['rate']})
    for j in d['jobs']:
        for iid in j['starter']:
            sources.setdefault(iid, []).append({'type': 'starter', 'job': j['id']})
        for iid in j['story']:
            sources.setdefault(iid, []).append({'type': 'story', 'job': j['id'], 'stage': 'sunken'})
    for st in stages:
        if st.get('reward'):
            sources.setdefault(st['reward'], []).append({'type': 'reward', 'stage': st['id']})
    if festival:
        for it in d['items']:
            if it.get('season'):
                sources[it['id']] = [{'type': 'festival', 'stage': festival['stage'], 'ball': b['id']}
                                     for b in festival_balls]
    # 作者刻意設計成「遊戲不會給」的裝備（soul_linker 的 new Set 登記，程式會檢查它們不在任何掉落裡）：
    # 改存檔拿到會被封帳號。小百科不收，避免誤導玩家去找或改存檔。
    hidden_items = [it for it in d['items'] if it.get('secret')]
    items = []
    for it in d['items']:
        if it.get('secret'):
            continue
        row = {k: it[k] for k in ('id', 'icon', 'slot', 'cardSlots', 'base', 'jobs', 'wtype', 'wtypeName', 'rare',
                                  'starter', 'secret', 'gender', 'bonuses', 'sig', 'sigMax')}
        row['en'] = it['nameEN']
        row['zh'] = zh(it['nameEN'])
        row['sources'] = sources.get(it['id'], [])
        row['season'] = it.get('season')
        items.append(row)
    item_ids = {i['id'] for i in items}
    orphan = [iid for iid in sources if iid not in item_ids]

    # ---------- 卡片 ----------
    SLOT_FIX = {'headgear': '頭飾', 'accessory': '飾品'}
    cards = []
    for c in d['cards']:
        mon = mon_by_id.get(c['monster'], {})
        cards.append({'id': c['id'], 'en': c['nameEN'], 'zh': zh(c['nameEN']), 'image': c['image'], 'monster': c['monster'],
                      'compound': c['compound'], 'tier': c.get('tier'),
                      'compoundName': SLOT_FIX.get(c['compoundName'], c['compoundName']) if c['compoundName'] == c['compound'] else c['compoundName'],
                      'bonuses': c['bonuses'],
                      'boss': mon.get('boss'),
                      'sources': [{'type': 'festival', 'stage': festival['stage'], 'ball': festival_cards[c['id']]}]
                      if c['id'] in festival_cards else [{'type': 'drop', 'monster': c['monster']}]})

    # ---------- 技能：屬於哪個職業 ----------
    skill_jobs = {}
    for j in d['jobs']:
        for s in j['skills']:
            skill_jobs.setdefault(s, []).append({'job': j['id'], 'how': 'base'})
    for t in d['talents']:
        if t.get('learn'):
            skill_jobs.setdefault(t['learn'], []).append({'job': t['job'], 'how': 'talent', 'talent': t['id']})
    skills = []
    for s in d['skills']:
        row = dict(s)
        # 官方中文漏翻、還是英文的技能名（Ruwach、Kihop…）：用 names.txt 的譯名
        if isinstance(row.get('name'), str) and re.fullmatch(r"[A-Za-z][A-Za-z' -]*", row['name']) and row['name'] in NM:
            row['name'] = NM[row['name']]
        row['jobs'] = skill_jobs.get(s['id'], [])
        skills.append(row)

    # ---------- 天賦：依職業分組 ----------
    talents = {}
    for t in d['talents']:
        talents.setdefault(t['job'], []).append({k: v for k, v in t.items() if k != 'job'})
    for lst in talents.values():
        lst.sort(key=lambda t: (t['branch'], t['row'], t['col']))

    # ---------- 寵物 ----------
    TIER_ZH = {'Neutral': '普通', 'Cordial': '親密', 'Leal': '忠誠'}
    rules = dict(d.get('petRules') or {})
    rules['tiers'] = [dict(t, name=t['name'] if t['name'] != t['id'] else TIER_ZH.get(t['id'], t['id'])) for t in rules.get('tiers', [])]
    pets = []
    for p in d.get('pets') or []:
        mon = mon_by_id.get(p['id'], {})
        pets.append(dict(p, en=mon.get('en') or p['id'], zh=mon.get('zh'), boss=mon.get('boss'),
                         eggZh=zh(p.get('eggEN')), accZh=zh(p.get('accEN'))))

    # ---------- 外觀（只收有取得方式的；其他的遊戲也不顯示） ----------
    cos_raw = d.get('cosmetics') or {}
    cosmetics = []
    for c in cos_raw.get('list', []):
        if not (c.get('kills') or c.get('tower') or c.get('ball') is not None):
            continue
        cosmetics.append({'id': c['id'], 'en': c['nameEN'], 'zh': zh(c['nameEN']), 'icon': c['icon'], 'slot': c['slot'],
                          'kills': c.get('kills'), 'tower': c.get('tower'), 'ball': c.get('ball'), 'covers': c.get('covers') or []})
    cosmetics.sort(key=lambda c: (c['tower'] or 0, c['id']))

    # 遊戲沒翻到的職業類型
    SCALING = {'melee': '近戰', 'ranged': '遠程', 'magic': '魔法'}
    for j in d['jobs']:
        if j.get('scalingName') == j.get('scaling'):
            j['scalingName'] = SCALING.get(j['scaling'], j['scaling'])

    version = d.get('version') or ''
    meta = {
        'version': version, 'dumpedAt': d.get('dumpedAt'), 'builtAt': datetime.now(timezone(timedelta(hours=9))).strftime('%Y-%m-%d %H:%M JST'),
        'labels': d['labels'], 'jobNames': job_name,
    }
    sizes = {
        'meta.js': write_js('meta.js', 'meta', meta),
        'jobs.js': write_js('jobs.js', 'jobs', {'list': d['jobs'], 'branches': d['branches']}),
        'skills.js': write_js('skills.js', 'skills', skills),
        'talents.js': write_js('talents.js', 'talents', talents),
        'items.js': write_js('items.js', 'items', items),
        'cards.js': write_js('cards.js', 'cards', cards),
        'monsters.js': write_js('monsters.js', 'monsters', monsters),
        'stages.js': write_js('stages.js', 'stages', stages),
        'pets.js': write_js('pets.js', 'pets', {'list': pets, 'rules': rules}),
        'deities.js': write_js('deities.js', 'deities', d.get('deities') or {'skills': {}, 'stats': []}),
        'runitems.js': write_js('runitems.js', 'runItems', d.get('runItems') or {'slots': [], 'list': []}),
        'cosmetics.js': write_js('cosmetics.js', 'cosmetics', {'list': cosmetics, 'kills': cos_raw.get('kills') or 200}),
        'events.js': write_js('events.js', 'festival', dict(festival, version=version,
            checkedAt=d.get('dumpedAt'), gear=[i['id'] for i in items if i.get('season')]) if festival else None),
    }
    print('遊戲版本：%s' % version)
    print('職業 %d、技能 %d、天賦 %d、物品 %d、卡片 %d、怪物 %d、關卡 %d、寵物 %d' % (
        len(d['jobs']), len(skills), len(d['talents']), len(items), len(cards), len(monsters), len(stages), len(pets)))
    print('輸出：' + '、'.join('%s %dKB' % (k, v // 1024) for k, v in sizes.items()))
    if d.get('log'):
        print('抽取紀錄：' + '；'.join(d['log']))
    if hidden_items:
        print('不收的陷阱裝備 %d 件（遊戲不會給，改存檔拿到會被封）：%s' % (
            len(hidden_items), '、'.join('%s %s' % (i['id'], i.get('nameEN')) for i in hidden_items)))
    if orphan:
        print('⚠ 有取得方式但物品表沒有的 id：%s' % orphan)
    if missing:
        print('⚠ %d 個名稱沒有中文（照英文顯示；要補就加到 tools\\zh\\names.txt）：' % len(missing))
        print('   ' + '、'.join(sorted(missing)))


if __name__ == '__main__':
    main()
