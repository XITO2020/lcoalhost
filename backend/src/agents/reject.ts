// Supprime un brouillon de l'agent (mauvaise blague, hors-sujet...). `npm run agent:reject -- <id>`.
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run agent:reject -- <id>  (voir npm run agent:review)');
    process.exit(1);
  }
  const r = await prisma.item.deleteMany({ where: { id, source: 'agent', status: 'HIDDEN' } });
  if (!r.count) {
    console.error(`Introuvable, deja publie ou deja rejete : ${id}`);
    process.exit(1);
  }
  console.log(`Rejete : ${id}`);
}

main().finally(() => prisma.$disconnect());
