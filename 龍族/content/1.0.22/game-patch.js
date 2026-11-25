// 在桌寵自己的遊戲視窗載入遊戲主程式（app/boot-*.js）時，在檔案最後加一行，把遊戲自己的幾個函式接到 window.__rajaGame，
// 讓自動補給、自動合成用「遊戲按鈕本來用的同一套」做事（傳送、買東西、合成），不自己拼封包。
// 只影響桌寵的遊戲視窗，官方網頁照舊。
//
// 遊戲程式壓縮過，名字每版會換，所以每個都用「程式長相」找（下面 FINDERS），找不到的就不接，
// 用到它的功能會自動停用並提醒（見 game-hook.js 的 autoReady）。改版後找不到時，對照 README 的說明更新這裡的樣式。
"use strict";

const N = "[\\w$]+"; // 一個名字
const FINDERS = [
  // 遊戲的連線物件：request({op,…}) 會自己編號、等回應
  { keys: ["net"], re: new RegExp(`(${N})=new ${N}\\(\\{onState:`) },
  // 狀態倉庫的取值函式 $()（角色、背包…）、追蹤詞綴清單
  { keys: ["tracked", "state"], re: new RegExp(`tracked:(${N})\\((${N})\\(\\)\\.character\\?\\.id\\)`) },
  // 背包「合成」：狀態倉庫、背包格式轉換、從候選裝備抽 5 件、亂數
  { keys: ["store", "invView", "fusePick", "rng"], re: new RegExp(`let e=(${N})\\.getState\\(\\)\\.inventory,r=e\\?(${N})\\(e\\)\\.bag:\\[\\],s=new Set\\([\\s\\S]{0,120}?\\),c=(${N})\\(r,a,s,(${N})\\);`) },
  // 合成一次（主件、4 件材料）
  { keys: ["fuse"], re: new RegExp(`f=await (${N})\\(c\\.from,c\\.use\\)`) },
  // 預設不勾的裝備（追蹤詞綴、裝備組、壞掉、強化或升階過）、保留清單、某稀有度可合的裝備
  { keys: ["fuseExclude", "keepList", "fuseCandidates"], re: new RegExp(`function (${N})\\(e,t,n\\)\\{let r=new Set\\((${N})\\(\\)\\);return new Set\\((${N})\\(e,n\\)`) },
  // 快速補給：紅水／藍水要買哪一種、幾份、在哪間店；目前有幾瓶
  { keys: ["quickPotion", "potionKinds", "countHp", "countMp"], re: new RegExp(`function (${N})\\(e,t,n,r,i\\)\\{let a=r===(${N})\\[2\\]\\?${N}:${N},o=e=>[^,]*?,s=r===${N}\\[2\\]\\?(${N})\\(e\\):(${N})\\(e\\)`) },
  // 商店商品清單及每次可購上限，指定藥水時沿用遊戲的販售與單價資料。
  { keys: ["shopList", "shopItems"], re: new RegExp(`${N}=(${N})\\.flatMap\\(\\(e,t\\)=>(${N})\\(t\\)\\.filter\\(e=>${N}\\(e\\)&&!${N}\\(e\\)\\)\\.map\\(e=>\\[t,e\\]\\)\\)`) },
  { keys: ["buyLimit"], re: new RegExp(`Math\\.ceil\\(\\(n-s\\)/d\\.count\\),Math\\.floor\\(t/d\\.price\\),(${N})\\(u\\)`) },
  // 箭：要買哪一種（箭不會消耗，沒有才買）；目前有幾支
  { keys: ["quickArrow", "countArrow"], re: new RegExp(`function (${N})\\(e,t,n,r\\)\\{if\\(!n\\|\\|(${N})\\(e,r\\)>=1\\)return;`) },
  // 投擲武器：目前有幾個、要買哪一種
  { keys: ["countThrown"], re: new RegExp(`function (${N})\\(e\\)\\{let t=e\\.equip\\[${N}\\.weapon\\];return!t\\|\\|`) },
  { keys: ["quickThrown"], re: new RegExp(`function (${N})\\(e,t\\)\\{let n=e\\.equip\\[${N}\\.weapon\\];if\\(!n\\|\\|!${N}\\(${N}\\(n\\[0\\]\\)\\)\\)return;`) },
  // 商品的單價、一份幾個
  { keys: ["unitOf"], re: new RegExp(`function (${N})\\(e,t\\)\\{let n=${N}\\(e\\);if\\(!n\\|\\|n\\.price<=0\\)return;`) },
  // 遊戲自己的「進房間」（傳送用的就是它，會順便更新遊戲記住的目前地圖）
  // （遊戲 2026-11-21 改版多了第 4 個參數 r=`orig`、區域變數也換名字，所以參數和變數名都放寬）
  // （遊戲 2026-11-22 beta-v1.2.2318 起外面多包一層：同樣的進房間請求同時只送一次，真正做事的函式沒有預設參數了；先找外層，找不到再找舊樣式）
  // （遊戲 2026-11-24 改版外層開頭多一段 `let i=n?void 0:檢查(e,t);if(i)return i;`（送出前先擋不能去的情況），所以開頭到 JSON.stringify 之間放寬）
  // （遊戲 2026-11-24 傍晚 beta-v1.2.2753 起最外層又多一層 SN(e,t={},n=!1,r)：會先判斷要不要換分流／跟隨別人，
  //   有預設參數的變成它；去重那層 EN(e,t,n,r) 沒有預設參數了。桌寵接 EN（不換分流，跟遊戲不需分流時一樣送 EN(e,t,!1,`orig`)），
  //   所以接出時包一層補預設參數，見下面 wrap）
  { keys: ["joinRoom"], wrap: (v) => `(e,t={},n=!1,r=\`orig\`)=>${v}(e,t,n,r)`, res: [
    new RegExp(`function (${N})\\(e,t,n,r\\)\\{let ${N}=JSON\\.stringify\\(\\[e,t,n,r,`),
    new RegExp(`function (${N})\\(e,t=\\{\\},n=!1(?:,${N}=[^)]*)?\\)\\{(?:[^{}]{0,120}?;)?let ${N}=JSON\\.stringify\\(\\[e,t,n`),
    new RegExp(`async function (${N})\\(e,t=\\{\\},n=!1(?:,${N}=[^)]*)?\\)\\{let ${N}=\\+\\+${N},${N}=${N}\\(\\)\\.room`),
  ] },
  // ── 分流（遊戲 2026-11-24 beta-v1.2.2753 起有好幾個分流：/ws/N；隊伍、房間都在某個分流上） ──
  // 遊戲的「組隊」動作 party{act,…}：接受邀請／加入時隊伍在別的分流，會先切過去再做（直接送封包會回 PARTY_NONE）
  { keys: ["partyAct"], re: new RegExp(`async function (${N})\\(e\\)\\{let t=\\(\\)=>\\{let\\{self:t,count:n\\}=${N}\\.view;if\\(e\\.act===\`accept\`\\)`) },
  // 分流管理（view.self＝現在在第幾個分流、view.count＝共幾個）、公開房號在哪個分流
  { keys: ["lines"], re: new RegExp(`let\\{self:n,count:r\\}=(${N})\\.view,i=t\\.rooms\\.filter`) },
  { keys: ["roomLine"], re: new RegExp(`function (${N})\\(e,t\\)\\{if\\(!Number\\.isInteger\\(e\\)\\|\\|e<${N}\\.min\\|\\|e>${N}\\.max\\)return;if\\(t<=1\\)return 0;`) },
  // 自動戰鬥開關（遊戲 2026-11-24 beta-v1.2.2753 在 toggleAutoLock 前多呼叫一個函式，放寬成可有可無）
  { keys: ["toggleAuto"], re: new RegExp(`function (${N})\\(\\)\\{${N}=!1,${N}=0,(?:${N}\\(\\),)?${N}\\(\\)\\.toggleAutoLock\\(\\);`) },
  // 各國主城清單（mapId、name、nation、npcs）
  { keys: ["towns"], re: new RegExp(`(${N})\\.find\\(e=>e\\.nation===${N}\\(\\)\\.account\\?\\.nation\\)`) },
  // 點主城 NPC：走到 NPC 旁邊，到了才打開他的視窗（跟玩家點 NPC 一樣）；現在所在的主城區域（含 npcs、座標）
  { keys: ["talkNpc", "currentTown"], re: new RegExp(`function (${N})\\(e,t\\)\\{let n=(${N})\\(\\),r=n\\?\\.npcs\\[e\\];if\\(!n\\|\\|!r\\)return;`) },
  // NPC 視窗（open＝現在開著哪個 NPC；close()）、NPC 有哪些功能（[{kind:"shop",shop}…]）
  { keys: ["npcSheet", "npcFunctions"], re: new RegExp(`function ${N}\\(e,t\\)\\{${N}=void 0,${N}&&=\\(clearTimeout\\(${N}\\),void 0\\),${N}\\(\\)\\.closeSheet\\(\\),(${N})\\.getState\\(\\)\\.show\\(\\{npc:e,functions:(${N})\\(e\\)`) },
  // 小地圖下方「NPC」按鈕的清單：[{label, npcIndex, fn}]；按下去遊戲做的就是 talkNpc(npcIndex, fn)（自動導航）
  { keys: ["npcList"], re: new RegExp(`function (${N})\\(\\)\\{let e=${N}\\(\\);return e\\?\\[\\.\\.\\.${N}\\.flatMap\\(\\(e,t\\)=>${N}\\(t\\)\\.length\\?\\[\\{kind:\`shop\`,shop:t\\}\\]`) },
  // 自己現在站的格子 [x, y]；房間裡的人物（world.entities：id → [..., x, y]，交易要走到對方 5 格內）
  { keys: ["selfPos", "world"], re: new RegExp(`function (${N})\\(\\)\\{let e=(${N})\\.self;return e\\?\\[e\\[2\\],e\\[3\\]\\]:void 0\\}`) },
  // 道具資料（遊戲調整過的，名稱、類型）、道具標籤（稀有度、+強化、G 階級…，物品欄顯示用）
  { keys: ["item"], re: new RegExp(`(${N})=e=>${N}\\.get\\(e\\),${N}=e=>!!e&&\\(e\\.itemKind===16`) },
  { keys: ["itemTags"], re: new RegExp(`function (${N})\\(e,t=\\[\\]\\)\\{let n=${N}\\(e\\[0\\]\\);if\\(n&&!${N}\\(n\\)\\)\\{let e=${N}\\(n\\);return e\\?\\[e\\]:\\[\\]\\}`) },
  // ── 遊戲「設置」頁（桌寵的「掛機設置」視窗用遊戲自己的這些函式讀寫，跟在遊戲裡按一樣） ──
  // 音效（enabled、volume、setEnabled、setVolume）、背景音樂（musicEnabled、musicVolume、setMusicEnabled、setMusicVolume）
  { keys: ["sound", "music"], re: new RegExp(`let\\[e,t\\]=\\(0,${N}\\.useState\\)\\((${N})\\.enabled\\),\\[n,r\\]=\\(0,${N}\\.useState\\)\\((${N})\\.musicEnabled\\)`) },
  // 打擊震動：讀、寫
  { keys: ["shakeGet", "shakeSet"], re: new RegExp(`useState\\)\\((${N})\\);return\\(0,${N}\\.jsx\\)\\(${N},\\{label:\`打擊震動\`[\\s\\S]{0,200}?onChange:e=>\\{t\\(e\\),(${N})\\(e\\)\\}`) },
  // 畫面品質、特效（狀態倉庫：choice、setChoice）
  { keys: ["graphicsStore"], re: new RegExp(`"aria-label":\`畫面品質\`[\\s\\S]{0,300}?onClick:\\(\\)=>(${N})\\.getState\\(\\)\\.setChoice\\(t\\)`) },
  { keys: ["effectsStore"], re: new RegExp(`"aria-label":\`特效\`[\\s\\S]{0,300}?onClick:\\(\\)=>(${N})\\.getState\\(\\)\\.setChoice\\(n\\)`) },
  // 商店的道具分類（自動販售的下拉選單用）：大類 weapon/armor/potion/material/tool/other、武器小類（弓、法杖與令牌、單手劍術…）
  { keys: ["itemCat"], re: new RegExp(`function (${N})\\(e\\)\\{return e\\.type===6\\|\\|${N}\\(e\\)\\|\\|${N}\\(e\\)\\?\`weapon\``) },
  { keys: ["itemSub"], re: new RegExp(`function (${N})\\(e\\)\\{return ${N}\\(e\\)\\?\`箭矢\``) },
  // 商店「賣」能不能賣、價錢、貴重標籤（{sell, price, precious:[稀有、+強化、追蹤詞綴…]}；鎖定的不能賣）
  { keys: ["sellCheck"], re: new RegExp(`function (${N})\\(e,t=\\[\\]\\)\\{return ${N}\\(e\\)\\?\\{sell:!1,reason:\`已鎖定\`\\}`) },
  // 自動喝藥門檻：讀、優先藥水倉庫、寫門檻
  { keys: ["potionAtGet", "potionPriority", "potionAtSet"], re: new RegExp(`let\\[e,t\\]=\\(0,${N}\\.useState\\)\\((${N})\\),n=(${N})\\(\\),r=e=>\\{t\\(e\\),(${N})\\(e\\)\\};return[\\s\\S]{0,300}?自動喝藥`) },
  // 優先紅水／藍水：可選的藥水清單 {hp:[…], mp:[…]}、設定（種類, 物品編號）
  { keys: ["potionPrioritySet", "potionChoices"], re: new RegExp(`onChange:t=>(${N})\\(e,Number\\(t\\.target\\.value\\)\\)[\\s\\S]{0,200}?children:\`自動選擇\`\\}\\),(${N})\\[e\\]\\.map`) },
  // 掛機自動化（idle:upkeep）：讀、寫（寫的時候遊戲會存起來並送給伺服器）
  { keys: ["upkeepGet", "upkeepSet"], re: new RegExp(`let\\[e,t\\]=\\(0,${N}\\.useState\\)\\((${N})\\),n=n=>\\{let r=\\{\\.\\.\\.e,\\.\\.\\.n\\};t\\(r\\),(${N})\\(r\\)\\}`) },
  // 自動施放：遊戲功能開關（quickAutoOff）、技能名稱、技能圖示、能不能指定隊友
  { keys: ["feature"], re: new RegExp(`a=(${N})\\(\`quickAutoOff\`\\),o=\\(r\\?\\?\\[\\]\\)`) },
  { keys: ["skillName"], re: new RegExp(`(${N})=e=>${N}\\(e\\)\\?\\.name\\?\\?${N}\\(e\\)\\?\\.name\\?\\?\`\``) },
  { keys: ["skillIcon"], re: new RegExp(`(${N})=e=>\\{if\\(!e\\)return;let t=${N}\\(e\\);return t\\?${N}\\(t\\):${N}\\(e\\)\\?\`/assets/combat-skill/icon/`) },
  { keys: ["skillAlly"], re: new RegExp(`(${N})=e=>\\(${N}\\(e\\)\\|\\|${N}\\(e\\)\\)&&e!==178&&`) },
  // 傳送介面的練功地圖（含怪物等級），只列遊戲提供的可選地區。
  { keys: ["huntMaps"], re: new RegExp(`(${N})=${N}\\.filter\\(e=>${N}\\.some\\(t=>t\\.mapId===e\\.id\\)\\)`) },
  // 小地圖下方「怪物」選單的清單：地圖 → { monsters:[{no,name,levelMin,levelMax,boss}] …}（同名怪合併、首領排後面）
  { keys: ["mapMonsters"], re: new RegExp(`function (${N})\\(e\\)\\{let t=${N}\\.get\\(e\\.id\\);if\\(t\\)return t;let n=\\[\\.\\.\\.e\\.monsters\\.map\\(e=>\\(\\{m:e,boss:!1\\}\\)\\)`) },
  // 遊戲「省電掛機」（設置→掛機自動化，黑屏繼續掛機）的開關倉庫：getState().active／setActive(on)。打開時遊戲停掉畫面、特效、音效，連線和伺服器掛機照常
  { keys: ["powerSave"], re: new RegExp(`(${N})=${N}\\(e=>\\(\\{active:!1,setActive:t=>e\\(\\{active:t\\}\\)\\}\\)\\)`) },
  // 經驗條：(等級, 總經驗) → { current:這一級已拿到, needed:這一級總共要 }（遊戲角色頁的經驗 % 用同一個；遊戲視窗標題顯示用）
  { keys: ["expProgress"], re: new RegExp(`function (${N})\\(e,t\\)\\{let n=${N}\\(e\\);return\\{current:Math\\.max\\(0,t-n\\.expMin\\),needed:n\\.expMax-n\\.expMin\\+1\\}\\}`) },
];

/** 回傳 { code, found:{key:name}, missing:[key] }；code 是加了接出程式的主程式。 */
function patchBoot(code) {
  const found = {}, missing = [], wraps = {};
  for (const f of FINDERS) {
    let m = null;
    for (const re of f.res || [f.re]) if ((m = code.match(re))) break; // 有好幾種樣式的：依序試，第一個找到的算
    f.keys.forEach((k, i) => (m ? (found[k] = m[i + 1]) : missing.push(k)));
    if (m && f.wrap) wraps[f.keys[0]] = f.wrap;
  }
  // 每個各自 try：萬一某個名字不在最外層（拿不到），不會連累其他的
  const lines = Object.entries(found).map(([k, v]) => `try{g.${k}=${wraps[k] ? wraps[k](v) : v}}catch(e){}`).join("");
  const tail = `\n;(()=>{const g={};${lines}g.missing=${JSON.stringify(missing)};window.__rajaGame=g;})();\n`;
  return { code: code + tail, found, missing };
}

module.exports = { patchBoot, FINDERS };
