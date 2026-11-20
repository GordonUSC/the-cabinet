(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const options = [
    { id: 'funding', label: 'Scholarships & grants', short: 'Funding', description: 'Awards and funding for participation, projects or study.' },
    { id: 'learning', label: 'Learning & resources', short: 'Learning', description: 'Courses, educator tools, degree programs and guides.' },
    { id: 'career', label: 'Career pathways', short: 'Careers', description: 'Mentorship, internships, fellowships and career development.' },
    { id: 'community', label: 'Community & creation', short: 'Community', description: 'Competitions, esports, game-making and peer support.' }
  ];
  function category(record) {
    const kind = record.kind || '';
    let id = 'community';
    if (/scholarship|grant/i.test(kind)) id = 'funding';
    else if (/internship|fellowship|career|mentorship|employment|retraining/i.test(kind)) id = 'career';
    else if (/learning|educator|degree|research resource/i.test(kind)) id = 'learning';
    return options.find(option => option.id === id);
  }
  const nav = [
    ['donors', '#donors', 'Programs', 'Explore and compare'],
    ['my-giving', '#my-giving', 'My Giving', 'Your private records'],
    ['public', '#public-giving', 'Public Giving', 'Reported grants & support'],
    ['news', '#news', 'News', 'Updates to the Atlas']
  ];
  const links = [
    ['directory', 'Program directory'],
    ['scholars', 'Our scholars'],
    ['pipeline', 'Opportunity pipeline'],
    ['plan', 'Saved next steps']
  ];
  function route(hash) {
    const [name, section] = hash.replace(/^#/, '').split('/');
    if (name === 'donors' && ['giving', 'funding'].includes(section)) return 'my-giving';
    if (name === 'public-giving') return 'public';
    if (name === 'programs') return 'donors';
    return ['donors','my-giving','public','news','directory','scholars','pipeline','plan','production','review'].includes(name) ? name : 'donors';
  }
  function sidebar(current) {
    const root = document.getElementById('donor-sidebar');
    if (!root) return;
    const primary = nav.map(([id, href, label, line]) => `<a href="${href}"${current === id ? ' aria-current="page"' : ''}><span>${label}</span><small>${line}</small></a>`).join('');
    const other = links.map(([id, label]) => `<a href="#${id}"${id === current ? ' aria-current="page"' : ''}>${label}</a>`).join('');
    root.innerHTML = `<p class="desk-kicker">THE OPPORTUNITY ATLAS</p><p class="desk-title">Donor desk</p><nav aria-label="Donor views" class="desk-nav">${primary}</nav><details class="desk-secondary"${links.some(([id]) => id === current) ? ' open' : ''}><summary>More to explore</summary><nav aria-label="More donor tools">${other}</nav></details><p class="desk-aside-note">Review edition. Nothing on this site takes a donation or shares your private portfolio.</p>`;
    document.body.dataset.donorRoute = current;
  }
  function title(kicker, heading, description) {
    return `<section class="desk-heading"><div><p class="eyebrow">${esc(kicker)}</p><h1>${esc(heading)}</h1><p class="lead">${esc(description)}</p></div></section>`;
  }
  function news() {
    const { records, release } = window.GGP;
    const current = release.latestResearch || release.date;
    const shown = ['Endless Studios','Code.org AI Curriculum','Experience AI','Roblox Education'].map(name => records.find(record => record.name.includes(name))).filter(Boolean);
    const opportunities = shown.map(record => {
      const c = category(record);
      return `<article class="card" data-category="${c.id}"><span class="tag desk-category" data-kind="${c.id}">${esc(c.label)}</span><h3>${esc(record.name)}</h3><p>${esc(record.summary)}</p><p class="small">Source reviewed <time datetime="${esc(record.checked)}">${esc(record.checked)}</time> · ${esc(record.status)}</p><div class="actions"><button data-detail="${esc(record.id)}">Inspect source and details</button></div></article>`;
    }).join('');
    return title('NEWS / ATLAS FIELD NOTES', 'What’s new in the Atlas', 'See what changed in the directory and what to verify before taking the next step.')+
      `<article class="panel desk-update"><p class="eyebrow">DIRECTORY UPDATE · <time datetime="${esc(current)}">${esc(current)}</time></p><h2>${esc(release.added)} additions to explore</h2><p>The latest review brings the collection to ${records.length} programs and resources, including game-making and adult career pathways. Each new listing was reviewed on the provider’s own page. Listings do not establish that intake is open or that giving or outcome evidence has been verified.</p><a class="button primary" href="#donors/programs">Browse the collection</a></article><section aria-labelledby="news-examples"><div class="topline"><div><p class="eyebrow">FROM THE UPDATE</p><h2 id="news-examples">Four to look at</h2></div></div><div class="cards">${opportunities}</div></section><p class="small desk-caveat">This is an Atlas update, not an announcement from the providers. Check the original source for current details.</p>`;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const preferences = document.getElementById('donor-preferences');
    if (!preferences) return;
    const sound = document.getElementById('ggp-audio-switch');
    const brand = document.getElementById('ggp-brand-switch')?.closest('.brand-control');
    for (const control of [sound, brand]) {
      if (control) preferences.append(control);
    }
    preferences.hidden = !preferences.childElementCount;
  });
  window.ggpDonorDesk = { route, sidebar, title, news, category, options };
})();
