import type { Connector, RawItem } from '../types';
import { getText, sleep } from '../http';
import { parseFeed } from '../feed-parser';

// IA / vibecoding / dev (demande Naim 26/09 : "une trentaine d'articles recents sur l'IA, le vibecode et le dev,
// scrappes un peu partout"). 10 flux RSS/Atom publics, gratuits, sans cle, tous verifies 200 OK le 26/09/2026.
// Titre + lien vers la source uniquement (jamais de republication du contenu). `lang` pilote le filtre du feed :
// base anglaise toujours servie + extras de la langue de l'interface (fr / es).
const FEEDS: Array<{ id: string; label: string; url: string; hint: string; limit: number; lang: 'en' | 'fr' | 'es' }> = [
  { id: 'simonw', label: 'Simon Willison', url: 'https://simonwillison.net/atom/everything/', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'huggingface', label: 'Hugging Face', url: 'https://huggingface.co/blog/feed.xml', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'hn-vibe', label: 'HN · vibe coding', url: 'https://hnrss.org/newest?q=%22vibe+coding%22', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'hn-llm', label: 'HN · LLM', url: 'https://hnrss.org/newest?q=LLM&points=100', hint: 'ia', limit: 3, lang: 'en' },
  // #ai retire le 26/09 : trop de spam SEO ("How to Choose the Right Wax Injection Machine"). #vibecoding et #llm
  // verifies au parseur du site, dans le sujet.
  { id: 'devto-vibe', label: 'DEV · #vibecoding', url: 'https://dev.to/feed/tag/vibecoding', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'devto-llm', label: 'DEV · #llm', url: 'https://dev.to/feed/tag/llm', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'lobsters-vibe', label: 'Lobsters · vibecoding', url: 'https://lobste.rs/t/vibecoding.rss', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'latentspace', label: 'Latent Space', url: 'https://www.latent.space/feed', hint: 'ia', limit: 3, lang: 'en' },
  { id: 'nextink', label: 'Next', url: 'https://next.ink/feed/', hint: 'general', limit: 4, lang: 'fr' },
  { id: 'jdh', label: 'Journal du hacker', url: 'https://www.journalduhacker.net/rss', hint: 'general', limit: 4, lang: 'fr' },
  // Xataka retire le 26/09 : generaliste science/culture (Darwin, archeologie), hors sujet. Genbeta = logiciel/tech.
  { id: 'genbeta', label: 'Genbeta', url: 'https://www.genbeta.com/feedburner.xml', hint: 'general', limit: 3, lang: 'es' },
];

export const rssIa: Connector = {
  id: 'rss-ia',
  label: 'IA / vibecoding / dev (Simon Willison, Hugging Face, HN, DEV, Lobsters, Latent Space, Next, JdH, Genbeta)',
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
            source: 'rss-ia',
            sourceId: `${f.id}:${e.id}`.slice(0, 250),
            sourceLabel: f.label,
            title: e.title,
            permalink: e.link,
            author: e.author,
            topic: f.hint,
            score: 0,
            lang: f.lang,
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
