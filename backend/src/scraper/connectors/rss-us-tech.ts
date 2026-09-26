import type { Connector, RawItem } from '../types';
import { getText, sleep } from '../http';
import { parseFeed } from '../feed-parser';

// Sources americaines (demande Naim 22/09 : "scraping particulierement americain", sources US supplementaires).
// 4 flux RSS officiels, gratuits, sans cle. Verifies le 22/09/2026 (200 OK, entrees datees correctement).
const FEEDS: Array<{ id: string; label: string; url: string; hint: string; limit: number }> = [
  { id: 'techcrunch', label: 'TechCrunch', url: 'https://techcrunch.com/feed/', hint: 'general', limit: 10 },
  { id: 'theverge', label: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', hint: 'general', limit: 10 },
  { id: 'arstechnica', label: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', hint: 'general', limit: 10 },
  { id: 'wired', label: 'Wired', url: 'https://www.wired.com/feed/rss', hint: 'general', limit: 10 },
];

export const rssUsTech: Connector = {
  id: 'rss-us',
  label: 'Presse tech US (TechCrunch, The Verge, Ars Technica, Wired)',
  kinds: ['ARTICLE'],
  requires: [],
  enabled: () => true,
  async run() {
    const out: RawItem[] = [];
    const errors: string[] = [];
    for (const f of FEEDS) {
      try {
        const entries = parseFeed(await getText(f.url), f.limit);
        for (const e of entries) {
          out.push({
            kind: 'ARTICLE',
            source: 'rss-us',
            sourceId: `${f.id}:${e.id}`.slice(0, 250),
            sourceLabel: f.label,
            title: e.title,
            permalink: e.link,
            author: e.author,
            topic: f.hint,
            score: 0,
            publishedAt: e.date ?? new Date(),
          });
        }
      } catch (err) {
        errors.push(`${f.id}: ${(err as Error).message}`);
      }
      await sleep(250);
    }
    if (!out.length && errors.length) throw new Error(errors.join(' | '));
    return out;
  },
};
