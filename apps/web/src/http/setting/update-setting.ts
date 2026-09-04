/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

export interface UpdateSettingRequest {
  setting_id: string
  n_w_c_new_event: boolean
  n_w_c_update_process: boolean
  n_w_a_new_lead: boolean
  n_w_a_new_mark_lead: boolean
  n_w_a_new_mark_customer: boolean
  n_w_a_new_event: boolean
  n_w_a_update_process: boolean
  n_w_a_update_system: boolean
}

interface UpdateSettingResponse {
  _id: string
  office: string
  n_w_c_new_event: boolean
  n_w_c_update_process: boolean
  n_w_a_new_lead: boolean
  n_w_a_new_mark_lead: boolean
  n_w_a_new_mark_customer: boolean
  n_w_a_new_event: boolean
  n_w_a_update_process: boolean
  n_w_a_update_system: boolean
  deleted_at: null
  created_at: string
  updatedat: string
  __v: number
}

export async function updateSetting({
  setting_id,
  n_w_c_new_event,
  n_w_c_update_process,
  n_w_a_new_lead,
  n_w_a_new_mark_lead,
  n_w_a_new_mark_customer,
  n_w_a_new_event,
  n_w_a_update_process,
  n_w_a_update_system,
}: UpdateSettingRequest) {
  try {
    const office_id = await getCurrentOfficeId()

    const result = await api
      .patch(`setting/${setting_id}`, {
        json: {
          office_id,
          n_w_c_new_event,
          n_w_c_update_process,
          n_w_a_new_lead,
          n_w_a_new_mark_lead,
          n_w_a_new_mark_customer,
          n_w_a_new_event,
          n_w_a_update_process,
          n_w_a_update_system,
        },
      })
      .json<UpdateSettingResponse>()

    revalidateTag("setting")

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
