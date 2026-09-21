/* GRYPHUS AFTER HOURS. Click the emblem, the sun sets, the night runs to midnight. */
(function(){
  var sun=document.getElementById("gSun"), night=document.getElementById("gxNight");
  if(!sun||!night) return;
  var stars=document.getElementById("gxStars"), close=document.getElementById("gxClose"), last=null;
  function seed(){
    if(stars.childElementCount) return;
    var f=document.createDocumentFragment();
    for(var i=0;i<90;i++){
      var s=document.createElement("i");
      s.style.left=(Math.random()*100).toFixed(2)+"%";
      s.style.top=(Math.random()*72).toFixed(2)+"%";
      s.style.animationDelay=(Math.random()*4).toFixed(2)+"s";
      var sc=Math.random()<.16?2.1:1;
      s.style.width=s.style.height=(2*sc).toFixed(1)+"px";
      f.appendChild(s);
    }
    stars.appendChild(f);
  }
  function open(e){
    if(e) e.preventDefault();
    seed(); last=document.activeElement;
    night.hidden=false; night.removeAttribute("aria-hidden");
    if("inert" in night) night.inert=false;
    requestAnimationFrame(function(){ night.setAttribute("data-open","true"); });
    sun.setAttribute("aria-expanded","true");
    document.body.style.overflow="hidden";
    close.focus();
  }
  function shut(){
    night.setAttribute("data-open","false");
    sun.setAttribute("aria-expanded","false");
    document.body.style.overflow="";
    night.setAttribute("aria-hidden","true");
    if("inert" in night) night.inert=true;
    setTimeout(function(){ night.hidden=true; },850);
    if(last&&last.focus) last.focus();
  }
  sun.addEventListener("click",open);
  close.addEventListener("click",shut);
  document.addEventListener("keydown",function(e){
    if(e.key==="Escape"&&night.getAttribute("data-open")==="true") shut();
  });
  night.addEventListener("click",function(e){ if(e.target===night) shut(); });
})();
