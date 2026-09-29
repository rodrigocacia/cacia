import { Injectable, Logger } from '@nestjs/common';
import { AiTask } from '@cacia/database';
import { PrismaService } from '@/infra/prisma/prisma.service';

/** A quem a chamada é cobrada. Toda chamada de IA precisa de um dono. */
export interface UsoDeIa {
  officeId: string;
  chatId?: string;
}

export interface ChamadaRegistrada extends UsoDeIa {
  tarefa: AiTask;
  provedor: string;
  modelo: string;
  reserva?: boolean;
  tokensEntrada: number;
  tokensEmCache?: number;
  tokensSaida?: number;
}

interface Preco {
  entrada: number;
  emCache: number;
  saida: number;
}

interface Tabela {
  precos: Map<string, Preco>;
  cambio: number;
  lidaEm: number;
}

/** Preço e câmbio mudam raramente; reler a cada chamada seria desperdício. */
const VALIDADE_DA_TABELA_MS = 60_000;

const POR_MILHAO = 1_000_000;

/**
 * Registra o consumo de cada chamada de IA, com o custo já calculado.
 *
 * É a base da cobrança do escritório pelo uso da IA. O custo é gravado no
 * momento da chamada, com o preço e o câmbio vigentes: alterar a tabela
 * depois não muda o que já foi consumido.
 *
 * Nunca lança: falhar ao registrar o consumo não pode tirar a resposta do
 * cliente no WhatsApp. A falha fica no log.
 */
@Injectable()
export class ConsumoDeIaService {
  private readonly logger = new Logger(ConsumoDeIaService.name);
  private tabela: Tabela | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async registrar(chamada: ChamadaRegistrada): Promise<void> {
    try {
      const { precos, cambio } = await this.lerTabela();
      const preco = this.precoDe(precos, chamada.modelo);

      const emCache = Math.min(
        chamada.tokensEmCache ?? 0,
        chamada.tokensEntrada,
      );
      const saida = chamada.tokensSaida ?? 0;

      const custoUsd = preco
        ? ((chamada.tokensEntrada - emCache) * preco.entrada +
            emCache * preco.emCache +
            saida * preco.saida) /
          POR_MILHAO
        : 0;

      if (!preco) {
        this.logger.warn(
          `Modelo sem preço cadastrado: ${chamada.modelo}. Consumo gravado com custo zero`,
        );
      }

      await this.prisma.aiUsage.create({
        data: {
          officeId: chamada.officeId,
          chatId: chamada.chatId,
          task: chamada.tarefa,
          provider: chamada.provedor,
          model: chamada.modelo,
          fallback: chamada.reserva ?? false,
          inputTokens: chamada.tokensEntrada,
          cachedInputTokens: emCache,
          outputTokens: saida,
          costUsd: custoUsd,
          costBrl: custoUsd * cambio,
          priced: Boolean(preco),
        },
      });
    } catch (erro) {
      this.logger.error(
        `Não foi possível registrar o consumo de IA do escritório ${chamada.officeId}: ${
          erro instanceof Error ? erro.message : 'erro'
        }`,
      );
    }
  }

  /** Chamado quando o painel altera preço ou câmbio. */
  esquecerTabela(): void {
    this.tabela = null;
  }

  /**
   * O provedor às vezes devolve o nome com data (`gpt-5-mini-2025-08-07`);
   * o registro usa o nome pedido, mas a busca tolera o sufixo.
   */
  private precoDe(precos: Map<string, Preco>, modelo: string): Preco | null {
    const exato = precos.get(modelo);
    if (exato) return exato;

    for (const [nome, preco] of precos) {
      if (modelo.startsWith(`${nome}-`)) return preco;
    }

    return null;
  }

  private async lerTabela(): Promise<Tabela> {
    if (
      this.tabela &&
      Date.now() - this.tabela.lidaEm < VALIDADE_DA_TABELA_MS
    ) {
      return this.tabela;
    }

    const [linhas, ajustes] = await Promise.all([
      this.prisma.aiModelPrice.findMany(),
      this.prisma.aiBillingSettings.findUnique({ where: { id: 1 } }),
    ]);

    this.tabela = {
      precos: new Map(
        linhas.map((l) => [
          l.model,
          {
            entrada: Number(l.inputUsdPerMillion),
            emCache: Number(l.cachedInputUsdPerMillion),
            saida: Number(l.outputUsdPerMillion),
          },
        ]),
      ),
      cambio: ajustes ? Number(ajustes.usdToBrl) : 5.5,
      lidaEm: Date.now(),
    };

    return this.tabela;
  }
}
