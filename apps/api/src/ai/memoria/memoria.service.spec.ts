import { describe, expect, it, vi } from 'vitest';
import { MemoriaService } from './memoria.service';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type { RedisService } from '@/infra/redis/redis.service';
import type { QdrantService } from '@/integrations/qdrant/qdrant.service';
import type { EmbeddingsService } from '../embeddings.service';

/**
 * O sintoma relatado: "a IA não consegue manter um bom atendimento por acúmulo
 * no contexto". A causa era o oposto do que parecia — não sobrava contexto,
 * faltava. As últimas 20 MENSAGENS eram guardadas, mas cada turno com
 * ferramentas gravava de 3 a 5 entradas, e a janela real virava 4 a 6 turnos.
 */

const ESCRITORIO = 'aaaaaaaa-0000-0000-0000-000000000001';
const CONVERSA = 'bbbbbbbb-0000-0000-0000-000000000001';

function montar(
  opcoes: {
    turnosNoRedis?: string[];
    resumo?: string | null;
    fatos?: { payload: { content: string } }[];
    redisFalha?: boolean;
    qdrantFalha?: boolean;
  } = {},
) {
  const lrange = opcoes.redisFalha
    ? vi.fn().mockRejectedValue(new Error('Redis fora do ar'))
    : vi.fn().mockResolvedValue(opcoes.turnosNoRedis ?? []);

  const exec = vi.fn().mockResolvedValue([]);
  const multi = vi.fn().mockReturnValue({
    rpush: vi.fn().mockReturnThis(),
    ltrim: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec,
  });

  const redis = {
    client: { lrange, multi, del: vi.fn() },
  } as unknown as RedisService;

  const prisma = {
    chat: {
      findFirst: vi.fn().mockResolvedValue({ summary: opcoes.resumo ?? null }),
      updateMany: vi.fn(),
    },
    mark: { updateMany: vi.fn() },
  } as unknown as PrismaService;

  const buscar = opcoes.qdrantFalha
    ? vi.fn().mockRejectedValue(new Error('Qdrant fora do ar'))
    : vi.fn().mockResolvedValue(opcoes.fatos ?? []);

  const qdrant = { buscar, inserir: vi.fn() } as unknown as QdrantService;

  const embeddings = {
    gerar: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  } as unknown as EmbeddingsService;

  return {
    servico: new MemoriaService(prisma, redis, qdrant, embeddings),
    lrange,
    multi,
    buscar,
  };
}

describe('MemoriaService', () => {
  describe('camada quente', () => {
    it('lê apenas os últimos turnos, não a conversa inteira', async () => {
      const { servico, lrange } = montar();

      await servico.montarContexto(ESCRITORIO, CONVERSA, 'olá');

      // lrange com índices negativos pega o fim da lista: 4 turnos = 8 entradas
      expect(lrange).toHaveBeenCalledWith(`memoria:quente:${CONVERSA}`, -8, -1);
    });

    it('grava com rpush e corta com ltrim, sem reescrever o bloco inteiro', async () => {
      // O sistema anterior lia o blob completo, concatenava e regravava tudo a
      // cada mensagem — custo proporcional ao tamanho do histórico
      const { servico, multi } = montar();

      await servico.registrarTurno(CONVERSA, {
        papel: 'user',
        conteudo: 'bom dia',
      });

      expect(multi).toHaveBeenCalledOnce();
      const encadeamento = multi.mock.results[0]?.value as {
        rpush: ReturnType<typeof vi.fn>;
        ltrim: ReturnType<typeof vi.fn>;
        expire: ReturnType<typeof vi.fn>;
      };
      expect(encadeamento.rpush).toHaveBeenCalled();
      expect(encadeamento.ltrim).toHaveBeenCalledWith(
        `memoria:quente:${CONVERSA}`,
        -8,
        -1,
      );
      expect(encadeamento.expire).toHaveBeenCalled();
    });
  });

  describe('camada fria', () => {
    it('filtra a busca pelo escritório', async () => {
      // Sem isso, a busca por similaridade devolveria fatos de outro escritório
      const { servico, buscar } = montar();

      await servico.montarContexto(
        ESCRITORIO,
        CONVERSA,
        'quando é a audiência',
      );

      const [, filtro] = buscar.mock.calls[0] as [
        number[],
        { officeId: string; kind: string; chatId: string },
      ];
      expect(filtro.officeId).toBe(ESCRITORIO);
      expect(filtro.kind).toBe('memory_fact');
    });

    it('traz poucos fatos, os mais relevantes', async () => {
      // Um cliente com cinquenta anotações não pode despejar as cinquenta
      const { servico, buscar } = montar();

      await servico.montarContexto(ESCRITORIO, CONVERSA, 'meu processo');

      const [, , limite] = buscar.mock.calls[0] as [unknown, unknown, number];
      expect(limite).toBe(3);
    });

    it('não busca quando a mensagem é curta demais para ter sentido', async () => {
      const { servico, buscar } = montar();

      await servico.montarContexto(ESCRITORIO, CONVERSA, 'ok');

      expect(buscar).not.toHaveBeenCalled();
    });
  });

  describe('degradação', () => {
    it('responde mesmo com o Redis fora do ar', async () => {
      const { servico } = montar({ redisFalha: true, resumo: 'resumo aqui' });

      const contexto = await servico.montarContexto(
        ESCRITORIO,
        CONVERSA,
        'e o meu caso?',
      );

      expect(contexto.recentes).toEqual([]);
      expect(contexto.resumo).toBe('resumo aqui');
    });

    it('responde mesmo com o Qdrant fora do ar', async () => {
      const { servico } = montar({
        qdrantFalha: true,
        turnosNoRedis: [JSON.stringify({ papel: 'user', conteudo: 'oi' })],
      });

      const contexto = await servico.montarContexto(
        ESCRITORIO,
        CONVERSA,
        'e o meu caso?',
      );

      expect(contexto.fatos).toEqual([]);
      expect(contexto.recentes).toHaveLength(1);
    });
  });

  describe('orçamento de contexto', () => {
    it('o tamanho não cresce com a duração da conversa', async () => {
      // Este é o ponto central: uma conversa de 200 mensagens ocupa o mesmo
      // espaço que uma de 10, porque a camada quente é fixa e o resto é resumo
      const quatroTurnos = Array.from({ length: 8 }, (_, i) =>
        JSON.stringify({
          papel: i % 2 === 0 ? 'user' : 'assistant',
          conteudo: `mensagem ${i}`,
        }),
      );

      const { servico } = montar({
        turnosNoRedis: quatroTurnos,
        resumo: 'Cliente busca revisão de aposentadoria.',
        fatos: [
          { payload: { content: 'Prefere ser chamada de Dra. Marina' } },
          { payload: { content: 'Só atende depois das 18h' } },
        ],
      });

      const contexto = await servico.montarContexto(
        ESCRITORIO,
        CONVERSA,
        'alguma novidade?',
      );

      expect(contexto.recentes).toHaveLength(8);
      expect(contexto.fatos).toHaveLength(2);

      const texto = servico.formatarParaPrompt(contexto);
      // Ordem de grandeza: centenas de caracteres, não milhares
      expect(texto.length).toBeLessThan(600);
    });

    it('inclui fatos e resumo no texto do prompt', async () => {
      const { servico } = montar({
        resumo: 'Discussão sobre prazo recursal.',
        fatos: [{ payload: { content: 'Prefere contato por áudio' } }],
      });

      const contexto = await servico.montarContexto(
        ESCRITORIO,
        CONVERSA,
        'e agora?',
      );
      const texto = servico.formatarParaPrompt(contexto);

      expect(texto).toContain('Prefere contato por áudio');
      expect(texto).toContain('Discussão sobre prazo recursal.');
    });

    it('devolve texto vazio quando não há memória nenhuma', async () => {
      const { servico } = montar({ resumo: null, fatos: [] });

      const contexto = await servico.montarContexto(
        ESCRITORIO,
        CONVERSA,
        'primeira mensagem',
      );

      expect(servico.formatarParaPrompt(contexto)).toBe('');
    });
  });
});
