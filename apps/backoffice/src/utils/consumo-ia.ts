/**
 * Formatação e exportação do consumo de IA — o relatório que o dono da
 * plataforma usa para cobrar cada escritório.
 */

const reais2 = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const reais4 = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const dolares = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

const inteiros = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const decimais = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/**
 * R$ em pt-BR. Abaixo de um centavo mostra 4 casas: um escritório pequeno
 * gasta frações de centavo por dia, e "R$ 0,00" pareceria consumo zero.
 */
export function formatarReais(valor: number): string {
  if (valor !== 0 && Math.abs(valor) < 0.01) return reais4.format(valor);
  return reais2.format(valor);
}

/** Preço de modelo em US$ por milhão de tokens — até 6 casas, como a API aceita. */
export function formatarDolares(valor: number): string {
  return dolares.format(valor);
}

export function formatarInteiro(valor: number): string {
  return inteiros.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${decimais.format(valor)}%`;
}

/**
 * Número digitado em pt-BR ("1.234,56", "5,5") ou com ponto ("5.5").
 *
 * Com vírgula presente, os pontos são separadores de milhar; sem vírgula, o
 * ponto é o separador decimal — quem cola um preço da página do provedor
 * traz "0.28", não "0,28".
 */
export function lerNumero(texto: string): number | null {
  const normalizado = normalizarNumero(texto);
  return normalizado === null ? null : Number(normalizado);
}

function normalizarNumero(texto: string): string | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (!limpo) return null;

  const normalizado = limpo.includes(',')
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo;

  return /^-?\d+(\.\d+)?$/.test(normalizado) ? normalizado : null;
}

/**
 * Mesmos limites do DTO da API, conferidos antes de enviar: a recusa do
 * servidor chega em inglês técnico e sem dizer qual campo.
 */
export function validarNumero(
  texto: string,
  limites: { min: number; max?: number; casas: number },
): string | null {
  const normalizado = normalizarNumero(texto);
  if (normalizado === null) return 'Informe um número';

  const valor = Number(normalizado);
  const casas = normalizado.split('.')[1]?.length ?? 0;

  if (valor < limites.min) return `Mínimo: ${decimais.format(limites.min)}`;
  if (limites.max !== undefined && valor > limites.max) {
    return `Máximo: ${decimais.format(limites.max)}`;
  }
  if (casas > limites.casas) {
    return `Use no máximo ${limites.casas} casas decimais`;
  }

  return null;
}

/** Valor para preencher um campo de texto em pt-BR, sem separador de milhar. */
export function numeroParaCampo(valor: number): string {
  return String(valor).replace('.', ',');
}

// ---------------------------------------------------------------------------
// Período
// ---------------------------------------------------------------------------

export type TipoDePeriodo = 'mes-atual' | 'mes-passado' | 'personalizado';

/** Hoje em Brasília (YYYY-MM-DD) — o mesmo relógio que a API usa para o mês. */
export function hojeEmBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export function ehData(texto: string | undefined | null): texto is string {
  return !!texto && DATA.test(texto);
}

/**
 * `from`/`to` para a API. Mês atual devolve vazio: o padrão da API já é o
 * mês corrente até hoje, e deixá-la decidir evita divergir no fuso.
 */
export function intervaloDoPeriodo(
  tipo: TipoDePeriodo,
  hoje: string,
  personalizado?: { de?: string; ate?: string },
): { from?: string; to?: string } {
  if (tipo === 'mes-passado') {
    const [ano, mes] = hoje.split('-').map(Number);
    const anoAnterior = mes === 1 ? ano - 1 : ano;
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    // Dia 0 do mês seguinte é o último dia do mês desejado
    const ultimoDia = new Date(
      Date.UTC(anoAnterior, mesAnterior, 0),
    ).getUTCDate();
    const mm = String(mesAnterior).padStart(2, '0');

    return {
      from: `${anoAnterior}-${mm}-01`,
      to: `${anoAnterior}-${mm}-${String(ultimoDia).padStart(2, '0')}`,
    };
  }

  if (tipo === 'personalizado') {
    return {
      from: ehData(personalizado?.de) ? personalizado.de : undefined,
      to: ehData(personalizado?.ate) ? personalizado.ate : undefined,
    };
  }

  return {};
}

export function tipoDePeriodo(valor: string | undefined): TipoDePeriodo {
  return valor === 'mes-passado' || valor === 'personalizado'
    ? valor
    : 'mes-atual';
}

/** "2026-09-01" → "01/09/2026". */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export interface LinhaDoCsv {
  nome: string;
  removido: boolean;
  chamadas: number;
  tokens: number;
  custo: number;
  cobrado: number;
  semPreco: boolean;
}

/** Marca de ordem de bytes do UTF-8 (U+FEFF). */
export const BOM = String.fromCharCode(0xfeff);

/** Decimal com vírgula e sem separador de milhar — o Excel em pt-BR lê como número. */
function decimalCsv(valor: number, casas: number): string {
  return valor.toFixed(casas).replace('.', ',');
}

function campoCsv(valor: string): string {
  // Nome começando com = + - @ vira fórmula ao abrir no Excel; o apóstrofo
  // o mantém como texto. O nome do escritório é digitado pelo próprio cliente.
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;

  return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

/**
 * Planilha de cobrança: separador `;`, decimais com vírgula e BOM no início,
 * para o Excel em pt-BR abrir com acentos e colunas certas num clique duplo.
 *
 * Os valores saem com 4 casas, como vêm da API: arredondar aqui faria a soma
 * das linhas divergir do total.
 */
export function gerarCsvDeConsumo(linhas: LinhaDoCsv[]): string {
  const cabecalho = [
    'Escritório',
    'Removido',
    'Chamadas',
    'Tokens',
    'Custo (R$)',
    'Valor a cobrar (R$)',
    'Modelo sem preço cadastrado',
  ];

  const corpo = linhas.map((linha) =>
    [
      campoCsv(linha.nome),
      linha.removido ? 'Sim' : 'Não',
      String(linha.chamadas),
      String(linha.tokens),
      decimalCsv(linha.custo, 4),
      decimalCsv(linha.cobrado, 4),
      linha.semPreco ? 'Sim' : 'Não',
    ].join(';'),
  );

  const total = linhas.reduce(
    (soma, linha) => ({
      chamadas: soma.chamadas + linha.chamadas,
      tokens: soma.tokens + linha.tokens,
      custo: soma.custo + linha.custo,
      cobrado: soma.cobrado + linha.cobrado,
    }),
    { chamadas: 0, tokens: 0, custo: 0, cobrado: 0 },
  );

  const rodape = [
    'Total',
    '',
    String(total.chamadas),
    String(total.tokens),
    decimalCsv(total.custo, 4),
    decimalCsv(total.cobrado, 4),
    '',
  ].join(';');

  return `${BOM}${[cabecalho.join(';'), ...corpo, rodape].join('\r\n')}\r\n`;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------

export interface IntervaloDeConsumo {
  from?: string;
  to?: string;
}

/** Sem datas, a API usa o mês corrente até hoje. */
export function queryDoIntervalo({ from, to }: IntervaloDeConsumo): string {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const query = params.toString();
  return query ? `?${query}` : '';
}
