import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';

const CAMPOS = {
  id: true,
  type: true,
  title: true,
  description: true,
  price: true,
  status: true,
} as const;

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /** Catálogo de planos ativos. É global — não pertence a escritório. */
  listar() {
    return this.prisma.plan.findMany({
      where: { status: true, deletedAt: null },
      select: CAMPOS,
      orderBy: { price: 'asc' },
    });
  }

  async detalhar(id: string) {
    const plano = await this.prisma.plan.findFirst({
      where: { id, deletedAt: null },
      select: CAMPOS,
    });

    if (!plano) throw new NotFoundException('Plano não encontrado');

    return plano;
  }
}
