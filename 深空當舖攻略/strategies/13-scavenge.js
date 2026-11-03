window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  id: 'scavenge',
  order: 13,
  icon: '🗑️',
  name: '拾荒流（零成本起家／一貧如洗開局）',
  group: '基礎',
  tagline: '晚上去垃圾場撿貨，零成本取得材料與商品；困難模式與一貧如洗的起手式。',
  stats: { capital: 1, difficulty: 2, risk: 2, speed: 3 },
  unlock: '開局可用',
  tags: ['垃圾場', '零成本', '困難模式', '一貧如洗', '開局'],
  sections: [
    {
      title: '拾荒規則',
      list: [
        '營業結束後去垃圾場，每趟最多搜 5 次。',
        '撿到：洗衣精、助焊劑、美工刀、繃帶、布、槍械零件、電子零件、廢金屬、藥品、工具，偶爾大獎（捕鼠器也撿得到）。',
        '<b>要手動把東西放進背包</b>，不然會遺失。',
        '可能受傷，帶繃帶。',
        '代價：隔天晚開門、少一位客人（店越忙代價越大）。'
      ]
    },
    {
      title: '一貧如洗 / 困難模式開局',
      steps: [
        '第 1 天沒庫存：先招呼最早來的客人，然後去拾荒。',
        '舉報通緝犯是最快的早期現金（見賞金流）。',
        '廢金屬拿去熔爐（第 6 天博士送）變金屬錠。',
        '把起手道具轉成收入：例如水商開局的鏽水 → 海德拉淨水器 → 水壺濾芯 → 優質水。',
        '盯著第 7 天房租；困難模式房租漲幅加倍、沒有寬限。'
      ]
    },
    {
      title: '困難開局特性（點數）',
      table: {
        head: ['特性', '點數', '效果'],
        rows: [
          ['高房租', '1', '起始房租提高'],
          ['後巷', '1', '每天少 1 位隨機客人'],
          ['犯罪紀錄', '1', '保安聲望降低、賞金 -20%'],
          ['知名線人', '2', '通緝犯不上門；革命軍與黑市聲望較低'],
          ['退化性關節炎', '—', '拾荒容量每週下降直到不能拾荒（開局多送繃帶）'],
          ['哨兵崩潰症候群', '—', '每週要打針，唯一會直接結束遊戲的特性']
        ]
      }
    },
    {
      title: '小技巧',
      list: ['把核廢料丟進垃圾袋，拾荒者隔天可能會拿回來賣你（Stage1st 玩家發現）。', '把重的庫存傾銷掉可以當開局現金。']
    }
  ],
  tips: ['拾荒流＋冶金流＋倒賣流是零資金起家的黃金組合。'],
  pitfalls: ['忘了把撿到的東西放進背包。', '後期店很忙時還每晚拾荒，少掉的客人比撿到的值錢。'],
  sources: [
    { title: 'probablystolen.top：困難模式與一貧如洗', url: 'https://probablystolen.top/zh-TW/guides/hard-mode-and-rock-bottom/' },
    { title: 'OutputLag：Dump scavenging', url: 'https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/' },
    { title: 'ShowGamer：Nighttime Scavenging', url: 'https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry' },
    { title: 'Stage1st 討論串', url: 'https://stage1st.com/2b/thread-2288723-1-1.html' }
  ],
  updated: '2026-11-03'
});
