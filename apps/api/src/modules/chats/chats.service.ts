import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AgentType,
  ChatStatus,
  ChatType,
  MessageSender,
  type MessageType,
} from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
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
}

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarChatsDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.type && { type: dto.type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.chat.findMany({
        where,
        select: {
          ...CAMPOS,
          customer: { select: { id: true, name: true, remotejid: true } },
          lead: { select: { id: true, name: true, remotejid: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { lastActivityAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.chat.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        agent: { select: { id: true, name: true, style: true } },
        customer: { select: { id: true, name: true, remotejid: true } },
        lead: { select: { id: true, name: true, remotejid: true } },
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
        select: {
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
        },
        orderBy: { createdAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.message.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
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
      select: { id: true, agentId: true },
    });

    if (existente) return existente;

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
      select: { id: true, agentId: true },
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

  async encerrar(officeId: string, id: string) {
    await this.detalhar(officeId, id);

    return this.prisma.chat.update({
      where: { id },
      data: { status: ChatStatus.COMPLETED },
      select: CAMPOS,
    });
  }
}
