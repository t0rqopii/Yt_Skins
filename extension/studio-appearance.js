/* Editor-only fonts and light. Separate from YouTube profiles and exports. */
(function(root) {
  'use strict';
  const storageKey='yts-studio-typography';
  const fonts={
    studio:{label:'Manrope · Geometric',stack:'"Manrope", sans-serif',bundled:true},
    source:{label:'Source Sans 3 · Adobe',stack:'"Source Sans 3", sans-serif',bundled:true},
    grotesk:{label:'Space Grotesk · Display',stack:'"Space Grotesk", sans-serif',bundled:true},
    serif:{label:'Source Serif 4 · Adobe',stack:'"Source Serif 4", serif',bundled:true},
    system:{label:'System Sans',stack:'system-ui, sans-serif'},
    humanist:{label:'Trebuchet MS',stack:'"Trebuchet MS", sans-serif'},
    classic:{label:'Arial',stack:'Arial, sans-serif'},
    editorial:{label:'Georgia',stack:'Georgia, serif'},
    mono:{label:'Consolas',stack:'Consolas, monospace'},
    custom:{label:'Your uploaded font',stack:''}
  };
  const defaults={sidebarFont:'studio',controlsFont:'source',sidebarWeight:500,controlsWeight:500,atmosphere:'aurora',finish:'liquid',motion:false,uploads:{}};
  function normalize(value) {
    const source=value && typeof value==='object'?value:{};
    const result={...defaults,uploads:{}};
    for(const key of ['sidebarFont','controlsFont']) {
      const entry=source.uploads?.[key];
      if(entry && typeof entry.data==='string' && entry.data.length<=1400000 && /^data:font\/(woff2|woff|ttf|otf);base64,[a-z0-9+/=]+$/i.test(entry.data))
        result.uploads[key]={data:entry.data,name:String(entry.name||'Uploaded font').replace(/[\u0000-\u001f\u007f]/g,'').slice(0,80)};
      if(Object.hasOwn(fonts,source[key]) && (source[key]!=='custom' || result.uploads[key])) result[key]=source[key];
    }
    for(const key of ['sidebarWeight','controlsWeight']) if([400,500,600,700].includes(source[key]))result[key]=source[key];
    if(['aurora','spotlight','quiet'].includes(source.atmosphere))result.atmosphere=source.atmosphere;
    if(['liquid','pearl','clean'].includes(source.finish))result.finish=source.finish;
    result.motion=source.motion===true;
    return result;
  }
  function mount(doc,storage) {
    let settings; const faces={},tokens={sidebarFont:0,controlsFont:0};
    try{settings=normalize(JSON.parse(storage.getItem(storageKey)));}catch{settings=normalize();}
    const controls=[...doc.querySelectorAll('[data-studio-pref]')];
    for(const control of controls.filter(el=>el.dataset.studioPref.endsWith('Font'))){
      for(const [key,font] of Object.entries(fonts)){
        const option=doc.createElement('option');option.value=key;option.textContent=font.label;control.append(option);
      }
    }
    async function faceFor(key) {
      const status=doc.querySelector('[data-studio-font-status="'+key+'"]');
      const entry=settings.uploads[key], family='Studio '+key;
      const old=faces[key];
      if(settings[key]!=='custom') {
        if(old?.face)doc.fonts.delete(old.face);delete faces[key];
        status.textContent=fonts[settings[key]].bundled?'Bundled font · available offline':'Uses a font installed on this device';
        return;
      }
      if(old?.data===entry.data){status.textContent=old.error?'Could not load this font. Choose another.':entry.name;return;}
      if(old?.face)doc.fonts.delete(old.face);
      const item={data:entry.data};faces[key]=item;
      status.textContent='Loading '+entry.name+'…';
      try {
        const font=new FontFace(family,'url('+entry.data+')',{weight:'100 900'});
        await font.load();if(faces[key]!==item)return;
        doc.fonts.add(font);item.face=font;status.textContent=entry.name+' · loaded';
      }catch{if(faces[key]===item){item.error=true;status.textContent='Could not load this font. Choose another.';}}
    }
    function render(){
      const style=doc.documentElement.style;
      for(const [key,variable] of [['sidebarFont','--studio-sidebar-font'],['controlsFont','--studio-controls-font']]){
        style.setProperty(variable,settings[key]==='custom'?'"Studio '+key+'", sans-serif':fonts[settings[key]].stack);
        const custom=doc.querySelector('[data-studio-pref="'+key+'"] option[value=custom]');
        custom.disabled=!settings.uploads[key];
        custom.textContent=settings.uploads[key]?.name||'Upload your font below';
        doc.querySelector('[data-studio-remove="'+key+'"]').hidden=!settings.uploads[key];
        faceFor(key);
      }
      style.setProperty('--studio-sidebar-weight',settings.sidebarWeight);
      style.setProperty('--studio-controls-weight',settings.controlsWeight);
      doc.documentElement.dataset.atmosphere=settings.atmosphere;
      doc.documentElement.dataset.finish=settings.finish;
      doc.documentElement.dataset.ambientMotion=String(settings.motion);
      controls.forEach(el=>{if(el.type==='checkbox')el.checked=settings[el.dataset.studioPref];else el.value=String(settings[el.dataset.studioPref]);});
    }
    function save(){
      render();
      try{storage.setItem(storageKey,JSON.stringify(settings));doc.querySelector('#studio-type-status').textContent='Studio appearance saved';}
      catch{doc.querySelector('#studio-type-status').textContent='Applied for this visit · storage is full or unavailable';}
    }
    controls.forEach(el=>el.addEventListener('change',()=>{
      const key=el.dataset.studioPref;
      if(key.endsWith('Font'))tokens[key]++;
      settings=normalize({...settings,[key]:el.type==='checkbox'?el.checked:key.endsWith('Weight')?Number(el.value):el.value});save();
    }));
    doc.querySelectorAll('[data-studio-upload]').forEach(input=>input.addEventListener('change',async()=>{
      const key=input.dataset.studioUpload,file=input.files[0];input.value='';if(!file)return;
      const token=++tokens[key];
      doc.querySelector('#studio-type-status').textContent='Checking font…';
      try{
        const entry=await StudioFonts.uploaded(file);if(token!==tokens[key])return;
        settings=normalize({...settings,[key]:'custom',uploads:{...settings.uploads,[key]:entry}});save();
      }catch(error){if(token===tokens[key])doc.querySelector('#studio-type-status').textContent=error.message;}
    }));
    doc.querySelectorAll('[data-studio-remove]').forEach(button=>button.addEventListener('click',()=>{
      const key=button.dataset.studioRemove;tokens[key]++;
      const uploads={...settings.uploads};delete uploads[key];
      settings=normalize({...settings,[key]:settings[key]==='custom'?defaults[key]:settings[key],uploads});save();
    }));
    doc.querySelector('#reset-studio-type').addEventListener('click',()=>{
      tokens.sidebarFont++;tokens.controlsFont++;
      settings=normalize({...settings,sidebarFont:defaults.sidebarFont,controlsFont:defaults.controlsFont,sidebarWeight:500,controlsWeight:500});save();
    });
    root.addEventListener('storage',event=>{
      if(event.key!==storageKey && event.key!==null)return;
      tokens.sidebarFont++;tokens.controlsFont++;
      try{settings=normalize(JSON.parse(event.newValue));}catch{settings=normalize();}render();
    });
    render();
  }
  if(typeof module!=='undefined' && module.exports)module.exports={fonts,defaults,normalize};
  if(typeof document!=='undefined'){let storage;try{storage=root.localStorage;}catch{}mount(document,storage);}
})(globalThis);
