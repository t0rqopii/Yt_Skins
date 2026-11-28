/* Optional, local-only pop-out search for YouTube. */
(function (root) {
  'use strict';
  function create(doc, win, options = {}) {
    let settings = {}, dialog, sheet, input, lastFocus;
    const css = `
#yts-quick-search{box-sizing:border-box;position:fixed;inset:0 0 auto;margin:min(18vh,150px) auto 0;width:min(620px,calc(100vw - 32px));max-width:none;max-height:none;padding:0;border:0;border-radius:22px;background:transparent;overflow:visible;box-shadow:0 24px 80px rgba(0,0,0,.28);color:var(--yts-search-text);animation:yts-search-in 160ms cubic-bezier(.2,.8,.2,1) both}
#yts-quick-search::backdrop{background:rgba(0,0,0,var(--yts-search-dim));backdrop-filter:brightness(var(--yts-search-brightness));-webkit-backdrop-filter:brightness(var(--yts-search-brightness))}
@keyframes yts-search-in{from{opacity:0;transform:translateY(-8px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(prefers-reduced-motion:reduce){#yts-quick-search{animation:none}}
`;
    const innerCss = `
:host{color:var(--yts-search-text);font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}.panel{border:1px solid rgba(128,128,128,.23);border-radius:22px;background:var(--yts-search-panel);box-shadow:inset 0 1px 0 rgba(255,255,255,.34);overflow:hidden}
@supports(backdrop-filter:blur(1px)){.panel{backdrop-filter:blur(24px) saturate(160%);-webkit-backdrop-filter:blur(24px) saturate(160%)}}
form{display:flex;align-items:center;gap:14px;padding:18px 20px}.icon{width:22px;height:22px;flex:none;color:var(--yts-search-accent)}input{min-width:0;flex:1;border:0;outline:0;background:transparent;color:inherit;font:500 20px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}input::placeholder{color:var(--yts-search-muted);opacity:1}button{font:inherit;cursor:pointer}button:focus-visible{outline:2px solid var(--yts-search-accent);outline-offset:3px}.panel:focus-within{border-color:var(--yts-search-accent)}.submit{border:0;border-radius:11px;background:var(--yts-search-accent);color:var(--yts-search-action-text);font-weight:650;padding:9px 14px}.close{border:0;background:transparent;color:var(--yts-search-muted);font-size:24px;line-height:1;padding:1px 4px}.hint{border-top:1px solid rgba(128,128,128,.18);padding:9px 20px;color:var(--yts-search-muted);font-size:12px}.hint span{float:right}
@media(max-width:480px){form{padding:15px;gap:10px}input{font-size:17px}.hint{padding:8px 15px}.hint span{display:none}}
`;
    function setAppearance() {
      if (!dialog) return;
      const fill = settings.searchBackground || settings.surface;
      const color = /^#[0-9a-f]{6}$/i.test(fill || '') ? fill : '#202020';
      const rgb = [1,3,5].map(i => parseInt(color.slice(i,i+2),16)).join(',');
      dialog.style.setProperty('--yts-search-panel', `rgba(${rgb},${settings.searchGlassOpacity / 100})`);
      dialog.style.setProperty('--yts-search-text', settings.searchText || settings.text);
      dialog.style.setProperty('--yts-search-muted', settings.muted);
      const accent = /^#[0-9a-f]{6}$/i.test(settings.accent || '') ? settings.accent : '#ff7066';
      const luminance = [1,3,5].map(i => parseInt(accent.slice(i,i+2),16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i],0);
      dialog.style.setProperty('--yts-search-accent', accent);
      dialog.style.setProperty('--yts-search-action-text', luminance > .179 ? '#101010' : '#ffffff');
      dialog.style.setProperty('--yts-search-dim', settings.searchBackdropOpacity / 100);
      dialog.style.setProperty('--yts-search-brightness', `${settings.searchBackdropBrightness}%`);
    }
    function createDialog() {
      sheet = doc.createElement('style'); sheet.textContent = css; (doc.head || doc.documentElement).appendChild(sheet);
      dialog = doc.createElement('dialog'); dialog.id = 'yts-quick-search'; dialog.setAttribute('aria-label','Search YouTube');
      const host = doc.createElement('div'); dialog.appendChild(host);
      const shadow = host.attachShadow({mode:'open'}), style = doc.createElement('style'); style.textContent = innerCss;
      const panel = doc.createElement('div'); panel.className = 'panel';
      const form = doc.createElement('form'); form.action = 'https://www.youtube.com/results'; form.method = 'get'; form.setAttribute('role','search');
      const icon = doc.createElement('span'); icon.className = 'icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = '⌕'; icon.style.cssText = 'font-size:30px;line-height:20px';
      input = doc.createElement('input'); input.type = 'search'; input.name = 'search_query'; input.placeholder = options.label || 'Search YouTube'; input.setAttribute('aria-label', options.label || 'Search YouTube'); input.autocomplete = 'off';
      const submit = doc.createElement('button'); submit.type = 'submit'; submit.className = 'submit'; submit.textContent = 'Search';
      const close = doc.createElement('button'); close.type = 'button'; close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label','Close search');
      const hint = doc.createElement('div'); hint.className = 'hint'; hint.textContent = 'Search videos, channels and more'; const keys = doc.createElement('span'); keys.textContent = 'Enter to search  ·  Esc to close'; hint.appendChild(keys);
      form.append(icon,input,submit,close); panel.append(form,hint); shadow.append(style,panel); doc.body.appendChild(dialog);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', event => { if (event.composedPath()[0] === dialog) dialog.close(); });
      dialog.addEventListener('keydown', event => { event.stopPropagation(); if (event.key === 'Escape') { event.preventDefault(); dialog.close(); } });
      dialog.addEventListener('close', () => {
        const native = doc.querySelector('yt-searchbox input:not([type="file"]), ytd-searchbox input');
        if (native) { native.value=input.value; if(win?.Event && native.dispatchEvent) native.dispatchEvent(new win.Event('input',{bubbles:true})); }
        if (lastFocus && lastFocus.isConnected && typeof lastFocus.focus === 'function') lastFocus.focus(); lastFocus = null;
      });
      // Explicit navigation works consistently for forms inside shadow DOM.
      form.addEventListener('submit', event => {
        event.preventDefault();
        const query=input.value.trim(); if(!query) {input.focus(); return;}
        if(options.onSearch) {options.onSearch(query); dialog.close();}
        else win.location.assign('https://www.youtube.com/results?search_query='+encodeURIComponent(query));
      });
      setAppearance();
    }
    function open() {
      if (!doc.body || !win || !win.HTMLDialogElement || !win.HTMLDialogElement.prototype.showModal) return false;
      if (!dialog) {
        try { createDialog(); } catch (_) { if (dialog) dialog.remove(); if (sheet) sheet.remove(); dialog = null; sheet = null; return false; }
      }
      if (dialog.open) { input.focus(); return true; }
      const nativeInput = doc.querySelector('yt-searchbox input:not([type="file"]), ytd-searchbox input');
      input.value = nativeInput && typeof nativeInput.value === 'string' ? nativeInput.value : '';
      lastFocus = doc.activeElement;
      try { dialog.showModal(); input.focus(); input.select(); return true; } catch (_) { return false; }
    }
    function keydown(event) {
      if (!settings.enabled || !settings.searchPopupEnabled || event.defaultPrevented || event.repeat || event.isComposing || (dialog && dialog.open)) return;
      const target = event.target, tag = target && target.tagName && target.tagName.toLowerCase();
      const editing = target && (target.isContentEditable || ['input','textarea','select'].includes(tag));
      const slash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !editing;
      const shortcut = event.key && event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
      if ((slash || shortcut) && open()) { event.preventDefault(); event.stopImmediatePropagation(); }
    }
    function click(event) {
      if (!settings.enabled || !settings.searchPopupEnabled || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (target && target.closest && !target.closest('button, a, [role="button"]') && target.closest('yt-searchbox .ytSearchboxComponentInputBox, yt-searchbox input:not([type="file"]), ytd-searchbox #container, ytd-searchbox input') && open()) { event.preventDefault(); event.stopImmediatePropagation(); }
    }
    if (doc.addEventListener) { doc.addEventListener('keydown',keydown,true); doc.addEventListener('click',click,true); }
    return {
      update(next) { settings = next; if ((!next.enabled || !next.searchPopupEnabled) && dialog && dialog.open) dialog.close(); setAppearance(); },
      destroy() { if (dialog) { if (dialog.open) dialog.close(); dialog.remove(); dialog=null; } if (sheet) { sheet.remove(); sheet=null; } if (doc.removeEventListener) { doc.removeEventListener('keydown',keydown,true); doc.removeEventListener('click',click,true); } }
    };
  }
  const api = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ThemeSearch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
