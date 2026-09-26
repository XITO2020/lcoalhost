// Liste les soumissions Liquid Enhancement en attente de relecture. `npm run liquid:review`.
import { prisma } from '../lib/prisma';

async function main() {
  const pending = await prisma.liquidSubmission.findMany({
    where: { status: 'PENDING_REVIEW' },
    orderBy: { createdAt: 'asc' },
  });
  if (!pending.length) {
    console.log('Aucune soumission en attente.');
    return;
  }
  console.log(`${pending.length} soumission(s) en attente de relecture :\n`);
  for (const s of pending) {
    console.log(`[${s.area}] ${s.id}`);
    console.log(`  brut     : ${s.rawInput}`);
    console.log(`  liquide  : ${s.enhanced}`);
    console.log(`  ${s.createdAt.toISOString()}\n`);
  }
  console.log('Approuver (juste marquer, rien n\'est applique automatiquement) : npm run liquid:approve -- <id>');
  console.log('Refuser : npm run liquid:reject -- <id>');
}

main().finally(() => prisma.$disconnect());
