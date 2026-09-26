// Add Coal — inspection d'un lien soumis (23/09, demande Naim : "des URLs d'articles, de videos et de memes,
// verifiees par Qwen qui les classe ou il faut"). Lit la page (anti-SSRF : safeFetch, https public uniquement) pour
// donner a Qwen du CONCRET (titre, description, type Open Graph, image, video) et prepare ce qu'il faut pour
// publier au bon endroit : image directe (meme), lecteur integrable ou fichier video (videos), vignette (articles).
// Contenu tiers = lien + credit, jamais copie (storage/policy.ts) : on ne garde que des URLs.
import { safeFetch } from '../lib/safe-fetch';

export type CoalTarget = 'ARTICLE' | 'VIDEO' | 'MEME';

export interface LinkMeta {
  url: string;
  host: string;
  contentType: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  ogType: string | null;
  htmlLang: string | null;
  thumbUrl: string | null; // og:image
  mediaUrl: string | null; // image directe (meme) ou fichier video direct
  embedUrl: string | null; // lecteur integrable (YouTube nocookie, Vimeo, PeerTube)
  tiktokVideoId: string | null;
  /** Ce que l'URL permet techniquement (Qwen choisit parmi ces sections, jamais au-dela). */
  possible: CoalTarget[];
  /** Devinette deterministe, sert de repli si Qwen est indisponible. */
  guess: CoalTarget;
}

const MAX_HTML = 512 * 1024;

// LECTURE DE L'EN-TETE EN TEMPS LINEAIRE (audit securite 24/09, faille BLOQUANTE corrigee) : l'ancienne extraction
// par grosses regex (`<meta[^>]+...[^>]*...`) sur 512 Ko de HTML fourni par le soumetteur avait un cout cubique —
// 44 Ko de balises <meta non fermees = 95 s de calcul, API entiere gelee (Node mono-thread). Desormais : on ne lit
// que le <head>, balise par balise avec indexOf, chaque balise plafonnee a 2 Ko, et la regex d'attributs ne tourne
// que sur ces petits morceaux.
const MAX_TAG = 2048;
type Attrs = Record<string, string>;

function attrs(tag: string): Attrs {
  const out: Attrs = {};
  const re = /([a-zA-Z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  for (let m = re.exec(tag); m; m = re.exec(tag)) out[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

interface Head {
  metas: Attrs[];
  title: string | null;
  lang: string | null;
}

export function parseHead(html: string): Head {
  const lower = html.toLowerCase();
  const headEnd = lower.indexOf('</head');
  const end = headEnd === -1 ? html.length : headEnd;
  const metas: Attrs[] = [];
  let i = lower.indexOf('<meta');
  while (i !== -1 && i < end && metas.length < 300) {
    const close = lower.indexOf('>', i);
    if (close === -1) break;
    if (close - i <= MAX_TAG) metas.push(attrs(html.slice(i + 5, close)));
    i = lower.indexOf('<meta', close + 1);
  }
  let title: string | null = null;
  const t0 = lower.indexOf('<title');
  if (t0 !== -1 && t0 < end) {
    const g = lower.indexOf('>', t0);
    const t1 = g === -1 ? -1 : lower.indexOf('</title', g);
    if (t1 !== -1 && t1 - g <= 1000) title = decode(html.slice(g + 1, t1)).trim() || null;
  }
  let lang: string | null = null;
  const h0 = lower.indexOf('<html');
  if (h0 !== -1) {
    const g = lower.indexOf('>', h0);
    if (g !== -1 && g - h0 <= MAX_TAG) lang = attrs(html.slice(h0 + 5, g)).lang?.slice(0, 10).toLowerCase() ?? null;
  }
  return { metas, title, lang };
}

export function meta(head: Head, key: string): string | null {
  const m = head.metas.find((a) => (a.property ?? a.name ?? '').toLowerCase() === key && a.content);
  return m ? decode(m.content).trim().slice(0, 500) || null : null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

const httpsOnly = (u: string | null, base: string): string | null => {
  if (!u) return null;
  try {
    const abs = new URL(u, base);
    return abs.protocol === 'https:' ? abs.toString() : null;
  } catch {
    return null;
  }
};

/** Lecteurs integrables connus, deduits de l'URL seule (pas besoin de la page). */
function embedFromUrl(u: URL): string | null {
  const h = u.hostname.replace(/^www\./, '');
  if (h === 'youtube.com' || h === 'm.youtube.com') {
    const id = u.searchParams.get('v') ?? /^\/shorts\/([\w-]{6,})/.exec(u.pathname)?.[1];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (h === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (h === 'vimeo.com') {
    const id = /^\/(\d+)/.exec(u.pathname)?.[1];
    if (id) return `https://player.vimeo.com/video/${id}`;
  }
  // PeerTube (instances libres) : /w/<id> ou /videos/watch/<uuid> -> /videos/embed/<id>
  const pt = /^\/(?:w|videos\/watch)\/([\w-]{8,})/.exec(u.pathname)?.[1];
  if (pt) return `${u.origin}/videos/embed/${pt}`;
  return null;
}

export async function inspectLink(raw: string, depth = 0): Promise<LinkMeta> {
  const res = await safeFetch(raw, { timeoutMs: 15000, headers: { accept: 'text/html,image/*,video/*;q=0.9,*/*;q=0.5' } });
  const finalUrl = res.url || raw;
  const u = new URL(finalUrl);
  const host = u.hostname.replace(/^www\./, '');
  const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  const out: LinkMeta = {
    url: finalUrl,
    host,
    contentType,
    title: null,
    description: null,
    siteName: null,
    ogType: null,
    htmlLang: null,
    thumbUrl: null,
    mediaUrl: null,
    embedUrl: embedFromUrl(u),
    tiktokVideoId: /tiktok\.com$/.test(host) ? (/\/(?:video|photo)\/(\d+)/.exec(u.pathname)?.[1] ?? null) : null,
    possible: ['ARTICLE'],
    guess: 'ARTICLE',
  };

  if (contentType.startsWith('image/')) {
    res.body?.cancel().catch(() => {});
    out.mediaUrl = finalUrl;
    out.possible = ['MEME'];
    out.guess = 'MEME';
    return out;
  }
  if (contentType.startsWith('video/')) {
    res.body?.cancel().catch(() => {});
    out.mediaUrl = finalUrl;
    out.possible = ['VIDEO'];
    out.guess = 'VIDEO';
    return out;
  }

  // Page HTML : on lit au plus 512 Ko (les balises utiles sont dans le <head>).
  let html = '';
  if (res.body) {
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    while (html.length < MAX_HTML) {
      const { value, done } = await reader.read();
      if (done) break;
      html += dec.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
  }
  // Page de redirection HTML (<meta http-equiv="refresh" content="0; url=...">) : bug reel du 23/09, le blog Rust
  // renvoyait une page titree "Redirect" -> on suit (2 fois max, toujours via safeFetch donc anti-SSRF).
  const head = parseHead(html);
  const refreshContent = head.metas.find((a) => (a['http-equiv'] ?? '').toLowerCase() === 'refresh')?.content ?? '';
  const urlAt = refreshContent.toLowerCase().indexOf('url=');
  const refresh = urlAt === -1 ? null : refreshContent.slice(urlAt + 4).trim().replace(/^['"]|['"]$/g, '');
  if (refresh && depth < 2) {
    const next = httpsOnly(decode(refresh), finalUrl);
    if (next && next !== finalUrl) return inspectLink(next, depth + 1);
  }
  out.title = meta(head, 'og:title') ?? (head.title ? head.title.slice(0, 300) : null);
  out.description = meta(head, 'og:description') ?? meta(head, 'description');
  out.siteName = meta(head, 'og:site_name');
  out.ogType = meta(head, 'og:type');
  out.htmlLang = head.lang;
  out.thumbUrl = httpsOnly(meta(head, 'og:image') ?? meta(head, 'twitter:image'), finalUrl);
  const ogVideo = httpsOnly(meta(head, 'og:video:secure_url') ?? meta(head, 'og:video:url') ?? meta(head, 'og:video'), finalUrl);
  if (ogVideo && /\.(mp4|webm)(\?|$)/i.test(ogVideo)) out.mediaUrl = ogVideo;
  else if (ogVideo && !out.embedUrl) out.embedUrl = ogVideo;

  const isVideo = Boolean(out.tiktokVideoId || out.embedUrl || out.mediaUrl);
  const possible: CoalTarget[] = ['ARTICLE'];
  if (isVideo) possible.push('VIDEO');
  if (out.thumbUrl) possible.push('MEME'); // un meme sur une page (Reddit, Imgur, 9gag...) = son image og:image
  out.possible = possible;
  out.guess = isVideo ? 'VIDEO' : 'ARTICLE';
  return out;
}
