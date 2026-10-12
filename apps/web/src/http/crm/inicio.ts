import { apiCrm } from "../api-crm"

export type JanelaDoInicio = "semana" | "mes" | "trimestre"

export interface ConversaAguardando {
  chatId: string
  nome: string
  ultimaMensagem: string | null
  tipo: string | null
  desde: string | null
  etapa: { name: string; color: string } | null
}

export interface DadosDoInicio {
  dia: string
  madrugada: { atendidos: number; consultasMarcadas: number }
  aguardando: { total: number; itens: ConversaAguardando[] }
  periodo: {
    janela: JanelaDoInicio
    de: string
    ate: string
    leadsNovos: number
    leadsNovosAnterior: number
    atendidos: number
    consultas: number
    honorarios: number
    contratos: number
    serieLeads: number[]
    serieAtendidos: number[]
  }
  agenda: {
    id: string
    titulo: string
    tipo: string
    inicio: string
    fim: string
    contato: string | null
  }[]
  prazos: { id: string; titulo: string; data: string }[]
}

export function buscarInicio(janela: JanelaDoInicio): Promise<DadosDoInicio> {
  return apiCrm
    .get("dashboard/home", { searchParams: { periodo: janela } })
    .json<DadosDoInicio>()
}
