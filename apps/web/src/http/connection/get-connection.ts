"use server"

import { api } from "../api-client"

import { Connection } from "@/types/connection"

export interface GetConnectionResponse {
  data: Connection[]
}

export async function getConnection() {
  const result = await api
    .get("connections", {
      next: {
        tags: ["connection"],
        revalidate: 10,
      },
    })
    .json<GetConnectionResponse>()

  const connection = result.data[0]

  return connection
}
