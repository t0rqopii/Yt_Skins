/* Validated theme data and migration boundary. No browser dependencies. */
(function(root) {
'use strict';
  const design = typeof module !== 'undefined' && module.exports ? require('./design.js') : root.ThemeDesign;
  const defaults = {
    ...design.normalize({}),
    hidePageScrollbar:false, hideSidebarScrollbar:false,
    playerBlend:true, playerRadius:18,
    backgroundTint:'#8575d6', backgroundTintOpacity:0, backgroundVignette:0,
    backgroundBrightness:100, backgroundSaturation:100, backgroundContrast:100,
    backgroundPositionX:50, backgroundPositionY:50, backgroundZoom:100, backgroundFlip:false,
    backgroundPattern:'none', backgroundPatternColor:'#ffffff', backgroundPatternOpacity:12, backgroundPatternSize:32,
    backgroundVideoSpeed:100, backgroundVideoPaused:false,
    titleGradientAngle:110, titleGradientMotion:false, titleShadow:0,
    highlightOpacity:85, highlightPadding:4, highlightRadius:4,
    gradientRepeat:false, gradientMapEnabled:false, gradientMapAmount:100, gradientMapTarget:'thumbnails',
    elements: {}, customCSS: '', customCSSEnabled: true, feedColumns: 0, feedGap: 20,
    enabled: true, brandName: '', logo: '', surfaces: {}, typeAreas: {}, profileSwitcher: true, companionEnabled: false, companionImage: '', companionWink: '', companionSide: 'right', companionSize: 110, companionOffset: 20, playerGlow: true, playerGlowColor: '#ff7066', playerGlowRadius: 20, playerProgress: '#ff7066', logoGlowStrength: 8, logoEasing: 'ease-in-out',
    background: '#0f0f0f', surface: '#202020', panelTransparency: 55, surfaceStyle:'standard', glassBlur:12, text: '#f1f1f1',
    muted: '#aaaaaa', accent: '#ff7066', title1: '#ffb783', title2: '#ff708f',
    titleStyle: 'solid', titleHighlight: false, gradientMotion:false, searchPopupEnabled:false, searchBackdropOpacity:40, searchBackdropBrightness:80, searchGlassOpacity:90, highlightColor: '#3e3036', gradientBackground: false, gradientColor: '#342138',
    gradientSpeed: 18, backgroundMode: 'solid', gradientType: 'linear', gradientColor2: '#3c7193', gradientColor3: '#8a416b', gradientAngle: 125, gradientSpread: 65, gradientX1:20, gradientY1:30, gradientX2:75, gradientY2:35, gradientX3:50, gradientY3:80, backgroundDim: 25, backgroundBlur: 0, backgroundFit: 'cover', backgroundAssetVersion: '', backgroundAssetName: '', backgroundAssetType:'',
    logoAnimation: 'none', logoAnimationTarget: 'both', logoAnimationSpeed: 3, logoPathEnabled:false, logoPathPoints:[], logoPathDuration:8, logoPathLoop:'alternate',
    hoverSticker:'', hoverStickerName:'', hoverStickerEnabled:false, hoverStickerSize:96, hoverStickerPosition:'right', hoverStickerDuration:90, hoverStickerEffect:'pop',
    searchBackground: '#202020', searchText: '#f1f1f1', searchBorder: '#454545', searchRadius: 24, chipBackground: '#303030', chipText: '#f1f1f1', chipSelectedBackground: '#f1f1f1', chipSelectedText: '#0f0f0f', chipRadius: 8, glowMode:'off', glowColor:'#ff7066', glowRadius:14, glowSearch:true, glowCategories:true, glowButtons:false,
    hover: 'lift', radius: 14, fontSize: 16, cardWidth: 320,
    pageFont: 'default', brandFont: 'default', titleFont: 'default', channelFont: 'default', descriptionFont: 'default', searchFont:'default', categoryFont:'default', sidebarFont:'default', metadataFont:'default', customFont: '', customFontName: '', customFonts: {},
    hideChannel: false, hideViews: false, hideDate: false, hideAvatars: false,
    hideShorts: false, hideComments: false, hideSidebar: false, hideRecommendations: false,
    hideChips: false, hideEndScreen: false, hideNotifications: false,
    hideCreate: false, hideDescription: false, hideVideoCount: false
  };
  const bools = Object.keys(defaults).filter(k => typeof defaults[k] === 'boolean');
  const colors = ['background', 'surface', 'text', 'muted', 'accent', 'title1', 'title2', 'highlightColor', 'gradientColor', 'gradientColor2', 'gradientColor3', 'searchBackground', 'searchText', 'searchBorder', 'chipBackground', 'chipText', 'chipSelectedBackground', 'chipSelectedText', 'glowColor', 'playerGlowColor', 'playerProgress'];
  const fontKeys = ['pageFont', 'brandFont', 'titleFont', 'channelFont', 'descriptionFont', 'searchFont', 'categoryFont', 'sidebarFont', 'metadataFont'];
  const fontStacks = { default: '', system: 'system-ui, sans-serif', arial: 'Arial, sans-serif', verdana: 'Verdana, sans-serif', trebuchet: '"Trebuchet MS", sans-serif', georgia: 'Georgia, serif', times: '"Times New Roman", serif', palatino: '"Palatino Linotype", serif', courier: '"Courier New", monospace', consolas: 'Consolas, monospace', impact: 'Impact, sans-serif', comic: '"Comic Sans MS", cursive', custom: '"YTS Uploaded Font", sans-serif' };
  const allowed = { gradientMapTarget:['thumbnails','background','both'], surfaceStyle:['standard','glass'], titleStyle: ['match', 'solid', 'gradient', 'alternating'], hover: ['none', 'lift', 'zoom', 'glow'], backgroundMode:['solid','gradient','shader','image','video'], gradientType:['aurora','linear','radial','conic'], backgroundFit:['cover','contain'], logoAnimation:['none','float','pulse','spin','glow','wave'], logoAnimationTarget:['both','image','name'], logoPathLoop:['alternate','loop'], glowMode:['off','hover','always'], hoverStickerPosition:['left','right'], hoverStickerEffect:['pop','fade','slide'], companionSide:['left','right'], logoEasing:['linear','ease','ease-in','ease-out','ease-in-out'] };
  for (const key of fontKeys) allowed[key] = Object.keys(fontStacks);
  const ranges = { companionSize:[32,300], companionOffset:[0,90], playerGlowRadius:[0,60], logoGlowStrength:[0,40], panelTransparency:[0,100], glassBlur:[0,20], searchBackdropOpacity:[0,90], searchBackdropBrightness:[30,150], searchGlassOpacity:[50,100], gradientSpeed: [5, 120], gradientAngle:[0,360], gradientSpread:[20,100], gradientX1:[0,100],gradientY1:[0,100],gradientX2:[0,100],gradientY2:[0,100],gradientX3:[0,100],gradientY3:[0,100], backgroundDim:[0,85], backgroundBlur:[0,20], logoAnimationSpeed:[1,15], logoPathDuration:[2,60], glowRadius:[2,40], hoverStickerSize:[32,200], hoverStickerDuration:[0,500], searchRadius:[0,36], chipRadius:[0,30], radius: [0, 32], fontSize: [12, 24], cardWidth: [220, 500] };
  colors.push('backgroundTint','backgroundPatternColor');
  allowed.backgroundPattern = ['none','dots','grid','diagonal'];
  Object.assign(ranges, {playerRadius:[0,60], backgroundTintOpacity:[0,100], backgroundVignette:[0,100], backgroundBrightness:[25,175], backgroundSaturation:[0,200], backgroundContrast:[25,175], backgroundPositionX:[0,100], backgroundPositionY:[0,100], backgroundZoom:[100,200], backgroundPatternOpacity:[0,100], backgroundPatternSize:[8,120], backgroundVideoSpeed:[25,200]});
  function normalize(input) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const out = { ...defaults };
    for (const key of bools) if (typeof source[key] === 'boolean') out[key] = source[key];
    for (const key of colors) if (typeof source[key] === 'string' && /^#[0-9a-f]{6}$/i.test(source[key])) out[key] = source[key].toLowerCase();
    for (const key of Object.keys(allowed)) if (allowed[key].includes(source[key])) out[key] = source[key];
    for (const key of Object.keys(ranges)) {
      if (typeof source[key] === 'number' && Number.isFinite(source[key])) out[key] = Math.round(Math.max(ranges[key][0], Math.min(ranges[key][1], source[key])));
    }
    if (typeof source.brandName === 'string') out.brandName = source.brandName.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 40);
    if (typeof source.logo === 'string' && source.logo.length <= 4200000 && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(source.logo)) out.logo = source.logo;
    if (typeof source.hoverSticker === 'string' && source.hoverSticker.length <= 2800000 && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(source.hoverSticker)) out.hoverSticker = source.hoverSticker;
    if (Array.isArray(source.logoPathPoints)) out.logoPathPoints = source.logoPathPoints.slice(0,300).filter(p => p && typeof p.x === 'number' && Number.isFinite(p.x) && typeof p.y === 'number' && Number.isFinite(p.y)).map(p => ({x:Math.max(0,Math.min(1,p.x)),y:Math.max(0,Math.min(1,p.y))}));
    if (out.hoverSticker && typeof source.hoverStickerName === 'string') out.hoverStickerName = source.hoverStickerName.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80);
    if (typeof source.customFont === 'string' && source.customFont.length <= 2800000 && /^data:font\/(woff2|woff|ttf|otf);base64,[a-z0-9+/=]+$/i.test(source.customFont)) out.customFont = source.customFont;
    if (out.customFont && typeof source.customFontName === 'string') out.customFontName = source.customFontName.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 80);
    out.customFonts = {};
    if (source.customFonts && typeof source.customFonts === 'object') for (const key of fontKeys) {
      const entry = source.customFonts[key];
      if (entry && typeof entry.data === 'string' && entry.data.length <= 1400000 && /^data:font\/(woff2|woff|ttf|otf);base64,[a-z0-9+/=]+$/i.test(entry.data)) {
        out.customFonts[key] = { data:entry.data, name:typeof entry.name === 'string' ? entry.name.replace(/[\u0000-\u001f\u007f]/g, '').slice(0,80) : '' };
        if(['manrope','sourcesans3','spacegrotesk','sourceserif4'].includes(entry.library))out.customFonts[key].library=entry.library;
      }
    }
    if (!Object.hasOwn(source, 'backgroundMode')) out.backgroundMode = out.gradientBackground ? 'gradient' : 'solid';
    if (typeof source.backgroundAssetVersion === 'string' && /^[a-z0-9-]{1,80}$/i.test(source.backgroundAssetVersion)) out.backgroundAssetVersion = source.backgroundAssetVersion;
    if (typeof source.backgroundAssetName === 'string') out.backgroundAssetName = source.backgroundAssetName.replace(/[\u0000-\u001f\u007f]/g, '').slice(0,80);
    if (['image','video'].includes(source.backgroundAssetType)) out.backgroundAssetType = source.backgroundAssetType;
    else if (out.backgroundAssetVersion && /\.(mp4|webm)$/i.test(out.backgroundAssetName)) out.backgroundAssetType = 'video';
    else if (out.backgroundAssetVersion && /\.(png|jpe?g|webp|gif)$/i.test(out.backgroundAssetName)) out.backgroundAssetType = 'image';
    // Existing themes retain their old search and category colors until customized.
    for (const [key, fallback] of Object.entries({searchBackground:'surface', searchText:'text', searchBorder:'muted', chipBackground:'surface', chipText:'text', chipSelectedBackground:'text', chipSelectedText:'background'})) if (!Object.hasOwn(source, key)) out[key] = out[fallback];
    const clamp = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
    const color = (v, fallback) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;
    out.titleGradientAngle=clamp(source.titleGradientAngle,110,0,360);
    out.titleShadow=clamp(source.titleShadow,0,0,20);
    for(const [key,fallback,min,max] of [['highlightOpacity',85,0,100],['highlightPadding',4,0,16],['highlightRadius',4,0,24],['gradientMapAmount',100,0,100]]) out[key]=clamp(source[key],fallback,min,max);
    const mapStops=Array.isArray(source.gradientMapStops)?source.gradientMapStops.filter(s=>s && typeof s==='object').slice(0,8):[];
    out.gradientMapStops=mapStops.length>=2?mapStops.map((s,i)=>({color:color(s.color,i?'#f6cf9a':'#182a45'),alpha:100,position:clamp(s.position,i*100/(mapStops.length-1),0,100)})):[{color:'#182a45',alpha:100,position:0},{color:'#f6cf9a',alpha:100,position:100}];
    const legacyStops = out.gradientType === 'radial'
      ? [[out.gradientColor,0],[out.gradientColor2,out.gradientSpread],[out.background,100]]
      : [[out.background,0],[out.gradientColor,25],[out.gradientColor2,50],[out.gradientColor3,75],[out.background,100]];
    const suppliedStops = Array.isArray(source.backgroundStops) ? source.backgroundStops.filter(s=>s && typeof s==='object').slice(0,8) : [];
    out.backgroundStops = suppliedStops.length >= 2 ? suppliedStops.map((s,i)=>({color:color(s.color,out.gradientColor),alpha:clamp(s.alpha,100,0,100),position:clamp(s.position,i*100/(suppliedStops.length-1),0,100)}))
      : (Object.hasOwn(source,'gradientType') ? legacyStops : [[out.gradientColor,0],[out.gradientColor2,100]]).map(([color,position])=>({color,position,alpha:100}));
    for (const key of ['companionImage','companionWink']) if (typeof source[key] === 'string' && source[key].length <= 2800000 && /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(source[key])) out[key] = source[key];
    out.surfaces = {};
    for (const name of ['header','sidebar','chips','search','menus','player']) {
      const raw = source.surfaces && source.surfaces[name] && typeof source.surfaces[name] === 'object' ? source.surfaces[name] : {};
      const base = name === 'search' ? out.searchBackground : out.surface;
      const opacity = name === 'menus' ? Math.max(85, 100-out.panelTransparency) : 100-out.panelTransparency;
      const stops = Array.isArray(raw.stops) ? raw.stops.slice(0,8).filter(x => x && typeof x === 'object') : [];
      out.surfaces[name] = {
        linked:typeof raw.linked === 'boolean' ? raw.linked : stops.every(s=>color(s.color,base)===base),
        fillMode:['solid','gradient'].includes(raw.fillMode) ? raw.fillMode : stops.some(s=>s.color!==stops[0].color || s.alpha!==stops[0].alpha) ? 'gradient' : 'solid',
        blur:clamp(raw.blur, out.surfaceStyle === 'glass' ? out.glassBlur : 0, 0, 40), saturate:clamp(raw.saturate, 140, 0, 250),
        opacity:clamp(raw.opacity, opacity, 0, 100), border:clamp(raw.border, 12, 0, 100), angle:clamp(raw.angle, 135, 0, 360), drift:raw.drift === true,
        stops:stops.length ? stops.map((stop,i) => ({color:color(stop.color,base), alpha:clamp(stop.alpha,100,0,100), position:clamp(stop.position,stops.length === 1 ? 0 : Math.round(i*100/(stops.length-1)),0,100)})) : [{color:base,alpha:100,position:0},{color:base,alpha:100,position:100}],
        glowMode:['off','hover','always'].includes(raw.glowMode) ? raw.glowMode : (name === 'search' && out.glowSearch ? out.glowMode : 'off'),
        glowColor:color(raw.glowColor,out.glowColor), glowRadius:clamp(raw.glowRadius,out.glowRadius,0,60)
      };
    }
    Object.assign(out, design.normalize(source));
    out.typeAreas = {};
    for (const key of fontKeys) {
      const raw = source.typeAreas && source.typeAreas[key] && typeof source.typeAreas[key] === 'object' ? source.typeAreas[key] : {};
      out.typeAreas[key] = {
        weight:clamp(raw.weight,0,0,900), size:clamp(raw.size,key === 'titleFont' ? out.fontSize : 0,0,72), spacing:clamp(raw.spacing,0,-5,10),
        lineHeight:clamp(raw.lineHeight,0,0,3), wordSpacing:clamp(raw.wordSpacing,0,-3,20), stretch:clamp(raw.stretch,100,50,200),
        transform:['none','uppercase','lowercase','capitalize'].includes(raw.transform)?raw.transform:'none',
        style:raw.style==='italic'?'italic':'normal', decoration:['none','underline','line-through'].includes(raw.decoration)?raw.decoration:'none',
        smallCaps:raw.smallCaps===true, ligatures:raw.ligatures!==false
      };
    }
    out.feedColumns = Math.round(clamp(source.feedColumns, 0, 0, 6));
    out.feedGap = Math.round(clamp(source.feedGap, 20, 0, 64));
    out.customCSS = typeof source.customCSS === 'string' ? source.customCSS.slice(0,100000) : '';
    out.elements = {};
    for (const target of ['card','thumbnail','title','channel','metadata','search','category','button','brand','description','playerFrame']) {
      const entry = source.elements?.[target];
      if (!entry || typeof entry !== 'object') continue;
      out.elements[target] = {};
      for (const state of ['base','hover']) {
        const raw = entry[state];
        if (!raw || typeof raw !== 'object') continue;
        const rule = {};
        for (const key of ['background','color','borderColor','shadowColor']) if (typeof raw[key] === 'string' && /^#[0-9a-f]{6}$/i.test(raw[key])) rule[key] = raw[key].toLowerCase();
        for (const [key,min,max] of [['radius',0,100],['borderWidth',0,12],['padding',0,64],['opacity',0,100],['shadow',0,100],['translateX',-100,100],['translateY',-100,100],['rotate',-180,180],['scale',25,200]]) {
          if (typeof raw[key] === 'number' && Number.isFinite(raw[key])) rule[key] = clamp(raw[key],0,min,max);
        }
        if (Object.keys(rule).length) out.elements[target][state] = rule;
      }
    }
    return out;
  }
  function applyPatch(current, patch) {
    const next = {...current, ...patch};
    // A whole surface/profile patch is authoritative. Otherwise carry palette edits
    // into linked stops, preserving independently chosen surface colors.
    if (!Object.hasOwn(patch, 'surfaces')) {
      const changed = ['surface','searchBackground'].filter(k => Object.hasOwn(patch,k) && patch[k] !== current[k]);
      if (changed.length) next.surfaces = Object.fromEntries(Object.entries(current.surfaces).map(([name,g]) => [name, {...g, stops:g.stops.map(stop => {
        const key = g.linked && changed.find(k => k === (name === 'search' ? 'searchBackground' : 'surface'));
        return key ? {...stop,color:patch[key]} : stop;
      })}]));
    }
    return normalize(next);
  }
  const api = {defaults, normalize, applyPatch, fontStacks, fontKeys};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ThemeSchema = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
