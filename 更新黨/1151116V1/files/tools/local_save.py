"""Large local saves: transactional SQLite, individually compressed 1 MiB chunks.

No browser quota and no single large SQLite BLOB. Original JSON saves are kept
after migration. This module never connects to the network.
"""
import hashlib
import json
import os
import sqlite3
import time
import zlib
from contextlib import closing

CHUNK_SIZE = 1024 * 1024


class LocalSave:
    def __init__(self, directory, gm=False):
        self.directory = directory
        self.base = "characters_gm" if gm else "characters"
        self.path = os.path.join(directory, self.base + ".sqlite3")
        self.legacy = os.path.join(directory, self.base + ".json")

    @staticmethod
    def validate(raw):
        state = json.loads(raw.decode("utf-8-sig"))
        if not isinstance(state, dict) or not isinstance(state.get("chars"), list):
            raise ValueError("Invalid save: chars must be an array")
        return state

    def connect(self):
        os.makedirs(self.directory, exist_ok=True)
        db = sqlite3.connect(self.path, timeout=30)
        db.execute("PRAGMA synchronous=FULL")
        db.execute("CREATE TABLE IF NOT EXISTS metadata (id INTEGER PRIMARY KEY CHECK(id=1), saved_at INTEGER, chars INTEGER, raw_size INTEGER, sha256 TEXT)")
        db.execute("CREATE TABLE IF NOT EXISTS chunks (seq INTEGER PRIMARY KEY, data BLOB NOT NULL)")
        return db

    def backup(self, db, old, clearing=False):
        if not old or old[1] == 0:
            return
        folder = os.path.join(self.directory, "backup")
        os.makedirs(folder, exist_ok=True)
        day = time.strftime("%Y%m%d")
        name = self.base + "_" + day + ".sqlite3"
        if clearing:
            name = self.base + "_清空前_" + time.strftime("%Y%m%d_%H%M%S") + "_" + str(time.time_ns()) + ".sqlite3"
        target = os.path.join(folder, name)
        if not os.path.exists(target):
            temp = target + ".part"
            with closing(sqlite3.connect(temp)) as copy:
                db.backup(copy)
            os.replace(temp, target)
        daily = sorted(n for n in os.listdir(folder)
                       if n.startswith(self.base + "_2") and n.endswith(".sqlite3"))
        for name in daily[:-7]:
            os.remove(os.path.join(folder, name))

    def write(self, raw, force=False):
        state = self.validate(raw)
        stamp = state.get("savedAt", 0)
        if not isinstance(stamp, (int, float)) or stamp < 0:
            raise ValueError("Invalid savedAt")
        stamp = int(stamp)
        digest = hashlib.sha256(raw).hexdigest()
        with closing(self.connect()) as db, db:
            old = db.execute("SELECT saved_at, chars, sha256 FROM metadata WHERE id=1").fetchone()
            if old and not force and old[0] > stamp:
                return False  # delayed HTTP request must not overwrite a newer save
            if old and old[2] == digest:
                return True
            self.backup(db, old, clearing=bool(old and not state["chars"]))
            db.execute("BEGIN IMMEDIATE")
            latest = db.execute("SELECT saved_at FROM metadata WHERE id=1").fetchone()
            if latest and not force and latest[0] > stamp:
                return False
            db.execute("DELETE FROM chunks")
            db.executemany("INSERT INTO chunks(seq,data) VALUES (?,?)",
                           ((i // CHUNK_SIZE, zlib.compress(raw[i:i + CHUNK_SIZE], 3))
                            for i in range(0, len(raw), CHUNK_SIZE)))
            db.execute("INSERT OR REPLACE INTO metadata VALUES (1,?,?,?,?)",
                       (stamp, len(state["chars"]), len(raw), digest))
        return True

    def read_database(self):
        if not os.path.isfile(self.path):
            return None
        with closing(self.connect()) as db:
            db.execute("BEGIN")  # metadata and chunks must come from one snapshot
            meta = db.execute("SELECT raw_size,sha256 FROM metadata WHERE id=1").fetchone()
            if not meta:
                return None
            raw = b"".join(zlib.decompress(row[0]) for row in db.execute("SELECT data FROM chunks ORDER BY seq"))
            if len(raw) != meta[0] or hashlib.sha256(raw).hexdigest() != meta[1]:
                raise ValueError("Save checksum failed; restore a backup before playing")
            self.validate(raw)
            return raw

    def read(self):
        raw = self.read_database()
        if os.path.isfile(self.legacy):
            with open(self.legacy, "rb") as f:
                legacy = f.read()
            old = self.validate(legacy)
            current = self.validate(raw) if raw else None
            # The existing reset BAT writes a reset marker. Honor it even if a
            # database exists, and then archive it so it cannot reset every launch.
            if raw is None or old.get("reset") or old.get("savedAt", 0) > current.get("savedAt", 0):
                self.write(legacy, force=True)
                raw = legacy
            archive = self.legacy + ".migrated"
            if os.path.exists(archive):
                archive += "." + str(time.time_ns())
            os.replace(self.legacy, archive)
        return raw or b'{"account":"offline","chars":[],"warehouse":[],"nextItemId":500001}'
