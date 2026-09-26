import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Item } from '@prisma/client';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { safeFetch } from '../lib/safe-fetch';
import { getJson } from '../scraper/http';
import { mirrorDecision } from './policy';

const EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

const maxBytes = () => config.MIRROR_MAX_MB * 1024 * 1024;

interface PeerTubeVideo {
  files?: Array<{ fileUrl: string; size: number; resolution: { id: number } }>;
}

/** URL du fichier a copier, ou null si la source n'en expose pas (ex. PeerTube en HLS seul). */
async function resolveSourceFile(item: Item): Promise<{ url: string } | { skip: string }> {
  if (item.source === 'peertube') {
    const origin = new URL(item.permalink).origin;
    const uuid = item.sourceId;
    const v = await getJson<PeerTubeVideo>(`${origin}/api/v1/videos/${uuid}`);
    const files = (v.files ?? []).filter((f) => f.resolution.id <= 720 && f.size <= maxBytes());
    files.sort((a, b) => b.resolution.id - a.resolution.id);
    if (!files.length) return { skip: 'hls-only ou trop lourd: reste en lecteur integre' };
    return { url: files[0].fileUrl };
  }
  return item.mediaUrl ? { url: item.mediaUrl } : { skip: 'pas de mediaUrl' };
}

export async function mirrorItem(item: Item): Promise<{ ok: boolean; reason: string }> {
  const src = await resolveSourceFile(item);
  if ('skip' in src) return { ok: false, reason: src.skip };

  const res = await safeFetch(src.url);
  if (!res.ok || !res.body) return { ok: false, reason: `HTTP ${res.status}` };
  const ct = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const ext = EXT[ct];
  if (!ext) return { ok: false, reason: `type non copie: ${ct || 'inconnu'}` };
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > maxBytes()) return { ok: false, reason: 'fichier trop lourd' };

  const rel = path.posix.join(item.kind.toLowerCase(), `${item.id}${ext}`);
  const abs = path.join(config.mirrorDir, ...rel.split('/'));
  const tmp = `${abs}.part`;
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });

  // Hash calcule PENDANT le telechargement (zero requete supplementaire) : ecrit sur un .part pour ne rendre le
  // fichier definitif que si ce n'est pas un repost identique d'un meme deja copie sous un autre id.
  let seen = 0;
  const hash = crypto.createHash('sha256');
  const cap = new Transform({
    transform(chunk, _enc, cb) {
      seen += chunk.length;
      if (seen > maxBytes()) return cb(new Error('fichier trop lourd'));
      hash.update(chunk);
      cb(null, chunk);
    },
  });
  try {
    await pipeline(Readable.fromWeb(res.body as never), cap, fs.createWriteStream(tmp));
  } catch (err) {
    await fs.promises.rm(tmp, { force: true });
    return { ok: false, reason: (err as Error).message };
  }
  const contentHash = hash.digest('hex');

  const twin = await prisma.item.findFirst({
    where: { contentHash, storage: 'MIRROR', id: { not: item.id } },
    select: { id: true, title: true },
  });
  if (twin) {
    await fs.promises.rm(tmp, { force: true });
    await prisma.item.update({ where: { id: item.id }, data: { contentHash } });
    return { ok: false, reason: `doublon d'un item deja copie (${twin.title.slice(0, 40)})` };
  }

  await fs.promises.rename(tmp, abs);
  await prisma.item.update({
    where: { id: item.id },
    data: { storage: 'MIRROR', localPath: rel, mirroredAt: new Date(), contentHash, fileSize: seen },
  });
  return { ok: true, reason: `${rel} (${Math.round(seen / 1024)} Ko)` };
}

/** Passe apres chaque scrape : copie les items `reusable` que la communaute a valides. */
export async function promoteMirrors(): Promise<{ checked: number; mirrored: number; skipped: Record<string, number> }> {
  const candidates = await prisma.item.findMany({
    where: {
      reusable: true,
      storage: 'LINK',
      contentHash: null, // deja tente (copie ou doublon confirme) -> jamais retente
      kind: { not: 'ARTICLE' },
      status: 'PUBLISHED',
      OR: [{ reactionCount: { gte: 1 } }, { shelves: { some: {} } }],
    },
    include: { _count: { select: { shelves: true } } },
    take: 25,
  });
  const skipped: Record<string, number> = {};
  let mirrored = 0;
  for (const c of candidates) {
    const d = mirrorDecision(c, c.reactionCount + c._count.shelves);
    if (!d.mirror) {
      skipped[d.reason] = (skipped[d.reason] ?? 0) + 1;
      continue;
    }
    try {
      const r = await mirrorItem(c);
      if (r.ok) mirrored++;
      else skipped[r.reason] = (skipped[r.reason] ?? 0) + 1;
    } catch (err) {
      const k = (err as Error).message;
      skipped[k] = (skipped[k] ?? 0) + 1;
    }
  }
  return { checked: candidates.length, mirrored, skipped };
}
