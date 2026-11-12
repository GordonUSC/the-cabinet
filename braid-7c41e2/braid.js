/* Braid. One verb: bring three makers together, choose how the team works, ship a game.
   Numbers are game rules. Balance is checked by tools/enumerate.py (all 27 sequences). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  function A(p) { return (window.BRAID_ASSETS && window.BRAID_ASSETS[p]) || p; }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var MAKERS = [
    { id: 'coder', role: 'Coder', color: '#E4B6D6' },
    { id: 'artist', role: 'Artist', color: '#2E6B4E' },
    { id: 'storyteller', role: 'Storyteller', color: '#F3E9EF' },
    { id: 'musician', role: 'Musician', color: '#B0478F' },
    { id: 'firsttimer', role: 'New maker', color: '#4A2340' }
  ];
  var ROUNDS = [
    { day: 'Saturday', cue: 'Your first game starts here.', bg: 'bg-saturday' },
    { day: 'Sunday', cue: 'The showcase is getting closer.', bg: 'bg-sunday' },
    { day: 'The big stage', cue: 'Live now. Trust changes count twice.', bg: 'bg-bigstage' }
  ];
  var WAYS = [
    { id: 'A', title: 'AI drafts. Makers choose.', body: 'Use AI for early ideas. The team shapes and tests what stays.', g: 4, t: 1 },
    { id: 'B', title: 'Makers build. AI checks.', body: 'Make it together. Use AI to spot issues, then verify the fixes.', g: 3, t: 2 },
    { id: 'C', title: 'Make it by hand.', body: 'Keep this build human-made. Spend the time on craft and playtesting.', g: 2, t: 3 }
  ];
  var BEST_KEY = 'braid.best.v2';

  var S;
  function fresh() {
    return { round: 0, games: 0, trust: 1, picks: [], choice: null, prev: null, returning: [], firstDone: false, came: [], phase: 'pick', lock: 0 };
  }

  /* ---------- rules ---------- */
  function compute(way, st) {
    st = st || S;
    var g = way.g, t = way.t, why = [];
    var hasNew = st.picks.indexOf('firsttimer') >= 0 && !st.firstDone;
    var hasBack = st.picks.some(function (p) { return st.returning.indexOf(p) >= 0; });
    if (st.round === 1 && way.id === 'C') { g -= 1; why.push('Handmade ships one fewer near a deadline.'); }
    if (st.prev === way.id) { g -= 1; why.push('Same approach twice: one fewer.'); }
    if (hasBack) { g += 1; why.push('A returning maker: one more.'); }
    if (st.round === 2) {
      if (way.id === 'A') { g += 2; why.push('Live crowd: two more.'); }
      if (way.id === 'B') { g += 1; why.push('Live crowd: one more.'); }
      if (t > 0) { t *= 2; why.push('Live: trust counts twice.'); }
    }
    if (hasNew) { /* a welcome is worth the same on any day, so it sits outside the live multiplier */
      if (way.id === 'A') { g += 1; why.push('A first game, drafted fast: one more.'); }
      else { t += 1; why.push('Room for a first game: trust up one.'); }
    }
    if (g < 1) g = 1;
    return { g: g, t: t, why: why };
  }

  /* ---------- sound (off until the player turns it on) ---------- */
  var soundOn = false, audio = {};
  function clip(name, loop, vol) {
    if (!audio[name]) {
      try { var a = new Audio(A('assets/audio/' + name + '.mp3')); a.loop = !!loop; a.volume = vol; audio[name] = a; } catch (e) { audio[name] = null; }
    }
    return audio[name];
  }
  function play(name, vol) {
    if (!soundOn) return;
    var a = clip(name, false, vol || 0.7);
    if (!a) return;
    try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }
  function setSound(on) {
    soundOn = on;
    $('sound').textContent = on ? 'Sound on' : 'Sound off';
    $('sound').setAttribute('aria-pressed', on ? 'true' : 'false');
    var m = clip('music', true, 0.3);
    if (!m) return;
    try { if (on) { var p = m.play(); if (p && p.catch) p.catch(function () {}); } else { m.pause(); Object.keys(audio).forEach(function (k) { if (audio[k]) audio[k].pause(); }); } } catch (e) {}
  }

  /* ---------- drawing ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function strandPath(j) {
    var d = '', A = 62, L = 200;
    for (var x = 0; x <= 600; x += 6) {
      var squeeze = x > 470 ? 1 - (x - 470) / 150 : 1;
      var y = 130 + A * squeeze * Math.sin((2 * Math.PI * x) / L + (j * 2 * Math.PI) / 3);
      d += (x === 0 ? 'M' : 'L') + x + ' ' + y.toFixed(1);
    }
    return d;
  }
  function drawWeave() {
    var svg = $('weave');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.classList.toggle('joined', S.picks.length === 3);
    S.picks.forEach(function (id, j) {
      var m = MAKERS.filter(function (x) { return x.id === id; })[0];
      ['under', 'over'].forEach(function (layer) {
        var p = document.createElementNS(SVGNS, 'path');
        p.setAttribute('d', strandPath(j));
        p.setAttribute('pathLength', '1');
        p.setAttribute('class', 'strand ' + layer);
        if (layer === 'over') p.setAttribute('stroke', m.color);
        svg.appendChild(p);
        if (reduced) p.classList.add('on');
        else requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.add('on'); }); });
      });
    });
  }
  function drawTeam() {
    var el = $('team');
    while (el.firstChild) el.removeChild(el.firstChild);
    S.picks.forEach(function (id) {
      var img = new Image();
      img.src = A('assets/art/maker-' + id + '.webp');
      img.alt = '';
      el.appendChild(img);
    });
  }
  function bump(id, value) {
    var el = $(id);
    el.textContent = value;
    el.classList.add('bump');
    setTimeout(function () { el.classList.remove('bump'); }, 200);
  }
  function say(text) { $('say').textContent = text; }

  /* ---------- phases ---------- */
  function setPhase(p) {
    S.phase = p;
    S.lock = performance.now() + 350; /* a held finger must not become the next choice */
    $('game').setAttribute('data-phase', p);
    $('sheet').hidden = p !== 'choose';
    $('result').hidden = p !== 'result';
    $('end').hidden = p !== 'end';
  }
  function locked() { return performance.now() < S.lock; }

  function startRound() {
    var r = ROUNDS[S.round];
    S.picks = []; S.choice = null;
    $('game').setAttribute('data-round', S.round);
    $('day').textContent = r.day;
    $('cue').innerHTML = '<b>' + r.day + '</b>' + r.cue;
    $('backdrop').style.backgroundImage = 'url("' + A('assets/art/' + r.bg + '.jpg') + '")';
    $('cart').hidden = true;
    drawBench(); drawWeave(); drawTeam();
    say('Bring three makers together.');
    setPhase('pick');
    S.lock = 0;
  }

  function drawBench() {
    var bench = $('bench');
    while (bench.firstChild) bench.removeChild(bench.firstChild);
    MAKERS.forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'maker'; b.setAttribute('data-id', m.id); b.setAttribute('aria-pressed', 'false');
      var tag = '';
      if (S.returning.indexOf(m.id) >= 0) tag = '<span class="tag">Back again</span>';
      else if (m.id === 'firsttimer' && !S.firstDone) tag = '<span class="tag first">First game</span>';
      b.innerHTML = tag + '<img src="' + A('assets/art/maker-' + m.id + '.webp') + '" alt="" width="140" height="240">' +
        '<span class="role">' + m.role + '</span><span class="thread" style="background:' + m.color + '"></span>';
      b.addEventListener('click', function () { togglePick(m.id); });
      bench.appendChild(b);
    });
  }
  function syncBench() {
    var full = S.picks.length === 3;
    Array.prototype.forEach.call($('bench').children, function (b) {
      var on = S.picks.indexOf(b.getAttribute('data-id')) >= 0;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.disabled = full && !on;
    });
  }
  function togglePick(id) {
    if (S.phase !== 'pick') return;
    var i = S.picks.indexOf(id);
    if (i >= 0) S.picks.splice(i, 1);
    else if (S.picks.length < 3) S.picks.push(id);
    else return;
    play('tap', 0.6);
    syncBench(); drawWeave(); drawTeam();
    if (S.picks.length === 0) say('Tap a maker.');
    else if (S.picks.length < 3) say(S.picks.length + ' of 3');
    else {
      say('Your team is ready.');
      play('braid', 0.7);
      var roundAtPick = S.round;
      setTimeout(function () { if (S.phase === 'pick' && S.picks.length === 3 && S.round === roundAtPick) openSheet(); }, reduced ? 80 : 420);
    }
  }

  function openSheet() {
    var ways = $('ways');
    while (ways.firstChild) ways.removeChild(ways.firstChild);
    WAYS.forEach(function (w) {
      var out = compute(w);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'way'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.setAttribute('data-way', w.id);
      b.innerHTML = '<b>' + w.title + '</b><span class="gain"><span class="g">Games +' + out.g + '</span><span class="t">Trust +' + out.t + '</span></span>' +
        '<span class="body">' + w.body + '</span>' + (out.why.length ? '<span class="why">' + out.why.join(' ') + '</span>' : '');
      b.addEventListener('click', function () { if (locked()) return; choose(w.id); });
      ways.appendChild(b);
    });
    var c = $('commit'); c.disabled = true; c.textContent = 'Choose your approach.';
    setPhase('choose');
    say('Your team is ready.');
  }
  function choose(id) {
    S.choice = id;
    play('tap', 0.6);
    Array.prototype.forEach.call($('ways').children, function (b) { b.setAttribute('aria-checked', b.getAttribute('data-way') === id ? 'true' : 'false'); });
    var c = $('commit'); c.disabled = false; c.textContent = 'Braid it.';
  }
  function changeTeam() { if (S.phase !== 'choose' || locked()) return; S.choice = null; setPhase('pick'); syncBench(); say('Tap again to change your team.'); }

  function commit() {
    if (S.phase !== 'choose' || !S.choice || locked()) return;
    var way = WAYS.filter(function (w) { return w.id === S.choice; })[0];
    var out = compute(way);
    S.games += out.g; S.trust += out.t;
    if (S.picks.indexOf('firsttimer') >= 0) S.firstDone = true;
    var team = S.picks.slice();
    var last = S.round === ROUNDS.length - 1;
    S.prev = way.id;
    /* cartridge */
    var cart = $('cart'); cart.hidden = false; cart.src = A('assets/cart/c0.webp');
    if (!reduced) {
      cart.classList.remove('pop'); void cart.offsetWidth; cart.classList.add('pop');
      var f = 0, spin = setInterval(function () { f += 1; cart.src = A('assets/cart/c' + (f % 8) + '.webp'); if (f >= 16) clearInterval(spin); }, 55);
    }
    play('cart', 0.8);
    bump('games', S.games); bump('trust', S.trust);
    say('Shipped.');
    $('shipped').textContent = 'A game is out in the world.';
    var earned = $('earned');
    earned.innerHTML = '<li><span>' + way.title + '</span><b>Games +' + out.g + '</b></li><li class="t"><span>What the team earned</span><b>Trust +' + out.t + '</b></li>';
    var back = $('back');
    if (out.t >= 1) {
      S.returning = team;
      if (!last) { team.forEach(function (id) { if (S.came.indexOf(id) < 0) S.came.push(id); }); back.textContent = team.length + ' makers will be back, because they trust how this team works.'; }
      else back.textContent = 'This team would do it again.';
      play('cheer', 0.6);
    } else {
      S.returning = [];
      back.textContent = last ? 'It shipped fast. Trust did not grow.' : 'No one came back, because trust did not grow this round.';
    }
    $('next').textContent = last ? 'See what you made' : 'Next: ' + ROUNDS[S.round + 1].day;
    setPhase('result');
  }
  function next() {
    if (S.phase !== 'result' || locked()) return;
    if (S.round === ROUNDS.length - 1) return finish();
    S.round += 1;
    startRound();
  }

  /* ---------- ending ---------- */
  function readBest() { try { var v = window.localStorage.getItem(BEST_KEY); return v === null ? null : parseInt(v, 10); } catch (e) { return undefined; } }
  function writeBest(n) { try { window.localStorage.setItem(BEST_KEY, String(n)); return true; } catch (e) { return false; } }
  var revealTimers = [];
  function finish() {
    var score = S.games * S.trust;
    $('e-games').textContent = S.games; $('e-trust').textContent = S.trust;
    $('e-math').textContent = S.games + ' × ' + S.trust; $('e-score').textContent = score;
    $('e-came').textContent = S.came.length === 0 ? 'No makers came back this time.' : S.came.length + ' of 5 makers came back.';
    var best = readBest(), line;
    if (best === undefined) line = 'This run was not saved.';
    else if (best === null || isNaN(best)) { line = writeBest(score) ? 'Your first run on this device.' : 'This run was not saved.'; }
    else if (score > best) { line = writeBest(score) ? 'New best on this device. The last best was ' + best + '.' : 'This run was not saved.'; }
    else line = 'Best on this device: ' + best + '.';
    $('e-best').textContent = line;
    say('Braid again?');
    $('cue').textContent = 'A proposal you can play.';
    var items = $('reveal').children;
    Array.prototype.forEach.call(items, function (li) { li.classList.remove('show'); });
    revealTimers.forEach(clearTimeout); revealTimers = [];
    Array.prototype.forEach.call(items, function (li, i) {
      if (reduced) li.classList.add('show');
      else revealTimers.push(setTimeout(function () { li.classList.add('show'); if (i === items.length - 1) play('cheer', 0.7); }, 250 + i * 320));
    });
    setPhase('end');
  }
  function showAll() { revealTimers.forEach(clearTimeout); Array.prototype.forEach.call($('reveal').children, function (li) { li.classList.add('show'); }); }
  function restart(passing) {
    if (locked()) return;
    S = fresh(); window.__braid.state = S;
    $('games').textContent = '0'; $('trust').textContent = '1';
    startRound();
    if (passing) {
      var best = readBest();
      if (typeof best === 'number' && !isNaN(best)) $('cue').textContent = 'Your turn. Best on this device: ' + best + '.';
    }
  }

  /* ---------- wiring ---------- */
  function init() {
    S = fresh();
    window.__braid = { state: S, compute: compute, ways: WAYS };
    var change = document.createElement('button');
    change.type = 'button'; change.className = 'quiet'; change.id = 'change'; change.textContent = 'Change your team';
    $('sheet').appendChild(change);
    change.addEventListener('click', changeTeam);
    $('commit').addEventListener('click', commit);
    $('next').addEventListener('click', next);
    $('replay').addEventListener('click', function () { restart(false); });
    $('pass').addEventListener('click', function () { restart(true); });
    $('reveal').addEventListener('click', showAll);
    $('sound').addEventListener('click', function () { setSound(!soundOn); });
    $('pocket').addEventListener('click', function (ev) { /* in the single-file build the companion game travels inside this file */
      if (!window.BRAID_POCKET) return;
      ev.preventDefault();
      try { var bin = atob(window.BRAID_POCKET), arr = new Uint8Array(bin.length); for (var n = 0; n < bin.length; n++) arr[n] = bin.charCodeAt(n);
        location.href = URL.createObjectURL(new Blob([arr], { type: 'text/html' })); } catch (e) {}
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden && soundOn) setSound(false); });
    ['bg-saturday', 'bg-sunday', 'bg-bigstage'].forEach(function (n) { var i = new Image(); i.src = A('assets/art/' + n + '.jpg'); });
    for (var k = 0; k < 8; k++) { var c = new Image(); c.src = A('assets/cart/c' + k + '.webp'); }
    startRound();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
