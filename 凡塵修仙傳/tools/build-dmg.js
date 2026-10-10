// 用法：node tools/build-dmg.js　重新產生 dmg.js 裡的資料（遊戲更新數值後執行，再跑 node tools/check-dmg.js 驗算）
// 從遊戲本體取出「屬性觸發、命中、破甲、屬性秘典」會用到的各來源數值
const { load } = require("./game-vm.js");
const g = load();
const out = g.run(`(function(){
  const KI = k => /^(ice|fire|poison|metal|thunder|wind|light|dark|hit|def|eva|mdef|regen|freezeResist|burnMax|poisonMax|ignoreCounter)$/.test(k) || /^(cap|elemDmg|elemBoost|special):/.test(k) || /^fx:/.test(k);
  const f = b => { const o = {}; for (const k in (b || {})) if (KI(k) && b[k]) o[k] = b[k]; return o; };
  const ne = o => Object.keys(o).length > 0;
  const SP = s => { const o = {}; if (s && s.nature) o.nature = s.nature; if (s && s.poisonImmune) o.poisonImmune = 1; if (s && s.ambushMult) o.ambushMult = s.ambushMult; return o; };
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
  EX.C = { AFFIX_CAP, METAL_BONUS, THUNDER_BONUS, BURN_RATE, BURN_TURNS, BURN_MAX_STACKS, POISON_RATE, POISON_TURNS, POISON_MAX_STACKS, LIGHT_BONUS, LIGHT_DARK_COUNTER_BONUS, WUXING_COUNTER_BONUS, WUXING_COUNTERED_PENALTY, RACE_TALISMAN_CAP, RACE_DMG_CAP, hitPer: NV2.hitPer, evaK: NV2.evaK, ELEMENT_BOOK_GAIN, WIND_HIT_MULT, DARK_LIFESTEAL, comboCap: NV2.comboCap, comboPer: NV2.comboPer, monType: Object.fromEntries(Object.entries(MONSTER_TYPES).map(([k, v]) => [k, [v.name, v.def, v.mres || 0, v.eva]])), DARK_MAP_CATEGORIES, ROOT_SINGLE_COUNT, ROOT_SUPREME_SETS, ROOT_PURE_SETS, ROOT_PURE_REST, ROOT_DUAL_SETS, ROOT_DUAL_REST, PARTNER_LV5_PASSIVE_MULT, RACE_TREASURE_CAP, raceGearCap: RACE_GEAR.cap, treasure: RACE_TREASURE_GRADES.map(x => x.bonus), slay: Object.fromEntries(Object.entries(RACE_SLAY_TIERS).map(([k, a]) => [k, a.map(x => [x.kills, x.bonus])])), setQ: GEAR_SET_MIN_QUALITY, wxc: WUXING_COUNTERS };
  EX.books = elementBooks.map(b => [b.key, b.name, b.wuxing || null, b.effect || null]);
  EX.monAttr = monsterAttrsByMapCategory;
  // 時空秘境的存活模擬（DMG.spacetime）：各境界妖獸的氣血／攻擊／命中、出沒妖獸的型態與技能、調息與丹藥
  // 存活模擬用的地圖資料：st＝亂星海時空秘境（強度固定，base 已含倍率）、xm＝靈界仙魔戰場（強度是範圍，base 是 1 倍、第 6 欄放 [最低, 最高]）
  const zone = (map, r0, r1, ranged, more) => {
    const prof = fieldCategoryProfile(map), keepR = player.realmIndex, keepM = player.currentMap, base = []; player.currentMap = map;
    for (let r = r0; r <= r1; r++) {
      player.realmIndex = r; const ms = nv2MonsterStats(map), L = ms.L;
      const row = ranged ? [+(nv2TypNormal(L) * NV2.hitsSame).toFixed(4), +(nv2TypHp(L) * NV2.monAtkPct * (map.nv2AtkMult || 1) * (NV2.monAtkEarly[Math.floor(L + 1e-6)] || 1) / 100).toFixed(6)] : [ms.hp, ms.atk];
      row.push(+nv2TypHit(L).toFixed(4), +fieldMagicAtkComp(L).toFixed(6), +nv2WaveChanceMult(map).toFixed(4)); if (ranged) row.push(map.nv2Str.slice());
      base.push(row);
    }
    player.realmIndex = keepR; player.currentMap = keepM;
    const mon = fieldMonsterPool(map).map(({ m, w }) => { const t = monsterTypeOf(m), tr = RACE_TRAITS[m.race] || {};
      return { id: m.id, n: m.name, w, race: m.race, mag: t.atkType === 'mag' || m.race === 'demon' ? 1 : 0, cast: m.type === 'caster' ? 1 : 0, hp: +(t.hp * raceHpMult(m.race)).toFixed(6), atk: +monsterTypeAtkMult(t, prof.def, m).toFixed(6),
        def: Math.max(0, prof.def + t.def), mres: Math.max(0, prof.def + (t.mres || 0)), eva: prof.eva + (tr.eva || 0), evaT: t.eva, crit: t.crit, sk: m.skills || [], steal: tr.lifesteal || 0 }; });
    const sk = {}; for (const k in MONSTER_SKILLS) { sk[k] = Object.assign({}, MONSTER_SKILLS[k]); delete sk[k].name; delete sk[k].icon; delete sk[k].comp; }
    const act = activityData.find(a => a.id === 'evil');
    return Object.assign({ minRealm: r0, maxRealm: r1, respawn: map.respawnSec, str: ranged ? 1 : map.nv2Str[0], wave: [NV2.waveMin, NV2.waveMax], rest: NV2.restHealPct / 100, variance: NV2.dmgVariance, critDmg: NV2.critDmg,
      defK: DEF_K, mdefFromDef: MDEF_FROM_DEF, shieldMax: PLAYER_SELF_SHIELD_MAX / 100, cd: POTION_COOLDOWN_SECONDS, skillChance: MONSTER_SKILL_CHANCE, sk, freeze: FREEZE_TURNS, lightHeal: LIGHT_HEAL,
      affix: [prof.affixProb, prof.affixChance, MONSTER_AFFIX_TYPES, MONSTER_CASTER_AFFIX_MULT], potions: shopItems.filter(s => s.type === 'heal').map(s => [s.name, s.amount, s.cost, s.noAutoBuy ? 1 : 0]), base, mon,
      cult: { rep: act.minRep, realm: act.minRealmIndex, p: [FIELD_CULTIVATOR_WAVE_CHANCE, AMBUSH_WAVE_CHANCE], mult: [FIELD_CULTIVATOR_POWER_MULT, AMBUSH_POWER_MULT], karma: [KARMA_GOOD_THRESHOLD, KARMA_EVIL_THRESHOLD], steal: RACE_TRAITS.demon.lifesteal, def: prof.def, eva: prof.eva } }, more);
  };
  const byName = n => { const f = findMapByName(n); return maps[f.c].items[f.i]; };
  EX.st = zone(byName(SPACETIME_REALM.name), 0, SPACETIME_REALM.maxRealm, false, { upkeep: SPACETIME_REALM.upkeepPerSec, rewardCap: SPACETIME_REALM.rewardSpeedCap || 1 });
  // rewardCap 0＝收益不封頂
  { const xm = byName("仙魔戰場"); EX.xm = zone(xm, xm.hardMinRealm, realms.length - 1, true, { upkeep: 0, rewardCap: isFinite(xm.rewardSpeedCap) ? xm.rewardSpeedCap : 0 }); }
  // 戰鬥中會出手的東西（存活模擬用）：技能格裡的仙法與宗門武學、職業技能、神器技能、夥伴絕學、靈寵技能，以及靈力、護盾相關的常數
  EX.cb = (function(){
    const strip = (o, drop) => { const r = {}; for (const k in o) if (!drop.includes(k) && o[k] !== undefined && o[k] !== false && o[k] !== null) r[k] = o[k]; return r; };
    const D = ["name", "msg", "desc", "isSpell", "tier", "grade", "id"];
    const spell = {}; spellList.filter(s => s.active).forEach(s => spell[s.id] = strip(spellToCombatSkill(s), D));
    const sect = {}; sectData.forEach(c => c.items.forEach(s => s.skills.forEach(k => sect[k.name] = strip(k, D))));
    const prof = {}; professions.forEach(p => prof[p.id] = p.skills.map(s => strip(s, ["name", "msg", "desc"])));
    const art = {}; for (const id in artifactSkills) art[id] = strip(artifactSkills[id], ["name", "msg", "desc"]);
    const partner = {}; partnerList.forEach(p => partner[p.id] = Object.assign(strip(p.skill, ["name", "msg", "desc"]), { mp: PARTNER_SKILL_MP[getPartnerTier(p).name] || 20 }));
    const beast = {}; beastSkills.forEach(s => beast[s.id] = Object.assign(strip(s, ["name", "id", "minLv", "mp"]), s.mp ? { mp_: s.mp } : {}, { mp: BEAST_SKILL_MP_BY_LV[s.minLv] || 10 }));   // mp＝這招耗的靈寵靈力；原本的 mp（幫主人回靈的比例）改叫 mp_
    return { spell, sect, prof, art, partner, beast, mpScale: NV2.mpScale, prefix: SECT_SKILL_SLOT_PREFIX,
      pet: { mpMax: BEAST_MP_MAX, regen: BEAST_MP_REGEN, chance: BEAST_SKILL_CHANCE, freezeCd: BEAST_FREEZE_COOLDOWN, max: BEAST_ACTIVE_MAX },
      par: { mpMax: PARTNER_MP_MAX, regen: PARTNER_MP_REGEN, lv5: PARTNER_LV5_SKILL_BONUS },
      cap: { self: PLAYER_SELF_SHIELD_MAX / 100, pet: PLAYER_PET_BONUS_MAX / 100, par: PLAYER_PARTNER_BONUS_MAX / 100 },
      mpPotions: shopItems.filter(s => s.type === 'mp').map(s => [s.name, s.amount, s.cost, s.noAutoBuy ? 1 : 0]) };
  })();
  // 世界 Boss 的 30 回合傷害模擬（DMG.wboss）：五隻 Boss 的數值與光環、各境界各階的 Boss 攻擊與命中
  EX.wb = (function(){
    const keepR = player.realmIndex, keepS = player.stage, L = [];
    for (let r = 0; r < realms.length; r++) { const row = []; for (let s = 1; s <= 10; s++) { player.realmIndex = r; player.stage = s; const b = wbBossStats({ atkMult: 1 }); row.push([+b.atk.toFixed(5), +b.attrs.evaPen.toFixed(4)]); } L.push(row); }
    player.realmIndex = keepR; player.stage = keepS;
    const boss = WB_BOSSES.map(B => { const ag = combineAuras(B.auras), st = wbBossStats(B).attrs; player.realmIndex = keepR; player.stage = keepS;
      return { n: B.name, t: B.title, icon: B.icon, race: B.race, el: B.element, def: st.def, eva: st.eva, af: B.affix || "", afv: B.affixVal || 0, am: B.atkMult || 1, mag: ['demon', 'heart'].includes(B.race) ? 1 : 0, pa: ag.player, sa: ag.self, aura: (B.auras || []).map(a => a.name).join("、") }; });
    return { rounds: WB.rounds, skill: ZHENMO_PLAYER_SKILL_MULT, daily: WB.dailyMax, variance: NV2.dmgVariance, defK: DEF_K, freeze: FREEZE_TURNS, boss, L };
  })();
  return JSON.stringify(EX);
})()`);
const fs = require("fs"), file = require("path").join(__dirname, "..", "dmg.js");
fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/\/\*EX\*\/[\s\S]*?\/\*EX\*\//, () => "/*EX*/" + out + "/*EX*/"));
const EX = JSON.parse(out);
console.log("EX bytes", out.length, Object.keys(EX).join(","));
