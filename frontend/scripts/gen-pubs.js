// Genere les listes de pubs en listant REELLEMENT public/pubs/ (Naim 23/09). 4 emplacements (Naim 24/09) :
//  - circles/                 : pastilles rondes MONDIALES (aside droit) ;
//  - squares/                 : encarts carres MONDIAUX (aside gauche + colonne sous Liquid) ;
//  - zone_fr_only/circles/    : pastilles rondes affichees UNIQUEMENT en langue FR (territoires francophones) ;
//  - zone_fr_only/squares/    : encarts carres affiches UNIQUEMENT en langue FR.
// Le ciblage "francophone" se fait sur la LANGUE D'INTERFACE (getLang()==='fr'), pas sur la geolocalisation IP
// (privacy-first ; l'appel geo ip-api est deja pointe par l'audit). Un vrai geo-ciblage FR+CA serait une autre
// decision. Meme principe anti-perimption que gen-day-bg.js / gen-banner-titles.js.
// Ecrit DEUX fichiers : frontend/src/pubs.generated.js (listes du site) et
// backend/src/promo/house-pins.generated.ts (cles acceptees par la mesure des clics).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HIDDEN_IN_PROD } from '../src/pubs-hidden-in-prod.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const pubsDir = path.join(here, '..', 'public', 'pubs');
const frontOut = path.join(here, '..', 'src', 'pubs.generated.js');
const backOut = path.join(here, '..', '..', 'backend', 'src', 'promo', 'house-pins.generated.ts');

const list = (sub) => {
  const dir = path.join(pubsDir, sub);
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => /\.(webp|png|jpe?g|gif|avif|svg)$/i.test(f))
        .sort((a, b) => a.localeCompare(b))
    : [];
};

// Les pubs discretes (src/pubs-hidden-in-prod.js) ne figurent que dans une branche DEV, que la compilation de
// PRODUCTION supprime -> ni affichees, ni meme nommees dans le JavaScript envoye aux visiteurs.
const emit = (sub, files) => {
  const shown = files.filter((f) => !HIDDEN_IN_PROD.includes(`${sub}/${f}`));
  const discreet = files.filter((f) => HIDDEN_IN_PROD.includes(`${sub}/${f}`));
  return `[...${JSON.stringify(shown)}, ...(import.meta.env.DEV ? ${JSON.stringify(discreet)} : [])]`;
};

const circles = list('circles');
const squares = list('squares');
const circlesFr = list('zone_fr_only/circles');
const squaresFr = list('zone_fr_only/squares');

const header = `// GENERE AUTOMATIQUEMENT par frontend/scripts/gen-pubs.js — NE PAS EDITER A LA MAIN, ca sera ecrase.
// Deposer/supprimer une image dans public/pubs/circles|squares (mondial) ou public/pubs/zone_fr_only/circles|squares
// (langue FR uniquement).`;

const writeIfChanged = (file, content) => {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.writeFileSync(file, content);
};
writeIfChanged(
  frontOut,
  `${header}
export const PUB_FILES = ${emit('circles', circles)};
export const PUB_FILES_FR = ${emit('zone_fr_only/circles', circlesFr)};
export const SQUARE_FILES = ${emit('squares', squares)};
export const SQUARE_FILES_FR = ${emit('zone_fr_only/squares', squaresFr)};
`,
);
// Cles de mesure acceptees : nom de fichier pour les pastilles rondes (mondiales + FR), "squares/<fichier>" pour les
// carres (mondiaux + FR). Le backend ne se soucie pas de la zone, juste de la validite de la cle.
const keys = [...circles, ...circlesFr, ...[...squares, ...squaresFr].map((f) => `squares/${f}`)];
writeIfChanged(backOut, `${header}\nexport const HOUSE_PIN_FILES: readonly string[] = ${JSON.stringify(keys)};\n`);
console.log(
  `[gen-pubs] rondes ${circles.length} monde + ${circlesFr.length} FR, carres ${squares.length} monde + ${squaresFr.length} FR -> pubs.generated.js + house-pins.generated.ts`,
);
