import { Module } from '@nestjs/common';
import { FilasModule } from '@/worker/filas/filas.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  // FilasModule pela fila de envio: a resposta do atendente sai pelo worker,
  // com as mesmas tentativas e a mesma queda de provedor da resposta da IA.
  imports: [FilasModule],
  controllers: [ChatsController],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
