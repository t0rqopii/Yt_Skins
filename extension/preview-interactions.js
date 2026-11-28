/* Local, deterministic browsing simulator. No YouTube account actions or network requests. */
(function(root){
  'use strict';
  function create(doc,win,{onView,onEdit}={}) {
    let view='home',playing=false,seconds=134,selected=1,category='All',query='',library='Home',timer=0;
    const saved=new Set(),liked=new Set(),cards=[...doc.querySelectorAll('.feed > ytd-rich-item-renderer')];
    const topics=['Design','Music','Design','Podcasts','Live','Music'];
    const $=selector=>doc.querySelector(selector);
    function notice(text){const node=$('#preview-note');if(node){node.setAttribute('role','status');node.textContent=text;}}
    function filter(){
      let count=0;
      cards.forEach((card,i)=>{card.hidden=!!((category!=='All'&&category!=='For you'&&topics[i]!==category)||(query&&!card.textContent.toLowerCase().includes(query))||(library==='Watch later'&&!saved.has(i))||(library==='Liked videos'&&!liked.has(i)));if(!card.hidden)count++;});
      notice(`${count} sample videos${library!=='Home'?' · '+library:''}${query?' matching “'+query+'”':''}. Changes here stay in the preview.`);
    }
    function setView(next){view=next;doc.documentElement.dataset.view=next;if(next==='home'){playing=false;doc.documentElement.dataset.previewFullscreen='false';$('.html5-video-player')?.classList.remove('preview-fullscreen');doc.dispatchEvent(new win.Event('fullscreenchange'));}syncPlayer();onView?.(next);}
    function clock(value){return Math.floor(value/60)+':'+String(Math.floor(value%60)).padStart(2,'0');}
    function syncPlayer(){
      const play=$('[data-sample=play]');if(play){play.textContent=playing?'Ⅱ':'▶';play.setAttribute('aria-label',playing?'Pause sample':'Play sample');play.setAttribute('aria-pressed',String(playing));}
      const time=$('[data-sample=time]');if(time)time.textContent=clock(seconds)+' / 8:24';
      const seek=$('[data-sample=seek]');if(seek)seek.value=seconds;
      const bar=$('.ytp-play-progress');if(bar)bar.style.width=(seconds/504*100)+'%';
      $('.movie-art')?.classList.toggle('sample-playing',playing);
      for(const [key,set] of [['like',liked],['save',saved]]){const b=$(`[data-sample=${key}]`);if(b){b.setAttribute('aria-pressed',String(set.has(selected)));b.textContent=key==='like'?(set.has(selected)?'♥ Liked':'♡ Like'):(set.has(selected)?'✓ Saved':'＋ Watch later');}}
      clearInterval(timer);timer=0;
      if(playing&&!doc.hidden)timer=win.setInterval(()=>{seconds=Math.min(504,seconds+1);if(seconds===504)playing=false;syncPlayer();},1000);
    }
    function openVideo(index){
      selected=index;seconds=0;playing=false;const card=cards[index];if(!card)return;
      const art=card.querySelector('yt-thumbnail-view-model > svg');if(art)$('.movie-art').replaceChildren(art.cloneNode(true));
      $('.watch #video-title').textContent=card.querySelector('h3').textContent;
      $('.watch ytd-channel-name').textContent=card.querySelector('yt-content-metadata-view-model a').textContent;
      setView('watch');notice('Interactive sample · play, seek, like, save, or try theater view. No real video or account activity.');
    }
    function button(label,action){const b=doc.createElement('button');b.type='button';b.className='sample-action';b.dataset.sample=action;b.textContent=label;return b;}
    const buttons=$('.player-buttons');
    if(buttons){buttons.replaceChildren(button('▶','play'));const time=doc.createElement('span');time.dataset.sample='time';buttons.append(time,button('▭ Theater','theater'),button('⛶ Fullscreen sample','fullscreen'));}
    const progress=$('.ytp-progress-bar');
    if(progress){const seek=doc.createElement('input');seek.type='range';seek.min=0;seek.max=504;seek.value=seconds;seek.dataset.sample='seek';seek.setAttribute('aria-label','Seek sample video');progress.append(seek);}
    const meta=$('ytd-watch-metadata');if(meta){const actions=doc.createElement('div');actions.className='sample-actions';actions.append(button('♡ Like','like'),button('＋ Watch later','save'),button('← Back to feed','home'));meta.append(actions);}
    cards.forEach((card,i)=>{card.dataset.sampleIndex=i;const thumb=card.querySelector('yt-thumbnail-view-model');thumb.setAttribute('role','button');thumb.setAttribute('aria-label','Open sample: '+card.querySelector('h3').textContent);});
    function onClick(event){
      const node=event.target, action=node.closest('[data-sample]')?.dataset.sample;
      if(action==='play'){playing=!playing;if(seconds===504)seconds=0;syncPlayer();return;}
      if(action==='like'||action==='save'){const set=action==='like'?liked:saved;set.has(selected)?set.delete(selected):set.add(selected);syncPlayer();filter();return;}
      if(action==='theater'){const on=$('.watch').classList.toggle('sample-theater');node.closest('button').setAttribute('aria-pressed',String(on));return;}
      if(action==='fullscreen'){const on=$('.html5-video-player').classList.toggle('preview-fullscreen');doc.documentElement.dataset.previewFullscreen=String(on);node.closest('button').setAttribute('aria-pressed',String(on));doc.dispatchEvent(new win.Event('fullscreenchange'));return;}
      if(action==='home'||node.closest('a#logo')){setView('home');filter();return;}
      const chip=node.closest('.ytChipShapeChip');if(chip){category=chip.textContent.trim();doc.querySelectorAll('.ytChipShapeChip').forEach(b=>{b.classList.toggle('ytChipShapeActive',b===chip);b.setAttribute('aria-pressed',String(b===chip));});filter();return;}
      const nav=node.closest('ytd-guide-entry-renderer');if(nav){library=nav.textContent.trim();category='All';doc.querySelectorAll('.ytChipShapeChip').forEach((b,i)=>{b.classList.toggle('ytChipShapeActive',i===0);b.setAttribute('aria-pressed',String(i===0));});setView('home');doc.querySelectorAll('ytd-guide-entry-renderer').forEach(el=>el.toggleAttribute('active',el===nav));filter();return;}
      if(node.closest('[aria-label=Menu]')){doc.documentElement.classList.toggle('sample-sidebar-hidden');return;}
      if(node.closest('[aria-label="Voice search"]')){notice('Voice search is available on YouTube. Type in the sample search to filter these videos.');return;}
      const card=node.closest('[data-sample-index]');
      if(card&&node.closest('[aria-label="Video menu"]')){const i=Number(card.dataset.sampleIndex);saved.has(i)?saved.delete(i):saved.add(i);notice(saved.has(i)?'Saved to sample Watch later. Open Watch later in the sidebar.':'Removed from sample Watch later.');node.closest('button').setAttribute('aria-pressed',String(saved.has(i)));filter();return;}
      if(card&&node.closest('yt-thumbnail-view-model,h3'))openVideo(Number(card.dataset.sampleIndex));
    }
    function onKey(event){
      if(event.target.matches('input,textarea,select'))return;
      if(event.key==='Escape'){doc.documentElement.dataset.previewFullscreen='false';$('.preview-fullscreen')?.classList.remove('preview-fullscreen');doc.dispatchEvent(new win.Event('fullscreenchange'));return;}
      if(['Enter',' '].includes(event.key)&&event.target.matches('yt-thumbnail-view-model')){event.preventDefault();event.target.click();}
      else if(view==='watch'&&['k',' ','ArrowLeft','ArrowRight'].includes(event.key)&&event.target===doc.body){event.preventDefault();if(event.key==='k'||event.key===' ')playing=!playing;else seconds=Math.max(0,Math.min(504,seconds+(event.key==='ArrowRight'?5:-5)));syncPlayer();}
    }
    function onInput(event){if(event.target.dataset.sample==='seek'){seconds=Number(event.target.value);syncPlayer();}}
    function visibility(){syncPlayer();}
    doc.addEventListener('click',onClick);doc.addEventListener('keydown',onKey);doc.addEventListener('input',onInput);doc.addEventListener('visibilitychange',visibility);
    syncPlayer();
    return {search(value){query=value.trim().toLowerCase();category='All';library='Home';doc.querySelectorAll('.ytChipShapeChip').forEach((b,i)=>b.classList.toggle('ytChipShapeActive',i===0));setView('home');filter();},setView,destroy(){clearInterval(timer);doc.removeEventListener('click',onClick);doc.removeEventListener('keydown',onKey);doc.removeEventListener('input',onInput);doc.removeEventListener('visibilitychange',visibility);}};
  }
  root.ThemePreviewInteractions={create};
})(globalThis);
