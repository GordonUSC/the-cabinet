(() => {
'use strict';
const D = window.DECK;
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = n => '$' + n.toLocaleString('en-US');

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
  const ks = (p.proofs || []).map(x => x.k);
  const lit = {};
  for (const L in LENS) lit[L] = LENS[L].some(k => ks.includes(k));
  if (!p.owned && p.proof) lit.impact = true;
  return lit;
}

// ---------- intent reading ----------
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
function read(q) {
  const s = ' ' + q.toLowerCase() + ' ';
  const hits = SYN.filter(([, , re]) => re.test(s));
  const tags = hits.map(h => h[0]);
  const words = s.split(/[^a-z0-9+]+/).filter(w => w.length > 3 && !/about|care|that|with|want|like|really|people|money|support|help|would|their|into/.test(w));
  return { tags, labels: [...new Set(hits.map(h => h[1]))], words };
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
function deal(q) {
  q = (q || '').trim();
  let cards, R = null;
  if (!q) {
    cards = ALL.filter(p => p.owned);
    lastScore = Object.fromEntries(ALL.map(p => [p.id, p.owned ? 1 : 0]));
  } else {
    R = read(q);
    const sc = ALL.map(p => ({ p, ...score(p, R) }));
    lastScore = Object.fromEntries(sc.map(x => [x.id || x.p.id, x.s]));
    cards = sc.filter(x => x.s > 0).sort((a, b) => b.s - a.s || (b.p.owned - a.p.owned)).slice(0, 16).map(x => ({ ...x.p, why: x.why }));
  }
  oracle(q, R, cards);
  queue = cards.map(c => c.id);
  whyMap = Object.fromEntries(cards.map(c => [c.id, c.why || []]));
  pos = 0; renderStack(); renderArchive();
}
function oracle(q, R, cards) {
  const o = $('#oracle');
  const g = cards.filter(c => c.owned).length, pt = cards.length - g;
  let html;
  if (!q) {
    html = `<p>Here are GGP's own eight: the programs a gift to GGP funds. Each card shows what it does and the numbers behind it, with sources on the back.</p>`;
  } else if (!cards.length) {
    html = `<p>The deck could not place "${esc(q)}". Try one of the chips, or name a group of people, a stage of life, or a kind of proof you trust.</p>`;
  } else {
    const L = R.labels.length ? R.labels.slice(0, 4).join(', ').replace(/, ([^,]*)$/, ' and $1') : 'what you wrote';
    html = `<p>You care about <b>${esc(L)}</b>. I drew <b>${cards.length}</b> cards: <b>${g}</b> GGP ${g === 1 ? 'program' : 'programs'} a gift to GGP funds, and <b>${pt}</b> partner ${pt === 1 ? 'program' : 'programs'} GGP maps but does not run.</p><p>Strongest match: <b>${esc(cards[0].name)}</b>.</p>`;
  }
  setTimeout(() => { const g = o.querySelector('.go'); if (g) g.onclick = e => { e.preventDefault(); jump('#deal'); dealIn(); }; });
  o.innerHTML = `<div class="bubble"><span class="eye" aria-hidden="true">✦</span><div><p class="tagline">THE DECK READS</p>${html}${cards.length ? '<a class="go" href="#deal">Deal the cards ↓</a>' : ''}</div></div>`;
  $('#dealMeta').textContent = cards.length ? `${cards.length} cards dealt${q ? ' for "' + q + '"' : ''}. Keep the ones that move you.` : 'No cards yet.';
}

// ---------- card markup ----------
function proofHTML(p) {
  if (p.owned) {
    if (!p.proofs.length) return `<div class="noproof"><b>No numbers yet.</b> ${esc(p.ask || 'Ask GGP.')}</div>`;
    return `<div class="proofs">${p.proofs.map(x => `<div class="proof${String(x.big).length > 8 ? ' long' : ''}"><div class="pk">${esc(PK[x.k] || x.k)}</div><div class="pb">${esc(x.big)}</div><div class="pl">${esc(x.label)}</div>${x.derived ? '<div class="dv">derived</div>' : ''}</div>`).join('')}</div>`;
  }
  if (p.proof) return `<div class="noproof"><b>Provider reports:</b> ${esc(p.proof.text)}</div>`;
  return `<div class="noproof"><b>No outcome numbers in the Directory yet.</b> Ask ${esc(p.provider)} directly.</div>`;
}
function lensHTML(p) {
  const l = lens(p);
  return `<div class="lens" aria-label="Funder lens">${Object.keys(LENS).map(k => `<span class="pip${l[k] ? ' lit' : ''}" title="${l[k] ? 'Sourced' : 'No sourced number yet'}">${l[k] ? '✦ ' : ''}${LENSNAME[k]}</span>`).join('')}</div>`;
}
function backHTML(p) {
  if (p.owned) {
    return `<p class="kicker">GGP runs this · ${esc(p.kind)}</p><h3>${esc(p.name)}</h3>
      <h4>What it does</h4><p>${esc(p.does)}</p>
      <h4>Who it serves</h4><p>${esc(p.level)}</p>
      ${p.proofs.length ? `<h4>Where the numbers come from</h4><ul>${p.proofs.map(x => `<li><b>${esc(x.big)}</b> ${esc(x.label)}. <span class="src">${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.src)} ↗</a>` : esc(x.src)}</span></li>`).join('')}</ul>` : `<h4>Numbers</h4><p>${esc(p.ask || 'Ask GGP.')}</p>`}
      ${(p.trust || []).length ? `<h4>Public receipts</h4><ul>${p.trust.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join('')}</ul>` : ''}
      ${p.video ? `<h4>Watch</h4><p><a href="https://www.youtube.com/watch?v=${esc(p.video)}" target="_blank" rel="noopener">GGP film on YouTube ↗</a></p>` : ''}`;
  }
  return `<p class="kicker">Partner program · ${esc(p.catName)}</p><h3>${esc(p.name)}</h3>
    <p><b>Run by ${esc(p.provider)}.</b> GGP does not run this program; the GGP Directory maps it so people can find it.</p>
    <h4>What it is</h4><p>${esc(p.line)}</p>
    <h4>Who it serves</h4><p>${esc(p.eligibility)}</p>
    <h4>Cost and status</h4><p>${esc(p.cost)} · ${esc(p.status)}</p>
    ${p.proof ? `<h4>Provider-reported</h4><p>${esc(p.proof.text)} <a href="${esc(p.proof.url)}" target="_blank" rel="noopener">Source ↗</a></p>` : ''}
    <h4>Links</h4><ul><li><a href="${esc(p.url)}" target="_blank" rel="noopener">Official page ↗</a></li>${p.donation ? `<li><a href="${esc(p.donation.url)}" target="_blank" rel="noopener">Give to ${esc(p.donation.recipient)} ↗</a> <span class="src">${esc(p.donation.scope)}</span></li>` : ''}</ul>
    <p class="src">Directory review ${esc(p.checked)}</p>`;
}
const NAMES = { cystem: 'II' };
function cardHTML(p, i) {
  const why = (whyMap[p.id] || []).map(t => (SYN.find(s => s[0] === t) || [, t])[1]);
  return `<div class="flipper">
    <article class="face front" aria-label="${esc(p.name)}">
      <div class="art" style="background-image:url(${p.img})">
        <span class="numeral">${p.owned ? esc(p.arcana) : esc(p.catName)}</span>
        <span class="who ${p.owned ? 'ggp' : 'partner'}">${p.owned ? 'GGP runs this' : 'Partner · GGP maps it'}</span>
        <span class="illus">illustration</span>
      </div>
      <div class="body">
        ${why.length ? `<p class="matched">Matched: ${esc(why.slice(0, 3).join(' · '))}</p>` : ''}
        <h3>${esc(p.name)}</h3>
        <p class="line">${esc(p.line)}</p>
        ${lensHTML(p)}
        ${proofHTML(p)}
      </div>
      <span class="stamp keep" aria-hidden="true">Keep</span><span class="stamp pass" aria-hidden="true">Pass</span>
    </article>
    <article class="face back">${backHTML(p)}</article>
  </div>`;
}

// ---------- stack + physics ----------
let queue = [], pos = 0, whyMap = {};
const stack = $('#stack');
function renderStack() {
  stack.innerHTML = '';
  const left = queue.length - pos;
  $('#btnPass').disabled = $('#btnKeep').disabled = $('#btnFlip').disabled = left <= 0;
  if (left <= 0) {
    const n = kept.length;
    stack.innerHTML = `<div class="done"><div><h3>That's the spread.</h3><p>${queue.length ? `You kept ${n} ${n === 1 ? 'card' : 'cards'}.` : ''}</p><a class="give-big" href="#hand">Open my hand</a><p><button type="button" class="talk" id="again">Ask the deck again</button></p></div></div>`;
    $('#again').onclick = () => { $('#reading').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); $('#askInput').focus({ preventScroll: true }); };
    return;
  }
  if (left > 3) { const g = document.createElement('div'); g.className = 'ghost'; g.style.transform = 'translateY(30px) scale(.86)'; stack.append(g); }
  for (let k = Math.min(2, left - 1); k >= 0; k--) {
    const p = BY[queue[pos + k]];
    const el = document.createElement('div');
    el.className = 'card' + (k ? ' under' : ' top');
    el.dataset.id = p.id;
    el.innerHTML = cardHTML(p);
    el.style.transform = `translateY(${k * 14}px) scale(${1 - k * 0.05})`;
    el.style.zIndex = 10 - k;
    if (k) el.setAttribute('aria-hidden', 'true');
    stack.append(el);
    if (!k) bindDrag(el);
  }
  $('#dealMeta').dataset.n = `${pos + 1} of ${queue.length}`;
  const meta = $('#dealMeta'); meta.textContent = meta.textContent.replace(/ · Card \d+ of \d+$/, '') + ` · Card ${pos + 1} of ${queue.length}`;
}
function top() { return stack.querySelector('.card.top'); }
function bindDrag(el) {
  let sx = 0, sy = 0, dx = 0, dy = 0, t0 = 0, down = false, moved = false;
  const keepS = el.querySelector('.stamp.keep'), passS = el.querySelector('.stamp.pass');
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('a')) return;
    if (el.classList.contains('turned') && e.target.closest('.back')) { /* allow scroll on back */ }
    down = true; moved = false; sx = e.clientX; sy = e.clientY; dx = dy = 0; t0 = performance.now();
    el.setPointerCapture(e.pointerId); el.style.transition = 'none';
  });
  el.addEventListener('pointermove', e => {
    if (!down) return;
    dx = e.clientX - sx; dy = e.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    el.style.transform = `translate(${dx}px,${dy * 0.35}px) rotate(${dx * 0.06}deg)`;
    const a = Math.min(1, Math.abs(dx) / 110);
    keepS.style.opacity = dx > 0 ? a : 0; passS.style.opacity = dx < 0 ? a : 0;
  });
  const up = e => {
    if (!down) return; down = false;
    const v = Math.abs(dx) / Math.max(1, performance.now() - t0);
    if (!moved) { if (!e.target.closest('a')) flip(); el.style.transform = ''; return; }
    if (Math.abs(dx) > 110 || (v > 0.6 && Math.abs(dx) > 40)) { decide(dx > 0, dx, dy); }
    else {
      el.style.transition = RM ? 'none' : 'transform .55s cubic-bezier(.3,1.6,.5,1)';
      el.style.transform = ''; keepS.style.opacity = passS.style.opacity = 0;
    }
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
function flip() { const el = top(); if (el) el.classList.toggle('turned'); }
let busy = false;
function decide(keep, dx = 0, dy = 0) {
  const el = top(); if (!el || busy) return;
  busy = true;
  const id = el.dataset.id;
  if (keep) addKeep(id);
  const s = el.querySelector(keep ? '.stamp.keep' : '.stamp.pass'); if (s) s.style.opacity = 1;
  const W = innerWidth;
  el.style.transition = RM ? 'none' : 'transform .45s cubic-bezier(.4,.1,.6,1), opacity .45s';
  el.style.transform = `translate(${(keep ? 1 : -1) * W * 1.1}px,${dy * 0.35 - 40}px) rotate(${(keep ? 1 : -1) * 32}deg)`;
  el.style.opacity = '0';
  const unders = [...stack.querySelectorAll('.card.under')];
  unders.forEach((u, i) => { u.style.transition = RM ? 'none' : 'transform .5s cubic-bezier(.3,1.5,.5,1)'; u.style.transform = `translateY(${i * 14}px) scale(${1 - i * 0.05})`; });
  setTimeout(() => { pos++; busy = false; renderStack(); }, RM ? 0 : 380);
  toast(keep ? `Kept: ${BY[id].name}` : `Passed: ${BY[id].name}`);
}
$('#btnKeep').onclick = () => decide(true);
$('#btnPass').onclick = () => decide(false);
$('#btnFlip').onclick = flip;
addEventListener('keydown', e => {
  if (e.target.closest('input,select,textarea,dialog') || $('#detail').open || !$('#thanks').hidden) return;
  const r = $('#deal').getBoundingClientRect();
  if (r.bottom < 80 || r.top > innerHeight - 120) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); decide(true); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); decide(false); }
  else if (e.key === ' ' && !e.target.closest('button,a')) { e.preventDefault(); flip(); }
});

// ---------- hand ----------
const KEY = 'ggp-patron-deck-v1';
let kept = [];
try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(v)) kept = v.filter(id => BY[id]); } catch (e) { }
function save() { try { localStorage.setItem(KEY, JSON.stringify(kept)); } catch (e) { } }
function addKeep(id) { if (!kept.includes(id)) kept.push(id); save(); renderHand(); }
function renderHand() {
  $('#handCount').textContent = kept.length;
  const fan = $('#handFan'), list = $('#handList');
  const n = kept.length;
  const fw = (fan.clientWidth || innerWidth - 32) - 190;
  fan.innerHTML = kept.slice(0, 9).map((id, i, a) => {
    const m = a.length, off = i - (m - 1) / 2, sp = m > 1 ? Math.min(52, fw / (m - 1)) : 0;
    return `<div class="mini" style="left:calc(50% - 52px);background-image:url(${BY[id].img});transform:translateX(${off * sp}px) rotate(${off * 7}deg) translateY(${Math.abs(off) * 6}px)" title="${esc(BY[id].name)}"></div>`;
  }).join('');
  fan.style.display = n ? '' : 'none';
  if (!n) { list.innerHTML = '<p class="empty">Keep a card and it lands here. Your hand stays in this browser only.</p>'; renderPossible(); return; }
  const g = kept.filter(id => BY[id].owned).length;
  list.innerHTML = `<p class="empty" style="grid-column:1/-1">${n} kept · ${g} GGP ${g === 1 ? 'program' : 'programs'} a gift to GGP funds${n - g ? ` · ${n - g} partner ${n - g === 1 ? 'program' : 'programs'} to support on their own pages` : ''}.</p>` +
    kept.map(id => { const p = BY[id]; return `<div class="held"><div class="t" style="background-image:url(${p.img})"></div><div><h4>${esc(p.name)}</h4><p>${p.owned ? 'GGP runs this' : 'Run by ' + esc(p.provider)}</p><div class="acts"><button type="button" data-open="${p.id}">Details</button>${p.owned ? '<a href="#give">Give</a>' : `<a href="${esc((p.donation || {}).url || p.url)}" target="_blank" rel="noopener">${p.donation ? 'Give to them ↗' : 'Their page ↗'}</a>`}<button type="button" data-drop="${p.id}">Remove</button></div></div></div>`; }).join('');
  list.querySelectorAll('[data-drop]').forEach(b => b.onclick = () => { kept = kept.filter(x => x !== b.dataset.drop); save(); renderHand(); });
  list.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
  renderPossible();
}

// ---------- what gifts like yours make possible (sourced program facts only) ----------
let amount = 1000;
const PLAN = "GGP 2026-27 plan";
function possibleLines(a) {
  const L = [];
  const k = id => kept.includes(id);
  const sch = a / 1000;
  L.push({ id: 'ggp-scholars', t: sch >= 1 ? `${fmt(a)} is the size of ${Math.floor(sch) === 1 ? 'one GGP Scholars award' : Math.floor(sch) + ' GGP Scholars awards'} ($1,000 each).` : `${fmt(a)} is ${Math.round(sch * 100)}% of one GGP Scholars award ($1,000).`, s: PLAN });
  const cy = Math.floor(a / 1500);
  if (cy >= 1) L.push({ id: 'cystem-scholars', t: `${fmt(a)} is the size of ${cy === 1 ? 'one CYSTEM Scholars award' : cy + ' CYSTEM Scholars awards'} ($1,500 each, for graduate students).`, s: PLAN });
  const seats = Math.floor(a / 1250);
  L.push({ id: 'ai-studio', t: seats >= 1 ? `The proposed AI Studio pilot works out to $1,250 per participant, so ${fmt(a)} matches ${Math.min(seats, 20)} of its 20 seats${seats >= 20 ? ': the whole pilot' : ''}.` : `The proposed AI Studio pilot works out to $1,250 per participant ($25,000 for 20 people).`, s: PLAN + ', derived' });
  const lv = [[25000, 'Champion'], [10000, 'All-Star'], [5000, 'Supporter'], [1500, 'Friend']].find(([v]) => a >= v);
  L.push({ id: 'zero-proof', t: lv ? `At ${fmt(lv[0])}, a supporter is a ${lv[1]} of a GDC night like Zero Proof Board Game Night (602 guests in 2026).` : `GDC night support starts at $1,500 (Friend). Zero Proof Board Game Night welcomed 602 guests in 2026.`, s: 'GGP GDC 2027 support levels; event records' });
  if (a >= 1500) { const b = [[10000, 'Presenting Supporter'], [5000, 'Breakfast Supporter'], [1500, 'Breakfast Friend']].find(([v]) => a >= v); L.push({ id: 'gdc-tuesday', t: `${fmt(b[0])} is the ${b[1]} level of the Scholars Breakfast, goal $13,250.`, s: 'GGP GDC 2027 support levels' }); }
  L.push({ id: 'flexible', t: `${fmt(a)} is ${+(a / 1000).toFixed(2)}% of GGP's $100,000 flexible, multi-year campaign that keeps every program going.`, s: PLAN });
  L.push({ id: 'directory', t: `Flexible gifts also keep the Directory free: ${D.ggp.find(x => x.id === 'directory').proofs[0].big} programs mapped so far.`, s: 'Directory data' });
  return L.sort((x, y) => (k(y.id) - k(x.id)));
}
function renderPossible() {
  document.querySelectorAll('.amt').forEach(b => b.classList.toggle('on', +b.dataset.amt === amount));
  const L = possibleLines(amount).slice(0, 4);
  $('#possible').innerHTML = `<ul>${L.map(l => `<li>${esc(l.t)}<span class="src">${esc(l.s)}${kept.includes(l.id) ? ' · in your hand' : ''}</span></li>`).join('')}</ul>`;
}
document.querySelectorAll('.amt').forEach(b => b.onclick = () => { amount = +b.dataset.amt; renderPossible(); });
document.querySelectorAll('[data-give]').forEach(a => a.addEventListener('click', () => {
  const L = possibleLines(amount).slice(0, 3);
  const g = kept.filter(id => BY[id].owned).map(id => BY[id].name);
  $('#thanksList').innerHTML = L.map(l => `<li>${esc(l.t)}</li>`).join('') + (g.length ? `<li>You kept ${esc(g.join(', '))}. Tell GGP on a 20-minute call if you want your gift pointed there.</li>` : '');
  setTimeout(() => { $('#thanks').hidden = false; $('#thanksClose').focus(); }, 250);
}));
$('#thanksClose').onclick = () => { $('#thanks').hidden = true; $('#hand').scrollIntoView(); };
$('#thanks').addEventListener('click', e => { if (e.target.id === 'thanks') $('#thanks').hidden = true; });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#thanks').hidden) $('#thanks').hidden = true; });
$('#copyHand').onclick = async () => {
  const lines = ['My hand from the GGP Patron\'s Deck', ''].concat(kept.length ? kept.map(id => { const p = BY[id]; return `- ${p.name} (${p.owned ? 'GGP' : 'run by ' + p.provider}): ${p.owned ? p.does : p.url}`; }) : ['(no cards kept yet)'], ['', 'Give: ' + D.zeffy, 'Talk to GGP: ' + D.calendly]);
  try { await navigator.clipboard.writeText(lines.join('\n')); toast('Copied. Paste it into a note or an email to yourself.'); }
  catch (e) { toast('Copy is blocked in this browser.'); }
};

// ---------- archive ----------
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
  $('#rows').innerHTML = L.map(p => `<button type="button" class="row" data-open="${p.id}"><span class="t" style="background-image:url(${p.img})"></span><span><h3>${esc(p.name)}</h3><p>${esc(p.line)}</p><span class="meta">${p.owned ? esc(p.kind) : esc(p.provider) + ' · ' + esc(p.catName)}${(p.proofs.length || p.proof) ? ' · <span class="proofmark">✦ sourced number</span>' : ''}</span></span><span class="tag ${p.owned ? 'ggp' : 'partner'}">${p.owned ? 'GGP' : 'Partner'}</span></button>`).join('') || '<p class="empty">Nothing matches. Clear a filter.</p>';
  $('#rows').querySelectorAll('[data-open]').forEach(b => b.onclick = () => openDetail(b.dataset.open));
}
function openDetail(id) {
  const p = BY[id], d = $('#detail');
  $('#detailBody').innerHTML = `<div class="dart" style="background-image:url(${p.img})" role="img" aria-label="Illustration"></div><div class="dbody">${lensHTML(p)}${p.owned ? proofHTML(p) : ''}${backHTML(p)}<p style="margin-top:14px"><button type="button" class="talk" id="keepFromDetail" style="background:var(--velvet);color:var(--gold-hi)">${kept.includes(id) ? 'In your hand' : 'Keep this card ✦'}</button></p></div>`;
  $('#keepFromDetail').onclick = () => { addKeep(id); $('#keepFromDetail').textContent = 'In your hand'; toast('Kept: ' + p.name); };
  if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  $('#detailBody').scrollTop = 0; $('#detailClose').focus({ preventScroll: true });
}
$('#detailClose').onclick = () => $('#detail').close();
$('#detail').addEventListener('click', e => { if (e.target.id === 'detail') $('#detail').close(); });

// ---------- ask ----------
$('#ask').addEventListener('submit', e => { e.preventDefault(); document.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); deal($('#askInput').value); });
document.querySelectorAll('.chip').forEach(c => c.onclick = () => {
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); c.classList.add('on');
  $('#askInput').value = c.dataset.q; deal(c.dataset.q);
});
function jump(sel) { const h = document.documentElement; h.style.scrollBehavior = 'auto'; $(sel).scrollIntoView({ block: 'start' }); requestAnimationFrame(() => h.style.scrollBehavior = ''); }
function dealIn() { if (RM) return; stack.querySelectorAll('.card,.ghost').forEach((c, i, a) => { c.animate([{ transform: 'translate(-30px,-260px) rotate(-18deg) scale(.9)', opacity: 0 }, { opacity: 1, offset: .6 }, { transform: c.style.transform || 'none', opacity: 1 }], { duration: 700, delay: (a.length - 1 - i) * 110, easing: 'cubic-bezier(.2,1.3,.4,1)', fill: 'backwards' }); }); }
let tt;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1600); }

// start with GGP's own eight in the deck, quietly
queue = ALL.filter(p => p.owned).map(p => p.id); whyMap = {};
lastScore = Object.fromEntries(ALL.map(p => [p.id, p.owned ? 1 : 0]));
renderStack(); renderHand(); renderArchive();
$('#dealMeta').textContent = `GGP's own eight are on the table. Ask the deck above to deal for what you care about. · Card 1 of ${queue.length}`;
})();
