

// ════════════════════════════════════════════════
//  🔽 上方版本選單（網頁版 / 單機版 / 加掛版）：點按鈕才展開對應的匯入/匯出項目
// ════════════════════════════════════════════════
function closeTopMenus(){
  document.querySelectorAll('.menu-pop.show').forEach(el => el.classList.remove('show'));
}
function toggleTopMenu(id, btn){
  const pop = document.getElementById('menu-' + id);
  if(!pop) return;
  const willShow = !pop.classList.contains('show');
  closeTopMenus();
  if(willShow) pop.classList.add('show');
}
// 點選單以外的地方就收起
document.addEventListener('click', function(e){
  if(!e.target.closest('.menu-wrap')) closeTopMenus();
});