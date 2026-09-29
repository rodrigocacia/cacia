import { Suspense } from "react"

import { Icon } from "@/components/icone"
import { Header } from "@/components/header"
import { PageHeader } from "@/components/ui/page-header"
import { CaixaDeConversas } from "@/components/conversas"

export default function Conversas() {
  return (
    <div className="w-full max-lg:px-4">
      <Header />

      <div className="mt-2 mb-4 max-md:hidden">
        <PageHeader
          icon={
            <Icon icon="mdi:forum-outline" className="h-5 w-5 text-[#348C98]" />
          }
          title="Conversas"
        />
      </div>

      {/* useSearchParams exige Suspense no build de produção do Next */}
      <Suspense>
        <CaixaDeConversas />
      </Suspense>
    </div>
  )
}
