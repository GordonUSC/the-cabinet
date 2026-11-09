/* Joe's Tower v2: an original match-3 remodel game for Joe Heally. Phaser 3.90. */
(() => {
'use strict';

// Darby fills this with Gordon's own words for the penthouse. Renders only if non-empty.
const PENTHOUSE_NOTE = 'Everywhere I go, Every smile i see, I know you are there,  smiling back at me .';

const W = 720, H = 1280;
const WIDE = (window.innerWidth / Math.max(1, window.innerHeight)) > 1.15;
const GW = WIDE ? 1760 : W;
const OX = (GW - W) / 2;
const N = 8, CELL = 85, BX = 20, BY = 538;
const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const PARAMS = new URLSearchParams(location.search);
const SPEED = Math.max(1, Math.min(10, parseFloat(PARAMS.get('speed')) || 1));
const D = (ms) => Math.max(1, ms / SPEED);

const TYPES = ['tile', 'paint', 'wood', 'glass', 'gold', 'velvet'];
const MAT = {
  tile: { name: 'Tile', color: 0x2fd08a }, paint: { name: 'Paint', color: 0xff4d6d }, wood: { name: 'Wood', color: 0xf2a03d },
  glass: { name: 'Glass', color: 0x4aa8ff }, gold: { name: 'Gold', color: 0xffc83d }, velvet: { name: 'Velvet', color: 0x9b5cff },
  cloth: { name: 'Drop cloth', color: 0xf3e6d4 },
};
const STYLE_IDS = ['glam', 'regency', 'mid'];
const PERKS = {
  glam: { name: 'Disco Glam', perk: 'TURBO charges 30% faster', icon: 'disco' },
  regency: { name: 'Hollywood Regency', perk: '+2 moves (or +8 seconds) on every later floor', icon: 'regbadge' },
  mid: { name: 'Mid-Century', perk: 'Start each later floor with a Power Drill (stacks up to 3)', icon: 'drill' },
};
function perkSummary(p) {
  const out = [];
  if (p.glam) out.push(`TURBO x${(1 + 0.3 * p.glam).toFixed(1)}`);
  if (p.regency) out.push(`+${p.regency * 2} moves`);
  if (p.mid) out.push(`${Math.min(3, p.mid)} starting drill${Math.min(3, p.mid) > 1 ? 's' : ''}`);
  return out.join(', ');
}
const FLOORS = [
  { key: 'lobby', name: 'The Lobby', goals: { tile: 10 }, moves: 20, tip: 'Swipe two neighbors to line up 3.', turboRate: 1.6 },
  { key: 'hallbath', name: 'The Hall Bath', goals: { paint: 12, glass: 9 }, moves: 22, tip: 'Your own hall bath: pink time capsule to calm spa.', turboRate: 2.4,
    styleNames: { glam: 'Sage Spa', regency: 'Greige Spa', mid: 'Warm White Spa' }, styleFiles: { glam: 'hallbath_sage', regency: 'hallbath_greige', mid: 'hallbath_white' } },
  { key: 'kitchen', name: 'The Kitchen', goals: { paint: 14, tile: 12 }, moves: 24, tip: 'Match 5 in a row for a Disco Ball.', turboRate: 1.3 },
  { key: 'living', name: 'The Living Room', goals: { velvet: 16, wood: 12, cloth: 6 }, moves: 28, tip: 'New: drop cloths. Match on top of them to lift them.', cloths: 6 },
  { key: 'gallery', name: 'The Collection', goals: { glass: 14, gold: 14, cloth: 8 }, moves: 26, tip: 'Specials and big cascades can drop treasures for your shelf.', cloths: 8 },
  { key: 'suite', name: 'The Suite', goals: { velvet: 16, paint: 14, cloth: 6 }, time: 90, tip: 'INSPECTION DAY: no move limit, but beat the clock!', cloths: 6, boss: true },
  { key: 'ballroom', name: 'The Ballroom', goals: { gold: 18, glass: 14, cloth: 10 }, moves: 28, tip: 'Swap two specials together for a Mega Combo.', cloths: 10 },
  { key: 'penthouse', name: 'The Penthouse', goals: { gold: 20, paint: 16, wood: 14 }, moves: 30, tip: 'Top floor. Midnight is waiting on the roof.' },
  { key: 'dome', name: 'The Starlight Dome', goals: { gold: 15, glass: 15, velvet: 12, cloth: 8 }, moves: 30, tip: 'The secret floor your treasures unlocked.', cloths: 8, secret: true },
];
const MAIN_FLOORS = 8;
const SECRET_NEED = 6;
const ITEMS = [
  { id: 'snowglobe', name: 'Snow Globe', cat: 'Glass', story: 'A tiny winter that never melts.' },
  { id: 'record', name: 'Disco Record', cat: 'Music', story: 'Side B is the one everybody dances to.' },
  { id: 'top', name: 'Spinning Top', cat: 'Toys', story: 'Still spins like it is brand new.' },
  { id: 'car', name: 'Tin Coupe', cat: 'Toys', story: 'A little teal coupe with chrome hubcaps.' },
  { id: 'swan', name: 'Glass Swan', cat: 'Glass', story: 'Catches the light from every angle.' },
  { id: 'musicbox', name: 'Music Box', cat: 'Music', story: 'Wind it up for a tiny waltz.' },
  { id: 'teacup', name: 'Gilded Teacup', cat: 'Home', story: 'Gold rim, perfect for one cup.' },
  { id: 'gem', name: 'Crystal Paperweight', cat: 'Glass', story: 'Holds down the important papers.' },
  { id: 'duck', name: 'Rubber Duck', cat: 'Home', story: 'Every spa bath needs one.' },
  { id: 'camera', name: 'Vintage Camera', cat: 'Keepsakes', story: 'Twelve frames of a good day.' },
  { id: 'lamp', name: 'Lava Lamp', cat: 'Home', story: 'Slow pink bubbles, all night long.' },
  { id: 'cameo', name: 'Cameo Brooch', cat: 'Keepsakes', story: 'A classic profile in rose and cream.' },
];
const ACH = [
  { id: 'opening', name: 'Opening Night', desc: 'Remodel your first floor' },
  { id: 'chain', name: 'Chain Reaction', desc: 'Cascade 4 times in one move' },
  { id: 'mirror', name: 'Mirror Ball', desc: 'Make a Disco Ball' },
  { id: 'mega', name: 'Mega Combo', desc: 'Swap two specials together' },
  { id: 'throttle', name: 'Full Throttle', desc: 'Fire up TURBO' },
  { id: 'designer', name: 'Designer Eye', desc: 'Pick all three decor styles' },
  { id: 'cloth', name: 'Drop Cloth Pro', desc: 'Lift 20 drop cloths' },
  { id: 'inspect', name: 'Inspection Passed', desc: 'Beat the clock on Inspection Day' },
  { id: 'collector', name: 'Collector', desc: 'Shelve 6 treasures' },
  { id: 'fullshelf', name: 'Full Shelf', desc: 'Shelve all 12 treasures' },
  { id: 'midnight', name: 'Midnight on the Roof', desc: 'Reach the penthouse countdown' },
  { id: 'starlight', name: 'Starlight', desc: 'Remodel the secret floor' },
  { id: 'stars20', name: 'Star Power', desc: 'Earn 20 stars' },
  { id: 'duel', name: 'Pass the Phone', desc: 'Finish a duel' },
];
const PRAISE = ['Nice!', 'Sweet!', 'Fabulous!', 'Gorgeous!', 'Iconic!', 'Showstopper!', 'Legendary!', 'Penthouse Level!'];

// ---------- persistence (always guarded)
const store = {
  get(k, d) { try { const v = localStorage.getItem('joeTower2.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('joeTower2.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
function freshRun() { return { floor: 0, score: 0, perks: { glam: 0, regency: 0, mid: 0 }, styles: {} }; }
const META = {
  items: store.get('items', {}), favs: store.get('favs', {}), ach: store.get('ach', {}),
  stars: store.get('stars', {}), stylesUsed: store.get('stylesUsed', {}), clothTotal: store.get('clothTotal', 0),
  duelBest: store.get('duelBest', {}),
};
function saveMeta() { Object.keys(META).forEach((k) => store.set(k, META[k])); }
const G = {
  mode: 'classic', run: freshRun(), muted: store.get('muted', false), duel: null,
  stats: { swaps: 0, invalid: 0, cascades: 0, maxCombo: 0, specialsMade: 0, specialsFired: 0, turbos: 0, floorsCleared: 0, shuffles: 0, drops: 0, decorPicks: 0 },
  t: {}, // first-time timestamps (ms since first game start)
};
let T0 = null;
function mark(k) { if (T0 === null) return; if (G.t[k] === undefined) G.t[k] = Math.round(performance.now() - T0); }
window.JOE = { G, META, FLOORS, scene: null, ready: false, GW, OX };

function itemCount() { return Object.keys(META.items).length; }
function starTotal() { return Object.values(META.stars).reduce((a, b) => a + b, 0); }

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
function panelTex(scene, key, w, h, r, a) {
  return canvasTex(scene, key, w, h, (ctx) => {
    ctx.fillStyle = 'rgba(140,50,100,0.16)'; rr(ctx, 4, 10, w - 8, h - 10, r); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(255,250,245,${a})`); g.addColorStop(1, `rgba(255,228,240,${a})`);
    ctx.fillStyle = g; rr(ctx, 2, 2, w - 4, h - 10, r); ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 3, 3, w - 6, h - 12, r - 1); ctx.stroke();
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
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let RNG = Math.random;

function roomTex(i, style) {
  const f = FLOORS[i];
  if (f.secret) return 'dome_glam';
  if (f.styleFiles) return f.styleFiles[style || 'glam'];
  return f.key + '_' + (style || 'glam');
}
function styleName(i, s) { const f = FLOORS[i]; return (f.styleNames && f.styleNames[s]) || PERKS[s].name; }

// ---------- shared textures + scene setup
function makeSharedTextures(scene) {
  canvasTex(scene, 'bg', GW, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, GW * 0.4, H);
    g.addColorStop(0, '#ffe6f0'); g.addColorStop(0.45, '#ffdcca'); g.addColorStop(1, '#e8d5ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, GW, H);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 7 + (WIDE ? 6 : 0); i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe9b0';
      ctx.beginPath(); ctx.moveTo(GW * 0.5, -60); ctx.lineTo(-200 + i * 190, H); ctx.lineTo(-120 + i * 190, H); ctx.closePath(); ctx.fill();
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
  canvasTex(scene, 'cloth', 84, 84, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(246,236,220,0.7)'); g.addColorStop(1, 'rgba(214,196,174,0.76)');
    ctx.fillStyle = 'rgba(60,30,50,0.28)'; rr(ctx, 2, 4, w - 4, h - 4, 14); ctx.fill();
    ctx.fillStyle = g; rr(ctx, 3, 3, w - 6, h - 7, 14); ctx.fill();
    ctx.strokeStyle = 'rgba(150,120,95,0.55)'; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(12 + i * 18, 10); ctx.quadraticCurveTo(22 + i * 18, 42, 10 + i * 18, h - 8); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(170,130,100,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); rr(ctx, 7, 7, w - 14, h - 15, 11); ctx.stroke(); ctx.setLineDash([]);
    const tape = (x, y, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(255,214,120,0.95)'; ctx.fillRect(-15, -6, 30, 12); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-15, -6, 30, 4); ctx.restore(); };
    tape(12, 12, -0.75); tape(w - 12, 12, 0.75); tape(12, h - 14, 0.75); tape(w - 12, h - 14, -0.75);
    ctx.fillStyle = '#e0306f'; ctx.beginPath(); ctx.arc(w / 2, 14, 6, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(w / 2 - 2, 12, 2, 0, 7); ctx.fill();
  });
  canvasTex(scene, 'regbadge', 96, 96, (ctx, w, h) => {
    ctx.fillStyle = goldGrad(ctx, 0, h); ctx.beginPath(); ctx.arc(48, 48, 44, 0, 7); ctx.fill();
    ctx.fillStyle = '#145c45'; ctx.beginPath(); ctx.arc(48, 48, 36, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 40px Fredoka'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+2', 48, 50);
  });
  if (!scene.anims.exists('discospin') && scene.textures.exists('disco_spin')) {
    scene.anims.create({ key: 'discospin', frames: scene.anims.generateFrameNumbers('disco_spin', { start: 0, end: 15 }), frameRate: 12, repeat: -1 });
  }
}
function setupScene(scene) {
  scene.cameras.main.setScroll(-OX, 0);
  scene.add.image(W / 2, H / 2, 'bg');
}

// ---------- meta: achievements, items, toasts
function toast(scene, title, sub, icon) {
  const c = scene.add.container(W / 2, -80).setDepth(95);
  const key = panelTex(scene, 'toastbg', 600, 104, 40, 0.97);
  c.add(scene.add.image(0, 0, key));
  if (icon) c.add(scene.add.image(-240, -4, icon).setDisplaySize(70, 70));
  c.add(txt(scene, icon ? 30 : 0, -22, title, 26, { color: '#c4417f' }));
  c.add(txt(scene, icon ? 30 : 0, 14, sub, 22, { color: '#5a2a55', weight: '600', wrap: 460 }));
  const q = scene.toastQ || (scene.toastQ = []);
  q.push(c); c.setVisible(false);
  const run = () => {
    const item = q[0]; if (!item || item.running) return; item.running = true; item.setVisible(true);
    scene.tweens.add({ targets: item, y: scene.scene.key === 'Game' ? 160 : 70, duration: D(320), ease: 'Back.easeOut', onComplete: () => {
      scene.time.delayedCall(D(1700), () => scene.tweens.add({ targets: item, y: -90, duration: D(260), onComplete: () => { item.destroy(); q.shift(); run(); } }));
    } });
  };
  run();
}
function unlock(scene, id) {
  if (META.ach[id]) return;
  META.ach[id] = Date.now(); saveMeta();
  const a = ACH.find((x) => x.id === id);
  sfx(scene, 'chime2', { volume: 0.6, rate: 1.5 });
  toast(scene, 'Achievement: ' + a.name, a.desc, null);
  if (scene.refreshSide) scene.refreshSide();
}
function checkMetaAch(scene) {
  const n = itemCount();
  if (n >= 6) unlock(scene, 'collector');
  if (n >= 12) unlock(scene, 'fullshelf');
  if (starTotal() >= 20) unlock(scene, 'stars20');
  if (META.clothTotal >= 20) unlock(scene, 'cloth');
  if (STYLE_IDS.every((s) => META.stylesUsed[s])) unlock(scene, 'designer');
}
function rollItem() {
  const unowned = ITEMS.filter((it) => !META.items[it.id]);
  if (unowned.length && RNG() < 0.85) return unowned[Math.floor(RNG() * unowned.length)];
  return ITEMS[Math.floor(RNG() * ITEMS.length)];
}

// ---------- shelf (Joe's Collection) used as overlay and side panel
function drawShelf(scene, x, y, w, onPick) {
  const cols = 3, rows = 4, cw = w / cols, chh = cw * 0.92;
  const c = scene.add.container(x, y);
  const key = canvasTex(scene, 'shelf_' + Math.round(w), Math.round(w), Math.round(rows * chh + 20), (ctx, ww, hh) => {
    const g = ctx.createLinearGradient(0, 0, 0, hh); g.addColorStop(0, '#5b2f55'); g.addColorStop(1, '#3d1f3e');
    ctx.fillStyle = g; rr(ctx, 0, 0, ww, hh, 24); ctx.fill();
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const nx = k * cw + 8, ny = r * chh + 10, nw = cw - 16, nh = chh - 14;
      const lg = ctx.createRadialGradient(nx + nw / 2, ny + 10, 4, nx + nw / 2, ny + nh / 2, nw * 0.8);
      lg.addColorStop(0, 'rgba(255,236,190,0.95)'); lg.addColorStop(1, 'rgba(255,190,220,0.35)');
      ctx.fillStyle = lg; rr(ctx, nx, ny, nw, nh, 16); ctx.fill();
      ctx.fillStyle = goldGrad(ctx, ny + nh - 10, ny + nh); ctx.fillRect(nx, ny + nh - 8, nw, 8);
    }
    ctx.lineWidth = 4; ctx.strokeStyle = goldGrad(ctx, 0, hh); rr(ctx, 2, 2, ww - 4, hh - 4, 22); ctx.stroke();
  });
  c.add(scene.add.image(0, 0, key).setOrigin(0, 0));
  ITEMS.forEach((it, i) => {
    const k = i % cols, r = Math.floor(i / cols);
    const cx = k * cw + cw / 2, cy = r * chh + 10 + (chh - 14) / 2 - 4;
    const owned = !!META.items[it.id];
    const im = scene.add.image(cx, cy, 'it_' + it.id).setDisplaySize(cw * 0.62, cw * 0.62);
    if (!owned) im.setTint(0x3a1f3a).setAlpha(0.55);
    c.add(im);
    if (owned && META.favs[it.id]) c.add(txt(scene, cx + cw * 0.3, cy - chh * 0.3, '♥', Math.round(cw * 0.2), { color: '#ff4f93' }));
    if (onPick) { im.setInteractive({ useHandCursor: true }); im.on('pointerdown', () => onPick(it, owned)); }
  });
  c.h = rows * chh + 20;
  return c;
}

function openShelf(scene) {
  if (scene.overlay) return;
  scene.overlay = scene.add.container(0, 0).setDepth(85);
  const dim = scene.add.rectangle(W / 2, H / 2, GW, H, 0x2e1230, 0.6).setInteractive();
  scene.overlay.add(dim);
  const key = panelTex(scene, 'shelfpanel', 660, 1180, 40, 0.98);
  scene.overlay.add(scene.add.image(W / 2, H / 2, key));
  const t = txt(scene, W / 2, 110, "Joe's Collection", 54, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 }); goldText(t);
  scene.overlay.add(t);
  const favN = Object.keys(META.favs).filter((k) => META.favs[k] && META.items[k]).length;
  scene.overlay.add(txt(scene, W / 2, 168, `${itemCount()} of 12 treasures   ♥ ${favN} favorites   tap one to see it`, 22, { color: '#8a3f78', weight: '600' }));
  const detail = scene.add.container(0, 0); scene.overlay.add(detail);
  const show = (it, owned) => {
    detail.removeAll(true);
    detail.add(scene.add.image(W / 2 - 200, 1020, owned ? 'it_' + it.id : 'it_' + it.id).setDisplaySize(130, 130).setTint(owned ? 0xffffff : 0x3a1f3a));
    detail.add(txt(scene, W / 2 - 110, 975, owned ? it.name : 'Not found yet', 30, { ox: 0 }));
    detail.add(txt(scene, W / 2 - 110, 1015, owned ? `${it.cat}  •  ${it.story}` : 'Fire specials and chain cascades to find it.', 20, { ox: 0, color: '#8a3f78', weight: '600', wrap: 380, align: 'left' }));
    if (owned) {
      const fav = txt(scene, W / 2 - 110, 1070, META.favs[it.id] ? '♥ Favorite' : '♡ Make favorite', 24, { ox: 0, color: '#ff4f93' }).setInteractive({ useHandCursor: true });
      fav.on('pointerdown', () => { META.favs[it.id] = !META.favs[it.id]; saveMeta(); fav.setText(META.favs[it.id] ? '♥ Favorite' : '♡ Make favorite'); });
      detail.add(fav);
    }
  };
  const shelf = drawShelf(scene, W / 2 - 290, 200, 580, show);
  scene.overlay.add(shelf);
  const first = ITEMS.find((it) => META.items[it.id]);
  if (first) show(first, true); else show(ITEMS[0], false);
  scene.overlay.add(makeButton(scene, W / 2, 1160, 300, 70, 'Close', { fs: 28, c1: '#c9b2ff', c2: '#9b6dff' }, () => { scene.overlay.destroy(); scene.overlay = null; if (scene.afterShelf) scene.afterShelf(); }));
  window.JOE.card = 'Collection';
}

// ---------- share card (Socializer)
function shareCard(scene) {
  try {
    const cw = 1080, chh = 1350, cv = document.createElement('canvas'); cv.width = cw; cv.height = chh;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, cw * 0.4, chh); g.addColorStop(0, '#ffe6f0'); g.addColorStop(0.5, '#ffdcca'); g.addColorStop(1, '#e8d5ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, cw, chh);
    const src = (k) => scene.textures.exists(k) ? scene.textures.get(k).getSourceImage() : null;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c4417f'; ctx.font = '400 110px Pacifico'; ctx.fillText("Joe's Tower", cw / 2, 150);
    const run = G.run; const built = Math.min(MAIN_FLOORS, Math.max(run.floor, store.get('bestFloor', 0)));
    const tw = 330, th = 917, tx = 60, ty = 230;
    [src('t_base')].concat([...Array(built)].map((_, i) => src('t_floor' + i))).forEach((im) => { if (im) ctx.drawImage(im, tx, ty, tw, th); });
    if (built >= MAIN_FLOORS && src('t_crown8')) ctx.drawImage(src('t_crown8'), tx, ty, tw, th);
    ctx.textAlign = 'left'; ctx.fillStyle = '#5a2a55'; ctx.font = '700 54px Fredoka';
    ctx.fillText(`${built} of 8 floors`, 430, 300);
    ctx.fillStyle = '#e0952f'; ctx.fillText(`★ ${starTotal()} stars`, 430, 380);
    ctx.fillStyle = '#5a2a55'; ctx.fillText(`${itemCount()} of 12 treasures`, 430, 460);
    // favorite room: best-starred, latest
    let fav = 0, best = -1;
    FLOORS.forEach((f, i) => { const s = META.stars[f.key] || 0; if (s >= best && s > 0) { best = s; fav = i; } });
    const favStyle = run.styles[FLOORS[fav].key] || 'glam';
    const rim = src(roomTex(fav, favStyle));
    ctx.font = '600 36px Fredoka'; ctx.fillStyle = '#8a3f78'; ctx.fillText('Favorite room: ' + FLOORS[fav].name, 430, 540);
    if (rim) { ctx.save(); rr(ctx, 430, 570, 600, 403, 30); ctx.clip(); ctx.drawImage(rim, 430, 570, 600, 403); ctx.restore(); ctx.lineWidth = 8; ctx.strokeStyle = '#e9b94a'; rr(ctx, 430, 570, 600, 403, 30); ctx.stroke(); }
    const favItems = ITEMS.filter((it) => META.items[it.id]).sort((a, b) => (META.favs[b.id] ? 1 : 0) - (META.favs[a.id] ? 1 : 0)).slice(0, 5);
    favItems.forEach((it, i) => { const im = src('it_' + it.id); if (im) ctx.drawImage(im, 430 + i * 120, 1010, 110, 110); });
    ctx.textAlign = 'center'; ctx.fillStyle = '#c4417f'; ctx.font = '400 64px Pacifico'; ctx.fillText('H+B', cw / 2, 1260);
    ctx.font = '600 28px Fredoka'; ctx.fillStyle = '#8a3f78'; ctx.fillText('since 1998', cw / 2, 1305);
    window.JOE.lastShareCanvas = cv;
    cv.toBlob(async (blob) => {
      if (!blob) return;
      window.JOE.lastShare = { w: cw, h: chh, bytes: blob.size };
      const file = new File([blob], 'joes-tower.png', { type: 'image/png' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] }) && !PARAMS.get('noshare')) { await navigator.share({ files: [file], title: "Joe's Tower" }); return; }
      } catch (e) { /* cancelled */ }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'joes-tower.png';
      if (!PARAMS.get('noshare')) a.click();
      toast(scene, 'Share card ready', 'Saved as joes-tower.png', null);
    }, 'image/png');
  } catch (e) { console.warn('share failed', e); }
}

// ---------- desktop side panels
function buildSidePanels(scene) {
  if (!WIDE) return;
  const lx = -OX + 30, lw = OX - 60, rx = W + 30, rw = OX - 60;
  const left = scene.add.container(0, 0).setDepth(5), right = scene.add.container(0, 0).setDepth(5);
  scene.side = { left, right };
  const build = () => {
    left.removeAll(true); right.removeAll(true);
    left.add(scene.add.image(lx + lw / 2, H / 2, panelTex(scene, 'sidep', Math.round(lw), H - 60, 40, 0.75)));
    const ht = txt(scene, lx + lw / 2, 90, 'The Tower', 54, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 }); goldText(ht); left.add(ht);
    const built = scene.towerBuilt !== undefined ? scene.towerBuilt : Math.min(MAIN_FLOORS + 1, G.run.floor);
    const sc = Math.min(lw / 360, 1000 / 1000) * 0.98, tyC = 690;
    left.add(scene.add.image(lx + lw / 2, tyC, 't_base').setScale(sc));
    for (let i = built + 1; i < MAIN_FLOORS; i++) left.add(scene.add.image(lx + lw / 2, tyC, 't_floor' + i).setScale(sc).setTintFill(0x9a5a8c).setAlpha(0.12));
    for (let i = 0; i < built && i < 9; i++) left.add(scene.add.image(lx + lw / 2, tyC, 't_floor' + i).setScale(sc));
    if (built < 9) { const gh = scene.add.image(lx + lw / 2, tyC, 't_floor' + Math.min(8, built)).setScale(sc).setTintFill(0x9a5a8c).setAlpha(0.3); left.add(gh); if (!RM) scene.tweens.add({ targets: gh, alpha: 0.12, duration: 700, yoyo: true, repeat: -1 }); }
    if (built >= MAIN_FLOORS) left.add(scene.add.image(lx + lw / 2, tyC, built >= 9 ? 't_crown9' : 't_crown8').setScale(sc));
    left.add(txt(scene, lx + lw / 2, 150, `★ ${starTotal()} stars   ${Object.keys(META.ach).length}/${ACH.length} achievements`, 26, { color: '#8a3f78', weight: '600' }));
    scene.sideTowerGeom = { x: lx + lw / 2, y: tyC, sc };

    right.add(scene.add.image(rx + rw / 2, H / 2, 'sidep'));
    const rt = txt(scene, rx + rw / 2, 90, "Joe's Collection", 50, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 }); goldText(rt); right.add(rt);
    right.add(txt(scene, rx + rw / 2, 150, `${itemCount()} of 12 treasures`, 26, { color: '#8a3f78', weight: '600' }));
    const sh = drawShelf(scene, rx + 30, 180, rw - 60, () => openShelf(scene)); right.add(sh);
    const p = G.run.perks;
    const lines = [];
    if (p.glam) lines.push(`TURBO +${p.glam * 30}%`); if (p.regency) lines.push(`+${p.regency * 2} moves`); if (p.mid) lines.push(`${Math.min(3, p.mid)} starting drill${p.mid > 1 ? 's' : ''}`);
    right.add(txt(scene, rx + rw / 2, 180 + sh.h + 40, 'Decor perks', 28, { color: '#c4417f' }));
    right.add(txt(scene, rx + rw / 2, 180 + sh.h + 80, lines.length ? lines.join('   ') : 'Pick a decor style after a floor to earn one', 22, { color: '#5a2a55', weight: '600', wrap: rw - 40 }));
    right.add(makeButton(scene, rx + rw / 2, H - 130, 320, 76, 'Share Card', { fs: 30, c1: '#ffd38f', c2: '#f3a64a' }, () => shareCard(scene)));
  };
  build();
  scene.refreshSide = build;
}

// =====================================================================
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const msg = document.getElementById('loadmsg');
    this.load.on('progress', (p) => { if (msg) msg.textContent = 'Polishing the chrome... ' + Math.round(p * 100) + '%'; });
    this.load.on('loaderror', (f) => console.warn('asset failed', f && f.key));
    TYPES.concat(['disco', 'wreck', 'drill']).forEach((k) => this.load.image(k, 'assets/tiles/' + k + '.webp'));
    this.load.spritesheet('disco_spin', 'assets/tiles/disco_spin.webp', { frameWidth: 144, frameHeight: 144 });
    ITEMS.forEach((it) => this.load.image('it_' + it.id, 'assets/items/' + it.id + '.webp'));
    ['base', 'crown8', 'crown9'].concat([...Array(9)].map((_, i) => 'floor' + i)).forEach((k) => this.load.image('t_' + k, 'assets/tower/' + k + '.webp'));
    FLOORS.forEach((f) => {
      this.load.image(f.key + '_before', 'assets/img/' + f.key + '_before.jpg');
      if (f.secret) this.load.image('dome_glam', 'assets/img/dome_glam.jpg');
      else STYLE_IDS.forEach((s) => { const k = roomTex(FLOORS.indexOf(f), s); this.load.image(k, 'assets/img/' + k + '.jpg'); });
    });
    this.load.image('title', 'assets/img/title2.jpg');
    this.load.image('nye', 'assets/img/penthouse_nye.jpg');
    ['chime', 'chime2', 'swap', 'bonk', 'drill', 'wreck', 'turbo', 'cheer', 'fanfare', 'finale'].forEach((k) => this.load.audio(k, 'assets/audio/' + k + '.mp3'));
    this.load.audio('music', 'assets/audio/music.mp3');
  }
  create() {
    makeSharedTextures(this);
    const l = document.getElementById('loading'); if (l) l.remove();
    const start = PARAMS.get('start');
    if (start === 'finale') { G.run = store.get('run_classic', null) || store.get('run_relaxed', null) || freshRun(); this.scene.start('Finale'); return; }
    this.scene.start('Title');
  }
}

// =====================================================================
class Title extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    window.JOE.scene = this; window.JOE.sceneName = 'Title'; window.JOE.card = null;
    setupScene(this);
    const art = this.add.image(W / 2, H, 'title').setOrigin(0.5, 1);
    art.setScale(Math.max(W / art.width, H / art.height));
    canvasTex(this, 'veil', W, H, (ctx) => {
      let g = ctx.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(255,240,248,0.92)'); g.addColorStop(1, 'rgba(255,240,248,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, 420);
      g = ctx.createLinearGradient(0, H - 520, 0, H); g.addColorStop(0, 'rgba(255,236,246,0)'); g.addColorStop(0.4, 'rgba(255,236,246,0.85)'); g.addColorStop(1, 'rgba(255,236,246,0.97)');
      ctx.fillStyle = g; ctx.fillRect(0, H - 520, W, 520);
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

    const runs = { classic: store.get('run_classic', null), relaxed: store.get('run_relaxed', null) };
    const go = (mode, fresh) => {
      G.mode = mode; G.duel = null; RNG = Math.random;
      G.run = (!fresh && runs[mode]) ? runs[mode] : freshRun();
      if (T0 === null) T0 = performance.now();
      startMusic(this);
      this.cameras.main.fadeOut(D(250), 255, 230, 240);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game'));
    };
    let y = H - 400;
    const cont = runs.classic && runs.classic.floor > 0;
    this.btnPlay = makeButton(this, W / 2, y, 460, 104, cont ? `Continue: Floor ${runs.classic.floor + 1}` : 'Play', { fs: 46 }, () => go('classic', false));
    y += 118;
    this.btnRelax = makeButton(this, W / 2, y, 460, 82, runs.relaxed && runs.relaxed.floor > 0 ? `Relaxed: Floor ${runs.relaxed.floor + 1}` : 'Relaxed Mode', { fs: 32, c1: '#c9b2ff', c2: '#9b6dff' }, () => go('relaxed', false));
    txt(this, W / 2, y + 56, 'No move limit. The penthouse is always reachable.', 20, { color: '#7a3c72', weight: '500' });
    y += 112;
    this.btnShelf = makeButton(this, W / 2 - 118, y, 220, 70, `Shelf ${itemCount()}/12`, { fs: 26, c1: '#ffd38f', c2: '#f3a64a' }, () => openShelf(this));
    this.btnDuel = makeButton(this, W / 2 + 118, y, 220, 70, 'Duel', { fs: 26, c1: '#a8ecd0', c2: '#3fc59a' }, () => this.duelSetup());
    txt(this, W / 2, H - 34, `★ ${starTotal()} stars   ${Object.keys(META.ach).length}/${ACH.length} achievements`, 22, { color: '#a24c86', weight: '600' });
    if (cont) {
      const r = txt(this, W / 2, y - 175, 'or start over from the lobby', 20, { color: '#a24c86', weight: '600' }).setInteractive({ useHandCursor: true });
      r.setY(H - 400 + 66);
      r.on('pointerdown', () => go('classic', true));
    }
    this.soundBtn = makeSoundToggle(this, W - 64, 92);
    this.input.once('pointerdown', () => startMusic(this));
    buildSidePanels(this);
    window.JOE.ready = true;
  }
  duelSetup() {
    if (this.overlay) return;
    this.overlay = this.add.container(0, 0).setDepth(85);
    const dim = this.add.rectangle(W / 2, H / 2, GW, H, 0x2e1230, 0.55).setInteractive();
    const p = this.add.image(W / 2, H / 2, panelTex(this, 'duelp', 620, 620, 40, 0.98));
    const t = txt(this, W / 2, H / 2 - 230, 'Pass the Phone', 54, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 }); goldText(t);
    const best = META.duelBest;
    const l1 = txt(this, W / 2, H / 2 - 140, 'Same starting board, 12 moves each.\nHighest score wins.', 26, { weight: '600' });
    const l2 = txt(this, W / 2, H / 2 - 60, `Best so far: Gordon ${best.Gordon || 0}   Joe ${best.Joe || 0}`, 22, { color: '#8a3f78', weight: '600' });
    const start = (first) => {
      const seed = Math.floor(Math.random() * 1e9);
      G.mode = 'duel'; G.duel = { order: first === 'Gordon' ? ['Gordon', 'Joe'] : ['Joe', 'Gordon'], turn: 0, scores: [0, 0], seed };
      G.run = freshRun(); if (T0 === null) T0 = performance.now(); startMusic(this);
      this.scene.start('Game');
    };
    const b1 = makeButton(this, W / 2, H / 2 + 60, 420, 84, 'Gordon goes first', { fs: 30 }, () => start('Gordon'));
    const b2 = makeButton(this, W / 2, H / 2 + 160, 420, 84, 'Joe goes first', { fs: 30, c1: '#c9b2ff', c2: '#9b6dff' }, () => start('Joe'));
    const cl = txt(this, W / 2, H / 2 + 250, 'Not now', 24, { color: '#a24c86' }).setInteractive({ useHandCursor: true });
    cl.on('pointerdown', () => { this.overlay.destroy(); this.overlay = null; });
    this.overlay.add([dim, p, t, l1, l2, b1, b2, cl]);
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
  const note = txt(scene, 0, -54, 'sound', 18, { color: '#8a3f78', weight: '600' });
  const c = scene.add.container(x, y, [img, t, note]).setSize(84, 84).setInteractive({ useHandCursor: true });
  c.note = note;
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
    window.JOE.scene = this; window.JOE.sceneName = 'Game'; window.JOE.card = null;
    this.busy = true; this.g = []; this.sel = null; this.down = null; this.cloth = null;
    this.turbo = 0; this.turboMeter = 0; this.reveal = 0; this.revealShown = 0; this.timeLeft = null;
    this.cameras.main.fadeIn(D(300), 255, 230, 240);
    setupScene(this);
    if (!RM) this.add.particles(0, 0, 'spark', { x: { min: -OX, max: W + OX }, y: { min: 0, max: H }, lifespan: 2400, scale: { start: 0.5, end: 0 }, alpha: { start: 0.8, end: 0 }, frequency: 400, tint: [0xffffff, 0xffe28a] }).setDepth(0);

    this.buildHud(); this.buildRoomPanel(); this.buildTurboBar(); this.buildBoard(); this.buildFooter();
    this.burst = this.add.particles(0, 0, 'spark', { lifespan: D(600), speed: { min: 80, max: 320 }, scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(40);
    this.confetti = this.add.particles(0, 0, 'confetti', { lifespan: 2600, speedX: { min: -260, max: 260 }, speedY: { min: -700, max: -250 }, gravityY: 700, rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.4 }, emitting: false, tint: [0xff7eb6, 0xffd36b, 0x7fe0c0, 0xb49bff, 0x8fd0ff, 0xffffff] }).setDepth(60);
    this.flash = this.add.rectangle(W / 2, H / 2, GW, H, 0xffffff, 0).setDepth(70);

    this.input.on('pointerdown', (p) => this.onDown(p));
    this.input.on('pointermove', (p) => this.onMove(p));
    this.input.on('pointerup', (p) => this.onUp(p));
    this.time.addEvent({ delay: 500, loop: true, callback: () => this.hintTick() });
    buildSidePanels(this);

    if (G.mode === 'duel') this.loadDuel(); else this.loadFloor(G.run.floor, true);
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
    this.movesCap = txt(this, W - 118, 26, 'MOVES', 18, { color: '#b0447f', weight: '600' });
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
    this.tw = { x: px + 10, y: py + 10, w: 138, h: ph - 20 };
    canvasTex(this, 'sky', this.tw.w, this.tw.h, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#c9b6ff'); g.addColorStop(0.6, '#ffc9de'); g.addColorStop(1, '#ffe2c4');
      ctx.fillStyle = g; rr(ctx, 0, 0, w, h, 20); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 26; i++) { const x = (i * 53) % w, y = (i * 97) % (h * 0.6); ctx.beginPath(); ctx.arc(x, y, (i % 3) + 1, 0, 7); ctx.fill(); }
    });
    this.add.image(this.tw.x + this.tw.w / 2, this.tw.y + this.tw.h / 2, 'sky');
    this.towerLayer = this.add.container(0, 0);
    // tower renders are 360x1000; fit into the column
    this.tsc = this.tw.h / 1000; this.tcx = this.tw.x + this.tw.w / 2; this.tcy = this.tw.y + this.tw.h / 2;

    const rx = this.tw.x + this.tw.w + 10, ry = py + 10, rw = px + pw - 10 - rx, rh = ph - 20;
    this.room = { x: rx, y: ry, w: rw, h: rh };
    this.beforeImg = this.add.image(rx, ry, 'lobby_before').setOrigin(0, 0).setDisplaySize(rw, rh);
    this.afterImg = this.add.image(rx, ry, 'lobby_glam').setOrigin(0, 0).setDisplaySize(rw, rh);
    const mg = this.make.graphics({ x: 0, y: 0, add: false });
    this.revealMaskG = mg; this.afterImg.setMask(mg.createGeometryMask());
    this.styleImg = this.add.image(rx, ry, 'lobby_glam').setOrigin(0, 0).setDisplaySize(rw, rh).setAlpha(0);
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
    this.turboFill = this.add.tileSprite(this.tb.x, y, 1, this.tb.h - 4, 'stripes').setOrigin(0, 0.5).setVisible(false);
    this.turboHint = txt(this, this.tb.x + this.tb.w / 2, y, 'Chain cascades to charge', 18, { color: '#ffd9ec', weight: '600' });
    this.glamTag = txt(this, this.tb.x + this.tb.w - 8, y, '', 17, { ox: 1, color: '#ffffff', stroke: '#c4417f', strokeW: 4 }).setDepth(3);
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
    this.clothLayer = this.add.container(0, 0).setDepth(12);
    this.selImg = this.add.image(0, 0, 'sel').setDepth(20).setVisible(false);
    if (!RM) this.tweens.add({ targets: this.selImg, scale: 1.08, duration: 380, yoyo: true, repeat: -1 });
    this.raceStripes = this.add.container(0, 0).setDepth(25).setAlpha(0);
    [BY - 14, BY + N * CELL + 6].forEach((yy) => {
      this.raceStripes.add(this.add.rectangle(W / 2, yy, N * CELL + 20, 6, 0xff4f93));
      this.raceStripes.add(this.add.rectangle(W / 2, yy + 9, N * CELL + 20, 6, 0xffd36b));
    });
    this.speedLines = this.add.container(0, 0).setDepth(26);
    // onboarding prompt + pointer
    this.prompt = txt(this, W / 2, BY - 2, '', 26, { color: '#ffffff', stroke: '#c4417f', strokeW: 7 }).setDepth(30);
    this.pointer = this.add.container(0, 0).setDepth(31).setVisible(false);
    const ring = this.add.circle(0, 0, 34).setStrokeStyle(6, 0xffffff, 1);
    const dot = this.add.circle(0, 0, 14, 0xff4f93, 1).setStrokeStyle(4, 0xffffff);
    this.pointer.add([ring, dot]); this.pointer.ring = ring; this.pointer.dot = dot;
  }

  buildFooter() {
    const y = 1246;
    this.menuBtn = makeButton(this, 92, y, 150, 60, 'Menu', { fs: 24, c1: '#ffd38f', c2: '#f3a64a' }, () => this.toMenu());
    this.shelfBtn = makeButton(this, 256, y, 160, 60, 'Shelf', { fs: 24, c1: '#c9b2ff', c2: '#9b6dff' }, () => openShelf(this));
    this.hintBtn = makeButton(this, 426, y, 160, 60, 'Hint', { fs: 24, c1: '#a8ecd0', c2: '#3fc59a' }, () => this.showHint(true));
    this.soundBtn = makeSoundToggle(this, W - 70, y - 4); this.soundBtn.setScale(0.75); this.soundBtn.note.setVisible(false);
  }

  toMenu() { if (this.overlay) return; this.saveRun(); this.scene.start('Title'); }
  saveRun() { if (G.mode === 'duel') return; store.set('run_' + G.mode, G.run); }

  // ---------------------------------------------------------- floors
  loadFloor(i, first) {
    G.run.floor = i; const f = FLOORS[i]; this.fi = i;
    this.collected = {}; Object.keys(f.goals).forEach((k) => (this.collected[k] = 0));
    const p = G.run.perks;
    this.timed = !!f.time;
    this.moves = (f.moves || 0) + (this.timed ? 0 : p.regency * 2);
    this.timeLeft = this.timed ? f.time + p.regency * 8 : null;
    this.floorSwaps = 0; this.floorMaxCombo = 0;
    this.turbo = 0; this.turboMeter = 0; this.reveal = 0; this.revealShown = 0;
    this.floorLabel.setText(`FLOOR ${i + 1}${f.secret ? ' (SECRET)' : ' OF 8'}  ${G.mode === 'relaxed' ? 'RELAXED' : ''}${f.boss ? '  INSPECTION DAY' : ''}`);
    this.roomLabel.setText(f.name);
    this.beforeImg.setTexture(f.key + '_before').setDisplaySize(this.room.w, this.room.h);
    this.afterImg.setTexture(roomTex(i, 'glam')).setDisplaySize(this.room.w, this.room.h);
    this.styleImg.setAlpha(0);
    this.movesCap.setText(this.timed ? 'TIME' : 'MOVES');
    this.updateMoves(); this.updateScore(); this.updateTurbo(); this.buildGoalChips(); this.drawReveal(0);
    this.drawTower(i);
    this.fillBoard(i);
    this.drawPerkStrip();
    this.saveRun();
    if (i === 0 && G.mode !== 'duel') { this.onboard = 1; this.busy = false; this.lastInput = this.time.now; this.showFirstHint(); }
    else { this.onboard = 0; if (FLOORS[i].cloths && !store.get('seenCloth', false)) { store.set('seenCloth', true); this.clothExplainer(() => this.floorIntro()); } else this.floorIntro(); }
  }

  loadDuel() {
    const d = G.duel; const who = d.order[d.turn];
    RNG = mulberry32(d.seed);
    this.fi = 7; const f = FLOORS[7];
    this.collected = {}; this.timed = false; this.timeLeft = null; this.moves = 12; this.duelScore = 0;
    this.turbo = 0; this.turboMeter = 0; this.onboard = 0; this.floorMaxCombo = 0; this.floorSwaps = 0;
    this.floorLabel.setText('DUEL  PASS THE PHONE'); this.roomLabel.setText(who + "'s turn");
    this.beforeImg.setTexture('nye').setDisplaySize(this.room.w, this.room.h); this.afterImg.setTexture('nye'); this.drawReveal(0); this.pctText.setText('');
    this.movesCap.setText('MOVES'); this.updateMoves(); this.updateTurbo();
    this.goalChips.removeAll(true); this.chips = {};
    const sc = txt(this, this.room.x + this.room.w / 2, this.room.y + this.room.h - 40, '', 40, { color: '#ffffff', stroke: '#c4417f', strokeW: 8 });
    this.goalChips.add(sc); this.duelText = sc;
    this.drawTower(MAIN_FLOORS);
    this.fillBoard(-1);
    this.busy = true;
    this.card(who + ', you are up!', [{ t: '12 moves. Make the biggest cascades you can.', s: 26 }, { t: d.turn === 0 ? 'Then pass the phone.' : `Score to beat: ${d.scores[0].toLocaleString('en-US')}`, s: 26, c: '#b0447f' }], [{ label: 'Go!', fn: () => { this.busy = false; } }], { h: 420 });
    G.statsDuelStart = G.run.score;
  }

  buildGoalChips() {
    this.goalChips.removeAll(true);
    const keys = Object.keys(FLOORS[this.fi].goals);
    const cw = keys.length > 3 ? 112 : 132, gap = 6, total = keys.length * cw + (keys.length - 1) * gap;
    let x = this.room.x + this.room.w / 2 - total / 2;
    const y = this.room.y + this.room.h - 34;
    canvasTex(this, 'chip' + cw, cw, 54, (ctx, w, h) => {
      ctx.fillStyle = 'rgba(70,25,70,0.62)'; rr(ctx, 1, 1, w - 2, h - 2, 26); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = goldGrad(ctx, 0, h); rr(ctx, 2, 2, w - 4, h - 4, 25); ctx.stroke();
    });
    canvasTex(this, 'chipdone' + cw, cw, 54, (ctx, w, h) => { ctx.fillStyle = goldGrad(ctx, 0, h); rr(ctx, 1, 1, w - 2, h - 2, 26); ctx.fill(); });
    this.chips = {};
    keys.forEach((k) => {
      const bg = this.add.image(0, 0, 'chip' + cw);
      const icon = this.add.image(-cw / 2 + 26, 0, k).setDisplaySize(42, 42);
      const t = txt(this, 16, 0, '', 23, { color: '#ffffff' });
      const c = this.add.container(x + cw / 2, y, [bg, icon, t]);
      this.goalChips.add(c); this.chips[k] = { c, t, bg, cw }; x += cw + gap;
    });
    if (keys.includes('cloth')) {
      const q = this.add.container(Math.min(x + 22, this.room.x + this.room.w - 26), y);
      q.add(this.add.circle(0, 0, 22, 0xffffff, 1).setStrokeStyle(3, 0xe9b94a));
      q.add(txt(this, 0, 0, '?', 28, { color: '#c4417f' }));
      q.setSize(48, 48).setInteractive({ useHandCursor: true });
      q.on('pointerdown', () => { if (this.busy || this.overlay) return; this.busy = true; this.clothExplainer(() => { this.busy = false; this.lastInput = this.time.now; }); });
      this.goalChips.add(q); this.clothQ = q;
      const rem = txt(this, this.room.x + this.room.w / 2, y - 46, 'Cloths: match on them to lift them', 19, { color: '#ffffff', shadow: 'rgba(60,15,50,0.95)' });
      this.goalChips.add(rem);
    }
    this.updateGoals();
  }

  updateGoals() {
    const f = FLOORS[this.fi]; let have = 0, need = 0;
    Object.keys(f.goals).forEach((k) => {
      const n = Math.min(this.collected[k], f.goals[k]); have += n; need += f.goals[k];
      const ch = this.chips[k]; if (!ch) return;
      const done = this.collected[k] >= f.goals[k];
      ch.t.setText(done ? '✓' : `${n}/${f.goals[k]}`); ch.t.setFontSize(done ? 34 : 23);
      ch.t.setColor(done ? '#7a3c00' : '#ffffff');
      ch.bg.setTexture((done ? 'chipdone' : 'chip') + ch.cw);
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
    if (G.mode !== 'duel') this.pctText.setText(p >= 0.999 ? 'REMODELED' : `REMODEL ${Math.round(p * 100)}%`);
  }

  goalsMet() { const f = FLOORS[this.fi]; return Object.keys(f.goals).every((k) => this.collected[k] >= f.goals[k]); }
  updateMoves() {
    if (this.timed) {
      const s = Math.max(0, Math.ceil(this.timeLeft)); this.movesText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
      this.movesText.setColor(s <= 15 ? '#e0306f' : '#5a2a55'); return;
    }
    this.movesText.setText(G.mode === 'relaxed' ? '∞' : String(this.moves));
    this.movesText.setColor(G.mode !== 'relaxed' && this.moves <= 5 ? '#e0306f' : '#5a2a55');
  }
  updateScore() { this.scoreText.setText((G.mode === 'duel' ? this.duelScore || 0 : G.run.score).toLocaleString('en-US') + ' pts'); if (this.duelText) this.duelText.setText((this.duelScore || 0).toLocaleString('en-US') + ' pts'); }

  // ---------------------------------------------------------- tower (Blender renders)
  drawTower(current) {
    this.towerLayer.removeAll(true);
    this.towerBuilt = current;
    const add = (k) => { const im = this.add.image(this.tcx, this.tcy, k).setScale(this.tsc); this.towerLayer.add(im); return im; };
    add('t_base');
    if (G.mode !== 'duel') for (let i = current + 1; i < MAIN_FLOORS; i++) add('t_floor' + i).setTintFill(0x9a5a8c).setAlpha(0.13);
    for (let i = 0; i < current && i < 9; i++) add('t_floor' + i);
    if (current < 9 && G.mode !== 'duel') {
      const gh = add('t_floor' + current).setTintFill(0x9a5a8c).setAlpha(0.35);
      if (!RM) this.tweens.add({ targets: gh, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });
    }
    if (current >= MAIN_FLOORS) add(current >= 9 ? 't_crown9' : 't_crown8');
    window.JOE.towerFloors = current;
    if (this.refreshSide) this.refreshSide();
  }
  async growTower(i) {
    const im = this.add.image(this.tcx, this.tcy - 300, 't_floor' + i).setScale(this.tsc).setDepth(3);
    let big = null;
    if (WIDE && this.sideTowerGeom) { const s = this.sideTowerGeom; big = this.add.image(s.x, s.y - 500, 't_floor' + i).setScale(s.sc).setDepth(6); }
    const tw = [tweenP(this, { targets: im, y: this.tcy, duration: RM ? 200 : 700, ease: RM ? 'Linear' : 'Bounce.easeOut' })];
    if (big) tw.push(tweenP(this, { targets: big, y: this.sideTowerGeom.y, duration: RM ? 200 : 800, ease: RM ? 'Linear' : 'Bounce.easeOut' }));
    await Promise.all(tw);
    this.burst.setParticleTint(0xffe28a); this.burst.explode(RM ? 6 : 24, this.tcx, this.tcy);
    im.destroy(); if (big) big.destroy();
    this.drawTower(i + 1);
    mark('firstTowerGrow');
  }

  // ---------------------------------------------------------- board model
  key(r, c) { return r * N + c; }
  rc(k) { return [Math.floor(k / N), k % N]; }
  cx(c) { return BX + c * CELL + CELL / 2; }
  cy(r) { return BY + r * CELL + CELL / 2; }
  randType() { return TYPES[Math.floor(RNG() * TYPES.length)]; }

  makePiece(type, r, c, special) {
    const p = { type, special: null, c: null, img: null };
    const img = this.add.sprite(0, 0, type || 'disco').setDisplaySize(74, 74);
    p.img = img; p.c = this.add.container(this.cx(c), this.cy(r), [img]);
    this.layer.add(p.c);
    if (special) this.setSpecial(p, special, true);
    return p;
  }

  setSpecial(p, special, silent) {
    p.special = special;
    if (p.deco) p.deco.forEach((d) => d.destroy());
    p.deco = [];
    if (special === 'disco') {
      p.type = null; p.img.setTexture('disco_spin', 0).setDisplaySize(80, 80);
      if (!RM && this.anims.exists('discospin')) p.img.play('discospin');
      const ring = this.add.graphics();
      const cols = [0xff7eb6, 0xffd36b, 0x7fe0c0, 0x8fd0ff, 0xb49bff, 0xff9f7f];
      cols.forEach((col, i) => { ring.lineStyle(5, col, 1); ring.beginPath(); ring.arc(0, 0, 39, (i / 6) * Math.PI * 2, ((i + 1) / 6) * Math.PI * 2); ring.strokePath(); });
      p.c.addAt(ring, 0); p.deco.push(ring);
      if (!RM) this.tweens.add({ targets: ring, angle: 360, duration: 2200, repeat: -1 });
      if (!silent) unlock(this, 'mirror');
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
      G.stats.specialsMade++; mark('firstSpecial');
      p.c.setScale(0.3);
      this.tweens.add({ targets: p.c, scale: 1, duration: D(380), ease: 'Back.easeOut' });
      this.burst.setParticleTint(0xffffff); this.burst.explode(RM ? 4 : 14, p.c.x, p.c.y);
      this.bumpTurbo(6);
    }
  }

  // planted opening board for floor 1: a 4-match (Power Drill) and an L (Wrecking Ball), both in Tile
  openingTypes() {
    const plant = { '6,0': 'tile', '6,1': 'tile', '6,3': 'tile', '5,2': 'tile', '6,2': 'glass',
      '2,5': 'tile', '2,6': 'tile', '3,7': 'tile', '4,7': 'tile', '1,7': 'tile', '2,7': 'velvet' };
    for (let tries = 0; tries < 400; tries++) {
      const t = [];
      for (let r = 0; r < N; r++) {
        t.push([]);
        for (let c = 0; c < N; c++) {
          const pl = plant[r + ',' + c]; if (pl) { t[r].push(pl); continue; }
          let ty, guard = 0;
          do { ty = TYPES[Math.floor(RNG() * TYPES.length)]; guard++; } while (guard < 30 && ((c >= 2 && t[r][c - 1] === ty && t[r][c - 2] === ty) || (r >= 2 && t[r - 1][c] === ty && t[r - 2][c] === ty) || (ty === 'tile' && r >= 4)));
          t[r].push(ty);
        }
      }
      if (!this.hasRun(t)) return t;
    }
    return null;
  }
  hasRun(t) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const ty = t[r][c]; if (!ty) continue;
      if (c >= 2 && t[r][c - 1] === ty && t[r][c - 2] === ty) return true;
      if (r >= 2 && t[r - 1][c] === ty && t[r - 2][c] === ty) return true;
    }
    return false;
  }

  fillBoard(i) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const p = this.g[r] && this.g[r][c]; if (p) p.c.destroy(); }
    this.clothLayer.removeAll(true);
    let types = i === 0 ? this.openingTypes() : null;
    for (let tries = 0; !types && tries < 200; tries++) {
      const t = [];
      for (let r = 0; r < N; r++) {
        t.push([]);
        for (let c = 0; c < N; c++) {
          let ty, guard = 0;
          do { ty = this.randType(); guard++; } while (guard < 20 && ((c >= 2 && t[r][c - 1] === ty && t[r][c - 2] === ty) || (r >= 2 && t[r - 1][c] === ty && t[r - 2][c] === ty)));
          t[r].push(ty);
        }
      }
      if (this.findMovesOnTypes(t).length >= 3) types = t;
    }
    // drop cloths
    this.cloth = [...Array(N)].map(() => Array(N).fill(null));
    const nCloth = i >= 0 && FLOORS[i].cloths ? FLOORS[i].cloths + 2 : 0;
    let placed = 0;
    while (placed < nCloth) {
      const r = 2 + Math.floor(RNG() * (N - 2)), c = Math.floor(RNG() * N);
      if (this.cloth[r][c]) continue;
      const im = this.add.image(this.cx(c), this.cy(r), 'cloth').setDisplaySize(CELL - 4, CELL - 4);
      this.clothLayer.add(im); this.cloth[r][c] = im; placed++;
    }
    this.g = [];
    for (let r = 0; r < N; r++) {
      this.g.push([]);
      for (let c = 0; c < N; c++) {
        const p = this.makePiece(types[r][c], r, c);
        this.g[r].push(p);
        if (!RM) { p.c.y = this.cy(r) - 700; this.tweens.add({ targets: p.c, y: this.cy(r), duration: D(450 + r * 30), delay: D((N - r) * 20 + c * 10), ease: 'Bounce.easeOut' }); }
      }
    }
    // Mid-Century perk: starting drills
    const drills = i > 0 ? Math.min(3, G.run.perks.mid) : 0;
    this.perkDrills = [];
    for (let k = 0, guard = 0; k < drills && guard < 50; guard++) {
      const r = 1 + Math.floor(RNG() * 6), c = Math.floor(RNG() * N); const p = this.g[r][c];
      if (p && !p.special && !this.covered(r, c)) { this.setSpecial(p, RNG() < 0.5 ? 'drillH' : 'drillV', true); this.perkDrills.push(p); k++; }
    }
  }

  typesGrid() { return this.g.map((row) => row.map((p) => (p ? p.type : null))); }
  covered(r, c) { return !!(this.cloth && this.cloth[r] && this.cloth[r][c]); }

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
        if (this.covered(r, c) || this.covered(r2, c2)) continue;
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
      const p = this.g[r][c]; if (!p || !p.special || this.covered(r, c)) continue;
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const r2 = r + dr, c2 = c + dc; if (r2 < 0 || c2 < 0 || r2 >= N || c2 >= N || this.covered(r2, c2)) continue;
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
    const c = Math.floor((p.worldX - BX) / CELL), r = Math.floor((p.worldY - BY) / CELL);
    if (r < 0 || c < 0 || r >= N || c >= N) return null; return [r, c];
  }
  onDown(p) {
    this.lastInput = this.time.now; this.clearHint();
    if (this.busy || this.overlay) return;
    const cell = this.cellAt(p); if (!cell) { this.select(null); return; }
    this.down = { cell, x: p.worldX, y: p.worldY };
  }
  onMove(p) {
    if (!this.down || this.busy || !p.isDown) return;
    const dx = p.worldX - this.down.x, dy = p.worldY - this.down.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < CELL * 0.33) return;
    const [r, c] = this.down.cell;
    const t = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
    this.down = null; this.select(null);
    if (t[0] < 0 || t[1] < 0 || t[0] >= N || t[1] >= N) return;
    this.trySwap([r, c], t);
  }
  onUp() {
    if (!this.down || this.busy) { this.down = null; return; }
    const cell = this.down.cell; this.down = null;
    if (this.sel) {
      const [r1, c1] = this.sel, [r2, c2] = cell;
      if (r1 === r2 && c1 === c2) { this.select(null); return; }
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) { this.select(null); this.trySwap([r1, c1], cell); return; }
    }
    if (this.covered(cell[0], cell[1])) { this.select(null); this.coveredHint(this.cloth[cell[0]][cell[1]]); return; }
    this.select(cell);
    sfx(this, 'swap', { volume: 0.25, rate: 1.5 });
  }
  coveredHint(cl) {
    sfx(this, 'bonk', { volume: 0.5 });
    if (cl) { this.tweens.killTweensOf(cl); cl.setAngle(0); this.tweens.add({ targets: cl, angle: 7, duration: 60, yoyo: true, repeat: 3, onComplete: () => cl.setAngle(0) }); }
    this.setPrompt('Covered: match on it to lift the cloth');
    if (this.covT) this.covT.remove();
    this.covT = this.time.delayedCall(2000, () => { if (!this.onboard) this.setPrompt(''); });
  }
  select(cell) {
    this.sel = cell;
    if (!cell) { this.selImg.setVisible(false); return; }
    this.selImg.setPosition(this.cx(cell[1]), this.cy(cell[0])).setVisible(true);
  }

  // ---------------------------------------------------------- onboarding + hints
  setPrompt(s) {
    this.prompt.setText(s); this.prompt.setVisible(!!s);
    if (s && !RM) { this.prompt.setScale(0.6); this.tweens.add({ targets: this.prompt, scale: 1, duration: D(260), ease: 'Back.easeOut' }); }
  }
  pointAt(a, b) {
    this.tweens.killTweensOf(this.pointer);
    const x1 = this.cx(a[1]), y1 = this.cy(a[0]), x2 = this.cx(b[1]), y2 = this.cy(b[0]);
    this.pointer.setPosition(x1, y1).setVisible(true).setAlpha(1);
    if (RM) return;
    this.tweens.add({ targets: this.pointer, x: x2, y: y2, duration: 700, delay: 250, ease: 'Sine.easeInOut', repeat: -1, repeatDelay: 450 });
  }
  hidePointer() { this.tweens.killTweensOf(this.pointer); this.pointer.setVisible(false); }
  showFirstHint() {
    this.setPrompt('Swipe the tile down to match 4!');
    this.pointAt([5, 2], [6, 2]);
  }
  hintTick() {
    if (this.busy || this.overlay || this.hinting) return;
    const idle = this.onboard ? 3500 : 6000;
    if (this.time.now - (this.lastInput || 0) > idle) this.showHint(false);
  }
  showHint(force) {
    if (this.busy || this.overlay) return;
    this.lastInput = this.time.now;
    let moves = this.findMoves(); if (!moves.length) return;
    // during onboarding prefer special moves, then goal moves
    if (this.onboard) { const sp = moves.filter(([a, b]) => this.g[a[0]][a[1]].special || this.g[b[0]][b[1]].special); if (sp.length) moves = sp; }
    const m = moves[Math.floor(Math.random() * moves.length)];
    this.clearHint(); this.hinting = [];
    m.forEach(([r, c]) => {
      const p = this.g[r][c]; if (!p) return;
      const tw = this.tweens.add({ targets: p.c, scale: 1.14, duration: 260, yoyo: true, repeat: force ? 3 : 2, onComplete: () => p.c.setScale(1) });
      this.hinting.push({ tw, p });
    });
    if (this.onboard || force) this.pointAt(m[0], m[1]);
    this.time.delayedCall(2200, () => this.clearHint());
  }
  clearHint() { if (!this.hinting) return; this.hinting.forEach(({ tw, p }) => { tw.stop(); if (p.c && p.c.active) p.c.setScale(1); }); this.hinting = null; if (this.onboard !== 1) this.hidePointer(); }

  // ---------------------------------------------------------- moves
  async trySwap(a, b) {
    if (this.busy || this.overlay) return;
    const pa = this.g[a[0]][a[1]], pb = this.g[b[0]][b[1]]; if (!pa || !pb) return;
    this.busy = true; this.clearHint(); this.lastInput = this.time.now;
    if (this.covered(a[0], a[1]) || this.covered(b[0], b[1])) {
      G.stats.invalid++; sfx(this, 'bonk', { volume: 0.6 });
      const cl = this.cloth[a[0]][a[1]] || this.cloth[b[0]][b[1]];
      this.tweens.add({ targets: cl, angle: 8, duration: 60, yoyo: true, repeat: 2 });
      this.coveredHint(cl);
      this.busy = false; return;
    }
    sfx(this, 'swap', { volume: 0.55 });
    const fast = this.turbo ? 0.6 : 1;
    await Promise.all([
      tweenP(this, { targets: pa.c, x: this.cx(b[1]), y: this.cy(b[0]), duration: 150 * fast, ease: 'Quad.easeInOut' }),
      tweenP(this, { targets: pb.c, x: this.cx(a[1]), y: this.cy(a[0]), duration: 150 * fast, ease: 'Quad.easeInOut' }),
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
        tweenP(this, { targets: pa.c, x: this.cx(a[1]), y: this.cy(a[0]), duration: 170, ease: 'Back.easeOut' }),
        tweenP(this, { targets: pb.c, x: this.cx(b[1]), y: this.cy(b[0]), duration: 170, ease: 'Back.easeOut' }),
      ]);
      this.g[a[0]][a[1]] = pa; this.g[b[0]][b[1]] = pb;
      if (!RM) this.cameras.main.shake(D(120), 0.003);
      this.busy = false; return;
    }

    G.stats.swaps++; this.floorSwaps++; mark('firstSwap');
    if (this.onboard === 1) { this.onboard = 2; this.hidePointer(); this.setPrompt(''); }
    if (!this.timed && (G.mode !== 'relaxed' || G.mode === 'duel')) this.moves--;
    if (G.mode === 'duel') this.moves = Math.max(0, this.moves);
    this.updateMoves();
    let combo = 0;
    if (path === 'disco') {
      const disco = pa.special === 'disco' ? pa : pb, other = disco === pa ? pb : pa;
      const dk = disco === pa ? kb : ka, ok = disco === pa ? ka : kb;
      const init = new Set([dk]);
      if (other.special === 'disco') { disco.discoAll = true; other.triggered = true; }
      else disco.discoColor = other.type;
      init.add(ok);
      if (other.special) unlock(this, 'mega');
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
    unlock(this, 'mega');
    const [r, c] = this.rc(kb); const set = new Set([kb]);
    const sp = [pa.special, pb.special].sort().join('+');
    pa.triggered = true; pb.triggered = true;
    const add = (r2, c2) => { if (r2 >= 0 && c2 >= 0 && r2 < N && c2 < N) set.add(this.key(r2, c2)); };
    const fx = [];
    if (sp.indexOf('wreck') < 0) { for (let k = 0; k < N; k++) { add(r, k); add(k, c); } fx.push({ kind: 'drillH', r, c }, { kind: 'drillV', r, c }); }
    else if (sp === 'wreck+wreck') { for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) add(r + i, c + j); fx.push({ kind: 'wreck', r, c, big: true }); }
    else { for (let i = -1; i <= 1; i++) for (let k = 0; k < N; k++) { add(r + i, k); add(k, c + i); } fx.push({ kind: 'drillH', r, c, wide: true }, { kind: 'drillV', r, c, wide: true }); }
    for (let r2 = 0; r2 < N; r2++) for (let c2 = 0; c2 < N; c2++) { const p = this.g[r2][c2]; if (p === pa || p === pb) set.add(this.key(r2, c2)); }
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
      createKeys.forEach((k) => { clear.delete(k); this.liftCloth(k); });
      if (combo >= 2) { G.stats.cascades++; this.bumpTurbo(13); mark('firstCascade'); }
      if (combo >= 4) unlock(this, 'chain');
      G.stats.maxCombo = Math.max(G.stats.maxCombo, combo); this.floorMaxCombo = Math.max(this.floorMaxCombo, combo);
      this.playChime(combo);
      if (combo >= 2) this.showPraise(PRAISE[Math.min(combo - 2, PRAISE.length - 1)]);
      await this.blast(clear, combo, createKeys);
      creates.forEach(({ k, special }) => { const [r, c] = this.rc(k); const p = this.g[r][c]; if (p) this.setSpecial(p, special); });
      if (creates.length) {
        sfx(this, 'chime2', { volume: 0.6, rate: 1.25 });
        if (this.onboard === 2 && creates.some((x) => x.special !== 'disco')) { this.onboard = 3; this.setPrompt('You built a special! Match it to fire it.'); this.time.delayedCall(3200, () => { if (this.onboard === 3) this.setPrompt(''); }); }
      }
      if (combo >= 3 && RNG() < 0.2) this.dropTreasure(BX + N * CELL / 2, BY + N * CELL / 2);
      swapKeys = null;
      await this.gravity();
    }
    return combo;
  }

  playChime(combo) { sfx(this, combo % 2 ? 'chime' : 'chime2', { volume: 0.6, rate: Math.min(2.0, 1 + (combo - 1) * 0.12) }); }

  liftCloth(k) {
    const [r, c] = this.rc(k); const cl = this.cloth && this.cloth[r][c]; if (!cl) return false;
    this.cloth[r][c] = null;
    this.tweens.add({ targets: cl, y: cl.y - 60, alpha: 0, angle: 20, duration: D(400), onComplete: () => cl.destroy() });
    META.clothTotal++;
    if (this.collected.cloth !== undefined) this.collected.cloth++;
    return true;
  }

  async blast(initial, combo, createKeys, fxPre) {
    const final = new Set(); const queue = []; const fx = fxPre ? fxPre.slice() : [];
    initial.forEach((k) => { if (!createKeys.has(k)) { final.add(k); queue.push(k); } });
    const add = (k) => { if (!final.has(k) && !createKeys.has(k)) { final.add(k); queue.push(k); } };
    let fired = 0;
    while (queue.length) {
      const k = queue.shift(); const [r, c] = this.rc(k); const p = this.g[r][c];
      if (!p || !p.special || p.triggered) continue;
      p.triggered = true; G.stats.specialsFired++; fired++; this.bumpTurbo(4);
      if (p.special === 'drillH') { for (let i = 0; i < N; i++) add(this.key(r, i)); fx.push({ kind: 'drillH', r, c }); }
      else if (p.special === 'drillV') { for (let i = 0; i < N; i++) add(this.key(i, c)); fx.push({ kind: 'drillV', r, c }); }
      else if (p.special === 'wreck') { const rad = this.turbo ? 2 : 1; for (let i = -rad; i <= rad; i++) for (let j = -rad; j <= rad; j++) if (r + i >= 0 && r + i < N && c + j >= 0 && c + j < N) add(this.key(r + i, c + j)); fx.push({ kind: 'wreck', r, c, big: rad > 1 }); }
      else if (p.special === 'disco') {
        const targets = [];
        let color = p.discoColor;
        if (!color) { const cnt = {}; this.g.forEach((row) => row.forEach((q) => { if (q && q.type) cnt[q.type] = (cnt[q.type] || 0) + 1; })); color = Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x])[0]; }
        for (let r2 = 0; r2 < N; r2++) for (let c2 = 0; c2 < N; c2++) { const q = this.g[r2][c2]; if (q && (p.discoAll || q.type === color)) { add(this.key(r2, c2)); targets.push([r2, c2]); } }
        fx.push({ kind: 'disco', r, c, targets });
      }
    }
    let fxDelay = 0;
    for (const f of fx) fxDelay = Math.max(fxDelay, this.playFx(f));
    const mult = this.turbo ? 2 : 1;
    let gained = 0; const flyers = [];
    const goals = FLOORS[this.fi].goals;
    const anims = [];
    final.forEach((k) => {
      const [r, c] = this.rc(k); const p = this.g[r][c]; if (!p) return;
      this.g[r][c] = null;
      gained += 10 * combo * mult;
      if (this.liftCloth(k) && flyers.length < 8) flyers.push({ type: 'cloth', x: p.c.x, y: p.c.y });
      if (p.type && goals[p.type] !== undefined && G.mode !== 'duel') {
        const before = this.collected[p.type];
        this.collected[p.type] += mult;
        if (before < goals[p.type] && flyers.length < 6) flyers.push({ type: p.type, x: p.c.x, y: p.c.y });
      }
      const col = p.type ? MAT[p.type].color : 0xffffff;
      const d = fx.length ? Math.min(260, 14 * (Math.abs(r - (fx[0].r ?? r)) + Math.abs(c - (fx[0].c ?? c)))) : 0;
      anims.push(tweenP(this, { targets: p.c, scale: 1.3, alpha: 0, angle: RM ? 0 : Phaser.Math.Between(-25, 25), duration: 220, delay: d + fxDelay * 0.4, ease: 'Back.easeIn' }).then(() => {
        this.burst.setParticleTint(col); this.burst.explode(RM ? 2 : 7, p.c.x, p.c.y);
        p.c.destroy();
      }));
    });
    if (G.mode === 'duel') this.duelScore = (this.duelScore || 0) + gained; else G.run.score += gained;
    this.updateScore();
    if (combo >= 3 && !RM) this.cameras.main.shake(D(140), 0.004);
    await Promise.all(anims);
    flyers.forEach((f, i) => this.flyToChip(f, i));
    if (G.mode !== 'duel') this.updateGoals();
    if (fired && G.mode !== 'duel') {
      const chance = itemCount() === 0 ? 1 : 0.2;
      if (RNG() < chance) this.dropTreasure(this.cx(fx[0] ? fx[0].c : 3), this.cy(fx[0] ? fx[0].r : 3));
    }
  }

  dropTreasure(x, y, label) {
    if (G.mode === 'duel' || this.dropping) return;
    this.dropping = true;
    const it = rollItem(); const isNew = !META.items[it.id];
    G.stats.drops++; mark('firstCollectible');
    if (isNew) META.items[it.id] = Date.now(); else { G.run.score += 500; this.updateScore(); }
    saveMeta();
    const im = this.add.image(x, y, 'it_' + it.id).setDisplaySize(30, 30).setDepth(90);
    const glow = this.add.circle(x, y, 60, 0xffe28a, 0.6).setDepth(89).setBlendMode('ADD');
    sfx(this, 'chime', { volume: 0.7, rate: 1.8 });
    this.tweens.add({ targets: im, displayWidth: 150, displayHeight: 150, y: y - 80, duration: D(420), ease: 'Back.easeOut' });
    this.tweens.add({ targets: glow, scale: 2, alpha: 0, duration: D(700) });
    toast(this, label || (isNew ? 'Treasure found!' : 'Already on the shelf'), isNew ? `${it.name}: ${it.story}` : `${it.name} again: +500 points`, 'it_' + it.id);
    this.time.delayedCall(D(1100), () => {
      this.tweens.add({ targets: im, x: this.shelfBtn.x, y: this.shelfBtn.y, displayWidth: 40, displayHeight: 40, duration: D(520), ease: 'Cubic.easeIn', onComplete: () => {
        im.destroy(); glow.destroy(); this.dropping = false;
        this.tweens.add({ targets: this.shelfBtn, scale: 1.15, duration: D(100), yoyo: true });
        checkMetaAch(this); if (this.refreshSide) this.refreshSide();
      } });
    });
  }

  flyToChip(f, i) {
    const ch = this.chips[f.type]; if (!ch) return;
    const im = this.add.image(f.x, f.y, f.type).setDisplaySize(52, 52).setDepth(45);
    this.tweens.add({ targets: im, x: ch.c.x - 40, y: ch.c.y, scale: im.scale * 0.6, duration: D(520), delay: D(i * 50), ease: 'Cubic.easeIn', onComplete: () => {
      im.destroy(); this.tweens.add({ targets: ch.c, scale: 1.15, duration: D(90), yoyo: true });
    } });
  }

  playFx(f) {
    const x = this.cx(f.c), y = this.cy(f.r);
    if (f.kind === 'drillH' || f.kind === 'drillV') {
      sfx(this, 'drill', { volume: 0.6 });
      const h = f.kind === 'drillH'; const thick = f.wide ? CELL * 3 : CELL * 0.7;
      const beam = this.add.rectangle(h ? W / 2 : x, h ? y : BY + (N * CELL) / 2, h ? N * CELL : thick, h ? thick : N * CELL, 0xfff3c4, 0.9).setDepth(35).setBlendMode('ADD');
      beam.setScale(h ? 0.05 : 1, h ? 1 : 0.05);
      this.tweens.add({ targets: beam, scaleX: 1, scaleY: 1, duration: D(140), onComplete: () => this.tweens.add({ targets: beam, alpha: 0, duration: D(240), onComplete: () => beam.destroy() }) });
      const drill = this.add.image(h ? BX : x, h ? y : BY, 'drill').setDisplaySize(64, 64).setDepth(36).setAngle(h ? 0 : 90);
      this.tweens.add({ targets: drill, x: h ? BX + N * CELL : x, y: h ? y : BY + N * CELL, duration: D(300), onComplete: () => drill.destroy() });
      this.doFlash(0.25); return 140;
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
      this.doFlash(0.45); return 240;
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
    if (this.turbo || G.mode === 'duel' && false) return;
    const rate = (FLOORS[this.fi] && FLOORS[this.fi].turboRate || 1) * (1 + 0.3 * G.run.perks.glam);
    this.turboMeter = Math.min(100, this.turboMeter + n * rate); this.updateTurbo();
    if (G.run.perks.glam && this.glamTag && !RM && !this.tweens.isTweening(this.glamTag)) this.tweens.add({ targets: this.glamTag, scale: 1.3, duration: D(120), yoyo: true });
  }
  updateTurbo() {
    const pct = this.turbo ? this.turbo / 3 : this.turboMeter / 100;
    this.turboFill.setVisible(pct > 0.001); this.turboFill.width = Math.max(1, (this.tb.w - 4) * pct); this.turboFill.x = this.tb.x + 2;
    this.turboHint.setVisible(!this.turbo && pct < 0.35);
    if (!this.turbo && this.turboMeter >= 100 && !this.readyPulse && !RM) this.readyPulse = this.tweens.add({ targets: this.turboLabel, scale: 1.18, duration: 260, yoyo: true, repeat: -1 });
  }
  update(time, delta) {
    if (this.turboFill && this.turboFill.visible) this.turboFill.tilePositionX -= (this.turbo ? 0.9 : 0.15) * delta;
    if (this.timed && this.timeLeft > 0 && !this.overlay && !this.floorDone) {
      this.timeLeft -= (delta / 1000) * SPEED; this.updateMoves();
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.timeUp = true; if (!this.busy) this.outOfMoves(); }
    }
  }
  async startTurbo() {
    G.stats.turbos++; mark('firstTurbo'); unlock(this, 'throttle');
    this.turbo = 3; this.turboMeter = 0;
    if (this.readyPulse) { this.readyPulse.stop(); this.readyPulse = null; this.turboLabel.setScale(1); }
    this.updateTurbo();
    sfx(this, 'turbo', { volume: 0.8 }); this.doFlash(0.5);
    const banner = txt(this, W / 2, BY + (N * CELL) / 2, 'TURBO!', 120, { stroke: '#ff3f88', strokeW: 12, shadow: 'rgba(90,20,70,0.6)' }).setDepth(55);
    banner.setFontStyle('italic 700'); goldText(banner); banner.x = -300;
    await tweenP(this, { targets: banner, x: W / 2, duration: 240, ease: 'Cubic.easeOut' });
    const sub = txt(this, W / 2, BY + (N * CELL) / 2 + 90, '3 moves of double materials', 28, { color: '#ffffff', stroke: '#c4417f', strokeW: 6 }).setDepth(55);
    await wait(this, 600);
    this.tweens.add({ targets: [banner, sub], x: W + 400, duration: D(240), ease: 'Cubic.easeIn', onComplete: () => { banner.destroy(); sub.destroy(); } });
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
    if (G.mode === 'duel') { if (this.moves <= 0) { this.duelTurnEnd(); return; } if (!this.findMoves().length) await this.shuffle(); this.busy = false; return; }
    if (this.goalsMet()) { await this.floorComplete(); return; }
    if (!this.turbo && this.turboMeter >= 100) await this.startTurbo();
    if (this.timed && this.timeUp) { this.outOfMoves(); return; }
    if (!this.timed && G.mode !== 'relaxed' && this.moves <= 0) { this.outOfMoves(); return; }
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
      if (tries > 60) pieces.forEach((p) => { if (!p.special) { p.type = this.randType(); p.img.setTexture(p.type).setDisplaySize(74, 74); } });
    }
    const anims = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) anims.push(tweenP(this, { targets: this.g[r][c].c, x: this.cx(c), y: this.cy(r), duration: 420, ease: 'Cubic.easeInOut' }));
    await Promise.all(anims);
  }

  // ---------------------------------------------------------- overlays
  card(title, lines, buttons, opts = {}) {
    this.overlay = this.add.container(0, 0).setDepth(80);
    const dim = this.add.rectangle(W / 2, H / 2, GW, H, 0x4a1d47, opts.dim ?? 0.45).setInteractive();
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
    const tt = txt(this, W / 2, top + 66, title, opts.titleSize || 50, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 });
    goldText(tt); items.push(tt);
    let y = top + 132;
    lines.forEach((l) => {
      if (l.icons) {
        const n = l.icons.length; let x = W / 2 - ((n - 1) * 140) / 2;
        l.icons.forEach((ic) => { items.push(this.add.image(x - 30, y + 10, ic.k).setDisplaySize(54, 54)); items.push(txt(this, x + 22, y + 10, ic.t, 28, { color: '#5a2a55' })); x += 140; });
        y += 74; return;
      }
      const t = txt(this, W / 2, y, l.t, l.s || 28, { color: l.c || '#5a2a55', weight: l.w || '600', wrap: 560 });
      items.push(t); y += t.height + 8;
    });
    let by = top + ch - 66 - (buttons.length - 1) * 92;
    window.JOE.cardButtons = [];
    buttons.forEach((b) => { window.JOE.cardButtons.push({ label: b.label, x: W / 2, y: by }); items.push(makeButton(this, W / 2, by, 420, 80, b.label, { fs: 30, c1: b.c1, c2: b.c2 }, () => { this.closeCard(); b.fn(); })); by += 92; });
    this.overlay.add(items);
    this.overlay.setAlpha(0); panel.setScale(0.85);
    this.tweens.add({ targets: this.overlay, alpha: 1, duration: D(180) });
    this.tweens.add({ targets: panel, scale: 1, duration: D(300), ease: 'Back.easeOut' });
    window.JOE.card = title;
  }
  closeCard() { if (this.overlay) { this.overlay.destroy(); this.overlay = null; window.JOE.card = null; } }

  drawPerkStrip() {
    if (!this.perkStrip) this.perkStrip = this.add.container(0, 0).setDepth(8);
    this.perkStrip.removeAll(true);
    const p = G.run.perks; const list = [];
    if (p.glam) list.push({ icon: 'disco', t: `x${(1 + 0.3 * p.glam).toFixed(1)}` });
    if (p.regency) list.push({ icon: 'regbadge', t: this.timed ? `+${p.regency * 8}s` : `+${p.regency * 2}` });
    if (p.mid) list.push({ icon: 'drill', t: `x${Math.min(3, p.mid)}` });
    if (G.mode === 'duel' || !list.length) return;
    let x = this.room.x + this.room.w - 12; const y = this.room.y + 22;
    for (let k = list.length - 1; k >= 0; k--) {
      const it = list[k]; const w = 96;
      const bg = this.add.graphics(); bg.fillStyle(0x461a46, 0.7); bg.fillRoundedRect(x - w, y - 18, w, 36, 18); bg.lineStyle(2, 0xe9b94a, 1); bg.strokeRoundedRect(x - w, y - 18, w, 36, 18);
      this.perkStrip.add([bg, this.add.image(x - w + 20, y, it.icon).setDisplaySize(30, 30), txt(this, x - w + 62, y, it.t, 19, { color: '#ffffff' })]);
      x -= w + 6;
    }
    this.perkStrip.add(txt(this, x - 4, y, 'PERKS', 15, { ox: 1, color: '#ffffff', shadow: 'rgba(60,15,50,0.95)' }));
    if (this.glamTag) this.glamTag.setText(p.glam ? `Glam x${(1 + 0.3 * p.glam).toFixed(1)}` : '');
  }
  showPerkFire() {
    const p = G.run.perks;
    if (p.regency && this.fi > 0) {
      const t = txt(this, W - 118, 104, this.timed ? `+${p.regency * 8}s Regency` : `+${p.regency * 2} Regency`, 24, { color: '#ffffff', stroke: '#145c45', strokeW: 6 }).setDepth(60);
      this.tweens.add({ targets: this.movesText, scale: 1.3, duration: D(160), yoyo: true, repeat: 1 });
      this.tweens.add({ targets: t, y: 80, alpha: 0, duration: D(1400), delay: D(900), onComplete: () => t.destroy() });
    }
    (this.perkDrills || []).forEach((pc, k) => {
      if (!pc.c || !pc.c.active) return;
      this.time.delayedCall(D(200 + k * 250), () => {
        if (!pc.c.active) return;
        this.tweens.add({ targets: pc.c, scale: 1.35, duration: D(180), yoyo: true });
        this.burst.setParticleTint(0xf2a03d); this.burst.explode(RM ? 4 : 16, pc.c.x, pc.c.y);
        const t = txt(this, pc.c.x, pc.c.y - 50, 'Mid-Century', 20, { color: '#ffffff', stroke: '#b4561f', strokeW: 5 }).setDepth(60);
        this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, duration: D(1200), delay: D(900), onComplete: () => t.destroy() });
      });
    });
    this.perkDrills = [];
  }
  clothExplainer(next) {
    this.overlay = this.add.container(0, 0).setDepth(82);
    const dim = this.add.rectangle(W / 2, H / 2, GW, H, 0x4a1d47, 0.5).setInteractive();
    const panel = this.add.image(W / 2, H / 2, panelTex(this, 'clothp', 640, 900, 40, 0.98));
    const t = txt(this, W / 2, H / 2 - 380, 'Drop cloths', 54, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 }); goldText(t);
    const sub = txt(this, W / 2, H / 2 - 318, 'The painters left cloths taped over some squares.', 22, { color: '#8a3f78', weight: '600' });
    // tiny demo: [tile][tile under cloth][paint], a tile drops in from above-right
    const dy = H / 2 - 170, cx = W / 2;
    const demoBg = this.add.graphics(); demoBg.fillStyle(0xfff3e8, 1); demoBg.fillRoundedRect(cx - 170, dy - 110, 340, 200, 24); demoBg.lineStyle(3, 0xe9b94a); demoBg.strokeRoundedRect(cx - 170, dy - 110, 340, 200, 24);
    const a = this.add.image(cx - 90, dy, 'tile').setDisplaySize(70, 70);
    const b = this.add.image(cx, dy, 'tile').setDisplaySize(70, 70);
    const c = this.add.image(cx + 90, dy, 'paint').setDisplaySize(70, 70);
    const up = this.add.image(cx + 90, dy - 82, 'tile').setDisplaySize(70, 70);
    const cl = this.add.image(cx, dy, 'cloth').setDisplaySize(80, 80);
    const plus = txt(this, cx, dy - 70, '+1 cloth', 26, { color: '#3f8f6f' }).setAlpha(0);
    const hand = this.add.circle(cx + 90, dy - 82, 14, 0xff4f93).setStrokeStyle(4, 0xffffff);
    const demo = [a, b, c, up, cl, plus, hand];
    const run = () => {
      if (!this.overlay) return;
      a.setAlpha(1).setScale(a.scaleX > 0 ? a.scaleX : 1); [a, b, c, up].forEach((o) => { o.setAlpha(1); o.setDisplaySize(70, 70); });
      up.setPosition(cx + 90, dy - 82); c.setPosition(cx + 90, dy); cl.setPosition(cx, dy).setAlpha(1).setAngle(0); plus.setAlpha(0).setY(dy - 70); hand.setPosition(cx + 90, dy - 82).setAlpha(1);
      if (RM) { cl.setAlpha(0.35); plus.setAlpha(1); return; }
      this.tweens.add({ targets: hand, y: dy, duration: 500, delay: 300 });
      this.tweens.add({ targets: up, y: dy, duration: 220, delay: 800 });
      this.tweens.add({ targets: c, y: dy - 82, duration: 220, delay: 800 });
      this.tweens.add({ targets: [a, b, up], scale: 0, alpha: 0, duration: 260, delay: 1150 });
      this.tweens.add({ targets: hand, alpha: 0, duration: 200, delay: 1100 });
      this.tweens.add({ targets: cl, y: dy - 90, angle: 25, alpha: 0, duration: 450, delay: 1200 });
      this.tweens.add({ targets: plus, alpha: 1, y: dy - 95, duration: 300, delay: 1350 });
    };
    run();
    this.explainTimer = this.time.addEvent({ delay: 2900, loop: true, callback: run });
    const lines = [
      ['\u2022 A covered piece can\'t be swapped. Tapping it just wiggles the cloth.', '#5a2a55'],
      ['\u2022 The cloth stays taped to its square. Pieces can still fall into and out of it.', '#5a2a55'],
      ['\u2022 Lift a cloth by clearing its square: make a match that includes it, or hit it with a special.', '#5a2a55'],
      ['\u2022 Every lifted cloth counts toward this floor\'s goal.', '#3f8f6f'],
    ];
    let y = H / 2 - 20; const items = [dim, panel, t, sub, demoBg, ...demo];
    lines.forEach(([l, col]) => { const tt = txt(this, W / 2 - 270, y, l, 23, { ox: 0, oy: 0, color: col, weight: '600', wrap: 545, align: 'left' }); items.push(tt); y += tt.height + 8; });
    items.push(txt(this, W / 2, y + 16, 'Tap ? on the goals bar to see this again.', 19, { color: '#a24c86', weight: '600' }));
    const by = H / 2 + 380;
    window.JOE.cardButtons = [{ label: 'Got it', x: W / 2, y: by }];
    items.push(makeButton(this, W / 2, by, 380, 80, 'Got it', { fs: 30 }, () => { if (this.explainTimer) { this.explainTimer.remove(); this.explainTimer = null; } this.closeCard(); next(); }));
    this.overlay.add(items);
    window.JOE.card = 'Drop cloths';
  }
  floorIntro() {
    this.busy = true;
    const f = FLOORS[this.fi];
    const icons = Object.keys(f.goals).map((k) => ({ k, t: String(f.goals[k]) }));
    const p = G.run.perks; const perk = [];
    if (p.glam) perk.push(`TURBO +${p.glam * 30}%`); if (p.regency) perk.push(this.timed ? `+${p.regency * 8}s` : `+${p.regency * 2} moves`); if (p.mid && this.fi > 0) perk.push(`${Math.min(3, p.mid)} drill${p.mid > 1 ? 's' : ''} placed`);
    const lines = [
      { t: `Floor ${this.fi + 1}: ${f.name}`, s: 32, w: '700' },
      { icons },
      { t: this.timed ? `${Math.round(this.timeLeft)} seconds on the clock` : (G.mode === 'relaxed' ? 'Relaxed: all the moves you like' : `in ${this.moves} moves`), s: 24, c: '#8a3f78' },
      { t: f.tip, s: 24, c: f.boss ? '#e0306f' : '#b0447f' },
    ];
    if (perk.length) lines.push({ t: 'Your decor perks: ' + perk.join(', '), s: 22, c: '#3f8f6f' });
    this.card(f.boss ? 'Inspection Day!' : (f.secret ? 'A secret floor!' : 'Next floor up!'), lines, [{ label: f.boss ? 'Beat the clock' : "Let's Remodel", fn: () => { this.busy = false; this.lastInput = this.time.now; this.showPerkFire(); } }], { h: perk.length ? 600 : 560 });
  }

  computeStars() {
    const f = FLOORS[this.fi]; const why = ['★ Remodeled']; let s = 1;
    let spare;
    if (this.timed) spare = this.timeLeft >= f.time * 0.2;
    else if (G.mode === 'relaxed') spare = this.floorSwaps <= f.moves * 0.8;
    else spare = this.moves >= Math.ceil((f.moves + G.run.perks.regency * 2) * 0.2);
    if (spare) { s++; why.push(this.timed ? '★ Time to spare' : '★ Moves to spare'); } else why.push('☆ Moves to spare');
    if (this.floorMaxCombo >= 4) { s++; why.push('★ Cascade x4'); } else why.push(`☆ Cascade x4 (best x${this.floorMaxCombo})`);
    return { s, why };
  }

  async floorComplete() {
    this.busy = true; this.floorDone = true; G.stats.floorsCleared++;
    if (this.turbo) this.endTurbo();
    this.hidePointer(); this.setPrompt(''); this.onboard = 0;
    mark('firstRoomComplete');
    const f = FLOORS[this.fi]; const done = this.fi;
    let bonus = 0;
    if (!this.timed && G.mode !== 'relaxed' && this.moves > 0) bonus = this.moves * 100;
    if (this.timed) bonus = Math.round(this.timeLeft) * 20;
    G.run.score += bonus; this.updateScore();
    await wait(this, 150);
    sfx(this, 'fanfare', { volume: 0.8 }); sfx(this, 'cheer', { volume: 0.7 });
    this.tweens.killTweensOf(this);
    await tweenP(this, { targets: this, revealShown: 1, duration: 600, ease: 'Cubic.easeOut', onUpdate: () => this.drawReveal(this.revealShown) });
    this.drawReveal(1); this.doFlash(0.6);
    const stamp = txt(this, this.room.x + this.room.w / 2, this.room.y + this.room.h / 2, 'Remodeled!', 64, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 10, shadow: 'rgba(90,20,70,0.6)' }).setDepth(50);
    goldText(stamp); stamp.setScale(2.4).setAlpha(0).setAngle(-8);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: D(300), ease: 'Back.easeOut' });
    this.confetti.explode(RM ? 20 : 120, this.room.x + this.room.w / 2, this.room.y + this.room.h);
    if (!RM) this.time.delayedCall(D(300), () => this.confetti.explode(80, W / 2, BY + 200));
    await this.growTower(done);
    if (done === 0) unlock(this, 'opening');
    if (f.boss) unlock(this, 'inspect');
    if (f.secret) unlock(this, 'starlight');
    if (done === 0 && itemCount() === 0) this.dropTreasure(this.room.x + this.room.w / 2, this.room.y + this.room.h / 2, 'A housewarming treasure!');
    await wait(this, this.dropping ? 1800 : 900);
    stamp.destroy();
    const st = this.computeStars();
    META.stars[f.key] = Math.max(META.stars[f.key] || 0, st.s); saveMeta(); checkMetaAch(this);
    store.set('bestFloor', Math.max(store.get('bestFloor', 0), done + 1));
    const afterChoice = () => this.starsCard(done, st, bonus);
    if (done >= 1 && !f.secret) this.decorChoice(done, afterChoice); else afterChoice();
  }

  decorChoice(i, next) {
    mark('firstDecorChoice');
    this.overlay = this.add.container(0, 0).setDepth(80);
    const dim = this.add.rectangle(W / 2, H / 2, GW, H, 0x4a1d47, 0.5).setInteractive();
    const key = panelTex(this, 'decorp2', 680, 1000, 40, 0.98);
    const items = [dim, this.add.image(W / 2, 700, key)];
    const t = txt(this, W / 2, 236, 'Pick the look', 52, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8 }); goldText(t); items.push(t);
    const hall = !!FLOORS[i].styleNames;
    items.push(txt(this, W / 2, 294, hall ? 'Each spa accent comes with one perk:' : 'Each look comes with one perk:', 22, { color: '#8a3f78', weight: '600' }));
    items.push(txt(this, W / 2, 326, 'Perks stack for the rest of your climb.', 24, { color: '#3f8f6f', weight: '700' }));
    const p = G.run.perks;
    STYLE_IDS.forEach((s2, k) => {
      const y = 482 + k * 252;
      const cardBg = this.add.graphics(); cardBg.fillStyle(0xffffff, 0.75); cardBg.fillRoundedRect(W / 2 - 316, y - 118, 632, 236, 26); cardBg.lineStyle(3, 0xe9b94a, 1); cardBg.strokeRoundedRect(W / 2 - 316, y - 118, 632, 236, 26);
      const thumb = this.add.image(W / 2 - 180, y, roomTex(i, s2)).setDisplaySize(240, 161);
      const frame = this.add.rectangle(W / 2 - 180, y, 244, 165).setStrokeStyle(4, 0xe9b94a);
      const look = txt(this, W / 2 - 40, y - 86, hall ? `Look: ${styleName(i, s2)}` : PERKS[s2].name, 22, { ox: 0, color: '#8a3f78', weight: '700' });
      const fam = hall ? txt(this, W / 2 - 40, y - 58, `Perk family: ${PERKS[s2].name}`, 17, { ox: 0, color: '#a24c86', weight: '600' }) : null;
      const icon = this.add.image(W / 2 - 10, y + 8, PERKS[s2].icon).setDisplaySize(52, 52);
      const perk = txt(this, W / 2 + 26, y + 8, PERKS[s2].perk, 25, { ox: 0, color: '#145c45', weight: '700', wrap: 270, align: 'left' });
      const now = s2 === 'glam' ? `TURBO x${(1 + 0.3 * p.glam).toFixed(1)} \u2192 x${(1 + 0.3 * (p.glam + 1)).toFixed(1)}`
        : s2 === 'regency' ? `+${p.regency * 2} \u2192 +${(p.regency + 1) * 2} moves`
        : `${Math.min(3, p.mid)} \u2192 ${Math.min(3, p.mid + 1)} starting drill${Math.min(3, p.mid + 1) > 1 ? 's' : ''}${p.mid >= 3 ? ' (max)' : ''}`;
      const nowT = txt(this, W / 2 - 40, y + 92, 'Yours: ' + now, 18, { ox: 0, color: '#8a3f78', weight: '600' });
      const hit = this.add.rectangle(W / 2, y, 632, 236, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.pickStyle(i, s2, next));
      items.push(cardBg, thumb, frame, look, icon, perk, nowT, hit); if (fam) items.push(fam);
    });
    if (hall) items.push(txt(this, W / 2, 1150, 'The spa accent itself is just for looks; the perk is what changes play.', 18, { color: '#8a3f78', weight: '600', wrap: 600 }));
    this.overlay.add(items);
    window.JOE.card = 'Pick the look'; window.JOE.cardButtons = STYLE_IDS.map((s3, k) => ({ label: s3, x: W / 2, y: 482 + k * 252 }));
  }
  pickStyle(i, s, next) {
    this.closeCard();
    G.stats.decorPicks++;
    G.run.perks[s]++; G.run.styles[FLOORS[i].key] = s; META.stylesUsed[s] = true; saveMeta(); checkMetaAch(this);
    this.styleImg.setTexture(roomTex(i, s)).setDisplaySize(this.room.w, this.room.h).setAlpha(0);
    this.tweens.add({ targets: this.styleImg, alpha: 1, duration: D(500) });
    this.burst.setParticleTint(0xffe28a); this.burst.explode(RM ? 6 : 30, this.room.x + this.room.w / 2, this.room.y + this.room.h / 2);
    sfx(this, 'chime2', { volume: 0.7, rate: 1.4 });
    const what = s === 'glam' ? `TURBO now charges x${(1 + 0.3 * G.run.perks.glam).toFixed(1)} as fast` : s === 'regency' ? `Every later floor starts with +${G.run.perks.regency * 2} moves` : `Every later floor starts with ${Math.min(3, G.run.perks.mid)} Power Drill${Math.min(3, G.run.perks.mid) > 1 ? 's' : ''}`;
    toast(this, `Perk added: ${PERKS[s].name}`, `${what}. Your perks: ${perkSummary(G.run.perks)}.`, PERKS[s].icon);
    this.drawPerkStrip();
    if (this.refreshSide) this.refreshSide();
    this.time.delayedCall(D(700), next);
  }
  starsCard(done, st, bonus) {
    const f = FLOORS[done];
    const lines = [
      { t: `${f.name} is done.`, s: 32, w: '700' },
      { t: '★'.repeat(st.s) + '☆'.repeat(3 - st.s), s: 54, c: '#e8a33a', w: '700' },
      { t: st.why.join('    '), s: 20, c: '#8a3f78' },
      { t: (bonus ? `Bonus +${bonus.toLocaleString('en-US')}   ` : '') + `Score ${G.run.score.toLocaleString('en-US')}`, s: 24 },
    ];
    const nextF = done + 1;
    G.run.floor = Math.min(nextF, FLOORS.length - 1); this.saveRun();
    if (f.secret) { this.card('Starlight!', lines, [{ label: 'Back to the roof', fn: () => this.toFinale() }], { h: 520, y: 880, dim: 0.15 }); return; }
    if (done === MAIN_FLOORS - 1) { this.card('Penthouse!', lines, [{ label: 'Go up to the roof', fn: () => this.toFinale() }], { h: 520, y: 880, dim: 0.15 }); return; }
    this.card('Floor Complete!', lines, [{ label: 'Up to the next floor', fn: () => this.nextFloor() }], { h: 520, y: 880, dim: 0.15 });
  }
  nextFloor() { this.endTurbo(); this.select(null); this.floorDone = false; this.timeUp = false; this.loadFloor(this.fi + 1, false); }
  toFinale() {
    if (this.fi === MAIN_FLOORS - 1) { G.run.floor = MAIN_FLOORS; this.saveRun(); }
    if (FLOORS[this.fi].secret) { G.run.floor = 0; store.set('run_' + G.mode, null); window.JOE.secretDone = true; }
    this.cameras.main.fadeOut(D(500), 20, 10, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Finale', { after: FLOORS[this.fi].secret ? 'dome' : 'penthouse' }));
  }
  outOfMoves() {
    this.busy = true;
    const f = FLOORS[this.fi];
    const left = Object.keys(f.goals).filter((k) => this.collected[k] < f.goals[k]).map((k) => ({ k, t: String(f.goals[k] - this.collected[k]) }));
    const timed = this.timed;
    this.card(timed ? 'Time!' : 'So close!', [{ t: 'Still needed:', s: 26, c: '#8a3f78' }, { icons: left }, { t: timed ? 'House rules: 30 more seconds, on the house.' : 'House rules: 5 more moves, on the house.', s: 24, c: '#b0447f' }], [
      { label: timed ? '+30 Seconds' : '+5 Moves', fn: () => { if (timed) { this.timeLeft += 30; this.timeUp = false; } else this.moves += 5; this.updateMoves(); this.busy = false; } },
      { label: 'Restart Floor', c1: '#c9b2ff', c2: '#9b6dff', fn: () => { this.timeUp = false; this.loadFloor(this.fi, false); } },
    ], { h: 600 });
  }
  duelTurnEnd() {
    const d = G.duel; d.scores[d.turn] = this.duelScore || 0;
    const who = d.order[d.turn];
    META.duelBest[who] = Math.max(META.duelBest[who] || 0, d.scores[d.turn]); saveMeta();
    if (d.turn === 0) {
      d.turn = 1;
      this.card('Pass the phone!', [{ t: `${who} scored ${d.scores[0].toLocaleString('en-US')}.`, s: 30 }, { t: `${d.order[1]}, your turn on the same starting board.`, s: 24, c: '#8a3f78' }], [{ label: `${d.order[1]} is ready`, fn: () => this.scene.restart() }], { h: 440 });
    } else {
      unlock(this, 'duel');
      const [a, b] = d.scores; const win = a === b ? 'A tie!' : (a > b ? d.order[0] : d.order[1]) + ' wins!';
      this.card(win, [{ t: `${d.order[0]}: ${a.toLocaleString('en-US')}`, s: 30 }, { t: `${d.order[1]}: ${b.toLocaleString('en-US')}`, s: 30 }], [
        { label: 'Rematch', fn: () => { d.turn = 0; d.scores = [0, 0]; d.seed = Math.floor(Math.random() * 1e9); this.scene.restart(); } },
        { label: 'Menu', c1: '#c9b2ff', c2: '#9b6dff', fn: () => { G.mode = 'classic'; RNG = Math.random; this.scene.start('Title'); } },
      ], { h: 520 });
    }
  }
}

// =====================================================================
class Finale extends Phaser.Scene {
  constructor() { super('Finale'); }
  init(data) { this.after = (data && data.after) || 'penthouse'; }
  create() {
    window.JOE.scene = this; window.JOE.sceneName = 'Finale'; window.JOE.card = null; window.JOE.finale = false;
    mark('finale');
    this.cameras.main.fadeIn(D(500), 20, 10, 40);
    this.cameras.main.setScroll(-OX, 0);
    this.add.rectangle(W / 2, H / 2, GW, H, 0x1d1036);
    const art = this.add.image(W / 2, 0, 'nye').setOrigin(0.5, 0);
    art.setScale(Math.max(W / art.width, 760 / art.height) * (WIDE ? 1.6 : 1));
    canvasTex(this, 'nyeveil', GW, H, (ctx) => {
      const g = ctx.createLinearGradient(0, 380, 0, H); g.addColorStop(0, 'rgba(29,16,54,0)'); g.addColorStop(0.35, 'rgba(29,16,54,0.85)'); g.addColorStop(1, 'rgba(29,16,54,1)');
      ctx.fillStyle = g; ctx.fillRect(0, 380, GW, H - 380);
    });
    this.add.image(W / 2, H / 2, 'nyeveil');
    startMusic(this);
    this.fw = this.add.particles(0, 0, 'spark', { lifespan: 1300, speed: { min: 120, max: 420 }, gravityY: 160, scale: { start: 0.9, end: 0 }, alpha: { start: 1, end: 0 }, emitting: false, blendMode: 'ADD' }).setDepth(20);
    const skip = PARAMS.get('nocount');
    const big = txt(this, W / 2, 760, '', 280, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 14, shadow: 'rgba(255,120,200,0.6)' }).setDepth(30);
    const cap = txt(this, W / 2, 560, this.after === 'dome' ? 'One more for the stars' : 'Midnight on the roof', 40, { color: '#ffe3f2', weight: '600' }).setDepth(30);
    let n = skip ? 0 : 10;
    window.JOE.countdown = n;
    const tick = () => {
      if (n <= 0) { cap.destroy(); big.destroy(); this.midnight(); return; }
      big.setText(String(n)); goldText(big); big.setScale(1.5).setAlpha(1);
      this.tweens.add({ targets: big, scale: 1, duration: D(300), ease: 'Back.easeOut' });
      this.tweens.add({ targets: big, alpha: 0.4, duration: D(450), delay: D(500) });
      sfx(this, 'chime', { volume: 0.5, rate: 0.8 + (10 - n) * 0.09 });
      n--; window.JOE.countdown = n;
      this.time.delayedCall(D(1000), tick);
    };
    tick();
  }
  firework(x, y) {
    const cols = [0xff7eb6, 0xffd36b, 0x7fe0c0, 0x8fd0ff, 0xb49bff, 0xffffff];
    this.fw.setParticleTint(Phaser.Math.RND.pick(cols)); this.fw.explode(RM ? 12 : 60, x, y);
  }
  midnight() {
    unlock(this, 'midnight');
    sfx(this, 'finale', { volume: 0.85 }); sfx(this, 'cheer', { volume: 0.6 });
    const flash = this.add.rectangle(W / 2, H / 2, GW, H, 0xffffff, RM ? 0.3 : 0.9).setDepth(40);
    this.tweens.add({ targets: flash, alpha: 0, duration: D(600) });
    const burst = () => this.firework(Phaser.Math.Between(60 - (WIDE ? 400 : 0), W - 60 + (WIDE ? 400 : 0)), Phaser.Math.Between(80, 420));
    for (let i = 0; i < 6; i++) this.time.delayedCall(D(i * 180), burst);
    this.time.addEvent({ delay: RM ? 1500 : 450, loop: true, callback: burst });
    this.add.particles(0, 0, 'confetti', { x: { min: -OX, max: W + OX }, y: -20, lifespan: 5000, speedY: { min: 120, max: 260 }, speedX: { min: -60, max: 60 }, rotate: { min: 0, max: 360 }, scale: { min: 0.8, max: 1.6 }, frequency: RM ? 400 : 40, tint: [0xff7eb6, 0xffd36b, 0x7fe0c0, 0xb49bff, 0x8fd0ff, 0xffffff] }).setDepth(25);

    const t1 = txt(this, W / 2, 90, "Here's to you,", 58, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 8, shadow: 'rgba(160,40,110,0.4)' }).setDepth(30);
    const t2 = txt(this, W / 2, 180, 'Joe!', 110, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 10, shadow: 'rgba(160,40,110,0.4)' }).setDepth(30);
    goldText(t1); goldText(t2);
    [t1, t2].forEach((t, i) => { t.setAlpha(0); this.tweens.add({ targets: t, alpha: 1, duration: D(600), delay: D(200 + i * 200) }); });

    // gold H+B doormat
    canvasTex(this, 'doormat', 360, 170, (ctx, w, h) => {
      ctx.fillStyle = goldGrad(ctx, 0, h); rr(ctx, 0, 0, w, h, 26); ctx.fill();
      const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff3f8'); g.addColorStop(1, '#ffd0e4');
      ctx.fillStyle = g; rr(ctx, 12, 12, w - 24, h - 24, 18); ctx.fill();
      ctx.strokeStyle = 'rgba(201,138,44,0.7)'; ctx.lineWidth = 2; rr(ctx, 22, 22, w - 44, h - 44, 14); ctx.stroke();
    });
    const mat = this.add.container(W / 2, 470).setDepth(30);
    mat.add(this.add.image(0, 0, 'doormat'));
    const mono = txt(this, 0, -8, 'H+B', 68, { font: 'Pacifico', weight: '400', stroke: '#c4417f', strokeW: 6 }); goldText(mono); mat.add(mono);
    mat.add(txt(this, 0, 52, 'since 1998', 22, { color: '#8a3f78', weight: '600' }));
    mat.setScale(0); this.tweens.add({ targets: mat, scale: 1, duration: D(700), delay: D(500), ease: 'Back.easeOut' });

    let y = 620;
    const lines = txt(this, W / 2, y, 'The penthouse is open.\n29 years and every floor, together.', 30, { color: '#ffe9f4', weight: '600' }).setDepth(30);
    lines.setAlpha(0); this.tweens.add({ targets: lines, alpha: 1, duration: D(800), delay: D(1000) });
    y += 90;
    if (PENTHOUSE_NOTE) {
      const note = txt(this, W / 2, y + 16, PENTHOUSE_NOTE, 26, { font: 'Pacifico', weight: '400', color: '#7a2f62', wrap: 560 }).setDepth(31);
      const sig = txt(this, W / 2 + 150, y + 16 + note.height / 2 + 26, 'Gordon', 28, { font: 'Pacifico', weight: '400', color: '#c4417f' }).setDepth(31);
      const ch = note.height + 90;
      const card = this.add.graphics().setDepth(30);
      card.fillStyle(0xfff6ea, 0.97); card.fillRoundedRect(W / 2 - 310, y - note.height / 2 - 10, 620, ch, 22);
      card.lineStyle(3, 0xe9b94a, 1); card.strokeRoundedRect(W / 2 - 310, y - note.height / 2 - 10, 620, ch, 22);
      card.setAngle(0); [card, note, sig].forEach((o) => { o.setAlpha(0); this.tweens.add({ targets: o, alpha: 1, duration: D(900), delay: D(1600) }); });
      y += ch - 10;
    }
    txt(this, W / 2, y + 10, `Score ${G.run.score.toLocaleString('en-US')}   ★ ${starTotal()}   ${itemCount()}/12 treasures`, 24, { color: '#ffd9ec', weight: '600' }).setDepth(30);

    const by = H - 330;
    const unlocked = itemCount() >= SECRET_NEED;
    if (this.after !== 'dome') {
      if (unlocked) {
        const b = makeButton(this, W / 2, by, 500, 86, 'A secret door is glowing...', { fs: 28, c1: '#9fd8ff', c2: '#6f7dff' }, () => { G.mode = G.mode === 'duel' ? 'classic' : G.mode; G.run.floor = 8; this.scene.start('Game'); }); b.setDepth(30);
        if (!RM) this.tweens.add({ targets: b, scale: 1.05, duration: 600, yoyo: true, repeat: -1 });
      } else {
        txt(this, W / 2, by, `A door on the roof is locked.\nShelve ${SECRET_NEED} treasures to open it (${itemCount()}/${SECRET_NEED}).`, 22, { color: '#d9c9ff', weight: '600' }).setDepth(30);
      }
    }
    makeButton(this, W / 2 - 125, by + 110, 230, 76, 'Share', { fs: 28, c1: '#ffd38f', c2: '#f3a64a' }, () => shareCard(this)).setDepth(30);
    makeButton(this, W / 2 + 125, by + 110, 230, 76, 'Shelf', { fs: 28, c1: '#c9b2ff', c2: '#9b6dff' }, () => openShelf(this)).setDepth(30);
    makeButton(this, W / 2, by + 210, 480, 80, 'Back to the lobby', { fs: 28 }, () => { if (this.after !== 'dome') store.set('run_' + G.mode, null); this.scene.start('Title'); }).setDepth(30);
    window.JOE.ready = true; window.JOE.finale = true;
  }
}

window.JOE.state = () => {
  const s = window.JOE.scene, name = window.JOE.sceneName;
  const base = { scene: name, finale: !!window.JOE.finale, card: window.JOE.card || null, t: Object.assign({}, G.t), items: itemCount(), ach: Object.keys(META.ach), stars: starTotal(), countdown: window.JOE.countdown, overlay: !!(s && s.overlay) };
  if (!s || name !== 'Game' || !s.g || !s.g.length) return base;
  return Object.assign(base, {
    floor: s.fi, mode: G.mode, busy: !!s.busy, moves: s.moves, timeLeft: s.timeLeft, collected: Object.assign({}, s.collected), goals: FLOORS[s.fi].goals, reveal: s.reveal,
    grid: s.g.map((row) => row.map((p) => (p ? (p.special ? p.special + ':' + p.type : p.type) : null))),
    cloth: s.cloth ? s.cloth.map((row) => row.map((c) => !!c)) : null,
    tower: window.JOE.towerFloors, turbo: s.turbo, turboMeter: s.turboMeter, score: G.run.score, perks: Object.assign({}, G.run.perks), styles: Object.assign({}, G.run.styles), stats: Object.assign({}, G.stats),
    board: { BX, BY, CELL, N, W, H, OX, GW },
  });
};
window.JOE.moves = () => { const s = window.JOE.scene; return s && s.findMoves ? s.findMoves() : []; };

// =====================================================================
function boot() {
  window.JOE.game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', width: GW, height: H, backgroundColor: '#ffe4ef',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: false },
    scene: [Boot, Title, Game, Finale],
  });
}
const fontsReady = (document.fonts && document.fonts.load)
  ? Promise.race([Promise.all([document.fonts.load('700 40px Fredoka'), document.fonts.load('600 40px Fredoka'), document.fonts.load('400 40px Pacifico')]), new Promise((r) => setTimeout(r, 2500))])
  : Promise.resolve();
fontsReady.then(boot, boot);
})();
