/** Tamanho do trecho, em caracteres. Mantém o padrão do sistema anterior. */
const TAMANHO = 1000;
/** Sobreposição entre trechos consecutivos. */
const SOBREPOSICAO = 200;

/**
 * Divide o texto em trechos para indexação.
 *
 * A sobreposição existe porque um corte no meio de uma frase perde o contexto
 * dos dois lados: com ela, a informação que ficou na fronteira aparece inteira
 * em pelo menos um dos trechos.
 *
 * O corte procura um fim de frase próximo em vez de cortar no caractere exato —
 * um trecho que começa no meio de uma palavra confunde a busca semântica.
 */
export function fragmentar(texto: string): string[] {
  const limpo = texto.replace(/\s+/g, ' ').trim();

  if (limpo.length === 0) return [];
  if (limpo.length <= TAMANHO) return [limpo];

  const trechos: string[] = [];
  let inicio = 0;

  while (inicio < limpo.length) {
    let fim = Math.min(inicio + TAMANHO, limpo.length);

    if (fim < limpo.length) {
      // Procura um fim de frase na metade final do trecho
      const janela = limpo.slice(inicio + TAMANHO / 2, fim);
      const corte = Math.max(
        janela.lastIndexOf('. '),
        janela.lastIndexOf('? '),
        janela.lastIndexOf('! '),
        janela.lastIndexOf('\n'),
      );

      if (corte > 0) {
        fim = inicio + TAMANHO / 2 + corte + 1;
      }
    }

    const trecho = limpo.slice(inicio, fim).trim();
    if (trecho.length > 0) trechos.push(trecho);

    if (fim >= limpo.length) break;

    inicio = fim - SOBREPOSICAO;
  }

  return trechos;
}
