import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import type {
  AtualizarLeadDto,
  ConverterLeadDto,
  CriarLeadDto,
  ListarLeadsDto,
} from './dto/lead.dto';

const CAMPOS = {
  id: true,
  name: true,
  remotejid: true,
  email: true,
  briefing: true,
  status: true,
  customerId: true,
  lastActivityAt: true,
  createdAt: true,
} as const;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarLeadsDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.status && { status: dto.status }),
      ...(dto.search && {
        OR: [
          { name: { contains: dto.search, mode: 'insensitive' as const } },
          { remotejid: { contains: dto.search } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        select: CAMPOS,
        orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
        ...janela(dto),
      }),
      this.prisma.lead.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async detalhar(officeId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      // officeId no where, não só o id: buscar apenas por id devolveria o
      // registro de outro escritório
      where: { id, officeId, deletedAt: null },
      select: {
        ...CAMPOS,
        customer: { select: { id: true, name: true, document: true } },
        _count: { select: { chats: true, events: true, documents: true } },
      },
    });

    if (!lead) throw new NotFoundException('Lead não encontrado');

    return lead;
  }

  criar(officeId: string, dto: CriarLeadDto) {
    return this.prisma.lead.create({
      data: { ...dto, officeId, lastActivityAt: new Date() },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarLeadDto) {
    await this.garantirQueExiste(officeId, id);

    return this.prisma.lead.update({
      where: { id },
      data: dto,
      select: CAMPOS,
    });
  }

  /**
   * Converte o lead em cliente.
   *
   * Vincula a um cliente existente ou cria um novo a partir dos dados do lead.
   * As duas escritas vão na mesma transação: um lead marcado como convertido
   * sem cliente vinculado é um estado que a interface não sabe representar.
   */
  async converter(officeId: string, id: string, dto: ConverterLeadDto) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, officeId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        remotejid: true,
        briefing: true,
        status: true,
      },
    });

    if (!lead) throw new NotFoundException('Lead não encontrado');

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Este lead já foi convertido');
    }

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
            name: lead.name,
            email: lead.email,
            briefing: lead.briefing,
            remotejid: lead.remotejid,
            document: dto.document.replace(/\D/g, ''),
          },
          select: { id: true },
        });
        customerId = novo.id;
      }

      return tx.lead.update({
        where: { id: lead.id },
        data: { status: LeadStatus.CONVERTED, customerId },
        select: CAMPOS,
      });
    });
  }

  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.lead.findFirst({
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Lead não encontrado');
  }
}
