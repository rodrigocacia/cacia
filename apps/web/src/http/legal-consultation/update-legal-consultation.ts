/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface UpdateLegalConsultationRequest {
  is_charged: boolean
  consultation_value: number
  requires_payment_to_schedule: boolean
  lawyer_pix_key: string
}

interface UpdateLegalConsultationResponse {
  is_charged: string
  consultation_value: string
  requires_payment_to_schedule: string
  lawyer_pix_key: string
}

export async function updateLegalConsultation({
  is_charged,
  consultation_value,
  requires_payment_to_schedule,
  lawyer_pix_key,
}: UpdateLegalConsultationRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .patch(`consultation/${office_id}`, {
        json: {
          is_charged,
          consultation_value,
          requires_payment_to_schedule,
          lawyer_pix_key,
        },
      })
      .json<UpdateLegalConsultationResponse>()

    revalidateTag("legal-consultation")

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody,
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}
