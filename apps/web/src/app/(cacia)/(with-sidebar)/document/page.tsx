import { Suspense } from "react"
import { Icon } from "@iconify/react/dist/iconify.js"
import { getFolders } from "@/http/folder/get-folders"
import { Header } from "@/components/header"
import { Form } from "./new/form"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"
import { CustomSearchFilter } from "@/components/ui/custom-search-filter"
import { documentCrumbs } from "@/constants/breadcrumbs"
import { DocumentSortSelect } from "./components/document-sort-select"
import { ClientDocumentGrid } from "./components/client-document-grid"

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
      <Breadcrumbs crumbs={documentCrumbs} />
      <div className="w-full flex items-start justify-between mt-8 max-md:hidden">
        <div className="flex gap-2">
          <Icon
            icon="mdi:file-document-outline"
            className="text-[#BDBDBD] w-8 h-8"
          />
          <h3 className="text-[18px] text-[#3D3D3D] font-bold">Documentos</h3>
        </div>
        <Form />
      </div>
      <div className="flex max-md:flex-col items-center gap-3">
        <Suspense fallback="Carregando...">
          <CustomSearchFilter placeholder="Buscar pelo nome do documento ou cliente..." />
        </Suspense>
        <DocumentSortSelect />
      </div>
      <div className="w-full flex items-center gap-2 mt-[26px]">
        <Icon icon="mdi:folder-open" className="w-6 h-6 text-[#BDBDBD]" />
        <h3 className="text-base text-[#3D3D3D] font-bold">
          Todas as pastas ({folders?.totalItems})
        </h3>
      </div>
      <ClientDocumentGrid folders={folders?.data ?? []} />
      <div className="md:hidden">
        <Form />
      </div>
    </div>
  )
}
