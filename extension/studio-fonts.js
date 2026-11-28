/* Locally bundled designer fonts, shared by studio and YouTube font pickers. */
(function(root){
  'use strict';
  const library = [
    {id:'manrope',label:'Manrope',family:'Manrope',file:'manrope.woff2',weight:'200 800',kind:'Geometric sans'},
    {id:'sourcesans3',label:'Source Sans 3',family:'Source Sans 3',file:'sourcesans3.woff2',weight:'200 900',kind:'Adobe · Humanist sans'},
    {id:'spacegrotesk',label:'Space Grotesk',family:'Space Grotesk',file:'spacegrotesk.woff2',weight:'300 700',kind:'Expressive grotesk'},
    {id:'sourceserif4',label:'Source Serif 4',family:'Source Serif 4',file:'sourceserif4.woff2',weight:'200 900',kind:'Adobe · Editorial serif'}
  ];
  const cache = new Map();
  const bytesToData = (buffer,type) => {
    const bytes = new Uint8Array(buffer); let binary='';
    for(let i=0;i<bytes.length;i++) binary+=String.fromCharCode(bytes[i]);
    return 'data:font/'+type+';base64,'+btoa(binary);
  };
  async function bundled(id){
    const font=library.find(font=>font.id===id); if(!font) throw Error('Unknown font');
    if(!cache.has(id)) cache.set(id,(async()=>{
      const response=await fetch('fonts/'+font.file); if(!response.ok)throw Error('Bundled font unavailable');
      const buffer=await response.arrayBuffer();
      await new FontFace('Studio font validation',buffer,{weight:font.weight}).load();
      return {data:bytesToData(buffer,'woff2'),name:font.label,library:font.id};
    })().catch(error=>{cache.delete(id);throw error;}));
    return cache.get(id);
  }
  async function uploaded(file){
    if(!file || file.size>1024*1024)throw Error('Choose a font under 1 MB.');
    const buffer=await file.arrayBuffer(),head=new Uint8Array(buffer,0,Math.min(4,buffer.byteLength));
    const signature=String.fromCharCode(...head);
    const type=signature==='wOF2'?'woff2':signature==='wOFF'?'woff':signature==='OTTO'?'otf':signature==='true'||head.join(',')==='0,1,0,0'?'ttf':'';
    if(!type)throw Error('Choose a valid WOFF2, WOFF, TTF or OTF file.');
    try { await new FontFace('Studio font validation',buffer).load(); }
    catch { throw Error('This font could not be decoded. Your previous font is still active.'); }
    return {data:bytesToData(buffer,type),name:file.name.slice(0,80)};
  }
  root.StudioFonts={library,bundled,uploaded};
})(globalThis);
