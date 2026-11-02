"""產生中文化用字型 rxs_font.ttf。翻譯有用到新的字時，重新執行一次：
python tools/build_font.py

來源：Windows 內建的 Noto Sans TC（SIL OFL 授權），只留 rxs_zh.js 用到的字和英數符號。
需要：pip install fonttools
"""
import os
import re
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = r'C:\Windows\Fonts\NotoSansTC-VF.ttf'
OUT = os.path.join(ROOT, 'rxs_font.ttf')

js = open(os.path.join(ROOT, 'rxs_zh.js'), encoding='utf8').read()
chars = {c for c in js if ord(c) > 0x2000 and not ('\uac00' <= c <= '\ud7a3')}
# 英文模式、數字、遊戲裡的符號
chars |= {chr(c) for c in range(0x20, 0x7f)} | {chr(c) for c in range(0xa0, 0x100)}
chars |= set('←→↑↓◀▶×·°—–‘’“”…•★☆')

font = TTFont(SRC)
font = instancer.instantiateVariableFont(font, {'wght': 500})
opt = subset.Options()
opt.layout_features = ['kern', 'liga', 'ccmp', 'locl']
opt.name_IDs = ['*']
opt.notdef_outline = True
opt.hinting = False
s = subset.Subsetter(opt)
s.populate(unicodes=[ord(c) for c in chars])
s.subset(font)

font.save(OUT)

# 零寬空白（rxs_zh.js 用來補齊場景字串長度）：字型若沒有就加一個空字形
font = TTFont(OUT)
cmap = font.getBestCmap()
hmtx, glyf = font['hmtx'], font['glyf']
if 0x200b not in cmap:
    from fontTools.ttLib.tables._g_l_y_f import Glyph
    name = 'uni200B'
    order = font.getGlyphOrder() + [name]
    glyf.glyphs[name] = Glyph()
    glyf.glyphOrder = order
    hmtx.metrics[name] = (0, 0)
    font.setGlyphOrder(order)
    for t in font['cmap'].tables:
        if t.isUnicode():
            t.cmap[0x200b] = name
else:
    hmtx.metrics[cmap[0x200b]] = (0, 0)
font.save(OUT)
miss = [c for c in chars if ord(c) not in font.getBestCmap()]
print('字數', len(chars), '大小', os.path.getsize(OUT), '字型沒有的字', ''.join(miss))
