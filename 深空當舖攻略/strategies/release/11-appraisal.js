window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  "id": "appraisal",
  "order": 11,
  "icon": "🔍",
  "name": "鑑定流（假貨、貼標、估價委員會）",
  "group": "買賣",
  "tagline": "用放大鏡抓瑕疵壓價收貨，貼真標轉賣給上層區；加入估價委員會賺鑑定費。",
  "stats": {
    "capital": 1,
    "difficulty": 3,
    "risk": 2,
    "speed": 4
  },
  "unlock": "放大鏡開局可用；第 8 天可加入估價委員會（普通難度 85）",
  "tags": [
    "假菸",
    "海明威",
    "貼標",
    "放大鏡",
    "估價",
    "鑑定費"
  ],
  "sections": [
    {
      "title": "假菸套利（經典）",
      "steps": [
        "用放大鏡檢查海明威香菸：顏色、字體／拼字、防偽封條。",
        "找到<b>一個確定的瑕疵</b>就能當面質疑賣家壓價（實例壓到 42）。",
        "等標籤印表機送到後，把假菸貼成真品。",
        "賣給上層區訪客：實例 42 收 → <b>115</b> 賣。"
      ]
    },
    {
      "title": "估價委員會（鑑定服務）",
      "list": [
        "第 8 天可加入（普通難度 85）。",
        "用放大鏡找出確定的瑕疵、參照估價指南給出估價，越準拿越多。",
        "鑑定錯誤會傷聲望。",
        "10 次完美鑑定解「鑑定眼」成就。"
      ]
    },
    {
      "title": "🌐 英語玩家攻略補充：估價公會評分與收入",
      "table": {
        "head": [
          "誤差",
          "評等"
        ],
        "rows": [
          [
            "≤ 5%",
            "Perfect（完美）"
          ],
          [
            "≤ 10%",
            "Excellent"
          ],
          [
            "≤ 15%",
            "Good"
          ],
          [
            "≤ 25%",
            "Mediocre"
          ],
          [
            "> 25%",
            "Awful"
          ]
        ]
      },
      "list": [
        "服務費 20（初級）～ 100（大師）；完美評等多拿 15～25%。",
        "實例：第 14 天 4 次完美的義肢手估價賺 214。",
        "困難模式通關玩家認為鑑定認證是「很強的白賺錢來源」，<b>越早拿、越早升級越好</b>。"
      ]
    },
    {
      "title": "想看估價表？",
      "p": "各物品的起價、底價、加減分表來自試玩版（Update 049），放在<a href=\"demo.html#appraisal\">試玩版 → 鑑定流</a>。"
    }
  ],
  "tips": [
    "買到假貨沒關係，只要付的是假貨價。"
  ],
  "pitfalls": [
    "用真品價買到假貨是最大的虧。",
    "沒有確定瑕疵就指控 = 白扣聲望。"
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
      "title": "OutputLag：Counterfeit cigarette arbitrage",
      "url": "https://outputlag.com/guides/probably-stolen-how-to-make-money-and-start-from-0-guide/"
    },
    {
      "title": "ShowGamer：Authentication and Appraisal",
      "url": "https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry"
    }
  ],
  "updated": "2026-11-03"
});
