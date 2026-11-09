#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
把 offline\ 的玩家版離線工具打包成 offline\ro-survivors-offline.zip（給說明頁的下載按鈕用）。
改了 offline\ 裡下面 FILES 列的任何檔案之後要重跑：
    python tools\pack_offline.py
zip 裡只有這幾個檔案，放在「RO倖存者離線版\」資料夾底下；不包含任何遊戲檔案。
"""
import os
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OFF = os.path.join(os.path.dirname(HERE), "offline")
FILES = ["開始遊戲.bat", "以GM模式開始遊戲.bat", "rs_offline.py", "gm.js", "說明.txt"]
OUT = os.path.join(OFF, "ro-survivors-offline.zip")

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for name in FILES:
        z.write(os.path.join(OFF, name), "RO倖存者離線版/" + name)
print("已打包：%s（%d bytes）" % (OUT, os.path.getsize(OUT)))

# version.json：玩家的離線工具啟動時會從 GitHub Pages 讀它，版本比較新就自動下載換上
import hashlib
import json
import re

with open(os.path.join(OFF, "rs_offline.py"), encoding="utf-8") as f:
    version = re.search(r'TOOL_VERSION = "([^"]+)"', f.read()).group(1)
files = {}
for name in FILES:
    with open(os.path.join(OFF, name), "rb") as f:
        files[name] = hashlib.sha256(f.read()).hexdigest()
with open(os.path.join(OFF, "version.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump({"version": version, "files": files}, f, ensure_ascii=False, indent=1)
print("已產生 version.json（v%s）" % version)
