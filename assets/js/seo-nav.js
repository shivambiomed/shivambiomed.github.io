(function(){
  const body=document.body, drawer=document.getElementById('mltDrawer'), overlay=document.getElementById('mltDrawerOverlay'), open=document.getElementById('mltMenuButton'), close=document.getElementById('mltDrawerClose');
  if(!drawer||!overlay||!open)return;
  function closeMenu(){body.classList.remove('mlt-menu-open');open.classList.remove('open');open.setAttribute('aria-expanded','false');drawer.setAttribute('aria-hidden','true');overlay.setAttribute('aria-hidden','true');}
  function toggle(){if(body.classList.contains('mlt-menu-open'))closeMenu();else{body.classList.add('mlt-menu-open');open.classList.add('open');open.setAttribute('aria-expanded','true');drawer.setAttribute('aria-hidden','false');overlay.setAttribute('aria-hidden','false');}}
  open.addEventListener('click',toggle); overlay.addEventListener('click',closeMenu); if(close)close.addEventListener('click',closeMenu); drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
})();