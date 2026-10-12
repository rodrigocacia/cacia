import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadSource, LeadStatus, Prisma, StageKind } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { PipelinesService } from '../pipelines/pipelines.service';
import { TagsService } from '../tags/tags.service';
import { projetarStatus } from './projecao-de-status';
import { normalizarRemotejid, remotejidValido } from './remotejid';
import type {
  AtualizarLeadDto,
  ConverterLeadDto,
  CriarLeadDto,
  DefinirResponsavelDto,
  ListarLeadsDto,
  MetricasDoFunilDto,
  MoverEtapaDto,
  QuadroDto,
} from './dto/lead.dto';

const CAMPOS = {
  id: true,
  name: true,
  remotejid: true,
  email: true,
  briefing: true,
  status: true,
  customerId: true,
  pipelineId: true,
  stageId: true,
  stageChangedAt: true,
  ownerId: true,
  value: true,
  source: true,
  sourceDetail: true,
  expectedCloseAt: true,
  lostReason: true,
  lostAt: true,
  lastActivityAt: true,
  createdAt: true,
} as const;

/** O bastante para desenhar um cartão do quadro. */
const CAMPOS_CARTAO = {
  id: true,
  name: true,
  remotejid: true,
  // O caso em uma linha: é o que se lê no cartão para decidir quem atender
  briefing: true,
  value: true,
  status: true,
  stageChangedAt: true,
  lastActivityAt: true,
  owner: { select: { id: true, name: true, avatar: true } },
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
} as const;

const RELACOES = {
  stage: {
    select: { id: true, name: true, color: true, kind: true, position: true },
  },
  pipeline: { select: { id: true, name: true } },
  owner: { select: { id: true, name: true, email: true, avatar: true } },
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
} as const;

/** Etiquetas chegam como junção; a tela quer a etiqueta. */
function achatarEtiquetas<T extends { tags: Array<{ tag: unknown }> }>(
  lead: T,
): Omit<T, 'tags'> & { tags: unknown[] } {
  return { ...lead, tags: lead.tags.map((v) => v.tag) };
}

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pipelines: PipelinesService,
    private readonly tags: TagsService,
  ) {}

  async listar(officeId: string, dto: ListarLeadsDto) {
    const where: Prisma.LeadWhereInput = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.stageId && { stageId: dto.stageId }),
      ...(dto.pipelineId && { pipelineId: dto.pipelineId }),
      ...(dto.ownerId && { ownerId: dto.ownerId }),
      ...(dto.source && { source: dto.source }),
      ...(dto.search && {
        OR: [
          { name: { contains: dto.search, mode: 'insensitive' as const } },
          { remotejid: { contains: dto.search } },
        ],
      }),
      // Todas as etiquetas, não qualquer uma: um filtro que devolve o lead com
      // uma das cinco etiquetas escolhidas não filtra nada.
      ...(dto.tagIds?.length && {
        AND: dto.tagIds.map((tagId) => ({ tags: { some: { tagId } } })),
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        select: { ...CAMPOS, ...RELACOES },
        orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
        ...janela(dto),
      }),
      this.prisma.lead.count({ where }),
    ]);

    return montarPaginacao(data.map(achatarEtiquetas), total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      // officeId no where, não só o id: buscar apenas por id devolveria o
      // registro de outro escritório
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        ...RELACOES,
        customer: { select: { id: true, name: true, document: true } },
        stageHistory: {
          select: {
            id: true,
            createdAt: true,
            secondsInPreviousStage: true,
            fromStage: { select: { id: true, name: true, color: true } },
            toStage: { select: { id: true, name: true, color: true } },
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: { select: { chats: true, events: true, documents: true } },
      },
    });

    if (!lead) throw new NotFoundException('Lead não encontrado');

    return achatarEtiquetas(lead);
  }

  /**
   * Cadastra o lead e o coloca no funil.
   *
   * Tudo numa transação: um lead gravado sem a primeira entrada no histórico
   * apareceria no quadro sem nunca ter entrado em etapa nenhuma, e o tempo em
   * etapa dele seria calculado a partir do nada.
   */
  /**
   * `autorId` é quem cadastrou pela tela. Sem autor — webhook do WhatsApp,
   * importação — a entrada no histórico fica com `userId` nulo, que a linha do
   * tempo mostra como a IA de atendimento.
   */
  async criar(
    officeId: string,
    dto: CriarLeadDto,
    autorId: string | null = null,
  ) {
    // Valida o valor CRU e só depois normaliza. Na ordem inversa a checagem
    // nunca reprova nada: normalizar acrescenta "@c.us", e um identificador
    // com arroba é aceito como vindo do WhatsApp.
    if (!remotejidValido(dto.remotejid)) {
      throw new BadRequestException(
        'Telefone inválido — informe ao menos DDD e número',
      );
    }

    const remotejid = normalizarRemotejid(dto.remotejid);

    const etapa = dto.stageId
      ? await this.garantirEtapa(officeId, dto.stageId)
      : await this.pipelines.etapaInicial(officeId);

    if (dto.ownerId) await this.garantirMembro(officeId, dto.ownerId);

    const tagIds = await this.tags.validar(officeId, dto.tagIds ?? []);

    const agora = new Date();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const lead = await tx.lead.create({
          data: {
            officeId,
            name: dto.name,
            remotejid,
            email: dto.email,
            briefing: dto.briefing,
            pipelineId: etapa.pipelineId,
            stageId: etapa.stageId,
            stageChangedAt: agora,
            status: projetarStatus(etapa),
            ownerId: dto.ownerId,
            value: dto.value,
            source: dto.source ?? LeadSource.MANUAL,
            sourceDetail: dto.sourceDetail,
            expectedCloseAt: dto.expectedCloseAt
              ? new Date(dto.expectedCloseAt)
              : undefined,
            lastActivityAt: agora,
            ...(tagIds.length && {
              tags: { create: tagIds.map((tagId) => ({ officeId, tagId })) },
            }),
          },
          select: { ...CAMPOS, ...RELACOES },
        });

        await tx.leadStageHistory.create({
          data: {
            officeId,
            leadId: lead.id,
            toStageId: etapa.stageId,
            userId: autorId,
          },
        });

        return achatarEtiquetas(lead);
      });
    } catch (erro) {
      throw await this.traduzirDuplicidade(erro, officeId, remotejid);
    }
  }

  async atualizar(officeId: string, id: string, dto: AtualizarLeadDto) {
    await this.garantirQueExiste(officeId, id);

    const lead = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.briefing !== undefined && { briefing: dto.briefing }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.sourceDetail !== undefined && {
          sourceDetail: dto.sourceDetail,
        }),
        ...(dto.expectedCloseAt !== undefined && {
          expectedCloseAt: new Date(dto.expectedCloseAt),
        }),
      },
      select: { ...CAMPOS, ...RELACOES },
    });

    return achatarEtiquetas(lead);
  }

  /**
   * Move o lead de etapa e registra a passagem.
   *
   * `autorId` nulo significa que quem moveu foi o agente — permitido apenas
   * quando o escritório ligou `aiCanMoveLeadStage`, e a verificação fica em
   * quem chama (FerramentasService), que é quem conhece o contexto da
   * conversa. Aqui a distinção só é gravada: um cartão que andou sozinho
   * precisa ser reconhecível na linha do tempo.
   */
  async moverEtapa(
    officeId: string,
    id: string,
    dto: MoverEtapaDto,
    autorId: string | null,
  ) {
    const etapa = await this.garantirEtapa(officeId, dto.stageId);

    if (etapa.kind === StageKind.LOST && !dto.lostReason) {
      throw new BadRequestException(
        'Informe o motivo da perda ao mover o lead para esta etapa',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const atual = await tx.lead.findFirst({
        where: { id, officeId, deletedAt: null },
        select: { id: true, stageId: true, stageChangedAt: true },
      });

      if (!atual) throw new NotFoundException('Lead não encontrado');

      if (atual.stageId === dto.stageId) {
        throw new ConflictException('O lead já está nesta etapa');
      }

      const agora = new Date();
      const desde = atual.stageChangedAt;

      const lead = await tx.lead.update({
        where: { id },
        data: {
          pipelineId: etapa.pipelineId,
          stageId: etapa.stageId,
          stageChangedAt: agora,
          status: projetarStatus(etapa),
          lastActivityAt: agora,
          // Sair de uma etapa de perda limpa o motivo: um lead reaberto que
          // continua exibindo "cliente sumiu" mente para quem abre a ficha.
          lostReason: etapa.kind === StageKind.LOST ? dto.lostReason : null,
          lostAt: etapa.kind === StageKind.LOST ? agora : null,
        },
        select: { ...CAMPOS, ...RELACOES },
      });

      await tx.leadStageHistory.create({
        data: {
          officeId,
          leadId: id,
          fromStageId: atual.stageId,
          toStageId: etapa.stageId,
          userId: autorId,
          secondsInPreviousStage: desde
            ? Math.max(
                0,
                Math.round((agora.getTime() - desde.getTime()) / 1000),
              )
            : null,
        },
      });

      return achatarEtiquetas(lead);
    });
  }

  async definirResponsavel(
    officeId: string,
    id: string,
    dto: DefinirResponsavelDto,
  ) {
    await this.garantirQueExiste(officeId, id);

    if (dto.ownerId) await this.garantirMembro(officeId, dto.ownerId);

    const lead = await this.prisma.lead.update({
      where: { id },
      data: { ownerId: dto.ownerId ?? null },
      select: { ...CAMPOS, ...RELACOES },
    });

    return achatarEtiquetas(lead);
  }

  /**
   * Substitui o conjunto de etiquetas do lead.
   *
   * Apaga e recria dentro da transação em vez de calcular a diferença: a
   * operação fica idempotente e não há estado intermediário visível com
   * etiqueta a menos.
   */
  async definirEtiquetas(officeId: string, id: string, tagIds: string[]) {
    await this.garantirQueExiste(officeId, id);

    const validas = await this.tags.validar(officeId, tagIds);

    const lead = await this.prisma.$transaction(async (tx) => {
      await tx.leadTag.deleteMany({ where: { officeId, leadId: id } });

      if (validas.length) {
        await tx.leadTag.createMany({
          data: validas.map((tagId) => ({ officeId, leadId: id, tagId })),
        });
      }

      return tx.lead.findFirstOrThrow({
        where: { id, officeId },
        select: { ...CAMPOS, ...RELACOES },
      });
    });

    return achatarEtiquetas(lead);
  }

  /**
   * Converte o lead em cliente.
   *
   * Vincula a um cliente existente ou cria um novo a partir dos dados do lead.
   * As escritas vão na mesma transação: um lead marcado como convertido sem
   * cliente vinculado é um estado que a interface não sabe representar.
   *
   * Move junto para a etapa de ganho, quando o funil tem uma. Sem isso o
   * cartão ficaria numa coluna aberta enquanto o `status` diz convertido — o
   * quadro e a listagem discordando sobre o mesmo lead.
   */
  async converter(
    officeId: string,
    id: string,
    dto: ConverterLeadDto,
    autorId: string | null = null,
  ) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        remotejid: true,
        briefing: true,
        status: true,
        stageId: true,
        stageChangedAt: true,
        pipelineId: true,
      },
    });

    if (!lead) throw new NotFoundException('Lead não encontrado');

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Este lead já foi convertido');
    }

    const ganho = await this.prisma.pipelineStage.findFirst({
      where: {
        officeId,
        kind: StageKind.WON,
        deletedAt: null,
        ...(lead.pipelineId && { pipelineId: lead.pipelineId }),
      },
      select: { id: true, pipelineId: true, position: true, kind: true },
      orderBy: { position: 'asc' },
    });

    return this.prisma.$transaction(async (tx) => {
      let customerId = dto.customerId;

      if (customerId) {
        const existe = await tx.customer.findFirst({
          where: { id: customerId, officeId, deletedAt: null },
          select: { id: true },
        });
        if (!existe)
          throw new NotFoundException('Cliente informado não existe');
      } else {
        if (!dto.document) {
          throw new BadRequestException(
            'Informe o documento para criar o cliente, ou o customerId de um existente',
          );
        }
        const novo = await tx.customer.create({
          data: {
            officeId,
            name: dto.name ?? lead.name,
            email: dto.email ?? lead.email,
            briefing: lead.briefing,
            remotejid: lead.remotejid,
            document: dto.document.replace(/\D/g, ''),
            legalName: dto.legalName,
            tradeName: dto.tradeName,
            ...(dto.addresses?.length && {
              // officeId vem do cliente — ver CustomersService.criar
              addresses: { create: dto.addresses },
            }),
          },
          select: { id: true },
        });
        customerId = novo.id;
      }

      const agora = new Date();

      if (ganho && ganho.id !== lead.stageId) {
        await tx.leadStageHistory.create({
          data: {
            officeId,
            leadId: lead.id,
            fromStageId: lead.stageId,
            toStageId: ganho.id,
            userId: autorId,
            secondsInPreviousStage: lead.stageChangedAt
              ? Math.max(
                  0,
                  Math.round(
                    (agora.getTime() - lead.stageChangedAt.getTime()) / 1000,
                  ),
                )
              : null,
          },
        });
      }

      const atualizado = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.CONVERTED,
          customerId,
          ...(ganho && {
            stageId: ganho.id,
            pipelineId: ganho.pipelineId,
            ...(ganho.id !== lead.stageId && { stageChangedAt: agora }),
          }),
        },
        select: { ...CAMPOS, ...RELACOES },
      });

      return achatarEtiquetas(atualizado);
    });
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------- quadro

  /**
   * Os leads agrupados por etapa, prontos para o quadro.
   *
   * Uma consulta por coluna, não uma consulta só: cada etapa precisa do
   * próprio total e dos próprios primeiros cartões. São poucas colunas e elas
   * vão em paralelo — trazer tudo numa consulta e agrupar em memória traria a
   * etapa inteira, que é justamente o que não cabe.
   */
  async quadro(officeId: string, dto: QuadroDto) {
    const funil = dto.pipelineId
      ? await this.prisma.pipeline.findFirst({
          where: { id: dto.pipelineId, officeId, deletedAt: null },
          select: { id: true, name: true },
        })
      : await this.funilPadrao(officeId);

    if (!funil) throw new NotFoundException('Funil não encontrado');

    const etapas = await this.prisma.pipelineStage.findMany({
      where: { officeId, pipelineId: funil.id, deletedAt: null },
      select: { id: true, name: true, color: true, kind: true, position: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    const filtroComum: Prisma.LeadWhereInput = {
      officeId,
      deletedAt: null,
      ...(dto.ownerId && { ownerId: dto.ownerId }),
      ...(dto.search && {
        OR: [
          { name: { contains: dto.search, mode: 'insensitive' as const } },
          { remotejid: { contains: dto.search } },
        ],
      }),
      ...(dto.tagIds?.length && {
        AND: dto.tagIds.map((tagId) => ({ tags: { some: { tagId } } })),
      }),
    };

    const colunas = await Promise.all(
      etapas.map(async (etapa) => {
        const where = { ...filtroComum, stageId: etapa.id };

        const [leads, total, soma] = await Promise.all([
          this.prisma.lead.findMany({
            where,
            select: CAMPOS_CARTAO,
            orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
            take: dto.porEtapa,
          }),
          this.prisma.lead.count({ where }),
          this.prisma.lead.aggregate({ where, _sum: { value: true } }),
        ]);

        return {
          ...etapa,
          total,
          valorTotal: soma._sum.value ?? null,
          leads: leads.map(achatarEtiquetas),
        };
      }),
    );

    return { pipeline: funil, stages: colunas };
  }

  /**
   * Números do funil na janela pedida.
   *
   * O tempo médio por etapa sai do histórico, não do estado atual: o estado
   * atual só sabe onde o lead está agora, e a pergunta "quanto tempo os leads
   * ficam parados na proposta" é sobre quem já saiu de lá.
   */
  async metricas(officeId: string, dto: MetricasDoFunilDto) {
    const funil = dto.pipelineId
      ? await this.prisma.pipeline.findFirst({
          where: { id: dto.pipelineId, officeId, deletedAt: null },
          select: { id: true, name: true },
        })
      : await this.funilPadrao(officeId);

    if (!funil) throw new NotFoundException('Funil não encontrado');

    const desde = new Date(Date.now() - dto.dias * 24 * 60 * 60 * 1000);

    const etapas = await this.prisma.pipelineStage.findMany({
      where: { officeId, pipelineId: funil.id, deletedAt: null },
      select: { id: true, name: true, color: true, kind: true, position: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    const base: Prisma.LeadWhereInput = {
      officeId,
      pipelineId: funil.id,
      deletedAt: null,
    };

    const [porEtapa, tempos, criados, ganhos, perdidos, valorGanho] =
      await Promise.all([
        this.prisma.lead.groupBy({
          by: ['stageId'],
          where: base,
          _count: { _all: true },
          _sum: { value: true },
        }),
        this.prisma.leadStageHistory.groupBy({
          by: ['fromStageId'],
          where: {
            officeId,
            createdAt: { gte: desde },
            secondsInPreviousStage: { not: null },
            fromStage: { pipelineId: funil.id },
          },
          _avg: { secondsInPreviousStage: true },
        }),
        this.prisma.lead.count({
          where: { ...base, createdAt: { gte: desde } },
        }),
        this.prisma.lead.count({
          where: {
            ...base,
            status: LeadStatus.CONVERTED,
            updatedAt: { gte: desde },
          },
        }),
        this.prisma.lead.count({
          where: { ...base, status: LeadStatus.LOST, lostAt: { gte: desde } },
        }),
        this.prisma.lead.aggregate({
          where: {
            ...base,
            status: LeadStatus.CONVERTED,
            updatedAt: { gte: desde },
          },
          _sum: { value: true },
        }),
      ]);

    const contagem = new Map(porEtapa.map((e) => [e.stageId, e]));
    const tempoMedio = new Map(tempos.map((t) => [t.fromStageId, t._avg]));

    const fechados = ganhos + perdidos;

    return {
      pipeline: funil,
      stages: etapas.map((etapa) => ({
        ...etapa,
        leads: contagem.get(etapa.id)?._count._all ?? 0,
        valorTotal: contagem.get(etapa.id)?._sum.value ?? null,
        tempoMedioSegundos: Math.round(
          tempoMedio.get(etapa.id)?.secondsInPreviousStage ?? 0,
        ),
      })),
      periodo: {
        dias: dto.dias,
        criados,
        ganhos,
        perdidos,
        valorGanho: valorGanho._sum.value ?? null,
        // Sobre o que FECHOU no período, não sobre o que entrou: um lead
        // criado ontem ainda não teve chance de virar cliente, e contá-lo no
        // denominador faz a taxa cair sempre que a captação aumenta.
        taxaConversao: fechados === 0 ? null : ganhos / fechados,
      },
    };
  }

  // -------------------------------------------------------------- apoio

  private async funilPadrao(officeId: string) {
    const padrao = await this.prisma.pipeline.findFirst({
      where: { officeId, isDefault: true, deletedAt: null },
      select: { id: true, name: true },
    });

    if (padrao) return padrao;

    // Escritório anterior ao funil, ou padrão apagado no banco: criar na hora
    // é melhor que devolver um quadro vazio sem explicação.
    await this.pipelines.garantirFunilPadrao(officeId);

    return this.prisma.pipeline.findFirst({
      where: { officeId, isDefault: true, deletedAt: null },
      select: { id: true, name: true },
    });
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.lead.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Lead não encontrado');
  }

  private async garantirEtapa(officeId: string, stageId: string) {
    const etapa = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, officeId, deletedAt: null },
      select: { id: true, pipelineId: true, position: true, kind: true },
    });

    if (!etapa) throw new NotFoundException('Etapa não encontrada');

    return { ...etapa, stageId: etapa.id };
  }

  /** O responsável precisa ser membro DESTE escritório. */
  private async garantirMembro(officeId: string, userId: string) {
    const membro = await this.prisma.officeMember.findUnique({
      where: { userId_officeId: { userId, officeId } },
      select: { id: true },
    });

    if (!membro) {
      throw new NotFoundException(
        'O responsável precisa ser membro deste escritório',
      );
    }
  }

  /**
   * Traduz a violação da unicidade num 409 que diz de quem é o número.
   *
   * Devolver só "já existe" obrigaria quem está na tela a procurar o lead na
   * mão. Com o id, a interface oferece abrir a ficha existente — que é o que a
   * pessoa queria fazer.
   */
  private async traduzirDuplicidade(
    erro: unknown,
    officeId: string,
    remotejid: string,
  ): Promise<unknown> {
    if (
      !(erro instanceof Prisma.PrismaClientKnownRequestError) ||
      erro.code !== 'P2002'
    ) {
      return erro;
    }

    const existente = await this.prisma.lead.findFirst({
      where: { officeId, remotejid },
      select: { id: true, name: true, deletedAt: true },
    });

    if (existente?.deletedAt) {
      return new ConflictException({
        message:
          'Existe um lead excluído com este telefone. Restaure-o em vez de criar outro.',
        leadId: existente.id,
        excluido: true,
      });
    }

    return new ConflictException({
      message:
        `Já existe um lead com este telefone: ${existente?.name ?? ''}`.trim(),
      leadId: existente?.id,
      excluido: false,
    });
  }
}
