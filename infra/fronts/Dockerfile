# Publica web e backoffice no Cloudflare Workers a partir de um Linux.
#
# O build da OpenNext no Windows gera um Worker que quebra em produção
# ("Dynamic require of /.next/server/middleware-manifest.json"). Sem WSL nem
# Docker na máquina, o build roda no builder remoto do Fly — a imagem em si
# não é usada para nada; o que importa é o efeito da etapa de deploy.
#
# A partir da raiz do monorepo:
#   fly deploy . --build-only -a cacia-build-fronts \
#     -c infra/fronts/fly.toml --dockerfile infra/fronts/Dockerfile \
#     --build-secret CLOUDFLARE_API_TOKEN=<token> \
#     --build-arg PUBLICACAO=$(date +%s)
#
# PUBLICACAO muda a cada execução para a etapa de deploy não vir do cache.
#
# O contexto é filtrado por Dockerfile.dockerignore, ao lado deste arquivo: o
# .dockerignore da raiz (o da API) exclui justamente apps/web e
# apps/backoffice, e o --ignorefile do flyctl não o substitui.

FROM node:22-bookworm-slim
# A OpenNext sobe o workerd (runtime local da Cloudflare) durante o build, e
# ele recusa iniciar sem certificados de CA — a imagem slim não os traz.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY . .
RUN CI=true pnpm install --frozen-lockfile

# O sharp chega pelo wrangler (miniflare) e é alcançável pelo `require('sharp')`
# do otimizador de imagem do Next; o esbuild da OpenNext tenta empacotar o
# binário nativo e falha. As imagens já são `unoptimized`, então ele sobra.
RUN rm -rf node_modules/.pnpm/sharp@* node_modules/.pnpm/@img+sharp*

RUN pnpm --filter @cacia/contracts build

ARG CLOUDFLARE_ACCOUNT_ID=78afe9be65043a5472301ffce7aa5f99
ARG NEXT_PUBLIC_API_URL=https://cacia-api.fly.dev
ARG NEXT_PUBLIC_APP_URL=https://cacia-web-main.rodrigocacia048.workers.dev
ARG ALVO=todos
ARG PUBLICACAO=0

RUN --mount=type=secret,id=CLOUDFLARE_API_TOKEN \
    export CLOUDFLARE_API_TOKEN="$(cat /run/secrets/CLOUDFLARE_API_TOKEN)" \
           CLOUDFLARE_ACCOUNT_ID NEXT_PUBLIC_API_URL NEXT_PUBLIC_APP_URL \
 && echo "publicação $PUBLICACAO" \
 && if [ "$ALVO" = "todos" ] || [ "$ALVO" = "web" ]; then \
      pnpm --filter @cacia/web cf:deploy; fi \
 && if [ "$ALVO" = "todos" ] || [ "$ALVO" = "backoffice" ]; then \
      pnpm --filter @cacia/backoffice cf:deploy; fi
