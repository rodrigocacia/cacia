export enum DocumentCategory {
  BUDGET = "budget",
  CONTRACT = "contract",
  POWER_OF_ATTORNEY = "power_of_attorney",
  PETITION = "petition",
}

export enum DocumentStatus {
  DRAFT = "draft",
  PENDING_REVIEW = "pending_review",
  APPROVED = "approved",
  SENT = "sent",
}

export enum DocumentType {
  ATTACHMENT = "attachment",
  CREATE = "create",
  UPLOAD = "upload",
}

export type TemplateVariables =
  | BudgetVariables
  | ContractVariables
  | PowerOfAttorneyVariables
  | PetitionVariables

export interface Document {
  _id: string
  office_id: string
  chat_id: string
  title: string
  category: DocumentCategory
  status: DocumentStatus
  type: DocumentType
  template_variables: TemplateVariables
  content?: string
  content_url?: string
  file_path?: string
  message_url_attachment: boolean
  lead?: {
    _id: string
    name: string
    remotejid: string
    email: string
  }
  customer?: {
    _id: string
    name: string
    remotejid: string
    email: string
  }
  process?: {
    _id: string
    customer: string
    unit: string
    number: string
  }
  created_at: Date
  updated_at: Date
}

export interface BudgetVariables {
  clientName: string
  clientCpf: string
  clientAddress: string
  caseType: string
  serviceDescription: string
  totalValue: string
  honorariosType?: string
  paymentTerms: string
  estimatedDuration: string
  includedServices: string[]
  additionalFees?: string
  validityDays: string
  lawyerName: string
  lawyerOab: string
  officeAddress: string
  officePhone: string
  officeEmail: string
}

export interface ContractVariables {
  clientName: string
  services: string
  value: string
  duration: string
}

export interface PowerOfAttorneyVariables {
  clientName: string
  powers: string
  limitations?: string
}

export interface PetitionVariables {
  clientName: string
  court: string
  subject: string
  facts: string
  legal_basis: string
  requests: string
}

type DocumentCategoryConfig = {
  [key in DocumentCategory]: {
    label: string
    color: string
    text: string
    icon: string
  }
}

type DocumentStatusConfig = {
  [key in DocumentStatus]: {
    label: string
    color: string
    text: string
    icon: string
  }
}

export const documentCategoryConfig: DocumentCategoryConfig = {
  [DocumentCategory.BUDGET]: {
    label: "Orçamento",
    color: "bg-[#F0FDF4]",
    text: "text-[#16A31B]",
    icon: "mdi:calculator-variant",
  },
  [DocumentCategory.CONTRACT]: {
    label: "Contrato",
    color: "bg-[#EFF6FF]",
    text: "text-[#2563EB]",
    icon: "mdi:file-document-outline",
  },
  [DocumentCategory.POWER_OF_ATTORNEY]: {
    label: "Procuração",
    color: "bg-[#FEF3C7]",
    text: "text-[#D97706]",
    icon: "mdi:gavel",
  },
  [DocumentCategory.PETITION]: {
    label: "Petição",
    color: "bg-[#FDF2F8]",
    text: "text-[#BE185D]",
    icon: "mdi:file-edit-outline",
  },
}

export const documentStatusConfig: DocumentStatusConfig = {
  [DocumentStatus.DRAFT]: {
    label: "Rascunho",
    color: "bg-gray-100",
    text: "text-gray-600",
    icon: "mdi:file-edit",
  },
  [DocumentStatus.PENDING_REVIEW]: {
    label: "Aguardando Revisão",
    color: "bg-[#FEFBEB]",
    text: "text-[#F7CB08]",
    icon: "mdi:clock-outline",
  },
  [DocumentStatus.APPROVED]: {
    label: "Aprovado",
    color: "bg-[#F0FDF4]",
    text: "text-[#16A31B]",
    icon: "mdi:check-circle-outline",
  },
  [DocumentStatus.SENT]: {
    label: "Enviado",
    color: "bg-[#ECF7F8]",
    text: "text-[#348C98]",
    icon: "mdi:send-outline",
  },
}
