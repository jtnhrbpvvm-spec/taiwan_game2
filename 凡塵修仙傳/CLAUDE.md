# 凡塵修仙傳攻略頁

- 資料來源：https://k559610142-art.github.io/-username-.github.io-/ 的 `data/*.js`。
- `index.html` 是入口網站。**每新增一個頁面，都要在 `index.html` 的 `PAGES` 陣列加一筆**（href、icon、title、desc、tags），並在新頁面最上方放「← 回攻略首頁」連結到 index.html。
- 頁面不顯示抽選機率給玩家看。
- 頁面不寫資料來源細節（不要出現 data/、config-xxx.js 等檔名），連原始碼註解也不要。
- 每頁都要支援淺色／深色模式，連結用 `var(--link)`、強調字用 `var(--acct)`，文字對比度至少 3.5:1（不要用瀏覽器預設的藍色連結）。
- 經驗不顯示「每小時經驗」（依裝備而不同），也不寫地圖的經驗倍率；只顯示已套用地圖加倍後的單隻妖獸經驗。
  - 例外：`屬性與技能.html` 的「打怪推薦」分頁是依讀取的存檔（玩家自己的數值與裝備）計算，使用者要求顯示每張地圖每小時經驗與靈石。算法照遊戲的掛機估算移植，改動後要用遊戲本體的程式比對。
- `profile.js` 是全站共用的存檔暫存；新頁面要 `<script src="profile.js"></script>`，需要新的存檔欄位時加到它的 `KEEP` 清單。
- `site.js` 是全站共用的頂部搜尋與物品彈窗；新頁面要在 profile.js 後面加 `<script src="site.js"></script>`，內容要放在 `.wrap` 裡。
  - **新增或修改任何頁面的內容後，都要執行 `node tools/build-search.js` 重建 `search-index.js`**（用 Edge／Chrome 無頭模式把每頁跑一遍；頁面清單取自 `index.html` 的 `PAGES`）。
  - 物品資料在 `items.js`（「物品一覽」頁和彈窗共用）。新增物品時填 `keys`＝在其他頁面文字中要變成可點連結的名稱（靈石也照使用者要求做成連結）。含有物品名但不是指該物品的詞，加到 `site.js` 的 `STOP`。
  - 不想被自動加上物品連結的區塊加 `data-noitm` 屬性。
