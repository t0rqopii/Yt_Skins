/* Direct element controls. Only explicitly enabled properties become overrides. */
(function(root) {
  'use strict';
  const targets = {card:'Video card',thumbnail:'Thumbnail',title:'Video title',channel:'Channel name',metadata:'Views & dates',search:'Search bar',category:'Category chip',button:'Action button',brand:'Custom logo / name',description:'Description',playerFrame:'Player frame'};
  const properties = [
    ['background','Fill','color','#202020'],['color','Text color','color','#f1f1f1'],
    ['borderColor','Border color','color','#555555'],['borderWidth','Border width','range',0,0,12],
    ['radius','Roundness','range',12,0,100],['padding','Padding','range',0,0,64],
    ['opacity','Opacity','range',100,0,100],['shadowColor','Shadow color','color','#ff7066'],
    ['shadow','Shadow radius','range',0,0,100],['translateX','Move horizontally','range',0,-100,100],
    ['translateY','Move vertically','range',0,-100,100],['rotate','Rotation','range',0,-180,180],
    ['scale','Scale','range',100,25,200]
  ];
  function create({getSettings,update,showPage}) {
    const $ = id=>document.getElementById(id);
    let target='thumbnail', state='base', cssDirty=false;
    for (const [key,label] of Object.entries(targets)) {
      for (const id of ['element-target','css-target']) {const option=document.createElement('option'); option.value=key; option.textContent=label; $(id).append(option);}
    }
    $('element-target').value=target;
    for (const [key,label,type,fallback,min,max] of properties) {
      const row=document.createElement('div'); row.className='property-row';
      const toggle=document.createElement('label'); toggle.className='property-toggle';
      const check=document.createElement('input'); check.type='checkbox'; check.dataset.propertyEnabled=key; check.setAttribute('aria-label','Override '+label.toLowerCase());
      const name=document.createElement('span'); name.textContent=label+(type==='range' ? (['opacity','scale'].includes(key)?' (%)':key==='rotate'?' (°)':' (px)') : ''); toggle.append(check,name);
      const input=document.createElement('input'); input.type=type; input.dataset.property=key; input.setAttribute('aria-label',label);
      if(type==='range') {input.min=min; input.max=max; input.step=1;}
      const output=document.createElement('output'); output.dataset.propertyOutput=key;
      row.append(toggle,input,output); $('element-controls').append(row);
    }
    function currentRule() {return getSettings().elements[target]?.[state] || {};}
    function commit(rule) {const s=getSettings(); update({elements:{...s.elements,[target]:{...s.elements[target],[state]:rule}}});}
    function render() {
      const rule=currentRule();
      for(const [key,label,type,fallback] of properties) {
        const enabled=Object.hasOwn(rule,key), input=document.querySelector('[data-property="'+key+'"]');
        document.querySelector('[data-property-enabled="'+key+'"]').checked=enabled;
        input.disabled=!enabled;
        if(document.activeElement!==input) input.value=enabled?rule[key]:fallback;
        input.closest('.property-row').classList.toggle('is-inherited',!enabled);
        document.querySelector('[data-property-output="'+key+'"]').textContent=enabled?(type==='color'?rule[key]:rule[key]+(['opacity','scale'].includes(key)?'%':key==='rotate'?'°':'px')):'Inherit';
      }
      if(!cssDirty) $('custom-css').value=getSettings().customCSS;
      ThemeControls.enhance($('element-controls'));
    }
    $('element-controls').addEventListener('input',event=>{
      const el=event.target, rule={...currentRule()};
      if(el.dataset.propertyEnabled) {
        const key=el.dataset.propertyEnabled;
        if(el.checked) rule[key]=properties.find(p=>p[0]===key)[3]; else delete rule[key];
      } else if(el.dataset.property) rule[el.dataset.property]=el.type==='range'?Number(el.value):el.value;
      else return;
      commit(rule);
    });
    $('element-target').addEventListener('change',event=>{target=event.target.value; render();});
    document.querySelectorAll('[data-element-state]').forEach(button=>button.addEventListener('click',()=>{
      state=button.dataset.elementState;
      document.querySelectorAll('[data-element-state]').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
      render();
    }));
    $('element-reset').addEventListener('click',()=>{const elements={...getSettings().elements}; delete elements[target]; update({elements});});
    $('custom-css').addEventListener('input',()=>{cssDirty=true; $('css-status').textContent='Unapplied changes';});
    $('css-insert').addEventListener('click',()=>{
      const area=$('custom-css'); area.value+='\n'+ThemeSelectors.elements[$('css-target').value]+' {\n  \n}\n'; cssDirty=true; $('css-status').textContent='Unapplied changes'; area.focus();
    });
    $('css-apply').addEventListener('click',()=>{const css=$('custom-css').value; cssDirty=false; update({customCSS:css}); $('css-status').textContent='Stylesheet applied. Invalid declarations are ignored by the browser.';});
    $('css-revert').addEventListener('click',()=>{cssDirty=false; render(); $('css-status').textContent='Draft discarded';});
    return {render, select(key) {
      if(key.startsWith('surface:')) {showPage('glass'); $('glass-surface').value=key.split(':')[1]; $('glass-surface').dispatchEvent(new Event('change'));}
      else if(targets[key]) {target=key; $('element-target').value=key; showPage('elements'); render();}
    }};
  }
  root.ThemeInspector={create};
})(globalThis);
