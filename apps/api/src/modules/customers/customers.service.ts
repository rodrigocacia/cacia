import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import type {
  AtualizarClienteDto,
  CriarClienteDto,
  ListarClientesDto,
} from './dto/customer.dto';

const CAMPOS = {
  id: true,
  name: true,
  document: true,
  remotejid: true,
  email: true,
  briefing: true,
  legalName: true,
  tradeName: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarClientesDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.search && {
        OR: [
          { name: { contains: dto.search, mode: 'insensitive' as const } },
          { document: { contains: dto.search.replace(/\D/g, '') } },
          { email: { contains: dto.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        select: CAMPOS,
        orderBy: { name: 'asc' },
        ...janela(dto),
      }),
      this.prisma.customer.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const cliente = await this.prisma.customer.findFirst({
      // officeId no where, não só no id: buscar por id sozinho devolveria o
      // registro de outro escritório
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        addresses: true,
        _count: { select: { processes: true, documents: true, events: true } },
      },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    return cliente;
  }

  async criar(officeId: string, dto: CriarClienteDto) {
    const duplicado = await this.prisma.customer.findFirst({
      where: { officeId, document: dto.document, deletedAt: null },
      select: { id: true },
    });

    if (duplicado) {
      throw new ConflictException(
        'Já existe um cliente com este documento neste escritório',
      );
    }

    return this.prisma.customer.create({
      data: { ...dto, officeId },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarClienteDto) {
    await this.garantirQueExiste(officeId, id);

    return this.prisma.customer.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });
  }

  /** Exclusão lógica — o histórico processual não pode desaparecer. */
  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.customer.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Cliente não encontrado');
  }
}
