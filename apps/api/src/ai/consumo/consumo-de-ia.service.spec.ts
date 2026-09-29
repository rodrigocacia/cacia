import { describe, expect, it, vi } from 'vitest';
import { AiTask, Prisma } from '@cacia/database';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import {
  ConsumoDeIaService,
  type ChamadaRegistrada,
} from './consumo-de-ia.service';

const PRECOS = [
  {
    model: 'deepseek-chat',
    inputUsdPerMillion: new Prisma.Decimal(0.28),
    cachedInputUsdPerMillion: new Prisma.Decimal(0.028),
    outputUsdPerMillion: new Prisma.Decimal(0.42),
  },
  {
    model: 'gpt-5-mini',
    inputUsdPerMillion: new Prisma.Decimal(0.25),
    cachedInputUsdPerMillion: new Prisma.Decimal(0.025),
    outputUsdPerMillion: new Prisma.Decimal(2),
  },
];

function montar(opcoes: { gravacaoFalha?: boolean } = {}) {
  const create = opcoes.gravacaoFalha
    ? vi.fn().mockRejectedValue(new Error('banco fora do ar'))
    : vi.fn().mockResolvedValue({});
  const findMany = vi.fn().mockResolvedValue(PRECOS);

  const prisma = {
    aiUsage: { create },
    aiModelPrice: { findMany },
    aiBillingSettings: {
      findUnique: vi
        .fn()
        .mockResolvedValue({ usdToBrl: new Prisma.Decimal(5) }),
    },
  } as unknown as PrismaService;

  return { servico: new ConsumoDeIaService(prisma), create, findMany };
}

const CHAMADA: ChamadaRegistrada = {
  officeId: 'escritorio-1',
  chatId: 'conversa-1',
  tarefa: AiTask.ATTENDANCE,
  provedor: 'deepseek',
  modelo: 'deepseek-chat',
  tokensEntrada: 1_000_000,
  tokensEmCache: 0,
  tokensSaida: 1_000_000,
};

function gravado(create: ReturnType<typeof vi.fn>) {
  return (create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
}

describe('ConsumoDeIaService', () => {
  it('calcula o custo em dólar e converte em reais no momento da chamada', async () => {
    const { servico, create } = montar();

    await servico.registrar(CHAMADA);

    const dados = gravado(create);
    // 1M de entrada a 0,28 + 1M de saída a 0,42
    expect(dados.costUsd).toBeCloseTo(0.7, 10);
    expect(dados.costBrl).toBeCloseTo(3.5, 10);
    expect(dados.priced).toBe(true);
  });

  it('cobra a parte em cache pelo preço de cache', async () => {
    const { servico, create } = montar();

    await servico.registrar({
      ...CHAMADA,
      tokensEntrada: 1_000_000,
      tokensEmCache: 800_000,
      tokensSaida: 0,
    });

    // 200 mil a 0,28 + 800 mil a 0,028
    expect(gravado(create).costUsd).toBeCloseTo(0.056 + 0.0224, 10);
  });

  it('cache nunca maior que a entrada', async () => {
    const { servico, create } = montar();

    await servico.registrar({
      ...CHAMADA,
      tokensEntrada: 100,
      tokensEmCache: 500,
      tokensSaida: 0,
    });

    expect(gravado(create).cachedInputTokens).toBe(100);
  });

  it('reconhece o nome com data que o provedor devolve', async () => {
    const { servico, create } = montar();

    await servico.registrar({ ...CHAMADA, modelo: 'gpt-5-mini-2025-08-07' });

    expect(gravado(create).priced).toBe(true);
  });

  it('modelo sem preço é gravado com custo zero e marcado', async () => {
    // O painel avisa, para o consumo não ficar sem cobrança por engano
    const { servico, create } = montar();

    await servico.registrar({ ...CHAMADA, modelo: 'modelo-novo' });

    expect(gravado(create)).toMatchObject({
      costUsd: 0,
      costBrl: 0,
      priced: false,
    });
  });

  it('falha ao gravar não chega a quem chamou', async () => {
    // A resposta ao cliente no WhatsApp vale mais que o registro
    const { servico } = montar({ gravacaoFalha: true });

    await expect(servico.registrar(CHAMADA)).resolves.toBeUndefined();
  });

  it('lê a tabela de preços uma vez e reaproveita', async () => {
    const { servico, findMany } = montar();

    await servico.registrar(CHAMADA);
    await servico.registrar(CHAMADA);

    expect(findMany).toHaveBeenCalledOnce();

    servico.esquecerTabela();
    await servico.registrar(CHAMADA);

    expect(findMany).toHaveBeenCalledTimes(2);
  });
});
