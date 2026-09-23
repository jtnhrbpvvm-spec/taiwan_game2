"""把 圖片/ui/mask/*.png 內嵌成 data URI，產生 ui-icon-masks.css。

為什麼要這樣做：CSS 的 mask-image 受 CORS 限制，而用 file:// 直接開網頁時
每個檔案都是獨立的不透明來源，外部遮罩檔會載入失敗（元素會整個消失）。
data URI 視為同源，所以雙擊 index.html 也能正常顯示。

遮罩只看 alpha，所以先轉成灰階+alpha（色彩型別 4）再壓縮，體積約可省一半。

用法：  python tools/build-icon-css.py
"""
from PIL import Image
import base64
import io
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASK_DIR = os.path.join(ROOT, "圖片", "ui", "mask")
OUT = os.path.join(ROOT, "ui-icon-masks.css")

# 名稱 -> 套用的選擇器
DOCK = {
    "char": "character", "hunt": "hunt", "inventory": "inventory", "skill": "skill",
    "shop": "shop", "home": "home", "boss": "boss", "forge": "forge",
    "system": "system", "warehouse": "warehouse",
}
ACTIONS = {"tp": "#tpBtn", "auto": "#autoBtn", "warehouse": "#whBtn", "system": "#settingsBtn"}


def data_uri(path):
    im = Image.open(path).convert("RGBA")
    alpha = im.split()[3]
    # RGB 一律是黑的，只有 alpha 有意義 -> 灰階+alpha，體積小很多
    la = Image.merge("LA", (Image.new("L", im.size, 0), alpha))
    buf = io.BytesIO()
    la.save(buf, format="PNG", optimize=True)
    raw = buf.getvalue()
    return "data:image/png;base64," + base64.b64encode(raw).decode("ascii"), len(raw)


lines = [
    "/* 自動產生，請勿手改 —— 由 tools/build-icon-css.py 產生。",
    "   圖示遮罩以 data URI 內嵌，讓 file:// 直接開啟時也能顯示",
    "   （外部遮罩檔會被 CORS 擋掉）。顏色仍由 ui-buttons.css 控制。",
    "   每個網址只存一份在 :root 變數裡，避免前綴與共用造成重複。",
    "   要換圖示：改 圖片/ui/mask/*.png 後重跑這支腳本。 */",
    "",
]

total = 0
uris = {}
for name in sorted(set(list(DOCK) + list(ACTIONS))):
    path = os.path.join(MASK_DIR, name + ".png")
    if not os.path.exists(path):
        print("!! 找不到", path)
        continue
    uri, size = data_uri(path)
    uris[name] = uri
    total += size

# 每張圖只寫一次，之後全部用 var() 取用
lines.append(":root{")
for name in sorted(uris):
    lines.append('  --ico-%s:url("%s");' % (name, uris[name]))
lines.append("}")
lines.append("")

for name, ico in DOCK.items():
    if name not in uris:
        continue
    lines.append(
        '.dock button[data-ico="%s"] b{-webkit-mask-image:var(--ico-%s);mask-image:var(--ico-%s)}'
        % (ico, name, name)
    )

lines.append("")
for name, sel in ACTIONS.items():
    if name not in uris:
        continue
    lines.append(
        '#game .actions %s:before{-webkit-mask-image:var(--ico-%s);mask-image:var(--ico-%s)}'
        % (sel, name, name)
    )
lines.append("")

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines))

print("內嵌 %d 個遮罩，PNG 原始共 %.1f KB" % (len(uris), total / 1024))
print("產生 %s，%.1f KB" % (os.path.basename(OUT), os.path.getsize(OUT) / 1024))
