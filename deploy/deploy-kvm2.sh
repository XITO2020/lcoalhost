#!/bin/bash
# Lcoalhost -> KVM2 Hostinger (187.77.144.220), route par le Traefik deja en place (decision Naim 23/09).
# Double-clic : sites/lcoalhost/deploy-kvm2.bat. Meme schema que tuveuxun (deploy-traefik/deploy-online.sh).
# 1) build du front  2) paquets  3) envoi  4) (re)lancement des conteneurs + verifications.
# AUCUN secret ne part du PC : le .env vit UNIQUEMENT sur le serveur (/docker/lcoalhost/.env).
# NON VALIDE en vrai a l'ecriture (pas d'acces SSH depuis la machine de dev) : surveiller le 1er passage.
set -euo pipefail
cd "$(dirname "$0")/.."   # racine du site : sites/lcoalhost

SRV="root@187.77.144.220"
DIR="/docker/lcoalhost"
OUT="deploy/.out"

echo "== 1/4 build du front =="
(cd frontend && npm run build)

echo "== 2/4 paquets =="
rm -rf "$OUT" && mkdir -p "$OUT"
# Sans ./videos : Vite y recopie frontend/public/videos, deja envoye a part (videos.tgz) -> pas de doublon sur le KVM2.
tar czf "$OUT/front.tgz" --exclude=./videos -C frontend/dist .
# Jamais : node_modules, build local, donnees locales, secrets, scripts jetables.
tar czf "$OUT/backend.tgz" --exclude=node_modules --exclude=dist --exclude=data --exclude='.env*' --exclude='_tmp*' -C backend .
# Petit dossier video de secours (Naim 23/09) : reprend frontend/public/videos.
tar czf "$OUT/videos.tgz" -C frontend/public/videos .
cp docker-compose.yml deploy/nginx.conf env.docker.example "$OUT/"

echo "== 3/4 envoi vers $SRV:$DIR =="
ssh "$SRV" "mkdir -p $DIR/data/mirror $DIR/data/coal $DIR/videos"
scp "$OUT"/front.tgz "$OUT"/backend.tgz "$OUT"/videos.tgz "$OUT"/docker-compose.yml "$OUT"/nginx.conf "$OUT"/env.docker.example "$SRV:$DIR/"
rm -rf "$OUT"

echo "== 4/4 mise en ligne =="
ssh "$SRV" "bash -s" <<'REMOTE'
set -euo pipefail
cd /docker/lcoalhost
# dist/ et videos/ VIDES mais JAMAIS supprimes (audit 24/09, BLOQUANT) : le conteneur web (nginx) les monte ; un
# `rm -rf dist` le laissait accroche a l'ancien dossier supprime -> page vide des le 2e deploiement. Vider videos/
# retire aussi du serveur une video retiree en local.
mkdir -p dist backend videos
find dist -mindepth 1 -delete
find videos -mindepth 1 -delete
rm -rf backend && mkdir -p backend
tar xzf front.tgz -C dist
tar xzf backend.tgz -C backend
tar xzf videos.tgz -C videos
rm -f front.tgz backend.tgz videos.tgz
chown -R 1000:1000 data   # utilisateur `node` du conteneur backend

if [ ! -f .env ]; then
  cp env.docker.example .env
  echo ""
  echo "PREMIER DEPLOIEMENT : /docker/lcoalhost/.env vient d'etre cree a partir du modele."
  echo "Remplis POSTGRES_PASSWORD et ADMIN_TOKEN - nano /docker/lcoalhost/.env - puis relance deploy-kvm2.bat."
  exit 2
fi
if grep -q CHANGE_ME .env; then
  echo "Le .env du serveur contient encore CHANGE_ME : remplis-le - nano /docker/lcoalhost/.env - puis relance."
  exit 2
fi

sed -i 's/\r$//' .env   # .env issu du modele Windows (CRLF) : un \r colle au mot de passe casserait DATABASE_URL
docker compose --env-file .env up -d --build
docker compose restart web   # relit nginx.conf et remonte dist/ et videos/ a coup sur
docker image prune -f >/dev/null   # images orphelines des --build : le KVM2 doit rester leger
echo "Attente de l'API..."
for i in $(seq 1 40); do
  if curl -fs http://127.0.0.1:4300/api/health >/dev/null; then break; fi
  sleep 3
done
docker compose ps
echo "API :"
curl -fs http://127.0.0.1:4300/api/health && echo ""
echo "nginx (derriere Traefik) :"
# Controle du VRAI site (un simple 200 pouvait etre la page par defaut de nginx).
if curl -fs -H "Host: lcoalhost.lol" http://127.0.0.1:8086/ | grep -q 'id="centrale"'; then echo "site Lcoalhost servi : OK"; else echo "ECHEC : nginx ne sert pas le site Lcoalhost"; fi
REMOTE

echo ""
echo "== EN LIGNE (si le DNS pointe deja sur 187.77.144.220) : https://lcoalhost.lol =="
