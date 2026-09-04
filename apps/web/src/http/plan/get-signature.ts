"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface GetProcessResponse {
  data: {
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
}

export async function getSignature() {
  const officeId = await getCurrentOfficeId()

  const result = await api
    .get(`signature/${officeId}`, {
      cache: "no-store",
      next: {
        tags: ["signature"],
      },
    })
    .json<GetProcessResponse>()

  return result
}
