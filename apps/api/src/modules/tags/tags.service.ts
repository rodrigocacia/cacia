import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { janela, montarPaginacao } from '@/common/dto/paginacao.dto';
import type {
  AtualizarEtiquetaDto,
  CriarEtiquetaDto,
  ListarEtiquetasDto,
} from './dto/tag.dto';

const CAMPOS = {
  id: true,
  name: true,
  color: true,
  createdAt: true,
} as const;

/** Transação do Prisma ou o próprio client. */
type Executor = Prisma.TransactionClient | PrismaService;

/**
 * Etiquetas do escritório.
 *
 * Não confundir com `Mark`: aquilo é memória do agente e vai para o Qdrant.
 * Etiqueta é organização humana e nunca entra no contexto do modelo.
 */
@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(officeId: string, dto: ListarEtiquetasDto) {
    const where = {
      officeId,
      deletedAt: null,
      ...(dto.search && {
        name: { contains: dto.search, mode: 'insensitive' as const },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        select: {
          ...CAMPOS,
          _count: { select: { leads: true, customers: true } },
        },
        orderBy: { name: 'asc' },
        ...janela(dto),
      }),
      this.prisma.tag.count({ where }),
    ]);

    return montarPaginacao(data, total, dto);
  }

  async criar(officeId: string, dto: CriarEtiquetaDto) {
    // A unicidade é do banco; aqui só traduzimos a violação em mensagem. Testar
    // antes e criar depois abriria janela para duas requisições simultâneas
    // passarem no teste e uma delas estourar 500 na criação.
    try {
      return await this.prisma.tag.create({
        data: { officeId, name: dto.name, color: dto.color ?? '#6B7280' },
        select: CAMPOS,
      });
    } catch (erro) {
      throw this.traduzirDuplicidade(erro, dto.name);
    }
  }

  async atualizar(officeId: string, id: string, dto: AtualizarEtiquetaDto) {
    await this.garantirQueExiste(officeId, id);

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.color !== undefined && { color: dto.color }),
        },
        select: CAMPOS,
      });
    } catch (erro) {
      throw this.traduzirDuplicidade(erro, dto.name ?? '');
    }
  }

  /**
   * Exclui a etiqueta e a tira de tudo a que estava aplicada.
   *
   * A remoção dos vínculos é física, não lógica: uma etiqueta excluída que
   * continuasse aparecendo no cartão do lead seria um fantasma que ninguém
   * consegue remover pela tela.
   */
  async remover(officeId: string, id: string): Promise<void> {
    await this.garantirQueExiste(officeId, id);

    await this.prisma.$transaction([
      this.prisma.leadTag.deleteMany({ where: { officeId, tagId: id } }),
      this.prisma.customerTag.deleteMany({ where: { officeId, tagId: id } }),
      this.prisma.tag.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
  }

  /**
   * Confere que todas as etiquetas existem NESTE escritório.
   *
   * Chamado antes de qualquer vínculo. A chave estrangeira composta já
   * recusaria uma etiqueta de outro tenant, mas o erro seria de banco: aqui a
   * recusa vira 404 com o motivo legível.
   */
  async validar(
    officeId: string,
    tagIds: string[],
    executor: Executor = this.prisma,
  ): Promise<string[]> {
    const unicos = [...new Set(tagIds)];

    if (unicos.length === 0) return [];

    const encontradas = await executor.tag.findMany({
      where: { officeId, id: { in: unicos }, deletedAt: null },
      select: { id: true },
    });

    if (encontradas.length !== unicos.length) {
      throw new NotFoundException(
        'Uma ou mais etiquetas não existem neste escritório',
      );
    }

    return unicos;
  }

  private async garantirQueExiste(officeId: string, id: string): Promise<void> {
    const existe = await this.prisma.tag.findFirst({
      // officeId no where, não só o id: buscar apenas por id devolveria o
      // registro de outro escritório
      where: { id, officeId, deletedAt: null },
      select: { id: true },
    });

    if (!existe) throw new NotFoundException('Etiqueta não encontrada');
  }

  private traduzirDuplicidade(erro: unknown, nome: string): unknown {
    if (
      erro instanceof Prisma.PrismaClientKnownRequestError &&
      erro.code === 'P2002'
    ) {
      return new ConflictException(`Já existe uma etiqueta chamada "${nome}"`);
    }

    return erro;
  }
}
