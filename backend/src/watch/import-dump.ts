// Pont "veille manuelle -> base d'URLs" (demande Naim 22/09) : meme principe que agents/harvester/linkedin_manual.py
// (jamais d'automatisation connectee a un compte perso — trop de risque de ban, Naim l'a deja tranche pour
// LinkedIn) applique ici a TikTok/Instagram. Naim partage les videos qui l'interessent en scrollant normalement
// (ou via un futur compte TikTok "lcoalhost" dedie a qui il transfere), colle les URLs dans data/watch-inbox.txt,
// et ce script transforme chaque ligne en clip publie via l'oEmbed OFFICIEL de la plateforme (gratuit, sans cle,
// respecte les ToS) + un classement automatique du sujet. Usage : npm run watch:import
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { classify } from '../scraper/topics';
import { SCRAPER_TO_TIKTOK_TOPIC } from '../tiktok/topics';

const INBOX_PATH = path.join(__dirname, '..', '..', 'data', 'watch-inbox.txt');

const INBOX_HEADER = `# Veille Lcoalhost — une URL TikTok ou Instagram par ligne (+ une note optionnelle apres un espace).
# Colle ici ce que tu partages en scrollant. Lance ensuite: npm run watch:import
# Les lignes traitees avec succes disparaissent d'ici ; celles en echec restent avec le motif en commentaire.
`;

interface OembedResponse {
  html?: string;
  author_name?: string;
  title?: string;
}

type Platform = 'TIKTOK' | 'INSTAGRAM';

function detectPlatform(url: string): Platform | null {
  if (/tiktok\.com/i.test(url)) return 'TIKTOK';
  if (/instagram\.com|instagr\.am/i.test(url)) return 'INSTAGRAM';
  return null;
}

function extractTiktokId(url: string, html: string | undefined): string | null {
  const fromUrl = url.match(/\/video\/(\d+)/);
  if (fromUrl) return fromUrl[1];
  // Lien court (vm.tiktok.com, partage natif depuis l'appli) : l'id n'est pas dans l'URL, mais TikTok le
  // redonne dans l'attribut data-video-id du HTML oEmbed (qui resout le lien cote serveur).
  const fromHtml = html?.match(/data-video-id="(\d+)"/);
  return fromHtml ? fromHtml[1] : null;
}

function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

async function fetchOembed(platform: Platform, url: string): Promise<OembedResponse | null> {
  const endpoint =
    platform === 'TIKTOK'
      ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      : `https://graph.facebook.com/v25.0/instagram_oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint, { headers: { 'user-agent': config.userAgent }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  return (await res.json()) as OembedResponse;
}

export interface LineResult {
  ok: boolean;
  raw: string;
  reason?: string;
}

export async function processLine(line: string): Promise<LineResult> {
  const trimmed = line.trim();
  const [rawUrl, ...noteParts] = trimmed.split(/\s+/);
  const note = noteParts.join(' ').trim() || null;

  const platform = detectPlatform(rawUrl);
  if (!platform) return { ok: false, raw: trimmed, reason: 'domaine non reconnu (ni tiktok.com ni instagram.com)' };
  // Carrousels photo TikTok : l'oEmbed renvoie 400 sur ".../photo/<id>" mais accepte le meme id en ".../video/<id>"
  // (verifie en vrai le 23/09) — on normalise avant l'appel.
  const url = platform === 'TIKTOK' ? rawUrl.replace(/\/photo\/(\d+)/, '/video/$1') : rawUrl;

  let data: OembedResponse | null;
  try {
    data = await fetchOembed(platform, url);
  } catch (err) {
    return { ok: false, raw: trimmed, reason: `oEmbed injoignable: ${(err as Error).message}` };
  }
  if (!data?.html) return { ok: false, raw: trimmed, reason: 'oEmbed a refuse cette URL (video privee/supprimee/mal formee ?)' };

  const videoId = platform === 'TIKTOK' ? extractTiktokId(url, data.html) : extractInstagramId(url);
  if (!videoId) return { ok: false, raw: trimmed, reason: "id introuvable (ni dans l'URL, ni dans la reponse)" };

  const topic = SCRAPER_TO_TIKTOK_TOPIC[classify(`${data.title ?? ''} ${note ?? ''}`)];

  await prisma.tiktokClip.upsert({
    where: { platform_videoId: { platform, videoId } },
    create: {
      source: 'watch-dump',
      platform,
      videoId,
      embedHtml: data.html,
      authorHandle: data.author_name ?? null,
      caption: data.title ?? null,
      note,
      topic,
    },
    update: { embedHtml: data.html, authorHandle: data.author_name ?? null, caption: data.title ?? null, note, topic },
  });
  console.log(`  + [${platform}/${topic}] ${videoId}${data.author_name ? ` — @${data.author_name}` : ''}`);
  return { ok: true, raw: trimmed };
}

async function main() {
  if (!fs.existsSync(INBOX_PATH)) {
    await fs.promises.mkdir(path.dirname(INBOX_PATH), { recursive: true });
    await fs.promises.writeFile(INBOX_PATH, INBOX_HEADER);
    console.log(`Rien a importer — j'ai cree ${INBOX_PATH}. Colle des URLs dedans puis relance.`);
    return;
  }

  const raw = await fs.promises.readFile(INBOX_PATH, 'utf8');
  const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  if (!lines.length) {
    console.log('Inbox vide, rien a faire.');
    return;
  }

  console.log(`${lines.length} ligne(s) a traiter...\n`);
  const failed: LineResult[] = [];
  let ok = 0;
  for (const line of lines) {
    const result = await processLine(line);
    if (result.ok) ok++;
    else failed.push(result);
  }

  const remaining = INBOX_HEADER + (failed.length ? '\n' + failed.map((f) => `${f.raw} # ECHEC: ${f.reason}`).join('\n') + '\n' : '');
  await fs.promises.writeFile(INBOX_PATH, remaining);

  console.log(`\n${ok} clip(s) publie(s), ${failed.length} echec(s).`);
  if (failed.length) console.log(`Lignes en echec laissees dans ${INBOX_PATH} avec le motif — corrige puis relance.`);
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
