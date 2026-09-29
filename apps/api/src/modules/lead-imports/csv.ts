/**
 * Leitor de CSV.
 *
 * Escrito à mão em vez de uma dependência porque o que precisa ser resolvido
 * aqui é pequeno e específico, e as duas armadilhas reais deste caso — o
 * separador e a codificação — nenhuma biblioteca acerta sozinha para planilha
 * brasileira exportada do Excel.
 */

/** Uma linha já separada em colunas. */
export type Linha = string[];

/**
 * Decodifica o arquivo para texto.
 *
 * O Excel em português exporta CSV em Windows-1252, não UTF-8. Decodificar
 * tudo como UTF-8 transformaria "José" em "Jos" com um caractere de
 * substituição, e o nome entraria assim na base — em silêncio, porque não é
 * erro de parse, é texto válido.
 *
 * A tentativa em UTF-8 é estrita de propósito: só assim ela FALHA em um
 * arquivo latino, o que é o sinal de que precisamos do outro decodificador.
 */
export function decodificar(conteudo: Buffer): string {
  let texto: string;

  try {
    texto = new TextDecoder('utf-8', { fatal: true }).decode(conteudo);
  } catch {
    texto = new TextDecoder('windows-1252').decode(conteudo);
  }

  // BOM: invisível, mas gruda no primeiro cabeçalho e faz "nome" deixar de
  // casar com "nome" na hora de sugerir o mapeamento.
  return texto.charCodeAt(0) === 0xfeff ? texto.slice(1) : texto;
}

/**
 * Descobre o separador olhando a primeira linha.
 *
 * Ponto e vírgula é o padrão do Excel em português — vírgula é o separador
 * decimal por lá, então não pode separar campos. Adivinhar errado devolve uma
 * planilha de uma coluna só, e o usuário vê "nenhuma coluna encontrada" sem
 * entender por quê.
 */
export function detectarSeparador(texto: string): string {
  const primeiraLinha = texto.slice(0, texto.search(/\r?\n/) + 1 || undefined);

  const candidatos = [';', ',', '\t', '|'];

  let melhor = ',';
  let maior = 0;

  for (const separador of candidatos) {
    // Conta fora de aspas: um nome como "Silva, João" não pode votar em ","
    const quantidade = contarForaDeAspas(primeiraLinha, separador);

    if (quantidade > maior) {
      maior = quantidade;
      melhor = separador;
    }
  }

  return melhor;
}

function contarForaDeAspas(texto: string, separador: string): number {
  let dentro = false;
  let total = 0;

  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i];

    if (caractere === '"') dentro = !dentro;
    else if (!dentro && caractere === separador) total += 1;
  }

  return total;
}

/**
 * Converte o texto em linhas de colunas.
 *
 * Máquina de estados em vez de `split`: campo entre aspas pode conter o
 * separador e até quebra de linha, e `split` cortaria no meio do valor. Aspas
 * duplicadas dentro do campo (`""`) viram uma aspa literal, como manda o
 * formato.
 *
 * `limite` interrompe a leitura — a prévia precisa de dez linhas, não do
 * arquivo inteiro na memória.
 */
export function lerCsv(
  texto: string,
  opcoes: { separador?: string; limite?: number } = {},
): Linha[] {
  const separador = opcoes.separador ?? detectarSeparador(texto);
  const limite = opcoes.limite ?? Infinity;

  const linhas: Linha[] = [];

  let campo = '';
  let linha: Linha = [];
  let dentroDeAspas = false;

  const fecharCampo = (): void => {
    linha.push(campo);
    campo = '';
  };

  const fecharLinha = (): void => {
    fecharCampo();

    // Linha em branco no fim do arquivo é ruído do editor, não um registro
    if (linha.length > 1 || linha[0] !== '') linhas.push(linha);

    linha = [];
  };

  for (let i = 0; i < texto.length; i += 1) {
    const caractere = texto[i];

    if (dentroDeAspas) {
      if (caractere === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i += 1;
        } else {
          dentroDeAspas = false;
        }
      } else {
        campo += caractere;
      }

      continue;
    }

    if (caractere === '"' && campo === '') {
      dentroDeAspas = true;
    } else if (caractere === separador) {
      fecharCampo();
    } else if (caractere === '\n') {
      fecharLinha();
      if (linhas.length >= limite) return linhas;
    } else if (caractere !== '\r') {
      campo += caractere;
    }
  }

  if (campo !== '' || linha.length > 0) fecharLinha();

  return linhas;
}

/** Tira espaços das pontas de cada coluna. */
export function aparar(linha: Linha): Linha {
  return linha.map((valor) => valor.trim());
}
