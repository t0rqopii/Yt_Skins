/* Shared, versioned design primitives. Validation and CSS are independent of the editor. */
(function(root) {
  'use strict';
  const shaderDefaults = {shape:'wave',color1:'#b8a4ff',color2:'#ffb697',color3:'#5465bb',speed:35,strength:55,density:140,frequency:35,amplitude:45,zoom:100,rotation:0,tilt:30,positionX:0,positionY:0,brightness:100,reflection:30,grain:8,seed:12,animate:true,pointer:true,quality:'balanced'};
  const frameDefaults = {enabled:false,style:'gradient',color:'#b8a4ff',color2:'#ffb697',width:3,radius:16,gap:0,glow:12,opacity:100,trigger:'always',animate:false,speed:8};
  const cursorDefaults = {enabled:false,style:'ring',color:'#c7b5ff',size:28,image:'',hotspotX:0,hotspotY:0};
  const number = (value,fallback,min,max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min,Math.min(max,value)) : fallback;
  const color = (value,fallback) => /^#[\da-f]{6}$/i.test(typeof value==='string'?value:'') ? value.toLowerCase() : fallback;
  const choice = (value,fallback,values) => values.includes(value)?value:fallback;
  function normalize(source) {
    const raw=source.shader || {}, shader={...shaderDefaults};
    for(const key of ['color1','color2','color3']) shader[key]=color(raw[key],shader[key]);
    for(const [key,min,max] of [['speed',0,150],['strength',0,100],['density',20,400],['frequency',1,100],['amplitude',0,100],['zoom',40,250],['rotation',-180,180],['tilt',0,80],['positionX',-100,100],['positionY',-100,100],['brightness',25,200],['reflection',0,100],['grain',0,50],['seed',0,999]]) shader[key]=number(raw[key],shader[key],min,max);
    shader.shape=choice(raw.shape,shader.shape,['plane','wave','sphere']);
    shader.quality=choice(raw.quality,shader.quality,['eco','balanced','high']);
    for(const key of ['animate','pointer']) if(typeof raw[key]==='boolean')shader[key]=raw[key];
    const frames={};
    for(const target of ['thumbnail','avatar','site']) {
      const input=source.frames?.[target] || {}, f={...frameDefaults,radius:target==='avatar'?50:target==='site'?0:16};
      for(const key of ['enabled','animate'])f[key]=input[key]===true;
      for(const key of ['color','color2'])f[key]=color(input[key],f[key]);
      for(const [key,min,max] of [['width',1,12],['radius',0,100],['gap',0,16],['glow',0,50],['opacity',0,100],['speed',2,30]])f[key]=number(input[key],f[key],min,max);
      f.style=choice(input.style,f.style,['solid','gradient','double','dashed','neon','corners']);
      f.trigger=choice(input.trigger,f.trigger,target==='site'?['always','fullscreen']:['always','hover']);
      frames[target]=f;
    }
    const input=source.cursor || {}, cursor={...cursorDefaults,enabled:input.enabled===true};
    cursor.style=choice(input.style,cursor.style,['ring','dot','crosshair','spark','arrow','custom']);
    cursor.color=color(input.color,cursor.color); cursor.size=Math.round(number(input.size,28,16,64));
    for(const key of ['hotspotX','hotspotY'])cursor[key]=Math.round(number(input[key],0,0,cursor.size-1));
    if(typeof input.image==='string' && input.image.length<=350000 && /^data:image\/(png|webp);base64,[a-z0-9+/=]+$/i.test(input.image))cursor.image=input.image;
    return {shader,frames,cursor};
  }
  const targets=(typeof module!=='undefined'&&module.exports?require('./selectors.js'):root.ThemeSelectors).frameTargets;
  function framePaint(f) {
    const fill=f.style==='gradient'?`linear-gradient(135deg,${f.color},${f.color2},${f.color})`:f.color;
    return `box-sizing:border-box; border-radius:${f.radius}${f.radius===50?'%':'px'}; opacity:${f.opacity/100}; ${['double','dashed'].includes(f.style)?`border:${f.width}px ${f.style} ${f.color};`:`border:${f.width}px solid transparent; background:${fill} border-box; -webkit-mask:linear-gradient(#fff 0 0) padding-box,linear-gradient(#fff 0 0); -webkit-mask-composite:xor; mask-composite:exclude;`} filter:drop-shadow(0 0 ${f.style==='neon'?Math.max(f.glow,6):f.glow}px ${f.color}); ${f.style==='corners'?'clip-path:polygon(0 0,28% 0,28% 8%,72% 8%,72% 0,100% 0,100% 28%,92% 28%,92% 72%,100% 72%,100% 100%,72% 100%,72% 92%,28% 92%,28% 100%,0 100%,0 72%,8% 72%,8% 28%,0 28%);':''}${f.animate?`background-size:300% 300%;animation:yts-frame-flow ${f.speed}s ease-in-out infinite alternate;`:''}`;
  }
  function cursorURL(c) {
    if(c.style==='custom' && c.image)return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${c.size}" height="${c.size}" viewBox="0 0 64 64"><image href="${c.image}" width="64" height="64"/></svg>`);
    const paths={ring:'<circle cx="16" cy="16" r="10" fill="none" stroke-width="2"/><circle cx="16" cy="16" r="2" stroke="none"/>',dot:'<circle cx="16" cy="16" r="5"/>',crosshair:'<path d="M16 3v9m0 8v9M3 16h9m8 0h9" fill="none" stroke-width="2"/><circle cx="16" cy="16" r="2"/>',spark:'<path d="m16 2 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" stroke-width="1"/>',arrow:'<path d="m5 3 20 15-10 1-4 10Z" stroke-width="1"/>'};
    return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${c.size}" height="${c.size}" viewBox="0 0 32 32" fill="${c.color}" stroke="${c.color}">${paths[c.style]||paths.ring}</svg>`);
  }
  function makeCSS(s) {
    if(!s.enabled)return '';
    const css=[];
    if(s.backgroundMode==='shader')css.push(`ytd-app::before {content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 25% 25%,${s.shader.color1},transparent 70%),linear-gradient(135deg,${s.shader.color2},${s.shader.color3});} #yts-shader {position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;} #yts-shader canvas {display:block;width:100%;height:100%;} #yts-shader canvas[hidden] {display:none !important;}`);
    for(const [key,selector] of Object.entries(targets)) {
      const f=s.frames[key];if(!f.enabled)continue;
      css.push(`${selector} {position:relative;isolation:isolate;${key==='thumbnail'?`border-radius:${f.radius}px !important;`:''}}`,`${selector}::after {content:"";position:absolute;inset:${f.gap}px;z-index:8;pointer-events:none;${framePaint(f)}${key==='thumbnail'?'border-radius:inherit;':''}${f.trigger==='hover'?'opacity:0;':''}}`);
      if(f.trigger==='hover')css.push(`${selector}:is(:hover,:focus-within)::after {opacity:${f.opacity/100};}`);
    }
    const f=s.frames.site;
    if(f.enabled)css.push(`#yts-site-frame {position:fixed;inset:${f.gap}px;z-index:2147483646;pointer-events:none;${framePaint(f)}}`);
    if(s.cursor.enabled) {
      const c=s.cursor,hot=c.style==='custom'?`${c.hotspotX} ${c.hotspotY}`:c.style==='arrow'?`${Math.round(c.size*5/32)} ${Math.round(c.size*3/32)}`:`${Math.floor(c.size/2)} ${Math.floor(c.size/2)}`;
      css.push(`ytd-app, ytd-app :is(a,button,[role=button],yt-thumbnail-view-model) {cursor:url("${cursorURL(c)}") ${hot},auto !important;} ytd-app :is(input:not([type=range]):not([type=checkbox]),textarea,[contenteditable=true]) {cursor:text !important;}`);
    }
    css.push('@keyframes yts-frame-flow {from {background-position:0% 50%}to {background-position:100% 50%}} @media(prefers-reduced-motion:reduce) {#yts-site-frame, ytd-thumbnail::after, yt-thumbnail-view-model::after, .ytLockupMetadataViewModelAvatar::after, .ytLockupViewModelAvatar::after, #avatar-link::after, #avatar-btn::after, #author-thumbnail::after, #channel-thumbnail::after, #avatar::after, .user-avatar::after {animation:none !important;}}');
    return css.join('\n');
  }
  // A real fullscreen element has its own top layer; the frame must move inside it.
  function createFrame(doc) {
    let settings, node;
    function refresh() {
      const f=settings?.frames?.site, fullscreen=doc.fullscreenElement;
      const show=settings?.enabled && f?.enabled && (f.trigger==='always'||fullscreen||doc.documentElement.dataset.previewFullscreen==='true');
      if(!show){node?.remove();node=null;return;}
      const parent=fullscreen||doc.body;if(!parent)return;
      if(!node){node=doc.createElement('div');node.id='yts-site-frame';node.setAttribute('aria-hidden','true');}
      if(node.parentNode!==parent)parent.appendChild(node);
    }
    doc.addEventListener('fullscreenchange',refresh);
    return {update(s){settings=s;refresh();},refresh,destroy(){node?.remove();doc.removeEventListener('fullscreenchange',refresh);}};
  }
  const api={shaderDefaults,frameDefaults,cursorDefaults,normalize,makeCSS,framePaint,cursorURL,createFrame};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  root.ThemeDesign=api;
})(typeof globalThis!=='undefined'?globalThis:this);
