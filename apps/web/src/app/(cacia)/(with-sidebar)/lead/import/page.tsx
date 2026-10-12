import { Header } from "@/components/header"
import { AssistenteDeImportacao } from "@/components/crm/importacao"

export default function ImportarLeads() {
  return (
    <div className="w-full max-lg:px-4">
      <Header title="Leads" />

      <div className="mt-2">
        <AssistenteDeImportacao />
      </div>
    </div>
  )
}
