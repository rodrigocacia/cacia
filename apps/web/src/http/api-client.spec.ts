import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

/**
 * O encanamento do cliente HTTP, contra um servidor de verdade.
 *
 * O adaptador tem testes próprios; aqui o que se verifica é se ele está
 * LIGADO — se o cabeçalho do escritório sai, se o `office_id` é removido do
 * corpo e da query, e se a resposta chega traduzida a quem chamou.
 *
 * Um erro aqui não quebra uma tela: quebra todas ao mesmo tempo.
 */

vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (nome: string) =>
        nome === "token"
          ? { value: "token-de-teste" }
          : nome === "office_id"
            ? { value: "escritorio-1" }
            : undefined,
    }),
}))

interface Recebida {
  metodo: string
  caminho: string
  cabecalhos: Record<string, string | undefined>
  corpo: unknown
}

let servidor: Server
let recebidas: Recebida[] = []
let responder: () => { status: number; corpo: unknown }

beforeAll(async () => {
  servidor = createServer((req, res) => {
    const pedacos: Buffer[] = []

    req.on("data", (pedaco: Buffer) => pedacos.push(pedaco))
    req.on("end", () => {
      const texto = Buffer.concat(pedacos).toString()

      recebidas.push({
        metodo: req.method ?? "",
        caminho: req.url ?? "",
        cabecalhos: {
          authorization: req.headers.authorization,
          "x-office-id": req.headers["x-office-id"] as string | undefined,
        },
        corpo: texto ? (JSON.parse(texto) as unknown) : undefined,
      })

      const { status, corpo } = responder()

      res.writeHead(status, { "content-type": "application/json" })
      res.end(JSON.stringify(corpo))
    })
  })

  await new Promise<void>((resolve) =>
    servidor.listen(0, "127.0.0.1", () => resolve())
  )

  const { port } = servidor.address() as AddressInfo
  process.env.NEXT_PUBLIC_API_URL = `http://127.0.0.1:${port}`
})

afterAll(() => {
  servidor.close()
})

/** Import tardio: o cliente lê a variável de ambiente ao ser carregado. */
async function cliente() {
  const { api } = await import("./api-client")
  return api
}

describe("cliente HTTP", () => {
  it("envia o escritório no cabeçalho, nunca na query", async () => {
    recebidas = []
    responder = () => ({ status: 200, corpo: { id: "c1" } })

    const api = await cliente()
    await api.get("customers?office_id=escritorio-1&page=2").json()

    const pedido = recebidas[0]!
    expect(pedido.cabecalhos["x-office-id"]).toBe("escritorio-1")
    expect(pedido.caminho).toBe("/customers?page=2")
    expect(pedido.caminho).not.toContain("office_id")
  })

  it("envia o token", async () => {
    recebidas = []
    responder = () => ({ status: 200, corpo: {} })

    const api = await cliente()
    await api.get("customers").json()

    expect(recebidas[0]!.cabecalhos.authorization).toBe("Bearer token-de-teste")
  })

  it("tira o escritório do corpo e converte as chaves", async () => {
    // A API valida com `forbidNonWhitelisted`: `office_id` no corpo devolve
    // 400, não é ignorado. Era o que quebrava toda criação de registro.
    recebidas = []
    responder = () => ({ status: 201, corpo: { id: "c1" } })

    const api = await cliente()
    await api
      .post("customers", {
        json: {
          office_id: "escritorio-1",
          name: "Joana",
          legal_name: "Joana Silva ME",
        },
      })
      .json()

    expect(recebidas[0]!.corpo).toEqual({
      name: "Joana",
      legalName: "Joana Silva ME",
    })
  })

  it("traduz a resposta e acrescenta `_id`", async () => {
    recebidas = []
    responder = () => ({
      status: 200,
      corpo: { id: "c1", legalName: "Joana Silva ME", createdAt: "2027-01-01" },
    })

    const api = await cliente()
    const resposta = await api.get("customers/c1").json<{
      _id: string
      legal_name: string
      created_at: string
    }>()

    expect(resposta._id).toBe("c1")
    expect(resposta.legal_name).toBe("Joana Silva ME")
    expect(resposta.created_at).toBe("2027-01-01")
  })

  it("converte a listagem para o formato de página da interface", async () => {
    recebidas = []
    responder = () => ({
      status: 200,
      corpo: {
        data: [{ id: "c1", name: "Joana" }],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    })

    const api = await cliente()
    const resposta = await api.get("customers").json<{
      data: { _id: string }[]
      totalItems: number
      perPage: number
    }>()

    expect(resposta.data[0]?._id).toBe("c1")
    expect(resposta.totalItems).toBe(1)
    expect(resposta.perPage).toBe(20)
  })

  it("lista sem paginação (array puro) chega como página legada", async () => {
    recebidas = []
    responder = () => ({
      status: 200,
      corpo: [{ id: "cx1", provider: "WAHA", wahaState: "WORKING" }],
    })

    const api = await cliente()
    const resposta = await api.get("connections").json<{
      data: { _id: string; waha_state: string }[]
      totalItems: number
    }>()

    expect(resposta.data[0]?._id).toBe("cx1")
    expect(resposta.data[0]?.waha_state).toBe("WORKING")
    expect(resposta.totalItems).toBe(1)
  })

  it("não mexe no corpo de erro — os catch da aplicação já o leem assim", async () => {
    recebidas = []
    responder = () => ({
      status: 400,
      corpo: { statusCode: 400, message: ["document deve ter 11 dígitos"] },
    })

    const api = await cliente()

    await expect(
      api.post("customers", { json: { name: "x" } }).json()
    ).rejects.toMatchObject({ response: { status: 400 } })
  })
})
