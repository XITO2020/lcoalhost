# Deploiement Lcoalhost sur le KVM2 Hostinger (decision Naim 23/09)

> Serveur : **Hostinger KVM2 `187.77.144.220`** — PARTAGE avec tuveuxun.expert, Dueria, Fundherz, Raisup, le mail,
> Traefik et OpenClaw. **Ne jamais y installer nginx/certbot systeme** (Traefik tient deja les ports 80/443).
> **Le KVM2 doit rester LEGER** : il garde la place pour un LLM plus puissant (tuveuxun.expert, puis Lcoalhost).
> Ancienne version Dedibox archivee dans `deploy/archive-dedibox/` (plus utilisee).
>
> **Rien de ceci n'a encore ete execute** (aucun acces SSH depuis la machine de dev). Build + paquets testes en
> local le 23/09 ; l'envoi et le premier `docker compose up` sont a surveiller au premier passage.

## Ce qui tourne
| Conteneur | Role | Reseau | Poids |
|---|---|---|---|
| `lh_web` | nginx alpine : front statique, `/mirror/`, `/videos/` (dossier de secours), relaie `/api` `/item` `/sitemap.xml` `/llms-full.txt` | hote, port **8086** (Traefik -> 8086) | quelques Mo |
| `lh_backend` | API Express + scraper toutes les 30 min | prive + `127.0.0.1:4300` | ~100-150 Mo RAM |
| `lh_postgres` | base dediee `lcoalhost` | prive uniquement | ~30-50 Mo RAM |

Disque : copies du scraper plafonnees a **5 Go** (`STORAGE_BUDGET_MB`, le plus ancien non epingle part en premier).
Agent memes : **OFF** (il utilisera plus tard l'Ollama deja present sur le KVM2).

## 0. Avant le tout premier deploiement (une fois)
1. **Verifier que les ports sont libres sur le KVM2** : `ssh root@187.77.144.220 "ss -ltnp | grep -E ':(8086|4300) '"`
   -> ne doit rien afficher. (8085 = tuveuxun-web, 8001 = tuveuxun-api, 9000 = Listmonk.)
2. **DNS (Porkbun)** : enregistrements **A** vers **`187.77.144.220`** pour `lcoalhost.lol`, `www.lcoalhost.lol`,
   `lcoal.host`, `www.lcoal.host` (ils pointaient vers la Dedibox `163.172.33.21`). Traefik obtient le certificat
   Let's Encrypt tout seul une fois le DNS propage.

## 1. Deployer — double-clic sur `sites/lcoalhost/deploy-kvm2.bat`
Le script (`deploy/deploy-kvm2.sh`) : build du front -> paquets (sans `.env`, `node_modules`, donnees locales) ->
envoi dans `/docker/lcoalhost/` -> `docker compose up -d --build` -> verifie l'API et nginx.
- **1er lancement** : il cree `/docker/lcoalhost/.env` a partir de `env.docker.example` puis **s'arrete**.
  Remplir les `CHANGE_ME` (`POSTGRES_PASSWORD`, `ADMIN_TOKEN` — ex. `openssl rand -hex 24`) :
  `ssh root@187.77.144.220` puis `nano /docker/lcoalhost/.env`, et relancer `deploy-kvm2.bat`.
- Les migrations Prisma s'appliquent seules au demarrage du backend.
- Memes maison (une seule fois, idempotent) : `ssh root@187.77.144.220 "cd /docker/lcoalhost && docker compose exec backend node dist/prisma/seed.js"`

## 2. Dossier video de secours
`/docker/lcoalhost/videos/` = copie de `frontend/public/videos/` a chaque deploiement, servi sur
`https://lcoalhost.lol/videos/...`. Sert quand le pont videos Conspix n'existe pas (decision Naim 23/09).

## 3. Verifications apres mise en ligne
- `https://lcoalhost.lol` charge, le feed se remplit (1er cycle de scraping ~5 s apres le demarrage de l'API).
- `https://www.lcoalhost.lol` et `https://lcoal.host` redirigent en 301 vers `https://lcoalhost.lol`.
- Cookie `lh_vid` avec `Secure` + `HttpOnly`.
- **Vraie IP des visiteurs** : `docker compose logs backend` ne doit pas montrer toutes les requetes limitees
  ensemble (429 en rafale) — nginx transmet le `X-Forwarded-For` de Traefik tel quel (voir `deploy/nginx.conf`).
- Console navigateur : relever les violations CSP (en-tete en mode rapport seulement) avant de le durcir.
- `docker compose logs backend` : `[scraper] cycle termine` toutes les 30 min.

## 4. Points d'attention
- `lh_web` ecoute le port 8086 sur toutes les interfaces, comme `tuveuxun-web` (8085) : meme schema que ce qui
  marche deja sur ce serveur. Si le pare-feu Hostinger laisse passer 8086 depuis Internet, le site y serait aussi
  joignable en HTTP simple (sans TLS) — a fermer cote pare-feu si c'est le cas.
- **Google Analytics** (choix Naim pour mesurer les pubs) : pas branche. Avant : bandeau de consentement RGPD +
  correction des textes "zero cookie de tracking" + ajout du domaine GA a la CSP.
- Retour arriere : `ssh root@187.77.144.220 "cd /docker/lcoalhost && docker compose down"` (la base reste dans le
  volume `lh_pgdata`, les copies dans `data/`).
