import * as Phaser from './vendor/phaser.esm.min.js';
import {distance,clamp,NAMES,COLORS} from './adventure-core.js';
export const project=(x,y,z=0)=>({x:(x-y)*32,y:(x+y)*16-z});
const color=c=>typeof c==='number'?c:parseInt(c.slice(1,7),16);
const random=(x,y)=>((Math.sin(x*12.9898+y*78.233)*43758.5453)%1+1)%1;
// Every visible world object belongs to Phaser's display list. The only Canvas
// preprocessing is the existing edge-connected matte of the supplied artwork.
export function launchEngine(hooks){
 class Backdrop extends Phaser.Scene{
  constructor(){super('Backdrop');}
  preload(){
   this.load.image('island','assets/adventure-island.png');
   this.load.image('realms','assets/adventure-realms.png');
   this.load.image('hero-sheet','assets/adventure-heroes.png');
   this.load.on('loaderror',()=>hooks.failure());
  }
  create(){
   if(!this.textures.exists('island')||!this.textures.exists('hero-sheet'))return;
   this.image=this.add.image(0,0,'island').setOrigin(.5);
   const realm=this.textures.get('realms'),source=realm.getSourceImage(),rw=Math.floor(source.width/2),rh=Math.floor(source.height/2);for(let i=0;i<4;i++)realm.add('realm-'+i,0,(i%2)*rw,Math.floor(i/2)*rh,rw,rh);
   const frames=hooks.prepareFrames(this.textures.get('hero-sheet').getSourceImage());
   frames.forEach((frame,i)=>this.textures.addCanvas('hero-'+i,frame));
   for(let id=0;id<2;id++)for(let pose=0;pose<4;pose++)this.anims.create({key:`hero-${id}-pose-${pose}`,frames:[{key:'hero-'+((id===1?0:4)+pose)}],frameRate:1,repeat:-1});
   const dot=this.make.graphics({x:0,y:0},false);dot.fillStyle(0xffffff);dot.fillRect(0,0,4,4);dot.generateTexture('mote',4,4);dot.destroy();
   this.embers=this.add.particles(0,0,'mote',{x:{min:0,max:this.scale.width},y:{min:0,max:this.scale.height},lifespan:10000,speedY:{min:-7,max:-2},speedX:{min:-3,max:3},alpha:{start:.5,end:0},scale:{start:.5,end:.1},frequency:300,tint:[0x8de8ef,0xffe5a4],maxParticles:45});
   this.fit();this.scale.on('resize',this.fit,this);
   this.input.keyboard.on('keydown',e=>hooks.keyDown(e));
   this.input.keyboard.on('keyup',e=>hooks.keyUp(e));
   hooks.ready(this.game);
  }
  fit(){if(!this.image)return;const {width:w,height:h}=this.scale;this.image.setPosition(w/2,h/2).setScale(Math.max(w/this.image.width,h/this.image.height));}
  update(_,delta){const model=hooks.model(),region=model?.expedition?model.region:-1;if(region!==this.region&&this.image){this.region=region;this.image.setTexture(region<0?'island':'realms',region<0?undefined:'realm-'+region);this.fit();}if(this.image)this.image.alpha=model ? .52 : 1;if(hooks.isPaused())return;hooks.tick(delta/1000);}
 }
 class AdventureScene extends Phaser.Scene{
  constructor(){super('Adventure');}
  create(){
   this.accumulator=0;this.elapsed=0;this.revision='';this.model=hooks.model();this.terrain=this.add.graphics().setDepth(-1000);
   this.effects=this.add.graphics().setDepth(5000);this.plates=this.add.graphics().setDepth(-5);
   this.props=[];this.nodes=[];this.heroes=[];this.textPool=[];this.labelIndex=0;
   this.model.heroes.forEach(h=>{
    const shadow=this.add.ellipse(0,0,36,16,0x031621,.5);
    const halo=this.add.ellipse(0,0,47,23).setStrokeStyle(1.5,color(COLORS[h.id]),.8);
    const sprite=this.add.sprite(0,0,'hero-'+(h.id===1?0:4)).setOrigin(.5,1).setDisplaySize(82,109);
    const name=this.add.text(0,0,NAMES[h.id],{fontFamily:'Body,system-ui',fontSize:'12px',fontStyle:'bold',color:COLORS[h.id],stroke:'#041625',strokeThickness:4}).setOrigin(.5);
    const rig={sprite,shadow,halo,name,bob:0,tilt:0,pose:-1};
    this.tweens.add({targets:rig,bob:1.8,duration:1000+h.id*160,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    this.heroes.push(rig);
   });
   const p=project(12,33);this.cameras.main.centerOn(p.x,p.y).setZoom(this.scale.width<650?.82:1.08);
   this.events.once('shutdown',()=>{hooks.clearInput();this.tweens.killAll();});
   this.redrawTerrain();
  }
  poly(g,pts,fill,stroke){g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle(color(fill),typeof fill==='string'&&fill.length===9?parseInt(fill.slice(7),16)/255:1);g.fillPath();}if(stroke){g.lineStyle(.8,color(stroke),.5);g.strokePath();}}
  diamond(g,x,y,w,h,fill,stroke){this.poly(g,[[x,y-h],[x+w,y],[x,y+h],[x-w,y]],fill,stroke);}
  block(g,x,y,w,h,d,top,left,right){this.poly(g,[[x-w,y],[x,y+h],[x,y+h+d],[x-w,y+d]],left);this.poly(g,[[x,y+h],[x+w,y],[x+w,y+d],[x,y+h+d]],right);this.diamond(g,x,y,w,h,top,'#b5e6d0');}
  glow(g,x,y,r,c,a=.4){for(let i=4;i>0;i--){g.fillStyle(color(c),a*(5-i)/35);g.fillCircle(x,y,r*i/4);}}
  label(t,x,y,size=12,c='#e2eeda'){
   let text=this.textPool[this.labelIndex++];if(!text){text=this.add.text(0,0,'',{fontFamily:'Body,system-ui',fontStyle:'bold',stroke:'#041625',strokeThickness:3}).setOrigin(.5).setDepth(6000);this.textPool.push(text);}
   text.setVisible(true).setPosition(x,y).setText(t).setFontSize(size).setColor(c).setRotation(0);return text;
  }
  redrawTerrain(){
   const g=this.terrain;g.clear();this.props.forEach(p=>p.destroy());this.props=[];
   for(let sum=8;sum<61;sum++)for(let x=2;x<=22;x++){
    const y=sum-x;if(y<5||y>37)continue;const t=this.model.tile(x,y);if(!t)continue;const v=project(x,y),n=random(x,y);
    if(t==='gap'){this.diamond(g,v.x,v.y,31,15,'#13425877','#77e4dc');continue;}
    const edge=!this.model.walkable(x+1,y)||!this.model.walkable(x,y+1);
    const top=t==='snow'?'#a4bbce':t==='garden'?'#617d67':t==='waterstone'?'#637f9b':t==='bridge'?'#d2b880':t==='crown'?['#597c75','#54736e','#607e77','#5a7770'][Math.floor(n*4)]:t==='path'?'#b2b69a':['#537d65','#5f896b','#578470','#4f7b68'][Math.floor(n*4)];
    this.block(g,v.x,v.y,32.1,16.1,edge?40+n*55:8,top,'#263f43','#1c343c');
    if(t==='bridge')this.diamond(g,v.x,v.y-1,26,11,null,'#fce4a9');
    if(t==='gate')this.block(g,v.x,v.y-8,29,14,34,'#816caa','#444562','#343955');
    if(edge&&t!=='bridge'&&t!=='gate'&&n>.45){const lantern=this.add.graphics().setDepth(sum+.2),h=16+n*18;this.block(lantern,v.x,v.y-h,6,3,h,'#bdab75','#756b4d','#635c47');this.glow(lantern,v.x,v.y-h,30,'#ffcc73');this.block(lantern,v.x,v.y-h-10,5,3,10,'#fff2b7','#efc16c','#dd9b49');this.props.push(lantern);}
   }
  }
  burst(x,y,c,n=30){const p=project(x,y,15),emitter=this.add.particles(p.x,p.y,'mote',{emitting:false,lifespan:{min:550,max:1500},speed:{min:20,max:95},gravityY:55,scale:{start:1,end:0},alpha:{start:1,end:0},tint:color(c),maxParticles:100}).setDepth(7000);emitter.explode(hooks.soft()?Math.min(n,8):n);this.time.delayedCall(1600,()=>emitter.destroy());}
  ring(x,y,c,range=3.4,duration=550){const p=project(x,y,4),r=this.add.ellipse(p.x,p.y,range*64,range*32).setStrokeStyle(3,color(c)).setScale(.05).setDepth(6500);this.tweens.add({targets:r,scaleX:1,scaleY:1,alpha:0,duration,onComplete:()=>r.destroy()});}
  react(e){
   if(e.type==='power'){this.burst(e.x,e.y,COLORS[e.hero],12);this.ring(e.x,e.y,COLORS[e.hero],e.range);}
   if(e.type==='sketch')this.burst(e.x,e.y,COLORS[1],15);
   if(e.type==='restore'){this.ring(e.x,e.y,'#fff0ba',4.5,1200);this.burst(e.x,e.y,'#ffdf84',70);}
   if(e.type==='cheer')this.burst(e.x,e.y,'#ffd78c',35);
   if(e.type==='spark')this.burst(e.x,e.y,e.color,8);
   if(e.type==='hit'&&!hooks.soft())this.cameras.main.shake(100,.002);
   if(e.type==='finish')this.model.heroes.forEach(h=>this.burst(h.x,h.y,COLORS[h.id],100));
  }
  update(_,delta){
   const dt=Math.min(delta/1000,.1);this.elapsed+=dt;this.accumulator+=dt;
   while(this.accumulator>=1/60){this.model.update(1/60,hooks.inputs());this.accumulator-=1/60;}
   const m=this.model,heroes=m.heroes,cam=this.cameras.main,mid=project((heroes[0].x+heroes[1].x)/2,(heroes[0].y+heroes[1].y)/2),zoom=clamp((this.scale.width<650?.87:1.15)-(distance(...heroes)-3)*.035,this.scale.width<650?.48:.68,this.scale.width<650?.9:1.16),lerp=1-Math.exp(-dt*5);
   cam.setZoom(Phaser.Math.Linear(cam.zoom,zoom,lerp));cam.centerOn(Phaser.Math.Linear(cam.midPoint.x,mid.x,lerp),Phaser.Math.Linear(cam.midPoint.y,mid.y-this.scale.height*.07/cam.zoom,lerp));
   const rev=[m.index??-1,m.revision??0,m.stage,...m.bridge.map(n=>+n.done)].join(':');if(rev!==this.revision){this.revision=rev;this.redrawTerrain();}
   this.labelIndex=0;this.effects.clear();this.plates.clear();const fx=this.effects,clock=this.elapsed;
   heroes.forEach(h=>{
    const r=this.heroes[h.id],p=project(h.x,h.y),pose=h.cast>0?2:h.emote>0?3:h.walk?1:0,jump=h.emote>0?Math.abs(Math.sin(clock*6))*12:h.dash>0?9:0,bob=hooks.soft()?0:h.walk?Math.sin(clock*15+h.id)*3:r.bob;
    if(r.pose!==pose){r.pose=pose;r.sprite.play(`hero-${h.id}-pose-${pose}`);}
    r.sprite.setPosition(p.x,p.y-jump-bob).setFlipX(h.face<0).setRotation(h.walk&&!hooks.soft()?Math.sin(clock*12)*.025:0).setAlpha(h.hp<=0?.65:h.inv>0&&Math.floor(clock*10)%2?.5:1).setDepth(h.x+h.y+.5);
    r.shadow.setPosition(p.x,p.y+2).setDepth(h.x+h.y+.3);r.halo.setPosition(p.x,p.y+2).setDepth(h.x+h.y+.4).setVisible(m.mode==='solo'&&m.active===h.id);r.name.setPosition(p.x,p.y-120).setDepth(6000);
    if(h.hp<=0){this.label('Stay near to help',p.x,p.y-139,12,'#ffdaa1');fx.lineStyle(3,0xffe7ab);fx.beginPath();fx.arc(p.x,p.y-55,22,-Math.PI/2,-Math.PI/2+Math.PI*2*h.revive/1.2);fx.strokePath();}
   });
   if(distance(...heroes)<4){const a=project(heroes[0].x,heroes[0].y,30),b=project(heroes[1].x,heroes[1].y,30);fx.lineStyle(2,0xffe5a0,.5);fx.beginPath();fx.moveTo(a.x,a.y);fx.lineTo(b.x,b.y);fx.strokePath();}
   if(m.expedition){this.drawExpedition();for(let i=this.labelIndex;i<this.textPool.length;i++)this.textPool[i].setVisible(false);return;}
   (m.stage===0?m.plates:m.stage===3?m.portalPlates:[]).forEach(plate=>{const v=project(plate.x,plate.y),on=heroes.some(h=>distance(h,plate)<.85),g=this.plates;this.glow(g,v.x,v.y,44,on?'#ffe69a':'#75d7cf');this.diamond(g,v.x,v.y-2,30,15,on?'#b3a05e':'#396b70',on?'#fff1ba':'#9ed7d6');this.label(on?'✓':'Stand here',v.x,v.y-25,12,on?'#fff4b2':'#add9dc');if(m.plateTime>0){g.lineStyle(3,0xfff0b3);g.beginPath();g.arc(v.x,v.y,30,-Math.PI/2,-Math.PI/2+Math.PI*2*m.plateTime/1.5);g.strokePath();}});
   [...m.bridge,...m.knots].forEach((n,i)=>{
    if(i<3&&m.stage===0||i>=3&&m.stage<2)return;const v=project(n.x,n.y),g=this.nodeGraphic(i,n.x+n.y);g.clear();
    if(i<3)this.label(['STOUGHTON','WISCAGO','LOS ANGELES'][i],v.x,v.y+29,12,'#d8dac1');
    if(n.done){if(i>=3){this.glow(g,v.x,v.y-18,50,'#ffe49c');this.block(g,v.x,v.y-15,12,6,15,'#c4b280','#687663','#48645d');this.diamond(g,v.x,v.y-29,10,8,'#ffe9a6','#fff7ce');this.label('Sheltered',v.x,v.y-51,12,'#ffe6a1');}return;}
    const blue=n.blue>0;this.glow(g,v.x,v.y-20,50,blue?'#82e7ff':'#ba9bed',.3);
    if(i<3){this.diamond(g,v.x,v.y-15,19,10,blue?'#337d9277':'#485b7344',blue?'#82e7ff':'#ba9bed');this.label(blue?'Gordon · KINDLE':'Eric · SKETCH',v.x,v.y-39,12,blue?'#ffe4a2':'#9ce8f5');}
    else{for(let k=0;k<3;k++)this.block(g,v.x+(k-1)*14,v.y-25+Math.sin(clock*2+i)*5-Math.abs(k-1)*6,11,5.5,16,blue?'#8ce8f4':'#b5a0d0',blue?'#447f95':'#635974',blue?'#326879':'#4b4261');this.label(blue?'KINDLE THE LIGHT':'STEADY THE STORM',v.x,v.y-62,12,blue?'#ffe6ae':'#cfc6eb');}
    if(blue){g.lineStyle(2,0x8eeeff);g.beginPath();g.arc(v.x,v.y-20,26,0,Math.PI*2*n.blue/9);g.strokePath();}
   });
   this.portal();
   m.wisps.forEach(w=>{if(m.knots[w.anchor].done)return;const p=project(w.x,w.y,28+Math.sin(clock*3+w.anchor)*5);this.glow(fx,p.x,p.y,30,'#b1a0fc');for(let j=0;j<3;j++){const a=clock*2+j*2.1;this.block(fx,p.x+Math.cos(a)*10,p.y+Math.sin(a)*5,7,3.5,9,'#b9a5e9','#705888','#59456e');}});
   m.pulses.forEach(q=>{const p=project(q.x,q.y,13);if(q.warn>0){fx.lineStyle(2,0xe5bcfb,.6);fx.strokeEllipse(p.x,p.y,64,32);}else{this.glow(fx,p.x,p.y,14,'#daa4ff');this.diamond(fx,p.x,p.y,6,3,'#eac9ff','#fff4ff');}});
   m.beams.forEach(b=>{const a=project(b.a.x,b.a.y,38),p=project(b.b.x,b.b.y,22);fx.lineStyle(8,color(b.color),.15);fx.lineBetween(a.x,a.y,p.x,p.y);fx.lineStyle(3,color(b.color),.9);fx.lineBetween(a.x,a.y,p.x,p.y);});
   for(let j=0;j<m.knots.filter(n=>n.done).length*5;j++){const p=project(12+Math.sin(j*8+clock*.35)*2,7+Math.cos(j*3+clock*.3)*1.2,32+Math.sin(clock+j)*12);this.glow(fx,p.x,p.y,10,'#ffe8ad');this.diamond(fx,p.x,p.y,3,2,'#fff1b9');}
   this.guide();for(let i=this.labelIndex;i<this.textPool.length;i++)this.textPool[i].setVisible(false);
  }
  drawExpedition(){
   const m=this.model,g=this.plates,fx=this.effects,t=this.elapsed;
   // Geometry is functional: target arrows, collision gates, route markers and
   // readable ability tells share the heroes' gold/cyan visual language.
   if(m.kind==='relay'||m.kind==='mirror'||m.kind==='echo')m.nodes.forEach((n,i)=>{
    const p=project(n.x,n.y),done=m.kind==='echo'?m.beat>i*2+1:n.done,active=m.kind!=='echo'||Math.floor(m.beat/2)===i;
    this.glow(g,p.x,p.y-20,45,done?'#ffe39a':n.blue>0?'#79e7fa':'#a999d5',active?.4:.12);
    this.block(g,p.x,p.y-12,18,9,16,done?'#e2c77e':'#728897','#334b61','#253e54');
    if(m.kind==='mirror'){
     const arrows=['↑','→','↓','←'];this.label(arrows[n.turn],p.x,p.y-38,30,n.turn===n.target?'#ffe29a':'#79e7fa');this.label('Aim '+arrows[n.target],p.x,p.y-67,13,'#ffe29a');
    }else this.label(done?'✓':m.kind==='echo'?String(i+1):'✦',p.x,p.y-33,24,done?'#ffe29a':'#a7e5f3');
    if(active&&!done)this.label(m.kind==='mirror'?'ERIC TURNS · GORDON LIGHTS':m.kind==='echo'?(m.beat%2===0?'ERIC · ANSWER':'GORDON · ANSWER'):n.blue>0?'GORDON · KINDLE':'ERIC · SKETCH',p.x,p.y+24,12,n.blue>0||m.beat%2?'#ffe29a':'#79e7fa');
   });
   if(m.kind==='gate'){
    const p=project(m.hold.x,m.hold.y),l=project(m.latch.x,m.latch.y);this.diamond(g,p.x,p.y,30,15,m.gateHeld?'#88d8ee':'#31677c','#b7f4ff');this.label(m.open?'OPEN FOR EVERYONE':'ERIC · HOLD HERE',p.x,p.y-32,12,'#b7f4ff');
    this.block(g,l.x,l.y-20,16,8,20,m.open?'#f2d382':'#877b91','#526778','#344957');this.label(m.open?'✓':'GORDON · OPEN',l.x,l.y-53,12,'#ffe29a');
   }
   if(m.kind==='escort'){
    for(let i=m.waypoint;i<m.trail.length;i++){const p=project(m.trail[i].x,m.trail[i].y);this.diamond(g,p.x,p.y,15,7,i===m.waypoint?'#d9ce91':'#779592','#fff1b5');this.label(String(i+1),p.x,p.y-14,12,'#ffe8ad');}
    const p=project(m.light.x,m.light.y,24+Math.sin(t*3)*5);this.glow(fx,p.x,p.y,38,'#ffe6a0',.6);this.diamond(fx,p.x,p.y,9,12,'#fff2ba','#ffffff');
    this.label(m.sheltered?'SAFE AT HOME':m.heroes.every(h=>distance(h,m.light)<4.3)?'WE’RE WITH YOU':'STAY CLOSE TO ME',p.x,p.y-32,12,'#fff0bd');
    if(m.ward>0){fx.lineStyle(2,0x79e7fa,.65);fx.strokeEllipse(p.x,p.y+24,120,60);}
   }
   const secret=project(m.secret.x,m.secret.y,15);if(m.secret.found)this.label('♡',secret.x,secret.y,28,'#ffe5ab');else if(m.heroes.some(h=>distance(h,m.secret)<5)){this.glow(g,secret.x,secret.y,25,'#ffe5ab',.3);this.label('♡',secret.x,secret.y,20,'#ffe5ab');this.label('A high-five here?',secret.x,secret.y+23,12,'#ffe5ab');}
   const exit=project(m.exit.x,m.exit.y);this.diamond(g,exit.x,exit.y,40,20,m.solved?'#c7a85a':'#496071','#ffe4a0');this.label(m.solved?'HOME · TOGETHER':'HOME',exit.x,exit.y-34,13,'#ffe8ae');
   m.pulses.forEach(q=>{const p=project(q.x,q.y,13);if(q.warn>0){fx.lineStyle(2,0xe5bcfb,.6);fx.strokeEllipse(p.x,p.y,60,30);}else{this.glow(fx,p.x,p.y,14,'#daa4ff');this.diamond(fx,p.x,p.y,6,3,'#eac9ff','#fff4ff');}});
   const n=m.target();if(n){const target=project(n.x,n.y,30),h=project(m.heroes[m.active].x,m.heroes[m.active].y,55),cam=this.cameras.main,view=cam.worldView;if(!Phaser.Geom.Rectangle.Contains(view,target.x,target.y)||target.y<view.top+195/cam.zoom){const a=Math.atan2(target.y-h.y,target.x-h.x),x=clamp(h.x+Math.cos(a)*130/cam.zoom,view.left+40/cam.zoom,view.right-40/cam.zoom),y=clamp(h.y+Math.sin(a)*110/cam.zoom,view.top+195/cam.zoom,view.bottom-170/cam.zoom);this.label('➜',x,y,24,'#ffe3a1').setRotation(a);}}
  }
  nodeGraphic(i,depth){if(!this.nodes[i])this.nodes[i]=this.add.graphics();return this.nodes[i].setDepth(depth);}
  portal(){const v=project(12,6.2),g=this.nodeGraphic(6,18.2),open=this.model.stage===3;g.clear();this.glow(g,v.x,v.y-65,120,open?'#be9eff':'#625f94',open?.7:.2);for(let j=0;j<6;j++)for(const side of[-1,1])this.block(g,v.x+side*34,v.y-j*17-8,10,5,17,'#877a98','#383e59','#282e47');for(let j=-2;j<=2;j++)this.block(g,v.x+j*15,v.y-103,10,5,15,j===0?'#ead395':'#837592','#493e63','#2d324d');if(open){g.fillGradientStyle(0xd2aaff,0x765cf3,0x75e0d2,0x765cf3,.65);g.fillRect(v.x-27,v.y-100,54,100);for(let j=0;j<12;j++){g.fillStyle(0xece0ff,.65);g.fillRect(v.x+Math.sin(j*8+this.elapsed)*23,v.y-(j*11+this.elapsed*15)%95,2,4);}}this.label('HOME',v.x,v.y-128,12,'#f2d795');}
  guide(){const m=this.model,cam=this.cameras.main;let n=m.stage===0?m.plates[0]:m.stage===1?m.bridge.find(n=>!n.done):m.stage===2?m.knots.filter(n=>!n.done).sort((a,b)=>distance(a,m.heroes[m.active])-distance(b,m.heroes[m.active]))[0]:m.portalPlates[0];if(!n||m.finished)return;const target=project(n.x,n.y,30),hero=project(m.heroes[m.active].x,m.heroes[m.active].y,55),view=cam.worldView,top=view.top+190/cam.zoom,bottom=view.bottom-170/cam.zoom;if(target.x>view.left+40/cam.zoom&&target.x<view.right-40/cam.zoom&&target.y>top&&target.y<bottom)return;const a=Math.atan2(target.y-hero.y,target.x-hero.x),x=clamp(hero.x+Math.cos(a)*140/cam.zoom,view.left+35/cam.zoom,view.right-35/cam.zoom),y=clamp(hero.y+Math.sin(a)*100/cam.zoom,top,bottom);this.label('➜',x,y,22,'#ffe4a0').setRotation(a);this.label('THIS WAY',x,y+24,12,'#f4e0b5');}
 }
 return new Phaser.Game({type:Phaser.AUTO,parent:'world',backgroundColor:'#061b2b',transparent:false,antialias:true,scale:{mode:Phaser.Scale.RESIZE,width:innerWidth,height:innerHeight},loader:{imageLoadType:'HTMLImageElement'},input:{keyboard:{capture:[]}},audio:{disableWebAudio:false},scene:[Backdrop,AdventureScene],callbacks:{postBoot:g=>{g.canvas.setAttribute('aria-label','The Light We Leave, a cooperative adventure starring Eric and Gordon');g.canvas.setAttribute('tabindex','0');}}});
}
