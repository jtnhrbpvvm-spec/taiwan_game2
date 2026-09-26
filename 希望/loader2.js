// ==========================================================================
// 放置希望 改機面板 loader2
//
// 遊戲：https://idle-seal.pp771007.workers.dev/
//
// 用法（三種都可以，內容是同一份）：
//   1. 遊戲畫面按 F12 → Console → 貼上整份 → Enter
//   2. Tampermonkey / Violentmonkey 新增腳本，貼上整份
//      （@match https://idle-seal.pp771007.workers.dev/*）
//   3. 做成書籤：javascript: + encodeURIComponent(這份檔案的全文)
//      ⚠️ 一定要整段編碼。半套編碼過的書籤會留下 %27 在程式碼裡
//      （typeof x===%27function%27），整段 SyntaxError、面板連畫都畫不出來。
//
// 對應 2026-09 改版：掉寶已改走 giveDrop() → giveUnidentified()，
// 事後用 give() 補發會造成永遠白色、按不了鑑定的裝備。詳見檔案內註解。
// ==========================================================================
/*
 * 放置希望 改機面板 (idle-seal cheat panel)
 *
 * 以 prototype 覆寫的方式掛在遊戲的 session 物件上。不改遊戲檔案、不碰存檔格式，
 * 重新整理後重新注入即可。
 *
 * 遊戲：https://idle-seal.pp771007.workers.dev/
 */
(() => {
  'use strict';

  const PANEL_ID = 'idle-seal-cheat-panel';
  if (document.getElementById(PANEL_ID)) return;

  // ---------------------------------------------------------------- 設定儲存

  const MULT_KEY = 'idle_seal_mults_v2';
  const TOGGLE_KEY = 'idle_seal_toggles_v1';
  const COLLAPSE_KEY = 'idle_seal_panel_collapsed';
  const RISK_ACK_KEY = 'idle_seal_risk_ack_v1'; // 危險倍率確認過沒有

  const DROP_COUNT_MAX = 10;

  const MULT_DEFAULTS = {
    moveSpeed: 5,
    gold: 5,
    exp: 5,
    dmg: 5,
    respawn: 5,
    fame: 5,
    drop: 5, // 超過 2 就會開始餓死同 tier 排後面的稀有物品，所以拉過 2 會跳彈窗確認
    dropCount: 1, // 打一隻怪 ＝ 平常打幾隻的收穫（1~10）
    petExp: 1, // 寵物 ＋ 戰寵 共用的經驗倍率
    petFeed: 1, // 寵物餵食速度倍率（餵食間隔縮短）
  };

  const TOGGLE_DEFAULTS = {
    skipEvolveMaterials: false,
    maxRefine: false,
  };

  function load(key, defaults) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return Object.assign({}, defaults, JSON.parse(raw));
    } catch (e) {
      /* localStorage 被鎖或內容壞掉，就用預設值 */
    }
    return Object.assign({}, defaults);
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* 存不進去不影響本次執行 */
    }
  }

  const mults = load(MULT_KEY, MULT_DEFAULTS);
  const toggles = load(TOGGLE_KEY, TOGGLE_DEFAULTS);
  const riskAcks = load(RISK_ACK_KEY, {});

  const saveMults = () => save(MULT_KEY, mults);
  const saveToggles = () => save(TOGGLE_KEY, toggles);
  const saveRiskAcks = () => save(RISK_ACK_KEY, riskAcks);

  // ------------------------------------------------------------ 找 session

  let session = null;
  let patched = false;

  // session 是遊戲那顆巨大的狀態物件。這三個方法同時存在的東西只有它。
  function looksLikeSession(obj) {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.moveSpeed === 'function' &&
      typeof obj.wornItems === 'function' &&
      typeof obj.tick === 'function'
    );
  }

  function scanObjectGraph(root, maxDepth, maxNodes) {
    const seen = new Set();
    const queue = [[root, 0]];
    let count = 0;
    while (queue.length) {
      const [obj, depth] = queue.shift();
      if (!obj || typeof obj !== 'object' || seen.has(obj)) continue;
      seen.add(obj);
      if (++count > maxNodes) break;
      if (looksLikeSession(obj)) return obj;
      if (depth >= maxDepth) continue;
      let keys;
      try {
        keys = Object.keys(obj);
      } catch (e) {
        continue;
      }
      for (const k of keys) {
        let v;
        try {
          v = obj[k];
        } catch (e) {
          continue;
        }
        if (v && typeof v === 'object') queue.push([v, depth + 1]);
      }
    }
    return null;
  }

  function findVueRoots() {
    const roots = [];
    for (const el of document.querySelectorAll('*')) {
      for (const k of Object.keys(el)) {
        if (k.startsWith('__vue') || k.startsWith('__vnode')) {
          if (el[k]) roots.push(el[k]);
        }
      }
    }
    return roots;
  }

  function locateSession() {
    if (looksLikeSession(window.__idleSealManualSession)) {
      return window.__idleSealManualSession;
    }
    for (const root of findVueRoots()) {
      const found = scanObjectGraph(root, 8, 30000);
      if (found) return found;
    }
    return null;
  }

  // -------------------------------------------------------------- 覆寫本體

  const MAX_REFINE = 12;

  // skipEvolveMaterials 只能在寵物進化的呼叫期間生效。
  // 全域把 usableCount 開成 Infinity、take 變成空操作會弄壞副本入場的丟棄邏輯、
  // 自動料理、任務交付等等 —— 那是舊版會當掉的原因。
  let inEvolveScope = 0;

  function withEvolveScope(fn, self, args) {
    inEvolveScope++;
    try {
      return fn.apply(self, args);
    } finally {
      inEvolveScope--;
    }
  }

  const evolveSkipActive = () => toggles.skipEvolveMaterials && inEvolveScope > 0;

  function applyPatches(s) {
    const proto = Object.getPrototypeOf(s);
    if (proto.__idleSealPatched) return;
    proto.__idleSealPatched = true;

    const wrap = (name, make) => {
      if (typeof proto[name] !== 'function') {
        console.warn(`[idle-seal 改機] 找不到 ${name}()，這一項跳過（遊戲可能又改版了）`);
        return;
      }
      proto[name] = make(proto[name]);
    };

    // 移動速度：回傳值直接放大。
    wrap('moveSpeed', (orig) => function (...args) {
      const v = orig.apply(this, args);
      return typeof v === 'number' && Number.isFinite(v) ? v * mults.moveSpeed : v;
    });

    // 經驗：每殺一隻的經驗值放大。
    wrap('expPerKill', (orig) => function (...args) {
      const v = orig.apply(this, args);
      try {
        return Math.max(1, Math.round(v * mults.exp));
      } catch (e) {
        return v;
      }
    });

    // 掉寶：改遊戲自己的倍率，讓掉落物照原路徑走 giveDrop()。
    //
    // 不要在 rewardKill 之後用 give() 補發 —— 改版後掉寶會經過
    //   giveDrop(id) → dropsUnidentified(id) ? giveUnidentified(id,1) : give(id,1)
    // give() 建出來的堆疊沒有 unidentified 旗標，鑑定守門會判成 'done'，
    // 結果就是一堆永遠白色、永遠不能鑑定的裝備。
    // 改 dropMultiplier 連離線掛機結算也一起生效。
    wrap('dropMultiplier', (orig) => function (...args) {
      const v = orig.apply(this, args);
      return typeof v === 'number' && Number.isFinite(v) ? v * mults.drop : v;
    });

    // 掉落數量：打一隻怪 ＝ 平常打 N 隻的收穫。
    //
    // 重點是「多擲幾次骰」而不是「同一件給 N 個」。前者每一次都是正常倍率下的
    // 獨立擲骰，掉出來的種類分布跟真的多打 N 隻一樣；後者只會讓背包塞滿同一件。
    //
    // 沒辦法直接再呼叫一次 Ol()（它是 bundle 裡的模組層函式，拿不到），
    // 但 dropChances(monster) = Dl(drops, dropMultiplier, whiffChance) 回傳的是
    // 「每殺一隻，每件物品各自的機率」，tier 互斥的邏輯已經算進去了。
    // 用它逐件獨立擲骰，正好就是遊戲自己離線結算的模型 ——
    // jl() 對每件物品跑的是 binomial(殺怪數, p)，同樣是獨立的。
    //
    // 用 Math.random() 而不是遊戲的 withRng()：後者是有種子的共用亂數流，
    // 多抽會連帶改變之後的戰鬥擲骰。
    const dropCount = () => {
      const n = Math.round(Number(mults.dropCount) || 1);
      return Math.min(DROP_COUNT_MAX, Math.max(1, n));
    };

    wrap('rewardKill', (orig) => function (monsterId, ...rest) {
      const result = orig.call(this, monsterId, ...rest);

      const n = dropCount();
      if (n <= 1) return result;

      try {
        const monster = this.data.monsterById.get(monsterId);
        if (!monster) return result;

        const chances = this.dropChances(monster);
        if (!(chances instanceof Map)) return result;

        // 第 1 隻是原函式已經算過的，這裡補剩下的 n-1 隻。
        for (let kill = 1; kill < n; kill++) {
          for (const [itemId, p] of chances) {
            if (!(p > 0) || Math.random() >= p) continue;
            // giveDrop 自己會分岔 giveUnidentified / give，旗標才會正確。
            this.giveDrop(itemId);
            this.drops.set(itemId, (this.drops.get(itemId) ?? 0) + 1);
            this.player.looted += 1;
            this.player.seenItems.add(itemId);
          }
        }
      } catch (e) {
        console.warn('[idle-seal 改機] 追加掉落失敗', e);
      }
      return result;
      // 刻意不呼叫 push()／lootFx()／cue()：N=10 時一隻怪會噴掉幾十行訊息，
      // 蓋掉戰鬥紀錄。拿到什麼看本趟統計（this.drops）就好。
    });

    // 離線掛機結算不經過 rewardKill，要另外放大。
    // 那邊的 jl() 已經是「殺 N 隻」的 binomial，所以把結果的件數 ×N
    // 期望值就等於多打 N 倍的怪。
    //
    // 掛在 withOfflineRng 而不是 applyOfflineChunk —— 離線那一圈長這樣：
    //
    //   let ue = new Map;
    //   for (…) { let a = e.withOfflineRng(t => jl(i.drops, r, t, …));
    //             for (…) ue.set(id, (ue.get(id) ?? 0) + c) }
    //   for (let [id, c] of ue) o.set(id, (o.get(id) ?? 0) + c);   // ← 結算摘要
    //   e.applyOfflineChunk({ kills: le, loot: ue, … })            // ← 進背包
    //
    // 摘要 o 和背包讀的是同一份 ue，而且摘要先累加。所以在 applyOfflineChunk
    // 放大只會讓背包變多、摘要報少；在這裡放大才兩邊一致。
    //
    // withOfflineRng 全檔只有那一處在用（本體是 `return this.withRng(e)`），
    // 回傳一定是 itemId → 數量的 Map。還是檢查一次型別，免得改版後它被挪去別的地方用。
    wrap('withOfflineRng', (orig) => function (fn) {
      const result = orig.call(this, fn);
      const n = dropCount();
      if (n <= 1 || !(result instanceof Map)) return result;
      try {
        const scaled = new Map();
        for (const [id, count] of result) {
          if (typeof count !== 'number' || !Number.isFinite(count)) return result;
          scaled.set(id, count * n);
        }
        return scaled;
      } catch (e) {
        return result;
      }
    });

    // 金錢：自動販賣的收入放大。
    wrap('sellSweep', (orig) => function (...args) {
      let before = 0;
      try {
        before = this.player?.gold ?? 0;
      } catch (e) {
        /* ignore */
      }
      const result = orig.apply(this, args);
      try {
        if (this.player && mults.gold > 1) {
          const delta = this.player.gold - before;
          if (delta > 0) this.player.gold += Math.round(delta * (mults.gold - 1));
        }
      } catch (e) {
        /* ignore */
      }
      return result;
    });

    // 傷害：只在 tick 期間暫時放大我方的 atk / mag，算完就還原。
    // 直接改 stats 會被 refreshPlayerStats() 覆蓋掉，所以逐 tick 套用。
    wrap('tick', (orig) => function (...args) {
      let backup = null;
      try {
        if (mults.dmg > 1 && Array.isArray(this.battle?.units)) {
          backup = [];
          for (const u of this.battle.units) {
            if (u.side !== 'ally' || !u.stats) continue;
            for (const key of ['atk', 'mag']) {
              if (typeof u.stats[key] === 'number') {
                backup.push([u.stats, key, u.stats[key]]);
                u.stats[key] = Math.round(u.stats[key] * mults.dmg);
              }
            }
          }
        }
      } catch (e) {
        backup = null;
      }

      const result = orig.apply(this, args);

      try {
        if (backup) for (const [stats, key, value] of backup) stats[key] = value;
      } catch (e) {
        /* ignore */
      }
      return result;
    });

    // 怪物重生：原函式每 tick 固定扣一個步長，這裡按實際經過時間再多扣一些。
    wrap('tickRespawns', (orig) => {
      let lastAt = null;
      return function (...args) {
        const result = orig.apply(this, args);
        try {
          const now = performance.now();
          const dt = lastAt === null ? 0 : now - lastAt;
          lastAt = now;
          if (mults.respawn > 1 && dt > 0 && Array.isArray(this.instances)) {
            const extra = dt * (mults.respawn - 1);
            for (const inst of this.instances) {
              if (inst.alive || !(inst.respawnMs > 0)) continue;
              inst.respawnMs = Math.max(0, inst.respawnMs - extra);
              if (inst.respawnMs <= 0) {
                inst.alive = true;
                inst.respawnMs = 0;
                inst.lastUnitId = undefined;
                this.dirty = true;
              }
            }
          }
        } catch (e) {
          /* ignore */
        }
        return result;
      };
    });

    // --- 寵物經驗（寵物 ＋ 戰寵共用一個倍率）-------------------------------
    //
    // 遊戲裡是兩套完全獨立的系統，同一個倍率要分別掛：
    //
    //   寵物 pets        grow 0~9 ＋ 每段的 exp，靠餵飼料
    //                    tickPet(ms) → feedOnce(pet, def) → Cy(pet, def, feed)
    //   戰寵 battlePets  level ＋ exp，靠打怪
    //                    rewardBattlePetExp(monster) → zd() 算經驗 → Bd() 給經驗＋升級
    //
    // 🚨 不要去乘 buildPetView() 回傳的 exp 欄位。那個值是
    //      xy(pet, def) = Math.min(1, pet.exp / by(def, pet.grow))
    //    也就是「這一條進度的比例」，乘完照樣被 Math.min(1, …) 夾在 1，
    //    畫面上就變成百分比而不是倍數。真正的經驗在 pet.exp。

    const petExpMult = () => Math.max(1, Math.round(Number(mults.petExp) || 1));

    // 寵物餵食速度：tickPet(ms) 每累積 ay 毫秒餵一次，把時間流速 ×N 就是
    // 餵食間隔縮成 1/N。這一項會真的吃掉便當／自動購買花錢，跟下面的
    // 經驗倍率是兩件事：
    //   餵食速度 ×N  → 餵的「次數」變 N 倍（飼料與金錢等比消耗）
    //   經驗倍率 ×M  → 每餵一次的「經驗」變 M 倍（多的那幾份不用飼料）
    // 兩個都拉的話效果相乘（N×M），這是刻意的。
    wrap('tickPet', (orig) => function (ms) {
      const n = Math.max(1, Number(mults.petFeed) || 1);
      return orig.call(this, n > 1 && typeof ms === 'number' ? ms * n : ms);
    });

    // 寵物：讓 feedOnce 多跑 N-1 次，多的那幾次不吃飼料也不花錢。
    //
    // 之前的做法是把 tickPet(ms) 的時間流速 ×N，那有兩個問題：
    // 便當盒空著又沒開自動購買時 feedOnce 原封不動回傳，完全沒效果（實測感覺不到
    // 經驗變多就是這個）；有飼料時則是飼料與金錢等比燒掉，不是「經驗倍率」。
    //
    // 現在改成：第一次照常吃一份，剩下 N-1 次把 takeFromLunchbox() 暫時改成
    // 直接回傳這隻寵物該吃的飼料量。餵多少、要不要進下一個 grow，
    // 全部還是交給遊戲自己的 Cy()，不需要 by() 裡那些私有常數。
    let freeFeedAmount;

    wrap('takeFromLunchbox', (orig) => function (...args) {
      if (freeFeedAmount !== undefined) return freeFeedAmount;
      return orig.apply(this, args);
    });

    wrap('feedOnce', (orig) => function (pet, def) {
      let result = orig.call(this, pet, def);

      const n = petExpMult();
      if (n <= 1) return result;

      // 這隻寵物吃的飼料種類本來就記在 def.food 上，用遊戲自己的表查。
      const feed = this.data?.petFoodByKind?.get(def?.food)?.feed;
      if (!(typeof feed === 'number' && feed > 0)) return result;

      const previous = freeFeedAmount;
      freeFeedAmount = feed;
      try {
        for (let i = 1; i < n; i++) result = orig.call(this, result, def);
      } catch (e) {
        console.warn('[idle-seal 改機] 寵物加餐失敗', e);
      } finally {
        freeFeedAmount = previous;
      }
      return result;
    });

    // 戰寵：每隻怪給的經驗由 zd(sys, monster.exp, playerLevel) 算死，
    // 重複結算 N 次就是 N 倍。升級與 maxLevel 上限都留給原本的 Bd()。
    // 沒召出戰寵時 orig 會自己 early return，重複呼叫不會有副作用。
    wrap('rewardBattlePetExp', (orig) => function (monster) {
      const n = petExpMult();
      let result;
      for (let i = 0; i < n; i++) result = orig.call(this, monster);
      return result;
    });

    // 名聲：交任務拿到的名聲放大。
    // player.fame 會被整顆換成新物件 {current,total}，所以比對前後數值而不是留參考。
    wrap('submitQuest', (orig) => function (...args) {
      let beforeCurrent = 0;
      let beforeTotal = 0;
      try {
        if (this.player?.fame) {
          beforeCurrent = this.player.fame.current;
          beforeTotal = this.player.fame.total;
        }
      } catch (e) {
        /* ignore */
      }

      const result = orig.apply(this, args);

      try {
        const fame = this.player?.fame;
        if (fame && mults.fame > 1) {
          const dCurrent = fame.current - beforeCurrent;
          const dTotal = fame.total - beforeTotal;
          if (dCurrent > 0) fame.current += Math.round(dCurrent * (mults.fame - 1));
          if (dTotal > 0) fame.total += Math.round(dTotal * (mults.fame - 1));
        }
      } catch (e) {
        /* ignore */
      }
      return result;
    });

    // --- 寵物進化跳過材料 -------------------------------------------------
    //
    // 改版後進化有四道門檻，缺一個都按不下去：
    //   1. buildPetView 回傳的 recipe.blocked = Ey(pet, def, recipe, count)
    //      UI 判斷是 `disabled: blocked !== undefined`，所以要 delete 掉，
    //      設成 false 一樣是 disabled。
    //   2. recipe.mats[].count 來自 buildPetPanel 傳進來的 Map，不是 usableCount，
    //      數量 0 的材料不會被挑進 defaultPick，挑到的數量就湊不到 min。
    //   3. evolvePet 裡的 Ey() 會看 grow >= 9 與 exp 是否滿，材料再多也過不了。
    //   4. py() 檢查挑的材料 usableCount > 0，接著 take() 真的扣。
    const EVOLVE_GROW_MAX = 9;

    wrap('evolvePet', (orig) => function (uid, ...rest) {
      if (!toggles.skipEvolveMaterials) return orig.call(this, uid, ...rest);
      try {
        // 補滿成長度與經驗，過掉 Ey() 的 'grow' / 'exp'。
        const pet = this.pets?.find((p) => p.uid === uid);
        if (pet && (pet.grow < EVOLVE_GROW_MAX || pet.exp < Number.MAX_SAFE_INTEGER)) {
          this.replacePet({ ...pet, grow: EVOLVE_GROW_MAX, exp: Number.MAX_SAFE_INTEGER });
        }
        return withEvolveScope(orig, this, [uid, ...rest]);
      } catch (e) {
        console.warn('[idle-seal 改機] evolvePet 失敗', e);
        return false;
      }
    });

    wrap('buildPetView', (orig) => function (...args) {
      const result = orig.apply(this, args);
      if (!toggles.skipEvolveMaterials) return result;
      try {
        for (const recipe of result?.recipes ?? []) {
          delete recipe.blocked; // UI 只看 !== undefined
          const ids = (recipe.mats ?? []).map((m) => {
            m.count = Math.max(m.count, recipe.need ?? 1);
            return m.id;
          });
          // 原本的 defaultPick 只收 count > 0 的材料，這裡直接湊滿。
          recipe.defaultPick = ids.slice(0, recipe.need ?? ids.length);
        }
      } catch (e) {
        /* ignore */
      }
      return result;
    });

    wrap('usableCount', (orig) => function (...args) {
      if (evolveSkipActive()) return Infinity;
      return orig.apply(this, args);
    });

    // 舊版遊戲用 countOf，新版改成 usableCount。兩個都掛著以防再改回去。
    wrap('countOf', (orig) => function (...args) {
      if (evolveSkipActive()) return Infinity;
      return orig.apply(this, args);
    });

    wrap('take', (orig) => function (...args) {
      if (evolveSkipActive()) return;
      return orig.apply(this, args);
    });

    // --- 精煉必定 +12 -----------------------------------------------------
    //
    // 改版後簽名變成 refineStack(stackId, stones = [], guardId)，而且要回傳
    //   { kind, name, from, level }
    // 給精煉面板收尾。舊版覆寫用 call(this, e) 吃掉後兩個參數又回傳 undefined，
    // 所以面板會卡住。
    wrap('refineStack', (orig) => function (stackId, ...rest) {
      if (!toggles.maxRefine) return orig.call(this, stackId, ...rest);
      try {
        const stack = this.mutableStack(stackId);
        if (!stack) return;

        const def = this.data.equipById.get(stack.itemId);
        if (!def || def.noUpgrade) return orig.call(this, stackId, ...rest);

        const from = stack.refine ?? 0;
        if (from >= MAX_REFINE) return;

        // splitOne 讓「一疊 N 件」只精煉其中一件，跟原函式一致。
        const one = this.splitOne(stack);
        one.refine = MAX_REFINE;

        const name = this.itemName(one.itemId);
        this.push(`${name} 精煉成功 → +${MAX_REFINE}`, 'equip');
        this.cue('success');
        this.refreshPlayerStats();
        this.applyNow();

        return { kind: 'success', name, from, level: MAX_REFINE };
      } catch (e) {
        console.warn('[idle-seal 改機] refineStack 覆寫失敗，改跑原本的', e);
        return orig.call(this, stackId, ...rest);
      }
    });

    // 戰寵裝備的精煉是完全獨立的一條路，跟 refineStack 沒有共用程式碼：
    //   refineBattlePetGear(slotIndex, stones = [])
    // 它改的是 battlePet.gear[slot]，不是 player.stacks，而且沒有回傳值
    // （UI 直接呼叫、不看結果），所以不用像 refineStack 那樣回傳結果物件。
    wrap('refineBattlePetGear', (orig) => function (slot, ...rest) {
      if (!toggles.maxRefine) return orig.call(this, slot, ...rest);
      try {
        if (!this.inVillage) return;

        const pet = this.battlePet;
        // 這一格沒穿東西時 battlePetGearInputs 會回傳空物件。
        const { worn } = this.battlePetGearInputs(slot) ?? {};
        if (!pet || !worn || !Array.isArray(pet.gear)) return orig.call(this, slot, ...rest);

        const from = worn.refine ?? 0;
        if (from >= MAX_REFINE) return;

        const gear = [...pet.gear];
        gear[slot] = {
          ...worn,
          refine: MAX_REFINE,
          refineTries: (worn.refineTries ?? 0) + 1,
        };
        this.battlePet = { ...pet, gear };

        this.push(`${this.itemName(worn.itemId)} 精煉成功 → +${MAX_REFINE}`, 'equip');
        this.cue('success');
        this.refreshBattlePetUnit();
        this.dirty = true;
        this.applyNow();
      } catch (e) {
        console.warn('[idle-seal 改機] refineBattlePetGear 覆寫失敗，改跑原本的', e);
        return orig.call(this, slot, ...rest);
      }
    });

    console.log('[idle-seal 改機] 原型方法覆寫完成');
  }

  function tryPatchLoop(attemptsLeft) {
    if (patched) return;
    const found = locateSession();
    if (found) {
      session = found;
      window.__idleSealSession = found;
      applyPatches(found);
      patched = true;
      setStatus('已找到並套用 (session 物件命中)');
      return;
    }
    if (attemptsLeft <= 0) {
      setStatus('自動尋找失敗，請進到遊戲畫面後按「重新尋找並套用」');
      return;
    }
    setTimeout(() => tryPatchLoop(attemptsLeft - 1), 1000);
  }

  // ------------------------------------------------------------------ 面板

  let statusEl = null;
  const setStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  const el = (tag, css, text) => {
    const node = document.createElement(tag);
    if (css) node.style.cssText = css;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const SLIDERS = [
    { key: 'moveSpeed', label: '移動速度倍率' },
    { key: 'gold', label: '金錢倍率（自動販賣）' },
    { key: 'exp', label: '經驗倍率' },
    { key: 'dmg', label: '傷害倍率（我方）' },
    { key: 'respawn', label: '怪物重生速度倍率' },
    { key: 'fame', label: '名聲倍率（交任務時）' },
    {
      key: 'drop',
      label: '掉寶機率倍率',
      // 上限 5：再往上只是把稀有物品餓死得更徹底，收穫不會真的變多。
      max: 5,
      // Ol() 每個 tier 只選一件，而且是 o = rng/(mul*Tl) 減到負數的第一項勝出。
      // mul 一大，第一項的區間就吃掉整個 [0,1)，同 tier 後面的項目再也掉不出來。
      // 門檻是 mul >= Cl / (Tl * w0)；實際資料裡最早 2.39x 就開始餓死。
      // 所以超過 2 倍要先跳彈窗，按確認才生效。
      confirmAbove: 2,
      confirmText:
        '⚠ 掉寶機率超過 2 倍，可能會無法取得低機率掉落物。\n\n' +
        '遊戲的擲骰是「同一類別最多只掉一件」，倍率一高，清單排前面的常見物品會把機率吃光，' +
        '排後面的稀有物品就再也掉不出來。\n\n' +
        '想要更多收穫，建議改用下面的「掉落數量」—— 那個等於多打幾隻怪，不會有這個問題。\n\n' +
        '確定要調到 2 倍以上嗎？',
    },
    { key: 'dropCount', label: '掉落數量（＝多打 N 倍的怪）', max: DROP_COUNT_MAX, unit: '倍' },
    { key: 'petExp', label: '寵物經驗倍率（含戰寵）' },
    { key: 'petFeed', label: '寵物餵食速度倍率（耗飼料）' },
  ];

  const ATTRS = [
    { key: 'str', label: '力量' },
    { key: 'agi', label: '敏捷' },
    { key: 'int', label: '智力' },
    { key: 'sta', label: '體力' },
    { key: 'wis', label: '精神' },
    { key: 'luck', label: '幸運' },
  ];

  // 需要等面板貼進 DOM 之後才跳的確認彈窗（見倍率滑桿那段）。
  const pendingRiskChecks = [];

  function buildPanel() {
    const panel = el(
      'div',
      'position:fixed;top:80px;right:20px;z-index:999999;width:270px;' +
        'max-height:calc(100vh - 100px);background:#1c1712;color:#eee;' +
        'border:1px solid #4a3f33;border-radius:8px;' +
        'font-family:-apple-system,"Microsoft JhengHei",sans-serif;font-size:13px;' +
        'box-shadow:0 4px 16px rgba(0,0,0,.5);user-select:none;' +
        'display:flex;flex-direction:column;overflow:hidden;'
    );
    panel.id = PANEL_ID;

    // --- 標題列（可拖曳、可收合）
    const header = el(
      'div',
      'padding:10px 12px;background:#2a221a;border-radius:8px 8px 0 0;cursor:move;' +
        'font-weight:bold;border-bottom:1px solid #4a3f33;flex-shrink:0;' +
        'display:flex;justify-content:space-between;align-items:center;'
    );
    header.appendChild(el('span', '', '放置希望 改機面板'));

    let collapsed = false;
    try {
      collapsed = !!localStorage.getItem(COLLAPSE_KEY);
    } catch (e) {
      /* ignore */
    }

    const collapseBtn = el(
      'button',
      'background:transparent;border:1px solid #4a3f33;color:#eee;width:22px;height:22px;' +
        'line-height:1;border-radius:4px;cursor:pointer;font-size:12px;flex-shrink:0;',
      collapsed ? '▸' : '▾'
    );
    header.appendChild(collapseBtn);
    panel.appendChild(header);

    const body = el('div', 'padding:12px;overflow-y:auto;flex:1;');
    if (collapsed) body.style.display = 'none';
    panel.appendChild(body);

    collapseBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      collapsed = !collapsed;
      body.style.display = collapsed ? 'none' : '';
      collapseBtn.textContent = collapsed ? '▸' : '▾';
      try {
        localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '');
      } catch (e) {
        /* ignore */
      }
    });

    // --- 倍率滑桿
    for (const field of SLIDERS) {
      const max = field.max ?? 100;
      // 上限調低過的項目，把舊設定裡超標的值夾回來（例如掉寶機率從 100 降到 5）。
      mults[field.key] = Math.min(max, Math.max(1, Number(mults[field.key]) || 1));

      const row = el('div', 'margin-bottom:10px;');
      const labelRow = el('div', 'display:flex;justify-content:space-between;margin-bottom:4px;');
      labelRow.appendChild(el('span', '', field.label));
      const unit = field.unit ?? 'x';
      const valueText = el('span', 'color:#e0b060;', `${mults[field.key]}${unit}`);
      labelRow.appendChild(valueText);
      row.appendChild(labelRow);

      const slider = el('input', 'width:100%;');
      slider.type = 'range';
      slider.min = '1';
      slider.max = String(max);
      slider.step = '1';
      slider.value = String(mults[field.key]);

      // confirmAbove 的項目超過門檻要先跳彈窗，按確認才生效。
      const threshold = field.confirmAbove;
      const risky = (value) => threshold !== undefined && value > threshold;

      // 確認狀態存在 localStorage，所以只會問一次，不是每次注入都問。
      // 掉回門檻以下會清掉，下次再拉上去重新問。
      let confirmed = !!riskAcks[field.key];

      const show = (value) => {
        slider.value = String(value);
        valueText.textContent = `${value}${unit}`;
      };

      const commit = (value) => {
        mults[field.key] = value;
        show(value);
        saveMults();
        if (!risky(value) && confirmed) {
          confirmed = false;
          delete riskAcks[field.key];
          saveRiskAcks();
        }
      };

      const ask = () => {
        if (!window.confirm(field.confirmText)) return false;
        confirmed = true;
        riskAcks[field.key] = true;
        saveRiskAcks();
        return true;
      };

      slider.addEventListener('input', () => {
        const value = Number(slider.value);
        // 拖曳中先只更新數字。還沒確認過的危險值不寫進設定，等 change 問過再說。
        valueText.textContent = `${value}${unit}`;
        if (risky(value) && !confirmed) return;
        commit(value);
      });

      // 彈窗掛在 change（放開滑桿）而不是 input（拖曳中連續觸發），
      // 否則從 1 拉到 5 會被問四次。
      slider.addEventListener('change', () => {
        const value = Number(slider.value);
        if (!risky(value) || confirmed) {
          commit(value);
          return;
        }
        if (ask()) commit(value);
        else show(mults[field.key]); // 取消就退回上一個生效的值
      });

      row.appendChild(slider);
      body.appendChild(row);

      // 面板開起來就已經在危險區、而且從來沒確認過（例如這就是預設值）——
      // 先退回門檻，問過才放行。這是「按下確認後才生效」的字面意思。
      // 排進 pendingRiskChecks，等面板真的貼進 DOM 後才跳，不然彈窗會比面板早出現。
      if (risky(mults[field.key]) && !confirmed) {
        const wanted = mults[field.key];
        commit(threshold);
        pendingRiskChecks.push(() => {
          if (ask()) commit(wanted);
        });
      }
    }

    statusEl = el('div', 'font-size:12px;color:#999;margin:8px 0;min-height:32px;', '尋找 session 物件中...');
    body.appendChild(statusEl);

    // --- 開關
    const checkbox = (id, label, checked, onChange, warning) => {
      const wrap = el(
        'div',
        'display:flex;flex-direction:column;margin-bottom:12px;padding:8px;' +
          'background:#241d16;border-radius:4px;'
      );
      const top = el('div', 'display:flex;align-items:center;gap:8px;');
      const input = el('input');
      input.type = 'checkbox';
      input.id = id;
      input.checked = checked;
      const labelEl = el('label', 'cursor:pointer;flex:1;', label);
      labelEl.htmlFor = id;
      input.addEventListener('change', () => onChange(input.checked));
      top.appendChild(input);
      top.appendChild(labelEl);
      wrap.appendChild(top);
      if (warning) {
        wrap.appendChild(
          el(
            'div',
            'color:#ffb020;font-size:11px;margin-top:4px;padding-left:21px;line-height:1.4;',
            warning
          )
        );
      }
      body.appendChild(wrap);
    };

    checkbox(
      'idle-seal-toggle-evolve',
      '寵物進化跳過材料需求',
      !!toggles.skipEvolveMaterials,
      (v) => {
        toggles.skipEvolveMaterials = v;
        saveToggles();
      },
      '只在進化的當下略過材料檢查，不會再影響副本入場與任務交付。'
    );

    checkbox(
      'idle-seal-toggle-refine',
      `裝備精煉必定成功（+${MAX_REFINE}，含戰寵裝備）`,
      !!toggles.maxRefine,
      (v) => {
        toggles.maxRefine = v;
        saveToggles();
      },
      '標記為不可強化（noUpgrade）的裝備會照原本流程走。'
    );

    // --- 能力值
    body.appendChild(el('div', 'font-weight:bold;margin:4px 0 8px;color:#e0b060;', '能力值直接設定'));

    const inputs = {};
    const grid = el('div', 'display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;');
    for (const attr of ATTRS) {
      const cell = el('div');
      cell.appendChild(el('div', 'font-size:11px;color:#999;margin-bottom:2px;', attr.label));
      const input = el(
        'input',
        'width:100%;padding:5px;background:#100d09;border:1px solid #4a3f33;color:#eee;' +
          'border-radius:4px;box-sizing:border-box;'
      );
      input.type = 'number';
      input.min = '0';
      input.placeholder = '0';
      cell.appendChild(input);
      grid.appendChild(cell);
      inputs[attr.key] = input;
    }
    body.appendChild(grid);

    const attrStatus = el('div', 'font-size:12px;color:#999;margin-bottom:8px;min-height:16px;');
    body.appendChild(attrStatus);

    const buttonRow = el('div', 'display:flex;gap:8px;margin-bottom:12px;');
    const loadBtn = el(
      'button',
      'flex:1;padding:8px;background:#3a3a3a;color:#fff;border:none;border-radius:4px;' +
        'cursor:pointer;font-size:12px;',
      '讀取目前數值'
    );
    loadBtn.addEventListener('click', () => {
      const attributes = session?.player?.attributes;
      if (!attributes) {
        attrStatus.textContent = '尚未找到 session，無法讀取';
        return;
      }
      for (const attr of ATTRS) inputs[attr.key].value = attributes[attr.key] ?? 0;
      attrStatus.textContent = '已讀取目前數值';
    });

    const applyBtn = el(
      'button',
      'flex:1;padding:8px;background:#5a3d1f;color:#fff;border:none;border-radius:4px;' +
        'cursor:pointer;font-size:12px;',
      '套用'
    );
    applyBtn.addEventListener('click', () => {
      if (!session?.player) {
        attrStatus.textContent = '尚未找到 session，無法套用';
        return;
      }
      try {
        const next = {};
        for (const attr of ATTRS) {
          next[attr.key] = Math.max(0, Math.floor(Number(inputs[attr.key].value) || 0));
        }
        session.player.attributes = next;
        session.refreshPlayerStats?.();
        session.applyNow?.();
        attrStatus.textContent = '已套用';
      } catch (e) {
        console.warn('[idle-seal 改機] 套用能力值失敗', e);
        attrStatus.textContent = '套用出錯（詳見 console）';
      }
    });

    buttonRow.appendChild(loadBtn);
    buttonRow.appendChild(applyBtn);
    body.appendChild(buttonRow);

    // --- 副本次數
    //
    // 每日次數記在 session.dungeon.used 上，形狀是 { [quota]: 已用次數 }：
    //   dungeonEntriesLeft(def) = gg(def, { day, used }) = max(0, def.entries - used[def.quota])
    //   dungeonBlock(def)       次數用完就回傳 'no-entry'
    //   enterDungeon(id)        進場時 _g() 把該 quota +1
    //   hg(state, today)        跨日時整個 used 清成 {}
    // 所以直接清空 used 就等於「今天還沒進過任何副本」。quota 是共用配額的
    // 群組鍵（同一組副本共吃一份次數），清空就全部一起重置。
    body.appendChild(el('div', 'font-weight:bold;margin:4px 0 8px;color:#e0b060;', '副本'));

    const dungeonStatus = el('div', 'font-size:12px;color:#999;margin-bottom:8px;min-height:16px;');

    const resetDungeonBtn = el(
      'button',
      'width:100%;padding:8px;background:#5a3d1f;color:#fff;border:none;border-radius:4px;' +
        'cursor:pointer;font-size:13px;margin-bottom:8px;',
      '重置今日副本次數'
    );
    resetDungeonBtn.addEventListener('click', () => {
      if (!session?.dungeon) {
        dungeonStatus.textContent = '尚未找到 session，無法重置';
        return;
      }
      try {
        const used = session.dungeon.used ?? {};
        const cleared = Object.keys(used).length;

        if (session.dungeon.run) {
          // 副本進行中 dungeonBlock() 會回傳 'in-run'，清了次數也還是進不去。
          dungeonStatus.textContent = '目前正在副本裡，先離開再重置';
          return;
        }

        session.dungeon.used = {};
        // 讓面板重畫，同時把 dirty 推進存檔。
        session.applyNow?.();

        dungeonStatus.textContent =
          cleared > 0 ? `已重置 ${cleared} 組配額，次數回滿` : '本來就沒有用掉任何次數';
      } catch (e) {
        console.warn('[idle-seal 改機] 重置副本次數失敗', e);
        dungeonStatus.textContent = '重置出錯（詳見 console）';
      }
    });

    body.appendChild(resetDungeonBtn);
    body.appendChild(dungeonStatus);

    const retryBtn = el(
      'button',
      'width:100%;padding:8px;background:#5a3d1f;color:#fff;border:none;border-radius:4px;' +
        'cursor:pointer;font-size:13px;',
      '重新尋找並套用'
    );
    retryBtn.addEventListener('click', () => {
      patched = false;
      if (session) Object.getPrototypeOf(session).__idleSealPatched = false;
      setStatus('重新尋找中...');
      tryPatchLoop(5);
    });
    body.appendChild(retryBtn);

    // --- 拖曳
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;
    header.addEventListener('mousedown', (e) => {
      if (e.target === collapseBtn) return;
      dragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      panel.style.left = `${e.clientX - offsetX}px`;
      panel.style.top = `${e.clientY - offsetY}px`;
      panel.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
      dragging = false;
    });

    return panel;
  }

  document.body.appendChild(buildPanel());
  for (const check of pendingRiskChecks) check();
  tryPatchLoop(10);
})();
