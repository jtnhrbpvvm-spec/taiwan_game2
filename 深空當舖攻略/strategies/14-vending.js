window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'vending',
  order: 14,
  icon: '🥤',
  name: '販賣機流（夜間被動收入）',
  group: '買賣',
  tagline: '睡覺時自動賣貨：便宜食物飲料賣最快，吸引力升滿後連高價品都能賣。（英語攻略整理）',
  stats: { capital: 4, difficulty: 2, risk: 1, speed: 3 },
  unlock: '開局特性 2 點／王爾德人脈網 1200 favor／房東免費安裝但每週房租 +150',
  tags: ['被動收入', '夜間銷售', '販賣機', '賣水機', '吸引力'],
  sections: [
    {
      title: '取得方式',
      table: {
        head: ['途徑', '代價', '說明'],
        rows: [
          ['開局特性', '2 點', '英文攻略作者最推薦，省得之後花錢'],
          ['王爾德人脈網（Store 分頁）', '1200 favor', '另有一說 200 credits，以遊戲內為準'],
          ['房東提案', '免費安裝，每週房租 +150', '有玩家第 40 天後才收到；新手建議先拒絕，確認收益穩定高於 150/週再接']
        ]
      }
    },
    {
      title: '運作規則',
      list: [
        '要接電池；基本耗電每晚 2，每個升級 +1，每加一排儲物 +1。',
        '售價固定為<b>基礎價 + 難度零售加成 + 10%</b>，不受事件價格影響。',
        '每晚判定每件商品有沒有賣出；錢存在機器裡，要按「Transfer All」才會進你的現金。',
        '同一商品重複放可能賣不掉，<b>品項要多樣</b>。',
        '不能賣：不是你的東西、錯標商品、違禁品、機器、容器、非法消耗品（會被罰款、扣聲望）。'
      ]
    },
    {
      title: '賣出機率',
      table: {
        head: ['商品', '吸引力 15（初始）', '吸引力 100（滿）'],
        rows: [['20 元食物', '每晚 20.5%', '每晚 136.4%（一晚可賣不只一件）'], ['300 元物品', '很低', '每晚約 10%']]
      },
      list: [
        '食物和水便宜又永遠有需求，有 1.5 倍係數。',
        '100 元以下的商品（和消耗品）係數較好；其他物品係數 0.5 降到 0.165。'
      ]
    },
    {
      title: '升級',
      list: [
        '<b>吸引力</b>：電子零件裝進核心，每個 +5，最多 17 級到 100；吸引力也會提高係數，<b>優先升</b>。',
        '<b>儲物</b>：熔爐把廢金屬變金屬錠，每個錠 +8 格，最多 10 排。之後放更大更貴的商品再升。'
      ]
    },
    {
      title: '賣水機（Vending Fountain）',
      list: ['王爾德人脈網 1200 favor，夜間自動賣水。', '玩家提醒：機器只賣標準價，如果櫃台客人已經會買光你的水，耗電可能不划算。']
    }
  ],
  tips: ['先放便宜的消耗品，有餘裕再放奢侈品。', '每天開店記得補貨、把錢轉出來。', '配合「電線盜接」免電費更划算。'],
  pitfalls: ['把整批庫存都塞進去，房租日沒錢。', '房東版販賣機每週多 150 房租，收益不夠就是虧。', '沒升吸引力就放高價品，好幾天都賣不掉。'],
  sources: [
    { title: '[EN] GamesHorizon：Complete Vending Machine Guide', url: 'https://gameshorizon.com/guides/probably-stolen-the-complete-vending-machine-guide/' },
    { title: '[EN] AllThings.How：How to Make Money Fast', url: 'https://allthings.how/probably-stolen-make-money/' },
    { title: '[EN] AllThings.How：Vending Machine', url: 'https://allthings.how/probably-stolen-vending-machine/' },
    { title: '[EN] T-Pose Gaming：Vending Machine Best Stock', url: 'https://tposegaming.com/probably-stolen-vending-machine/' },
    { title: '[EN] Steam 討論：Vending Machines', url: 'https://steamcommunity.com/app/4348910/discussions/0/573805072991275396/' }
  ],
  updated: '2026-11-03（英語攻略）'
});
