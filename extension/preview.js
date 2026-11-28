/* The preview document is created once. Sliders update paint without reloading media. */
(function(root) {
  function create(frame, options = {}) {
    let inspecting=false, highlighted=null, effects, companion, compare=false, shader, decoration, browsing;
    let latest, pending = 0, loaded = false, mediaKey = '', media, interactions, search, sizeObserver, view = 'home';
    function searchSample(query) {
      if(browsing){browsing.search(query);return;}
      const doc=frame.contentDocument; if(!doc) return;
      const term=query.trim().toLocaleLowerCase(); let count=0;
      doc.querySelectorAll('.feed > ytd-rich-item-renderer').forEach(card=>{card.hidden=!!term && !card.textContent.toLocaleLowerCase().includes(term); if(!card.hidden)count++;});
      const note=doc.getElementById('preview-note');
      if(note) {note.setAttribute('role','status'); note.textContent=term ? `${count} sample result${count===1?'':'s'} for “${query.trim()}”. Clear search to show all. Search on YouTube for real results.` : 'Local sample · Search these titles, or open YouTube for real results.';}
      if(term) {view='home';doc.documentElement.dataset.view=view;options.onViewChange?.(view);}
    }
    const fontState = {};
    let canvasVisible=true;
    const visibilityObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{canvasVisible=entries[0]?.isIntersecting!==false;shader?.setVisible(canvasVisible);}):null;
    visibilityObserver?.observe(frame);
    function paint() {
      pending = 0;
      if (!loaded || !latest) return;
      const {settings, url} = latest, s=compare?{...settings,enabled:false}:settings, doc = frame.contentDocument;
      if (!doc) return;
      doc.documentElement.dataset.view = view;
      const css = ThemeStudio.makeCSS(s, {embedFont:false, enableMedia:true});
      const sheet = doc.getElementById('theme-paint');
      if (sheet.textContent !== css) sheet.textContent = css;
      ThemeStudio.updateBrand(s, doc);
      interactions?.update(s);
      effects?.update(s); companion?.update(s);
      shader?.update(s); decoration?.update(s);
      search?.update({...s,searchPopupEnabled:s.searchPopupEnabled && !inspecting});
      ThemeStudio.loadAllFonts(s, doc, fontState);
      const key = s.enabled && url ? s.backgroundMode + url : '';
      if (key !== mediaKey) {
        mediaKey = key;
        doc.getElementById('yts-background-media')?.remove(); media = null;
        if (key) {
          const host = doc.createElement('div'); host.id = 'yts-background-media';
          media = doc.createElement(s.backgroundMode === 'video' ? 'video' : 'img');
          media.src = url; media.alt = '';
          if (s.backgroundMode === 'video') { media.muted = true; media.defaultMuted=true; media.loop = true; media.playsInline = true; media.autoplay=true; }
          host.append(media); doc.querySelector('ytd-app').prepend(host);
        }
      }
      if (media) {
        ThemeStudio.styleBackgroundMedia(media, s);
        if (media.tagName === 'VIDEO') {
          if (s.backgroundVideoPaused || matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) media.pause();
          else media.play().catch(error => {media.dataset.playbackError=error.name+': '+error.message;});
        }
      }
    }
    function schedule() { if (!pending) pending = requestAnimationFrame(paint); }
    frame.addEventListener('load', () => {
      const doc = frame.contentDocument;
      if (!doc?.getElementById('theme-paint')) return;
      loaded = true;
      shader?.destroy(); decoration?.destroy(); browsing?.destroy();
      if(typeof ThemeShader!=='undefined')shader=ThemeShader.create(doc,frame.contentWindow,{onStatus:options.onShaderStatus});
      shader?.setVisible(canvasVisible);
      if(typeof ThemeDesign!=='undefined')decoration=ThemeDesign.createFrame(doc);
      if(typeof ThemePreviewInteractions!=='undefined')browsing=ThemePreviewInteractions.create(doc,frame.contentWindow,{onView:next=>{view=next;options.onViewChange?.(next);}});
      sizeObserver?.disconnect();
      if (typeof ResizeObserver !== 'undefined') {
        sizeObserver = new ResizeObserver(() => {
          // Fit the sample's actual contents instead of clipping it inside a fixed-height iframe.
          const height = Math.ceil(doc.body.getBoundingClientRect().height);
          if (height > 0) frame.style.height = `${Math.max(360, height)}px`;
        });
        sizeObserver.observe(doc.body);
      }
      effects?.destroy(); companion?.destroy();
      if(typeof ThemeEffects!=='undefined')effects=ThemeEffects.create(doc);
      if(typeof ThemeCompanion!=='undefined')companion=ThemeCompanion.create(doc,frame.contentWindow);
      interactions?.destroy();
      interactions = ThemeInteractions.create(doc, frame.contentWindow);
      search?.destroy();
      if(typeof ThemeSearch !== 'undefined') search=ThemeSearch.create(doc,frame.contentWindow,{onSearch:searchSample,label:'Search this sample'});
      const nativeSearch=()=>doc.querySelector('yt-searchbox input:not([type=file])');
      doc.addEventListener('submit', event => {event.preventDefault(); if(event.target.closest('yt-searchbox'))searchSample(nativeSearch()?.value || '');});
      doc.addEventListener('keydown',event=>{if(event.key==='Enter' && !event.isComposing && event.target.closest('yt-searchbox')){event.preventDefault();searchSample(nativeSearch()?.value || '');}});
      doc.addEventListener('input',event=>{if(event.target===nativeSearch() && !event.target.value)searchSample('');});
      doc.addEventListener('click',event=>{if(!inspecting && event.target.closest('.ytSearchboxComponentSearchButton'))searchSample(nativeSearch()?.value || '');});
      doc.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
      const pick = node => {
        const selectors = [
          ['search','yt-searchbox, ytd-searchbox'],['brand','a#logo'],['title','h3, #video-title'],
          ['avatar','.avatar'],
          ['channel','yt-content-metadata-view-model a, ytd-channel-name'],['metadata','yt-content-metadata-view-model'],
          ['thumbnail','yt-thumbnail-view-model, ytd-thumbnail'],['category','chip-shape'],
          ['button','button'],
          ['description','#description'],['playerFrame','.html5-video-player'],['card','ytd-rich-item-renderer'],
          ['surface:chips','ytd-feed-filter-chip-bar-renderer'],['surface:header','ytd-masthead'],['surface:sidebar','ytd-guide-renderer'],['background','ytd-app']
        ];
        for(const [key,selector] of selectors) {const element=node.closest?.(selector); if(element) return {key,element};}
      };
      const clearHighlight=()=>{highlighted?.removeAttribute('data-yts-inspected'); highlighted=null;};
      doc.addEventListener('pointermove',event=>{if(!inspecting)return; const hit=pick(event.target); clearHighlight(); if(hit){highlighted=hit.element; highlighted.setAttribute('data-yts-inspected','');}});
      doc.addEventListener('pointerleave',clearHighlight);
      doc.addEventListener('click',event=>{if(!inspecting)return; const hit=pick(event.target); if(hit){event.preventDefault(); event.stopImmediatePropagation(); options.onSelect?.(hit.key,hit.element.getBoundingClientRect());}},true);
      doc.addEventListener('dblclick',event=>{const hit=pick(event.target);if(hit){event.preventDefault();options.onSelect?.(hit.key,hit.element.getBoundingClientRect());}});
      if (doc.createElement) {
        const selectionStyle=doc.createElement('style'); selectionStyle.textContent='[data-yts-inspected] { outline:2px solid #91baff !important; outline-offset:-2px !important; cursor:crosshair !important; }'; doc.head.append(selectionStyle);
      }
      schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', schedule);
    frame.srcdoc = ThemePreviewDocument;
    return {setCompare(on){compare=on;schedule();}, winkCompanion(){companion?.wink();}, setInspect(on) {inspecting=on; if(latest)search?.update({...latest.settings,searchPopupEnabled:latest.settings.searchPopupEnabled && !on}); if(!on){highlighted?.removeAttribute('data-yts-inspected'); highlighted=null;}}, setView(next) { view = next === 'watch' ? 'watch' : 'home'; browsing?.setView(view); if(!browsing && loaded && frame.contentDocument?.querySelectorAll){searchSample(''); const input=frame.contentDocument.querySelector('yt-searchbox input:not([type=file])');if(input)input.value='';} schedule(); }, update(settings, url) { latest = {settings, url}; schedule(); }};
  }
  root.ThemePreview = {create};
})(globalThis);
