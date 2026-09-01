# CacIA

Plataforma de atendimento jurídico com inteligência artificial: atendimento por
WhatsApp, leitura de documentos, acompanhamento processual e agenda.

Monorepo mantido pela **WG Soluções Tecnológicas**.

---

## Requisitos

| Ferramenta | Versão                               |
| ---------- | ------------------------------------ |
| Node.js    | 22 ou superior                       |
| pnpm       | 10 ou superior                       |
| Docker     | para Postgres, Redis e Qdrant locais |

```bash
corepack enable && corepack prepare pnpm@10.34.5 --activate
```

---

## Começando

```bash
pnpm install
cp .env.example .env    # preencha os valores
pnpm build
```

---

## Estrutura

```
apps/
  api/            API NestJS — HTTP e worker de filas
  web/            Aplicação do cliente (Next.js, exportação estática)
  backoffice/     Painel administrativo (Next.js, exportação estática)

packages/
  database/       Schema Prisma e client gerado
  contracts/      Tipos e enums compartilhados entre API e frontends
  config/         TypeScript, ESLint e Prettier compartilhados

infra/
  waha/           Contêiner do WAHA
  qdrant/         Contêiner do Qdrant
```

Cada informação tem **uma única definição**. Um enum usado pela API e pelos dois
frontends vive em `packages/contracts` — não é copiado.

---

## Comandos

| Comando             | O que faz                                        |
| ------------------- | ------------------------------------------------ |
| `pnpm dev`          | Sobe todos os apps em modo desenvolvimento       |
| `pnpm build`        | Compila tudo, respeitando a ordem de dependência |
| `pnpm lint`         | Analisa o código                                 |
| `pnpm typecheck`    | Verifica tipos sem gerar arquivos                |
| `pnpm test`         | Executa os testes                                |
| `pnpm format`       | Formata o código                                 |
| `pnpm format:check` | Verifica formatação sem alterar (usado no CI)    |

O Turborepo reconstrói apenas o que mudou, usando cache.

Para rodar em um pacote específico:

```bash
pnpm --filter @cacia/contracts build
```

---

## Arquitetura

| Camada         | Tecnologia                              | Hospedagem            |
| -------------- | --------------------------------------- | --------------------- |
| Frontends      | Next.js (exportação estática)           | Cloudflare Pages      |
| API e worker   | NestJS                                  | Fly.io                |
| Banco de dados | PostgreSQL + Prisma                     | Gerenciado            |
| Filas e cache  | Redis                                   | Gerenciado            |
| Busca vetorial | Qdrant                                  | Qdrant Cloud / Fly.io |
| WhatsApp       | WAHA (principal) e Evolution (fallback) | Fly.io                |

Detalhamento e justificativa das decisões: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

---

## Contribuindo

Fluxo de trabalho, padrão de commits e critérios de revisão:
[docs/CONTRIBUINDO.md](docs/CONTRIBUINDO.md).

---

## Licença

Software proprietário. Todos os direitos reservados.
