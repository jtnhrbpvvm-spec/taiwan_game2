window.PS_STRATEGIES = window.PS_STRATEGIES || [];
window.PS_STRATEGIES.push({
  "id": "wine",
  "order": 3,
  "icon": "🍷",
  "name": "釀酒流（布倫莓酒＋陳化）",
  "group": "生產",
  "tagline": "最便宜的生產線之一：200 解鎖，酒放越久越值錢，適合囤貨。",
  "stats": {
    "capital": 2,
    "difficulty": 2,
    "risk": 1,
    "speed": 2
  },
  "unlock": "向王爾德買「退休釀酒師」200（之後釀酒師每週來賣材料）",
  "tags": [
    "陳化",
    "升值",
    "布倫莓",
    "酵母",
    "囤貨",
    "上層區"
  ],
  "sections": [
    {
      "title": "入門組內容",
      "p": "三頁的《布倫莓酒發酵指南》、3 個酒瓶、酵母、布倫莓。隔天退休釀酒師會上門，之後每週來賣材料。"
    },
    {
      "title": "配方",
      "table": {
        "head": [
          "材料",
          "用量",
          "注意"
        ],
        "rows": [
          [
            "酒瓶",
            "1",
            ""
          ],
          [
            "水",
            "750ml",
            "用<b>基礎水或優質水</b>。純水缺礦物質不能發酵；幽靈水以下會降品質；優質水／純水不會額外加分"
          ],
          [
            "布倫莓",
            "1～2 把",
            "高等級酒需要 2 把；避開過熟、未熟、發霉的，好的通常比較小（用放大鏡挑）"
          ],
          [
            "酵母",
            "可省略（強烈建議放）",
            "見下表"
          ]
        ]
      }
    },
    {
      "title": "發酵時間",
      "table": {
        "head": [
          "酵母",
          "時間"
        ],
        "rows": [
          [
            "不放",
            "4 天"
          ],
          [
            "標準酵母／酵母生物反應器",
            "2 天"
          ],
          [
            "超級酵母",
            "1 天"
          ],
          [
            "合成酵母",
            "做出廉價酒，<b>屬違禁品、不會陳化</b>、微致癌"
          ]
        ]
      },
      "note": "時間來自玩家影片，不同版本可能有差。"
    },
    {
      "title": "陳化與售價",
      "list": [
        "成品酒放著<b>每晚增值約 3</b>（實例：剛做好約 100，兩天後約 106）。",
        "陳化機（AgeWell）每個週期 +1 天陳化，可用於酒和起司；只收成品酒，不能縮短發酵。渦輪增壓器可強制多跑一輪。",
        "等級由「難以下嚥」到最高「瓊漿玉液」；<b>Aged Reserve / Master Vintage</b> 等級賣價高 50～75%。",
        "高價酒可能超出一般客人預算，要找上層區買家。"
      ]
    },
    {
      "title": "建議流程",
      "steps": [
        "解鎖退休釀酒師，用入門組先做一批。",
        "用放大鏡挑莓果，每瓶放 2 把好莓＋標準酵母。",
        "水從賣水流來：基礎水或優質水。",
        "不急著賣，放著陳化，等上層區客人或預算高的客人。",
        "想自產莓果：搭配水耕流（1 顆布倫莓種子 → 6 顆，每顆基礎價值 14）。"
      ]
    },
    {
      "title": "想看品質計分公式？",
      "p": "社群實測的完整計分公式（莓果、酵母、水各加幾分）來自試玩版時期的 Discord 整理，放在<a href=\"demo.html#wine\">試玩版 → 釀酒流</a>。"
    }
  ],
  "tips": [
    "展示櫃擺高價酒可拉高客人預算上限。",
    "酒是「時間換錢」，資金充足時才大量囤。"
  ],
  "pitfalls": [
    "用純水釀 → 發酵失敗。",
    "用合成酵母 → 違禁品、不會增值。",
    "陳化機不吃還在發酵的瓶子。"
  ],
  "sources": [
    {
      "title": "ShowGamer：Winemaking 配方表",
      "url": "https://showgamer.com/en/prohozhdeniya-igr/6896-prohozhdenie-probably-stolen-vse-gaydy-i-glavy-igry"
    },
    {
      "title": "Bonus Action：All Trades（每晚 +3、50～75%）",
      "url": "https://bonus-action.com/guides/all-trades-how-to-unlock-them-in-probably-stolen/"
    },
    {
      "title": "AllThings.How：How to make wine",
      "url": "https://allthings.how/probably-stolen-how-to-make-wine/"
    }
  ],
  "updated": "2026-11-03"
});
