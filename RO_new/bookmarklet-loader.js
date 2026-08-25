(function () {
  var STYLE_ID = 'ro-idle-mobile-ui-style';
  var CSS_URL  = 'https://raw.githubusercontent.com/nba9001-sys/ro-idle/main/css/mobile-ui.css';

  var existing = document.getElementById(STYLE_ID);
  if (existing) {
    existing.remove();
    console.log('[RO 手機化] 已關閉');
    return;
  }

  // no-store + 時間戳參數：強制略過瀏覽器快取，確保每次點擊都拿到 GitHub 上的最新版本
  fetch(CSS_URL + '?v=' + Date.now(), { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (css) {
      var style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
      console.log('[RO 手機化] 已套用，再點一次書籤可關閉');
    })
    .catch(function (err) {
      alert('手機化介面載入失敗：' + err.message);
    });
})();
