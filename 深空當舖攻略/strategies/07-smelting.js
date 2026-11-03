window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'smelting',
  order: 7,
  icon: '🔥',
  name: '冶金流（熔爐鑄錠＋電池充電）',
  group: '生產',
  tagline: '免費取得熔爐，把拾荒撿來的廢金屬變成金屬錠；順便做電池充電轉賣。',
  stats: { capital: 1, difficulty: 2, risk: 1, speed: 3 },
  unlock: '免費：傑克遜博士第 6 天送熔爐（之前可付 50 借用他的）',
  tags: ['熔爐', '金屬錠', '廢金屬', '礦石', '助焊劑', '能源電池', '停電'],
  sections: [
    {
      title: '配方',
      table: {
        head: ['投入', '結果'],
        rows: [
          ['2 廢金屬', '低純度錠（價值 -15%）'],
          ['1 廢金屬 + 1 礦石', '較好的錠'],
          ['2 礦石', '高純度錠（+25%）'],
          ['2 礦石 + 助焊劑', '+50%'],
          ['品質模組', '最高再 +200%']
        ]
      },
      note: '爆破模組（Blast Module）：3 份材料出 2 個錠，品質計算方式不同。'
    },
    {
      title: '操作',
      steps: [
        '熔爐接上能源電池（每晚耗電 8），放材料。',
        '一批一晚，隔天早上從出料口拿錠。',
        '礦石來源：王爾德引薦 GP 礦業合作社的考爾森（250）。',
        '廢金屬來源：垃圾場拾荒、廢料商。'
      ]
    },
    {
      title: '副業：能源電池充電',
      steps: ['買充電器＋可重複用的能源電池。', '低價收沒電的電池，充好電。', '等需求上升（尤其是<b>停電事件</b>）再賣。'],
      note: '先留足自己機器要用的電。'
    },
    {
      title: '🌐 英語玩家攻略補充：熔爐細節',
      list: [
        '熔爐售價 200，每天耗電 8。',
        '廢料處理模組：6 個廢品 → 4 個廢金屬。',
        '助焊劑讓純度升一階；品質 ≥ +100%（爆破模組 +200%）時助焊劑不會消耗。',
        '品質每 100% 純度升一階；性能沒影響；效率每 12.5% 省 1 電。使用爆破模組時第一個 +100% 品質被忽略。',
        '模組最佳化計算器（社群）：<a href="https://hoydoy.github.io/probably-stolen-module-optimization" target="_blank" rel="noopener">hoydoy.github.io</a>'
      ]
    },
    {
      title: '🌐 英語玩家攻略補充：電池套利',
      list: [
        '充電器 150：每天充 3 電（王爾德升級後 6）。PowerBloc 200：替相鄰電池充 2 電（升級後 4）。兩者都要先繳電費。',
        '低價收沒電的電池充好賣；停電事件時能源電池 <b>+50%</b>。',
        '「電線盜接」（300 favor）電費全免，做充電生意更賺。'
      ]
    }
  ],
  tips: ['成本最低的生產線，非常適合跟拾荒流搭配。', '開批前先算礦石價、電費和買家預算。'],
  pitfalls: ['2 廢金屬做出來的錠價值反而較低，最好混礦石。'],
  sources: [
    { title: '[EN] Steam 指南：Machinery and You', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3805839811' },
    { title: '[EN] Steam 指南：From Nothing, The Hard Way', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3831133096' },
    { title: 'Bonus Action：All Trades（熔煉加成）', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: 'ShowGamer：Metal Ingot Production / Energy Cell', url: 'https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry' },
    { title: 'OutputLag：Furnace smelting', url: 'https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/' }
  ],
  updated: '2026-11-03（含英語攻略）'
});
