// Themes — blanc (defaut) / nuit / steel (demande Naim 22/09). PAS de detection systeme
// (prefers-color-scheme ignore volontairement) : bascule manuelle uniquement, persistee comme la langue.
// L'id interne reste "steel" (assets nommes steel*.jpg/webp) mais le theme s'AFFICHE "Urbex" (FR et EN,
// cf. i18n.js theme.steel) — rebaptise par Naim le 22/09, ne pas renommer l'id sans repenser les assets/CSS vars.
export const THEMES = ['white', 'night', 'steel'];

const THEME_COLOR = { white: '#2a0906', night: '#0a090d', steel: '#232427' };

// try/catch (audit 24/09) : stockage bloque = SecurityError a la lecture -> le site entier ne demarrait pas.
const readStored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
let current = THEMES.includes(readStored('lh_theme')) ? readStored('lh_theme') : 'white';
applyTheme(current);

function applyTheme(theme) {
  if (theme === 'white') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  document.getElementById('theme-color-meta')?.setAttribute('content', THEME_COLOR[theme]);
}

export function getTheme() {
  return current;
}

/** Le theme sur lequel on basculerait au prochain clic (meme logique d'affichage que lang-switch : on montre la cible, pas l'etat courant). */
export function nextTheme() {
  return THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
}

export function setTheme(theme) {
  if (!THEMES.includes(theme) || theme === current) return;
  current = theme;
  try {
    localStorage.setItem('lh_theme', theme);
  } catch {
    /* stockage indisponible (navigation privee) : le choix ne survit pas au rechargement, tant pis */
  }
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('lh:theme', { detail: { theme } })); // meme pattern que lh:lang (i18n.js)
}
