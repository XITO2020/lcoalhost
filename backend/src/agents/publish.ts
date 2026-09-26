// Publie un brouillon de l'agent apres relecture/edition. `npm run agent:publish -- <id>`.
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run agent:publish -- <id>  (voir npm run agent:review)');
    process.exit(1);
  }
  const r = await prisma.item.updateMany({ where: { id, source: 'agent', status: 'HIDDEN' }, data: { status: 'PUBLISHED' } });
  if (!r.count) {
    console.error(`Introuvable ou deja publie : ${id}`);
    process.exit(1);
  }
  console.log(`Publie : ${id}`);
}

main().finally(() => prisma.$disconnect());
