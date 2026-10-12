import { Suspense } from "react"

import { Header } from "@/components/header"
import { CaixaDeConversas } from "@/components/conversas"

export default function Conversas() {
  return (
    <div className="w-full max-lg:px-4">
      <Header title="Conversas" />

      {/* useSearchParams exige Suspense no build de produção do Next */}
      <Suspense>
        <CaixaDeConversas />
      </Suspense>
    </div>
  )
}
