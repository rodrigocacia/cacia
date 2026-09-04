"use server"

import { LegalConsultation } from "@/types/legal-consultation"
import { api } from "../api-client"

export interface GetLegalConsultationResponse {
  data: LegalConsultation
}

export async function getLegalConsultation() {
  try {
    const result = await api
      .get("consultations")
      .json<GetLegalConsultationResponse>()

    return { success: true, data: result, error: null }
  } catch (err: unknown) {
    if (err && typeof err === "object" && "response" in err) {
      const errorBody = await (
        err as { response: { json(): Promise<unknown> } }
      ).response.json()
      return {
        success: false,
        error: errorBody,
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}
