"use server"

import { api } from "../api-client"

export interface GetOfficeByIdResponse {
  deleted_at: null
  _id: string
  user: string
  name: string
  description: string
  document: string
  oab_number: string
  legal_name: string
  trade_name: string
  remotejid: string
  address: [
    {
      city: string
      number: string
      state: string
      neighborhood: string
      street: string
      cep: string
      complement: string
    },
  ]
  status: string
  delete_at: null
  created_at: string
  updated_at: string
  __v: number
}

/** O que a API devolve, antes do ajuste de nome do campo de endereço. */
type EscritorioDaApi = Omit<GetOfficeByIdResponse, "address"> & {
  addresses?: GetOfficeByIdResponse["address"]
}

export async function getOfficeById() {
  const resposta = await api.get("offices/current").json<EscritorioDaApi>()

  // A API chama de `addresses`; a interface inteira lê `address`. Renomear
  // aqui evita caçar o campo em cada tela que o consome.
  const { addresses, ...escritorio } = resposta

  const result: GetOfficeByIdResponse = {
    ...escritorio,
    address: addresses ?? ([] as unknown as GetOfficeByIdResponse["address"]),
  }

  return result
}
