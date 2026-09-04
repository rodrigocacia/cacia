import { describe, expect, it, vi } from 'vitest';
import { PromptService } from './prompt.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { RedisService } from '@/infra/redis/redis.service';

/**
 * O sistema anterior reconstruía um prompt de 1.264 linhas a cada mensagem,
 * disparando 7 consultas ao banco por interação. Quase todo esse conteúdo é
 * estático por escritório e muda no máximo uma vez por semana.
 */

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';

function montar(
  opcoes: { emCache?: string | null; redisFalha?: boolean } = {},
) {
  const get = opcoes.redisFalha
    ? vi.fn().mockRejectedValue(new Error('Redis fora do ar'))
    : vi.fn().mockResolvedValue(opcoes.emCache ?? null);

  const setex = opcoes.redisFalha
    ? vi.fn().mockRejectedValue(new Error('Redis fora do ar'))
    : vi.fn().mockResolvedValue('OK');

  const del = vi.fn().mockResolvedValue(1);

  const redis = { client: { get, setex, del } } as unknown as RedisService;

  const consultas = {
    office: vi.fn().mockResolvedValue({
      name: 'Escritório Alfa',
      tradeName: 'Alfa Advocacia',
      oabUf: 'SP',
    }),
    service: vi.fn().mockResolvedValue([
      {
        title: 'Revisão de aposentadoria',
        description: 'Análise e ação revisional',
        area: 'SOCIAL_SECURITY',
        valueType: 'PERSONAL',
        valueFixed: null,
        valueDetail: 'a combinar',
      },
    ]),
    question: vi
      .fn()
      .mockResolvedValue([{ title: 'Atendem online?', description: 'Sim.' }]),
    calendar: vi.fn().mockResolvedValue([]),
    consultation: vi.fn().mockResolvedValue(null),
  };

  const prisma = {
    office: { findUnique: consultas.office },
    service: { findMany: consultas.service },
    question: { findMany: consultas.question },
    calendar: { findMany: consultas.calendar },
    consultation: { findUnique: consultas.consultation },
  } as unknown as PrismaService;

  return {
    servico: new PromptService(prisma, redis),
    get,
    setex,
    del,
    consultas,
  };
}

function totalDeConsultas(consultas: Record<string, ReturnType<typeof vi.fn>>) {
  return Object.values(consultas).reduce(
    (soma, espiao) => soma + espiao.mock.calls.length,
    0,
  );
}

describe('PromptService', () => {
  describe('cache do bloco estático', () => {
    it('devolve do cache sem tocar no banco', async () => {
      // Era isto que faltava: 7 consultas por mensagem no sistema anterior
      const { servico, consultas } = montar({
        emCache: 'bloco já montado antes',
      });

      const bloco = await servico.blocoEstatico(ESCRITORIO);

      expect(bloco).toBe('bloco já montado antes');
      expect(totalDeConsultas(consultas)).toBe(0);
    });

    it('monta e grava no cache quando não há nada guardado', async () => {
      const { servico, setex, consultas } = montar({ emCache: null });

      const bloco = await servico.blocoEstatico(ESCRITORIO);

      expect(bloco).toContain('Alfa Advocacia');
      expect(totalDeConsultas(consultas)).toBe(5);

      const [chave, ttl] = setex.mock.calls[0] as [string, number, string];
      expect(chave).toBe(`prompt:estatico:${ESCRITORIO}`);
      expect(ttl).toBe(15 * 60);
    });

    it('monta normalmente quando o Redis está fora do ar', async () => {
      // Cache indisponível é lentidão, não erro: o atendimento continua
      const { servico } = montar({ redisFalha: true });

      const bloco = await servico.blocoEstatico(ESCRITORIO);

      expect(bloco).toContain('Alfa Advocacia');
    });

    it('invalida o cache do escritório', async () => {
      // Sem isso, alterar um serviço levaria até 15 minutos para aparecer
      const { servico, del } = montar({});

      await servico.invalidar(ESCRITORIO);

      expect(del).toHaveBeenCalledWith(`prompt:estatico:${ESCRITORIO}`);
    });
  });

  describe('conteúdo do bloco', () => {
    it('inclui serviços e perguntas frequentes', async () => {
      const { servico } = montar({ emCache: null });

      const bloco = await servico.blocoEstatico(ESCRITORIO);

      expect(bloco).toContain('Revisão de aposentadoria');
      expect(bloco).toContain('Atendem online?');
    });

    it('as consultas ao banco vão em paralelo', async () => {
      // Em série somariam a latência de cada uma
      const { servico, consultas } = montar({ emCache: null });

      await servico.blocoEstatico(ESCRITORIO);

      // Todas foram chamadas: se fossem sequenciais com await entre elas,
      // uma falha na primeira impediria as demais
      expect(consultas.office).toHaveBeenCalled();
      expect(consultas.service).toHaveBeenCalled();
      expect(consultas.question).toHaveBeenCalled();
      expect(consultas.calendar).toHaveBeenCalled();
      expect(consultas.consultation).toHaveBeenCalled();
    });
  });

  describe('bloco de comportamento', () => {
    it('inclui o nome e o tom do agente', () => {
      const { servico } = montar({});

      const bloco = servico.blocoDeComportamento({
        name: 'Marina',
        style: 'Empático e Acolhedor',
        greeting: 'Oi!',
      });

      expect(bloco).toContain('Marina');
      expect(bloco).toContain('Empático e Acolhedor');
    });

    it('proíbe inventar informação jurídica', () => {
      const { servico } = montar({});

      const bloco = servico.blocoDeComportamento({
        name: 'CacIA',
        style: 'Claro e Objetivo',
        greeting: 'Olá',
      });

      expect(bloco).toContain('Nunca invente');
      expect(bloco).toContain('Nunca prometa resultado');
    });
  });
});
