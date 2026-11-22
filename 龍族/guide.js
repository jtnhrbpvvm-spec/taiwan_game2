(() => {
  const tabs=[...document.querySelectorAll('[data-platform]')];
  const isIos=/iPhone|iPad|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1);
  let platform=/Android/i.test(navigator.userAgent)?'android':'pc';
  function choose(value,updateUrl=false){
    platform=value;
    for(const tab of tabs){const active=tab.dataset.platform===value;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
    document.getElementById('platform-pc').hidden=value!=='pc';
    document.getElementById('platform-android').hidden=value!=='android';
    document.querySelectorAll('.pc-only').forEach(el=>el.hidden=value!=='pc');
    document.querySelectorAll('.android-only').forEach(el=>el.hidden=value!=='android');
    document.getElementById('pet-limit').textContent=value==='pc'?'5':'3';
    document.getElementById('demo-caption').textContent=value==='pc'?'桌面上的冒險隊伍':'手機上的冒險隊伍';
    document.getElementById('focus-demo').hidden=value!=='pc';
    document.getElementById('demo-stage').classList.remove('is-focus');
    document.getElementById('focus-demo').setAttribute('aria-pressed','false');
    document.getElementById('focus-demo').textContent='體驗專注模式';
    document.getElementById('demo-help').textContent=value==='pc'?'外觀跟隨角色的性別、膚色與裝備。點上方按鈕，看看只留下半透明娃娃的專注模式。':'手機桌寵外觀示意。安卓版可點一下開關遊戲、拖曳位置，或長按進入設定。';
    if(updateUrl){const url=new URL(location.href);url.searchParams.set('view',value);try{history.replaceState(null,'',url);}catch{}}
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>choose(tab.dataset.platform,true));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[next].focus();choose(tabs[next].dataset.platform,true);
    });
  });
  document.getElementById('ios-note').hidden=!isIos;
  document.getElementById('focus-demo').addEventListener('click',event=>{
    const active=document.getElementById('demo-stage').classList.toggle('is-focus');
    event.currentTarget.setAttribute('aria-pressed',String(active));
    event.currentTarget.textContent=active?'恢復一般模式':'體驗專注模式';
    document.getElementById('demo-help').textContent=active?'專注模式示意：隱藏角色名稱與飄字，只保留 50% 半透明娃娃。真正的桌寵可用 Ctrl＋Alt＋P 解除。':'外觀跟隨角色的性別、膚色與裝備。點上方按鈕，看看只留下半透明娃娃的專注模式。';
  });
  choose(platform);
  if(isIos)window.alert('蘋果系統不支援：龍族桌寵目前僅提供 Windows 電腦版與 Android 安卓版，尚不支援 iPhone、iPad（iOS／iPadOS）。');
})();
