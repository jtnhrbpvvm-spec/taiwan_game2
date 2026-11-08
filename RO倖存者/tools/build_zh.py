#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
build_zh.py —— 把翻譯檔合成書籤 ro-zh.js

資料來源：最新一次爬蟲的 i18n.json（…\爬蟲\ro-survivors-tool\rs-crawl\<版本>\src\i18n.json）
翻譯檔：tools\zh\*.txt，每行一筆，用 Tab 分隔：
    編號<Tab>中文            介面字串（編號對應 tools\ids.json 裡的西文原文）
    @英文名稱<Tab>中文        怪物、物品、卡片、技能、職業名稱
  # 開頭是註解。字串裡的換行寫成 \n。
  {n}、{0}、<b> 這類標記要原樣保留，對不上的會列出來、不會放進書籤。

用法：
    python tools\build_zh.py          合成 ro-zh.js（從 ro-zh.src.js 填入翻譯表）
    python tools\build_zh.py --todo   另外產生 tools\todo.txt：還沒翻的字串（編號<Tab>英文）
"""
import glob
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CRAWL = os.environ.get("RS_CRAWL") or r"C:\Users\a2095\Desktop\爬蟲\ro-survivors-tool\rs-crawl"
IDS = os.path.join(HERE, "ids.json")
SRC = os.path.join(ROOT, "ro-zh.src.js")
OUT = os.path.join(ROOT, "ro-zh.js")

TOKEN = re.compile(r"\{\w+\}|</?\w+[^>]*>|%[sd]")


def load_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def latest_i18n():
    index = load_json(os.path.join(CRAWL, "index.json"), [])
    for e in reversed(index):
        p = os.path.join(CRAWL, e["dir"], "src", "i18n.json")
        if os.path.isfile(p):
            return e["dir"], load_json(p, None)
    sys.exit("找不到爬蟲的 i18n.json，先跑一次爬蟲。")


def main():
    want_todo = "--todo" in sys.argv
    ver, data = latest_i18n()
    en = dict(data["en"])
    src_en = dict(en)
    src_en.update(data["extra"])
    for k in data["keys"]:
        src_en.setdefault(k, k)
    names = set(data["names"]) | set(data["items"].values()) | set(data["cards"].values())

    ids = load_json(IDS, {})
    nxt = max([int(v) for v in ids.values()] + [0]) + 1
    for k in src_en:
        if k not in ids:
            ids[k] = str(nxt)
            nxt += 1
    with open(IDS, "w", encoding="utf-8", newline="\n") as f:
        json.dump(ids, f, ensure_ascii=False, indent=0)
    by_id = {v: k for k, v in ids.items()}

    ui, nm, bad, dup = {}, {}, [], 0
    for path in sorted(glob.glob(os.path.join(HERE, "zh", "*.txt"))):
        with open(path, "r", encoding="utf-8-sig") as f:
            for no, line in enumerate(f, 1):
                line = line.rstrip("\r\n")
                if not line.strip() or line.startswith("#"):
                    continue
                if "\t" not in line:
                    bad.append(f"{os.path.basename(path)}:{no} 沒有 Tab：{line[:40]}")
                    continue
                key, zh = line.split("\t", 1)
                zh = zh.replace("\\n", "\n").strip()
                if not zh:
                    continue
                if key.startswith("@"):
                    nm[key[1:]] = zh
                    continue
                k = by_id.get(key.strip())
                if k is None:
                    bad.append(f"{os.path.basename(path)}:{no} 編號 {key} 不存在")
                    continue
                ref = src_en.get(k, k)
                if sorted(TOKEN.findall(ref)) != sorted(TOKEN.findall(zh)) and sorted(TOKEN.findall(k)) != sorted(TOKEN.findall(zh)):
                    bad.append(f"{os.path.basename(path)}:{no} 標記不一致 #{key}：{ref!r} → {zh!r}")
                    continue
                if k in ui:
                    dup += 1
                ui[k] = zh

    used_ui = {k: v for k, v in ui.items() if k in src_en}
    # 名稱全部放進去：爬蟲抽不到的（地圖標籤、寫死在 HTML 的字）也能在 names.txt 手動補
    used_nm = dict(nm)
    with open(SRC, "r", encoding="utf-8") as f:
        code = f.read()
    blob = json.dumps({"ui": used_ui, "names": used_nm}, ensure_ascii=False, separators=(",", ":"))
    blob = blob.replace("</", "<\\/")
    code, n = re.subn(r"^/\*ZH\*/.*?/\*END\*/", lambda m: "/*ZH*/const ZH = " + blob + ";/*END*/", code, flags=re.S | re.M)
    if n != 1:
        sys.exit("ro-zh.src.js 裡找不到 /*ZH*/…/*END*/")
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(code)

    miss_ui = [k for k in src_en if k not in used_ui]
    miss_nm = sorted(n for n in names if n not in used_nm)
    print(f"遊戲版本：{ver}")
    print(f"介面字串 {len(used_ui)}/{len(src_en)}，名稱 {len(used_nm)}/{len(names)}；ro-zh.js {len(code.encode('utf-8')) // 1024} KB")
    if dup:
        print(f"（有 {dup} 筆重複翻譯，以後面檔案的為準）")
    for b in bad[:80]:
        print("  ⚠ " + b)
    if len(bad) > 80:
        print(f"  …還有 {len(bad) - 80} 筆問題")
    if want_todo:
        with open(os.path.join(HERE, "todo.txt"), "w", encoding="utf-8", newline="\n") as f:
            for k in miss_ui:
                f.write(ids[k] + "\t" + src_en[k].replace("\n", "\\n") + "\n")
            for n in miss_nm:
                f.write("@" + n + "\t\n")
        print(f"todo.txt：介面 {len(miss_ui)} 筆、名稱 {len(miss_nm)} 筆")


if __name__ == "__main__":
    main()
