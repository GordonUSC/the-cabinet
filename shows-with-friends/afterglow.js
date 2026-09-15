(()=>{
 document.querySelector('#jumpJam').onclick=()=>{if(selected.kind!=='Music'){selected=DATA.find(x=>x.id==='portola');document.querySelector('#filter').value='all';draw();}document.querySelector('#night-instrument').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});};
 const nav=document.createElement('nav');nav.className='night-jumps';nav.setAttribute('aria-label','Explore this night');nav.innerHTML='<a href="#night-plan">Our plan ↘</a><a href="#shared-memory" data-music-link>Our memories ↘</a><a href="#night-instrument" data-music-link>Make music ↘</a>';document.querySelector('#turntable').append(nav);
 const prev=draw;draw=function(){prev();document.body.dataset.night=selected.id;document.querySelectorAll('[data-music-link]').forEach(a=>a.hidden=selected.kind!=='Music');};draw();
})();
