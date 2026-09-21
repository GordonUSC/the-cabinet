(()=>{'use strict';
const M=window.BlockingModel,S=window.BlockingScene,$=id=>document.getElementById(id);
let mode='blocking',take='approach',gesture='palm',frame='wide',t=0,running=false,raf=0,anchor=0,anchorT=0,frozen=null,lastAnnouncement='',rate=1,keyPreview=false;
$('stage-mount').innerHTML=S.svg('stage');
$('gesture-context-mount').innerHTML=S.svg('context');
const stage=$('stage-mount').querySelector('svg'),context=$('gesture-context-mount').querySelector('svg');
const titles={palm:'Open hand',fold:'Folded arms',repeat:'Repeated cuff touch'};
const facts={palm:'The hand lifts away from the body; five fingers spread.',fold:'Both forearms cross in front of the chest.',repeat:'The fingertip reaches the gold cuff, touches, then visibly withdraws.'};
const names={blocking:'Make the blocking visible.',gesture:'See the gesture clearly.',framing:'Choose whose response you see.'};
function gestureState(name,time){const s=M.sample('hold',time);s.B.gesture=M.gesture(name,time);const g=s.B.gesture;const action=name==='repeat'?`B touches the gold cuff: ${g.count} of 3.`:g.amount===0?'B’s arms rest at the sides.':g.amount<1?(name==='fold'?'B lifts both forearms toward the chest.':'B lifts one hand away from the body.'):facts[name];s.change=`${action} Both feet stay on their marks.`;return s;}
function state(){return mode==='framing'?frozen:mode==='gesture'?gestureState(gesture,t):M.sample(take,t)}
function pressed(attr,value){document.querySelectorAll(`button[data-${attr}]`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attr]===String(value))))}
function stop(){running=false;cancelAnimationFrame(raf);$('play').textContent=mode==='gesture'&&keyPreview?'▶ Play gesture from start':t>=6?'↻ Replay the take':t>0?'▶ Resume the take':'▶ Play the take';}
function announce(s){const msg=mode==='framing'?`Same performance at ${s.t.toFixed(1)} seconds. ${frame==='wide'?'Both bodies and their distance are visible.':frame==='speaker'?'A fills the frame; B and the full distance are outside it.':'B fills the frame; A and the full distance are outside it.'}`:s.change;if(msg!==lastAnnouncement){$('live-evidence').textContent=msg;lastAnnouncement=msg}}
function paint(){
 const s=state(),view=mode==='gesture'?'gesture':frame;
 S.paint(stage,s,{prefix:'stage',frame:view,trails:mode==='gesture'?false:$('trails').checked});S.plan($('floor-plan'),s,frame);
 if(mode==='gesture')S.paint(context,s,{prefix:'context',frame:'wide',trails:true});
 $('timeline').value=t;$('time').textContent=`${t.toFixed(1)} / 6.0s`;
 document.querySelector('.subtitle').classList.toggle('is-speaking',s.line);
 $('line-state').textContent=s.line?'A delivers the line now.':s.t>4.5?'The line is finished.':'Same line in every take · cue at 2.4s';
 $('camera-label').textContent=mode==='gesture'?'B / FIXED DETAIL':frame==='wide'?'LOCKED WIDE':frame==='speaker'?'SPEAKER / CROP':'LISTENER / REACTION';
 $('take-label').textContent=mode==='gesture'?titles[gesture].toUpperCase():mode==='framing'?`FROZEN AT ${s.t.toFixed(1)}s`:`TAKE 0${['hold','approach','leave'].indexOf(take)+1} / ${M.takes[take].short.toUpperCase()}`;
 $('facing-label').textContent=s.B.face>0?'A → B →':'A → ← B';pressed('time',t);announce(s);
 $('observation').textContent=mode==='framing'?(frame==='wide'?'Both full bodies, the floor marks and the doorway remain visible.':frame==='speaker'?'The crop emphasizes A’s face and removes B from view.':'The crop emphasizes B’s response and removes A from view.'):s.change;
 $('interpretation').textContent=mode==='blocking'?M.takes[take].question:mode==='gesture'?'The action is visible. Its meaning still depends on context. What else would you need to know?':'What can this crop tell you? What would you need the wide view to check?';
 if(mode==='gesture'){
  const g=s.B.gesture;$('gesture-count').textContent=gesture==='repeat'?`Cuff touches: ${g.count} of 3. Watch the fingertip meet the gold cuff, then pull away.`:'Choose a gesture to see its key pose. Play from the start to watch how it forms.';
  $('gesture-phase').textContent=g.phase;$('touch-beats').hidden=gesture!=='repeat';document.querySelectorAll('[data-touch-beat]').forEach(b=>b.classList.toggle('complete',Number(b.dataset.touchBeat)<=g.count));$('gesture-phase-bar').classList.toggle('is-contact',g.contact);
 }
}
function tick(now){if(!running)return;t=Math.min(6,anchorT+(now-anchor)/1000*rate);paint();if(t>=6){stop();return}raf=requestAnimationFrame(tick)}
function seek(value,preview=false){stop();t=Math.max(0,Math.min(6,Number(value)));keyPreview=preview;paint();stop()}
function updateBeats(){const buttons=document.querySelectorAll('[data-time]');buttons[0].textContent=mode==='gesture'?'Rest pose':'Start marks';buttons[1].textContent=mode==='gesture'?'Gesture pose':'During the line';buttons[1].dataset.time=mode==='gesture'?M.gesturePeaks[gesture]:3;buttons[2].textContent=mode==='gesture'?'Finish':'End marks';document.querySelector('.beats label').hidden=mode==='gesture';}
function chooseGesture(name){gesture=name;pressed('gesture',gesture);updateBeats();seek(M.gesturePeaks[gesture],true)}
$('play').addEventListener('click',()=>{if(running){stop();return}if(t>=6||keyPreview)t=0;keyPreview=false;running=true;anchorT=t;anchor=performance.now();$('play').textContent='Ⅱ Pause the take';paint();raf=requestAnimationFrame(tick)});
$('restart').addEventListener('click',()=>seek(0));$('timeline').addEventListener('input',e=>seek(e.target.value));$('playback-speed').addEventListener('change',e=>{anchorT=t;anchor=performance.now();rate=Number(e.target.value)});
 document.querySelectorAll('[data-time]').forEach(b=>b.addEventListener('click',()=>seek(b.dataset.time,mode==='gesture'&&Number(b.dataset.time)===M.gesturePeaks[gesture])));$('trails').addEventListener('change',paint);
 document.querySelectorAll('[data-take]').forEach(b=>b.addEventListener('click',()=>{take=b.dataset.take;pressed('take',take);seek(0)}));document.querySelectorAll('#gesture-controls [data-gesture]').forEach(b=>b.addEventListener('click',()=>chooseGesture(b.dataset.gesture)));document.querySelectorAll('[data-frame]').forEach(b=>b.addEventListener('click',()=>{frame=b.dataset.frame;pressed('frame',frame);paint()}));
$('gesture-cards').innerHTML=Object.keys(titles).map((key,i)=>`<button class="gesture-card" data-gesture="${key}" aria-pressed="${key===gesture}"><div>${S.svg('gesture-card-'+key)}</div><span><b>0${i+1} / ${titles[key]}</b><small>${key==='palm'?'Fingers spread; hand outside the torso.':key==='fold'?'Two forearms cross the chest.':'Fingertip meets the gold cuff.'}</small></span></button>`).join('');
Object.keys(titles).forEach((key,i)=>S.paint($('gesture-cards').children[i].querySelector('svg'),gestureState(key,M.gesturePeaks[key]),{prefix:'gesture-card-'+key,frame:'gesture',trails:false}));document.querySelectorAll('#gesture-cards [data-gesture]').forEach(b=>b.addEventListener('click',()=>chooseGesture(b.dataset.gesture)));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{
 const next=b.dataset.mode;if(next===mode)return;stop();if(next==='framing'){frozen=gestureState('palm',3);frozen.change='B holds an open hand in response to A’s line. Both remain on their marks.';t=3;}
 mode=next;frame='wide';keyPreview=mode==='gesture';$('performance-lab').classList.toggle('mode-gesture',mode==='gesture');pressed('frame','wide');pressed('mode',mode);$('lab-title').textContent=names[mode];
 $('blocking-controls').hidden=mode!=='blocking';$('gesture-controls').hidden=mode!=='gesture';$('framing-controls').hidden=mode!=='framing';$('transport').hidden=mode==='framing';document.querySelector('.beats').hidden=mode==='framing';$('frozen-note').hidden=mode!=='framing';$('gesture-context').hidden=mode!=='gesture';$('gesture-phase-bar').hidden=mode!=='gesture';$('gesture-comparison').hidden=mode!=='gesture';
 $('blocking-compare-head').hidden=mode==='gesture';$('comparison').hidden=true;$('compare').setAttribute('aria-expanded','false');$('compare').textContent='Compare end positions ↓';
 $('experiment-rule').innerHTML=mode==='blocking'?'<strong>Camera locked.</strong> Same line, set, lighting and timing. Only the performers’ paths and facing change.':mode==='gesture'?'<strong>Feet fixed. Two fixed views.</strong> Inspect B’s hands and arms in detail; check the full stage alongside. The framing stays the same for every gesture.':'<strong>Performance frozen.</strong> Same exact instant. Change only the crop; compare what becomes visible and what disappears.';
 if(mode!=='framing')t=mode==='gesture'?M.gesturePeaks[gesture]:0;updateBeats();paint();stop();
}));
$('compare').addEventListener('click',()=>{const open=$('comparison').hidden;$('comparison').hidden=!open;$('compare').setAttribute('aria-expanded',String(open));$('compare').textContent=open?'Hide comparison ↑':'Compare end positions ↓';if(open&&!$('comparison').children.length){$('comparison').innerHTML=Object.entries(M.takes).map(([key,v],i)=>`<article class="comparison-take"><div>${S.svg('compare-'+key)}</div><h4>0${i+1} / ${v.name}</h4><p>${v.who}</p></article>`).join('');Object.keys(M.takes).forEach((key,i)=>S.paint($('comparison').children[i].querySelector('svg'),M.sample(key,6),{prefix:'compare-'+key,frame:'wide',trails:true}));}});
const ids=['s9-observation','s9-reading','s9-test'],storage='ctin290-session9-observation-v2';try{const saved=JSON.parse(localStorage.getItem(storage)||'{}');ids.forEach(id=>$(id).value=saved[id]||'')}catch{}ids.forEach(id=>$(id).addEventListener('input',()=>{try{localStorage.setItem(storage,JSON.stringify(Object.fromEntries(ids.map(k=>[k,$(k).value]))))}catch{}}));
function notes(){return ids.map((id,i)=>`${['I observed','Possible readings','Evidence I would check'][i]}: ${$(id).value.trim()||'…'}`).join('\n\n')}
$('s9-reflect').addEventListener('click',()=>{$('s9-reflection').textContent=notes()});$('download-notes').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['CTIN 290 · Performance observation\n\n'+notes()],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download='CTIN-290-performance-observation.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});window.addEventListener('pagehide',stop);pressed('take',take);paint();const requestedMode=new URLSearchParams(location.search).get('mode');if(['gesture','framing'].includes(requestedMode))document.querySelector(`button[data-mode="${requestedMode}"]`).click();
})();
