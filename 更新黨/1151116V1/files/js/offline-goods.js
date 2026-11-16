// 免費離線單機用的普通 NPC 商品；沒有商城、鑽石或付款流程。
export const OFFLINE_GOODS = [
    [49970, '閃亮封號', 'title'],
    [49971, '名字光環', 'halo'],
    [49972, '更名卡', 'rename'],
    [49922, '贖罪聖書', 'lawful'],
    [49142, '回憶蠟燭', 'candle'],
    [49974, '高級魔法娃娃的盒子', 'box'],
    [49975, '高級魔法娃娃的盒子×11', 'boxes'],
    [49976, '全服喇叭（離線廣播）', 'horns'],
    [49977, '豪華喇叭（離線廣播）', 'horn'],
    [49978, '月卡（購買即永久無限背包／負重）', 'capacity'],
];

export function installOfflineGoods(Server) {
    const p = Server.prototype;
    const add = p.addMissingItems;
    p.addMissingItems = function () {
        add.call(this);
        for (const [id, name] of OFFLINE_GOODS) {
            if (this.data.itemsById.has(id)) continue;
            this.data.itemsById.set(id, { nid: name, name,
                tpl: { id, k: 'e', type: 'other', use: 'normal', w: 0, ig: 34 } });
        }
    };
    const list = p.getShopBuyList;
    p.getShopBuyList = function (objId) {
        const rows = list.call(this, objId);
        const npc = this.objs.get(objId) || this.mapNpcs.find(n => n.id === objId);
        if (!npc || !/^萬物(?:百貨|販售)商(?:\||$)/.test(npc.key || npc.name || '')) return rows;
        const ids = new Set(OFFLINE_GOODS.map(g => g[0]));
        const out = rows.filter(r => !ids.has(r.itemId));
        for (const [itemId, name, kind] of OFFLINE_GOODS) out.push({ itemId, name: name + (kind === 'horns' ? ' ×10' : ''), price: 10000, packCount: kind === 'horns' ? 10 : 1,
            gfx: this.data.itemsById.get(itemId)?.tpl.ig || 34, st: null });
        return out.map((r, order) => ({ ...r, order }));
    };
    const give = p.giveItem;
    p.giveItem = function (id, count = 1, ...args) {
        if (id !== 49978 || !this.curChar) return give.call(this, id, count, ...args);
        this.curChar.unlimitedInventory = true;
        this.sendMonthCard();
        this.sendOwnStatus();
        this.sysMsg('此角色已永久開啟背包格數無上限及無限負重。');
        this.save();
        return null;
    };
    const use = p.useItem;
    p.useItem = function (objId, extraFn) {
        const ch = this.curChar, it = ch?.inv.find(i => i.id === objId);
        const row = it && OFFLINE_GOODS.find(g => g[0] === it.itemId);
        if (!row || row[2] === 'candle') return use.call(this, objId, extraFn);
        const kind = row[2];
        if (kind === 'capacity' && ch.unlimitedInventory) {
            this.sysMsg('此角色已永久開啟無限背包與無限負重，不會消耗月卡。'); return;
        }
        if (kind === 'rename') {
            const name = window.prompt('新的角色名字（2～10 個字）', ch.name);
            if (name == null) return;
            const clean = name.trim();
            if (!/^[\p{L}\p{N}_]{2,10}$/u.test(clean) || this.state.chars.some(c => c !== ch && c.name === clean)) {
                this.sysMsg('名字需為 2～10 個中英文字、數字或底線，且不能與其他角色重複。'); return;
            }
            ch.name = clean;
            this.sendMapAndSelf();
            this.emit('offlineRename', { name: clean });
        } else if (kind === 'horn' || kind === 'horns') {
            const text = window.prompt('離線廣播（僅本機顯示，最多 120 字）', '');
            if (!text?.trim()) return;
            this.sysMsg('【' + (kind === 'horn' ? '豪華廣播' : '離線廣播') + '】' + ch.name + '：' + text.trim().slice(0, 120));
            if (kind === 'horn') this.emit('effect', { id: ch.id, gfx: 750 });
        } else if (kind === 'title' || kind === 'halo') {
            ch.offlineLooks ||= {};
            ch.offlineLooks[kind] = Math.max(Date.now(), ch.offlineLooks[kind] || 0) + 30 * 86400000;
            if (kind === 'title' && !ch.title) { ch.title = '閃亮封號'; this.sendMapAndSelf(); }
        } else if (kind === 'lawful') {
            if ((ch.lawful || 0) >= 32767) { this.sysMsg('正義值已滿，不會消耗贖罪聖書。'); return; }
            ch.lawful = Math.min(32767, (ch.lawful || 0) + 3000);
        } else if (kind === 'box' || kind === 'boxes') {
            ch.dolls ||= { bag: 0, box: 0, bag2: 0, worn: 0, own: {}, seen: [] };
            ch.dolls.box = (ch.dolls.box || 0) + (kind === 'boxes' ? 11 : 1);
            this.sendDolls();
            this.sysMsg('高級魔法娃娃的盒子已加入娃娃視窗，可在該視窗開啟。');
        } else if (kind === 'capacity') {
            ch.unlimitedInventory = true;
            this.sendMonthCard();
            this.sysMsg('此角色已永久開啟背包格數無上限及無限負重。');
        }
        this.consumeItem(it.id, 1);
        this.sendOwnStatus();
        this.save();
    };
    const status = p.sendOwnStatus;
    p.sendOwnStatus = function () {
        status.call(this);
        if (!this.curChar) return;
        const ch = this.curChar, looks = ch.offlineLooks || {}, now = Date.now();
        this.emit('offlineAppearance', new Map([[ch.id, (looks.title > now ? 1 : 0) | (looks.halo > now ? 2 : 0)]]));
    };
}
