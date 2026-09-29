import { Module } from '@nestjs/common';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ChatsModule } from '@/modules/chats/chats.module';
import { PipelinesModule } from '@/modules/pipelines/pipelines.module';
import { FilasModule } from '@/worker/filas/filas.module';
import { WebhooksController } from './webhooks.controller';
import { WahaWebhookService } from './waha-webhook.service';
import { JuditWebhookService } from './judit-webhook.service';

@Module({
  // FilasModule pela fila de atendimento: receber a mensagem é só metade do
  // caminho — a outra metade é o agente responder.
  // PipelinesModule porque o lead criado aqui precisa nascer numa etapa do
  // funil padrao — fora do quadro ele nao existe para quem trabalha o funil.
  imports: [IntegracoesModule, ChatsModule, FilasModule, PipelinesModule],
  controllers: [WebhooksController],
  providers: [WahaWebhookService, JuditWebhookService],
})
export class WebhooksModule {}
