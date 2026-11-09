#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
RO 倖存者離線版（非官方）
==========================
雙擊「開始遊戲.bat」就會：
  1. 連到官網 https://ro-survivors.com/ 檢查有沒有新版本，有的話下載遊戲程式到 game\ 資料夾
     （連不上官網時，直接用上次下載的版本）
  2. 在自己的電腦開一個小伺服器（只有本機連得到），用瀏覽器開遊戲
  3. 第一次會把圖片、音效全部下載到 cache\ 資料夾（約 50 MB、3 分鐘左右），之後沒網路也能玩

限制：
  - 離線版不會連到官方伺服器：帳號登入、雲端存檔、排行榜都不能用，進度也不會同步到官方帳號。
  - 離線版的進度存在瀏覽器裡（網址 http://127.0.0.1:8381/ 底下），清除瀏覽器資料就會不見。
  - 本程式不包含任何遊戲檔案，遊戲檔案都是執行時從官網下載到你自己的電腦。
    遊戲內容版權屬於 RO Survivors 與 Gravity。

只用 Python 內建模組，不用另外安裝套件。需要 Python 3.7 以上。
其他用法（在命令提示字元執行）：
  python rs_offline.py --no-update   不檢查更新，直接用已下載的版本
  python rs_offline.py --update-only 只檢查更新、下載，不開遊戲
  python rs_offline.py --gm          GM 模式（以GM模式開始遊戲.bat）：載入 gm.js，可以創造道具、改數值；
                                     用 8382 埠號，存檔跟一般模式分開
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

TOOL_VERSION = "1.3"
ORIGIN = "https://ro-survivors.com/"
PORT = 8381                       # 固定埠號：瀏覽器的存檔跟著網址走，換埠號會看不到舊存檔
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(HERE, "game")            # 目前版本的遊戲程式
CACHE = os.path.join(HERE, "cache")          # 圖片、音效（啟動時預先下載，漏掉的玩的時候再補）
VERSION_FILE = os.path.join(GAME, "version.json")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RO-Survivors-offline-player"}

# 把遊戲的離線快取程式換成「清掉自己」的空殼，避免瀏覽器一直用舊版
SW_STUB = (b"self.addEventListener('install',()=>self.skipWaiting());"
           b"self.addEventListener('activate',e=>e.waitUntil((async()=>{"
           b"for(const k of await caches.keys())await caches.delete(k);"
           b"await self.registration.unregister()})()));")
TYPES = {".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".html": "text/html; charset=utf-8",
         ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".gif": "image/gif",
         ".wav": "audio/wav", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".ico": "image/x-icon", ".woff2": "font/woff2",
         ".woff": "font/woff", ".ttf": "font/ttf", ".webmanifest": "application/manifest+json", ".txt": "text/plain",
         ".fnt": "text/plain", ".xml": "text/xml", ".atlas": "text/plain"}
lock = threading.Lock()
ONLINE = False                    # 這次啟動連得到官網嗎（連不到就不預先下載素材）

# ---------------- GM 模式（以GM模式開始遊戲.bat） ----------------
# 用另一個埠號：瀏覽器存檔跟著網址走，GM 存檔和一般離線存檔完全分開
GM_PORT = 8382
GM = False
GM_JS = os.path.join(HERE, "gm.js")
# 對遊戲主程式的修補（變數名稱每版都會變，用正規表示式找；找不到就略過，GM 面板會顯示提醒）
GM_PATCHES = [
    # 素質點數超過可分配點數時，遊戲會把素質重置 → GM 模式不檢查
    ("statCheck", re.compile(rb"\w+\(e\.level,e\.stats\)<0&&\(e\.stats=\w+\(\)\)"), lambda m: b"!1"),
    # 遊戲局的畫面物件建立時，把遊戲局資料交給 GM 面板（改金幣用）
    ("game", re.compile(rb"this\.game=(\w+),(\w+)\(\"hud-name\"\)"),
     lambda m: b"this.game=" + m.group(1) + b",window.__gmGame=" + m.group(1) + b"," + m.group(2) + b"(\"hud-name\")"),
    # 裝備攻防的計算函式 function ha(a,e=a.refine??0){…}：交給 GM 面板顯示創造裝備的攻／防
    ("power", re.compile(rb"function (\w+)\((\w),(\w)=\2\.refine\?\?0\)\{"),
     lambda m: b"window.__gmHa=" + m.group(1) + b";" + m.group(0)),
]
GM_STATUS = {}


def gm_patch(code):
    for name, rx, rep in GM_PATCHES:
        code, n = rx.subn(rep, code, count=1)
        GM_STATUS[name] = bool(n)
    return code


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


def read_json(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def inside(base, rel):
    """rel 轉成 base 底下的完整路徑；跑出 base 外面就回 None（防止 ../ 讀到別的檔案）"""
    full = os.path.normpath(os.path.join(base, rel))
    return full if full.startswith(base + os.sep) else None


# ----------------------------------------------------------------------------
# 檢查更新、下載遊戲程式
# ----------------------------------------------------------------------------
def update():
    """回傳 True 表示 game\\ 裡有可以玩的版本。"""
    old = read_json(VERSION_FILE)
    have = os.path.isfile(os.path.join(GAME, "index.html"))
    print("檢查遊戲版本…")
    try:
        sw = fetch(ORIGIN + "sw.js?t=%d" % int(time.time()), timeout=15).decode("utf-8", "replace")
    except (urllib.error.URLError, OSError) as e:
        if have:
            print("  連不上官網（%s），使用上次下載的版本 %s。" % (e, old.get("name", "")))
            return True
        print("  連不上官網（%s），而且還沒有下載過遊戲。請確認網路後再試一次。" % e)
        return False
    global ONLINE
    ONLINE = True

    m = re.search(r"const PRECACHE = (\[.*?\]);", sw, re.S)
    shell = (re.search(r"const SHELL = '([^']+)'", sw) or [None, None])[1]
    assets_hash = (re.search(r"const ASSETS = '([^']+)'", sw) or [None, None])[1]
    if not m or not shell:
        print("  官網的檔案格式改了，這版離線程式讀不懂。" + ("先用上次下載的版本。" if have else ""))
        return have
    if have and old.get("shell") == shell:
        print("  已經是最新版本（%s）。" % old.get("name", shell))
        return True

    files = [p[0] for p in json.loads(m.group(1))] + ["assets/manifest.json", "talents.html"]
    print("  發現新版本，開始更新遊戲程式…" if have else "  第一次使用，開始下載遊戲程式（約 4 MB）…")
    new_dir = GAME + "_new"
    shutil.rmtree(new_dir, ignore_errors=True)
    down = reuse = 0
    try:
        for p in files:
            rel = p.replace("/", os.sep)
            dst = inside(new_dir, rel)
            if not dst:
                continue
            src = inside(GAME, rel)
            # build\ 的檔名帶內容雜湊：檔名一樣＝內容一樣，直接沿用舊版，不用重抓
            if p.startswith(("build/", "app-icons/")) and src and os.path.isfile(src):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copyfile(src, dst)
                reuse += 1
                continue
            try:
                data = fetch(ORIGIN + p)
            except (urllib.error.URLError, OSError) as e:
                if p == "talents.html":            # 天賦說明頁，少了也能玩
                    continue
                raise RuntimeError("%s 下載失敗：%s" % (p, e))
            write(dst, data)
            down += 1
            print("    [下載] %s（%d KB）" % (p, len(data) // 1024))
    except RuntimeError as e:
        shutil.rmtree(new_dir, ignore_errors=True)
        print("  " + str(e))
        print("  下載沒完成。" + ("先用上次下載的版本。" if have else "請稍後再試。"))
        return have

    main_name = next((p for p in files if re.match(r"build/main-[\w-]+\.js$", p)), "")
    name = shell
    try:
        with open(os.path.join(new_dir, main_name.replace("/", os.sep)), "r", encoding="utf-8") as f:
            v = re.search(r'\{commit:"([0-9a-f]+)",date:"([^"]+)"\}', f.read())
        if v:
            name = v.group(2)[:10] + " (" + v.group(1) + ")"
    except OSError:
        pass
    with open(os.path.join(new_dir, "version.json"), "w", encoding="utf-8") as f:
        json.dump({"shell": shell, "assets": assets_hash, "name": name}, f, ensure_ascii=False)

    # 換上新版
    shutil.rmtree(GAME + "_old", ignore_errors=True)
    if os.path.isdir(GAME):
        os.rename(GAME, GAME + "_old")
    os.rename(new_dir, GAME)
    shutil.rmtree(GAME + "_old", ignore_errors=True)
    print("  下載 %d 個、沿用舊版 %d 個。目前版本：%s" % (down, reuse, name))

    return True


# ----------------------------------------------------------------------------
# 預先下載圖片、音效（同時開多條連線，比瀏覽器一個一個要快很多；下載完就能完全離線玩）
# ----------------------------------------------------------------------------
def asset_list(manifest):
    out = set()

    def walk(o):
        if isinstance(o, dict):
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
        elif isinstance(o, str) and re.search(r"\.\w{2,5}$", o) and ".." not in o and not o.startswith(("http:", "https:", "/")):
            out.add(o)
    walk(manifest)
    return sorted(out)


def prefetch(refresh=False):
    """下載 manifest 列出的所有素材；圖集 .json 裡指到的圖片也一起抓。回傳失敗數。"""
    manifest = read_json(os.path.join(GAME, "assets", "manifest.json"))
    todo = ["assets/" + p for p in asset_list(manifest)]
    if not todo:
        return 0
    from concurrent.futures import ThreadPoolExecutor
    done, fail, seen = [0], [0], set(todo)
    extra = []

    def need(p):
        full = inside(CACHE, p.replace("/", os.sep))
        return full and (refresh or not os.path.isfile(full))

    def one(p):
        full = inside(CACHE, p.replace("/", os.sep))
        if not full:
            return
        data = None
        if need(p):
            try:
                data = fetch(ORIGIN + p)
                write(full, data)
            except (urllib.error.URLError, OSError):
                fail[0] += 1
        elif p.endswith(".json"):
            with open(full, "rb") as f:
                data = f.read()
        # 圖集 .json 的 meta.image 指到真正的圖片
        if data and p.endswith(".json"):
            try:
                img = (json.loads(data.decode("utf-8")).get("meta") or {}).get("image")
            except (ValueError, AttributeError):
                img = None
            if isinstance(img, str) and ".." not in img and not img.startswith(("http", "/")):
                q = p.rsplit("/", 1)[0] + "/" + img
                with lock:
                    if q not in seen:
                        seen.add(q)
                        extra.append(q)
        with lock:
            done[0] += 1
            if missing and done[0] % 200 == 0:
                print("    %d / %d" % (done[0], len(seen)))

    missing = sum(1 for p in todo if need(p))
    if missing:
        print("下載圖片、音效（%d 個，第一次約 50 MB，請稍等）…" % missing)
    with ThreadPoolExecutor(16) as ex:
        list(ex.map(one, todo))
    while extra:
        batch, extra[:] = list(extra), []
        with ThreadPoolExecutor(16) as ex:
            list(ex.map(one, batch))
    if missing or fail[0]:
        print("  完成。" + ("有 %d 個下載失敗，玩的時候會再試一次。" % fail[0] if fail[0] else ""))
    return fail[0]


# ----------------------------------------------------------------------------
# 本機伺服器
# ----------------------------------------------------------------------------
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):   # 不要每個檔案都印一行
        pass

    def _send(self, body, ctype, code=200):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_POST(self):
        # 存檔上傳、對局驗證等都要官方伺服器，離線版一律回「離線」
        n = int(self.headers.get("Content-Length") or 0)
        if n:
            self.rfile.read(n)
        self._send(b'{"error":"offline"}', "application/json", 503)

    do_PUT = do_DELETE = do_PATCH = do_POST

    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        path = urllib.parse.unquote(self.path.split("?")[0].split("#")[0])
        if path.startswith("/api/"):
            return self._send(b'{"error":"offline"}', "application/json", 503)
        if path == "/sw.js":
            return self._send(SW_STUB, "text/javascript")
        if path == "/status.json":
            return self._send(b'{"state":"ok"}', "application/json")
        if path in ("", "/"):
            path = "/index.html"
        rel = path.lstrip("/").replace("/", os.sep)
        if not rel or ".." in rel.split(os.sep):
            return self._send(b"not found", "text/plain", 404)
        ctype = TYPES.get(os.path.splitext(path)[1].lower(), "application/octet-stream")

        if GM and path == "/__gm.js":
            try:
                with open(GM_JS, "rb") as f:
                    return self._send(f.read(), "text/javascript; charset=utf-8")
            except OSError:
                return self._send(b"alert('\\u627e\\u4e0d\\u5230 gm.js')", "text/javascript")
        if GM and path == "/__gm_status.json":
            if not GM_STATUS:   # 還沒載過主程式：先修補一次看結果
                for f in os.listdir(os.path.join(GAME, "build")):
                    if re.match(r"main-[\w-]+\.js$", f):
                        with open(os.path.join(GAME, "build", f), "rb") as fh:
                            gm_patch(fh.read())
            return self._send(json.dumps(GM_STATUS).encode(), "application/json")

        for base in (GAME, CACHE):
            full = inside(base, rel)
            if full and os.path.isfile(full):
                with open(full, "rb") as f:
                    data = f.read()
                if GM and base == GAME:
                    if rel == "index.html":
                        tag = b'<script src="/__gm.js"></script>'
                        pos = data.rfind(b"</body>")
                        data = data[:pos] + tag + data[pos:] if pos >= 0 else data + tag
                    elif re.match(r"build[\\/]main-[\w-]+\.js$", rel):
                        data = gm_patch(data)
                return self._send(data, ctype)

        # 本機沒有：從官網下載一次存起來
        full = inside(CACHE, rel)
        if not full or not os.path.splitext(rel)[1]:
            return self._send(b"not found", "text/plain", 404)
        try:
            data = fetch(ORIGIN + path.lstrip("/"))
        except (urllib.error.URLError, OSError):
            return self._send(b"not found", "text/plain", 404)
        with lock:
            write(full, data)
        return self._send(data, ctype)


def serve(open_browser=True):
    server = None
    base_port = GM_PORT if GM else PORT
    for port in [base_port] + list(range(PORT + 2, PORT + 20)):
        try:
            server = http.server.ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if server is None:
        print("找不到可以用的埠號，請先關掉其他離線版視窗再試。")
        return
    port = server.server_address[1]
    url = "http://127.0.0.1:%d/" % port
    print("\n%s已啟動：%s" % ("GM 模式" if GM else "離線版", url))
    if port != base_port:
        print("（注意：%d 被占用了，這次改用 %d，所以看不到之前的存檔。關掉其他離線版視窗再開就會恢復。）" % (base_port, port))
    if GM:
        print("GM 模式的存檔和一般離線版分開，互相看不到。")
        print("在物品欄、卡片頁按「＋ 創造」，或按右下角紅色「GM」按鈕修改。")
    print("玩的時候這個視窗要開著；玩完直接關掉這個視窗就好。")
    if open_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


def main():
    ap = argparse.ArgumentParser(description="RO 倖存者離線版（非官方）")
    ap.add_argument("--no-update", action="store_true", help="不檢查更新，直接用已下載的版本")
    ap.add_argument("--update-only", action="store_true", help="只檢查更新、下載，不開遊戲")
    ap.add_argument("--no-browser", action="store_true", help="不要自動開瀏覽器")
    ap.add_argument("--refresh-assets", action="store_true", help="圖片音效全部重新下載（畫面怪怪的時候用）")
    ap.add_argument("--gm", action="store_true", help="GM 模式：可以創造道具、修改數值（存檔和一般模式分開）")
    args = ap.parse_args()
    global GM
    GM = args.gm
    print("RO 倖存者離線版（非官方）v" + TOOL_VERSION + ("　【GM 模式】" if GM else ""))
    print("提醒：離線版不能登入、不能雲端存檔，進度不會同步到官方帳號。\n")
    if args.no_update:
        ok = os.path.isfile(os.path.join(GAME, "index.html"))
        if not ok:
            print("還沒有下載過遊戲，請先不加 --no-update 執行一次。")
    else:
        before = read_json(VERSION_FILE).get("assets")
        ok = update()
        if ok and ONLINE:
            after = read_json(VERSION_FILE).get("assets")
            # 遊戲換了圖片音效（sw.js 的 ASSETS 雜湊變了）→ 全部重抓，避免新舊混用
            changed = bool(before and after and before != after)
            if changed:
                print("遊戲的圖片音效有更新，重新下載…")
            try:
                prefetch(refresh=changed or args.refresh_assets)
            except (urllib.error.URLError, OSError) as e:
                print("  圖片音效沒有全部下載完（%s），玩的時候會再補。" % e)
    if not ok:
        return 1
    if not args.update_only:
        serve(not args.no_browser)
    return 0


if __name__ == "__main__":
    sys.exit(main())
