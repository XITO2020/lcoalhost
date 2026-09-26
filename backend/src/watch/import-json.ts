// Import d'une liste d'URLs TikTok/Instagram depuis un JSON { "cle": "url", ... } (23/09, demande Naim) — meme
// traitement que watch:import (oEmbed officiel, upsert par platform+videoId), seule la source change. Les doublons
// d'URL sont ignores avant appel (upsert les fusionnerait de toute facon). Le fichier n'est jamais modifie.
// Usage : npm run watch:import-json [-- chemin/vers/fichier.json]
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { processLine, type LineResult } from './import-dump';

const DEFAULT_PATH = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'videos', 'videos.json');

async function main() {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_PATH;
  const data = JSON.parse(await fs.promises.readFile(file, 'utf8')) as Record<string, unknown>;
  const urls = [...new Set(Object.values(data).filter((v): v is string => typeof v === 'string').map((u) => u.trim()))];
  console.log(`${urls.length} URL(s) unique(s) dans ${file} (${Object.keys(data).length} entrees)...\n`);

  const failed: LineResult[] = [];
  for (const url of urls) {
    const result = await processLine(url);
    if (!result.ok) {
      failed.push(result);
      console.log(`  x ${result.raw} — ${result.reason}`);
    }
  }
  console.log(`\n${urls.length - failed.length} clip(s) publie(s), ${failed.length} echec(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
