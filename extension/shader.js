/* Dependency-free WebGL backdrop. One renderer is shared by YouTube and the preview. */
(function(root) {
  'use strict';
  function create(doc, win, options={}) {
    let settings,host,canvas,gl,program,buffer,uniforms={},raf=0,last=0,time=0,visible=true,failed=false,disposed=false;
    let pointer=[0,0],smooth=[0,0],status='idle';
    const reduced=win?.matchMedia?.('(prefers-reduced-motion: reduce)');
    const vertex='attribute vec2 a_position; varying vec2 v_uv; void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}';
    const fragment=`precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_resolution,u_pointer,u_position;
      uniform vec3 u_color1,u_color2,u_color3;
      uniform float u_time,u_strength,u_density,u_frequency,u_amplitude,u_zoom,u_rotation,u_tilt,u_brightness,u_reflection,u_grain,u_seed,u_shape;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      float field(vec2 p){float t=u_time;float n=noise(p*u_density+u_seed+vec2(t*.16,-t*.12));p+=u_strength*vec2(sin(p.y*2.+t),cos(p.x*2.-t))*.9;return sin(p.x*u_frequency+p.y*1.5+n*4.+t)*.28+cos(p.y*u_frequency-p.x+ t*.6)*.22+n*.5;}
      void main(){
        vec2 p=(v_uv-.5)*2.;p.x*=u_resolution.x/u_resolution.y;
        p/=u_zoom;p-=u_position;p+=u_pointer*.18;
        float cs=cos(u_rotation),sn=sin(u_rotation);p=mat2(cs,-sn,sn,cs)*p;
        p.y*=1.+u_tilt*1.4;
        float edge=1.;vec3 normal=vec3(0,0,1);
        if(u_shape>1.5){float r=length(p);edge=1.-smoothstep(.97,1.02,r);float z=sqrt(max(0.,1.-dot(p,p)));normal=normalize(vec3(p,z+.001));p=vec2(atan(p.x,max(z,.001)),asin(clamp(p.y,-1.,1.)));}
        if(u_shape>.5 && u_shape<1.5){p.y+=sin(p.x*2.+u_time*.5)*u_amplitude*.7;}
        float f=field(p);float dx=field(p+vec2(.012,0))-f;float dy=field(p+vec2(0,.012))-f;
        normal=normalize(normal+vec3(-dx,-dy,0)*u_amplitude*50.);
        float a=smoothstep(-.4,.7,f);float b=smoothstep(.05,.95,noise(p*.7+vec2(u_seed,u_time*.08)));
        vec3 col=mix(mix(u_color1,u_color2,a),u_color3,b);
        float light=max(dot(normal,normalize(vec3(-.4,.6,1.))),0.);
        col*=mix(1.,.45+light*.8,u_reflection);
        col+=pow(max(dot(reflect(normalize(vec3(.4,-.6,-1.)),normal),vec3(0,0,1)),0.),24.)*u_reflection*.4;
        col=mix(u_color3*.3,col,edge)*u_brightness;
        col+=(hash(gl_FragCoord.xy+u_seed)-.5)*u_grain;
        gl_FragColor=vec4(clamp(col,0.,1.),1.);
      }`;
    function report(next){if(status!==next){status=next;options.onStatus?.(next);}}
    function stop(){if(raf)win.cancelAnimationFrame(raf);raf=0;last=0;}
    function release(){stop();if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}buffer=null;program=null;gl=null;uniforms={};}
    function remove(){const context=gl;release();host?.remove();host=null;canvas=null;context?.getExtension('WEBGL_lose_context')?.loseContext();report('idle');}
    function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error);}return shader;}
    function initialize(){
      if(disposed||!canvas)return;
      try {
        gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)throw new Error('WebGL unavailable');
        program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
        if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader link failed');gl.useProgram(program);
        buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
        const position=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
        for(const name of ['resolution','pointer','position','color1','color2','color3','time','strength','density','frequency','amplitude','zoom','rotation','tilt','brightness','reflection','grain','seed','shape'])uniforms[name]=gl.getUniformLocation(program,'u_'+name);
        failed=false;canvas.hidden=false;report('webgl');
      }catch(error){failed=true;release();if(canvas)canvas.hidden=true;report('fallback');}
    }
    function attach(){
      if(host?.isConnected)return;
      const app=doc.querySelector('ytd-app');if(!app)return;
      if(!host){host=doc.createElement('div');host.id='yts-shader';host.setAttribute('aria-hidden','true');canvas=doc.createElement('canvas');host.appendChild(canvas);
        const ownedCanvas=canvas;
        canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();if(ownedCanvas!==canvas)return;stop();failed=true;canvas.hidden=true;report('fallback');});
        canvas.addEventListener('webglcontextrestored',()=>{if(ownedCanvas!==canvas)return;release();initialize();queue();});}
      app.prepend(host);if(!gl&&!failed)initialize();
    }
    function active(){return settings?.enabled && settings.backgroundMode==='shader' && visible && !doc.hidden && !doc.fullscreenElement && !disposed;}
    function moving(){return settings.shader.animate && settings.shader.speed>0 && !reduced?.matches;}
    function queue(){if(active()&&gl&&!raf)raf=win.requestAnimationFrame(draw);}
    function draw(stamp){
      raf=0;if(!active()||!gl)return;
      const s=settings.shader,interval=s.quality==='eco'?1000/24:s.quality==='balanced'?1000/30:1000/60;
      if(last && stamp-last<interval-1){queue();return;}
      const dt=last?Math.min(.1,(stamp-last)/1000):0;last=stamp;
      if(moving())time+=dt*s.speed/35;
      const rect=host.getBoundingClientRect(),ratio=s.quality==='eco'?.5:s.quality==='balanced'?.8:Math.min(win.devicePixelRatio||1,1.5);
      const w=Math.max(1,Math.min(2560,Math.round(rect.width*ratio))),h=Math.max(1,Math.min(1600,Math.round(rect.height*ratio)));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
      smooth=smooth.map((value,i)=>value+(pointer[i]-value)*.12);
      gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.pointer,...(s.pointer&&!reduced?.matches?smooth:[0,0]));gl.uniform2f(uniforms.position,s.positionX/50,s.positionY/50);
      for(const key of ['color1','color2','color3'])gl.uniform3f(uniforms[key],...s[key].slice(1).match(/../g).map(x=>parseInt(x,16)/255));
      const values={time,strength:s.strength/100,density:s.density/100,frequency:s.frequency/10,amplitude:s.amplitude/100,zoom:s.zoom/100,rotation:s.rotation*Math.PI/180,tilt:s.tilt/80,brightness:s.brightness/100,reflection:s.reflection/100,grain:s.grain/100,seed:s.seed,shape:{plane:0,wave:1,sphere:2}[s.shape]};
      for(const [key,value] of Object.entries(values))gl.uniform1f(uniforms[key],value);
      gl.drawArrays(gl.TRIANGLES,0,6);
      if(moving()||(s.pointer&&!reduced?.matches&&smooth.some((v,i)=>Math.abs(v-pointer[i])>.001)))queue();
      else last=0;
    }
    function onPointer(event){pointer=[event.clientX/Math.max(1,win.innerWidth)*2-1,1-event.clientY/Math.max(1,win.innerHeight)*2];if(settings?.shader.pointer&&!reduced?.matches)queue();}
    function onVisibility(){stop();queue();}
    doc.addEventListener('pointermove',onPointer,{passive:true});doc.addEventListener('visibilitychange',onVisibility);doc.addEventListener('fullscreenchange',onVisibility);win?.addEventListener('resize',queue);reduced?.addEventListener('change',onVisibility);
    const observer=typeof win?.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;onVisibility();}):null;
    if(options.visibilityTarget)observer?.observe(options.visibilityTarget);
    return {
      update(s){settings=s;if(!s.enabled||s.backgroundMode!=='shader'){remove();failed=false;return;}attach();queue();},
      refresh(){if(settings)this.update(settings);},
      getStatus(){return status;},
      setVisible(value){visible=value;onVisibility();},
      destroy(){disposed=true;remove();observer?.disconnect();doc.removeEventListener('pointermove',onPointer);doc.removeEventListener('visibilitychange',onVisibility);doc.removeEventListener('fullscreenchange',onVisibility);win?.removeEventListener('resize',queue);reduced?.removeEventListener('change',onVisibility);}
    };
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.ThemeShader=api;
})(typeof globalThis!=='undefined'?globalThis:this);
