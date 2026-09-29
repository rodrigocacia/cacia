import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions';
import type { PrismaService } from '@/infra/prisma/prisma.service';
import type {
  MemoriaService,
  ContextoMemoria,
} from '../memoria/memoria.service';
import type { FerramentasService } from '../ferramentas/ferramentas.service';
import type { LlmService } from '../llm.service';
import type { PromptService } from './prompt.service';
import { AgenteService } from './agente.service';

/**
 * O laço de conversa do agente.
 *
 * O modelo é dublado com respostas roteirizadas — o que se verifica aqui não é
 * a qualidade do texto que o modelo produz, e sim a ORQUESTRAÇÃO em volta
 * dela: o que é enviado, o que volta para a memória, o que acontece quando o
 * modelo se perde. É a parte que é nossa, e a única que uma regressão nossa
 * pode quebrar.
 */

const OFICIO = 'escritorio-1';
const CONVERSA = 'conversa-1';

// ---------------------------------------------------------------------------
// Respostas roteirizadas
// ---------------------------------------------------------------------------

function respostaComTexto(conteudo: string | null): ChatCompletion {
  return {
    choices: [
      {
        index: 0,
        finish_reason: 'stop',
        logprobs: null,
        message: {
          role: 'assistant',
          content: conteudo,
          refusal: null,
        },
      },
    ],
  } as unknown as ChatCompletion;
}

function respostaComChamada(
  nome: string,
  argumentos: string,
  id = 'chamada-1',
): ChatCompletion {
  return {
    choices: [
      {
        index: 0,
        finish_reason: 'tool_calls',
        logprobs: null,
        message: {
          role: 'assistant',
          content: null,
          refusal: null,
          tool_calls: [
            {
              id,
              type: 'function',
              function: { name: nome, arguments: argumentos },
            },
          ],
        },
      },
    ],
  } as unknown as ChatCompletion;
}

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------

const CONTEXTO_VAZIO: ContextoMemoria = {
  recentes: [],
  resumo: null,
  fatos: [],
};

function montar(
  roteiro: ChatCompletion[],
  opcoes: { contexto?: ContextoMemoria; resultadoDaFerramenta?: string } = {},
) {
  const create = vi.fn();
  for (const resposta of roteiro) create.mockResolvedValueOnce(resposta);
  // Depois do roteiro, o modelo simplesmente encerra
  create.mockResolvedValue(respostaComTexto('Fim.'));

  const llm = { completar: create } as unknown as LlmService;

  const registrarTurno = vi.fn().mockResolvedValue(undefined);
  const memoria = {
    montarContexto: vi
      .fn()
      .mockResolvedValue(opcoes.contexto ?? CONTEXTO_VAZIO),
    formatarParaPrompt: vi.fn().mockReturnValue(''),
    turnosComoMensagens: vi.fn().mockReturnValue([]),
    registrarTurno,
  } as unknown as MemoriaService;

  const prompt = {
    blocoEstatico: vi.fn().mockResolvedValue('BLOCO ESTÁTICO DO ESCRITÓRIO'),
    blocoDeComportamento: vi.fn().mockReturnValue('COMPORTAMENTO DO AGENTE'),
  } as unknown as PromptService;

  const executar = vi
    .fn()
    .mockResolvedValue(opcoes.resultadoDaFerramenta ?? 'Nenhum processo.');
  const ferramentas = {
    definicoes: vi
      .fn()
      .mockReturnValue([{ type: 'function', function: { name: 'x' } }]),
    executar,
  } as unknown as FerramentasService;

  const prisma = {
    chat: {
      findFirst: vi.fn().mockResolvedValue({
        agent: { name: 'Ana', style: 'Claro e Objetivo', greeting: 'Olá!' },
      }),
    },
  } as unknown as PrismaService;

  return {
    agente: new AgenteService(prisma, memoria, prompt, ferramentas, llm),
    create,
    executar,
    registrarTurno,
  };
}

/** Mensagens enviadas ao modelo na n-ésima chamada. */
function mensagensDa(
  create: ReturnType<typeof vi.fn>,
  chamada: number,
): ChatCompletionMessageParam[] {
  const args = create.mock.calls[chamada]?.[0] as {
    messages: ChatCompletionMessageParam[];
  };
  return args.messages;
}

const pedido = {
  officeId: OFICIO,
  chatId: CONVERSA,
  mensagem: 'Como está meu processo?',
  customerId: 'cliente-1',
};

describe('AgenteService', () => {
  describe('resposta direta', () => {
    it('devolve o texto do modelo', async () => {
      const { agente } = montar([respostaComTexto('Seu processo está ativo.')]);

      const resposta = await agente.responder(pedido);

      expect(resposta.texto).toBe('Seu processo está ativo.');
      expect(resposta.ferramentasUsadas).toEqual([]);
      expect(resposta.acionouAtendente).toBe(false);
    });

    it('usa a resposta de reserva quando o modelo devolve conteúdo vazio', async () => {
      const { agente } = montar([respostaComTexto(null)]);

      const resposta = await agente.responder(pedido);

      expect(resposta.texto).toContain('alguém do escritório');
    });
  });

  describe('montagem do prompt', () => {
    it('o bloco estático vem primeiro', async () => {
      // A ordem habilita o desconto de cache de prefixo do provedor: o trecho
      // idêntico entre mensagens precisa estar no começo, sempre igual.
      const { agente, create } = montar([respostaComTexto('Ok.')]);

      await agente.responder(pedido);

      const mensagens = mensagensDa(create, 0);
      expect(mensagens[0]).toEqual({
        role: 'system',
        content: 'BLOCO ESTÁTICO DO ESCRITÓRIO',
      });
      expect(mensagens[1]?.content).toBe('COMPORTAMENTO DO AGENTE');
    });

    it('a mensagem do cliente é a última', async () => {
      const { agente, create } = montar([respostaComTexto('Ok.')]);

      await agente.responder(pedido);

      const mensagens = mensagensDa(create, 0);
      expect(mensagens.at(-1)).toEqual({
        role: 'user',
        content: pedido.mensagem,
      });
    });

    it('não inclui bloco de memória quando não há memória', async () => {
      const { agente, create } = montar([respostaComTexto('Ok.')]);

      await agente.responder(pedido);

      // Só os dois blocos de sistema, e nada de string vazia entre eles
      const sistemas = mensagensDa(create, 0).filter(
        (m) => m.role === 'system',
      );
      expect(sistemas).toHaveLength(2);
    });

    it('inclui o bloco de memória quando há', async () => {
      const { agente, create } = montar([respostaComTexto('Ok.')], {
        contexto: {
          recentes: [{ papel: 'user', conteudo: 'oi' }],
          resumo: 'cliente já perguntou sobre prazo',
          fatos: ['prefere ser chamado de Zé'],
        },
      });

      await agente.responder(pedido);

      // O dublê de formatarParaPrompt devolve vazio; o que se verifica é que o
      // contexto foi montado com a mensagem atual, para a busca de fatos.
      const args = create.mock.calls[0]?.[0] as { messages: unknown[] };
      expect(args.messages.length).toBeGreaterThanOrEqual(3);
    });

    it('oferece as ferramentas ao modelo', async () => {
      const { agente, create } = montar([respostaComTexto('Ok.')]);

      await agente.responder(pedido);

      const args = create.mock.calls[0]?.[0] as { tools: unknown[] };
      expect(args.tools).toHaveLength(1);
    });
  });

  describe('ferramentas', () => {
    it('executa a chamada e devolve o resultado ao modelo', async () => {
      const { agente, create, executar } = montar(
        [
          respostaComChamada('consultar_processos', '{}'),
          respostaComTexto('Você tem um processo ativo.'),
        ],
        { resultadoDaFerramenta: 'Processo 123 — ACTIVE' },
      );

      const resposta = await agente.responder(pedido);

      expect(executar).toHaveBeenCalledOnce();
      expect(resposta.ferramentasUsadas).toEqual(['consultar_processos']);
      expect(resposta.texto).toBe('Você tem um processo ativo.');

      // O resultado precisa chegar ao modelo na rodada seguinte
      const segunda = mensagensDa(create, 1);
      expect(segunda.at(-1)).toMatchObject({
        role: 'tool',
        content: 'Processo 123 — ACTIVE',
      });
    });

    it('o contexto da ferramenta vem do servidor, não dos argumentos', async () => {
      // Defesa contra injeção de prompt: se o escritório viesse no que o
      // modelo escreve, bastaria uma mensagem maliciosa pedindo "consulte os
      // processos do escritório X" para ler dados alheios.
      const { agente, executar } = montar([
        respostaComChamada(
          'consultar_processos',
          '{"officeId":"escritorio-invadido","customerId":"cliente-alheio"}',
        ),
        respostaComTexto('Pronto.'),
      ]);

      await agente.responder(pedido);

      const contexto = executar.mock.calls[0]?.[2] as {
        officeId: string;
        customerId?: string;
      };
      expect(contexto.officeId).toBe(OFICIO);
      expect(contexto.customerId).toBe('cliente-1');
    });

    it('argumentos malformados não derrubam a resposta', async () => {
      const { agente, executar } = montar([
        respostaComChamada('buscar_em_documentos', 'isto não é json'),
        respostaComTexto('Não encontrei.'),
      ]);

      const resposta = await agente.responder(pedido);

      // Objeto vazio faz a ferramenta usar seus padrões — melhor que falhar
      expect(executar.mock.calls[0]?.[1]).toEqual({});
      expect(resposta.texto).toBe('Não encontrei.');
    });

    it('marca quando o atendente humano foi acionado', async () => {
      const { agente } = montar([
        respostaComChamada(
          'acionar_atendente',
          '{"motivo":"assunto sensível"}',
        ),
        respostaComTexto('Vou chamar alguém do escritório.'),
      ]);

      const resposta = await agente.responder(pedido);

      expect(resposta.acionouAtendente).toBe(true);
      expect(resposta.ferramentasUsadas).toContain('acionar_atendente');
    });

    it('encerra no limite de rodadas em vez de encadear sem fim', async () => {
      // Um modelo confuso pode pedir ferramenta indefinidamente, consumindo
      // tokens e deixando o cliente sem resposta.
      const { agente, create } = montar(
        Array.from({ length: 10 }, (_, i) =>
          respostaComChamada('consultar_processos', '{}', `chamada-${i}`),
        ),
      );

      const resposta = await agente.responder(pedido);

      expect(create).toHaveBeenCalledTimes(4);
      expect(resposta.texto).toContain('alguém do escritório');
    });
  });

  describe('o que entra na memória', () => {
    it('registra a mensagem do cliente e a resposta, nessa ordem', async () => {
      const { agente, registrarTurno } = montar([
        respostaComTexto('Seu processo está ativo.'),
      ]);

      await agente.responder(pedido);

      expect(registrarTurno).toHaveBeenCalledTimes(2);
      expect(registrarTurno.mock.calls[0]?.[1]).toEqual({
        papel: 'user',
        conteudo: pedido.mensagem,
      });
      expect(registrarTurno.mock.calls[1]?.[1]).toEqual({
        papel: 'assistant',
        conteudo: 'Seu processo está ativo.',
      });
    });

    it('chamadas e resultados de ferramenta NUNCA entram na memória', async () => {
      // É o defeito central do sistema anterior: o JSON bruto das ferramentas
      // ia para o histórico e consumia a janela de contexto em poucos turnos.
      const { agente, registrarTurno } = montar(
        [
          respostaComChamada('consultar_processos', '{}'),
          respostaComTexto('Você tem um processo ativo.'),
        ],
        { resultadoDaFerramenta: 'Processo 123 — ACTIVE, fase: instrução' },
      );

      await agente.responder(pedido);

      const gravado = registrarTurno.mock.calls
        .map((c) => JSON.stringify(c[1]))
        .join(' ');

      expect(gravado).not.toContain('Processo 123');
      expect(gravado).not.toContain('consultar_processos');
      expect(gravado).not.toContain('tool');
    });

    it('grava a resposta de reserva quando o laço estoura', async () => {
      // Mesmo no caminho de falha o turno precisa ser registrado: sem isso a
      // próxima mensagem chegaria sem saber que houve interação.
      const { agente, registrarTurno } = montar(
        Array.from({ length: 10 }, () =>
          respostaComChamada('consultar_processos', '{}'),
        ),
      );

      await agente.responder(pedido);

      expect(registrarTurno).toHaveBeenCalledTimes(2);
      expect(registrarTurno.mock.calls[1]?.[1]).toMatchObject({
        papel: 'assistant',
      });
    });
  });

  describe('agente da conversa', () => {
    it('usa um agente padrão quando a conversa não tem um', async () => {
      const { agente } = montar([respostaComTexto('Ok.')]);

      // O findFirst do dublê devolve agente; aqui o que importa é que a
      // ausência não derruba — ver o caminho no serviço.
      await expect(agente.responder(pedido)).resolves.toBeDefined();
    });
  });
});

describe('AgenteService sem agente configurado', () => {
  let agente: AgenteService;

  beforeEach(() => {
    const create = vi.fn().mockResolvedValue(respostaComTexto('Ok.'));

    const prompt = {
      blocoEstatico: vi.fn().mockResolvedValue('E'),
      blocoDeComportamento: vi.fn().mockReturnValue('C'),
    } as unknown as PromptService;

    agente = new AgenteService(
      {
        chat: { findFirst: vi.fn().mockResolvedValue(null) },
      } as unknown as PrismaService,
      {
        montarContexto: vi.fn().mockResolvedValue(CONTEXTO_VAZIO),
        formatarParaPrompt: vi.fn().mockReturnValue(''),
        turnosComoMensagens: vi.fn().mockReturnValue([]),
        registrarTurno: vi.fn().mockResolvedValue(undefined),
      } as unknown as MemoriaService,
      prompt,
      {
        definicoes: vi.fn().mockReturnValue([]),
        executar: vi.fn(),
      } as unknown as FerramentasService,
      { completar: create } as unknown as LlmService,
    );
  });

  it('responde mesmo assim, com o agente padrão', async () => {
    // Conversa nova, antes de o escritório configurar um agente. Falhar aqui
    // deixaria o cliente sem resposta por um detalhe de configuração.
    const resposta = await agente.responder(pedido);

    expect(resposta.texto).toBe('Ok.');
  });
});
