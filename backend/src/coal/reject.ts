// Refuse une soumission Add Coal malgre le feu vert du filtre IA. `npm run coal:reject -- <id>`
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run coal:reject -- <id>');
    process.exit(1);
  }
  const sub = await prisma.coalSubmission.findUnique({ where: { id } });
  if (!sub) {
    console.error('Soumission introuvable.');
    process.exit(1);
  }
  if (sub.imagePath) {
    await fs.promises.unlink(path.join(config.coalUploadDir, sub.imagePath)).catch(() => {});
  }
  await prisma.coalSubmission.update({ where: { id: sub.id }, data: { status: 'REJECTED', reviewedAt: new Date() } });
  console.log(`Refuse : ${sub.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
