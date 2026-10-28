# 黑暗大陸攻略百科

《黑暗大陸》（`idle-lineage-class/-username-.github.io-/屠龍勇者`）的攻略與百科網站。純靜態 HTML，直接放 GitHub Pages 就能看。

## 頁面

| 檔案 | 內容 |
|---|---|
| `index.html` | 首頁、目錄 |
| `guide.html` | 新手攻略（選職業、設定、練功路線、該買什麼、裝備成長、賺錢、中後期、常見問題） |
| `classes.html` | 十二職業：能力、成長、武器攻速、魔法等級、技能、故事、參考配點 |
| `skills.html` | 共用魔法 1～10 級與各職業技能 |
| `items.html` | 道具圖鑑（可篩選、搜尋，點開看取得方式） |
| `monsters.html` | 怪物圖鑑與共通掉落 |
| `zones.html` | 村莊商店與各狩獵地區 |
| `quests.html` | 職業任務 4 章 |
| `enchant.html` | 衝裝成功率 |
| `affix.html` | 品質、詞綴、製作通貨 |
| `resonance.html` | 共鳴裝備 |
| `forge.html` | 鍛造配方、BOSS 附魔 |
| `rift.html` | 異界地圖 |
| `tower.html` | 永夜之塔 |
| `dragons.html` | 四大龍、稀有首領、團隊副本、世界首領 |
| `dolls.html` | 魔法娃娃 |
| `morph.html` | 變形卷軸 |
| `merc.html` | 傭兵（傭兵團試煉、六職業、符石技能、階級、死亡復活） |
| `mechanics.html` | 數值公式與戰鬥規則 |
| `exp.html` | 經驗表、離線收益 |
| `online.html` | 線上功能（雲端、鑽石、倉庫、交易所、拍賣、血盟、排行榜） |

共用檔：`assets/wiki.css`（樣式）、`assets/wiki.js`（導覽列、全站搜尋、道具／怪物／技能彈出說明、可排序表格）、`data/wiki-data.js`（自動產生的遊戲資料）。

## 遊戲更新後重新產生資料

```
node tools/extract.js
```

腳本會載入遊戲的 `data/*.js`（只讀，不改遊戲），把職業、技能、道具、怪物（用遊戲的公式算出實際數值）、地區、任務、共鳴、詞綴、通貨、娃娃、變身、經驗表等寫進 `data/wiki-data.js`。
遊戲資料夾預設是 `../../idle-lineage-class/-username-.github.io-/屠龍勇者`，放在別處時把路徑當參數傳入。

- 頁面上的數值大多直接讀 `wiki-data.js`，重跑就會更新。
- 文字說明（攻略、規則）是依遊戲的 `ARCHITECTURE.md` 整理的，遊戲改規則時要手動改對應頁面。
- 圖片直接引用遊戲線上版網址（`IMG_BASE`，在 `tools/extract.js`），不複製圖檔；圖片版權屬遊戲作者。
