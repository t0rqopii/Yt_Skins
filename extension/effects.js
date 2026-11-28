/* Real luminance mapping, preserving source alpha and blending with the original. */
(function(root){
  'use strict';
  function tables(stops) {
    const sorted=stops.slice().sort((a,b)=>a.position-b.position);
    return [1,3,5].map(channel=>Array.from({length:256},(_,i)=>{
      const p=i*100/255;let a=sorted[0],b=a;
      for(const stop of sorted){if(stop.position<=p)a=stop;if(stop.position>=p){b=stop;break;}b=stop;}
      const t=a.position===b.position?0:Math.max(0,Math.min(1,(p-a.position)/(b.position-a.position)));
      return Number(((parseInt(a.color.slice(channel,channel+2),16)*(1-t)+parseInt(b.color.slice(channel,channel+2),16)*t)/255).toFixed(5));
    }));
  }
  function markup(stops,amount) {
    const values=tables(stops),strength=Math.max(0,Math.min(1,amount/100));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" aria-hidden="true"><defs><filter id="yts-gradient-map" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values=".2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0" result="luminance"/><feComponentTransfer in="luminance" result="mapped">${['R','G','B'].map((c,i)=>`<feFunc${c} type="table" tableValues="${values[i].join(' ')}"/>`).join('')}<feFuncA type="identity"/></feComponentTransfer><feComposite in="mapped" in2="SourceGraphic" operator="arithmetic" k1="0" k2="${strength}" k3="${1-strength}" k4="0"/></filter></defs></svg>`;
  }
  function create(doc) {
    let host=null,signature='';
    return {update(s){
      if(!s.enabled || !s.gradientMapEnabled){host?.remove();host=null;signature='';return;}
      if(!host){host=doc.createElement('div');host.id='yts-effects';host.style.cssText='position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';host.setAttribute('aria-hidden','true');}
      if(!host.isConnected)(doc.body || doc.documentElement).appendChild(host);
      const next=JSON.stringify([s.gradientMapStops,s.gradientMapAmount]);if(next!==signature){signature=next;populate(host,s.gradientMapStops,s.gradientMapAmount);}
    },destroy(){host?.remove();host=null;signature='';}};
  }
  function populate(host,stops,amount) {
    const doc=host.ownerDocument,ns='http://www.w3.org/2000/svg';
    const node=(tag,attrs)=>{const element=doc.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));return element;};
    const svg=node('svg',{width:0,height:0,'aria-hidden':'true'}),defs=node('defs',{}),filter=node('filter',{id:'yts-gradient-map','color-interpolation-filters':'sRGB'});
    filter.append(node('feColorMatrix',{in:'SourceGraphic',type:'matrix',values:'.2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 .2126 .7152 .0722 0 0 0 0 0 1 0',result:'luminance'}));
    const transfer=node('feComponentTransfer',{in:'luminance',result:'mapped'}),values=tables(stops);
    ['R','G','B'].forEach((c,i)=>transfer.append(node('feFunc'+c,{type:'table',tableValues:values[i].join(' ')})));transfer.append(node('feFuncA',{type:'identity'}));filter.append(transfer);
    const strength=Math.max(0,Math.min(1,amount/100));filter.append(node('feComposite',{in:'mapped',in2:'SourceGraphic',operator:'arithmetic',k1:0,k2:strength,k3:1-strength,k4:0}));
    defs.append(filter);svg.append(defs);host.replaceChildren(svg);
  }
  const api={tables,markup,populate,create};root.ThemeEffects=api;if(typeof module!=='undefined' && module.exports)module.exports=api;
})(globalThis);
