// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════
// 第四段：同伴面板、圖鑑面板、設定面板邏輯。
// ═════════════════════════════════════════════════
// ═════════════════════════════════════════════════


// ════════════════════════════════════════════════
//  同伴面板
// ════════════════════════════════════════════════

// 同伴預設模板
function newPartnerTemplate(){
  return {
    cls:'mage', name:'同伴', lv:1, exp:0,
    hp:100, mhp:100, mp:50, mmp:50,
    gold:0, avatar:'女法師',
    base:{str:25,dex:25,con:25,int:25,wis:25,cha:25},
    panacea:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
    alloc:{str:0,dex:0,con:0,int:0,wis:0,cha:0},
    panaceaUsed:0,
    skills:[], grantedSkills:[],
    mastery:null, masteryQuest:null, masteryChangeCnt:0, buffs:{},
    inv:[], junkPrefs:{},
    eq:{
      wpn:null,helm:null,armor:null,shield:null,
      cloak:null,tshirt:null,gloves:null,boots:null,
      ring1:null,ring2:null,ring3:null,ring4:null,
      amulet:null,ear1:null,ear2:null,belt:null,
      arrow:null,pet:null,doll:null,
    },
    config:{
      setPot:'potion_heal', setHpPot:70, setAutoBuyPot:false,
      selAtkSkill:'', setMpAtk:50,
      selHealSkill:'', setMpHeal:50,
      selConvertSkill:'', setHpConvert:50,
      setHaste:false, setBrave:false, setBlue:false,
      setCautious:false, setElfcookie:false,
      setPoly:false, setMagicbarrier:false,
      setTeleport:false, autoBuffSkills:{},
    },
    traditionalMode:false, sherineWorld:false,
    lastBattleMap:'', trialStage:0, flameAffinity:0,
  };
}

// 目前展開的同伴 tab（per card）
const _partnerTab = {};

function addPartner(){
  if(!G.p.allies) G.p.allies = [];
  G.p.allies.push(newPartnerTemplate());
  renderPartnerList();
  toast('已新增同伴', 'ok');
}

function removePartner(idx){
  if(!confirm(`確定刪除同伴 ${idx+1}？`)) return;
  G.p.allies.splice(idx, 1);
  renderPartnerList();
  toast('已刪除同伴', 'info');
}

function clearPartners(){
  if(!confirm('確定清空全部同伴？')) return;
  G.p.allies = [];
  renderPartnerList();
  toast('已清空同伴', 'info');
}

function pCopyFrom(idx, fromIdxStr){
  const fromIdx = parseInt(fromIdxStr);
  if(fromIdxStr === '' || isNaN(fromIdx) || !G.p.allies || !G.p.allies[fromIdx] || !G.p.allies[idx]) {
    toast('請先在下拉選單選擇要複製的同伴', 'warn');
    return;
  }
  if(fromIdx === idx){
    toast('不能複製自己', 'warn');
    return;
  }
  G.p.allies[idx] = JSON.parse(JSON.stringify(G.p.allies[fromIdx]));
  _partnerTab[idx] = 'basic';
  renderPartnerList();
  toast(`已複製 #${fromIdx+1} 的資料到 #${idx+1}`, 'ok');
}

function switchPartnerTab(idx, tab, el){
  _partnerTab[idx] = tab;
  const card = document.getElementById(`pcard_${idx}`);
  if(!card) return;
  card.querySelectorAll('.partner-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  card.querySelectorAll('.partner-section').forEach(s => s.classList.remove('active'));
  const sec = card.querySelector(`#psec_${idx}_${tab}`);
  if(sec) sec.classList.add('active');
}

// ── 同伴列表渲染
function renderPartnerList(){
  const container = document.getElementById('partnerList');
  if(!container) return;
  const list = G.p.allies || [];

  if(!list.length){
    container.innerHTML = `
      <div style="color:var(--text3);padding:24px;text-align:center;
                  border:1px dashed var(--border);border-radius:8px">
        尚無同伴，點擊「新增同伴」開始
      </div>`;
    return;
  }

  container.innerHTML = list.map((p, i) => {
    const tab = _partnerTab[i] || 'basic';
    return `
    <div class="partner-card" id="pcard_${i}">
      <div class="partner-card-header">
        <span class="partner-badge">#${i+1}</span>
        <span style="font-weight:bold;color:var(--partner)">${p.name||'未命名'}</span>
        <span style="color:var(--text3);font-size:12px">
          ${_clsLabel(p.cls)} Lv.${p.lv}
        </span>
        <button class="btn btn-danger btn-sm" style="margin-left:auto"
                onclick="savePartnerToG(${i});removePartner(${i})">🗑 刪除</button>
      </div>

      <div class="form-row" style="margin:4px 0 8px">
        <span class="form-label" style="width:20px">自</span>
        <select id="pp_${i}_copyFrom" style="width:160px">
          <option value="">── 選擇同伴 ──</option>
          ${list.map((op, j) => j===i ? '' :
            `<option value="${j}">#${j+1} ${_clsLabel(op.cls)} Lv.${op.lv||1}</option>`
          ).join('')}
        </select>
        <button class="btn btn-sm"
                onclick="pCopyFrom(${i}, document.getElementById('pp_${i}_copyFrom').value)">複製</button>
      </div>

      <div class="partner-tabs">
        <div class="partner-tab ${tab==='basic'?'active':''}"
             onclick="savePartnerToG(${i});switchPartnerTab(${i},'basic',this)">基本</div>
        <div class="partner-tab ${tab==='stats'?'active':''}"
             onclick="savePartnerToG(${i});switchPartnerTab(${i},'stats',this)">屬性</div>
        <div class="partner-tab ${tab==='eq'?'active':''}"
             onclick="savePartnerToG(${i});switchPartnerTab(${i},'eq',this)">裝備</div>
        <div class="partner-tab ${tab==='skills'?'active':''}"
             onclick="savePartnerToG(${i});switchPartnerTab(${i},'skills',this)">技能</div>
        <div class="partner-tab ${tab==='inv'?'active':''}"
             onclick="savePartnerToG(${i});switchPartnerTab(${i},'inv',this)">背包</div>
        <div class="partner-tab ${tab==='config'?'active':''}"
             onclick="savePartnerToG(${i});switchPartnerTab(${i},'config',this)">設定</div>
      </div>

      <!-- 基本 -->
      <div class="partner-section ${tab==='basic'?'active':''}" id="psec_${i}_basic">
        ${renderPartnerBasic(p, i)}
      </div>
      <!-- 屬性 -->
      <div class="partner-section ${tab==='stats'?'active':''}" id="psec_${i}_stats">
        ${renderPartnerStats(p, i)}
      </div>
      <!-- 裝備 -->
      <div class="partner-section ${tab==='eq'?'active':''}" id="psec_${i}_eq">
        ${renderPartnerEq(p, i)}
      </div>
      <!-- 技能 -->
      <div class="partner-section ${tab==='skills'?'active':''}" id="psec_${i}_skills">
        ${renderPartnerSkills(p, i)}
      </div>
      <!-- 背包 -->
      <div class="partner-section ${tab==='inv'?'active':''}" id="psec_${i}_inv">
        ${renderPartnerInv(p, i)}
      </div>
      <!-- 設定 -->
      <div class="partner-section ${tab==='config'?'active':''}" id="psec_${i}_config">
        ${renderPartnerConfig(p, i)}
      </div>
    </div>`;
  }).join('');
}

function _clsLabel(cls){
  const m = {mage:'法師',knight:'騎士',elf:'妖精',dark:'黑暗妖精',
             royal:'王族',dragon:'龍騎士',illusion:'幻術師',warrior:'戰士'};
  return m[cls] || cls;
}

// 把物品的 req 欄位（逗號分隔的職業代碼，或 'all'）轉成中文顯示，例如 'knight,elf' → '騎士、妖精'
function reqLabel(req){
  if(!req) return '';
  if(req === 'all') return '全職業';
  return String(req).split(',').map(c => _clsLabel(c.trim())).join('、');
}

// ── 同伴基本資料 HTML
function renderPartnerBasic(p, i){
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div class="form-row">
      <span class="form-label">名稱</span>
      <input type="text" id="pp_${i}_name" value="${p.name||''}" style="width:120px"
             onchange="pFieldChange(${i},'name',this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">職業</span>
      <select id="pp_${i}_cls" style="width:110px"
              onchange="pFieldChange(${i},'cls',this.value)">
        <option value="mage"     ${p.cls==='mage'    ?'selected':''}>法師</option>
        <option value="knight"   ${p.cls==='knight'  ?'selected':''}>騎士</option>
        <option value="elf"      ${p.cls==='elf'     ?'selected':''}>妖精</option>
        <option value="dark"     ${p.cls==='dark'    ?'selected':''}>黑暗妖精</option>
        <option value="royal"    ${p.cls==='royal'   ?'selected':''}>王族</option>
        <option value="dragon"   ${p.cls==='dragon'  ?'selected':''}>龍騎士</option>
        <option value="illusion" ${p.cls==='illusion'?'selected':''}>幻術師</option>
        <option value="warrior"  ${p.cls==='warrior' ?'selected':''}>戰士</option>
      </select>
    </div>
    <div class="form-row">
      <span class="form-label">等級</span>
      <input type="number" id="pp_${i}_lv" value="${p.lv||1}"
             min="1" max="9999" style="width:80px"
             onchange="pFieldChange(${i},'lv',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">經驗值</span>
      <input type="number" id="pp_${i}_exp" value="${p.exp||0}"
             min="0" style="width:100px"
             onchange="pFieldChange(${i},'exp',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">HP</span>
      <input type="number" id="pp_${i}_hp" value="${p.hp||0}" style="width:80px"
             onchange="pFieldChange(${i},'hp',+this.value)">
      <span style="color:var(--text3);font-size:12px">/</span>
      <input type="number" id="pp_${i}_mhp" value="${p.mhp||0}" style="width:80px"
             onchange="pFieldChange(${i},'mhp',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">MP</span>
      <input type="number" id="pp_${i}_mp" value="${p.mp||0}" style="width:80px"
             onchange="pFieldChange(${i},'mp',+this.value)">
      <span style="color:var(--text3);font-size:12px">/</span>
      <input type="number" id="pp_${i}_mmp" value="${p.mmp||0}" style="width:80px"
             onchange="pFieldChange(${i},'mmp',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">金幣</span>
      <input type="number" id="pp_${i}_gold" value="${p.gold||0}" style="width:130px"
             onchange="pFieldChange(${i},'gold',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">精通</span>
      <select id="pp_${i}_mastery" style="width:160px"
              onchange="pFieldChange(${i},'mastery',this.value||null)">
        <option value="" ${!p.mastery?'selected':''}>── 無 ──</option>
        <optgroup label="騎士">
          <option value="k_counter"  ${p.mastery==='k_counter' ?'selected':''}>反擊精通</option>
          <option value="k_cleave"   ${p.mastery==='k_cleave'  ?'selected':''}>切割精通</option>
          <option value="k_pierce"   ${p.mastery==='k_pierce'  ?'selected':''}>穿透精通</option>
          <option value="k_survive"  ${p.mastery==='k_survive' ?'selected':''}>生存精通</option>
        </optgroup>
        <optgroup label="法師">
          <option value="m_resonance" ${p.mastery==='m_resonance'?'selected':''}>共鳴精通</option>
          <option value="m_strike"    ${p.mastery==='m_strike'   ?'selected':''}>魔擊精通</option>
          <option value="m_echo"      ${p.mastery==='m_echo'     ?'selected':''}>迴響精通</option>
          <option value="m_summon"    ${p.mastery==='m_summon'   ?'selected':''}>召喚精通</option>
        </optgroup>
        <optgroup label="妖精">
          <option value="e_rapid"  ${p.mastery==='e_rapid' ?'selected':''}>連射精通</option>
          <option value="e_spirit" ${p.mastery==='e_spirit'?'selected':''}>精靈精通</option>
          <option value="e_sword"  ${p.mastery==='e_sword' ?'selected':''}>劍術精通</option>
          <option value="e_magic"  ${p.mastery==='e_magic' ?'selected':''}>魔導精通</option>
        </optgroup>
        <optgroup label="黑暗妖精">
          <option value="d_poison" ${p.mastery==='d_poison'?'selected':''}>劇毒精通</option>
          <option value="d_bleed"  ${p.mastery==='d_bleed' ?'selected':''}>出血精通</option>
          <option value="d_crit"   ${p.mastery==='d_crit'  ?'selected':''}>爆擊精通</option>
          <option value="d_evade"  ${p.mastery==='d_evade' ?'selected':''}>迴避精通</option>
        </optgroup>
        <optgroup label="幻術士">
          <option value="i_qigu"       ${p.mastery==='i_qigu'      ?'selected':''}>奇古獸精通</option>
          <option value="i_magicsword" ${p.mastery==='i_magicsword'?'selected':''}>魔劍精通</option>
          <option value="i_illusion"   ${p.mastery==='i_illusion'  ?'selected':''}>幻術精通</option>
          <option value="i_mana"       ${p.mastery==='i_mana'      ?'selected':''}>魔力精通</option>
        </optgroup>
        <optgroup label="龍騎士">
          <option value="k_awaken"      ${p.mastery==='k_awaken'     ?'selected':''}>覺醒精通</option>
          <option value="k_chainblade"  ${p.mastery==='k_chainblade' ?'selected':''}>鎖刃精通</option>
          <option value="k_weakness"    ${p.mastery==='k_weakness'   ?'selected':''}>弱點精通</option>
          <option value="k_dragonblood" ${p.mastery==='k_dragonblood'?'selected':''}>龍血精通</option>
        </optgroup>
        <optgroup label="戰士">
          <option value="k_giantaxe" ${p.mastery==='k_giantaxe'?'selected':''}>巨斧精通</option>
          <option value="k_dualaxe"  ${p.mastery==='k_dualaxe' ?'selected':''}>雙斧精通</option>
          <option value="k_rebound"  ${p.mastery==='k_rebound' ?'selected':''}>反彈精通</option>
          <option value="k_tough"    ${p.mastery==='k_tough'   ?'selected':''}>堅韌精通</option>
        </optgroup>
        <optgroup label="王族">
          <option value="k_royal_pet"    ${p.mastery==='k_royal_pet'   ?'selected':''}>夥伴精通</option>
          <option value="k_royal_pledge" ${p.mastery==='k_royal_pledge'?'selected':''}>血盟精通</option>
          <option value="k_royal_sword"  ${p.mastery==='k_royal_sword' ?'selected':''}>劍術精通</option>
          <option value="k_royal_magic"  ${p.mastery==='k_royal_magic' ?'selected':''}>魔法精通</option>
        </optgroup>
      </select>
    </div>
  </div>
  <div class="form-row" style="margin-top:8px">
    <button class="btn btn-sm btn-accent"
            onclick="pMaxAll(${i})">🚀 最大化</button>
    <button class="btn btn-sm"
            onclick="pFullRestore(${i})">💊 補滿HP/MP</button>
  </div>`;
}

// ── 同伴屬性 HTML
function renderPartnerStats(p, i){
  const tiers = [
    {key:'base',   label:'基礎屬性', max:100},
    {key:'panacea',label:'仙丹屬性', max:100},
    {key:'alloc',  label:'分配屬性', max:100},
  ];
  return tiers.map(t => `
    <div class="section-title">${t.label}
      <button class="btn btn-sm" style="margin-left:8px"
              onclick="pMaxStats(${i},'${t.key}',${t.max})">全部 ${t.max}</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:8px">
      ${STAT_KEYS.map(k=>`
        <div class="stat-cell">
          <label>${STAT_LABELS[k]}</label>
          <input type="number" id="pp_${i}_${t.key}_${k}"
                 value="${(p[t.key]||{})[k]||0}" min="0" max="99999"
                 onchange="pStatChange(${i},'${t.key}','${k}',+this.value)">
        </div>`).join('')}
    </div>`).join('');
}

// ── 同伴裝備 HTML（精簡版，只顯示 ID + 強化 + 遠古 + 祝福）
function renderPartnerEq(p, i){
  return `
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
    ${EQ_SLOTS.map(sl => {
      if(sl.hidden) return '';
      if(sl.spacer) return `<div id="pp_${i}_remSetSummary" class="rem-set-summary">${remSetSummaryHTML(p.eq)}</div>`;
      const d  = (p.eq && p.eq[sl.id]) || {};

      if(sl.isRemains){
        return `
        <div class="eq-slot eq-slot-rem">
          <div class="eq-slot-title">${sl.label}</div>
          <div style="font-size:10px;color:var(--text3);margin-bottom:4px">ID: ${sl.id}（固定）</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <label style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:3px;cursor:pointer">
              <input type="checkbox" id="pp_${i}_eq_${sl.id}_equipped"
                     onchange="pRemFieldChange(${i},'${sl.id}')" ${d.id?'checked':''}> 已裝備
            </label>
            <label style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:3px;cursor:pointer">
              <input type="checkbox" id="pp_${i}_eq_${sl.id}_lock"
                     onchange="pRemFieldChange(${i},'${sl.id}')" ${d.lock?'checked':''}> 鎖定
            </label>
            <select style="font-size:11px;background:var(--bg2);border:1px solid var(--border);
                           color:var(--text);border-radius:3px;padding:2px 3px"
                    id="pp_${i}_eq_${sl.id}_seteff"
                    onchange="pRemFieldChange(${i},'${sl.id}')">
              <option value="" ${!d.seteff?'selected':''}>無</option>
              ${REM_SET_NAMES.map(n=>`<option value="${n}" ${d.seteff===n?'selected':''}>${n}</option>`).join('')}
            </select>
          </div>
        </div>`;
      }

      const db = (d.id && ITEM_DB[d.id]) || {};
      return `
      <div class="eq-slot">
        <div class="eq-slot-title">${sl.label}</div>
        <div style="font-size:11px;min-height:16px;margin-bottom:4px;color:var(--text2)">
          ${db.n ? `<span class="${db.legend?'c-legend':''}">${d.en>0?'+'+d.en+' ':''}${db.n}</span>` : '<span style="color:var(--text3)">空</span>'}
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center">
          <input type="text" placeholder="物品 ID"
                 value="${d.id||''}" style="width:120px;font-size:12px"
                 id="pp_${i}_eq_${sl.id}_id"
                 onchange="pEqChange(${i},'${sl.id}')">
          <input type="number" placeholder="+強化"
                 value="${d.en||0}" min="0" max="99" style="width:44px;font-size:12px"
                 id="pp_${i}_eq_${sl.id}_en"
                 onchange="pEqChange(${i},'${sl.id}')">
          <select style="font-size:11px;background:var(--bg2);border:1px solid var(--border);
                         color:var(--text);border-radius:3px;padding:2px 3px;width:58px"
                  id="pp_${i}_eq_${sl.id}_anc"
                  onchange="pEqChange(${i},'${sl.id}')">
            <option value="">無</option>
            ${ANC_OPTIONS.map(o=>`<option value="${String(o.v)}" ${String(d.anc)===String(o.v)?'selected':''}>${o.n}</option>`).join('')}
          </select>
          <select style="font-size:11px;background:var(--bg2);border:1px solid var(--border);
                         color:var(--text);border-radius:3px;padding:2px 3px;width:58px"
                  id="pp_${i}_eq_${sl.id}_bless"
                  onchange="pEqChange(${i},'${sl.id}')">
            <option value="">無</option>
            ${BLESS_OPTIONS.map(o=>`<option value="${String(o.v)}" ${String(d.bless)===String(o.v)?'selected':''}>${o.n}</option>`).join('')}
          </select>
          <input type="text" placeholder="屬性詞綴"
                 value="${d.attr||''}" style="width:52px;font-size:11px"
                 id="pp_${i}_eq_${sl.id}_attr"
                 title="如 fr5 / wa2（4屬性x5階，見裝備面板下拉選單）"
                 onchange="pEqChange(${i},'${sl.id}')">
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// ── 同伴遺骸欄位變更即時同步
function pRemFieldChange(idx, slotId){
  if(!G.p.allies[idx]) return;
  if(!G.p.allies[idx].eq) G.p.allies[idx].eq = {};
  const equipped = !!document.getElementById(`pp_${idx}_eq_${slotId}_equipped`)?.checked;
  if(!equipped){
    G.p.allies[idx].eq[slotId] = null;
    _refreshPRemSummary(idx);
    return;
  }
  const orig   = G.p.allies[idx].eq[slotId] || {};
  const seteff = document.getElementById(`pp_${idx}_eq_${slotId}_seteff`)?.value || '';
  const lock   = !!document.getElementById(`pp_${idx}_eq_${slotId}_lock`)?.checked;
  G.p.allies[idx].eq[slotId] = Object.assign({}, orig, {
    id: slotId,
    uid: orig.uid || genUID(),
    cnt: 1,
    en: 0,
    bless: false,
    anc: false,
    attr: false,
    seteff: seteff || false,
    lock,
    junk: false,
    _ruleJunk: false,
  });
  _refreshPRemSummary(idx);
}
function _refreshPRemSummary(idx){
  const el = document.getElementById(`pp_${idx}_remSetSummary`);
  if(el) el.innerHTML = remSetSummaryHTML(G.p.allies[idx] && G.p.allies[idx].eq);
}

// ── 同伴技能 HTML
function renderPartnerSkills(p, i){
  const learned = new Set(p.skills || []);
  const allSkills = [...new Map(
    [...SKILL_MAGE,...SKILL_KNIGHT,...SKILL_ELF,...SKILL_DARK,
     ...SKILL_ROYAL,...SKILL_DRAGON,...SKILL_ILLUSION,...SKILL_WARRIOR]
    .map(s=>[s.id,s])
  ).values()];

  return `
  <div class="form-row">
    <button class="btn btn-sm btn-accent" onclick="pSkillAll(${i})">全選</button>
    <button class="btn btn-sm btn-danger" onclick="pSkillClear(${i})">全清</button>
    <span style="font-size:12px;color:var(--text3)">已學：${learned.size} 個</span>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:5px;max-height:320px;overflow-y:auto">
    ${allSkills.map(s=>`
      <div class="skill-card ${learned.has(s.id)?'selected':''}"
           style="min-width:130px"
           onclick="pToggleSkill(${i},this,'${s.id}')">
        <input type="checkbox" ${learned.has(s.id)?'checked':''}
               onclick="event.stopPropagation();pToggleSkill(${i},this.closest('.skill-card'),'${s.id}')">
        <div>
          <div class="skill-card-name">${s.n}</div>
          <div class="skill-card-id">${s.id}</div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ── 同伴背包 HTML（精簡版）
function renderPartnerInv(p, i){
  const inv = p.inv || [];
  return `
  <div class="form-row">
    <div style="position:relative">
      <input type="text" placeholder="搜尋物品…" style="width:180px;font-size:12px"
             oninput="onItemSearch(this,'pInvDD_${i}','pInvSel_${i}')">
      <div id="pInvDD_${i}" class="item-dropdown" style="display:none"></div>
    </div>
    <input type="hidden" id="pInvSel_${i}">
    <input type="number" id="pInvCnt_${i}" value="1" min="1" style="width:55px;font-size:12px">
    <button class="btn btn-accent btn-sm" onclick="pAddItem(${i})">新增</button>
    <button class="btn btn-danger btn-sm" onclick="pClearInv(${i})">清空</button>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="color:var(--text3);border-bottom:1px solid var(--border)">
      <th style="text-align:left;padding:3px 6px">名稱</th>
      <th style="padding:3px 6px">數量</th>
      <th style="padding:3px 6px">強化</th>
      <th style="padding:3px 6px">操作</th>
    </tr></thead>
    <tbody>
      ${inv.map((it,j)=>`
        <tr>
          <td style="padding:3px 6px">${getItemName(it.id)}</td>
          <td><input type="number" value="${it.cnt||1}" min="1" style="width:55px;font-size:12px"
                     onchange="pItemField(${i},${j},'cnt',+this.value)"></td>
          <td><input type="number" value="${it.en||0}" min="0" max="99" style="width:44px;font-size:12px"
                     onchange="pItemField(${i},${j},'en',+this.value)"></td>
          <td><button class="btn btn-danger btn-sm"
                      onclick="pDelItem(${i},${j})">刪除</button></td>
        </tr>`).join('')}
    </tbody>
  </table>`;
}

// ── 同伴設定 HTML
function renderPartnerConfig(p, i){
  const c = p.config || {};
  return `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div class="form-row">
      <span class="form-label">攻擊技能</span>
      <input type="text" value="${c.selAtkSkill||''}" style="width:130px;font-size:12px"
             onchange="pConfigChange(${i},'selAtkSkill',this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">消耗MP%</span>
      <input type="number" value="${c.setMpAtk??50}" min="0" max="100" style="width:60px;font-size:12px"
             onchange="pConfigChange(${i},'setMpAtk',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">治癒技能</span>
      <input type="text" value="${c.selHealSkill||''}" style="width:130px;font-size:12px"
             onchange="pConfigChange(${i},'selHealSkill',this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">消耗MP%</span>
      <input type="number" value="${c.setMpHeal??50}" min="0" max="100" style="width:60px;font-size:12px"
             onchange="pConfigChange(${i},'setMpHeal',+this.value)">
    </div>
    <div class="form-row">
      <span class="form-label">藥水類型</span>
      <select style="width:120px;font-size:12px"
              onchange="pConfigChange(${i},'setPot',this.value)">
        <option value="potion_heal"   ${c.setPot==='potion_heal'  ?'selected':''}>紅色藥水</option>
        <option value="potion_strong" ${c.setPot==='potion_strong'?'selected':''}>橙色藥水</option>
        <option value="potion_ult"    ${c.setPot==='potion_ult'   ?'selected':''}>白色藥水</option>
      </select>
    </div>
    <div class="form-row">
      <span class="form-label">HP%觸發</span>
      <input type="number" value="${c.setHpPot??70}" min="0" max="100" style="width:60px;font-size:12px"
             onchange="pConfigChange(${i},'setHpPot',+this.value)">
    </div>
  </div>
  <div class="form-row" style="gap:14px;flex-wrap:wrap;margin-top:6px">
    <label class="eq-flag">
      <input type="checkbox" ${c.setHaste?'checked':''}
             onchange="pConfigChange(${i},'setHaste',this.checked)"> 加速
    </label>
    <label class="eq-flag">
      <input type="checkbox" ${c.setBrave?'checked':''}
             onchange="pConfigChange(${i},'setBrave',this.checked)"> 勇敢
    </label>
    <label class="eq-flag">
      <input type="checkbox" ${c.setBlue?'checked':''}
             onchange="pConfigChange(${i},'setBlue',this.checked)"> 藍藥
    </label>
    <label class="eq-flag">
      <input type="checkbox" ${c.setCautious?'checked':''}
             onchange="pConfigChange(${i},'setCautious',this.checked)"> 謹慎
    </label>
    <label class="eq-flag">
      <input type="checkbox" ${c.setMagicbarrier?'checked':''}
             onchange="pConfigChange(${i},'setMagicbarrier',this.checked)"> 魔法屏障
    </label>
    <label class="eq-flag">
      <input type="checkbox" ${c.setAutoBuyPot?'checked':''}
             onchange="pConfigChange(${i},'setAutoBuyPot',this.checked)"> 自動買藥
    </label>
  </div>`;
}

// ── 同伴欄位即時變更
function pFieldChange(idx, field, val){
  if(!G.p.allies[idx]) return;
  G.p.allies[idx][field] = val;
}
function pStatChange(idx, tier, key, val){
  if(!G.p.allies[idx]) return;
  if(!G.p.allies[idx][tier]) G.p.allies[idx][tier] = {};
  G.p.allies[idx][tier][key] = val;
}
function pMaxStats(idx, tier, max){
  if(!G.p.allies[idx]) return;
  if(!G.p.allies[idx][tier]) G.p.allies[idx][tier] = {};
  STAT_KEYS.forEach(k => {
    G.p.allies[idx][tier][k] = max;
    const el = document.getElementById(`pp_${idx}_${tier}_${k}`);
    if(el) el.value = max;
  });
}
function pEqChange(idx, slotId){
  if(!G.p.allies[idx]) return;
  const idVal   = (document.getElementById(`pp_${idx}_eq_${slotId}_id`)?.value||'').trim();
  const orig    = G.p.allies[idx].eq?.[slotId] || {};
  if(!idVal){ G.p.allies[idx].eq[slotId] = null; return; }
  const ancRaw  = document.getElementById(`pp_${idx}_eq_${slotId}_anc`)?.value  || '';
  const blessRaw= document.getElementById(`pp_${idx}_eq_${slotId}_bless`)?.value|| '';
  const attrRaw = document.getElementById(`pp_${idx}_eq_${slotId}_attr`)?.value || '';
  G.p.allies[idx].eq[slotId] = Object.assign({}, orig, {
    id:    idVal,
    en:    parseInt(document.getElementById(`pp_${idx}_eq_${slotId}_en`)?.value)||0,
    cnt:   orig.cnt||1,
    anc:   ancRaw===''?false:(ancRaw==='true'?true:ancRaw),
    bless: blessRaw===''?false:(blessRaw==='true'?true:blessRaw),
    attr:  attrRaw||false,
    seteff:orig.seteff||false,
    uid:   orig.uid||genUID(),
    lock:  orig.lock||false,
    junk:  orig.junk??false,
  });
}
function pToggleSkill(idx, el, id){
  if(!G.p.allies[idx]) return;
  if(!G.p.allies[idx].skills) G.p.allies[idx].skills = [];
  const arr = G.p.allies[idx].skills;
  const pos = arr.indexOf(id);
  if(pos===-1){
    arr.push(id);
    el.classList.add('selected');
    const cb=el.querySelector('input[type=checkbox]');
    if(cb) cb.checked=true;
  } else {
    arr.splice(pos,1);
    el.classList.remove('selected');
    const cb=el.querySelector('input[type=checkbox]');
    if(cb) cb.checked=false;
  }
}
function pSkillAll(idx){
  if(!G.p.allies[idx]) return;
  const allIds = [...new Set([
    ...SKILL_MAGE,...SKILL_KNIGHT,...SKILL_ELF,...SKILL_DARK,
    ...SKILL_ROYAL,...SKILL_DRAGON,...SKILL_ILLUSION,...SKILL_WARRIOR
  ].map(s=>s.id))];
  G.p.allies[idx].skills = allIds;
  // 刷新卡片狀態
  const sec = document.getElementById(`psec_${idx}_skills`);
  if(sec){
    sec.querySelectorAll('.skill-card').forEach(card=>{
      card.classList.add('selected');
      const cb=card.querySelector('input[type=checkbox]');
      if(cb) cb.checked=true;
    });
  }
  toast(`同伴 ${idx+1} 已全選技能`, 'ok');
}
function pSkillClear(idx){
  if(!G.p.allies[idx]) return;
  G.p.allies[idx].skills = [];
  const sec = document.getElementById(`psec_${idx}_skills`);
  if(sec){
    sec.querySelectorAll('.skill-card').forEach(card=>{
      card.classList.remove('selected');
      const cb=card.querySelector('input[type=checkbox]');
      if(cb) cb.checked=false;
    });
  }
  toast(`同伴 ${idx+1} 已全清技能`, 'info');
}
function pAddItem(idx){
  const id  = document.getElementById(`pInvSel_${idx}`)?.value;
  const cnt = parseInt(document.getElementById(`pInvCnt_${idx}`)?.value)||1;
  if(!id){ toast('請先選擇物品','err'); return; }
  if(!G.p.allies[idx].inv) G.p.allies[idx].inv=[];
  G.p.allies[idx].inv.push({id,uid:genUID(),cnt,en:0,bless:false,lock:false,junk:false,attr:false,anc:false,seteff:false});
  savePartnerToG(idx);
  renderPartnerList();
  toast('已新增：'+getItemName(id),'ok');
}
function pDelItem(idx,j){
  G.p.allies[idx].inv.splice(j,1);
  savePartnerToG(idx);
  renderPartnerList();
}
function pClearInv(idx){
  if(!confirm('確定清空同伴背包？')) return;
  G.p.allies[idx].inv=[];
  savePartnerToG(idx);
  renderPartnerList();
}
function pItemField(idx,j,field,val){
  if(!G.p.allies[idx]?.inv[j]) return;
  G.p.allies[idx].inv[j][field]=val;
}
function pConfigChange(idx,field,val){
  if(!G.p.allies[idx]) return;
  if(!G.p.allies[idx].config) G.p.allies[idx].config={};
  G.p.allies[idx].config[field]=val;
}
function pMaxAll(idx){
  if(!G.p.allies[idx]) return;
  pFieldChange(idx,'lv',9999);
  pFieldChange(idx,'gold',999999999);
  const el_lv=document.getElementById(`pp_${idx}_lv`);
  const el_gold=document.getElementById(`pp_${idx}_gold`);
  if(el_lv) el_lv.value=9999;
  if(el_gold) el_gold.value=999999999;
  toast(`同伴 ${idx+1} 已最大化`,'ok');
}
function pFullRestore(idx){
  if(!G.p.allies[idx]) return;
  const mhp=G.p.allies[idx].mhp||100;
  const mmp=G.p.allies[idx].mmp||50;
  pFieldChange(idx,'hp',mhp);
  pFieldChange(idx,'mp',mmp);
  const eh=document.getElementById(`pp_${idx}_hp`);
  const em=document.getElementById(`pp_${idx}_mp`);
  if(eh) eh.value=mhp;
  if(em) em.value=mmp;
  toast(`同伴 ${idx+1} HP/MP 已補滿`,'ok');
}

// 儲存同伴資料到 G（切換 tab 前呼叫）
function savePartnerToG(idx){
  // 即時變更已透過 onchange 同步，此處為保險再讀一次基本欄位
  const p = G.p.allies[idx];
  if(!p) return;
  const flds = ['name','cls','lv','exp','hp','mhp','mp','mmp','gold','mastery'];
  flds.forEach(f=>{
    const el=document.getElementById(`pp_${idx}_${f}`);
    if(!el) return;
    if(f==='lv'||f==='exp'||f==='hp'||f==='mhp'||f==='mp'||f==='mmp'||f==='gold')
      p[f]=parseInt(el.value)||0;
    else if(f==='mastery')
      p[f]=el.value||null;
    else
      p[f]=el.value;
  });
}

// ════════════════════════════════════════════════
//  寵物面板
// ════════════════════════════════════════════════
// 寵物圖鑑（型態下拉選單用；uid/lv/exp/hp/mp 等對應存檔 pets[] 結構）
const PET_FORM_LIST = {
  "基礎": [
    "牧羊犬",
    "貓",
    "熊",
    "杜賓狗",
    "狼",
    "浣熊",
    "小獵犬",
    "聖伯納犬",
    "狐狸",
    "暴走兔",
    "哈士奇",
    "柯利",
    "虎男",
    "高麗幼犬",
    "袋鼠",
    "熊貓",
    "猴子",
    "頑皮龍",
    "淘氣龍",
    "厄運蜥蜴",
    "災厄蜥蜴",
    "破滅蜥蜴",
    "詛咒蜥蜴"
  ],
  "高等": [
    "高等牧羊犬",
    "高等貓",
    "高等熊",
    "高等杜賓狗",
    "高等狼",
    "高等浣熊",
    "高等小獵犬",
    "高等聖伯納犬",
    "高等狐狸",
    "高等暴走兔",
    "高等哈士奇",
    "高等柯利",
    "真‧虎男",
    "高麗犬",
    "高等袋鼠",
    "高等熊貓",
    "超級猴子",
    "高等頑皮龍",
    "高等淘氣龍"
  ],
  "黃金龍": [
    "黃金龍"
  ]
};;;

function _genPetUid(){
  return Math.random().toString(36).slice(2, 11);
}

function newPetTemplate(){
  return {
    uid: _genPetUid(), form:'哈士奇', lv:5, exp:0,
    mhp:50, mmp:5, hp:50, mp:5,
    outSlot:null, outV:0, eqV:0, potPct:0,
    name:'', locked:false,
  };
}

function addPet(){
  if(!G.pets) G.pets = [];
  G.pets.push(newPetTemplate());
  renderPetList();
  toast('已新增寵物', 'ok');
}

function removePet(idx){
  if(!confirm(`確定刪除寵物 ${idx+1}？`)) return;
  G.pets.splice(idx, 1);
  renderPetList();
  toast('已刪除寵物', 'info');
}

function clearPets(){
  if(!confirm('確定清空全部寵物？')) return;
  G.pets = [];
  renderPetList();
  toast('已清空寵物', 'info');
}

function petFieldChange(idx, field, val){
  if(!G.pets[idx]) return;
  G.pets[idx][field] = val;
}

function petMaxHpMp(idx){
  if(!G.pets[idx]) return;
  const p = G.pets[idx];
  p.hp = p.mhp||0; p.mp = p.mmp||0;
  const eh=document.getElementById(`pt_${idx}_hp`);
  const em=document.getElementById(`pt_${idx}_mp`);
  if(eh) eh.value=p.hp;
  if(em) em.value=p.mp;
  toast(`寵物 ${idx+1} HP/MP 已補滿`, 'ok');
}

function petFormOptionsHtml(cur){
  return Object.entries(PET_FORM_LIST).map(([grp, forms]) => `
    <optgroup label="${grp}">
      ${forms.map(f=>`<option value="${f}" ${cur===f?'selected':''}>${f}</option>`).join('')}
    </optgroup>`).join('');
}

// ── 寵物列表渲染
function renderPetList(){
  const container = document.getElementById('petList');
  if(!container) return;
  const list = G.pets || [];

  if(!list.length){
    container.innerHTML = `
      <div style="color:var(--text3);padding:24px;text-align:center;
                  border:1px dashed var(--border);border-radius:8px">
        尚無寵物，點擊「新增寵物」開始
      </div>`;
    return;
  }

  container.innerHTML = list.map((p, i) => `
    <div class="partner-card" id="petcard_${i}">
      <div class="partner-card-header">
        <span class="partner-badge">#${i+1}</span>
        <span style="font-weight:bold;color:var(--partner)">${p.form||'未知型態'}</span>
        <span style="color:var(--text3);font-size:12px">
          ${p.name ? `「${p.name}」` : ''} Lv.${p.lv||1}
          ${p.outSlot!=null ? ' · 出戰中' : ''}
          ${p.locked ? ' · 🔒鎖定' : ''}
        </span>
        <button class="btn btn-danger btn-sm" style="margin-left:auto"
                onclick="removePet(${i})">🗑 刪除</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div class="form-row">
          <span class="form-label">型態</span>
          <select id="pt_${i}_form" style="width:150px"
                  onchange="petFieldChange(${i},'form',this.value)">
            ${petFormOptionsHtml(p.form)}
          </select>
        </div>
        <div class="form-row">
          <span class="form-label">暱稱</span>
          <input type="text" id="pt_${i}_name" value="${p.name||''}" style="width:120px"
                 onchange="petFieldChange(${i},'name',this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">等級</span>
          <input type="number" id="pt_${i}_lv" value="${p.lv||1}"
                 min="1" max="9999" style="width:80px"
                 onchange="petFieldChange(${i},'lv',+this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">經驗值</span>
          <input type="number" id="pt_${i}_exp" value="${p.exp||0}"
                 min="0" style="width:100px"
                 onchange="petFieldChange(${i},'exp',+this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">HP</span>
          <input type="number" id="pt_${i}_hp" value="${p.hp||0}" style="width:80px"
                 onchange="petFieldChange(${i},'hp',+this.value)">
          <span style="color:var(--text3);font-size:12px">/</span>
          <input type="number" id="pt_${i}_mhp" value="${p.mhp||0}" style="width:80px"
                 onchange="petFieldChange(${i},'mhp',+this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">MP</span>
          <input type="number" id="pt_${i}_mp" value="${p.mp||0}" style="width:80px"
                 onchange="petFieldChange(${i},'mp',+this.value)">
          <span style="color:var(--text3);font-size:12px">/</span>
          <input type="number" id="pt_${i}_mmp" value="${p.mmp||0}" style="width:80px"
                 onchange="petFieldChange(${i},'mmp',+this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">生命低於%喝水</span>
          <input type="number" id="pt_${i}_potPct" value="${p.potPct||0}"
                 min="0" max="100" style="width:80px"
                 onchange="petFieldChange(${i},'potPct',+this.value)">
        </div>
        <div class="form-row">
          <span class="form-label">出戰欄位</span>
          <input type="text" id="pt_${i}_outSlot" value="${p.outSlot==null?'':p.outSlot}"
                 placeholder="留空=未出戰" style="width:100px"
                 onchange="petFieldChange(${i},'outSlot',this.value===''?null:this.value)">
        </div>
        <div class="form-row">
          <label class="eq-flag">
            <input type="checkbox" id="pt_${i}_locked" ${p.locked?'checked':''}
                   onchange="petFieldChange(${i},'locked',this.checked)">
            鎖定（防止誤放生）
          </label>
        </div>
      </div>
      <div class="form-row" style="margin-top:8px">
        <button class="btn btn-sm btn-accent" onclick="petMaxHpMp(${i})">💊 補滿HP/MP</button>
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════════════
//  圖鑑面板
// ════════════════════════════════════════════════
let _dexTab = 'equip';

function switchDexTab(tab, el){
  _dexTab = tab;
  document.querySelectorAll('#dexTabBar .skill-filter-btn')
    .forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('dex-equip').style.display = tab==='equip' ? '' : 'none';
  document.getElementById('dex-card').style.display  = tab==='card'  ? '' : 'none';
  document.getElementById('dex-misc').style.display  = tab==='misc'  ? '' : 'none';
  document.getElementById('dex-relic').style.display = tab==='relic' ? '' : 'none';
  if(tab==='misc')  renderDexMisc();
  if(tab==='relic') renderDexRelic();
}

// ── 裝備/遺物分類系統（來源：10-ui-tabs.js WEAPON_TAGS + 16-equip-book.js EQUIP_CATEGORIES/equipCatKey）
function isWandWeapon(d){ return !!(d && d.isWand); }
const WEAPON_TAGS = {
  "wpn_katana": [
    "單手劍",
    "武士刀"
  ],
  "wpn_siruge": [
    "單手劍",
    "武士刀"
  ],
  "wpn_golden_scepter": [
    "單手劍",
    "武士刀"
  ],
  "wpn_dagger2": [
    "匕首"
  ],
  "wpn_dagger1": [
    "匕首"
  ],
  "wpn_11": [
    "匕首"
  ],
  "wpn_33": [
    "匕首"
  ],
  "wpn_longsword": [
    "單手劍"
  ],
  "wpn_9": [
    "單手劍"
  ],
  "wpn_scimitar": [
    "單手劍"
  ],
  "wpn_26": [
    "單手劍"
  ],
  "wpn_elfsword": [
    "單手劍"
  ],
  "wpn_27": [
    "單手劍"
  ],
  "wpn_shortsword": [
    "單手劍"
  ],
  "wpn_redknight": [
    "單手劍"
  ],
  "wpn_invader": [
    "單手劍"
  ],
  "wpn_34": [
    "單手劍"
  ],
  "wpn_35": [
    "單手劍"
  ],
  "wpn_36": [
    "單手劍"
  ],
  "wpn_rapier": [
    "單手劍"
  ],
  "wpn_mailbreaker": [
    "單手劍"
  ],
  "wpn_silversword": [
    "單手劍"
  ],
  "wpn_37": [
    "單手劍"
  ],
  "wpn_21": [
    "矛"
  ],
  "wpn_24": [
    "矛"
  ],
  "wpn_25": [
    "矛"
  ],
  "wpn_28": [
    "矛"
  ],
  "wpn_39": [
    "矛"
  ],
  "wpn_40": [
    "矛"
  ],
  "wpn_41": [
    "矛"
  ],
  "wpn_17": [
    "矛"
  ],
  "wpn_4": [
    "矛"
  ],
  "wpn_halberd": [
    "矛"
  ],
  "wpn_20": [
    "單手鈍器"
  ],
  "wpn_10": [
    "單手鈍器"
  ],
  "wpn_13": [
    "單手鈍器"
  ],
  "wpn_alien": [
    "單手鈍器"
  ],
  "wpn_1": [
    "單手鈍器"
  ],
  "wpn_2": [
    "單手鈍器"
  ],
  "wpn_ancient_axe": [
    "單手鈍器"
  ],
  "wpn_warrior_trial_axe": [
    "單手鈍器"
  ],
  "wpn_master_axe": [
    "單手鈍器"
  ],
  "wpn_demon_axehead": [
    "單手鈍器"
  ],
  "wpn_iron_axehead": [
    "單手鈍器"
  ],
  "wpn_giant_axehead": [
    "單手鈍器"
  ],
  "wpn_2hsword": [
    "雙手劍"
  ],
  "wpn_dragonslayer": [
    "雙手劍"
  ],
  "wpn_official_2h": [
    "雙手劍"
  ],
  "wpn_battleaxe": [
    "雙手鈍器"
  ],
  "wpn_19": [
    "雙手鈍器"
  ],
  "wpn_23": [
    "雙手鈍器"
  ],
  "wpn_giantaxe": [
    "雙手鈍器"
  ],
  "wpn_berserker": [
    "雙手鈍器"
  ],
  "wpn_silveraxe": [
    "雙手鈍器"
  ],
  "wpn_taurus_axe": [
    "雙手鈍器"
  ],
  "wpn_claw_bronze": [
    "鋼爪"
  ],
  "wpn_claw_steel": [
    "鋼爪"
  ],
  "wpn_claw_shadow": [
    "鋼爪"
  ],
  "wpn_claw_silver": [
    "鋼爪"
  ],
  "wpn_claw_dark": [
    "鋼爪"
  ],
  "wpn_claw_gloom": [
    "鋼爪"
  ],
  "wpn_claw_damascus": [
    "鋼爪"
  ],
  "wpn_claw_abyss": [
    "鋼爪"
  ],
  "wpn_baranka_claw": [
    "鋼爪"
  ],
  "wpn_baranka_steelclaw": [
    "鋼爪"
  ],
  "wpn_blood_2hsword": [
    "雙手劍"
  ],
  "wpn_dark_sword": [
    "單手劍"
  ],
  "wpn_dk_flameblade": [
    "單手劍"
  ],
  "wpn_kurt_sword": [
    "單手劍"
  ],
  "wpn_assassin_mark": [
    "雙刀"
  ],
  "wpn_dual_bronze": [
    "雙刀"
  ],
  "wpn_dual_steel": [
    "雙刀"
  ],
  "wpn_dual_silver": [
    "雙刀"
  ],
  "wpn_dual_gloom": [
    "雙刀"
  ],
  "wpn_dual_dark": [
    "雙刀"
  ],
  "wpn_dual_shadow": [
    "雙刀"
  ],
  "wpn_dual_damascus": [
    "雙刀"
  ],
  "wpn_dual_abyss": [
    "雙刀"
  ],
  "wpn_thebes_dual": [
    "雙刀"
  ],
  "wpn_manadagger": [
    "匕首"
  ],
  "wpn_crystal_dagger": [
    "匕首"
  ],
  "wpn_chaos_thorn": [
    "匕首"
  ],
  "wpn_demonking_dual": [
    "雙刀"
  ],
  "wpn_demonking_2hsword": [
    "雙手劍"
  ],
  "wpn_small_katana": [
    "匕首"
  ],
  "wpn_dagger_rasta": [
    "匕首"
  ],
  "wpn_sword_rasta": [
    "單手劍"
  ],
  "wpn_dual_rasta": [
    "雙刀"
  ],
  "wpn_spear_rasta": [
    "矛"
  ],
  "wpn_dual_spike": [
    "雙刀"
  ],
  "wpn_official_blade": [
    "單手劍"
  ],
  "wpn_emperor_blade": [
    "雙手劍"
  ],
  "wpn_windblade_dagger": [
    "匕首"
  ],
  "wpn_redshadow_dual": [
    "雙刀"
  ],
  "wpn_beastking_claw": [
    "鋼爪"
  ],
  "wpn_mithril_dagger": [
    "匕首"
  ],
  "wpn_ori_dagger": [
    "匕首"
  ],
  "wpn_crimson_spear": [
    "矛"
  ],
  "wpn_demon_axe": [
    "雙手鈍器"
  ],
  "wpn_frost_spear": [
    "矛"
  ],
  "wpn_thunder_sword": [
    "單手劍"
  ],
  "wpn_vengeance": [
    "雙手劍"
  ],
  "wpn_blackflame_sword": [
    "單手劍",
    "武士刀"
  ],
  "wpn_hate_claw": [
    "鋼爪"
  ],
  "wpn_demon_claw": [
    "鋼爪"
  ],
  "wpn_death_finger": [
    "鋼爪"
  ],
  "wpn_demon_sword": [
    "單手劍"
  ],
  "wpn_redflame_sword": [
    "單手劍",
    "武士刀"
  ],
  "wpn_demon_dual": [
    "雙刀"
  ],
  "wpn_dual_destroy": [
    "雙刀"
  ],
  "wpn_claw_destroy": [
    "鋼爪"
  ],
  "wpn_old_sword": [
    "單手劍",
    "武士刀"
  ],
  "wpn_ancient_darkelf_sword": [
    "單手劍"
  ],
  "wpn_demon_sword_hidden": [
    "單手劍"
  ],
  "wpn_demon_claw_hidden": [
    "鋼爪"
  ],
  "wpn_pirate_dagger": [
    "匕首"
  ],
  "wpn_glory_sword": [
    "單手劍"
  ],
  "wpn_pirate_shortblade": [
    "單手劍"
  ],
  "wpn_pirate_cutlass": [
    "單手劍"
  ],
  "wpn_abyss_dualblade": [
    "雙刀"
  ],
  "wpn_thor_hammer": [
    "單手鈍器"
  ],
  "wpn_osis_hammer": [
    "單手鈍器"
  ],
  "wpn_mapler_punish": [
    "雙手鈍器"
  ],
  "wpn_pagrio_wrath": [
    "單手劍"
  ],
  "wpn_eva_scold": [
    "單手劍"
  ],
  "relic_goblin_blade": [
    "單手劍"
  ],
  "relic_gremlin_club": [
    "單手鈍器"
  ],
  "relic_husky_bone": [
    "單手鈍器"
  ],
  "relic_doberman_fang": [
    "匕首"
  ],
  "relic_gladiator_scimitar": [
    "單手劍"
  ],
  "relic_icefield_pick": [
    "單手鈍器"
  ],
  "relic_werewolf_mace": [
    "單手鈍器"
  ],
  "relic_orc_nail": [
    "匕首"
  ],
  "relic_pan_staff": [
    "矛"
  ],
  "relic_elastic_rib": [
    "雙刀"
  ],
  "relic_golem_fist": [
    "雙手鈍器"
  ],
  "relic_orc_cleaver": [
    "單手劍"
  ],
  "relic_strong_femur": [
    "單手鈍器"
  ],
  "relic_forgotten_spear": [
    "矛"
  ],
  "relic_spider_claw": [
    "鋼爪"
  ],
  "relic_hobgoblin_grinder": [
    "單手劍"
  ],
  "relic_orc_butcher": [
    "單手劍"
  ],
  "relic_orc_pole": [
    "矛"
  ],
  "relic_sparta_grudge": [
    "雙刀"
  ],
  "relic_shark_teeth": [
    "匕首"
  ],
  "relic_guard_spear": [
    "矛"
  ],
  "relic_crab_claw": [
    "鋼爪"
  ],
  "relic_venom_fang": [
    "雙手劍"
  ],
  "relic_ratman_skewer": [
    "矛"
  ],
  "relic_lizardman_cleaver": [
    "矛"
  ],
  "relic_ohm_maul": [
    "雙手鈍器"
  ],
  "relic_parrot_beak": [
    "雙手劍"
  ],
  "relic_pirate_scimitar": [
    "單手劍"
  ],
  "relic_scorpion_sting": [
    "匕首"
  ],
  "relic_harvey_claw": [
    "單手劍"
  ],
  "relic_guard_pike": [
    "矛"
  ],
  "relic_ogi_greataxe": [
    "雙手鈍器"
  ],
  "relic_darkthief_claw": [
    "鋼爪"
  ],
  "relic_fighter_axe": [
    "雙手鈍器"
  ],
  "relic_darkelf_grindblade": [
    "單手劍",
    "武士刀"
  ],
  "relic_wisp_remnant": [
    "單手劍",
    "武士刀"
  ],
  "relic_summoner_whip": [
    "單手鈍器"
  ],
  "relic_griffin_claw": [
    "鋼爪"
  ],
  "relic_croc_fang": [
    "雙手劍"
  ],
  "relic_icestone_maul": [
    "雙手鈍器"
  ],
  "relic_mutant_lamia_scale": [
    "匕首"
  ],
  "relic_thorn_needle": [
    "匕首"
  ],
  "relic_giant_toothpick": [
    "雙手劍"
  ],
  "relic_veteran_greatsword": [
    "雙手劍"
  ],
  "relic_giant_throwstone": [
    "雙手鈍器"
  ],
  "relic_armor_spareblade": [
    "雙刀"
  ],
  "relic_aruba_haste": [
    "單手鈍器"
  ],
  "relic_ashwarrior_flamesword": [
    "單手劍"
  ],
  "relic_deadgeneral_greatsword": [
    "雙手劍"
  ],
  "relic_darkscorpion_pincers": [
    "雙刀"
  ],
  "relic_medusa_stinger": [
    "單手鈍器"
  ],
  "relic_silent_venom": [
    "矛"
  ],
  "relic_axetaurus_brutalaxe": [
    "雙手鈍器"
  ],
  "relic_lizard_tongue": [
    "矛"
  ],
  "relic_killerbee_sting": [
    "匕首"
  ],
  "relic_ancient_spider_claw": [
    "單手劍",
    "武士刀"
  ],
  "relic_guardian_greatsword": [
    "雙手劍"
  ],
  "wpn_kukulkan_spear": [
    "矛"
  ],
  "relic_eto_whip": [
    "矛"
  ],
  "relic_serpent_fang": [
    "矛"
  ],
  "relic_kaira_fang": [
    "匕首"
  ],
  "relic_mud_idol": [
    "雙手鈍器"
  ],
  "relic_teo_hammer": [
    "單手鈍器"
  ],
  "relic_executor_axe": [
    "單手鈍器"
  ],
  "relic_healer_wand": [
    "單手鈍器"
  ],
  "relic_minotaur_flail": [
    "單手鈍器"
  ],
  "relic_executor_skewer": [
    "矛"
  ],
  "relic_weathered_obelisk": [
    "雙手鈍器"
  ],
  "relic_shadow_stinger": [
    "匕首"
  ],
  "relic_soulreaper_dual": [
    "雙刀"
  ],
  "relic_ghoul_fang": [
    "單手劍"
  ],
  "relic_sparto_shard": [
    "單手劍"
  ],
  "relic_pirate_dual": [
    "雙刀"
  ],
  "relic_lava_fists": [
    "單手鈍器"
  ],
  "wpn_damascus": [
    "單手劍"
  ],
  "wpn_6": [
    "矛"
  ],
  "wpn_7": [
    "矛"
  ],
  "wpn_12": [
    "矛"
  ],
  "wpn_15": [
    "矛"
  ],
  "wpn_18": [
    "矛"
  ],
  "wpn_14": [
    "矛"
  ],
  "wpn_16": [
    "矛"
  ],
  "wpn_demonking_spear": [
    "矛"
  ],
  "wpn_ancient_spear": [
    "矛"
  ],
  "relic_bk_lance": [
    "矛"
  ],
  "wpn_rond_dual": [
    "雙刀"
  ],
  "wpn_cursed_emperor_blade": [
    "單手劍",
    "武士刀"
  ],
  "wpn_uncursed_emperor_blade": [
    "單手劍",
    "武士刀"
  ],
  "relic_fireking_blast": [
    "雙手劍"
  ],
  "relic_waterking_caress": [
    "鋼爪"
  ],
  "relic_cerberus_pin": [
    "鋼爪"
  ],
  "relic_dark_metal_club": [
    "單手鈍器"
  ],
  "relic_ash_fist": [
    "單手鈍器"
  ],
  "relic_ant_pincer": [
    "單手劍",
    "武士刀"
  ],
  "relic_reaper_scythe": [
    "雙手劍"
  ],
  "relic_mage_dagger": [
    "匕首"
  ],
  "relic_sr_kettle_maul": [
    "雙手鈍器"
  ],
  "relic_sr_kama_blade": [
    "單手劍",
    "武士刀"
  ],
  "relic_sr_ushioni_horn": [
    "矛"
  ],
  "relic_earthshatter_sword": [
    "單手劍"
  ],
  "relic_gale_fistblade": [
    "鋼爪"
  ],
  "relic_hellfire_hammer": [
    "單手鈍器"
  ],
  "relic_blood_ritual_dagger": [
    "匕首"
  ],
  "relic_scorch_greatsword": [
    "雙手劍"
  ],
  "relic_bloodknight_dual": [
    "雙刀"
  ],
  "relic_elmo_spear": [
    "矛"
  ],
  "relic_crusher_hammer": [
    "雙手鈍器"
  ],
  "relic_maze_demon_glare": [
    "雙手鈍器"
  ],
  "relic_warrior_blackblade": [
    "單手劍",
    "武士刀"
  ],
  "relic_elmore_greatsword": [
    "雙手劍"
  ],
  "relic_beheading_scythe": [
    "雙手劍"
  ],
  "relic_serrated_fangs": [
    "雙刀"
  ],
  "relic_mageblade_knife": [
    "單手劍",
    "武士刀"
  ],
  "relic_true_dragonslayer": [
    "雙手劍"
  ],
  "relic_flame_dk_sword": [
    "單手劍",
    "武士刀"
  ]
};;;;;
const EQUIP_CATEGORIES = [
  {
    "key": "dagger",
    "name": "匕首",
    "group": "武器"
  },
  {
    "key": "sword1",
    "name": "單手劍",
    "group": "武器"
  },
  {
    "key": "sword2",
    "name": "雙手劍",
    "group": "武器"
  },
  {
    "key": "katana",
    "name": "武士刀",
    "group": "武器"
  },
  {
    "key": "blunt1",
    "name": "單手鈍器",
    "group": "武器"
  },
  {
    "key": "blunt2",
    "name": "雙手鈍器",
    "group": "武器"
  },
  {
    "key": "spear",
    "name": "矛",
    "group": "武器"
  },
  {
    "key": "claw",
    "name": "鋼爪",
    "group": "武器"
  },
  {
    "key": "dual",
    "name": "雙刀",
    "group": "武器"
  },
  {
    "key": "chainsword",
    "name": "鎖鏈劍",
    "group": "武器"
  },
  {
    "key": "bow",
    "name": "弓",
    "group": "武器"
  },
  {
    "key": "xbow",
    "name": "十字弓",
    "group": "武器"
  },
  {
    "key": "quiver",
    "name": "箭筒",
    "group": "武器"
  },
  {
    "key": "wand",
    "name": "魔杖",
    "group": "武器"
  },
  {
    "key": "qigu",
    "name": "奇古獸",
    "group": "武器"
  },
  {
    "key": "wpn_other",
    "name": "其他武器",
    "group": "武器"
  },
  {
    "key": "helm",
    "name": "頭盔",
    "group": "防具"
  },
  {
    "key": "armor",
    "name": "盔甲",
    "group": "防具"
  },
  {
    "key": "shin",
    "name": "脛甲",
    "group": "防具"
  },
  {
    "key": "tshirt",
    "name": "內衣",
    "group": "防具"
  },
  {
    "key": "cloak",
    "name": "斗篷",
    "group": "防具"
  },
  {
    "key": "boots",
    "name": "長靴",
    "group": "防具"
  },
  {
    "key": "gloves",
    "name": "手套",
    "group": "防具"
  },
  {
    "key": "shield",
    "name": "盾牌",
    "group": "防具"
  },
  {
    "key": "armguard",
    "name": "臂甲",
    "group": "防具"
  },
  {
    "key": "amulet",
    "name": "項鍊",
    "group": "飾品"
  },
  {
    "key": "ring",
    "name": "戒指",
    "group": "飾品"
  },
  {
    "key": "belt",
    "name": "腰帶",
    "group": "飾品"
  },
  {
    "key": "ear",
    "name": "耳環",
    "group": "飾品"
  },
  {
    "key": "pet",
    "name": "寵物裝備",
    "group": "飾品"
  },
  {
    "key": "doll",
    "name": "魔法娃娃",
    "group": "飾品"
  }
];;;
function equipCatKey(id, d) {
    if (!d) return null;
    if (d.type === 'wpn') {
        if (d.isArrow) return (typeof isRelicItem === 'function' && isRelicItem(d)) ? 'quiver' : null;   // 🏺 v3.2.0 遺物箭筒歸「箭筒」分類（供遺物收集冊）；一般箭矢＝彈藥，不收錄
        if (d.isBow) return /十字弓|弩/.test(d.n || '') ? 'xbow' : 'bow';
        if (d.qigu) return 'qigu';
        if (d.chainsword) return 'chainsword';
        if (typeof isWandWeapon === 'function' && isWandWeapon(d)) return 'wand';
        if (typeof WAND_LIGHTARROW_IDS !== 'undefined' && WAND_LIGHTARROW_IDS.indexOf(id) >= 0) return 'wand';   // 🔮 共鳴法器（惡魔鐮刀＝單手魔杖／漆黑水晶球等）歸魔杖
        let tags = (typeof getWeaponTags === 'function') ? getWeaponTags(id) : [];
        if (tags.indexOf('武士刀') >= 0) return 'katana';
        if (tags.indexOf('雙刀') >= 0) return 'dual';
        if (tags.indexOf('鋼爪') >= 0) return 'claw';
        if (tags.indexOf('匕首') >= 0) return 'dagger';
        if (tags.indexOf('雙手劍') >= 0) return 'sword2';
        if (tags.indexOf('單手劍') >= 0) return 'sword1';
        if (tags.indexOf('雙手鈍器') >= 0) return 'blunt2';
        if (tags.indexOf('單手鈍器') >= 0) return 'blunt1';
        if (tags.indexOf('矛') >= 0) return 'spear';
        // 無 tag 的武器：用 eff/名稱補分類（矛=穿透、雙手劍=切割、鈍器=重擊、共鳴法球=魔杖）
        if (/水晶球/.test(d.n || '')) return 'wand';
        if (d.eff === 'pierce') return 'spear';
        if (d.eff === 'cleave') return 'sword2';
        if (d.eff === 'crush') return d.w2h ? 'blunt2' : 'blunt1';
        return 'wpn_other';
    }
    if (d.type === 'arm') {
        if (d.armguard) return 'armguard';                           // 臂甲（slot:shield 但 armguard 旗標）
        if (d.slot === 'helm') return 'helm';
        if (d.slot === 'armor') return 'armor';
        if (d.slot === 'shin') return 'shin';   // 🦵 脛甲（盔甲下方·額外防具）
        if (d.slot === 'tshirt') return 'tshirt';   // 🏺 內衣（T恤）：供遺物 T恤 分類（一般 T恤亦一併納入裝備收集冊）
        if (d.slot === 'cloak') return 'cloak';
        if (d.slot === 'boots') return 'boots';
        if (d.slot === 'gloves') return 'gloves';
        if (d.slot === 'shield') return 'shield';
        if (d.slot === 'petarm') return 'pet';   // 🛡️ v3.2.37 寵物防具 → 寵物裝備分類
        return null;
    }
    if (d.type === 'acc') {
        if (d.slot === 'amulet') return 'amulet';
        if (d.slot === 'ring') return 'ring';
        if (d.slot === 'belt') return 'belt';
        if (d.slot === 'ear1' || d.slot === 'ear2' || d.slot === 'ear') return 'ear';
        if (d.slot === 'pet' || d.slot === 'petwpn') return 'pet';   // 🦴 v3.2.37 之牙改 slot:petwpn（寵物個別武器）
        if (d.slot === 'doll') return 'doll';
        return null;
    }
    return null;
}function getWeaponTags(id){ return WEAPON_TAGS[id] || []; }

// ---- 建立索引：部位 → [itemId,...]（裝備收集冊排除遺物；遺物另建於下方遺物圖鑑）----
const EQUIP_CAT_ITEMS = {};
const EQUIP_ITEM_CAT  = {};
let _equipIndexBuilt = false;
function _ensureEquipIndex(){
  if(_equipIndexBuilt) return;
  _equipIndexBuilt = true;
  EQUIP_CATEGORIES.forEach(c => EQUIP_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    if(!d || (d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc')) return;
    if(isRelicItem(d)) return;   // 遺物不進裝備收集冊，改進遺物收集冊
    const ck = equipCatKey(id, d);
    if(!ck || !EQUIP_CAT_ITEMS[ck]) return;
    EQUIP_CAT_ITEMS[ck].push(id);
    EQUIP_ITEM_CAT[id] = ck;
  });
  Object.keys(EQUIP_CAT_ITEMS).forEach(k => {
    EQUIP_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
}
function _equipCatOptionsHTML(){
  let lastGroup = '';
  let html = '<option value="">全部部位</option>';
  EQUIP_CATEGORIES.forEach(c => {
    if(c.group !== lastGroup){
      if(lastGroup) html += '</optgroup>';
      html += `<optgroup label="${c.group}">`;
      lastGroup = c.group;
    }
    html += `<option value="${c.key}">${c.name}</option>`;
  });
  html += '</optgroup>';
  return html;
}

// ── 裝備圖鑑（比照 16-equip-book.js：僅收錄真正裝備，依 27 部位分類，排除遺物）
function renderDexEquip(){
  _ensureEquipIndex();
  const grid = document.getElementById('dexEquipGrid');
  const cnt  = document.getElementById('dexEquipCount');
  if(!grid) return;

  const catSel = document.getElementById('dexEquipCatSel');
  if(catSel && !catSel.dataset.filled){
    catSel.innerHTML = _equipCatOptionsHTML();
    catSel.dataset.filled = '1';
  }

  const q   = (document.getElementById('dexEquipSearch')?.value||'').toLowerCase();
  const cat = catSel?.value || '';
  const owned = G.p.equipDex || {};

  let ids = cat ? (EQUIP_CAT_ITEMS[cat]||[]) : Object.keys(EQUIP_ITEM_CAT);
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = Object.keys(EQUIP_ITEM_CAT).length;
  const ownedAll = Object.keys(EQUIP_ITEM_CAT).filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已解鎖 ${ownedAll} / ${totalAll}`;

  const CAT_NAME = {}; EQUIP_CATEGORIES.forEach(c => CAT_NAME[c.key]=c.name);

  grid.innerHTML = ids.map(id=>{
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexEquip('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;${v.legend?'color:var(--legend)':''};
                    white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_NAME[EQUIP_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexEquip(id){
  if(!G.p.equipDex) G.p.equipDex={};
  if(G.p.equipDex[id]) delete G.p.equipDex[id];
  else G.p.equipDex[id]=true;
  renderDexEquip();
}


function dexUnlockAll(type){
  if(type==='equip'){
    _ensureEquipIndex();
    if(!G.p.equipDex) G.p.equipDex = {};
    const ids = Object.keys(EQUIP_ITEM_CAT);
    ids.forEach(id=>{ G.p.equipDex[id]=true; });
    renderDexEquip();
    toast(`裝備圖鑑全部解鎖（${ids.length} 件）`,'ok');
  } else if(type==='misc'){
    _ensureMiscIndex();
    if(!G.p.miscDex) G.p.miscDex = {};
    MISC_DEX_ALL_IDS.forEach(id=>{ G.p.miscDex[id]=true; });
    renderDexMisc();
    toast(`道具圖鑑全部解鎖（${MISC_DEX_ALL_IDS.length} 件）`,'ok');
  } else if(type==='relic'){
    _ensureRelicIndex();
    if(!G.p.relicDex) G.p.relicDex = {};
    const ids = Object.keys(RELIC_ITEM_CAT);
    ids.forEach(id=>{ G.p.relicDex[id]=true; });
    renderDexRelic();
    toast(`遺物圖鑑全部解鎖（${ids.length} 件）`,'ok');
  } else {
    const cnt = parseInt(document.getElementById('dexCardCntSel')?.value)||100;
    CARD_DEX_LIST.forEach(m=>{ G.p.cardDex[m.n]=cnt; });
    renderDexCard();
    toast(`卡片圖鑑全部解鎖（數量 ${cnt}）`,'ok');
  }
}

function dexClearAll(type){
  if(!confirm('確定清除全部圖鑑？')) return;
  if(type==='equip'){
    G.p.equipDex={};
    renderDexEquip();
    toast('裝備圖鑑已全部清除','info');
  } else if(type==='misc'){
    G.p.miscDex={};
    renderDexMisc();
    toast('道具圖鑑已全部清除','info');
  } else if(type==='relic'){
    G.p.relicDex={};
    renderDexRelic();
    toast('遺物圖鑑已全部清除','info');
  } else {
    G.p.cardDex={};
    renderDexCard();
    toast('卡片圖鑑已全部清除','info');
  }
}

// ── 卡片圖鑑（怪物收集冊）
// 完整重建自 15-cards.js 的 buildCardIndex() 邏輯（掃描 CARD_REGIONS 對應地圖池 × DB.mobs，
// 排除 血盟／建築 標籤），共 409 隻卡片收集對象，非原本手動節錄的 73 隻。
const CARD_DEX_LIST = [
  {
    "n": "藏寶箱",
    "lv": 1
  },
  {
    "n": "妖魔",
    "lv": 2
  },
  {
    "n": "哥布林",
    "lv": 2
  },
  {
    "n": "地靈",
    "lv": 3
  },
  {
    "n": "污染的地精靈",
    "lv": 3
  },
  {
    "n": "妖魔弓箭手",
    "lv": 3
  },
  {
    "n": "狼",
    "lv": 4
  },
  {
    "n": "蘑菇",
    "lv": 4
  },
  {
    "n": "小獵犬",
    "lv": 5
  },
  {
    "n": "老虎",
    "lv": 5
  },
  {
    "n": "侏儒",
    "lv": 5
  },
  {
    "n": "牧羊犬",
    "lv": 5
  },
  {
    "n": "狐狸",
    "lv": 5
  },
  {
    "n": "哈士奇",
    "lv": 5
  },
  {
    "n": "柯利",
    "lv": 5
  },
  {
    "n": "浣熊",
    "lv": 5
  },
  {
    "n": "高麗幼犬",
    "lv": 5
  },
  {
    "n": "袋鼠",
    "lv": 5
  },
  {
    "n": "猴子",
    "lv": 5
  },
  {
    "n": "聖伯納犬",
    "lv": 5
  },
  {
    "n": "熊",
    "lv": 5
  },
  {
    "n": "熊貓",
    "lv": 5
  },
  {
    "n": "暴走兔",
    "lv": 5
  },
  {
    "n": "貓",
    "lv": 5
  },
  {
    "n": "人形殭屍",
    "lv": 6
  },
  {
    "n": "安普長老",
    "lv": 6
  },
  {
    "n": "污染的安特",
    "lv": 6
  },
  {
    "n": "杜賓狗",
    "lv": 6
  },
  {
    "n": "漂浮之眼",
    "lv": 7
  },
  {
    "n": "冰原狼人",
    "lv": 8
  },
  {
    "n": "妖魔鬥士",
    "lv": 8
  },
  {
    "n": "怪手",
    "lv": 8
  },
  {
    "n": "侏儒戰士",
    "lv": 9
  },
  {
    "n": "狼人",
    "lv": 9
  },
  {
    "n": "甘地妖魔",
    "lv": 10
  },
  {
    "n": "冰之女王侍女",
    "lv": 10
  },
  {
    "n": "污染的潘",
    "lv": 10
  },
  {
    "n": "妖魔殭屍",
    "lv": 10
  },
  {
    "n": "骷髏",
    "lv": 10
  },
  {
    "n": "鱷魚",
    "lv": 10
  },
  {
    "n": "巨蟻",
    "lv": 12
  },
  {
    "n": "妖魔法師",
    "lv": 12
  },
  {
    "n": "骷髏弓箭手",
    "lv": 12
  },
  {
    "n": "蟑螂人",
    "lv": 12
  },
  {
    "n": "石頭高崙",
    "lv": 13
  },
  {
    "n": "骷髏斧手",
    "lv": 13
  },
  {
    "n": "骷髏槍兵",
    "lv": 13
  },
  {
    "n": "羅孚妖魔",
    "lv": 13
  },
  {
    "n": "妖魔巡守",
    "lv": 14
  },
  {
    "n": "哈柏哥布林",
    "lv": 14
  },
  {
    "n": "夏洛伯",
    "lv": 14
  },
  {
    "n": "穴居人",
    "lv": 15
  },
  {
    "n": "阿吐巴妖魔",
    "lv": 15
  },
  {
    "n": "都達瑪拉妖魔",
    "lv": 15
  },
  {
    "n": "蜥蜴人",
    "lv": 15
  },
  {
    "n": "歐熊",
    "lv": 15
  },
  {
    "n": "人魚",
    "lv": 16
  },
  {
    "n": "史巴托",
    "lv": 16
  },
  {
    "n": "食屍鬼",
    "lv": 16
  },
  {
    "n": "黑騎士",
    "lv": 16
  },
  {
    "n": "黑騎士搜索隊",
    "lv": 16
  },
  {
    "n": "鯊魚",
    "lv": 16
  },
  {
    "n": "那魯加妖魔",
    "lv": 17
  },
  {
    "n": "萊肯",
    "lv": 17
  },
  {
    "n": "狂野之毒",
    "lv": 18
  },
  {
    "n": "狂野毒牙",
    "lv": 18
  },
  {
    "n": "楊果里恩",
    "lv": 18
  },
  {
    "n": "蟹人",
    "lv": 18
  },
  {
    "n": "歐姆",
    "lv": 19
  },
  {
    "n": "巨大兵蟻",
    "lv": 20
  },
  {
    "n": "狂野之魔",
    "lv": 20
  },
  {
    "n": "狂暴蜥蜴人",
    "lv": 20
  },
  {
    "n": "海星",
    "lv": 20
  },
  {
    "n": "鼠人",
    "lv": 20
  },
  {
    "n": "卡司特",
    "lv": 21
  },
  {
    "n": "狂暴的歐姆",
    "lv": 21
  },
  {
    "n": "長老",
    "lv": 21
  },
  {
    "n": "食人妖精",
    "lv": 22
  },
  {
    "n": "蛇女",
    "lv": 22
  },
  {
    "n": "魔蝙蝠",
    "lv": 22
  },
  {
    "n": "底比斯 曼陀羅草(白)",
    "lv": 23
  },
  {
    "n": "提卡爾艾庫阿茲特",
    "lv": 23
  },
  {
    "n": "歐姆裝甲兵",
    "lv": 23
  },
  {
    "n": "地獄犬",
    "lv": 24
  },
  {
    "n": "希爾黛斯",
    "lv": 24
  },
  {
    "n": "重裝蜥蜴人",
    "lv": 24
  },
  {
    "n": "龍龜",
    "lv": 24
  },
  {
    "n": "藍尾蜥蜴",
    "lv": 24
  },
  {
    "n": "犰狳",
    "lv": 25
  },
  {
    "n": "白螞蟻群",
    "lv": 25
  },
  {
    "n": "狂暴的歐姆裝甲兵",
    "lv": 25
  },
  {
    "n": "奇異鸚鵡",
    "lv": 25
  },
  {
    "n": "海賊骷髏",
    "lv": 25
  },
  {
    "n": "高等蜥蜴人",
    "lv": 25
  },
  {
    "n": "闇之精靈",
    "lv": 25
  },
  {
    "n": "底比斯 曼陀羅草",
    "lv": 26
  },
  {
    "n": "哈維",
    "lv": 26
  },
  {
    "n": "毒蠍",
    "lv": 26
  },
  {
    "n": "提卡爾艾庫阿茲特(黃)",
    "lv": 26
  },
  {
    "n": "黑暗妖精魔法學徒",
    "lv": 26
  },
  {
    "n": "歐姆民兵",
    "lv": 26
  },
  {
    "n": "魔熊",
    "lv": 26
  },
  {
    "n": "黑暗妖精殘兵(弓)",
    "lv": 27
  },
  {
    "n": "黑暗精靈",
    "lv": 27
  },
  {
    "n": "骷髏神射手",
    "lv": 27
  },
  {
    "n": "骷髏警衛",
    "lv": 27
  },
  {
    "n": "巨大白螞蟻",
    "lv": 28
  },
  {
    "n": "伊萊克頓",
    "lv": 28
  },
  {
    "n": "多羅",
    "lv": 28
  },
  {
    "n": "海賊骷髏士兵",
    "lv": 28
  },
  {
    "n": "紙人",
    "lv": 28
  },
  {
    "n": "強盜",
    "lv": 28
  },
  {
    "n": "雪人",
    "lv": 28
  },
  {
    "n": "黑暗妖精盜賊",
    "lv": 28
  },
  {
    "n": "歐吉",
    "lv": 28
  },
  {
    "n": "闇精靈王",
    "lv": 28
  },
  {
    "n": "底比斯 聖甲蟲",
    "lv": 29
  },
  {
    "n": "奎斯坦修",
    "lv": 29
  },
  {
    "n": "提卡爾艾庫尤卡(藍)",
    "lv": 29
  },
  {
    "n": "黑暗妖精殘兵(十字弓)",
    "lv": 29
  },
  {
    "n": "黑暗妖精殘兵(劍)",
    "lv": 29
  },
  {
    "n": "骷髏鬥士",
    "lv": 29
  },
  {
    "n": "爆彈花",
    "lv": 29
  },
  {
    "n": "巨人",
    "lv": 30
  },
  {
    "n": "冰人",
    "lv": 30
  },
  {
    "n": "艾爾摩士兵",
    "lv": 30
  },
  {
    "n": "金屬蜈蚣",
    "lv": 30
  },
  {
    "n": "食人妖精王",
    "lv": 30
  },
  {
    "n": "莫妮亞",
    "lv": 30
  },
  {
    "n": "喚獸師",
    "lv": 30
  },
  {
    "n": "黑暗妖精殘兵(法師)",
    "lv": 30
  },
  {
    "n": "夢幻之島鬼火",
    "lv": 30
  },
  {
    "n": "夢幻之島蘑菇",
    "lv": 30
  },
  {
    "n": "艾爾摩法師",
    "lv": 31
  },
  {
    "n": "格利芬",
    "lv": 31
  },
  {
    "n": "密密",
    "lv": 31
  },
  {
    "n": "強化巨蟻",
    "lv": 31
  },
  {
    "n": "巨大鱷魚",
    "lv": 32
  },
  {
    "n": "冰石高崙",
    "lv": 32
  },
  {
    "n": "底比斯 聖甲蟲(藍)",
    "lv": 32
  },
  {
    "n": "海賊骷髏刀手",
    "lv": 32
  },
  {
    "n": "海賊骷髏首領",
    "lv": 32
  },
  {
    "n": "提卡爾艾庫尤卡(白)",
    "lv": 32
  },
  {
    "n": "黑法師",
    "lv": 32
  },
  {
    "n": "變種蛇女",
    "lv": 32
  },
  {
    "n": "卡司特王",
    "lv": 33
  },
  {
    "n": "巨人長老",
    "lv": 33
  },
  {
    "n": "巨人戰士",
    "lv": 33
  },
  {
    "n": "冰原老虎",
    "lv": 33
  },
  {
    "n": "多眼怪",
    "lv": 33
  },
  {
    "n": "活鎧甲",
    "lv": 33
  },
  {
    "n": "雪怪",
    "lv": 33
  },
  {
    "n": "黑暗妖精殘兵(雙手劍)",
    "lv": 33
  },
  {
    "n": "黑暗棲林者",
    "lv": 33
  },
  {
    "n": "龍蠅",
    "lv": 33
  },
  {
    "n": "變形怪",
    "lv": 33
  },
  {
    "n": "變種楊果里恩",
    "lv": 33
  },
  {
    "n": "亞力安",
    "lv": 34
  },
  {
    "n": "強化白螞蟻群",
    "lv": 34
  },
  {
    "n": "火焰戰士",
    "lv": 35
  },
  {
    "n": "艾爾摩將軍",
    "lv": 35
  },
  {
    "n": "底比斯 凱比斯(黑)",
    "lv": 35
  },
  {
    "n": "阿魯巴",
    "lv": 35
  },
  {
    "n": "強盜頭目",
    "lv": 35
  },
  {
    "n": "提卡爾艾庫卡伊拉(藍)",
    "lv": 35
  },
  {
    "n": "鋼鐵高崙",
    "lv": 35
  },
  {
    "n": "火焰弓箭手",
    "lv": 36
  },
  {
    "n": "邪惡蜥蜴",
    "lv": 36
  },
  {
    "n": "梅杜莎",
    "lv": 36
  },
  {
    "n": "黑暗妖精警衛(十字弓)",
    "lv": 36
  },
  {
    "n": "巨大突擊螞蟻",
    "lv": 37
  },
  {
    "n": "死亡之劍",
    "lv": 37
  },
  {
    "n": "炎魔的思克巴",
    "lv": 37
  },
  {
    "n": "思克巴",
    "lv": 37
  },
  {
    "n": "恐怖的火炎蛋",
    "lv": 37
  },
  {
    "n": "火蜥蜴",
    "lv": 38
  },
  {
    "n": "邪惡密密",
    "lv": 38
  },
  {
    "n": "黑暗妖精士兵",
    "lv": 38
  },
  {
    "n": "黑暗妖精巡守",
    "lv": 38
  },
  {
    "n": "夢幻之島火蜥蜴",
    "lv": 38
  },
  {
    "n": "夢幻之島冰人",
    "lv": 38
  },
  {
    "n": "夢幻之島殺人蜂",
    "lv": 38
  },
  {
    "n": "夢幻之島暴走兔",
    "lv": 38
  },
  {
    "n": "火炎蛋",
    "lv": 39
  },
  {
    "n": "邪惡多眼怪",
    "lv": 39
  },
  {
    "n": "奇美拉",
    "lv": 39
  },
  {
    "n": "底比斯 凱比斯(紅)",
    "lv": 39
  },
  {
    "n": "提卡爾艾庫卡伊拉(黃)",
    "lv": 39
  },
  {
    "n": "殘暴的骷髏斧兵",
    "lv": 39
  },
  {
    "n": "殘暴的骷髏槍兵",
    "lv": 39
  },
  {
    "n": "夢幻之島火炎蛋",
    "lv": 39
  },
  {
    "n": "夢幻之島冰石高崙",
    "lv": 39
  },
  {
    "n": "夢幻之島閃電球",
    "lv": 39
  },
  {
    "n": "夢幻之島鎧甲守衛",
    "lv": 39
  },
  {
    "n": "水之牙",
    "lv": 40
  },
  {
    "n": "火之牙",
    "lv": 40
  },
  {
    "n": "巨大強化白螞蟻",
    "lv": 40
  },
  {
    "n": "地之牙",
    "lv": 40
  },
  {
    "n": "地獄束縛犬",
    "lv": 40
  },
  {
    "n": "拉斯塔巴德守門人",
    "lv": 40
  },
  {
    "n": "風之牙",
    "lv": 40
  },
  {
    "n": "恐怖夢魘",
    "lv": 40
  },
  {
    "n": "黑虎",
    "lv": 40
  },
  {
    "n": "黑暗妖精法師",
    "lv": 40
  },
  {
    "n": "黑暗妖精警衛(矛)",
    "lv": 40
  },
  {
    "n": "馴獸師",
    "lv": 40
  },
  {
    "n": "夢幻之島大鬼火",
    "lv": 40
  },
  {
    "n": "夢魘",
    "lv": 40
  },
  {
    "n": "獨眼巨人",
    "lv": 40
  },
  {
    "n": "魔狼",
    "lv": 40
  },
  {
    "n": "底比斯 尖碑石奴",
    "lv": 41
  },
  {
    "n": "炎魔的思克巴女皇",
    "lv": 41
  },
  {
    "n": "思克巴女皇",
    "lv": 41
  },
  {
    "n": "提卡爾艾庫巴拉",
    "lv": 41
  },
  {
    "n": "魂騎士",
    "lv": 41
  },
  {
    "n": "影魔",
    "lv": 41
  },
  {
    "n": "水元素守護者",
    "lv": 42
  },
  {
    "n": "火元素守護者",
    "lv": 42
  },
  {
    "n": "地元素守護者",
    "lv": 42
  },
  {
    "n": "西瑪",
    "lv": 42
  },
  {
    "n": "巫師",
    "lv": 42
  },
  {
    "n": "受詛咒的妖魔殭屍",
    "lv": 42
  },
  {
    "n": "拉斯塔巴德馴獸師",
    "lv": 42
  },
  {
    "n": "風元素守護者",
    "lv": 42
  },
  {
    "n": "鬼魂",
    "lv": 42
  },
  {
    "n": "殘暴的史巴托",
    "lv": 42
  },
  {
    "n": "殘暴的食屍鬼",
    "lv": 42
  },
  {
    "n": "德雷克",
    "lv": 42
  },
  {
    "n": "巴土瑟",
    "lv": 43
  },
  {
    "n": "地獄奴隸",
    "lv": 43
  },
  {
    "n": "受詛咒的馴獸師",
    "lv": 43
  },
  {
    "n": "紅鬼魂",
    "lv": 43
  },
  {
    "n": "恐怖的地獄犬",
    "lv": 43
  },
  {
    "n": "黑暗妖精將軍",
    "lv": 43
  },
  {
    "n": "夢幻之島水精靈王",
    "lv": 43
  },
  {
    "n": "夢幻之島火精靈王",
    "lv": 43
  },
  {
    "n": "夢幻之島地精靈王",
    "lv": 43
  },
  {
    "n": "夢幻之島風精靈王",
    "lv": 43
  },
  {
    "n": "熔岩高崙",
    "lv": 43
  },
  {
    "n": "獨角獸",
    "lv": 43
  },
  {
    "n": "小惡魔",
    "lv": 44
  },
  {
    "n": "火焰之魔法師",
    "lv": 44
  },
  {
    "n": "卡士柏",
    "lv": 44
  },
  {
    "n": "巨大守護螞蟻",
    "lv": 44
  },
  {
    "n": "底比斯 尖碑石奴(黑)",
    "lv": 44
  },
  {
    "n": "炎魔的小惡魔",
    "lv": 44
  },
  {
    "n": "恐怖的鋼鐵高崙",
    "lv": 44
  },
  {
    "n": "提卡爾艾庫巴拉(紅)",
    "lv": 44
  },
  {
    "n": "暗黑萊肯",
    "lv": 44
  },
  {
    "n": "水靈之主",
    "lv": 45
  },
  {
    "n": "火焰之靈魂(紅)",
    "lv": 45
  },
  {
    "n": "火靈之主",
    "lv": 45
  },
  {
    "n": "幼龍",
    "lv": 45
  },
  {
    "n": "伊弗利特",
    "lv": 45
  },
  {
    "n": "地靈之主",
    "lv": 45
  },
  {
    "n": "死神",
    "lv": 45
  },
  {
    "n": "受詛咒的艾爾摩法師",
    "lv": 45
  },
  {
    "n": "阿西塔基奧",
    "lv": 45
  },
  {
    "n": "風靈之主",
    "lv": 45
  },
  {
    "n": "馬庫爾",
    "lv": 45
  },
  {
    "n": "深淵弓箭手",
    "lv": 45
  },
  {
    "n": "深淵食屍鬼",
    "lv": 45
  },
  {
    "n": "殘暴的骷髏神射手",
    "lv": 45
  },
  {
    "n": "殘暴的骷髏鬥士",
    "lv": 45
  },
  {
    "n": "黑暗復仇者",
    "lv": 45
  },
  {
    "n": "黑暗精靈使",
    "lv": 45
  },
  {
    "n": "暗黑黑騎士",
    "lv": 45
  },
  {
    "n": "墳墓守護者",
    "lv": 45
  },
  {
    "n": "歐姆戰士",
    "lv": 45
  },
  {
    "n": "火焰之靈魂(藍)",
    "lv": 46
  },
  {
    "n": "火焰烈炎獸",
    "lv": 46
  },
  {
    "n": "血色術士",
    "lv": 46
  },
  {
    "n": "恐怖的伊弗利特",
    "lv": 46
  },
  {
    "n": "血騎士",
    "lv": 47
  },
  {
    "n": "受詛咒的艾爾摩士兵",
    "lv": 47
  },
  {
    "n": "底比斯 斯芬克斯",
    "lv": 47
  },
  {
    "n": "骨龍",
    "lv": 47
  },
  {
    "n": "提卡爾艾庫艾托",
    "lv": 47
  },
  {
    "n": "闇黑君王",
    "lv": 47
  },
  {
    "n": "冷酷冰原老虎",
    "lv": 48
  },
  {
    "n": "拉斯塔巴德近衛隊",
    "lv": 48
  },
  {
    "n": "重裝歐姆戰士",
    "lv": 48
  },
  {
    "n": "飛龍",
    "lv": 48
  },
  {
    "n": "烈炎獸",
    "lv": 48
  },
  {
    "n": "暗黑火焰弓箭手",
    "lv": 48
  },
  {
    "n": "墳墓守護者法師",
    "lv": 48
  },
  {
    "n": "西斯",
    "lv": 50
  },
  {
    "n": "受詛咒的艾爾摩將軍",
    "lv": 50
  },
  {
    "n": "底比斯 尼荷斯",
    "lv": 50
  },
  {
    "n": "底比斯 斯芬克斯(黑)",
    "lv": 50
  },
  {
    "n": "曼波兔",
    "lv": 50
  },
  {
    "n": "提卡爾艾庫艾托(枯竭)",
    "lv": 50
  },
  {
    "n": "提卡爾薩德泥偶",
    "lv": 50
  },
  {
    "n": "象牙塔石頭高崙",
    "lv": 50
  },
  {
    "n": "象牙塔紙人",
    "lv": 50
  },
  {
    "n": "象牙塔密密",
    "lv": 50
  },
  {
    "n": "黑長者",
    "lv": 50
  },
  {
    "n": "暗黑火焰戰士",
    "lv": 50
  },
  {
    "n": "墳墓守護者騎士",
    "lv": 50
  },
  {
    "n": "火焰阿西塔基奧",
    "lv": 51
  },
  {
    "n": "卡魯塔",
    "lv": 51
  },
  {
    "n": "炎魔的巴風特",
    "lv": 51
  },
  {
    "n": "長老隨從",
    "lv": 51
  },
  {
    "n": "象牙塔鋼鐵高崙",
    "lv": 51
  },
  {
    "n": "墮落的司祭(一階)",
    "lv": 51
  },
  {
    "n": "墮落的司祭(二階)",
    "lv": 51
  },
  {
    "n": "死亡的司祭(思克巴)",
    "lv": 52
  },
  {
    "n": "底比斯 尼荷斯(藍)",
    "lv": 52
  },
  {
    "n": "混沌的司祭(飛翼)",
    "lv": 52
  },
  {
    "n": "提卡爾薩德泥偶(黑)",
    "lv": 52
  },
  {
    "n": "象牙塔果凍怪",
    "lv": 52
  },
  {
    "n": "炎魔的巴列斯",
    "lv": 53
  },
  {
    "n": "象牙塔活鎧甲",
    "lv": 53
  },
  {
    "n": "傲慢的潔尼斯女王",
    "lv": 53
  },
  {
    "n": "暗黑思克巴女皇",
    "lv": 53
  },
  {
    "n": "墮落的司祭(三階)",
    "lv": 53
  },
  {
    "n": "小幻象眼魔",
    "lv": 54
  },
  {
    "n": "底比斯 阿努斯",
    "lv": 54
  },
  {
    "n": "拉斯塔巴德近衛隊隊長",
    "lv": 54
  },
  {
    "n": "提卡爾薩德司卡(紫)",
    "lv": 54
  },
  {
    "n": "墮落的司祭(四階)",
    "lv": 54
  },
  {
    "n": "死亡的司祭(巴風特)",
    "lv": 55
  },
  {
    "n": "艾莉絲",
    "lv": 55
  },
  {
    "n": "恐怖的殭屍王",
    "lv": 55
  },
  {
    "n": "深淵水靈",
    "lv": 55
  },
  {
    "n": "深淵火靈",
    "lv": 55
  },
  {
    "n": "深淵地靈",
    "lv": 55
  },
  {
    "n": "深淵風靈",
    "lv": 55
  },
  {
    "n": "混沌的司祭(野獸)",
    "lv": 55
  },
  {
    "n": "象牙塔死亡之劍",
    "lv": 55
  },
  {
    "n": "象牙塔奇美拉",
    "lv": 55
  },
  {
    "n": "象牙塔長者",
    "lv": 55
  },
  {
    "n": "象牙塔閃電球",
    "lv": 55
  },
  {
    "n": "巨大墳墓守護者",
    "lv": 56
  },
  {
    "n": "底比斯 阿努斯(黑)",
    "lv": 56
  },
  {
    "n": "馬昆斯吸血鬼",
    "lv": 56
  },
  {
    "n": "提卡爾薩德司卡(紅)",
    "lv": 56
  },
  {
    "n": "象牙塔蛇女",
    "lv": 56
  },
  {
    "n": "墮落的司祭(五階)",
    "lv": 56
  },
  {
    "n": "炎魔的分身",
    "lv": 57
  },
  {
    "n": "象牙塔黑長者",
    "lv": 57
  },
  {
    "n": "木乃伊王",
    "lv": 58
  },
  {
    "n": "底比斯 巴斯",
    "lv": 58
  },
  {
    "n": "提卡爾薩德提歐(藍)",
    "lv": 58
  },
  {
    "n": "象牙塔死神",
    "lv": 58
  },
  {
    "n": "象牙塔黑魔法師",
    "lv": 58
  },
  {
    "n": "象牙塔影魔",
    "lv": 58
  },
  {
    "n": "象牙塔炎魔的奴隸",
    "lv": 59
  },
  {
    "n": "象牙塔惡靈",
    "lv": 59
  },
  {
    "n": "土精靈王",
    "lv": 60
  },
  {
    "n": "不幸的幻象眼魔",
    "lv": 60
  },
  {
    "n": "水精靈王",
    "lv": 60
  },
  {
    "n": "火精靈王",
    "lv": 60
  },
  {
    "n": "扭曲的潔尼斯女王",
    "lv": 60
  },
  {
    "n": "底比斯 巴斯(紅)",
    "lv": 60
  },
  {
    "n": "哈汀之影",
    "lv": 60
  },
  {
    "n": "風精靈王",
    "lv": 60
  },
  {
    "n": "恐怖的吸血鬼",
    "lv": 60
  },
  {
    "n": "提卡爾薩德提歐(黃)",
    "lv": 60
  },
  {
    "n": "象牙塔小惡魔",
    "lv": 60
  },
  {
    "n": "象牙塔巴列斯之影",
    "lv": 60
  },
  {
    "n": "騎士范德",
    "lv": 60
  },
  {
    "n": "巴風特",
    "lv": 61
  },
  {
    "n": "炎魔的惡魔",
    "lv": 61
  },
  {
    "n": "象牙塔翼魔",
    "lv": 61
  },
  {
    "n": "暗殺軍王史雷佛",
    "lv": 61
  },
  {
    "n": "死亡的殭屍王",
    "lv": 62
  },
  {
    "n": "象牙塔巴風特之影",
    "lv": 62
  },
  {
    "n": "象牙塔炎魔之影",
    "lv": 63
  },
  {
    "n": "象牙塔惡魔之影",
    "lv": 63
  },
  {
    "n": "魔獸軍王巴蘭卡",
    "lv": 63
  },
  {
    "n": "不死的木乃伊王",
    "lv": 65
  },
  {
    "n": "火焰之影親衛隊(巴風特)",
    "lv": 65
  },
  {
    "n": "地獄的黑豹",
    "lv": 65
  },
  {
    "n": "克特",
    "lv": 65
  },
  {
    "n": "冷酷的艾莉絲",
    "lv": 65
  },
  {
    "n": "法令軍王蕾雅",
    "lv": 65
  },
  {
    "n": "深淵之主",
    "lv": 65
  },
  {
    "n": "變形怪首領",
    "lv": 65
  },
  {
    "n": "墮落",
    "lv": 68
  },
  {
    "n": "不死鳥",
    "lv": 69
  },
  {
    "n": "巴列斯",
    "lv": 70
  },
  {
    "n": "古代巨人",
    "lv": 70
  },
  {
    "n": "巨蟻女皇",
    "lv": 70
  },
  {
    "n": "冰魔",
    "lv": 70
  },
  {
    "n": "死亡",
    "lv": 70
  },
  {
    "n": "底比斯 阿努比斯",
    "lv": 70
  },
  {
    "n": "底比斯 賀洛斯",
    "lv": 70
  },
  {
    "n": "冥法軍王海露拜",
    "lv": 70
  },
  {
    "n": "混沌",
    "lv": 70
  },
  {
    "n": "惡魔",
    "lv": 70
  },
  {
    "n": "提卡爾杰弗雷庫(雄)",
    "lv": 70
  },
  {
    "n": "提卡爾杰弗雷庫(雌)",
    "lv": 70
  },
  {
    "n": "冰之女王",
    "lv": 75
  },
  {
    "n": "死亡騎士",
    "lv": 75
  },
  {
    "n": "闇黑的騎士范德",
    "lv": 75
  },
  {
    "n": "長老．琪娜",
    "lv": 78
  },
  {
    "n": "不滅的巫妖",
    "lv": 80
  },
  {
    "n": "邪惡的鐮刀死神",
    "lv": 80
  },
  {
    "n": "長老．艾迪爾",
    "lv": 80
  },
  {
    "n": "長老．巴塔斯",
    "lv": 85
  },
  {
    "n": "長老．巴洛斯",
    "lv": 88
  },
  {
    "n": "長老．泰瑪斯",
    "lv": 90
  },
  {
    "n": "長老．安迪斯",
    "lv": 91
  },
  {
    "n": "安塔瑞斯",
    "lv": 93
  },
  {
    "n": "法利昂",
    "lv": 93
  },
  {
    "n": "長老．拉曼斯",
    "lv": 93
  },
  {
    "n": "巴拉卡斯",
    "lv": 95
  },
  {
    "n": "長老．巴陸德",
    "lv": 96
  },
  {
    "n": "遺忘之島蜥蜴人",
    "lv": 20
  },
  {
    "n": "遺忘之島鱷魚",
    "lv": 20
  },
  {
    "n": "遺忘之島夏洛伯",
    "lv": 34
  },
  {
    "n": "遺忘之島狼人",
    "lv": 34
  },
  {
    "n": "遺忘之島黑暗精靈",
    "lv": 35
  },
  {
    "n": "遺忘之島歐熊",
    "lv": 35
  },
  {
    "n": "遺忘之島卡司特",
    "lv": 36
  },
  {
    "n": "遺忘之島巨斧牛人",
    "lv": 37
  },
  {
    "n": "遺忘之島食人妖精",
    "lv": 37
  },
  {
    "n": "遺忘之島蛇女",
    "lv": 37
  },
  {
    "n": "遺忘之島萊肯",
    "lv": 37
  },
  {
    "n": "遺忘之島楊果里恩",
    "lv": 38
  },
  {
    "n": "遺忘之島哈維",
    "lv": 41
  },
  {
    "n": "遺忘之島格利芬",
    "lv": 41
  },
  {
    "n": "遺忘之島鏈鎚牛人",
    "lv": 41
  },
  {
    "n": "遺忘之島卡司特王",
    "lv": 42
  },
  {
    "n": "遺忘之島巨大鱷魚",
    "lv": 42
  },
  {
    "n": "遺忘之島變形怪",
    "lv": 42
  },
  {
    "n": "遺忘之島多羅",
    "lv": 43
  },
  {
    "n": "遺忘之島阿魯巴",
    "lv": 45
  },
  {
    "n": "遺忘之島食人妖精王",
    "lv": 45
  },
  {
    "n": "受詛咒的黑暗妖精鬥士",
    "lv": 46
  },
  {
    "n": "遺忘之島亞力安",
    "lv": 47
  },
  {
    "n": "地獄奴隸",
    "lv": 48
  },
  {
    "n": "受詛咒的黑暗妖精法師",
    "lv": 48
  },
  {
    "n": "遺忘之島邪惡蜥蜴",
    "lv": 48
  },
  {
    "n": "牛鬼之子",
    "lv": 50
  },
  {
    "n": "受詛咒的黑暗妖精騎士",
    "lv": 50
  },
  {
    "n": "食腐獸",
    "lv": 50
  },
  {
    "n": "遺忘之島獨眼巨人",
    "lv": 50
  },
  {
    "n": "特提斯",
    "lv": 52
  },
  {
    "n": "遺忘之島巨大牛人",
    "lv": 53
  },
  {
    "n": "遺忘之島飛龍",
    "lv": 53
  },
  {
    "n": "翼龍",
    "lv": 54
  },
  {
    "n": "嗚釜",
    "lv": 65
  },
  {
    "n": "鎌鼬",
    "lv": 65
  },
  {
    "n": "唐傘小僧",
    "lv": 68
  },
  {
    "n": "轆轤首",
    "lv": 68
  },
  {
    "n": "赤鬼",
    "lv": 70
  },
  {
    "n": "河童",
    "lv": 70
  },
  {
    "n": "青鬼",
    "lv": 70
  },
  {
    "n": "憤怒的嗚釜",
    "lv": 70
  },
  {
    "n": "鎌鼬長兄",
    "lv": 70
  },
  {
    "n": "天狗",
    "lv": 72
  },
  {
    "n": "阿修羅像",
    "lv": 72
  },
  {
    "n": "鵺",
    "lv": 72
  },
  {
    "n": "白面金毛九尾狐・玉藻",
    "lv": 75
  },
  {
    "n": "牛鬼",
    "lv": 90
  },
  {
    "n": "巨大骷髏",
    "lv": 99
  },
  {
    "n": "吉爾塔斯",
    "lv": 99
  },
  {
    "n": "真‧死亡騎士 冥皇丹特斯",
    "lv": 99
  },
  {
    "n": "喀瑪南",
    "lv": 53
  },
  {
    "n": "喀瑪焰",
    "lv": 53
  },
  {
    "n": "大地荒龍",
    "lv": 62
  },
  {
    "n": "喀瑪南王",
    "lv": 62
  },
  {
    "n": "喀瑪焰王",
    "lv": 62
  },
  {
    "n": "喀瑪王",
    "lv": 70
  },
  {
    "n": "白面金毛九尾狐・九尾",
    "lv": 75
  },
  {
    "n": "白面金毛九尾狐・殺生石",
    "lv": 80
  },
  {
    "n": "被侵蝕的安塔瑞斯",
    "lv": 85
  },
  {
    "n": "林德拜爾",
    "lv": 90
  }
];;;;;

function _cardTierInfo(score){
  score = score || 0;
  if(score >= 100) return {label:'金卡（已開通）', cls:'tier-gold'};
  if(score >= 10)  return {label:'銀卡', cls:'tier-silver'};
  if(score >= 1)   return {label:'普卡', cls:'tier-bronze'};
  return {label:'未收集', cls:''};
}

function renderDexCard(){
  const grid = document.getElementById('dexCardGrid');
  const cnt  = document.getElementById('dexCardCount');
  if(!grid) return;
  const q     = (document.getElementById('dexCardSearch')?.value||'').toLowerCase();
  const owned = G.p.cardDex || {};
  const items = CARD_DEX_LIST.filter(m=>!q||m.n.toLowerCase().includes(q));

  const ownedNames = Object.keys(owned).filter(n=>owned[n]>0);
  const goldCnt   = ownedNames.filter(n=>owned[n]>=100).length;
  const silverCnt = ownedNames.filter(n=>owned[n]>=10 && owned[n]<100).length;
  const bronzeCnt = ownedNames.filter(n=>owned[n]>=1  && owned[n]<10).length;
  if(cnt) cnt.textContent =
    `已收錄 ${ownedNames.length} / ${CARD_DEX_LIST.length}　（金 ${goldCnt}／銀 ${silverCnt}／普 ${bronzeCnt}）`;

  grid.innerHTML = items.map(m=>{
    const score = owned[m.n] || 0;
    const tier  = _cardTierInfo(score);
    const safeName = m.n.replace(/'/g,"\\'");
    return `
    <div class="dex-item ${score>0?'owned':''} ${tier.cls}">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${m.n}">
          ${m.n}
        </div>
        <div style="font-size:10px;color:var(--text3)">Lv.${m.lv}　${tier.label}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end;flex-shrink:0">
        <input type="number" class="dex-card-score" min="0" max="100"
               value="${score||''}" placeholder="0"
               onchange="setDexCardScore('${safeName}', this.value)">
        <div style="display:flex;gap:2px">
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',1)">普</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',10)">銀</button>
          <button class="dex-mini-btn" onclick="setDexCardScore('${safeName}',100)">金</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function setDexCardScore(name, val){
  if(!G.p.cardDex) G.p.cardDex={};
  let n = Math.max(0, Math.min(100, parseInt(val)||0));
  if(n > 0) G.p.cardDex[name] = n;
  else delete G.p.cardDex[name];
  renderDexCard();
}

// ── 道具圖鑑（miscDex）── 分類邏輯比照 18-misc-book.js 的 miscCatKey()
const MISC_CATEGORIES = [
  {
    "key": "pot",
    "name": "藥水"
  },
  {
    "key": "scroll",
    "name": "卷軸"
  },
  {
    "key": "skillbk",
    "name": "技能書"
  },
  {
    "key": "mat",
    "name": "材料"
  },
  {
    "key": "special",
    "name": "其他"
  }
];;
const MISC_BOOK_EXCLUDED = {
  new_item_bless_wpn: true, new_item_bless_arm: true, new_item_bless_acc: true,
};
function miscCatKey(id, d){
  if(!d) return null;
  if(MISC_BOOK_EXCLUDED[id]) return null;
  const t = d.type;
  if(t === 'wpn' || t === 'arm' || t === 'acc') return null;
  if(id === 'item_card_book' || id === 'item_equip_book') return null;
  if(d.eff === 'card' || id.indexOf('card_') === 0) return null;
  if(t === 'pot' || id.indexOf('potion_') === 0) return 'pot';
  if(t === 'scroll' || id.indexOf('scroll_') === 0 || (d.n && d.n.indexOf('卷軸') >= 0)) return 'scroll';
  if(t === 'skillbk' || id.indexOf('bk_') === 0 || id.indexOf('mem_') === 0) return 'skillbk';
  if(t === 'etc' || id.indexOf('mat_') === 0 || id.indexOf('new_item_') === 0) return 'mat';
  return 'special';
}
const MISC_CAT_ITEMS = {};
const MISC_ITEM_CAT  = {};
let MISC_DEX_ALL_IDS = [];
let _miscIndexBuilt = false;
function _ensureMiscIndex(){
  if(_miscIndexBuilt) return;
  _miscIndexBuilt = true;
  MISC_CATEGORIES.forEach(c => MISC_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    const ck = miscCatKey(id, d);
    if(!ck || !MISC_CAT_ITEMS[ck]) return;
    MISC_CAT_ITEMS[ck].push(id);
    MISC_ITEM_CAT[id] = ck;
  });
  Object.keys(MISC_CAT_ITEMS).forEach(k => {
    MISC_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
  MISC_DEX_ALL_IDS = Object.keys(MISC_ITEM_CAT);
}

function renderDexMisc(){
  _ensureMiscIndex();
  const grid = document.getElementById('dexMiscGrid');
  const cnt  = document.getElementById('dexMiscCount');
  if(!grid) return;
  const q   = (document.getElementById('dexMiscSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('dexMiscCatSel')?.value || '';
  const owned = G.p.miscDex || {};

  let ids = cat ? (MISC_CAT_ITEMS[cat] || []) : MISC_DEX_ALL_IDS;
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = MISC_DEX_ALL_IDS.length;
  const ownedAll = MISC_DEX_ALL_IDS.filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已收錄 ${ownedAll} / ${totalAll}`;

  const CAT_LABEL = {}; MISC_CATEGORIES.forEach(c => CAT_LABEL[c.key] = c.name);

  grid.innerHTML = ids.map(id => {
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexMisc('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_LABEL[MISC_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexMisc(id){
  if(!G.p.miscDex) G.p.miscDex = {};
  if(G.p.miscDex[id]) delete G.p.miscDex[id];
  else G.p.miscDex[id] = true;
  renderDexMisc();
}

// ── 遺物圖鑑（relicDex）── 來源：ITEM_DB 中 relic:true 的物品，分類沿用裝備圖鑑的 EQUIP_CATEGORIES/equipCatKey（21-relic-book.js）
function isRelicItem(d){ return !!(d && d.relic); }
const RELIC_CAT_ITEMS = {};
const RELIC_ITEM_CAT  = {};
let _relicIndexBuilt = false;
function _ensureRelicIndex(){
  if(_relicIndexBuilt) return;
  _relicIndexBuilt = true;
  EQUIP_CATEGORIES.forEach(c => RELIC_CAT_ITEMS[c.key] = []);
  Object.keys(ITEM_DB).forEach(id => {
    const d = ITEM_DB[id];
    if(!isRelicItem(d)) return;
    if(d.type !== 'wpn' && d.type !== 'arm' && d.type !== 'acc') return;
    const ck = equipCatKey(id, d);
    if(!ck || !RELIC_CAT_ITEMS[ck]) return;
    RELIC_CAT_ITEMS[ck].push(id);
    RELIC_ITEM_CAT[id] = ck;
  });
  Object.keys(RELIC_CAT_ITEMS).forEach(k => {
    RELIC_CAT_ITEMS[k].sort((a,b) =>
      ((ITEM_DB[a].p||0) - (ITEM_DB[b].p||0)) ||
      (ITEM_DB[a].n||'').localeCompare(ITEM_DB[b].n||'', 'zh-Hant'));
  });
}

function renderDexRelic(){
  _ensureRelicIndex();
  const grid = document.getElementById('dexRelicGrid');
  const cnt  = document.getElementById('dexRelicCount');
  if(!grid) return;

  const catSel = document.getElementById('dexRelicCatSel');
  if(catSel && !catSel.dataset.filled){
    catSel.innerHTML = _equipCatOptionsHTML();
    catSel.dataset.filled = '1';
  }

  const q   = (document.getElementById('dexRelicSearch')?.value || '').toLowerCase();
  const cat = catSel?.value || '';
  const owned = G.p.relicDex || {};

  let ids = cat ? (RELIC_CAT_ITEMS[cat]||[]) : Object.keys(RELIC_ITEM_CAT);
  if(q) ids = ids.filter(id => (ITEM_DB[id].n||'').toLowerCase().includes(q) || id.toLowerCase().includes(q));

  const totalAll = Object.keys(RELIC_ITEM_CAT).length;
  const ownedAll = Object.keys(RELIC_ITEM_CAT).filter(id => owned[id]).length;
  if(cnt) cnt.textContent = `已收錄 ${ownedAll} / ${totalAll}`;

  const CAT_NAME = {}; EQUIP_CATEGORIES.forEach(c => CAT_NAME[c.key]=c.name);

  grid.innerHTML = ids.map(id => {
    const v = ITEM_DB[id];
    return `
    <div class="dex-item ${owned[id]?'owned':''}"
         onclick="toggleDexRelic('${id}')">
      <div class="dex-dot"></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:#5ec8e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${v.n||id}
        </div>
        <div style="font-size:10px;color:var(--text3)">${CAT_NAME[RELIC_ITEM_CAT[id]]||''}　${id}</div>
      </div>
    </div>`;
  }).join('');
}

function toggleDexRelic(id){
  if(!G.p.relicDex) G.p.relicDex = {};
  if(G.p.relicDex[id]) delete G.p.relicDex[id];
  else G.p.relicDex[id] = true;
  renderDexRelic();
}



// ════════════════════════════════════════════════
//  設定面板
// ════════════════════════════════════════════════
function loadConfigUI(){
  const c = G.p.config || {};
  setVal('cfg_setPot',       c.setPot        || 'potion_heal');
  setVal('cfg_hpPot',        c.setHpPot      ?? 70);
  setVal('cfg_atkSkill',     c.selAtkSkill   || '');
  setVal('cfg_mpAtk',        c.setMpAtk      ?? 50);
  setVal('cfg_healSkill',    c.selHealSkill  || '');
  setVal('cfg_mpHeal',       c.setMpHeal     ?? 50);
  setVal('cfg_convertSkill', c.selConvertSkill|| '');
  setVal('cfg_hpConvert',    c.setHpConvert  ?? 50);
  setBool('cfg_autoBuyPot',    c.setAutoBuyPot   || false);
  setBool('cfg_setHaste',      c.setHaste        || false);
  setBool('cfg_autoBuyHaste',  c.setAutoBuyHaste || false);
  setBool('cfg_setBrave',      c.setBrave        || false);
  setBool('cfg_setBlue',       c.setBlue         || false);
  setBool('cfg_setCautious',   c.setCautious     || false);
  setBool('cfg_setElfcookie',  c.setElfcookie    || false);
  setBool('cfg_setPoly',       c.setPoly         || false);
  setBool('cfg_setMagicbarrier',c.setMagicbarrier|| false);
  setBool('cfg_setTeleport',   c.setTeleport     || false);
  renderAutoBuffSkillList();
}

function saveConfigToG(){
  G.p.config = {
    setPot:           getStr('cfg_setPot'),
    setHpPot:         getNum('cfg_hpPot', 70),
    setAutoBuyPot:    getBool('cfg_autoBuyPot'),
    selAtkSkill:      getStr('cfg_atkSkill'),
    setMpAtk:         getNum('cfg_mpAtk', 50),
    selHealSkill:     getStr('cfg_healSkill'),
    setMpHeal:        getNum('cfg_mpHeal', 50),
    selConvertSkill:  getStr('cfg_convertSkill'),
    setHpConvert:     getNum('cfg_hpConvert', 50),
    setHaste:         getBool('cfg_setHaste'),
    setAutoBuyHaste:  getBool('cfg_autoBuyHaste'),
    setBrave:         getBool('cfg_setBrave'),
    setBlue:          getBool('cfg_setBlue'),
    setCautious:      getBool('cfg_setCautious'),
    setElfcookie:     getBool('cfg_setElfcookie'),
    setPoly:          getBool('cfg_setPoly'),
    setMagicbarrier:  getBool('cfg_setMagicbarrier'),
    setTeleport:      getBool('cfg_setTeleport'),
    autoBuffSkills:   G.p.config?.autoBuffSkills || {},
  };
}

// ── 自動 Buff 技能列表
function renderAutoBuffSkillList(){
  const container = document.getElementById('autoBuffSkillList');
  if(!container) return;
  const obj = G.p.config?.autoBuffSkills || {};
  container.innerHTML = Object.keys(obj).map(id=>`
    <div style="display:flex;align-items:center;gap:4px;
                background:var(--bg4);border:1px solid var(--border);
                border-radius:4px;padding:3px 8px;font-size:12px">
      <span style="color:var(--accent2)">${SKILL_MAP[id]||id}</span>
      <span style="color:var(--text3);font-size:10px">${id}</span>
      <button class="btn btn-danger btn-sm" style="padding:1px 5px;font-size:11px"
              onclick="removeAutoBuffSkill('${id}')">✕</button>
    </div>`).join('');
}

function addAutoBuffSkill(){
  const id = document.getElementById('autoBuffSkillInput')?.value.trim();
  if(!id){ toast('請輸入技能 ID','err'); return; }
  if(!G.p.config) G.p.config={};
  if(!G.p.config.autoBuffSkills) G.p.config.autoBuffSkills={};
  G.p.config.autoBuffSkills[id] = true;
  document.getElementById('autoBuffSkillInput').value='';
  renderAutoBuffSkillList();
  toast('已新增自動 Buff：'+(SKILL_MAP[id]||id),'ok');
}

function removeAutoBuffSkill(id){
  if(G.p.config?.autoBuffSkills) delete G.p.config.autoBuffSkills[id];
  renderAutoBuffSkillList();
}

function clearAutoBuffSkills(){
  if(G.p.config) G.p.config.autoBuffSkills={};
  renderAutoBuffSkillList();
  toast('已清空自動 Buff 技能','info');
}
