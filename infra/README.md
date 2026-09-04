# Infraestrutura

Serviços que rodam no Fly.io fora da aplicação.

## WAHA

```bash
fly apps create cacia-waha
fly volumes create waha_sessions --size 3 --region gru -a cacia-waha
fly secrets set WAHA_API_KEY="<chave>" -a cacia-waha
fly deploy -c infra/waha/fly.toml
```

**O volume é obrigatório.** As credenciais de sessão do WhatsApp ficam em disco;
sem ele, todo restart derruba as sessões e exige novo QR Code de cada número.

A máquina não pode dormir (`auto_stop_machines = "off"`): o WAHA mantém socket
aberto com o WhatsApp.

Uma máquina só — o volume é preso a ela e duas instâncias não compartilham
sessão. O ponto único de falha é mitigado pelo fallback para a Evolution, que já
existe na aplicação.

## Qdrant

```bash
fly apps create cacia-qdrant
fly volumes create qdrant_storage --size 5 --region gru -a cacia-qdrant
fly secrets set QDRANT__SERVICE__API_KEY="<chave>" -a cacia-qdrant
fly deploy -c infra/qdrant/fly.toml
```

Auto-hospedar aqui é seguro, diferente do banco principal: **vetor é dado
derivado**. Perder o Qdrant significa reprocessar embeddings a partir dos
documentos — custa tempo, não perde informação.

## PostgreSQL e Redis

Gerenciados, deliberadamente. Ver a seção de riscos em
[`../docs/ARQUITETURA.md`](../docs/ARQUITETURA.md): API lenta se conserta, dado
perdido não volta.
