import useSWR from "swr"
import { getCepsByCity } from "@/http/get-city-cep-informations"

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

export function useCepsByCity(uf: string, city: string) {
  const shouldFetch = uf && city && uf.length >= 2 && city.length >= 2

  const { data, error, isLoading, mutate } = useSWR<CepInfo[]>(
    shouldFetch ? [`ceps-${uf}-${city}`] : null,
    () => getCepsByCity(uf, city),
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    }
  )

  return {
    ceps: data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}
