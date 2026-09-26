// Poster (23/09, SPEC-ROADMAP.md Phase A) : publication directe par l'admin — meme, video ou article, en
// PUBLISHED immediat (c'est Naim qui ecrit, pas un tiers a moderer, contrairement a Add Coal/Liquid qui
// restent PENDING_REVIEW). Onglet visible SEULEMENT en mode admin (cf. main.js), jamais accessible a un
// visiteur normal — la route backend (/admin/items) est de toute facon protegee par x-admin-token cote serveur,
// ceci n'est que l'affichage.
import { api } from './api.js';
import { getLang, t } from './i18n.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const KINDS = ['MEME', 'VIDEO', 'ARTICLE'];
const TOPICS = ['general', 'js', 'python', 'css', 'ia', 'cybersec', 'devops', 'survie'];
const LANGS = ['en', 'fr', 'es'];

function shell() {
  // Langue pre-selectionnee = langue courante de l'UI (juste un point de depart pratique, jamais un defaut
  // SILENCIEUX cote serveur : le champ reste un choix explicite affiche, et le backend l'exige de toute
  // facon dans le payload — cf. spec "select obligatoire, pas de defaut implicite").
  const curLang = getLang();
  return `
    <p class="hintro">${esc(t('post.intro'))}</p>
    <form class="coal-form post-form" novalidate>
      <div class="post-row">
        <span class="post-label">${esc(t('post.kindLabel'))}</span>
        <div class="post-chips" role="radiogroup" data-group="kind">
          ${KINDS.map((k, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-kind="${k}">${esc(t(`tab.${k}`))}</button>`).join('')}
        </div>
      </div>
      <div class="post-row">
        <span class="post-label">${esc(t('post.langLabel'))}</span>
        <div class="post-chips" role="radiogroup" data-group="lang">
          ${LANGS.map((l) => `<button type="button" class="chip${l === curLang ? ' on' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}
        </div>
      </div>
      <div class="post-row">
        <span class="post-label">${esc(t('post.topicLabel'))}</span>
        <div class="post-chips" role="radiogroup" data-group="topic">
          ${TOPICS.map((tp, i) => `<button type="button" class="chip${i === 0 ? ' on' : ''}" data-topic="${tp}">${esc(t(`topic.${tp}`))}</button>`).join('')}
        </div>
      </div>
      <label class="coal-field">
        <span>${esc(t('post.titleLabel'))}</span>
        <input type="text" name="title" maxlength="300" required>
      </label>
      <label class="coal-field">
        <span>${esc(t('post.captionLabel'))}</span>
        <textarea name="caption" maxlength="500" placeholder="${esc(t('post.captionPlaceholder'))}"></textarea>
      </label>
      <label class="coal-field">
        <span>${esc(t('post.mediaUrlLabel'))}</span>
        <input type="url" name="mediaUrl" maxlength="1000" placeholder="https://…">
      </label>
      <label class="coal-field">
        <span>${esc(t('post.embedUrlLabel'))}</span>
        <input type="url" name="embedUrl" maxlength="1000" placeholder="https://…">
      </label>
      <label class="coal-field">
        <span>${esc(t('post.thumbUrlLabel'))}</span>
        <input type="url" name="thumbUrl" maxlength="1000" placeholder="https://…">
      </label>
      <label class="post-sponsored">
        <input type="checkbox" name="sponsored">
        <span>${esc(t('post.sponsoredLabel'))}</span>
      </label>
      <button class="btn" type="submit">${esc(t('post.submit'))}</button>
      <p class="status post-msg" role="status"></p>
    </form>`;
}

export function createPost(root) {
  function load() {
    root.innerHTML = shell();
    const form = root.querySelector('.post-form');
    const msg = form.querySelector('.post-msg');
    let kind = KINDS[0];
    let lang = getLang();
    let topic = TOPICS[0];

    // Bug reel trouve en testant la Phase A (23/09) : un MEME publie en lang="es" ne peut apparaitre dans
    // AUCUN feed — le filtre MEME est strict par lang (items/routes.ts), et contentLang() (i18n.js) ne demande
    // jamais lang=es (l'UI espagnole retombe sur les memes EN faute de contenu maison, "ES = UI uniquement
    // pour l'instant"). Publier un meme en ES creerait donc un item orphelin, invisible pour toujours. VIDEO/
    // ARTICLE ne sont pas concernes (montres quelle que soit la langue). Corrige : le chip ES se desactive
    // pour MEME, et si on etait deja sur ES en changeant de type, on retombe sur EN plutot que de laisser un
    // choix invalide selectionne silencieusement.
    const esChip = form.querySelector('[data-group="lang"] [data-lang="es"]');
    function syncEsForMeme() {
      const disable = kind === 'MEME';
      esChip.disabled = disable;
      esChip.title = disable ? t('post.esDisabledForMeme') : '';
      if (disable && lang === 'es') {
        lang = 'en';
        form.querySelector('[data-group="lang"] [data-lang="en"]').classList.add('on');
        esChip.classList.remove('on');
      }
    }
    syncEsForMeme();

    form.querySelectorAll('.post-chips').forEach((group) => {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip');
        if (!btn || btn.disabled) return;
        group.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === btn));
        if (btn.dataset.kind) kind = btn.dataset.kind;
        if (btn.dataset.lang) lang = btn.dataset.lang;
        if (btn.dataset.topic) topic = btn.dataset.topic;
        if (btn.dataset.kind) syncEsForMeme();
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = form.querySelector('input[name="title"]').value.trim();
      const caption = form.querySelector('textarea[name="caption"]').value.trim();
      const mediaUrl = form.querySelector('input[name="mediaUrl"]').value.trim();
      const embedUrl = form.querySelector('input[name="embedUrl"]').value.trim();
      const thumbUrl = form.querySelector('input[name="thumbUrl"]').value.trim();
      const sponsored = form.querySelector('input[name="sponsored"]').checked;

      if (!title) return void (msg.textContent = t('post.errorTitleRequired'));

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      msg.textContent = t('post.submitting');
      try {
        await api.adminCreateItem({
          kind,
          lang,
          topic,
          title,
          caption: caption || undefined,
          mediaUrl: mediaUrl || undefined,
          embedUrl: embedUrl || undefined,
          thumbUrl: thumbUrl || undefined,
          sponsored,
        });
        msg.textContent = t('post.success');
        form.reset();
        kind = KINDS[0];
        lang = getLang();
        topic = TOPICS[0];
        form.querySelector('[data-group="kind"]').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.kind === kind));
        form.querySelector('[data-group="lang"]').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.lang === lang));
        form.querySelector('[data-group="topic"]').querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.topic === topic));
        syncEsForMeme();
      } catch {
        msg.textContent = t('post.errorGeneric');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  load();
  return { reload: load };
}
