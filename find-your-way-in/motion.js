/* Shared motion for both editions. Content is fully visible without this file. */
(function(){
  var d=document.documentElement, reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.classList.remove('nojs'); d.classList.add('js'); if(reduce) d.classList.add('calm');
  var vids=[].slice.call(document.querySelectorAll('video[data-loop]'));
  vids.forEach(function(v){ if(reduce){v.removeAttribute('autoplay');v.pause();return}
    v.muted=true; var p=v.play(); if(p&&p.catch)p.catch(function(){}); });
  if(!('IntersectionObserver' in window)){[].forEach.call(document.querySelectorAll('.rv,.door'),function(x){x.classList.add('in','open')});return}
  // play loops only while on screen
  var vio=new IntersectionObserver(function(es){es.forEach(function(e){ if(reduce)return; if(e.isIntersecting){var p=e.target.play();if(p&&p.catch)p.catch(function(){})}else e.target.pause()})},{threshold:.05});
  vids.forEach(function(v){vio.observe(v)});
  // staggered reveals
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in','open');io.unobserve(e.target)}})},{threshold:.2,rootMargin:'0px 0px -6% 0px'});
  [].forEach.call(document.querySelectorAll('.rv,.door'),function(x){io.observe(x)});
  // count-up numbers
  [].forEach.call(document.querySelectorAll('[data-count]'),function(el){
    var to=+el.getAttribute('data-count'), suf=el.getAttribute('data-suffix')||'';
    var cio=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;cio.disconnect(); if(reduce){return}
      var t0=performance.now(),dur=1400;(function f(t){var k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e).toLocaleString()+suf;if(k<1)requestAnimationFrame(f)})(t0)},{threshold:.6});
    cio.observe(el)});
  // hero parallax and fade
  var hero=document.querySelector('.hero .media'); if(hero&&!reduce&&window.matchMedia('(min-width: 900px)').matches){var tick=false;
    addEventListener('scroll',function(){if(tick)return;tick=true;requestAnimationFrame(function(){var y=scrollY;hero.style.transform='translate3d(0,'+(y*.35)+'px,0) scale(1.04)';tick=false})},{passive:true})}
})();
/* interaction layer: wish, door finder, reply cards */
(function(){
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TO='gbellamyai@gmail.com';
  function openDoor(id){var d=document.getElementById(id);if(!d)return;
    [].forEach.call(document.querySelectorAll('.door.pick'),function(x){x.classList.remove('pick')});
    d.classList.add('open','in','pick'); d.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    setTimeout(function(){d.classList.remove('pick')},4000); try{d.focus({preventScroll:true})}catch(e){}}
  [].forEach.call(document.querySelectorAll('a[href^="#"]'),function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href').slice(1);if(document.getElementById(id)&&document.getElementById(id).classList.contains('door')){e.preventDefault();openDoor(id);history.replaceState(null,'','#'+id)}})});
  // confetti
  var cv=document.getElementById('confetti'),cx=cv&&cv.getContext&&cv.getContext('2d');
  function burst(){if(!cx||reduce)return;var W=cv.width=innerWidth*devicePixelRatio,H=cv.height=innerHeight*devicePixelRatio;cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';
    var C=['#ff3d8b','#ff8a3d','#ffd166','#7ee0b5','#1fb6d6','#b9a6ff','#fff7ee'],P=[];
    for(var i=0;i<180;i++)P.push({x:W/2,y:H*.62,vx:(Math.random()-.5)*26*devicePixelRatio,vy:-(Math.random()*24+10)*devicePixelRatio,r:(Math.random()*6+4)*devicePixelRatio,c:C[i%C.length],a:Math.random()*6,s:(Math.random()-.5)*.4});
    var t0=performance.now();(function f(t){var k=(t-t0)/1300;cx.clearRect(0,0,W,H);P.forEach(function(p){p.vy+=.7*devicePixelRatio;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.a+=p.s;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.globalAlpha=Math.max(0,1-k);cx.fillStyle=p.c;cx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);cx.restore()});if(k<1)requestAnimationFrame(f);else cx.clearRect(0,0,W,H)})(t0)}
  var w=document.querySelector('.wish'); if(w){w.hidden=false;w.addEventListener('click',function(){burst();w.classList.add('done');w.textContent='✨ 56 candles out. Now tap your way in above.';var f=document.querySelector('.nav');setTimeout(function(){f&&f.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'})},reduce?0:1400)})}
  // reply cards
  [].forEach.call(document.querySelectorAll('form.reply'),function(f){f.hidden=false;
    f.addEventListener('submit',function(e){e.preventDefault();
      var picks=[].map.call(f.querySelectorAll('input[name=pick]:checked'),function(x){return x.value});
      var nm=(f.querySelector('.nm').value||'').trim(), ok=f.querySelector('.ok');
      if(!picks.length){ok.textContent='Choose one or more ways you would like to join.';return}
      if(!nm){ok.textContent='Add your name so Gordon knows who said yes.';f.querySelector('.nm').focus();return}
      var door=f.getAttribute('data-door');
      var body='Name: '+nm+'\nDoor: '+door+'\nI am in for: '+picks.join(', ')+'\n\n(Anything else you want Gordon to know:)\n';
      location.href='mailto:'+TO+'?subject='+encodeURIComponent('Birthday door '+door+': '+nm)+'&body='+encodeURIComponent(body);
      ok.innerHTML='Email draft opened. Review it and press Send there. No mail app? <button type="button" class="copy">Copy my note</button> and send it to gbellamyai@gmail.com';
      var cb=ok.querySelector('.copy'); if(cb)cb.onclick=function(){var t=body;(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t):Promise.reject()).then(function(){cb.textContent='Copied!'},function(){cb.textContent='Copy failed, write to gbellamyai@gmail.com'})};
    })});
})();

/* pause motion */
(function(){var b=document.querySelector('.pause'),d=document.documentElement;if(!b)return;b.hidden=false;
  function set(on){d.classList.toggle('calm',on);b.setAttribute('aria-pressed',on?'true':'false');b.textContent=on?'Play motion':'Pause motion';
    [].forEach.call(document.querySelectorAll('video[data-loop]'),function(v){if(on)v.pause();else{var p=v.play();if(p&&p.catch)p.catch(function(){})}})}
  var mq=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)');if(mq&&mq.matches)set(true);
  if(mq&&mq.addEventListener)mq.addEventListener('change',function(e){set(e.matches)});
  b.addEventListener('click',function(){set(!d.classList.contains('calm'))});
  window.__calm=function(){return d.classList.contains('calm')};
})();
