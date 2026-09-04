/* eslint-disable @typescript-eslint/no-explicit-any */
import useSWR from "swr"
import ky from "ky"

async function fetchCities<T>(url: string): Promise<T> {
  return await ky.get(url).json<T>()
}

export function useCityByUf<Data = any, Error = any>(
  stateByUserSelected: string
) {
  const uf = stateByUserSelected || "SP"
  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`

  const { data, error, mutate, isLoading } = useSWR<Data, Error>(
    [`cities-${uf}`],
    () => fetchCities<Data>(url)
  )

  return { data, error, mutate, isLoading }
}
