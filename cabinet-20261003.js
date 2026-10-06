'use strict';
document.documentElement.classList.add('js');
const catalogue = JSON.parse(document.querySelector('#cabinet-data').textContent);
const byId = new Map(catalogue.projects.map(p => [p.id, p]));
const search = document.querySelector('#search');
const room = document.querySelector('#room');
const sort = document.querySelector('#sort');
const clearFilters = document.querySelector('#clear-filters');
const projects = [...document.querySelectorAll('.project')];
const groups = [...document.querySelectorAll('.collection')].map(section => ({section,list:section.querySelector('.collection-projects'),children:[...section.querySelector('.collection-projects').children]}));
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
const relatedItems = [...document.querySelectorAll('[data-related-id]')];
const searchable = new Map([...projects,...relatedItems].map(item => [item.dataset.id || item.dataset.relatedId, normalize(item.dataset.search)]));
const flatIndex = document.querySelector('#alphabetical-index');
const recipient = () => new URLSearchParams(location.search).get('for') === 'cale';
function targetURL(id, override) {
  const url = new URL(override || byId.get(id).url);
  if (id === 'island-hop' && recipient()) url.searchParams.set('pilot','cale');
  if (id === 'shows-with-friends' && recipient()) url.searchParams.set('for','cale');
  return String(url);
}
function restoreRecipient() {
  document.querySelector('#recipient-note').hidden = !recipient();
  document.querySelectorAll('[data-project-link]').forEach(a => a.href = targetURL(a.dataset.projectLink));
}
function filter(updateURL = true) {
  const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  const inCollection = p => room.value === 'all' || p.collection === room.value || (catalogue.legacyRooms[room.value] && p.legacyRooms.includes(room.value));
  const matched = new Map(catalogue.projects.map(p => [p.id, inCollection(p) && terms.every(term => searchable.get(p.id).includes(term))]));
  let count = 0;
  projects.forEach(item => {
    const id=item.dataset.id;
    item.hidden = !(matched.get(id) || catalogue.projects.some(p => p.role==='related' && p.parentId===id && matched.get(p.id)));
    if (!item.hidden) count++;
  });
  relatedItems.forEach(item => {
    const p=byId.get(item.dataset.relatedId);
    item.hidden = !(matched.get(p.id) || (p.parentId && inCollection(p) && matched.get(p.parentId)));
  });
  document.querySelectorAll('.related-group').forEach(group => group.hidden = ![...group.querySelectorAll('[data-related-id]')].some(item=>!item.hidden));
  const relatedCount=relatedItems.filter(item=>!item.hidden).length;
  document.querySelector('.related-tour').hidden = !relatedItems.some(item=>!byId.get(item.dataset.relatedId).parentId&&!item.hidden);
  const alphabetical = sort.value === 'az';
  flatIndex.hidden = !alphabetical;
  if (alphabetical) flatIndex.replaceChildren(...[...projects].sort((a,b) => byId.get(a.dataset.id).title.localeCompare(byId.get(b.dataset.id).title,'en',{sensitivity:'base'})));
  else groups.forEach(g => g.list.replaceChildren(...g.children));
  groups.forEach(g => {
    const visible=g.children.filter(el=>el.classList.contains('project')&&!el.hidden);
    g.section.hidden=alphabetical||!visible.length;
    g.section.querySelector('.collection-count').textContent=visible.length+' '+(visible.length===1?'experience':'experiences');
    g.children.filter(el=>el.classList.contains('family-heading')).forEach(h=>h.hidden=!visible.some(p=>p.dataset.family===h.dataset.family));
  });
  const counts=[];
  if(count||!relatedCount)counts.push(count+' '+(count===1?'experience':'experiences'));
  if(relatedCount)counts.push(relatedCount+' related '+(relatedCount===1?'link':'links'));
  document.querySelector('#results').textContent=counts.join(' · ');
  document.querySelector('#empty').hidden=count+relatedCount>0;
  clearFilters.hidden=!search.value&&room.value==='all';
  if(updateURL){const url=new URL(location.href);search.value.trim()?url.searchParams.set('q',search.value.trim()):url.searchParams.delete('q');room.value==='all'?url.searchParams.delete('room'):url.searchParams.set('room',room.value);sort.value==='az'?url.searchParams.set('sort','az'):url.searchParams.delete('sort');history.replaceState(history.state,'',url);}
}
function restoreFilters() {
  const params=new URLSearchParams(location.search),requested=params.get('room');
  room.querySelectorAll('[data-legacy-option]').forEach(o=>o.remove());
  if(catalogue.legacyRooms[requested]){const o=new Option('Saved category: '+catalogue.legacyRooms[requested],requested);o.dataset.legacyOption='true';room.append(o);}
  room.value=[...room.options].some(o=>o.value===requested)?requested:'all';
  search.value=params.get('q')||'';sort.value=params.get('sort')==='az'?'az':'curated';filter(false);
}
search.addEventListener('input',()=>filter());room.addEventListener('change',()=>filter());sort.addEventListener('change',()=>filter());
clearFilters.addEventListener('click',()=>{search.value='';room.value='all';filter();search.focus();});
// Collection navigation also clears an active filter, keeping its target reachable.
document.querySelectorAll('.collection-nav a').forEach(a=>a.addEventListener('click',()=>{search.value='';room.value='all';sort.value='curated';filter();}));
document.querySelectorAll('#project-total,#footer-total').forEach(el=>el.textContent=projects.length);
document.querySelectorAll('[data-related-total]').forEach(el=>el.textContent=relatedItems.length);
let routeKey = null;
function showRoute(key, moveFocus=false) {
  const route=catalogue.routes.find(r=>r.key===key),section=document.querySelector('#adventure');
  routeKey=route?key:null;section.hidden=!route;
  document.querySelectorAll('[data-route]').forEach(button=>button.setAttribute('aria-expanded',String(!!route&&button.dataset.route===key)));
  if(!route)return;
  document.querySelector('#adventure-title').textContent=route.title;
  document.querySelector('#adventure-note').textContent=route.note;
  document.querySelector('#adventure-status').textContent='';document.querySelector('#adventure-link').hidden=true;
  const list=document.querySelector('#adventure-stops');list.replaceChildren();
  route.stops.forEach(stop=>{const p=byId.get(stop.id),li=document.createElement('li'),a=document.createElement('a'),action=document.createElement('span'),note=document.createElement('small');a.href=targetURL(stop.id,stop.url);a.textContent=p.title;action.textContent=stop.action+' ↗';a.append(action);li.append(a);if(p.note){note.textContent=p.note;li.append(note);}list.append(li);});
  if(moveFocus){section.focus({preventScroll:true});section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});}
}
function routeURL(){const url=new URL(location.href);url.searchParams.set('adventure',routeKey);url.hash='adventure';return url;}
document.querySelectorAll('[data-route]').forEach(button=>button.addEventListener('click',()=>{showRoute(button.dataset.route,true);history.pushState(history.state,'',routeURL());}));
document.querySelector('#copy-adventure').addEventListener('click',async()=>{if(!routeKey)return;const url=String(routeURL()),status=document.querySelector('#adventure-status');try{await navigator.clipboard.writeText(url);status.textContent='Route link copied.';}catch{const field=document.querySelector('#adventure-link');field.value=url;field.hidden=false;field.focus();field.select();status.textContent='Copy the selected link to keep this route.';}});
function restore(){restoreRecipient();restoreFilters();showRoute(new URLSearchParams(location.search).get('adventure'));}
addEventListener('popstate',restore);addEventListener('pageshow',restore);restore();
