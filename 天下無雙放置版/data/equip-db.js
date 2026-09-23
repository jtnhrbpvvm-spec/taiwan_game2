/* 裝備資料庫：slotOf／qByLevel／buildEquipDB → EQUIP_DB、EQUIP_NAMES、BASIC_EQUIP
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
function slotOf(name){
 const weapons=['劍','刀','槍','戟','錐','鏜','杖','刃','噬','含光','皓月','龍脊','凝霜','吞龍貫','乘風','無極','萬刃','追雲','蓼葉','金背','金剛','日劍','天刑','巨闕','司命','鳳羽'];
 if(name==='乾坤頂')return 'helmet';
 if(name==='金錐帽')return 'helmet';
 if(/靴|履/.test(name))return 'shoes';
 if(/項鍊/.test(name))return 'necklace';
 if(/戒指/.test(name))return 'ring';
 if(/法寶/.test(name))return 'artifact';
 if(/護符/.test(name))return 'talisman';
 if(/腰帶/.test(name))return 'belt';
 if(/冠|盔|帽|巾|面甲|面罩|鬼臉/.test(name))return 'helmet';
 if(/袍|衣|甲/.test(name))return 'armor';
 if(/護腕/.test(name))return 'bracer';
 if(weapons.some(w=>name.includes(w)))return 'weapon';
 return 'talisman';
}
function qByLevel(lv){return lv>=90?'gold':lv>=65?'purple':lv>=42?'blue':lv>=25?'green':'white'}
function buildEquipDB(){
 const out={};
 OFFICIAL.monsters3.forEach(row=>{
  const lv=row[1], elements=row[5], eq=row[8]||[];
  eq.forEach(name=>{
   const slot=slotOf(name);if(out[name]){out[name].level=Math.max(out[name].level,lv);return}
   const q=qByLevel(lv), weapon=slot==='weapon';
   const attr={狠:0,快:0,穩:0,智:0,準:0};
   if(weapon)attr.狠=Math.round(lv*.55); else if(slot==='shoes'||slot==='bracer')attr.快=Math.round(lv*.25); else if(slot==='helmet'||slot==='armor'||slot==='belt')attr.穩=Math.round(lv*.45); else if(slot==='necklace'||slot==='artifact')attr.智=Math.round(lv*.32); else if(slot==='ring'||slot==='talisman')attr.準=Math.round(lv*.32);
   out[name]={name,slot,level:lv,quality:q,element:ELEM[elements]||'none',baseAtk:weapon?Math.round(10*Math.pow(lv,.98)):Math.round(slot==='ring'?lv*.4:0),baseDef:['helmet','armor','bracer','belt','shoes'].includes(slot)?Math.round(6*Math.pow(lv,.9)):Math.round(lv*.16),hp:['helmet','armor','belt','shoes'].includes(slot)?Math.round(18*Math.pow(lv,1.03)):Math.round(lv*.8),mp:['necklace','artifact','talisman'].includes(slot)?Math.round(7*Math.pow(lv,.9)):0,attr,source:`3.0怪物掉落（Lv.${lv} ${row[0]}）`};
  });
 });
 ['烈火','八步伏魔槍','絕煞','太乙'].forEach((name,i)=>{out[name]={name,slot:'weapon',level:75,quality:'gold',element:['fire','earth','metal','water'][i],baseAtk:210,baseDef:0,hp:0,mp:0,attr:{狠:42,快:i===2?16:0,穩:i===1?8:0,智:i===3?18:0,準:i===2?18:0},source:'官方3.0職業武器'};});
 return out;
}
const EQUIP_DB=buildEquipDB();
const EQUIP_NAMES=Object.keys(EQUIP_DB);

const BASIC_EQUIP={
 '精鐵劍':{name:'精鐵劍',slot:'weapon',level:1,quality:'white',element:'metal',baseAtk:18,baseDef:0,hp:0,mp:0,attr:{狠:5,快:1,穩:0,智:0,準:2},source:'單機新手裝'},
 '精鐵戟':{name:'精鐵戟',slot:'weapon',level:1,quality:'white',element:'earth',baseAtk:22,baseDef:0,hp:0,mp:0,attr:{狠:7,快:0,穩:2,智:0,準:1},source:'單機新手裝'},
 '精鐵鏜':{name:'精鐵鏜',slot:'weapon',level:1,quality:'white',element:'wood',baseAtk:16,baseDef:0,hp:0,mp:0,attr:{狠:3,快:2,穩:0,智:0,準:7},source:'單機新手裝'},
 '桃木杖':{name:'桃木杖',slot:'weapon',level:1,quality:'white',element:'water',baseAtk:14,baseDef:0,hp:0,mp:18,attr:{狠:0,快:0,穩:1,智:7,準:2},source:'單機新手裝'},
 '青布帽':{name:'青布帽',slot:'helmet',level:1,quality:'white',element:'wood',baseAtk:0,baseDef:7,hp:45,mp:0,attr:{狠:0,快:0,穩:2,智:1,準:0},source:'單機新手裝'},
 '厚皮甲':{name:'厚皮甲',slot:'armor',level:1,quality:'white',element:'earth',baseAtk:0,baseDef:14,hp:120,mp:0,attr:{狠:0,快:0,穩:5,智:0,準:0},source:'單機新手裝'},
 '青鐵護腕':{name:'青鐵護腕',slot:'bracer',level:1,quality:'white',element:'metal',baseAtk:0,baseDef:5,hp:15,mp:0,attr:{狠:0,快:2,穩:1,智:0,準:0},source:'單機新手裝'},
 '皮革腰帶':{name:'皮革腰帶',slot:'belt',level:1,quality:'white',element:'earth',baseAtk:0,baseDef:6,hp:55,mp:0,attr:{狠:0,快:0,穩:3,智:0,準:0},source:'單機新手裝'},
 '青布靴':{name:'青布靴',slot:'shoes',level:1,quality:'white',element:'wood',baseAtk:0,baseDef:5,hp:30,mp:0,attr:{狠:0,快:4,穩:1,智:0,準:0},source:'單機新手裝'},
 '青玉項鍊':{name:'青玉項鍊',slot:'necklace',level:1,quality:'white',element:'water',baseAtk:0,baseDef:1,hp:12,mp:20,attr:{狠:0,快:0,穩:0,智:3,準:2},source:'單機新手裝'},
 '青玉戒':{name:'青玉戒',slot:'ring',level:1,quality:'white',element:'water',baseAtk:2,baseDef:2,hp:18,mp:12,attr:{狠:0,快:0,穩:0,智:2,準:4},source:'單機新手裝'},
 '青玉法寶':{name:'青玉法寶',slot:'artifact',level:1,quality:'white',element:'water',baseAtk:0,baseDef:2,hp:10,mp:28,attr:{狠:0,快:0,穩:0,智:4,準:1},source:'單機新手裝'},
 '平安護符':{name:'平安護符',slot:'talisman',level:1,quality:'white',element:'none',baseAtk:0,baseDef:2,hp:25,mp:5,attr:{狠:0,快:1,穩:1,智:0,準:3},source:'單機新手裝'}
};
Object.assign(EQUIP_DB,BASIC_EQUIP);

