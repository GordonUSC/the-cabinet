'use strict';
const dirs={'field-guide':'Field Guide','high-ground':'High Ground',basecamp:'Basecamp',mix:'A mix of the directions'};
const $=s=>document.querySelector(s), params=new URLSearchParams(location.search);
let remembered={};try{remembered=JSON.parse(localStorage.getItem('gryphus-design-review')||'{}')}catch{}
// Older Darby feedback used logo for the raster A/B studies. Keep it independent.
if(!remembered.legacyMark&&(['a','b','keep'].includes(remembered.logo)||(remembered.logo==='mix'&&Array.isArray(remembered.ideas)&&!('look' in remembered)))){remembered.legacyMark=remembered.logo;remembered.logo='undecided'}
let preview=dirs[params.get('direction')]&&params.get('direction')!=='mix'?params.get('direction'):(remembered.preview||'field-guide');
if(!dirs[preview]||preview==='mix')preview='field-guide';
const controls={direction:$('#chosen'),merch:$('#merch-choice'),look:$('#look-choice'),logo:$('#logo-choice'),legacyMark:$('#legacy-mark-choice')};
function accept(field,value){if(value&&[...controls[field].options].some(o=>o.value===value))controls[field].value=value}
for(const field of Object.keys(controls))accept(field,(field==='direction'?params.get('website')||params.get('direction'):params.get(field))||remembered[field]);
$('#note').value=remembered.note||'';
const ideaInputs=[...document.querySelectorAll('input[name=idea]')];
for(const input of ideaInputs)input.checked=Array.isArray(remembered.ideas)&&remembered.ideas.includes(input.value);
function ideaPicks(){return ideaInputs.filter(input=>input.checked).map(input=>input.value)}
function previewURL(){const q=new URLSearchParams({direction:preview});if(!['undecided','mix'].includes(controls.look.value))q.set('look',controls.look.value);if(!['undecided','mix'].includes(controls.logo.value))q.set('logo',controls.logo.value);return '../?'+q}
function updatePreview(){const url=previewURL();if($('#site-preview').getAttribute('src')!==url)$('#site-preview').src=url;$('#site-preview').title='Interactive '+dirs[preview]+' design preview';$('#open-full').href=url;$('#preview-name').textContent=dirs[preview]}
function message(){const root=(location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname))?'https://gordonusc.github.io/the-cabinet/gryphus/':new URL('../',location.href).href;return 'Gryphus 2027 design feedback\n\nWebsite: '+dirs[controls.direction.value]+'\nOutdoor collection: '+controls.look.selectedOptions[0].text+'\nLogo: '+controls.logo.selectedOptions[0].text+'\nOriginal merchandise collection: '+controls.merch.selectedOptions[0].text+'\nEarlier mark study (separate): '+controls.legacyMark.selectedOptions[0].text+(ideaPicks().length?'\nIdeas worth pursuing:\n'+ideaPicks().map(v=>'  - '+v).join('\n'):'')+'\n\n'+($('#note').value.trim()||'I like this direction. Let’s keep developing it.')+'\n\nPreview: '+root+previewURL().slice(3)}
function updateEmail(){$('#email-feedback').href='mailto:gbellamy@gmail.com?subject='+encodeURIComponent('Gryphus design feedback')+'&body='+encodeURIComponent(message())}
function persist(){const url=new URL(location.href);url.searchParams.set('direction',preview);url.searchParams.set('website',controls.direction.value);for(const key of ['merch','look','logo'])url.searchParams.set(key,controls[key].value);history.replaceState(null,'',url);const state={preview,note:$('#note').value,ideas:ideaPicks()};for(const key of Object.keys(controls))state[key]=controls[key].value;try{localStorage.setItem('gryphus-design-review',JSON.stringify(state))}catch{$('#feedback-status').textContent='This browser could not save your choices. Download or copy your feedback to keep it.'}updateEmail()}
function syncMerch(){document.querySelectorAll('[data-merch]').forEach(b=>{const yes=b.dataset.merch===controls.merch.value;b.setAttribute('aria-pressed',yes);b.classList.toggle('selected',yes);b.querySelector('strong').textContent=yes?'Selected ✓':'Choose this collection ↗'})}
function select(d,restoreMix=false){if(!dirs[d]||d==='mix')return;preview=d;document.querySelectorAll('.choice').forEach(b=>{const yes=b.dataset.direction===d;b.classList.toggle('selected',yes);b.setAttribute('aria-pressed',yes);b.querySelector('.choice-check').textContent=yes?'✓':'↗'});$('#choose').innerHTML='Choose '+dirs[d]+' <span>↓</span>';if(!restoreMix)controls.direction.value=d;const url=new URL(location.href);url.searchParams.set('direction',d);history.replaceState(null,'',url);updatePreview();persist()}
document.querySelectorAll('.choice').forEach(b=>b.onclick=()=>select(b.dataset.direction));
controls.direction.onchange=()=>{if(controls.direction.value!=='mix')select(controls.direction.value);persist()};
controls.legacyMark.onchange=persist;for(const input of ideaInputs)input.onchange=persist;
$('#note').oninput=persist;controls.merch.onchange=()=>{persist();syncMerch()};
for(const kind of ['look','logo']){controls[kind].onchange=()=>{persist();updatePreview();window.dispatchEvent(new CustomEvent('gryphus-'+kind+'-select',{detail:{id:controls[kind].value}}))};window.addEventListener('gryphus-'+kind+'-change',e=>{accept(kind,e.detail.id);persist();updatePreview()})}
document.querySelectorAll('[data-merch]').forEach(b=>b.onclick=()=>{controls.merch.value=b.dataset.merch;persist();syncMerch();$('#feedback-status').textContent='Merchandise choice saved. Add any thoughts, then copy or email your feedback.'});
function download(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([message()],{type:'text/plain;charset=utf-8'}));a.download='Gryphus-design-feedback.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);$('#feedback-status').textContent='Your feedback copy has been downloaded.'}
$('#download-review').onclick=download;$('#feedback-form').onsubmit=async e=>{e.preventDefault();try{await navigator.clipboard.writeText(message());$('#feedback-status').textContent='Copied. Paste your reply to Gordon, or use Email to Gordon.'}catch{download()}};
select(preview,controls.direction.value==='mix');syncMerch();updateEmail();

// Legacy deep links open the optional section instead of landing in hidden content.
function revealExplorations(){if(['#mark','#ideas'].includes(location.hash)){const extra=$('#more-explorations');extra.open=true;requestAnimationFrame(()=>document.querySelector(location.hash)?.scrollIntoView({block:'start'}))}}
revealExplorations();window.addEventListener('hashchange',revealExplorations);
