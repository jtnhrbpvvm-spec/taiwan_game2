window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  "id": "bounty",
  "order": 12,
  "icon": "🚨",
  "name": "賞金流（通緝犯＋改造體）",
  "group": "買賣",
  "tagline": "先做生意再報警：舉報通緝犯拿賞金和保安聲望，確認改造體後再開槍。",
  "stats": {
    "capital": 1,
    "difficulty": 3,
    "risk": 3,
    "speed": 5
  },
  "unlock": "開局可用（櫃檯下的警報鈕）；改造體掃描器另購",
  "tags": [
    "通緝犯",
    "警報",
    "保安聲望",
    "改造體",
    "Aug",
    "開局快錢"
  ],
  "sections": [
    {
      "title": "通緝犯",
      "steps": [
        "把通緝名單放手邊，比對客人名字和特徵。",
        "<b>先照常交易</b>，再按櫃檯下的警報。",
        "正確舉報領賞金（金額見下表，例：Lou 1,500）；保安聲望上升。"
      ],
      "list": [
        "錯誤舉報會被罰款，只舉報確認的人。",
        "有些通緝犯有地下人脈，留著可能比賞金更值錢。"
      ]
    },
    {
      "title": "🌐 英語玩家攻略補充：通緝犯賞金表",
      "table": {
        "head": [
          "通緝犯",
          "賞金"
        ],
        "rows": [
          [
            "Lou（路）",
            "1,500"
          ],
          [
            "The Butcher（屠夫）",
            "450"
          ],
          [
            "Li Bei Wen",
            "400"
          ],
          [
            "James Bailey / Odin Haraldsson / Leroy",
            "各 300"
          ],
          [
            "Juan / John Smith",
            "各 125"
          ],
          [
            "Arthur Lafleur",
            "100"
          ]
        ]
      },
      "note": "開局特性「模範市民 Model Citizen」賞金 +50%，還會累積保安聲望；保安聲望 100 時可以不用再買保險。"
    },
    {
      "title": "🌐 英語玩家攻略補充：改造體獵人開局",
      "list": [
        "開局特性「改造體威脅 Aug Menace」：改造體從第一天就出現，每殺一隻有獎勵。",
        "困難模式玩家殺了 10 隻以上、只漏一兩隻、從沒誤殺平民，是開局主要收入。",
        "漏掉的話可以向傑克遜博士買改造體掃描器（200，每次 25 電）。"
      ]
    },
    {
      "title": "改造體基本規則",
      "list": [
        "改造體掃描器（博士，200）可以確認身分。",
        "沒把握不要開槍：誤殺普通客人懲罰很重。",
        "詳細識別線索見<a href=\"demo.html#bounty\">試玩版 → 賞金流</a>。"
      ]
    }
  ],
  "tips": [
    "保安聲望是軍火流許可證的門檻，賞金流可以順便鋪路。"
  ],
  "pitfalls": [
    "看到一個怪行為就開槍／報警。",
    "舉報賣贓物的人會降低上層區聲望（英語玩家經驗）。"
  ],
  "sources": [
    {
      "title": "[EN] AllThings.How：How to Make Money Fast",
      "url": "https://allthings.how/probably-stolen-make-money/"
    },
    {
      "title": "[EN] Steam 指南：From Nothing, The Hard Way",
      "url": "https://steamcommunity.com/sharedfiles/filedetails/?id=3831133096"
    },
    {
      "title": "OutputLag：Wanted-suspect bounties",
      "url": "https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/"
    }
  ],
  "updated": "2026-11-03"
});
