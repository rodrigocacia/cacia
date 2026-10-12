import { Header } from "@/components/header"
import { Inicio } from "@/components/inicio"

export default function DashboardPage() {
  return (
    <div className="w-full max-lg:px-4">
      <Header title="Início" />
      <Inicio />
    </div>
  )
}
