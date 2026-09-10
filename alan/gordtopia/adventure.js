import {Adventure,distance,NAMES,COLORS,STAGES} from './adventure-core.js';
import {Expedition,ENCOUNTERS,REGIONS} from './expedition-core.js';
import {launchEngine} from './phaser-view.js';
const $=id=>document.getElementById(id);
let engine=null,game=null,playing=false,paused=false,clock=0,soft=matchMedia('(prefers-reduced-motion:reduce)').matches,sound=false,audio=null,toastUntil=0,talkUntil=0,endingAt=0,ambientTimer=0;
const keys=new Set(),stick={x:0,y:0,id:null},frames=[];
const joyLines=[['Gordon','There you are. Ready to make a little more world?'],['Eric','Let’s make the crossing wide enough for everyone.'],['Gordon','You find the possibility. I’ll bring the light.'],['Eric','That’s the good part. We don’t have to do it alone.']];
let objectiveKey="";let savedRoom=0;try{savedRoom=Math.max(0,Math.min(19,Number(localStorage.getItem('gordtopia-expedition-room'))||0));}catch{}
const focusGame=()=>engine?.canvas.focus();
const clearInput=()=>{keys.clear();stick.x=stick.y=0;stick.id=null;$('touch-stick').firstElementChild.style.transform='';};
function audioOn(){audio=engine?.sound.context;audio?.resume();return audio;}
function spriteFrames(im){const cw=im.width/4,ch=im.height/2;for(let row=0;row<2;row++)for(let col=0;col<4;col++){const c=document.createElement('canvas');c.width=cw;c.height=ch;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,col*cw,row*ch,cw,ch,0,0,cw,ch);const pixels=x.getImageData(0,0,cw,ch),p=pixels.data,seen=new Uint8Array(cw*ch),q=new Int32Array(cw*ch);let n=0,r=0;const add=i=>{if(i<0||i>=cw*ch||seen[i])return;seen[i]=1;const j=i*4,a=p[j],b=p[j+1],d=p[j+2];if(Math.min(a,b,d)>175&&Math.max(a,b,d)-Math.min(a,b,d)<28){q[n++]=i;p[j+3]=0;}};for(let i=0;i<cw;i++){add(i);add((ch-1)*cw+i);}for(let i=0;i<ch;i++){add(i*cw);add(i*cw+cw-1);}while(r<n){const i=q[r++];if(i%cw)add(i-1);if(i%cw<cw-1)add(i+1);add(i-cw);add(i+cw);}x.putImageData(pixels,0,0);frames.push(c);}return frames;}
function note(f,d=.3,delay=0,gain=.035,type='sine'){if(!sound||!audio||audio.state!=='running')return;const t=audio.currentTime+delay,o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(gain,t+.025);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v).connect(audio.destination);o.start(t);o.stop(t+d+.02);}
function melody(kind){if(kind==='power'){note(440,.18,0,.023);note(660,.21,.045,.014);}if(kind==='sketch'){note(330,.28);note(495,.28,.1);}if(kind==='restore'||kind==='chapter'||kind==='finish'){[261.63,329.63,392,523.25].forEach((f,i)=>note(f,kind==='finish'?1:.65,i*.09,.035));}if(kind==='dash'){note(196,.15,0,.025,'triangle');}if(kind==='cheer'){[392,523.25,659.25].forEach((f,i)=>note(f,.5,i*.1,.025));}}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');toastUntil=clock+3.7;}
function talk(name,line,duration=5){$('speaker').textContent=name;$('line').textContent=line;$('dialogue').hidden=false;talkUntil=clock+duration;}
function objective(){if(!game)return;if(game.expedition){const key=[game.index,game.goal,game.hint].join('|');if(key===objectiveKey)return;objectiveKey=key;$('chapter').textContent=`${REGIONS[game.region]} · ${game.index+1}/20`;$('goal').textContent=game.goal;$('hint').textContent=game.hint;$('progress').replaceChildren(...Array.from({length:20},(_,i)=>{const p=document.createElement('span');p.className=i<game.index?'done':i===game.index?'current':'';p.title=ENCOUNTERS[i].title;return p;}));return;}const s=STAGES[game.stage];$('chapter').textContent=s[0];$('goal').textContent=s[1];$('hint').textContent=s[2]+(game.mode==='solo'&&game.stage===1?' Your companion helps automatically.':'');$('progress').replaceChildren(...Array.from({length:8},(_,i)=>{const p=document.createElement('span');p.className=i<(game.stage>0?1:0)+game.bridge.filter(n=>n.done).length+game.knots.filter(n=>n.done).length+(game.finished?1:0)?'done':'';return p;}));}
function updateControls(){if(!game)return;const e=game.active===1;$('playing-as').textContent=NAMES[game.active];$('power-label').textContent=e?'SKETCH':'KINDLE';$('power').classList.toggle('eric',e);$('swap').hidden=game.mode==='coop';$('keyboard-help').textContent=game.mode==='solo'?'WASD move · SPACE power · SHIFT dash · Q swap · H high-five':'Gordon: WASD · SPACE power · SHIFT dash     Eric: ARROWS · ENTER power · / dash';$('controls-copy').innerHTML=game.mode==='solo'?'<b>WASD / arrows</b> move · <b>Space</b> power<br><b>Shift</b> dash · <b>Q</b> swap friend · <b>H</b> high-five<br>On touch: left thumb moves, right thumb uses abilities.<br>Your companion follows and supplies their half of a combo.':'<b>Gordon:</b> WASD · Space power · Shift dash<br><b>Eric:</b> arrow keys · Enter power · / dash<br><b>H:</b> a high-five together · <b>Esc:</b> pause<br>Local co-op on one keyboard. Separate-device online play is not included.';}
const pad=$('touch-stick');function stickMove(e){const r=pad.getBoundingClientRect(),radius=r.width*.34;const x=(e.clientX-r.left-r.width/2)/radius,y=(e.clientY-r.top-r.height/2)/radius,l=Math.max(1,Math.hypot(x,y));stick.x=x/l;stick.y=y/l;pad.firstElementChild.style.transform=`translate(${stick.x*radius}px,${stick.y*radius}px)`;}pad.onpointerdown=e=>{stick.id=e.pointerId;pad.setPointerCapture(e.pointerId);stickMove(e);};pad.onpointermove=e=>{if(stick.id===e.pointerId)stickMove(e);};function stopStick(e){if(e.pointerId===stick.id){stick.id=null;stick.x=stick.y=0;pad.firstElementChild.style.transform='';}}pad.onpointerup=stopStick;pad.onpointercancel=stopStick;
function inputs(){const convert=(x,y)=>{let dx=x+y,dy=y-x,l=Math.max(1,Math.hypot(dx,dy));return{x:dx/l,y:dy/l};};const g=convert((keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0)),e=convert((keys.has('ArrowRight')?1:0)-(keys.has('ArrowLeft')?1:0),(keys.has('ArrowDown')?1:0)-(keys.has('ArrowUp')?1:0));if(game.mode==='coop')return[g,e];const touch=convert(stick.x,stick.y);return game.heroes.map(h=>h.id===game.active?{x:g.x+e.x+touch.x,y:g.y+e.y+touch.y}:{});}
function event(e){
 const scene=engine?.scene.getScene('Adventure');if(scene?.scene.isActive())scene.react(e);
 if(['power','sketch','restore','chapter','finish','dash','cheer'].includes(e.type))melody(e.type);
 switch(e.type){
 case 'restore':toast(e.kind==='bridge'?'A possibility becomes a path.':'Another light has a way home.');objective();break;
 case 'needsEric':toast('Blue first, then gold. Eric steadies; Gordon kindles.');break;
 case 'chapter':objective();if(e.stage===1)talk('ERIC','Wisconsin. Los Angeles. We’ve always found a way to meet.');if(e.stage===2)talk('GORDON','Those lights are caught in the storm. Let’s bring them home.');if(e.stage===3)talk('ERIC','The way is open. And there’s room for us, too.');break;
 case 'cheer':talk(...joyLines[game.cheers%4]);break;
 case 'rescue':toast(`${NAMES[e.hero]} is back. A friend makes all the difference.`);break;
 case 'hit':if(game.heroes[e.hero].hp<=0)talk(NAMES[1-e.hero],'I’m here. Stay close; we’ll catch our breath.');break;
 case 'swap':updateControls();break;
 case 'toast':toast(e.text);break;
 case 'memory':talk('A LITTLE MORE US',e.text,8);scene?.burst(e.x,e.y,'#ffe5ab',50);break;
 case 'finish':if(game.expedition){try{savedRoom=Math.min(19,game.index+1);localStorage.setItem('gordtopia-expedition-room',String(savedRoom));}catch{}}endingAt=clock+4;talk('GORDON','We made it better. Now let’s enjoy it together.',8);objective();break;
 }
}
function start(mode,room=null){
 if(!engine)return;engine.scene.stop('Adventure');clearInput();
 game=room===null?new Adventure({mode,gentle:$('gentle').checked,emit:event}):new Expedition({index:room,mode,gentle:$('gentle').checked,emit:event});playing=true;paused=false;endingAt=0;ambientTimer=0;objectiveKey="";
 $('title-screen').hidden=true;$('ending').hidden=true;$('pause-screen').hidden=true;$('hud').hidden=false;$('objective').hidden=false;$('play-controls').hidden=false;$('pause').textContent='Ⅱ';
 engine.scene.start('Adventure');objective();updateControls();focusGame();talk(game.expedition?'OUR NEXT ADVENTURE':'GORDON',game.expedition?game.story.line:'Eric! Let’s light the way home.',6);
}
function pause(on){if(!game||game.finished)return;paused=on;game.paused=on;clearInput();if(on)engine.scene.pause('Adventure');else engine.scene.resume('Adventure');$('pause-screen').hidden=!on;$('pause').textContent=on?'▶':'Ⅱ';if(on)$('resume').focus();else focusGame();}
function keyDown(e){
 if(e.code==='Escape'&&playing){e.preventDefault();pause(!paused);return;}
 if(!playing||paused||game?.finished||/INPUT/.test(e.target?.tagName))return;
 const accepted=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','ShiftLeft','ShiftRight','Slash','Enter','KeyQ','KeyH'];
 if(!accepted.includes(e.code))return;e.preventDefault();keys.add(e.code);if(e.repeat)return;
 if(e.code==='Space')game.power(game.mode==='solo'?game.active:0);
 if(e.code==='Enter')game.power(game.mode==='solo'?game.active:1);
 if(e.code==='ShiftLeft'||e.code==='ShiftRight')game.dash(game.mode==='solo'?game.active:0);
 if(e.code==='Slash')game.dash(game.mode==='solo'?game.active:1);
 if(e.code==='KeyQ')game.swap();if(e.code==='KeyH')game.cheer();
}
function tick(delta){
 const dt=Math.min(delta,.1);clock+=dt;if(game?.expedition)objective();
 if(game){
  ambientTimer+=dt;if(ambientTimer>4&&!game.finished){ambientTimer=0;const seq=[130.81,164.81,196,220,164.81,146.83];note(seq[Math.floor(game.time/4)%seq.length],2.8,0,.009);}
  $('gheart').textContent='♥ '.repeat(Math.max(0,game.heroes[0].hp))||'Catching breath';$('eheart').textContent='♥ '.repeat(Math.max(0,game.heroes[1].hp))||'Catching breath';$('bond').classList.toggle('linked',distance(...game.heroes)<4);$('cooldown').style.transform=`scaleY(${game.heroes[game.active].cool/(game.expedition?Math.max(.5,.85-game.region*.08):.85)})`;
 }
 if(clock>toastUntil)$('toast').classList.remove('show');if(clock>talkUntil)$('dialogue').hidden=true;
 if(endingAt&&clock>endingAt){endingAt=0;$('ending').hidden=false;$('objective').hidden=true;$('play-controls').hidden=true;
  const exp=game.expedition,final=exp&&game.index===19;
  $('ending-title').innerHTML=final?'All roads<br>lead home.':exp?'Look what<br>we made possible.':'Everyone has<br>a way home.';
  $('ending-copy').textContent=exp?game.story.memory:'You built the crossing. You sheltered the light. There is a much bigger world waiting for us.';
  $('results').innerHTML=exp?`<span><b>${game.index+1}/20</b>adventures shared</span><span><b>${game.secret.found?'♥':'◇'}</b>${game.secret.found?'little moment found':'a surprise to find'}</span><span><b>${game.cheers}</b>high-fives</span>`:`<span><b>3</b>spans rebuilt</span><span><b>3</b>lights sheltered</span><span><b>${game.cheers}</b>high-fives</span>`;
  $('again').textContent=final?'Let’s take the long way again':exp?'Next · '+ENCOUNTERS[game.index+1].title:'Explore the wider world · 20 adventures';
  $('next-power').textContent=exp&&((game.index+1)%5===0)&&!final?'Growing together: your powers now reach farther and return sooner.':exp?'Progress saved on this device. Stay here as long as you like.':'One friendship. Four new regions. Twenty more ways to make a difference.';
  $('again').focus();}
}
$('solo').onclick=()=>start('solo');$('wider').onclick=()=>start('solo',savedRoom);$('wider-coop').onclick=()=>start('coop',0);$('coop').onclick=()=>start('coop');$('pause').onclick=()=>pause(!paused);$('resume').onclick=()=>pause(false);$('restart').onclick=()=>{if(confirm('Start the level again? This run will reset.'))start(game.mode,game.expedition?game.index:null);};$('again').onclick=()=>start(game.mode,game.expedition?(game.index+1)%20:0);$('gentle').onchange=()=>{if(game)game.gentle=$('gentle').checked;};$('still').checked=soft;$('still').onchange=()=>soft=$('still').checked;
$('audio').onclick=()=>{sound=!sound;if(sound){audioOn();note(523,.3);}else audio?.suspend();$('audio').textContent=sound?'♪ ON':'♪ OFF';$('audio').setAttribute('aria-pressed',String(sound));};
$('swap').onclick=()=>game?.swap();$('emote').onclick=()=>game?.cheer();$('dash').onclick=()=>game?.dash(game.active);$('power').onclick=()=>game?.power(game.active);
addEventListener('blur',()=>{if(playing&&!game?.finished)pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden){pause(true);audio?.suspend();}else if(sound)audio?.resume();});
function failure(){$('loading').textContent='The artwork didn’t load. Check your connection and reload to try again.';$('solo').textContent='Reload the adventure';$('solo').disabled=false;$('solo').onclick=()=>location.reload();}
launchEngine({model:()=>game,soft:()=>soft,isPaused:()=>paused,inputs,clearInput,prepareFrames:spriteFrames,keyDown,keyUp:e=>keys.delete(e.code),tick,failure,ready:g=>{engine=g;$('wider').disabled=false;$('wider-coop').disabled=false;$('wider').textContent=savedRoom?'Continue our journey · '+(savedRoom+1)+'/20':'The wider world · 20 adventures';$('solo').disabled=false;$('coop').disabled=false;$('solo').textContent='Original level · solo + companion';$('loading').textContent='Solo + companion · or local co-op · sound starts off';}});
