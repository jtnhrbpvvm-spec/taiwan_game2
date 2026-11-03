window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'water',
  order: 2,
  icon: '💧',
  name: '賣水流（淨水分級）',
  group: '生產',
  tagline: '社群公認最穩定的主力財源：把髒水淨化升級，按純度高價賣出。',
  stats: { capital: 2, difficulty: 3, risk: 1, speed: 4 },
  unlock: '水商開局，或向王爾德買「水交易」300',
  tags: ['穩定', '主力', '水分收集器', '淨水器', '濾芯', '缺水危機', '鏽水'],
  sections: [
    {
      title: '水的等級與每公升價格',
      table: {
        head: ['等級', '純度', '參考售價 / L'],
        rows: [
          ['純水 Pure', '≥ 99.9%', '200'],
          ['優質水 High-Quality', '99% ～ 99.9%', '100'],
          ['基礎水 Basewater', '98% ～ 99%', '40'],
          ['幽靈水 Ghostwater', '96% ～ 98%', '27'],
          ['鏽水 Rustwater', '90% ～ 96%', '20'],
          ['溝渠水 Gutterflow', '< 90%', '10']
        ]
      },
      note: '幽靈水看起來跟基礎水一樣，一定要用試紙或水質分析儀（AquaScan，可重複測不耗試紙）確認。'
    },
    {
      title: '淨化流程（依原料等級）',
      table: {
        head: ['原料', '處理方式'],
        rows: [
          ['基礎水 → 優質水', '水壺裝上濾芯，倒過去，再測一次'],
          ['幽靈水', '淨水錠或紫外燈（淨水錠清不乾淨所有雜質）'],
          ['鏽水 / 溝渠水', '紫外燈殺微生物 → 海德拉科技（HydraTech）微型淨水器變基礎水 → 水壺＋濾芯 → 約 99.18% 優質水'],
          ['大量 / 純水', '通電的淨水器跑一夜；對純度 &lt; 50% 的水效果最好']
        ]
      },
      note: '海德拉淨水器耐久消耗資料不一致：一說每 2000ml 耗 20，一說每壺約耗 400 耐久中的 60。以遊戲內為準。'
    },
    {
      title: '水源',
      list: [
        '<b>收購</b>：掛水燈牌讓人來賣水，先測再殺價。',
        '<b>水分收集器（Moisture Farm）</b>：傑克遜博士販售，1.0.0.2 版降價 650 → <b>350</b>。基本款每天約 850～1,000ml 幽靈水，裝模組可提升品質／產量。',
        '<b>鏽水水龍頭 350 / 溝渠水水龍頭 250</b>（王爾德人脈）：免費無限髒水，但要自己淨化。',
        '社群 Mod「水塔」：自動收集 600L，仍需手動淨化。'
      ]
    },
    {
      title: '新手路線：先做優質水',
      steps: [
        '向王德爾接鏽水（或開鏽水水龍頭）。',
        '紫外燈照射 → 海德拉微型淨水器 → 基礎水。',
        '水壺＋濾芯二次過濾 → 約 99.18% 優質水，每公升 100。',
        '裝瓶（瓶子印表機）賣給水類買家。'
      ],
      note: '不需高階材料或受限模組，前期優質水的性價比比純水高。'
    },
    {
      title: '中後期：量產純水',
      list: [
        '<b>方案 A：150% 品質水分收集器</b>（量產首選）。搭配高級神經核心模組（受限）＋高級渦輪增壓器。',
        '<b>方案 B：100% 品質淨水器</b>。不用受限模組，但淨化週期長，要連續幾天。',
        '有玩家擺 6～7 台收集器＋印表機就忙不過來。',
        '高級神經核心模組：地下交易所 2 個普通模組換 1 個（約 20 天刷新），或工程箱隨機開出。'
      ]
    },
    {
      title: '濾芯取得',
      list: [
        '普通濾芯：日用品販子、工程箱／服務箱，或地下交易所用 <b>3 個 0 耐久濾芯翻新</b>。',
        '高級濾芯：博士商店機率刷新、高階寶箱。',
        '掛暗燈＋日用品回收燈吸引小偷扒手，互動有機率掉濾芯。',
        '1.0.0.2 版濾芯降價 50 → 25。'
      ]
    },
    {
      title: '擺攤技巧',
      list: [
        '展示櫃放 3 個 6000ml 大水瓶的優質水（或純水），讓今日價格進前三，吸引上層區囤水商。',
        '賣水時加冰塊，傳聞隔天客人預算更高。',
        '缺水危機時價格暴漲：平時先囤乾淨的水和容器。',
        '瓶子印表機升級：消耗 6 / 12 個電子零件。'
      ]
    },
    {
      title: '灰色玩法（有風險）',
      list: [
        '把低等水貼「純水」標籤：上層區客人會自己檢測，騙不到。',
        '把幽靈水當基礎水賣，累計約 <b>2.5L</b> 後會被控「危害罪」。',
        '用老鼠糞便調整污染物比例再淨化（Stage1st 玩家方法），太繁瑣，多數人認為不如直接升級收集器。'
      ]
    }
  ],
  tips: [
    '多桶水倒進大容器一起測，省試紙。',
    '報廢濾芯不要丟，3 個能翻新 1 個。',
    '神經核心模組刷新慢，提早囤普通模組。',
    '釀酒要用基礎水或優質水，純水不能發酵 —— 賣水流可以順便供水給釀酒流。'
  ],
  pitfalls: [
    '沒測就用基礎水價格收到幽靈水。',
    '濾芯耗損很快，鏽水／溝渠水直接用水壺濾會大量消耗濾芯。',
    '2026 年改版重做過淨水器，舊攻略的淨水錠流程可能不適用。'
  ],
  sources: [
    { title: '18183：新手卖水玩法详解', url: 'https://m.18183.com/gonglue/202608/0ct1j7a5.html' },
    { title: 'GamerBlurb：How to Make Money（水等級表）', url: 'https://gamerblurb.com/guides/probably-stolen-how-to-make-money' },
    { title: 'Bonus Action：All Trades（每公升價格）', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: 'GamerBlurb：Water Purification Guide', url: 'https://gamerblurb.com/guides/probably-stolen-water-purification-guide-how-to-get-pure-water' },
    { title: 'Destructoid：How to do water trading', url: 'https://www.destructoid.com/how-to-do-water-trading-in-probably-stolen/' },
    { title: 'Stage1st 討論串', url: 'https://stage1st.com/2b/thread-2288723-1-1.html' }
  ],
  updated: '2026-11-03'
});
