import type { Prisma } from '@prisma/client';
import { writeMemes } from '../agents/meme-writer';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { bigCleaning } from '../storage/budget';
import { promoteMirrors } from '../storage/mirror';
import { initialPolicy } from '../storage/policy';
import { checkLinks } from './linkcheck';
import { CONNECTORS } from './registry';
import { classify } from './topics';
import type { RawItem } from './types';

type Report = Record<string, unknown>;
let running = false;

async function persist(raws: RawItem[]): Promise<{ fetched: number; created: number; updated: number }> {
  const bySource = new Map<string, RawItem[]>();
  for (const r of raws) bySource.set(r.source, [...(bySource.get(r.source) ?? []), r]);

  let created = 0;
  let updated = 0;
  for (const [source, list] of bySource) {
    const existing = new Set(
      (await prisma.item.findMany({ where: { source, sourceId: { in: list.map((r) => r.sourceId) } }, select: { sourceId: true } })).map(
        (e) => e.sourceId,
      ),
    );
    const data = (r: RawItem): Prisma.ItemCreateManyInput => ({
      kind: r.kind,
      source: r.source,
      sourceId: r.sourceId,
      sourceLabel: r.sourceLabel,
      title: r.title.slice(0, 500),
      permalink: r.permalink,
      discussionUrl: r.discussionUrl,
      mediaUrl: r.mediaUrl,
      embedUrl: r.embedUrl,
      thumbUrl: r.thumbUrl,
      author: r.author,
      topic: classify(`${r.title} ${(r.tags ?? []).join(' ')}`, r.topic),
      // Sources historiques (HN, DEV, Lobsters, Lemmy, PeerTube, RSS, Reddit) anglophones -> 'en' par defaut ;
      // un connecteur FR (rss-fr : Korben, 23/09) declare lang='fr'. Seuls les MEMES sont filtres par langue
      // cote feed : un article FR s'affiche pour tous les visiteurs.
      lang: r.lang ?? 'en',
      score: r.score,
      license: r.license,
      reusable: initialPolicy(r).reusable,
      publishedAt: r.publishedAt,
    });
    const fresh = list.filter((r) => !existing.has(r.sourceId));
    if (fresh.length) created += (await prisma.item.createMany({ data: fresh.map(data), skipDuplicates: true })).count;
    // Les items deja connus : seuls les champs "vivants" changent. Jamais status/storage/localPath/reactions.
    for (const r of list.filter((x) => existing.has(x.sourceId))) {
      const d = data(r);
      await prisma.item.update({
        where: { source_sourceId: { source, sourceId: r.sourceId } },
        data: { title: d.title, score: d.score, thumbUrl: d.thumbUrl, mediaUrl: d.mediaUrl, embedUrl: d.embedUrl, license: d.license, reusable: d.reusable, topic: d.topic, fetchedAt: new Date() },
      });
      updated++;
    }
  }
  return { fetched: raws.length, created, updated };
}

// Purge sur "derniere fois vu" (fetchedAt) et non sur la date de publication : un contenu evergreen que les
// sources continuent de remonter reste ; un contenu que plus personne ne remonte, sans reaction ni classeur, part.
async function prune(): Promise<number> {
  const cutoff = new Date(Date.now() - config.RETENTION_DAYS * 86400_000);
  const { count } = await prisma.item.deleteMany({
    where: { source: { not: 'lcoalhost' }, storage: 'LINK', fetchedAt: { lt: cutoff }, reactionCount: 0, shelves: { none: {} } },
  });
  return count;
}

/** Un cycle complet : connecteurs -> upsert -> promotion MIRROR -> controle des liens -> purge -> big cleaning. */
export async function runScrape(): Promise<Report> {
  if (running) return { skipped: 'un cycle est deja en cours' };
  running = true;
  const run = await prisma.scrapeRun.create({ data: {} });
  const report: Report = {};
  try {
    for (const c of CONNECTORS) {
      if (!c.enabled()) {
        report[c.id] = { enabled: false };
        continue;
      }
      try {
        report[c.id] = await persist(await c.run());
      } catch (err) {
        report[c.id] = { error: (err as Error).message };
      }
    }
    // Agent memes : ecrit APRES les connecteurs pour avoir de l'inspiration fraiche. Ne bloque jamais le cycle.
    report._agent = await writeMemes().catch((e) => ({ error: (e as Error).message }));
    report._mirror = await promoteMirrors().catch((e) => ({ error: (e as Error).message }));
    report._links = await checkLinks().catch((e) => ({ error: (e as Error).message }));
    report._pruned = await prune().catch((e) => ({ error: (e as Error).message }));
    report._bigCleaning = await bigCleaning().catch((e) => ({ error: (e as Error).message }));
  } finally {
    await prisma.scrapeRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), report: report as Prisma.InputJsonValue } });
    running = false;
  }
  return report;
}

export function startScheduler(): void {
  // Expiration des encarts pub (23/09, Phase E) : meme cadence que le scraper, pas besoin d'un 2e timer —
  // tourne INDEPENDAMMENT de SCRAPE_ENABLED (desactiver le scraping ne doit pas laisser des pubs perimees
  // trainer indefiniment).
  const expireCycle = () => import('../ads/expire').then((m) => m.expireAds()).catch((e) => console.error('[ads] expiration en echec', e));
  setTimeout(expireCycle, 5000);
  setInterval(expireCycle, config.SCRAPE_INTERVAL_MIN * 60_000);

  if (!config.SCRAPE_ENABLED) {
    console.log('[scraper] SCRAPE_ENABLED=false : aucun cycle automatique');
    return;
  }
  const cycle = () =>
    runScrape()
      .then((r) => console.log('[scraper] cycle termine', JSON.stringify(r)))
      .catch((e) => console.error('[scraper] cycle en echec', e));
  setTimeout(cycle, 5000);
  setInterval(cycle, config.SCRAPE_INTERVAL_MIN * 60_000);
  console.log(`[scraper] planifie toutes les ${config.SCRAPE_INTERVAL_MIN} min`);
}
