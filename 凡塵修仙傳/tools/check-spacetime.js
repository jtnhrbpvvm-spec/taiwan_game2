// 用法：node tools/check-spacetime.js [每組場數] [只跑 A 或 B] [只跑 st 或 xm]
// 用遊戲本體驗算 dmg.js 的存活模擬（DMG.spacetime；st＝亂星海時空秘境、xm＝靈界仙魔戰場）：同一個角色讓遊戲實際打、再跟模擬比「撐過 10 分鐘／30 分鐘」的比例（每場打 30 分鐘）
//   A 組（藍裝、沒有特效）：規則應該完全對得上，差超過 12 個百分點算不一致
//   B 組（白金裝、帶特效）：模擬沒算首擊、橫掃、追擊、疾風、秘典等輸出面的效果，遊戲實打只會比較好；模擬比實打高出 12 個百分點以上才算不一致
//   強度：時空秘境填的是妖獸強度倍數（遊戲裡是 30）；仙魔戰場填的是「原本強度範圍 × 幾倍」（遊戲裡是 1）。調低是為了落在有時活、有時死的區間才比得出差異
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
function __cult(z, k){ __str(z, k); player.reputation = __rep; player.karma = __karma; player.currentMap = __Z[z].map; player.currentMapIsSafe = false; const on = isEvilHuntUnlocked(), m = getWaveChanceMult() * nv2RewardSpeedAdj(getRewardMap(), null, getRewardSpeedCap()), ks = getKarmaState().key;
  const o = { cult: on ? Math.min(1, FIELD_CULTIVATOR_WAVE_CHANCE * m) : 0, amb: on && ks !== 'neutral' ? Math.min(1, AMBUSH_WAVE_CHANCE * m * getAptitudeSpecial().ambushMult) : 0, ambDemon: ks === 'good' };
  __str(z); return JSON.stringify(o); }
function __run(z, N, T, k){
  __str(z, k); const ts = [], Z = __Z[z];
  for (let i = 0; i < N; i++) {
    player.coins = 1e13; player.lifespan = 1e9; player.reputation = __rep; player.karma = __karma; player.hp = player.maxHp = getMaxHp(); player.mp = player.maxMp; playerStatus = newStatus(); enemies = []; respawnTimer = 0; potionCooldownHp = 0; gameOver = false;
    player.inLingjie = z === "xm";   // 仙魔戰場在靈界
    changeMap(Z.f.c, Z.f.i, true);
    if (player.currentMap !== Z.map) { __str(z); return JSON.stringify("進不去：" + player.currentMap.name); }
    __dead = false; let t = 0; for (; t < T; t++) { player.reputation = __rep; combatTick(); if (__dead) break; if (player.currentMapIsSafe) { __str(z); return JSON.stringify("被送出去但不是戰死：" + player.currentMap.name); } }
    ts.push(t);
  }
  __str(z);
  return JSON.stringify(ts);
}
`);
const N = +process.argv[2] || 60, T = 1800, pc = v => (v * 100).toFixed(0).padStart(3) + "%";
const groups = [
  ["st", "A", { r: 5, s: 10, lv: 600, q: "藍色", glv: 600, plain: 1, auto: 0 }, [0.5, 1, 1.5, 2]],
  ["st", "A", { r: 8, s: 3, lv: 2500, q: "藍色", glv: 2500, plain: 1, auto: 1, th: 60 }, [1, 1.5, 2, 3]],
  ["st", "A", { r: 7, s: 5, lv: 2000, q: "藍色", glv: 2000, plain: 1, auto: 1, th: 60, rep: 9000, karma: 2000 }, [0.3, 0.5, 0.8, 1.2]],
  ["st", "A", { r: 2, s: 6, lv: 80, q: "藍色", glv: 80, plain: 1, auto: 1, th: 40 }, [0.5, 1, 1.5, 2]],
  ["st", "B", { r: 6, s: 10, lv: 1500, q: "白金", glv: 1500, enh: 15, auto: 1, th: 50 }, [1, 2, 3, 5]],
  ["st", "B", { r: 9, s: 10, lv: 5000, q: "白金", glv: 5000, enh: 20, auto: 1, th: 70, rep: 9000 }, [0.5, 1, 2, 3]],
  ["st", "B", { r: 10, s: 5, lv: 6500, q: "橙色", glv: 5000, enh: 20, auto: 0 }, [1, 2, 3, 5]],
  ["xm", "A", { r: 10, s: 5, lv: 6500, q: "藍色", glv: 5000, plain: 1, auto: 1, th: 60 }, [0.2, 0.3, 0.45, 0.6]],
  ["xm", "A", { r: 12, s: 3, lv: 8000, q: "藍色", glv: 6500, plain: 1, auto: 1, th: 60, rep: 9000, karma: -2000 }, [0.03, 0.045, 0.06, 0.09]],
  ["xm", "A", { r: 14, s: 8, lv: 10000, q: "藍色", glv: 8000, plain: 1, auto: 0, rep: 9000 }, [0.002, 0.004, 0.006, 0.01]],
  ["xm", "B", { r: 11, s: 10, lv: 7000, q: "白金", glv: 6500, enh: 20, auto: 1, th: 70, rep: 9000 }, [0.4, 0.6, 0.9, 1.3]]
];
let bad = 0, rows = 0;
groups.forEach(([z, grp, c, ks], gi) => {
  if (process.argv[3] && process.argv[3] !== "-" && process.argv[3] !== grp) return;
  if (process.argv[4] && process.argv[4] !== z) return;
  const I = JSON.parse(g.run(`__build(${JSON.stringify(c)})`));
  console.log(`${z} ${grp}${gi + 1} ${JSON.stringify(c)}\n   氣血 ${I.hp} 攻擊 ${I.atk} 防禦 ${I.def.toFixed(1)} 閃避 ${I.eva.toFixed(1)} 回春 ${I.regen} 吸血 ${I.life} 噬魂 ${I.soul} 金身 ${I.jin} 不死 ${I.undying}${I.skills ? "  ⚠️ 有技能" : ""}`);
  ks.forEach(k => {
    const out = JSON.parse(g.run(`__run("${z}", ${N}, ${T}, ${k})`));
    if (typeof out === "string") { console.log(`   強度 ×${k} ${out}  ← 不一致`); rows++; bad++; return; }
    const ts = out.sort((a, b) => a - b), real = s => ts.filter(x => x >= Math.min(s, T)).length / N;
    const cu = JSON.parse(g.run(`__cult("${z}", ${k})`)), sim = DMG.spacetime(Object.assign({}, I, cu), { S: DMG.EX[z], n: 400, T, str: k, seed: 1 + gi * 10 + Math.round(k * 1000) });
    const d10 = sim.p10 - real(600), d60 = sim.p60 - real(3600), lim = 0.12 + 1.5 / Math.sqrt(N);
    const off = grp === "A" ? Math.abs(d10) > lim || Math.abs(d60) > lim : d10 > lim || d60 > lim;
    rows++; if (off) bad++;
    console.log(`   強度 ×${String(k).padEnd(5)} 遊戲 10 分 ${pc(real(600))}・30 分 ${pc(real(3600))}・中位 ${String(ts[N >> 1]).padStart(4)} 秒 ｜ 模擬 10 分 ${pc(sim.p10)}・30 分 ${pc(sim.p60)}・中位 ${String(sim.median).padStart(4)} 秒${cu.cult ? `  [修士 ${pc(cu.cult)} 暗殺 ${pc(cu.amb)}]` : ""}${off ? "  ← 不一致" : ""}`);
  });
});
console.log(`共 ${rows} 組，不一致 ${bad}`);
