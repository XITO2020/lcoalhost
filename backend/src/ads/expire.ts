// Desactive automatiquement les encarts perimes (SPEC-ROADMAP.md Phase E, point 4 : "pas de pub perimee qui
// traine"). Exporte pour etre appele par le scheduler (index.ts, meme cadence que le scraper) ET utilisable
// seul en CLI : `npm run ads:expire`.
import { prisma } from '../lib/prisma';

export async function expireAds(): Promise<number> {
  const { count } = await prisma.adSlot.updateMany({
    where: { status: 'APPROVED', endDate: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  });
  if (count) console.log(`[ads] ${count} encart(s) perime(s) desactive(s)`);
  return count;
}

if (require.main === module) {
  expireAds()
    .then((n) => console.log(n ? `${n} encart(s) expire(s).` : 'Aucun encart a expirer.'))
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
