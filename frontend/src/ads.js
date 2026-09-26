// Annoncer — regie pub tierce self-serve (23/09, SPEC-ROADMAP.md Phase E). Paiement immediat (meme rail
// Stripe que Hacks), reste en PENDING_REVIEW jusqu'a relecture Naim (ads:review/approve/reject, CLI — jamais
// publie automatiquement, meme discipline que Add Coal/Liquid). Le prix affiche vient de /ads/pricing (jamais
// code en dur cote front : source unique = config.ts backend).
import { api } from './api.js';
import { t } from './i18n.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function shell(pricing) {
  const price = pricing ? (pricing.priceCents / 100).toFixed(2).replace('.', ',') + ' €' : '…';
  return `
    <p class="hintro">${esc(t('ads.intro', { price, days: pricing?.durationDays ?? '' }))}</p>
    <form class="coal-form ads-form" novalidate>
      <div class="post-row">
        <span class="post-label">${esc(t('ads.positionLabel'))}</span>
        <div class="post-chips" role="radiogroup" data-group="position">
          <button type="button" class="chip on" data-position="ADS_ASIDE">${esc(t('ads.positionAdsAside'))}</button>
          <button type="button" class="chip" data-position="PUB_ASIDE">${esc(t('ads.positionPubAside'))}</button>
        </div>
      </div>
      <label class="coal-field">
        <span>${esc(t('ads.nameLabel'))}</span>
        <input type="text" name="advertiserName" maxlength="120" required>
      </label>
      <label class="coal-field">
        <span>${esc(t('ads.emailLabel'))}</span>
        <input type="email" name="advertiserEmail" maxlength="200" required>
      </label>
      <label class="coal-field">
        <span>${esc(t('ads.imageUrlLabel'))}</span>
        <input type="url" name="imageUrl" maxlength="1000" placeholder="https://…" required>
      </label>
      <label class="coal-field">
        <span>${esc(t('ads.linkUrlLabel'))}</span>
        <input type="url" name="linkUrl" maxlength="1000" placeholder="https://…" required>
      </label>
      <label class="coal-field">
        <span>${esc(t('ads.tooltipLabel'))}</span>
        <input type="text" name="tooltip" maxlength="200" required>
      </label>
      <label class="coal-field">
        <span>${esc(t('ads.noteLabel'))}</span>
        <textarea name="note" maxlength="500" placeholder="${esc(t('ads.notePlaceholder'))}"></textarea>
      </label>
      <button class="btn" type="submit">${esc(t('ads.submit', { price }))}</button>
      <p class="status ads-msg" role="status"></p>
    </form>`;
}

export function createAds(root) {
  async function load() {
    root.innerHTML = `<p class="status">${esc(t('empty.loading'))}</p>`;
    const pricing = await api.adsPricing().catch(() => null);
    root.innerHTML = shell(pricing);

    const form = root.querySelector('.ads-form');
    const msg = form.querySelector('.ads-msg');
    let position = 'ADS_ASIDE';

    form.querySelector('[data-group="position"]').addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      form.querySelectorAll('[data-group="position"] .chip').forEach((c) => c.classList.toggle('on', c === btn));
      position = btn.dataset.position;
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = {
        position,
        advertiserName: form.querySelector('[name="advertiserName"]').value.trim(),
        advertiserEmail: form.querySelector('[name="advertiserEmail"]').value.trim(),
        imageUrl: form.querySelector('[name="imageUrl"]').value.trim(),
        linkUrl: form.querySelector('[name="linkUrl"]').value.trim(),
        tooltip: form.querySelector('[name="tooltip"]').value.trim(),
        note: form.querySelector('[name="note"]').value.trim() || undefined,
      };
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      msg.textContent = t('ads.submitting');
      try {
        const r = await api.adsSubmit(data);
        if (r.checkoutUrl) {
          window.location.href = r.checkoutUrl;
        } else {
          throw new Error('pas_de_checkout_url');
        }
      } catch (err) {
        submitBtn.disabled = false;
        msg.textContent = err?.body?.error === 'rail_indisponible' ? t('ads.errorPaymentOff') : t('ads.errorGeneric');
      }
    });
  }

  load();
  return { reload: load };
}
