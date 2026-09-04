import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IaModule } from '@/ai/ia.module';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ChatsModule } from '@/modules/chats/chats.module';
import { RemindersModule } from '@/modules/reminders/reminders.module';
import { FilasModule } from './filas/filas.module';
import { AtendimentoProcessor } from './processadores/atendimento.processor';
import { EnvioWhatsappProcessor } from './processadores/envio-whatsapp.processor';
import { LembretesProcessor } from './processadores/lembretes.processor';
import { LembretesTarefa } from './tarefas/lembretes.tarefa';

/**
 * Processadores de fila e tarefas agendadas.
 *
 * Carregado APENAS pelo processo do worker. Se a API o importasse, cada
 * instância dela também consumiria as filas e rodaria o cron — e a varredura
 * de lembretes aconteceria uma vez por instância, não uma vez por minuto.
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    FilasModule,
    IntegracoesModule,
    RemindersModule,
    ChatsModule,
    IaModule,
  ],
  providers: [
    AtendimentoProcessor,
    EnvioWhatsappProcessor,
    LembretesProcessor,
    LembretesTarefa,
  ],
})
export class WorkerModule {}
