(() => {
  const $=s=>document.querySelector(s), sound=$('#sound'), music=$('#music'), motion=$('#motion');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let calm=reduced.matches;
  function setCalm(v){calm=v;document.documentElement.classList.toggle('calm',v);motion.setAttribute('aria-pressed',String(v));motion.textContent=v?'Calm motion on':'Calm motion';}
  setCalm(calm);motion.onclick=()=>setCalm(!calm);
  reduced.addEventListener('change',e=>setCalm(e.matches));
  music.volume=.25;
  function silent(){music.pause();sound.textContent='Sound off';sound.setAttribute('aria-pressed','false');}
  sound.onclick=async()=>{if(!music.paused){silent();return;}try{await music.play();sound.textContent='Sound on';sound.setAttribute('aria-pressed','true');}catch(_){$('#status').textContent='Audio could not start. Every part of the experience still works silently.';silent();}};
  document.addEventListener('visibilitychange',()=>{if(document.hidden)silent();});window.addEventListener('pagehide',silent);
  const stops=[{title:'First, a night to look forward to.',body:'Shows with Friends is an invitation, not a guest list you have to belong to already. Find a night, save it, and bring a possible plan back to the conversation.',href:'https://gordonusc.github.io/the-cabinet/shows-with-friends/',link:'Find a night with Gordon ↗'}, {title:'Then, take a playful detour.',body:'Island Hop turns chapters of Gordon’s life into eight little places to explore. The guided hop handles the first flight. The reading path lets you enjoy the story without learning the controls.',href:'https://gordonusc.github.io/island-hop/',link:'Take the guided hop ↗'}, {title:'Finally, follow the thread.',body:'The media log opens the public conversations. The Vanderbilt record takes the longer view, with gratitude to Camilla Benbow and David Lubinski. Our reading: the consistent theme is helping more people see themselves in the picture.',href:'https://gordonusc.github.io/media-log/#watch',link:'Watch a conversation ↗'}];
  let step=0;
  function show(){const s=stops[step];$('#guide-content').replaceChildren();const h=document.createElement('h2');h.id='guide-title';h.textContent=s.title;const p=document.createElement('p');p.textContent=s.body;const a=document.createElement('a');a.href=s.href;a.textContent=s.link;$('#guide-content').append(h,p,a);$('#guide-step').textContent='0'+(step+1)+' / 03';$('#guide-prev').disabled=step===0;$('#guide-next').textContent=step===2?'Choose a door ↓':'Next stop →';}
  function close(){ $('#guide').hidden=true;$('#tour').focus(); }
  $('#tour').onclick=()=>{step=0;show();$('#guide').hidden=false;$('#guide').focus();$('#guide').scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});};
  $('#close-guide').onclick=close;$('#guide-prev').onclick=()=>{if(step>0){step--;show();}};
  $('#guide-next').onclick=()=>{if(step<2){step++;show();}else{$('#guide').hidden=true;$('#doors').scrollIntoView({behavior:calm?'auto':'smooth'});$('.door').focus();}};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#guide').hidden)close();});
  $('#perspective-more').onclick=()=>{const p=$('#perspective-note');p.hidden=!p.hidden;$('#perspective-more').setAttribute('aria-expanded',String(!p.hidden));};
  $('#copy-link').onclick=async()=>{if(location.hostname==='127.0.0.1'||location.hostname==='localhost'){$('#status').textContent='This is your local review. A shareable link will be added when the approved edition is published.';return;}try{await navigator.clipboard.writeText(location.href.split('#')[0]);$('#status').textContent='Link copied. Share it with someone you’d like to explore with.';}catch(_){$('#status').textContent='Copy the page address from your browser to share it.';}};
})();
