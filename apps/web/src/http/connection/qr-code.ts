"use server"

import { api } from "../api-client"

export interface GetQrCodeResponse {
  data: {
    qr_code: string
    base64: string
  }
}

export async function getQrCode({ connectionId }: { connectionId: string }) {
  const result = await api
    .get(`connections/${connectionId}/qrcode?ts=${Date.now()}`, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
    .json<GetQrCodeResponse>()

  return result
}
