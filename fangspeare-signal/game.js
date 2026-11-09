/* FANGSPEARE: THE SIGNAL BELOW. Rendering, audio and scenes (Phaser 3.90). Rules live in logic.js. */
(function () {
  'use strict';
  const F = window.FL;
  const W = 720, H = 1280;
  let RM = false;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { RM = false; }
  const FD = "'Shippori Mincho B1', Georgia, serif";
  const FM = "'IBM Plex Mono', Menlo, monospace";
  const FB = "Archivo, system-ui, sans-serif";
  const C = { ink: '#ECE2CC', ice: '#CFE3EC', teal: '#3ff2d0', violet: '#b08cff', ember: '#E8743B', red: '#C4412F', dim: '#8fa8b3', gold: '#ffd36b' };
  const HEX = { teal: 0x3ff2d0, violet: 0x9b6bff, ice: 0xcfe3ec, ember: 0xe8743b, navy: 0x0b1220, deep: 0x05080f, red: 0xc4412f, gold: 0xffd36b };
  const fmt = (n) => Math.round(n).toLocaleString('en-US');
  const fmtRes = (r) => (Math.round(r * 100) / 100).toString();

  // ---------------- storage (per viewer convenience only) ----------------
  const KEY = 'fangspeare-signal-below-v1';
  function loadSave() { try { return JSON.parse(window.localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  const SAVE = Object.assign({ best: { depth: 0, score: 0, drop: 0 }, codex: ['sage', 'signal', 'cymatics'], wins: 0, deeper: 0, runs: 0, story: false, seen: {} }, loadSave());
  function persist() { try { window.localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch (e) { /* private mode: fine */ } }
  function unlock(id) { if (SAVE.codex.indexOf(id) < 0) { SAVE.codex.push(id); persist(); return true; } return false; }

  // ---------------- audio: Foster's own tracks + ElevenLabs SFX ----------------
  const TRACKS = {
    old: { file: 'assets/music/old-ones.mp3', drops: [34.299, 123.442], title: 'Old Ones' },
    tek: { file: 'assets/music/tekeli-li.mp3', drops: [41.015, 137.015], title: 'Tekeli-li' },
  };
  const SFX = ['rune', 'hum', 'ice', 'freeze', 'roar', 'relic', 'tekeli', 'fail'];
  const BEAT = 60 / 140, DROP_DUR = 8 * BEAT; // two bars at 140 BPM
  const AU = {
    ctx: null, buf: {}, master: null, ambSrc: null, ambGain: null, ambFilter: null, want: null, full: null, muted: false,
    boot() {
      try { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; this.ctx = new AC(); } catch (e) { this.ctx = null; return; }
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
      const jobs = SFX.map((k) => [k, 'assets/sfx/' + k + '.mp3']).concat([['old', TRACKS.old.file], ['tek', TRACKS.tek.file]]);
      jobs.forEach(([k, url]) => {
        fetch(url).then((r) => r.arrayBuffer()).then((ab) => this.decode(ab)).then((b) => {
          this.buf[k] = b;
          if (this.want && this.want === k) this.ambient(k);
        }).catch(() => { /* audio is optional */ });
      });
    },
    decode(ab) { return new Promise((res, rej) => { try { const p = this.ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); },
    resume() { if (this.ctx && this.ctx.state !== 'running') { try { this.ctx.resume(); } catch (e) { /* */ } } },
    sfx(k, vol, rate) {
      if (!this.ctx || !this.buf[k] || this.muted) return;
      const s = this.ctx.createBufferSource(); s.buffer = this.buf[k]; s.playbackRate.value = rate || 1;
      const g = this.ctx.createGain(); g.gain.value = vol == null ? 0.8 : vol; s.connect(g); g.connect(this.master); s.start();
    },
    stopAmbient() {
      if (this.ambSrc) { try { const t = this.ctx.currentTime; this.ambGain.gain.setTargetAtTime(0, t, 0.15); this.ambSrc.stop(t + 0.6); } catch (e) { /* */ } }
      this.ambSrc = null;
    },
    ambient(k) {
      this.want = k;
      if (!this.ctx || !this.buf[k]) return;
      this.stopAmbient();
      const T = TRACKS[k];
      const s = this.ctx.createBufferSource(); s.buffer = this.buf[k]; s.loop = true; s.loopStart = 1.0; s.loopEnd = T.drops[0] - 0.4;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 560; f.Q.value = 3;
      const g = this.ctx.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(this.master);
      s.start(0, 1.0); g.gain.setTargetAtTime(this.muted ? 0 : 0.55, this.ctx.currentTime, 0.4);
      this.ambSrc = s; this.ambGain = g; this.ambFilter = f;
    },
    drop(k, which, bar) {
      if (!this.ctx || !this.buf[k] || this.muted) return;
      const T = TRACKS[k];
      const start = T.drops[which] + (bar % 12) * DROP_DUR;
      const s = this.ctx.createBufferSource(); s.buffer = this.buf[k];
      const g = this.ctx.createGain(); const t0 = this.ctx.currentTime + 0.02;
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(1, t0 + 0.01);
      g.gain.setValueAtTime(1, t0 + DROP_DUR - 0.12); g.gain.linearRampToValueAtTime(0, t0 + DROP_DUR + 0.25);
      s.connect(g); g.connect(this.master); s.start(t0, start); s.stop(t0 + DROP_DUR + 0.3);
      if (this.ambGain) { this.ambGain.gain.setTargetAtTime(0.03, t0, 0.05); this.ambGain.gain.setTargetAtTime(0.55, t0 + DROP_DUR, 0.5); }
    },
    listen(k) { // the listening room: whole track, open filter
      if (!this.ctx) return false;
      if (this.full) { try { this.full.stop(); } catch (e) { /* */ } const was = this.full.k; this.full = null; if (was === k) { if (this.ambGain) this.ambGain.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.3); return false; } }
      if (!this.buf[k]) return false;
      const s = this.ctx.createBufferSource(); s.buffer = this.buf[k]; s.connect(this.master); s.start(); s.k = k; this.full = s;
      if (this.ambGain) this.ambGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
      s.onended = () => { if (this.full === s) this.full = null; };
      return true;
    },
    stopListen() { if (this.full) { try { this.full.stop(); } catch (e) { /* */ } this.full = null; } },
    setMuted(m) { this.muted = m; if (this.ambGain && this.ctx) this.ambGain.gain.setTargetAtTime(m ? 0 : 0.55, this.ctx.currentTime, 0.1); if (m) this.stopListen(); },
  };

  // ---------------- lore codex (only what the sources support) ----------------
  const CODEX = [
    { id: 'sage', t: 'The Sage', x: "The frog sage of FANGSPEARE: basket hat, robe, a didgeridoo for a staff. In Foster's world the sage is the traveler, and the stories are the places he plays. Here he plays his way down, one drop at a time." },
    { id: 'signal', t: 'The Signal Below', x: "FANGSPEARE is Foster Birch's dark, grimy, Lovecraft-themed bass project, from his label, Ghost Voltage Records. \"The Signal Below\" is the line the bass voice shouts in The Freeze, the toad sage video cut to Old Ones." },
    { id: 'cymatics', t: 'Cymatics at 60 Hz', x: "In 1787 Ernst Chladni bowed sand-covered plates and watched the sand gather on the nodal lines, the places where the plate stays still. Foster makes cymatics as a hobby, and 60 Hz is his favorite frequency. The plate in this game hums at 60 Hz. Its patterns are simulated, not measured." },
    { id: 'runes', t: 'Lemurian Runes', x: "No script survives from Lemuria, so these glyphs are drawn new: ancient and extremely advanced, Foster's own brief for the look. Ancient alien dubstep, carved in basalt." },
    { id: 'oldones', t: 'Old Ones (the track)', x: 'FANGSPEARE, "Old Ones." 140 BPM. The drop lands at 34.3 seconds, and the Freeze video was cut so the ice hits right on it. Every drop you play in the Ice chambers is a real slice of that drop.' },
    { id: 'tekeli', t: 'Tekeli-li (the track)', x: 'FANGSPEARE, "Tekeli-li." 140 BPM, the drop at 41.0 seconds. The title is the cry in Poe\'s Arthur Gordon Pym (1838) that Lovecraft gave to the shoggoths.' },
    { id: 'atmom', t: 'At the Mountains of Madness', x: 'H. P. Lovecraft wrote it in 1931; Astounding Stories ran it in 1936. A Miskatonic University expedition finds black peaks beyond the known Antarctic ranges and, behind them, a dead city.' },
    { id: 'elder', t: 'The Old Ones', x: 'Barrel-bodied, star-headed, winged, with five-part symmetry in everything they built. They came from the stars, raised the Antarctic city, and made the shoggoths to serve them. In the novella some of them are only sleeping in the ice.' },
    { id: 'shoggoth', t: 'Shoggoths', x: 'Living protoplasm the Old Ones bred as servants, able to form eyes and limbs at will. In time they rebelled. They still pipe the cry they learned from their makers: Tekeli-li.' },
    { id: 'penguins', t: 'The Pale Penguins', x: 'Deep under the ice the explorers meet giant blind albino penguins, pale and harmless, waddling through the dark tunnels toward a black underground sea.' },
    { id: 'mound', t: 'The Mound', x: "Ghostwritten by Lovecraft for Zealia Bishop around 1929 to 1930 and published in Weird Tales in 1940. Under an Oklahoma mound lies blue-lit K'n-yan, below it red-lit Yoth, below that black N'kai. Foster wants this story told as a serial." },
    { id: 'knyan', t: "K'n-yan and Yoth", x: "K'n-yan found toad-shaped images of Tsathoggua in the ruins of Yoth and raised shrines to him. Then explorers went down to N'kai and saw what still tended him there, and K'n-yan shut the shrines." },
    { id: 'tsath', t: 'Tsathoggua', x: 'Created by Clark Ashton Smith ("The Tale of Satampra Zeiros," Weird Tales, 1931) and shared with Lovecraft. Squat, furry, toad-like, a little like a bat and a sloth, endlessly drowsy, at home in Hyperborea and in N\'kai. Foster loves the Tsathoggua mask.' },
    { id: 'tiwanaku', t: 'The Tiwanaku Cramp', x: 'At Pumapunku in the Bolivian Andes, the Tiwanaku builders keyed stone blocks together with I-shaped bronze cramps so each stone locked into its neighbors. Masterful human engineering, and the idea behind the Cramp relic.' },
    { id: 'freeze', t: 'The Freeze', x: "Foster's toad sage music video to Old Ones: staff dance, the slam, and an eight-count ice freeze right on the drop. The Frost runes and the Freeze relic are a nod to it." },
  ];
  const CODEX_FOR = { ice: 'atmom', peaks: 'atmom', city: 'elder', tunnel: 'shoggoth', grotto: 'penguins', shog: 'shoggoth', knyan: 'knyan', yoth: 'mound', nkai: 'tsath' };
  const FLAVOR = {
    ice: 'Polar night on the ice shelf. Something under the white is listening for a signal.',
    peaks: 'Black peaks taller than any map allows, and five-pointed stars carved into the stone.',
    city: 'A dead city of the Old Ones, sealed in ice for ages. One of them is not dead.',
    tunnel: 'Perfectly round tunnels, polished smooth by something that flowed through them.',
    grotto: 'A black sea under the ice. Giant blind penguins, pale as bone, hum in the dark.',
    shog: 'Tekeli-li! Tekeli-li! The cry the shoggoths learned from their makers.',
    knyan: "Below the mound, a blue-lit world. K'n-yan once raised shrines to Tsathoggua, then sealed them.",
    yoth: 'Red-litten Yoth, older still. Toad-shaped statues watch the plain.',
    nkai: "Black N'kai, without light. Something vast and drowsy waits on a basalt shrine.",
  };

  // ---------------- run state ----------------
  let RUN = null, CH = null;
  function todaySeed() {
    const d = new Date(); let s;
    try { s = d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); } catch (e) { s = d.toISOString().slice(0, 10); }
    return { label: s, seed: F.hashStr('fangspeare-' + s) };
  }
  function startRun(kind) {
    let seed, label;
    if (kind === 'daily') { const t = todaySeed(); seed = t.seed; label = "Tonight's Descent " + t.label; }
    else { seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; label = 'Seed ' + seed.toString(36).toUpperCase(); }
    RUN = F.newRun({ seed, story: SAVE.story, deeper: kind === 'daily' ? 0 : Math.min(SAVE.deeper, SAVE.deeperPick || 0) });
    RUN.label = label; RUN.kind = kind;
    SAVE.runs++; persist();
  }

  // ---------------- shared drawing helpers ----------------
  function txt(scene, x, y, s, size, color, opts) {
    const sz = size <= 16 ? size + 6 : size <= 22 ? size + 5 : size;
    const o = Object.assign({ fontFamily: FB, fontSize: sz + 'px', color: color || C.ink }, opts || {});
    return scene.add.text(x, y, s, o);
  }
  function button(scene, x, y, w, h, label, onTap, opts) {
    opts = opts || {};
    const g = scene.add.graphics();
    const draw = (hot) => {
      g.clear();
      g.fillStyle(opts.fill || 0x07101c, opts.alpha == null ? 0.88 : opts.alpha); g.fillRect(x - w / 2, y - h / 2, w, h);
      g.lineStyle(2, opts.line || HEX.teal, hot ? 1 : 0.7); g.strokeRect(x - w / 2, y - h / 2, w, h);
      g.lineStyle(1, opts.line || HEX.teal, 0.25); g.strokeRect(x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 10);
    };
    draw(false);
    const t = txt(scene, x, y, label, opts.size || 26, opts.color || C.ice, { fontFamily: opts.font || FD, align: 'center' }).setOrigin(0.5);
    if (opts.spacing) t.setLetterSpacing(opts.spacing);
    const z = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    z.on('pointerover', () => draw(true)); z.on('pointerout', () => draw(false));
    z.on('pointerup', () => { AU.resume(); onTap(); });
    return { g, t, z, draw, setLabel: (s) => t.setText(s), setVisible(v) { g.setVisible(v); t.setVisible(v); z.setVisible(v); if (v) z.setInteractive(); else z.disableInteractive(); return this; }, destroy() { g.destroy(); t.destroy(); z.destroy(); } };
  }

  // rune glyphs: carved basalt tile (Blender) + new Lemurian strokes, glow drawn with canvas shadow
  function makeRuneTextures(scene) {
    const tileImg = scene.textures.get('tile').getSourceImage();
    const S = 112;
    Object.keys(F.RUNES).forEach((t) => {
      const ct = scene.textures.createCanvas('rune_' + t, S, S); const g = ct.getContext();
      g.drawImage(tileImg, 0, 0, S, S);
      const col = '#' + F.RUNES[t].color.toString(16).padStart(6, '0');
      g.save(); g.translate(S / 2, S / 2);
      g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
      const pass = (blur, lw, alpha) => { g.shadowColor = col; g.shadowBlur = blur; g.lineWidth = lw; g.globalAlpha = alpha; glyph(g, t); };
      pass(16, 7, 0.45); pass(6, 3.4, 1);
      g.restore(); ct.refresh();
    });
    function glyph(g, t) {
      const L = (pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.stroke(); };
      const A = (r, a0, a1) => { g.beginPath(); g.arc(0, 0, r, a0, a1); g.stroke(); };
      const D = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
      switch (t) {
        case 'sub': A(9, 0, 7); A(20, 0.4, 2.7); A(20, 3.5, 5.9); L([0, -30, 0, -12]); L([0, 12, 0, 30]); break;
        case 'pulse': L([-26, 10, -13, -4, 0, 10, 13, -4, 26, 10]); L([-26, -6, -13, -20, 0, -6, 13, -20, 26, -6]); L([-18, 24, 18, 24]); break;
        case 'node': A(22, 0, 7); D(0, -22, 4.5); D(0, 22, 4.5); D(-22, 0, 4.5); D(22, 0, 4.5); L([-8, -8, 8, 8]); L([8, -8, -8, 8]); break;
        case 'echo': A(18, -2.2, -0.9); A(18, 0.9, 2.2); A(28, -2.4, -0.7); A(28, 0.7, 2.4); L([0, -26, 0, 26]); break;
        case 'frost': for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const x = Math.cos(a) * 28, y = Math.sin(a) * 28; L([0, 0, x, y]); const mx = Math.cos(a) * 16, my = Math.sin(a) * 16; L([mx, my, mx + Math.cos(a + 0.9) * 8, my + Math.sin(a + 0.9) * 8]); L([mx, my, mx + Math.cos(a - 0.9) * 8, my + Math.sin(a - 0.9) * 8]); } break;
        case 'ember': L([0, -28, 25, 18, -25, 18, 0, -28]); D(0, 6, 6); L([0, -12, 0, -2]); break;
        case 'elder': { const p = []; for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const r = k % 2 ? 12 : 30; p.push(Math.cos(a) * r, Math.sin(a) * r); } L(p); D(0, 0, 4); break; }
      }
    }
    // ice overlay
    const ice = scene.textures.createCanvas('icecell', S, S); const g = ice.getContext();
    const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, 'rgba(207,227,236,0.80)'); gr.addColorStop(1, 'rgba(120,190,230,0.55)');
    g.fillStyle = gr; g.fillRect(4, 4, S - 8, S - 8);
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2;
    const r = F.rng(42);
    for (let k = 0; k < 7; k++) { g.beginPath(); let x = S * r(), y = S * r(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 44; y += (r() - 0.5) * 44; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(159,232,255,1)'; g.lineWidth = 3; g.strokeRect(5, 5, S - 10, S - 10);
    ice.refresh();
    // soft glow dot for particles and halos
    const dot = scene.textures.createCanvas('halo', 128, 128); const d = dot.getContext();
    const rg = d.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.35)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    d.fillStyle = rg; d.fillRect(0, 0, 128, 128); dot.refresh();
  }

  // ======================= BOOT =======================
  class Boot extends Phaser.Scene {
    constructor() { super('boot'); }
    preload() {
      const bar = this.add.graphics();
      const t = txt(this, W / 2, H / 2 - 40, 'carving the plate', 22, C.dim, { fontFamily: FM }).setOrigin(0.5);
      this.load.on('progress', (p) => { bar.clear(); bar.fillStyle(HEX.teal, 0.8); bar.fillRect(W / 2 - 150, H / 2, 300 * p, 3); });
      ['title', 'ice', 'peaks', 'city', 'tunnel', 'grotto', 'shogarena', 'knyan', 'yoth', 'nkai'].forEach((k) => this.load.image('bg_' + k, 'assets/img/bg_' + k + '.jpg'));
      this.load.image('plate', 'assets/img/plate.jpg');
      ['sage_idle', 'sage_cast', 'sage_rest', 'boss_elder', 'boss_shoggoth', 'boss_tsath', 'tile'].forEach((k) => this.load.image(k, 'assets/sprites/' + k + '.png'));
      this.load.once('complete', () => t.destroy());
    }
    create() {
      makeRuneTextures(this);
      const fb = document.getElementById('fallback'); if (fb) fb.classList.add('hide');
      this.scene.start('title');
    }
  }

  // ======================= TITLE =======================
  class Title extends Phaser.Scene {
    constructor() { super('title'); }
    create() {
      AU.ambient('old');
      this.add.image(W / 2, H / 2, 'bg_title').setDisplaySize(W, H);
      const shade = this.add.graphics(); shade.fillStyle(HEX.deep, 0.35); shade.fillRect(0, 0, W, H);
      shade.fillStyle(HEX.deep, 0.55); shade.fillRect(0, 760, W, 520);
      const t1 = txt(this, W / 2, 120, 'FANGSPEARE', 66, C.ice, { fontFamily: FD }).setOrigin(0.5).setLetterSpacing(10);
      t1.setShadow(0, 0, '#3ff2d0', 18, false, true);
      txt(this, W / 2, 196, 'THE SIGNAL BELOW', 26, C.teal, { fontFamily: FM }).setOrigin(0.5).setLetterSpacing(9);
      txt(this, W / 2, 238, 'a bass ritual descent, scored to "Old Ones" and "Tekeli-li"', 19, C.dim).setOrigin(0.5);
      const sage = this.add.image(W / 2, 560, 'sage_idle').setScale(0.9);
      const halo = this.add.image(W / 2, 760, 'halo').setTint(HEX.teal).setScale(5, 1.2).setAlpha(0.35).setBlendMode('ADD');
      if (!RM) this.tweens.add({ targets: sage, y: 550, duration: BEAT * 4000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      if (!RM) this.tweens.add({ targets: halo, alpha: 0.6, duration: BEAT * 1000, yoyo: true, repeat: -1 });

      const b = SAVE.best;
      const bestLine = b.depth ? 'Deepest ' + b.depth + '/9   Best drop ' + fmt(b.drop) + '   Wins ' + SAVE.wins : 'Nine chambers under the ice. Carve runes, hit the drop.';
      txt(this, W / 2, 806, bestLine, 18, C.dim, { fontFamily: FM, align: 'center', wordWrap: { width: 660 } }).setOrigin(0.5);

      button(this, W / 2, 878, 520, 86, 'DESCEND', () => { startRun('run'); this.scene.start('play'); }, { size: 36, spacing: 8 });
      button(this, W / 2, 978, 520, 72, "TONIGHT'S DESCENT", () => { startRun('daily'); this.scene.start('play'); }, { size: 24, spacing: 4, line: HEX.violet });
      txt(this, W / 2, 1024, 'same seed for everyone tonight: compare runs with Gordon', 16, C.dim).setOrigin(0.5);

      const modeBtn = button(this, W / 2 - 132, 1100, 252, 64, '', () => { SAVE.story = !SAVE.story; persist(); paintMode(); }, { size: 19, font: FM, line: HEX.ice });
      const paintMode = () => modeBtn.setLabel(SAVE.story ? 'STORY MODE: ON' : 'STORY MODE: OFF');
      paintMode();
      button(this, W / 2 + 132, 1100, 252, 64, 'CODEX + MUSIC', () => this.scene.start('codex', { from: 'title' }), { size: 19, font: FM, line: HEX.ice });
      if (SAVE.deeper > 0) {
        const dBtn = button(this, W / 2, 1176, 520, 56, '', () => { SAVE.deeperPick = ((SAVE.deeperPick || 0) + 1) % (SAVE.deeper + 1); persist(); paintD(); }, { size: 18, font: FM, line: HEX.gold, color: C.gold });
        const paintD = () => dBtn.setLabel('DEEPER: ' + (SAVE.deeperPick || 0) + ' of ' + SAVE.deeper + '  (tap to change)');
        paintD();
      } else {
        txt(this, W / 2, 1176, 'Story mode: half the Dread, and you keep descending even if a chamber holds.', 15, C.dim, { wordWrap: { width: 600 }, align: 'center' }).setOrigin(0.5);
      }
      const mute = txt(this, W - 24, 24, AU.muted ? 'SOUND OFF' : 'SOUND ON', 16, C.dim, { fontFamily: FM }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      mute.on('pointerup', () => { AU.resume(); AU.setMuted(!AU.muted); mute.setText(AU.muted ? 'SOUND OFF' : 'SOUND ON'); });
      txt(this, W / 2, 1250, 'Music: FANGSPEARE. Made for Foster.', 14, '#5f7a86', { fontFamily: FM }).setOrigin(0.5);
      this.input.once('pointerdown', () => AU.resume());
      window.__FS = { scene: 'title' };
    }
  }

  // ======================= PLAY =======================
  const CELL = 108, PX = W / 2 - CELL * 2.5, PY = 414; // plate origin
  const HAND_Y = 1072, HAND_X0 = 76, HAND_DX = 113.6;
  class Play extends Phaser.Scene {
    constructor() { super('play'); }
    create() {
      CH = F.newChamber(RUN);
      const Cc = CH.C;
      this.busy = false; this.sel = -1; this.cellSpr = {}; this.iceSpr = {}; this.handSpr = [];
      unlock(CODEX_FOR[Cc.id]);
      if (Cc.track === 'old') unlock('oldones'); else unlock('tekeli');
      unlock('runes');
      AU.ambient(Cc.track);

      // backdrop
      this.add.image(W / 2, H / 2, 'bg_' + Cc.bg).setDisplaySize(W, H);
      const sh = this.add.graphics();
      sh.fillStyle(HEX.deep, 0.30); sh.fillRect(0, 0, W, H);
      sh.fillStyle(HEX.deep, 0.62); sh.fillRect(0, 0, W, 88);
      sh.fillStyle(HEX.deep, 0.70); sh.fillRect(0, PY - 74, W, H - PY + 74);

      // header
      txt(this, 22, 16, 'CHAMBER ' + (CH.idx + 1) + ' / 9' + (RUN.story ? '   STORY' : '') + (RUN.deeper ? '   DEEPER ' + RUN.deeper : ''), 15, C.dim, { fontFamily: FM }).setLetterSpacing(2);
      txt(this, 22, 36, Cc.name.toUpperCase(), 30, C.ice, { fontFamily: FD }).setLetterSpacing(3);
      this.scoreT = txt(this, W - 22, 16, '', 15, C.dim, { fontFamily: FM, align: 'right' }).setOrigin(1, 0);
      this.relicRow();

      // sage + thing
      this.sage = this.add.image(108, 288, 'sage_idle').setScale(0.48);
      this.thingX = 600; this.thingY = 262;
      if (Cc.boss) {
        this.thing = this.add.image(this.thingX, this.thingY, 'boss_' + Cc.boss).setScale(Cc.boss === 'shoggoth' ? 0.62 : 0.52);
      } else {
        this.thing = this.add.container(this.thingX, this.thingY);
        this.sigil = this.add.graphics(); this.thing.add(this.sigil); this.drawSigil(0);
      }
      if (!RM) this.tweens.add({ targets: this.thing, y: this.thingY - 8, duration: BEAT * 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      txt(this, W / 2 + 8, 112, Cc.thing, 24, Cc.boss ? C.gold : C.ice, { fontFamily: FD, align: 'center' }).setOrigin(0.5, 0);
      this.dreadG = this.add.graphics();
      this.dreadT = txt(this, W / 2 + 8, 176, '', 17, C.ink, { fontFamily: FM }).setOrigin(0.5, 0);
      this.ruleT = txt(this, W / 2 + 8, 206, Cc.rule, 15, '#b9cbd3', { wordWrap: { width: 300 }, align: 'center', lineSpacing: 2 }).setOrigin(0.5, 0);
      this.drawDread();

      // math line
      this.mathG = this.add.graphics();
      this.mathG.fillStyle(0x03060c, 0.85); this.mathG.fillRect(20, PY - 70, W - 40, 58);
      this.mathG.lineStyle(1, HEX.teal, 0.4); this.mathG.strokeRect(20, PY - 70, W - 40, 58);
      this.bassL = txt(this, 44, PY - 64, 'BASS', 12, C.dim, { fontFamily: FM });
      this.bassT = txt(this, 44, PY - 50, '0', 30, C.teal, { fontFamily: FM, fontStyle: '700' });
      this.xT = txt(this, 236, PY - 48, 'x', 26, C.dim, { fontFamily: FM });
      this.resL = txt(this, 274, PY - 64, 'RES', 12, C.dim, { fontFamily: FM });
      this.resT = txt(this, 274, PY - 50, '1', 30, C.violet, { fontFamily: FM, fontStyle: '700' });
      this.eqT = txt(this, 424, PY - 48, '=', 26, C.dim, { fontFamily: FM });
      this.totL = txt(this, W - 44, PY - 64, 'DROP', 12, C.dim, { fontFamily: FM }).setOrigin(1, 0);
      this.totT = txt(this, W - 44, PY - 50, '0', 30, C.ink, { fontFamily: FM, fontStyle: '700' }).setOrigin(1, 0);

      // plate
      const plate = this.add.image(W / 2, PY + CELL * 2.5, 'plate').setDisplaySize(CELL * 5 + 16, CELL * 5 + 16).setAlpha(0.42);
      this.plate = plate;
      this.gridG = this.add.graphics();
      this.sandG = this.add.graphics();
      this.partG = this.add.graphics();
      this.layerTiles = this.add.container(0, 0);
      this.layerIce = this.add.container(0, 0);
      this.fxLayer = this.add.container(0, 0);
      this.drawGrid();
      this.initSand();
      for (let i = 0; i < 25; i++) {
        const z = this.add.zone(this.cx(i), this.cy(i), CELL - 4, CELL - 4).setInteractive();
        z.on('pointerup', () => this.tapCell(i));
      }

      // hand + info
      this.infoT = txt(this, W / 2, 976, '', 17, C.ice, { align: 'center', wordWrap: { width: 660 } }).setOrigin(0.5);
      this.carveT = txt(this, W / 2, 1000, '', 14, C.dim, { fontFamily: FM }).setOrigin(0.5, 0);
      this.handLayer = this.add.container(0, 0);
      this.ghost = this.add.image(0, 0, 'rune_sub').setVisible(false).setAlpha(0.85).setDepth(50);

      // buttons
      this.breathB = button(this, 112, 1218, 196, 74, '', () => this.doBreath(), { size: 18, font: FM, line: HEX.ice });
      this.dropB = button(this, W / 2 + 34, 1218, 268, 82, 'DROP', () => this.doDrop(), { size: 34, spacing: 8, fill: 0x0a2a2a });
      this.menuB = button(this, W - 74, 1218, 116, 74, 'CODEX', () => this.openCodex(), { size: 16, font: FM, line: HEX.violet });

      this.input.on('pointermove', (p) => { if (this.dragging) { this.ghost.setPosition(p.x, p.y - 30); if (Math.hypot(p.x - this.dragFrom.x, p.y - this.dragFrom.y) > 24) this.ghost.setVisible(true); } });
      this.input.on('pointerup', (p) => this.endDrag(p));

      this.refreshAll();
      this.intro();
      window.__FS = { scene: 'play', run: RUN, ch: CH, play: this };
    }

    // ---------- geometry ----------
    cx(i) { return PX + (i % 5) * CELL + CELL / 2; }
    cy(i) { return PY + Math.floor(i / 5) * CELL + CELL / 2; }
    cellAt(x, y) { const c = Math.floor((x - PX) / CELL), r = Math.floor((y - PY) / CELL); return c >= 0 && c < 5 && r >= 0 && r < 5 ? r * 5 + c : -1; }

    relicRow() {
      if (this.relicObjs) this.relicObjs.forEach((o) => o.destroy());
      this.relicObjs = [];
      let x = W - 22;
      const y = 44;
      if (!RUN.relics.length) { this.relicObjs.push(txt(this, x, y, 'no relics yet', 14, '#5f7a86', { fontFamily: FM }).setOrigin(1, 0)); return; }
      for (let k = RUN.relics.length - 1; k >= 0; k--) {
        const id = RUN.relics[k], R = F.RELICS[id];
        const label = R.name.split(' ').map((w) => w[0]).join('');
        const t = txt(this, x, y, label, 15, R.tier === 2 ? C.gold : C.teal, { fontFamily: FM, backgroundColor: '#07101cdd', padding: { x: 7, y: 4 } }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        t.on('pointerup', () => this.info(R.name + ': ' + R.text, R.tier === 2 ? C.gold : C.teal));
        this.relicObjs.push(t); x -= t.width + 6;
      }
    }

    drawSigil(phase) {
      const g = this.sigil; g.clear();
      const col = { ice: HEX.ice, peaks: HEX.teal, tunnel: 0x7dff9a, grotto: 0x8fd9ff, knyan: 0x4aa8ff, yoth: HEX.red }[CH.C.id] || HEX.teal;
      for (let k = 0; k < 3; k++) { g.lineStyle(2, col, 0.25 + 0.2 * k); g.strokeCircle(0, 0, 70 - k * 18 + Math.sin(phase + k) * 3); }
      g.lineStyle(3, col, 0.9);
      for (let k = 0; k < 5; k++) { const a = phase * 0.3 + k * Math.PI * 2 / 5; g.lineBetween(Math.cos(a) * 34, Math.sin(a) * 34, Math.cos(a) * 78, Math.sin(a) * 78); }
      g.fillStyle(0x000000, 0.9); g.fillEllipse(0, 0, 58, 30); g.fillStyle(col, 1); g.fillEllipse(0, 0, 14, 26 + Math.sin(phase * 2) * 2);
    }

    drawDread() {
      const g = this.dreadG; g.clear();
      const x = W / 2 + 8 - 150, y = 156, w = 300, h = 14;
      g.fillStyle(0x000000, 0.7); g.fillRect(x, y, w, h);
      const p = Math.max(0, CH.dread / CH.maxDread);
      g.fillStyle(CH.C.boss ? HEX.gold : HEX.violet, 0.95); g.fillRect(x, y, w * p, h);
      g.lineStyle(1, HEX.ice, 0.6); g.strokeRect(x, y, w, h);
      this.dreadT.setText('DREAD ' + fmt(CH.dread) + ' / ' + fmt(CH.maxDread));
    }

    drawGrid() {
      const g = this.gridG; g.clear();
      g.lineStyle(1, HEX.ice, 0.16);
      for (let k = 0; k <= 5; k++) { g.lineBetween(PX + k * CELL, PY, PX + k * CELL, PY + 5 * CELL); g.lineBetween(PX, PY + k * CELL, PX + 5 * CELL, PY + k * CELL); }
      g.lineStyle(2, HEX.teal, 0.5); g.strokeRect(PX - 6, PY - 6, CELL * 5 + 12, CELL * 5 + 12);
      // corner ticks
      g.lineStyle(3, HEX.ice, 0.8);
      [[PX - 6, PY - 6, 1, 1], [PX + CELL * 5 + 6, PY - 6, -1, 1], [PX - 6, PY + CELL * 5 + 6, 1, -1], [PX + CELL * 5 + 6, PY + CELL * 5 + 6, -1, -1]].forEach(([x, y, sx, sy]) => { g.lineBetween(x, y, x + 26 * sx, y); g.lineBetween(x, y, x, y + 26 * sy); });
      this.drawSandCells();
    }
    drawSandCells() {
      const g = this.sandG; g.clear();
      const sand = F.sandCells(CH);
      sand.forEach((i) => {
        g.fillStyle(0xe9dcc0, 0.10); g.fillRect(this.cx(i) - CELL / 2 + 3, this.cy(i) - CELL / 2 + 3, CELL - 6, CELL - 6);
        g.lineStyle(1, 0xe9dcc0, 0.35); g.strokeRect(this.cx(i) - CELL / 2 + 6, this.cy(i) - CELL / 2 + 6, CELL - 12, CELL - 12);
      });
    }

    // ---------- cymatic sand: grains drift to the nodal (sand line) cells ----------
    initSand() {
      const n = RM ? 160 : 420;
      this.grains = [];
      for (let k = 0; k < n; k++) this.grains.push({ x: PX + Math.random() * CELL * 5, y: PY + Math.random() * CELL * 5, tx: 0, ty: 0, v: 0 });
      this.retargetSand();
      this.kick = 0;
    }
    retargetSand() {
      const sand = F.sandCells(CH);
      this.grains.forEach((p, k) => {
        const i = sand[k % sand.length];
        // gather along a curved nodal line inside the cell (Chladni-ish), not a blob
        const u = Math.random() * 2 - 1, mode = (k >> 3) % 3;
        let dx, dy;
        if (mode === 0) { dx = u * CELL * 0.48; dy = Math.sin(u * 3.14) * CELL * 0.18; }
        else if (mode === 1) { dy = u * CELL * 0.48; dx = Math.sin(u * 3.14) * CELL * 0.18; }
        else { const a = u * Math.PI; dx = Math.cos(a) * CELL * 0.3; dy = Math.sin(a) * CELL * 0.3; }
        p.tx = this.cx(i) + dx; p.ty = this.cy(i) + dy;
      });
    }
    sandKick(cell, amt) {
      this.grains.forEach((p) => {
        if (cell == null || Math.abs(p.x - this.cx(cell)) < CELL && Math.abs(p.y - this.cy(cell)) < CELL) {
          p.x += (Math.random() - 0.5) * amt; p.y += (Math.random() - 0.5) * amt;
        }
      });
    }
    update(time, dt) {
      if (!this.grains) return;
      const g = this.partG; g.clear();
      const k = Math.min(1, dt / 1000 * (RM ? 1.2 : 2.6));
      const t = time / 1000;
      g.fillStyle(0xeee2c6, 0.85);
      for (const p of this.grains) {
        p.x += (p.tx - p.x) * k * 0.6; p.y += (p.ty - p.y) * k * 0.6;
        const j = RM ? 0 : 0.6;
        g.fillRect(p.x + Math.sin(t * 60 + p.tx) * j, p.y + Math.cos(t * 60 + p.ty) * j, 2, 2);
      }
      if (this.sigil && !RM) this.drawSigil(t);
    }

    // ---------- refresh ----------
    refreshAll() { this.refreshBoard(); this.refreshHand(); this.refreshUI(); }
    refreshBoard() {
      this.layerTiles.removeAll(true); this.layerIce.removeAll(true); this.cellSpr = {}; this.iceSpr = {};
      let order = 0;
      for (let i = 0; i < 25; i++) {
        const b = CH.board[i];
        if (b && !CH.frozen[i]) {
          order++;
          const n = txt(this, this.cx(i) - CELL / 2 + 8, this.cy(i) - CELL / 2 + 5, String(order), 11, '#9fb3bb', { fontFamily: FM }).setDepth(5);
          this.layerIce.add(n);
        }
        if (b) {
          const s = this.add.image(this.cx(i), this.cy(i), 'rune_' + b.t).setDisplaySize(CELL - 10, CELL - 10);
          if (CH.placedThisBar.indexOf(i) >= 0) { const ring = this.add.image(this.cx(i), this.cy(i), 'halo').setTint(HEX.teal).setScale(1.25).setAlpha(0.35).setBlendMode('ADD'); this.layerTiles.add(ring); }
          this.layerTiles.add(s); this.cellSpr[i] = s;
        }
        if (CH.frozen[i]) {
          const ic = this.add.image(this.cx(i), this.cy(i), 'icecell').setDisplaySize(CELL - 6, CELL - 6).setAlpha(CH.frozen[i] === 1 ? 0.55 : 0.85);
          this.layerIce.add(ic); this.iceSpr[i] = ic;
        }
      }
    }
    refreshHand() {
      this.handLayer.removeAll(true); this.handSpr = [];
      CH.hand.forEach((t, h) => {
        const x = HAND_X0 + h * HAND_DX, y = HAND_Y;
        const s = this.add.image(x, y, 'rune_' + t).setDisplaySize(100, 100).setInteractive({ useHandCursor: true });
        if (h === this.sel) { s.y -= 14; const hl = this.add.image(x, y - 14, 'halo').setTint(HEX.teal).setScale(1.3).setAlpha(0.6).setBlendMode('ADD'); this.handLayer.add(hl); }
        s.on('pointerdown', (p) => this.startDrag(h, p));
        this.handLayer.add(s); this.handSpr.push(s);
        const lab = txt(this, x, y + 50, F.RUNES[t].name.toUpperCase(), 12, C.dim, { fontFamily: FM }).setOrigin(0.5, 0);
        this.handLayer.add(lab);
      });
    }
    refreshUI() {
      const left = F.carveLimit(RUN) - CH.placedThisBar.length;
      const drops = F.dropsFor(CH);
      this.carveT.setText('CARVE ' + left + ' MORE   BAR ' + Math.min(CH.drop + 1, drops) + ' OF ' + drops + '   DECK ' + (CH.draw.length) + '   SHARDS ' + RUN.shards);
      this.breathB.setLabel('BREATH x' + CH.breaths);
      this.dropB.setLabel(CH.drop === drops - 1 ? 'FINAL DROP' : 'DROP');
      this.scoreT.setText(RUN.label + '   TOTAL ' + fmt(RUN.score));
      this.preview();
    }
    preview() {
      if (this.busy) return;
      // simulate without touching the live chamber
      const clone = Object.assign({}, CH, { board: CH.board.slice(), frozen: CH.frozen.slice() });
      const any = clone.board.some((b, i) => b && !clone.frozen[i]);
      if (!any) { this.setMath(0, 1, 0, true); return; }
      const r = F.scoreDrop(RUN, clone);
      this.setMath(r.bass, r.res, r.total, true);
      if (r.bass === 0 && r.res > 1) this.info('Res multiplies Bass. With no Bass on the plate, the drop is silent: add a Sub or Pulse.', C.ember);
    }
    setMath(b, r, t, isPreview) {
      this.bassT.setText(fmt(b)); this.resT.setText(fmtRes(r)); this.totT.setText(fmt(t));
      this.totL.setText(isPreview ? 'IF YOU DROP NOW' : 'DROP');
      this.totT.setColor(isPreview ? '#9fb3bb' : C.ink);
    }
    info(s, color) { this.infoT.setText(s).setColor(color || C.ice); }

    // ---------- intro banner ----------
    intro() {
      const Cc = CH.C;
      this.busy = true;
      const o = this.add.container(0, 0).setDepth(80);
      const g = this.add.graphics(); g.fillStyle(HEX.deep, 0.86); g.fillRect(0, 0, W, H); o.add(g);
      o.add(txt(this, W / 2, 360, 'CHAMBER ' + (CH.idx + 1), 18, C.dim, { fontFamily: FM }).setOrigin(0.5).setLetterSpacing(6));
      o.add(txt(this, W / 2, 420, Cc.name.toUpperCase(), Cc.name.length > 18 ? 34 : 44, Cc.boss ? C.gold : C.ice, { fontFamily: FD, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5).setLetterSpacing(4));
      o.add(txt(this, W / 2, 520, FLAVOR[Cc.id], 22, C.ink, { align: 'center', wordWrap: { width: 600 }, lineSpacing: 6 }).setOrigin(0.5, 0));
      o.add(txt(this, W / 2, 700, Cc.rule, 18, Cc.boss ? C.gold : C.teal, { fontFamily: FM, align: 'center', wordWrap: { width: 600 }, lineSpacing: 4 }).setOrigin(0.5, 0));
      o.add(txt(this, W / 2, 860, 'Silence ' + Cc.thing + ': ' + fmt(CH.maxDread) + ' Dread in ' + F.dropsFor(CH) + ' drops', 18, C.ice, { fontFamily: FM, align: 'center', wordWrap: { width: 620 } }).setOrigin(0.5));
      if (CH.idx === 0) o.add(txt(this, W / 2, 960, 'Tap a rune, then tap the plate. Runes on sand lines add Resonance. When you DROP, every rune on the plate fires in reading order: Bass x Res.', 17, C.dim, { align: 'center', wordWrap: { width: 600 }, lineSpacing: 4 }).setOrigin(0.5, 0));
      const tap = txt(this, W / 2, 1150, 'TAP TO BEGIN', 18, C.teal, { fontFamily: FM }).setOrigin(0.5).setLetterSpacing(6);
      o.add(tap);
      if (Cc.boss) { AU.sfx('roar', 0.9); if (Cc.boss === 'shoggoth') this.time.delayedCall(900, () => AU.sfx('tekeli', 0.7)); if (!RM) this.cameras.main.shake(500, 0.006); }
      const close = () => {
        if (!o.active) return;
        this.tweens.add({ targets: o, alpha: 0, duration: RM ? 1 : 300, onComplete: () => { o.destroy(); this.busy = false; this.info(this.firstHint(), C.ice); } });
      };
      const z = this.add.zone(W / 2, H / 2, W, H).setInteractive().setDepth(81);
      z.once('pointerup', () => { AU.resume(); z.destroy(); close(); });
      this.introClose = () => { if (z.active) z.destroy(); close(); };
    }
    firstHint() {
      if (CH.idx === 0 && CH.drop === 0) return 'Carve 3 runes. Try a Node on a sand line, and Pulses touching each other.';
      return 'Carve up to ' + F.carveLimit(RUN) + ' runes, then DROP.';
    }

    // ---------- input ----------
    startDrag(h, p) {
      if (this.busy) return;
      AU.resume();
      this.sel = h; this.dragging = true; this.dragFrom = { x: p.x, y: p.y };
      this.ghost.setTexture('rune_' + CH.hand[h]).setDisplaySize(96, 96).setPosition(p.x, p.y - 30).setVisible(false);
      const R = F.RUNES[CH.hand[h]];
      this.info(R.name + ': ' + R.text, '#' + R.color.toString(16).padStart(6, '0'));
      this.refreshHand();
    }
    endDrag(p) {
      if (!this.dragging) return;
      this.dragging = false; this.ghost.setVisible(false);
      const moved = Math.hypot(p.x - this.dragFrom.x, p.y - this.dragFrom.y) > 24;
      if (moved) { const c = this.cellAt(p.x, p.y - 30); if (c >= 0) this.tryPlace(c); }
    }
    tapCell(i) {
      if (this.busy || this.dragging) return;
      if (this.sel >= 0) { this.tryPlace(i); return; }
      const b = CH.board[i];
      if (b && CH.placedThisBar.indexOf(i) >= 0) { F.unplace(RUN, CH, i); AU.sfx('rune', 0.4, 0.8); this.info('Returned to your hand.'); this.refreshAll(); return; }
      if (b) { const R = F.RUNES[b.t]; this.info(R.name + ': ' + R.text + (CH.frozen[i] ? ' (frozen: it will not fire)' : ''), '#' + R.color.toString(16).padStart(6, '0')); return; }
      if (CH.frozen[i]) { this.info('Ice. Nothing fires here until it melts, or an Ember thaws it.'); return; }
      this.info(F.isSand(CH, i) ? 'A sand line: runes here add +1 Res.' : 'Pick a rune from your hand first.');
    }
    tryPlace(i) {
      if (this.sel < 0) return;
      if (CH.frozen[i]) { this.info('That cell is frozen.', C.red); return; }
      if (CH.board[i]) { this.info('A rune is already carved there.', C.red); return; }
      if (CH.placedThisBar.length >= F.carveLimit(RUN)) { this.info('No carves left this bar. Hit DROP.', C.ember); return; }
      const t = CH.hand[this.sel];
      if (F.place(RUN, CH, this.sel, i)) {
        AU.sfx('rune', 0.8, 0.9 + Math.random() * 0.2);
        if (F.isSand(CH, i)) AU.sfx('hum', 0.25, 1);
        this.sel = -1; this.sandKick(i, 30);
        this.refreshAll();
        const s = this.cellSpr[i];
        if (s && !RM) { const sx = s.scaleX; s.setScale(sx * 1.25); this.tweens.add({ targets: s, scaleX: sx, scaleY: sx, duration: 180, ease: 'Back.out' }); }
        const R = F.RUNES[t];
        this.info(R.name + ' carved' + (F.isSand(CH, i) ? ' on a sand line.' : '.') + ' ' + (F.carveLimit(RUN) - CH.placedThisBar.length) + ' carves left.');
      }
    }
    doBreath() {
      if (this.busy) return;
      if (!F.breathe(RUN, CH)) { this.info('No breaths left in this chamber.', C.ember); return; }
      AU.sfx('hum', 0.5, 0.7); this.sel = -1; this.info('A deep breath. New runes in hand.'); this.refreshAll();
    }
    openCodex() { if (this.busy) return; this.scene.pause(); this.scene.launch('codex', { from: 'play' }); }

    // ---------- the drop ----------
    doDrop() {
      if (this.busy) return;
      const anyLive = CH.board.some((b, i) => b && !CH.frozen[i]);
      if (!anyLive) { this.info('Carve at least one rune first.', C.ember); return; }
      this.busy = true; this.sel = -1; this.refreshHand();
      const Cc = CH.C;
      const res = F.scoreDrop(RUN, CH);
      AU.drop(Cc.track, Cc.drop, CH.drop);
      this.sage.setTexture('sage_cast');
      const steps = res.steps;
      const step = Math.min(BEAT / 4, (DROP_DUR - 1.1) / Math.max(1, steps.length));
      this.setMath(0, 1, 0, false); this.totT.setText('...');
      if (!RM) this.cameras.main.shake(120, 0.004);
      this.sandKick(null, 60);
      const T0 = 120;
      steps.forEach((s, k) => {
        this.time.delayedCall(T0 + k * step * 1000, () => this.fireStep(s));
      });
      const tEnd = T0 + steps.length * step * 1000 + 120;
      res.extra.forEach((e, k) => this.time.delayedCall(tEnd + k * 260, () => { this.banner(e.name + '  ' + e.text, e.name === '60 Hz LOCK' ? C.teal : C.gold); if (e.name === '60 Hz LOCK') { AU.sfx('hum', 0.9, 1); this.sandKick(null, 90); } this.resT.setText(fmtRes(res.res)); }));
      const tTot = tEnd + res.extra.length * 260 + 160;
      this.time.delayedCall(tTot, () => {
        this.bassT.setText(fmt(res.bass)); this.resT.setText(fmtRes(res.res)); this.totT.setText(fmt(res.total));
        (window.__DROPS = window.__DROPS || []).push({ chamber: CH.idx + 1, bar: CH.drop + 1, bass: res.bass, res: res.res, total: res.total, fired: res.fired, dreadBefore: CH.dread, shown: [this.bassT.text, this.resT.text, this.totT.text], extra: res.extra.map((e) => e.name) });
        if (!RM) { this.tweens.add({ targets: this.totT, scale: { from: 1.5, to: 1 }, duration: 260, ease: 'Back.out' }); const fl = this.add.rectangle(W / 2, H / 2, W, H, HEX.teal, 0.22).setDepth(65).setBlendMode('ADD'); this.tweens.add({ targets: fl, alpha: 0, duration: 260, onComplete: () => fl.destroy() }); }
        this.popAt(this.thingX, this.thingY - 40, '-' + fmt(res.total), C.ember, 34);
        if (this.thing && !RM) this.tweens.add({ targets: this.thing, x: this.thingX + 10, duration: 40, yoyo: true, repeat: 3, onComplete: () => this.thing.setX(this.thingX) });
        const events = F.resolveDrop(RUN, CH, res);
        this.lastEvents = events; this.lastResult = res;
        this.drawDread();
        this.time.delayedCall(Math.max(500, DROP_DUR * 1000 - tTot + 150), () => this.afterDrop(events, res));
      });
    }
    fireStep(s) {
      const x = this.cx(s.cell), y = this.cy(s.cell);
      const spr = this.cellSpr[s.echoOf != null ? s.echoOf : s.cell];
      const h = this.add.image(x, y, 'halo').setTint(F.RUNES[s.t].color).setBlendMode('ADD').setScale(0.6).setAlpha(0.9);
      this.fxLayer.add(h);
      this.tweens.add({ targets: h, scale: 1.6, alpha: 0, duration: RM ? 120 : 380, onComplete: () => h.destroy() });
      if (spr && !RM) { const sx = spr.scaleX; this.tweens.add({ targets: spr, scaleX: sx * 1.15, scaleY: sx * 1.15, duration: 70, yoyo: true }); }
      let label = '';
      if (s.bass) label += '+' + s.bass;
      if (s.res) label += (label ? ' ' : '') + '+' + s.res + ' Res';
      if (s.mult !== 1) label += (label ? ' ' : '') + 'x' + s.mult + ' Res';
      if (!label) label = s.note || '0';
      this.popAt(x, y - 20, label, s.mult !== 1 ? C.gold : s.res ? C.violet : C.teal, 20);
      this.bassT.setText(fmt(s.bassTotal)); this.resT.setText(fmtRes(s.resTotal));
      this.sandKick(s.cell, 26);
      AU.sfx('rune', 0.22, 1.4 + Math.min(1, s.resTotal / 20));
    }
    popAt(x, y, s, color, size) {
      const t = txt(this, x, y, s, size || 20, color || C.ice, { fontFamily: FM, fontStyle: '700', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(60);
      this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: RM ? 500 : 900, ease: 'Cubic.out', onComplete: () => t.destroy() });
    }
    banner(s, color) {
      const t = txt(this, W / 2, PY + CELL * 2.5, s, 34, color || C.gold, { fontFamily: FD, stroke: '#000000', strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(70);
      this.tweens.add({ targets: t, alpha: 0, y: t.y - 60, delay: 650, duration: 600, onComplete: () => t.destroy() });
    }
    afterDrop(events, res) {
      this.sage.setTexture('sage_idle');
      this.refreshBoard();
      let delay = 0;
      events.forEach((e) => {
        if (e.k === 'frost') { this.time.delayedCall(delay, () => { AU.sfx('freeze', 0.6); this.info(CH.C.thing + ' frosts ' + e.cells.length + (e.cells.length === 1 ? ' cell.' : ' cells.') + ' Ice holds two bars.', '#9fe8ff'); if (RUN.relics.indexOf('mask') < 0) unlock('freeze'); }); delay += 300; }
        if (e.k === 'frostblocked') { this.info('Your Frost rune held the cold back this bar.', '#9fe8ff'); }
        if (e.k === 'swallow') { this.time.delayedCall(delay, () => { AU.sfx('tekeli', 0.8); this.banner('Tekeli-li! It swallowed your ' + F.RUNES[e.t].name, C.red); }); delay += 600; }
        if (e.k === 'rotate') { this.time.delayedCall(delay, () => { AU.sfx('hum', 0.7, 0.8); this.drawSandCells(); this.retargetSand(); this.info('The star-head turns. The sand lines rotate.', C.gold); }); delay += 300; }
        if (e.k === 'regrow') { this.info('The red heat feeds it: +' + fmt(e.n) + ' Dread.', C.red); this.drawDread(); }
      });
      this.time.delayedCall(delay + 50, () => {
        this.refreshBoard();
        if (CH.done) return this.chamberOver();
        if (!events.some((e) => ['frost', 'frostblocked', 'swallow', 'rotate', 'regrow'].indexOf(e.k) >= 0)) this.info('Bar ' + (CH.drop + 1) + '. Your runes stay on the plate and fire again. Carve up to ' + F.carveLimit(RUN) + ' more.');
        this.busy = false; this.refreshAll();
      });
    }
    chamberOver() {
      const last = CH.idx === 8;
      SAVE.best.depth = Math.max(SAVE.best.depth, CH.idx + 1);
      SAVE.best.drop = Math.max(SAVE.best.drop, RUN.bestDrop);
      SAVE.best.score = Math.max(SAVE.best.score, RUN.score);
      persist();
      if (CH.won) {
        AU.sfx('ice', 1); AU.sfx('fail', 0.25, 1.6);
        this.banner(CH.C.thing + ' is silent', C.teal);
        if (this.thing) this.tweens.add({ targets: this.thing, alpha: 0.15, scale: (this.thing.scale || 1) * 0.9, duration: RM ? 1 : 700 });
        this.time.delayedCall(1300, () => {
          if (last) { RUN.won = true; SAVE.wins++; SAVE.deeper = Math.min(5, Math.max(SAVE.deeper, (RUN.deeper || 0) + 1)); unlock('tsath'); persist(); this.scene.start('end'); }
          else this.scene.start('reward');
        });
      } else {
        AU.sfx('fail', 0.9);
        if (RUN.story) {
          this.banner('The sage breathes and walks on', C.ice);
          this.time.delayedCall(1500, () => { if (last) { this.scene.start('end'); } else this.scene.start('reward'); });
        } else {
          this.banner('The signal fades', C.red);
          this.time.delayedCall(1500, () => { RUN.over = true; this.scene.start('end'); });
        }
      }
    }
  }

  // ======================= REWARD =======================
  class Reward extends Phaser.Scene {
    constructor() { super('reward'); }
    create() {
      this.add.image(W / 2, H / 2, 'bg_' + F.CHAMBERS[RUN.chamber].bg).setDisplaySize(W, H).setAlpha(0.5);
      const g = this.add.graphics(); g.fillStyle(HEX.deep, 0.82); g.fillRect(0, 0, W, H);
      txt(this, W / 2, 92, 'SILENCED', 18, C.teal, { fontFamily: FM }).setOrigin(0.5).setLetterSpacing(8);
      txt(this, W / 2, 140, 'Choose one to carry down', 34, C.ice, { fontFamily: FD }).setOrigin(0.5);
      txt(this, W / 2, 190, 'Total ' + fmt(RUN.score) + '   Best drop ' + fmt(RUN.bestDrop) + '   Shards ' + RUN.shards, 17, C.dim, { fontFamily: FM }).setOrigin(0.5);
      this.sage = this.add.image(W / 2, 1080, 'sage_rest').setScale(0.42).setAlpha(0.9);
      this.cards = [];
      this.offers = F.offers(RUN);
      this.drawCards();
      this.reroll = button(this, W / 2, 940, 360, 64, '', () => {
        if (RUN.shards < 1) return;
        RUN.shards--; AU.sfx('hum', 0.5, 1.3); this.offers = F.offers(RUN); this.drawCards(); this.paintReroll();
      }, { size: 18, font: FM, line: HEX.violet });
      this.paintReroll();
      txt(this, W / 2, 1230, 'Relics: up to 5. A sixth replaces the oldest.', 15, C.dim).setOrigin(0.5);
      window.__FS = { scene: 'reward', run: RUN, offers: this.offers, pick: (k) => this.pick(k) };
    }
    paintReroll() { this.reroll.setLabel(RUN.shards >= 1 ? 'REROLL (1 SHARD, ' + RUN.shards + ' LEFT)' : 'NO SHARDS TO REROLL'); }
    drawCards() {
      this.cards.forEach((c) => c.forEach((o) => o.destroy())); this.cards = [];
      this.offers.forEach((o, k) => {
        const y = 300 + k * 196, x = W / 2, w = 620, h = 172;
        const objs = [];
        const gg = this.add.graphics();
        const isRelic = o.kind === 'relic';
        const R = isRelic ? F.RELICS[o.id] : F.RUNES[o.id];
        const col = isRelic ? (R.tier === 2 ? HEX.gold : HEX.teal) : R.color;
        gg.fillStyle(0x07101c, 0.94); gg.fillRect(x - w / 2, y, w, h);
        gg.lineStyle(2, col, 0.85); gg.strokeRect(x - w / 2, y, w, h);
        objs.push(gg);
        if (isRelic) {
          objs.push(txt(this, x - w / 2 + 24, y + 18, R.tier === 2 ? 'RELIC  x  MULTIPLY' : 'RELIC  +  ADD', 14, R.tier === 2 ? C.gold : C.teal, { fontFamily: FM }).setLetterSpacing(2));
          objs.push(txt(this, x - w / 2 + 24, y + 44, R.name, 30, C.ice, { fontFamily: FD }));
          objs.push(txt(this, x - w / 2 + 24, y + 96, R.text, 19, C.ink, { wordWrap: { width: w - 48 } }));
        } else {
          objs.push(this.add.image(x - w / 2 + 80, y + h / 2, 'rune_' + o.id).setDisplaySize(112, 112));
          objs.push(txt(this, x - w / 2 + 160, y + 18, 'NEW RUNE FOR YOUR DECK', 14, C.violet, { fontFamily: FM }).setLetterSpacing(2));
          objs.push(txt(this, x - w / 2 + 160, y + 44, R.name, 30, C.ice, { fontFamily: FD }));
          objs.push(txt(this, x - w / 2 + 160, y + 96, R.text, 19, C.ink, { wordWrap: { width: w - 190 } }));
        }
        const z = this.add.zone(x, y + h / 2, w, h).setInteractive({ useHandCursor: true });
        z.on('pointerup', () => this.pick(k));
        objs.push(z);
        this.cards.push(objs);
      });
      if (window.__FS) window.__FS.offers = this.offers;
    }
    pick(k) {
      const o = this.offers[k]; if (!o) return;
      F.take(RUN, o); AU.sfx('relic', 1);
      if (o.kind === 'relic') { if (o.id === 'cramp') unlock('tiwanaku'); if (o.id === 'freeze') unlock('freeze'); }
      RUN.chamber++;
      this.cameras.main.fadeOut(RM ? 1 : 350, 5, 8, 15);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('play'));
    }
  }

  // ======================= END =======================
  class End extends Phaser.Scene {
    constructor() { super('end'); }
    create() {
      const won = RUN.won;
      this.add.image(W / 2, H / 2, won ? 'bg_nkai' : 'bg_' + F.CHAMBERS[RUN.chamber].bg).setDisplaySize(W, H).setAlpha(0.6);
      const g = this.add.graphics(); g.fillStyle(HEX.deep, 0.78); g.fillRect(0, 0, W, H);
      const reached = RUN.chamber + 1;
      txt(this, W / 2, 110, won ? 'THE SIGNAL GOES QUIET' : 'THE SIGNAL FADES', 34, won ? C.gold : C.ice, { fontFamily: FD, align: 'center' }).setOrigin(0.5).setLetterSpacing(3);
      const line = won ? 'Tsathoggua turns over in his sleep. The sage plays one more low note and climbs back toward the ice.'
        : 'The sage reached ' + F.CHAMBERS[RUN.chamber].name + ', chamber ' + reached + ' of 9.';
      txt(this, W / 2, 170, line, 21, C.ink, { align: 'center', wordWrap: { width: 600 }, lineSpacing: 6 }).setOrigin(0.5, 0);
      this.add.image(W / 2 - (won ? 120 : 0), 520, won ? 'sage_cast' : 'sage_rest').setScale(0.7);
      if (won) this.add.image(W / 2 + 160, 540, 'boss_tsath').setScale(0.55).setAlpha(0.85);
      const stats = [
        ['TOTAL BASS', fmt(RUN.score)], ['BEST DROP', fmt(RUN.bestDrop)], ['DEPTH', reached + ' / 9'], ['RELICS', RUN.relics.map((r) => F.RELICS[r].name).join(', ') || 'none'],
      ];
      stats.forEach(([a, b], k) => {
        txt(this, 90, 760 + k * 44, a, 15, C.dim, { fontFamily: FM });
        txt(this, 260, 756 + k * 44, b, 20, C.ice, { fontFamily: FM, wordWrap: { width: 380 } });
      });
      // a reason to go again
      const unseen = Object.keys(F.RELICS).filter((r) => !(SAVE.seen && SAVE.seen[r]));
      RUN.relics.forEach((r) => { SAVE.seen[r] = 1; }); persist();
      const nextRelic = unseen.find((r) => RUN.relics.indexOf(r) < 0);
      const lockedLore = CODEX.filter((c) => SAVE.codex.indexOf(c.id) < 0).length;
      let hook = won ? 'You unlocked DEEPER ' + SAVE.deeper + ': the Dread runs 35% higher per level.' : '';
      if (!hook) hook = nextRelic ? 'Still waiting below: the ' + F.RELICS[nextRelic].name + '. ' + F.RELICS[nextRelic].text : 'Try ordering an Elder rune last: it multiplies everything before it.';
      if (lockedLore) hook += '  ' + lockedLore + ' codex pages still dark.';
      txt(this, W / 2, 960, hook, 17, C.teal, { align: 'center', wordWrap: { width: 600 }, lineSpacing: 4 }).setOrigin(0.5, 0);
      button(this, W / 2, 1090, 520, 80, 'DESCEND AGAIN', () => { startRun(RUN.kind === 'daily' ? 'daily' : 'run'); this.scene.start('play'); }, { size: 30, spacing: 6 });
      const share = button(this, W / 2 - 132, 1186, 252, 60, 'COPY RESULT', () => {
        const s = 'FANGSPEARE: The Signal Below. ' + RUN.label + '. ' + (won ? 'Silenced Tsathoggua' : 'Reached ' + F.CHAMBERS[RUN.chamber].name) + ', ' + fmt(RUN.score) + ' Bass, best drop ' + fmt(RUN.bestDrop) + '.';
        try { navigator.clipboard.writeText(s).then(() => share.setLabel('COPIED'), () => share.setLabel('COPY FAILED')); } catch (e) { share.setLabel('COPY FAILED'); }
      }, { size: 17, font: FM, line: HEX.violet });
      button(this, W / 2 + 132, 1186, 252, 60, 'TITLE', () => this.scene.start('title'), { size: 17, font: FM, line: HEX.ice });
      window.__FS = { scene: 'end', run: RUN };
    }
  }

  // ======================= CODEX + LISTENING ROOM =======================
  class Codex extends Phaser.Scene {
    constructor() { super('codex'); }
    init(d) { this.from = d && d.from; }
    create() {
      const g = this.add.graphics(); g.fillStyle(HEX.deep, 0.97); g.fillRect(0, 0, W, H);
      txt(this, W / 2, 50, 'CODEX', 34, C.ice, { fontFamily: FD }).setOrigin(0.5).setLetterSpacing(10);
      const open = (c) => SAVE.story || SAVE.codex.indexOf(c.id) >= 0;
      txt(this, W / 2, 92, CODEX.filter(open).length + ' of ' + CODEX.length + ' pages lit' + (SAVE.story ? ' (story mode shows all)' : ''), 15, C.dim, { fontFamily: FM }).setOrigin(0.5);
      // listening room
      const lb = (k, x) => {
        const b = button(this, x, 158, 300, 64, '', () => { AU.resume(); const on = AU.listen(k); paint(); if (!on && !AU.buf[k]) b.setLabel('STILL LOADING'); }, { size: 17, font: FM, line: HEX.teal });
        const paint = () => { lb.all.forEach((o) => o.b.setLabel((AU.full && AU.full.k === o.k ? 'STOP ' : 'PLAY ') + TRACKS[o.k].title.toUpperCase())); };
        lb.all.push({ k, b }); return paint;
      };
      lb.all = [];
      const p1 = lb('old', W / 2 - 160); lb('tek', W / 2 + 160); p1();
      txt(this, W / 2, 200, 'LISTENING ROOM: the full FANGSPEARE tracks', 13, C.dim, { fontFamily: FM }).setOrigin(0.5);
      // list
      this.listY = 236; this.cont = this.add.container(0, 0);
      let y = 0; this.detail = null;
      CODEX.forEach((c) => {
        const ok = open(c);
        const t = txt(this, 40, this.listY + y, (ok ? '' : 'DARK: ') + (ok ? c.t : '?'.repeat(Math.min(12, c.t.length))), 21, ok ? C.ice : '#4b6470', { fontFamily: ok ? FD : FM });
        if (ok) { const z = this.add.zone(W / 2, this.listY + y + 18, W - 40, 42).setInteractive({ useHandCursor: true }); z.on('pointerup', () => { this.show(c); t.setColor(C.teal); }); }
        this.cont.add(t); y += 44;
      });
      this.detailBox = txt(this, 40, this.listY + y + 14, 'Tap a lit page.', 18, '#c9d6dc', { wordWrap: { width: 640 }, lineSpacing: 6 });
      button(this, W / 2, 1220, 300, 70, 'BACK', () => {
        AU.stopListen();
        if (this.from === 'play') { this.scene.stop(); this.scene.resume('play'); AU.ambient(CH.C.track); }
        else this.scene.start('title');
      }, { size: 24, spacing: 6 });
      window.__FS = { scene: 'codex' };
    }
    show(c) { this.detailBox.setText(c.t.toUpperCase() + '\n' + c.x); }
  }

  // ======================= start =======================
  function start() {
    AU.boot();
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#05080f',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { antialias: true, roundPixels: false },
      scene: [Boot, Title, Play, Reward, End, Codex],
    });
    window.__GAME = game;
    document.addEventListener('visibilitychange', () => { if (AU.ctx) { if (document.hidden) AU.ctx.suspend(); else AU.ctx.resume(); } });
  }
  const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([
    document.fonts.load('800 40px "Shippori Mincho B1"'), document.fonts.load('700 20px "IBM Plex Mono"'), document.fonts.load('500 20px "IBM Plex Mono"'), document.fonts.load('400 20px Archivo'),
  ]).catch(() => null) : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(start);
  window.__AU = AU;
})();
