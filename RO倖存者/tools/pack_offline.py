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
