/* Original New Wave illustrations. Stylized cast based on Gordon’s confirmed plans; illustrations are not likenesses. */
(()=>{'use strict';
const covers={
 sincity:{action:'A ball passed. A cheer returned. Five friends in our corner.',scene:'court',pose:'pass',shirt:'#ef789c',other:'#97d7dc',sky:'#ffd799',floor:'#485b85'},
 blizzcon:{action:'Trading a controller. Sharing the adventure.',scene:'arcade',pose:'pass',shirt:'#f26b71',other:'#ffc857',sky:'#98cffa',floor:'#214681'},
 comedy:{action:'Two friends, absolutely losing it laughing.',scene:'theatre',pose:'laugh',shirt:'#ed6484',other:'#f5c84b',sky:'#ffbe86',floor:'#783c67'},
 portola:{action:'Trading dance moves by the waterfront.',scene:'waterfront',pose:'dance',shirt:'#fb7658',other:'#fff0a4',sky:'#bfbcff',floor:'#34396f'},
 foundry:{action:'A little call-and-response on the dancefloor.',scene:'club',pose:'groove',shirt:'#a8edd3',other:'#fa9781',sky:'#ef9bc8',floor:'#443167'},
 zeds:{action:'Catching the bass drop together.',scene:'bass',pose:'bounce',shirt:'#ffbc63',other:'#e990c9',sky:'#87d8cf',floor:'#28556c'},
 niteharts:{action:'Taking turns leading the next dance move.',scene:'heart',pose:'twirl',shirt:'#e7eb8e',other:'#ff8b94',sky:'#b5a4f2',floor:'#423870'},
 latenite:{action:'One last shoulder shimmy under the moon.',scene:'moon',pose:'shimmy',shirt:'#ec8d92',other:'#c7efb5',sky:'#bad2f1',floor:'#263758'},
 pokemon:{action:'Comparing our imaginary concert companions.',scene:'play',pose:'point',shirt:'#8dd7dc',other:'#e77ca7',sky:'#ffdf77',floor:'#50698a'},
 pride:{action:'A welcome, a wave, and a whole lot of color.',scene:'pride',pose:'wave',shirt:'#f6c94d',other:'#98e4d7',sky:'#f0acd4',floor:'#785784'},
 summit:{action:'Hands up. Sharing the big-room moment.',scene:'stadium',pose:'hands',shirt:'#fd8a76',other:'#e8c2ff',sky:'#8cdce0',floor:'#2c546b'},
 stevie:{action:'Clapping along. Letting a song bring us together.',scene:'keys',pose:'clap',shirt:'#897bce',other:'#fa978c',sky:'#ffd47b',floor:'#664164'},
 countdown:{action:'A midnight high-five for the next chapter.',scene:'clock',pose:'highfive',shirt:'#94e4d6',other:'#ffbf73',sky:'#bbaaf5',floor:'#3b3868'},
 gryphus:{action:'Pointing out a new possibility on the horizon.',scene:'hills',pose:'horizon',shirt:'#ffd178',other:'#b2aceb',sky:'#b8d9c3',floor:'#366963'},
 edc:{action:'A shared sunrise. Still dancing.',scene:'sunrise',pose:'sway',shirt:'#a7dbde',other:'#ef8197',sky:'#ffb78c',floor:'#665477'},
 shambhala:{action:'Following the forest rhythm, side by side.',scene:'forest',pose:'step',shirt:'#ed8cac',other:'#ffd17f',sky:'#c2dd92',floor:'#3e6861'},
 olympics:{action:'Cheering the rally. Celebrating together.',scene:'rally',pose:'cheer',shirt:'#d999c8',other:'#ffc65f',sky:'#b5e4b7',floor:'#396779'}
};

const casts={
 sincity:{names:['Gordon','Joe','Matt Kaplan','Andrew Ketchum','Casey Reed'],note:'Our Sin City crew. Playing and cheering roles are still to arrange.'},
 blizzcon:{names:['Gordon','Alex Rogers'],note:'A shared BlizzCon memory.'},
 comedy:{names:['Gordon','Joe'],note:'Our theatre night.'},
 portola:{names:['Gordon','Brennan'],note:'Saturday together. David is hosting the trip.'},
 foundry:{names:['Gordon'],note:'Companions still open; no meetup agreed.'},
 zeds:{names:['Gordon'],solo:true,note:'A solo journey. Your rhythm, your night.'},
 niteharts:{names:['Gordon','Brennan','Kelly','Kara'],note:'The festival four. Quinn and Caryn are hosting.'},
 latenite:{names:['Gordon','Brennan','Kelly','Kara','Quinn'],note:'Five named friends. Sixth admission not yet assigned.'},
 pokemon:{names:['Gordon','Brennan','Kelly','Kara'],note:'Our ticket group. Eric Hulsey and Ty are a separate meetup.'},
 pride:{names:['Gordon','Mason','Joe','Alex Rogers'],note:'Our Pride crew. Shannon is hosting; Myke is not yet confirmed.'},
 summit:{names:['Gordon'],note:'Two extra tickets; companions still open.'},
 stevie:{names:['Gordon'],solo:true,note:'A solo journey. A little space to feel everything.'},
 countdown:{names:['Gordon','Joe'],note:'Our shared New Year tradition.'},
 gryphus:{names:['Gordon'],note:'April 28–May 3 is on your calendar. Companions still open.'},
 edc:{names:['Gordon'],note:'Dawn crew still open. Foster is interested; David and Trent chose Dusk.'},
 shambhala:{names:['Gordon','Drake','Mel','David','Trent','Mason','Myke','Jacob'],note:'All eight are going. Our Farmily, together.',full:['Gordon','Drake','Mel','David Vermillion','Trent','Mason','Myke Bailey','Jacob Ferrufino']},
 olympics:{names:['Gordon','Foster'],note:'Three sessions together. One birthday chapter.'}
};
covers.zeds.action='One dancer. A whole world of bass.';
covers.stevie.action='Just you, the songs, and everything they bring back.';
covers.shambhala.action='Eight friends. One forest. So many ways to find our joy.';
const palette=['#ed8cac','#ffd17f','#a4dce3','#c4b1eb','#f28e71','#b9dd94','#ffd9b0','#97c8c1'];

const ink='#182b40';const poses={
 dance:{a:[[-26,-18],[-62,-43],[-51,-86]],b:[[27,-18],[65,0],[87,-24]],legs:[[-13,45],[-38,82],[-62,111],[13,45],[44,69],[28,106]]},
 groove:{a:[[-26,-18],[-49,8],[-65,-9]],b:[[27,-18],[54,-42],[74,-34]],legs:[[-13,45],[-28,76],[-48,110],[13,45],[31,81],[57,110]]},
 bounce:{a:[[-26,-18],[-67,-35],[-68,-69]],b:[[27,-18],[59,-34],[72,-69]],legs:[[-13,45],[-37,78],[-51,106],[13,45],[42,79],[54,106]]},
 twirl:{a:[[-26,-18],[-51,-58],[-29,-91]],b:[[27,-18],[63,-49],[80,-75]],legs:[[-13,45],[-27,78],[-33,111],[13,45],[46,57],[59,85]]},
 shimmy:{a:[[-26,-18],[-49,-36],[-68,-14]],b:[[27,-18],[46,10],[63,-15]],legs:[[-13,45],[-27,81],[-40,111],[13,45],[34,77],[21,110]]},
 point:{a:[[-26,-18],[-42,13],[-15,29]],b:[[27,-18],[62,-42],[99,-61]],legs:[[-13,45],[-22,80],[-24,112],[13,45],[29,77],[48,112]]},
 wave:{a:[[-26,-18],[-56,-40],[-64,-82]],b:[[27,-18],[59,-39],[60,-81]],legs:[[-13,45],[-31,79],[-45,110],[13,45],[21,80],[37,111]]},
 hands:{a:[[-26,-18],[-48,-57],[-35,-98]],b:[[27,-18],[54,-55],[49,-100]],legs:[[-13,45],[-27,78],[-41,110],[13,45],[29,79],[45,110]]},
 clap:{a:[[-26,-18],[-37,13],[34,-35]],b:[[27,-18],[48,-13],[37,-41]],legs:[[-13,45],[-18,80],[-20,110],[13,45],[29,78],[49,110]]},
 highfive:{a:[[-26,-18],[-47,11],[-30,24]],b:[[27,-18],[57,-48],[80,-82]],legs:[[-13,45],[-26,80],[-44,111],[13,45],[34,79],[44,110]]},
 horizon:{a:[[-26,-18],[-42,10],[-21,23]],b:[[27,-18],[59,-53],[83,-84]],legs:[[-13,45],[-29,80],[-38,111],[13,45],[30,80],[45,111]]},
 sway:{a:[[-26,-18],[-56,-30],[-68,-57]],b:[[27,-18],[65,-20],[86,-54]],legs:[[-13,45],[-33,76],[-35,111],[13,45],[28,77],[52,108]]},
 step:{a:[[-26,-18],[-52,7],[-68,-11]],b:[[27,-18],[48,-37],[68,-21]],legs:[[-13,45],[-34,76],[-49,111],[13,45],[47,57],[56,84]]},
 cheer:{a:[[-26,-18],[-49,-45],[-51,-84]],b:[[27,-18],[54,-51],[64,-89]],legs:[[-13,45],[-31,78],[-47,111],[13,45],[32,78],[52,111]]},
 pass:{a:[[-26,-18],[-43,13],[-16,31]],b:[[27,-18],[61,2],[89,0]],legs:[[-13,45],[-19,80],[-22,111],[13,45],[35,80],[49,111]]},
 laugh:{a:[[-26,-18],[-45,10],[3,22]],b:[[27,-18],[48,-20],[35,-53]],legs:[[-13,45],[-44,57],[-43,109],[13,45],[52,65],[52,110]]}
};
const path=pts=>pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
function limb(points,color,width){const d=path(points);return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${width+5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;}
function person(x,flip,c,i){const p=poses[c.pose],skin=i?['#d49b80','#dbab91','#b78067','#e4b39a'][i%4]:'#ae705b',pants=i%2?'#4c8e94':'#7866ae',shirt=i?c.other:c.shirt;const legs=p.legs;
return `<g transform="translate(${x} 164) scale(${flip} 1)"><g class="cover-person cp-${i}" style="--cast-delay:${i*.12}s">
${limb(legs.slice(0,3),pants,22)}${limb(legs.slice(3),pants,22)}
<path d="M${legs[2][0]-8} ${legs[2][1]}h25M${legs[5][0]-8} ${legs[5][1]}h25" stroke="${ink}" stroke-width="12" stroke-linecap="round"/>
<path d="M-27 -24 Q0 -37 28 -24 L25 48 Q0 57 -26 45Z" fill="${shirt}" stroke="${ink}" stroke-width="4"/>
<path d="M-4 -30V-45" stroke="${skin}" stroke-width="18"/>
${limb(p.a,skin,13)}${limb(p.b,skin,13)}
<ellipse cx="2" cy="-67" rx="23" ry="27" fill="${skin}" stroke="${ink}" stroke-width="3.5"/>
<path d="M-20 -71Q-28 -104 6 -99Q27 -97 26 -77Q9 -83 -1 -87L-18 -75Z" fill="${ink}"/>
<path d="M2 -69q4 -4 8 0m7 0q3 -3 5 0" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>
<path d="M5 -57q9 12 17 -1" fill="#fff2da" stroke="${ink}" stroke-width="2.2"/>
<path d="M-14 -15l22 6-7 16-20-7Z" fill="#fff4dd" opacity=".55"/>
</g></g>`;}
function setting(c){const sun='<circle cx="460" cy="79" r="68" fill="#ffe5a4"/>';const star=(x,y,s=1)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0-20L6-6 21 0 6 7 0 22-6 7-21 0-6-6Z" fill="#fff0b6" stroke="${ink}" stroke-width="2"/>`;
const backdrop={
 court:`<path d="M58 261L155 100H485L582 261ZM105 186H535M320 100V280" fill="none" stroke="#fff4d7" stroke-width="5"/><circle cx="320" cy="63" r="34" fill="#ef6c89" stroke="${ink}" stroke-width="4"/><path d="M291 49Q334 39 344 84M288 74Q318 82 340 41" fill="none" stroke="#fff2ca" stroke-width="3"/>`,
 waterfront:`${sun}<path d="M0 196H640M0 217H640M0 240H640" stroke="#fff6d2" stroke-width="3" opacity=".65"/><path d="M70 120V55h80v19M118 55v48m395 8V49h74v22m-36-22v46" fill="none" stroke="${ink}" stroke-width="6"/>`,
 theatre:'<path d="M0 0H125Q70 80 78 220H0Zm640 0H515Q575 80 562 220H640Z" fill="#c34670"/><path d="M32 0L40 195M70 0L62 155m545-155-7 195m-37-195 7 155" stroke="#f8a698" stroke-width="4"/><rect x="161" y="198" width="98" height="20" rx="8" fill="#ae426f"/><rect x="377" y="198" width="98" height="20" rx="8" fill="#ae426f"/>',
 club:`<circle cx="320" cy="45" r="35" fill="#f6e8b6" stroke="${ink}" stroke-width="4"/><path d="M285 45h70m-35-35v70m-27-51h54m-54 32h54" stroke="${ink}" stroke-width="2"/>${star(90,98)}${star(549,87,.7)}`,
 bass:`<g fill="#243d52" stroke="#ffe5b0" stroke-width="3"><rect x="41" y="50" width="77" height="166" rx="4"/><rect x="523" y="50" width="77" height="166" rx="4"/><circle cx="79" cy="160" r="28"/><circle cx="561" cy="160" r="28"/><circle cx="79" cy="83" r="16"/><circle cx="561" cy="83" r="16"/></g><path d="M135 98q48-43 98 0m173 0q48-43 98 0" fill="none" stroke="#fff3c6" stroke-width="7"/>`,
 heart:`<path d="M320 102C201 35 280-21 320 26C367-22 440 34 320 102Z" fill="#ef749a" stroke="${ink}" stroke-width="4"/>${star(97,117)}${star(543,112)}`,
 moon:`<path d="M364 15A66 66 0 1 0 415 104A62 62 0 0 1 364 15" fill="#ffe3a5"/>${star(99,82,.6)}${star(539,49,.45)}`,
 play:`<ellipse cx="320" cy="57" rx="40" ry="31" fill="#ed93bf" stroke="${ink}" stroke-width="4"/><path d="M285 41l-18-26 31 14m43 3 22-20-4 35" fill="#ed93bf" stroke="${ink}" stroke-width="4"/><circle cx="310" cy="54" r="3"/><circle cx="330" cy="54" r="3"/>${star(90,109)}${star(550,101)}`,
 pride:['#ed6d7c','#ffb770','#efdf72','#9cd7b6','#8ebcde','#ac8dcc'].map((v,i)=>`<path d="M${115+i*22} 196a${205-i*22} ${178-i*20} 0 0 1 ${410-i*44} 0" fill="none" stroke="${v}" stroke-width="23"/>`).join(''),
 stadium:`<path d="M36 152Q320-54 604 152" fill="none" stroke="${ink}" stroke-width="17"/><path d="M50 137Q320-20 590 137" fill="none" stroke="#fff1b9" stroke-width="6"/>${star(320,73,1.3)}`,
 keys:`<g transform="translate(218 16) rotate(-8 100 30)"><rect width="205" height="59" fill="#fff5dc" stroke="${ink}" stroke-width="4"/>${[25,50,75,100,125,150,175].map(x=>`<path d="M${x} 0v59" stroke="${ink}" stroke-width="2"/>`).join('')}${[18,43,93,118,143].map(x=>`<rect x="${x}" width="14" height="35" fill="${ink}"/>`).join('')}</g>`,
 clock:`<circle cx="320" cy="56" r="44" fill="#ffeabb" stroke="${ink}" stroke-width="4"/><path d="M320 20v37l-16-20" stroke="${ink}" stroke-width="5" fill="none"/>${star(91,97)}${star(549,97)}`,
 hills:`${sun}<path d="M0 210L113 95 245 210 390 118 640 215" fill="#7ba386"/><path d="M0 239L178 163 320 231 503 148 640 215V300H0Z" fill="#567e72"/>`,
 sunrise:'<circle cx="320" cy="134" r="97" fill="#ffeab0"/><path d="M320 12V0m-112 34-24-21m248 21 24-21m-281 78-33-5m323 5 33-5" stroke="#fff4d4" stroke-width="7"/>',
 forest:`<path d="M40 236V25m45 222V1m470 246V8m49 226V27" stroke="#355b53" stroke-width="18"/><path d="M40 51L6 124h69Zm45-42L36 112h99Zm470 6-45 104h90Zm49 32-41 87h76Z" fill="#5e8b68"/><path d="M90 48Q320 110 550 48" fill="none" stroke="${ink}" stroke-width="2"/>${[135,227,319,411,503].map((x,i)=>`<circle cx="${x}" cy="${70+[0,13,17,13,0][i]}" r="7" fill="#ffe59e"/>`).join('')}`,
 rally:`<path d="M0 103H640M0 138H640" stroke="#eef8d1" stroke-width="5"/><ellipse cx="320" cy="183" rx="115" ry="22" fill="#7baaca" stroke="${ink}" stroke-width="3"/><path d="M320 157v51m-106-32h211" stroke="#f6f1d5" stroke-width="3"/><circle cx="345" cy="139" r="7" fill="#fff5dc"/>`,
 arcade:`<rect x="269" y="12" width="102" height="71" rx="8" fill="#203b5a" stroke="#fceac5" stroke-width="5"/><path d="M279 73l19-28 22 13 17-24 24 39" fill="#df96cd"/><rect x="284" y="154" width="72" height="34" rx="17" fill="#f9db9c" stroke="${ink}" stroke-width="3"/><path d="M304 162v17m-8-9h16" stroke="${ink}" stroke-width="3"/><circle cx="338" cy="167" r="3"/>`
};return backdrop[c.scene]||sun;}
const art=document.querySelector('.posterart');art.removeAttribute('aria-hidden');art.classList.add('cover-art');art.setAttribute('role','img');const caption=document.createElement('p');caption.className='cover-action';caption.id='cover-action';art.after(caption);const replay=document.createElement('button');replay.id='cover-replay';replay.className='cover-replay';replay.textContent='↻ Animate this cover';replay.setAttribute('aria-describedby','cover-action');caption.after(replay);let previous='',timer;
function animate(){clearTimeout(timer);art.classList.remove('cover-moving');if(!matchMedia('(prefers-reduced-motion: reduce)').matches){void art.offsetWidth;art.classList.add('cover-moving');timer=setTimeout(()=>art.classList.remove('cover-moving'),3600);}}
replay.onclick=animate;
function ensemble(c,cast){
 const n=cast.names.length;
 if(n===1)return `<ellipse cx="320" cy="277" rx="80" ry="10" fill="${ink}" opacity=".18"/>${person(320,1,c,0)}`;
 if(n===2)return person(c.pose==='highfive'?240:218,1,c,0)+person(c.pose==='highfive'?400:422,-1,c,1);
 const placements=n===8?[[130,28,.55],[253,17,.55],[376,17,.55],[499,28,.55],[98,103,.65],[246,97,.65],[394,97,.65],[542,103,.65]]:Array.from({length:n},(_,i)=>[95+i*(450/(n-1)),58+(i%2)*15,n===5?.67:.76]);
 return placements.map(([x,y,scale],i)=>`<g transform="translate(${x} ${y}) scale(${scale})" data-cast-member="${cast.names[i]}">${person(0,i%2?-1:1,{...c,shirt:palette[i],other:palette[i],pose:i%3===0?'wave':c.pose},i)}</g>`).join('');
}
const instrumentTitle=document.querySelector('#night-instrument h2'),instrumentIntro=instrumentTitle.nextElementSibling;const ensembleTitle=instrumentTitle.innerHTML,ensembleIntro=instrumentIntro.textContent;
const instrumentEdge=document.querySelector('#night-instrument .eyebrow');const ensembleEdge=instrumentEdge.textContent;
const instrumentFoot=[...document.querySelectorAll('#night-instrument p')].find(p=>p.textContent.includes('One phone, two people'));const ensembleFoot=instrumentFoot?.textContent;
const sparkLegend=[...document.querySelectorAll('#night-instrument legend')].find(p=>p.textContent.includes('Pass it on'));const ensembleLegend=sparkLegend?.textContent;
const castLine=document.createElement('div');castLine.className='cover-cast';caption.after(castLine);
function render(){const c=covers[selected.id],cast=casts[selected.id];if(!c||!cast)return;const key=selected.id;if(key===previous)return;previous=key;art.dataset.scene=c.scene;art.dataset.pose=c.pose;art.dataset.castCount=cast.names.length;art.dataset.solo=!!cast.solo;
 art.setAttribute('aria-label',c.action+' Featuring '+(cast.full||cast.names).join(', ')+'. Stylized illustration, not portraits.');caption.textContent=c.action;
 instrumentTitle.innerHTML=cast.solo?'My rhythm.<br>My spark.<br><em>My night.</em>':ensembleTitle;instrumentIntro.textContent=cast.solo?'Choose your heartbeat. Add a little surprise. Make something just for you.':ensembleIntro;
 instrumentEdge.textContent=cast.solo?'04 / MAKE SOMETHING JUST FOR YOU.':ensembleEdge;if(instrumentFoot)instrumentFoot.textContent=cast.solo?ensembleFoot.replace('One phone, two people, no wrong notes.','Your phone, your sound, no wrong notes.'):ensembleFoot;if(sparkLegend)sparkLegend.textContent=cast.solo?'02 · Follow your curiosity. Add a spark.':ensembleLegend;
 castLine.replaceChildren();const title=document.createElement('strong');title.className='cast-title';title.textContent=cast.solo?'SOLO JOURNEY':cast.names.length===8?'THE FARMILY · ALL EIGHT':cast.names.length>1?cast.names.length+' OF US':'YOUR NEXT CHAPTER';castLine.append(title);
 const names=document.createElement('div');names.className='cast-names';(cast.full||cast.names).forEach((name,i)=>{const chip=document.createElement('span');chip.textContent=name;chip.style.setProperty('--cast-color',palette[i%8]);names.append(chip)});const note=document.createElement('p');note.textContent=cast.note;castLine.append(names,note);
 art.innerHTML=`<svg class="cover-illustration" viewBox="0 0 640 300" aria-hidden="true"><rect width="640" height="300" fill="${c.sky}"/>${setting(c)}<path d="M0 266Q320 226 640 266V300H0Z" fill="${c.floor}"/>${ensemble(c,cast)}</svg>`;animate();}

const previousConnected=connected;connected=function(){previousConnected();render();};render();document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(timer);art.classList.remove('cover-moving')}});
})();
