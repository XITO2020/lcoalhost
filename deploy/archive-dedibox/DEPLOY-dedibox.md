# Deploiement Lcoalhost sur la Dedibox Pro-4-M

> **AUCUNE de ces etapes n'a ete executee** (pas de Docker ni de nginx sur le PC de dev). Sert de check-list ; valider chaque
> commande au premier passage. Serveur : `163.172.33.21` (cf. memoire `reference_serveurs_prod`), nginx hote + Docker,
> comme Conspix. **Pas OVH** : le plan OVH ne concerne que le GPU TC/MegaStudio.

## 1. DNS (Porkbun)
Enregistrements **A** vers `163.172.33.21` pour : `lcoalhost.lol`, `www.lcoalhost.lol`, `lcoal.host`, `www.lcoal.host`.

## 2. Preparer le serveur
```bash
sudo mkdir -p /srv/lcoalhost/dist /srv/lcoalhost/app /data/lcoalhost/mirror
sudo chown 1000:1000 /data/lcoalhost/mirror        # utilisateur `node` du conteneur
```

## 3. Envoyer le code (depuis le PC)
- Front : `cd sites/lcoalhost/frontend && npm run build`, puis copier `dist/` vers `/srv/lcoalhost/dist/`.
- Backend + compose : copier `docker-compose.yml`, `env.docker.example` et `backend/` (sans `node_modules`, `.env`, `data`) vers `/srv/lcoalhost/app/`.

## 4. Configurer et lancer
```bash
cd /srv/lcoalhost/app
cp env.docker.example .env && nano .env            # POSTGRES_PASSWORD long et aleatoire
docker compose --env-file .env up -d --build
docker compose ps                                  # lh_postgres + lh_backend "healthy"
curl -s http://127.0.0.1:4300/api/health
```
Le backend applique `prisma migrate deploy` au demarrage. Memes maison (une fois ; idempotent, n'ecrase jamais une edition) :
```bash
docker compose exec backend node dist/prisma/seed.js
```
(le seed compile tourne en local, verifie le 20/09 ; dans le conteneur, non verifie)

## 5. nginx + TLS
```bash
sudo cp deploy/nginx/lcoalhost.lol.conf /etc/nginx/sites-available/lcoalhost.lol
sudo ln -s /etc/nginx/sites-available/lcoalhost.lol /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d lcoalhost.lol -d www.lcoalhost.lol -d lcoal.host -d www.lcoal.host
```

## 6. Verifications apres mise en ligne
- `https://lcoalhost.lol` charge, le hero s'anime, la 3D apparait, le flux se remplit (attendre le 1er cycle : ~5 s apres le demarrage de l'API).
- Console navigateur : aucune violation CSP legitime, puis passer le header en `Content-Security-Policy`.
- Cookie `lh_vid` present avec `Secure` + `HttpOnly`.
- `docker compose logs backend` : `[scraper] cycle termine` toutes les 30 min.

## Ports hote occupes (ne pas reutiliser)
Conspix 3000/4000 · TBcity 3100/4100 · **Lcoalhost 4300**.
