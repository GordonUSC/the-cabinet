(()=>{'use strict';const host=document.querySelector('[data-gryphus-midnight]');if(!host)return;
host.classList.add('night-invitation');host.innerHTML='<div><p class="night-kicker">WHEN THE TRAILS GIVE WAY TO THE STAGE</p><h2>THE NIGHTS<br>ARE MUSIC.</h2><p>Live music until 10 p.m.<br>A whole day outside. A night together.</p></div><button class="midnight-secret" type="button" aria-label="Reveal a secret after-hours surprise"><span class="secret-moon" aria-hidden="true">☾</span><span>Psst… one more?</span><i aria-hidden="true">↗</i></button>';
const dialog=document.createElement('dialog');dialog.className='midnight-dialog';dialog.setAttribute('aria-labelledby','midnight-title');dialog.innerHTML='<button type="button" class="midnight-close" aria-label="Close the midnight surprise">×</button><div class="midnight-inner"><div class="midnight-record" aria-hidden="true"><div class="record-sun">G<br><small>AFTER DARK</small></div></div><p class="night-kicker">YOU FOUND THE AFTER-HOURS / 10 P.M. TO MIDNIGHT</p><h2 id="midnight-title">THE BOOTS<br>STAY ON.</h2><p class="midnight-artist">DISKO COWBOY</p><p class="midnight-copy">Cale, here’s a little Texas after dark.<br>Country memories. Disco energy. One more dance.</p><div class="midnight-audio"><div class="midnight-embed" data-embed></div><p class="midnight-status" role="status">Press play in the player to hear him.</p></div><div class="midnight-links"><a href="https://open.spotify.com/artist/74oX0NocVrrkOf0Mtir1wB" target="_blank" rel="noopener">More on Spotify ↗</a><a href="https://www.diskocowboy.com/" target="_blank" rel="noopener">Meet Disko Cowboy ↗</a><a href="https://vinylranch.bandcamp.com/music" target="_blank" rel="noopener">The country remix rabbit hole ↗</a></div><p class="midnight-fine">After-hours DJ concept until midnight. Disko Cowboy is Gordon’s listening inspiration for Cale; an artist booking has not been announced. Music plays through Spotify’s own player.</p></div>';
document.body.append(dialog);const q=s=>dialog.querySelector(s);
/* The music comes from Spotify's own embed, which is the licensed way to play an
   artist on someone else's page. The previous build hotlinked a Spotify preview
   file straight into an <audio> tag: outside Spotify's terms, unverifiable as his
   track, and those URLs rotate, so it would have gone silent on Cale's page later.
   The iframe is built on first open, never on page load, so no third party frame
   rides along with a page nobody has clicked yet, and it never plays by itself. */
const ARTIST='74oX0NocVrrkOf0Mtir1wB';
function embed(){
  const slot=q('[data-embed]');
  if(!slot||slot.firstChild) return;
  const f=document.createElement('iframe');
  f.src='https://open.spotify.com/embed/artist/'+ARTIST;
  f.width='100%'; f.height='152'; f.loading='lazy'; f.frameBorder='0';
  f.title='Disko Cowboy on Spotify';
  f.allow='encrypted-media; clipboard-write; picture-in-picture';
  slot.appendChild(f);
}
let generation=0;
function stop(message='Press play in the player to hear him.'){generation++;dialog.classList.remove('is-playing');q('.midnight-status').textContent=message}
function play(){document.querySelectorAll('[data-gryphus-sound]').forEach(el=>window.GryphusMood?.mount(el)?.stop());document.querySelectorAll('[data-gryphus-lineup]').forEach(el=>window.GryphusLineup?.mount(el)?.stop());generation++;embed()}
const triggers=[host.querySelector('button'),document.getElementById('gSun')].filter(Boolean);triggers.forEach(button=>button.addEventListener('click',event=>{event.preventDefault();dialog.showModal();triggers.forEach(b=>b.setAttribute('aria-expanded','true'));play()}));dialog.addEventListener('close',()=>triggers.forEach(b=>b.setAttribute('aria-expanded','false')));q('.midnight-close').onclick=()=>dialog.close();dialog.addEventListener('close',()=>stop());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});

document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',()=>stop());document.addEventListener('click',e=>{if(e.target.closest('.gm-play,.gl-load'))stop()},true);
})();
