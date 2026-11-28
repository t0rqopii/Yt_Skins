/* Shared theme generation. This file also runs in Node for tests. */
(function (root) {
  'use strict';
  const designAPI = typeof module !== 'undefined' && module.exports ? require('./design.js') : root.ThemeDesign;
  const shaderAPI = typeof module !== 'undefined' && module.exports ? require('./shader.js') : root.ThemeShader;
  const interactionAPI = typeof module !== 'undefined' && module.exports ? require('./interactions.js') : root.ThemeInteractions;
  const effectAPI = typeof module !== 'undefined' && module.exports ? require('./effects.js') : root.ThemeEffects;
  const searchAPI = typeof module !== 'undefined' && module.exports ? require('./search-popup.js') : root.ThemeSearch;
  const {defaults, normalize, fontStacks, fontKeys} = typeof module !== 'undefined' && module.exports ? require('./schema.js') : root.ThemeSchema;
  function gradientImage(input) {
    const s = normalize(input);
    const stops=s.backgroundStops.slice().sort((a,b)=>a.position-b.position).map(stop=>`${rgba(stop.color,stop.alpha/100)} ${stop.position}%`).join(', ');
    const repeat=s.gradientRepeat?'repeating-':'';
    if (s.gradientType === 'linear') return `${repeat}linear-gradient(${s.gradientAngle}deg, ${stops})`;
    if (s.gradientType === 'radial') return `${repeat}radial-gradient(circle at ${s.gradientX1}% ${s.gradientY1}%, ${stops})`;
    if (s.gradientType === 'conic') return `${repeat}conic-gradient(from ${s.gradientAngle}deg at ${s.gradientX1}% ${s.gradientY1}%, ${stops})`;
    return `radial-gradient(ellipse at ${s.gradientX1}% ${s.gradientY1}%, ${s.gradientColor} 0%, transparent ${s.gradientSpread}%), radial-gradient(ellipse at ${s.gradientX2}% ${s.gradientY2}%, ${s.gradientColor2} 0%, transparent ${s.gradientSpread}%), radial-gradient(ellipse at ${s.gradientX3}% ${s.gradientY3}%, ${s.gradientColor3} 0%, ${s.background} ${s.gradientSpread}%)`;
  }
  const selectorAPI = typeof module !== 'undefined' && module.exports ? require('./selectors.js') : root.ThemeSelectors;
  const {surfaces, typeTargets} = selectorAPI;
  function rgba(hex, alpha) { return `rgba(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}, ${Math.round(alpha*1000)/1000})`; }
  function backgroundFilter(s, media=false) {
    return `${media && s.gradientMapEnabled && s.gradientMapTarget!=='thumbnails'?'url(#yts-gradient-map) ':''}blur(${s.backgroundBlur}px) brightness(${s.backgroundBrightness*(media ? (100-s.backgroundDim)/100 : 1)}%) saturate(${s.backgroundSaturation}%) contrast(${s.backgroundContrast}%)`;
  }
  // Shared by the real page and preview; adjustments never reload a file.
  function styleBackgroundMedia(element, s) {
    element.style.cssText = `display:block;width:100%;height:100%;object-fit:${s.backgroundFit};object-position:${s.backgroundPositionX}% ${s.backgroundPositionY}%;filter:${backgroundFilter(s,true)};transform:scale(${s.backgroundFlip?-s.backgroundZoom/100:s.backgroundZoom/100},${s.backgroundZoom/100});transform-origin:${s.backgroundPositionX}% ${s.backgroundPositionY}%`;
    if (s.backgroundMode==='video') element.playbackRate=s.backgroundVideoSpeed/100;
  }
  function backgroundFinish(s) {
    const layers=[], sizes=[];
    if(s.backgroundVignette) {layers.push(`radial-gradient(ellipse at center, transparent 25%, ${rgba('#000000',s.backgroundVignette/100)} 100%)`);sizes.push('100% 100%');}
    const ink=rgba(s.backgroundPatternColor,s.backgroundPatternOpacity/100), size=s.backgroundPatternSize;
    if(s.backgroundPattern==='dots'){layers.push(`radial-gradient(circle, ${ink} 1px, transparent 1.5px)`);sizes.push(`${size}px ${size}px`);}
    if(s.backgroundPattern==='grid'){layers.push(`linear-gradient(${ink} 1px, transparent 1px)`,`linear-gradient(90deg, ${ink} 1px, transparent 1px)`);sizes.push(`${size}px ${size}px`,`${size}px ${size}px`);}
    if(s.backgroundPattern==='diagonal'){layers.push(`repeating-linear-gradient(135deg, ${ink} 0 1px, transparent 1px ${size}px)`);sizes.push('auto');}
    if(s.backgroundTintOpacity){const tint=rgba(s.backgroundTint,s.backgroundTintOpacity/100);layers.push(`linear-gradient(${tint}, ${tint})`);sizes.push('100% 100%');}
    return layers.length ? `ytd-app::after { content:""; position:fixed; inset:0; z-index:-1; pointer-events:none; background-image:${layers.join(',')}; background-size:${sizes.join(',')}; }` : '';
  }
  function makeCSS(input, options = {}) {
    const s = normalize(input);
    if (!s.enabled) return '/* YouTube Theme Studio is turned off. */\n';
    const css = ['/* YouTube Theme Studio: generated paint */',
      `html, html[dark], ytd-app, ytd-app [dark] { --yts-bg:${s.background}; --yts-surface:${s.surface}; --yts-text:${s.text}; --yts-muted:${s.muted}; --yts-accent:${s.accent}; --yts-radius:${s.radius}px; --yt-spec-base-background:${s.background} !important; --yt-spec-general-background-a:${s.background} !important; --yt-spec-general-background-b:${s.surface} !important; --yt-spec-general-background-c:${s.surface} !important; --yt-spec-call-to-action:${s.accent} !important; --yt-spec-brand-link-text:${s.accent} !important; --yt-spec-badge-chip-background:${s.chipBackground} !important; --yt-spec-raised-background:${s.surface} !important; --yt-spec-menu-background:${s.surface} !important; --yt-spec-text-primary:${s.text} !important; --yt-spec-text-secondary:${s.muted} !important; --yt-spec-icon-active-other:${s.text} !important; --yt-spec-icon-inactive:${s.muted} !important; --yt-spec-brand-button-background:${s.accent} !important; }`,
      `html { background-color:${s.background} !important;${s.backgroundMode === 'gradient' ? ` background-image:${gradientImage(s)} !important; background-size:${s.gradientMotion ? '230% 230%' : '100% 100%'};${s.gradientMotion ? ` animation:yts-gradient ${s.gradientSpeed}s ease-in-out infinite alternate;` : ''}` : ''} }`,
      `${selectorAPI.backdropLayers} { background:transparent !important; color:var(--yts-text); }`,
      'ytd-app { isolation:isolate !important; }',
      '#frosted-glass, ytd-masthead #background { background:transparent !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }',
      // Never filter the host: its fixed child would become positioned relative to it.
      'ytd-feed-filter-chip-bar-renderer { background:transparent !important; backdrop-filter:none !important; -webkit-backdrop-filter:none !important; }',
      'ytd-feed-filter-chip-bar-renderer chip-bar-view-model { background:transparent !important; }',
      'ytd-guide-entry-renderer #endpoint, ytd-mini-guide-entry-renderer #endpoint, ytd-menu-popup-renderer { color:var(--yts-text) !important; }'
    ];
    for (const [name, selector] of Object.entries(surfaces)) {
      const g = s.surfaces[name];
      const fillStops = g.linked ? g.stops.map(stop=>({...stop,color:name==='search'?s.searchBackground:s.surface})) : g.stops;
      const gradient = (g.fillMode==='solid' ? [{...fillStops[0],position:0}] : fillStops.slice().sort((a,b)=>a.position-b.position)).map(stop => `${rgba(stop.color, stop.alpha * g.opacity / 10000)} ${stop.position}%`).join(', ');
      // CSS gradients require at least two stops.
      const stops = g.fillMode==='solid' || g.stops.length === 1 ? `${gradient}, ${gradient}` : gradient;
      css.push(`${selector} { background:linear-gradient(${g.angle}deg, ${stops}) !important; box-shadow:inset 0 0 0 1px ${rgba(s.text,g.border/100)};${name === 'search' ? ` border-radius:${s.searchRadius}px;` : ''} backdrop-filter:blur(${g.blur}px) saturate(${g.saturate}%); -webkit-backdrop-filter:blur(${g.blur}px) saturate(${g.saturate}%);${g.drift && g.fillMode==='gradient' && !g.linked ? ' background-size:200% 200%; animation:yts-glass-drift 24s ease-in-out infinite alternate;' : ''} }`);
      if (name === 'search' && g.glowMode !== 'off') css.push(`${selector.split(', ').map(x => g.glowMode === 'hover' ? x+':hover' : x).join(', ')} { box-shadow:0 0 ${g.glowRadius}px ${g.glowColor}; }`);
    }
    css.push(
      `${surfaces.search} { border:1px solid ${s.searchBorder} !important; border-radius:${s.searchRadius}px !important; transition:border-color 160ms ease, box-shadow 160ms ease; }`,
      `yt-searchbox .ytSearchboxComponentInputBox, ytd-searchbox #container { background:transparent !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; }`,
      `yt-searchbox .ytSearchboxComponentSearchForm { background:transparent !important; border:0 !important; border-radius:0 !important; box-shadow:none !important; }`,
      `yt-searchbox .ytSearchboxComponentSuggestionsContainer { background:${s.searchBackground} !important; color:${s.searchText} !important; border:1px solid ${s.searchBorder}; }`,
      `yt-searchbox .ytSearchboxComponentSuggestionsContainer [role=option] { color:${s.searchText} !important; }`,
      `yt-searchbox .ytSearchboxComponentSuggestionsContainer [role=option]:is(:hover,[aria-selected=true]) { background:${rgba(s.searchText,.12)} !important; }`,
      `yt-searchbox input:not([type=file]), ytd-searchbox input { color:${s.searchText} !important; background:transparent !important; border:0 !important; box-shadow:none !important; outline:none !important; }`,
      `yt-searchbox .ytSearchboxComponentSearchButton, ytd-searchbox #search-icon-legacy { background:transparent !important; color:${s.searchText} !important; border:0 !important; box-shadow:none !important; border-radius:0 ${s.searchRadius}px ${s.searchRadius}px 0 !important; }`,
      `yt-searchbox .ytSearchboxComponentSearchButton:hover, ytd-searchbox #search-icon-legacy:hover { background:${rgba(s.text,.08)} !important; }`,
      `yt-searchbox .ytSearchboxComponentInputContainer:focus-within, yt-searchbox:not(:has(.ytSearchboxComponentInputContainer)) form:focus-within, ytd-searchbox[has-focus] #search-form { border-color:${s.surfaces.search.glowColor} !important; box-shadow:0 0 ${s.surfaces.search.glowRadius}px ${rgba(s.surfaces.search.glowColor,.35)}; }`,
      'yt-searchbox [class*="InputBoxIcon" i], yt-searchbox .ytSearchboxComponentInputBox > yt-icon, yt-searchbox .ytSearchboxComponentInputBox > yt-icon-shape { display:none !important; }',
      'yt-searchbox .ytSearchboxComponentSearchButton:focus-visible, ytd-searchbox #search-icon-legacy:focus-visible { outline:2px solid var(--yts-accent); outline-offset:-4px; }',
      `chip-shape .ytChipShapeChip, .ytChipShapeChip, yt-chip-cloud-chip-renderer { color:${s.chipText} !important; background:${s.chipBackground} !important; border-radius:${s.chipRadius}px !important; border:1px solid ${rgba(s.text,.12)} !important; }`,
      `chip-shape .ytChipShapeActive, .ytChipShapeActive, yt-chip-cloud-chip-renderer[selected] { color:${s.chipSelectedText} !important; background:${s.chipSelectedBackground} !important; border-color:transparent !important; }`,
      'yt-chip-cloud-chip-renderer[selected] #chip-container, yt-chip-cloud-chip-renderer[selected] yt-formatted-string, .ytChipShapeActive .ytChipShapeInnerBackground, .ytChipShapeActive::before, .ytChipShapeActive::after { background:transparent !important; box-shadow:none !important; border-color:transparent !important; }',
      `yt-chip-cloud-chip-renderer[selected] yt-formatted-string, .ytChipShapeActive .ytChipShapeText { color:${s.chipSelectedText} !important; }`,
      `.html5-video-player .ytp-play-progress, .html5-video-player .ytp-scrubber-button { background:${s.playerProgress} !important; }`,
      `ytd-thumbnail, yt-thumbnail-view-model { border-radius:${s.radius}px; }`,
      `${typeTargets.titleFont} { color:${s.titleStyle === 'match' ? s.text : s.title1} !important; }`,
      'a#logo { text-decoration:none; color:var(--yts-text); }',
      '.yts-brand { display:inline-flex; align-items:center; gap:8px; color:var(--yts-accent); font-size:20px; font-weight:700; }',
      '.yts-brand img { width:32px; height:32px; object-fit:contain; }',
      'a#logo.yts-branded > :not(.yts-brand) { display:none !important; }',
      'ytd-topbar-logo-renderer:has(a#logo.yts-branded) #country-code { display:none !important; }',
      'a#logo.yts-path-active > .yts-brand { visibility:hidden; }',
      '#yts-floating-logo { position:fixed; left:0; top:0; z-index:2147483000; text-decoration:none; display:inline-flex; offset-rotate:0deg; offset-anchor:center; }',
      '@keyframes yts-logo-path { from { offset-distance:0%; } to { offset-distance:100%; } }',
      '@keyframes yts-gradient { from { background-position:0% 15%; } to { background-position:100% 85%; } }',
      '@keyframes yts-glass-drift { from { background-position:0% 50%; } to { background-position:100% 50%; } }');
    if(s.gradientMapEnabled && s.gradientMapTarget!=='background') css.push(`${selectorAPI.thumbnailImages} { filter:url("#yts-gradient-map") !important; }`);
    if (s.playerBlend) css.push(
      `${selectorAPI.playerBackdrop}, ${selectorAPI.watchBackdrop} { background:transparent !important; }`,
      'ytd-watch-flexy #cinematics { display:none !important; }',
      `ytd-watch-metadata #description { background:${rgba(s.surface,(100-s.panelTransparency)/100)} !important; }`
    );
    css.push(`ytd-watch-flexy .html5-video-player:not(.ytp-fullscreen) { border-radius:${s.playerRadius}px !important; overflow:hidden; }`,
      'ytd-watch-flexy .html5-video-player.ytp-fullscreen, ytd-watch-flexy .html5-video-player:fullscreen { border-radius:0 !important; background:#000 !important; box-shadow:none !important; }',
      'ytd-watch-flexy:fullscreen .html5-video-player { border-radius:0 !important; }');
    if (s.playerGlow) css.push(`.html5-video-player:hover:not(.ytp-fullscreen) { box-shadow:0 0 ${s.playerGlowRadius}px ${s.playerGlowColor}; }`);
    for (const target of [s.hidePageScrollbar ? 'html, body' : '', s.hideSidebarScrollbar ? selectorAPI.sidebarScrollers : ''].filter(Boolean)) {
      css.push(`${target} { scrollbar-width:none !important; }`,`${target.split(', ').map(x=>x+'::-webkit-scrollbar').join(', ')} { display:none !important; width:0 !important; height:0 !important; }`);
    }
    if (s.backgroundMode!=='solid') css.push('ytd-app { --yt-spec-base-background:transparent !important; --yt-spec-general-background-a:transparent !important; }');
    if (s.backgroundMode==='gradient') css.push(`ytd-app::before { content:""; position:fixed; inset:0; pointer-events:none; z-index:-1; background-color:${s.background}; background-image:${gradientImage(s)}; background-size:${s.gradientMotion?'230% 230%':'100% 100%'};${s.gradientMotion?` animation:yts-gradient ${s.gradientSpeed}s ease-in-out infinite alternate;`:''} }`);
    if (['gradient','shader'].includes(s.backgroundMode)) css.push(`ytd-app::before${s.backgroundMode==='shader'?', #yts-shader':''} { filter:${backgroundFilter(s)}; transform:scale(${1+s.backgroundBlur/100}); }`);
    css.push(backgroundFinish(s));
    if(s.titleHighlight) css.push(`${selectorAPI.titleBoxes} { position:relative; isolation:isolate; padding:${s.highlightPadding}px !important; border-radius:${s.highlightRadius}px !important; }`,`${selectorAPI.titleBoxes.split(', ').map(x=>x+'::before').join(', ')} { content:""; position:absolute; inset:0; border-radius:inherit; background:${rgba(s.highlightColor,s.highlightOpacity/100)} !important; pointer-events:none; z-index:-1; }`);
    if (s.titleStyle === 'gradient') css.push(`${typeTargets.titleFont} { background-image:linear-gradient(${s.titleGradientAngle}deg, ${s.title1}, ${s.title2}); background-clip:text; -webkit-background-clip:text; color:transparent !important; -webkit-text-fill-color:transparent;${s.titleGradientMotion?' background-size:200% 100%; animation:yts-title-sheen 12s ease-in-out infinite alternate;':''} }`);
    if(s.titleGradientMotion && s.titleStyle==='gradient')css.push('@keyframes yts-title-sheen { from { background-position:0% 50%; } to { background-position:100% 50%; } }',`@media(prefers-reduced-motion:reduce) { ${typeTargets.titleFont} { animation:none !important; } }`);
    if(s.titleShadow)css.push(`${selectorAPI.titleBoxes} { filter:drop-shadow(0 2px ${s.titleShadow}px ${rgba(s.title1,.45)}); }`);
    if (s.titleStyle === 'alternating') css.push(`${typeTargets.titleFont.split(', ').map(x => 'ytd-rich-item-renderer:nth-child(even) '+x).join(', ')} { color:${s.title2} !important; }`);
    if (options.embedFont !== false) {
      if (s.customFont) css.unshift(`@font-face { font-family:"YTS Uploaded Font"; src:url("${s.customFont}"); font-weight:100 900; font-display:swap; }`);
      for (const key of fontKeys) if (s.customFonts[key]) css.unshift(`@font-face { font-family:"YTS ${key}"; src:url("${s.customFonts[key].data}"); font-weight:100 900; font-display:swap; }`);
    }
    for (const key of fontKeys) {
      const a = s.typeAreas[key]; const stack = s[key] === 'custom' && s.customFonts[key] ? `"YTS ${key}", sans-serif` : fontStacks[s[key]];
      const family = stack && (s[key] !== 'custom' || s.customFonts[key] || s.customFont) ? `font-family:${stack} !important;` : '';
      css.push(`${typeTargets[key]} { ${family}${a.weight ? `font-weight:${a.weight} !important;` : ''}${a.size ? `font-size:${a.size}px !important;` : ''}${a.spacing ? `letter-spacing:${a.spacing}px !important;` : ''}${a.lineHeight ? `line-height:${a.lineHeight} !important;` : ''}${a.wordSpacing ? `word-spacing:${a.wordSpacing}px !important;` : ''}${a.stretch!==100 ? `font-stretch:${a.stretch}% !important;` : ''}${a.transform!=='none' ? `text-transform:${a.transform} !important;` : ''}${a.style!=='normal' ? `font-style:${a.style} !important;` : ''}${a.decoration!=='none' ? `text-decoration:${a.decoration} !important;` : ''}${a.smallCaps ? 'font-variant-caps:small-caps !important;' : ''}${!a.ligatures ? 'font-variant-ligatures:none !important;' : ''} }`);
    }
    if (s.logoAnimation !== 'none') {
      const selector = {both:'.yts-brand',image:'.yts-brand img',name:'.yts-brand > span'}[s.logoAnimationTarget];
      const frames = {float:'0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}',pulse:'0%,100%{transform:scale(1)}50%{transform:scale(1.12)}',spin:'from{transform:rotate(0deg)}to{transform:rotate(360deg)}',glow:`0%,100%{filter:drop-shadow(0 0 0 var(--yts-accent))}50%{filter:drop-shadow(0 0 ${s.logoGlowStrength}px var(--yts-accent))}`,wave:'0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}'};
      css.push(`${selector} { animation:yts-logo-${s.logoAnimation} ${s.logoAnimationSpeed}s ${s.logoEasing} infinite; }`, `@keyframes yts-logo-${s.logoAnimation} { ${frames[s.logoAnimation]} }`);
    }
    if (s.hover !== 'none') css.push(`ytd-thumbnail:hover, yt-thumbnail-view-model:hover { ${s.hover === 'glow' ? 'box-shadow:0 0 18px var(--yts-accent);' : 'filter:brightness(1.12); box-shadow:0 4px 16px rgba(0,0,0,.3);'} }`);
    if(options.enableMedia)css.push('#yts-background-media > :is(img,video) { display:block !important; position:static !important; width:100% !important; height:100% !important; max-width:none !important; max-height:none !important; }');
    if (options.enableMedia && ['image','video'].includes(s.backgroundMode) && s.backgroundAssetVersion) css.push(`html { background:transparent !important; } #yts-background-media { position:fixed; inset:0; z-index:-1; pointer-events:none; background:${s.background}; overflow:hidden; }`);
    css.push('@media (prefers-reduced-motion: reduce) { html, ytd-app::before, ytd-masthead, ytd-guide-renderer, ytd-mini-guide-renderer, ytd-feed-filter-chip-bar-renderer #chips-wrapper, yt-searchbox .ytSearchboxComponentInputContainer, yt-searchbox form, ytd-searchbox #search-form, ytd-menu-popup-renderer, tp-yt-paper-dialog, .html5-video-player .ytp-chrome-bottom, .yts-brand, .yts-brand img, .yts-brand > span, #yts-floating-logo { animation:none !important; } }');
    if (s.glowMode !== 'off') {
      const targets = [];
      if (s.glowCategories) targets.push('yt-chip-cloud-chip-renderer', 'chip-shape .ytChipShapeChip');
      if (s.glowButtons) targets.push('ytd-button-renderer button', 'yt-button-shape button');
      if (targets.length) css.push(`${targets.map(x => x + (s.glowMode === 'hover' ? ':hover' : '')).join(', ')} { box-shadow:0 0 ${s.glowRadius}px ${s.glowColor}; }`);
    }
    css.push(`${surfaces.search} { border-color:${s.searchBorder} !important; }`);
    const hidden = selectorAPI.hiddenSelectors(s);
    if (hidden.length) css.push(`${hidden.join(',\n')} { display: none !important; }`);
    if (s.feedColumns) {
      css.push(`ytd-rich-grid-renderer { --ytd-rich-grid-items-per-row:${s.feedColumns} !important; --ytd-rich-grid-item-margin:${s.feedGap}px !important; }`,
        `.feed { grid-template-columns:repeat(${s.feedColumns},minmax(0,1fr)) !important; gap:${s.feedGap}px !important; }`,
        `@media(max-width:900px) { ytd-rich-grid-renderer { --ytd-rich-grid-items-per-row:${Math.min(2,s.feedColumns)} !important; } .feed { grid-template-columns:repeat(${Math.min(2,s.feedColumns)},minmax(0,1fr)) !important; } }`,
        '@media(max-width:520px) { ytd-rich-grid-renderer { --ytd-rich-grid-items-per-row:1 !important; } .feed { grid-template-columns:1fr !important; } }');
    }
    css.push(designAPI.makeCSS(s));
    for (const [target, states] of Object.entries(s.elements)) {
      for (const [state, rule] of Object.entries(states)) {
        const declarations = [];
        for (const [key, property] of Object.entries({background:'background',color:'color',borderColor:'border-color',radius:'border-radius',borderWidth:'border-width',padding:'padding'})) {
          if (Object.hasOwn(rule,key)) declarations.push(`${property}:${rule[key]}${typeof rule[key] === 'number' ? 'px' : ''} !important`);
        }
        if (Object.hasOwn(rule,'borderWidth')) declarations.push('border-style:solid !important');
        if (Object.hasOwn(rule,'opacity')) declarations.push(`opacity:${rule.opacity/100} !important`);
        if (Object.hasOwn(rule,'shadow')) declarations.push(`box-shadow:0 0 ${rule.shadow}px ${rule.shadowColor || s.accent} !important`);
        // Individual transform properties avoid replacing native player transforms.
        if (Object.hasOwn(rule,'translateX') || Object.hasOwn(rule,'translateY')) declarations.push(`translate:${rule.translateX || 0}px ${rule.translateY || 0}px !important`);
        if (Object.hasOwn(rule,'rotate')) declarations.push(`rotate:${rule.rotate}deg !important`);
        if (Object.hasOwn(rule,'scale')) declarations.push(`scale:${rule.scale/100} !important`);
        const selectors = selectorAPI.elements[target].split(', ').map(x => state === 'hover' ? `${x}:hover` : x).join(', ');
        css.push(`${selectors} { ${declarations.join('; ')}; }`);
        if (rule.color && ['title','category','search'].includes(target)) {
          const descendants = target==='search' ? ' :is(input, button)' : target==='category' ? ' .ytChipShapeText' : ' :is(a, span)';
          const children=selectors.split(', ').map(x=>x+descendants).join(', ');
          css.push(`${selectors}, ${children} { color:${rule.color} !important; -webkit-text-fill-color:${rule.color} !important;${target==='title'?' background-image:none !important;':''} }`);
        }
      }
    }
    if (s.customCSSEnabled && s.customCSS.trim()) css.push('/* Your custom stylesheet */', s.customCSS);
    return css.join('\n') + '\n';
  }
  function updateBrand(input, doc) {
    const s = normalize(input);
    const anchors = doc.querySelectorAll('a#logo');
    anchors.forEach(anchor => {
      const existing = anchor.querySelector('.yts-brand');
      if (!s.enabled || (!s.brandName && !s.logo)) {
        if (existing) existing.remove();
        anchor.classList.remove('yts-branded');
        return;
      }
      let brand = existing;
      if (!brand) { brand = doc.createElement('span'); brand.className = 'yts-brand'; anchor.appendChild(brand); }
      anchor.classList.add('yts-branded');
      if (brand._ytsName === s.brandName && brand._ytsLogo === s.logo) return;
      brand.replaceChildren();
      if (s.logo) { const img = doc.createElement('img'); img.src = s.logo; img.alt = ''; brand.appendChild(img); }
      if (s.brandName) { const name = doc.createElement('span'); name.textContent = s.brandName; brand.appendChild(name); }
      brand._ytsName = s.brandName; brand._ytsLogo = s.logo;
    });
  }
  function createTitleController(doc) {
    let original = null;
    let applied = null;
    return function updateTitle(settings) {
      const current = doc.title || '';
      const source = current === applied && original !== null ? original : current;
      if (!settings.enabled || !settings.brandName) {
        if (current === applied && original !== null && current !== original) doc.title = original;
        original = null; applied = null;
        return;
      }
      original = source;
      const branded = source === 'YouTube' ? settings.brandName : source.replace(/ - YouTube$/, () => ' - ' + settings.brandName);
      applied = branded;
      if (current !== branded) doc.title = branded;
    };
  }
  function loadUploadedFont(settings, doc, state, family = 'YTS Uploaded Font') {
    const url = settings.enabled ? settings.customFont : '';
    if (state.url === url && state.family === family) return state.promise;
    state.url = url; state.family = family;
    const token = ++state.token;
    if (state.face && doc.fonts) { doc.fonts.delete(state.face); state.face = null; }
    state.status='idle';state.promise=null;
    if (!url || !doc.fonts || typeof FontFace === 'undefined') return;
    state.status='loading';
    try {
      const binary = atob(url.slice(url.indexOf(',') + 1));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const face = new FontFace(family, bytes.buffer, {weight:'100 900'});
      state.promise=face.load().then(loaded => { if (state.token === token) { doc.fonts.add(loaded); state.face = loaded; state.status='loaded'; } }).catch(() => {if(state.token===token)state.status='error';});
      return state.promise;
    } catch (_) { state.status='error';state.promise=Promise.resolve();return state.promise; }
  }
  function loadAllFonts(settings, doc, state) {
    for (const key of ['pageFont', 'brandFont', 'titleFont', 'channelFont', 'descriptionFont', 'searchFont', 'categoryFont', 'sidebarFont', 'metadataFont']) {
      if (!state[key]) state[key] = { url:null, face:null, token:0 };
      const entry = settings.customFonts && settings.customFonts[key];
      const family = entry ? `YTS ${key}` : 'YTS Uploaded Font';
      const url = entry ? entry.data : settings.customFont;
      loadUploadedFont({ enabled:settings.enabled && settings[key] === 'custom', customFont:url || '' }, doc, state[key], family);
    }
  }
  function makeJS(input) {
    const s = normalize(input);
    const payload = JSON.stringify({ searchPopupEnabled:s.searchPopupEnabled, searchBackdropOpacity:s.searchBackdropOpacity, searchBackdropBrightness:s.searchBackdropBrightness, searchGlassOpacity:s.searchGlassOpacity, searchBackground:s.searchBackground, searchText:s.searchText, surface:s.surface, text:s.text, muted:s.muted, accent:s.accent, enabled: s.enabled, brandName: s.brandName, logo: s.logo, logoPathEnabled:s.logoPathEnabled, logoPathPoints:s.logoPathPoints, logoPathDuration:s.logoPathDuration, logoPathLoop:s.logoPathLoop, hoverSticker:s.hoverSticker, hoverStickerEnabled:s.hoverStickerEnabled, hoverStickerSize:s.hoverStickerSize, hoverStickerPosition:s.hoverStickerPosition, hoverStickerDuration:s.hoverStickerDuration, hoverStickerEffect:s.hoverStickerEffect, customFont: s.customFont, customFonts:s.customFonts, pageFont:s.pageFont, brandFont:s.brandFont, titleFont:s.titleFont, channelFont:s.channelFont, descriptionFont:s.descriptionFont, searchFont:s.searchFont, categoryFont:s.categoryFont, sidebarFont:s.sidebarFont, metadataFont:s.metadataFont }).replace(/</g, '\\u003c');
    const mapScript=s.enabled && s.gradientMapEnabled ? '\n(() => {const tables='+effectAPI.tables.toString()+';const populate='+effectAPI.populate.toString()+';let host=document.getElementById("yts-effects");if(!host){host=document.createElement("div");host.id="yts-effects";host.style.cssText="position:absolute;width:0;height:0;overflow:hidden";document.documentElement.appendChild(host);}populate(host,'+JSON.stringify(s.gradientMapStops)+','+s.gradientMapAmount+');})();' : '';

    return `/* YouTube Theme Studio: add the generated CSS separately. Uploaded background media works in the extension. */\n(() => {\n  const settings = ${payload};\n  const normalize = value => value;\n  const updateBrand = ${updateBrand.toString()};\n  const createTitleController = ${createTitleController.toString()};\n  const loadUploadedFont = ${loadUploadedFont.toString()};\n  const loadAllFonts = ${loadAllFonts.toString()};\n  const createInteractions = ${interactionAPI.create.toString()};\n  const createSearch = ${searchAPI.create.toString()};\n  const search = createSearch(document, typeof window === 'undefined' ? null : window);\n  search.update(settings);\n  const interactions = createInteractions(document, typeof window === 'undefined' ? null : window);\n  const updateTitle = createTitleController(document);\n  const fontState = {};\n  let queued = false;\n  const update = () => { queued = false; updateBrand(settings, document); interactions.refresh(); updateTitle(settings); };\n  const start = () => { loadAllFonts(settings, document, fontState); interactions.update(settings); update(); new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(update); } }).observe(document.documentElement, { childList: true, characterData: true, subtree: true }); };\n  if (document.documentElement) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });\n})();\n${mapScript}${s.enabled && (s.backgroundMode==='shader'||s.frames.site.enabled) ? '\n(() => {const settings='+JSON.stringify({enabled:s.enabled,backgroundMode:s.backgroundMode,shader:s.shader,frames:s.frames})+';'+(s.backgroundMode==='shader'?'const shader=('+shaderAPI.create.toString()+')(document,window);shader.update(settings);document.addEventListener("yt-navigate-finish",()=>shader.refresh());document.addEventListener("DOMContentLoaded",()=>shader.refresh(),{once:true});':'')+(s.frames.site.enabled?'const frame=('+designAPI.createFrame.toString()+')(document);frame.update(settings);':'')+'})();' : ''}`;
  }
  const api = { defaults, normalize, makeCSS, makeJS, updateBrand, createTitleController, loadUploadedFont, loadAllFonts, gradientImage, styleBackgroundMedia, fontStacks, surfaces, typeTargets };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ThemeStudio = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
