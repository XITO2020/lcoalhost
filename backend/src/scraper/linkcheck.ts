import { prisma } from '../lib/prisma';
import { safeFetch } from '../lib/safe-fetch';
import { sleep } from './http';

const RECHECK_MS = 7 * 86400_000;

/**
 * Controle des liens : seuls 404/410 comptent comme "mort" (un 403 Cloudflare ou un timeout ne prouvent rien).
 * Un item LINK mort est masque ; un item MIRROR n'est jamais controle (il vit sur nos disques).
 */
export async function checkLinks(limit = 60): Promise<{ checked: number; dead: number }> {
  const items = await prisma.item.findMany({
    where: {
      status: 'PUBLISHED',
      storage: 'LINK',
      source: { not: 'lcoalhost' },
      OR: [{ linkCheckedAt: null }, { linkCheckedAt: { lt: new Date(Date.now() - RECHECK_MS) } }],
    },
    orderBy: { linkCheckedAt: { sort: 'asc', nulls: 'first' } },
    take: limit,
  });
  let dead = 0;
  for (const it of items) {
    const url = it.mediaUrl ?? it.permalink;
    let linkStatus: 'OK' | 'DEAD' | 'UNKNOWN' = 'UNKNOWN';
    try {
      let res = await safeFetch(url, { method: 'HEAD', timeoutMs: 10000 });
      if (res.status === 405 || res.status === 501) res = await safeFetch(url, { timeoutMs: 10000, headers: { range: 'bytes=0-0' } });
      if (res.status === 404 || res.status === 410) linkStatus = 'DEAD';
      else if (res.ok || res.status === 206) linkStatus = 'OK';
    } catch {
      /* injoignable maintenant : on ne conclut rien, on retentera */
    }
    if (linkStatus === 'DEAD') dead++;
    await prisma.item.update({
      where: { id: it.id },
      data: { linkStatus, linkCheckedAt: new Date(), ...(linkStatus === 'DEAD' ? { status: 'HIDDEN' } : {}) },
    });
    await sleep(120);
  }
  return { checked: items.length, dead };
}
