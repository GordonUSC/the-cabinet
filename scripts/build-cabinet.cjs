// Render the public index from one editorial catalogue. No runtime fetch required.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'projects.json'), 'utf8'));
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const experiences = data.projects.filter(p => p.role === 'experience');
const related = data.projects.filter(p => p.role === 'related');
const byId = new Map(data.projects.map(p => [p.id, p]));
if (byId.size !== data.projects.length) throw Error('Duplicate project IDs');
for (const p of data.projects) {
  if (!data.collections.some(c => c.id === p.collection)) throw Error('Unknown collection: '+p.id);
  if (p.role === 'related' && p.parentId && !experiences.some(x => x.id === p.parentId)) throw Error('Invalid related-link parent: '+p.id);
  if (!p.url.startsWith('https://gordonusc.github.io/')) throw Error('Unexpected public destination: '+p.id);
}
function feature(id, i) {
  const p = byId.get(id), f = p.feature;
  return `<article id="feature-${esc(id)}" data-feature="${esc(id)}" class="start-feature ${i === 0 ? 'feature-lead' : 'feature-support'}">
<a class="feature-art" href="${esc(f.url)}" aria-label="${esc(f.cta)}"><img src="${esc(f.image)}" alt="${esc(f.imageAlt || p.title + ' project artwork')}" width="${f.imageWidth || (i===0?1920:760)}" height="${f.imageHeight || (i===0?1080:475)}" ${i===0?'fetchpriority="high"':'loading="lazy"'}></a>
<div class="feature-copy"><p class="eyebrow">${esc(f.type)}</p><h3>${esc(p.title)}</h3><p class="feature-description">${esc(f.text)}</p><a class="line-link" href="${esc(f.url)}">${esc(f.cta)} <span aria-hidden="true">↗</span></a><p class="access-note">${esc(f.note)}</p></div></article>`;
}
function searchText(p) {
  const c=data.collections.find(c=>c.id===p.collection);
  return [p.title,p.subtitle,p.purpose,p.note,p.relationship||'',c.title,...p.aliases].join(' ');
}
function relatedLink(p) {
  return `<li class="related-entry" id="project-${esc(p.id)}" data-related-id="${esc(p.id)}" data-search="${esc(searchText(p))}"><a data-project-link="${esc(p.id)}" href="${esc(p.url)}"><span class="related-kind">${esc(p.relationship)}</span><span class="related-name">${esc(p.title)} <span aria-hidden="true">↗</span></span><span class="related-description">${esc(p.purpose)}</span></a></li>`;
}
function project(p) {
  const companions=related.filter(r=>r.parentId===p.id);
  return `<li class="project${p.spotlight?' project-spotlight':''}" id="project-${esc(p.id)}" data-id="${esc(p.id)}" data-collection="${p.collection}" data-legacy="${esc(p.legacyRooms.join(' '))}" data-family="${esc(p.family||'')}" data-search="${esc(searchText(p))}">
<a class="project-link" data-project-link="${esc(p.id)}" href="${esc(p.url)}">${p.spotlight?`<img class="project-image" src="${esc(p.image)}" alt="" loading="lazy" width="760" height="475">`:''}<span class="project-body">${p.feature?'<span class="featured-reference">Featured in Start here</span>':''}<span class="project-name">${esc(p.title)}</span><span class="project-subtitle">${esc(p.subtitle)}</span><span class="project-description">${esc(p.purpose)}</span>${p.note?`<span class="project-note">${esc(p.note)}</span>`:''}${p.action?`<span class="project-action">${esc(p.action)} <span aria-hidden="true">↗</span></span>`:''}</span>${p.action?'':'<span class="project-arrow" aria-hidden="true">↗</span>'}</a>${companions.length?`<div class="related-group"><ul>${companions.map(relatedLink).join('')}</ul></div>`:''}</li>`;
}
function collection(c) {
  const ps=experiences.filter(p=>p.collection===c.id);let previousFamily='';
  return `<section class="collection" id="collection-${c.id}" data-collection="${c.id}" aria-labelledby="heading-${c.id}"><div class="collection-intro"><p class="collection-count">${ps.length} experiences</p><h3 id="heading-${c.id}">${esc(c.title)}</h3><p>${esc(c.description)}</p></div><ul class="collection-projects">${ps.map(p=>{let h='';if(data.families[p.family]&&p.family!==previousFamily){const f=data.families[p.family];h=`<li class="family-heading" data-family="${esc(p.family)}"><h4>${esc(f.title)}</h4><p>${esc(f.description)}</p></li>`;}previousFamily=p.family;return h+project(p)}).join('\n')}</ul></section>`;
}
const sections={
  COUNT:String(experiences.length),
  RELATED_COUNT:String(related.length),
  RELATED_TOURS:`<aside class="related-tour" aria-label="Earlier collection tour"><h3>An earlier way around</h3><p>This welcome tour links to experiences already in the collection.</p><ul>${related.filter(p=>!p.parentId).map(relatedLink).join('')}</ul></aside>`,
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
if(process.argv.includes('--check')){if(fs.readFileSync(target,'utf8')!==output)throw Error('index.html is out of date; run node scripts/build-cabinet.cjs');console.log(`PASS: ${experiences.length} experiences + ${related.length} related links, ${data.collections.length} collections; generated HTML matches canonical metadata.`)}else{fs.writeFileSync(target,output);console.log(`Rendered ${experiences.length} experiences + ${related.length} related links in ${data.collections.length} collections.`)}
