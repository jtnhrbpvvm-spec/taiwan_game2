window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'aquafarm',
  order: 5,
  icon: '🐟',
  name: '養魚流（魚片與魚子醬）',
  group: '生產',
  tagline: '前期投入大、照護多，後期靠鱘魚魚子醬（240 / 罐）賺高價。',
  stats: { capital: 4, difficulty: 4, risk: 1, speed: 2 },
  unlock: '養魚人開局，或向王爾德買「水產養殖」400（需先有水交易）',
  tags: ['吳郭魚', '鰻魚', '鱘魚', '魚子醬', '循環水'],
  sections: [
    {
      title: '產出與價格',
      table: {
        head: ['產物', '參考價'],
        rows: [['大魚片', '143'], ['魚片', '57'], ['小魚片', '26'], ['極小魚片', '13'], ['鰻魚片', '136'], ['鱘魚魚子醬（每罐）', '240']]
      }
    },
    {
      title: '設置',
      steps: [
        '需要：循環水系統、儲水箱、能源、過濾、飼料、魚或受精卵。',
        '加水 → 接上充好電的能源電池 → 投餵機裝飼料。',
        '新手魚種用<b>吳郭魚</b>，食性彈性大。',
        '鰻魚、鱘魚要吃肉類飼料，用攪拌（Blend）功能做飼料 —— 可以接養鼠流的肉。',
        '用合適的刀把魚處理成肉；鱘魚配對應設備可取魚子醬。'
      ]
    },
    {
      title: '升級',
      list: ['水產養殖 II：資料不一致（1,200 或 500），以遊戲內為準。']
    }
  ],
  tips: ['不要過度擁擠。', '留足種魚給下一代。', '水源可以接賣水流的設備。'],
  pitfalls: ['設備和成長前期吃很多資源，現金流不穩時不要開。', '水、電、飼料任一斷掉都會出問題。'],
  sources: [
    { title: 'Bonus Action：All Trades（魚價）', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: 'ShowGamer：Fish Farming and Caviar', url: 'https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry' },
    { title: 'probablystolenguides.com：赚钱路线对比', url: 'https://probablystolenguides.com/zh/guides/money-making/' }
  ],
  updated: '2026-11-03'
});
