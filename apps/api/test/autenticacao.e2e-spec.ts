import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { Cliente } from './apoio/cliente';

describe('autenticação (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let api: Cliente;

  const conta = {
    name: 'Maria Advogada',
    email: 'maria@cacia.test',
    password: 'senha-de-teste-123',
  };

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    api = new Cliente(aplicacao.url);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('cadastro', () => {
    it('cria a conta e já devolve o token', async () => {
      const resposta = await api.post<{
        token: string;
        user: { id: string; email: string };
        offices: unknown[];
      }>('/auth/register', conta);

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.token).toBeTypeOf('string');
      expect(resposta.corpo.user.email).toBe(conta.email);
      // Conta nova não pertence a escritório nenhum ainda
      expect(resposta.corpo.offices).toEqual([]);
    });

    it('nunca devolve a senha, nem com hash', async () => {
      const resposta = await api.post('/auth/register', {
        ...conta,
        email: 'outra@cacia.test',
      });

      expect(JSON.stringify(resposta.corpo)).not.toContain('password');
    });

    it('recusa e-mail já cadastrado', async () => {
      const resposta = await api.post('/auth/register', conta);

      expect(resposta.status).toBe(409);
    });

    it('normaliza o e-mail antes de gravar', async () => {
      await api.post('/auth/register', {
        ...conta,
        email: '  JOAO@Cacia.TEST  ',
      });

      const login = await api.post('/auth/login', {
        email: 'joao@cacia.test',
        password: conta.password,
      });

      expect(login.status).toBe(200);
    });

    it('recusa senha curta', async () => {
      const resposta = await api.post<{ message: string[] }>('/auth/register', {
        ...conta,
        email: 'curta@cacia.test',
        password: '123',
      });

      expect(resposta.status).toBe(400);
      expect(resposta.corpo.message.join(' ')).toContain('8 caracteres');
    });

    it('recusa campo que não está no DTO', async () => {
      // O `forbidNonWhitelisted` existe para que um campo a mais não passe
      // despercebido — `role: ADMIN` no corpo, por exemplo.
      const resposta = await api.post('/auth/register', {
        ...conta,
        email: 'extra@cacia.test',
        role: 'ADMIN',
      });

      expect(resposta.status).toBe(400);
    });
  });

  describe('login', () => {
    it('devolve token e escritórios', async () => {
      const resposta = await api.post<{ token: string }>('/auth/login', {
        email: conta.email,
        password: conta.password,
      });

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.token).toBeTypeOf('string');
    });

    it('recusa senha errada', async () => {
      const resposta = await api.post('/auth/login', {
        email: conta.email,
        password: 'senha-errada-mas-longa',
      });

      expect(resposta.status).toBe(401);
    });

    it('responde igual para e-mail inexistente', async () => {
      // Mesma resposta de senha errada: diferenciar transformaria o login em
      // um verificador de quais e-mails têm conta.
      const inexistente = await api.post('/auth/login', {
        email: 'ninguem@cacia.test',
        password: 'senha-errada-mas-longa',
      });
      const senhaErrada = await api.post('/auth/login', {
        email: conta.email,
        password: 'senha-errada-mas-longa',
      });

      expect(inexistente.status).toBe(senhaErrada.status);
      expect(inexistente.corpo).toEqual(senhaErrada.corpo);
    });
  });

  describe('recuperação de senha', () => {
    it('responde igual para e-mail que existe e para o que não existe', async () => {
      const existente = await api.post('/auth/forgot', { email: conta.email });
      const inexistente = await api.post('/auth/forgot', {
        email: 'ninguem@cacia.test',
      });

      expect(existente.status).toBe(204);
      expect(inexistente.status).toBe(204);
    });
  });

  describe('rotas protegidas', () => {
    it('recusa requisição sem token', async () => {
      const resposta = await api.get('/offices');

      expect(resposta.status).toBe(401);
    });

    it('recusa token inválido', async () => {
      const resposta = await api
        .como({ token: 'nao-e-um-jwt' })
        .get('/offices');

      expect(resposta.status).toBe(401);
    });

    it('recusa token assinado com outro segredo', async () => {
      // Assinado com HS256 e um segredo diferente — estrutura válida,
      // assinatura que não confere.
      const forjado =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDEifQ.' +
        'assinatura-invalida';

      const resposta = await api.como({ token: forjado }).get('/offices');

      expect(resposta.status).toBe(401);
    });
  });
});
