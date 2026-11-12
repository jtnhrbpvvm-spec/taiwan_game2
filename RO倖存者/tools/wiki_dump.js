/* RO 倖存者小百科：遊戲資料抽取程式
   在「離線版」遊戲頁（語言設成繁體中文、網址加 ?notools）執行：
     await import('/__wiki_dump.js?' + Date.now())
   會把遊戲的職業、技能、天賦、物品、卡片、怪物、掉落、關卡整理成 JSON，
   送到離線伺服器存成 rs-crawl\_wiki_dump.json，再用 tools\build_wiki.py 產生 wiki\data\*.js。

   遊戲每次改版變數名都會變，所以這裡一律「用資料形狀找」，不寫死匯出名稱。 */
const log = [];
const note = m => { log.push(m); console.log('[wiki_dump]', m); };

const core = performance.getEntriesByType('resource').map(e => e.name)
  .concat([...document.querySelectorAll('link[rel=modulepreload],script[src]')].map(e => e.href || e.src))
  .find(n => /\/build\/soul_linker-[\w-]+\.js$/.test(n));
if (!core) throw new Error('找不到 soul_linker 程式檔');
const mainUrl = [...document.querySelectorAll('script[type=module][src]')].map(e => e.src).find(n => /\/build\/main-[\w-]+\.js$/.test(n));
const M = await import(core);
const V = Object.values(M);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const find = (name, pred) => {
  for (const v of V) { try { if (pred(v)) return v; } catch (e) { /* 不是這個 */ } }
  note('⚠ 找不到：' + name);
  return null;
};
const fnBySrc = (name, ...parts) => find(name, v => typeof v === 'function' && parts.every(p => String(v).includes(p)));
const safe = (f, d = null) => { try { const r = f(); return r === undefined ? d : r; } catch (e) { return d; } };

/* ---------- 找資料表 ---------- */
const settings = find('設定', v => isObj(v) && 'lang' in v && 'master' in v);
if (!settings || settings.lang !== 'zh-TW') throw new Error('請先把遊戲語言切成繁體中文（目前：' + (settings && settings.lang) + '）');
const T = find('翻譯函式', v => typeof v === 'function' && v.length === 2 && String(v).includes('.replace(/\\{(\\w+)\\}/g') && safe(() => v('Cueva de Payon')) !== 'Cueva de Payon');
const W = fnBySrc('武器種類名稱', '"otra arma"');
const dropChance = fnBySrc('掉落機率', '15e-5');
const signature = fnBySrc('裝備專屬加成', '★ ');
const jobs1 = find('一轉職業', v => Array.isArray(v) && v.some(j => j && j.id === 'swordsman') && !v.some(j => j && j.base));
const jobs2 = find('二轉職業', v => Array.isArray(v) && v.length > 3 && v.every(j => j && j.base && j.rank === 2));
const skills = find('技能', v => isObj(v) && v.bash && v.bash.maxLevel && v.bash.kind);
const talents = find('天賦', v => isObj(v) && v['swordsman.0.sword_mastery'] && 'maxRank' in v['swordsman.0.sword_mastery']);
const branches = find('天賦分支', v => isObj(v) && Array.isArray(v.knight) && v.knight[0] && 'paths' in v.knight[0]);
const jobSkills1 = find('一轉技能', v => isObj(v) && Array.isArray(v.swordsman) && v.swordsman.includes('bash'));
const jobSkills2 = find('二轉技能', v => isObj(v) && Array.isArray(v.knight) && typeof v.knight[0] === 'string' && !v.swordsman);
const starter = find('初始裝備', v => isObj(v) && Array.isArray(v.swordsman) && v.swordsman.includes(1101) && v.swordsman.includes(2301));
const story = find('劇情武器', v => isObj(v) && Array.isArray(v.swordsman) && typeof v.swordsman[0] === 'number' && !v.swordsman.includes(1101) && !v.knight);
const items = find('物品', v => isObj(v) && v[1101] && 'slot' in v[1101] && 'cardSlots' in v[1101]);
const cards = find('卡片', v => isObj(v) && v[4001] && v[4001].monster);
const monsters = find('怪物', v => isObj(v) && v.poring && v.poring.hp && v.poring.level);
const drops = find('掉落', v => isObj(v) && Array.isArray(v.poring) && v.poring[0] && 'rate' in v.poring[0]);
const scripts = find('關卡腳本', v => isObj(v) && v.prontera && v.prontera.waves);
const xt = find('素材清單', v => isObj(v) && v.manifest && v.manifest.items);
const tagLabels = find('技能標籤', v => isObj(v) && typeof v.melee === 'string' && typeof v.single === 'string');
const gearSlots = find('裝備欄位', v => Array.isArray(v) && v.length >= 8 && v.every(s => s && s.id && s.name && s.gear));
const qualities = find('品質', v => Array.isArray(v) && v.length >= 4 && v.every(q => q && 'mult' in q && 'name' in q));
const man = xt ? xt.manifest : {};
const icon = k => (man.icons && man.icons[k]) || null;
const plain = o => JSON.parse(JSON.stringify(o, (k, v) => typeof v === 'function' ? undefined : v));

/* ---------- 職業 ---------- */
const jobOut = [...(jobs1 || []), ...(jobs2 || [])].map(j => ({
  id: j.id, base: j.base || null, rank: j.rank || 1, tier: j.tier,
  name: j.name, nameF: j.nameF || null, desc: j.desc,
  hp: j.hp, speed: j.speed, armor: j.armor, scaling: j.scaling,
  scalingName: tagLabels && tagLabels[j.scaling] ? T(tagLabels[j.scaling]) : j.scaling,
  start: j.start, mount: j.mount || null,
  icon: icon('job_' + j.id) || (skills && skills[j.start] && icon(skills[j.start].icon)),
  skills: ((j.rank === 2 ? jobSkills2 : jobSkills1) || {})[j.id] || [],
  starter: (starter || {})[j.id] || [],
  story: (story || {})[j.id] || [],
  promotions: (jobs2 || []).filter(p => p.base === j.id).map(p => p.id),
}));

/* ---------- 技能 ---------- */
const skillOut = Object.values(skills || {}).map(s => ({
  id: s.id, name: s.name, icon: icon(s.icon), kind: s.kind, maxLevel: s.maxLevel, type: s.type,
  tags: s.tags || [], tagNames: (s.tags || []).map(t => tagLabels && tagLabels[t] ? T(tagLabels[t]) : t),
  desc1: safe(() => s.desc(1)), descMax: s.maxLevel > 1 ? safe(() => s.desc(s.maxLevel)) : null,
}));

/* ---------- 天賦 ---------- */
const talentOut = Object.values(talents || {}).map(t => ({
  id: t.id, job: t.job, branch: t.branch, row: t.row, col: t.col, name: t.name, icon: icon(t.icon),
  maxRank: t.maxRank, desc1: safe(() => t.desc(1)), descMax: t.maxRank > 1 ? safe(() => t.desc(t.maxRank)) : null,
  learn: t.learn || null, weapons: (t.weapons || []).map(w => (W ? W(w) : w)), needsShield: !!t.needsShield,
  path: t.path || null, req: t.req || null,
}));
const branchOut = {};
for (const [job, list] of Object.entries(branches || {})) {
  branchOut[job] = list.map(b => ({ name: b.name, icon: icon(b.icon), desc: b.desc, paths: b.paths ? plain(b.paths) : null }));
}

/* ---------- 物品 ---------- */
const qFirst = qualities && qualities[0], qLast = qualities && qualities[qualities.length - 1];
const sigText = (id, q) => safe(() => signature(id, q.id).map(b => b.text(1)), []);
const itemOut = Object.values(items || {}).map(i => {
  const m = (man.items || {})[i.id] || {};
  return {
    id: i.id, nameEN: m.name || null, icon: m.icon || null, slot: i.slot, cardSlots: i.cardSlots,
    base: i.base || null, jobs: i.jobs || null, wtype: i.wtype || null, wtypeName: i.wtype && W ? W(i.wtype) : null,
    rare: !!i.rare, starter: !!i.starter, secret: !!i.secret, gender: i.gender || null,
    bonuses: (i.bonuses || []).map(b => safe(() => b.text(1), '')),
    sig: qFirst ? sigText(i.id, qFirst) : [], sigMax: qLast ? sigText(i.id, qLast) : [],
    type: (m.description || []).find(l => /^Type:/.test(l)) || null,
  };
});

/* ---------- 卡片 ---------- */
const slotName = Object.fromEntries((gearSlots || []).map(s => [s.gear, s.name]));
const cardOut = Object.values(cards || {}).map(c => {
  const m = (man.cards || {})[c.id] || {};
  return { id: c.id, nameEN: m.name || null, image: m.image || null, monster: c.monster, compound: c.compound,
    compoundName: slotName[c.compound] || (/^acc/.test(c.compound) ? slotName.acc || slotName.acc1 : null) || c.compound,
    bonuses: (c.bonuses || []).map(b => safe(() => b.text(1), '')) };
});

/* ---------- 怪物與掉落 ---------- */
const monOut = Object.values(monsters || {}).map(m => plain(m));
const dropOut = {};
for (const [mon, list] of Object.entries(drops || {})) {
  const boss = !!(monsters && monsters[mon] && monsters[mon].boss);
  dropOut[mon] = list.map(d => ({ id: d.id, rate: d.rate, chance: dropChance ? safe(() => dropChance(d.id, d.rate, boss)) : null }));
}

/* ---------- 關卡（關卡清單在 main.js，直接讀原始碼） ---------- */
const mainSrc = mainUrl ? await (await fetch(mainUrl)).text() : '';
const stageOut = [];
const stageRe = /\{id:"(\w+)",name:"([^"]+)",place:"([^"]+)",levels:"([^"]+)",tier:(\d+)((?:[^{}]|\{[^{}]*\}|\[[^\]]*\])*)\}/g;
for (const m of mainSrc.matchAll(stageRe)) {
  const rest = m[6];
  const num = k => { const r = new RegExp(k + ':(\\d+)').exec(rest); return r ? +r[1] : null; };
  const str = k => { const r = new RegExp(k + ':"(\\w+)"').exec(rest); return r ? r[1] : null; };
  const sc = scripts && scripts[m[1]];
  stageOut.push({
    id: m[1], name: T(m[2]), place: T(m[3]), levels: m[4], tier: +m[5],
    gsMin: num('gsMin'), jobLvMin: num('jobLvMin'), story: str('story'),
    open: !!sc, secret: /secret:\{job:"(\w+)"/.exec(rest)?.[1] || null,
    planned: sc ? null : { monsters: (/monsters:\[([^\]]*)\]/.exec(rest)?.[1] || '').match(/\w+/g) || [],
      mvp: /mvp:\{id:"(\w+)"/.exec(rest)?.[1] || null },
  });
}
if (!stageOut.length) note('⚠ 找不到關卡清單（main.js 結構改了）');
const scriptOut = {};
for (const [id, s] of Object.entries(scripts || {})) {
  scriptOut[id] = { map: s.map, mapName: null, runLength: s.runLength, jobCap: s.jobCap, jobExp: s.jobExp,
    story: s.story || null, storyOnly: !!s.storyOnly, reward: s.reward || null, jobWeapon: !!s.jobWeapon, bosses: (s.bosses || []).map(b => ({ t: b.t, id: b.id })),
    pool: [...new Set((s.waves || []).flatMap(w => w.pool || []))] };
}

/* ---------- 種族、屬性、體型（main.js） ---------- */
const labelMap = re => { const m = re.exec(mainSrc); if (!m) return {}; const o = {}; for (const p of m[0].matchAll(/(\w+):"([^"]+)"/g)) o[p[1]] = T(p[2]); return o; };
const races = labelMap(/\{formless:"[^}]+\}/);
const elements = labelMap(/\{neutral:"Neutro"[^}]+\}/);
const sizes = labelMap(/\{small:"[^"]+",\s*medium:"[^"]+",\s*large:"[^"]+"\}/);
const monInfo = {};
for (const m of mainSrc.matchAll(/(\w+):\w{1,3}\("(\w+)","(\w+)",(\d),"(small|medium|large)"\)/g)) monInfo[m[1]] = { race: m[2], element: m[3], elementLv: +m[4], size: m[5] };

/* ---------- 寵物（清單在 main.js 內部；加成函式是從 soul_linker 匯入的，用匯出名稱重算文字） ---------- */
const petOut = [];
const petRules = {};
{
  const imp = /import\{([^}]*)\}from"\.\/soul_linker[^"]*"/.exec(mainSrc);
  const local2export = {};
  if (imp) for (const p of imp[1].matchAll(/(\$?\w+) as (\$?\w+)/g)) local2export[p[2]] = p[1];
  const pushFn = /function (\w+)\(a,e,t,s,n\)\{\w+\.push\(\{id:a,egg:e,acc:t,bonuses:s,from:n\}\)\}/.exec(mainSrc);
  if (!pushFn) note('⚠ 找不到寵物清單（main.js 結構改了）');
  else {
    const callRe = new RegExp(pushFn[1].replace(/\$/g, '\\$') + '\\("(\\w+)",(\\d+),(void 0|\\d+),\\[([^\\]]*)\\](?:,"(\\w+)")?\\)', 'g');
    for (const m of mainSrc.matchAll(callRe)) {
      const bonus = mult => [...m[4].matchAll(/(\$?\w+)\(([^()]*)\)/g)].map(b => {
        const fn = M[local2export[b[1]]];
        return fn ? safe(() => fn(Number(b[2])).text(mult), '?') : '?';
      });
      const egg = +m[2], acc = m[3] === 'void 0' ? null : +m[3];
      petOut.push({
        id: m[1], egg, eggEN: (man.items || {})[egg]?.name || null, eggIcon: (man.items || {})[egg]?.icon || null,
        acc, accEN: acc ? (man.items || {})[acc]?.name || null : null, accIcon: acc ? (man.items || {})[acc]?.icon || null : null,
        from: m[5] || null, neutral: bonus(0.5), cordial: bonus(0.75), loyal: bonus(1), loyalAcc: bonus(1.5),
      });
    }
  }
  const tiers = [...mainSrc.matchAll(/\{name:"(Neutral|Cordial|Leal)",min:(\d+),mult:([\d.]+)\}/g)].map(t => ({ id: t[1], name: T(t[1]), min: +t[2], mult: +t[3] }));
  const c1 = /const \w+=(1e3|\d+),\w+=(\d+),\w+=(\d+),\w+=\[\{name:"Neutral"/.exec(mainSrc);
  const c2 = /mult:1\}\],\w+=\w+\[2\]\.min,\w+=([\d.]+),\w+=(\d+),\w+=\w+\[1\]\.min,\w+=(\d+)/.exec(mainSrc);
  const egg = /function \w+\(a\)\{return a\?([\d.e-]+):([\d.e-]+)\}const \w+=1e3/.exec(mainSrc);
  Object.assign(petRules, {
    tiers, max: c1 ? Number(c1[1]) : null, start: c1 ? +c1[2] : null, secondsPerPoint: c1 ? +c1[3] : null,
    accMult: c2 ? +c2[1] : null, accPrice: c2 ? +c2[2] : null, evolveKills: c2 ? +c2[3] : null,
    eggMvp: egg ? Number(egg[1]) : null, eggNormal: egg ? Number(egg[2]) : null,
  });
  if (!tiers.length || !c1 || !c2 || !egg) note('⚠ 寵物規則數字有些沒抓到：' + JSON.stringify(petRules));
}

/* ---------- 神祇（寶箱第五格：技能神祇 1～10 級、屬性神祇） ---------- */
const deityOut = { skills: {}, stats: [] };
{
  const cls = find('神祇效果', v => typeof v === 'function' && typeof v.deityTexts === 'function');
  if (cls && skills) for (const [id, s] of Object.entries(skills)) {
    const inst = safe(() => s.create && s.create());
    if (!inst) continue;
    const ranks = [];
    for (let r = 1; r <= 10; r++) ranks.push(safe(() => cls.deityTexts(inst, r), []));
    if (ranks[0].length) deityOut.skills[id] = ranks;
  }
  const statTbl = find('屬性神祇', v => isObj(v) && Object.values(v).some(x => x && x.slot === 'deity' && x.range));
  for (const x of Object.values(statTbl || {})) if (x && x.slot === 'deity') {
    const m = (man.items || {})[x.icon] || {};
    deityOut.stats.push({ id: x.id, name: T(x.name), icon: m.icon || icon(x.icon), min: safe(() => x.text(x.range[0])), max: safe(() => x.text(x.range[1])) });
  }
  if (!Object.keys(deityOut.skills).length) note('⚠ 技能神祇是空的');
}

const versionM =/commit:"(\w+)",\s*date:"(\d{4})-(\d\d)-(\d\d)/.exec(mainSrc);
const dump = {
  version: versionM ? versionM[2] + versionM[3] + versionM[4] + '_' + versionM[1] : null, dumpedAt: new Date().toISOString(),
  jobs: jobOut, skills: skillOut, talents: talentOut, branches: branchOut,
  items: itemOut, cards: cardOut, monsters: monOut, drops: dropOut, monInfo,
  labels: { races, elements, sizes, slots: slotName, qualities: (qualities || []).map(q => ({ id: q.id, name: q.name, mult: q.mult })) },
  stages: stageOut, scripts: scriptOut,
  pets: petOut, petRules, deities: deityOut,
  log,
};
const body = JSON.stringify(dump);
const r = await fetch('/__dump', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
note(`送出 ${(body.length / 1024).toFixed(0)} KB：${r.ok ? '成功' : '失敗 ' + r.status}`);
export default { ok: r.ok, size: body.length, counts: { jobs: jobOut.length, skills: skillOut.length, talents: talentOut.length, items: itemOut.length, cards: cardOut.length, monsters: monOut.length, stages: stageOut.length, pets: petOut.length }, petRules, log };
