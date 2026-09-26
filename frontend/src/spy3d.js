// "Le Mouchard" (Naim 22/09, 8e chantier) : petite maquette 3D d'une tour de guet — meme langage visuel que
// La Centrale (plant3d.js : argile blanche + aretes fines + accent orange), volontairement plus simple (pas
// d'interaction/raycaster, juste une antenne qui tourne + un phare qui clignote) puisque cette carte n'a rien
// a cliquer : elle affiche juste les infos de connexion du visiteur, recuperees par main.js via /api/whoami.
import * as THREE from 'three';

const ACCENT = 0xe8622c;
const COAL = 0x1c1b20;

export function createSpyTower(stage) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null; // pas de WebGL : la carte affichera quand meme le HUD texte, cf. main.js
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 60);
  const target = new THREE.Vector3(0, 2.6, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xf1eee6, 1.7));
  const sun = new THREE.DirectionalLight(0xfff7ee, 2.3);
  sun.position.set(6, 9, 5);
  scene.add(sun);

  const clay = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  const coalMat = new THREE.MeshStandardMaterial({ color: COAL, roughness: 0.6, flatShading: true });
  const accentMat = new THREE.MeshStandardMaterial({ color: ACCENT, roughness: 0.5 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xbdb7aa });

  function add(geo, mat, x, y, z, { edges = true } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat));
    scene.add(m);
    return m;
  }

  // Socle
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.3, 48), new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 1 }));
  ground.position.y = -0.15;
  scene.add(ground);

  // Pied de la tour (4 poutres) + plateforme
  for (const [dx, dz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    const leg = add(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 10), clay, dx * 1.4, 1.6, dz * 1.4, { edges: false });
    leg.rotation.set((dz > 0 ? -1 : 1) * 0.07, 0, (dx > 0 ? -1 : 1) * 0.07);
  }
  add(new THREE.CylinderGeometry(1.05, 1.05, 0.22, 28), clay, 0, 3.2, 0);
  add(new THREE.CylinderGeometry(0.9, 0.9, 0.7, 28), coalMat, 0, 3.65, 0, { edges: false });

  // Mat + antenne (parent tourne, cf. boucle plus bas)
  const mast = new THREE.Group();
  mast.position.set(0, 4.0, 0);
  scene.add(mast);
  const pole = add(new THREE.CylinderGeometry(0.05, 0.05, 1.0, 10), clay, 0, 0.5, 0, { edges: false });
  mast.add(pole);
  const dish = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 10, 28, Math.PI * 1.4), accentMat);
  dish.position.y = 1.0;
  dish.rotation.x = Math.PI / 2.4;
  mast.add(dish);
  const sweep = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.62, 8), coalMat);
  sweep.position.set(0, 1.0, 0.3);
  sweep.rotation.x = Math.PI / 2;
  mast.add(sweep);

  // Phare clignotant
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  beacon.position.set(0, 4.75, 0);
  scene.add(beacon);

  let visible = true;
  const size = () => {
    const w = stage.clientWidth || 300;
    const h = stage.clientHeight || 220;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(stage);
  new IntersectionObserver((e) => (visible = e[0].isIntersecting)).observe(stage);
  size();

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const t = reduce ? 0 : clock.getElapsedTime();
    const az = t * 0.2;
    camera.position.set(target.x + Math.sin(az) * 9, target.y + 1.4, target.z + Math.cos(az) * 9);
    camera.lookAt(target);
    mast.rotation.y = reduce ? 0 : t * 0.9; // l'antenne tourne en continu, meme au repos (pas de raycaster ici)
    beacon.visible = Math.floor(t / 0.6) % 2 === 0;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {};
}
