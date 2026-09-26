// Refuse une idee Liquid Enhancement. `npm run liquid:reject -- <id>`
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run liquid:reject -- <id>');
    process.exit(1);
  }
  const sub = await prisma.liquidSubmission.findUnique({ where: { id } });
  if (!sub) {
    console.error('Soumission introuvable.');
    process.exit(1);
  }
  await prisma.liquidSubmission.update({ where: { id: sub.id }, data: { status: 'REJECTED', reviewedAt: new Date() } });
  console.log(`Refuse : ${sub.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
