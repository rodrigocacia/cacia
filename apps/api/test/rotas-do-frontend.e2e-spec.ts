import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocumentStatus, NotificationType } from '@cacia/database';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { Cliente } from './apoio/cliente';
import { criarDuasContas, type Conta } from './apoio/contas';

/**
 * As rotas que faltavam para os frontends funcionarem.
 *
 * Cada uma corresponde a uma chamada que a interface já fazia e que não tinha
 * destino: contagem de não lidas no sino, exclusão de notificação, andamento
 * lançado à mão, edição de documento e lembrete avulso.
 */
describe('rotas que o frontend precisa (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let a: Conta;
  let b: Conta;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    [a, b] = await criarDuasContas(aplicacao.url);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  // -------------------------------------------------------------------------
  describe('login', () => {
    it('devolve o onboarding de cada escritório', async () => {
      // É o que decide para onde o usuário vai depois de entrar. Buscar numa
      // segunda requisição faria a tela piscar entre o painel e o onboarding.
      const publico = new Cliente(aplicacao.url);

      const resposta = await publico.post<{
        offices: { id: string; onboarding: boolean; status: string }[];
      }>('/auth/login', {
        email: a.email,
        password: 'senha-de-teste-123',
      });

      expect(resposta.status).toBe(200);

      const escritorio = resposta.corpo.offices.find(
        (o) => o.id === a.officeId,
      );
      expect(escritorio?.onboarding).toBe(false);
      expect(escritorio?.status).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  describe('notificações', () => {
    let id: string;

    beforeAll(async () => {
      const notificacao = await aplicacao.prisma.notification.create({
        data: {
          officeId: a.officeId,
          userId: a.userId,
          type: NotificationType.NEW_LEAD,
          typeId: a.officeId,
          typeTitle: 'Novo contato',
          typeDetail: 'Joana chamou no WhatsApp',
        },
        select: { id: true },
      });
      id = notificacao.id;
    });

    it('conta as não lidas', async () => {
      const resposta = await a.api.get<{ count: number }>(
        '/notifications/unread-count',
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.count).toBe(1);
    });

    it('marcar como lida derruba a contagem', async () => {
      await a.api.post(`/notifications/${id}/read`);

      const resposta = await a.api.get<{ count: number }>(
        '/notifications/unread-count',
      );

      expect(resposta.corpo.count).toBe(0);
    });

    it('excluir tira da lista sem apagar o histórico', async () => {
      const exclusao = await a.api.delete(`/notifications/${id}`);
      expect(exclusao.status).toBe(204);

      const lista = await a.api.get<{ data: { id: string }[] }>(
        '/notifications',
      );
      expect(lista.corpo.data.map((n) => n.id)).not.toContain(id);

      const linha = await aplicacao.prisma.notification.findUnique({
        where: { id },
        select: { deletedAt: true },
      });
      expect(linha?.deletedAt).toBeInstanceOf(Date);
    });

    it('a contagem é por usuário, não por escritório', async () => {
      // A notificação é de uma pessoa dentro de um escritório. Contar as do
      // escritório inteiro mostraria no sino de um o que é do outro.
      const resposta = await b.api.get<{ count: number }>(
        '/notifications/unread-count',
      );

      expect(resposta.corpo.count).toBe(0);
    });

    it('não é possível excluir notificação de outro escritório', async () => {
      const resposta = await b.api.delete(`/notifications/${id}`);

      expect(resposta.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  describe('andamento lançado à mão', () => {
    let processId: string;

    beforeAll(async () => {
      const cliente = await a.api.post<{ id: string }>('/customers', {
        name: 'Cliente com processo',
        document: '33333333333',
        remotejid: '5511933333333@c.us',
      });

      const processo = await a.api.post<{ id: string }>('/processes', {
        customerId: cliente.corpo.id,
        number: '50000000000000000005',
      });
      processId = processo.corpo.id;
    });

    it('cria e aparece na lista de andamentos', async () => {
      const resposta = await a.api.post<{ id: string; title: string }>(
        `/processes/${processId}/progresses`,
        { description: 'Audiência de conciliação realizada.' },
      );

      expect(resposta.status).toBe(201);

      const lista = await a.api.get<{ data: { id: string }[] }>(
        `/processes/${processId}/progresses`,
      );
      expect(lista.corpo.data.map((p) => p.id)).toContain(resposta.corpo.id);
    });

    it('dois lançamentos manuais convivem no mesmo processo', async () => {
      // A constraint @@unique([processId, stepId]) recusaria o segundo se o
      // stepId ficasse vazio nos dois — daí o identificador gerado.
      const primeiro = await a.api.post(`/processes/${processId}/progresses`, {
        description: 'Primeiro lançamento manual.',
      });
      const segundo = await a.api.post(`/processes/${processId}/progresses`, {
        description: 'Segundo lançamento manual.',
      });

      expect(primeiro.status).toBe(201);
      expect(segundo.status).toBe(201);
    });

    it('atualiza a última movimentação do processo', async () => {
      const processo = await aplicacao.prisma.process.findUnique({
        where: { id: processId },
        select: { lastActivityAt: true },
      });

      expect(processo?.lastActivityAt).toBeInstanceOf(Date);
    });

    it('o outro escritório não lança no processo alheio', async () => {
      const resposta = await b.api.post(`/processes/${processId}/progresses`, {
        description: 'Andamento infiltrado.',
      });

      expect(resposta.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  describe('edição de documento', () => {
    let id: string;

    beforeAll(async () => {
      const enviado = await a.api.postArquivo<{ id: string }>('/documents', {
        nome: 'minuta.txt',
        conteudo: 'Minuta de contrato, primeira versão.',
        tipo: 'text/plain',
      });
      id = enviado.corpo.id;
    });

    it('renomeia e muda a situação', async () => {
      const resposta = await a.api.patch<{ title: string; status: string }>(
        `/documents/${id}`,
        { title: 'Minuta revisada', status: DocumentStatus.APPROVED },
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.title).toBe('Minuta revisada');
      expect(resposta.corpo.status).toBe(DocumentStatus.APPROVED);
    });

    it('mudar o conteúdo devolve o documento para a fila de indexação', async () => {
      // O que está no índice vetorial deixou de corresponder ao documento.
      // Sem isto, a IA citaria um trecho que não existe mais.
      await aplicacao.prisma.document.update({
        where: { id },
        data: { vectorStatus: 'COMPLETED', vectorChunksCount: 3 },
      });

      await a.api.patch(`/documents/${id}`, {
        content: 'Minuta de contrato, segunda versão, com nova cláusula.',
      });

      const documento = await aplicacao.prisma.document.findUnique({
        where: { id },
        select: { vectorStatus: true, vectorChunksCount: true },
      });

      expect(documento?.vectorStatus).toBe('PENDING');
      expect(documento?.vectorChunksCount).toBe(0);
    });

    it('renomear NÃO reindexa — só o conteúdo importa para a busca', async () => {
      await aplicacao.prisma.document.update({
        where: { id },
        data: { vectorStatus: 'COMPLETED' },
      });

      await a.api.patch(`/documents/${id}`, { title: 'Outro nome' });

      const documento = await aplicacao.prisma.document.findUnique({
        where: { id },
        select: { vectorStatus: true },
      });

      expect(documento?.vectorStatus).toBe('COMPLETED');
    });

    it('recusa situação que não existe', async () => {
      const resposta = await a.api.patch(`/documents/${id}`, {
        status: 'QUASE_PRONTO',
      });

      expect(resposta.status).toBe(400);
    });

    it('o outro escritório não edita', async () => {
      const resposta = await b.api.patch(`/documents/${id}`, {
        title: 'Sequestrado',
      });

      expect(resposta.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  describe('lembrete avulso', () => {
    let eventId: string;

    beforeAll(async () => {
      const agenda = await a.api.post<{ id: string }>('/calendars', {
        title: 'Atendimento',
      });

      const evento = await a.api.post<{ id: string }>('/events', {
        calendarId: agenda.corpo.id,
        title: 'Audiência',
        startTime: new Date(Date.now() + 72 * 3_600_000).toISOString(),
        endTime: new Date(Date.now() + 73 * 3_600_000).toISOString(),
      });
      eventId = evento.corpo.id;
    });

    it('cria depois, em compromisso que já existe', async () => {
      const resposta = await a.api.post<{ id: string; triggerAt: string }>(
        '/reminders',
        { eventId, title: 'Lembrar de levar os documentos', timeTrigger: 120 },
      );

      expect(resposta.status).toBe(201);

      const lista = await a.api.get<{ id: string }[]>(
        `/reminders?eventId=${eventId}`,
      );
      expect(lista.corpo.map((l) => l.id)).toContain(resposta.corpo.id);
    });

    it('o disparo é calculado a partir do compromisso, não recebido pronto', async () => {
      // Aceitar `triggerAt` do cliente permitiria um aviso desalinhado do
      // compromisso a que ele pertence.
      const evento = await aplicacao.prisma.event.findUniqueOrThrow({
        where: { id: eventId },
        select: { startTime: true },
      });

      const lembrete = await aplicacao.prisma.reminder.findFirstOrThrow({
        where: { eventId, timeTrigger: 120 },
        select: { triggerAt: true },
      });

      expect(lembrete.triggerAt.getTime()).toBe(
        evento.startTime.getTime() - 120 * 60_000,
      );
    });

    it('recusa antecedência acima de 14 dias', async () => {
      const resposta = await a.api.post('/reminders', {
        eventId,
        title: 'Cedo demais',
        timeTrigger: 40_000,
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa compromisso de outro escritório', async () => {
      const resposta = await b.api.post('/reminders', {
        eventId,
        title: 'Infiltrado',
        timeTrigger: 30,
      });

      expect(resposta.status).toBe(404);
    });

    it('a listagem por compromisso não vaza para o outro escritório', async () => {
      const resposta = await b.api.get<unknown[]>(
        `/reminders?eventId=${eventId}`,
      );

      expect(resposta.corpo).toEqual([]);
    });

    it('sem compromisso informado, devolve lista vazia em vez de tudo', async () => {
      const resposta = await a.api.get<unknown[]>('/reminders');

      expect(resposta.corpo).toEqual([]);
    });
  });
});
