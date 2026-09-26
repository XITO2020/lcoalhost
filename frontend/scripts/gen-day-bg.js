// Genere frontend/src/day-bg.generated.js en listant REELLEMENT public/img/day-bg/ (meme pattern anti-
// perimption que scripts/gen-banner-titles.js, cf. bug reel du 22/09 sur les titres de banniere) — jamais
// coder les noms de fichiers en dur ailleurs. Trie NUMERIQUEMENT (ground0, ground1, ..., ground10), jamais
// alphabetiquement (sinon "ground10" se classerait avant "ground2", ce qui casserait l'ordre d'enchainement
// voulu par Naim). Tourne automatiquement avant chaque `npm run dev`/`build` (voir package.json : predev/
// prebuild).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'public', 'img', 'day-bg');
const outFile = path.join(here, '..', 'src', 'day-bg.generated.js');

function listGrounds() {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .map((f) => ({ f, m: /^ground(\d+)\.(jpe?g|png|webp)$/i.exec(f) }))
    .filter((x) => x.m)
    .sort((a, b) => Number(a.m[1]) - Number(b.m[1]))
    .map((x) => x.f);
}

const grounds = listGrounds();

const out = `// GENERE AUTOMATIQUEMENT par scripts/gen-day-bg.js (a chaque npm run dev/build) — NE PAS EDITER A LA MAIN,
// ca sera ecrase. Pour ajouter/retirer un fond de mode jour : deposer/supprimer un fichier
// ground{N}.{jpg|jpeg|png|webp} dans public/img/day-bg/, puis relancer npm run dev (ou juste ce script :
// node scripts/gen-day-bg.js). Ordre = NUMERIQUE (ground0, ground1, ... ground10), pas alphabetique.
export const DAY_BG_GROUNDS = ${JSON.stringify(grounds)};
`;

fs.writeFileSync(outFile, out);
console.log(`[gen-day-bg] ${grounds.length} fond(s) -> ${path.relative(process.cwd(), outFile)}`);
