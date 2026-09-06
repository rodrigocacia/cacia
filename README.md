# CacIA

Plataforma de atendimento jurídico com inteligência artificial: atendimento por
WhatsApp, leitura de documentos, acompanhamento processual e agenda.

Monorepo mantido pela **WG Soluções Tecnológicas**.

Estado da reconstrução, decisões revistas e o que continua pendente:
[`docs/ESTADO.md`](docs/ESTADO.md).

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
| `pnpm test`         | Executa os testes unitários                      |
| `pnpm test:e2e`     | Executa os testes de ponta a ponta               |
| `pnpm format`       | Formata o código                                 |
| `pnpm format:check` | Verifica formatação sem alterar (usado no CI)    |

O Turborepo reconstrói apenas o que mudou, usando cache.

Para rodar em um pacote específico:

```bash
pnpm --filter @cacia/contracts build
```

---

## Testes

São duas suítes, com propósitos diferentes.

**Unitários** (`pnpm test`) — rápidos, sem infraestrutura. Cobrem regra de
negócio isolada: o cálculo do disparo de um lembrete, a fragmentação de um
documento, a decisão do guard de tenant.

**Ponta a ponta** (`pnpm test:e2e`) — sobem a aplicação inteira e falam com
ela por HTTP, contra **PostgreSQL e Redis de verdade**. Cobrem o que o teste
unitário com Prisma dublado não enxerga: uma query inválida, um índice único
que dispara, um enum que não existe no banco, um guard que ficou na ordem
errada.

```bash
docker compose up -d postgres redis
pnpm test:e2e
```

As integrações que sairiam para a rede — OpenAI, Qdrant, WAHA, Evolution,
Evomi, Judit, storage — são substituídas por dublês. O Qdrant e o storage
guardam de verdade o que recebem, para que "indexar e depois excluir" seja
verificável.

A suíte roda no schema `e2e` e **trunca todas as tabelas dele** entre os
arquivos. Ela recusa iniciar se apontar para o `public`, justamente para não
apagar o banco de quem está com a aplicação aberta ao lado. Para usar outra
conexão, defina `DATABASE_URL_E2E`.

**Frontends** (`pnpm test`, junto com os unitários) — cobrem a camada de
tradução entre o vocabulário da interface e o da API, e o cliente HTTP contra
um servidor de verdade. É o ponto onde um erro não quebra uma tela, e sim
todas: um campo renomeado errado aparece como "undefined" na aplicação inteira
ao mesmo tempo. Ver [`apps/web/src/http/adaptador.ts`](apps/web/src/http/adaptador.ts).

Nenhum teste abre a aplicação e olha para a tela — isso continua sendo
trabalho de uma pessoa antes de cada publicação.

---

## Arquitetura

| Camada         | Tecnologia                              | Hospedagem            |
| -------------- | --------------------------------------- | --------------------- |
| Frontends      | Next.js (renderização no servidor)      | Cloudflare Workers    |
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
pnpm db:migrate
pnpm --filter @cacia/database generate
```

Os comandos de banco rodam **a partir da raiz** de propósito: o Prisma procura
o `.env` no diretório do processo, e o arquivo fica aqui. Rodá-los pelo pacote
(`pnpm --filter @cacia/database ...`) falha com `Environment variable not
found: DATABASE_URL`.

Para inspecionar os dados em uma interface web:

```bash
pnpm db:studio
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
| GET    | `/processes/unmonitored`    | Processos sem acompanhamento contínuo           |

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

### Documentos

| Método | Rota                         | O que faz                                   |
| ------ | ---------------------------- | ------------------------------------------- |
| GET    | `/documents`                 | Lista (filtra por cliente, processo, pasta) |
| POST   | `/documents`                 | Envia arquivo (até 20 MB)                   |
| GET    | `/documents/:id/download`    | Link temporário de 15 minutos               |
| GET    | `/documents/indexing-failed` | Documentos cuja indexação falhou            |
| DELETE | `/documents/:id`             | Exclusão lógica; remove do índice vetorial  |

Arquivos vão para o storage, **nunca em base64 dentro da tabela**. O sistema
anterior guardava o conteúdo codificado na própria linha, o que inflava o banco
e fazia cada `SELECT` carregar megabytes que ninguém pediu.

### Notificações

| Método | Rota                      | O que faz                        |
| ------ | ------------------------- | -------------------------------- |
| GET    | `/notifications`          | Lista, com contagem de não lidas |
| POST   | `/notifications/:id/read` | Marca como lida                  |
| POST   | `/notifications/read-all` | Marca todas                      |

### Conexões de WhatsApp

| Método | Rota                      | Papel    | O que faz                                         |
| ------ | ------------------------- | -------- | ------------------------------------------------- |
| GET    | `/connections`            | qualquer | Lista conexões                                    |
| POST   | `/connections`            | ADMIN    | Cria sessão **com proxy residencial já aplicado** |
| GET    | `/connections/:id/qrcode` | qualquer | QR Code para parear o número                      |
| GET    | `/connections/no-proxy`   | qualquer | Conexões operando sem proxy                       |
| PUT    | `/connections/:id/proxy`  | ADMIN    | Troca a localização do proxy                      |
| DELETE | `/connections/:id`        | ADMIN    | Desconecta                                        |

### Conversa e agentes

| Método | Rota                     | O que faz                                  |
| ------ | ------------------------ | ------------------------------------------ |
| GET    | `/agents`                | Lista agentes de IA do escritório          |
| POST   | `/agents`                | Cria agente (tipo, estilo, saudação)       |
| GET    | `/chats`                 | Lista conversas (filtra por status e tipo) |
| GET    | `/chats/:id/messages`    | Mensagens da conversa                      |
| PUT    | `/chats/:id/audio-reply` | Liga ou desliga resposta em áudio          |
| POST   | `/chats/:id/close`       | Encerra a conversa                         |

### Webhooks

| Método | Rota                        | O que faz                           |
| ------ | --------------------------- | ----------------------------------- |
| POST   | `/webhooks/waha?office_id=` | Recebe mensagens e estado da sessão |
| POST   | `/webhooks/judit`           | Recebe atualizações processuais     |

Sem JWT — o WAHA não tem sessão de usuário —, mas exige o cabeçalho
`x-webhook-token`. Sem ele, qualquer um poderia injetar mensagens falsas no
atendimento de um escritório.

### Planos e saúde

| Método | Rota            | O que faz                                   |
| ------ | --------------- | ------------------------------------------- |
| GET    | `/plans`        | Catálogo de planos ativos                   |
| GET    | `/health`       | O processo está vivo                        |
| GET    | `/health/ready` | Consegue atender (checa PostgreSQL e Redis) |

---

## Frontends

| App               | Deploy                           |
| ----------------- | -------------------------------- |
| `apps/web`        | Cloudflare Workers, via OpenNext |
| `apps/backoffice` | Cloudflare Workers, via OpenNext |

Ambos enviam o escritório à API pelo cabeçalho `x-office-id`, que é como a API
resolve o tenant — nunca por query ou corpo.

### Sobre exportação estática e Cloudflare Pages

O plano original previa converter os frontends para exportação estática e
publicá-los no Pages. **A medição mostrou que isso não é viável sem reescrever
a camada de dados:**

```
apps/web         41 rotas dinâmicas · 3 estáticas · 64 arquivos com Server Actions
apps/backoffice  12 páginas, nenhuma com "use client" · 21 arquivos com Server Actions
```

As páginas são Server Components que buscam dados no servidor e hidratam o SWR.
Convertê-las exigiria refazer a busca de dados de 54 páginas.

Os Workers são igualmente gratuitos no volume atual e são o caminho que a
Cloudflare recomenda para Next.js com renderização no servidor. A conversão
para estático continua possível, mas é um projeto próprio — não um ajuste.

---

## Memória da IA

Três camadas, com orçamento de contexto **fixo** — uma conversa de duzentas
mensagens ocupa o mesmo espaço que uma de dez.

| Camada | Onde       | O que guarda                      | Custo       |
| ------ | ---------- | --------------------------------- | ----------- |
| Quente | Redis      | Últimos 4 turnos, literais        | ~500 tokens |
| Morna  | PostgreSQL | Resumo rolante do que veio antes  | ~200 tokens |
| Fria   | Qdrant     | Fatos permanentes, por relevância | ~100 tokens |

**Resultado de ferramenta nunca entra na memória** — só o fato que dele decorre.
Era exatamente isso que consumia a janela do sistema anterior: cada turno com
ferramentas gravava de 3 a 5 entradas das 20 disponíveis, e a janela real virava
4 a 6 turnos.

As três camadas degradam de forma independente: sem Redis o agente responde com
resumo e fatos; sem Qdrant, com os turnos recentes e o resumo.

### Agente

Cinco ferramentas, todas com o escritório vindo do servidor — nunca dos
argumentos do modelo. Se o `officeId` viesse na chamada da ferramenta, uma
injeção de prompt bastaria para ler dados de outro escritório.

| Ferramenta             | O que faz                                          |
| ---------------------- | -------------------------------------------------- |
| `buscar_em_documentos` | Busca semântica **entre** os documentos do cliente |
| `consultar_processos`  | Processos com número, status e fase                |
| `consultar_agenda`     | Próximos compromissos                              |
| `horarios_disponiveis` | Janelas de atendimento                             |
| `acionar_atendente`    | Encaminha para uma pessoa                          |

O bloco estático do prompt — identidade, serviços, agenda, perguntas frequentes
— fica em cache por 15 minutos. O sistema anterior o remontava a cada mensagem,
com 7 consultas ao banco por interação. Manter o prefixo idêntico também
habilita o desconto de cache da própria OpenAI.

---

## Worker

Processo separado, mesmo código da API. Sobe com:

```bash
pnpm --filter @cacia/api start:worker
```

| Fila                   | O que processa                                                  |
| ---------------------- | --------------------------------------------------------------- |
| `envio-whatsapp`       | Envio de mensagens, com queda para a Evolution se o WAHA falhar |
| `lembretes`            | Disparo dos avisos de compromisso e prazo                       |
| `atualizacao-processo` | Retorno da consulta processual                                  |

Uma tarefa agendada varre os lembretes vencidos a cada minuto e os enfileira.
A corretude **não depende dessa frequência**: como a busca não tem janela de
tempo, um ciclo perdido apenas atrasa o aviso.

Os processadores só existem no processo do worker. Se a API os carregasse, cada
instância dela também consumiria as filas — e a varredura aconteceria uma vez
por instância, não uma vez por minuto.

---

## Infraestrutura

| Serviço      | Onde               | Por quê                               |
| ------------ | ------------------ | ------------------------------------- |
| API e worker | Fly.io `gru`       | Já configurado                        |
| WAHA         | Fly.io, com volume | Sessões em disco; não pode dormir     |
| Qdrant       | Fly.io, com volume | Vetor é dado derivado — reprocessável |
| PostgreSQL   | Gerenciado         | Dado perdido não volta                |
| Redis        | Gerenciado         | Filas e memória quente                |
| Frontends    | Cloudflare Workers | OpenNext                              |

Detalhes de provisionamento em [`infra/README.md`](infra/README.md).

O deploy é por caminho alterado: mexer no frontend não republica a API. As
migrations rodam **antes** do deploy — código novo pode depender de coluna nova,
mas código antigo nunca depende de coluna que ainda não existe.

## Observabilidade

- **Sentry** para erros 5xx, com remoção de credenciais e do corpo dos webhooks
  antes do envio — eles carregam mensagens de clientes, que são sigilosas
- **Rate limit** por IP, avaliado antes da autenticação: uma enxurrada sem token
  não pode custar uma consulta ao banco cada
- **Swagger** em `/docs`, apenas fora de produção

---

## Contribuindo

Fluxo de trabalho, padrão de commits e critérios de revisão:
[docs/CONTRIBUINDO.md](docs/CONTRIBUINDO.md).

---

## Licença

Software proprietário. Todos os direitos reservados.
