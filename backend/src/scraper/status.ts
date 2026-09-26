// Etat des connecteurs : quoi tourne, quoi manque, quoi a ete recupere. `npm run connectors` (ou connectors.bat).
import { prisma } from '../lib/prisma';
import { CONNECTORS } from './registry';

async function main() {
  const counts = await prisma.item.groupBy({ by: ['source'], _count: { _all: true } });
  const bySource = Object.fromEntries(counts.map((c) => [c.source, c._count._all]));
  const last = await prisma.scrapeRun.findFirst({ where: { finishedAt: { not: null } }, orderBy: { startedAt: 'desc' } });
  const report = (last?.report ?? {}) as Record<string, { error?: string; created?: number; fetched?: number }>;

  console.log('\nCONNECTEURS LCOALHOST\n' + '-'.repeat(78));
  for (const c of CONNECTORS) {
    const on = c.enabled();
    const r = report[c.id];
    const state = on ? (r?.error ? 'ERREUR' : 'ON    ') : 'OFF   ';
    console.log(`${state} ${c.id.padEnd(11)} ${c.kinds.join('+').padEnd(13)} en base: ${String(bySource[c.id] ?? 0).padStart(4)}   ${c.label}`);
    if (!on) console.log(`         manque: ${c.requires.join(', ')}\n         ${c.setupHint ?? ''}`);
    if (r?.error) console.log(`         derniere erreur: ${r.error}`);
  }
  const m = (last?.report as Record<string, unknown> | null | undefined)?._mirror;
  console.log('-'.repeat(78));
  console.log(last ? `Dernier cycle: ${last.startedAt.toISOString()}` : 'Aucun cycle encore execute.');
  if (m) console.log('Copies disque (dernier cycle):', JSON.stringify(m));
  const storage = await prisma.item.groupBy({ by: ['storage', 'reusable'], _count: { _all: true } });
  console.log('Lien / copie:', storage.map((s) => `${s.storage}${s.reusable ? '(reusable)' : ''}=${s._count._all}`).join('  '));
}

main().finally(() => prisma.$disconnect());
