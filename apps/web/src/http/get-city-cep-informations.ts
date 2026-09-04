"use server"

import ky from "ky"

interface CepInfo {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge: string
  gia: string
  ddd: string
  siafi: string
}

export async function getCepsByCity(
  uf: string,
  city: string,
  street: string = "rua"
): Promise<CepInfo[]> {
  const url = `https://viacep.com.br/ws/${encodeURIComponent(
    uf
  )}/${encodeURIComponent(city)}/${encodeURIComponent(street)}/json/`

  const result = await ky.get(url).json<CepInfo[]>()

  return result
}
