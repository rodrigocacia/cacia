import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { AiTask, Role } from '@cacia/database';
import type { Cliente } from './apoio/cliente';
import { criarAplicacao, type AplicacaoDeTeste } from './apoio/aplicacao';
import { criarConta, type Conta } from './apoio/contas';

/**
 * Relatório de consumo de IA: a base da cobrança dos escritórios.
 *
 * O consumo é inserido direto no banco, com custo e horário escolhidos: o que
 * se verifica aqui é a consolidação — período no fuso de Brasília, margem,
 * isolamento entre escritórios e o que cada lado pode ver.
 */

const AGOSTO = 'from=2026-08-01&to=2026-08-31';

interface RelatorioDoEscritorio {
  total: number;
  totalAnterior: number;
  variacaoPercentual: number | null;
  conversasAtendidas: number;
  categorias: {
    chave: string;
    valor: number;
    percentual: number;
    chamadas: number;
  }[];
  porDia: { dia: string; valor: number }[];
}

interface DetalheDoAdmin {
  margemPercentual: number;
  total: { custo: number; cobrado: number };
  categorias: { chave: string; custo: number; cobrado: number }[];
  porModelo: { modelo: string; semPreco: boolean; chamadas: number }[];
  chamadasNaReserva: number;
}

describe('consumo de IA (e2e)', () => {
  let aplicacao: AplicacaoDeTeste;
  let a: Conta;
  let b: Conta;
  let operador: Cliente;

  async function consumo(dados: {
    officeId: string;
    task: AiTask;
    custo: number;
    em: string;
    chatId?: string;
    modelo?: string;
    reserva?: boolean;
    semPreco?: boolean;
  }) {
    await aplicacao.prisma.aiUsage.create({
      data: {
        officeId: dados.officeId,
        chatId: dados.chatId,
        task: dados.task,
        provider: dados.reserva ? 'openai' : 'deepseek',
        model: dados.modelo ?? 'deepseek-chat',
        fallback: dados.reserva ?? false,
        inputTokens: 1000,
        cachedInputTokens: 200,
        outputTokens: 100,
        costUsd: dados.custo / 5,
        costBrl: dados.custo,
        priced: !dados.semPreco,
        createdAt: new Date(dados.em),
      },
    });
  }

  async function margem(valor: number) {
    const r = await operador.put('/admin/ai-billing', {
      margemPercentual: valor,
    });
    expect(r.status).toBe(200);
  }

  beforeAll(async () => {
    aplicacao = await criarAplicacao();
    a = await criarConta(aplicacao.url, 'Escritório Consumidor');
    b = await criarConta(aplicacao.url, 'Escritório Vizinho');

    const admin = await criarConta(aplicacao.url, 'Operação');
    await aplicacao.prisma.user.update({
      where: { id: admin.userId },
      data: { role: Role.ADMIN },
    });
    operador = admin.api.semEscritorio();

    const c1 = randomUUID();
    const c2 = randomUUID();

    // 23h30 de 31/07 em Brasília: é julho, mesmo sendo agosto em UTC
    await consumo({
      officeId: a.officeId,
      task: AiTask.ATTENDANCE,
      custo: 100,
      em: '2026-08-01T02:30:00Z',
      chatId: c1,
    });
    await consumo({
      officeId: a.officeId,
      task: AiTask.ATTENDANCE,
      custo: 2,
      em: '2026-08-01T03:30:00Z',
      chatId: c1,
    });
    await consumo({
      officeId: a.officeId,
      task: AiTask.SUMMARY,
      custo: 0.5,
      em: '2026-08-15T12:00:00Z',
      chatId: c1,
    });
    await consumo({
      officeId: a.officeId,
      task: AiTask.ATTENDANCE,
      custo: 1.5,
      em: '2026-08-31T23:00:00Z',
      chatId: c2,
      modelo: 'gpt-5-mini',
      reserva: true,
    });
    // 23h59 de 31/08 em Brasília: ainda é agosto, mesmo sendo setembro em UTC
    await consumo({
      officeId: a.officeId,
      task: AiTask.EMBEDDING,
      custo: 1,
      em: '2026-09-01T02:59:00Z',
      modelo: 'text-embedding-3-small',
    });
    await consumo({
      officeId: a.officeId,
      task: AiTask.FACTS,
      custo: 0,
      em: '2026-08-10T12:00:00Z',
      modelo: 'modelo-sem-preco',
      semPreco: true,
    });

    await margem(20);
  });

  afterAll(async () => {
    await margem(0);
    await aplicacao.encerrar();
  });

  describe('o escritório', () => {
    it('vê o consumo do período no valor cobrado, já com a margem', async () => {
      const r = await a.api.get<RelatorioDoEscritorio>(`/ai-usage?${AGOSTO}`);

      expect(r.status).toBe(200);
      // custo 5,00 + 20%
      expect(r.corpo.total).toBeCloseTo(6, 4);
      // julho: os 100 das 23h30 de 31/07
      expect(r.corpo.totalAnterior).toBeCloseTo(120, 4);
      expect(r.corpo.variacaoPercentual).toBe(-95);
      expect(r.corpo.conversasAtendidas).toBe(2);
    });

    it('agrupa em atendimento, memória e busca', async () => {
      const r = await a.api.get<RelatorioDoEscritorio>(`/ai-usage?${AGOSTO}`);

      const porChave = Object.fromEntries(
        r.corpo.categorias.map((c) => [c.chave, c]),
      );

      expect(porChave.atendimento).toMatchObject({
        percentual: 70,
        chamadas: 2,
      });
      expect(porChave.atendimento?.valor).toBeCloseTo(4.2, 4);
      expect(porChave.memoria).toMatchObject({ percentual: 10, chamadas: 2 });
      expect(porChave.busca?.valor).toBeCloseTo(1.2, 4);
    });

    it('traz um valor por dia, no fuso de Brasília, com os dias vazios', async () => {
      const r = await a.api.get<RelatorioDoEscritorio>(`/ai-usage?${AGOSTO}`);
      const dia = (d: string) => r.corpo.porDia.find((x) => x.dia === d);

      expect(r.corpo.porDia).toHaveLength(31);
      expect(dia('2026-08-01')?.valor).toBeCloseTo(2.4, 4);
      expect(dia('2026-08-02')?.valor).toBe(0);
      // 20h e 23h59 de 31/08 em Brasília
      expect(dia('2026-08-31')?.valor).toBeCloseTo(3, 4);
    });

    it('não vê custo, margem nem modelos', async () => {
      // Custo e margem são do operador da plataforma
      const r = await a.api.get<Record<string, unknown>>(`/ai-usage?${AGOSTO}`);
      const texto = JSON.stringify(r.corpo);

      expect(r.corpo).not.toHaveProperty('margemPercentual');
      expect(r.corpo).not.toHaveProperty('porModelo');
      expect(texto).not.toContain('custo');
      expect(texto).not.toContain('deepseek');
    });

    it('não enxerga o consumo de outro escritório', async () => {
      const r = await b.api.get<RelatorioDoEscritorio>(`/ai-usage?${AGOSTO}`);

      expect(r.corpo.total).toBe(0);
      expect(r.corpo.conversasAtendidas).toBe(0);
    });

    it('recusa datas inválidas e período invertido', async () => {
      expect((await a.api.get('/ai-usage?from=01/08/2026')).status).toBe(400);
      expect(
        (await a.api.get('/ai-usage?from=2026-08-31&to=2026-08-01')).status,
      ).toBe(400);
      expect(
        (await a.api.get('/ai-usage?from=2024-01-01&to=2026-08-01')).status,
      ).toBe(400);
    });

    it('sem datas, é o mês corrente', async () => {
      const r = await a.api.get<{ periodo: { de: string } }>('/ai-usage');

      expect(r.status).toBe(200);
      expect(r.corpo.periodo.de).toMatch(/^\d{4}-\d{2}-01$/);
    });
  });

  describe('a administração da plataforma', () => {
    it('só o administrador acessa', async () => {
      expect((await a.api.get('/admin/ai-usage')).status).toBe(403);
      expect((await a.api.get('/admin/ai-billing')).status).toBe(403);
    });

    it('vê custo, margem e valor a cobrar de cada escritório', async () => {
      const r = await operador.get<{
        margemPercentual: number;
        escritorios: {
          officeId: string;
          nome: string;
          custo: number;
          cobrado: number;
          semPreco: boolean;
        }[];
      }>(`/admin/ai-usage?${AGOSTO}`);

      expect(r.status).toBe(200);
      expect(r.corpo.margemPercentual).toBe(20);

      const linha = r.corpo.escritorios.find((e) => e.officeId === a.officeId);
      expect(linha).toMatchObject({ nome: 'Escritório Consumidor' });
      expect(linha?.custo).toBeCloseTo(5, 4);
      expect(linha?.cobrado).toBeCloseTo(6, 4);
      // Há consumo de um modelo sem preço: o painel precisa avisar
      expect(linha?.semPreco).toBe(true);

      expect(r.corpo.escritorios.some((e) => e.officeId === b.officeId)).toBe(
        false,
      );
    });

    it('detalha o escritório por modelo e conta as chamadas da reserva', async () => {
      const r = await operador.get<DetalheDoAdmin>(
        `/admin/offices/${a.officeId}/ai-usage?${AGOSTO}`,
      );

      expect(r.status).toBe(200);
      expect(r.corpo.total.custo).toBeCloseTo(5, 4);
      expect(r.corpo.chamadasNaReserva).toBe(1);
      expect(
        r.corpo.porModelo.find((m) => m.modelo === 'modelo-sem-preco'),
      ).toMatchObject({ semPreco: true, chamadas: 1 });
    });

    it('escritório inexistente dá 404', async () => {
      const r = await operador.get(`/admin/offices/${randomUUID()}/ai-usage`);
      expect(r.status).toBe(404);
    });

    it('a margem vale para períodos passados: é o preço de venda', async () => {
      await margem(50);

      const r = await operador.get<DetalheDoAdmin>(
        `/admin/offices/${a.officeId}/ai-usage?${AGOSTO}`,
      );
      expect(r.corpo.total.cobrado).toBeCloseTo(7.5, 4);

      await margem(20);
    });

    it('cadastra, altera e remove o preço de um modelo', async () => {
      const salvo = await operador.put<{
        precos: { modelo: string; saidaUsdPorMilhao: number }[];
      }>('/admin/ai-prices/modelo-novo', {
        entradaUsdPorMilhao: 0.1,
        entradaEmCacheUsdPorMilhao: 0.01,
        saidaUsdPorMilhao: 0.4,
      });

      expect(salvo.status).toBe(200);
      expect(
        salvo.corpo.precos.find((p) => p.modelo === 'modelo-novo'),
      ).toMatchObject({ saidaUsdPorMilhao: 0.4 });

      const removido = await operador.delete<{ precos: { modelo: string }[] }>(
        '/admin/ai-prices/modelo-novo',
      );
      expect(
        removido.corpo.precos.some((p) => p.modelo === 'modelo-novo'),
      ).toBe(false);
    });

    it('recusa margem negativa e preço negativo', async () => {
      expect(
        (await operador.put('/admin/ai-billing', { margemPercentual: -1 }))
          .status,
      ).toBe(400);
      expect(
        (
          await operador.put('/admin/ai-prices/x', {
            entradaUsdPorMilhao: -1,
            entradaEmCacheUsdPorMilhao: 0,
            saidaUsdPorMilhao: 0,
          })
        ).status,
      ).toBe(400);
    });
  });
});
