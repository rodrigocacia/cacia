-- CreateEnum
CREATE TYPE "stage_kind" AS ENUM ('open', 'won', 'lost');

-- CreateEnum
CREATE TYPE "lead_source" AS ENUM ('whatsapp', 'manual', 'import', 'site', 'indicacao', 'other');

-- CreateEnum
CREATE TYPE "lead_import_status" AS ENUM ('preview', 'queued', 'running', 'done', 'failed', 'canceled');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "event_type" ADD VALUE 'call';
ALTER TYPE "event_type" ADD VALUE 'follow_up';

-- AlterEnum
ALTER TYPE "lead_status" ADD VALUE 'lost';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "expected_close_at" TIMESTAMP(3),
ADD COLUMN     "import_id" UUID,
ADD COLUMN     "lost_at" TIMESTAMP(3),
ADD COLUMN     "lost_reason" TEXT,
ADD COLUMN     "owner_id" UUID,
ADD COLUMN     "pipeline_id" UUID,
ADD COLUMN     "source" "lead_source" NOT NULL DEFAULT 'whatsapp',
ADD COLUMN     "source_detail" TEXT,
ADD COLUMN     "stage_changed_at" TIMESTAMP(3),
ADD COLUMN     "stage_id" UUID,
ADD COLUMN     "value" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "ai_can_move_lead_stage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ai_can_tag_lead" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "pipelines" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "pipeline_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "position" INTEGER NOT NULL,
    "kind" "stage_kind" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_stage_history" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "lead_id" UUID NOT NULL,
    "from_stage_id" UUID,
    "to_stage_id" UUID NOT NULL,
    "user_id" UUID,
    "seconds_in_previous_stage" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_tags" (
    "lead_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_tags_pkey" PRIMARY KEY ("lead_id","tag_id")
);

-- CreateTable
CREATE TABLE "customer_tags" (
    "customer_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("customer_id","tag_id")
);

-- CreateTable
CREATE TABLE "lead_imports" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "status" "lead_import_status" NOT NULL DEFAULT 'preview',
    "pipeline_id" UUID,
    "stage_id" UUID,
    "tag_ids" UUID[] DEFAULT ARRAY[]::UUID[],
    "mapping" JSONB,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "imported_rows" INTEGER NOT NULL DEFAULT 0,
    "skipped_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "lead_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipelines_office_id_deleted_at_idx" ON "pipelines"("office_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "pipelines_id_office_id_key" ON "pipelines"("id", "office_id");

-- CreateIndex
CREATE INDEX "pipeline_stages_office_id_pipeline_id_position_idx" ON "pipeline_stages"("office_id", "pipeline_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_id_office_id_key" ON "pipeline_stages"("id", "office_id");

-- CreateIndex
CREATE INDEX "lead_stage_history_office_id_lead_id_created_at_idx" ON "lead_stage_history"("office_id", "lead_id", "created_at");

-- CreateIndex
CREATE INDEX "lead_stage_history_office_id_to_stage_id_created_at_idx" ON "lead_stage_history"("office_id", "to_stage_id", "created_at");

-- CreateIndex
CREATE INDEX "tags_office_id_deleted_at_idx" ON "tags"("office_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_office_id_name_key" ON "tags"("office_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_id_office_id_key" ON "tags"("id", "office_id");

-- CreateIndex
CREATE INDEX "lead_tags_office_id_tag_id_idx" ON "lead_tags"("office_id", "tag_id");

-- CreateIndex
CREATE INDEX "customer_tags_office_id_tag_id_idx" ON "customer_tags"("office_id", "tag_id");

-- CreateIndex
CREATE INDEX "lead_imports_office_id_status_created_at_idx" ON "lead_imports"("office_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "lead_imports_id_office_id_key" ON "lead_imports"("id", "office_id");

-- CreateIndex
CREATE INDEX "leads_office_id_stage_id_last_activity_at_idx" ON "leads"("office_id", "stage_id", "last_activity_at");

-- CreateIndex
CREATE INDEX "leads_office_id_owner_id_idx" ON "leads"("office_id", "owner_id");

-- CreateIndex
CREATE INDEX "leads_office_id_import_id_idx" ON "leads"("office_id", "import_id");

-- CreateIndex
-- ---------------------------------------------------------------------------
-- Deduplicacao de leads antes do indice unico (office_id, remotejid)
--
-- Sem este passo a migration falha em qualquer base que ja tenha dois leads
-- com o mesmo numero no mesmo escritorio -- e o webhook do WhatsApp podia
-- criar exatamente isso, porque nada no banco impedia.
--
-- Nao basta excluir logicamente os repetidos: a unicidade ignora deleted_at,
-- entao a linha perdedora precisa sair da tabela. O historico dela nao se
-- perde -- conversas, mensagens, eventos e documentos sao repontados para o
-- lead sobrevivente antes da remocao.
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE leads_duplicados AS
SELECT id AS perdedor, sobrevivente
FROM (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY office_id, remotejid
      -- Sobrevive o ativo mais recente; se todos estiverem excluidos, o mais
      -- recente entre eles. O id no fim so desempata de forma estavel.
      ORDER BY (deleted_at IS NULL) DESC, created_at DESC, id
    ) AS sobrevivente
  FROM leads
) ranqueados
WHERE id <> sobrevivente;

-- O que so o perdedor sabia nao pode sumir junto com ele
UPDATE leads s
SET customer_id = COALESCE(s.customer_id, m.customer_id),
    email       = COALESCE(s.email, m.email),
    briefing    = COALESCE(s.briefing, m.briefing)
FROM (
  SELECT
    d.sobrevivente,
    (array_agg(l.customer_id) FILTER (WHERE l.customer_id IS NOT NULL))[1] AS customer_id,
    (array_agg(l.email)       FILTER (WHERE l.email       IS NOT NULL))[1] AS email,
    (array_agg(l.briefing)    FILTER (WHERE l.briefing    IS NOT NULL))[1] AS briefing
  FROM leads_duplicados d
  JOIN leads l ON l.id = d.perdedor
  GROUP BY d.sobrevivente
) m
WHERE s.id = m.sobrevivente;

UPDATE chats     c SET lead_id = d.sobrevivente FROM leads_duplicados d WHERE c.lead_id = d.perdedor;
UPDATE messages  x SET lead_id = d.sobrevivente FROM leads_duplicados d WHERE x.lead_id = d.perdedor;
UPDATE marks     k SET lead_id = d.sobrevivente FROM leads_duplicados d WHERE k.lead_id = d.perdedor;
UPDATE events    e SET lead_id = d.sobrevivente FROM leads_duplicados d WHERE e.lead_id = d.perdedor;
UPDATE documents o SET lead_id = d.sobrevivente FROM leads_duplicados d WHERE o.lead_id = d.perdedor;
UPDATE reminders r SET lead_id = d.sobrevivente FROM leads_duplicados d WHERE r.lead_id = d.perdedor;

DELETE FROM leads WHERE id IN (SELECT perdedor FROM leads_duplicados);

DROP TABLE leads_duplicados;

CREATE UNIQUE INDEX "leads_office_id_remotejid_key" ON "leads"("office_id", "remotejid");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_pipeline_id_office_id_fkey" FOREIGN KEY ("pipeline_id", "office_id") REFERENCES "pipelines"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_stage_id_office_id_fkey" FOREIGN KEY ("stage_id", "office_id") REFERENCES "pipeline_stages"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_owner_id_office_id_fkey" FOREIGN KEY ("owner_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_import_id_office_id_fkey" FOREIGN KEY ("import_id", "office_id") REFERENCES "lead_imports"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_office_id_fkey" FOREIGN KEY ("pipeline_id", "office_id") REFERENCES "pipelines"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_from_stage_id_office_id_fkey" FOREIGN KEY ("from_stage_id", "office_id") REFERENCES "pipeline_stages"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_to_stage_id_office_id_fkey" FOREIGN KEY ("to_stage_id", "office_id") REFERENCES "pipeline_stages"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_lead_id_office_id_fkey" FOREIGN KEY ("lead_id", "office_id") REFERENCES "leads"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_tag_id_office_id_fkey" FOREIGN KEY ("tag_id", "office_id") REFERENCES "tags"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_tags" ADD CONSTRAINT "lead_tags_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_office_id_fkey" FOREIGN KEY ("customer_id", "office_id") REFERENCES "customers"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_tag_id_office_id_fkey" FOREIGN KEY ("tag_id", "office_id") REFERENCES "tags"("id", "office_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_imports" ADD CONSTRAINT "lead_imports_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_imports" ADD CONSTRAINT "lead_imports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_imports" ADD CONSTRAINT "lead_imports_user_id_office_id_fkey" FOREIGN KEY ("user_id", "office_id") REFERENCES "office_members"("user_id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_imports" ADD CONSTRAINT "lead_imports_pipeline_id_office_id_fkey" FOREIGN KEY ("pipeline_id", "office_id") REFERENCES "pipelines"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_imports" ADD CONSTRAINT "lead_imports_stage_id_office_id_fkey" FOREIGN KEY ("stage_id", "office_id") REFERENCES "pipeline_stages"("id", "office_id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Funil padrao para os escritorios que ja existem
--
-- Sem isto o quadro abriria vazio numa base com leads: as colunas sao as
-- etapas, e nenhum lead teria etapa. As cinco etapas abaixo reproduzem o que
-- o enum lead_status ja dizia, mais a coluna de perdido que nao existia.
--
-- Vale so para a base existente. Escritorio novo recebe o mesmo funil pelo
-- OfficesService, na mesma transacao que cria o escritorio.
-- ---------------------------------------------------------------------------

INSERT INTO "pipelines" ("id", "office_id", "name", "is_default", "created_at", "updated_at")
SELECT gen_random_uuid(), o."id", 'Funil de vendas', true, now(), now()
FROM "offices" o;

INSERT INTO "pipeline_stages" ("id", "office_id", "pipeline_id", "name", "color", "position", "kind", "created_at", "updated_at")
SELECT gen_random_uuid(), p."office_id", p."id", e.nome, e.cor, e.posicao, e.tipo::"stage_kind", now(), now()
FROM "pipelines" p
CROSS JOIN (VALUES
  ('Novo',             '#3B82F6', 0, 'open'),
  ('Em contato',       '#8B5CF6', 1, 'open'),
  ('Proposta enviada', '#F59E0B', 2, 'open'),
  ('Ganho',            '#10B981', 3, 'won'),
  ('Perdido',          '#EF4444', 4, 'lost')
) AS e(nome, cor, posicao, tipo);

-- Cada lead cai na coluna que corresponde ao status que ele ja tinha.
-- 'lost' nao aparece aqui de proposito: o valor acabou de ser adicionado ao
-- enum nesta mesma transacao e o Postgres so o aceita depois do commit.
UPDATE "leads" l
SET "pipeline_id"      = s."pipeline_id",
    "stage_id"         = s."id",
    "stage_changed_at" = COALESCE(l."last_activity_at", l."created_at")
FROM "pipeline_stages" s
WHERE s."office_id" = l."office_id"
  AND s."position" = CASE l."status"
        WHEN 'new'        THEN 0
        WHEN 'in_contact' THEN 1
        WHEN 'converted'  THEN 3
        ELSE 0
      END;
