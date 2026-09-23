# data/ — 程式碼模組說明（V1.0.7 起）

原本 `index.html` 裡有一段約 1,270 行的行內 `<script>`，整個遊戲邏輯都塞在裡面。
V1.0.7 把它依功能拆成本資料夾的 **31 個 .js 檔**，`index.html` 只保留 HTML 結構與樣式，
底部依序用 `<script src="data/xxx.js">` 載入。

**拆分過程沒有更動任何一行程式碼**（只在每個檔案最前面加了 3 行檔頭註解與 `'use strict';`），
玩法、數值、存檔格式完全不變。

> **給 AI／維護者**：使用者提出需求時，請先對照下面的「常見需求 → 檔案」表找到對應檔案，
> **只修改那個檔案**，不要再把程式寫回 `index.html`。

---

## 一、載入順序（`index.html` 底部，順序不可任意調換）

```
official-data → classes-skills → equip-db → dungeon-boss-db → market-pet-quest
→ config → exp → state → utils → save → offline
→ player → stats → equipment → monster → combat → potion → drops → battle-flow
→ forge → inventory → shop
→ ui-core → ui-panels → inventory-ui → skills-ui → dungeons → ai-panel → system-ui
→ render-loop → boot
（之後才是原本就有的）warehouse.js → lobby.js
```

順序規則：

1. **前 5 個資料檔必須最先**，因為它們在「載入當下」就會執行運算：
   `SKILLS`（由 `SKILL_SEED` 產生）、`EQUIP_DB = buildEquipDB()`、`BOSS_DB`、`MARKET`、`POOL_ITEMS`
   都需要前面檔案的常數。
2. **`config.js` 要在 `state.js` 之前**：`freshState()` 會用到 `GAME_VERSION`。
3. **`state.js` 要在所有功能檔之前**：它有一行 `let G = freshState()`，`G` 是整個遊戲的狀態物件。
4. 中間的功能檔幾乎都只是 `function` 宣告（會被提升），彼此順序其實不影響，但請照表排以免混亂。
5. **`boot.js` 必須最後**：它會綁定按鈕、呼叫 `normalize()` → `renderAll()` → 啟動 `mainLoop`，
   並用 `Object.assign(window, {...})` 把函式掛到 `window`（HTML 的 `onclick=` 才找得到）。
6. `warehouse.js`、`lobby.js` 維持原本位置（最後），登入／選角／倉庫由它們接手。

---

## 二、各檔案職責

### A. 資料層（純資料，改數值來這裡）

| 檔案 | 內容 |
|---|---|
| `official-data.js` | `OFFICIAL` 官方原始表、`OFFICIAL_MONSTER_DATA` 3.0 怪物、`localMons`、`bossBase`、`maps` 地圖、`FIVE` 五行、`ELEM`／`QUALITY`／`SLOT_NAMES`／`SLOT_ORDER`、`OFFICIAL_LEVEL_GUIDE` 等級指引 |
| `classes-skills.js` | `CLASSES` 四門派（劍宗／戟門／詭流／幻道）、`CLASS_SKILLS`、`SKILL_SEED` 神通原始表 → `SKILLS`／`SKILL_LIST`、`OFFICIAL_SKILL_FORMULAS` |
| `equip-db.js` | `slotOf()`／`qByLevel()`／`buildEquipDB()` → `EQUIP_DB`、`EQUIP_NAMES`、`BASIC_EQUIP` |
| `dungeon-boss-db.js` | `DUNGEONS` 副本清單、`BOSS_DB`、`BALANCE`（Boss 掉落率）、`BOSS_DROP_TABLE` |
| `market-pet-quest.js` | `MARKET` 商店商品、`POOL_ITEMS` 掉落池、`PET_DB` 靈寵、`QUESTS` 任務 |
| `config.js` | **`GAME_VERSION` 版本號**、`SAVE_KEY_BASE`／`SAVE_KEY`／`SAVE_SLOT`、`LEGACY_KEYS` 舊版存檔、`MAX_LEVEL_30`、`TICK` 主迴圈間隔 |
| `exp.js` | 7MA 經驗系統：`EXP_TABLE`、`MONSTER_RANK_EXP_MULTIPLIER`、`getExpRequired()`、`getMonsterRank()`、`getLevelDifferenceMultiplier()`、`getMonsterHuntExp()` |

### B. 狀態與基礎設施

| 檔案 | 主要內容 |
|---|---|
| `state.js` | `COMBAT_STRATEGIES` 四種戰鬥策略、`DEFAULT_AUTO` 預設掛機設定、**`freshState()` 存檔結構**、全域變數 `G`／`battle`／`activePanel`／`mainLoop`／`huntLog`／`pendingBoss` |
| `utils.js` | `$()`、`fmt()`、`clamp()`、`toast()`、`log()`／`hlog()`、`deepMerge()` |
| `save.js` | `normalize()`（舊存檔補齊與相容轉換）、`save()`／`load()`／`saveGame()`／`loadGame()` |
| `offline.js` | `applyOffline()` 離線收益（最多 8 小時）、`offlineDrop()` |

### C. 遊戲邏輯

| 檔案 | 主要函式 |
|---|---|
| `player.js` | `classData()`、`expNeed()`、`levelUp()`、`chooseClass()`、`learnSkill()`、`petData()`／`buyPet()`／`equipPet()`、`spendTalent()`／`spendElementTalent()`、`questProgress()`／`claimQuest()` |
| `stats.js` | **所有數值公式的來源**：`currentMap()`、`mapUnlocked()`、`ensureStats()` 總屬性結算、`power()` 戰力、`fiveMultiplier()` 五行相克、`critMultiplier()`、`hitChance()`、`calcDamage()` |
| `equipment.js` | `QUALITY_MUL` 品質倍率、`scaleEquipStats()`／`bakeEquipQuality()`／`migrateEquipQuality()` 升品、`isQiyuan()`／`qiyuanBlock()`／`rollQiyuanEquip()` 奇緣模式、`gainEquipDrop()`、`makeEquip()`、`equipScore()`、`randomAffix()`、`equipItem()`／`unequipItem()`、`compareEquip()` |
| `monster.js` | `monsterData()`、`mapPool()`、`pickWeighted()`、`spawnEncounter()` |
| `combat.js` | 增益 2 槽（`BUFF_MS`、`applyBuff()`、`buffValue()`、`buffRemain()`、`buffText()`）、`startEncounter()`、戰鬥畫面開關、AI 選招（`pickSkillByStrategy()`、`chooseAutoSkill()`）、`playerAttack()`、`castSkill()`、`enemyAttack()`、**`combatTick()` 戰鬥節拍** |
| `potion.js` | `POTION_DEF`／`POTION_CD`、`healSkillList()`、**`autoSupport()` 自動喝水與自動施法**、`usePotion()` |
| `drops.js` | `grantDrops()` 掉落結算、`monsterExp()` |
| `battle-flow.js` | `onKill()` 擊殺結算、`playerDown()`、`flee()`、`returnHome()`、`toggleAuto()`／`startAuto()` 掛機、`moveMap()`／`autoAdvance()` 換圖、`startBoss()`／`bossReady()`／`bossRemain()` |
| `forge.js` | 煉器殿：`forgeEnhance()` 強化、`forgeRefine()` 精煉、`forgeSocket()` 開孔、`forgeGem()` 鑲嵌、`forgeReroll()` 洗煉、`synthesize()` 3合1 升品、`enhanceEquippedAll()` 全身強化、`enhanceSelected()`、`renderForge()` 煉器頁 |
| `inventory.js` | 背包核心：物品鎖定（`isLocked()`／`toggleLock()`／`getStackLock()`）、`sellInventorySingle()`、`dismantleInventory()`、一次全部分解（`getDecomposeCandidates()`／`openInventoryDecompose()`／`confirmInventoryDecompose()`）、`salvageAllEquipment()` |
| `shop.js` | `refreshMarket()` 每日刷新、`buyShopItem()`、`buyEquip()`、`renderShop()` 店舖頁 |
| `dungeons.js` | 六大副本：五行妖閣、試煉神殿、迷宮尋寶、魂魄副本、聚妖谷、沙魔巢穴（`startXxx()`／`resolveXxx()`）、`dungeonPrepare()`、`dungeonConditions()`／`openDungeonPrompt()`／`dungeonEnter()`、`renderBoss()` Boss 與副本頁 |

### D. 介面

| 檔案 | 主要函式 |
|---|---|
| `ui-core.js` | `paintLog()` 戰鬥紀錄、`classEmblem()` 門派徽記 SVG、**`syncHud()` 上方角色列**、打擊感（`setBarPair()`／`flashBar()`／`showDmg()`）、**`syncBattle()` 戰鬥畫面**、`manualAttack()`／`manualSkill()`／`manualPotion()` |
| `ui-panels.js` | `goPanel()` 切換頁面、`renderSide()` 下方十格選單、`classAiName()`、`renderCharacter()` 角色頁、`renderHome()` 主城頁、`renderWorld()` 獵場頁 |
| `inventory-ui.js` | `inventorySellPrice()`、全部販賣（`sellAllItems()`／`confirmBatchSell()`）、`openInventoryDetail()` 物品詳情、`addItemToInventory()`、堆疊／分類／排序（`INVENTORY_CATEGORY_LABELS`、`inventorySlotEntries()`、`inventorySortEntries()`）、Tooltip、**`renderInventory()` 背包頁** |
| `skills-ui.js` | `renderSkills()` 神通頁、`buySkill()`、`assignSkillSlot()` 4 連招槽、`assignBuffSlot()` 增益 2 槽、`isBuffSkill()`／`isStatusSkill()` |
| `ai-panel.js` | `renderAI()` 掛機 AI 頁 |
| `system-ui.js` | `setScreenMode()`／`toggleFullscreen()`／`applyScreenMode()` 螢幕模式、`logoutGame()`、更新選單、吃藥選單（`renderPotionMenu()`）、**`renderSystem()` 設定頁**、戰鬥策略選擇器、`setAuto()`、`exportSave()`／`importSave()`／`resetGame()` |
| `render-loop.js` | `renderDeskChar()` 電腦版第一區塊、**`renderAll()` 總繪製**、`tickSecond()` 每秒回復、**`loop()` 主迴圈** |
| `boot.js` | `openClassScreen()` 創角畫面、`openTeleport()`／`closeTeleport()` 傳送、`updateStaticLabels()`、按鈕綁定、啟動流程、`Object.assign(window, {...})` 全域匯出 |

---

## 三、常見需求 → 改哪個檔

| 需求 | 檔案 |
|---|---|
| 改怪物數值、掉落、新增地圖 | `official-data.js` |
| 改裝備數值、新增裝備 | `equip-db.js` |
| 改神通數值、新增神通 | `classes-skills.js` |
| 改 Boss、副本清單與掉落率 | `dungeon-boss-db.js` |
| 改商店商品、靈寵、任務 | `market-pet-quest.js` |
| 改升級所需經驗、打怪經驗 | `exp.js` |
| 改傷害／命中／暴擊／戰力公式 | `stats.js` |
| 改強化／精煉／開孔／鑲嵌／洗煉／升品機率 | `forge.js` |
| 改品質倍率、奇緣模式掉落 | `equipment.js`（機率集中在 `rollQiyuanEquip()`） |
| 改自動掛機 AI 選招、戰鬥節奏 | `combat.js` |
| 改自動喝水／自動施法治癒 | `potion.js`（設定值在 `system-ui.js` 的設定頁） |
| 改副本流程與獎勵 | `dungeons.js` |
| 改背包顯示、分類、Tooltip | `inventory-ui.js` |
| 改背包鎖定、販賣、分解規則 | `inventory.js` |
| 改上方角色列、血條、傷害飄字 | `ui-core.js` |
| 改下方十格選單、角色頁、主城頁、獵場頁 | `ui-panels.js` |
| 改設定頁、螢幕模式、存檔匯出入 | `system-ui.js` |
| 改離線收益 | `offline.js` |
| 改存檔內容／新增存檔欄位 | `state.js`（`freshState()`）＋ `save.js`（`normalize()`） |
| **改版本號** | `config.js` 的 `GAME_VERSION`、`system-ui.js` 的 `footer-note`、`index.html` 的更新選單、上層 `README.md` |
| 改登入頁／選角／創角 | `lobby.js`（不在 data/） |
| 改共用倉庫 | `warehouse.js`（不在 data/） |
| 改版面骨架、CSS | `index.html`、`theme.css`、`ui-buttons.css` |

---

## 四、注意事項

- 這些都是**傳統 script（非 ES module）**，沒有 `import`／`export`。
  檔案之間靠全域變數串接：`G`、`battle`、`SKILLS`、`EQUIP_DB`、`MAPS` 等等。
- HTML 裡的 `onclick="xxx()"` 只找得到掛在 `window` 上的函式。
  **新增給 HTML 直接呼叫的函式時，記得加進 `boot.js` 最後的 `Object.assign(window, {...})`。**
- 每個檔案開頭都有 `'use strict';`（原本行內 script 就是嚴格模式，拆檔後必須逐檔保留）。
- 新增模組的步驟：
  1. 建立 `data/新檔.js`，開頭寫 `'use strict';`
  2. 在 `index.html` 的 `data/boot.js` **之前**插入 `<script src="data/新檔.js"></script>`
  3. 在本檔的表格補一列
- `data/` 資料夾必須和 `index.html` 放在同一層一起上傳，少了任何一個檔遊戲都開不起來。
