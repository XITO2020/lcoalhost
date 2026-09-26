// Son global du site (Naim 23/09 : "le son est a remettre a chaque video : NUL ! On allume le son pour tout le
// site, dont les videos, ou on l'eteint"). UN etat on/off pour toutes les videos (rail TikTok + lecteur du feed),
// memorise dans le navigateur (lh_sound). Coupe par defaut : les navigateurs bloquent de toute facon la lecture
// automatique AVEC son tant que le visiteur n'a pas interagi avec la page.
import { t } from './i18n.js';

const KEY = 'lh_sound';
let on = false;
try {
  on = localStorage.getItem(KEY) === 'on';
} catch {
  /* stockage indisponible : reste coupe */
}
const listeners = new Set();

// SON SOUHAITE (`on`, memorise) != SON AUTORISE (`unlocked`) — bug reel du 23/09 : apres un rechargement, `on` etait
// deja vrai mais le navigateur interdit le son tant que la page n'a pas recu de clic -> les lecteurs etaient forces
// en muet alors que le site se croyait "son actif" : le 1er clic sur le bouton volume COUPAIT le son (2 clics
// necessaires) et les videos locales restaient muettes. Le son effectif = souhaite ET autorise ; c'est lui que
// lisent tous les lecteurs et tous les boutons.
let unlocked = Boolean(navigator.userActivation?.hasBeenActive);
const notify = () => listeners.forEach((fn) => fn(isSoundOn()));

export const isSoundOn = () => on && unlocked;

export function setSound(value) {
  // Activer le son vient toujours d'un geste du visiteur (bouton, volume d'un lecteur) : c'est ce geste qui autorise.
  const wasOn = isSoundOn();
  if (value) unlocked = true;
  on = value;
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* pas grave : l'etat vaut pour cette page */
  }
  if (isSoundOn() !== wasOn) notify();
}

// Premier clic / touche du visiteur n'importe ou sur la page : le son souhaite devient autorise, tous les lecteurs le
// recoivent dans CE geste (le navigateur accepte alors la lecture avec son). `click` (et pas pointerdown) en phase de
// bouillonnement : un clic sur un bouton son est traite par le bouton d'abord (il fait stopPropagation).
function unlockOnGesture() {
  if (unlocked) return;
  unlocked = true;
  if (on) notify();
}
window.addEventListener('click', unlockOnGesture);
window.addEventListener('keydown', unlockOnGesture);

export function onSoundChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const ICON_ON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
const ICON_OFF =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 9v6h4l5 4V5L7 9H3zm18.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z"/></svg>';

/** Branche un bouton on/off (icone + libelle accessible traduit, suit l'etat global et la langue). */
export function bindSoundButton(btn) {
  if (!btn) return;
  const paint = () => {
    const effective = isSoundOn();
    btn.innerHTML = effective ? ICON_ON : ICON_OFF;
    btn.setAttribute('aria-pressed', String(effective));
    const label = t(effective ? 'sound.on' : 'sound.off');
    btn.setAttribute('aria-label', label);
    btn.title = label;
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setSound(!isSoundOn()); // bascule sur le son EFFECTIF : muet a l'ecran -> un clic = son, jamais l'inverse
  });
  onSoundChange(paint);
  window.addEventListener('lh:lang', paint);
  paint();
}

/** Bouton clair "Appuyer pour autoriser le son" (hero, Naim 23/09) : visible tant que le son effectif est coupe ;
 * un clic = son active pour TOUT le site (lecteurs locaux, TikTok, feed) ET lecture du lecteur video lancee
 * (evenement lh:play-request, ecoute par tiktok.js), puis il disparait. */
export function bindSoundUnlock(btn) {
  if (!btn) return;
  const paint = () => (btn.hidden = isSoundOn());
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setSound(true);
    window.dispatchEvent(new CustomEvent('lh:play-request'));
  });
  onSoundChange(paint);
  paint();
}
