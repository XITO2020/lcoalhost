// Genere frontend/src/banner-titles.generated.js en listant REELLEMENT public/img/ — remplace des tableaux ecrits a
// la main qui se perimaient des qu'un fichier etait ajoute/retire (bug reel du 22/09 : cases "pas de titre").
// 4 sources (Naim 24/09 : dossier day/ ajoute, "c'est mieux") :
//  - racine public/img/  : titres UNIVERSELS (tous themes), filtre STRICT lcoal<N>.webp (la racine contient aussi
//    steel.jpg, les fonds, etc. qu'il ne faut pas prendre) ;
//  - public/img/day/     : titres du theme JOUR (blanc) ;
//  - public/img/night/   : titres du theme NUIT ;
//  - public/img/urbex/   : titres du theme URBEX (acier).
// Deposer un fichier image dans day/ night/ urbex/ = pris en compte automatiquement (n'importe quel nom d'image).
// Tourne avant chaque npm run dev/build (predev/prebuild) ET, en dev, a chaque ajout/retrait sous public/img/
// (plugin dans vite.config.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(here, '..', 'public', 'img');
const outFile = path.join(here, '..', 'src', 'banner-titles.generated.js');

const listBy = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f)).sort() : []);
const IMG = /\.(webp|png|jpe?g|gif|avif)$/i; // dossiers de theme = dedies aux titres : tout fichier image compte
const ROOT = /^lcoal\d+\.webp$/i; // racine partagee : seulement les lcoal<N>.webp, pas les fonds/textures

const all = listBy(imgDir, ROOT);
const day = listBy(path.join(imgDir, 'day'), IMG).map((f) => `day/${f}`);
const night = listBy(path.join(imgDir, 'night'), IMG).map((f) => `night/${f}`);
const urbex = listBy(path.join(imgDir, 'urbex'), IMG).map((f) => `urbex/${f}`);

const banner = `// GENERE AUTOMATIQUEMENT par scripts/gen-banner-titles.js (a chaque npm run dev/build) — NE PAS EDITER A LA
// MAIN, ca sera ecrase. Titres de banniere : public/img/ (universels, lcoal<N>.webp) + public/img/day|night|urbex/
// (par theme, n'importe quel fichier image). Deposer/supprimer un fichier puis relancer npm run dev (ou ce script).
export const BANNER_TITLES_ALL = ${JSON.stringify(all)};
export const BANNER_TITLES_DAY = ${JSON.stringify(day)};
export const BANNER_TITLES_NIGHT = ${JSON.stringify(night)};
export const BANNER_TITLES_URBEX = ${JSON.stringify(urbex)};
`;

fs.writeFileSync(outFile, banner);
console.log(`[gen-banner-titles] ${all.length} universel(s), ${day.length} jour, ${night.length} nuit, ${urbex.length} urbex -> ${path.relative(process.cwd(), outFile)}`);
