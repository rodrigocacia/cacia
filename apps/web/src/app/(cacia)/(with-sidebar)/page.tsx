import { Painel } from "./dashboard/painel"

/**
 * A raiz mostra a mesma tela inicial de /dashboard — era uma cópia do código
 * dela, já divergida. Ver dashboard/painel.tsx.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string
    startDate?: string
    endDate?: string
  }>
}) {
  const { period, startDate, endDate } = await searchParams

  return <Painel period={period} startDate={startDate} endDate={endDate} />
}
