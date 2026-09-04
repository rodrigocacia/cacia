import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import type { AtualizarAgenteDto, CriarAgenteDto } from './dto/agent.dto';

const CAMPOS = {
  id: true,
  type: true,
  name: true,
  gender: true,
  style: true,
  greeting: true,
  createdAt: true,
} as const;

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  listar(officeId: string) {
    return this.prisma.agent.findMany({
      where: { officeId, deletedAt: null },
      select: CAMPOS,
      orderBy: { createdAt: 'asc' },
    });
  }

  async detalhar(officeId: string, id: string) {
    const agente = await this.prisma.agent.findFirst({
      where: { id, officeId, deletedAt: null },
      select: CAMPOS,
    });

    if (!agente) throw new NotFoundException('Agente não encontrado');

    return agente;
  }

  criar(officeId: string, dto: CriarAgenteDto) {
    return this.prisma.agent.create({
      data: { ...dto, officeId },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarAgenteDto) {
    await this.detalhar(officeId, id);

    return this.prisma.agent.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.detalhar(officeId, id);

    await this.prisma.agent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
