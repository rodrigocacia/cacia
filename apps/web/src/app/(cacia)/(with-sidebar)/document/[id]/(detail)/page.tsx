import { Icon } from "@/components/icone"

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
      <div className="w-full mt-12 flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="mdi:folder-remove"
            className="w-12 h-12 text-red-400 mx-auto mb-4"
          />
          <p className="text-lg font-medium text-gray-600">
            Pasta não encontrada.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <div className="h-full max-md:hidden">
        <DocumentDetail
          documents={folder?.documents}
          folderId={folderId}
          isSystemFolder={folder?.system}
        />
      </div>

      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_3fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between md:hidden">
        <div className="relative flex flex-1 flex-col px-4 pt-2 pb-10 bg-[#BBE2E7] bg-cover bg-center w-full lg:hidden -mb-6 z-0"></div>

        <div className="bg-white relative z-10 w-full max-md:h-full flex flex-col rounded-t-4xl px-4 py-10 max-lg:pb-0">
          <div className="max-h-[360px]">
            <div className="flex flex-col items-center gap-[17px] relative -top-14">
              <div className="flex w-[86px] h-[86px] items-center justify-center bg-[#ECF7F8] rounded-[30px]">
                <Icon
                  icon="mdi:folder-open"
                  className="w-[46px] h-[46px] text-[#348C98]"
                />
              </div>

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-[18px] text-[#3D3D3D] font-semibold">
                  {folder?.title}
                </h2>
              </div>
            </div>

            <DocumentDetail
              documents={folder?.documents}
              folderId={folderId}
              isSystemFolder={folder?.system}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
