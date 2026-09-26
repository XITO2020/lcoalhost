// Mode admin (demande Naim 22/09) : PAS un compte, un secret partage (`ADMIN_TOKEN` cote serveur). Active soit
// via ?admin=<token> dans l'URL (ancien mecanisme, garde pour compat), soit via le mot de passe "Contremaitre"
// du bureau d'embauche (embauche.js, 7e passe) — les deux stockent le meme token en localStorage. Etat lu par
// feed.js pour afficher (ou pas) le bouton supprimer sur chaque carte memes/videos/articles.
import { api } from './api.js';

let active = false;

export function isAdmin() {
  return active;
}

/** Lit un token stocke, le verifie aupres du serveur, active le mode si valide. Silencieux si absent/invalide
 * (un visiteur normal ne doit jamais voir d'erreur liee a ca). */
export async function initAdmin() {
  let token = '';
  try {
    token = localStorage.getItem('lh_admin_token') ?? '';
  } catch {
    return false;
  }
  if (!token) return false;
  try {
    await api.adminWhoami();
    active = true;
  } catch {
    active = false;
    try {
      localStorage.removeItem('lh_admin_token'); // token perime/faux : pas la peine de le retenter a chaque visite
    } catch {
      /* stockage indisponible, tant pis */
    }
  }
  return active;
}

/** Tente une connexion avec un mot de passe tape a la main (bureau d'embauche, role Contremaitre). Le mot de
 * passe EST le token — meme secret que `?admin=`, juste saisi via un formulaire plutot que colle dans l'URL. */
export async function loginWithToken(token) {
  try {
    localStorage.setItem('lh_admin_token', token);
  } catch {
    return false;
  }
  return initAdmin();
}

/** Deconnexion (23/09, demande Naim — manquait) : efface le token stocke, desactive le mode admin en memoire.
 * Rien a prevenir cote serveur (le token reste valide, juste plus utilise depuis ce navigateur). */
export function logout() {
  active = false;
  try {
    localStorage.removeItem('lh_admin_token');
  } catch {
    /* stockage indisponible : rien a effacer, tant pis */
  }
}

/** Capture un ?admin=<token> dans l'URL courante, le stocke, nettoie l'URL (pas dans l'historique/referrer). */
export function captureAdminTokenFromUrl() {
  const url = new URL(location.href);
  const token = url.searchParams.get('admin');
  if (!token) return;
  try {
    localStorage.setItem('lh_admin_token', token);
  } catch {
    /* stockage indisponible : le mode admin ne pourra pas s'activer ce coup-ci */
  }
  url.searchParams.delete('admin');
  history.replaceState(null, '', url.pathname + url.search + url.hash);
}
