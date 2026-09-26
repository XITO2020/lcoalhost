import type { Item, ReactionType } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const REACTION_TYPES: ReactionType[] = ['LOL', 'JERRY', 'UTILE', 'ALERTE', 'LIKE', 'DISLIKE'];

export interface ItemDto {
  id: string;
  kind: Item['kind'];
  source: string;
  sourceLabel: string;
  title: string;
  caption: string | null;
  permalink: string;
  discussionUrl: string | null;
  mediaUrl: string | null; // URL a afficher : copie locale si MIRROR, sinon URL source
  embedUrl: string | null;
  thumbUrl: string | null;
  author: string | null;
  topic: string;
  score: number;
  publishedAt: string;
  license: string | null;
  reusable: boolean; // licence libre ou contenu maison (on a le droit)
  downloadable: boolean; // reusable ET un fichier existe reellement chez nous ou a la source directe
  storage: Item['storage'];
  pinned: boolean; // protege du "big cleaning" par quota disque (admin uniquement)
  sponsored: boolean; // "pub maison" postee par l'admin (23/09) — etiquette "Partenaire" affichee, jamais masquee
  downloadCount: number;
  reactions: Record<ReactionType, number>;
  mine: ReactionType[];
  shelved: boolean;
}

/** Ajoute compteurs de reactions, reactions du visiteur et etat du classeur en 3 requetes pour toute la page. */
export async function toDtos(items: Item[], visitorId: string): Promise<ItemDto[]> {
  if (!items.length) return [];
  const ids = items.map((i) => i.id);
  const [counts, mine, shelved] = await Promise.all([
    prisma.reaction.groupBy({ by: ['itemId', 'type'], where: { itemId: { in: ids } }, _count: { _all: true } }),
    prisma.reaction.findMany({ where: { itemId: { in: ids }, visitorId }, select: { itemId: true, type: true } }),
    prisma.shelf.findMany({ where: { itemId: { in: ids }, visitorId }, select: { itemId: true } }),
  ]);
  const shelvedSet = new Set(shelved.map((s) => s.itemId));

  return items.map((i) => {
    const reactions = Object.fromEntries(REACTION_TYPES.map((t) => [t, 0])) as Record<ReactionType, number>;
    for (const c of counts) if (c.itemId === i.id) reactions[c.type] = c._count._all;
    const local = i.storage === 'MIRROR' && i.localPath ? `/mirror/${i.localPath}` : null;
    return {
      id: i.id,
      kind: i.kind,
      source: i.source,
      sourceLabel: i.sourceLabel,
      title: i.title,
      caption: i.caption,
      permalink: i.permalink,
      discussionUrl: i.discussionUrl,
      mediaUrl: local ?? i.mediaUrl,
      embedUrl: i.embedUrl,
      thumbUrl: i.thumbUrl,
      author: i.author,
      topic: i.topic,
      score: i.score,
      publishedAt: i.publishedAt.toISOString(),
      license: i.license,
      reusable: i.reusable,
      // Une video PeerTube en lecteur integre n'a pas de fichier direct : elle renvoie vers sa source tant qu'elle n'est pas copiee.
      downloadable: i.reusable && (Boolean(local) || Boolean(i.mediaUrl) || (i.kind === 'MEME' && i.source === 'lcoalhost')),
      storage: i.storage,
      pinned: i.pinned,
      sponsored: i.sponsored,
      downloadCount: i.downloadCount,
      reactions,
      mine: mine.filter((m) => m.itemId === i.id).map((m) => m.type),
      shelved: shelvedSet.has(i.id),
    };
  });
}
