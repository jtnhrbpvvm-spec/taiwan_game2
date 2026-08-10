

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