import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StageKind } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { projetarStatus } from '../leads/projecao-de-status';
import { etapasPadrao, FUNIL_PADRAO } from './funil-padrao';
import type {
  AtualizarEtapaDto,
  AtualizarFunilDto,
  CriarEtapaDto,
  CriarFunilDto,
  ReordenarEtapasDto,
} from './dto/pipeline.dto';

const CAMPOS_ETAPA = {
  id: true,
  name: true,
  color: true,
  position: true,
  kind: true,
} as const;

const CAMPOS_FUNIL = {
  id: true,
  name: true,
  isDefault: true,
  createdAt: true,
} as const;

/** Transação do Prisma ou o próprio client — as duas servem às consultas aqui. */
type Executor = Prisma.TransactionClient | PrismaService;

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string) {
    await this.garantirFunilPadrao(officeId);

    return this.prisma.pipeline.findMany({
      where: { officeId, deletedAt: null },
      select: {
        ...CAMPOS_FUNIL,
        stages: {
          where: { deletedAt: null },
          select: CAMPOS_ETAPA,
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async detalhar(officeId: string, id: string) {
    const funil = await this.prisma.pipeline.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS_FUNIL,
        stages: {
          where: { deletedAt: null },
          select: { ...CAMPOS_ETAPA, _count: { select: { leads: true } } },
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!funil) throw new NotFoundException('Funil não encontrado');

    return funil;
  }

  async criar(officeId: string, dto: CriarFunilDto) {
    return this.prisma.$transaction(async (tx) => {
      const primeiro = await tx.pipeline.count({
        where: { officeId, deletedAt: null },
      });

      const funil = await tx.pipeline.create({
        // O primeiro funil do escritório é o padrão por construção: sem isso
        // o lead do WhatsApp não teria onde cair.
        data: { officeId, name: dto.name, isDefault: primeiro === 0 },
        select: CAMPOS_FUNIL,
      });

      if (!dto.semEtapasPadrao) {
        await tx.pipelineStage.createMany({
          data: etapasPadrao(officeId, funil.id),
        });
      }

      return funil;
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarFunilDto) {
    await this.garantirFunil(officeId, id);

    return this.prisma.$transaction(async (tx) => {
      // Exatamente um padrão por escritório: desmarcar os outros e marcar
      // este vai na MESMA transação, senão existe um instante com zero (ou
      // dois) padrões — e é nesse instante que um lead chega pelo webhook.
      if (dto.isDefault) {
        await tx.pipeline.updateMany({
          where: { officeId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.pipeline.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
        select: CAMPOS_FUNIL,
      });
    });
  }

  async remover(officeId: string, id: string): Promise<void> {
    const funil = await this.garantirFunil(officeId, id);

    if (funil.isDefault) {
      throw new BadRequestException(
        'O funil padrão não pode ser excluído. Marque outro como padrão antes.',
      );
    }

    const leads = await this.prisma.lead.count({
      where: { officeId, pipelineId: id, deletedAt: null },
    });

    if (leads > 0) {
      throw new ConflictException(
        `Este funil tem ${leads} lead(s). Mova-os para outro funil antes de excluir.`,
      );
    }

    await this.prisma.pipeline.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ---------------------------------------------------------------- etapas

  async criarEtapa(officeId: string, pipelineId: string, dto: CriarEtapaDto) {
    await this.garantirFunil(officeId, pipelineId);

    const ultima = await this.prisma.pipelineStage.findFirst({
      where: { officeId, pipelineId, deletedAt: null },
      select: { position: true },
      orderBy: { position: 'desc' },
    });

    return this.prisma.pipelineStage.create({
      data: {
        officeId,
        pipelineId,
        name: dto.name,
        color: dto.color ?? '#6B7280',
        kind: dto.kind ?? StageKind.OPEN,
        position: (ultima?.position ?? -1) + 1,
      },
      select: CAMPOS_ETAPA,
    });
  }

  /**
   * Altera a etapa e, se a natureza dela mudou, reprojeta o `status` de todo
   * lead que está nela.
   *
   * Sem essa reprojeção, transformar uma coluna em "ganho" deixaria os leads
   * dentro dela com `status` aberto: o quadro mostraria uma coisa e a
   * listagem, os filtros e o agente, outra.
   */
  async atualizarEtapa(officeId: string, id: string, dto: AtualizarEtapaDto) {
    const etapa = await this.garantirEtapa(officeId, id);

    return this.prisma.$transaction(async (tx) => {
      const atualizada = await tx.pipelineStage.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.color !== undefined && { color: dto.color }),
          ...(dto.kind !== undefined && { kind: dto.kind }),
        },
        select: CAMPOS_ETAPA,
      });

      if (dto.kind !== undefined && dto.kind !== etapa.kind) {
        await tx.lead.updateMany({
          where: { officeId, stageId: id, deletedAt: null },
          data: { status: projetarStatus(atualizada) },
        });
      }

      return atualizada;
    });
  }

  async removerEtapa(officeId: string, id: string): Promise<void> {
    const etapa = await this.garantirEtapa(officeId, id);

    const [leads, irmas] = await Promise.all([
      this.prisma.lead.count({
        where: { officeId, stageId: id, deletedAt: null },
      }),
      this.prisma.pipelineStage.count({
        where: { officeId, pipelineId: etapa.pipelineId, deletedAt: null },
      }),
    ]);

    // Recusar em vez de realocar: mover lead de etapa é decisão comercial, e
    // fazer isso em silêncio, no meio de uma exclusão, é como um funil perde
    // a informação de onde cada negócio estava.
    if (leads > 0) {
      throw new ConflictException(
        `Esta etapa tem ${leads} lead(s). Mova-os para outra etapa antes de excluir.`,
      );
    }

    if (irmas <= 1) {
      throw new BadRequestException('O funil precisa de pelo menos uma etapa.');
    }

    await this.prisma.pipelineStage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Reescreve a ordem inteira das etapas do funil.
   *
   * Recebe a lista completa e exige que ela case exatamente com as etapas
   * ativas: uma lista parcial deixaria as demais com posição repetida, e
   * duas colunas na mesma posição têm ordem indefinida na tela.
   *
   * Como as posições mudam de valor, o `status` projetado pode mudar junto —
   * a primeira coluna é `NEW` e as outras `IN_CONTACT`. Por isso a reprojeção
   * acontece aqui também.
   */
  async reordenarEtapas(
    officeId: string,
    pipelineId: string,
    dto: ReordenarEtapasDto,
  ) {
    await this.garantirFunil(officeId, pipelineId);

    const atuais = await this.prisma.pipelineStage.findMany({
      where: { officeId, pipelineId, deletedAt: null },
      select: { id: true, kind: true },
    });

    const conhecidas = new Set(atuais.map((e) => e.id));
    const recebidas = new Set(dto.stageIds);

    if (
      recebidas.size !== dto.stageIds.length ||
      recebidas.size !== conhecidas.size ||
      dto.stageIds.some((id) => !conhecidas.has(id))
    ) {
      throw new BadRequestException(
        'A lista precisa conter exatamente as etapas ativas deste funil, sem repetição.',
      );
    }

    const naturezaPorId = new Map(atuais.map((e) => [e.id, e.kind]));

    await this.prisma.$transaction(
      dto.stageIds.flatMap((id, position) => {
        const kind = naturezaPorId.get(id) as StageKind;

        return [
          this.prisma.pipelineStage.update({
            where: { id },
            data: { position },
          }),
          this.prisma.lead.updateMany({
            where: { officeId, stageId: id, deletedAt: null },
            data: { status: projetarStatus({ kind, position }) },
          }),
        ];
      }),
    );

    return this.detalhar(officeId, pipelineId);
  }

  // -------------------------------------------------------------- apoio

  /**
   * Primeira etapa do funil padrão — onde cai quem não escolheu.
   *
   * É o caminho do lead criado pelo webhook do WhatsApp, que não tem tela nem
   * usuário para decidir nada. Cria o funil padrão se ele não existir: um
   * escritório sem funil não pode significar um lead sem lugar.
   */
  async etapaInicial(
    officeId: string,
    executor: Executor = this.prisma,
  ): Promise<{
    pipelineId: string;
    stageId: string;
    position: number;
    kind: StageKind;
  }> {
    const etapa = await executor.pipelineStage.findFirst({
      where: {
        officeId,
        deletedAt: null,
        pipeline: { isDefault: true, deletedAt: null },
      },
      select: { id: true, pipelineId: true, position: true, kind: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    if (etapa) {
      return {
        pipelineId: etapa.pipelineId,
        stageId: etapa.id,
        position: etapa.position,
        kind: etapa.kind,
      };
    }

    const criada = await this.garantirFunilPadrao(officeId);

    if (!criada) {
      // Existe funil padrão mas nenhuma etapa ativa nele — só acontece se
      // alguém apagou tudo direto no banco.
      throw new BadRequestException(
        'O funil padrão está sem etapas. Configure ao menos uma antes de cadastrar leads.',
      );
    }

    return criada;
  }

  /**
   * Cria o funil padrão se o escritório não tiver nenhum.
   *
   * Devolve a primeira etapa quando criou, `null` quando já havia funil.
   */
  async garantirFunilPadrao(officeId: string): Promise<{
    pipelineId: string;
    stageId: string;
    position: number;
    kind: StageKind;
  } | null> {
    const existe = await this.prisma.pipeline.count({
      where: { officeId, deletedAt: null },
    });

    if (existe > 0) return null;

    return this.prisma.$transaction(async (tx) => {
      const funil = await tx.pipeline.create({
        data: { officeId, name: FUNIL_PADRAO.nome, isDefault: true },
        select: { id: true },
      });

      await tx.pipelineStage.createMany({
        data: etapasPadrao(officeId, funil.id),
      });

      const primeira = await tx.pipelineStage.findFirstOrThrow({
        where: { officeId, pipelineId: funil.id },
        select: { id: true, position: true, kind: true },
        orderBy: { position: 'asc' },
      });

      return {
        pipelineId: funil.id,
        stageId: primeira.id,
        position: primeira.position,
        kind: primeira.kind,
      };
    });
  }

  private async garantirFunil(officeId: string, id: string) {
    const funil = await this.prisma.pipeline.findFirst({
      // officeId no where, não só o id: buscar apenas por id devolveria o
      // registro de outro escritório
      where: { id, officeId, deletedAt: null },
      select: { id: true, isDefault: true },
    });

    if (!funil) throw new NotFoundException('Funil não encontrado');

    return funil;
  }

  private async garantirEtapa(officeId: string, id: string) {
    const etapa = await this.prisma.pipelineStage.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true, pipelineId: true, kind: true, position: true },
    });

    if (!etapa) throw new NotFoundException('Etapa não encontrada');

    return etapa;
  }
}
