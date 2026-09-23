/* 商店商品 MARKET、掉落池 POOL_ITEMS、靈寵 PET_DB、任務 QUESTS
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const MARKET=[['凡品靈草',30,'potion','hpPotion'],['聚靈丹',60,'potion','mpPotion'],['復活符',800,'item','復活符'],['玄鐵',120,'material','玄鐵'],['精煉石',320,'material','精煉石'],['打孔石',500,'material','打孔石'],['攻擊靈石',420,'gem','攻擊靈石'],['防禦靈石',420,'gem','防禦靈石'],['氣血靈石',420,'gem','氣血靈石'],['金靈石',450,'gem','金靈石'],['木靈石',450,'gem','木靈石'],['水靈石',450,'gem','水靈石'],['火靈石',450,'gem','火靈石'],['土靈石',450,'gem','土靈石']];
const POOL_ITEMS=[...new Set(OFFICIAL.monsters3.flatMap(r=>String(r[6]||'').split(/[、,，]+/).filter(Boolean)))];


const PET_DB={
 '靈狐':{icon:'🦊',name:'靈狐',cost:0,atk:10,def:3,hp:30,fast:5,crit:.015,desc:'高速靈寵：提高快與暴擊。'},
 '玄影狼':{icon:'🐺',name:'玄影狼',cost:1800,atk:28,def:5,hp:55,fast:7,crit:.02,desc:'獵殺型靈寵：提高攻擊與快。'},
 '雪原熊':{icon:'🐻',name:'雪原熊',cost:2400,atk:12,def:18,hp:180,fast:0,crit:.005,desc:'防禦型靈寵：提高穩定續航。'},
 '幼龍':{icon:'🐉',name:'幼龍',cost:6500,atk:70,def:12,hp:120,fast:4,crit:.03,desc:'高階靈寵：攻擊、氣血與暴擊全面提升。'}
};
const QUESTS=[
 {id:'kills10',name:'初入江湖',desc:'擊敗 10 名敵人',type:'kills',target:10,reward:300},
 {id:'kills100',name:'百戰成名',desc:'擊敗 100 名敵人',type:'kills',target:100,reward:1600},
 {id:'drop10',name:'尋寶修行',desc:'取得 10 件掉落物',type:'drops',target:10,reward:900},
 {id:'boss1',name:'試劍妖王',desc:'擊敗 1 名 Boss',type:'bossKills',target:1,reward:2200}
];
