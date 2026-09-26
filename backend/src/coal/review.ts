// Liste les soumissions Add Coal en attente de relecture (deja passees le filtre IA). `npm run coal:review`.
import path from 'node:path';
import { config } from '../config';
import { prisma } from '../lib/prisma';

async function main() {
  const pending = await prisma.coalSubmission.findMany({
    where: { status: 'PENDING_REVIEW' },
    orderBy: { createdAt: 'asc' },
  });
  if (!pending.length) {
    console.log('Aucune soumission en attente.');
    return;
  }
  console.log(`${pending.length} soumission(s) en attente de relecture :\n`);
  for (const s of pending) {
    const where = s.aiKind ? ` -> ${s.aiKind}/${s.aiTopic}/${s.aiLang}` : `/${s.aiTopic}`;
    console.log(`[${s.kind}${where}] ${s.id}`);
    console.log(`  ${s.description}`);
    if (s.url) console.log(`  url: ${s.url}`);
    if (s.imagePath) console.log(`  image: ${path.join(config.coalUploadDir, s.imagePath)}`);
    if (s.tcEmail) console.log(`  tc: ${s.tcEmail}`);
    console.log(`  avis IA: ${s.aiReason}`);
    console.log(`  ${s.createdAt.toISOString()}\n`);
  }
  console.log('Approuver : npm run coal:approve -- <id>');
  console.log('Refuser   : npm run coal:reject -- <id>');
}

main().finally(() => prisma.$disconnect());
