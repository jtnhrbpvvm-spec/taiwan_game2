window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'rats',
  order: 4,
  icon: '🐀',
  name: '養鼠流（便宜蛋白質）',
  group: '生產',
  tagline: '跑起來後自給自足：把便宜食物換成高價鼠肉，不用持續向供應商花錢。',
  stats: { capital: 3, difficulty: 3, risk: 1, speed: 3 },
  unlock: '養鼠人開局，或向王爾德買「養殖」750（之後養鼠人每週上門）',
  tags: ['肉', '繁殖', '自給自足', '基因掃描', '自動屠宰'],
  sections: [
    {
      title: '產出與價格',
      table: {
        head: ['產物', '重量', '參考價'],
        rows: [
          ['生肉 Raw Meat', '400g', '159'],
          ['小塊生肉', '200g', '65'],
          ['肉塊 Morsel', '100g', '30'],
          ['小肉塊', '—', '15'],
          ['副產品', '動物下水、動物脂肪、合成乳酪、糞便', '—']
        ]
      },
      note: '一隻成鼠通常產 1 份生肉＋1 份小肉塊，約 <b>174</b>。生病的鼠肉量少 1/4。'
    },
    {
      title: '取得老鼠',
      list: [
        '捕鼠器：向傑克遜博士或拾荒者買，或在垃圾場撿到。店裡過夜也可能出現老鼠；乳酪能提高捕獲率。',
        '養鼠人開局直接有籠子、老鼠和飼料。'
      ]
    },
    {
      title: '飼養與繁殖',
      steps: [
        '把食物丟進投餵機，轉成「儲存熱量」。優先用<b>罐頭和牛奶</b>（便宜食物 → 高價肉）。',
        '看個體數值：懷孕、成熟、免疫力、生育力、預計產仔數、壽命、飢餓速率、公母。基因掃描器能看完整基因。',
        '<b>標記種鼠</b>，自動屠宰機才不會把牠們殺掉。',
        '用利器（玻璃刀、廚刀、切肉刀）取肉。',
        '清潔機器人的焚化爐可以燒掉累積的糞便。'
      ]
    },
    {
      title: '🌐 英語玩家攻略補充：補充',
      list: [
        '英文 Wiki 價格（舊版）：小塊生肉 60、肉塊 30、小肉塊 15。',
        '肉可以餵給其他老鼠，但玩家說回報很差。',
        '發霉莓果做出的「水桶釀」酒很適合拿來當老鼠飼料。',
        '老鼠糞便放進水瓶可得溝渠水，給陰暗莓酒或海德拉合成水用。',
        '開發者說養魚比養鼠步調慢、照顧少、更適合新手。'
      ]
    }
  ],
  tips: [
    '穩定後會有固定大單，是很好的被動收入。',
    '留足種鼠，別一次全宰。',
    '籠子壞了老鼠會跑掉，要記得修。'
  ],
  pitfalls: [
    '免疫力低的老鼠容易生病，肉量變少。',
    '糞便會一直累積，要定期清。',
    '活體是庫存不是收入，賣出前都在吃飼料。'
  ],
  sources: [
    { title: '[EN] Probably Stolen Wiki（社群）', url: 'https://probablystolenwiki.com/guides' },
    { title: '[EN] Steam 指南：Winemaking and You', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3805647354' },
    { title: 'probablystolen.top：老鼠攻略', url: 'https://probablystolen.top/zh-TW/guides/rat-husbandry/' },
    { title: 'Bonus Action：All Trades（鼠肉價格）', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: '巴哈姆特：酒、水、肉筆記', url: 'https://home.gamer.com.tw/artwork.php?sn=6407827' }
  ],
  updated: '2026-11-03（含英語攻略）'
});
