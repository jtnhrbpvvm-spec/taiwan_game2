// 用法：node tools/check-dmg.js [角色數]
// 用遊戲本體驗算 dmg.js：隨機產生角色，比對屬性觸發率／命中／破甲／秘典／種族剋制，並用遊戲的 resolveHit 抽樣比對平均傷害
const fs = require("fs"), path = require("path");
const { load } = require("./game-vm.js");
const src = fs.readFileSync(path.join(__dirname, "..", "dmg.js"), "utf8");
const win = {}; new Function("window", src)(win); const DMG = win.DMG;

const g = load();
g.run(`
function __mk(){
  const pick = a => a[Math.floor(Math.random() * a.length)], chance = x => Math.random() < x;
  player.realmIndex = 8; player.stage = 5; player.level = 1200; player.hp = 10; player.maxHp = 10;
  player.equipment = {};
  const subKeys = ["ice","fire","poison","metal","thunder","fx:剋敵","def","eva","atkPct","fx:法爆"];
  const talK = talismanTypes.map(t => t.key);
  Object.keys(gearBySlot).forEach(slot => {
    if (chance(0.1)) return;
    const def = pick(gearBySlot[slot]), q = pick(["藍色","紫色","橙色","白金","白金"]);
    const eq = createGearEquip(def, getQualityObj(q), 50, 1000, true);
    if (chance(0.5)) eq.element = pick(["金","木","水","火","土"]);
    eq.subs = []; subKeys.forEach(k => { if (chance(0.3)) eq.subs.push([k, k.startsWith("fx:") || k.endsWith("Pct") ? 0.03 : 4]); });
    if (q === "白金") eq.legend = pick(GEAR_LEGENDS).id; else delete eq.legend;
    eq.sockets = chance(0.5) ? [0,1,2].map(() => chance(0.7) ? { type: pick(talK), grade: 1 + Math.floor(Math.random() * 4) } : null) : undefined;
    if (chance(0.4)) eq.raceFx = { race: pick(RACE_KEYS), v: 0.03 }; else delete eq.raceFx;
    player.equipment[slot] = eq;
  });
  // 一部分角色硬湊成同五行，才測得到共鳴
  if (chance(0.5)) { const e1 = pick(["金","木","水","火","土"]), e2 = pick(["金","木","水","火","土"]); let i = 0; for (const k in player.equipment) { player.equipment[k].element = chance(0.6) ? e1 : e2; i++; } }
  player.titles = titleList.filter(() => chance(0.3)).map(t => t.id);
  player.fireCollection = {}; Object.keys(strangeFireById).forEach(id => { if (chance(0.3)) player.fireCollection[id] = 1; });
  const ps = partnerList.filter(() => chance(0.2)).map(p => p.id);
  player.partners = ps.slice(); player.partnerTeam = ps.slice(0, 2); player.partnerBond = {}; ps.forEach(id => player.partnerBond[id] = { pts: chance(0.5) ? 99999 : 0 });
  const rg = pick(APTITUDE_ROOT_GROUPS), pg = pick(APTITUDE_PHYSIQUE_GROUPS);
  player.aptitude = { root: rg.pick ? { group: rg.id, id: pick(rg.pick).id } : { group: rg.id, elems: ["金","木","水","火","土"].sort(() => Math.random() - 0.5).slice(0, rg.elems || 1) }, physique: pick(pg.pick).id };
  player.profession = pick(professions).id; player.proficiency = { [player.profession]: pick(PROF_RANK_EXP) };
  player.talents = {}; Object.keys(TALENT_NODE_BY_ID).forEach(id => { if (chance(0.3)) player.talents[id] = 1 + Math.floor(Math.random() * 3); });
  talentCacheKey = null;
  player.elementStudy = {}; elementBooks.forEach(b => { if (chance(0.7)) player.elementStudy[b.key] = Math.floor(Math.random() * 1000); });
  player.yuanshen = chance(0.4) ? { type: pick(Object.keys(YUANSHEN_TYPES)) } : null;
  player.spells = spellList.filter(() => chance(0.15)).map(s => s.id);
  player.raceKills = { beast: pick([0, 500, 20000]), ghost: pick([0, 150]), demon: pick([0, 25000]), heart: pick([0, 60]) };
  player.raceTreasures = [{ id: 1, race: pick(RACE_KEYS), grade: 2 }, { id: 2, race: pick(RACE_KEYS), grade: 1 }]; player.raceTreasureSlots = chance(0.7) ? [1, 2] : [1, null];
  const a = getPlayerCombatAttrs(), gd = {};
  for (const k in player.equipment) { const d = getGearDef(player.equipment[k]); if (d) gd[player.equipment[k].gearId] = { fx: d.effect, set: d.set }; }
  const au = getSpellAuraBonus();
  return JSON.stringify({ p: player, a, elem: getPlayerElement(), agi: nv2Stat('agi'), aura: au, rank: getProfRank(player.profession),
    team: getPartnerTeam().map(x => [x.id, getBondLevel(x.id).lv >= 5]), gd, art: Object.keys(player.equipment).filter(k => equipTypes[k] === "artifact"), fxAll: getGearEffects(), tot: getBonusTotals() });
}
function __mc(n, t, mag, raw, power){
  const base = getPlayerCombatAttrs(); let sum = 0; const els = ["金","木","水","火","土"];
  for (let i = 0; i < n; i++) { const r = resolveHit(raw, { attrs: base, power, dmgType: mag ? 'mag' : 'phys' }, { attrs: { def: t.def, eva: t.eva, race: t.race, nature: t.nature, element: els[i % 5] }, status: newStatus() }); sum += r.dmg; }
  return sum / n;
}`);
const spellList = g.run(`typeof spellList`), spellVar = spellList === "undefined" ? g.run(`Object.keys(this).filter(k=>/spell/i.test(k)).join(",")`) : "ok";
if (spellVar !== "ok") { console.log("spell var candidates:", spellVar); }
let bad = 0, n = 0; const N = +process.argv[2] || 300;
const near = (x, y, e) => Math.abs((x || 0) - (y || 0)) <= (e || 1e-9) * Math.max(1, Math.abs(y || 0));
for (let i = 0; i < N; i++) {
  const T = JSON.parse(g.run("__mk()"));
  const ctx = { gdef: eq => T.gd[eq.gearId] || null, elem: T.elem, agi: T.agi, aura: T.aura, rank: T.rank, team: T.team, artifact: k => T.art.includes(k) };
  const A = DMG.attrs(T.p, ctx), ga = T.a, diff = [];
  DMG.AFF.concat(DMG.VAR).forEach(k => { if (!near(A.aff[k], ga[k])) diff.push(`${k}: ${A.aff[k]} vs ${ga[k]}`); });
  if (!near(A.pen, ga.armorPen)) diff.push(`pen ${A.pen} vs ${ga.armorPen}`);
  if (!near(A.evaPen, ga.evaPen)) diff.push(`evaPen ${A.evaPen} vs ${ga.evaPen}`);
  ["metal", "fire", "ice", "thunder", "poison"].forEach(k => { if (!near(A.book[k], ga.book[k])) diff.push(`book.${k} ${A.book[k]} vs ${ga.book[k]}`); });
  ["金", "木", "水", "火", "土"].forEach(k => { if (!near(A.book.wuxing[k], ga.book.wuxing[k])) diff.push(`book.wx${k}`); });
  for (const k in ga.raceDmg) { const v = DMG.race(A, k, 0).v; if (!near(v, ga.raceDmg[k])) diff.push(`race.${k} ${v} vs ${ga.raceDmg[k]}`); }
  if ((A.nature || null) !== (ga.nature || null)) diff.push(`nature ${A.nature} vs ${ga.nature}`);
  if (!!A.ignoreCounter !== !!ga.ignoreCounter) diff.push("ignoreCounter");
  if (!near(A.fx["剋敵"] || 0, ga.counterBonus)) diff.push("counterBonus"); if (!near(A.fx["焚燼"] || 0, ga.burnBonus)) diff.push("burnBonus"); if (!near(A.fx["蝕骨"] || 0, ga.poisonBonus)) diff.push("poisonBonus");
  const gy = ga.yuanshen; if (!!gy !== !!A.ys || (gy && (gy.elem !== A.ys[0] || gy.affix !== A.ys[1] || gy.pct !== A.ys[2]))) diff.push("yuanshen");
  if (!near(A.elemDmg, T.elem ? T.tot["elemDmg:" + T.elem] || 0 : 0)) diff.push("elemDmg");
  if (process.argv[3]) (global.__dump = global.__dump || []).push({ p: T.p, a: T.a, elem: T.elem, agi: T.agi });
  n++; if (diff.length) { bad++; if (bad <= 6) console.log("DIFF#" + i, diff.join(" | ")); }
  // 抽樣比對平均傷害（每 30 個角色做一次）
  if (i % 30 === 0) {
    const t = { def: 15, eva: 8 + Math.round(T.agi * 0.08), race: "beast", nature: i % 60 === 0 ? "dark" : null }, mag = i % 60 === 30;
    const mc = +g.run(`__mc(400000, ${JSON.stringify(t)}, ${mag}, 100, 100)`);
    const h = DMG.hit(A, { raw: 100, power: 100, mag, path: "proc", crit: mag ? ga.magCrit : ga.crit, critDmg: ga.critDmg, target: t, vuln: 1, race: DMG.race(A, "beast", 0).v });
    const off = (h.direct - mc) / mc * 100;
    console.log(`MC#${i} game ${mc.toFixed(3)}  page ${h.direct.toFixed(3)}  差 ${off.toFixed(2)}%  [金${A.aff.metal} 雷${A.aff.thunder} 暗${A.aff.dark} 光${A.aff.light} 破甲${A.pen} 命中${A.evaPen.toFixed(1)}]`);
    if (Math.abs(off) > 1) bad++;
  }
}
console.log(`共 ${n} 個角色，不一致 ${bad}`);
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(global.__dump));
