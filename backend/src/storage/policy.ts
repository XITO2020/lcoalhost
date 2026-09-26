import type { Item } from '@prisma/client';
import type { RawItem } from '../scraper/types';
import { config } from '../config';
import { isPermissiveLicense } from './license';

/**
 * POLITIQUE LIEN / COPIE (gravee ici, une seule source de verite)
 *
 *   1. Le DROIT decide si on peut copier ; la facilite a retrouver ne decide que de savoir si ca vaut le coup.
 *   2. Tout contenu tiers entre en LINK : URL + metadonnees + credit. Jamais de copie a l'ingestion.
 *   3. Un item devient `reusable` (copiable + telechargeable) UNIQUEMENT si sa licence est permissive
 *      (CC0 / domaine public / CC BY / CC BY-SA, usage commercial autorise) ou s'il est maison.
 *   4. Un item `reusable` est COPIE sur nos disques (MIRROR) seulement quand la communaute l'a valide :
 *      reactions + classements >= MIRROR_MIN_ENGAGEMENT. En dessous : simple URL.
 *   5. Les articles ne sont jamais copies (lien + titre + credit).
 *   6. Les liens LINK morts (404/410) sont masques par le controle de liens ; un MIRROR ne meurt jamais.
 */

export function initialPolicy(r: RawItem): { reusable: boolean } {
  return { reusable: r.kind !== 'ARTICLE' && isPermissiveLicense(r.license) };
}

export interface MirrorDecision {
  mirror: boolean;
  reason: string;
}

export function mirrorDecision(
  item: Pick<Item, 'kind' | 'reusable' | 'storage' | 'linkStatus' | 'status'>,
  engagement: number,
): MirrorDecision {
  if (item.kind === 'ARTICLE') return { mirror: false, reason: 'article: lien uniquement' };
  if (item.storage === 'MIRROR') return { mirror: false, reason: 'deja copie' };
  if (!item.reusable) return { mirror: false, reason: 'licence non permissive: simple URL' };
  if (item.status !== 'PUBLISHED' || item.linkStatus === 'DEAD') return { mirror: false, reason: 'source indisponible' };
  if (engagement < config.MIRROR_MIN_ENGAGEMENT) {
    return { mirror: false, reason: `engagement ${engagement} < ${config.MIRROR_MIN_ENGAGEMENT}` };
  }
  return { mirror: true, reason: `reusable + engagement ${engagement}` };
}
