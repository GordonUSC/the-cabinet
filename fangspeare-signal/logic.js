/* FANGSPEARE: THE SIGNAL BELOW. Pure game rules (no rendering). Runs in the browser and in Node for tests. */
(function (root) {
  'use strict';
  const N = 5; // plate is 5 x 5

  // ---------- seeded RNG ----------
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function shuffle(arr, r) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

  // ---------- runes ----------
  const RUNES = {
    sub:   { name: 'Sub',   color: 0x3ff2d0, text: '+30 Bass.' },
    pulse: { name: 'Pulse', color: 0x7fd8ff, text: '+10 Bass, plus 15 for each touching rune.' },
    node:  { name: 'Node',  color: 0xb08cff, text: '+2 Res. Doubled on a sand line.' },
    echo:  { name: 'Echo',  color: 0xcfe3ec, text: 'Fires its strongest touching rune again.' },
    frost: { name: 'Frost', color: 0x9fe8ff, text: '+20 Bass. The Thing cannot frost next bar.' },
    ember: { name: 'Ember', color: 0xe8743b, text: '+10 Bass. Thaws touching ice, +25 Bass each.' },
    elder: { name: 'Elder', color: 0xffd36b, text: 'x2 Res. Order matters: fire it late.' },
  };
  const START_DECK = ['sub', 'sub', 'sub', 'sub', 'pulse', 'pulse', 'pulse', 'node', 'node', 'node', 'echo', 'frost', 'ember'];

  // ---------- relics ----------
  // tier 1 = additive (early), tier 2 = multiplicative (chamber 3 on)
  const RELICS = {
    hat:     { tier: 1, name: 'Basket Hat',          text: 'Sub runes give +20 more Bass.' },
    didg:    { tier: 1, name: 'Didgeridoo',          text: 'Pulse also counts diagonal runes.' },
    feather: { tier: 1, name: 'Pale Penguin Feather', text: 'Carve 1 more rune each bar.' },
    chant:   { tier: 1, name: 'Tekeli-li Chant',     text: '+5 Bass for every rune on the plate, each drop.' },
    cramp:   { tier: 1, name: 'Tiwanaku Cramp',      text: 'Runes touching 2 or more runes get +15 Bass.' },
    hearth:  { tier: 1, name: 'Hyperborean Ember',   text: 'Ember runes also give +1 Res.' },
    voltage: { tier: 1, name: 'Ghost Voltage Coil',  text: 'The first rune each drop fires twice.' },
    breath:  { tier: 1, name: 'Deep Breath',         text: '+1 Breath in every chamber.' },
    plate:   { tier: 2, name: 'Chladni Plate',       text: 'Runes on sand lines give +2 Res instead of +1.' },
    mask:    { tier: 2, name: 'Tsathoggua Mask',     text: '+1 Res for every frozen cell. Ice is power.' },
    star:    { tier: 2, name: 'Star-Head Fossil',    text: 'x1.5 Res if 3 or more Node runes fire.' },
    ichor:   { tier: 2, name: 'Shoggoth Ichor',      text: 'Echo runes fire twice.' },
    crystal: { tier: 2, name: 'Lemurian Crystal',    text: 'x2 Res on the last drop of a chamber.' },
    oldones: { tier: 2, name: 'Old Ones Drop',       text: 'x3 Res when 12 or more runes fire in one drop.' },
    freeze:  { tier: 2, name: 'The Freeze',          text: 'Frost runes give x1.5 Res.' },
  };

  // ---------- sand lines (60 Hz plate modes, simulated) ----------
  const MODES = {
    cross:   (r, c) => r === 2 || c === 2,
    saltire: (r, c) => r === c || r + c === 4,
    diamond: (r, c) => Math.abs(r - 2) + Math.abs(c - 2) === 2,
    ring:    (r, c) => Math.max(Math.abs(r - 2), Math.abs(c - 2)) === 1,
    bars:    (r, c) => r === 1 || r === 3,
    gate:    (r, c) => c === 1 || c === 3,
    corners: (r, c) => (r < 2 && c < 2 && r !== c) || (r > 2 && c > 2 && r !== c) || (r < 2 && c > 2 && r + c === 4) || (r > 2 && c < 2 && r + c === 4) || (r === 2 && c === 2),
  };
  function modeCells(mode, rot) {
    const out = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      // rotate a quarter turn rot times
      let rr = r, cc = c;
      for (let k = 0; k < (rot || 0) % 4; k++) { const t = rr; rr = cc; cc = N - 1 - t; }
      if (MODES[mode](rr, cc)) out.push(r * N + c);
    }
    return out;
  }

  // ---------- chambers ----------
  const CHAMBERS = [
    { id: 'ice',    bg: 'ice',       track: 'old',    drop: 0, name: 'The Ice Shelf',         thing: 'The White Wind',          dread: 4000,   frost: 1, frostFrom: 2, rule: 'The wind only starts to frost after your second drop.', mode: 'cross' },
    { id: 'peaks',  bg: 'peaks',     track: 'old',    drop: 0, name: 'The Black Peaks',       thing: 'The Star-Carved Gate',    dread: 8000,  frost: 1, rule: 'Frost: one cell per bar.', mode: 'diamond' },
    { id: 'city',   bg: 'city',      track: 'old',    drop: 0, name: 'City of the Old Ones',  thing: 'An Old One Wakes',        dread: 15000,  frost: 2, boss: 'elder', rule: 'BOSS. Its star-head turns: the sand lines rotate a quarter turn after every drop.', mode: 'corners' },
    { id: 'tunnel', bg: 'tunnel',    track: 'tek',    drop: 0, name: 'The Bored Tunnels',     thing: 'Something Far Down',      dread: 16000, frost: 2, rule: 'The tunnels echo: Echo runes also give +1 Res.', mode: 'bars' },
    { id: 'grotto', bg: 'grotto',    track: 'tek',    drop: 0, name: 'Grotto of the Pale Penguins', thing: 'The Humming Dark',  dread: 24000, frost: 1, rule: 'The blind penguins hum along and the cold eases: only one cell frosts per bar, and ice melts a bar sooner.', mode: 'ring' },
    { id: 'shog',   bg: 'shogarena', track: 'tek',    drop: 0, name: 'The Shoggoth',          thing: 'Tekeli-li!',              dread: 22000, frost: 1, boss: 'shoggoth', rule: 'BOSS. After each drop it swallows your highest scoring rune.', mode: 'saltire' },
    { id: 'knyan',  bg: 'knyan',     track: 'old',    drop: 1, name: "Blue-Lit K'n-yan",      thing: 'The Closed Shrines',      dread: 30000, frost: 2, rule: 'Blue light: Node runes give +1 more Res.', mode: 'gate' },
    { id: 'yoth',   bg: 'yoth',      track: 'tek',    drop: 1, name: 'Red-Lit Yoth',          thing: 'What Built Yoth',         dread: 42000, frost: 1, regrow: 0.12, rule: 'Red heat: the Thing regrows 12% of its full Dread each bar.', mode: 'diamond' },
    { id: 'nkai',   bg: 'nkai',      track: 'old',    drop: 1, name: "N'kai",                 thing: 'Tsathoggua',              dread: 50000, frost: 2, boss: 'tsath', rule: 'BOSS. He sleeps. Only runes on sand lines add Bass. The rest still add Res.', mode: 'cross' },
  ];
  const DROPS = 4, HAND = 6, CARVE = 3, BREATHS = 2;

  function newRun(opts) {
    const seed = opts.seed >>> 0;
    const r = rng(seed);
    return {
      seed, story: !!opts.story, deeper: opts.deeper || 0,
      r, chamber: 0, deck: START_DECK.slice(), relics: [], shards: 0,
      score: 0, bestDrop: 0, over: false, won: false, log: [],
    };
  }
  function dropsFor(ch) { return ch.C.boss ? 5 : DROPS; }
  function has(run, id) { return run.relics.indexOf(id) >= 0; }

  function dreadFor(run, ci) {
    const base = CHAMBERS[ci].dread * (1 + 0.35 * run.deeper);
    return Math.round(run.story ? base * 0.5 : base);
  }

  function newChamber(run) {
    const C = CHAMBERS[run.chamber];
    const draw = shuffle(run.deck.slice(), run.r);
    const ch = {
      C, idx: run.chamber, board: new Array(N * N).fill(null), frozen: new Array(N * N).fill(0),
      rot: 0, drop: 0, dread: dreadFor(run, run.chamber), maxDread: dreadFor(run, run.chamber),
      draw, discard: [], hand: [], placedThisBar: [], breaths: BREATHS + (has(run, 'breath') ? 1 : 0),
      frostBlocked: false, last: null, done: false, won: false,
    };
    drawHand(run, ch);
    return ch;
  }
  function sandCells(ch) { return modeCells(ch.C.mode, ch.rot); }
  function isSand(ch, i) { return sandCells(ch).indexOf(i) >= 0; }
  function carveLimit(run) { return CARVE + (has(run, 'feather') ? 1 : 0); }

  function drawHand(run, ch) {
    while (ch.hand.length < HAND) {
      if (!ch.draw.length) { if (!ch.discard.length) break; ch.draw = shuffle(ch.discard, run.r); ch.discard = []; }
      ch.hand.push(ch.draw.pop());
    }
  }
  function breathe(run, ch) {
    if (ch.breaths <= 0) return false;
    ch.breaths--;
    // runes carved this bar stay; the rest of the hand is returned and redrawn
    ch.discard.push(...ch.hand); ch.hand = [];
    drawHand(run, ch);
    return true;
  }
  function canPlace(run, ch, cell) {
    return ch.board[cell] === null && !ch.frozen[cell] && ch.placedThisBar.length < carveLimit(run);
  }
  function place(run, ch, handIdx, cell) {
    if (!canPlace(run, ch, cell) || handIdx < 0 || handIdx >= ch.hand.length) return false;
    const t = ch.hand.splice(handIdx, 1)[0];
    ch.board[cell] = { t, bar: ch.drop };
    ch.placedThisBar.push(cell);
    return true;
  }
  function unplace(run, ch, cell) {
    const k = ch.placedThisBar.indexOf(cell);
    if (k < 0) return false;
    ch.hand.push(ch.board[cell].t); ch.board[cell] = null; ch.placedThisBar.splice(k, 1);
    return true;
  }
  function neighbors(cell, diag) {
    const r = Math.floor(cell / N), c = cell % N, out = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (!diag && dr && dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) out.push(rr * N + cc);
    }
    return out;
  }

  // ---------- the drop: score the whole plate in reading order ----------
  // Returns {steps:[{cell, t, bass, res, mult, note}], bass, res, total, lock, extra:[...]}
  function scoreDrop(run, ch) {
    const C = ch.C;
    const sand = sandCells(ch);
    const lastDrop = ch.drop === dropsFor(ch) - 1;
    let bass = 0, res = 1;
    const steps = [];
    const fired = [];
    const contrib = {}; // cell -> bass contributed (for shoggoth)
    const occupied = (i) => ch.board[i] && !ch.frozen[i];
    let nodesFired = 0, thawed = 0;
    const sleepy = C.boss === 'tsath';

    function fireOne(i, t, isEcho) {
      let b = 0, rAdd = 0, mult = 1, note = '';
      const onSand = sand.indexOf(i) >= 0;
      const touch = neighbors(i, false).filter(occupied).length;
      switch (t) {
        case 'sub': b = 30 + (has(run, 'hat') ? 20 : 0); break;
        case 'pulse': {
          const n = neighbors(i, has(run, 'didg')).filter(occupied).length;
          b = 10 + 15 * n; note = n + ' touching';
          break;
        }
        case 'node': rAdd = 2 * (onSand ? 2 : 1) + (C.id === 'knyan' ? 1 : 0); nodesFired++; break;
        case 'frost': b = 20; if (has(run, 'freeze')) mult *= 1.5; break;
        case 'ember': {
          b = 10;
          if (has(run, 'hearth')) rAdd += 1;
          for (const j of neighbors(i, false)) if (ch.frozen[j]) { ch.frozen[j] = 0; b += 25; thawed++; }
          break;
        }
        case 'elder': mult *= 2; break;
        case 'echo': {
          if (isEcho) break;
          if (C.id === 'tunnel') rAdd += 1;
          // strongest touching rune (not echo): pick by its last recorded bass, then elder/node preference
          const cands = neighbors(i, false).filter((j) => occupied(j) && ch.board[j].t !== 'echo');
          if (cands.length) {
            const rank = (j) => { const tt = ch.board[j].t; return tt === 'elder' ? 1e6 : tt === 'node' ? 5e5 : (contrib[j] || 0) + 1; };
            cands.sort((a, b2) => rank(b2) - rank(a));
            const j = cands[0];
            const times = has(run, 'ichor') ? 2 : 1;
            for (let k = 0; k < times; k++) {
              const s = fireOne(j, ch.board[j].t, true);
              s.echoOf = j; s.cell = i; s.note = 'echoes ' + RUNES[ch.board[j].t].name;
              steps.push(s); apply(s);
            }
          }
          return null;
        }
      }
      if (has(run, 'cramp') && touch >= 2) b += 15;
      if (onSand) rAdd += (has(run, 'plate') ? 2 : 1) ;
      if (sleepy && !onSand) { if (b) note = 'asleep: no Bass'; b = 0; }
      return { cell: i, t, bass: b, res: rAdd, mult, note, onSand };
    }
    function apply(s) {
      bass += s.bass; res += s.res; res *= s.mult;
      contrib[s.cell] = (contrib[s.cell] || 0) + s.bass;
      s.bassTotal = bass; s.resTotal = res;
    }

    let first = true;
    for (let i = 0; i < N * N; i++) {
      if (!occupied(i)) continue;
      const t = ch.board[i].t;
      const times = first && has(run, 'voltage') ? 2 : 1;
      first = false;
      for (let k = 0; k < times; k++) {
        const s = fireOne(i, t, false);
        if (s) { if (k === 1) s.note = 'Ghost Voltage'; steps.push(s); apply(s); }
      }
      fired.push(i);
    }
    const extra = [];
    if (has(run, 'chant')) { const add = 5 * fired.length; bass += add; extra.push({ name: 'Tekeli-li Chant', text: '+' + add + ' Bass' }); }
    if (has(run, 'mask')) { const f = ch.frozen.filter(Boolean).length; if (f) { res += f; extra.push({ name: 'Tsathoggua Mask', text: '+' + f + ' Res' }); } }
    const lock = sand.length > 0 && sand.every((i) => occupied(i));
    if (lock) { res *= 2; extra.push({ name: '60 Hz LOCK', text: 'x2 Res' }); }
    if (has(run, 'star') && nodesFired >= 3) { res *= 1.5; extra.push({ name: 'Star-Head Fossil', text: 'x1.5 Res' }); }
    if (has(run, 'crystal') && lastDrop) { res *= 2; extra.push({ name: 'Lemurian Crystal', text: 'x2 Res' }); }
    if (has(run, 'oldones') && fired.length >= 12) { res *= 3; extra.push({ name: 'Old Ones Drop', text: 'x3 Res' }); }
    res = Math.round(res * 100) / 100;
    const total = Math.floor(bass * res);
    return { steps, bass, res, total, lock, extra, fired: fired.length, thawed, contrib };
  }

  // Apply a scored drop to the chamber: damage, boss rules, enemy frost, new hand.
  function resolveDrop(run, ch, result) {
    const C = ch.C;
    ch.last = result;
    const before = ch.dread;
    ch.dread = Math.max(0, ch.dread - result.total);
    run.score += result.total;
    run.bestDrop = Math.max(run.bestDrop, result.total);
    const events = [];
    ch.drop++;
    if (ch.dread <= 0) {
      ch.done = true; ch.won = true;
      const spare = dropsFor(ch) - ch.drop;
      run.shards += 1 + spare;
      events.push({ k: 'silenced', spare, overkill: result.total - before });
      return events;
    }
    if (C.regrow) { const g = Math.round(ch.maxDread * C.regrow); ch.dread = Math.min(ch.maxDread, ch.dread + g); events.push({ k: 'regrow', n: g }); }
    if (C.boss === 'shoggoth') {
      let best = -1, bv = -1;
      for (const k in result.contrib) { const i = +k; if (ch.board[i] && result.contrib[i] > bv) { bv = result.contrib[i]; best = i; } }
      if (best >= 0) { events.push({ k: 'swallow', cell: best, t: ch.board[best].t }); ch.board[best] = null; }
    }
    if (C.boss === 'elder') { ch.rot = (ch.rot + 1) % 4; events.push({ k: 'rotate' }); }
    // old ice melts: each frozen cell holds for two bars
    const melted = [];
    for (let i = 0; i < N * N; i++) if (ch.frozen[i]) { ch.frozen[i]--; if (!ch.frozen[i]) melted.push(i); }
    if (melted.length) events.push({ k: 'melt', cells: melted });
    // enemy frost
    const frostOn = C.frost > 0 && !(C.frostFrom && ch.drop < C.frostFrom);
    ch.frostBlocked = result.steps.some((s) => s.t === 'frost');
    if (frostOn && !ch.frostBlocked) {
      const open = [];
      for (let i = 0; i < N * N; i++) if (!ch.frozen[i]) open.push(i);
      shuffle(open, run.r);
      // prefer occupied cells half the time so frost bites
      const hit = open.slice(0, C.frost);
      hit.forEach((i) => { ch.frozen[i] = C.id === 'grotto' ? 2 : 3; });
      events.push({ k: 'frost', cells: hit });
    } else if (frostOn && ch.frostBlocked) events.push({ k: 'frostblocked' });
    if (ch.drop >= dropsFor(ch)) { ch.done = true; ch.won = false; events.push({ k: 'failed' }); return events; }
    // next bar
    ch.discard.push(...ch.hand); ch.hand = []; ch.placedThisBar = [];
    drawHand(run, ch);
    return events;
  }

  // ---------- rewards ----------
  function offers(run) {
    const ci = run.chamber; // chamber just finished
    const pool = Object.keys(RELICS).filter((k) => !has(run, k) && (RELICS[k].tier === 1 || ci >= 1));
    // later chambers lean multiplicative
    const weighted = [];
    for (const k of pool) { const w = RELICS[k].tier === 2 ? (ci >= 2 ? 3 : 1) : (ci >= 4 ? 1 : 3); for (let i = 0; i < w; i++) weighted.push(k); }
    shuffle(weighted, run.r);
    const out = [];
    for (const k of weighted) { if (out.length >= 2) break; if (!out.some((o) => o.id === k)) out.push({ kind: 'relic', id: k }); }
    const runePool = ci >= 1 ? ['elder', 'node', 'pulse', 'echo', 'ember', 'frost', 'sub'] : ['node', 'pulse', 'echo', 'ember', 'frost'];
    out.push({ kind: 'rune', id: runePool[Math.floor(run.r() * runePool.length)] });
    return out;
  }
  function take(run, offer) {
    if (offer.kind === 'relic') { if (run.relics.length >= 5) run.relics.shift(); run.relics.push(offer.id); }
    else run.deck.push(offer.id);
  }

  // ---------- a simple bot (for balance tests and the autoplay demo) ----------
  function botBar(run, ch) {
    const sand = sandCells(ch);
    let guard = 0;
    while (ch.placedThisBar.length < carveLimit(run) && ch.hand.length && guard++ < 20) {
      let best = null;
      for (let h = 0; h < ch.hand.length; h++) {
        const t = ch.hand[h];
        for (let i = 0; i < N * N; i++) {
          if (!canPlace(run, ch, i)) continue;
          let v = Math.random() * 3;
          const onSand = sand.indexOf(i) >= 0;
          const touch = neighbors(i, false).filter((j) => ch.board[j] && !ch.frozen[j]).length;
          if (onSand) v += 10;
          if (t === 'pulse' || t === 'echo') v += touch * 4;
          if (t === 'elder') v += i; // late in order
          if (t === 'node' && onSand) v += 8;
          if (t === 'ember') v += neighbors(i, false).filter((j) => ch.frozen[j]).length * 6;
          if (!best || v > best.v) best = { v, h, i };
        }
      }
      if (!best) break;
      place(run, ch, best.h, best.i);
    }
  }

  const API = { N, RUNES, RELICS, CHAMBERS, MODES, DROPS, HAND, CARVE, BREATHS, rng, hashStr, shuffle, newRun, newChamber, sandCells, isSand, carveLimit, drawHand, breathe, canPlace, place, unplace, neighbors, scoreDrop, resolveDrop, offers, take, botBar, has, dreadFor, dropsFor };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.FL = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
