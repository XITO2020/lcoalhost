// La Centrale : maquette 3D blanche (argile + aretes fines). Quatre "canaux" :
//   trémie a charbon = MEMES · four = VIDEOS · cheminees = ARTICLES · tour de refroidissement = PENTEST
//   (23/09, demande Naim : la tour sort du canal ARTICLES, lien special vers le Labo Pentest, cf. main.js).
// Zones pixel art (textures NearestFilter) : porte du four, panneau, fumee. Charge en differe (three.js).
import * as THREE from 'three';
import { drawText } from './pixelfont.js';
import { t } from './i18n.js';

const ACCENT = 0xe8622c;
const COAL = 0x1c1b20;

function pixelTexture(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = false;
  return t;
}

const furnaceTexture = () =>
  pixelTexture(16, 16, (g) => {
    g.fillStyle = '#1c1b20';
    g.fillRect(0, 0, 16, 16);
    g.fillStyle = '#3a3038';
    g.fillRect(1, 1, 14, 14);
    g.fillStyle = '#0d0b10';
    g.fillRect(3, 3, 10, 10);
    const flame = ['#e8622c', '#f39a3a', '#fbc357', '#ffe39a'];
    const cols = [4, 5, 6, 7, 8, 9, 10, 11];
    const heights = [3, 5, 4, 7, 6, 4, 5, 3];
    cols.forEach((x, i) => {
      for (let y = 0; y < heights[i]; y++) {
        g.fillStyle = flame[Math.min(3, Math.floor((y / heights[i]) * 4))];
        g.fillRect(x, 12 - y, 1, 1);
      }
    });
  });

const signTexture = () =>
  pixelTexture(96, 16, (g, w, h) => {
    g.fillStyle = '#15151a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8622c';
    g.fillRect(0, h - 2, w, 2);
    const img = g.getImageData(0, 0, w, h);
    const plot = (x, y) => {
      const i = (y * w + x) * 4;
      img.data[i] = 255;
      img.data[i + 1] = 241;
      img.data[i + 2] = 201;
      img.data[i + 3] = 255;
    };
    drawText(plot, 'LCOALHOST:3000', 6, 3, 1);
    g.putImageData(img, 0, 0);
  });

const puffTexture = (light) =>
  pixelTexture(8, 8, (g) => {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const d = Math.hypot(x - 3.5, y - 3.5);
        if (d < 2.6 || (d < 3.9 && (x + y) % 2 === 0)) {
          g.fillStyle = light ? '#ffffff' : '#2b2830';
          g.fillRect(x, y, 1, 1);
        }
      }
    }
  });

export function createPlant(stage, tip, onPick) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null; // pas de WebGL : les onglets restent utilisables
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 80);
  const target = new THREE.Vector3(0, 4.3, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf1eee6, 1.7));
  const sun = new THREE.DirectionalLight(0xfff7ee, 2.5);
  sun.position.set(9, 11, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  // Une matiere argile par canal, pour pouvoir surligner un canal entier.
  const clay = {
    MEME: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }),
    VIDEO: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }),
    ARTICLE: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, side: THREE.DoubleSide }),
    // Tour de refroidissement (23/09, demande Naim) : sortie du canal ARTICLE, son propre "canal" PENTEST
    // (lien special vers le Labo Pentest, cf. main.js) — materiau dedie pour que paintEmissive() ci-dessous
    // (qui boucle sur Object.keys(clay)) lui donne son propre survol/etat actif, independant des cheminees.
    PENTEST: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }),
  };
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xe2ded3, roughness: 0.95 }); // bandes grises des cheminees (canal ARTICLE)
  const coalMat = new THREE.MeshStandardMaterial({ color: COAL, roughness: 0.6, flatShading: true });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xbdb7aa });
  const pickables = [];

  function add(kind, geo, mat, x, y, z, { edges = true, cast = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    m.userData.kind = kind;
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat));
    scene.add(m);
    pickables.push(m);
    return m;
  }

  // Sol
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 9.9, 0.4, 72), new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 1 }));
  ground.position.y = -0.2;
  ground.receiveShadow = true;
  scene.add(ground);

  // --- FOUR (VIDEOS) : chaufferie + porte pixel art ---
  add('VIDEO', new THREE.BoxGeometry(5.4, 3.4, 3.6), clay.VIDEO, 0, 1.7, 0);
  add('VIDEO', new THREE.BoxGeometry(3.0, 2.6, 3.0), clay.VIDEO, -1.0, 4.7, 0);
  add('VIDEO', new THREE.CylinderGeometry(0.16, 0.16, 4.2, 12), clay.VIDEO, 0.6, 3.75, 1.2, { edges: false }).rotation.z = Math.PI / 2;
  const doorMat = new THREE.MeshBasicMaterial({ map: furnaceTexture() });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), doorMat);
  door.position.set(1.3, 0.95, 1.81);
  door.userData.kind = 'VIDEO';
  scene.add(door);
  pickables.push(door);
  for (const [wx, lit] of [[-1.9, true], [-1.0, false], [-0.1, true]]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.62), new THREE.MeshBasicMaterial({ color: lit ? 0xffcf7a : 0x2a2530 }));
    w.position.set(wx, 4.75, 1.52);
    w.userData.kind = 'VIDEO';
    scene.add(w);
    pickables.push(w);
  }

  // --- CHEMINEES + TOUR (ARTICLES) ---
  const stacks = [
    { x: -2.3, z: -2.3, h: 8.4, r: 0.36 },
    { x: -1.1, z: -2.6, h: 6.8, r: 0.32 },
    { x: 0.1, z: -2.4, h: 5.7, r: 0.3 },
  ];
  const lights = [];
  const emitters = [];
  for (const s of stacks) {
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const bh = s.h / bands;
      const mat = i % 2 ? clay.ARTICLE : bandMat;
      add('ARTICLE', new THREE.CylinderGeometry(s.r * (1 - (i + 1) / bands * 0.22), s.r * (1 - i / bands * 0.22), bh, 20), mat, s.x, bh * i + bh / 2, s.z, { edges: false });
    }
    add('ARTICLE', new THREE.CylinderGeometry(s.r * 0.86, s.r * 0.8, 0.16, 20), coalMat, s.x, s.h + 0.05, s.z, { edges: false });
    if (s.h > 8) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
      l.position.set(s.x, s.h + 0.28, s.z);
      scene.add(l);
      lights.push(l);
    }
    emitters.push({ x: s.x, y: s.h + 0.2, z: s.z, steam: false });
  }
  const profile = [];
  for (let i = 0; i <= 26; i++) {
    const t = i / 26;
    profile.push(new THREE.Vector2(1.5 + 1.15 * Math.pow(Math.abs(t - 0.62) * 1.6, 2) + 0.25, t * 5.4));
  }
  // Tour de refroidissement : sortie du canal ARTICLE (23/09, demande Naim) — son propre kind 'PENTEST', lien
  // special vers le Labo Pentest (main.js), plus classee avec les cheminees ni visuellement ni au clic.
  add('PENTEST', new THREE.LatheGeometry(profile, 44), clay.PENTEST, 4.6, 0, -1.5, { edges: false });
  emitters.push({ x: 4.6, y: 5.5, z: -1.5, steam: true });

  // --- TREMIE (MEMES) : silo sur pieds + tas de charbon + convoyeur ---
  const hx = -4.7;
  const hz = 1.4;
  for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) add('MEME', new THREE.BoxGeometry(0.16, 1.5, 0.16), clay.MEME, hx + dx, 0.75, hz + dz, { edges: false });
  const funnel = add('MEME', new THREE.ConeGeometry(0.98, 1.0, 28), clay.MEME, hx, 2.0, hz, { edges: false });
  funnel.rotation.x = Math.PI;
  add('MEME', new THREE.CylinderGeometry(0.98, 0.98, 2.2, 28), clay.MEME, hx, 3.6, hz);
  add('MEME', new THREE.ConeGeometry(1.05, 0.55, 28), clay.MEME, hx, 5.0, hz, { edges: false });
  const pile = add('MEME', new THREE.IcosahedronGeometry(1.15, 1), coalMat, -3.1, 0.42, 2.7, { edges: false });
  pile.scale.set(1.5, 0.55, 1.3);
  for (const [lx, lz, s] of [[-2.2, 3.0, 0.32], [-3.9, 3.3, 0.26], [-3.4, 1.9, 0.22]]) {
    const l = add('MEME', new THREE.IcosahedronGeometry(s, 0), coalMat, lx, s * 0.6, lz, { edges: false });
    l.rotation.set(lx, lz, 0);
  }
  const A = new THREE.Vector3(-3.5, 0.95, 2.5);
  const B = new THREE.Vector3(-1.5, 3.7, 1.95);
  const dir = B.clone().sub(A);
  const len = dir.length();
  const belt = add('MEME', new THREE.BoxGeometry(len, 0.16, 0.6), clay.MEME, (A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  belt.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.clone().normalize());
  for (const t of [0.15, 0.5, 0.85]) {
    const p = A.clone().lerp(B, t);
    add('MEME', new THREE.BoxGeometry(0.12, p.y, 0.12), clay.MEME, p.x, p.y / 2, p.z, { edges: false });
  }
  const lumps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.17, 0.12, 0.17), coalMat, 14);
  lumps.castShadow = true;
  scene.add(lumps);
  const dummy = new THREE.Object3D();

  // --- Panneau pixel art ---
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.08), clay.MEME);
  post.position.set(1.9, 0.5, 3.6);
  post.castShadow = true;
  scene.add(post);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.4), new THREE.MeshBasicMaterial({ map: signTexture() }));
  sign.position.set(1.9, 1.15, 3.66);
  scene.add(sign);

  // --- Fumee noire (cheminees) + vapeur (tour), sprites pixel art ---
  const puffs = [];
  const texDark = puffTexture(false);
  const texLight = puffTexture(true);
  for (const e of emitters) {
    const n = e.steam ? 8 : 9;
    for (let i = 0; i < n; i++) {
      const mat = new THREE.SpriteMaterial({ map: e.steam ? texLight : texDark, transparent: true, depthWrite: false, opacity: 0 });
      const sp = new THREE.Sprite(mat);
      scene.add(sp);
      puffs.push({ sp, e, off: i / n, speed: e.steam ? 0.05 : 0.07 });
    }
  }

  // --- Interaction ---
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  let hover = null;
  let active = 'MEME';
  let px = 0;
  let sx = 0;

  function paintEmissive() {
    for (const k of Object.keys(clay)) {
      const on = k === hover ? 0.32 : k === active ? 0.1 : 0;
      for (const m of k === 'ARTICLE' ? [clay[k], bandMat] : [clay[k]]) {
        m.emissive.setHex(ACCENT);
        m.emissiveIntensity = on;
      }
    }
  }

  function setPointer(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    px = pointer.x;
    tip.style.left = `${ev.clientX - r.left + 14}px`;
    tip.style.top = `${ev.clientY - r.top + 14}px`;
  }
  renderer.domElement.addEventListener('pointermove', (ev) => {
    setPointer(ev);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    const kind = hit ? hit.object.userData.kind : null;
    if (kind !== hover) {
      hover = kind;
      renderer.domElement.style.cursor = kind ? 'pointer' : 'default';
      tip.hidden = !kind;
      if (kind) tip.textContent = t(`plant.tip.${kind}`);
      paintEmissive();
    }
  });
  renderer.domElement.addEventListener('pointerleave', () => {
    hover = null;
    tip.hidden = true;
    px = 0;
    paintEmissive();
  });
  renderer.domElement.addEventListener('click', (ev) => {
    setPointer(ev);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    if (hit) onPick(hit.object.userData.kind);
  });

  // --- Boucle ---
  let visible = true;
  const size = () => {
    const w = stage.clientWidth || 400;
    const h = stage.clientHeight || 300;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(stage);
  new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(stage);
  size();
  paintEmissive();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = reduce ? 0 : clock.getElapsedTime();
    sx += (px - sx) * 0.05;
    const az = 0.62 + Math.sin(t * 0.15) * 0.1 + sx * 0.35;
    const dist = 26 * Math.max(1, Math.pow(1.25 / camera.aspect, 0.55));
    camera.position.set(target.x + Math.sin(az) * dist * 0.72, target.y + 4.2 + pointer.y * 0.6, target.z + Math.cos(az) * dist * 0.72);
    camera.lookAt(target);

    for (const p of puffs) {
      const q = (t * p.speed + p.off) % 1;
      const grow = 0.5 + q * (p.e.steam ? 2.6 : 1.9);
      p.sp.position.set(p.e.x + q * 2.4 + Math.sin(q * 6 + p.off * 9) * 0.12, p.e.y + q * (p.e.steam ? 4.6 : 5.6), p.e.z + Math.sin(p.off * 20) * 0.1);
      p.sp.scale.set(grow, grow, 1);
      p.sp.material.opacity = Math.min(1, q * 8) * Math.pow(1 - q, 1.3) * (p.e.steam ? 0.7 : 0.8);
    }
    for (let i = 0; i < lumps.count; i++) {
      const q = (t * 0.16 + i / lumps.count) % 1;
      dummy.position.lerpVectors(A, B, q);
      dummy.position.y += 0.15;
      dummy.quaternion.copy(belt.quaternion);
      dummy.updateMatrix();
      lumps.setMatrixAt(i, dummy.matrix);
    }
    lumps.instanceMatrix.needsUpdate = true;
    const blink = Math.floor(t / 0.8) % 2 === 0;
    for (const l of lights) l.visible = blink;
    const f = 0.86 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
    doorMat.color.setScalar(f);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    setActive(kind) {
      active = kind;
      paintEmissive();
    },
  };
}
