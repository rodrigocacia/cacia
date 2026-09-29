import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { JuditService } from '@/integrations/judit/judit.service';
import { CustomersService } from './customers/customers.service';
import { LeadsService } from './leads/leads.service';
import { PipelinesService } from './pipelines/pipelines.service';
import { ProcessesService } from './processes/processes.service';
import { TagsService } from './tags/tags.service';

/**
 * O invariante destes módulos: NENHUMA consulta pode buscar só pelo id.
 *
 * Buscar por id sozinho devolveria o registro de outro escritório — o guard
 * valida que o usuário pertence ao escritório, mas não impede a consulta de
 * alcançar dado alheio se o officeId ficar de fora do `where`.
 */

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';
const REGISTRO = 'bbbbbbbb-0000-0000-0000-000000000001';

function prismaEspiao(retorno: unknown = null) {
  const findFirst = vi.fn().mockResolvedValue(retorno);
  const findMany = vi.fn().mockResolvedValue([]);
  const count = vi.fn().mockResolvedValue(0);
  const update = vi.fn().mockResolvedValue({});

  const modelo = { findFirst, findMany, count, update };

  const prisma = {
    customer: modelo,
    lead: modelo,
    process: modelo,
    progress: modelo,
    pipeline: modelo,
    pipelineStage: modelo,
    tag: modelo,
  } as unknown as PrismaService;

  return { prisma, findFirst, findMany, update };
}

/**
 * O serviço de leads passou a depender do funil e das etiquetas.
 *
 * Nenhum dos dois participa das consultas verificadas aqui — mas o construtor
 * os exige, e passar só o Prisma esconderia de vez um deles começar a aparecer
 * na leitura sem o officeId.
 */
function servicoDeLeads(prisma: PrismaService): LeadsService {
  return new LeadsService(
    prisma,
    new PipelinesService(prisma),
    new TagsService(prisma),
  );
}

/**
 * Um lead como o Prisma o devolveria: com a junção de etiquetas presente.
 *
 * O serviço achata `tags` antes de responder, e um dublê sem esse campo
 * quebraria por um motivo que não tem nada a ver com isolamento — escondendo
 * o que o teste realmente verifica.
 */
function leadDublado(): Record<string, unknown> {
  return { id: REGISTRO, tags: [], stageHistory: [] };
}

/**
 * O serviço de processos também recebe a Judit e a configuração.
 *
 * Nenhuma das duas participa das consultas verificadas aqui — mas o
 * construtor as exige, e passar só o Prisma esconderia de vez uma delas
 * passar a ser usada na leitura.
 */
function servicoDeProcessos(prisma: PrismaService): ProcessesService {
  const judit = { estaConfigurado: () => false } as unknown as JuditService;
  const config = { get: () => undefined } as unknown as ConfigService;

  return new ProcessesService(prisma, judit, config);
}

/** Extrai o `where` da primeira chamada de uma consulta espionada. */
function whereDe(espiao: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const args = espiao.mock.calls[0]?.[0] as { where: Record<string, unknown> };
  return args.where;
}

describe('escopo de tenant nos módulos de domínio', () => {
  const paginacao = { page: 1, limit: 20 };

  describe('listagens sempre filtram por officeId', () => {
    it('clientes', async () => {
      const { prisma, findMany } = prismaEspiao();
      await new CustomersService(prisma).listar(ESCRITORIO, paginacao);
      expect(whereDe(findMany).officeId).toBe(ESCRITORIO);
    });

    it('leads', async () => {
      const { prisma, findMany } = prismaEspiao();
      await servicoDeLeads(prisma).listar(ESCRITORIO, paginacao);
      expect(whereDe(findMany).officeId).toBe(ESCRITORIO);
    });

    it('etiquetas', async () => {
      const { prisma, findMany } = prismaEspiao();
      await new TagsService(prisma).listar(ESCRITORIO, paginacao);
      expect(whereDe(findMany).officeId).toBe(ESCRITORIO);
    });

    it('funis', async () => {
      const { prisma, findMany } = prismaEspiao();
      // count > 0 evita o caminho que CRIA o funil padrão — aqui o que
      // interessa é o where da leitura, não a semeadura.
      (prisma.pipeline.count as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      await new PipelinesService(prisma).listar(ESCRITORIO);
      expect(whereDe(findMany).officeId).toBe(ESCRITORIO);
    });

    it('processos', async () => {
      const { prisma, findMany } = prismaEspiao();
      await servicoDeProcessos(prisma).listar(ESCRITORIO, paginacao);
      expect(whereDe(findMany).officeId).toBe(ESCRITORIO);
    });
  });

  describe('busca por id sempre inclui o officeId', () => {
    it('cliente', async () => {
      const { prisma, findFirst } = prismaEspiao({ id: REGISTRO });
      await new CustomersService(prisma).detalhar(ESCRITORIO, REGISTRO);

      const where = whereDe(findFirst);
      expect(where.id).toBe(REGISTRO);
      expect(where.officeId).toBe(ESCRITORIO);
    });

    it('lead', async () => {
      const { prisma, findFirst } = prismaEspiao(leadDublado());
      await servicoDeLeads(prisma).detalhar(ESCRITORIO, REGISTRO);

      const where = whereDe(findFirst);
      expect(where.id).toBe(REGISTRO);
      expect(where.officeId).toBe(ESCRITORIO);
    });

    it('funil', async () => {
      const { prisma, findFirst } = prismaEspiao({ id: REGISTRO, stages: [] });
      await new PipelinesService(prisma).detalhar(ESCRITORIO, REGISTRO);

      const where = whereDe(findFirst);
      expect(where.id).toBe(REGISTRO);
      expect(where.officeId).toBe(ESCRITORIO);
    });

    it('processo', async () => {
      const { prisma, findFirst } = prismaEspiao({ id: REGISTRO });
      await servicoDeProcessos(prisma).detalhar(ESCRITORIO, REGISTRO);

      const where = whereDe(findFirst);
      expect(where.id).toBe(REGISTRO);
      expect(where.officeId).toBe(ESCRITORIO);
    });
  });

  describe('registro de outro escritório responde como inexistente', () => {
    // findFirst devolve null porque o officeId do where não casa. A resposta é
    // 404 e não 403 de propósito: 403 confirmaria que o registro existe em
    // algum lugar, o que permite mapear ids alheios por tentativa.
    it('cliente', async () => {
      const { prisma } = prismaEspiao(null);
      await expect(
        new CustomersService(prisma).detalhar(ESCRITORIO, REGISTRO),
      ).rejects.toThrow(NotFoundException);
    });

    it('lead', async () => {
      const { prisma } = prismaEspiao(null);
      await expect(
        servicoDeLeads(prisma).detalhar(ESCRITORIO, REGISTRO),
      ).rejects.toThrow(NotFoundException);
    });

    it('funil', async () => {
      const { prisma } = prismaEspiao(null);
      await expect(
        new PipelinesService(prisma).detalhar(ESCRITORIO, REGISTRO),
      ).rejects.toThrow(NotFoundException);
    });

    it('etiqueta', async () => {
      const { prisma } = prismaEspiao(null);
      await expect(
        new TagsService(prisma).atualizar(ESCRITORIO, REGISTRO, {
          name: 'nova',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('processo', async () => {
      const { prisma } = prismaEspiao(null);
      await expect(
        servicoDeProcessos(prisma).detalhar(ESCRITORIO, REGISTRO),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('exclusão é lógica e confere o escritório antes', () => {
    it('recusa excluir registro de outro escritório', async () => {
      const { prisma, update } = prismaEspiao(null);

      await expect(
        new CustomersService(prisma).remover(ESCRITORIO, REGISTRO),
      ).rejects.toThrow(NotFoundException);

      // O update não pode nem ter sido tentado
      expect(update).not.toHaveBeenCalled();
    });

    it('marca deletedAt em vez de apagar a linha', async () => {
      const { prisma, update } = prismaEspiao({ id: REGISTRO });

      await new CustomersService(prisma).remover(ESCRITORIO, REGISTRO);

      const args = update.mock.calls[0]?.[0] as {
        data: { deletedAt: Date };
      };
      expect(args.data.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('listagens ignoram registros já excluídos', () => {
    it('cliente', async () => {
      const { prisma, findMany } = prismaEspiao();
      await new CustomersService(prisma).listar(ESCRITORIO, paginacao);
      expect(whereDe(findMany).deletedAt).toBeNull();
    });

    it('processo', async () => {
      const { prisma, findMany } = prismaEspiao();
      await servicoDeProcessos(prisma).listar(ESCRITORIO, paginacao);
      expect(whereDe(findMany).deletedAt).toBeNull();
    });
  });
});
