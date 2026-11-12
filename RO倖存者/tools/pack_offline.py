#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
把 offline\ 的玩家版離線工具打包成 offline\ro-survivors-offline.zip（給說明頁的下載按鈕用）。
改了 offline\ 裡下面 FILES 列的任何檔案之後要重跑：
    python tools\pack_offline.py
zip 裡只有這幾個檔案，放在「RO倖存者離線版\」資料夾底下；不包含任何遊戲檔案。
打包前會先把 tools\zh\names.txt 的譯名填進 offline\zh.js（補翻譯後也要重跑這支）。
"""
import json
import os
import re
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OFF = os.path.join(os.path.dirname(HERE), "offline")
# 2026-11-13 v2.0 最終版：作者封鎖離線遊玩，rs_offline.py 只顯示公告＋刪除資料，gm.js／zh.js／report.js 不再需要
FILES = ["開始遊戲.bat", "以GM模式開始遊戲.bat", "rs_offline.py", "install_python.ps1", "說明.txt"]
# python-manager-26.4.msix（約 96 MB）不放進 zip：只有沒 Python 的人才由 install_python.ps1 從說明頁下載
OUT = os.path.join(OFF, "ro-survivors-offline.zip")

# ---- 譯名：names.txt（@英文<Tab>中文）→ zh.js 的 NAMES ----
names = {}
with open(os.path.join(HERE, "zh", "names.txt"), encoding="utf-8") as f:
    for line in f:
        line = line.rstrip("\r\n")
        if line.startswith("@") and "\t" in line:
            en, zh = line[1:].split("\t", 1)
            if en.strip() and zh.strip():
                names[en.strip()] = zh.strip()
zh_path = os.path.join(OFF, "zh.js")
with open(zh_path, encoding="utf-8") as f:
    src = f.read()
line = "/*NAMES*/const NAMES = " + json.dumps(names, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + ";/*END*/"
new, n = re.subn(r"/\*NAMES\*/.*?/\*END\*/", lambda m: line, src, count=1, flags=re.S)
if not n:
    raise SystemExit("zh.js 裡找不到 /*NAMES*/…/*END*/")
if new != src:
    with open(zh_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(new)
    print("zh.js 譯名已更新（%d 個）" % len(names))
else:
    print("zh.js 譯名沒有變化（%d 個）" % len(names))

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for name in FILES:
        z.write(os.path.join(OFF, name), "RO倖存者離線版/" + name)
print("已打包：%s（%d bytes）" % (OUT, os.path.getsize(OUT)))

# version.json：玩家的離線工具啟動時會從 GitHub Pages 讀它，
# 版本比較新、或版本相同但檔案內容不同（例如只補了翻譯）就自動下載換上
import hashlib

with open(os.path.join(OFF, "rs_offline.py"), encoding="utf-8") as f:
    version = re.search(r'TOOL_VERSION = "([^"]+)"', f.read()).group(1)
files = {}
for name in FILES:
    with open(os.path.join(OFF, name), "rb") as f:
        files[name] = hashlib.sha256(f.read()).hexdigest()
with open(os.path.join(OFF, "version.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"version": version, "files": files}, f, ensure_ascii=False, indent=1)
print("已產生 version.json（v%s）" % version)
