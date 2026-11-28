/* Apply saved settings to the current YouTube tab and keep them in sync. */
(() => {
  let settings = ThemeStudio.normalize({});
  let observer;
  let frame = 0;
  const interactions = ThemeInteractions.create(document, typeof window === 'undefined' ? null : window);
  const search = typeof ThemeSearch === 'undefined' ? null : ThemeSearch.create(document, typeof window === 'undefined' ? null : window);
  const updateTitle = ThemeStudio.createTitleController(document);
  const fontState = {};
  const effects=typeof ThemeEffects==='undefined'?null:ThemeEffects.create(document);
  const shader=typeof ThemeShader==='undefined'?null:ThemeShader.create(document,window);
  const decoration=typeof ThemeDesign==='undefined'?null:ThemeDesign.createFrame(document);
  let mediaUrl = '', mediaKey = '', mediaRequest = 0, mediaLayer, mediaElement;
  const style = document.createElement('style');
  style.id = 'youtube-theme-studio';

  function refreshBrand() {
    frame = 0;
    ThemeStudio.updateBrand(settings, document);
    interactions.refresh();
    updateTitle(settings);
    syncMediaLayer();
    effects?.update(settings);
    shader?.update(settings); decoration?.update(settings);
  }
  function syncPlayback() {
    if (!mediaElement || settings.backgroundMode !== 'video') return;
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.hidden || reduced || settings.backgroundVideoPaused) mediaElement.pause?.();
    else mediaElement.play().catch(() => {});
  }
  document.addEventListener?.('visibilitychange', syncPlayback);
  if (typeof matchMedia === 'function') matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', syncPlayback);
  function syncMediaLayer() {
    const app = document.querySelector && document.querySelector('ytd-app');
    if (!app || !mediaUrl || !settings.enabled || !['image','video'].includes(settings.backgroundMode)) {
      if (mediaLayer) { mediaLayer.remove(); mediaLayer = null; mediaElement = null; }
      return;
    }
    if (mediaLayer && mediaLayer.parentNode === app) {
      ThemeStudio.styleBackgroundMedia(mediaElement, settings);
      syncPlayback();
      return;
    }
    if (mediaLayer) mediaLayer.remove();
    mediaLayer = document.createElement('div'); mediaLayer.id = 'yts-background-media'; mediaLayer.setAttribute('aria-hidden','true');
    const element = document.createElement(settings.backgroundMode === 'video' ? 'video' : 'img');
    mediaElement = element;
    ThemeStudio.styleBackgroundMedia(element, settings);
    if (settings.backgroundMode === 'video') {
      element.muted = true; element.loop = true; element.playsInline = true;
      element.autoplay = !settings.backgroundVideoPaused && !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    } else element.alt = '';
    element.src = mediaUrl; mediaLayer.appendChild(element); app.prepend(mediaLayer);
    syncPlayback();
  }
  function updateMedia() {
    const key = settings.enabled && ['image','video'].includes(settings.backgroundMode) && settings.backgroundAssetVersion ? `${settings.backgroundMode}:${settings.backgroundAssetVersion}` : '';
    if (key === mediaKey) { syncMediaLayer(); return; }
    mediaKey = key; const token = ++mediaRequest;
    if (mediaLayer) { mediaLayer.remove(); mediaLayer = null; mediaElement = null; }
    if (mediaUrl) URL.revokeObjectURL(mediaUrl); mediaUrl = '';
    if (!key || !chrome.runtime?.sendMessage) return;
    const mode = settings.backgroundMode, version = settings.backgroundAssetVersion;
    chrome.runtime.sendMessage({type:'get-background-asset', version}).then(asset => {
      if (token !== mediaRequest || !asset || asset.version !== version || typeof asset.data !== 'string' || !asset.type?.startsWith(mode + '/')) return;
      const binary = atob(asset.data), bytes = new Uint8Array(binary.length);
      for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
      mediaUrl = URL.createObjectURL(new Blob([bytes], {type:asset.type})); syncMediaLayer();
    }).catch(() => {});
  }
  function apply(value) {
    settings = ThemeStudio.normalize(value);
    ThemeStudio.loadAllFonts(settings, document, fontState);
    const css = ThemeStudio.makeCSS(settings, { embedFont: false, enableMedia: true });
    if (style.textContent !== css) style.textContent = css;
    if (!style.isConnected) (document.head || document.documentElement).appendChild(style);
    interactions.update(settings);
    if (search) search.update(settings);
    effects?.update(settings);
    updateMedia();
    refreshBrand();
  }
  ThemeState.subscribe((state, keys) => { if (keys.includes('theme')) apply(state.theme); });
  function watch() {
    if (observer) return;
    // YouTube updates its feed constantly. Only revisit branding when a logo,
    // title, or app container is actually involved in a mutation.
    const relevant = node => node && node.nodeType === 1 &&
      ((node.matches && node.matches('a#logo, ytd-app, title')) ||
       (node.querySelector && node.querySelector('a#logo, ytd-app, title')));
    observer = new MutationObserver(records => {
      if (!settings.enabled || (!settings.brandName && !settings.logo && !mediaUrl && settings.backgroundMode!=='shader' && !settings.frames.site.enabled)) return;
      if (records && !records.some(record => {
        const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
        if (target && target.closest && target.closest('a#logo, title')) return true;
        return [...(record.addedNodes || []), ...(record.removedNodes || [])].some(relevant);
      })) return;
      if (!frame) frame = requestAnimationFrame(refreshBrand);
    });
    observer.observe(document.documentElement, { childList: true, characterData: true, subtree: true });
    refreshBrand();
  }
  document.addEventListener?.('yt-navigate-finish', refreshBrand);
  if (document.documentElement) watch();
  else document.addEventListener('DOMContentLoaded', watch, { once: true });
})();
