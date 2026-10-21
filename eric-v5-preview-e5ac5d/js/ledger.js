/* Season ledger: one shared save for the board and every bonus game.
   Key "eric-v5" in localStorage (same origin). Migrates the board's old "eric-v3" save once.
   Plain script, no build step. Every storage call is wrapped; with storage blocked it keeps
   working in memory for the visit. */
(function(){
  'use strict';
  var KEY='eric-v5', OLD='eric-v3';
  var BONUS=[
    {id:'dragon-house-blocks',name:'Dragon House in Blocks',tally:'blocks'},
    {id:'rosemaling',name:'Rosemaling',tally:'strokes'},
    {id:'un-gloom',name:'Un-Gloom',tally:'joy'},
    {id:'doing-the-most',name:'Doing the Most',tally:'plates'},
    {id:'mission-control',name:'Mission Control',tally:'launches'}
  ];
  var mem=null;
  /* path from this page to the site root, read off this script's own src (".../js/ledger.js") */
  var BASE=(function(){ try{ var c=document.currentScript; var a=c&&c.getAttribute('src')||''; return a.replace(/js\/ledger\.js.*$/,''); }catch(e){ return ''; } })();
  function cnt(d){ var n=0; for(var k in d.items){ if(d.items[k]&&d.items[k].status==='Done') n++; } for(var j in d.done){ if(d.done[j]) n++; } return n; }
  /* one session per tab: the first page load in a tab starts a visit; the previous visit's end state is kept */
  function session(d){ var sid=null; try{ sid=sessionStorage.getItem('eric-sid'); }catch(e){ sid=window.__ericSid||null; }
    if(sid&&d.visit&&d.visit.id===sid) return d;
    sid=sid||(Date.now().toString(36)+Math.random().toString(36).slice(2,6)); try{ sessionStorage.setItem('eric-sid',sid); }catch(e){ window.__ericSid=sid; }
    if(d.visit&&d.visit.id){ d.prevVisit={date:d.visit.date,tally:copy(d.tally),done:cnt(d)}; }
    d.visit={id:sid,date:today(),tally:copy(d.tally),done:cnt(d)}; d.visits=(+d.visits||0)+1; return d; }
  function today(){ var d=new Date(); return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function blank(){ return {v:5,done:{},shiny:false,items:{},tally:{},firsts:{},guardian:false,dream:null,visits:0,hard:{},posts:[],unstuck:{},visit:null,prevVisit:null}; }
  function fill(d){ var b=blank(); for(var k in b){ if(d[k]===undefined||d[k]===null&&k!=='dream') d[k]=b[k]; } return d; }
  function raw(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function write(d){ mem=d; try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} return d; }
  function load(){
    if(mem) return mem;
    var d=null; try{ d=JSON.parse(raw(KEY)||'null'); }catch(e){ d=null; }
    if(!d||typeof d!=='object'){
      d=blank();
      try{ var o=JSON.parse(raw(OLD)||'null');
        if(o&&typeof o==='object'){ d.done=o.done||{}; d.shiny=!!o.shiny; if(o.lastbit) d.lastbit=o.lastbit; if(o.mode) d.mode=o.mode; d.migrated=today(); }
      }catch(e){}
      write(d);
    }
    mem=session(fill(d)); write(mem); return mem;
  }
  function copy(o){ try{ return JSON.parse(JSON.stringify(o)); }catch(e){ return o; } }
  var api={
    BONUS:BONUS,
    get:function(){ return copy(load()); },
    /* merge top-level fields (the board's done map, shiny, dream) */
    save:function(fields){ var d=load(); for(var k in fields) d[k]=fields[k]; write(d); return copy(d); },
    add:function(tally,n){ var d=load(); n=+n||0; d.tally[tally]=(+d.tally[tally]||0)+n; write(d); return d.tally[tally]; },
    /* stamps a First with today's date, once; returns true when it is new */
    first:function(id,label){ var d=load(); if(d.firsts[id]) return false; d.firsts[id]={label:label||id,date:today()}; write(d); firstToast(label||id); return true; },
    status:function(itemId,s){ var d=load(); var it=d.items[itemId]||(d.items[itemId]={}); it.status=s; write(d); return copy(it); },
    /* marks an Item Done with one Latest update; extra = small facts for the finale (numbers only) */
    done:function(itemId,update,extra){ var d=load(); var it=d.items[itemId]||(d.items[itemId]={});
      it.status='Done'; it.update=String(update||'Done.'); it.at=today(); it.plays=(+it.plays||0)+1; it.fresh=true;
      if(extra) it.last=extra; write(d);
      var b=BONUS.filter(function(x){return x.id===itemId;})[0]; api.first(itemId,'First '+(b?b.name:itemId));
      return copy(it); },
    seen:function(itemId){ var d=load(); if(d.items[itemId]){ d.items[itemId].fresh=false; write(d); } },
    item:function(itemId){ var d=load(); return copy(d.items[itemId]||{status:'Not started'}); },
    /* which edition to return to: ?from=pc|phone, then the referrer, then the screen width */
    edition:function(){
      var q=''; try{ q=new URLSearchParams(location.search).get('from')||''; }catch(e){}
      if(q==='pc'||q==='phone'){ try{ sessionStorage.setItem('eric-from',q); }catch(e){} return q; }
      try{ var s=sessionStorage.getItem('eric-from'); if(s==='pc'||s==='phone') return s; }catch(e){}
      var r=document.referrer||'';
      if(/\/pc\.html/.test(r)) return 'pc';
      if(r&&!/\/(play|skyship)\//.test(r)&&/\/(index\.html)?([?#].*)?$/.test(r)) return 'phone';
      return (window.innerWidth||0)>=1024?'pc':'phone';
    },
    /* base = path from the page to the site root, like "../../" */
    /* return visit: a prior session exists in this save */
    returning:function(){ var d=load(); return !!d.prevVisit; },
    /* hard mode is only offered on a return visit, and only when Eric turns it on */
    hard:function(slug){ var d=load(); return !!(d.prevVisit&&d.hard&&d.hard[slug]); },
    setHard:function(slug,v){ var d=load(); d.hard[slug]=!!v; write(d); return !!v; },
    /* a board Update (the Updates feed), newest first, capped */
    post:function(item,text){ var d=load(); d.posts=(d.posts||[]).filter(function(p){return !(p.item===item&&p.text===text);}); d.posts.unshift({item:item,text:String(text),at:today()}); d.posts=d.posts.slice(0,12); write(d); },
    setGuardian:function(v){ var d=load(); d.guardian=!!v; write(d); return d.guardian; },
    guardian:function(){ return !!load().guardian; },
    /* Follow-through: the board d20's modifier. +1 for every two Items Done this season, up to +5 */
    followThrough:function(){ return Math.min(5,Math.floor(cnt(load())/2)); },
    /* last visit vs this visit, for the ledger panel */
    compare:function(){ var d=load(); return {prev:copy(d.prevVisit),start:copy(d.visit),now:{tally:copy(d.tally),done:cnt(d)}}; },
    base:BASE,
    /* a "Ready for hard" toggle (44px), shown only on a return visit. Returns the button or null. */
    hardToggle:function(slug,host,onchange,label){ if(!host||!api.returning()) return null;
      var b=document.createElement('button'); b.type='button'; b.className='ready-hard'; b.setAttribute('aria-pressed',api.hard(slug)?'true':'false');
      function paint(){ var on=api.hard(slug); b.setAttribute('aria-pressed',on?'true':'false'); b.textContent=(on?'Hard mode on: ':'Ready for hard? ')+(label||''); }
      b.style.cssText='min-height:44px;min-width:44px;padding:10px 18px;border-radius:999px;border:2px solid #e9c46a;background:rgba(19,35,43,.85);color:#fffdf8;font:700 16px/1.2 "Instrument Sans",system-ui,sans-serif;cursor:pointer;margin:8px 0';
      b.addEventListener('click',function(e){ e.stopPropagation(); api.setHard(slug,!api.hard(slug)); paint(); b.style.background=api.hard(slug)?'#c08a00':'rgba(19,35,43,.85)'; if(onchange) onchange(api.hard(slug)); });
      paint(); if(api.hard(slug)) b.style.background='#c08a00'; host.appendChild(b); return b; },
    boardHref:function(base){ return (base||'')+(api.edition()==='pc'?'pc.html':'index.html')+'#board'; },
    /* one Sound on/off flag for the whole site (d.mute), honored by the board, both editions and every game */
    sound:function(){ return !load().mute; },
    setSound:function(on){ var d=load(); d.mute=!on; write(d); emitSound(); return !!on; },
    /* apply(on) runs now and again whenever the flag changes (this page, another tab, or a back-forward return) */
    bindSound:function(apply){ if(typeof apply!=='function') return; sinks.push(apply); try{ apply(api.sound()); }catch(e){} }
  };
  var sinks=[];
  function emitSound(){ var on=api.sound(); for(var i=0;i<sinks.length;i++){ try{ sinks[i](on); }catch(e){} } }
  /* another tab changed the save: adopt only its Sound flag here, never re-run the session or write back (two open tabs must not ping-pong) */
  try{ window.addEventListener('storage',function(e){ if(e.key!==KEY||!mem) return; var n=null; try{ n=JSON.parse(e.newValue||'null'); }catch(x){ n=null; }
    if(n&&!!n.mute!==!!mem.mute){ mem.mute=!!n.mute; emitSound(); } }); }catch(e){}
  try{ window.addEventListener('pageshow',function(e){ if(e.persisted){ mem=null; emitSound(); } }); }catch(e){}
  /* "First!" toast and chime (ElevenLabs, snd/v5-first.mp3), shared by every page */
  function firstToast(label){ try{
    var t=document.createElement('div'); t.className='ledger-first'; t.setAttribute('role','status');
    t.style.cssText='position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);z-index:9999;pointer-events:none;background:#fffdf8;color:#1b2a30;border:2px solid #e9c46a;border-left:10px solid #00c875;border-radius:10px;padding:10px 16px;font:600 16px/1.3 "Instrument Sans",system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35);opacity:0;transition:opacity .25s,transform .25s;max-width:calc(100vw - 32px)';
    var b=document.createElement('b'); b.textContent='First! '; b.style.cssText='font-family:"Young Serif",Georgia,serif;font-weight:400;color:#0b6b5f'; t.appendChild(b); t.appendChild(document.createTextNode(label+', '+today().slice(5).replace('-','/')));
    (document.body||document.documentElement).appendChild(t); requestAnimationFrame(function(){ t.style.opacity='1'; t.style.transform='translate(-50%,0)'; });
    setTimeout(function(){ t.style.opacity='0'; setTimeout(function(){ t.remove(); },400); },2600);
    var d=load(); if(!d.mute){ var a=new Audio(BASE+'snd/v5-first.mp3'); a.volume=.55; var pr=a.play(); if(pr&&pr.catch) pr.catch(function(){}); }
  }catch(e){} }
  window.ledger=api;
  /* rewrite every link marked data-board, once the page is parsed */
  function wire(){ var as=document.querySelectorAll('a[data-board]'); for(var i=0;i<as.length;i++){ as[i].setAttribute('href',api.boardHref(as[i].getAttribute('data-board'))); } }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire); else wire();
})();
