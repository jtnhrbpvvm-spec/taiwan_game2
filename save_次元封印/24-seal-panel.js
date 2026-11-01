

// ════════════════════════════════════════════════
//  🌀 次元封印專屬系統：輪迴轉生、終局進度、變身圖鑑、卡片昇華、其他新欄位
//  欄位含義對照遊戲 afk-rebirth*.js、afk-arts.js、afk-finalboss.js、afk-finaltiers.js、afk-poly-codex.js、afk-card-ascension.js
// ════════════════════════════════════════════════
function _sealEsc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// 這些欄位在面板上有專門的欄位（或是修改器其他分頁在管），下面「其他欄位」不重複列
const _SEAL_KNOWN = new Set(['rebirth','rebirthArt','rebirthHpKeep','rebirthMpKeep','sherineWorld','sherineMad','sherineDream','hadesUnlocked',
  'afkFinal','afkFinal2','afkFinalTier','polyDex','cardAscension']);
// 遊戲狀態、衍生值：改了也會被遊戲蓋掉，不列出來以免誤會（需要時用 JSON 分頁）
const _SEAL_SKIP = /^(d|hots|cds|statuses|buffs|manualCd|config|siege|eq|inv|skills|grantedSkills|equipDex|cardDex|miscDex|relicDex|junkPrefs|base|panacea|alloc|allies)$/;

function renderSealPanel(){
  const box = document.getElementById('sealContent');
  if(!box) return;
  const p = G.p;
  const r = Number(p.rebirth) || 0;
  const arts = GAME_DATA.arts.filter(a => a.cls === p.cls);
  const fin  = p.afkFinal  && typeof p.afkFinal  === 'object' ? p.afkFinal  : {};
  const fin2 = p.afkFinal2 && typeof p.afkFinal2 === 'object' ? p.afkFinal2 : {};
  const tier = p.afkFinalTier && typeof p.afkFinalTier === 'object' ? p.afkFinalTier : {};
  const resOpts = cur => ['', 'win', 'lose'].map(v => `<option value="${v}" ${(cur || '') === v ? 'selected' : ''}>${{ '':'未挑戰', win:'勝利', lose:'失敗' }[v]}</option>`).join('');

  box.innerHTML = `
  <div class="adv-card">
    <div class="adv-card-title">♻️ 輪迴轉生</div>
    <div class="form-row">
      <span class="form-label">轉生次數</span>
      <select id="seal_rebirth" style="width:150px" onchange="onSealRebirth(this.value)">
        <option value="0" ${r === 0 ? 'selected' : ''}>未轉生（Lv100）</option>
        <option value="1" ${r === 1 ? 'selected' : ''}>一轉（Lv150）</option>
        <option value="2" ${r >= 2 ? 'selected' : ''}>二轉（Lv200）</option>
      </select>
      <span style="font-size:12px;color:var(--text3)">目前等級上限 ${lvCap()}、屬性上限 ${statCap()}</span>
    </div>
    <div class="form-row">
      <span class="form-label">轉生技藝</span>
      <select id="seal_art" style="width:220px" onchange="sealSet('rebirthArt', this.value || null); renderSealPanel()" ${r > 0 ? '' : 'disabled'}>
        <option value="">── 無 ──</option>
        ${arts.map(a => `<option value="${a.id}" ${p.rebirthArt === a.id ? 'selected' : ''}>${_sealEsc(a.n)}</option>`).join('')}
      </select>
    </div>
    <div style="font-size:12px;color:var(--text3);margin:0 0 10px 98px;line-height:1.6">${_sealEsc((arts.find(a => a.id === p.rebirthArt) || {}).d || (r > 0 ? '技藝會跟職業走，換職業後要重選。' : '轉生後才能修習。'))}</div>
    <div class="form-row">
      <span class="form-label">保留 HP／MP</span>
      <input type="number" id="seal_hpKeep" style="width:100px" min="0" value="${Number(p.rebirthHpKeep) || 0}" onchange="sealSet('rebirthHpKeep', Math.max(0, parseInt(this.value) || 0))">
      <input type="number" id="seal_mpKeep" style="width:100px" min="0" value="${Number(p.rebirthMpKeep) || 0}" onchange="sealSet('rebirthMpKeep', Math.max(0, parseInt(this.value) || 0))">
      <button class="btn btn-sm" onclick="sealEstimateKeep()">依等級差估算</button>
    </div>
    <div style="font-size:12px;color:var(--text3);margin-left:98px;line-height:1.6">轉生時遊戲會把 Lv100 跟 Lv1 的 HP／MP 差記在這裡加回去。遊戲進入時會依公式重算最大 HP／MP，等級再高也要靠這兩格才保得住。</div>
  </div>

  <div class="adv-card">
    <div class="adv-card-title">🏆 終局進度</div>
    <div class="form-row"><span class="form-label">冥王域結局</span>
      <select style="width:120px" onchange="sealRecord('afkFinal', this.value)">${resOpts(fin.result)}</select>
      <span class="form-label" style="width:80px">二轉結局</span>
      <select style="width:120px" onchange="sealRecord('afkFinal2', this.value)">${resOpts(fin2.result)}</select>
    </div>
    <div class="form-row"><span class="form-label">第二階挑戰</span>
      <select style="width:120px" onchange="sealTier('t2', this.value)">${resOpts(tier.t2)}</select>
      <span class="form-label" style="width:80px">第三階挑戰</span>
      <select style="width:120px" onchange="sealTier('t3', this.value)">${resOpts(tier.t3)}</select>
    </div>
    <div class="form-row" style="gap:16px">
      <label class="eq-flag"><input type="checkbox" ${p.sherineMad ? 'checked' : ''} onchange="sealSet('sherineMad', this.checked)"> 瘋狂席琳</label>
      <label class="eq-flag"><input type="checkbox" ${p.sherineDream ? 'checked' : ''} onchange="sealSet('sherineDream', this.checked)"> 席琳夢域</label>
      <label class="eq-flag"><input type="checkbox" ${p.hadesUnlocked ? 'checked' : ''} onchange="sealSet('hadesUnlocked', this.checked)"> 冥王域已解鎖</label>
    </div>
  </div>

  <div class="adv-card">
    <div class="adv-card-title">🎭 變身圖鑑（polyDex）<span id="seal_polyCount" style="font-weight:normal;font-size:12px;color:var(--text3);margin-left:8px"></span></div>
    <div class="form-row">
      <button class="btn btn-sm btn-accent" onclick="sealPolyAll(3)">全部設為第 3 階</button>
      <button class="btn btn-sm btn-danger" onclick="sealPolyAll(0)">全部清除</button>
      <input type="text" id="seal_polySearch" placeholder="搜尋變身…" style="width:160px" oninput="renderSealPoly()">
    </div>
    <div class="dex-grid dex-grid-wide" id="seal_polyGrid" style="max-height:320px;overflow-y:auto"></div>
  </div>

  <div class="adv-card">
    <div class="adv-card-title">🃏 卡片昇華（cardAscension）<span id="seal_ascCount" style="font-weight:normal;font-size:12px;color:var(--text3);margin-left:8px"></span></div>
    <div class="form-row">
      <button class="btn btn-sm btn-accent" onclick="sealAscAll(true)">全部取得</button>
      <button class="btn btn-sm btn-danger" onclick="sealAscAll(false)">全部清除</button>
    </div>
    <div id="seal_ascGrid"></div>
  </div>

  <div class="adv-card">
    <div class="adv-card-title">🧩 其他新欄位</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:8px;line-height:1.6">存檔裡有、但上面沒有專門欄位的資料（例如獵人公會、區域頭目、幽靈船的紀錄）。內容是 JSON，遊戲改版多了新欄位也會自動列在這裡。</div>
    <div id="seal_otherList"></div>
  </div>`;

  renderSealPoly();
  renderSealAsc();
  renderSealOther();
}

function sealSet(key, val){
  if(val === null || val === false || val === undefined) delete G.p[key];
  else G.p[key] = val;
}

function onSealRebirth(val){
  const r = parseInt(val) || 0, before = Number(G.p.rebirth) || 0;
  G.p.rebirth = r;
  // 從未轉生變成轉生：比照遊戲第一次轉生時的做法，把等級 HP／MP 差先填好
  if(before === 0 && r > 0 && !(G.p.rebirthHpKeep > 0) && !(G.p.rebirthMpKeep > 0)) _sealFillKeep();
  // 降回去時，超過新上限的等級要夾回來
  const cap = lvCap();
  if(getNum('f_lv', 1) > cap){ setVal('f_lv', cap); setVal('f_exp', 0); G.p.lv = cap; G.p.exp = 0; }
  if(r === 0){ delete G.p.rebirthArt; }
  renderStatsPanel();
  renderSealPanel();
  toast(`等級上限 ${cap}、屬性上限 ${statCap()}`, 'info');
}

function _sealFillKeep(){
  calibrateGrowth();
  const hi = computeHpMpForLevel(100), lo = computeHpMpForLevel(1);
  G.p.rebirthHpKeep = Math.max(0, hi.mhp - lo.mhp);
  G.p.rebirthMpKeep = Math.max(0, hi.mmp - lo.mmp);
}
function sealEstimateKeep(){
  _sealFillKeep();
  renderSealPanel();
  toast('已依目前職業與屬性估算（Lv100 與 Lv1 的差）', 'ok');
}

function sealRecord(key, val){
  if(!val){ delete G.p[key]; return; }
  const cur = (G.p[key] && typeof G.p[key] === 'object') ? G.p[key] : {};
  G.p[key] = Object.assign(cur, { result:val, pending:false });
}
function sealTier(key, val){
  const cur = (G.p.afkFinalTier && typeof G.p.afkFinalTier === 'object') ? G.p.afkFinalTier : { t2:null, t3:null, pending:null };
  cur[key] = val || null;
  cur.pending = null;
  G.p.afkFinalTier = cur;
}

// ── 變身圖鑑：鍵是變身名稱，值是階級 0~3
function renderSealPoly(){
  const grid = document.getElementById('seal_polyGrid');
  if(!grid) return;
  const dex = (G.p.polyDex && typeof G.p.polyDex === 'object') ? G.p.polyDex : {};
  const q = (document.getElementById('seal_polySearch')?.value || '').toLowerCase();
  const cnt = document.getElementById('seal_polyCount');
  if(cnt) cnt.textContent = `已取得 ${GAME_DATA.polyForms.filter(n => dex[n] > 0).length} / ${GAME_DATA.polyForms.length}`;
  grid.innerHTML = GAME_DATA.polyForms.filter(n => !q || n.toLowerCase().includes(q)).map((n, i) => `
    <div class="dex-item ${dex[n] > 0 ? 'owned' : ''}">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${_sealEsc(n)}">${_sealEsc(n)}</div>
      <select style="width:58px;font-size:12px" data-name="${_sealEsc(n)}" onchange="sealPolySet(this.dataset.name, this.value)">
        ${[0,1,2,3].map(v => `<option value="${v}" ${(dex[n] || 0) === v ? 'selected' : ''}>${v}</option>`).join('')}
      </select>
    </div>`).join('');
}
function sealPolySet(name, val){
  if(!G.p.polyDex || typeof G.p.polyDex !== 'object') G.p.polyDex = {};
  const v = parseInt(val) || 0;
  if(v > 0) G.p.polyDex[name] = v; else delete G.p.polyDex[name];
  renderSealPoly();
}
function sealPolyAll(v){
  if(!v && !confirm('確定清除全部變身圖鑑？')) return;
  G.p.polyDex = {};
  if(v) GAME_DATA.polyForms.forEach(n => { G.p.polyDex[n] = v; });
  renderSealPoly();
}

// ── 卡片昇華：owned 是已擁有的形態；取得時也要把該階打開（unlocked），不然遊戲不顯示
const _ASC_TIER_LABEL = { mythic:'神話', celestial:'天上', spacetime:'時空', samsara:'輪迴聖衣' };
function _sealAsc(){
  const s = (G.p.cardAscension && typeof G.p.cardAscension === 'object') ? G.p.cardAscension : (G.p.cardAscension = { v:1 });
  ['owned','failures','attempts','unlocked','sealed','bonus'].forEach(k => { if(!s[k] || typeof s[k] !== 'object') s[k] = {}; });
  return s;
}
function renderSealAsc(){
  const grid = document.getElementById('seal_ascGrid');
  if(!grid) return;
  const s = (G.p.cardAscension && G.p.cardAscension.owned) || {};
  let total = 0, have = 0;
  grid.innerHTML = Object.entries(GAME_DATA.ascension).map(([t, list]) => {
    total += list.length;
    have  += list.filter(r => s[r.id]).length;
    return `<div class="section-title">${_ASC_TIER_LABEL[t] || t}</div>
      <div class="dex-grid dex-grid-wide">${list.map(r => `
        <label class="dex-item ${s[r.id] ? 'owned' : ''}" style="cursor:pointer">
          <input type="checkbox" ${s[r.id] ? 'checked' : ''} onchange="sealAscSet('${t}','${r.id}',this.checked)">
          <span style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${_sealEsc(r.n)}">${_sealEsc(r.n)}</span>
        </label>`).join('')}</div>`;
  }).join('');
  const cnt = document.getElementById('seal_ascCount');
  if(cnt) cnt.textContent = `已取得 ${have} / ${total}`;
}
function sealAscSet(tier, id, on){
  const s = _sealAsc();
  if(on){ s.owned[id] = true; s.unlocked[tier] = true; delete s.sealed[id]; }
  else delete s.owned[id];
  renderSealAsc();
}
function sealAscAll(on){
  if(!on && !confirm('確定清除全部卡片昇華？')) return;
  const s = _sealAsc();
  Object.entries(GAME_DATA.ascension).forEach(([t, list]) => {
    if(on) s.unlocked[t] = true;
    list.forEach(r => { if(on){ s.owned[r.id] = true; delete s.sealed[r.id]; } else delete s.owned[r.id]; });
  });
  renderSealAsc();
}

// ── 其他欄位：預設角色沒有的 key 全部列出來，用 JSON 改
function renderSealOther(){
  const box = document.getElementById('seal_otherList');
  if(!box) return;
  const keys = Object.keys(G.p).filter(k => !_SEAL_KNOWN.has(k) && !_SEAL_SKIP.test(k) && G.p[k] !== null && typeof G.p[k] === 'object'
    && Object.keys(G.p[k]).length > 0).sort();
  box.innerHTML = keys.length ? keys.map(k => `
    <details style="margin-bottom:6px">
      <summary style="cursor:pointer;font-size:13px;color:var(--text2)">${_sealEsc(k)}</summary>
      <textarea style="width:100%;height:110px;font-family:monospace;font-size:12px;margin-top:4px" data-key="${_sealEsc(k)}" onchange="sealOtherSet(this)">${_sealEsc(JSON.stringify(G.p[k], null, 1))}</textarea>
    </details>`).join('') : '<div style="font-size:12px;color:var(--text3)">目前這個角色沒有其他新欄位。</div>';
}
function sealOtherSet(el){
  try{
    G.p[el.dataset.key] = JSON.parse(el.value);
    toast('已更新 ' + el.dataset.key, 'ok');
  }catch(e){
    toast('❌ JSON 格式錯誤，沒有套用：' + e.message, 'err', 4000);
  }
}

// 最後地圖下拉選單：地圖有 300 多張，直接用遊戲的分類產生
(function initMapSelect(){
  const fill = () => {
    const sel = document.getElementById('f_lastmap');
    if(!sel) return;
    sel.innerHTML = '<option value="">── 無 ──</option>' + GAME_DATA.maps.map(g =>
      `<optgroup label="${_sealEsc(g.label)}">${g.list.map(m => `<option value="${_sealEsc(m.v)}">${_sealEsc(m.t)}</option>`).join('')}</optgroup>`).join('');
  };
  fill();
})();
