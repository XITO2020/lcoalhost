// Ecrit des memes a la demande, hors cycle de scrape. `npm run agent:memes`.
import { prisma } from '../lib/prisma';
import { writeMemes } from './meme-writer';

writeMemes()
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
