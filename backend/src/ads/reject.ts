// Refuse un encart pub deja paye — le remboursement RESTE MANUEL (dashboard Stripe), aucune route
// automatisee (meme motif deja assume pour les Hacks : "PAS D'ADMIN/AUTH... pas de route de remboursement
// automatisee"). `npm run ads:reject -- <id>`
import { prisma } from '../lib/prisma';

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: npm run ads:reject -- <id>');
    process.exit(1);
  }
  const slot = await prisma.adSlot.findUnique({ where: { id } });
  if (!slot) {
    console.error('Encart introuvable.');
    process.exit(1);
  }
  await prisma.adSlot.update({ where: { id: slot.id }, data: { status: 'REJECTED', reviewedAt: new Date() } });
  console.log(`Refuse : ${slot.id}. RAPPEL : rembourser ${slot.priceCents / 100} EUR a la main sur le dashboard Stripe (intent ${slot.paymentIntentId ?? 'inconnu'}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
