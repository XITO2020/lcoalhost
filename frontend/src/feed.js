import { api } from './api.js';
import { isAdmin } from './admin.js';
import { memePng } from './memecard.js';
import { ago, contentLang, getLang, t } from './i18n.js';
import { isSoundOn, onSoundChange, setSound } from './sound.js';

const TOPIC_KEYS = ['', 'js', 'python', 'css', 'ia', 'cybersec', 'devops', 'survie', 'general'];
// LOL/JERRY retires de l'UI (demande Naim 22/09) : les valeurs restent valides cote backend/DB (pas de
// migration destructive pour un simple retrait d'affichage), juste plus proposees au clic.
const REACTION_KEYS = ['UTILE', 'ALERTE'];
const LIKE_KEYS = ['LIKE', 'DISLIKE'];

// Lien affiche seulement s'il est http(s) (audit 24/09) : un lien javascript: stocke volerait le token admin au clic.
const safeHref = (u) => (/^https?:\/\//i.test(String(u ?? '')) ? u : '#');
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function media(it) {
  if (it.kind === 'MEME') {
    if (it.mediaUrl) {
      return `<a class="media" href="${esc(safeHref(it.permalink))}" target="_blank" rel="noopener noreferrer"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(it.mediaUrl)}" alt="${esc(it.title)}"></a>`;
    }
    return `<div class="txtmeme"><p class="tm-top">${esc(it.title)}</p><p class="tm-bot">${esc(it.caption)}</p></div>`;
  }
  if (it.kind === 'VIDEO') {
    const img = it.thumbUrl ? `<img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(it.thumbUrl)}" alt="">` : '';
    return `<button class="media video-thumb" data-act="play" aria-label="${esc(t('card.playVideo'))}${esc(it.title)}">${img}<span class="play" aria-hidden="true"></span></button>`;
  }
  return it.thumbUrl
    ? `<a class="media cover" href="${esc(safeHref(it.permalink))}" target="_blank" rel="noopener noreferrer"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="${esc(it.thumbUrl)}" alt=""></a>`
    : '';
}

// Nombre compact (0, 21, 1 k, 3,4 k...) : Intl gere deja l'abreviation ET la locale (espace avant "k" en
// FR/ES, "K" colle en EN) — jamais reinventer un formateur a la main pour ca.
const formatCount = (n) => new Intl.NumberFormat(getLang(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);

// Like/dislike (22/09, demande Naim, sur memes/videos/articles) : PAS en superposition sur l'image, EN
// DESSOUS de l'image/du visuel, dans le flux normal de la carte, alignes a droite, empiles verticalement,
// aussi grands que possible. Compteur toujours visible (0 inclus, pas seulement si >0) A COTE de l'icone,
// pas en badge dans le coin. Meme mecanisme generique data-act="react" que les 4 reactions (deja gere par le
// handler de clic plus bas) — mutuellement exclusifs cote backend (items/routes.ts). Tooltip = attribut title.
function likeRow(it) {
  const buttons = LIKE_KEYS.map((type) => {
    const n = it.reactions[type] || 0;
    return `<button class="like-btn${it.mine.includes(type) ? ' on' : ''}" data-act="react" data-type="${type}" aria-pressed="${it.mine.includes(type)}" title="${esc(t(`rx.${type}`))}"><b>${formatCount(n)}</b><img src="/img/${type.toLowerCase()}.webp" alt="${esc(t(`rx.${type}`))}"></button>`;
  }).join('');
  return `<div class="like-row">${buttons}</div>`;
}

// Bouton "Comments on <site>" (Naim 23-24/09) : dans l'ESPACE VIDE de la carte, sous la ligne source · auteur · date,
// a gauche des cercles like/dislike (capture Naim) — sur TOUTES les cartes (memes, videos, articles). Mene a la page
// ou vivent les commentaires : le fil de discussion quand la source en fournit un (Lobsters, HN), sinon la page du
// meme/de l'article (post Lemmy...). Contenu maison (source = le site) : "Commentaires desactives", sans lien.
// Nom du site = domaine, ou nom lisible pour les sources connues. Remplace l'ancien bouton "Discussion ↗" (doublon).
const SITE_NAMES = { 'news.ycombinator.com': 'Hacker News', 'lobste.rs': 'Lobsters', 'dev.to': 'DEV' };
function commentsLink(it) {
  const url = it.discussionUrl || it.permalink;
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* pas d'URL exploitable : page du site ci-dessous */
  }
  const external = host && !/(^|\.)(lcoalhost\.lol|lcoal\.host)$/.test(host) && host !== 'localhost';
  // Source = le site lui-meme (contenu maison) : pas de systeme de commentaires pour l'instant -> mention inactive
  // "Commentaires desactives" (Naim 24/09), pas un lien.
  if (!external) return `<span class="btn ghost comments-btn is-off" aria-disabled="true">${esc(t('card.commentsOff'))}</span>`;
  const site = SITE_NAMES[host] ?? host;
  return `<a class="btn ghost comments-btn" href="${esc(safeHref(url))}" target="_blank" rel="noopener noreferrer">${esc(t('card.commentsOn'))} ${esc(site)} ↗</a>`;
}

function actions(it) {
  const rx = REACTION_KEYS.map(
    (type) =>
      `<button class="rx${it.mine.includes(type) ? ' on' : ''}" data-act="react" data-type="${type}" aria-pressed="${it.mine.includes(type)}">${esc(t(`rx.${type}`))}<b>${it.reactions[type] || ''}</b></button>`,
  ).join('');
  const dl = it.downloadable
    ? `<button class="btn" data-act="dl" title="${esc(t('card.titleFree'))}">${esc(t('card.download'))}</button>`
    : `<a class="btn ghost" href="${esc(safeHref(it.permalink))}" target="_blank" rel="noopener noreferrer" title="${esc(t(it.reusable ? 'card.titleFreeNoFile' : 'card.titleThirdParty'))}">${esc(t('card.source'))}</a>`;
  // Bouton admin (Naim 22/09) : jamais rendu pour un visiteur normal — isAdmin() ne passe a true qu'apres
  // validation reelle du token cote serveur (voir admin.js). Le bouton seul ne protege rien : la suppression
  // reelle est verifiee a nouveau cote backend (routes.ts admin), ceci n'est que l'affichage.
  const del = isAdmin() ? `<button class="btn ghost admin-del" data-act="admin-del" title="${esc(t('admin.delete'))}">✕</button>` : '';
  // Epingler (22/09, "big cleaning") : protege l'item de la purge automatique par quota disque (storage/budget.ts).
  // Meme garde-fou que admin-del : jamais rendu pour un visiteur normal, la protection reelle est cote backend.
  const pin = isAdmin()
    ? `<button class="btn${it.pinned ? ' on' : ''}" data-act="admin-pin" title="${esc(t(it.pinned ? 'admin.unpin' : 'admin.pin'))}" aria-pressed="${it.pinned}">📌</button>`
    : '';
  return `<div class="rxrow">${rx}</div><div class="btnrow"><button class="btn${it.shelved ? ' on' : ''}" data-act="shelf" aria-pressed="${it.shelved}">${esc(t(it.shelved ? 'card.filed' : 'card.file'))}</button>${dl}${pin}${del}</div>`;
}

function card(it) {
  const showTitle = !(it.kind === 'MEME' && !it.mediaUrl);
  const head =
    it.kind === 'ARTICLE'
      ? `<a class="title" href="${esc(safeHref(it.permalink))}" target="_blank" rel="noopener noreferrer">${esc(it.title)}</a>`
      : showTitle
        ? `<p class="title plain">${esc(it.title)}</p>`
        : '';
  const lic = it.license ? ` · <span title="Licence">${esc(it.license)}</span>` : '';
  const chip = it.topic && it.topic !== 'general' ? `<span class="chip-topic t-${esc(it.topic)}">${esc(t(`topic.${it.topic}`))}</span>` : '';
  // "Pub maison" (23/09, SPEC-ROADMAP.md Phase A/B) : etiquette TOUJOURS visible, jamais un item masque en
  // pub native trompeuse — transparence obligatoire.
  const sponsored = it.sponsored ? `<span class="chip-topic t-sponsored">${esc(t('card.sponsored'))}</span>` : '';
  // .lower cote a cote card-body/like-row (retour Naim : le like-row seul en pleine largeur sous l'image
  // laissait un enorme vide a gauche des icones — le texte remplit desormais cet espace au lieu de rien).
  return `<article class="card k-${it.kind.toLowerCase()}${it.sponsored ? ' sponsored' : ''}" data-id="${esc(it.id)}">${media(it)}<div class="lower"><div class="card-body">${sponsored}${chip}${head}<p class="meta">${esc(it.sourceLabel)}${it.author ? ` · ${esc(it.author)}` : ''} · ${ago(it.publishedAt)}${lic}</p>${commentsLink(it)}</div>${likeRow(it)}</div><div class="actions">${actions(it)}</div></article>`;
}

export function createFeed({ root, more, status, chipsEl, sortEl, onShelfCount }) {
  const st = { kind: 'MEME', topic: '', folder: '', sort: 'new', offset: 0, items: [], hasMore: false, loading: false, folders: [], token: 0 };
  const PAGE = 24;

  function renderChips() {
    if (st.kind === 'SHELF') {
      const all = [['', t('card.all')], ...st.folders.map((f) => [f.folder, `${f.folder} (${f.count})`])];
      chipsEl.innerHTML = all.map(([v, l]) => `<button class="chip${st.folder === v ? ' on' : ''}" data-folder="${esc(v)}">${esc(l)}</button>`).join('');
      sortEl.hidden = true;
    } else {
      chipsEl.innerHTML = TOPIC_KEYS.map((v) => `<button class="chip${st.topic === v ? ' on' : ''}" data-topic="${v}">${esc(t(`topic.${v}`))}</button>`).join('');
      sortEl.hidden = false;
      sortEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.sort === st.sort));
    }
  }

  function paint(append) {
    root.classList.toggle('list', st.kind === 'ARTICLE');
    const html = st.items.slice(append ? st.offset - PAGE : 0).map(card).join('');
    if (append) root.insertAdjacentHTML('beforeend', html);
    else root.innerHTML = html;
    more.hidden = !st.hasMore || st.kind === 'SHELF';
    status.textContent = st.items.length ? '' : t(`empty.${st.kind}`);
    status.hidden = st.items.length > 0;
  }

  async function load(reset) {
    const my = ++st.token;
    if (reset) {
      st.offset = 0;
      st.items = [];
      status.hidden = false;
      status.textContent = t('empty.loading');
      root.innerHTML = '';
    }
    st.loading = true;
    try {
      if (st.kind === 'SHELF') {
        const data = await api.shelfList(st.folder);
        if (my !== st.token) return;
        st.items = data.items;
        st.folders = data.folders;
        st.hasMore = false;
        onShelfCount?.(data.folders.reduce((n, f) => n + f.count, 0));
        renderChips();
        paint(false);
      } else {
        const data = await api.items({ kind: st.kind, topic: st.topic, sort: st.sort, lang: contentLang(), limit: PAGE, offset: st.offset });
        if (my !== st.token) return;
        st.items = st.items.concat(data.items);
        st.offset += PAGE;
        st.hasMore = data.hasMore;
        paint(!reset);
      }
    } catch (e) {
      if (my === st.token) {
        status.hidden = false;
        status.textContent = e.status === 429 ? t('empty.rateLimit') : t('empty.serverError');
      }
    } finally {
      if (my === st.token) st.loading = false;
    }
  }

  async function refreshFolders() {
    try {
      const data = await api.shelfList('');
      st.folders = data.folders;
      onShelfCount?.(data.folders.reduce((n, f) => n + f.count, 0));
    } catch {
      /* non bloquant */
    }
  }

  const find = (id) => st.items.find((i) => i.id === id);
  const cardEl = (id) => root.querySelector(`[data-id="${CSS.escape(id)}"]`);
  const refreshCard = (it) => {
    const i = st.items.findIndex((x) => x.id === it.id);
    if (i >= 0) st.items[i] = it;
    const el = cardEl(it.id);
    if (!el) return;
    el.querySelector('.actions').innerHTML = actions(it);
    // Bug reel trouve en testant le premier jet like/dislike (22/09) : refreshCard() ne patchait que .actions,
    // jamais .like-row (sorti de .actions) — la reaction etait bien enregistree cote backend mais le bouton
    // restait visuellement "off" jusqu'au prochain chargement complet. Toujours vrai apres le passage en
    // ligne (plus en overlay) : meme patch necessaire.
    const row = el.querySelector('.like-row');
    if (row) row.outerHTML = likeRow(it);
  };

  let pop = null;
  const closePop = () => {
    pop?.remove();
    pop = null;
  };
  function openShelfMenu(it, btn) {
    closePop();
    pop = document.createElement('div');
    pop.className = 'pop';
    const names = [...new Set([t('card.myBinder'), ...st.folders.map((f) => f.folder)])];
    pop.innerHTML = `<p class="pop-h">${esc(t('card.fileInto'))}</p>${names.map((n) => `<button data-f="${esc(n)}">${esc(n)}</button>`).join('')}<form><input maxlength="40" placeholder="${esc(t('card.newFolder'))}" aria-label="${esc(t('card.newFolder'))}"><button>${esc(t('card.ok'))}</button></form>`;
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect();
    pop.style.left = `${Math.min(window.innerWidth - 220, Math.max(8, r.left + window.scrollX))}px`;
    pop.style.top = `${r.bottom + window.scrollY + 6}px`;
    const choose = async (folder) => {
      closePop();
      try {
        refreshCard(await api.shelf(it.id, folder));
        refreshFolders();
      } catch {
        /* le prochain clic reessaiera */
      }
    };
    pop.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-f]');
      if (b) choose(b.dataset.f);
    });
    pop.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const v = pop.querySelector('input').value.trim();
      if (v) choose(v);
    });
    pop.querySelector('input').focus();
  }

  function play(it, btn) {
    const box = document.createElement('div');
    box.className = 'media player';
    if (it.embedUrl) {
      box.innerHTML = `<iframe src="${esc(it.embedUrl)}" title="${esc(it.title)}" allowfullscreen sandbox="allow-same-origin allow-scripts allow-popups" referrerpolicy="no-referrer"></iframe>`;
    } else {
      box.innerHTML = `<video controls autoplay playsinline preload="metadata" src="${esc(it.mediaUrl)}"></video>`;
      // Son global du site (Naim 23/09) : la video demarre selon le reglage, et si le visiteur change le son avec
      // les controles de la video, ca devient le reglage de tout le site (plus jamais a remettre video par video).
      const video = box.querySelector('video');
      video.muted = !isSoundOn();
      // Seulement si ca DIFFERE du son effectif : le muet pose par le site lui-meme declenche aussi volumechange, et
      // aurait efface la preference "son active" memorisee (sound.js, son souhaite vs autorise).
      video.addEventListener('volumechange', () => !video.muted !== isSoundOn() && setSound(!video.muted));
    }
    btn.replaceWith(box);
  }
  onSoundChange((on) => root.querySelectorAll('video').forEach((v) => (v.muted = !on)));

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const el = b.closest('.card');
    const it = find(el.dataset.id);
    if (!it) return;
    try {
      if (b.dataset.act === 'react') refreshCard(await api.react(it.id, b.dataset.type));
      else if (b.dataset.act === 'play') play(it, b);
      else if (b.dataset.act === 'shelf') {
        if (it.shelved) {
          refreshCard(await api.shelf(it.id));
          await refreshFolders();
          if (st.kind === 'SHELF') load(true);
        } else openShelfMenu(it, b);
      } else if (b.dataset.act === 'admin-del') {
        if (!confirm(t('admin.confirmDelete', { title: it.title.slice(0, 60) }))) return;
        await api.adminDeleteItem(it.id);
        st.items = st.items.filter((x) => x.id !== it.id);
        el.remove();
      } else if (b.dataset.act === 'admin-pin') {
        const { pinned } = await api.adminTogglePin(it.id);
        refreshCard({ ...it, pinned });
      } else if (b.dataset.act === 'dl') {
        const a = document.createElement('a');
        if (!it.mediaUrl) {
          a.href = URL.createObjectURL(await memePng(it));
          a.download = 'lcoalhost-meme.png';
          api.downloaded(it.id).catch(() => {});
        } else {
          a.href = `/api/items/${encodeURIComponent(it.id)}/download`;
          a.download = '';
        }
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      b.title = t(err.status === 429 ? 'card.easy' : 'card.failed');
    }
  });
  document.addEventListener('click', (e) => {
    if (pop && !pop.contains(e.target) && !e.target.closest('[data-act="shelf"]')) closePop();
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closePop());

  // Image cassee : on ne laisse jamais un trou, on renvoie vers la source.
  root.addEventListener(
    'error',
    (e) => {
      const img = e.target;
      if (img.tagName !== 'IMG') return;
      const it = find(img.closest('.card')?.dataset.id);
      const holder = img.closest('.media');
      if (holder && it) holder.outerHTML = `<div class="broken">${esc(t('card.imageUnavailable'))}<br><a href="${esc(safeHref(it.permalink))}" target="_blank" rel="noopener noreferrer">${esc(t('card.openSource'))}</a></div>`;
    },
    true,
  );

  chipsEl.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    if ('folder' in b.dataset) st.folder = b.dataset.folder;
    else st.topic = b.dataset.topic;
    renderChips();
    load(true);
  });
  sortEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sort]');
    if (!b) return;
    st.sort = b.dataset.sort;
    renderChips();
    load(true);
  });
  more.addEventListener('click', () => !st.loading && load(false));

  return {
    setKind(kind) {
      st.kind = kind;
      renderChips();
      load(true);
    },
    setTopic(topic) {
      st.topic = topic;
      renderChips();
      load(true);
    },
    refreshFolders,
    // Re-rend le feed courant SANS re-fetcher (utilise apres validation du mode admin, pour faire apparaitre
    // les boutons supprimer sans relancer une requete reseau).
    repaint() {
      if (st.kind !== 'SHELF') paint(false);
    },
    get kind() {
      return st.kind;
    },
  };
}
