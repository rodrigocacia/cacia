import { Module } from '@nestjs/common';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ChatsModule } from '@/modules/chats/chats.module';
import { WebhooksController } from './webhooks.controller';
import { WahaWebhookService } from './waha-webhook.service';
import { JuditWebhookService } from './judit-webhook.service';

@Module({
  imports: [IntegracoesModule, ChatsModule],
  controllers: [WebhooksController],
  providers: [WahaWebhookService, JuditWebhookService],
})
export class WebhooksModule {}
