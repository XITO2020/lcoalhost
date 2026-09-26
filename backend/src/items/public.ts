// Pages publiques indexables (23/09, SPEC-ROADMAP.md Phase C) : `/item/:id` (snapshot HTML minimal par item,
// JSON-LD inclus), `/sitemap.xml` (genere depuis la base, une entree par item PUBLISHED) et `/llms-full.txt`
// (dump texte des items recents pour les moteurs de reponse IA). Montees directement sur `app` dans index.ts,
// PAS sous /api — ce sont des pages/documents publics, pas des appels JSON internes au front. En prod, nginx
// doit les proxifier vers le backend comme /api/ (voir deploy/nginx.conf) — sans SSR complet,
// juste un rendu minimal par requete (pas disproportionne pour ces 3 routes precises, cf. spec).
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { wrap } from '../lib/wrap';

export const publicRouter = Router();

const SITE_URL = 'https://lcoal.host';

const escHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const escXml = escHtml; // memes caracteres a echapper pour du XML basique (pas d'attribut avec guillemet simple ici)

function jsonLdFor(item: {
  id: string;
  kind: string;
  title: string;
  caption: string | null;
  mediaUrl: string | null;
  thumbUrl: string | null;
  permalink: string;
  sourceLabel: string;
  publishedAt: Date;
}) {
  const url = `${SITE_URL}/item/${item.id}`;
  const image = item.thumbUrl ?? (item.kind !== 'VIDEO' ? item.mediaUrl : null) ?? undefined;
  const base = {
    '@context': 'https://schema.org',
    url,
    name: item.title,
    datePublished: item.publishedAt.toISOString(),
    isPartOf: { '@type': 'WebSite', name: 'Lcoalhost', url: SITE_URL },
  };
  if (item.kind === 'VIDEO') {
    return {
      ...base,
      '@type': 'VideoObject',
      description: item.caption ?? item.title,
      thumbnailUrl: image,
      contentUrl: item.mediaUrl ?? undefined,
      embedUrl: item.mediaUrl ?? undefined,
    };
  }
  if (item.kind === 'ARTICLE') {
    return {
      ...base,
      '@type': 'Article',
      headline: item.title,
      image,
      author: { '@type': 'Organization', name: item.sourceLabel },
    };
  }
  return {
    ...base,
    '@type': 'ImageObject',
    contentUrl: item.mediaUrl ?? image,
    description: item.caption ?? item.title,
  };
}

publicRouter.get('/item/:id', wrap(async (req, res) => {
  const item = await prisma.item.findFirst({ where: { id: req.params.id, status: 'PUBLISHED' } });
  if (!item) return void res.status(404).type('text/plain').send('Item introuvable ou depublie.');

  const title = `${item.title} — Lcoalhost`;
  const description = (item.caption ?? item.title).slice(0, 200);
  const url = `${SITE_URL}/item/${item.id}`;
  const ld = jsonLdFor(item);

  const media =
    item.kind === 'VIDEO' && item.mediaUrl
      ? `<video controls preload="metadata" src="${escHtml(item.mediaUrl)}" poster="${escHtml(item.thumbUrl ?? '')}"></video>`
      : item.mediaUrl
        ? `<img src="${escHtml(item.mediaUrl)}" alt="${escHtml(item.title)}" loading="lazy">`
        : item.thumbUrl
          ? `<img src="${escHtml(item.thumbUrl)}" alt="${escHtml(item.title)}" loading="lazy">`
          : '';

  res.type('html').send(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${item.kind === 'VIDEO' ? 'video.other' : 'article'}">
<meta property="og:title" content="${escHtml(item.title)}">
<meta property="og:description" content="${escHtml(description)}">
<meta property="og:url" content="${url}">
${item.thumbUrl || item.mediaUrl ? `<meta property="og:image" content="${escHtml(item.thumbUrl ?? item.mediaUrl ?? '')}">` : ''}
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
<meta name="robots" content="index,follow">
</head>
<body style="font:15px system-ui;max-width:640px;margin:40px auto;padding:0 16px;color:#15151a">
<p><a href="${SITE_URL}/">← Lcoalhost</a></p>
<h1>${escHtml(item.title)}</h1>
${media}
${item.caption ? `<p>${escHtml(item.caption)}</p>` : ''}
<p style="color:#6b6a72;font-size:13px">Source : <a href="${escHtml(item.permalink)}" target="_blank" rel="noopener noreferrer">${escHtml(item.sourceLabel)}</a></p>
<p><a href="${SITE_URL}/">See it live in context on Lcoalhost →</a></p>
</body>
</html>`);
}));

publicRouter.get('/sitemap.xml', wrap(async (_req, res) => {
  const items = await prisma.item.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 5000, // plafond raisonnable — au-dela, un sitemap-index serait necessaire (pas le cas aujourd'hui)
  });
  const urls = [
    `  <url><loc>${SITE_URL}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    ...items.map(
      (i) => `  <url><loc>${SITE_URL}/item/${escXml(i.id)}</loc><lastmod>${i.publishedAt.toISOString().slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
    ),
  ];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}));

publicRouter.get('/llms-full.txt', wrap(async (_req, res) => {
  const items = await prisma.item.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    take: 200,
  });
  const lines = items.map((i) => `## ${i.title}\n${i.caption ?? ''}\nType: ${i.kind} · Topic: ${i.topic} · Lang: ${i.lang}\nURL: ${SITE_URL}/item/${i.id}\nSource: ${i.sourceLabel}\n`);
  res.type('text/plain').send(
    `# Lcoalhost — recent content dump (for AI answer engines)\n\nGenerated on demand from the live database. Each entry below is a real, currently published item.\n\n${lines.join('\n')}`,
  );
}));
