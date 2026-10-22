/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { updateTag } from "next/cache"

import { api } from "../api-client"

interface Address {
  street?: string
  number?: string
  cep?: string
  city?: string
  state?: string
  neighborhood?: string
  complement?: string
}

export interface CreateCustomerRequest {
  name: string
  remotejid: string
  document: string
  email?: string
  legal_name: string
  trade_name: string
  address?: Address[]
  lead_id?: string
}

interface CreateCustomerResponse {
  office: string
  name: string
  remotejid: string
  email: string
  status: string
  last_activity_at: null
  delete_at: null
  _id: string
  events: []
  documents: []
  created_at: string
  updated_at: string
  __v: 0
}

export async function createCustomer({
  name,
  remotejid,
  document,
  email,
  legal_name,
  trade_name,
  address,
  lead_id,
}: CreateCustomerRequest) {
  try {
    // Converter um lead é uma rota própria, não um cliente com `lead_id`: a
    // API marca o lead como convertido e liga o histórico ao novo cliente na
    // mesma transação. Criar um cliente solto deixaria o lead para trás,
    // ativo, e o mesmo contato apareceria nas duas listas.
    //
    // A resposta da conversão é o LEAD atualizado — o cliente criado vem em
    // `customer_id`. Devolvemos `_id` já apontando para o cliente, para quem
    // chama redirecionar para a ficha certa.
    const result = lead_id
      ? await api
          .post(`leads/${lead_id}/convert`, {
            json: {
              document,
              name,
              ...(email && { email }),
              ...(legal_name && { legal_name }),
              ...(trade_name && { trade_name }),
              ...(address && address.length > 0 && { addresses: address }),
            },
          })
          .json<CreateCustomerResponse & { customer_id?: string }>()
          .then((lead) => ({ ...lead, _id: lead.customer_id ?? lead._id }))
      : await api
          .post("customers", {
            json: {
              name,
              remotejid,
              document,
              ...(email && { email }),
              legal_name,
              trade_name,
              ...(address && address.length > 0 && { addresses: address }),
            },
          })
          .json<CreateCustomerResponse>()

    updateTag("customers")
    updateTag("leads")

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
