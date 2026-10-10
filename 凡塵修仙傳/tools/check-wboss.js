// 用法：node tools/check-wboss.js [角色數] [每隻 Boss 場數]
// 用遊戲本體驗算 dmg.js 的世界 Boss 模擬（DMG.wboss）：隨機產生角色，讓遊戲自己的回合函式實際打，再跟模擬比「30 回合平均傷害」與「撐滿 30 回合的比例」
//   平均傷害差超過 4%、或撐滿比例差超過 6 個百分點算不一致
const fs = require("fs"), path = require("path");
const { load } = require("./game-vm.js");
const win = {}; new Function("window", fs.readFileSync(path.join(__dirname, "..", "dmg.js"), "utf8"))(win); const DMG = win.DMG;
const g = load();
g.run(`
[[Number, 0], [String, ""]].forEach(([H, v]) => { const ip = v.__proto__; Object.getOwnPropertyNames(H.prototype).forEach(k => { if (!(k in ip)) ip[k] = H.prototype[k]; }); });
function __mk(){
  const pick = a => a[Math.floor(Math.random() * a.length)], chance = x => Math.random() < x;
  player.realmIndex = 8 + Math.floor(Math.random() * 8); player.stage = 1 + Math.floor(Math.random() * 10); player.level = 1200 + Math.floor(Math.random() * 6000);
  player.equipment = {}; player.weakened = false;
  const subKeys = ["ice","fire","poison","metal","thunder","fx:剋敵","def","eva","atkPct","fx:法爆","mdef","hpPct"];
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
  if (chance(0.5)) { const e1 = pick(["金","木","水","火","土"]), e2 = pick(["金","木","水","火","土"]); for (const k in player.equipment) player.equipment[k].element = chance(0.6) ? e1 : e2; }
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
  player.spells = spellList.filter(() => chance(0.15)).map(s => s.id); player.beasts = []; player.buffTimer = 0;
  player.raceKills = { beast: pick([0, 500, 20000]), ghost: pick([0, 150]), demon: pick([0, 25000]), heart: pick([0, 60]) };
  player.raceTreasures = [{ id: 1, race: pick(RACE_KEYS), grade: 2 }, { id: 2, race: pick(RACE_KEYS), grade: 1 }]; player.raceTreasureSlots = chance(0.7) ? [1, 2] : [1, null];
  player.maxHp = player.hp = getMaxHp(); gearWaveRound = 99;   // 先手盾、護體是野外每波才有的狀態，世界 Boss 開打時一般不會生效
  const a = getPlayerCombatAttrs(), gd = {};
  for (const k in player.equipment) { const d = getGearDef(player.equipment[k]); if (d) gd[player.equipment[k].gearId] = { fx: d.effect, set: d.set }; }
  return JSON.stringify({ p: player, a, elem: getPlayerElement(), agi: nv2Stat('agi'), aura: getSpellAuraBonus(), rank: getProfRank(player.profession),
    team: getPartnerTeam().map(x => [x.id, getBondLevel(x.id).lv >= 5]), gd, art: Object.keys(player.equipment).filter(k => equipTypes[k] === "artifact"),
    hp: getMaxHp(), phys: getPhysAttack(), mag: getMagAttack(), combo: nv2Combo() });
}
// 照 startWorldBossFight 組出一場戰鬥，用遊戲自己的 wbRound 打到結束（不送出、不動畫）
wbEndFight = function () { if (wbFight) wbFight.over = true; };
function __wb(bi, N){
  const B = WB_BOSSES[bi], out = [];
  let sum = 0, live = 0;
  for (let i = 0; i < N; i++) {
    const b = wbBossStats(B), phys = getPhysAttack(), mag = getMagAttack(), aura = combineAuras(B.auras);
    const f = wbFight = { B, bid: "x", cap: Infinity, hp0: 4e8, round: 0, over: false, speed: 1, tid: 0, aura, dealt: 0,
      e: { atk: b.atk * auraSelfAtkMult(aura), attrs: auraSelfAttrs(b.attrs, aura), st: newStatus(), max: 4e8 / combatScale() },
      p: { atk: Math.max(phys, mag) * ZHENMO_PLAYER_SKILL_MULT * auraPlayerAtkMult(aura), hp: getMaxHp(), max: getMaxHp(), attrs: auraPlayerAttrs(getPlayerCombatAttrs(), aura), st: newStatus(), dmgType: mag > phys ? 'mag' : undefined },
      eType: ['demon', 'heart'].includes(B.race) ? 'mag' : undefined };
    let guard = 0; while (!f.over && guard++ < 100) wbRound(true);
    sum += f.dealt; if (f.round >= WB.rounds && f.p.hp > 0) live++;
  }
  wbFight = null;
  return JSON.stringify({ avg: sum / N, live: live / N });
}`);
const NC = +process.argv[2] || 12, N = +process.argv[3] || 3000, pc = v => (v * 100).toFixed(0).padStart(3) + "%";
let bad = 0, rows = 0;
for (let i = 0; i < NC; i++) {
  const T = JSON.parse(g.run("__mk()")), ga = T.a;
  const ctx = { gdef: eq => T.gd[eq.gearId] || null, elem: T.elem, agi: T.agi, aura: T.aura, rank: T.rank, team: T.team, artifact: k => T.art.includes(k) };
  const A = DMG.attrs(T.p, ctx);
  const I = { A, r: T.p.realmIndex, s: T.p.stage, hp: T.hp, phys: T.phys, mag: T.mag, crit: ga.crit, magCrit: ga.magCrit, critDmg: ga.critDmg, combo: T.combo, def: ga.def, mdef: ga.mdef, eva: ga.eva };
  console.log(`#${i + 1} 境界 ${T.p.realmIndex} 階 ${T.p.stage}　氣血 ${T.hp} 物攻 ${T.phys} 術攻 ${T.mag} 防禦 ${ga.def.toFixed(1)} 魔防 ${ga.mdef.toFixed(1)} 閃避 ${ga.eva.toFixed(1)} 五行 ${T.elem || "無"}`);
  DMG.EX.wb.boss.forEach((B, bi) => {
    const R = JSON.parse(g.run(`__wb(${bi}, ${N})`)), S = DMG.wboss(I, bi, { n: 6000, seed: 7 + i * 10 + bi });
    const dAvg = R.avg > 0 ? (S.avg - R.avg) / R.avg : 0, dLive = S.live - R.live, off = Math.abs(dAvg) > 0.04 || Math.abs(dLive) > 0.06;
    rows++; if (off) bad++;
    console.log(`   ${B.n.padEnd(5, "　")} 遊戲 平均 ${R.avg.toFixed(1).padStart(9)}・撐滿 ${pc(R.live)} ｜ 模擬 平均 ${S.avg.toFixed(1).padStart(9)}・撐滿 ${pc(S.live)}　差 ${(dAvg * 100).toFixed(1)}%${off ? "  ← 不一致" : ""}`);
  });
}
console.log(`共 ${rows} 組，不一致 ${bad}`);
