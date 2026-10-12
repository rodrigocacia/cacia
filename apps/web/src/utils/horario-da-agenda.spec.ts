import { format, getHours, getMinutes } from "date-fns"
import { describe, expect, it } from "vitest"

import { horarioDaAgenda } from "./horario-da-agenda"

describe("horarioDaAgenda", () => {
  it("mantém o horário de parede do texto, sem converter fuso", () => {
    const inicio = horarioDaAgenda("2026-10-12T09:30:00.000Z")

    expect(getHours(inicio)).toBe(9)
    expect(getMinutes(inicio)).toBe(30)
    expect(format(inicio, "yyyy-MM-dd HH:mm")).toBe("2026-10-12 09:30")
  })

  it("não troca o dia de eventos perto da meia-noite", () => {
    expect(
      format(horarioDaAgenda("2026-10-12T23:15:00.000Z"), "yyyy-MM-dd HH:mm")
    ).toBe("2026-10-12 23:15")
    expect(
      format(horarioDaAgenda("2026-10-13T00:30:00.000Z"), "yyyy-MM-dd HH:mm")
    ).toBe("2026-10-13 00:30")
  })
})
