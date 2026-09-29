import { Header } from "@/components/header"
import { AssistenteDeImportacao } from "@/components/crm/importacao"

export default function ImportarLeads() {
  return (
    <div className="w-full max-lg:px-4">
      <Header />

      <div className="mt-6">
        <AssistenteDeImportacao />
      </div>
    </div>
  )
}
