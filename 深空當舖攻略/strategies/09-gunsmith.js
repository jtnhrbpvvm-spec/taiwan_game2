window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'gunsmith',
  order: 9,
  icon: '🔫',
  name: '軍火流（3D 列印槍械）',
  group: '生產',
  tagline: '後期產業：需要保安聲望和許可證，「給我最好的」訂單付市價 +50%。',
  stats: { capital: 4, difficulty: 4, risk: 3, speed: 3 },
  unlock: '槍匠開局（附一級許可證），或向王爾德買「退休槍匠」650＋許可證',
  tags: ['許可證', '3D 列印', '保安聲望', '武器短缺', '後期'],
  sections: [
    {
      title: '許可證',
      table: {
        head: ['等級', '價格', '保安聲望門檻'],
        rows: [['一級', '300', '20'], ['二級', '600', '50'], ['三級', '900', '80']]
      },
      note: '另一份攻略提到約 30 保安聲望時王爾德會提供槍械許可證，以實際遊戲為準。'
    },
    {
      title: '生產',
      list: [
        '3D 印表機＋對應晶片／配方＋3D 列印線材＋電力。',
        '產出：槍、零件、近戰武器。瞄具、補償器等配件可改裝。',
        '近戰批量模組：每次近戰列印多 1 把。',
        '線材可從材料買家／拾荒取得。'
      ]
    },
    {
      title: '賺錢重點',
      list: ['接「給我最好的」訂單：市價 +50%。', '看日曆的武器需求高峰事件。']
    }
  ],
  tips: ['先靠舉報通緝犯等方式累積保安聲望。'],
  pitfalls: ['武器佔倉位，保安檢查時可能惹麻煩。', '許可證等級不夠的武器不要囤。'],
  sources: [
    { title: 'Bonus Action：All Trades（許可證）', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: 'ShowGamer：Weapon Trading and Manufacturing', url: 'https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry' }
  ],
  updated: '2026-11-03'
});
