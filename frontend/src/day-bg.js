// Fond "day-bg" (Naim 22/09, 8e passe) : UNIQUEMENT en theme jour ("white"). Empile les images de
// public/img/day-bg/ dans l'ordre numerique puis en boucle (index % longueur -> repart a ground0 apres la
// derniere), a partir de 300vh de scroll. Chaque image en pleine largeur et hauteur NATURELLE (Naim 23/09 :
// l'image entiere, sans recadrage) -> la hauteur de chaque image vient de ses proportions, connues une fois
// chargee. Opacite 1 + mix-blend-mode:screen (style.css). Liste des fichiers generee par scripts/gen-day-bg.js
// (meme pattern anti-perimption que banner-titles.generated.js) — jamais coder les noms de fichiers en dur ici.
//
// Piege evite (reel, pas hypothetique) : mesurer document.documentElement.scrollHeight pour savoir
// "combien de segments il faut" boucle sur lui-meme -> notre propre calque (position:absolute) agrandit
// ce scrollHeight des qu'on lui ajoute une image -> plus de hauteur mesuree -> plus de segments ajoutes
// -> boucle infinie qui ne s'arrete jamais. On mesure a la place le bas REEL du pied de page (offsetTop
// en remontant les offsetParent, meme technique que naturalBottom() dans scroll-anchor.js), qui ne bouge
// jamais a cause de notre propre calque : `position:absolute` sort du flux, ne pousse aucun element normal.
import { DAY_BG_GROUNDS } from './day-bg.generated.js';
import { getTheme } from './theme.js';

let layer = null;
let nextIndex = 0;
// Proportions naturelles (hauteur/largeur) par fichier, apprises au premier chargement de chaque image : la
// hauteur affichee = largeur du calque x ratio, recalculable a chaque resize sans recharger. 0 = image en erreur.
const ratios = new Map();

function naturalBottom(node) {
  let offset = 0;
  let n = node;
  while (n) {
    offset += n.offsetTop;
    n = n.offsetParent;
  }
  return offset + node.offsetHeight;
}

function ensureLayer() {
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'day-bg';
    document.body.prepend(layer);
  }
  return layer;
}

function appendSegment() {
  const file = DAY_BG_GROUNDS[nextIndex % DAY_BG_GROUNDS.length];
  const img = document.createElement('img');
  img.src = `/img/day-bg/${file}`;
  img.alt = '';
  img.decoding = 'async';
  img.dataset.file = file;
  // Pas de loading=lazy : une image lazy hors ecran ne se charge pas, sa hauteur resterait inconnue et bloquerait
  // l'enchainement. On n'ajoute de toute facon que les images necessaires pour couvrir la page (voir fill()).
  if (!ratios.has(file)) {
    img.addEventListener('load', () => { ratios.set(file, img.naturalHeight / img.naturalWidth || 0); fill(); }, { once: true });
    img.addEventListener('error', () => { ratios.set(file, 0); fill(); }, { once: true });
  }
  ensureLayer().appendChild(img);
  nextIndex++;
}

// Hauteur affichee d'une image du calque, ou null si ses proportions ne sont pas encore connues (en chargement).
function shownHeight(img, width) {
  const r = ratios.get(img.dataset.file);
  return r === undefined ? null : r * width;
}

function clearLayer() {
  layer?.remove();
  layer = null;
  nextIndex = 0;
}

function fill() {
  if (getTheme() !== 'white' || !DAY_BG_GROUNDS.length) return;
  const footer = document.querySelector('.foot');
  if (!footer) return;
  const l = ensureLayer();
  // Le pied de page est la vraie limite (retour Naim 22/09) : la hauteur exacte necessaire sert a la fois a
  // savoir combien d'images empiler ET a rogner le calque via overflow:hidden (voir #day-bg dans style.css) —
  // sans ca la DERNIERE image deborde sous le vrai bas du pied de page (bug reel signale par Naim, capture).
  // Depart du calque LU tel que le navigateur l'a place (#day-bg{top:300vh} dans style.css = seule source de
  // verite), JAMAIS recalcule en JS via window.innerHeight : bug reel du 23/09 en mobile, le calque s'arretait
  // 2373px avant le footer — innerHeight != 100vh CSS (barre d'adresse mobile, et emulation), 3 x l'ecart.
  const layerTop = l.getBoundingClientRect().top + window.scrollY;
  if (layerTop <= 0) return; // viewport pas encore etabli (0vh) : le double rAF de initDayBg rappellera fill()
  const exactHeight = Math.max(0, naturalBottom(footer) - layerTop);
  // Colle au footer QUELLES QUE SOIENT les images : hauteur du calque fixee au pixel pres + overflow:hidden.
  // Pose AVANT tout le reste pour que ce soit vrai meme pendant qu'une image charge encore.
  l.style.height = exactHeight + 'px';
  const width = l.clientWidth;
  if (!width) return;

  let sum = 0;
  for (const img of l.children) {
    const h = shownHeight(img, width);
    if (h === null) return; // une image charge encore : son evenement load rappellera fill()
    sum += h;
  }
  // Bug reel signale par Naim (capture : zone texturee sous le pied de page) : fill() ne faisait QUE grandir,
  // jamais retrecir. Retire les images du bas devenues inutiles (page raccourcie : changement d'onglet/langue),
  // en synchronisant nextIndex pour garder l'enchainement continu si le contenu regrandit ensuite.
  while (l.children.length > 1) {
    const last = shownHeight(l.lastElementChild, width);
    if (sum - last < exactHeight) break;
    sum -= last;
    l.lastElementChild.remove();
    nextIndex--;
  }
  // Ajoute les images suivantes tant que la page n'est pas couverte. Plafond d'iterations = garde-fou contre une
  // boucle infinie si tout etait en erreur ; une image en erreur (ratio 0) est retiree et sautee.
  for (let guard = 0; sum < exactHeight && guard < 200; guard++) {
    appendSegment();
    const img = l.lastElementChild;
    const h = shownHeight(img, width);
    if (h === null) return; // premiere apparition de ce fichier : on attend son load
    if (h === 0) { img.remove(); continue; }
    sum += h;
  }
}

export function initDayBg() {
  fill();
  // Filet de securite (bug reel trouve en instrumentant fill() : `window.innerHeight` vaut parfois 0 au tout
  // premier appel synchrone, avant que le viewport ne soit completement etabli — fill() bail out sans rien
  // creer, et rien ne le rappelle avant un scroll/resize "en vrai"). Double requestAnimationFrame = attend 2
  // frames de rendu (le viewport est garanti stable a ce moment), rattrape le calque sans dependre d'un
  // scroll utilisateur qui pourrait ne jamais arriver sur une page courte.
  requestAnimationFrame(() => requestAnimationFrame(fill));
  window.addEventListener('lh:theme', () => (getTheme() === 'white' ? fill() : clearLayer()));
  window.addEventListener('lh:lang', fill); // le feed change de contenu -> hauteur de page differente
  window.addEventListener('scroll', fill, { passive: true });
  window.addEventListener('resize', fill);
  // La hauteur de page change sans evenement dedie : cartes ajoutees au feed, onglet "panneau" (Tutoriels,
  // Hacks, Annoncer...) qui MASQUE le feed via l'attribut hidden, panneaux remplis en differe, accordeons
  // Veille/Liquid (classe), iframes TikTok redimensionnees (style). Bug reel du 23/09 : l'ancien observateur ne
  // regardait que #feed -> en passant sur Tutoriels le calque gardait 4000px sous le footer jusqu'au 1er scroll.
  // On observe donc tout #centrale. Aucune boucle possible : #day-bg est hors de #centrale (prepend sur body).
  // Regroupe les rafales de mutations (setTimeout, pas requestAnimationFrame : doit aussi marcher onglet cache).
  let pending = null;
  const schedule = () => {
    if (pending) return;
    pending = setTimeout(() => {
      pending = null;
      fill();
    }, 50);
  };
  const centrale = document.getElementById('centrale');
  if (centrale) {
    new MutationObserver(schedule).observe(centrale, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'class', 'style'],
    });
  }
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
}
