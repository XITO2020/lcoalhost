// Rend les VRAIS encarts pub tiers approuves dans .ads-aside (23/09, SPEC-ROADMAP.md Phase E, point 5 :
// "distinction visuelle stricte pub tierce vs pub maison" — etiquette "Publicite" toujours visible, jamais
// une pub native masquee). Tant qu'aucun encart n'est APPROVED + dans sa fenetre de dates, les 5 rectangles
// placeholder statiques (index.html, "Your ad here") restent affiches tels quels — honnete, pas de contenu
// invente pour remplir la place.
import { api } from './api.js';
import { getLang, t } from './i18n.js';
import { trackPromo } from './promo-track.js';
import { SQUARE_FILES, SQUARE_FILES_FR } from './pubs.generated.js';

const safeHref = (u) => (/^https?:\/\//i.test(String(u ?? '')) ? u : '#'); // jamais javascript: (audit 24/09)
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Encarts CARRES maison (Naim 24/09, public/pubs/squares/) : pubs des projets de Naim, lien reel, places un par un
// (main.js : adtv1e1 en 3e position de l'aside gauche, adtv1e2 seul sous Liquid). Les pubs discretes (sites a garder
// confidentiels avant leur protection) n'existent qu'en DEV : ce bloc disparait du code de production.
const HOUSE_SQUARES = {
  'adtv1e1.webp': { url: 'https://tuveuxun.expert', label: 'tuveuxun.expert' },
  'adtv1e2.webp': { url: 'https://tuveuxun.expert', label: 'tuveuxun.expert' },
  // Pubs gratuites (Naim 26/09) : outils reconnus, pour que tuveuxun soit "un parmi d'autres". Liens verifies 200 le
  // 26/09/2026. Tant que l'image n'existe pas dans public/pubs/, l'encart reste un placeholder (rien ne casse).
  'minimax.webp': { url: 'https://design.minimax.io/', label: 'MiniMax Design' },
  'higgsfield.webp': { url: 'https://higgsfield.ai', label: 'Higgsfield AI' },
  'ollama.webp': { url: 'https://ollama.com', label: 'Ollama' },
  'codeberg.webp': { url: 'https://codeberg.org', label: 'Codeberg' },
  'bouletcorp.webp': { url: 'https://bouletcorp.com', label: 'Bouletcorp' }, // zone_fr_only/squares (interface FR)
  ...(import.meta.env.DEV
    ? { 'avcnewssport.webp': { url: 'https://www.tiktok.com/@tabascocity/video/7172868076235443461', label: 'AVC News Sport' } }
    : {}),
};
// Un carre est disponible selon sa zone : mondial (squares/) toujours ; FR-only (zone_fr_only/squares/) seulement en
// interface FR (Naim 24/09, cible sur la langue, pas la geoloc IP). Le dossier de l'image suit la zone.
function squareSlot(file) {
  const info = HOUSE_SQUARES[file];
  if (!info) return null;
  const isFr = SQUARE_FILES_FR.includes(file);
  const available = SQUARE_FILES.includes(file) || (isFr && getLang() === 'fr');
  if (!available) return null; // fichier retire, pub discrete en prod, ou carre FR hors interface FR
  const folder = isFr ? 'zone_fr_only/squares' : 'squares';
  const a = document.createElement('a');
  a.className = 'ads-slot ads-slot-real ads-slot-square';
  a.href = info.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', info.label);
  a.innerHTML = `<img src="/pubs/${folder}/${encodeURIComponent(file)}" alt="${esc(info.label)}" loading="lazy">`;
  trackPromo(a, `pub:squares/${file}`);
  return a;
}
// Place le carre `file` a l'emplacement `at` (0 = 1er) en REMPLACANT l'encart qui s'y trouve.
function placeSquare(body, { file, at }) {
  const slot = squareSlot(file);
  const target = body.children[at];
  if (!slot) return;
  if (target) target.replaceWith(slot);
  else body.appendChild(slot);
}

// Volet gauche (Naim 23/09) : les encarts sont poses sur le fond et defilent avec la page ; ils se REPRODUISENT sur
// toute la hauteur de la colonne (bandeau -> footer, hauteur posee par layoutDrawers() dans main.js). Le jeu de base
// (placeholders ou vraies pubs) est repete tant qu'il reste de la place ; recalcule quand la colonne change de
// hauteur. Une copie de vraie pub est suivie comme l'originale : chaque copie reellement vue = un affichage reel.
function fillColumn(rootEl) {
  const body = rootEl.querySelector('.aside-body');
  if (!body) return;
  body.querySelectorAll('[data-ads-clone]').forEach((c) => c.remove());
  const base = [...body.children];
  if (!base.length) return;
  const cs = getComputedStyle(rootEl);
  const room = rootEl.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  for (let i = 0; i < 300; i++) {
    const src = base[i % base.length];
    const copy = src.cloneNode(true);
    copy.dataset.adsClone = '1';
    body.appendChild(copy);
    if (body.offsetHeight > room) {
      copy.remove();
      break;
    }
    if (src.dataset.promoKey) trackPromo(copy, src.dataset.promoKey);
  }
}

// Options (Naim 24/09) : `square` = un carre maison { file, at } dans la colonne (repete avec elle) ; `only` = la
// colonne ne montre QUE ce carre s'il est disponible, sinon ses placeholders. Reconstruit au changement de langue :
// les carres FR-only apparaissent/disparaissent selon l'interface (zone_fr_only).
export async function createAdsAside(rootEl, { repeat = false, square = null, only = null } = {}) {
  const body = rootEl.querySelector('.aside-body');
  if (!body) return;
  const placeholderHTML = body.innerHTML; // les "Your ad here" d'origine (index.html) : point de depart de chaque rendu
  let slotsCache = null; // vrais encarts tiers, charges une fois

  const build = async () => {
    body.innerHTML = placeholderHTML;
    if (only) {
      const slot = squareSlot(only);
      if (slot) body.replaceChildren(slot); // sinon on garde les placeholders (visiteur hors interface FR)
      return;
    }
    if (slotsCache === null) slotsCache = (await api.adsActive('ADS_ASIDE').catch(() => ({ slots: [] }))).slots;
    if (slotsCache.length) {
      body.innerHTML = slotsCache
        .map(
          (s) =>
            `<a class="ads-slot ads-slot-real" href="${esc(safeHref(s.linkUrl))}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${esc(t('ads.sponsoredLabel'))} — ${esc(s.tooltip)}">
          <span class="ads-slot-badge">${esc(t('ads.sponsoredLabel'))}</span>
          <img src="${esc(s.imageUrl)}" alt="${esc(s.tooltip)}" loading="lazy">
        </a>`,
        )
        .join('');
      [...body.querySelectorAll('.ads-slot-real')].forEach((a, i) => trackPromo(a, `ad:${slotsCache[i].id}`));
    }
    // Carre(s) maison, avant recopiage : les copies reprennent le jeu de base. `square` = un objet OU une liste (26/09).
    for (const sq of [].concat(square ?? [])) placeSquare(body, sq);
    if (repeat) fillColumn(rootEl);
  };

  await build();
  if (repeat && 'ResizeObserver' in window) {
    let lastH = -1;
    new ResizeObserver(() => {
      if (rootEl.clientHeight === lastH) return; // seulement quand la HAUTEUR de la colonne change
      lastH = rootEl.clientHeight;
      fillColumn(rootEl);
    }).observe(rootEl);
  }
  window.addEventListener('lh:lang', () => build());
}
