import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessUpdateStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { JuditService } from '@/integrations/judit/judit.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import type {
  AtualizarProcessoDto,
  CriarProcessoDto,
  ListarProcessosDto,
} from './dto/process.dto';

const CAMPOS = {
  id: true,
  number: true,
  description: true,
  unit: true,
  type: true,
  status: true,
  updateStatus: true,
  customerId: true,
  instance: true,
  name: true,
  tribunal: true,
  tribunalAcronym: true,
  county: true,
  state: true,
  city: true,
  judge: true,
  phase: true,
  area: true,
  amount: true,
  currency: true,
  distributionDate: true,
  lastActivityAt: true,
  createdAt: true,
} as const;

/**
 * Alternativas de busca por texto.
 *
 * O número do processo só entra quando o termo tem dígitos — ver a mesma
 * regra em customers.service.ts. Sem isso, `contains: ''` casava com todos os
 * processos e a busca por texto virava uma listagem completa.
 */
function alternativasDeBusca(termo: string) {
  const digitos = termo.replace(/\D/g, '');

  return [
    { name: { contains: termo, mode: 'insensitive' as const } },
    { description: { contains: termo, mode: 'insensitive' as const } },
    ...(digitos ? [{ number: { contains: digitos } }] : []),
  ];
}

@Injectable()
export class ProcessesService {
  private readonly logger = new Logger(ProcessesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly judit: JuditService,
    private readonly config: ConfigService,
  ) {}

  async listar(officeId: string, dto: ListarProcessosDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.customerId && { customerId: dto.customerId }),
      ...(dto.search && { OR: alternativasDeBusca(dto.search) }),
    };

    const [data, total] = await Promise.all([
      this.prisma.process.findMany({
        where,
        select: {
          ...CAMPOS,
          customer: { select: { id: true, name: true } },
          _count: { select: { progresses: true, documents: true } },
        },
        orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
        ...janela(dto),
      }),
      this.prisma.process.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const processo = await this.prisma.process.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        // Vindos da Judit, em formato variável
        courts: true,
        classifications: true,
        subjects: true,
        parties: true,
        juditStatus: true,
        customer: { select: { id: true, name: true, document: true } },
      },
    });

    if (!processo) throw new NotFoundException('Processo não encontrado');

    return processo;
  }

  async criar(officeId: string, dto: CriarProcessoDto) {
    const numero = dto.number.replace(/\D/g, '');

    const cliente = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const duplicado = await this.prisma.process.findFirst({
      where: { officeId, number: numero, deletedAt: null },
      select: { id: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Este processo já está cadastrado neste escritório',
      );
    }

    const processo = await this.prisma.process.create({
      data: {
        officeId,
        customerId: dto.customerId,
        number: numero,
        description: dto.description,
        unit: dto.unit,
        type: dto.type,
      },
      select: CAMPOS,
    });

    await this.ativarAcompanhamento(officeId, processo.id, numero);

    return processo;
  }

  /**
   * Registra consulta e MONITORAMENTO CONTÍNUO na Judit.
   *
   * O sistema anterior chamava apenas a consulta pontual, no cadastro, e nunca
   * mais. Movimentações posteriores não chegavam: o produto virava um cadastro
   * de processos, quando deveria ser um acompanhamento.
   *
   * Falhar aqui não desfaz o cadastro — o processo existe e pode ser
   * acompanhado depois. Fica em ERROR, aparece em GET /processes/unmonitored
   * e a varredura do worker tenta de novo.
   *
   * Pública porque essa nova tentativa vem de fora: do processador de fila,
   * sem requisição HTTP por trás.
   */
  async ativarAcompanhamento(
    officeId: string,
    processId: string,
    numero: string,
  ): Promise<void> {
    if (!this.judit.estaConfigurado()) {
      this.logger.warn('Judit não configurada — processo sem acompanhamento');
      return;
    }

    const callback = `${this.config.getOrThrow<string>('APP_WEBHOOK_URL')}/webhooks/judit`;

    try {
      const [consulta, monitoramento] = await Promise.all([
        this.judit.consultar(numero, callback),
        this.judit.monitorar(numero, callback),
      ]);

      await this.prisma.process.update({
        where: { id: processId },
        data: {
          requestId: consulta.request_id,
          juditTrackingId: monitoramento.tracking_id,
          updateStatus: ProcessUpdateStatus.PROCESSING,
        },
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao ativar acompanhamento do processo ${numero}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );

      await this.prisma.process.update({
        where: { id: processId },
        data: { updateStatus: ProcessUpdateStatus.ERROR },
      });
    }
  }

  /**
   * Processos sem monitoramento contínuo.
   *
   * Existe para tornar visível o que antes era silencioso: um processo que
   * não recebe movimentação parece apenas um processo parado.
   */
  /**
   * Processos sem acompanhamento, de todos os escritórios.
   *
   * Sem escopo de tenant de propósito: quem chama é a varredura do worker, que
   * não roda no contexto de uma requisição. O `officeId` de cada um viaja no
   * job e volta a limitar tudo dali em diante.
   *
   * Só os que já falharam: um processo recém-cadastrado ainda está em
   * PROCESSING e não deve ser tentado de novo por cima.
   */
  listarParaRetomarAcompanhamento(limite = 50) {
    return this.prisma.process.findMany({
      where: {
        deletedAt: null,
        juditTrackingId: null,
        updateStatus: ProcessUpdateStatus.ERROR,
      },
      select: { id: true, officeId: true, number: true },
      orderBy: { updatedAt: 'asc' },
      take: limite,
    });
  }

  listarSemAcompanhamento(officeId: string) {
    return this.prisma.process.findMany({
      where: { officeId, deletedAt: null, juditTrackingId: null },
      select: {
        id: true,
        number: true,
        updateStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarProcessoDto) {
    await this.garantirQueExiste(officeId, id);

    return this.prisma.process.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });
  }

  /**
   * Exclusão lógica, com o monitoramento encerrado na Judit.
   *
   * Sem encerrar, o escritório continuaria pagando o acompanhamento de um
   * processo que excluiu — e os webhooks seguiriam chegando para um registro
   * que ninguém vê mais.
   */
  async remover(officeId: string, id: string): Promise<void> {
    const processo = await this.prisma.process.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { juditTrackingId: true },
    });

    if (!processo) throw new NotFoundException('Processo não encontrado');

    await this.prisma.process.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (!processo.juditTrackingId) return;

    // Depois da exclusão e sem propagar: o processo já saiu da vista do
    // usuário, e uma indisponibilidade da Judit não pode desfazer isso.
    await this.judit
      .pararMonitoramento(processo.juditTrackingId)
      .catch((erro: Error) => {
        this.logger.warn(
          `Processo ${id} excluído, mas o monitoramento ${processo.juditTrackingId} segue ativo na Judit: ${erro.message}`,
        );
      });
  }

  /** Andamentos do processo, do mais recente para o mais antigo. */
  async listarAndamentos(
    officeId: string,
    processId: string,
    dto: { page: number; limit: number },
  ) {
    await this.garantirQueExiste(officeId, processId);

    const where = { officeId, processId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prisma.progress.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          releaseAt: true,
          createdAt: true,
        },
        orderBy: [{ releaseAt: 'desc' }, { createdAt: 'desc' }],
        ...janela(dto),
      }),
      this.prisma.progress.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.process.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Processo não encontrado');
  }
}
