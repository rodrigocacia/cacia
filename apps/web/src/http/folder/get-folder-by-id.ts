import { Folder as GetFolderByIdResponse } from "@/types/folder"
import { api } from "../api-client"

export async function getFolderById(folderId: string) {
  const result = await api
    .get(`folder/${folderId}`)
    .json<GetFolderByIdResponse>()

  return result
}
