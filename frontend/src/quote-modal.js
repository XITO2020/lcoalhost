// Formulaire "Annoncer ici" (Naim 24/09) : ouvert par le 1er encart VIDE de l'aside gauche. Reprend le DESIGN du
// modal "details" du Labo Pentest (memes classes .pentest-backdrop / .pentest-modal / .pentest-close / .pentest-*).
// Texte SIMPLE uniquement (meme charset que la route backend : lettres, chiffres, espace, retour ligne, @ . , : ! ?)
// -> filtre a la saisie ET a l'envoi. Le backend re-valide, limite a 1/IP/24h et envoie/stocke la demande.
import { t } from './i18n.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Autorise: A-Za-z 0-9 espace, retours ligne/tab, @ . , : ! ? — retire tout le reste (colle/frappe).
const clean = (s) => s.replace(/[^A-Za-z0-9 \r\n\t@.,:!?]/g, '');

let open = false;

export function openQuoteModal() {
  if (open) return;
  open = true;
  const backdrop = document.createElement('div');
  backdrop.className = 'pentest-backdrop';
  const modal = document.createElement('div');
  modal.className = 'pentest-modal quote-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  function close() {
    open = false;
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev) {
    if (ev.key === 'Escape') close();
  }
  backdrop.addEventListener('click', (ev) => {
    if (ev.target === backdrop) close();
  });
  document.addEventListener('keydown', onKey);

  modal.innerHTML = `
    <button type="button" class="pentest-close" aria-label="${esc(t('quote.close'))}">&times;</button>
    <div class="pentest-head">
      <p class="pentest-title">${esc(t('quote.title'))}</p>
      <p class="pentest-tag">${esc(t('quote.tag'))}</p>
    </div>
    <p class="pentest-intro">${esc(t('quote.intro'))}</p>
    <form class="quote-form" novalidate>
      <label class="quote-field">
        <span>${esc(t('quote.label'))}</span>
        <textarea name="message" rows="5" maxlength="1500" required placeholder="${esc(t('quote.placeholder'))}"></textarea>
      </label>
      <p class="quote-note mono">${esc(t('quote.note'))}</p>
      <button class="btn pentest-visit" type="submit">${esc(t('quote.send'))}</button>
      <p class="status quote-msg" role="status"></p>
    </form>`;

  modal.querySelector('.pentest-close').addEventListener('click', close);
  const form = modal.querySelector('.quote-form');
  const ta = form.querySelector('textarea');
  const msg = form.querySelector('.quote-msg');
  ta.focus();
  // Filtre a la saisie : impossible de taper/coller un caractere interdit.
  ta.addEventListener('input', () => {
    const pos = ta.selectionStart;
    const before = ta.value;
    const after = clean(before);
    if (after !== before) {
      ta.value = after;
      ta.setSelectionRange(pos - 1, pos - 1);
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const message = clean(ta.value).trim();
    if (message.length < 10) return void (msg.textContent = t('quote.tooShort'));
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.textContent = t('quote.sending');
    try {
      const r = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
        credentials: 'same-origin',
      });
      if (r.ok) {
        form.innerHTML = `<p class="status quote-ok">${esc(t('quote.ok'))}</p>`;
        setTimeout(close, 2500);
        return;
      }
      btn.disabled = false;
      msg.textContent = r.status === 429 ? t('quote.limit') : r.status === 400 ? t('quote.badChars') : t('quote.error');
    } catch {
      btn.disabled = false;
      msg.textContent = t('quote.error');
    }
  });
}
