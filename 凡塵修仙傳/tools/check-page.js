// 用法：node tools/check-page.js [角色數]
// 用遊戲本體驗算「屬性與技能.html」從存檔算出來的數字（analyze／hPlayer）：隨機產生角色，
// 比對物理攻擊、術法攻擊、氣血、靈力、暴擊、連擊、防禦、魔防、閃避、命中。差超過 0.5% 算不一致，並列出是哪一項、差多少。
const fs = require("fs"), path = require("path"), vm = require("vm");
const { load } = require("./game-vm.js");
const ROOT = path.join(__dirname, "..");

// ---- 在 Node 裡載入攻略頁的程式（DOM 用假物件）----
function loadPage() {
  const html = fs.readFileSync(path.join(ROOT, "屬性與技能.html"), "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const el = () => new Proxy(function () {}, {
    get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "style" || k === "classList" || k === "dataset" ? el() : k === "length" ? 0 : k === "children" || k === "childNodes" || k === "options" ? [] : k === "value" || k === "innerHTML" || k === "innerText" || k === "textContent" ? "" : k === "checked" || k === "hidden" ? false : el(),
    set: () => true, apply: () => el(), construct: () => el()
  });
  const sb = { console: { log() {}, warn() {}, error() {}, info() {} }, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, requestAnimationFrame: () => 0,
    document: new Proxy({}, { get: (t, k) => k === "querySelectorAll" || k === "getElementsByClassName" ? () => [] : k === "readyState" ? "complete" : el(), set: () => true }),
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    navigator: { userAgent: "node", clipboard: {} }, location: { href: "http://x/", search: "", hash: "", pathname: "/", origin: "http://x" }, history: { replaceState() {} },
    addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }), fetch: () => Promise.reject(new Error("no net")),
    TextEncoder, TextDecoder, URL, URLSearchParams, atob: s => Buffer.from(s, "base64").toString("binary"), btoa: s => Buffer.from(s, "binary").toString("base64"), innerWidth: 400, innerHeight: 800 };
  sb.window = sb; sb.self = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb), errs = [];
  const run = (code, name) => { try { vm.runInContext(code, ctx, { filename: name }); } catch (e) { errs.push(name + ": " + e.message); } };
  run(fs.readFileSync(path.join(ROOT, "dmg.js"), "utf8"), "dmg.js");
  scripts.forEach((s, i) => run(s, "page#" + i));
  return { errs, run: code => vm.runInContext(code, ctx) };
}

const page = loadPage();
if (page.run("typeof analyze + typeof hPlayer") !== "functionfunction") { console.log("攻略頁的程式載入失敗：", page.errs.join(" | ")); process.exit(1); }

const g = load();
g.run(`
[[Number, 0], [String, ""]].forEach(([H, v]) => { const ip = v.__proto__; Object.getOwnPropertyNames(H.prototype).forEach(k => { if (!(k in ip)) ip[k] = H.prototype[k]; }); });
function __mk(seedOpt){
  const pick = a => a[Math.floor(Math.random() * a.length)], chance = x => Math.random() < x, O = seedOpt || {};
  player.realmIndex = O.r != null ? O.r : Math.floor(Math.random() * 16); player.stage = 1 + Math.floor(Math.random() * 10); player.level = pick([1, 50, 300, 1200, 2600, 4000, 6500, 9000, 10000]);
  player.equipment = {}; player.weakened = chance(0.05);
  const subKeys = ["ice","fire","poison","metal","thunder","fx:剋敵","def","eva","atkPct","fx:法爆","mdef","hpPct","physPct","magPct","statPct","strPct","intPct","conPct","sprPct","agiPct","mpPct"];
  const talK = talismanTypes.map(t => t.key);
  const slots = Object.keys(gearBySlot);
  if (!O.noGear) slots.forEach(slot => {
    if (chance(0.08)) return;
    let eq = null;
    // 一部分用遊戲的正式管道產生高等白金裝（圖紙等級、進化白金、太古／遠古、傳奇威能、孔位、種族特效）
    if (chance(0.45) && typeof createPrimalPlatinumGear === 'function') {
      for (let i = 0; i < 60 && !eq; i++) { const e = createPrimalPlatinumGear(pick([1500, 2500, 3500, 5000]), pick([0, 0, 1, 2])); if (e && (e.slot === slot || (getGearDef(e) || {}).slot === slot)) eq = e; }
    }
    if (!eq) {
      const def = pick(gearBySlot[slot]), q = pick(["白色","綠色","藍色","紫色","橙色","白金"]), lv = pick([10, 100, 300, 600, 1000]);
      eq = createGearEquip(def, getQualityObj(q), lv * EQUIP_LEVEL_STAT_MULT * getQualityObj(q).mult, lv, true);
      eq.subs = []; subKeys.forEach(k => { if (chance(0.2)) eq.subs.push([k, k.startsWith("fx:") || k.endsWith("Pct") ? 0.03 : 4]); });
      if (q === "白金") eq.legend = pick(GEAR_LEGENDS).id; else delete eq.legend;
    }
    if (chance(0.5)) eq.element = pick(["金","木","水","火","土"]);
    eq.enhance = pick([0, 0, 5, 10, 15, 20]);
    if (chance(0.5)) eq.sockets = [0,1,2].map(() => chance(0.7) ? { type: pick(talK), grade: 1 + Math.floor(Math.random() * 4) } : null);
    player.equipment[slot] = eq;
  });
  if (chance(0.5)) { const e1 = pick(["金","木","水","火","土"]), e2 = pick(["金","木","水","火","土"]); for (const k in player.equipment) player.equipment[k].element = chance(0.6) ? e1 : e2; }
  player.titles = titleList.filter(() => chance(0.3)).map(t => t.id);
  player.fireCollection = {}; Object.keys(strangeFireById).forEach(id => { if (chance(0.3)) player.fireCollection[id] = 1; });
  const ps = partnerList.filter(() => chance(0.2)).map(p => p.id);
  player.partners = ps.slice(); player.partnerTeam = ps.slice(0, 2); player.partnerBond = {}; ps.forEach(id => player.partnerBond[id] = { pts: chance(0.5) ? 99999 : 0 });
  const rg = pick(APTITUDE_ROOT_GROUPS), pg = pick(APTITUDE_PHYSIQUE_GROUPS);
  player.aptitude = chance(0.9) ? { root: rg.pick ? { group: rg.id, id: pick(rg.pick).id } : { group: rg.id, elems: ["金","木","水","火","土"].sort(() => Math.random() - 0.5).slice(0, rg.elems || 1) }, physique: pick(pg.pick).id } : null;
  player.profession = pick(professions).id; player.proficiency = { [player.profession]: pick(PROF_RANK_EXP) };
  player.talents = {}; Object.keys(TALENT_NODE_BY_ID).forEach(id => { if (chance(0.3)) player.talents[id] = 1 + Math.floor(Math.random() * (TALENT_NODE_BY_ID[id].max || 1)); });
  talentCacheKey = null;
  player.elementStudy = {}; elementBooks.forEach(b => { if (chance(0.7)) player.elementStudy[b.key] = Math.floor(Math.random() * 1000); });
  player.yuanshen = chance(0.4) ? { type: pick(Object.keys(YUANSHEN_TYPES)) } : null;
  player.spells = spellList.filter(() => chance(0.25)).map(s => s.id); player.beasts = []; player.buffTimer = 0; player.learnedSkills = [];
  player.pillUsed = {}; player.studyCounts = {}; ["str","int","con","spr","agi"].forEach(k => { player.pillUsed[k] = pick([0, 50, 200, 200]); player.studyCounts[k] = pick([0, 80, 200]); });
  player.raceKills = { beast: pick([0, 500, 20000]), ghost: pick([0, 150]), demon: pick([0, 25000]), heart: pick([0, 60]) };
  // 宗門（戰力倍率進增益、傳承武器）、出戰靈寵（青蒼狼／九幽蛟龍的被動）、金丹與元嬰品級
  { const all = []; sectData.forEach(c => c.items.forEach(it => all.push(Object.assign({}, it, { tier: c.tier })))); player.sect = chance(0.8) ? JSON.parse(JSON.stringify(pick(all))) : null; }
  player.beasts = ['fox', 'wolf', 'dragon'].filter(() => chance(0.3)).map(id => ({ id, alive: true, active: true, skills: [] }));
  player.goldenCore = chance(0.7) ? { core: player.realmIndex > 2 ? Math.floor(Math.random() * CORE_GRADES.length) : null, infant: player.realmIndex > 3 ? Math.floor(Math.random() * INFANT_GRADES.length) : null } : null;
  player.reincarnateBonus = chance(0.2) ? { nv2Hp: pick([5, 40]) } : null;
  player.raceTreasures = [{ id: 1, race: pick(RACE_KEYS), grade: 2 }, { id: 2, race: pick(RACE_KEYS), grade: 1 }]; player.raceTreasureSlots = chance(0.7) ? [1, 2] : [1, null];
  player.maxHp = player.hp = getMaxHp(); gearWaveRound = 99;
  const a = getPlayerCombatAttrs();
  const st = {}; ["str","int","con","spr","agi"].forEach(k => st[k] = nv2Stat(k));
  return JSON.stringify({ p: player, game: { phys: getPhysAttack(), mag: getMagAttack(), hp: getMaxHp(), mp: typeof getMaxMp === 'function' ? getMaxMp() : null, crit: a.crit, magCrit: a.magCrit, critDmg: a.critDmg, combo: nv2Combo(),
    def: a.def, mdef: a.mdef, eva: a.eva, hit: a.evaPen, pen: a.armorPen, str: st.str, int: st.int, con: st.con, spr: st.spr, agi: st.agi } });
}`);

const N = +process.argv[2] || 200, KEYS = ["str", "int", "con", "spr", "agi", "phys", "mag", "hp", "mp", "crit", "magCrit", "critDmg", "combo", "def", "mdef", "eva", "hit", "pen"];
const stat = {}; KEYS.forEach(k => stat[k] = { n: 0, low: 0, high: 0, worst: 0, ex: "" });
let badChars = 0;
for (let i = 0; i < N; i++) {
  const T = JSON.parse(g.run(`__mk(${JSON.stringify({ noGear: i % 10 === 9 })})`)), G = T.game;
  let M;
  try {
    M = JSON.parse(page.run(`(function(p){ const a = analyze(p), P = hPlayer(a);
      return JSON.stringify({ str: a.stats.str.total, int: a.stats.int.total, con: a.stats.con.total, spr: a.stats.spr.total, agi: a.stats.agi.total,
        phys: a.phys, mag: a.mag, hp: a.hp, mp: a.mp, crit: a.crit / 100, magCrit: a.magCrit / 100, critDmg: a.critDmg, combo: a.combo / 100, def: P.def, mdef: P.mdef, eva: P.eva, hit: a.ex.evaPen, pen: a.ex.pen }); })(${JSON.stringify(T.p)})`));
  } catch (e) { console.log(`#${i} 攻略頁計算出錯：${e.message}`); badChars++; continue; }
  let any = false;
  KEYS.forEach(k => {
    if (G[k] == null) return;
    const gv = +G[k] || 0, mv = +M[k] || 0, d = Math.abs(gv) > 1e-9 ? (mv - gv) / Math.abs(gv) : (Math.abs(mv) > 1e-9 ? 1 : 0), S = stat[k];
    if (Math.abs(d) > 0.005 && Math.abs(mv - gv) > 0.011) { S.n++; any = true; if (d < 0) S.low++; else S.high++; if (Math.abs(d) > Math.abs(S.worst)) { S.worst = d; S.ex = `#${i} 境界 ${T.p.realmIndex} Lv.${T.p.level}：遊戲 ${+gv.toFixed(3)}、攻略 ${+mv.toFixed(3)}`; } }
  });
  if (any) { badChars++; if (process.argv[3]) (global.__bad = global.__bad || []).push(T); }
}
const NAME = { str: "力量", int: "悟性", con: "體質", spr: "靈力", agi: "敏捷", phys: "物理攻擊", mag: "術法攻擊", hp: "氣血", mp: "靈力上限", crit: "暴擊率", magCrit: "魔法暴擊率", critDmg: "暴擊傷害", combo: "連擊率", def: "防禦", mdef: "魔防", eva: "閃避", hit: "命中", pen: "破甲" };
KEYS.forEach(k => { const S = stat[k]; if (S.n) console.log(`${NAME[k].padEnd(6, "　")} 不一致 ${String(S.n).padStart(3)} 個（攻略偏低 ${S.low}、偏高 ${S.high}），最大差 ${(S.worst * 100).toFixed(1)}%　例：${S.ex}`); });
console.log(`共 ${N} 個角色，不一致 ${badChars}`);
if (process.argv[3] && global.__bad) fs.writeFileSync(process.argv[3], JSON.stringify(global.__bad.slice(0, 20)));
