/* 背包介面：售價、全部販賣確認、物品詳情視窗、堆疊／分類／排序、Tooltip、renderInventory()
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
function inventorySellPrice(name){const d=EQUIP_DB[name];if(!d)return 0;return Math.max(1,Math.floor(Math.max(100,Math.round(Math.pow(d.level,1.58)*12))*.35))}
/* ===== [修改/鎖定] 全部販賣：批次過濾 locked + 一次確認 ===== */
let pendingBatchSell=null;
function sellAllItems(player){
  const {targets,locked}=getSellCandidates();
  const totalGold=targets.reduce((sum,x)=>sum+x.price,0);
  if(!targets.length){
    toast(locked.length?'沒有可販賣的物品（鎖定道具已跳過）':'沒有可販賣的物品');
    return {soldCount:0,totalGold:0,skippedLocked:locked.length};
  }
  pendingBatchSell={targets,locked,totalGold};
  const body=$('inventoryDecomposeBody');
  if(body){
    body.innerHTML=`<div class="card">
      <p class="desc">將販賣道具總數：<b style="color:var(--gold2)">${targets.length}</b> 件</p>
      <p class="desc">預計獲得：<b style="color:#f0dca8">${fmt(totalGold)}</b> 靈石</p>
      <p class="footer-note" style="color:#f4cf67">已跳過 ${locked.length} 件鎖定道具</p>
      <p class="footer-note">裝備中的道具不會列入批次販賣。</p>
      <p style="color:#ff9d92;font-weight:800;margin:8px 0 0">警告：確認後將批次移除上述可販賣道具</p>
      <div class="row" style="margin-top:9px"><button class="smallbtn danger" onclick="confirmBatchSell()">確認全部販賣</button></div>
    </div>`;
    $('inventoryDecomposeModal').classList.add('show');
  }
  return {soldCount:targets.length,totalGold,skippedLocked:locked.length};
}
function confirmBatchSell(){
  const data=pendingBatchSell||getSellCandidates();
  const targets=data.targets||[];
  if(!targets.length){pendingBatchSell=null;closeInventoryDecompose();return toast('沒有可販賣的物品（鎖定道具已跳過）')}
  const byName={};
  for(const x of targets)(byName[x.name]??=[]).push(x);
  let totalGold=0,soldCount=0;
  for(const [name,list] of Object.entries(byName)){
    const arr=G.inventoryInstances?.[name]||[];
    const indexes=list.map(x=>x.index).sort((a,b)=>b-a);
    for(const i of indexes){const it=arr[i];if(isLocked(it))continue;arr.splice(i,1);soldCount++;totalGold+=inventorySellPrice(name)}
    G.inventory[name]=Math.max(0,Number(G.inventory[name]||0)-soldCountByName(list,name,arr));
  }
  // 依目前原架構重新以「剩餘數量」同步，避免舊存檔缺少 instance。
  for(const name of Object.keys(byName)){
    const remaining=G.inventoryInstances?.[name]?.length;
    if(Number.isFinite(remaining)&&remaining>=0&&EQUIP_DB[name])G.inventory[name]=remaining;
  }
  G.player.spiritStone+=totalGold;
  pendingBatchSell=null;save(true);closeInventoryDecompose();toast(`全部販賣完成：${soldCount} 件，獲得靈石 ${fmt(totalGold)}`);renderAll();
  return {soldCount,totalGold};
}
function soldCountByName(list,name,arr){return list.filter(x=>x.name===name).length}
function sellAll(inv){return sellAllItems(G)}
function sellInventoryAll(){
  return sellAllItems(G);
}

function openInventoryDetail(name,idx=-1){const qty=Number(G.inventory[name]||0);if(qty<=0)return;const d=EQUIP_DB[name];const title=$('inventoryDetailTitle'),body=$('inventoryDetailBody');if(!title||!body)return;title.textContent=name;if(d){ensureInventoryInstances();const _arr=G.inventoryInstances?.[name]||[];idx=Number(idx);if(!(idx>=0&&idx<_arr.length))idx=_arr.length-1;const ev=_arr[idx]||d;const q=ev.quality||d.quality;const c=compareEquip(name,_arr[idx]);body.innerHTML=`<div class="card"><p class="desc">裝備：${SLOT_NAMES[d.slot]} · ${QUALITY[q]} · Lv.${d.level}${equipTag(_arr[idx])}</p><div class="inventory-detail-grid"><div class="stat">攻擊<em>${fmt(ev.baseAtk)}</em></div><div class="stat">防禦<em>${fmt(ev.baseDef)}</em></div><div class="stat">HP<em>${fmt(ev.hp)}</em></div><div class="stat">MP<em>${fmt(ev.mp)}</em></div></div><p class="desc" style="margin-top:7px">${ev.enhance?'強化 +'+ev.enhance+' · ':''}${Object.entries(ev.attr||{}).filter(([,v])=>v).map(([k,v])=>k+'+'+v).join('、')||'基礎屬性'} · 持有 ×${qty}</p>${c?`<p class="desc">與目前裝備比較：${c.cur?c.cur.name:'空'} · ${c.text}</p>`:''}<p class="footer-note">${d.source||'可由戰鬥掉落或商店取得。'}</p><div class="row" style="margin-top:8px"><button class="smallbtn hot" onclick="equipItemAt('${name}',${idx});closeInventoryDetail();renderAll()">裝備</button><button class="smallbtn danger" onclick="sellInventorySingle('${name}',${Math.max(0,idx)})">販賣 1 件（${fmt(inventorySellPrice(name))}）</button><button class="smallbtn danger" onclick="sellInventoryAll()">全部販賣</button><button class="smallbtn" onclick="dismantleInventory('${name}',${Math.max(0,idx)});closeInventoryDetail()">分解 1 件</button></div></div>`}else{body.innerHTML=`<div class="card"><p class="desc">物品：${name}</p><p class="desc">持有數量：×${qty}</p><p class="footer-note">材料／道具，可用於商店、煉器或戰鬥消耗。</p></div>`}$('inventoryDetailModal').classList.add('show')}
function equipItemAt(name,idx){const arr=G.inventoryInstances?.[name];idx=Number(idx);if(arr&&idx>=0&&idx<arr.length){const [it]=arr.splice(idx,1);arr.push(it)}return equipItem(name,false,true)}
function closeInventoryDetail(){$('inventoryDetailModal')?.classList.remove('show')}

/* ===== [新增] 統一背包加入：stackable／maxStack／category 資料結構 ===== */
function addItemToInventory(itemOrName,qty=1,options={}){
  const item=typeof itemOrName==='string'?{id:itemOrName,name:itemOrName}:itemOrName||{};
  const name=item.name||item.id;if(!name)return false;
  qty=Math.max(0,Number(qty)||0);if(!qty)return false;
  const meta=Object.assign({},getInventoryItemMeta(name,item),options);
  G.inventory=G.inventory||{};G.inventoryInstances=G.inventoryInstances||{};
  G.inventory[name]=Number(G.inventory[name]||0);
  if(meta.stackable){
    G.inventory[name]+=qty;
    return true;
  }
  G.inventoryInstances[name]=G.inventoryInstances[name]||[];
  for(let i=0;i<qty;i++){
    const inst=JSON.parse(JSON.stringify(item));
    inst.id=inst.id||name;inst.name=name;inst.stackable=false;inst.count=1;
    inst.maxStack=1;inst.category=meta.category;inst.quality=inst.quality||meta.quality;inst.canDecompose=inst.canDecompose??meta.canDecompose;
    G.inventoryInstances[name].push(inst);G.inventory[name]++;
  }
  return true;
}
/* ===== [修改] 背包：堆疊／分類／排序／Tooltip ===== */
const INVENTORY_CATEGORY_LABELS={all:'全部',weapon:'武器',armor:'防具',accessory:'飾品',consumable:'消耗品',material:'材料',other:'其他'};
const INVENTORY_QUALITY_RANK={white:1,green:2,blue:3,purple:4,gold:5};
const INVENTORY_MAX_STACK=999;

function inventoryQualityRank(q){return INVENTORY_QUALITY_RANK[q]||1}
function inventoryCategory(name,item){
  const d=item||EQUIP_DB[name];
  if(d?.slot){
    if(d.slot==='weapon')return 'weapon';
    if(['helmet','armor','bracer','belt','shoes'].includes(d.slot))return 'armor';
    if(['necklace','ring','artifact','talisman'].includes(d.slot))return 'accessory';
  }
  const market=MARKET.find(x=>x[0]===name);
  if(market?.[2]==='potion')return 'consumable';
  if(market?.[2]==='material'||market?.[2]==='gem')return 'material';
  if(/石|鐵|晶|玉|草|丹|血珀|材料/.test(name))return 'material';
  if(/符|藥|水|丹/.test(name))return 'consumable';
  return 'other';
}
function getInventoryItemMeta(name,instance=null){
  const d=instance||EQUIP_DB[name]||{};
  const q=instance?.quality||G.inventoryQuality?.[name]||d.quality||'white';
  const category=instance?.category||d.category||inventoryCategory(name,d);
  const isEquip=!!EQUIP_DB[name];
  return {
    id:instance?.id||name,name:instance?.name||name,category,
    stackable:instance?.stackable??(!isEquip),
    count:1,maxStack:Number(instance?.maxStack)||INVENTORY_MAX_STACK,
    quality:q,qualityRank:inventoryQualityRank(q),
    level:Number(instance?.level||d.level)||0,
    canDecompose:instance?.canDecompose??(isEquip),
    locked:!!instance?.locked,questItem:!!instance?.questItem,
    requiredLevel:Number(instance?.requiredLevel||d.level)||0,
    baseAtk:Number(instance?.baseAtk??d.baseAtk)||0,
    baseDef:Number(instance?.baseDef??d.baseDef)||0,
    hp:Number(instance?.hp??d.hp)||0,mp:Number(instance?.mp??d.mp)||0,
    attr:instance?.attr||d.attr||{},
    extraAttr:instance?.extraAttr||instance?.affix||d.extraAttr||null,
    setEffect:instance?.setEffect||d.setEffect||null,
    description:instance?.description||instance?.flavorText||d.description||d.flavorText||d.source||'可由戰鬥掉落、商店或系統取得。'
  };
}
function ensureInventoryInstances(){
  G.inventoryInstances=G.inventoryInstances||{};
  for(const name of Object.keys(G.inventory||{})){
    const qty=Math.max(0,Number(G.inventory[name]||0));
    if(!EQUIP_DB[name])continue;
    const arr=G.inventoryInstances[name]=G.inventoryInstances[name]||[];
    while(arr.length<qty){
      const it=makeEquip(name);
      if(it)arr.push(it);else break;
    }
    if(arr.length>qty)arr.length=qty;
  }
}
function inventorySlotEntries(){
  ensureInventoryInstances();
  const out=[];
  for(const name of Object.keys(G.inventory||{})){
    const qty=Math.max(0,Number(G.inventory[name]||0));
    if(!qty)continue;
    const meta=getInventoryItemMeta(name);
    if(meta.stackable){
      for(let offset=0;offset<qty;offset+=meta.maxStack){
        out.push({name,instance:null,count:Math.min(meta.maxStack,qty-offset),offset,stackIndex:Math.floor(offset/meta.maxStack)});
      }
    }else{
      const arr=G.inventoryInstances?.[name]||[];
      for(let i=0;i<qty;i++)out.push({name,instance:arr[i]||null,count:1,offset:i});
    }
  }
  return out;
}
function inventoryCategoryCounts(){
  const counts={all:0,weapon:0,armor:0,accessory:0,consumable:0,material:0,other:0};
  for(const slot of inventorySlotEntries()){
    const cat=inventoryCategory(slot.name,slot.instance);
    counts[cat]+=slot.count;
    counts.all+=slot.count;
  }
  return counts;
}
function inventorySortEntries(entries){
  const mode=G.setting?.inventorySort||'default';
  return entries.sort((a,b)=>{
    const A=getInventoryItemMeta(a.name,a.instance),B=getInventoryItemMeta(b.name,b.instance);
    if(mode==='quality')return B.qualityRank-A.qualityRank||B.level-A.level||A.id.localeCompare(B.id);
    if(mode==='level')return B.level-A.level||B.qualityRank-A.qualityRank||A.id.localeCompare(B.id);
    if(mode==='quantity')return B.count-A.count||B.qualityRank-A.qualityRank||A.id.localeCompare(B.id);
    if(mode==='name')return A.name.localeCompare(B.name);
    return A.category.localeCompare(B.category)||B.qualityRank-A.qualityRank||B.level-A.level||A.id.localeCompare(B.id);
  });
}
function inventorySetCategory(v){G.setting.inventoryCategory=v;save(true);renderAll()}
function inventorySetSort(v){G.setting.inventorySort=v;save(true);renderAll()}
function inventoryTooltipData(slot){
  const m=getInventoryItemMeta(slot.name,slot.instance);
  const attrs=Object.entries(m.attr||{}).filter(([,v])=>Number(v));
  const extra=typeof m.extraAttr==='object'
    ? Object.entries(m.extraAttr).filter(([,v])=>v).map(([k,v])=>`${k}+${typeof v==='object'?(v.value??''):v}`).join('、')
    : String(m.extraAttr||'');
  const setText=typeof m.setEffect==='string'?m.setEffect:(m.setEffect?JSON.stringify(m.setEffect):'');
  return `<div class="it-name quality-${m.quality}">${m.name}${equipTag(slot.instance)}</div>
    <div class="it-meta">${QUALITY[m.quality]||'凡品'} · ${INVENTORY_CATEGORY_LABELS[m.category]||m.category}${m.level?` · Lv.${m.level}`:''}</div>
    <div class="it-section"><b>等級需求：</b>${m.requiredLevel||'無'}</div>
    <div class="it-section"><b>主屬性：</b>${[
      m.baseAtk?`攻擊 +${fmt(m.baseAtk)}`:'',
      m.baseDef?`防禦 +${fmt(m.baseDef)}`:'',
      m.hp?`HP +${fmt(m.hp)}`:'',
      m.mp?`MP +${fmt(m.mp)}`:''
    ].filter(Boolean).join('、')||attrs.map(([k,v])=>`${k}+${v}`).join('、')||'無'}</div>
    ${extra?`<div class="it-section"><b>附加屬性：</b>${extra}</div>`:''}
    ${setText?`<div class="it-section"><b>套裝效果：</b>${setText}</div>`:''}
    <div class="it-section"><b>數量：</b>×${slot.count} / ${m.maxStack}</div>
    <div class="it-section">${m.description}</div>
    <div class="it-section"><b>操作：</b>右鍵分解 / 雙擊使用</div>`;
}
function inventoryTooltipNode(){return $('inventoryTooltip')}
let inventoryTooltipTimer=0,inventoryTooltipRaf=0,inventoryTooltipPoint={x:0,y:0};
function hideInventoryTooltip(){
  clearTimeout(inventoryTooltipTimer);
  const tip=inventoryTooltipNode();if(!tip)return;
  tip.classList.remove('show');tip.setAttribute('aria-hidden','true');
}
function moveInventoryTooltip(e){
  inventoryTooltipPoint={x:e.clientX,y:e.clientY};
  if(inventoryTooltipRaf)return;
  inventoryTooltipRaf=requestAnimationFrame(()=>{
    inventoryTooltipRaf=0;
    const tip=inventoryTooltipNode();if(!tip||!tip.classList.contains('show'))return;
    const pad=10,w=tip.offsetWidth,h=tip.offsetHeight;
    let x=inventoryTooltipPoint.x+14,y=inventoryTooltipPoint.y+14;
    if(x+w>innerWidth-pad)x=inventoryTooltipPoint.x-w-14;
    if(y+h>innerHeight-pad)y=inventoryTooltipPoint.y-h-14;
    x=Math.max(pad,Math.min(x,innerWidth-w-pad));y=Math.max(pad,Math.min(y,innerHeight-h-pad));
    tip.style.transform=`translate3d(${x}px,${y}px,0)`;
  });
}
function showInventoryTooltip(slot,e){
  clearTimeout(inventoryTooltipTimer);
  const tip=inventoryTooltipNode();if(!tip)return;
  tip.innerHTML=inventoryTooltipData(slot);tip.classList.add('show');tip.setAttribute('aria-hidden','false');
  moveInventoryTooltip(e);
}
function bindInventoryTooltips(){
  const source=window.__inventoryTooltipSlots||inventorySlotEntries();
  document.querySelectorAll('.inventory-slot').forEach(el=>{
    const data=source[Number(el.dataset.inventoryIndex)];
    if(!data)return;
    el.onmouseenter=e=>{clearTimeout(inventoryTooltipTimer);inventoryTooltipTimer=setTimeout(()=>showInventoryTooltip(data,e),300)};
    el.onmousemove=moveInventoryTooltip;
    el.onmouseleave=hideInventoryTooltip;
    el.ontouchstart=e=>{
      clearTimeout(inventoryTooltipTimer);
      const t=e.touches?.[0];if(!t)return;
      inventoryTooltipTimer=setTimeout(()=>showInventoryTooltip(data,t),500);
    };
    el.ontouchend=hideInventoryTooltip;
    el.ontouchcancel=hideInventoryTooltip;
  });
}
document.addEventListener('click',e=>{if(!e.target.closest('.inventory-slot'))hideInventoryTooltip()});
document.addEventListener('contextmenu',e=>{if(e.target.closest('.inventory-slot')){e.preventDefault();hideInventoryTooltip()}});
function renderInventory(){
  const tab=G.setting?.inventoryCategory||'all', counts=inventoryCategoryCounts();
  let entries=inventorySlotEntries().filter(x=>tab==='all'||inventoryCategory(x.name,x.instance)===tab);
  entries=inventorySortEntries(entries);
  const catTabs=Object.entries(INVENTORY_CATEGORY_LABELS).map(([k,label])=>`<button class="tab ${tab===k?'active':''}" onclick="inventorySetCategory('${k}')">${label} (${fmt(counts[k]||0)})</button>`).join('');
  window.__inventoryTooltipSlots=entries.slice();
  const rows=entries.map((slot,idx)=>{
    const m=getInventoryItemMeta(slot.name,slot.instance),q=m.quality,d=m;
    const equip=m.category==='weapon'||m.category==='armor'||m.category==='accessory';
    const displayDesc=equip
      ? `${SLOT_NAMES[EQUIP_DB[slot.name]?.slot]||'裝備'} · ${QUALITY[q]||'凡品'} · Lv.${d.level} · 攻 ${fmt(d.baseAtk)} · 防 ${fmt(d.baseDef)} · ${Object.entries(d.attr||{}).filter(([,v])=>v).map(([k,v])=>k+'+'+v).join('、')||'基礎屬性'}`
      : `${INVENTORY_CATEGORY_LABELS[m.category]||'其他'} · ${d.description}`;
    const slotLocked=m.locked||isLocked(slot.instance)||(!slot.instance&&getStackLock(slot.name,slot.stackIndex??slot.offset??0));
    slot.locked=!!slotLocked;
    return `<div class="item inventory-slot ${m.stackable?'':'nonstackable'} ${slot.locked?'is-locked':''}" data-inventory-index="${idx}" oncontextmenu="toggleInventorySlotLock(${idx},event)" ondblclick="inventoryUseHint('${slot.name.replace(/'/g,"\\'")}')">
      <button type="button" class="inventory-lock-btn" title="${slot.locked?'解鎖':'鎖定'}" onclick="event.preventDefault();event.stopPropagation();toggleInventorySlotLock(${idx},event)">${slot.locked?'🔒':'🔓'}</button>
      <div class="line"><strong class="quality-${q}">${slot.name}${equipTag(slot.instance)}</strong><span class="qty">×${slot.count}</span></div>
      <div class="desc">${displayDesc}</div>
      <div class="slot-stack">${m.stackable?`堆疊 ${slot.count}/${m.maxStack}`:'單件物品'}${m.locked?' · <span class="slot-lock">已鎖定</span>':''}</div>
      ${equip?`${equipCompareHtml(slot.name,slot.instance)}`:''}
      <div class="row" style="margin-top:5px"><button class="smallbtn hot" onclick="event.stopPropagation();openInventoryDetail('${slot.name.replace(/'/g,"\\'")}',${slot.instance?slot.offset:-1})">選擇</button></div>
    </div>`;
  }).join('');
  const totalSlots=inventorySlotEntries().length;
  setTimeout(bindInventoryTooltips,0);
  return `<div class="card"><h2 class="title">背包</h2>
    <div class="inventory-category-tabs">${catTabs}</div>
    <div class="inventory-feature-tools">
      <select onchange="inventorySetSort(this.value)">
        <option value="default" ${G.setting.inventorySort==='default'?'selected':''}>預設：分類／品質／等級／ID</option>
        <option value="quality" ${G.setting.inventorySort==='quality'?'selected':''}>排序：品質</option>
        <option value="level" ${G.setting.inventorySort==='level'?'selected':''}>排序：等級</option>
        <option value="quantity" ${G.setting.inventorySort==='quantity'?'selected':''}>排序：數量</option>
        <option value="name" ${G.setting.inventorySort==='name'?'selected':''}>排序：名稱</option>
      </select>
      <button class="smallbtn" onclick="sellInventoryAll()">全部販賣</button>
      <button class="smallbtn inventory-decompose-btn" onclick="openInventoryDecompose()">全部分解</button>
      <button class="smallbtn hot" onclick="openWarehouseWindow()">倉庫</button>
    </div>
    <p class="footer-note">共 ${totalSlots} 格；可堆疊道具同類合併，不可堆疊裝備每件獨立一格。分類切換只過濾目前背包視圖。</p>
  </div>
  <div class="card"><h2 class="title">身上裝備</h2><div>${SLOT_ORDER.map(s=>{const it=G.equipment[s];return `<div class="item"><div class="line"><span class="equip-chip"><b>${SLOT_NAMES[s]}</b>${it?it.name+' +'+(it.enhance||0):'空'}</span>${it?`<button class="smallbtn danger" onclick="unequipItem('${s}')">卸下</button>`:''}</div>${it?`<div class="desc">攻 ${fmt(it.baseAtk)} · 防 ${fmt(it.baseDef)} · HP ${fmt(it.hp)} · MP ${fmt(it.mp)} · ${Object.entries(it.attr||{}).filter(([,v])=>v).map(([k,v])=>k+'+'+v).join('、')||'基礎屬性'}</div>`:''}</div>`}).join('')}</div></div>
  <div class="card"><h2 class="title">${INVENTORY_CATEGORY_LABELS[tab]||'全部'}物品欄</h2><div class="invgrid">${rows||'<p class="desc">目前沒有符合此分類的物品。</p>'}</div></div>`;
}
function inventoryUseHint(name){toast(`${name}：目前版本保留既有物品使用流程。`)}

