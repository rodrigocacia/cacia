import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { LeadsService } from '@/modules/leads/leads.service';
import type { TagsService } from '@/modules/tags/tags.service';
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
    /** O que o escritório autoriza o agente a fazer no funil */
    permissoes?: { aiCanMoveLeadStage: boolean; aiCanTagLead: boolean };
    etapas?: Array<{ id: string; name: string }>;
    etiquetas?: Array<{ id: string; name: string }>;
  } = {},
) {
  const processoFindMany = vi.fn().mockResolvedValue(retornos.processos ?? []);
  const eventoFindMany = vi.fn().mockResolvedValue(retornos.eventos ?? []);
  const agendaFindMany = vi.fn().mockResolvedValue(retornos.agendas ?? []);
  const chatUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
  const configuracao = vi
    .fn()
    .mockResolvedValue(
      retornos.permissoes ?? { aiCanMoveLeadStage: false, aiCanTagLead: false },
    );
  const etapaFindMany = vi.fn().mockResolvedValue(retornos.etapas ?? []);
  const etiquetaFindMany = vi.fn().mockResolvedValue(retornos.etiquetas ?? []);

  const prisma = {
    process: { findMany: processoFindMany },
    event: { findMany: eventoFindMany },
    calendar: { findMany: agendaFindMany },
    chat: { updateMany: chatUpdateMany },
    setting: { findUnique: configuracao },
    lead: { findFirst: vi.fn().mockResolvedValue({ pipelineId: 'funil-1' }) },
    pipelineStage: { findMany: etapaFindMany },
    tag: { findMany: etiquetaFindMany },
  } as unknown as PrismaService;

  const buscar = vi.fn().mockResolvedValue(retornos.trechos ?? []);
  const rag = { buscar } as unknown as RagService;

  const moverEtapa = vi.fn().mockResolvedValue({ id: 'lead-1' });
  const definirEtiquetas = vi.fn().mockResolvedValue({ id: 'lead-1' });
  const leads = { moverEtapa, definirEtiquetas } as unknown as LeadsService;
  const tags = {} as unknown as TagsService;

  return {
    ferramentas: new FerramentasService(prisma, rag, leads, tags),
    processoFindMany,
    eventoFindMany,
    agendaFindMany,
    chatUpdateMany,
    configuracao,
    moverEtapa,
    definirEtiquetas,
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
      const { ferramentas } = montar({
        permissoes: { aiCanMoveLeadStage: true, aiCanTagLead: true },
        etapas: [{ id: 'etapa-1', name: 'Proposta enviada' }],
        etiquetas: [{ id: 'etiqueta-1', name: 'Trabalhista' }],
      });

      // Com as duas do funil ligadas: é a lista mais larga possível, e é nela
      // que um argumento de escritório passaria despercebido.
      for (const definicao of await ferramentas.definicoes(SEM_CLIENTE)) {
        const propriedades = Object.keys(
          (definicao.function.parameters?.properties as object) ?? {},
        );

        expect(propriedades).not.toContain('officeId');
        expect(propriedades).not.toContain('customerId');
        expect(propriedades).not.toContain('chatId');
        expect(propriedades).not.toContain('leadId');
        expect(propriedades).not.toContain('stageId');
      }
    });

    it('toda ferramenta tem descrição — é como o modelo escolhe', async () => {
      const { ferramentas } = montar({
        permissoes: { aiCanMoveLeadStage: true, aiCanTagLead: true },
        etapas: [{ id: 'etapa-1', name: 'Proposta enviada' }],
        etiquetas: [{ id: 'etiqueta-1', name: 'Trabalhista' }],
      });

      for (const definicao of await ferramentas.definicoes(SEM_CLIENTE)) {
        expect(definicao.function.description).toBeTruthy();
      }
    });
  });

  /**
   * O portão do funil.
   *
   * Mover o cartão sozinho é decisão do escritório, não do modelo — e a
   * verificação precisa valer nos DOIS pontos: na lista oferecida e na
   * execução. Só na lista seria confiar que o modelo não inventa um nome de
   * ferramenta, e o nome dela viaja no texto que ele produz.
   */
  describe('permissão do escritório sobre o funil', () => {
    const comFunil = {
      etapas: [{ id: 'etapa-1', name: 'Proposta enviada' }],
      etiquetas: [{ id: 'etiqueta-1', name: 'Trabalhista' }],
    };

    it('desligado, mover_etapa não é oferecida ao modelo', async () => {
      const { ferramentas } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: false, aiCanTagLead: false },
      });

      const nomes = (await ferramentas.definicoes(SEM_CLIENTE)).map(
        (d) => d.function.name,
      );

      expect(nomes).not.toContain('mover_etapa');
      expect(nomes).not.toContain('etiquetar');
    });

    it('ligado, mover_etapa aparece com as etapas reais', async () => {
      const { ferramentas } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: true, aiCanTagLead: false },
      });

      const definicoes = await ferramentas.definicoes(SEM_CLIENTE);
      const mover = definicoes.find((d) => d.function.name === 'mover_etapa');

      expect(mover).toBeDefined();
      expect(mover?.function.description).toContain('Proposta enviada');
      // Etiquetar continua fora: são dois portões independentes
      expect(definicoes.map((d) => d.function.name)).not.toContain('etiquetar');
    });

    it('sem lead no contexto, nenhuma das duas é oferecida', async () => {
      // Quem já é cliente saiu do funil; não há cartão para mover.
      const { ferramentas } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: true, aiCanTagLead: true },
      });

      const nomes = (await ferramentas.definicoes(CONTEXTO)).map(
        (d) => d.function.name,
      );

      expect(nomes).not.toContain('mover_etapa');
      expect(nomes).not.toContain('etiquetar');
    });

    it('desligado, executar mover_etapa não move nada', async () => {
      const { ferramentas, moverEtapa } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: false, aiCanTagLead: false },
      });

      const resposta = await ferramentas.executar(
        'mover_etapa',
        { etapa: 'Proposta enviada' },
        SEM_CLIENTE,
      );

      expect(moverEtapa).not.toHaveBeenCalled();
      expect(resposta).toContain('permissão');
    });

    it('ligado, mover_etapa grava a passagem sem autor humano', async () => {
      const { ferramentas, moverEtapa } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: true, aiCanTagLead: false },
      });

      await ferramentas.executar(
        'mover_etapa',
        { etapa: 'proposta ENVIADA' },
        SEM_CLIENTE,
      );

      // O nome casa sem diferenciar maiúsculas: o modelo escreve o que leu na
      // descrição, e exigir o texto exato faria a ferramenta falhar por caixa.
      expect(moverEtapa).toHaveBeenCalledWith(
        SEM_CLIENTE.officeId,
        SEM_CLIENTE.leadId,
        { stageId: 'etapa-1', lostReason: undefined },
        // userId nulo é o que marca o movimento como do agente
        null,
      );
    });

    it('etapa inexistente devolve as opções em vez de mover', async () => {
      const { ferramentas, moverEtapa } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: true, aiCanTagLead: false },
      });

      const resposta = await ferramentas.executar(
        'mover_etapa',
        { etapa: 'Etapa Inventada' },
        SEM_CLIENTE,
      );

      expect(moverEtapa).not.toHaveBeenCalled();
      expect(resposta).toContain('Proposta enviada');
    });

    it('etiquetar ignora nome que não existe e avisa', async () => {
      const { ferramentas, definirEtiquetas } = montar({
        ...comFunil,
        permissoes: { aiCanMoveLeadStage: false, aiCanTagLead: true },
      });

      const resposta = await ferramentas.executar(
        'etiquetar',
        { etiquetas: ['Trabalhista', 'Inventada'] },
        SEM_CLIENTE,
      );

      // Só a que existe é aplicada — deixar o modelo criar etiqueta
      // transformaria o filtro da tela em lixo.
      expect(definirEtiquetas).toHaveBeenCalledWith(
        SEM_CLIENTE.officeId,
        SEM_CLIENTE.leadId,
        ['etiqueta-1'],
      );
      expect(resposta).toContain('Inventada');
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

      // Leads e etiquetas não participam desta ferramenta; entram porque o
      // construtor os exige, e passar menos esconderia de vez um deles passar
      // a ser usado aqui.
      const ferramentas = new FerramentasService(
        prisma,
        { buscar: vi.fn() } as unknown as RagService,
        {} as unknown as LeadsService,
        {} as unknown as TagsService,
      );

      const texto = await ferramentas.executar(
        'consultar_processos',
        {},
        CONTEXTO,
      );

      expect(texto).toBe('Não consegui consultar essa informação agora.');
    });
  });
});
