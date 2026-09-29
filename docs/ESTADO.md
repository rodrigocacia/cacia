# Estado da reconstrução

> Atualizado em 10/09/2026, após o CRM.

Documento de acompanhamento: o que foi feito, o que mudou em relação ao
[plano original](ARQUITETURA.md) e o que continua pendente.

---

## Em números

|                                |                                                                    |
| ------------------------------ | ------------------------------------------------------------------ |
| Pull requests integrados       | 23                                                                 |
| Entidades no banco             | 35                                                                 |
| Testes automatizados           | 644 — 246 unitários na API, 292 de ponta a ponta e 106 nos fronts  |
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

Quatro decisões foram revistas com informação que só apareceu durante a
execução.

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

### 2. Os frontends nunca falaram com a API nova

**No plano:** importar os frontends e apontá-los para a API unificada.

**O que estava acontecendo:** eles foram importados e ficaram apontando para o
contrato do sistema antigo. Caminhos no singular (`customer`, não `customers`),
`office_id` na query e no corpo, resposta em formato de página do Mongo, campos
em snake_case com `_id`.

Nenhuma tela funcionava. Não era degradação — era 404 e 400 em toda chamada.
Some-se a isso que a API não expunha seis recursos que a interface chamava, e
que o painel administrativo precisava de um domínio inteiro que não existia.

**Decisão:** a tradução acontece num lugar só, `src/http/adaptador.ts`, ligado
ao cliente HTTP. A alternativa seria trocar `_id` por `id` e snake_case por
camelCase nos ~160 componentes que leem esses campos — uma refatoração de
interface inteira, sem ninguém para conferir o resultado na tela.

Dentro dessa fronteira o frontend continua falando a língua que sempre falou.

### 3. Isolamento entre escritórios precisou de mais que rótulo

**No plano:** `office_id` obrigatório e índices compostos.

**O que a auditoria adversarial comprovou:** isso não bastava. Com chaves
estrangeiras simples, um `Message` com `office_id = A` dentro de um `Chat` de
`office_id = B` era aceito pelo banco — e um `DELETE` legítimo do escritório B
destruía a mensagem rotulada como de A.

**Correção:** 11 modelos pai declaram `@@unique([id, officeId])` e 39 chaves
estrangeiras referenciam esse par. Os ataques foram reexecutados contra o schema
corrigido e ambos são recusados.

### 4. Sondagem de proxy não funcionaria como estava

Ao portar, a tradução direta do código antigo usaria a opção `agent` do `fetch`
— que o Node **ignora silenciosamente**. A sondagem sairia sem proxy e
retornaria sucesso, validando um proxy que nunca foi testado. Trocado pelo
dispatcher do undici.

---

## Pendente

### Frontends: a revisão visual

O contrato está provado: caminho, cabeçalho, corpo e formato da resposta têm
teste, e os dois aplicativos compilam. **Nenhum teste abre a aplicação e
olha.**

É o que falta antes de produção: percorrer as telas. A lista curta do que mais
merece atenção, porque foi onde a tradução exigiu decisão e não apenas
mecânica:

- cadastro e edição de cliente, com endereço
- criação de compromisso com lembretes
- envio e edição de documento
- as telas de configuração (serviços, perguntas, consulta, notificações)
- o cadastro de escritório no painel administrativo, que ganhou campos novos

### Frontends: exportação estática

A camada de dados continua em Server Actions. Migrar para busca client-side
destrava a exportação estática e o Cloudflare Pages, mas é um projeto próprio —
54 páginas, com implicações visuais que precisam de revisão humana. Segue sendo
uma decisão sua, agora sem urgência: os dois aplicativos funcionam nos Workers.

### Cobrança

**Não foi reimplementada.** O sistema anterior cobrava por PIX através da
iopay. A reconstrução não trouxe a integração: não há gateway configurado, nem
rota na API, nem decisão tomada sobre qual provedor usar.

O que mudou por causa disso, e está visível no código:

- **o login não bloqueia mais por assinatura.** O bloqueio existia e, mantido,
  travaria todo acesso — não há caminho para criar uma assinatura neste
  sistema. Voltará junto com o meio de pagamento.
- **as funções de assinatura devolvem falha explícita** em vez de chamarem um
  endpoint que não existe
- **o painel administrativo mostra "Indisponível"** onde havia faturamento, e
  não R$ 0,00: zero se confunde com "nenhuma venda no período"
- **a listagem de recorrências devolve página vazia** com o motivo escrito

É a maior lacuna funcional que resta, e a única que depende de uma decisão
comercial antes de qualquer código.

### Cobertura de testes

Coberto: isolamento entre escritórios (no banco, no guard e agora rota por rota
sobre HTTP), memória da IA, lembretes, proxy, webhooks, fragmentação, o ciclo
completo dos CRUDs, validação de entrada, paginação, papéis e limite de
requisições.

O caminho da conversa também: do webhook do WhatsApp até a resposta
enfileirada para envio, com as filas de verdade.

Os dois frontends também: o adaptador que traduz entre o vocabulário da
interface e o da API, e o cliente HTTP contra um servidor de verdade.

Falta o que depende de um provedor externo respondendo — o pareamento de um
número no WAHA, uma consulta real na Judit. São verificáveis só em
homologação, com credenciais.

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

## CRM: funil, etiquetas, importação e agendamento

Acrescentado em 10/09/2026. O que existia era uma tabela de leads com três
situações fixas (`NEW`, `IN_CONTACT`, `CONVERTED`) e nenhuma tela de conversa —
o produto assumia que a IA resolvia tudo no WhatsApp e o escritório só via o
resultado. O que entrou:

### Funil configurável, com o `status` como projeção

`Pipeline` e `PipelineStage` por escritório; o enum `LeadStatus` **sobrevive**,
agora derivado da etapa por `projetarStatus`, num lugar só. A alternativa era
reescrever as telas antigas, os filtros e as ferramentas do agente que já liam
esse campo — uma refatoração de interface inteira por uma informação que elas
usam de forma grosseira.

`LeadStageHistory` grava cada passagem com o tempo na etapa anterior. Sem ela o
quadro mostraria onde o lead **está** e nada mais: não haveria tempo médio por
etapa nem taxa de conversão — que é o que distingue um funil de uma lista com
colunas.

### Sem lead duplicado

Entrou `@@unique([office_id, remotejid])`. Duas consequências que exigiram
trabalho além do índice:

- **A migration deduplica antes de criar o índice.** Não bastava excluir
  logicamente os repetidos — a unicidade ignora `deleted_at` (mesma decisão de
  `Customer`), então a linha perdedora precisa sair da tabela. Conversas,
  mensagens, eventos e documentos são repontados para o sobrevivente, e o que
  só o perdedor sabia (cliente vinculado, e-mail, briefing) é copiado antes.
- **O telefone passou a ser normalizado.** A tela gravava `(11) 98888-7777` e o
  webhook gravava `5511988887777@c.us`: o banco veria dois contatos onde há uma
  pessoa, que é exatamente o que a restrição foi criada para impedir.
- **O webhook restaura em vez de recriar.** Um número excluído que volta a
  escrever tem o lead reativado — criar outro estouraria a unicidade.

### Etiquetas, e por que não é `Mark`

`Mark` é memória do agente e vai para o Qdrant; usá-la como etiqueta poluiria o
RAG. Entraram `Tag` mais duas tabelas de junção — `LeadTag` e `CustomerTag` —
em vez de um alvo polimórfico `(tipo, id)`: alvo polimórfico não aceita chave
estrangeira, e é a chave composta com `office_id` que impede um filho de
apontar para pai de outro escritório. Duas tabelas custam menos que abrir mão
dessa garantia.

### Importação de CSV, em duas etapas

Prévia primeiro: o servidor lê o arquivo, detecta o separador e a codificação,
devolve as colunas com amostra e um palpite de mapeamento. Nada é gravado antes
de a pessoa confirmar. A escrita sai da requisição por uma fila nova
(`importacao-leads`) — cinco mil linhas não cabem no tempo de resposta de quem
clicou em confirmar, e um `timeout` no meio deixaria a base com metade da
planilha sem ninguém saber qual metade.

Duas armadilhas de planilha brasileira que o leitor resolve, e que nenhuma
biblioteca genérica acerta sozinha:

- **Separador.** O Excel em português exporta com `;`, porque a vírgula é o
  separador decimal. Adivinhar errado devolve uma planilha de uma coluna só.
- **Codificação.** O mesmo Excel exporta em Windows-1252. Decodificar tudo como
  UTF-8 transformaria "José" em texto corrompido — e entraria assim na base, em
  silêncio, porque não é erro de parse.

Linha repetida, dentro da planilha ou já existente na base, é **ignorada e
contada** — nunca duplicada. Reenviar a mesma planilha é seguro.

### Agendamento: a configuração que ninguém consultava

`CalendarAvailableDay` existia desde o início, com dois turnos por dia, e
nenhuma consulta a lia. Dava para marcar às três da manhã de um domingo, ou
dois atendimentos no mesmo horário, e o sistema aceitava os dois — quem
descobria era o cliente, na porta.

Entrou `GET /calendars/:id/availability`, que monta os horários livres a partir
dos turnos e desconta os compromissos existentes, e a recusa de conflito na
criação e na edição de compromisso. `permitirConflito` é a válvula de escape:
um prazo processual e uma reunião podem coincidir de propósito — o que não pode
é acontecer sem ninguém ter dito que tudo bem.

O fuso é calculado pelo `Intl`, não fixado em `-03:00`: o horário de atendimento
está gravado como texto (`"09:00"`), sem fuso, e uma constante erraria uma hora
em todos os agendamentos se o horário de verão voltasse.

### A IA no funil é decisão do escritório

`Setting.aiCanMoveLeadStage` e `Setting.aiCanTagLead`, **desligados por
padrão**. Um cartão que anda sozinho surpreende quem olha o quadro, e quando um
lead avançou é julgamento comercial.

Quando ligados, as ferramentas `mover_etapa` e `etiquetar` entram na lista
oferecida ao modelo, com os nomes reais das etapas e etiquetas na descrição — o
modelo não precisa adivinhar como a coluna se chama. A permissão é conferida
**duas vezes**: ao montar a lista e ao executar. Só na lista seria confiar que o
modelo não inventa um nome de ferramenta, e o nome dela viaja no texto que ele
produz.

O movimento feito pela IA grava `userId` nulo no histórico — é o que permite
reconhecer, na linha do tempo, um cartão que andou sozinho. A escrita passa pelo
`LeadsService`, nunca pelo Prisma direto: é lá que a projeção do status e o
registro no histórico acontecem.

### Frontend: uma fronteira nova em vez de mais dívida

As telas novas usam `api-crm`, um segundo cliente HTTP que **não** passa pelo
adaptador de vocabulário legado. O `api-client` traduz toda resposta para `_id`
e snake_case porque ~160 componentes leem os campos naquele formato; as telas de
funil, etiquetas e importação não têm componente antigo para preservar, e
fazê-las falar o dialeto do Mongo espalharia a dívida em vez de contê-la.

A regra passa a ser: código velho usa `api`, código novo usa `apiCrm`. A
autenticação é compartilhada (`http/autenticacao.ts`) — duas cópias dela seria
como um dos dois deixaria de mandar o cabeçalho do escritório.

Telas: quadro arrastável em `/lead?view=kanban`, ficha do lead em `/lead/[id]`,
assistente de importação em `/lead/import`, e três telas de configuração —
etapas do funil, etiquetas e os portões da IA.

### Defeitos que os testes novos encontraram

**A validação do telefone nunca reprovava nada.** O código normalizava e depois
validava; a normalização acrescenta `@c.us`, e a validação aceita qualquer coisa
com arroba por assumir que veio do WhatsApp. `9999` passava. Corrigido nos dois
pontos — cadastro e importação — e há um teste que prende justamente a ordem.

**`/leads/import` era engolido por `/leads/:id`.** O `@Get(':id')` casava com
"import" e a requisição morria no `ParseUUIDPipe` com 400. Registrar o módulo
antes no `app.module` não resolve: o `IaModule` importa o `LeadsModule`, e é o
grafo que determina a ordem real de registro das rotas. A rota virou
`/lead-imports` — depender de ordem de registro é uma amarra que se rompe
sozinha quando alguém acrescenta um import em outro módulo.

### O que continua pendente

A **tela de conversas** segue não existindo: a API tem `GET /chats`,
`/chats/:id/messages`, `audio-reply` e `close`, e nenhuma tela consome. É o
próximo passo combinado. Falta também um endpoint de **enviar** mensagem — hoje
só há ler e encerrar —, e a API não tem push, então a caixa de entrada precisará
de websocket ou polling.

---

## Peças construídas e nunca ligadas

Quatro, encontradas ao procurar quem chamava cada serviço. Todas passavam nos
testes de unidade, porque cada peça funcionava isolada — o que faltava era
justamente aquilo que nenhuma peça é.

| Peça                              | O efeito de não estar ligada                       |
| --------------------------------- | -------------------------------------------------- |
| `AgenteService.responder`         | a IA nunca respondia a ninguém                     |
| `DocumentsService.indexar`        | documento enviado nunca entrava na busca           |
| `PromptService.invalidar`         | mudar a agenda levava 15 min para chegar ao agente |
| `JuditService.pararMonitoramento` | processo excluído seguia sendo cobrado             |

E os frontends inteiros: importados, compilando, e apontando para um
contrato que a API não fala mais — ver "O que mudou em relação ao plano",
item 2.

E uma fila declarada, `atualizacao-processo`, sem ninguém publicando nem
consumindo. Virou `acompanhamento-processo`, com uma varredura que retoma o
monitoramento dos processos cadastrados enquanto a Judit estava fora do ar.

### A mais séria

**O agente nunca era chamado.** Uma mensagem chegava pelo webhook, o lead era
criado, a conversa era criada, a mensagem era gravada — e o sistema parava aí.
Não havia uma linha ligando o webhook ao agente.

Todas as peças existiam e estavam testadas: o agente, a memória em três
camadas, as ferramentas, a fila de envio. O que faltava era a costura — e um
teste de unidade não pega isso, porque cada peça funcionava.

Apareceu ao escrever o teste da conversa de ponta a ponta: ao procurar quem
chamava `AgenteService.responder`, a resposta foi ninguém.

O mesmo vale para os documentos: um arquivo enviado nascia `PENDING` e ficava
assim para sempre. Quem perguntasse ao agente sobre o contrato recém-enviado
receberia "nenhum trecho relevante encontrado" — a funcionalidade inteira
existia e não funcionava.

O elo é a fila `atendimento` e o `AtendimentoProcessor`. Três cuidados no
desenho, cada um por um motivo concreto:

- **Uma resposta por vez, por conversa.** Três mensagens seguidas geram três
  jobs; sem trava, o cliente receberia três respostas, e nenhuma teria visto
  as outras.
- **As mensagens pendentes vão juntas.** O turno é tudo o que a pessoa disse
  desde a última resposta — é o que faz "oi" / "tenho uma dúvida" / "sobre meu
  processo" virar uma pergunta só.
- **Quem está com atendente humano não recebe resposta automática.** A
  conversa sai de `ACTIVE` quando o agente aciona uma pessoa.

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

**Os dublês do WAHA e da Evomi tinham o formato errado.** O `configPadrao()`
devolvia `{ url }` onde o serviço real devolve `{ apiUrl }`, e o proxy vinha
com campos em português onde o real usa os da API. Passava despercebido
enquanto nenhum teste usava o valor; ao criar uma conexão de verdade, a
credencial gravada saía vazia.

**O corpo da requisição não estava sendo traduzido no frontend.** Dois hooks
em sequência no ky: o primeiro devolvia uma requisição nova com a query limpa,
e o segundo era construído sobre um corpo já consumido. Passava silenciosamente
— e toda criação e edição continuaria mandando `office_id`, recebendo 400.
Encontrado pelo teste do cliente contra um servidor HTTP de verdade, não por
leitura.

**O filtro `?status=false` devolvia os registros ativos** — o contrário do
pedido. `Boolean('false')` é `true` em JavaScript, e o `ValidationPipe` roda
com `enableImplicitConversion`. Havia um segundo efeito, pior: a ausência do
parâmetro também virava `false`, e a listagem sem filtro nenhum mostraria só os
inativos.

**Três defeitos no painel administrativo**, encontrados no inventário: `useMe`
chamava a API sem URL, sem token e sem tradução; `getCurrentOfficeId` lia um
cookie com nome diferente do que o cliente procurava; e `createOffice` mandava
`office_id` na query e no corpo, contrariando o próprio comentário do arquivo.

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
pnpm db:migrate
pnpm dev
```

O provisionamento do WAHA e do Qdrant está em [`../infra/README.md`](../infra/README.md).

Antes de publicar em produção, configure os secrets do GitHub que o
[workflow de deploy](../.github/workflows/deploy.yml) espera: `FLY_API_TOKEN`,
`DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`,
`NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_APP_URL`.

O roteiro para colocar a homologação no ar e o que só dá para testar lá, com
as integrações reais: [`HOMOLOGACAO.md`](HOMOLOGACAO.md).
