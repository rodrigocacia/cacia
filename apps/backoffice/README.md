# cacia-web-backoffice — Administração CacIA

> Frontend administrativo da plataforma CacIA (AdvAI).

**Versão:** 1.0.1  
**Framework:** Next.js 15  
**UI:** React 19, Tailwind 4, Recharts

---

## Índice

- [Descrição](#descrição)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando](#executando)
- [Documentação](#documentação)

---

## Descrição

Interface para equipe AdvAI gerenciar escritórios, planos, assinaturas e métricas da plataforma.

Consome **cacia-api-backoffice**.

---

## Instalação

```bash
npm install
```

Crie `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3004
```

---

## Executando

```bash
npm run dev
# Sugestão local: npx next dev -p 3005

npm run build
npm run start
```

---

## Stack

- Next.js App Router
- SWR, React Hook Form, Zod
- Radix UI, Framer Motion
- Recharts (gráficos admin)

---

## Documentação

- [Hub CacIA](../../README.md)
- [Setup](../../Docs/SETUP_GUIDE.md)
- [Deploy](../../Docs/DEPLOYMENT.md)
