// Liste les encarts pub REELLEMENT PAYES en attente de relecture. `npm run ads:review`.
// Un AdSlot passe en PENDING_REVIEW des la soumission (avant meme le paiement, cf. ads/routes.ts) : on ne
// montre ici que ceux dont le PaymentIntent lie est bien PAID, sinon la file se remplirait de paniers
// abandonnes jamais payes.
import { prisma } from '../lib/prisma';

async function main() {
  const pending = await prisma.adSlot.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: { advertiser: true },
    orderBy: { createdAt: 'asc' },
  });
  const paid = [];
  for (const slot of pending) {
    if (!slot.paymentIntentId) continue;
    const intent = await prisma.paymentIntent.findUnique({ where: { id: slot.paymentIntentId } });
    if (intent?.status === 'PAID') paid.push(slot);
  }
  if (!paid.length) {
    console.log('Aucun encart paye en attente de relecture.');
    return;
  }
  console.log(`${paid.length} encart(s) paye(s) en attente de relecture :\n`);
  for (const s of paid) {
    console.log(`[${s.position}] ${s.id} — ${s.priceCents / 100} EUR`);
    console.log(`  annonceur : ${s.advertiser.name} <${s.advertiser.email}>${s.advertiser.note ? ` — ${s.advertiser.note}` : ''}`);
    console.log(`  image     : ${s.imageUrl}`);
    console.log(`  lien      : ${s.linkUrl}`);
    console.log(`  tooltip   : ${s.tooltip}`);
    console.log(`  duree     : ${s.startDate.toISOString().slice(0, 10)} -> ${s.endDate.toISOString().slice(0, 10)}`);
    console.log(`  ${s.createdAt.toISOString()}\n`);
  }
  console.log('Approuver (met en ligne) : npm run ads:approve -- <id>');
  console.log('Refuser (rembourser manuellement ensuite via le dashboard Stripe) : npm run ads:reject -- <id>');
}

main().finally(() => prisma.$disconnect());
