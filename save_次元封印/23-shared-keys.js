

// ════════════════════════════════════════════════
//  🧩 加掛版共用資料
//  完整存檔的角色存檔位「只有」{v,p,ms,ticks}；倉庫、寵物、龍之鑽石、圖鑑是同模式角色共用的獨立 key。
//  秋玥版沒有接這段：匯入完整存檔時那幾個分頁顯示的是舊資料，改了也不會寫回。
//  這裡在切換角色時把共用 key 讀進編輯器，寫回時只動真的有改的 key（沒改的原封不動，連壓縮內容都不重算）。
//
//  各 key 的格式（對照遊戲 js/12、js/22、js/24）：
//    lineage_idle_warehouse[_classic]        LZ1 或明文 JSON {items,gold}；_rm 是領出墓碑（uid → 1）
//    fb5_pet_roster[_classic]                LZ1 或明文，內容要有 SIG1 簽章，遊戲驗不過就拒讀；_rm 是放生墓碑
//    fb5_pandora_relic_market_v1             JSON，diamonds 是全角色共用的龍之鑽石；其他欄位不能動
//    lineage_idle_{card,equip,misc,relic}dex[_classic]  JSON；遊戲載入時跟角色自己的紀錄合併
// ════════════════════════════════════════════════
const _JJ_DEX_KEYS = { cardDex:'lineage_idle_carddex', equipDex:'lineage_idle_equipdex', miscDex:'lineage_idle_miscdex', relicDex:'lineage_idle_relicdex' };
const _JJ_MARKET_KEY = 'fb5_pandora_relic_market_v1';
let _jjSharedSnap = null;   // 載入當下的內容，用來判斷有沒有改；suffix 也記在這裡（切模式不會把資料搬到另一個桶）

function _jjSuffix(p){ return (p && p.classicMode) ? '_classic' : ''; }

// 讀共用 key：回傳 {ok, value, signed}。key 不存在 → ok:true、value:null；存在但解不開 → ok:false（這個 key 之後不寫回）
function _jjReadShared(key){
  const raw = _jjBackup.keys[key];
  if(raw == null) return { ok:true, value:null, signed:false };
  try{
    const s = _jjDecodeSlotRaw(raw);
    if(s == null) return { ok:false };
    return { ok:true, value:_jjParseSlotSilent(s), signed:String(s).slice(0, 5) === 'SIG1:' };
  }catch(e){ return { ok:false }; }
}

function _jjLoadShared(p){
  const suffix = _jjSuffix(p);
  const snap = { suffix, bad:[], dexBase:{} };

  // 倉庫：墓碑裡的 uid 遊戲不會顯示，這裡也不顯示
  const whKey = 'lineage_idle_warehouse' + suffix;
  const wh = _jjReadShared(whKey);
  if(wh.ok){
    const tombs = _jjReadShared(whKey + '_rm');
    const dead = (tombs.ok && tombs.value && typeof tombs.value === 'object') ? tombs.value : {};
    const w = wh.value || {};
    G.wh = { gold:Number(w.gold) || 0, items:(w.items || []).filter(it => !(it && it.uid != null && dead[it.uid])) };
  } else {
    G.wh = { gold:0, items:[] };
    snap.bad.push('倉庫');
  }
  snap.wh = JSON.stringify(G.wh);

  // 寵物
  const pets = _jjReadShared('fb5_pet_roster' + suffix);
  if(pets.ok){
    G.pets = Array.isArray(pets.value) ? pets.value : [];
  } else {
    G.pets = [];
    snap.bad.push('寵物');
  }
  snap.pets = JSON.stringify(G.pets);

  // 龍之鑽石
  const market = _jjReadShared(_JJ_MARKET_KEY);
  if(market.ok){
    G.diamonds = Number(market.value && market.value.diamonds) || 0;
    snap.marketSigned = market.signed;
  } else {
    snap.bad.push('龍之鑽石');
  }
  snap.diamonds = G.diamonds;

  // 圖鑑：照遊戲的規則合併（卡片取高分、其他布林聯集），畫面才看得到共用的部分
  Object.entries(_JJ_DEX_KEYS).forEach(([field, base]) => {
    const r = _jjReadShared(base + suffix);
    if(!r.ok){ snap.bad.push('圖鑑'); return; }
    const shared = (r.value && typeof r.value === 'object') ? r.value : {};
    const merged = Object.assign({}, p[field] || {});
    Object.keys(shared).forEach(k => {
      if(k === '_v') return;
      if(field === 'cardDex'){ if((Number(shared[k]) || 0) > (Number(merged[k]) || 0)) merged[k] = shared[k]; }
      else if(shared[k]) merged[k] = true;
    });
    p[field] = merged;
    snap.dexBase[field] = JSON.stringify(merged);
  });

  _jjSharedSnap = snap;
  if(snap.bad.length){
    toast('⚠️ 這些共用資料解不開，不會寫回：' + [...new Set(snap.bad)].join('、'), 'warn', 5000);
  }
}

function _jjSaveShared(){
  const snap = _jjSharedSnap;
  if(!snap || !_jjBackup) return;
  const keys = _jjBackup.keys, suffix = snap.suffix, bad = snap.bad;

  const whNow = JSON.stringify(G.wh);
  if(whNow !== snap.wh && !bad.includes('倉庫')){
    const key = 'lineage_idle_warehouse' + suffix;
    keys[key] = _jjEncodeSlotRaw(JSON.stringify({ items:G.wh.items || [], gold:Number(G.wh.gold) || 0 }));
    keys[key + '_rm'] = _jjEncodeSlotRaw('{}');   // 清掉墓碑，比照遊戲還原倉庫的做法，不然 uid 相同的物品會被藏起來
    snap.wh = whNow;
  }

  const petsNow = JSON.stringify(G.pets);
  if(petsNow !== snap.pets && !bad.includes('寵物')){
    const key = 'fb5_pet_roster' + suffix;
    keys[key] = _jjEncodeSlotRaw(buildSIG1(petsNow));
    keys[key + '_rm'] = _jjEncodeSlotRaw(buildSIG1('{}'));
    snap.pets = petsNow;
  }

  if(G.diamonds !== snap.diamonds && !bad.includes('龍之鑽石')){
    const r = _jjReadShared(_JJ_MARKET_KEY);
    const st = Object.assign({}, (r.ok && r.value) || {});
    st.diamonds = Math.max(0, Math.floor(Number(G.diamonds) || 0));
    const text = JSON.stringify(st);
    keys[_JJ_MARKET_KEY] = _jjEncodeSlotRaw(snap.marketSigned ? buildSIG1(text) : text);
    snap.diamonds = G.diamonds;
  }

  if(!bad.includes('圖鑑')){
    Object.entries(_JJ_DEX_KEYS).forEach(([field, base]) => {
      const now = JSON.stringify(G.p[field] || {});
      if(now === snap.dexBase[field]) return;
      const out = Object.assign({}, G.p[field] || {});
      if(field === 'cardDex') out._v = 2;   // 遊戲的積分制版本標記，少了會被當成舊資料轉換
      keys[base + suffix] = _jjEncodeSlotRaw(JSON.stringify(out));
      snap.dexBase[field] = now;
    });
  }
}
