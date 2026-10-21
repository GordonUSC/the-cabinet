// Dragon House in Blocks. A gift for Eric, from Gordon.
// three.js r170 (vendored, pinned). Art: Higgsfield. Sound and music: ElevenLabs. Code only assembles.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { buildHouse, STAGES, TX, TZ, P } from './house.js';
import { buildEnv, SIGN } from './env.js';

const $ = (s) => document.querySelector(s);
const mqRM = matchMedia('(prefers-reduced-motion: reduce)');
let RM = mqRM.matches;
mqRM.addEventListener?.('change', (e) => { RM = e.matches; });
const COARSE = matchMedia('(pointer: coarse)').matches;
const IS_PHONE = COARSE && Math.min(screen.width, screen.height) < 820;
const QS = new URLSearchParams(location.search);

const hash3 = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const fmt = (n) => n.toLocaleString('en-US');

// ---------------------------------------------------------------- palettes
const PALETTES = {
  house: { name: 'House', colors: null, sw: ['#6e2232', '#efe4ca'] },
  james: { name: 'James', colors: [0x8c1c3a], sw: ['#8c1c3a', '#8c1c3a'] },
  henry: { name: 'Henry', colors: [0xd23a2e, 0x2f8a45], sw: ['#d23a2e', '#2f8a45'] },
  oscar: { name: 'Oscar', colors: [0xf08a24, 0x2f6fd6], sw: ['#f08a24', '#2f6fd6'] },
  dragon: { name: 'Dragon', colors: [0x0f6b5a, 0xd9a441], sw: ['#0f6b5a', '#d9a441'] },
};
let palKey = 'house';
const FOLK_COLORS = [0x8c1c3a, 0xd23a2e, 0x2f8a45, 0xf08a24, 0x2f6fd6, 0x0f6b5a, 0xd9a441, 0xefe4ca, 0x5a6c80, 0x7a4b8c];
const FW_COLORS = [[0xff4d7a, 0xffd0dc], [0xff4433, 0x4dff7a], [0xffa033, 0x4d9dff], [0x3dffd8, 0xffd56b], [0xfff2d0, 0xffd56b]];

// ---------------------------------------------------------------- renderer
const canvas = $('#c');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false });
} catch (e) {
  document.documentElement.classList.add('nogl');
  throw e;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.info.autoReset = false;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2c8a0);
scene.fog = new THREE.FogExp2(0xf2c8a0, 0.0026);
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 900);
const target = new THREE.Vector3(7.5, 12, 8);

const controls = new OrbitControls(camera, canvas);
controls.target.copy(target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 22; controls.maxDistance = 170;
controls.minPolarAngle = 0.18; controls.maxPolarAngle = 1.47;
controls.enablePan = true; controls.screenSpacePanning = true;
controls.rotateSpeed = 0.7; controls.zoomSpeed = 0.9;
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

// ---------------------------------------------------------------- textures
const loader = new THREE.TextureLoader();
const loadTex = (u) => new Promise((res) => loader.load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, () => res(null)));

// ---------------------------------------------------------------- lights
const hemi = new THREE.HemisphereLight(0xb9d4ff, 0x6b5a3a, 0.9);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd2a1, 3.0);
sun.castShadow = true;
sun.shadow.camera.left = -42; sun.shadow.camera.right = 42; sun.shadow.camera.top = 42; sun.shadow.camera.bottom = -42;
sun.shadow.camera.near = 5; sun.shadow.camera.far = 220;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
sun.target.position.copy(target).setY(4);
scene.add(sun, sun.target);
const porchLight = new THREE.PointLight(0xffb36b, 0, 22, 2);
porchLight.position.set(5.5, 6.5, 15);
scene.add(porchLight);
const flash = new THREE.PointLight(0xffffff, 0, 140, 1.4);
scene.add(flash);

// ---------------------------------------------------------------- sky backdrop
const skyUniforms = { tDay: { value: null }, tNight: { value: null }, uNight: { value: 0 } };
const skyMat = new THREE.ShaderMaterial({
  uniforms: skyUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDay; uniform sampler2D tNight; uniform float uNight; varying vec2 vUv;
    void main(){ vec3 d=texture2D(tDay,vUv).rgb; vec3 n=texture2D(tNight,vUv).rgb; gl_FragColor=vec4(mix(d,n,uNight),1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
});
const SKY_R = 330, SKY_H = SKY_R * 2 * Math.PI * 576 / 2688;
const sky = new THREE.Mesh(new THREE.CylinderGeometry(SKY_R, SKY_R, SKY_H, 96, 1, true), skyMat);
sky.position.y = -0.6 - 0.16 * SKY_H + SKY_H / 2;
sky.renderOrder = -10;
sky.userData.noAO = true;
scene.add(sky);
const skyCap = new THREE.Mesh(new THREE.CircleGeometry(SKY_R, 48), new THREE.MeshBasicMaterial({ color: 0x9fb7d8, side: THREE.DoubleSide, fog: false }));
skyCap.rotation.x = Math.PI / 2; skyCap.position.y = sky.position.y + SKY_H / 2 - 0.5; skyCap.userData.noAO = true;
scene.add(skyCap);

// water
const waterU = { uTime: { value: 0 } };
const waterMat = new THREE.MeshStandardMaterial({ color: 0x2f5f7c, roughness: 0.04, metalness: 0.0, envMapIntensity: 1.6 });
waterMat.onBeforeCompile = (sh) => {
  sh.uniforms.uTime = waterU.uTime;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
    .replace('#include <project_vertex>', '#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uTime;')
    .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      vec3 wp=vec3(sin(vWP.x*0.11+vWP.z*0.05+uTime*0.6)*0.025+sin(vWP.z*0.31+uTime*1.1)*0.012,0.0,cos(vWP.z*0.17+uTime*0.7)*0.03+cos(vWP.x*0.23-uTime*0.9)*0.012);
      normal=normalize(normal+(viewMatrix*vec4(wp,0.0)).xyz);`);
};
const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 340), waterMat);
water.rotation.x = -Math.PI / 2; water.position.set(0, -0.6, -13 - 170);
water.receiveShadow = true; water.userData.noAO = true;
scene.add(water);
// far ground beyond the voxel lots
const farMat = new THREE.MeshStandardMaterial({ color: 0x5f6b36, roughness: 1 });
const FAR_DAY = new THREE.Color(0x5f6b36), FAR_NIGHT = new THREE.Color(0x1d2a22);
for (const [cx, cz, w, d] of [[0, 58 + 150, 900, 300], [-46 - 200, 22, 400, 72], [62 + 200, 22, 400, 72]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), farMat);
  m.rotation.x = -Math.PI / 2; m.position.set(cx, -0.04, cz); m.receiveShadow = true; scene.add(m);
}

// ---------------------------------------------------------------- voxel mesher (face culling + baked AO)
const AOV = [0.52, 0.7, 0.85, 1.0];
function meshVoxels(list, occ, opt = {}) {
  const pos = [], nor = [], col = [], idx = [], ext = [];
  let vi = 0;
  const tc = new THREE.Color();
  const corners = [[[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0], [0, 1], [1, 1], [1, 0]]];
  for (const v of list) {
    tc.setHex(opt.colorOf ? opt.colorOf(v) : v.c);
    const jit = opt.flat ? 1 : 0.93 + hash3(v.x, v.y, v.z) * 0.12;
    for (let d = 0; d < 3; d++) for (const s of [1, -1]) {
      if (opt.noBottom && d === 1 && s === -1) continue;
      const n = [0, 0, 0]; n[d] = s;
      if (occ(v.x + n[0], v.y + n[1], v.z + n[2])) continue;
      const u = (d + 1) % 3, w = (d + 2) % 3;
      const ao = [];
      for (const [cu, cv] of corners[s > 0 ? 0 : 1]) {
        const p = [v.x, v.y, v.z]; if (s > 0) p[d] += 1; p[u] += cu; p[w] += cv;
        pos.push(p[0], p[1], p[2]); nor.push(n[0], n[1], n[2]);
        const f = [v.x + n[0], v.y + n[1], v.z + n[2]];
        const a = f.slice(); a[u] += cu ? 1 : -1;
        const b = f.slice(); b[w] += cv ? 1 : -1;
        const c = f.slice(); c[u] += cu ? 1 : -1; c[w] += cv ? 1 : -1;
        const s1 = occ(a[0], a[1], a[2]) ? 1 : 0, s2 = occ(b[0], b[1], b[2]) ? 1 : 0, s3 = occ(c[0], c[1], c[2]) ? 1 : 0;
        const lvl = (s1 && s2) ? 0 : 3 - (s1 + s2 + s3);
        ao.push(lvl);
        const k = AOV[lvl] * jit;
        col.push(tc.r * k, tc.g * k, tc.b * k);
        if (opt.extra) ext.push(opt.extra(v));
      }
      if (ao[0] + ao[2] > ao[1] + ao[3]) idx.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3);
      else idx.push(vi + 1, vi + 2, vi + 3, vi + 1, vi + 3, vi);
      vi += 4;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  if (opt.extra) g.setAttribute(opt.extraName, new THREE.Float32BufferAttribute(ext, 1));
  g.setIndex(vi > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- the house
const { H, list: HV, windowCount } = buildHouse();
const NSTAGE = STAGES.length;
HV.forEach((v, i) => { v.i = i; });
const byStage = Array.from({ length: NSTAGE }, () => []);
for (const v of HV) byStage[v.stage].push(v);
const stageCenter = byStage.map((l) => { const c = new THREE.Vector3(); for (const v of l) c.add(new THREE.Vector3(v.x + 0.5, v.y + 0.5, v.z + 0.5)); return c.divideScalar(Math.max(1, l.length)); });

const houseMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0.0 });
const stageMeshes = new Array(NSTAGE).fill(null);

// glass: one merged mesh, each window revealed and lit by uniform
const winPlaced = new Array(32).fill(0), winLit = new Array(32).fill(0);
const glassMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12, metalness: 0.15, envMapIntensity: 1.3 });
glassMat.onBeforeCompile = (sh) => {
  sh.uniforms.uPlaced = { value: winPlaced }; sh.uniforms.uLit = { value: winLit };
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aWid; uniform float uPlaced[32]; uniform float uLit[32]; varying float vLit;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nint wi=int(aWid+0.5); vLit=uLit[wi]; if(uPlaced[wi]<0.5) transformed=vec3(0.0);');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLit;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0,0.68,0.34)*vLit*2.4;');
};
glassMat.customProgramCacheKey = () => 'glass';
const glassVox = HV.filter((v) => v.glass);
const glassMesh = new THREE.Mesh(meshVoxels(glassVox, (x, y, z) => !!H.get(x, y, z), { flat: true, extra: (v) => v.wid, extraName: 'aWid' }), glassMat);
glassMesh.userData.noAO = true;
glassMesh.receiveShadow = true;
scene.add(glassMesh);

// pop layer: blocks in flight
const popGeo = new THREE.BoxGeometry(1, 1, 1);
const popMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 });
const pop = new THREE.InstancedMesh(popGeo, popMat, HV.length);
pop.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
pop.setColorAt(0, new THREE.Color());
pop.instanceColor.setUsage(THREE.DynamicDrawUsage);
pop.count = 0; pop.castShadow = true; pop.frustumCulled = false;
scene.add(pop);
const active = []; // {v, t0, c}

// ghost blueprint
const ghostU = { uStage: { value: 0 }, uTime: { value: 0 }, uColor: { value: new THREE.Color(0x7fdcff) }, uFuture: { value: 0.085 }, uBright: { value: 1.0 } };
const ghostMat = new THREE.ShaderMaterial({
  uniforms: ghostU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  vertexShader: `attribute float aStage; uniform float uStage; uniform float uTime; varying vec2 vUv; varying float vSt; varying float vPh;
    void main(){ vUv=uv; float st=aStage-uStage; vSt=st;
      if(st<-0.5){ gl_Position=vec4(2.0,2.0,2.0,1.0); return; }
      vec4 ip=instanceMatrix*vec4(0.0,0.0,0.0,1.0); vPh=ip.y*0.35+ip.x*0.07;
      float s = st<0.5 ? 1.045+0.025*sin(uTime*4.0+vPh) : 1.0;
      gl_Position=projectionMatrix*viewMatrix*modelMatrix*instanceMatrix*vec4(position*s,1.0); }`,
  fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uFuture; uniform float uBright; varying vec2 vUv; varying float vSt; varying float vPh;
    void main(){ vec2 e2=min(vUv,1.0-vUv); float e=min(e2.x,e2.y); float w=fwidth(e)*1.3;
      float line=1.0-smoothstep(0.035,0.035+w,e);
      float a;
      if(vSt<0.5){ float pulse=0.62+0.38*sin(uTime*3.2-vPh); a=(line*0.95+0.13)*pulse*uBright; }
      else { a=line*uFuture*(1.0/(1.0+vSt*0.18)); }
      if(a<0.004) discard;
      gl_FragColor=vec4(uColor*a*(vSt<0.5?1.7:1.0),a); }`,
});
const ghost = new THREE.InstancedMesh(popGeo, ghostMat, HV.length);
{
  const m = new THREE.Matrix4(); const st = new Float32Array(HV.length);
  HV.forEach((v, i) => { m.makeTranslation(v.x + 0.5, v.y + 0.5, v.z + 0.5); ghost.setMatrixAt(i, m); st[i] = v.stage; });
  popGeo.setAttribute('aStage', new THREE.InstancedBufferAttribute(st, 1));
}
ghost.frustumCulled = false; ghost.renderOrder = 5; ghost.userData.noAO = true;
ghost.computeBoundingSphere();
scene.add(ghost);

// hanging emblem sign and flag (the real emblem art)
const emblemGroup = new THREE.Group();
const flagGroup = new THREE.Group();
let flagMat = null;
async function buildEmblems() {
  const seal = await loadTex('media/seal.png');
  if (!seal) return;
  const sMat = new THREE.MeshStandardMaterial({ map: seal, transparent: true, alphaTest: 0.4, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5 * 368 / 524), sMat);
  sign.position.set(6.0, 6.35, 14.6); sign.castShadow = true;
  const chainMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.4, metalness: 0.6 });
  for (const dx of [-0.75, 0.75]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), chainMat); c.position.set(6 + dx, 7.55, 14.6); emblemGroup.add(c); }
  emblemGroup.add(sign);
  emblemGroup.visible = false; scene.add(emblemGroup);
  // flag: cream field, the emblem centered, waving
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 420;
  const g = cv.getContext('2d'); g.fillStyle = '#f3ead6'; g.fillRect(0, 0, 640, 420);
  g.fillStyle = '#0f6b5a'; g.fillRect(0, 0, 640, 26); g.fillRect(0, 394, 640, 26);
  const img = seal.image; g.drawImage(img, 120, 70, 400, 400 * 368 / 524);
  const ft = new THREE.CanvasTexture(cv); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 4;
  flagMat = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.75, side: THREE.DoubleSide });
  flagMat.userData.t = { value: 0 };
  flagMat.onBeforeCompile = (sh) => {
    sh.uniforms.uT = flagMat.userData.t;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uT;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat fx=position.x+2.0; transformed.z+=sin(fx*1.6-uT*4.0)*0.22*fx/4.0; transformed.y+=sin(fx*1.1-uT*3.0)*0.08*fx/4.0;');
  };
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.62, 24, 10), flagMat);
  flag.position.set(TX + 0.5 + 2.05, 40.6, TZ + 0.5); flag.castShadow = true;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 6.4, 8), chainMat);
  pole.position.set(TX + 0.5, 39.2, TZ + 0.5);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), chainMat); knob.position.set(TX + 0.5, 42.5, TZ + 0.5);
  flagGroup.add(flag, pole, knob); flagGroup.visible = false; scene.add(flagGroup);
}

// ---------------------------------------------------------------- environment
const { E, glow: GLOW, trees: TREES } = buildEnv();
const envOcc = (x, y, z) => !!E.get(x, y, z) || !!H.get(x, y, z) && y < 3;
const envMesh = new THREE.Mesh(meshVoxels(E.values(), (x, y, z) => !!E.get(x, y, z), { noBottom: true }), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));
envMesh.castShadow = true; envMesh.receiveShadow = true;
scene.add(envMesh);
const glowU = { uNight: { value: 0 }, uNightT: { value: 0 } };
const glowMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, emissive: 0x000000 });
glowMat.onBeforeCompile = (sh) => {
  sh.uniforms.uNight = glowU.uNight; sh.uniforms.uNightT = glowU.uNightT;
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aDelay; uniform float uNight; uniform float uNightT; varying float vLit;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLit=uNight*clamp((uNightT-aDelay)*2.5,0.0,1.0);');
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLit;')
    .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb*vLit*2.2;');
};
glowMat.customProgramCacheKey = () => 'glow';
const glowSet = new Map(GLOW.map((g) => [`${g.x},${g.y},${g.z}`, g]));
const glowMesh = new THREE.Mesh(meshVoxels(GLOW, (x, y, z) => !!E.get(x, y, z) || glowSet.has(`${x},${y},${z}`), { flat: true, extra: (v) => v.delay, extraName: 'aDelay' }), glowMat);
glowMesh.userData.noAO = true;
scene.add(glowMesh);

// Gordtopia sign board
let signMesh = null;
async function buildSign() {
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); await document.fonts.load('400 110px "Young Serif"'); await document.fonts.load('600 60px "Instrument Sans"'); } catch (e) { /* draw with fallbacks */ }
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 400;
  const g = cv.getContext('2d');
  const wood = g.createLinearGradient(0, 0, 0, 400); wood.addColorStop(0, '#7a5232'); wood.addColorStop(1, '#5e3d24');
  g.fillStyle = wood; g.fillRect(0, 0, 1024, 400);
  g.globalAlpha = 0.18; g.fillStyle = '#2b1a0e';
  for (let y = 0; y < 400; y += 50) g.fillRect(0, y, 1024, 3);
  g.globalAlpha = 1; g.strokeStyle = '#d9a441'; g.lineWidth = 10; g.strokeRect(18, 18, 988, 364);
  g.fillStyle = '#f3ead6'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '400 112px "Young Serif", Georgia, serif'; g.fillText('GORDTOPIA', 512, 165, 900);
  g.fillStyle = '#ffd98a'; g.font = 'italic 600 66px "Instrument Sans", system-ui, sans-serif'; g.fillText('All Roads Lead Home', 512, 290);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  signMesh = new THREE.Mesh(new THREE.BoxGeometry(7.6, 2.95, 0.3), [mat, mat, mat, mat, mat, new THREE.MeshStandardMaterial({ color: 0x5e3d24 })]);
  signMesh.position.set(SIGN.x + 0.5, 3.4, SIGN.z + 1.25); signMesh.castShadow = true;
  scene.add(signMesh);
}

// falling leaves
const LEAVES = IS_PHONE ? 46 : 110;
const leafMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9 }), LEAVES);
const leaves = [];
{
  const c = new THREE.Color(); const lc = [0xd9541e, 0xe8862a, 0xf2b33d, 0xb8321f];
  for (let i = 0; i < LEAVES; i++) { leaves.push({ p: new THREE.Vector3(), v: 0, ph: Math.random() * 6, rs: 0.5 + Math.random() }); c.setHex(lc[i % 4]); leafMesh.setColorAt(i, c); }
}
const respawnLeaf = (L, anyY) => { const t = TREES[Math.floor(Math.random() * TREES.length)]; L.p.set(t.x + (Math.random() - 0.5) * t.r * 2, anyY ? Math.random() * (t.y + t.r) : t.y + t.r * (0.3 + Math.random() * 0.8), t.z + (Math.random() - 0.5) * t.r * 2); L.v = 0.6 + Math.random() * 0.8; };
leaves.forEach((L) => respawnLeaf(L, true));
leafMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); leafMesh.frustumCulled = false;
scene.add(leafMesh);

// ---------------------------------------------------------------- villagers
const MAXV = IS_PHONE ? 130 : 220;
const folkBody = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.85, 0.44), new THREE.MeshStandardMaterial({ roughness: 0.85 }), MAXV);
const folkHead = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), new THREE.MeshStandardMaterial({ roughness: 0.8 }), MAXV);
for (const m of [folkBody, folkHead]) { m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.count = 0; m.frustumCulled = false; m.castShadow = true; scene.add(m); }
const SKIN = [0xf1c9a5, 0xd9a07a, 0xa86d48, 0x7a4a2e, 0xe8b894, 0x5c3a24];
const folks = [];
const YARD = { x0: -13, x1: 25, z0: 19.5, z1: 25.2 };
function randIn(r) { return [lerp(r.x0, r.x1, Math.random()), lerp(r.z0, r.z1, Math.random())]; }
function spawnFolk() {
  const i = folks.length; if (i >= MAXV) return;
  const fromLeft = Math.random() < 0.5;
  const across = Math.random() < 0.28;
  const f = { x: fromLeft ? -46 : 62, z: across ? lerp(39.3, 40.8, Math.random()) : lerp(27.3, 28.8, Math.random()), route: [], speed: 2.4 + Math.random() * 1.6, ph: Math.random() * 6, wait: 0, across, inYard: false };
  folkBody.setColorAt(i, new THREE.Color(FOLK_COLORS[Math.floor(Math.random() * FOLK_COLORS.length)]));
  folkHead.setColorAt(i, new THREE.Color(SKIN[Math.floor(Math.random() * SKIN.length)]));
  folkBody.instanceColor.needsUpdate = true; folkHead.instanceColor.needsUpdate = true;
  planFolk(f, true);
  folks.push(f);
  folkBody.count = folkHead.count = folks.length;
}
function planFolk(f, first) {
  if (f.across) { f.route = [[lerp(-44, 60, Math.random()), f.z]]; return; }
  if (finaleOn || (!f.inYard && Math.random() < (first ? 0.6 : 0.35))) {
    // walk to the gate, up the path, into the yard
    if (!f.inYard) f.route = [[5.5 + (Math.random() - 0.5) * 2, 28], [5.5 + (Math.random() - 0.5) * 2, 24.5]];
    else f.route = [];
    const [x, z] = finaleOn ? [lerp(-11, 23, Math.random()), lerp(19.6, 24.9, Math.random())] : randIn(YARD);
    f.route.push([x, z]); f.inYard = true;
  } else if (f.inYard) {
    f.route = [randIn(YARD)];
  } else {
    f.route = [[lerp(-44, 60, Math.random()), lerp(27.3, 28.8, Math.random())]];
  }
}
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _e = new THREE.Euler();
function updateFolks(dt, t) {
  for (let i = 0; i < folks.length; i++) {
    const f = folks[i];
    let moving = false;
    if (f.wait > 0) f.wait -= dt;
    else if (f.route.length) {
      const [tx, tz] = f.route[0];
      const dx = tx - f.x, dz = tz - f.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { f.route.shift(); if (!f.route.length) f.wait = finaleOn ? 999 : 1 + Math.random() * 4; }
      else { const s = Math.min(d, f.speed * dt); f.x += dx / d * s; f.z += dz / d * s; f.face = Math.atan2(dx, dz); moving = true; }
    } else planFolk(f, false);
    if (finaleOn && f.wait > 100) f.face = Math.atan2(7.5 - f.x, 8 - f.z);
    const bob = moving && !RM ? Math.abs(Math.sin(t * 9 + f.ph)) * 0.16 : (finaleOn && !RM ? Math.max(0, Math.sin(t * 5 + f.ph)) * 0.35 : 0);
    _q.setFromEuler(_e.set(0, f.face || 0, 0));
    _m4.compose(_v.set(f.x, 0.43 + bob, f.z), _q, _s); folkBody.setMatrixAt(i, _m4);
    _m4.compose(_v.set(f.x, 1.12 + bob, f.z), _q, _s); folkHead.setMatrixAt(i, _m4);
  }
  folkBody.instanceMatrix.needsUpdate = true; folkHead.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------- dragon-prow ribbon
const dragon = new THREE.Group();
const DSEG = 42;
const dBodyMat = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.05, emissive: 0x334455, emissiveIntensity: 0.5 });
const dBody = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), dBodyMat, DSEG);
dBody.frustumCulled = false;
{
  const c = new THREE.Color();
  for (let i = 0; i < DSEG; i++) { c.setHex(i % 6 === 3 ? 0xd9a441 : (i % 6 === 4 ? 0x0f6b5a : 0xf6f1e4)); dBody.setColorAt(i, c); }
}
// head: a little Norse prow in voxels (white, gold eye and bands, curled snout), facing +z
{
  const hv = [];
  const add = (x, y, z, c) => hv.push({ x, y, z, c });
  for (let x = -1; x <= 1; x++) for (let y = 0; y <= 2; y++) for (let z = 0; z <= 3; z++) add(x, y, z, 0xf6f1e4);
  for (let x = -1; x <= 1; x++) { for (let z = 4; z <= 6; z++) add(x, 2, z, 0xf6f1e4); add(x, 1, 4, 0xf6f1e4); for (let z = 3; z <= 6; z++) add(x, -1, z, 0xf6f1e4); }
  for (let x = -1; x <= 1; x++) { add(x, 3, 6, 0xf6f1e4); add(x, 4, 5, 0xd9a441); add(x, 3, 0, 0xd9a441); add(x, 4, -1, 0xf6f1e4); add(x, 5, -2, 0xd9a441); }
  for (const x of [-1, 1]) { const e = hv.find((v) => v.x === x && v.y === 2 && v.z === 2); if (e) e.c = 0xd9a441; }
  for (let x = -1; x <= 1; x++) for (let y = 0; y <= 2; y++) { const b = hv.find((v) => v.x === x && v.y === y && v.z === 0); if (b) b.c = 0xd9a441; }
  add(0, 0, 7, 0xd9a441); add(0, -2, 5, 0x0f6b5a);
  const hs = new Map(hv.map((v) => [`${v.x},${v.y},${v.z}`, v]));
  const geo = meshVoxels(hv, (x, y, z) => hs.has(`${x},${y},${z}`), { flat: true });
  geo.translate(-0.5, -1.5, -3);
  const head = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: 0x334455, emissiveIntensity: 0.6 }));
  head.scale.setScalar(0.55);
  dragon.userData.head = head;
  dragon.add(head);
}
dragon.add(dBody);
dragon.visible = false;
scene.add(dragon);
const dragonPath = (th, out) => { const r = 10.5 + 1.6 * Math.sin(3 * th); return out.set(TX + 0.5 + r * Math.cos(th), 32 + 3.2 * Math.sin(2 * th + 1), TZ + 0.5 + r * Math.sin(th)); };
let dTheta = 0, dLapCue = 0;
const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3();
function updateDragon(dt, t, nightAmt) {
  const show = clamp((nightAmt - 0.45) * 2.5, 0, 1);
  dragon.visible = show > 0.01;
  if (!dragon.visible) return;
  const spd = RM ? 0.18 : 0.42;
  dTheta += dt * spd;
  for (let i = 0; i < DSEG; i++) {
    const th = dTheta - 0.24 - i * 0.068;
    dragonPath(th, _p0); dragonPath(th + 0.02, _p1);
    _m4.lookAt(_p1, _p0, THREE.Object3D.DEFAULT_UP); _q.setFromRotationMatrix(_m4);
    const sz = (0.95 - i / DSEG * 0.68) * show;
    const fin = (i % 3 === 0 && i < DSEG - 6) ? 1.45 : 1.0;
    _m4.compose(_p0, _q, _v.set(sz, sz * fin, sz * 1.25));
    dBody.setMatrixAt(i, _m4);
  }
  dBody.instanceMatrix.needsUpdate = true;
  const head = dragon.userData.head;
  dragonPath(dTheta, head.position); dragonPath(dTheta + 0.05, _p1);
  head.lookAt(_p1); head.scale.setScalar(0.55 * show);
  // sparkle trail and a swoosh as it passes the camera side
  if (!RM && Math.random() < 0.6) { dragonPath(dTheta - 0.24 - DSEG * 0.068, _p0); emitSpark(_p0, 0xffd56b); }
  const camAng = Math.atan2(camera.position.z - TZ, camera.position.x - TX);
  const diff = Math.atan2(Math.sin(dTheta - camAng), Math.cos(dTheta - camAng));
  if (Math.abs(diff) < 0.12 && t - dLapCue > 6) { dLapCue = t; sfx('dragon', { gain: 0.55 * show, rate: 0.95 + Math.random() * 0.1 }); }
}

// ---------------------------------------------------------------- particles (fireworks + sparkles)
const PMAX = IS_PHONE ? 3600 : 9000;
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pA = new Float32Array(PMAX), pSz = new Float32Array(PMAX);
const pVel = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX), pMaxL = new Float32Array(PMAX), pDrag = new Float32Array(PMAX), pGrav = new Float32Array(PMAX);
let pHead = 0;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('aA', new THREE.BufferAttribute(pA, 1).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('aS', new THREE.BufferAttribute(pSz, 1).setUsage(THREE.DynamicDrawUsage));
const pMat = new THREE.ShaderMaterial({
  uniforms: { uPR: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, vertexColors: true,
  vertexShader: `attribute float aA; attribute float aS; uniform float uPR; varying vec3 vC; varying float vA;
    void main(){ vC=color; vA=aA; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv;
      gl_PointSize = aA>0.0 ? min(48.0*uPR, aS*uPR*(820.0/max(1.0,-mv.z))) : 0.0; }`,
  fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=dot(d,d)*4.0; if(r>1.0) discard;
      float a=vA*(1.0-r)*(1.0-r); gl_FragColor=vec4(vC*a*2.2,a); }`,
});
const points = new THREE.Points(pGeo, pMat);
points.frustumCulled = false; points.renderOrder = 8;
scene.add(points);
const _c = new THREE.Color();
function emit(p, vel, col, life, size, drag = 0.985, grav = -6) {
  const i = pHead; pHead = (pHead + 1) % PMAX;
  pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z;
  pVel[i * 3] = vel.x; pVel[i * 3 + 1] = vel.y; pVel[i * 3 + 2] = vel.z;
  _c.setHex(col); pCol[i * 3] = _c.r; pCol[i * 3 + 1] = _c.g; pCol[i * 3 + 2] = _c.b;
  pLife[i] = life; pMaxL[i] = life; pSz[i] = size; pA[i] = 1; pDrag[i] = drag; pGrav[i] = grav;
}
const _vel = new THREE.Vector3();
function emitSpark(p, col) { _vel.set((Math.random() - 0.5) * 1.2, (Math.random() - 0.3) * 1.2, (Math.random() - 0.5) * 1.2); emit(p, _vel, col, 0.9 + Math.random() * 0.6, 0.55, 0.96, -1.2); }
const rockets = [];
function launchFirework(at) {
  const pal = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
  let pos;
  if (at) pos = at.clone();
  else {
    // pick a spot in the upper part of the current view, beyond the house, over the town
    const dist = camera.position.distanceTo(target);
    for (let tries = 0; tries < 6; tries++) {
      const n = new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.25 + Math.random() * 0.55, 0.5).unproject(camera);
      const dir = n.sub(camera.position).normalize();
      pos = camera.position.clone().addScaledVector(dir, dist * (0.85 + Math.random() * 0.45));
      if (pos.y > 20) break;
    }
    pos.y = Math.max(pos.y, 22);
  }
  const start = pos.clone(); start.y = 0;
  rockets.push({ p: start, to: pos, t: 0, dur: RM ? 0.01 : 1.1 + Math.random() * 0.5, pal });
}
function burst(r) {
  const n = IS_PHONE ? 150 : 300;
  const kind = Math.random();
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    let sp = (kind < 0.33 ? 30 : 22 + Math.random() * 8) * (RM ? 0.5 : 1);
    if (kind > 0.66) { _vel.set(Math.cos(th) * sp, Math.sin(th) * sp * 0.25, Math.sin(th) * sp).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5); }
    else _vel.set(s * Math.cos(th) * sp, u * sp, s * Math.sin(th) * sp);
    const willow = kind > 0.33 && kind < 0.5;
    emit(r.to, _vel, r.pal[i % 2], (willow ? 2.8 : 1.9) + Math.random() * 0.7, willow ? 1.2 : 1.55, willow ? 0.965 : 0.972, willow ? -9 : -5);
  }
  _c.setHex(r.pal[0]); flash.color.copy(_c); flash.position.copy(r.to); flash.intensity = 900;
  sfx('pop', { gain: 0.25, rate: 0.5 });
}
function updateParticles(dt) {
  for (let k = rockets.length - 1; k >= 0; k--) {
    const r = rockets[k]; r.t += dt;
    const f = Math.min(1, r.t / r.dur);
    _p0.lerpVectors(r.p, r.to, 1 - Math.pow(1 - f, 2));
    if (!RM) { _vel.set((Math.random() - 0.5) * 0.6, -2, (Math.random() - 0.5) * 0.6); emit(_p0, _vel, 0xffe0a0, 0.45, 0.5, 0.9, -2); }
    if (f >= 1) { burst(r); rockets.splice(k, 1); }
  }
  let any = false;
  for (let i = 0; i < PMAX; i++) {
    if (pLife[i] <= 0) { if (pA[i] !== 0) { pA[i] = 0; any = true; } continue; }
    any = true;
    pLife[i] -= dt;
    const d = Math.pow(pDrag[i], dt * 60);
    pVel[i * 3] *= d; pVel[i * 3 + 1] = pVel[i * 3 + 1] * d + pGrav[i] * dt; pVel[i * 3 + 2] *= d;
    pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
    const lf = pLife[i] / pMaxL[i];
    pA[i] = lf > 0 ? Math.min(1, lf * 1.6) * (0.75 + 0.25 * Math.sin(pLife[i] * 40 + i)) : 0;
  }
  if (any) { pGeo.attributes.position.needsUpdate = true; pGeo.attributes.aA.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; pGeo.attributes.aS.needsUpdate = true; }
  flash.intensity *= Math.pow(0.03, dt);
}

// ---------------------------------------------------------------- audio (ElevenLabs assets)
const AC = window.AudioContext || window.webkitAudioContext;
let actx = null, master = null, ambDay = null, ambNight = null, musicGain = null;
const buf = {};
let muted = false;
const SFX = ['pop1', 'pop2', 'pop3', 'pop4', 'pop5', 'chime', 'chime2', 'lamp', 'rise', 'dragon', 'cheer', 'fireworks', 'day', 'night', 'music'];
async function initAudio() {
  if (actx || !AC) { if (actx && actx.state !== 'running') actx.resume(); return; }
  actx = new AC();
  master = actx.createGain(); master.gain.value = muted ? 0 : 0.9;
  const comp = actx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
  master.connect(comp); comp.connect(actx.destination);
  await Promise.all(SFX.map(async (n) => {
    try { const r = await fetch(`media/${n}.mp3`); const a = await r.arrayBuffer(); buf[n] = await new Promise((res, rej) => actx.decodeAudioData(a, res, rej)); } catch (e) { /* missing sound is not fatal */ }
  }));
  const loop = (n, g) => { if (!buf[n]) return null; const s = actx.createBufferSource(); s.buffer = buf[n]; s.loop = true; const gn = actx.createGain(); gn.gain.value = g; s.connect(gn); gn.connect(master); s.start(); return gn; };
  ambDay = loop('day', 0.55); ambNight = loop('night', 0);
}
function sfx(name, o = {}) {
  if (!actx || muted) return;
  if (name === 'pop') name = 'pop' + (1 + Math.floor(Math.random() * 5));
  const b = buf[name]; if (!b) return;
  const s = actx.createBufferSource(); s.buffer = b; s.playbackRate.value = o.rate || 1;
  const g = actx.createGain(); g.gain.value = o.gain ?? 0.7;
  s.connect(g); g.connect(master); s.start(actx.currentTime + (o.when || 0));
  return s;
}
function playMusic() {
  if (!actx || !buf.music) return;
  if (musicGain) { musicGain.gain.setTargetAtTime(0, actx.currentTime, 0.5); }
  const s = actx.createBufferSource(); s.buffer = buf.music;
  musicGain = actx.createGain(); musicGain.gain.value = 0; musicGain.gain.setTargetAtTime(0.85, actx.currentTime, 0.6);
  s.connect(musicGain); musicGain.connect(master); s.start();
}
const PENTA = [-5, -3, 0, 2, 4, 7, 9, 12, 14, 16];

// ---------------------------------------------------------------- live course (v5): the next course bounces down onto its ghost.
// Place it as it meets the blueprint: Perfect, Good, or Placed. Every tap still lays the course; there is no miss.
const liveMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0, transparent: true, opacity: 0.93, emissive: new THREE.Color(0xffd27a), emissiveIntensity: 0 });
const LIVEMAX = Math.max(...byStage.map((l) => l.length));
const live = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), liveMat, LIVEMAX);
live.instanceMatrix.setUsage(THREE.DynamicDrawUsage); live.setColorAt(0, new THREE.Color()); live.instanceColor.setUsage(THREE.DynamicDrawUsage);
live.count = 0; live.frustumCulled = false; live.userData.noAO = true; scene.add(live);
const TIMING = { T: 1.5, A: 5.2, perfect: 0.075, good: 0.2 };   // seconds; alignment happens once per T
let lp = 0, lpFrames = 0, lpStage = -1, hitStop = 0, lastReal = performance.now();
let perfects = 0, goods = 0, placedOnly = 0, userTaps = 0;
function hardOn() { try { return !!(window.ledger && window.ledger.hard('dragon-house-blocks')); } catch (e) { return false; } }
function winPerfect() { return hardOn() ? TIMING.perfect * 0.5 : TIMING.perfect; }
function winGood() { return hardOn() ? TIMING.good * 0.6 : TIMING.good; }
function liveOn() { return started && !autoOn && !finaleOn && placedStages < NSTAGE; }
// speed ramps from rest to full over 6 frames (Swink), then holds
function phaseNow() { if (hitStop > 0) return lp; return (lp + (performance.now() - lastReal) / 1000 * Math.min(1, lpFrames / 6)) % TIMING.T; }
function msToPerfect() { if (!liveOn()) return null; return Math.round((TIMING.T - phaseNow()) * 1000); }
function judgeNow() { const p = phaseNow(); const d = Math.min(p, TIMING.T - p); return d <= winPerfect() ? 'perfect' : d <= winGood() ? 'good' : 'placed'; }
function updateLive(dt) {
  if (!liveOn()) { live.count = 0; lastReal = performance.now(); return; }
  const s = placedStages;
  if (lpStage !== s) { lpStage = s; lp = TIMING.T * 0.5; lpFrames = 0; }
  if (hitStop > 0) hitStop--;
  else { lpFrames++; lp = (lp + dt * Math.min(1, lpFrames / 6)) % TIMING.T; }
  lastReal = performance.now();
  const off = TIMING.A * Math.sin(Math.PI * lp / TIMING.T);
  const l = byStage[s];
  for (let i = 0; i < l.length; i++) { const v = l[i]; _m4.compose(_v.set(v.x + 0.5, v.y + 0.5 + off, v.z + 0.5), _q.identity(), _s.setScalar(0.96)); live.setMatrixAt(i, _m4); _c.setHex(v.glass ? 0x2a3a50 : accentFor(v, palKey)); live.setColorAt(i, _c); }
  _s.set(1, 1, 1);
  live.count = l.length; live.instanceMatrix.needsUpdate = true; live.instanceColor.needsUpdate = true;
  const near = 1 - Math.min(1, Math.min(lp, TIMING.T - lp) / 0.35);
  liveMat.emissiveIntensity = near * 0.6;
}
function flashWhite() {
  const f = $('#flash'); if (!f) return;
  f.style.transition = 'none'; f.style.opacity = '0.62'; void f.offsetWidth;
  f.style.transition = 'opacity .22s ease-out'; f.style.opacity = '0';
}
function showJudge(j) {
  const el = $('#judge'); if (!el) return;
  el.textContent = j === 'perfect' ? 'Perfect!' : j === 'good' ? 'Good' : 'Placed';
  el.className = 'judge ' + j; void el.offsetWidth; el.classList.add('pop');
  $('#perf').textContent = perfects;
}

// ---------------------------------------------------------------- building
let placedStages = 0;   // stages tapped (ghost advances)
let doneStages = 0;     // stages fully settled
let finaleOn = false, autoOn = false;
const stageColorsAt = new Array(NSTAGE).fill(null);
const accentFor = (v, key) => {
  const pal = PALETTES[key];
  if (!v.accent || !pal.colors) return v.c;
  const n = pal.colors.length;
  if (v.fw !== undefined) return pal.colors[v.fw % n];          // one color per window
  if (v.accent === 'box') return pal.colors[(v.x >> 1) % n];
  return pal.colors[((v.x + v.z) >> 1) % n];                     // bunting flags alternate
};
function placeStage(origin, opts = {}) {
  if (placedStages >= NSTAGE) return false;
  const s = placedStages++;
  ghostU.uStage.value = placedStages;
  const list = byStage[s];
  const key = palKey;
  stageColorsAt[s] = key;
  let maxD = 0;
  const o = origin || stageCenter[s];
  const ds = list.map((v) => { const d = Math.hypot(v.x + 0.5 - o.x, (v.y + 0.5 - o.y) * 1.4, v.z + 0.5 - o.z); if (d > maxD) maxD = d; return d; });
  const span = opts.fast ? 0.55 : 0.95;
  const k = Math.min(0.045, span / Math.max(1, maxD));
  const now = clock.elapsedTime;
  list.forEach((v, j) => { v.cur = accentFor(v, key); active.push({ v, t0: now + ds[j] * k, c: v.cur }); });
  // pops and an ascending chime arpeggio across the ripple
  const dur = maxD * k;
  const nPops = Math.min(14, Math.max(4, Math.round(list.length / 14)));
  const gk = opts.soft ? 0.5 : 1;
  for (let i = 0; i < nPops; i++) sfx('pop', { when: (i / nPops) * dur, gain: (0.45 + Math.random() * 0.2) * gk, rate: 0.88 + Math.random() * 0.4 });
  const base = Math.floor(s / 4);
  const notes = opts.fast ? 3 : 5;
  for (let i = 0; i < notes; i++) {
    const semi = PENTA[Math.min(PENTA.length - 1, base + i)];
    sfx('chime', { when: (i / notes) * dur + 0.02, gain: 0.32 * gk, rate: Math.pow(2, semi / 12) });
  }
  setTimeout(() => settleStage(s), (dur + 0.4) * 1000);
  updateHud();
  if (placedStages === NSTAGE) setTimeout(startFinale, (dur + 0.6) * 1000);
  return true;
}
function settleStage(s) {
  if (stageMeshes[s]) return;
  const occ = (x, y, z) => { const v = H.get(x, y, z); return !!v && v.stage <= s; };
  const solids = byStage[s].filter((v) => !v.glass);
  const g = meshVoxels(solids, occ, { colorOf: (v) => v.cur ?? v.c });
  const m = new THREE.Mesh(g, houseMat); m.castShadow = true; m.receiveShadow = true;
  scene.add(m); stageMeshes[s] = m;
  for (const v of byStage[s]) if (v.glass) winPlaced[v.wid] = 1;
  for (let i = active.length - 1; i >= 0; i--) if (active[i].v.stage === s) active.splice(i, 1);
  if (s === 6) emblemGroup.visible = true;
  if (s === NSTAGE - 1) flagGroup.visible = true;
  doneStages++;
  sfx('chime2', { gain: 0.25, rate: 1.0 + (s % 5) * 0.12 });
  tweenCounter(Math.round(3425 * placedStages / NSTAGE));
}
function updatePop(t) {
  const n = active.length;
  for (let i = 0; i < n; i++) {
    const a = active[i];
    const age = t - a.t0;
    let sc = 0, dy = 0;
    if (age > 0) {
      const p = Math.min(1, age / (RM ? 0.12 : 0.3));
      sc = RM ? p : easeOutBack(p);
      dy = RM ? 0 : (1 - (1 - Math.pow(1 - p, 3))) * 0.9;
    }
    _m4.compose(_v.set(a.v.x + 0.5, a.v.y + 0.5 + dy, a.v.z + 0.5), _q.identity(), _s.setScalar(Math.max(0.0001, sc)));
    pop.setMatrixAt(i, _m4);
    _c.setHex(a.v.glass ? 0x2a3a50 : a.c); pop.setColorAt(i, _c);
    if (age > 0 && age < dtLast * 1.01 && !RM && Math.random() < 0.08) emitSpark(_v, 0x9fe6ff);
  }
  _s.set(1, 1, 1);
  pop.count = n;
  if (n) { pop.instanceMatrix.needsUpdate = true; pop.instanceColor.needsUpdate = true; }
}
function resetBuild() {
  for (let s = 0; s < NSTAGE; s++) if (stageMeshes[s]) { scene.remove(stageMeshes[s]); stageMeshes[s].geometry.dispose(); stageMeshes[s] = null; }
  active.length = 0; placedStages = 0; doneStages = 0; ghostU.uStage.value = 0; perfects = goods = placedOnly = userTaps = 0; lpStage = -1; $('#perf').textContent = '0'; guardMode = false;
  winPlaced.fill(0); winLit.fill(0); emblemGroup.visible = false; flagGroup.visible = false;
  finaleOn = false; autoOn = false; folks.length = 0; folkBody.count = folkHead.count = 0;
  counter.target = 0; counter.val = 0; renderCounter();
  setNight(false); $('#finale').hidden = true; $('#finale').classList.remove('in'); document.body.classList.remove('fin'); controls.autoRotate = false;
  if (musicGain) musicGain.gain.setTargetAtTime(0, actx.currentTime, 0.6);
  updateHud(); setHint('Tap as the course lands on its glowing blueprint');
}

// ---------------------------------------------------------------- counter
const counter = { val: 0, target: 0 };
function tweenCounter(v) { counter.target = Math.max(counter.target, v); }
function renderCounter() { $('#vcount').textContent = fmt(Math.round(counter.val)); }
function updateCounter(dt) {
  if (counter.val < counter.target) {
    const before = Math.floor(counter.val);
    counter.val = Math.min(counter.target, counter.val + Math.max(60, (counter.target - counter.val) * 2.2) * dt);
    renderCounter();
    const want = Math.round(MAXV * counter.val / 3425);
    while (folks.length < want) spawnFolk();
    if (Math.floor(counter.val / 500) > Math.floor(before / 500)) $('#counter').classList.add('bump'), setTimeout(() => $('#counter').classList.remove('bump'), 260);
    if (counter.val >= 3425 && before < 3425) { $('#counter').classList.add('full'); }
  }
}

// ---------------------------------------------------------------- day and night
let night = 0, nightTarget = 0, nightT = 0;
let envDay = null, envNight = null;
function setNight(on) {
  nightTarget = on ? 1 : 0;
  if (on) nightT = 0;
  const b = $('#night'); b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.querySelector('.lbl').textContent = on ? 'Day' : 'Night';
}
const DAY = { sun: new THREE.Color(0xffd2a1), sunI: 3.0, hs: new THREE.Color(0xb9d4ff), hg: new THREE.Color(0x6b5a3a), hI: 0.95, fog: new THREE.Color(0xf2c8a0), env: 0.45, sunPos: new THREE.Vector3(-46, 58, 44) };
const NIGHT = { sun: new THREE.Color(0xa9c1ff), sunI: 1.25, hs: new THREE.Color(0x4a64a8), hg: new THREE.Color(0x2a2218), hI: 1.0, fog: new THREE.Color(0x14214a), env: 0.5, sunPos: new THREE.Vector3(36, 70, 30) };
const winOrder = Array.from({ length: windowCount }, (_, i) => i).sort(() => 0.5 - Math.random());
let lampCount = 0;
function updateNight(dt) {
  const sp = RM ? 1.2 : 0.55;
  if (night !== nightTarget) night = nightTarget > night ? Math.min(1, night + dt * sp) : Math.max(0, night - dt * sp);
  const k = ease(night);
  if (nightTarget > 0) nightT += dt;
  sun.color.lerpColors(DAY.sun, NIGHT.sun, k); sun.intensity = lerp(DAY.sunI, NIGHT.sunI, k);
  sun.position.lerpVectors(DAY.sunPos, NIGHT.sunPos, k).add(target);
  hemi.color.lerpColors(DAY.hs, NIGHT.hs, k); hemi.groundColor.lerpColors(DAY.hg, NIGHT.hg, k); hemi.intensity = lerp(DAY.hI, NIGHT.hI, k);
  scene.fog.color.lerpColors(DAY.fog, NIGHT.fog, k); scene.background.copy(scene.fog.color);
  skyUniforms.uNight.value = k;
  skyCap.material.color.setHex(k > 0.5 ? 0x0b1430 : 0x9fb7d8);
  farMat.color.lerpColors(FAR_DAY, FAR_NIGHT, k);
  scene.environmentIntensity = lerp(DAY.env, NIGHT.env, k);
  if (envDay && envNight) scene.environment = k > 0.5 ? envNight : envDay;
  renderer.toneMappingExposure = lerp(1.0, 1.25, k);
  scene.fog.density = lerp(0.0026, 0.0018, k);
  porchLight.intensity = 70 * k * (doneStages > 6 ? 1 : 0);
  glowU.uNight.value = k; glowU.uNightT.value = nightT;
  // house windows light one by one
  for (let j = 0; j < winOrder.length; j++) {
    const w = winOrder[j];
    const want = (nightTarget > 0 && winPlaced[w] && nightT > 0.6 + j * (RM ? 0.12 : 0.32)) ? 1 : 0;
    if (want && winLit[w] < 0.01 && lampCount < 8) { lampCount++; sfx('lamp', { gain: 0.5 - lampCount * 0.04, rate: 0.9 + Math.random() * 0.25 }); }
    winLit[w] = want ? Math.min(1, winLit[w] + dt * 3) : Math.max(0, winLit[w] - dt * 2);
  }
  if (nightTarget === 0) lampCount = 0;
  ghostU.uColor.value.setHex(k > 0.5 ? 0x9fe8ff : 0x7fdcff);
  ghostU.uFuture.value = lerp(0.085, 0.12, k);
  if (ambDay) ambDay.gain.value = 0.55 * (1 - k);
  if (ambNight) ambNight.gain.value = 0.6 * k;
  if (bloomPass) { bloomPass.threshold = lerp(2.4, 1.1, k); bloomPass.strength = lerp(0.15, 0.42, k); bloomPass.radius = lerp(0.3, 0.38, k); }
}

// ---------------------------------------------------------------- quality presets
const QUALITY = {
  low: { label: 'Low', dpr: () => 1, shadow: 0, post: false },
  medium: { label: 'Medium', dpr: () => Math.min(devicePixelRatio, 2), shadow: 1024, post: false },
  high: { label: 'High', dpr: () => devicePixelRatio, shadow: 2048, post: true, ao: 0.5, msaa: 0, smaa: true },
  ultra: { label: 'Ultra', dpr: () => devicePixelRatio, shadow: 4096, post: true, ao: 1.0, msaa: 0, smaa: true },
};
let qKey = QS.get('q') || (IS_PHONE ? 'medium' : 'high');
if (!QUALITY[qKey]) qKey = 'medium';
let composer = null, bloomPass = null, gtaoPass = null, dprNow = 1;
function applyQuality(key) {
  qKey = key; const q = Object.assign({}, QUALITY[key]);
  if (QS.get('ao') === '0') q.ao = 0;
  if (QS.get('msaa')) q.msaa = +QS.get('msaa');
  if (QS.get('bloom') === '0') q.nobloom = true;
  dprNow = q.dpr();
  renderer.setPixelRatio(dprNow);
  sun.castShadow = q.shadow > 0;
  if (q.shadow) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  if (composer) { composer.dispose?.(); composer = null; bloomPass = null; gtaoPass = null; }
  const w = innerWidth, h = innerHeight;
  if (q.post) {
    const rt = new THREE.WebGLRenderTarget(w * dprNow, h * dprNow, { type: THREE.HalfFloatType, samples: q.msaa || 0 });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(dprNow); composer.setSize(w, h);
    composer.addPass(new RenderPass(scene, camera));
    if (q.ao) {
      gtaoPass = new GTAOPass(scene, camera, w, h);
      const k = q.ao; const ss = gtaoPass.setSize.bind(gtaoPass);
      gtaoPass.setSize = (ww, hh) => ss(Math.max(2, Math.round(ww * k)), Math.max(2, Math.round(hh * k)));
      gtaoPass.setSize(w * dprNow, h * dprNow);
      gtaoPass.overrideVisibility = function () { const cache = this._visibilityCache; this.scene.traverse((o) => { cache.set(o, o.visible); if (o.isPoints || o.isLine || o.userData.noAO) o.visible = false; }); };
      gtaoPass.updateGtaoMaterial({ radius: 1.6, distanceExponent: 1.3, thickness: 1.4, scale: 1.0, samples: key === 'ultra' ? 16 : 12 });
      gtaoPass.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
      gtaoPass.blendIntensity = 0.85;
      composer.addPass(gtaoPass);
    }
    if (!q.nobloom) { bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.2, 0.55, 2.6); composer.addPass(bloomPass); }
    composer.addPass(new OutputPass());
    if (q.smaa) composer.addPass(new SMAAPass(w * dprNow, h * dprNow));
  }
  pMat.uniforms.uPR.value = dprNow;
  for (const b of document.querySelectorAll('#qmenu [data-q]')) b.setAttribute('aria-checked', b.dataset.q === key ? 'true' : 'false');
  $('#qlabel').textContent = q.label;
  updateNight(0);
  resize();
}

// ---------------------------------------------------------------- camera
const sph = new THREE.Spherical();
function fitDistance() {
  const vf = THREE.MathUtils.degToRad(camera.fov);
  const hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  return clamp(23 / Math.sin(Math.min(vf, hf) / 2), 50, 150);
}
function resize() {
  const w = innerWidth, h = innerHeight;
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.8 ? 50 : 38;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  if (composer) composer.setSize(w, h);
  bloomPass?.setSize(w * dprNow, h * dprNow);
}
addEventListener('resize', resize);
function homeCamera(dist) {
  sph.set(dist || fitDistance(), 1.2, 0.62);
  camera.position.setFromSpherical(sph).add(target);
  controls.update();
}
let camTween = null;
function flyTo(theta, phi, dist, dur = 2.2) {
  const off = new THREE.Vector3().subVectors(camera.position, controls.target);
  const from = new THREE.Spherical().setFromVector3(off);
  let dth = theta - from.theta; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  camTween = { from, th: from.theta + dth, phi, dist, t: 0, dur: RM ? 0.001 : dur, tgt0: controls.target.clone() };
}
function updateCamTween(dt) {
  if (!camTween) return;
  camTween.t += dt;
  const k = ease(Math.min(1, camTween.t / camTween.dur));
  controls.target.lerpVectors(camTween.tgt0, target, k);
  sph.set(lerp(camTween.from.radius, camTween.dist, k), lerp(camTween.from.phi, camTween.phi, k), lerp(camTween.from.theta, camTween.th, k));
  camera.position.setFromSpherical(sph).add(controls.target);
  if (k >= 1) camTween = null;
}
const keys = new Set();
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input,textarea')) return;
  const k = e.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'w', 'a', 's', 'd', 'q', 'e', '-', '=', '+'].includes(k)) { keys.add(k); e.preventDefault(); return; }
  if (!started) return;
  if ((k === ' ' || k === 'enter') && !(e.target.closest && e.target.closest('button,a'))) { e.preventDefault(); userPlace(null); }
  else if (k === 'n') toggleNight();
  else if (k === 'b') startAuto();
  else if (k === 'f') toggleFullscreen();
  else if (k === 'm') toggleMute();
  else if ('12345'.includes(k)) setPalette(Object.keys(PALETTES)[+k - 1]);
});
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());
function updateKeys(dt) {
  if (!keys.size) return;
  camTween = null;
  const off = new THREE.Vector3().subVectors(camera.position, controls.target);
  sph.setFromVector3(off);
  const has = (...a) => a.some((x) => keys.has(x));
  if (has('arrowleft', 'a')) sph.theta -= 1.5 * dt;
  if (has('arrowright', 'd')) sph.theta += 1.5 * dt;
  if (has('arrowup', 'w')) sph.phi -= 0.9 * dt;
  if (has('arrowdown', 's')) sph.phi += 0.9 * dt;
  if (has('q', '-')) sph.radius *= 1 + 1.2 * dt;
  if (has('e', '=', '+')) sph.radius *= 1 - 1.2 * dt;
  sph.phi = clamp(sph.phi, controls.minPolarAngle, controls.maxPolarAngle);
  sph.radius = clamp(sph.radius, controls.minDistance, controls.maxDistance);
  camera.position.setFromSpherical(sph).add(controls.target);
}

// ---------------------------------------------------------------- input: tap to build
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const downs = new Map();
let started = false;
canvas.addEventListener('pointerdown', (e) => { downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), multi: downs.size > 0 }); if (downs.size > 1) for (const d of downs.values()) d.multi = true; camTween = null; });
canvas.addEventListener('pointerup', (e) => {
  const d = downs.get(e.pointerId); downs.delete(e.pointerId);
  if (!d || d.multi || !started) return;
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 10 || performance.now() - d.t > 600) return;
  onTap(e.clientX, e.clientY);
});
canvas.addEventListener('pointercancel', (e) => downs.delete(e.pointerId));
function pickOrigin(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const s = placedStages;
  if (s >= NSTAGE) return { hit: null };
  const hits = ray.intersectObject(ghost, false);
  let pt = hits.length ? hits[0].point : null;
  if (!pt) { const g = new THREE.Vector3(); if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), g)) pt = g; }
  if (!pt) return { origin: stageCenter[s], hit: null };
  let best = null, bd = 1e9;
  for (const v of byStage[s]) { const d = (v.x + 0.5 - pt.x) ** 2 + (v.y + 0.5 - pt.y) ** 2 + (v.z + 0.5 - pt.z) ** 2; if (d < bd) { bd = d; best = v; } }
  return { origin: new THREE.Vector3(best.x + 0.5, best.y + 0.5, best.z + 0.5), hit: hits.length ? pt : null };
}
function onTap(cx, cy) {
  if (guardMode) { placeGuardianAt(cx, cy); return; }
  if (placedStages >= NSTAGE) {
    // after the build: every tap is another firework
    const r = canvas.getBoundingClientRect();
    ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const p = ray.ray.at(70, new THREE.Vector3()); p.y = clamp(p.y, 22, 70);
    launchFirework(p); sfx('rise', { gain: 0.35, rate: 1.3 });
    return;
  }
  userPlace(pickOrigin(cx, cy).origin);
}
let taps = 0;
function userPlace(origin) {
  if (placedStages >= NSTAGE || guardMode) return;
  const j = autoOn ? 'placed' : judgeNow();
  if (!placeStage(origin, { soft: j === 'placed' })) return;
  taps++; userTaps++;
  if (j === 'perfect') { perfects++; if (!RM) { hitStop = 4; flashWhite(); } sfx('chime', { gain: 0.5, rate: 2 }); sfx('lamp', { gain: 0.35, rate: 1.6 }); }
  else if (j === 'good') { goods++; sfx('chime', { gain: 0.3, rate: 1.5 }); }
  else placedOnly++;
  showJudge(j);
  if (taps === 1 && j !== 'perfect') setHint('Tap the moment it lands on the blueprint for a Perfect');
  else if (taps === 3) setHint('Pick James, Henry, or Oscar to paint the sash and trim');
  else if (taps === 7) setHint('Try Night, or let Auto-build raise the rest');
  else if (taps === 10 || (taps === 1 && j === 'perfect')) setHint('');
}
function setHint(t) { const h = $('#hint'); h.textContent = t; h.classList.toggle('show', !!t); }

// ---------------------------------------------------------------- auto-build timelapse
let autoTimer = 0;
function startAuto() {
  if (placedStages >= NSTAGE) { resetBuild(); }
  initAudio();
  autoOn = true; autoTimer = 0.2; setHint('');
  sfx('rise', { gain: 0.6 });
  $('#auto').setAttribute('aria-pressed', 'true');
  if (!RM) { controls.autoRotate = true; controls.autoRotateSpeed = 2.4; flyTo(sph.theta, 1.24, fitDistance() * 1.08, 1.6); }
}
function updateAuto(dt) {
  if (!autoOn) return;
  autoTimer -= dt;
  if (autoTimer <= 0 && placedStages < NSTAGE) {
    const s = placedStages; const l = byStage[s];
    const v = l[Math.floor(Math.random() * l.length)];
    placeStage(new THREE.Vector3(v.x + 0.5, v.y + 0.5, v.z + 0.5), { fast: true });
    autoTimer = RM ? 0.9 : 0.62;
  }
  if (placedStages >= NSTAGE) { autoOn = false; $('#auto').setAttribute('aria-pressed', 'false'); }
}

// ---------------------------------------------------------------- finale
let fwUntil = 0, fwNext = 0;
function startFinale() {
  if (finaleOn) return;
  finaleOn = true;
  tweenCounter(3425);
  try { if (window.ledger) { const nb = HV.length; const hand = userTaps > 0;
    window.ledger.done('dragon-house-blocks', fmt(nb) + (hand && perfects ? ' blocks placed, ' + perfects + ' perfect.' : ' blocks placed. The house is lit.'), { blocks: nb, sheets: NSTAGE, perfects, goods, hard: hardOn() });
    window.ledger.add('blocks', nb); if (perfects) window.ledger.add('perfects', perfects); } } catch (e) { /* storage is optional */ }
  $('#fin-perf').textContent = userTaps ? `${perfects} perfect, ${goods} good, of ${NSTAGE} sheets` + (hardOn() ? ' (hard)' : '') : 'Auto-built, start to finish';
  const gOk = !guardPlaced; $('#fin-guard').hidden = !gOk; $('#guard-line').hidden = !gOk;
  for (const f of folks) planFolk(f, false);
  sfx('cheer', { gain: 0.8 }); sfx('rise', { gain: 0.5, rate: 0.8 });
  setNight(true);
  controls.autoRotate = !RM; controls.autoRotateSpeed = 0.45;
  flyTo(0.55, 1.3, fitDistance() * 1.12, 3.2);
  const t0 = clock.elapsedTime;
  fwNext = t0 + 2.0; fwUntil = t0 + 34;
  setTimeout(() => { playMusic(); sfx('fireworks', { gain: 0.7 }); }, 1800);
  setTimeout(() => sfx('fireworks', { gain: 0.6, rate: 0.96 }), 11800);
  setTimeout(() => sfx('fireworks', { gain: 0.5, rate: 1.04 }), 21800);
  setTimeout(() => { sfx('cheer', { gain: 0.6, rate: 1.05 }); }, 3800);
  setTimeout(() => { const f = $('#finale'); f.hidden = false; document.body.classList.add('fin'); requestAnimationFrame(() => f.classList.add('in')); ($('#fin-guard').hidden ? $('#fin-again') : $('#fin-guard')).focus({ preventScroll: true }); }, RM ? 600 : 3600);
  setHint('');
  $('#live').textContent = 'The house is complete. Home, built block by block. Restored by Eric.';
}
function updateFinale(t) {
  if (!finaleOn) return;
  if (t < fwUntil && t >= fwNext) {
    const n = RM ? 1 : 1 + (Math.random() < 0.35 ? 1 : 0);
    for (let i = 0; i < n; i++) launchFirework();
    fwNext = t + (RM ? 1.6 : 0.45 + Math.random() * 0.55);
  }
}

// ---------------------------------------------------------------- HUD
function updateHud() {
  const s = Math.min(placedStages, NSTAGE - 1);
  $('#sheet').textContent = placedStages >= NSTAGE ? NSTAGE : placedStages + 1;
  $('#stagename').textContent = placedStages >= NSTAGE ? 'Complete' : STAGES[s];
  $('#bar').style.transform = `scaleX(${placedStages / NSTAGE})`;
  if (placedStages > 0 && placedStages < NSTAGE) $('#live').textContent = `Sheet ${placedStages} of ${NSTAGE} laid: ${STAGES[placedStages - 1]}.`;
}
function setPalette(k) {
  if (!PALETTES[k]) return;
  palKey = k;
  for (const b of document.querySelectorAll('[data-pal]')) b.setAttribute('aria-checked', b.dataset.pal === k ? 'true' : 'false');
  sfx('chime2', { gain: 0.2, rate: 1.4 });
}
function toggleNight() { initAudio(); setNight(nightTarget < 0.5); }
function applyMute(m) {
  muted = !!m; if (master) master.gain.value = muted ? 0 : 0.9;
  const b = $('#snd'); b.setAttribute('aria-pressed', muted ? 'false' : 'true'); b.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on');
  b.classList.toggle('off', muted);
}
// one site-wide Sound flag in the shared ledger: the board's choice holds here, and a change here carries back
function toggleMute() { if (window.ledger) window.ledger.setSound(muted); else applyMute(!muted); }
function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  else (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
}
for (const b of document.querySelectorAll('[data-pal]')) {
  const sw = b.querySelector('.sw'); const p = PALETTES[b.dataset.pal];
  sw.style.background = `linear-gradient(135deg, ${p.sw[0]} 0 50%, ${p.sw[1]} 50% 100%)`;
  b.addEventListener('click', () => setPalette(b.dataset.pal));
}
$('#auto').addEventListener('click', () => startAuto());
$('#night').addEventListener('click', toggleNight);
$('#snd').addEventListener('click', toggleMute);
if (window.ledger) window.ledger.bindSound((on) => applyMute(!on));
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) $('#fs').hidden = true;
$('#fs').addEventListener('click', toggleFullscreen);
$('#qbtn').addEventListener('click', () => { const m = $('#qmenu'); m.hidden = !m.hidden; $('#qbtn').setAttribute('aria-expanded', m.hidden ? 'false' : 'true'); });
for (const b of document.querySelectorAll('#qmenu [data-q]')) b.addEventListener('click', () => { applyQuality(b.dataset.q); $('#qmenu').hidden = true; $('#qbtn').setAttribute('aria-expanded', 'false'); });
$('#fin-again').addEventListener('click', () => { resetBuild(); homeCamera(); });
$('#fin-watch').addEventListener('click', () => { const f = $('#finale'); f.classList.remove('in'); f.hidden = true; document.body.classList.remove('fin'); setHint('Tap the sky for another firework'); });
async function begin(auto) {
  if (started) return;
  started = true;
  const intro = $('#intro'); intro.classList.add('out'); setTimeout(() => { intro.hidden = true; }, 450);
  controls.autoRotate = false;
  await initAudio();
  if (auto) startAuto();
  else setHint('Tap as the course lands on its glowing blueprint');
}
$('#go').addEventListener('click', () => begin(false));
$('#go-auto').addEventListener('click', () => begin(true));

// ---------------------------------------------------------------- guardian (v5): a protector and a torch-beacon boundary
// Original art: a squat stone-and-brass sentinel holding up a lantern. Placing it sets ledger.guardian,
// which protects plates in Doing the Most. Nothing here borrows any game's art.
let guardMode = false, guardPlaced = false;
const guardGroup = new THREE.Group(); guardGroup.visible = false; scene.add(guardGroup);
const beaconFlames = [];
let houseBox = null;
function hb() { if (houseBox) return houseBox; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const v of HV) { x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); } houseBox = { cx: (x0 + x1) / 2 + 0.5, cz: (z0 + z1) / 2 + 0.5, rx: (x1 - x0) / 2 + 4.5, rz: (z1 - z0) / 2 + 4 }; return houseBox; }
function buildGuardian() {
  const g = new THREE.Group();
  const M = (c, e = 0, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: m ? 0.35 : 0.85, metalness: m, emissive: new THREE.Color(e ? c : 0x000000), emissiveIntensity: e });
  const stone = M(0x8d877b), stone2 = M(0x6f6b62), brass = M(0xc19a48, 0, 0.75), teal = M(0x0f6b5a), lamp = M(0xffd27a, 2.4), visor = M(0xffe7a8, 1.6), wood = M(0x5a3a1e);
  const parts = [
    [-0.55, 0.55, 0, 0.75, 1.1, 0.85, stone2], [0.55, 0.55, 0, 0.75, 1.1, 0.85, stone2],   // legs
    [0, 1.85, 0, 2.1, 1.5, 1.25, brass],                                                // brass torso
    [0, 1.3, 0, 2.2, 0.32, 1.35, teal],                                                 // teal band (the emblem's color)
    [0, 2.95, 0, 1.3, 0.85, 1.05, stone],                                               // stone helm
    [0, 2.98, 0.54, 0.95, 0.16, 0.06, visor],                                           // one glowing visor slit
    [0, 3.5, 0, 0.36, 0.3, 0.9, brass],                                                 // brass crest, front to back
    [-1.35, 1.75, 0, 0.55, 1.35, 0.65, stone], [1.35, 2.35, 0, 0.55, 1.15, 0.65, stone], // arms, right one raised
    [1.35, 3.6, 0, 0.14, 1.6, 0.14, wood],                                              // staff
    [1.35, 4.55, 0, 0.55, 0.62, 0.55, lamp],                                            // lantern
    [1.35, 4.95, 0, 0.7, 0.14, 0.7, brass],                                             // lantern cap
  ];
  for (const [x, y, z, w, h, d, m] of parts) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); }
  const pl = new THREE.PointLight(0xffc977, 0, 18, 1.6); pl.position.set(1.35, 4.6, 0.3); g.add(pl); g.userData.light = pl;
  return g;
}
function buildBeacons() {
  const B = hb(); const n = 10; const post = new THREE.MeshStandardMaterial({ color: 0x6f6b62, roughness: 0.9 });
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + Math.PI / 2;
    const x = B.cx + Math.cos(a) * B.rx, z = B.cz + Math.sin(a) * B.rz;
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 3.0, 0.7), post); p.position.set(x, 1.5, z); p.castShadow = true; guardGroup.add(p);
    const fm = new THREE.MeshStandardMaterial({ color: 0x3a2a18, emissive: new THREE.Color(0xffb347), emissiveIntensity: 0, roughness: 0.6 });
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 1.0), fm); f.position.set(x, 3.5, z); guardGroup.add(f); beaconFlames.push(f);
  }
}
let guardian = null;
function offerGuardian() {
  if (guardPlaced) return;
  const f = $('#finale'); f.classList.remove('in'); f.hidden = true; document.body.classList.remove('fin');
  guardMode = true; controls.autoRotate = false; flyTo(0.62, 1.12, fitDistance() * 1.05, RM ? 0.01 : 1.2);
  setHint('Tap the front yard to place your guardian');
  $('#live').textContent = 'Tap the front yard to place a guardian.';
}
function groundAt(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const g = new THREE.Vector3(); if (!ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), g)) return null;
  return g;
}
function placeGuardianAt(cx, cy) {
  const B = hb(); let g = groundAt(cx, cy) || new THREE.Vector3(B.cx + 4, 0, B.cz + B.rz + 1.5);
  // the guardian keeps to the yard, just inside the beacon line, never inside the house
  g.x = clamp(g.x, YARD.x0 + 1, YARD.x1 - 1); g.z = clamp(g.z, YARD.z0 - 1, YARD.z1 - 1.2);
  if (Math.abs(g.x - 11) < 5 && g.z > 19.5) g.x = g.x < 11 ? 2.2 : 17;   // keep clear of the Gordtopia sign
  if (g.x > 3 && g.x < 8) g.x = g.x < 5.5 ? 2.2 : 8.8;                   // and off the front path
  guardMode = false; guardPlaced = true; initAudio();
  if (!guardian) { guardian = buildGuardian(); buildBeacons(); guardGroup.add(guardian); }
  guardian.position.set(g.x, 0, g.z); guardian.scale.setScalar(1.5); guardian.rotation.y = Math.atan2(g.x - B.cx, g.z - B.cz) * 0.4;
  guardGroup.visible = true; setHint(''); document.body.classList.add('fin');
  sfx('chime2', { gain: 0.5, rate: 0.8 }); sfx('rise', { gain: 0.4, rate: 0.9 });
  if (!RM) { const c0 = new THREE.Vector3(g.x, 2.5, g.z); for (let k = 0; k < 24; k++) emitSpark(c0, 0xffd27a); }
  guardian.userData.light.intensity = 3.2;
  // beacons light one by one around the boundary
  beaconFlames.forEach((f, i) => setTimeout(() => {
    f.material.emissiveIntensity = 3.4; f.material.color.setHex(0xffb347);
    sfx('lamp', { gain: 0.45, rate: 0.85 + i * 0.05 });
    if (!RM) for (let k = 0; k < 6; k++) emitSpark(f.position, 0xffc46b);
    if (i === beaconFlames.length - 1) guardianDone();
  }, RM ? 0 : 300 + i * 240));
}
function guardianDone() {
  try { if (window.ledger) {
    window.ledger.setGuardian(true);
    window.ledger.post('guardian', 'Guardian on watch at the Dragon House. Plates in Doing the Most now glow and land safe.');
    window.ledger.first('guardian', 'First guardian placed');
  } } catch (e) { /* storage is optional */ }
  sfx('cheer', { gain: 0.5, rate: 1.1 });
  $('#live').textContent = 'Guardian on watch. The torch beacons are lit.';
  setTimeout(() => { const c = $('#guardcard'); c.hidden = false; requestAnimationFrame(() => c.classList.add('in')); $('#guard-board').focus({ preventScroll: true }); }, RM ? 100 : 900);
}
function guardianPoint() {
  const p = new THREE.Vector3(-4, 0, 21.5).project(camera);
  const r = canvas.getBoundingClientRect(); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height];
}
$('#fin-guard').addEventListener('click', offerGuardian);
$('#guard-watch').addEventListener('click', () => { const c = $('#guardcard'); c.classList.remove('in'); c.hidden = true; setHint('Tap the sky for another firework'); });
{ const gi = $('#guardimg'); if (gi) gi.addEventListener('error', () => gi.remove()); }

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let dtLast = 0.016;
const frameTimes = new Float32Array(600); let ftHead = 0, ftCount = 0;
let adaptT = 0, adaptAcc = 0, adaptN = 0;
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  dtLast = dt;
  const t = clock.elapsedTime;
  frameTimes[ftHead] = dt * 1000; ftHead = (ftHead + 1) % 600; ftCount = Math.min(600, ftCount + 1);
  renderer.info.reset();
  ghostU.uTime.value = t; waterU.uTime.value = t;
  if (flagMat) flagMat.userData.t.value = t;
  updateKeys(dt); updateCamTween(dt);
  controls.update(dt);
  updateAuto(dt); updateLive(dt); if (hitStop <= 0) updatePop(t); updateNight(dt); updateCounter(dt);
  updateFolks(dt, t); updateDragon(dt, t, night); updateFinale(t); updateParticles(dt);
  if (!RM) {
    for (let i = 0; i < LEAVES; i++) {
      const L = leaves[i]; L.p.y -= L.v * dt; L.p.x += Math.sin(t * 1.3 + L.ph) * 0.9 * dt; L.p.z += Math.cos(t * 0.9 + L.ph) * 0.5 * dt;
      if (L.p.y < 0.1) respawnLeaf(L, false);
      _q.setFromEuler(_e.set(t * L.rs + L.ph, t * 0.7 * L.rs, L.ph)); _m4.compose(L.p, _q, _s); leafMesh.setMatrixAt(i, _m4);
    }
    leafMesh.instanceMatrix.needsUpdate = true; leafMesh.visible = night < 0.8;
  } else leafMesh.visible = false;
  // phone: keep 60fps by trimming resolution if frames run long
  if (IS_PHONE && qKey === 'medium') {
    adaptAcc += dt; adaptN++; adaptT += dt;
    if (adaptT > 2.5) { const avg = adaptAcc / adaptN; if (avg > 0.021 && dprNow > 1.26) { dprNow -= 0.25; renderer.setPixelRatio(dprNow); resize(); } adaptT = adaptAcc = adaptN = 0; }
  }
  if (composer) composer.render(dt); else renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- QA hooks (read-only helpers for the test harness)
window.__dh = {
  state: () => ({ placedStages, doneStages, NSTAGE, finaleOn, perfects, goods, placedOnly, userTaps, hard: hardOn(), guardMode, guardPlaced, phase: guardMode ? 'guardian' : finaleOn ? 'finale' : started ? 'build' : 'intro', window: { perfect: winPerfect(), good: winGood() }, night, counter: Math.round(counter.val), folks: folks.length, quality: qKey, dpr: dprNow, calls: renderer.info.render.calls, tris: renderer.info.render.triangles, gl: (() => { const g = renderer.getContext(); const ext = g.getExtension('WEBGL_debug_renderer_info'); return ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'n/a'; })() }),
  frames: () => { const a = Array.from(frameTimes.slice(0, ftCount)).sort((x, y) => x - y); const q = (p) => a[Math.min(a.length - 1, Math.floor(a.length * p))]; return { n: a.length, avg: a.reduce((s, x) => s + x, 0) / Math.max(1, a.length), p50: q(0.5), p95: q(0.95), p99: q(0.99) }; },
  resetFrames: () => { ftHead = 0; ftCount = 0; },
  msToPerfect, guardianPoint,
  guardianOffered: () => !$('#finale').hidden && !$('#fin-guard').hidden,
  guardCardShown: () => !$('#guardcard').hidden,
  guardInfo: () => ({ box: hb(), at: guardian ? guardian.position.toArray() : null, lit: beaconFlames.filter((f) => f.material.emissiveIntensity > 1).length, beacons: beaconFlames.map((f) => f.position.toArray()) }),
  nextTapPoint: () => {
    if (placedStages >= NSTAGE) return null;
    const l = byStage[placedStages];
    const r = canvas.getBoundingClientRect();
    const cands = [];
    for (const v of l) {
      const p = new THREE.Vector3(v.x + 0.5, v.y + 0.5, v.z + 0.5).project(camera);
      const x = r.left + (p.x + 1) / 2 * r.width, y = r.top + (1 - p.y) / 2 * r.height;
      if (p.z < 1 && x > 20 && x < r.width - 20 && y > r.height * 0.22 && y < r.height * 0.72) cands.push([x, y]);
    }
    if (!cands.length) return null;
    return cands[Math.floor(cands.length / 2)];
  },
};

// ---------------------------------------------------------------- boot
(async function boot() {
  document.documentElement.classList.add('ready');
  resize(); homeCamera();
  applyQuality(qKey);
  const [d, n] = await Promise.all([loadTex('media/skyday.jpg'), loadTex('media/skynight.jpg')]);
  for (const t of [d, n]) if (t) { t.wrapS = THREE.RepeatWrapping; }
  skyUniforms.tDay.value = d; skyUniforms.tNight.value = n || d;
  // reflections from the painted sky
  try {
    const pm = new THREE.PMREMGenerator(renderer);
    const sScene = new THREE.Scene();
    const sMesh = new THREE.Mesh(sky.geometry, skyMat); sMesh.position.copy(sky.position); sScene.add(sMesh);
    sScene.background = new THREE.Color(0x9fb7d8);
    skyUniforms.uNight.value = 0; envDay = pm.fromScene(sScene, 0.02, 1, 1000).texture;
    sScene.background = new THREE.Color(0x0b1430);
    skyUniforms.uNight.value = 1; envNight = pm.fromScene(sScene, 0.02, 1, 1000).texture;
    skyUniforms.uNight.value = 0; pm.dispose();
    scene.environment = envDay;
  } catch (e) { /* reflections are a bonus */ }
  buildEmblems(); buildSign();
  if (!RM) controls.autoRotate = true, controls.autoRotateSpeed = 0.35;
  updateHud();
  if (QS.get('night') === '1') setNight(true);
  try { if (window.ledger) window.ledger.hardToggle('dragon-house-blocks', $('#intro .hardhost'), () => {}, 'tighter window'); } catch (e) { /* optional */ }
  $('#intro').classList.add('in');
  requestAnimationFrame(frame);
})();
