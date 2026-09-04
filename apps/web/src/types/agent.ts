export enum AgentStyle {
  LEGAL_FORMAL = "Formal Jurídico",
  CLEAR_AND_OBJECTIVE = "Claro e Objetivo",
  ASSERTIVE_AND_PERSUASIVE = "Assertivo e Persuasivo",
  EMPATHETIC_AND_SUPPORTIVE = "Empático e Acolhedor",
  PROFESSIONAL_AND_CASUAL = "Informal Profissional",
}

export interface Agent {
  _id: string
  office: string
  type: string
  name: string
  gender: "man" | "woman" | "neutral"
  style: string
  greeting: string
  deleted_at: null
  created_at: string
  updated_at: string
  v: number
}
