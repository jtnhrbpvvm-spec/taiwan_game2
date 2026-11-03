window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'appraisal',
  order: 11,
  icon: '🔍',
  name: '鑑定流（假貨、貼標、估價委員會）',
  group: '買賣',
  tagline: '用放大鏡抓瑕疵壓價收貨，貼真標轉賣給上層區；加入估價委員會賺鑑定費。',
  stats: { capital: 1, difficulty: 3, risk: 2, speed: 4 },
  unlock: '放大鏡開局可用；第 8 天可加入估價委員會（普通難度 85）',
  tags: ['假菸', '海明威', '貼標', '放大鏡', '估價', '鑑定費'],
  sections: [
    {
      title: '假菸套利（經典）',
      steps: [
        '用放大鏡檢查海明威香菸：顏色、字體／拼字、防偽封條。',
        '找到<b>一個確定的瑕疵</b>就能當面質疑賣家壓價（實例壓到 42）。',
        '等標籤印表機送到後，把假菸貼成真品。',
        '賣給上層區訪客：實例 42 收 → <b>115</b> 賣。'
      ],
      note: '劇情 NPC 喬治奧會在特定天數來要假菸（例：第 12 天要 2 包「超假」的），記得留。'
    },
    {
      title: '貼標風險',
      list: [
        '工人、保安、下層區居民通常認得常見手法；被抓扣陣營聲望。',
        '偵察員多半沒有檢測工具；觀光客和上層區買家比較不設防（但上層區買水會自己測）。',
        '錯誤指控會扣聲望，客人可能直接走掉。'
      ]
    },
    {
      title: '估價委員會（鑑定服務）',
      list: [
        '每個鑑定物品附一份印製指南，<b>起價和底價固定</b>。',
        '估價可在 -100～+100 間調整；服務費 = 基本費 + 準確度獎勵；每次鑑定累積認證。',
        '掛鑑定師燈牌可吸引付費客人。',
        '早期案件：義肢手；後期：電漿燃料匣（看標記、刮痕、磨損、損壞部位，不看顏色）。',
        '10 次完美鑑定解「鑑定眼」成就。'
      ]
    },
    {
      title: '估價表重點',
      table: {
        head: ['物品', '起價 / 底價', '加減分'],
        rows: [
          ['電漿燃料匣', '100 / 30', '裂痕 -50、露螺絲 -10、補強 +20；等級與廠牌搭配再調整'],
          ['包裝肋排堡', '150 / 40', '生產批次、包裝廠、豪華版等影響；缺或假的廠號／Davre 標誌＝假貨'],
          ['食物券', '面額 40～240', '晶片缺失或損壞＝作廢'],
          ['免疫注射劑', '—', '序號逐位比對有效範圍與召回批次'],
          ['仿生手', '100 / 50', '例：100 + 50 - 35 + 45 = 160；有成套加成'],
          ['成色通則', '—', '輕微磨損 -15、嚴重磨損 -30']
        ]
      }
    },
    {
      title: '🌐 英語玩家攻略補充：估價公會評分與收入',
      table: {
        head: ['誤差', '評等'],
        rows: [['≤ 5%', 'Perfect（完美）'], ['≤ 10%', 'Excellent'], ['≤ 15%', 'Good'], ['≤ 25%', 'Mediocre'], ['> 25%', 'Awful']]
      },
      list: [
        '服務費 20（初級）～ 100（大師）；完美評等多拿 15～25%。',
        '實例：第 14 天 4 次完美的義肢手估價賺 214。',
        '困難模式通關玩家認為鑑定認證是「很強的白賺錢來源」，<b>越早拿、越早升級越好</b>。'
      ]
    }
  ],
  tips: ['買到假貨沒關係，只要付的是假貨價。', '社群有自動鑑定 Mod 可以省時間。'],
  pitfalls: ['用真品價買到假貨是最大的虧。', '假食物券會被銷毀。', '沒有確定瑕疵就指控 = 白扣聲望。'],
  sources: [
    { title: '[EN] AllThings.How：How to Make Money Fast', url: 'https://allthings.how/probably-stolen-make-money/' },
    { title: '[EN] Steam 指南：From Nothing, The Hard Way', url: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3831133096' },
    { title: 'probablystolen.top：鑑定、成色、貼假標、估價', url: 'https://probablystolen.top/zh-TW/guides/appraisal-and-counterfeits/' },
    { title: 'OutputLag：Counterfeit cigarette arbitrage', url: 'https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/' },
    { title: 'ShowGamer：Authentication and Appraisal', url: 'https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry' },
    { title: 'Stage1st 討論串', url: 'https://stage1st.com/2b/thread-2288723-1-1.html' }
  ],
  updated: '2026-11-03（含英語攻略）'
});
