(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const colors = [
    ['background', 'Background'], ['surface', 'Panels'], ['text', 'Main text & icons'], ['muted', 'Secondary text'],
    ['accent', 'Accent']
  ];
  const gradients = [['gradientColor','Gradient color 1'],['gradientColor2','Gradient color 2'],['gradientColor3','Gradient color 3']];
  const searchColors = [['searchBackground','Search fill'],['searchText','Search text & icon'],['searchBorder','Search outline']];
  const chipColors = [['chipBackground','Category background'],['chipText','Category text'],['chipSelectedBackground','Selected background'],['chipSelectedText','Selected text']];
  const glowColors = [['glowColor','Glow color']];
  const fonts = [['default','YouTube default'], ['system','System'], ['arial','Arial'], ['verdana','Verdana'], ['trebuchet','Trebuchet MS'], ['georgia','Georgia'], ['times','Times New Roman'], ['palatino','Palatino'], ['courier','Courier New'], ['consolas','Consolas'], ['impact','Impact'], ['comic','Comic Sans'], ['custom','Uploaded font']];
  const fontAreas = [['pageFont','Whole page'], ['brandFont','Custom name'], ['titleFont','Video titles'], ['channelFont','Channel names'], ['descriptionFont','Descriptions'], ['searchFont','Search'], ['categoryFont','Categories'], ['sidebarFont','Sidebar'], ['metadataFont','Views & dates']];
  const visibility = [
    ['hidePageScrollbar', 'Page scrollbar'], ['hideSidebarScrollbar', 'Navigation sidebar scrollbar'],
    ['hideChannel', 'Channel names on video cards'], ['hideViews', 'View counts on video cards'],
    ['hideDate', 'Upload dates on video cards'], ['hideAvatars', 'Channel pictures on video cards'],
    ['hideShorts', 'Shorts shelves and guide link'], ['hideComments', 'Comments'],
    ['hideSidebar', 'Navigation sidebar'], ['hideRecommendations', 'Watch-page recommendations'],
    ['hideChips', 'Topic filters'], ['hideEndScreen', 'Video end-screen suggestions'],
    ['hideNotifications', 'Notifications button'], ['hideCreate', 'Create button'],
    ['hideDescription', 'Video description'], ['hideVideoCount', 'Playlist thumbnail overlays']
  ];
  let settings = ThemeStudio.normalize({});
  let profiles = [];
  let selectedProfile = '';
  let exportType = 'css';
  let messageTimer;
  const editorId=crypto.randomUUID();
  let storageRevision=0;
  const startupChanges=new Set();
  document.querySelector('.layout').inert=true;
  let inspector, designStudio;
  const previewFontState = {};
  const fontRequests = {};
  let previewMediaUrl = '', previewMediaKey = '', previewMediaToken = 0;
  let visualEditors, backgroundStopEditor, surfaceStopEditor, mapStopEditor;
  function message(text) { $('#status').textContent = text; clearTimeout(messageTimer); }
  const editor = ThemeEditorState.create(settings, {
    normalize:ThemeStudio.normalize, patch:ThemeSchema.applyPatch,
    write:snapshot=>chrome.storage.local.set({theme:snapshot,themeEditor:{id:editorId,revision:++storageRevision}}),
    onStatus:text=>{ clearTimeout(messageTimer); $('#status').textContent=text; },
    onChange:(next,history)=>{ settings=next; render(); renderGlass(); inspector?.render(); ThemeControls.enhance(); $('#undo').disabled=!history.undo; $('#redo').disabled=!history.redo; }
  });
  function flushSave() { return editor.flush(); }
  window.addEventListener('pagehide', () => { editor.flush().catch(()=>{}); });
  function update(patch, gesture) { const el=document.activeElement; const key=gesture || (el?.matches('input,textarea') ? el : null); editor.update(patch,key); }
  document.addEventListener('change',()=>editor.endGroup());
  document.addEventListener('focusout',()=>editor.endGroup());
  $('#undo').addEventListener('click',()=>editor.undo());
  $('#redo').addEventListener('click',()=>editor.redo());
  document.addEventListener('keydown',event=>{
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='z' && !event.target.matches('input:not([type=range]):not([type=checkbox]):not([type=color]),textarea')) { event.preventDefault(); event.shiftKey ? editor.redo() : editor.undo(); }
    if (event.key==='/' && !event.target.matches('input,textarea,select')) { event.preventDefault(); $('#control-search').focus(); }
  });
  function normalizeProfiles(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(0,25).filter(p => p && typeof p.id === 'string' && /^[a-z0-9-]{1,80}$/i.test(p.id) && typeof p.name === 'string' && p.settings && typeof p.settings === 'object' && !Array.isArray(p.settings)).map(p => ({id:p.id, name:p.name.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,60) || 'Untitled', settings:ThemeStudio.normalize(p.settings)}));
  }
  function renderProfiles() {
    const select = $('#profile-select'); select.replaceChildren();
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Choose a saved profile'; select.appendChild(placeholder);
    profiles.forEach(profile => { const option = document.createElement('option'); option.value = profile.id; option.textContent = profile.name; select.appendChild(option); });
    select.value = selectedProfile;
    $('#profile-update').disabled = !selectedProfile; $('#profile-delete').disabled = !selectedProfile;
  }
  async function saveProfiles(next, selection) {
    try { await chrome.storage.local.set({profiles:next, activeProfile:selection}); profiles = next; selectedProfile = selection; renderProfiles(); return true; }
    catch { message('Could not save profiles'); return false; }
  }
  function initControls() {
    function addColors(list, destination) { list.forEach(([key, label]) => {
      const wrapper = document.createElement('div'); wrapper.className = 'color-control';
      const input = document.createElement('input'); input.type = 'color'; input.dataset.key = key; input.setAttribute('aria-label', label);
      const text = document.createElement('div'); text.className = 'color-details'; const name = document.createElement('span'); name.textContent = label;
      const hex = document.createElement('input'); hex.type = 'text'; hex.className = 'hex-input'; hex.dataset.hexKey = key; hex.maxLength = 7; hex.spellcheck = false; hex.setAttribute('aria-label', `${label} hex value`);
      text.append(name,hex); wrapper.append(input, text); $(destination).appendChild(wrapper);
    }); }
    addColors(colors, '#color-controls'); addColors([['background','Base color']], '#background-color-control'); addColors([['title1','First color'],['title2','Second color']], '#title-controls'); addColors([['highlightColor','Highlight color']], '#highlight-controls'); addColors(gradients, '#gradient-controls'); addColors(searchColors, '#search-controls'); addColors(chipColors, '#chip-controls');
    visibility.forEach(([key, label]) => {
      const wrapper = document.createElement('label'); wrapper.className = 'switch';
      const input = document.createElement('input'); input.type = 'checkbox'; input.dataset.key = key;
      const track = document.createElement('span'); const text = document.createElement('b'); text.textContent = label;
      wrapper.append(input, track, text); $('#visibility-controls').appendChild(wrapper);
    });
    const areaLabel=document.createElement('label');areaLabel.className='field';areaLabel.id='font-area-choice';areaLabel.textContent='Text area';
    const areaSelect=document.createElement('select');areaSelect.setAttribute('aria-label','Text area');fontAreas.forEach(([key,label])=>areaSelect.add(new Option(label,key)));areaLabel.append(areaSelect);$('#font-controls').before(areaLabel);
    areaSelect.addEventListener('change',()=>document.querySelectorAll('[data-font-panel]').forEach(el=>el.hidden=el.dataset.fontPanel!==areaSelect.value));
    fontAreas.forEach(([key, label]) => {
      const wrapper = document.createElement('div'); wrapper.className = 'field'; wrapper.dataset.fontPanel=key; wrapper.hidden=key!=='pageFont';
      const name = document.createElement('label'); name.textContent = label; name.htmlFor = `font-select-${key}`;
      const select = document.createElement('select'); select.id = `font-select-${key}`; select.dataset.key = key;
      select.add(new Option('YouTube default','default'));
      const bundled=document.createElement('optgroup');bundled.label='Studio font library · bundled offline';
      StudioFonts.library.forEach(font=>bundled.append(new Option(font.label+' · '+font.kind,'library:'+font.id)));
      select.append(bundled);
      const installed=document.createElement('optgroup');installed.label='Fonts installed on this device';
      fonts.filter(([value])=>!['default','custom'].includes(value)).forEach(([value,title])=>installed.append(new Option(title,value)));
      select.append(installed);select.add(new Option('Upload a font below','custom'));
      select.addEventListener('input',event=>{event.stopPropagation();chooseFont(key,select.value);});
      const row = document.createElement('div'); row.className = 'file-row';
      const file = document.createElement('input'); file.type = 'file'; file.id = `font-file-${key}`; file.accept = '.woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf'; file.hidden = true;
      const choose = document.createElement('label'); choose.className = 'button subtle'; choose.htmlFor = file.id; choose.textContent = 'Upload for this area';
      const remove = document.createElement('button'); remove.className = 'button subtle'; remove.type = 'button'; remove.textContent = 'Remove';
      const status = document.createElement('small'); status.dataset.fontStatus = key;
      file.addEventListener('change', e => { loadFont(e.target.files[0], key); e.target.value = ''; });
      remove.addEventListener('click', () => { fontRequests[key]=(fontRequests[key]||0)+1; const next = { ...settings.customFonts }; delete next[key]; update({customFonts:next, [key]:'default'}); });
      row.append(choose, remove, file); wrapper.append(name, select, row, status);
      const specimen=document.createElement('div');specimen.className='type-specimen';specimen.dataset.fontSpecimen=key;specimen.textContent='The art of everyday.';
      const glyphs=document.createElement('small');glyphs.textContent='Aa Bb Cc · 0123456789';specimen.append(glyphs);wrapper.append(specimen);
      for (const [field,label,min,max,step] of [['weight','Weight (0 = native)',0,900,1],['size','Size in px (0 = default)',0,72,1],['spacing','Letter spacing in px',-5,10,0.1]]) { const labelEl=document.createElement('label'); labelEl.className='field'; labelEl.textContent=label; const input=document.createElement('input'); input.type='number'; input.min=min; input.max=max; input.step=step; input.dataset.typeArea=key; input.dataset.typeField=field; labelEl.append(input); wrapper.append(labelEl); }
      if(key==='titleFont'){
        const effects=document.createElement('details');effects.className='control-details';
        effects.innerHTML='<summary>Gradient & light effects</summary><label class="field"><span>Title finish</span><select data-key="titleStyle"><option value="match">Match main text</option><option value="solid">Solid color</option><option value="gradient">Gradient ink</option><option value="alternating">Alternating colors</option></select></label><label class="field" data-title-gradient><span>Gradient angle</span><input type="range" data-key="titleGradientAngle" min="0" max="360"></label><label class="switch" data-title-gradient><input type="checkbox" data-key="titleGradientMotion"><span></span><b>Slow gradient sheen</b></label><label class="field"><span>Soft title glow</span><input type="range" data-key="titleShadow" min="0" max="20"></label><p class="hint">Uses your title colors from Colors → Titles. Motion respects reduced-motion preferences.</p>';
        wrapper.append(effects);
      }
      $('#font-controls').appendChild(wrapper);
    });
  }
  let preview;
  document.querySelectorAll('[data-preview-view]').forEach(button => button.addEventListener('click', () => {
    preview?.setView(button.dataset.previewView);
    document.querySelectorAll('[data-preview-view]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }));
  function renderPreview() {
    updatePreviewMedia(settings);
    if (!preview) preview = ThemePreview.create($('#preview-frame'), {onSelect:(target,rect)=>designStudio?.openQuick(target,rect),onShaderStatus:status=>designStudio?.shaderStatus(status),onViewChange:view=>document.querySelectorAll('[data-preview-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.previewView===view)))});
    preview.update(settings, previewMediaUrl);
  }
  function updatePreviewMedia(s) {
    const key = s.enabled && ['image','video'].includes(s.backgroundMode) && s.backgroundAssetVersion ? `${s.backgroundMode}:${s.backgroundAssetVersion}` : '';
    if (key === previewMediaKey) return;
    previewMediaKey=key; const token=++previewMediaToken;
    if (previewMediaUrl) URL.revokeObjectURL(previewMediaUrl); previewMediaUrl='';
    if (!key) return;
    ThemeMedia.get(s.backgroundAssetVersion).then(asset => {
      if (token !== previewMediaToken || !asset || !asset.type.startsWith(s.backgroundMode+'/')) return;
      previewMediaUrl=URL.createObjectURL(asset.blob); renderPreview();
    }).catch(() => message('Could not load the background preview'));
  }
  function render() {
    document.querySelectorAll('[data-key]').forEach(el => {
      let value = settings[el.dataset.key];
      const entry=settings.customFonts[el.dataset.key];
      if(el.id.startsWith('font-select-') && value==='custom' && entry?.library) value='library:'+entry.library;
      if (el.type === 'checkbox') el.checked = value; else if (el.value !== String(value)) el.value = value;
    });
    document.querySelectorAll('[data-hex-key]').forEach(el => { if (document.activeElement !== el) el.value = settings[el.dataset.hexKey]; });
    document.querySelectorAll('[data-output]').forEach(el => { const key = el.dataset.output; el.textContent = settings[key] + (['gradientSpeed','logoAnimationSpeed','logoPathDuration'].includes(key) ? 's' : key === 'hoverStickerDuration' ? 'ms' : key === 'feedColumns' ? (settings[key] ? ' columns' : ' · Auto') : key === 'gradientAngle' ? '°' : ['backgroundTintOpacity','backgroundVignette','backgroundBrightness','backgroundSaturation','backgroundContrast','backgroundPositionX','backgroundPositionY','backgroundZoom','backgroundPatternOpacity','backgroundVideoSpeed','gradientX1','gradientY1','companionOffset','gradientSpread','gradientMapAmount','highlightOpacity','backgroundDim','panelTransparency','searchBackdropOpacity','searchBackdropBrightness','searchGlassOpacity'].includes(key) ? '%' : 'px'); });
    $('#logo-status').textContent = settings.logo ? 'Image or GIF selected and saved on this device.' : 'PNG, JPG, WebP or animated GIF. Maximum 3 MB.';
    $('#legacy-font').hidden = !settings.customFont; $('#font-status').textContent = settings.customFont ? `${settings.customFontName || 'Shared font'} is available to areas without their own upload.` : '';
    renderFontDetails();
    $('#background-status').textContent = ['image','video'].includes(settings.backgroundMode) && (!settings.backgroundAssetVersion || (settings.backgroundAssetType && settings.backgroundAssetType !== settings.backgroundMode)) ? `Choose a ${settings.backgroundMode} file for this background.` : settings.backgroundAssetVersion ? `${settings.backgroundAssetName || 'Background file'} saved on this device.` : 'PNG, JPG, WebP, GIF, MP4 or WebM. Up to 15 MB; videos play muted.';
    document.querySelectorAll('[data-type-area]').forEach(el => { if (el.type==='checkbox') el.checked=settings.typeAreas[el.dataset.typeArea][el.dataset.typeField]; else if (document.activeElement !== el) el.value=settings.typeAreas[el.dataset.typeArea][el.dataset.typeField]; });
    renderControlVisibility();
    backgroundStopEditor?.render(); mapStopEditor?.render();
    ThemeControls.enhance();
    renderPreview();
    if (visualEditors) visualEditors.render(settings);
    designStudio?.render();
    if (!$('#export-box').hidden) renderExport();
  }
  function renderFontDetails(){
    ThemeStudio.loadAllFonts({...settings,enabled:true},document,previewFontState);
    for(const [key] of fontAreas){
      const entry=settings.customFonts[key],select=$('#font-select-'+key),status=document.querySelector('[data-font-status="'+key+'"]');
      const custom=select.querySelector('option[value=custom]');custom.disabled=!(entry || settings.customFont);
      custom.textContent=entry?'Uploaded file · '+entry.name:settings.customFont?'Previously uploaded shared font':'Upload a font below';
      const specimen=document.querySelector('[data-font-specimen="'+key+'"]'),area=settings.typeAreas[key];
      const family=settings[key]==='custom'?(entry?'"YTS '+key+'"':'"YTS Uploaded Font"'):ThemeStudio.fontStacks[settings[key]];
      specimen.style.fontFamily=family||'system-ui';specimen.style.fontWeight=area.weight||500;specimen.style.fontSize=(area.size||22)+'px';specimen.style.letterSpacing=area.spacing+'px';
      status.className='';
      status.textContent=settings[key]==='custom'?'Loading font…':settings[key]==='default'?'YouTube default · choose a library font above.':'Installed font · availability depends on this device.';
      const state=previewFontState[key],data=entry?.data||settings.customFont;
      if(settings[key]==='custom')state?.promise?.then(()=>{
        if(settings[key]!=='custom' || (settings.customFonts[key]?.data||settings.customFont)!==data)return;
        status.className=state.status==='loaded'?'font-ready':'font-error';
        status.textContent=state.status==='loaded'?(entry?.name||settings.customFontName||'Uploaded font')+' · loaded for this area':'Font could not load. Upload a valid font to replace it.';
      });
    }
    document.querySelectorAll('[data-title-gradient]').forEach(el=>el.hidden=settings.titleStyle!=='gradient');
  }
  async function chooseFont(key,value){
    const token=fontRequests[key]=(fontRequests[key]||0)+1;
    if(!value.startsWith('library:')){update({[key]:value});return;}
    message('Loading bundled font…');
    try{
      const entry=await StudioFonts.bundled(value.slice(8));if(token!==fontRequests[key])return;
      update({customFonts:{...settings.customFonts,[key]:entry},[key]:'custom'});message(entry.name+' applied');
    }catch{if(token===fontRequests[key]){render();message('Could not load that font. Reload the updated extension and retry.');}}
  }
  function renderExport() { $('#export-title').textContent = exportType === 'css' ? 'Generated CSS' : 'Generated JavaScript'; $('#export-code').value = exportType === 'css' ? ThemeStudio.makeCSS(settings) : ThemeStudio.makeJS(settings); }
  function download(name, value, mime) {
    const blob = new Blob([value], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function loadLogo(file) {
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 3 * 1024 * 1024) { message('Choose a PNG, JPG, WebP or GIF under 3 MB'); return; }
    try { const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); update({ logo: data }); message('Logo added'); } catch { message('Could not read that image'); }
  }
  async function loadSticker(file) {
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) { message('Choose a PNG, JPG, WebP or GIF under 2 MB'); return; }
    try { update({hoverSticker:await fileDataUrl(file),hoverStickerName:file.name,hoverStickerEnabled:true}); message('Hover image added'); } catch { message('Could not read that image'); }
  }
  async function loadFont(file, key) {
    if (!file) return;
    const token=fontRequests[key]=(fontRequests[key]||0)+1;
    try {const entry=await StudioFonts.uploaded(file);if(token!==fontRequests[key])return;update({customFonts:{...settings.customFonts,[key]:entry},[key]:'custom'});message('Font uploaded and applied to this area');}
    catch(error){if(token===fontRequests[key])message(error.message);}
  }
  async function validateBackground(file) {
    const url=URL.createObjectURL(file),media=document.createElement(file.type.startsWith('video/')?'video':'img');
    try {await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('The file could not be decoded')),10000);const done=()=>{clearTimeout(timer);resolve();};media.addEventListener(file.type.startsWith('video/')?'loadedmetadata':'load',done,{once:true});media.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Unsupported or damaged media'));},{once:true});if(media.tagName==='VIDEO'){media.preload='metadata';media.muted=true;}media.src=url;});}
    finally {media.removeAttribute('src');if(media.tagName==='VIDEO')media.load();URL.revokeObjectURL(url);}
  }
  async function loadBackground(file) {
    if (!file) return;
    const types = ['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'];
    if (!types.includes(file.type) || file.size > 15 * 1024 * 1024) { message('Choose a supported image or video under 15 MB'); return; }
    message('Checking background file…');
    try {
      await validateBackground(file);
      const version = crypto.randomUUID();
      await ThemeMedia.put({blob:file, type:file.type, name:file.name, version});
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      update({backgroundAssetVersion:version, backgroundAssetName:file.name, backgroundAssetType:kind, backgroundMode:kind}); message('Background saved on this device');
    } catch { message('Could not use that file. Choose a readable image, MP4 or WebM under 15 MB.'); }
  }
  async function removeBackground() {
    update({backgroundAssetVersion:'', backgroundAssetName:'', backgroundAssetType:'', backgroundMode:['image','video'].includes(settings.backgroundMode) ? 'solid' : settings.backgroundMode}); message('Background removed from current theme');
  }
  function fileDataUrl(blob) { return new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); }
  async function backup() {
    try {
      const snapshots = [settings, ...profiles.map(p => p.settings)];
      const versions = [...new Set(snapshots.map(s => s.backgroundAssetVersion).filter(Boolean))];
      const assets = Object.create(null); let total = 0;
      for (const version of versions) {
        const asset = await ThemeMedia.get(version);
        if (!asset || !(asset.blob instanceof Blob)) throw new Error('A background is missing');
        total += asset.blob.size; if (total > 120 * 1024 * 1024) throw new Error('Backgrounds are too large to back up together');
        assets[version] = {name:asset.name, type:asset.type, data:await fileDataUrl(asset.blob)};
      }
      const contents = JSON.stringify({format:'youtube-theme-studio', version:3, settings, profiles, assets}, null, 2);
      if (new Blob([contents]).size > 200 * 1024 * 1024) throw new Error('Backup exceeds the 200 MB limit');
      download('youtube-theme-backup.json', contents, 'application/json');
      message('Backup downloaded');
    } catch (error) { message(error.message || 'Could not create a backup'); }
  }
  async function importBackup(file) {
    if (!file) return;
    const createdAssets = [];
    if (file.size > 200 * 1024 * 1024) { message('Backup file is too large'); return; }
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.format !== 'youtube-theme-studio' || ![1,2,3].includes(data.version) || !data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings)) throw new Error('Invalid backup');
      const restored = ThemeStudio.normalize(data.settings);
      if (data.version >= 2 && (!Array.isArray(data.profiles) || data.profiles.length > 25)) throw new Error('Invalid profile list');
      const normalizedProfiles = data.version >= 2 ? normalizeProfiles(data.profiles) : [];
      if (data.version >= 2 && normalizedProfiles.length !== data.profiles.length) throw new Error('Invalid profile list');
      const importedProfiles = normalizedProfiles.map(p => ({...p,id:crypto.randomUUID(),name:`${p.name.slice(0,49)} (imported)`}));
      if (profiles.length + importedProfiles.length > 25) throw new Error('Import would exceed 25 profiles');
      const assetMap = data.version >= 2 ? data.assets : data.background ? {[restored.backgroundAssetVersion || 'legacy']:data.background} : {};
      if (!assetMap || typeof assetMap !== 'object' || Array.isArray(assetMap) || Object.keys(assetMap).length > 26) throw new Error('Invalid backup');
      const refs = new Map();
      for (const [oldVersion, asset] of Object.entries(assetMap)) {
        if (!/^[a-z0-9-]{1,80}$/i.test(oldVersion) || !asset || typeof asset !== 'object') throw new Error('Invalid background');
        const types = ['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'];
        if (!types.includes(asset.type) || typeof asset.data !== 'string' || asset.data.length > 21000000 || !asset.data.startsWith(`data:${asset.type};base64,`) || !/^[a-z0-9+/=]+$/i.test(asset.data.slice(asset.data.indexOf(',')+1))) throw new Error('Invalid background');
        const binary = atob(asset.data.slice(asset.data.indexOf(',')+1)), bytes = new Uint8Array(binary.length);
        if (bytes.length > 15 * 1024 * 1024) throw new Error('Background too large');
        for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const version = crypto.randomUUID(), name = typeof asset.name === 'string' ? asset.name.slice(0,80) : 'Background';
        await ThemeMedia.put({blob:new Blob([bytes],{type:asset.type}), type:asset.type, name, version});
        createdAssets.push(version);
        refs.set(oldVersion,{version,name,type:asset.type.startsWith('video/') ? 'video' : 'image'});
      }
      if (data.version === 1 && data.background && !restored.backgroundAssetVersion) restored.backgroundAssetVersion = 'legacy';
      for (const snapshot of [restored,...importedProfiles.map(p=>p.settings)]) if (snapshot.backgroundAssetVersion) {
        const ref = refs.get(snapshot.backgroundAssetVersion);
        if (!ref) throw new Error('A background is missing from the backup');
        snapshot.backgroundAssetVersion = ref.version; snapshot.backgroundAssetName = ref.name; snapshot.backgroundAssetType = ref.type;
      }
      await flushSave();
      const nextProfiles = [...profiles,...importedProfiles];
      await chrome.storage.local.set({theme:restored,profiles:nextProfiles,activeProfile:''});
      createdAssets.length = 0;
      editor.replace(restored); profiles = nextProfiles; selectedProfile = ''; renderProfiles(); render(); message('Backup imported; profiles were added');
    } catch (error) {
      await Promise.allSettled(createdAssets.map(version => ThemeMedia.remove(version)));
      message(error.message || 'Invalid backup file');
    }
  }
  function renderControlVisibility() {
    if(!$('#background-media'))return;
    const media=['image','video'].includes(settings.backgroundMode),gradient=settings.backgroundMode==='gradient';
    $('#background-media').hidden=!media;
    $('#background-color-control').hidden=gradient && settings.gradientType!=='aurora';
    if(!$('#control-search').value)$('#section-gradient').hidden=activePage!=='background' || !gradient;
    $('#background-stops').hidden=settings.gradientType==='aurora';$('#gradient-controls').hidden=settings.gradientType!=='aurora';
    $('#gradient-center').hidden=!['radial','conic'].includes(settings.gradientType);
    $('#repeat-gradient').hidden=settings.gradientType==='aurora';$('#repeat-hint').hidden=!settings.gradientRepeat || settings.gradientType==='aurora';
    $('#gradient-stage').hidden=settings.gradientType==='linear';$('#gradient-help').hidden=settings.gradientType==='linear';
    for(const [key,visible] of [['gradientAngle',['linear','conic'].includes(settings.gradientType)],['gradientSpread',settings.gradientType==='aurora'],['gradientSpeed',settings.gradientMotion],['title1',settings.titleStyle!=='match'],['title2',['gradient','alternating'].includes(settings.titleStyle)]]) {const el=document.querySelector('[data-key="'+key+'"]');if(el)el.closest('.field,.color-control').hidden=!visible;}
    document.querySelectorAll('[data-background-video]').forEach(el=>el.hidden=settings.backgroundMode!=='video');
    $('#background-pattern-options').hidden=settings.backgroundPattern==='none';
    $('#background-adjustments').hidden=settings.backgroundMode==='solid';
    $('#background-recipes').hidden=settings.backgroundMode!=='gradient';
    $('#background-upload').hidden=!media;$('#highlight-options').hidden=!settings.titleHighlight;$('#map-options').hidden=!settings.gradientMapEnabled;$('#remove-background').hidden=!settings.backgroundAssetVersion;$('#companion-status').textContent=!settings.companionEnabled?'Switch on to show your companion.':settings.companionImage?'Your image is active. Click the companion in the preview to interact.':'Default companion is active. You can upload an image or GIF above.';$('#wink-companion').disabled=!settings.companionEnabled;$('#popup-options').hidden=!settings.searchPopupEnabled;
    for(const key of ['playerGlowColor','playerGlowRadius']) document.querySelector('[data-key="'+key+'"]').closest('label').hidden=!settings.playerGlow;
    for(const key of ['logoAnimationTarget','logoAnimationSpeed','logoEasing']) document.querySelector('[data-key="'+key+'"]').closest('label').hidden=settings.logoAnimation==='none';
    document.querySelector('[data-key="logoGlowStrength"]').closest('label').hidden=settings.logoAnimation!=='glow';
    document.querySelectorAll('#section-companion .form-grid > .field').forEach(el=>el.hidden=!settings.companionEnabled);
  }
  $('#color-tabs').addEventListener('click',event=>{const button=event.target.closest('[data-color-scope]');if(!button)return;document.querySelectorAll('[data-color-scope]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));document.querySelectorAll('[data-color-panel]').forEach(el=>el.hidden=el.dataset.colorPanel!==button.dataset.colorScope);});
  const pageGroups = {shader:['section-shader'],frames:['section-frames','section-cursor'],profiles:['section-profiles'], elements:['section-elements'], css:['section-css'], layout:['section-layout','section-visibility'], glass:['section-glass'], color:['section-colors'], type:['section-studio-type','section-fonts'], logo:['section-brand','section-motion'], player:['section-player'], companion:['section-companion'], background:['section-background','section-gradient','section-background-finish'], backup:['section-export']};
  let activePage='color';
  function showPage(page) {
    if (!pageGroups[page]) page = 'color';
    document.querySelectorAll('[data-color-panel]').forEach(el=>el.hidden=el.dataset.colorPanel!==document.querySelector('[data-color-scope][aria-pressed=true]').dataset.colorScope);
    document.querySelectorAll('[data-font-panel]').forEach(el=>el.hidden=el.dataset.fontPanel!==$('#font-area-choice select').value);
    if(page==='player') document.querySelector('[data-preview-view=watch]').click();
    activePage=page; $('#control-search').value=''; $('#search-empty').hidden=true;
    const link=document.querySelector('#nav [data-page="'+page+'"]');
    $('#inspector-title').textContent=link.childNodes[1].textContent; $('#inspector-number').textContent=link.querySelector('span').textContent;
    if (document.querySelector('.inspector')) document.querySelector('.inspector').scrollTop=0;
    document.querySelectorAll('.sections > section').forEach(el => { el.hidden = !pageGroups[page].includes(el.id); });
    renderControlVisibility();
    document.querySelectorAll('#nav [data-page]').forEach(el => { if (el.dataset.page === page) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
  }
  $('#nav').addEventListener('click', event => {
    const link=event.target.closest('[data-page]');
    if (link) {
      event.preventDefault(); showPage(link.dataset.page);
      if (matchMedia('(max-width:760px)').matches) document.querySelector('.inspector').scrollIntoView({block:'start'});
    }
  });
  showPage('color');
  $('#control-search').addEventListener('input',event=>{
    const query=event.target.value.trim().toLowerCase();
    if (!query) {showPage(activePage); return;}
    let count=0;
    document.querySelectorAll('[data-color-panel]').forEach(el=>el.hidden=false);
    document.querySelectorAll('.sections > section').forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(query); if(!el.hidden) count++;});
    $('#search-empty').hidden=count>0; $('#inspector-title').textContent='Search results'; $('#inspector-number').textContent=count;
  });
  $('#inspect-toggle').addEventListener('click',()=>{const on=$('#inspect-toggle').getAttribute('aria-pressed')!=='true'; $('#inspect-toggle').setAttribute('aria-pressed',String(on)); preview?.setInspect(on); $('#canvas-hint').textContent=on?'Click anything to open its quick controls. Turn off Edit canvas to browse.':'Interactive sample · click videos, filter topics, and try player controls';});
  function resizeCanvas() {
    const width=$('#preview-width').value, host=$('#preview'), frame=$('#preview-frame');
    const available=host.clientWidth, target=width==='fluid'?available:Number(width), scale=Math.min(1,available/target);
    const frameWidth=width==='fluid'?'100%':target+'px', transform='scale('+scale+')', height=Math.ceil((parseFloat(frame.style.height)||450)*scale)+'px';
    if(frame.style.width!==frameWidth) frame.style.width=frameWidth;
    if(frame.style.transform!==transform) frame.style.transform=transform;
    if(host.style.height!==height) host.style.height=height;
  }
  $('#preview-width').addEventListener('change',resizeCanvas);
  new ResizeObserver(resizeCanvas).observe($('#preview'));
  new MutationObserver(resizeCanvas).observe($('#preview-frame'),{attributes:true,attributeFilter:['style']});

  const glassSurface = $('#glass-surface');
  function changeSurface(patch) { const key=glassSurface.value; update({surfaces:{...settings.surfaces,[key]:{...settings.surfaces[key],...patch}}}); }
  function renderGlass() {
    const key=glassSurface.value, g=settings.surfaces[key], controls=$('#glass-controls');
    if (controls.dataset.signature!==key) {
      controls.dataset.signature=key;
      controls.innerHTML='<label class="field"><span>Fill</span><select id="surface-fill"><option value="linked">Follow palette</option><option value="solid">Own solid color</option><option value="gradient">Own gradient</option></select></label><p id="surface-link-note" class="hint"></p><label id="surface-solid" class="field"><span>Fill color</span><div class="stop-color"><input type="color" id="surface-color" aria-label="Surface fill color"><input type="text" id="surface-hex" maxlength="7" aria-label="Surface fill hex"></div><small class="color-error" hidden>Enter a valid hex color.</small></label>'+
        [['opacity','Fill opacity (%)',0,100],['blur','Backdrop blur (px)',0,40],['angle','Gradient angle (°)',0,360]].map(([k,label,min,max])=>'<label class="field"><span>'+label+'</span><input type="range" data-glass="'+k+'" min="'+min+'" max="'+max+'"></label>').join('')+
        '<details class="control-details"><summary>More surface effects</summary>'+[['saturate','Backdrop saturation (%)',0,250],['border','Border strength (%)',0,100]].map(([k,label,min,max])=>'<label class="field"><span>'+label+'</span><input type="range" data-glass="'+k+'" min="'+min+'" max="'+max+'"></label>').join('')+'<label class="switch"><input type="checkbox" data-glass="drift"><span></span><b>Animate gradient</b></label>'+(key==='search'?'<label class="field"><span>Search glow</span><select data-glass="glowMode"><option value="off">Off</option><option value="hover">On hover</option><option value="always">Always</option></select></label><label class="field"><span>Glow color</span><input type="color" data-glass="glowColor"></label><label class="field"><span>Glow radius (px)</span><input type="range" data-glass="glowRadius" min="0" max="60"></label>':'')+'</details>';
      $('#surface-fill').addEventListener('change',event=>{const mode=event.target.value,patch={linked:mode==='linked',fillMode:mode==='gradient'?'gradient':'solid'};if(mode==='linked')patch.stops=settings.surfaces[key].stops.map(s=>({...s,color:key==='search'?settings.searchBackground:settings.surface}));if(mode==='gradient' && settings.surfaces[key].stops.length===1)patch.stops=[{...settings.surfaces[key].stops[0],position:0},{...settings.surfaces[key].stops[0],position:100}];changeSurface(patch);});
      function solid(color) {const stops=settings.surfaces[key].stops.map(s=>({...s}));stops[0].color=color;changeSurface({stops,linked:false});}
      $('#surface-color').addEventListener('input',event=>{$('#surface-hex').value=event.target.value;solid(event.target.value);});
      $('#surface-hex').addEventListener('change',event=>{const color=ThemeControls.hex(event.target.value);event.target.setAttribute('aria-invalid',String(!color));$('#surface-solid .color-error').hidden=!!color;if(color){event.target.value=color;solid(color);}});
      surfaceStopEditor=ThemeControls.createStops($('#glass-stops'),{label:'Surface gradient',getStops:()=>settings.surfaces[glassSurface.value].stops,commit:stops=>changeSurface({stops,linked:false,fillMode:'gradient'}),preview:stops=>preview?.update({...settings,surfaces:{...settings.surfaces,[glassSurface.value]:{...settings.surfaces[glassSurface.value],stops}}},previewMediaUrl)});
    }
    $('#surface-fill').value=g.linked?'linked':g.fillMode;
    $('#surface-link-note').hidden=!g.linked; $('#surface-link-note').textContent='Uses '+(key==='search'?'Search fill':'Panels')+' from Colors. Opacity and blur below still apply.';
    $('#surface-solid').hidden=g.linked || g.fillMode!=='solid';
    $('#surface-color').value=g.stops[0].color;if(document.activeElement!==$('#surface-hex'))$('#surface-hex').value=g.stops[0].color;
    controls.querySelectorAll('[data-glass]').forEach(el=>{const value=g[el.dataset.glass];if(el.type==='checkbox')el.checked=value;else if(document.activeElement!==el)el.value=value;});
    controls.querySelector('[data-glass="angle"]').closest('label').hidden=g.linked || g.fillMode!=='gradient';
    controls.querySelector('[data-glass="drift"]').closest('label').hidden=g.linked || g.fillMode!=='gradient';
    $('#glass-stops').hidden=g.linked || g.fillMode!=='gradient';surfaceStopEditor.render();ThemeControls.enhance(controls);
  }
  glassSurface.addEventListener('change',renderGlass);
  $('#section-glass').addEventListener('input',event=>{const el=event.target;if(!el.dataset.glass)return;changeSurface({[el.dataset.glass]:el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value});});
  for (const [id,key] of [['companion-image','companionImage'],['companion-wink','companionWink']]) {
    $('#'+id).addEventListener('change', async event => { const file=event.target.files[0]; if (!file) return; if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size>2*1024*1024) { message('Choose a supported image under 2 MB'); return; } try { await validateBackground(file); update({[key]:await fileDataUrl(file),companionEnabled:true}); message('Companion image saved'); } catch { message('Could not read that image'); } event.target.value=''; });
    $('#'+id+'-remove').addEventListener('click',()=>update({[key]:''}));
  }
  initControls();
  mapStopEditor=ThemeControls.createStops($('#map-stops'),{label:'Gradient map',opacity:false,getStops:()=>settings.gradientMapStops,commit:gradientMapStops=>update({gradientMapStops}),preview:gradientMapStops=>preview?.update({...settings,gradientMapStops},previewMediaUrl)});
  backgroundStopEditor=ThemeControls.createStops($('#background-stops'),{label:'Background gradient',getStops:()=>settings.backgroundStops,commit:backgroundStops=>update({backgroundStops}),preview:backgroundStops=>{const draft={...settings,backgroundStops};preview?.update(draft,previewMediaUrl);$('#gradient-stage').style.background=ThemeStudio.gradientImage(draft);}});
  renderGlass();
  visualEditors = ThemeVisualEditors.create({getSettings:()=>settings, commit:update, previewGradient:draft=>{ if (draft.backgroundMode === 'gradient') preview?.update(draft,previewMediaUrl); }});
  renderProfiles();
  document.addEventListener('input', event => {
    const el = event.target;
    if (el.dataset.typeArea) { if(el.value==='' || !el.validity.valid)return; const key=el.dataset.typeArea; update({typeAreas:{...settings.typeAreas,[key]:{...settings.typeAreas[key],[el.dataset.typeField]:el.type==='checkbox'?el.checked:el.tagName==='SELECT'?el.value:Number(el.value)}}}); return; }
    if (el.dataset.hexKey) { const raw=el.value.trim().replace(/^#/,''); if (/^[0-9a-f]{6}$/i.test(raw)) {el.removeAttribute('aria-invalid');update({[el.dataset.hexKey]:'#'+raw});} return; }
    const key = el.dataset.key; if (!key) return;
    let value = el.type === 'checkbox' ? el.checked : el.value; if (el.type === 'range') value = Number(value);
    update({ [key]: value });
  });
  document.addEventListener('change', event => { const el=event.target; if (!el.dataset.hexKey) return; const value=ThemeControls.hex(el.value); el.setAttribute('aria-invalid',String(!value)); el.title=value?'':'Enter 3 or 6 hex digits, with or without #'; if(value){el.value=value;update({[el.dataset.hexKey]:value});} else message('Invalid color · use a hex value such as #336699'); });
  const backgroundRecipes = [
    ['Dusk',['#15131f','#57456e','#c88983']], ['Ocean',['#091c27','#285e73','#88b6ad']],
    ['Ember',['#21151b','#814450','#d39a74']], ['Iris',['#16142c','#6053a2','#bdacd9']],
    ['Moss',['#101c1a','#3d6252','#9aa982']], ['Nocturne',['#080c16','#233652','#6b7a9a']]
  ];
  backgroundRecipes.forEach(([name,colors])=>{
    const button=document.createElement('button');button.type='button';button.className='background-recipe';
    const swatch=document.createElement('span');swatch.className='recipe-swatch';swatch.style.background='linear-gradient(135deg,'+colors.join(',')+')';swatch.setAttribute('aria-hidden','true');
    const label=document.createElement('span');label.textContent=name;button.append(swatch,label);button.title='Use '+name+' background colors';
    button.addEventListener('click',()=>update({backgroundMode:'gradient',gradientType:'linear',gradientAngle:135,gradientRepeat:false,background:colors[0],backgroundStops:colors.map((color,i)=>({color,alpha:100,position:i*50}))}));
    $('#background-recipe-grid').append(button);
  });
  $('#reset-background-finish').addEventListener('click',()=>{
    const keys=['backgroundTint','backgroundTintOpacity','backgroundVignette','backgroundPattern','backgroundPatternColor','backgroundPatternOpacity','backgroundPatternSize','backgroundBrightness','backgroundSaturation','backgroundContrast','backgroundBlur'];
    update(Object.fromEntries(keys.map(key=>[key,ThemeStudio.defaults[key]])));message('Background finish reset · Undo to restore');
  });
  $('#choose-background').addEventListener('click',()=>$('#background-file').click());
  $('#background-upload').addEventListener('dragover',event=>{event.preventDefault();event.currentTarget.classList.add('drag-over');});
  $('#background-upload').addEventListener('dragleave',event=>event.currentTarget.classList.remove('drag-over'));
  $('#background-upload').addEventListener('drop',event=>{event.preventDefault();event.currentTarget.classList.remove('drag-over');loadBackground(event.dataTransfer.files[0]);});
  $('#wink-companion').addEventListener('click',()=>preview?.winkCompanion());
  $('#compare-toggle').addEventListener('click',event=>{const button=event.currentTarget,on=button.getAttribute('aria-pressed')!=='true';button.setAttribute('aria-pressed',String(on));button.textContent=on?'Show theme':'Original';preview?.setCompare(on);});
  $('#expand-preview').addEventListener('click',event=>{const on=document.querySelector('.layout').classList.toggle('preview-expanded');event.currentTarget.setAttribute('aria-pressed',String(on));event.currentTarget.textContent=on?'Close expanded view':'Expand';resizeCanvas();});
  $('#editor-mode').textContent=location.protocol==='chrome-extension:'?'Extension editor':'Local demo · separate settings';
  $('#logo-file').addEventListener('change', e => { loadLogo(e.target.files[0]); e.target.value = ''; });
  $('#remove-logo').addEventListener('click', () => update({ logo: '' }));
  $('#background-file').addEventListener('change', e => { loadBackground(e.target.files[0]); e.target.value = ''; });
  $('#remove-background').addEventListener('click', removeBackground);
  $('#remove-font').addEventListener('click', () => {
    const patch = { customFont: '', customFontName: '' };
    fontAreas.forEach(([key]) => { if (settings[key] === 'custom' && !settings.customFonts[key]) patch[key] = 'default'; });
    update(patch);
  });

  $('#profile-select').addEventListener('change', e => { selectedProfile = e.target.value; const profile = profiles.find(p => p.id === selectedProfile); if (profile) { update(profile.settings); message(`Applied ${profile.name}`); } chrome.storage.local.set({activeProfile:selectedProfile}).catch(() => message('Could not save the selected profile')); renderProfiles(); });
  $('#profile-save').addEventListener('click', async () => {
    const name = $('#profile-name').value.trim().slice(0,60); if (!name) { message('Enter a name for the profile'); $('#profile-name').focus(); return; }
    if (profiles.length >= 25) { message('You can save up to 25 profiles'); return; }
    const profile = {id:crypto.randomUUID(), name, settings:structuredClone(settings)};
    if (await saveProfiles([...profiles,profile], profile.id)) { $('#profile-name').value = ''; message(`Saved ${name}`); }
  });
  $('#profile-update').addEventListener('click', async () => { const profile = profiles.find(p => p.id === selectedProfile); if (!profile) return; const next = profiles.map(p => p.id === selectedProfile ? {...p,settings:structuredClone(settings)} : p); if (await saveProfiles(next,selectedProfile)) message(`Updated ${profile.name}`); });
  $('#profile-delete').addEventListener('click', async () => { const profile = profiles.find(p => p.id === selectedProfile); if (!profile || !confirm(`Delete the saved profile “${profile.name}”?`)) return; if (await saveProfiles(profiles.filter(p => p.id !== selectedProfile),'')) message(`Deleted ${profile.name}`); });
  $('#show-css').addEventListener('click', () => { exportType = 'css'; $('#export-box').hidden = false; renderExport(); });
  $('#show-js').addEventListener('click', () => { exportType = 'js'; $('#export-box').hidden = false; renderExport(); });
  $('#copy-code').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#export-code').value); message('Code copied'); } catch { $('#export-code').focus(); $('#export-code').select(); message('Select and copy the code'); } });
  $('#download-code').addEventListener('click', () => download(`youtube-theme.${exportType}`, $('#export-code').value, 'text/plain'));
  $('#backup').addEventListener('click', backup);
  $('#import-file').addEventListener('change', e => { importBackup(e.target.files[0]); e.target.value = ''; });
  $('#hover-image-file').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 2*1024*1024) { message('Choose an image or GIF under 2 MB'); return; }
    try { update({hoverSticker:await fileDataUrl(file),hoverStickerName:file.name,hoverStickerEnabled:true}); }
    catch { message('Could not read the hover image'); }
    event.target.value = '';
  });
  $('#hover-image-remove').addEventListener('click', () => update({hoverSticker:'',hoverStickerName:'',hoverStickerEnabled:false}));
  $('#reset').addEventListener('click', () => { if (confirm('Reset the current theme, including its logo, background and uploaded fonts? Saved profiles will remain.')) { editor.replace({}); message('Current theme reset · Undo to restore'); } });
  inspector=ThemeInspector.create({getSettings:()=>settings,update,showPage});
  inspector.render();
  designStudio=ThemeDesignStudio.create({getSettings:()=>settings,update,showPage,message,selectTarget:target=>{if(target==='avatar')designStudio.selectFrame('avatar');else if(target==='background')showPage(settings.backgroundMode==='shader'?'shader':'background');else inspector.select(target);}});
  document.querySelectorAll('#nav [data-page]').forEach(link=>{link.title=link.childNodes[1].textContent;link.setAttribute('aria-label',link.childNodes[1].textContent);});
  showPage('shader');
  chrome.storage.onChanged.addListener((changes,area) => {
    if (area !== 'local') return;
    Object.keys(changes).forEach(key=>startupChanges.add(key));
    if (changes.theme && changes.themeEditor?.newValue?.id!==editorId) editor.receive(changes.theme.newValue);
    if (changes.profiles) profiles=normalizeProfiles(changes.profiles.newValue);
    if (changes.activeProfile) selectedProfile=changes.activeProfile.newValue || '';
    if (changes.profiles || changes.activeProfile) renderProfiles();
  });
  chrome.storage.local.get(['theme','profiles','activeProfile']).then(data => {
    editor.initialize(data.theme);
    if(!startupChanges.has('profiles')) profiles=normalizeProfiles(data.profiles);
    if(!startupChanges.has('activeProfile')) selectedProfile=profiles.some(p=>p.id===data.activeProfile)?data.activeProfile:'';
    renderProfiles(); render(); renderGlass(); document.querySelector('.layout').inert=false;
    $('#status').textContent='Saved on this device';
  }).catch(() => { $('#status').textContent='Could not load settings · reload to retry'; });
})();
