// multi-payment-rails — contrat commun a tous les adapters (copie de .claude/skills/multi-payment-rails,
// templates/express-ts/rails/types.ts, 22/09/2026). Ne depend d'aucune lib externe.

export type RailId = 'stripe' | 'paypal' | 'revolut' | 'tezos' | 'hyperliquid' | 'monero';
export type RailFamily = 'psp' | 'onchain';

export const RAIL_TO_PRISMA: Record<RailId, 'STRIPE' | 'PAYPAL' | 'REVOLUT' | 'TEZOS' | 'HYPERLIQUID' | 'MONERO'> = {
  stripe: 'STRIPE',
  paypal: 'PAYPAL',
  revolut: 'REVOLUT',
  tezos: 'TEZOS',
  hyperliquid: 'HYPERLIQUID',
  monero: 'MONERO',
};

/** Ce que le site demande a creer. */
export interface CreateIntentInput {
  intentId: string;
  siteId: string;
  orderRef: string;
  description: string;
  amountEur: number;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  successUrl: string;
  cancelUrl: string;
}

export interface PspIntentResult {
  family: 'psp';
  externalId: string;
  checkoutUrl: string;
}

export interface OnchainIntentResult {
  family: 'onchain';
  payCurrency: 'XTZ' | 'USDC' | 'XMR';
  payAmount: bigint;
  payDecimals: number;
  payToAddress: string;
  uniqueRef: string;
  rateEurPerUnit: number;
  uri: string;
  chainId?: number;
}

export type CreateIntentResult = PspIntentResult | OnchainIntentResult;

export interface PendingIntent {
  id: string;
  rail: RailId;
  payAmount: bigint;
  payToAddress: string;
  uniqueRef: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface NormalizedEvent {
  rail: RailId;
  type: 'paid' | 'seen' | 'expired' | 'failed' | 'refunded';
  intentId?: string;
  externalId?: string;
  txRef: string;
  paidAmount?: bigint;
  payerRef?: string;
  confirmations?: number;
  raw?: unknown;
}

export interface WebhookRequest {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
}

export interface RailAdapter {
  readonly id: RailId;
  readonly family: RailFamily;
  enabled(): boolean;
  createIntent(input: CreateIntentInput): Promise<CreateIntentResult>;
  handleWebhook?(req: WebhookRequest): Promise<NormalizedEvent[]>;
  poll?(pending: PendingIntent[]): Promise<NormalizedEvent[]>;
  refund?(txRef: string, amountCents?: number): Promise<{ ok: boolean; refundRef?: string }>;
}

export function envList(name: string, def = ''): string[] {
  return (process.env[name] ?? def).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}
export function railListed(id: RailId): boolean {
  return envList('PAYMENTS_ENABLED_RAILS').includes(id);
}
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`[payments] env manquante : ${name}`);
  return v;
}
export function intentTtlMs(): number {
  return Number(process.env.PAYMENTS_INTENT_TTL_MIN ?? 30) * 60_000;
}
