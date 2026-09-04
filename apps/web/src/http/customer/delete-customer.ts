/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { revalidateTag } from "next/cache"
import { api } from "../api-client"

export async function deleteCustomer(customerId: string) {
  try {
    const response = await api.delete(`customer/${customerId}`)
    const contentType = response.headers.get("content-type")

    let data: any = null

    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = await response.text()
    }

    revalidateTag("customers")

    return {
      success: true,
      data,
    }
  } catch (err: any) {
    if (err.response) {
      let errorBody

      try {
        errorBody = await err.response.json()
      } catch {
        errorBody = await err.response.text()
      }

      return {
        success: false,
        error:
          typeof errorBody === "string"
            ? errorBody
            : (errorBody?.message ?? "Erro na requisição"),
      }
    }

    console.error("Erro inesperado:", err)
    return { success: false, error: "Erro interno no servidor" }
  }
}
