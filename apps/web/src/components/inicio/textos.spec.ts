import { describe, expect, it } from "vitest"

import type { DadosDoInicio } from "@/http/crm/inicio"

import {
  caminhoDaSerie,
  emReaisCompacto,
  espera,
  primeiroNome,
  resumoDoDia,
  saudacao,
  variacao,
} from "./textos"

function dados(parcial: Partial<DadosDoInicio> = {}): DadosDoInicio {
  return {
    dia: "2026-10-12",
    madrugada: { atendidos: 0, consultasMarcadas: 0 },
    aguardando: { total: 0, itens: [] },
    periodo: {
      janela: "semana",
      de: "2026-10-06",
      ate: "2026-10-12",
      leadsNovos: 0,
      leadsNovosAnterior: 0,
      atendidos: 0,
      consultas: 0,
      honorarios: 0,
      contratos: 0,
      serieLeads: [],
      serieAtendidos: [],
    },
    agenda: [],
    prazos: [],
    ...parcial,
  }
}

const texto = (d: DadosDoInicio, agora: Date) =>
  resumoDoDia(d, agora)
    .map((t) => t.texto)
    .join("")

// 09h em Brasília (12h UTC) e 15h em Brasília (18h UTC)
const MANHA = new Date("2026-10-12T12:00:00Z")
const TARDE = new Date("2026-10-12T18:00:00Z")

describe("textos do Início", () => {
  it("pula títulos ao pegar o primeiro nome", () => {
    expect(primeiroNome("Dra. Helena Duarte")).toBe("Helena")
    expect(primeiroNome("Dr Carlos")).toBe("Carlos")
    expect(primeiroNome(undefined)).toBe("")
  })

  it("saúda conforme a hora de Brasília", () => {
    expect(saudacao(MANHA)).toBe("Bom dia")
    expect(saudacao(TARDE)).toBe("Boa tarde")
    expect(saudacao(new Date("2026-10-12T23:30:00Z"))).toBe("Boa noite")
  })

  it("resume a madrugada com atendimentos, consultas e quem espera", () => {
    const d = dados({
      madrugada: { atendidos: 23, consultasMarcadas: 3 },
      aguardando: {
        total: 2,
        itens: [
          {
            chatId: "c1",
            nome: "Maria Oliveira",
            ultimaMensagem: "Oi",
            tipo: "TEXT",
            desde: "2026-10-12T00:00:00Z",
            etapa: null,
          },
        ],
      },
    })

    expect(texto(d, MANHA)).toBe(
      "Desde a meia-noite, a assistente atendeu 23 pessoas e marcou 3 consultas. 2 conversas esperam por você, e Maria Oliveira espera há 12 h."
    )
  })

  it("não inventa atividade quando não houve nenhuma", () => {
    expect(texto(dados(), TARDE)).toBe(
      "Hoje, a assistente ainda não atendeu ninguém. Nenhuma conversa espera por você."
    )
  })

  it("concorda o singular", () => {
    const d = dados({
      madrugada: { atendidos: 1, consultasMarcadas: 1 },
      aguardando: {
        total: 1,
        itens: [
          {
            chatId: "c1",
            nome: "José",
            ultimaMensagem: null,
            tipo: null,
            desde: "2026-10-12T17:30:00Z",
            etapa: null,
          },
        ],
      },
    })
    expect(texto(d, TARDE)).toBe(
      "Hoje, a assistente atendeu 1 pessoa e marcou 1 consulta. José espera sua resposta há 30 min."
    )
  })

  it("mede a espera em minutos, horas e dias", () => {
    const agora = Date.parse("2026-10-12T12:00:00Z")
    expect(espera("2026-10-12T11:48:00Z", agora)).toBe("12 min")
    expect(espera("2026-10-12T09:00:00Z", agora)).toBe("3 h")
    expect(espera("2026-10-10T12:00:00Z", agora)).toBe("2 d")
    expect(espera(null, agora)).toBe("")
  })

  it("formata honorários de forma compacta", () => {
    expect(emReaisCompacto(42600)).toBe("R$ 42,6 mil")
    expect(emReaisCompacto(850)).toMatch(/R\$\s850/)
  })

  it("variação só existe com base de comparação", () => {
    expect(variacao(38, 34)).toBe(12)
    expect(variacao(5, 0)).toBeNull()
  })

  it("minigráfico cabe na caixa e não divide por zero", () => {
    expect(caminhoDaSerie([0, 0, 0], 100, 20)).toBe("M0 18 L50 18 L100 18")
    expect(caminhoDaSerie([], 100, 20)).toBe("")
  })
})
