-- Colunas que entraram na migration 00000000000000_init DEPOIS de ela já ter
-- sido aplicada em bancos existentes.
--
-- Um banco criado do zero já as tem (a init atual as cria), então tudo aqui é
-- condicional: nos bancos novos, nada acontece; nos que rodaram a init antiga,
-- completa o que faltava. Sem isso, excluir processo dava 500 e a memória da
-- IA (resumo da conversa, fatos indexados) falhava ao gravar.
--
-- Regra daqui para frente: migration aplicada não se edita — cria-se outra.

ALTER TYPE "reminder_status" ADD VALUE IF NOT EXISTS 'processing';

ALTER TABLE "chats"
  ADD COLUMN IF NOT EXISTS "summarized_message_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "summary" TEXT,
  ADD COLUMN IF NOT EXISTS "summary_updated_at" TIMESTAMP(3);

ALTER TABLE "marks"
  ADD COLUMN IF NOT EXISTS "vector_id" TEXT,
  ADD COLUMN IF NOT EXISTS "vector_indexed_at" TIMESTAMP(3);

ALTER TABLE "processes"
  ADD COLUMN IF NOT EXISTS "judit_tracking_id" TEXT;
