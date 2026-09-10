(()=>{'use strict';
const definitions={
'Scholarship support':'A source names support for scholarships. It does not necessarily disclose the amount, payment date, or whether support continues today.',
'Partnership':'Organizations publicly describe working together. This may involve mentoring, access, services or funding; partnership alone does not prove a cash grant.',
'Support acknowledgment':'A public source thanks or names a supporter. The specific amount or form of support may not be disclosed.',
'Giving tier':'A published range such as $50K+. It identifies a recognition bracket, not an exact gift, and may include different forms of support.',
'Educational support':'A source identifies help for an educational program. Unless specified, it does not establish the amount or whether the help was cash, equipment or staff time.',
'Historical grant':'A source describes a past grant. The award may be old or undated; it is not evidence of current funding or an open application.',
'Public creative-work example':'A publicly available piece of work by a participant. It illustrates what they made; it does not prove the program caused their success.',
'2026 program-reported participation · report summarized in this review':'Attendance or participation reported by the program for 2026 and summarized here. This is not an independently audited result or a job-placement measure.',
'Provider-reported cumulative outcome':'A result reported by the organization across a period of time. Check the dates, population and method; it is not independent verification or a forecast.',
'Provider-reported cumulative reach':'The organization’s reported total audience or participation over time. Reach does not by itself demonstrate learning, completion or employment.',
'No results source compiled':'This listing does not yet include a results source. That is a gap in our research, not proof that the program has no results.',
'Nonprofit filing index':'A collection of an organization’s tax filings. We located the index; we have not audited every return or extracted every grant.',
'Nonprofit official records':'Records or filing links published by the nonprofit itself. They cover the legal organization unless explicitly limited to a program.',
'Fiscal sponsor records':'Records of the organization that legally receives or administers funds for a sponsored project. Its total finances can include many projects.',
'University financial reports':'University-wide financial statements or tax documents. They usually do not isolate a particular course, lab or scholarship budget.',
'University filing index':'A collection of the university’s tax returns. University totals must not be used as this program’s budget.',
'Corporate filing':'A company’s public financial disclosure, such as a Form 10-K. It is not a charitable tax return and usually does not disclose a specific program’s budget.',
'Company / program source':'An official company or program page identifying the operator. Separate public financial statements were not established in this review.',
'Legal identity unresolved':'We have not yet verified the legal entity or filing identity behind this name. This is a research gap, not an allegation of wrongdoing.',
'Partnership source':'A public description of a collaboration. It is evidence of that relationship, not necessarily a record of a grant payment.',
'Association source':'An association’s own description of its identity or work. A professional association and a charitable foundation can have different tax classifications.',
'Official entity identification':'The organization publishes its legal identity or tax ID. This alone does not mean financial statements are available or have been reviewed.',
'Resource / no filing established':'A resource, book or community page was found, but no separate nonprofit filing was established. Useful resources need not be charities.',
'Awarded':'An award or funding commitment was announced. It does not confirm that all money has been paid or that intended results have occurred.',
'Giving route sourced':'An official giving destination was located. Check its recipient and restrictions; it may support the whole organization rather than this specific program.',
'No giving route verified':'We have not confirmed a donation destination for this program. You can explore it, but a saved planning amount is not a payment.',
'EIN':'Employer Identification Number: a US federal tax ID used to match legal organizations. Having an EIN does not by itself establish charitable status.',
'Evidence type':'The kind of source behind a claim. It tells you what that source can establish and what still needs confirmation.',
'Inherited / not approved':'An entry carried over from an earlier catalog. It is retained for staff research and has not been approved as a current opportunity.'
};
window.GGPTermDefinitions=definitions;
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const terms=Object.keys(definitions).sort((a,b)=>b.length-a.length);const rx=new RegExp('(?<![\\w])('+terms.map(escape).join('|')+')(?![\\w])','gi');const names=new Map(terms.map(k=>[k.toLowerCase(),k]));
function button(term){const b=document.createElement('button');b.type='button';b.className='ggp-term';b.textContent=term;b.dataset.term=names.get(term.toLowerCase())||term;b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',term+' — explain this term');return b;}
let scheduled=false;function annotate(){scheduled=false;document.querySelectorAll('#main,#detail-body').forEach(root=>{const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(walk.nextNode()){const n=walk.currentNode;if(!n.parentElement.closest('button,a,select,option,textarea,script,style,h1,h2,h3,h4,summary,.ggp-term-tip')&&rx.test(n.nodeValue))nodes.push(n);rx.lastIndex=0;}nodes.forEach(n=>{const frag=document.createDocumentFragment();let pos=0;for(const m of n.nodeValue.matchAll(rx)){frag.append(n.nodeValue.slice(pos,m.index),button(m[0]));pos=m.index+m[0].length;}frag.append(n.nodeValue.slice(pos));n.replaceWith(frag);});});const sel=document.getElementById('network-type');if(sel&&!document.getElementById('network-type-help')){const b=button('Evidence type');b.id='network-type-help';sel.after(b);const sync=()=>{b.dataset.term=sel.value==='all'?'Evidence type':sel.value;b.textContent=sel.value==='all'?'Explain evidence types ⓘ':'Explain '+sel.value+' ⓘ';b.setAttribute('aria-label',b.textContent);};sel.addEventListener('change',sync);document.getElementById('network-reset')?.addEventListener('click',()=>queueMicrotask(sync));document.getElementById('network-results')?.addEventListener('click',()=>queueMicrotask(sync));sync();}}
const tip=document.createElement('div');tip.className='ggp-term-tip';tip.id='ggp-term-tip';tip.role='tooltip';tip.hidden=true;document.body.append(tip);let current=null;
function hide(){tip.hidden=true;if(current){current.setAttribute('aria-expanded','false');current.removeAttribute('aria-describedby');}current=null;}
function show(b){if(!definitions[b.dataset.term])return;hide();current=b;tip.textContent=definitions[b.dataset.term];tip.hidden=false;b.setAttribute('aria-expanded','true');b.setAttribute('aria-describedby',tip.id);const dialog=b.closest('dialog');(dialog||document.body).append(tip);}
document.addEventListener('mouseover',e=>{const b=e.target.closest('.ggp-term');if(b&&b!==current)show(b);});document.addEventListener('mouseout',e=>{if(e.target.closest('.ggp-term')&&!e.target.contains(e.relatedTarget))hide();});document.addEventListener('focusin',e=>{const b=e.target.closest('.ggp-term');if(b)show(b);else hide();});document.addEventListener('click',e=>{const b=e.target.closest('.ggp-term');if(b)show(b);else hide();});document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});document.addEventListener('focusout',e=>{if(e.target.closest('.ggp-term'))hide();});window.addEventListener('hashchange',hide);
new MutationObserver(ms=>{if(ms.some(m=>!tip.contains(m.target)&&m.target!==tip)){if(current&&!current.isConnected)hide();if(!scheduled){scheduled=true;queueMicrotask(annotate);}}}).observe(document.body,{childList:true,subtree:true});annotate();
})();
