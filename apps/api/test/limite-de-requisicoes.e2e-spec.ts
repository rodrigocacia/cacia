import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { Cliente } from './apoio/cliente';

/**
 * O limite por IP, com um teto baixo o bastante para ser exercitado.
 *
 * Arquivo separado porque o teto é configuração de inicialização: as outras
 * suítes precisam de teto alto para fazer centenas de requisições, e mudá-lo
 * exige subir outra aplicação.
 */
describe('limite de requisições (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let api: Cliente;

  const TETO = 5;

  beforeAll(async () => {
    aplicacao = await criarAplicacao({
      RATE_LIMIT_MAX: String(TETO),
      RATE_LIMIT_TTL: '60000',
    });
    api = new Cliente(aplicacao.url);
  });

  afterAll(async () => {
    await aplicacao.encerrar();
    // Devolve o teto alto para quem rodar outra suíte no mesmo processo
    process.env.RATE_LIMIT_MAX = '100000';
  });

  it('recusa a partir da requisição acima do teto', async () => {
    const status: number[] = [];

    for (let i = 0; i < TETO + 2; i++) {
      const resposta = await api.post('/auth/login', {
        email: 'ninguem@cacia.test',
        password: 'senha-errada-mas-longa',
      });
      status.push(resposta.status);
    }

    expect(status.slice(0, TETO).every((s) => s === 401)).toBe(true);
    expect(status.slice(TETO).every((s) => s === 429)).toBe(true);
  });

  it('o limite vem ANTES da autenticação', async () => {
    // É o ponto do desenho: uma enxurrada de requisições sem token não pode
    // custar uma consulta ao banco cada. Sem token nenhum, a rota protegida
    // responde 401 até o teto e passa a responder 429 — prova de que o
    // ThrottlerGuard corre antes do JwtAuthGuard.
    //
    // A contagem é por rota, e não global por IP: por isso este teste bate na
    // sua própria rota em vez de aproveitar o teto já estourado acima.
    const status: number[] = [];

    for (let i = 0; i < TETO + 2; i++) {
      const resposta = await api.get('/offices');
      status.push(resposta.status);
    }

    expect(status.slice(0, TETO).every((s) => s === 401)).toBe(true);
    expect(status.slice(TETO).every((s) => s === 429)).toBe(true);
  });
});
