/**
 * Texto legível a partir do corpo de erro da API.
 *
 * O `ValidationPipe` devolve `message` como LISTA quando mais de um campo
 * falha. Repassar a lista direto ao Toast mostrava as mensagens coladas umas
 * nas outras, sem separação.
 */
export function mensagemDeErro(corpo: unknown, padrao: string): string {
  const mensagem = (corpo as { message?: unknown } | null)?.message;

  if (Array.isArray(mensagem)) {
    const textos = mensagem.filter((m): m is string => typeof m === 'string');
    return textos.length > 0 ? textos.join('. ') : padrao;
  }

  return typeof mensagem === 'string' && mensagem ? mensagem : padrao;
}
