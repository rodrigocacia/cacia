# Build a partir da raiz do monorepo:
#   docker build -f apps/api/Dockerfile .
#
# A mesma imagem serve à API e ao worker — muda só o comando de inicialização.

# ---------- dependências ----------------------------------------------------
FROM node:22-alpine AS deps
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app

# Copia só os manifestos primeiro: enquanto eles não mudam, a camada de
# instalação vem do cache e o build fica muito mais rápido.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/config/package.json ./packages/config/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma

RUN pnpm install --frozen-lockfile

# ---------- build -----------------------------------------------------------
FROM node:22-alpine AS build
RUN corepack enable && apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .

RUN pnpm --filter @cacia/database generate \
 && pnpm --filter @cacia/contracts build \
 && pnpm --filter @cacia/database build \
 && pnpm --filter @cacia/api build

RUN pnpm install --frozen-lockfile --prod

# ---------- runtime ---------------------------------------------------------
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl tini
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/

# Não roda como root
USER node

EXPOSE 8080

# tini como PID 1: repassa SIGTERM ao Node, para o encerramento ser limpo
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
