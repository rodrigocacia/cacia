/**
 * Os valores são os que a API devolve, não os rótulos em português.
 *
 * Eram os rótulos, e o efeito era pior do que uma tela quebrada: a API manda
 * "ARCHIVED", a busca em processStatusConfig não achava nada, e o ProcessBadge
 * caía no padrão — todo processo aparecia como "Ativo", inclusive os
 * arquivados e os concluídos. Num sistema jurídico, status errado exibido com
 * confiança é o pior tipo de defeito.
 *
 * O português vive em processStatusConfig.label. PENDING existe no banco e
 * faltava aqui.
 */
export enum ProcessStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  CONCLUDED = "CONCLUDED",
  FINISHED = "FINISHED",
}

export enum ProcessType {
  CIVIL = "CIVIL",
  PENAL = "PENAL",
  TRABALHISTA = "TRABALHISTA",
  TRIBUTARIO = "TRIBUTARIO",
  ADMINISTRATIVO = "ADMINISTRATIVO",
  CONSTITUCIONAL = "CONSTITUCIONAL",
  ELEITORAL = "ELEITORAL",
  MILITAR = "MILITAR",
  AMBIENTAL = "AMBIENTAL",
  CONSUMIDOR = "CONSUMIDOR",
  EMPRESARIAL = "EMPRESARIAL",
  PREVIDENCIARIO = "PREVIDENCIARIO",
}

type ProcessStatusConfig = {
  [key in ProcessStatus]: {
    label: string
    color: string
    text: string
    icon: string
  }
}

type ProcessTypeConfig = {
  [key in ProcessType]: string
}

export const processStatusConfig: ProcessStatusConfig = {
  [ProcessStatus.PENDING]: {
    label: "Pendente",
    color: "bg-[#FEFBEB]",
    text: "text-[#F7CB08]",
    icon: "mdi:clock-outline",
  },
  [ProcessStatus.ACTIVE]: {
    label: "Ativo",
    color: "bg-[#F0FDF4]",
    text: "text-[#16A31B]",
    icon: "mdi:account-check-outline",
  },
  [ProcessStatus.ARCHIVED]: {
    label: "Arquivado",
    color: "bg-[#FEFBEB]",
    text: "text-[#F7CB08]",
    icon: "mdi:folder-clock-outline",
  },
  [ProcessStatus.CONCLUDED]: {
    label: "Concluído",
    color: "bg-[#ECF7F8]",
    text: "text-[#348C98]",
    icon: "mdi:check-circle-outline",
  },
  [ProcessStatus.FINISHED]: {
    label: "Finalizado",
    color: "bg-[#ECF7F8]",
    text: "text-[#348C98]",
    icon: "mdi:check-circle-outline",
  },
}

export const processTypeConfig: ProcessTypeConfig = {
  [ProcessType.CIVIL]: "Civil",
  [ProcessType.PENAL]: "Penal",
  [ProcessType.TRABALHISTA]: "Trabalhista",
  [ProcessType.TRIBUTARIO]: "Tributário",
  [ProcessType.ADMINISTRATIVO]: "Administrativo",
  [ProcessType.CONSTITUCIONAL]: "Constitucional",
  [ProcessType.ELEITORAL]: "Eleitoral",
  [ProcessType.MILITAR]: "Militar",
  [ProcessType.AMBIENTAL]: "Ambiental",
  [ProcessType.CONSUMIDOR]: "Consumidor",
  [ProcessType.EMPRESARIAL]: "Empresarial",
  [ProcessType.PREVIDENCIARIO]: "Previdenciário",
}

export interface Process {
  _id: string
  office: string
  customer: {
    _id: string
    name: string
    remotejid: string
    email: string
    document: string
  }
  unit: string
  number: string
  description: string
  status: ProcessStatus
  update_status: "PENDING" | "APPROVED" | "REJECTED"
  deleted_at: null
  courts: [
    {
      name: string
      date: string
    },
  ]
  classifications: [
    {
      code: string
      name: string
      date: string
    },
  ]
  subjects: [
    {
      code: "10459"
      name: "USUCAPIÃO ORDINÁRIA"
      date: "2025-04-03T00:00:00.000Z"
    },
  ]
  partie: []
  request_id: string
  amount: number
  area: string
  city: string
  county: string
  distribution_date: string
  free_justice: boolean
  instance: number
  judge: string
  justice: string
  justice_description: string
  name: string
  phase: string
  secrecy_level: number
  state: string
  tribunal: string
  tribunal_acronym: string
  documents: {
    _id: string
    title: string
    extension: string
  }[]
  events: []
  progress: {
    office: string
    process: string
    title: string
    description?: string
    deleted_at: null
    release_at: string
    _id: string
    created_at: string
    updated_at: string
    __v: 0
  }[]

  delete_at: null
  last_activity_at: null
  created_at: string
  updated_at: string
  __v: 0
}
