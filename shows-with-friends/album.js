/* Two real archive frames. No inferred identities or future guest lists. */
(()=>{'use strict';
const host=document.querySelector('#shared-memory'),frame=host.querySelector('.contactsheet'),photo=frame.querySelector('img'),edge=frame.querySelector('.photoedge'),copy=host.querySelector('.memorycopy'),film=document.querySelector('#film'),filmButton=document.querySelector('#filmToggle');
host.classList.add('memory-album');
const choices=document.createElement('div');choices.className='album-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label','Choose an archive memory');
choices.innerHTML='<button data-memory="edc" aria-pressed="true"><small>01 / EDC</small><strong>The faces.</strong><span>A moving memory ↗</span></button><button data-memory="ultra" aria-pressed="false"><small>02 / ULTRA MIAMI · 2022</small><strong>The feeling.</strong><span>Open the archive ↗</span></button>';
host.prepend(choices);
photo.id='albumPhoto';photo.alt='Gordon and friends smiling under colorful festival lights';
const enlarge=document.createElement('button');enlarge.className='album-enlarge';enlarge.textContent='⤢ See the whole photograph';enlarge.setAttribute('aria-haspopup','dialog');frame.append(enlarge);
const caption=document.createElement('p');caption.className='album-caption';caption.id='albumCaption';caption.setAttribute('aria-live','polite');frame.append(caption);
const question=document.createElement('details');question.className='album-question';question.innerHTML='<summary>Take a little of this into our next night</summary><p id="albumInvitation"></p><a href="#night-plan">Back to our selected night ↑</a>';copy.append(question);
const modal=document.createElement('dialog');modal.className='album-lightbox';modal.setAttribute('aria-label','Archive photograph');modal.innerHTML='<form method="dialog"><button aria-label="Close photograph">Close ×</button></form><img alt=""><p></p>';document.body.append(modal);
const stories={edc:{src:'assets/edc-crew.jpeg',alt:'Gordon and friends smiling under colorful festival lights',edge:'EDC / FROM GORDON’S COLLECTION',heading:'That look<br>on our <em>faces.</em>',intro:'A whole night can come back in one photograph.',caption:'A shared EDC memory from Gordon’s collection.',invitation:'Before the next show, each choose one moment you hope to share. Afterwards, compare what surprised you. Leave room for the unplanned part.'},ultra:{src:'assets/ultra-miami-memory.jpeg',alt:'Festivalgoers beneath a roof of cyan lights at Ultra Miami, with daylight entering behind the stage structure',edge:'ULTRA MIAMI / MARCH 25, 2022',heading:'Step back<br>into the <em>feeling.</em>',intro:'Daylight at the edges. Blue light overhead. A room full of possibility.',caption:'A moment shared in the Ultra Miami group chat, March 25, 2022.',invitation:'The Ultra messages circle back to finding each other. For our next night: pick an easy meeting place before the music starts, then give each other room to explore.'}};
let current='edc';
function select(id){current=id;const s=stories[id];film.pause();film.hidden=true;filmButton.setAttribute('aria-expanded','false');filmButton.textContent='▶ Let the memory move';filmButton.hidden=id!=='edc';photo.src=s.src;photo.alt=s.alt;edge.textContent=s.edge;caption.textContent=s.caption;copy.querySelector('h2').innerHTML=s.heading;copy.querySelector('h2 + p').textContent=s.intro;document.querySelector('#albumInvitation').textContent=s.invitation;question.open=false;host.dataset.memory=id;choices.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.memory===id));}
choices.querySelectorAll('button').forEach(b=>b.onclick=()=>select(b.dataset.memory));
enlarge.onclick=()=>{const s=stories[current];modal.querySelector('img').src=s.src;modal.querySelector('img').alt=s.alt;modal.querySelector('p').textContent=s.caption;film.pause();modal.showModal();};
modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});
photo.addEventListener('error',()=>{caption.textContent=stories[current].caption+' The photograph could not load. Please try the other memory or return when connected.';});
select('edc');
})();
