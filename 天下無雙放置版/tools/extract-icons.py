"""從示意圖抽出圖示，輸出成 alpha 遮罩 PNG 到 圖片/ui/mask/。

做法：亮度 -> alpha（圖示是亮的，卡片內底是暗的），然後
  1. 丟掉「碰到裁切框邊界」的連通區塊 —— 按鈕外框一定碰邊，圖示不會。
     （早期版本是無差別把邊緣一圈歸零，只要圖示延伸到那圈就會被削成平口，
      角色的下襬、鼎足、齒輪右半邊都是這樣被切掉的。）
  2. 丟掉小於最大區塊 12% 的碎塊 —— 去掉火花、壓縮雜點、圖釘下的陰影。
  3. 自動檢查：抽完若仍有像素貼在裁切框邊界，代表框開得不夠大，會警告。

改完參數後重跑，再跑 build-icon-css.py 重新產生內嵌 CSS。
"""
from PIL import Image, ImageFilter
from collections import deque
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG = os.path.join(HERE, "reference")          # 放示意圖原檔
DEST = os.path.join(ROOT, "圖片", "ui", "mask")
CANVAS = 128

# (輸出名, 來源圖, 裁切框, 亮度下限, 亮度上限)
# 裁切框要開得比圖示大一圈，讓圖示不會碰到邊界。
JOBS = [
    ("char",      "3.webp", (32, 50, 178, 198), 58, 198),
    ("hunt",      "3.webp", (218, 50, 364, 198), 58, 198),
    ("inventory", "3.webp", (406, 50, 552, 198), 58, 198),
    ("skill",     "3.webp", (218, 280, 364, 428), 58, 198),
    ("shop",      "3.webp", (406, 280, 552, 428), 58, 198),
    # 這三顆的圖示比較滿版，框要開更大才不會被邊界帶吃到
    ("home",      "3.webp", (22, 544, 188, 712), 58, 198),
    ("boss",      "3.webp", (218, 554, 364, 702), 58, 198),
    ("forge",     "3.webp", (396, 544, 562, 712), 58, 198),
    ("warehouse", "2.webp", (318, 50, 406, 138), 138, 215),
    ("system",    "7.webp", (361, 276, 513, 424), 120, 235),
    ("tp",        "4.webp", (46, 54, 128, 136), 150, 235),
    ("auto",      "4.webp", (184, 52, 266, 136), 132, 215),
    ("res-power", "6.webp", (58, 60, 224, 226), 84, 210),
    ("res-stone", "6.webp", (58, 312, 224, 478), 86, 225),
    # 下緣刻意切在圖釘底下那圈陰影上：陰影因此碰到邊界而被移除，圖釘本身不受影響
    ("res-place", "6.webp", (58, 562, 224, 710), 92, 205),
    ("res-state", "6.webp", (58, 812, 224, 978), 68, 200),
]


# 判定為「外框碎片」的邊界帶寬度。用 0 只抓真正貼邊的，但按鈕四角的裝飾弧
# 常常離邊界幾像素，所以放寬成一條帶子。圖示是置中的，不會落在這條帶子裡。
EDGE_BAND = 5


def components(a, thr=48):
    w, h = a.size
    ap = a.load()
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y0 in range(h):
        for x0 in range(w):
            if seen[y0][x0] or ap[x0, y0] <= thr:
                continue
            q, comp, touches = deque([(x0, y0)]), [], False
            seen[y0][x0] = True
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                if (x < EDGE_BAND or y < EDGE_BAND
                        or x >= w - EDGE_BAND or y >= h - EDGE_BAND):
                    touches = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and ap[nx, ny] > thr:
                        seen[ny][nx] = True
                        q.append((nx, ny))
            cx = sum(p[0] for p in comp) / len(comp)
            cy = sum(p[1] for p in comp) / len(comp)
            # 角落區判定：以畫面中心正規化，內接橢圓為 1.0，四個角為 2.0。
            # 按鈕外框的角落裝飾弧質心會落在這裡；置中的圖示不會。
            u = (cx - w / 2) / (w / 2)
            v = (cy - h / 2) / (h / 2)
            in_corner = (u * u + v * v) > 1.05
            comps.append((comp, touches or in_corner))
    return comps


def build(im, box, lo, hi, name):
    g = im.crop(box).convert("L").filter(ImageFilter.MedianFilter(3))
    w, h = g.size
    a = Image.new("L", (w, h))
    gp, ap = g.load(), a.load()
    for y in range(h):
        for x in range(w):
            t = (gp[x, y] - lo) * 255 // (hi - lo)
            ap[x, y] = 0 if t < 0 else (255 if t > 255 else t)

    comps = components(a)
    if not comps:
        print("  !! %s 什麼都沒抽到，檢查亮度門檻" % name)
        return None
    # 1. 碰到邊界的丟掉（外框碎片）
    kept = [c for c, touched in comps if not touched]
    dropped_edge = len(comps) - len(kept)
    if not kept:
        print("  !! %s 全部區塊都碰到邊界，裁切框要開更大" % name)
        kept = [c for c, _ in comps]
        dropped_edge = 0
    # 2. 只丟掉真正的雜點。不要用「相對最大區塊的比例」來濾——這些圖示帶明暗
    #    層次，本來就會被切成很多中小區塊，用比例濾會連劍身、箱蓋、鬼面都砍掉。
    final = [c for c in kept if len(c) >= 30]
    dropped_small = len(kept) - len(final)

    clean = Image.new("L", (w, h), 0)
    cp = clean.load()
    for comp in final:
        for x, y in comp:
            cp[x, y] = ap[x, y]

    # 3. 檢查有沒有貼到邊界 = 可能被裁掉
    cw, ch = clean.size
    b = EDGE_BAND + 1
    edge = max(
        max(cp[x, y] for x in range(cw) for y in range(b)),
        max(cp[x, y] for x in range(cw) for y in range(ch - b, ch)),
        max(cp[x, y] for y in range(ch) for x in range(b)),
        max(cp[x, y] for y in range(ch) for x in range(cw - b, cw)),
    )
    warn = "  << 貼到裁切框邊界，可能被切！" if edge > 40 else ""

    bb = clean.point(lambda v: 255 if v > 48 else 0).getbbox()
    if bb:
        clean = clean.crop(bb)
    s = min((CANVAS - 8) / clean.width, (CANVAS - 8) / clean.height)
    clean = clean.resize((max(1, round(clean.width * s)), max(1, round(clean.height * s))), Image.LANCZOS)
    out = Image.new("L", (CANVAS, CANVAS), 0)
    out.paste(clean, ((CANVAS - clean.width) // 2, (CANVAS - clean.height) // 2))

    print("  %-11s 區塊 %2d -> 去邊框 %d、去碎塊 %d -> 留 %d%s"
          % (name, len(comps), dropped_edge, dropped_small, len(final), warn))
    return out


def main():
    os.makedirs(DEST, exist_ok=True)
    cache = {}
    sheet = Image.new("RGB", (CANVAS * 6, CANVAS * 3), (16, 24, 44))
    strip = Image.new("RGB", (len(JOBS) * 34 + 10, 46), (16, 24, 44))
    for i, (name, srcfile, box, lo, hi) in enumerate(JOBS):
        path = os.path.join(IMG, srcfile)
        if not os.path.exists(path):
            print("  !! 找不到來源 %s（請放進 tools/reference/）" % path)
            continue
        if srcfile not in cache:
            cache[srcfile] = Image.open(path).convert("RGB")
        a = build(cache[srcfile], box, lo, hi, name)
        if a is None:
            continue
        rgba = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 255))
        rgba.putalpha(a)
        rgba.save(os.path.join(DEST, name + ".png"))

        tint = (110, 200, 255) if name == "res-stone" else (242, 202, 122)
        col = Image.new("RGB", (CANVAS, CANVAS), tint)
        tile = Image.new("RGB", (CANVAS, CANVAS), (16, 24, 44))
        tile.paste(col, (0, 0), a)
        sheet.paste(tile, ((i % 6) * CANVAS, (i // 6) * CANVAS))

        s26 = a.resize((26, 26), Image.LANCZOS)
        c26 = Image.new("RGB", (26, 26), tint)
        t26 = Image.new("RGB", (26, 26), (16, 24, 44))
        t26.paste(c26, (0, 0), s26)
        strip.paste(t26, (10 + i * 34, 10))

    prev = os.path.join(HERE, "preview")
    os.makedirs(prev, exist_ok=True)
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.LANCZOS).save(os.path.join(prev, "icons.png"))
    strip.resize((strip.width * 4, strip.height * 4), Image.NEAREST).save(os.path.join(prev, "icons-26px.png"))
    print("\n預覽 -> tools/preview/")


if __name__ == "__main__":
    main()
