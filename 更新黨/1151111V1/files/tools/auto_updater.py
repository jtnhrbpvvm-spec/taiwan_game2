#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
網頁奇岩城離線版：自動更新程式
================================
更新來源有兩個：

1. GitHub 上的修補檔（主要來源）
   https://github.com/jtnhrbpvvm-spec/taiwan_game2 的「更新黨」資料夾。
   每一次修補是一個資料夾，名稱＝民國日期＋V＋當天第幾版，例如 1151111V1、1151111V2、1151203V1。
       更新黨/index.json                 所有修補檔的清單
       更新黨/1151111V1/manifest.json    這一包有哪些檔案（路徑、大小、SHA-256）
       更新黨/1151111V1/files/...        檔案本身（照遊戲資料夾的相對路徑放）
   還沒套用過的修補檔會照順序全部套用；同一個檔案只下載最新那一版。

2. 原始網站 https://webl1.com/（官網）
   - 每次都會比對官網的版本（version.json），有新版會提示。
   - 圖檔、地圖、音樂：缺的本來就會在開始遊戲時背景下載、用到時即時補抓，這裡不重複做。
   - 加上 --origin-code 才會把官網的「程式」（html／css／js／data 資料表）同步下來：
     離線版改過的檔案（PROTECTED 清單＋ GitHub 修補檔裡出現過的檔案）不會被官網版本蓋掉；
     同步完會檢查各個 js 檔互相引用的名稱對不對得上，對不上就自動還原，不會把遊戲弄到開不起來。

安全措施：
  - 檔案全部下載完、SHA-256 驗證通過才開始替換；任何一個失敗就整批不動。
  - 被替換掉的舊檔案備份在 遊戲資料夾\\更新備份\\（留最近 5 次），--rollback 還原上一次。
  - 存檔（saves\\）永遠不會被動到。
  - 沒有網路、連不上：直接略過，不影響開始遊戲。

用法：
  雙擊「更新遊戲.bat」                     檢查並套用更新
  python tools/auto_updater.py --auto      開始遊戲時自動跑的（逾時短、不問問題）
  python tools/auto_updater.py --origin-code   連官網的程式也同步
  python tools/auto_updater.py --rollback  還原上一次更新
  python tools/auto_updater.py --source <資料夾或網址>   改用別的更新來源（測試用）
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UPDATER_VERSION = "1.0"
HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
STATE_FILE = os.path.join(HERE, "update_state.json")
CONFIG_FILE = os.path.join(HERE, "update_config.json")
TMP_DIR = os.path.join(HERE, "_update_tmp")
BACKUP_DIR = os.path.join(GAME, "更新備份")
KEEP_BACKUPS = 5

ORIGIN = "https://webl1.com/"
PATCH_DIR_NAME = "更新黨"
DEFAULT_SOURCES = [
    "https://raw.githubusercontent.com/jtnhrbpvvm-spec/taiwan_game2/main/" + urllib.parse.quote(PATCH_DIR_NAME) + "/",
    "https://jtnhrbpvvm-spec.github.io/taiwan_game2/" + urllib.parse.quote(PATCH_DIR_NAME) + "/",
]
UA = {"User-Agent": "WebL1-Offline-Updater/" + UPDATER_VERSION}

# 永遠不碰的路徑（開頭比對，用 / 分隔）
NEVER_TOUCH = ("saves/", "更新備份/", "tools/update_state.json", "tools/_update_tmp/")
# 離線版改過、或離線版自己的檔案：同步官網程式時不會被官網版本蓋掉（GitHub 修補檔出現過的檔案也會自動算進來）
PROTECTED = {
    "index.html", "guide.html", "privacy.html", "terms.html", "js/main.js", "js/protocol.js", "js/look.js", "js/link.js", "js/pack.js", "js/start.js", "js/npcmark.js",
    "js/hud.js", "js/offline-server.js", "js/offline-auto.js", "data/npcfn.json", "data/npctele.json", "data/bosses.json",
    "data/summons.json", "data/teleports.json", "gm.js", "webl1_offline.py", "sw.js",
}
ID_RE = re.compile(r"^(\d{6,8})V(\d+)$", re.I)


def say(msg=""):
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        print(msg.encode("ascii", "replace").decode("ascii"), flush=True)


def patch_key(pid):
    m = ID_RE.match(pid or "")
    return (int(m.group(1)), int(m.group(2))) if m else None


def safe_rel(rel):
    """修補檔裡的相對路徑 → 檢查過的 / 分隔路徑；不合法（跳出遊戲資料夾、絕對路徑、不准動的地方）回 None"""
    if not isinstance(rel, str):
        return None
    rel = rel.replace("\\", "/").strip()
    if not rel or rel.startswith("/") or ":" in rel or "\x00" in rel:
        return None
    parts = rel.split("/")
    if any(p in ("", ".", "..") for p in parts):
        return None
    low = rel.lower()
    if any(low == n.rstrip("/").lower() or low.startswith(n.lower()) for n in NEVER_TOUCH):
        return None
    return rel


def local_path(rel):
    return os.path.join(GAME, *rel.split("/"))


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_json(path, default):
    try:
        with open(path, encoding="utf-8-sig") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".part"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


class Source:
    """一個更新來源：網址（結尾 /）或本機資料夾"""

    def __init__(self, base, timeout):
        self.base = base
        self.timeout = timeout
        self.is_url = bool(re.match(r"^https?://", base, re.I))
        if self.is_url and not base.endswith("/"):
            self.base = base + "/"

    def read(self, rel):
        if self.is_url:
            url = self.base + urllib.parse.quote(rel, safe="/")
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                return r.read()
        with open(os.path.join(self.base, *rel.split("/")), "rb") as f:
            return f.read()


def http_get(url, timeout):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


# ── 備份／還原 ─────────────────────────────────────────────
class Backup:
    def __init__(self, label):
        self.dir = os.path.join(BACKUP_DIR, time.strftime("%Y%m%d_%H%M%S") + "_" + label)
        self.meta = {"label": label, "time": time.strftime("%Y-%m-%d %H:%M:%S"), "replaced": [], "created": [], "patches": []}

    def keep(self, rel):
        """rel 要被換掉／刪掉之前：有舊檔就搬一份進備份，沒有就記成「這次新增的」"""
        src = local_path(rel)
        if os.path.isfile(src):
            dst = os.path.join(self.dir, "files", *rel.split("/"))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            self.meta["replaced"].append(rel)
        else:
            self.meta["created"].append(rel)

    def commit(self):
        if not (self.meta["replaced"] or self.meta["created"]):
            return
        save_json(os.path.join(self.dir, "backup.json"), self.meta)
        try:
            olds = sorted(d for d in os.listdir(BACKUP_DIR) if os.path.isfile(os.path.join(BACKUP_DIR, d, "backup.json")))
            for d in olds[:-KEEP_BACKUPS]:
                shutil.rmtree(os.path.join(BACKUP_DIR, d), ignore_errors=True)
        except OSError:
            pass


def restore_backup(bdir, quiet=False):
    meta = load_json(os.path.join(bdir, "backup.json"), None)
    if not meta:
        return False
    for rel in meta.get("replaced", []):
        rel = safe_rel(rel)
        src = rel and os.path.join(bdir, "files", *rel.split("/"))
        if src and os.path.isfile(src):
            os.makedirs(os.path.dirname(local_path(rel)), exist_ok=True)
            shutil.copy2(src, local_path(rel))
    for rel in meta.get("created", []):
        rel = safe_rel(rel)
        if rel and os.path.isfile(local_path(rel)):
            try:
                os.remove(local_path(rel))
            except OSError:
                pass
    state = load_json(STATE_FILE, {})
    gone = set(meta.get("patches", []))
    if gone:
        state["applied"] = [p for p in state.get("applied", []) if p not in gone]
        state["version"] = state["applied"][-1] if state["applied"] else ""
    if meta.get("origin_code_before") is not None:
        state["origin_code"] = meta["origin_code_before"]
    save_json(STATE_FILE, state)
    if not quiet:
        say("已還原：%s（%d 個檔案換回舊版、%d 個新增的檔案移除）" % (meta.get("label", ""), len(meta.get("replaced", [])), len(meta.get("created", []))))
    return True


def rollback():
    try:
        dirs = sorted(d for d in os.listdir(BACKUP_DIR) if os.path.isfile(os.path.join(BACKUP_DIR, d, "backup.json")))
    except OSError:
        dirs = []
    if not dirs:
        say("沒有可以還原的更新備份。")
        return 1
    last = os.path.join(BACKUP_DIR, dirs[-1])
    if restore_backup(last):
        shutil.rmtree(last, ignore_errors=True)
        return 0
    return 1


# ── 1. GitHub 修補檔 ─────────────────────────────────────────
def find_source(sources, timeout):
    """照順序試，回 (來源, index.json 內容)；全部連不上回 (None, None)"""
    err = None
    for base in sources:
        src = Source(base, timeout)
        try:
            idx = json.loads(src.read("index.json").decode("utf-8-sig"))
            if isinstance(idx, dict) and isinstance(idx.get("patches"), list):
                return src, idx
            err = "index.json 格式不對"
        except urllib.error.HTTPError as e:
            err = "HTTP %d" % e.code
            if e.code == 404:
                continue
        except (OSError, ValueError) as e:
            err = str(e) or e.__class__.__name__
    return None, err


def update_from_patches(sources, timeout, state, auto):
    """回 (套用了幾個修補檔, 所有修補檔出現過的檔案路徑集合)"""
    src, idx = find_source(sources, timeout)
    if not src:
        say("  連不上更新伺服器（%s），這次先略過。" % (idx or "沒有網路"))
        return 0, set()
    patches = []
    for p in idx["patches"]:
        pid = p.get("id") if isinstance(p, dict) else p
        if patch_key(pid):
            patches.append(pid)
    patches.sort(key=patch_key)
    applied = set(state.get("applied", []))
    pending = [p for p in patches if p not in applied]

    # 每個修補檔的 manifest（已經套過的也要看：算「這個檔案最新是哪一包」跟「哪些檔案是離線版自己的」）
    manifests, touched = {}, set()
    for pid in patches:
        try:
            m = json.loads(src.read(pid + "/manifest.json").decode("utf-8-sig"))
        except (OSError, ValueError) as e:
            if pid in pending:
                say("  讀不到修補檔 %s 的清單（%s），這次先略過。" % (pid, e))
                return 0, touched
            continue
        manifests[pid] = m
        for f in m.get("files", []):
            rel = safe_rel(f.get("path"))
            if rel:
                touched.add(rel)
    if not pending:
        say("  已經是最新版（%s）。" % (patches[-1] if patches else "還沒有任何修補檔"))
        return 0, touched

    # 同一個檔案只要最新那一版；最新那一版在已經套過的修補檔裡＝這個檔案已經是新的，不動
    winner, deletes = {}, {}
    for pid in patches:
        m = manifests.get(pid)
        if not m:
            continue
        for f in m.get("files", []):
            rel = safe_rel(f.get("path"))
            if not rel:
                say("  略過不合法的路徑：%r（%s）" % (f.get("path"), pid))
                continue
            winner[rel] = (pid, f)
            deletes.pop(rel, None)
        for rel in m.get("delete", []):
            rel = safe_rel(rel)
            if rel:
                deletes[rel] = pid
                winner.pop(rel, None)
    todo = []
    for rel, (pid, f) in sorted(winner.items()):
        if pid not in pending:
            continue
        dst = local_path(rel)
        try:
            if os.path.isfile(dst) and os.path.getsize(dst) == f.get("size") and sha256_file(dst) == f.get("sha256"):
                continue
        except OSError:
            pass
        todo.append((rel, pid, f))
    to_delete = [rel for rel, pid in sorted(deletes.items()) if pid in pending and os.path.isfile(local_path(rel))]

    say("  有 %d 個新的修補檔：%s" % (len(pending), "、".join(pending)))
    for pid in pending:
        for line in manifests[pid].get("notes", []) or []:
            say("    [%s] %s" % (pid, line))

    # 先全部下載到暫存區、驗證
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    total = sum(int(f.get("size") or 0) for _, _, f in todo)
    if todo:
        say("  下載 %d 個檔案（%.1f KB）…" % (len(todo), total / 1024.0))
    staged = []
    try:
        for rel, pid, f in todo:
            data = src.read(pid + "/files/" + rel)
            if len(data) != f.get("size") or hashlib.sha256(data).hexdigest() != f.get("sha256"):
                raise ValueError("檔案驗證失敗：%s（%s）" % (rel, pid))
            tmp = os.path.join(TMP_DIR, *rel.split("/"))
            os.makedirs(os.path.dirname(tmp), exist_ok=True)
            with open(tmp, "wb") as fh:
                fh.write(data)
            staged.append((rel, tmp))
    except (OSError, ValueError) as e:
        shutil.rmtree(TMP_DIR, ignore_errors=True)
        say("  下載失敗（%s）。沒有任何檔案被改動，下次再試。" % e)
        return 0, touched

    # 全部到齊才替換；中途出錯就把已經換掉的還原
    bk = Backup(pending[-1])
    bk.meta["patches"] = list(pending)
    try:
        for rel, tmp in staged:
            bk.keep(rel)
            os.makedirs(os.path.dirname(local_path(rel)), exist_ok=True)
            os.replace(tmp, local_path(rel))
        for rel in to_delete:
            bk.keep(rel)
            os.remove(local_path(rel))
    except OSError as e:
        bk.commit()
        say("  替換檔案時出錯（%s）——請先關掉遊戲再更新。正在還原…" % e)
        if os.path.isdir(bk.dir):
            restore_backup(bk.dir, quiet=True)
            shutil.rmtree(bk.dir, ignore_errors=True)
        shutil.rmtree(TMP_DIR, ignore_errors=True)
        return 0, touched
    bk.commit()
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    state["applied"] = sorted(applied | set(pending), key=patch_key)
    state["version"] = state["applied"][-1]
    save_json(STATE_FILE, state)
    say("  更新完成：%d 個檔案更新、%d 個移除，目前版本 %s。" % (len(staged), len(to_delete), state["version"]))
    return len(pending), touched


# ── 2. 官網 ───────────────────────────────────────────────
def origin_version(timeout):
    try:
        return json.loads(http_get(ORIGIN + "version.json?t=%d" % int(time.time()), timeout).decode("utf-8-sig"))
    except (OSError, ValueError):
        return None


IMPORT_RE = re.compile(r"""(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"](\.{1,2}/[^'"?]+\.js)(?:\?[^'"]*)?['"]|import\(\s*['"](\.{1,2}/[^'"?]+\.js)(?:\?[^'"]*)?['"]\s*\)""")
NAMED_IMPORT_RE = re.compile(r"""import\s*(?:[\w$]+\s*,\s*)?\{([^}]*)\}\s*from\s*['"](\.{1,2}/[^'"?]+\.js)(?:\?[^'"]*)?['"]""")
EXPORT_DECL_RE = re.compile(r"""export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([\w$]+)""")
EXPORT_LIST_RE = re.compile(r"""export\s*\{([^}]*)\}""")


def js_exports(text):
    names = set(EXPORT_DECL_RE.findall(text))
    for grp in EXPORT_LIST_RE.findall(text):
        for part in grp.split(","):
            part = part.strip()
            if part:
                names.add(part.split(" as ")[-1].strip())
    # export const A = 1, B = 2;
    for m in re.finditer(r"export\s+(?:const|let|var)\s+", text):
        seg, depth, cur = text[m.end():m.end() + 4000], 0, ""
        for chx in seg:
            if chx in "([{":
                depth += 1
            elif chx in ")]}":
                depth -= 1
            elif chx == ";" and depth <= 0:
                break
            if chx == "," and depth == 0:
                nm = re.match(r"\s*([\w$]+)\s*=", cur)
                if nm:
                    names.add(nm.group(1))
                cur = ""
            else:
                cur += chx
        nm = re.match(r"\s*([\w$]+)\s*=", cur)
        if nm:
            names.add(nm.group(1))
    if re.search(r"export\s+default\b", text):
        names.add("default")
    return names


def verify_modules():
    """js\\ 底下每個檔案用 import { 名稱 } 引用別的檔案時，那個名稱對方有沒有 export。對不上＝整個遊戲載不起來。回問題清單"""
    js_dir = os.path.join(GAME, "js")
    texts, problems = {}, []
    for name in os.listdir(js_dir):
        if name.endswith(".js"):
            try:
                with open(os.path.join(js_dir, name), encoding="utf-8") as f:
                    texts[name] = f.read()
            except (OSError, UnicodeDecodeError):
                pass
    exports = {n: js_exports(t) for n, t in texts.items()}
    for name, text in texts.items():
        for grp, target in NAMED_IMPORT_RE.findall(text):
            tname = os.path.normpath(os.path.join("js", target)).replace("\\", "/")
            if not tname.startswith("js/") or "/" in tname[3:]:
                continue
            tname = tname[3:]
            if tname not in texts:
                problems.append("%s 引用了不存在的 %s" % (name, tname))
                continue
            if re.search(r"export\s*\*\s*from", texts[tname]):
                continue
            for part in grp.split(","):
                nm = part.strip().split(" as ")[0].strip()
                if nm and nm not in exports[tname]:
                    problems.append("%s 要用 %s 的「%s」，但那個檔案沒有" % (name, tname, nm))
    return problems


def origin_code_files():
    """本機現有、來自官網的程式檔清單（相對路徑）"""
    out = []
    for name in sorted(os.listdir(GAME)):
        if os.path.isfile(os.path.join(GAME, name)) and name.lower().endswith((".html", ".css")):
            out.append(name)
    for name in ("changelog.json", "manifest.json", "rates.json", "sw-push.js"):
        if os.path.isfile(os.path.join(GAME, name)):
            out.append(name)
    for sub, exts in (("js", (".js",)), ("data", (".json",))):
        d = os.path.join(GAME, sub)
        if os.path.isdir(d):
            for name in sorted(os.listdir(d)):
                if os.path.isfile(os.path.join(d, name)) and name.lower().endswith(exts):
                    out.append(sub + "/" + name)
    return out


def looks_like_code(rel, data):
    head = data[:200].lstrip().lower()
    if rel.endswith(".html"):
        return head.startswith((b"<!doctype", b"<html"))
    if head.startswith((b"<!doctype", b"<html")):
        return False          # 官網把不存在的檔案回成網頁
    if rel.endswith(".json"):
        try:
            json.loads(data.decode("utf-8-sig"))
        except ValueError:
            return False
    return bool(data)


def sync_origin_code(timeout, state, protected, remote_ver):
    say("  同步官網程式（離線版改過的 %d 個檔案不會被蓋掉）…" % len(protected))
    queue, seen, staged, skipped = origin_code_files(), set(), [], 0
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    while queue:
        rel = queue.pop(0)
        if rel in seen or not safe_rel(rel):
            continue
        seen.add(rel)
        if rel in protected or rel.rsplit("/", 1)[-1].startswith("offline-"):
            skipped += 1
            continue
        try:
            data = http_get(ORIGIN + urllib.parse.quote(rel, safe="/"), timeout)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue          # 官網已經沒有這個檔：留著本機的
            say("  下載失敗（%s：HTTP %d）。沒有任何檔案被改動。" % (rel, e.code))
            shutil.rmtree(TMP_DIR, ignore_errors=True)
            return False
        except OSError as e:
            say("  下載失敗（%s：%s）。沒有任何檔案被改動。" % (rel, e))
            shutil.rmtree(TMP_DIR, ignore_errors=True)
            return False
        if not looks_like_code(rel, data):
            continue
        if rel.endswith(".js"):   # 新版可能多了新的 js 檔：跟著引用關係找
            try:
                for a, b in IMPORT_RE.findall(data.decode("utf-8")):
                    nxt = os.path.normpath(os.path.join(os.path.dirname(rel), a or b)).replace("\\", "/")
                    if nxt not in seen and not nxt.startswith(".."):
                        queue.append(nxt)
            except UnicodeDecodeError:
                pass
        dst = local_path(rel)
        try:
            with open(dst, "rb") as f:
                if f.read() == data:
                    continue
        except OSError:
            pass
        tmp = os.path.join(TMP_DIR, *rel.split("/"))
        os.makedirs(os.path.dirname(tmp), exist_ok=True)
        with open(tmp, "wb") as fh:
            fh.write(data)
        staged.append((rel, tmp))
    if not staged:
        say("  官網的程式跟本機一樣，不用同步。")
        state["origin_code"] = (remote_ver or {}).get("code", state.get("origin_code"))
        save_json(STATE_FILE, state)
        return True
    bk = Backup("官網程式")
    bk.meta["origin_code_before"] = state.get("origin_code", "")
    try:
        for rel, tmp in staged:
            bk.keep(rel)
            os.makedirs(os.path.dirname(local_path(rel)), exist_ok=True)
            os.replace(tmp, local_path(rel))
    except OSError as e:
        bk.commit()
        say("  替換檔案時出錯（%s）——請先關掉遊戲再更新。正在還原…" % e)
        restore_backup(bk.dir, quiet=True)
        shutil.rmtree(bk.dir, ignore_errors=True)
        return False
    bk.commit()
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    problems = verify_modules()
    if problems:
        say("  官網新版的程式跟離線版改過的檔案對不上（照這樣遊戲會開不起來），已自動還原：")
        for p in problems[:8]:
            say("    - " + p)
        say("  請等 GitHub 上的修補檔跟上官網新版之後再更新。")
        restore_backup(bk.dir, quiet=True)
        shutil.rmtree(bk.dir, ignore_errors=True)
        return False
    state["origin_code"] = (remote_ver or {}).get("code", "")
    save_json(STATE_FILE, state)
    say("  官網程式同步完成：更新了 %d 個檔案（保留離線版的 %d 個）。有問題可以執行 更新遊戲.bat 選「還原上一次更新」。" % (len(staged), skipped))
    return True


def check_origin(timeout, state, protected, do_code, auto):
    remote = origin_version(timeout)
    local = load_json(os.path.join(GAME, "version.json"), {})
    if not remote:
        say("  連不上官網（webl1.com），略過。")
        return
    known = state.get("origin_code") or local.get("code")
    newer = bool(remote.get("code")) and remote.get("code") != known
    if newer and auto and not do_code:
        # 開始遊戲時：同一個官網版本只提醒一次，不要每次開遊戲都講
        if state.get("origin_seen") == remote.get("code"):
            return
        state["origin_seen"] = remote.get("code")
    if newer:
        say("  官網有新版程式（%s）。本機是 %s 那一版。" % (remote.get("buildAt", "?"), local.get("buildAt", "?")))
    else:
        say("  官網程式沒有變動（%s）。" % remote.get("buildAt", "?"))
    if do_code:
        sync_origin_code(timeout, state, protected, remote)
    elif newer and not auto:
        say("  要連官網的程式一起同步：更新遊戲.bat 選 2（離線版改過的檔案會保留；對不上會自動還原）。")
    elif newer:
        say("  （圖檔、地圖照舊用到時自動補抓；要同步程式請執行 更新遊戲.bat）")


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description="網頁奇岩城離線版：自動更新程式")
    ap.add_argument("--auto", action="store_true", help="開始遊戲時自動執行：逾時短、不問問題")
    ap.add_argument("--origin-code", action="store_true", help="連官網的程式（html/css/js/data）也同步")
    ap.add_argument("--no-origin", action="store_true", help="不檢查官網")
    ap.add_argument("--rollback", action="store_true", help="還原上一次更新")
    ap.add_argument("--menu", action="store_true", help="先問要做哪一種（更新遊戲.bat 用）")
    ap.add_argument("--source", action="append", help="改用這個更新來源（資料夾或網址，可以給多個）")
    args = ap.parse_args()

    if not os.path.isfile(os.path.join(GAME, "webl1_offline.py")):
        say("找不到 webl1_offline.py：auto_updater.py 要放在 遊戲資料夾\\tools\\ 底下。")
        return 1
    if args.menu:
        say("網頁奇岩城離線版：更新遊戲")
        say("  1. 檢查並套用更新（GitHub 修補檔；直接按 Enter 就是這個）")
        say("  2. 同上，再把官網（webl1.com）的新版程式也同步下來")
        say("  3. 還原上一次更新")
        try:
            pick = input("請輸入 1～3：").strip()
        except EOFError:
            pick = ""
        say()
        if pick == "3":
            args.rollback = True
        elif pick == "2":
            args.origin_code = True
    if args.rollback:
        return rollback()

    cfg = load_json(CONFIG_FILE, {})
    if cfg.get("auto_update") is False and args.auto:
        return 0
    sources = args.source or cfg.get("sources") or DEFAULT_SOURCES
    timeout = 6 if args.auto else 20
    state = load_json(STATE_FILE, {})
    if not isinstance(state.get("applied"), list):
        state["applied"] = []

    say("【檢查更新】目前版本：%s" % (state.get("version") or "原始版"))
    say("  1. GitHub 修補檔")
    n, touched = update_from_patches(sources, timeout, state, args.auto)
    if not args.no_origin:
        say("  2. 官網（webl1.com）")
        check_origin(timeout, state, PROTECTED | touched, args.origin_code, args.auto)
    state["last_check"] = time.strftime("%Y-%m-%d %H:%M:%S")
    try:
        save_json(STATE_FILE, state)
    except OSError:
        pass
    if n and not args.auto:
        say("\n更新好了。遊戲如果開著，請關掉黑色視窗重新開始遊戲；瀏覽器畫面沒變就按 Ctrl + F5。")
    return 0


if __name__ == "__main__":
    try:
        code = main()
    except KeyboardInterrupt:
        code = 1
    except Exception as e:   # 更新程式自己出錯也不能擋住開始遊戲
        say("更新程式發生錯誤（%s: %s），這次先略過。" % (e.__class__.__name__, e))
        code = 0
    sys.exit(code)
