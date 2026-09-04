import { api } from "../api-client"

export interface DisconnectResponse {
  success: boolean
  message: string
}

export async function disconnect({ connectionId }: { connectionId: string }) {
  try {
    const result = await api
      .delete(`connections/${connectionId}`, {
        next: {
          tags: ["connection"],
          revalidate: 10,
        },
      })
      .json<DisconnectResponse>()

    return result
  } catch (error) {
    console.error("Erro ao desconectar:", error)
    throw error
  }
}
