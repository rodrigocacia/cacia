import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarDuasContas, type Conta } from './apoio/contas';

/**
 * O invariante mais importante do sistema: um escritório não alcança o dado
 * de outro por nenhum caminho.
 *
 * Existem testes unitários do TenantGuard e uma prova no nível do banco (as
 * chaves compostas). Este arquivo cobre o que nenhum dos dois cobre: o
 * caminho HTTP completo, rota por rota. É onde apareceria um controller que
 * esqueceu o `@CurrentOffice()` e leu o id de um parâmetro de rota.
 */
describe('isolamento entre escritórios (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let a: Conta;
  let b: Conta;

  /** Recursos do escritório A, que B vai tentar alcançar. */
  const recursos: Record<string, string> = {};

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    [a, b] = await criarDuasContas(aplicacao.url);

    const cliente = await a.api.post<{ id: string }>('/customers', {
      name: 'Cliente do A',
      document: '11111111111',
      remotejid: '5511911111111@c.us',
    });
    recursos.customer = cliente.corpo.id;

    const lead = await a.api.post<{ id: string }>('/leads', {
      name: 'Lead do A',
      remotejid: '5511922222222@c.us',
    });
    recursos.lead = lead.corpo.id;

    const processo = await a.api.post<{ id: string }>('/processes', {
      customerId: recursos.customer,
      number: '10000000000000000001',
    });
    recursos.process = processo.corpo.id;

    const agenda = await a.api.post<{ id: string }>('/calendars', {
      title: 'Agenda do A',
    });
    recursos.calendar = agenda.corpo.id;

    const agente = await a.api.post<{ id: string }>('/agents', {
      type: 'SUPPORT',
      style: 'CLEAR_AND_OBJECTIVE',
      greeting: 'Olá, como posso ajudar?',
    });
    recursos.agent = agente.corpo.id;

    const etiqueta = await a.api.post<{ id: string }>('/tags', {
      name: 'Etiqueta do A',
    });
    recursos.tag = etiqueta.corpo.id;

    const funis =
      await a.api.get<Array<{ id: string; stages: Array<{ id: string }> }>>(
        '/pipelines',
      );
    recursos.pipeline = funis.corpo[0]!.id;
    recursos.stage = funis.corpo[0]!.stages[0]!.id;

    const importacao = await a.api.postArquivo<{ id: string }>(
      '/lead-imports',
      {
        nome: 'leads.csv',
        conteudo: 'nome;telefone\nAna;11933333333\n',
        tipo: 'text/csv',
      },
    );
    recursos.leadImport = importacao.corpo.id;
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('o cabeçalho do escritório', () => {
    it('é obrigatório nas rotas de escritório', async () => {
      const resposta = await a.api.semEscritorio().get('/customers');

      expect(resposta.status).toBe(400);
    });

    it('recusa escritório de que o usuário não é membro', async () => {
      const resposta = await b.api
        .como({ officeId: a.officeId })
        .get('/customers');

      expect(resposta.status).toBe(403);
    });

    it('responde igual para escritório inexistente', async () => {
      // Se a resposta fosse 404 aqui e 403 acima, bastaria varrer UUIDs para
      // descobrir quais escritórios existem.
      const inexistente = await b.api
        .como({ officeId: '00000000-0000-0000-0000-0000000000ff' })
        .get('/customers');
      const alheio = await b.api
        .como({ officeId: a.officeId })
        .get('/customers');

      expect(inexistente.status).toBe(alheio.status);
      expect(inexistente.corpo).toEqual(alheio.corpo);
    });
  });

  describe('recurso do escritório A responde como inexistente para o B', () => {
    const rotas: [string, () => string][] = [
      ['clientes', () => `/customers/${recursos.customer}`],
      ['leads', () => `/leads/${recursos.lead}`],
      ['processos', () => `/processes/${recursos.process}`],
      ['andamentos', () => `/processes/${recursos.process}/progresses`],
      ['agendas', () => `/calendars/${recursos.calendar}`],
      ['agentes', () => `/agents/${recursos.agent}`],
      ['funis', () => `/pipelines/${recursos.pipeline}`],
      ['importações', () => `/lead-imports/${recursos.leadImport}`],
    ];

    for (const [nome, caminho] of rotas) {
      it(nome, async () => {
        const resposta = await b.api.get(caminho());

        expect(resposta.status).toBe(404);
      });
    }
  });

  /**
   * As rotas de CRM não estão na tabela acima porque não são leitura por id —
   * mas são justamente as que ESCREVEM, e uma delas aceitando id alheio move
   * o lead de outro escritório de etapa.
   */
  describe('escrita nas rotas de funil e etiqueta do escritório alheio', () => {
    it('mover o lead do A para uma etapa é 404 para o B', async () => {
      const tentativa = await b.api.patch(`/leads/${recursos.lead}/stage`, {
        stageId: recursos.stage,
      });

      expect(tentativa.status).toBe(404);
    });

    it('etiquetar o lead do A é 404 para o B', async () => {
      const tentativa = await b.api.put(`/leads/${recursos.lead}/tags`, {
        tagIds: [recursos.tag],
      });

      expect(tentativa.status).toBe(404);
    });

    it('a etiqueta do A não aparece na listagem do B', async () => {
      const resposta = await b.api.get<{ data: Array<{ id: string }> }>(
        '/tags',
      );

      expect(resposta.corpo.data.map((t) => t.id)).not.toContain(recursos.tag);
    });

    it('o funil do A não aparece na listagem do B', async () => {
      // B tem o próprio funil padrão — o que não pode é ver o do A.
      const resposta = await b.api.get<Array<{ id: string }>>('/pipelines');

      expect(resposta.corpo.map((f) => f.id)).not.toContain(recursos.pipeline);
    });

    it('criar etapa no funil do A é 404 para o B', async () => {
      const tentativa = await b.api.post(
        `/pipelines/${recursos.pipeline}/stages`,
        { name: 'Etapa intrusa' },
      );

      expect(tentativa.status).toBe(404);
    });

    it('confirmar a importação do A é 404 para o B', async () => {
      const tentativa = await b.api.post(
        `/lead-imports/${recursos.leadImport}/confirm`,
        { mapping: { '1': 'remotejid' } },
      );

      expect(tentativa.status).toBe(404);
    });
  });

  describe('escrita no recurso alheio', () => {
    it('atualização não altera nada', async () => {
      const tentativa = await b.api.patch(`/customers/${recursos.customer}`, {
        name: 'Nome sequestrado',
      });

      expect(tentativa.status).toBe(404);

      const original = await a.api.get<{ name: string }>(
        `/customers/${recursos.customer}`,
      );
      expect(original.corpo.name).toBe('Cliente do A');
    });

    it('exclusão não apaga nada', async () => {
      const tentativa = await b.api.delete(`/customers/${recursos.customer}`);

      expect(tentativa.status).toBe(404);

      const original = await a.api.get(`/customers/${recursos.customer}`);
      expect(original.status).toBe(200);
    });

    it('não é possível vincular recurso próprio a um pai alheio', async () => {
      // Este é o ataque que as chaves compostas do banco recusam. Aqui
      // confirma-se que a API o barra antes, com resposta útil.
      const resposta = await b.api.post('/processes', {
        customerId: recursos.customer,
        number: '20000000000000000002',
      });

      // O serviço confere o cliente dentro do escritório antes de gravar
      expect(resposta.status).toBe(404);
    });

    it('não é possível criar evento na agenda alheia', async () => {
      const resposta = await b.api.post('/events', {
        calendarId: recursos.calendar,
        title: 'Reunião infiltrada',
        startTime: new Date(Date.now() + 86_400_000).toISOString(),
        endTime: new Date(Date.now() + 90_000_000).toISOString(),
      });

      expect(resposta.status).toBe(404);
    });
  });

  describe('exclusão de processo encerra o acompanhamento', () => {
    it('avisa a Judit para parar de monitorar', async () => {
      // Sem isso o escritório seguiria pagando o acompanhamento de um processo
      // que excluiu, e os webhooks continuariam chegando.
      const processo = await a.api.post<{ id: string }>('/processes', {
        customerId: recursos.customer,
        number: '30000000000000000003',
      });

      aplicacao.judit.limpar();

      const exclusao = await a.api.delete(`/processes/${processo.corpo.id}`);
      expect(exclusao.status).toBe(204);

      expect(aplicacao.judit.vezes('pararMonitoramento')).toBe(1);
    });

    it('o outro escritório não consegue encerrar o acompanhamento alheio', async () => {
      aplicacao.judit.limpar();

      const tentativa = await b.api.delete(`/processes/${recursos.process}`);

      expect(tentativa.status).toBe(404);
      expect(aplicacao.judit.vezes('pararMonitoramento')).toBe(0);
    });
  });

  describe('listagens', () => {
    it('não trazem nada do outro escritório', async () => {
      const clientes = await b.api.get<{ data: { id: string }[] }>(
        '/customers',
      );
      const leads = await b.api.get<{ data: { id: string }[] }>('/leads');
      const processos = await b.api.get<{ data: { id: string }[] }>(
        '/processes',
      );

      expect(clientes.corpo.data).toHaveLength(0);
      expect(leads.corpo.data).toHaveLength(0);
      expect(processos.corpo.data).toHaveLength(0);
    });

    it('a busca por texto também não vaza', async () => {
      // Um `search` sem filtro de escritório seria a forma mais fácil de
      // varrer a base inteira.
      const resposta = await b.api.get<{ data: unknown[] }>(
        '/customers?search=Cliente',
      );

      expect(resposta.corpo.data).toHaveLength(0);
    });
  });
});
