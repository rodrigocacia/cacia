import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceValueType } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { PromptService } from '@/ai/agente/prompt.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import { booleanoDe } from '@/common/dto/booleano-da-query';
import type {
  AtualizarServicoDto,
  CriarServicoDto,
  ListarServicosDto,
} from './dto/service.dto';

const CAMPOS = {
  id: true,
  title: true,
  description: true,
  area: true,
  valueType: true,
  valueFixed: true,
  valueFloat: true,
  valueDetail: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Serviços oferecidos pelo escritório.
 *
 * Não são só um cadastro: entram no bloco estático do prompt, e é por eles que
 * o agente sabe o que o escritório faz e quanto cobra. Por isso toda alteração
 * invalida o cache — sem isso, o agente seguiria informando o preço antigo por
 * até 15 minutos.
 */
@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prompt: PromptService,
  ) {}

  async listar(officeId: string, dto: ListarServicosDto) {
    const situacao = booleanoDe(dto.status);

    const where = {
      officeId,
      deletedAt: null,
      ...(dto.area && { area: dto.area }),
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
      this.prisma.service.findMany({
        where,
        select: CAMPOS,
        orderBy: { title: 'asc' },
        ...janela(dto),
      }),
      this.prisma.service.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const servico = await this.prisma.service.findFirst({
      where: { id, officeId, deletedAt: null },
      select: CAMPOS,
    });

    if (!servico) throw new NotFoundException('Serviço não encontrado');

    return servico;
  }

  async criar(officeId: string, dto: CriarServicoDto) {
    this.conferirValor(dto.valueType, dto);

    const servico = await this.prisma.service.create({
      data: { officeId, ...dto },
      select: CAMPOS,
    });

    await this.prompt.invalidar(officeId);

    return servico;
  }

  async atualizar(officeId: string, id: string, dto: AtualizarServicoDto) {
    const atual = await this.detalhar(officeId, id);

    this.conferirValor(dto.valueType ?? atual.valueType, {
      valueFixed: dto.valueFixed ?? Number(atual.valueFixed ?? 0),
      valueDetail: dto.valueDetail ?? atual.valueDetail ?? undefined,
    });

    const servico = await this.prisma.service.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });

    await this.prompt.invalidar(officeId);

    return servico;
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.detalhar(officeId, id);

    await this.prisma.service.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prompt.invalidar(officeId);
  }

  /**
   * O tipo de valor precisa vir com o valor correspondente.
   *
   * Sem esta conferência, um serviço FIXED sem `valueFixed` apareceria no
   * prompt como "sob consulta" — e o agente informaria algo diferente do que
   * o escritório quis dizer.
   */
  private conferirValor(
    tipo: ServiceValueType,
    valores: { valueFixed?: number | null; valueDetail?: string | null },
  ): void {
    if (tipo === ServiceValueType.FIXED && !valores.valueFixed) {
      throw new BadRequestException(
        'Serviço com valor fixo precisa do campo valueFixed',
      );
    }

    if (tipo === ServiceValueType.PERSONAL && !valores.valueDetail?.trim()) {
      throw new BadRequestException(
        'Serviço com valor personalizado precisa do campo valueDetail',
      );
    }
  }
}
