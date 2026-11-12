#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
RO 倖存者離線版（非官方）── 最終版
====================================
遊戲作者已經封鎖離線遊玩，離線版到這個版本為止，不再下載、也不再開啟遊戲。

雙擊「開始遊戲.bat」會在瀏覽器開一個公告頁：
  作者已經封鎖離線遊玩，請直接前往線上版暢玩（https://ro-survivors.com/）。
  按下「確定」後，刪除之前下載到這個資料夾的遊戲程式和圖片音效（game\、cache\ 等）。
刪除完就可以把整個資料夾刪掉。

只用 Python 內建模組，不用另外安裝套件。需要 Python 3.7 以上。
"""
import argparse
import http.server
import json
import os
import re
import shutil
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

TOOL_VERSION = "2.0"
FINAL = True                      # 最終版：不再下載、開啟遊戲
OFFICIAL = "https://ro-survivors.com/"
PORT = 8381
GM_PORT = 8382
HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RO-Survivors-offline-player"}
# 之前版本下載到這個資料夾的東西（遊戲程式、圖片音效、更新時的備份）
DATA_DIRS = ["game", "game_new", "game_old", "cache", "_backup"]
# 瀏覽器存檔在 http://127.0.0.1:8381/（GM 模式 8382）底下：公告頁開在同一個網址，按確定時由頁面清掉
SW_STUB = (b"self.addEventListener('install',()=>self.skipWaiting());"
           b"self.addEventListener('activate',e=>e.waitUntil((async()=>{"
           b"for(const k of await caches.keys())await caches.delete(k);"
           b"await self.registration.unregister()})()));")


# ---------------- 離線工具自己的更新（從 GitHub Pages） ----------------
# 留著：萬一最終版的公告頁要修正，玩家還收得到
TOOL_URL = os.environ.get("RS_OFFLINE_UPDATE_URL") or \
    "https://jtnhrbpvvm-spec.github.io/taiwan_game2/" + urllib.parse.quote("RO倖存者") + "/offline/"


def ver_tuple(v):
    return tuple(int(x) for x in re.findall(r"\d+", str(v)))


def sha256_bytes(data):
    import hashlib
    return hashlib.sha256(data).hexdigest()


def sha256_file(path):
    try:
        with open(path, "rb") as f:
            return sha256_bytes(f.read())
    except OSError:
        return None


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def write(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def inside(base, rel):
    full = os.path.normpath(os.path.join(base, rel))
    return full if full.startswith(base + os.sep) else None


def self_update():
    """GitHub 上的版本比較新（或同版本但檔案不同）就換上；回傳 True 表示要重新啟動。"""
    try:
        info = json.loads(fetch(TOOL_URL + "version.json?t=%d" % int(time.time()), timeout=10).decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError):
        return False
    remote = str(info.get("version", ""))
    if ver_tuple(remote) < ver_tuple(TOOL_VERSION):
        return False
    files = info.get("files") or {}
    todo = [n for n, h in files.items()
            if not n.lower().endswith(".bat") and "/" not in n and "\\" not in n
            and inside(HERE, n) and sha256_file(inside(HERE, n)) != h]
    if not todo:
        return False
    new = {}
    for n in todo:
        try:
            data = fetch(TOOL_URL + urllib.parse.quote(n) + "?t=%d" % int(time.time()), timeout=30)
        except (urllib.error.URLError, OSError):
            return False
        if sha256_bytes(data) != files[n]:
            return False
        if n.endswith(".py"):
            try:
                compile(data, n, "exec")
            except SyntaxError:
                return False
        new[n] = data
    for n, data in new.items():
        write(os.path.join(HERE, n), data)
        print("  [更新] %s" % n)
    return True


# ---------------- 刪除下載的資料 ----------------
def data_size():
    files = size = 0
    for d in DATA_DIRS:
        for root, _, names in os.walk(os.path.join(HERE, d)):
            for n in names:
                files += 1
                try:
                    size += os.path.getsize(os.path.join(root, n))
                except OSError:
                    pass
    return files, size


def delete_data():
    files, size = data_size()
    left = []
    for d in DATA_DIRS:
        p = os.path.join(HERE, d)
        if os.path.isdir(p):
            shutil.rmtree(p, ignore_errors=True)
            if os.path.exists(p):
                left.append(d)
    return {"files": files, "mb": round(size / 1048576, 1), "left": left}


# ---------------- 公告頁 ----------------
PAGE = """<!doctype html>
<html lang="zh-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RO 倖存者離線版：最終版</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
         background: #1d2433; font-family: system-ui, "Segoe UI", "Microsoft JhengHei", sans-serif; color: #2b3a55; }
  .box { width: 100%%; max-width: 460px; background: #fff; border-radius: 16px; padding: 32px 28px 28px;
         text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,.35); }
  h1 { margin: 0 0 14px; font-size: 22px; color: #b23a3a; }
  p { margin: 10px 0; line-height: 1.7; font-size: 16px; }
  .end { color: #5b6b85; font-size: 14px; }
  button, a.btn { display: inline-block; margin-top: 18px; min-width: 160px; padding: 13px 26px; border: 0; border-radius: 10px;
         font-size: 17px; font-weight: 700; cursor: pointer; text-decoration: none; }
  button { background: #c94a4a; color: #fff; }
  button:disabled { opacity: .6; cursor: default; }
  a.btn { background: #4a86d9; color: #fff; }
  #done { display: none; }
  .small { font-size: 13px; color: #7a879c; margin-top: 16px; }
</style>
</head>
<body>
<div class="box">
  <div id="ask">
    <h1>作者已經封鎖離線遊玩</h1>
    <p>請直接前往線上版暢玩：<br><a href="%(url)s" target="_blank" rel="noopener">ro-survivors.com</a></p>
    <p class="end">此版本到這邊為止。<br>按下「確定」後，開始刪除之前下載的遊戲資料（%(info)s）<br>和瀏覽器裡的離線版存檔。</p>
    <button id="ok">確定</button>
  </div>
  <div id="done">
    <h1 style="color:#2f7a4a">資料已刪除</h1>
    <p id="result"></p>
    <p>感謝大家一路以來的支持！</p>
    <a class="btn" href="%(url)s">前往線上版暢玩</a>
    <p class="small">黑色視窗可以關掉了，整個「RO倖存者離線版」資料夾也可以直接刪除。</p>
  </div>
</div>
<script>
document.getElementById('ok').onclick = async function () {
  this.disabled = true; this.textContent = '刪除中…';
  let r = {};
  try { r = await (await fetch('/__delete', {method: 'POST'})).json(); } catch (e) {}
  // 舊版存在這個網址底下的瀏覽器存檔（遊戲已經不在了，一起清掉）
  try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
  try { if (indexedDB.databases) for (const d of await indexedDB.databases()) indexedDB.deleteDatabase(d.name); } catch (e) {}
  try { for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
  document.getElementById('result').textContent = r.left && r.left.length
    ? '有些檔案刪不掉（' + r.left.join('、') + '），請關掉黑色視窗後手動刪除整個資料夾。'
    : '已刪除 ' + (r.files || 0) + ' 個檔案（' + (r.mb || 0) + ' MB）和瀏覽器裡的離線版存檔。';
  document.getElementById('ask').style.display = 'none';
  document.getElementById('done').style.display = 'block';
};
</script>
</body>
</html>
"""


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _send(self, body, ctype, code=200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/sw.js":                       # 清掉舊版可能留下的快取程式
            return self._send(SW_STUB, "text/javascript")
        if path in ("/", "/index.html"):
            files, size = data_size()
            info = "%d 個檔案、%.1f MB" % (files, size / 1048576) if files else "目前沒有需要刪除的檔案"
            html = PAGE % {"url": OFFICIAL, "info": info}
            return self._send(html.encode("utf-8"), "text/html; charset=utf-8")
        if path == "/favicon.ico":
            return self._send(b"", "image/x-icon", 404)
        # 其他網址（舊版遊戲的書籤、分頁）一律回公告頁
        self.send_response(302)
        self.send_header("Location", "/")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n:
            self.rfile.read(n)
        if self.path.split("?")[0] != "/__delete":
            return self._send(b'{"error":"offline"}', "application/json", 503)
        r = delete_data()
        print("\n已刪除下載的遊戲資料：%d 個檔案、%s MB。" % (r["files"], r["mb"]))
        if r["left"]:
            print("刪不掉的資料夾：%s（請關掉這個視窗後手動刪除）" % "、".join(r["left"]))
        print("離線版到這邊為止，這個視窗可以關掉了。請前往線上版：" + OFFICIAL)
        self._send(json.dumps(r, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")
        threading.Timer(1.0, self.server.shutdown).start()


def serve(port, open_browser=True):
    server = None
    for p in [port] + list(range(PORT + 2, PORT + 20)):
        try:
            server = http.server.ThreadingHTTPServer(("127.0.0.1", p), Handler)
            break
        except OSError:
            continue
    if server is None:
        print("找不到可以用的埠號，請先關掉其他離線版視窗再試。")
        print("離線版已經停止提供，請前往線上版：" + OFFICIAL)
        return 1
    url = "http://127.0.0.1:%d/" % server.server_address[1]
    print("公告頁：" + url)
    print("在瀏覽器按「確定」就會刪除下載的遊戲資料。")
    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


def main():
    ap = argparse.ArgumentParser(description="RO 倖存者離線版（非官方）最終版")
    ap.add_argument("--gm", action="store_true")
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--no-self-update", action="store_true")
    args, _ = ap.parse_known_args()          # 舊版的其他參數（--no-update 等）一律忽略
    print("RO 倖存者離線版（非官方）v%s 最終版\n" % TOOL_VERSION)
    print("作者已經封鎖離線遊玩，請直接前往線上版暢玩：" + OFFICIAL)
    print("此版本到這邊為止，不會再下載或開啟遊戲。\n")
    if not args.no_self_update and self_update():
        import subprocess
        return subprocess.call([sys.executable, os.path.abspath(__file__)] + sys.argv[1:] + ["--no-self-update"])
    # GM 模式的存檔在 8382 埠號：用同一個埠號開公告頁，按確定時才清得到那邊的瀏覽器存檔
    return serve(GM_PORT if args.gm else PORT, not args.no_browser)


if __name__ == "__main__":
    sys.exit(main())
