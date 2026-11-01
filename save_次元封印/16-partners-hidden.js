
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