// "Colle" un aside a l'ecran entre deux bornes (Naim 22/09). 3 zones, pas 2 (bug trouve sur retour Naim avec
// capture : la 1ere version etait fixed des le chargement, donc chevauchait la banniere avant meme le moindre
// scroll) :
//  1. Avant `startEl` (+ startGap)   -> position:absolute a sa position naturelle (sous la banniere/ticker,
//     scrolle normalement avec la page, ne la recouvre jamais).
//  2. Entre les deux bornes          -> position:fixed (colle a l'ecran, "right/left:10px" reste visible).
//  3. Apres `referenceEl` (+ gap)    -> position:absolute figee la (arrete de suivre, demande Naim).
export function anchorToScroll(el, { top = 68, startEl, referenceEl, startGap = 20, gap = 20 }) {
  if (!el || !startEl || !referenceEl) return; // garde-fou : un des elements attendus manque, on ne casse rien
  let startY = 0;
  let stopY = 0;

  // offsetTop/offsetParent = position NATURELLE d'un element dans le document, y compris s'il (ou un ancetre)
  // est position:sticky — contrairement a getBoundingClientRect() qui refleterait sa position VISUELLE une fois
  // collee (donc fausserait tout calcul fait pendant un scroll). Calcule une fois, pas a chaque scroll.
  function naturalBottom(node) {
    let offset = 0;
    let n = node;
    while (n) {
      offset += n.offsetTop;
      n = n.offsetParent;
    }
    return offset + node.offsetHeight;
  }

  function measure() {
    startY = naturalBottom(startEl) + startGap;
    stopY = naturalBottom(referenceEl) + gap;
  }

  function apply() {
    if (el.hidden || getComputedStyle(el).display === 'none') return; // pas de calcul inutile si masque (< 1700px)
    const wouldBeAt = window.scrollY + top;
    if (wouldBeAt < startY) {
      el.style.position = 'absolute';
      el.style.top = `${startY}px`;
    } else if (wouldBeAt < stopY) {
      el.style.position = 'fixed';
      el.style.top = `${top}px`;
    } else {
      el.style.position = 'absolute';
      el.style.top = `${stopY}px`;
    }
  }

  measure();
  apply();
  window.addEventListener('scroll', apply, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    apply();
  });
}
