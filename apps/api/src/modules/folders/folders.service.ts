import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import type {
  AtualizarPastaDto,
  CriarPastaDto,
  ListarPastasDto,
} from './dto/folder.dto';

const CAMPOS = {
  id: true,
  title: true,
  system: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarPastasDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.customerId && { customerId: dto.customerId }),
      ...(dto.search && {
        title: { contains: dto.search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.folder.findMany({
        where,
        select: { ...CAMPOS, _count: { select: { documents: true } } },
        // As do sistema primeiro: são as que o usuário espera encontrar no topo
        orderBy: [{ system: 'desc' }, { title: 'asc' }],
        ...janela(dto),
      }),
      this.prisma.folder.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const pasta = await this.prisma.folder.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        customer: { select: { id: true, name: true } },
        _count: { select: { documents: true } },
      },
    });

    if (!pasta) throw new NotFoundException('Pasta não encontrada');

    return pasta;
  }

  async criar(officeId: string, dto: CriarPastaDto) {
    if (dto.customerId) await this.garantirCliente(officeId, dto.customerId);

    return this.prisma.folder.create({
      data: { officeId, title: dto.title, customerId: dto.customerId },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarPastaDto) {
    const pasta = await this.buscar(officeId, id);

    if (pasta.system) {
      throw new BadRequestException(
        'Pasta criada pelo sistema não pode ser renomeada',
      );
    }

    return this.prisma.folder.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });
  }

  /**
   * Exclusão lógica.
   *
   * Os documentos ficam: a pasta é organização, não conteúdo. Apagá-los junto
   * transformaria um clique de arrumação em perda de arquivo — e o sistema
   * anterior não tinha como reverter.
   */
  async remover(officeId: string, id: string): Promise<void> {
    const pasta = await this.buscar(officeId, id);

    if (pasta.system) {
      throw new BadRequestException(
        'Pasta criada pelo sistema não pode ser removida',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Os documentos voltam para a raiz em vez de apontarem para uma pasta
      // que não existe mais
      await tx.document.updateMany({
        where: { folderId: id, officeId },
        data: { folderId: null },
      });

      await tx.folder.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  private async buscar(officeId: string, id: string) {
    const pasta = await this.prisma.folder.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true, system: true },
    });

    if (!pasta) throw new NotFoundException('Pasta não encontrada');

    return pasta;
  }

  /** O cliente precisa ser do mesmo escritório — ver o schema, chave composta. */
  private async garantirCliente(
    officeId: string,
    customerId: string,
  ): Promise<void> {
    const cliente = await this.prisma.customer.findFirst({
      where: { id: customerId, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado');
  }
}
