"""
關東戰術 Kanto Tactics 繁中書籤：建字表

從最新爬下來的遊戲（Desktop\\爬蟲\\kanto-tactics-tool\\kt-crawl）取出所有中文字串，
用 OpenCC s2twp（簡體→台灣正體＋台灣慣用詞）算出要換的「字」和「詞」，
只留遊戲真的用得到的，寫進 ../kt-zh.js 的 /*DICT*/ ... /*END*/ 之間。

用法：python tools\\build_zh.py [爬蟲版本資料夾]
需要：pip install opencc（OpenCC 1.1 以上，附 opencc_dict.exe）

書籤裡的換字方式（kt-zh.js 的 conv）是「最長詞優先，再逐字換」，
這裡會拿它和 OpenCC 的結果逐句比對，對不上的列在最後。
"""
import json
import os
import re
import subprocess
import sys
import tempfile

import opencc

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKMARK = os.path.join(HERE, "..", "kt-zh.js")
CRAWL = r"C:\Users\a2095\Desktop\爬蟲\kanto-tactics-tool\kt-crawl"

# OpenCC 翻得不適合遊戲的，在這裡蓋掉（簡體: 繁體）。空字串 = 不用詞表、照逐字換。
# 2026-10-22 v34.1 逐一看過遊戲裡的上下文決定。
FIX = {
    # 遊戲用語
    "回复": "回復",      # 回血，不是回覆訊息
    "刷新": "刷新",      # 刷新商店，不是重新整理
    "组件": "組件",      # 道具組件
    "代码": "代碼",      # 隊伍代碼
    "镜像": "鏡像",      # 對戰鏡像
    "类型": "類型",
    "高级": "高級",      # 高級市場
    "分区": "分區",      # 大廳分區
    "绑定": "綁定",      # 綁定帳號
    "发布": "發布",
    "点击": "點擊",
    "屏蔽": "封鎖",      # 封鎖好友
    "缩进": "縮進",      # 縮進殼裡
    "奔驰": "奔馳",      # 直線奔馳 4 格
    "自行车": "自行車",  # 自行車道（地名）
    "挨打": "挨打",
    "天后": "天後",      # {n}天後結束
    "战斗": "戰鬥",
    "格斗": "格鬥",
    "修复": "修復",
    "用于": "用於",
    # OpenCC 斷詞斷錯的，照逐字換
    "卡里": "", "里加": "", "里长": "", "并为": "", "并力": "", "打并": "",
    "只立": "", "制为": "", "复按": "", "斗的": "", "于归": "", "梦系": "",
    "布会": "", "低回": "",
}

CJK = re.compile(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+")


def latest_dir():
    idx = json.load(open(os.path.join(CRAWL, "index.json"), encoding="utf8"))
    return os.path.join(CRAWL, idx[-1]["dir"])


def corpus(ver_dir):
    """所有中文片段。日文表 ja-*.js 跳過（漢字會混進來）。"""
    runs = set()
    files = []
    adir = os.path.join(ver_dir, "assets")
    for name in os.listdir(adir):
        if name.endswith(".js") and not name.startswith("ja-"):
            files.append(os.path.join(adir, name))
    files.append(os.path.join(ver_dir, "changelog.json"))
    for f in files:
        text = open(f, encoding="utf8", errors="replace").read()
        if f.endswith("changelog.json"):
            # 更新紀錄只取 zh 欄位
            text = "\n".join(re.findall(r'"zh":\s*"((?:[^"\\]|\\.)*)"', text))
        runs.update(CJK.findall(text))
    return runs


def load_dict(path):
    out = {}
    for line in open(path, encoding="utf8"):
        line = line.rstrip("\n")
        if "\t" not in line:
            continue
        k, v = line.split("\t", 1)
        out[k] = v.split(" ")[0]
    return out


def export_dicts():
    base = os.path.dirname(opencc.__file__)
    exe = os.path.join(base, "clib", "bin", "opencc_dict.exe")
    share = os.path.join(base, "clib", "share", "opencc")
    tmp = tempfile.mkdtemp(prefix="ktzh_")
    out = {}
    for n in ["STPhrases", "STPhrases_GeneratedFromRegionalPhrases", "TWPhrases", "TWVariantsPhrases"]:
        dst = os.path.join(tmp, n + ".txt")
        subprocess.run([exe, "-i", os.path.join(share, n + ".ocd2"), "-o", dst, "-f", "ocd2", "-t", "text"], check=True)
        out[n] = load_dict(dst)
    return out


def emulate(s, table, maxlen):
    """和 kt-zh.js 的 conv 一樣：最長詞優先。"""
    out = []
    i = 0
    n = len(s)
    while i < n:
        for L in range(min(maxlen, n - i), 0, -1):
            v = table.get(s[i:i + L])
            if v is not None:
                out.append(v)
                i += L
                break
        else:
            out.append(s[i])
            i += 1
    return re.sub(r"([0-9０-９])只", r"\1隻", "".join(out))


def main():
    ver_dir = sys.argv[1] if len(sys.argv) > 1 else latest_dir()
    print("遊戲資料：", ver_dir)
    runs = corpus(ver_dir)
    blob = "\n".join(sorted(runs))
    print("中文片段", len(runs), "段，", len(blob), "字")

    s2twp = opencc.OpenCC("s2twp")
    t2s = opencc.OpenCC("t2s")
    dicts = export_dicts()

    table = {}
    # 字
    for c in set(blob) - {"\n"}:
        t = s2twp.convert(c)
        if t != c:
            table[c] = t
    # 詞：簡體詞表
    cand = set()
    for n in ["STPhrases", "STPhrases_GeneratedFromRegionalPhrases"]:
        for k in dicts[n]:
            if len(k) > 1 and k in blob:
                cand.add(k)
    # 詞：台灣慣用詞表的鍵是繁體，轉回簡體再找
    for n in ["TWPhrases", "TWVariantsPhrases"]:
        for k in dicts[n]:
            s = t2s.convert(k)
            if len(s) > 1 and s in blob:
                cand.add(s)
    for k in cand:
        t = s2twp.convert(k)
        if t != emulate(k, {c: v for c, v in table.items() if len(c) == 1}, 1):
            table[k] = t
    for k, v in FIX.items():
        if v:
            table[k] = v
        else:
            table.pop(k, None)

    maxlen = max(len(k) for k in table)
    bad = []
    for r in sorted(runs):
        want = s2twp.convert(r)
        for k, v in FIX.items():
            if k in r:
                want = None  # 有手動蓋掉的詞，不和 OpenCC 比
        got = emulate(r, table, maxlen)
        if want is not None and got != want:
            bad.append((r, got, want))

    chars = sorted(k for k in table if len(k) == 1)
    words = sorted((k for k in table if len(k) > 1), key=lambda k: (-len(k), k))
    data = "".join(chars) + "|" + "".join(table[c] for c in chars) + "|" + ";".join(k + "=" + table[k] for k in words)
    assert len("".join(table[c] for c in chars)) == len(chars), "有單字換成多字"

    src = open(BOOKMARK, encoding="utf8").read()
    new = re.sub(r"/\*DICT\*/.*?/\*END\*/", lambda m: "/*DICT*/" + json.dumps(data, ensure_ascii=False) + "/*END*/", src, flags=re.S)
    open(BOOKMARK, "w", encoding="utf8", newline="\n").write(new)

    print("字", len(chars), "個；詞", len(words), "個；字表", len(data), "字")
    print("台灣用語換掉的詞（請看有沒有不適合遊戲的）：")
    for k in words:
        tw = table[k]
        plain = emulate(k, {c: table[c] for c in chars}, 1)
        if tw != plain:
            print("  ", k, "→", tw, "（逐字是", plain + "）")
    print("和 OpenCC 對不上：", len(bad))
    for r, g, w in bad[:40]:
        print("  ", r, "書籤:", g, "OpenCC:", w)


if __name__ == "__main__":
    main()
