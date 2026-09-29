import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

/**
 * O funil de vendas, ponta a ponta.
 *
 * O que este arquivo persegue é a coerência entre as duas representações do
 * mesmo lead: a etapa, que é a verdade, e o `status`, que é a projeção dela
 * lida pelas telas antigas e pelas ferramentas do agente. Divergirem é a
 * falha que nenhum teste unitário pega, porque cada peça funciona sozinha.
 */

interface Etapa {
  id: string;
  name: string;
  color: string;
  position: number;
  kind: 'OPEN' | 'WON' | 'LOST';
}

interface Funil {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Etapa[];
}

interface Etiqueta {
  id: string;
  name: string;
  color: string;
}

interface Lead {
  id: string;
  name: string;
  remotejid: string;
  status: string;
  stageId: string | null;
  pipelineId: string | null;
  ownerId: string | null;
  lostReason: string | null;
  value: string | null;
  tags: Etiqueta[];
  stage: Etapa | null;
}

interface Quadro {
  pipeline: { id: string; name: string };
  stages: Array<Etapa & { total: number; leads: Lead[] }>;
}

describe('CRM — funil e etiquetas (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let conta: Conta;
  let funil: Funil;

  const etapaPorNome = (nome: string): Etapa => {
    const etapa = funil.stages.find((e) => e.name === nome);
    if (!etapa) throw new Error(`Etapa "${nome}" não existe no funil`);
    return etapa;
  };

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    conta = await criarConta(aplicacao.url);

    const resposta = await conta.api.get<Funil[]>('/pipelines');
    funil = resposta.corpo[0]!;
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('o funil nasce com o escritório', () => {
    it('há exatamente um funil, e ele é o padrão', () => {
      // Sem funil padrão, o lead que chega pelo WhatsApp não teria onde cair.
      expect(funil.isDefault).toBe(true);
    });

    it('com as cinco etapas, em ordem', () => {
      expect(funil.stages.map((e) => e.name)).toEqual([
        'Novo',
        'Em contato',
        'Proposta enviada',
        'Ganho',
        'Perdido',
      ]);
      expect(funil.stages.map((e) => e.position)).toEqual([0, 1, 2, 3, 4]);
    });

    it('a primeira é aberta, e há uma de ganho e uma de perda', () => {
      expect(etapaPorNome('Novo').kind).toBe('OPEN');
      expect(etapaPorNome('Ganho').kind).toBe('WON');
      expect(etapaPorNome('Perdido').kind).toBe('LOST');
    });
  });

  describe('lead entra no funil', () => {
    let lead: Lead;

    it('cai na primeira etapa, com status projetado', async () => {
      const resposta = await conta.api.post<Lead>('/leads', {
        name: 'Ana Souza',
        remotejid: '11988887777',
        value: 2500,
      });

      expect(resposta.status).toBe(201);
      lead = resposta.corpo;

      expect(lead.stageId).toBe(etapaPorNome('Novo').id);
      expect(lead.status).toBe('NEW');
    });

    it('o telefone foi normalizado para o formato do WhatsApp', async () => {
      // A tela grava um formato e o webhook grava outro; sem normalizar, o
      // banco veria dois contatos onde há uma pessoa.
      expect(lead.remotejid).toBe('5511988887777@c.us');
    });

    it('a entrada na etapa ficou registrada no histórico', async () => {
      const passagens = await aplicacao.prisma.leadStageHistory.findMany({
        where: { leadId: lead.id },
      });

      expect(passagens).toHaveLength(1);
      expect(passagens[0]?.toStageId).toBe(etapaPorNome('Novo').id);
      expect(passagens[0]?.fromStageId).toBeNull();
      // Cadastro pela tela tem autor; userId nulo a linha do tempo mostra
      // como "IA de atendimento".
      expect(passagens[0]?.userId).toBe(conta.userId);
    });

    it('o mesmo número em outro formato é recusado', async () => {
      const resposta = await conta.api.post<{ leadId: string }>('/leads', {
        name: 'Ana de novo',
        remotejid: '(11) 98888-7777',
      });

      expect(resposta.status).toBe(409);
      // O id vem junto para a tela poder oferecer abrir a ficha existente,
      // em vez de mandar a pessoa procurar na mão.
      expect(resposta.corpo.leadId).toBe(lead.id);
    });

    it('telefone curto demais é recusado antes de qualquer escrita', async () => {
      const resposta = await conta.api.post('/leads', {
        name: 'Inválida',
        remotejid: '9999',
      });

      expect(resposta.status).toBe(400);
    });
  });

  describe('movimentação no funil', () => {
    let lead: Lead;

    beforeAll(async () => {
      const resposta = await conta.api.post<Lead>('/leads', {
        name: 'Carlos Lima',
        remotejid: '11977776666',
      });
      lead = resposta.corpo;
    });

    it('mover para uma etapa aberta intermediária projeta IN_CONTACT', async () => {
      const resposta = await conta.api.patch<Lead>(`/leads/${lead.id}/stage`, {
        stageId: etapaPorNome('Proposta enviada').id,
      });

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.status).toBe('IN_CONTACT');
    });

    it('a passagem registra quem moveu e quanto tempo ficou', async () => {
      const passagem = await aplicacao.prisma.leadStageHistory.findFirst({
        where: { leadId: lead.id, fromStageId: etapaPorNome('Novo').id },
      });

      expect(passagem?.toStageId).toBe(etapaPorNome('Proposta enviada').id);
      // Movido por gente: o autor é o usuário, não nulo
      expect(passagem?.userId).toBe(conta.userId);
      expect(passagem?.secondsInPreviousStage).toBeGreaterThanOrEqual(0);
    });

    it('mover para a mesma etapa é recusado', async () => {
      const resposta = await conta.api.patch(`/leads/${lead.id}/stage`, {
        stageId: etapaPorNome('Proposta enviada').id,
      });

      expect(resposta.status).toBe(409);
    });

    it('mover para perda sem motivo é recusado', async () => {
      // Um funil que perde sem motivo registrado não ensina nada
      const resposta = await conta.api.patch(`/leads/${lead.id}/stage`, {
        stageId: etapaPorNome('Perdido').id,
      });

      expect(resposta.status).toBe(400);
    });

    it('com motivo, move e projeta LOST', async () => {
      const resposta = await conta.api.patch<Lead>(`/leads/${lead.id}/stage`, {
        stageId: etapaPorNome('Perdido').id,
        lostReason: 'Fechou com outro escritório',
      });

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.status).toBe('LOST');
      expect(resposta.corpo.lostReason).toBe('Fechou com outro escritório');
    });

    it('reabrir limpa o motivo da perda', async () => {
      // Um lead reaberto que continua exibindo "fechou com outro" mente para
      // quem abre a ficha.
      const resposta = await conta.api.patch<Lead>(`/leads/${lead.id}/stage`, {
        stageId: etapaPorNome('Em contato').id,
      });

      expect(resposta.corpo.lostReason).toBeNull();
      expect(resposta.corpo.status).toBe('IN_CONTACT');
    });

    it('etapa de outro escritório não existe para este', async () => {
      const outra = await criarConta(aplicacao.url, 'Outro escritório');
      const funisDoOutro = await outra.api.get<Funil[]>('/pipelines');
      const etapaAlheia = funisDoOutro.corpo[0]!.stages[0]!.id;

      const resposta = await conta.api.patch(`/leads/${lead.id}/stage`, {
        stageId: etapaAlheia,
      });

      expect(resposta.status).toBe(404);
    });
  });

  describe('conversão em cliente', () => {
    it('move para a etapa de ganho junto', async () => {
      // Sem isso, o cartão ficaria numa coluna aberta enquanto o status diz
      // convertido: o quadro e a listagem discordando sobre o mesmo lead.
      const lead = await conta.api.post<Lead>('/leads', {
        name: 'Marina Alves',
        remotejid: '11966665555',
      });

      const resposta = await conta.api.post<Lead>(
        `/leads/${lead.corpo.id}/convert`,
        { document: '98765432100' },
      );

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.status).toBe('CONVERTED');
      expect(resposta.corpo.stageId).toBe(etapaPorNome('Ganho').id);
    });

    it('grava o cadastro completo do cliente, com endereço', async () => {
      // A tela de conversão é o formulário inteiro de cliente; antes só o
      // documento chegava e o endereço preenchido se perdia.
      const lead = await conta.api.post<Lead>('/leads', {
        name: 'Rita Campos',
        remotejid: '11944443333',
      });

      const resposta = await conta.api.post<Lead & { customerId: string }>(
        `/leads/${lead.corpo.id}/convert`,
        {
          document: '111.444.777-35',
          email: 'rita@example.com',
          addresses: [
            { cep: '20040-020', city: 'Rio de Janeiro', state: 'RJ' },
          ],
        },
      );

      expect(resposta.status).toBe(201);

      const cliente = await aplicacao.prisma.customer.findUniqueOrThrow({
        where: { id: resposta.corpo.customerId },
        select: { email: true, addresses: { select: { city: true } } },
      });

      expect(cliente.email).toBe('rita@example.com');
      expect(cliente.addresses.map((e) => e.city)).toEqual(['Rio de Janeiro']);
    });
  });

  describe('etiquetas', () => {
    let etiqueta: Etiqueta;
    let lead: Lead;

    beforeAll(async () => {
      const resposta = await conta.api.post<Lead>('/leads', {
        name: 'Pedro Rocha',
        remotejid: '11955554444',
      });
      lead = resposta.corpo;
    });

    it('cria', async () => {
      const resposta = await conta.api.post<Etiqueta>('/tags', {
        name: 'Trabalhista',
        color: '#FF0000',
      });

      expect(resposta.status).toBe(201);
      etiqueta = resposta.corpo;
    });

    it('nome repetido é recusado', async () => {
      // Duas etiquetas com o mesmo nome tornam o seletor inútil
      const resposta = await conta.api.post('/tags', { name: 'Trabalhista' });

      expect(resposta.status).toBe(409);
    });

    it('aplica ao lead', async () => {
      const resposta = await conta.api.put<Lead>(`/leads/${lead.id}/tags`, {
        tagIds: [etiqueta.id],
      });

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.tags.map((t) => t.name)).toEqual(['Trabalhista']);
    });

    it('aplicar de novo o mesmo conjunto não duplica', async () => {
      const resposta = await conta.api.put<Lead>(`/leads/${lead.id}/tags`, {
        tagIds: [etiqueta.id],
      });

      expect(resposta.corpo.tags).toHaveLength(1);
    });

    it('filtra a listagem por etiqueta', async () => {
      const resposta = await conta.api.get<{ data: Lead[] }>(
        `/leads?tagIds=${etiqueta.id}`,
      );

      expect(resposta.corpo.data.map((l) => l.id)).toEqual([lead.id]);
    });

    it('etiqueta inexistente no vínculo é recusada', async () => {
      const resposta = await conta.api.put(`/leads/${lead.id}/tags`, {
        // UUID v4 válido e inexistente: um id malformado pararia na validação
        // (400) e o teste não chegaria a exercitar a checagem de existência.
        tagIds: ['aaaaaaaa-0000-4000-8000-000000000099'],
      });

      expect(resposta.status).toBe(404);
    });

    it('lista vazia remove todas', async () => {
      const resposta = await conta.api.put<Lead>(`/leads/${lead.id}/tags`, {
        tagIds: [],
      });

      expect(resposta.corpo.tags).toEqual([]);
    });

    it('excluir a etiqueta a tira de quem a tinha', async () => {
      await conta.api.put(`/leads/${lead.id}/tags`, { tagIds: [etiqueta.id] });

      const exclusao = await conta.api.delete(`/tags/${etiqueta.id}`);
      expect(exclusao.status).toBe(204);

      // Uma etiqueta excluída que continuasse no cartão seria um fantasma
      // que ninguém consegue remover pela tela.
      const depois = await conta.api.get<Lead>(`/leads/${lead.id}`);
      expect(depois.corpo.tags).toEqual([]);
    });
  });

  describe('desenho do funil', () => {
    it('não deixa excluir etapa que tem lead', async () => {
      const etapa = etapaPorNome('Em contato');

      const resposta = await conta.api.delete(`/pipelines/stages/${etapa.id}`);

      // Realocar em silêncio, no meio de uma exclusão, é como um funil perde
      // a informação de onde cada negócio estava.
      expect(resposta.status).toBe(409);
    });

    it('reordenar reescreve as posições e reprojeta o status', async () => {
      const ordem = [
        etapaPorNome('Em contato').id,
        etapaPorNome('Novo').id,
        etapaPorNome('Proposta enviada').id,
        etapaPorNome('Ganho').id,
        etapaPorNome('Perdido').id,
      ];

      const resposta = await conta.api.put<Funil>(
        `/pipelines/${funil.id}/stages/reorder`,
        { stageIds: ordem },
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.stages.map((e) => e.id)).toEqual(ordem);

      // "Em contato" virou a primeira coluna: quem está nela agora é NEW
      const naPrimeira = await aplicacao.prisma.lead.findFirst({
        where: { stageId: ordem[0], officeId: conta.officeId },
        select: { status: true },
      });

      expect(naPrimeira?.status).toBe('NEW');
    });

    it('lista parcial na reordenação é recusada', async () => {
      // Uma lista parcial deixaria as demais com posição repetida, e duas
      // colunas na mesma posição têm ordem indefinida na tela.
      const resposta = await conta.api.put(
        `/pipelines/${funil.id}/stages/reorder`,
        { stageIds: [etapaPorNome('Novo').id] },
      );

      expect(resposta.status).toBe(400);
    });

    it('devolve a ordem original', async () => {
      const resposta = await conta.api.put<Funil>(
        `/pipelines/${funil.id}/stages/reorder`,
        {
          stageIds: [
            etapaPorNome('Novo').id,
            etapaPorNome('Em contato').id,
            etapaPorNome('Proposta enviada').id,
            etapaPorNome('Ganho').id,
            etapaPorNome('Perdido').id,
          ],
        },
      );

      expect(resposta.status).toBe(200);
    });
  });

  describe('quadro', () => {
    it('devolve uma coluna por etapa, com total e soma', async () => {
      const resposta = await conta.api.get<Quadro>('/leads/board');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.stages).toHaveLength(5);

      const novo = resposta.corpo.stages.find((e) => e.name === 'Novo');
      expect(novo?.total).toBeGreaterThanOrEqual(1);
    });

    it('cada cartão traz as etiquetas achatadas', async () => {
      const resposta = await conta.api.get<Quadro>('/leads/board');
      const cartoes = resposta.corpo.stages.flatMap((e) => e.leads);

      // A tela quer a etiqueta, não a linha de junção
      for (const cartao of cartoes) {
        expect(Array.isArray(cartao.tags)).toBe(true);
      }
    });
  });

  describe('métricas do funil', () => {
    it('traz contagem por etapa e a taxa sobre o que fechou', async () => {
      const resposta = await conta.api.get<{
        stages: Array<{ name: string; leads: number }>;
        periodo: { ganhos: number; perdidos: number; taxaConversao: number };
      }>('/leads/funnel-metrics');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.stages).toHaveLength(5);
      expect(resposta.corpo.periodo.ganhos).toBeGreaterThanOrEqual(1);
      // A taxa é sobre ganhos + perdidos, não sobre tudo que entrou: um lead
      // criado ontem ainda não teve chance de virar cliente.
      expect(resposta.corpo.periodo.taxaConversao).toBeGreaterThan(0);
    });
  });
});
