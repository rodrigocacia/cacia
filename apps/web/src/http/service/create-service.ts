/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface CreateServiceRequest {
  title: string
  description: string
  area: string
  value_type: string
  value_fixed: number
  value_float: number | null
  value_detail: string
}

interface CreateServiceResponse {
  office: string
  title: string
  description: string
  area: string
  value_type: string
  value_fixed: number | null
  value_float: number | null
  value_detail: string
  status: boolean
  deleted_at: string | null
  _id: string
  created_at: string
  updated_at: string
  __v: number
}

export async function createService({
  title,
  description,
  area,
  value_type,
  value_fixed,
  value_float,
  value_detail,
}: CreateServiceRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .post("service", {
        json: {
          office_id,
          title,
          description,
          area,
          value_type,
          value_fixed,
          value_float,
          value_detail,
          status: true,
        },
      })
      .json<CreateServiceResponse>()

    revalidateTag("service")

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
