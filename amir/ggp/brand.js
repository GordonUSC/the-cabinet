/* Shared appearance preference. Load in head before styles to avoid a theme flash. */
(()=>{'use strict';
const key='ggp-brand-styling-v1',root=document.documentElement;
let enabled=true;
try{enabled=localStorage.getItem(key)!=='off'}catch{}
function apply(value){enabled=value;root.dataset.ggpBrand=value?'on':'off';
const button=document.getElementById('ggp-brand-switch');
if(button){button.setAttribute('aria-checked',String(value));button.querySelector('[data-brand-state]').textContent=value?'On':'Off';}}
apply(enabled);
document.addEventListener('DOMContentLoaded',()=>{
const control=document.createElement('aside');control.className='brand-control';control.setAttribute('aria-label','Site appearance');
control.innerHTML='<button type="button" id="ggp-brand-switch" role="switch" aria-label="GGP brand styling" aria-describedby="ggp-brand-help"><span class="brand-switch-track" aria-hidden="true"><i></i></span><span>GGP Brand <b data-brand-state></b></span></button><span id="ggp-brand-help" class="brand-sr-only">Switch between GGP brand colors and a neutral appearance across this site. Your content and saved choices stay the same.</span><span class="brand-sr-only" id="ggp-brand-status" role="status"></span>';
document.body.append(control);apply(enabled);
control.querySelector('button').addEventListener('click',()=>{apply(!enabled);let saved=true;try{localStorage.setItem(key,enabled?'on':'off')}catch{saved=false}document.getElementById('ggp-brand-status').textContent='GGP brand styling '+(enabled?'on':'off')+'. '+(saved?'Preference saved for this browser.':'Browser storage is unavailable; this choice lasts for this page.');});
});
window.addEventListener('storage',event=>{if(event.key===key||event.key===null)apply(event.newValue!=='off')});
})();
