import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
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

@Injectable()
export class ProcessesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarProcessosDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.customerId && { customerId: dto.customerId }),
      ...(dto.search && {
        OR: [
          { number: { contains: dto.search.replace(/\D/g, '') } },
          { name: { contains: dto.search, mode: 'insensitive' as const } },
          {
            description: { contains: dto.search, mode: 'insensitive' as const },
          },
        ],
      }),
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

    return this.prisma.process.create({
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
  }

  async atualizar(officeId: string, id: string, dto: AtualizarProcessoDto) {
    await this.garantirQueExiste(officeId, id);

    return this.prisma.process.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.process.update({
      where: { id },
      data: { deletedAt: new Date() },
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
