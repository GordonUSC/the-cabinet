(() => {
  'use strict';
  const events = window.MIXER_EVENTS, root = document.getElementById('night-cards');
  if (!events || !root) return;
  const $ = s => document.querySelector(s), pre = document.body.dataset.pre || '';
  const day = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const ended = e => Boolean(e.date && (e.endDate || e.date) < day);
  const upcoming = events.filter(e => !ended(e));
  let saved = [], persistent = true, savedOnly = false;
  try { const v = JSON.parse(localStorage.getItem('mx_shortlist') || '[]'); if (Array.isArray(v)) saved = v.filter(id => events.some(e => e.id === id)); }
  catch (_) { persistent = false; }
  const h = (tag, cls, text) => { const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e; };
  const href = e => pre+'next/night/'+e.id+'.html';
  const absolute = e => 'https://gordonusc.github.io/the-cabinet/shows-with-friends/next/night/'+e.id+'.html';
  const date = e => e.date ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(e.date+'T12:00:00'))+(e.endDate && e.endDate!==e.date?' – '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(new Date(e.endDate+'T12:00:00')):'') : 'Date to come';
  function save(id) {
    saved=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];
    try { localStorage.setItem('mx_shortlist',JSON.stringify(saved)); } catch (_) { persistent=false; }
    $('#shortlist-message').textContent=persistent?'Shortlist saved on this device. This is not an RSVP or ticket purchase.':'Saved for this visit only. Device storage is unavailable; copy your plan to keep it.';
    const old=root.querySelector('[data-save="'+id+'"]'), focusId=old&&old===document.activeElement?id:null;
    render();if(focusId){const b=root.querySelector('[data-save="'+focusId+'"]');(b||$('#saved-filter')).focus();}
  }
  function render() {
    const q=$('#night-search').value.trim().toLocaleLowerCase(), who=$('#friend-select').value;
    const list=(savedOnly?events.filter(e=>saved.includes(e.id)):upcoming).filter(e=>(!who||(e.names||[]).includes(who)||(e.maybe||[]).includes(who))&&(!q||[e.name,e.city,...(e.names||[])].join(' ').toLocaleLowerCase().includes(q)));
    root.replaceChildren();$('#save-count').textContent=saved.length;
    const limit = q||who||savedOnly ? list.length : 3;
    $('#finder-status').textContent=list.length?(savedOnly?'Your shortlist':who?'Nights with '+who:'Upcoming plans')+' · '+list.length+' '+(list.length===1?'night':'nights')+(limit<list.length?' · the next three below':''):'No matching nights. Try another name or clear your filters.';
    list.slice(0,limit).forEach(e=>{
      const card=h('article','night-choice');if(e.art){const img=h('img');img.src=e.art;img.alt='';img.loading='lazy';img.width=480;img.height=270;card.append(img);}
      const body=h('div','choice-body');body.append(h('p','choice-meta',date(e)+' · '+e.city),h('h3','',e.name),h('p','',e.line));
      body.append(h('p','choice-friends',ended(e)?'Past date · attendance not implied':e.names.length?'Planned with '+e.names.join(', '):e.open?'Company still taking shape':e.solo?'Gordon’s solo plan':'Details on the night page'));
      if(e.maybe&&e.maybe.length)body.append(h('p','choice-friends',e.maybe.join(', ')+' may join'));
      const actions=h('div','choice-actions'), open=h('a','btn','Open the night ↗');open.href=href(e);const b=h('button','btn ghost save-night',saved.includes(e.id)?'♥ Saved':'♡ Save night');b.type='button';b.dataset.save=e.id;b.setAttribute('aria-label',(saved.includes(e.id)?'Remove ':'Save ')+e.name+' '+(saved.includes(e.id)?'from':'to')+' my shortlist');b.setAttribute('aria-pressed',String(saved.includes(e.id)));b.onclick=()=>save(e.id);actions.append(open,b);body.append(actions,h('p','art-note',e.artl||''));card.append(body);root.append(card);
    });
    if(!list.length)root.append(h('p','empty-state',savedOnly?'Save a night that catches your eye. Your choices will appear here.':'The next good night may still be taking shape. Browse everyone below, or try a different search.'));
  }
  $('#night-search').addEventListener('input',render);$('#friend-select').addEventListener('change',render);
  $('#saved-filter').onclick=()=>{savedOnly=!savedOnly;$('#saved-filter').setAttribute('aria-pressed',String(savedOnly));render();};
  $('#share-shortlist').onclick=async()=>{
    const chosen=events.filter(e=>saved.includes(e.id));if(!chosen.length){$('#shortlist-message').textContent='Save at least one night first, then copy your plan.';return;}
    const text='A few nights I’m curious about with Gordon:\n\n'+chosen.map(e=>e.name+' · '+date(e)+' · '+e.city+'\n'+absolute(e)).join('\n\n')+'\n\nWant to compare plans? These are possibilities, not confirmed bookings.';
    try{await navigator.clipboard.writeText(text);$('#shortlist-message').textContent='Plan copied. Paste it into the conversation when you’re ready.';}
    catch(_){let t=$('#plan-fallback');if(!t){t=h('textarea');t.id='plan-fallback';t.setAttribute('aria-label','Your night plan, ready to copy');$('.shortlist-tools').append(t);}t.value=text;t.focus();t.select();$('#shortlist-message').textContent='Copy the selected plan below.';}
  };
  // Date-driven cards stay accurate after this static site’s build date.
  document.querySelectorAll('.rack .strip').forEach(s=>{const e=events.find(e=>e.id===s.dataset.id);if(!e)return;if(ended(e)){s.classList.add('played');const shelf=$('.shelf .rack');if(shelf&&!s.closest('.shelf'))shelf.append(s);}});
  const summary=$('.shelf summary');if(summary)summary.textContent='Dates that already passed ('+events.filter(ended).length+')';
  const all=$('.filters [data-f="all"] i');if(all)all.textContent=upcoming.length;
  const intro=$('#rack .sec-h > p');if(intro)intro.textContent=upcoming.length+' upcoming plans. Open a night for listening links, calendar and details.';
  render();
})();
