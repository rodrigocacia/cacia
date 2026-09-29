import { describe, expect, it } from "vitest"

import {
  alturaDaBarra,
  escalaDoGrafico,
  formatarData,
  formatarReais,
  formatarVariacao,
  hojeEmBrasilia,
  intervaloDoMesPassado,
  passoDosRotulos,
  rotuloDoDia,
} from "./consumo-de-ia"

// O Intl separa "R$" do número com espaço não separável
const semNbsp = (texto: string) => texto.replace(/ /g, " ")

describe("formatarReais", () => {
  it("usa duas casas no valor comum", () => {
    expect(semNbsp(formatarReais(1234.5))).toBe("R$ 1.234,50")
    expect(semNbsp(formatarReais(0))).toBe("R$ 0,00")
  })

  it("não mostra frações de centavo como R$ 0,00", () => {
    expect(semNbsp(formatarReais(0.0087))).toBe("R$ 0,0087")
    expect(semNbsp(formatarReais(0.00412))).toBe("R$ 0,0041")
  })
})

describe("formatarVariacao", () => {
  it("sinaliza alta e baixa", () => {
    expect(formatarVariacao(12.54)).toBe("+12,5%")
    expect(formatarVariacao(-3)).toBe("-3%")
    expect(formatarVariacao(0)).toBe("0%")
  })

  it("descarta a casa decimal acima de 100%", () => {
    expect(formatarVariacao(1803.3)).toBe("+1.803%")
  })

  it("devolve nulo sem base de comparação", () => {
    expect(formatarVariacao(null)).toBeNull()
  })
})

describe("datas", () => {
  it("formata sem aplicar fuso", () => {
    expect(formatarData("2026-09-01")).toBe("01/09/2026")
  })

  it("calcula o mês passado, inclusive na virada do ano", () => {
    expect(intervaloDoMesPassado("2026-09-29")).toEqual({
      de: "2026-08-01",
      ate: "2026-08-31",
    })
    expect(intervaloDoMesPassado("2026-01-10")).toEqual({
      de: "2025-12-01",
      ate: "2025-12-31",
    })
    expect(intervaloDoMesPassado("2028-03-01")).toEqual({
      de: "2028-02-01",
      ate: "2028-02-29",
    })
  })

  it("fecha o dia no fuso de Brasília", () => {
    // 01:30 UTC ainda é o dia anterior em Brasília (UTC-3)
    expect(hojeEmBrasilia(new Date("2026-10-01T01:30:00Z"))).toBe("2026-09-30")
  })

  it("rotula o eixo conforme o tamanho do período", () => {
    expect(rotuloDoDia("2026-09-07", 30)).toBe("07")
    expect(rotuloDoDia("2026-09-07", 90)).toBe("07/09")
    expect(passoDosRotulos(31)).toBe(1)
    expect(passoDosRotulos(60)).toBe(7)
    expect(passoDosRotulos(365)).toBe(30)
  })
})

describe("escalaDoGrafico", () => {
  it("arredonda o topo para um valor legível acima do máximo", () => {
    expect(escalaDoGrafico(2.37)).toEqual({ topo: 3, marcas: [0, 1, 2, 3] })
    expect(escalaDoGrafico(0.12)).toEqual({
      topo: 0.15,
      marcas: [0, 0.05, 0.1, 0.15],
    })
  })

  it("não cria divisão extra quando o máximo cai numa marca", () => {
    expect(escalaDoGrafico(4).topo).toBe(4)
  })

  it("lida com período sem consumo", () => {
    expect(escalaDoGrafico(0)).toEqual({ topo: 0, marcas: [0] })
  })
})

describe("alturaDaBarra", () => {
  it("escala pelo topo e mantém visível o valor pequeno", () => {
    expect(alturaDaBarra(1.5, 3)).toBe(50)
    expect(alturaDaBarra(0.001, 3)).toBe(2)
    expect(alturaDaBarra(0, 3)).toBe(0)
    expect(alturaDaBarra(1, 0)).toBe(0)
  })
})
