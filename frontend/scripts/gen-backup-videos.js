// Genere frontend/src/videos-backup.generated.js en listant REELLEMENT public/videos/ (meme pattern que
// gen-pubs.js / gen-day-bg.js). Ce dossier = "petit dossier video de secours" (Naim 23/09) : quand le rail
// Veille n'a rien a montrer (API/base indisponible, ou aucun clip issu de videos.json), tiktok.js y lit ces
// fichiers dans un ordre aleatoire. Envoye sur le KVM2 par deploy/deploy-kvm2.sh (videos.tgz), servi par nginx
// sur /videos/ — la liste generee au build correspond donc a ce qui est deploye.
// Tourne avant chaque `npm run dev`/`build` (predev/prebuild) ET, en dev, a chaque ajout/retrait de fichier
// (plugin dans vite.config.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'public', 'videos');
// always_init/ (Naim 23/09) : les videos cles de l'identite du site, TOUJOURS lues en premier, dans l'ordre des noms
// de fichiers (renommer 1-xxx / 2-xxx pour choisir l'ordre). Naim les remplace lui-meme en changeant les fichiers.
const initDir = path.join(dir, 'always_init');
const outFile = path.join(here, '..', 'src', 'videos-backup.generated.js');

const list = (d) =>
  fs.existsSync(d)
    ? fs
        .readdirSync(d)
        .filter((f) => /\.(mp4|webm|m4v|mov)$/i.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    : [];
const files = list(dir); // communes a toutes les langues (fichiers poses a la racine de videos/)
const init = list(initDir).map((f) => `always_init/${f}`);
// Par langue (Naim 24/09) : videos/fr/, videos/en/, videos/es/ — chacun avec SON videos.json (source du lecteur
// dans cette langue) et SES videos locales (secours + intercalees toutes les 10).
const LANGS = ['fr', 'en', 'es'];
const byLang = Object.fromEntries(LANGS.map((l) => [l, list(path.join(dir, l)).map((f) => `${l}/${f}`)]));

const out = `// GENERE AUTOMATIQUEMENT par frontend/scripts/gen-backup-videos.js — NE PAS EDITER A LA MAIN, ca sera ecrase.
// Pour ajouter/retirer une video : deposer/supprimer un fichier .mp4/.webm dans frontend/public/videos/<langue>/
// (fr, en, es) ou a la racine de videos/ (commune a toutes les langues).
// Videos d'ouverture (toujours lues en premier, toutes langues) : frontend/public/videos/always_init/.
export const BACKUP_VIDEOS = ${JSON.stringify(files)};
export const BACKUP_VIDEOS_BY_LANG = ${JSON.stringify(byLang)};
export const ALWAYS_INIT_VIDEOS = ${JSON.stringify(init)};
`;
if (!fs.existsSync(outFile) || fs.readFileSync(outFile, 'utf8') !== out) fs.writeFileSync(outFile, out);
console.log(
  `[gen-backup-videos] ${init.length} d'ouverture (always_init), ${files.length} commune(s), ${LANGS.map((l) => `${l}:${byLang[l].length}`).join(' ')} -> src/videos-backup.generated.js`,
);
