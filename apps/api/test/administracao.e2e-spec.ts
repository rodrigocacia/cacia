import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OfficeStatus, Role } from '@cacia/database';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { Cliente } from './apoio/cliente';
import { criarConta, criarDuasContas, type Conta } from './apoio/contas';

/**
 * A administração da plataforma.
 *
 * É a ÚNICA parte do sistema que atravessa escritórios. Todo o resto do código
 * é escrito para não conseguir fazer isso; aqui a ausência do filtro é
 * deliberada, e por isso o portão merece mais atenção que as próprias rotas.
 */
describe('administração da plataforma (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let a: Conta;
  let b: Conta;
  /** Conta com papel global de ADMIN. */
  let operador: Cliente;

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    [a, b] = await criarDuasContas(aplicacao.url);

    const conta = await criarConta(aplicacao.url, 'Escritório do Operador');

    await aplicacao.prisma.user.update({
      where: { id: conta.userId },
      data: { role: Role.ADMIN },
    });

    // Sem escritório no cabeçalho: as rotas administrativas não pertencem a um
    operador = new Cliente(aplicacao.url, { token: conta.token });
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  // -------------------------------------------------------------------------
  describe('o portão', () => {
    it('usuário comum não entra, mesmo autenticado', async () => {
      const resposta = await a.api.semEscritorio().get('/admin/offices');

      expect(resposta.status).toBe(403);
    });

    it('nem com o cabeçalho do próprio escritório', async () => {
      // O papel de ADMIN dentro de um escritório não vale aqui: são coisas
      // diferentes, e confundi-las daria a qualquer dono de escritório acesso
      // aos dados de todos os outros.
      const resposta = await a.api.get('/admin/offices');

      expect(resposta.status).toBe(403);
    });

    it('sem token nenhum, 401', async () => {
      const publico = new Cliente(aplicacao.url);

      expect((await publico.get('/admin/offices')).status).toBe(401);
    });

    it('o operador entra', async () => {
      const resposta = await operador.get('/admin/offices');

      expect(resposta.status).toBe(200);
    });

    it('revogar a administração corta o acesso na hora', async () => {
      // O papel vem do banco a cada requisição, nunca do token: revogar
      // precisa surtir efeito já, e não quando o token expirar em 7 dias.
      const conta = await criarConta(aplicacao.url, 'Operador temporário');
      const cliente = new Cliente(aplicacao.url, { token: conta.token });

      await aplicacao.prisma.user.update({
        where: { id: conta.userId },
        data: { role: Role.ADMIN },
      });
      expect((await cliente.get('/admin/offices')).status).toBe(200);

      await aplicacao.prisma.user.update({
        where: { id: conta.userId },
        data: { role: Role.USER },
      });
      expect((await cliente.get('/admin/offices')).status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  describe('escritórios', () => {
    it('lista os de todos os tenants', async () => {
      const resposta = await operador.get<{
        data: { id: string }[];
        meta: { total: number };
      }>('/admin/offices');

      const ids = resposta.corpo.data.map((o) => o.id);
      expect(ids).toContain(a.officeId);
      expect(ids).toContain(b.officeId);
    });

    it('cadastra um escritório com o dono, e o dono já consegue entrar', async () => {
      // Os dois nascem juntos porque um escritório sem membro é inacessível:
      // o acesso passa por office_members.
      const criado = await operador.post<{ id: string }>('/admin/offices', {
        name: 'Escritório Cadastrado pelo Painel',
        document: '99887766554433',
        oabNumber: '778899',
        oabUf: 'RJ',
        ownerName: 'Dono Novo',
        ownerEmail: 'dono-novo@cacia.test',
        ownerPassword: 'senha-de-teste-123',
        addresses: [{ city: 'Rio de Janeiro', state: 'RJ' }],
      });

      expect(criado.status).toBe(201);

      const publico = new Cliente(aplicacao.url);
      const login = await publico.post<{
        token: string;
        offices: { id: string; role: string }[];
      }>('/auth/login', {
        email: 'dono-novo@cacia.test',
        password: 'senha-de-teste-123',
      });

      expect(login.status).toBe(200);
      expect(login.corpo.offices[0]?.id).toBe(criado.corpo.id);
      expect(login.corpo.offices[0]?.role).toBe('ADMIN');

      // E consegue operar o próprio escritório
      const comoDono = new Cliente(aplicacao.url, {
        token: login.corpo.token,
        officeId: criado.corpo.id,
      });
      expect((await comoDono.get('/customers')).status).toBe(200);
    });

    it('o dono nasce USER na plataforma, não administrador dela', async () => {
      // Administrar o próprio escritório não pode dar acesso aos dos outros.
      const publico = new Cliente(aplicacao.url);
      const login = await publico.post<{ token: string }>('/auth/login', {
        email: 'dono-novo@cacia.test',
        password: 'senha-de-teste-123',
      });

      const comoDono = new Cliente(aplicacao.url, {
        token: login.corpo.token,
      });

      expect((await comoDono.get('/admin/offices')).status).toBe(403);
    });

    it('recusa e-mail já cadastrado', async () => {
      const resposta = await operador.post('/admin/offices', {
        name: 'Outro',
        document: '11223344556677',
        oabNumber: '112233',
        oabUf: 'SP',
        ownerName: 'Dono Repetido',
        ownerEmail: 'dono-novo@cacia.test',
        ownerPassword: 'senha-de-teste-123',
      });

      expect(resposta.status).toBe(409);
    });

    it('detalha com o dono e os totais', async () => {
      const resposta = await operador.get<{
        owner: { email: string };
        _count: { members: number };
      }>(`/admin/offices/${a.officeId}`);

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.owner.email).toBe(a.email);
      expect(resposta.corpo._count.members).toBeGreaterThanOrEqual(1);
    });

    it('filtra por situação', async () => {
      const resposta = await operador.get<{ data: { status: string }[] }>(
        `/admin/offices?status=${OfficeStatus.PENDING}`,
      );

      for (const escritorio of resposta.corpo.data) {
        expect(escritorio.status).toBe(OfficeStatus.PENDING);
      }
    });

    it('altera a situação', async () => {
      const resposta = await operador.patch<{ status: string }>(
        `/admin/offices/${b.officeId}/status`,
        { status: OfficeStatus.ACTIVE },
      );

      expect(resposta.corpo.status).toBe(OfficeStatus.ACTIVE);
    });

    it('recusa situação que não existe', async () => {
      const resposta = await operador.patch(
        `/admin/offices/${b.officeId}/status`,
        { status: 'MEIO_ATIVO' },
      );

      expect(resposta.status).toBe(400);
    });

    it('a exclusão é lógica — o histórico jurídico não pode sumir', async () => {
      const conta = await criarConta(aplicacao.url, 'Escritório encerrado');

      const exclusao = await operador.delete(
        `/admin/offices/${conta.officeId}`,
      );
      expect(exclusao.status).toBe(204);

      const linha = await aplicacao.prisma.office.findUnique({
        where: { id: conta.officeId },
        select: { deletedAt: true, status: true },
      });

      expect(linha?.deletedAt).toBeInstanceOf(Date);
      expect(linha?.status).toBe(OfficeStatus.DEACTIVATE);
    });

    it('e o acesso do dono cessa junto', async () => {
      // O TenantGuard recusa escritório excluído — sem isso, quem já estava
      // logado continuaria operando um escritório desativado.
      const conta = await criarConta(aplicacao.url, 'Outro encerrado');

      await operador.delete(`/admin/offices/${conta.officeId}`);

      expect((await conta.api.get('/customers')).status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  describe('desempenho de um escritório', () => {
    it('devolve os totais e a variação', async () => {
      await a.api.post('/customers', {
        name: 'Cliente para o painel',
        document: '88888888888',
        remotejid: '5511988888888@c.us',
      });

      const resposta = await operador.get<{
        customers: number;
        customersVariation: number;
        totalProcesses: number;
        processesByType: Record<string, number>;
      }>(`/admin/offices/${a.officeId}/performance?periodInDays=30`);

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.customers).toBeGreaterThan(0);
      // Sem base de comparação a variação é 100%, não infinito
      expect(resposta.corpo.customersVariation).toBe(100);
    });

    it('conta só o escritório pedido', async () => {
      const doB = await operador.get<{ customers: number }>(
        `/admin/offices/${b.officeId}/performance`,
      );

      expect(doB.corpo.customers).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('usuários', () => {
    it('lista todos', async () => {
      const resposta = await operador.get<{ data: { email: string }[] }>(
        '/admin/users',
      );

      const emails = resposta.corpo.data.map((u) => u.email);
      expect(emails).toContain(a.email);
      expect(emails).toContain(b.email);
    });

    it('nunca devolve a senha', async () => {
      const resposta = await operador.get('/admin/users');

      expect(JSON.stringify(resposta.corpo)).not.toContain('password');
    });

    it('detalha com os escritórios de que participa', async () => {
      const resposta = await operador.get<{
        memberships: { role: string; office: { id: string } }[];
      }>(`/admin/users/${a.userId}`);

      expect(resposta.corpo.memberships[0]?.office.id).toBe(a.officeId);
      expect(resposta.corpo.memberships[0]?.role).toBe('ADMIN');
    });

    it('concede e revoga a administração', async () => {
      const conceder = await operador.patch<{ role: string }>(
        `/admin/users/${b.userId}`,
        { role: Role.ADMIN },
      );
      expect(conceder.corpo.role).toBe(Role.ADMIN);

      const revogar = await operador.patch<{ role: string }>(
        `/admin/users/${b.userId}`,
        { role: Role.USER },
      );
      expect(revogar.corpo.role).toBe(Role.USER);
    });

    it('excluir o usuário corta o acesso dele na hora', async () => {
      // O JwtStrategy confere a existência a cada requisição.
      const conta = await criarConta(aplicacao.url, 'Conta a excluir');

      await operador.delete(`/admin/users/${conta.userId}`);

      expect((await conta.api.get('/customers')).status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  describe('painel', () => {
    it('conta usuários e escritórios da plataforma', async () => {
      const resposta = await operador.get<{
        users: number;
        offices: number;
        recentOffices: { id: string }[];
      }>('/admin/dashboard');

      expect(resposta.corpo.users).toBeGreaterThan(0);
      expect(resposta.corpo.offices).toBeGreaterThan(0);
      expect(resposta.corpo.recentOffices.length).toBeGreaterThan(0);
    });

    it('diz que não há faturamento em vez de mostrar zero', async () => {
      // Zero se confunde com "nenhuma venda no período". A cobrança não foi
      // reimplementada, e a tela precisa saber a diferença.
      const resposta = await operador.get<{
        faturamento: { disponivel: boolean; motivo: string };
      }>('/admin/dashboard');

      expect(resposta.corpo.faturamento.disponivel).toBe(false);
      expect(resposta.corpo.faturamento.motivo).toContain('cobrança');
    });
  });
});
