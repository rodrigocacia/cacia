-- Completa os escritórios criados sem o preparo padrão.
--
-- Até aqui, nenhum escritório criado no sistema novo recebia agentes — e sem
-- o de atendimento a primeira mensagem de WhatsApp não abre conversa. Os
-- criados pelo painel administrativo também nasciam sem funil.
--
-- Mesmas listas de apps/api/src/modules/offices/preparar-escritorio.ts e de
-- apps/api/src/modules/pipelines/funil-padrao.ts. Idempotente: só cria o que
-- falta, então rodar de novo não duplica.

INSERT INTO "agents" ("id", "office_id", "type", "style", "greeting", "created_at", "updated_at")
SELECT gen_random_uuid(), o."id", t.tipo::"agent_type", 'Formal Jurídico'::"agent_style",
       'Olá, como posso ajudar?', now(), now()
FROM "offices" o
CROSS JOIN (VALUES ('support'), ('personal')) AS t(tipo)
WHERE NOT EXISTS (
  SELECT 1 FROM "agents" a
  WHERE a."office_id" = o."id"
    AND a."type" = t.tipo::"agent_type"
    AND a."deleted_at" IS NULL
);

WITH novos AS (
  INSERT INTO "pipelines" ("id", "office_id", "name", "is_default", "created_at", "updated_at")
  SELECT gen_random_uuid(), o."id", 'Funil de vendas', true, now(), now()
  FROM "offices" o
  WHERE NOT EXISTS (SELECT 1 FROM "pipelines" p WHERE p."office_id" = o."id")
  RETURNING "id", "office_id"
)
INSERT INTO "pipeline_stages" ("id", "office_id", "pipeline_id", "name", "color", "position", "kind", "created_at", "updated_at")
SELECT gen_random_uuid(), n."office_id", n."id", e.nome, e.cor, e.posicao, e.tipo::"stage_kind", now(), now()
FROM novos n
CROSS JOIN (VALUES
  ('Novo',             '#3B82F6', 0, 'open'),
  ('Em contato',       '#8B5CF6', 1, 'open'),
  ('Proposta enviada', '#F59E0B', 2, 'open'),
  ('Ganho',            '#10B981', 3, 'won'),
  ('Perdido',          '#EF4444', 4, 'lost')
) AS e(nome, cor, posicao, tipo);
