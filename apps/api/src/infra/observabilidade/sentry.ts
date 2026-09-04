import * as Sentry from '@sentry/node';

/**
 * Rastreamento de erros.
 *
 * Inicializado antes de qualquer import da aplicação, porque o Sentry precisa
 * instrumentar os módulos ao serem carregados. Chamado no topo de main.ts e
 * worker.ts, não por injeção de dependência.
 *
 * Sem DSN configurado a função não faz nada — desenvolvimento local não precisa
 * enviar erro para lugar nenhum.
 */
export function iniciarSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    // Amostragem: rastrear 100% das requisições encareceria sem acrescentar
    // informação — o padrão de erro aparece bem antes disso.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

    beforeSend(evento) {
      return removerDadosSensiveis(evento);
    },
  });
}

const CAMPOS_SENSIVEIS = [
  'password',
  'token',
  'authorization',
  'apiKey',
  'api_key',
  'secret',
  'x-api-key',
  'x-webhook-token',
];

/**
 * Remove credenciais antes de enviar.
 *
 * Sem isso, uma requisição de login com falha mandaria a senha em texto puro
 * para um serviço externo. Também limpa o corpo inteiro dos webhooks: eles
 * carregam mensagens de clientes, que são sigilosas.
 */
function removerDadosSensiveis(
  evento: Sentry.ErrorEvent,
): Sentry.ErrorEvent | null {
  if (evento.request?.headers) {
    for (const chave of Object.keys(evento.request.headers)) {
      if (CAMPOS_SENSIVEIS.includes(chave.toLowerCase())) {
        evento.request.headers[chave] = '[removido]';
      }
    }
  }

  if (evento.request?.data) {
    evento.request.data = limpar(evento.request.data);
  }

  // Mensagens de clientes nunca saem daqui
  if (evento.request?.url?.includes('/webhooks/')) {
    evento.request.data = '[corpo de webhook removido]';
  }

  return evento;
}

function limpar(valor: unknown): unknown {
  if (typeof valor !== 'object' || valor === null) return valor;

  if (Array.isArray(valor)) return valor.map(limpar);

  const saida: Record<string, unknown> = {};

  for (const [chave, conteudo] of Object.entries(valor)) {
    saida[chave] = CAMPOS_SENSIVEIS.includes(chave.toLowerCase())
      ? '[removido]'
      : limpar(conteudo);
  }

  return saida;
}

export { Sentry };
