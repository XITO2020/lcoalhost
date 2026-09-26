import type { Connector, RawItem } from '../types';
import { getJson, sleep } from '../http';

// Hacker News via l'API Algolia (societe francaise, publique, sans cle).
const QUERIES: Array<[string, string]> = [
  ['javascript', 'js'],
  ['python', 'python'],
  ['css', 'css'],
  ['LLM', 'ia'],
  ['security vulnerability', 'cybersec'],
  ['linux', 'devops'],
  ['AI safety', 'survie'],
];

interface Hit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string;
  points: number | null;
  created_at: string;
}

export const hackernews: Connector = {
  id: 'hackernews',
  label: 'Hacker News (Algolia)',
  kinds: ['ARTICLE'],
  requires: [],
  enabled: () => true,
  async run() {
    const since = Math.floor(Date.now() / 1000) - 3 * 86400;
    const out = new Map<string, RawItem>();
    for (const [q, hint] of QUERIES) {
      const url =
        'https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=20' +
        `&query=${encodeURIComponent(q)}` +
        `&numericFilters=${encodeURIComponent(`points>=40,created_at_i>${since}`)}`;
      const data = await getJson<{ hits: Hit[] }>(url);
      for (const h of data.hits) {
        if (!h.title || out.has(h.objectID)) continue;
        const thread = `https://news.ycombinator.com/item?id=${h.objectID}`;
        out.set(h.objectID, {
          kind: 'ARTICLE',
          source: 'hackernews',
          sourceId: h.objectID,
          sourceLabel: 'Hacker News',
          title: h.title,
          permalink: h.url ?? thread,
          discussionUrl: thread,
          author: h.author,
          topic: hint,
          score: h.points ?? 0,
          publishedAt: new Date(h.created_at),
        });
      }
      await sleep(250);
    }
    return [...out.values()];
  },
};
