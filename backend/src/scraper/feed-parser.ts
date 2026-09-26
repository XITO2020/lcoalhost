// Parseur RSS 2.0 / Atom minimal (zero dependance) : suffisant pour titre, lien, date, auteur, id.

export interface FeedEntry {
  id: string;
  title: string;
  link: string;
  date: Date | null;
  author?: string;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(block: string, name: string): string | undefined {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decode(m[1]) : undefined;
}

function linkOf(block: string): string {
  // Atom : <link rel="alternate" href="..."/> (ou premier <link href>)
  const alt = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
    ?? block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i)
    ?? block.match(/<link\b[^>]*href=["']([^"']+)["']/i);
  if (alt) return decode(alt[1]);
  return tag(block, 'link') ?? '';
}

export function parseFeed(xml: string, limit = 20): FeedEntry[] {
  const out: FeedEntry[] = [];
  const re = /<(item|entry)[\s>][\s\S]*?<\/\1>/gi;
  for (const m of xml.matchAll(re)) {
    const b = m[0];
    const link = linkOf(b);
    const title = tag(b, 'title');
    if (!link || !title) continue;
    const rawDate = tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated') ?? tag(b, 'dc:date');
    const d = rawDate ? new Date(rawDate) : null;
    const author = tag(b, 'dc:creator') ?? (b.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/i)?.[1] ? decode(b.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/i)![1]) : undefined);
    out.push({
      id: tag(b, 'guid') ?? tag(b, 'id') ?? link,
      title,
      link,
      date: d && !Number.isNaN(d.getTime()) ? d : null,
      author,
    });
    if (out.length >= limit) break;
  }
  return out;
}
