// Marque une idee Liquid Enhancement comme retenue (Naim l'a lue, ca ne cree/modifie RIEN sur le site tout
// seul — juste un marqueur de suivi, l'implementation reelle reste manuelle). `npm run liquid:approve -- <id>`
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run liquid:approve -- <id>');
    process.exit(1);
  }
  const sub = await prisma.liquidSubmission.findUnique({ where: { id } });
  if (!sub) {
    console.error('Soumission introuvable.');
    process.exit(1);
  }
  await prisma.liquidSubmission.update({ where: { id: sub.id }, data: { status: 'APPROVED', reviewedAt: new Date() } });
  console.log(`Retenue : ${sub.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
