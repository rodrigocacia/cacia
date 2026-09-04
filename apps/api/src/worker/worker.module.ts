import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { RemindersModule } from '@/modules/reminders/reminders.module';
import { FilasModule } from './filas/filas.module';
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
  ],
  providers: [EnvioWhatsappProcessor, LembretesProcessor, LembretesTarefa],
})
export class WorkerModule {}
