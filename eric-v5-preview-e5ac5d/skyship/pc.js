/* Sky Ship, PC edition (v5). A full-bleed 16:9 flight drawn on a canvas at native devicePixelRatio (cap 2).
   Steer with W A S D or the arrow keys (a held mouse button steers toward the pointer too).
   Five lanterns, five sourced lines, then the thank-you settle. Every flight ends celebrated: lanterns
   that slip past circle back, and nothing is ever lost. Art: Higgsfield (clouds, galleon). Sound: ElevenLabs. */
(function () {
  'use strict';
  var q = ''; try { q = new URLSearchParams(location.search).get('from') || ''; } catch (e) {}
  var PC = q === 'pc' || (q !== 'phone' && (window.innerWidth || 0) >= 1024);
  if (!PC) return;
  window.__skyPC = true;
  document.body.classList.remove('nojs'); document.body.classList.add('pcmode');

  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var frame = $('#pcframe'), cv = $('#pcc'), g = cv.getContext('2d');
  var LINES = ['Sky Ship Studios. Madison, 2014.', 'Gloom: Digital Edition.', 'The chapter that built the rest.', 'Keep flying.', 'Thank you, Captain.'];
  var N = LINES.length;
  var W = 0, H = 0, D = 1;

  // letterbox to 16:9 inside the viewport, then size the canvas at native DPR
  function fit() {
    var vw = innerWidth, vh = innerHeight, w = Math.min(vw, vh * 16 / 9), h = w * 9 / 16;
    frame.style.width = Math.round(w) + 'px'; frame.style.height = Math.round(h) + 'px';
    D = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.width = Math.round(w * D); H = cv.height = Math.round(h * D);
  }
  fit(); addEventListener('resize', fit);

  // art
  var clouds = new Image(); clouds.src = D > 1 ? 'media/clouds@2x.jpg' : 'media/clouds.jpg';   // DPR selection: 1440 px Higgsfield upscale at DPR 2
  // DPR selection: the ship draws at 30% of the canvas height in device pixels; above the 291px base, use the 900px Higgsfield repaint
  var ship = new Image(); ship.src = H * 0.3 > 291 ? '../img/galleon-2x.png' : '../img/galleon.png';
  addEventListener('resize', function () { if (H * 0.3 > 291 && ship.src.indexOf('galleon-2x') < 0) { var s2 = new Image(); s2.onload = function () { ship = s2; }; s2.src = '../img/galleon-2x.png'; } });
  // the near cloud layer fades in from the top, so it reads as mist drifting past, not a hard band
  var nearTile = null, farTile = null;
  // seamless tile: the painting's right edge crossfades into its left edge, so the sky repeats with no mirror seam
  function seamless(img) {
    var iw = img.naturalWidth, ih = img.naturalHeight, ov = Math.round(iw * 0.35), tw = iw - ov;
    var c = document.createElement('canvas'); c.width = tw; c.height = ih; var x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    var e = document.createElement('canvas'); e.width = ov; e.height = ih; var ex = e.getContext('2d');
    ex.drawImage(img, tw, 0, ov, ih, 0, 0, ov, ih);
    var m = ex.createLinearGradient(0, 0, ov, 0); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
    ex.globalCompositeOperation = 'destination-in'; ex.fillStyle = m; ex.fillRect(0, 0, ov, ih);
    x.drawImage(e, 0, 0); return c;
  }
  clouds.onload = function () {
    farTile = seamless(clouds);
    var c = document.createElement('canvas'); c.width = farTile.width; c.height = farTile.height;
    var x = c.getContext('2d'); x.drawImage(farTile, 0, 0);
    var m = x.createLinearGradient(0, 0, 0, c.height); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.45, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, c.width, c.height); nearTile = c;
  };

  // sound (ElevenLabs files already on this page)
  var AC = window.AudioContext || window.webkitAudioContext, ac = null, master = null, bufs = {}, bed = [];
  // one site-wide Sound flag in the shared ledger: the board's choice holds here, and a change here carries back
  var soundOn = true;
  function applySound(on) { soundOn = !!on; if (master && ac) master.gain.setTargetAtTime(soundOn ? 0.9 : 0, ac.currentTime, 0.05);
    var b = $('#pcsnd'); if (b) { b.firstChild.nodeValue = soundOn ? 'Sound on ' : 'Sound off '; b.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); } }
  function toggleSound() { if (window.ledger) window.ledger.setSound(!soundOn); else applySound(!soundOn); }
  if (window.ledger) window.ledger.bindSound(applySound);
  $('#pcsnd').addEventListener('click', function (e) { e.stopPropagation(); toggleSound(); });
  function audio() {
    if (ac || !AC) { if (ac && ac.state === 'suspended') ac.resume(); return; }
    ac = new AC(); master = ac.createGain(); master.gain.value = soundOn ? 0.9 : 0; master.connect(ac.destination);
    ['music', 'wind', 'whoosh', 'chime', 'bank'].forEach(function (n) {
      fetch('media/' + n + '.mp3').then(function (r) { return r.arrayBuffer(); })
        .then(function (a) { return new Promise(function (ok, no) { ac.decodeAudioData(a, ok, no); }); })
        .then(function (b) { bufs[n] = b; if (n === 'wind' && state === 'fly' && !bed.length) startBed(); }).catch(function () {});
    });
  }
  function play(n, vol, loop, rate) {
    if (!ac || !bufs[n]) return null;
    var s = ac.createBufferSource(), gn = ac.createGain(); s.buffer = bufs[n]; s.loop = !!loop; s.playbackRate.value = rate || 1;
    gn.gain.value = vol; s.connect(gn); gn.connect(master); s.start(); s._g = gn; return s;
  }
  function startBed() { stopBed(); var m = play('music', 0.7, false), w = play('wind', 0.35, true); bed = [m, w].filter(Boolean); }
  function stopBed() { bed.forEach(function (s) { try { s._g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4); s.stop(ac.currentTime + 2); } catch (e) {} }); bed = []; }

  // state
  var state = 'intro', t = 0, scroll = 0, got = 0, lanterns = [], sparks = [], nextSpawn = 0, spawned = 0, endAt = 0, tStart = 0;
  var S = { x: 0.26, y: 0.5, vx: 0, vy: 0, tilt: 0 };
  var MAXV = 0.42;                // screen fractions per second
  var UP = MAXV / 6, DOWN = MAXV / 3;  // per frame at 60 fps: 6 frames to full speed, 3 to stop (Swink)
  var keys = {};
  var pointer = null;

  function counter() {
    var c = $('#pccount'); var h = '<span>Lanterns</span>';
    for (var i = 0; i < N; i++) h += '<i class="' + (i < got ? 'on' : '') + '"></i>';
    c.innerHTML = h; c.setAttribute('aria-label', got + ' of ' + N + ' lanterns');
  }
  counter();

  function reset() {
    state = 'fly'; t = 0; got = 0; lanterns = []; sparks = []; nextSpawn = 0.8; spawned = 0; endAt = 0; tStart = performance.now();
    S.x = 0.26; S.y = 0.5; S.vx = 0; S.vy = 0;
    $('#pcend').classList.remove('on'); [].forEach.call(document.querySelectorAll('#pcend p.l'), function (p) { p.classList.remove('on'); });
    $('#pcstart').style.display = 'none'; $('#pchint').style.opacity = '1'; counter();
    audio(); play('whoosh', 0.8); startBed();
    cv.focus && cv.focus();
  }
  function spawn() {
    var ys = [0.3, 0.68, 0.42, 0.24, 0.6];
    lanterns.push({ i: spawned, x: 1.08, y: ys[spawned % ys.length], got: false, ph: Math.random() * 6, loops: 0 });
    spawned++;
  }
  function collect(L) {
    L.got = true; got++; counter();
    play('chime', 0.7, false, 0.9 + got * 0.06);
    var line = $('#pcline'); line.textContent = LINES[L.i]; line.classList.remove('on'); void line.offsetWidth; line.classList.add('on');
    clearTimeout(line._t); line._t = setTimeout(function () { line.classList.remove('on'); }, 3400);
    burst(L.x, L.y, RM ? 10 : 40);
    if (got >= N) { endAt = t + 2.6; play('bank', 0.8); }
  }
  function burst(x, y, n) {
    var cols = ['#f6c86a', '#ffffff', '#7fb6dc', '#a99ad0', '#ffd98a'];
    for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = 0.05 + Math.random() * 0.25; sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, a: 1, c: cols[i % cols.length], r: 2 + Math.random() * 4 }); }
  }
  function finish() {
    state = 'end';
    try { if (window.ledger) { window.ledger.first('skyship', 'First flight with Sky Ship'); window.ledger.add('lanterns', got); } } catch (e) {}
    var secs = Math.round((performance.now() - tStart) / 1000);
    $('#pctally').textContent = got + ' lanterns lit, ' + secs + ' seconds under sail.';
    $('#pcend').classList.add('on'); $('#pchint').style.opacity = '0';
    play('chime', 0.8, false, 0.8);
    [].forEach.call(document.querySelectorAll('#pcend p.l'), function (p, i) { setTimeout(function () { p.classList.add('on'); }, (RM ? 200 : 900) + i * (RM ? 200 : 1300)); });
    setTimeout(function () { var a = $('#pcagain'); a && a.focus({ preventScroll: true }); }, RM ? 400 : 6000);
  }

  // input: real keys, plus an optional held mouse button
  addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'm') { toggleSound(); return; }
    if (state === 'intro' && (k === 'enter' || k === ' ')) { e.preventDefault(); reset(); return; }
    if (state === 'end' && k === 'enter' && document.activeElement === document.body) { e.preventDefault(); reset(); return; }
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) { keys[k] = true; e.preventDefault(); }
  });
  addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  addEventListener('blur', function () { keys = {}; });
  cv.addEventListener('pointerdown', function (e) { var r = cv.getBoundingClientRect(); pointer = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; });
  cv.addEventListener('pointermove', function (e) { if (!pointer) return; var r = cv.getBoundingClientRect(); pointer.x = (e.clientX - r.left) / r.width; pointer.y = (e.clientY - r.top) / r.height; });
  addEventListener('pointerup', function () { pointer = null; });
  $('#pcstart').addEventListener('click', reset);
  $('#pcagain').addEventListener('click', reset);

  function axis(neg, pos) { var a = 0; neg.forEach(function (k) { if (keys[k]) a -= 1; }); pos.forEach(function (k) { if (keys[k]) a += 1; }); return a; }
  function approach(v, target, f) {   // eased velocity: ramp up in 6 frames, settle in 3
    var step = (Math.abs(target) > Math.abs(v) && Math.sign(target) !== -Math.sign(v) ? UP : DOWN) * f;
    if (v < target) return Math.min(target, v + step); if (v > target) return Math.max(target, v - step); return v;
  }

  function update(dt) {
    var f = dt * 60;
    scroll += dt * (state === 'end' ? 0.05 : RM ? 0.08 : 0.16);
    if (state !== 'fly') { S.vx *= 0.9; S.vy *= 0.9; return; }
    t += dt;
    var ax = axis(['a', 'arrowleft'], ['d', 'arrowright']), ay = axis(['w', 'arrowup'], ['s', 'arrowdown']);
    if (pointer && !ax && !ay) { var dx = pointer.x - S.x, dy = pointer.y - S.y; ax = Math.abs(dx) > 0.02 ? Math.sign(dx) : 0; ay = Math.abs(dy) > 0.02 ? Math.sign(dy) : 0; }
    S.vx = approach(S.vx, ax * MAXV, f); S.vy = approach(S.vy, ay * MAXV, f);
    S.x = Math.max(0.08, Math.min(0.62, S.x + S.vx * dt)); S.y = Math.max(0.14, Math.min(0.86, S.y + S.vy * dt));
    S.tilt += ((S.vy / MAXV) * 0.16 - S.tilt) * Math.min(1, dt * 8);
    if (ax || ay) $('#pchint').style.opacity = t > 6 ? '0' : '1';
    if (spawned < N && t >= nextSpawn) { spawn(); nextSpawn = t + 5.6; }
    lanterns.forEach(function (L) {
      if (L.got) return;
      L.x -= dt * 0.16;
      var dx = S.x + 0.04 - L.x, dy = S.y - L.y, d = Math.hypot(dx * 16 / 9, dy);
      if (d < 0.2) { L.x += dx * dt * 1.6; L.y += dy * dt * 1.6; }    // a gentle pull when close
      if (d < 0.075) collect(L);
      if (L.x < -0.06) { L.x = 1.08; L.loops++; L.y = 0.25 + Math.random() * 0.5; }   // it circles back; nothing is lost
      if (t > 46 && !L.got) { L.x += (S.x + 0.04 - L.x) * dt * 3; L.y += (S.y - L.y) * dt * 3; }   // late in the flight they come to you
    });
    if (endAt && t >= endAt) finish();
  }

  function drawClouds(off, alpha, scale, yOff, img) {
    img = img || farTile;
    if (!img) return;
    // a repeat-x pattern at whole-pixel size: tiles meet exactly, no overlap line and no gap
    var h = Math.round(H * scale), w = Math.round(img.width * h / img.height);
    if (!img._pat || img._pw !== w || img._ph !== h) {
      var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      img._pat = g.createPattern(c, 'repeat-x'); img._pw = w; img._ph = h;
    }
    var x0 = Math.round(-((off * W) % w));
    g.save(); g.globalAlpha = alpha; g.translate(x0, Math.round(H * yOff)); g.fillStyle = img._pat; g.fillRect(0, 0, W - x0 + 1, h); g.restore();
  }
  function lantern(L, now) {
    var x = L.x * W, y = L.y * H + Math.sin(now * 2 + L.ph) * H * 0.008, r = H * 0.034;
    var halo = g.createRadialGradient(x, y, 0, x, y, r * 3.2);
    halo.addColorStop(0, 'rgba(255,236,170,0.9)'); halo.addColorStop(0.35, 'rgba(246,200,106,0.45)'); halo.addColorStop(1, 'rgba(246,200,106,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(x, y, r * 3.2, 0, 6.283); g.fill();
    g.fillStyle = '#e8902e'; g.beginPath(); g.ellipse(x, y, r * 0.78, r, 0, 0, 6.283); g.fill();
    var core = g.createRadialGradient(x, y - r * 0.2, 0, x, y, r);
    core.addColorStop(0, '#fffbe8'); core.addColorStop(0.6, '#ffd36b'); core.addColorStop(1, 'rgba(232,144,46,0)');
    g.fillStyle = core; g.beginPath(); g.ellipse(x, y, r * 0.7, r * 0.92, 0, 0, 6.283); g.fill();
    g.fillStyle = '#7a4a1a'; g.fillRect(x - r * 0.35, y - r * 1.08, r * 0.7, r * 0.16); g.fillRect(x - r * 0.3, y + r * 0.94, r * 0.6, r * 0.14);
  }
  function draw(now) {
    // golden-hour sky, then two parallax watercolor cloud layers, then a warm sun
    var sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#f7d9b0'); sky.addColorStop(0.55, '#f6c896'); sky.addColorStop(1, '#d9b5c9');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    drawClouds(scroll * 0.35, 1, 1, 0);
    var sx = W * 0.8, sy = H * 0.28, sun = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.5);
    sun.addColorStop(0, 'rgba(255,248,220,0.85)'); sun.addColorStop(0.3, 'rgba(255,226,160,0.35)'); sun.addColorStop(1, 'rgba(255,226,160,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    lanterns.forEach(function (L) { if (!L.got) lantern(L, now); });
    // the ship
    if (ship.complete && ship.naturalWidth) {
      var sw = H * 0.3, sh = sw * ship.naturalHeight / ship.naturalWidth;
      var bob = RM ? 0 : Math.sin(now * 1.6) * H * 0.006;
      g.save(); g.translate(S.x * W, S.y * H + bob); g.rotate(S.tilt);
      g.shadowColor = 'rgba(255,240,200,0.9)'; g.shadowBlur = 18 * D;
      g.drawImage(ship, -sw / 2, -sh / 2, sw, sh); g.restore();
      if (!RM && state === 'fly' && Math.random() < 0.5) sparks.push({ x: S.x - 0.06, y: S.y + 0.05, vx: -0.08 - Math.random() * 0.05, vy: (Math.random() - 0.5) * 0.04, a: 0.8, c: Math.random() < 0.5 ? '#ffffff' : '#f6c86a', r: 1.5 + Math.random() * 2.5 });
    }
    if (nearTile) drawClouds(scroll * 0.9, RM ? 0.3 : 0.5, 1.25, 0.3, nearTile);   // near layer drifts past faster
    for (var i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i]; p.x += p.vx / 60; p.y += p.vy / 60; p.a -= 0.018;
      if (p.a <= 0) { sparks.splice(i, 1); continue; }
      g.globalAlpha = p.a; g.fillStyle = p.c; g.beginPath(); g.arc(p.x * W, p.y * H, p.r * D, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
  }

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    update(dt); draw(now / 1000);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  setTimeout(function () { var b = $('#pcstart'); b && b.focus({ preventScroll: true }); }, 300);

  // QA hooks (read-only): positions are 0..1 of the 16:9 frame
  window.__sky = {
    state: function () {
      var nx = lanterns.filter(function (L) { return !L.got; })[0] || null;
      return { mode: 'pc', state: state, lanterns: got, total: N, ended: state === 'end', t: Math.round(t * 10) / 10,
        ship: { x: S.x, y: S.y }, next: nx ? { x: nx.x, y: nx.y } : null, dpr: D, canvas: [W, H] };
    }
  };
})();
