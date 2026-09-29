import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  AgentType,
  ChatStatus,
  ChatType,
  ConnectionStatus,
  MessageSender,
  MessageStatus,
  MessageType,
  type Prisma,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { StorageService } from '@/infra/storage/storage.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { FILA, type JobEnvioWhatsapp } from '@/worker/filas/filas';
import type { ListarChatsDto, ListarMensagensDto } from './dto/chat.dto';

const CAMPOS = {
  id: true,
  type: true,
  status: true,
  userName: true,
  audioReply: true,
  agentId: true,
  customerId: true,
  leadId: true,
  userId: true,
  lastActivityAt: true,
  createdAt: true,
} as const;

const CONTATO = { select: { id: true, name: true, remotejid: true } } as const;

/** Etapa do funil junto do lead: a conversa mostra em que fase ele está. */
const LEAD = {
  select: {
    id: true,
    name: true,
    remotejid: true,
    stage: { select: { id: true, name: true, color: true } },
  },
} as const;

const MENSAGEM = {
  id: true,
  sender: true,
  type: true,
  status: true,
  messageText: true,
  messageCaption: true,
  messageFileUrl: true,
  messageFileExtension: true,
  messageFileSizeBytes: true,
  createdAt: true,
} as const;

export interface DadosMensagemRecebida {
  officeId: string;
  chatId: string;
  remetente: MessageSender;
  tipo: MessageType;
  texto?: string;
  legenda?: string;
  arquivoUrl?: string;
  extensao?: string;
  tamanhoBytes?: number;
  leadId?: string;
  customerId?: string;
  /** Id da mensagem no WhatsApp (ver id-do-whatsapp.ts). */
  externalId?: string;
  status?: MessageStatus;
}

/** O que o atendente anexou na tela. */
export interface AnexoEnviado {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/**
 * 16 MB é o teto do WhatsApp para vídeo e áudio. Documento pode ir além, mas
 * um teto único é mais fácil de explicar na tela do que um por tipo.
 */
const TAMANHO_MAXIMO_DO_ANEXO = 16 * 1024 * 1024;

type Conteudo =
  | { tipo: typeof MessageType.TEXT; texto: string }
  | {
      tipo: MessageType;
      chave: string;
      mimetype: string;
      nomeDoArquivo: string;
      extensao: string;
      tamanhoBytes: number;
      legenda?: string;
    };

function tipoPeloMime(mime: string): MessageType {
  if (mime.startsWith('image/')) return MessageType.IMAGE;
  if (mime.startsWith('audio/')) return MessageType.AUDIO;
  if (mime.startsWith('video/')) return MessageType.VIDEO;
  return MessageType.DOCUMENT;
}

@Injectable()
export class ChatsService {
  private readonly logger = new Logger(ChatsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(FILA.ENVIO_WHATSAPP)
    private readonly envio: Queue<JobEnvioWhatsapp>,
    private readonly storage: StorageService,
  ) {}

  /**
   * Troca a chave do storage por um link temporário.
   *
   * Anexo enviado pela tela ou baixado do WhatsApp fica no storage, privado;
   * o navegador só o abre por link assinado. URL que já é absoluta passa
   * intacta. Assinar é local (HMAC), então fazer isso a cada consulta da tela
   * não custa uma ida ao storage.
   */
  private async comLinks<T extends { messageFileUrl: string | null }>(
    officeId: string,
    mensagens: T[],
  ): Promise<T[]> {
    return Promise.all(
      mensagens.map(async (m) => {
        const chave = m.messageFileUrl;

        if (!chave || /^https?:\/\//.test(chave)) return m;

        if (!this.storage.pertenceAoEscritorio(chave, officeId)) {
          return { ...m, messageFileUrl: null };
        }

        return {
          ...m,
          messageFileUrl: await this.storage.gerarLinkTemporario(chave),
        };
      }),
    );
  }

  async listar(officeId: string, dto: ListarChatsDto) {
    const busca = dto.search?.trim();

    const where: Prisma.ChatWhereInput = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.type && { type: dto.type }),
      ...(dto.leadId && { leadId: dto.leadId }),
      ...(dto.customerId && { customerId: dto.customerId }),
      ...(busca && {
        OR: [
          { userName: { contains: busca, mode: 'insensitive' } },
          { lead: { name: { contains: busca, mode: 'insensitive' } } },
          { lead: { remotejid: { contains: busca } } },
          { customer: { name: { contains: busca, mode: 'insensitive' } } },
          { customer: { remotejid: { contains: busca } } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.chat.findMany({
        where,
        select: {
          ...CAMPOS,
          customer: CONTATO,
          lead: LEAD,
          _count: { select: { messages: true } },
          // A última mensagem vira a prévia da lista e diz quem falou por
          // último: é assim que o atendente vê quem está esperando resposta.
          messages: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: MENSAGEM,
          },
        },
        orderBy: { lastActivityAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.chat.count({ where }),
    ]);

    const comPrevia = await Promise.all(
      data.map(async (chat) => ({
        ...chat,
        messages: await this.comLinks(officeId, chat.messages),
      })),
    );

    return montarPaginacao(comPrevia, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        agent: { select: { id: true, name: true, style: true } },
        customer: CONTATO,
        lead: LEAD,
      },
    });

    if (!chat) throw new NotFoundException('Conversa não encontrada');

    return chat;
  }

  async listarMensagens(
    officeId: string,
    chatId: string,
    dto: ListarMensagensDto,
  ) {
    await this.detalhar(officeId, chatId);

    const where = { officeId, chatId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        select: MENSAGEM,
        orderBy: { createdAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.message.count({ where }),
    ]);

    return montarPaginacao(await this.comLinks(officeId, data), total, dto);
  }

  /**
   * Localiza a conversa do contato ou cria uma nova.
   *
   * Chamado pelo webhook a cada mensagem recebida. Devolve sempre uma conversa
   * ativa: o WhatsApp não tem o conceito de "abrir conversa", então quem
   * responde depois de meses simplesmente reutiliza a mesma.
   */
  async encontrarOuCriar(params: {
    officeId: string;
    leadId?: string;
    customerId?: string;
    nomeContato?: string;
  }) {
    const { officeId, leadId, customerId, nomeContato } = params;

    const existente = await this.prisma.chat.findFirst({
      where: {
        officeId,
        deletedAt: null,
        ...(customerId ? { customerId } : { leadId }),
      },
      // O status vai junto: quem chama decide por ele se pede resposta
      // automática, e uma consulta a mais logo depois seria desperdício.
      select: { id: true, agentId: true, status: true },
    });

    if (existente) return existente;

    // Lead convertido em cliente: a conversa continua a mesma. Sem isso, o
    // histórico inteiro ficaria na conversa do lead e o cliente começaria uma
    // conversa vazia, sem o que foi combinado antes da conversão.
    if (customerId) {
      const doLead = await this.prisma.chat.findFirst({
        where: {
          officeId,
          deletedAt: null,
          customerId: null,
          lead: { customerId },
        },
        orderBy: { lastActivityAt: 'desc' },
        select: { id: true },
      });

      if (doLead) {
        return this.prisma.chat.update({
          where: { id: doLead.id },
          data: { customerId, type: ChatType.CUSTOMER },
          select: { id: true, agentId: true, status: true },
        });
      }
    }

    const agente = await this.prisma.agent.findFirst({
      where: { officeId, type: AgentType.SUPPORT, deletedAt: null },
      select: { id: true },
    });

    if (!agente) {
      throw new NotFoundException(
        'Nenhum agente de atendimento configurado neste escritório',
      );
    }

    return this.prisma.chat.create({
      data: {
        officeId,
        agentId: agente.id,
        type: customerId ? ChatType.CUSTOMER : ChatType.LEAD,
        customerId,
        leadId,
        userName: nomeContato,
        status: ChatStatus.ACTIVE,
      },
      select: { id: true, agentId: true, status: true },
    });
  }

  /**
   * Grava a mensagem e atualiza a atividade da conversa.
   *
   * As duas escritas vão juntas: uma conversa com mensagem nova mas
   * `lastActivityAt` antigo desce na listagem e some da tela do atendente.
   */
  async registrarMensagem(dados: DadosMensagemRecebida) {
    return this.prisma.$transaction(async (tx) => {
      const mensagem = await tx.message.create({
        data: {
          officeId: dados.officeId,
          chatId: dados.chatId,
          leadId: dados.leadId,
          customerId: dados.customerId,
          sender: dados.remetente,
          type: dados.tipo,
          messageText: dados.texto,
          messageCaption: dados.legenda,
          messageFileUrl: dados.arquivoUrl,
          messageFileExtension: dados.extensao,
          messageFileSizeBytes: dados.tamanhoBytes,
          externalId: dados.externalId,
          ...(dados.status && { status: dados.status }),
        },
        select: { id: true, createdAt: true },
      });

      await tx.chat.update({
        where: { id: dados.chatId },
        data: { lastActivityAt: mensagem.createdAt },
      });

      if (dados.leadId && dados.remetente !== MessageSender.AGENT) {
        await tx.lead.update({
          where: { id: dados.leadId },
          data: { lastActivityAt: mensagem.createdAt },
        });
      }

      return mensagem;
    });
  }

  /** Liga ou desliga a resposta por áudio nesta conversa. */
  async definirRespostaEmAudio(
    officeId: string,
    id: string,
    ativo: boolean | null,
  ) {
    await this.detalhar(officeId, id);

    return this.prisma.chat.update({
      where: { id },
      data: { audioReply: ativo },
      select: CAMPOS,
    });
  }

  /**
   * Resposta escrita pelo atendente na plataforma.
   *
   * Responder é assumir: a conversa sai do automático no mesmo passo. Se a IA
   * continuasse ligada, a próxima mensagem do contato receberia duas
   * respostas, a do advogado e a do agente, que não sabe o que foi combinado.
   *
   * A mensagem nasce PENDING e o worker a marca como enviada ou falha; a tela
   * mostra esse estado, então o atendente sabe se ela saiu de verdade.
   */
  enviarMensagem(officeId: string, id: string, texto: string) {
    return this.enviar(officeId, id, { tipo: MessageType.TEXT, texto });
  }

  /**
   * Arquivo ou áudio gravado na tela.
   *
   * Vai para o storage antes de tudo: o provedor do WhatsApp baixa o arquivo
   * por link, e a tela precisa exibi-lo depois. Tamanho e conexão são
   * checados antes do upload, para não guardar arquivo que não vai sair.
   */
  async enviarAnexo(
    officeId: string,
    id: string,
    arquivo: AnexoEnviado | undefined,
    legenda?: string,
  ) {
    if (!arquivo) throw new BadRequestException('Envie um arquivo');

    if (arquivo.size > TAMANHO_MAXIMO_DO_ANEXO) {
      throw new BadRequestException('Arquivo acima de 16 MB');
    }

    // O Chrome manda "audio/webm;codecs=opus"; o parâmetro só atrapalha
    const mimetype = arquivo.mimetype.split(';')[0]!.trim();

    const enviado = await this.storage.enviar({
      officeId,
      conteudo: arquivo.buffer,
      nomeOriginal: arquivo.originalname,
      mimetype,
    });

    return this.enviar(officeId, id, {
      tipo: tipoPeloMime(mimetype),
      chave: enviado.chave,
      mimetype,
      nomeDoArquivo: arquivo.originalname,
      extensao: arquivo.originalname.split('.').pop() ?? '',
      tamanhoBytes: enviado.tamanhoBytes,
      legenda: legenda?.trim() || undefined,
    });
  }

  private async enviar(officeId: string, id: string, conteudo: Conteudo) {
    const chat = await this.detalhar(officeId, id);

    const para = chat.customer?.remotejid ?? chat.lead?.remotejid;

    if (!para) {
      throw new UnprocessableEntityException(
        'Este contato não tem número de WhatsApp',
      );
    }

    const conexao = await this.conexaoParaEnvio(officeId);

    const mensagem = await this.prisma.$transaction(async (tx) => {
      const criada = await tx.message.create({
        data: {
          officeId,
          chatId: id,
          leadId: chat.leadId,
          customerId: chat.customerId,
          sender: MessageSender.USER,
          type: conteudo.tipo,
          status: MessageStatus.PENDING,
          ...('texto' in conteudo
            ? { messageText: conteudo.texto }
            : {
                messageCaption: conteudo.legenda,
                messageFileUrl: conteudo.chave,
                messageFileExtension: conteudo.extensao,
                messageFileSizeBytes: conteudo.tamanhoBytes,
              }),
        },
        select: MENSAGEM,
      });

      await tx.chat.update({
        where: { id },
        data: {
          lastActivityAt: criada.createdAt,
          ...(chat.status === ChatStatus.ACTIVE && {
            status: ChatStatus.PENDING,
          }),
        },
      });

      return criada;
    });

    try {
      await this.envio.add(
        'enviar',
        {
          officeId,
          connectionId: conexao.id,
          para,
          tipo: conteudo.tipo,
          ...('texto' in conteudo
            ? { texto: conteudo.texto }
            : {
                arquivo: {
                  chave: conteudo.chave,
                  mimetype: conteudo.mimetype,
                  filename: conteudo.nomeDoArquivo,
                },
                legenda: conteudo.legenda,
              }),
          chatId: id,
          messageId: mensagem.id,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: true,
        },
      );
    } catch (erro) {
      this.logger.error(
        `Não foi possível enfileirar o envio na conversa ${id}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );

      await this.prisma.message.update({
        where: { id: mensagem.id },
        data: { status: MessageStatus.FAILED },
      });

      throw new ServiceUnavailableException(
        'Não foi possível enviar agora. Tente de novo em instantes.',
      );
    }

    const [comLink] = await this.comLinks(officeId, [mensagem]);
    return comLink!;
  }

  /**
   * A conexão por onde a resposta sai.
   *
   * Sem nenhuma conectada, recusar é melhor do que gravar uma mensagem que o
   * atendente acha que foi e nunca vai sair.
   */
  private async conexaoParaEnvio(officeId: string) {
    const conexao = await this.prisma.connection.findFirst({
      where: {
        officeId,
        deletedAt: null,
        status: ConnectionStatus.CONNECTED,
      },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (!conexao) {
      throw new UnprocessableEntityException(
        'O WhatsApp do escritório não está conectado. Conecte em Configurações > WhatsApp.',
      );
    }

    return conexao;
  }

  /** O atendente assume: a IA para de responder nesta conversa. */
  async assumir(officeId: string, id: string) {
    await this.detalhar(officeId, id);

    return this.prisma.chat.update({
      where: { id },
      data: { status: ChatStatus.PENDING },
      select: CAMPOS,
    });
  }

  /**
   * Devolve a conversa para a IA.
   *
   * Vale também para conversa encerrada: o contato que volta a escrever
   * depois do encerramento precisa de alguém respondendo.
   */
  async devolverParaIa(officeId: string, id: string) {
    await this.detalhar(officeId, id);

    return this.prisma.chat.update({
      where: { id },
      data: { status: ChatStatus.ACTIVE },
      select: CAMPOS,
    });
  }

  async encerrar(officeId: string, id: string) {
    await this.detalhar(officeId, id);

    return this.prisma.chat.update({
      where: { id },
      data: { status: ChatStatus.COMPLETED },
      select: CAMPOS,
    });
  }
}
