import { config } from '../config';

async function get(url: string, accept: string, extra: Record<string, string> = {}): Promise<Response> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: { 'user-agent': config.userAgent, accept, ...extra },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${new URL(url).host}`);
  return res;
}

export async function getJson<T>(url: string, extra?: Record<string, string>): Promise<T> {
  return (await (await get(url, 'application/json', extra)).json()) as T;
}

export async function getText(url: string): Promise<string> {
  return (await get(url, 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*')).text();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
