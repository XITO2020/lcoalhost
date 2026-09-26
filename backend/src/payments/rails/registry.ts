// multi-payment-rails — registre des adapters. Lcoalhost ne cable QUE Stripe pour l'instant (demande Naim
// 22/09 : "meme clef stripe que TabascoCity"). Ajouter PayPal/Tezos/etc plus tard = copier l'adapter du skill
// (.claude/skills/multi-payment-rails/templates/express-ts/rails/) + l'ajouter a ALL ci-dessous, rien d'autre.

import type { RailAdapter, RailId } from './types';
import { stripeAdapter } from './stripe.adapter';

const ALL: RailAdapter[] = [stripeAdapter];

export function enabledRails(): RailAdapter[] {
  return ALL.filter((a) => a.enabled());
}

export function getRail(id: string): RailAdapter | null {
  const a = ALL.find((x) => x.id === id);
  return a && a.enabled() ? a : null;
}

export function logRailsStatus(): void {
  for (const a of ALL) console.log(`[payments] ${a.id.padEnd(12)} ${a.enabled() ? 'ON ' : 'off'} (${a.family})`);
}

export function publicRails(): Array<{ id: RailId; family: string }> {
  return enabledRails().map((a) => ({ id: a.id, family: a.family }));
}
