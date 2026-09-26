// Retire le jeu de test importe par import-local-videos.ts (source = 'local-test'). Usage :
// npm run dev:clear-local-videos
import { prisma } from '../lib/prisma';

async function main() {
  const { count } = await prisma.item.deleteMany({ where: { source: 'local-test' } });
  console.log(`${count} item(s) de test local supprime(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
