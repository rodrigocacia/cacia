import { apiCrm } from "../api-crm"

export interface ConfiguracaoDoEscritorio {
  id: string
  /** O agente pode mover o lead de etapa no funil */
  aiCanMoveLeadStage: boolean
  /** O agente pode aplicar etiquetas já cadastradas */
  aiCanTagLead: boolean
  updatedAt: string
}

export function obterConfiguracao(): Promise<ConfiguracaoDoEscritorio> {
  return apiCrm.get("settings").json<ConfiguracaoDoEscritorio>()
}

/**
 * Atualiza só o que mudou.
 *
 * PATCH parcial de propósito: mandar o objeto inteiro faria a tela desligar
 * uma preferência de notificação que ela nem exibe.
 */
export function atualizarConfiguracao(
  dados: Partial<
    Pick<ConfiguracaoDoEscritorio, "aiCanMoveLeadStage" | "aiCanTagLead">
  >
): Promise<ConfiguracaoDoEscritorio> {
  return apiCrm
    .patch("settings", { json: dados })
    .json<ConfiguracaoDoEscritorio>()
}
