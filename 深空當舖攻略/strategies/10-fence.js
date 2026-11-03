window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'fence',
  order: 10,
  icon: '🕶️',
  name: '銷贓流（贓物與違禁品）',
  group: '黑色',
  tagline: '「可能是偷的」本色：低價收贓轉手，加價 35～100%，但會被保安盯上。',
  stats: { capital: 2, difficulty: 3, risk: 5, speed: 5 },
  unlock: '銷贓客開局（+30 黑市、-30 保安、房租 +50）；其他開局向傑克遜博士買走私艙',
  tags: ['贓物', '違禁品', '暗燈', '走私艙', '地下交易所', '黑市聲望'],
  sections: [
    {
      title: '加價幅度',
      table: { head: ['違禁品等級', '加價'], rows: [['低', '35%'], ['中', '70%'], ['高', '100%']] }
    },
    {
      title: '操作',
      list: [
        '掛<b>暗燈</b>吸引小偷來賣贓物。贓物「熱度」越高收購價越低，但被保安查到的風險越高。',
        '<b>走私艙（Smuggler\'s Bays）</b>永遠不會被搜查，違禁品放這裡。',
        '保安檢查只在你有販運犯罪紀錄後才開始，所以<b>前幾筆最安全</b>。',
        '第 25 天透過索耶幫（Sawyer\'s Crew）開啟<b>地下交易所</b>：用物品夜間換物品，可換到設備、高級模組、翻新濾芯。',
        '被抓時：小偷來的違禁品第一次通常只是警告；可以留一筆錢準備賄賂。',
        '保險推銷員提供每日保險，被搶時有賠償。'
      ]
    },
    {
      title: '🌐 英語玩家攻略補充：保安檢查與罰則',
      table: {
        head: ['被查到的違法物品總值', '結果'],
        rows: [['≤ 299', '罰款（付不出就逮捕）'], ['300 ～ 1,499', '逮捕'], ['≥ 1,500', '<b>處決（遊戲結束）</b>']]
      },
      list: [
        '罰款＝被找到的違法物品總值。',
        '賄賂金額 = 100 + 2 × 天數 − 2 × 保安聲望，限制在 40～400。',
        '<b>藏起來或上鎖的物品不會被搜</b>。',
        '違禁加成：低 +35%、中 +70%、高 +100%、<b>極高 +150%</b>。',
        '小偷贓物有「熱度」，熱度越高折扣越大（10～25%），每晚下降；熱度降下來之前先藏好（詳見倒賣流）。',
        '調查進度、案值機制詳見化學流。'
      ]
    },
    {
      title: '🌐 英語玩家攻略補充：不碰贓物的代價',
      list: [
        '一位困難模式玩家完全不賣贓物，第 112 天通關。',
        '但他舉報賣贓物的人，結果上層區聲望下降、店被反覆破壞。',
        '有留言建議靠黑市和革命軍聲望，在違禁品上彌補薄利難度少掉的加成。'
      ]
    }
  ],
  tips: ['走私艙是必買；違禁品不放裡面等於送給保安。', '小偷扒手互動有機率掉濾芯（賣水流也會用到）。'],
  pitfalls: ['被保安檢查時違禁品被沒收，錢和貨都沒了。', '合成酵母釀的酒、某些化學品也算違禁品。', '完全不碰可拿「清廉潔白」成就。'],
  sources: [
    { title: '[EN] AllThings.How：How to Make Money Fast', url: 'https://allthings.how/probably-stolen-make-money/' },
    { title: '[EN] Steam 指南：The Complete Chemist Guide（lpinch）', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3830313918' },
    { title: '[EN] Steam 指南：From Nothing, The Hard Way', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3831133096' },
    { title: 'Bonus Action：All Trades（Fencing）', url: 'https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/' },
    { title: 'Stage1st 討論串（暗燈、熱度）', url: 'https://stage1st.com/2b/thread-2288723-1-1.html' },
    { title: 'OutputLag：Contraband and insurance', url: 'https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/' }
  ],
  updated: '2026-11-03（含英語攻略）'
});
