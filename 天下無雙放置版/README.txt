天下無雙放置版 v5.5 — Engineized Final

啟動方式：
1. 解壓本資料夾。
2. 保持 index.html 與 engine/、game/ 的相對路徑。
3. 用 Chrome / Safari 開啟 index.html。

本最終版包含：
- requestAnimationFrame + 固定 60Hz physics + accumulator
- 最大 200ms frame compensation
- visibility pause / resume
- Engine Node / Node2D / Control / Timer / Tween / SceneLoader
- Signal / EventBus / frame-end dispatch
- DOM cache / dirty field diff / keyed DOM reuse / VirtualList 基礎元件
- object / DOM pool
- StateStore 與 legacy save adapter
- unified timer after / every / cooldown / cancelByTag
- combat hot-path cache、stats dirty flag、HUD diff、battle action reuse
- shop / inventory keyed DOM reuse

相容性：
- SAVE_KEY: txws_idle_v550
- Legacy keys 保留：
  txws_idle_v530
  txws_idle_v520
  txws_idle_v510
  txws_idle_v500
  txws_shentong_single_v400
  txws_shentong_single_v302
  txws_xianlu_fusion_v1
- TXWS 存檔碼匯入／匯出保留。
- 原有 CSS 與靜態 HTML 結構未改動。
- 商店／背包的既有 class 名稱未新增替代 class；只改成節點重用。

自動審核結果：
PASS  所有 engine/*.js 通過 node --check
PASS  state-adapter.js 通過 node --check
PASS  主 index.html inline script 通過 node --check
PASS  8 個外部 script 路徑全部存在
PASS  原始檔 script 區前的 HTML/CSS bytes 保持一致
PASS  原始 ID 集合沒有缺失
PASS  SAVE_KEY 與 7 個 legacy keys 全保留
PASS  engine layer 沒有遊戲業務詞
PASS  setInterval / setTimeout 已從主遊戲 loop 移除
PASS  engine layer 不使用 Date.now 作為計時驅動
PASS  先前商店 keyed reuse 的 undefined index 問題已修正
PASS  renderSide 改為一次建立、後續只切換 active class
PASS  inventory 空列表仍保留原「尚無裝備／尚無材料」顯示

實機效能狀態：
- 本環境無法可靠量測真實 iOS Safari 15+ / Android Chrome 100+ FPS。
- 本地 Chromium 對 file:// 與 localhost 有環境層級封鎖，因此未把該環境限制誤判為遊戲錯誤。
- FPS >=55、Scripting <=8ms/frame、Layout <=2ms/frame、記憶體曲線穩定，請依性能 QA 清單在真機 DevTools 驗證。
