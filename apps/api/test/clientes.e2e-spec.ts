import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

interface Cliente {
  id: string;
  name: string;
  document: string;
  email: string | null;
}

interface Pagina {
  data: Cliente[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

describe('clientes (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let conta: Conta;

  const novo = {
    name: 'João da Silva',
    document: '12345678901',
    remotejid: '5511999999999@c.us',
    email: 'joao@exemplo.test',
  };

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    conta = await criarConta(aplicacao.url);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
  });

  describe('ciclo completo', () => {
    let id: string;

    it('cria', async () => {
      const resposta = await conta.api.post<Cliente>('/customers', novo);

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.name).toBe(novo.name);
      id = resposta.corpo.id;
    });

    it('cria com endereço, como a tela de cadastro envia', async () => {
      // Com officeId dentro do endereço aninhado o Prisma recusava a chamada
      // e o cadastro inteiro caía com 500.
      const resposta = await conta.api.post<Cliente>('/customers', {
        name: 'Cliente com Endereço',
        document: '39053344705',
        remotejid: '11933332222',
        addresses: [{ cep: '01310-100', city: 'São Paulo', state: 'SP' }],
      });

      expect(resposta.status).toBe(201);

      const enderecos = await aplicacao.prisma.customerAddress.count({
        where: { customerId: resposta.corpo.id },
      });
      expect(enderecos).toBe(1);
    });

    it('aparece na listagem', async () => {
      const resposta = await conta.api.get<Pagina>('/customers');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.data.map((c) => c.id)).toContain(id);
      expect(resposta.corpo.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('detalha', async () => {
      const resposta = await conta.api.get<Cliente>(`/customers/${id}`);

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.id).toBe(id);
    });

    it('atualiza', async () => {
      const resposta = await conta.api.patch<Cliente>(`/customers/${id}`, {
        name: 'João da Silva Júnior',
      });

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.name).toBe('João da Silva Júnior');
    });

    it('exclui e some da listagem', async () => {
      const exclusao = await conta.api.delete(`/customers/${id}`);
      expect(exclusao.status).toBe(204);

      const detalhe = await conta.api.get(`/customers/${id}`);
      expect(detalhe.status).toBe(404);

      const lista = await conta.api.get<Pagina>('/customers');
      expect(lista.corpo.data.map((c) => c.id)).not.toContain(id);
    });

    it('a exclusão foi lógica — a linha continua no banco', async () => {
      // Excluir cliente precisa ser reversível pelo suporte. Se a linha
      // sumisse, os processos e mensagens ligados a ela iriam junto.
      const linha = await aplicacao.prisma.customer.findUnique({
        where: { id },
        select: { deletedAt: true },
      });

      expect(linha?.deletedAt).toBeInstanceOf(Date);
    });

    it('recadastrar o mesmo documento restaura o cliente excluído', async () => {
      // A unicidade ignora a exclusão lógica: antes isto caía com 500.
      const resposta = await conta.api.post<Cliente>('/customers', {
        ...novo,
        name: 'Voltou',
      });

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.id).toBe(id);
      expect(resposta.corpo.name).toBe('Voltou');
    });

    it('busca pelo telefone', async () => {
      const digitos = String(novo.remotejid).replace(/\D/g, '').slice(-8);
      const resposta = await conta.api.get<Pagina>(
        `/customers?search=${digitos}`,
      );

      expect(resposta.corpo.data.map((c) => c.id)).toContain(id);
    });
  });

  describe('validação', () => {
    it('recusa CPF fora do tamanho', async () => {
      const resposta = await conta.api.post('/customers', {
        ...novo,
        document: '123',
      });

      expect(resposta.status).toBe(400);
    });

    it('limpa a pontuação do documento', async () => {
      const resposta = await conta.api.post<Cliente>('/customers', {
        ...novo,
        document: '987.654.321-00',
        remotejid: '5511900000001@c.us',
      });

      expect(resposta.status).toBe(201);
      expect(resposta.corpo.document).toBe('98765432100');
    });

    it('recusa e-mail inválido', async () => {
      const resposta = await conta.api.post('/customers', {
        ...novo,
        remotejid: '5511900000002@c.us',
        email: 'nao-e-email',
      });

      expect(resposta.status).toBe(400);
    });

    it('recusa id que não é UUID em vez de consultar o banco', async () => {
      const resposta = await conta.api.get('/customers/abc');

      expect(resposta.status).toBe(400);
    });

    it('recusa officeId enviado no corpo', async () => {
      // O escritório vem do cabeçalho validado. Aceitá-lo no corpo seria a
      // porta para gravar registro no escritório alheio.
      const resposta = await conta.api.post('/customers', {
        ...novo,
        remotejid: '5511900000003@c.us',
        officeId: '00000000-0000-0000-0000-000000000001',
      });

      expect(resposta.status).toBe(400);
    });
  });

  describe('paginação', () => {
    beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
        await conta.api.post('/customers', {
          name: `Cliente ${i}`,
          document: String(20000000000 + i),
          remotejid: `55119100000${i}@c.us`,
        });
      }
    });

    it('respeita page e limit', async () => {
      const resposta = await conta.api.get<Pagina>('/customers?page=1&limit=2');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.data).toHaveLength(2);
      expect(resposta.corpo.meta.limit).toBe(2);
    });

    it('a segunda página traz registros diferentes', async () => {
      const primeira = await conta.api.get<Pagina>('/customers?page=1&limit=2');
      const segunda = await conta.api.get<Pagina>('/customers?page=2&limit=2');

      const ids = new Set(primeira.corpo.data.map((c) => c.id));
      for (const cliente of segunda.corpo.data) {
        expect(ids.has(cliente.id)).toBe(false);
      }
    });

    it('recusa limite acima do teto', async () => {
      // Sem teto, `limit=1000000` vira um dump da tabela em uma requisição.
      const resposta = await conta.api.get('/customers?limit=5000');

      expect(resposta.status).toBe(400);
    });

    it('filtra pela busca', async () => {
      const resposta = await conta.api.get<Pagina>('/customers?search=Cliente');

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.data.length).toBeGreaterThan(0);
      for (const cliente of resposta.corpo.data) {
        expect(cliente.name).toContain('Cliente');
      }
    });

    it('termo sem dígitos e sem correspondência não devolve nada', async () => {
      // Regressão: a busca montava `document: { contains: '' }` quando o termo
      // não tinha dígitos, e no Postgres todo texto contém a string vazia — a
      // cláusula casava com a base inteira e a busca virava listagem completa.
      const resposta = await conta.api.get<Pagina>(
        '/customers?search=zzznaoexistezzz',
      );

      expect(resposta.status).toBe(200);
      expect(resposta.corpo.data).toHaveLength(0);
      expect(resposta.corpo.meta.total).toBe(0);
    });

    it('busca pelo documento continua funcionando', async () => {
      const resposta = await conta.api.get<Pagina>(
        '/customers?search=987.654.321-00',
      );

      expect(resposta.corpo.data.map((c) => c.document)).toContain(
        '98765432100',
      );
    });
  });
});
