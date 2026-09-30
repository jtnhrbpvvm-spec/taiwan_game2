# 凡塵修仙傳攻略頁

- 資料來源：https://k559610142-art.github.io/-username-.github.io-/ 的 `data/*.js`。
- `index.html` 是入口網站。**每新增一個頁面，都要在 `index.html` 的 `PAGES` 陣列加一筆**（href、icon、title、desc、tags），並在新頁面最上方放「← 回攻略首頁」連結到 index.html。
- 頁面不顯示抽選機率給玩家看。
- 每頁都要支援淺色／深色模式，連結用 `var(--link)`、強調字用 `var(--acct)`，文字對比度至少 3.5:1（不要用瀏覽器預設的藍色連結）。
- 經驗不顯示「每小時經驗」（依裝備而不同），也不寫地圖的經驗倍率；只顯示已套用地圖加倍後的單隻妖獸經驗。
