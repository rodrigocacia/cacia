import { Module } from '@nestjs/common';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ChatsModule } from '@/modules/chats/chats.module';
import { FilasModule } from '@/worker/filas/filas.module';
import { WebhooksController } from './webhooks.controller';
import { WahaWebhookService } from './waha-webhook.service';
import { JuditWebhookService } from './judit-webhook.service';

@Module({
  // FilasModule pela fila de atendimento: receber a mensagem é só metade do
  // caminho — a outra metade é o agente responder.
  imports: [IntegracoesModule, ChatsModule, FilasModule],
  controllers: [WebhooksController],
  providers: [WahaWebhookService, JuditWebhookService],
})
export class WebhooksModule {}
