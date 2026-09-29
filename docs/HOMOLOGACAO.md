# Homologação: o que falta para o cliente testar de casa

> Levantado em 28/09/2026, depois da rodada de testes pela interface.
> O ambiente local está funcional e coberto por testes (313 E2E, ~300
> unitários). O que falta é **um ambiente acessível pela internet** e as
> integrações que só dá para provar com credenciais reais.

Hoje **não existe homologação nem produção**: não há app no Fly, projeto no
Cloudflare, bucket de storage nem secrets cadastrados. O deploy é manual, de
propósito (ver `.github/workflows/deploy.yml`).

---

## 1. Decisões e contas (dependem do cliente ou da WG)

| #   | Item                                                                                         | Situação                                              |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Domínios: um para o app, um para o backoffice, um para a API (ex.: `app.`, `admin.`, `api.`) | a definir                                             |
| 2   | Conta Cloudflare (Workers para os fronts + **R2** para arquivos)                             | a criar/ceder acesso                                  |
| 3   | Conta Fly.io, região `gru` (API, worker, WAHA)                                               | a criar/ceder acesso                                  |
| 4   | Postgres gerenciado                                                                          | a contratar (Fly Postgres ou outro)                   |
| 5   | Redis gerenciado com TLS (Upstash)                                                           | a contratar                                           |
| 6   | Qdrant Cloud (plano gratuito de 1 GB basta)                                                  | a criar                                               |
| 7   | Chaves de IA com limite de gasto: DeepSeek (principal) e OpenAI (reserva e embeddings)       | a fornecer                                            |
| 8   | Evomi (proxy residencial do WhatsApp)                                                        | chave a fornecer                                      |
| 9   | Evolution API (fallback do WhatsApp)                                                         | URL e chave a fornecer, ou decidir não usar           |
| 10  | Judit (acompanhamento processual)                                                            | chave a fornecer                                      |
| 11  | **Brevo** para e-mail (código de recuperação de senha)                                       | a implementar — ver seção 4                           |
| 12  | Número de WhatsApp **exclusivo para teste**, com chip ativo                                  | a fornecer                                            |
| 13  | Cobrança (gateway de pagamento)                                                              | fora do escopo desta entrega — o sistema funciona sem |

**Sem DigitalOcean**: o storage passou a ser genérico S3; em produção,
Cloudflare R2.

---

## 2. Provisionar (uma vez por ambiente)

Fazer tudo com sufixo `-hml` (ex.: `cacia-api-hml`) para homologação não
encostar em produção.

1. **Postgres**: criar o banco e aplicar as migrations a partir da raiz:
   `DATABASE_URL=... pnpm db:migrate`.
2. **Redis** (Upstash): anotar host, porta, senha; `REDIS_TLS=true`.
3. **Qdrant Cloud**: `QDRANT_URL` + `QDRANT_API_KEY`. A coleção é criada no
   primeiro boot.
4. **R2**: criar o bucket (privado) e um token "Object Read & Write".
   `STORAGE_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com`,
   `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`,
   `STORAGE_REGION=auto`.
5. **WAHA** no Fly, com volume (`infra/README.md`). Sem volume, todo restart
   pede QR Code de novo.
6. **API e worker** no Fly (`apps/api/fly.api.toml`, `fly.worker.toml`) com
   os secrets abaixo. O worker é o **mesmo código** e é obrigatório: sem ele a
   IA não responde, lembretes não saem e a importação de planilha não roda.
7. **Web e backoffice** no Cloudflare Workers (`pnpm --filter @cacia/web
cf:deploy`, idem backoffice) com `NEXT_PUBLIC_API_URL` apontando para a API
   e `NEXT_PUBLIC_APP_URL` para o próprio app.
8. **Primeiro administrador da plataforma**: não há tela para isso. Cadastrar
   pela tela de cadastro (ou `POST /auth/register`) e promover no banco:
   `UPDATE users SET role = 'admin' WHERE email = '...';`
9. **Webhook do WAHA**: `APP_WEBHOOK_URL` precisa ser a URL pública da API, e
   o WAHA precisa conseguir chamá-la.

### Secrets da API e do worker

Obrigatórios: `WEBSITE_URL` (domínio do app — é a origem liberada no CORS),
`APP_WEBHOOK_URL`, `JWT_SECRET` (`openssl rand -base64 48`), `DATABASE_URL`,
`REDIS_HOST`/`PORT`/`PASSWORD`/`TLS`, `CACIA_TOOL_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`,
`QDRANT_URL`/`QDRANT_API_KEY`, `STORAGE_*`.

Por integração: `WAHA_API_URL`/`WAHA_API_KEY`, `EVOLUTION_API_URL`/`KEY`,
`EVOMI_API_KEY`, `JUDIT_API_KEY`, `SENTRY_DSN` (recomendado).

Referência completa, com o que cada uma faz: `.env.example`.

### Cuidados

- **Pixel do Facebook**: o app dispara o pixel em qualquer domínio. Em
  homologação ele registraria eventos de teste no pixel real de anúncios —
  desligar no ambiente de teste.
- `NODE_ENV=production` desliga o Swagger (`/docs`).
- O workflow de deploy usa um environment só (`producao`). Criar
  `homologacao` com os próprios secrets antes de reativar o gatilho.

---

## 3. Roteiro de testes em homologação

O que **já foi testado localmente e passou** não precisa de reteste
detalhado — basta um passeio: cadastro de conta, onboarding, leads (funil,
ficha, importação CSV, conversão em cliente), clientes, processos,
documentos, agenda, configurações, perfil, backoffice.

O que **só dá para provar lá**, com as integrações reais:

### WhatsApp (o coração do produto)

- [ ] Criar conexão em Configurações > WhatsApp e ler o QR Code com o número de teste
- [ ] Conferir em `GET /connections/no-proxy` que a conexão **tem** proxy residencial (Evomi) na cidade/estado do escritório
- [ ] Mandar mensagem de outro celular → lead criado sozinho no funil, etapa "Novo"
- [ ] **A IA responde** no WhatsApp, com a saudação e o estilo configurados no onboarding
- [ ] Três mensagens seguidas geram **uma** resposta que considera as três
- [ ] Perguntar algo que está nas Dúvidas frequentes → resposta usa o que foi cadastrado
- [ ] Perguntar valor da consulta → valor certo (R$ 250,00 e não R$ 25.000)
- [ ] Pedir para agendar → IA oferece só horários livres da agenda e o compromisso aparece em Eventos
- [ ] Pedir para falar com uma pessoa → conversa sai do automático e o escritório é notificado
- [ ] Tela Conversas: a mensagem do contato aparece em até 5 s; responder pela tela chega no celular do contato e fica com ✓
- [ ] Responder pela tela tira a conversa da IA; "Devolver para a IA" faz a IA voltar a responder
- [ ] Com o WhatsApp desconectado, a tela avisa e não finge que enviou
- [ ] Enviar PDF e imagem pela tela → chegam no celular do contato (o link temporário do R2 precisa ser acessível pelo WAHA)
- [ ] Gravar áudio pela tela (Chrome e Safari do iPhone) → chega como mensagem de voz tocável (depende do `convert` do `sendVoice` na versão do WAHA instalada)
- [ ] Contato manda foto, PDF e áudio → aparecem na tela e abrem (a mídia é copiada do WAHA para o storage)
- [ ] Advogado responde pelo **celular** → a mensagem aparece na tela como da equipe e a IA para naquela conversa
- [ ] Mensagem enviada mostra ✓, depois ✓✓ quando chega no aparelho, e ✓✓ azul quando o contato lê
- [ ] A sessão do WAHA foi criada com os eventos `message.any` e `message.ack` (sessões criadas antes de 29/09 só assinam `message` e precisam ser recriadas)
- [ ] Conversa longa (20+ mensagens) → a IA lembra do que foi dito no início
- [ ] Mandar áudio e imagem → a IA entende
- [ ] Desligar o WAHA → envio cai para a Evolution (se contratada)
- [ ] Reiniciar a máquina do WAHA → sessão continua conectada, sem novo QR

### Lembretes e notificações

- [ ] Compromisso para daqui a 1h com lembrete de 30 min → mensagem chega no WhatsApp do cliente na hora certa
- [ ] Notificações do advogado ligadas em Configurações → avisos de lead novo e de evento chegam

### Documentos e IA

- [ ] Enviar PDF de contrato → status de indexação vira concluído (não "falhou")
- [ ] Perguntar à IA sobre o conteúdo do contrato → responde com base nele
- [ ] Baixar o documento pelo link (expira em 15 min)

### Processos (Judit)

- [ ] Cadastrar processo real → sai de "Atualizando..." e mostra partes, tribunal e andamentos
- [ ] Novo andamento chega sozinho (webhook) e notifica
- [ ] Excluir processo → para o monitoramento (sem custo contínuo na Judit)

### E-mail (depois do Brevo)

- [ ] "Esqueci minha senha" → código chega por e-mail → senha redefinida → login com a nova

### Acesso de fora

- [ ] Cliente abre o app **pelo celular** em rede externa (4G) e faz login
- [ ] Backoffice só aceita administrador da plataforma
- [ ] Dois escritórios distintos não enxergam dados um do outro (já provado nos testes automáticos; repetir uma vez com dados reais)

---

## 4. Pendências de produto conhecidas

Não impedem homologação, mas o cliente vai perguntar:

1. **Tela de conversas**: feita em 28–29/09 (menu Conversas, `/chat`). Lê e
   responde texto, arquivo, imagem e áudio gravado no navegador; mostra o
   que o advogado manda pelo próprio celular; mostra enviada, entregue e
   lida. Só dá para provar de ponta a ponta com número real (seção 3).
2. **E-mail de recuperação de senha**: o código é gerado e não é enviado
   (TODO no `auth.service`). Implementar com Brevo — combinado para o fim.
3. **Cobrança**: não reimplementada; o login não bloqueia por assinatura.
4. **Suporte**: a tela não envia nada; precisa de um e-mail/canal de
   atendimento definido (`NEXT_PUBLIC_SUPPORT_EMAIL`).
5. **Excluir lead**: não existe (também não existia antes); o caminho é mover
   para "Perdido".
