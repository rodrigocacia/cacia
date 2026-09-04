# CacIA — Plano de Arquitetura e Migração

> **Status:** executado nas fases 0 a 5
>
> Três decisões deste plano foram revistas durante a execução, com informação
> que só apareceu ao medir o código. O registro está em
> [`ESTADO.md`](ESTADO.md) — em especial a exportação estática dos frontends,
> que não é viável como descrito aqui.
> **Data:** 05/08/2026
> **Contexto:** transição de responsabilidade técnica do projeto

---

## 1. Decisões tomadas

| Decisão        | Escolha                                     | Justificativa                                                   |
| -------------- | ------------------------------------------- | --------------------------------------------------------------- |
| Estrutura      | **Monorepo** com apps e packages            | Elimina 91 arquivos de schema duplicados; um CI só              |
| API            | **Uma API NestJS** + worker no mesmo código | Manutenção única, sem acoplar carga pesada ao tráfego web       |
| Banco          | **PostgreSQL**                              | Modelo já é relacional (813 `ObjectId`, 150 `populate`)         |
| ORM            | **Prisma**                                  | Schema declarativo único, migrations versionadas, tipagem forte |
| Fronts         | **Cloudflare Pages** (static export)        | Não há SSR real; requisições ilimitadas no plano gratuito       |
| Busca vetorial | **Qdrant**                                  | Filtragem por payload indexada; destrava busca entre documentos |
| Hospedagem API | **Fly.io** (`gru`)                          | Já configurado; bom suporte a Postgres gerenciado               |
| Dados legados  | **Não migrar**                              | Base limpa — reduz drasticamente risco e prazo                  |

---

## 2. Arquitetura-alvo

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│   Cloudflare Pages          │     │   Fly.io · região gru        │
│   (estático, gratuito)      │     │                              │
│                             │     │  ┌────────────────────────┐  │
│   ├── web         (app)     │────▶│  │  api      (HTTP)       │  │
│   └── backoffice  (admin)   │     │  │  worker   (filas)      │  │
│                             │     │  │  waha     (WhatsApp)   │  │
└─────────────────────────────┘     │  └────────────────────────┘  │
                                    │           │                  │
                                    │  ┌────────▼───────────────┐  │
                                    │  │  Postgres (gerenciado) │  │
                                    │  │  Redis    (Upstash)    │  │
                                    │  │  Qdrant   (vetorial)   │  │
                                    │  └────────────────────────┘  │
                                    └──────────────────────────────┘
```

**`api` e `worker` são o mesmo código**, com entrypoints diferentes:

```jsonc
"start:api":    "node dist/main.js"      // expõe HTTP
"start:worker": "node dist/worker.js"    // só consome filas
```

Um repositório, um schema, um pipeline — mas o processamento de áudio e as
chamadas de LLM não travam as requisições dos usuários.

---

## 3. Estrutura do monorepo

```
cacia/
├── apps/
│   ├── api/                    NestJS — HTTP + worker
│   │   ├── src/
│   │   │   ├── modules/        domínio (24 módulos, sem duplicação)
│   │   │   ├── infra/          prisma, redis, storage, http
│   │   │   ├── integrations/   waha, evolution, evomi, judit, iopay
│   │   │   ├── ai/             agente, tools, memória, RAG
│   │   │   ├── main.ts         entrypoint HTTP
│   │   │   └── worker.ts       entrypoint de filas
│   │   ├── Dockerfile
│   │   ├── fly.api.toml
│   │   └── fly.worker.toml
│   ├── web/                    Next.js static export → Pages
│   └── backoffice/             Next.js static export → Pages
│
├── packages/
│   ├── database/               Prisma schema + client gerado
│   ├── contracts/              tipos e DTOs compartilhados API ↔ fronts
│   └── config/                 eslint, tsconfig, prettier
│
├── infra/
│   ├── waha/                   Dockerfile + fly.toml do WAHA
│   └── qdrant/                 fly.toml + volume do Qdrant
│
├── .github/workflows/          CI/CD
├── pnpm-workspace.yaml
└── turbo.json
```

**Ferramentas:** pnpm workspaces + Turborepo (cache de build, só reconstrói o que mudou).

---

## 4. Modelo de dados

### 4.1 Grafo de entidades

Extraído dos schemas atuais — 24 entidades, ~349 campos:

```
User ──────┐
           ├──▶ Office ──▶ (21 entidades filhas)
Plan ──────┘

Office
 ├── Agent, Calendar, Connection, Consultation, Customer, Question,
 │   Service, Setting, Notification
 ├── Lead ──▶ Customer
 ├── Process ──▶ Customer
 │    └── Progress
 ├── Chat ──▶ Agent, Customer, Lead, User
 │    ├── Message
 │    └── Mark
 ├── Event ──▶ Calendar, Customer, Lead, Process, Progress, Reminder
 ├── Folder ──▶ Customer
 │    └── Document ──▶ Chat, Message, Process, Progress
 ├── Reminder ──▶ Customer, Event, Lead, Process, User
 └── Signature ──▶ Plan, Recurrence, User
      └── Recurrence
```

### 4.2 Multi-tenancy — ponto crítico

**21 das 24 entidades referenciam `Office`.** O `Office` é a fronteira de
isolamento entre clientes. No Mongo isso é convenção; no Postgres precisa ser
garantido:

- `office_id` obrigatório e indexado em todas as tabelas filhas
- Índices compostos `(office_id, <campo de busca>)` — não índices soltos
- Toda consulta filtrada por `office_id` **sem exceção**
- Avaliar Row-Level Security do Postgres como segunda barreira

> Vazamento entre tenants é a falha mais grave possível neste sistema.
> Hoje nada no banco impede — apenas o cuidado de quem escreve a query.

### 4.3 Decisões de modelagem

| Item             | Decisão                                                          |
| ---------------- | ---------------------------------------------------------------- |
| Chave primária   | `uuid` (`gen_random_uuid()`) — evita enumeração de recursos      |
| Soft delete      | Manter `deleted_at`; índices parciais `WHERE deleted_at IS NULL` |
| Timestamps       | `created_at` / `updated_at` gerenciados pelo Prisma              |
| Enums            | Enums nativos do Postgres (hoje são strings livres)              |
| Payload da Judit | `jsonb` — `courts`, `parties`, `subjects`, `classifications`     |
| Endereços        | Tabela própria (hoje é array embutido)                           |
| Embeddings       | **Qdrant** (fora do Postgres) — ver seção 4.4                    |

### 4.4 Busca vetorial — Pinecone → Qdrant

#### Problema no desenho atual

O RAG usa **um namespace do Pinecone por documento**:

```ts
queryVectors(document.vector_namespace || file_id, embedding, topK);
```

Consequências:

- A IA só busca **dentro de um documento por vez**, e o usuário precisa
  informar qual (`file_id`)
- **Não existe busca entre documentos** — impossível perguntar
  "o que consta nos autos deste cliente?"
- `queryVectors` **não aplica filtro nenhum**; o isolamento depende só do
  namespace, embora o metadata já carregue `officeId`, `customerId`,
  `leadId` e `chatId`

#### Desenho alvo com Qdrant

**Uma única coleção** com partição por payload — prática recomendada do Qdrant
para multi-tenant:

| Índice de payload | Uso                                                     |
| ----------------- | ------------------------------------------------------- |
| `office_id`       | Isolamento de tenant — **obrigatório em toda consulta** |
| `document_id`     | Busca dentro de um documento (comportamento atual)      |
| `customer_id`     | Busca em tudo sobre um cliente                          |
| `chat_id`         | Camada fria da memória da IA                            |
| `kind`            | Distingue `document` de `memory_fact`                   |

Ganhos:

- Filtragem real e indexada, em vez de namespace como substituto de filtro
- **Destrava busca entre documentos** — o comportamento esperado de um
  assistente jurídico
- A camada fria da memória da IA usa a mesma infraestrutura, sem serviço novo
- Sem dependência de fornecedor: código aberto, mesma API local e na nuvem

#### Configuração

| Item       | Valor                                                 |
| ---------- | ----------------------------------------------------- |
| Embeddings | OpenAI, 1536 dimensões (mantém o atual)               |
| Distância  | Cosseno                                               |
| Chunk      | 1000 caracteres, sobreposição de 200 (mantém o atual) |
| Coleção    | `cacia_vectors`                                       |

#### Hospedagem

**Desenvolvimento:** Qdrant Cloud, tier gratuito de 1GB — zero operação.
**Produção:** Fly.io com volume, junto do restante da infraestrutura.

> Diferente do Postgres, aqui auto-hospedar é seguro: **vetores são dado
> derivado**. Perder o Qdrant significa reprocessar embeddings a partir dos
> documentos — custa tempo e algumas chamadas de API, não perde informação.
> É por isso que a ressalva feita ao Postgres não se aplica ao Qdrant.

---

## 5. Plano de execução

### Fase 0 — Fundação · 3 a 5 dias

- [ ] Criar repositório `cacia` com pnpm workspaces + Turborepo
- [ ] `packages/config` — tsconfig, eslint, prettier compartilhados
- [ ] CI base no GitHub Actions: lint + typecheck + build
- [ ] Documentar variáveis de ambiente (**25 das 54 não estão documentadas hoje**)

**Entregável:** monorepo vazio que compila e passa no CI.

---

### Fase 1 — Modelo de dados · 5 a 8 dias

- [ ] `packages/database` com Prisma
- [ ] Modelar as 24 entidades a partir do grafo da seção 4.1
- [ ] Índices compostos por `office_id`
- [ ] Enums nativos substituindo strings livres
- [ ] Migration inicial + seed de desenvolvimento
- [ ] Provisionar Postgres gerenciado no Fly

**Entregável:** banco versionado, aplicável do zero.
**Marco:** esta é a peça que destrava todo o resto.

---

### Fase 2 — API unificada · 3 a 4 semanas

Ordem por dependência, não por tamanho:

- [ ] **Infra:** módulo Prisma, Redis, storage S3, cliente HTTP
- [ ] **Auth:** JWT, guards, decorator de tenant
- [ ] **Núcleo:** User, Office, Plan, Signature, Recurrence
- [ ] **Domínio:** Customer, Lead, Process, Progress, Document, Folder
- [ ] **Agenda:** Calendar, Event, Reminder, Recurrence
- [ ] **Conversa:** Chat, Message, Mark, Agent
- [ ] **Integrações:** WAHA, Evolution, Evomi, Judit, IOPay
- [ ] **IA:** agente, 24 tools, RAG, memória
- [ ] **Worker:** entrypoint de filas, processors, cron

Referência: ~192 endpoints (117 de `api-main`, 67 de `backoffice`, 8 dos demais).
A unificação elimina os módulos repetidos em 3 e 4 repositórios.

**Entregável:** API única cobrindo todo o escopo atual.

---

### Fase 3 — Fronts em static export · 1 semana

- [ ] Converter os 5 pontos de `cookies()` para client-side
- [ ] Substituir os 2 route handlers por deleção de cookie no cliente
- [ ] `output: "export"` no `next.config.ts`
- [ ] Remover OpenNext, `wrangler.jsonc` e dependências de Workers
- [ ] Conectar ao Cloudflare Pages via integração Git
- [ ] `packages/contracts` — tipos compartilhados com a API

**Entregável:** dois fronts estáticos, deploy automático por push.

---

### Fase 4 — Infraestrutura · 1 semana

- [ ] WAHA no Fly com **volume persistente** e `auto_stop_machines = false`
- [ ] Redis gerenciado (Upstash)
- [ ] **Qdrant** — Cloud no desenvolvimento, Fly com volume em produção
- [ ] Migrar `VectorStoreService` de Pinecone para Qdrant, com índices de payload
- [ ] Deploy de `api` e `worker` a partir da mesma imagem
- [ ] Health checks e alertas
- [ ] Rastreamento de erros (Sentry)
- [ ] Rate limiting nas rotas públicas

**Entregável:** ambiente completo, monitorado.

---

### Fase 5 — Correções pendentes · 1 semana

Itens já diagnosticados, a serem corrigidos **durante** a reescrita:

- [ ] 🔴 Aplicar proxy Evomi na criação da sessão WAHA
- [ ] 🔴 Memória da IA em 3 camadas (não gravar `ToolMessage`)
- [ ] 🟠 Cachear bloco estático do prompt
- [ ] 🟠 Lembretes: remover janela de 5 minutos, marcar `SENT`, inverter ordem
- [ ] 🟠 Judit: monitoramento contínuo (`tracking`) em vez de consulta única
- [ ] 🟠 `sendDocumentFromUrl` sem suporte a WAHA
- [ ] 🟠 RAG: permitir busca entre documentos (hoje exige `file_id`)
- [ ] 🟠 RAG: aplicar filtro por `office_id` na consulta vetorial
- [ ] 🟡 Substituir `KEYS *` do Redis por `SCAN`

---

### Fase 6 — Qualidade · contínuo

- [ ] Testes das regras críticas (tenant, auth, fallback, proxy, memória)
- [ ] Evals do agente de IA
- [ ] Documentação de API (Swagger)
- [ ] Ambiente de homologação

---

## 6. Cronograma

| Fase                | Duração     | Acumulado |
| ------------------- | ----------- | --------- |
| 0 · Fundação        | 3-5 dias    | 1 semana  |
| 1 · Modelo de dados | 5-8 dias    | 2 semanas |
| 2 · API unificada   | 3-4 semanas | 6 semanas |
| 3 · Fronts          | 1 semana    | 7 semanas |
| 4 · Infraestrutura  | 1 semana    | 8 semanas |
| 5 · Correções       | 1 semana    | 9 semanas |

**Estimativa: 8 a 10 semanas** para uma pessoa em tempo integral.
Fases 3 e 4 podem correr em paralelo com a 2 se houver mais de um dev.

---

## 7. Riscos

| Risco                                | Probabilidade | Mitigação                                                    |
| ------------------------------------ | ------------- | ------------------------------------------------------------ |
| Escopo cresce durante a reescrita    | **Alta**      | Congelar funcionalidades; portar comportamento, não melhorar |
| Regra de negócio implícita se perder | **Alta**      | Manter o repositório antigo como referência viva             |
| Vazamento entre tenants              | Média         | `office_id` obrigatório + teste automatizado dedicado        |
| Sessões WAHA caírem no deploy        | Média         | Volume persistente + `auto_stop_machines = false`            |
| Prazo estourar                       | Média         | Fases 0-2 são o núcleo; 3-6 podem escalonar                  |

**O maior risco é o primeiro.** Reescrita é a oportunidade perfeita para
"melhorar só mais isso" — e é assim que projetos de 8 semanas viram 6 meses.
As melhorias já estão catalogadas na Fase 5; nada além disso entra.

---

## 8. Fora de escopo

- Migração de dados do Mongo (base limpa, decidido)
- Mudanças de produto ou novas funcionalidades
- Redesenho de interface
- Troca de provedores (Fly, Cloudflare, OpenAI permanecem)

---

## 9. O que fica para depois

- Cobertura ampla de testes
- Painel de custo e latência da IA
