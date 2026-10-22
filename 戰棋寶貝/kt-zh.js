javascript:(function ktZh() {
  /*
   * 關東戰術 Kanto Tactics 繁體中文書籤
   * 遊戲：https://einoow.com/playables/kanto-tactics/（外框頁 einoow.com/kanto-tactics/ 用 iframe 開它，兩邊都能用）
   *
   * 遊戲本身有簡體中文，這支把畫面上的簡體字即時換成台灣正體：
   *   1. 遊戲語言切到中文（kt-lang = zh）
   *   2. 頁面文字、title / placeholder / aria-label、canvas 畫的字、alert / confirm 都換
   *   3. 中文字型換成 Noto Sans TC（遊戲內建的是簡體子集字型，繁體字會缺）
   *
   * 遊戲的 CSP 不准載入外部程式，所以書籤是整份貼進網址欄，不能用 import(網址)。
   * 字表 D 由 tools/build_zh.py 從爬下來的遊戲資料產生（OpenCC s2twp），不要手改，改 build_zh.py 的 FIX 再重跑。
   * 書籤規則：只能用區塊註解、每句加分號、百分比符號後面不能接兩個十六進位字元。
   */
  var VERSION = 'V1';
  var D = /*DICT*/"万与专业丛东丝丢两个丰临为丽举么义乐乔习买乱争于亏云产亲仅从仓仪们价优伙会传伤体余侧储儿兑兰关养兽内册写军农冲决冻净准减凑几凯击划则刚创删别剂剑剧办务动励劲势区医华单卖占卫却厂厅历压参双发变叠台叶号后吓吗听启员响唤喷团园围国图圆圣场坏垒墙壮声壳处备复够头夹夺奖妈学宝实宽宾对寻导将尔尘尝尽层属岛岩币师带帧帮并庆库应开异弃张弯弹强归当录彻径忆态总恶悬惊惧惩愤愿戏战扑扩扫扬扰抢护报担拟拥择挂挡挤挥损换据掴掷携摆摇摊撑攒敌数斗斩断无旧时昵显晋晓晕暂术朴机杀杂权条来杰极构枪柜标栏树样档桥梦检棱楼横樱欢残气汇汉污汤没泼洁洒洼浅浊测济浏涂涡渐温游溅滚满潜濒灭灵点炼烛烟烧烫热焕爱状独狮狱猎猫献玛环现电画畅疗疯痹盐盘着矿码础确礼祷离种积称稳竖笔笼筛签简篮类紧红约级纪纯纱纹线练组绅细终绊经绑结绘给络绝统继绩续维绿缓编缘缚缝缠缩网罗罚羁职联胀胜脑脚脱脸腾节范荐荣药莲获营葱蓝虚虫蚀蛮蜡衅补袭装见观规视览觉触计认让训记讲讶许讽设访证评诅识诉试话诞该详语误说请诺读谁调谢贝负责败账货贪购贯贵贷费资赌赚赛赢赶跃践踪车轨转轮轻载较辅输边达过运还这进远连迹适选递遗邮邻采释里鉴针钓钟钥钩钮钱钳钻铁铂铃铜银链销锁锋锐错锤锥键镇镖镜镰长门闪闭问闯间阅队阵阶际险随隐难雳雾静韩页顶项顺须顽顾顿预领频颗题颜额风飞饭饰饵馆马驯驰驱验骤鱼鲁鲤鳞鸟鸡鸦鸭鹰黄齐龄龙龟|萬與專業叢東絲丟兩個豐臨為麗舉麼義樂喬習買亂爭於虧雲產親僅從倉儀們價優夥會傳傷體餘側儲兒兌蘭關養獸內冊寫軍農衝決凍淨準減湊幾凱擊劃則剛創刪別劑劍劇辦務動勵勁勢區醫華單賣佔衛卻廠廳歷壓參雙發變疊臺葉號後嚇嗎聽啟員響喚噴團園圍國圖圓聖場壞壘牆壯聲殼處備復夠頭夾奪獎媽學寶實寬賓對尋導將爾塵嘗盡層屬島巖幣師帶幀幫並慶庫應開異棄張彎彈強歸當錄徹徑憶態總惡懸驚懼懲憤願戲戰撲擴掃揚擾搶護報擔擬擁擇掛擋擠揮損換據摑擲攜擺搖攤撐攢敵數鬥斬斷無舊時暱顯晉曉暈暫術樸機殺雜權條來傑極構槍櫃標欄樹樣檔橋夢檢稜樓橫櫻歡殘氣匯漢汙湯沒潑潔灑窪淺濁測濟瀏塗渦漸溫遊濺滾滿潛瀕滅靈點煉燭煙燒燙熱煥愛狀獨獅獄獵貓獻瑪環現電畫暢療瘋痺鹽盤著礦碼礎確禮禱離種積稱穩豎筆籠篩籤簡籃類緊紅約級紀純紗紋線練組紳細終絆經綁結繪給絡絕統繼績續維綠緩編緣縛縫纏縮網羅罰羈職聯脹勝腦腳脫臉騰節範薦榮藥蓮獲營蔥藍虛蟲蝕蠻蠟釁補襲裝見觀規視覽覺觸計認讓訓記講訝許諷設訪證評詛識訴試話誕該詳語誤說請諾讀誰調謝貝負責敗賬貨貪購貫貴貸費資賭賺賽贏趕躍踐蹤車軌轉輪輕載較輔輸邊達過運還這進遠連跡適選遞遺郵鄰採釋裡鑑針釣鍾鑰鉤鈕錢鉗鑽鐵鉑鈴銅銀鏈銷鎖鋒銳錯錘錐鍵鎮鏢鏡鐮長門閃閉問闖間閱隊陣階際險隨隱難靂霧靜韓頁頂項順須頑顧頓預領頻顆題顏額風飛飯飾餌館馬馴馳驅驗驟魚魯鯉鱗鳥雞鴉鴨鷹黃齊齡龍龜|一目了然=一目瞭然;稳扎稳打=穩紮穩打;统计数据=統計資料;一分钟=一分鐘;几分钟=幾分鐘;制作人=製作人;复制品=複製品;意大利=義大利;服务器=伺服器;自行车=自行車;一只=一隻;一周=一週;三只=三隻;上周=上週;上游=上游;两只=兩隻;了然=瞭然;了解=瞭解;代码=代碼;保存=儲存;信号=訊號;信息=資訊;修复=修復;克制=剋制;关系=關係;内置=內建;冲洗=沖洗;几率=機率;分区=分區;分钟=分鐘;创建=建立;制作=製作;制品=製品;制图=製圖;制成=製成;刷新=刷新;加载=載入;发布=發布;发送=傳送;周三=週三;回响=迴響;回复=回復;回归=迴歸;回避=迴避;图像=影像;图标=圖示;在线=線上;复制=複製;多只=多隻;天后=天後;奔驰=奔馳;奖杯=獎盃;委托=委託;字体=字型;实时=即時;尽量=儘量;屏幕=螢幕;屏蔽=封鎖;岩石=岩石;席卷=席捲;并发=併發;性能=效能;战斗=戰鬥;打开=開啟;托付=託付;扩展=擴充套件;拉杆=拉桿;挨打=挨打;搜索=搜尋;支持=支援;数据=資料;文件=檔案;显卡=顯示卡;本周=本週;松绑=鬆綁;查看=檢視;标志=標誌;格斗=格鬥;概率=機率;每只=每隻;每周=每週;毛发=毛髮;汇总=彙總;注册=註冊;注明=註明;消息=訊息;添加=新增;激活=啟用;点击=點擊;用于=用於;界面=介面;登录=登入;硬件=硬體;社区=社群;稳扎=穩紮;窗口=視窗;类型=類型;组件=組件;绑定=綁定;绘制=繪製;缩进=縮進;网络=網路;舍身=捨身;菜单=選單;设备=裝置;设置=設定;运行=執行;这只=這隻;远程=遠端;连接=連線;那只=那隻;重复=重複;钟摆=鐘擺;链接=連結;镜像=鏡像;队列=佇列;防御=防禦;项目=專案;高级=高級;默认=預設;鼠标=滑鼠"/*END*/;

  var top = window;
  if (top.__ktZh) { top.__ktZh.toast('繁體中文已經在運作（' + VERSION + '）'); return; }

  /* ---------- 簡轉繁 ---------- */
  var parts = D.split('|');
  var MAP = new Map(), HEAD = new Set(), MAXLEN = 1;
  for (var i = 0; i < parts[0].length; i++) MAP.set(parts[0][i], parts[1][i]);
  parts[2].split(';').forEach(function (e) {
    var k = e.split('=');
    if (!k[0]) return;
    MAP.set(k[0], k[1]);
    HEAD.add(k[0][0]);
    if (k[0].length > MAXLEN) MAXLEN = k[0].length;
  });
  var HAS_CJK = /[㐀-鿿豈-﫿]/;
  var CACHE = new Map();

  function conv(s) {
    if (typeof s !== 'string' || !HAS_CJK.test(s)) return s;
    var hit = CACHE.get(s);
    if (hit !== undefined) return hit;
    var out = '', n = s.length, j = 0;
    while (j < n) {
      var c = s[j], done = false;
      if (HEAD.has(c)) {
        for (var L = Math.min(MAXLEN, n - j); L > 1; L--) {
          var v = MAP.get(s.substr(j, L));
          if (v !== undefined) { out += v; j += L; done = true; break; }
        }
      }
      if (done) continue;
      var t = MAP.get(c);
      out += t === undefined ? c : t;
      j++;
    }
    /* 數字後面的「只」是量詞：3只 → 3隻 */
    out = out.replace(/([0-9０-９])只/g, '$1隻');
    if (CACHE.size > 20000) CACHE.clear();
    CACHE.set(s, out);
    return out;
  }

  /* ---------- 套到一個視窗（本頁或同網域的 iframe） ---------- */
  var ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var FONT_CSS = 'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700&display=swap';

  function install(w) {
    var doc = w.document;
    if (w.__ktZhOn) return;
    w.__ktZhOn = true;
    var html = doc.documentElement;

    function active() { return /^zh/i.test(html.lang || ''); }

    function fixText(node) {
      var v = node.nodeValue, c = conv(v);
      if (c !== v) node.nodeValue = c;
    }
    function fixAttr(el, a) {
      var v = el.getAttribute(a);
      if (v) { var c = conv(v); if (c !== v) el.setAttribute(a, c); }
    }
    function fixEl(el) {
      if (SKIP[el.nodeName] || el.isContentEditable) return;
      for (var k = 0; k < ATTRS.length; k++) if (el.hasAttribute(ATTRS[k])) fixAttr(el, ATTRS[k]);
      var walker = doc.createTreeWalker(el, 5 /* 元素＋文字 */, null);
      var n;
      while ((n = walker.nextNode())) {
        if (n.nodeType === 3) {
          var p = n.parentNode;
          if (!p || !SKIP[p.nodeName]) fixText(n);
        } else if (!SKIP[n.nodeName]) {
          for (var a = 0; a < ATTRS.length; a++) if (n.hasAttribute(ATTRS[a])) fixAttr(n, ATTRS[a]);
        }
      }
    }
    function fixAll() { if (active()) fixEl(html); }

    var wasActive = false;
    var mo = new w.MutationObserver(function (list) {
      fixHtmlLang();
      fixFontStyle();
      if (!active()) { wasActive = false; return; }
      /* 剛切到中文：整頁掃一次 */
      if (!wasActive) { wasActive = true; fixEl(html); return; }
      for (var k = 0; k < list.length; k++) {
        var m = list[k];
        if (m.type === 'characterData') {
          var p = m.target.parentNode;
          if (!p || !SKIP[p.nodeName]) fixText(m.target);
        } else if (m.type === 'attributes') {
          if (ATTRS.indexOf(m.attributeName) >= 0) fixAttr(m.target, m.attributeName);
        } else {
          for (var a = 0; a < m.addedNodes.length; a++) {
            var nd = m.addedNodes[a];
            if (nd.nodeType === 3) { if (!SKIP[m.target.nodeName]) fixText(nd); }
            else if (nd.nodeType === 1) fixEl(nd);
          }
        }
      }
    });
    mo.observe(html, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS.concat(['lang']) });

    /* 遊戲會把 html lang 設成 zh-Hans；改成 zh-Hant，瀏覽器才會挑繁體字形 */
    function fixHtmlLang() {
      if (html.lang === 'zh-Hans') html.lang = 'zh-Hant';
    }

    /* 字型：遊戲用 Fredoka 這個字型名稱＋unicode-range 掛簡體子集（style 的 id 是 kt-font-zh）。
       清空它（留著元素，遊戲才不會再塞一次），改把 Noto Sans TC 掛到同一個字型名稱上。 */
    var fontRules = null;
    function fixFontStyle() {
      var st = doc.getElementById('kt-font-zh');
      if (st && fontRules && st.textContent !== fontRules) st.textContent = fontRules;
    }
    function loadFont() {
      var link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.crossOrigin = 'anonymous';
      link.href = FONT_CSS;
      link.onload = function () {
        try {
          var css = '';
          var rules = link.sheet.cssRules;
          for (var k = 0; k < rules.length; k++) {
            var r = rules[k];
            if (!r.style || !r.style.getPropertyValue('src')) continue;
            var wt = r.style.getPropertyValue('font-weight') === '700' ? '700 900' : '400 600';
            css += '@font-face{font-family:\'Fredoka\';font-style:normal;font-weight:' + wt + ';font-display:swap;src:' +
              r.style.getPropertyValue('src') + ';unicode-range:' + (r.style.getPropertyValue('unicode-range') || 'U+4E00-9FFF') + ';}';
          }
          if (css) { fontRules = css; fixFontStyle(); }
        } catch (e) { /* 讀不到就算了，繁體字會用系統字型 */ }
      };
      (doc.head || html).appendChild(link);
      var st = doc.createElement('style');
      st.textContent = ':lang(zh-Hant){line-break:strict}';
      (doc.head || html).appendChild(st);
    }

    /* canvas 畫的字（分享圖、場上小招牌） */
    [w.CanvasRenderingContext2D, w.OffscreenCanvasRenderingContext2D].forEach(function (C) {
      if (!C) return;
      ['fillText', 'strokeText', 'measureText'].forEach(function (f) {
        var orig = C.prototype[f];
        if (!orig || orig.__ktZh) return;
        var wrap = function (s) {
          if (typeof s === 'string' && active()) { var a = Array.prototype.slice.call(arguments); a[0] = conv(s); return orig.apply(this, a); }
          return orig.apply(this, arguments);
        };
        wrap.__ktZh = true;
        C.prototype[f] = wrap;
      });
    });

    /* 跳出來的對話框 */
    ['alert', 'confirm', 'prompt'].forEach(function (f) {
      var orig = w[f];
      if (!orig || orig.__ktZh) return;
      var wrap = function (s) {
        var a = Array.prototype.slice.call(arguments);
        if (active()) a[0] = conv(s);
        return orig.apply(w, a);
      };
      wrap.__ktZh = true;
      w[f] = wrap;
    });

    /* 遊戲語言切到中文 */
    function toZh() {
      try { w.localStorage.setItem('kt-lang', 'zh'); } catch (e) {}
      if (active() || doc.readyState === 'loading') return;
      /* iframe 裡的遊戲：import 會載到外層的另一份模組，改用重新載入 */
      if (w !== top) {
        if (!top.__ktZhReloaded) { top.__ktZhReloaded = true; w.location.reload(); }
        return;
      }
      var pre = doc.querySelector('link[rel="modulepreload"][href*="/lang-"]');
      if (!pre) return;
      import(pre.href).then(function (mod) {
        for (var k in mod) {
          var s = mod[k];
          if (s && typeof s.getState === 'function') {
            var st = s.getState();
            if (st && typeof st.setLang === 'function') { st.setLang('zh'); return; }
          }
        }
      }).catch(function () {});
    }

    fixHtmlLang();
    loadFont();
    toZh();
    fixAll();
  }

  /* ---------- 小提示 ---------- */
  function toast(msg) {
    var doc = top.document;
    var box = doc.createElement('div');
    box.textContent = msg;
    box.style.cssText = 'position:fixed;left:0;right:0;top:12px;margin:0 auto;width:max-content;max-width:90vw;' +
      'z-index:2147483647;background:rgba(20,26,51,.92);color:rgb(255,255,255);padding:8px 16px;border-radius:10px;' +
      'font:600 15px system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4);pointer-events:none;transition:opacity .4s';
    (doc.body || doc.documentElement).appendChild(box);
    setTimeout(function () { box.style.opacity = '0'; }, 2200);
    setTimeout(function () { box.remove(); }, 2800);
  }

  /* ---------- 開始 ---------- */
  function scan() {
    install(top);
    var frames = top.document.querySelectorAll('iframe');
    for (var k = 0; k < frames.length; k++) {
      try {
        var fw = frames[k].contentWindow;
        if (fw && fw.document && fw.document.documentElement) install(fw);
      } catch (e) { /* 別的網域，碰不到 */ }
    }
  }
  top.__ktZh = { version: VERSION, conv: conv, toast: toast };
  scan();
  /* 外框頁的 iframe 可能晚點才出現、或遊戲自己重新載入，定時補裝 */
  setInterval(scan, 2000);
  toast('關東戰術 繁體中文 ' + VERSION + ' 已啟用');
})();
