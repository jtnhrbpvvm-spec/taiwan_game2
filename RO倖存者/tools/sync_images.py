# -*- coding: utf-8 -*-
r"""小百科用到的遊戲圖片：補下載還沒有本地副本的（遊戲改版有新物品、卡片、怪物時用）

用法（在 RO倖存者 資料夾，build_wiki.py 之後）：
    python tools\sync_images.py            下載缺的圖片
    python tools\sync_images.py --check    只列出缺哪些，不下載

做的事：
1. 掃 wiki\data\*.js（圖片對照檔除外）裡所有 "items/…png"、"cards/…png"、"icons/…png" 路徑
2. wiki\data\game-images.js 還沒有對照的 → 從 https://ro-survivors.com/assets/ 下載到 assets\game\
   （先找爬蟲的素材快取 rs-crawl\_assets\assets\，有就直接複製）
3. 檢查是 PNG、記錄 SHA-256／大小／寬高到 assets\game\sources.json，重寫 game-images.js
"""
import hashlib
import io
import json
import os
import re
import struct
import sys
import time
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, 'wiki', 'data')
GAME = os.path.join(ROOT, 'assets', 'game')
SOURCES = os.path.join(GAME, 'sources.json')
MAP_JS = os.path.join(DATA, 'game-images.js')
BASE = 'https://ro-survivors.com/assets/'
CACHE = os.path.join(os.path.expanduser('~'), 'Desktop', '爬蟲', 'ro-survivors-tool', 'rs-crawl', '_assets', 'assets')
SKIP = {'game-images.js', 'local-images.js'}
PATH_RE = re.compile(r'"((?:items|cards|icons|runitems)/[\w./-]+\.png)"')
PNG_SIG = b'\x89PNG\r\n\x1a\n'


def used_paths():
    found = set()
    for name in os.listdir(DATA):
        if name.endswith('.js') and name not in SKIP:
            found.update(PATH_RE.findall(io.open(os.path.join(DATA, name), encoding='utf-8').read()))
    return found


def png_size(b):
    if b[:8] != PNG_SIG or b[12:16] != b'IHDR':
        return None
    return struct.unpack('>II', b[16:24])


def fetch(path):
    cached = os.path.join(CACHE, *path.split('/'))
    if os.path.exists(cached):
        return io.open(cached, 'rb').read(), 'cache'
    req = urllib.request.Request(BASE + path, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read(), 'web'


def write_map(images):
    m = {img['original']: img['local'] for img in images}
    text = ('/* 遊戲原站圖片本地對照；逐圖來源與 SHA-256：assets/game/sources.json。 */\n'
            'window.RSW = window.RSW || {};\n'
            'RSW.localImages = Object.assign(RSW.localImages || {}, %s);\n'
            % json.dumps(m, ensure_ascii=False, separators=(',', ':')))
    with io.open(MAP_JS, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    check_only = '--check' in sys.argv
    src = json.load(io.open(SOURCES, encoding='utf-8'))
    have = {img['original'] for img in src['images']}
    need = sorted(p for p in used_paths() if p not in have)
    print('小百科用到的圖片：已有本地副本 %d 張，缺 %d 張' % (len(have), len(need)))
    if not need or check_only:
        for p in need:
            print('   ' + p)
        return
    version = ''
    meta = os.path.join(DATA, 'meta.js')
    if os.path.exists(meta):
        m = re.search(r'"version":"([^"]+)"', io.open(meta, encoding='utf-8').read())
        version = m.group(1) if m else ''
    added, failed = 0, []
    for p in need:
        try:
            b, how = fetch(p)
        except Exception as e:  # 網路錯誤、404
            failed.append('%s（%s）' % (p, e))
            continue
        size = png_size(b)
        if not size:
            failed.append('%s（不是 PNG）' % p)
            continue
        local = 'assets/game/' + p
        out = os.path.join(ROOT, *local.split('/'))
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, 'wb') as f:
            f.write(b)
        src['images'].append({'original': p, 'local': local, 'source': BASE + p,
                              'sha256': hashlib.sha256(b).hexdigest(), 'bytes': len(b),
                              'width': size[0], 'height': size[1]})
        added += 1
        print('   + %s（%s，%dx%d）' % (p, '素材快取' if how == 'cache' else '原站', size[0], size[1]))
        if how == 'web':
            time.sleep(0.2)   # 慢慢抓，不要給原站壓力
    src['images'].sort(key=lambda i: i['original'])
    src['missing'] = sorted(set(src.get('missing') or []) | {f.split('（')[0] for f in failed})
    if added:
        src['retrievedAt'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')
        if version:
            src['gameVersion'] = version
    with io.open(SOURCES, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(src, f, ensure_ascii=False, indent=2)
        f.write('\n')
    write_map(src['images'])
    print('新增 %d 張，對照表共 %d 張 → wiki\\data\\game-images.js' % (added, len(src['images'])))
    if failed:
        print('⚠ 下載失敗 %d 張（網頁會改連原站）：' % len(failed))
        for f in failed:
            print('   ' + f)


if __name__ == '__main__':
    main()
