# 黑暗大陸桌寵

照「放置希望桌寵」（`../desktop_pet`）的做法做的黑暗大陸（屠龍勇者）桌寵：
線上版遊戲在一個藏起來的視窗裡照常掛機，桌面底部留一隻你角色職業的小人走來走去。
跟原本的桌寵比，**拿掉了說話（提醒、問答、特別對話）和撫摸（愛心、喊摸我）**，也拿掉只有放置希望才有的功能（黑店、線上GM、書籤工具、收益、存檔管理）。說話只留一種：遊戲或桌寵有新版時的提醒。

## 使用

- 安裝：執行 `dark-continent-pet-setup-<版本>.exe`（`npm run release` 產生，放在本資料夾最上層）。
- 第一次：對桌寵按右鍵 →「帳號管理…」加入遊戲帳號（Email＋密碼）並指定給桌寵，桌寵會自動登入、按「繼續冒險」。
- **多帳號**：「桌寵數量」幾隻就有幾個獨立的遊戲在背景跑（各自的 session partition，登入、存檔互不影響），每隻掛一個帳號；
  右鍵「帳號（第 N 隻）」點一下就換帳號、自動登入。同一個帳號只能給一隻用。
- 帳號檔：`%APPDATA%\黑暗大陸桌寵\accounts.json`。密碼用 Windows 內建加密（Electron safeStorage／DPAPI）存成 `passEnc`；
  手動編輯可以寫 `"password": "明文"`，下次啟動自動轉成加密。換電腦或換 Windows 使用者後要重新輸入密碼。
- 操作說明在右鍵選單「操作說明」。

## 安卓版

`android/` 是安卓版的發佈檔（APK、`app.json`、內容更新 `content/`），由安卓專案的 `tools/publish.js` 產生。
原始碼不在這個倉庫：`C:\Users\a2095\Desktop\dark_pet_android`（說明在那邊的 `開發紀錄.md`）。最多 3 隻（建議 2 隻），第 3 隻要玩家確認。

## 開發

```
npm install
npm start            # 開發版直接跑
npm run selftest     # 用暫存資料夾建一個訪客角色，自動檢查讀存檔、自動繼續、多隻獨立遊戲、帳號檔加密、選單、外觀、說明（不會真的登入）
npm run dist         # 打包安裝檔到 dist/
npm run release      # 打包＋把 latest.yml、安裝檔、blockmap 複製到本資料夾最上層＋發布小檔案內容 content/（發佈用）
npm run release:content  # 只發布小檔案內容（只改了內容、沒改外殼時用，不用打包）
npm run names        # 遊戲加了新地圖／道具／職業圖後，重新產生 names.json
npm run zones        # 黑暗大陸攻略重新產生資料後（../黑暗大陸攻略/tools/extract.js），重新產生 zones.js（收入總覽的目前地圖）
```

## 外殼＋內容（小檔案更新，1.2.0 起）

做法照放置希望桌寵：程式分兩層，平常的更新只下載有變動的小檔案（約 170 KB），不用重新下載 80 MB 的安裝檔（使用者 2026-10-26 指定）。

- **外殼**＝`boot.js`、`shell/`、`update-source.json`、Electron 本體，跟著安裝檔走，很少改。`boot.js` 決定這次跑哪一份內容（安裝檔內建的，或下載回來比較新的）。
- **內容**＝其他全部（`main.js`、`pet/`、`ui/`、`names.json`…）＝`package.json` 的 `build.files` 扣掉外殼的檔案。下載回來的放在 `%APPDATA%\黑暗大陸桌寵\content\<版本>\`。
- **退回**：新下載的內容頭幾次啟動算試用，`main.js` 開好視窗會呼叫 `petShell.markHealthy()`；啟動時直接出錯或連續兩次沒回報就記成壞的（`content\state.json` 的 `bad`），自動退回上一份。2026-10-26 實測：故意壞掉的 9.9.10 被記成壞的、刪掉，桌寵自己重開回到 9.9.9。
- **什麼時候要整包更新**：改到外殼、或 `package.json` 的套件時，`boot.js` 的 `SHELL_API` 加 1，跑完整的 `npm run release`；舊外殼看到清單要的號碼比自己大，就改下載完整安裝檔。小檔案下載失敗時也會退回完整安裝檔。
- 1.1.0 以前裝的沒有外殼，要先整包更新到 1.2.0 一次，之後才是小檔案更新。

## 發佈新版（自動更新）

1. `package.json` 的 `version` 加一（例如 1.2.0 → 1.2.1）。版本號沒變，已安裝的桌寵不會更新。
2. 只改了內容：`npm run release:content`，產生 `content/manifest.json`＋`content/<版本>/`。
   改到外殼：`boot.js` 的 `SHELL_API` 加 1，`npm run release`（打包＋安裝檔三個檔＋`content/`）。
3. commit 改過的檔案，推到 taiwan_game2 的 `main`。

已安裝的桌寵打開後 10 秒、之後每 30 分鐘，先看 `…/黑暗大陸桌寵/content/manifest.json`（加時間標記 `?t=時間`，避開 GitHub 約 5 分鐘的快取），
有比較新的內容就只下載那些小檔案（逐一核對 SHA-256）；需要新外殼或小檔案失敗時才看 `latest.yml` 下載完整安裝檔（electron-updater，也會加 `?noCache=時間`）。
下載好桌寵提醒，右鍵「立即更新桌寵」重新啟動；不按的話下次打開桌寵自動換上（安裝檔則是下次結束時自動安裝）。

同一個 30 分鐘檢查也會看線上遊戲的版本號（`data/game.js?v=…`，一樣加時間標記），跟遊戲視窗載入的不一樣就提醒「黑暗大陸更新了」，右鍵「套用遊戲更新」重新載入全部遊戲。
勿擾（專注模式）時不跳提醒，解除後補講；桌寵被藏起來時改用系統通知。

## 檔案

| 檔案 | 內容 |
|---|---|
| `main.js` | 主程式：每隻桌寵一個遊戲視窗、桌寵視窗、右鍵選單、系統匣、快捷鍵、讀存檔比出經驗／金幣／掉寶事件、自動登入與自動繼續冒險 |
| `accounts.js`、`accounts-preload.js`、`ui/accounts.*` | 帳號檔（加密存密碼）與帳號管理視窗 |
| `zones.js`、`tools/gen-zones.js`、`tools/zone-guide-helper.js` | 收入總覽「目前地圖」：每張地圖的等級、怪物分布（Lv／HP／經驗、稀有首領）、可獲得物品（機率、來源）、可掉的魔法書／技能書（每隻怪的掉書率與書單）＋「看攻略」連結。點物品／怪物／書名跳出跟攻略網一樣的說明視窗：程式是攻略 `assets/wiki.js` 標「桌寵共用」那段原樣抄進來（`window.GUIDE_WIKI`），資料是攻略資料的一部分（`ZONE_GUIDE.wiki`）；說明視窗裡的攻略網頁連結用瀏覽器開。資料來自 `../黑暗大陸攻略/data/wiki-data.js`；電腦版、安卓版設定畫面都用 `../zones.js` 載入（安卓版的內容更新也帶這個檔） |
| `income.js`、`income-preload.js`、`ui/income.*` | 收入總覽（這次啟動以來；啟動時清掉 `income-*.json` 重記）。拿到／賣出的東西來自遊戲「掉落紀錄」訊息框（`main.js` 的 `LOOT_COLLECTOR`，遊戲藏著時會幫忙打開） |
| `boot.js`、`shell/content-store.js`、`shell/updates.js`、`update-source.json` | 外殼：選這次跑哪份內容、壞版退回、小檔案更新（必要時改下載完整安裝檔） |
| `updates.js` | 遊戲版本檢查；桌寵自己的更新交給外殼（`global.petShell.updates`） |
| `tools/release.js`、`tools/publish-content.js` | 發佈：安裝檔三個檔（也會改教學網頁的下載按鈕）、小檔案內容 `content/` |
| `index.html` | 給玩家看的下載與教學網頁（風格配合遊戲；封面、職業動作圖直接用遊戲站上的）。GitHub Pages 網址：`https://jtnhrbpvvm-spec.github.io/taiwan_game2/黑暗大陸桌寵/` |
| `save-reader.js` | 解開遊戲加密的本機存檔（照抄遊戲 `guard.js` 的解法，只讀） |
| `names.json` | 職業動作圖、變身外觀（`morphs`／`morphForms`／`defaultMorph`，變身時桌寵跟著變）、村莊／地圖／道具名稱（`tools/gen-names.js` 從遊戲原始資料產生；線上版混淆過，讀不到遊戲裡的資料） |
| `game-preload.js` | 讓遊戲永遠以為自己開在畫面上（`document.hidden` 一律 false）。**不能**回報「在背景」：遊戲在背景時大地圖的 `sceneUpdate` 停掉、不走過去找怪，節奏跟看著時不同，實際不會掉寶（使用者 2026-10-26 回報）。**節約效能模式**（`main.js` 的 `setGameHidden`／`setPowerSave`）只把藏著的遊戲 `devicePixelRatio` 回報成 0.5，地圖畫布少畫很多像素，邏輯照常；不改遊戲程式、不碰防改檔（存檔簽章、記憶體數值） |
| `main.js` 的 `parkGame`／`showGame` | 遊戲視窗「藏起來」＝停在螢幕外只露 1～2 像素、幾乎透明、不在工作列、滑鼠穿過，但仍是顯示中的視窗。沒顯示（hide／show:false）的視窗遊戲畫面迴圈一秒只跑 1～2 次（2026-10-26 實測；顯示中 165 次），找怪節奏會不對；安卓版也是 1 像素懸浮視窗 |
| `main.js` 的 `openGame`（保持狀態列） | 右鍵「顯示遊戲視窗（保持狀態列）」：之後關掉遊戲視窗時照樣停到螢幕外，但工作列留著按鈕、視窗可以拿焦點，點工作列按鈕（`focus`）就叫回來，看起來像縮小到工作列（使用者 2026-10-26 指定）。不能真的最小化，理由同上。用一般的「顯示遊戲視窗」叫出來就恢復成完全藏起來。每隻上次選哪一種、遊戲視窗擺在哪，記在 `pet-settings.json` 的 `gameWindows`（`savedGameWindow`／`rememberGameWindow`），下次打開桌寵照上次的（快捷鍵、點兩下桌寵也照上次的選項） |
| `main.js` 的 `gameSize`／`syncDisplayMode` | 遊戲視窗跟著遊戲設定的「🖥️ 畫面尺寸」（遊戲 localStorage `dragonSlayer_display`，每隻各自一份）換大小：自動尺寸 480×860；手機 9:16 遊戲區剛好 9:16；PC 16:9 橫式、遊戲區寬 1280（螢幕放不下就縮小）；全螢幕＝叫出來時網頁全螢幕（Esc 退出），藏起來前先退出全螢幕。遊戲叫出來時每秒看一次設定，載入完也看一次；藏著時視窗維持該模式大小停在螢幕外 |
| `pet/` | 桌寵畫面：走動、站著、拖曳、跳、進帳時揮一下／升級時施法、頭上飄字、調整大小。角色在村莊時睡覺（`main.js` `describePlace` 的 `sleeping` → `pet.js` `setSleeping`）：頭上斜排小中大三個 Z 循環冒出，不走、不踏步、不揮擊、不跳（還能拖著移動、點兩下開遊戲） |
| `ui/` | 操作說明、選擇外觀（12 職業＋調色） |
| `selftest.js` | 自我測試 |

## 注意

- 遊戲網址寫在 `main.js` 的 `GAME_URL`（GitHub Pages 線上版）。
- 存檔格式、存檔 key、加密方式改了的話要跟著改 `main.js` 的 `SAVE_KEY`／`SLOT_KEY` 和 `save-reader.js`；解不開時桌寵只是不顯示角色狀態，遊戲照常跑。
- 桌寵的遊戲存檔在桌寵自己的資料夾（`%APPDATA%\黑暗大陸桌寵`），跟瀏覽器分開；同一個角色不要同時在瀏覽器和桌寵玩。
