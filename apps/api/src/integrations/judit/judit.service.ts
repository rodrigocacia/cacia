import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RespostaConsulta {
  request_id: string;
  status: string;
}

export interface RespostaMonitoramento {
  tracking_id: string;
  status: string;
}

/**
 * Judit — dados processuais.
 *
 * Duas operações distintas, e a diferença entre elas é o achado do
 * diagnóstico:
 *
 *   /requests  consulta PONTUAL. Devolve o estado do processo uma vez e
 *              encerra. Era a única usada.
 *
 *   /tracking  MONITORAMENTO contínuo. A Judit passa a avisar por webhook a
 *              cada movimentação, sem precisar perguntar de novo.
 *
 * O sistema anterior chamava /requests no cadastro do processo e nunca mais.
 * Movimentações posteriores simplesmente não chegavam: o produto virava um
 * cadastro de processos, quando deveria ser um acompanhamento.
 */
@Injectable()
export class JuditService {
  private readonly logger = new Logger(JuditService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly config: ConfigService) {
    this.apiUrl =
      this.config.get<string>('JUDIT_API_URL') ??
      'https://requests.prod.judit.io';
    this.apiKey = this.config.get<string>('JUDIT_API_KEY') ?? '';

    if (!this.apiKey) {
      this.logger.warn('JUDIT_API_KEY ausente — consulta processual inativa');
    }
  }

  estaConfigurado(): boolean {
    return this.apiKey !== '';
  }

  /** Consulta pontual: o estado do processo agora. */
  consultar(
    numeroProcesso: string,
    urlCallback: string,
  ): Promise<RespostaConsulta> {
    return this.chamar<RespostaConsulta>('POST', '/requests', {
      search: { search_type: 'lawsuit_cnj', search_key: numeroProcesso },
      callback_url: urlCallback,
      with_attachments: true,
    });
  }

  /**
   * Registra monitoramento contínuo.
   *
   * A partir daqui a Judit avisa a cada movimentação, sem nova pergunta. É o
   * que transforma o cadastro em acompanhamento.
   */
  monitorar(
    numeroProcesso: string,
    urlCallback: string,
  ): Promise<RespostaMonitoramento> {
    return this.chamar<RespostaMonitoramento>('POST', '/tracking', {
      recurrence: 1, // verificação diária
      search: { search_type: 'lawsuit_cnj', search_key: numeroProcesso },
      callback_url: urlCallback,
    });
  }

  /** Encerra o monitoramento — usado quando o processo é excluído. */
  async pararMonitoramento(trackingId: string): Promise<void> {
    await this.chamar('DELETE', `/tracking/${trackingId}`);
  }

  /** Busca todos os processos de um advogado pelo número da OAB. */
  buscarPorOab(
    numeroOab: string,
    uf: string,
    urlCallback: string,
  ): Promise<RespostaConsulta> {
    return this.chamar<RespostaConsulta>('POST', '/requests', {
      search: {
        search_type: 'oab',
        search_key: `${numeroOab}${uf.toUpperCase()}`,
      },
      callback_url: urlCallback,
    });
  }

  private async chamar<T>(
    metodo: string,
    caminho: string,
    corpo?: unknown,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new HttpException('Judit não está configurada', 503);
    }

    const resposta = await fetch(`${this.apiUrl}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', 'api-key': this.apiKey },
      ...(corpo !== undefined && { body: JSON.stringify(corpo) }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => '');
      this.logger.error(
        `Judit ${metodo} ${caminho} -> ${resposta.status} ${detalhe}`,
      );
      throw new HttpException(
        `Erro na API da Judit: ${resposta.statusText}`,
        resposta.status,
      );
    }

    if (resposta.status === 204) return undefined as T;

    return (await resposta.json()) as T;
  }
}
