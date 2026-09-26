# SEO / AEO — Lever 1 : audit edge-optimizer (2026-09-24)

> Audit des sites réels de l'écosystème par l'agent B2B `edge-optimizer`
> (`agents/edge-optimizer/`). **Aucun site n'a été modifié** : l'agent mesure, propose, le
> client applique. Rapport factuel — un site qui n'a pas répondu n'a pas de score inventé.

## Comment l'agent a été lancé

- **Binaire** : `agents/edge-optimizer/app/main.py` (FastAPI, châssis commun `agents/_chassis/core.py`).
- **Venv jetable** : `agents/edge-optimizer/.venv/` (Python 3.14, deps `fastapi`, `uvicorn[standard]`,
  `httpx[http2]`, `pydantic`, `python-dotenv`). Le venv commun `_chassis/.venv` n'existait pas ; venv
  local créé pour ce run, à supprimer.
- **Commande** : `uvicorn app.main:app --host 127.0.0.1 --port 8092`
  (port par défaut de l'agent = 8608 ; 8092 retenu pour éviter tout conflit).
- **Moteur LLM** : **déterministe** (`FAKE_LLM=1`, `engine=fake`) — **Ollama non requis, non sollicité**.
  Les scores et correctifs sont **100 % déterministes** (règles fixes du code, aucun modèle). Seul le
  *résumé exécutif en 2 phrases* aurait utilisé le LLM ; en mode fake il retombe sur le résumé chiffré
  par défaut (les chiffres restent exacts).
- **Collecteur** : `POST /audit-url` (httpx + html.parser, HTTP/2 côté client actif, protocole déduit
  de la version négociée et de l'en-tête `alt-svc`).

## Sites audités

| URL | HTTP | Global /100 | Perf | Images | SEO tech | AEO | Top 3 correctifs |
|-----|------|-------------|------|--------|----------|-----|------------------|
| https://tuveuxun.expert | 200 | **74** | 10 | 100* | 85 | 100 | 1. Cache ressources statiques 30 j · 2. Raccourcir `title` (64→60) · 3. Ajouter `canonical` |
| http://localhost:5180 (lcoalhost, dev) | 200 | **85** | 55 | 100 | 85 | 100 | 1. Activer compression (brotli/gzip) · 2. Passer en HTTPS · 3. Activer HTTP/2 puis HTTP/3 |

\* voir caveat images ci-dessous.

### Détail — tuveuxun.expert (audit A-001)

- **Mesuré** : protocole `h2` (HTTP/2 négocié), poids total **3795 ko**, temps de réponse **705 ms**,
  30 assets relevés, statut 200.
- **AEO 100 légitime** : `/llms.txt` réel (text/plain, 2544 o) et `/sitemap.xml` réel (text/xml, 1494 o)
  vérifiés séparément ; schema.org JSON-LD détecté dans le HTML. Le site est **déjà bien préparé pour
  les moteurs de réponse IA** — c'est le point fort.
- **Point faible = performance (10/100)** : page lourde (3795 ko > 3000), réponse serveur lente
  (705 ms > 600), pas de `Cache-Control` sur les statiques. Correctifs perf classés par gain/effort :

| id | Catégorie | Gain | Effort | Priorité | Correctif |
|----|-----------|------|--------|----------|-----------|
| c01 | performance | 3 | 1 | 3.0 | Mettre en cache les ressources statiques (30 jours) |
| c02 | seo_technique | 2 | 1 | 2.0 | Raccourcir la balise title (64 → 60 caractères) |
| c03 | seo_technique | 2 | 1 | 2.0 | Ajouter la balise canonical |
| c04 | performance | 4 | 3 | 1.33 | Réduire le poids total de la page (3795 ko, cible < 1500 ko) |
| c05 | performance | 4 | 3 | 1.33 | Réduire le temps de réponse serveur (705 ms, cible < 200 ms) |
| c06 | performance | 2 | 2 | 1.0 | Passer de HTTP/2 à HTTP/3 (QUIC, 443 UDP) — à confirmer sur la version du proxy |
| c07 | seo_technique | 1 | 1 | 1.0 | Raccourcir la meta description (176 → 160 caractères) |

- **Caveat images (score 100)** : les requêtes HEAD n'ont pas renvoyé de `content-length`, donc le poids
  individuel de chaque image est ressorti à 0 ko → aucune image pénalisée. Le 100 est un **« pas de
  donnée » et non une preuve d'optimisation**. À re-mesurer avec un vrai relevé de poids (ou export
  Lighthouse) — d'autant que le poids total (3795 ko) est élevé.

### Détail — lcoalhost (localhost:5180, audit A-002)

- **Mesuré** : protocole `http/1.1`, pas de HTTPS (normal en dev local), **pas de compression**, statut 200.
- **AEO 100 légitime** : `/llms.txt` (text/plain, 1905 o) et `/sitemap.xml` (application/xml, 174 ko) sont
  de **vrais fichiers**, pas un fallback SPA — vérifié via contrôle : une URL inexistante renvoie
  `text/html` 19 226 o (index SPA), les fichiers ci-dessus renvoient bien text/plain et application/xml.
- **Perf 55** : les 3 correctifs (compression, HTTPS, HTTP/2→3) sont **des faits de l'environnement de
  dev local** (Vite HTTP/1.1 en clair). **À ré-auditer sur l'URL de prod une fois déployé** — l'audit
  local ne préjuge pas de la config serveur de production.

| id | Catégorie | Gain | Effort | Priorité | Correctif |
|----|-----------|------|--------|----------|-----------|
| c01 | performance | 3 | 1 | 3.0 | Activer la compression (brotli ou gzip) |
| c02 | performance | 5 | 2 | 2.5 | Passer le site en HTTPS |
| c03 | performance | 3 | 2 | 1.5 | Activer HTTP/2 puis HTTP/3 (QUIC, 443 UDP) |
| c04 | seo_technique | 1 | 1 | 1.0 | Raccourcir la meta description (164 → 160 caractères) |

## llms.txt / JSON-LD générés par l'agent (proposés — à valider par Naim avant publication)

> Publier un fichier sur un site est une action du client : l'agent les dépose en checkpoint humain,
> il ne les publie jamais lui-même. Les deux sites ont **déjà** un llms.txt et un schema.org réels ;
> ci-dessous les versions générées par l'agent, à comparer/fusionner avec l'existant si besoin.

### tuveuxun.expert — llms.txt

```text
# tuveuxun.expert
> Vitrine de services et d agents IA pour TPE, PME et associations.

## Pages principales
- [Accueil](https://tuveuxun.expert/): presentation des services

## Site
- [Accueil](https://tuveuxun.expert)

## Contact
- tabascocity@proton.me
```

### tuveuxun.expert — schema.org (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "tuveuxun.expert",
  "url": "https://tuveuxun.expert",
  "description": "Vitrine de services et d agents IA pour TPE, PME et associations.",
  "email": "tabascocity@proton.me"
}
</script>
```

### lcoalhost — llms.txt

```text
# lcoalhost
> Site d humour pour developpeurs (dev humor), themes jour nuit urbex.

## Pages principales
- [Accueil](http://localhost:5180/): page principale

## Site
- [Accueil](http://localhost:5180)
```

### lcoalhost — schema.org (JSON-LD)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "lcoalhost",
  "url": "http://localhost:5180",
  "description": "Site d humour pour developpeurs, themes jour nuit urbex."
}
</script>
```

> Note : descriptions fournies au générateur pour le run (neutres/factuelles). À reformuler par Naim
> pour la vraie identité éditoriale ; l'URL lcoalhost devra pointer sur le domaine de prod (spinoff.homes
> ou autre) une fois déployé, pas sur localhost.

## Sites NON joignables → à ré-auditer après déploiement

| URL testée | HTTP | Raison |
|------------|------|--------|
| https://tabasco.city | 000 | DNS non résolu (host introuvable) |
| https://tabascocity.com | 000 | DNS non résolu (host introuvable) |
| https://shonen.industries | 000 | Le domaine résout mais échec TLS (`unrecognized name` — pas de vhost/certificat pour cet hôte, site non déployé) |
| https://shonenind.com | 000 | DNS non résolu (host introuvable) |

Aucun score n'est produit pour ces quatre URL : elles ne sont pas en ligne à la date de l'audit.
À relancer `POST /audit-url` dès que TabascoCity et ShonenInd sont déployés (DNS + certificat en place).

## Incertitudes & limites de scope (RSP)

- Scores et correctifs **déterministes** (fiables et reproductibles) ; le **résumé exécutif LLM n'a pas
  tourné** (mode fake) — sans impact sur les chiffres.
- **Poids des images non mesurable** via HEAD sur tuveuxun (pas de `content-length`) : le score images 100
  n'est pas une preuve, à confirmer avec un relevé réel ou un export Lighthouse (`POST /audit` avec le
  champ `lighthouse`).
- **HTTP/3** : jamais affirmé sans preuve — le correctif reste marqué « à confirmer sur la version exacte
  du proxy » (`curl --http3 -I`).
- lcoalhost a été audité **en dev local** : la perf réelle dépendra de la config de prod, à ré-auditer
  après déploiement.
- Seuls **2 sites sur 6** étaient joignables ; l'écosystème SEO/AEO ne pourra être audité complètement
  qu'après mise en ligne de TabascoCity et ShonenInd.
