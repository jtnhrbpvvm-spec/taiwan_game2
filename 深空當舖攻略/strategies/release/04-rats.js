window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  "id": "rats",
  "order": 4,
  "icon": "🐀",
  "name": "養鼠流（便宜蛋白質）",
  "group": "生產",
  "tagline": "跑起來後自給自足：把便宜食物換成高價鼠肉，不用持續向供應商花錢。",
  "stats": {
    "capital": 3,
    "difficulty": 3,
    "risk": 1,
    "speed": 3
  },
  "unlock": "養鼠人開局，或向王爾德買「養殖」750（之後養鼠人每週上門）",
  "tags": [
    "肉",
    "繁殖",
    "自給自足",
    "基因掃描",
    "自動屠宰"
  ],
  "sections": [
    {
      "title": "產出與價格",
      "table": {
        "head": [
          "產物",
          "重量",
          "參考價"
        ],
        "rows": [
          [
            "生肉 Raw Meat",
            "400g",
            "159"
          ],
          [
            "小塊生肉",
            "200g",
            "65"
          ],
          [
            "肉塊 Morsel",
            "100g",
            "30"
          ],
          [
            "小肉塊",
            "—",
            "15"
          ]
        ]
      },
      "note": "一隻成鼠通常產 1 份生肉＋1 份小肉塊，約 <b>174</b>。生病的鼠肉量少 1/4。"
    },
    {
      "title": "基本玩法",
      "steps": [
        "養鼠人開局或買「養殖」解鎖，取得籠子、老鼠、飼料。",
        "用食物餵養，族群穩定後繁殖。",
        "<b>標記種鼠</b>，自動屠宰機才不會殺牠們。",
        "多出來的成鼠宰殺取肉賣出。"
      ],
      "list": [
        "生病的老鼠肉量少 1/4。",
        "跑起來後自給自足，不需持續向供應商花錢。"
      ]
    }
  ],
  "tips": [
    "留足種鼠，別一次全宰。",
    "詳細飼養數值（熱量、基因掃描）見<a href=\"demo.html#rats\">試玩版 → 養鼠流</a>。"
  ],
  "pitfalls": [
    "活體是庫存不是收入，賣出前都在吃飼料。"
  ],
  "sources": [
    {
      "title": "[EN] Probably Stolen Wiki（社群）",
      "url": "https://probablystolenwiki.com/guides"
    },
    {
      "title": "Bonus Action：All Trades（鼠肉價格）",
      "url": "https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/"
    }
  ],
  "updated": "2026-11-03"
});
