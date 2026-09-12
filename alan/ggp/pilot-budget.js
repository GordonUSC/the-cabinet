'use strict';
(()=>{
 const key='ggp-pilot-capacity-v1', inputs=[...document.querySelectorAll('[data-budget]')], money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n);
 const result=document.getElementById('budget-result'), funding=document.getElementById('funding-result');
 try{const saved=JSON.parse(localStorage.getItem(key)||'{}');inputs.forEach(el=>{if(Object.hasOwn(saved,el.id))el.value=saved[el.id];});}catch{}
 function compute(){
  const v={},missing=[];inputs.forEach(el=>{const n=Number(el.value);v[el.id]=el.value.trim()!==''&&Number.isFinite(n)&&el.checkValidity()?n:null;if(v[el.id]===null&&el.id!=='budget-funds')missing.push(el.id);});
  if(missing.length)return{complete:false,missing};
  let setupLabor=0,monthlyLabor=0;for(let i=0;i<5;i++){setupLabor+=v[`budget-${i}-setup`]*v[`budget-${i}-rate`];monthlyLabor+=v[`budget-${i}-monthly`]*v[`budget-${i}-rate`];}
  const setup=setupLabor+v['budget-fixed'],monthly=monthlyLabor+v['budget-tools'],months=v['budget-months'],base=setup+monthly*months,reserve=base*v['budget-reserve']/100,total=base+reserve;
  return{complete:true,setup,monthly,months,base,reserve,total,usableFunds:v['budget-funds'],gap:v['budget-funds']===null?null:total-v['budget-funds']};
 }
 function render(save=false){const x=compute();if(save)try{localStorage.setItem(key,JSON.stringify(Object.fromEntries(inputs.map(el=>[el.id,el.value]))));}catch{}
  if(!x.complete){result.textContent=`Budget not estimated. ${x.missing.length} cost assumption${x.missing.length===1?' needs':'s need'} a valid value. Enter 0 only for an explicit zero.`;funding.textContent='Funding gap not calculated. Complete the cost assumptions and confirm usable funds with Joe.';return;}
  result.textContent=`One-time work and costs: ${money(x.setup)}. Recurring care: ${money(x.monthly)} per month. ${x.months}-month scenario: ${money(x.total)}. Calculation: ${money(x.setup)} + (${money(x.monthly)} × ${x.months}) + ${money(x.reserve)} contingency. This is a scenario, not an approved budget.`;
  funding.textContent=x.gap===null?'Funding gap unknown. Confirm available funds and restrictions separately from commitments or pending asks.':x.gap>0?`${money(x.gap)} still to cover in this scenario (${money(x.total)} cost minus ${money(x.usableFunds)} entered usable funds). Confirm restrictions and cash timing with Joe.`:`Entered usable funds cover this scenario, leaving ${money(-x.gap)}. This calculation does not approve spending or verify the funds.`;
 }
 inputs.forEach(el=>el.addEventListener('input',()=>render(true)));render();
 document.getElementById('budget-export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({kind:'GGP pilot capacity scenario',approval:'Unapproved planning assumptions',savedAt:new Date().toISOString(),inputs:Object.fromEntries(inputs.map(el=>[el.id,el.value])),calculation:compute()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ggp-pilot-capacity.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
})();
