import { PropsWithChildren } from "react"

import { Header } from "@/components/header"
import { getFolderById } from "@/http/folder/get-folder-by-id"

import { CabecalhoDaPasta } from "./cabecalho"

export default async function ProfileLayout({
  children,
  params,
}: PropsWithChildren<{ params: Promise<{ id: string }> }>) {
  const { id: folderId } = await params

  let folder = null
  try {
    folder = await getFolderById(folderId)
  } catch {
    folder = null
  }

  return (
    <div className="flex h-fit w-full flex-col max-lg:px-4">
      <Header title="Documentos" name={folder?.title} />

      <CabecalhoDaPasta
        name={folder?.title}
        id={folder?._id}
        total={folder?.documents?.length}
        sistema={folder?.system}
      />

      <main className="w-full pt-6 pb-12">{children}</main>
    </div>
  )
}
