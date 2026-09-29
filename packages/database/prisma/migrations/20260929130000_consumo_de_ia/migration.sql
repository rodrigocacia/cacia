-- Consumo de IA por escritório: base da cobrança pelo uso da IA

-- CreateEnum
CREATE TYPE "ai_task" AS ENUM ('attendance', 'summary', 'facts', 'embedding');

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL,
    "office_id" UUID NOT NULL,
    "chat_id" UUID,
    "task" "ai_task" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fallback" BOOLEAN NOT NULL DEFAULT false,
    "input_tokens" INTEGER NOT NULL,
    "cached_input_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost_usd" DECIMAL(14,8) NOT NULL,
    "cost_brl" DECIMAL(14,6) NOT NULL,
    "priced" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_prices" (
    "model" TEXT NOT NULL,
    "input_usd_per_million" DECIMAL(12,6) NOT NULL,
    "cached_input_usd_per_million" DECIMAL(12,6) NOT NULL,
    "output_usd_per_million" DECIMAL(12,6) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_prices_pkey" PRIMARY KEY ("model")
);

-- CreateTable
CREATE TABLE "ai_billing_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "markup_percent" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "usd_to_brl" DECIMAL(10,4) NOT NULL DEFAULT 5.5,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_billing_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_office_id_created_at_idx" ON "ai_usage"("office_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage"("created_at");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_office_id_fkey" FOREIGN KEY ("office_id") REFERENCES "offices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preços iniciais (US$ por milhão de tokens). Ponto de partida: conferir na
-- página de preços de cada provedor e ajustar no painel administrativo.
INSERT INTO "ai_model_prices" ("model", "input_usd_per_million", "cached_input_usd_per_million", "output_usd_per_million", "updated_at") VALUES
  ('deepseek-chat',          0.28, 0.028, 0.42, CURRENT_TIMESTAMP),
  ('gpt-5-mini',             0.25, 0.025, 2.00, CURRENT_TIMESTAMP),
  ('text-embedding-3-small', 0.02, 0.02,  0,    CURRENT_TIMESTAMP)
ON CONFLICT ("model") DO NOTHING;

INSERT INTO "ai_billing_settings" ("id", "markup_percent", "usd_to_brl", "updated_at")
VALUES (1, 0, 5.5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
