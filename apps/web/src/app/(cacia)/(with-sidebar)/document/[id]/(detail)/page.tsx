import { FolderX } from "lucide-react"

import { getFolderById } from "@/http/folder/get-folder-by-id"

import { DocumentDetail } from "./detail"

export default async function FolderDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: folderId } = await params

  let folder
  try {
    folder = await getFolderById(folderId)
  } catch {
    return (
      <div className="mt-12 flex w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <FolderX size={36} strokeWidth={1.5} className="text-tinta-3" />
          <p className="text-[14.5px] font-medium text-tinta-2">
            Pasta não encontrada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <DocumentDetail
      documents={folder?.documents}
      folderId={folderId}
      isSystemFolder={folder?.system}
    />
  )
}
