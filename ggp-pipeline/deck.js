(() => {
'use strict';
const D = window.DECK;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = n => '$' + n.toLocaleString('en-US');
const ico = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const SEP = '<i class="sep" aria-hidden="true"></i>';
const BADGE = `<span class="srcbadge">${ico('badge')}Sourced</span>`;
const DERIVED = `<span class="srcbadge dv">${ico('calc')}Derived</span>`;
const PHONE = () => innerWidth < 1024;

// ---------- sound (ElevenLabs files, off by default) + haptics ----------
const SKEY = 'ggp-match-sound';
let soundOn = false;
try { soundOn = localStorage.getItem(SKEY) === 'on'; } catch (e) { }
const SND = {}, VOL = { flip: .4, stamp: .5, chime: .45 };
function loadSounds() { for (const k of ['flip', 'stamp', 'chime']) if (!SND[k]) { const a = new Audio('sound/' + k + '.mp3'); a.preload = 'auto'; SND[k] = a; } }
function sfx(k) { if (!soundOn || !SND[k]) return; try { const a = SND[k].cloneNode(); a.volume = VOL[k]; const p = a.play(); if (p) p.catch(() => { }); } catch (e) { } }
function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
function paintSound() {
  const b = $('#sound'); b.hidden = false;
  b.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
  b.setAttribute('aria-label', soundOn ? 'Sound is on. Turn sound off' : 'Sound is off. Turn sound on');
  b.classList.toggle('on', soundOn);
}
$('#sound').onclick = () => { soundOn = !soundOn; try { localStorage.setItem(SKEY, soundOn ? 'on' : 'off'); } catch (e) { } if (soundOn) { loadSounds(); sfx('chime'); } paintSound(); toast(soundOn ? 'Sound on' : 'Sound off'); };
if (soundOn) loadSounds();
paintSound();

// ---------- the cards ----------
const ALL = [
  ...D.ggp.map(p => ({ ...p, owned: true, img: 'art/' + p.img + '.webp' })),
  ...D.partners.map(p => ({ ...p, owned: false, img: 'art/' + p.img + '.webp', proofs: [] }))
];
const BY = Object.fromEntries(ALL.map(p => [p.id, p]));
const PK = { direct: 'Direct to people', reach: 'Reach', cost: 'Cost per person', stamina: 'Staying power', work: 'Proof of work', listen: 'Listening', growth: 'Growth', goal: 'The goal', levels: 'Ways in', next: "What's next", trust: 'Accountable' };
const LENS = { impact: ['reach', 'work', 'growth', 'listen'], direct: ['direct', 'cost'], record: ['stamina', 'trust'] };
const LENSNAME = { impact: 'Tangible impact', direct: 'Direct to people', record: 'Track record' };
function lens(p) {
  const ks = (p.proofs || []).map(x => x.k), lit = {};
  for (const L in LENS) lit[L] = LENS[L].some(k => ks.includes(k));
  if (!p.owned && p.proof) lit.impact = true;
  return lit;
}

// ---------- collections: five causes; a set completes when its cards are kept ----------
const AIP = ALL.filter(p => !p.owned && p.cat === 'ai').length;
const SUITS = [
  { id: 'scholars', name: 'Scholars', ids: ['ggp-scholars', 'cystem-scholars'], need: 2, how: 'Keep GGP Scholars and CYSTEM Scholars.' },
  { id: 'pathways', name: 'Pathways', ids: ['directory', 'flexible'], need: 2, how: 'Keep The Directory and Pipeline and The Continuing Fund.' },
  { id: 'gatherings', name: 'Gatherings', ids: ['zero-proof', 'gdc-tuesday', 'kiki'], need: 3, how: 'Keep Zero Proof, GDC Tuesday and The KiKi.' },
  { id: 'ai', name: 'AI with judgment', need: 2, how: 'Keep GGP AI Studio and any one AI partner program.' },
  { id: 'map', name: 'Partners map', need: 3, how: 'Keep any three partner programs.' }
];
const SUITNAME = Object.fromEntries(SUITS.map(s => [s.id, s.name]));
function suitOf(p) { const s = []; if (p.owned) { const f = SUITS.find(x => x.ids && x.ids.includes(p.id)); s.push(f ? f.id : 'ai'); } else { if (p.cat === 'ai') s.push('ai'); s.push('map'); } return s; }
function suitHave(s) {
  if (s.ids) return s.ids.filter(id => kept.includes(id)).length;
  if (s.id === 'ai') return (kept.includes('ai-studio') ? 1 : 0) + (kept.some(id => !BY[id].owned && BY[id].cat === 'ai') ? 1 : 0);
  return Math.min(s.need, kept.filter(id => !BY[id].owned).length);
}
const glyph = id => `<svg aria-hidden="true"><use href="#s-${id}"/></svg>`;
const PLAN = 'GGP 2026-27 Vision plan', EV = 'GGP event records', GDC = 'GGP GDC 2027 plan';
function suitSummary(s) {
  if (s.id === 'scholars') return { t: 'Two awards, two stages: $1,000 to each undergraduate GGP Scholar and $1,500 to each graduate CYSTEM Scholar, so $2,500 funds one of each. GGP Scholars is in its 8th year, CYSTEM Scholars in Year 5.', s: PLAN + '; the $2,500 sum is derived' };
  if (s.id === 'pathways') return { t: 'A free map of 76 programs into games, and a $100,000 flexible, multi-year campaign that keeps GGP with people after the introduction.', s: 'Directory data, release 2026-09-11; ' + PLAN };
  if (s.id === 'gatherings') return { t: '602 guests at Zero Proof in 2026, up from 487 in 2025 (+24%). About 150 guests planned for the 4th Annual Scholars Breakfast. The KiKi is new, so it has no numbers yet.', s: EV + '; ' + PLAN + '; the +24% is derived' };
  if (s.id === 'ai') return { t: `The AI Studio pilot: 20 people, 4 weeks, $1,250 a person ($25,000 / 20). Beside it, the Directory maps ${AIP} partner AI programs that GGP does not run.`, s: PLAN + '; per-person figure derived; count from Directory data' };
  const pk = kept.filter(id => !BY[id].owned), prov = new Set(pk.map(id => BY[id].provider)).size;
  return { t: `You kept ${pk.length} partner programs from ${prov} ${prov === 1 ? 'provider' : 'providers'}. GGP maps ${D.partners.length} programs it does not run so people can find them; give to those on their own pages.`, s: 'Count from your matches and Directory data' };
}
// one line per GGP card from GGP's own records, shown in More info
const LORE = {
  'ggp-scholars': ['The ESA Foundation and GGP have run a joint LGBTQ+ Service Scholarship since 2019.', 'ESA announcement', 'https://www.theesa.com/esa-hosts-gay-gaming-professionals-and-lgbt-congressional-staff-association/'],
  'cystem-scholars': ["This year's plan was shaped by 25 Year 1 Scholars who answered the exit survey.", 'CYSTEM Year 1 exit survey (GGP records)'],
  'directory': ['Take-Two is the lead supporter of The Directory.', PLAN],
  'ai-studio': ["GGP's plan puts AI empowerment first this year, and that includes the choice not to use a tool.", PLAN],
  'zero-proof': ['Every GGP event at GDC 2027 is alcohol-free.', GDC],
  'gdc-tuesday': ['Tuesday runs from a 9 am breakfast at Moscone to the GGP party that night, all alcohol-free.', GDC],
  'kiki': ["In GGP's year, summer is for connecting online. That is when the KiKi lives.", PLAN],
  'flexible': ['The plan includes a summer report back to every supporter.', PLAN]
};

// ---------- reading what the funder typed ----------
const SYN = [
  ['scholarships', 'scholarships', /scholar|tuition|award|college fund/],
  ['students', 'students', /student|college|undergrad|universit|school|educat|learner/],
  ['graduate', 'graduate students', /\bgrad|master|phd|doctor/],
  ['lgbtq', 'LGBTQ+ people', /lgbt|queer|\bgay|lesbian|\btrans|pride|nonbinary|bisexual/],
  ['belonging', 'belonging', /belong|inclus|underestimat|equit|access|divers|welcom/],
  ['ai', 'AI', /\bai\b|a\.i\.|artificial|machine learn|\bllm|generative/],
  ['careers', 'careers', /career|\bjob|work|hire|hiring|recruit|pipeline|employ|talent|workforce|intern/],
  ['hiring', 'hiring', /hire|hiring|recruit|talent|pipeline|people leader/],
  ['jobs', 'jobs', /\bjob|employ|intern|paid work/],
  ['youth', 'young people', /\bkid|youth|teen|child|high school|k-12|young/],
  ['making', 'making games', /\bmake|making|build|creat|design|game dev|develop/],
  ['events', 'events', /event|night|party|gather|breakfast|conference|mixer|in person/],
  ['gdc', 'GDC', /\bgdc|game developers conference|san francisco/],
  ['sober', 'alcohol-free spaces', /sober|alcohol|zero proof|all ages|board game/],
  ['community', 'community', /communit|gather|connect|network|\berg|employee resource|friend/],
  ['direct', 'money that reaches people', /direct|tangible|to people|in their hands|money goes|award/],
  ['efficient', 'efficiency and proof', /efficien|cost|leverage|per person|capital|\broi|impact|measur|outcome|proof|evidence|data/],
  ['flexible', 'flexible support', /flexib|general|operat|unrestrict|sustain|long.?term|multi.?year|organization|wherever/],
  ['mentorship', 'mentorship', /mentor|coach|guid|advice/],
  ['transition', 'career changers', /veteran|military|career chang|changer|adult|retrain|second career/],
  ['veterans', 'veterans', /veteran|military|service member/],
  ['black', 'Black creators', /\bblack|african/],
  ['latine', 'Latine creators', /latin|hispanic/],
  ['women', 'women and girls', /women|girl|female/],
  ['esports', 'esports', /esport|competit/],
  ['free', 'free access', /\bfree\b|no cost/],
  ['new', 'new ideas', /\bnew\b|pilot|founding|start/],
  ['degree', 'degree programs', /degree|\bbfa|\bmfa|universit/],
  ['learning', 'learning', /learn|course|tutorial|skill|train|teach/],
  ['educators', 'educators', /teacher|educator|classroom/]
];
const LABEL = Object.fromEntries(SYN.map(s => [s[0], s[1]]));
function read(q) {
  const s = ' ' + q.toLowerCase() + ' ';
  const hits = SYN.filter(([, , re]) => re.test(s));
  const words = s.split(/[^a-z0-9+]+/).filter(w => w.length > 3 && !/about|care|that|with|want|like|really|people|money|support|help|would|their|into/.test(w));
  return { tags: hits.map(h => h[0]), labels: [...new Set(hits.map(h => h[1]))], words };
}
let lastScore = {};
function score(p, R) {
  let s = 0; const why = [];
  for (const t of R.tags) if (p.tags.includes(t)) { s += 2; why.push(t); }
  const hay = (p.name + ' ' + p.line + ' ' + (p.does || '') + ' ' + (p.provider || '') + ' ' + (p.kind || '')).toLowerCase();
  for (const w of R.words) if (hay.includes(w)) s += 1;
  if (s > 0 && p.owned) s += 2;
  if (s > 0 && R.tags.includes('efficient')) s += ((p.proofs || []).length + (p.proof ? 1 : 0)) * 0.8;
  return { s, why };
}
let queue = [], pos = 0, whyMap = {}, matchShown = false;
function deal(q, shared) {
  q = (q || '').trim();
  let cards, R = null;
  if (shared) {
    cards = shared.map(id => BY[id]);
    lastScore = Object.fromEntries(ALL.map(p => [p.id, shared.includes(p.id) ? 2 : (p.owned ? 1 : 0)]));
  } else if (!q) {
    cards = ALL.filter(p => p.owned);
    lastScore = Object.fromEntries(ALL.map(p => [p.id, p.owned ? 1 : 0]));
  } else {
    R = read(q);
    const sc = ALL.map(p => ({ p, ...score(p, R) }));
    lastScore = Object.fromEntries(sc.map(x => [x.p.id, x.s]));
    cards = sc.filter(x => x.s > 0).sort((a, b) => b.s - a.s || (b.p.owned - a.p.owned)).slice(0, 16).map(x => ({ ...x.p, why: x.why }));
  }
  summary(q, R, cards, shared);
  queue = cards.map(c => c.id);
  whyMap = Object.fromEntries(cards.map(c => [c.id, c.why || []]));
  pos = 0; renderStack(); renderArchive();
}
function summary(q, R, cards, shared) {
  const o = $('#oracle');
  const g = cards.filter(c => c.owned).length, pt = cards.length - g;
  let html;
  if (shared) html = `<p class="tagline">Someone shared their picks</p><p>${cards.length} ${cards.length === 1 ? 'program' : 'programs'}: ${cards.map(c => esc(c.name)).join(', ')}. You see them first; keep the ones that fit you too.</p>`;
  else if (!q) html = `<p class="tagline">GGP's own eight</p><p>The programs a gift to GGP funds, each with its numbers and where they come from.</p>`;
  else if (!cards.length) html = `<p class="tagline">No matches yet</p><p>We could not place "${esc(q)}". Try a chip, or name a group of people, a stage of life, or a kind of proof you trust.</p>`;
  else {
    const L = R.labels.length ? R.labels.slice(0, 4).join(', ').replace(/, ([^,]*)$/, ' and $1') : 'what you wrote';
    html = `<p class="tagline">${cards.length} matches</p><p>You care about <b>${esc(L)}</b>. That is <b>${g}</b> GGP ${g === 1 ? 'program' : 'programs'} a gift to GGP funds and <b>${pt}</b> partner ${pt === 1 ? 'program' : 'programs'} GGP maps but does not run. Top match: <b>${esc(cards[0].name)}</b>.</p>`;
  }
  o.innerHTML = html + (cards.length && PHONE() ? `<a class="btn btn-soft go" href="#deal">See the cards ${ico('arrow')}</a>` : '');
  const go = o.querySelector('.go'); if (go) go.onclick = e => { e.preventDefault(); toStack(); };
  $('#dealMeta').textContent = shared ? `${cards.length} shared picks` : !cards.length ? 'No matches yet.' : q ? `${cards.length} matches for "${q}"` : "GGP's own eight";
}

// ---------- card markup ----------
function proofHTML(p) {
  if (p.owned) {
    if (!p.proofs.length) return `<div class="noproof"><b>No numbers yet.</b> ${esc(p.ask || 'Ask GGP.')}</div>`;
    return `<div class="proofs">${p.proofs.map(x => `<div class="proof${String(x.big).length > 8 ? ' long' : ''}"><div class="pb">${esc(x.big)}</div><div class="pk">${esc(PK[x.k] || x.k)} ${x.derived ? DERIVED : BADGE}</div><div class="pl">${esc(x.label)}</div></div>`).join('')}</div>`;
  }
  if (p.proof) return `<div class="noproof"><b>Provider reports:</b> ${esc(p.proof.text)}</div>`;
  return `<div class="noproof"><b>No outcome numbers in the Directory yet.</b> Ask ${esc(p.provider)} directly.</div>`;
}
function lensHTML(p) {
  const l = lens(p);
  return `<div class="lens" aria-label="Funder lens">${Object.keys(LENS).map(k => `<span class="pip${l[k] ? ' lit' : ''}">${l[k] ? ico('check') : ''}${LENSNAME[k]}${l[k] ? '' : ': no sourced number yet'}</span>`).join('')}</div>`;
}
function backHTML(p) {
  if (p.owned) {
    const lo = LORE[p.id];
    return `<p class="eyebrow">GGP runs this: ${esc(p.kind)}</p><h3 id="detailTitle">${esc(p.name)}</h3>
      ${lo ? `<div class="lore">${ico('play')}<p><b>From the record.</b> ${esc(lo[0])} <span class="src">${lo[2] ? `<a href="${esc(lo[2])}" target="_blank" rel="noopener">${esc(lo[1])} ↗</a>` : esc(lo[1])}</span></p></div>` : ''}
      <h4>About</h4><p>${esc(p.does)}</p>
      <h4>Who it serves</h4><p>${esc(p.level)}</p>
      ${p.proofs.length ? `<h4>Where the numbers come from</h4><ul>${p.proofs.map(x => `<li><b>${esc(x.big)}</b> ${esc(x.label)}. <span class="src">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.src)} ↗</a>` : esc(x.src)}</span></li>`).join('')}</ul>` : `<h4>Numbers</h4><p>${esc(p.ask || 'Ask GGP.')}</p>`}
      ${(p.trust || []).length ? `<h4>Public receipts</h4><ul>${p.trust.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join('')}</ul>` : ''}
      ${p.video ? `<h4>Watch</h4><p><a href="https://www.youtube.com/watch?v=${esc(p.video)}" target="_blank" rel="noopener">GGP film on YouTube ↗</a></p>` : ''}`;
  }
  return `<p class="eyebrow">Partner program: ${esc(p.catName)}</p><h3 id="detailTitle">${esc(p.name)}</h3>
    <p><b>Run by ${esc(p.provider)}.</b> GGP does not run this program; the GGP Directory maps it so people can find it.</p>
    <h4>About</h4><p>${esc(p.line)}</p>
    <h4>Who it serves</h4><p>${esc(p.eligibility)}</p>
    <h4>Cost and status</h4><p>${esc(p.cost)}${SEP}${esc(p.status)}</p>
    ${p.proof ? `<h4>Provider-reported</h4><p>${esc(p.proof.text)} <a href="${esc(p.proof.url)}" target="_blank" rel="noopener">Source ↗</a></p>` : ''}
    <h4>Links</h4><ul><li><a href="${esc(p.url)}" target="_blank" rel="noopener">Official page ↗</a></li>${p.donation ? `<li><a href="${esc(p.donation.url)}" target="_blank" rel="noopener">Give to ${esc(p.donation.recipient)} ↗</a> <span class="src">${esc(p.donation.scope)}</span></li>` : ''}</ul>
    <p class="src">Directory review ${esc(p.checked)}</p>`;
}
function cardHTML(p) {
  const why = (whyMap[p.id] || []).map(t => LABEL[t] || t);
  const suits = suitOf(p).map(s => SUITNAME[s]).join(' and ');
  return `<div class="flipper">
    <article class="face front" aria-label="${esc(p.name)}">
      <div class="photo" style="background-image:url(${p.img})">
        <span class="who ${p.owned ? 'ggp' : 'partner'}">${p.owned ? 'GGP runs this' : 'Partner, GGP maps it'}</span>
        <span class="illus">illustration</span>
        <div class="ptitle"><h3>${esc(p.name)}</h3><div class="kind"><span class="suitmark" title="Collection: ${esc(suits)}">${suitOf(p).map(glyph).join('')}</span>${esc(p.owned ? p.kind : p.catName)}<span class="sr">. Collection: ${esc(suits)}</span></div></div>
      </div>
      <div class="body">
        ${why.length ? `<p class="matched">${why.slice(0, 3).map(w => `<span>${esc(w)}</span>`).join('')}</p>` : ''}
        <p class="line">${esc(p.line)}</p>
        ${proofHTML(p)}
      </div>
      <span class="stamp keep" aria-hidden="true">KEEP</span><span class="stamp pass" aria-hidden="true">PASS</span>
    </article>
    <article class="face back">${backHTML(p)}<button type="button" class="btn btn-soft close-info">Back to the card</button></article>
  </div>`;
}

// ---------- stack + physics ----------
const stack = $('#stack');
function renderStack() {
  stack.innerHTML = '';
  const left = queue.length - pos;
  $('#btnPass').disabled = $('#btnKeep').disabled = $('#btnFlip').disabled = left <= 0;
  if (left <= 0) {
    const n = kept.length;
    $('#dealCount').textContent = '';
    stack.style.height = '';
    stack.innerHTML = `<div class="done"><div><h3>You're all caught up.</h3><p>${queue.length ? `You have ${n} ${n === 1 ? 'match' : 'matches'}.` : ''}</p><a class="btn btn-primary" href="#hand">See my matches</a><button type="button" class="btn btn-soft" id="again">Try another interest</button></div></div>`;
    $('#again').onclick = () => { $('#discover').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); $('#askInput').focus({ preventScroll: true }); };
    return;
  }
  if (left > 2) { const g = document.createElement('div'); g.className = 'ghost'; g.style.transform = 'translateY(22px) scale(.9)'; stack.append(g); }
  for (let k = Math.min(1, left - 1); k >= 0; k--) {
    const p = BY[queue[pos + k]];
    const el = document.createElement('div');
    el.className = 'card' + (k ? ' under' : ' top');
    el.dataset.id = p.id;
    el.innerHTML = cardHTML(p);
    el.style.transform = `translateY(${k * 12}px) scale(${1 - k * 0.05})`;
    el.style.zIndex = 10 - k;
    if (k) el.setAttribute('aria-hidden', 'true');
    stack.append(el);
    if (!k) bindDrag(el);
  }
  fitStack();
  $('#dealCount').textContent = `${pos + 1} of ${queue.length}`;
}
function top() { return stack.querySelector('.card.top'); }
// size the stack to the card's own content so nothing is cut and the buttons never cover a proof
function fitStack() {
  const t = top(); if (!t) return;
  const ph = t.querySelector('.photo'), bd = t.querySelector('.body');
  ph.style.flexBasis = '';
  bd.style.flex = 'none'; const body = bd.offsetHeight; bd.style.flex = '';
  let photo = ph.offsetHeight;
  // the room on screen between the bar and the buttons; the stack keeps one height so the buttons stay put
  const room = innerHeight - $('.appbar').offsetHeight - $('.deal-head').offsetHeight - $('.controls').offsetHeight - (PHONE() ? 66 + 34 : 120);
  if (photo + body > room && photo > 150) { photo = Math.max(150, room - body); ph.style.flexBasis = photo + 'px'; }
  stack.style.height = Math.max(photo + body + 2, Math.min(room, PHONE() ? 640 : 680), 380) + 'px';
}
addEventListener('resize', () => fitStack());
document.fonts && document.fonts.ready.then(() => fitStack());
function bindDrag(el) {
  let sx = 0, sy = 0, dx = 0, dy = 0, t0 = 0, down = false, moved = false;
  const keepS = el.querySelector('.stamp.keep'), passS = el.querySelector('.stamp.pass');
  el.querySelector('.close-info').onclick = e => { e.stopPropagation(); flip(); };
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('a,button') || (el.classList.contains('turned') && e.target.closest('.back'))) return;
    down = true; moved = false; sx = e.clientX; sy = e.clientY; dx = dy = 0; t0 = performance.now();
    el.setPointerCapture(e.pointerId); el.style.transition = 'none';
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    el.style.transform = `translate(${dx}px,${dy * 0.2}px) rotate(${dx * 0.05}deg)`;
    const a = Math.min(1, Math.abs(dx) / 100);
    keepS.style.opacity = dx > 0 ? a : 0; passS.style.opacity = dx < 0 ? a : 0;
  });
  const up = e => {
    if (!down) return; down = false;
    const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
    if (!moved) { if (e.type === 'pointerup') flip(); el.style.transform = ''; return; }
    if (Math.abs(dx) > 100 || (v > 0.6 && Math.abs(dx) > 40)) decide(dx > 0, dx, dy);
    else { el.style.transition = RM ? 'none' : 'transform .45s cubic-bezier(.3,1.5,.5,1)'; el.style.transform = ''; keepS.style.opacity = passS.style.opacity = 0; }
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
function flip() { const el = top(); if (!el) return; el.classList.toggle('turned'); press('#btnFlip'); sfx('flip'); const b = el.querySelector('.face.back'); if (el.classList.contains('turned')) b.scrollTop = 0; else if (stack.getBoundingClientRect().top < $('.appbar').offsetHeight) toStack(true); }
let busy = false;
function press(id) { const b = $(id); if (!b) return; b.classList.add('pressed'); setTimeout(() => b.classList.remove('pressed'), 160); }
function decide(keep, dx = 0, dy = 0) {
  const el = top(); if (!el || busy) return;
  busy = true; press(keep ? '#btnKeep' : '#btnPass');
  const id = el.dataset.id;
  const s = el.querySelector(keep ? '.stamp.keep' : '.stamp.pass'); if (s) s.style.opacity = 1;
  if (!keep) { sfx('flip'); buzz(6); }
  el.style.transition = RM ? 'none' : 'transform .4s cubic-bezier(.4,.1,.6,1), opacity .4s';
  el.style.transform = `translate(${(keep ? 1 : -1) * innerWidth * 1.1}px,${dy * 0.2 - 30}px) rotate(${(keep ? 1 : -1) * 24}deg)`;
  el.style.opacity = '0';
  stack.querySelectorAll('.card.under').forEach(u => { u.style.transition = RM ? 'none' : 'transform .45s cubic-bezier(.3,1.4,.5,1)'; u.style.transform = 'none'; });
  const matched = keep && (whyMap[id] || []).length > 0;
  if (keep) { addKeep(id, matched); sfx('stamp'); buzz(14); flyToHand(el); }
  setTimeout(() => { pos++; busy = false; renderStack(); }, RM ? 0 : 340);
  $('#dealLive').textContent = keep ? `Kept: ${BY[id].name}` : `Passed: ${BY[id].name}`;
}
function countEl() { return $$('[data-count]').find(e => e.offsetParent !== null && !e.hidden) || null; }
// a small copy of the photo flies to the Matches count
function flyToHand(el) {
  const badge = countEl(); if (!badge) return;
  bump(badge);
  if (RM) return;
  const a = el.querySelector('.photo'); if (!a) return;
  const r = a.getBoundingClientRect(), b = badge.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'fly'; f.style.backgroundImage = a.style.backgroundImage;
  f.style.left = r.left + r.width / 2 - 29 + 'px'; f.style.top = r.top + r.height / 2 - 36 + 'px';
  document.body.append(f);
  const dx = b.left + b.width / 2 - (r.left + r.width / 2), dy = b.top + b.height / 2 - (r.top + r.height / 2);
  f.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .5}px,${dy * .45 - 50}px) rotate(10deg) scale(.75)`, opacity: 1, offset: .55 }, { transform: `translate(${dx}px,${dy}px) rotate(18deg) scale(.2)`, opacity: .2 }], { duration: 620, easing: 'cubic-bezier(.4,.1,.5,1)' }).onfinish = () => f.remove();
}
function bump(n) { if (RM || !n) return; n.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 420, delay: 420, easing: 'cubic-bezier(.3,1.6,.5,1)' }); }
$('#btnKeep').onclick = () => decide(true);
$('#btnPass').onclick = () => decide(false);
$('#btnFlip').onclick = flip;
addEventListener('keydown', e => {
  if (e.target.closest('input,select,textarea,dialog') || $('#detail').open || !$('#thanks').hidden || !$('#flourish').hidden) return;
  const r = $('#deal').getBoundingClientRect();
  if (r.bottom < 80 || r.top > innerHeight - 120) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); decide(true); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); decide(false); }
  else if ((e.key === ' ' && !e.target.closest('button,a')) || e.key === 'i' || e.key === 'I') { e.preventDefault(); flip(); }
});

// ---------- matches ----------
const KEY = 'ggp-patron-deck-v1';
let kept = [], matchedIds = [];
try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(v)) kept = v.filter(id => BY[id]); } catch (e) { }
function save() { try { localStorage.setItem(KEY, JSON.stringify(kept)); } catch (e) { } }
function addKeep(id, matched) {
  if (kept.includes(id)) return;
  const before = SUITS.filter(s => suitHave(s) >= s.need).map(s => s.id);
  kept.push(id); if (matched) matchedIds.push(id); save(); renderHand();
  const done = SUITS.filter(s => suitHave(s) >= s.need && !before.includes(s.id));
  if (done.length) setTimeout(() => moment('suit', done[0], id), RM ? 0 : 420);
  else if (matched && !matchShown) { matchShown = true; setTimeout(() => moment('match', null, id), RM ? 0 : 420); }
}
// the match moment: once for the first kept card that fits what you said, and whenever a collection completes
function moment(kind, s, id) {
  const p = BY[id], f = $('#flourish');
  sfx('chime'); buzz(kind === 'suit' ? [18, 60, 26] : [12, 40, 12]);
  const why = (whyMap[id] || []).map(t => LABEL[t] || t).slice(0, 3);
  const body = kind === 'suit'
    ? `<p class="eyebrow" style="color:#f7d9e6">Collection complete</p><h2 id="flTitle">${esc(s.name)}</h2><p>${esc(suitSummary(s).t)}</p><p class="src">${esc(suitSummary(s).s)}</p>`
    : `<h2 id="flTitle">It's a match</h2><p><b>${esc(p.name)}</b> fits what you said you care about: ${esc(why.join(', '))}.</p>`;
  f.innerHTML = `<div class="fl-in"><div class="fl-pics"><span style="background-image:url(${p.img})"></span><span>${kind === 'suit' ? `<svg aria-hidden="true" style="color:#66328c"><use href="#s-${s.id}"/></svg>` : ico('heart')}</span></div>${body}<div class="fl-acts"><button type="button" class="btn btn-primary" id="flGo">Keep going</button><a class="btn btn-soft" href="#hand" id="flHand">See my matches</a></div></div>`;
  f.hidden = false; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on');
  const close = () => { f.hidden = true; };
  $('#flGo').onclick = () => { close(); stack.focus({ preventScroll: true }); };
  $('#flHand').onclick = close;
  f.onclick = e => { if (e.target === f) close(); };
  $('#flGo').focus({ preventScroll: true });
  $('#dealLive').textContent = kind === 'suit' ? `Collection complete: ${s.name}.` : `It's a match: ${p.name}.`;
}
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#flourish').hidden) $('#flourish').hidden = true; });
function renderSuits() {
  const n = SUITS.filter(s => suitHave(s) >= s.need).length;
  const C = 2 * Math.PI * 24, seg = C / 5, gap = 5;
  $('#ringSegs').innerHTML = SUITS.map((s, i) => {
    const fr = Math.min(1, suitHave(s) / s.need), rot = -90 + i * 72 + (gap / C) * 180;
    return `<circle class="trk" cx="30" cy="30" r="24" stroke-dasharray="${seg - gap} ${C}" transform="rotate(${rot} 30 30)"/>${fr > 0 ? `<circle class="fil${fr >= 1 ? ' full' : ''}" cx="30" cy="30" r="24" stroke-dasharray="${(seg - gap) * fr} ${C}" transform="rotate(${rot} 30 30)"/>` : ''}`;
  }).join('');
  $('#ringNum').textContent = n;
  $('#meterS').textContent = `${n} of 5 collections`;
  $('#suitList').innerHTML = SUITS.map(s => {
    const h = Math.min(s.need, suitHave(s)), full = h >= s.need, sm = full ? suitSummary(s) : null;
    return `<div class="suit${full ? ' full' : ''}">${glyph(s.id)}<div><h4>${esc(s.name)} <span class="pips" role="img" aria-label="${h} of ${s.need} kept">${Array.from({ length: s.need }, (_, i) => `<i class="${i < h ? 'on' : ''}"></i>`).join('')}</span></h4>${full ? `<p>${esc(sm.t)}</p><p class="src">${esc(sm.s)}</p>` : `<p class="how">${esc(s.how)}</p>`}</div></div>`;
  }).join('');
}
function renderHand() {
  const n = kept.length;
  $$('[data-count]').forEach(c => { c.textContent = n; c.hidden = !n; });
  renderSuits();
  $('#share').hidden = !n;
  const list = $('#handList');
  if (!n) { list.innerHTML = '<p class="empty">Keep a card and it shows up here. Your matches stay in this browser only.</p>'; renderPossible(); return; }
  const g = kept.filter(id => BY[id].owned).length;
  list.innerHTML = `<p class="sumline">${n} ${n === 1 ? 'match' : 'matches'}: ${g} GGP ${g === 1 ? 'program' : 'programs'} a gift to GGP funds${n - g ? `, and ${n - g} partner ${n - g === 1 ? 'program' : 'programs'} to support on their own pages` : ''}.</p>` +
    kept.slice().reverse().map(id => {
      const p = BY[id], m = matchedIds.includes(id), pr = p.owned ? (p.proofs[0] ? `${p.proofs[0].big} ${p.proofs[0].label}` : p.line) : `Run by ${p.provider}. ${p.line}`;
      return `<div class="held"><div class="t${m ? ' match' : ''}" style="background-image:url(${p.img})"></div><h4>${esc(p.name)}${m ? '<span class="mt">Match</span>' : ''}</h4><p>${esc(pr)}</p><div class="acts">${p.owned ? `<a class="talkto" href="${esc(D.calendly)}" target="_blank" rel="noopener">Talk to GGP</a>` : `<a href="${esc((p.donation || {}).url || p.url)}" target="_blank" rel="noopener">${p.donation ? 'Give to them ↗' : 'Their page ↗'}</a>`}<button type="button" data-open="${p.id}">Details</button><button type="button" data-drop="${p.id}" aria-label="Remove ${esc(p.name)}">Remove</button></div></div>`;
    }).join('');
  list.querySelectorAll('[data-drop]').forEach(b => b.onclick = () => { kept = kept.filter(x => x !== b.dataset.drop); save(); renderHand(); toast('Removed from your matches'); });
  list.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
  renderPossible();
}

// ---------- what gifts like yours make possible (sourced program facts only) ----------
let amount = 1000;
const PLANS = 'GGP 2026-27 plan';
function possibleLines(a) {
  const L = [], k = id => kept.includes(id), sch = a / 1000;
  L.push({ id: 'ggp-scholars', t: sch >= 1 ? `${fmt(a)} is the size of ${Math.floor(sch) === 1 ? 'one GGP Scholars award' : Math.floor(sch) + ' GGP Scholars awards'} ($1,000 each).` : `${fmt(a)} is ${Math.round(sch * 100)}% of one GGP Scholars award ($1,000).`, s: PLANS });
  const cy = Math.floor(a / 1500);
  if (cy >= 1) L.push({ id: 'cystem-scholars', t: `${fmt(a)} is the size of ${cy === 1 ? 'one CYSTEM Scholars award' : cy + ' CYSTEM Scholars awards'} ($1,500 each, for graduate students).`, s: PLANS });
  const seats = Math.floor(a / 1250);
  L.push({ id: 'ai-studio', t: seats >= 1 ? `The proposed AI Studio pilot works out to $1,250 per participant, so ${fmt(a)} matches ${Math.min(seats, 20)} of its 20 seats${seats >= 20 ? ': the whole pilot' : ''}.` : `The proposed AI Studio pilot works out to $1,250 per participant ($25,000 for 20 people).`, s: PLANS + ', derived' });
  const lv = [[25000, 'Champion'], [10000, 'All-Star'], [5000, 'Supporter'], [1500, 'Friend']].find(([v]) => a >= v);
  L.push({ id: 'zero-proof', t: lv ? `At ${fmt(lv[0])}, a supporter is a ${lv[1]} of a GDC night like Zero Proof Board Game Night (602 guests in 2026).` : `GDC night support starts at $1,500 (Friend). Zero Proof Board Game Night welcomed 602 guests in 2026.`, s: 'GGP GDC 2027 support levels; event records' });
  if (a >= 1500) { const b = [[10000, 'Presenting Supporter'], [5000, 'Breakfast Supporter'], [1500, 'Breakfast Friend']].find(([v]) => a >= v); L.push({ id: 'gdc-tuesday', t: `${fmt(b[0])} is the ${b[1]} level of the Scholars Breakfast, goal $13,250.`, s: 'GGP GDC 2027 support levels' }); }
  L.push({ id: 'flexible', t: `${fmt(a)} is ${+(a / 1000).toFixed(2)}% of GGP's $100,000 flexible, multi-year campaign that keeps every program going.`, s: PLANS });
  L.push({ id: 'directory', t: `Flexible gifts also keep the Directory free: ${D.ggp.find(x => x.id === 'directory').proofs[0].big} programs mapped so far.`, s: 'Directory data' });
  return L.sort((x, y) => (k(y.id) - k(x.id)));
}
function renderPossible() {
  $$('.amt').forEach(b => b.classList.toggle('on', +b.dataset.amt === amount));
  $('#possible').innerHTML = `<ul>${possibleLines(amount).slice(0, 4).map(l => `<li>${esc(l.t)}<span class="src">${esc(l.s)}${kept.includes(l.id) ? ', in your matches' : ''}</span></li>`).join('')}</ul>`;
}
$$('.amt').forEach(b => b.onclick = () => { amount = +b.dataset.amt; renderPossible(); });
$$('[data-give]').forEach(a => a.addEventListener('click', () => {
  const L = possibleLines(amount).slice(0, 3), g = kept.filter(id => BY[id].owned).map(id => BY[id].name);
  $('#thanksList').innerHTML = L.map(l => `<li>${esc(l.t)}</li>`).join('') + (g.length ? `<li>You kept ${esc(g.join(', '))}. Tell GGP on a 20-minute call if you want your gift pointed there.</li>` : '');
  setTimeout(() => { $('#thanks').hidden = false; $('#thanksClose').focus(); }, 250);
}));
$('#thanksClose').onclick = () => { $('#thanks').hidden = true; $('#hand').scrollIntoView(); };
$('#thanks').addEventListener('click', e => { if (e.target.id === 'thanks') $('#thanks').hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#thanks').hidden) $('#thanks').hidden = true; });
$('#copyHand').onclick = async () => {
  const lines = ['My matches from GGP Match', ''].concat(kept.map(id => { const p = BY[id]; return `- ${p.name} (${p.owned ? 'GGP' : 'run by ' + p.provider}): ${p.owned ? p.does : p.url}`; }), ['', 'Give: ' + D.zeffy, 'Talk to GGP: ' + D.calendly]);
  try { await navigator.clipboard.writeText(lines.join('\n')); toast('Copied. Paste it into a note or an email.'); }
  catch (e) { toast('Copy is blocked in this browser.'); }
};
// share: the picks ride in the link's hash; no server, no tracking
function handLink() { return location.origin + location.pathname + '#hand=' + kept.join(','); }
$('#shareLink').onclick = async () => {
  const url = handLink();
  if (navigator.share && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ title: 'My GGP Match picks', text: 'The programs I kept. Open it and you see them first.', url }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); toast('Link copied. Whoever opens it sees your picks first.'); }
  catch (e) { prompt('Copy this link:', url); }
};
// "My GGP Matches": an image drawn in the browser from the kept cards
const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
function cover(x, img, dx, dy, dw, dh) { const s = Math.max(dw / img.width, dh / img.height), sw = dw / s, sh = dh / s; x.drawImage(img, (img.width - sw) / 2, (img.height - sh) * .4, sw, sh, dx, dy, dw, dh); }
function rr(x, X, Y, W, H, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + W, Y, X + W, Y + H, r); x.arcTo(X + W, Y + H, X, Y + H, r); x.arcTo(X, Y + H, X, Y, r); x.arcTo(X, Y, X + W, Y, r); x.closePath(); }
function clip(x, t, w) { if (x.measureText(t).width <= w) return t; while (t.length && x.measureText(t + '...').width > w) t = t.slice(0, -1); return t + '...'; }
async function handImage() {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const V = '#66328c', PINK = '#d81c61', INK = '#17141d', MUT = '#686174', F = '"Plus Jakarta Sans", system-ui, sans-serif';
  x.fillStyle = '#f5f4f8'; x.fillRect(0, 0, W, H);
  x.fillStyle = V; rr(x, 72, 80, 64, 64, 18); x.fill(); x.fillStyle = '#fff'; x.font = `800 36px ${F}`; x.textAlign = 'center'; x.fillText('G', 104, 125);
  x.textAlign = 'left'; x.fillStyle = INK; x.font = `800 34px ${F}`; x.fillText('GGP Match', 156, 124);
  x.font = `800 84px ${F}`; x.fillText('My matches', 72, 250);
  x.fillStyle = MUT; x.font = `500 32px ${F}`;
  const full = SUITS.filter(s => suitHave(s) >= s.need).map(s => s.name);
  x.fillText(`${kept.length} ${kept.length === 1 ? 'program' : 'programs'} kept${full.length ? ', ' + full.length + ' ' + (full.length === 1 ? 'collection' : 'collections') + ' complete' : ''}`, 72, 302);
  const show = kept.slice(0, 6), imgs = await Promise.all(show.map(id => loadImg(BY[id].img)));
  const cols = 2, cw = 456, chh = 250, gap = 24;
  show.forEach((id, i) => {
    const X = 72 + (i % cols) * (cw + gap), Y = 350 + Math.floor(i / cols) * (chh + gap), p = BY[id];
    x.save(); x.shadowColor = 'rgba(23,20,29,.12)'; x.shadowBlur = 30; x.shadowOffsetY = 10; x.fillStyle = '#fff'; rr(x, X, Y, cw, chh, 32); x.fill(); x.restore();
    x.save(); rr(x, X, Y, cw, chh, 32); x.clip(); if (imgs[i]) cover(x, imgs[i], X, Y, cw, chh); const g = x.createLinearGradient(0, Y + chh * .35, 0, Y + chh); g.addColorStop(0, 'rgba(10,6,16,0)'); g.addColorStop(1, 'rgba(10,6,16,.82)'); x.fillStyle = g; x.fillRect(X, Y, cw, chh); x.restore();
    x.fillStyle = p.owned ? V : 'rgba(255,255,255,.92)'; rr(x, X + 20, Y + 20, p.owned ? 176 : 112, 40, 20); x.fill(); x.fillStyle = p.owned ? '#fff' : INK; x.font = `700 21px ${F}`; x.fillText(p.owned ? 'GGP runs this' : 'Partner', X + 36, Y + 47);
    x.fillStyle = '#fff'; x.font = `800 32px ${F}`; x.fillText(clip(x, p.name, cw - 40), X + 22, Y + chh - 28);
  });
  if (kept.length > show.length) { x.fillStyle = MUT; x.font = `600 28px ${F}`; x.fillText(`and ${kept.length - show.length} more`, 72, 350 + 3 * (chh + gap) + 10); }
  x.fillStyle = PINK; x.beginPath(); x.arc(96, H - 120, 12, 0, 7); x.fill();
  x.fillStyle = INK; x.font = `700 26px ${F}`; x.fillText('Gay Gaming Professionals', 124, H - 111);
  x.fillStyle = MUT; x.font = `500 22px ${F}`; x.fillText('GG Professionals Inc., a 501(c)(3), EIN 83-2884652. Photos are illustrations.', 72, H - 66);
  return c;
}
$('#handImage').onclick = async () => {
  if (document.fonts) await document.fonts.ready;
  const url = (await handImage()).toDataURL('image/png'), d = $('#detail');
  $('#detailBody').innerHTML = `<div class="dbody handimg"><p class="eyebrow">Made in your browser</p><h3 id="detailTitle">My matches</h3><img src="${url}" alt="Your matches: ${esc(kept.map(id => BY[id].name).join(', '))}" width="1080" height="1350"><a class="btn btn-primary keepit" href="${url}" download="my-ggp-matches.png">Save the image</a><p class="src">Photos are illustrations made with Higgsfield. Nothing leaves your device until you share it.</p></div>`;
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  $('#detailClose').focus({ preventScroll: true });
};

// ---------- explore ----------
const cats = [...new Set(D.partners.map(p => p.catName))].sort();
$('#fCat').insertAdjacentHTML('beforeend', '<option value="GGP">GGP programs</option>' + cats.map(c => `<option>${esc(c)}</option>`).join(''));
$('#filters').hidden = false;
['fSearch', 'fRun', 'fCat', 'fProof', 'fSort'].forEach(id => $('#' + id).addEventListener('input', renderArchive));
function renderArchive() {
  const q = $('#fSearch').value.trim().toLowerCase(), run = $('#fRun').value, c = $('#fCat').value, pr = $('#fProof').value, so = $('#fSort').value;
  let L = ALL.filter(p => (run === 'all' || (run === 'ggp') === p.owned)
    && (c === 'all' || (c === 'GGP' ? p.owned : p.catName === c))
    && (pr === 'all' || (p.proofs.length || p.proof))
    && (!q || (p.name + ' ' + p.line + ' ' + (p.provider || '') + ' ' + (p.kind || '') + ' ' + (p.does || '') + ' ' + p.tags.join(' ')).toLowerCase().includes(q)));
  if (so === 'name') L.sort((a, b) => a.name.localeCompare(b.name));
  else if (so === 'kind') L.sort((a, b) => (a.owned ? 'A' : a.catName).localeCompare(b.owned ? 'A' : b.catName) || a.name.localeCompare(b.name));
  else L.sort((a, b) => (lastScore[b.id] || 0) - (lastScore[a.id] || 0) || (b.owned - a.owned));
  $('#archiveCount').textContent = `${L.length} of ${ALL.length} programs shown. ${ALL.filter(p => p.owned).length} run by GGP; the rest are partner programs GGP maps but does not run.`;
  $('#rows').innerHTML = L.map(p => `<button type="button" class="row" data-open="${p.id}"><span class="t" style="background-image:url(${p.img})"></span><span><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p><span class="meta">${p.owned ? esc(p.kind) : esc(p.provider) + SEP + esc(p.catName)}${(p.proofs.length || p.proof) ? SEP + '<span class="proofmark">Sourced number</span>' : ''}</span></span><span class="tag ${p.owned ? 'ggp' : 'partner'}">${p.owned ? 'GGP' : 'Partner'}</span></button>`).join('') || '<p class="empty">Nothing matches. Clear a filter.</p>';
  $('#rows').querySelectorAll('[data-open]').forEach(b => b.onclick = () => { openDetail(b.dataset.open); seen.add(b.dataset.open); renderSecret(); });
}
// ---------- the hidden card: found by exploring ----------
const seen = new Set(), SEC = 'ggp-patron-deck-secret';
let found = false; try { found = localStorage.getItem(SEC) === '1'; } catch (e) { }
function renderSecret() {
  const s = $('#secret'); s.hidden = false;
  const open = found || seen.size >= 3, n = Math.min(3, seen.size), st = found ? 'found' : open ? 'ready' : 'n' + n;
  if (s.dataset.state === st) return; s.dataset.state = st;
  const face = `<div class="secret-face"><p class="eyebrow">The card that is not in the stack</p><h3>The hands that carry it</h3>
    <p>GGP's 2026-27 plan names it as a priority in plain words: a team that carries the work.</p>
    <p>Every card here reached you because people carried it: the Scholars who applied and came back, the 25 Year 1 CYSTEM Scholars whose survey answers shaped this year's plan, the people who host and cook for GDC week, every supporter who said yes, and the team behind the plan.</p>
    <p class="ty">Thank you.</p>
    <p class="src">GGP 2026-27 Vision plan, priority 2; CYSTEM Year 1 exit survey (GGP records)</p></div>`;
  if (found) { s.innerHTML = face; return; }
  s.innerHTML = `<button type="button" class="secret-card${open ? ' ready' : ''}" id="secretBtn"${open ? '' : ' aria-disabled="true"'}><span class="secret-back">${ico(open ? 'heart' : 'lock')}<span class="secret-t">${open ? 'You found a hidden card. Tap to open it.' : `One card is not in the stack. Open ${3 - n} more ${3 - n === 1 ? 'program' : 'programs'} in Explore to unlock it.`}</span><span class="pips" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span></span></button>`;
  if (open) $('#secretBtn').onclick = () => { found = true; try { localStorage.setItem(SEC, '1'); } catch (e) { } sfx('chime'); buzz([10, 40, 20]); renderSecret(); const c = s.firstElementChild; if (!RM && c) c.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,1.3,.4,1)' }); };
}
function openDetail(id) {
  const p = BY[id], d = $('#detail');
  $('#detailBody').innerHTML = `<div class="dart" style="background-image:url(${p.img})" role="img" aria-label="Illustration"></div><div class="dbody">${backHTML(p)}${p.owned ? `<h4>Proof</h4>${proofHTML(p)}` : ''}<h4>Funder lens</h4>${lensHTML(p)}<button type="button" class="btn btn-primary keepit" id="keepFromDetail">${kept.includes(id) ? 'In your matches' : `${ico('heart')}Keep`}</button></div>`;
  $('#keepFromDetail').onclick = () => { addKeep(id, false); $('#keepFromDetail').textContent = 'In your matches'; sfx('stamp'); toast('Kept: ' + p.name); };
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  $('#detailBody').scrollTop = 0; $('#detailClose').focus({ preventScroll: true });
}
$('#detailClose').onclick = () => $('#detail').close();
$('#detail').addEventListener('click', e => { if (e.target.id === 'detail') $('#detail').close(); });

// ---------- ask ----------
function toStack(quiet) { const h = document.documentElement; h.style.scrollBehavior = 'auto'; const y = $('#deal').getBoundingClientRect().top + scrollY - $('.appbar').offsetHeight - 8; scrollTo(0, Math.max(0, y)); requestAnimationFrame(() => h.style.scrollBehavior = ''); stack.focus({ preventScroll: true }); if (!quiet) dealIn(); }
function asked(q) { deal(q); if (PHONE() && queue.length) toStack(); else dealIn(); }
$('#ask').addEventListener('submit', e => { e.preventDefault(); $$('.chip').forEach(c => c.classList.remove('on')); $('#askInput').blur(); asked($('#askInput').value); });
$$('.chip').forEach(c => c.onclick = () => { $$('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on'); $('#askInput').value = c.dataset.q; asked(c.dataset.q); });
function dealIn() { sfx('flip'); if (RM) return; stack.querySelectorAll('.card,.ghost').forEach((c, i, a) => { c.animate([{ transform: 'translate(40px,60px) rotate(6deg) scale(.92)', opacity: 0 }, { transform: c.style.transform || 'none', opacity: 1 }], { duration: 480, delay: (a.length - 1 - i) * 90, easing: 'cubic-bezier(.2,1.25,.4,1)', fill: 'backwards' }); }); }
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1700); }

// ---------- the story of GGP: Then, Now, Next, from GGP's own records ----------
const STORY = {
  Then: [['flexible', 'About 2006: GGP begins.', 'GGP timeline (GGP records)'], ['ggp-scholars', '2019: the ESA Foundation and GGP begin a joint LGBTQ+ Service Scholarship.', 'ESA announcement'], ['zero-proof', '2025: 487 guests come to Zero Proof Board Game Night.', EV], ['gdc-tuesday', 'Seven Tea Parties come before the 8th Annual in 2027.', PLAN + '; count derived']],
  Now: [['zero-proof', '2026: 602 guests at Zero Proof, up 24% in a year.', EV + '; +24% derived'], ['directory', 'September 2026: 76 programs mapped in the Directory review edition.', 'Directory data, release 2026-09-11'], ['cystem-scholars', 'Year 5 of CYSTEM Scholars, shaped by 25 exit survey answers.', 'CYSTEM Year 1 exit survey; ' + PLAN], ['ggp-scholars', 'The 8th year of GGP Scholars: $1,000 to each undergraduate Scholar.', PLAN], ['ai-studio', 'This fall: the AI Studio pilot is seeking its funding.', PLAN]],
  Next: [['directory', 'GDC 2027: the Directory gets its first public look, at the Tuesday Mixer.', PLAN], ['zero-proof', 'March 1, 2027: Zero Proof at The Foundry SF, 5 to 11 pm, all ages.', GDC], ['gdc-tuesday', 'March 2, 2027: the 4th Annual Scholars Breakfast, about 150 guests.', PLAN], ['kiki', 'Date to come: the KiKi, one online room for Pride ERGs and all ERGs.', PLAN], ['flexible', 'Summer 2027: a report back to every supporter.', PLAN], ['ai-studio', 'Four weeks, twenty people: AI with judgment, including the choice not to.', PLAN]]
};
let story = [], storyDone = false;
function drawStory() {
  const used = new Set(); storyDone = false;
  story = Object.keys(STORY).map(pos => { const pool = STORY[pos].filter(r => !used.has(r[0])); const r = pool[Math.floor(Math.random() * pool.length)]; used.add(r[0]); return { pos, id: r[0], t: r[1], s: r[2], up: false }; });
  renderStory();
}
function renderStory() {
  $('#spreadCards').innerHTML = story.map((c, i) => { const p = BY[c.id]; return `<button type="button" class="sc${c.up ? ' up' : ''}" data-i="${i}" aria-label="${c.pos}${c.up ? ': ' + esc(p.name) + '. ' + esc(c.t) : '. Tap to reveal.'}"><span class="sc-in"><span class="sc-back"><b>${c.pos}</b><span>Tap to reveal</span></span><span class="sc-front"><span class="sc-art" style="background-image:url(${p.img})"><span class="sc-pos">${c.pos}</span></span><span class="sc-txt"><span class="sc-name">${esc(p.name)}</span><span class="sc-t">${esc(c.t)}</span><span class="src">${esc(c.s)}</span></span></span></span></button>`; }).join('');
  $('#spreadCards').querySelectorAll('.sc').forEach(b => b.onclick = () => { const c = story[+b.dataset.i]; if (c.up) { openDetail(c.id); return; } c.up = true; sfx('flip'); buzz(8); b.classList.add('up'); b.setAttribute('aria-label', c.pos + ': ' + BY[c.id].name + '. ' + c.t); afterReveal(); });
  afterReveal();
}
function afterReveal() {
  const n = story.filter(c => c.up).length;
  $('#spreadNote').textContent = n < 3 ? (n ? `${3 - n} more to reveal.` : '') : 'That is one story of GGP. Tap a moment to open its program, or shuffle for another.';
  $('#spreadAgain').hidden = n < 3;
  if (n === 3 && !storyDone) { storyDone = true; sfx('chime'); }
}
$('#spreadAgain').onclick = drawStory;

// ---------- guess the program: match a sourced number to its program ----------
const QPOOL = [['602', 'zero-proof', 'guests in 2026, up from 487 in 2025', EV], ['$1,000', 'ggp-scholars', 'award to each undergraduate Scholar', PLAN], ['$1,500', 'cystem-scholars', 'award to each graduate Scholar', PLAN], ['76', 'directory', 'programs mapped in the September 2026 review edition', 'Directory data'], ['$1,250', 'ai-studio', 'per participant: $25,000 for 20 people (derived)', PLAN], ['~150', 'gdc-tuesday', 'guests planned for the Scholars Breakfast', PLAN], ['$100,000', 'flexible', 'flexible, multi-year campaign', PLAN], ['25', 'cystem-scholars', 'Year 1 Scholars answered the exit survey', 'CYSTEM Year 1 exit survey'], ['$13,250', 'gdc-tuesday', 'Breakfast goal', 'GGP GDC 2027 support levels'], ['20', 'ai-studio', 'Scholars, alumni and professionals in the pilot', PLAN]];
const OWN = ALL.filter(p => p.owned && p.proofs.length).map(p => p.id);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let beat = null;
function newBeat() {
  const qs = [], usedP = new Set();
  for (const q of shuffle(QPOOL)) { if (usedP.has(q[1])) continue; usedP.add(q[1]); qs.push({ kind: 'match', big: q[0], id: q[1], label: q[2], src: q[3], opts: shuffle([q[1], ...shuffle(OWN.filter(x => x !== q[1])).slice(0, 2)]) }); if (qs.length === 4) break; }
  // round 5 changes the question: which number is arithmetic, not a count?
  const dv = shuffle([['$1,250', 'GGP AI Studio: $25,000 / 20 people'], ['+24%', 'Zero Proof: 602 / 487 guests']])[0];
  qs.push({ kind: 'derived', big: dv[0], why: dv[1], opts: shuffle([dv[0], ...shuffle(['602', '$1,000', '76', '$1,500', '25']).slice(0, 2)]) });
  beat = { qs, i: 0, right: 0, answered: false }; renderBeat();
}
function renderBeat() {
  const B = $('#beatBody');
  if (!beat) { B.innerHTML = `<button type="button" class="btn btn-primary" id="beatGo">${ico('play')}Play five rounds</button>`; $('#beatGo').onclick = newBeat; return; }
  if (beat.i >= beat.qs.length) {
    B.innerHTML = `<div class="beat-end"><p class="beat-score">${beat.right}<span> of 5</span></p><p>${beat.right >= 4 ? 'You know these programs well.' : beat.right >= 2 ? 'Nice. Every source is one tap away under More info.' : 'A few surprises. Tap More info on any card to see where each number comes from.'}</p><button type="button" class="btn btn-soft" id="beatGo">Play again</button></div>`;
    $('#beatGo').onclick = newBeat; sfx('chime'); return;
  }
  const q = beat.qs[beat.i];
  const ask = q.kind === 'match' ? `<p class="beat-big">${esc(q.big)}</p><p class="beat-q">Which program is this number from?</p>` : `<p class="beat-q">Last round, new question: which number is arithmetic on two sourced numbers, not a count?</p>`;
  B.innerHTML = `<p class="beat-round">Round ${beat.i + 1} of 5 <span class="pips">${beat.qs.map((_, k) => `<i class="${k < beat.i ? 'on' : ''}"></i>`).join('')}</span></p>${ask}<div class="beat-opts">${q.opts.map(o => `<button type="button" class="opt" data-o="${esc(o)}">${q.kind === 'match' ? esc(BY[o].name) : esc(o)}</button>`).join('')}</div><div class="beat-a" aria-live="polite"></div>`;
  B.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (beat.answered) return; beat.answered = true;
    const ok = q.kind === 'match' ? b.dataset.o === q.id : b.dataset.o === q.big;
    if (ok) beat.right++;
    B.querySelectorAll('.opt').forEach(x => { const c = q.kind === 'match' ? x.dataset.o === q.id : x.dataset.o === q.big; x.classList.toggle('right', c); x.classList.toggle('miss', x === b && !c); x.disabled = true; });
    sfx(ok ? 'stamp' : 'flip'); buzz(ok ? 12 : 5);
    B.querySelector('.beat-a').innerHTML = (ok ? '<b>Yes.</b> ' : '<b>Not this time.</b> ') + (q.kind === 'match' ? `${esc(q.big)}: ${esc(BY[q.id].name)}, ${esc(q.label)}. <span class="src">${esc(q.src)}</span>` : `${esc(q.big)} is derived: ${esc(q.why)}. Every figure like it carries a Derived badge.`) + ` <button type="button" class="btn btn-primary" id="beatNext">${beat.i === 4 ? 'See my score' : 'Next round'}</button>`;
    $('#beatNext').onclick = () => { beat.i++; beat.answered = false; renderBeat(); };
    $('#beatNext').focus({ preventScroll: true });
  });
}

// ---------- tabs: highlight where you are ----------
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (!e.isIntersecting) return; const id = e.target.id; $$('.tabbar a,.topnav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id)); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['discover', 'hand', 'give', 'play', 'archive'].forEach(id => io.observe($('#' + id)));
}

// ---------- start: GGP's own eight, or picks someone shared ----------
renderHand(); renderArchive(); renderSecret(); drawStory(); renderBeat();
const sh = (location.hash.match(/^#hand=([\w,-]+)/) || [])[1];
const sharedIds = sh ? [...new Set(sh.split(','))].filter(id => BY[id]).slice(0, 24) : [];
if (sharedIds.length) deal('', sharedIds);
else { queue = ALL.filter(p => p.owned).map(p => p.id); whyMap = {}; renderStack(); }
})();
