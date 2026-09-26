// "Big cleaning" par quota disque (Naim 22/09 : "le scrapping remplit tres vite, le stockage a une limite de
// 10 Go, ce qui n'est pas epingle est efface"). Portee volontairement etroite comme le reste du mode admin
// (admin/routes.ts) : seuls les Item MIRROR (memes+videos+images copies sur nos disques) comptent dans le
// quota — un Item en simple LINK ne pese presque rien sur disque (juste une ligne en base). Les TiktokClip ne
// sont jamais mirrores (oEmbed officiel, "jamais de video re-hebergee", cf. schema.prisma) : hors quota.
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { prisma } from '../lib/prisma';

const budgetBytes = () => config.STORAGE_BUDGET_MB * 1024 * 1024;

export async function usageBytes(): Promise<number> {
  const r = await prisma.item.aggregate({ where: { storage: 'MIRROR' }, _sum: { fileSize: true } });
  return r._sum.fileSize ?? 0;
}

export interface StorageStatus {
  usedBytes: number;
  budgetBytes: number;
  ratio: number;
  nearLimit: boolean;
}

export async function storageStatus(): Promise<StorageStatus> {
  const usedBytes = await usageBytes();
  const budget = budgetBytes();
  const ratio = budget > 0 ? usedBytes / budget : 0;
  return { usedBytes, budgetBytes: budget, ratio, nearLimit: ratio >= config.STORAGE_WARN_RATIO };
}

async function unlinkMirrored(localPath: string): Promise<void> {
  const abs = path.join(config.mirrorDir, ...localPath.split('/'));
  if (!abs.startsWith(config.mirrorDir)) return; // garde-fou, meme verif que admin/routes.ts
  await fs.promises.unlink(abs).catch(() => {});
}

/** Efface les Item MIRROR non epingles, du plus ancien mirrorage au plus recent, jusqu'a repasser sous le
 * quota (ou jusqu'a n'avoir plus que des items epingles, auquel cas ca s'arrete meme si toujours au-dessus). */
export async function bigCleaning(): Promise<{ before: number; after: number; deleted: number }> {
  const before = await usageBytes();
  const budget = budgetBytes();
  let used = before;
  let deleted = 0;

  while (used > budget) {
    const victim = await prisma.item.findFirst({
      where: { storage: 'MIRROR', pinned: false },
      orderBy: { mirroredAt: 'asc' },
      select: { id: true, localPath: true, fileSize: true, title: true },
    });
    if (!victim) break; // plus rien a effacer sans toucher un item epingle : on s'arrete la, meme au-dessus du quota

    if (victim.localPath) await unlinkMirrored(victim.localPath);
    await prisma.item.delete({ where: { id: victim.id } });
    used -= victim.fileSize ?? 0;
    deleted++;
    console.log(`[big-cleaning] efface (quota disque) : ${victim.title.slice(0, 60)}`);
  }

  return { before, after: used, deleted };
}
