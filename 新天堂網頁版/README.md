# 新天堂網頁版 攻略．小百科

- `index.html` 首頁、`guide.html` 攻略、`wiki.html` 小百科（純靜態，直接放 GitHub Pages 即可）。
- 資料：`data/wiki-data.js`，圖示在 `img/`，都由腳本從遊戲本體產生。
- 只收錄目前拿得到的內容（地圖上有生的怪、有出現的商人、材料拿得到的製作配方、寶箱、任務、扭蛋獎池）。

## 遊戲更新後重新產生資料

```powershell
node --max-old-space-size=8000 tools\build-data.cjs
```

預設讀 `..\..\idle-lineage-class\-username-.github.io-\天堂網頁版`，也可以把遊戲資料夾當第一個參數。
攻略文字（`guide.html`）是手寫的，遊戲規則改了要手動更新；表格（練功路線、任務、BOSS、機率）會跟著資料自動更新。
