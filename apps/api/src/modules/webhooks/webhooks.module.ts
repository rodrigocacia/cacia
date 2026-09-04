import { Module } from '@nestjs/common';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ChatsModule } from '@/modules/chats/chats.module';
import { WebhooksController } from './webhooks.controller';
import { WahaWebhookService } from './waha-webhook.service';

@Module({
  imports: [IntegracoesModule, ChatsModule],
  controllers: [WebhooksController],
  providers: [WahaWebhookService],
})
export class WebhooksModule {}
