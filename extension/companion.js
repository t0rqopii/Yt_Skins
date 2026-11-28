/* Shared companion controller for YouTube and the live preview. */
(function(root){
  'use strict';
  function create(doc,win=doc.defaultView) {
    let host,image,button,timer,settings;
    const fallback='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><ellipse cx="60" cy="105" rx="34" ry="7" fill="#000" opacity=".2"/><path d="M23 46Q20 26 36 20L48 30Q60 25 72 30L84 20Q100 26 97 46L100 77Q98 101 60 101Q22 101 20 77Z" fill="#e7edf5" stroke="#344258" stroke-width="4"/><rect x="32" y="43" width="56" height="37" rx="16" fill="#26364d"/><ellipse cx="46" cy="60" rx="4" ry="7" fill="#adcaff"/><ellipse cx="74" cy="60" rx="4" ry="7" fill="#adcaff"/><path d="M54 73Q60 77 66 73" fill="none" stroke="#adcaff" stroke-width="2" stroke-linecap="round"/></svg>');
    function wink(){if(!host)return;clearTimeout(timer);host.dataset.winking='true';if(settings.companionWink)image.src=settings.companionWink;else image.classList.add('blink');timer=setTimeout(()=>{if(!host)return;image.src=settings.companionImage || fallback;image.classList.remove('blink');delete host.dataset.winking;},350);}
    function update(s){
      settings=s;
      if(!s.enabled || !s.companionEnabled){host?.remove();host=image=button=null;clearTimeout(timer);return;}
      if(!host){
        host=doc.createElement('div');host.id='yts-companion';host.setAttribute('aria-label','Theme companion');
        const shadow=host.attachShadow({mode:'open'}),style=doc.createElement('style');
        style.textContent=':host{all:initial;display:block!important;position:fixed!important;z-index:2147483000!important;pointer-events:none!important}button{box-sizing:border-box;display:block;width:100%;padding:0;border:0;background:transparent;cursor:pointer;pointer-events:auto;line-height:0}button:focus-visible{outline:2px solid #abcaff;outline-offset:4px;border-radius:12px}img{display:block;width:100%;max-height:40vh;object-fit:contain;filter:drop-shadow(0 6px 9px #0003)}img.blink{transform:scaleY(.7)}@media(prefers-reduced-motion:reduce){img.blink{transform:none;opacity:.6}}';
        button=doc.createElement('button');button.type='button';button.setAttribute('aria-label','Wink companion');button.title='Click to wink';image=doc.createElement('img');image.alt='';image.draggable=false;
        image.addEventListener('error',()=>{if(image && image.src!==fallback)image.src=fallback;});
        button.append(image);shadow.append(style,button);button.addEventListener('click',wink);
      }
      const parent=doc.body || doc.documentElement;if(parent && host.parentNode!==parent)parent.appendChild(host);
      host.style.cssText=`${s.companionSide}:12px;${s.companionSide==='left'?'right':'left'}:auto;bottom:clamp(12px,${s.companionOffset}vh,calc(100vh - ${s.companionSize}px - 12px));width:min(${s.companionSize}px,35vw);`;
      if(!host.dataset.winking && image.getAttribute('src')!==(s.companionImage || fallback))image.src=s.companionImage || fallback;
    }
    const refresh=()=>{if(settings)update(settings);};
    doc.addEventListener('DOMContentLoaded',refresh);doc.addEventListener('yt-navigate-finish',refresh);
    const observer=win?.MutationObserver?new win.MutationObserver(()=>{if(settings?.companionEnabled && host && !host.isConnected)refresh();}):null;
    if(doc.documentElement)observer?.observe(doc.documentElement,{childList:true,subtree:true});
    return {update,wink,destroy(){clearTimeout(timer);observer?.disconnect();doc.removeEventListener('DOMContentLoaded',refresh);doc.removeEventListener('yt-navigate-finish',refresh);host?.remove();host=null;}};
  }
  root.ThemeCompanion={create};
  if(typeof module!=='undefined' && module.exports)module.exports={create};
  if(typeof ThemeState!=='undefined' && typeof document!=='undefined'){const instance=create(document,typeof window==='undefined'?null:window);ThemeState.subscribe((state,keys)=>{if(keys.includes('theme'))instance.update(state.theme);});}
})(globalThis);
