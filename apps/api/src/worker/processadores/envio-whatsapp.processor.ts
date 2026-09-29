import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { MessageStatus, MessageType, WhatsappProvider } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StorageService } from '@/infra/storage/storage.service';
import { idDaResposta } from '@/modules/chats/id-do-whatsapp';
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
    private readonly storage: StorageService,
  ) {
    super();
  }

  async process(job: Job<JobEnvioWhatsapp>): Promise<{ enviadoPor: string }> {
    const dados = await this.comLinkDoArquivo(job.data);

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
        const resposta = await this.enviarPeloWaha(dados, conexao);
        await this.marcarEnviada(dados, resposta);
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

    const resposta = await this.enviarPelaEvolution(dados, conexao);
    await this.marcarEnviada(dados, resposta);
    return { enviadoPor: 'evolution' };
  }

  /**
   * Troca a chave do storage por um link temporário, a cada tentativa.
   *
   * O link é gerado aqui, e não na hora de enfileirar: ele expira em 15
   * minutos, e uma nova tentativa depois de uma queda do provedor usaria um
   * link vencido.
   */
  private async comLinkDoArquivo(
    dados: JobEnvioWhatsapp,
  ): Promise<JobEnvioWhatsapp> {
    if (!dados.arquivo?.chave) return dados;

    const url = await this.storage.gerarLinkTemporario(dados.arquivo.chave);

    return { ...dados, arquivo: { ...dados.arquivo, url } };
  }

  /**
   * Marca como enviada e grava o id que o WhatsApp deu à mensagem.
   *
   * É por esse id que os eventos de entrega e leitura chegam, e é por ele que
   * o webhook reconhece o eco do que o próprio sistema acabou de enviar.
   */
  private async marcarEnviada(
    dados: JobEnvioWhatsapp,
    resposta: unknown,
  ): Promise<void> {
    if (!dados.messageId) return;

    const externalId = idDaResposta(resposta);

    await this.prisma.message.updateMany({
      where: {
        id: dados.messageId,
        officeId: dados.officeId,
        // Um evento de entrega que chegou antes desta linha já avançou o
        // estado; voltar para SENT apagaria o "entregue".
        status: { in: [MessageStatus.PENDING, MessageStatus.FAILED] },
      },
      data: { status: MessageStatus.SENT },
    });

    if (externalId) {
      await this.prisma.message.updateMany({
        where: { id: dados.messageId, officeId: dados.officeId },
        data: { externalId },
      });
    }
  }

  private async enviarPeloWaha(
    dados: JobEnvioWhatsapp,
    conexao: {
      wahaSession: string | null;
      wahaApiHost: string | null;
      wahaApiKey: string | null;
    },
  ): Promise<unknown> {
    if (!conexao.wahaSession || !conexao.wahaApiHost || !conexao.wahaApiKey) {
      throw new Error('Conexão sem configuração do Provedor 1');
    }

    const config = { apiUrl: conexao.wahaApiHost, apiKey: conexao.wahaApiKey };

    if (dados.tipo === MessageType.TEXT) {
      return this.waha.enviarTexto(
        conexao.wahaSession,
        dados.para,
        dados.texto ?? '',
        config,
      );
    }

    const arquivo = this.arquivoComLink(dados);

    if (dados.tipo === MessageType.AUDIO) {
      return this.waha.enviarAudio(
        conexao.wahaSession,
        dados.para,
        arquivo,
        config,
      );
    }

    return this.waha.enviarArquivo(
      conexao.wahaSession,
      dados.para,
      arquivo,
      dados.legenda,
      config,
    );
  }

  private arquivoComLink(dados: JobEnvioWhatsapp) {
    if (!dados.arquivo?.url) throw new Error('Envio de mídia sem arquivo');

    return {
      url: dados.arquivo.url,
      mimetype: dados.arquivo.mimetype,
      filename: dados.arquivo.filename,
    };
  }

  private async enviarPelaEvolution(
    dados: JobEnvioWhatsapp,
    conexao: {
      evolutionApiHost: string | null;
      evolutionApiInstance: string | null;
      evolutionApiKey: string | null;
    },
  ): Promise<unknown> {
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
      return this.evolution.enviarTexto(config, dados.para, dados.texto ?? '');
    }

    const arquivo = this.arquivoComLink(dados);

    if (dados.tipo === MessageType.AUDIO) {
      return this.evolution.enviarAudio(config, dados.para, arquivo.url);
    }

    return this.evolution.enviarMidia(
      config,
      dados.para,
      {
        url: arquivo.url,
        tipo: dados.tipo === MessageType.IMAGE ? 'image' : 'document',
        nome: arquivo.filename,
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
   *
   * O decorador é o que liga o método ao evento: o WorkerHost não chama
   * `onFailed` por convenção de nome. Sem ele, este código nunca rodava.
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobEnvioWhatsapp>): Promise<void> {
    if (job.attemptsMade < (job.opts.attempts ?? 1)) return;
    if (!job.data.chatId) return;

    await this.prisma.message.updateMany({
      where: {
        chatId: job.data.chatId,
        officeId: job.data.officeId,
        status: MessageStatus.PENDING,
        ...(job.data.messageId && { id: job.data.messageId }),
      },
      data: { status: MessageStatus.FAILED },
    });

    this.logger.error(
      `Envio definitivamente falhou na conversa ${job.data.chatId}`,
    );
  }
}
