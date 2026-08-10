



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
