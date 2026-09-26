import type { Connector, RawItem } from '../types';
import { getJson, sleep } from '../http';

// DEV.to (Forem, open source) — API publique sans cle. Couvre aussi le contenu "debutant/intermediaire".
const TAGS: Array<[string, string]> = [
  ['javascript', 'js'],
  ['python', 'python'],
  ['css', 'css'],
  ['ai', 'ia'],
  ['security', 'cybersec'],
  ['devops', 'devops'],
  ['linux', 'devops'],
];

interface Article {
  id: number;
  title: string;
  url: string;
  cover_image: string | null;
  social_image: string | null;
  public_reactions_count: number;
  published_at: string;
  user: { name: string };
}

export const devto: Connector = {
  id: 'devto',
  label: 'DEV.to (Forem)',
  kinds: ['ARTICLE'],
  requires: [],
  enabled: () => true,
  async run() {
    const out = new Map<number, RawItem>();
    for (const [tag, hint] of TAGS) {
      const list = await getJson<Article[]>(`https://dev.to/api/articles?per_page=20&top=7&tag=${tag}`);
      for (const a of list) {
        if (out.has(a.id)) continue;
        out.set(a.id, {
          kind: 'ARTICLE',
          source: 'devto',
          sourceId: String(a.id),
          sourceLabel: 'DEV',
          title: a.title,
          permalink: a.url,
          thumbUrl: a.cover_image ?? a.social_image ?? undefined,
          author: a.user?.name,
          topic: hint,
          score: a.public_reactions_count,
          publishedAt: new Date(a.published_at),
        });
      }
      await sleep(250);
    }
    return [...out.values()];
  },
};
