import { describe, expect, it } from "vitest"

import { ultimoContato } from "./ultimo-contato"

// Datas montadas no fuso local para o teste não depender do fuso da máquina.
const agora = new Date(2026, 9, 12, 15, 0)

describe("ultimoContato", () => {
  it("usa minutos e horas no mesmo dia", () => {
    expect(
      ultimoContato(new Date(2026, 9, 12, 14, 59, 40).toISOString(), agora)
    ).toBe("agora")
    expect(
      ultimoContato(new Date(2026, 9, 12, 14, 48).toISOString(), agora)
    ).toBe("há 12 min")
    expect(
      ultimoContato(new Date(2026, 9, 12, 12, 30).toISOString(), agora)
    ).toBe("há 2 h")
  })

  it("diz ontem e, antes disso, a data curta", () => {
    expect(
      ultimoContato(new Date(2026, 9, 11, 23, 0).toISOString(), agora)
    ).toBe("ontem")
    expect(
      ultimoContato(new Date(2026, 9, 2, 10, 0).toISOString(), agora)
    ).toBe("02/10")
    expect(
      ultimoContato(new Date(2025, 11, 30, 10, 0).toISOString(), agora)
    ).toBe("30/12/25")
  })

  it("mostra travessão sem data", () => {
    expect(ultimoContato(null, agora)).toBe("—")
    expect(ultimoContato(undefined, agora)).toBe("—")
    expect(ultimoContato("não é data", agora)).toBe("—")
  })
})
