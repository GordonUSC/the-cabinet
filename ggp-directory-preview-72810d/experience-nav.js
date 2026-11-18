(()=>{'use strict';
function start(){
 if(document.getElementById('ggp-experience-nav'))return;
 const host=document.createElement('header');host.id='ggp-experience-nav';
 host.innerHTML='<a class="ggp-mode-brand" href="index.html?preview=20260911-connected#donors" aria-label="GGP donor prototype">GGP<span>↗</span><small>DIRECTORY + PIPELINE</small></a><nav aria-label="GGP experiences"><a data-mode="student" href="student.html?preview=20260911-connected">Student</a><a data-mode="educator" href="educator.html?preview=20260911-connected">Educator</a><a data-mode="donor" href="index.html?preview=20260911-connected#donors">Donor</a><a data-mode="ahead" href="pilot-review.html?preview=20260911-connected">Possibilities ahead</a></nav><span class="ggp-mode-state">PROTOTYPE · FOR REVIEW</span>';
 const skip=document.querySelector('body > .skip');if(skip)skip.after(host);else document.body.prepend(host);
 document.body.classList.add('ggp-connected');
 function paint(){const path=location.pathname,internal=/\/(pilot-review|eric-review|review-brief|analytics)\.html$/.test(path)||/^#(production|review)(\/|$)/.test(location.hash);let current=/\/student\.html$/.test(path)?'student':/\/educator\.html$/.test(path)?'educator':internal?'ahead':'donor';host.querySelectorAll('[data-mode]').forEach(a=>{if(a.dataset.mode===current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.body.dataset.ggpMode=current}
 host.querySelector('[data-mode=donor]').addEventListener('click',()=>{try{localStorage.setItem('ggp-audience-v1','donor')}catch{}});
 paint();window.addEventListener('hashchange',paint);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
