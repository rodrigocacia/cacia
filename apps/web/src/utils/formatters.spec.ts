import { describe, expect, it } from "vitest"

import { formatName, nomeParaExibir } from "./formatters"

describe("nomeParaExibir", () => {
  it("põe o nome em caixa de título, com partículas em minúscula", () => {
    expect(nomeParaExibir("JOÃO DA SILVA (EDITADO)")).toBe(
      "João da Silva (Editado)"
    )
    expect(nomeParaExibir("maria dos santos e souza")).toBe(
      "Maria dos Santos e Souza"
    )
  })

  it("capitaliza cada parte de nomes compostos e acentuados", () => {
    expect(nomeParaExibir("  ANA-CLARA   ÉVORA ")).toBe("Ana-Clara Évora")
    expect(nomeParaExibir("DA COSTA")).toBe("Da Costa")
  })

  it("preserva a caixa mista digitada pela pessoa", () => {
    expect(nomeParaExibir("Dra. Helena Teste QA")).toBe("Dra. Helena Teste QA")
    expect(nomeParaExibir("João da Silva (editado)")).toBe(
      "João da Silva (editado)"
    )
  })

  it("devolve vazio para valores ausentes", () => {
    expect(nomeParaExibir("")).toBe("")
    expect(nomeParaExibir(undefined)).toBe("")
    expect(nomeParaExibir(null)).toBe("")
  })

  it("não altera formatName, que continua em caixa alta", () => {
    expect(formatName(" joão ")).toBe("JOÃO")
  })
})
