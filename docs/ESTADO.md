# Estado da reconstrução

> Atualizado em 04/09/2026, ao fim das fases 0 a 5.

Documento de acompanhamento: o que foi feito, o que mudou em relação ao
[plano original](ARQUITETURA.md) e o que continua pendente.

---

## Em números

|                                |                                                               |
| ------------------------------ | ------------------------------------------------------------- |
| Pull requests integrados       | 15                                                            |
| Entidades no banco             | 28                                                            |
| Arquivos TypeScript na API     | 132                                                           |
| Testes automatizados           | 116                                                           |
| Cobertura de verificação no CI | formatação, lint, tipos, build, testes, migrations, auditoria |

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

116 testes cobrem o que tem risco: isolamento entre tenants, memória da IA,
lembretes, proxy, webhooks, fragmentação. Falta cobrir o caminho feliz dos CRUDs
e testes de ponta a ponta.

### Migração de dados

Não se aplica — a decisão foi começar com base limpa. Se algum dado do sistema
antigo precisar ser trazido, é um trabalho à parte, e as divergências entre as
quatro cópias dos schemas antigos estão documentadas nos PRs #2 e #5.

### Avaliação da IA

Não há conjunto de casos que impeça regressão de qualidade nas respostas. É o
próximo passo natural agora que a memória e o prompt estão estáveis.

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
