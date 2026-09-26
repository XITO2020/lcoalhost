// Veille TikTok + Instagram — aside droite (desktop) / bloc pleine largeur (mobile). Demande Naim 22/09.
// Lit UNIQUEMENT /api/tiktok (clips ajoutes a la main cote serveur via `npm run tiktok:add` une URL a la fois,
// ou `npm run watch:import` en lot depuis une veille manuelle — jamais d'automatisation connectee a un compte).
import { api } from './api.js';
import { getLang, t } from './i18n.js';
import { bindSoundButton, isSoundOn, onSoundChange, setSound } from './sound.js';
import { ALWAYS_INIT_VIDEOS, BACKUP_VIDEOS, BACKUP_VIDEOS_BY_LANG } from './videos-backup.generated.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const PLATFORM_LABEL = { TIKTOK: 'TT', INSTAGRAM: 'IG' };

// Categories atelier Conspix (23/09, demande Naim) : dossiers de
// C:\Users\naimd\Videos\conspix-memeral-reserv-videos\0-atelier (destines a devenir des shorts Veille) +
// sous-dossiers de "coding". Labels = noms de dossiers EXACTS, jamais traduits (comme les noms d'outils du
// Labo Pentest) — ce sont des categories de travail de Naim, pas du texte d'interface. Slugs cote backend
// dans tiktok/topics.ts (TIKTOK_TOPICS), 3 reutilises tels quels (api/css/linux).
const ATELIER_CATEGORIES = [
  ['artistic-ai-apps', 'artistic-ai&apps'],
  ['blender3d-unreal5', 'blender3d-unreal5'],
  ['body-training', 'body-training'],
  ['books', 'books'],
  ['bricolage', 'bricolage'],
  ['bricolage-hardware', 'bricolage-hardware'],
  ['business-do-it-sure', 'business-do-it-sure'],
  ['cloud-data-astuces', 'cloud-data-astuces'],
  ['coding', 'coding'],
  ['combo-crea', 'combo-crea'],
  ['combo-net-use', 'combo-net-use'],
  ['combo-seo-ia', 'combo-seo-ia'],
  ['cool-apps', 'cool apps'],
  ['crypto-sbt-bots', 'crypto-sbt&bots'],
  ['deep-learning-new-ia', 'deep-learning-new-ia'],
  ['dropshipping', 'dropshipping'],
  ['economy', 'economy'],
  ['funny', 'funny'],
  ['gpt-since-1stmayo23', 'Gpt-since-1stmayo23'],
  ['langues', 'langues'],
  ['linux', 'linux'],
  ['motivation', 'motivation'],
  ['nocode', 'nocode'],
  ['seo', 'seo'],
  ['sketching', 'sketching'],
  ['socials-planification-automaization', 'socials-planification-automaization'],
  ['terminal-cmd-tools', 'terminal-cmd-tools'],
  ['tktk', 'tktk'],
  ['toshop-remover-nft-ia', 'toshop-remover-nft-ia'],
  ['unclassified-ai-tips', 'unclassified-ai-tips'],
  ['video-edit', 'video-edit'],
  ['web3-ressources-navigation', 'web3+ressources+navigation'],
  ['website-ai-aout2023', 'website_ai_aout2023'],
  // sous-dossiers de "coding" (capture 1)
  ['api', 'api'],
  ['apps-flutter', 'apps-flutter'],
  ['c', 'C'],
  ['coding-ia', 'coding ia'],
  ['combo-astuces', 'combo-astuces'],
  ['combo-coding', 'combo-coding'],
  ['css', 'css'],
  ['debug', 'debug'],
  ['docker-kubernetes-git', 'docker-kubernetes-git'],
  ['flipper', 'flipper'],
  ['java', 'java'],
  ['js', 'js'],
  ['node', 'node'],
  ['php-symf-sql', 'php-symf-sql'],
  ['py', 'py'],
  ['react-vue-vite', 'react-vue-vite'],
  ['solidity-cryptocrea', 'solidity&cryptocrea'],
];

// Les widgets officiels (TikTok/Instagram) ne scannent le DOM qu'a LEUR execution (pas en continu) : constate
// le 22/09/2026, un script deja charge avant l'ajout du blockquote ne le convertit jamais en iframe/embed. Pas
// d'API globale fiable exposee : la seule methode qui marche est de retirer les anciens <script> et d'en
// reinjecter des neufs a chaque rendu, pour forcer un nouveau scan des deux plateformes.
function ensureEmbedScripts() {
  document.querySelectorAll('script[src*="tiktok.com/embed.js"], script[src*="instagram.com/embed.js"]').forEach((s) => s.remove());
  for (const src of ['https://www.tiktok.com/embed.js', '//www.instagram.com/embed.js']) {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }
}

// --- Lecteur TikTok officiel pilotable (23/09, demande Naim : son global + defilement "swipe") -------------
// tiktok.com/player/v1/{videoId} (doc developers.tiktok.com/doc/embed-player, lue le 23/09) : parametre `muted`,
// commandes postMessage play/pause/mute/unMute, evenements onPlayerReady/onMute/onPlayerError. Remplace, pour
// TikTok, l'embed oEmbed (blockquote + embed.js) qui ne se pilote pas et demandait de remettre le son a chaque
// video. Instagram garde son embed oEmbed (aucune API de son equivalente).
const TT_ORIGIN = 'https://www.tiktok.com';
const players = new Map(); // iframe -> { ready, queue: [], lastCmd, onEnded }

// loop=0 (23/09, Naim : "les lectures sont auto une fois declenchees") : la fin d'un TikTok (etat 0) enchaine sur la
// video suivante du lecteur, comme les videos locales.
// JAMAIS `muted=1` dans l'URL — bug reel du 24/09 (doc officielle relue) : muted=1 "met le volume a 0 ET EMPECHE
// l'utilisateur de le changer". Il etait pose pour tout visiteur avant son 1er clic -> son impossible a remettre,
// quoi qu'on fasse. Le son se pilote UNIQUEMENT par commandes mute/unMute (onPlayerReady / markReady ci-dessous).
function playerUrl(videoId) {
  const q = new URLSearchParams({ autoplay: '0', loop: '0', rel: '0' });
  return `${TT_ORIGIN}/player/v1/${encodeURIComponent(videoId)}?${q}`;
}

// Cible '*' comme dans la doc officielle (commandes sans donnee sensible) : cibler l'origine exacte faisait perdre
// SILENCIEUSEMENT toutes les commandes si le lecteur repond depuis un autre sous-domaine TikTok.
function send(iframe, type) {
  const p = players.get(iframe);
  if (!p) return;
  if (type === 'mute' || type === 'unMute') p.lastCmd = Date.now();
  if (!p.ready) return void p.queue.push(type);
  iframe.contentWindow?.postMessage({ 'x-tiktok-player': true, type, value: undefined }, '*');
}

const soundCmd = () => (isSoundOn() ? 'unMute' : 'mute');

// Lecteur pret : applique le son du site puis vide la file d'attente. Bug reel du 24/09 : onPlayerReady n'arrive pas
// toujours jusqu'au site -> les commandes restaient en file POUR TOUJOURS (lecture seulement par le bouton play de
// TikTok, son jamais transmis). Pret = onPlayerReady OU n'importe quel message du lecteur OU iframe chargee (+ delai).
function markReady(iframe) {
  const p = players.get(iframe);
  if (!p || p.ready) return;
  p.ready = true;
  send(iframe, soundCmd());
  p.queue.splice(0).forEach((type) => send(iframe, type));
}

window.addEventListener('message', (e) => {
  if (!e.data?.['x-tiktok-player']) return;
  let host = '';
  try {
    host = new URL(e.origin).hostname;
  } catch {
    return;
  }
  if (!/(^|\.)tiktok\.com$/.test(host)) return;
  // Securite reelle : le message doit venir d'UN DE NOS lecteurs (fenetre de l'iframe), pas seulement d'un domaine.
  const iframe = [...players.keys()].find((f) => f.contentWindow === e.source);
  if (!iframe) return;
  const p = players.get(iframe);
  markReady(iframe);
  // Le VRAI "pret" peut arriver bien apres le repli de markReady (12 s mesurees le 24/09) : un "play" envoye avant
  // est perdu -> on reapplique le son et on relance la lecture si ce clip est celui affiche (sync du lecteur).
  if (e.data.type === 'onPlayerReady') {
    send(iframe, soundCmd());
    p.sync?.();
  }
  // Fin de video -> suivante (24/09, retour Naim "les videos en URL ne s'enchainent toujours pas") : l'etat 0 (fini)
  // n'est pas toujours envoye par le lecteur sans boucle (il peut s'arreter en PAUSE sur la derniere image). Fin =
  // etat 0, OU position a moins d'1/2 s de la fin (onCurrentTime), OU pause en toute fin. Une seule fois par lecture
  // (p.endFired, rearme des que la video repart du debut).
  const fireEnd = () => {
    if (p.endFired) return;
    p.endFired = true;
    p.onEnded?.();
  };
  const nearEnd = () => p.duration > 1 && p.time >= p.duration - 0.5;
  if (e.data.type === 'onStateChange') {
    p.state = e.data.value; // 0 = fini, 1 = lecture, 2 = pause (sert au clic lecture/pause du calque .tt-swipe)
    if (p.state === 0 || (p.state === 2 && nearEnd())) fireEnd();
  } else if (e.data.type === 'onCurrentTime') {
    p.time = Number(e.data.value?.currentTime) || 0;
    p.duration = Number(e.data.value?.duration) || 0;
    if (p.time < p.duration - 1) p.endFired = false;
    else if (nearEnd()) fireEnd();
  } else if (e.data.type === 'onMute') {
    // Le visiteur a utilise le bouton volume de TikTok lui-meme -> ca devient le reglage de tout le site. Ignore
    // juste apres NOTRE commande (1 s) : un navigateur qui force la coupure (lecture auto sans interaction)
    // renvoie aussi onMute, et ce n'est pas un choix du visiteur.
    if (Date.now() - (p.lastCmd || 0) > 1000) setSound(!e.data.value);
  } else if (e.data.type === 'onImageChange') {
    p.isImage = true; // carrousel photo : jamais de lecture video (sert a le sauter dans l'enchainement auto)
  } else if (e.data.type === 'onPlayerError' && e.data.value?.errorCode === 3002) {
    // Lecture auto AVEC son bloquee par le navigateur : on lit en silencieux ; le son sera remis au prochain geste.
    send(iframe, 'mute');
    send(iframe, 'play');
  } else if (e.data.type === 'onPlayerError') {
    p.error = true; // 1001 media invalide, 2001 serveur TikTok, 3001 lecture impossible
  }
});

onSoundChange(() => {
  players.forEach((_, iframe) => send(iframe, soundCmd()));
  document.querySelectorAll('.tt-video').forEach((v) => (v.muted = !isSoundOn()));
});

// Videos de secours (Naim 23/09) : quand la source n'a rien a montrer, lecture des fichiers de public/videos/
// (liste generee, cf. scripts/gen-backup-videos.js) dans un ordre ALEATOIRE, retire a chaque chargement.
function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// preload="none" : rien n'est telecharge avant lecture (certains fichiers pesent lourd). Chemin encode segment par
// segment (always_init/xxx.mp4 : le "/" doit rester un "/"). Le 1er geste du visiteur est gere par sound.js
// (le son souhaite devient autorise -> onSoundChange ci-dessus le transmet a tous les lecteurs).
const backupClipHtml = (file) =>
  `<div class="tt-clip tt-clip-local"><video class="tt-video" src="/videos/${file.split('/').map(encodeURIComponent).join('/')}" playsinline preload="none"${isSoundOn() ? '' : ' muted'}></video></div>`;
// Videos d'ouverture (always_init/, Naim 23/09) : TOUJOURS en tete du lecteur, quelle que soit la source ensuite.
const initClipsHtml = () => ALWAYS_INIT_VIDEOS.map(backupClipHtml).join('');

// Le titre "VEILLE"/"WATCH" vit desormais dans .watch-head (index.html, statique) : cette fonction ne rend
// plus que le contenu de la colonne (liste de clips / etats vides), pas d'en-tete duplique.
export function createTiktokRail(root) {
  const st = { topic: '' };
  let observers = [];

  // Accordeon discret de categories (23/09, demande Naim) : rendu UNE FOIS, en dehors du conteneur que load()
  // remplace a chaque appel (root.innerHTML plus bas) — sinon il disparaitrait a chaque rechargement/filtre.
  // Idem pour le bouton son : dans .tt-frame mais HORS de .tt-content (reecrit a chaque load()).
  root.innerHTML = `
    <div class="tt-frame">
      <div class="tt-content"></div>
      <button type="button" class="tt-sound"></button>
    </div>
    <div class="tt-cats">
      <button type="button" class="tt-cats-toggle" aria-expanded="false">
        <span>${esc(t('tiktok.categories'))}</span><span class="tt-cats-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="chips tt-cats-list" hidden>
        <button type="button" class="chip on" data-topic="">${esc(t('topic.'))}</button>
        ${ATELIER_CATEGORIES.map(([slug, label]) => `<button type="button" class="chip" data-topic="${esc(slug)}">${esc(label)}</button>`).join('')}
      </div>
    </div>`;

  const content = root.querySelector('.tt-content');
  bindSoundButton(root.querySelector('.tt-sound'));

  // "Swipe" a la molette au survol du lecteur (Naim 23/09) : UN geste = UN clip. Un trackpad envoie des dizaines
  // d'evenements par geste -> verrou relache seulement apres 250 ms sans molette. Au premier/dernier clip, on ne
  // bloque pas : la molette fait alors defiler la page normalement.
  let wheelLocked = false;
  let wheelIdle = null;
  content.addEventListener(
    'wheel',
    (e) => {
      const count = content.querySelectorAll('.tt-clip').length;
      if (!count || Math.abs(e.deltaY) < 4) return;
      const h = content.clientHeight;
      const current = Math.round(content.scrollTop / h);
      const target = current + Math.sign(e.deltaY);
      if (!wheelLocked && (target < 0 || target >= count)) return;
      e.preventDefault();
      clearTimeout(wheelIdle);
      wheelIdle = setTimeout(() => (wheelLocked = false), 250);
      if (wheelLocked) return;
      wheelLocked = true;
      content.scrollTo({ top: target * h, behavior: 'smooth' });
    },
    { passive: false },
  );
  // Calque .tt-swipe TRAVERSABLE a l'arret (24/09, Naim : "le bouton play central est encore empeche par un layer
  // invisible") : le calque capte la molette (swipe), mais il masquait aussi les boutons du lecteur TikTok — dont la
  // position varie (play mesure a ~76 % de la largeur sur mobile : le trou central fixe ratait). Souris IMMOBILE
  // 400 ms sur une video TikTok = le visiteur vise un bouton -> calque desactive (.pass), son clic arrive AU lecteur
  // TikTok (vrai geste : Firefox l'accepte). Molette ou souris qui repart -> annule ; sortie du cadre -> calque
  // reactive. Tactile : inchange (glisser = defiler, tap = lecture/pause via le calque).
  let passTimer = null;
  content.addEventListener('mousemove', (e) => {
    const sw = e.target.closest?.('.tt-swipe');
    clearTimeout(passTimer);
    if (sw) passTimer = setTimeout(() => sw.classList.add('pass'), 400);
  });
  content.addEventListener('wheel', () => clearTimeout(passTimer), { passive: true });
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest?.('.tt-frame')) return;
    clearTimeout(passTimer);
    content.querySelectorAll('.tt-swipe.pass').forEach((s) => s.classList.remove('pass'));
  });
  // Clic sur la video = lecture/pause (comme sur TikTok).
  content.addEventListener('click', (e) => {
    const local = e.target.closest('.tt-video');
    if (local) return void (local.paused ? playLocal(local) : local.pause());
    const iframe = e.target.closest('.tt-swipe')?.parentElement.querySelector('.tt-player');
    if (!iframe) return;
    clearTimeout(retryTimer); // pause voulue par le visiteur : la relance automatique ne doit pas la contrer
    send(iframe, players.get(iframe)?.state === 1 ? 'pause' : 'play');
  });
  const catsToggle = root.querySelector('.tt-cats-toggle');
  const catsList = root.querySelector('.tt-cats-list');
  catsToggle.addEventListener('click', () => {
    const open = catsList.hidden;
    catsList.hidden = !open;
    catsToggle.setAttribute('aria-expanded', String(open));
  });
  catsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    st.topic = btn.dataset.topic;
    catsList.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === btn));
    load();
  });

  // Lecture : seul le clip AFFICHE dans le cadre joue, et seulement si le cadre est lui-meme a l'ecran (sinon du
  // son continuerait pendant qu'on lit le feed ailleurs). Les autres sont en pause.
  let active = null;
  let frameVisible = false;
  // Relance de securite (24/09, retour Naim "il faut appuyer sur play en bas a gauche") : si le TikTok affiche ne joue
  // toujours pas 1,5 s apres la commande (etat != 1), on renvoie "play" — jusqu'a 4 fois, tant qu'il reste affiche.
  // Toujours pas de lecture apres les 4 relances ET clip reellement illisible (carrousel photo = onImageChange, ou
  // onPlayerError hors 3002) : on passe au suivant. Un clip simplement bloque par le navigateur (lecture refusee sans
  // clic) n'est JAMAIS saute — sinon, si le navigateur refuse toute lecture, tous les TikTok defileraient a la suite.
  let retryTimer = null;
  function ensureTiktokPlays(iframe, tries = 0) {
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      const p = players.get(iframe);
      const clip = iframe.closest('.tt-clip');
      if (!p || !frameVisible || clip !== active || p.state === 1) return;
      if (tries >= 4) {
        if (p.isImage || p.error) advanceFrom(clip);
        return;
      }
      send(iframe, 'play');
      ensureTiktokPlays(iframe, tries + 1);
    }, 1500);
  }
  const syncPlayback = () => {
    players.forEach((_, iframe) => {
      const on = frameVisible && iframe.closest('.tt-clip') === active;
      send(iframe, on ? 'play' : 'pause');
      if (on) ensureTiktokPlays(iframe);
    });
    content.querySelectorAll('.tt-video').forEach((v) => {
      if (frameVisible && v.closest('.tt-clip') === active) playLocal(v);
      else v.pause();
    });
  };
  // Lecture auto AVEC son refusee par le navigateur (avant tout geste) : on relance en silencieux, comme pour TikTok.
  function playLocal(v) {
    v.muted = !isSoundOn();
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }

  function watch() {
    observers.forEach((o) => o.disconnect());
    players.forEach((_, iframe) => !iframe.isConnected && players.delete(iframe));
    const clipObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) active = e.target;
        mountAround(); // lecteurs TikTok du clip affiche et de ses voisins seulement
        syncPlayback();
      },
      { root: content, threshold: 0.6 },
    );
    content.querySelectorAll('.tt-clip').forEach((c) => clipObs.observe(c));
    const frameObs = new IntersectionObserver(
      ([e]) => {
        frameVisible = e.isIntersecting;
        syncPlayback();
      },
      { threshold: 0.5 },
    );
    frameObs.observe(content);
    observers = [clipObs, frameObs];
  }

  function clipHtml(c) {
    const badge = `<span class="tt-platform mono">${esc(PLATFORM_LABEL[c.platform] ?? c.platform)}</span>`;
    if (c.platform === 'TIKTOK' && c.videoId) {
      // .tt-swipe : calque transparent AU-DESSUS de la video (sauf la barre de controles du bas). Bug reel constate
      // le 23/09 : l'iframe TikTok avale la molette, le geste ne remonte jamais au cadre -> impossible de "swiper"
      // en survolant la video. Le calque capte molette (clip suivant/precedent) et clic (lecture/pause).
      // Cadre SANS lecteur : l'iframe TikTok n'est creee que pour le clip affiche et ses voisins (mountAround).
      return `<div class="tt-clip" data-topic="${esc(c.topic)}" data-tt-id="${esc(c.videoId)}" data-tt-title="${esc(`TikTok ${c.authorHandle ? '@' + c.authorHandle : ''}`)}">${badge}<div class="tt-swipe" aria-hidden="true"></div></div>`;
    }
    return `<div class="tt-clip tt-clip-oembed" data-topic="${esc(c.topic)}">${badge}${c.embedHtml}</div>`;
  }

  // Son active (bouton du hero, bouton du cadre, 1er clic sur la page) : on relance la lecture DANS ce geste — le
  // navigateur accepte alors le son pour la video affichee, locale ou TikTok. Un clic = son pour tout le lecteur.
  onSoundChange(() => syncPlayback());
  // Bouton son du hero (Naim 23/09 : "appuyer sur le bouton du son lance aussi la lecture du video player") : on lance
  // la video affichee DANS le clic (sinon le navigateur refuserait le son), meme si le lecteur n'est pas encore a
  // l'ecran, puis on le fait apparaitre (defilement minimal, rien si deja visible). Une fois visible, les regles
  // habituelles reprennent (pause si on le quitte, reprise si on y revient).
  window.addEventListener('lh:play-request', () => {
    if (!active) return;
    const v = active.querySelector('.tt-video');
    if (v) playLocal(v);
    else send(active.querySelector('.tt-player'), 'play');
    content.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  // Enchainement automatique commun a TOUTES les sources (Naim 23/09 : "les lectures sont auto une fois
  // declenchees") : fin d'une video (locale ou TikTok) -> la suivante du lecteur, retour a la 1re apres la derniere.
  function advanceFrom(clip) {
    const clips = [...content.querySelectorAll('.tt-clip')];
    if (clips.length === 1) {
      const v = clip.querySelector('.tt-video');
      if (v) playLocal(v); // une seule video : on la relance
      else send(clip.querySelector('.tt-player'), 'play');
      return;
    }
    const i = (clips.indexOf(clip) + 1) % clips.length;
    content.scrollTo({ top: i * content.clientHeight, behavior: 'smooth' }); // l'observateur lance la suivante
  }

  // Liste affichee : videos d'ouverture (always_init/) en tete — seulement sans filtre de categorie (c'est
  // l'ouverture du site, pas une categorie) — puis la source.
  // LECTEURS TIKTOK A LA DEMANDE (24/09, capture Naim "Access Denied" Akamai sur tiktok.com/player/v1) : charger une
  // iframe par clip (17+ requetes simultanees a chaque chargement, repetees a chaque rechargement) declenchait le
  // pare-feu anti-robots de TikTok, qui bloquait l'IP. Seuls le clip AFFICHE et ses 2 voisins ont un lecteur ; au-dela
  // de 2 clips de distance il est retire (memoire + requetes). Egalement plus respectueux de la vie privee : TikTok
  // ne recoit une requete que pour les clips qu'on s'apprete a voir.
  function mountPlayer(clip) {
    const f = document.createElement('iframe');
    f.className = 'tt-player';
    f.src = playerUrl(clip.dataset.ttId);
    f.title = clip.dataset.ttTitle ?? 'TikTok';
    f.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
    clip.insertBefore(f, clip.querySelector('.tt-swipe'));
    players.set(f, { ready: false, queue: [], lastCmd: 0, onEnded: () => advanceFrom(clip), sync: () => syncPlayback() });
    f.addEventListener('load', () => setTimeout(() => markReady(f), 800)); // repli si onPlayerReady ne vient pas
  }
  function mountAround() {
    const clips = [...content.querySelectorAll('.tt-clip')];
    const at = Math.max(0, clips.indexOf(active));
    clips.forEach((clip, i) => {
      if (!clip.dataset.ttId) return;
      const player = clip.querySelector('.tt-player');
      const dist = Math.abs(i - at);
      if (dist <= 1 && !player) mountPlayer(clip);
      else if (dist > 2 && player) {
        players.delete(player);
        player.remove();
      }
    });
  }

  function render(listHtml) {
    content.innerHTML = `<div class="tt-list">${st.topic ? '' : initClipsHtml()}${listHtml}</div>`;
    active = content.querySelector('.tt-clip');
    mountAround();
    // Pas de controles natifs : le son se regle par les boutons son (reglage global du site).
    content.querySelectorAll('.tt-video').forEach((v) => v.addEventListener('ended', () => advanceFrom(v.closest('.tt-clip'))));
    if (content.querySelector('.tt-clip-oembed')) ensureEmbedScripts();
    watch();
  }

  // Videos locales de la LANGUE affichee (videos/<langue>/, Naim 24/09) + celles communes a la racine de videos/.
  const localVideos = () => [...(BACKUP_VIDEOS_BY_LANG[getLang()] ?? []), ...BACKUP_VIDEOS];

  // Secours : ordre aleatoire (apres les videos d'ouverture).
  function showBackup() {
    const locals = localVideos();
    if (!locals.length && !ALWAYS_INIT_VIDEOS.length) return false;
    render(shuffled(locals).map(backupClipHtml).join(''));
    return true;
  }
  // Naim 23/09 : les videos de public/videos/ "pop up" une par une toutes les 10 videos de la source (videos.json
  // aujourd'hui, feed Conspix quand le pont existera) : apres chaque 10e clip, la video locale suivante d'une
  // liste melangee (on reboucle si la source a plus de clips que de videos locales).
  const EVERY = 10;
  function withLocalPopups(clips) {
    const locals = shuffled(localVideos());
    const out = [];
    clips.forEach((c, i) => {
      out.push(clipHtml(c));
      if (locals.length && (i + 1) % EVERY === 0) out.push(backupClipHtml(locals[((i + 1) / EVERY - 1) % locals.length]));
    });
    return out.join('');
  }

  // SOURCE PAR LANGUE (Naim 24/09) : videos/<langue>/videos.json ({ "videoN": "url TikTok" }), lu DIRECTEMENT — Naim
  // modifie le fichier, c'est pris en compte au chargement suivant, sans import en base. Seul l'identifiant de la
  // video sert au lecteur officiel. Carrousels photo (/photo/<id>) ignores : pas de lecture video, ils cassaient
  // l'enchainement. Doublons conserves tels quels (c'est le fichier de Naim).
  async function langClips() {
    const res = await fetch(`/videos/${getLang()}/videos.json`, { cache: 'no-cache' });
    if (!res.ok) return [];
    const json = await res.json();
    return Object.values(json)
      .map((u) => String(u).trim())
      .map((u) => ({ id: /\/video\/(\d+)/.exec(u)?.[1], handle: /@([\w.-]+)/.exec(u)?.[1] }))
      .filter((c) => c.id)
      .map((c) => ({ platform: 'TIKTOK', videoId: c.id, authorHandle: c.handle ?? null, topic: '' }));
  }

  async function load() {
    content.innerHTML = `<p class="status">${esc(t('tiktok.loading'))}</p>`;
    // Sans filtre de categorie : le videos.json de la langue d'abord ; illisible ou vide -> base (/api/tiktok), puis
    // videos locales (secours). Avec une categorie : la base, seule a connaitre les categories des clips.
    if (!st.topic) {
      const clips = await langClips().catch(() => []);
      if (clips.length) return void render(withLocalPopups(clips));
    }
    try {
      const data = await api.tiktok(st.topic);
      if (!data.clips.length) {
        // Aucun clip (videos.json vide / non importe) : videos de secours — seulement sans filtre de categorie
        // (une categorie vide ne doit pas afficher des videos sans rapport avec elle).
        if (!st.topic && showBackup()) return;
        content.innerHTML = `<p class="tt-empty">${esc(t('tiktok.empty'))}</p>`;
        return;
      }
      render(withLocalPopups(data.clips));
    } catch {
      // API/base indisponible : videos de secours, quel que soit le filtre (plus aucune source ne repond).
      if (showBackup()) return;
      content.innerHTML = `<p class="status">${esc(t('tiktok.unavailable'))}</p>`;
    }
  }

  load();
  return { reload: load };
}
