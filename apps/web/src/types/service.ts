/** Valores iguais aos da API, que devolve e aceita a chave do enum em maiúsculas. */
export enum ServiceArea {
  ADMINISTRATIVE = "ADMINISTRATIVE",
  AGRARIAN = "AGRARIAN",
  BANKRUPTCY = "BANKRUPTCY",
  BUSINESS = "BUSINESS",
  CIVIL = "CIVIL",
  CONSUMER = "CONSUMER",
  CONTRACT = "CONTRACT",
  CORPORATE = "CORPORATE",
  CRIMINAL = "CRIMINAL",
  DIGITAL = "DIGITAL",
  ELECTORAL = "ELECTORAL",
  ENVIRONMENTAL = "ENVIRONMENTAL",
  FAMILY = "FAMILY",
  HEALTH = "HEALTH",
  HUMAN_RIGHTS = "HUMAN_RIGHTS",
  IMMIGRATION = "IMMIGRATION",
  INSURANCE = "INSURANCE",
  INTELLECTUAL_PROPERTY = "INTELLECTUAL_PROPERTY",
  INTERNATIONAL = "INTERNATIONAL",
  LABOR = "LABOR",
  MILITARY = "MILITARY",
  NOTARIAL = "NOTARIAL",
  PENSION = "PENSION",
  REAL_ESTATE = "REAL_ESTATE",
  SOCIAL_SECURITY = "SOCIAL_SECURITY",
  SPORTS = "SPORTS",
  TAX = "TAX",
  TECHNOLOGY = "TECHNOLOGY",
  TRAFFIC = "TRAFFIC",
  TRIBUTARY = "TRIBUTARY",
  YOUTH = "YOUTH",
  OTHER = "OTHER",
}

export interface Service {
  office: string
  title: string
  description: string
  area: string
  value_type: string
  value_fixed: number
  value_float: number | null
  value_detail: string
  status: boolean
  deleted_at: string | null
  _id: string
  created_at: string
  updated_at: string
  __v: number
}
