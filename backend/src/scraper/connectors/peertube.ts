import type { Connector, RawItem } from '../types';
import { getJson, sleep } from '../http';

// PeerTube via Sepia Search (Framasoft, francais) : videos libres, federees, avec LICENCE renseignee.
// Les videos sont integrees par le lecteur PeerTube (embedUrl) : rien n'est heberge chez nous par defaut.
const QUERIES: Array<[string, string]> = [
  ['programming humor', 'general'],
  ['developer memes', 'general'],
  ['linux', 'devops'],
  ['javascript', 'js'],
  ['python', 'python'],
  ['cybersecurity', 'cybersec'],
  ['ai safety', 'survie'],
];

interface Video {
  uuid: string;
  name: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  nsfw: boolean;
  isLive: boolean;
  views: number;
  likes: number;
  publishedAt: string;
  licence?: { id: number; label: string };
  channel?: { displayName: string };
  account?: { displayName: string; host: string };
}

export const peertube: Connector = {
  id: 'peertube',
  label: 'PeerTube (Sepia Search, videos libres + licence)',
  kinds: ['VIDEO'],
  requires: [],
  enabled: () => true,
  async run() {
    const since = new Date(Date.now() - 365 * 86400_000).toISOString();
    const out = new Map<string, RawItem>();
    const errors: string[] = [];
    for (const [q, hint] of QUERIES) {
      try {
        const url =
          'https://sepiasearch.org/api/v1/search/videos?count=12&sort=-trending&nsfw=false&durationMax=600' +
          `&startDate=${encodeURIComponent(since)}&search=${encodeURIComponent(q)}`;
        const data = await getJson<{ data: Video[] }>(url);
        for (const v of data.data) {
          if (v.nsfw || v.isLive || out.has(v.uuid)) continue;
          out.set(v.uuid, {
            kind: 'VIDEO',
            source: 'peertube',
            sourceId: v.uuid,
            sourceLabel: `PeerTube · ${v.account?.host ?? 'federe'}`,
            title: v.name,
            permalink: v.url,
            embedUrl: v.embedUrl,
            thumbUrl: v.thumbnailUrl ?? v.previewUrl,
            author: v.channel?.displayName ?? v.account?.displayName,
            topic: hint,
            score: v.likes * 5 + Math.round(v.views / 50),
            publishedAt: new Date(v.publishedAt),
            license: v.licence?.label,
          });
        }
      } catch (err) {
        errors.push(`${q}: ${(err as Error).message}`);
      }
      await sleep(300);
    }
    if (!out.size && errors.length) throw new Error(errors.join(' | '));
    return [...out.values()];
  },
};
