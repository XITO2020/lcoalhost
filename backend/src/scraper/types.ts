import type { ItemKind } from '@prisma/client';

/** Ce qu'un connecteur rend, avant toute decision de stockage. */
export interface RawItem {
  kind: ItemKind;
  source: string; // identifiant du connecteur : hackernews, devto, lobsters, lemmy, peertube, rss, reddit
  sourceId: string; // unique DANS la source
  sourceLabel: string; // libelle affiche : c/programmer_humor, Hacker News...
  title: string;
  permalink: string;
  discussionUrl?: string;
  mediaUrl?: string;
  embedUrl?: string;
  thumbUrl?: string;
  author?: string;
  topic?: string; // indice de sujet de la source (sert de repli si classify(titre + tags) ne reconnait rien)
  tags?: string[]; // etiquettes de la source, ajoutees au texte de classification
  score: number;
  publishedAt: Date;
  license?: string;
  lang?: 'en' | 'fr' | 'es'; // langue du contenu ; absent = 'en' (toutes les sources historiques sont anglophones)
}

export interface Connector {
  id: string;
  label: string;
  kinds: ItemKind[];
  /** Variables d'environnement a renseigner pour l'activer ; vide = fonctionne sans cle. */
  requires: string[];
  enabled(): boolean;
  /** Ce que Naim doit faire pour activer le connecteur quand il est OFF. */
  setupHint?: string;
  run(): Promise<RawItem[]>;
}
