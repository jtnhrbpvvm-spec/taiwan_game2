/* 設定頁：螢幕模式、全螢幕、登出、更新選單、吃藥選單、renderSystem()、戰鬥策略選擇器、存檔匯出匯入、重置
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
function setScreenMode(mode){document.body.classList.remove('screen-auto','screen-portrait','screen-pc');document.body.classList.add('screen-'+mode);G.setting.screenMode=mode;save(true);toast(mode==='portrait'?'已切換 9:16 手機全螢幕':mode==='pc'?'已切換 PC 16:9 全螢幕':'已切換自動尺寸');renderAll()}
function toggleFullscreen(){if(!document.fullscreenElement){document.documentElement.requestFullscreen?.().then(()=>toast('已進入全螢幕')).catch(()=>toast('瀏覽器未允許全螢幕'))}else{document.exitFullscreen?.().then(()=>toast('已退出全螢幕')).catch(()=>{})}}
function applyScreenMode(){const m=G.setting.screenMode||'auto';document.body.classList.remove('screen-auto','screen-portrait','screen-pc');document.body.classList.add('screen-'+m)}
function logoutGame(){save(true);sessionStorage.setItem('txws_logout','1');location.reload()}
function openUpdateMenu(){$('updateModal')?.classList.add('show')}
function closeUpdateMenu(){$('updateModal')?.classList.remove('show')}
function openPotionMenu(){renderPotionMenu();$('potionModal')?.classList.add('show')}
function closePotionMenu(){$('potionModal')?.classList.remove('show')}
function renderPotionMenu(){const body=$('potionBody');if(!body)return;const a=G.auto;const heals=healSkillList();const hpOptions=Object.entries(POTION_DEF).filter(([,d])=>d.type==='hp');const mpOptions=Object.entries(POTION_DEF).filter(([,d])=>d.type==='mp');
 body.innerHTML=`<div class="card settings"><h3 class="title">自動吃藥</h3><div class="field"><span>HP 藥品種類</span><select onchange="setAuto('hpPotionKey',this.value)">${hpOptions.map(([k,d])=>`<option value="${k}" ${a.hpPotionKey===k?'selected':''}>${d.name} ×${potionCount(k)}</option>`).join('')}</select></div><div class="field"><span>啟用HP自動吃藥</span><input type="checkbox" ${a.autoUsePotion?'checked':''} onchange="setAuto('autoUsePotion',this.checked)"></div><div class="field"><span>HP 低於</span><input type="number" value="${Math.round(a.potionHpPct*100)}" min="10" max="95" onchange="setAuto('potionHpPct',this.value/100)"><b>%</b></div><div class="field"><span>MP 藥品種類</span><select onchange="setAuto('mpPotionKey',this.value)">${mpOptions.map(([k,d])=>`<option value="${k}" ${a.mpPotionKey===k?'selected':''}>${d.name} ×${potionCount(k)}</option>`).join('')}</select></div><div class="field"><span>啟用MP自動吃藥</span><input type="checkbox" ${a.autoUseMpPotion?'checked':''} onchange="setAuto('autoUseMpPotion',this.checked)"></div><div class="field"><span>MP 低於</span><input type="number" value="${Math.round(a.mpPotionPct*100)}" min="10" max="95" onchange="setAuto('mpPotionPct',this.value/100)"><b>%</b></div><div class="field"><span>藥品不足自動購買100罐</span><input type="checkbox" ${a.autoBuyPotion?'checked':''} onchange="setAuto('autoBuyPotion',this.checked)"></div><p class="footer-note">吃藥優先使用背包中既有的所選藥品；藥品數量為0時，若已啟用自動購買，將自動花費靈石一次購買100罐再服用；HP、MP吃藥各自獨立設有2秒冷卻時間。</p></div><div class="card settings"><h3 class="title">自動施法治癒魔法</h3><div class="field"><span>啟用自動施放治癒魔法</span><input type="checkbox" ${a.autoCastHeal?'checked':''} onchange="setAuto('autoCastHeal',this.checked)"></div><div class="field"><span>治癒技能</span><select onchange="setAuto('healSkillId',this.value)"><option value="">無</option>${heals.map(sk=>`<option value="${sk.id}" ${a.healSkillId===sk.id?'selected':''}>${sk.name}（回${Math.round(sk.heal*100)}% · MP${sk.mp||0} · CD${sk.cd||3}秒）</option>`).join('')}</select></div><div class="field"><span>HP 低於</span><input type="number" value="${Math.round(a.healHpPct*100)}" min="10" max="95" onchange="setAuto('healHpPct',this.value/100)"><b>%</b></div><p class="footer-note">${heals.length?'治癒魔法與吃藥各自依HP%／MP%門檻獨立判斷，可能同時觸發。使用治癒魔法需消耗對應MP並依技能自身冷卻時間限制，MP不足或冷卻中不會施放。':'尚未學會任何治癒類神通，請先於「神通」頁面學習如：甘霖、春風、蘇生、療傷等回復類招式。'}</p></div>`}
function renderSystem(){const a=G.auto;const mode=G.setting.screenMode||'auto';return `<div class="card settings"><h2 class="title">智能掛機</h2><div class="field"><span>自動戰鬥</span><input type="checkbox" ${a.enabled?'checked':''} onchange="setAuto('enabled',this.checked)"></div><div class="field"><span>自動選招</span><input type="checkbox" ${a.autoSkill?'checked':''} onchange="setAuto('autoSkill',this.checked)"></div><div class="field"><span>吃藥／治癒設定</span><button class="smallbtn hot" onclick="openPotionMenu()">開啟設定</button></div><div class="field"><span>自動推圖</span><input type="checkbox" ${a.autoAdvance?'checked':''} onchange="setAuto('autoAdvance',this.checked)"></div><div class="field"><span>自動副本</span><input type="checkbox" ${a.autoDungeon?'checked':''} onchange="setAuto('autoDungeon',this.checked)"></div><div class="field"><span>自動追 Boss</span><input type="checkbox" ${a.autoBoss?'checked':''} onchange="setAuto('autoBoss',this.checked)"></div><div class="field"><span>Boss 戰力門檻</span><input type="checkbox" ${a.bossGate?'checked':''} onchange="setAuto('bossGate',this.checked)"></div><div class="field"><span>技能五行偏好</span><select onchange="setAuto('elementPref',this.value)"><option value="auto" ${a.elementPref==='auto'?'selected':''}>AI 依敵人克制</option>${['metal','wood','water','fire','earth'].map(k=>`<option value="${k}" ${a.elementPref===k?'selected':''}>${FIVE[k].name}</option>`).join('')}</select></div></div><div class="card settings"><h2 class="title">畫面設定</h2><p class="desc">依裝置切換顯示比例；全螢幕可配合瀏覽器使用。</p><div class="row" style="margin-top:8px"><button class="smallbtn ${mode==='portrait'?'hot':''}" onclick="setScreenMode('portrait')">📱 手機 9:16</button><button class="smallbtn ${mode==='pc'?'hot':''}" onclick="setScreenMode('pc')">🖥️ PC 16:9</button><button class="smallbtn ${mode==='auto'?'hot':''}" onclick="setScreenMode('auto')">自動尺寸</button><button class="smallbtn" onclick="toggleFullscreen()">⛶ 全螢幕</button></div><p class="footer-note">目前：${mode==='portrait'?'手機 9:16':mode==='pc'?'PC 16:9':'自動尺寸'}</p></div><div class="card settings"><h2 class="title">角色／存檔</h2><div class="field"><span>道號</span><input id="nameInput" value="${G.name||'少俠'}" style="max-width:150px;background:#091317;color:#ddd;border:1px solid #59666a;border-radius:6px;padding:5px"></div><div class="row" style="margin-top:9px"><button class="smallbtn hot" onclick="openUpdateMenu()">更新選單</button><button class="smallbtn" onclick="save()">儲存</button><button class="smallbtn" onclick="exportSave()">匯出</button><button class="smallbtn" onclick="importSave()">匯入</button><button class="smallbtn danger" onclick="resetGame()">重置</button></div><div class="row" style="margin-top:7px"><button class="smallbtn hot" onclick="openWarehouseWindow()">共用倉庫</button><button class="smallbtn" onclick="logoutGame()">返回角色選擇</button></div><p class="footer-note">V1.0.7 · 四門派創角 · 4槽自由連招 · 10部位裝備 · 3.0掉落 · 六大3.0資料副本 · 靈寵 · 天賦 · 自動戰鬥 · 離線收益</p></div>`}
const STRATEGY_GLYPHS={conservative:'守',balanced:'衡',aggressive:'劍',burst:'煞'};
function strategyGlyph(id){return STRATEGY_GLYPHS[id]||STRATEGY_GLYPHS.balanced}
function strategyPickerOptions(activeId){
  return Object.values(COMBAT_STRATEGIES).map(st=>`<button type="button" class="strategy-option ${st.id===activeId?'active':''}" data-strategy="${st.id}" onclick="selectStrategy('${st.id}')" ontouchstart="selectStrategy('${st.id}',event)" aria-selected="${st.id===activeId?'true':'false'}"><span class="strat-glyph">${strategyGlyph(st.id)}</span><span class="strat-copy"><span class="strat-name">${st.name}</span><span class="strat-desc">${st.desc}</span></span></button>`).join('');
}
function openStrategyPicker(){
  const trigger=$('strategyTrigger');if(!trigger)return;
  let panel=$('strategyPanel');
  if(!panel){panel=document.createElement('div');panel.id='strategyPanel';panel.className='strategy-panel';panel.setAttribute('role','menu');document.body.appendChild(panel)}
  const id=G.combatStrategy&&COMBAT_STRATEGIES[G.combatStrategy]?G.combatStrategy:'balanced';
  panel.innerHTML=strategyPickerOptions(id);
  const r=trigger.getBoundingClientRect(),gap=5,w=Math.min(240,window.innerWidth-16);
  let left=Math.max(8,Math.min(window.innerWidth-w-8,r.right-w));
  let top=r.bottom+gap;
  if(top+Math.min(panel.scrollHeight||208,window.innerHeight-16)>window.innerHeight-8)top=Math.max(8,r.top-Math.min(panel.scrollHeight||208,window.innerHeight-16)-gap);
  panel.style.width=w+'px';panel.style.left=left+'px';panel.style.top=top+'px';
  panel.classList.add('show');trigger.classList.add('open');trigger.setAttribute('aria-expanded','true');
}
function closeStrategyPicker(){
  const panel=$('strategyPanel'),trigger=$('strategyTrigger');
  if(panel)panel.classList.remove('show');
  if(trigger){trigger.classList.remove('open');trigger.setAttribute('aria-expanded','false')}
}
function toggleStrategyPicker(e){
  if(e){if(e.type==='touchstart'){if(toggleStrategyPicker._touch&&Date.now()-toggleStrategyPicker._touch<450){e.preventDefault();return}toggleStrategyPicker._touch=Date.now();e.preventDefault()}else if(toggleStrategyPicker._touch&&Date.now()-toggleStrategyPicker._touch<450)return;e.stopPropagation()}
  const panel=$('strategyPanel');panel&&panel.classList.contains('show')?closeStrategyPicker():openStrategyPicker();
}
function selectStrategy(id,e){
  if(e){if(e.type==='touchstart'){e.preventDefault();if(selectStrategy._touch&&Date.now()-selectStrategy._touch<450)return;selectStrategy._touch=Date.now()}e.stopPropagation()}
  if(!COMBAT_STRATEGIES[id])return;
  setCombatStrategy(id);
  const input=$('auto-strategy-select');if(input)input.value=id;
  updateStrategyPickerUI(id);
  closeStrategyPicker();
}
function updateStrategyPickerUI(id){
  const st=COMBAT_STRATEGIES[id]||COMBAT_STRATEGIES.balanced;
  const trigger=$('strategyTrigger');
  const icon=$('combatStrategyIcon');
  const input=$('auto-strategy-select');
  if(input)input.value=st.id;
  if(icon)icon.innerHTML=`<span class="strat-glyph">${strategyGlyph(st.id)}</span>`;
  if(trigger){
    const name=trigger.querySelector('.strategy-name');if(name)name.textContent=st.name;
    trigger.title=st.desc;
  }
  const panel=$('strategyPanel');
  if(panel&&panel.classList.contains('show'))panel.innerHTML=strategyPickerOptions(st.id);
}
document.addEventListener('click',e=>{
  const trigger=$('strategyTrigger'),panel=$('strategyPanel');
  if(panel&&panel.classList.contains('show')&&(!trigger||(!trigger.contains(e.target)&&!panel.contains(e.target))))closeStrategyPicker();
});
document.addEventListener('touchstart',e=>{
  const trigger=$('strategyTrigger'),panel=$('strategyPanel');
  if(panel&&panel.classList.contains('show')&&(!trigger||(!trigger.contains(e.target)&&!panel.contains(e.target))))closeStrategyPicker();
},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStrategyPicker()});

function setCombatStrategy(id){if(!COMBAT_STRATEGIES[id])return;G.combatStrategy=id;G.auto.combatStrategy=id;window.__combatStrategy=id;const sel=$('auto-strategy-select');if(sel)sel.value=id;updateStrategyPickerUI(id);save(true);toast('戰鬥策略：'+COMBAT_STRATEGIES[id].name);}
function syncStrategyUI(){const id=COMBAT_STRATEGIES[G.combatStrategy]?G.combatStrategy:'balanced';G.auto.combatStrategy=id;window.__combatStrategy=id;updateStrategyPickerUI(id)}
function setAuto(k,v){if(k==='potionHpPct'||k==='healHpPct')v=clamp(Number(v)||.2,.1,.95);G.auto[k]=v;if(k==='enabled')toast(v?'掛機啟動':'掛機停止');renderAll();save(true)}
function exportSave(){try{const s='TXWS510:'+btoa(unescape(encodeURIComponent(JSON.stringify(G))));prompt('複製以下存檔碼',s)}catch(e){toast('匯出失敗')}}
function importSave(){const s=prompt('貼上 TXWS520 / 舊版存檔碼');if(!s)return;try{G=JSON.parse(decodeURIComponent(escape(atob(s.replace(/^TXWS\d+:/,'')))));normalize();migrateEquipQuality();ensureStats();save(true);renderAll();toast('匯入成功')}catch(e){toast('存檔碼無效')}}
function resetGame(){if(confirm('確定重置天下無雙放置版存檔？')){try{localStorage.removeItem(SAVE_KEY)}catch(e){}location.reload()}}
function manualLevel(){const need=expNeed();if(G.player.exp<need)return toast('經驗未滿');levelUp();renderAll()}
