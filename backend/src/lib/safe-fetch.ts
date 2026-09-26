import dns from 'node:dns/promises';
import net from 'node:net';
import { config } from '../config';

const PRIVATE_V4: Array<[number, number]> = [
  [0x0a000000, 0xff000000], // 10.0.0.0/8
  [0x7f000000, 0xff000000], // 127.0.0.0/8
  [0xa9fe0000, 0xffff0000], // 169.254.0.0/16
  [0xac100000, 0xfff00000], // 172.16.0.0/12
  [0xc0a80000, 0xffff0000], // 192.168.0.0/16
  [0x64400000, 0xffc00000], // 100.64.0.0/10 (CGNAT)
  [0x00000000, 0xff000000], // 0.0.0.0/8
];

function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = ip.split('.').reduce((a, b) => (a << 8) + Number(b), 0) >>> 0;
    return PRIVATE_V4.some(([base, mask]) => (n & mask) >>> 0 === base);
  }
  const v = ip.toLowerCase();
  if (v === '::1' || v === '::') return true;
  if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true;
  if (v.startsWith('::ffff:')) return isPrivateAddress(v.slice(7));
  return false;
}

/** Refuse tout ce qui n'est pas du https public. (Reste un risque de rebinding DNS residuel : accepte.) */
export async function assertPublicHttps(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== 'https:') throw new Error(`protocole refuse: ${u.protocol}`);
  if (net.isIP(u.hostname)) {
    if (isPrivateAddress(u.hostname)) throw new Error('adresse privee refusee');
    return u;
  }
  const addrs = await dns.lookup(u.hostname, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw new Error('hote prive ou introuvable');
  return u;
}

export interface SafeFetchOptions {
  method?: 'GET' | 'HEAD';
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/** fetch qui valide chaque saut de redirection (3 max). */
export async function safeFetch(raw: string, opts: SafeFetchOptions = {}): Promise<Response> {
  let url = raw;
  for (let hop = 0; hop <= 3; hop++) {
    const u = await assertPublicHttps(url);
    const res = await fetch(u, {
      method: opts.method ?? 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(opts.timeoutMs ?? 20000),
      headers: { 'user-agent': config.userAgent, ...(opts.headers ?? {}) },
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, u).toString();
      continue;
    }
    return res;
  }
  throw new Error('trop de redirections');
}
