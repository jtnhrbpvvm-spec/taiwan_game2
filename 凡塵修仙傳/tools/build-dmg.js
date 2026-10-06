// 用法：node tools/build-dmg.js　重新產生 dmg.js 裡的資料（遊戲更新數值後執行，再跑 node tools/check-dmg.js 驗算）
// 從遊戲本體取出「屬性觸發、命中、破甲、屬性秘典」會用到的各來源數值
const { load } = require("./game-vm.js");
const g = load();
const out = g.run(`(function(){
  const KI = k => /^(ice|fire|poison|metal|thunder|wind|light|dark|hit|freezeResist|burnMax|poisonMax|ignoreCounter)$/.test(k) || /^(cap|elemDmg|elemBoost|special):/.test(k) || /^fx:(破甲|洞察|剋敵|寒徹|焚燼|蝕骨|通玄|首擊|燃魂|斬殺)$/.test(k);
  const f = b => { const o = {}; for (const k in (b || {})) if (KI(k) && b[k]) o[k] = b[k]; return o; };
  const ne = o => Object.keys(o).length > 0;
  const SP = s => { const o = {}; if (s && s.nature) o.nature = s.nature; if (s && s.poisonImmune) o.poisonImmune = 1; return o; };
  const EX = { title: {}, fire: {}, partner: {}, rootPick: {}, rootGroup: {}, aff: {}, phys: {}, prof: {}, set: {}, tal: {}, leg: {}, resSingle: {}, resPure: {}, resDual: {}, fx: {}, ys: {}, talis: {} };
  titleList.forEach(t => { const b = f(t.bonus); if (ne(b)) EX.title[t.id] = b; });
  for (const id in strangeFireById) { const b = f(strangeFireById[id].bonus); if (ne(b)) EX.fire[id] = b; }
  partnerList.forEach(p => { const b = f(p.passive); if (ne(b)) EX.partner[p.id] = b; });
  APTITUDE_ROOT_GROUPS.forEach(gr => {
    if (gr.pick) gr.pick.forEach(r => { const b = f(r.bonus), s = SP(r.special); if (ne(b) || ne(s)) EX.rootPick[r.id] = [b, s]; });
    else { const b = f(gr.bonus), s = SP(gr.special); if (ne(b) || ne(s) || gr.affinity) EX.rootGroup[gr.id] = [b, s, gr.affinity || 0]; }
  });
  for (const e in ROOT_ELEMENT_AFFINITY) { const b = f(ROOT_ELEMENT_AFFINITY[e]); if (ne(b)) EX.aff[e] = b; }
  APTITUDE_PHYSIQUE_GROUPS.forEach(gr => gr.pick.forEach(r => { const b = f(r.bonus), s = SP(r.special); if (ne(b) || ne(s)) EX.phys[r.id] = [b, s]; }));
  professions.forEach(p => { if (KI(p.passive.key)) EX.prof[p.id] = [p.passive.key, p.passive.per]; });
  for (const n in gearSets) { const tiers = gearSetThemes[gearSets[n].theme].map(t => [t.pieces, f(resolveSetTier(n, t).bonus)]).filter(x => ne(x[1])); if (tiers.length) EX.set[n] = tiers; }
  for (const id in TALENT_NODE_BY_ID) { const b = f(TALENT_NODE_BY_ID[id].per); if (ne(b)) EX.tal[id] = b; }
  GEAR_LEGENDS.forEach(l => { const b = f(l.bonus); if (ne(b)) EX.leg[l.id] = b; });
  for (const e in wuxingArrayEffects) { const b = f(wuxingArrayEffects[e].bonus); if (ne(b)) EX.resSingle[e] = b; }
  for (const e in pureRootEffects) { const b = f(pureRootEffects[e].bonus); EX.resPure[e] = [pureRootEffects[e].name, b]; }
  for (const k in dualRootEffects) { const d = dualRootEffects[k]; EX.resDual[k] = d.byMain ? { byMain: Object.fromEntries(Object.entries(d.byMain).map(([e, x]) => [e, [x.name, f(x.bonus)]])) } : [d.name, f(d.bonus)]; }
  EX.resSup = [supremeRootEffect.name, f(supremeRootEffect.bonus)];
  for (const n in gearEffects) if (KI('fx:' + n)) EX.fx[n] = [gearEffects[n].value, gearEffects[n].cap];
  EX.fxTier = GEAR_EFFECT_TIER_MULT;
  for (const t in YUANSHEN_TYPES) { const y = YUANSHEN_TYPES[t]; EX.ys[t] = [y.elem || null, y.affix || null, YUANSHEN_TIERS[y.tier].dmg]; }
  talismanTypes.forEach(t => { if (t.kind === 'race' || KI(t.key)) EX.talis[t.key || t.id || t.type] = { kind: t.kind, race: t.race || null, key: t.key, v: [1, 2, 3, 4].map(gr => { try { return getTalismanValue(t.key || t.id || t.type, gr); } catch (e) { return null; } }) }; });
  EX.C = { AFFIX_CAP, METAL_BONUS, THUNDER_BONUS, BURN_RATE, BURN_TURNS, BURN_MAX_STACKS, POISON_RATE, POISON_TURNS, POISON_MAX_STACKS, LIGHT_BONUS, LIGHT_DARK_COUNTER_BONUS, WUXING_COUNTER_BONUS, WUXING_COUNTERED_PENALTY, RACE_TALISMAN_CAP, RACE_DMG_CAP, hitPer: NV2.hitPer, evaK: NV2.evaK, ELEMENT_BOOK_GAIN, WIND_HIT_MULT, DARK_LIFESTEAL, DARK_MAP_CATEGORIES, ROOT_SINGLE_COUNT, ROOT_SUPREME_SETS, ROOT_PURE_SETS, ROOT_PURE_REST, ROOT_DUAL_SETS, ROOT_DUAL_REST, PARTNER_LV5_PASSIVE_MULT, RACE_TREASURE_CAP, raceGearCap: RACE_GEAR.cap, treasure: RACE_TREASURE_GRADES.map(x => x.bonus), slay: Object.fromEntries(Object.entries(RACE_SLAY_TIERS).map(([k, a]) => [k, a.map(x => [x.kills, x.bonus])])), setQ: GEAR_SET_MIN_QUALITY, wxc: WUXING_COUNTERS };
  EX.books = elementBooks.map(b => [b.key, b.name, b.wuxing || null, b.effect || null]);
  EX.monAttr = monsterAttrsByMapCategory;
  return JSON.stringify(EX);
})()`);
const fs = require("fs"), file = require("path").join(__dirname, "..", "dmg.js");
fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/\/\*EX\*\/[\s\S]*?\/\*EX\*\//, () => "/*EX*/" + out + "/*EX*/"));
const EX = JSON.parse(out);
console.log("EX bytes", out.length, Object.keys(EX).join(","));
