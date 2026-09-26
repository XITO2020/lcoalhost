// Rapport de la mesure pub anonyme (23/09, SPEC-ROADMAP.md Phase D.4) : affichages reels, clics et taux de clic
// par encart sur les N derniers jours (defaut 30). Usage : npm run promo:stats [-- 7]
import { prisma } from '../lib/prisma';

async function main() {
  const days = Math.max(1, Number(process.argv[2] ?? 30) || 30);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await prisma.promoStat.groupBy({
    by: ['key'],
    where: { day: { gte: since } },
    _sum: { views: true, clicks: true },
  });
  if (!rows.length) {
    console.log(`Aucune donnee sur les ${days} derniers jours.`);
    return;
  }

  // Encarts tiers : afficher le nom de l'annonceur plutot qu'un identifiant brut.
  const adIds = rows.filter((r) => r.key.startsWith('ad:')).map((r) => r.key.slice(3));
  const slots = await prisma.adSlot.findMany({ where: { id: { in: adIds } }, select: { id: true, advertiser: { select: { name: true } } } });
  const names = new Map(slots.map((s) => [`ad:${s.id}`, `annonce · ${s.advertiser.name}`]));

  console.log(`Mesure pub — ${days} derniers jours (depuis le ${since.toISOString().slice(0, 10)})\n`);
  const lines = rows
    .map((r) => {
      const views = r._sum.views ?? 0;
      const clicks = r._sum.clicks ?? 0;
      const label = names.get(r.key) ?? (r.key.startsWith('pub:') ? `maison · ${r.key.slice(4)}` : r.key);
      return { label, views, clicks, ctr: views ? (100 * clicks) / views : 0 };
    })
    .sort((a, b) => b.views - a.views);
  for (const l of lines) {
    console.log(`${l.label.padEnd(34)} ${String(l.views).padStart(7)} vues ${String(l.clicks).padStart(6)} clics   ${l.ctr.toFixed(2)} %`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
