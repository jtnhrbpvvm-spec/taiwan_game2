/* 副本清單 DUNGEONS、Boss 資料 BOSS_DB、平衡值 BALANCE、Boss 掉落表
 * 由 index.html 拆分而來。載入順序與檔案關係請見 data/README.md */
'use strict';
const DUNGEONS=[
 {id:'five_elements_tower',name:'五行妖閣',kind:'tower',lv:105,need:30,desc:'層數制五行爬塔。每層以五行妖力試煉，突破後推進下一層。',reward:'高階五行靈石、五行妖魄、3.0神通秘籍'},
 {id:'trial_temple',name:'試煉神殿',kind:'trial',lv:100,need:40,desc:'5回合極限輸出測試，以4槽連招總傷害核發試煉獎勵。',reward:'試煉獎勵、靈石、神通研讀資源'},
 {id:'maze_treasure',name:'迷宮尋寶',kind:'maze',lv:90,need:50,desc:'三段多路線事件地圖，遭遇精英怪、寶箱或仙人指路。',reward:'寶箱材料、玄鐵、五行靈石、神通秘籍'},
 {id:'soul_instance',name:'魂魄副本',kind:'soul',lv:120,need:1,desc:'依等級進入聚魂谷不同樓層，收集魂魄材料與高級神通秘籍。',reward:'聚魂丹、魂魄材料、高級神通秘籍'},
 {id:'monster_valley',name:'聚妖谷',kind:'dense',lv:120,need:80,desc:'高密度聚妖怪修煉場。單次進入連戰多批妖怪，集中產出裝備分解材料。',reward:'大量玄鐵、精煉石、分解材料'},
 {id:'sand_demon_lair',name:'沙魔巢穴',kind:'sand',lv:90,need:90,desc:'高難度單機團本。保留官方「不可開啟自動打怪」方向，由玩家手動操作4槽連招並獲得天品獎勵。',reward:'天品通用裝備、沙魔套裝圖紙、稀有血珀材料'}
];
const BOSS_DB=Object.entries(bossBase).map(([name,d],i)=>({id:'b'+i,name,level:d.lv,element:ELEM[d.elem]||'none',maxHp:d.hp,atk:d.atk,def:d.def,spd:d.spd,recommendPower:Math.round(d.hp*.9)}));
/* BALANCE：血珀=單機平衡，非官方數值；Boss 掉落機率沿用本版自製平衡層。 */
const BALANCE={bossItemDropRate:.22};
const BOSS_DROP_TABLE={
 '幻魔妖姬':{items:['妖姬血珀'],sourceLayer:'official'},
 '巨岩獸王':{items:['巨獸血珀'],sourceLayer:'official'},
 '食人巨魔':{items:['食魔血珀'],sourceLayer:'official'},
 '白髮鬼王':{items:['白髮血珀'],sourceLayer:'official'},
 '多聞魔王':{items:['鬼王血珀','摩那血珀'],sourceLayer:'project-required-addition'},
 '伊舍那魔王':{items:['鬼仙血珀','妖厲血珀'],sourceLayer:'project-required-addition'}
};
