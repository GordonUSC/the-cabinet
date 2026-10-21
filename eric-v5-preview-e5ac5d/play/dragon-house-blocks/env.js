// Dragon House in Blocks: the yard and a tiny Stoughton street, in voxels.
import { Vox } from './house.js';

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const ENV = { x0: -46, x1: 62, z0: -13, z1: 58 };
export const SIGN = { x: 11, z: 22 };

const G = {
  grass: [0x6f7d3c, 0x7a8743, 0x66733a, 0x74813f, 0x5f6c35],
  leaf: [0xd9541e, 0xe8862a, 0xf2b33d, 0xb8321f, 0xc9661f],
  walk: [0xc9c2b4, 0xbdb6a8], curb: 0xd8d2c4, asphalt: [0x3b3d42, 0x37393e], stripe: 0xe9c24a,
  paver: [0xa49a88, 0x918877], fence: 0xf1e8d4, trunk: 0x5b3b25, post: 0x6b4a2e, lampPost: 0x24382f,
  shore: 0x8a7a5c, sand: 0xb7a27a,
};

export function buildEnv() {
  const rand = mulberry32(327);
  const E = new Vox();
  const glow = [];       // emissive voxels that light at night (lamps, neighbor windows)
  const put = (x, y, z, c) => E.set(x, y, z, { c });
  const pick = (a) => a[Math.floor(rand() * a.length)];

  // ground layers
  for (let x = ENV.x0; x <= ENV.x1; x++) for (let z = ENV.z0; z <= ENV.z1; z++) {
    if (z >= 31 && z <= 37) { // street
      const stripe = z === 34 && ((x >> 1) % 2 === 0);
      put(x, -2, z, stripe ? G.stripe : pick(G.asphalt));
      continue;
    }
    let c;
    if ((z >= 27 && z <= 29) || (z >= 39 && z <= 41)) c = ((x + z) % 3 === 0) ? G.walk[1] : G.walk[0];
    else if (z === 30 || z === 38) c = G.curb;
    else if (z >= 19 && z <= 26 && x >= 4 && x <= 7) c = (((x >> 1) + z) % 2) ? G.paver[0] : G.paver[1];
    else if (z <= -11) c = z === -13 ? G.sand : G.shore;
    else c = rand() < 0.11 ? pick(G.leaf) : pick(G.grass);
    put(x, -1, z, c);
    if (z === ENV.z0) put(x, -2, z, G.shore); // shore lip down to the water
  }

  // picket fence along the front yard, open at the path
  for (let x = -20; x <= 34; x++) {
    if (x >= 4 && x <= 7) continue;
    put(x, 0, 26, G.fence);
    if (x % 2 === 0) put(x, 1, 26, G.fence);
  }

  // street lamps, warm at night
  for (const lx of [-14, 1, 16, 31, 46]) {
    for (let y = 0; y <= 6; y++) put(lx, y, 28, G.lampPost);
    glow.push({ x: lx, y: 7, z: 28, c: 0xfff1d0, delay: 0.1 + (lx + 14) * 0.008, lamp: true });
    put(lx, 8, 28, G.lampPost);
  }

  // autumn maples
  const trees = [];
  const tree = (tx, tz, h, r) => {
    trees.push({ x: tx + 0.5, y: h + 1, z: tz + 0.5, r });
    for (let y = 0; y < h; y++) put(tx, y, tz, G.trunk);
    const cy = h + r * 0.6;
    for (let x = Math.floor(tx - r - 1); x <= tx + r + 1; x++)
      for (let y = Math.floor(cy - r); y <= cy + r; y++)
        for (let z = Math.floor(tz - r - 1); z <= tz + r + 1; z++) {
          const d = Math.hypot(x - tx, (y - cy) * 1.15, z - tz);
          if (d <= r + (rand() - 0.5) * 0.9 && !(d < r - 1.6)) put(x, y, z, pick(G.leaf));
        }
  };
  tree(-9, 4, 5, 3.6); tree(-14, 19, 4, 3.0); tree(23, -3, 6, 4.0); tree(26, 15, 5, 3.4);
  tree(-23, -6, 6, 4.2); tree(41, 19, 5, 3.3); tree(-36, 20, 5, 3.6); tree(11, -9, 5, 3.2);
  tree(-5, 47, 5, 3.4); tree(17, 46, 4, 3.0); tree(51, 46, 5, 3.6); tree(-41, 47, 5, 3.2);
  tree(44, -8, 6, 4.0); tree(-44, 2, 5, 3.4);

  // tiny neighbors on our side and across the street (the little town)
  const walls = [0xefe4ca, 0x8fa58a, 0xb5523f, 0xd8a94a, 0xf4f1e8, 0x7d93ad, 0xc98b6b];
  const roofs = [0x3e4148, 0x5a3b33, 0x2f3d4a, 0x4a4d55];
  const house = (x0, z0, w, d, h, facing, wc, rc, delay0) => {
    for (let y = 0; y < h; y++) for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
      const edge = x === x0 || x === x0 + w - 1 || z === z0 || z === z0 + d - 1;
      if (!edge) continue;
      const front = facing < 0 ? z === z0 : z === z0 + d - 1;
      const isWin = (y === 2 || y === 5) && h > 5 ? true : (y === 2);
      const along = front ? x - x0 : (x === x0 || x === x0 + w - 1) ? z - z0 : -1;
      const winCell = isWin && along > 0 && along < (front ? w - 1 : d - 1) && (along % 2 === 1);
      if (winCell && (front || x === x0 || x === x0 + w - 1)) {
        glow.push({ x, y, z, c: 0xffd28a, delay: delay0 + rand() * 2.2 });
      } else {
        put(x, y, z, (front && y === 0 && x === x0 + (w >> 1)) ? 0x6b4a2e : wc);
      }
    }
    // stepped gable roof, ridge along x
    for (let k = 0; ; k++) {
      const za = z0 - 1 + k, zb = z0 + d - k;
      if (za > zb) break;
      for (let x = x0 - 1; x <= x0 + w; x++) {
        put(x, h + k, za, rc); if (zb !== za) put(x, h + k, zb, rc);
      }
      if (za === zb || za + 1 === zb) break;
      for (let z = za + 1; z < zb; z++) { put(x0, h + k, z, wc); put(x0 + w - 1, h + k, z, wc); }
    }
  };
  let i = 0;
  for (const [x0, z0] of [[-34, 1], [32, 2]]) house(x0, z0, 9, 9, 6, 1, walls[i % 7], roofs[i++ % 4], 0.6 + i * 0.4);
  for (const x0 of [-38, -26, -14, 24, 36, 48]) {
    house(x0, 44, 8, 8, x0 % 3 === 0 ? 6 : 4, -1, walls[i % 7], roofs[i % 4], 0.8 + i * 0.35); i++;
  }

  // the Gordtopia signpost (board itself is a textured panel added in main.js)
  for (let y = 0; y <= 3; y++) { put(SIGN.x - 3, y, SIGN.z, G.post); put(SIGN.x + 3, y, SIGN.z, G.post); }

  return { E, glow, trees };
}
