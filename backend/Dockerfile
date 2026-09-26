# Lcoalhost backend — image de production (Express + Prisma + Postgres).
# Contexte de build = sites/lcoalhost/backend/. NON VALIDE localement (pas de Docker sur le PC) : premier build sur le KVM2.

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
# prisma/ AVANT npm ci (audit 24/09, BLOQUANT) : npm ci lance le script "postinstall": "prisma generate", qui
# s'arretait en erreur faute de schema -> la construction de l'image backend echouait.
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY --from=build /app/dist ./dist
RUN mkdir -p /data/mirror && chown -R node:node /app /data
USER node
EXPOSE 4200
# Applique les migrations puis demarre l'API (le scraper est planifie par l'API elle-meme).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
