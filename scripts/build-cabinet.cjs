// Render the public index from one editorial catalogue. No runtime fetch required.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'projects.json'), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byId = new Map(data.projects.map(p => [p.id, p]));
if (byId.size !== data.projects.length) throw Error('Duplicate project IDs');
for (const p of data.projects) {
  if (!data.collections.some(c => c.id === p.collection)) throw Error('Unknown collection: '+p.id);
  if (!p.url.startsWith('https://gordonusc.github.io/')) throw Error('Unexpected public destination: '+p.id);
}
function feature(id, i) {
  const p = byId.get(id), f = p.feature;
  return `<article data-feature="${esc(id)}" class="start-feature ${i === 0 ? 'feature-lead' : 'feature-support'}">
<a class="feature-art" href="${esc(f.url)}" aria-label="${esc(f.cta)}"><img src="${esc(f.image)}" alt="${esc(f.imageAlt || p.title + ' project artwork')}" width="${f.imageWidth || (i===0?1920:760)}" height="${f.imageHeight || (i===0?1080:475)}" ${i===0?'fetchpriority="high"':'loading="lazy"'}></a>
<div class="feature-copy"><p class="eyebrow">${esc(f.type)}</p><h3>${esc(p.title)}</h3><p class="feature-description">${esc(f.text)}</p><a class="line-link" href="${esc(f.url)}">${esc(f.cta)} <span aria-hidden="true">↗</span></a><p class="access-note">${esc(f.note)}</p></div></article>`;
}
function project(p) {
  const c=data.collections.find(c=>c.id===p.collection);
  const search=[p.title,p.subtitle,p.purpose,p.note,c.title,...p.aliases].join(' ');
  return `<li class="project${p.spotlight?' project-spotlight':''}${p.alternateOf?' project-alternate':''}" id="project-${esc(p.id)}" data-id="${esc(p.id)}" data-collection="${p.collection}" data-legacy="${esc(p.legacyRooms.join(' '))}" data-family="${esc(p.family||'')}" data-search="${esc(search)}">
<a class="project-link" data-project-link="${esc(p.id)}" href="${esc(p.url)}">${p.spotlight?`<img class="project-image" src="${esc(p.image)}" alt="" loading="lazy" width="760" height="475">`:''}<span class="project-body"><span class="project-name">${esc(p.title)}</span><span class="project-subtitle">${esc(p.subtitle)}</span><span class="project-description">${esc(p.purpose)}</span>${p.note?`<span class="project-note">${esc(p.note)}</span>`:''}${p.action?`<span class="project-action">${esc(p.action)} <span aria-hidden="true">↗</span></span>`:''}</span>${p.action?'':'<span class="project-arrow" aria-hidden="true">↗</span>'}</a></li>`;
}
function collection(c) {
  const ps=data.projects.filter(p=>p.collection===c.id);let previousFamily='';
  return `<section class="collection" id="collection-${c.id}" data-collection="${c.id}" aria-labelledby="heading-${c.id}"><div class="collection-intro"><p class="collection-count">${ps.length} entries</p><h3 id="heading-${c.id}">${esc(c.title)}</h3><p>${esc(c.description)}</p></div><ul class="collection-projects">${ps.map(p=>{let h='';if(data.families[p.family]&&p.family!==previousFamily){const f=data.families[p.family];h=`<li class="family-heading" data-family="${esc(p.family)}"><h4>${esc(f.title)}</h4><p>${esc(f.description)}</p></li>`;}previousFamily=p.family;return h+project(p)}).join('\n')}</ul></section>`;
}
const sections={
  COUNT:String(data.projects.length),
  FEATURES:data.featured.map(feature).join('\n'),
  COLLECTION_NAV:data.collections.map(c=>`<a href="#collection-${c.id}">${esc(c.title)} <span aria-hidden="true">↓</span></a>`).join('\n'),
  OPTIONS:data.collections.map(c=>`<option value="${c.id}">${esc(c.title)}</option>`).join(''),
  COLLECTIONS:data.collections.map(collection).join('\n'),
  ROUTES:data.routes.map(r=>`<button class="route-choice" type="button" data-route="${r.key}" aria-controls="adventure" aria-expanded="false"><span>${esc(r.title)}</span><small>${esc(r.note)}</small><b aria-hidden="true">↗</b></button>`).join('\n'),
  DATA:JSON.stringify(data).replace(/</g,'\\u003c')
};
const template=fs.readFileSync(path.join(root,'cabinet.template.html'),'utf8');
const output=template.replace(/\{\{([A-Z_]+)\}\}/g,(_,key)=>{if(!(key in sections))throw Error('Unknown template token '+key);return sections[key]});
const target=path.join(root,'index.html');
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('index.html is out of date; run node scripts/build-cabinet.cjs');console.log(`PASS: ${data.projects.length} entries, ${data.collections.length} collections; generated HTML matches canonical metadata.`)}else{fs.writeFileSync(target,output);console.log(`Rendered ${data.projects.length} entries in ${data.collections.length} collections.`)}
