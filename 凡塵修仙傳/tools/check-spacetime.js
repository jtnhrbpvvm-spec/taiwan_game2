// 用法：node tools/check-spacetime.js [每組場數] [只跑 A 或 B]
// 用遊戲本體驗算 dmg.js 的時空秘境存活模擬（DMG.spacetime）：同一個角色讓遊戲實際打、再跟模擬比「撐過 10 分鐘／30 分鐘」的比例（每場打 30 分鐘）
//   A 組（藍裝、沒有特效）：規則應該完全對得上，差超過 12 個百分點算不一致
//   B 組（白金裝、帶特效）：模擬沒算首擊、橫掃、追擊、疾風、秘典等輸出面的效果，遊戲實打只會比較好；模擬比實打高出 12 個百分點以上才算不一致
const fs = require("fs"), path = require("path");
const { load } = require("./game-vm.js");
const win = {}; new Function("window", fs.readFileSync(path.join(__dirname, "..", "dmg.js"), "utf8"))(win); const DMG = win.DMG;
const g = load();
g.run(`
[[Number, 0], [String, ""]].forEach(([H, v]) => { const ip = v.__proto__; Object.getOwnPropertyNames(H.prototype).forEach(k => { if (!(k in ip)) ip[k] = H.prototype[k]; }); });
tgAllowTick = () => true; checkBackgroundCatchUp = () => {}; gainExp = () => 0; ageLifespan = () => {}; tryRescueServant = () => false;
updateUI = () => {}; updateCombatVisualPanel = () => {}; addLog = () => {};   // 畫面與日誌不影響戰鬥，關掉比較快
enforceGearStashLimit = () => false;   // 暫存區滿了會被送回宗門（不是戰死），驗算時關掉
let __dead = false; const __kill0 = onPlayerKilledInField; onPlayerKilledInField = function () { __dead = true; return __kill0.apply(this, arguments); };
const __f = findMapByName(SPACETIME_REALM.name), __map = maps[__f.c].items[__f.i];
let __rep = 0, __karma = 0;   // 每場開打前還原：擊殺會漲聲望、斬殺修士會改善惡，不還原的話打到一半就會開始遇到修士
function __build(o){
  const pick = a => a[Math.floor(Math.random() * a.length)];
  player.realmIndex = o.r; player.stage = o.s; player.level = o.lv; player.equipment = {};
  Object.keys(gearBySlot).forEach(slot => {
    const eq = createGearEquip(pick(gearBySlot[slot]), getQualityObj(o.q), o.enh || 0, o.glv, true);
    eq.subs = []; delete eq.legend; eq.sockets = undefined; delete eq.raceFx;
    if (o.plain) { eq.element = null; ["ice", "fire", "poison", "metal", "thunder"].forEach(k => { if (eq.stats) delete eq.stats[k]; }); }
    player.equipment[slot] = eq;
  });
  player.titles = []; player.fireCollection = {}; player.partners = []; player.partnerTeam = []; player.beasts = []; player.spells = []; player.talents = {}; talentCacheKey = null;
  player.learnedSkills = []; player.yuanshen = null; player.raceKills = {}; player.raceTreasures = []; player.raceTreasureSlots = []; player.aptitude = null; player.sectSkills = {};
  player.autoHp = { enabled: !!o.auto, threshold: o.th || 50 }; player.autoMp = { enabled: false, threshold: 30 }; player.bag = {}; player.karma = __karma = o.karma || 0; player.reputation = __rep = o.rep || 0;
  player.maxHp = player.hp = getMaxHp(); gearWaveRound = 99;
  const a = getPlayerCombatAttrs(), fx = getGearEffects(), tm = talentMult('def'), buy = shopItems.filter(s => s.type === 'heal' && !s.noAutoBuy).sort((x, y) => y.amount - x.amount)[0];
  return JSON.stringify({ r: o.r, hp: player.maxHp, atk: getPhysAttack(), mag: false, skill: 1, crit: a.crit, critDmg: a.critDmg, combo: nv2Combo(), pen: a.armorPen, hit: a.evaPen, def: a.def, mdef: a.mdef, eva: a.eva,
    jin: fx["金身"] || 0, huajin: fx["化勁"] || 0, life: fx["吸血"] || 0, soul: fx["噬魂"] || 0, regen: (fx["回春"] || 0) + getRootBonus().regen, reflect: fx["反震"] || 0, shield: (fx["先手盾"] || 0) * tm, huti: (fx["護體"] || 0) * tm,
    undying: hasSetSpecial("undying"), aff: { ice: a.ice, fire: a.fire, poison: a.poison, metal: a.metal, thunder: a.thunder }, elem: !!a.element && !a.ignoreCounter, counter: a.counterBonus, dodgeHit: fx["閃擊"] || 0, fr: a.freezeResist, light: a.light, dark: a.dark, potion: o.auto ? { th: o.th || 50, amt: buy.amount * (1 + (fx["丹心"] || 0)) } : null,
    skills: getAllSkills().length, evil: isEvilHuntUnlocked() });
}
// 這個強度下每波混入野外修士／暗殺者的機率（遊戲用的是地圖的遭遇補償，強度不同就不同）
function __cult(k){ __map.nv2Str = [k, k]; player.reputation = __rep; player.karma = __karma; player.currentMap = __map; player.currentMapIsSafe = false; const on = isEvilHuntUnlocked(), m = getWaveChanceMult() * nv2RewardSpeedAdj(getRewardMap(), null, getRewardSpeedCap()), ks = getKarmaState().key;
  const o = { cult: on ? Math.min(1, FIELD_CULTIVATOR_WAVE_CHANCE * m) : 0, amb: on && ks !== 'neutral' ? Math.min(1, AMBUSH_WAVE_CHANCE * m * getAptitudeSpecial().ambushMult) : 0, ambDemon: ks === 'good' };
  __map.nv2Str = [SPACETIME_REALM_STR0, SPACETIME_REALM_STR0]; return JSON.stringify(o); }
function __run(N, T, k){
  __map.nv2Str = [k, k]; const ts = [];
  for (let i = 0; i < N; i++) {
    player.coins = 1e13; player.lifespan = 1e9; player.reputation = __rep; player.karma = __karma; player.hp = player.maxHp = getMaxHp(); player.mp = player.maxMp; playerStatus = newStatus(); enemies = []; respawnTimer = 0; potionCooldownHp = 0; gameOver = false;
    changeMap(__f.c, __f.i, true);
    __dead = false; let t = 0; for (; t < T; t++) { player.reputation = __rep; combatTick(); if (__dead) break; if (player.currentMapIsSafe) return "被送出秘境但不是戰死：" + player.currentMap.name; }
    ts.push(t);
  }
  __map.nv2Str = [SPACETIME_REALM_STR0, SPACETIME_REALM_STR0];
  return JSON.stringify(ts);
}
const SPACETIME_REALM_STR0 = __map.nv2Str[0];
`);
const N = +process.argv[2] || 60, T = 1800, pc = v => (v * 100).toFixed(0).padStart(3) + "%";
const groups = [
  ["A", { r: 5, s: 10, lv: 600, q: "藍色", glv: 600, plain: 1, auto: 0 }, [0.5, 1, 1.5, 2]],
  ["A", { r: 8, s: 3, lv: 2500, q: "藍色", glv: 2500, plain: 1, auto: 1, th: 60 }, [1, 1.5, 2, 3]],
  ["A", { r: 7, s: 5, lv: 2000, q: "藍色", glv: 2000, plain: 1, auto: 1, th: 60, rep: 9000, karma: 2000 }, [0.3, 0.5, 0.8, 1.2]],
  ["A", { r: 2, s: 6, lv: 80, q: "藍色", glv: 80, plain: 1, auto: 1, th: 40 }, [0.5, 1, 1.5, 2]],
  ["B", { r: 6, s: 10, lv: 1500, q: "白金", glv: 1500, enh: 15, auto: 1, th: 50 }, [1, 2, 3, 5]],
  ["B", { r: 9, s: 10, lv: 5000, q: "白金", glv: 5000, enh: 20, auto: 1, th: 70, rep: 9000 }, [0.5, 1, 2, 3]],
  ["B", { r: 10, s: 5, lv: 6500, q: "橙色", glv: 5000, enh: 20, auto: 0 }, [1, 2, 3, 5]]
];
let bad = 0, rows = 0;
groups.forEach(([grp, c, ks], gi) => {
  if (process.argv[3] && process.argv[3] !== grp) return;
  const I = JSON.parse(g.run(`__build(${JSON.stringify(c)})`));
  console.log(`${grp}${gi + 1} ${JSON.stringify(c)}\n   氣血 ${I.hp} 攻擊 ${I.atk} 防禦 ${I.def.toFixed(1)} 閃避 ${I.eva.toFixed(1)} 回春 ${I.regen} 吸血 ${I.life} 噬魂 ${I.soul} 金身 ${I.jin} 不死 ${I.undying}${I.skills ? "  ⚠️ 有技能" : ""}`);
  ks.forEach(k => {
    const ts = JSON.parse(g.run(`__run(${N}, ${T}, ${k})`)).sort((a, b) => a - b), real = s => ts.filter(x => x >= Math.min(s, T)).length / N;
    const cu = JSON.parse(g.run(`__cult(${k})`)), sim = DMG.spacetime(Object.assign({}, I, cu), { n: 400, T, str: k, seed: 1 + gi * 10 + k });
    const d10 = sim.p10 - real(600), d60 = sim.p60 - real(3600), lim = 0.12 + 1.5 / Math.sqrt(N);
    const off = grp === "A" ? Math.abs(d10) > lim || Math.abs(d60) > lim : d10 > lim || d60 > lim;
    rows++; if (off) bad++;
    console.log(`   強度 ×${String(k).padEnd(3)} 遊戲 10 分 ${pc(real(600))}・30 分 ${pc(real(3600))}・中位 ${String(ts[N >> 1]).padStart(4)} 秒 ｜ 模擬 10 分 ${pc(sim.p10)}・30 分 ${pc(sim.p60)}・中位 ${String(sim.median).padStart(4)} 秒${cu.cult ? `  [修士 ${pc(cu.cult)} 暗殺 ${pc(cu.amb)}]` : ""}${off ? "  ← 不一致" : ""}`);
  });
});
console.log(`共 ${rows} 組，不一致 ${bad}`);
