// Approuve un encart pub (le met REELLEMENT en ligne — different de liquid:approve qui ne fait que marquer
// une idee retenue). `npm run ads:approve -- <id>`
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run ads:approve -- <id>');
    process.exit(1);
  }
  const slot = await prisma.adSlot.findUnique({ where: { id } });
  if (!slot) {
    console.error('Encart introuvable.');
    process.exit(1);
  }
  await prisma.adSlot.update({ where: { id: slot.id }, data: { status: 'APPROVED', reviewedAt: new Date() } });
  console.log(`En ligne : ${slot.id} (${slot.position}), du ${slot.startDate.toISOString().slice(0, 10)} au ${slot.endDate.toISOString().slice(0, 10)}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
