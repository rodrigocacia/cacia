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

## Banco de dados

Suba a infraestrutura local (PostgreSQL, Redis e Qdrant):

```bash
docker compose up -d
```

As portas expostas ao host saem das padrões — `5434` para o PostgreSQL e `6380`
para o Redis — porque a mesma máquina costuma rodar outros projetos nas portas
padrão. Dentro da rede do compose as portas são as usuais.

Aplique as migrations e gere o client:

```bash
pnpm --filter @cacia/database migrate:deploy
pnpm --filter @cacia/database generate
```

Para inspecionar os dados em uma interface web:

```bash
pnpm --filter @cacia/database studio
```

### Ao alterar o schema

O arquivo `packages/database/prisma/schema.prisma` é a fonte única do modelo de
dados. Depois de editá-lo:

```bash
pnpm --filter @cacia/database migrate:dev --name descricao_da_mudanca
```

O CI verifica que o schema e as migrations estão sincronizados — editar um sem
gerar o outro reprova a verificação.

### Isolamento entre escritórios

`Office` é a fronteira entre clientes. **Toda consulta a uma entidade filha
precisa filtrar por `officeId`.** Cada tabela tem índice composto começando por
essa coluna, então o filtro é barato — não há motivo para omiti-lo.

---

## Rotas

Toda rota exige `Authorization: Bearer <token>`, salvo as de `/auth`.
As rotas de escritório exigem também o cabeçalho `x-office-id`.

### Autenticação — público

| Método | Rota                   | O que faz                                 |
| ------ | ---------------------- | ----------------------------------------- |
| POST   | `/auth/register`       | Cria conta                                |
| POST   | `/auth/login`          | Devolve token e os escritórios do usuário |
| POST   | `/auth/forgot`         | Gera código de recuperação                |
| POST   | `/auth/validate-code`  | Confere o código                          |
| POST   | `/auth/reset-password` | Redefine a senha com o código             |

### Usuário — sem escritório

| Método | Rota                 | O que faz            |
| ------ | -------------------- | -------------------- |
| GET    | `/users/me`          | Perfil e escritórios |
| PATCH  | `/users/me`          | Atualiza o perfil    |
| PUT    | `/users/me/password` | Troca a senha        |

### Escritórios

| Método | Rota                               | Papel    | O que faz                              |
| ------ | ---------------------------------- | -------- | -------------------------------------- |
| GET    | `/offices`                         | —        | Escritórios do usuário                 |
| POST   | `/offices`                         | —        | Cria escritório (o criador vira ADMIN) |
| GET    | `/offices/current`                 | qualquer | Dados do escritório                    |
| PATCH  | `/offices/current`                 | ADMIN    | Atualiza                               |
| GET    | `/offices/current/members`         | qualquer | Lista membros                          |
| POST   | `/offices/current/members`         | ADMIN    | Adiciona membro                        |
| DELETE | `/offices/current/members/:userId` | ADMIN    | Remove membro                          |

### Domínio jurídico

| Método | Rota                        | O que faz                                       |
| ------ | --------------------------- | ----------------------------------------------- |
| GET    | `/customers`                | Lista clientes (paginado, com busca)            |
| POST   | `/customers`                | Cadastra cliente                                |
| GET    | `/customers/:id`            | Detalha, com contagem de processos e documentos |
| PATCH  | `/customers/:id`            | Atualiza                                        |
| DELETE | `/customers/:id`            | Exclusão lógica                                 |
| GET    | `/leads`                    | Lista leads (filtra por status)                 |
| POST   | `/leads`                    | Cadastra lead                                   |
| POST   | `/leads/:id/convert`        | Converte em cliente                             |
| GET    | `/processes`                | Lista processos (filtra por status e cliente)   |
| POST   | `/processes`                | Cadastra processo                               |
| GET    | `/processes/:id`            | Detalha, com os dados da Judit                  |
| GET    | `/processes/:id/progresses` | Andamentos, do mais recente                     |

### Agenda

| Método | Rota                 | O que faz                                                |
| ------ | -------------------- | -------------------------------------------------------- |
| GET    | `/calendars`         | Lista agendas do escritório                              |
| POST   | `/calendars`         | Cria agenda com os dias e turnos disponíveis             |
| PATCH  | `/calendars/:id`     | Atualiza (substitui a configuração de dias)              |
| GET    | `/events`            | Lista compromissos (filtra por período, agenda, cliente) |
| POST   | `/events`            | Cria compromisso e seus lembretes                        |
| PATCH  | `/events/:id`        | Atualiza; remarcar recalcula os lembretes pendentes      |
| POST   | `/events/:id/cancel` | Cancela o compromisso e os lembretes                     |
| GET    | `/reminders/failed`  | Lembretes que falharam em definitivo                     |
| DELETE | `/reminders/:id`     | Cancela um lembrete                                      |

### Conexões de WhatsApp

| Método | Rota                      | Papel    | O que faz                                         |
| ------ | ------------------------- | -------- | ------------------------------------------------- |
| GET    | `/connections`            | qualquer | Lista conexões                                    |
| POST   | `/connections`            | ADMIN    | Cria sessão **com proxy residencial já aplicado** |
| GET    | `/connections/:id/qrcode` | qualquer | QR Code para parear o número                      |
| GET    | `/connections/no-proxy`   | qualquer | Conexões operando sem proxy                       |
| PUT    | `/connections/:id/proxy`  | ADMIN    | Troca a localização do proxy                      |
| DELETE | `/connections/:id`        | ADMIN    | Desconecta                                        |

### Planos e saúde

| Método | Rota            | O que faz                                   |
| ------ | --------------- | ------------------------------------------- |
| GET    | `/plans`        | Catálogo de planos ativos                   |
| GET    | `/health`       | O processo está vivo                        |
| GET    | `/health/ready` | Consegue atender (checa PostgreSQL e Redis) |

---

## Contribuindo

Fluxo de trabalho, padrão de commits e critérios de revisão:
[docs/CONTRIBUINDO.md](docs/CONTRIBUINDO.md).

---

## Licença

Software proprietário. Todos os direitos reservados.
