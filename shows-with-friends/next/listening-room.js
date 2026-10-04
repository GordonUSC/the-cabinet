(() => {
 const button=document.getElementById('memory-draw'),img=document.getElementById('welcome-memory');if(!button||!img)return;
 const memories=window.MIXER_ANNIV||[];let picks=memories.filter(x=>['gryphus-cale-2026','second-sky','shambhala-2025-river','zero-proof-pinball'].includes(x.id));
 if(new URLSearchParams(location.search).get('for')==='cale'){picks.sort((a,b)=>(b.id==='gryphus-cale-2026')-(a.id==='gryphus-cale-2026'));const select=document.getElementById('friend-select');if(select){select.value='Cale';select.dispatchEvent(new Event('change'));}}
 // This site's existing, attributed public photo index is the sole memory source.
 if(!picks.length){button.hidden=true;return}
 let position=-1;button.addEventListener('click',()=>{position=(position+1)%picks.length;const m=picks[position],events=window.MIXER_EVENTS||[],next=events.find(e=>(m.events||[]).includes(e.id));const pre=document.body.dataset.pre||'';
 img.src=pre+m.thumb.replace('-thumb.webp','.webp');img.alt=m.title+' · photograph from Gordon’s album';img.style.objectPosition=m.id==='gryphus-cale-2026'?'50% 82%':'50% 50%';
 document.getElementById('memory-caption').textContent=m.title+' · '+new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric'}).format(new Date(m.date+'T12:00:00'));
 const reveal=document.getElementById('memory-discovery');reveal.className='ticket-memory';reveal.hidden=false;document.getElementById('memory-note').textContent=m.line;const a=document.getElementById('memory-next');a.textContent=next?'Follow the '+next.name+' thread ↗':'Find the next chapter ↗';a.href=next?pre+'next/night/'+next.id+'.html':'#find-night';button.textContent='Keep digging ↻';});
})();
