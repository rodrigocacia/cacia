import { PropsWithChildren } from "react"

import { Header } from "@/components/header"
import { Sidebar } from "./sidebar"
import { getFolderById } from "@/http/folder/get-folder-by-id"
import { Breadcrumbs } from "@/components/ui/custom-breadcrumb"
import { folderDetailsCrumbs } from "@/constants/breadcrumbs"
import { HeaderToGoBack } from "@/components/header-to-go-back"

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: folderId } = await params

  let folder
  try {
    folder = await getFolderById(folderId)
  } catch {
    return (
      <div className="w-full h-fit flex flex-col">
        <div className="max-md:hidden">
          <Header title="Documentos" />
        </div>

        <div className="md:hidden">
          <HeaderToGoBack link="/document" />
        </div>

        <div className="w-full md:grid md:grid-cols-app mt-8 max-md:mt-0">
          <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-fit flex flex-col">
      <div className="max-md:hidden">
        <Header title="Documentos" />

        <Breadcrumbs crumbs={folderDetailsCrumbs(folder?._id, folder?.title)} />
      </div>

      <div className="md:hidden">
        <HeaderToGoBack link="/document" />
      </div>

      <div className="w-full md:grid md:grid-cols-app mt-8 max-md:mt-0">
        <Sidebar name={folder?.title} id={folder?._id} />

        <main className="px-4 pb-12 max-md:px-0 lg:col-start-2 max-md:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
