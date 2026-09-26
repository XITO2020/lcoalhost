// Approuve une soumission Add Coal deja passee le filtre IA (PENDING_REVIEW) : cree le contenu public
// correspondant, au bon endroit du site (logique dans publish.ts, partagee avec la publication automatique
// optionnelle). `npm run coal:approve -- <id>`
import { prisma } from '../lib/prisma';
import { publishSubmission } from './publish';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run coal:approve -- <id>');
    process.exit(1);
  }
  const sub = await prisma.coalSubmission.findUnique({ where: { id } });
  if (!sub) {
    console.error('Soumission introuvable.');
    process.exit(1);
  }
  try {
    const resultItemId = await publishSubmission(sub);
    console.log(`Approuve -> ${resultItemId}${sub.aiKind ? ` (${sub.aiKind}/${sub.aiTopic}/${sub.aiLang})` : ''}`);
  } catch (err) {
    console.error((err as Error).message);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
