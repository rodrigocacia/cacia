import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IaModule } from '@/ai/ia.module';
import { StorageModule } from '@/infra/storage/storage.module';
import { IntegracoesModule } from '@/integrations/integracoes.module';
import { ChatsModule } from '@/modules/chats/chats.module';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { ProcessesModule } from '@/modules/processes/processes.module';
import { RemindersModule } from '@/modules/reminders/reminders.module';
import { FilasModule } from './filas/filas.module';
import { AcompanhamentoProcessoProcessor } from './processadores/acompanhamento-processo.processor';
import { AtendimentoProcessor } from './processadores/atendimento.processor';
import { EnvioWhatsappProcessor } from './processadores/envio-whatsapp.processor';
import { ImportacaoLeadsProcessor } from './processadores/importacao-leads.processor';
import { IndexacaoDocumentoProcessor } from './processadores/indexacao-documento.processor';
import { LembretesProcessor } from './processadores/lembretes.processor';
import { AcompanhamentoTarefa } from './tarefas/acompanhamento.tarefa';
import { IndexacaoTarefa } from './tarefas/indexacao.tarefa';
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
    // Explicito, ainda que StorageModule seja @Global: o processador de
    // importacao le o arquivo daqui, e depender de outro modulo te-lo
    // importado e o tipo de acoplamento que quebra sem aviso.
    StorageModule,
    IntegracoesModule,
    RemindersModule,
    ChatsModule,
    IaModule,
    DocumentsModule,
    ProcessesModule,
  ],
  providers: [
    AtendimentoProcessor,
    EnvioWhatsappProcessor,
    IndexacaoDocumentoProcessor,
    ImportacaoLeadsProcessor,
    AcompanhamentoProcessoProcessor,
    LembretesProcessor,
    LembretesTarefa,
    IndexacaoTarefa,
    AcompanhamentoTarefa,
  ],
})
export class WorkerModule {}
