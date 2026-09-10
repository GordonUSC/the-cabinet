/* Standalone asset component for the sole Site owner to integrate. */
(()=>{'use strict';
const scenes={
 atlas:{title:'The map has an opinion.',alt:'Eric and Gordon unfold a map, turn it around, and laugh together.',lines:['An excellent map. A small orientation problem.','Ah. That way up.','There’s more world over there.'],button:'Turn the map together'},
 fieldbook:{title:'A little something for you.',alt:'Eric and Gordon open a small chest of gravel and share an affectionate laugh.',lines:['A very ordinary-looking chest.','An extraordinary amount of gravel.','Because it’s you.'],button:'Open the little chest'},
 quest:{title:'The dice have an opinion, too.',alt:'Eric and Gordon roll an oversized die, reach for it, and catch it together.',lines:['Shall we see where curiosity takes us?','The die has other plans.','Caught it. Together.'],button:'Play the dice moment'},
 hold:{title:'We have time.',alt:'Eric and Gordon sit with two fishing rods, watch their floats, and laugh at a small splash.',lines:['Two rods. Nowhere else to be.','Was that a nibble?','The good part is the company.'],button:'Stay by the water'},
 homecoming:{title:'Same two. More world.',alt:'Eric and Gordon arrive with a map and a flower, set their things down, and sit together on a bench.',lines:['Something to bring home.','A little room for each other.','More world. Whenever we’re ready.'],button:'Come home together'}
};
const element=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
function timeline({frame,finish,motion=()=>true,set=setTimeout,clear=clearTimeout}){
 let timers=[],generation=0,destroyed=false;
 const stop=()=>{generation++;timers.forEach(clear);timers=[]};
 return {
  play(){if(destroyed)return;stop();const token=generation;frame(0);if(!motion()){frame(2);finish?.();return;}[[850,1],[1950,2]].forEach(([ms,n])=>timers.push(set(()=>{if(token===generation&&!destroyed)frame(n)},ms)));timers.push(set(()=>{if(token===generation&&!destroyed){timers=[];finish?.()}},3300));},
  stop,
  destroy(){stop();destroyed=true;}
 };
}
function mount(host,id,{assetRoot='assets',compact=false,onPlay,onFinish,caption,actionLabel,hideButton=false}={}){
 if(!host||!scenes[id])return null;
 const info=scenes[id],root=element('section','living-vignette'+(compact?' living-vignette--compact':''));
 root.dataset.scene=id;root.setAttribute('aria-label',info.title);
 const stage=element('div','living-vignette__stage');stage.setAttribute('role','img');stage.setAttribute('aria-label',info.alt);
 stage.style.backgroundImage=`url("${assetRoot.replace(/\/$/,'')}/${id}-sheet.png")`;stage.dataset.frame='0';
 const content=element('div','living-vignette__content'),title=element('h3','',info.title),line=element('p','living-vignette__line',caption||info.lines[0]);
 line.setAttribute('aria-live','polite');line.setAttribute('aria-atomic','true');
 const play=element('button','living-vignette__replay',info.button);play.type='button';if(actionLabel)play.textContent=actionLabel;if(hideButton)play.hidden=true;
 const reduced=()=>document.body.classList.contains('no-motion')||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const controller=timeline({motion:()=>!reduced()&&!document.hidden,frame:n=>{stage.dataset.frame=String(n);if(!caption)line.textContent=info.lines[n]},finish:()=>{root.classList.remove('is-playing');play.textContent=actionLabel||'Again, whenever you like';onFinish?.(id)}});
 const run=()=>{root.classList.add('is-playing');controller.play();onPlay?.(id)};
 play.addEventListener('click',run);content.append(title,line,play);root.append(stage,content);host.append(root);
 const pause=()=>{if(document.hidden||reduced()){controller.stop();root.classList.remove('is-playing')}};
 document.addEventListener('visibilitychange',pause);document.getElementById('motion')?.addEventListener('click',pause);
 return {root,play:run,celebrate(text){controller.stop();stage.dataset.frame='2';root.classList.remove('is-playing');line.textContent=text||info.lines[2]},caption(text){caption=String(text);line.textContent=caption},destroy(){controller.destroy();document.removeEventListener('visibilitychange',pause);document.getElementById('motion')?.removeEventListener('click',pause);root.remove()}};
}
window.GordtopiaVignettes={mount,scenes:Object.keys(scenes),timeline};
})();
