import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { MessageStatus, MessageType, WhatsappProvider } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { WahaService } from '@/integrations/waha/waha.service';
import { EvolutionService } from '@/integrations/evolution/evolution.service';
import { FILA, type JobEnvioWhatsapp } from '../filas/filas';

/**
 * Envia mensagens pelo WhatsApp, com queda para a Evolution quando o WAHA
 * falha.
 *
 * O fallback só é elegível quando a conexão tem `fallbackEnabled` e credenciais
 * da Evolution configuradas. Ele existe porque o WAHA é single-node: uma
 * indisponibilidade dele pararia o atendimento inteiro do escritório.
 */
@Processor(FILA.ENVIO_WHATSAPP)
export class EnvioWhatsappProcessor extends WorkerHost {
  private readonly logger = new Logger(EnvioWhatsappProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly waha: WahaService,
    private readonly evolution: EvolutionService,
  ) {
    super();
  }

  async process(job: Job<JobEnvioWhatsapp>): Promise<{ enviadoPor: string }> {
    const dados = job.data;

    const conexao = await this.prisma.connection.findFirst({
      where: {
        id: dados.connectionId,
        officeId: dados.officeId,
        deletedAt: null,
      },
      select: {
        provider: true,
        fallbackEnabled: true,
        wahaSession: true,
        wahaApiHost: true,
        wahaApiKey: true,
        evolutionApiHost: true,
        evolutionApiInstance: true,
        evolutionApiKey: true,
      },
    });

    if (!conexao) {
      throw new Error(`Conexão ${dados.connectionId} não encontrada`);
    }

    if (conexao.provider === WhatsappProvider.WAHA) {
      try {
        await this.enviarPeloWaha(dados, conexao);
        return { enviadoPor: 'waha' };
      } catch (erro) {
        if (!this.podeUsarFallback(conexao)) throw erro;

        this.logger.warn(
          `WAHA falhou no envio da conexão ${dados.connectionId}; usando Evolution`,
          {
            erro: erro instanceof Error ? erro.message : 'erro',
            sessao: conexao.wahaSession,
          },
        );
      }
    }

    await this.enviarPelaEvolution(dados, conexao);
    return { enviadoPor: 'evolution' };
  }

  private async enviarPeloWaha(
    dados: JobEnvioWhatsapp,
    conexao: {
      wahaSession: string | null;
      wahaApiHost: string | null;
      wahaApiKey: string | null;
    },
  ): Promise<void> {
    if (!conexao.wahaSession || !conexao.wahaApiHost || !conexao.wahaApiKey) {
      throw new Error('Conexão sem configuração WAHA');
    }

    const config = { apiUrl: conexao.wahaApiHost, apiKey: conexao.wahaApiKey };

    if (dados.tipo === MessageType.TEXT) {
      await this.waha.enviarTexto(
        conexao.wahaSession,
        dados.para,
        dados.texto ?? '',
        config,
      );
      return;
    }

    if (!dados.arquivo) throw new Error('Envio de mídia sem arquivo');

    if (dados.tipo === MessageType.AUDIO) {
      await this.waha.enviarAudio(
        conexao.wahaSession,
        dados.para,
        dados.arquivo,
        config,
      );
      return;
    }

    await this.waha.enviarArquivo(
      conexao.wahaSession,
      dados.para,
      dados.arquivo,
      dados.legenda,
      config,
    );
  }

  private async enviarPelaEvolution(
    dados: JobEnvioWhatsapp,
    conexao: {
      evolutionApiHost: string | null;
      evolutionApiInstance: string | null;
      evolutionApiKey: string | null;
    },
  ): Promise<void> {
    if (
      !conexao.evolutionApiHost ||
      !conexao.evolutionApiInstance ||
      !conexao.evolutionApiKey
    ) {
      throw new Error('Conexão sem configuração da Evolution');
    }

    const config = {
      apiUrl: conexao.evolutionApiHost,
      instance: conexao.evolutionApiInstance,
      apiKey: conexao.evolutionApiKey,
    };

    if (dados.tipo === MessageType.TEXT) {
      await this.evolution.enviarTexto(config, dados.para, dados.texto ?? '');
      return;
    }

    if (!dados.arquivo) throw new Error('Envio de mídia sem arquivo');

    if (dados.tipo === MessageType.AUDIO) {
      await this.evolution.enviarAudio(config, dados.para, dados.arquivo.url);
      return;
    }

    await this.evolution.enviarMidia(
      config,
      dados.para,
      {
        url: dados.arquivo.url,
        tipo: dados.tipo === MessageType.IMAGE ? 'image' : 'document',
        nome: dados.arquivo.filename,
      },
      dados.legenda,
    );
  }

  private podeUsarFallback(conexao: {
    fallbackEnabled: boolean;
    evolutionApiHost: string | null;
    evolutionApiInstance: string | null;
    evolutionApiKey: string | null;
  }): boolean {
    return (
      conexao.fallbackEnabled &&
      Boolean(conexao.evolutionApiHost) &&
      Boolean(conexao.evolutionApiInstance) &&
      Boolean(conexao.evolutionApiKey)
    );
  }

  /**
   * Marca a mensagem como falha quando o job esgota as tentativas do BullMQ.
   *
   * Sem isso, a mensagem ficaria eternamente em PENDING e o atendente acharia
   * que ela foi enviada.
   */
  async onFailed(job: Job<JobEnvioWhatsapp>): Promise<void> {
    if (job.attemptsMade < (job.opts.attempts ?? 1)) return;
    if (!job.data.chatId) return;

    await this.prisma.message.updateMany({
      where: {
        chatId: job.data.chatId,
        officeId: job.data.officeId,
        status: MessageStatus.PENDING,
      },
      data: { status: MessageStatus.FAILED },
    });

    this.logger.error(
      `Envio definitivamente falhou na conversa ${job.data.chatId}`,
    );
  }
}
