/**
 * Extrai o texto de um arquivo para indexação.
 *
 * Formatos sem texto extraível (imagem sem OCR, por exemplo) devolvem string
 * vazia em vez de lançar: não é erro, é um documento do qual não há texto a
 * extrair, e o chamador marca como SKIPPED.
 */
export async function extrairTexto(
  conteudo: Buffer,
  extensao?: string | null,
): Promise<string> {
  const tipo = (extensao ?? '').toLowerCase();

  if (tipo === 'pdf') {
    // Importado sob demanda: a biblioteca é pesada e só entra quando há PDF
    const { default: pdfParse } = await import('pdf-parse');
    const resultado = await pdfParse(conteudo);
    return resultado.text;
  }

  if (['txt', 'md', 'csv', 'json'].includes(tipo)) {
    return conteudo.toString('utf-8');
  }

  return '';
}
