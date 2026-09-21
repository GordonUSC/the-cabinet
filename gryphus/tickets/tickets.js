/* An honest local design preview; no checkout endpoint or payment data. */
(() => {
 'use strict';
 const KEY='gryphus-ticket-preview-v1';
 const $=sel=>document.querySelector(sel);
 const initial=()=>({pass:null,day:'saturday',people:1,stay:'later',spaces:1,step:1});
 const days={friday:'Friday, April 30, 2027',saturday:'Saturday, May 1, 2027',sunday:'Sunday, May 2, 2027'};
 const passNames={weekend:'Full weekend',day:'One day outdoors'};
 const stayNames={own:'Bring your own camp',ready:'A ready-made camp',offsite:'I’ll arrange my own stay',later:'Decide later'};
 const validQuantity=v=>Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=12;
 let state=initial();
 try {const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored&&['weekend','day',null].includes(stored.pass)&&Object.hasOwn(days,stored.day)&&Object.hasOwn(stayNames,stored.stay)&&validQuantity(stored.people)&&validQuantity(stored.spaces)){state={pass:stored.pass,day:stored.day,people:+stored.people,stay:stored.stay,spaces:+stored.spaces,step:[1,2,3].includes(stored.step)&&stored.pass?stored.step:1};}}catch{}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 const campSelected=()=>['own','ready'].includes(state.stay);
 const passDetail=()=>state.pass==='day'?days[state.day]:'April 30 to May 2, 2027';
 const stayDetail=()=>campSelected()?state.spaces+' proposed '+(state.spaces===1?'camping space':'camping spaces')+' · details unconfirmed':state.stay==='offsite'?'No accommodation selected in this preview':'Accommodation undecided';
 function summaryText(){return ['GRYPHUS 2027 · DESIGN PREVIEW','April 30 to May 2, 2027 · Flat Rock Ranch, Comfort, Texas','',state.pass?state.people+' × '+passNames[state.pass]+' (proposed)':'Pass format undecided',state.pass?passDetail():'',stayNames[state.stay]+' (preference)',stayDetail(),'','Pass prices, accommodation prices, taxes and fees: To be announced.','All formats, inclusions, capacities and eligibility require festival confirmation.','This is a personal planning summary, not an order, reservation or ticket. Nothing has been booked or charged.','Official festival updates: https://gryphusmusicfestival.com/'].filter((line,i,all)=>line||all[i-1]).join('\n');}
 function render(){
   document.querySelectorAll('[name="pass"]').forEach(el=>el.checked=el.value===state.pass);
   document.querySelectorAll('[name="stay"]').forEach(el=>el.checked=el.value===state.stay);
   $('#visit-day').value=state.day;$('#pass-quantity').value=state.people;$('#stay-quantity').value=state.spaces;
   $('#day-field').hidden=state.pass!=='day';$('#stay-quantity-field').hidden=!campSelected();
   document.querySelectorAll('[data-panel]').forEach(el=>el.hidden=+el.dataset.panel!==state.step);
   document.querySelectorAll('[data-step]').forEach(el=>{if(+el.dataset.step===state.step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
   document.querySelectorAll('[data-quantity]').forEach(el=>{const value=el.dataset.quantity==='pass'?state.people:state.spaces;el.disabled=+el.dataset.change<0?value===1:value===12;});
   $('#summary-items').innerHTML=`<div class="summary-item"><strong>${state.pass?state.people+' × '+passNames[state.pass]:'Your pass is still open'}</strong><span>${state.pass?passDetail():'Choose a proposed format to begin.'}</span>${state.pass?'<button type="button" data-edit="1">Edit pass</button>':''}</div><div class="summary-item"><strong>${stayNames[state.stay]}</strong><span>${stayDetail()}</span><button type="button" data-edit="2">Edit stay</button></div>`;
   $('#review-items').innerHTML=state.pass?`<div class="review-item"><div><span class="proposed">PROPOSED PASS</span><h3>${state.people} × ${passNames[state.pass]}</h3><p>${passDetail()}</p><p>Price and inclusions: To be announced</p></div><button type="button" data-edit="1">Edit</button></div><div class="review-item"><div><span class="proposed">${campSelected()?'PROPOSED ACCOMMODATION':'STAY PREFERENCE'}</span><h3>${stayNames[state.stay]}</h3><p>${stayDetail()}</p>${campSelected()?'<p>Price and inclusions: To be announced</p>':''}</div><button type="button" data-edit="2">Edit</button></div>`:'';
   save();
 }
 function go(step,focus=true){if(step>1&&!state.pass){state.step=1;render();$('#pass-error').textContent='Choose a proposed pass format to continue.';$('[name="pass"]').focus();return;}state.step=step;$('#pass-error').textContent='';$('#journey-status').textContent='';$('#copy-fallback').hidden=true;render();if(focus){const title=$(`[data-panel="${step}"] h2`);title.focus({preventScroll:true});$('#journey').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}
 function quantity(kind,value){const field=kind==='pass'?'people':'spaces';const parsed=Number(value);state[field]=Math.max(1,Math.min(12,Number.isFinite(parsed)?Math.round(parsed):1));render();}
 document.addEventListener('change',event=>{const el=event.target;if(el.name==='pass'){state.pass=el.value;$('#pass-error').textContent='';render();}else if(el.name==='stay'){state.stay=el.value;render();}else if(el.id==='visit-day'){state.day=el.value;render();}else if(el.id==='pass-quantity')quantity('pass',el.value);else if(el.id==='stay-quantity')quantity('stay',el.value);});
 document.addEventListener('click',event=>{const quantityButton=event.target.closest('[data-quantity]');if(quantityButton){const kind=quantityButton.dataset.quantity;quantity(kind,(kind==='pass'?state.people:state.spaces)+(+quantityButton.dataset.change));return;}const stepButton=event.target.closest('[data-next],[data-back],[data-step],[data-edit]');if(stepButton)go(+(stepButton.dataset.next||stepButton.dataset.back||stepButton.dataset.step||stepButton.dataset.edit));});
 $('#reset-choices').addEventListener('click',()=>{state=initial();go(1);$('#journey-status').textContent='Choices reset. Start wherever the weekend takes you.';});
 $('#copy-choices').addEventListener('click',async()=>{const text=summaryText();try{await navigator.clipboard.writeText(text);$('#journey-status').textContent='Choices copied. Nothing was booked or sent.';}catch{$('#copy-fallback').hidden=false;$('#copy-text').value=text;$('#copy-text').focus();$('#copy-text').select();$('#journey-status').textContent='Your choices are ready to select and copy below.';}});
 $('#download-choices').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([summaryText()],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Gryphus-2027-my-ideas.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#journey-status').textContent='Text copy prepared. Nothing was booked or sent.';});
 window.GryphusTicketPreview=Object.freeze({getState:()=>({...state}),summaryText});
 render();
})();
