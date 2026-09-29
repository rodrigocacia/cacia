# cacia-web-main — Painel do Advogado

> Frontend Next.js para gestão do escritório, onboarding e configuração da CacIA.

**Versão:** 1.0.0  
**Framework:** Next.js 15 (App Router)  
**UI:** React 19, Tailwind CSS 4, Radix UI

---

## Índice

- [Descrição](#descrição)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando](#executando)
- [Estrutura](#estrutura)
- [Documentação](#documentação)

---

## Descrição

Painel web usado pelo advogado para gerenciar leads, clientes, processos, documentos, agenda e configurar agentes IA + WhatsApp.

Consome **cacia-api-main** via `NEXT_PUBLIC_API_URL`.

---

## Funcionalidades

| Rota         | Função                                      |
| ------------ | ------------------------------------------- |
| `/dashboard` | Métricas e resumo                           |
| `/lead`      | Funil comercial                             |
| `/customer`  | Clientes                                    |
| `/process`   | Processos jurídicos                         |
| `/document`  | Documentos                                  |
| `/event`     | Agenda                                      |
| `/setting/*` | Configurações (IA, WhatsApp, serviços, FAQ) |
| `/onboard`   | Wizard de implantação (8 passos)            |
| `/chatbot/*` | Personalização atendimento                  |
| `/support`   | Ajuda                                       |

---

## Instalação

```bash
npm install
```

Crie `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Configuração

| Variável                    | Descrição                                                              |
| --------------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`       | URL da cacia-api-main                                                  |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | E-mail de suporte exibido em /support; sem ela, a tela avisa que falta |

Autenticação: JWT em cookie/session via rotas `/api/auth/*` do Next.js.

---

## Executando

```bash
npm run dev
# Padrão: porta 3000 — use -p 3003 se api-main estiver na 3000:
npx next dev -p 3003 -H 0.0.0.0

npm run build
npm run start
```

---

## Estrutura

```
src/
├── app/(cacia)/
│   ├── (auth)/signin, forgot-password
│   ├── (onboard)/onboard
│   └── (with-sidebar)/dashboard, lead, customer, ...
├── components/
│   ├── app-sidebar/
│   └── ui/
├── http/              # clientes API
├── stores/            # Zustand (onboarding)
└── types/
```

---

## Documentação

- [Hub CacIA](../../README.md)
- [Setup](../../Docs/SETUP_GUIDE.md)
- [API consumida](../../Docs/API_DOCUMENTATION.md)
