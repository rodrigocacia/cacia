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
  addresses: {
    select: {
      id: true,
      cep: true,
      street: true,
      number: true,
      complement: true,
      neighborhood: true,
      city: true,
      state: true,
    },
  },
} as const;

/**
 * Alternativas de busca por texto.
 *
 * O trecho do documento entra SÓ quando o termo tem dígitos. Buscar por
 * "Maria" deixava `contains: ''` no filtro do documento — e no Postgres todo
 * texto contém a string vazia, então a cláusula casava com a base inteira e a
 * busca devolvia todos os clientes do escritório.
 */
function alternativasDeBusca(termo: string) {
  const digitos = termo.replace(/\D/g, '');

  return [
    { name: { contains: termo, mode: 'insensitive' as const } },
    { email: { contains: termo, mode: 'insensitive' as const } },
    ...(digitos
      ? [
          { document: { contains: digitos } },
          // A tela promete "buscar por nome ou telefone"
          { remotejid: { contains: digitos } },
        ]
      : []),
  ];
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarClientesDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.search && { OR: alternativasDeBusca(dto.search) }),
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
    // A unicidade (escritório, documento) ignora a exclusão lógica, de
    // propósito. Então a busca também não pode filtrar `deletedAt`: antes, um
    // CPF de cliente excluído passava pela checagem e morria no índice com 500.
    const existente = await this.prisma.customer.findFirst({
      where: { officeId, document: dto.document },
      select: { id: true, deletedAt: true },
    });

    if (existente && !existente.deletedAt) {
      throw new ConflictException(
        'Já existe um cliente com este documento neste escritório',
      );
    }

    const { addresses, ...dados } = dto;

    // Recadastrar quem foi excluído restaura o cadastro, com os dados novos —
    // o mesmo que o webhook faz com o lead que volta a escrever. Processos e
    // documentos antigos voltam junto, que é o esperado de um cliente que
    // retorna.
    if (existente) {
      return this.prisma.$transaction(async (tx) => {
        await tx.customerAddress.deleteMany({
          where: { customerId: existente.id, officeId },
        });

        return tx.customer.update({
          where: { id: existente.id },
          data: {
            ...dados,
            deletedAt: null,
            ...(addresses?.length && { addresses: { create: addresses } }),
          },
          select: CAMPOS,
        });
      });
    }

    return this.prisma.customer.create({
      data: {
        ...dados,
        officeId,
        ...(addresses?.length && {
          // Sem officeId: a chave do endereço para o cliente é composta
          // (customerId, officeId), e na criação aninhada o Prisma preenche as
          // duas a partir do pai. Informá-lo derrubava o cadastro com 500.
          addresses: { create: addresses },
        }),
      },
      select: CAMPOS,
    });
  }

  async atualizar(officeId: string, id: string, dto: AtualizarClienteDto) {
    await this.garantirQueExiste(officeId, id);

    const { addresses, ...dados } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (addresses) {
        // Substituição total: a tela envia o endereço inteiro, e um merge
        // parcial deixaria o bairro antigo junto da rua nova.
        await tx.customerAddress.deleteMany({ where: { customerId: id } });

        if (addresses.length > 0) {
          await tx.customerAddress.createMany({
            data: addresses.map((endereco) => ({
              ...endereco,
              customerId: id,
              officeId,
            })),
          });
        }
      }

      return tx.customer.update({
        where: { id },
        data: dados,
        select: CAMPOS,
      });
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
