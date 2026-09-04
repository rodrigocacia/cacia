/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { getCurrentOfficeId } from "@/auth/auth"

import { api } from "../api-client"

interface CreateSignatureResponse {
  signature: {
    user: string
    office: string
    plan: string
    type: string
    status: string
    next_recurrence_at: string
    gateway: string
    recurrences: []
    deleted_at: string | null
    _id: string
    created_at: string
    updated_at: string
    __v: number
  }
  recurrence: {
    user: string
    signature: string
    plan: string
    office: string
    total: 12900
    status: string
    gateway: "iopay"
    payment_type: "pix"
    deleted_at: string | null
    _id: string
    created_at: string
    updated_at: string
    __v: number
  }
  transaction: {
    qr_code: string
  }
}

export async function createSignature() {
  const office_id = await getCurrentOfficeId()

  try {
    const result = await api
      .post("signature", {
        json: {
          office: office_id,
          plan: process.env.NEXT_PUBLIC_PLAN_ID,
        },
      })
      .json<CreateSignatureResponse>()

    return { success: true, data: result }
  } catch (err: any) {
    if (err.response) {
      const errorBody = await err.response.json()
      return {
        success: false,
        error: errorBody.message ?? "Erro na requisição",
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}
