window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'machines',
  order: 15,
  icon: '⚙️',
  name: '機器與模組資料表',
  group: '基礎',
  tagline: '所有生產流派都會用到的機器價格、耗電與模組效果。（英語 Steam 指南整理，部分為 1.0 前資料）',
  stats: { capital: 1, difficulty: 2, risk: 1, speed: 3 },
  unlock: '多數向傑克遜博士購買',
  tags: ['機器', '模組', '耗電', '冰箱', '熔爐', '淨水器', '陳化機'],
  sections: [
    {
      title: '機器一覽',
      table: {
        head: ['機器', '價格', '耗電', '作用'],
        rows: [
          ['熔爐 Furnace', '200', '8 / 天', '廢金屬、礦石 → 金屬錠（見冶金流）'],
          ['水分收集器 Moisture Farm', '225（舊）→ 650 → 350', '4～6 / 天', '每天 850～1000ml 幽靈水，需放容器'],
          ['淨水器 Water Purifier', '300（博士 375、退休商人 345）', '—', '過夜把污染物轉成水'],
          ['海市蜃樓投影機 Mirage Projector', '400', '16 / 天', '隔天店面吸引力 +100%'],
          ['警報系統 Alarm System', '150', '4 / 天', '可抵銷一晚的竊盜；性能 +50% 全擋'],
          ['密碼解序器 Cryptographic Desequencer', '350', '10 / 天', '晶片組＋鑰匙卡，換一次性卡'],
          ['陳化機 AgeWell', '350', '24 / 天', '每晚多陳化 1 天（酒、起司）'],
          ['瓶子印表機 Bottle Printer', '100', '每次 4 / 6 / 11', '450ml / 750ml（3 電子零件）/ 2L（再 6 個）'],
          ['冰箱 Fridge', '100', '2 / 天起', '[冰鎮] +20%、[冷凍]/[冰涼] +25%（酒和水容器不能放）'],
          ['清潔機器人 Cleaner Robot', '250', '4 / 次（焚化 8）', '收集動物糞便；1 電子零件升級焚化模式'],
          ['改造體掃描器 Aug Scanner', '200', '25 / 次', '雙擊客人確認是否改造體'],
          ['充電器 Recharger', '150', '—', '每天充 3 電（升級 6），需繳電費'],
          ['PowerBloc', '200', '—', '替相鄰電池與機器內電池充 2 電（升級 4）'],
          ['進階渦輪增壓器', '300', '5 / 天', '集滿 15 點可讓任一台機器多跑一次']
        ]
      },
      note: '價格與耗電來自 Steam 指南「Machinery and You」，標題註明缺 1.0 資料，水分收集器等已改版，以遊戲內為準。'
    },
    {
      title: '模組三屬性',
      list: [
        '<b>品質 Quality</b>：提高產物品質（熔爐每 100% 升一階純度；淨水器 100% 可做純水；陳化機每 125% 多陳化 1 天）。',
        '<b>性能 Performance</b>：產量 / 速度（收集器每 1% 多 10ml；警報每 1% 多 1% 防盜）。',
        '<b>效率 Efficiency</b>：省電（各機器門檻不同，例：熔爐每 12.5% 省 1 電）。',
        '模組最佳化計算器：<a href="https://hoydoy.github.io/probably-stolen-module-optimization" target="_blank" rel="noopener">hoydoy.github.io/probably-stolen-module-optimization</a>'
      ]
    },
    {
      title: '冰箱升級',
      list: ['冰鎮區 5×2、冷凍區 3×2。', '每個廢金屬（最多 7）+8 格、+3 耗電；每個電子零件（最多 7）-2 耗電，最低 2。', '東西放在外面過夜會失去冰鎮標籤。']
    },
    {
      title: '淨水器品質門檻',
      table: {
        head: ['品質', '無法轉換的最低污染濃度'],
        rows: [['50%', '÷ 3'], ['75%', '÷ 5（先過濾水壺可做純水）'], ['100%', '÷ 12.5（基礎水可做純水）'], ['200%', '0%']]
      }
    },
    {
      title: '電力',
      list: ['每晚有電費，王爾德「電線盜接」300 favor 後全免。', '還沒有需要電的機器前不用付電費（困難開局玩家建議）。']
    }
  ],
  tips: ['同時擁有 10 台機器開始一天可解成就「働き者」。', '先升真正卡住產量的那台。'],
  pitfalls: ['陳化機耗電 24 / 天很兇，沒有免費電力前要算清楚。'],
  sources: [
    { title: '[EN] Steam 指南：Machinery and You', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3805839811' },
    { title: '[EN] Steam 指南：Water Trading Made Easy', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3828856121' },
    { title: '[EN] AllThings.How：How to Make Money Fast', url: 'https://allthings.how/probably-stolen-make-money/' }
  ],
  updated: '2026-11-03（英語攻略）'
});
