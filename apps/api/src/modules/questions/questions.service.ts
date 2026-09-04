import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PromptService } from '@/ai/agente/prompt.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { booleanoDe } from '@/common/dto/booleano-da-query';
import type {
  AtualizarPerguntaDto,
  CriarPerguntaDto,
  ListarPerguntasDto,
} from './dto/question.dto';

const CAMPOS = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Perguntas frequentes do escritório.
 *
 * Entram no bloco estático do prompt: são a forma de o escritório ensinar o
 * agente a responder o que se repete, sem precisar de código. Por isso toda
 * alteração invalida o cache.
 */
@Injectable()
export class QuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prompt: PromptService,
  ) {}

  async listar(officeId: string, dto: ListarPerguntasDto) {
    const situacao = booleanoDe(dto.status);

    const where = {
      officeId,
      deletedAt: null,
      ...(situacao !== undefined && { status: situacao }),
      ...(dto.search && {
        OR: [
          { title: { contains: dto.search, mode: 'insensitive' as const } },
          {
            description: { contains: dto.search, mode: 'insensitive' as const },
          },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        select: CAMPOS,
        orderBy: { createdAt: 'desc' },
        ...janela(dto),
      }),
      this.prisma.question.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const pergunta = await this.prisma.question.findFirst({
      where: { id, officeId, deletedAt: null },
      select: CAMPOS,
    });

    if (!pergunta) throw new NotFoundException('Pergunta não encontrada');

    return pergunta;
  }

  async criar(officeId: string, dto: CriarPerguntaDto) {
    const pergunta = await this.prisma.question.create({
      data: { officeId, ...dto },
      select: CAMPOS,
    });

    await this.prompt.invalidar(officeId);

    return pergunta;
  }

  async atualizar(officeId: string, id: string, dto: AtualizarPerguntaDto) {
    await this.detalhar(officeId, id);

    const pergunta = await this.prisma.question.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });

    await this.prompt.invalidar(officeId);

    return pergunta;
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.detalhar(officeId, id);

    await this.prisma.question.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prompt.invalidar(officeId);
  }
}
