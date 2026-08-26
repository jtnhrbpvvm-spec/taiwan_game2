
// ════════════════════════════════════════════════
// L1J_ITEM_DB — 官方 L1J-TW 數字編號物品資料庫
// 格式：{ "l1j_item_<官方item_id>": { n:'名稱', type:'wpn'|'arm'|'etc' } }
// 來源：L1J-TW 官方 SQL 資料庫轉儲（etcitem.sql / weapon.sql / armor.sql）
// 用途：對照存檔或程式碼中出現的 "l1j_item_數字" 格式 itemKey，
//       這批是直接沿用《天堂》官方物品編號、未重新命名的道具，
//       不在 21-item-db.js（自訂命名物品庫）的收錄範圍內。
// 共 2990 筆（道具 / 武器 / 防具）
// ════════════════════════════════════════════════
const L1J_ITEM_DB = {
  "l1j_item_30001": {
    "n": "裝備保護捲軸",
    "type": "etc"
  },
  "l1j_item_30002": {
    "n": "贖罪聖書",
    "type": "etc"
  },
  "l1j_item_30101": {
    "n": "愛的禮物盒",
    "type": "etc"
  },
  "l1j_item_30201": {
    "n": "贖罪聖書包",
    "type": "etc"
  },
  "l1j_item_30202": {
    "n": "究極力量T恤箱子",
    "type": "etc"
  },
  "l1j_item_30203": {
    "n": "究極敏捷T恤箱子",
    "type": "etc"
  },
  "l1j_item_30204": {
    "n": "究極魅力T恤箱子",
    "type": "etc"
  },
  "l1j_item_30205": {
    "n": "究極智力T恤箱子",
    "type": "etc"
  },
  "l1j_item_30206": {
    "n": "究極體力T恤箱子",
    "type": "etc"
  },
  "l1j_item_30207": {
    "n": "究極魔力T恤箱子",
    "type": "etc"
  },
  "l1j_item_30208": {
    "n": "究極抗昏迷T恤箱子",
    "type": "etc"
  },
  "l1j_item_30209": {
    "n": "究極抗支撐T恤箱子",
    "type": "etc"
  },
  "l1j_item_30210": {
    "n": "究極抗魔法T恤箱子",
    "type": "etc"
  },
  "l1j_item_30211": {
    "n": "7色染料箱",
    "type": "etc"
  },
  "l1j_item_30212": {
    "n": "紅色T恤染料",
    "type": "etc"
  },
  "l1j_item_30213": {
    "n": "橙色T恤染料",
    "type": "etc"
  },
  "l1j_item_30214": {
    "n": "黃色T恤染料",
    "type": "etc"
  },
  "l1j_item_30215": {
    "n": "綠色T恤染料",
    "type": "etc"
  },
  "l1j_item_30216": {
    "n": "藍色T恤染料",
    "type": "etc"
  },
  "l1j_item_30217": {
    "n": "深藍色T恤染料",
    "type": "etc"
  },
  "l1j_item_30218": {
    "n": "紫色T恤染料",
    "type": "etc"
  },
  "l1j_item_31001": {
    "n": "魔法娃娃：希爾黛絲",
    "type": "etc"
  },
  "l1j_item_31002": {
    "n": "魔法娃娃：雪怪",
    "type": "etc"
  },
  "l1j_item_31003": {
    "n": "魔法娃娃：蛇女",
    "type": "etc"
  },
  "l1j_item_31004": {
    "n": "魔法娃娃：亞力安",
    "type": "etc"
  },
  "l1j_item_31005": {
    "n": "魔法娃娃：木人",
    "type": "etc"
  },
  "l1j_item_31006": {
    "n": "魔法娃娃：史巴托",
    "type": "etc"
  },
  "l1j_item_31007": {
    "n": "魔法娃娃：巫妖",
    "type": "etc"
  },
  "l1j_item_31008": {
    "n": "鐵門公會 魔法娃娃：雪怪",
    "type": "etc"
  },
  "l1j_item_31009": {
    "n": "魔法娃娃：公主",
    "type": "etc"
  },
  "l1j_item_40001": {
    "n": "燈",
    "type": "etc"
  },
  "l1j_item_40002": {
    "n": "燈籠",
    "type": "etc"
  },
  "l1j_item_40003": {
    "n": "燈油",
    "type": "etc"
  },
  "l1j_item_40004": {
    "n": "魔法燈籠",
    "type": "etc"
  },
  "l1j_item_40005": {
    "n": "蠟燭",
    "type": "etc"
  },
  "l1j_item_40006": {
    "n": "創造怪物魔杖",
    "type": "etc"
  },
  "l1j_item_40007": {
    "n": "閃電魔杖",
    "type": "etc"
  },
  "l1j_item_40008": {
    "n": "變形魔杖",
    "type": "etc"
  },
  "l1j_item_40009": {
    "n": "驅逐魔杖",
    "type": "etc"
  },
  "l1j_item_40010": {
    "n": "治癒藥水",
    "type": "etc"
  },
  "l1j_item_40011": {
    "n": "強力治癒藥水",
    "type": "etc"
  },
  "l1j_item_40012": {
    "n": "終極治癒藥水",
    "type": "etc"
  },
  "l1j_item_40013": {
    "n": "自我加速藥水",
    "type": "etc"
  },
  "l1j_item_40014": {
    "n": "勇敢藥水",
    "type": "etc"
  },
  "l1j_item_40015": {
    "n": "加速魔力回復藥水",
    "type": "etc"
  },
  "l1j_item_40016": {
    "n": "慎重藥水",
    "type": "etc"
  },
  "l1j_item_40017": {
    "n": "翡翠藥水",
    "type": "etc"
  },
  "l1j_item_40018": {
    "n": "強化 自我加速藥水",
    "type": "etc"
  },
  "l1j_item_40019": {
    "n": "濃縮體力恢復劑",
    "type": "etc"
  },
  "l1j_item_40020": {
    "n": "濃縮強力體力恢復劑",
    "type": "etc"
  },
  "l1j_item_40021": {
    "n": "濃縮終極體力恢復劑",
    "type": "etc"
  },
  "l1j_item_40022": {
    "n": "古代體力恢復劑",
    "type": "etc"
  },
  "l1j_item_40023": {
    "n": "古代強力體力恢復劑",
    "type": "etc"
  },
  "l1j_item_40024": {
    "n": "古代終極體力恢復劑",
    "type": "etc"
  },
  "l1j_item_40025": {
    "n": "失明藥水",
    "type": "etc"
  },
  "l1j_item_40026": {
    "n": "香蕉汁",
    "type": "etc"
  },
  "l1j_item_40027": {
    "n": "橘子汁",
    "type": "etc"
  },
  "l1j_item_40028": {
    "n": "蘋果汁",
    "type": "etc"
  },
  "l1j_item_40029": {
    "n": "象牙塔治癒藥水",
    "type": "etc"
  },
  "l1j_item_40030": {
    "n": "象牙塔加速藥水",
    "type": "etc"
  },
  "l1j_item_40031": {
    "n": "惡魔之血",
    "type": "etc"
  },
  "l1j_item_40032": {
    "n": "伊娃的祝福",
    "type": "etc"
  },
  "l1j_item_40033": {
    "n": "萬能藥(力量)",
    "type": "etc"
  },
  "l1j_item_40034": {
    "n": "萬能藥(體質)",
    "type": "etc"
  },
  "l1j_item_40035": {
    "n": "萬能藥(敏捷)",
    "type": "etc"
  },
  "l1j_item_40036": {
    "n": "萬能藥(智慧)",
    "type": "etc"
  },
  "l1j_item_40037": {
    "n": "萬能藥(精神)",
    "type": "etc"
  },
  "l1j_item_40038": {
    "n": "萬能藥(魅力)",
    "type": "etc"
  },
  "l1j_item_40039": {
    "n": "紅酒",
    "type": "etc"
  },
  "l1j_item_40040": {
    "n": "威士忌",
    "type": "etc"
  },
  "l1j_item_40041": {
    "n": "人魚之鱗",
    "type": "etc"
  },
  "l1j_item_40042": {
    "n": "精神藥水",
    "type": "etc"
  },
  "l1j_item_40043": {
    "n": "兔子的肝",
    "type": "etc"
  },
  "l1j_item_40044": {
    "n": "鑽石",
    "type": "etc"
  },
  "l1j_item_40045": {
    "n": "紅寶石",
    "type": "etc"
  },
  "l1j_item_40046": {
    "n": "藍寶石",
    "type": "etc"
  },
  "l1j_item_40047": {
    "n": "綠寶石",
    "type": "etc"
  },
  "l1j_item_40048": {
    "n": "品質鑽石",
    "type": "etc"
  },
  "l1j_item_40049": {
    "n": "品質紅寶石",
    "type": "etc"
  },
  "l1j_item_40050": {
    "n": "品質藍寶石",
    "type": "etc"
  },
  "l1j_item_40051": {
    "n": "品質綠寶石",
    "type": "etc"
  },
  "l1j_item_40052": {
    "n": "高品質鑽石",
    "type": "etc"
  },
  "l1j_item_40053": {
    "n": "高品質紅寶石",
    "type": "etc"
  },
  "l1j_item_40054": {
    "n": "高品質藍寶石",
    "type": "etc"
  },
  "l1j_item_40055": {
    "n": "高品質綠寶石",
    "type": "etc"
  },
  "l1j_item_40056": {
    "n": "肉",
    "type": "etc"
  },
  "l1j_item_40057": {
    "n": "漂浮之眼肉",
    "type": "etc"
  },
  "l1j_item_40058": {
    "n": "煙燻的麵包屑",
    "type": "etc"
  },
  "l1j_item_40059": {
    "n": "蛋",
    "type": "etc"
  },
  "l1j_item_40060": {
    "n": "胡蘿蔔",
    "type": "etc"
  },
  "l1j_item_40061": {
    "n": "檸檬",
    "type": "etc"
  },
  "l1j_item_40062": {
    "n": "香蕉",
    "type": "etc"
  },
  "l1j_item_40063": {
    "n": "情人節巧克力",
    "type": "etc"
  },
  "l1j_item_40064": {
    "n": "蘋果",
    "type": "etc"
  },
  "l1j_item_40065": {
    "n": "情人禮物(糖果)",
    "type": "etc"
  },
  "l1j_item_40066": {
    "n": "年糕",
    "type": "etc"
  },
  "l1j_item_40067": {
    "n": "艾草年糕",
    "type": "etc"
  },
  "l1j_item_40068": {
    "n": "精靈餅乾",
    "type": "etc"
  },
  "l1j_item_40069": {
    "n": "橘子",
    "type": "etc"
  },
  "l1j_item_40070": {
    "n": "進化果實",
    "type": "etc"
  },
  "l1j_item_40071": {
    "n": "烤焦的麵包屑",
    "type": "etc"
  },
  "l1j_item_40072": {
    "n": "烤薄餅",
    "type": "etc"
  },
  "l1j_item_40073": {
    "n": "白色情人節巧克力",
    "type": "etc"
  },
  "l1j_item_40074": {
    "n": "對盔甲施法的卷軸",
    "type": "etc"
  },
  "l1j_item_40075": {
    "n": "毀滅盔甲的卷軸",
    "type": "etc"
  },
  "l1j_item_40076": {
    "n": "古代的卷軸",
    "type": "etc"
  },
  "l1j_item_40077": {
    "n": "古代人的鍊金術卷軸",
    "type": "etc"
  },
  "l1j_item_40078": {
    "n": "古代人的咒術卷軸",
    "type": "etc"
  },
  "l1j_item_40079": {
    "n": "傳送回家的卷軸",
    "type": "etc"
  },
  "l1j_item_40080": {
    "n": "古魯丁村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40081": {
    "n": "奇岩村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40082": {
    "n": "指定傳送卷軸(歌唱之島)",
    "type": "etc"
  },
  "l1j_item_40083": {
    "n": "大空洞傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40084": {
    "n": "狄亞得移動卷軸",
    "type": "etc"
  },
  "l1j_item_40085": {
    "n": "說話之島指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40086": {
    "n": "全體傳送術的卷軸",
    "type": "etc"
  },
  "l1j_item_40087": {
    "n": "對武器施法的卷軸",
    "type": "etc"
  },
  "l1j_item_40088": {
    "n": "變形卷軸",
    "type": "etc"
  },
  "l1j_item_40089": {
    "n": "復活卷軸",
    "type": "etc"
  },
  "l1j_item_40090": {
    "n": "空的魔法卷軸(等級1)",
    "type": "etc"
  },
  "l1j_item_40091": {
    "n": "空的魔法卷軸(等級2)",
    "type": "etc"
  },
  "l1j_item_40092": {
    "n": "空的魔法卷軸(等級3)",
    "type": "etc"
  },
  "l1j_item_40093": {
    "n": "空的魔法卷軸(等級4)",
    "type": "etc"
  },
  "l1j_item_40094": {
    "n": "空的魔法卷軸(等級5)",
    "type": "etc"
  },
  "l1j_item_40095": {
    "n": "象牙塔傳送回家的卷軸",
    "type": "etc"
  },
  "l1j_item_40096": {
    "n": "象牙塔變身卷軸",
    "type": "etc"
  },
  "l1j_item_40097": {
    "n": "象牙塔解咒卷軸",
    "type": "etc"
  },
  "l1j_item_40098": {
    "n": "象牙塔鑑定卷軸",
    "type": "etc"
  },
  "l1j_item_40099": {
    "n": "象牙塔瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_40100": {
    "n": "瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_40101": {
    "n": "指定傳送卷軸(隱藏之谷)",
    "type": "etc"
  },
  "l1j_item_40102": {
    "n": "亞丁村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40103": {
    "n": "歐瑞村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40104": {
    "n": "傲慢之塔移動卷軸11F",
    "type": "etc"
  },
  "l1j_item_40105": {
    "n": "傲慢之塔移動卷軸21F",
    "type": "etc"
  },
  "l1j_item_40106": {
    "n": "傲慢之塔移動卷軸31F",
    "type": "etc"
  },
  "l1j_item_40107": {
    "n": "傲慢之塔移動卷軸41F",
    "type": "etc"
  },
  "l1j_item_40108": {
    "n": "傲慢之塔移動卷軸51F",
    "type": "etc"
  },
  "l1j_item_40109": {
    "n": "傲慢之塔移動卷軸61F",
    "type": "etc"
  },
  "l1j_item_40110": {
    "n": "傲慢之塔移動卷軸71F",
    "type": "etc"
  },
  "l1j_item_40111": {
    "n": "傲慢之塔移動卷軸81F",
    "type": "etc"
  },
  "l1j_item_40112": {
    "n": "傲慢之塔移動卷軸91F",
    "type": "etc"
  },
  "l1j_item_40113": {
    "n": "傲慢之塔移動卷軸100F",
    "type": "etc"
  },
  "l1j_item_40114": {
    "n": "妖森指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40115": {
    "n": "風木村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40116": {
    "n": "威頓村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40117": {
    "n": "銀騎士村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40118": {
    "n": "隱遁者村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40119": {
    "n": "解除咀咒的卷軸",
    "type": "etc"
  },
  "l1j_item_40120": {
    "n": "抵抗軍村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40121": {
    "n": "礦物洞穴傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40122": {
    "n": "肯特村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40123": {
    "n": "海音村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40124": {
    "n": "血盟傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40125": {
    "n": "燃柳村莊指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40126": {
    "n": "鑑定卷軸",
    "type": "etc"
  },
  "l1j_item_40127": {
    "n": "對盔甲施法的幻象卷軸",
    "type": "etc"
  },
  "l1j_item_40128": {
    "n": "對武器施法的幻象卷軸",
    "type": "etc"
  },
  "l1j_item_40129": {
    "n": "奇安的卷軸",
    "type": "etc"
  },
  "l1j_item_40130": {
    "n": "金侃的卷軸",
    "type": "etc"
  },
  "l1j_item_40131": {
    "n": "甘地圖騰",
    "type": "etc"
  },
  "l1j_item_40132": {
    "n": "那魯加圖騰",
    "type": "etc"
  },
  "l1j_item_40133": {
    "n": "都達瑪拉圖騰",
    "type": "etc"
  },
  "l1j_item_40134": {
    "n": "羅孚圖騰",
    "type": "etc"
  },
  "l1j_item_40135": {
    "n": "阿吐巴圖騰",
    "type": "etc"
  },
  "l1j_item_40136": {
    "n": "三連發煙火",
    "type": "etc"
  },
  "l1j_item_40137": {
    "n": "六連發煙火",
    "type": "etc"
  },
  "l1j_item_40138": {
    "n": "品質六連發煙火",
    "type": "etc"
  },
  "l1j_item_40139": {
    "n": "藍色兩段煙火",
    "type": "etc"
  },
  "l1j_item_40140": {
    "n": "藍色仙女棒",
    "type": "etc"
  },
  "l1j_item_40141": {
    "n": "藍色煙火",
    "type": "etc"
  },
  "l1j_item_40142": {
    "n": "藍色心形煙火",
    "type": "etc"
  },
  "l1j_item_40143": {
    "n": "紅色兩段煙火",
    "type": "etc"
  },
  "l1j_item_40144": {
    "n": "紅色仙女棒",
    "type": "etc"
  },
  "l1j_item_40145": {
    "n": "紅色煙火",
    "type": "etc"
  },
  "l1j_item_40146": {
    "n": "紅色心形煙火",
    "type": "etc"
  },
  "l1j_item_40147": {
    "n": "綠色兩段圓形煙火",
    "type": "etc"
  },
  "l1j_item_40148": {
    "n": "綠色兩段煙火",
    "type": "etc"
  },
  "l1j_item_40149": {
    "n": "綠色雪煙火",
    "type": "etc"
  },
  "l1j_item_40150": {
    "n": "綠色仙女棒",
    "type": "etc"
  },
  "l1j_item_40151": {
    "n": "綠色圓形煙火",
    "type": "etc"
  },
  "l1j_item_40152": {
    "n": "綠色煙火",
    "type": "etc"
  },
  "l1j_item_40153": {
    "n": "綠色心形煙火",
    "type": "etc"
  },
  "l1j_item_40154": {
    "n": "聖誕煙火",
    "type": "etc"
  },
  "l1j_item_40155": {
    "n": "黃色兩段圓形煙火",
    "type": "etc"
  },
  "l1j_item_40156": {
    "n": "黃色兩段煙火",
    "type": "etc"
  },
  "l1j_item_40157": {
    "n": "黃色雪煙火",
    "type": "etc"
  },
  "l1j_item_40158": {
    "n": "黃色仙女棒",
    "type": "etc"
  },
  "l1j_item_40159": {
    "n": "黃色圓形煙火",
    "type": "etc"
  },
  "l1j_item_40160": {
    "n": "黃色煙火",
    "type": "etc"
  },
  "l1j_item_40161": {
    "n": "黃色心形煙火",
    "type": "etc"
  },
  "l1j_item_40162": {
    "n": "高崙之心",
    "type": "etc"
  },
  "l1j_item_40163": {
    "n": "黃金鑰匙",
    "type": "etc"
  },
  "l1j_item_40164": {
    "n": "技術書(衝擊之暈)",
    "type": "etc"
  },
  "l1j_item_40165": {
    "n": "技術書(增幅防禦)",
    "type": "etc"
  },
  "l1j_item_40166": {
    "n": "技術書(尖刺盔甲)",
    "type": "etc"
  },
  "l1j_item_40167": {
    "n": "古老皮袋",
    "type": "etc"
  },
  "l1j_item_40168": {
    "n": "古老絲袋",
    "type": "etc"
  },
  "l1j_item_40169": {
    "n": "飛龍之心",
    "type": "etc"
  },
  "l1j_item_40170": {
    "n": "魔法書 (燃燒的火球)",
    "type": "etc"
  },
  "l1j_item_40171": {
    "n": "魔法書 (通暢氣脈術)",
    "type": "etc"
  },
  "l1j_item_40172": {
    "n": "魔法書 (壞物術)",
    "type": "etc"
  },
  "l1j_item_40173": {
    "n": "魔法書 (吸血鬼之吻)",
    "type": "etc"
  },
  "l1j_item_40174": {
    "n": "魔法書 (緩速術)",
    "type": "etc"
  },
  "l1j_item_40175": {
    "n": "魔法書 (魔法屏障)",
    "type": "etc"
  },
  "l1j_item_40176": {
    "n": "魔法書 (冥想術)",
    "type": "etc"
  },
  "l1j_item_40177": {
    "n": "魔法書 (岩牢)",
    "type": "etc"
  },
  "l1j_item_40178": {
    "n": "魔法書 (木乃伊的詛咒)",
    "type": "etc"
  },
  "l1j_item_40179": {
    "n": "魔法書 (極道落雷)",
    "type": "etc"
  },
  "l1j_item_40180": {
    "n": "魔法書 (高級治癒術)",
    "type": "etc"
  },
  "l1j_item_40181": {
    "n": "魔法書 (迷魅術)",
    "type": "etc"
  },
  "l1j_item_40182": {
    "n": "魔法書 (聖潔之光)",
    "type": "etc"
  },
  "l1j_item_40183": {
    "n": "魔法書 (冰錐)",
    "type": "etc"
  },
  "l1j_item_40184": {
    "n": "魔法書 (魔力奪取)",
    "type": "etc"
  },
  "l1j_item_40185": {
    "n": "魔法書 (黑闇之影)",
    "type": "etc"
  },
  "l1j_item_40186": {
    "n": "魔法書 (造屍術)",
    "type": "etc"
  },
  "l1j_item_40187": {
    "n": "魔法書 (體魄強健術)",
    "type": "etc"
  },
  "l1j_item_40188": {
    "n": "魔法書 (加速術)",
    "type": "etc"
  },
  "l1j_item_40189": {
    "n": "魔法書 (魔法相消術)",
    "type": "etc"
  },
  "l1j_item_40190": {
    "n": "魔法書 (地裂術)",
    "type": "etc"
  },
  "l1j_item_40191": {
    "n": "魔法書 (烈炎術)",
    "type": "etc"
  },
  "l1j_item_40192": {
    "n": "魔法書 (弱化術)",
    "type": "etc"
  },
  "l1j_item_40193": {
    "n": "魔法書 (祝福魔法武器)",
    "type": "etc"
  },
  "l1j_item_40194": {
    "n": "魔法書 (體力回復術)",
    "type": "etc"
  },
  "l1j_item_40195": {
    "n": "魔法書 (冰矛圍籬)",
    "type": "etc"
  },
  "l1j_item_40196": {
    "n": "魔法書 (召喚術)",
    "type": "etc"
  },
  "l1j_item_40197": {
    "n": "魔法書 (神聖疾走)",
    "type": "etc"
  },
  "l1j_item_40198": {
    "n": "魔法書 (龍捲風)",
    "type": "etc"
  },
  "l1j_item_40199": {
    "n": "魔法書 (強力加速術)",
    "type": "etc"
  },
  "l1j_item_40200": {
    "n": "魔法書 (狂暴術)",
    "type": "etc"
  },
  "l1j_item_40201": {
    "n": "魔法書 (疾病術)",
    "type": "etc"
  },
  "l1j_item_40202": {
    "n": "魔法書 (全部治癒術)",
    "type": "etc"
  },
  "l1j_item_40203": {
    "n": "魔法書 (火牢)",
    "type": "etc"
  },
  "l1j_item_40204": {
    "n": "魔法書 (冰雪暴)",
    "type": "etc"
  },
  "l1j_item_40205": {
    "n": "魔法書 (隱身術)",
    "type": "etc"
  },
  "l1j_item_40206": {
    "n": "魔法書 (返生術)",
    "type": "etc"
  },
  "l1j_item_40207": {
    "n": "魔法書 (震裂術)",
    "type": "etc"
  },
  "l1j_item_40208": {
    "n": "魔法書 (治癒能量風暴)",
    "type": "etc"
  },
  "l1j_item_40209": {
    "n": "魔法書 (魔法封印)",
    "type": "etc"
  },
  "l1j_item_40210": {
    "n": "魔法書 (雷霆風暴)",
    "type": "etc"
  },
  "l1j_item_40211": {
    "n": "魔法書 (沉睡之霧)",
    "type": "etc"
  },
  "l1j_item_40212": {
    "n": "魔法書 (變形術)",
    "type": "etc"
  },
  "l1j_item_40213": {
    "n": "魔法書 (聖結界)",
    "type": "etc"
  },
  "l1j_item_40214": {
    "n": "魔法書 (集體傳送術)",
    "type": "etc"
  },
  "l1j_item_40215": {
    "n": "魔法書 (火風暴)",
    "type": "etc"
  },
  "l1j_item_40216": {
    "n": "魔法書 (藥水霜化術)",
    "type": "etc"
  },
  "l1j_item_40217": {
    "n": "魔法書 (強力無所遁形術)",
    "type": "etc"
  },
  "l1j_item_40218": {
    "n": "魔法書 (創造魔法武器)",
    "type": "etc"
  },
  "l1j_item_40219": {
    "n": "魔法書 (流星雨)",
    "type": "etc"
  },
  "l1j_item_40220": {
    "n": "魔法書 (終極返生術)",
    "type": "etc"
  },
  "l1j_item_40221": {
    "n": "魔法書 (集體緩速術)",
    "type": "etc"
  },
  "l1j_item_40222": {
    "n": "魔法書 (究極光裂術)",
    "type": "etc"
  },
  "l1j_item_40223": {
    "n": "魔法書 (絕對屏障)",
    "type": "etc"
  },
  "l1j_item_40224": {
    "n": "魔法書 (靈魂昇華)",
    "type": "etc"
  },
  "l1j_item_40225": {
    "n": "魔法書 (冰雪颶風)",
    "type": "etc"
  },
  "l1j_item_40226": {
    "n": "魔法書 (精準目標)",
    "type": "etc"
  },
  "l1j_item_40227": {
    "n": "魔法書 (激勵士氣)",
    "type": "etc"
  },
  "l1j_item_40228": {
    "n": "魔法書 (呼喚盟友)",
    "type": "etc"
  },
  "l1j_item_40229": {
    "n": "魔法書(鋼鐵士氣)",
    "type": "etc"
  },
  "l1j_item_40230": {
    "n": "魔法書(衝擊士氣)",
    "type": "etc"
  },
  "l1j_item_40231": {
    "n": "魔法書(援護盟友)",
    "type": "etc"
  },
  "l1j_item_40232": {
    "n": "精靈水晶(魔法防禦)",
    "type": "etc"
  },
  "l1j_item_40233": {
    "n": "精靈水晶(心靈轉換)",
    "type": "etc"
  },
  "l1j_item_40234": {
    "n": "精靈水晶(世界樹的呼喚)",
    "type": "etc"
  },
  "l1j_item_40235": {
    "n": "精靈水晶(淨化精神)",
    "type": "etc"
  },
  "l1j_item_40236": {
    "n": "精靈水晶(屬性防禦)",
    "type": "etc"
  },
  "l1j_item_40237": {
    "n": "精靈水晶(釋放元素)",
    "type": "etc"
  },
  "l1j_item_40238": {
    "n": "精靈水晶(魂體轉換)",
    "type": "etc"
  },
  "l1j_item_40239": {
    "n": "精靈水晶(單屬性防禦)",
    "type": "etc"
  },
  "l1j_item_40240": {
    "n": "精靈水晶(三重矢)",
    "type": "etc"
  },
  "l1j_item_40241": {
    "n": "精靈水晶(弱化屬性)",
    "type": "etc"
  },
  "l1j_item_40242": {
    "n": "精靈水晶(魔法消除)",
    "type": "etc"
  },
  "l1j_item_40243": {
    "n": "精靈水晶(召喚屬性精靈)",
    "type": "etc"
  },
  "l1j_item_40244": {
    "n": "精靈水晶(封印禁地)",
    "type": "etc"
  },
  "l1j_item_40245": {
    "n": "精靈水晶(召喚強力屬性精靈)",
    "type": "etc"
  },
  "l1j_item_40246": {
    "n": "精靈水晶(鏡反射)",
    "type": "etc"
  },
  "l1j_item_40247": {
    "n": "精靈水晶(大地防護)",
    "type": "etc"
  },
  "l1j_item_40248": {
    "n": "精靈水晶(地面障礙)",
    "type": "etc"
  },
  "l1j_item_40249": {
    "n": "精靈水晶(大地屏障)",
    "type": "etc"
  },
  "l1j_item_40250": {
    "n": "精靈水晶(大地的祝福)",
    "type": "etc"
  },
  "l1j_item_40251": {
    "n": "精靈水晶(鋼鐵防護)",
    "type": "etc"
  },
  "l1j_item_40252": {
    "n": "精靈水晶(體能激發)",
    "type": "etc"
  },
  "l1j_item_40253": {
    "n": "精靈水晶(水之元氣)",
    "type": "etc"
  },
  "l1j_item_40254": {
    "n": "精靈水晶(生命之泉)",
    "type": "etc"
  },
  "l1j_item_40255": {
    "n": "精靈水晶(生命的祝福)",
    "type": "etc"
  },
  "l1j_item_40256": {
    "n": "精靈水晶(火焰武器)",
    "type": "etc"
  },
  "l1j_item_40257": {
    "n": "精靈水晶(烈炎氣息)",
    "type": "etc"
  },
  "l1j_item_40258": {
    "n": "精靈水晶(烈炎武器)",
    "type": "etc"
  },
  "l1j_item_40259": {
    "n": "精靈水晶(屬性之火)",
    "type": "etc"
  },
  "l1j_item_40260": {
    "n": "精靈水晶(風之神射)",
    "type": "etc"
  },
  "l1j_item_40261": {
    "n": "精靈水晶(風之疾走)",
    "type": "etc"
  },
  "l1j_item_40262": {
    "n": "精靈水晶(暴風之眼)",
    "type": "etc"
  },
  "l1j_item_40263": {
    "n": "精靈水晶(暴風神射)",
    "type": "etc"
  },
  "l1j_item_40264": {
    "n": "精靈水晶(風之枷鎖)",
    "type": "etc"
  },
  "l1j_item_40265": {
    "n": "黑暗精靈水晶(暗隱術)",
    "type": "etc"
  },
  "l1j_item_40266": {
    "n": "黑暗精靈水晶(附加劇毒)",
    "type": "etc"
  },
  "l1j_item_40267": {
    "n": "黑暗精靈水晶(影之防護)",
    "type": "etc"
  },
  "l1j_item_40268": {
    "n": "黑暗精靈水晶(提煉魔石)",
    "type": "etc"
  },
  "l1j_item_40269": {
    "n": "黑暗精靈水晶(力量提升)",
    "type": "etc"
  },
  "l1j_item_40270": {
    "n": "黑暗精靈水晶(行走加速)",
    "type": "etc"
  },
  "l1j_item_40271": {
    "n": "黑暗精靈水晶(燃燒鬥志)",
    "type": "etc"
  },
  "l1j_item_40272": {
    "n": "黑暗精靈水晶(暗黑盲咒)",
    "type": "etc"
  },
  "l1j_item_40273": {
    "n": "黑暗精靈水晶(毒性抵抗)",
    "type": "etc"
  },
  "l1j_item_40274": {
    "n": "黑暗精靈水晶(敏捷提升)",
    "type": "etc"
  },
  "l1j_item_40275": {
    "n": "黑暗精靈水晶(雙重破壞)",
    "type": "etc"
  },
  "l1j_item_40276": {
    "n": "黑暗精靈水晶(暗影閃避)",
    "type": "etc"
  },
  "l1j_item_40277": {
    "n": "黑暗精靈水晶(暗影之牙)",
    "type": "etc"
  },
  "l1j_item_40278": {
    "n": "黑暗精靈水晶(會心一擊)",
    "type": "etc"
  },
  "l1j_item_40279": {
    "n": "黑暗精靈水晶(閃避提升)",
    "type": "etc"
  },
  "l1j_item_40280": {
    "n": "封印的傲慢之塔傳送符11F",
    "type": "etc"
  },
  "l1j_item_40281": {
    "n": "封印的傲慢之塔傳送符21F",
    "type": "etc"
  },
  "l1j_item_40282": {
    "n": "封印的傲慢之塔傳送符31F",
    "type": "etc"
  },
  "l1j_item_40283": {
    "n": "封印的傲慢之塔傳送符41F",
    "type": "etc"
  },
  "l1j_item_40284": {
    "n": "封印的傲慢之塔傳送符51F",
    "type": "etc"
  },
  "l1j_item_40285": {
    "n": "封印的傲慢之塔傳送符61F",
    "type": "etc"
  },
  "l1j_item_40286": {
    "n": "封印的傲慢之塔傳送符71F",
    "type": "etc"
  },
  "l1j_item_40287": {
    "n": "封印的傲慢之塔傳送符81F",
    "type": "etc"
  },
  "l1j_item_40288": {
    "n": "封印的傲慢之塔傳送符91F",
    "type": "etc"
  },
  "l1j_item_40289": {
    "n": "傲慢之塔傳送符11F",
    "type": "etc"
  },
  "l1j_item_40290": {
    "n": "傲慢之塔傳送符21F",
    "type": "etc"
  },
  "l1j_item_40291": {
    "n": "傲慢之塔傳送符31F",
    "type": "etc"
  },
  "l1j_item_40292": {
    "n": "傲慢之塔傳送符41F",
    "type": "etc"
  },
  "l1j_item_40293": {
    "n": "傲慢之塔傳送符51F",
    "type": "etc"
  },
  "l1j_item_40294": {
    "n": "傲慢之塔傳送符61F",
    "type": "etc"
  },
  "l1j_item_40295": {
    "n": "傲慢之塔傳送符71F",
    "type": "etc"
  },
  "l1j_item_40296": {
    "n": "傲慢之塔傳送符81F",
    "type": "etc"
  },
  "l1j_item_40297": {
    "n": "傲慢之塔傳送符91F",
    "type": "etc"
  },
  "l1j_item_40298": {
    "n": "往說話之島的船票",
    "type": "etc"
  },
  "l1j_item_40299": {
    "n": "往古魯丁的船票",
    "type": "etc"
  },
  "l1j_item_40300": {
    "n": "遺忘之島船票",
    "type": "etc"
  },
  "l1j_item_40301": {
    "n": "海音港口船票",
    "type": "etc"
  },
  "l1j_item_40302": {
    "n": "海賊島船票",
    "type": "etc"
  },
  "l1j_item_40303": {
    "n": "隱藏港口船票",
    "type": "etc"
  },
  "l1j_item_40304": {
    "n": "馬普勒之石",
    "type": "etc"
  },
  "l1j_item_40305": {
    "n": "帕格里奧之石",
    "type": "etc"
  },
  "l1j_item_40306": {
    "n": "伊娃之石",
    "type": "etc"
  },
  "l1j_item_40307": {
    "n": "沙哈之石",
    "type": "etc"
  },
  "l1j_item_40308": {
    "n": "金幣",
    "type": "etc"
  },
  "l1j_item_40309": {
    "n": "食人妖精競賽票",
    "type": "etc"
  },
  "l1j_item_40310": {
    "n": "信紙",
    "type": "etc"
  },
  "l1j_item_40311": {
    "n": "血盟的信紙",
    "type": "etc"
  },
  "l1j_item_40312": {
    "n": "旅館鑰匙",
    "type": "etc"
  },
  "l1j_item_40313": {
    "n": "銀鑰匙",
    "type": "etc"
  },
  "l1j_item_40314": {
    "n": "項圈",
    "type": "etc"
  },
  "l1j_item_40315": {
    "n": "哨子",
    "type": "etc"
  },
  "l1j_item_40316": {
    "n": "項圈",
    "type": "etc"
  },
  "l1j_item_40317": {
    "n": "磨刀石",
    "type": "etc"
  },
  "l1j_item_40318": {
    "n": "魔法寶石",
    "type": "etc"
  },
  "l1j_item_40319": {
    "n": "精靈玉",
    "type": "etc"
  },
  "l1j_item_40320": {
    "n": "一級黑魔石",
    "type": "etc"
  },
  "l1j_item_40321": {
    "n": "二級黑魔石",
    "type": "etc"
  },
  "l1j_item_40322": {
    "n": "三級黑魔石",
    "type": "etc"
  },
  "l1j_item_40323": {
    "n": "四級黑魔石",
    "type": "etc"
  },
  "l1j_item_40324": {
    "n": "五級黑魔石",
    "type": "etc"
  },
  "l1j_item_40325": {
    "n": "2階段魔法骰子",
    "type": "etc"
  },
  "l1j_item_40326": {
    "n": "3階段魔法骰子",
    "type": "etc"
  },
  "l1j_item_40327": {
    "n": "4階段魔法骰子",
    "type": "etc"
  },
  "l1j_item_40328": {
    "n": "6階段魔法骰子",
    "type": "etc"
  },
  "l1j_item_40329": {
    "n": "原住民圖騰",
    "type": "etc"
  },
  "l1j_item_40330": {
    "n": "無限箭筒",
    "type": "etc"
  },
  "l1j_item_40331": {
    "n": "肯特勇士之劍",
    "type": "etc"
  },
  "l1j_item_40332": {
    "n": "肯特射手之弓",
    "type": "etc"
  },
  "l1j_item_40333": {
    "n": "肯特法師魔杖",
    "type": "etc"
  },
  "l1j_item_40334": {
    "n": "肯特刺客雙刀",
    "type": "etc"
  },
  "l1j_item_40335": {
    "n": "肯特戰士斧頭",
    "type": "etc"
  },
  "l1j_item_40336": {
    "n": "肯特徽章長靴",
    "type": "etc"
  },
  "l1j_item_40337": {
    "n": "肯特徽章盔甲",
    "type": "etc"
  },
  "l1j_item_40338": {
    "n": "肯特徽章手套",
    "type": "etc"
  },
  "l1j_item_40339": {
    "n": "肯特徽章盾牌",
    "type": "etc"
  },
  "l1j_item_40340": {
    "n": "肯特徽章頭盔",
    "type": "etc"
  },
  "l1j_item_40341": {
    "n": "安塔瑞斯之鱗",
    "type": "etc"
  },
  "l1j_item_40342": {
    "n": "安塔瑞斯之爪",
    "type": "etc"
  },
  "l1j_item_40343": {
    "n": "安塔瑞斯之眼",
    "type": "etc"
  },
  "l1j_item_40344": {
    "n": "安塔瑞斯之血",
    "type": "etc"
  },
  "l1j_item_40345": {
    "n": "安塔瑞斯之肉",
    "type": "etc"
  },
  "l1j_item_40346": {
    "n": "安塔瑞斯之心",
    "type": "etc"
  },
  "l1j_item_40347": {
    "n": "安塔瑞斯之骨",
    "type": "etc"
  },
  "l1j_item_40348": {
    "n": "安塔瑞斯之牙",
    "type": "etc"
  },
  "l1j_item_40349": {
    "n": "巴拉卡斯之鱗",
    "type": "etc"
  },
  "l1j_item_40350": {
    "n": "巴拉卡斯之爪",
    "type": "etc"
  },
  "l1j_item_40351": {
    "n": "巴拉卡斯之眼",
    "type": "etc"
  },
  "l1j_item_40352": {
    "n": "巴拉卡斯之血",
    "type": "etc"
  },
  "l1j_item_40353": {
    "n": "巴拉卡斯之肉",
    "type": "etc"
  },
  "l1j_item_40354": {
    "n": "巴拉卡斯之心",
    "type": "etc"
  },
  "l1j_item_40355": {
    "n": "巴拉卡斯之骨",
    "type": "etc"
  },
  "l1j_item_40356": {
    "n": "巴拉卡斯之牙",
    "type": "etc"
  },
  "l1j_item_40357": {
    "n": "法利昂之鱗",
    "type": "etc"
  },
  "l1j_item_40358": {
    "n": "法利昂之爪",
    "type": "etc"
  },
  "l1j_item_40359": {
    "n": "法利昂之眼",
    "type": "etc"
  },
  "l1j_item_40360": {
    "n": "法利昂之血",
    "type": "etc"
  },
  "l1j_item_40361": {
    "n": "法利昂之肉",
    "type": "etc"
  },
  "l1j_item_40362": {
    "n": "法利昂之心",
    "type": "etc"
  },
  "l1j_item_40363": {
    "n": "法利昂之骨",
    "type": "etc"
  },
  "l1j_item_40364": {
    "n": "法利昂之牙",
    "type": "etc"
  },
  "l1j_item_40365": {
    "n": "林德拜爾之鱗",
    "type": "etc"
  },
  "l1j_item_40366": {
    "n": "林德拜爾之爪",
    "type": "etc"
  },
  "l1j_item_40367": {
    "n": "林德拜爾之眼",
    "type": "etc"
  },
  "l1j_item_40368": {
    "n": "林德拜爾之血",
    "type": "etc"
  },
  "l1j_item_40369": {
    "n": "林德拜爾之肉",
    "type": "etc"
  },
  "l1j_item_40370": {
    "n": "林德拜爾之心",
    "type": "etc"
  },
  "l1j_item_40371": {
    "n": "林德拜爾之骨",
    "type": "etc"
  },
  "l1j_item_40372": {
    "n": "林德拜爾之牙",
    "type": "etc"
  },
  "l1j_item_40373": {
    "n": "地圖:大陸全圖",
    "type": "etc"
  },
  "l1j_item_40374": {
    "n": "地圖:說話之島",
    "type": "etc"
  },
  "l1j_item_40375": {
    "n": "地圖:古魯丁",
    "type": "etc"
  },
  "l1j_item_40376": {
    "n": "地圖:肯特城",
    "type": "etc"
  },
  "l1j_item_40377": {
    "n": "地圖:妖魔城堡",
    "type": "etc"
  },
  "l1j_item_40378": {
    "n": "地圖:妖精森林",
    "type": "etc"
  },
  "l1j_item_40379": {
    "n": "地圖:風木之城",
    "type": "etc"
  },
  "l1j_item_40380": {
    "n": "地圖:銀騎士村莊",
    "type": "etc"
  },
  "l1j_item_40381": {
    "n": "地圖:龍之谷",
    "type": "etc"
  },
  "l1j_item_40382": {
    "n": "地圖:奇岩",
    "type": "etc"
  },
  "l1j_item_40383": {
    "n": "地圖:歌唱之島",
    "type": "etc"
  },
  "l1j_item_40384": {
    "n": "地圖:隱藏之谷",
    "type": "etc"
  },
  "l1j_item_40385": {
    "n": "地圖:海音",
    "type": "etc"
  },
  "l1j_item_40386": {
    "n": "地圖:火龍窟",
    "type": "etc"
  },
  "l1j_item_40387": {
    "n": "地圖:歐瑞",
    "type": "etc"
  },
  "l1j_item_40388": {
    "n": "地圖:亞丁",
    "type": "etc"
  },
  "l1j_item_40389": {
    "n": "地圖:沉默洞穴",
    "type": "etc"
  },
  "l1j_item_40390": {
    "n": "地圖:海賊島",
    "type": "etc"
  },
  "l1j_item_40391": {
    "n": "計算機",
    "type": "etc"
  },
  "l1j_item_40392": {
    "n": "耶誕樹",
    "type": "etc"
  },
  "l1j_item_40393": {
    "n": "火龍鱗",
    "type": "etc"
  },
  "l1j_item_40394": {
    "n": "風龍鱗",
    "type": "etc"
  },
  "l1j_item_40395": {
    "n": "水龍鱗",
    "type": "etc"
  },
  "l1j_item_40396": {
    "n": "地龍鱗",
    "type": "etc"
  },
  "l1j_item_40397": {
    "n": "奇美拉之皮(龍)",
    "type": "etc"
  },
  "l1j_item_40398": {
    "n": "奇美拉之皮(山羊)",
    "type": "etc"
  },
  "l1j_item_40399": {
    "n": "奇美拉之皮(獅子)",
    "type": "etc"
  },
  "l1j_item_40400": {
    "n": "奇美拉之皮(蛇)",
    "type": "etc"
  },
  "l1j_item_40401": {
    "n": "詛咒的皮革(火)",
    "type": "etc"
  },
  "l1j_item_40402": {
    "n": "詛咒的皮革(水)",
    "type": "etc"
  },
  "l1j_item_40403": {
    "n": "詛咒的皮革(風)",
    "type": "etc"
  },
  "l1j_item_40404": {
    "n": "詛咒的皮革(地)",
    "type": "etc"
  },
  "l1j_item_40405": {
    "n": "皮革",
    "type": "etc"
  },
  "l1j_item_40406": {
    "n": "高級皮革",
    "type": "etc"
  },
  "l1j_item_40407": {
    "n": "骨頭碎片",
    "type": "etc"
  },
  "l1j_item_40408": {
    "n": "金屬塊",
    "type": "etc"
  },
  "l1j_item_40409": {
    "n": "不死鳥之心",
    "type": "etc"
  },
  "l1j_item_40410": {
    "n": "黑暗安特的樹皮",
    "type": "etc"
  },
  "l1j_item_40411": {
    "n": "黑暗安特的水果",
    "type": "etc"
  },
  "l1j_item_40412": {
    "n": "黑暗安特的樹枝",
    "type": "etc"
  },
  "l1j_item_40413": {
    "n": "冰之女王之心",
    "type": "etc"
  },
  "l1j_item_40414": {
    "n": "鍊金術之石",
    "type": "etc"
  },
  "l1j_item_40415": {
    "n": "遺物袋子",
    "type": "etc"
  },
  "l1j_item_40416": {
    "n": "詛咒之血",
    "type": "etc"
  },
  "l1j_item_40417": {
    "n": "精靈結晶",
    "type": "etc"
  },
  "l1j_item_40418": {
    "n": "墮落的財物",
    "type": "etc"
  },
  "l1j_item_40419": {
    "n": "巨大莫妮亞蜘蛛絲",
    "type": "etc"
  },
  "l1j_item_40420": {
    "n": "古代人的咒術書1冊",
    "type": "etc"
  },
  "l1j_item_40421": {
    "n": "古代人的咒術書2冊",
    "type": "etc"
  },
  "l1j_item_40422": {
    "n": "古代人的咒術書3冊",
    "type": "etc"
  },
  "l1j_item_40423": {
    "n": "古代人的咒術書4冊",
    "type": "etc"
  },
  "l1j_item_40424": {
    "n": "狼皮",
    "type": "etc"
  },
  "l1j_item_40425": {
    "n": "黑暗棲林者藥水",
    "type": "etc"
  },
  "l1j_item_40426": {
    "n": "黑暗棲林者戒指",
    "type": "etc"
  },
  "l1j_item_40427": {
    "n": "黑暗妖精袋子",
    "type": "etc"
  },
  "l1j_item_40428": {
    "n": "月光之淚",
    "type": "etc"
  },
  "l1j_item_40429": {
    "n": "大洞穴卷軸碎片",
    "type": "etc"
  },
  "l1j_item_40430": {
    "n": "大洞穴水晶",
    "type": "etc"
  },
  "l1j_item_40431": {
    "n": "鼴鼠的皮",
    "type": "etc"
  },
  "l1j_item_40432": {
    "n": "狄亞得卷軸碎片",
    "type": "etc"
  },
  "l1j_item_40433": {
    "n": "犰狳之爪",
    "type": "etc"
  },
  "l1j_item_40434": {
    "n": "犰狳的尾巴",
    "type": "etc"
  },
  "l1j_item_40435": {
    "n": "深淵之花的花苞",
    "type": "etc"
  },
  "l1j_item_40436": {
    "n": "深淵之花的根",
    "type": "etc"
  },
  "l1j_item_40437": {
    "n": "深淵花枝條",
    "type": "etc"
  },
  "l1j_item_40438": {
    "n": "蝙蝠之牙",
    "type": "etc"
  },
  "l1j_item_40439": {
    "n": "白金金屬板",
    "type": "etc"
  },
  "l1j_item_40440": {
    "n": "白金",
    "type": "etc"
  },
  "l1j_item_40441": {
    "n": "白金原石",
    "type": "etc"
  },
  "l1j_item_40442": {
    "n": "布拉伯的胃液",
    "type": "etc"
  },
  "l1j_item_40443": {
    "n": "黑色米索莉",
    "type": "etc"
  },
  "l1j_item_40444": {
    "n": "黑色米索莉原石",
    "type": "etc"
  },
  "l1j_item_40445": {
    "n": "黑色米索莉金屬板",
    "type": "etc"
  },
  "l1j_item_40446": {
    "n": "黑法師戒指",
    "type": "etc"
  },
  "l1j_item_40447": {
    "n": "黑虎的皮",
    "type": "etc"
  },
  "l1j_item_40448": {
    "n": "黑虎的爪",
    "type": "etc"
  },
  "l1j_item_40449": {
    "n": "黑虎的牙",
    "type": "etc"
  },
  "l1j_item_40450": {
    "n": "黑暗安特的樹枝",
    "type": "etc"
  },
  "l1j_item_40451": {
    "n": "黑虎之心",
    "type": "etc"
  },
  "l1j_item_40452": {
    "n": "喚獸師戒指",
    "type": "etc"
  },
  "l1j_item_40453": {
    "n": "喚獸師長鞭",
    "type": "etc"
  },
  "l1j_item_40454": {
    "n": "馴獸師戒指",
    "type": "etc"
  },
  "l1j_item_40455": {
    "n": "藍色布料",
    "type": "etc"
  },
  "l1j_item_40456": {
    "n": "紅色布料",
    "type": "etc"
  },
  "l1j_item_40457": {
    "n": "白色布料",
    "type": "etc"
  },
  "l1j_item_40458": {
    "n": "光明的鱗片",
    "type": "etc"
  },
  "l1j_item_40459": {
    "n": "毒蠍之皮",
    "type": "etc"
  },
  "l1j_item_40460": {
    "n": "阿西塔基奧的灰燼",
    "type": "etc"
  },
  "l1j_item_40461": {
    "n": "惡魔的黑色腳鐐",
    "type": "etc"
  },
  "l1j_item_40462": {
    "n": "惡魔的紅色腳鐐",
    "type": "etc"
  },
  "l1j_item_40463": {
    "n": "惡魔的藍色腳鐐",
    "type": "etc"
  },
  "l1j_item_40464": {
    "n": "惡魔的白色腳鐐",
    "type": "etc"
  },
  "l1j_item_40465": {
    "n": "精靈使戒指",
    "type": "etc"
  },
  "l1j_item_40466": {
    "n": "龍之心",
    "type": "etc"
  },
  "l1j_item_40467": {
    "n": "銀",
    "type": "etc"
  },
  "l1j_item_40468": {
    "n": "銀原石",
    "type": "etc"
  },
  "l1j_item_40469": {
    "n": "銀金屬板",
    "type": "etc"
  },
  "l1j_item_40470": {
    "n": "原石碎片",
    "type": "etc"
  },
  "l1j_item_40471": {
    "n": "精靈碎片",
    "type": "etc"
  },
  "l1j_item_40472": {
    "n": "地獄犬之皮",
    "type": "etc"
  },
  "l1j_item_40473": {
    "n": "墮落鐮刀",
    "type": "etc"
  },
  "l1j_item_40474": {
    "n": "墮落之毒",
    "type": "etc"
  },
  "l1j_item_40475": {
    "n": "墮落首級",
    "type": "etc"
  },
  "l1j_item_40476": {
    "n": "墮落之手",
    "type": "etc"
  },
  "l1j_item_40477": {
    "n": "墮落的惡魔書1冊",
    "type": "etc"
  },
  "l1j_item_40478": {
    "n": "墮落的惡魔書2冊",
    "type": "etc"
  },
  "l1j_item_40479": {
    "n": "墮落的惡魔書3冊",
    "type": "etc"
  },
  "l1j_item_40480": {
    "n": "墮落的惡魔書4冊",
    "type": "etc"
  },
  "l1j_item_40481": {
    "n": "墮落之牙",
    "type": "etc"
  },
  "l1j_item_40482": {
    "n": "墮落之舌",
    "type": "etc"
  },
  "l1j_item_40483": {
    "n": "金屬蜈蚣的皮",
    "type": "etc"
  },
  "l1j_item_40484": {
    "n": "金屬蜈蚣的毒液",
    "type": "etc"
  },
  "l1j_item_40485": {
    "n": "金屬蜈蚣的牙",
    "type": "etc"
  },
  "l1j_item_40486": {
    "n": "火山灰",
    "type": "etc"
  },
  "l1j_item_40487": {
    "n": "黃金金屬板",
    "type": "etc"
  },
  "l1j_item_40488": {
    "n": "黃金",
    "type": "etc"
  },
  "l1j_item_40489": {
    "n": "黃金原石",
    "type": "etc"
  },
  "l1j_item_40490": {
    "n": "黑暗元素石",
    "type": "etc"
  },
  "l1j_item_40491": {
    "n": "格利芬羽毛",
    "type": "etc"
  },
  "l1j_item_40492": {
    "n": "綠水晶",
    "type": "etc"
  },
  "l1j_item_40493": {
    "n": "魔法笛子",
    "type": "etc"
  },
  "l1j_item_40494": {
    "n": "純粹的米索莉塊",
    "type": "etc"
  },
  "l1j_item_40495": {
    "n": "米索莉線",
    "type": "etc"
  },
  "l1j_item_40496": {
    "n": "粗糙的米索莉塊",
    "type": "etc"
  },
  "l1j_item_40497": {
    "n": "米索莉金屬板",
    "type": "etc"
  },
  "l1j_item_40498": {
    "n": "風之淚",
    "type": "etc"
  },
  "l1j_item_40499": {
    "n": "蘑菇汁",
    "type": "etc"
  },
  "l1j_item_40500": {
    "n": "紫水晶",
    "type": "etc"
  },
  "l1j_item_40501": {
    "n": "紅水晶",
    "type": "etc"
  },
  "l1j_item_40502": {
    "n": "線",
    "type": "etc"
  },
  "l1j_item_40503": {
    "n": "芮克妮的網",
    "type": "etc"
  },
  "l1j_item_40504": {
    "n": "芮克妮的蛻皮",
    "type": "etc"
  },
  "l1j_item_40505": {
    "n": "安特之樹皮",
    "type": "etc"
  },
  "l1j_item_40506": {
    "n": "安特的水果",
    "type": "etc"
  },
  "l1j_item_40507": {
    "n": "安特之樹枝",
    "type": "etc"
  },
  "l1j_item_40508": {
    "n": "奧里哈魯根",
    "type": "etc"
  },
  "l1j_item_40509": {
    "n": "奧里哈魯根金屬板",
    "type": "etc"
  },
  "l1j_item_40510": {
    "n": "污濁安特的樹皮",
    "type": "etc"
  },
  "l1j_item_40511": {
    "n": "污濁安特的水果",
    "type": "etc"
  },
  "l1j_item_40512": {
    "n": "污濁安特的樹枝",
    "type": "etc"
  },
  "l1j_item_40513": {
    "n": "食人巨魔的血",
    "type": "etc"
  },
  "l1j_item_40514": {
    "n": "精靈之淚",
    "type": "etc"
  },
  "l1j_item_40515": {
    "n": "元素石",
    "type": "etc"
  },
  "l1j_item_40516": {
    "n": "品質綠水晶",
    "type": "etc"
  },
  "l1j_item_40517": {
    "n": "品質紅水晶",
    "type": "etc"
  },
  "l1j_item_40518": {
    "n": "品質藍水晶",
    "type": "etc"
  },
  "l1j_item_40519": {
    "n": "潘的鬃毛",
    "type": "etc"
  },
  "l1j_item_40520": {
    "n": "精靈粉末",
    "type": "etc"
  },
  "l1j_item_40521": {
    "n": "精靈羽翼",
    "type": "etc"
  },
  "l1j_item_40522": {
    "n": "藍水晶",
    "type": "etc"
  },
  "l1j_item_40523": {
    "n": "白水晶",
    "type": "etc"
  },
  "l1j_item_40524": {
    "n": "黑色血痕",
    "type": "etc"
  },
  "l1j_item_40525": {
    "n": "格蘭肯之淚",
    "type": "etc"
  },
  "l1j_item_40526": {
    "n": "薄金屬板",
    "type": "etc"
  },
  "l1j_item_40527": {
    "n": "鋤頭",
    "type": "etc"
  },
  "l1j_item_40528": {
    "n": "守護神之袋",
    "type": "etc"
  },
  "l1j_item_40529": {
    "n": "感謝信",
    "type": "etc"
  },
  "l1j_item_40530": {
    "n": "古代王族的鑰匙",
    "type": "etc"
  },
  "l1j_item_40531": {
    "n": "古代騎士的鑰匙",
    "type": "etc"
  },
  "l1j_item_40532": {
    "n": "古代法師的鑰匙",
    "type": "etc"
  },
  "l1j_item_40533": {
    "n": "古代鑰匙(下半部)",
    "type": "etc"
  },
  "l1j_item_40534": {
    "n": "古代鑰匙(上半部)",
    "type": "etc"
  },
  "l1j_item_40535": {
    "n": "古代妖精的鑰匙",
    "type": "etc"
  },
  "l1j_item_40536": {
    "n": "古代惡魔的記載",
    "type": "etc"
  },
  "l1j_item_40537": {
    "n": "古代的遺物",
    "type": "etc"
  },
  "l1j_item_40538": {
    "n": "食屍鬼的指甲",
    "type": "etc"
  },
  "l1j_item_40539": {
    "n": "食屍鬼的牙齒",
    "type": "etc"
  },
  "l1j_item_40540": {
    "n": "古老的交易文件",
    "type": "etc"
  },
  "l1j_item_40541": {
    "n": "黑暗之星",
    "type": "etc"
  },
  "l1j_item_40542": {
    "n": "變形怪的血",
    "type": "etc"
  },
  "l1j_item_40543": {
    "n": "蛇女房間鑰匙",
    "type": "etc"
  },
  "l1j_item_40544": {
    "n": "蛇女之鱗",
    "type": "etc"
  },
  "l1j_item_40545": {
    "n": "倫得之袋",
    "type": "etc"
  },
  "l1j_item_40546": {
    "n": "馬沙之袋",
    "type": "etc"
  },
  "l1j_item_40547": {
    "n": "村民的遺物",
    "type": "etc"
  },
  "l1j_item_40548": {
    "n": "古代亡靈之袋",
    "type": "etc"
  },
  "l1j_item_40549": {
    "n": "炎魔之劍",
    "type": "etc"
  },
  "l1j_item_40550": {
    "n": "炎魔之眼",
    "type": "etc"
  },
  "l1j_item_40551": {
    "n": "炎魔之爪",
    "type": "etc"
  },
  "l1j_item_40552": {
    "n": "炎魔之心",
    "type": "etc"
  },
  "l1j_item_40553": {
    "n": "布魯迪卡之袋",
    "type": "etc"
  },
  "l1j_item_40554": {
    "n": "秘密名單",
    "type": "etc"
  },
  "l1j_item_40555": {
    "n": "密室鑰匙",
    "type": "etc"
  },
  "l1j_item_40556": {
    "n": "暗殺名單之袋",
    "type": "etc"
  },
  "l1j_item_40557": {
    "n": "暗殺名單(古魯丁村)",
    "type": "etc"
  },
  "l1j_item_40558": {
    "n": "暗殺名單(奇岩村)",
    "type": "etc"
  },
  "l1j_item_40559": {
    "n": "暗殺名單(亞丁城鎮)",
    "type": "etc"
  },
  "l1j_item_40560": {
    "n": "暗殺名單(風木村)",
    "type": "etc"
  },
  "l1j_item_40561": {
    "n": "暗殺名單(肯特村)",
    "type": "etc"
  },
  "l1j_item_40562": {
    "n": "暗殺名單(海音村)",
    "type": "etc"
  },
  "l1j_item_40563": {
    "n": "暗殺名單(燃柳村)",
    "type": "etc"
  },
  "l1j_item_40564": {
    "n": "生命的卷軸",
    "type": "etc"
  },
  "l1j_item_40565": {
    "n": "搜索狀",
    "type": "etc"
  },
  "l1j_item_40566": {
    "n": "神秘貝殼",
    "type": "etc"
  },
  "l1j_item_40567": {
    "n": "神秘水晶球",
    "type": "etc"
  },
  "l1j_item_40568": {
    "n": "神秘的袋子",
    "type": "etc"
  },
  "l1j_item_40569": {
    "n": "神秘魔杖",
    "type": "etc"
  },
  "l1j_item_40570": {
    "n": "艾莉亞的回報",
    "type": "etc"
  },
  "l1j_item_40571": {
    "n": "刺客首領的箱子",
    "type": "etc"
  },
  "l1j_item_40572": {
    "n": "刺客之證",
    "type": "etc"
  },
  "l1j_item_40573": {
    "n": "靈魂之證",
    "type": "etc"
  },
  "l1j_item_40574": {
    "n": "靈魂之證",
    "type": "etc"
  },
  "l1j_item_40575": {
    "n": "靈魂之證",
    "type": "etc"
  },
  "l1j_item_40576": {
    "n": "靈魂水晶",
    "type": "etc"
  },
  "l1j_item_40577": {
    "n": "靈魂水晶",
    "type": "etc"
  },
  "l1j_item_40578": {
    "n": "靈魂水晶",
    "type": "etc"
  },
  "l1j_item_40579": {
    "n": "不死族的骨頭",
    "type": "etc"
  },
  "l1j_item_40580": {
    "n": "不死族的骨頭碎片",
    "type": "etc"
  },
  "l1j_item_40581": {
    "n": "不死族的鑰匙",
    "type": "etc"
  },
  "l1j_item_40582": {
    "n": "安迪亞之袋",
    "type": "etc"
  },
  "l1j_item_40583": {
    "n": "安迪亞之信",
    "type": "etc"
  },
  "l1j_item_40584": {
    "n": "雪怪首級",
    "type": "etc"
  },
  "l1j_item_40585": {
    "n": "妖魔長老首級",
    "type": "etc"
  },
  "l1j_item_40586": {
    "n": "王族徽章的碎片",
    "type": "etc"
  },
  "l1j_item_40587": {
    "n": "王族徽章的碎片",
    "type": "etc"
  },
  "l1j_item_40588": {
    "n": "妖精族寶物",
    "type": "etc"
  },
  "l1j_item_40589": {
    "n": "文明的鑰匙",
    "type": "etc"
  },
  "l1j_item_40590": {
    "n": "楊果里恩之爪",
    "type": "etc"
  },
  "l1j_item_40591": {
    "n": "受詛咒的魔法書",
    "type": "etc"
  },
  "l1j_item_40592": {
    "n": "受詛咒的精靈書",
    "type": "etc"
  },
  "l1j_item_40593": {
    "n": "調查簿的缺頁",
    "type": "etc"
  },
  "l1j_item_40594": {
    "n": "殭屍鑰匙",
    "type": "etc"
  },
  "l1j_item_40595": {
    "n": "死亡之證",
    "type": "etc"
  },
  "l1j_item_40596": {
    "n": "死亡誓約",
    "type": "etc"
  },
  "l1j_item_40597": {
    "n": "破損的調查簿",
    "type": "etc"
  },
  "l1j_item_40598": {
    "n": "康之袋",
    "type": "etc"
  },
  "l1j_item_40599": {
    "n": "塔拉斯的魔法袋",
    "type": "etc"
  },
  "l1j_item_40600": {
    "n": "墮落鑰匙",
    "type": "etc"
  },
  "l1j_item_40601": {
    "n": "龍龜甲",
    "type": "etc"
  },
  "l1j_item_40602": {
    "n": "藍色長笛",
    "type": "etc"
  },
  "l1j_item_40603": {
    "n": "蘑菇毒液",
    "type": "etc"
  },
  "l1j_item_40604": {
    "n": "骷髏鑰匙",
    "type": "etc"
  },
  "l1j_item_40605": {
    "n": "骷髏頭",
    "type": "etc"
  },
  "l1j_item_40606": {
    "n": "混沌鑰匙",
    "type": "etc"
  },
  "l1j_item_40607": {
    "n": "返生藥水",
    "type": "etc"
  },
  "l1j_item_40608": {
    "n": "黑騎士的誓約",
    "type": "etc"
  },
  "l1j_item_40609": {
    "n": "甘地妖魔魔法書",
    "type": "etc"
  },
  "l1j_item_40610": {
    "n": "那魯加妖魔魔法書",
    "type": "etc"
  },
  "l1j_item_40611": {
    "n": "都達瑪拉妖魔魔法書",
    "type": "etc"
  },
  "l1j_item_40612": {
    "n": "阿吐巴妖魔魔法書",
    "type": "etc"
  },
  "l1j_item_40613": {
    "n": "黑鑰匙",
    "type": "etc"
  },
  "l1j_item_40614": {
    "n": "礦物收集文件",
    "type": "etc"
  },
  "l1j_item_40615": {
    "n": "暗影神殿2樓鑰匙",
    "type": "etc"
  },
  "l1j_item_40616": {
    "n": "暗影神殿3樓鑰匙",
    "type": "etc"
  },
  "l1j_item_40617": {
    "n": "水晶球",
    "type": "etc"
  },
  "l1j_item_40618": {
    "n": "土之氣息",
    "type": "etc"
  },
  "l1j_item_40619": {
    "n": "東方監獄鑰匙",
    "type": "etc"
  },
  "l1j_item_40620": {
    "n": "第二迷宮鑰匙",
    "type": "etc"
  },
  "l1j_item_40621": {
    "n": "德雷克鑰匙",
    "type": "etc"
  },
  "l1j_item_40622": {
    "n": "飛龍的爪子",
    "type": "etc"
  },
  "l1j_item_40623": {
    "n": "多魯嘉1世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40624": {
    "n": "多魯嘉2世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40625": {
    "n": "多魯嘉3世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40626": {
    "n": "多魯嘉4世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40627": {
    "n": "多魯嘉5世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40628": {
    "n": "多魯嘉6世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40629": {
    "n": "多魯嘉7世傳家之寶",
    "type": "etc"
  },
  "l1j_item_40630": {
    "n": "迪哥的舊日記",
    "type": "etc"
  },
  "l1j_item_40631": {
    "n": "萊斯塔的戒指",
    "type": "etc"
  },
  "l1j_item_40632": {
    "n": "雷奧納的袋子",
    "type": "etc"
  },
  "l1j_item_40633": {
    "n": "蜥蜴人的報告",
    "type": "etc"
  },
  "l1j_item_40634": {
    "n": "蜥蜴人的寶物",
    "type": "etc"
  },
  "l1j_item_40635": {
    "n": "法令軍團印記",
    "type": "etc"
  },
  "l1j_item_40636": {
    "n": "法令軍王印記盒",
    "type": "etc"
  },
  "l1j_item_40637": {
    "n": "瑪勒巴的信",
    "type": "etc"
  },
  "l1j_item_40638": {
    "n": "魔獸軍團印記",
    "type": "etc"
  },
  "l1j_item_40639": {
    "n": "魔獸軍王印記盒",
    "type": "etc"
  },
  "l1j_item_40640": {
    "n": "冥法軍王印記盒",
    "type": "etc"
  },
  "l1j_item_40641": {
    "n": "說話卷軸",
    "type": "etc"
  },
  "l1j_item_40642": {
    "n": "冥法軍團印記",
    "type": "etc"
  },
  "l1j_item_40643": {
    "n": "水之氣息",
    "type": "etc"
  },
  "l1j_item_40644": {
    "n": "迷宮構造圖",
    "type": "etc"
  },
  "l1j_item_40645": {
    "n": "風之氣息",
    "type": "etc"
  },
  "l1j_item_40646": {
    "n": "蜥蜴的角",
    "type": "etc"
  },
  "l1j_item_40647": {
    "n": "藏寶圖碎片",
    "type": "etc"
  },
  "l1j_item_40648": {
    "n": "生鏽的刺客之劍",
    "type": "etc"
  },
  "l1j_item_40649": {
    "n": "東北方監獄鑰匙",
    "type": "etc"
  },
  "l1j_item_40650": {
    "n": "北方監獄鑰匙",
    "type": "etc"
  },
  "l1j_item_40651": {
    "n": "火之氣息",
    "type": "etc"
  },
  "l1j_item_40652": {
    "n": "燃燒的皮",
    "type": "etc"
  },
  "l1j_item_40653": {
    "n": "紅鑰匙",
    "type": "etc"
  },
  "l1j_item_40654": {
    "n": "第三迷宮鑰匙",
    "type": "etc"
  },
  "l1j_item_40655": {
    "n": "水晶之牙",
    "type": "etc"
  },
  "l1j_item_40656": {
    "n": "試煉之劍A",
    "type": "etc"
  },
  "l1j_item_40657": {
    "n": "試煉之劍B",
    "type": "etc"
  },
  "l1j_item_40658": {
    "n": "試煉之劍C",
    "type": "etc"
  },
  "l1j_item_40659": {
    "n": "試煉之劍D",
    "type": "etc"
  },
  "l1j_item_40660": {
    "n": "試煉卷軸",
    "type": "etc"
  },
  "l1j_item_40661": {
    "n": "兒子的遺骸",
    "type": "etc"
  },
  "l1j_item_40662": {
    "n": "兒子的肖像畫",
    "type": "etc"
  },
  "l1j_item_40663": {
    "n": "兒子的信",
    "type": "etc"
  },
  "l1j_item_40664": {
    "n": "阿拉斯的護身符",
    "type": "etc"
  },
  "l1j_item_40665": {
    "n": "阿拉斯的信",
    "type": "etc"
  },
  "l1j_item_40666": {
    "n": "無法得知的傳家之寶",
    "type": "etc"
  },
  "l1j_item_40667": {
    "n": "暗殺軍團印記",
    "type": "etc"
  },
  "l1j_item_40668": {
    "n": "暗殺軍王印記盒",
    "type": "etc"
  },
  "l1j_item_40669": {
    "n": "火焰之影肋骨",
    "type": "etc"
  },
  "l1j_item_40670": {
    "n": "火焰之影尾巴",
    "type": "etc"
  },
  "l1j_item_40671": {
    "n": "火焰之影骨翼",
    "type": "etc"
  },
  "l1j_item_40672": {
    "n": "火焰之影脊椎",
    "type": "etc"
  },
  "l1j_item_40673": {
    "n": "火焰之影首級",
    "type": "etc"
  },
  "l1j_item_40674": {
    "n": "火焰之影指甲",
    "type": "etc"
  },
  "l1j_item_40675": {
    "n": "黑暗礦石",
    "type": "etc"
  },
  "l1j_item_40676": {
    "n": "闇之氣息",
    "type": "etc"
  },
  "l1j_item_40677": {
    "n": "黑暗礦石鑄塊",
    "type": "etc"
  },
  "l1j_item_40678": {
    "n": "靈魂石碎片",
    "type": "etc"
  },
  "l1j_item_40679": {
    "n": "污濁的金甲",
    "type": "etc"
  },
  "l1j_item_40680": {
    "n": "污濁斗篷",
    "type": "etc"
  },
  "l1j_item_40681": {
    "n": "污濁的鋼靴",
    "type": "etc"
  },
  "l1j_item_40682": {
    "n": "污濁的腕甲",
    "type": "etc"
  },
  "l1j_item_40683": {
    "n": "污濁的頭盔",
    "type": "etc"
  },
  "l1j_item_40684": {
    "n": "污濁的弓",
    "type": "etc"
  },
  "l1j_item_40685": {
    "n": "未磨光的雕像",
    "type": "etc"
  },
  "l1j_item_40686": {
    "n": "完成品的雕像",
    "type": "etc"
  },
  "l1j_item_40687": {
    "n": "歐姆的袋子",
    "type": "etc"
  },
  "l1j_item_40688": {
    "n": "未上漆的雕像",
    "type": "etc"
  },
  "l1j_item_40689": {
    "n": "未精雕的雕像",
    "type": "etc"
  },
  "l1j_item_40690": {
    "n": "未修補的雕像",
    "type": "etc"
  },
  "l1j_item_40691": {
    "n": "半成品的雕像",
    "type": "etc"
  },
  "l1j_item_40692": {
    "n": "完成的藏寶圖",
    "type": "etc"
  },
  "l1j_item_40693": {
    "n": "遠征隊金甲",
    "type": "etc"
  },
  "l1j_item_40694": {
    "n": "遠征隊斗篷",
    "type": "etc"
  },
  "l1j_item_40695": {
    "n": "遠征隊鋼靴",
    "type": "etc"
  },
  "l1j_item_40696": {
    "n": "遠征隊的遺物",
    "type": "etc"
  },
  "l1j_item_40697": {
    "n": "遠征隊腕甲",
    "type": "etc"
  },
  "l1j_item_40698": {
    "n": "遠征隊頭盔",
    "type": "etc"
  },
  "l1j_item_40699": {
    "n": "遠征隊弓",
    "type": "etc"
  },
  "l1j_item_40700": {
    "n": "銀笛",
    "type": "etc"
  },
  "l1j_item_40701": {
    "n": "小藏寶圖",
    "type": "etc"
  },
  "l1j_item_40702": {
    "n": "小袋子",
    "type": "etc"
  },
  "l1j_item_40703": {
    "n": "心靈支配石",
    "type": "etc"
  },
  "l1j_item_40704": {
    "n": "死亡尾骨",
    "type": "etc"
  },
  "l1j_item_40705": {
    "n": "死亡巨斧",
    "type": "etc"
  },
  "l1j_item_40706": {
    "n": "死亡戰鎚",
    "type": "etc"
  },
  "l1j_item_40707": {
    "n": "死亡首級",
    "type": "etc"
  },
  "l1j_item_40708": {
    "n": "死亡長矛",
    "type": "etc"
  },
  "l1j_item_40709": {
    "n": "死亡之劍",
    "type": "etc"
  },
  "l1j_item_40710": {
    "n": "朋友的袋子",
    "type": "etc"
  },
  "l1j_item_40711": {
    "n": "卡得穆斯項鍊",
    "type": "etc"
  },
  "l1j_item_40712": {
    "n": "卡立普的高級袋子",
    "type": "etc"
  },
  "l1j_item_40713": {
    "n": "卡立普的袋子",
    "type": "etc"
  },
  "l1j_item_40714": {
    "n": "藍尾蜥蜴之皮",
    "type": "etc"
  },
  "l1j_item_40715": {
    "n": "皮爾斯的禮物",
    "type": "etc"
  },
  "l1j_item_40716": {
    "n": "爺爺的寶物",
    "type": "etc"
  },
  "l1j_item_40717": {
    "n": "弄縐的情書",
    "type": "etc"
  },
  "l1j_item_40718": {
    "n": "血石碎片",
    "type": "etc"
  },
  "l1j_item_40719": {
    "n": "混沌首級",
    "type": "etc"
  },
  "l1j_item_40720": {
    "n": "黑暗之翼",
    "type": "etc"
  },
  "l1j_item_40721": {
    "n": "巨大南瓜種子",
    "type": "etc"
  },
  "l1j_item_40722": {
    "n": "金南瓜",
    "type": "etc"
  },
  "l1j_item_40723": {
    "n": "銀南瓜",
    "type": "etc"
  },
  "l1j_item_40724": {
    "n": "銅南瓜",
    "type": "etc"
  },
  "l1j_item_40725": {
    "n": "南瓜糖果",
    "type": "etc"
  },
  "l1j_item_40726": {
    "n": "南瓜種子",
    "type": "etc"
  },
  "l1j_item_40727": {
    "n": "綠短襪",
    "type": "etc"
  },
  "l1j_item_40728": {
    "n": "紅短襪",
    "type": "etc"
  },
  "l1j_item_40729": {
    "n": "金襪子",
    "type": "etc"
  },
  "l1j_item_40730": {
    "n": "聖誕卡片",
    "type": "etc"
  },
  "l1j_item_40731": {
    "n": "情人節卡片",
    "type": "etc"
  },
  "l1j_item_40732": {
    "n": "白色情人節卡片",
    "type": "etc"
  },
  "l1j_item_40733": {
    "n": "名譽貨幣",
    "type": "etc"
  },
  "l1j_item_40734": {
    "n": "信賴貨幣",
    "type": "etc"
  },
  "l1j_item_40735": {
    "n": "勇氣貨幣",
    "type": "etc"
  },
  "l1j_item_40736": {
    "n": "智慧貨幣",
    "type": "etc"
  },
  "l1j_item_40737": {
    "n": "藏寶箱",
    "type": "etc"
  },
  "l1j_item_40738": {
    "n": "銀飛刀",
    "type": "etc"
  },
  "l1j_item_40739": {
    "n": "飛刀",
    "type": "etc"
  },
  "l1j_item_40740": {
    "n": "重飛刀",
    "type": "etc"
  },
  "l1j_item_40741": {
    "n": "奧里哈魯根鍍金骨箭",
    "type": "etc"
  },
  "l1j_item_40742": {
    "n": "古代之箭",
    "type": "etc"
  },
  "l1j_item_40743": {
    "n": "箭",
    "type": "etc"
  },
  "l1j_item_40744": {
    "n": "銀箭",
    "type": "etc"
  },
  "l1j_item_40745": {
    "n": "黃金箭",
    "type": "etc"
  },
  "l1j_item_40746": {
    "n": "米索莉箭",
    "type": "etc"
  },
  "l1j_item_40747": {
    "n": "黑色米索莉箭",
    "type": "etc"
  },
  "l1j_item_40748": {
    "n": "奧里哈魯根箭",
    "type": "etc"
  },
  "l1j_item_40749": {
    "n": "獵犬之牙",
    "type": "etc"
  },
  "l1j_item_40750": {
    "n": "破滅之牙",
    "type": "etc"
  },
  "l1j_item_40751": {
    "n": "鬥犬之牙",
    "type": "etc"
  },
  "l1j_item_40752": {
    "n": "黃金之牙",
    "type": "etc"
  },
  "l1j_item_40753": {
    "n": "龍之牙",
    "type": "etc"
  },
  "l1j_item_40754": {
    "n": "不滅之牙",
    "type": "etc"
  },
  "l1j_item_40755": {
    "n": "黑暗之牙",
    "type": "etc"
  },
  "l1j_item_40756": {
    "n": "神之牙",
    "type": "etc"
  },
  "l1j_item_40757": {
    "n": "鋼鐵之牙",
    "type": "etc"
  },
  "l1j_item_40758": {
    "n": "勝利之牙",
    "type": "etc"
  },
  "l1j_item_40759": {
    "n": "寵物祝福盔甲",
    "type": "etc"
  },
  "l1j_item_40760": {
    "n": "寵物光明盔甲",
    "type": "etc"
  },
  "l1j_item_40761": {
    "n": "寵物皮盔甲",
    "type": "etc"
  },
  "l1j_item_40762": {
    "n": "寵物骷髏盔甲",
    "type": "etc"
  },
  "l1j_item_40763": {
    "n": "寵物鋼鐵盔甲",
    "type": "etc"
  },
  "l1j_item_40764": {
    "n": "寵物米索莉盔甲",
    "type": "etc"
  },
  "l1j_item_40765": {
    "n": "寵物十字盔甲",
    "type": "etc"
  },
  "l1j_item_40766": {
    "n": "寵物鏈甲",
    "type": "etc"
  },
  "l1j_item_40778": {
    "n": "皮帶",
    "type": "etc"
  },
  "l1j_item_40779": {
    "n": "鋼鐵塊",
    "type": "etc"
  },
  "l1j_item_40780": {
    "n": "死亡首級",
    "type": "etc"
  },
  "l1j_item_40781": {
    "n": "死亡首級",
    "type": "etc"
  },
  "l1j_item_40782": {
    "n": "暗影神殿3樓鑰匙",
    "type": "etc"
  },
  "l1j_item_40783": {
    "n": "暗影神殿3樓鑰匙",
    "type": "etc"
  },
  "l1j_item_40801": {
    "n": "黃昏山脈傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40802": {
    "n": "亞丁城庭園傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40803": {
    "n": "鏡子森林傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40804": {
    "n": "巴拉卡斯棲息地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40805": {
    "n": "法利昂棲息地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40806": {
    "n": "林德拜爾棲息地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40807": {
    "n": "海音地監3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40808": {
    "n": "海音地監4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40809": {
    "n": "火龍窟傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40810": {
    "n": "龍之谷傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40811": {
    "n": "綠洲傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40812": {
    "n": "艾爾摩戰場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40813": {
    "n": "遠古戰場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40814": {
    "n": "食屍地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40815": {
    "n": "風木城地監1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40816": {
    "n": "風木城地監2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40817": {
    "n": "巨蟻洞穴1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40818": {
    "n": "巨蟻洞穴2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40819": {
    "n": "巨蟻洞穴3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40820": {
    "n": "象牙塔5樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40821": {
    "n": "象牙塔6樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40822": {
    "n": "象牙塔7樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40823": {
    "n": "象牙塔8樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40824": {
    "n": "騎士洞穴2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40825": {
    "n": "騎士洞穴3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40826": {
    "n": "騎士洞穴4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40827": {
    "n": "奇岩地監2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40828": {
    "n": "奇岩地監3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40829": {
    "n": "奇岩地監4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40830": {
    "n": "古魯丁地監3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40831": {
    "n": "古魯丁地監4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40832": {
    "n": "古魯丁地監5樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40833": {
    "n": "古魯丁地監6樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40834": {
    "n": "古魯丁地監7樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40835": {
    "n": "龍之谷地監1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40836": {
    "n": "龍之谷地監2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40837": {
    "n": "龍之谷地監3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40838": {
    "n": "龍之谷地監4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40839": {
    "n": "龍之谷地監5樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40840": {
    "n": "龍之谷地監6樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40841": {
    "n": "安塔瑞斯棲息地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40842": {
    "n": "風木之城傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40843": {
    "n": "沙漠傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40844": {
    "n": "布魯迪卡洞穴傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40845": {
    "n": "沉默洞穴傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40846": {
    "n": "拉斯塔巴德地下洞穴1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40847": {
    "n": "拉斯塔巴德地下洞穴2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40848": {
    "n": "拉斯塔巴德地下洞穴3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40849": {
    "n": "古代人空間1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40850": {
    "n": "古代人空間2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40851": {
    "n": "古代人空間4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40852": {
    "n": "歐姆地監傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40853": {
    "n": "大洞穴抵抗軍地區傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40854": {
    "n": "魔族神殿傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40855": {
    "n": "精靈墓穴傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40856": {
    "n": "海賊島傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40857": {
    "n": "拉斯塔巴德正門傳送卷軸",
    "type": "etc"
  },
  "l1j_item_40858": {
    "n": "liquor",
    "type": "etc"
  },
  "l1j_item_40899": {
    "n": "鋼鐵原石",
    "type": "etc"
  },
  "l1j_item_40901": {
    "n": "結婚戒指(銀)",
    "type": "etc"
  },
  "l1j_item_40902": {
    "n": "結婚戒指(金)",
    "type": "etc"
  },
  "l1j_item_40903": {
    "n": "結婚戒指(藍寶石)",
    "type": "etc"
  },
  "l1j_item_40904": {
    "n": "結婚戒指(綠寶石)",
    "type": "etc"
  },
  "l1j_item_40905": {
    "n": "結婚戒指(紅寶石)",
    "type": "etc"
  },
  "l1j_item_40906": {
    "n": "結婚戒指(鑽石)",
    "type": "etc"
  },
  "l1j_item_40907": {
    "n": "西瑪戒指",
    "type": "etc"
  },
  "l1j_item_40908": {
    "n": "歐林戒指",
    "type": "etc"
  },
  "l1j_item_40909": {
    "n": "土之通行證",
    "type": "etc"
  },
  "l1j_item_40910": {
    "n": "水之通行證",
    "type": "etc"
  },
  "l1j_item_40911": {
    "n": "火之通行證",
    "type": "etc"
  },
  "l1j_item_40912": {
    "n": "風之通行證",
    "type": "etc"
  },
  "l1j_item_40913": {
    "n": "土之印記",
    "type": "etc"
  },
  "l1j_item_40914": {
    "n": "水之印記",
    "type": "etc"
  },
  "l1j_item_40915": {
    "n": "火之印記",
    "type": "etc"
  },
  "l1j_item_40916": {
    "n": "風之印記",
    "type": "etc"
  },
  "l1j_item_40917": {
    "n": "土之支配者",
    "type": "etc"
  },
  "l1j_item_40918": {
    "n": "水之支配者",
    "type": "etc"
  },
  "l1j_item_40919": {
    "n": "火之支配者",
    "type": "etc"
  },
  "l1j_item_40920": {
    "n": "風之支配者",
    "type": "etc"
  },
  "l1j_item_40921": {
    "n": "元素之支配者",
    "type": "etc"
  },
  "l1j_item_40922": {
    "n": "鼓勵的藥水",
    "type": "etc"
  },
  "l1j_item_40923": {
    "n": "技術的藥水",
    "type": "etc"
  },
  "l1j_item_40924": {
    "n": "寶羅拉的藥水",
    "type": "etc"
  },
  "l1j_item_40925": {
    "n": "淨化藥水",
    "type": "etc"
  },
  "l1j_item_40926": {
    "n": "一階神秘藥水",
    "type": "etc"
  },
  "l1j_item_40927": {
    "n": "二階神秘藥水",
    "type": "etc"
  },
  "l1j_item_40928": {
    "n": "三階神秘藥水",
    "type": "etc"
  },
  "l1j_item_40929": {
    "n": "四階神秘藥水",
    "type": "etc"
  },
  "l1j_item_40930": {
    "n": "烤肉",
    "type": "etc"
  },
  "l1j_item_40931": {
    "n": "精工的藍寶石",
    "type": "etc"
  },
  "l1j_item_40932": {
    "n": "精工的紅寶石",
    "type": "etc"
  },
  "l1j_item_40933": {
    "n": "精工的綠寶石",
    "type": "etc"
  },
  "l1j_item_40934": {
    "n": "精工的品質藍寶石",
    "type": "etc"
  },
  "l1j_item_40935": {
    "n": "精工的品質紅寶石",
    "type": "etc"
  },
  "l1j_item_40936": {
    "n": "精工的品質綠寶石",
    "type": "etc"
  },
  "l1j_item_40937": {
    "n": "精工的高品質藍寶石",
    "type": "etc"
  },
  "l1j_item_40938": {
    "n": "精工的高品質紅寶石",
    "type": "etc"
  },
  "l1j_item_40939": {
    "n": "精工的高品質綠寶石",
    "type": "etc"
  },
  "l1j_item_40940": {
    "n": "精工的極品藍寶石",
    "type": "etc"
  },
  "l1j_item_40941": {
    "n": "精工的極品紅寶石",
    "type": "etc"
  },
  "l1j_item_40942": {
    "n": "精工的極品綠寶石",
    "type": "etc"
  },
  "l1j_item_40943": {
    "n": "精工的土之鑽",
    "type": "etc"
  },
  "l1j_item_40944": {
    "n": "精工的水之鑽",
    "type": "etc"
  },
  "l1j_item_40945": {
    "n": "精工的火之鑽",
    "type": "etc"
  },
  "l1j_item_40946": {
    "n": "精工的風之鑽",
    "type": "etc"
  },
  "l1j_item_40947": {
    "n": "精工的品質土之鑽",
    "type": "etc"
  },
  "l1j_item_40948": {
    "n": "精工的品質水之鑽",
    "type": "etc"
  },
  "l1j_item_40949": {
    "n": "精工的品質火之鑽",
    "type": "etc"
  },
  "l1j_item_40950": {
    "n": "精工的品質風之鑽",
    "type": "etc"
  },
  "l1j_item_40951": {
    "n": "精工的高品質土之鑽",
    "type": "etc"
  },
  "l1j_item_40952": {
    "n": "精工的高品質水之鑽",
    "type": "etc"
  },
  "l1j_item_40953": {
    "n": "精工的高品質火之鑽",
    "type": "etc"
  },
  "l1j_item_40954": {
    "n": "精工的高品質風之鑽",
    "type": "etc"
  },
  "l1j_item_40955": {
    "n": "精工的極品土之鑽",
    "type": "etc"
  },
  "l1j_item_40956": {
    "n": "精工的極品水之鑽",
    "type": "etc"
  },
  "l1j_item_40957": {
    "n": "精工的極品火之鑽",
    "type": "etc"
  },
  "l1j_item_40958": {
    "n": "精工的極品風之鑽",
    "type": "etc"
  },
  "l1j_item_40959": {
    "n": "冥法軍王徽印",
    "type": "etc"
  },
  "l1j_item_40960": {
    "n": "法令軍王徽印",
    "type": "etc"
  },
  "l1j_item_40961": {
    "n": "魔獸軍王徽印",
    "type": "etc"
  },
  "l1j_item_40962": {
    "n": "暗殺軍王徽印",
    "type": "etc"
  },
  "l1j_item_40964": {
    "n": "黑魔法粉",
    "type": "etc"
  },
  "l1j_item_40965": {
    "n": "拉斯塔巴德製作武器秘笈",
    "type": "etc"
  },
  "l1j_item_40966": {
    "n": "真．冥皇製作防具秘笈",
    "type": "etc"
  },
  "l1j_item_40967": {
    "n": "聖地遺物",
    "type": "etc"
  },
  "l1j_item_40968": {
    "n": "修行者經典",
    "type": "etc"
  },
  "l1j_item_40969": {
    "n": "黑暗妖精的靈魂水晶",
    "type": "etc"
  },
  "l1j_item_40970": {
    "n": "安加斯的尾巴",
    "type": "etc"
  },
  "l1j_item_40971": {
    "n": "安加斯之牙",
    "type": "etc"
  },
  "l1j_item_40972": {
    "n": "巴薩斯的氣息",
    "type": "etc"
  },
  "l1j_item_40973": {
    "n": "巴薩斯的翅膀",
    "type": "etc"
  },
  "l1j_item_40974": {
    "n": "狄高的血",
    "type": "etc"
  },
  "l1j_item_40975": {
    "n": "狄高的鰭",
    "type": "etc"
  },
  "l1j_item_40976": {
    "n": "沙",
    "type": "etc"
  },
  "l1j_item_40977": {
    "n": "染血的沙",
    "type": "etc"
  },
  "l1j_item_40978": {
    "n": "土之守護者的尾巴",
    "type": "etc"
  },
  "l1j_item_40979": {
    "n": "水之守護者的尾巴",
    "type": "etc"
  },
  "l1j_item_40980": {
    "n": "火之守護者的尾巴",
    "type": "etc"
  },
  "l1j_item_40981": {
    "n": "風之守護者的尾巴",
    "type": "etc"
  },
  "l1j_item_40982": {
    "n": "土之守護者的皮",
    "type": "etc"
  },
  "l1j_item_40983": {
    "n": "水之守護者的皮",
    "type": "etc"
  },
  "l1j_item_40984": {
    "n": "火之守護者的皮",
    "type": "etc"
  },
  "l1j_item_40985": {
    "n": "風之守護者的皮",
    "type": "etc"
  },
  "l1j_item_40986": {
    "n": "守護者之牙",
    "type": "etc"
  },
  "l1j_item_40987": {
    "n": "受詛咒的黑色耳環",
    "type": "etc"
  },
  "l1j_item_40988": {
    "n": "受詛咒的黑色耳環",
    "type": "etc"
  },
  "l1j_item_40989": {
    "n": "受詛咒的黑色耳環",
    "type": "etc"
  },
  "l1j_item_40990": {
    "n": "炎魔的翅膀",
    "type": "etc"
  },
  "l1j_item_40991": {
    "n": "炎魔雙手劍",
    "type": "etc"
  },
  "l1j_item_40992": {
    "n": "炎魔的頭",
    "type": "etc"
  },
  "l1j_item_40993": {
    "n": "炎魔的角",
    "type": "etc"
  },
  "l1j_item_40994": {
    "n": "炎魔之肉",
    "type": "etc"
  },
  "l1j_item_40995": {
    "n": "炎魔之指",
    "type": "etc"
  },
  "l1j_item_40996": {
    "n": "炎魔的心臟",
    "type": "etc"
  },
  "l1j_item_40997": {
    "n": "炎魔之牙",
    "type": "etc"
  },
  "l1j_item_40998": {
    "n": "炎魔之肺",
    "type": "etc"
  },
  "l1j_item_40999": {
    "n": "黑暗妖精士兵的徽章",
    "type": "etc"
  },
  "l1j_item_41000": {
    "n": "黑暗妖精將軍的徽章",
    "type": "etc"
  },
  "l1j_item_41001": {
    "n": "守護團獎金箱子",
    "type": "etc"
  },
  "l1j_item_41002": {
    "n": "礦物袋子",
    "type": "etc"
  },
  "l1j_item_41003": {
    "n": "羅伊的袋子",
    "type": "etc"
  },
  "l1j_item_41004": {
    "n": "拉布羅的袋子",
    "type": "etc"
  },
  "l1j_item_41005": {
    "n": "復活與永生之誓約書",
    "type": "etc"
  },
  "l1j_item_41006": {
    "n": "拉伯勒的袋子",
    "type": "etc"
  },
  "l1j_item_41007": {
    "n": "伊莉絲的命令書：靈魂之安息",
    "type": "etc"
  },
  "l1j_item_41008": {
    "n": "伊莉絲的袋子",
    "type": "etc"
  },
  "l1j_item_41009": {
    "n": "伊莉絲的命令書：同盟之意志",
    "type": "etc"
  },
  "l1j_item_41010": {
    "n": "伊莉絲的推薦函",
    "type": "etc"
  },
  "l1j_item_41011": {
    "n": "封印的歷史書第1頁",
    "type": "etc"
  },
  "l1j_item_41012": {
    "n": "封印的歷史書第2頁",
    "type": "etc"
  },
  "l1j_item_41013": {
    "n": "封印的歷史書第3頁",
    "type": "etc"
  },
  "l1j_item_41014": {
    "n": "封印的歷史書第4頁",
    "type": "etc"
  },
  "l1j_item_41015": {
    "n": "封印的歷史書第5頁",
    "type": "etc"
  },
  "l1j_item_41016": {
    "n": "封印的歷史書第6頁",
    "type": "etc"
  },
  "l1j_item_41017": {
    "n": "封印的歷史書第7頁",
    "type": "etc"
  },
  "l1j_item_41018": {
    "n": "封印的歷史書第8頁",
    "type": "etc"
  },
  "l1j_item_41019": {
    "n": "拉斯塔巴德歷史書第1頁",
    "type": "etc"
  },
  "l1j_item_41020": {
    "n": "拉斯塔巴德歷史書第2頁",
    "type": "etc"
  },
  "l1j_item_41021": {
    "n": "拉斯塔巴德歷史書第3頁",
    "type": "etc"
  },
  "l1j_item_41022": {
    "n": "拉斯塔巴德歷史書第4頁",
    "type": "etc"
  },
  "l1j_item_41023": {
    "n": "拉斯塔巴德歷史書第5頁",
    "type": "etc"
  },
  "l1j_item_41024": {
    "n": "拉斯塔巴德歷史書第6頁",
    "type": "etc"
  },
  "l1j_item_41025": {
    "n": "拉斯塔巴德歷史書第7頁",
    "type": "etc"
  },
  "l1j_item_41026": {
    "n": "拉斯塔巴德歷史書第8頁",
    "type": "etc"
  },
  "l1j_item_41027": {
    "n": "完整的拉斯塔巴德歷史書",
    "type": "etc"
  },
  "l1j_item_41028": {
    "n": "死亡騎士之書",
    "type": "etc"
  },
  "l1j_item_41029": {
    "n": "召喚球碎片",
    "type": "etc"
  },
  "l1j_item_41030": {
    "n": "召喚球之核",
    "type": "etc"
  },
  "l1j_item_41031": {
    "n": "一階段召喚球",
    "type": "etc"
  },
  "l1j_item_41032": {
    "n": "二階段召喚球",
    "type": "etc"
  },
  "l1j_item_41033": {
    "n": "三階段召喚球",
    "type": "etc"
  },
  "l1j_item_41034": {
    "n": "四階段召喚球",
    "type": "etc"
  },
  "l1j_item_41035": {
    "n": "完整的召喚球",
    "type": "etc"
  },
  "l1j_item_41036": {
    "n": "膠水",
    "type": "etc"
  },
  "l1j_item_41037": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_41038": {
    "n": "航海日誌第1頁",
    "type": "etc"
  },
  "l1j_item_41039": {
    "n": "航海日誌第2頁",
    "type": "etc"
  },
  "l1j_item_41040": {
    "n": "航海日誌第3頁",
    "type": "etc"
  },
  "l1j_item_41041": {
    "n": "航海日誌第4頁",
    "type": "etc"
  },
  "l1j_item_41042": {
    "n": "航海日誌第5頁",
    "type": "etc"
  },
  "l1j_item_41043": {
    "n": "航海日誌第6頁",
    "type": "etc"
  },
  "l1j_item_41044": {
    "n": "航海日誌第7頁",
    "type": "etc"
  },
  "l1j_item_41045": {
    "n": "航海日誌第8頁",
    "type": "etc"
  },
  "l1j_item_41046": {
    "n": "航海日誌第9頁",
    "type": "etc"
  },
  "l1j_item_41047": {
    "n": "航海日誌第10頁",
    "type": "etc"
  },
  "l1j_item_41048": {
    "n": "塗著膠水的航海日誌第1頁",
    "type": "etc"
  },
  "l1j_item_41049": {
    "n": "塗著膠水的航海日誌第2頁",
    "type": "etc"
  },
  "l1j_item_41050": {
    "n": "塗著膠水的航海日誌第3頁",
    "type": "etc"
  },
  "l1j_item_41051": {
    "n": "塗著膠水的航海日誌第4頁",
    "type": "etc"
  },
  "l1j_item_41052": {
    "n": "塗著膠水的航海日誌第5頁",
    "type": "etc"
  },
  "l1j_item_41053": {
    "n": "塗著膠水的航海日誌第6頁",
    "type": "etc"
  },
  "l1j_item_41054": {
    "n": "塗著膠水的航海日誌第7頁",
    "type": "etc"
  },
  "l1j_item_41055": {
    "n": "塗著膠水的航海日誌第8頁",
    "type": "etc"
  },
  "l1j_item_41056": {
    "n": "塗著膠水的航海日誌第9頁",
    "type": "etc"
  },
  "l1j_item_41057": {
    "n": "塗著膠水的航海日誌第10頁",
    "type": "etc"
  },
  "l1j_item_41058": {
    "n": "完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_41059": {
    "n": "航海士的袋子",
    "type": "etc"
  },
  "l1j_item_41060": {
    "n": "諾曼阿吐巴的信",
    "type": "etc"
  },
  "l1j_item_41061": {
    "n": "妖精調查書：卡麥都達瑪拉",
    "type": "etc"
  },
  "l1j_item_41062": {
    "n": "人類調查書：巴庫摩那魯加",
    "type": "etc"
  },
  "l1j_item_41063": {
    "n": "精靈調查書：可普都達瑪拉",
    "type": "etc"
  },
  "l1j_item_41064": {
    "n": "妖魔調查書：弧鄔牟那魯加",
    "type": "etc"
  },
  "l1j_item_41065": {
    "n": "死亡之樹調查書：諾亞阿吐巴",
    "type": "etc"
  },
  "l1j_item_41066": {
    "n": "污濁的根",
    "type": "etc"
  },
  "l1j_item_41067": {
    "n": "污濁的樹枝",
    "type": "etc"
  },
  "l1j_item_41068": {
    "n": "污濁的皮",
    "type": "etc"
  },
  "l1j_item_41069": {
    "n": "污濁的鬃毛",
    "type": "etc"
  },
  "l1j_item_41070": {
    "n": "污濁的精靈羽翼",
    "type": "etc"
  },
  "l1j_item_41071": {
    "n": "銀盤",
    "type": "etc"
  },
  "l1j_item_41072": {
    "n": "銀燭臺",
    "type": "etc"
  },
  "l1j_item_41073": {
    "n": "強盜鑰匙",
    "type": "etc"
  },
  "l1j_item_41074": {
    "n": "強盜的袋子",
    "type": "etc"
  },
  "l1j_item_41075": {
    "n": "污濁的頭髮",
    "type": "etc"
  },
  "l1j_item_41076": {
    "n": "土核晶",
    "type": "etc"
  },
  "l1j_item_41077": {
    "n": "水核晶",
    "type": "etc"
  },
  "l1j_item_41078": {
    "n": "火核晶",
    "type": "etc"
  },
  "l1j_item_41079": {
    "n": "風核晶",
    "type": "etc"
  },
  "l1j_item_41080": {
    "n": "精靈核晶",
    "type": "etc"
  },
  "l1j_item_41081": {
    "n": "妖魔尖牙",
    "type": "etc"
  },
  "l1j_item_41082": {
    "n": "妖魔尖牙項鍊",
    "type": "etc"
  },
  "l1j_item_41083": {
    "n": "咒術粉",
    "type": "etc"
  },
  "l1j_item_41084": {
    "n": "幻覺之粉",
    "type": "etc"
  },
  "l1j_item_41085": {
    "n": "預言家珍珠",
    "type": "etc"
  },
  "l1j_item_41086": {
    "n": "樹精的根",
    "type": "etc"
  },
  "l1j_item_41087": {
    "n": "樹精的樹皮",
    "type": "etc"
  },
  "l1j_item_41088": {
    "n": "樹精的葉子",
    "type": "etc"
  },
  "l1j_item_41089": {
    "n": "樹精的樹枝",
    "type": "etc"
  },
  "l1j_item_41090": {
    "n": "那魯加圖騰",
    "type": "etc"
  },
  "l1j_item_41091": {
    "n": "都達瑪拉圖騰",
    "type": "etc"
  },
  "l1j_item_41092": {
    "n": "阿吐巴圖騰",
    "type": "etc"
  },
  "l1j_item_41093": {
    "n": "夢幻的熊娃娃",
    "type": "etc"
  },
  "l1j_item_41094": {
    "n": "誘惑的香水",
    "type": "etc"
  },
  "l1j_item_41095": {
    "n": "漂亮的洋裝",
    "type": "etc"
  },
  "l1j_item_41096": {
    "n": "華麗的戒指",
    "type": "etc"
  },
  "l1j_item_41097": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_41098": {
    "n": "英雄傳記",
    "type": "etc"
  },
  "l1j_item_41099": {
    "n": "時髦的帽子",
    "type": "etc"
  },
  "l1j_item_41100": {
    "n": "高級紅酒",
    "type": "etc"
  },
  "l1j_item_41101": {
    "n": "神秘的鑰匙",
    "type": "etc"
  },
  "l1j_item_41102": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_41103": {
    "n": "石頭塊",
    "type": "etc"
  },
  "l1j_item_41104": {
    "n": "鐵礦石",
    "type": "etc"
  },
  "l1j_item_41105": {
    "n": "火山巖",
    "type": "etc"
  },
  "l1j_item_41106": {
    "n": "瑪依奴的尾巴毛",
    "type": "etc"
  },
  "l1j_item_41107": {
    "n": "窺甲片",
    "type": "etc"
  },
  "l1j_item_41108": {
    "n": "鑽石原石",
    "type": "etc"
  },
  "l1j_item_41109": {
    "n": "瑪依奴夏門的尾巴毛",
    "type": "etc"
  },
  "l1j_item_41110": {
    "n": "遺物袋",
    "type": "etc"
  },
  "l1j_item_41111": {
    "n": "破舊的遺物袋",
    "type": "etc"
  },
  "l1j_item_41112": {
    "n": "舊遺物袋",
    "type": "etc"
  },
  "l1j_item_41113": {
    "n": "褪色戒指",
    "type": "etc"
  },
  "l1j_item_41114": {
    "n": "染血的手帕",
    "type": "etc"
  },
  "l1j_item_41115": {
    "n": "染血的文件",
    "type": "etc"
  },
  "l1j_item_41116": {
    "n": "褪色項鍊",
    "type": "etc"
  },
  "l1j_item_41117": {
    "n": "破舊的錢包",
    "type": "etc"
  },
  "l1j_item_41118": {
    "n": "染血的匕首",
    "type": "etc"
  },
  "l1j_item_41119": {
    "n": "遺失的鑰匙",
    "type": "etc"
  },
  "l1j_item_41120": {
    "n": "瑪雅的魔杖",
    "type": "etc"
  },
  "l1j_item_41121": {
    "n": "火焰之影的契約書",
    "type": "etc"
  },
  "l1j_item_41122": {
    "n": "火焰之影的契約",
    "type": "etc"
  },
  "l1j_item_41123": {
    "n": "火焰之影的墮落粉",
    "type": "etc"
  },
  "l1j_item_41124": {
    "n": "火焰之影的無力粉",
    "type": "etc"
  },
  "l1j_item_41125": {
    "n": "火焰之影的執著粉",
    "type": "etc"
  },
  "l1j_item_41126": {
    "n": "炎魔的墮落井水",
    "type": "etc"
  },
  "l1j_item_41127": {
    "n": "炎魔的無力井水",
    "type": "etc"
  },
  "l1j_item_41128": {
    "n": "炎魔的執著井水",
    "type": "etc"
  },
  "l1j_item_41129": {
    "n": "炎魔的井水",
    "type": "etc"
  },
  "l1j_item_41130": {
    "n": "炎魔的契約書",
    "type": "etc"
  },
  "l1j_item_41131": {
    "n": "炎魔的契約",
    "type": "etc"
  },
  "l1j_item_41132": {
    "n": "炎魔的墮落粉",
    "type": "etc"
  },
  "l1j_item_41133": {
    "n": "炎魔的無力粉",
    "type": "etc"
  },
  "l1j_item_41134": {
    "n": "炎魔的執著粉",
    "type": "etc"
  },
  "l1j_item_41135": {
    "n": "火焰之影的墮落井水",
    "type": "etc"
  },
  "l1j_item_41136": {
    "n": "火焰之影的無力井水",
    "type": "etc"
  },
  "l1j_item_41137": {
    "n": "火焰之影的執著井水",
    "type": "etc"
  },
  "l1j_item_41138": {
    "n": "火焰之影的井水",
    "type": "etc"
  },
  "l1j_item_41139": {
    "n": "不起眼的古老項鍊",
    "type": "etc"
  },
  "l1j_item_41140": {
    "n": "復原的古老項鍊",
    "type": "etc"
  },
  "l1j_item_41141": {
    "n": "神秘的體力藥水",
    "type": "etc"
  },
  "l1j_item_41142": {
    "n": "神秘的魔力藥水",
    "type": "etc"
  },
  "l1j_item_41143": {
    "n": "海賊骷髏首領變身藥水",
    "type": "etc"
  },
  "l1j_item_41144": {
    "n": "海賊骷髏士兵變身藥水",
    "type": "etc"
  },
  "l1j_item_41145": {
    "n": "海賊骷髏刀手變身藥水",
    "type": "etc"
  },
  "l1j_item_41146": {
    "n": "ドロモンドの紹介状",
    "type": "etc"
  },
  "l1j_item_41147": {
    "n": "技術書(堅固防護)",
    "type": "etc"
  },
  "l1j_item_41148": {
    "n": "技術書(反擊屏障)",
    "type": "etc"
  },
  "l1j_item_41149": {
    "n": "精靈水晶(烈焰之魂)",
    "type": "etc"
  },
  "l1j_item_41150": {
    "n": "精靈水晶(能量激發)",
    "type": "etc"
  },
  "l1j_item_41151": {
    "n": "精靈水晶(水之防護)",
    "type": "etc"
  },
  "l1j_item_41152": {
    "n": "精靈水晶(污濁之水)",
    "type": "etc"
  },
  "l1j_item_41153": {
    "n": "精靈水晶(精準射擊)",
    "type": "etc"
  },
  "l1j_item_41154": {
    "n": "暗之鱗",
    "type": "etc"
  },
  "l1j_item_41155": {
    "n": "火之鱗",
    "type": "etc"
  },
  "l1j_item_41156": {
    "n": "叛之鱗",
    "type": "etc"
  },
  "l1j_item_41157": {
    "n": "恨之鱗",
    "type": "etc"
  },
  "l1j_item_41158": {
    "n": "瑪雅的水晶球",
    "type": "etc"
  },
  "l1j_item_41159": {
    "n": "神秘的羽毛",
    "type": "etc"
  },
  "l1j_item_41160": {
    "n": "寵物召喚笛",
    "type": "etc"
  },
  "l1j_item_41161": {
    "n": "神秘的黑色耳環",
    "type": "etc"
  },
  "l1j_item_41162": {
    "n": "神秘的黑色耳環",
    "type": "etc"
  },
  "l1j_item_41163": {
    "n": "神秘的黑色耳環",
    "type": "etc"
  },
  "l1j_item_41164": {
    "n": "神秘的法師耳環",
    "type": "etc"
  },
  "l1j_item_41165": {
    "n": "神秘的騎士耳環",
    "type": "etc"
  },
  "l1j_item_41166": {
    "n": "神秘的鬥士耳環",
    "type": "etc"
  },
  "l1j_item_41167": {
    "n": "神秘的灰色法師耳環",
    "type": "etc"
  },
  "l1j_item_41168": {
    "n": "神秘的灰色騎士耳環",
    "type": "etc"
  },
  "l1j_item_41169": {
    "n": "神秘的灰色鬥士耳環",
    "type": "etc"
  },
  "l1j_item_41170": {
    "n": "神秘的白色法師耳環",
    "type": "etc"
  },
  "l1j_item_41171": {
    "n": "神秘的白色騎士耳環",
    "type": "etc"
  },
  "l1j_item_41172": {
    "n": "神秘的白色鬥士耳環",
    "type": "etc"
  },
  "l1j_item_41173": {
    "n": "黑色耳環",
    "type": "etc"
  },
  "l1j_item_41174": {
    "n": "黑色耳環",
    "type": "etc"
  },
  "l1j_item_41175": {
    "n": "黑色耳環",
    "type": "etc"
  },
  "l1j_item_41176": {
    "n": "法師耳環",
    "type": "etc"
  },
  "l1j_item_41177": {
    "n": "騎士耳環",
    "type": "etc"
  },
  "l1j_item_41178": {
    "n": "鬥士耳環",
    "type": "etc"
  },
  "l1j_item_41179": {
    "n": "灰色法師耳環",
    "type": "etc"
  },
  "l1j_item_41180": {
    "n": "灰色騎士耳環",
    "type": "etc"
  },
  "l1j_item_41181": {
    "n": "灰色鬥士耳環",
    "type": "etc"
  },
  "l1j_item_41182": {
    "n": "白色法師耳環",
    "type": "etc"
  },
  "l1j_item_41183": {
    "n": "白色騎士耳環",
    "type": "etc"
  },
  "l1j_item_41184": {
    "n": "白色鬥士耳環",
    "type": "etc"
  },
  "l1j_item_41185": {
    "n": "精緻的土靈戒指(英雄)",
    "type": "etc"
  },
  "l1j_item_41186": {
    "n": "精緻的水靈戒指(英雄)",
    "type": "etc"
  },
  "l1j_item_41187": {
    "n": "精緻的火靈戒指(英雄)",
    "type": "etc"
  },
  "l1j_item_41188": {
    "n": "精緻的風靈戒指(英雄)",
    "type": "etc"
  },
  "l1j_item_41189": {
    "n": "精緻的土靈戒指(男爵)",
    "type": "etc"
  },
  "l1j_item_41190": {
    "n": "精緻的水靈戒指(男爵)",
    "type": "etc"
  },
  "l1j_item_41191": {
    "n": "精緻的火靈戒指(男爵)",
    "type": "etc"
  },
  "l1j_item_41192": {
    "n": "精緻的風靈戒指(男爵)",
    "type": "etc"
  },
  "l1j_item_41193": {
    "n": "精緻的土靈戒指(伯爵)",
    "type": "etc"
  },
  "l1j_item_41194": {
    "n": "精緻的水靈戒指(伯爵)",
    "type": "etc"
  },
  "l1j_item_41195": {
    "n": "精緻的火靈戒指(伯爵)",
    "type": "etc"
  },
  "l1j_item_41196": {
    "n": "精緻的風靈戒指(伯爵)",
    "type": "etc"
  },
  "l1j_item_41197": {
    "n": "精緻的土靈戒指(公爵)",
    "type": "etc"
  },
  "l1j_item_41198": {
    "n": "精緻的水靈戒指(公爵)",
    "type": "etc"
  },
  "l1j_item_41199": {
    "n": "精緻的火靈戒指(公爵)",
    "type": "etc"
  },
  "l1j_item_41200": {
    "n": "精緻的風靈戒指(公爵)",
    "type": "etc"
  },
  "l1j_item_41201": {
    "n": "騎士之魂",
    "type": "etc"
  },
  "l1j_item_41202": {
    "n": "妖精之魂",
    "type": "etc"
  },
  "l1j_item_41203": {
    "n": "王族之魂",
    "type": "etc"
  },
  "l1j_item_41204": {
    "n": "黑妖之魂",
    "type": "etc"
  },
  "l1j_item_41205": {
    "n": "法師之魂",
    "type": "etc"
  },
  "l1j_item_41206": {
    "n": "少了刀刃的武器",
    "type": "etc"
  },
  "l1j_item_41207": {
    "n": "船員遺體",
    "type": "etc"
  },
  "l1j_item_41208": {
    "n": "微弱的靈魂",
    "type": "etc"
  },
  "l1j_item_41209": {
    "n": "ポピレアの依頼書",
    "type": "etc"
  },
  "l1j_item_41210": {
    "n": "研磨剤",
    "type": "etc"
  },
  "l1j_item_41211": {
    "n": "香菜",
    "type": "etc"
  },
  "l1j_item_41212": {
    "n": "特製キャンディー",
    "type": "etc"
  },
  "l1j_item_41213": {
    "n": "ティミーのバスケット",
    "type": "etc"
  },
  "l1j_item_41214": {
    "n": "運の証",
    "type": "etc"
  },
  "l1j_item_41215": {
    "n": "知の証",
    "type": "etc"
  },
  "l1j_item_41216": {
    "n": "力の証",
    "type": "etc"
  },
  "l1j_item_41217": {
    "n": "君主の袋",
    "type": "etc"
  },
  "l1j_item_41218": {
    "n": "ナイトの袋",
    "type": "etc"
  },
  "l1j_item_41219": {
    "n": "エルフの袋",
    "type": "etc"
  },
  "l1j_item_41220": {
    "n": "ウィザードの袋",
    "type": "etc"
  },
  "l1j_item_41221": {
    "n": "黑暗妖精袋子",
    "type": "etc"
  },
  "l1j_item_41222": {
    "n": "マシュル",
    "type": "etc"
  },
  "l1j_item_41223": {
    "n": "武具の破片",
    "type": "etc"
  },
  "l1j_item_41224": {
    "n": "バッヂ",
    "type": "etc"
  },
  "l1j_item_41225": {
    "n": "ケスキンの発注書",
    "type": "etc"
  },
  "l1j_item_41226": {
    "n": "パゴの薬",
    "type": "etc"
  },
  "l1j_item_41227": {
    "n": "アレックスの紹介状",
    "type": "etc"
  },
  "l1j_item_41228": {
    "n": "ラビのお守り",
    "type": "etc"
  },
  "l1j_item_41229": {
    "n": "スケルトンの頭",
    "type": "etc"
  },
  "l1j_item_41230": {
    "n": "ジーナンの手紙",
    "type": "etc"
  },
  "l1j_item_41231": {
    "n": "マッティの手紙",
    "type": "etc"
  },
  "l1j_item_41232": {
    "n": "ジョンの届け物",
    "type": "etc"
  },
  "l1j_item_41233": {
    "n": "ケーイへの手紙",
    "type": "etc"
  },
  "l1j_item_41234": {
    "n": "骨の入った袋",
    "type": "etc"
  },
  "l1j_item_41235": {
    "n": "材料表",
    "type": "etc"
  },
  "l1j_item_41236": {
    "n": "スケルトンアーチャーの骨",
    "type": "etc"
  },
  "l1j_item_41237": {
    "n": "スケルトンパイクの骨",
    "type": "etc"
  },
  "l1j_item_41238": {
    "n": "ケーイの届け物",
    "type": "etc"
  },
  "l1j_item_41239": {
    "n": "ヴートへの手紙",
    "type": "etc"
  },
  "l1j_item_41240": {
    "n": "フェーダへの手紙",
    "type": "etc"
  },
  "l1j_item_41241": {
    "n": "骨細工師の袋",
    "type": "etc"
  },
  "l1j_item_41242": {
    "n": "妖魔寶物袋",
    "type": "etc"
  },
  "l1j_item_41243": {
    "n": "拉斯塔巴德補給袋",
    "type": "etc"
  },
  "l1j_item_41244": {
    "n": "拉斯塔巴德補給箱",
    "type": "etc"
  },
  "l1j_item_41245": {
    "n": "溶解劑",
    "type": "etc"
  },
  "l1j_item_41246": {
    "n": "魔法結晶體",
    "type": "etc"
  },
  "l1j_item_41247": {
    "n": "魔法娃娃的袋子",
    "type": "etc"
  },
  "l1j_item_41248": {
    "n": "魔法娃娃：肥肥",
    "type": "etc"
  },
  "l1j_item_41249": {
    "n": "魔法娃娃：小思克巴",
    "type": "etc"
  },
  "l1j_item_41250": {
    "n": "魔法娃娃：野狼寶寶",
    "type": "etc"
  },
  "l1j_item_41251": {
    "n": "骷髏聖盃",
    "type": "etc"
  },
  "l1j_item_41252": {
    "n": "珍奇的烏龜",
    "type": "etc"
  },
  "l1j_item_41253": {
    "n": "王宮料理師的調味料",
    "type": "etc"
  },
  "l1j_item_41254": {
    "n": "勝利的徽章",
    "type": "etc"
  },
  "l1j_item_41255": {
    "n": "料理書：1階段",
    "type": "etc"
  },
  "l1j_item_41256": {
    "n": "料理書：2階段",
    "type": "etc"
  },
  "l1j_item_41257": {
    "n": "料理書：3階段",
    "type": "etc"
  },
  "l1j_item_41258": {
    "n": "料理書：4階段",
    "type": "etc"
  },
  "l1j_item_41259": {
    "n": "料理書：5階段",
    "type": "etc"
  },
  "l1j_item_41260": {
    "n": "柴火",
    "type": "etc"
  },
  "l1j_item_41261": {
    "n": "飯糰",
    "type": "etc"
  },
  "l1j_item_41262": {
    "n": "雞肉串燒",
    "type": "etc"
  },
  "l1j_item_41263": {
    "n": "太陽花籽",
    "type": "etc"
  },
  "l1j_item_41264": {
    "n": "麵粉",
    "type": "etc"
  },
  "l1j_item_41265": {
    "n": "蜂蜜",
    "type": "etc"
  },
  "l1j_item_41266": {
    "n": "蕃茄",
    "type": "etc"
  },
  "l1j_item_41267": {
    "n": "起士",
    "type": "etc"
  },
  "l1j_item_41268": {
    "n": "小比薩",
    "type": "etc"
  },
  "l1j_item_41269": {
    "n": "烤玉米",
    "type": "etc"
  },
  "l1j_item_41271": {
    "n": "爆米花",
    "type": "etc"
  },
  "l1j_item_41272": {
    "n": "甜不辣",
    "type": "etc"
  },
  "l1j_item_41273": {
    "n": "鬆餅",
    "type": "etc"
  },
  "l1j_item_41274": {
    "n": "螞蟻腿",
    "type": "etc"
  },
  "l1j_item_41275": {
    "n": "熊肉",
    "type": "etc"
  },
  "l1j_item_41276": {
    "n": "山豬肉",
    "type": "etc"
  },
  "l1j_item_41277": {
    "n": "漂浮之眼肉排",
    "type": "etc"
  },
  "l1j_item_41278": {
    "n": "烤熊肉",
    "type": "etc"
  },
  "l1j_item_41279": {
    "n": "煎餅",
    "type": "etc"
  },
  "l1j_item_41280": {
    "n": "烤螞蟻腿起司",
    "type": "etc"
  },
  "l1j_item_41281": {
    "n": "水果沙拉",
    "type": "etc"
  },
  "l1j_item_41282": {
    "n": "水果糖醋肉",
    "type": "etc"
  },
  "l1j_item_41283": {
    "n": "烤山豬肉串",
    "type": "etc"
  },
  "l1j_item_41284": {
    "n": "蘑菇湯",
    "type": "etc"
  },
  "l1j_item_41285": {
    "n": "特別的 漂浮之眼肉排",
    "type": "etc"
  },
  "l1j_item_41286": {
    "n": "特別的 烤熊肉",
    "type": "etc"
  },
  "l1j_item_41287": {
    "n": "特別的 煎餅",
    "type": "etc"
  },
  "l1j_item_41288": {
    "n": "特別的 烤螞蟻腿起司",
    "type": "etc"
  },
  "l1j_item_41289": {
    "n": "特別的 水果沙拉",
    "type": "etc"
  },
  "l1j_item_41290": {
    "n": "特別的 水果糖醋肉",
    "type": "etc"
  },
  "l1j_item_41291": {
    "n": "特別的 烤山豬肉串",
    "type": "etc"
  },
  "l1j_item_41292": {
    "n": "特別的 蘑菇湯",
    "type": "etc"
  },
  "l1j_item_41293": {
    "n": "長釣竿",
    "type": "etc"
  },
  "l1j_item_41294": {
    "n": "短釣竿",
    "type": "etc"
  },
  "l1j_item_41295": {
    "n": "餌",
    "type": "etc"
  },
  "l1j_item_41296": {
    "n": "鯛魚",
    "type": "etc"
  },
  "l1j_item_41297": {
    "n": "鮭魚",
    "type": "etc"
  },
  "l1j_item_41298": {
    "n": "鱈魚",
    "type": "etc"
  },
  "l1j_item_41299": {
    "n": "虎斑帶魚",
    "type": "etc"
  },
  "l1j_item_41300": {
    "n": "鮪魚",
    "type": "etc"
  },
  "l1j_item_41301": {
    "n": "發紅光的魚",
    "type": "etc"
  },
  "l1j_item_41302": {
    "n": "發綠光的魚",
    "type": "etc"
  },
  "l1j_item_41303": {
    "n": "發藍光的魚",
    "type": "etc"
  },
  "l1j_item_41304": {
    "n": "發白光的魚",
    "type": "etc"
  },
  "l1j_item_41305": {
    "n": "破碎的耳環",
    "type": "etc"
  },
  "l1j_item_41306": {
    "n": "破碎的戒指",
    "type": "etc"
  },
  "l1j_item_41307": {
    "n": "破碎的項鍊",
    "type": "etc"
  },
  "l1j_item_41308": {
    "n": "勇者的南瓜袋子",
    "type": "etc"
  },
  "l1j_item_41309": {
    "n": "寵物戰金牌",
    "type": "etc"
  },
  "l1j_item_41310": {
    "n": "勝利果實",
    "type": "etc"
  },
  "l1j_item_41311": {
    "n": "驚喜箱",
    "type": "etc"
  },
  "l1j_item_41312": {
    "n": "占星術師的甕",
    "type": "etc"
  },
  "l1j_item_41313": {
    "n": "占星術師的靈魂球",
    "type": "etc"
  },
  "l1j_item_41314": {
    "n": "占星術師的符咒",
    "type": "etc"
  },
  "l1j_item_41315": {
    "n": "聖水",
    "type": "etc"
  },
  "l1j_item_41316": {
    "n": "神聖的米索莉粉",
    "type": "etc"
  },
  "l1j_item_41317": {
    "n": "拉羅森的推薦書",
    "type": "etc"
  },
  "l1j_item_41318": {
    "n": "可恩的便條紙",
    "type": "etc"
  },
  "l1j_item_41319": {
    "n": "菊花花束",
    "type": "etc"
  },
  "l1j_item_41320": {
    "n": "黛西花束",
    "type": "etc"
  },
  "l1j_item_41321": {
    "n": "玫瑰花束",
    "type": "etc"
  },
  "l1j_item_41322": {
    "n": "卡拉花束",
    "type": "etc"
  },
  "l1j_item_41323": {
    "n": "太陽花花束",
    "type": "etc"
  },
  "l1j_item_41324": {
    "n": "小蒼蘭花束",
    "type": "etc"
  },
  "l1j_item_41325": {
    "n": "勇士之證",
    "type": "etc"
  },
  "l1j_item_41326": {
    "n": "勇士之證",
    "type": "etc"
  },
  "l1j_item_41327": {
    "n": "幽靈之氣息",
    "type": "etc"
  },
  "l1j_item_41328": {
    "n": "哈蒙的氣息",
    "type": "etc"
  },
  "l1j_item_41329": {
    "n": "標本製作委託書",
    "type": "etc"
  },
  "l1j_item_41330": {
    "n": "狩獵螞蟻之證",
    "type": "etc"
  },
  "l1j_item_41331": {
    "n": "狩獵熊之證",
    "type": "etc"
  },
  "l1j_item_41332": {
    "n": "狩獵蛇女之證",
    "type": "etc"
  },
  "l1j_item_41333": {
    "n": "狩獵黑虎之證",
    "type": "etc"
  },
  "l1j_item_41334": {
    "n": "狩獵鹿之證",
    "type": "etc"
  },
  "l1j_item_41335": {
    "n": "狩獵哈維之證",
    "type": "etc"
  },
  "l1j_item_41336": {
    "n": "伊芙洛爾之袋",
    "type": "etc"
  },
  "l1j_item_41337": {
    "n": "受祝福的五穀麵包",
    "type": "etc"
  },
  "l1j_item_41338": {
    "n": "受祝福的葡萄酒",
    "type": "etc"
  },
  "l1j_item_41339": {
    "n": "亡者的信件",
    "type": "etc"
  },
  "l1j_item_41340": {
    "n": "傭兵團長多文的推薦書",
    "type": "etc"
  },
  "l1j_item_41341": {
    "n": "帝倫之教本",
    "type": "etc"
  },
  "l1j_item_41342": {
    "n": "梅杜莎之血",
    "type": "etc"
  },
  "l1j_item_41343": {
    "n": "法利昂的血痕",
    "type": "etc"
  },
  "l1j_item_41344": {
    "n": "水中的水",
    "type": "etc"
  },
  "l1j_item_41345": {
    "n": "酸性液體",
    "type": "etc"
  },
  "l1j_item_41346": {
    "n": "羅賓孫的便條紙",
    "type": "etc"
  },
  "l1j_item_41347": {
    "n": "羅賓孫的便條紙",
    "type": "etc"
  },
  "l1j_item_41348": {
    "n": "羅賓孫的推薦書",
    "type": "etc"
  },
  "l1j_item_41349": {
    "n": "莎爾之戒",
    "type": "etc"
  },
  "l1j_item_41350": {
    "n": "羅賓孫之戒",
    "type": "etc"
  },
  "l1j_item_41351": {
    "n": "月光之氣息",
    "type": "etc"
  },
  "l1j_item_41352": {
    "n": "神聖獨角獸之角",
    "type": "etc"
  },
  "l1j_item_41353": {
    "n": "伊娃短劍",
    "type": "etc"
  },
  "l1j_item_41354": {
    "n": "伊娃的聖水",
    "type": "etc"
  },
  "l1j_item_41355": {
    "n": "波倫的袋子",
    "type": "etc"
  },
  "l1j_item_41356": {
    "n": "波倫的資源清單",
    "type": "etc"
  },
  "l1j_item_41357": {
    "n": "A 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41358": {
    "n": "B 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41359": {
    "n": "C 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41360": {
    "n": "D 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41361": {
    "n": "E 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41362": {
    "n": "F 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41363": {
    "n": "G 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41364": {
    "n": "H 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41365": {
    "n": "I 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41366": {
    "n": "J 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41367": {
    "n": "K 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41368": {
    "n": "L 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41369": {
    "n": "M 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41370": {
    "n": "N 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41371": {
    "n": "O 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41372": {
    "n": "P 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41373": {
    "n": "Q 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41374": {
    "n": "R 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41375": {
    "n": "S 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41376": {
    "n": "T 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41377": {
    "n": "U 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41378": {
    "n": "V 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41379": {
    "n": "W 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41380": {
    "n": "X 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41381": {
    "n": "Y 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41382": {
    "n": "Z 字母鞭炮",
    "type": "etc"
  },
  "l1j_item_41383": {
    "n": "巨大兵蟻標本",
    "type": "etc"
  },
  "l1j_item_41384": {
    "n": "熊標本",
    "type": "etc"
  },
  "l1j_item_41385": {
    "n": "蛇女標本",
    "type": "etc"
  },
  "l1j_item_41386": {
    "n": "黑虎標本",
    "type": "etc"
  },
  "l1j_item_41387": {
    "n": "鹿標本",
    "type": "etc"
  },
  "l1j_item_41388": {
    "n": "哈維標本",
    "type": "etc"
  },
  "l1j_item_41389": {
    "n": "青銅騎士",
    "type": "etc"
  },
  "l1j_item_41390": {
    "n": "青銅馬",
    "type": "etc"
  },
  "l1j_item_41391": {
    "n": "燭臺",
    "type": "etc"
  },
  "l1j_item_41392": {
    "n": "茶几",
    "type": "etc"
  },
  "l1j_item_41393": {
    "n": "火爐",
    "type": "etc"
  },
  "l1j_item_41394": {
    "n": "火把",
    "type": "etc"
  },
  "l1j_item_41395": {
    "n": "君主用講台",
    "type": "etc"
  },
  "l1j_item_41396": {
    "n": "旗幟",
    "type": "etc"
  },
  "l1j_item_41397": {
    "n": "茶几椅子",
    "type": "etc"
  },
  "l1j_item_41398": {
    "n": "茶几椅子",
    "type": "etc"
  },
  "l1j_item_41399": {
    "n": "屏風",
    "type": "etc"
  },
  "l1j_item_41400": {
    "n": "屏風",
    "type": "etc"
  },
  "l1j_item_41401": {
    "n": "移除傢俱魔杖",
    "type": "etc"
  },
  "l1j_item_41402": {
    "n": "勇者的勳章",
    "type": "etc"
  },
  "l1j_item_41403": {
    "n": "庫傑的糧食",
    "type": "etc"
  },
  "l1j_item_41404": {
    "n": "庫傑的靈藥",
    "type": "etc"
  },
  "l1j_item_41405": {
    "n": "守護團獎金箱子",
    "type": "etc"
  },
  "l1j_item_41406": {
    "n": "雷奧納的袋子",
    "type": "etc"
  },
  "l1j_item_41407": {
    "n": "雷奧納的袋子",
    "type": "etc"
  },
  "l1j_item_41408": {
    "n": "雷奧納的袋子",
    "type": "etc"
  },
  "l1j_item_41409": {
    "n": "雷奧納的袋子",
    "type": "etc"
  },
  "l1j_item_41410": {
    "n": "雷奧納的袋子",
    "type": "etc"
  },
  "l1j_item_41411": {
    "n": "銀粽子",
    "type": "etc"
  },
  "l1j_item_41412": {
    "n": "金粽子",
    "type": "etc"
  },
  "l1j_item_41413": {
    "n": "月餅",
    "type": "etc"
  },
  "l1j_item_41414": {
    "n": "福月餅",
    "type": "etc"
  },
  "l1j_item_41415": {
    "n": "強化勇氣的藥水",
    "type": "etc"
  },
  "l1j_item_41416": {
    "n": "驚喜箱",
    "type": "etc"
  },
  "l1j_item_41417": {
    "n": "草莓刨冰",
    "type": "etc"
  },
  "l1j_item_41418": {
    "n": "檸檬刨冰",
    "type": "etc"
  },
  "l1j_item_41419": {
    "n": "芒果刨冰",
    "type": "etc"
  },
  "l1j_item_41420": {
    "n": "哈密瓜刨冰",
    "type": "etc"
  },
  "l1j_item_41421": {
    "n": "抹茶小豆刨冰",
    "type": "etc"
  },
  "l1j_item_41422": {
    "n": "失去光明的靈魂",
    "type": "etc"
  },
  "l1j_item_41423": {
    "n": "袋鼠的食物",
    "type": "etc"
  },
  "l1j_item_41424": {
    "n": "貓熊的食物",
    "type": "etc"
  },
  "l1j_item_41425": {
    "n": "沉默洞穴指定傳送卷軸",
    "type": "etc"
  },
  "l1j_item_41426": {
    "n": "封印卷軸",
    "type": "etc"
  },
  "l1j_item_41427": {
    "n": "解除封印卷軸",
    "type": "etc"
  },
  "l1j_item_41428": {
    "n": "太古的玉璽",
    "type": "etc"
  },
  "l1j_item_41429": {
    "n": "風之武器強化卷軸",
    "type": "etc"
  },
  "l1j_item_41430": {
    "n": "地之武器強化卷軸",
    "type": "etc"
  },
  "l1j_item_41431": {
    "n": "水之武器強化卷軸",
    "type": "etc"
  },
  "l1j_item_41432": {
    "n": "火之武器強化卷軸",
    "type": "etc"
  },
  "l1j_item_41450": {
    "n": "愛瑪伊的畫像",
    "type": "etc"
  },
  "l1j_item_41451": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_41452": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_41453": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_41454": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_41455": {
    "n": "伊森之畫像",
    "type": "etc"
  },
  "l1j_item_41456": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_41457": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_41458": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_41459": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_41460": {
    "n": "象牙塔魔法袋",
    "type": "etc"
  },
  "l1j_item_41461": {
    "n": "象牙塔補給品卷軸",
    "type": "etc"
  },
  "l1j_item_41462": {
    "n": "象牙塔妙藥",
    "type": "etc"
  },
  "l1j_item_41463": {
    "n": "幻之鱗",
    "type": "etc"
  },
  "l1j_item_41551": {
    "n": "受封印 被遺忘的弩槍",
    "type": "etc"
  },
  "l1j_item_41552": {
    "n": "受封印 被遺忘的劍",
    "type": "etc"
  },
  "l1j_item_41553": {
    "n": "受封印 被遺忘的巨劍",
    "type": "etc"
  },
  "l1j_item_41554": {
    "n": "受封印 被遺忘的鱗甲",
    "type": "etc"
  },
  "l1j_item_41555": {
    "n": "受封印 被遺忘的皮盔甲",
    "type": "etc"
  },
  "l1j_item_41556": {
    "n": "受封印 被遺忘的金屬盔甲",
    "type": "etc"
  },
  "l1j_item_41557": {
    "n": "受封印 被遺忘的長袍",
    "type": "etc"
  },
  "l1j_item_42001": {
    "n": "說話之島村莊 宿屋ホール傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42002": {
    "n": "水晶洞穴1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42003": {
    "n": "水晶洞穴2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42004": {
    "n": "水晶洞穴3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42005": {
    "n": "象牙塔1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42006": {
    "n": "肯特城地監1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42007": {
    "n": "遺忘之島傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42008": {
    "n": "肯特城地監2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42009": {
    "n": "肯特城地監3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42010": {
    "n": "肯特城地監4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42011": {
    "n": "拉斯塔巴德1樓 集會場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42012": {
    "n": "拉斯塔巴德1樓 突擊訓練場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42013": {
    "n": "拉斯塔巴德1樓 魔獸軍王之室傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42014": {
    "n": "拉斯塔巴德1樓 魔獸調教場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42016": {
    "n": "拉斯塔巴德1樓 魔獸訓練場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42017": {
    "n": "夢幻之島傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42018": {
    "n": "拉斯塔巴德1樓 魔獸召喚室傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42019": {
    "n": "拉斯塔巴德1樓 黑暗結界傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42020": {
    "n": "拉斯塔巴德2樓 黑魔法修練場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42021": {
    "n": "古代巨人之墓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42022": {
    "n": "亞丁內城傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42023": {
    "n": "管理者房間傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42024": {
    "n": "正義神殿傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42025": {
    "n": "邪惡神殿傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42026": {
    "n": "亞丁守護者之塔傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42027": {
    "n": "指定傳送卷軸(管理者商店)",
    "type": "etc"
  },
  "l1j_item_42028": {
    "n": "古魯丁地監7樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42029": {
    "n": "傲慢之塔100樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42030": {
    "n": "傲慢之塔90樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42031": {
    "n": "傲慢之塔80樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42032": {
    "n": "傲慢之塔70樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42033": {
    "n": "傲慢之塔60樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42035": {
    "n": "傲慢之塔50樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42036": {
    "n": "傲慢之塔40樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42037": {
    "n": "傲慢之塔30樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42038": {
    "n": "傲慢之塔20樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42039": {
    "n": "傲慢之塔10樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42040": {
    "n": "海賊島地監1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42041": {
    "n": "海賊島地監2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42042": {
    "n": "海賊島地監3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42043": {
    "n": "地底湖傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42044": {
    "n": "說話之島村莊傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42045": {
    "n": "奇岩血盟小屋傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42046": {
    "n": "奇岩血盟小屋傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42047": {
    "n": "古代人空間3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42048": {
    "n": "歐姆村莊傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42049": {
    "n": "遺忘之島傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42050": {
    "n": "地獄之旅門票",
    "type": "etc"
  },
  "l1j_item_42051": {
    "n": "暗影神殿外圍傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42052": {
    "n": "暗影神殿1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42053": {
    "n": "暗影神殿2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42054": {
    "n": "暗影神殿3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42055": {
    "n": "污濁之地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42056": {
    "n": "隱藏的地下宮殿1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42057": {
    "n": "隱藏的地下宮殿2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42058": {
    "n": "隱藏的地下宮殿3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42059": {
    "n": "隱藏的地下宮殿4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42060": {
    "n": "封閉的海音地監移1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42061": {
    "n": "封閉的海音地監移2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42062": {
    "n": "封閉的海音地監移3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42063": {
    "n": "廢棄的礦坑傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42064": {
    "n": "廢棄的礦坑古道傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42065": {
    "n": "亞丁地下墓穴1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42066": {
    "n": "亞丁地下墓穴2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42067": {
    "n": "亞丁地下墓穴3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42068": {
    "n": "亞丁地下墓穴4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42069": {
    "n": "冒險洞窟1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42070": {
    "n": "冒險洞窟2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42071": {
    "n": "海底隧道傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42072": {
    "n": "眠龍洞穴1樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42073": {
    "n": "眠龍洞穴2樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42074": {
    "n": "眠龍洞穴3樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42075": {
    "n": "拉斯塔巴德闇2樓 黑暗結界(左)傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42076": {
    "n": "拉斯塔巴德闇2樓 黑暗結界(右)傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42077": {
    "n": "拉斯塔巴德4樓傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42078": {
    "n": "拉斯塔巴德4樓 庭園廣場傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42079": {
    "n": "拉斯塔巴德4樓 長老會議廳傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42080": {
    "n": "海賊島後半部傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42081": {
    "n": "船舶之墓 海面傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42082": {
    "n": "船舶之墓 深海傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42083": {
    "n": "霧月島傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42084": {
    "n": "慾望洞穴 水之領域傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42085": {
    "n": "慾望洞穴 火之領域傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42086": {
    "n": "慾望洞穴 風之領域傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42087": {
    "n": "慾望洞穴 地之領域傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42088": {
    "n": "底比斯沙漠傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42089": {
    "n": "底比斯金字塔內部傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42090": {
    "n": "底比斯歐西里斯祭壇傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42091": {
    "n": "貝希摩斯傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42092": {
    "n": "希培利亞傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42093": {
    "n": "慾望洞穴傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42094": {
    "n": "炎魔房間傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42095": {
    "n": "黑暗妖精聖地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42096": {
    "n": "原生魔族拋棄之地地上層傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42097": {
    "n": "原生魔族拋棄之地海底層傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42098": {
    "n": "不死魔族拋棄之地傳送卷軸",
    "type": "etc"
  },
  "l1j_item_42100": {
    "n": "旅人諮詢員回家捲軸",
    "type": "etc"
  },
  "l1j_item_42501": {
    "n": "暴風疾走 (10/0)",
    "type": "etc"
  },
  "l1j_item_43000": {
    "n": "返生藥水",
    "type": "etc"
  },
  "l1j_item_45000": {
    "n": "魔法書 (初級治癒術)",
    "type": "etc"
  },
  "l1j_item_45001": {
    "n": "魔法書 (日光術)",
    "type": "etc"
  },
  "l1j_item_45002": {
    "n": "魔法書 (保護罩)",
    "type": "etc"
  },
  "l1j_item_45003": {
    "n": "魔法書 (光箭)",
    "type": "etc"
  },
  "l1j_item_45004": {
    "n": "魔法書 (指定傳送)",
    "type": "etc"
  },
  "l1j_item_45005": {
    "n": "魔法書 (冰箭)",
    "type": "etc"
  },
  "l1j_item_45006": {
    "n": "魔法書 (風刃)",
    "type": "etc"
  },
  "l1j_item_45007": {
    "n": "魔法書 (神聖武器)",
    "type": "etc"
  },
  "l1j_item_45008": {
    "n": "魔法書 (解毒術)",
    "type": "etc"
  },
  "l1j_item_45009": {
    "n": "魔法書 (寒冷戰慄)",
    "type": "etc"
  },
  "l1j_item_45010": {
    "n": "魔法書 (毒咒)",
    "type": "etc"
  },
  "l1j_item_45011": {
    "n": "魔法書 (擬似魔法武器)",
    "type": "etc"
  },
  "l1j_item_45012": {
    "n": "魔法書 (無所遁形術)",
    "type": "etc"
  },
  "l1j_item_45013": {
    "n": "魔法書 (負重強化)",
    "type": "etc"
  },
  "l1j_item_45014": {
    "n": "魔法書 (地獄之牙)",
    "type": "etc"
  },
  "l1j_item_45015": {
    "n": "魔法書 (火箭)",
    "type": "etc"
  },
  "l1j_item_45016": {
    "n": "魔法書 (極光雷電)",
    "type": "etc"
  },
  "l1j_item_45017": {
    "n": "魔法書 (寒冰氣息)",
    "type": "etc"
  },
  "l1j_item_45018": {
    "n": "魔法書 (中級治癒術)",
    "type": "etc"
  },
  "l1j_item_45019": {
    "n": "魔法書 (闇盲咒術)",
    "type": "etc"
  },
  "l1j_item_45020": {
    "n": "魔法書 (鎧甲護持)",
    "type": "etc"
  },
  "l1j_item_45021": {
    "n": "魔法書 (起死回生術)",
    "type": "etc"
  },
  "l1j_item_45022": {
    "n": "魔法書 (能量感測)",
    "type": "etc"
  },
  "l1j_item_49005": {
    "n": "卡立普的袋子",
    "type": "etc"
  },
  "l1j_item_49006": {
    "n": "卡立普的袋子",
    "type": "etc"
  },
  "l1j_item_49007": {
    "n": "卡立普的袋子",
    "type": "etc"
  },
  "l1j_item_49008": {
    "n": "卡立普的袋子",
    "type": "etc"
  },
  "l1j_item_49009": {
    "n": "卡立普的高級袋子",
    "type": "etc"
  },
  "l1j_item_49010": {
    "n": "卡立普的高級袋子",
    "type": "etc"
  },
  "l1j_item_49011": {
    "n": "卡立普的高級袋子",
    "type": "etc"
  },
  "l1j_item_49012": {
    "n": "卡立普的高級袋子",
    "type": "etc"
  },
  "l1j_item_49013": {
    "n": "魔族的卷軸",
    "type": "etc"
  },
  "l1j_item_49014": {
    "n": "靈魂之球",
    "type": "etc"
  },
  "l1j_item_49015": {
    "n": "黑色米索莉溶液",
    "type": "etc"
  },
  "l1j_item_49016": {
    "n": "信紙",
    "type": "etc"
  },
  "l1j_item_49017": {
    "n": "信紙",
    "type": "etc"
  },
  "l1j_item_49018": {
    "n": "血盟的信紙",
    "type": "etc"
  },
  "l1j_item_49019": {
    "n": "血盟的信紙",
    "type": "etc"
  },
  "l1j_item_49020": {
    "n": "聖誕卡片",
    "type": "etc"
  },
  "l1j_item_49021": {
    "n": "聖誕卡片",
    "type": "etc"
  },
  "l1j_item_49022": {
    "n": "情人節卡片",
    "type": "etc"
  },
  "l1j_item_49023": {
    "n": "情人節卡片",
    "type": "etc"
  },
  "l1j_item_49024": {
    "n": "白色情人節卡片",
    "type": "etc"
  },
  "l1j_item_49025": {
    "n": "白色情人節卡片",
    "type": "etc"
  },
  "l1j_item_49026": {
    "n": "古老的金幣",
    "type": "etc"
  },
  "l1j_item_49027": {
    "n": "塔洛斯的鑽石",
    "type": "etc"
  },
  "l1j_item_49028": {
    "n": "塔洛斯的紅寶石",
    "type": "etc"
  },
  "l1j_item_49029": {
    "n": "塔洛斯的藍寶石",
    "type": "etc"
  },
  "l1j_item_49030": {
    "n": "塔洛斯的綠寶石",
    "type": "etc"
  },
  "l1j_item_49031": {
    "n": "冰之結晶",
    "type": "etc"
  },
  "l1j_item_49032": {
    "n": "冰魔的袋子",
    "type": "etc"
  },
  "l1j_item_49033": {
    "n": "冰之女王的袋子",
    "type": "etc"
  },
  "l1j_item_49034": {
    "n": "冰之女王的箱子",
    "type": "etc"
  },
  "l1j_item_49035": {
    "n": "冰之城鑰匙",
    "type": "etc"
  },
  "l1j_item_49036": {
    "n": "冰之城鑰匙",
    "type": "etc"
  },
  "l1j_item_49037": {
    "n": "魔法娃娃：長老",
    "type": "etc"
  },
  "l1j_item_49038": {
    "n": "魔法娃娃：奎斯坦修",
    "type": "etc"
  },
  "l1j_item_49039": {
    "n": "魔法娃娃：石頭高崙",
    "type": "etc"
  },
  "l1j_item_49040": {
    "n": "鯊魚卵",
    "type": "etc"
  },
  "l1j_item_49041": {
    "n": "鱷魚肉",
    "type": "etc"
  },
  "l1j_item_49042": {
    "n": "龍龜蛋",
    "type": "etc"
  },
  "l1j_item_49043": {
    "n": "奇異鸚鵡肉",
    "type": "etc"
  },
  "l1j_item_49044": {
    "n": "毒蠍肉",
    "type": "etc"
  },
  "l1j_item_49045": {
    "n": "伊萊克頓肉",
    "type": "etc"
  },
  "l1j_item_49046": {
    "n": "蜘蛛腿肉",
    "type": "etc"
  },
  "l1j_item_49047": {
    "n": "蟹肉",
    "type": "etc"
  },
  "l1j_item_49048": {
    "n": "綜合料理醬",
    "type": "etc"
  },
  "l1j_item_49049": {
    "n": "魚子醬",
    "type": "etc"
  },
  "l1j_item_49050": {
    "n": "鱷魚肉排",
    "type": "etc"
  },
  "l1j_item_49051": {
    "n": "龍龜蛋餅乾",
    "type": "etc"
  },
  "l1j_item_49052": {
    "n": "烤奇異鸚鵡",
    "type": "etc"
  },
  "l1j_item_49053": {
    "n": "毒蠍串燒",
    "type": "etc"
  },
  "l1j_item_49054": {
    "n": "燉伊萊克頓",
    "type": "etc"
  },
  "l1j_item_49055": {
    "n": "蜘蛛腿串燒",
    "type": "etc"
  },
  "l1j_item_49056": {
    "n": "蟹肉湯",
    "type": "etc"
  },
  "l1j_item_49057": {
    "n": "特別的 魚子醬",
    "type": "etc"
  },
  "l1j_item_49058": {
    "n": "特別的 鱷魚肉排",
    "type": "etc"
  },
  "l1j_item_49059": {
    "n": "特別的 龍龜蛋餅乾",
    "type": "etc"
  },
  "l1j_item_49060": {
    "n": "特別的 烤奇異鸚鵡",
    "type": "etc"
  },
  "l1j_item_49061": {
    "n": "特別的 毒蠍串燒",
    "type": "etc"
  },
  "l1j_item_49062": {
    "n": "特別的 燉伊萊克頓",
    "type": "etc"
  },
  "l1j_item_49063": {
    "n": "特別的 蜘蛛腿串燒",
    "type": "etc"
  },
  "l1j_item_49064": {
    "n": "特別的 蟹肉湯",
    "type": "etc"
  },
  "l1j_item_49065": {
    "n": "噴水池",
    "type": "etc"
  },
  "l1j_item_49066": {
    "n": "花園柱子",
    "type": "etc"
  },
  "l1j_item_49067": {
    "n": "花園柱子",
    "type": "etc"
  },
  "l1j_item_49068": {
    "n": "屏風",
    "type": "etc"
  },
  "l1j_item_49069": {
    "n": "屏風",
    "type": "etc"
  },
  "l1j_item_49070": {
    "n": "花瓶架",
    "type": "etc"
  },
  "l1j_item_49071": {
    "n": "派對蛋糕",
    "type": "etc"
  },
  "l1j_item_49072": {
    "n": "惡魔銅像",
    "type": "etc"
  },
  "l1j_item_49073": {
    "n": "飛龍銅像",
    "type": "etc"
  },
  "l1j_item_49074": {
    "n": "黑豹銅像",
    "type": "etc"
  },
  "l1j_item_49075": {
    "n": "艾莉絲銅像",
    "type": "etc"
  },
  "l1j_item_49076": {
    "n": "巨大牛人銅像",
    "type": "etc"
  },
  "l1j_item_49077": {
    "n": "惡魔的靈魂",
    "type": "etc"
  },
  "l1j_item_49078": {
    "n": "飛龍的靈魂",
    "type": "etc"
  },
  "l1j_item_49079": {
    "n": "黑豹的靈魂",
    "type": "etc"
  },
  "l1j_item_49080": {
    "n": "艾莉絲的靈魂",
    "type": "etc"
  },
  "l1j_item_49081": {
    "n": "巨大牛人的靈魂",
    "type": "etc"
  },
  "l1j_item_49082": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49083": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49084": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49085": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49086": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49087": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49088": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49089": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49090": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49091": {
    "n": "不完整的航海日誌",
    "type": "etc"
  },
  "l1j_item_49092": {
    "n": "龜裂之核",
    "type": "etc"
  },
  "l1j_item_49093": {
    "n": "歐西里斯初級寶箱碎片(上)",
    "type": "etc"
  },
  "l1j_item_49094": {
    "n": "歐西里斯初級寶箱碎片(下)",
    "type": "etc"
  },
  "l1j_item_49095": {
    "n": "上鎖的歐西里斯初級寶箱",
    "type": "etc"
  },
  "l1j_item_49096": {
    "n": "開鎖的歐西里斯初級寶箱",
    "type": "etc"
  },
  "l1j_item_49097": {
    "n": "歐西里斯高級寶箱碎片(上)",
    "type": "etc"
  },
  "l1j_item_49098": {
    "n": "歐西里斯高級寶箱碎片(下)",
    "type": "etc"
  },
  "l1j_item_49099": {
    "n": "上鎖的歐西里斯高級寶箱",
    "type": "etc"
  },
  "l1j_item_49100": {
    "n": "開鎖的歐西里斯高級寶箱",
    "type": "etc"
  },
  "l1j_item_49101": {
    "n": "時空裂痕碎片",
    "type": "etc"
  },
  "l1j_item_49102": {
    "n": "龍騎士書板(龍之護鎧)",
    "type": "etc"
  },
  "l1j_item_49103": {
    "n": "龍騎士書板(燃燒擊砍)",
    "type": "etc"
  },
  "l1j_item_49104": {
    "n": "龍騎士書板(護衛毀滅)",
    "type": "etc"
  },
  "l1j_item_49105": {
    "n": "龍騎士書板(岩漿噴吐)",
    "type": "etc"
  },
  "l1j_item_49106": {
    "n": "龍騎士書板(覺醒：安塔瑞斯)",
    "type": "etc"
  },
  "l1j_item_49107": {
    "n": "龍騎士書板(血之渴望)",
    "type": "etc"
  },
  "l1j_item_49108": {
    "n": "龍騎士書板(屠宰者)",
    "type": "etc"
  },
  "l1j_item_49109": {
    "n": "龍騎士書板(恐懼無助)",
    "type": "etc"
  },
  "l1j_item_49110": {
    "n": "龍騎士書板(衝擊之膚)",
    "type": "etc"
  },
  "l1j_item_49111": {
    "n": "龍騎士書板(覺醒：法利昂)",
    "type": "etc"
  },
  "l1j_item_49112": {
    "n": "龍騎士書板(致命身軀)",
    "type": "etc"
  },
  "l1j_item_49113": {
    "n": "龍騎士書板(奪命之雷)",
    "type": "etc"
  },
  "l1j_item_49114": {
    "n": "龍騎士書板(驚悚死神)",
    "type": "etc"
  },
  "l1j_item_49115": {
    "n": "龍騎士書板(寒冰噴吐)",
    "type": "etc"
  },
  "l1j_item_49116": {
    "n": "龍騎士書板(覺醒：巴拉卡斯)",
    "type": "etc"
  },
  "l1j_item_49117": {
    "n": "記憶水晶(鏡像)",
    "type": "etc"
  },
  "l1j_item_49118": {
    "n": "記憶水晶(混亂)",
    "type": "etc"
  },
  "l1j_item_49119": {
    "n": "記憶水晶(暴擊)",
    "type": "etc"
  },
  "l1j_item_49120": {
    "n": "記憶水晶(幻覺：歐吉)",
    "type": "etc"
  },
  "l1j_item_49121": {
    "n": "記憶水晶(立方：燃燒)",
    "type": "etc"
  },
  "l1j_item_49122": {
    "n": "記憶水晶(專注)",
    "type": "etc"
  },
  "l1j_item_49123": {
    "n": "記憶水晶(心靈破壞)",
    "type": "etc"
  },
  "l1j_item_49124": {
    "n": "記憶水晶(骷髏毀壞)",
    "type": "etc"
  },
  "l1j_item_49125": {
    "n": "記憶水晶(幻覺：巫妖)",
    "type": "etc"
  },
  "l1j_item_49126": {
    "n": "記憶水晶(立方：地裂)",
    "type": "etc"
  },
  "l1j_item_49127": {
    "n": "記憶水晶(耐力)",
    "type": "etc"
  },
  "l1j_item_49128": {
    "n": "記憶水晶(幻想)",
    "type": "etc"
  },
  "l1j_item_49129": {
    "n": "記憶水晶(武器破壞者)",
    "type": "etc"
  },
  "l1j_item_49130": {
    "n": "記憶水晶(幻覺：鑽石高崙)",
    "type": "etc"
  },
  "l1j_item_49131": {
    "n": "記憶水晶(立方：衝擊)",
    "type": "etc"
  },
  "l1j_item_49132": {
    "n": "記憶水晶(洞察)",
    "type": "etc"
  },
  "l1j_item_49133": {
    "n": "記憶水晶(恐慌)",
    "type": "etc"
  },
  "l1j_item_49134": {
    "n": "記憶水晶(疼痛的歡愉)",
    "type": "etc"
  },
  "l1j_item_49135": {
    "n": "記憶水晶(幻覺：化身)",
    "type": "etc"
  },
  "l1j_item_49136": {
    "n": "記憶水晶(立方：和諧)",
    "type": "etc"
  },
  "l1j_item_49137": {
    "n": "鮮奶油蛋糕",
    "type": "etc"
  },
  "l1j_item_49138": {
    "n": "巧克力蛋糕",
    "type": "etc"
  },
  "l1j_item_49139": {
    "n": "起司蛋糕",
    "type": "etc"
  },
  "l1j_item_49140": {
    "n": "綠茶蛋糕捲",
    "type": "etc"
  },
  "l1j_item_49141": {
    "n": "魔法蛋糕盒",
    "type": "etc"
  },
  "l1j_item_49142": {
    "n": "回憶蠟燭",
    "type": "etc"
  },
  "l1j_item_49143": {
    "n": "勇氣結晶",
    "type": "etc"
  },
  "l1j_item_49148": {
    "n": "飾品強化卷軸",
    "type": "etc"
  },
  "l1j_item_49149": {
    "n": "夏納的變身卷軸(等級30)",
    "type": "etc"
  },
  "l1j_item_49150": {
    "n": "夏納的變身卷軸(等級40)",
    "type": "etc"
  },
  "l1j_item_49151": {
    "n": "夏納的變身卷軸(等級52)",
    "type": "etc"
  },
  "l1j_item_49152": {
    "n": "夏納的變身卷軸(等級55)",
    "type": "etc"
  },
  "l1j_item_49153": {
    "n": "夏納的變身卷軸(等級60)",
    "type": "etc"
  },
  "l1j_item_49154": {
    "n": "夏納的變身卷軸(等級65)",
    "type": "etc"
  },
  "l1j_item_49155": {
    "n": "夏納的變身卷軸(等級70)",
    "type": "etc"
  },
  "l1j_item_49156": {
    "n": "屬性石",
    "type": "etc"
  },
  "l1j_item_49157": {
    "n": "刻印的骨頭碎片",
    "type": "etc"
  },
  "l1j_item_49158": {
    "n": "生命之樹果實",
    "type": "etc"
  },
  "l1j_item_49159": {
    "n": "調職命令書",
    "type": "etc"
  },
  "l1j_item_49160": {
    "n": "丹特斯的召書",
    "type": "etc"
  },
  "l1j_item_49161": {
    "n": "精靈的私語",
    "type": "etc"
  },
  "l1j_item_49162": {
    "n": "古代黑妖之秘笈",
    "type": "etc"
  },
  "l1j_item_49163": {
    "n": "密封的情報書",
    "type": "etc"
  },
  "l1j_item_49164": {
    "n": "間諜報告書",
    "type": "etc"
  },
  "l1j_item_49165": {
    "n": "聖殿2樓鑰匙",
    "type": "etc"
  },
  "l1j_item_49166": {
    "n": "聖殿3樓鑰匙",
    "type": "etc"
  },
  "l1j_item_49167": {
    "n": "魔之角笛",
    "type": "etc"
  },
  "l1j_item_49168": {
    "n": "破壞之秘藥",
    "type": "etc"
  },
  "l1j_item_49169": {
    "n": "污濁妖魔之心",
    "type": "etc"
  },
  "l1j_item_49170": {
    "n": "污濁精靈核晶",
    "type": "etc"
  },
  "l1j_item_49171": {
    "n": "希蓮恩的指令書",
    "type": "etc"
  },
  "l1j_item_49172": {
    "n": "希蓮恩的第一次信件",
    "type": "etc"
  },
  "l1j_item_49173": {
    "n": "希蓮恩的第二次信件",
    "type": "etc"
  },
  "l1j_item_49174": {
    "n": "希蓮恩的第三次信件",
    "type": "etc"
  },
  "l1j_item_49175": {
    "n": "希蓮恩的第四次信件",
    "type": "etc"
  },
  "l1j_item_49176": {
    "n": "希蓮恩的第五次信件",
    "type": "etc"
  },
  "l1j_item_49177": {
    "n": "希蓮恩的第六次信件",
    "type": "etc"
  },
  "l1j_item_49178": {
    "n": "希蓮恩的護身符",
    "type": "etc"
  },
  "l1j_item_49179": {
    "n": "希蓮恩之袋",
    "type": "etc"
  },
  "l1j_item_49180": {
    "n": "希蓮恩之袋",
    "type": "etc"
  },
  "l1j_item_49181": {
    "n": "希蓮恩的推薦書",
    "type": "etc"
  },
  "l1j_item_49182": {
    "n": "妖精森林瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_49183": {
    "n": "歐瑞村莊瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_49184": {
    "n": "風木村莊瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_49185": {
    "n": "威頓村莊瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_49186": {
    "n": "生鏽的笛子",
    "type": "etc"
  },
  "l1j_item_49187": {
    "n": "艾爾摩將軍之心",
    "type": "etc"
  },
  "l1j_item_49188": {
    "n": "索夏依卡靈魂之石",
    "type": "etc"
  },
  "l1j_item_49189": {
    "n": "索夏依卡靈魂之笛",
    "type": "etc"
  },
  "l1j_item_49190": {
    "n": "封印的索夏依卡遺物",
    "type": "etc"
  },
  "l1j_item_49191": {
    "n": "艾爾摩部隊日記",
    "type": "etc"
  },
  "l1j_item_49192": {
    "n": "時空裂痕水晶(綠色)",
    "type": "etc"
  },
  "l1j_item_49193": {
    "n": "時空裂痕水晶(藍色)",
    "type": "etc"
  },
  "l1j_item_49194": {
    "n": "第一次記憶碎片",
    "type": "etc"
  },
  "l1j_item_49195": {
    "n": "第二次記憶碎片",
    "type": "etc"
  },
  "l1j_item_49196": {
    "n": "第三次記憶碎片",
    "type": "etc"
  },
  "l1j_item_49197": {
    "n": "第一次邪念碎片",
    "type": "etc"
  },
  "l1j_item_49198": {
    "n": "第二次邪念碎片",
    "type": "etc"
  },
  "l1j_item_49199": {
    "n": "第三次邪念碎片",
    "type": "etc"
  },
  "l1j_item_49200": {
    "n": "未完成的時間水晶球",
    "type": "etc"
  },
  "l1j_item_49201": {
    "n": "完成的時間水晶球",
    "type": "etc"
  },
  "l1j_item_49202": {
    "n": "時空裂痕邪念碎片",
    "type": "etc"
  },
  "l1j_item_49203": {
    "n": "食腐獸之血",
    "type": "etc"
  },
  "l1j_item_49204": {
    "n": "翼龍之血",
    "type": "etc"
  },
  "l1j_item_49205": {
    "n": "特別的原石",
    "type": "etc"
  },
  "l1j_item_49206": {
    "n": "塞維斯邪念碎片",
    "type": "etc"
  },
  "l1j_item_49207": {
    "n": "靈魂之火灰燼",
    "type": "etc"
  },
  "l1j_item_49208": {
    "n": "藍色之火碎片",
    "type": "etc"
  },
  "l1j_item_49209": {
    "n": "長老普洛凱爾的信件",
    "type": "etc"
  },
  "l1j_item_49210": {
    "n": "普洛凱爾的第一次指令書",
    "type": "etc"
  },
  "l1j_item_49211": {
    "n": "普洛凱爾的第二次指令書",
    "type": "etc"
  },
  "l1j_item_49212": {
    "n": "普洛凱爾的第三次指令書",
    "type": "etc"
  },
  "l1j_item_49213": {
    "n": "普洛凱爾的第一次信件",
    "type": "etc"
  },
  "l1j_item_49214": {
    "n": "普洛凱爾的第二次信件",
    "type": "etc"
  },
  "l1j_item_49215": {
    "n": "普洛凱爾的礦物袋",
    "type": "etc"
  },
  "l1j_item_49216": {
    "n": "普洛凱爾的護身符",
    "type": "etc"
  },
  "l1j_item_49217": {
    "n": "妖魔搜索文件(妖魔森林)",
    "type": "etc"
  },
  "l1j_item_49218": {
    "n": "妖魔搜索文件(古魯丁)",
    "type": "etc"
  },
  "l1j_item_49219": {
    "n": "妖魔搜索文件(風木)",
    "type": "etc"
  },
  "l1j_item_49220": {
    "n": "妖魔密使變形卷軸",
    "type": "etc"
  },
  "l1j_item_49221": {
    "n": "妖魔密使首領間諜書",
    "type": "etc"
  },
  "l1j_item_49222": {
    "n": "妖魔密使之笛子",
    "type": "etc"
  },
  "l1j_item_49223": {
    "n": "妖魔密使的徽印",
    "type": "etc"
  },
  "l1j_item_49224": {
    "n": "幻術士同盟徽印",
    "type": "etc"
  },
  "l1j_item_49225": {
    "n": "雪怪之心",
    "type": "etc"
  },
  "l1j_item_49226": {
    "n": "結盟瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_49227": {
    "n": "紅色之火碎片",
    "type": "etc"
  },
  "l1j_item_49228": {
    "n": "發光的銀塊",
    "type": "etc"
  },
  "l1j_item_49229": {
    "n": "異界邪念粉末",
    "type": "etc"
  },
  "l1j_item_49230": {
    "n": "塔爾立昂的武器材料清單",
    "type": "etc"
  },
  "l1j_item_49231": {
    "n": "路西爾斯邪念碎片",
    "type": "etc"
  },
  "l1j_item_49232": {
    "n": "初級秘笈書",
    "type": "etc"
  },
  "l1j_item_49233": {
    "n": "狩獵秘笈",
    "type": "etc"
  },
  "l1j_item_49234": {
    "n": "便當袋",
    "type": "etc"
  },
  "l1j_item_49235": {
    "n": "克特的秘密",
    "type": "etc"
  },
  "l1j_item_49236": {
    "n": "庫卡斯的證明",
    "type": "etc"
  },
  "l1j_item_49237": {
    "n": "史塔利的證明",
    "type": "etc"
  },
  "l1j_item_49238": {
    "n": "狩獵的證明",
    "type": "etc"
  },
  "l1j_item_49239": {
    "n": "消滅之意志",
    "type": "etc"
  },
  "l1j_item_49240": {
    "n": "監視者之眼",
    "type": "etc"
  },
  "l1j_item_49241": {
    "n": "祭壇的碎片",
    "type": "etc"
  },
  "l1j_item_49242": {
    "n": "底比斯歐西里斯祭壇鑰匙",
    "type": "etc"
  },
  "l1j_item_49243": {
    "n": "香菜",
    "type": "etc"
  },
  "l1j_item_49244": {
    "n": "烤奎斯坦修的螯",
    "type": "etc"
  },
  "l1j_item_49245": {
    "n": "烤格利芬肉",
    "type": "etc"
  },
  "l1j_item_49246": {
    "n": "亞力安的尾巴肉排",
    "type": "etc"
  },
  "l1j_item_49247": {
    "n": "烤巨王龜肉",
    "type": "etc"
  },
  "l1j_item_49248": {
    "n": "幼龍翅膀串燒",
    "type": "etc"
  },
  "l1j_item_49249": {
    "n": "烤飛龍肉",
    "type": "etc"
  },
  "l1j_item_49250": {
    "n": "燉深海魚肉",
    "type": "etc"
  },
  "l1j_item_49251": {
    "n": "邪惡蜥蜴蛋湯",
    "type": "etc"
  },
  "l1j_item_49252": {
    "n": "特別的 烤奎斯坦修的螯",
    "type": "etc"
  },
  "l1j_item_49253": {
    "n": "特別的 烤格利芬肉",
    "type": "etc"
  },
  "l1j_item_49254": {
    "n": "特別的 亞力安的尾巴肉排",
    "type": "etc"
  },
  "l1j_item_49255": {
    "n": "特別的 烤巨王龜肉",
    "type": "etc"
  },
  "l1j_item_49256": {
    "n": "特別的 幼龍翅膀串燒",
    "type": "etc"
  },
  "l1j_item_49257": {
    "n": "特別的 烤飛龍肉",
    "type": "etc"
  },
  "l1j_item_49258": {
    "n": "特別的 燉深海魚肉",
    "type": "etc"
  },
  "l1j_item_49259": {
    "n": "特別的 邪惡蜥蜴蛋湯",
    "type": "etc"
  },
  "l1j_item_49260": {
    "n": "奎斯坦修的螯",
    "type": "etc"
  },
  "l1j_item_49261": {
    "n": "格利芬肉",
    "type": "etc"
  },
  "l1j_item_49262": {
    "n": "亞力安的尾巴",
    "type": "etc"
  },
  "l1j_item_49263": {
    "n": "巨王龜肉",
    "type": "etc"
  },
  "l1j_item_49264": {
    "n": "幼龍翅膀",
    "type": "etc"
  },
  "l1j_item_49265": {
    "n": "飛龍肉",
    "type": "etc"
  },
  "l1j_item_49266": {
    "n": "深海魚肉",
    "type": "etc"
  },
  "l1j_item_49267": {
    "n": "邪惡蜥蜴蛋",
    "type": "etc"
  },
  "l1j_item_49268": {
    "n": "愛瑪伊的畫像",
    "type": "etc"
  },
  "l1j_item_49269": {
    "n": "伊森之畫像",
    "type": "etc"
  },
  "l1j_item_49270": {
    "n": "寶石粉",
    "type": "etc"
  },
  "l1j_item_49271": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_49272": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_49273": {
    "n": "愛瑪伊的心",
    "type": "etc"
  },
  "l1j_item_49274": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_49275": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_49276": {
    "n": "伊森之心",
    "type": "etc"
  },
  "l1j_item_49277": {
    "n": "萊斯塔的戒指",
    "type": "etc"
  },
  "l1j_item_49278": {
    "n": "勇者的南瓜袋子",
    "type": "etc"
  },
  "l1j_item_49279": {
    "n": "勇者的南瓜袋子",
    "type": "etc"
  },
  "l1j_item_49280": {
    "n": "勇者的南瓜袋子",
    "type": "etc"
  },
  "l1j_item_49287": {
    "n": "普洛凱爾的第二次指令書",
    "type": "etc"
  },
  "l1j_item_49288": {
    "n": "普洛凱爾的第三次指令書",
    "type": "etc"
  },
  "l1j_item_49300": {
    "n": "庫庫爾坎初級寶箱碎片(上)",
    "type": "etc"
  },
  "l1j_item_49301": {
    "n": "庫庫爾坎初級寶箱碎片(下)",
    "type": "etc"
  },
  "l1j_item_49302": {
    "n": "上鎖的庫庫爾坎初級寶箱",
    "type": "etc"
  },
  "l1j_item_49303": {
    "n": "開鎖的庫庫爾坎初級寶箱",
    "type": "etc"
  },
  "l1j_item_49304": {
    "n": "庫庫爾坎高級寶箱碎片(上)",
    "type": "etc"
  },
  "l1j_item_49305": {
    "n": "庫庫爾坎高級寶箱碎片(下)",
    "type": "etc"
  },
  "l1j_item_49306": {
    "n": "上鎖的庫庫爾坎高級寶箱",
    "type": "etc"
  },
  "l1j_item_49307": {
    "n": "開鎖的庫庫爾坎高級寶箱",
    "type": "etc"
  },
  "l1j_item_49308": {
    "n": "提卡爾庫庫爾坎祭壇鑰匙",
    "type": "etc"
  },
  "l1j_item_49309": {
    "n": "閃爍的鱗片",
    "type": "etc"
  },
  "l1j_item_49310": {
    "n": "象牙塔對盔甲施法的卷軸",
    "type": "etc"
  },
  "l1j_item_49311": {
    "n": "象牙塔對武器施法的卷軸",
    "type": "etc"
  },
  "l1j_item_49501": {
    "n": "福利加速藥水",
    "type": "etc"
  },
  "l1j_item_49502": {
    "n": "福利呼吸藥水",
    "type": "etc"
  },
  "l1j_item_49503": {
    "n": "福利森林藥水",
    "type": "etc"
  },
  "l1j_item_49504": {
    "n": "福利勇敢藥水",
    "type": "etc"
  },
  "l1j_item_49505": {
    "n": "福利藍色藥水",
    "type": "etc"
  },
  "l1j_item_49506": {
    "n": "福利慎重藥水",
    "type": "etc"
  },
  "l1j_item_49507": {
    "n": "福利變形藥水",
    "type": "etc"
  },
  "l1j_item_49520": {
    "n": "海的秘密(A)",
    "type": "etc"
  },
  "l1j_item_49521": {
    "n": "海的秘密(B)",
    "type": "etc"
  },
  "l1j_item_49522": {
    "n": "海的秘密(C)",
    "type": "etc"
  },
  "l1j_item_49550": {
    "n": "象牙塔箭筒",
    "type": "etc"
  },
  "l1j_item_49551": {
    "n": "象牙塔的箭",
    "type": "etc"
  },
  "l1j_item_50001": {
    "n": "魔法卷軸 (初級治癒術)",
    "type": "etc"
  },
  "l1j_item_50002": {
    "n": "魔法卷軸 (日光術)",
    "type": "etc"
  },
  "l1j_item_50003": {
    "n": "魔法卷軸 (保護罩)",
    "type": "etc"
  },
  "l1j_item_50004": {
    "n": "魔法卷軸 (光箭)",
    "type": "etc"
  },
  "l1j_item_50005": {
    "n": "魔法卷軸 (指定傳送)",
    "type": "etc"
  },
  "l1j_item_50006": {
    "n": "魔法卷軸 (冰箭)",
    "type": "etc"
  },
  "l1j_item_50007": {
    "n": "魔法卷軸 (風刃)",
    "type": "etc"
  },
  "l1j_item_50008": {
    "n": "魔法卷軸 (神聖武器)",
    "type": "etc"
  },
  "l1j_item_50009": {
    "n": "魔法卷軸 (解毒術)",
    "type": "etc"
  },
  "l1j_item_50010": {
    "n": "魔法卷軸 (寒冷戰慄)",
    "type": "etc"
  },
  "l1j_item_50011": {
    "n": "魔法卷軸 (毒咒)",
    "type": "etc"
  },
  "l1j_item_50012": {
    "n": "魔法卷軸 (擬似魔法武器)",
    "type": "etc"
  },
  "l1j_item_50013": {
    "n": "魔法卷軸 (無所遁形術)",
    "type": "etc"
  },
  "l1j_item_50014": {
    "n": "魔法卷軸 (負重強化)",
    "type": "etc"
  },
  "l1j_item_50015": {
    "n": "魔法卷軸 (火箭)",
    "type": "etc"
  },
  "l1j_item_50016": {
    "n": "魔法卷軸 (地獄之牙)",
    "type": "etc"
  },
  "l1j_item_50017": {
    "n": "魔法卷軸 (極光雷電)",
    "type": "etc"
  },
  "l1j_item_50018": {
    "n": "魔法卷軸 (起死回生術)",
    "type": "etc"
  },
  "l1j_item_50019": {
    "n": "魔法卷軸 (中級治癒術)",
    "type": "etc"
  },
  "l1j_item_50020": {
    "n": "魔法卷軸 (闇盲咒術)",
    "type": "etc"
  },
  "l1j_item_50021": {
    "n": "魔法卷軸 (鎧甲護持)",
    "type": "etc"
  },
  "l1j_item_50022": {
    "n": "魔法卷軸 (寒冰氣息)",
    "type": "etc"
  },
  "l1j_item_50023": {
    "n": "魔法卷軸 (能量感測)",
    "type": "etc"
  },
  "l1j_item_50025": {
    "n": "魔法卷軸 (燃燒的火球)",
    "type": "etc"
  },
  "l1j_item_50026": {
    "n": "魔法卷軸 (通暢氣脈術)",
    "type": "etc"
  },
  "l1j_item_50027": {
    "n": "魔法卷軸 (壞物術)",
    "type": "etc"
  },
  "l1j_item_50028": {
    "n": "魔法卷軸 (吸血鬼之吻)",
    "type": "etc"
  },
  "l1j_item_50029": {
    "n": "魔法卷軸 (緩速術)",
    "type": "etc"
  },
  "l1j_item_50030": {
    "n": "魔法卷軸 (岩牢)",
    "type": "etc"
  },
  "l1j_item_50031": {
    "n": "魔法卷軸 (魔法屏障)",
    "type": "etc"
  },
  "l1j_item_50032": {
    "n": "魔法卷軸 (冥想術)",
    "type": "etc"
  },
  "l1j_item_50033": {
    "n": "魔法卷軸 (木乃伊的詛咒)",
    "type": "etc"
  },
  "l1j_item_50034": {
    "n": "魔法卷軸 (極道落雷)",
    "type": "etc"
  },
  "l1j_item_50035": {
    "n": "魔法卷軸 (高級治癒術)",
    "type": "etc"
  },
  "l1j_item_50036": {
    "n": "魔法卷軸 (迷魅術)",
    "type": "etc"
  },
  "l1j_item_50037": {
    "n": "魔法卷軸 (聖潔之光)",
    "type": "etc"
  },
  "l1j_item_50038": {
    "n": "魔法卷軸 (冰錐)",
    "type": "etc"
  },
  "l1j_item_50039": {
    "n": "魔法卷軸 (魔力奪取)",
    "type": "etc"
  },
  "l1j_item_50040": {
    "n": "魔法卷軸 (黑闇之影)",
    "type": "etc"
  },
  "l1j_item_50041": {
    "n": "魔法卷軸 (造屍術)",
    "type": "etc"
  },
  "l1j_item_50042": {
    "n": "魔法卷軸 (體魄強健術)",
    "type": "etc"
  },
  "l1j_item_50043": {
    "n": "魔法卷軸 (加速術)",
    "type": "etc"
  },
  "l1j_item_50044": {
    "n": "魔法卷軸 (魔法相消術)",
    "type": "etc"
  },
  "l1j_item_50045": {
    "n": "魔法卷軸 (地裂術)",
    "type": "etc"
  },
  "l1j_item_50046": {
    "n": "魔法卷軸 (烈炎術)",
    "type": "etc"
  },
  "l1j_item_50047": {
    "n": "魔法卷軸 (弱化術)",
    "type": "etc"
  },
  "l1j_item_50048": {
    "n": "魔法卷軸 (祝福魔法武器)",
    "type": "etc"
  },
  "l1j_item_50049": {
    "n": "魔法卷軸 (體力回復術)",
    "type": "etc"
  },
  "l1j_item_50052": {
    "n": "魔法卷軸 (神聖疾走)",
    "type": "etc"
  },
  "l1j_item_50054": {
    "n": "魔法卷軸 (強力加速術)",
    "type": "etc"
  },
  "l1j_item_50055": {
    "n": "魔法卷軸 (狂暴術)",
    "type": "etc"
  },
  "l1j_item_50056": {
    "n": "魔法卷軸 (疾病術)",
    "type": "etc"
  },
  "l1j_item_50057": {
    "n": "魔法卷軸 (全部治癒術)",
    "type": "etc"
  },
  "l1j_item_50058": {
    "n": "魔法卷軸 (火牢)",
    "type": "etc"
  },
  "l1j_item_50059": {
    "n": "魔法卷軸 (冰雪暴)",
    "type": "etc"
  },
  "l1j_item_50060": {
    "n": "魔法卷軸 (隱身術)",
    "type": "etc"
  },
  "l1j_item_50061": {
    "n": "魔法卷軸 (返生術)",
    "type": "etc"
  },
  "l1j_item_50063": {
    "n": "魔法卷軸 (治癒能量風暴)",
    "type": "etc"
  },
  "l1j_item_50064": {
    "n": "魔法卷軸 (魔法封印)",
    "type": "etc"
  },
  "l1j_item_50065": {
    "n": "魔法卷軸 (雷霆風暴)",
    "type": "etc"
  },
  "l1j_item_50066": {
    "n": "魔法卷軸 (沉睡之霧)",
    "type": "etc"
  },
  "l1j_item_50067": {
    "n": "魔法卷軸 (變形術)",
    "type": "etc"
  },
  "l1j_item_50068": {
    "n": "魔法卷軸 (聖結界)",
    "type": "etc"
  },
  "l1j_item_50069": {
    "n": "魔法卷軸 (集體傳送術)",
    "type": "etc"
  },
  "l1j_item_50071": {
    "n": "魔法卷軸 (藥水霜化術)",
    "type": "etc"
  },
  "l1j_item_50072": {
    "n": "魔法卷軸 (強力無所遁形術)",
    "type": "etc"
  },
  "l1j_item_50073": {
    "n": "魔法卷軸 (創造魔法武器)",
    "type": "etc"
  },
  "l1j_item_50074": {
    "n": "魔法卷軸 (流星雨)",
    "type": "etc"
  },
  "l1j_item_50075": {
    "n": "魔法卷軸 (終極返生術)",
    "type": "etc"
  },
  "l1j_item_50076": {
    "n": "魔法卷軸 (集體緩速術)",
    "type": "etc"
  },
  "l1j_item_50077": {
    "n": "魔法卷軸 (究極光裂術)",
    "type": "etc"
  },
  "l1j_item_50078": {
    "n": "魔法卷軸 (絕對屏障)",
    "type": "etc"
  },
  "l1j_item_50079": {
    "n": "魔法卷軸 (靈魂昇華)",
    "type": "etc"
  },
  "l1j_item_50080": {
    "n": "魔法卷軸 (冰雪颶風)",
    "type": "etc"
  },
  "l1j_item_50158": {
    "n": "魔法卷軸 (生命之泉)",
    "type": "etc"
  },
  "l1j_item_50169": {
    "n": "魔法卷軸 (體能激發)",
    "type": "etc"
  },
  "l1j_item_50181": {
    "n": "魔法卷軸 (龍之護鎧)",
    "type": "etc"
  },
  "l1j_item_50500": {
    "n": "多魯嘉之袋",
    "type": "etc"
  },
  "l1j_item_50501": {
    "n": "龍之鑰匙",
    "type": "etc"
  },
  "l1j_item_50502": {
    "n": "淘氣幼龍蛋",
    "type": "etc"
  },
  "l1j_item_50503": {
    "n": "頑皮幼龍蛋",
    "type": "etc"
  },
  "l1j_item_50504": {
    "n": "受封印地龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50505": {
    "n": "受封印水龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50506": {
    "n": "受封印風龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50507": {
    "n": "受封印火龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50508": {
    "n": "地龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50509": {
    "n": "水龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50510": {
    "n": "風龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50511": {
    "n": "火龍之魔眼",
    "type": "etc"
  },
  "l1j_item_50512": {
    "n": "誕生之魔眼",
    "type": "etc"
  },
  "l1j_item_50513": {
    "n": "形象之魔眼",
    "type": "etc"
  },
  "l1j_item_50514": {
    "n": "生命之魔眼",
    "type": "etc"
  },
  "l1j_item_50515": {
    "n": "死亡競賽之勝利碎片",
    "type": "etc"
  },
  "l1j_item_50516": {
    "n": "幽靈之家之勝利碎片",
    "type": "etc"
  },
  "l1j_item_50517": {
    "n": "寵物競速之勝利碎片",
    "type": "etc"
  },
  "l1j_item_50518": {
    "n": "寵物戰之勝利碎片",
    "type": "etc"
  },
  "l1j_item_50519": {
    "n": "無限大賽之勝利碎片",
    "type": "etc"
  },
  "l1j_item_50520": {
    "n": "地龍之渴望的眼淚",
    "type": "etc"
  },
  "l1j_item_50521": {
    "n": "火龍之渴望的眼淚",
    "type": "etc"
  },
  "l1j_item_50522": {
    "n": "水龍之渴望的眼淚",
    "type": "etc"
  },
  "l1j_item_50523": {
    "n": "風龍之渴望的眼淚",
    "type": "etc"
  },
  "l1j_item_50524": {
    "n": "侏儒蘑菇",
    "type": "etc"
  },
  "l1j_item_50525": {
    "n": "侏儒符咒",
    "type": "etc"
  },
  "l1j_item_50526": {
    "n": "古老水珍珠",
    "type": "etc"
  },
  "l1j_item_50527": {
    "n": "古老白水晶",
    "type": "etc"
  },
  "l1j_item_50528": {
    "n": "喀瑪王之心",
    "type": "etc"
  },
  "l1j_item_50529": {
    "n": "喀瑪王之心",
    "type": "etc"
  },
  "l1j_item_50530": {
    "n": "喀瑪王之心",
    "type": "etc"
  },
  "l1j_item_50531": {
    "n": "強盜首領的寶箱鑰匙",
    "type": "etc"
  },
  "l1j_item_140006": {
    "n": "創造怪物魔杖",
    "type": "etc"
  },
  "l1j_item_140008": {
    "n": "變形魔杖",
    "type": "etc"
  },
  "l1j_item_140010": {
    "n": "治癒藥水",
    "type": "etc"
  },
  "l1j_item_140011": {
    "n": "強力治癒藥水",
    "type": "etc"
  },
  "l1j_item_140012": {
    "n": "終極治癒藥水",
    "type": "etc"
  },
  "l1j_item_140013": {
    "n": "自我加速藥水",
    "type": "etc"
  },
  "l1j_item_140014": {
    "n": "勇敢藥水",
    "type": "etc"
  },
  "l1j_item_140015": {
    "n": "加速魔力回復藥水",
    "type": "etc"
  },
  "l1j_item_140016": {
    "n": "慎重藥水",
    "type": "etc"
  },
  "l1j_item_140018": {
    "n": "強化自我加速藥水",
    "type": "etc"
  },
  "l1j_item_140061": {
    "n": "檸檬",
    "type": "etc"
  },
  "l1j_item_140062": {
    "n": "香蕉",
    "type": "etc"
  },
  "l1j_item_140065": {
    "n": "情人禮物(糖果)",
    "type": "etc"
  },
  "l1j_item_140068": {
    "n": "精靈餅乾",
    "type": "etc"
  },
  "l1j_item_140069": {
    "n": "橘子",
    "type": "etc"
  },
  "l1j_item_140072": {
    "n": "烤薄餅",
    "type": "etc"
  },
  "l1j_item_140074": {
    "n": "對盔甲施法的卷軸",
    "type": "etc"
  },
  "l1j_item_140087": {
    "n": "對武器施法的卷軸",
    "type": "etc"
  },
  "l1j_item_140088": {
    "n": "變形卷軸",
    "type": "etc"
  },
  "l1j_item_140089": {
    "n": "復活卷軸",
    "type": "etc"
  },
  "l1j_item_140100": {
    "n": "瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_140119": {
    "n": "解除咀咒的卷軸",
    "type": "etc"
  },
  "l1j_item_140129": {
    "n": "奇安的卷軸",
    "type": "etc"
  },
  "l1j_item_140130": {
    "n": "金侃的卷軸",
    "type": "etc"
  },
  "l1j_item_140329": {
    "n": "原住民圖騰",
    "type": "etc"
  },
  "l1j_item_140506": {
    "n": "安特的水果",
    "type": "etc"
  },
  "l1j_item_240010": {
    "n": "治癒藥水",
    "type": "etc"
  },
  "l1j_item_240011": {
    "n": "強力治癒藥水",
    "type": "etc"
  },
  "l1j_item_240012": {
    "n": "終極治癒藥水",
    "type": "etc"
  },
  "l1j_item_240074": {
    "n": "對盔甲施法的卷軸",
    "type": "etc"
  },
  "l1j_item_240087": {
    "n": "對武器施法的卷軸",
    "type": "etc"
  },
  "l1j_item_240100": {
    "n": "瞬間移動卷軸",
    "type": "etc"
  },
  "l1j_item_1": {
    "n": "歐西斯匕首",
    "type": "wpn"
  },
  "l1j_item_2": {
    "n": "骰子匕首",
    "type": "wpn"
  },
  "l1j_item_3": {
    "n": "短劍的劍身",
    "type": "wpn"
  },
  "l1j_item_4": {
    "n": "匕首",
    "type": "wpn"
  },
  "l1j_item_5": {
    "n": "精靈匕首",
    "type": "wpn"
  },
  "l1j_item_6": {
    "n": "拉斯塔巴德短劍",
    "type": "wpn"
  },
  "l1j_item_7": {
    "n": "象牙塔短劍",
    "type": "wpn"
  },
  "l1j_item_8": {
    "n": "米索莉短劍",
    "type": "wpn"
  },
  "l1j_item_9": {
    "n": "奧里哈魯根短劍",
    "type": "wpn"
  },
  "l1j_item_10": {
    "n": "小武士刀",
    "type": "wpn"
  },
  "l1j_item_11": {
    "n": "水晶短劍",
    "type": "wpn"
  },
  "l1j_item_12": {
    "n": "風刃短劍",
    "type": "wpn"
  },
  "l1j_item_13": {
    "n": "死亡之指",
    "type": "wpn"
  },
  "l1j_item_14": {
    "n": "混沌之刺",
    "type": "wpn"
  },
  "l1j_item_15": {
    "n": "失去魔力的克特之劍",
    "type": "wpn"
  },
  "l1j_item_16": {
    "n": "復仇之劍",
    "type": "wpn"
  },
  "l1j_item_19": {
    "n": "長劍的劍身",
    "type": "wpn"
  },
  "l1j_item_20": {
    "n": "奧里哈魯根的劍身",
    "type": "wpn"
  },
  "l1j_item_21": {
    "n": "歐西斯短劍",
    "type": "wpn"
  },
  "l1j_item_22": {
    "n": "鎖子甲破壞者",
    "type": "wpn"
  },
  "l1j_item_23": {
    "n": "闊劍",
    "type": "wpn"
  },
  "l1j_item_24": {
    "n": "短劍",
    "type": "wpn"
  },
  "l1j_item_25": {
    "n": "銀劍",
    "type": "wpn"
  },
  "l1j_item_26": {
    "n": "小侏儒短劍",
    "type": "wpn"
  },
  "l1j_item_27": {
    "n": "彎刀",
    "type": "wpn"
  },
  "l1j_item_28": {
    "n": "精靈短劍",
    "type": "wpn"
  },
  "l1j_item_29": {
    "n": "銀長劍",
    "type": "wpn"
  },
  "l1j_item_30": {
    "n": "紅騎士之劍",
    "type": "wpn"
  },
  "l1j_item_31": {
    "n": "長劍",
    "type": "wpn"
  },
  "l1j_item_32": {
    "n": "侵略者之劍",
    "type": "wpn"
  },
  "l1j_item_33": {
    "n": "榮耀之劍",
    "type": "wpn"
  },
  "l1j_item_34": {
    "n": "血紅慾望短劍",
    "type": "wpn"
  },
  "l1j_item_35": {
    "n": "象牙塔單手劍",
    "type": "wpn"
  },
  "l1j_item_36": {
    "n": "幻象之劍",
    "type": "wpn"
  },
  "l1j_item_37": {
    "n": "大馬士革刀",
    "type": "wpn"
  },
  "l1j_item_38": {
    "n": "拉斯塔巴德長劍",
    "type": "wpn"
  },
  "l1j_item_39": {
    "n": "短刀",
    "type": "wpn"
  },
  "l1j_item_40": {
    "n": "血色巨劍",
    "type": "wpn"
  },
  "l1j_item_41": {
    "n": "武士刀",
    "type": "wpn"
  },
  "l1j_item_42": {
    "n": "細劍",
    "type": "wpn"
  },
  "l1j_item_43": {
    "n": "海賊彎刀",
    "type": "wpn"
  },
  "l1j_item_44": {
    "n": "古代黑暗妖精之劍",
    "type": "wpn"
  },
  "l1j_item_45": {
    "n": "波曲王之劍",
    "type": "wpn"
  },
  "l1j_item_46": {
    "n": "生命之劍",
    "type": "wpn"
  },
  "l1j_item_47": {
    "n": "沉默之劍",
    "type": "wpn"
  },
  "l1j_item_48": {
    "n": "象牙塔雙手劍",
    "type": "wpn"
  },
  "l1j_item_49": {
    "n": "武官之刃",
    "type": "wpn"
  },
  "l1j_item_50": {
    "n": "赤焰之劍",
    "type": "wpn"
  },
  "l1j_item_51": {
    "n": "黃金權杖",
    "type": "wpn"
  },
  "l1j_item_52": {
    "n": "雙手劍",
    "type": "wpn"
  },
  "l1j_item_53": {
    "n": "蜥蜴王勇士之劍",
    "type": "wpn"
  },
  "l1j_item_54": {
    "n": "克特之劍",
    "type": "wpn"
  },
  "l1j_item_55": {
    "n": "黑暗之劍",
    "type": "wpn"
  },
  "l1j_item_56": {
    "n": "黑燄之劍",
    "type": "wpn"
  },
  "l1j_item_57": {
    "n": "瑟魯基之劍",
    "type": "wpn"
  },
  "l1j_item_58": {
    "n": "死亡騎士的烈炎之劍",
    "type": "wpn"
  },
  "l1j_item_59": {
    "n": "騎士范德之劍",
    "type": "wpn"
  },
  "l1j_item_60": {
    "n": "末日刀",
    "type": "wpn"
  },
  "l1j_item_61": {
    "n": "真．冥皇執行劍",
    "type": "wpn"
  },
  "l1j_item_62": {
    "n": "武官雙手劍",
    "type": "wpn"
  },
  "l1j_item_63": {
    "n": "惡魔之劍",
    "type": "wpn"
  },
  "l1j_item_64": {
    "n": "巨劍",
    "type": "wpn"
  },
  "l1j_item_65": {
    "n": "天空之劍",
    "type": "wpn"
  },
  "l1j_item_66": {
    "n": "屠龍劍",
    "type": "wpn"
  },
  "l1j_item_67": {
    "n": "古老的巨劍",
    "type": "wpn"
  },
  "l1j_item_68": {
    "n": "古老的劍",
    "type": "wpn"
  },
  "l1j_item_69": {
    "n": "青銅 雙刀",
    "type": "wpn"
  },
  "l1j_item_70": {
    "n": "尖刺雙刀",
    "type": "wpn"
  },
  "l1j_item_71": {
    "n": "鋼鐵 雙刀",
    "type": "wpn"
  },
  "l1j_item_72": {
    "n": "暗影 雙刀",
    "type": "wpn"
  },
  "l1j_item_73": {
    "n": "象牙塔雙刀",
    "type": "wpn"
  },
  "l1j_item_74": {
    "n": "銀光 雙刀",
    "type": "wpn"
  },
  "l1j_item_75": {
    "n": "黑暗 雙刀",
    "type": "wpn"
  },
  "l1j_item_76": {
    "n": "倫得雙刀",
    "type": "wpn"
  },
  "l1j_item_77": {
    "n": "短 雙刀",
    "type": "wpn"
  },
  "l1j_item_78": {
    "n": "暗殺軍王之痕",
    "type": "wpn"
  },
  "l1j_item_79": {
    "n": "深淵雙刀",
    "type": "wpn"
  },
  "l1j_item_80": {
    "n": "大馬士革 雙刀",
    "type": "wpn"
  },
  "l1j_item_81": {
    "n": "幽暗 雙刀",
    "type": "wpn"
  },
  "l1j_item_82": {
    "n": "拉斯塔巴德雙刀",
    "type": "wpn"
  },
  "l1j_item_83": {
    "n": "狄亞得雙刀",
    "type": "wpn"
  },
  "l1j_item_84": {
    "n": "暗黑雙刀",
    "type": "wpn"
  },
  "l1j_item_85": {
    "n": "惡魔雙刀",
    "type": "wpn"
  },
  "l1j_item_86": {
    "n": "紅影雙刀",
    "type": "wpn"
  },
  "l1j_item_87": {
    "n": "不為人知的矛",
    "type": "wpn"
  },
  "l1j_item_88": {
    "n": "潘的角",
    "type": "wpn"
  },
  "l1j_item_89": {
    "n": "覆上米索莉的角",
    "type": "wpn"
  },
  "l1j_item_90": {
    "n": "巴迪須",
    "type": "wpn"
  },
  "l1j_item_91": {
    "n": "歐西斯之矛",
    "type": "wpn"
  },
  "l1j_item_92": {
    "n": "柴刀",
    "type": "wpn"
  },
  "l1j_item_93": {
    "n": "三叉戟",
    "type": "wpn"
  },
  "l1j_item_94": {
    "n": "帕提森",
    "type": "wpn"
  },
  "l1j_item_95": {
    "n": "槍",
    "type": "wpn"
  },
  "l1j_item_96": {
    "n": "矛",
    "type": "wpn"
  },
  "l1j_item_97": {
    "n": "吉薩",
    "type": "wpn"
  },
  "l1j_item_98": {
    "n": "闊矛",
    "type": "wpn"
  },
  "l1j_item_99": {
    "n": "精靈之矛",
    "type": "wpn"
  },
  "l1j_item_100": {
    "n": "覆上奧里哈魯根的角",
    "type": "wpn"
  },
  "l1j_item_101": {
    "n": "拉斯塔巴德矛",
    "type": "wpn"
  },
  "l1j_item_102": {
    "n": "露西錘",
    "type": "wpn"
  },
  "l1j_item_103": {
    "n": "戟",
    "type": "wpn"
  },
  "l1j_item_104": {
    "n": "法丘",
    "type": "wpn"
  },
  "l1j_item_105": {
    "n": "象牙塔長矛",
    "type": "wpn"
  },
  "l1j_item_106": {
    "n": "貝卡合金",
    "type": "wpn"
  },
  "l1j_item_107": {
    "n": "深紅長矛",
    "type": "wpn"
  },
  "l1j_item_108": {
    "n": "失去魔力的惡魔鐮刀",
    "type": "wpn"
  },
  "l1j_item_109": {
    "n": "失去魔力的巴風特魔杖",
    "type": "wpn"
  },
  "l1j_item_110": {
    "n": "失去魔力的巴列斯魔杖",
    "type": "wpn"
  },
  "l1j_item_111": {
    "n": "失去魔力的冰之女王魔杖",
    "type": "wpn"
  },
  "l1j_item_112": {
    "n": "抗魔精靈短劍",
    "type": "wpn"
  },
  "l1j_item_113": {
    "n": "敏捷精靈短劍",
    "type": "wpn"
  },
  "l1j_item_114": {
    "n": "威嚴權杖",
    "type": "wpn"
  },
  "l1j_item_115": {
    "n": "水晶魔杖",
    "type": "wpn"
  },
  "l1j_item_116": {
    "n": "黑法師之杖",
    "type": "wpn"
  },
  "l1j_item_117": {
    "n": "蕾雅魔杖",
    "type": "wpn"
  },
  "l1j_item_118": {
    "n": "漆黑水晶球",
    "type": "wpn"
  },
  "l1j_item_119": {
    "n": "惡魔鐮刀",
    "type": "wpn"
  },
  "l1j_item_120": {
    "n": "象牙塔魔杖",
    "type": "wpn"
  },
  "l1j_item_121": {
    "n": "冰之女王魔杖",
    "type": "wpn"
  },
  "l1j_item_122": {
    "n": "拉斯塔巴德魔杖",
    "type": "wpn"
  },
  "l1j_item_123": {
    "n": "巴列斯魔杖",
    "type": "wpn"
  },
  "l1j_item_124": {
    "n": "巴風特魔杖",
    "type": "wpn"
  },
  "l1j_item_125": {
    "n": "巫術魔法杖",
    "type": "wpn"
  },
  "l1j_item_126": {
    "n": "瑪那魔杖",
    "type": "wpn"
  },
  "l1j_item_127": {
    "n": "鋼鐵瑪那魔杖",
    "type": "wpn"
  },
  "l1j_item_128": {
    "n": "橡木魔法杖",
    "type": "wpn"
  },
  "l1j_item_129": {
    "n": "美基魔法杖",
    "type": "wpn"
  },
  "l1j_item_130": {
    "n": "紅水晶魔杖",
    "type": "wpn"
  },
  "l1j_item_131": {
    "n": "力量魔法杖",
    "type": "wpn"
  },
  "l1j_item_132": {
    "n": "神官魔杖",
    "type": "wpn"
  },
  "l1j_item_133": {
    "n": "古代人的智慧",
    "type": "wpn"
  },
  "l1j_item_134": {
    "n": "聖晶魔杖",
    "type": "wpn"
  },
  "l1j_item_135": {
    "n": "不為人知的斧",
    "type": "wpn"
  },
  "l1j_item_136": {
    "n": "斧",
    "type": "wpn"
  },
  "l1j_item_137": {
    "n": "亞連",
    "type": "wpn"
  },
  "l1j_item_138": {
    "n": "木棒",
    "type": "wpn"
  },
  "l1j_item_139": {
    "n": "弗萊爾",
    "type": "wpn"
  },
  "l1j_item_140": {
    "n": "釘錘",
    "type": "wpn"
  },
  "l1j_item_141": {
    "n": "戰錘",
    "type": "wpn"
  },
  "l1j_item_142": {
    "n": "銀斧",
    "type": "wpn"
  },
  "l1j_item_143": {
    "n": "戰斧",
    "type": "wpn"
  },
  "l1j_item_144": {
    "n": "侏儒鐵斧",
    "type": "wpn"
  },
  "l1j_item_145": {
    "n": "狂戰士斧",
    "type": "wpn"
  },
  "l1j_item_146": {
    "n": "流星錘",
    "type": "wpn"
  },
  "l1j_item_147": {
    "n": "象牙塔斧頭",
    "type": "wpn"
  },
  "l1j_item_148": {
    "n": "巨斧",
    "type": "wpn"
  },
  "l1j_item_149": {
    "n": "牛人斧頭",
    "type": "wpn"
  },
  "l1j_item_150": {
    "n": "天父之怒",
    "type": "wpn"
  },
  "l1j_item_151": {
    "n": "惡魔斧頭",
    "type": "wpn"
  },
  "l1j_item_152": {
    "n": "青銅 鋼爪",
    "type": "wpn"
  },
  "l1j_item_153": {
    "n": "鋼鐵 鋼爪",
    "type": "wpn"
  },
  "l1j_item_154": {
    "n": "暗影 鋼爪",
    "type": "wpn"
  },
  "l1j_item_155": {
    "n": "魔獸軍王之爪",
    "type": "wpn"
  },
  "l1j_item_156": {
    "n": "象牙塔鋼爪",
    "type": "wpn"
  },
  "l1j_item_157": {
    "n": "銀光 鋼爪",
    "type": "wpn"
  },
  "l1j_item_158": {
    "n": "黑暗 鋼爪",
    "type": "wpn"
  },
  "l1j_item_159": {
    "n": "短 鋼爪",
    "type": "wpn"
  },
  "l1j_item_160": {
    "n": "獸王鋼爪",
    "type": "wpn"
  },
  "l1j_item_161": {
    "n": "大馬士革 鋼爪",
    "type": "wpn"
  },
  "l1j_item_162": {
    "n": "幽暗 鋼爪",
    "type": "wpn"
  },
  "l1j_item_163": {
    "n": "巴蘭卡鋼爪",
    "type": "wpn"
  },
  "l1j_item_164": {
    "n": "暗黑鋼爪",
    "type": "wpn"
  },
  "l1j_item_165": {
    "n": "惡魔鋼爪",
    "type": "wpn"
  },
  "l1j_item_166": {
    "n": "恨之鋼爪",
    "type": "wpn"
  },
  "l1j_item_168": {
    "n": "黑暗十字弓",
    "type": "wpn"
  },
  "l1j_item_169": {
    "n": "獵人之弓",
    "type": "wpn"
  },
  "l1j_item_170": {
    "n": "精靈弓",
    "type": "wpn"
  },
  "l1j_item_171": {
    "n": "歐西斯弓",
    "type": "wpn"
  },
  "l1j_item_172": {
    "n": "弓",
    "type": "wpn"
  },
  "l1j_item_173": {
    "n": "短弓",
    "type": "wpn"
  },
  "l1j_item_174": {
    "n": "象牙塔石弓",
    "type": "wpn"
  },
  "l1j_item_175": {
    "n": "象牙塔長弓",
    "type": "wpn"
  },
  "l1j_item_176": {
    "n": "拉斯塔巴德弓",
    "type": "wpn"
  },
  "l1j_item_177": {
    "n": "幽暗十字弓",
    "type": "wpn"
  },
  "l1j_item_178": {
    "n": "寂靜十字弓",
    "type": "wpn"
  },
  "l1j_item_179": {
    "n": "古代妖精弩槍",
    "type": "wpn"
  },
  "l1j_item_180": {
    "n": "十字弓",
    "type": "wpn"
  },
  "l1j_item_181": {
    "n": "尤米弓",
    "type": "wpn"
  },
  "l1j_item_182": {
    "n": "古老的弩槍",
    "type": "wpn"
  },
  "l1j_item_183": {
    "n": "幻象之弓",
    "type": "wpn"
  },
  "l1j_item_184": {
    "n": "赤焰之弓",
    "type": "wpn"
  },
  "l1j_item_185": {
    "n": "惡魔十字弓",
    "type": "wpn"
  },
  "l1j_item_186": {
    "n": "狄亞得十字弓",
    "type": "wpn"
  },
  "l1j_item_187": {
    "n": "拉斯塔巴德十字弓",
    "type": "wpn"
  },
  "l1j_item_188": {
    "n": "拉斯塔巴德重十字弓",
    "type": "wpn"
  },
  "l1j_item_189": {
    "n": "暗黑十字弓",
    "type": "wpn"
  },
  "l1j_item_190": {
    "n": "沙哈之弓",
    "type": "wpn"
  },
  "l1j_item_191": {
    "n": "弒神者之弓",
    "type": "wpn"
  },
  "l1j_item_192": {
    "n": "水精靈之弓",
    "type": "wpn"
  },
  "l1j_item_193": {
    "n": "鐵手甲",
    "type": "wpn"
  },
  "l1j_item_194": {
    "n": "真鐵手甲",
    "type": "wpn"
  },
  "l1j_item_195": {
    "n": "受詛咒的真．冥皇執行劍",
    "type": "wpn"
  },
  "l1j_item_196": {
    "n": "炎魔雙手劍 Lv.1",
    "type": "wpn"
  },
  "l1j_item_197": {
    "n": "炎魔雙手劍 Lv.2",
    "type": "wpn"
  },
  "l1j_item_198": {
    "n": "炎魔雙手劍 Lv.3",
    "type": "wpn"
  },
  "l1j_item_199": {
    "n": "炎魔雙手劍 Lv.4",
    "type": "wpn"
  },
  "l1j_item_200": {
    "n": "炎魔雙手劍 Lv.5",
    "type": "wpn"
  },
  "l1j_item_201": {
    "n": "炎魔雙手劍 Lv.6",
    "type": "wpn"
  },
  "l1j_item_202": {
    "n": "炎魔雙手劍 Lv.7",
    "type": "wpn"
  },
  "l1j_item_203": {
    "n": "炎魔雙手劍 Lv.8",
    "type": "wpn"
  },
  "l1j_item_204": {
    "n": "深紅之弩",
    "type": "wpn"
  },
  "l1j_item_205": {
    "n": "熾炎天使弓",
    "type": "wpn"
  },
  "l1j_item_206": {
    "n": "黑暗妖精之劍",
    "type": "wpn"
  },
  "l1j_item_207": {
    "n": "煉獄鋼爪",
    "type": "wpn"
  },
  "l1j_item_208": {
    "n": "魔法精靈短劍",
    "type": "wpn"
  },
  "l1j_item_209": {
    "n": "體質精靈短劍",
    "type": "wpn"
  },
  "l1j_item_210": {
    "n": "守護者之矛",
    "type": "wpn"
  },
  "l1j_item_211": {
    "n": "獨角獸之角",
    "type": "wpn"
  },
  "l1j_item_212": {
    "n": "海神三叉戟",
    "type": "wpn"
  },
  "l1j_item_213": {
    "n": "吉爾塔斯魔杖",
    "type": "wpn"
  },
  "l1j_item_214": {
    "n": "ID．妖精弓",
    "type": "wpn"
  },
  "l1j_item_215": {
    "n": "敏捷精靈弓",
    "type": "wpn"
  },
  "l1j_item_216": {
    "n": "妖精之弓",
    "type": "wpn"
  },
  "l1j_item_217": {
    "n": "吉爾塔斯之劍",
    "type": "wpn"
  },
  "l1j_item_218": {
    "n": "安加斯的釘錘",
    "type": "wpn"
  },
  "l1j_item_219": {
    "n": "馬普勒之斧",
    "type": "wpn"
  },
  "l1j_item_220": {
    "n": "法師之杖",
    "type": "wpn"
  },
  "l1j_item_223": {
    "n": "神秘魔杖",
    "type": "wpn"
  },
  "l1j_item_224": {
    "n": "象牙塔魔杖",
    "type": "wpn"
  },
  "l1j_item_225": {
    "n": "王族之劍",
    "type": "wpn"
  },
  "l1j_item_226": {
    "n": "騎士之劍",
    "type": "wpn"
  },
  "l1j_item_228": {
    "n": "傳說的匕首",
    "type": "wpn"
  },
  "l1j_item_231": {
    "n": "蒼天匕首",
    "type": "wpn"
  },
  "l1j_item_232": {
    "n": "蒼天之劍",
    "type": "wpn"
  },
  "l1j_item_233": {
    "n": "蒼天巨劍",
    "type": "wpn"
  },
  "l1j_item_234": {
    "n": "蒼天長矛",
    "type": "wpn"
  },
  "l1j_item_235": {
    "n": "蒼天巨斧",
    "type": "wpn"
  },
  "l1j_item_236": {
    "n": "蒼天雙刀",
    "type": "wpn"
  },
  "l1j_item_237": {
    "n": "蒼天鋼爪",
    "type": "wpn"
  },
  "l1j_item_238": {
    "n": "蒼天魔杖",
    "type": "wpn"
  },
  "l1j_item_239": {
    "n": "蒼天之弓",
    "type": "wpn"
  },
  "l1j_item_240": {
    "n": "蒼天鐵手甲",
    "type": "wpn"
  },
  "l1j_item_241": {
    "n": "歷戰之劍",
    "type": "wpn"
  },
  "l1j_item_242": {
    "n": "歷戰十字弓",
    "type": "wpn"
  },
  "l1j_item_243": {
    "n": "歷戰魔杖",
    "type": "wpn"
  },
  "l1j_item_244": {
    "n": "歷戰鋼爪",
    "type": "wpn"
  },
  "l1j_item_245": {
    "n": "精靈叮叮鎚",
    "type": "wpn"
  },
  "l1j_item_246": {
    "n": "試煉之劍A",
    "type": "wpn"
  },
  "l1j_item_247": {
    "n": "試煉之劍B",
    "type": "wpn"
  },
  "l1j_item_248": {
    "n": "試煉之劍C",
    "type": "wpn"
  },
  "l1j_item_249": {
    "n": "試煉之劍D",
    "type": "wpn"
  },
  "l1j_item_250": {
    "n": "イリュージョン ダガー",
    "type": "wpn"
  },
  "l1j_item_251": {
    "n": "イリュージョン ツヴァイハンダー",
    "type": "wpn"
  },
  "l1j_item_252": {
    "n": "イリュージョン スピアー",
    "type": "wpn"
  },
  "l1j_item_253": {
    "n": "イリュージョン アックス",
    "type": "wpn"
  },
  "l1j_item_254": {
    "n": "イリュージョン デュアルブレード",
    "type": "wpn"
  },
  "l1j_item_255": {
    "n": "イリュージョン スタッフ",
    "type": "wpn"
  },
  "l1j_item_256": {
    "n": "萬聖節南瓜長劍(韓)",
    "type": "wpn"
  },
  "l1j_item_257": {
    "n": "萬聖節南瓜長劍(日)",
    "type": "wpn"
  },
  "l1j_item_258": {
    "n": "終極萬聖節南瓜長劍",
    "type": "wpn"
  },
  "l1j_item_259": {
    "n": "魔力短劍",
    "type": "wpn"
  },
  "l1j_item_260": {
    "n": "狂風之斧",
    "type": "wpn"
  },
  "l1j_item_261": {
    "n": "大法師魔杖",
    "type": "wpn"
  },
  "l1j_item_262": {
    "n": "毀滅巨劍",
    "type": "wpn"
  },
  "l1j_item_263": {
    "n": "酷寒之矛",
    "type": "wpn"
  },
  "l1j_item_264": {
    "n": "雷雨之劍",
    "type": "wpn"
  },
  "l1j_item_265": {
    "n": "底比斯歐西里斯雙刀",
    "type": "wpn"
  },
  "l1j_item_266": {
    "n": "底比斯歐西里斯雙手劍",
    "type": "wpn"
  },
  "l1j_item_267": {
    "n": "底比斯歐西里斯弓",
    "type": "wpn"
  },
  "l1j_item_268": {
    "n": "底比斯歐西里斯魔杖",
    "type": "wpn"
  },
  "l1j_item_269": {
    "n": "幻術士魔杖",
    "type": "wpn"
  },
  "l1j_item_270": {
    "n": "藍寶石奇古獸",
    "type": "wpn"
  },
  "l1j_item_271": {
    "n": "黑曜石奇古獸",
    "type": "wpn"
  },
  "l1j_item_272": {
    "n": "消滅者鎖鏈劍",
    "type": "wpn"
  },
  "l1j_item_273": {
    "n": "破滅者鎖鏈劍",
    "type": "wpn"
  },
  "l1j_item_274": {
    "n": "反王肯恩的權杖",
    "type": "wpn"
  },
  "l1j_item_275": {
    "n": "龍騎士雙手劍",
    "type": "wpn"
  },
  "l1j_item_500": {
    "n": "艾爾摩短劍",
    "type": "wpn"
  },
  "l1j_item_501": {
    "n": "艾爾摩單手劍",
    "type": "wpn"
  },
  "l1j_item_502": {
    "n": "艾爾摩雙手劍",
    "type": "wpn"
  },
  "l1j_item_503": {
    "n": "艾爾摩弩槍",
    "type": "wpn"
  },
  "l1j_item_504": {
    "n": "艾爾摩鋼爪",
    "type": "wpn"
  },
  "l1j_item_505": {
    "n": "艾爾摩魔杖",
    "type": "wpn"
  },
  "l1j_item_506": {
    "n": "天雷劍",
    "type": "wpn"
  },
  "l1j_item_507": {
    "n": "玄冰弓",
    "type": "wpn"
  },
  "l1j_item_508": {
    "n": "艾爾摩鎖鏈劍",
    "type": "wpn"
  },
  "l1j_item_509": {
    "n": "艾爾摩奇古獸",
    "type": "wpn"
  },
  "l1j_item_510": {
    "n": "庫庫爾坎鐵手甲",
    "type": "wpn"
  },
  "l1j_item_511": {
    "n": "庫庫爾坎之矛",
    "type": "wpn"
  },
  "l1j_item_512": {
    "n": "祭司魔杖",
    "type": "wpn"
  },
  "l1j_item_513": {
    "n": "戰士巨劍",
    "type": "wpn"
  },
  "l1j_item_514": {
    "n": "戰士之劍",
    "type": "wpn"
  },
  "l1j_item_515": {
    "n": "戰士之弓",
    "type": "wpn"
  },
  "l1j_item_516": {
    "n": "戰士雙刀",
    "type": "wpn"
  },
  "l1j_item_517": {
    "n": "戰士之矛",
    "type": "wpn"
  },
  "l1j_item_520": {
    "n": "黑帝斯鋼爪",
    "type": "wpn"
  },
  "l1j_item_521": {
    "n": "雅典娜之杖",
    "type": "wpn"
  },
  "l1j_item_522": {
    "n": "宙斯巨劍",
    "type": "wpn"
  },
  "l1j_item_523": {
    "n": "阿波羅之弓",
    "type": "wpn"
  },
  "l1j_item_100004": {
    "n": "匕首",
    "type": "wpn"
  },
  "l1j_item_100005": {
    "n": "精靈匕首",
    "type": "wpn"
  },
  "l1j_item_100008": {
    "n": "米索莉短劍",
    "type": "wpn"
  },
  "l1j_item_100009": {
    "n": "奧里哈魯根短劍",
    "type": "wpn"
  },
  "l1j_item_100025": {
    "n": "銀劍",
    "type": "wpn"
  },
  "l1j_item_100027": {
    "n": "彎刀",
    "type": "wpn"
  },
  "l1j_item_100028": {
    "n": "精靈短劍",
    "type": "wpn"
  },
  "l1j_item_100029": {
    "n": "銀長劍",
    "type": "wpn"
  },
  "l1j_item_100037": {
    "n": "大馬士革刀",
    "type": "wpn"
  },
  "l1j_item_100041": {
    "n": "武士刀",
    "type": "wpn"
  },
  "l1j_item_100042": {
    "n": "細劍",
    "type": "wpn"
  },
  "l1j_item_100049": {
    "n": "武官之刃",
    "type": "wpn"
  },
  "l1j_item_100052": {
    "n": "雙手劍",
    "type": "wpn"
  },
  "l1j_item_100057": {
    "n": "瑟魯基之劍",
    "type": "wpn"
  },
  "l1j_item_100062": {
    "n": "武官雙手劍",
    "type": "wpn"
  },
  "l1j_item_100064": {
    "n": "巨劍",
    "type": "wpn"
  },
  "l1j_item_100074": {
    "n": "銀光 雙刀",
    "type": "wpn"
  },
  "l1j_item_100084": {
    "n": "暗黑雙刀",
    "type": "wpn"
  },
  "l1j_item_100095": {
    "n": "槍",
    "type": "wpn"
  },
  "l1j_item_100098": {
    "n": "闊矛",
    "type": "wpn"
  },
  "l1j_item_100099": {
    "n": "精靈之矛",
    "type": "wpn"
  },
  "l1j_item_100102": {
    "n": "露西錘",
    "type": "wpn"
  },
  "l1j_item_100103": {
    "n": "戟",
    "type": "wpn"
  },
  "l1j_item_100107": {
    "n": "深紅長矛",
    "type": "wpn"
  },
  "l1j_item_100114": {
    "n": "威嚴權杖",
    "type": "wpn"
  },
  "l1j_item_100132": {
    "n": "神官魔杖",
    "type": "wpn"
  },
  "l1j_item_100143": {
    "n": "戰斧",
    "type": "wpn"
  },
  "l1j_item_100146": {
    "n": "流星錘",
    "type": "wpn"
  },
  "l1j_item_100151": {
    "n": "惡魔斧頭",
    "type": "wpn"
  },
  "l1j_item_100157": {
    "n": "銀光 鋼爪",
    "type": "wpn"
  },
  "l1j_item_100164": {
    "n": "暗黑鋼爪",
    "type": "wpn"
  },
  "l1j_item_100169": {
    "n": "獵人之弓",
    "type": "wpn"
  },
  "l1j_item_100170": {
    "n": "精靈弓",
    "type": "wpn"
  },
  "l1j_item_100172": {
    "n": "弓",
    "type": "wpn"
  },
  "l1j_item_100180": {
    "n": "十字弓",
    "type": "wpn"
  },
  "l1j_item_100181": {
    "n": "尤米弓",
    "type": "wpn"
  },
  "l1j_item_100189": {
    "n": "暗黑十字弓",
    "type": "wpn"
  },
  "l1j_item_100204": {
    "n": "深紅之弩",
    "type": "wpn"
  },
  "l1j_item_100207": {
    "n": "煉獄鋼爪",
    "type": "wpn"
  },
  "l1j_item_100212": {
    "n": "海神三叉戟",
    "type": "wpn"
  },
  "l1j_item_100213": {
    "n": "小侏儒短劍",
    "type": "wpn"
  },
  "l1j_item_100214": {
    "n": "侏儒鐵斧",
    "type": "wpn"
  },
  "l1j_item_200001": {
    "n": "歐西斯匕首",
    "type": "wpn"
  },
  "l1j_item_200002": {
    "n": "骰子匕首",
    "type": "wpn"
  },
  "l1j_item_200027": {
    "n": "彎刀",
    "type": "wpn"
  },
  "l1j_item_200032": {
    "n": "侵略者之劍",
    "type": "wpn"
  },
  "l1j_item_200041": {
    "n": "武士刀",
    "type": "wpn"
  },
  "l1j_item_200052": {
    "n": "雙手劍",
    "type": "wpn"
  },
  "l1j_item_200171": {
    "n": "歐西斯弓",
    "type": "wpn"
  },
  "l1j_item_20000": {
    "n": "象牙塔耳環",
    "type": "arm"
  },
  "l1j_item_20001": {
    "n": "皮帽子",
    "type": "arm"
  },
  "l1j_item_20002": {
    "n": "皮頭盔",
    "type": "arm"
  },
  "l1j_item_20003": {
    "n": "鋼鐵頭盔",
    "type": "arm"
  },
  "l1j_item_20004": {
    "n": "影子面具",
    "type": "arm"
  },
  "l1j_item_20005": {
    "n": "騎士頭巾",
    "type": "arm"
  },
  "l1j_item_20006": {
    "n": "騎士面甲",
    "type": "arm"
  },
  "l1j_item_20007": {
    "n": "侏儒鐵盔",
    "type": "arm"
  },
  "l1j_item_20008": {
    "n": "小型風之頭盔",
    "type": "arm"
  },
  "l1j_item_20009": {
    "n": "惡魔頭盔",
    "type": "arm"
  },
  "l1j_item_20010": {
    "n": "死亡騎士頭盔",
    "type": "arm"
  },
  "l1j_item_20011": {
    "n": "抗魔法頭盔",
    "type": "arm"
  },
  "l1j_item_20012": {
    "n": "法師之帽",
    "type": "arm"
  },
  "l1j_item_20013": {
    "n": "敏捷魔法頭盔",
    "type": "arm"
  },
  "l1j_item_20014": {
    "n": "治癒魔法頭盔",
    "type": "arm"
  },
  "l1j_item_20015": {
    "n": "力量魔法頭盔",
    "type": "arm"
  },
  "l1j_item_20016": {
    "n": "曼波帽子",
    "type": "arm"
  },
  "l1j_item_20017": {
    "n": "木乃伊王的王冠",
    "type": "arm"
  },
  "l1j_item_20018": {
    "n": "馬庫爾之帽",
    "type": "arm"
  },
  "l1j_item_20019": {
    "n": "王冠",
    "type": "arm"
  },
  "l1j_item_20020": {
    "n": "武官頭盔",
    "type": "arm"
  },
  "l1j_item_20021": {
    "n": "精靈敏捷頭盔",
    "type": "arm"
  },
  "l1j_item_20022": {
    "n": "巴蘭卡頭盔",
    "type": "arm"
  },
  "l1j_item_20023": {
    "n": "風之頭盔",
    "type": "arm"
  },
  "l1j_item_20024": {
    "n": "反王頭盔",
    "type": "arm"
  },
  "l1j_item_20025": {
    "n": "巴土瑟之帽",
    "type": "arm"
  },
  "l1j_item_20026": {
    "n": "夜之視野",
    "type": "arm"
  },
  "l1j_item_20027": {
    "n": "紅騎士頭巾",
    "type": "arm"
  },
  "l1j_item_20028": {
    "n": "象牙塔皮頭盔",
    "type": "arm"
  },
  "l1j_item_20029": {
    "n": "西瑪之帽",
    "type": "arm"
  },
  "l1j_item_20030": {
    "n": "神官頭飾",
    "type": "arm"
  },
  "l1j_item_20031": {
    "n": "火焰之影頭盔",
    "type": "arm"
  },
  "l1j_item_20032": {
    "n": "黑暗頭飾",
    "type": "arm"
  },
  "l1j_item_20033": {
    "n": "艾爾穆的祝福",
    "type": "arm"
  },
  "l1j_item_20034": {
    "n": "歐西斯頭盔",
    "type": "arm"
  },
  "l1j_item_20035": {
    "n": "精靈皮盔",
    "type": "arm"
  },
  "l1j_item_20036": {
    "n": "夜視頭盔",
    "type": "arm"
  },
  "l1j_item_20037": {
    "n": "真實的面具",
    "type": "arm"
  },
  "l1j_item_20038": {
    "n": "銀釘皮帽",
    "type": "arm"
  },
  "l1j_item_20039": {
    "n": "精靈體質頭盔",
    "type": "arm"
  },
  "l1j_item_20040": {
    "n": "卡士伯之帽",
    "type": "arm"
  },
  "l1j_item_20041": {
    "n": "克特頭盔",
    "type": "arm"
  },
  "l1j_item_20042": {
    "n": "賽尼斯頭箍",
    "type": "arm"
  },
  "l1j_item_20043": {
    "n": "鋼盔",
    "type": "arm"
  },
  "l1j_item_20044": {
    "n": "藍海賊頭巾",
    "type": "arm"
  },
  "l1j_item_20045": {
    "n": "骷髏頭盔",
    "type": "arm"
  },
  "l1j_item_20046": {
    "n": "南瓜帽",
    "type": "arm"
  },
  "l1j_item_20047": {
    "n": "南瓜頭套",
    "type": "arm"
  },
  "l1j_item_20048": {
    "n": "混沌頭盔",
    "type": "arm"
  },
  "l1j_item_20049": {
    "n": "巨蟻女皇的金翅膀",
    "type": "arm"
  },
  "l1j_item_20050": {
    "n": "巨蟻女皇的銀翅膀",
    "type": "arm"
  },
  "l1j_item_20051": {
    "n": "君主的威嚴",
    "type": "arm"
  },
  "l1j_item_20052": {
    "n": "侏儒斗篷",
    "type": "arm"
  },
  "l1j_item_20053": {
    "n": "狼皮斗篷",
    "type": "arm"
  },
  "l1j_item_20054": {
    "n": "地屬性 斗蓬",
    "type": "arm"
  },
  "l1j_item_20055": {
    "n": "瑪那斗篷",
    "type": "arm"
  },
  "l1j_item_20056": {
    "n": "抗魔法斗篷",
    "type": "arm"
  },
  "l1j_item_20057": {
    "n": "冥法軍王斗篷",
    "type": "arm"
  },
  "l1j_item_20058": {
    "n": "武官斗篷",
    "type": "arm"
  },
  "l1j_item_20059": {
    "n": "水屬性 斗蓬",
    "type": "arm"
  },
  "l1j_item_20060": {
    "n": "藍海賊斗篷",
    "type": "arm"
  },
  "l1j_item_20061": {
    "n": "風屬性 斗蓬",
    "type": "arm"
  },
  "l1j_item_20062": {
    "n": "炎魔的血光斗篷",
    "type": "arm"
  },
  "l1j_item_20063": {
    "n": "保護者斗篷",
    "type": "arm"
  },
  "l1j_item_20064": {
    "n": "紅騎士之斗篷",
    "type": "arm"
  },
  "l1j_item_20065": {
    "n": "紅色斗篷",
    "type": "arm"
  },
  "l1j_item_20066": {
    "n": "黑虎皮斗篷",
    "type": "arm"
  },
  "l1j_item_20067": {
    "n": "神官斗篷",
    "type": "arm"
  },
  "l1j_item_20068": {
    "n": "亞丁騎士團披肩",
    "type": "arm"
  },
  "l1j_item_20069": {
    "n": "火焰之影斗篷",
    "type": "arm"
  },
  "l1j_item_20070": {
    "n": "黑暗斗蓬",
    "type": "arm"
  },
  "l1j_item_20071": {
    "n": "火屬性 斗蓬",
    "type": "arm"
  },
  "l1j_item_20072": {
    "n": "歐西斯斗篷",
    "type": "arm"
  },
  "l1j_item_20073": {
    "n": "精靈斗篷",
    "type": "arm"
  },
  "l1j_item_20074": {
    "n": "銀光斗蓬",
    "type": "arm"
  },
  "l1j_item_20075": {
    "n": "死亡斗篷",
    "type": "arm"
  },
  "l1j_item_20076": {
    "n": "墮落斗篷",
    "type": "arm"
  },
  "l1j_item_20077": {
    "n": "隱身斗篷",
    "type": "arm"
  },
  "l1j_item_20078": {
    "n": "混沌斗篷",
    "type": "arm"
  },
  "l1j_item_20079": {
    "n": "吸血鬼斗篷",
    "type": "arm"
  },
  "l1j_item_20080": {
    "n": "位移斗篷",
    "type": "arm"
  },
  "l1j_item_20081": {
    "n": "油布斗篷",
    "type": "arm"
  },
  "l1j_item_20082": {
    "n": "象牙塔T恤",
    "type": "arm"
  },
  "l1j_item_20083": {
    "n": "火焰之影襯衫",
    "type": "arm"
  },
  "l1j_item_20084": {
    "n": "精靈T恤",
    "type": "arm"
  },
  "l1j_item_20085": {
    "n": "T恤",
    "type": "arm"
  },
  "l1j_item_20086": {
    "n": "上衣 隆吉特",
    "type": "arm"
  },
  "l1j_item_20087": {
    "n": "上衣 隆貝特",
    "type": "arm"
  },
  "l1j_item_20088": {
    "n": "上衣 隆奇特",
    "type": "arm"
  },
  "l1j_item_20089": {
    "n": "小藤甲",
    "type": "arm"
  },
  "l1j_item_20090": {
    "n": "皮背心",
    "type": "arm"
  },
  "l1j_item_20091": {
    "n": "鋼鐵金屬盔甲",
    "type": "arm"
  },
  "l1j_item_20092": {
    "n": "古老的皮盔甲",
    "type": "arm"
  },
  "l1j_item_20093": {
    "n": "古老的長袍",
    "type": "arm"
  },
  "l1j_item_20094": {
    "n": "古老的鱗甲",
    "type": "arm"
  },
  "l1j_item_20095": {
    "n": "古老的金屬盔甲",
    "type": "arm"
  },
  "l1j_item_20096": {
    "n": "環甲",
    "type": "arm"
  },
  "l1j_item_20097": {
    "n": "木甲",
    "type": "arm"
  },
  "l1j_item_20098": {
    "n": "黑暗棲林者盔甲",
    "type": "arm"
  },
  "l1j_item_20099": {
    "n": "惡魔盔甲",
    "type": "arm"
  },
  "l1j_item_20100": {
    "n": "死亡騎士盔甲",
    "type": "arm"
  },
  "l1j_item_20101": {
    "n": "皮甲",
    "type": "arm"
  },
  "l1j_item_20102": {
    "n": "拉斯塔巴德皮盔甲",
    "type": "arm"
  },
  "l1j_item_20103": {
    "n": "拉斯塔巴德長袍",
    "type": "arm"
  },
  "l1j_item_20104": {
    "n": "拉斯塔巴德銀釘皮盔甲",
    "type": "arm"
  },
  "l1j_item_20105": {
    "n": "拉斯塔巴德鏈甲",
    "type": "arm"
  },
  "l1j_item_20106": {
    "n": "蕾雅長袍",
    "type": "arm"
  },
  "l1j_item_20107": {
    "n": "巫妖斗篷",
    "type": "arm"
  },
  "l1j_item_20108": {
    "n": "古代風龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20109": {
    "n": "法令軍王長袍",
    "type": "arm"
  },
  "l1j_item_20110": {
    "n": "抗魔法鏈甲",
    "type": "arm"
  },
  "l1j_item_20111": {
    "n": "法師長袍",
    "type": "arm"
  },
  "l1j_item_20112": {
    "n": "曼波外套",
    "type": "arm"
  },
  "l1j_item_20113": {
    "n": "武官護鎧",
    "type": "arm"
  },
  "l1j_item_20114": {
    "n": "綿質長袍",
    "type": "arm"
  },
  "l1j_item_20115": {
    "n": "藤甲",
    "type": "arm"
  },
  "l1j_item_20116": {
    "n": "巴蘭卡盔甲",
    "type": "arm"
  },
  "l1j_item_20117": {
    "n": "巴風特盔甲",
    "type": "arm"
  },
  "l1j_item_20118": {
    "n": "反王盔甲",
    "type": "arm"
  },
  "l1j_item_20119": {
    "n": "古代火龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20120": {
    "n": "皮盔甲",
    "type": "arm"
  },
  "l1j_item_20121": {
    "n": "黑法師長袍",
    "type": "arm"
  },
  "l1j_item_20122": {
    "n": "鱗甲",
    "type": "arm"
  },
  "l1j_item_20123": {
    "n": "喚獸師長袍",
    "type": "arm"
  },
  "l1j_item_20124": {
    "n": "骷髏盔甲",
    "type": "arm"
  },
  "l1j_item_20125": {
    "n": "鏈甲",
    "type": "arm"
  },
  "l1j_item_20126": {
    "n": "象牙塔皮盔甲",
    "type": "arm"
  },
  "l1j_item_20127": {
    "n": "水龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20128": {
    "n": "水晶盔甲",
    "type": "arm"
  },
  "l1j_item_20129": {
    "n": "神官法袍",
    "type": "arm"
  },
  "l1j_item_20130": {
    "n": "古代地龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20131": {
    "n": "火焰之影盔甲",
    "type": "arm"
  },
  "l1j_item_20132": {
    "n": "黑暗披肩",
    "type": "arm"
  },
  "l1j_item_20133": {
    "n": "黑暗執行者金屬盔甲",
    "type": "arm"
  },
  "l1j_item_20134": {
    "n": "冰之女王魅力禮服",
    "type": "arm"
  },
  "l1j_item_20135": {
    "n": "歐西斯環甲",
    "type": "arm"
  },
  "l1j_item_20136": {
    "n": "歐西斯鏈甲",
    "type": "arm"
  },
  "l1j_item_20137": {
    "n": "精靈鏈甲",
    "type": "arm"
  },
  "l1j_item_20138": {
    "n": "精靈金屬盔甲",
    "type": "arm"
  },
  "l1j_item_20139": {
    "n": "精靈護胸金屬板",
    "type": "arm"
  },
  "l1j_item_20144": {
    "n": "死亡盔甲",
    "type": "arm"
  },
  "l1j_item_20145": {
    "n": "硬皮背心",
    "type": "arm"
  },
  "l1j_item_20146": {
    "n": "地龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20147": {
    "n": "銀釘皮甲",
    "type": "arm"
  },
  "l1j_item_20148": {
    "n": "銀釘皮背心",
    "type": "arm"
  },
  "l1j_item_20149": {
    "n": "青銅盔甲",
    "type": "arm"
  },
  "l1j_item_20150": {
    "n": "克特盔甲",
    "type": "arm"
  },
  "l1j_item_20151": {
    "n": "賽尼斯斗篷",
    "type": "arm"
  },
  "l1j_item_20152": {
    "n": "墮落長袍",
    "type": "arm"
  },
  "l1j_item_20153": {
    "n": "古代水龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20154": {
    "n": "金屬盔甲",
    "type": "arm"
  },
  "l1j_item_20155": {
    "n": "藍海賊皮盔甲",
    "type": "arm"
  },
  "l1j_item_20156": {
    "n": "風龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20157": {
    "n": "金屬蜈蚣皮盔甲",
    "type": "arm"
  },
  "l1j_item_20158": {
    "n": "混沌法袍",
    "type": "arm"
  },
  "l1j_item_20159": {
    "n": "火龍鱗盔甲",
    "type": "arm"
  },
  "l1j_item_20160": {
    "n": "黑長者長袍",
    "type": "arm"
  },
  "l1j_item_20161": {
    "n": "幻象盔甲",
    "type": "arm"
  },
  "l1j_item_20162": {
    "n": "皮手套",
    "type": "arm"
  },
  "l1j_item_20163": {
    "n": "鋼鐵手套",
    "type": "arm"
  },
  "l1j_item_20164": {
    "n": "影子手套",
    "type": "arm"
  },
  "l1j_item_20165": {
    "n": "惡魔手套",
    "type": "arm"
  },
  "l1j_item_20166": {
    "n": "死亡騎士手套",
    "type": "arm"
  },
  "l1j_item_20167": {
    "n": "蜥蜴王手套",
    "type": "arm"
  },
  "l1j_item_20168": {
    "n": "武官手套",
    "type": "arm"
  },
  "l1j_item_20169": {
    "n": "巴蘭卡手套",
    "type": "arm"
  },
  "l1j_item_20170": {
    "n": "反王手套",
    "type": "arm"
  },
  "l1j_item_20171": {
    "n": "保護者手套",
    "type": "arm"
  },
  "l1j_item_20172": {
    "n": "水靈手套",
    "type": "arm"
  },
  "l1j_item_20173": {
    "n": "象牙塔皮手套",
    "type": "arm"
  },
  "l1j_item_20174": {
    "n": "雪人手套",
    "type": "arm"
  },
  "l1j_item_20175": {
    "n": "水晶手套",
    "type": "arm"
  },
  "l1j_item_20176": {
    "n": "神官手套",
    "type": "arm"
  },
  "l1j_item_20177": {
    "n": "地靈手套",
    "type": "arm"
  },
  "l1j_item_20178": {
    "n": "暗殺軍王手套",
    "type": "arm"
  },
  "l1j_item_20179": {
    "n": "火焰之影手套",
    "type": "arm"
  },
  "l1j_item_20180": {
    "n": "黑暗手套",
    "type": "arm"
  },
  "l1j_item_20181": {
    "n": "火靈手套",
    "type": "arm"
  },
  "l1j_item_20182": {
    "n": "手套",
    "type": "arm"
  },
  "l1j_item_20183": {
    "n": "死亡手套",
    "type": "arm"
  },
  "l1j_item_20184": {
    "n": "克特手套",
    "type": "arm"
  },
  "l1j_item_20185": {
    "n": "賽尼斯手套",
    "type": "arm"
  },
  "l1j_item_20186": {
    "n": "墮落手套",
    "type": "arm"
  },
  "l1j_item_20187": {
    "n": "力量手套",
    "type": "arm"
  },
  "l1j_item_20188": {
    "n": "藍海賊手套",
    "type": "arm"
  },
  "l1j_item_20189": {
    "n": "風靈手套",
    "type": "arm"
  },
  "l1j_item_20190": {
    "n": "混沌手套",
    "type": "arm"
  },
  "l1j_item_20191": {
    "n": "腕甲",
    "type": "arm"
  },
  "l1j_item_20192": {
    "n": "皮長靴",
    "type": "arm"
  },
  "l1j_item_20193": {
    "n": "皮涼鞋",
    "type": "arm"
  },
  "l1j_item_20194": {
    "n": "鋼鐵長靴",
    "type": "arm"
  },
  "l1j_item_20195": {
    "n": "影子長靴",
    "type": "arm"
  },
  "l1j_item_20196": {
    "n": "黑暗棲林者長靴",
    "type": "arm"
  },
  "l1j_item_20197": {
    "n": "惡魔長靴",
    "type": "arm"
  },
  "l1j_item_20198": {
    "n": "死亡騎士長靴",
    "type": "arm"
  },
  "l1j_item_20199": {
    "n": "拉斯塔巴德長靴",
    "type": "arm"
  },
  "l1j_item_20200": {
    "n": "魔獸軍王長靴",
    "type": "arm"
  },
  "l1j_item_20201": {
    "n": "武官長靴",
    "type": "arm"
  },
  "l1j_item_20202": {
    "n": "巴蘭卡長靴",
    "type": "arm"
  },
  "l1j_item_20203": {
    "n": "反王長靴",
    "type": "arm"
  },
  "l1j_item_20204": {
    "n": "巴列斯長靴",
    "type": "arm"
  },
  "l1j_item_20205": {
    "n": "長靴",
    "type": "arm"
  },
  "l1j_item_20206": {
    "n": "象牙塔皮涼鞋",
    "type": "arm"
  },
  "l1j_item_20207": {
    "n": "深水長靴",
    "type": "arm"
  },
  "l1j_item_20208": {
    "n": "神官長靴",
    "type": "arm"
  },
  "l1j_item_20209": {
    "n": "火焰之影長靴",
    "type": "arm"
  },
  "l1j_item_20210": {
    "n": "黑暗長靴",
    "type": "arm"
  },
  "l1j_item_20211": {
    "n": "冰之女王魅力涼鞋",
    "type": "arm"
  },
  "l1j_item_20212": {
    "n": "銀釘皮涼鞋",
    "type": "arm"
  },
  "l1j_item_20213": {
    "n": "短統靴",
    "type": "arm"
  },
  "l1j_item_20214": {
    "n": "克特長靴",
    "type": "arm"
  },
  "l1j_item_20215": {
    "n": "賽尼斯長靴",
    "type": "arm"
  },
  "l1j_item_20216": {
    "n": "墮落長靴",
    "type": "arm"
  },
  "l1j_item_20217": {
    "n": "藍海賊長靴",
    "type": "arm"
  },
  "l1j_item_20218": {
    "n": "黑長者涼鞋",
    "type": "arm"
  },
  "l1j_item_20219": {
    "n": "皮盾牌",
    "type": "arm"
  },
  "l1j_item_20220": {
    "n": "鋼鐵盾牌",
    "type": "arm"
  },
  "l1j_item_20221": {
    "n": "骷髏盾牌",
    "type": "arm"
  },
  "l1j_item_20222": {
    "n": "木盾",
    "type": "arm"
  },
  "l1j_item_20223": {
    "n": "侏儒圓盾",
    "type": "arm"
  },
  "l1j_item_20224": {
    "n": "拉斯塔巴德圓盾",
    "type": "arm"
  },
  "l1j_item_20225": {
    "n": "瑪那水晶球",
    "type": "arm"
  },
  "l1j_item_20226": {
    "n": "魔法能量之書",
    "type": "arm"
  },
  "l1j_item_20227": {
    "n": "梅杜莎盾牌",
    "type": "arm"
  },
  "l1j_item_20228": {
    "n": "武官之盾",
    "type": "arm"
  },
  "l1j_item_20229": {
    "n": "反射之盾",
    "type": "arm"
  },
  "l1j_item_20230": {
    "n": "紅眼盾牌",
    "type": "arm"
  },
  "l1j_item_20231": {
    "n": "塔盾",
    "type": "arm"
  },
  "l1j_item_20232": {
    "n": "象牙塔皮盾牌",
    "type": "arm"
  },
  "l1j_item_20233": {
    "n": "神官魔法書",
    "type": "arm"
  },
  "l1j_item_20234": {
    "n": "信念之盾",
    "type": "arm"
  },
  "l1j_item_20235": {
    "n": "伊娃之盾",
    "type": "arm"
  },
  "l1j_item_20236": {
    "n": "精靈盾牌",
    "type": "arm"
  },
  "l1j_item_20237": {
    "n": "阿克海盾牌",
    "type": "arm"
  },
  "l1j_item_20238": {
    "n": "銀騎士之盾",
    "type": "arm"
  },
  "l1j_item_20239": {
    "n": "小盾牌",
    "type": "arm"
  },
  "l1j_item_20240": {
    "n": "死亡之盾",
    "type": "arm"
  },
  "l1j_item_20241": {
    "n": "銀釘皮盾",
    "type": "arm"
  },
  "l1j_item_20242": {
    "n": "大盾牌",
    "type": "arm"
  },
  "l1j_item_20243": {
    "n": "隱藏之谷項鍊",
    "type": "arm"
  },
  "l1j_item_20244": {
    "n": "小型魅力項鍊",
    "type": "arm"
  },
  "l1j_item_20245": {
    "n": "小型敏捷項鍊",
    "type": "arm"
  },
  "l1j_item_20246": {
    "n": "小型力量項鍊",
    "type": "arm"
  },
  "l1j_item_20247": {
    "n": "小型智力項鍊",
    "type": "arm"
  },
  "l1j_item_20248": {
    "n": "小型精神項鍊",
    "type": "arm"
  },
  "l1j_item_20249": {
    "n": "小型體質項鍊",
    "type": "arm"
  },
  "l1j_item_20250": {
    "n": "變形怪首領項鍊",
    "type": "arm"
  },
  "l1j_item_20251": {
    "n": "都佩傑諾的項鍊",
    "type": "arm"
  },
  "l1j_item_20252": {
    "n": "蕾雅項鍊",
    "type": "arm"
  },
  "l1j_item_20253": {
    "n": "法令軍王之鍊",
    "type": "arm"
  },
  "l1j_item_20254": {
    "n": "魅力項鍊",
    "type": "arm"
  },
  "l1j_item_20255": {
    "n": "冥法軍王之戒",
    "type": "arm"
  },
  "l1j_item_20256": {
    "n": "敏捷項鍊",
    "type": "arm"
  },
  "l1j_item_20257": {
    "n": "黑法師項鍊",
    "type": "arm"
  },
  "l1j_item_20258": {
    "n": "喚獸師項鍊",
    "type": "arm"
  },
  "l1j_item_20259": {
    "n": "歌唱之島項鍊",
    "type": "arm"
  },
  "l1j_item_20260": {
    "n": "艾莉絲項鍊",
    "type": "arm"
  },
  "l1j_item_20261": {
    "n": "火焰之影項鍊",
    "type": "arm"
  },
  "l1j_item_20262": {
    "n": "營養滿分金項鍊",
    "type": "arm"
  },
  "l1j_item_20263": {
    "n": "妖魔戰士護身符",
    "type": "arm"
  },
  "l1j_item_20264": {
    "n": "力量項鍊",
    "type": "arm"
  },
  "l1j_item_20265": {
    "n": "靈魂的印記",
    "type": "arm"
  },
  "l1j_item_20266": {
    "n": "智力項鍊",
    "type": "arm"
  },
  "l1j_item_20267": {
    "n": "精神項鍊",
    "type": "arm"
  },
  "l1j_item_20268": {
    "n": "體質項鍊",
    "type": "arm"
  },
  "l1j_item_20269": {
    "n": "骷髏項鍊",
    "type": "arm"
  },
  "l1j_item_20270": {
    "n": "情人項鍊",
    "type": "arm"
  },
  "l1j_item_20277": {
    "n": "變形怪首領之戒(右)",
    "type": "arm"
  },
  "l1j_item_20278": {
    "n": "變形怪首領之戒(左)",
    "type": "arm"
  },
  "l1j_item_20279": {
    "n": "蕾雅戒指",
    "type": "arm"
  },
  "l1j_item_20280": {
    "n": "滅魔戒指",
    "type": "arm"
  },
  "l1j_item_20281": {
    "n": "變形控制戒指",
    "type": "arm"
  },
  "l1j_item_20282": {
    "n": "象牙塔戒指",
    "type": "arm"
  },
  "l1j_item_20284": {
    "n": "召喚控制戒指",
    "type": "arm"
  },
  "l1j_item_20285": {
    "n": "水靈戒指",
    "type": "arm"
  },
  "l1j_item_20286": {
    "n": "守護團戒指",
    "type": "arm"
  },
  "l1j_item_20287": {
    "n": "守護者的戒指",
    "type": "arm"
  },
  "l1j_item_20288": {
    "n": "傳送控制戒指",
    "type": "arm"
  },
  "l1j_item_20289": {
    "n": "深淵戒指",
    "type": "arm"
  },
  "l1j_item_20290": {
    "n": "火焰之影戒指",
    "type": "arm"
  },
  "l1j_item_20291": {
    "n": "營養滿分金戒指",
    "type": "arm"
  },
  "l1j_item_20293": {
    "n": "受詛咒的鑽石戒指",
    "type": "arm"
  },
  "l1j_item_20294": {
    "n": "受詛咒的紅寶石戒指",
    "type": "arm"
  },
  "l1j_item_20295": {
    "n": "受詛咒的藍寶石戒指",
    "type": "arm"
  },
  "l1j_item_20296": {
    "n": "受詛咒的綠寶石戒指",
    "type": "arm"
  },
  "l1j_item_20297": {
    "n": "精神的印記",
    "type": "arm"
  },
  "l1j_item_20298": {
    "n": "潔尼斯戒指",
    "type": "arm"
  },
  "l1j_item_20299": {
    "n": "死亡的誓約",
    "type": "arm"
  },
  "l1j_item_20300": {
    "n": "地靈戒指",
    "type": "arm"
  },
  "l1j_item_20301": {
    "n": "身體的印記",
    "type": "arm"
  },
  "l1j_item_20302": {
    "n": "風靈戒指",
    "type": "arm"
  },
  "l1j_item_20303": {
    "n": "抗魔戒指",
    "type": "arm"
  },
  "l1j_item_20304": {
    "n": "火靈戒指",
    "type": "arm"
  },
  "l1j_item_20305": {
    "n": "情人戒指",
    "type": "arm"
  },
  "l1j_item_20306": {
    "n": "小型身體腰帶",
    "type": "arm"
  },
  "l1j_item_20307": {
    "n": "小型靈魂腰帶",
    "type": "arm"
  },
  "l1j_item_20308": {
    "n": "小型精神腰帶",
    "type": "arm"
  },
  "l1j_item_20309": {
    "n": "光明身體腰帶",
    "type": "arm"
  },
  "l1j_item_20310": {
    "n": "光明靈魂腰帶",
    "type": "arm"
  },
  "l1j_item_20311": {
    "n": "光明精神腰帶",
    "type": "arm"
  },
  "l1j_item_20312": {
    "n": "身體腰帶",
    "type": "arm"
  },
  "l1j_item_20313": {
    "n": "黑暗腰帶",
    "type": "arm"
  },
  "l1j_item_20314": {
    "n": "古代巨人戒指",
    "type": "arm"
  },
  "l1j_item_20315": {
    "n": "營養滿分金腰帶",
    "type": "arm"
  },
  "l1j_item_20316": {
    "n": "靈魂腰帶",
    "type": "arm"
  },
  "l1j_item_20317": {
    "n": "歐吉皮帶",
    "type": "arm"
  },
  "l1j_item_20318": {
    "n": "勇敢皮帶",
    "type": "arm"
  },
  "l1j_item_20319": {
    "n": "精神腰帶",
    "type": "arm"
  },
  "l1j_item_20320": {
    "n": "泰坦皮帶",
    "type": "arm"
  },
  "l1j_item_20321": {
    "n": "多羅皮帶",
    "type": "arm"
  },
  "l1j_item_20322": {
    "n": "皮夾克",
    "type": "arm"
  },
  "l1j_item_20342": {
    "n": "死神披肩",
    "type": "arm"
  },
  "l1j_item_20343": {
    "n": "曼波兔帽",
    "type": "arm"
  },
  "l1j_item_20344": {
    "n": "曼波兔帽",
    "type": "arm"
  },
  "l1j_item_20345": {
    "n": "柯利的項鍊",
    "type": "arm"
  },
  "l1j_item_20346": {
    "n": "浣熊的項鍊",
    "type": "arm"
  },
  "l1j_item_20347": {
    "n": "韓服(男性)",
    "type": "arm"
  },
  "l1j_item_20348": {
    "n": "和服(女性)",
    "type": "arm"
  },
  "l1j_item_20349": {
    "n": "獵犬項鍊",
    "type": "arm"
  },
  "l1j_item_20350": {
    "n": "雪人的項鍊",
    "type": "arm"
  },
  "l1j_item_20351": {
    "n": "雪人的胡蘿蔔",
    "type": "arm"
  },
  "l1j_item_20352": {
    "n": "雪人的靴子",
    "type": "arm"
  },
  "l1j_item_20353": {
    "n": "傳說的盔甲",
    "type": "arm"
  },
  "l1j_item_20354": {
    "n": "傳說的長靴",
    "type": "arm"
  },
  "l1j_item_20355": {
    "n": "傳說的手套",
    "type": "arm"
  },
  "l1j_item_20356": {
    "n": "傳說的頭盔",
    "type": "arm"
  },
  "l1j_item_20357": {
    "n": "傳說的盾牌",
    "type": "arm"
  },
  "l1j_item_20358": {
    "n": "奴隸項鍊",
    "type": "arm"
  },
  "l1j_item_20359": {
    "n": "約定項鍊",
    "type": "arm"
  },
  "l1j_item_20360": {
    "n": "解放項鍊",
    "type": "arm"
  },
  "l1j_item_20361": {
    "n": "獵犬項鍊",
    "type": "arm"
  },
  "l1j_item_20362": {
    "n": "魔族項鍊",
    "type": "arm"
  },
  "l1j_item_20363": {
    "n": "勇士項鍊",
    "type": "arm"
  },
  "l1j_item_20364": {
    "n": "將軍項鍊",
    "type": "arm"
  },
  "l1j_item_20365": {
    "n": "大將軍項鍊",
    "type": "arm"
  },
  "l1j_item_20366": {
    "n": "王族鱗甲",
    "type": "arm"
  },
  "l1j_item_20367": {
    "n": "戰士金屬盔甲",
    "type": "arm"
  },
  "l1j_item_20368": {
    "n": "妖精小藤甲",
    "type": "arm"
  },
  "l1j_item_20369": {
    "n": "法師披肩",
    "type": "arm"
  },
  "l1j_item_20370": {
    "n": "歷戰斗蓬",
    "type": "arm"
  },
  "l1j_item_20371": {
    "n": "歷戰長靴",
    "type": "arm"
  },
  "l1j_item_20372": {
    "n": "歷戰手套",
    "type": "arm"
  },
  "l1j_item_20373": {
    "n": "歷戰鋼盔",
    "type": "arm"
  },
  "l1j_item_20374": {
    "n": "歷戰之盾",
    "type": "arm"
  },
  "l1j_item_20375": {
    "n": "歷戰上衣",
    "type": "arm"
  },
  "l1j_item_20376": {
    "n": "王族項鍊",
    "type": "arm"
  },
  "l1j_item_20377": {
    "n": "騎士項鍊",
    "type": "arm"
  },
  "l1j_item_20378": {
    "n": "妖精項鍊",
    "type": "arm"
  },
  "l1j_item_20379": {
    "n": "法師項鍊",
    "type": "arm"
  },
  "l1j_item_20380": {
    "n": "南瓜魔法帽",
    "type": "arm"
  },
  "l1j_item_20381": {
    "n": "華麗頭飾",
    "type": "arm"
  },
  "l1j_item_20382": {
    "n": "紅色面具",
    "type": "arm"
  },
  "l1j_item_20383": {
    "n": "軍馬頭盔",
    "type": "arm"
  },
  "l1j_item_20384": {
    "n": "王族頭盔",
    "type": "arm"
  },
  "l1j_item_20385": {
    "n": "騎士頭盔",
    "type": "arm"
  },
  "l1j_item_20386": {
    "n": "精靈皮頭盔",
    "type": "arm"
  },
  "l1j_item_20387": {
    "n": "法師頭盔",
    "type": "arm"
  },
  "l1j_item_20388": {
    "n": "黑暗妖精頭盔",
    "type": "arm"
  },
  "l1j_item_20389": {
    "n": "ID．妖精頭盔",
    "type": "arm"
  },
  "l1j_item_20390": {
    "n": "真．冥皇面甲",
    "type": "arm"
  },
  "l1j_item_20391": {
    "n": "王族盔甲",
    "type": "arm"
  },
  "l1j_item_20392": {
    "n": "精靈皮盔甲",
    "type": "arm"
  },
  "l1j_item_20393": {
    "n": "ID．妖精金甲",
    "type": "arm"
  },
  "l1j_item_20394": {
    "n": "騎士盔甲",
    "type": "arm"
  },
  "l1j_item_20395": {
    "n": "真．冥皇鎧甲",
    "type": "arm"
  },
  "l1j_item_20396": {
    "n": "守護者之盾",
    "type": "arm"
  },
  "l1j_item_20397": {
    "n": "王族盾牌",
    "type": "arm"
  },
  "l1j_item_20398": {
    "n": "騎士盾牌",
    "type": "arm"
  },
  "l1j_item_20399": {
    "n": "法師斗蓬",
    "type": "arm"
  },
  "l1j_item_20400": {
    "n": "黑暗妖精斗篷",
    "type": "arm"
  },
  "l1j_item_20401": {
    "n": "ID．妖精斗篷",
    "type": "arm"
  },
  "l1j_item_20402": {
    "n": "真．冥皇披風",
    "type": "arm"
  },
  "l1j_item_20403": {
    "n": "精靈皮長靴",
    "type": "arm"
  },
  "l1j_item_20404": {
    "n": "法師長靴",
    "type": "arm"
  },
  "l1j_item_20405": {
    "n": "黑暗妖精長靴",
    "type": "arm"
  },
  "l1j_item_20406": {
    "n": "ID．妖精鋼靴",
    "type": "arm"
  },
  "l1j_item_20407": {
    "n": "軍靴",
    "type": "arm"
  },
  "l1j_item_20408": {
    "n": "真．冥皇鋼靴",
    "type": "arm"
  },
  "l1j_item_20409": {
    "n": "ID．妖精腕甲",
    "type": "arm"
  },
  "l1j_item_20410": {
    "n": "真．冥皇護手",
    "type": "arm"
  },
  "l1j_item_20411": {
    "n": "苦痛項鍊",
    "type": "arm"
  },
  "l1j_item_20412": {
    "n": "厄運項鍊",
    "type": "arm"
  },
  "l1j_item_20413": {
    "n": "希望項鍊",
    "type": "arm"
  },
  "l1j_item_20414": {
    "n": "幸運項鍊",
    "type": "arm"
  },
  "l1j_item_20415": {
    "n": "熱情項鍊",
    "type": "arm"
  },
  "l1j_item_20416": {
    "n": "真實項鍊",
    "type": "arm"
  },
  "l1j_item_20417": {
    "n": "奇蹟項鍊",
    "type": "arm"
  },
  "l1j_item_20418": {
    "n": "慈愛項鍊",
    "type": "arm"
  },
  "l1j_item_20419": {
    "n": "高等熊項鍊",
    "type": "arm"
  },
  "l1j_item_20420": {
    "n": "招財貓領巾",
    "type": "arm"
  },
  "l1j_item_20421": {
    "n": "伊莉絲項鍊",
    "type": "arm"
  },
  "l1j_item_20422": {
    "n": "發光的古老項鍊",
    "type": "arm"
  },
  "l1j_item_20423": {
    "n": "詛咒的紅色耳環",
    "type": "arm"
  },
  "l1j_item_20424": {
    "n": "詛咒的藍色耳環",
    "type": "arm"
  },
  "l1j_item_20425": {
    "n": "詛咒的綠色耳環",
    "type": "arm"
  },
  "l1j_item_20426": {
    "n": "光之項鍊",
    "type": "arm"
  },
  "l1j_item_20427": {
    "n": "友友幸運符",
    "type": "arm"
  },
  "l1j_item_20428": {
    "n": "希望戒指",
    "type": "arm"
  },
  "l1j_item_20429": {
    "n": "熱情戒指",
    "type": "arm"
  },
  "l1j_item_20430": {
    "n": "幸運戒指",
    "type": "arm"
  },
  "l1j_item_20431": {
    "n": "真實戒指",
    "type": "arm"
  },
  "l1j_item_20432": {
    "n": "奇蹟戒指",
    "type": "arm"
  },
  "l1j_item_20433": {
    "n": "勇氣戒指",
    "type": "arm"
  },
  "l1j_item_20434": {
    "n": "伊莉絲戒指",
    "type": "arm"
  },
  "l1j_item_20435": {
    "n": "土靈戒指(男爵)",
    "type": "arm"
  },
  "l1j_item_20436": {
    "n": "水靈戒指(男爵)",
    "type": "arm"
  },
  "l1j_item_20437": {
    "n": "火靈戒指(男爵)",
    "type": "arm"
  },
  "l1j_item_20438": {
    "n": "風靈戒指(男爵)",
    "type": "arm"
  },
  "l1j_item_20439": {
    "n": "土靈戒指(伯爵)",
    "type": "arm"
  },
  "l1j_item_20440": {
    "n": "水靈戒指(伯爵)",
    "type": "arm"
  },
  "l1j_item_20441": {
    "n": "火靈戒指(伯爵)",
    "type": "arm"
  },
  "l1j_item_20442": {
    "n": "風靈戒指(伯爵)",
    "type": "arm"
  },
  "l1j_item_20443": {
    "n": "土靈戒指(公爵)",
    "type": "arm"
  },
  "l1j_item_20444": {
    "n": "水靈戒指(公爵)",
    "type": "arm"
  },
  "l1j_item_20445": {
    "n": "火靈戒指(公爵)",
    "type": "arm"
  },
  "l1j_item_20446": {
    "n": "風靈戒指(公爵)",
    "type": "arm"
  },
  "l1j_item_20447": {
    "n": "土靈戒指(君主)",
    "type": "arm"
  },
  "l1j_item_20448": {
    "n": "水靈戒指(君主)",
    "type": "arm"
  },
  "l1j_item_20449": {
    "n": "火靈戒指(君主)",
    "type": "arm"
  },
  "l1j_item_20450": {
    "n": "風靈戒指(君主)",
    "type": "arm"
  },
  "l1j_item_20451": {
    "n": "英雄戒指",
    "type": "arm"
  },
  "l1j_item_20452": {
    "n": "德雷克頭巾",
    "type": "arm"
  },
  "l1j_item_20453": {
    "n": "艾莉絲變身頭巾",
    "type": "arm"
  },
  "l1j_item_20454": {
    "n": "騎士范德變身頭巾",
    "type": "arm"
  },
  "l1j_item_20455": {
    "n": "思克巴女皇變身頭巾",
    "type": "arm"
  },
  "l1j_item_20456": {
    "n": "紅色足球衣",
    "type": "arm"
  },
  "l1j_item_20457": {
    "n": "藍色足球衣",
    "type": "arm"
  },
  "l1j_item_20458": {
    "n": "紅色妖魔面具",
    "type": "arm"
  },
  "l1j_item_20459": {
    "n": "紅色妖魔耳環",
    "type": "arm"
  },
  "l1j_item_20460": {
    "n": "榮譽項鍊",
    "type": "arm"
  },
  "l1j_item_21000": {
    "n": "思克巴服飾",
    "type": "arm"
  },
  "l1j_item_21001": {
    "n": "雪人服飾",
    "type": "arm"
  },
  "l1j_item_21002": {
    "n": "冰石高崙服飾",
    "type": "arm"
  },
  "l1j_item_21003": {
    "n": "勇士耳環",
    "type": "arm"
  },
  "l1j_item_21004": {
    "n": "戰士耳環",
    "type": "arm"
  },
  "l1j_item_21005": {
    "n": "英雄耳環",
    "type": "arm"
  },
  "l1j_item_21006": {
    "n": "靈魂耳環",
    "type": "arm"
  },
  "l1j_item_21007": {
    "n": "靈魂耳環",
    "type": "arm"
  },
  "l1j_item_21008": {
    "n": "憤怒耳環",
    "type": "arm"
  },
  "l1j_item_21009": {
    "n": "熱情耳環",
    "type": "arm"
  },
  "l1j_item_21010": {
    "n": "勇猛耳環",
    "type": "arm"
  },
  "l1j_item_21011": {
    "n": "不死耳環",
    "type": "arm"
  },
  "l1j_item_21012": {
    "n": "名譽耳環",
    "type": "arm"
  },
  "l1j_item_21013": {
    "n": "寬容耳環",
    "type": "arm"
  },
  "l1j_item_21014": {
    "n": "靈魂耳環",
    "type": "arm"
  },
  "l1j_item_21015": {
    "n": "智慧耳環",
    "type": "arm"
  },
  "l1j_item_21016": {
    "n": "真實耳環",
    "type": "arm"
  },
  "l1j_item_21017": {
    "n": "支配耳環",
    "type": "arm"
  },
  "l1j_item_21018": {
    "n": "哈羅耳環",
    "type": "arm"
  },
  "l1j_item_21019": {
    "n": "淨化之耳環",
    "type": "arm"
  },
  "l1j_item_21020": {
    "n": "舞動耳環",
    "type": "arm"
  },
  "l1j_item_21021": {
    "n": "雙子耳環",
    "type": "arm"
  },
  "l1j_item_21022": {
    "n": "慶典耳環",
    "type": "arm"
  },
  "l1j_item_21023": {
    "n": "絕頂耳環",
    "type": "arm"
  },
  "l1j_item_21024": {
    "n": "暴走耳環",
    "type": "arm"
  },
  "l1j_item_21025": {
    "n": "幻魔耳環",
    "type": "arm"
  },
  "l1j_item_21026": {
    "n": "族群耳環",
    "type": "arm"
  },
  "l1j_item_21027": {
    "n": "奴隸耳環",
    "type": "arm"
  },
  "l1j_item_21028": {
    "n": "ID的力量T恤",
    "type": "arm"
  },
  "l1j_item_21029": {
    "n": "ID的敏捷T恤",
    "type": "arm"
  },
  "l1j_item_21030": {
    "n": "ID的魅力T恤",
    "type": "arm"
  },
  "l1j_item_21031": {
    "n": "ID的魔力T恤",
    "type": "arm"
  },
  "l1j_item_21032": {
    "n": "ID的體力T恤",
    "type": "arm"
  },
  "l1j_item_21033": {
    "n": "ID的瑪那T恤",
    "type": "arm"
  },
  "l1j_item_21034": {
    "n": "曼波兔戒指",
    "type": "arm"
  },
  "l1j_item_21035": {
    "n": "幻象 ヘルム",
    "type": "arm"
  },
  "l1j_item_21036": {
    "n": "幻象 シャツ",
    "type": "arm"
  },
  "l1j_item_21037": {
    "n": "幻象 シールド",
    "type": "arm"
  },
  "l1j_item_21038": {
    "n": "幻象 ブーツ",
    "type": "arm"
  },
  "l1j_item_21039": {
    "n": "灼熱的頭盔",
    "type": "arm"
  },
  "l1j_item_21040": {
    "n": "灼熱的盾牌",
    "type": "arm"
  },
  "l1j_item_21041": {
    "n": "灼熱的長靴",
    "type": "arm"
  },
  "l1j_item_21042": {
    "n": "灼熱的手套",
    "type": "arm"
  },
  "l1j_item_21043": {
    "n": "鐵壁的護身符",
    "type": "arm"
  },
  "l1j_item_21044": {
    "n": "知識護身符",
    "type": "arm"
  },
  "l1j_item_21045": {
    "n": "暗躍の護身符",
    "type": "arm"
  },
  "l1j_item_21046": {
    "n": "翻弄の護身符",
    "type": "arm"
  },
  "l1j_item_21047": {
    "n": "幸運金幣",
    "type": "arm"
  },
  "l1j_item_21048": {
    "n": "修好的戒指",
    "type": "arm"
  },
  "l1j_item_21049": {
    "n": "修好的耳環",
    "type": "arm"
  },
  "l1j_item_21050": {
    "n": "修好的項鍊",
    "type": "arm"
  },
  "l1j_item_21051": {
    "n": "泡水的頭具",
    "type": "arm"
  },
  "l1j_item_21052": {
    "n": "泡水的斗篷",
    "type": "arm"
  },
  "l1j_item_21053": {
    "n": "泡水的盔甲",
    "type": "arm"
  },
  "l1j_item_21054": {
    "n": "泡水的手套",
    "type": "arm"
  },
  "l1j_item_21055": {
    "n": "泡水的靴子",
    "type": "arm"
  },
  "l1j_item_21056": {
    "n": "泡水的盾牌",
    "type": "arm"
  },
  "l1j_item_21057": {
    "n": "訓練騎士披肩",
    "type": "arm"
  },
  "l1j_item_21058": {
    "n": "訓練騎士披肩",
    "type": "arm"
  },
  "l1j_item_21059": {
    "n": "毒蛇之牙披肩",
    "type": "arm"
  },
  "l1j_item_21060": {
    "n": "萬聖節南瓜盔甲",
    "type": "arm"
  },
  "l1j_item_21061": {
    "n": "男幽靈變身服裝",
    "type": "arm"
  },
  "l1j_item_21062": {
    "n": "女幽靈變身服裝",
    "type": "arm"
  },
  "l1j_item_21063": {
    "n": "男性泳衣︰三角褲",
    "type": "arm"
  },
  "l1j_item_21064": {
    "n": "男性泳衣︰運動短褲",
    "type": "arm"
  },
  "l1j_item_21065": {
    "n": "女性泳衣︰連身裙",
    "type": "arm"
  },
  "l1j_item_21066": {
    "n": "女性泳衣︰比基尼",
    "type": "arm"
  },
  "l1j_item_21067": {
    "n": "萬聖節南瓜盔甲",
    "type": "arm"
  },
  "l1j_item_21068": {
    "n": "終極萬聖節南瓜盔甲",
    "type": "arm"
  },
  "l1j_item_21069": {
    "n": "新生皮帶(水)",
    "type": "arm"
  },
  "l1j_item_21070": {
    "n": "新生皮帶(水)",
    "type": "arm"
  },
  "l1j_item_21071": {
    "n": "新生皮帶(風)",
    "type": "arm"
  },
  "l1j_item_21072": {
    "n": "新生皮帶(火)",
    "type": "arm"
  },
  "l1j_item_21073": {
    "n": "新生皮帶(地)",
    "type": "arm"
  },
  "l1j_item_21074": {
    "n": "親睦耳環",
    "type": "arm"
  },
  "l1j_item_21075": {
    "n": "親睦耳環 (Type.1-1)",
    "type": "arm"
  },
  "l1j_item_21076": {
    "n": "親睦耳環 (Type.1-2)",
    "type": "arm"
  },
  "l1j_item_21077": {
    "n": "親睦耳環 (Type.1-3)",
    "type": "arm"
  },
  "l1j_item_21078": {
    "n": "親睦耳環 (Type.2-1)",
    "type": "arm"
  },
  "l1j_item_21079": {
    "n": "親睦耳環 (Type.2-2)",
    "type": "arm"
  },
  "l1j_item_21080": {
    "n": "親睦耳環 (Type.2-3)",
    "type": "arm"
  },
  "l1j_item_21081": {
    "n": "冰之女王的耳環 Lv.0",
    "type": "arm"
  },
  "l1j_item_21082": {
    "n": "冰之女王的耳環 Lv.1",
    "type": "arm"
  },
  "l1j_item_21083": {
    "n": "冰之女王的耳環 Lv.2",
    "type": "arm"
  },
  "l1j_item_21084": {
    "n": "冰之女王的耳環 Lv.3",
    "type": "arm"
  },
  "l1j_item_21085": {
    "n": "冰之女王的耳環 Lv.4",
    "type": "arm"
  },
  "l1j_item_21086": {
    "n": "冰之女王的耳環 Lv.5",
    "type": "arm"
  },
  "l1j_item_21087": {
    "n": "冰之女王的耳環 Lv.6",
    "type": "arm"
  },
  "l1j_item_21088": {
    "n": "冰之女王的耳環 Lv.7",
    "type": "arm"
  },
  "l1j_item_21089": {
    "n": "冰之女王的耳環 Lv.8",
    "type": "arm"
  },
  "l1j_item_21090": {
    "n": "冰之女王的耳環 Lv.8",
    "type": "arm"
  },
  "l1j_item_21091": {
    "n": "冰之女王的耳環 Lv.8",
    "type": "arm"
  },
  "l1j_item_21092": {
    "n": "新生のリング",
    "type": "arm"
  },
  "l1j_item_21093": {
    "n": "底比斯賀洛斯戒指",
    "type": "arm"
  },
  "l1j_item_21094": {
    "n": "底比斯阿努比斯戒指",
    "type": "arm"
  },
  "l1j_item_21095": {
    "n": "底比斯歐西里斯腰帶",
    "type": "arm"
  },
  "l1j_item_21096": {
    "n": "命運耳環",
    "type": "arm"
  },
  "l1j_item_21097": {
    "n": "射擊手耳環",
    "type": "arm"
  },
  "l1j_item_21098": {
    "n": "劍鬥士耳環",
    "type": "arm"
  },
  "l1j_item_21099": {
    "n": "大法師耳環",
    "type": "arm"
  },
  "l1j_item_21100": {
    "n": "幻術士斗篷",
    "type": "arm"
  },
  "l1j_item_21101": {
    "n": "幻術士法書",
    "type": "arm"
  },
  "l1j_item_21102": {
    "n": "龍騎士斗篷",
    "type": "arm"
  },
  "l1j_item_21103": {
    "n": "龍鱗臂甲",
    "type": "arm"
  },
  "l1j_item_21104": {
    "n": "水晶臂甲",
    "type": "arm"
  },
  "l1j_item_21105": {
    "n": "古代神射臂甲",
    "type": "arm"
  },
  "l1j_item_21106": {
    "n": "古代鬥士臂甲",
    "type": "arm"
  },
  "l1j_item_21107": {
    "n": "木製的夾克",
    "type": "arm"
  },
  "l1j_item_21108": {
    "n": "T恤強化師",
    "type": "arm"
  },
  "l1j_item_21301": {
    "n": "究極力量T恤",
    "type": "arm"
  },
  "l1j_item_21302": {
    "n": "究極敏捷T恤",
    "type": "arm"
  },
  "l1j_item_21303": {
    "n": "究極魅力T恤",
    "type": "arm"
  },
  "l1j_item_21304": {
    "n": "究極智力T恤",
    "type": "arm"
  },
  "l1j_item_21305": {
    "n": "究極體力T恤",
    "type": "arm"
  },
  "l1j_item_21306": {
    "n": "究極魔力T恤",
    "type": "arm"
  },
  "l1j_item_21307": {
    "n": "究極抗昏迷T恤",
    "type": "arm"
  },
  "l1j_item_21308": {
    "n": "究極抗支撐T恤",
    "type": "arm"
  },
  "l1j_item_21309": {
    "n": "究極抗魔法T恤",
    "type": "arm"
  },
  "l1j_item_21310": {
    "n": "特製究極力量T恤",
    "type": "arm"
  },
  "l1j_item_21311": {
    "n": "特製究極敏捷T恤",
    "type": "arm"
  },
  "l1j_item_21312": {
    "n": "特製究極魅力T恤",
    "type": "arm"
  },
  "l1j_item_21313": {
    "n": "特製究極智力T恤",
    "type": "arm"
  },
  "l1j_item_21314": {
    "n": "特製究極體力T恤",
    "type": "arm"
  },
  "l1j_item_21315": {
    "n": "特製究極魔力T恤",
    "type": "arm"
  },
  "l1j_item_21316": {
    "n": "特製究極抗昏迷T恤",
    "type": "arm"
  },
  "l1j_item_21317": {
    "n": "特製究極抗支撐T恤",
    "type": "arm"
  },
  "l1j_item_21318": {
    "n": "特製究極抗魔法T恤",
    "type": "arm"
  },
  "l1j_item_21500": {
    "n": "殷海薩的智力腰帶",
    "type": "arm"
  },
  "l1j_item_21501": {
    "n": "殷海薩的力量腰帶",
    "type": "arm"
  },
  "l1j_item_21502": {
    "n": "殷海薩的敏捷腰帶",
    "type": "arm"
  },
  "l1j_item_21503": {
    "n": "殷海薩的魅力腰帶",
    "type": "arm"
  },
  "l1j_item_21504": {
    "n": "10週年紀念耳環",
    "type": "arm"
  },
  "l1j_item_21505": {
    "n": "殷海薩耳環",
    "type": "arm"
  },
  "l1j_item_21506": {
    "n": "10週年紀念項鍊",
    "type": "arm"
  },
  "l1j_item_21507": {
    "n": "10週年紀念戒指",
    "type": "arm"
  },
  "l1j_item_21508": {
    "n": "聖光戒指",
    "type": "arm"
  },
  "l1j_item_21509": {
    "n": "8週年永恆戒",
    "type": "arm"
  },
  "l1j_item_21510": {
    "n": "ID．信任戒指",
    "type": "arm"
  },
  "l1j_item_21511": {
    "n": "ID．勇氣戒指",
    "type": "arm"
  },
  "l1j_item_21512": {
    "n": "ID．信賴戒指",
    "type": "arm"
  },
  "l1j_item_21513": {
    "n": "ID．友情戒指",
    "type": "arm"
  },
  "l1j_item_21514": {
    "n": "ID．永恆戒指",
    "type": "arm"
  },
  "l1j_item_21515": {
    "n": "ID．愛情戒指",
    "type": "arm"
  },
  "l1j_item_21516": {
    "n": "艾爾摩皮盔甲",
    "type": "arm"
  },
  "l1j_item_21517": {
    "n": "艾爾摩金屬盔甲",
    "type": "arm"
  },
  "l1j_item_21518": {
    "n": "艾爾摩法袍",
    "type": "arm"
  },
  "l1j_item_21519": {
    "n": "智力長靴(風)",
    "type": "arm"
  },
  "l1j_item_21520": {
    "n": "智力長靴(水)",
    "type": "arm"
  },
  "l1j_item_21521": {
    "n": "智力長靴(火)",
    "type": "arm"
  },
  "l1j_item_21522": {
    "n": "智力長靴(地)",
    "type": "arm"
  },
  "l1j_item_21523": {
    "n": "敏捷長靴(風)",
    "type": "arm"
  },
  "l1j_item_21524": {
    "n": "敏捷長靴(水)",
    "type": "arm"
  },
  "l1j_item_21525": {
    "n": "敏捷長靴(火)",
    "type": "arm"
  },
  "l1j_item_21526": {
    "n": "敏捷長靴(地)",
    "type": "arm"
  },
  "l1j_item_21527": {
    "n": "力量長靴(風)",
    "type": "arm"
  },
  "l1j_item_21528": {
    "n": "力量長靴(水)",
    "type": "arm"
  },
  "l1j_item_21529": {
    "n": "力量長靴(火)",
    "type": "arm"
  },
  "l1j_item_21530": {
    "n": "力量長靴(地)",
    "type": "arm"
  },
  "l1j_item_21531": {
    "n": "魅力長靴(風)",
    "type": "arm"
  },
  "l1j_item_21532": {
    "n": "魅力長靴(水)",
    "type": "arm"
  },
  "l1j_item_21533": {
    "n": "魅力長靴(火)",
    "type": "arm"
  },
  "l1j_item_21534": {
    "n": "魅力長靴(地)",
    "type": "arm"
  },
  "l1j_item_21535": {
    "n": "強化抗魔斗篷",
    "type": "arm"
  },
  "l1j_item_21536": {
    "n": "強化屬性斗篷(火)",
    "type": "arm"
  },
  "l1j_item_21537": {
    "n": "強化屬性斗篷(風)",
    "type": "arm"
  },
  "l1j_item_21538": {
    "n": "強化屬性斗篷(水)",
    "type": "arm"
  },
  "l1j_item_21539": {
    "n": "強化屬性斗篷(地)",
    "type": "arm"
  },
  "l1j_item_21540": {
    "n": "提卡爾庫庫爾坎面具",
    "type": "arm"
  },
  "l1j_item_21541": {
    "n": "提卡爾庫庫爾坎之盾",
    "type": "arm"
  },
  "l1j_item_21542": {
    "n": "提卡爾杰弗雷庫尖牙",
    "type": "arm"
  },
  "l1j_item_21543": {
    "n": "提卡爾杰弗雷庫之眼",
    "type": "arm"
  },
  "l1j_item_21544": {
    "n": "奧拉奇里亞的鋼盔",
    "type": "arm"
  },
  "l1j_item_21545": {
    "n": "堅固的奧拉奇里亞鋼盔",
    "type": "arm"
  },
  "l1j_item_21546": {
    "n": "九週年紀念耳環",
    "type": "arm"
  },
  "l1j_item_21547": {
    "n": "九週年紀念項鍊",
    "type": "arm"
  },
  "l1j_item_21548": {
    "n": "九週年紀念戒",
    "type": "arm"
  },
  "l1j_item_21549": {
    "n": "席琳的樹葉冠冕",
    "type": "arm"
  },
  "l1j_item_21550": {
    "n": "光輝席琳樹葉冠冕",
    "type": "arm"
  },
  "l1j_item_21551": {
    "n": "蚩尤鎧甲",
    "type": "arm"
  },
  "l1j_item_21552": {
    "n": "哈維變身頭巾",
    "type": "arm"
  },
  "l1j_item_21553": {
    "n": "黑法師變身頭巾",
    "type": "arm"
  },
  "l1j_item_21554": {
    "n": "聖誕老人帽",
    "type": "arm"
  },
  "l1j_item_21555": {
    "n": "強化HP T恤",
    "type": "arm"
  },
  "l1j_item_21556": {
    "n": "喵小編領巾",
    "type": "arm"
  },
  "l1j_item_120011": {
    "n": "抗魔法頭盔",
    "type": "arm"
  },
  "l1j_item_120016": {
    "n": "曼波帽子",
    "type": "arm"
  },
  "l1j_item_120043": {
    "n": "鋼盔",
    "type": "arm"
  },
  "l1j_item_120056": {
    "n": "抗魔法斗篷",
    "type": "arm"
  },
  "l1j_item_120074": {
    "n": "銀光斗蓬",
    "type": "arm"
  },
  "l1j_item_120077": {
    "n": "隱身斗篷",
    "type": "arm"
  },
  "l1j_item_120085": {
    "n": "T恤",
    "type": "arm"
  },
  "l1j_item_120101": {
    "n": "皮甲",
    "type": "arm"
  },
  "l1j_item_120112": {
    "n": "曼波外套",
    "type": "arm"
  },
  "l1j_item_120128": {
    "n": "水晶盔甲",
    "type": "arm"
  },
  "l1j_item_120137": {
    "n": "精靈鏈甲",
    "type": "arm"
  },
  "l1j_item_120149": {
    "n": "青銅盔甲",
    "type": "arm"
  },
  "l1j_item_120154": {
    "n": "金屬盔甲",
    "type": "arm"
  },
  "l1j_item_120182": {
    "n": "手套",
    "type": "arm"
  },
  "l1j_item_120242": {
    "n": "大盾牌",
    "type": "arm"
  },
  "l1j_item_120244": {
    "n": "小型魅力項鍊",
    "type": "arm"
  },
  "l1j_item_120245": {
    "n": "小型敏捷項鍊",
    "type": "arm"
  },
  "l1j_item_120246": {
    "n": "小型力量項鍊",
    "type": "arm"
  },
  "l1j_item_120247": {
    "n": "小型智力項鍊",
    "type": "arm"
  },
  "l1j_item_120248": {
    "n": "小型精神項鍊",
    "type": "arm"
  },
  "l1j_item_120249": {
    "n": "小型體質項鍊",
    "type": "arm"
  },
  "l1j_item_120254": {
    "n": "魅力項鍊",
    "type": "arm"
  },
  "l1j_item_120256": {
    "n": "敏捷項鍊",
    "type": "arm"
  },
  "l1j_item_120264": {
    "n": "力量項鍊",
    "type": "arm"
  },
  "l1j_item_120266": {
    "n": "智力項鍊",
    "type": "arm"
  },
  "l1j_item_120267": {
    "n": "精神項鍊",
    "type": "arm"
  },
  "l1j_item_120268": {
    "n": "體質項鍊",
    "type": "arm"
  },
  "l1j_item_120280": {
    "n": "滅魔戒指",
    "type": "arm"
  },
  "l1j_item_120285": {
    "n": "水靈戒指",
    "type": "arm"
  },
  "l1j_item_120289": {
    "n": "深淵戒指",
    "type": "arm"
  },
  "l1j_item_120300": {
    "n": "地靈戒指",
    "type": "arm"
  },
  "l1j_item_120302": {
    "n": "風靈戒指",
    "type": "arm"
  },
  "l1j_item_120304": {
    "n": "火靈戒指",
    "type": "arm"
  },
  "l1j_item_120306": {
    "n": "小型身體腰帶",
    "type": "arm"
  },
  "l1j_item_120307": {
    "n": "小型靈魂腰帶",
    "type": "arm"
  },
  "l1j_item_120308": {
    "n": "小型精神腰帶",
    "type": "arm"
  },
  "l1j_item_120309": {
    "n": "光明身體腰帶",
    "type": "arm"
  },
  "l1j_item_120310": {
    "n": "光明靈魂腰帶",
    "type": "arm"
  },
  "l1j_item_120311": {
    "n": "光明精神腰帶",
    "type": "arm"
  },
  "l1j_item_120312": {
    "n": "身體腰帶",
    "type": "arm"
  },
  "l1j_item_120316": {
    "n": "靈魂腰帶",
    "type": "arm"
  },
  "l1j_item_120317": {
    "n": "歐吉皮帶",
    "type": "arm"
  },
  "l1j_item_120319": {
    "n": "精神腰帶",
    "type": "arm"
  },
  "l1j_item_120320": {
    "n": "泰坦皮帶",
    "type": "arm"
  },
  "l1j_item_120321": {
    "n": "多羅皮帶",
    "type": "arm"
  },
  "l1j_item_120322": {
    "n": "侏儒圓盾",
    "type": "arm"
  },
  "l1j_item_120323": {
    "n": "侏儒鐵盔",
    "type": "arm"
  },
  "l1j_item_120324": {
    "n": "侏儒斗篷",
    "type": "arm"
  },
  "l1j_item_220034": {
    "n": "歐西斯頭盔",
    "type": "arm"
  },
  "l1j_item_220043": {
    "n": "鋼盔",
    "type": "arm"
  },
  "l1j_item_220056": {
    "n": "抗魔法斗篷",
    "type": "arm"
  },
  "l1j_item_220101": {
    "n": "皮甲",
    "type": "arm"
  },
  "l1j_item_220115": {
    "n": "藤甲",
    "type": "arm"
  },
  "l1j_item_220122": {
    "n": "鱗甲",
    "type": "arm"
  },
  "l1j_item_220125": {
    "n": "鏈甲",
    "type": "arm"
  },
  "l1j_item_220135": {
    "n": "歐西斯環甲",
    "type": "arm"
  },
  "l1j_item_220136": {
    "n": "歐西斯鏈甲",
    "type": "arm"
  },
  "l1j_item_220147": {
    "n": "銀釘皮甲",
    "type": "arm"
  },
  "l1j_item_220154": {
    "n": "金屬盔甲",
    "type": "arm"
  },
  "l1j_item_220213": {
    "n": "短統靴",
    "type": "arm"
  },
  "l1j_item_220237": {
    "n": "阿克海盾牌",
    "type": "arm"
  },
  "l1j_item_220293": {
    "n": "受詛咒的鑽石戒指",
    "type": "arm"
  },
  "l1j_item_220294": {
    "n": "受詛咒的紅寶石戒指",
    "type": "arm"
  },
  "l1j_item_220295": {
    "n": "受詛咒的藍寶石戒指",
    "type": "arm"
  },
  "l1j_item_220296": {
    "n": "受詛咒的綠寶石戒指",
    "type": "arm"
  }
};

// 快速查詢輔助：合併進主查詢表（若專案已載入 ITEM_DB，可在此補上）
if (typeof ITEM_DB !== 'undefined') {
  Object.assign(ITEM_DB, L1J_ITEM_DB);
}
