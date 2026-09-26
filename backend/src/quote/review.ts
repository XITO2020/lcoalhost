// Liste les demandes de devis pub recues (formulaire de l'aside gauche). `npm run quotes:review`.
// Non destructif : affiche seulement. (emailed=true = deja parti par Brevo vers tabascocity@proton.me.)
import { prisma } from '../lib/prisma';

async function main() {
  const rows = await prisma.quoteRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  if (!rows.length) {
    console.log('Aucune demande de devis.');
    return;
  }
  console.log(`${rows.length} demande(s) de devis (100 plus recentes) :\n`);
  for (const r of rows) {
    console.log(`[${r.createdAt.toISOString()}] ${r.emailed ? 'email envoye' : 'stocke seulement'} — ${r.id}`);
    console.log(`  ${r.message.replace(/\n/g, '\n  ')}\n`);
  }
}

main().finally(() => prisma.$disconnect());
