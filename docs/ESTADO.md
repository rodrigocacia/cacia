# Estado da reconstrução

> Atualizado em 04/09/2026, após a cobertura da camada de IA.

Documento de acompanhamento: o que foi feito, o que mudou em relação ao
[plano original](ARQUITETURA.md) e o que continua pendente.

---

## Em números

|                                |                                                                    |
| ------------------------------ | ------------------------------------------------------------------ |
| Pull requests integrados       | 17                                                                 |
| Entidades no banco             | 28                                                                 |
| Arquivos TypeScript na API     | 132                                                                |
| Testes automatizados           | 270 — 153 unitários e 117 de ponta a ponta                         |
| Cobertura de verificação no CI | formatação, lint, tipos, build, testes, E2E, migrations, auditoria |

Ponto de partida: **0,6% de cobertura de testes e zero pipelines de CI**.

---

## Os achados do diagnóstico

Cada um com o estado atual.

| #   | Achado                                            | Estado                           |
| --- | ------------------------------------------------- | -------------------------------- |
| 1   | IA esquece a conversa em ~5 turnos                | ✅ Memória em três camadas       |
| 2   | Proxy residencial nunca aplicado                  | ✅ Aplicado na criação da sessão |
| 3   | Prompt remontado a cada mensagem, com 7 consultas | ✅ Bloco estático em cache       |
| 4   | Lembretes perdidos pela janela de 5 minutos       | ✅ Busca sem janela              |
| 5   | Lembrete enviado antes de marcar, duplicava       | ✅ Reserva atômica               |
| 6   | Status de lembrete nunca virava `SENT`            | ✅ Corrigido, com rota de falhas |
| 7   | Processos consultados uma única vez               | ✅ Monitoramento contínuo        |
| 8   | RAG só buscava dentro de um documento             | ✅ Busca entre documentos        |
| 9   | Arquivos em base64 dentro da tabela               | ✅ Storage, com link temporário  |
| 10  | Isolamento entre escritórios só por convenção     | ✅ Garantido no banco e no guard |
| 11  | `KEYS *` bloqueante no Redis                      | ✅ Não existe no código novo     |
| 12  | Sem CI, sem testes, sem observabilidade           | ✅ Todos os três                 |

Ponto 12, com detalhe: a suíte de ponta a ponta encontrou um defeito de
produção que nenhum teste unitário pegaria — ver mais abaixo.

---

## O que mudou em relação ao plano

Três decisões foram revistas com informação que só apareceu durante a execução.

### 1. Frontends: exportação estática não é viável agora

**No plano:** converter para exportação estática e publicar no Cloudflare Pages,
descrito como "refactor modesto de cinco pontos de autenticação".

**A medição correta:**

```
apps/web         64 arquivos com Server Actions · 42 páginas · 41 rotas dinâmicas
apps/backoffice  21 arquivos com Server Actions · 12 páginas
```

O levantamento original errou: a busca por `'use server'` usou aspas simples, e
o código usa aspas duplas. As páginas são Server Components que buscam dados no
servidor e hidratam o SWR — convertê-las exige refazer a camada de dados de 54
páginas.

**Decisão:** mantidos no Cloudflare Workers via OpenNext, que já funciona e é o
caminho recomendado pela Cloudflare para Next.js com renderização no servidor.
No volume atual, igualmente gratuito.

### 2. Isolamento entre escritórios precisou de mais que rótulo

**No plano:** `office_id` obrigatório e índices compostos.

**O que a auditoria adversarial comprovou:** isso não bastava. Com chaves
estrangeiras simples, um `Message` com `office_id = A` dentro de um `Chat` de
`office_id = B` era aceito pelo banco — e um `DELETE` legítimo do escritório B
destruía a mensagem rotulada como de A.

**Correção:** 11 modelos pai declaram `@@unique([id, officeId])` e 39 chaves
estrangeiras referenciam esse par. Os ataques foram reexecutados contra o schema
corrigido e ambos são recusados.

### 3. Sondagem de proxy não funcionaria como estava

Ao portar, a tradução direta do código antigo usaria a opção `agent` do `fetch`
— que o Node **ignora silenciosamente**. A sondagem sairia sem proxy e
retornaria sucesso, validando um proxy que nunca foi testado. Trocado pelo
dispatcher do undici.

---

## Pendente

### Frontends

A camada de dados continua em Server Actions. Migrar para busca client-side
destrava a exportação estática e o Cloudflare Pages, mas é um projeto próprio —
54 páginas, com implicações visuais que precisam de revisão humana.

### Cobertura de testes

Coberto: isolamento entre escritórios (no banco, no guard e agora rota por rota
sobre HTTP), memória da IA, lembretes, proxy, webhooks, fragmentação, o ciclo
completo dos CRUDs, validação de entrada, paginação, papéis e limite de
requisições.

Falta: o caminho da conversa de ponta a ponta — webhook do WhatsApp até a
resposta enviada. Ele depende de dublar o modelo de linguagem, e um dublê que
sempre responde a mesma coisa verifica pouco. É trabalho de par com a avaliação
da IA, abaixo.

### Migração de dados

Não se aplica — a decisão foi começar com base limpa. Se algum dado do sistema
antigo precisar ser trazido, é um trabalho à parte, e as divergências entre as
quatro cópias dos schemas antigos estão documentadas nos PRs #2 e #5.

### Avaliação da IA

**O que passou a ser coberto:** tudo o que é nosso na conversa. O laço de
ferramentas do agente com o modelo dublado por respostas roteirizadas, cada
ferramenta presa ao escritório do contexto, a memória em três camadas ao longo
de uma conversa de cem turnos contra Redis e Postgres reais, e o prompt montado
a partir dos dados reais do escritório.

**O que continua fora:** a qualidade do texto que o modelo produz. Medir isso
exige chamar a API de verdade, com um conjunto de casos julgados por alguém que
conheça o atendimento do escritório — e o resultado é uma nota, não um
passa/não passa que possa reprovar um PR. É trabalho de par com o cliente, não
de CI.

A distinção importa: uma regressão de qualidade quase sempre vem de uma
mudança nossa — uma regra que sumiu do prompt, um fato que a memória deixou de
recuperar, uma ferramenta que parou de ser oferecida. Essas três agora têm
teste.

---

## Defeitos encontrados pelos testes

Registrados porque nenhum deles aparecia antes, e é isso que justifica as
suítes existirem.

**A busca por texto devolvia a base inteira.** Em clientes e em processos, o
termo era limpo com `replace(/\D/g, '')` para casar com CPF ou número do
processo. Um termo sem dígitos — "Maria" — virava `contains: ''`, e no
Postgres todo texto contém a string vazia: a cláusula casava com tudo. Quem
buscasse por nome recebia a listagem completa em vez do resultado. Corrigido:
o trecho numérico só entra quando há dígitos.

**A aplicação não subia no ambiente de teste.** O esbuild, que o Vitest usa
por padrão, apaga os metadados de tipo dos decorators. Sem eles o Nest não
sabe o que injetar e todo construtor recebe `undefined`. Trocado pelo SWC.

**A invalidação do cache do prompt não era chamada por ninguém.** O
`PromptService.invalidar()` existia e estava documentado como "chamado quando
serviços, agenda ou perguntas mudam" — mas nenhum serviço o chamava. Na
prática, mudar o horário de atendimento ou o nome do escritório levava até 15
minutos para chegar ao agente, sem nenhum sinal de que algo estava
desatualizado. Ligado em `CalendarsService` e `OfficesService`.

**Dois testes existentes não compilavam.** O `tsconfig` de build exclui
`*.spec.ts`, então nenhum teste passava pela verificação de tipos: um deles
construía um serviço com um argumento em vez de três, o outro passava `null`
onde o tipo dizia `string | undefined`. Ambos passavam em execução por acaso.
Corrigidos, e agora há um `tsconfig.test.json` que verifica os testes junto.

---

## Como retomar

```bash
docker compose up -d
pnpm install
cp .env.example .env          # preencha o que estiver marcado [obrigatória]
pnpm --filter @cacia/database migrate:deploy
pnpm dev
```

O provisionamento do WAHA e do Qdrant está em [`../infra/README.md`](../infra/README.md).

Antes de publicar em produção, configure os secrets do GitHub que o
[workflow de deploy](../.github/workflows/deploy.yml) espera: `FLY_API_TOKEN`,
`DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e
`NEXT_PUBLIC_API_URL`.
