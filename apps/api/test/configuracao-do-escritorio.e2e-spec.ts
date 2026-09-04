import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ServiceArea, ServiceValueType } from '@cacia/database';
import { PromptService } from '@/ai/agente/prompt.service';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { Cliente } from './apoio/cliente';
import { criarConta, criarDuasContas, type Conta } from './apoio/contas';

/**
 * Os módulos de configuração do escritório.
 *
 * Existiam como tabelas no banco desde o primeiro dia e não tinham rota
 * nenhuma. Três deles — serviços, perguntas e consulta — alimentam o bloco
 * estático do prompt: sem eles, não havia como o escritório ensinar ao agente
 * o que faz, quanto cobra e o que responder.
 */

interface Pagina<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

describe('configuração do escritório (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let prompt: PromptService;
  let a: Conta;
  let b: Conta;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    prompt = aplicacao.app.get(PromptService);
    [a, b] = await criarDuasContas(aplicacao.url);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  // -------------------------------------------------------------------------
  describe('pastas', () => {
    let id: string;

    it('cria, lista e detalha', async () => {
      const criada = await a.api.post<{ id: string; title: string }>(
        '/folders',
        { title: 'Contratos' },
      );
      expect(criada.status).toBe(201);
      id = criada.corpo.id;

      const lista = await a.api.get<Pagina<{ id: string }>>('/folders');
      expect(lista.corpo.data.map((f) => f.id)).toContain(id);

      const detalhe = await a.api.get<{ title: string }>(`/folders/${id}`);
      expect(detalhe.corpo.title).toBe('Contratos');
    });

    it('renomeia', async () => {
      const resposta = await a.api.patch<{ title: string }>(`/folders/${id}`, {
        title: 'Contratos assinados',
      });

      expect(resposta.corpo.title).toBe('Contratos assinados');
    });

    it('recusa vincular a cliente de outro escritório', async () => {
      const cliente = await b.api.post<{ id: string }>('/customers', {
        name: 'Cliente do B',
        document: '55555555555',
        remotejid: '5511955555555@c.us',
      });

      const resposta = await a.api.post('/folders', {
        title: 'Pasta infiltrada',
        customerId: cliente.corpo.id,
      });

      expect(resposta.status).toBe(404);
    });

    it('excluir a pasta devolve os documentos para a raiz, sem apagá-los', async () => {
      // A pasta é organização, não conteúdo: apagar os arquivos junto
      // transformaria um clique de arrumação em perda de documento.
      const enviado = await a.api.postArquivo<{ id: string }>(
        '/documents',
        { nome: 'contrato.txt', conteudo: 'conteúdo', tipo: 'text/plain' },
        { folderId: id },
      );

      await a.api.delete(`/folders/${id}`);

      const documento = await aplicacao.prisma.document.findUnique({
        where: { id: enviado.corpo.id },
        select: { folderId: true, deletedAt: true },
      });

      expect(documento?.folderId).toBeNull();
      expect(documento?.deletedAt).toBeNull();
    });

    it('pasta do sistema não pode ser removida nem renomeada', async () => {
      const doSistema = await aplicacao.prisma.folder.create({
        data: { officeId: a.officeId, title: 'Recebidos', system: true },
        select: { id: true },
      });

      const renomear = await a.api.patch(`/folders/${doSistema.id}`, {
        title: 'Outro nome',
      });
      const remover = await a.api.delete(`/folders/${doSistema.id}`);

      expect(renomear.status).toBe(400);
      expect(remover.status).toBe(400);
    });

    it('o outro escritório não enxerga', async () => {
      const lista = await b.api.get<Pagina<unknown>>('/folders');

      expect(lista.corpo.data).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('serviços', () => {
    let id: string;

    const novo = {
      title: 'Ação trabalhista',
      description: 'Reclamação contra o empregador',
      area: ServiceArea.LABOR,
      valueType: ServiceValueType.FIXED,
      valueFixed: 2500,
    };

    it('cria e aparece no prompt do agente na hora', async () => {
      // O serviço só serve para alguma coisa se o agente souber dele.
      const criado = await a.api.post<{ id: string }>('/services', novo);
      expect(criado.status).toBe(201);
      id = criado.corpo.id;

      const bloco = await prompt.blocoEstatico(a.officeId);
      expect(bloco).toContain('Ação trabalhista');
      expect(bloco).toContain('2500');
    });

    it('alterar o preço aparece no prompt na hora', async () => {
      // Sem invalidar o cache, o agente informaria o preço antigo por até 15
      // minutos — e o escritório teria de honrá-lo.
      await a.api.patch(`/services/${id}`, { valueFixed: 3200 });

      const bloco = await prompt.blocoEstatico(a.officeId);
      expect(bloco).toContain('3200');
      expect(bloco).not.toContain('2500');
    });

    it('excluir também', async () => {
      await a.api.delete(`/services/${id}`);

      expect(await prompt.blocoEstatico(a.officeId)).not.toContain(
        'Ação trabalhista',
      );
    });

    it('recusa valor fixo sem o valor', async () => {
      // Apareceria no prompt como "sob consulta" — diferente do que o
      // escritório quis dizer.
      const resposta = await a.api.post('/services', {
        ...novo,
        valueFixed: undefined,
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa valor personalizado sem a descrição', async () => {
      const resposta = await a.api.post('/services', {
        ...novo,
        valueType: ServiceValueType.PERSONAL,
        valueFixed: undefined,
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa área jurídica inexistente', async () => {
      const resposta = await a.api.post('/services', {
        ...novo,
        area: 'DIREITO_INTERGALACTICO',
      });

      expect(resposta.status).toBe(400);
    });

    it('o serviço de um escritório nunca entra no prompt do outro', async () => {
      await a.api.post('/services', { ...novo, title: 'Inventário' });

      expect(await prompt.blocoEstatico(b.officeId)).not.toContain(
        'Inventário',
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('perguntas frequentes', () => {
    it('entram no prompt e saem dele', async () => {
      const criada = await a.api.post<{ id: string }>('/questions', {
        title: 'Vocês atendem aos sábados?',
        description: 'Sim, das 9h às 12h, com hora marcada.',
      });

      expect(await prompt.blocoEstatico(a.officeId)).toContain('sábados');

      await a.api.delete(`/questions/${criada.corpo.id}`);

      expect(await prompt.blocoEstatico(a.officeId)).not.toContain('sábados');
    });

    it('pergunta desativada não vai para o agente', async () => {
      // É como o escritório tira uma resposta de circulação sem apagá-la.
      const criada = await a.api.post<{ id: string }>('/questions', {
        title: 'Promoção de fim de ano?',
        description: 'Sim, 20% de desconto até dezembro.',
      });

      expect(await prompt.blocoEstatico(a.officeId)).toContain('Promoção');

      await a.api.patch(`/questions/${criada.corpo.id}`, { status: false });

      expect(await prompt.blocoEstatico(a.officeId)).not.toContain('Promoção');
    });

    it('filtra por situação na listagem', async () => {
      // O filtro chegou a devolver o contrário do pedido: o pipe converte a
      // string em booleano antes do @Transform, e a comparação com 'true'
      // resultava sempre em false.
      await a.api.post('/questions', {
        title: 'Pergunta ativa',
        description: 'Resposta da pergunta ativa.',
      });
      const desativada = await a.api.post<{ id: string }>('/questions', {
        title: 'Pergunta desativada',
        description: 'Resposta da pergunta desativada.',
      });
      await a.api.patch(`/questions/${desativada.corpo.id}`, {
        status: false,
      });

      const ativas = await a.api.get<Pagina<{ status: boolean }>>(
        '/questions?status=true',
      );
      const inativas = await a.api.get<Pagina<{ status: boolean }>>(
        '/questions?status=false',
      );

      expect(ativas.corpo.data.length).toBeGreaterThan(0);
      for (const pergunta of ativas.corpo.data) {
        expect(pergunta.status).toBe(true);
      }

      expect(inativas.corpo.data.length).toBeGreaterThan(0);
      for (const pergunta of inativas.corpo.data) {
        expect(pergunta.status).toBe(false);
      }
    });
  });

  // -------------------------------------------------------------------------
  describe('preferências de notificação', () => {
    it('já existem quando o escritório é criado', async () => {
      const resposta = await a.api.get<{ notifyLawyerNewLead: boolean }>(
        '/settings',
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.notifyLawyerNewLead).toBe(true);
    });

    it('atualização parcial não desliga o que não foi tocado', async () => {
      // A tela envia só o que mudou; um PATCH que zerasse o resto silenciaria
      // notificações que ninguém pediu para silenciar.
      await a.api.patch('/settings', { notifyLawyerNewLead: false });

      const resposta = await a.api.get<{
        notifyLawyerNewLead: boolean;
        notifyLawyerNewEvent: boolean;
      }>('/settings');

      expect(resposta.corpo.notifyLawyerNewLead).toBe(false);
      expect(resposta.corpo.notifyLawyerNewEvent).toBe(true);
    });

    it('USER não altera as preferências do escritório', async () => {
      const convidado = await criarConta(aplicacao.url, 'Convidado');
      await a.api.post('/offices/current/members', {
        email: convidado.email,
        role: 'USER',
      });

      const comoMembro = new Cliente(aplicacao.url, {
        token: convidado.token,
        officeId: a.officeId,
      });

      expect((await comoMembro.patch('/settings', {})).status).toBe(403);
      expect((await comoMembro.get('/settings')).status).toBe(200);
    });

    it('cada escritório tem as suas', async () => {
      const doB = await b.api.get<{ notifyLawyerNewLead: boolean }>(
        '/settings',
      );

      expect(doB.corpo.notifyLawyerNewLead).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('cobrança da consulta', () => {
    it('já existe quando o escritório é criado, e sem cobrança', async () => {
      const resposta = await a.api.get<{ isCharged: boolean }>(
        '/consultations',
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.isCharged).toBe(false);
    });

    it('passar a cobrar aparece no prompt do agente', async () => {
      const resposta = await a.api.patch('/consultations', {
        isCharged: true,
        consultationValue: 350,
      });

      expect(resposta.status).toBe(200);
      expect(await prompt.blocoEstatico(a.officeId)).toContain('350');
    });

    it('recusa cobrar sem valor', async () => {
      const resposta = await a.api.patch('/consultations', {
        isCharged: true,
        consultationValue: 0,
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa exigir pagamento sem chave PIX', async () => {
      // O cliente receberia a instrução de pagar e não teria para onde.
      const resposta = await a.api.patch('/consultations', {
        requiresPaymentToSchedule: true,
      });

      expect(resposta.status).toBe(400);
    });

    it('aceita quando a chave vem junto', async () => {
      const resposta = await a.api.patch('/consultations', {
        requiresPaymentToSchedule: true,
        lawyerPixKey: 'escritorio@cacia.test',
      });

      expect(resposta.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  describe('painel', () => {
    it('conta o que existe no escritório', async () => {
      const resposta = await a.api.get<{
        summary: {
          chats: number;
          leads: number;
          customers: number;
          processes: number;
        };
        processStatus: { status: string; total: number }[];
        lastProcesses: { id: string }[];
      }>('/dashboard');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.summary.customers).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(resposta.corpo.processStatus)).toBe(true);
      expect(Array.isArray(resposta.corpo.lastProcesses)).toBe(true);
    });

    it('conta só o próprio escritório', async () => {
      const cliente = await a.api.post<{ id: string }>('/customers', {
        name: 'Cliente do painel',
        document: '77777777777',
        remotejid: '5511977777777@c.us',
      });
      await a.api.post('/processes', {
        customerId: cliente.corpo.id,
        number: '40000000000000000004',
      });

      const doA = await a.api.get<{ summary: { processes: number } }>(
        '/dashboard',
      );
      const doB = await b.api.get<{ summary: { processes: number } }>(
        '/dashboard',
      );

      expect(doA.corpo.summary.processes).toBeGreaterThan(0);
      expect(doB.corpo.summary.processes).toBe(0);
    });

    it('recusa data que não é data', async () => {
      const resposta = await a.api.get('/dashboard?from=ontem');

      expect(resposta.status).toBe(400);
    });
  });
});
