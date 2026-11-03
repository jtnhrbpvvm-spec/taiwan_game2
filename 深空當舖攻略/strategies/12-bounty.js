window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'bounty',
  order: 12,
  icon: '🚨',
  name: '賞金流（通緝犯＋改造體）',
  group: '買賣',
  tagline: '先做生意再報警：舉報通緝犯拿賞金和保安聲望，確認改造體後再開槍。',
  stats: { capital: 1, difficulty: 3, risk: 3, speed: 5 },
  unlock: '開局可用（櫃檯下的警報鈕）；改造體掃描器另購',
  tags: ['通緝犯', '警報', '保安聲望', '改造體', 'Aug', '開局快錢'],
  sections: [
    {
      title: '通緝犯',
      steps: [
        '把通緝名單放手邊，比對客人名字和特徵。',
        '<b>先照常交易</b>，再按櫃檯下的警報。',
        '正確舉報：實例 <b>100</b>（試玩版約 300），名單上的路（Lu）懸賞 <b>1,500</b>；保安聲望上升。'
      ],
      list: [
        '一貧如洗開局時，舉報通緝犯是最快的早期收入（實例第 2 天 300）。',
        '錯誤舉報會被罰款，只舉報確認的人。',
        '舉報會降低下層區聲望。',
        '有些通緝犯有地下人脈，留著可能比賞金更值錢。',
        '困難開局特性「犯罪紀錄」：賞金 -20%；「知名線人」：通緝犯不上門。'
      ]
    },
    {
      title: '改造體（Aug）',
      list: [
        '改造體掃描器可以 100% 確認；其他線索：異常靜止、抽搐、穿著不符陣營、機械式／過度正式的說話、看得見植入晶片。',
        '可以<b>先賣貨殺價，再開槍</b>（玩家稱「賺兩次」）。',
        '<b>不要通知保安</b>：改造體會駭入通訊逃跑。',
        '不要用「威脅（改造體）」殺價選項：對真人一定失敗並扣聲望。',
        '放走的改造體會在夜間紀錄留言；改造體數量到臨界值會 Game Over。',
        '049 版移除了改造體相關的聲望懲罰。'
      ],
      note: '沒把握不要開槍：誤殺普通客人懲罰很重，可能直接結束。'
    }
  ],
  tips: ['保安聲望是軍火流許可證的門檻，賞金流可以順便鋪路。'],
  pitfalls: ['看到一個怪行為就開槍／報警。'],
  sources: [
    { title: 'probablystolen.top：改造體識別', url: 'https://probablystolen.top/zh-TW/guides/augs-and-detection/' },
    { title: 'probablystolen.top：困難模式與一貧如洗', url: 'https://probablystolen.top/zh-TW/guides/hard-mode-and-rock-bottom/' },
    { title: 'OutputLag：Wanted-suspect bounties', url: 'https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/' },
    { title: 'Stage1st 討論串', url: 'https://stage1st.com/2b/thread-2288723-1-1.html' }
  ],
  updated: '2026-11-03'
});
