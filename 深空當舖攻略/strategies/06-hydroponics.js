window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'hydroponics',
  order: 6,
  icon: '🌱',
  name: '水耕流（種植＋植物基因）',
  group: '生產',
  tagline: '自產布倫莓供釀酒，或種營養果、咖啡、棉花等原料，是其他產業的上游。',
  stats: { capital: 3, difficulty: 3, risk: 1, speed: 2 },
  unlock: '水耕農開局，或向王爾德買「退休農夫」350；植物基因 1,250',
  tags: ['布倫莓', '營養果', '咖啡', '棉花', '基因', '上游原料'],
  sections: [
    {
      title: '作物',
      list: [
        '填充草、營養果（Nutrifruit）、咖啡、水蘆葦、<b>布倫莓</b>、夢菇（Dream Cap）、棉花（Kotton）。',
        '約 2～4 晚成熟；水耕系統每晚耗電 8。',
        '1 顆布倫莓種子 → 6 顆布倫莓，每顆基礎價值 14（6 顆共 84，這是商品價值不是利潤）。',
        '種出「巨大營養果」可解成就「綠手指」。'
      ]
    },
    {
      title: '操作',
      steps: ['安裝水耕系統。', '放種子、水、養分。', '等成熟收成。', '布倫莓留給釀酒，多的賣掉；棉花可做化學流的過濾布。']
    },
    {
      title: '植物基因（進階）',
      list: ['先買退休農夫，再買植物基因 1,250。', '產出編輯過的植物和特性磁碟。', '過濾模組可以只萃取好或壞的特性。', '每次編輯之間讓植物長熟。']
    }
  ],
  tips: ['農場模組提高產量，夢菇模組另外加產量。', '最適合當釀酒流的上游。'],
  pitfalls: ['佔空間、吃資源；建議在已有一條賺錢主業後再開。', '售價資料很少，賣前先看行情。'],
  sources: [
    { title: 'Bonus Action：All Trades', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: 'GamerBlurb：How to Make Money（布倫莓）', url: 'https://gamerblurb.com/guides/probably-stolen-how-to-make-money' },
    { title: '游民星空：新手入门攻略', url: 'https://www.gamersky.com/handbook/202610/2238297.shtml' }
  ],
  updated: '2026-11-03'
});
