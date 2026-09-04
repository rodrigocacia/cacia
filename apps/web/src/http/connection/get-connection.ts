"use server"

import { api } from "../api-client"

import { getCurrentOfficeId } from "@/auth/auth"

import { Connection } from "@/types/connection"

export interface GetConnectionResponse {
  data: Connection[]
}

export async function getConnection() {
  const officeId = await getCurrentOfficeId()

  const result = await api
    .get(`connection/?office_id=${officeId}`, {
      next: {
        tags: ["connection"],
        revalidate: 10,
      },
    })
    .json<GetConnectionResponse>()

  const connection = result.data[0]

  return connection
}
