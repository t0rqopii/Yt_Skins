/* Interactive editors. They return normalized settings; they do not access storage. */
(function (root) {
  'use strict';
  function create({getSettings, commit, previewGradient}) {
    const stage = document.querySelector('#gradient-stage');
    const handles = [...stage.querySelectorAll('[data-gradient-handle]')];
    const pathStage = document.querySelector('#path-stage');
    const canvas = document.querySelector('#path-canvas');
    const marker = document.querySelector('#path-marker');
    let gradientDrag = null, pathDrag = null, markerSignature = '', markerLogo = '';
    const clamp = value => Math.max(0, Math.min(1, value));
    function pointIn(element,event) { const box=element.getBoundingClientRect(); return {x:clamp((event.clientX-box.left)/box.width),y:clamp((event.clientY-box.top)/box.height)}; }
    function gradient(s) {
      stage.style.background = ThemeStudio.gradientImage(s);
      handles.forEach(handle => {
        const id = handle.dataset.gradientHandle, visible = s.gradientType === 'aurora' || (['radial','conic'].includes(s.gradientType) && id === '1');
        handle.hidden = !visible; handle.style.left = `${s['gradientX'+id]}%`; handle.style.top = `${s['gradientY'+id]}%`; handle.style.backgroundColor = s[id === '1' ? 'gradientColor' : 'gradientColor'+id]; handle.textContent = ['radial','conic'].includes(s.gradientType) ? '⊕' : id;
      });
      document.querySelector('#gradient-help').textContent = s.gradientType === 'linear' ? 'Use the angle and color controls for a linear gradient.' : 'Drag the markers, or focus one and use the arrow keys.';
    }
    handles.forEach(handle => {
      handle.addEventListener('pointerdown',event => { if (event.button !== 0) return; event.preventDefault(); handle.setPointerCapture(event.pointerId); gradientDrag={id:handle.dataset.gradientHandle,draft:{...getSettings()}}; });
      handle.addEventListener('pointermove',event => {
        if (!gradientDrag) return; const p=pointIn(stage,event),id=gradientDrag.id;
        gradientDrag.draft['gradientX'+id]=Math.round(p.x*100); gradientDrag.draft['gradientY'+id]=Math.round(p.y*100);
        gradient(gradientDrag.draft); previewGradient(gradientDrag.draft);
      });
      handle.addEventListener('pointerup',() => { if (!gradientDrag) return; const d=gradientDrag.draft,id=gradientDrag.id; gradientDrag=null; commit({['gradientX'+id]:d['gradientX'+id],['gradientY'+id]:d['gradientY'+id]}); });
      handle.addEventListener('pointercancel',() => { gradientDrag=null; gradient(getSettings()); previewGradient(getSettings()); });
      handle.addEventListener('keydown',event => {
        const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}; if (!directions[event.key]) return; event.preventDefault();
        const id=handle.dataset.gradientHandle,s=getSettings(),step=event.shiftKey ? 5 : 1,[dx,dy]=directions[event.key];
        commit({['gradientX'+id]:Math.round(clamp((s['gradientX'+id]+dx*step)/100)*100),['gradientY'+id]:Math.round(clamp((s['gradientY'+id]+dy*step)/100)*100)});
      });
    });
    function path(s, override) {
      const points = override || s.logoPathPoints, ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
      ctx.clearRect(0,0,w,h); ctx.fillStyle='#171c19'; ctx.fillRect(0,0,w,h); ctx.strokeStyle='rgba(255,255,255,.09)'; ctx.lineWidth=1;
      for(let x=0;x<=w;x+=100){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();} for(let y=0;y<=h;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      if (points.length) { ctx.beginPath(); points.forEach((p,i)=>i?ctx.lineTo(p.x*w,p.y*h):ctx.moveTo(p.x*w,p.y*h)); ctx.strokeStyle=s.accent; ctx.lineWidth=4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke(); points.forEach((p,i)=>{if(i===0||i===points.length-1){ctx.beginPath();ctx.arc(p.x*w,p.y*h,6,0,Math.PI*2);ctx.fillStyle=s.accent;ctx.fill();}}); }
      else { ctx.fillStyle='#a7b1a4';ctx.font='20px system-ui';ctx.textAlign='center';ctx.fillText('Click to place · drag to draw',w/2,h/2);ctx.textAlign='start'; }
      marker.hidden = !points.length; if (!points.length) return;
      const box=pathStage.getBoundingClientRect(),coords=points.map(p=>[Math.round(p.x*box.width),Math.round(p.y*box.height)]);
      const signature=JSON.stringify([coords,s.logoPathDuration,s.logoPathLoop,s.accent,s.brandName]);
      if (signature === markerSignature && markerLogo === s.logo) return; markerSignature=signature; markerLogo=s.logo;
      marker.replaceChildren(); if (s.logo) { const image=document.createElement('img'); image.src=s.logo; image.alt=''; marker.appendChild(image); } const label=document.createElement('span'); label.textContent=s.brandName || (s.logo ? '' : 'Logo'); marker.appendChild(label); marker.style.backgroundColor=s.accent;
      if (coords.length === 1) { marker.style.offsetPath='none';marker.style.left=`${coords[0][0]}px`;marker.style.top=`${coords[0][1]}px`;marker.style.transform='translate(-50%, -50%)';marker.style.animation='none'; }
      else { const data=coords.map((p,i)=>`${i?'L':'M'} ${p[0]} ${p[1]}`).join(' '); marker.style.left='0';marker.style.top='0';marker.style.transform='none';marker.style.offsetPath=`path("${data}")`;marker.style.offsetAnchor='center';marker.style.offsetRotate='0deg';marker.style.animation=`yts-editor-path ${s.logoPathDuration}s linear infinite ${s.logoPathLoop === 'alternate' ? 'alternate' : 'normal'}`; }
    }
    canvas.addEventListener('pointerdown',event => { if(event.button!==0)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);pathDrag=[pointIn(canvas,event)];path(getSettings(),pathDrag); });
    canvas.addEventListener('pointermove',event => { if(!pathDrag)return;const p=pointIn(canvas,event),last=pathDrag[pathDrag.length-1];if(pathDrag.length<300 && Math.hypot(p.x-last.x,p.y-last.y)>.005){pathDrag.push(p);path(getSettings(),pathDrag);} });
    canvas.addEventListener('pointerup',() => {if(!pathDrag)return;const points=pathDrag;pathDrag=null;commit({logoPathPoints:points,logoPathEnabled:true});});
    canvas.addEventListener('pointercancel',()=>{pathDrag=null;path(getSettings());});
    canvas.addEventListener('keydown',event=>{const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!directions[event.key])return;event.preventDefault();const points=getSettings().logoPathPoints.map(p=>({...p}));if(!points.length)points.push({x:.5,y:.5});const last=points[points.length-1],[dx,dy]=directions[event.key],step=event.shiftKey?.05:.01;last.x=clamp(last.x+dx*step);last.y=clamp(last.y+dy*step);commit({logoPathPoints:points,logoPathEnabled:true});});
    document.querySelector('#path-center').addEventListener('click',()=>commit({logoPathPoints:[{x:.5,y:.5}],logoPathEnabled:true}));
    document.querySelector('#path-clear').addEventListener('click',()=>commit({logoPathPoints:[],logoPathEnabled:false}));
    document.querySelector('#use-gradient')?.addEventListener('click',()=>commit({backgroundMode:'gradient'}));
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(()=>{markerSignature='';path(getSettings());}).observe(pathStage);
    return {render(s){gradient(s);path(s);}};
  }
  root.ThemeVisualEditors={create};
})(globalThis);
