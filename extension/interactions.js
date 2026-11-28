/* Page interactions are kept separate from theme generation and the editor. */
(function (root) {
  'use strict';
  function create(doc, win) {
    let settings = {}, floating, sticker, stickerArea, brandName = '', brandLogo = '', pathSignature = '', stickerSignature = '';
    function removeStickers() { if (sticker) sticker.remove(); sticker = null; stickerArea = null; }
    function onHover(event) {
      if (!settings.enabled || !settings.hoverStickerEnabled || !settings.hoverSticker || !doc.body) return;
      let target = event.target; if (!target || !target.closest) return;
      const area = target.closest('yt-thumbnail-view-model, ytd-thumbnail');
      if (!area || !area.getBoundingClientRect || area === stickerArea) return;
      if (!sticker) {
        sticker=doc.createElement('div'); sticker.setAttribute('aria-hidden','true');
        const shadow=sticker.attachShadow({mode:'closed'}), image=doc.createElement('img');
        image.alt=''; image.style.cssText='display:block;width:100%;height:100%;object-fit:contain;'; shadow.append(image);
        sticker._image=image; doc.body.appendChild(sticker);
      }
      stickerArea=area; const rect=area.getBoundingClientRect(), size=Math.min(settings.hoverStickerSize, rect.width/2, rect.height*.75);
      sticker._image.src=settings.hoverSticker;
      sticker.style.cssText=`position:fixed;pointer-events:none;z-index:2147483000;width:${size}px;height:${size}px;left:${settings.hoverStickerPosition === 'left' ? rect.left+4 : rect.right-size-4}px;top:${rect.bottom-size-4}px`;
      if (sticker.animate && !win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        const start = settings.hoverStickerEffect === 'fade' ? {opacity:0} : {opacity:0,transform:settings.hoverStickerEffect === 'slide' ? 'translateY(12px)' : 'scale(.7)'};
        sticker.animate([start,{opacity:1,transform:'none'}],{duration:settings.hoverStickerDuration ?? 90,easing:'ease-out'});
      }
    }
    function onLeave(event) { if (stickerArea && (!event.relatedTarget || !stickerArea.contains(event.relatedTarget))) removeStickers(); }
    function syncLogo() {
      const anchors = doc.querySelectorAll ? doc.querySelectorAll('a#logo') : [];
      const points = Array.isArray(settings.logoPathPoints) ? settings.logoPathPoints : [];
      const active = settings.enabled && settings.logoPathEnabled && points.length && (settings.brandName || settings.logo);
      anchors.forEach(anchor => { if (active) anchor.classList.add('yts-path-active'); else anchor.classList.remove('yts-path-active'); });
      if (!active || !doc.body || !win) {
        if (floating) floating.remove(); floating = null; brandName = ''; brandLogo = ''; pathSignature = '';
        return;
      }
      if (!floating || !floating.isConnected) {
        floating = doc.createElement('a'); floating.id = 'yts-floating-logo'; floating.href = '/'; floating.setAttribute('aria-label','YouTube home');
        doc.body.appendChild(floating); brandName = ''; brandLogo = ''; pathSignature = '';
      }
      if (settings.brandName !== brandName || settings.logo !== brandLogo) {
        const inner = doc.createElement('span'); inner.className = 'yts-brand';
        if (settings.logo) { const image = doc.createElement('img'); image.src = settings.logo; image.alt = ''; inner.appendChild(image); }
        if (settings.brandName) { const text = doc.createElement('span'); text.textContent = settings.brandName; inner.appendChild(text); }
        floating.replaceChildren(inner); brandName = settings.brandName; brandLogo = settings.logo;
      }
      const width = Math.max(1, win.innerWidth), height = Math.max(1, win.innerHeight);
      const signature = JSON.stringify([points,width,height,settings.logoPathDuration,settings.logoPathLoop]);
      if (signature === pathSignature) return;
      pathSignature = signature;
      const coordinates = points.map(point => [Math.round(point.x*width),Math.round(point.y*height)]);
      if (coordinates.length === 1) {
        floating.style.offsetPath = 'none'; floating.style.left = `${coordinates[0][0]}px`; floating.style.top = `${coordinates[0][1]}px`;
        floating.style.transform = 'translate(-50%, -50%)'; floating.style.animation = 'none';
      } else {
        const path = coordinates.map((point,i) => `${i ? 'L' : 'M'} ${point[0]} ${point[1]}`).join(' ');
        floating.style.left = '0'; floating.style.top = '0'; floating.style.transform = 'none';
        floating.style.offsetPath = `path("${path}")`; floating.style.offsetAnchor = 'center'; floating.style.offsetRotate = '0deg';
        floating.style.animation = `yts-logo-path ${settings.logoPathDuration}s linear infinite ${settings.logoPathLoop === 'alternate' ? 'alternate' : 'normal'}`;
      }
    }
    function update(next) {
      const signature = next.enabled && next.hoverStickerEnabled ? next.hoverSticker : '';
      if (signature !== stickerSignature) { removeStickers(); stickerSignature = signature; }
      settings = next; syncLogo();
    }
    if (doc.addEventListener) { doc.addEventListener('pointerover',onHover,true); doc.addEventListener('focusin',onHover,true); doc.addEventListener('pointerout',onLeave,true); doc.addEventListener('focusout',onLeave,true); doc.addEventListener('scroll',removeStickers,true); }
    if (win && win.addEventListener) win.addEventListener('resize',syncLogo);
    return {update,refresh:syncLogo,destroy() { removeStickers(); settings = {}; syncLogo(); if (doc.removeEventListener) { doc.removeEventListener('pointerover',onHover,true); doc.removeEventListener('focusin',onHover,true); doc.removeEventListener('pointerout',onLeave,true); doc.removeEventListener('focusout',onLeave,true); doc.removeEventListener('scroll',removeStickers,true); } if (win && win.removeEventListener) win.removeEventListener('resize',syncLogo); }};
  }
  const api = {create};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ThemeInteractions = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
