(function(root,factory){const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.BlockingModel=model})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const duration=6,clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,Number.isFinite(Number(x))?Number(x):0));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const takes={hold:{name:'Hold the distance',short:'Hold',who:'Neither performer changes their floor mark.',question:'Could this distance suggest respect, uncertainty, or something else?',color:'#d6b67c'},approach:{name:'A closes the distance',short:'Approach',who:'A crosses toward B. B stays on the same mark.',question:'Could the approach feel supportive or intrusive? What context would decide?',color:'#e8ab72'},leave:{name:'B turns and moves away',short:'Move away',who:'B turns away from A, then crosses toward the doorway.',question:'Could B be withdrawing, making space, or going to do something useful?',color:'#80c8c2'}};
function sample(key,time){key=takes[key]?key:'hold';const t=clamp(time,0,duration),p=ease((t-.8)/3),q=ease((t-1.2)/3),turn=ease((t-.45)/.6);const A={x:270,y:450,face:1,walk:0,kind:'a'},B={x:650,y:450,face:-1,walk:0,kind:'b'};if(key==='approach'){A.x+=220*p;A.walk=t>.8&&t<3.8?Math.sin((t-.8)*10)*Math.sin(Math.PI*clamp((t-.8)/3)):0}if(key==='leave'){B.x+=190*q;B.y-=65*q;B.face=-1+2*turn;B.walk=t>1.2&&t<4.2?Math.sin((t-1.2)*10)*Math.sin(Math.PI*clamp((t-1.2)/3)):0}const distance=Math.hypot(A.x-B.x,A.y-B.y);return {key,t,A,B,distance,progress:t/duration,line:t>=2.4&&t<=4.5,phase:t<.8?'Starting positions':t<4.3?'The movement':'End positions',change:t<.45?'Both begin on the same marks.':key==='hold'?'A and B keep their distance and face each other.':key==='approach'?(t<3.8?'A is moving toward B; B holds position.':'A is closer to B. Both still face each other.'):(t<1.2?'B turns away from A before moving.':t<4.2?'B moves toward the doorway; A stays put.':'B is further from A and faces the doorway.')};}
function camera(frame,s){if(frame==='gesture')return `${s.B.x-180} ${s.B.y-335} 325 300`;if(frame==='speaker')return `${s.A.x-74} ${s.A.y-323} 190 106.875`;if(frame==='listener')return `${s.B.x-115} ${s.B.y-323} 190 106.875`;return '0 0 1000 562.5'}
const gesturePeaks={palm:2.7,fold:2.7,repeat:1.85};
function gesture(name,time){
 const t=clamp(time,0,duration),p=ease((t-.8)/1.5);
 if(name==='repeat'){
  const elapsed=clamp(t-1.4,0,3),cycle=elapsed-Math.floor(elapsed);
  const amount=t<1.4||elapsed>=3?0:cycle<.3?ease(cycle/.3):cycle<=.52?1:1-ease((cycle-.52)/.34);
  const count=[1.7,2.7,3.7].filter(at=>t>=at-1e-9).length;
  const contact=t>=1.4&&elapsed<3&&cycle>=.3-1e-9&&cycle<=.52+1e-9;
  return {name,amount,count,contact,support:ease(t/.8),phase:t<1.4?'Prepare the wrist':elapsed>=3?'Three touches completed':contact?`Touch ${count} of 3`:amount>.05?'Reach / release':'Hand clear of the cuff'};
 }
 return {name:name==='fold'?'fold':'palm',amount:p,count:0,contact:false,phase:p===0?'Resting arms':p<1?'Arms moving':name==='fold'?'Both forearms crossed':'Fingers spread, palm open'};
}
function gesturePose(g={name:'none',amount:0}){
 const v=clamp(g.amount),mix=(a,b,n=v)=>a.map((x,i)=>x+(b[i]-x)*n);
 const near={shoulder:[29,-212],elbow:[49,-163],wrist:[39,-112]},far={shoulder:[-30,-212],elbow:[-48,-168],wrist:[-39,-118]};
 let hand='rest',angle=0;
 if(g.name==='palm'){near.elbow=mix(near.elbow,[77,-161]);near.wrist=mix(near.wrist,[112,-211]);hand='open';angle=-10*v;}
 if(g.name==='fold'){near.elbow=mix(near.elbow,[64,-161]);near.wrist=mix(near.wrist,[-39,-196]);far.elbow=mix(far.elbow,[-66,-176]);far.wrist=mix(far.wrist,[36,-200]);hand='fold';angle=-74*v;}
 if(g.name==='repeat'){
  const prep=g.support??1;far.elbow=mix(far.elbow,[-65,-143],prep);far.wrist=mix(far.wrist,[-5,-145],prep);
  near.elbow=mix(near.elbow,[66,-171],prep);near.wrist=mix(near.wrist,mix([27,-228],[-23,-188]),prep);hand='touch';angle=170*prep;
 }
 return {near,far,hand,angle};
}
return {duration,takes,sample,camera,gesture,gesturePose,gesturePeaks};
});
