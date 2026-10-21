// Dragon House in Blocks: the voxel model.
// A stylized Queen Anne in the spirit of the Iverson-Johnson House (1898, A. E. Ovren).
// Sourced from Gordon's photos: blue clapboard, cream trim, wraparound porch.
// Everything else in the massing is a voxel stylization, not a claim about the house.
// Pure data, no three.js, so it can be checked in node.

export const TX = 0, TZ = 12, TR = 3.7, B = 3;

export const P = {
  siding: 0x5a6c80, siding2: 0x4f6074, trim: 0xefe4ca, trim2: 0xd8caa6,
  roof: 0x3e4148, roof2: 0x35383e, roof3: 0x4a4d55,
  stone: [0x8d877b, 0x7a766c, 0x9c968a, 0x6f6b62],
  deck: 0x4b5765, deck2: 0x434e5b, lattice: 0x3a4843,
  door: 0x8b5a2f, frame: 0x6e2232, glass: 0x223042,
  brick: 0x8e3b2e, brick2: 0x7a3125, gold: 0xd9a441, teal: 0x0f6b5a,
  pumpkin: 0xe8781e, scaleA: 0xece1c6, scaleB: 0xd5c49c,
  flowerA: 0xe0533a, flowerB: 0xf2c14e, sage: 0x6f8a6a, orn: 0x8a2b2b,
};

export const STAGES = [
  'Stone foundation', 'Porch deck and steps', 'First floor, sill course',
  'First floor, window course', 'First floor, belt course', 'Porch columns and railing',
  'Porch roof', 'Second floor, sill course', 'Second floor, window course',
  'Second floor, frieze', 'Corner, upper courses', 'Gable ends',
  'Main roof, eaves', 'Main roof, middle', 'Main roof, ridge', 'Front gable roof',
  'Roofline details', 'Corner roof, lower', 'Corner roof, upper', 'Peak and flag',
];

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class Vox {
  constructor() { this.map = new Map(); }
  key(x, y, z) { return ((x + 128) << 16) | ((y + 128) << 8) | (z + 128); }
  set(x, y, z, v) { v.x = x; v.y = y; v.z = z; this.map.set(this.key(x, y, z), v); }
  get(x, y, z) { return this.map.get(this.key(x, y, z)); }
  del(x, y, z) { this.map.delete(this.key(x, y, z)); }
  values() { return [...this.map.values()]; }
}

function stageOf(v) {
  switch (v.part) {
    case 'found': return 0;
    case 'deck': return 1;
    case 'wall': return v.y <= 5 ? 2 : v.y <= 8 ? 3 : v.y <= 11 ? 4 : v.y <= 14 ? 7 : v.y <= 17 ? 8 : 9;
    case 'porchcol': return 5;
    case 'porchroof': return 6;
    case 'tower': return 10;
    case 'gable': return 11;
    case 'roof': return v.k <= 2 ? 12 : v.k <= 5 ? 13 : 14;
    case 'xroof': return 15;
    case 'chimney': return 16;
    case 'cone': return v.j <= 4 ? 17 : 18;
    case 'finial': return 19;
  }
  return 0;
}

export function buildHouse() {
  const rand = mulberry32(1898);
  const H = new Vox();
  const put = (x, y, z, c, part, o = {}) => H.set(x, y, z, Object.assign({ c, part }, o));
  const putIfEmpty = (x, y, z, c, part, o = {}) => { if (!H.get(x, y, z)) put(x, y, z, c, part, o); };
  const dT = (x, z) => Math.hypot(x - TX, z - TZ);
  const inDisc = (x, z) => dT(x, z) < TR;
  const isRing = (x, z) => { const d = dT(x, z); return d <= TR && d > TR - 1.25; };
  const inBody = (x, z) => x >= 0 && x <= 15 && z >= 0 && z <= 12;
  const bodyEdge = (x, z) => inBody(x, z) && (x === 0 || x === 15 || z === 0 || z === 12) && !inDisc(x, z);
  const angOf = (x, z) => { let a = Math.atan2(z - TZ, x - TX) * 180 / Math.PI; if (a < 0) a += 360; return a; };
  const angDiff = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
  const stone = () => P.stone[Math.floor(rand() * 4)];
  const fish = (u, y) => (((u + y) % 2) + 2) % 2 === 0 ? P.scaleA : P.scaleB;

  // foundation (stone), under body walls and turret
  for (let x = -5; x <= 16; x++) for (let z = -1; z <= 17; z++) {
    if (bodyEdge(x, z) || isRing(x, z)) for (let y = 0; y < B; y++) put(x, y, z, stone(), 'found');
  }

  // walls: clapboard rows, cream corner boards and belt courses
  const wallCol = (x, y, z, tower) => {
    if (y === 11 || y === 20) return P.trim;
    if (!tower && (x === 0 || x === 15) && (z === 0 || z === 12)) return P.trim;
    return (y % 2) ? P.siding : P.siding2;
  };
  for (let y = B; y <= 20; y++) for (let x = -5; x <= 16; x++) for (let z = -1; z <= 17; z++) {
    if (bodyEdge(x, z)) put(x, y, z, wallCol(x, y, z, false), 'wall');
    else if (isRing(x, z)) put(x, y, z, wallCol(x, y, z, true), 'wall');
  }
  // turret rises above the eaves in fish-scale shingles
  for (let y = 21; y <= 24; y++) for (let x = -5; x <= 5; x++) for (let z = 7; z <= 17; z++) {
    if (isRing(x, z)) put(x, y, z, y === 24 ? P.trim : fish(Math.round(angOf(x, z) / 18), y), 'tower');
  }

  // windows: burgundy sash (an accent the palette can repaint), glass inside
  let wid = 0;
  const facePos = (f, a, y) => f === 'zf' ? [a, y, 12] : f === 'zb' ? [a, y, 0] : f === 'xe' ? [15, y, a] : [0, y, a];
  const win = (f, a0, y0, w, h, part) => {
    const id = wid++;
    for (let a = a0 - 1; a <= a0 + w; a++) for (let y = y0 - 1; y <= y0 + h; y++) {
      const [x, yy, z] = facePos(f, a, y);
      const inner = a >= a0 && a < a0 + w && y >= y0 && y < y0 + h;
      if (inner) put(x, yy, z, P.glass, part, { glass: true, wid: id });
      else put(x, yy, z, P.frame, part, { accent: 'frame', fw: id });
    }
    return id;
  };
  win('zf', 11, 4, 2, 4, 'wall');
  win('zf', 11, 13, 2, 4, 'wall'); win('zf', 6, 13, 2, 4, 'wall');
  win('xe', 3, 4, 2, 4, 'wall'); win('xe', 8, 4, 2, 4, 'wall'); win('xe', 3, 13, 2, 4, 'wall'); win('xe', 8, 13, 2, 4, 'wall');
  win('xw', 3, 4, 2, 4, 'wall'); win('xw', 3, 13, 2, 4, 'wall');
  win('zb', 4, 4, 2, 4, 'wall'); win('zb', 10, 4, 2, 4, 'wall'); win('zb', 4, 13, 2, 4, 'wall'); win('zb', 10, 13, 2, 4, 'wall');
  // turret windows facing the street, the corner, and the side yard
  for (const ang of [90, 135, 180]) for (const [y0, y1] of [[4, 7], [13, 16]]) {
    const id = wid++;
    for (let x = -5; x <= 5; x++) for (let z = 7; z <= 17; z++) {
      if (!isRing(x, z)) continue;
      const da = angDiff(angOf(x, z), ang);
      for (let y = y0 - 1; y <= y1 + 1; y++) {
        if (da < 13 && y >= y0 && y <= y1) put(x, y, z, P.glass, 'wall', { glass: true, wid: id });
        else if (da < 25) put(x, y, z, P.frame, 'wall', { accent: 'frame', fw: id });
      }
    }
  }
  // front door with cream trim and a lit pane
  const doorWid = wid++;
  for (let x = 4; x <= 7; x++) for (let y = B; y <= 8; y++) {
    if (x === 4 || x === 7 || y === 8) put(x, y, 12, P.trim, 'wall');
    else if (y === 6) put(x, y, 12, P.glass, 'wall', { glass: true, wid: doorWid });
    else put(x, y, 12, P.door, 'wall');
  }
  // flower boxes under the front windows
  for (let x = 9; x <= 15; x++) {
    put(x, 3, 13, P.frame, 'wall', { accent: 'box' });
    if (x % 2 === 0) put(x, 4, 13, (x % 4 === 0) ? P.flowerA : P.flowerB, 'wall');
  }

  // round wraparound porch
  const porchCell = (x, z) => {
    if (inBody(x, z) || dT(x, z) < TR || z < 7 || z > 16) return false;
    return (x >= -1 && x <= 10 && z >= 13) || dT(x, z) <= 6.6;
  };
  const cells = [];
  for (let x = -8; x <= 12; x++) for (let z = 5; z <= 18; z++) if (porchCell(x, z)) cells.push([x, z]);
  const solidNeighbor = (x, z) => porchCell(x, z) || inBody(x, z) || dT(x, z) < TR;
  const perim = cells.filter(([x, z]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !solidNeighbor(x + dx, z + dz)));
  const isGap = (x, z) => z === 16 && x >= 4 && x <= 7;
  const colSet = new Set();
  for (const x of [0, 3, 8, 10]) colSet.add(x + ',16');
  colSet.add('10,13');
  for (const ang of [125, 160, 195, 230]) {
    let best = null, bd = 1e9;
    for (const [x, z] of perim) { if (dT(x, z) < 5) continue; const d = angDiff(angOf(x, z), ang); if (d < bd) { bd = d; best = [x, z]; } }
    if (best && bd < 10) colSet.add(best.join(','));
  }
  for (const [x, z] of cells) {
    put(x, 2, z, x % 2 ? P.deck : P.deck2, 'deck');
    put(x, 8, z, P.trim, 'porchroof');
    put(x, 9, z, P.roof2, 'porchroof');
    const inner = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => solidNeighbor(x + dx, z + dz));
    if (inner) put(x, 10, z, P.roof, 'porchroof');
  }
  for (const [x, z] of perim) {
    for (let y = 0; y <= 1; y++) put(x, y, z, P.lattice, 'deck');
    const key = x + ',' + z;
    if (colSet.has(key)) { for (let y = 3; y <= 7; y++) put(x, y, z, P.trim, 'porchcol'); continue; }
    if (isGap(x, z)) continue;
    if ((x + z) % 2 === 0) put(x, 3, z, P.trim, 'porchcol');
    put(x, 4, z, P.trim, 'porchcol');
    if ((x + z) % 2 === 0) put(x, 7, z, ((x + z) >> 1) % 2 ? P.teal : P.gold, 'porchroof', { accent: 'bunting' });
  }
  // pediment over the steps, with its carved ornament
  const ped = [[8, 2, 9], [9, 2, 9], [10, 3, 8], [11, 4, 7], [12, 5, 6]];
  for (const [y, a, b] of ped) for (let x = a; x <= b; x++) put(x, y, 16, y === 8 ? P.trim2 : P.trim, 'porchroof');
  put(5, 10, 16, P.orn, 'porchroof'); put(6, 10, 16, P.orn, 'porchroof');
  put(4, 10, 16, P.sage, 'porchroof'); put(7, 10, 16, P.sage, 'porchroof');
  for (const [y, a, b] of [[10, 3, 8], [11, 4, 7], [12, 5, 6]]) for (let x = a; x <= b; x++) put(x, y, 15, y === 12 ? P.roof3 : P.roof, 'porchroof');
  for (const [y, a, b] of [[11, 4, 7], [12, 5, 6]]) for (let x = a; x <= b; x++) put(x, y, 14, P.roof, 'porchroof');
  // steps and pumpkins
  for (let x = 4; x <= 7; x++) { put(x, 1, 17, P.deck, 'deck'); put(x, 0, 17, P.trim2, 'deck'); put(x, 0, 18, P.deck, 'deck'); }
  put(4, 2, 17, P.pumpkin, 'deck'); put(7, 1, 18, P.pumpkin, 'deck'); put(9, 3, 15, P.pumpkin, 'deck'); put(-3, 3, 14, P.pumpkin, 'deck');

  // main side-gable roof (stepped), wrapping around the turret
  const hk = (x) => 21 + Math.min(x - 7, 16 - x);
  for (let k = 0; k <= 7; k++) {
    const y = 21 + k, z1 = -1 + k, z2 = 13 - k;
    for (let x = -1; x <= 16; x++) for (const z of (z1 === z2 ? [z1] : [z1, z2])) {
      if (dT(x, z) < TR + 0.3 && y <= 24) continue;
      if (x >= 7 && x <= 16 && z >= 6 && y <= hk(x)) continue; // under the front cross gable
      put(x, y, z, k === 7 ? P.roof3 : (k % 2 ? P.roof : P.roof2), 'roof', { k });
    }
  }
  // fish-scale gable ends
  for (let k = 0; k <= 6; k++) {
    const y = 21 + k;
    for (let z = k; z <= 12 - k; z++) for (const x of [0, 15]) if (!inDisc(x, z)) put(x, y, z, fish(z, y), 'gable');
  }
  // front cross gable
  for (let k = 0; k <= 3; k++) for (let x = 8 + k; x <= 15 - k; x++) put(x, 21 + k, 12, fish(x, 21 + k), 'gable');
  win('zf', 11, 22, 2, 1, 'gable');
  for (let k = 0; k <= 4; k++) for (let z = 6; z <= 13; z++) for (const x of [7 + k, 16 - k]) put(x, 21 + k, z, k === 4 ? P.roof3 : (k % 2 ? P.roof : P.roof2), 'xroof');

  // brick chimney
  for (let y = 21; y <= 31; y++) for (const [x, z] of [[12, 3], [13, 3], [12, 4], [13, 4]]) putIfEmpty(x, y, z, (y + x) % 2 ? P.brick : P.brick2, 'chimney');
  for (const [x, z] of [[12, 3], [13, 3], [12, 4], [13, 4]]) put(x, 32, z, P.roof3, 'chimney');

  // turret cone and finial
  for (let j = 0; j <= 9; j++) {
    const r = (TR + 1.1) * (1 - j / 9.6);
    for (let x = -6; x <= 6; x++) for (let z = 6; z <= 18; z++) {
      const d = dT(x, z);
      if (d <= r && d > r - 1.35) put(x, 25 + j, z, j % 2 ? P.roof : P.roof2, 'cone', { j });
    }
  }
  put(TX, 35, TZ, P.gold, 'finial'); put(TX, 36, TZ, P.gold, 'finial');

  const list = H.values();
  for (const v of list) v.stage = stageOf(v);
  return { H, list, windowCount: wid, doorWid };
}
