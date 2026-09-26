import './style.css';
import { api } from './api.js';
import { captureAdminTokenFromUrl, initAdmin, logout as adminLogout } from './admin.js';
import { BANNER_TITLES_ALL, BANNER_TITLES_DAY, BANNER_TITLES_NIGHT, BANNER_TITLES_URBEX } from './banner-titles.generated.js';
import { initDayBg } from './day-bg.js';
import { createFeed } from './feed.js';
import { applyStaticI18n, GAG_METRICS, getLang, LANGS, setLang, t } from './i18n.js';
import { getTheme, nextTheme, setTheme } from './theme.js';
import { bindSoundButton, bindSoundUnlock } from './sound.js';

const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);


// Mode admin (Naim 22/09) : capte ?admin=<token> s'il est present (et nettoie l'URL), puis valide en tache de
// fond. Un visiteur normal ne voit jamais rien de tout ca (isAdmin() reste false, la validation echoue en silence).
captureAdminTokenFromUrl();
initAdmin().then((ok) => {
  $('#admin-badge').hidden = !ok;
  $('#tab-post').hidden = !ok;
  if (ok) {
    feed.repaint();
    checkStorage();
  }
});
// Deconnexion (23/09, demande Naim — manquait) : clic sur le badge ADMIN lui-meme, confirm() avant (meme
// pattern que la suppression d'item, feed.js), remet l'affichage visiteur normal sans recharger la page.
$('#admin-badge').addEventListener('click', () => {
  if (!confirm(t('admin.confirmLogout'))) return;
  adminLogout();
  $('#admin-badge').hidden = true;
  $('#tab-post').hidden = true;
  $('#storage-warn').hidden = true;
  if (currentKind === 'POST') select('MEME');
  feed.repaint();
});

// Bureau d'embauche (Naim 22/09, 7e passe) : Ouvrier = decoratif, Contremaitre = mot de passe -> mode admin.
import('./embauche.js').then((m) =>
  m.createEmbauche($('#embauche-btn'), {
    onAdmin: () => {
      $('#admin-badge').hidden = false;
      $('#tab-post').hidden = false;
      feed.repaint();
      checkStorage();
    },
  }),
);

// Alerte quota disque (Naim 22/09, "big cleaning") : previent l'admin AVANT que la purge automatique
// (backend, a chaque cycle de scrape) n'efface quoi que ce soit. Verifie a l'activation du mode admin puis
// toutes les 5 min tant que la page reste ouverte — jamais interroge pour un visiteur normal (route protegee
// cote backend de toute facon, mais autant ne pas l'appeler pour rien).
const gb = (n) => (n / (1024 * 1024 * 1024)).toFixed(1) + ' Go';
function checkStorage() {
  api
    .adminStorage()
    .then((s) => {
      $('#storage-warn').hidden = !s.nearLimit;
      $('#storage-warn').title = t('admin.storageWarn', { used: gb(s.usedBytes), budget: gb(s.budgetBytes) });
    })
    .catch(() => {}); // pas admin (token perime entre temps) ou route indisponible : pas grave, on ne redemande pas
}
setInterval(() => {
  if ($('#admin-badge').hidden) return; // pas la peine de sonder si le mode admin n'est plus actif
  checkStorage();
}, 5 * 60_000);

// Panneaux langue/theme : affichent l'etat COURANT (pas la cible du prochain clic — revu sur retour Naim 22/09).
applyStaticI18n();
function paintLangSwitch() {
  $('#lang-switch').textContent = getLang().toUpperCase();
}
paintLangSwitch();
$('#lang-switch').addEventListener('click', () => {
  setLang(LANGS[(LANGS.indexOf(getLang()) + 1) % LANGS.length]); // EN -> FR -> ES -> EN
  paintLangSwitch();
});
window.addEventListener('lh:lang', () => {
  loadSources();
  select(currentKind); // recharge le contenu (memes ET articles filtres par langue) + re-rend les libelles traduits
  paintLangSwitch();
  paintThemeSwitch();
});

function paintThemeSwitch() {
  $('#theme-switch').textContent = t(`theme.${getTheme()}`);
  $('#theme-switch').title = t('theme.switchTo', { theme: t(`theme.${nextTheme()}`) });
}
paintThemeSwitch();
$('#theme-switch').addEventListener('click', () => {
  setTheme(nextTheme());
  paintThemeSwitch();
  pickBannerTitle(); // "meme le changement de mode relance la banniere et son titre" (Naim 22/09)
});

// Bouton "remonter en haut" (Naim 22/09) : apparait apres un peu de scroll.
const toTop = $('#to-top');
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => (toTop.hidden = window.scrollY < 480), { passive: true });

// Bouton "aller au pied de page" (Naim 22/09, 8e passe) : visible seulement tant que le footer n'est pas
// encore visible a l'ecran (page tres longue) — IntersectionObserver plutot qu'un calcul au scroll, plus
// fiable et moins de code (se recalcule tout seul quand le feed grandit et allonge la page).
const toFooter = $('#to-footer');
const footerEl = $('.foot');
toFooter.addEventListener('click', () => footerEl.scrollIntoView({ behavior: 'smooth', block: 'start' }));
new IntersectionObserver(([entry]) => (toFooter.hidden = entry.isIntersecting)).observe(footerEl);
bindSoundButton($('#sound-fab')); // son global du site (Naim 23/09), a droite de ▲ ▼
bindSoundUnlock($('#hero-sound')); // "Appuyer pour autoriser le son" dans le hero, visible tant que le son est coupe

// Titre de banniere (Naim 22/09, revu 6e/9e passe) : Naim a range les variantes en dossiers — celles a la racine
// de img/ sont valables pour TOUS les themes, night/ et urbex/ sont EXCLUSIVES a leur theme. Un titre au hasard
// dans le bon pool a chaque chargement ET a chaque changement de theme (pas juste au chargement).
// Les 3 listes viennent de banner-titles.generated.js (scanne REELLEMENT public/img/ a chaque `npm run dev`) —
// bug reel corrige le 22/09 : des tableaux ecrits a la main se perimaient a chaque fichier ajoute/retire par
// Naim (404 silencieux -> "parfois pas de titre"), plus jamais besoin de les resynchroniser a la main.
function pickBannerTitle() {
  // Jour (blanc) = BANNER_TITLES_DAY (dossier day/, Naim 24/09) ; nuit = night/ ; urbex (steel) = urbex/. Chaque
  // theme : ses titres + les universels (racine img/).
  const extra = getTheme() === 'night' ? BANNER_TITLES_NIGHT : getTheme() === 'steel' ? BANNER_TITLES_URBEX : BANNER_TITLES_DAY;
  const img = $('#banner-title');
  const current = img.getAttribute('src')?.replace(/^\/img\//, '');
  // Jamais le meme titre deux fois de suite (un clic doit TOUJOURS changer le titre).
  const all = [...BANNER_TITLES_ALL, ...extra];
  const pool = all.length > 1 ? all.filter((f) => f !== current) : all;
  img.src = `/img/${pool[Math.floor(Math.random() * pool.length)]}`;
}
pickBannerTitle();
// Clic sur la banniere (Naim 23/09) : change SEULEMENT le titre, sans recharger la page (le lien vers "/" rechargeait
// tout : lecteur video relance, son recoupe). Clic molette / Ctrl / Cmd / Maj = lien normal (accueil, nouvel onglet).
$('.banner-title-link').addEventListener('click', (e) => {
  if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  pickBannerTitle();
});

let plant = null;
let hacks = null; // instancie a la demande (module charge en differe, comme la 3D)
let coal = null;
const tabs = [...document.querySelectorAll('.tab')];
const feedParts = [$('#chips'), $('#sort'), $('#status'), $('#feed'), $('#more')];

const feed = createFeed({
  root: $('#feed'),
  more: $('#more'),
  status: $('#status'),
  chipsEl: $('#chips'),
  sortEl: $('#sort'),
  onShelfCount: (n) => ($('#shelf-n').textContent = String(n)),
});

let currentKind = 'MEME';
let post = null;
let ads = null;
function select(kind, { scroll = false } = {}) {
  currentKind = kind;
  tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.kind === kind)));
  const isHacks = kind === 'HACKS';
  const isCoal = kind === 'COAL';
  // Tutoriels (23/09, demande Naim) : 7e onglet, "ferme" les 2 lignes de tabs. Panneau statique pour l'instant
  // (pas de module dedie comme hacks.js/coal.js) : rien a charger, juste un message honnete "bientot" tant que
  // le contenu n'existe pas — meme discipline que le reste du site, pas de fausse promesse de contenu pret.
  const isTuto = kind === 'TUTO';
  // Annoncer (23/09, SPEC-ROADMAP.md Phase E) : formulaire self-serve public (paiement -> PENDING_REVIEW).
  const isAds = kind === 'ADS';
  // Poster (23/09, SPEC-ROADMAP.md Phase A) : onglet reserve a l'admin (cf. plus bas, unhide sur initAdmin ok),
  // route backend protegee de toute facon (x-admin-token) — ceci n'est que l'affichage.
  const isPost = kind === 'POST';
  const isPanel = isHacks || isCoal || isTuto || isAds || isPost;
  if (isPanel) feedParts.forEach((el) => (el.hidden = true)); // #more reapparait tout seul via feed.js au retour
  else feedParts.filter((el) => el !== $('#more')).forEach((el) => (el.hidden = false));
  $('#hacks').hidden = !isHacks;
  $('#coal').hidden = !isCoal;
  $('#tuto').hidden = !isTuto;
  $('#ads-form-panel').hidden = !isAds;
  $('#post').hidden = !isPost;
  if (isHacks) {
    if (hacks) hacks.reload();
    else import('./hacks.js').then((m) => (hacks = m.createHacks($('#hacks'))));
  } else if (isCoal) {
    if (coal) coal.reload();
    else import('./coal.js').then((m) => (coal = m.createCoal($('#coal'))));
  } else if (isTuto) {
    // rien a faire : panneau statique
  } else if (isAds) {
    if (ads) ads.reload();
    else import('./ads.js').then((m) => (ads = m.createAds($('#ads-form-panel'))));
  } else if (isPost) {
    if (post) post.reload();
    else import('./post.js').then((m) => (post = m.createPost($('#post'))));
  } else {
    if (kind !== 'SHELF') plant?.setActive(kind);
    feed.setKind(kind);
  }
  if (scroll && window.innerWidth < 980) $('.viewer').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

tabs.forEach((tab) => tab.addEventListener('click', () => select(tab.dataset.kind)));
$('#shelf-btn').addEventListener('click', () => {
  select('SHELF');
  $('.viewer').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.querySelectorAll('[data-five]').forEach((b) =>
  b.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.kind === 'ARTICLE')));
    plant?.setActive('ARTICLE');
    feed.setKind('ARTICLE');
    feed.setTopic(b.dataset.five);
    $('.viewer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }),
);

const hacksReturn = new URLSearchParams(location.search).get('hacks');
select(hacksReturn ? 'HACKS' : 'MEME');
feed.refreshFolders();
if (hacksReturn) {
  history.replaceState(null, '', location.pathname); // enleve ?hacks=... de l'URL sans recharger
  const banner = document.createElement('p');
  banner.className = 'status';
  banner.textContent = t(hacksReturn === 'merci' ? 'hacks.thanks' : 'hacks.cancelled');
  $('#hacks').before(banner);
}

// Fond "day-bg" (Naim 22/09, 8e passe) : enchainement infini d'images derriere le contenu, theme jour
// seulement, a partir de 300vh de scroll. Appele apres select()/refreshFolders() ci-dessus pour que #feed
// existe deja (le module observe son contenu pour savoir quand ajouter des segments).
initDayBg();

// Aside "shorts" (veille TikTok/Instagram) : independant des onglets memes/videos/articles, charge une fois au demarrage.
let tiktokRail = null;
import('./tiktok.js').then((m) => (tiktokRail = m.createTiktokRail($('#tiktok-rail'))));
window.addEventListener('lh:lang', () => tiktokRail?.reload());

// Repli de l'aside shorts (Naim 22/09, retire en passe suivante) : retrecissait --watch-w a 56px, ce qui
// squeezait aussi Liquid Enhancement (meme colonne .watch-col, cf. plus haut) — retour Naim : Liquid
// Enhancement doit garder la meme largeur que Veille soit ouverte ou fermee, seule la hauteur (contenu) change.
$('#watch-collapse').addEventListener('click', () => $('#watch-aside').classList.toggle('collapsed'));

// Liquid Enhancement (Naim 22/09) : "fenetre depliante identique" a Veille, juste en dessous. Le visiteur
// decrit une idee pour une des 3 zones, Qwen (Ollama local, backend/src/liquid/routes.ts) la reformule ; s'il
// est satisfait, il peut la soumettre — TOUJOURS en attente de relecture, jamais applique tout seul au site
// (meme discipline que l'agent memes et Add Coal).
$('#liquid-collapse').addEventListener('click', () => $('#liquid-aside').classList.toggle('collapsed'));

// Bouton "close that awkwardness now" (Naim 24/09) : pose en absolute sur la photo T360, ferme (replie) le Liquid Enhancer.
$('#liquid-close-awkward')?.addEventListener('click', () => $('#liquid-aside').classList.add('collapsed'));

// Colonne lecteur video + Liquid (sticky a partir de 1240px). Bug reel du 24/09 (Naim) : plus haute que l'ecran, elle
// restait collee en haut -> Liquid Enhancement jamais atteignable (la molette sur le lecteur fait defiler les clips,
// pas la page). Si elle depasse l'ecran, son `top` devient negatif : au scroll du feed/du fond, elle MONTE avec la
// page jusqu'a ce que son bas (Liquid) soit visible, puis reste collee. Tient dans l'ecran -> top:68px comme avant.
const watchCol = $('.watch-col');
function fitWatchCol() {
  if (!watchCol) return;
  const vh = document.documentElement.clientHeight;
  const h = watchCol.offsetHeight;
  watchCol.style.top = 68 + h + 16 > vh ? `${Math.round(vh - h - 16)}px` : '';
}
if (watchCol) {
  if ('ResizeObserver' in window) new ResizeObserver(fitWatchCol).observe(watchCol); // repli Veille/Liquid, clips charges
  window.addEventListener('resize', fitWatchCol);
  window.addEventListener('scroll', fitWatchCol, { passive: true }); // filet si le ResizeObserver a rate un changement
  fitWatchCol();
}

let liquidArea = 'METRICS';
document.querySelectorAll('.liquid-areas .chip').forEach((chip) =>
  chip.addEventListener('click', () => {
    document.querySelectorAll('.liquid-areas .chip').forEach((c) => c.classList.toggle('on', c === chip));
    liquidArea = chip.dataset.area;
  }),
);

const liquidInput = $('#liquid-input');
const liquidStatus = $('#liquid-status');
const liquidResult = $('#liquid-result');
let liquidEnhancedText = '';

function setLiquidStatus(key) {
  liquidStatus.hidden = !key;
  if (key) liquidStatus.textContent = t(key);
}

$('#liquid-enhance').addEventListener('click', async () => {
  const prompt = liquidInput.value.trim();
  if (prompt.length < 5) return setLiquidStatus('liquid.tooShort');
  setLiquidStatus('liquid.enhancing');
  liquidResult.hidden = true;
  try {
    const { enhanced } = await api.liquidEnhance(liquidArea, prompt, getLang());
    liquidEnhancedText = enhanced;
    $('#liquid-enhanced-text').textContent = enhanced;
    liquidResult.hidden = false;
    setLiquidStatus(null);
  } catch {
    setLiquidStatus('liquid.error');
  }
});

$('#liquid-submit').addEventListener('click', async () => {
  try {
    await api.liquidSubmit(liquidArea, liquidInput.value.trim(), liquidEnhancedText);
    setLiquidStatus('liquid.thanks');
    liquidResult.hidden = true;
    liquidInput.value = '';
  } catch (err) {
    setLiquidStatus(err.status === 429 ? 'liquid.quotaReached' : 'liquid.error');
  }
});

// Aside pub (meme principe que studio-ai/MegaStudio) : chargee en differe, jamais visible en mobile (CSS).
import('./pub.js').then((m) => m.createPubAside($('#pub-aside')));
// Encarts pub tiers reels (23/09, SPEC-ROADMAP.md Phase E) : remplace les rectangles placeholder statiques
// UNIQUEMENT s'il existe de vrais encarts approuves — sinon les garde tels quels (honnete, "Your ad here").
import('./ads-aside.js').then((m) => {
  // Encart pub VIDE (Naim 24/09) : clic -> formulaire de devis (modal facon Labo Pentest). Delegation car les encarts
  // sont recrees/clones par ads-aside.js (fillColumn) : un listener direct serait perdu a chaque re-rendu.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.ads-slot-cta')) import('./quote-modal.js').then((mod) => mod.openQuoteModal());
  });
  // Encarts repetes sur toute la colonne (Naim 23/09) ; carre maison adtv1e1 en 3e position (Naim 24/09).
  m.createAdsAside($('#ads-aside'), { repeat: true, square: { file: 'adtv1e1.webp', at: 2 } });
  // Colonne sous Liquid (Naim 24/09) : carre maison adtv1e2 en tete, puis les placeholders se REPETENT pour remplir
  // l'espace restant jusqu'au bas de l'ecran (hauteur posee par fitAdsExtra). Toujours visible sur desktop : on peut
  // scroller jusqu'aux encarts du bas sans devoir replier Veille+Liquid.
  m.createAdsAside($('#ads-extra'), { repeat: true, square: { file: 'adtv1e2.webp', at: 0 } });
});

// pub-aside/ads-aside : positionnes par layoutDrawers() plus bas (colonnes bandeau -> footer). scroll-anchor.js
// n'est plus appele (23/09 soir) : son fixed a 68px decollait le panneau de sa bande au scroll.

// Volets coulissants pub-aside/ads-aside (23/09, retour Naim : "disparaissent completement au lieu de devenir
// des volets fermes" sous 1700px) : sous ce seuil, .aside-handle reste visible (CSS), clic = bascule .open sur
// l'aside (glisse .aside-body). Ferme aussi au clic en dehors ou a Echap — memes reflexes que le Labo Pentest.
// Volets de dossier (Naim 23/09) : la bande .aside-handle est HORS de l'aside (bande fixe pleine hauteur) ; a
// l'ouverture elle glisse de la largeur du panneau (+ son retrait de 10px) pour rester collee a lui. `side` = sens
// de glissement (-1 : volet droit qui part vers la gauche, +1 : volet gauche).
// Temps REELLEMENT passe sur la page (onglet affiche) : un onglet en arriere-plan ne fait pas avancer le compteur.
function afterVisibleTime(ms, fn) {
  let spent = 0;
  const step = 500;
  const timer = setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    spent += step;
    if (spent >= ms) {
      clearInterval(timer);
      fn();
    }
  }, step);
  return () => clearInterval(timer);
}

// { desktopDelay, mobileDelay } (Naim 24/09) : les volets COMMENCENT REPLIES et se deplient seuls apres ce temps passe
// sur la page — ordi : les 2 apres 40 s ; mobile : le droit apres 30 s, puis le gauche apres 1 min 30. Si le visiteur
// a deja ouvert/ferme ce volet lui-meme avant, on respecte son choix (pas d'ouverture forcee).
// `mobilePeek` (Naim 24/09) : sur mobile, l'ouverture AUTOMATIQUE ne deplie le volet qu'en partie (classe .peek,
// 20 % de large, cf. style.css) — un volet a 50 % qui recouvre le contenu en cours de lecture est un "interstitiel
// intrusif" au sens de Google (penalise en mobile). Toucher la bande le deplie en entier ; toucher a cote le ferme.
function wireAsideDrawer(asideSel, handleSel, side, { desktopDelay, mobileDelay, mobilePeek = false }) {
  const aside = $(asideSel);
  const handle = $(handleSel);
  if (!aside || !handle) return;
  const place = () => {
    const open = aside.classList.contains('open');
    handle.style.transform = open ? `translateX(${side * aside.offsetWidth}px)` : '';
  };
  function setOpen(open) {
    if (!open) aside.classList.remove('peek');
    aside.classList.toggle('open', open);
    handle.setAttribute('aria-expanded', String(open));
    place();
    fitCentrale(); // le contenu se pousse / se relache avec le volet
  }
  window.addEventListener('resize', place);
  // Ouvert des le chargement : a cet instant l'aside n'a pas encore ses pastilles (largeur fausse, 46px mesures au
  // lieu de 136) -> la bande se recale des que le panneau change de taille.
  if ('ResizeObserver' in window) new ResizeObserver(place).observe(aside);
  let cancelAutoOpen = () => {};
  handle.addEventListener('click', (e) => {
    e.stopPropagation();
    cancelAutoOpen(); // choix du visiteur : plus d'ouverture automatique pour ce volet
    // Volet entrouvert (peek) : toucher la bande le deplie en entier au lieu de le fermer.
    if (aside.classList.contains('peek')) {
      aside.classList.remove('peek');
      place(); // la bande suit tout de suite la nouvelle largeur
      fitCentrale();
      return;
    }
    setOpen(!aside.classList.contains('open'));
  });
  // Sur ordinateur (> 980px) un volet ne se ferme QUE par sa bande (sinon le 1er clic n'importe ou sur la page le
  // refermerait). Sur mobile il couvre la moitie de l'ecran : fermeture aussi au clic dehors / Echap.
  // clientWidth et pas innerWidth (piege emulation du panneau navigateur sous 768px, cf. CLAUDE.md).
  const isMobile = () => document.documentElement.clientWidth <= 980;
  setOpen(false);
  cancelAutoOpen = afterVisibleTime(isMobile() ? mobileDelay : desktopDelay, () => {
    if (mobilePeek && isMobile()) aside.classList.add('peek');
    setOpen(true);
  });
  document.addEventListener('click', (e) => {
    if (isMobile() && aside.classList.contains('open') && !aside.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (isMobile() && e.key === 'Escape' && aside.classList.contains('open')) setOpen(false);
  });
}
// RESPONSIVE (Naim 24/09 : "le site n'est pas du tout responsive... agencement supra intelligent dans les coins") :
// sur ordinateur, les volets POUSSENT le contenu au lieu de le recouvrir. Marge poussee = ce que le volet occupe
// (bande + panneau s'il est ouvert, + 8px d'air) au-dela de la marge libre du cote (.centrale fait 1280px max,
// centree) -> 0 sur grand ecran. Nombre de colonnes decide avec les 2 volets OUVERTS (pire cas) : la mise en page ne
// saute pas quand ils s'ouvrent a 40 s, le contenu se resserre juste en douceur. --drawer-r (racine) sert aux
// boutons flottants ▲ ▼ 🔊 pour se ranger a gauche du volet droit. Mobile (<= 980px) : volets en superposition.
const MAX_CENTRALE = 1280;
const MIN_3_COLS = 900; // plante 320 + Veille 260 + flux ~260 + 2 ecarts de 28
function fitCentrale() {
  const centrale = document.getElementById('centrale');
  const ads = document.getElementById('ads-aside');
  const pub = document.getElementById('pub-aside');
  if (!centrale || !ads || !pub) return;
  const vw = document.documentElement.clientWidth;
  const leftStrip = 16;
  const rightStrip = 32;
  const rightNow = rightStrip + (pub.classList.contains('open') ? pub.offsetWidth : 0);
  if (vw <= 980) {
    centrale.style.removeProperty('--push-l');
    centrale.style.removeProperty('--push-r');
    centrale.classList.remove('narrow');
    document.documentElement.style.setProperty('--drawer-r', `${rightStrip}px`);
    return;
  }
  const side = Math.max(0, (vw - MAX_CENTRALE) / 2);
  const push = (w) => Math.max(0, Math.round(w + 8 - side));
  const leftNow = leftStrip + (ads.classList.contains('open') ? ads.offsetWidth : 0);
  centrale.style.setProperty('--push-l', `${push(leftNow)}px`);
  centrale.style.setProperty('--push-r', `${push(rightNow)}px`);
  const innerIfBothOpen = Math.min(vw, MAX_CENTRALE) - 32 - push(leftStrip + ads.offsetWidth) - push(rightStrip + pub.offsetWidth);
  centrale.classList.toggle('narrow', innerIfBothOpen < MIN_3_COLS);
  document.documentElement.style.setProperty('--drawer-r', `${rightNow}px`);
}
window.addEventListener('resize', fitCentrale);
if ('ResizeObserver' in window) {
  const ro = new ResizeObserver(() => fitCentrale()); // largeur des volets (pastilles chargees, peek -> plein)
  ['#pub-aside', '#ads-aside'].forEach((s) => $(s) && ro.observe($(s)));
}

wireAsideDrawer('#pub-aside', '#pub-handle', -1, { desktopDelay: 40_000, mobileDelay: 30_000, mobilePeek: true }); // droit
wireAsideDrawer('#ads-aside', '#ads-handle', 1, { desktopDelay: 40_000, mobileDelay: 90_000, mobilePeek: true }); // gauche
// VOLETS COULISSANTS (Naim 23/09 soir, version finale) : chaque volet = panneau + bande, UNE colonne de la page qui
// va DIRECTEMENT du bas du bandeau au haut du footer, collee au bord. Elle fait partie de la page (position absolue
// en coordonnees document) : rien a recaler au scroll, panneau et bande ne se decollent jamais, jamais sur la
// banniere ni sur le footer. Le contenu (cercles / encarts) est en flux normal, POSE sur le fond, et defile avec la
// page (Naim 23/09 : "relative, pas absolute") : a droite les cercles s'arretent apres le dernier, a gauche les
// encarts se repetent jusqu'en bas (ads-aside.js). Recalcule au redimensionnement et quand la page change de hauteur.
const tickerEl = $('.ticker');
const foot = $('.foot');
const drawerParts = ['#pub-aside', '#pub-handle', '#ads-aside', '#ads-handle'].map((s) => $(s)).filter(Boolean);
function layoutDrawers() {
  if (!tickerEl || !foot) return;
  const y = window.scrollY;
  const start = tickerEl.getBoundingClientRect().bottom + y;
  const end = foot.getBoundingClientRect().top + y;
  for (const el of drawerParts) {
    const parent = el.offsetParent;
    const base = parent && parent !== document.body ? parent.getBoundingClientRect().top + y : 0;
    el.style.top = `${Math.round(start - base)}px`;
    el.style.height = `${Math.max(0, Math.round(end - start))}px`;
  }
}
window.addEventListener('resize', layoutDrawers);
if ('ResizeObserver' in window) new ResizeObserver(() => layoutDrawers()).observe(document.body);
layoutDrawers();

// Bascule mobile "Videos / Le reste" (Naim 22/09) : saute vers la section correspondante (les 2 restent dans
// le DOM, la bascule ne fait que scroller — pas 2 conteneurs de scroll separes, plus simple et plus robuste).
const watchToggleBtns = [...document.querySelectorAll('.watch-toggle button')];
watchToggleBtns.forEach((b) =>
  b.addEventListener('click', () => {
    watchToggleBtns.forEach((x) => x.classList.toggle('on', x === b));
    const target = b.dataset.mode === 'videos' ? $('#watch-aside') : $('.viewer');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }),
);

// Centrale 3D : chargee apres le premier affichage (three.js pese ~130 Ko gzip).
import('./plant3d.js')
  .then((m) => {
    // Tour de refroidissement = kind 'PENTEST' (23/09, demande Naim) : lien special vers le Labo Pentest, pas
    // un onglet du feed comme les 3 autres batiments — ne passe donc pas par select().
    plant = m.createPlant($('#plant-stage'), $('#plant-tip'), (kind) => (kind === 'PENTEST' ? showPentestModal() : select(kind, { scroll: true })));
    if (!plant) $('#plant-fallback').hidden = false;
    else plant.setActive(feed.kind === 'SHELF' ? 'MEME' : feed.kind);
  })
  .catch(() => ($('#plant-fallback').hidden = false));

// "Le Mouchard" (Naim 22/09, 8e chantier) : tour 3D decorative + HUD texte, montre au visiteur SES PROPRES
// donnees de connexion (IP/ville/FAI via /api/whoami, cf. backend/src/whoami/routes.ts) — jamais celles des
// autres, jamais stockees (rien en base, juste un fetch a chaque affichage). Le WebGL est purement decoratif :
// si createSpyTower echoue, le HUD texte s'affiche quand meme (les deux sont independants, contrairement a
// La Centrale ou le 3D sert a naviguer).
import('./spy3d.js')
  .then((m) => {
    if (!m.createSpyTower($('#spy-stage'))) $('#spy-fallback').hidden = false;
  })
  .catch(() => ($('#spy-fallback').hidden = false));
$('#spy-ip').textContent = $('#spy-city').textContent = $('#spy-isp').textContent = t('mouchard.loading');
// Metriques bidons (22/09) : aleatoires mais stables 24h par IP — le seed vient du backend (hash IP+jour,
// whoami/routes.ts), le choix de la blague est juste `seed % liste.length`. Seeds gardes en dehors du .then
// pour pouvoir re-rendre en langue FR/EN/ES sur changement de langue SANS refaire l'appel /api/whoami.
let gagSeeds = null;
function renderGag() {
  if (!gagSeeds) return;
  const gag = GAG_METRICS[getLang()] ?? GAG_METRICS.en;
  $('#spy-gag-ingest-label').textContent = gag.ingestLabel;
  $('#spy-gag-ingest-value').textContent = gag.ingest[gagSeeds.ingest % gag.ingest.length];
  $('#spy-gag-stool-label').textContent = gag.stoolLabel;
  $('#spy-gag-stool-value').textContent = gag.stool[gagSeeds.stool % gag.stool.length];
}
window.addEventListener('lh:lang', renderGag);
api
  .whoami()
  .then((w) => {
    $('#spy-ip').textContent = w.ip ?? '—';
    $('#spy-city').textContent = w.local ? t('mouchard.local') : w.city ? `${w.city}, ${w.country}` : t('mouchard.unavailable');
    $('#spy-isp').textContent = w.isp ?? (w.local ? t('mouchard.local') : t('mouchard.unavailable'));
    gagSeeds = { ingest: w.gagIngestSeed, stool: w.gagStoolSeed };
    renderGag();
  })
  .catch(() => {
    $('#spy-ip').textContent = $('#spy-city').textContent = $('#spy-isp').textContent = t('mouchard.unavailable');
  });

// Champs PASSIFS (22/09, retour Naim apres refus des "outils de pentesting") : tout ce qui suit vient du
// navigateur du visiteur lui-meme, sur SA propre requete — aucun appel reseau, aucun scan, exactement ce que
// n'importe quel site voit deja normalement (pas plus). Synchrone, pas besoin d'attendre /api/whoami.
function guessSystem() {
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : '?';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : '?';
  return `${browser} · ${os}`;
}
try {
  $('#spy-screen').textContent = `${screen.width}×${screen.height}`;
  $('#spy-timezone').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
  $('#spy-lang').textContent = navigator.language;
  $('#spy-system').textContent = guessSystem();
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  $('#spy-connection').textContent = conn?.effectiveType ? conn.effectiveType.toUpperCase() : t('mouchard.connectionUnknown');
} catch {
  /* API absente sur ce navigateur : les lignes restent a "…", pas grave, rien de critique ici */
}

// Detecteur de trackers (22/09) : toujours PASSIF/local au navigateur — signal DNT/GPC (standards du
// navigateur, il les envoie deja lui-meme) + une detection de bloqueur de pub par "appat" (un element classe
// comme une pub, technique tres repandue et benigne : on regarde juste si NOTRE PROPRE page a ete modifiee
// par une extension du visiteur, aucun reseau, aucun autre site touche). Precision demandee par Naim : "une
// API gratuite de detection tracking" n'existe pas vraiment pour ca, c'est intrinsequement cote navigateur.
function detectTrackers() {
  return new Promise((resolve) => {
    const dnt = navigator.doNotTrack === '1' || navigator.doNotTrack === 'yes' || window.doNotTrack === '1';
    const gpc = navigator.globalPrivacyControl === true;
    const bait = document.createElement('div');
    bait.className = 'ad-banner ads ad-container adsbox pub_300x250';
    bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:2px;height:2px;';
    document.body.appendChild(bait);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const cs = getComputedStyle(bait);
        const blocked = bait.offsetParent === null || cs.display === 'none' || cs.visibility === 'hidden' || bait.offsetHeight === 0;
        bait.remove();
        resolve({ dnt, gpc, blocked });
      });
    });
  });
}
// Labo Pentest (23/09, demande Naim) : remplace l'ancien petit popover "tracker-modal" (ancre au bouton) par
// un vrai modal centre agrandi (pentest-modal.js), qui garde le rappel DNT/GPC/bloqueur EN PLUS de 4 outils
// de pentesting reels presentes en decouverte pedagogique. Deux entrees, une seule fonction : le bouton
// "details" du Mouchard ET la tour de refroidissement de La Centrale (plant3d.js, kind 'PENTEST' cf. plus bas).
let lastTrackerResult = null;
function showPentestModal() {
  const open = (r) => import('./pentest-modal.js').then((m) => m.openPentestModal(r));
  if (lastTrackerResult) open(lastTrackerResult);
  else detectTrackers().then(open);
}
detectTrackers().then((r) => {
  lastTrackerResult = r;
  const any = r.dnt || r.gpc || r.blocked;
  $('#spy-trackers').textContent = any ? t('mouchard.trackersYes') : t('mouchard.trackersNo');
  $('#spy-tracker-detail').addEventListener('click', (ev) => {
    ev.stopPropagation();
    showPentestModal();
  });
});

// Compteur de visites facon 1997 : une visite par session.
const counter = (n) => ($('#counter').textContent = String(n).padStart(6, '0'));
try {
  if (!sessionStorage.getItem('lh-hit')) {
    api.hit().then((r) => {
      sessionStorage.setItem('lh-hit', '1');
      counter(r.hits);
    }).catch(() => {});
  } else api.stats().then((s) => counter(s.hits)).catch(() => {});
} catch {
  api.stats().then((s) => counter(s.hits)).catch(() => {});
}

// "Taux de charbon en fusion" (22/09, demande Naim) : ratio Like/Hate site entier, a cote de "Top rated".
// Appel separe de celui du compteur ci-dessus (qui suit deux chemins hit/stats different selon la session) :
// on veut toujours les vraies reactions, peu importe si /hit ou /stats a deja ete appele pour le compteur.
api
  .stats()
  .then((s) => {
    const { like = 0, dislike = 0 } = s.reactions || {};
    const total = like + dislike;
    $('#melt-rate-pct').textContent = total ? `${Math.round((like / total) * 100)}%` : '—';
  })
  .catch(() => {
    $('#melt-rate-pct').textContent = '—';
  });

function loadSources() {
  api
    .sources()
    .then((list) => {
      const on = list.filter((s) => s.enabled).map((s) => s.label);
      const off = list.filter((s) => !s.enabled).map((s) => s.label.split(' (')[0]);
      $('#sources').textContent = `${on.join(' · ')}${off.length ? ` — ${t('foot.awaiting')}${off.join(', ')}` : ''}`;
    })
    .catch(() => ($('#sources').textContent = t('foot.sourcesFallback')));
}
loadSources();
