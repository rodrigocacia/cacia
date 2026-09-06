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

Auto-hospedar aqui é seguro, diferente do banco principal: **vetor é dado
derivado**. Perder o Qdrant significa reprocessar embeddings a partir dos
documentos — custa tempo, não perde informação. É o que torna as duas opções
abaixo igualmente defensáveis.

### Em desenvolvimento

Sobe junto com o resto, pelo `docker-compose.yml` da raiz:

```bash
docker compose up -d qdrant
```

Sem chave: `QDRANT_API_KEY` fica vazia e o contêiner aceita conexão local. A
coleção e os índices de payload são criados pela própria aplicação ao subir —
não há passo de provisionamento.

### Em staging e produção — Qdrant Cloud

O caminho mais curto. Crie o cluster em <https://cloud.qdrant.io>, gere a chave
e aponte duas variáveis:

```bash
QDRANT_URL=https://<id>.<regiao>.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=<a chave do cluster>
```

Nada além disso muda: a aplicação cria a coleção no primeiro boot, com as
mesmas dimensões e índices. O plano gratuito tem 1 GB, que comporta na casa das
centenas de milhares de trechos no tamanho que usamos.

### Em staging e produção — auto-hospedado no Fly

Alternativa, se preferir manter os vetores na mesma infraestrutura:

```bash
fly apps create cacia-qdrant
fly volumes create qdrant_storage --size 5 --region gru -a cacia-qdrant
fly secrets set QDRANT__SERVICE__API_KEY="<chave>" -a cacia-qdrant
fly deploy -c infra/qdrant/fly.toml
```

### Ao trocar de instância

Os vetores NÃO viajam junto — e não precisam. O que reconstrói é a varredura
de indexação, que procura documentos em `PENDING`:

```sql
UPDATE documents SET vector_status = 'PENDING', vector_chunks_count = 0
WHERE deleted_at IS NULL AND content_url IS NOT NULL;
```

O worker reprocessa em lotes, de dez em dez minutos. Os fatos da memória da IA
(tabela `marks`) precisam do mesmo tratamento — apagar `vector_id` faz com que
sejam reindexados quando a conversa voltar a acontecer.

O custo é o das chamadas de embedding, não uma janela de indisponibilidade: até
terminar, a busca devolve menos resultados, não resultados errados.

## PostgreSQL e Redis

Gerenciados, deliberadamente. Ver a seção de riscos em
[`../docs/ARQUITETURA.md`](../docs/ARQUITETURA.md): API lenta se conserta, dado
perdido não volta.
