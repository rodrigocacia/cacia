/**
 * Os valores são os que a API aceita e devolve. O português, que antes era o
 * próprio valor do enum e ia parar na requisição, agora vive em
 * agentStyleLabels.
 */
export enum AgentStyle {
  LEGAL_FORMAL = "LEGAL_FORMAL",
  CLEAR_AND_OBJECTIVE = "CLEAR_AND_OBJECTIVE",
  ASSERTIVE_AND_PERSUASIVE = "ASSERTIVE_AND_PERSUASIVE",
  EMPATHETIC_AND_SUPPORTIVE = "EMPATHETIC_AND_SUPPORTIVE",
  PROFESSIONAL_AND_CASUAL = "PROFESSIONAL_AND_CASUAL",
}

/** Como cada estilo aparece para quem escolhe, na tela de onboarding. */
export const agentStyleLabels: Record<AgentStyle, string> = {
  [AgentStyle.LEGAL_FORMAL]: "Formal Jurídico",
  [AgentStyle.CLEAR_AND_OBJECTIVE]: "Claro e Objetivo",
  [AgentStyle.ASSERTIVE_AND_PERSUASIVE]: "Assertivo e Persuasivo",
  [AgentStyle.EMPATHETIC_AND_SUPPORTIVE]: "Empático e Acolhedor",
  [AgentStyle.PROFESSIONAL_AND_CASUAL]: "Informal Profissional",
}

export interface Agent {
  _id: string
  office: string
  /** Em maiúsculas, como a API devolve: "SUPPORT" (atendimento) ou "PERSONAL" (assistente) */
  type: "SUPPORT" | "PERSONAL"
  name: string
  gender: "man" | "woman" | "neutral"
  style: string
  greeting: string
  deleted_at: null
  created_at: string
  updated_at: string
  v: number
}
