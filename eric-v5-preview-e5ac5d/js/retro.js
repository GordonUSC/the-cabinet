/* Season retro for the finale, in Eric's own four steps, built from the season ledger.
   Shared by pc.html and index.html. Needs js/ledger.js. Plain script, no build step. */
(function(){
  'use strict';
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var BOARD=['house','dad','cider','grow','table','portal','pride','call','bow'];
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function n(x){ return (+x||0).toLocaleString('en-US'); }
  function day(iso){ var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(iso||''); return m?MON[+m[2]-1]+' '+(+m[3]):''; }
  function L(){ try{ return window.ledger?window.ledger.get():null; }catch(e){ return null; } }
  function done(d,id){ return d&&d.items&&d.items[id]&&d.items[id].status==='Done'?d.items[id]:null; }
  function last(it){ return (it&&it.last)||{}; }

  var css='.retro{position:absolute;inset:0;z-index:9;display:none;overflow:auto;padding:clamp(72px,8vh,96px) clamp(16px,4vw,72px) 32px;background:linear-gradient(180deg,rgba(9,18,24,.78),rgba(9,18,24,.92));color:#fffdf8;text-align:left}'+
  '.retro.on{display:block}'+
  '.retro h2{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:clamp(32px,3.2vw,56px);margin:0;text-align:center}'+
  '.retro .rsub{text-align:center;color:#d6e2dc;font-size:18px;margin:6px 0 24px}'+
  '.retro .rcards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;max-width:1720px;margin:0 auto}'+
  '.retro .rc{background:linear-gradient(rgba(255,253,248,.9),rgba(255,253,248,.95)),var(--rbg,none) center/cover,#fffdf8;color:#1b2a30;border-radius:10px;border-top:8px solid var(--rc,#e9c46a);padding:18px 18px 20px;box-shadow:0 18px 40px rgba(0,0,0,.45);font-size:17px;line-height:1.45}'+
  '.retro.on .rc{animation:rcin .6s cubic-bezier(.2,.9,.3,1) both}'+
  '.retro.on .rc:nth-child(2){animation-delay:.35s}.retro.on .rc:nth-child(3){animation-delay:.7s}.retro.on .rc:nth-child(4){animation-delay:1.05s}'+
  '@keyframes rcin{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}'+
  '.retro .rn{font:700 13px/1 var(--sans,system-ui,sans-serif);letter-spacing:.12em;text-transform:uppercase;color:#5b6870}'+
  '.retro .rc h3{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:26px;line-height:1.1;margin:6px 0 10px}'+
  '.retro .rc p{margin:0 0 8px}'+
  '.retro .rc ul{margin:0 0 8px;padding-left:18px}.retro .rc li{margin:3px 0}'+
  '.retro .num{font-weight:700;color:#0b6b5f}'+
  '.retro .firsts{font-size:15px;color:#5b6870}'+
  '.retro label{display:block;font-weight:700;margin:6px 0 6px}'+
  '.retro input{width:100%;min-height:48px;font:inherit;font-size:17px;padding:8px 12px;border:2px solid #c9b98f;border-radius:8px;background:#fff;color:#1b2a30;box-sizing:border-box}'+
  '.retro .rbtn{min-height:48px;padding:10px 18px;border-radius:999px;border:0;font:700 16px var(--sans,system-ui,sans-serif);cursor:pointer;background:#00c875;color:#fff;margin-top:10px}'+
  '.retro .rbtn.gold{background:#e9c46a;color:#13232b;font-size:18px;padding:12px 28px}'+
  '.retro .saved{margin-top:10px;padding:10px 12px;background:#eef8f1;border-left:6px solid #00c875;border-radius:6px;font-size:15px}'+
  '.retro .racts{text-align:center;margin-top:26px}'+
  '@media (max-width:1100px){.retro .rcards{grid-template-columns:repeat(2,minmax(0,1fr))}}'+
  '@media (max-width:640px){.retro .rc{background:linear-gradient(rgba(255,253,248,.9),rgba(255,253,248,.95)),var(--rbgs,none) center/cover,#fffdf8}.retro{padding:72px 16px 28px}.retro .rcards{grid-template-columns:1fr;gap:14px}.retro .rc{font-size:16px}}'+
  '@media (prefers-reduced-motion:reduce){.retro.on .rc{animation:none}}';

  function credits(d){
    var out=[]; if(!d) return out;
    var r=done(d,'rosemaling'); if(r) out.push(['Rosemaling','Painted by Eric, '+n(last(r).strokes)+' strokes']);
    var u=done(d,'un-gloom'); if(u) out.push(['Un-Gloom','Happily ever after in '+n(last(u).plays)+' plays']);
    var m=done(d,'doing-the-most'); if(m) out.push(['Doing the Most',n(last(m).caught)+' plates caught, '+n(last(m).kept)+' of '+(+last(m).total||6)+' kept spinning'+(+last(m).protected?', '+n(last(m).protected)+' protected':'')]);
    var c=done(d,'mission-control'); if(c) out.push(['Mission Control, Executive Producer',last(c).event||'The launch']);
    var b=done(d,'dragon-house-blocks'); if(b) out.push(['Dragon House in Blocks',n(last(b).blocks)+' blocks placed, Restored by Eric']);
    return out;
  }
  function celebrate(d){
    var h='<p>Crystal, the love of your life. James, Henry, and Oscar. Gordon on the call. Every legend who pulled up a chair at the Dragon Table.</p>';
    if(done(d,'doing-the-most')) h+='<p>In Doing the Most, Crystal, Gordon, James, Henry, and Oscar stepped in when the plates got heavy.</p>';
    if(done(d,'mission-control')) h+='<p>Your Mission Control crew shipped the launch: Darby, dot, Astra, Tasklet, and Ideas.</p>';
    if(done(d,'un-gloom')) h+='<p>Five portraits at the Un-Gloom table, every one of them full of joy.</p>';
    return h;
  }
  function gather(d){
    if(!d) return '<p>The ledger is open. Every number starts here.</p>';
    var nb=BOARD.filter(function(k){return d.done&&d.done[k];}).length;
    var nx=(window.ledger?window.ledger.BONUS:[]).filter(function(b){return done(d,b.id);}).length;
    var t=d.tally||{}, rows=[];
    rows.push('<li><span class="num">'+nb+' of 9</span> board Items Done</li>');
    rows.push('<li><span class="num">'+nx+' of 5</span> Bonus round Items Done</li>');
    [['plates','plates caught','plate caught'],['protected','plates protected by the guardian','plate protected by the guardian'],['strokes','strokes painted','stroke painted'],['joy','joy laid down','joy laid down'],['blocks','blocks placed','block placed'],['perfects','perfect placements','perfect placement'],['launches','shows launched','show launched'],['lanterns','Sky Ship lanterns lit','Sky Ship lantern lit'],['jars','jars pressed','jar pressed'],['mugs','mugs renewed','mug renewed']].forEach(function(p){ var v=+t[p[0]]; if(v) rows.push('<li><span class="num">'+n(v)+'</span> '+(v===1?p[2]:p[1])+'</li>'); });
    var f=d.firsts||{}, fk=Object.keys(f).sort(function(a,b){return (f[a].date||'').localeCompare(f[b].date||'');});
    var fl=fk.length?'<p class="firsts"><b>Firsts:</b> '+fk.map(function(k){return esc(f[k].label)+', '+day(f[k].date);}).join('. ')+'.</p>':'<p class="firsts">No Firsts stamped yet. The Bonus round hands them out.</p>';
    return '<ul>'+rows.join('')+'</ul>'+fl;
  }
  function learn(d){
    var o=[], NM={'doing-the-most':'Doing the Most','mission-control':'Mission Control'};
    var us=(d&&d.unstuck)||{}; Object.keys(us).forEach(function(k){ var r=us[k]||{};
      o.push((NM[k]||k)+' arrived Stuck. You '+(r.breath==='skipped'?'took a short breath':'breathed first')+', then moved it TOGETHER with Gordon'+((+r.onBeat||0)>=3?', '+r.onBeat+' of '+r.presses+' on the beat.':'. He kept time with you.')); });
    if(d&&d.guardian) o.push('You placed a guardian at the Dragon House, so the plates in Doing the Most landed safe.');
    if(d&&d.done&&d.done.bow) o.push('Take a bow sat at Stuck all season. You took it anyway.');
    else o.push('Take a bow is still Stuck. First, breathe. It will keep.');
    var u=done(d,'un-gloom'); if(u){ var p=+last(u).plays||0; o.push('Un-Gloom: covering a bright seal costs joy. You finished in '+p+(p<=11?', at par or better.':', par is 11.')); }
    var m=done(d,'doing-the-most'); if(m){ var k=+last(m).kept||0, tt=+last(m).total||6; o.push(k===tt?'Doing the Most: you kept all '+tt+' in the air, and help still came.':'Doing the Most: when a plate fell, someone held it. You kept '+k+' of '+tt+'.'); }
    var r=done(d,'rosemaling'); if(r) o.push('Rosemaling: '+n(last(r).strokes)+' strokes before the Bloom. The work made the frame.');
    var c=done(d,'mission-control'); if(c) o.push('Mission Control: '+n(last(c).matches)+' of '+n(last(c).items||7)+' perfect matches. The right owner shortens the work.');
    var b=done(d,'dragon-house-blocks'); if(b) o.push('Dragon House in Blocks: one sheet at a time, and the house stood.');
    if(o.length===1) o.push('Learnings come from play. The Bonus round is waiting on the board.');
    return '<ul>'+o.slice(0,6).map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';
  }
  function savedHTML(dr){ return '<div class="saved"><b>Season \'27</b><br>Item: '+esc(dr.name)+'<br>Owner: Eric. Status: Not started.</div>'; }
  function dream(d){
    var dr=d&&d.dream; var v=dr&&dr.name?esc(dr.name):'';
    return '<label for="dream27">One new Item for Season \'27</label><input id="dream27" type="text" maxlength="80" autocomplete="off" placeholder="Name the Item" value="'+v+'">'+
      '<button class="rbtn" type="button" id="dreamsave">Add to \'27</button><div id="dreamout">'+(dr&&dr.name?savedHTML(dr):'')+'</div>';
  }
  var Retro={
    credits:credits,
    /* adds one credit line per bonus game played, right before the anchor element */
    fillCredits:function(roll,anchor){ if(!roll) return; roll.querySelectorAll('.retro-cr').forEach(function(e){e.remove();});
      credits(L()).forEach(function(c){ var k=document.createElement('div'); k.className='k retro-cr'; k.textContent=c[0]; var v=document.createElement('div'); v.className='v retro-cr'; v.textContent=c[1];
        if(anchor&&anchor.parentNode===roll){ roll.insertBefore(k,anchor); roll.insertBefore(v,anchor); } else { roll.appendChild(k); roll.appendChild(v); } }); },
    open:function(host,then){
      if(!document.getElementById('retro-css')){ var s=document.createElement('style'); s.id='retro-css'; s.textContent=css; document.head.appendChild(s); }
      var el=document.getElementById('retro'); if(!el){ el=document.createElement('div'); el.id='retro'; el.className='retro'; el.setAttribute('role','region'); el.setAttribute('aria-label','Season retro'); host.appendChild(el); }
      var d=L();
      el.innerHTML='<h2>Season \'26 retro</h2><p class="rsub">Your four steps, in your order, from what you actually did.</p><div class="rcards">'+
        '<article class="rc" style="--rc:#00c875;--rbg:url(img/v5/retro-1.jpg);--rbgs:url(img/v5/retro-1-600.jpg)"><div class="rn">Step 1</div><h3>Celebrate the participants</h3>'+celebrate(d)+'</article>'+
        '<article class="rc" style="--rc:#579bfc;--rbg:url(img/v5/retro-2.jpg);--rbgs:url(img/v5/retro-2-600.jpg)"><div class="rn">Step 2</div><h3>Gather Data</h3>'+gather(d)+'</article>'+
        '<article class="rc" style="--rc:#a25ddc;--rbg:url(img/v5/retro-3.jpg);--rbgs:url(img/v5/retro-3-600.jpg)"><div class="rn">Step 3</div><h3>Explore Learnings</h3>'+learn(d)+'</article>'+
        '<article class="rc" style="--rc:#e9c46a;--rbg:url(img/v5/retro-4.jpg);--rbgs:url(img/v5/retro-4-600.jpg)"><div class="rn">Step 4</div><h3>Dream of What\'s Next</h3>'+dream(d)+'</article>'+
        '</div><div class="racts"><button class="rbtn gold" type="button" id="retrodone">Close the season</button></div>';
      el.classList.add('on'); el.scrollTop=0;
      var inp=el.querySelector('#dream27'), out=el.querySelector('#dreamout');
      function save(){ var v=(inp.value||'').replace(/\s+/g,' ').trim().slice(0,80); if(!v){ inp.focus(); return; }
        var dr={name:v,owner:'Eric',status:'Not started',season:"'27",at:new Date().toISOString().slice(0,10)};
        try{ if(window.ledger){ window.ledger.save({dream:dr}); window.ledger.first('dream27',"First Item for Season '27"); } }catch(e){}
        out.innerHTML=savedHTML(dr); }
      el.querySelector('#dreamsave').addEventListener('click',save);
      inp.addEventListener('keydown',function(e){ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); save(); } });
      el.querySelector('#retrodone').addEventListener('click',function(){ el.classList.remove('on'); if(then) then(); });
      setTimeout(function(){ try{ el.querySelector('#retrodone').focus({preventScroll:true}); }catch(e){} }, RM?0:1300);
      return el;
    },
    close:function(){ var el=document.getElementById('retro'); if(el) el.classList.remove('on'); }
  };
  window.Retro=Retro;
})();
