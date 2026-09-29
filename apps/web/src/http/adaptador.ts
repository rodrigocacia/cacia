/**
 * Tradução entre o vocabulário do frontend e o da API.
 *
 * O frontend nasceu sobre uma API em MongoDB: `_id`, `created_at`,
 * `legal_name`, e páginas no formato `{ data, totalItems, ... }`. A API nova
 * usa `id`, `createdAt`, `legalName` e `{ data, meta }`.
 *
 * Traduzir aqui, num lugar só, em vez de reescrever os ~160 componentes que
 * leem esses campos: a alternativa seria uma refatoração de interface inteira
 * sem ninguém para revisar o resultado na tela. Este arquivo é a fronteira —
 * dentro dela o frontend continua falando a língua que sempre falou.
 *
 * O que NÃO é traduzido está em `OPACOS`: são campos cujo conteúdo é um JSON
 * de terceiros ou de formulário, onde as chaves internas têm significado
 * próprio e renomeá-las corromperia o dado.
 */

/**
 * Campos cujo interior não pode ser mexido.
 *
 * `template_variables` guarda as variáveis do documento, com chaves em
 * camelCase por desenho. Os demais vêm crus da Judit — renomear as chaves
 * deles quebraria a leitura do processo.
 */
const OPACOS = new Set([
  "template_variables",
  "templateVariables",
  "courts",
  "classifications",
  "subjects",
  "parties",
  "partie",
])

function ehObjetoSimples(valor: unknown): valor is Record<string, unknown> {
  return (
    typeof valor === "object" &&
    valor !== null &&
    !Array.isArray(valor) &&
    !(valor instanceof Date) &&
    Object.getPrototypeOf(valor) === Object.prototype
  )
}

function paraSnake(chave: string): string {
  return chave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)
}

function paraCamel(chave: string): string {
  return chave.replace(/_([a-z0-9])/g, (_, letra: string) =>
    letra.toUpperCase()
  )
}

/**
 * Resposta da API no formato que o frontend espera.
 *
 * Além de renomear as chaves, mantém `id` E acrescenta `_id` com o mesmo
 * valor: há componentes lendo um e componentes lendo o outro, e devolver os
 * dois evita ter de caçar cada um deles agora.
 */
export function paraLegado<T = unknown>(valor: unknown): T {
  return converter(valor, paraSnake, true) as T
}

/** Corpo de requisição no formato que a API espera. */
export function paraApi<T = unknown>(valor: unknown): T {
  return converter(valor, paraCamel, false) as T
}

function converter(
  valor: unknown,
  renomear: (chave: string) => string,
  espelharId: boolean
): unknown {
  if (Array.isArray(valor)) {
    return valor.map((item) => converter(item, renomear, espelharId))
  }

  if (!ehObjetoSimples(valor)) return valor

  const saida: Record<string, unknown> = {}

  for (const [chave, conteudo] of Object.entries(valor)) {
    const nova = renomear(chave)

    saida[nova] = OPACOS.has(nova)
      ? conteudo
      : converter(conteudo, renomear, espelharId)

    // O frontend inteiro identifica registro por `_id`
    if (espelharId && chave === "id" && typeof conteudo === "string") {
      saida._id = conteudo
    }
  }

  // Endereço: a API devolve `addresses`; as telas de cliente e de escritório
  // leem `address`, o nome do sistema anterior. Sem o espelho, o endereço
  // gravado nunca aparecia nem vinha preenchido na edição.
  if (espelharId && Array.isArray(saida.addresses) && !("address" in saida)) {
    saida.address = saida.addresses
  }

  return saida
}

// ---------------------------------------------------------------------------
// Paginação
// ---------------------------------------------------------------------------

export interface PaginaDaApi<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface PaginaLegada<T> {
  data: T[]
  totalItems: number
  totalPages: number
  currentPage: number
  perPage: number
}

/** `{ data, meta }` no formato de página que os componentes consomem. */
export function paginaLegada<T>(resposta: unknown): PaginaLegada<T> {
  const pagina = resposta as PaginaDaApi<unknown> | undefined

  if (!pagina || !Array.isArray(pagina.data)) {
    // Rota que não pagina, ou resposta inesperada: devolve uma página vazia em
    // vez de derrubar a tela com "cannot read property of undefined".
    return {
      data: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
      perPage: 20,
    }
  }

  const meta = pagina.meta ?? {
    page: 1,
    limit: pagina.data.length,
    total: pagina.data.length,
    totalPages: 1,
  }

  return {
    data: paraLegado<T[]>(pagina.data),
    totalItems: meta.total,
    totalPages: meta.totalPages,
    currentPage: meta.page,
    perPage: meta.limit,
  }
}

// ---------------------------------------------------------------------------
// Requisição
// ---------------------------------------------------------------------------

/**
 * Campos que não podem mais ir no corpo nem na query.
 *
 * A API resolve o escritório pelo cabeçalho `x-office-id` e recusa a
 * requisição que traga campo fora do DTO — `office_id` no corpo devolve 400,
 * não é ignorado.
 */
const CAMPOS_REMOVIDOS = new Set(["office_id", "office", "officeId"])

export function limparCorpo(
  corpo: Record<string, unknown>
): Record<string, unknown> {
  const limpo: Record<string, unknown> = {}

  for (const [chave, valor] of Object.entries(corpo)) {
    if (CAMPOS_REMOVIDOS.has(chave)) continue
    if (valor === undefined) continue

    limpo[chave] = valor
  }

  return paraApi<Record<string, unknown>>(limpo)
}

/** Remove da query os parâmetros que a API não aceita mais. */
export function limparQuery(params: URLSearchParams): URLSearchParams {
  for (const removido of CAMPOS_REMOVIDOS) {
    params.delete(removido)
  }

  return params
}
