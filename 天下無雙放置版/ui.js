/* ============================================
   仙途·轮回诀 — UI 渲染层
   各面板渲染 · 弹窗系统 · 动效 · 提示
   ============================================ */

const UI = {
    selectedInvItem: null,
    invCategory: 'equipment',
    shopTab: 'buy',
    shopCategory: 'all',
    shopFilter: '',
    sellCategory: 'pill',

    /* ---------- 显示Toast提示 ---------- */
    toast(msg, type = '') {
        const c = document.getElementById('toast-container');
        if (!c) return;
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    },

    /* ---------- 添加日志 ---------- */
    addLog(msg, type = '') {
        const list = document.getElementById('logList');
        if (!list) return;
        const item = document.createElement('div');
        item.className = 'log-item ' + (type ? 'log-' + type : '');
        item.textContent = msg;
        list.insertBefore(item, list.firstChild);
        // 限制日志数量
        while (list.children.length > 30) list.removeChild(list.lastChild);
    },

    /* ---------- 显示通用弹窗 ---------- */
    showModal({ title, body, footer }) {
        document.getElementById('modalTitle').textContent = title || T('ui.modalDefault','提示');
        document.getElementById('modalBody').innerHTML = body || '';
        const f = document.getElementById('modalFooter');
        f.innerHTML = '';
        if (footer && footer.length) {
            footer.forEach(btn => {
                const b = document.createElement('button');
                b.className = 'modal-btn ' + (btn.type || '');
                b.textContent = btn.text;
                if (btn.disabled) {
                    b.disabled = true;
                    b.classList.add('disabled');
                } else {
                    b.onclick = btn.action;
                }
                f.appendChild(b);
            });
        }
        document.getElementById('modal-overlay').classList.remove('hidden');
    },
    // 通用确认弹窗（yesCallback 确认后执行）
    showConfirm(title, body, yesCallback) {
        this.showModal({
            title: title || T('ui.confirmTitle','确认'),
            body: `<p style="line-height:1.7;opacity:.9">${body || ''}</p>`,
            footer: [
                { text: T('ui.cancel','取消'), type: '', action: () => this.hideModal() },
                { text: T('ui.ok','确认'), type: 'primary', action: () => { this.hideModal(); if (yesCallback) yesCallback(); } }
            ]
        });
    },

    hideModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    /* ---------- 渡劫天劫弹窗 ---------- */
    openTribulation({ player, trib, chance, cost, onDone }) {
        const pct = Math.round((chance || 0) * 100);
        const body = `
            <div class="trib-box">
                <div class="trib-icon">${trib.icon}</div>
                <div class="trib-name">${DN(trib)}${T('ui.tribDescend',' 降临！')}</div>
                <p class="trib-desc">${DD(trib)}</p>
                <div class="trib-stats">
                    <div>${T('ui.resistRate','硬抗成功率：')}<b style="color:#6dbe6d">${pct}%</b></div>
                    <div>${T('ui.needGuard','请护道人需：')}<b style="color:#d4af37">${fmtNum(cost)}</b> ${T('ui.lingShi','灵石')}</div>
                </div>
                <p class="trib-tip">${T('ui.tribTip','渡劫成功获「劫后余韵」永久加成；失败则境界回落、战力受损。')}</p>
            </div>`;
        this.showModal({
            title: T('ui.tribTitle','⚡ 天劫降临'),
            body,
            footer: [
                { text: T('ui.resistTrib','硬抗天劫') + ' (' + pct + '%)', type: 'primary', action: () => this._resolveTrib(player, 'resist', onDone) },
                { text: T('ui.guardian','请护道人') + ' (' + fmtNum(cost) + T('ui.lingShi','灵石') + ')', type: '', action: () => this._resolveTrib(player, 'protect', onDone) }
            ]
        });
    },
    _resolveTrib(player, mode, onDone) {
        if (typeof Cultivate === 'undefined') return;
        const res = Cultivate.resolveTribulation(player, mode);
        if (!res) return;
        if (res.fail) {
            this.showModal({ title: T('ui.stoneLack','灵石不足'), body: `<p style="color:#f43f5e">${res.msg}</p>`, footer: [{ text: T('ui.back','返回'), action: () => this.hideModal() }] });
            return;
        }
        const color = res.success ? '#6dbe6d' : '#e74c3c';
        const bonusHtml = res.bonus ? `<div class="trib-bonus" style="color:#d4af37">${T('ui.xiuRate','修炼速率')} +${Math.round(res.bonus.xiuMult*100)}% · ${T('ui.stoneGain','灵石获取')} +${Math.round(res.bonus.stoneMult*100)}%</div>` : '';
        const title = res.protected ? T('ui.tribSafe','🛡 平安渡劫') : (res.success ? T('ui.tribAfter','✨ 劫后余韵') : T('ui.tribHurt','💥 道基受损'));
        this.showModal({
            title,
            body: `<div class="trib-box"><div class="trib-icon">${res.success ? '✨' : '💥'}</div><div class="trib-name" style="color:${color}">${res.success ? T('ui.tribWin','渡劫成功') : T('ui.tribLose','渡劫失败')}</div><p class="trib-desc">${res.msg}</p>${bonusHtml}</div>`,
            footer: [{ text: T('ui.continueCult','继续修行'), type: 'primary', action: () => { this.hideModal(); if (onDone) onDone(); } }]
        });
    },

    /* ---------- 显示事件弹窗 ---------- */
    showEvent(evt, eventId) {
        document.getElementById('eventTitle').textContent = TS(evt.title);
        document.getElementById('eventIcon').textContent = evt.icon || '★';
        document.getElementById('eventDesc').textContent = DD(evt);
        const choices = document.getElementById('eventChoices');
        choices.innerHTML = '';
        evt.choices.forEach((c, i) => {
            const b = document.createElement('button');
            b.className = 'event-choice';
            b.textContent = TS(c.text);
            b.onclick = () => Explore.handleChoice(eventId, i);
            choices.appendChild(b);
        });
        document.getElementById('event-screen').classList.remove('hidden');
    },

    hideEvent() {
        document.getElementById('event-screen').classList.add('hidden');
    },

    /* ---------- 突破特效 ---------- */
    showBreakthroughFX(text) {
        const fx = document.createElement('div');
        fx.className = 'breakthrough-fx';
        fx.innerHTML = `<div class="bt-glow"></div><div class="bt-text">${text}</div>`;
        document.body.appendChild(fx);
        setTimeout(() => fx.remove(), 2000);
    },

    /* ---------- 手动修炼飘字反馈 ---------- */
    showTapGain(gain, combo, capped) {
        const btn = document.getElementById('cultivateTap');
        if (!btn) return;
        // 按钮按压反馈
        btn.classList.remove('tap-pulse');
        void btn.offsetWidth; // 强制重绘以重启动画
        btn.classList.add('tap-pulse');
        // 飘字：达「今生上线」后点击不显示「战力 +0」（那像 bug），改为明确提示
        const rect = btn.getBoundingClientRect();
        const float = document.createElement('div');
        float.className = 'tap-gain' + (combo >= 5 ? ' combo-hot' : '') + (capped ? ' cap-full' : '');
        let txt;
        if (capped) {
            txt = T('ui.tapMaxed','已达今生上线');
        } else {
            txt = T('ui.powerPlus','战力 +') + fmtNum(gain);
            if (combo >= 2) txt += ` <span class="tap-combo">${T('ui.combo','连击')}×${combo}</span>`;
        }
        float.innerHTML = txt;
        float.style.left = (rect.left + rect.width / 2) + 'px';
        float.style.top = (rect.top - 6) + 'px';
        document.body.appendChild(float);
        setTimeout(() => float.remove(), 900);
    },

    /* ---------- 更新顶部资源栏 ---------- */
    updateResourceBar() {
        const p = Game.player;
        if (!p) return;
        document.getElementById('topName').textContent = p.name;
        document.getElementById('topRealm').textContent = realmLabel(p);
        // 段位显示（当前层 / 本境界总层）
        const layerNow = p.realmLayer;
        const layerMax = getRealm(p.realmIdx).layers;
        const topDuan = document.getElementById('topDuan');
        if (topDuan) topDuan.textContent = (CUR_LANG === 'en' ? 'Layer ' : '段位 ') + layerNow + ' / ' + layerMax;
        const duanVal = document.getElementById('duanValue');
        if (duanVal) duanVal.textContent = `${layerNow} / ${layerMax}`;
        const duanFill = document.getElementById('duanBarFill');
        if (duanFill) duanFill.style.width = Math.min(100, (layerNow / layerMax) * 100) + '%';
        document.getElementById('topAvatar').textContent = [T('ui.av.dao','道'),T('ui.av.xian','仙'),T('ui.av.mo','魔'),T('ui.av.fo','佛')][p.avatar];
        document.getElementById('topXiu').textContent = fmtNum(p.zhanli);
        const rate = SaveSystem.calcCultivateRate(p);
        document.getElementById('topRate').textContent = '+' + fmtNum(rate) + '/s';
        document.getElementById('topStone').textContent = fmtNum(p.stone);
        const stats = Cultivate.calcFinalStats(p);
        document.getElementById('topLing').textContent = fmtNum(stats.ling);
        const lifeEl = document.getElementById('topLife');
        if (lifeEl) lifeEl.textContent = fmtNum(p.lifespan);
    },

    /* ---------- 更新战力进度条 ---------- */
    updateCultivationBar() {
        const p = Game.player;
        if (!p) return;
        const cost = Cultivate.getBreakthroughCost(p);
        const pct = Math.min(100, (p.zhanli / cost) * 100);
        document.getElementById('xiuBarFill').style.width = pct + '%';
        document.getElementById('xiuBarText').textContent = `${fmtNum(p.zhanli)} / ${fmtNum(cost)}`;
        const btn = document.getElementById('breakBtn');
        const stoneCost = Cultivate.getBreakthroughStoneCost(p);
        if (p.zhanli >= cost && p.stone >= stoneCost) {
            btn.classList.add('ready');
        } else {
            btn.classList.remove('ready');
        }
        btn.title = T('ui.breakNeed','突破需') + ' ' + fmtNum(cost) + ' ' + T('ui.power','战力') + ' · ' + fmtNum(stoneCost) + ' ' + T('ui.lingShi','灵石');
    },

    /* ---------- 渲染修炼面板 ---------- */
    renderCultivate() {
        const p = Game.player;
        if (!p) return;
        const detail = Cultivate.getRateDetail(p);
        document.getElementById('baseRate').textContent = fmtNum(detail.base) + '/s';
        document.getElementById('realmBonus').textContent = '+' + (detail.realmBonus * 100).toFixed(0) + '%';
        document.getElementById('gongfaBonus').textContent = '+' + (detail.gfBonus * 100).toFixed(0) + '%';
        document.getElementById('equipBonus').textContent = '+' + (detail.equipBonus * 100).toFixed(0) + '%';
        // 渡劫加成显示
        const tribEl = document.getElementById('tribulusBonus');
        if (tribEl) tribEl.textContent = '+' + Math.round((detail.tribulusBonus || 0) * 100) + '%';
        // 功法显示
        const gf = getGongfa(p.gongfa);
        const gfDisplay = document.getElementById('gongfaDisplay');
        if (gf) {
            gfDisplay.innerHTML = `
                <div class="gongfa-card">
                    <div class="gongfa-name">${DN(gf)}</div>
                    <div class="gongfa-desc">${DD(gf)}</div>
                    <div class="gongfa-lv">${T('ui.xiuEff','修炼效率+')}${(gf.xiuBonus * 100).toFixed(0)}%</div>
                </div>`;
        }
        document.getElementById('cultivateToggle').textContent = Game.cultivating ? T('ui.pauseCult','暂停修炼') : T('ui.startCult','开始修炼');
        document.getElementById('cultivateStatus').textContent = Game.cultivating ? T('ui.cultivating','气机流转，战力缓缓增长') : T('ui.cultPause','修炼已暂停');
        // 悟性显示
        const wxLv = p.wuxingLevel || 0;
        const wxLvEl = document.getElementById('wuxingLevel');
        if (wxLvEl) wxLvEl.textContent = wxLv + T('ui.zhong',' 重');
        const wxTxt = document.getElementById('wuxingBonusText');
        if (wxTxt) wxTxt.textContent = `${T('ui.tap','点击')}+${Math.round((Cultivate.wuxingTapMult(p) - 1) * 100)}% · ${T('ui.rate','速率')}+${Math.round((Cultivate.wuxingRateMult(p) - 1) * 100)}%`;
        // 闭关提示（寿元）
        const seEl = document.getElementById('seclusionHint');
        if (seEl) seEl.textContent = T('ui.life','寿元：') + fmtNum(p.lifespan) + T('ui.year','年') + T('ui.seclHint',' · 闭关可大幅增涨战力（每闭关一年折损一年寿元）');
    },

    /* ---------- 渲染敌人列表 ---------- */
    renderEnemyList() {
        const p = Game.player;
        const list = document.getElementById('enemyList');
        list.innerHTML = '';
        GameConfig.enemies.forEach(e => {
            const locked = p.realmIdx < e.realmIdx || (p.realmIdx === e.realmIdx && p.realmLayer < e.realmLayer);
            const card = document.createElement('div');
            card.className = 'enemy-card' + (locked ? ' locked' : '');
            card.innerHTML = `
                <div class="enemy-name">${DN(e)} ${locked ? '<span class="enemy-lock-tip">🔒</span>' : ''}</div>
                <div class="enemy-realm">${DN(getRealm(e.realmIdx))}${cnNum(e.realmLayer)}${T('ui.layer','层')} · ${DN(GameConfig.elements[e.elem])}属性</div>
                <div class="enemy-stats">
                    ${T('ui.hp','气血：')}${fmtNum(e.hp)}<br>
                    ${T('ui.atk','攻击：')}${fmtNum(e.atk)} · ${T('ui.def','防御：')}${fmtNum(e.def)}<br>
                    ${T('ui.spd','速度：')}${e.spd}
                </div>
                <div class="enemy-reward">
                    ${T('ui.power','战力')}+${fmtNum(e.zhanliReward)} · ${T('ui.lingShi','灵石')}+${fmtNum(e.stoneReward)}
                </div>
            `;
            if (!locked) {
                card.onclick = () => Combat.startBattle(p, e.id);
            }
            list.appendChild(card);
        });
    },

    /* ---------- 渲染场景列表 ---------- */
    renderSceneList() {
        const p = Game.player;
        const list = document.getElementById('sceneList');
        list.innerHTML = '';
        GameConfig.scenes.forEach(s => {
            const locked = p.realmIdx < s.realmReq;
            const card = document.createElement('div');
            card.className = 'scene-card' + (locked ? ' locked' : '');
            card.style.setProperty('--scene-color', s.color);
            card.innerHTML = `
                <div class="scene-icon">${s.icon}</div>
                <div class="scene-name">${DN(s)}</div>
                <div class="scene-desc">${DD(s)}</div>
                ${locked ? `<div class="scene-req">${T('ui.need','需')}${DN(getRealm(s.realmReq))}${T('ui.realmUnit','境界')}</div>` : ''}
            `;
            if (!locked) {
                card.onclick = () => Explore.enterScene(s.id);
            }
            list.appendChild(card);
        });
    },

    /* ---------- 渲染背包 ---------- */
    renderInventory() {
        const p = Game.player;
        const grid = document.getElementById('invGrid');
        grid.innerHTML = '';
        const list = Inventory.getList(p, this.invCategory);
        if (list.length === 0) {
            grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9a8e7a;padding:40px">' + T('ui.bagEmpty','乾坤袋空空如也') + '</p>';
            return;
        }
        list.forEach(item => {
            const slot = document.createElement('div');
            const q = item.quality !== undefined ? getQuality(item.quality) : null;
            slot.className = 'inv-slot' + (q ? ' q-' + q.key : '') + (this.selectedInvItem === (item.uid || item.id) ? ' selected' : '');
            let count = item.count || 1;
            let name = DN(item);
            let icon = item.icon;
            // 装备实例显示强化等级
            if (item.isInstance && item.enhance > 0) {
                name = `${DN(item)}+${item.enhance}`;
            }
            slot.innerHTML = `
                ${q ? `<div class="inv-slot-quality"></div>` : ''}
                <div class="inv-slot-icon">${icon}</div>
                <div class="inv-slot-name">${name}</div>
                ${count > 1 ? `<div class="inv-slot-count">${count}</div>` : ''}
            `;
            slot.onclick = () => this.selectInventoryItem(item);
            grid.appendChild(slot);
        });
    },

    /* ---------- 选中物品显示详情 ---------- */
    selectInventoryItem(item) {
        this.selectedInvItem = item.uid || item.id;
        const detail = document.getElementById('invDetail');
        const q = item.quality !== undefined ? getQuality(item.quality) : null;
        let attrsHtml = '';
        let actionsHtml = '';

        if (this.invCategory === 'equipment' || this.invCategory === 'fabao') {
            // 装备
            const enhance = item.enhance || 0;
            const enhanceBonus = 1 + enhance * 0.15;
            attrsHtml = `
                    <div>${T('ui.quality','品质：')}<span style="color:${q.color}">${DN(q)}</span></div>
                    ${item.forgeTier !== undefined ? `<div>${T('ui.forgeQuality','锻造品质：')}<span style="color:${getQuality(item.forgeTier).color}">${DN(getQuality(item.forgeTier))}</span></div>` : ''}
                    <div>${T('ui.atk','攻击：')}+${Math.floor((item.atk || 0) * enhanceBonus)}</div>
                    <div>${T('ui.def','防御：')}+${Math.floor((item.def || 0) * enhanceBonus)}</div>
                    <div>${T('ui.hp','气血：')}+${Math.floor((item.hp || 0) * enhanceBonus)}</div>
                    <div>${T('ui.ling','灵力：')}+${Math.floor((item.ling || 0) * enhanceBonus)}</div>
                    ${item.crit ? `<div>${T('ui.crit','暴击：')}+${(item.crit * 100).toFixed(0)}%</div>` : ''}
                    ${enhance > 0 ? `<div style="color:#d4af37">${T('ui.enhance','强化')}+${enhance}</div>` : ''}
                    <div class="inv-detail-intro">📜 ${T('ui.intro','介绍：')}${DD(item)}</div>
            `;
            const isEquipped = Object.values(Game.player.equipped).some(e => e && e.uid === item.uid);
            if (isEquipped) {
                actionsHtml = `
                    <button class="inv-action-btn" onclick="UI.enhanceItem('${item.uid}')">${T('ui.enhance','强化')}</button>
                    <button class="inv-action-btn" onclick="UI.unequipItem('${item.uid}')">${T('ui.unequip','卸下')}</button>
                `;
            } else {
                actionsHtml = `
                    <button class="inv-action-btn" onclick="UI.equipItem('${item.uid}')">${T('ui.equip','穿戴')}</button>
                    <button class="inv-action-btn" onclick="UI.enhanceItem('${item.uid}')">${T('ui.enhance','强化')}</button>
                    <button class="inv-action-btn danger" onclick="UI.decomposeItem('${item.uid}')">${T('ui.decompose','分解')}</button>
                    <button class="inv-action-btn danger" onclick="UI.sellEquip('${item.uid}')">${T('ui.sell','出售')}</button>
                `;
            }
        } else if (this.invCategory === 'pill') {
            attrsHtml = `<div>${T('ui.effect','功效：')}${DD(item)}</div><div>${T('ui.count','数量：')}${item.count}</div>`;
            actionsHtml = `
                <button class="inv-action-btn" onclick="UI.usePill('${item.id}')">${T('ui.use','使用')}</button>
                <button class="inv-action-btn danger" onclick="UI.sellItem('pill','${item.id}',1)">${T('ui.sell','出售')}</button>
            `;
        } else if (this.invCategory === 'material') {
            attrsHtml = `<div class="inv-detail-intro">📜 ${T('ui.intro','介绍：')}${DD(item)}</div><div>${T('ui.count','数量：')}${item.count}</div>`;
            actionsHtml = `<button class="inv-action-btn danger" onclick="UI.sellItem('material','${item.id}',1)">${T('ui.sell','出售')}</button>`;
        } else if (this.invCategory === 'gongfa') {
            const isEquipped = Game.player.gongfa === item.id;
            attrsHtml = `<div>${T('ui.quality','品质：')}<span style="color:${q.color}">${DN(q)}</span></div><div>${T('ui.xiuEff','修炼效率+')}${(item.xiuBonus * 100).toFixed(0)}%</div><div class="inv-detail-intro">📜 ${T('ui.intro','介绍：')}${DD(item)}</div>`;
            actionsHtml = isEquipped
                ? `<button class="inv-action-btn danger" onclick="UI.unequipGongfa()">${T('ui.unequip','卸下')}</button>`
                : `<button class="inv-action-btn" onclick="UI.equipGongfa('${item.id}')">${T('ui.equip','装备')}</button>`;
        }
        detail.innerHTML = `
            <div class="inv-detail-name" style="color:${q ? q.color : '#d4af37'}">${DN(item)}${item.enhance > 0 ? '+' + item.enhance : ''}</div>
            <div class="inv-detail-desc">${DD(item) || ''}</div>
            <div class="inv-detail-attrs">${attrsHtml}</div>
            <div class="inv-detail-actions">${actionsHtml}</div>
        `;
        this.renderInventory();
    },

    equipItem(uid) { Inventory.equip(Game.player, uid); this.renderAll(); },
    unequipItem(uid) {
        // 查找装备所在槽位
        const p = Game.player;
        for (const slot in p.equipped) {
            if (p.equipped[slot] && p.equipped[slot].uid === uid) {
                Inventory.unequip(p, slot);
                break;
            }
        }
        this.selectedInvItem = null;
        this.renderAll();
    },
    enhanceItem(uid) {
        const ok = Inventory.enhance(Game.player, uid);
        if (ok) {
            // 强化成功：立即刷新灵石顶栏与背包/详情，确保数值即时更新
            this.updateResourceBar();
            this.renderInventory();
            const it = Inventory.getList(Game.player, this.invCategory).find(i => (i.uid || i.id) === uid);
            if (it) this.selectInventoryItem(it);
        }
        this.renderAll();
    },
    decomposeItem(uid) {
        this.showModal({
            title: T('ui.decompConfirm','分解确认'),
            body: T('ui.decompBody','确定要分解此装备吗？将获得部分灵石与材料。'),
            footer: [
                { text: T('ui.confirmDecomp','确认分解'), type: 'danger', action: () => { Inventory.decompose(Game.player, uid); this.selectedInvItem = null; this.hideModal(); this.renderAll(); }},
                { text: T('ui.cancel','取消'), action: () => this.hideModal() }
            ]
        });
    },
    sellEquip(uid) {
        this.showModal({
            title: T('ui.sellConfirm','出售确认'),
            body: T('ui.sellBody','确定要出售此装备吗？'),
            footer: [
                { text: T('ui.confirmSell','确认出售'), type: 'danger', action: () => { Inventory.sellEquipment(Game.player, uid); this.selectedInvItem = null; this.hideModal(); this.renderAll(); }},
                { text: T('ui.cancel','取消'), action: () => this.hideModal() }
            ]
        });
    },
    usePill(id) { Inventory.usePill(Game.player, id); this.renderAll(); },
    sellItem(cat, id, count) { Inventory.sellItem(Game.player, cat, id, count); this.renderAll(); },
    equipGongfa(id) { Inventory.equipGongfa(Game.player, id); this.renderAll(); },
    unequipGongfa() { Inventory.unequipGongfa(Game.player); this.renderAll(); },

    /* ---------- 渲染技能列表 ---------- */
    renderSkillList() {
        const p = Game.player;
        const list = document.getElementById('skillList');
        list.innerHTML = '';
        GameConfig.skills.forEach(s => {
            const learned = !!p.skills[s.id];
            const lvl = p.skills[s.id] || 0;
            const realmOk = p.realmIdx >= s.realmReq;
            const xiuOk = p.zhanli >= s.learnCost;
            const canLearn = realmOk && xiuOk;
            // 未解锁时给出明确门槛提示，避免误以为只是战力不够
            let lockTip = '';
            if (!learned && !realmOk) lockTip = `<div class="skill-cost" style="color:#f43f5e">${T('ui.need','需')}${DN(getRealm(s.realmReq))}${T('ui.realmToLearn','境界方可修习')}</div>`;
            else if (!learned && !xiuOk) lockTip = `<div class="skill-cost" style="color:#f43f5e">${T('ui.powerLack','战力不足，尚缺')}${fmtNum(s.learnCost - p.zhanli)}</div>`;
            const card = document.createElement('div');
            card.className = 'skill-card' + (learned ? '' : ' locked');
            const elemHtml = s.elem ? `<span class="skill-elem" data-elem="${s.elem}">${DN(GameConfig.elements[s.elem])}</span>` : '';
            const upCost = Math.floor(s.learnCost * Math.pow(s.upCostMult || 1.2, lvl));
            card.innerHTML = `
                <div class="skill-header">
                    <span class="skill-name">${DN(s)}</span>
                    <span class="skill-lv">${learned ? 'Lv.' + lvl : T('ui.notLearned','未学习')}</span>
                </div>
                <div class="skill-desc">${elemHtml}${DD(s)}</div>
                <div class="skill-cost">${T('ui.lingCost','灵力消耗：')}${s.cost} ${s.cd ? T('ui.cooldown','· 冷却：') + s.cd + T('ui.round','回合') : ''}</div>
                ${learned
                    ? `<button class="skill-upgrade" ${lvl >= 100 ? 'disabled' : ''} onclick="UI.upgradeSkill('${s.id}')">${T('ui.upgrade','升级')} (${T('ui.consume','消耗')}${fmtNum(upCost)}${T('ui.power','战力')})</button>`
                    : `<button class="skill-upgrade" ${canLearn ? '' : 'disabled'} onclick="UI.learnSkill('${s.id}')">${realmOk ? T('ui.learn','学习') + ' (' + T('ui.consume','消耗') + fmtNum(s.learnCost) + T('ui.power','战力') + ')' : T('ui.need','需') + DN(getRealm(s.realmReq)) + T('ui.realmUnit','境界')}</button>`
                }
                ${lockTip}
            `;
            list.appendChild(card);
        });
    },

    learnSkill(id) { Inventory.learnSkill(Game.player, id); this.renderAll(); },
    upgradeSkill(id) { Inventory.upgradeSkill(Game.player, id); this.renderAll(); },

    /* ---------- 渲染商店 ---------- */
    renderShop() {
        const p = Game.player;
        const grid = document.getElementById('shopGrid');
        const filters = document.getElementById('shopFilters');
        if (filters) filters.style.display = this.shopTab === 'buy' ? '' : 'none';
        grid.innerHTML = '';
        if (this.shopTab === 'craft') {
            this._renderCraft(grid, p);
            return;
        }
        if (this.shopTab === 'buy') {
            let list = Shop.getBuyList().filter(item => {
                if (this.shopCategory !== 'all' && item.category !== this.shopCategory) return false;
                if (!this.shopFilter) return true;
                const kw = this.shopFilter.toLowerCase();
                const name = (item.name || '').toLowerCase();
                const desc = (item.desc || '').toLowerCase();
                return name.includes(kw) || desc.includes(kw);
            });
            if (list.length === 0) {
                grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9a8e7a;padding:40px">' + T('ui.noMatch','未找到匹配物品') + '</p>';
                return;
            }
            list.forEach(item => {
                const q = item.quality !== undefined ? getQuality(item.quality) : null;
                const price = item.price;
                const canBuy = p.stone >= price;
                const card = document.createElement('div');
                card.className = 'shop-card';
                card.innerHTML = `
                    <div class="shop-card-header">
                        <span class="shop-item-name" style="color:${q ? q.color : '#d4af37'}">${item.icon} ${DN(item)}</span>
                        ${q ? `<span style="font-size:11px;color:${q.color}">${DN(q)}</span>` : ''}
                    </div>
                    <div class="shop-item-desc">${DD(item) || ''}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="shop-price">${fmtNum(price)}${T('ui.lingShi','灵石')}</span>
                        <button class="shop-buy-btn" ${canBuy ? '' : 'disabled'} onclick="UI.buyItem('${item.type}','${item.id}')">${T('ui.buy','购买')}</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        } else {
            // 出售
            const list = Shop.getSellList(p, this.sellCategory);
            if (list.length === 0) {
                grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#9a8e7a;padding:40px">' + T('ui.noSell','无可出售物品') + '</p>';
                return;
            }
            // 出售分类切换
            const tabs = document.createElement('div');
            tabs.style.cssText = 'grid-column:1/-1;display:flex;gap:6px;margin-bottom:8px';
            ['pill', 'material', 'equipment'].forEach(c => {
                const t = document.createElement('button');
                t.className = 'inv-tab' + (this.sellCategory === c ? ' active' : '');
                t.textContent = c === 'pill' ? T('ui.pill','丹药') : (c === 'material' ? T('ui.material','材料') : T('ui.equipTab','装备'));
                t.onclick = () => { this.sellCategory = c; this.renderShop(); };
                tabs.appendChild(t);
            });
            grid.appendChild(tabs);
            list.forEach(item => {
                const q = item.quality !== undefined ? getQuality(item.quality) : null;
                let price = 0;
                if (item.isInstance) {
                    price = Math.floor(item.price * (q ? q.sellMult : 1) * 0.5) + (item.enhance || 0) * Math.floor(item.price * 0.1);
                } else {
                    price = Math.floor(item.price * 0.5) * (item.count || 1);
                }
                const card = document.createElement('div');
                card.className = 'shop-card';
                card.innerHTML = `
                    <div class="shop-card-header">
                        <span class="shop-item-name" style="color:${q ? q.color : '#d4af37'}">${item.icon} ${DN(item)}${item.enhance > 0 ? '+' + item.enhance : ''}</span>
                        ${item.count > 1 ? `<span style="font-size:11px;color:#9a8e7a">×${item.count}</span>` : ''}
                    </div>
                    <div class="shop-item-desc">${DD(item) || ''}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="shop-price">${fmtNum(price)}${T('ui.lingShi','灵石')}</span>
                        <button class="shop-sell-btn" onclick="UI.sellShopItem('${item.uid || item.id}')">${T('ui.sell','出售')}</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    },

    /* ---------- 渲染炼制（丹炉 + 器炉） ---------- */
    _renderCraft(grid, p) {
        // 丹炉
        const pillHead = document.createElement('div');
        pillHead.className = 'forge-section-head';
        pillHead.innerHTML = T('ui.pillFurnace','🔥 丹炉 · 炼丹（材料 + 灵石，有几率大成功产出翻倍）');
        grid.appendChild(pillHead);
        const pills = Shop.getCraftList(p);
        pills.forEach(item => {
            const q = getQuality(item.quality);
            const card = document.createElement('div');
            card.className = 'shop-card forge-card';
            card.innerHTML = `
                <div class="shop-card-header">
                    <span class="shop-item-name" style="color:${q.color}">${item.icon} ${DN(item)}</span>
                    <span style="font-size:11px;color:${q.color}">${DN(q)}</span>
                </div>
                <div class="shop-item-desc">${DD(item) || ''}</div>
                <div class="forge-mats">
                    ${item.mats.map(m => `<span class="forge-mat ${m.enough ? '' : 'lack'}">${DN(m)} ${m.have}/${m.need}</span>`).join('')}
                    <span class="forge-mat">${T('ui.lingShi','灵石')} ${fmtNum(item.cost)}</span>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:8px">
                    <button class="shop-buy-btn" ${item.canCraft ? '' : 'disabled'} onclick="UI.craftPill('${item.id}')">${T('ui.craft','炼制')}</button>
                </div>`;
            grid.appendChild(card);
        });
        // 器炉
        const eqHead = document.createElement('div');
        eqHead.className = 'forge-section-head';
        eqHead.style.marginTop = '14px';
        eqHead.innerHTML = T('ui.eqFurnace','⚒ 器炉 · 炼器（材料 + 灵石，品质随缘：凡→灵→宝→仙→神）');
        grid.appendChild(eqHead);
        const eqs = Shop.getForgeList(p);
        eqs.forEach(item => {
            const q = getQuality(item.quality);
            const card = document.createElement('div');
            card.className = 'shop-card forge-card';
            card.innerHTML = `
                <div class="shop-card-header">
                    <span class="shop-item-name" style="color:${q.color}">${item.icon} ${DN(item)}</span>
                    <span style="font-size:11px;color:${q.color}">${DN(q)}</span>
                </div>
                <div class="shop-item-desc">${DD(item) || ''}</div>
                <div class="forge-mats">
                    ${item.mats.map(m => `<span class="forge-mat ${m.enough ? '' : 'lack'}">${DN(m)} ${m.have}/${m.need}</span>`).join('')}
                    <span class="forge-mat">${T('ui.lingShi','灵石')} ${fmtNum(item.cost)}</span>
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:8px">
                    <button class="shop-buy-btn" ${item.canCraft ? '' : 'disabled'} onclick="UI.craftEquip('${item.id}')">${T('ui.forge','锻造')}</button>
                </div>`;
            grid.appendChild(card);
        });
    },

    craftPill(id) { Shop.craft(Game.player, id); },
    craftEquip(id) { Shop.forge(Game.player, id); },

    buyItem(type, id) { Shop.buy(Game.player, type, id); this.renderAll(); },
    sellShopItem(idOrUid) {
        const p = Game.player;
        if (this.sellCategory === 'equipment') {
            Shop.sellEquipment(p, idOrUid);
        } else {
            Shop.sell(p, this.sellCategory, idOrUid, 1);
        }
    },

    /* ---------- 渲染任务 ---------- */
    renderQuests() {
        const p = Game.player;
        const list = document.getElementById('questList');
        list.innerHTML = '';
        const quests = Quests.getList(p);
        quests.forEach(q => {
            const card = document.createElement('div');
            card.className = 'quest-card' + (q.claimed ? ' done' : '');
            const pct = Math.min(100, (q.progress / q.target) * 100);
            let rewardStr = '';
            if (q.reward.stone) rewardStr += `${fmtNum(q.reward.stone)}${T('ui.lingShi','灵石')} `;
            if (q.reward.zhanli) rewardStr += `${fmtNum(q.reward.zhanli)}${T('ui.power','战力')} `;
            if (q.reward.items) q.reward.items.forEach(it => {
                const t = getEquipTemplate(it.id) || getPill(it.id) || getMaterial(it.id);
                rewardStr += `${t ? DN(t) : it.id}×${it.count} `;
            });
            card.innerHTML = `
                <div class="quest-header">
                    <span class="quest-name">${DN(q)}</span>
                    <span class="quest-reward">${T('ui.reward','奖励：')}${rewardStr}</span>
                </div>
                <div class="quest-desc">${DD(q)}</div>
                <div class="quest-progress">${T('ui.progress','进度：')}${fmtNum(q.progress)} / ${fmtNum(q.target)} (${pct.toFixed(0)}%)</div>
                ${q.claimed ? `<button class="quest-claim" disabled>${T('ui.claimed2','已领取')}</button>`
                  : (q.done ? `<button class="quest-claim" onclick="UI.claimQuest('${q.id}')">${T('ui.claimReward','领取奖励')}</button>`
                            : `<button class="quest-claim" disabled>${T('ui.go','前往')}</button>`)}
            `;
            list.appendChild(card);
        });
    },

    claimQuest(id) { Quests.claim(Game.player, id); this.renderAll(); },

    /* ---------- 渲染仙途主线 ---------- */
    renderMainStory() {
        const p = Game.player;
        if (!p) return;
        const list = document.getElementById('mainStoryList');
        if (!list) return;
        list.innerHTML = '';
        const chapters = (typeof MainStory !== 'undefined') ? MainStory.getChapters(p) : [];
        const curRealm = getRealm(p.realmIdx).name;
        if (chapters.length === 0) {
            list.innerHTML = '<div class="quest-desc">' + T('ui.noMainStory','暂无主线剧情。') + '</div>';
            return;
        }
        chapters.forEach(ch => {
            const card = document.createElement('div');
            let statusHtml, btnHtml;
            if (!ch.unlocked) {
                card.className = 'quest-card locked';
                statusHtml = `<span class="quest-reward">${T('ui.locked','🔒 未解锁（需')}${TS(ch.realmName)}${T('ui.realmParen','境界）')}</span>`;
                btnHtml = '<button class="quest-claim" disabled>' + T('notReached', '未达境界') + '</button>';
            } else if (!ch.seen) {
                card.className = 'quest-card';
                statusHtml = `<span class="quest-reward">${T('ui.newChapter','✦ 新章待阅')}</span>`;
                btnHtml = `<button class="quest-claim" onclick="UI.replayStory('${ch.id}')">${T('ui.readStory','阅读')}</button>`;
            } else {
                card.className = 'quest-card done';
                statusHtml = `<span class="quest-reward">${T('ui.read','✓ 已阅')}${ch.claimed ? T('ui.claimed',' · 已领赏') : ''}</span>`;
                btnHtml = `<button class="quest-claim" onclick="UI.replayStory('${ch.id}')">${T('ui.review','回看')}</button>`;
            }
            let rewardStr = '';
            if (ch.reward && ch.reward.stone) rewardStr += `${fmtNum(ch.reward.stone)}${T('ui.lingShi','灵石')} `;
            if (ch.reward && ch.reward.zhanli) rewardStr += `${fmtNum(ch.reward.zhanli)}${T('ui.power','战力')} `;
            if (ch.reward && ch.reward.items) ch.reward.items.forEach(it => {
                const t = getEquipTemplate(it.id) || getPill(it.id) || getMaterial(it.id);
                rewardStr += `${t ? DN(t) : it.id}×${it.count} `;
            });
            card.innerHTML = `
                <div class="quest-header">
                    <span class="quest-name">${TS(ch.title)}</span>
                    ${statusHtml}
                </div>
                <div class="quest-desc">${ch.unlocked ? (ch.body.length > 48 ? ch.body.slice(0, 48) + '…' : ch.body) : T('ui.breakTo','突破至') + TS(ch.realmName) + T('ui.unlockChapter','境界后解锁此章。')}</div>
                ${rewardStr ? `<div class="quest-progress">${T('ui.unlockReward','解锁奖励：')}${rewardStr}</div>` : ''}
                ${btnHtml}
            `;
            list.appendChild(card);
        });
        // 当前境界提示
        const tip = document.getElementById('mainStoryTip');
        if (tip) tip.textContent = T('currentRealm', '当前境界：') + DN(getRealm(p.realmIdx)) + T('ui.totalParen','（共 ') + chapters.filter(c => c.unlocked).length + '/' + chapters.length + ' ' + T('chaptersUnlocked', '章已解锁') + T('ui.parenClose','）');
    },

    replayStory(id) {
        if (typeof MainStory !== 'undefined') MainStory.replay(Game.player, id);
        this.renderMainStory();
    },

    /* ---------- 主线章节叙事弹窗 ---------- */
    showMainStory(ch, isReplay) {
        if (!ch) return;
        let rewardStr = '';
        if (ch.reward && ch.reward.stone) rewardStr += `${fmtNum(ch.reward.stone)}${T('ui.lingShi','灵石')} `;
        if (ch.reward && ch.reward.zhanli) rewardStr += `${fmtNum(ch.reward.zhanli)}${T('ui.power','战力')} `;
        if (ch.reward && ch.reward.items) ch.reward.items.forEach(it => {
            const t = getEquipTemplate(it.id) || getPill(it.id) || getMaterial(it.id);
            rewardStr += `${t ? DN(t) : it.id}×${it.count} `;
        });
        const body = `
            <div class="story-box">
                <div class="story-realm">${ch.realmName ? '◇ ' + TS(ch.realmName) + T('ui.realmUnit','境界') : T('ui.prologue','◇ 序章')}</div>
                <p class="story-body">${ch.body}</p>
                ${rewardStr ? `<div class="story-reward">${T('ui.unlockRewardGift','🎁 解锁奖励：')}${rewardStr}</div>` : ''}
            </div>`;
        this.showModal({
            title: '📜 ' + TS(ch.title),
            body,
            footer: isReplay
                ? [{ text: T('ui.accept','收下'), action: () => this.hideModal() }]
                : [{ text: T('ui.continueXian','继续仙途'), type: 'primary', action: () => { this.hideModal(); this.renderAll(); } }]
        });
    },

    /* ---------- 渲染道友系统 ---------- */
    renderFriends() {
        const p = Game.player;
        if (!p) return;
        // ① 我的档案码
        const myCode = document.getElementById('myProfileCode');
        if (myCode) myCode.value = Friends.encodeProfile(p);
        // ③ 馈赠物品下拉（持有可赠之物）
        const sel = document.getElementById('giftItem');
        if (sel) {
            const opts = ['<option value="">' + T('ui.none','— 无 —') + '</option>'];
            Object.entries(p.inventory.pill).filter(([_, c]) => c > 0).forEach(([id, c]) => {
                const m = getPill(id); if (m) opts.push(`<option value="pill:${id}">${DN(m)}${T('ui.hold','（持')}${c}${T('ui.paren','）')}</option>`);
            });
            Object.entries(p.inventory.material).filter(([_, c]) => c > 0).forEach(([id, c]) => {
                const m = getMaterial(id); if (m) opts.push(`<option value="material:${id}">${DN(m)}${T('ui.hold','（持')}${c}${T('ui.paren','）')}</option>`);
            });
            sel.innerHTML = opts.join('');
        }
        // ④ 道友榜（含自己，按战力排序）
        const list = document.getElementById('friendsList');
        if (list) {
            const st = Cultivate.calcFinalStats(p);
            const me = {
                name: p.name + T('ui.you','（你）'), realmName: getRealm(p.realmIdx).name, realmIdx: p.realmIdx,
                atk: st.atk, def: st.def, hp: st.hp, ling: st.ling, crit: st.crit,
                tXi: (p.tribulus && p.tribulus.xiuMult) || 0, tSt: (p.tribulus && p.tribulus.stoneMult) || 0,
                zhanli: p.zhanli || 0,
                power: Friends.power({ zhanli: p.zhanli }), isMe: true
            };
            const others = Friends.list().map(f => ({ ...f, isMe: false }));
            const all = [me].concat(others).sort((a, b) => b.power - a.power);
            list.innerHTML = all.map(f => `
                <div class="friend-card ${f.isMe ? 'me' : ''}">
                    <div class="friend-top">
                        <span class="friend-name" style="color:${f.isMe ? '#7dd3c0' : '#d4af37'}">${f.name}</span>
                        <span class="friend-power">${T('ui.power','战力')} ${fmtNum(f.power)}</span>
                        ${f.isMe ? '' : `<button class="friend-del" onclick="UI.removeFriend('${f.name.replace(/'/g, "\\'")}')">${T('ui.remove','删除')}</button>`}
                    </div>
                    <div class="friend-meta">${TS(f.realmName) || ''} ${f.realmLayer ? f.realmLayer + T('ui.layer','层') : ''} · ${T('ui.atk','攻')}${fmtNum(f.atk)} ${T('ui.def','防')}${fmtNum(f.def)} ${T('ui.hp','血')}${fmtNum(f.hp)} ${T('ui.ling','灵')}${fmtNum(f.ling)}</div>
                    <div class="friend-bonus">${T('ui.tribBonus','渡劫加成：修炼+')}${Math.round((f.tXi || 0) * 100)}%${T('ui.lingShiBonus',' 灵石+')}${Math.round((f.tSt || 0) * 100)}%</div>
                </div>`).join('') || '<p class="friend-empty">' + T('ui.noFriends','尚无道友，把档案码发给好友吧～') + '</p>';
        }
    },
    copyProfile() {
        const el = document.getElementById('myProfileCode');
        if (el) { el.select(); try { document.execCommand('copy'); } catch (e) {} if (navigator.clipboard) navigator.clipboard.writeText(el.value).catch(() => {}); }
        if (typeof UI !== 'undefined') UI.toast(T('ui.codeCopied','档案码已复制，发给好友吧'), 'gold');
    },
    importCode() {
        const el = document.getElementById('importCode');
        const code = el ? el.value : '';
        if (!code.trim()) { if (typeof UI !== 'undefined') UI.toast(T('ui.pasteCode','请先粘贴分享码'), 'bad'); return; }
        try {
            const r = Friends.import(Game.player, code);
            if (r.kind === 'profile') { if (typeof UI !== 'undefined') { UI.toast(T('ui.addedFriend','已添加道友：') + r.name, 'gold'); UI.addLog(T('ui.addFriendLog','添加道友 ') + r.name, 'evt'); } }
            else if (r.kind === 'gift') {
                const desc = Friends.describeGift(r);
                if (typeof UI !== 'undefined') { UI.toast(T('ui.recv','收到 ') + r.from + T('ui.giftFrom',' 的馈赠：') + desc, 'gold'); UI.addLog(T('ui.recvLog','收到 ') + r.from + T('ui.giftFromLog',' 馈赠：') + desc, 'evt'); }
            }
            if (el) el.value = '';
            this.renderFriends(); this.renderStatus();
        } catch (e) { if (typeof UI !== 'undefined') UI.toast(e.message || T('ui.importFail','导入失败'), 'bad'); }
    },
    genGift() {
        const p = Game.player;
        const stone = parseInt(document.getElementById('giftStone').value) || 0;
        const itemSel = document.getElementById('giftItem').value;
        const count = parseInt(document.getElementById('giftCount').value) || 0;
        let item = null;
        if (itemSel && count > 0) { const [type, id] = itemSel.split(':'); item = { type, id, count }; }
        try {
            const code = Friends.makeGift(p, { stone, item });
            const box = document.getElementById('giftCode');
            if (box) box.value = code;
            if (typeof UI !== 'undefined') UI.toast(T('ui.giftCodeGen','馈赠码已生成，发给好友即到账（己方已扣除）'), 'gold');
            this.renderFriends(); this.renderStatus();
        } catch (e) { if (typeof UI !== 'undefined') UI.toast(e.message || '生成失败', 'bad'); }
    },
    copyGift() {
        const el = document.getElementById('giftCode');
        if (el && el.value) { el.select(); try { document.execCommand('copy'); } catch (e) {} if (navigator.clipboard) navigator.clipboard.writeText(el.value).catch(() => {}); }
        if (typeof UI !== 'undefined') UI.toast(T('ui.giftCodeCopied','馈赠码已复制'), 'gold');
    },
    removeFriend(name) {
        Friends.remove(name);
        if (typeof UI !== 'undefined') UI.toast(T('ui.delFriend','已删除道友 ') + name, '');
        this.renderFriends();
    },

    /* ---------- 渲染属性面板 ---------- */
    renderStatus() {
        const p = Game.player;
        if (!p) return;
        const stats = Cultivate.calcFinalStats(p);
        document.getElementById('attrHp').textContent = fmtNum(stats.hp);
        document.getElementById('attrLing').textContent = fmtNum(stats.ling);
        document.getElementById('attrAtk').textContent = stats.atk;
        document.getElementById('attrDef').textContent = stats.def;
        document.getElementById('attrSpd').textContent = stats.spd;
        document.getElementById('attrCrit').textContent = (stats.crit * 100).toFixed(0) + '%';
        document.getElementById('attrElem').textContent = DN(GameConfig.elements[p.element]);
        // 装备
        const slots = { weapon: T('ui.slotWeapon','武器'), armor: T('ui.slotArmor','护甲'), accessory: T('ui.slotAcc','饰品'), fabao: T('ui.slotFabao','法宝') };
        const equipList = document.getElementById('equipList');
        equipList.innerHTML = '';
        for (const slot in slots) {
            const eq = p.equipped[slot];
            const div = document.createElement('div');
            div.className = 'equip-slot';
            if (eq) {
                const tpl = getEquipTemplate(eq.baseId);
                const q = getQuality(tpl.quality);
                div.innerHTML = `<span>${slots[slot]}</span><span class="equip-name" style="color:${q.color}">${DN(tpl)}${eq.enhance > 0 ? '+' + eq.enhance : ''}</span>`;
                div.onclick = () => this.unequipItem(eq.uid);
            } else {
                div.innerHTML = `<span>${slots[slot]}</span><span class="equip-name empty">${T('ui.none2','无')}</span>`;
            }
            equipList.appendChild(div);
        }
        // 灵宠
        const petDisplay = document.getElementById('petDisplay');
        if (p.pet && typeof PetSys !== 'undefined') {
            const inst = PetSys.active(p);
            const ps = inst ? PetSys.instStats(p, inst) : null;
            if (ps) {
                petDisplay.innerHTML = `
                    <div class="pet-card">
                        <div class="pet-icon">${ps.icon}</div>
                        <div class="pet-info">
                            <div class="pet-name">${ps.name} <span class="pet-lv">Lv.${inst.lv}</span></div>
                            <div class="pet-stat">${T('ui.atk','攻')}${ps.atk} ${T('ui.def','防')}${ps.def} ${T('ui.hp','血')}${ps.hp}</div>
                        </div>
                    </div>
                `;
            } else {
                petDisplay.innerHTML = '<p class="pet-empty">' + T('ui.noPet','尚未收服灵宠') + '</p>';
            }
        } else {
            petDisplay.innerHTML = '<p class="pet-empty">' + T('ui.noPet','尚未收服灵宠') + '</p>';
        }
    },

    /* ---------- 显示战斗界面 ---------- */
    showBattle(state) {
        document.getElementById('battle-screen').classList.remove('hidden');
        this.updateBattle(state);
        // 渲染技能按钮
        const skillsDiv = document.getElementById('battleSkills');
        skillsDiv.innerHTML = '';
        const p = Game.player;
        Object.keys(p.skills).forEach(sid => {
            const skill = getSkill(sid);
            if (!skill) return;
            const btn = document.createElement('button');
            btn.className = 'battle-skill-btn';
            btn.innerHTML = `
                <span class="bs-name">${DN(skill)}</span>
                <span class="bs-cost">${skill.cost > 0 ? skill.cost + T('ui.ling2','灵') : ''}</span>
            `;
            btn.onclick = () => Combat.useSkill(sid);
            skillsDiv.appendChild(btn);
        });
        // 法宝按钮
        if (state.player.fabao) {
            const fskill = GameConfig.fabaoSkills[state.player.fabao.skill];
            if (fskill) {
                const btn = document.createElement('button');
                btn.className = 'battle-skill-btn';
                btn.innerHTML = `<span class="bs-name">${T('ui.fabaoDot','法宝·')}${DN(fskill)}</span><span class="bs-cost">${fskill.cost}${T('ui.ling2','灵')}</span>`;
                btn.onclick = () => Combat.useFabao();
                skillsDiv.appendChild(btn);
            }
        }
    },

    /* ---------- 更新战斗界面 ---------- */
    updateBattle(state) {
        document.getElementById('enemyName').textContent = DN(state.enemy);
        document.getElementById('enemyAvatar').textContent = state.enemy.avatar;
        const ePct = state.enemy.maxHp > 0 ? Math.max(0, Math.min(100, (state.enemy.hp / state.enemy.maxHp) * 100)) : 100;
        document.getElementById('enemyHpFill').style.width = ePct + '%';
        document.getElementById('enemyHpText').textContent = `${Math.max(0, Math.floor(state.enemy.hp))}/${state.enemy.maxHp}`;
        document.getElementById('playerBattleName').textContent = state.player.name;
        document.getElementById('playerBattleAvatar').textContent = state.player.avatar;
        const pPct = state.player.maxHp > 0 ? Math.max(0, Math.min(100, (state.player.hp / state.player.maxHp) * 100)) : 100;
        document.getElementById('playerHpFill').style.width = pPct + '%';
        document.getElementById('playerHpText').textContent = `${Math.max(0, Math.floor(state.player.hp))}/${state.player.maxHp}`;
        // 更新技能按钮状态 + 回合指示
        const myTurn = state.playerTurn !== false;
        const buttons = document.querySelectorAll('.battle-skill-btn');
        buttons.forEach(btn => {
            btn.disabled = !myTurn;
            btn.classList.toggle('disabled', !myTurn);
        });
        const atkBtn = document.getElementById('battleAttack');
        if (atkBtn) {
            atkBtn.disabled = !myTurn;
            atkBtn.classList.toggle('disabled', !myTurn);
        }
        const fleeBtn = document.getElementById('battleFlee');
        if (fleeBtn) {
            fleeBtn.disabled = !myTurn;
            fleeBtn.classList.toggle('disabled', !myTurn);
        }
        const turnEl = document.getElementById('battleTurn');
        if (turnEl) {
            turnEl.textContent = myTurn ? T('ui.yourTurn','⚔ 你的回合') : T('ui.foeTurn','☯ 敌方回合…');
            turnEl.className = 'battle-turn ' + (myTurn ? 'my' : 'enemy');
        }
        // 五行提示
        const elemMult = getElementMultiplier(state.player.elem, state.enemy.elem);
        const hint = document.getElementById('battleElemHint');
        if (elemMult > 1.3) hint.textContent = T('ui.your','你的') + DN(GameConfig.elements[state.player.elem]) + T('ui.elemRestrain','属性克制对方') + DN(GameConfig.elements[state.enemy.elem]) + T('ui.elemDmg','属性，伤害+50%');
        else if (elemMult < 1) hint.textContent = T('ui.foe','对方') + DN(GameConfig.elements[state.enemy.elem]) + T('ui.elemRestrainYou','属性克制你的') + DN(GameConfig.elements[state.player.elem]) + T('ui.careful','属性，小心！');
        else hint.textContent = '';
    },

    updateBattleLog(log) {
        const div = document.getElementById('battleLog');
        div.innerHTML = log.slice(-20).map(l => `<div class="battle-log-line ${l.type}">${l.msg}</div>`).join('');
        div.scrollTop = div.scrollHeight;
    },

    hideBattle() {
        document.getElementById('battle-screen').classList.add('hidden');
    },

    battleAnim(side) {
        const av = document.getElementById(side === 'player' ? 'playerBattleAvatar' : 'enemyAvatar');
        av.classList.add('attacking');
        setTimeout(() => av.classList.remove('attacking'), 500);
    },

    showDamageFloat(target, value, type) {
        const av = document.getElementById(target === 'player' ? 'playerBattleAvatar' : 'enemyAvatar');
        if (!av) return;
        const rect = av.getBoundingClientRect();
        const float = document.createElement('div');
        float.className = 'dmg-float ' + type;
        float.textContent = type === 'heal' ? '+' + value : '-' + value;
        float.style.left = (rect.left + rect.width / 2 - 20) + 'px';
        float.style.top = (rect.top + rect.height / 2) + 'px';
        document.body.appendChild(float);
        setTimeout(() => float.remove(), 1000);
    },

    /* ---------- 灵宠培养面板 ---------- */
    renderPetPanel() {
        const p = Game.player;
        if (!p) return;
        const listEl = document.getElementById('petCultList');
        const detailEl = document.getElementById('petCultDetail');
        if (!listEl) return;
        if (!p.pets || p.pets.length === 0) {
            listEl.innerHTML = '<p class="pet-empty-tip">' + T('ui.petEmptyTip','尚未收服灵宠。前往<b>坊市·灵宠</b>购得，或于<b>历练·东海龙宫</b>收服幼龙。') + '</p>';
            if (detailEl) detailEl.innerHTML = '<p class="inv-detail-empty">' + T('ui.petDetailHint','选中灵宠查看详情') + '</p>';
            return;
        }
        listEl.innerHTML = p.pets.map(inst => {
            const tpl = getPet(inst.id);
            const ps = (typeof PetSys !== 'undefined') ? PetSys.instStats(p, inst) : null;
            const active = (p.pet === inst.id);
            const need = (typeof PetSys !== 'undefined') ? PetSys.expNeed(inst.lv) : 1;
            const pct = Math.max(0, Math.min(100, Math.floor((inst.exp / need) * 100)));
            return `
                <div class="pet-cult-card${active ? ' active' : ''}" data-pet="${inst.id}" onclick="UI.selectPet('${inst.id}')">
                    <div class="pc-icon">${ps ? ps.icon : tpl.icon}</div>
                    <div class="pc-info">
                    <div class="pc-name">${DN(ps ? ps : tpl)} ${active ? '<span class="pc-tag">' + T('ui.fighting','出战') + '</span>' : ''}</div>
                    <div class="pc-lv">Lv.${inst.lv}${TS(PetSys.evoName(inst.evo))} · ${T('ui.intimacy','亲密度 ')}${inst.aff}</div>
                    <div class="pc-stats">${T('ui.atk','攻')}${ps ? ps.atk : tpl.atk} ${T('ui.def','防')}${ps ? ps.def : tpl.def} ${T('ui.hp','血')}${ps ? ps.hp : tpl.hp}</div>
                        <div class="pc-exp"><div class="pc-exp-fill" style="width:${pct}%"></div></div>
                    </div>
                </div>`;
        }).join('');
        if (detailEl && (!this.selectedPet || !p.pets.find(x => x.id === this.selectedPet))) {
            this.selectedPet = p.pet || (p.pets[0] && p.pets[0].id);
        }
        this.renderPetDetail();
    },
    selectedPet: null,
    selectPet(id) {
        this.selectedPet = id;
        const cards = document.querySelectorAll('.pet-cult-card');
        cards.forEach(c => c.classList.toggle('active', c.dataset.pet === id));
        this.renderPetDetail();
    },
    renderPetDetail() {
        const p = Game.player;
        const el = document.getElementById('petCultDetail');
        if (!el || !p || !this.selectedPet) { if (el) el.innerHTML = '<p class="inv-detail-empty">' + T('ui.petDetailHint','选中灵宠查看详情') + '</p>'; return; }
        const inst = p.pets.find(x => x.id === this.selectedPet);
        if (!inst) { el.innerHTML = '<p class="inv-detail-empty">' + T('ui.petDetailHint','选中灵宠查看详情') + '</p>'; return; }
        const tpl = getPet(inst.id);
        const ps = (typeof PetSys !== 'undefined') ? PetSys.instStats(p, inst) : null;
        const active = (p.pet === inst.id);
        const food = (p.inventory.material && p.inventory.material['m_pet_food']) || 0;
        const evoDan = (p.inventory.material && p.inventory.material['m_pet_evo']) || 0;
        const need = (typeof PetSys !== 'undefined') ? PetSys.expNeed(inst.lv) : 1;
        const canEvo = (typeof PetSys !== 'undefined') ? PetSys.canEvolve(inst) : false;
        const evoNeed = (inst.evo + 1) * 20;
        const trainCost = 200 * inst.lv;
        el.innerHTML = `
            <div class="pd-head">
                <div class="pd-icon">${ps ? ps.icon : tpl.icon}</div>
                <div class="pd-title">
                    <div class="pd-name">${DN(ps ? ps : tpl)}</div>
                    <div class="pd-sub">${DD(tpl) || ''} · Lv.${inst.lv} · ${T('ui.intimacy','亲密度 ')}${inst.aff}</div>
                </div>
            </div>
            <div class="pd-stats">
                <div><span>${T('ui.atk','攻击')}</span><b>${ps ? ps.atk : tpl.atk}</b></div>
                <div><span>${T('ui.def','防御')}</span><b>${ps ? ps.def : tpl.def}</b></div>
                <div><span>${T('ui.hp','气血')}</span><b>${ps ? ps.hp : tpl.hp}</b></div>
            </div>
            <div class="pd-exp">${T('ui.exp','经验 ')}${inst.exp} / ${need}</div>
            <div class="pd-actions">
                ${active ? '' : `<button class="pd-btn" onclick="UI.setPetActive('${inst.id}')">${T('ui.setMain','设为主战')}</button>`}
                <button class="pd-btn" onclick="UI.petFeed('${inst.id}')">${T('ui.feed','喂养')}（${T('ui.petFood','灵兽粮')}×1）</button>
                <button class="pd-btn" onclick="UI.petTrain('${inst.id}')">${T('ui.train','修炼')}（${T('ui.consume','耗 ')}${fmtNum(trainCost)} ${T('ui.power','战力')}）</button>
                <button class="pd-btn${canEvo ? '' : ' disabled'}" ${canEvo ? '' : 'disabled'} onclick="UI.petEvolve('${inst.id}')">${T('ui.evolve','化形进阶')}${canEvo ? '' : `（${T('ui.need','需 ')}Lv.${evoNeed}）`}</button>
            </div>
            <div class="pd-buy">
                <button class="pd-btn ghost" onclick="UI.buyItem('material','m_pet_food')">${T('ui.buyPetFood','购买灵兽粮')}（${fmtNum(getMaterial('m_pet_food').price)}${T('ui.lingShi','灵石')}）</button>
                <button class="pd-btn ghost" onclick="UI.buyItem('material','m_pet_evo')">${T('ui.buyEvoPill','购买化形丹')}（${fmtNum(getMaterial('m_pet_evo').price)}${T('ui.lingShi','灵石')}）</button>
            </div>
            <div class="pd-hint">${T('ui.own','持有：')}${T('ui.petFood','灵兽粮')} ${food} · ${T('ui.evoPill','化形丹')} ${evoDan}${T('ui.buyHint','（不足可在上方直接购买）')}</div>
        `;
    },
    setPetActive(id) {
        const p = Game.player; if (!p) return;
        if (typeof PetSys !== 'undefined') PetSys.setActive(p, id);
        if (typeof UI !== 'undefined') { UI.toast(T('ui.setMainPet','已设为主战灵宠'), 'good'); UI.addLog(T('ui.summonMainPet','唤出主战灵宠'), 'evt'); }
        this.renderPetPanel(); this.renderStatus();
    },
    petFeed(id) {
        const p = Game.player; if (!p || typeof PetSys === 'undefined') return;
        const r = PetSys.feed(p, id, 1);
        if (!r.ok) { this.toast(r.msg || T('ui.feedFail','喂养失败'), 'bad'); return; }
        this.toast(T('ui.feedOk','喂养成功，灵宠经验 +') + r.gained + T('ui.lvParen','（Lv.') + r.lv + T('ui.paren','）'), 'gold');
        this.renderPetPanel(); this.renderStatus();
    },
    petTrain(id) {
        const p = Game.player; if (!p || typeof PetSys === 'undefined') return;
        const r = PetSys.train(p, id);
        if (!r.ok) { this.toast(r.msg || T('ui.trainFail','修炼失败'), 'bad'); return; }
        this.toast(T('ui.trainOk','灵宠修炼有成，') + 'Lv.' + r.lv + T('ui.intimacy',' · 亲密度 ') + r.aff, 'gold');
        this.renderPetPanel(); this.renderStatus();
    },
    petEvolve(id) {
        const p = Game.player; if (!p || typeof PetSys === 'undefined') return;
        const r = PetSys.evolve(p, id);
        if (!r.ok) { this.toast(r.msg || T('ui.evolveFail','化形失败'), 'bad'); return; }
        this.toast(T('ui.evolveOk','灵宠化形进阶！蜕变至 ') + TS(PetSys.evoName(r.evo)) + T('ui.formUp',' 之姿，属性大涨'), 'gold');
        this.addLog(T('ui.evolveLog','灵宠化形进阶，资质蜕变'), 'evt');
        this.renderPetPanel(); this.renderStatus();
    },

    /* ---------- 天赋面板 ---------- */
    renderTalent() {
        const p = Game.player;
        if (!p) return;
        const ptsEl = document.getElementById('talentPts');
        if (ptsEl) ptsEl.textContent = (typeof Talent !== 'undefined') ? Talent.pts(p) : 0;
        const tree = document.getElementById('talentTree');
        if (!tree) return;
        if (typeof Talent === 'undefined' || !GameConfig.talents) return;
        // 按系分组
        const branches = {};
        GameConfig.talents.forEach(t => { (branches[t.branch] = branches[t.branch] || []).push(t); });
        tree.innerHTML = Object.keys(branches).map(branch => {
            const cards = branches[branch].map(t => {
                const lv = Talent.level(p, t.id);
                const maxed = lv >= t.max;
                const can = !maxed && Talent.pts(p) >= 1;
                return `
                    <div class="talent-card${maxed ? ' maxed' : ''}">
                        <div class="tc-icon">${t.icon}</div>
                        <div class="tc-body">
                            <div class="tc-name">${DN(t)} <span class="tc-lv">${lv}/${t.max}</span></div>
                            <div class="tc-desc">${DD(t)}</div>
                            <button class="tc-btn${can ? '' : ' disabled'}" ${can ? '' : 'disabled'} onclick="UI.learnTalent('${t.id}')">${maxed ? T('ui.maxed','已满级') : T('ui.learnTalent','修习（+1）')}</button>
                        </div>
                    </div>`;
            }).join('');
            return `<div class="talent-branch"><div class="tb-title">${DN(branch)}${T('ui.xi','系')}</div><div class="tb-cards">${cards}</div></div>`;
        }).join('');
    },
    learnTalent(id) {
        const p = Game.player; if (!p || typeof Talent === 'undefined') return;
        if (Talent.learn(p, id)) {
            this.renderTalent();
            this.renderStatus();
        }
    },

    /* ---------- 转世轮回 ---------- */
    renderReincarnate() {
        const p = Game.player;
        if (!p) return;
        const cfg = GameConfig.rebirth;
        const n = p.rebirth || 0;
        const rb = Cultivate.getRebirthBonus(p);
        const c = cfg.perLevel;
        const cntEl = document.getElementById('rbCount');
        const bonusEl = document.getElementById('rbBonus');
        const prevEl = document.getElementById('rbPreview');
        const hintEl = document.getElementById('rbHint');
        if (cntEl) cntEl.textContent = n + T('ui.shi',' 世');
        if (bonusEl) bonusEl.textContent = T('ui.rbBonus','气血 ×') + rb.hpMult.toFixed(2) + T('ui.rbAtk',' · 攻击 ×') + rb.atkMult.toFixed(2);
        if (prevEl) {
            const nx = n + 1;
            const xiuPct = Math.round(nx * ((GameConfig.rebirth && GameConfig.rebirth.xiuBonusPerRebirth) || 0) * 100);
            prevEl.innerHTML = '<div class="rb-line">' + T('ui.nextLife','下一世（第 ') + nx + T('ui.shiWillGet',' 世）将得：') + '</div>' +
                `<div class="rb-grid">` +
                `<span>${T('ui.hpBonus','气血加成')}</span><b>×${(1 + nx * c.hp).toFixed(2)}</b>` +
                `<span>${T('ui.atkBonus','攻击加成')}</span><b>×${(1 + nx * c.atk).toFixed(2)}</b>` +
                `<span>${T('ui.xiuBonus','修炼收益')}</span><b>+${xiuPct}%</b>` +
                `</div>`;
        }
        if (hintEl) {
            const cap = Cultivate.getRebirthZhanliCap(p);
            if ((p.zhanli || 0) < cap) {
                hintEl.innerHTML = '<span class="rb-lock">' + T('ui.freeRbNeed','免费轮回需先达战力 <b>') + fmtNum(cap) + T('ui.freeRbMid','</b>（战力上线，随轮回次数递增；亦是<b>今生战力增长上限</b>，达线后战力停涨）。当前战力：') + fmtNum(p.zhanli || 0) + T('ui.period','。') + '</span>';
            } else {
                const herbName = DN(getMaterial(cfg.herbId));
                const have = (p.inventory.material && p.inventory.material[cfg.herbId]) || 0;
                hintEl.innerHTML = T('ui.herbRbNeed','轮回草轮回需 ') + cfg.herbCost + T('ui.zhu',' 株') + herbName + T('ui.herbRbMid','（每株 ') + fmtNum(getMaterial(cfg.herbId).price) + T('ui.lingShiBuy','灵石，下方可直接购买）。你现有 <b>') + have + T('ui.zhuEnd','</b> 株。');
            }
        }
        const pillBtn = document.getElementById('btnRebirthPill');
        if (pillBtn) {
            const have = (p.inventory.material && p.inventory.material[cfg.herbId]) || 0;
            pillBtn.disabled = have < cfg.herbCost;
        }
        const buyBtn = document.getElementById('btnBuyRebirthHerb');
        if (buyBtn) {
            const price = getMaterial(cfg.herbId).price;
            buyBtn.textContent = T('ui.buyHerb','购买轮回草（') + fmtNum(price) + T('ui.lingShiPerZhu','灵石/株）');
            buyBtn.disabled = (p.stone || 0) < price;
        }
        const freeBtn = document.getElementById('btnRebirthFree');
        if (freeBtn) {
            freeBtn.disabled = (p.zhanli || 0) < Cultivate.getRebirthZhanliCap(p);
        }
    },
    doReincarnate(mode) {
        const p = Game.player;
        if (!p) return;
        const doIt = () => { Cultivate.reincarnate(p, mode); };
        if (mode === 'free') {
            this.showConfirm(T('ui.confirmFreeRb','确认免费轮回？'), T('ui.freeRbBody', '散功重修：境界、<b>战力</b>、装备、寿元将重置归零，重踏仙途从零修炼；但你的气血/攻击永久加成、修炼收益、悟性、劫后余韵等全部保留，凭存留根基更快重登仙途。'), doIt);
        } else {
            const cfg = GameConfig.rebirth;
            const have = (p.inventory.material && p.inventory.material[cfg.herbId]) || 0;
            if (have < cfg.herbCost) { this.toast(T('ui.needHerb','需 ') + cfg.herbCost + T('ui.zhu',' 株') + DN(getMaterial(cfg.herbId)), 'bad'); return; }
            this.showConfirm(T('ui.confirmPillRb','确认轮回丹轮回？'), T('ui.pillRbBody','将消耗 ') + cfg.herbCost + T('ui.zhu',' 株') + DN(getMaterial(cfg.herbId)) + T('ui.pillRbTail','，转世层数 +1：气血/攻击永久加成，修炼收益再 +100%（永久）。'), doIt);
        }
    },

    /* ---------- 渲染所有 ---------- */
    renderAll() {
        if (!Game.player) return;
        // 每个子渲染独立兜底，单个面板异常（如旧存档缺字段）不再中断整体刷新
        const safe = (fn) => { try { fn.call(this); } catch (e) { if (typeof console !== 'undefined') console.warn('[render]', e && e.message); } };
        safe(this.updateResourceBar);
        safe(this.updateCultivationBar);
        safe(this.renderCultivate);
        safe(this.renderEnemyList);
        safe(this.renderSceneList);
        safe(this.renderInventory);
        safe(this.renderSkillList);
        safe(this.renderShop);
        safe(this.renderQuests);
        safe(this.renderMainStory);
        safe(this.renderFriends);
        safe(this.renderReincarnate);
        safe(this.renderStatus);
        safe(this.renderPetPanel);
        safe(this.renderTalent);
        safe(this.renderXianluPanel);
    },

    /* ---------- 仙路面板（大道+ 新乘区，法则/法宝/洞天/化身） ---------- */
    renderXianluPanel() {
        const p = Game.player;
        const body = document.getElementById('xianluBody');
        if (!body) return;
        if (p.realmIdx < 32) {
            body.innerHTML = '<div class="xianlu-locked">🔒 ' + T('ui.xianluLocked','仙路未开') + '<br>' + T('ui.xianluNeed','需达 <b>') + DN(getRealm(32)) + T('ui.xianluStep','</b> 境界方可踏入（当前：') + DN(getRealm(p.realmIdx)) + cnNum(p.realmLayer) + T('ui.xianluLayer','层）<br><span class="muted">') + T('ui.xianluHint','查看全部境界与每世轮回战力上限，请点左下「境」') + '</span></div>';
            return;
        }
        // 1. 法则
        const lawRows = Laws.DEFS.map(def => {
            const lv = Laws.getLevel(p, def);
            const tn = Laws.tierName(lv);
            const mult = lv > 0 ? def.mults[Math.min(lv, def.mults.length - 1)] : 1;
            const r = Laws.canUpgrade(p, def);
            const btn = r.ok
                ? `<button class="btn-act" onclick="UI._xianluLawUpgrade('${def.id}')">${T('ui.shengJie','升阶（')}${fmtNum(r.need)}${T('ui.lingShi','灵石）')}</button>`
                : `<button class="btn-act" disabled>${r.reason}</button>`;
            return `<tr><td>${def.icon} ${DN(def)}</td><td>${tn}</td><td>×${mult.toFixed(2)}</td><td>${btn}</td></tr>`;
        }).join('');
        // 2. 法宝
        const tr = p.treasure || { type: Treasure.DEFAULT_TYPE, level: 1 };
        const trDef = Treasure.def(p);
        const trR = Treasure.canRefine(p);
        const trBtn = trR.ok
            ? `<button class="btn-act" onclick="UI._xianluTreasureRefine()">${T('ui.jiLian','祭炼（')}${fmtNum(trR.cost)}${T('ui.lingShi','灵石）')}</button>`
            : `<button class="btn-act" disabled>${trR.reason}</button>`;
        // 3. 洞天
        const caveRows = Cave.SUB.map(sub => {
            const lv = Cave.getLv(p, sub.id);
            const cost = Cave.upCost(p, sub);
            const r = Cave.canUpgrade(p, sub);
            const btn = r.ok
                ? `<button class="btn-act" onclick="UI._xianluCaveUpgrade('${sub.id}')">${T('ui.shengJi','升级（')}${fmtNum(cost)}${T('ui.lingShi','灵石）')}</button>`
                : `<button class="btn-act" disabled>${r.reason}</button>`;
            return `<tr><td>${sub.icon} ${DN(sub)}</td><td>Lv.${lv}</td><td>${DD(sub)}</td><td>${btn}</td></tr>`;
        }).join('');
        // 4. 化身
        const avs = p.avatars || [];
        const avRows = avs.length ? avs.map((a, i) => {
            const r = Avatars.canUpgrade(p, a);
            const btn = r.ok
                ? `<button class="btn-act" onclick="UI._xianluAvatarUpgrade(${i})">${T('ui.shengJi','升级（')}${fmtNum(r.cost)}${T('ui.lingShi','灵石）')}</button>`
                : `<button class="btn-act" disabled>${r.reason}</button>`;
            return `<tr><td>#${i + 1}</td><td>Lv.${a.lv}</td><td>${(Avatars.rateOf(a) * 100).toFixed(1)}% ${T('ui.zhuXiuLian','主修炼')}</td><td>${btn}</td><td>${T('ui.leiji','累计')} ${fmtNum(a.total || 0)}</td></tr>`;
        }).join('') : `<tr><td colspan="5" class="muted">${T('ui.noAvatar','尚未创建化身')}</td></tr>`;
        const canCreate = Avatars.canCreate(p);
        const createBtn = canCreate.ok
            ? `<button class="btn-act" onclick="UI._xianluAvatarCreate()">${T('ui.chuangJianHuaShen','创建化身（')}${fmtNum(canCreate.cost)}${T('ui.lingShi','灵石）')}</button>`
            : `<button class="btn-act" disabled>${canCreate.reason}</button>`;
        // 总乘区
        const lm = Laws.totalMult(p);
        const tm = Treasure.mult(p);
        const cm = Cave.totalMult(p);
        const total = lm * tm * cm;
        body.innerHTML = `
        <div class="xianlu-summary">${T('ui.zongChengQu','总乘区：')}<b class="text-gold">×${total.toFixed(2)}</b>${T('ui.chengQuMid','（法则×')}${lm.toFixed(2)}${T('ui.chengQuFaBao',' × 法宝×')}${tm.toFixed(2)}${T('ui.chengQuDongTian',' × 洞天×')}${cm.toFixed(2)}${T('ui.rparen','）')}</div>
        <div class="xianlu-section">
            <h4>${T('ui.faZe','📜 法则领悟')}</h4>
            <table class="xianlu-tbl"><thead><tr><th>${T('ui.thLaw','法则')}</th><th>${T('ui.thTier','阶')}</th><th>${T('ui.thMult','乘数')}</th><th>${T('ui.thOp','操作')}</th></tr></thead><tbody>${lawRows}</tbody></table>
        </div>
        <div class="xianlu-section">
            <h4>${T('ui.benMingFaBao','⚔ 本命法宝')}</h4>
            <p>${T('ui.type','类型：')}<b>${trDef.icon} ${DN(trDef)}</b>　${T('ui.level','等级：')}<b>Lv.${tr.level}</b>　${T('ui.multiplier','乘数：')}<b>×${tm.toFixed(2)}</b></p>
            <p>${T('ui.battleEffect','战斗效果：')}<b class="text-gold">${DD(trDef)}</b></p>
            <p>${trBtn}</p>
        </div>
        <div class="xianlu-section">
            <h4>${T('ui.dongTian','🏞 洞天福地')}</h4>
            <table class="xianlu-tbl"><thead><tr><th>${T('ui.thCave','洞天')}</th><th>${T('ui.thLevel','等级')}</th><th>${T('ui.thOutput','产出')}</th><th>${T('ui.thOp','操作')}</th></tr></thead><tbody>${caveRows}</tbody></table>
            <p class="muted">${T('ui.caveHint','洞天乘区：灵脉每级+0.08、药田+0.05、悟道崖+0.10；洞天按秒持续产出灵石/悟性经验')}</p>
        </div>
        <div class="xianlu-section">
            <h4>${T('ui.fenShen','🪞 分身化身')}</h4>
            <p>${T('ui.avatarSummary','已创建 <b>'+avs.length+'</b> / '+Avatars.MAX_AVATARS+' 个化身　每化身按主修炼速率的固定比例向 zhanli 池注水（不参与战斗属性）')}</p>
            <table class="xianlu-tbl"><thead><tr><th>${T('ui.thNo','编号')}</th><th>${T('ui.thLevel','等级')}</th><th>${T('ui.thInject','注水率')}</th><th>${T('ui.thOp','操作')}</th><th>${T('ui.leiji','累计')}</th></tr></thead><tbody>${avRows}</tbody></table>
            <p>${createBtn}</p>
        </div>`;
    },
    /* ---------- 境界图鉴面板 ---------- */
    renderRealmPanel() {
        try {
        const p = Game.player;
        const realms = GameConfig.realms;
        const last = realms.length - 1;
        const c = GameConfig.rebirth || {};
        const maxR = c.maxRebirth || 100;
        const baseR = c.baseRealm || 0;
        const perR = c.realmPerRebirth || 1;

        // ---- 一、全部境界 ----
        const cntEl = document.getElementById('realmCount');
        if (cntEl) cntEl.textContent = realms.length;
        const curEl = document.getElementById('realmCurrent');
        if (curEl && p) {
            const cur = getRealm(p.realmIdx);
            curEl.innerHTML = T('ui.realmCurrent','你当前：<b>') + DN(cur) + T('ui.realmCurMid','</b> 第 ') + p.realmLayer + '/' + cur.layers + T('ui.realmCurLayer',' 层　（共 ') + realms.length + T('ui.realmCurTail',' 大境界 · ') + (realms.length * 15) + T('ui.realmCurEnd',' 段）');
        } else if (curEl) {
            curEl.innerHTML = `<span class="muted">${T('ui.noChar','尚未创建角色')}</span>`;
        }
        const tbl = document.getElementById('realmTable');
        if (tbl && p) {
            let html = '<div class="realm-row realm-headrow"><span class="c-idx">#</span><span class="c-name">' + T('realmHeader', '境界') + '</span><span class="c-layer">' + T('layer', '层') + '</span><span class="c-base">' + T('baseHeader', '基础战力') + '</span><span class="c-cost">' + T('costHeader', '满层突破成本') + '</span></div>';
            realms.forEach((r, i) => {
                const cost = Cultivate.getBreakthroughCost({ realmIdx: i, realmLayer: r.layers });
                const cls = (i === p.realmIdx) ? ' realm-row current' : ' realm-row';
                html += `<div class="${cls.trim()}"><span class="c-idx">${i}</span><span class="c-name">${DN(r)}</span><span class="c-layer">${r.layers}</span><span class="c-base">${fmtNum(r.baseXiu)}</span><span class="c-cost">${fmtNum(cost)}</span></div>`;
            });
            tbl.innerHTML = html;
        }

        // ---- 二、每世轮回战力上线 ----
        const capCur = document.getElementById('capCurrent');
        if (capCur && p) {
            const myCap = Cultivate.getLifeZhanliCap(p); // 当前世实际上线（含旧档不低于当前战力）
            let txt = T('ui.capCurrent','你当前第 <b>') + p.rebirth + T('ui.capCurrentMid','</b> 世　本世战力上线：<b class="text-gold">') + fmtNum(myCap) + T('ui.rbClose','</b>');
            if (myCap >= ZHANLI_CAP) txt += T('ui.noCap', `　（已放开，无上限）`);
            else {
                const diff = myCap - (p.zhanli || 0);
                txt += diff > 0 ? T('ui.capDiff','　还差 <b class="text-gold">') + fmtNum(diff) + T('ui.capDiffEnd','</b> 即可免费轮回') : T('ui.capReached', `　已达上线，可<b>免费轮回</b>提升下一世`);
            }
            capCur.innerHTML = txt;
        } else if (capCur) {
            capCur.innerHTML = `<span class="muted">${T('ui.noChar','尚未创建角色')}</span>`;
        }
        const capTbl = document.getElementById('capTable');
        if (capTbl && p) {
            let html = '<div class="realm-row realm-headrow"><span class="c-idx">' + T('ui.rebirthCol','世') + '</span><span class="c-name">' + T('reqRealmMax', '需达境界(满层)') + '</span><span class="c-cost">' + T('capHeader', '战力上线') + '</span></div>';
            for (let n = 0; n <= maxR; n++) {
                const idx = Math.min(last, baseR + n * perR);
                let realmName, cap, capTxt;
                if (n >= maxR || idx >= last) {
                    realmName = T('final', '—（终局）');
                    cap = ZHANLI_CAP;
                    capTxt = fmtNum(cap) + T('ui.capNone','（无上限）');
                } else {
                    realmName = DN(realms[idx]) + T('ui.manCeng','（满层）');
                    cap = Cultivate.getRebirthZhanliCap({ rebirth: n });
                    capTxt = fmtNum(cap);
                }
                const cls = (n === p.rebirth) ? ' realm-row current' : ' realm-row';
                html += `<div class="${cls.trim()}"><span class="c-idx">${n}</span><span class="c-name">${realmName}</span><span class="c-cost">${capTxt}</span></div>`;
            }
            capTbl.innerHTML = html;
        }
        } catch (e) { if (typeof console !== 'undefined') console.error('[renderRealmPanel]', e && (e.stack || e.message)); }
    },
    _xianluLawUpgrade(defId) {
        const def = Laws.DEFS.find(d => d.id === defId); if (!def) return;
        const r = Laws.upgrade(Game.player, def);
        if (r.ok) { UI.toast(DN(def) + T('ui.shengZhi','升至') + Laws.tierName(r.newLevel), 'gold'); if (typeof Sound !== 'undefined') Sound.play('levelup'); Game.save(); this.renderXianluPanel(); UI.renderStatus(); }
        else UI.toast(r.reason, 'bad');
    },
    _xianluTreasureRefine() {
        const r = Treasure.refine(Game.player);
        if (r.ok) { UI.toast(T('ui.benMingFaBaoShengZhi','本命法宝升至') + ' Lv.' + r.level, 'gold'); if (typeof Sound !== 'undefined') Sound.play('levelup'); Game.save(); this.renderXianluPanel(); UI.renderStatus(); }
        else UI.toast(r.reason, 'bad');
    },
    _xianluCaveUpgrade(subId) {
        const sub = Cave.SUB.find(s => s.id === subId); if (!sub) return;
        const r = Cave.upgrade(Game.player, sub);
        if (r.ok) { UI.toast(DN(sub) + T('ui.shengZhi','升至') + ' Lv.' + r.level, 'gold'); if (typeof Sound !== 'undefined') Sound.play('levelup'); Game.save(); this.renderXianluPanel(); UI.renderStatus(); }
        else UI.toast(r.reason, 'bad');
    },
    _xianluAvatarCreate() {
        const r = Avatars.create(Game.player);
        if (r.ok) { UI.toast(T('ui.createAvatarOk','成功创建化身'), 'gold'); if (typeof Sound !== 'undefined') Sound.play('levelup'); Game.save(); this.renderXianluPanel(); }
        else UI.toast(r.reason, 'bad');
    },
    _xianluAvatarUpgrade(idx) {
        const av = Game.player.avatars && Game.player.avatars[idx]; if (!av) return;
        const r = Avatars.upgrade(Game.player, av);
        if (r.ok) { UI.toast(T('ui.avatarUp','化身 #') + (idx + 1) + T('ui.shengZhi2',' 升至 Lv.') + r.lv, 'gold'); if (typeof Sound !== 'undefined') Sound.play('levelup'); Game.save(); this.renderXianluPanel(); }
        else UI.toast(r.reason, 'bad');
    },

    /* ---------- 修炼区子标签切换（灵宠/天赋并入） ---------- */
    switchCultSub(sub) {
        const map = { cult: 'cultSubCult', pet: 'cultSubPet', talent: 'cultSubTalent' };
        const id = map[sub]; if (!id) return;
        // 确保修炼面板为当前激活面板
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === 'cultivate'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const cp = document.getElementById('panel-cultivate');
        if (cp) cp.classList.add('active');
        Game.currentPanel = 'cultivate';
        // 切换子视图显隐
        document.querySelectorAll('.cult-subview').forEach(v => v.classList.remove('active'));
        const sv = document.getElementById(id);
        if (sv) sv.classList.add('active');
        document.querySelectorAll('.cult-subtab').forEach(t => t.classList.toggle('active', t.dataset.sub === sub));
        // 渲染对应内容
        if (sub === 'cult') this.renderCultivate();
        else if (sub === 'pet') this.renderPetPanel();
        else if (sub === 'talent') this.renderTalent();
    },

    /* ---------- 切换面板 ---------- */
    /* ---------- 语言切换后整体重渲染 ---------- */
    refreshAll() {
        try { this.updateResourceBar(); } catch (e) {}
        if (typeof Game !== 'undefined' && Game.currentPanel) { try { this.switchPanel(Game.currentPanel); } catch (e) {} }
        if (typeof applyI18N === 'function') applyI18N();
    },

    switchPanel(name) {
        // 灵宠/天赋已并入修炼区子标签，快捷键与教程经此统一路由
        if (name === 'pet' || name === 'talent') { try { this.switchCultSub(name); } catch (e) { if (typeof console !== 'undefined') console.error('[switchPanel '+name+']', e && (e.stack || e.message)); } return; }
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.panel === name));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('panel-' + name);
        if (panel) panel.classList.add('active');
        Game.currentPanel = name;
        // 切换到面板时刷新对应内容；整体 try/catch，单面板异常不再阻断整条切换链路
        try {
            if (name === 'cultivate') this.switchCultSub('cult');
            else if (name === 'combat') this.renderEnemyList();
            else if (name === 'explore') this.renderSceneList();
            else if (name === 'inventory') this.renderInventory();
            else if (name === 'skill') this.renderSkillList();
            else if (name === 'shop') this.renderShop();
            else if (name === 'quest') this.renderQuests();
            else if (name === 'mainstory') this.renderMainStory();
            else if (name === 'friends') this.renderFriends();
            else if (name === 'reincarnate') this.renderReincarnate();
            else if (name === 'xianlu') this.renderXianluPanel();
            else if (name === 'realm') {
                // 防御：若浏览器缓存了旧 ui.js（无 renderRealmPanel 方法），给明确提示而非静默空白
                if (typeof this.renderRealmPanel === 'function') this.renderRealmPanel();
                else {
                    const t = document.getElementById('realmTable');
                    if (t) t.innerHTML = '<div class="muted" style="padding:24px">' + T('ui.realmModuleUnloaded','境界图鉴模块未加载，请按 <b>Ctrl+Shift+R</b> 硬刷新页面') + '</div>';
                    const c = document.getElementById('capTable');
                    if (c) c.innerHTML = '';
                }
            }
        } catch (e) { if (typeof console !== 'undefined') console.error('[switchPanel '+name+']', e && (e.stack || e.message)); }
    },

    /* ---------- 新手教程 ---------- */
    TUTORIAL_STEPS: [
        { title: () => T('ui.tut1.title','踏入仙途'), body: () => T('ui.tut1.body','道友初临，且听我徐徐道来这方世界的门道。点击「下一步」即可层层展开，随时可点右上 📖 重看。'), panel: 'cultivate' },
        { title: () => T('ui.tut2.title','静心修炼'), body: () => T('ui.tut2.body','<b>战力</b>乃修行根本。点「修炼（点击聚气）」可手动攒战力，平日亦会缓缓自增——顶部「气」即为战力。'), panel: 'cultivate', target: '#cultivateTap' },
        { title: () => T('ui.tut3.title','闭关 · 游历 · 兑换'), body: () => T('ui.tut3.body','<b>闭关潜修</b>换大量战力；<b>游历天下</b>寻灵石、材料与丹药；<b>兑换灵石</b>以战力换灵石。三者皆耗<b>寿元</b>。'), panel: 'cultivate', target: '#seclusionHint' },
        { title: () => T('ui.tut4.title','突破境界'), body: () => T('ui.tut4.body','战力攒满，便点「<b>突破</b>」精进境界、增寿元、强根基。每<b>突破大境界</b>会触发<b>天劫</b>（可请护道人化解或硬抗，成功则永久增益修炼与灵石），并<b>觉醒天赋点</b>。※ <b>道祖之后</b>的超脱系（道君→大道共 20 境）突破所需战力暴增 <b>×30</b>，当早做积累。'), panel: 'cultivate', target: '#breakBtn' },
        { title: () => T('ui.tut5.title','顿悟 · 悟性'), body: () => T('ui.tut5.body','「<b>顿悟</b>」耗灵石或战力提升<b>悟性</b>。悟性越高，<b>每次点击战力</b>与<b>修炼速率</b>越暴涨——这是后期（大乘以上）冲刺高境界的关键引擎，越早顿悟、受益越久，闭关一年可抵往昔千载。'), panel: 'cultivate', target: '#enlightenBtn' },
        { title: () => T('ui.tut6.title','寿元将尽'), body: () => T('ui.tut6.body','留意右上「<b>寿元</b>」：每过真实<b>一分钟减一</b>，闭关游历亦折寿元。寿元耗尽便<b>羽化归虚</b>，故当抓紧修行。'), panel: 'cultivate', target: '#topLife' },
        { title: () => T('ui.tut7.title','斗法证道'), body: () => T('ui.tut7.body','切到「<b>斗法</b>」与妖兽论道，胜则得战力、灵石与掉落，亦是试炼道心。'), panel: 'combat', target: '#panel-combat' },
        { title: () => T('ui.tut8.title','三界历练'), body: () => T('ui.tut8.body','「<b>历练</b>」可访名山、探秘境、遇奇遇，收获随机机缘，妙不可言。'), panel: 'explore', target: '#panel-explore' },
        { title: () => T('ui.tut9.title','坊市淘宝'), body: () => T('ui.tut9.body','切到「<b>坊市</b>」可买卖物资、搜罗法宝。装备、丹药、功法、法宝、灵宠皆可交易；修行所需的<b>轮回草</b>则于「转世轮回」面板内直达购买。'), panel: 'shop', target: '#panel-shop' },
        { title: () => T('ui.tut10.title','乾坤袋'), body: () => T('ui.tut10.body','「<b>乾坤袋</b>」随身藏纳装备丹药。穿戴<b>武器·护甲·饰品·法宝</b>可增益气血、攻击、防御与灵力；丹药则提供临时裨益。战力强弱，半系于此。'), panel: 'inventory', target: '#panel-inventory' },
        { title: () => T('ui.tut11.title','神通'), body: () => T('ui.tut11.body','「<b>神通</b>」可修习法术，临阵施展。攻伐、护身、辅助各具妙用，功法愈深，威能愈盛——是越阶斗法、闯荡秘境的底气。'), panel: 'skill', target: '#panel-skill' },
        { title: () => T('ui.tut12.title','道友'), body: () => T('ui.tut12.body','「<b>道友</b>」凭<b>档案码</b>结交同道，<b>道友榜</b>按战力排序、彼此砥砺；亦可与道友切磋论道，互证修行。'), panel: 'friends', target: '#panel-friends' },
        { title: () => T('ui.tut13.title','转世轮回'), body: () => T('ui.tut13.body','此乃本游戏<b>核心玩法</b>。「<b>战力上线</b>」是随轮回次数递增的战力门槛，也是<b>今生战力增长上限</b>——战力涨到上线即停涨（境界不再单独设天花板），此时即可<b>免费轮回</b>提升上线：重立道基、重置境界与寿元，却<b>永久保留</b>气血与攻击加成。每轮回一世，<b>修炼收益永久 +100%</b>（第 N 世修炼速度 ×(1+N)），气血攻击各 ×(1+0.3N)；轮回上限 <b>100 世</b>。亦可耗 <b>100 株轮回草</b>（坊市有售）直接轮回，不受门槛所限。转世面板已单独显示你的<b>轮回层数</b>。'), panel: 'reincarnate', target: '#panel-reincarnate' },
        { title: () => T('ui.tut14.title','灵宠培养'), body: () => T('ui.tut14.body','「<b>灵宠</b>」与你同生共死。坊市可购灵宠、历练东海龙宫可收服幼龙；在<b>修炼区·灵宠</b>子标签中选中灵宠，可<b>喂养</b>（耗灵兽粮）、<b>修炼</b>（耗战力）、<b>化形进阶</b>（耗化形丹），等级与化形越高，属性越强，出战越猛。'), panel: 'cultivate', sub: 'pet', target: '#cultSubPet' },
        { title: () => T('ui.tut15.title','天赋'), body: () => T('ui.tut15.body','「<b>天赋</b>」是贯穿道途的长线成长：每<b>突破大境界</b>觉醒天赋点（每满 5 小境界再得 1 点）。在<b>修炼区·天赋</b>子标签修习六系天赋（攻伐/守御/长生/悟道/御兽/天命），永久增益攻击、防御、修炼、灵石、斗法与渡劫。'), panel: 'cultivate', sub: 'talent', target: '#cultSubTalent' },
        { title: () => T('ui.tut16.title','境界全貌'), body: () => T('ui.tut16.body','修行之路共 <b>103 大境界 ×15 层</b>：自练气一路攀至 <b>道祖</b>；道祖之后更有 <b>道君→道尊→道圣→…→太一→…→太寥</b> 等超脱系境界，越往后越近大道本源。※ 道祖之后段位难度（突破战力/灵石门槛、斗法敌人强度）统一 <b>×900</b>，需海量战力方能登顶。达 <b>大乘（大成）期</b> 以上，诸般「<b>绝学重宝</b>」方现世间——坊市解锁 <b>太清宝塔·诸天鼎·无衡镜</b> 等仙界法宝、神通现 <b>太清剑诀→道·无上</b> 诸绝学、灵宠得 <b>麒麟王·祖龙太初</b>，更可飞升 <b>九重天·诸天战场</b> 绝境夺造化。'), panel: 'cultivate' },
        { title: () => T('ui.tut17.title','仙路（大道+）'), body: () => T('ui.tut17.body','达 <b>大道</b> 境界后，侧栏「<b>道</b>」图标亮起，进入「<b>仙路</b>」面板可逐步解锁四条<b>独立乘区</b>，叠加在 境界/装备/灵宠/轮回/天赋 之后，<b>互不稀释</b>——<br>• <b>法则领悟</b>：六条法则（剑/丹/阵/时空/因果/轮回）各 5 阶，每阶给一个独立乘数，阶升 = 永久乘区<br>• <b>本命法宝</b>：5 种法宝、30 级，含独特战斗效果（吸血/反弹/护盾/先手/真伤）<br>• <b>洞天福地</b>：灵脉/药田/悟道崖 3 块 20 级，被动产出灵石/悟性经验，乘区独立<br>• <b>分身化身</b>：最多 3 个化身（一气化三清），按主修炼速率比例向 zhanli 池注水（不进战斗属性）<br>※ 这是后期的核心成长路径，按你 <b>灵石</b> 节奏逐项升即可。'), panel: 'xianlu' },
        { title: () => T('ui.tut18.title','境界图鉴'), body: () => T('ui.tut18.body','侧栏「<b>境</b>」图标进入「<b>境界图鉴</b>」面板，可一览<b>全部 103 大境界</b>（每层基础战力与满层突破成本）与<b>每世轮回的战力上线</b>（免费轮回门槛、今生战力增长上限）——你当前所处之境、当前世数对应的上限都会<b>金底高亮</b>，一眼看清离下一世还差多少。'), panel: 'realm' },
        { title: () => T('ui.tut19.title','道途恒长'), body: () => T('ui.tut19.body','「<b>任务</b>」指引方向，「<b>坊市</b>」补给资源，「<b>道友</b>」论道比拼。仙途漫漫，善自珍重，去罢！'), panel: 'quest' }
    ],
    tutorialIndex: 0,

    startTutorial() {
        const p = Game.player;
        if (!p) return;
        this.tutorialIndex = 0;
        const ov = document.getElementById('tutorial-overlay');
        if (ov) ov.classList.remove('hidden');
        this.renderTutorialStep();
    },

    renderTutorialStep() {
        const p = Game.player;
        if (!p) return;
        const steps = this.TUTORIAL_STEPS;
        const i = this.tutorialIndex;
        const step = steps[i];
        if (step.panel && Game.currentPanel !== step.panel) this.switchPanel(step.panel);
        if (step.sub) this.switchCultSub(step.sub);
        const titleEl = document.getElementById('tutorialTitle');
        const bodyEl = document.getElementById('tutorialBody');
        const stepEl = document.getElementById('tutorialStep');
        if (titleEl) titleEl.innerHTML = (typeof step.title === 'function') ? step.title() : step.title;
        if (bodyEl) bodyEl.innerHTML = (typeof step.body === 'function') ? step.body() : (step.body || '');
        if (stepEl) stepEl.textContent = (i + 1) + ' / ' + steps.length;
        const prev = document.getElementById('tutorialPrev');
        const next = document.getElementById('tutorialNext');
        if (prev) prev.style.visibility = (i === 0) ? 'hidden' : 'visible';
        if (next) next.textContent = (i === steps.length - 1) ? T('ui.finish','完成') : T('ui.nextStep','下一步');
        // 聚光灯高亮
        const spot = document.getElementById('tutorialSpot');
        if (spot) {
            if (step.target) {
                const el = document.querySelector(step.target);
                if (el) {
                    requestAnimationFrame(() => {
                        const r = el.getBoundingClientRect();
                        spot.style.display = 'block';
                        spot.style.top = (r.top - 8) + 'px';
                        spot.style.left = (r.left - 8) + 'px';
                        spot.style.width = (r.width + 16) + 'px';
                        spot.style.height = (r.height + 16) + 'px';
                    });
                } else { spot.style.display = 'none'; }
            } else { spot.style.display = 'none'; }
        }
    },

    tutorialNext() {
        if (this.tutorialIndex >= this.TUTORIAL_STEPS.length - 1) { this.endTutorial(); return; }
        this.tutorialIndex++;
        this.renderTutorialStep();
    },

    tutorialPrev() {
        if (this.tutorialIndex > 0) { this.tutorialIndex--; this.renderTutorialStep(); }
    },

    endTutorial() {
        const ov = document.getElementById('tutorial-overlay');
        if (ov) ov.classList.add('hidden');
        const spot = document.getElementById('tutorialSpot');
        if (spot) spot.style.display = 'none';
        const p = Game.player;
        if (p) {
            p.stats.tutorialDone = true;
            if (typeof Game !== 'undefined' && typeof Game.save === 'function') Game.save();
        }
        this.toast(T('ui.tutorialDone','新手教程已毕，祝你仙途坦荡'), 'gold');
    },

    /* ---------- 闭关潜修界面 ---------- */
    /* ---------- 闭关选项确认 ---------- */
    secludeAction(y) {
        const p = Game.player;
        if (!p) return;
        const r = Cultivate.seclude(p, y);
        if (r && r.dead) return; // 寿元耗尽，已进入羽化流程
        this.hideModal();
        if (r) {
            this.toast(T('ui.secludeToast','闭关') + r.years + T('ui.nian','年') + T('ui.secludeMid','，悟得') + fmtNum(r.zhanli) + T('ui.zhanli','战力'), 'gold');
            this.renderAll();
        }
    },

    /* ---------- 游历天下 ---------- */
    openYouli() {
        const p = Game.player;
        if (!p) return;
        const realmIdx = p.realmIdx || 0;
        const stonePerYear = Cultivate.YOULI_BASE_STONE * Math.pow(Cultivate.YOULI_GROWTH, realmIdx);
        const opts = [
            { y: 1,     label: T('ui.youliY1','一年'),   sub: T('ui.youliS1','初出茅庐') },
            { y: 10,    label: T('ui.youliY2','十年'),   sub: T('ui.youliS2','云游四海') },
            { y: 50,    label: T('ui.youliY3','五十年'), sub: T('ui.youliS3','遍历名山') },
            { y: 100,   label: T('ui.youliY4','百年'),   sub: T('ui.youliS4','访遍洞天') },
            { y: 1000,  label: T('ui.youliY5','千年'),   sub: T('ui.youliS5','行走红尘') },
            { y: 10000, label: T('ui.youliY6','万年'),   sub: T('ui.youliS6','沧海桑田') }
        ];
        const cards = opts.map(o => {
            const disabled = o.y > (p.lifespan || 0);
            const stone = Math.floor(o.y * stonePerYear);
            return `
                <button class="seclusion-card${disabled ? ' disabled' : ''}" ${disabled ? 'disabled' : `onclick="UI.youliAction(${o.y})"`}>
                    <span class="secl-label">${o.label}</span>
                    <span class="secl-sub">${o.sub}</span>
                    ${disabled ? `<span class="secl-gain">${T('ui.lifeLack','寿元不足')}</span>` : `<span class="secl-gain">${T('ui.youliGain','约+')}${fmtNum(stone)}${T('ui.lingShiBaowu','灵石·含随机宝物')}</span>`}
                </button>
            `;
        }).join('');
        const allIn = p.lifespan || 0;
        const allInStone = Math.floor(allIn * stonePerYear);
        const allInDisabled = allIn <= 0;
        this.showModal({
            title: T('ui.youliTitle','游历天下'),
            body: `<p style="line-height:1.7;margin-bottom:12px">${T('ui.youliBody1','游历四方，寻宝访仙。<b>每游历一年，折损一年寿元</b>，但可获<b>灵石</b>、<b>材料</b>、乃至<b>丹药</b>与<b>奇遇</b>。当前寿元：')}<b style="color:#d4af37">${fmtNum(p.lifespan || 0)}年</b>。</p>
                   <p style="color:#9a8e7a;font-size:12px;margin-bottom:18px">${T('ui.youliBody2','（与闭关潜修相对：闭关换战力，游历换资源）')}</p>
                   <div class="seclusion-scroll-wrap">
                       <button class="seclusion-arrow seclusion-arrow-left" aria-label="${T('ui.slideLeft','向左滑动')}" onclick="document.getElementById('youliOptions').scrollBy({left:-170,behavior:'smooth'})">‹</button>
                       <div class="seclusion-options" id="youliOptions">${cards}</div>
                       <button class="seclusion-arrow seclusion-arrow-right" aria-label="${T('ui.slideRight','向右滑动')}" onclick="document.getElementById('youliOptions').scrollBy({left:170,behavior:'smooth'})">›</button>
                   </div>
                   <div class="seclusion-allin${allInDisabled ? ' disabled' : ''}" ${allInDisabled ? '' : `onclick="UI.youliAction(${allIn})"`}>
                       <span class="secl-allin-label">${T('ui.exhaustLife','耗尽全部寿元')}</span>
                       <span class="secl-allin-gain">${allInDisabled ? T('ui.noLife','无寿元可用') : `${T('ui.youliGain','约+')}${fmtNum(allInStone)}${T('ui.lingShiNian','灵石 · ')}${fmtNum(allIn)}年`}</span>
                   </div>`,
            footer: [
                { text: T('ui.close','关闭'), action: () => this.hideModal() }
            ]
        });
    },

    youliAction(y) {
        const p = Game.player;
        if (!p) return;
        const r = Cultivate.youli(p, y);
        if (r && r.dead) return; // 寿元耗尽，已进入羽化流程
        if (!r) return;
        this.hideModal();
        const matHtml = r.materials.length
            ? r.materials.map(m => `<span class="loot-chip">${m.icon} ${DN(m)}×${m.count}</span>`).join('')
            : `<span class="loot-empty">${T('ui.none','无')}</span>`;
        const pillHtml = r.pills.length
            ? r.pills.map(m => `<span class="loot-chip">${m.icon} ${DN(m)}×${m.count}</span>`).join('')
            : `<span class="loot-empty">${T('ui.none','无')}</span>`;
        const fortHtml = r.fortune ? `<p class="loot-fortune">✨ ${r.fortuneText}</p>` : '';
        this.showModal({
            title: T('ui.youliResult','游历') + r.years + T('ui.nianResult','年 · 收获'),
            body: `<p style="margin-bottom:10px">${T('ui.youliResultBody','遍历四方，所得如下：')}</p>
                   <div class="loot-row"><span class="loot-label">${T('ui.lingShi','灵石')}</span><span class="loot-val">+${fmtNum(r.stone)}</span></div>
                   <div class="loot-row"><span class="loot-label">${T('ui.material','材料')}</span><div class="loot-chips">${matHtml}</div></div>
                   <div class="loot-row"><span class="loot-label">${T('ui.pill','丹药')}</span><div class="loot-chips">${pillHtml}</div></div>
                   ${fortHtml}`,
            footer: [
                { text: T('ui.takeIt','收下'), action: () => { this.hideModal(); this.renderAll(); } }
            ]
        });
    },

    /* ---------- 拿战力换灵石 ---------- */
    openExchange() {
        const p = Game.player;
        if (!p) return;
        const rate = Cultivate.ZHANLI_TO_STONE_RATE;
        const tiers = [
            { v: 1e5,  label: T('ui.exTier1','10万战力') },
            { v: 1e6,  label: T('ui.exTier2','100万战力') },
            { v: 1e7,  label: T('ui.exTier3','1000万战力') },
            { v: 1e8,  label: T('ui.exTier4','1亿战力') },
            { v: 1e9,  label: T('ui.exTier5','10亿战力') }
        ];
        const cards = tiers.map(o => {
            const disabled = o.v > (p.zhanli || 0);
            const stone = Math.floor(o.v * rate);
            return `
                <button class="seclusion-card exchange-card${disabled ? ' disabled' : ''}" ${disabled ? 'disabled' : `onclick="UI.exchangeAction(${o.v})"`}>
                    <span class="secl-label">${o.label}</span>
                    <span class="secl-sub">${T('ui.exchange','兑换')}</span>
                    ${disabled ? `<span class="secl-gain">${T('ui.zhanliLack','战力不足')}</span>` : `<span class="secl-gain">→ ${fmtNum(stone)}${T('ui.lingShi','灵石')}</span>`}
                </button>
            `;
        }).join('');
        const allIn = Math.floor(p.zhanli || 0);
        const allInStone = Math.floor(allIn * rate);
        const allInDisabled = allIn <= 0;
        this.showModal({
            title: T('ui.exchangeTitle','兑换灵石'),
            body: `<p style="line-height:1.7;margin-bottom:12px">${T('ui.exchangeBody1', `将<b>战力</b>兑换为<b>灵石</b>，用于突破与坊市采买。当前战力：<b style="color:#7dd3c0">${fmtNum(p.zhanli || 0)}</b>。`)}</p>
                   <p style="color:#9a8e7a;font-size:12px;margin-bottom:8px">${T('ui.exchangeBody2', `汇率：约 ${fmtNum(2000)} 战力 ≈ 1 灵石。兑换所得灵石不计入任务进度；兑换会消耗战力，可能拖慢突破，请权衡。`)}</p>
                   <div class="seclusion-scroll-wrap">
                       <button class="seclusion-arrow seclusion-arrow-left" aria-label="${T('ui.slideLeft','向左滑动')}" onclick="document.getElementById('exchangeOptions').scrollBy({left:-170,behavior:'smooth'})">‹</button>
                       <div class="seclusion-options" id="exchangeOptions">${cards}</div>
                       <button class="seclusion-arrow seclusion-arrow-right" aria-label="${T('ui.slideRight','向右滑动')}" onclick="document.getElementById('exchangeOptions').scrollBy({left:170,behavior:'smooth'})">›</button>
                   </div>
                   <div class="seclusion-allin exchange-allin${allInDisabled ? ' disabled' : ''}" ${allInDisabled ? '' : `onclick="UI.exchangeAction(${allIn})"`}>
                       <span class="secl-allin-label">${T('ui.allExchange','全部可兑')}</span>
                       <span class="secl-allin-gain">${allInDisabled ? T('ui.noZhanli','无战力可用') : `${fmtNum(allInStone)}${T('ui.lingShi','灵石')} · ${fmtNum(allIn)}${T('ui.zhanli','战力')}`}</span>
                   </div>
                   <div class="ex-custom">
                       <input id="exCustomInput" class="ex-input" type="number" min="1" inputmode="numeric" placeholder="${T('ui.exPlaceholder','输入想兑换的战力数量')}" />
                       <button class="ex-custom-btn" onclick="UI.exchangeAction(parseFloat(document.getElementById('exCustomInput').value)||0)">${T('ui.exBtn','兑 换')}</button>
                   </div>`,
            footer: [
                { text: T('ui.close','关闭'), action: () => this.hideModal() }
            ]
        });
    },

    exchangeAction(v) {
        const p = Game.player;
        if (!p) return;
        const r = Cultivate.exchangeZhanliForStone(p, v);
        if (!r) return;
        this.hideModal();
        this.toast(T('ui.exchangeOk','兑换成功：消耗') + fmtNum(r.zhanliSpent) + T('ui.zhanli','战力') + T('ui.exchangeOkMid','，得') + fmtNum(r.stoneGot) + T('ui.lingShi','灵石'), 'gold');
        this.renderAll();
    },

    openSeclusion() {
        const p = Game.player;
        if (!p) return;
        const opts = [
            { y: 1,     label: T('ui.youliY1','一年'),   sub: T('ui.seclS1','初窥门径') },
            { y: 10,    label: T('ui.youliY2','十年'),   sub: T('ui.seclS2','小有所成') },
            { y: 50,    label: T('ui.youliY3','五十年'), sub: T('ui.seclS3','闭关半世') },
            { y: 100,   label: T('ui.youliY4','百年'),   sub: T('ui.seclS4','大道可期') },
            { y: 1000,  label: T('ui.youliY5','千年'),   sub: T('ui.seclS5','洞中方七日') },
            { y: 10000, label: T('ui.youliY6','万年'),   sub: T('ui.seclS6','世上已千年') }
        ];
        const cards = opts.map(o => {
            const disabled = o.y > (p.lifespan || 0);
            const gain = Cultivate.previewSeclude(p, o.y);
            return `
                <button class="seclusion-card${disabled ? ' disabled' : ''}" ${disabled ? 'disabled' : `onclick="UI.secludeAction(${o.y})"`}>
                    <span class="secl-label">${o.label}</span>
                    <span class="secl-sub">${o.sub}</span>
                    ${disabled ? `<span class="secl-gain">${T('ui.lifeLack','寿元不足')}</span>` : `<span class="secl-gain">+${fmtNum(gain)}${T('ui.zhanli','战力')}</span>`}
                </button>
            `;
        }).join('');
        const allIn = p.lifespan || 0;
        const allInGain = Cultivate.previewSeclude(p, allIn);
        const allInDisabled = allIn <= 0;
        this.showModal({
            title: T('ui.secludeTitle','闭关潜修'),
            body: `<p style="line-height:1.7;margin-bottom:12px">${T('ui.secludeBody1', `闭关乃斩断尘缘、潜心悟道之法。闭关越久，战力增涨越多，但<b>每闭关一年，折损一年寿元</b>。当前寿元：<b style="color:#d4af37">${fmtNum(p.lifespan || 0)}年</b>。`)}</p>
                   <p style="color:#9a8e7a;font-size:12px;margin-bottom:18px">${T('ui.secludeBody2', `（寿元即闭关上限，无法闭关超过自身寿元；每突破大境界可增寿元。<b style="color:#c9a24a">注：修炼速率越高，闭关单位收益边际递减，极高境界时收益趋于封顶</b>）`)}</p>
                   <div class="seclusion-scroll-wrap">
                       <button class="seclusion-arrow seclusion-arrow-left" aria-label="${T('ui.slideLeft','向左滑动')}" onclick="document.getElementById('seclusionOptions').scrollBy({left:-170,behavior:'smooth'})">‹</button>
                       <div class="seclusion-options" id="seclusionOptions">${cards}</div>
                       <button class="seclusion-arrow seclusion-arrow-right" aria-label="${T('ui.slideRight','向右滑动')}" onclick="document.getElementById('seclusionOptions').scrollBy({left:170,behavior:'smooth'})">›</button>
                   </div>
                   <div class="seclusion-allin${allInDisabled ? ' disabled' : ''}" ${allInDisabled ? '' : `onclick="UI.secludeAction(${allIn})"`}>
                       <span class="secl-allin-label">${T('ui.exhaustLife','耗尽全部寿元')}</span>
                       <span class="secl-allin-gain">${allInDisabled ? T('ui.noLife','无寿元可用') : `+${fmtNum(allInGain)}${T('ui.zhanli','战力')} · ${fmtNum(allIn)}${T('ui.nian','年')}`}</span>
                   </div>`,
            footer: [
                { text: T('ui.close','关闭'), action: () => this.hideModal() }
            ]
        });
    },

    /* ---------- 悟性·顿悟 ---------- */
    openEnlighten() {
        const p = Game.player;
        if (!p) return;
        const lv = p.wuxingLevel || 0;
        const max = Cultivate.WUXING_MAX;
        if (lv >= max) {
            this.showModal({
                title: T('ui.enlightenTitle','顿悟 · 悟性'),
                body: T('ui.enlightenMax', `<p>悟性已臻化境（<b style="color:#d4af37">${max} 重</b>），无法再顿悟。</p>`),
                footer: [{ text: T('ui.close','关闭'), action: () => this.hideModal() }]
            });
            return;
        }
        const c = Cultivate.enlightenCosts(p);
        const tapNow = Math.round((Cultivate.wuxingTapMult(p) - 1) * 100);
        const rateNow = Math.round((Cultivate.wuxingRateMult(p) - 1) * 100);
        const tapNext = Math.round((Cultivate.wuxingTapMult({ wuxingLevel: lv + 1 }) - 1) * 100);
        const rateNext = Math.round((Cultivate.wuxingRateMult({ wuxingLevel: lv + 1 }) - 1) * 100);
        const canStone = p.stone >= c.stone;
        const canXiu = p.zhanli >= c.zhanli;
        const row = (label, costTxt, have, enough, type) => `
            <button class="enl-row${enough ? '' : ' disabled'}" ${enough ? `onclick="UI.doEnlighten('${type}')"` : 'disabled'}>
                <span class="enl-type">${label}</span>
                <span class="enl-cost">${T('ui.cost','耗 ')}${costTxt}</span>
                <span class="enl-have">${T('ui.hold','持有 ')}${fmtNum(have)}</span>
            </button>`;
        this.showModal({
            title: T('ui.enlightenTitle','顿悟 · 悟性'),
            body: `${T('ui.enlightenBody', `<p style="line-height:1.7;margin-bottom:10px">顿悟可永久提升<b>每次点击修炼的战力</b>，并小幅提升<b>修炼速率</b>。当前悟性 <b style="color:#d4af37">${lv} 重</b>（点击+${tapNow}% · 速率+${rateNow}%），顿悟后 → 点击+${tapNext}% · 速率+${rateNext}%。</p>`)}
                   <div class="enl-list">
                       ${row(T('ui.lingShi','灵石'), fmtNum(c.stone) + T('ui.lingShiUnit',' 灵石'), p.stone, canStone, 'stone')}
                       ${row(T('ui.zhanli','战力'), fmtNum(c.zhanli) + T('ui.zhanliUnit',' 战力'), p.zhanli, canXiu, 'zhanli')}
                   </div>
                   <p style="color:#9a8e7a;font-size:12px;margin-top:10px">${T('ui.enlightenTip','二选其一消耗即可顿悟一级。')}</p>`,
            footer: [{ text: T('ui.close','关闭'), action: () => this.hideModal() }]
        });
    },
    doEnlighten(type) {
        const r = Cultivate.enlighten(Game.player, type);
        if (r) {
            this.hideModal();
            this.openEnlighten();
            this.renderAll();
        }
    },

    /* ---------- 显示离线收益 ---------- */
    showOfflineReward(reward) {
        if (!reward || reward.zhanli <= 0) return;
        const hours = reward.time / 3600;
        const timeStr = hours >= 1 ? `${hours.toFixed(1)}${T('ui.hour','小时')}` : `${Math.floor(reward.time / 60)}${T('ui.minute','分钟')}`;
        this.showModal({
            title: T('ui.offlineTitle','离线修炼'),
            body: `<p>${T('ui.offlineBody','道友离线潜修')}${timeStr}${T('ui.offlineTail','，悟得：')}</p>
                   <p style="font-size:20px;color:#d4af37;margin:14px 0;text-align:center">${fmtNum(reward.zhanli)} ${T('ui.zhanli','战力')}</p>
                   <p style="color:#9a8e7a;font-size:12px;text-align:center">${T('ui.offlineNote','（离线修炼效率为在线50%）')}</p>`,
            footer: [{ text: T('ui.takeIt','收下'), type: 'primary', action: () => this.hideModal() }]
        });
    }
};
