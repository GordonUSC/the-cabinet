/* Season '26 month Groups for the board (both editions). Needs js/ledger.js.
   Oct '26 to Mar '27, one bonus Item per month. Two Items arrive Stuck by design (Nov, Jan):
   opening one runs "First, breathe" (10 s, skippable after 3 s), then a TOGETHER move where
   Gordon's seat presses in sync with Eric's rhythm. Then the Item is back to Working on it.
   Never a fail. Also: the season ledger card (last visit vs this visit), the Updates feed,
   the return-visit rotating Item for the real month, and the month-close stinger.
   Plain script, no build step. Sound files are ElevenLabs (PROVENANCE.json); code only mixes. */
(function(){
  'use strict';
  var LG=window.ledger; if(!LG) return;
  var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MONTHS=[
    {key:'2026-10',m:10,name:"October '26",img:'oct',c:'#d9822b',items:['dragon-house-blocks']},
    {key:'2026-11',m:11,name:"November '26",img:'nov',c:'#a8322b',items:['doing-the-most']},
    {key:'2026-12',m:12,name:"December '26",img:'dec',c:'#2f6b3f',items:['rosemaling']},
    {key:'2027-01',m:1,name:"January '27",img:'jan',c:'#3d7fd6',items:['mission-control']},
    {key:'2027-02',m:2,name:"February '27",img:'feb',c:'#8a4fc4',items:['un-gloom']},
    {key:'2027-03',m:3,name:"March '27",img:'mar',c:'#0b6b5f',items:['skyship']}
  ];
  var NAMES={'dragon-house-blocks':'Dragon House in Blocks','rosemaling':'Rosemaling','un-gloom':'Un-Gloom','doing-the-most':'Doing the Most','mission-control':'Mission Control','skyship':'Follow the Sky Ship'};
  var UP={'dragon-house-blocks':'Raise the 1898 house, course by course.','rosemaling':'Paint 12 strokes, then Bloom.','un-gloom':'Stack joy on the Francksens. Par 11.','doing-the-most':'Six plates. Keep them spinning.','mission-control':'Assign the crew. Launch the show.','skyship':'Follow the ship. Say thank you.'};
  var STUCK={'doing-the-most':'The plates got heavy.','mission-control':'A call only you can make.'};
  /* rotating Item on a return visit, by the real month (sourced: Cider Camp in October, mug renewals in November) */
  var ROT={10:{id:'rot-cider',name:'Cider Camp',up:'Back at the press. Fill 8 jars.',lane:'cider',tally:'jars',n:8,done:'Cider Camp pressed again. 8 jars.'},
           11:{id:'rot-mugs',name:'Mug renewal @ Viking Brew Pub',up:'Pour it to the line. Renew the mug.',mini:'mug',tally:'mugs',n:1,done:'Mug renewed at the Viking Brew Pub.'}};
  var TALLY=[['plates','plates caught'],['protected','plates protected'],['strokes','strokes painted'],['joy','joy laid down'],['blocks','blocks placed'],['perfects','perfect placements'],['launches','shows launched'],['lanterns','lanterns lit'],['jars','jars pressed'],['mugs','mugs renewed']];
  var ONE={plates:'plate caught',protected:'plate protected',strokes:'stroke painted',blocks:'block placed',perfects:'perfect placement',launches:'show launched',lanterns:'lantern lit',jars:'jar pressed',mugs:'mug renewed'};
  function lab(p,v){ return Math.abs(v)===1&&ONE[p[0]]?ONE[p[0]]:p[1]; }
  var opts={}, H=null;
  function $(s,r){ return (r||document).querySelector(s); }
  function esc(t){ return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function month(){ var q=0; try{ q=+new URLSearchParams(location.search).get('month')||0; }catch(e){} return (q>=1&&q<=12)?q:(new Date().getMonth()+1); }
  function rot(){ return LG.returning()?ROT[month()]||null:null; }
  function play(n,v,loop){ try{ return opts.play?opts.play(n,v==null?.8:v,!!loop):null; }catch(e){ return null; } }
  function stopS(h){ try{ if(!h) return; if(h.then) h.then(function(x){ opts.stop&&opts.stop(x); }); else opts.stop&&opts.stop(h); }catch(e){} }
  function toast(t,ms){ try{ opts.toast&&opts.toast(t,ms||3000); }catch(e){} }
  function status(id){ var d=LG.get();
    if(id==='skyship') return d.firsts&&d.firsts.skyship?'Done':((d.items.skyship||{}).status||'Not started');
    var it=d.items[id]||{};
    if(it.status==='Done') return 'Done';
    if(STUCK[id]&&!(d.unstuck&&d.unstuck[id])) return 'Stuck';
    return it.status||'Not started'; }
  function update(id,st){ var d=LG.get(), it=d.items[id]||{};
    if(st==='Done') return id==='skyship'?(it.update||'Flew the Sky Ship. Keep flying.'):(it.update||'Done.');
    if(st==='Stuck') return 'Stuck. '+STUCK[id]+' First, breathe.';
    if(id==='doing-the-most'&&d.guardian) return 'Guardian on watch. Plates land safe.';
    if(st==='Working on it'&&d.unstuck&&d.unstuck[id]) return 'Unstuck TOGETHER with Gordon. Your move.';
    return UP[id]; }
  function href(id){ return (id==='skyship'?'skyship/':'play/'+id+'/')+'?from='+opts.from; }
  function cls(st){ return st==='Done'?'done':st==='Stuck'?'stuck':st==='Not started'?'ns':''; }
  function tok(st){ return '<img class="stok" alt="" aria-hidden="true" src="img/v5/token-'+(st==='Not started'?'notstarted':st==='Working on it'?'working':st.toLowerCase())+'.png" onerror="this.remove()">'; }
  function row(id,name,st,up,link){
    var pc=opts.kind==='pc';
    var mv=st==='Not started'?(pc?' Drag its Status to Working on it, or press Enter, to start it.':' Tap or hold its Status to start it.'):'';
    var a='<a class="row srow" draggable="false" data-sid="'+id+'" href="'+esc(link)+'" aria-label="'+esc(name)+'. Status: '+st+'.'+mv+'">';
    if(pc) a+='<div class="nm">'+esc(name)+'</div><div><span class="av">E</span></div><div class="stc '+cls(st)+'" data-k="b-'+id+'">'+tok(st)+'<span>'+st+'</span></div><div class="up">'+esc(up)+'</div>';
    else a+='<span class="item"><span class="name" style="display:block">'+esc(name)+'</span><span class="upd" style="display:block">'+esc(up)+'</span></span><span class="status '+cls(st)+'" data-k="b-'+id+'">'+tok(st)+'<span>'+st+'</span></span>';
    return a+'</a>'; }
  function order(){ var m=month(), i=0; MONTHS.forEach(function(g,k){ if(g.m===m) i=k; }); return MONTHS.slice(i).concat(MONTHS.slice(0,i)); }
  function ledgerCard(){ var d=LG.get(), t=d.tally||{}, c=LG.compare();
    var parts=TALLY.filter(function(p){ return +t[p[0]]; }).map(function(p){ return '<b>'+(+t[p[0]]).toLocaleString('en-US')+'</b> '+lab(p,+t[p[0]]); });
    var h='<div class="sled" id="sledger"><div class="sledh"><img src="img/v5/d20.png" alt="" aria-hidden="true" onerror="this.remove()"><b>Season ledger</b></div>';
    h+='<p class="sltal">'+(parts.length?parts.join(', '):'Every number starts here. Play an Item to open the ledger.')+'</p>';
    if(c.prev){ var pv=c.prev.tally||{}, dd=(c.now.done||0)-(c.start.done||0); var gains=TALLY.filter(function(p){ return (+t[p[0]]||0)-(+((c.start.tally||{})[p[0]])||0)>0; }).map(function(p){ var g=(+t[p[0]]||0)-(+((c.start.tally||{})[p[0]])||0); return '+'+g.toLocaleString('en-US')+' '+lab(p,g); });
      var pvp=TALLY.filter(function(p){ return +pv[p[0]]; }).slice(0,3).map(function(p){ return (+pv[p[0]]).toLocaleString('en-US')+' '+lab(p,+pv[p[0]]); });
      h+='<div class="slcmp" id="slcmp"><div><span>Last visit, '+esc(fmt(c.prev.date))+'</span><b>'+(c.prev.done||0)+' Done</b>'+(pvp.length?'<em>'+pvp.join(', ')+'</em>':'')+'</div><div><span>This visit</span><b>'+(dd>0?'+'+dd:'0')+' Done</b><em>'+(gains.length?gains.join(', '):'Fresh start. Go make a number.')+'</em></div></div>';
      h+='<p class="slret">Welcome back. Ready for hard is open on every game.</p>'; }
    if(d.guardian) h+='<div class="slg" id="slguard"><img src="img/v5/guardian-512.png" alt="Eric\'s guardian, a stone-and-brass figure with a lantern" width="64" height="82" onerror="this.remove()"><p><b>Guardian on watch.</b> Placed in Dragon House in Blocks. In Doing the Most, a falling plate glows and lands safe.</p></div>';
    var posts=(d.posts||[]).slice(0,4);
    if(posts.length) h+='<div class="slup" id="slupdates"><b>Updates</b><ul>'+posts.map(function(p){ return '<li><span>'+esc(p.text)+'</span><time>'+esc(fmt(p.at))+'</time></li>'; }).join('')+'</ul></div>';
    return h+'</div>'; }
  function fmt(iso){ var m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(iso||''); return m?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2]-1]+' '+(+m[3]):''; }

  var css='.season{margin-top:12px}'+
  '.sled{background:#fffdf8;color:#1b2a30;border:1px solid #e3dccf;border-left:6px solid #c08a00;border-radius:6px;padding:12px 14px;margin:0 0 10px;font-size:16px;line-height:1.4}'+
  '.sledh{display:flex;align-items:center;gap:8px;font-family:var(--serif,Georgia,serif);font-size:20px}.sledh b{font-weight:400}.sledh img{width:34px;height:34px}'+
  '.sltal{margin:6px 0 0;color:#33444b}.sltal b{color:#0b6b5f}'+
  '.slcmp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.slcmp div{background:#f4efe3;border-radius:6px;padding:8px 10px}.slcmp span{display:block;font-size:14px;font-weight:700;color:#5b6870;letter-spacing:.04em;text-transform:uppercase}.slcmp b{display:block;font-family:var(--serif,Georgia,serif);font-weight:400;font-size:22px;color:#0b6b5f}.slcmp em{display:block;font-style:normal;font-size:16px;color:#33444b}'+
  '.slg{display:flex;gap:12px;align-items:center;margin-top:10px;background:#eef6f3;border-radius:6px;padding:8px 10px}.slg img{width:64px;height:auto;flex:none}.slg p{margin:0;font-size:16px}.slret{margin:8px 0 0;font-weight:700;color:#8a5a00}'+
  '.slup{margin-top:10px}.slup>b{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:18px}.slup ul{list-style:none;margin:4px 0 0;padding:0}.slup li{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #ece4d6;padding:6px 0;font-size:16px}.slup time{color:#6b767c;font-size:14px;white-space:nowrap}'+
  '.sgrp{margin-top:10px}'+
  '.mban{position:relative;height:76px;background:#2f5d68 center/cover no-repeat;display:flex;align-items:flex-end;justify-content:space-between;padding:8px 12px;color:#fffdf8}'+
  '.mban::before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,25,31,.72),rgba(13,25,31,.15) 70%)}'+
  '.mban h4,.mban h3{position:relative;font-family:var(--serif,Georgia,serif)!important;font-weight:400!important;font-size:24px!important;color:#fffdf8!important;padding:0!important;background:none!important;text-shadow:0 2px 8px rgba(0,0,0,.6)}'+
  '.mban em{position:relative;font-style:normal;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;background:#e9c46a;color:#13232b;padding:5px 9px;border-radius:99px}'+
  '.stok{width:20px;height:20px;margin-right:5px;flex:none}.stc .stok+span{font-size:16px;line-height:1.15}.stc,.status{gap:0}'+
  '.srow.rotrow{background:#fff7e0}'+
  /* B2: the board is the controller. Drag (PC) or tap/hold (phone) an Item's Status into Working on it */
  '.srow{-webkit-user-drag:none;-webkit-touch-callout:none;user-select:none;-webkit-user-select:none}.srow .stc,.srow .status{cursor:grab;touch-action:manipulation;transition:background .25s,transform .12s}'+
  '.srow.sdrag-src{opacity:.45}.srow .stc.smoved,.srow .status.smoved{background:#fdab3d!important;color:#fff!important;transform:scale(1.04);transform-origin:right center}'+
  '.srow .status.shold{background-image:linear-gradient(90deg,rgba(253,171,61,.95) var(--h,0%),transparent var(--h,0%))!important}'+
  '.sghost{position:fixed;z-index:300;pointer-events:none;min-width:220px;max-width:320px;padding:12px 16px;border-radius:8px;background:#fffdf8;color:#1b2a30;border-left:8px solid #c4c4c4;box-shadow:0 18px 40px rgba(0,0,0,.4);font:700 17px/1.25 var(--sans,system-ui,sans-serif);transform:translate(-30px,-50%) rotate(-2deg)}'+
  '.sghost small{display:block;font-weight:600;font-size:14px;color:#5b6870;margin-top:4px}.sghost.over{border-left-color:#fdab3d}'+
  '.slane{position:fixed;z-index:290;top:12vh;bottom:12vh;left:clamp(680px,37vw,780px);width:min(30vw,420px);display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;border:4px dashed rgba(255,253,248,.9);border-radius:16px;background:rgba(19,35,43,.62);color:#fffdf8;font-family:var(--sans,system-ui,sans-serif);text-align:center;padding:20px;transition:background .15s,border-color .15s,transform .15s}'+
  '.slane.on{display:flex}.slane.over{background:rgba(253,171,61,.9);border-color:#fff;border-style:solid;transform:scale(1.03)}'+
  '.slane img{width:72px;height:72px}.slane b{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:36px;line-height:1.05}.slane span{font-size:18px}'+
  '.sdraghint{margin:8px 0 0;padding:0 14px;font-size:16px;line-height:1.4;color:#33444b}.sdraghint b{color:#8a5a00}'+
  /* overlay */
  '.sbx{position:fixed;inset:0;z-index:200;display:none;background:#0d1a20;color:#fffdf8;font-family:var(--sans,system-ui,sans-serif);overflow:hidden}'+
  '.sbx.on{display:block}.sbx>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.85}'+
  '.sbx .sb-veil{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(13,26,32,.15),rgba(13,26,32,.7))}'+
  '.sbx .sb-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 16px}'+
  '.sbx h2{font-family:var(--serif,Georgia,serif);font-weight:400;font-size:clamp(40px,5vw,84px);line-height:1;margin:0 0 10px;text-shadow:0 3px 16px rgba(0,0,0,.6)}'+
  '.sbx p{font-size:clamp(17px,1.4vw,22px);line-height:1.45;max-width:640px;margin:8px 0;text-shadow:0 2px 10px rgba(0,0,0,.7)}'+
  '.sbx .sb-ring{position:relative;width:min(46vh,320px);height:min(46vh,320px);margin:18px 0;display:grid;place-items:center}'+
  '.sbx .sb-ring i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(233,196,106,.55),rgba(47,93,104,.35) 60%,rgba(47,93,104,0) 72%);border:3px solid rgba(255,253,248,.8);transform:scale(.55);will-change:transform}'+
  '.sbx .sb-ring span{position:relative;font-family:var(--serif,Georgia,serif);font-size:26px;text-shadow:0 2px 10px rgba(0,0,0,.6)}'+
  '.sbx .sbtn{min-height:48px;min-width:48px;padding:12px 24px;border-radius:999px;border:0;font:700 17px var(--sans,system-ui,sans-serif);cursor:pointer;background:#e9c46a;color:#13232b;margin:8px 6px}'+
  '.sbx .sbtn.sb-ghost{background:rgba(13,26,32,.6);color:#fffdf8;border:2px solid rgba(255,253,248,.7)}'+
  '.sbx .sb-skip{position:absolute;right:20px;bottom:20px;opacity:0;pointer-events:none;transition:opacity .4s}.sbx .sb-skip.on{opacity:1;pointer-events:auto}'+
  '.sbx .sb-seats{display:flex;gap:clamp(24px,6vw,96px);align-items:center;margin:16px 0}'+
  '.sbx .sb-seat{display:flex;flex-direction:column;align-items:center;gap:10px}'+
  '.sbx .sb-seat .sb-who{width:clamp(76px,9vw,120px);height:clamp(76px,9vw,120px);border-radius:50%;display:grid;place-items:center;font:400 clamp(34px,4vw,54px) var(--serif,Georgia,serif);background:#2f5d68;border:4px solid #e9c46a;transition:transform .08s,box-shadow .2s}'+
  '.sbx .sb-seat.g .sb-who{background:#7f5347}'+
  '.sbx .sb-seat .sb-who.hit{transform:scale(1.14);box-shadow:0 0 0 8px rgba(233,196,106,.45),0 0 40px #e9c46a}'+
  '.sbx .sb-pips{display:flex;gap:6px}.sbx .sb-pips b{width:18px;height:18px;border-radius:50%;border:2px solid #fffdf8;background:transparent;transition:background .15s}.sbx .sb-pips b.on{background:#00c875;border-color:#00c875}'+
  '.sbx .sb-beat{width:clamp(110px,12vw,170px);height:clamp(110px,12vw,170px);border-radius:50%;border:5px solid #fffdf8;display:grid;place-items:center;font:700 18px var(--sans,system-ui,sans-serif);cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:manipulation;background:rgba(233,196,106,.18)}'+
  '.sbx .sb-beat.pulse{animation:sbpulse .6s ease-out}@keyframes sbpulse{0%{box-shadow:0 0 0 0 rgba(233,196,106,.9);background:rgba(233,196,106,.6)}100%{box-shadow:0 0 0 34px rgba(233,196,106,0);background:rgba(233,196,106,.18)}}'+
  '.sbx .sb-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}'+
  '.sbx .sb-flash.go{animation:sbflash .45s ease-out}@keyframes sbflash{0%{opacity:.85}100%{opacity:0}}'+
  '.sbx .sb-mug{position:relative;width:150px;height:190px;border:6px solid #fffdf8;border-top:0;border-radius:0 0 26px 26px;margin:18px 0;overflow:hidden;background:rgba(255,253,248,.08)}'+
  '.sbx .sb-mug::after{content:"";position:absolute;right:-46px;top:30px;width:40px;height:90px;border:6px solid #fffdf8;border-left:0;border-radius:0 30px 30px 0}'+
  '.sbx .sb-mug i{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(#f3d27a,#c9862a);box-shadow:inset 0 10px 0 #fff7e0}'+
  '.sbx .sb-mug .sb-line{position:absolute;left:-6px;right:-6px;top:18%;border-top:3px dashed #e9c46a}'+
  '@media (max-width:640px){.mban{height:64px}.slcmp{grid-template-columns:1fr}.sbx .sb-skip{right:16px;bottom:16px}}'+
  '@media (prefers-reduced-motion:reduce){.sbx .sb-beat.pulse,.sbx .sb-flash.go{animation:none}}';

  function ensureCss(){ if(document.getElementById('season-css')) return; var s=document.createElement('style'); s.id='season-css'; s.textContent=css; document.head.appendChild(s); }

  var Season={
    MONTHS:MONTHS, STUCK:STUCK,
    status:status, month:month, rot:rot,
    init:function(o){ opts=o||{}; ensureCss();
      /* intercept any link into a Stuck game, from the board rows or the Bonus round cards */
      document.addEventListener('click',function(e){ var a=e.target.closest&&e.target.closest('a[href]'); if(!a) return;
        var m=/(?:^|\/)play\/([a-z-]+)\/(?:\?|$)/.exec(a.getAttribute('href')||''); var sid=a.getAttribute('data-sid')||(m&&m[1]);
        if(!sid) return;
        var r=rot(); if(r&&sid===r.id){ e.preventDefault(); Season.openRot(); return; }
        if(status(sid)==='Stuck'){ e.preventDefault(); Season.unstick(sid); return; }
        if(status(sid)==='Not started'&&sid!=='skyship') LG.status(sid,'Working on it');
      },true);
      Season.controller();
      document.addEventListener('keydown',function(e){ var x=$('.sbx.on'); if(!x) return; e.stopPropagation(); if(x._key) x._key(e); },true);
      document.addEventListener('keyup',function(e){ var x=$('.sbx.on'); if(!x) return; e.stopPropagation(); if(x._keyup) x._keyup(e); },true);
    },
    /* B2, the board as controller. Moving an Item's Status is the move that opens its game.
       PC: press on a Not started (or Stuck) Item and drag it into the Working on it lane.
       Phone: tap or hold the Status pill. Enter and plain clicks still open the Item as before. */
    move:function(id,row){ var st=status(id); if(st==='Stuck'){ Season.unstick(id); return; }
      if(st==='Done'){ location.href=href(id); return; }
      if(id!=='skyship') LG.status(id,'Working on it');
      var pill=row&&(row.querySelector('.stc')||row.querySelector('.status'));
      if(pill){ pill.className=pill.className.replace(/\b(ns|done|stuck)\b/g,'')+' smoved'; pill.innerHTML=tok('Working on it')+'<span>Working on it</span>'; }
      if(row){ var u=row.querySelector('.up,.upd'); if(u) u.textContent='Started. Your move.'; row.setAttribute('aria-label',(NAMES[id]||id)+'. Status: Working on it.'); }
      window.__season.moved={id:id,at:Date.now()}; play('press',.7);
      setTimeout(function(){ location.href=href(id); },RM?120:480); },
    controller:function(){ var pc=opts.kind==='pc', suppress=0, lane=null, ghost=null, drag=null;
      function rowOf(t){ var r=t&&t.closest&&t.closest('a.srow'); return r&&!r.classList.contains('rotrow')?r:null; }
      function movable(r){ var st=status(r.getAttribute('data-sid')); return st==='Not started'||st==='Stuck'; }
      /* a click that ends a drag or a hold must not also open the link */
      window.addEventListener('click',function(e){ if(Date.now()<suppress&&rowOf(e.target)){ e.preventDefault(); e.stopImmediatePropagation(); } },true);
      document.addEventListener('dragstart',function(e){ if(rowOf(e.target)) e.preventDefault(); },true);
      function ensureLane(){ if(lane) return lane; lane=document.createElement('div'); lane.className='slane'; lane.setAttribute('aria-hidden','true');
        lane.innerHTML=tok('Working on it').replace('class="stok"','')+'<b>Working on it</b><span>Drop the Item here to start it</span>'; document.body.appendChild(lane); return lane; }
      function inLane(x,y){ if(!lane) return false; var b=lane.getBoundingClientRect(); return x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom; }
      if(pc){
        document.addEventListener('pointerdown',function(e){ if(e.button!==0||e.pointerType==='touch') return; var r=rowOf(e.target); if(!r||!movable(r)) return;
          drag={row:r,id:r.getAttribute('data-sid'),x:e.clientX,y:e.clientY,live:false}; });
        document.addEventListener('pointermove',function(e){ if(!drag) return;
          if(!drag.live){ if(Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)<8) return; drag.live=true; ensureLane().classList.add('on'); drag.row.classList.add('sdrag-src');
            ghost=document.createElement('div'); ghost.className='sghost'; ghost.innerHTML=esc(NAMES[drag.id]||drag.id)+'<small>'+esc(status(drag.id))+' &rarr; Working on it</small>'; document.body.appendChild(ghost); window.__season.dragging=drag.id; }
          ghost.style.left=e.clientX+'px'; ghost.style.top=e.clientY+'px'; var o=inLane(e.clientX,e.clientY); lane.classList.toggle('over',o); ghost.classList.toggle('over',o); e.preventDefault(); });
        document.addEventListener('pointerup',function(e){ if(!drag) return; var d=drag; drag=null; if(!d.live) return;
          suppress=Date.now()+400; var o=inLane(e.clientX,e.clientY); if(ghost){ ghost.remove(); ghost=null; } lane.classList.remove('on','over'); d.row.classList.remove('sdrag-src'); window.__season.dragging=null;
          if(o) Season.move(d.id,d.row); });
      } else {
        var hold=null;
        function pill(t){ var p=t&&t.closest&&t.closest('.status'); var r=p&&rowOf(p); return r?{p:p,r:r}:null; }
        function clear(){ if(!hold) return; clearInterval(hold.iv); hold.p.style.removeProperty('--h'); hold.p.classList.remove('shold'); hold=null; }
        document.addEventListener('pointerdown',function(e){ var q=pill(e.target); if(!q||!movable(q.r)) return; clear();
          hold={p:q.p,r:q.r,t0:performance.now()}; q.p.classList.add('shold');
          hold.iv=setInterval(function(){ if(!hold) return; var u=Math.min(1,(performance.now()-hold.t0)/450); hold.p.style.setProperty('--h',Math.round(u*100)+'%');
            if(u>=1){ var h=hold; clearInterval(h.iv); hold=null; h.p.classList.remove('shold'); suppress=Date.now()+1500; window.__season.held=h.r.getAttribute('data-sid'); Season.move(h.r.getAttribute('data-sid'),h.r); } },30); });
        document.addEventListener('pointerup',clear); document.addEventListener('pointercancel',clear);
        /* a quick tap on the pill: show the Status move, then open */
        window.addEventListener('click',function(e){ if(Date.now()<suppress) return; var q=pill(e.target); if(!q||!movable(q.r)) return;
          e.preventDefault(); e.stopImmediatePropagation(); Season.move(q.r.getAttribute('data-sid'),q.r); },true);
      } },
    go:function(slug){ if(status(slug)==='Stuck') return Season.unstick(slug); if(status(slug)==='Not started') LG.status(slug,'Working on it'); location.href=href(slug); },
    render:function(R){ ensureCss(); var pc=opts.kind==='pc', r=rot();
      var W=document.createElement('section'); W.className='season'; W.id='bonusgrp'; W.setAttribute('aria-label',"Season '26, month by month");
      var h=ledgerCard()+'<p class="sdraghint">'+(pc?'<b>Your move:</b> drag an Item\'s Status from Not started into <b>Working on it</b> to start its game. Click or Enter works too.':'<b>Your move:</b> tap or hold an Item\'s Status to move it to <b>Working on it</b> and start its game.')+'</p>', cur=month();
      order().forEach(function(g){
        h+='<div class="'+(pc?'grp':'group')+' bonusgrp sgrp" data-month="'+g.key+'" style="--g:'+g.c+'">';
        h+='<div class="mban" style="background-image:url(img/v5/month-'+g.img+(pc?'':'-960')+'.jpg)">'+(pc?'<h4>':'<h3>')+esc(g.name)+(pc?'</h4>':'</h3>')+(g.m===cur?'<em>This month</em>':'')+'</div>';
        if(pc) h+='<div class="colhead"><span>Item</span><span>Owner</span><span>Status</span><span>Latest update</span></div>';
        g.items.forEach(function(id){ var st=status(id); h+=row(id,NAMES[id],st,update(id,st),href(id)); });
        if(r&&g.m===cur){ var d=LG.get(), it=d.items[r.id]||{}, st2=it.status==='Done'?'Done':'Working on it'; h+=row(r.id,r.name,st2,st2==='Done'?(it.update||r.done):r.up,'#'+r.id).replace('class="row srow"','class="row srow rotrow"'); }
        h+='</div>'; });
      W.innerHTML=h; R.appendChild(W);
      Season.closeMonths(); return W; },
    /* plays the month-close stinger once per month when every Item in it is Done */
    closeMonths:function(){ var d=LG.get(), closed=d.closed||{}, any=null;
      MONTHS.forEach(function(g){ if(closed[g.key]) return; if(g.items.every(function(id){ return status(id)==='Done'; })){ closed[g.key]=LG.get().visit?LG.get().visit.date:''; any=g; } });
      if(any){ LG.save({closed:closed}); setTimeout(function(){ play('v5-month-close',.9); toast(any.name+' closed. Every Item Done.',3400); },1400); }
      return any; },
    /* rotating Item */
    openRot:function(){ var r=rot(); if(!r) return; if(r.lane){ window.__seasonRot=r; if(opts.openLane) opts.openLane(r.lane); return; } if(r.mini==='mug') Season.mug(r); },
    laneDone:function(k){ var r=window.__seasonRot; window.__seasonRot=null; if(!r||r.lane!==k) return false;
      LG.first(r.id,'First '+r.name+' rerun'); LG.done(r.id,r.done,{n:r.n}); LG.seen(r.id); LG.add(r.tally,r.n); LG.post(r.id,r.done); return true; },
    overlay:function(bg){ var x=document.getElementById('sbx'); if(!x){ x=document.createElement('div'); x.id='sbx'; x.className='sbx'; x.setAttribute('role','dialog'); x.setAttribute('aria-modal','true'); document.body.appendChild(x); }
      x.innerHTML=(bg?'<img alt="" src="'+bg+'" onerror="this.remove()">':'')+'<div class="sb-veil"></div><div class="sb-in"></div><div class="sb-flash"></div>'; x._key=null; x._keyup=null; x.classList.add('on'); return x; },
    close:function(){ var x=document.getElementById('sbx'); if(x){ x.classList.remove('on'); x._key=null; x._keyup=null; } stopS(H); H=null; if(opts.onClose) opts.onClose(); },
    /* STUCK BEAT: 1) First, breathe (10 s, skip after 3 s)  2) TOGETHER  3) Working on it */
    unstick:function(id){ var pc=opts.kind==='pc'; var x=Season.overlay(pc?'img/v5/breathe.jpg':'img/v5/breathe-tall.jpg'); var box=$('.sb-in',x);
      var rec={date:LG.get().visit?LG.get().visit.date:'',breath:'full',presses:0,onBeat:0,assists:0};
      H=play('v5-breathe',.55,true);
      box.innerHTML='<h2>First, breathe.</h2><p>'+esc(NAMES[id])+' is Stuck. '+esc(STUCK[id])+' Nobody fails here.</p><div class="sb-ring" id="sbring"><i></i><span id="sbword">Breathe in</span></div><p id="sbcount" style="opacity:.85">One slow breath</p>';
      var skip=document.createElement('button'); skip.type='button'; skip.className='sbtn sb-ghost sb-skip'; skip.id='sbskip'; skip.textContent='Skip'; x.appendChild(skip);
      var t0=performance.now(), raf=0, left=false, ring=$('#sbring i',x), word=$('#sbword',x);
      function tick(){ if(left) return; var t=(performance.now()-t0)/1000;
        if(t>=3&&!skip.classList.contains('on')) skip.classList.add('on');
        var s; if(t<4){ s=.55+.45*ease(t/4); word.textContent='Breathe in'; } else { s=1-.45*ease(Math.min(1,(t-4)/6)); word.textContent=t<9.2?'Breathe out':'And again, later'; }
        if(!RM) ring.style.transform='scale('+s.toFixed(3)+')';
        $('#sbcount',x).textContent=Math.max(0,Math.ceil(10-t))+' s';
        if(t>=10) return next(); raf=requestAnimationFrame(tick); }
      function ease(u){ return .5-.5*Math.cos(Math.PI*u); }
      function next(){ if(left) return; left=true; cancelAnimationFrame(raf); skip.remove(); Season.together(id,x,rec); }
      skip.onclick=function(){ if(performance.now()-t0<3000) return; rec.breath='skipped'; next(); };
      x._key=function(e){ if(e.key==='Escape'||e.key==='Enter'){ if(performance.now()-t0>=3000){ rec.breath='skipped'; next(); } } };
      raf=requestAnimationFrame(tick);
      window.__season.phase='breathe'; },
    together:function(id,x,rec){ var pc=opts.kind==='pc'; var box=$('.sb-in',x); var NEED=6, BEAT=600;
      window.__season.phase='together';
      box.innerHTML='<h2>TOGETHER.</h2><p>'+(pc?'Press Space or click the circle on the pulse.':'Tap the circle on the pulse.')+' Gordon\'s seat matches your rhythm.</p>'+
        '<div class="sb-seats"><div class="sb-seat e"><div class="sb-who" id="sbe">E</div><div class="sb-pips" id="pipe"></div><b>Eric</b></div>'+
        '<button type="button" class="sb-beat" id="sbbeat" aria-label="Press together">'+(pc?'Space':'Tap')+'</button>'+
        '<div class="sb-seat g"><div class="sb-who" id="sbg">G</div><div class="sb-pips" id="pipg"></div><b>Gordon</b></div></div><p id="sbmsg" style="min-height:1.5em"></p>';
      var pe=$('#pipe',x), pg=$('#pipg',x); for(var i=0;i<NEED;i++){ pe.appendChild(document.createElement('b')); pg.appendChild(document.createElement('b')); }
      var ne=0, ng=0, t0=performance.now(), last=t0, lastE=0, ivl=BEAT, raf=0, ended=false, beatEl=$('#sbbeat',x), nb=-1;
      function pip(el,n){ var b=el.children[n-1]; if(b) b.classList.add('on'); }
      function hit(el){ el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); setTimeout(function(){ el.classList.remove('hit'); },140); }
      function gordon(delay){ setTimeout(function(){ if(ended||ng>=NEED) return; ng++; pip(pg,ng); hit($('#sbg',x)); play('press',.5); check(); },delay); }
      function press(){ if(ended||ne>=NEED) return; var t=performance.now(); var ph=((t-t0)%BEAT); var off=Math.min(ph,BEAT-ph); ne++; rec.presses++; if(off<=110) rec.onBeat++;
        if(lastE) ivl=Math.max(250,Math.min(1200,t-lastE)); lastE=t; last=t; pip(pe,ne); hit($('#sbe',x)); play('press',.75);
        $('#sbmsg',x).textContent=off<=110?'On the beat.':'Gordon matches you.';
        gordon(Math.round(Math.min(220,ivl*.25))); check(); }
      function check(){ if(ended||ne<NEED||ng<NEED) return; ended=true; cancelAnimationFrame(raf);
        var f=$('.sb-flash',x); f.classList.remove('go'); void f.offsetWidth; if(!RM) f.classList.add('go'); play('done',.9);
        setTimeout(function(){ Season.unstuck(id,x,rec); },RM?200:650); }
      function tick(){ if(ended) return; var t=performance.now(); var b=Math.floor((t-t0)/BEAT); if(b!==nb){ nb=b; beatEl.classList.remove('pulse'); void beatEl.offsetWidth; if(!RM) beatEl.classList.add('pulse'); }
        /* never a fail: after a quiet spell, Gordon's seat nudges, then carries one press for Eric */
        var idle=t-last; if(idle>3000&&idle<3100) $('#sbmsg',x).textContent='Your turn. Gordon\'s seat is right beside you.';
        if(idle>6000&&ne<NEED){ last=t; rec.assists++; ne++; pip(pe,ne); hit($('#sbe',x)); $('#sbmsg',x).textContent='Gordon carried that one. TOGETHER.'; gordon(160); check(); }
        raf=requestAnimationFrame(tick); }
      beatEl.addEventListener('pointerdown',function(e){ e.preventDefault(); press(); });
      x._key=function(e){ if(e.code==='Space'||e.key===' '||e.key==='Enter'){ e.preventDefault(); if(!e.repeat) press(); } };
      raf=requestAnimationFrame(tick); },
    unstuck:function(id,x,rec){ stopS(H); H=null; window.__season.phase='unstuck';
      var d=LG.get(); var u=d.unstuck||{}; u[id]=rec; LG.save({unstuck:u}); LG.status(id,'Working on it');
      LG.post(id,NAMES[id]+': Stuck to Working on it, TOGETHER with Gordon.'); LG.first('unstuck','First Stuck, unstuck');
      var box=$('.sb-in',x);
      box.innerHTML='<h2>Working on it.</h2><p>'+esc(NAMES[id])+' moved again. You breathed'+(rec.breath==='skipped'?' (short version)':'')+', then moved it TOGETHER with Gordon'+(rec.onBeat>=3?': '+rec.onBeat+' of '+rec.presses+' on the beat.':', and he kept time with you.')+'</p>'+
        '<div><a class="sbtn" id="sbopen" href="'+esc(href(id))+'">Open '+esc(NAMES[id])+'</a><button type="button" class="sbtn sb-ghost" id="sbclose">Back to the board</button></div>';
      var o=$('#sbopen',x); o.style.display='inline-block'; o.style.textDecoration='none'; o.onclick=function(){ window.__season.phase='leaving'; };
      $('#sbclose',x).onclick=function(){ Season.close(); if(opts.rerender) opts.rerender(); };
      x._key=function(e){ if(e.key==='Enter'){ e.preventDefault(); o.click(); } if(e.key==='Escape'){ $('#sbclose',x).click(); } };
      setTimeout(function(){ try{ o.focus({preventScroll:true}); }catch(e){} },50); },
    /* November rotating Item: pour it to the line (hold Space, the mouse, or a finger) */
    mug:function(r){ var pc=opts.kind==='pc'; var x=Season.overlay(pc?'img/v5/month-nov.jpg':'img/v5/month-nov-960.jpg'); var box=$('.sb-in',x); window.__season.phase='mug';
      box.innerHTML='<h2>'+esc(r.name)+'</h2><p>'+(pc?'Hold Space or the mouse to pour. Let go at the line.':'Hold to pour. Let go at the line.')+'</p><div class="sb-mug" id="sbmug"><div class="sb-line"></div><i id="sbfill"></i></div><button type="button" class="sb-beat" id="sbpour">'+(pc?'Hold':'Hold')+'</button><p id="sbmsg" style="min-height:1.5em"></p>';
      var fill=0, holding=false, raf=0, last=performance.now(), done=false, fe=$('#sbfill',x);
      function tick(){ var t=performance.now(), dt=Math.min(50,t-last); last=t; if(holding&&!done) fill=Math.min(1,fill+dt/1800); fe.style.height=(fill*100)+'%'; if(fill>=1&&holding) end(); if(!done) raf=requestAnimationFrame(tick); }
      function end(){ if(done) return; holding=false; if(fill<.35){ $('#sbmsg',x).textContent='A little more. Keep pouring.'; return; } done=true; cancelAnimationFrame(raf);
        var off=Math.abs(fill-.82); var msg=off<.05?'Right to the line. Renewed.':off<.12?'Close enough. Renewed.':'Renewed. Cheers.';
        LG.first(r.id,'First '+r.name+' rerun'); LG.done(r.id,r.done,{n:1,fill:Math.round(fill*100)}); LG.seen(r.id); LG.add(r.tally,r.n); LG.post(r.id,r.done); play('done',.9);
        box.innerHTML='<h2>Renewed.</h2><p>'+esc(msg)+'</p><button type="button" class="sbtn" id="sbclose">Back to the board</button>';
        $('#sbclose',x).onclick=function(){ Season.close(); if(opts.rerender) opts.rerender(); }; window.__season.phase='mug-done'; }
      var pour=$('#sbpour',x); pour.addEventListener('pointerdown',function(e){ e.preventDefault(); holding=true; }); addEventListener('pointerup',function(){ if(holding) end(); });
      x._key=function(e){ if(e.code==='Space'){ e.preventDefault(); holding=true; } }; x._keyup=function(e){ if(e.code==='Space'&&holding) end(); };
      raf=requestAnimationFrame(tick); }
  };
  window.__season={phase:'idle',status:status,month:month,rot:function(){ return rot(); }};
  window.Season=Season;
})();
