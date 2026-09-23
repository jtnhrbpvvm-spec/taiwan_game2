/* 背包核心邏輯：物品鎖定、單件販賣、分解、一次全部分解、全部分解確認視窗
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
/* ===== [新增/鎖定] 物品鎖定核心：鎖定只阻擋批量操作 ===== */
function isLocked(slot){return slot?.locked===true}
function getStackLock(name,stackIndex){return !!(G.inventoryLocks?.[name]?.[stackIndex])}
function setStackLock(name,stackIndex,locked){
  G.inventoryLocks=G.inventoryLocks||{};
  G.inventoryLocks[name]=G.inventoryLocks[name]||[];
  G.inventoryLocks[name][stackIndex]=!!locked;
}
function toggleLock(slot){
  if(!slot)return false;
  const name=slot.name||slot.id;
  if(!name)return false;
  if(slot.instance){
    slot.instance.locked=!isLocked(slot.instance);
    save(true);
    toast(`${slot.instance.locked?'已鎖定':'已解鎖'} ${name}`);
    renderAll();
    return slot.instance.locked;
  }
  const stackIndex=Number(slot.stackIndex??slot.offset??0);
  const next=!getStackLock(name,stackIndex);
  setStackLock(name,stackIndex,next);
  save(true);
  toast(`${next?'已鎖定':'已解鎖'} ${name}`);
  renderAll();
  return next;
}
function toggleInventorySlotLock(index,event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const slot=window.__inventoryTooltipSlots?.[Number(index)];
  return toggleLock(slot);
}
function getDecomposeLockedCount(){
  ensureInventoryInstances();
  let n=0;
  for(const name of Object.keys(G.inventory||{})){
    const qty=Math.max(0,Number(G.inventory[name]||0));
    if(!qty||!EQUIP_DB[name])continue;
    const arr=G.inventoryInstances?.[name]||[];
    for(let i=0;i<qty;i++){
      const it=arr[i]||null,m=getInventoryItemMeta(name,it);
      if(m.canDecompose&&isLocked(it))n++;
    }
  }
  return n;
}
function getSellCandidates(){
  ensureInventoryInstances();
  const out=[],locked=[];
  for(const name of Object.keys(G.inventory||{})){
    const qty=Math.max(0,Number(G.inventory[name]||0)),price=inventorySellPrice(name);
    if(!qty||!EQUIP_DB[name]||!price)continue;
    const arr=G.inventoryInstances?.[name]||[];
    for(let i=0;i<qty;i++){
      const it=arr[i]||makeEquip(name);
      const equipped=Object.values(G.equipment||{}).some(x=>x===it);
      if(equipped)continue;
      if(isLocked(it)){locked.push({name,instance:it,index:i});continue}
      out.push({name,instance:it,index:i,price});
    }
  }
  return {targets:out,locked};
}
function sellInventorySingle(name,index=0){
  const qty=Number(G.inventory[name]||0),arr=G.inventoryInstances?.[name]||[];
  if(!qty||!EQUIP_DB[name])return toast('沒有可販賣物品');
  const it=arr[index]||makeEquip(name),price=inventorySellPrice(name);
  if(!price)return toast('此物品不可販賣');
  if(Object.values(G.equipment||{}).some(x=>x===it))return toast('裝備中的道具不可販賣');
  const locked=isLocked(it);
  const ok=confirm(`${locked?'此道具已鎖定，確定要販賣嗎？':'確定要販賣 '+name+' 嗎？'}\n售價：${fmt(price)} 靈石`);
  if(!ok)return;
  G.inventory[name]=Math.max(0,qty-1);
  if(arr.length)arr.splice(index,1);
  G.player.spiritStone+=price;
  save(true);closeInventoryDetail();toast(`已販賣 ${name}，獲得靈石 ${fmt(price)}`);renderAll();
}
function dismantleInventory(name,index=0){
  const qty=Number(G.inventory[name]||0);
  if(!qty||!EQUIP_DB[name])return toast('沒有可分解裝備');
  const arr=G.inventoryInstances?.[name]||[];
  const it=arr[index]||makeEquip(name);
  const m=getInventoryItemMeta(name,it);
  if(!m.canDecompose||m.questItem)return toast('此物品不可分解');
  if(m.qualityRank>=4&&!G.setting.decomposeIncludeRare)return toast('紫色以上裝備預設不分解');
  if(isLocked(it)){
    const ok=confirm(`此道具已鎖定，確定要分解嗎？\n${name}`);
    if(!ok)return;
  }
  const y=calculateInventoryDecomposeYield(it);
  G.inventory[name]=Math.max(0,qty-1);
  if(arr.length)arr.splice(index,1);
  G.inventory['玄鐵']=(G.inventory['玄鐵']||0)+y['玄鐵'];
  G.player.spiritStone+=y['靈石'];
  save(true);toast(`${name} 分解：玄鐵×${y['玄鐵']}、靈石×${y['靈石']}`);renderAll()
}

/* ===== [新增] 一次全部分解：單次確認、批次彙總、保護鎖定／任務／稀有 ===== */
function getDecomposeCandidates(includeRare=false){
  ensureInventoryInstances();
  const out=[];
  for(const name of Object.keys(G.inventory||{})){
    const qty=Math.max(0,Number(G.inventory[name]||0));
    if(!qty||!EQUIP_DB[name])continue;
    const arr=G.inventoryInstances?.[name]||[];
    for(let i=0;i<qty;i++){
      const it=arr[i]||makeEquip(name),m=getInventoryItemMeta(name,it);
      const equipped=Object.values(G.equipment||{}).some(x=>x===it||(x?.name===name&&it&&x===it));
      if(!m.canDecompose||m.locked||m.questItem||equipped)continue;
      if(!includeRare&&m.qualityRank>=4)continue;
      out.push({name,instance:it,index:i,meta:m});
    }
  }
  return out;
}
function calculateInventoryDecomposeYield(item){
  const lv=Math.max(1,Number(item?.level)||1);
  return {'玄鐵':Math.max(1,Math.floor(lv/8)),'靈石':Math.max(1,Math.floor(lv/15))};
}
function buildDecomposeResult(candidates){
  const result={};
  for(const c of candidates){
    const y=calculateInventoryDecomposeYield(c.instance||EQUIP_DB[c.name]);
    for(const [id,n] of Object.entries(y))result[id]=(result[id]||0)+n;
  }
  return result;
}
function openInventoryDecompose(){
  const includeRare=!!G.setting.decomposeIncludeRare;
  const candidates=getDecomposeCandidates(includeRare);
  const body=$('inventoryDecomposeBody');if(!body)return;
  const result=buildDecomposeResult(candidates);
  const skippedLocked=getDecomposeLockedCount();
  const names=candidates.slice(0,10).map(c=>`<div>${c.name} · ${QUALITY[c.meta.quality]||'凡品'} · Lv.${c.meta.level}</div>`).join('');
  const mats=Object.entries(result).map(([id,n])=>`<div><span>${id}</span><b>×${fmt(n)}</b></div>`).join('');
  body.innerHTML=`<div class="card"><p class="desc">將分解道具總數：<b style="color:var(--gold2)">${candidates.length}</b> 件</p><p class="footer-note" style="color:#f4cf67">已跳過 ${skippedLocked} 件鎖定道具</p>
    <label class="field" style="display:flex;align-items:center;gap:7px;margin-top:7px;font-size:11px"><input type="checkbox" ${includeRare?'checked':''} onchange="G.setting.decomposeIncludeRare=this.checked;openInventoryDecompose()">包含稀有（紫色以上）</label>
    <p class="footer-note">已裝備、鎖定、任務道具永不分解；未勾選時紫色以上預設排除。</p>
    <div class="zone"><h4>前 10 項</h4><div class="inventory-decompose-list">${names||'<div>沒有符合條件的可分解道具。</div>'}</div></div>
    <div class="zone"><h4>可獲得材料</h4><div class="inventory-material-list">${mats||'<div>無</div>'}</div></div>
    <p style="color:#ff9d92;font-weight:800;margin:8px 0 0">警告：分解後無法恢復</p>
    <div class="row" style="margin-top:9px"><button class="smallbtn danger" ${candidates.length?'':'disabled'} onclick="confirmInventoryDecompose()">確認全部分解</button></div>
  </div>`;
  $('inventoryDecomposeModal').classList.add('show');
}
function closeInventoryDecompose(){$('inventoryDecomposeModal')?.classList.remove('show')}
function confirmInventoryDecompose(){
  const candidates=getDecomposeCandidates(!!G.setting.decomposeIncludeRare);
  if(!candidates.length){closeInventoryDecompose();return toast('沒有符合條件的可分解道具')}
  const result=buildDecomposeResult(candidates);
  const byName={};
  for(const c of candidates)(byName[c.name]??=[]).push(c);
  for(const [name,list] of Object.entries(byName)){
    const removeCount=list.length;
    G.inventory[name]=Math.max(0,Number(G.inventory[name]||0)-removeCount);
    if(G.inventoryInstances?.[name])G.inventoryInstances[name].splice(0,removeCount);
  }
  for(const [materialId,count] of Object.entries(result))G.inventory[materialId]=(G.inventory[materialId]||0)+count;
  save(true);closeInventoryDecompose();renderAll();
  toast(`全部分解完成：${candidates.length} 件，獲得 ${Object.entries(result).map(([k,v])=>`${k}×${fmt(v)}`).join('、')}`);
  return result;
}
function decomposeAll(inv){
  G.setting.decomposeIncludeRare=false;
  const candidates=getDecomposeCandidates(false);
  if(!candidates.length)return toast(getDecomposeLockedCount()>0?'沒有可分解的道具（鎖定道具已跳過）':'沒有可分解的道具');
  return openInventoryDecompose();
}
function salvageAllEquipment(includeRare=false){
  G.setting.decomposeIncludeRare=!!includeRare;
  return confirmInventoryDecompose();
}
