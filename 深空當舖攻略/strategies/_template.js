/*
 * 流派範本（不會被載入，manifest 裡沒有它）。
 * 複製成 NN-英文名.js，改內容，再加進 manifest.js。
 *
 * sections 的每一段可以用這些欄位（都可省略）：
 *   p:     '一段文字'  或  ['好幾段', '文字']
 *   list:  ['條列', '項目']
 *   steps: ['有編號的', '步驟']
 *   table: { head: ['欄1', '欄2'], rows: [['a', 'b'], ['c', 'd']] }
 *   note:  '黃色提示框'
 * 文字裡可以用 <b> <i> <code> 等簡單 HTML。
 */
window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'example',              // 英文代號，網址 #example 會直接打開這篇
  order: 99,                  // 排序用
  icon: '💡',
  name: '範例流',
  group: '生產',              // 分類：基礎 / 買賣 / 生產 / 灰色 / 黑色
  tagline: '一句話說明這個流派。',
  stats: { capital: 3, difficulty: 3, risk: 1, speed: 3 }, // 1~5：起手資金、上手難度、風險、回本速度(越大越快)
  unlock: '怎麼解鎖（開局身分 / 王爾德人脈 / 價格）',
  tags: ['標籤'],
  sections: [
    { title: '核心玩法', p: '說明……' }
  ],
  tips: ['小技巧'],
  pitfalls: ['常見地雷'],
  sources: [{ title: '來源標題', url: 'https://example.com' }],
  updated: '2026-11-03'
});
