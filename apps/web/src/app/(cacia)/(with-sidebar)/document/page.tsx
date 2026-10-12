import { Suspense } from "react"
import { getFolders } from "@/http/folder/get-folders"
import { Header } from "@/components/header"
import { Form } from "./new/form"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { DocumentSortSelect } from "./components/document-sort-select"
import { ClientDocumentGrid } from "./components/client-document-grid"
import { PageHeader } from "@/components/ui/page-header"
import { ListToolbar } from "@/components/ui/list-toolbar"

export default async function Document({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; sortBy?: string }>
}) {
  const { page, search, sortBy } = await searchParams
  const folders = await getFolders({
    page: Number(page) || 1,
    search,
    sortBy: sortBy || "newest",
  })

  return (
    <div className="w-full max-lg:px-4">
      <Header title="Documentos" />

      <PageHeader
        title="Documentos"
        count={folders?.totalItems}
        description="Pastas, contratos e arquivos enviados pelos clientes."
        action={
          <div className="max-md:hidden">
            <Form />
          </div>
        }
      />

      <div className="mt-5">
        <ListToolbar>
          <Suspense fallback="Carregando...">
            <CustomSearchFilter placeholder="Buscar pelo nome do documento ou cliente..." />
          </Suspense>

          <DocumentSortSelect />
        </ListToolbar>
      </div>

      <ClientDocumentGrid folders={folders?.data ?? []} />
      <div className="md:hidden">
        <Form />
      </div>
    </div>
  )
}
