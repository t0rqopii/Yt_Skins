/* Shared precise inputs and color-stop editing. No persistence or theme ownership. */
(function(root){
  'use strict';
  const hex = value => { const raw=String(value).trim().replace(/^#/,''); return /^[a-f\d]{6}$/i.test(raw)?'#'+raw.toLowerCase():/^[a-f\d]{3}$/i.test(raw)?'#'+[...raw].map(c=>c+c).join('').toLowerCase():null; };
  const cssStops = stops => stops.slice().sort((a,b)=>a.position-b.position).map(s=>`${s.color}${Math.round(s.alpha*2.55).toString(16).padStart(2,'0')} ${s.position}%`).join(',');
  function insertStop(stops) {
    const sorted=stops.slice().sort((a,b)=>a.position-b.position);
    let a=sorted[0], b=sorted.at(-1), gap=-1;
    for(let i=1;i<sorted.length;i++) if(sorted[i].position-sorted[i-1].position>gap){a=sorted[i-1];b=sorted[i];gap=b.position-a.position;}
    const color='#'+[1,3,5].map(i=>Math.round((parseInt(a.color.slice(i,i+2),16)+parseInt(b.color.slice(i,i+2),16))/2).toString(16).padStart(2,'0')).join('');
    return [...stops,{color,alpha:Math.round((a.alpha+b.alpha)/2),position:Math.round((a.position+b.position)/2)}];
  }
  function enhance(scope=document) {
    scope.querySelectorAll('input[type=color]').forEach(picker=>{
      if(picker.closest('.color-control,.stop-color'))return;
      const box=document.createElement('div');box.className='stop-color enhanced-color';
      const text=document.createElement('input');text.type='text';text.maxLength=7;text.spellcheck=false;
      text.setAttribute('aria-label',(picker.getAttribute('aria-label') || picker.closest('label')?.textContent.trim() || 'Color')+' hex');
      picker.before(box);box.append(picker,text);
      text.addEventListener('input',event=>event.stopPropagation());
      text.addEventListener('change',event=>{event.stopPropagation();const value=hex(text.value);text.setAttribute('aria-invalid',String(!value));text.title=value?'':'Use 3 or 6 hex digits';if(value){text.value=value;picker.value=value;picker.dispatchEvent(new Event('input',{bubbles:true}));picker.dispatchEvent(new Event('change',{bubbles:true}));}});
    });
    scope.querySelectorAll('.enhanced-color').forEach(box=>{const picker=box.querySelector('[type=color]'),text=box.querySelector('[type=text]');if(document.activeElement!==text){text.value=picker.value;text.removeAttribute('aria-invalid');}text.disabled=picker.disabled;});
    scope.querySelectorAll('input[type=range]').forEach(slider=>{
      if(slider.closest('.range-editor')) return;
      const box=document.createElement('div');box.className='range-editor';
      const number=document.createElement('input');number.type='number';number.className='range-number';
      for(const k of ['min','max','step']) if(slider.hasAttribute(k))number.setAttribute(k,slider.getAttribute(k));
      const label=slider.getAttribute('aria-label') || slider.closest('label')?.textContent.trim().split('\n')[0] || slider.dataset.property || 'Value';
      number.setAttribute('aria-label',label.replace(/\s+\d+.*$/,'')+' exact value');
      slider.before(box);box.append(slider,number);
      function apply(event){event.stopPropagation();if(number.value==='' || !number.validity.valid)return;slider.value=number.value;slider.dispatchEvent(new Event(event.type,{bubbles:true}));}
      number.addEventListener('input',apply);number.addEventListener('change',apply);
      number.addEventListener('blur',()=>{number.value=slider.value;});
    });
    scope.querySelectorAll('.range-editor').forEach(box=>{const slider=box.querySelector('[type=range]'),number=box.querySelector('.range-number');if(document.activeElement!==number)number.value=slider.value;number.disabled=slider.disabled;slider.style.setProperty('--range-progress',((Number(slider.value)-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100)+'%');});
  }
  function createStops(host,{getStops,commit,preview=()=>{},label='Gradient',opacity=true}) {
    let selected=0, drag=null;
    host.innerHTML=`<div class="stop-track" aria-label="${label} color stops"><div class="stop-ramp"></div><div class="stop-handles"></div></div><p class="stop-help">Select a color stop to edit it. Drag to move.</p><div class="stop-heading"><strong class="stop-name"></strong><button type="button" class="text-button stop-remove">Delete stop</button></div><div class="stop-fields"><label class="field"><span>Color</span><div class="stop-color"><input type="color" aria-label="${label} stop color"><input type="text" class="stop-hex" maxlength="7" spellcheck="false" aria-label="${label} stop hex"></div></label><label class="field"><span>Position (%)</span><input type="number" data-stop-field="position" min="0" max="100" aria-label="${label} stop position"></label><label class="field"><span>Opacity (%)</span><input type="number" data-stop-field="alpha" min="0" max="100" aria-label="${label} stop opacity"></label></div><p class="color-error" hidden>Use a 3 or 6 digit hex color, such as #8ab4f8.</p><div class="stop-actions"><button type="button" class="button subtle stop-add">+ Add color stop</button><button type="button" class="button subtle stop-reverse">Reverse</button><button type="button" class="button subtle stop-space">Space evenly</button></div>`;
    if(!opacity)host.querySelector('[data-stop-field=alpha]').closest('label').hidden=true;
    const handles=host.querySelector('.stop-handles'), picker=host.querySelector('[type=color]'), text=host.querySelector('.stop-hex');
    const remove=host.querySelector('.stop-remove'), add=host.querySelector('.stop-add');
    function render(stops=getStops()) {
      selected=Math.min(selected,stops.length-1);
      host.querySelector('.stop-ramp').style.backgroundImage=`linear-gradient(90deg,${cssStops(stops)})`;
      if(handles.children.length!==stops.length){handles.replaceChildren();stops.forEach((_,i)=>{const button=document.createElement('button');button.type='button';button.dataset.stopIndex=i;button.className='stop-handle';handles.append(button);});}
      [...handles.children].forEach((button,i)=>{const s=stops[i];button.style.left=s.position+'%';button.style.backgroundColor=s.color;button.setAttribute('aria-label',`Color stop ${i+1}, ${s.position}%`);button.setAttribute('aria-pressed',String(i===selected));button.title=`${s.color} · ${s.position}%`;});
      const stop=stops[selected];host.querySelector('.stop-name').textContent=`Color stop ${selected+1} of ${stops.length}`;
      picker.value=stop.color;if(document.activeElement!==text){text.value=stop.color;text.removeAttribute('aria-invalid');host.querySelector('.color-error').hidden=true;}
      host.querySelectorAll('[data-stop-field]').forEach(el=>{if(document.activeElement!==el)el.value=stop[el.dataset.stopField];});
      remove.disabled=stops.length<=2;add.disabled=stops.length>=8;
    }
    function change(field,value){const stops=getStops().map(s=>({...s}));stops[selected][field]=value;commit(stops);render();}
    picker.addEventListener('input',()=>{text.value=picker.value;change('color',picker.value);});
    text.addEventListener('change',()=>{const value=hex(text.value);text.setAttribute('aria-invalid',String(!value));host.querySelector('.color-error').hidden=!!value;if(value){text.value=value;change('color',value);}});
    host.querySelectorAll('[data-stop-field]').forEach(el=>el.addEventListener('input',()=>{if(el.value!=='' && el.validity.valid)change(el.dataset.stopField,Number(el.value));}));
    host.querySelectorAll('[data-stop-field]').forEach(el=>el.addEventListener('blur',()=>{el.value=getStops()[selected][el.dataset.stopField];}));
    add.addEventListener('click',()=>{if(getStops().length>=8)return;const stops=insertStop(getStops());selected=stops.length-1;commit(stops);render();});
    remove.addEventListener('click',()=>{if(getStops().length<=2)return;const stops=getStops().filter((_,i)=>i!==selected);selected=Math.max(0,selected-1);commit(stops);render();});
    host.querySelector('.stop-reverse').addEventListener('click',()=>{commit(getStops().map(s=>({...s,position:100-s.position})));render();});
    host.querySelector('.stop-space').addEventListener('click',()=>{const sorted=getStops().map((s,i)=>({...s,index:i})).sort((a,b)=>a.position-b.position),stops=getStops().map(s=>({...s}));sorted.forEach((s,i)=>stops[s.index].position=Math.round(i*100/(stops.length-1)));commit(stops);render();});
    handles.addEventListener('click',event=>{if(!event.target.matches('.stop-handle'))return;selected=Number(event.target.dataset.stopIndex);render();});
    handles.addEventListener('pointerdown',event=>{const button=event.target.closest('.stop-handle');if(!button || event.button!==0)return;event.preventDefault();selected=Number(button.dataset.stopIndex);button.focus();button.setPointerCapture(event.pointerId);drag=getStops().map(s=>({...s}));render();});
    handles.addEventListener('pointermove',event=>{if(!drag)return;const box=handles.getBoundingClientRect();drag[selected].position=Math.round(Math.max(0,Math.min(100,(event.clientX-box.left)*100/box.width)));render(drag);preview(drag);});
    handles.addEventListener('pointerup',()=>{if(!drag)return;const stops=drag;drag=null;commit(stops);render();});
    handles.addEventListener('pointercancel',()=>{drag=null;preview(getStops());render();});
    handles.addEventListener('keydown',event=>{if(!event.target.matches('.stop-handle') || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();selected=Number(event.target.dataset.stopIndex);const p=getStops()[selected].position;change('position',event.key==='Home'?0:event.key==='End'?100:Math.max(0,Math.min(100,p+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?10:1))));});
    render();return {render,reset(){selected=0;render();}};
  }
  const api={hex,cssStops,insertStop,enhance,createStops};root.ThemeControls=api;
  if(typeof module!=='undefined' && module.exports)module.exports=api;
})(globalThis);
