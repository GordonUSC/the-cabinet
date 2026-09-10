import {Adventure,distance,clamp,COLORS,NAMES} from './adventure-core.js';
export const REGIONS=['STOUGHTON · THE WELCOME WOODS','WISCAGO · WHERE TWO SHORES MEET','ROSEMONT · THE LANTERN GARDENS','GORDTOPIA · THE LONG WALK HOME'];
const entries=[
 ['relay','A light in every window','A welcome is something we make.','A little care turns a collection of rooms into a home.'],
 ['echo','The conversation grove','Listen. Answer. Let the other person finish.','Some of the best adventures begin with a message from a friend.'],
 ['mirror','The terracotta workshop','A different angle can reveal the pattern.','A gift can be a new way to see something familiar.'],
 ['escort','Someone smaller than the storm','Match their pace. Keep the path gentle.','Making room includes the person who needs a little more time.'],
 ['gate','I will hold the door','Go ahead. I have this side.','Being dependable is its own kind of magic.'],
 ['relay','Wisconsin meets Los Angeles','Build from both shores until the gap becomes a meeting place.','Wiscago: Wisconsin and Los Angeles meet in Chicago.'],
 ['echo','Across the water','Your reply is the part that completes the tune.','Distance changes the route. It does not have to change the friendship.'],
 ['mirror','A city of reflections','We each see a part of the way forward.','Two perspectives can make a better map than one.'],
 ['escort','The boat that waits','Nobody has to race to deserve a place aboard.','The long way can still be the right way when you travel together.'],
 ['gate','Room for one more','Leave a crossing that works for the next person too.','A world becomes generous through the choices of the people building it.'],
 ['relay','The rescue garden','Turn the storm into a place of shelter.','A fantasy echo of your Rosemont villager-rescue adventure.'],
 ['echo','The lantern chorus','One voice starts it. Two voices make it glow.','Joy grows when someone answers it.'],
 ['mirror','The glasshouse of possibilities','Find the turn that lets the light through.','Helping is sometimes a small adjustment, offered with care.'],
 ['escort','The last lost light','Stay with this one. There is no timer on kindness.','The person who brings everyone home deserves to come home too.'],
 ['gate','Keep the garden open','Make the welcome last after you pass through.','A rescue is not finished until there is somewhere safe to stay.'],
 ['relay','The cherry-light trail','Mark a route through the cold so others can follow.','The shared atlas keeps the journey from disappearing after the walk.'],
 ['echo','A signal through the snow','Even here, you can hear each other.','A good friend can make a faraway place feel less far away.'],
 ['mirror','The gold-crowned horizon','Let the things you learned point toward home.','A gold crown above a portal becomes a promise: there is a way back.'],
 ['escort','A little warmth to carry','Bring the light across the last stretch together.','Sometimes the people depending on you are yourselves.'],
 ['gate','All roads lead home','One holds. One opens. Both belong.','You do not have to earn your place here. You helped make it.']
];
export const ENCOUNTERS=entries.map(([kind,title,line,memory],index)=>({index,region:Math.floor(index/5),kind,title,line,memory}));
export class Expedition extends Adventure{
 constructor({index=0,...options}={}){
  super(options);this.expedition=true;this.spawnY=29;this.index=clamp(index,0,19);this.story=ENCOUNTERS[this.index];this.region=this.story.region;this.kind=this.story.kind;this.stage=2;
  this.heroes.forEach((h,i)=>{h.x=11+i*2;h.y=29;});this.bridge=[];this.knots=[];this.wisps=[];this.nodes=[[{x:8,y:24},{x:16,y:21},{x:12,y:14}],[{x:12,y:25},{x:16,y:22},{x:9,y:15}],[{x:17,y:25},{x:7,y:20},{x:15,y:13}],[{x:9,y:26},{x:16,y:20},{x:10,y:12}]][this.region].map((n,i)=>({...n,done:false,blue:0,turn:(i+this.region+1)%4,target:(i+this.region+3)%4}));
  this.beat=0;this.echoLeft=0;this.sheltered=false;this.open=false;this.gateHeld=false;this.hold={x:8,y:21};this.latch={x:12,y:15};this.exit={x:12,y:10};this.light={x:12,y:25};this.trail=[[{x:8,y:23},{x:16,y:19},{x:12,y:14},{x:12,y:10}],[{x:14,y:24},{x:10,y:19},{x:13,y:14},{x:12,y:10}],[{x:17,y:24},{x:8,y:20},{x:15,y:14},{x:12,y:10}],[{x:14,y:25},{x:10,y:21},{x:14,y:15},{x:12,y:10}]][this.region];this.waypoint=0;
  this.secret={x:this.index%2?18:6,y:27,found:false};this.hazardClock=2;this.exitHold=0;this.revision=0;this.ward=0;
 }
 tile(x,y){x=Math.round(x);y=Math.round(y);if(x<5||x>19||y<8||y>31)return null;if((x===5||x===19)&&(y<11||y>28))return null;if(this.kind==='gate'&&y===18)return this.open||this.gateHeld?'path':'gate';if(this.region===1&&y%6===0&&(x<9||x>15))return null;if(this.region===3&&((x===7&&y>=16&&y<=19)||(x===17&&y>=24&&y<=26)))return null;return this.region===3?'snow':this.region===2?'garden':this.region===1?'waterstone':'grass';}
 get range(){return 3.4+this.region*.3+(distance(...this.heroes)<4?.4:0);}
 get progress(){if(this.kind==='relay'||this.kind==='mirror')return this.nodes.filter(n=>n.done).length/3;if(this.kind==='echo')return this.beat/6;if(this.kind==='escort')return this.waypoint/4;return this.open?1:0;}
 get solved(){return this.progress>=1;}
 get goal(){if(this.solved)return 'Meet at the gold home stone.';return {relay:`Restore welcome lights · ${this.nodes.filter(n=>n.done).length}/3`,echo:`Answer ${NAMES[this.beat%2===0?1:0]}’s part · ${this.beat}/6`,mirror:`Light the prisms · ${this.nodes.filter(n=>n.done).length}/3`,escort:`Guide the small light · ${this.waypoint}/4`,gate:'One holds the door. One opens it for everyone.'}[this.kind];}
 get hint(){if(this.solved)return 'Both friends together at HOME. Your companion comes with you.';return {relay:'Eric sketches blue; Gordon kindles gold. Use your power near each lantern.',echo:`${NAMES[this.beat%2===0?1:0]}: use your power beside the numbered signal. Then answer with the other friend.`,mirror:'Eric turns each prism with his power. Match the small gold arrow; Gordon lights it with his power.',escort:'Stay together near the little light. Follow its dotted route; your powers clear the storm motes.',gate:'Eric stands on the blue stone. Gordon crosses and uses his power at the latch. Then both go home.'}[this.kind];}
 target(id=this.active){if(this.solved)return this.exit;if(this.kind==='relay'||this.kind==='mirror')return this.nodes.find(n=>!n.done);if(this.kind==='echo')return this.nodes[Math.floor(this.beat/2)];if(this.kind==='escort')return this.waypoint<4?this.trail[this.waypoint]:this.exit;return id===1&&!this.open?this.hold:this.gateHeld||this.open?this.latch:this.hold;}
 power(id){
  const h=this.heroes[id];if(this.paused||this.finished||h.hp<=0||h.cool>0)return false;h.cool=Math.max(.5,.85-this.region*.08);h.cast=.42;this.event('power',{hero:id,x:h.x,y:h.y,range:this.range});
  for(const p of this.pulses)if(distance(h,p)<this.range){p.life=0;this.event('spark',{x:p.x,y:p.y,color:COLORS[id]});}
  const near=this.nodes.filter(n=>!n.done&&distance(n,h)<this.range).sort((a,b)=>distance(a,h)-distance(b,h))[0];
  const restore=n=>{n.done=true;n.blue=0;this.combos++;this.event('restore',{x:n.x,y:n.y,kind:'light'});this.heroes.forEach(p=>{p.emote=.6;p.hp=Math.min(5,p.hp+1);});};
  if(this.kind==='relay'&&near){if(id===1){near.blue=10-this.region*1.5;this.event('sketch',near);}else if(near.blue>0)restore(near);else this.event('needsEric');}
  if(this.kind==='mirror'&&near){if(id===1){near.turn=(near.turn+1)%4;this.event('sketch',near);}else if(near.turn===near.target)restore(near);else this.event('toast',{text:'Ask Eric to turn the prism toward its small gold arrow.'});}
  if(this.kind==='echo'&&this.beat<6){const n=this.nodes[Math.floor(this.beat/2)],wanted=this.beat%2===0?1:0;if(id===wanted&&distance(h,n)<this.range){this.beat++;this.echoLeft=18;this.combos++;this.event('restore',{x:n.x,y:n.y,kind:'light'});}else if(distance(h,n)<this.range)this.event('toast',{text:`Listen for ${NAMES[wanted]}’s part first.`});}
  if(this.kind==='gate'&&id===0&&this.gateHeld&&distance(h,this.latch)<2.5&&!this.open){this.open=true;this.revision++;this.combos++;this.event('restore',{...this.latch,kind:'bridge'});}
  if(this.kind==='escort')this.ward=1.5+this.region*.5;
  return true;
 }
 cheer(){const before=this.cheers;super.cheer();if(this.cheers>before){this.ward=3+this.region;if(this.heroes.every(h=>distance(h,this.secret)<3)&&!this.secret.found){this.secret.found=true;this.event('memory',{text:this.story.memory,...this.secret});}}}
 companion(dt){
  const h=this.heroes[1-this.active],leader=this.heroes[this.active];if(h.hp<=0)return;let dest=null;
  if(leader.hp<=0)dest=leader;
  else if(this.solved)dest={x:this.exit.x+(h.id?1:-1),y:this.exit.y};
  else if(this.kind==='gate'){
   if(h.id===1&&!this.open&&leader.y<25)dest=this.hold;
   if(h.id===0&&this.gateHeld&&!this.open)dest=this.latch;
  }
  else if(this.kind==='escort'){if(distance(h,this.light)>2.2)dest={x:leader.x+(leader.x>12?-1:1),y:leader.y+.4};}
  else {const n=this.target();if(n&&distance(leader,n)<this.range+1)dest={x:n.x+(h.id?1:-1),y:n.y+1};}
  if(!dest&&distance(h,leader)>1.4)dest={x:leader.x+(leader.x>12?-1:1),y:leader.y+.3};
  if(dest&&distance(h,dest)>.2){const step=this.nextStep(h,dest);this.move(h,step.x-h.x,step.y-h.y,dt);}else h.walk=0;
  if(this.kind==='relay'){const n=this.nodes.find(n=>!n.done&&distance(n,h)<this.range&&distance(n,leader)<this.range+1);if(n&&(h.id===1||n.blue>0))this.power(h.id);}
  if(this.kind==='mirror'){const n=this.nodes.find(n=>!n.done&&distance(n,h)<this.range&&distance(n,leader)<this.range+1);if(n&&((h.id===1&&n.turn!==n.target)||(h.id===0&&n.turn===n.target)))this.power(h.id);}
  if(this.kind==='echo'&&this.beat<6&&h.id===(this.beat%2===0?1:0)&&distance(h,this.target())<this.range&&distance(leader,this.target())<this.range+1)this.power(h.id);
  if(this.kind==='gate'&&h.id===0&&this.gateHeld&&distance(h,this.latch)<2.5)this.power(h.id);
  if(this.pulses.some(p=>p.life>0&&distance(h,p)<this.range))this.power(h.id);
 }
 update(dt,input){
  if(this.paused||this.finished)return;dt=clamp(dt,0,.05);
  const held=this.heroes[1].hp>0&&distance(this.heroes[1],this.hold)<1.1;if(held!==this.gateHeld){this.gateHeld=held;this.revision++;}
  super.update(dt,input);for(const n of this.nodes)n.blue=Math.max(0,n.blue-dt);this.ward=Math.max(0,this.ward-dt);
  if(this.kind==='echo'&&this.beat%2===1&&!this.gentle){this.echoLeft-=dt;if(this.echoLeft<=0){this.beat--;this.event('toast',{text:'That note faded. Start this pair again; the rest of the song stays.'});}}
  if(this.kind==='escort'&&!this.sheltered){const dest=this.trail[this.waypoint];const close=this.heroes.every(h=>h.hp>0&&distance(h,this.light)<4.3);if(close&&dest){const d=distance(this.light,dest);if(d<.2){this.waypoint++;if(this.waypoint===4){this.sheltered=true;this.event('restore',{...this.light,kind:'light'});}}else{this.light.x+=(dest.x-this.light.x)/d*dt*1.3;this.light.y+=(dest.y-this.light.y)/d*dt*1.3;}}}
  if(this.ward>0)this.pulses=this.pulses.filter(p=>distance(p,this.light)>3);
  if(!this.solved&&(this.kind==='escort'||this.region>0)){
   this.hazardClock-=dt;if(this.hazardClock<=0){this.hazardClock=this.gentle?6:4.5-this.region*.45;const h=this.heroes[Math.floor(this.time/4)%2],from={x:this.index%2?18:6,y:15+(Math.floor(this.time/5)%3)*4},a=Math.atan2(h.y-from.y,h.x-from.x);for(let i=-1;i<=1;i++){const angle=a+i*.35;this.pulses.push({...from,vx:Math.cos(angle)*1.8,vy:Math.sin(angle)*1.8,life:7,warn:1});}}}
  if(this.solved){this.pulses=[];this.exitHold=this.heroes.every(h=>h.hp>0&&distance(h,this.exit)<2.2)?this.exitHold+dt:0;if(this.exitHold>1.2){this.finished=true;this.heroes.forEach(h=>h.emote=5);this.event('finish',{time:this.time,combos:this.combos,rescues:this.rescues,cheers:this.cheers});}}
 }
}
