/**
 * Natureza de uma etapa do funil.
 *
 * O nome da etapa é livre — cada escritório batiza as suas —, mas o sistema
 * precisa saber quais significam fim de linha: `WON` habilita a conversão em
 * cliente, `LOST` tira o lead do funil aberto e das métricas.
 */
export enum StageKind {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

/** De onde o lead veio. */
export enum LeadSource {
  WHATSAPP = 'WHATSAPP',
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  SITE = 'SITE',
  INDICACAO = 'INDICACAO',
  OTHER = 'OTHER',
}

/** Situação de uma importação de planilha. */
export enum LeadImportStatus {
  /** Arquivo lido, colunas detectadas — aguardando o mapeamento */
  PREVIEW = 'PREVIEW',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
}

/**
 * Campos de lead que uma coluna da planilha pode alimentar.
 *
 * `remotejid` é o telefone: é a chave de deduplicação e o único obrigatório —
 * sem ele não há como falar com a pessoa nem como saber se ela já está na base.
 */
export const CAMPOS_IMPORTAVEIS = [
  'name',
  'remotejid',
  'email',
  'briefing',
  'value',
  'sourceDetail',
] as const;

export type CampoImportavel = (typeof CAMPOS_IMPORTAVEIS)[number];

/** Rótulos em português para a tela de mapeamento. */
export const ROTULO_CAMPO_IMPORTAVEL: Record<CampoImportavel, string> = {
  name: 'Nome',
  remotejid: 'Telefone',
  email: 'E-mail',
  briefing: 'Observações',
  value: 'Valor',
  sourceDetail: 'Origem',
};
