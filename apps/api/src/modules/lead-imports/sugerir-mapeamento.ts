import { CAMPOS_IMPORTAVEIS, type CampoImportavel } from '@cacia/contracts';

/** Sem acento, sem pontuação, minúsculo — para comparar cabeçalhos. */
function normalizar(texto: string): string {
  return (
    texto
      .normalize('NFD')
      // Propriedade Unicode em vez da faixa ̀-ͯ: o mesmo efeito, sem
      // um caractere combinante literal no meio do código-fonte.
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  );
}

/**
 * Apelidos de cabeçalho por campo.
 *
 * A ordem da lista é a ordem de prioridade da busca. `telefone` vem antes de
 * qualquer coisa parecida com "contato" de propósito: numa planilha com as
 * colunas "Contato" e "Telefone", é a segunda que tem o número.
 */
const APELIDOS: Record<CampoImportavel, string[]> = {
  remotejid: [
    'telefone',
    'celular',
    'whatsapp',
    'whats',
    'fone',
    'phone',
    'numero',
    'tel',
  ],
  name: ['nome', 'name', 'cliente', 'lead', 'razaosocial', 'contato'],
  email: ['email', 'mail', 'correio'],
  briefing: [
    'observacao',
    'observacoes',
    'obs',
    'descricao',
    'briefing',
    'anotacao',
    'anotacoes',
    'notas',
    'comentario',
  ],
  value: ['valor', 'value', 'ticket', 'preco', 'honorarios'],
  sourceDetail: ['origem', 'fonte', 'source', 'canal', 'campanha'],
};

/**
 * Chuta qual coluna alimenta qual campo, para a tela já abrir preenchida.
 *
 * É sugestão, não decisão: a tela mostra o resultado e a pessoa corrige antes
 * de confirmar. Errar aqui custa um clique; importar sem conferir é que custa
 * uma base suja.
 *
 * Cada campo é atribuído no máximo uma vez — duas colunas mapeadas para
 * `name` fariam a segunda sobrescrever a primeira em silêncio.
 */
export function sugerirMapeamento(
  cabecalhos: string[],
): Record<string, CampoImportavel> {
  const normalizados = cabecalhos.map(normalizar);
  const sugestao: Record<string, CampoImportavel> = {};
  const usados = new Set<number>();

  for (const campo of CAMPOS_IMPORTAVEIS) {
    const apelidos: string[] = APELIDOS[campo];

    // Primeiro o cabeçalho idêntico ao apelido; só depois o que o contém.
    // Sem essa ordem, "telefone2" poderia vencer "telefone".
    const exato = normalizados.findIndex(
      (cabecalho, i) => !usados.has(i) && apelidos.includes(cabecalho),
    );

    const escolhido =
      exato >= 0
        ? exato
        : normalizados.findIndex(
            (cabecalho, i) =>
              !usados.has(i) &&
              cabecalho.length > 0 &&
              apelidos.some((apelido) => cabecalho.includes(apelido)),
          );

    if (escolhido >= 0) {
      usados.add(escolhido);
      sugestao[String(escolhido)] = campo;
    }
  }

  return sugestao;
}
