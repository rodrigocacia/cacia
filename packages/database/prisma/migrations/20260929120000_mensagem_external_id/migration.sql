-- Id da mensagem no WhatsApp: confirmação de entrega/leitura e eco do envio
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "external_id" TEXT;

CREATE INDEX IF NOT EXISTS "messages_office_id_external_id_idx" ON "messages"("office_id", "external_id");
