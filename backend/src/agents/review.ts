// Liste les brouillons de l'agent en attente de relecture. `npm run agent:review`.
import { prisma } from '../lib/prisma';

async function main() {
  const drafts = await prisma.item.findMany({
    where: { source: 'agent', status: 'HIDDEN' },
    orderBy: { fetchedAt: 'desc' },
    select: { id: true, title: true, caption: true, topic: true, lang: true, fetchedAt: true },
  });
  if (!drafts.length) {
    console.log('Aucun brouillon en attente.');
    return;
  }
  console.log(`${drafts.length} brouillon(s) en attente de relecture :\n`);
  for (const d of drafts) {
    console.log(`[${d.lang}/${d.topic}] ${d.id}`);
    console.log(`  ${d.title}`);
    console.log(`  ${d.caption}`);
    console.log(`  ${d.fetchedAt.toISOString()}\n`);
  }
  console.log('Publier : npm run agent:publish -- <id>');
  console.log('Rejeter : npm run agent:reject -- <id>');
}

main().finally(() => prisma.$disconnect());
