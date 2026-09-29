import { readFileSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

import {
  ProcessStatus,
  ProcessType,
  processStatusConfig,
  processTypeConfig,
} from "./process"
import { DocumentCategory, DocumentStatus, DocumentType } from "./document"
import { EventStatus, EventType } from "./event"
import { NotificationType } from "./notification"
import { ReminderStatus, ReminderType } from "./reminder"
import { AgentStyle } from "./agent"
import { ServiceArea } from "./service"
import { isValidLeadStatus } from "./lead-status"

/**
 * Os enums da interface têm de falar a mesma língua que a API.
 *
 * O QUE ISTO PEGA
 *
 * A API serializa o NOME do membro do enum do Prisma — "ARCHIVED", "DRAFT",
 * "NEW". Os enums daqui guardavam outra coisa: ora o rótulo em português
 * ("Ativo"), ora o valor gravado no banco ("archived"). Nenhum dos dois chega
 * pelo JSON.
 *
 * O efeito não era uma tela quebrada, que se vê. Era pior: a busca no mapa de
 * configuração não achava nada e o componente caía no padrão. Todo processo
 * aparecia como "Ativo" — inclusive os arquivados e os concluídos. Num sistema
 * jurídico, status errado exibido com confiança é o pior tipo de defeito.
 *
 * POR QUE LER O schema.prisma EM VEZ DE IMPORTAR @cacia/database
 *
 * Para não arrastar o Prisma para dentro do grafo de dependências do frontend
 * só por causa de um teste. O schema é a fonte da verdade, e ler o arquivo
 * compara contra ela diretamente.
 */

const SCHEMA = resolve(
  import.meta.dirname,
  "../../../../packages/database/prisma/schema.prisma"
)

/** Os nomes dos membros de um enum do schema, na ordem em que aparecem. */
function membrosNoPrisma(nome: string): string[] {
  const schema = readFileSync(SCHEMA, "utf-8")
  const bloco = new RegExp(`enum ${nome} \\{([^}]*)\\}`).exec(schema)

  if (!bloco?.[1]) {
    throw new Error(`enum ${nome} não existe em schema.prisma`)
  }

  return bloco[1]
    .split("\n")
    .map((linha) => /^\s*([A-Z][A-Z0-9_]*)/.exec(linha)?.[1])
    .filter((membro): membro is string => Boolean(membro))
}

/**
 * Os enums da interface e o enum do Prisma de cada um.
 *
 * `ReminderStatus` e `ReminderType` não estão aqui: os lembretes da interface
 * são um recurso da própria tela, sem enum correspondente no banco.
 */
const PARES: Array<{
  nome: string
  frontend: Record<string, string>
  prisma: string
}> = [
  { nome: "ProcessStatus", frontend: ProcessStatus, prisma: "ProcessStatus" },
  { nome: "ProcessType", frontend: ProcessType, prisma: "ProcessType" },
  {
    nome: "DocumentCategory",
    frontend: DocumentCategory,
    prisma: "DocumentCategory",
  },
  {
    nome: "DocumentStatus",
    frontend: DocumentStatus,
    prisma: "DocumentStatus",
  },
  { nome: "DocumentType", frontend: DocumentType, prisma: "DocumentType" },
  { nome: "EventStatus", frontend: EventStatus, prisma: "EventStatus" },
  { nome: "EventType", frontend: EventType, prisma: "EventType" },
  {
    nome: "NotificationType",
    frontend: NotificationType,
    prisma: "NotificationType",
  },
  { nome: "AgentStyle", frontend: AgentStyle, prisma: "AgentStyle" },
  // Estava de fora, e guardava o valor do banco ("labor"): cadastrar serviço
  // devolvia 400 e a listagem mostrava a área como "Desconhecido".
  { nome: "ServiceArea", frontend: ServiceArea, prisma: "ServiceArea" },
]

describe("enums da interface contra o schema do banco", () => {
  for (const { nome, frontend, prisma } of PARES) {
    describe(nome, () => {
      it("guarda o nome do membro, não um rótulo nem o valor do banco", () => {
        for (const [membro, valor] of Object.entries(frontend)) {
          expect(valor, `${nome}.${membro}`).toBe(membro)
        }
      })

      it("não inventa membro que a API nunca vai mandar", () => {
        const doPrisma = membrosNoPrisma(prisma)

        for (const membro of Object.keys(frontend)) {
          expect(doPrisma, `${nome}.${membro}`).toContain(membro)
        }
      })
    })
  }

  /**
   * Membro que existe no banco e não na interface não quebra nada sozinho —
   * cai no rótulo padrão. Mas é assim que um status novo entra em produção
   * exibido como "Outro", então a lista fica declarada: quem acrescentar um
   * membro ao schema tem de vir aqui e decidir o que a tela mostra.
   */
  const LACUNAS_CONHECIDAS: Record<string, string[]> = {
    ProcessStatus: [],
    ProcessType: [],
    DocumentCategory: [],
    DocumentStatus: [],
    DocumentType: [],
    EventStatus: [],
    EventType: [],
    NotificationType: ["ATTACHMENT_DOC"],
    AgentStyle: [],
    ServiceArea: [],
  }

  for (const { nome, frontend, prisma } of PARES) {
    it(`${nome}: as lacunas são as declaradas`, () => {
      const naInterface = new Set(Object.keys(frontend))
      const faltando = membrosNoPrisma(prisma).filter(
        (membro) => !naInterface.has(membro)
      )

      expect(faltando.sort()).toEqual(
        [...(LACUNAS_CONHECIDAS[nome] ?? [])].sort()
      )
    })
  }

  it("LeadStatus aceita o que a API manda", () => {
    for (const membro of membrosNoPrisma("LeadStatus")) {
      expect(isValidLeadStatus(membro), membro).toBe(true)
    }

    expect(isValidLeadStatus("new")).toBe(false)
  })

  /**
   * O defeito visível, escrito como teste: a API manda a string "ARCHIVED" e a
   * tela tem de dizer "Arquivado". Antes o mapa não achava nada e o
   * ProcessBadge caía no padrão, exibindo "Ativo" para um processo arquivado.
   */
  it.each([
    ["PENDING", "Pendente"],
    ["ACTIVE", "Ativo"],
    ["ARCHIVED", "Arquivado"],
    ["CONCLUDED", "Concluído"],
    ["FINISHED", "Finalizado"],
  ])("o status %s que vem da API vira o rótulo %s", (daApi, rotulo) => {
    expect(processStatusConfig[daApi as ProcessStatus]?.label).toBe(rotulo)
  })

  it("o tipo TRABALHISTA que vem da API vira o rótulo Trabalhista", () => {
    expect(processTypeConfig["TRABALHISTA" as ProcessType]).toBe("Trabalhista")
  })

  it("ReminderStatus e ReminderType são da tela, não do banco", () => {
    for (const [membro, valor] of Object.entries({
      ...ReminderStatus,
      ...ReminderType,
    })) {
      expect(valor, membro).toBe(membro)
    }
  })
})
