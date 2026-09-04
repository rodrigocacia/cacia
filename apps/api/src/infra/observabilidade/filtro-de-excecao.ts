import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Sentry } from './sentry';

/**
 * Trata as exceções que chegam ao topo.
 *
 * Duas responsabilidades: registrar no Sentry o que é falha de verdade, e
 * garantir que erro inesperado não vaze detalhe interno para o cliente.
 */
@Catch()
export class FiltroDeExcecao implements ExceptionFilter {
  private readonly logger = new Logger('Excecao');

  catch(excecao: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const resposta = contexto.getResponse<Response>();
    const requisicao = contexto.getRequest<Request>();

    const status =
      excecao instanceof HttpException
        ? excecao.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 4xx é uso incorreto da API, não defeito: registrar tudo transformaria o
    // Sentry em log de acesso e esconderia o que importa.
    if (status >= 500) {
      Sentry.captureException(excecao, {
        tags: { rota: requisicao.url, metodo: requisicao.method },
      });

      this.logger.error(
        `${requisicao.method} ${requisicao.url} -> ${status}`,
        excecao instanceof Error ? excecao.stack : String(excecao),
      );
    }

    const corpo =
      excecao instanceof HttpException
        ? excecao.getResponse()
        : {
            statusCode: status,
            // Mensagem genérica: a real pode conter nome de tabela, caminho de
            // arquivo ou trecho de consulta.
            message: 'Erro interno. A equipe foi notificada.',
          };

    resposta.status(status).json(corpo);
  }
}
