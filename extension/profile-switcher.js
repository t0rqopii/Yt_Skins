/* A compact profile picker that uses the same storage keys as the studio. */
(() => {
  let state = {}, host, list, toggle, revision = 0;
  function render() {
    const theme = ThemeStudio.normalize(state.theme);
    if (!theme.enabled || !theme.profileSwitcher) { if (host) host.remove(); host = null; return; }
    if (!host) {
      host = document.createElement('div'); const shadow = host.attachShadow({mode:'closed'});
      const style = document.createElement('style'); style.textContent = ':host{position:fixed;right:16px;bottom:16px;z-index:2147483001;font:14px system-ui;color:#fff}button{font:inherit;color:inherit;cursor:pointer;border:1px solid #ffffff40;background:#20232aeF;border-radius:20px;padding:9px 14px}ul{list-style:none;margin:0 0 8px;padding:6px;background:#20232af5;border:1px solid #ffffff40;border-radius:14px;max-height:40vh;overflow:auto}li button{display:block;width:100%;text-align:left;border:0;background:transparent;border-radius:8px}li button:hover,li button:focus{background:#ffffff24}';
      list = document.createElement('ul'); list.hidden = true; toggle = document.createElement('button'); toggle.type='button'; toggle.textContent='Themes'; toggle.setAttribute('aria-expanded','false');
      toggle.addEventListener('click', () => { list.hidden = !list.hidden; toggle.setAttribute('aria-expanded',String(!list.hidden)); });
      shadow.append(style,list,toggle); (document.body || document.documentElement).append(host);
    }
    list.replaceChildren();
    const profiles = Array.isArray(state.profiles) ? state.profiles.slice(0,25) : [];
    profiles.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string' && p.settings && typeof p.settings === 'object').forEach(profile => {
      const li = document.createElement('li'), button = document.createElement('button'); button.type='button'; button.textContent = profile.name.slice(0,60); if (profile.id === state.activeProfile) button.setAttribute('aria-current','true');
      button.addEventListener('click', async () => { try { await chrome.storage.local.set({theme:ThemeStudio.normalize(profile.settings),activeProfile:profile.id}); list.hidden=true; toggle.setAttribute('aria-expanded','false'); } catch { toggle.textContent='Could not apply'; } }); li.append(button); list.append(li);
    });
    if (!profiles.length) { const li = document.createElement('li'); li.textContent = 'Save a profile in Theme Studio'; list.append(li); }
  }
  ThemeState.subscribe(next => { state = next; render(); });
})();
