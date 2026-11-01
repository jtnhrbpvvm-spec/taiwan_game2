#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
更新遊戲資料.py —— 從「放置天堂 - 次元封印」本體產生修改器用的資料表（00-game-data.js、21-item-db.js）。

遊戲改版後的流程：
    1. 先跑新天堂爬蟲（新天堂爬蟲.bat），把最新版爬下來
    2. 再跑這支：python 更新遊戲資料.py

資料不是用文字硬抓，是把離線版開起來、建一個暫時的角色，讓遊戲自己把所有外掛跑完後再讀，
這樣外掛後來才登錄的物品、地圖都會算進去。瀏覽器全程靜音、不開視窗，測試角色不會留下。
需要 playwright（pip install playwright）。爬蟲不在預設位置的話，設環境變數 NL_CRAWLER 指到 nl_crawler.py。
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
CRAWLER = os.environ.get("NL_CRAWLER") or r"C:\Users\a2095\Desktop\爬蟲\新天堂爬蟲\nl_crawler.py"
PORT = 8390

# 在遊戲裡執行：回傳修改器需要的所有資料表
DUMP_JS = r"""async () => {
  const out = { version: GAME_VERSION };
  // 物品：ttmi* 是外掛內部用的來源標記，修改器用不到
  out.items = {};
  for (const [id, d] of Object.entries(DB.items)) {
    const c = {};
    for (const k in d) if (!k.startsWith('ttmi') && !k.startsWith('_')) c[k] = d[k];
    out.items[id] = c;
  }
  // 地圖：先照遊戲的分類，分類裡沒有的（副本、隱藏地圖）放到其他
  const seen = {}, CAT = { village:'村莊', wild:'野外', dungeon:'地監', special:'特殊', tower:'傲慢之塔', rift:'時空裂痕', pirate_island:'海賊島' };
  out.maps = Object.entries(MAP_CATEGORIES).map(([k, list]) => ({ label: CAT[k] || k, list: list.map(m => { seen[m.v] = 1; return { v: m.v, t: m.t }; }) }));
  out.maps.push({ label: '其他（副本、隱藏地圖）', list: Object.entries(DB.maps).filter(([k]) => !seen[k]).map(([k, m]) => ({ v: k, t: (m && (m.n || m.name)) || k })) });
  // 卡片收集對象
  const mobLv = {}; Object.values(DB.mobs).forEach(m => { if (m && m.n && !(m.n in mobLv)) mobLv[m.n] = m.lv || 0; });
  out.cards = Object.keys(CARD_MOB_INFO).map(n => ({ n, lv: mobLv[n] || 0 })).sort((a, b) => a.lv - b.lv);
  // 圖鑑分類：直接用遊戲自己的判斷結果
  out.equipCategories = EQUIP_CATEGORIES;
  out.miscCategories = MISC_CATEGORIES;
  out.equipCat = {}; out.miscCat = {}; out.weaponTags = {};
  for (const [id, d] of Object.entries(DB.items)) {
    const e = equipCatKey(id, d); if (e) out.equipCat[id] = e;
    const m = miscCatKey(id, d); if (m) out.miscCat[id] = m;
    if (d.type === 'wpn') { const t = getWeaponTags(id); if (t && t.length) out.weaponTags[id] = t; }
  }
  // 寵物
  out.pets = Object.entries(PET_BOOK).map(([n, v]) => ({ n, tier: (v && v.tier) || 0 }));
  out.petStorageMax = PET_STORAGE_MAX; out.petExpReqV = PET_EXP_REQ_VERSION;
  // 經驗表（每一級要多少經驗才升下一級；轉生後到 199）
  out.expReq = [0]; for (let lv = 1; lv < 200; lv++) { const r = getExpReq(lv); out.expReq.push(isFinite(r) ? r : null); }
  // 轉生技藝：寫在 IIFE 裡的區域變數，只能從原始碼取
  const artsSrc = await (await fetch('afk-arts.js')).text();
  const st = artsSrc.indexOf('var ARTS = {') + 'var ARTS = '.length; let dep = 0, i = st, q = '';
  for (; i < artsSrc.length; i++) { const c = artsSrc[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
    if (c === "'" || c === '"' || c === '`') { q = c; continue; }
    if (c === '{') dep++; else if (c === '}' && --dep === 0) break; }
  const ARTS = (0, eval)('(' + artsSrc.slice(st, i + 1) + ')');
  out.arts = Object.entries(ARTS).map(([id, a]) => ({ id, cls: a.cls, n: a.n, d: a.d }));
  // 符文：孔裡放的是物品 id
  const RD = window.__afkRuneData;
  out.runeSlotCats = RD.SLOT_CATS;
  out.runes = Object.values(RD.byId).map(r => ({ id: r.id, n: (DB.items[r.id] || {}).n || r.id, stage: r.stage, cat: r.cat, star: r.star || 0 }));
  // 詞綴
  const AP = window.__afkAffixPlus;
  out.will = Object.entries(AP.WILL).map(([k, v]) => ({ k, n: v.n, d: v.d }));
  out.dragons = Object.entries(AP.DRAGON).map(([k, v]) => ({ k, n: v.n, dn: v.dn }));
  // 變身圖鑑、卡片昇華
  out.polyForms = window.AFK_POLY_CODEX.forms.map(f => f.n);
  const cat = window.AFK_CARD_ASCENSION.catalog; out.ascension = {};
  Object.keys(cat).forEach(t => { out.ascension[t] = (cat[t] || []).map(r => ({ id: r.id, n: r.name || r.n || r.id })); });
  // 掉落來源：物品 id → 怪物名稱
  out.drops = {};
  for (const [name, list] of Object.entries(MOB_DROPS)) {
    (Array.isArray(list) ? list : []).forEach(e => {
      const id = Array.isArray(e) ? e[0] : (e && (e.id || e.item));
      if (id) { const a = out.drops[id] || (out.drops[id] = []); if (!a.includes(name)) a.push(name); }
    });
  }
  out.mobSample = Object.keys(Object.values(DB.mobs)[5] || {});
  out.skills = Object.fromEntries(Object.entries(DB.skills).map(([k, v]) => [k, v && (v.n || v.name)]));
  return out;
}"""


def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    env = dict(os.environ, OFFLINE_NO_BROWSER="1")
    srv = subprocess.Popen([sys.executable, CRAWLER, "--serve", "--no-browser"], env=env,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        url = f"http://127.0.0.1:{PORT}/"
        for _ in range(30):
            try:
                urllib.request.urlopen(url, timeout=2).read(100)
                break
            except OSError:
                time.sleep(0.5)
        else:
            print("離線版開不起來，請先跑一次新天堂爬蟲。")
            return 1
        with sync_playwright() as p:
            b = p.chromium.launch(args=["--mute-audio"])
            page = b.new_page()
            page.on("dialog", lambda d: d.accept())
            page.goto(url, wait_until="load", timeout=120000)
            page.wait_for_timeout(1500)
            page.evaluate("openLoadSelect()"); page.wait_for_timeout(200)
            page.evaluate("loadCreateSelected()"); page.wait_for_timeout(200)
            page.evaluate("selectClass('knight')"); page.wait_for_timeout(200)
            page.evaluate("document.getElementById('btn-start').disabled=false; startGame()")
            page.wait_for_timeout(4000)
            data = page.evaluate(DUMP_JS)
            b.close()
    finally:
        srv.terminate()

    items = data.pop("items")
    sample = data.pop("mobSample")
    head = ("// 自動產生，不要手改：遊戲改版後跑「更新遊戲資料.py」。\n"
            f"// 來源：放置天堂 - 次元封印 {data['version']}\n")
    with open(os.path.join(HERE, "00-game-data.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write(head + "const GAME_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
    body = ",\n".join(f"{json.dumps(k, ensure_ascii=False)}:{json.dumps(v, ensure_ascii=False, separators=(',', ':'))}" for k, v in items.items())
    tail = """
// type 中文對照（供 UI 顯示用）
const ITEM_TYPE_LABEL = {
  wpn:"武器", arm:"防具", acc:"飾品", pot:"藥水", scroll:"卷軸", skillbk:"技能書",
  etc:"材料", misc:"雜項", use:"消耗品", book:"技能書", quest:"任務道具", mat:"素材",
};

// 快速查詢輔助（初始化時建立 name→id 反查表）
const ITEM_NAME_MAP = Object.fromEntries(
  Object.entries(ITEM_DB).map(([id,v])=>[v.n, id])
);

function findItemByName(name){
  return ITEM_NAME_MAP[name] || null;
}
"""
    with open(os.path.join(HERE, "21-item-db.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write(head + "const ITEM_DB = {\n" + body + "\n};\n" + tail)
    print(f"完成：{data['version']}　物品 {len(items):,}　卡片 {len(data['cards'])}　地圖 {sum(len(g['list']) for g in data['maps'])}"
          f"　寵物 {len(data['pets'])}　技藝 {len(data['arts'])}　符文 {len(data['runes'])}　變身 {len(data['polyForms'])}"
          f"　昇華 {sum(len(v) for v in data['ascension'].values())}　掉落對照 {len(data['drops'])}")
    if not data["drops"]:
        print("注意：掉落對照是空的，怪物資料的欄位：", sample)
    return 0


if __name__ == "__main__":
    sys.exit(main())
