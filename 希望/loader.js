// ==========================================================================
// 放置希望・一鍵強化 loader.js
// 透過書籤動態載入，找到遊戲本身正在執行的 session/data/snap，
// 直接呼叫遊戲真正的 session.enhance() / session.buy()，不自己猜機率或公式。
// 按鈕直接插在每件裝備「強化」按鈕（顯示金幣費用那顆）的前面。
// ==========================================================================
(function () {
  "use strict";

  var STYLE_ID = "iw-enhance-style";
  var CLOCKWORK_ID = 26731; // 實習生的發條（預設用的發條；2026-09-22 改版後可以在視窗裡改選其他發條）
  // 2026-09-22 改版：發條不只一種，每種能洗到的最高階級不同（實習生到 DG、高手／武爾坎努斯到 SG），
  // 可選的目標階級改成看「選到的發條」的 grades 表（options.json winders[].grades 的 [from,to,weight]）來決定。
  // 讀不到 winders 資料時（舊版遊戲）就退回原本的上限 DG。
  var FALLBACK_MAX_GRADE = 3;

  // 附魔屬性對照表（kind -> 名稱），來自 enchant.js
  var ENCHANT_KINDS = [{"kind": 1, "name": "攻擊力"}, {"kind": 2, "name": "魔法力"}, {"kind": 3, "name": "命中率"}, {"kind": 4, "name": "迴避率"}, {"kind": 5, "name": "防禦力"}, {"kind": 6, "name": "必殺技"}, {"kind": 7, "name": "攻擊速度"}, {"kind": 8, "name": "移動速度"}, {"kind": 9, "name": "HP"}, {"kind": 10, "name": "AP"}, {"kind": 11, "name": "HP%"}, {"kind": 12, "name": "AP%"}, {"kind": 13, "name": "增加傷害"}, {"kind": 14, "name": "減少傷害"}, {"kind": 15, "name": "每級力量"}, {"kind": 16, "name": "每級敏捷"}, {"kind": 17, "name": "每級智力"}, {"kind": 18, "name": "每級幸運"}, {"kind": 19, "name": "每級體力"}, {"kind": 20, "name": "每級精神"}, {"kind": 21, "name": "減少道具配戴限制等級"}, {"kind": 22, "name": "經驗值獲得量"}, {"kind": 23, "name": "[副本]增加傷害"}];
  var ENCHANT_KIND_NAME = {};
  ENCHANT_KINDS.forEach(function (k) { ENCHANT_KIND_NAME[k.kind] = k.name; });
  // 各階級每種屬性的「出現機率」表（跟數值機率表是分開的兩件事：這個是「有沒有洗到這個屬性」，
  // ENCHANT_VALUES 是「洗到了，數值落在哪個區間」），拿來在下拉選單旁邊標示參考用。
  var ENCHANT_APPEARANCE = {"1": [{"kind": 1, "weight": 6500}, {"kind": 2, "weight": 6500}, {"kind": 3, "weight": 11000}, {"kind": 4, "weight": 11000}, {"kind": 5, "weight": 11000}, {"kind": 6, "weight": 11000}, {"kind": 7, "weight": 11000}, {"kind": 8, "weight": 10000}, {"kind": 9, "weight": 6000}, {"kind": 10, "weight": 8000}, {"kind": 21, "weight": 8000}], "2": [{"kind": 1, "weight": 5250}, {"kind": 2, "weight": 5250}, {"kind": 3, "weight": 6750}, {"kind": 4, "weight": 6750}, {"kind": 5, "weight": 6750}, {"kind": 6, "weight": 6750}, {"kind": 7, "weight": 6750}, {"kind": 8, "weight": 6750}, {"kind": 9, "weight": 4000}, {"kind": 10, "weight": 6750}, {"kind": 11, "weight": 500}, {"kind": 12, "weight": 1250}, {"kind": 15, "weight": 4250}, {"kind": 16, "weight": 4250}, {"kind": 17, "weight": 4250}, {"kind": 18, "weight": 4250}, {"kind": 19, "weight": 3750}, {"kind": 20, "weight": 4000}, {"kind": 21, "weight": 5000}, {"kind": 22, "weight": 5000}, {"kind": 23, "weight": 1750}], "3": [{"kind": 1, "weight": 4500}, {"kind": 2, "weight": 4500}, {"kind": 3, "weight": 6500}, {"kind": 4, "weight": 6500}, {"kind": 5, "weight": 6500}, {"kind": 6, "weight": 6500}, {"kind": 7, "weight": 6500}, {"kind": 8, "weight": 6500}, {"kind": 9, "weight": 3250}, {"kind": 10, "weight": 6000}, {"kind": 11, "weight": 750}, {"kind": 12, "weight": 2000}, {"kind": 13, "weight": 100}, {"kind": 14, "weight": 100}, {"kind": 15, "weight": 4750}, {"kind": 16, "weight": 4750}, {"kind": 17, "weight": 4750}, {"kind": 18, "weight": 4750}, {"kind": 19, "weight": 3200}, {"kind": 20, "weight": 3400}, {"kind": 21, "weight": 6400}, {"kind": 22, "weight": 6000}, {"kind": 23, "weight": 1800}], "4": [{"kind": 1, "weight": 5000}, {"kind": 2, "weight": 5000}, {"kind": 3, "weight": 6250}, {"kind": 4, "weight": 6250}, {"kind": 5, "weight": 6250}, {"kind": 6, "weight": 6250}, {"kind": 7, "weight": 6250}, {"kind": 8, "weight": 6250}, {"kind": 9, "weight": 4250}, {"kind": 10, "weight": 5000}, {"kind": 11, "weight": 2500}, {"kind": 12, "weight": 3000}, {"kind": 13, "weight": 875}, {"kind": 14, "weight": 875}, {"kind": 15, "weight": 4250}, {"kind": 16, "weight": 4500}, {"kind": 17, "weight": 4250}, {"kind": 18, "weight": 4500}, {"kind": 19, "weight": 3500}, {"kind": 20, "weight": 4000}, {"kind": 21, "weight": 4500}, {"kind": 22, "weight": 4500}, {"kind": 23, "weight": 2000}], "5": [{"kind": 1, "weight": 5000}, {"kind": 2, "weight": 5000}, {"kind": 3, "weight": 6250}, {"kind": 4, "weight": 6250}, {"kind": 5, "weight": 6250}, {"kind": 6, "weight": 6250}, {"kind": 7, "weight": 6250}, {"kind": 8, "weight": 6250}, {"kind": 9, "weight": 4250}, {"kind": 10, "weight": 5000}, {"kind": 11, "weight": 2500}, {"kind": 12, "weight": 3000}, {"kind": 13, "weight": 1000}, {"kind": 14, "weight": 1000}, {"kind": 15, "weight": 4250}, {"kind": 16, "weight": 4500}, {"kind": 17, "weight": 4250}, {"kind": 18, "weight": 4250}, {"kind": 19, "weight": 3500}, {"kind": 20, "weight": 4000}, {"kind": 21, "weight": 4000}, {"kind": 22, "weight": 4000}, {"kind": 23, "weight": 3000}]};
  function appearancePctFor(grade, kind) {
    var list = ENCHANT_APPEARANCE[String(grade)];
    if (!list) return null;
    var total = list.reduce(function (s, a) { return s + a.weight; }, 0) || 1;
    var found = list.find(function (a) { return a.kind === kind; });
    return found ? (found.weight / total * 100) : null;
  }
  var ENCHANT_VALUES = {"1-1": [{"min": 10, "max": 25, "weight": 100000, "unit": 0}], "1-2": [{"min": 10, "max": 25, "weight": 100000, "unit": 0}], "1-3": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "1-4": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "1-5": [{"min": 10, "max": 25, "weight": 100000, "unit": 0}], "1-6": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "1-7": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "1-8": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "1-9": [{"min": 10, "max": 50, "weight": 100000, "unit": 0}], "1-10": [{"min": 10, "max": 50, "weight": 100000, "unit": 0}], "1-21": [{"min": 1, "max": 3, "weight": 100000, "unit": 0}], "2-1": [{"min": 25, "max": 35, "weight": 70000, "unit": 0}, {"min": 35, "max": 45, "weight": 30000, "unit": 0}], "2-2": [{"min": 25, "max": 35, "weight": 70000, "unit": 0}, {"min": 35, "max": 45, "weight": 30000, "unit": 0}], "2-3": [{"min": 1, "max": 10, "weight": 100000, "unit": 0}], "2-4": [{"min": 1, "max": 10, "weight": 100000, "unit": 0}], "2-5": [{"min": 25, "max": 35, "weight": 70000, "unit": 0}, {"min": 35, "max": 45, "weight": 30000, "unit": 0}], "2-6": [{"min": 1, "max": 10, "weight": 100000, "unit": 0}], "2-7": [{"min": 1, "max": 10, "weight": 100000, "unit": 0}], "2-8": [{"min": 1, "max": 10, "weight": 100000, "unit": 0}], "2-9": [{"min": 50, "max": 100, "weight": 70000, "unit": 0}, {"min": 100, "max": 200, "weight": 30000, "unit": 0}], "2-10": [{"min": 50, "max": 100, "weight": 70000, "unit": 0}, {"min": 100, "max": 200, "weight": 30000, "unit": 0}], "2-11": [{"min": 1, "max": 1, "weight": 100000, "unit": 0}], "2-12": [{"min": 1, "max": 1, "weight": 100000, "unit": 0}], "2-15": [{"min": 10, "max": 10, "weight": 65000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}], "2-16": [{"min": 10, "max": 10, "weight": 65000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}], "2-17": [{"min": 10, "max": 10, "weight": 65000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}], "2-18": [{"min": 10, "max": 10, "weight": 65000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}], "2-19": [{"min": 50, "max": 50, "weight": 30000, "unit": 1}, {"min": 48, "max": 48, "weight": 25000, "unit": 1}, {"min": 46, "max": 46, "weight": 15000, "unit": 1}, {"min": 44, "max": 44, "weight": 12500, "unit": 1}, {"min": 42, "max": 42, "weight": 10000, "unit": 1}, {"min": 40, "max": 40, "weight": 7500, "unit": 1}], "2-20": [{"min": 50, "max": 50, "weight": 30000, "unit": 1}, {"min": 48, "max": 48, "weight": 25000, "unit": 1}, {"min": 46, "max": 46, "weight": 15000, "unit": 1}, {"min": 44, "max": 44, "weight": 12500, "unit": 1}, {"min": 42, "max": 42, "weight": 10000, "unit": 1}, {"min": 40, "max": 40, "weight": 7500, "unit": 1}], "2-21": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "2-22": [{"min": 1, "max": 3, "weight": 100000, "unit": 0}], "2-23": [{"min": 1, "max": 1, "weight": 100000, "unit": 0}], "3-1": [{"min": 45, "max": 55, "weight": 60000, "unit": 0}, {"min": 55, "max": 65, "weight": 25000, "unit": 0}, {"min": 65, "max": 75, "weight": 15000, "unit": 0}], "3-2": [{"min": 45, "max": 55, "weight": 60000, "unit": 0}, {"min": 55, "max": 65, "weight": 25000, "unit": 0}, {"min": 65, "max": 75, "weight": 15000, "unit": 0}], "3-3": [{"min": 5, "max": 15, "weight": 100000, "unit": 0}], "3-4": [{"min": 5, "max": 15, "weight": 100000, "unit": 0}], "3-5": [{"min": 45, "max": 55, "weight": 60000, "unit": 0}, {"min": 55, "max": 65, "weight": 25000, "unit": 0}, {"min": 65, "max": 75, "weight": 15000, "unit": 0}], "3-6": [{"min": 5, "max": 15, "weight": 100000, "unit": 0}], "3-7": [{"min": 5, "max": 15, "weight": 100000, "unit": 0}], "3-8": [{"min": 5, "max": 15, "weight": 100000, "unit": 0}], "3-9": [{"min": 200, "max": 300, "weight": 60000, "unit": 0}, {"min": 300, "max": 400, "weight": 25000, "unit": 0}, {"min": 400, "max": 500, "weight": 15000, "unit": 0}], "3-10": [{"min": 200, "max": 300, "weight": 60000, "unit": 0}, {"min": 300, "max": 400, "weight": 25000, "unit": 0}, {"min": 400, "max": 500, "weight": 15000, "unit": 0}], "3-11": [{"min": 1, "max": 1, "weight": 80000, "unit": 0}, {"min": 2, "max": 2, "weight": 20000, "unit": 0}], "3-12": [{"min": 1, "max": 1, "weight": 80000, "unit": 0}, {"min": 2, "max": 2, "weight": 20000, "unit": 0}], "3-13": [{"min": 1, "max": 1, "weight": 100000, "unit": 0}], "3-14": [{"min": 1, "max": 1, "weight": 100000, "unit": 0}], "3-15": [{"min": 10, "max": 10, "weight": 55000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}, {"min": 4, "max": 4, "weight": 10000, "unit": 1}], "3-16": [{"min": 10, "max": 10, "weight": 55000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}, {"min": 4, "max": 4, "weight": 10000, "unit": 1}], "3-17": [{"min": 10, "max": 10, "weight": 55000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}, {"min": 4, "max": 4, "weight": 10000, "unit": 1}], "3-18": [{"min": 10, "max": 10, "weight": 55000, "unit": 1}, {"min": 8, "max": 8, "weight": 22500, "unit": 1}, {"min": 6, "max": 6, "weight": 12500, "unit": 1}, {"min": 4, "max": 4, "weight": 10000, "unit": 1}], "3-19": [{"min": 40, "max": 40, "weight": 45000, "unit": 1}, {"min": 38, "max": 38, "weight": 20000, "unit": 1}, {"min": 36, "max": 36, "weight": 12500, "unit": 1}, {"min": 34, "max": 34, "weight": 10000, "unit": 1}, {"min": 32, "max": 32, "weight": 7500, "unit": 1}, {"min": 30, "max": 30, "weight": 5000, "unit": 1}], "3-20": [{"min": 40, "max": 40, "weight": 45000, "unit": 1}, {"min": 38, "max": 38, "weight": 20000, "unit": 1}, {"min": 36, "max": 36, "weight": 12500, "unit": 1}, {"min": 34, "max": 34, "weight": 10000, "unit": 1}, {"min": 32, "max": 32, "weight": 7500, "unit": 1}, {"min": 30, "max": 30, "weight": 5000, "unit": 1}], "3-21": [{"min": 1, "max": 10, "weight": 100000, "unit": 0}], "3-22": [{"min": 1, "max": 5, "weight": 100000, "unit": 0}], "3-23": [{"min": 1, "max": 1, "weight": 100000, "unit": 0}], "4-1": [{"min": 75, "max": 90, "weight": 55500, "unit": 0}, {"min": 90, "max": 105, "weight": 32500, "unit": 0}, {"min": 105, "max": 120, "weight": 8500, "unit": 0}, {"min": 120, "max": 135, "weight": 3500, "unit": 0}], "4-2": [{"min": 75, "max": 90, "weight": 55500, "unit": 0}, {"min": 90, "max": 105, "weight": 32500, "unit": 0}, {"min": 105, "max": 120, "weight": 8500, "unit": 0}, {"min": 120, "max": 135, "weight": 3500, "unit": 0}], "4-3": [{"min": 10, "max": 20, "weight": 100000, "unit": 0}], "4-4": [{"min": 10, "max": 20, "weight": 100000, "unit": 0}], "4-5": [{"min": 75, "max": 90, "weight": 55500, "unit": 0}, {"min": 90, "max": 105, "weight": 32500, "unit": 0}, {"min": 105, "max": 120, "weight": 8500, "unit": 0}, {"min": 120, "max": 135, "weight": 3500, "unit": 0}], "4-6": [{"min": 10, "max": 20, "weight": 100000, "unit": 0}], "4-7": [{"min": 10, "max": 20, "weight": 100000, "unit": 0}], "4-8": [{"min": 10, "max": 20, "weight": 100000, "unit": 0}], "4-9": [{"min": 500, "max": 600, "weight": 55500, "unit": 0}, {"min": 600, "max": 700, "weight": 32500, "unit": 0}, {"min": 800, "max": 900, "weight": 8500, "unit": 0}, {"min": 900, "max": 1000, "weight": 3500, "unit": 0}], "4-10": [{"min": 500, "max": 600, "weight": 55500, "unit": 0}, {"min": 600, "max": 700, "weight": 32500, "unit": 0}, {"min": 800, "max": 900, "weight": 8500, "unit": 0}, {"min": 900, "max": 1000, "weight": 3500, "unit": 0}], "4-11": [{"min": 1, "max": 1, "weight": 72000, "unit": 0}, {"min": 2, "max": 2, "weight": 18000, "unit": 0}, {"min": 3, "max": 3, "weight": 10000, "unit": 0}], "4-12": [{"min": 1, "max": 1, "weight": 72000, "unit": 0}, {"min": 2, "max": 2, "weight": 18000, "unit": 0}, {"min": 3, "max": 3, "weight": 10000, "unit": 0}], "4-13": [{"min": 1, "max": 1, "weight": 80000, "unit": 0}, {"min": 2, "max": 2, "weight": 15000, "unit": 0}, {"min": 3, "max": 3, "weight": 5000, "unit": 0}], "4-14": [{"min": 1, "max": 1, "weight": 80000, "unit": 0}, {"min": 2, "max": 2, "weight": 15000, "unit": 0}, {"min": 3, "max": 3, "weight": 5000, "unit": 0}], "4-15": [{"min": 10, "max": 10, "weight": 50000, "unit": 2}, {"min": 8, "max": 8, "weight": 30000, "unit": 2}, {"min": 6, "max": 6, "weight": 15000, "unit": 2}, {"min": 4, "max": 4, "weight": 5000, "unit": 2}], "4-16": [{"min": 10, "max": 10, "weight": 50000, "unit": 2}, {"min": 8, "max": 8, "weight": 30000, "unit": 2}, {"min": 6, "max": 6, "weight": 15000, "unit": 2}, {"min": 4, "max": 4, "weight": 5000, "unit": 2}], "4-17": [{"min": 10, "max": 10, "weight": 50000, "unit": 2}, {"min": 8, "max": 8, "weight": 30000, "unit": 2}, {"min": 6, "max": 6, "weight": 15000, "unit": 2}, {"min": 4, "max": 4, "weight": 5000, "unit": 2}], "4-18": [{"min": 10, "max": 10, "weight": 50000, "unit": 2}, {"min": 8, "max": 8, "weight": 30000, "unit": 2}, {"min": 6, "max": 6, "weight": 15000, "unit": 2}, {"min": 4, "max": 4, "weight": 5000, "unit": 2}], "4-19": [{"min": 30, "max": 30, "weight": 20000, "unit": 1}, {"min": 28, "max": 28, "weight": 29000, "unit": 1}, {"min": 26, "max": 26, "weight": 15000, "unit": 1}, {"min": 24, "max": 24, "weight": 15000, "unit": 1}, {"min": 22, "max": 22, "weight": 10000, "unit": 1}, {"min": 20, "max": 20, "weight": 5000, "unit": 1}, {"min": 18, "max": 18, "weight": 3750, "unit": 1}, {"min": 15, "max": 15, "weight": 2250, "unit": 1}], "4-20": [{"min": 30, "max": 30, "weight": 20000, "unit": 1}, {"min": 28, "max": 28, "weight": 29000, "unit": 1}, {"min": 26, "max": 26, "weight": 15000, "unit": 1}, {"min": 24, "max": 24, "weight": 15000, "unit": 1}, {"min": 22, "max": 22, "weight": 10000, "unit": 1}, {"min": 20, "max": 20, "weight": 5000, "unit": 1}, {"min": 18, "max": 18, "weight": 3750, "unit": 1}, {"min": 15, "max": 15, "weight": 2250, "unit": 1}], "4-21": [{"min": 1, "max": 15, "weight": 100000, "unit": 0}], "4-22": [{"min": 1, "max": 5, "weight": 75000, "unit": 0}, {"min": 5, "max": 10, "weight": 25000, "unit": 0}], "4-23": [{"min": 1, "max": 1, "weight": 70000, "unit": 0}, {"min": 2, "max": 2, "weight": 25000, "unit": 0}, {"min": 3, "max": 3, "weight": 5000, "unit": 0}], "5-1": [{"min": 135, "max": 150, "weight": 50500, "unit": 0}, {"min": 150, "max": 165, "weight": 33000, "unit": 0}, {"min": 165, "max": 180, "weight": 10000, "unit": 0}, {"min": 180, "max": 195, "weight": 4500, "unit": 0}, {"min": 195, "max": 210, "weight": 2000, "unit": 0}], "5-2": [{"min": 135, "max": 150, "weight": 50500, "unit": 0}, {"min": 150, "max": 165, "weight": 33000, "unit": 0}, {"min": 165, "max": 180, "weight": 10000, "unit": 0}, {"min": 180, "max": 195, "weight": 4500, "unit": 0}, {"min": 195, "max": 210, "weight": 2000, "unit": 0}], "5-3": [{"min": 15, "max": 25, "weight": 100000, "unit": 0}], "5-4": [{"min": 15, "max": 25, "weight": 100000, "unit": 0}], "5-5": [{"min": 135, "max": 150, "weight": 50500, "unit": 0}, {"min": 150, "max": 165, "weight": 33000, "unit": 0}, {"min": 165, "max": 180, "weight": 10000, "unit": 0}, {"min": 180, "max": 195, "weight": 4500, "unit": 0}, {"min": 195, "max": 210, "weight": 2000, "unit": 0}], "5-6": [{"min": 15, "max": 25, "weight": 100000, "unit": 0}], "5-7": [{"min": 15, "max": 25, "weight": 100000, "unit": 0}], "5-8": [{"min": 15, "max": 25, "weight": 100000, "unit": 0}], "5-9": [{"min": 1000, "max": 1100, "weight": 50500, "unit": 0}, {"min": 1100, "max": 1200, "weight": 33000, "unit": 0}, {"min": 1200, "max": 1300, "weight": 10000, "unit": 0}, {"min": 1300, "max": 1400, "weight": 4500, "unit": 0}, {"min": 1400, "max": 1500, "weight": 2000, "unit": 0}], "5-10": [{"min": 1000, "max": 1100, "weight": 50500, "unit": 0}, {"min": 1100, "max": 1200, "weight": 33000, "unit": 0}, {"min": 1200, "max": 1300, "weight": 10000, "unit": 0}, {"min": 1300, "max": 1400, "weight": 4500, "unit": 0}, {"min": 1400, "max": 1500, "weight": 2000, "unit": 0}], "5-11": [{"min": 2, "max": 2, "weight": 72000, "unit": 0}, {"min": 3, "max": 3, "weight": 18000, "unit": 0}, {"min": 4, "max": 4, "weight": 10000, "unit": 0}], "5-12": [{"min": 2, "max": 2, "weight": 72000, "unit": 0}, {"min": 3, "max": 3, "weight": 18000, "unit": 0}, {"min": 4, "max": 4, "weight": 10000, "unit": 0}], "5-13": [{"min": 2, "max": 2, "weight": 80000, "unit": 0}, {"min": 3, "max": 3, "weight": 15000, "unit": 0}, {"min": 4, "max": 4, "weight": 5000, "unit": 0}], "5-14": [{"min": 2, "max": 2, "weight": 80000, "unit": 0}, {"min": 3, "max": 3, "weight": 15000, "unit": 0}, {"min": 4, "max": 4, "weight": 5000, "unit": 0}], "5-15": [{"min": 8, "max": 8, "weight": 50000, "unit": 2}, {"min": 6, "max": 6, "weight": 30000, "unit": 2}, {"min": 4, "max": 4, "weight": 15000, "unit": 2}, {"min": 3, "max": 3, "weight": 5000, "unit": 2}], "5-16": [{"min": 8, "max": 8, "weight": 50000, "unit": 2}, {"min": 6, "max": 6, "weight": 30000, "unit": 2}, {"min": 4, "max": 4, "weight": 15000, "unit": 2}, {"min": 3, "max": 3, "weight": 5000, "unit": 2}], "5-17": [{"min": 8, "max": 8, "weight": 50000, "unit": 2}, {"min": 6, "max": 6, "weight": 30000, "unit": 2}, {"min": 4, "max": 4, "weight": 15000, "unit": 2}, {"min": 3, "max": 3, "weight": 5000, "unit": 2}], "5-18": [{"min": 8, "max": 8, "weight": 50000, "unit": 2}, {"min": 6, "max": 6, "weight": 30000, "unit": 2}, {"min": 4, "max": 4, "weight": 15000, "unit": 2}, {"min": 3, "max": 3, "weight": 5000, "unit": 2}], "5-19": [{"min": 28, "max": 28, "weight": 20000, "unit": 1}, {"min": 26, "max": 26, "weight": 29000, "unit": 1}, {"min": 24, "max": 24, "weight": 15000, "unit": 1}, {"min": 22, "max": 22, "weight": 15000, "unit": 1}, {"min": 20, "max": 20, "weight": 10000, "unit": 1}, {"min": 18, "max": 18, "weight": 5000, "unit": 1}, {"min": 15, "max": 15, "weight": 3750, "unit": 1}, {"min": 13, "max": 13, "weight": 2250, "unit": 1}], "5-20": [{"min": 28, "max": 28, "weight": 20000, "unit": 1}, {"min": 26, "max": 26, "weight": 29000, "unit": 1}, {"min": 24, "max": 24, "weight": 15000, "unit": 1}, {"min": 22, "max": 22, "weight": 15000, "unit": 1}, {"min": 20, "max": 20, "weight": 10000, "unit": 1}, {"min": 18, "max": 18, "weight": 5000, "unit": 1}, {"min": 15, "max": 15, "weight": 3750, "unit": 1}, {"min": 13, "max": 13, "weight": 2250, "unit": 1}], "5-21": [{"min": 1, "max": 20, "weight": 100000, "unit": 0}], "5-22": [{"min": 1, "max": 5, "weight": 70000, "unit": 0}, {"min": 5, "max": 10, "weight": 25000, "unit": 0}, {"min": 10, "max": 15, "weight": 5000, "unit": 0}], "5-23": [{"min": 2, "max": 2, "weight": 70000, "unit": 0}, {"min": 3, "max": 3, "weight": 25000, "unit": 0}, {"min": 4, "max": 4, "weight": 5000, "unit": 0}]};

  // ---------- 先清掉舊的（讓 bookmarklet 可以重複點擊 / 熱重載）----------
  var oldStyle = document.getElementById(STYLE_ID);
  if (oldStyle) oldStyle.remove();
  document.querySelectorAll("[data-iw-btn]").forEach(function (el) { el.remove(); });
  var oldBackdrop = document.getElementById("iw-enhance-backdrop");
  if (oldBackdrop) oldBackdrop.remove();
  var oldAlchemyBackdrop = document.getElementById("iw-alchemy-backdrop");
  if (oldAlchemyBackdrop) oldAlchemyBackdrop.remove();
  var oldAlchemyFabWrap = document.getElementById("iw-alchemy-fab-wrap");
  if (oldAlchemyFabWrap) oldAlchemyFabWrap.remove();
  var oldAlchemyShowBtn = document.getElementById("iw-alchemy-show-btn");
  if (oldAlchemyShowBtn) oldAlchemyShowBtn.remove();
  var oldRespawnFab = document.getElementById("iw-respawn-fab");
  if (oldRespawnFab) oldRespawnFab.remove();
  window.__iwAlchemyGeneration = (window.__iwAlchemyGeneration || 0) + 1;
  var myAlchemyGeneration = window.__iwAlchemyGeneration;
  if (window.__iwEnhanceObserver) { window.__iwEnhanceObserver.disconnect(); }

  // ---------- 找到 Vue 應用程式，往下爬元件樹找 session/data/snap ----------
  // session、data、snap 分開找：session 幾乎每個畫面的元件都拿得到，data/snap 通常只有
  // 「強化」「鍊金」這類面板才會同時拿到——所以不要求三個一定要在同一個元件上，
  // 這樣書籤才能在任何畫面啟動，不用一定要先開強化頁。
  function findGameRefs() {
    var rootEl = null;
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i]._vnode) { rootEl = all[i]; break; }
    }
    if (!rootEl) return null;
    var rootVnode = rootEl._vnode;
    var rootComp = rootVnode && rootVnode.component;
    if (!rootComp) return null;

    var foundSession = null, foundData = null, foundSnap = null;
    function walk(vnode) {
      if (!vnode) return;
      if (vnode.component) {
        var props = vnode.component.props;
        if (props) {
          if (!foundSession && props.session && typeof props.session.enhance === "function") foundSession = props.session;
          if (!foundData && props.data && props.data.itemById && typeof props.data.itemById.get === "function") foundData = props.data;
          if (!foundSnap && props.snap && typeof props.snap.gold === "number") foundSnap = props.snap;
        }
        if (foundSession && foundData && foundSnap) return;
        walk(vnode.component.subTree);
      } else if (Array.isArray(vnode.children)) {
        for (var i = 0; i < vnode.children.length; i++) {
          walk(vnode.children[i]);
          if (foundSession && foundData && foundSnap) return;
        }
      }
    }
    walk(rootComp.subTree);
    return { session: foundSession, data: foundData, snap: foundSnap };
  }

  var initialRefs = findGameRefs();
  if (!initialRefs || !initialRefs.session) {
    alert("找不到遊戲的 session（有可能頁面還沒載入完成，或是遊戲版本改版了，請回報給作者）");
    return;
  }
  var session = initialRefs.session;
  var data = initialRefs.data; // 可能是 null，等玩家開過強化/鍊金頁面才抓得到，之後會自動補上
  var liveSnap = initialRefs.snap;
  // 🚨 一定要每次重新讀，不能把抓到的那個 snapshot 物件存起來用：
  // 遊戲的 pushSnapshot() 是 `this.snapshot.value = this.buildSnapshot()`，每次更新都換成「全新的物件」，
  // 不是改原本那一份。所以書籤啟動當下抓到的 snapshot 會永遠停在那一刻——
  // 換裝備之後 loadout 還是舊的，「⚡強化」就會因為比對不到裝備名稱而不出現（金幣、材料數量也會是舊的）。
  // session.snapshot 是 Vue 的 ref，讀 .value 才拿得到現在這一份。
  function snap() {
    var live = session && session.snapshot && session.snapshot.value;
    if (live && typeof live.gold === "number") return live;
    return liveSnap;
  }
  function tryUpgradeRefs() {
    if (data && liveSnap) return; // 已經都有了，不用再找
    var r = findGameRefs();
    if (!r) return;
    if (!data && r.data) data = r.data;
    if (!liveSnap && r.snap) liveSnap = r.snap;
  }

  // ---------- 樣式 ----------
  var style = document.createElement("style");
  style.id = STYLE_ID;
  // 配色跟遊戲本體一致（取自遊戲 index.css）：奶油羊皮紙面板、深棕描邊、立體按鈕、藍綠色主按鈕。
  // 用自己的 --iw-* 變數，不去動遊戲原本的 CSS 變數。
  style.textContent = [
    ":root{--iw-panel:#f8efdd;--iw-inset:#f6ead2;--iw-sel:#f3ddb2;--iw-line:#cdb48a;--iw-line-hi:#a28358;--iw-edge:#6b4a2a;",
    "--iw-text:#45301f;--iw-dim:#725c46;--iw-faint:#8a735b;--iw-accent:#8d6a30;--iw-ink:#6b4d17;",
    "--iw-go:#2f6b78;--iw-go-lift:#377986;--iw-go-sink:#245663;--iw-btn-top:#fff7e6;--iw-btn-bottom:#edd4a4;--iw-warn:#a8412f;}",
    "[id^=iw-enhance] *,[id^=iw-alchemy] *,.iw-inline-btn{box-sizing:border-box;font-family:'Noto Sans TC','Microsoft JhengHei',sans-serif;}",
    // 強化卡片上的「⚡強化」：遊戲的藍綠色主按鈕樣式，比「換一件」顯眼一點
    ".iw-inline-btn{background:linear-gradient(180deg,var(--iw-go-lift),var(--iw-go),var(--iw-go-sink));color:#fff;",
    "border:2px solid #1d4650;border-radius:999px;padding:4px 12px;font-size:12.5px;font-weight:700;cursor:pointer;margin-right:8px;white-space:nowrap;",
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 2px 0 #163a42,0 3px 6px rgba(0,0,0,.18);}",
    ".iw-inline-btn:hover{background:linear-gradient(180deg,#3f8796,var(--iw-go-lift),var(--iw-go));}",
    ".iw-inline-btn:active{transform:translateY(2px);box-shadow:inset 0 3px 6px rgba(0,0,0,.3);}",
    "#iw-enhance-backdrop,#iw-alchemy-backdrop{position:fixed;inset:0;background:rgba(40,26,14,.55);z-index:999998;",
    "display:flex;align-items:center;justify-content:center;padding:16px;}",
    "#iw-enhance-modal,#iw-alchemy-modal{background:var(--iw-panel);color:var(--iw-text);border:2px solid var(--iw-edge);border-radius:14px;",
    "width:100%;max-width:440px;max-height:88vh;overflow-y:auto;padding:0 20px 20px;box-shadow:0 10px 30px rgba(0,0,0,.35);position:relative;}",
    "#iw-enhance-modal h2,#iw-alchemy-modal h2{margin:0 -20px 14px;padding:12px 44px 11px 20px;font-size:16px;color:var(--iw-text);",
    "background:linear-gradient(180deg,#fdf3e0,#f1dcb4);border-bottom:1px solid rgba(162,131,88,.55);",
    "border-top:4px solid var(--iw-go);position:sticky;top:0;z-index:1;}",
    "#iw-enhance-modal label,#iw-alchemy-modal label{display:block;font-size:12.5px;font-weight:700;color:var(--iw-accent);margin:12px 0 4px;}",
    "#iw-enhance-modal select,#iw-enhance-modal input[type=number],#iw-alchemy-modal select,#iw-alchemy-modal input[type=number]{width:100%;padding:8px 9px;",
    "background:var(--iw-inset);border:1px solid #b99b6c;border-radius:8px;color:var(--iw-text);font-size:13.5px;",
    "box-shadow:inset 0 2px 4px rgba(0,0,0,.08);}",
    "#iw-enhance-modal select:focus,#iw-enhance-modal input:focus,#iw-alchemy-modal select:focus,#iw-alchemy-modal input:focus{outline:none;",
    "border-color:var(--iw-go);box-shadow:inset 0 2px 4px rgba(0,0,0,.08),0 0 0 3px rgba(47,107,120,.16);}",
    "#iw-enhance-modal input[type=checkbox],#iw-alchemy-modal input[type=checkbox]{accent-color:var(--iw-go);width:16px;height:16px;}",
    "#iw-enhance-modal .iw-target,#iw-alchemy-modal .iw-target{font-size:14px;color:var(--iw-text);background:rgba(255,250,240,.8);",
    "border:1px solid rgba(162,131,88,.5);border-left:4px solid var(--iw-go);border-radius:10px;padding:9px 10px;}",
    "#iw-enhance-modal .iw-warn{font-size:11.5px;color:var(--iw-warn);background:rgba(168,65,47,.07);border:1px solid rgba(168,65,47,.35);",
    "border-radius:8px;padding:6px 9px;margin-top:6px;line-height:1.6;display:none;}",
    ".iw-checkrow{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:13px;color:var(--iw-dim);}",
    ".iw-checkrow input{width:auto;}",
    ".iw-checkrow label{font-weight:400 !important;color:var(--iw-dim) !important;}",
    ".iw-btnrow{display:flex;gap:10px;margin-top:18px;}",
    // 遊戲的立體按鈕
    ".iw-btn{flex:1;padding:9px 10px;border-radius:10px;border:2px solid var(--iw-edge);",
    "background:linear-gradient(180deg,var(--iw-btn-top) 0%,#f6e5c3 52%,var(--iw-btn-bottom) 100%);color:var(--iw-text);font-size:13.5px;cursor:pointer;",
    "box-shadow:inset 0 2px 0 rgba(255,255,255,.85),inset 0 -3px 6px rgba(0,0,0,.12),0 2px 0 #4a3119,0 3px 7px rgba(0,0,0,.15);}",
    ".iw-btn:active:not(:disabled){background:linear-gradient(180deg,#f5e1bd,#fbeed3);box-shadow:inset 0 3px 8px rgba(0,0,0,.28);transform:translateY(2px);}",
    ".iw-btn.primary{background:linear-gradient(180deg,var(--iw-go-lift),var(--iw-go),var(--iw-go-sink));color:#fff;border-color:#1d4650;font-weight:700;",
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 2px 0 #163a42,0 3px 7px rgba(0,0,0,.18);}",
    ".iw-btn.primary:hover{background:linear-gradient(180deg,#3f8796,var(--iw-go-lift),var(--iw-go));}",
    ".iw-mode-btn.active{background:linear-gradient(180deg,#f5e1bd,#fbeed3);border-color:var(--iw-go);color:var(--iw-go);font-weight:700;",
    "box-shadow:inset 0 3px 7px rgba(0,0,0,.22);transform:translateY(1px);}",
    ".iw-btn:disabled{opacity:.45;cursor:not-allowed;}",
    "#iw-enhance-log,#iw-alchemy-log{margin-top:14px;background:var(--iw-inset);color:var(--iw-text);border:1px solid rgba(162,131,88,.5);border-radius:10px;",
    "box-shadow:inset 0 2px 5px rgba(0,0,0,.08);padding:10px;font-size:12.5px;line-height:1.7;max-height:160px;overflow-y:auto;white-space:pre-wrap;}",
    "#iw-enhance-summary,#iw-alchemy-summary{margin-top:12px;font-size:13px;line-height:1.8;}",
    "#iw-enhance-summary:not(:empty),#iw-alchemy-summary:not(:empty){background:rgba(255,250,240,.8);border:1px solid rgba(162,131,88,.5);border-radius:10px;padding:10px 12px;}",
    "#iw-enhance-summary b,#iw-alchemy-summary b,#iw-alchemy-status-summary b{color:var(--iw-ink);}",
    // ✕ 用 sticky + float 釘在標題列右上角，視窗內容往下捲也不會跟著捲走
    "#iw-enhance-close,#iw-alchemy-close{position:sticky;float:right;top:12px;margin:12px -6px -40px 0;z-index:3;width:28px;height:28px;padding:0;line-height:24px;",
    "background:linear-gradient(180deg,var(--iw-btn-top),var(--iw-btn-bottom));border:2px solid var(--iw-edge);border-radius:50%;",
    "color:var(--iw-text);font-size:13px;cursor:pointer;box-shadow:0 2px 0 #4a3119;}",
    "#iw-enhance-modal::-webkit-scrollbar,#iw-alchemy-modal::-webkit-scrollbar,#iw-enhance-log::-webkit-scrollbar,#iw-alchemy-log::-webkit-scrollbar{width:8px;}",
    "#iw-enhance-modal::-webkit-scrollbar-thumb,#iw-alchemy-modal::-webkit-scrollbar-thumb,#iw-enhance-log::-webkit-scrollbar-thumb,#iw-alchemy-log::-webkit-scrollbar-thumb{background:var(--iw-line-hi);border-radius:4px;}",
    // 左下角浮動按鈕（自動煉金／自動重生）：遊戲的膠囊按鈕樣式
    ".iw-fab{border:2px solid var(--iw-edge);border-radius:999px;font-weight:700;cursor:pointer;color:var(--iw-text);",
    "background:linear-gradient(180deg,var(--iw-btn-top) 0%,#f6e5c3 52%,var(--iw-btn-bottom) 100%);",
    "box-shadow:inset 0 2px 0 rgba(255,255,255,.85),inset 0 -3px 6px rgba(0,0,0,.12),0 2px 0 #4a3119,0 4px 10px rgba(0,0,0,.22);}",
    ".iw-fab:active{transform:translateY(2px);box-shadow:inset 0 3px 8px rgba(0,0,0,.28);}",
    ".iw-fab.iw-fab-go{background:linear-gradient(180deg,var(--iw-go-lift),var(--iw-go),var(--iw-go-sink));color:#fff;border-color:#1d4650;",
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 2px 0 #163a42,0 4px 10px rgba(0,0,0,.22);}",
    ".iw-fab.iw-fab-on{background:linear-gradient(180deg,#5a9a46,#47733a,#3a5f30);color:#fff;border-color:#2c4a24;}"
  ].join("");
  document.head.appendChild(style);

  // ---------- 小工具 ----------
  function gradeNameOf(grade) {
    if (!grade) return "N";
    var g = data.options && data.options.grades;
    return (g && g[grade - 1]) || String(grade);
  }
  function rolledKindsOf(entry) {
    var opts = entry && entry.options && entry.options.options;
    if (!Array.isArray(opts)) return [];
    return opts.map(function (o) { return o.kind; });
  }
  // 發條屬性的 unit（遊戲 Xl）：0 = 直接加數值、1 = 每 N 級 +1、2 = 每 N 級 +2（XG 以上的力量／敏捷／智力／幸運）
  var UNIT_DIRECT = 0;
  var PERCENT_KINDS = { 13: true, 14: true, 23: true }; // 遊戲 uu：這幾種直接加值的後面要加 %
  function perLevelGain(unit) { return unit === 2 ? 2 : 1; }
  // 跟遊戲 Su() 一樣的寫法：「攻擊力 +45」「每級力量：每 10 級 +2」
  function optionText(o) {
    var name = ENCHANT_KIND_NAME[o.kind] || ("kind" + o.kind);
    if (!o.unit) return name + " " + (o.value > 0 ? "+" : "") + o.value + (PERCENT_KINDS[o.kind] ? "%" : "");
    return name + "：每 " + o.value + " 級 +" + perLevelGain(o.unit);
  }
  function rolledKindsText(entry) {
    var opts = entry && entry.options && entry.options.options;
    if (!Array.isArray(opts) || !opts.length) return "無屬性";
    return opts.map(optionText).join("、");
  }
  // 這幾種「依等級增加」屬性，數字越小代表越常加點、越好，比較方向要反過來（要 <= 而不是 >=）
  // （syncEnchantTablesFromGame() 會再依遊戲資料裡「有 unit>0 的屬性」重新整理一次）
  var LOWER_IS_BETTER_KINDS = { 15: true, 16: true, 17: true, 18: true, 19: true, 20: true };
  // requirements: array of { kind, mode, threshold, min, max, unit }
  //   mode:"number" -> threshold 有值代表「要洗到符合門檻」（一般屬性是 >=，依等級增加屬性是 <=），null 代表不限數值
  //   mode:"tier"   -> min/max 有值代表「要落在這個機率區間」，null 代表不限範圍
  //   unit          -> 依等級增加屬性的「每 N 級 +1 還是 +2」；每 10 級 +2 比每 8 級 +1 還強，所以不能只比數字
  function reqSatisfiesValue(req, value, unit) {
    var perLevel = LOWER_IS_BETTER_KINDS[req.kind];
    if (req.mode === "tier") {
      if (req.min == null) return true;
      if (perLevel && req.unit != null && (unit || 1) !== req.unit) return false;
      return value >= req.min && value <= req.max;
    }
    if (req.threshold == null) return true;
    if (perLevel) {
      // 比「每一級平均加多少」：洗到的 (+gain / value) 要 >= 門檻的 (+gain / threshold)
      var gotGain = perLevelGain(unit || 1), needGain = perLevelGain(req.unit || 1);
      return gotGain * req.threshold >= needGain * value;
    }
    return value >= req.threshold;
  }
  function meetsKindRequirement(entry, requirements) {
    if (!requirements || !requirements.length) return true; // 沒指定就當作沒有這個限制
    var rolled = (entry && entry.options && entry.options.options) || [];
    var used = new Array(rolled.length).fill(false);
    function backtrack(i) {
      if (i >= requirements.length) return true;
      var req = requirements[i];
      for (var j = 0; j < rolled.length; j++) {
        if (used[j]) continue;
        var r = rolled[j];
        if (r.kind !== req.kind) continue;
        if (!reqSatisfiesValue(req, r.value, r.unit)) continue;
        used[j] = true;
        if (backtrack(i + 1)) return true;
        used[j] = false;
      }
      return false;
    }
    return backtrack(0);
  }
  function kindRequirementText(requirements) {
    return (requirements || []).map(function (req) {
      var name = ENCHANT_KIND_NAME[req.kind] || ("kind" + req.kind);
      var perLevel = LOWER_IS_BETTER_KINDS[req.kind];
      var gainText = perLevel ? " 級 +" + perLevelGain(req.unit || 1) : "";
      if (req.mode === "tier" && req.min != null) {
        return name + "(" + (perLevel ? "每 " : "") + (req.min === req.max ? req.min : req.min + "~" + req.max) + gainText + ")";
      }
      if (req.mode !== "tier" && req.threshold != null) {
        return perLevel
          ? name + "(每 " + req.threshold + gainText + " 或更好)"
          : name + "(≥" + req.threshold + (PERCENT_KINDS[req.kind] ? "%" : "") + ")";
      }
      return name;
    }).join("、");
  }
  // groups：多組「條件組合」，只要其中任何一組完全符合（組內是 AND）就算數（組跟組之間是 OR）
  function meetsAnyGroup(entry, groups) {
    if (!groups || !groups.length) return true; // 完全沒有任何組合 = 不限制，只看階級
    return groups.some(function (g) { return meetsKindRequirement(entry, g); });
  }
  function firstSatisfiedGroupText(entry, groups) {
    if (!groups || !groups.length) return null;
    var idx = groups.findIndex(function (g) { return meetsKindRequirement(entry, g); });
    return idx === -1 ? null : "組合" + (idx + 1);
  }
  function groupsText(groups) {
    if (!groups || !groups.length) return "（無限制）";
    return groups.map(function (g, idx) { return "組合" + (idx + 1) + "[" + kindRequirementText(g) + "]"; }).join("　或　");
  }
  function valueTiersFor(grade, kind) {
    return ENCHANT_VALUES[grade + "-" + kind] || [];
  }
  function overallBoundsFor(grade, kind) {
    var tiers = valueTiersFor(grade, kind);
    if (!tiers.length) return null;
    var min = tiers[0].min, max = tiers[0].max;
    tiers.forEach(function (t) {
      if (t.min < min) min = t.min;
      if (t.max > max) max = t.max;
    });
    return { min: min, max: max };
  }
  // 用遊戲正在用的 options（options.json）重建屬性表，作者改機率／加新階級時不用再手動更新這支書籤。
  // 讀不到就沿用上面寫死的表。遊戲格式：
  //   kinds:      [{kind, name}]
  //   appearance: [[階級, kind, 權重]]
  //   values:     [[階級, kind, min, max, 權重, unit]]
  function syncEnchantTablesFromGame() {
    var o = data && data.options;
    if (!o) return;
    try {
      if (Array.isArray(o.kinds) && o.kinds.length) {
        ENCHANT_KINDS = o.kinds.map(function (k) { return { kind: k.kind, name: k.name }; });
        ENCHANT_KIND_NAME = {};
        ENCHANT_KINDS.forEach(function (k) { ENCHANT_KIND_NAME[k.kind] = k.name; });
      }
      if (Array.isArray(o.appearance) && o.appearance.length) {
        var app = {};
        o.appearance.forEach(function (r) { (app[String(r[0])] = app[String(r[0])] || []).push({ kind: r[1], weight: r[2] }); });
        ENCHANT_APPEARANCE = app;
      }
      if (Array.isArray(o.values) && o.values.length) {
        var vals = {}, perLevel = {};
        o.values.forEach(function (r) {
          var key = r[0] + "-" + r[1];
          (vals[key] = vals[key] || []).push({ min: r[2], max: r[3], weight: r[4], unit: r[5] || 0 });
          if (r[5]) perLevel[r[1]] = true;
        });
        ENCHANT_VALUES = vals;
        if (Object.keys(perLevel).length) LOWER_IS_BETTER_KINDS = perLevel;
      }
    } catch (err) {
      console.warn("[一鍵強化] 讀遊戲的屬性表失敗，改用書籤內建的表", err);
    }
  }
  function loadoutList() {
    var s = snap();
    var out = [];
    var entries = Object.entries(s.loadout || {});
    for (var i = 0; i < entries.length; i++) {
      var slot = entries[i][0], n = entries[i][1];
      if (!n || !n.item) continue;
      var grade = (n.options && n.options.grade) || 0;
      var label = (data.slotLabels && data.slotLabels[slot]) || slot;
      out.push({
        slot: slot, stackId: n.stackId, name: n.item.name,
        grade: grade, gradeName: gradeNameOf(grade), label: label
      });
    }
    return out;
  }
  function findEntryByStackId(stackId) {
    // 讀 session.player.stacks（跟遊戲內部強化時直接修改的是同一份），
    // 不透過 snap（快照是定期才重建，會有延遲），確保拿到即時的階級結果。
    if (session.player && session.player.stacks) {
      var live = session.player.stacks.get(stackId);
      if (live) return live;
    }
    var s = snap();
    var entries = Object.entries(s.loadout || {});
    for (var i = 0; i < entries.length; i++) {
      var n = entries[i][1];
      if (n && n.stackId === stackId) return n;
    }
    return null;
  }
  function fmt(n) { return Math.round(n).toLocaleString("zh-TW"); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---------- 發條（2026-09-22 改版後有好幾種）----------
  // data.options.winders 就是 options.json 的 winders：
  //   { id, name, keepsPrevious, costs:[[目前階級, 每次金幣]], grades:[[目前階級, 洗完階級, 權重]] }
  // keepsPrevious=true 的發條（武爾坎努斯）洗完不會直接套用，而是讓玩家在「新的／上一組」之間選一組（stack.pendingPrev）。
  function winderList() {
    var list = data && data.options && data.options.winders;
    if (Array.isArray(list) && list.length) return list;
    return [{ id: CLOCKWORK_ID, name: "實習生的發條", keepsPrevious: false, costs: [], grades: [] }];
  }
  function winderById(id) {
    return winderList().find(function (w) { return w.id === id; }) || null;
  }
  function winderMaxGrade(w) {
    if (!w || !Array.isArray(w.grades) || !w.grades.length) return FALLBACK_MAX_GRADE;
    return w.grades.reduce(function (m, g) { return Math.max(m, g[1] || 0); }, 0);
  }
  // 這個階級還能不能用這種發條（costs 表裡沒有這個階級 = 遊戲不給上）
  function winderUsableAt(w, grade) {
    if (!w || !Array.isArray(w.costs) || !w.costs.length) return true;
    return w.costs.some(function (c) { return c[0] === grade; });
  }
  function winderStock(id) {
    try { return session.usableCount(id, "bagAndWarehouse") || 0; } catch (err) { return 0; }
  }
  // 買一個發條要多少金幣：NPC 商店（實習生）用 shopPrice；名品館的發條價格每小時浮動，用遊戲自己算的現價。
  function winderBuyPrice(id) {
    var p = data && data.shopPrice && data.shopPrice.get(id);
    if (p) return { price: p, source: "shop" };
    try {
      var mallItem = typeof session.mallItemFor === "function" && session.mallItemFor(id);
      if (mallItem && typeof session.mallPrice === "function") return { price: session.mallPrice(mallItem), source: "mall" };
    } catch (err) { /* 這個小時的價目表沒有這項 */ }
    var s = snap();
    var mp = s && s.mall && s.mall.prices && s.mall.prices.get && s.mall.prices.get(id);
    if (mp) return { price: mp, source: "mall" };
    return null;
  }
  function buyWinder(id) {
    var info = winderBuyPrice(id);
    if (!info) return false;
    var before = winderStock(id);
    if (info.source === "shop") session.buy(id, 1);
    else if (typeof session.buyMallItem === "function") session.buyMallItem(id, info.price, 1);
    return winderStock(id) > before;
  }
  // 遊戲強化頁面目前選中的發條（按鈕上有 data-winder，選中的那顆有 .on）
  function selectedWinderInGameUi() {
    var el = document.querySelector("button.winder.on[data-winder]");
    return el ? Number(el.getAttribute("data-winder")) : null;
  }

  // ---------- 把「⚡強化」按鈕插到每張裝備卡片的強化費用按鈕前面 ----------
  // 2026-09-22 改版後的強化頁：一次只顯示一件裝備的大卡片 <div class="card" data-id="stackId">，
  // 標題列有「換一件」(button.swap)，下面是發條選擇鈕 [data-winder]，或是「新的／上一組」二選一 [data-keep]。
  // stackId 直接寫在 data-id 上，不用再靠名稱比對，背包裡沒穿在身上的裝備也能用。
  function injectWindCardButton() {
    var cards = document.querySelectorAll(".card[data-id]");
    cards.forEach(function (card) {
      var swapBtn = card.querySelector(":scope > div:first-child > button.swap");
      if (!swapBtn || !card.querySelector("[data-winder],[data-keep]")) return; // 不是強化卡片（例如鎔解頁）
      var stackId = Number(card.getAttribute("data-id"));
      var existing = card.querySelector("[data-iw-btn]");
      if (existing) { existing.setAttribute("data-stack", String(stackId)); return; } // Vue 換裝備時會沿用節點，只更新 stackId
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "⚡強化";
      btn.setAttribute("data-iw-btn", "1");
      btn.setAttribute("data-stack", String(stackId));
      btn.className = "iw-inline-btn";
      btn.style.marginLeft = "auto";
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var sid = Number(btn.getAttribute("data-stack"));
        var nameEl = card.querySelector("strong");
        var name = nameEl ? nameEl.textContent.trim() : ("Stack " + sid);
        var worn = loadoutList().find(function (it) { return it.stackId === sid; });
        var current = worn || { slot: "", stackId: sid, name: name, label: "背包" };
        try { openModal(current); } catch (err) {
          console.error("[一鍵強化] 開啟視窗失敗", err);
          alert("開啟視窗時發生錯誤：" + (err && err.message ? err.message : err));
        }
      });
      swapBtn.parentNode.insertBefore(btn, swapBtn);
    });
  }

  function injectButtons() {
    try {
      tryUpgradeRefs(); // 如果一開始沒抓到 data/snap，這裡有機會重新補上（現在畫面上如果有 .card 元素，通常代表 data 也拿得到了）
      if (data) injectWindCardButton();
      // 舊版強化頁（每個部位一張小卡片，按鈕上顯示金幣費用）——保留相容，作者如果改回來也能用
      var goButtons = document.querySelectorAll(".card:not([data-id]) > div:first-child > button.go");
      if (goButtons.length === 0) return;
      if (!data) { console.warn("[一鍵強化] 找到強化按鈕的畫面了，但還沒抓到 data，稍後畫面變動時會自動重試"); return; }
      var items = loadoutList();
      goButtons.forEach(function (goBtn) {
        var card = goBtn.closest(".card");
        if (!card || card.querySelector("[data-iw-btn]")) return;
        var nameEl = card.querySelector("strong");
        var name = nameEl ? nameEl.textContent.trim() : "";
        var match = items.find(function (it) { return it.name === name; });
        if (!match) {
          // 比對不到就不插按鈕。留個訊息，下次再遇到（例如遊戲把卡片上的名稱改了寫法）一看 Console 就知道。
          console.warn("[一鍵強化] 卡片「" + name + "」在身上的裝備清單裡找不到同名的，先跳過。目前清單：",
            items.map(function (it) { return it.slot + "=" + it.name; }));
          return;
        }
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = "⚡強化";
        btn.title = "一鍵強化：" + match.name;
        btn.setAttribute("data-iw-btn", "1");
        btn.className = "iw-inline-btn";
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          // 🚨 目標裝備要「按下去的當下」重新讀，不能用插按鈕時抓到的那一份：
          // 在強化頁面直接開背包換武器時，Vue 是沿用同一個卡片節點、只換掉裡面的名稱，
          // 按鈕還是先前插進去的那一顆（injectButtons 看到卡片已經有按鈕就會跳過），
          // 沿用舊的 match 就會顯示、甚至去強化已經換下來的那把舊武器。
          var liveNameEl = card.querySelector("strong");
          var liveName = liveNameEl ? liveNameEl.textContent.trim() : name;
          var current = loadoutList().find(function (it) { return it.name === liveName; }) || match;
          btn.title = "一鍵強化：" + current.name;
          try { openModal(current); } catch (err) {
            console.error("[一鍵強化] 開啟視窗失敗", err);
            alert("開啟視窗時發生錯誤：" + (err && err.message ? err.message : err));
          }
        });
        goBtn.parentNode.insertBefore(btn, goBtn);
      });
    } catch (err) {
      console.error("[一鍵強化] 插入按鈕時發生錯誤", err);
    }
  }

  injectButtons();
  var observer = new MutationObserver(function () {
    clearTimeout(window.__iwEnhanceDebounce);
    window.__iwEnhanceDebounce = setTimeout(injectButtons, 150);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.__iwEnhanceObserver = observer;

  // ---------- 視窗 ----------
  var backdrop, modal, running = false, stopFlag = false;

  function openModal(item) {
    if (backdrop) return;
    var grades = (data.options && data.options.grades) || [];

    backdrop = document.createElement("div");
    backdrop.id = "iw-enhance-backdrop";
    modal = document.createElement("div");
    modal.id = "iw-enhance-modal";

    syncEnchantTablesFromGame();
    var freshEntry = findEntryByStackId(item.stackId);
    var curGrade = (freshEntry && freshEntry.options && freshEntry.options.grade) || 0;

    // 預設發條：遊戲畫面上目前選的那顆 → 這個階級能用、而且身上有的 → 這個階級能用的第一個
    // 遊戲強化頁只列商店／名品館買得到的發條；「不可交易」版買不到，身上有才列出來（書籤可以直接拿來用）
    var winders = winderList().filter(function (w) { return winderBuyPrice(w.id) || winderStock(w.id) > 0; });
    if (!winders.length) winders = winderList();
    var uiWinderId = selectedWinderInGameUi();
    var defaultWinder =
      winders.find(function (w) { return w.id === uiWinderId && winderUsableAt(w, curGrade); }) ||
      winders.find(function (w) { return winderUsableAt(w, curGrade) && winderStock(w.id) > 0; }) ||
      winders.find(function (w) { return winderUsableAt(w, curGrade); }) ||
      winders[0];
    function winderOptionText(w) {
      var buy = winderBuyPrice(w.id);
      var parts = ["持有 " + fmt(winderStock(w.id))];
      parts.push("最高 " + (grades[winderMaxGrade(w) - 1] || winderMaxGrade(w)));
      if (buy) parts.push("可買 " + fmt(buy.price) + "金" + (buy.source === "mall" ? "・名品館" : ""));
      if (w.keepsPrevious) parts.push("可保留上一組");
      if (!winderUsableAt(w, curGrade)) parts.push("目前階級不能用");
      return w.name + "（" + parts.join("・") + "）";
    }
    var winderOptions = winders.map(function (w) {
      return '<option value="' + w.id + '"' + (w === defaultWinder ? " selected" : "") +
        (winderUsableAt(w, curGrade) ? "" : " disabled") + '>' + winderOptionText(w) + '</option>';
    }).join("");
    function gradeOptionsHtml(w, selected) {
      var maxG = Math.min(winderMaxGrade(w), grades.length || FALLBACK_MAX_GRADE);
      var html = "";
      for (var g = 1; g <= maxG; g++) {
        var tag = g === curGrade ? "（目前階級：就地重洗屬性）" : g > curGrade ? "（要先升階才會停）" : "";
        html += '<option value="' + g + '"' + (g === selected ? " selected" : "") + '>' + (grades[g - 1] || g) + tag + '</option>';
      }
      return html;
    }
    // 預設目標＝目前階級（大部分人是要「就地重洗屬性」）。以前預設是「目前 +1」，
    // 玩家回報：XG 裝備預設目標變成 SG，選單列出 SG 才有的「每 3 級」，洗到 XG 的「每 4 級」也不會停（因為還沒升到 SG）。
    var defaultTarget = Math.min(Math.max(curGrade, 1), winderMaxGrade(defaultWinder));
    var gradeOptions = gradeOptionsHtml(defaultWinder, defaultTarget);
    var pendingNote = (freshEntry && freshEntry.pendingPrev)
      ? '<div class="iw-warn" style="display:block;">⚠️ 這件裝備上次用武爾坎努斯的發條還沒選「新的／上一組」，請先在遊戲畫面選好一組再開始（不然遊戲不會讓它再上發條）。</div>'
      : "";

    function kindOptionsHtmlFor(grade) {
      return ENCHANT_KINDS.map(function (k) {
        var pct = appearancePctFor(grade, k.kind);
        var pctText = pct == null ? "" : "（出現率" + (pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)) + "%）";
        return '<option value="' + k.kind + '">' + k.name + pctText + '</option>';
      }).join("");
    }

    modal.innerHTML =
      '<button id="iw-enhance-close">✕</button>' +
      '<h2>⚡ 一鍵強化</h2>' +
      '<label>目標裝備</label>' +
      '<div class="iw-target" id="iw-f-target-display">' + item.label + '：' + item.name + '（目前 ' + gradeNameOf(curGrade) + ' 階・' + rolledKindsText(freshEntry) + '）</div>' +
      pendingNote +
      '<label>使用的發條</label>' +
      '<select id="iw-f-winder">' + winderOptions + '</select>' +
      '<div id="iw-f-winder-note" style="font-size:12px;color:var(--iw-dim);margin-top:4px;"></div>' +
      '<label>目標階級（洗到這階或更高就停）</label>' +
      '<select id="iw-f-grade">' + gradeOptions + '</select>' +
      '<div class="iw-warn" id="iw-f-warn">⚠️ 高階級的成功機率可能非常低（甚至目前材料完全洗不上去），選這個目標有可能把預算花光也到不了，請自行評估。</div>' +
      '<label>準備幾條屬性選項？（0 = 不限制，只看階級；打勾才會列入要求，沒勾的先放著備用）</label>' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">' +
      '<input type="number" id="iw-f-kind-count" min="0" max="6" value="0" style="width:64px;">' +
      '<div style="display:flex;gap:6px;">' +
      '<button type="button" class="iw-btn iw-mode-btn" id="iw-f-mode-number" style="padding:6px 12px;font-size:12.5px;">依數字</button>' +
      '<button type="button" class="iw-btn iw-mode-btn" id="iw-f-mode-tier" style="padding:6px 12px;font-size:12.5px;">依階級</button>' +
      '</div>' +
      '</div>' +
      '<div id="iw-f-kind-slots" style="display:flex;flex-direction:column;gap:6px;margin-top:8px;"></div>' +
      '<div id="iw-f-groups-wrap" style="display:none;margin-top:14px;">' +
      '<label>停止條件組合（符合其中任何一組就停；組內要同時全部出現）</label>' +
      '<div id="iw-f-groups-list" style="display:flex;flex-direction:column;gap:8px;"></div>' +
      '<button type="button" class="iw-btn" id="iw-f-add-group" style="margin-top:8px;">➕ 新增組合</button>' +
      '</div>' +
      '<label style="margin-top:16px;">最大金幣預算</label>' +
      '<input type="number" id="iw-f-budget" min="0" step="1000" value="' + Math.floor((snap().gold || 0)) + '">' +
      '<div class="iw-checkrow"><input type="checkbox" id="iw-f-autobuy"><label style="margin:0;" for="iw-f-autobuy" id="iw-f-autobuy-label"></label></div>' +
      '<div class="iw-btnrow">' +
      '<button class="iw-btn" id="iw-f-cancel">取消</button>' +
      '<button class="iw-btn primary" id="iw-f-start">開始強化</button>' +
      '</div>' +
      '<div id="iw-enhance-log" style="display:none;"></div>' +
      '<div id="iw-enhance-summary"></div>';

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    var gradeSelect = document.getElementById("iw-f-grade");
    var warnEl = document.getElementById("iw-f-warn");
    // 目標比目前階級高時，一定要講清楚：屬性符合了也不會停，要先升階；順便算出用這種發條每次升階的機率
    function updateWarn() {
      var target = Number(gradeSelect.value);
      if (target <= curGrade) { warnEl.style.display = "none"; return; }
      var wSel = document.getElementById("iw-f-winder");
      var w = (wSel && winderById(Number(wSel.value))) || defaultWinder;
      var rows = (w && w.grades || []).filter(function (r) { return r[0] === curGrade; });
      var total = rows.reduce(function (s, r) { return s + r[2]; }, 0);
      var up = rows.filter(function (r) { return r[1] > curGrade; }).reduce(function (s, r) { return s + r[2]; }, 0);
      var upPct = total ? up / total * 100 : 0;
      if (curGrade === 0) { warnEl.style.display = "none"; return; } // 還沒上過發條：第一次一定先變 N，往上洗是正常流程
      var nowName = gradeNameOf(curGrade), targetName = gradeNameOf(target);
      warnEl.innerHTML = "⚠️ 目標 <b>" + targetName + "</b> 比目前的 <b>" + nowName + "</b> 高：就算屬性已經符合，<b>還沒升到 " + targetName +
        " 之前都不會停</b>。" + (w ? w.name + " 從 " + nowName + " 升階的機率每次約 " + (upPct >= 1 ? upPct.toFixed(1) : upPct.toFixed(2)) + "%" : "") +
        (target - curGrade >= 2 ? "，而且要連升 " + (target - curGrade) + " 階，可能把預算花光也到不了" : "") +
        "。只想重洗屬性的話，請把目標設成「" + nowName + "」。";
      warnEl.style.display = "block";
    }

    var kindCountInput = document.getElementById("iw-f-kind-count");
    var kindSlotsWrap = document.getElementById("iw-f-kind-slots");

    var rangeMode = "number"; // "number" 或 "tier"
    var modeNumberBtn = document.getElementById("iw-f-mode-number");
    var modeTierBtn = document.getElementById("iw-f-mode-tier");
    function updateModeButtons() {
      modeNumberBtn.classList.toggle("active", rangeMode === "number");
      modeTierBtn.classList.toggle("active", rangeMode === "tier");
    }
    updateModeButtons();

    // 選項的 value 格式：依數字 "門檻|unit"、依階級 "min|max|unit"（unit 只有依等級增加屬性用得到）
    function rangeOptionsHtmlByNumber(grade, kind) {
      var html = '<option value="">（不限數值）</option>';
      if (LOWER_IS_BETTER_KINDS[kind]) {
        // 依等級增加屬性只會洗到表上那幾個數字（例如 10/8/6/4），直接列出來，並寫清楚是 +1 還是 +2
        var seen = {};
        valueTiersFor(grade, kind)
          .map(function (t) { return { v: t.min, unit: t.unit || 1 }; })
          .sort(function (a, b) { return b.unit - a.unit || a.v - b.v; })
          .forEach(function (o) {
            var key = o.v + "|" + o.unit;
            if (seen[key]) return;
            seen[key] = true;
            html += '<option value="' + key + '">每 ' + o.v + ' 級 +' + perLevelGain(o.unit) + '（或更好）</option>';
          });
        return html;
      }
      var bounds = overallBoundsFor(grade, kind);
      if (!bounds) return html;
      var pctSign = PERCENT_KINDS[kind] ? "%" : "";
      for (var v = bounds.min; v <= bounds.max; v++) {
        html += '<option value="' + v + '|0">≥ ' + v + pctSign + '</option>';
      }
      return html;
    }
    function rangeOptionsHtmlByTier(grade, kind) {
      var tiers = valueTiersFor(grade, kind);
      var total = tiers.reduce(function (s, t) { return s + t.weight; }, 0) || 1;
      var html = '<option value="">（不限範圍）</option>';
      var perLevel = LOWER_IS_BETTER_KINDS[kind];
      tiers.forEach(function (t) {
        var pct = t.weight / total * 100;
        var pctText = pct >= 10 ? pct.toFixed(0) : pct.toFixed(1);
        var range = t.min === t.max ? String(t.min) : t.min + '~' + t.max;
        var label = perLevel
          ? '每 ' + range + ' 級 +' + perLevelGain(t.unit || 1)
          : range + (PERCENT_KINDS[kind] ? "%" : "");
        html += '<option value="' + t.min + '|' + t.max + '|' + (t.unit || 0) + '">' + label + '（' + pctText + '%）</option>';
      });
      return html;
    }
    function rangeOptionsHtml(grade, kind) {
      return rangeMode === "tier" ? rangeOptionsHtmlByTier(grade, kind) : rangeOptionsHtmlByNumber(grade, kind);
    }
    function refreshRangeSelect(rangeSel, kindSel) {
      rangeSel.innerHTML = rangeOptionsHtml(Number(gradeSelect.value), Number(kindSel.value));
    }
    function refreshAllRangeSelects() {
      Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row")).forEach(function (row) {
        refreshRangeSelect(row.querySelector(".iw-kind-slot-range"), row.querySelector(".iw-kind-slot"));
      });
    }
    function refreshAllKindSelects() {
      // 屬性選單旁邊的「出現率」是跟著目標階級變的，換階級要重新產生選項文字，但保留玩家原本選的屬性
      var grade = Number(gradeSelect.value);
      Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row")).forEach(function (row) {
        var kindSel = row.querySelector(".iw-kind-slot");
        var prevVal = kindSel.value;
        kindSel.innerHTML = kindOptionsHtmlFor(grade);
        kindSel.value = prevVal;
      });
    }
    modeNumberBtn.addEventListener("click", function () { rangeMode = "number"; updateModeButtons(); refreshAllRangeSelects(); });
    modeTierBtn.addEventListener("click", function () { rangeMode = "tier"; updateModeButtons(); refreshAllRangeSelects(); });
    gradeSelect.addEventListener("change", function () { updateWarn(); refreshAllKindSelects(); refreshAllRangeSelects(); });
    updateWarn();

    var winderSelect = document.getElementById("iw-f-winder");
    function refreshWinderInfo() {
      var w = winderById(Number(winderSelect.value)) || defaultWinder;
      var buy = winderBuyPrice(w.id);
      var label = document.getElementById("iw-f-autobuy-label");
      var autobuy = document.getElementById("iw-f-autobuy");
      if (buy) {
        label.textContent = "沒有" + w.name + "時，自動花金幣購買繼續（每個 " + fmt(buy.price) + " 金幣" +
          (buy.source === "mall" ? "，名品館價格每小時會變" : "") + "）";
        autobuy.disabled = false;
      } else {
        label.textContent = w.name + "買不到（不在商店／名品館），只能用身上現有的";
        autobuy.checked = false;
        autobuy.disabled = true;
      }
      var cost = (w.costs || []).find(function (c) { return c[0] === curGrade; });
      var notes = ["每次上發條 " + (cost ? (cost[1] ? fmt(cost[1]) + " 金幣" : "不用金幣") : "費用依遊戲計算")];
      if (w.keepsPrevious) notes.push("洗完會自動在「新的／上一組」之間留下比較符合目標的那組");
      document.getElementById("iw-f-winder-note").textContent = notes.join("；");
    }
    winderSelect.addEventListener("change", function () {
      var w = winderById(Number(winderSelect.value)) || defaultWinder;
      var keep = Math.min(Number(gradeSelect.value) || 1, winderMaxGrade(w));
      gradeSelect.innerHTML = gradeOptionsHtml(w, keep);
      refreshWinderInfo();
      updateWarn(); refreshAllKindSelects(); refreshAllRangeSelects();
    });
    refreshWinderInfo();

    // ---------- 停止條件組合（多組 AND，組跟組之間是 OR）----------
    var groupsWrap = document.getElementById("iw-f-groups-wrap");
    var groupsList = document.getElementById("iw-f-groups-list");
    var addGroupBtn = document.getElementById("iw-f-add-group");
    var groups = []; // 每個元素是長度 = 屬性數量 的布林陣列

    function currentSlotCount() {
      return kindSlotsWrap.querySelectorAll(".iw-kind-row").length;
    }
    function slotLabel(i) {
      var row = kindSlotsWrap.querySelectorAll(".iw-kind-row")[i];
      if (!row) return "";
      var kindVal = Number(row.querySelector(".iw-kind-slot").value);
      return (ENCHANT_KIND_NAME[kindVal] || "");
    }
    function renderGroups() {
      var n = currentSlotCount();
      groupsWrap.style.display = n > 0 ? "block" : "none";
      groupsList.innerHTML = "";
      groups.forEach(function (g, gIdx) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:6px 8px;background:rgba(255,250,240,.8);border:1px solid rgba(162,131,88,.45);border-radius:8px;";
        var label = document.createElement("span");
        label.textContent = "組合" + (gIdx + 1) + "：";
        label.style.cssText = "flex:none;font-size:12.5px;color:var(--iw-dim);";
        row.appendChild(label);
        for (var i = 0; i < n; i++) {
          var cbLabel = document.createElement("label");
          cbLabel.style.cssText = "display:flex;align-items:center;gap:3px;font-size:12.5px;font-weight:400;margin:0;";
          var cb = document.createElement("input");
          cb.type = "checkbox";
          cb.style.width = "auto";
          cb.checked = !!g[i];
          (function (gArr, idx, checkbox) {
            checkbox.addEventListener("change", function () {
              if (checkbox.checked) {
                var checkedCount = gArr.filter(Boolean).length;
                if (checkedCount >= 3) {
                  checkbox.checked = false;
                  alert("同一個組合最多只能勾 3 個——遊戲每次強化固定只會洗出 3 條屬性，勾超過 3 個那個組合永遠不可能成立。");
                  return;
                }
              }
              gArr[idx] = checkbox.checked;
            });
          })(g, i, cb);
          cbLabel.appendChild(cb);
          cbLabel.appendChild(document.createTextNode("①②③④⑤⑥"[i] + (slotLabel(i) ? " " + slotLabel(i) : "")));
          row.appendChild(cbLabel);
        }
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "iw-btn";
        delBtn.textContent = "✕";
        delBtn.style.cssText = "padding:2px 8px;font-size:12px;margin-left:auto;";
        delBtn.addEventListener("click", function () {
          groups.splice(gIdx, 1);
          renderGroups();
        });
        row.appendChild(delBtn);
        groupsList.appendChild(row);
      });
    }
    function refreshGroupLabels() { renderGroups(); }
    function rebuildGroups() {
      var n = currentSlotCount();
      groups.forEach(function (g) {
        while (g.length < n) g.push(false);
        g.length = n;
      });
      // 第一次設定屬性選項時，自動幫玩家建一組「組合1」（預設全部勾選），
      // 不用玩家自己記得要按「➕新增組合」再勾選，這是最容易漏掉的一步。
      if (n >= 1 && groups.length === 0) {
        groups.push(new Array(n).fill(true));
      }
      renderGroups();
    }
    addGroupBtn.addEventListener("click", function () {
      var n = currentSlotCount();
      if (n === 0) { alert("請先設定至少 1 條屬性選項，才能建立組合"); return; }
      groups.push(new Array(n).fill(false));
      renderGroups();
    });

    function rebuildKindSlots() {
      var n = Math.max(0, Math.min(6, Number(kindCountInput.value) || 0));
      kindCountInput.value = String(n);
      var prevRows = Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row"));
      var prevKinds = prevRows.map(function (row) { return row.querySelector(".iw-kind-slot").value; });
      kindSlotsWrap.innerHTML = "";
      var numerals = ["①", "②", "③", "④", "⑤", "⑥"];
      for (var i = 0; i < n; i++) {
        var row = document.createElement("div");
        row.className = "iw-kind-row";
        row.style.cssText = "display:flex;gap:6px;align-items:center;";
        var numLabel = document.createElement("span");
        numLabel.textContent = numerals[i] || String(i + 1);
        numLabel.style.cssText = "flex:none;width:20px;color:var(--iw-go);font-weight:700;";
        var kindSel = document.createElement("select");
        kindSel.className = "iw-kind-slot";
        kindSel.style.flex = "1";
        kindSel.innerHTML = kindOptionsHtmlFor(Number(gradeSelect.value));
        if (prevKinds[i]) kindSel.value = prevKinds[i];
        var rangeSel = document.createElement("select");
        rangeSel.className = "iw-kind-slot-range";
        rangeSel.style.flex = "1";
        row.appendChild(numLabel);
        row.appendChild(kindSel);
        row.appendChild(rangeSel);
        kindSlotsWrap.appendChild(row);
        refreshRangeSelect(rangeSel, kindSel);
        kindSel.addEventListener("change", function () {
          var r = this.closest(".iw-kind-row");
          refreshRangeSelect(r.querySelector(".iw-kind-slot-range"), r.querySelector(".iw-kind-slot"));
          refreshGroupLabels();
        });
      }
      rebuildGroups(); // 屬性數量變了，組合的勾選格數量也要跟著重建
    }
    kindCountInput.addEventListener("input", rebuildKindSlots);
    rebuildKindSlots();

    document.getElementById("iw-enhance-close").addEventListener("click", closeModal);
    document.getElementById("iw-f-cancel").addEventListener("click", function () {
      if (running) { stopFlag = true; } else { closeModal(); }
    });
    document.getElementById("iw-f-start").addEventListener("click", function () {
      try {
        var targetGrade = Number(document.getElementById("iw-f-grade").value);
        var budget = Number(document.getElementById("iw-f-budget").value) || 0;
        var autoBuy = document.getElementById("iw-f-autobuy").checked;
        var slotRows = Array.prototype.slice.call(kindSlotsWrap.querySelectorAll(".iw-kind-row"));
        function slotToReq(row) {
          var kind = Number(row.querySelector(".iw-kind-slot").value);
          var rangeVal = row.querySelector(".iw-kind-slot-range").value;
          if (rangeMode === "tier") {
            if (!rangeVal) return { kind: kind, mode: "tier", min: null, max: null };
            var parts = rangeVal.split("|");
            return { kind: kind, mode: "tier", min: Number(parts[0]), max: Number(parts[1]), unit: parts[2] ? Number(parts[2]) : null };
          }
          if (!rangeVal) return { kind: kind, mode: "number", threshold: null };
          var np = rangeVal.split("|");
          return { kind: kind, mode: "number", threshold: Number(np[0]), unit: np[1] ? Number(np[1]) : null };
        }
        // 把每個組合的勾選陣列，轉成「這個組合需要哪幾個屬性條件」，沒有任何勾選的組合直接跳過（不然會變成永遠成立）
        var matchGroups = groups
          .map(function (g) {
            return g.map(function (checked, i) { return checked ? slotRows[i] : null; })
              .filter(Boolean).map(slotToReq);
          })
          .filter(function (g) { return g.length > 0; });

        if (slotRows.length >= 4 && matchGroups.length === 0) {
          alert("你準備了 " + slotRows.length + " 條屬性選項，但沒有建立任何「停止條件組合」。\n\n遊戲每次強化固定只會洗出 3 條屬性，不可能一次全部出現——請按「➕ 新增組合」，自己勾選其中最多 3 個編號當作停止條件。");
          return;
        }
        if (slotRows.length >= 1 && matchGroups.length === 0) {
          if (!confirm("你設定了 " + slotRows.length + " 條屬性選項，但沒有按「➕ 新增組合」勾選任何一個編號當作停止條件。\n\n這樣屬性條件不會生效，只要階級到了就會直接停止，不管洗出來的屬性是什麼。\n\n要照這樣繼續嗎？（建議按「取消」，回去新增組合並勾選）")) return;
        }

        // 開始強化前，先看這件裝備「目前現在」是不是已經符合設定的條件了——
        // 有可能玩家之前已經洗出想要的屬性種類，只是數值不是他要的，這種情況直接開始跑，
        // 一開始就會馬上判定「已符合」而停下來，等於白跑。跳一次確認，讓玩家自己決定要不要重洗。
        var currentEntryNow = findEntryByStackId(item.stackId);
        if (currentEntryNow && currentEntryNow.pendingPrev) {
          alert("這件裝備還在等你選「新的／上一組」（上次用了武爾坎努斯的發條）。\n\n請先在遊戲畫面按「選這組」，再開始一鍵強化。");
          return;
        }
        var winderId = Number(document.getElementById("iw-f-winder").value) || CLOCKWORK_ID;
        var winderNow = winderById(winderId);
        if (winderNow && !winderUsableAt(winderNow, (currentEntryNow && currentEntryNow.options && currentEntryNow.options.grade) || 0)) {
          alert(winderNow.name + " 不能用在目前這個階級的裝備上，請換一種發條。");
          return;
        }
        if (matchGroups.length && meetsAnyGroup(currentEntryNow, matchGroups)) {
          if (!confirm("指定能力已出現，是否重新洗裝備？\n\n（可能是屬性種類對了，但數值不是你要的）")) return;
        }

        startRun(item, targetGrade, budget, autoBuy, matchGroups, winderId);
      } catch (err) {
        console.error("[一鍵強化] 啟動失敗", err);
        alert("啟動時發生錯誤：" + (err && err.message ? err.message : err));
      }
    });

    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop && !running) closeModal();
    });
  }

  function closeModal() {
    if (running) return;
    if (backdrop) { backdrop.remove(); backdrop = null; modal = null; }
  }

  function log(msg) {
    var el = document.getElementById("iw-enhance-log");
    if (!el) return;
    el.style.display = "block";
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  }

  function setFormDisabled(disabled) {
    ["iw-f-winder", "iw-f-grade", "iw-f-budget", "iw-f-autobuy", "iw-f-start"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
    var cancel = document.getElementById("iw-f-cancel");
    if (cancel) cancel.textContent = disabled ? "停止" : "取消";
  }

  // 用 keepsPrevious 發條洗完後，「新的」跟「上一組」要留哪一組：
  // 先比「是否達成目標（階級 + 屬性條件）」，再比階級，再比「屬性條件是否符合」；全部一樣就留新的（跟直接洗一樣）。
  function pickKeep(newOptions, prevOptions, targetGrade, matchGroups) {
    function score(opts) {
      var grade = (opts && opts.grade) || 0;
      var groupsOk = meetsAnyGroup({ options: opts }, matchGroups);
      return [grade >= targetGrade && groupsOk ? 1 : 0, grade, groupsOk ? 1 : 0];
    }
    var a = score(newOptions), b = score(prevOptions);
    for (var i = 0; i < a.length; i++) {
      if (b[i] !== a[i]) return b[i] > a[i] ? "previous" : "new";
    }
    return "new";
  }

  async function startRun(item, targetGrade, budget, autoBuy, matchGroups, winderId) {
    running = true;
    stopFlag = false;
    setFormDisabled(true);
    document.getElementById("iw-enhance-summary").innerHTML = "";
    document.getElementById("iw-enhance-log").textContent = "";

    winderId = winderId || CLOCKWORK_ID;
    var winder = winderById(winderId) || { id: winderId, name: "發條", keepsPrevious: false };
    var stackId = item.stackId;
    var attempts = 0, totalSpent = 0, totalUsed = 0, totalBought = 0, keptPrevious = 0;
    var reason = "unknown";

    while (true) {
      if (stopFlag) { reason = "stopped"; break; }

      var entry = findEntryByStackId(stackId);
      if (!entry) { reason = "item-gone"; break; }
      if (entry.pendingPrev) { reason = "pending-choice"; break; }
      var curGrade = (entry.options && entry.options.grade) || 0;
      if (curGrade >= targetGrade && meetsAnyGroup(entry, matchGroups)) { reason = "success"; break; }
      if (!winderUsableAt(winder, curGrade)) { reason = "winder-unusable"; break; }

      // 下一次上發條的金幣費用（高手／武爾坎努斯是 0，這時候預算只會被「買發條」用掉）
      var costRow = (winder.costs || []).find(function (c) { return c[0] === curGrade; });
      var nextCost = costRow ? (costRow[1] || 0) : 0;
      if (nextCost > 0 && totalSpent + nextCost > budget) { reason = "budget"; break; }

      var have = winderStock(winderId);
      if (have < 1) {
        if (!autoBuy) { reason = "no-material"; break; }
        var buyInfo = winderBuyPrice(winderId);
        if (!buyInfo || !buyInfo.price) { reason = "no-price"; break; }
        if (session.player.gold < buyInfo.price) { reason = "no-gold-for-material"; break; }
        if (totalSpent + buyInfo.price > budget) { reason = "budget"; break; }
        var goldBeforeBuy = session.player.gold;
        var bought = buyWinder(winderId);
        var buySpent = goldBeforeBuy - session.player.gold;
        if (!bought || buySpent <= 0) {
          console.error("[一鍵強化] 購買發條失敗，診斷資訊：", {
            "session.inVillage": session.inVillage,
            "發條": winderId + " " + winder.name,
            "價格來源": buyInfo.source,
            "價格 price": buyInfo.price,
            "扣款前金幣 goldBefore": goldBeforeBuy,
            "扣款後金幣 goldAfter": session.player.gold
          });
          reason = "buy-failed";
          break;
        }
        totalSpent += buySpent;
        totalBought += 1;
        log("購買" + winder.name + " ×1，花費 " + fmt(buySpent) + " 金幣");
        await sleep(20);
        continue;
      }

      // 2026-09-22 改版後高手／武爾坎努斯的發條每次 0 金幣，不能再用「有沒有扣錢」判斷成功，
      // 改看發條數量有沒有少、或裝備的 enhanceTries 有沒有增加。
      var goldBefore = session.player.gold;
      var materialBefore = have;
      var triesBefore = entry.enhanceTries || 0;
      session.enhance(stackId, winderId);
      var afterEntry = findEntryByStackId(stackId);
      var usedNow = Math.max(0, materialBefore - winderStock(winderId));
      var triesAfter = (afterEntry && afterEntry.enhanceTries) || 0;
      if (usedNow <= 0 && triesAfter <= triesBefore) {
        console.error("[一鍵強化] session.enhance() 沒有執行，診斷資訊：", {
          "session.inVillage": session.inVillage,
          "stackId": stackId,
          "發條": winderId + " " + winder.name,
          "扣款前金幣 goldBefore": goldBefore,
          "扣款後金幣 goldAfter": session.player.gold,
          "發條數量": winderStock(winderId),
          "pendingPrev": afterEntry && afterEntry.pendingPrev
        });
        reason = "enhance-rejected";
        break;
      }
      var spent = Math.max(0, goldBefore - session.player.gold);
      attempts++;
      totalSpent += spent;
      totalUsed += usedNow;

      var keepNote = "";
      if (afterEntry && afterEntry.pendingPrev && typeof session.keepEnhance === "function") {
        var keep = pickKeep(afterEntry.options, afterEntry.pendingPrev, targetGrade, matchGroups);
        var rolledText = rolledKindsText(afterEntry);
        session.keepEnhance(stackId, keep);
        if (keep === "previous") {
          keptPrevious++;
          keepNote = "（洗出 " + rolledText + "，不如上一組，保留上一組）";
        }
      }

      var newEntry = findEntryByStackId(stackId);
      var newGrade = (newEntry && newEntry.options && newEntry.options.grade) || 0;
      var groupsOkNow = meetsAnyGroup(newEntry, matchGroups);
      var matchInfo = (matchGroups && matchGroups.length)
        ? "，需求：" + groupsText(matchGroups) + "（目前" + (groupsOkNow ? "已符合" : "未符合") + "）"
        : "";
      // 屬性對了卻沒停，最常見就是階級還沒到目標，直接在紀錄裡講出來
      if (groupsOkNow && matchGroups && matchGroups.length && newGrade < targetGrade) {
        matchInfo += "——但階級 " + gradeNameOf(newGrade) + " 還沒到目標 " + gradeNameOf(targetGrade) + "，繼續洗";
      }
      log("第 " + attempts + " 次強化：花費 " + fmt(spent) + " 金幣，結果 " + gradeNameOf(newGrade) + " 階（" + rolledKindsText(newEntry) + "）" + keepNote + matchInfo);
      var targetDisplay = document.getElementById("iw-f-target-display");
      if (targetDisplay) targetDisplay.textContent = item.label + "：" + item.name + "（目前 " + gradeNameOf(newGrade) + " 階・" + rolledKindsText(newEntry) + "）";

      if (totalSpent >= budget && !(newGrade >= targetGrade && meetsAnyGroup(newEntry, matchGroups))) { reason = "budget"; break; }

      await sleep(25);
    }

    running = false;
    setFormDisabled(false);

    var finalEntry = findEntryByStackId(stackId);
    var finalGrade = (finalEntry && finalEntry.options && finalEntry.options.grade) || 0;
    var reasonText = {
      "success": "✅ 已達成目標階級！",
      "budget": "⏸️ 已達到（或即將超過）預算上限，停止。",
      "no-material": "⏸️ 發條用完了（沒有勾選自動購買），停止。",
      "no-gold-for-material": "⏸️ 金幣不夠買下一個發條，停止。",
      "no-price": "⚠️ 這種發條買不到（不在商店／這個小時的名品館價目表），停止。",
      "buy-failed": "⚠️ 購買發條沒有成功扣款，真正原因已印在 Console（按 F12 看），麻煩截圖給我看。",
      "enhance-rejected": "⚠️ 這次強化沒有執行（沒用掉發條），真正原因已印在 Console（按 F12 看），麻煩截圖給我看。",
      "pending-choice": "⏸️ 這件裝備在等你選「新的／上一組」，請先在遊戲畫面選好再繼續。",
      "winder-unusable": "⏸️ 這種發條不能用在目前這個階級，停止。",
      "item-gone": "⚠️ 找不到這件裝備了（可能被拆解或移動），停止。",
      "stopped": "⏹️ 已手動停止。",
      "unknown": "發生未知狀況，停止。"
    }[reason] || reason;

    document.getElementById("iw-enhance-summary").innerHTML =
      "<div>" + reasonText + "</div>" +
      "<div style='margin-top:8px;'>" +
      item.label + "：" + item.name + " → <b>" + gradeNameOf(finalGrade) + " 階</b>　（" + rolledKindsText(finalEntry) + "）<br>" +
      "使用發條：<b>" + winder.name + "</b>　用掉 <b>" + totalUsed + "</b> 個<br>" +
      "強化次數：<b>" + attempts + "</b> 次　購買發條：<b>" + totalBought + "</b> 個" +
      (keptPrevious ? "　保留上一組：<b>" + keptPrevious + "</b> 次" : "") + "<br>" +
      "總花費：<b>" + fmt(totalSpent) + "</b> 金幣" +
      "</div>";
  }

  // ==========================================================================
  // 自動煉金 + 自動重生：兩個背景執行功能共用同一個浮動區塊，一起收合／展開。
  // ==========================================================================
  var alchemyFabWrap = document.createElement("div");
  alchemyFabWrap.id = "iw-alchemy-fab-wrap";
  alchemyFabWrap.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:999999;display:flex;flex-direction:column;gap:8px;align-items:flex-start;";

  var alchemyRow = document.createElement("div");
  alchemyRow.style.cssText = "display:flex;align-items:center;gap:6px;";

  var alchemyFab = document.createElement("button");
  alchemyFab.id = "iw-alchemy-fab";
  alchemyFab.textContent = "🧪 自動煉金";
  alchemyFab.className = "iw-fab iw-fab-go";
  alchemyFab.style.cssText = "padding:10px 18px;font-size:14px;";

  var alchemyHideBtn = document.createElement("button");
  alchemyHideBtn.title = "隱藏這個區塊（不會中斷背景執行）";
  alchemyHideBtn.textContent = "×";
  alchemyHideBtn.className = "iw-fab";
  alchemyHideBtn.style.cssText = "border-radius:50%;width:26px;height:26px;line-height:20px;padding:0;font-size:13px;";

  alchemyRow.appendChild(alchemyFab);
  alchemyRow.appendChild(alchemyHideBtn);
  alchemyFabWrap.appendChild(alchemyRow);

  var respawnFab = document.createElement("button");
  respawnFab.id = "iw-respawn-fab";
  respawnFab.textContent = "🔄 自動重生：關閉";
  respawnFab.className = "iw-fab";
  respawnFab.style.cssText = "padding:9px 16px;font-size:13px;align-self:stretch;";
  // 遊戲本身已經在地圖上方加了「定時自動重生」按鈕，這個功能不需要了，先隱藏起來。
  // 按鈕沒顯示就按不到，respawnEnabled 一直是 false，下面的重生迴圈不會跑；要恢復時把這行拿掉就好。
  respawnFab.style.display = "none";
  alchemyFabWrap.appendChild(respawnFab);

  var alchemyShowBtn = document.createElement("button");
  alchemyShowBtn.id = "iw-alchemy-show-btn";
  alchemyShowBtn.title = "顯示自動煉金按鈕";
  alchemyShowBtn.textContent = "🧪";
  alchemyShowBtn.className = "iw-fab iw-fab-go";
  alchemyShowBtn.style.cssText = "position:fixed;left:18px;bottom:18px;z-index:999999;display:none;" +
    "border-radius:50%;width:42px;height:42px;padding:0;font-size:17px;";

  document.body.appendChild(alchemyFabWrap);
  document.body.appendChild(alchemyShowBtn);

  // 讓收合後的圓點可以拖到畫面上任何地方（不擋到遊戲介面）。
  // 滑鼠（電腦）用 mousedown/mousemove/mouseup，觸控（手機）另外用 touchstart/touchmove/touchend，
  // 兩套事件完全分開處理，不要互相干擾；同時要能分辨「拖曳」跟「單純點一下」，
  // 不然拖完放開手會被誤判成點擊，把面板展開。
  function makeDraggable(el) {
    el.style.touchAction = "none"; // 避免手機上拖曳時，畫面跟著捲動
    var dragging = false, moved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

    function beginDrag(clientX, clientY) {
      dragging = true;
      moved = false;
      var rect = el.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      startX = clientX;
      startY = clientY;
      // 拖曳期間統一改用 left/top 定位，比較好算邊界
      el.style.left = origLeft + "px";
      el.style.top = origTop + "px";
      el.style.right = "auto";
      el.style.bottom = "auto";
    }
    function moveDrag(clientX, clientY) {
      if (!dragging) return;
      var dx = clientX - startX, dy = clientY - startY;
      if (!moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) moved = true;
      if (!moved) return;
      var maxLeft = window.innerWidth - el.offsetWidth;
      var maxTop = window.innerHeight - el.offsetHeight;
      el.style.left = Math.max(0, Math.min(maxLeft, origLeft + dx)) + "px";
      el.style.top = Math.max(0, Math.min(maxTop, origTop + dy)) + "px";
    }
    function endDrag() {
      dragging = false;
    }

    // ---- 滑鼠（電腦）----
    el.addEventListener("mousedown", function (e) {
      beginDrag(e.clientX, e.clientY);
      e.preventDefault();
    });
    document.addEventListener("mousemove", function (e) {
      if (dragging) moveDrag(e.clientX, e.clientY);
    });
    document.addEventListener("mouseup", function () { endDrag(); });

    // ---- 觸控（手機）----
    el.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      beginDrag(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (!dragging) return;
      var t = e.touches[0];
      moveDrag(t.clientX, t.clientY);
      if (moved) e.preventDefault(); // 真的在拖的時候才擋掉滾動，單純點擊不影響
    }, { passive: false });
    document.addEventListener("touchend", function () { endDrag(); });

    return { wasDragged: function () { return moved; } };
  }
  var showBtnDrag = makeDraggable(alchemyShowBtn);

  alchemyHideBtn.addEventListener("click", function () {
    var wrapRect = alchemyFabWrap.getBoundingClientRect();
    alchemyFabWrap.style.display = "none";
    alchemyShowBtn.style.display = "flex";
    alchemyShowBtn.style.alignItems = "center";
    alchemyShowBtn.style.justifyContent = "center";
    // 圓點出現在原本面板的位置，不要跳回畫面角落
    alchemyShowBtn.style.right = "auto";
    alchemyShowBtn.style.bottom = "auto";
    var maxLeft = window.innerWidth - alchemyShowBtn.offsetWidth;
    var maxTop = window.innerHeight - alchemyShowBtn.offsetHeight;
    alchemyShowBtn.style.left = Math.max(0, Math.min(maxLeft, wrapRect.left)) + "px";
    alchemyShowBtn.style.top = Math.max(0, Math.min(maxTop, wrapRect.top)) + "px";
  });
  alchemyShowBtn.addEventListener("click", function () {
    if (showBtnDrag.wasDragged()) return; // 剛剛是拖曳放開，不是點擊，不要展開面板
    var btnRect = alchemyShowBtn.getBoundingClientRect();
    alchemyShowBtn.style.display = "none";
    alchemyFabWrap.style.display = "flex";
    // 面板出現在圓點原本的位置，不要跳回畫面角落
    alchemyFabWrap.style.right = "auto";
    alchemyFabWrap.style.bottom = "auto";
    var wrapW = alchemyFabWrap.offsetWidth, wrapH = alchemyFabWrap.offsetHeight;
    var maxLeft = window.innerWidth - wrapW;
    var maxTop = window.innerHeight - wrapH;
    alchemyFabWrap.style.left = Math.max(0, Math.min(maxLeft, btnRect.left)) + "px";
    alchemyFabWrap.style.top = Math.max(0, Math.min(maxTop, btnRect.top)) + "px";
  });

  var alchemyBackdrop = null, alchemyModal = null;
  var alchemyRunning = false, alchemyStopFlag = false, alchemyTimer = null;
  var alchemyStats = { attempts: 0, totalSpent: 0, totalMade: 0, targetCount: 0, budget: 0, recipeId: null, recipeName: "" };

  function fmtMs(ms) {
    var s = Math.ceil(ms / 1000);
    return s <= 0 ? "0 秒" : s + " 秒";
  }

  function alchemyLog(msg) {
    var el = document.getElementById("iw-alchemy-log");
    if (!el) return;
    el.style.display = "block";
    el.textContent += msg + "\n";
    el.scrollTop = el.scrollHeight;
  }

  function closeAlchemyModal() {
    if (alchemyBackdrop) { alchemyBackdrop.remove(); alchemyBackdrop = null; alchemyModal = null; }
  }

  function openAlchemyModal() {
    if (alchemyBackdrop) return;
    if (alchemyRunning) { openAlchemyStatusModal(); return; }
    var panel;
    try { panel = session.buildAlchemyPanel(session.usableCounts("bagAndWarehouse")); } catch (err) { panel = null; }
    if (!panel || !panel.recipes || !panel.recipes.length) {
      alert("目前拿不到任何可用的煉金配方（可能不是鐵匠職業，或是身上沒有對應的配方書/材料/技能）。");
      return;
    }

    alchemyBackdrop = document.createElement("div");
    alchemyBackdrop.id = "iw-alchemy-backdrop";
    alchemyModal = document.createElement("div");
    alchemyModal.id = "iw-alchemy-modal";

    var recipeOptions = panel.recipes.map(function (r, idx) {
      var sourceText = r.source.kind === "skill" ? "技能：" + r.source.name : "配方書：" + r.source.name;
      var costText = r.gold ? "，" + fmt(r.gold) + " 金幣" : "，免費";
      return '<option value="' + idx + '">' + r.productName + " ×" + r.count + "（" + sourceText + costText + "，成功率 " + r.rate + "%）</option>";
    }).join("");

    alchemyModal.innerHTML =
      '<button id="iw-alchemy-close">✕</button>' +
      '<h2>🧪 自動煉金</h2>' +
      '<label>選擇配方</label>' +
      '<select id="iw-a-recipe">' + recipeOptions + '</select>' +
      '<div id="iw-a-recipe-info" class="iw-target" style="margin-top:8px;"></div>' +
      '<label>要重複製作幾次？（0 = 不限制，一直做到你按停止或做不下去為止）</label>' +
      '<input type="number" id="iw-a-count" min="0" step="1" value="0">' +
      '<label>最大金幣預算（配方免費的話這欄沒作用）</label>' +
      '<input type="number" id="iw-a-budget" min="0" step="1000" value="' + fmtRaw(session.player.gold) + '">' +
      '<div class="iw-btnrow">' +
      '<button class="iw-btn" id="iw-a-cancel">取消</button>' +
      '<button class="iw-btn primary" id="iw-a-start">開始（背景執行，可離開此畫面）</button>' +
      '</div>' +
      '<div id="iw-alchemy-log" style="display:none;"></div>' +
      '<div id="iw-alchemy-summary"></div>';

    alchemyBackdrop.appendChild(alchemyModal);
    document.body.appendChild(alchemyBackdrop);

    var recipeSelect = document.getElementById("iw-a-recipe");
    var infoBox = document.getElementById("iw-a-recipe-info");
    function updateRecipeInfo() {
      var r = panel.recipes[Number(recipeSelect.value)];
      var matsText = r.mats.length ? r.mats.map(function (m) { return m.name + " ×" + m.need + "（庫存 " + m.have + "）"; }).join("、") : "無需材料";
      var cd = r.readyAtMs > Date.now() ? "，目前冷卻中，還要等 " + fmtMs(r.readyAtMs - Date.now()) : "";
      infoBox.textContent = "材料：" + matsText + cd + (r.blocked ? "（目前狀態：" + r.blocked + "）" : "");
    }
    recipeSelect.addEventListener("change", updateRecipeInfo);
    updateRecipeInfo();

    document.getElementById("iw-alchemy-close").addEventListener("click", closeAlchemyModal);
    document.getElementById("iw-a-cancel").addEventListener("click", function () {
      if (alchemyRunning) { alchemyStopFlag = true; } else { closeAlchemyModal(); }
    });
    alchemyBackdrop.addEventListener("click", function (e) { if (e.target === alchemyBackdrop && !alchemyRunning) closeAlchemyModal(); });

    document.getElementById("iw-a-start").addEventListener("click", function () {
      var chosen = panel.recipes[Number(recipeSelect.value)];
      var targetCount = Number(document.getElementById("iw-a-count").value) || 0;
      var budget = Number(document.getElementById("iw-a-budget").value) || 0;
      startAlchemyRun(chosen.id, targetCount, budget, chosen.productName);
    });
  }

  function openAlchemyStatusModal() {
    alchemyBackdrop = document.createElement("div");
    alchemyBackdrop.id = "iw-alchemy-backdrop";
    alchemyModal = document.createElement("div");
    alchemyModal.id = "iw-alchemy-modal";
    alchemyModal.innerHTML =
      '<button id="iw-alchemy-close">✕</button>' +
      '<h2>🧪 自動煉金（執行中）</h2>' +
      '<div class="iw-target">目前配方：' + escapeHtmlLite(alchemyStats.recipeName) + '</div>' +
      '<div id="iw-alchemy-status-summary" style="margin-top:12px;"></div>' +
      '<div class="iw-btnrow"><button class="iw-btn primary" id="iw-a-stop">⏹️ 停止背景執行</button></div>' +
      '<div id="iw-alchemy-log"></div>';
    document.body.appendChild(alchemyBackdrop);
    alchemyBackdrop.appendChild(alchemyModal);
    updateAlchemyStatusSummary();
    document.getElementById("iw-alchemy-close").addEventListener("click", closeAlchemyModal);
    document.getElementById("iw-a-stop").addEventListener("click", function () { alchemyStopFlag = true; });
    alchemyBackdrop.addEventListener("click", function (e) { if (e.target === alchemyBackdrop) closeAlchemyModal(); });
  }
  function updateAlchemyStatusSummary() {
    var el = document.getElementById("iw-alchemy-status-summary");
    if (!el) return;
    el.innerHTML = "已執行 <b>" + alchemyStats.attempts + "</b> 次　做出約 <b>" + alchemyStats.totalMade + "</b> 個　花費 <b>" + fmt(alchemyStats.totalSpent) + "</b> 金幣";
  }
  function escapeHtmlLite(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  function fmtRaw(n) { return Math.floor(n || 0); }

  function setAlchemyFormDisabled(disabled) {
    ["iw-a-recipe", "iw-a-count", "iw-a-budget", "iw-a-start"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = disabled;
    });
    var cancel = document.getElementById("iw-a-cancel");
    if (cancel) cancel.textContent = disabled ? "停止" : "取消";
  }

  function startAlchemyRun(recipeId, targetCount, budget, recipeName) {
    alchemyRunning = true;
    alchemyStopFlag = false;
    setAlchemyFormDisabled(true);
    alchemyFab.textContent = "🧪 煉金中...";
    alchemyStats = { attempts: 0, totalSpent: 0, totalMade: 0, targetCount: targetCount, budget: budget, recipeId: recipeId, recipeName: recipeName };
    var logEl = document.getElementById("iw-alchemy-log");
    if (logEl) logEl.textContent = "";
    var summaryEl = document.getElementById("iw-alchemy-summary");
    if (summaryEl) summaryEl.innerHTML = "";

    function findRecipe() {
      var panel;
      try { panel = session.buildAlchemyPanel(session.usableCounts("bagAndWarehouse")); }
      catch (err) { console.error("[自動煉金] buildAlchemyPanel 呼叫失敗，可能是遊戲改版了，請回報作者", err); return null; }
      if (!panel) return null;
      return panel.recipes.find(function (r) { return r.id === recipeId; }) || null;
    }

    function finish(reason) {
      alchemyRunning = false;
      setAlchemyFormDisabled(false);
      alchemyFab.textContent = "🧪 自動煉金";
      var reasonText = {
        "target": "✅ 已達成設定的重複次數。",
        "budget": "⏸️ 已達到（或即將超過）預算上限，停止。",
        "blocked": "⏸️ 這個配方目前做不下去了（材料/金幣/技能不足），停止。",
        "gone": "⚠️ 找不到這個配方了（可能配方書用完，物品已經不在配方清單裡），停止。",
        "stopped": "⏹️ 已手動停止。"
      }[reason] || reason;
      if (summaryEl) {
        summaryEl.innerHTML = "<div>" + reasonText + "</div>" +
          "<div style='margin-top:8px;'>製作次數：<b>" + alchemyStats.attempts + "</b> 次　總共做出：<b>" + alchemyStats.totalMade + "</b> 個<br>" +
          "總花費：<b>" + fmt(alchemyStats.totalSpent) + "</b> 金幣</div>";
      }
      var statusSummaryEl = document.getElementById("iw-alchemy-status-summary");
      if (statusSummaryEl) { updateAlchemyStatusSummary(); statusSummaryEl.innerHTML += "<div style='margin-top:8px;'>" + reasonText + "</div>"; }
    }

    function step() {
      if (window.__iwAlchemyGeneration !== myAlchemyGeneration) return; // 這個 loader 已經被重新載入取代，舊的迴圈自己停下來
      if (alchemyStopFlag) { finish("stopped"); return; }
      if (alchemyStats.targetCount > 0 && alchemyStats.attempts >= alchemyStats.targetCount) { finish("target"); return; }
      if (alchemyStats.budget > 0 && alchemyStats.totalSpent >= alchemyStats.budget) { finish("budget"); return; }

      var recipe = findRecipe();
      if (!recipe) { finish("gone"); return; }

      var now = Date.now();
      if (recipe.readyAtMs > now) {
        alchemyTimer = setTimeout(step, recipe.readyAtMs - now + 50);
        return;
      }
      if (recipe.blocked) { finish("blocked"); return; }
      if (alchemyStats.budget > 0 && alchemyStats.totalSpent + (recipe.gold || 0) > alchemyStats.budget) { finish("budget"); return; }

      var goldBefore = session.player.gold;
      var ok = session.craftBomb(recipeId);
      if (!ok) { finish("blocked"); return; }
      var spent = Math.max(0, goldBefore - session.player.gold);
      alchemyStats.attempts++;
      alchemyStats.totalSpent += spent;
      alchemyStats.totalMade += recipe.count || 0;
      alchemyLog("第 " + alchemyStats.attempts + " 次：花費 " + fmt(spent) + " 金幣，預期做出 " + recipe.count + " 個（成功率 " + recipe.rate + "%，失敗會扣材料但拿不到成品）");
      updateAlchemyStatusSummary();

      var cooldownMs = 1200; // 讀不到新的 readyAtMs 時，先給一個保守的預設間隔，避免無冷卻配方緊繃連打
      var afterPanel = null;
      try { afterPanel = session.buildAlchemyPanel(session.usableCounts("bagAndWarehouse")); } catch (err) { /* 讀不到就用預設間隔，不中斷流程 */ }
      var afterRecipe = afterPanel && afterPanel.recipes.find(function (r) { return r.id === recipeId; });
      if (afterRecipe && afterRecipe.readyAtMs > Date.now()) cooldownMs = afterRecipe.readyAtMs - Date.now() + 50;
      alchemyTimer = setTimeout(step, cooldownMs);
    }

    step();
  }

  alchemyFab.addEventListener("click", function () {
    if (alchemyRunning) {
      if (alchemyBackdrop) { closeAlchemyModal(); } // 已經在跑，點按鈕只是切換要不要看視窗，不會中斷背景執行
      else openAlchemyModal();
    } else {
      openAlchemyModal();
    }
  });

  // ==========================================================================
  // 自動重生：怪物池死光時（左上角那顆重生圈圈亮起的時機）自動幫忙按下去。
  // 純粹是布林值判斷（session.canRespawnPool），不用開視窗設定，一顆開關按鈕就夠。
  // 按鈕本體已經在上面跟自動煉金共用同一個浮動區塊建立好了，這裡只接邏輯。
  // ==========================================================================
  var respawnEnabled = false, respawnTimer = null;
  window.__iwRespawnGeneration = (window.__iwRespawnGeneration || 0) + 1;
  var myRespawnGeneration = window.__iwRespawnGeneration;

  function respawnLoop() {
    if (window.__iwRespawnGeneration !== myRespawnGeneration) return; // 舊的 loader 實例，自己停下來
    if (!respawnEnabled) return;
    try {
      if (session.canRespawnPool) {
        session.respawnPool();
        console.log("[自動重生] 怪物池空了，已自動重生。");
      }
    } catch (err) {
      console.error("[自動重生] 檢查/重生時發生錯誤", err);
    }
    respawnTimer = setTimeout(respawnLoop, 1000);
  }

  respawnFab.addEventListener("click", function () {
    respawnEnabled = !respawnEnabled;
    respawnFab.textContent = "🔄 自動重生：" + (respawnEnabled ? "開啟中" : "關閉");
    respawnFab.classList.toggle("iw-fab-on", respawnEnabled);
    if (respawnEnabled) respawnLoop();
    else if (respawnTimer) clearTimeout(respawnTimer);
  });

  console.log("[一鍵強化] loader 已就緒，裝備卡片上「25,000」按鈕前面應該會看到「⚡強化」按鈕。");
})();
