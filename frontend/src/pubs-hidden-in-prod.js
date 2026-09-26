// Pubs RETIREES en production (Naim 24/09 : sites a garder discrets avant leur protection). Chemins RELATIFS a
// public/pubs/ (dossier compris : circles/, squares/, zone_fr_only/circles/, zone_fr_only/squares/). Source unique,
// lue par scripts/gen-pubs.js (listes du site) ET par vite.config.js (fichiers retires du build de prod : ni
// visibles ni accessibles par leur URL). En dev, tout reste affiche. Pour en remettre une en prod : la retirer d'ici.
export const HIDDEN_IN_PROD = [
  'circles/tbcity.webp',
  'circles/refland1.webp',
  'circles/conspix.webp',
  'zone_fr_only/circles/zarmazon.webp',
  'zone_fr_only/squares/avcnewssport.webp',
];
