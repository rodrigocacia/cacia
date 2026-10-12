import type { LeadImportStatus, LeadSource, StageKind } from "@cacia/contracts"

/** Página da API nova — `{ data, meta }`, sem a tradução legada. */
export interface Pagina<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export interface Etapa {
  id: string
  name: string
  color: string
  position: number
  kind: StageKind
}

export interface Funil {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
  stages: Etapa[]
}

export interface EtapaComContagem extends Etapa {
  _count?: { leads: number }
}

export interface Etiqueta {
  id: string
  name: string
  color: string
  createdAt?: string
  _count?: { leads: number; customers: number }
}

export interface Responsavel {
  id: string
  name: string
  email?: string
  avatar?: string | null
}

export interface Cartao {
  id: string
  name: string
  remotejid: string
  /** Resumo do caso, quando a assistente ou a equipe o registrou */
  briefing?: string | null
  /** Decimal do Prisma chega como string — converter no consumidor, não aqui */
  value: string | null
  status: string
  stageChangedAt: string | null
  lastActivityAt: string | null
  owner: Responsavel | null
  tags: Etiqueta[]
}

export interface Coluna extends Etapa {
  total: number
  valorTotal: string | null
  leads: Cartao[]
}

export interface Quadro {
  pipeline: { id: string; name: string }
  stages: Coluna[]
}

export interface PassagemDeEtapa {
  id: string
  createdAt: string
  secondsInPreviousStage: number | null
  fromStage: Pick<Etapa, "id" | "name" | "color"> | null
  toStage: Pick<Etapa, "id" | "name" | "color">
  user: { id: string; name: string } | null
}

export interface Lead extends Cartao {
  email: string | null
  briefing: string | null
  customerId: string | null
  pipelineId: string | null
  stageId: string | null
  source: LeadSource
  sourceDetail: string | null
  expectedCloseAt: string | null
  lostReason: string | null
  lostAt: string | null
  createdAt: string
  stage: Etapa | null
  pipeline: { id: string; name: string } | null
  customer?: { id: string; name: string; document: string } | null
  stageHistory?: PassagemDeEtapa[]
  _count?: { chats: number; events: number; documents: number }
}

export interface MetricaDeEtapa extends Etapa {
  leads: number
  valorTotal: string | null
  tempoMedioSegundos: number
}

export interface MetricasDoFunil {
  pipeline: { id: string; name: string }
  stages: MetricaDeEtapa[]
  periodo: {
    dias: number
    criados: number
    ganhos: number
    perdidos: number
    valorGanho: string | null
    taxaConversao: number | null
  }
}

export interface ColunaDoArquivo {
  index: number
  header: string
  amostra: string[]
}

export interface ErroDeLinha {
  linha: number
  motivo: string
}

export interface Importacao {
  id: string
  fileName: string
  status: LeadImportStatus
  pipelineId: string | null
  stageId: string | null
  tagIds: string[]
  mapping: Record<string, string> | null
  totalRows: number
  importedRows: number
  skippedRows: number
  failedRows: number
  errors: ErroDeLinha[] | null
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  /** Só na resposta da prévia */
  columns?: ColunaDoArquivo[]
  separador?: string
  user?: { id: string; name: string }
  stage?: Pick<Etapa, "id" | "name" | "color"> | null
}

export interface HorarioLivre {
  inicio: string
  fim: string
  online: boolean
  inPerson: boolean
}

export interface Disponibilidade {
  date: string
  calendarId: string
  duracaoMinutos: number
  slots: HorarioLivre[]
}
