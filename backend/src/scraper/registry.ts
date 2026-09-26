import type { Connector } from './types';
import { hackernews } from './connectors/hackernews';
import { devto } from './connectors/devto';
import { lobsters } from './connectors/lobsters';
import { rssSecurite } from './connectors/rss-securite';
import { rssUsTech } from './connectors/rss-us-tech';
import { rssFrTech } from './connectors/rss-fr-tech';
import { rssIa } from './connectors/rss-ia';
import { lemmy } from './connectors/lemmy';
import { peertube } from './connectors/peertube';
import { reddit } from './connectors/reddit';

/** Ajouter une source = ecrire un Connector et l'ajouter ici. Rien d'autre a toucher. */
export const CONNECTORS: Connector[] = [hackernews, devto, lobsters, rssSecurite, rssUsTech, rssFrTech, rssIa, lemmy, peertube, reddit];
