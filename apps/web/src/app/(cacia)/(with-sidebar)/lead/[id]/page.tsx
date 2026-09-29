import { Header } from "@/components/header"
import { FichaDoLead } from "@/components/crm/ficha"

/**
 * Ficha do lead.
 *
 * Casca no servidor, conteúdo no cliente: a ficha muda a cada ação — mover de
 * etapa, etiquetar, agendar — e revalidar tudo pelo servidor a cada uma delas
 * recarregaria a página inteira no meio da edição.
 */
export default async function LeadPorId({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="w-full">
      <Header />

      <div className="mt-4">
        <FichaDoLead id={id} />
      </div>
    </div>
  )
}
