// Hero : bande pixel art 100 % largeur — couchant, centrale a charbon, cheminees qui crachent du noir.
// Rendu basse resolution (hauteur interne fixe) mis a l'echelle ENTIERE avec image-rendering: pixelated.
import { drawText } from './pixelfont.js';

const H = 96; // hauteur interne en pixels
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((r) => r.map((v) => (v + 0.5) / 16));
const bayer = (x, y) => BAYER[y & 3][x & 3];

const rgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rng = (seed) => {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
};

const SKY = ['#241a32', '#35243f', '#4e2c49', '#7a3a4f', '#b04a4c', '#e2692e', '#f39a3a', '#fbc357', '#ffe39a'].map(rgb);
const C = {
  far: rgb('#6a3a4d'),
  mid: rgb('#3b2540'),
  ground: rgb('#140e17'),
  groundLine: rgb('#2a1d2e'),
  plant: rgb('#150f19'),
  plantLit: rgb('#5a3550'),
  band: rgb('#33243a'),
  coal: rgb('#0b080d'),
  coalSpeck: rgb('#2a2030'),
  belt: rgb('#1e1522'),
  sunCore: rgb('#fff1b8'),
  sunRing: rgb('#ffe08a'),
  sunGlow: rgb('#fbc357'),
  cream: [rgb('#fff6dc'), rgb('#fff1c9'), rgb('#ffe9b0'), rgb('#ffdc94'), rgb('#ffc866'), rgb('#ffb04d'), rgb('#f39a3a')],
  shadow: rgb('#2a1420'),
  window: rgb('#ffc85a'),
  red: rgb('#ff3b30'),
  bird: rgb('#1a1218'),
};
const SMOKE = [rgb('#15101a'), rgb('#241a2a'), rgb('#3a2b3c')];
const STEAM = [rgb('#fff0d2'), rgb('#f7d9b0')];

function buildScene(W) {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(W, H);
  const d = img.data;
  const put = (x, y, c) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = 255;
  };
  const rect = (x, y, w, h, c) => {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) put(x + xx, y + yy, c);
  };
  const rand = rng(1997);
  const hy = Math.round(H * 0.7);

  // Ciel : bandes de couleur fondues par tramage de Bayer.
  for (let y = 0; y < hy; y++) {
    const v = Math.pow(y / hy, 1.25) * (SKY.length - 1);
    const i = Math.floor(v);
    const f = v - i;
    for (let x = 0; x < W; x++) put(x, y, SKY[Math.min(i + (f > bayer(x, y) ? 1 : 0), SKY.length - 1)]);
  }

  // Soleil couchant + halo tramé.
  const sx = Math.round(W * 0.68);
  const sy = hy - 3;
  const R = 13;
  for (let y = sy - 42; y < hy; y++) {
    for (let x = sx - 42; x < sx + 42; x++) {
      const dist = Math.hypot(x - sx, y - sy);
      if (dist < R) put(x, y, C.sunCore);
      else if (dist < 42 && (1 - (dist - R) / (42 - R)) * 0.65 > bayer(x, y)) put(x, y, dist < R + 5 ? C.sunRing : C.sunGlow);
    }
  }

  // Collines lointaines puis crete moyenne, puis sol.
  for (let x = 0; x < W; x++) {
    const hf = Math.round(4 + 3 * Math.sin(x * 0.045 + 1.3) + 2 * Math.sin(x * 0.11 + 0.4));
    for (let y = hy - hf; y < hy; y++) put(x, y, C.far);
    const hm = Math.round(2 + 2 * Math.sin(x * 0.07 + 2.1) + 1.5 * Math.sin(x * 0.19));
    for (let y = hy - hm; y < hy + 1; y++) put(x, y, C.mid);
  }
  for (let y = hy + 1; y < H; y++) for (let x = 0; x < W; x++) put(x, y, C.ground);
  for (let x = 0; x < W; x++) put(x, hy + 1, C.groundLine);

  const emitters = [];
  const windows = [];
  const lights = [];

  // Centrale principale, deliberement asymetrique.
  const x0 = Math.round(W * 0.38);
  rect(x0, hy - 24, 38, 24, C.plant);
  rect(x0 + 6, hy - 34, 20, 10, C.plant);
  rect(x0 + 38, hy - 14, 46, 14, C.plant);
  for (let i = 0; i < 12; i++) rect(x0 + 38 + i * 4, hy - 14 - Math.min(i, 3), 4, 1 + Math.min(i, 3), C.plant); // toit en dents de scie
  rect(x0 + 37, hy - 24, 1, 24, C.plantLit);
  rect(x0 + 83, hy - 14, 1, 14, C.plantLit);
  for (let cx = 0; cx < 7; cx++) {
    for (let cy = 0; cy < 3; cy++) windows.push({ x: x0 + 3 + cx * 5, y: hy - 20 + cy * 6, lit: rand() < 0.4, flick: rand() < 0.22 });
  }
  for (let i = 0; i < 6; i++) windows.push({ x: x0 + 42 + i * 7, y: hy - 9, lit: rand() < 0.5, flick: rand() < 0.2 });

  // Cheminees (hauteur, largeur) + bandes + arete eclairee cote soleil.
  const stacks = [
    { x: x0 + 8, h: 50, w: 6 },
    { x: x0 + 19, h: 41, w: 5 },
    { x: x0 + 29, h: 58, w: 6 },
    { x: x0 + 62, h: 32, w: 4 },
  ];
  if (W > 420) stacks.push({ x: Math.round(W * 0.88), h: 38, w: 5 });
  for (const s of stacks) {
    if (s.x + s.w >= W + 4) continue;
    const top = hy - s.h;
    for (let y = top; y < hy; y++) {
      const inset = y - top < s.h * 0.5 ? 1 : 0; // fut legerement conique
      rect(s.x + inset, y, s.w - inset * 2, 1, C.plant);
      if ((y - top) % 9 === 4) rect(s.x + inset, y, s.w - inset * 2, 1, C.band);
    }
    rect(s.x + s.w - 2, top, 1, s.h, C.plantLit);
    emitters.push({ x: s.x + s.w / 2, y: top - 1, kind: 'smoke' });
    if (s.h >= 50) lights.push({ x: Math.round(s.x + s.w / 2), y: top - 2 });
  }
  if (W > 420) {
    const bx = Math.round(W * 0.88) - 22;
    rect(bx, hy - 12, 18, 12, C.plant);
  }

  // Tours de refroidissement (profil hyperbolique) + vapeur claire.
  for (const cx of [x0 + 112, x0 + 148]) {
    if (cx - 18 >= W) continue;
    const th = 40;
    for (let y = 0; y < th; y++) {
      const t = y / th;
      const hw = Math.round(11 + 6.5 * Math.pow(Math.abs(t - 0.62) * 1.6, 2)); // taille de guepe a 62 % de la hauteur
      rect(cx - hw, hy - 1 - y, hw * 2, 1, C.plant);
      put(cx + hw - 1, hy - 1 - y, C.plantLit);
    }
    emitters.push({ x: cx, y: hy - th - 1, kind: 'steam' });
  }

  // Tas de charbon + convoyeur incline.
  const px = x0 - 44;
  for (let dx = -17; dx <= 17; dx++) {
    const hgt = Math.round(14 * Math.pow(1 - Math.abs(dx) / 17, 0.9) + (rand() < 0.3 ? 1 : 0));
    for (let y = 0; y < hgt; y++) put(px + dx, hy - y, rand() < 0.08 ? C.coalSpeck : C.coal);
  }
  for (let i = 0; i <= 36; i++) {
    const t = i / 36;
    const bx = Math.round(x0 - 30 + t * 30);
    const by = Math.round(hy - 12 - t * 12);
    rect(bx, by, 1, 2, C.belt);
    if (i % 9 === 0) rect(bx, by + 2, 1, hy - by - 2, C.belt); // pieds
  }

  // Pylone a gauche + fils affaissés vers la centrale.
  const py = Math.round(W * 0.16);
  for (let i = 0; i < 34; i++) {
    const w = Math.round(1 + (i / 34) * 5);
    put(py - w, hy - 34 + i, C.plant);
    put(py + w, hy - 34 + i, C.plant);
    if (i % 8 === 3) rect(py - w, hy - 34 + i, w * 2 + 1, 1, C.plant);
  }
  for (const [ox, oy] of [[-6, 2], [6, 2], [-4, 11], [4, 11]]) {
    for (let x = py + ox; x < Math.min(W, x0 - 4); x++) {
      const t = (x - (py + ox)) / Math.max(1, x0 - 4 - (py + ox));
      put(x, hy - 34 + oy + Math.round(Math.sin(t * Math.PI) * 6 + t * 10), C.plant);
    }
  }

  // Voie ferree au premier plan + eclats de charbon.
  for (let x = 0; x < W; x++) {
    put(x, H - 6, C.band);
    if (x % 4 === 0) rect(x, H - 5, 2, 1, C.groundLine);
  }
  for (let i = 0; i < W * 0.6; i++) put(Math.floor(rand() * W), hy + 3 + Math.floor(rand() * (H - hy - 10)), C.coalSpeck);

  // Logo pixel : LCOALHOST (les lettres se lisent comme une faute de frappe, c'est voulu).
  const sc = W >= 300 ? 2 : 1;
  const plot = (x, y, row) => put(x, y, C.cream[Math.min(row, 6)]);
  const shadow = (x, y) => put(x, y, C.shadow);
  drawText(shadow, 'LCOALHOST', 9, 9, sc);
  drawText(shadow, 'LCOALHOST', 10, 10, sc);
  drawText(plot, 'LCOALHOST', 8, 8, sc);

  ctx.putImageData(img, 0, 0);
  return { canvas: cv, hy, emitters, windows, lights };
}

function createSim(scene, W) {
  const rand = rng(42);
  const st = { t: 0, particles: [], trainX: W + 20, birds: [] };
  for (let i = 0; i < 3; i++) st.birds.push({ x: rand() * W, y: scene.hy - 46 + rand() * 14, v: 0.12 + rand() * 0.1, ph: rand() * 6 });

  st.step = () => {
    st.t++;
    const wind = 0.06 + 0.03 * Math.sin(st.t * 0.02);
    for (const e of scene.emitters) {
      const steam = e.kind === 'steam';
      if (rand() < (steam ? 0.2 : 0.3)) {
        st.particles.push({ x: e.x + (rand() - 0.5) * 2, y: e.y, vx: wind + rand() * 0.04, vy: -(steam ? 0.14 : 0.18) - rand() * 0.1, age: 0, life: (steam ? 280 : 210) + rand() * 100, steam });
      }
    }
    for (const p of st.particles) {
      p.age++;
      p.x += p.vx + wind * 0.4 * (p.age / p.life);
      p.y += p.vy;
    }
    st.particles = st.particles.filter((p) => p.age < p.life && p.y > -8);
    st.trainX -= 0.4;
    if (st.trainX < -150) st.trainX = W + 30;
    for (const b of st.birds) {
      b.x += b.v;
      if (b.x > W + 6) b.x = -6;
    }
  };
  return st;
}

function drawDynamic(scene, st, W, dyn) {
  const d = dyn.data;
  d.fill(0);
  const put = (x, y, c) => {
    x |= 0;
    y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    d[i] = c[0];
    d[i + 1] = c[1];
    d[i + 2] = c[2];
    d[i + 3] = 255;
  };
  const rect = (x, y, w, h, c) => {
    for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) put(x + xx, y + yy, c);
  };

  // Fenetres allumees (quelques-unes vacillent).
  for (const w of scene.windows) {
    const on = w.flick ? Math.sin(st.t * 0.05 + w.x * 1.7) > -0.2 : w.lit;
    if (on) rect(w.x, w.y, 2, 2, C.window);
  }

  // Fumee noire / vapeur claire : densite = tramage qui s'eclaircit avec l'age.
  for (const p of st.particles) {
    const a = p.age / p.life;
    const size = 2 + Math.floor(a * (p.steam ? 6 : 5));
    const dens = Math.min(1, a * 6) * (1 - a) * (p.steam ? 0.75 : 0.98);
    const pal = p.steam ? STEAM : SMOKE;
    const col = pal[Math.min(pal.length - 1, Math.floor(a * pal.length))];
    const px = Math.round(p.x - size / 2);
    const py = Math.round(p.y - size / 2);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (dens > bayer(px + x, py + y)) put(px + x, py + y, col);
  }

  // Feux d'obstacle rouges sur les cheminees les plus hautes.
  if (Math.floor(st.t / 24) % 2 === 0) for (const l of scene.lights) rect(l.x - 1, l.y, 2, 2, C.red);

  // Train de charbon.
  const ty = H - 12;
  for (let k = 0; k < 7; k++) {
    const x = Math.round(st.trainX + k * 17);
    if (x < -20 || x > W + 4) continue;
    rect(x, ty, 15, 5, [27, 19, 32]);
    for (let i = 0; i < 15; i += 2) put(x + i, ty - 1, C.coal);
    rect(x + 2, H - 7, 2, 1, C.band);
    rect(x + 10, H - 7, 2, 1, C.band);
  }
  const lx = Math.round(st.trainX - 19);
  if (lx > -20 && lx < W + 4) {
    rect(lx, ty - 2, 17, 7, [21, 15, 25]);
    rect(lx + 10, ty - 6, 5, 4, [21, 15, 25]);
    rect(lx + 2, ty - 5, 2, 3, [21, 15, 25]);
    put(lx + 16, ty + 1, C.window);
  }

  // Oiseaux (2 images d'ailes).
  for (const b of st.birds) {
    const up = Math.floor((st.t + b.ph * 10) / 8) % 2 === 0;
    const x = Math.round(b.x);
    const y = Math.round(b.y);
    for (const [dx, dy] of up ? [[-2, -1], [-1, 0], [0, 0], [1, 0], [2, -1]] : [[-2, 1], [-1, 0], [0, 0], [1, 0], [2, 1]]) put(x + dx, y + dy, C.bird);
  }
}

export function startHero(canvas, host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  const dynCanvas = document.createElement('canvas');
  const dynCtx = dynCanvas.getContext('2d');
  let W = 0;
  let scene;
  let st;
  let dyn;
  let visible = true;
  let last = 0;

  function paint() {
    ctx.drawImage(scene.canvas, 0, 0);
    drawDynamic(scene, st, W, dyn);
    dynCtx.putImageData(dyn, 0, 0);
    ctx.drawImage(dynCanvas, 0, 0);
  }

  let lastW = 0;
  function layout() {
    const vw = host.clientWidth;
    if (!vw) return; // pas encore mis en page (onglet cache, panneau ferme) : le ResizeObserver rappellera
    lastW = vw;
    const target = Math.min(320, Math.max(200, vw * 0.24));
    const scale = Math.max(2, Math.round(target / H));
    W = Math.ceil(vw / scale);
    canvas.width = W;
    canvas.height = H;
    dynCanvas.width = W;
    dynCanvas.height = H;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    host.style.height = `${H * scale}px`;
    scene = buildScene(W);
    dyn = dynCtx.createImageData(W, H);
    st = createSim(scene, W);
    for (let i = 0; i < 320; i++) st.step(); // le panache est deja etabli au premier affichage
    paint();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!scene || !visible || document.hidden || reduce || now - last < 33) return;
    last = now;
    st.step();
    paint();
  }

  layout();
  requestAnimationFrame(frame);
  let timer;
  new ResizeObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => host.clientWidth && host.clientWidth !== lastW && layout(), 120);
  }).observe(host);
  new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(host);
}
