// Import local de test (23/09, demande Naim) : brancher en LOCAL le dossier videos Conspix (sous-dossiers
// tech : coding, linux, terminal-cmd-tools, deep-learning-new-ia...) pour juger l'affichage des cartes VIDEO
// avec du vrai contenu, sans rien scraper. JAMAIS de production : ne fait rien si LOCAL_VIDEOS_DIR est vide
// (voir config.ts), et la route qui sert ces fichiers (/local-videos, index.ts) est elle-meme coupee en prod.
// Usage : npm run dev:import-local-videos (relire data/import-local-videos.md ci-dessous si besoin).
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { prisma } from '../lib/prisma';

const SOURCE = 'local-test';
const PER_FOLDER = Number(process.env.LOCAL_VIDEOS_PER_FOLDER ?? 4);

// Mapping grossier dossier -> topic existant (js/python/css/ia/cybersec/devops/survie/general) : suffisant
// pour un test d'affichage, pas une vraie classification (contrairement a scraper/topics.ts).
const TOPIC_BY_FOLDER: Record<string, string> = {
  coding: 'js',
  'terminal-cmd-tools': 'devops',
  linux: 'devops',
  'cloud-data-astuces': 'devops',
  nocode: 'devops',
  'web3+ressources+navigation': 'devops',
  'blender3d-unreal5': 'devops',
  'video-edit': 'devops',
  'deep-learning-new-ia': 'ia',
  'artistic-ai&apps': 'ia',
  'unclassified-ai-tips': 'ia',
  'Gpt-since-1stmayo23': 'ia',
  website_ai_aout2023: 'ia',
  'combo-seo-ia': 'ia',
  seo: 'general',
  'crypto-sbt&bots': 'general',
};

function titleFromFilename(file: string): string {
  return path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  if (!config.LOCAL_VIDEOS_DIR) {
    console.log('LOCAL_VIDEOS_DIR vide (voir .env) — rien a faire. Ce script ne sert qu\'a du test local.');
    return;
  }
  const root = config.LOCAL_VIDEOS_DIR;
  if (!fs.existsSync(root)) {
    console.log(`Dossier introuvable : ${root}`);
    return;
  }

  const folders = (await fs.promises.readdir(root, { withFileTypes: true })).filter((d) => d.isDirectory());
  console.log(`${folders.length} sous-dossier(s) trouve(s) dans ${root}, jusqu'a ${PER_FOLDER} video(s) chacun...\n`);

  let created = 0;
  let updated = 0;
  for (const folder of folders) {
    const dir = path.join(root, folder.name);
    const files = (await fs.promises.readdir(dir)).filter((f) => f.toLowerCase().endsWith('.mp4')).slice(0, PER_FOLDER);
    const topic = TOPIC_BY_FOLDER[folder.name] ?? 'general';

    for (const file of files) {
      const relPath = `${folder.name}/${file}`;
      const mediaUrl = `/local-videos/${relPath.split('/').map(encodeURIComponent).join('/')}`;
      const sourceId = relPath;
      const existing = await prisma.item.findFirst({ where: { source: SOURCE, sourceId } });
      const data = {
        kind: 'VIDEO' as const,
        source: SOURCE,
        sourceId,
        sourceLabel: `Conspix atelier (test local) · ${folder.name}`,
        title: titleFromFilename(file),
        permalink: mediaUrl, // pas de "page d'origine" pour un fichier local : pointe sur lui-meme
        mediaUrl,
        topic,
        lang: 'fr',
        publishedAt: existing?.publishedAt ?? new Date(),
        status: 'PUBLISHED' as const,
        storage: 'LINK' as const,
        reusable: false,
      };
      if (existing) {
        await prisma.item.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.item.create({ data });
        created++;
      }
    }
    if (files.length) console.log(`  [${topic}] ${folder.name} : ${files.length} video(s)`);
  }

  console.log(`\n${created} cree(s), ${updated} mise(s) a jour. Filtre "Videos" du feed pour les voir.`);
  console.log(`Pour retirer ce jeu de test : npm run dev:clear-local-videos`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
