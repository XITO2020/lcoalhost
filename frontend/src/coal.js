// Add Coal — soumission visiteur (demande Naim 22/09) : 1 par jour. Depuis le 23/09 : un LIEN quelconque (article,
// video ou meme) — Qwen verifie la pertinence et le range lui-meme (section + categorie + langue) — ou une image.
// Relecture Naim ensuite (coal:review/approve/reject), sauf si COAL_AUTO_PUBLISH est active cote serveur.
import { api } from './api.js';
import { t } from './i18n.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function shell(quota) {
  const remaining = quota ? quota.remaining : null;
  return `
    <p class="hintro">${esc(t('coal.intro'))}</p>
    <p class="mono coal-quota">${quota ? esc(t('coal.quota', { used: quota.used, max: quota.max })) : ''}</p>
    <form class="coal-form" novalidate>
      <div class="coal-kinds" role="radiogroup">
        <label><input type="radio" name="kind" value="LINK" checked> ${esc(t('coal.kindLink'))}</label>
        <label><input type="radio" name="kind" value="IMAGE"> ${esc(t('coal.kindImage'))}</label>
      </div>
      <label class="coal-field coal-url">
        <span>${esc(t('coal.urlLabel'))}</span>
        <input type="url" name="url" placeholder="${esc(t('coal.urlPlaceholderLink'))}" maxlength="500">
      </label>
      <label class="coal-field coal-image" hidden>
        <span>${esc(t('coal.imageLabel'))}</span>
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif">
      </label>
      <label class="coal-field">
        <span>${esc(t('coal.descriptionLabel'))}</span>
        <textarea name="description" maxlength="500" placeholder="${esc(t('coal.descriptionPlaceholder'))}" required></textarea>
      </label>
      <label class="coal-field">
        <span>${esc(t('coal.tcEmailLabel'))}</span>
        <input type="email" name="tcEmail" maxlength="200">
        <small>${esc(t('coal.tcEmailHint'))}</small>
      </label>
      <button class="btn" type="submit" ${remaining === 0 ? 'disabled' : ''}>${esc(t('coal.submit'))}</button>
      <p class="status coal-msg" role="status"></p>
    </form>`;
}

export function createCoal(root) {
  async function load() {
    root.innerHTML = `<p class="status">${esc(t('empty.loading'))}</p>`;
    const quota = await api.coalQuota().catch(() => null);
    root.innerHTML = shell(quota);

    const form = root.querySelector('.coal-form');
    const msg = form.querySelector('.coal-msg');
    const urlField = form.querySelector('.coal-url');
    const imageField = form.querySelector('.coal-image');
    const urlInput = form.querySelector('input[name="url"]');

    function syncKind() {
      const kind = form.querySelector('input[name="kind"]:checked').value;
      urlField.hidden = kind === 'IMAGE';
      imageField.hidden = kind !== 'IMAGE';
    }
    form.addEventListener('change', (e) => {
      if (e.target.name === 'kind') syncKind();
    });
    syncKind();

    if (quota && quota.remaining <= 0) msg.textContent = t('coal.quotaReached');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const kind = form.querySelector('input[name="kind"]:checked').value;
      const url = urlInput.value.trim();
      const description = form.querySelector('textarea[name="description"]').value.trim();
      const tcEmail = form.querySelector('input[name="tcEmail"]').value.trim();
      const file = form.querySelector('input[name="image"]').files[0];

      if (kind === 'LINK' && !url) return void (msg.textContent = t('coal.errorUrlRequired'));
      if (kind === 'IMAGE' && !file) return void (msg.textContent = t('coal.errorImageRequired'));

      const fd = new FormData();
      fd.set('kind', kind);
      fd.set('description', description);
      if (url) fd.set('url', url);
      if (tcEmail) fd.set('tcEmail', tcEmail);
      if (file) fd.set('image', file);

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      msg.textContent = t('coal.submitting');
      try {
        const r = await api.coalSubmit(fd);
        // Lien : on dit ou Qwen l'a range (section + categorie).
        const where = r.kind ? { section: t(`tab.${r.kind}`), topic: r.topic } : null;
        msg.textContent =
          r.status === 'REJECTED_AI'
            ? t('coal.successRejected')
            : r.status === 'APPROVED' && where
              ? t('coal.successPublished', where)
              : where
                ? t('coal.successReviewPlaced', where)
                : t('coal.successReview');
        form.reset();
        syncKind();
        const q = await api.coalQuota().catch(() => null);
        if (q) {
          root.querySelector('.coal-quota').textContent = t('coal.quota', { used: q.used, max: q.max });
          submitBtn.disabled = q.remaining <= 0;
        } else submitBtn.disabled = false;
      } catch (err) {
        submitBtn.disabled = false;
        const code = err.body?.error;
        msg.textContent = t(code === 'quota_atteint' ? 'coal.quotaReached' : code === 'lien_illisible' ? 'coal.errorUnreadable' : 'coal.errorGeneric');
      }
    });
  }

  load();
  return { reload: load };
}
