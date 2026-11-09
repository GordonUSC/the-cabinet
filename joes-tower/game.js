/* Joe's Tower: an original match-3 remodel game. Phaser 3.90. */
(() => {
'use strict';

const W = 720, H = 1280;
const N = 8, CELL = 85, BX = 20, BY = 538;
const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const PARAMS = new URLSearchParams(location.search);
const SPEED = Math.max(1, Math.min(10, parseFloat(PARAMS.get('speed')) || 1));
const D = (ms) => Math.max(1, ms / SPEED);

const TYPES = ['tile', 'paint', 'wood', 'glass', 'gold', 'velvet'];
const MAT = {
  tile: { name: 'Tile', color: 0x2fd08a },
  paint: { name: 'Paint', color: 0xff4d6d },
  wood: { name: 'Wood', color: 0xf2a03d },
  glass: { name: 'Glass', color: 0x4aa8ff },
  gold: { name: 'Gold', color: 0xffc83d },
  velvet: { name: 'Velvet', color: 0x9b5cff },
};
const FLOORS = [
  { name: 'The Lobby', goals: { tile: 15 }, moves: 22, tip: 'Swipe or tap two neighbors to line up 3 or more.' },
  { name: 'The Kitchen', goals: { paint: 16, tile: 10 }, moves: 25, tip: 'Match 4 in a row to build a Power Drill. It clears a whole line.' },
  { name: 'The Living Room', goals: { velvet: 20, wood: 12 }, moves: 26, tip: 'Make an L or T shape to build a Wrecking Ball.' },
  { name: 'The Spa Bath', goals: { glass: 22, tile: 15 }, moves: 25, tip: 'Chain cascades to fill the TURBO meter. TURBO doubles everything.' },
  { name: 'The Collection', goals: { glass: 16, gold: 16 }, moves: 25, tip: 'A gallery with a lit shelf for every treasure Joe collects.' },
  { name: 'The Suite', goals: { velvet: 22, paint: 18 }, moves: 26, tip: 'Match 5 in a row to make a Disco Ball.' },
  { name: 'The Ballroom', goals: { gold: 20, glass: 18, velvet: 14 }, moves: 28, tip: 'Swap a Disco Ball with any piece to clear that whole color.' },
  { name: 'The Penthouse', goals: { gold: 24, paint: 18, wood: 18 }, moves: 30, tip: 'Top floor. Swap two specials together for a mega combo.' },
];
const FLOOR_COLORS = [0xff8fb1, 0x6fdcb5, 0xb59cff, 0xffd166, 0xff9f7a, 0x7cc4ff, 0xf28ad8, 0xffe08a];
const PRAISE = ['Nice!', 'Sweet!', 'Fabulous!', 'Gorgeous!', 'Iconic!', 'Showstopper!', 'Legendary!', 'Penthouse Level!'];

// ---------- persistence (always guarded)
const store = {
  get(k, d) { try { const v = localStorage.getItem('joeTower.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('joeTower.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};

const G = {
  mode: 'classic', floor: 0, score: 0, muted: store.get('muted', false),
  stats: { swaps: 0, invalid: 0, cascades: 0, maxCombo: 0, specialsMade: 0, specialsFired: 0, turbos: 0, floorsCleared: 0, shuffles: 0 },
};
window.JOE = { G, FLOORS, scene: null, ready: false };

// ---------- drawing helpers
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return key;
  const t = scene.textures.createCanvas(key, w, h); draw(t.context, w, h); t.refresh(); return key;
}
function goldGrad(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#fff7d6'); g.addColorStop(0.35, '#f3c766'); g.addColorStop(0.6, '#c98a2c'); g.addColorStop(1, '#ffe7a3');
  return g;
}
function buttonTex(scene, w, h, c1, c2) {
  const key = `btn_${w}_${h}_${c1}_${c2}`;
  return canvasTex(scene, key, w, h + 10, (ctx) => {
    const r = h / 2;
    ctx.fillStyle = 'rgba(140,50,100,0.22)'; rr(ctx, 6, 10, w - 12, h - 2, r); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; rr(ctx, 3, 3, w - 6, h - 6, r - 3); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 4, 4, w - 8, h - 8, r - 4); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.42)'; rr(ctx, 18, 9, w - 36, h * 0.34, h * 0.17); ctx.fill();
  });
}
function goldText(t) {
  const g = t.context.createLinearGradient(0, 0, 0, t.height);
  g.addColorStop(0, '#fffbe8'); g.addColorStop(0.45, '#ffd76e'); g.addColorStop(0.56, '#e09a34'); g.addColorStop(1, '#fff0b4');
  t.setFill(g); return t;
}
function txt(scene, x, y, s, size, opts = {}) {
  const t = scene.add.text(x, y, s, {
    fontFamily: opts.font || 'Fredoka', fontSize: size + 'px', fontStyle: opts.weight || '700',
    color: opts.color || '#5a2a55', align: opts.align || 'center',
    stroke: opts.stroke || undefined, strokeThickness: opts.strokeW || 0,
    wordWrap: opts.wrap ? { width: opts.wrap } : undefined, padding: { x: 4, y: 6 },
  }).setOrigin(opts.ox ?? 0.5, opts.oy ?? 0.5);
  if (opts.shadow) t.setShadow(0, 3, opts.shadow, 6, true, true);
  return t;
}
function makeButton(scene, x, y, w, h, label, opts, onClick) {
  const key = buttonTex(scene, w, h, opts.c1 || '#ff9cc2', opts.c2 || '#ff5c97');
  const img = scene.add.image(0, 5, key);
  const t = txt(scene, 0, -1, label, opts.fs || 34, { color: '#ffffff', shadow: 'rgba(120,30,80,0.55)' });
  const c = scene.add.container(x, y, [img, t]).setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => {
    scene.tweens.add({ targets: c, scale: 0.93, duration: 70, yoyo: true });
    sfx(scene, 'swap', { volume: 0.4, rate: 1.3 });
    if (onClick) scene.time.delayedCall(90, onClick);
  });
  c.label = t;
  return c;
}
function sfx(scene, key, cfg = {}) {
  if (G.muted) return;
  try { scene.sound.play(key, Object.assign({ volume: 0.7 }, cfg)); } catch (e) { /* audio locked */ }
}
function startMusic(scene) {
  let m = scene.registry.get('music');
  if (!m) { m = scene.sound.add('music', { loop: true, volume: 0.42 }); scene.registry.set('music', m); }
  if (!m.isPlaying) { try { m.play(); } catch (e) { /* locked until gesture */ } }
  scene.sound.mute = G.muted;
}
function wait(scene, ms) { return new Promise((res) => scene.time.delayedCall(D(ms), res)); }
function tweenP(scene, cfg) {
  return new Promise((res) => {
    const tg = cfg.targets; if (!tg || (Array.isArray(tg) && !tg.length)) { res(); return; }
    scene.tweens.add(Object.assign({}, cfg, { duration: D(cfg.duration || 200), delay: D(cfg.delay || 0), onComplete: () => res() }));
  });
}

// ---------- shared textures
function makeSharedTextures(scene) {
  canvasTex(scene, 'bg', W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, '#ffe6f0'); g.addColorStop(0.45, '#ffdcca'); g.addColorStop(1, '#e8d5ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe9b0';
      ctx.beginPath(); ctx.moveTo(W * 0.5, -60); ctx.lineTo(-200 + i * 190, H); ctx.lineTo(-120 + i * 190, H); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
  canvasTex(scene, 'spark', 32, 32, (ctx) => {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(18, 14); ctx.lineTo(32, 16); ctx.lineTo(18, 18); ctx.lineTo(16, 32); ctx.lineTo(14, 18); ctx.lineTo(0, 16); ctx.lineTo(14, 14); ctx.closePath(); ctx.fill();
  });
  canvasTex(scene, 'confetti', 14, 8, (ctx) => { ctx.fillStyle = '#fff'; rr(ctx, 0, 0, 14, 8, 3); ctx.fill(); });
  canvasTex(scene, 'dot', 16, 16, (ctx) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(8, 8, 8, 0, Math.PI * 2); ctx.fill(); });
}

// =====================================================================
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const msg = document.getElementById('loadmsg');
    this.load.on('progress', (p) => { if (msg) msg.textContent = 'Polishing the chrome... ' + Math.round(p * 100) + '%'; });
    this.load.on('loaderror', (f) => console.warn('asset failed', f && f.key));
    TYPES.concat(['disco', 'wreck', 'drill']).forEach((k) => this.load.image(k, 'assets/tiles/' + k + '.webp'));
    for (let i = 0; i < 8; i++) { this.load.image('before' + i, 'assets/img/before' + i + '.jpg'); this.load.image('after' + i, 'assets/img/after' + i + '.jpg'); }
    this.load.image('title', 'assets/img/title.jpg');
    ['chime', 'chime2', 'swap', 'bonk', 'drill', 'wreck', 'turbo', 'cheer', 'fanfare', 'finale'].forEach((k) => this.load.audio(k, 'assets/audio/' + k + '.mp3'));
    this.load.audio('music', 'assets/audio/music.mp3');
  }
  create() {
    makeSharedTextures(this);
    const l = document.getElementById('loading'); if (l) l.remove();
    const start = PARAMS.get('start');
    if (start === 'finale') { this.scene.start('Finale'); return; }
    this.scene.start('Title');
  }
}

// =====================================================================
class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    window.JOE.scene = this; window.JOE.sceneName = 'Title';
    this.add.image(W / 2, H / 2, 'bg');
    const art = this.add.image(W / 2, H, 'title').setOrigin(0.5, 1);
    art.setScale(Math.max(W / art.width, H / art.height));
    // soft veil at top and bottom for legibility
    canvasTex(this, 'veil', W, H, (ctx) => {
      let g = ctx.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(255,240,248,0.92)'); g.addColorStop(1, 'rgba(255,240,248,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 420);
      g = ctx.createLinearGradient(0, H - 470, 0, H); g.addColorStop(0, 'rgba(255,236,246,0)'); g.addColorStop(0.45, 'rgba(255,236,246,0.85)'); g.addColorStop(1, 'rgba(255,236,246,0.97)');
      ctx.fillStyle = g; ctx.fillRect(0, H - 470, W, 470);
    });
    this.add.image(W / 2, H / 2, 'veil');

    const hb = txt(this, W / 2, 70, 'Here\'s to you, Joe!', 30, { color: '#c4417f', weight: '600' });
    const t1 = txt(this, W / 2, 170, "Joe's Tower", 104, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 10, shadow: 'rgba(160,40,110,0.45)' });
    goldText(t1);
    txt(this, W / 2, 268, 'Match. Remodel. Rise to the penthouse.', 28, { color: '#6b3466', weight: '600' });
    if (!RM) {
      this.tweens.add({ targets: t1, scale: 1.04, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.add.particles(0, 0, 'spark', { x: { min: 40, max: W - 40 }, y: { min: 300, max: 900 }, lifespan: 1400, scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, frequency: 180, tint: [0xffffff, 0xffe28a, 0xffb3d9] });
    }
    hb.setAlpha(0); this.tweens.add({ targets: hb, alpha: 1, y: 76, duration: 700 });

    const saved = store.get('progress', { classic: 0, relaxed: 0 });
    let y = H - 330;
    const go = (mode, floor) => {
      G.mode = mode; G.floor = floor; G.score = floor === 0 ? 0 : store.get('score_' + mode, 0);
      startMusic(this);
      this.cameras.main.fadeOut(D(350), 255, 230, 240);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
    };
    this.btnPlay = makeButton(this, W / 2, y, 440, 96, saved.classic > 0 ? `Continue: Floor ${saved.classic + 1}` : 'Build It', { fs: 40 }, () => go('classic', saved.classic || 0));
    txt(this, W / 2, y + 66, 'Classic: goals with a move budget', 22, { color: '#7a3c72', weight: '500' });
    y += 140;
    this.btnRelax = makeButton(this, W / 2, y, 440, 86, saved.relaxed > 0 ? `Relaxed: Floor ${saved.relaxed + 1}` : 'Relaxed Mode', { fs: 34, c1: '#c9b2ff', c2: '#9b6dff' }, () => go('relaxed', saved.relaxed || 0));
    txt(this, W / 2, y + 62, 'No move limit. The penthouse is always reachable.', 22, { color: '#7a3c72', weight: '500' });
    if (saved.classic > 0 || saved.relaxed > 0) {
      const r = txt(this, W / 2, H - 40, 'Start over from the lobby', 22, { color: '#a24c86', weight: '600' }).setInteractive({ useHandCursor: true });
      r.on('pointerdown', () => { store.set('progress', { classic: 0, relaxed: 0 }); this.scene.restart(); });
    }
    this.soundBtn = makeSoundToggle(this, W - 64, 92);
    this.input.once('pointerdown', () => startMusic(this));
    window.JOE.ready = true;
  }
}

function makeSoundToggle(scene, x, y) {
  const key = canvasTex(scene, 'roundbtn', 84, 84, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 84); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffd6e8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(42, 42, 38, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = goldGrad(ctx, 4, 80); ctx.stroke();
  });
  const img = scene.add.image(0, 0, key);
  const t = txt(scene, 0, 0, G.muted ? 'OFF' : 'ON', 22, { color: '#b23f7c' });
  const lab = txt(scene, 0, 0, '', 1);
  const c = scene.add.container(x, y, [img, t, lab]).setSize(84, 84).setInteractive({ useHandCursor: true });
  const note = txt(scene, 0, -54, 'sound', 18, { color: '#8a3f78', weight: '600' }); c.add(note);
  c.on('pointerdown', () => {
    G.muted = !G.muted; store.set('muted', G.muted); scene.sound.mute = G.muted;
    if (!G.muted) startMusic(scene);
    t.setText(G.muted ? 'OFF' : 'ON');
  });
  return c;
}

// =====================================================================
class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  create() {
    window.JOE.scene = this; window.JOE.sceneName = 'Game';
    this.busy = true; this.g = []; this.sel = null; this.down = null;
    this.turbo = 0; this.turboMeter = 0; this.reveal = 0; this.revealShown = 0;
    this.cameras.main.fadeIn(D(350), 255, 230, 240);
    this.add.image(W / 2, H / 2, 'bg');
    if (!RM) this.add.particles(0, 0, 'spark', { x: { min: 0, max: W }, y: { min: 0, max: H }, lifespan: 2400, scale: { start: 0.5, end: 0 }, alpha: { start: 0.8, end: 0 }, frequency: 400, tint: [0xffffff, 0xffe28a] }).setDepth(0);

    this.buildHud();
    this.buildRoomPanel();
    this.buildTurboBar();
    this.buildBoard();
    this.buildFooter();

    this.burst = this.add.particles(0, 0, 'spark', { lifespan: D(600), speed: { min: 80, max: 320 }, scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(40);
    this.confetti = this.add.particles(0, 0, 'confetti', { lifespan: 2600, speedX: { min: -260, max: 260 }, speedY: { min: -700, max: -250 }, gravityY: 700, rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.4 }, emitting: false, tint: [0xff7eb6, 0xffd36b, 0x7fe0c0, 0xb49bff, 0x8fd0ff, 0xffffff] }).setDepth(60);
    this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(70);

    this.input.on('pointerdown', (p) => this.onDown(p));
    this.input.on('pointermove', (p) => this.onMove(p));
    this.input.on('pointerup', (p) => this.onUp(p));
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.hintTick() });

    this.loadFloor(G.floor, true);
    window.JOE.ready = true;
  }

  // ---------------------------------------------------------- HUD
  buildHud() {
    canvasTex(this, 'hudpill', 200, 76, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 76); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffe1ee');
      ctx.fillStyle = g; rr(ctx, 3, 3, 194, 70, 35); ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = goldGrad(ctx, 0, 76); rr(ctx, 4, 4, 192, 68, 34); ctx.stroke();
    });
    this.floorLabel = txt(this, 24, 26, '', 22, { ox: 0, color: '#b0447f', weight: '600' });
    this.roomLabel = txt(this, 24, 60, '', 38, { ox: 0, color: '#5a2a55' });
    this.add.image(W - 118, 46, 'hudpill');
    txt(this, W - 118, 26, 'MOVES', 18, { color: '#b0447f', weight: '600' });
    this.movesText = txt(this, W - 118, 56, '', 36, { color: '#5a2a55' });
    this.scoreText = txt(this, W - 236, 46, '', 22, { ox: 1, color: '#8a3f78', weight: '600' });
  }

  buildRoomPanel() {
    const px = 8, py = 92, pw = W - 16, ph = 376;
    canvasTex(this, 'panel', pw, ph, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, ph); g.addColorStop(0, '#fff9f3'); g.addColorStop(1, '#ffe6ef');
      ctx.fillStyle = g; rr(ctx, 2, 2, pw - 4, ph - 4, 28); ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = goldGrad(ctx, 0, ph); rr(ctx, 3, 3, pw - 6, ph - 6, 27); ctx.stroke();
    });
    this.add.image(px + pw / 2, py + ph / 2, 'panel');
    // tower sky
    this.tw = { x: px + 10, y: py + 10, w: 138, h: ph - 20 };
    canvasTex(this, 'sky', this.tw.w, this.tw.h, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#c9b6ff'); g.addColorStop(0.6, '#ffc9de'); g.addColorStop(1, '#ffe2c4');
      ctx.fillStyle = g; rr(ctx, 0, 0, w, h, 20); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 26; i++) { const x = (i * 53) % w, y = (i * 97) % (h * 0.6); ctx.beginPath(); ctx.arc(x, y, (i % 3) + 1, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#e7a8c4'; rr(ctx, 0, h - 16, w, 16, 8); ctx.fill();
    });
    this.add.image(this.tw.x + this.tw.w / 2, this.tw.y + this.tw.h / 2, 'sky');
    this.towerLayer = this.add.container(0, 0);
    this.floorH = (this.tw.h - 16 - 34) / 8;

    // room image area
    const rx = this.tw.x + this.tw.w + 10, ry = py + 10, rw = px + pw - 10 - rx, rh = ph - 20;
    this.room = { x: rx, y: ry, w: rw, h: rh };
    this.beforeImg = this.add.image(rx, ry, 'before0').setOrigin(0, 0).setDisplaySize(rw, rh);
    this.afterImg = this.add.image(rx, ry, 'after0').setOrigin(0, 0).setDisplaySize(rw, rh);
    const mg = this.make.graphics({ x: 0, y: 0, add: false });
    this.revealMaskG = mg; this.afterImg.setMask(mg.createGeometryMask());
    canvasTex(this, 'roomframe', rw + 8, rh + 8, (ctx, w, h) => {
      ctx.fillStyle = '#fff6f0'; ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out'; rr(ctx, 4, 4, w - 8, h - 8, 20); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.lineWidth = 4; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 4, 4, w - 8, h - 8, 20); ctx.stroke();
    });
    this.add.image(rx - 4, ry - 4, 'roomframe').setOrigin(0, 0);
    this.edge = this.add.rectangle(rx, ry + rh / 2, 6, rh - 8, 0xfff2b0, 0.95).setBlendMode('ADD');
    this.edgeGlow = this.add.particles(0, 0, 'spark', { lifespan: 700, speedX: { min: -40, max: 40 }, speedY: { min: -60, max: 60 }, scale: { start: 0.7, end: 0 }, frequency: 90, tint: [0xffffff, 0xffe28a], emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(-3, ry, 6, rh) } });
    this.pctText = txt(this, rx + 14, ry + 20, '', 20, { ox: 0, color: '#ffffff', shadow: 'rgba(90,20,70,0.9)' });
    this.goalChips = this.add.container(0, 0);
  }

  buildTurboBar() {
    const y = 497; this.tb = { x: 168, y, w: 524, h: 34 };
    canvasTex(this, 'turboframe', 704, 54, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e6e2f0'); g.addColorStop(1, '#bdb6cf');
      ctx.fillStyle = g; rr(ctx, 2, 2, w - 4, h - 4, 26); ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 3, 3, w - 6, h - 6, 25); ctx.stroke();
      ctx.fillStyle = '#5a2a55'; rr(ctx, 158, 10, 528, 34, 17); ctx.fill();
    });
    canvasTex(this, 'stripes', 64, 34, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffd36b'); g.addColorStop(1, '#ff5c97');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = -1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(i * 32, h); ctx.lineTo(i * 32 + 16, 0); ctx.lineTo(i * 32 + 28, 0); ctx.lineTo(i * 32 + 12, h); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 3, w, 7);
    });
    this.add.image(W / 2, y, 'turboframe');
    this.turboLabel = txt(this, 90, y, 'TURBO', 30, { color: '#ff3f88', stroke: '#ffffff', strokeW: 5 });
    this.turboLabel.setFontStyle('italic 700');
    this.turboFill = this.add.tileSprite(this.tb.x, y, 1, this.tb.h - 4, 'stripes').setOrigin(0, 0.5);
    this.turboFill.setVisible(false);
    this.turboHint = txt(this, this.tb.x + this.tb.w / 2, y, 'Chain cascades to charge', 18, { color: '#ffd9ec', weight: '600' });
  }

  buildBoard() {
    canvasTex(this, 'board', N * CELL + 24, N * CELL + 24, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(160,60,120,0.18)'; rr(ctx, 4, 10, w - 8, h - 10, 30); ctx.fill();
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fffaf4'); g.addColorStop(1, '#ffe7f0');
      ctx.fillStyle = g; rr(ctx, 2, 2, w - 4, h - 8, 30); ctx.fill();
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        ctx.fillStyle = (r + c) % 2 ? 'rgba(255,190,215,0.35)' : 'rgba(255,240,215,0.55)';
        rr(ctx, 12 + c * CELL + 2, 10 + r * CELL + 2, CELL - 4, CELL - 4, 16); ctx.fill();
      }
      ctx.lineWidth = 6; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 4, 3, w - 8, h - 12, 28); ctx.stroke();
    });
    this.add.image(BX + (N * CELL) / 2, BY + (N * CELL) / 2 + 2, 'board');
    canvasTex(this, 'sel', CELL, CELL, (ctx, w, h) => {
      ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; rr(ctx, 4, 4, w - 8, h - 8, 18); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = '#ffc83d'; rr(ctx, 4, 4, w - 8, h - 8, 18); ctx.stroke();
    });
    this.layer = this.add.container(0, 0).setDepth(10);
    const mg = this.make.graphics({ add: false }); mg.fillStyle(0xffffff); mg.fillRect(BX - 10, BY - 4, N * CELL + 20, N * CELL + 14);
    this.layer.setMask(mg.createGeometryMask());
    this.selImg = this.add.image(0, 0, 'sel').setDepth(20).setVisible(false);
    if (!RM) this.tweens.add({ targets: this.selImg, scale: 1.08, duration: 380, yoyo: true, repeat: -1 });
    // racing stripes for TURBO
    this.raceStripes = this.add.container(0, 0).setDepth(25).setAlpha(0);
    [BY - 14, BY + N * CELL + 6].forEach((yy) => {
      this.raceStripes.add(this.add.rectangle(W / 2, yy, N * CELL + 20, 6, 0xff4f93));
      this.raceStripes.add(this.add.rectangle(W / 2, yy + 9, N * CELL + 20, 6, 0xffd36b));
    });
    this.speedLines = this.add.container(0, 0).setDepth(26);
  }

  buildFooter() {
    const y = 1246;
    this.menuBtn = makeButton(this, 108, y, 180, 60, 'Menu', { fs: 26, c1: '#ffd38f', c2: '#f3a64a' }, () => this.toMenu());
    this.hintBtn = makeButton(this, W / 2, y, 180, 60, 'Hint', { fs: 26, c1: '#a8ecd0', c2: '#3fc59a' }, () => this.showHint(true));
    this.soundBtn = makeSoundToggle(this, W - 70, y - 4); this.soundBtn.setScale(0.75);
    this.soundBtn.list[3].setVisible(false);
  }

  toMenu() {
    if (this.overlay) return;
    this.scene.start('Title');
  }

  // ---------------------------------------------------------- floors
  loadFloor(i, first) {
    G.floor = i; const f = FLOORS[i];
    this.collected = {}; Object.keys(f.goals).forEach((k) => (this.collected[k] = 0));
    this.moves = f.moves; this.turbo = 0; this.turboMeter = 0; this.reveal = 0; this.revealShown = 0;
    this.floorLabel.setText(`FLOOR ${i + 1} OF 8  ${G.mode === 'relaxed' ? 'RELAXED' : ''}`);
    this.roomLabel.setText(f.name);
    this.beforeImg.setTexture('before' + i).setDisplaySize(this.room.w, this.room.h);
    this.afterImg.setTexture('after' + i).setDisplaySize(this.room.w, this.room.h);
    this.updateMoves(); this.updateScore(); this.updateTurbo(); this.buildGoalChips(); this.drawReveal(0);
    this.drawTower(i, false);
    this.fillBoard(first);
    this.floorIntro();
  }

  buildGoalChips() {
    this.goalChips.removeAll(true);
    const keys = Object.keys(FLOORS[G.floor].goals);
    const cw = 132, gap = 8, total = keys.length * cw + (keys.length - 1) * gap;
    let x = this.room.x + this.room.w / 2 - total / 2;
    const y = this.room.y + this.room.h - 34;
    canvasTex(this, 'chip', cw, 54, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(70,25,70,0.62)'; rr(ctx, 1, 1, w - 2, h - 2, 26); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 2, 2, w - 4, h - 4, 25); ctx.stroke();
    });
    canvasTex(this, 'chipdone', cw, 54, (ctx, w, h) => {
      ctx.fillStyle = goldGrad(ctx, 0, h); rr(ctx, 1, 1, w - 2, h - 2, 26); ctx.fill();
    });
    this.chips = {};
    keys.forEach((k) => {
      const bg = this.add.image(0, 0, 'chip');
      const icon = this.add.image(-cw / 2 + 28, 0, k).setDisplaySize(46, 46);
      const t = txt(this, 18, 0, '', 24, { color: '#ffffff' });
      const c = this.add.container(x + cw / 2, y, [bg, icon, t]);
      this.goalChips.add(c); this.chips[k] = { c, t, bg }; x += cw + gap;
    });
    this.updateGoals();
  }

  updateGoals() {
    const f = FLOORS[G.floor]; let have = 0, need = 0;
    Object.keys(f.goals).forEach((k) => {
      const n = Math.min(this.collected[k], f.goals[k]); have += n; need += f.goals[k];
      const ch = this.chips[k]; if (!ch) return;
      const done = this.collected[k] >= f.goals[k];
      ch.t.setText(done ? '\u2713' : `${n}/${f.goals[k]}`); ch.t.setFontSize(done ? 34 : 24);
      ch.t.setColor(done ? '#7a3c00' : '#ffffff');
      ch.bg.setTexture(done ? 'chipdone' : 'chip');
    });
    this.reveal = need ? have / need : 0;
    this.tweens.add({ targets: this, revealShown: this.reveal, duration: D(450), ease: 'Cubic.easeOut', onUpdate: () => this.drawReveal(this.revealShown) });
  }

  drawReveal(p) {
    const r = this.room, g = this.revealMaskG; g.clear(); g.fillStyle(0xffffff);
    const x = r.x + r.w * p;
    g.fillRect(r.x, r.y, r.w * p, r.h);
    this.edge.setX(x).setVisible(p > 0.001 && p < 0.999);
    this.edgeGlow.setX(x); this.edgeGlow.emitting = p > 0.001 && p < 0.999 && !RM;
    this.pctText.setText(p >= 0.999 ? 'REMODELED' : `REMODEL ${Math.round(p * 100)}%`);
  }

  goalsMet() { const f = FLOORS[G.floor]; return Object.keys(f.goals).every((k) => this.collected[k] >= f.goals[k]); }

  updateMoves() { this.movesText.setText(G.mode === 'relaxed' ? '∞' : String(this.moves)); this.movesText.setColor(G.mode !== 'relaxed' && this.moves <= 5 ? '#e0306f' : '#5a2a55'); }
  updateScore() { this.scoreText.setText(G.score.toLocaleString('en-US') + ' pts'); }

  // ---------------------------------------------------------- tower
  floorRect(i) {
    const fh = this.floorH, base = this.tw.y + this.tw.h - 16;
    const w = this.tw.w - 18 - i * 5; const x = this.tw.x + (this.tw.w - w) / 2;
    return { x, y: base - (i + 1) * fh, w, h: fh - 2 };
  }
  makeFloorGfx(i, built) {
    const r = this.floorRect(i); const g = this.add.graphics();
    if (built) {
      g.fillStyle(0x8a3f78, 0.25); g.fillRoundedRect(r.x + 3, r.y + 4, r.w, r.h, 8);
      g.fillStyle(FLOOR_COLORS[i], 1); g.fillRoundedRect(r.x, r.y, r.w, r.h, 8);
      g.lineStyle(2, 0x7a3a6e, 0.85); g.strokeRoundedRect(r.x, r.y, r.w, r.h, 8);
      g.fillStyle(0xffffff, 0.45); g.fillRoundedRect(r.x + 4, r.y + 3, r.w - 8, 6, 3);
      g.fillStyle(0xf3c766, 1); g.fillRect(r.x, r.y + r.h - 4, r.w, 4);
      const nWin = 4, ww = (r.w - 16) / nWin;
      for (let k = 0; k < nWin; k++) {
        g.fillStyle(0xdedbe8, 1); g.fillRoundedRect(r.x + 8 + k * ww + 2, r.y + 11, ww - 6, r.h - 19, 4);
        g.fillStyle(0xfff1a8, 1); g.fillRoundedRect(r.x + 8 + k * ww + 4, r.y + 13, ww - 10, r.h - 23, 3);
      }
    } else {
      g.lineStyle(2, 0xb06d9c, 0.9); g.strokeRoundedRect(r.x, r.y, r.w, r.h, 8);
      g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(r.x, r.y, r.w, r.h, 8);
      g.lineStyle(2, 0xb06d9c, 0.6);
      for (let k = 0; k < r.w; k += 18) g.lineBetween(r.x + k, r.y + r.h, Math.min(r.x + k + 14, r.x + r.w), r.y);
    }
    return g;
  }
  drawTower(current, animateNew) {
    this.towerLayer.removeAll(true);
    for (let i = 0; i < current; i++) this.towerLayer.add(this.makeFloorGfx(i, true));
    if (current < 8) {
      const sc = this.makeFloorGfx(current, false); this.towerLayer.add(sc);
      if (!RM) this.tweens.add({ targets: sc, alpha: 0.45, duration: 700, yoyo: true, repeat: -1 });
      const r = this.floorRect(current);
      const arrow = txt(this, r.x + r.w / 2, r.y - 14, 'you are here', 13, { color: '#8a3f78', weight: '600' });
      this.towerLayer.add(arrow);
    } else {
      const r = this.floorRect(7);
      const ball = this.add.image(r.x + r.w / 2, r.y - 18, 'disco').setDisplaySize(40, 40);
      this.towerLayer.add(ball);
      if (!RM) this.tweens.add({ targets: ball, angle: 360, duration: 4000, repeat: -1 });
    }
    window.JOE.towerFloors = current;
  }
  async growTower(i) {
    const g = this.makeFloorGfx(i, true); this.towerLayer.add(g);
    g.y = -260; g.alpha = 1;
    await tweenP(this, { targets: g, y: 0, duration: RM ? 200 : 700, ease: RM ? 'Linear' : 'Bounce.easeOut' });
    const r = this.floorRect(i);
    this.burst.setParticleTint(0xffe28a); this.burst.explode(RM ? 6 : 24, r.x + r.w / 2, r.y + r.h / 2);
    this.drawTower(i + 1, false);
  }

  // ---------------------------------------------------------- board model
  key(r, c) { return r * N + c; }
  rc(k) { return [Math.floor(k / N), k % N]; }
  cx(c) { return BX + c * CELL + CELL / 2; }
  cy(r) { return BY + r * CELL + CELL / 2; }
  randType() { return TYPES[Math.floor(Math.random() * TYPES.length)]; }

  makePiece(type, r, c, special) {
    const p = { type, special: null, c: null, img: null };
    const img = this.add.image(0, 0, type || 'disco').setDisplaySize(74, 74);
    p.img = img; p.c = this.add.container(this.cx(c), this.cy(r), [img]);
    this.layer.add(p.c);
    if (special) this.setSpecial(p, special, true);
    return p;
  }

  setSpecial(p, special, silent) {
    p.special = special;
    if (p.deco) { p.deco.forEach((d) => d.destroy()); }
    p.deco = [];
    if (special === 'disco') {
      p.type = null; p.img.setTexture('disco').setDisplaySize(76, 76);
      const ring = this.add.graphics();
      const cols = [0xff7eb6, 0xffd36b, 0x7fe0c0, 0x8fd0ff, 0xb49bff, 0xff9f7f];
      cols.forEach((col, i) => { ring.lineStyle(5, col, 1); ring.beginPath(); ring.arc(0, 0, 38, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2); ring.strokePath(); });
      p.c.addAt(ring, 0); p.deco.push(ring);
      if (!RM) this.tweens.add({ targets: ring, angle: 360, duration: 2200, repeat: -1 });
    } else if (special === 'drillH' || special === 'drillV') {
      const glow = this.add.rectangle(0, 0, special === 'drillH' ? 82 : 20, special === 'drillH' ? 20 : 82, 0xffffff, 0.8);
      p.c.addAt(glow, 0); p.deco.push(glow);
      const b = this.add.image(22, 22, 'drill').setDisplaySize(40, 40).setAngle(special === 'drillV' ? 90 : 0);
      p.c.add(b); p.deco.push(b);
      if (!RM) this.tweens.add({ targets: glow, alpha: 0.3, duration: 420, yoyo: true, repeat: -1 });
    } else if (special === 'wreck') {
      const glow = this.add.circle(0, 0, 40, 0xffd36b, 0.55);
      p.c.addAt(glow, 0); p.deco.push(glow);
      const b = this.add.image(22, 20, 'wreck').setDisplaySize(40, 40);
      p.c.add(b); p.deco.push(b);
      if (!RM) this.tweens.add({ targets: glow, scale: 1.15, alpha: 0.25, duration: 520, yoyo: true, repeat: -1 });
    }
    if (!silent) {
      G.stats.specialsMade++;
      p.c.setScale(0.3);
      this.tweens.add({ targets: p.c, scale: 1, duration: D(380), ease: 'Back.easeOut' });
      this.burst.setParticleTint(0xffffff); this.burst.explode(RM ? 4 : 14, p.c.x, p.c.y);
      this.bumpTurbo(6);
    }
  }

  fillBoard(first) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const p = this.g[r] && this.g[r][c]; if (p) p.c.destroy(); }
    let types;
    for (let tries = 0; tries < 200; tries++) {
      types = [];
      for (let r = 0; r < N; r++) {
        types.push([]);
        for (let c = 0; c < N; c++) {
          let t, guard = 0;
          do { t = this.randType(); guard++; } while (guard < 20 && ((c >= 2 && types[r][c - 1] === t && types[r][c - 2] === t) || (r >= 2 && types[r - 1][c] === t && types[r - 2][c] === t)));
          types[r].push(t);
        }
      }
      if (this.findMovesOnTypes(types).length >= 3) break;
    }
    this.g = [];
    for (let r = 0; r < N; r++) {
      this.g.push([]);
      for (let c = 0; c < N; c++) {
        const p = this.makePiece(types[r][c], r, c);
        this.g[r].push(p);
        if (!RM) { p.c.y = this.cy(r) - 700; this.tweens.add({ targets: p.c, y: this.cy(r), duration: D(500 + r * 40), delay: D((N - r) * 30 + c * 15), ease: 'Bounce.easeOut' }); }
      }
    }
  }

  typesGrid() { return this.g.map((row) => row.map((p) => (p ? p.type : null))); }

  findMovesOnTypes(t) {
    const moves = [];
    const has3 = (tt, r, c) => {
      const ty = tt[r][c]; if (!ty) return false;
      let h = 1; for (let k = c - 1; k >= 0 && tt[r][k] === ty; k--) h++; for (let k = c + 1; k < N && tt[r][k] === ty; k++) h++;
      if (h >= 3) return true;
      let v = 1; for (let k = r - 1; k >= 0 && tt[k][c] === ty; k--) v++; for (let k = r + 1; k < N && tt[k][c] === ty; k++) v++;
      return v >= 3;
    };
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc; if (r2 >= N || c2 >= N) continue;
        const a = t[r][c], b = t[r2][c2];
        t[r][c] = b; t[r2][c2] = a;
        const ok = has3(t, r, c) || has3(t, r2, c2);
        t[r][c] = a; t[r2][c2] = b;
        if (ok) moves.push([[r, c], [r2, c2]]);
      }
    }
    return moves;
  }

  findMoves() {
    const moves = this.findMovesOnTypes(this.typesGrid());
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = this.g[r][c]; if (!p || !p.special) continue;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const r2 = r + dr, c2 = c + dc; if (r2 < 0 || c2 < 0 || r2 >= N || c2 >= N) continue;
        const q = this.g[r2][c2];
        if (p.special === 'disco' || (q && q.special)) moves.push([[r, c], [r2, c2]]);
      }
    }
    return moves;
  }

  findGroups() {
    const t = (r, c) => { const p = this.g[r][c]; return p && p.type ? p.type : null; };
    const runs = [];
    for (let r = 0; r < N; r++) { let c = 0; while (c < N) { const ty = t(r, c); let e = c + 1; while (ty && e < N && t(r, e) === ty) e++; if (ty && e - c >= 3) { const cells = []; for (let k = c; k < e; k++) cells.push(this.key(r, k)); runs.push({ dir: 'h', cells, type: ty }); } c = e; } }
    for (let c = 0; c < N; c++) { let r = 0; while (r < N) { const ty = t(r, c); let e = r + 1; while (ty && e < N && t(e, c) === ty) e++; if (ty && e - r >= 3) { const cells = []; for (let k = r; k < e; k++) cells.push(this.key(k, c)); runs.push({ dir: 'v', cells, type: ty }); } r = e; } }
    const parent = runs.map((_, i) => i);
    const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const owner = new Map();
    runs.forEach((run, i) => run.cells.forEach((k) => { if (owner.has(k)) parent[find(i)] = find(owner.get(k)); else owner.set(k, i); }));
    const groups = new Map();
    runs.forEach((run, i) => { const root = find(i); if (!groups.has(root)) groups.set(root, { runs: [], cells: new Set(), type: run.type }); const g = groups.get(root); g.runs.push(run); run.cells.forEach((k) => g.cells.add(k)); });
    return [...groups.values()].map((g) => {
      const maxRun = g.runs.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));
      const hasH = g.runs.some((r) => r.dir === 'h'), hasV = g.runs.some((r) => r.dir === 'v');
      let special = null;
      if (maxRun.cells.length >= 5) special = 'disco';
      else if (hasH && hasV) special = 'wreck';
      else if (maxRun.cells.length === 4) special = maxRun.dir === 'h' ? 'drillH' : 'drillV';
      let inter = null;
      if (special === 'wreck') { const hs = new Set(); g.runs.filter((r) => r.dir === 'h').forEach((r) => r.cells.forEach((k) => hs.add(k))); g.runs.filter((r) => r.dir === 'v').forEach((r) => r.cells.forEach((k) => { if (hs.has(k)) inter = k; })); }
      return Object.assign(g, { special, maxRun, inter });
    });
  }

  // ---------------------------------------------------------- input
  cellAt(p) {
    const c = Math.floor((p.x - BX) / CELL), r = Math.floor((p.y - BY) / CELL);
    if (r < 0 || c < 0 || r >= N || c >= N) return null; return [r, c];
  }
  onDown(p) {
    this.lastInput = this.time.now; this.clearHint();
    if (this.busy || this.overlay) return;
    const cell = this.cellAt(p); if (!cell) { this.select(null); return; }
    this.down = { cell, x: p.x, y: p.y, moved: false };
  }
  onMove(p) {
    if (!this.down || this.busy || !p.isDown) return;
    const dx = p.x - this.down.x, dy = p.y - this.down.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < CELL * 0.33) return;
    const [r, c] = this.down.cell;
    const t = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    this.down = null; this.select(null);
    if (t[0] < 0 || t[1] < 0 || t[0] >= N || t[1] >= N) return;
    this.trySwap([r, c], t);
  }
  onUp(p) {
    if (!this.down || this.busy) { this.down = null; return; }
    const cell = this.down.cell; this.down = null;
    if (this.sel) {
      const [r1, c1] = this.sel, [r2, c2] = cell;
      if (r1 === r2 && c1 === c2) { this.select(null); return; }
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) { this.select(null); this.trySwap([r1, c1], cell); return; }
    }
    this.select(cell);
    sfx(this, 'swap', { volume: 0.25, rate: 1.5 });
  }
  select(cell) {
    this.sel = cell;
    if (!cell) { this.selImg.setVisible(false); return; }
    this.selImg.setPosition(this.cx(cell[1]), this.cy(cell[0])).setVisible(true);
  }

  // ---------------------------------------------------------- hints
  hintTick() {
    if (this.busy || this.overlay || this.hinting) return;
    if (this.time.now - (this.lastInput || 0) > 6000) this.showHint(false);
  }
  showHint(force) {
    if (this.busy || this.overlay) return;
    this.lastInput = this.time.now;
    const moves = this.findMoves(); if (!moves.length) return;
    const m = moves[Math.floor(Math.random() * moves.length)];
    this.clearHint(); this.hinting = [];
    m.forEach(([r, c]) => {
      const p = this.g[r][c]; if (!p) return;
      const tw = this.tweens.add({ targets: p.c, scale: 1.14, duration: 260, yoyo: true, repeat: force ? 3 : 2, onComplete: () => p.c.setScale(1) });
      this.hinting.push({ tw, p });
    });
    this.time.delayedCall(2200, () => this.clearHint());
  }
  clearHint() { if (!this.hinting) return; this.hinting.forEach(({ tw, p }) => { tw.stop(); if (p.c && p.c.active) p.c.setScale(1); }); this.hinting = null; }

  // ---------------------------------------------------------- moves
  async trySwap(a, b) {
    if (this.busy || this.overlay) return;
    const pa = this.g[a[0]][a[1]], pb = this.g[b[0]][b[1]]; if (!pa || !pb) return;
    this.busy = true; this.clearHint(); this.lastInput = this.time.now;
    sfx(this, 'swap', { volume: 0.55 });
    const fast = this.turbo ? 0.6 : 1;
    await Promise.all([
      tweenP(this, { targets: pa.c, x: this.cx(b[1]), y: this.cy(b[0]), duration: 160 * fast, ease: 'Quad.easeInOut' }),
      tweenP(this, { targets: pb.c, x: this.cx(a[1]), y: this.cy(a[0]), duration: 160 * fast, ease: 'Quad.easeInOut' }),
    ]);
    this.g[a[0]][a[1]] = pb; this.g[b[0]][b[1]] = pa;
    const ka = this.key(...a), kb = this.key(...b);

    let path = null;
    if (pa.special === 'disco' || pb.special === 'disco') path = 'disco';
    else if (pa.special && pb.special) path = 'combo';
    else if (this.findGroups().length) path = 'match';

    if (!path) {
      G.stats.invalid++;
      sfx(this, 'bonk', { volume: 0.6 });
      await Promise.all([
        tweenP(this, { targets: pa.c, x: this.cx(a[1]), y: this.cy(a[0]), duration: 180, ease: 'Back.easeOut' }),
        tweenP(this, { targets: pb.c, x: this.cx(b[1]), y: this.cy(b[0]), duration: 180, ease: 'Back.easeOut' }),
      ]);
      this.g[a[0]][a[1]] = pa; this.g[b[0]][b[1]] = pb;
      if (!RM) this.cameras.main.shake(D(120), 0.003);
      this.busy = false; return;
    }

    G.stats.swaps++;
    if (G.mode !== 'relaxed') this.moves--;
    this.updateMoves();
    let combo = 0;
    if (path === 'disco') {
      const disco = pa.special === 'disco' ? pa : pb, other = disco === pa ? pb : pa;
      const dk = disco === pa ? kb : ka, ok = disco === pa ? ka : kb;
      const init = new Set([dk]);
      if (other.special === 'disco') { disco.discoAll = true; init.add(ok); other.triggered = true; }
      else { disco.discoColor = other.type; init.add(ok); }
      combo = 1; await this.blast(init, 1, new Set());
      await this.gravity();
    } else if (path === 'combo') {
      combo = 1; await this.comboSwap(pa, pb, kb);
      await this.gravity();
    }
    combo = await this.resolve(path === 'match' ? [ka, kb] : null, combo);
    await this.afterMove();
  }

  async comboSwap(pa, pb, kb) {
    const [r, c] = this.rc(kb); const set = new Set([this.key(...this.rc(kb))]);
    const sp = [pa.special, pb.special].sort().join('+');
    pa.triggered = true; pb.triggered = true;
    const add = (rr2, cc) => { if (rr2 >= 0 && cc >= 0 && rr2 < N && cc < N) set.add(this.key(rr2, cc)); };
    const fx = [];
    if (sp.indexOf('wreck') < 0) { for (let k = 0; k < N; k++) { add(r, k); add(k, c); } fx.push({ kind: 'drillH', r, c }, { kind: 'drillV', r, c }); }
    else if (sp === 'wreck+wreck') { for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) add(r + i, c + j); fx.push({ kind: 'wreck', r, c, big: true }); }
    else { for (let i = -1; i <= 1; i++) for (let k = 0; k < N; k++) { add(r + i, k); add(k, c + i); } fx.push({ kind: 'drillH', r, c, wide: true }, { kind: 'drillV', r, c, wide: true }); }
    // include the other special's cell
    for (let rr2 = 0; rr2 < N; rr2++) for (let cc = 0; cc < N; cc++) { const p = this.g[rr2][cc]; if (p === pa || p === pb) set.add(this.key(rr2, cc)); }
    this.showPraise('Mega Combo!', true);
    await this.blast(set, 2, new Set(), fx);
  }

  async resolve(swapKeys, startCombo) {
    let combo = startCombo || 0;
    for (let guard = 0; guard < 40; guard++) {
      const groups = this.findGroups();
      if (!groups.length) break;
      combo++;
      const clear = new Set(); const creates = []; const createKeys = new Set();
      groups.forEach((g) => {
        g.cells.forEach((k) => clear.add(k));
        if (!g.special) return;
        let k0 = null;
        if (swapKeys) k0 = swapKeys.find((k) => g.cells.has(k)) ?? null;
        if (k0 === null) k0 = g.special === 'wreck' && g.inter !== null ? g.inter : g.maxRun.cells[Math.floor(g.maxRun.cells.length / 2)];
        const p0 = this.g[Math.floor(k0 / N)][k0 % N];
        if (p0 && p0.special) { const alt = [...g.cells].find((k) => { const q = this.g[Math.floor(k / N)][k % N]; return q && !q.special && !createKeys.has(k); }); if (alt === undefined) return; k0 = alt; }
        if (createKeys.has(k0)) return;
        creates.push({ k: k0, special: g.special }); createKeys.add(k0);
      });
      createKeys.forEach((k) => clear.delete(k));
      if (combo >= 2) { G.stats.cascades++; this.bumpTurbo(13); }
      G.stats.maxCombo = Math.max(G.stats.maxCombo, combo);
      this.playChime(combo);
      if (combo >= 2) this.showPraise(PRAISE[Math.min(combo - 2, PRAISE.length - 1)]);
      await this.blast(clear, combo, createKeys);
      creates.forEach(({ k, special }) => { const [r, c] = this.rc(k); const p = this.g[r][c]; if (p) this.setSpecial(p, special); });
      if (creates.length) sfx(this, 'chime2', { volume: 0.6, rate: 1.25 });
      swapKeys = null;
      await this.gravity();
    }
    return combo;
  }

  playChime(combo) {
    const rate = Math.min(2.0, 1 + (combo - 1) * 0.12);
    sfx(this, combo % 2 ? 'chime' : 'chime2', { volume: 0.6, rate });
  }

  async blast(initial, combo, createKeys, fxPre) {
    const final = new Set(); const queue = []; const fx = fxPre ? fxPre.slice() : [];
    initial.forEach((k) => { if (!createKeys.has(k)) { final.add(k); queue.push(k); } });
    const add = (k) => { if (!final.has(k) && !createKeys.has(k)) { final.add(k); queue.push(k); } };
    while (queue.length) {
      const k = queue.shift(); const [r, c] = this.rc(k); const p = this.g[r][c];
      if (!p || !p.special || p.triggered) continue;
      p.triggered = true; G.stats.specialsFired++; this.bumpTurbo(4);
      if (p.special === 'drillH') { for (let i = 0; i < N; i++) add(this.key(r, i)); fx.push({ kind: 'drillH', r, c }); }
      else if (p.special === 'drillV') { for (let i = 0; i < N; i++) add(this.key(i, c)); fx.push({ kind: 'drillV', r, c }); }
      else if (p.special === 'wreck') { const rad = this.turbo ? 2 : 1; for (let i = -rad; i <= rad; i++) for (let j = -rad; j <= rad; j++) if (r + i >= 0 && r + i < N && c + j >= 0 && c + j < N) add(this.key(r + i, c + j)); fx.push({ kind: 'wreck', r, c, big: rad > 1 }); }
      else if (p.special === 'disco') {
        const targets = [];
        let color = p.discoColor;
        if (!color) { const cnt = {}; this.g.forEach((row) => row.forEach((q) => { if (q && q.type) cnt[q.type] = (cnt[q.type] || 0) + 1; })); color = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0]; }
        for (let rr2 = 0; rr2 < N; rr2++) for (let cc = 0; cc < N; cc++) { const q = this.g[rr2][cc]; if (q && (p.discoAll || q.type === color)) { add(this.key(rr2, cc)); targets.push([rr2, cc]); } }
        fx.push({ kind: 'disco', r, c, targets });
      }
    }
    // effects
    let fxDelay = 0;
    for (const f of fx) fxDelay = Math.max(fxDelay, this.playFx(f));
    // count + animate clears
    const mult = this.turbo ? 2 : 1;
    let gained = 0; const flyers = [];
    const goals = FLOORS[G.floor].goals;
    const anims = [];
    final.forEach((k) => {
      const [r, c] = this.rc(k); const p = this.g[r][c]; if (!p) return;
      this.g[r][c] = null;
      gained += 10 * combo * mult;
      if (p.type && goals[p.type] !== undefined) {
        const before = this.collected[p.type];
        this.collected[p.type] += mult;
        if (before < goals[p.type] && flyers.length < 6) flyers.push({ type: p.type, x: p.c.x, y: p.c.y });
      }
      const col = p.type ? MAT[p.type].color : 0xffffff;
      const d = fx.length ? Math.min(260, 14 * (Math.abs(r - (fx[0].r ?? r)) + Math.abs(c - (fx[0].c ?? c)))) : 0;
      anims.push(tweenP(this, { targets: p.c, scale: 1.3, alpha: 0, angle: RM ? 0 : Phaser.Math.Between(-25, 25), duration: 230, delay: d + fxDelay * 0.4, ease: 'Back.easeIn' }).then(() => {
        this.burst.setParticleTint(col); this.burst.explode(RM ? 2 : 7, p.c.x, p.c.y);
        p.c.destroy();
      }));
    });
    G.score += gained; this.updateScore();
    if (combo >= 3 && !RM) this.cameras.main.shake(D(140), 0.004);
    await Promise.all(anims);
    flyers.forEach((f, i) => this.flyToChip(f, i));
    this.updateGoals();
  }

  flyToChip(f, i) {
    const ch = this.chips[f.type]; if (!ch) return;
    const im = this.add.image(f.x, f.y, f.type).setDisplaySize(52, 52).setDepth(45);
    const tx = ch.c.x - 40, ty = ch.c.y;
    this.tweens.add({ targets: im, x: tx, y: ty, scale: im.scale * 0.6, duration: D(520), delay: D(i * 50), ease: 'Cubic.easeIn', onComplete: () => {
      im.destroy();
      this.tweens.add({ targets: ch.c, scale: 1.15, duration: D(90), yoyo: true });
    } });
  }

  playFx(f) {
    const x = this.cx(f.c), y = this.cy(f.r);
    if (f.kind === 'drillH' || f.kind === 'drillV') {
      sfx(this, 'drill', { volume: 0.6 });
      const h = f.kind === 'drillH';
      const thick = f.wide ? CELL * 3 : CELL * 0.7;
      const beam = this.add.rectangle(h ? W / 2 : x, h ? y : BY + (N * CELL) / 2, h ? N * CELL : thick, h ? thick : N * CELL, 0xfff3c4, 0.9).setDepth(35).setBlendMode('ADD');
      beam.setScale(h ? 0.05 : 1, h ? 1 : 0.05);
      this.tweens.add({ targets: beam, scaleX: 1, scaleY: 1, duration: D(140), onComplete: () => this.tweens.add({ targets: beam, alpha: 0, duration: D(240), onComplete: () => beam.destroy() }) });
      const drill = this.add.image(h ? BX : x, h ? y : BY, 'drill').setDisplaySize(64, 64).setDepth(36).setAngle(h ? 0 : 90);
      this.tweens.add({ targets: drill, x: h ? BX + N * CELL : x, y: h ? y : BY + N * CELL, duration: D(300), onComplete: () => drill.destroy() });
      this.doFlash(0.25);
      return 140;
    }
    if (f.kind === 'wreck') {
      sfx(this, 'wreck', { volume: 0.7 });
      const ball = this.add.image(x, y - 300, 'wreck').setDisplaySize(90, 90).setDepth(36);
      this.tweens.add({ targets: ball, y, duration: D(200), ease: 'Quad.easeIn', onComplete: () => {
        const ring = this.add.circle(x, y, 10).setStrokeStyle(10, 0xffd36b, 1).setDepth(35);
        this.tweens.add({ targets: ring, radius: f.big ? CELL * 3 : CELL * 1.8, alpha: 0, duration: D(380), onComplete: () => ring.destroy() });
        this.tweens.add({ targets: ball, alpha: 0, scale: ball.scale * 1.5, duration: D(260), onComplete: () => ball.destroy() });
        if (!RM) this.cameras.main.shake(D(220), 0.008);
        this.doFlash(0.35);
      } });
      return 200;
    }
    if (f.kind === 'disco') {
      sfx(this, 'wreck', { volume: 0.4, rate: 1.4 }); sfx(this, 'chime', { volume: 0.7, rate: 1.6 });
      const g = this.add.graphics().setDepth(35).setBlendMode('ADD');
      const cols = [0xff7eb6, 0xffd36b, 0x7fe0c0, 0x8fd0ff, 0xb49bff];
      f.targets.forEach(([r2, c2], i) => { g.lineStyle(5, cols[i % cols.length], 0.95); g.lineBetween(x, y, this.cx(c2), this.cy(r2)); });
      this.tweens.add({ targets: g, alpha: 0, duration: D(520), delay: D(120), onComplete: () => g.destroy() });
      this.burst.setParticleTint(0xffffff); this.burst.explode(RM ? 8 : 40, x, y);
      this.doFlash(0.45);
      return 240;
    }
    return 0;
  }

  doFlash(a) { this.flash.setAlpha(RM ? a * 0.3 : a); this.tweens.add({ targets: this.flash, alpha: 0, duration: D(260) }); }

  showPraise(s, big) {
    const t = txt(this, W / 2, BY + (N * CELL) / 2, s, big ? 76 : 64, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 10, shadow: 'rgba(90,20,70,0.5)' }).setDepth(50);
    goldText(t); t.setScale(0.2);
    this.tweens.add({ targets: t, scale: 1, duration: D(260), ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 80, duration: D(500), delay: D(520), onComplete: () => t.destroy() });
  }

  async gravity() {
    const anims = [];
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        const p = this.g[r][c]; if (!p) continue;
        if (r !== write) { this.g[write][c] = p; this.g[r][c] = null; const dist = write - r; anims.push(tweenP(this, { targets: p.c, y: this.cy(write), duration: (this.turbo ? 0.6 : 1) * (150 + dist * 45), ease: 'Bounce.easeOut' })); }
        write--;
      }
      for (let i = 0; write >= 0; write--, i++) {
        const p = this.makePiece(this.randType(), write, c);
        p.c.y = BY - CELL / 2 - i * CELL - 10;
        this.g[write][c] = p;
        const dist = (this.cy(write) - p.c.y) / CELL;
        anims.push(tweenP(this, { targets: p.c, y: this.cy(write), duration: (this.turbo ? 0.6 : 1) * (170 + dist * 45), ease: 'Bounce.easeOut' }));
      }
    }
    await Promise.all(anims);
  }

  // ---------------------------------------------------------- turbo
  bumpTurbo(n) {
    if (this.turbo) return;
    this.turboMeter = Math.min(100, this.turboMeter + n); this.updateTurbo();
  }
  updateTurbo() {
    const pct = this.turbo ? this.turbo / 3 : this.turboMeter / 100;
    const w = Math.max(1, (this.tb.w - 4) * pct);
    this.turboFill.setVisible(pct > 0.001); this.turboFill.width = w; this.turboFill.x = this.tb.x + 2;
    this.turboHint.setVisible(!this.turbo && pct < 0.35);
    if (this.turbo) this.turboHint.setVisible(false);
    if (!this.turbo && this.turboMeter >= 100 && !this.readyPulse && !RM) {
      this.readyPulse = this.tweens.add({ targets: this.turboLabel, scale: 1.18, duration: 260, yoyo: true, repeat: -1 });
    }
  }
  update(time, delta) {
    if (this.turboFill && this.turboFill.visible) this.turboFill.tilePositionX -= (this.turbo ? 0.9 : 0.15) * delta;
  }
  async startTurbo() {
    G.stats.turbos++;
    this.turbo = 3; this.turboMeter = 0;
    if (this.readyPulse) { this.readyPulse.stop(); this.readyPulse = null; this.turboLabel.setScale(1); }
    this.updateTurbo();
    sfx(this, 'turbo', { volume: 0.8 });
    this.doFlash(0.5);
    const banner = txt(this, W / 2, BY + (N * CELL) / 2, 'TURBO!', 120, { stroke: '#ff3f88', strokeW: 12, shadow: 'rgba(90,20,70,0.6)' }).setDepth(55);
    banner.setFontStyle('italic 700'); goldText(banner);
    banner.x = -300;
    await tweenP(this, { targets: banner, x: W / 2, duration: 260, ease: 'Cubic.easeOut' });
    txt(this, W / 2, BY + (N * CELL) / 2 + 90, '3 moves of double materials', 28, { color: '#ffffff', stroke: '#c4417f', strokeW: 6 }).setDepth(55).setName('turboSub');
    await wait(this, 650);
    const sub = this.children.getByName('turboSub');
    this.tweens.add({ targets: [banner, sub], x: W + 400, duration: D(260), ease: 'Cubic.easeIn', onComplete: () => { banner.destroy(); if (sub) sub.destroy(); } });
    this.raceStripes.setAlpha(1);
    if (!RM) {
      this.stripeTween = this.tweens.add({ targets: this.raceStripes, alpha: 0.4, duration: 180, yoyo: true, repeat: -1 });
      this.lineTimer = this.time.addEvent({ delay: 70, loop: true, callback: () => this.spawnSpeedLine() });
    }
  }
  spawnSpeedLine() {
    const y = Phaser.Math.Between(BY, BY + N * CELL), len = Phaser.Math.Between(80, 240);
    const l = this.add.rectangle(W + len, y, len, Phaser.Math.Between(2, 5), Phaser.Math.RND.pick([0xffffff, 0xffd36b, 0xff8fc0]), 0.85).setBlendMode('ADD');
    this.speedLines.add(l);
    this.tweens.add({ targets: l, x: -len, duration: 260, onComplete: () => l.destroy() });
  }
  endTurbo() {
    this.turbo = 0; this.updateTurbo();
    if (this.stripeTween) { this.stripeTween.stop(); this.stripeTween = null; }
    if (this.lineTimer) { this.lineTimer.remove(); this.lineTimer = null; }
    this.tweens.add({ targets: this.raceStripes, alpha: 0, duration: D(300) });
  }

  // ---------------------------------------------------------- after move
  async afterMove() {
    if (this.turbo) { this.turbo--; this.updateTurbo(); if (!this.turbo) this.endTurbo(); }
    if (this.goalsMet()) { await this.floorComplete(); return; }
    if (!this.turbo && this.turboMeter >= 100) await this.startTurbo();
    if (G.mode !== 'relaxed' && this.moves <= 0) { this.outOfMoves(); return; }
    if (!this.findMoves().length) await this.shuffle();
    this.busy = false;
  }

  async shuffle() {
    G.stats.shuffles++;
    this.showPraise('Shuffle!');
    const pieces = []; this.g.forEach((row) => row.forEach((p) => pieces.push(p)));
    for (let tries = 0; tries < 100; tries++) {
      Phaser.Utils.Array.Shuffle(pieces);
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) this.g[r][c] = pieces[r * N + c];
      if (!this.findGroups().length && this.findMoves().length) break;
      if (tries > 60) { pieces.forEach((p) => { if (!p.special) { p.type = this.randType(); p.img.setTexture(p.type).setDisplaySize(74, 74); } }); }
    }
    const anims = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) anims.push(tweenP(this, { targets: this.g[r][c].c, x: this.cx(c), y: this.cy(r), duration: 420, ease: 'Cubic.easeInOut' }));
    await Promise.all(anims);
  }

  // ---------------------------------------------------------- overlays
  card(title, lines, buttons, opts = {}) {
    this.overlay = this.add.container(0, 0).setDepth(80);
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x4a1d47, opts.dim ?? 0.45).setInteractive();
    const ch = opts.h || 520, cw = 620;
    const key = canvasTex(this, 'card_' + ch, cw, ch, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(90,20,70,0.25)'; rr(ctx, 8, 14, w - 16, h - 16, 40); ctx.fill();
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fffaf5'); g.addColorStop(1, '#ffe4f0');
      ctx.fillStyle = g; rr(ctx, 4, 4, w - 8, h - 12, 38); ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 6, 6, w - 12, h - 16, 36); ctx.stroke();
    });
    const cy0 = opts.y || H / 2;
    const panel = this.add.image(W / 2, cy0, key);
    const items = [dim, panel];
    const top = cy0 - ch / 2;
    const tt = txt(this, W / 2, top + 70, title, opts.titleSize || 54, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 });
    goldText(tt); items.push(tt);
    let y = top + 140;
    lines.forEach((l) => {
      if (l.icons) {
        const n = l.icons.length; let x = W / 2 - ((n - 1) * 150) / 2;
        l.icons.forEach((ic) => { items.push(this.add.image(x - 34, y + 10, ic.k).setDisplaySize(58, 58)); items.push(txt(this, x + 20, y + 10, ic.t, 30, { color: '#5a2a55' })); x += 150; });
        y += 80; return;
      }
      const t = txt(this, W / 2, y, l.t, l.s || 28, { color: l.c || '#5a2a55', weight: l.w || '600', wrap: 540 });
      items.push(t); y += t.height + 12;
    });
    let by = top + ch - 70 - (buttons.length - 1) * 96;
    buttons.forEach((b) => { items.push(makeButton(this, W / 2, by, 420, 84, b.label, { fs: 32, c1: b.c1, c2: b.c2 }, () => { this.closeCard(); b.fn(); })); by += 96; });
    this.overlay.add(items);
    this.overlay.setAlpha(0); panel.setScale(0.85);
    this.tweens.add({ targets: this.overlay, alpha: 1, duration: D(200) });
    this.tweens.add({ targets: panel, scale: 1, duration: D(320), ease: 'Back.easeOut' });
    window.JOE.card = title;
  }
  closeCard() { if (this.overlay) { this.overlay.destroy(); this.overlay = null; window.JOE.card = null; } }

  floorIntro() {
    this.busy = true;
    const f = FLOORS[G.floor];
    const icons = Object.keys(f.goals).map((k) => ({ k, t: String(f.goals[k]) }));
    const lines = [
      { t: `Floor ${G.floor + 1}: ${f.name}`, s: 34, w: '700' },
      { t: 'Collect to remodel:', s: 24, c: '#8a3f78' },
      { icons },
      { t: G.mode === 'relaxed' ? 'Relaxed mode: take all the moves you like.' : `in ${f.moves} moves`, s: 24, c: '#8a3f78' },
      { t: f.tip, s: 24, c: '#b0447f' },
    ];
    this.card(G.floor === 0 ? 'Welcome, Joe!' : 'Next floor up!', lines, [{ label: "Let's Remodel", fn: () => { this.busy = false; this.lastInput = this.time.now; } }], { h: 580 });
  }

  async floorComplete() {
    this.busy = true; G.stats.floorsCleared++;
    if (this.turbo) this.endTurbo();
    let bonus = 0;
    if (G.mode !== 'relaxed' && this.moves > 0) { bonus = this.moves * 100; G.score += bonus; this.updateScore(); }
    await wait(this, 200);
    sfx(this, 'fanfare', { volume: 0.8 }); sfx(this, 'cheer', { volume: 0.7 });
    this.reveal = 1; this.tweens.killTweensOf(this); this.revealShown = Math.max(this.revealShown, 0.0);
    await tweenP(this, { targets: this, revealShown: 1, duration: 600, ease: 'Cubic.easeOut', onUpdate: () => this.drawReveal(this.revealShown) });
    this.drawReveal(1);
    this.doFlash(0.6);
    const stamp = txt(this, this.room.x + this.room.w / 2, this.room.y + this.room.h / 2, 'Remodeled!', 64, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 10, shadow: 'rgba(90,20,70,0.6)' }).setDepth(50);
    goldText(stamp); stamp.setScale(2.4).setAlpha(0).setAngle(-8);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: D(300), ease: 'Back.easeOut' });
    this.confetti.explode(RM ? 20 : 120, this.room.x + this.room.w / 2, this.room.y + this.room.h);
    if (!RM) this.time.delayedCall(D(300), () => this.confetti.explode(80, W / 2, BY + 200));
    await this.growTower(G.floor);
    await wait(this, 900);
    stamp.destroy();
    const done = G.floor;
    const saved = store.get('progress', { classic: 0, relaxed: 0 });
    saved[G.mode] = Math.min(7, Math.max(saved[G.mode] || 0, done + 1));
    if (done === 7) saved[G.mode] = 0;
    store.set('progress', saved); store.set('score_' + G.mode, G.score);
    let stars = 3;
    if (G.mode !== 'relaxed') { const r = this.moves / FLOORS[done].moves; stars = r >= 0.3 ? 3 : r >= 0.12 ? 2 : 1; }
    const lines = [
      { t: `${FLOORS[done].name} is done.`, s: 34, w: '700' },
      { t: G.mode === 'relaxed' ? 'Gorgeous work.' : `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`, s: 54, c: '#e8a33a', w: '700' },
      { t: bonus ? `Moves bonus: +${bonus.toLocaleString('en-US')}` : `Max cascade this game: ${G.stats.maxCombo}`, s: 26, c: '#8a3f78' },
      { t: `Score: ${G.score.toLocaleString('en-US')}`, s: 28 },
    ];
    if (done === 7) {
      this.card('Penthouse!', lines, [{ label: 'Open the Penthouse', fn: () => this.toFinale() }], { h: 500, y: 880, dim: 0.15 });
    } else {
      this.card('Floor Complete!', lines, [{ label: 'Up to the next floor', fn: () => this.nextFloor() }], { h: 500, y: 880, dim: 0.15 });
    }
  }
  nextFloor() {
    this.endTurbo();
    this.select(null);
    this.loadFloor(G.floor + 1, false);
  }
  toFinale() {
    this.cameras.main.fadeOut(D(500), 255, 240, 250);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Finale'));
  }
  outOfMoves() {
    this.busy = true;
    const f = FLOORS[G.floor];
    const left = Object.keys(f.goals).filter((k) => this.collected[k] < f.goals[k]).map((k) => ({ k, t: String(f.goals[k] - this.collected[k]) }));
    this.card('So close!', [{ t: 'Still needed:', s: 26, c: '#8a3f78' }, { icons: left }, { t: 'Birthday rules: take 5 more moves, on the house.', s: 24, c: '#b0447f' }], [
      { label: '+5 Moves', fn: () => { this.moves += 5; this.updateMoves(); this.busy = false; } },
      { label: 'Restart Floor', c1: '#c9b2ff', c2: '#9b6dff', fn: () => this.loadFloor(G.floor, false) },
    ], { h: 600 });
  }
}

// =====================================================================
class Finale extends Phaser.Scene {
  constructor() { super('Finale'); }
  create() {
    window.JOE.scene = this; window.JOE.sceneName = 'Finale';
    this.cameras.main.fadeIn(D(600), 255, 240, 250);
    this.add.image(W / 2, H / 2, 'bg');
    const art = this.add.image(W / 2, H + 60, 'title').setOrigin(0.5, 1);
    art.setScale(Math.max(W / art.width, H / art.height) * 1.02);
    canvasTex(this, 'veil2', W, H, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 520); g.addColorStop(0, 'rgba(255,240,248,0.95)'); g.addColorStop(1, 'rgba(255,240,248,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
      const g2 = ctx.createLinearGradient(0, H - 380, 0, H); g2.addColorStop(0, 'rgba(255,236,246,0)'); g2.addColorStop(0.5, 'rgba(255,236,246,0.9)'); g2.addColorStop(1, 'rgba(255,236,246,1)');
      ctx.fillStyle = g2; ctx.fillRect(0, H - 380, W, 380);
    });
    this.add.image(W / 2, H / 2, 'veil2');
    G.muted || startMusic(this);
    sfx(this, 'finale', { volume: 0.85 });

    // H+B monogram medallion
    canvasTex(this, 'medal', 220, 220, (ctx) => {
      ctx.fillStyle = goldGrad(ctx, 0, 220); ctx.beginPath(); ctx.arc(110, 110, 104, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, '#fff3f8'); g.addColorStop(1, '#ffd0e4');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(110, 110, 90, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(201,138,44,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(110, 110, 80, 0, Math.PI * 2); ctx.stroke();
    });
    const medal = this.add.container(W / 2, 360);
    medal.add(this.add.image(0, 0, 'medal'));
    const mono = txt(this, 0, 4, 'H+B', 64, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 6 }); goldText(mono); medal.add(mono);
    medal.setScale(0);
    this.tweens.add({ targets: medal, scale: 1, duration: D(700), delay: D(500), ease: 'Back.easeOut' });

    const t1 = txt(this, W / 2, 100, 'Here\'s to you,', 58, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8, shadow: 'rgba(160,40,110,0.4)' });
    const t2 = txt(this, W / 2, 190, 'Joe!', 110, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 10, shadow: 'rgba(160,40,110,0.4)' });
    goldText(t1); goldText(t2);
    [t1, t2].forEach((t, i) => { t.setAlpha(0).setY(t.y - 40); this.tweens.add({ targets: t, alpha: 1, y: t.y + 40, duration: D(600), delay: D(200 + i * 200), ease: 'Back.easeOut' }); });
    const pill = this.add.graphics(); pill.fillStyle(0xfff4f8, 0.88); pill.fillRoundedRect(W / 2 - 300, 470, 600, 104, 30); pill.lineStyle(3, 0xe9b94a, 1); pill.strokeRoundedRect(W / 2 - 300, 470, 600, 104, 30);
    pill.fillStyle(0xfff4f8, 0.88); pill.fillRoundedRect(W / 2 - 220, H - 318, 440, 56, 28);
    pill.setAlpha(0); this.tweens.add({ targets: pill, alpha: 1, duration: D(800), delay: D(1100) });
    const lines = txt(this, W / 2, 522, 'The penthouse is open.\n29 years and every floor, together.', 30, { color: '#6b3466', weight: '600' });
    lines.setAlpha(0); this.tweens.add({ targets: lines, alpha: 1, duration: D(800), delay: D(1200) });
    txt(this, W / 2, H - 290, `Final score: ${G.score.toLocaleString('en-US')}`, 30, { color: '#8a3f78', weight: '600' });

    const conf = this.add.particles(0, 0, 'confetti', { x: { min: 0, max: W }, y: -20, lifespan: 5000, speedY: { min: 120, max: 260 }, speedX: { min: -60, max: 60 }, rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.6 }, frequency: RM ? 400 : 40, tint: [0xff7eb6, 0xffd36b, 0x7fe0c0, 0xb49bff, 0x8fd0ff, 0xffffff] });
    if (!RM) this.add.particles(0, 0, 'spark', { x: { min: 80, max: W - 80 }, y: { min: 250, max: 1000 }, lifespan: 1200, scale: { start: 1, end: 0 }, frequency: 90, blendMode: 'ADD', tint: [0xffffff, 0xffe28a, 0xffb3d9] });
    this.time.delayedCall(D(400), () => sfx(this, 'cheer', { volume: 0.6 }));

    makeButton(this, W / 2, H - 200, 440, 90, 'Play Again', { fs: 36 }, () => { G.score = 0; G.floor = 0; this.scene.start('Title'); });
    makeButton(this, W / 2, H - 92, 440, 80, 'Relaxed Mode', { fs: 30, c1: '#c9b2ff', c2: '#9b6dff' }, () => { G.mode = 'relaxed'; G.floor = 0; G.score = 0; this.scene.start('Game'); });
    window.JOE.ready = true; window.JOE.finale = true;
  }
}

window.JOE.state = () => {
  const s = window.JOE.scene, name = window.JOE.sceneName;
  if (!s || name !== 'Game' || !s.g || !s.g.length) return { scene: name, finale: !!window.JOE.finale };
  return {
    scene: name, floor: G.floor, mode: G.mode, busy: !!s.busy, overlay: !!s.overlay, card: window.JOE.card || null,
    moves: s.moves, collected: Object.assign({}, s.collected), goals: FLOORS[G.floor].goals, reveal: s.reveal,
    grid: s.g.map((row) => row.map((p) => (p ? (p.special ? p.special + ':' + p.type : p.type) : null))),
    tower: window.JOE.towerFloors, turbo: s.turbo, turboMeter: s.turboMeter, score: G.score, stats: Object.assign({}, G.stats),
    board: { BX, BY, CELL, N, W, H },
  };
};
window.JOE.moves = () => { const s = window.JOE.scene; return s && s.findMoves ? s.findMoves() : []; };

// =====================================================================
function boot() {
  const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: W, height: H,
    backgroundColor: '#ffe4ef',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    audio: { disableWebAudio: false },
    scene: [Boot, Title, Game, Finale],
  };
  window.JOE.game = new Phaser.Game(config);
}
const fontsReady = (document.fonts && document.fonts.load)
  ? Promise.race([Promise.all([document.fonts.load('700 40px Fredoka'), document.fonts.load('600 40px Fredoka'), document.fonts.load('400 40px Pacifico')]), new Promise((r) => setTimeout(r, 2500))])
  : Promise.resolve();
fontsReady.then(boot, boot);
})();
