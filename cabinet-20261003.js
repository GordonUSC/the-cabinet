const search = document.querySelector('#search');
const room = document.querySelector('#room');
const projects = [...document.querySelectorAll('.project')];
const clearFilters = document.querySelector('#clear-filters');
const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
// Search what is actually on each card, plus its explicit aliases.
const searchable = projects.map(item => normalize(item.textContent + ' ' + (item.dataset.search || '')));
function filter(updateURL = true) {
  const terms = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  let count = 0;
  projects.forEach((item, index) => {
    item.hidden = !(terms.every(term => searchable[index].includes(term)) && (room.value === 'all' || item.dataset.stage === room.value));
    if (!item.hidden) count++;
  });
  document.querySelector('#results').textContent = count + ' project' + (count === 1 ? '' : 's');
  document.querySelector('#empty').hidden = count > 0;
  clearFilters.hidden = !search.value && room.value === 'all';
  if (updateURL) {
    const url = new URL(location.href);
    search.value.trim() ? url.searchParams.set('q', search.value.trim()) : url.searchParams.delete('q');
    room.value !== 'all' ? url.searchParams.set('room', room.value) : url.searchParams.delete('room');
    // Preserve the recipient invitation and anchor while making searches bookmarkable.
    history.replaceState(null, '', url);
  }
}
function restoreFilters() {
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') || '';
  const requested = params.get('room');
  room.value = [...room.options].some(option => option.value === requested) ? requested : 'all';
  filter(false);
}
search.addEventListener('input', () => filter());
room.addEventListener('change', () => filter());
clearFilters.addEventListener('click', () => {
  search.value = ''; room.value = 'all'; filter(); search.focus();
});
addEventListener('popstate', restoreFilters);
addEventListener('pageshow', restoreFilters);
document.querySelector('#project-total').textContent = projects.length;
document.querySelector('#footer-total').textContent = projects.length;
restoreFilters();
const routes=[{title:'A little lift, a little rhythm.',note:'Start in the sky. Find a night to share. Finish with a story.',stops:[['Fly somewhere new','Choose a balloon and follow your curiosity.','https://gordonusc.github.io/island-hop/'],['Make a little music','Try the two-deck mix in Shows with Friends.','https://gordonusc.github.io/the-cabinet/shows-with-friends/#deck'],['Pull up a chair','Browse Gordon’s Media Log.','https://gordonusc.github.io/media-log/#record']]},{title:'The people make the place.',note:'Three doors into people making things together.',stops:[['Meet Cale’s world','A producer’s story, in two directions.','https://gordonusc.github.io/cale-yarborough/for-cale/'],['Follow the music','Step into Gryphus.','https://gordonusc.github.io/the-cabinet/gryphus/'],['Spend a moment with gratitude','Read the Vanderbilt edition.','https://gordonusc.github.io/the-cabinet/good-company/vanderbilt/']]},{title:'For your curious side.',note:'A small expedition, with room to get happily sidetracked.',stops:[['Find your way home','A lantern guide to the Nether.','https://gordonusc.github.io/nether-guide/'],['Have a very strong opinion','Read a Pizza Baby verdict.','https://gordonusc.github.io/pizza-baby/#diaries'],['See what’s possible','Explore Gordtopia.','https://gordonusc.github.io/gordtopia/']]}];
let route=-1;function deal(){route=(route+1)%routes.length;const r=routes[route],list=document.querySelector('#adventure-stops');document.querySelector('#adventure-title').textContent=r.title;document.querySelector('#adventure-note').textContent=r.note;list.replaceChildren();for(const [title,note,url] of r.stops){const li=document.createElement('li'),a=document.createElement('a'),p=document.createElement('p');a.href=url;a.textContent=title+' ↗';p.textContent=note;li.append(a,p);list.append(li)}const section=document.querySelector('#adventure');section.hidden=false;section.setAttribute('tabindex','-1');section.focus({preventScroll:true});section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'center'})}document.querySelector('#deal').addEventListener('click',deal);document.querySelector('#redeal').addEventListener('click',deal);
if(new URLSearchParams(location.search).get('for')==='cale'){document.querySelector('#welcome').innerHTML='Cale,<br>come <em>play.</em>';document.querySelector('.intro').textContent='A few things made with you in mind. Your world, Sofia’s world, and a balloon with your name on it. Take whichever door feels right.';for(const a of document.querySelectorAll('.hop-link,.shape.play'))a.href='https://gordonusc.github.io/island-hop/?pilot=cale';routes[0].stops[0][2]='https://gordonusc.github.io/island-hop/?pilot=cale';document.querySelector('.shape.listen').href='https://gordonusc.github.io/the-cabinet/shows-with-friends/?for=cale'}
