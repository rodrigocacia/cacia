import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { RagService } from '../rag/rag.service';
import {
  FerramentasService,
  type ContextoFerramenta,
} from './ferramentas.service';

/**
 * As ferramentas que o agente pode acionar.
 *
 * Duas propriedades importam aqui, e nenhuma delas é sobre o texto:
 *
 * 1. TODA consulta é presa ao escritório do contexto. O modelo escreve os
 *    argumentos; se um deles pudesse escolher o escritório, uma injeção de
 *    prompt leria dados alheios.
 * 2. Nenhuma ferramenta lança. Uma falha de consulta precisa virar frase, para
 *    que o modelo siga a conversa dizendo que não conseguiu — em vez de a
 *    resposta inteira morrer e o cliente ficar sem retorno.
 */

const CONTEXTO: ContextoFerramenta = {
  officeId: 'escritorio-1',
  chatId: 'conversa-1',
  customerId: 'cliente-1',
};

const SEM_CLIENTE: ContextoFerramenta = {
  officeId: 'escritorio-1',
  chatId: 'conversa-1',
  leadId: 'lead-1',
};

function montar(
  retornos: {
    processos?: unknown[];
    eventos?: unknown[];
    agendas?: unknown[];
    trechos?: { documento: string; conteudo: string; relevancia: number }[];
  } = {},
) {
  const processoFindMany = vi.fn().mockResolvedValue(retornos.processos ?? []);
  const eventoFindMany = vi.fn().mockResolvedValue(retornos.eventos ?? []);
  const agendaFindMany = vi.fn().mockResolvedValue(retornos.agendas ?? []);
  const chatUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

  const prisma = {
    process: { findMany: processoFindMany },
    event: { findMany: eventoFindMany },
    calendar: { findMany: agendaFindMany },
    chat: { updateMany: chatUpdateMany },
  } as unknown as PrismaService;

  const buscar = vi.fn().mockResolvedValue(retornos.trechos ?? []);
  const rag = { buscar } as unknown as RagService;

  return {
    ferramentas: new FerramentasService(prisma, rag),
    processoFindMany,
    eventoFindMany,
    agendaFindMany,
    chatUpdateMany,
    buscar,
  };
}

/** Extrai o `where` da primeira chamada de uma consulta espionada. */
function whereDe(espiao: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const args = espiao.mock.calls[0]?.[0] as { where: Record<string, unknown> };
  return args.where;
}

describe('FerramentasService', () => {
  describe('definições enviadas ao modelo', () => {
    it('nenhuma ferramenta aceita o escritório como argumento', async () => {
      // Se aceitasse, o modelo poderia ser convencido a preenchê-lo. O
      // contexto vem do servidor justamente por isso.
      const { ferramentas } = montar();

      for (const definicao of ferramentas.definicoes()) {
        const propriedades = Object.keys(
          (definicao.function.parameters?.properties as object) ?? {},
        );

        expect(propriedades).not.toContain('officeId');
        expect(propriedades).not.toContain('customerId');
        expect(propriedades).not.toContain('chatId');
      }
    });

    it('toda ferramenta tem descrição — é como o modelo escolhe', async () => {
      const { ferramentas } = montar();

      for (const definicao of ferramentas.definicoes()) {
        expect(definicao.function.description).toBeTruthy();
      }
    });
  });

  describe('consultar_processos', () => {
    it('filtra pelo escritório e pelo cliente do contexto', async () => {
      const { ferramentas, processoFindMany } = montar();

      await ferramentas.executar('consultar_processos', {}, CONTEXTO);

      const where = whereDe(processoFindMany);
      expect(where.officeId).toBe(CONTEXTO.officeId);
      expect(where.customerId).toBe(CONTEXTO.customerId);
      expect(where.deletedAt).toBeNull();
    });

    it('ignora o escritório que o modelo tentar passar nos argumentos', async () => {
      const { ferramentas, processoFindMany } = montar();

      await ferramentas.executar(
        'consultar_processos',
        { officeId: 'escritorio-invadido', customerId: 'cliente-alheio' },
        CONTEXTO,
      );

      const where = whereDe(processoFindMany);
      expect(where.officeId).toBe('escritorio-1');
      expect(where.customerId).toBe('cliente-1');
    });

    it('não consulta o banco quando o contato ainda não é cliente', async () => {
      const { ferramentas, processoFindMany } = montar();

      const texto = await ferramentas.executar(
        'consultar_processos',
        {},
        SEM_CLIENTE,
      );

      expect(processoFindMany).not.toHaveBeenCalled();
      expect(texto).toContain('ainda não é cliente');
    });

    it('devolve frase, não vazio, quando não há processos', async () => {
      // Texto vazio faria o modelo inventar algo para preencher a resposta.
      const { ferramentas } = montar({ processos: [] });

      const texto = await ferramentas.executar(
        'consultar_processos',
        {},
        CONTEXTO,
      );

      expect(texto).toBe('Nenhum processo cadastrado.');
    });

    it('resume cada processo em uma linha legível', async () => {
      const { ferramentas } = montar({
        processos: [
          {
            number: '10000000000000000001',
            status: 'ACTIVE',
            phase: 'instrução',
            tribunalAcronym: 'TJSP',
            lastActivityAt: new Date(),
          },
        ],
      });

      const texto = await ferramentas.executar(
        'consultar_processos',
        {},
        CONTEXTO,
      );

      expect(texto).toContain('10000000000000000001');
      expect(texto).toContain('ACTIVE');
      expect(texto).toContain('TJSP');
      // Texto, não JSON: é o que volta para o modelo, e JSON bruto inflava a
      // janela de contexto no sistema anterior.
      expect(texto).not.toContain('{');
    });
  });

  describe('buscar_em_documentos', () => {
    it('busca presa ao escritório e ao cliente', async () => {
      const { ferramentas, buscar } = montar();

      await ferramentas.executar(
        'buscar_em_documentos',
        { pergunta: 'qual o valor dos honorários' },
        CONTEXTO,
      );

      expect(buscar).toHaveBeenCalledWith({
        officeId: 'escritorio-1',
        customerId: 'cliente-1',
        pergunta: 'qual o valor dos honorários',
      });
    });

    it('avisa quando não encontra trecho relevante', async () => {
      const { ferramentas } = montar({ trechos: [] });

      const texto = await ferramentas.executar(
        'buscar_em_documentos',
        { pergunta: 'qualquer coisa' },
        CONTEXTO,
      );

      expect(texto).toContain('Nenhum trecho relevante');
    });

    it('numera os trechos e diz de qual documento vieram', async () => {
      const { ferramentas } = montar({
        trechos: [
          {
            documento: 'Contrato.pdf',
            conteudo: 'Honorários de dez mil reais.',
            relevancia: 0.9,
          },
        ],
      });

      const texto = await ferramentas.executar(
        'buscar_em_documentos',
        { pergunta: 'honorários' },
        CONTEXTO,
      );

      expect(texto).toContain('[1]');
      expect(texto).toContain('Contrato.pdf');
    });

    it('trata pergunta ausente sem quebrar', async () => {
      const { ferramentas, buscar } = montar();

      await ferramentas.executar('buscar_em_documentos', {}, CONTEXTO);

      expect(buscar).toHaveBeenCalledWith(
        expect.objectContaining({ pergunta: '' }),
      );
    });
  });

  describe('consultar_agenda', () => {
    it('só compromissos futuros e não cancelados, do escritório', async () => {
      const { ferramentas, eventoFindMany } = montar();

      await ferramentas.executar('consultar_agenda', {}, CONTEXTO);

      const where = whereDe(eventoFindMany);
      expect(where.officeId).toBe('escritorio-1');
      expect(where.startTime).toMatchObject({ gte: expect.any(Date) });
      expect(where.status).toEqual({ not: 'CANCEL' });
    });

    it('usa o lead quando o contato ainda não é cliente', async () => {
      const { ferramentas, eventoFindMany } = montar();

      await ferramentas.executar('consultar_agenda', {}, SEM_CLIENTE);

      const where = whereDe(eventoFindMany);
      expect(where.leadId).toBe('lead-1');
      expect(where.customerId).toBeUndefined();
    });

    it('formata a data no fuso de São Paulo', async () => {
      // O escritório é brasileiro; devolver UTC faria o agente anunciar o
      // horário errado ao cliente.
      const { ferramentas } = montar({
        eventos: [
          {
            title: 'Audiência',
            startTime: new Date('2027-03-10T14:00:00.000Z'),
            consultationMode: 'ONLINE',
          },
        ],
      });

      const texto = await ferramentas.executar(
        'consultar_agenda',
        {},
        CONTEXTO,
      );

      expect(texto).toContain('Audiência');
      expect(texto).toContain('11:00'); // 14:00 UTC = 11:00 em São Paulo
      expect(texto).toContain('online');
    });
  });

  describe('horarios_disponiveis', () => {
    it('só agendas ativas do escritório', async () => {
      const { ferramentas, agendaFindMany } = montar();

      await ferramentas.executar('horarios_disponiveis', {}, CONTEXTO);

      const where = whereDe(agendaFindMany);
      expect(where.officeId).toBe('escritorio-1');
      expect(where.status).toBe(true);
      expect(where.deletedAt).toBeNull();
    });

    it('avisa quando a agenda existe mas está sem horários', async () => {
      const { ferramentas } = montar({
        agendas: [{ title: 'Atendimento', availableDays: [] }],
      });

      const texto = await ferramentas.executar(
        'horarios_disponiveis',
        {},
        CONTEXTO,
      );

      expect(texto).toContain('sem horários definidos');
    });
  });

  describe('acionar_atendente', () => {
    it('marca a conversa e confere o escritório antes', async () => {
      const { ferramentas, chatUpdateMany } = montar();

      const texto = await ferramentas.executar(
        'acionar_atendente',
        { motivo: 'assunto sensível' },
        CONTEXTO,
      );

      const args = chatUpdateMany.mock.calls[0]?.[0] as {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      };
      expect(args.where.id).toBe('conversa-1');
      expect(args.where.officeId).toBe('escritorio-1');
      expect(args.data.status).toBe('PENDING');

      // Quem comunica é o modelo, na resposta — a ferramenta só muda o estado
      expect(texto).toContain('Avise a pessoa');
    });

    it('ignora o chatId que vier nos argumentos', async () => {
      const { ferramentas, chatUpdateMany } = montar();

      await ferramentas.executar(
        'acionar_atendente',
        { motivo: 'x', chatId: 'conversa-alheia' },
        CONTEXTO,
      );

      const args = chatUpdateMany.mock.calls[0]?.[0] as {
        where: Record<string, unknown>;
      };
      expect(args.where.id).toBe('conversa-1');
    });
  });

  describe('falhas', () => {
    it('ferramenta desconhecida devolve aviso, não exceção', async () => {
      const { ferramentas } = montar();

      const texto = await ferramentas.executar('inventada', {}, CONTEXTO);

      expect(texto).toContain('desconhecida');
    });

    it('erro na consulta vira frase para o modelo', async () => {
      // A alternativa seria a resposta inteira falhar e o cliente ficar sem
      // retorno nenhum — pior que dizer que não deu para consultar.
      const prisma = {
        process: {
          findMany: vi.fn().mockRejectedValue(new Error('banco fora do ar')),
        },
      } as unknown as PrismaService;

      const ferramentas = new FerramentasService(prisma, {
        buscar: vi.fn(),
      } as unknown as RagService);

      const texto = await ferramentas.executar(
        'consultar_processos',
        {},
        CONTEXTO,
      );

      expect(texto).toBe('Não consegui consultar essa informação agora.');
    });
  });
});
