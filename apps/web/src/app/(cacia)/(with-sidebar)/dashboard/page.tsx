import { Painel } from "./painel"

export default async function DashboardPage({
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
