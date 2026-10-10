// 用法：node tools/check-spacetime.js [每組場數] [只跑哪一類：plain／kit／-] [只跑 st 或 xm／-] [rate]
//   最後加 rate＝診斷模式：倒下就補滿繼續打，比「每小時擊殺、倒下、吃藥」幾次（比存活率靈敏，用來找是哪一塊對不上）
// 用遊戲本體驗算存活模擬（dmg.js 的 DMG.spacetime；st＝亂星海時空秘境、xm＝靈界仙魔戰場），而且是「從存檔開始」整條比：
//   遊戲這邊：用這個角色實際進圖打（combatTick 一秒一回合，技能、神器、職業、夥伴、靈寵、丹藥全部照常運作），量存活時間
//   攻略這邊：把同一份存檔交給攻略頁的 analyze → hPlayer → stCalc 組出模擬的輸入，再跑 DMG.spacetime
//   比「撐過 10 分鐘／30 分鐘」的比例（每場打 30 分鐘），差超過 12 個百分點（另加抽樣誤差）算不一致
// 角色分兩類：plain＝藍裝、沒有特效與技能（只驗基本規則）；kit＝白金裝＋技能格仙法、宗門武學、靈寶閣武學、神器、職業、夥伴、靈寵全上
// 強度：時空秘境填妖獸強度倍數（遊戲裡是 30）；仙魔戰場填「原本強度範圍 × 幾倍」（遊戲裡是 1）。調低是為了落在有時活、有時死的區間才比得出差異
const { load } = require("./game-vm.js"), { loadPage } = require("./page-vm.js");
const page = loadPage();
if (page.run("typeof analyze + typeof stCalc") !== "functionfunction") { console.log("攻略頁的程式載入失敗：", page.errs.join(" | ")); process.exit(1); }
const g = load();
g.run(`
[[Number, 0], [String, ""]].forEach(([H, v]) => { const ip = v.__proto__; Object.getOwnPropertyNames(H.prototype).forEach(k => { if (!(k in ip)) ip[k] = H.prototype[k]; }); });
tgAllowTick = () => true; checkBackgroundCatchUp = () => {}; gainExp = () => 0; ageLifespan = () => {}; tryRescueServant = () => false; gainBeastExp = () => {};
updateUI = () => {}; updateCombatVisualPanel = () => {}; addLog = () => {};   // 畫面與日誌不影響戰鬥，關掉比較快
enforceGearStashLimit = () => false;   // 暫存區滿了會被送回宗門（不是戰死），驗算時關掉
let __dead = false; const __kill0 = onPlayerKilledInField; onPlayerKilledInField = function () { __dead = true; return __kill0.apply(this, arguments); };
const __Z = {}; [["st", SPACETIME_REALM.name], ["xm", "仙魔戰場"]].forEach(([z, n]) => { const f = findMapByName(n); __Z[z] = { f, map: maps[f.c].items[f.i], desc: Object.getOwnPropertyDescriptor(maps[f.c].items[f.i], "nv2Str") }; });
// 暫時改妖獸強度：st＝固定 k 倍；xm＝這個境界原本的範圍 × k。__str(z) 不給 k＝還原
function __str(z, k){
  const Z = __Z[z]; Object.defineProperty(Z.map, "nv2Str", Z.desc);
  if (k == null) return;
  const v = z === "st" ? [k, k] : Z.map.nv2Str.map(x => x * k);
  Object.defineProperty(Z.map, "nv2Str", { value: v, configurable: true, writable: true, enumerable: true });
}
let __rep = 0, __karma = 0;   // 每場開打前還原：擊殺會漲聲望、斬殺修士會改善惡，不還原的話打到一半就會開始遇到修士
function __build(o){
  const pick = a => a[Math.floor(Math.random() * a.length)], chance = x => Math.random() < x, some = (a, n) => a.slice().sort(() => Math.random() - .5).slice(0, n);
  player.realmIndex = o.r; player.stage = o.s; player.level = o.lv; player.equipment = {}; player.weakened = false;
  Object.keys(gearBySlot).forEach(slot => {
    let eq = null;
    if (o.kit && chance(0.5)) for (let i = 0; i < 60 && !eq; i++) { const e = createPrimalPlatinumGear(pick([1500, 2500, 3500, 5000]), pick([0, 0, 1, 2])); if (e && (getGearDef(e) || {}).slot === slot) eq = e; }
    if (!eq) { eq = createGearEquip(pick(gearBySlot[slot]), getQualityObj(o.q), o.enh || 0, o.glv, true); eq.subs = []; delete eq.legend; eq.sockets = undefined; delete eq.raceFx; }
    if (!o.kit) { eq.element = null; ["ice", "fire", "poison", "metal", "thunder"].forEach(k => { if (eq.stats) delete eq.stats[k]; }); }
    else if (chance(0.5)) eq.element = pick(["金","木","水","火","土"]);
    player.equipment[slot] = eq;
  });
  player.titles = []; player.fireCollection = {}; player.partners = []; player.partnerTeam = []; player.partnerBond = {}; player.beasts = []; player.spells = []; player.spellSlots = []; player.sectSkills = {}; player.sectSkillSeen = [];
  player.talents = {}; talentCacheKey = null; player.learnedSkills = []; player.yuanshen = null; player.raceKills = {}; player.raceTreasures = []; player.raceTreasureSlots = []; player.aptitude = null; player.sect = null;
  player.profession = null; player.proficiency = {}; player.elementStudy = {}; player.pillUsed = {}; player.studyCounts = {}; player.goldenCore = null; player.reincarnateBonus = null;
  if (o.kit) {
    // 技能：仙法（含光環與絕學）、三階宗門武學、靈寶閣武學；技能格放滿
    const act = some(spellList.filter(s => s.active), 9), au = some(spellList.filter(s => !s.active), 4);
    player.spells = act.concat(au).map(s => s.id);
    const sects = {}; sectData.forEach(c => { if (chance(0.7)) sects[c.tier] = pick(c.items).name; }); player.sectSkills = sects;
    const sectIds = getLearnedSectSkills().map(e => e.id); player.sectSkillSeen = sectIds.slice();
    player.spellSlots = some(act.map(s => s.id).concat(sectIds), getSpellSlotCount());
    player.learnedSkills = some(lingbaoShopItems.filter(i => i.type === 'skill'), pick([0, 1, 2])).map(i => Object.assign({}, i.skillData));
    // 神器、職業、夥伴、靈寵
    if (chance(0.7)) { const slot = Object.keys(equipTypes).find(k => equipTypes[k] === 'artifact'), it = pick(lingbaoShopItems.filter(i => i.type === 'equip' && i.itemData.category === 'artifact'));
      player.equipment[slot] = { id: "a1", name: it.itemData.name, category: it.itemData.category, quality: it.itemData.quality, element: it.itemData.element, stats: Object.assign({}, it.itemData.stats), lingbaoId: it.id }; }
    player.profession = pick(professions).id; player.proficiency = { [player.profession]: pick(PROF_RANK_EXP.slice(4)) };
    const ps = some(partnerList, 2).map(p => p.id); player.partners = ps.slice(); player.partnerTeam = ps.slice(); ps.forEach(id => player.partnerBond[id] = { pts: chance(0.5) ? 99999 : 800 });
    player.partnerTeam = getPartnerTeam().map(p => p.id);
    player.beasts = some(beastData, pick([1, 2, 3])).map(d => { const b = createBeast(d.id); b.level = 1000; b.skills = some(beastSkills, 6).map(s => s.id); return b; });
    player.titles = titleList.filter(() => chance(0.2)).map(t => t.id); Object.keys(strangeFireById).forEach(id => { if (chance(0.2)) player.fireCollection[id] = 1; });
    const rg = pick(APTITUDE_ROOT_GROUPS), pg = pick(APTITUDE_PHYSIQUE_GROUPS);
    player.aptitude = { root: rg.pick ? { group: rg.id, id: pick(rg.pick).id } : { group: rg.id, elems: ["金","木","水","火","土"].sort(() => Math.random() - 0.5).slice(0, rg.elems || 1) }, physique: pick(pg.pick).id };
    if (o.nat) player.aptitude.physique = o.nat;   // 指定帶光／暗本質的體質（和野外修士互剋）
    Object.keys(TALENT_NODE_BY_ID).forEach(id => { if (chance(0.25)) player.talents[id] = 1; }); talentCacheKey = null;
    elementBooks.forEach(b => { if (chance(0.5)) player.elementStudy[b.key] = Math.floor(Math.random() * 600); });
    player.raceKills = { beast: pick([0, 20000]), ghost: pick([0, 150]), demon: pick([0, 25000]) };
  }
  player.autoHp = { enabled: !!o.auto, threshold: o.th || 50 }; player.autoMp = { enabled: !!o.autoMp, threshold: 30 }; player.bag = {}; player.karma = __karma = o.karma || 0; player.reputation = __rep = o.rep || 0;
  player.buffTimer = 0; player.buffMult = 1;
  player.maxHp = player.hp = getMaxHp(); player.maxMp = player.mp = getMaxMp();
  return JSON.stringify({ p: player, hp: player.maxHp, phys: getPhysAttack(), mag: getMagAttack(), skills: getAllSkills().length, team: getPartnerTeam().length, beasts: player.beasts.length, art: !!getEquippedArtifactSkill() });
}
// 這個強度下每波混入野外修士／暗殺者的機率（遊戲用的是地圖的遭遇補償，強度不同就不同）
function __cult(z, k){ __str(z, k); player.reputation = __rep; player.karma = __karma; player.currentMap = __Z[z].map; player.currentMapIsSafe = false; const on = isEvilHuntUnlocked(), m = getWaveChanceMult() * nv2RewardSpeedAdj(getRewardMap(), null, getRewardSpeedCap()), ks = getKarmaState().key;
  const o = { cult: on ? Math.min(1, FIELD_CULTIVATOR_WAVE_CHANCE * m) : 0, amb: on && ks !== 'neutral' ? Math.min(1, AMBUSH_WAVE_CHANCE * m * getAptitudeSpecial().ambushMult) : 0, ambDemon: ks === 'good' };
  __str(z); return JSON.stringify(o); }
function __run(z, N, T, k){
  __str(z, k); const ts = [], Z = __Z[z];
  for (let i = 0; i < N; i++) {
    player.coins = 1e13; player.beastCore = 1e9; player.lifespan = 1e9; player.reputation = __rep; player.karma = __karma; player.gearStash = []; player.equipInventory = [];   // 暫存區、背包滿了會進不了圖
    player.beasts.forEach(b => { b.alive = true; b.active = true; b.upkeepTimer = 0; });
    player.buffTimer = 0; player.buffMult = 1; petBuffTimer = 0; petShieldTimer = 0; partnerShieldTimer = 0; selfShieldTimer = 0; petRegenTimer = 0; petFx = {}; beastMp = {}; partnerMp = {}; fieldSunderTurns = 0;
    player.hp = player.maxHp = getMaxHp(); player.mp = player.maxMp = getMaxMp(); playerStatus = newStatus(); enemies = []; respawnTimer = 0; potionCooldownHp = 0; potionCooldownMp = 0; gameOver = false;
    player.inLingjie = z === "xm";   // 仙魔戰場在靈界
    changeMap(Z.f.c, Z.f.i, true);
    if (player.currentMap !== Z.map) { __str(z); return JSON.stringify("進不去：" + player.currentMap.name); }
    __dead = false; let t = 0; for (; t < T; t++) { player.reputation = __rep; player.karma = __karma; combatTick(); if (__dead) break; if (player.currentMapIsSafe) { __str(z); return JSON.stringify("被送出去但不是戰死：" + player.currentMap.name); } }
    ts.push(t);
  }
  __str(z);
  return JSON.stringify(ts);
}
// 診斷模式：倒下就補滿繼續打，數每小時擊殺／倒下／吃藥／放技能
let __cnt = {};
function __rate(z, secs, k){
  __str(z, k); const Z = __Z[z]; __cnt = { kills: 0, deaths: 0, pots: 0, casts: 0 };
  const kill0 = onPlayerKilledInField, adp0 = addDailyProgress, sm0 = skillMpCost;
  onPlayerKilledInField = function () { __cnt.deaths++; player.hp = player.maxHp; };
  addDailyProgress = function (key, n2) { if (key === 'kill') __cnt.kills += n2 || 1; else if (key === 'potion') __cnt.pots++; return adp0.apply(this, arguments); };
  player.coins = 1e13; player.beastCore = 1e9; player.lifespan = 1e9; player.gearStash = []; player.equipInventory = [];
  player.beasts.forEach(b => { b.alive = true; b.active = true; b.upkeepTimer = 0; });
  player.buffTimer = 0; player.buffMult = 1; petBuffTimer = 0; petShieldTimer = 0; partnerShieldTimer = 0; selfShieldTimer = 0; petRegenTimer = 0; petFx = {}; beastMp = {}; partnerMp = {}; fieldSunderTurns = 0;
  player.hp = player.maxHp = getMaxHp(); player.mp = player.maxMp = getMaxMp(); playerStatus = newStatus(); enemies = []; respawnTimer = 0; potionCooldownHp = 0; potionCooldownMp = 0; gameOver = false;
  player.inLingjie = z === "xm"; changeMap(Z.f.c, Z.f.i, true);
  let mp0 = player.mp;
  for (let t = 0; t < secs; t++) { player.reputation = __rep; player.karma = __karma; player.coins = 1e13; if (t % 600 === 0) { player.gearStash = []; player.equipInventory = []; player.beasts.forEach(b => { b.alive = true; b.active = true; }); }
    const m = player.mp; combatTick(); if (player.mp < m - 1e-9 && enemies.length) __cnt.casts++; }
  onPlayerKilledInField = kill0; addDailyProgress = adp0; __str(z);
  const h = secs / 3600; return JSON.stringify({ kills: __cnt.kills / h, deaths: __cnt.deaths / h, pots: __cnt.pots / h, casts: __cnt.casts / h });
}
`);
const N = +process.argv[2] || 60, T = 1800, pc = v => (v * 100).toFixed(0).padStart(3) + "%";
const groups = [
  ["st", "plain", { r: 5, s: 10, lv: 600, q: "藍色", glv: 600, auto: 0 }, [0.5, 1, 1.5, 2]],
  ["st", "plain", { r: 8, s: 3, lv: 2500, q: "藍色", glv: 2500, auto: 1, th: 60 }, [1, 1.5, 2, 3]],
  ["st", "plain", { r: 7, s: 5, lv: 2000, q: "藍色", glv: 2000, auto: 1, th: 60, rep: 9000, karma: 2000 }, [0.3, 0.5, 0.8, 1.2]],
  ["st", "plain", { r: 2, s: 6, lv: 80, q: "藍色", glv: 80, auto: 1, th: 40 }, [0.5, 1, 1.5, 2]],
  ["xm", "plain", { r: 10, s: 5, lv: 6500, q: "藍色", glv: 5000, auto: 1, th: 60 }, [0.2, 0.3, 0.45, 0.6]],
  ["xm", "plain", { r: 12, s: 3, lv: 8000, q: "藍色", glv: 6500, auto: 1, th: 60, rep: 9000, karma: -2000 }, [0.03, 0.045, 0.06, 0.09]],
  ["st", "kit", { r: 6, s: 10, lv: 1500, q: "白金", glv: 1500, enh: 15, auto: 1, th: 50, kit: 1 }, null],
  ["st", "kit", { r: 9, s: 10, lv: 5000, q: "白金", glv: 5000, enh: 20, auto: 1, th: 70, rep: 9000, kit: 1, autoMp: 1 }, null],
  ["st", "kit", { r: 10, s: 5, lv: 6500, q: "橙色", glv: 5000, enh: 20, auto: 0, kit: 1 }, null],
  ["st", "kit", { r: 4, s: 6, lv: 900, q: "紫色", glv: 600, enh: 10, auto: 1, th: 60, kit: 1, rep: 9000, karma: 2000 }, null],
  ["st", "kit", { r: 7, s: 2, lv: 2200, q: "橙色", glv: 1000, enh: 12, auto: 1, th: 60, kit: 1, rep: 9000, karma: -2000, nat: "yinBody" }, null],
  ["xm", "kit", { r: 11, s: 10, lv: 7000, q: "白金", glv: 6500, enh: 20, auto: 1, th: 70, rep: 9000, kit: 1, autoMp: 1 }, null],
  ["xm", "kit", { r: 13, s: 4, lv: 9000, q: "白金", glv: 8000, enh: 20, auto: 1, th: 60, rep: 9000, karma: -2000, kit: 1 }, null]
];
// 攻略頁這邊：存檔 → analyze → hPlayer → stCalc 的輸入 → 模擬
const sim = (p, z, k, cu, seed) => JSON.parse(page.run(`(function(p, cu){ stOpt = {}; const a = analyze(p), P = hPlayer(a), c = stCalc(a, P, SZ.${z}); if (!c) return JSON.stringify(null);
  Object.assign(c.I, cu); const s = DMG.spacetime(c.I, { S: SZ.${z}.S, n: 300, T: ${T}, str: ${k}, seed: ${seed} });
  return JSON.stringify({ p10: s.p10, p60: s.p60, median: s.median, hp: a.hp, phys: a.phys, mag: a.mag, nsk: c.I.skills.length, npar: c.I.partners.length, nb: c.I.beasts.length, art: !!c.I.art }); })(${JSON.stringify(p)}, ${JSON.stringify(cu)})`));
const RATE = process.argv[5] === "rate";
let bad = 0, rows = 0;
groups.forEach(([z, grp, c, ks], gi) => {
  if (process.argv[3] && process.argv[3] !== "-" && process.argv[3] !== grp) return;
  if (process.argv[4] && process.argv[4] !== "-" && process.argv[4] !== z) return;
  const G = JSON.parse(g.run(`__build(${JSON.stringify(c)})`));
  // kit 組的強弱每次不同：先用模擬找出「大約一半會死」的強度，再取它附近四個點來比
  if (!ks) {
    const probe = k => sim(G.p, z, k, JSON.parse(g.run(`__cult("${z}", ${k})`)), 99);
    let lo = 1e-4, hi = z === "st" ? 3000 : 100;
    for (let i = 0; i < 16; i++) { const mid = Math.sqrt(lo * hi), r = probe(mid); if (r && r.p60 > 0.5) lo = mid; else hi = mid; }
    const mid = Math.sqrt(lo * hi); ks = [0.6, 0.85, 1.15, 1.6].map(f => +(mid * f).toPrecision(3));
  }
  if (RATE) {
    console.log(`${z} ${grp} #${gi + 1}　氣血 ${G.hp} 物攻 ${G.phys} 術攻 ${G.mag}｜技能 ${G.skills} 夥伴 ${G.team} 靈寵 ${G.beasts} 神器 ${G.art ? "有" : "無"}`);
    ks.slice(1, 3).forEach(k => {
      const cu = JSON.parse(g.run(`__cult("${z}", ${k})`)), R = JSON.parse(g.run(`__rate("${z}", 36000, ${k})`));
      const S = JSON.parse(page.run(`(function(p, cu){ stOpt = {}; const a = analyze(p), P = hPlayer(a), c = stCalc(a, P, SZ.${z}); Object.assign(c.I, cu); const s = DMG.spacetime(c.I, { S: SZ.${z}.S, n: 10, T: 3600, str: ${k}, seed: 5, immortal: true }); return JSON.stringify({ kills: s.killsHr, deaths: s.deathsHr, pots: s.potsHr, casts: s.castsHr }); })(${JSON.stringify(G.p)}, ${JSON.stringify(cu)})`));
      const f = x => String(Math.round(x)).padStart(6);
      console.log(`   強度 ×${String(k).padEnd(6)} 每小時　擊殺 遊戲${f(R.kills)} 模擬${f(S.kills)}｜倒下 遊戲${f(R.deaths)} 模擬${f(S.deaths)}｜吃藥 遊戲${f(R.pots)} 模擬${f(S.pots)}${cu.cult ? `  [修士 ${pc(cu.cult)} 暗殺 ${pc(cu.amb)}]` : ""}`);
    });
    return;
  }
  let head = false;
  ks.forEach(k => {
    const cu = JSON.parse(g.run(`__cult("${z}", ${k})`)), S = sim(G.p, z, k, cu, 1 + gi * 10 + Math.round(k * 1000) % 9973);
    if (!head) { head = true; console.log(`${z} ${grp} #${gi + 1} ${JSON.stringify(c)}\n   氣血 ${G.hp} 物攻 ${G.phys} 術攻 ${G.mag}｜技能 ${G.skills} 夥伴 ${G.team} 靈寵 ${G.beasts} 神器 ${G.art ? "有" : "無"}`
      + (S && (S.hp !== G.hp || S.phys !== G.phys || S.mag !== G.mag || S.nsk !== G.skills || S.npar !== G.team || S.nb !== G.beasts || S.art !== G.art) ? `\n   ⚠️ 攻略頁讀到的不一樣：氣血 ${S.hp} 物攻 ${S.phys} 術攻 ${S.mag} 技能 ${S.nsk} 夥伴 ${S.npar} 靈寵 ${S.nb} 神器 ${S.art ? "有" : "無"}` : "")); }
    const out = JSON.parse(g.run(`__run("${z}", ${N}, ${T}, ${k})`));
    if (typeof out === "string" || !S) { console.log(`   強度 ×${k} ${typeof out === "string" ? out : "攻略頁算不出來"}  ← 不一致`); rows++; bad++; return; }
    const ts = out.sort((a, b) => a - b), real = s => ts.filter(x => x >= Math.min(s, T)).length / N;
    const d10 = S.p10 - real(600), d60 = S.p60 - real(3600), lim = 0.12 + 1.5 / Math.sqrt(N), off = Math.abs(d10) > lim || Math.abs(d60) > lim;
    rows++; if (off) bad++;
    console.log(`   強度 ×${String(k).padEnd(6)} 遊戲 10 分 ${pc(real(600))}・30 分 ${pc(real(3600))}・中位 ${String(ts[N >> 1]).padStart(4)} 秒 ｜ 模擬 10 分 ${pc(S.p10)}・30 分 ${pc(S.p60)}・中位 ${String(S.median).padStart(4)} 秒${cu.cult ? `  [修士 ${pc(cu.cult)} 暗殺 ${pc(cu.amb)}]` : ""}${off ? "  ← 不一致" : ""}`);
  });
});
console.log(`共 ${rows} 組，不一致 ${bad}`);
