// Mesure pub anonyme (23/09, SPEC-ROADMAP.md Phase D.4) : signale au backend "encart vu" / "encart clique" pour
// un taux de clic reel. "Vu" = au moins 50 % de l'encart REELLEMENT a l'ecran (pas juste present dans la page :
// sous 1700px le volet est ferme, une pastille cachee ne doit pas compter), 1 fois par encart et par chargement.
// Aucun identifiant envoye : juste la cle de l'encart et le type d'evenement. Envois groupes, jamais bloquants.
const queue = [];
let timer = null;
const seenViews = new WeakSet();

function flush() {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const events = queue.splice(0, 20);
  fetch('/api/promo/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ events }),
    credentials: 'same-origin',
    keepalive: true, // l'envoi survit a la fermeture de l'onglet
  }).catch(() => {});
  if (queue.length) flush();
}

function push(key, type) {
  queue.push({ key, type });
  if (queue.length >= 20) flush();
  else if (!timer) timer = setTimeout(flush, 2000);
}

const observer =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting || seenViews.has(e.target)) continue;
            seenViews.add(e.target);
            observer.unobserve(e.target);
            push(e.target.dataset.promoKey, 'view');
          }
        },
        { threshold: 0.5 },
      )
    : null;

/** Suit un encart : affichage reel (IntersectionObserver) + clic. `key` = "pub:<nom>" ou "ad:<id AdSlot>". */
export function trackPromo(el, key) {
  if (!el || !key) return;
  el.dataset.promoKey = key;
  observer?.observe(el);
  el.addEventListener('click', () => push(key, 'click'));
}

window.addEventListener('pagehide', flush);
