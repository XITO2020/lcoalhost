// Hacks — brique payante (demande Naim 22/09) : recettes dev/design, 1 hack = 4,44 € ou pack de 3 = 8,88 €.
// Selection par coches ; une barre flottante recapitule et lance le paiement (redirection Stripe Checkout).
import { api } from './api.js';
import { t } from './i18n.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const eur = (cents) => (cents / 100).toFixed(2).replace('.', ',') + ' €';

function md(text) {
  // Rendu minimal (pas de lib) : blocs ```code```, titres ##, gras **, sauts de ligne. Suffisant pour nos recettes.
  return esc(text)
    .replace(/```([a-z]*)\n([\s\S]*?)```/g, (_m, _lang, code) => `<pre><code>${code}</code></pre>`)
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n{2,}/g, '</p><p>')
    .replace(/\n/g, '<br>');
}

function card(h, selected) {
  return `<article class="hcard${h.unlocked ? ' unlocked' : ''}" data-id="${esc(h.id)}">
    <label class="hcard-pick">
      <input type="checkbox" ${selected ? 'checked' : ''} ${h.unlocked ? 'disabled' : ''} aria-label="${esc(t('hacks.select'))}${esc(h.title)}">
      <span class="hcard-h">
        <b>${esc(h.title)}</b>
        ${h.unlocked ? `<span class="chip-topic">${esc(t('hacks.unlocked'))}</span>` : `<span class="hprice">${eur(h.priceCents)}</span>`}
      </span>
    </label>
    <p class="hteaser">${esc(h.teaser)}</p>
    ${h.sourceNote ? `<p class="hsource mono">${esc(t('hacks.source'))}${esc(h.sourceNote)}</p>` : ''}
    ${h.unlocked ? `<div class="hbody"><p>${md(h.body)}</p></div>` : ''}
  </article>`;
}

export function createHacks(root) {
  const st = { hacks: [], selected: new Set(), pricing: { single: 444, pack3: 888 }, loading: false };

  function total() {
    const n = st.selected.size;
    if (n === 1) return st.pricing.single;
    if (n === 3) return st.pricing.pack3;
    return null;
  }

  function paintBar() {
    const bar = root.querySelector('.hbar');
    const n = st.selected.size;
    const price = total();
    if (!n) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    bar.querySelector('.hbar-txt').textContent = t(price === null ? 'hacks.selectedChoose' : 'hacks.selectedPrice', { n, price: price !== null ? eur(price) : '' });
    bar.querySelector('.hbar-pay').disabled = price === null || st.loading;
  }

  async function load() {
    root.innerHTML = `<p class="status">${esc(t('hacks.loading'))}</p><div class="hbar" hidden><span class="hbar-txt"></span><button class="btn hbar-pay" type="button">${esc(t('hacks.pay'))}</button></div>`;
    try {
      const data = await api.hacks();
      st.hacks = data.hacks;
      st.pricing = data.pricing;
      root.innerHTML =
        `<p class="hintro">${esc(t('hacks.intro', { single: eur(st.pricing.single), pack3: eur(st.pricing.pack3) }))}</p>` +
        `<div class="hgrid">${st.hacks.length ? st.hacks.map((h) => card(h, st.selected.has(h.id))).join('') : `<p class="status">${esc(t('hacks.none'))}</p>`}</div>` +
        `<div class="hbar" hidden><span class="hbar-txt"></span><button class="btn hbar-pay" type="button">${esc(t('hacks.pay'))}</button></div>`;
      paintBar();
    } catch {
      root.innerHTML = `<p class="status">${esc(t('empty.serverError'))}</p>`;
    }
  }

  root.addEventListener('change', (e) => {
    const input = e.target.closest('input[type="checkbox"]');
    if (!input) return;
    const id = input.closest('.hcard').dataset.id;
    if (input.checked) {
      if (st.selected.size >= 3) {
        input.checked = false;
        return;
      }
      st.selected.add(id);
    } else st.selected.delete(id);
    paintBar();
  });

  root.addEventListener('click', async (e) => {
    if (!e.target.closest('.hbar-pay')) return;
    const price = total();
    if (price === null || st.loading) return;
    st.loading = true;
    paintBar();
    try {
      const r = await api.hacksCheckout([...st.selected]);
      if (r.checkoutUrl) window.location.href = r.checkoutUrl;
      else throw new Error('pas_de_checkout_url');
    } catch (err) {
      st.loading = false;
      paintBar();
      const key =
        err.body?.error === 'rail_indisponible' ? 'hacks.railOff' : err.body?.error === 'deja_debloque' ? 'hacks.alreadyUnlocked' : 'hacks.paymentGlitch';
      root.querySelector('.hbar-txt').textContent = t(key);
    }
  });

  load();
  return { reload: load };
}
