/* ============================================================
   天下無雙放置版 — 登入／選角背景音樂
   規則：
     1. 網頁內容優先。音樂等到 window load（版面、圖片、其他 script 都跑完）
        之後才開始下載，之後邊下載邊播放（串流），不阻擋畫面。
     2. 登入畫面開始播放，角色選擇／創角畫面持續播放（循環）。
     3. 進入遊戲（lobby 隱藏）時淡出停止，之後不再自動播放。
   瀏覽器自動播放政策：第一次 play() 若被擋下，改在使用者第一次
   點擊／按鍵時再播（登入畫面本來就要點一下才會進角色選擇）。
   ============================================================ */
(function(){
  'use strict';

  const SRC = '音樂/登入音樂.mp3';
  const VOL_KEY = 'txws_login_bgm_volume';
  const DEFAULT_VOL = 0.5;
  const FADE_MS = 900;

  let audio = null;
  let volume = DEFAULT_VOL;
  let wanted = false;     // 目前是否「應該」在播
  let stopped = false;    // 已進入遊戲，之後不再自動播
  let armed = false;      // 是否已掛上「等使用者互動」的補播監聽
  let fadeTimer = 0;

  try {
    const v = parseFloat(localStorage.getItem(VOL_KEY));
    if (v >= 0 && v <= 1) volume = v;
  } catch(e){}

  /* 等網頁內容全部載入完才開始抓音樂，避免跟畫面資源搶頻寬 */
  function whenPageReady(fn){
    if (document.readyState === 'complete') { defer(fn); return; }
    window.addEventListener('load', () => defer(fn), { once:true });
  }
  function defer(fn){
    if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, { timeout:1500 });
    else setTimeout(fn, 0);
  }

  function ensureAudio(){
    if (audio) return audio;
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';     // 串流：載到可播的片段就開始播，其餘持續下載
    audio.volume = volume;
    audio.src = SRC;
    audio.addEventListener('error', () => { /* 檔案不存在就安靜放棄 */ }, { once:true });
    audio.load();
    return audio;
  }

  function tryPlay(){
    if (!wanted || stopped) return;
    const a = ensureAudio();
    const p = a.play();
    if (p && typeof p.catch === 'function') p.catch(() => armUserGesture());
  }

  /* 被自動播放政策擋下 → 等使用者第一次互動再播 */
  function armUserGesture(){
    if (armed || stopped) return;
    armed = true;
    const go = () => {
      disarm();
      if (!wanted || stopped) return;
      const a = ensureAudio();
      a.play().catch(() => {});
    };
    ['pointerdown','keydown','touchstart'].forEach(ev =>
      document.addEventListener(ev, go, { once:true, capture:true, passive:true }));
    function disarm(){
      armed = false;
      ['pointerdown','keydown','touchstart'].forEach(ev =>
        document.removeEventListener(ev, go, true));
    }
    armUserGesture.disarm = disarm;
  }

  function start(){
    if (stopped) return;
    wanted = true;
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = 0; }
    if (audio) { audio.volume = volume; tryPlay(); return; }
    whenPageReady(tryPlay);
  }

  /* 進入遊戲：淡出後釋放 */
  function stop(){
    wanted = false;
    stopped = true;
    if (typeof armUserGesture.disarm === 'function') armUserGesture.disarm();
    const a = audio;
    audio = null;
    if (!a) return;
    if (fadeTimer) clearInterval(fadeTimer);
    const step = 50, dec = a.volume / Math.max(1, FADE_MS / step);
    fadeTimer = setInterval(() => {
      a.volume = Math.max(0, a.volume - dec);
      if (a.volume <= 0.001) {
        clearInterval(fadeTimer); fadeTimer = 0;
        try { a.pause(); a.removeAttribute('src'); a.load(); } catch(e){}
      }
    }, step);
  }

  function setVolume(v){
    v = Math.min(1, Math.max(0, Number(v) || 0));
    volume = v;
    if (audio) audio.volume = v;
    try { localStorage.setItem(VOL_KEY, String(v)); } catch(e){}
  }

  window.TXWSLoginBGM = {
    start, stop, setVolume,
    get volume(){ return volume; },
    get playing(){ return !!(audio && !audio.paused); }
  };
})();
