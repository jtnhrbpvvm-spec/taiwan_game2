window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'trading',
  order: 1,
  icon: '🛒',
  name: '倒賣流（低買高賣）',
  group: '買賣',
  tagline: '不需設備、馬上有收入。向拾荒者收貨，湊滿客人預算賣出。',
  stats: { capital: 1, difficulty: 1, risk: 1, speed: 5 },
  unlock: '開局就能做（推薦學徒開局）',
  tags: ['新手', '食物', '日用品', '材料', '湊預算', '批發折扣', '市場事件'],
  sections: [
    {
      title: '核心概念',
      p: '每個買家有<b>預算</b>和<b>接受的商品類別</b>（食物、材料、日用品、香菸、醫療、武器……）。你的工作是用低價收貨，再組合出剛好落在預算上下的商品組合賣給對的人。'
    },
    {
      title: '操作步驟',
      steps: [
        '第一天把拾荒者的<b>食物全收</b>（蘇打、巧克力棒、果泥，實例共 95）。前期食物是最有價值的庫存。',
        '客人進門先看預算與類別，挑商品讓總價<b>剛好等於或略低於預算</b>。',
        '同一位客人<b>不收重複品</b>，但「不同品項」會付更多：例如預算 85 的客人買了合成肉＋巧克力棒＋果泥＝84。',
        '收貨時<b>整批買</b>可以拿批發折扣：廢料商 30～40%、拾荒者約 15%。',
        '看日曆：「增產」時進貨、「短缺」時出貨。例：第 6 天供水危機＋日用品救濟活動，食物價格上漲。'
      ]
    },
    {
      title: '各類客人與商品',
      table: {
        head: ['類別', '代表商品', '買家／備註'],
        rows: [
          ['食物', '合成肉、巧克力棒、果泥、果汁、蘇打', '最好賣，外地客（Offworlder）預算 62 實例：果汁16＋果泥45＋蘇打'],
          ['材料', '廢金屬、電子零件、線材、槍械零件、助焊劑', '修理工；只有帶「材料」標籤的才算。5 種不同材料賣更高'],
          ['日用品', '衛生紙、牙膏、洗衣精、淨水錠', '沒有對應類別時只能請客人離開'],
          ['香菸', '海明威香菸', '上層區客人出價高；真假見「鑑定流」'],
          ['醫療', '藥品、繃帶、針劑', '醫療燈牌 200 吸引醫療供應商']
        ]
      }
    },
    {
      title: '客群差異',
      list: [
        '<b>上層區</b>客人願意付溢價，但會自備檢測工具，騙不了。',
        '<b>下層區</b>客人買量大、預算低；給折扣能換商人好感，抵回損失。',
        '殺價按鈕在交易視窗關閉鈕旁，殺太兇會讓交易破局、影響聲望。'
      ]
    },
    {
      title: '數字參考',
      list: ['某玩家第 1 天結束餘額 596，第 4 天 777。', '自動販賣機（房東選項）晚上自動賣貨，但每週房租 +150。']
    }
  ],
  tips: [
    '展示櫃擺高價菸酒，可以拉高客人預算上限。',
    '掛對應類別的霓虹燈，客人來源更穩定。',
    '冷卻／結凍（冰箱）的商品有些客人願意多付。'
  ],
  pitfalls: [
    '一次大量囤貨會卡死倉位和房租錢。',
    '下層區交易別用現金硬撐，有玩家建議避免。',
    '扣掉實際進價才算利潤，別只看賣價。'
  ],
  sources: [
    { title: 'OutputLag：How to Make Money and Start From $0', url: 'https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/' },
    { title: 'GamerBlurb：How to Make Money', url: 'https://gamerblurb.com/guides/probably-stolen-how-to-make-money' },
    { title: 'Stage1st 討論串', url: 'https://stage1st.com/2b/thread-2288723-1-1.html' },
    { title: '3DM 遊戲資料頁', url: 'https://www.3dmgame.com/games/probablystolen/' }
  ],
  updated: '2026-11-03'
});
