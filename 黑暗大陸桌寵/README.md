# 黑暗大陸桌寵

照「放置希望桌寵」（`../desktop_pet`）的做法做的黑暗大陸（屠龍勇者）桌寵：
線上版遊戲在一個藏起來的視窗裡照常掛機，桌面底部留一隻你角色職業的小人走來走去。
跟原本的桌寵比，**拿掉了說話（提醒、問答、特別對話）和撫摸（愛心、喊摸我）**，也拿掉只有放置希望才有的功能（黑店、線上GM、書籤工具、收益、存檔管理）。說話只留一種：遊戲或桌寵有新版時的提醒。

## 使用

- 安裝：執行 `dist/dark-continent-pet-setup-1.0.0.exe`（`npm run dist` 產生）。
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
npm run release      # 打包＋把 latest.yml、安裝檔、blockmap 複製到本資料夾最上層（發佈用）
npm run names        # 遊戲加了新地圖／道具／職業圖後，重新產生 names.json
```

## 發佈新版（自動更新）

1. `package.json` 的 `version` 加一（例如 1.0.0 → 1.0.1）。版本號沒變，已安裝的桌寵不會更新。
2. `npm run release`：打包，並把 `latest.yml`、`dark-continent-pet-setup-版本.exe`、`.blockmap` 放到本資料夾最上層（舊版安裝檔會刪掉）。
3. commit 這三個檔案（和改過的程式），推到 taiwan_game2 的 `main`。

已安裝的桌寵打開時、之後每 30 分鐘，會從
`https://raw.githubusercontent.com/jtnhrbpvvm-spec/taiwan_game2/main/黑暗大陸桌寵/latest.yml` 檢查（網址在 `package.json` 的 `build.publish`）。
檢查時網址會加時間標記（`?noCache=時間`），避開 GitHub 約 5 分鐘的快取，推上去後玩家下一次檢查就拿得到。
找到新版會在背景下載，下載好桌寵提醒，右鍵「立即更新桌寵」或下次結束時自動安裝。

同一個 30 分鐘檢查也會看線上遊戲的版本號（`data/game.js?v=…`，一樣加時間標記），跟遊戲視窗載入的不一樣就提醒「黑暗大陸更新了」，右鍵「套用遊戲更新」重新載入全部遊戲。
勿擾（專注模式）時不跳提醒，解除後補講；桌寵被藏起來時改用系統通知。

## 檔案

| 檔案 | 內容 |
|---|---|
| `main.js` | 主程式：每隻桌寵一個遊戲視窗、桌寵視窗、右鍵選單、系統匣、快捷鍵、讀存檔比出經驗／金幣／掉寶事件、自動登入與自動繼續冒險 |
| `accounts.js`、`accounts-preload.js`、`ui/accounts.*` | 帳號檔（加密存密碼）與帳號管理視窗 |
| `income.js`、`income-preload.js`、`ui/income.*` | 收入總覽（這次啟動以來；啟動時清掉 `income-*.json` 重記）。拿到／賣出的東西來自遊戲「掉落紀錄」訊息框（`main.js` 的 `LOOT_COLLECTOR`，遊戲藏著時會幫忙打開） |
| `updates.js`、`tools/release.js` | 桌寵自動更新（electron-updater）與遊戲版本檢查；發佈新版的複製腳本（也會改教學網頁的下載按鈕） |
| `index.html` | 給玩家看的下載與教學網頁（風格配合遊戲；封面、職業動作圖直接用遊戲站上的）。GitHub Pages 網址：`https://jtnhrbpvvm-spec.github.io/taiwan_game2/黑暗大陸桌寵/` |
| `save-reader.js` | 解開遊戲加密的本機存檔（照抄遊戲 `guard.js` 的解法，只讀） |
| `names.json` | 職業動作圖、變身外觀（`morphs`／`morphForms`／`defaultMorph`，變身時桌寵跟著變）、村莊／地圖／道具名稱（`tools/gen-names.js` 從遊戲原始資料產生；線上版混淆過，讀不到遊戲裡的資料） |
| `game-preload.js` | 讓遊戲以為一直在前景，藏起來也照常掛機 |
| `pet/` | 桌寵畫面：走動、站著、拖曳、跳、進帳時揮一下／升級時施法、頭上飄字、調整大小 |
| `ui/` | 操作說明、選擇外觀（12 職業＋調色） |
| `selftest.js` | 自我測試 |

## 注意

- 遊戲網址寫在 `main.js` 的 `GAME_URL`（GitHub Pages 線上版）。
- 存檔格式、存檔 key、加密方式改了的話要跟著改 `main.js` 的 `SAVE_KEY`／`SLOT_KEY` 和 `save-reader.js`；解不開時桌寵只是不顯示角色狀態，遊戲照常跑。
- 桌寵的遊戲存檔在桌寵自己的資料夾（`%APPDATA%\黑暗大陸桌寵`），跟瀏覽器分開；同一個角色不要同時在瀏覽器和桌寵玩。
