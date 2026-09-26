// Bureau d'embauche (demande Naim 22/09, 7e passe) : bouton rouge "EMBAUCHE" -> choix Ouvrier / Contremaitre.
// Ouvrier = purement decoratif (aucun vrai compte, le site reste anonyme comme partout ailleurs sur Lcoalhost —
// choix explicite de Naim : pas de systeme de comptes style ref.land ici, juste l'habillage). Contremaitre =
// Naim, mot de passe -> mode admin (meme mecanisme que `?admin=<token>`, voir admin.js).
import { loginWithToken } from './admin.js';
import { t } from './i18n.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function createEmbauche(btn, { onAdmin } = {}) {
  let modal = null;

  function close() {
    modal?.remove();
    modal = null;
  }

  function open() {
    close();
    modal = document.createElement('div');
    modal.className = 'embauche-modal';
    modal.innerHTML = `
      <div class="embauche-box">
        <button class="embauche-close" type="button" aria-label="${esc(t('embauche.close'))}">✕</button>
        <p class="embauche-h">${esc(t('embauche.title'))}</p>
        <p class="embauche-sub">${esc(t('embauche.subtitle'))}</p>
        <div class="embauche-choices">
          <button class="btn" data-role="ouvrier">${esc(t('embauche.worker'))}</button>
          <button class="btn" data-role="foreman">${esc(t('embauche.foreman'))}</button>
        </div>
        <form class="embauche-pass" hidden>
          <input type="password" name="pw" placeholder="${esc(t('embauche.passwordPlaceholder'))}" autocomplete="off">
          <button class="btn" type="submit">${esc(t('embauche.enter'))}</button>
        </form>
        <p class="embauche-msg" role="status"></p>
      </div>`;
    document.body.appendChild(modal);

    const msg = modal.querySelector('.embauche-msg');
    const passForm = modal.querySelector('.embauche-pass');
    const choices = modal.querySelector('.embauche-choices');

    modal.querySelector('.embauche-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    modal.addEventListener('click', (e) => {
      const b = e.target.closest('[data-role]');
      if (!b) return;
      if (b.dataset.role === 'ouvrier') {
        choices.hidden = true;
        msg.textContent = t('embauche.workerWelcome');
        setTimeout(close, 1800);
      } else {
        choices.hidden = true;
        passForm.hidden = false;
        passForm.querySelector('input').focus();
      }
    });

    passForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = passForm.querySelector('input').value;
      const submitBtn = passForm.querySelector('button');
      submitBtn.disabled = true;
      msg.textContent = t('embauche.checking');
      const ok = await loginWithToken(pw);
      submitBtn.disabled = false;
      if (ok) {
        msg.textContent = t('embauche.foremanWelcome');
        onAdmin?.();
        setTimeout(close, 1200);
      } else {
        msg.textContent = t('embauche.wrongPassword');
        passForm.querySelector('input').value = '';
        passForm.querySelector('input').focus();
      }
    });
  }

  btn.addEventListener('click', open);
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
}
