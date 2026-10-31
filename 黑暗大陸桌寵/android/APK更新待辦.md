# APK 更新待辦：收入分頁「重置」按鈕（2026-10-31）

雲端的 Claude 只改得到 taiwan_game2 這個倉庫，安卓專案原始碼在電腦上（`C:\Users\a2095\Desktop\dark_pet_android`，說明在那邊的 `開發紀錄.md`），
所以 APK 要在電腦上重新打包。這份是交接用的，做完可以刪掉。

## 已經做好、推到 main 的

| commit | 內容 |
|---|---|
| `67a9794` | 電腦版內容 1.4.12：收入總覽右上角「重置」按鈕（`income.js` 的 `reset(index)`、`main.js` 的 `income:reset`、`ui/income.*`） |
| `14fabf1` | 安卓版**內容** 1.5.1：只改 `android/content/1.5.1/panel/index.html`（APK 沒動，還是 1.5.0） |

安卓內容 1.5.1 的做法（純面板，不靠 APK）：
- 「收入」分頁角色名旁邊加 `#income-reset` 按鈕；按一下變「再按一次確定」，3 秒內再按才重置（沒用 `confirm()`，不確定 WebView 有沒有接 `onJsConfirm`）。
- 重置時把 `Android.income()` 當下那隻的數字存成基準（`localStorage` 的 `incomeBase`，第幾隻 → `{ at, startedAt, exp, levels, gold, kills, deaths, soldGold, obtained, sold }`），
  之後 `renderIncome()` 顯示的都扣掉基準（`sinceBase()`）。`startedAt` 跟基準不同（桌寵重新啟動）就不用那份基準。
- 說明分頁「收入分頁」那列、收入分頁底下說明文字都補了重置的說明。

## 電腦上要做的

1. **先把面板改動搬回安卓專案**，不然下次 `tools/publish.js` 會用專案裡的舊面板蓋掉：
   taiwan_game2 `git pull` 之後，把 `黑暗大陸桌寵/android/content/1.5.1/panel/index.html` 跟專案裡的 `panel/index.html` 比對合併
   （`git show 14fabf1` 看差異，只有重置相關的那幾段）。
2. **（建議）APK 裡做真正的重置**，取代面板扣基準的做法：
   - 原生端記收入的地方（給 `Android.income()` 資料的那個）加一個重置：第 i 隻的 exp／levels／gold／kills／deaths／soldGold／obtained／sold 歸零、`startedAt` 改成現在，
     **但保留上一筆存檔當比較基準**（電腦版 `income.js` 的 `reset()` 就是這樣：`{ ...blank(), character, last }`），不然下一次存檔會把重置前的差距又算回來。
   - 給面板呼叫的介面，例如 `Android.action("income:reset:" + i)` 或新的 `@JavascriptInterface incomeReset(int)`。
   - 面板的重置按鈕改成呼叫它；`incomeBase`／`sinceBase()` 那段就可以拿掉（或留著當舊 APK 的備援：`typeof Android.incomeReset === "function"` 才走原生）。
   - 如果不想動原生端，第 2 步可以跳過，面板扣基準的做法已經能用。
3. 版本號：APK 至少 **1.5.2**（versionCode 加 1），因為內容已經發到 1.5.1，新的內容版本要比它大。
4. 照平常的流程跑 `tools/publish.js`（會更新 `android/` 的 APK、`app.json`、`content/`，還有 `黑暗大陸桌寵/index.html` 的下載按鈕），commit、推到 taiwan_game2 的 `main`。
5. 在手機或模擬器上試：收入分頁按兩下「重置」→ 數字歸零 → 打幾隻怪後只算新的；多隻時只動目前那隻。
