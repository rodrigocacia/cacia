import { SWRConfig } from "swr"

import { getConnection } from "@/http/connection/get-connection"
import { getQrCode } from "@/http/connection/qr-code"
import { isConnectionWorking } from "@/utils/connection-status"

import { Detail } from "./detail"

export default async function ProfessionalData() {
  const connection = await getConnection()

  let qrCode = null

  try {
    if (connection && !isConnectionWorking(connection)) {
      qrCode = await getQrCode({ connectionId: connection._id })
    }
  } catch {}

  const connected = isConnectionWorking(connection)

  return (
    <SWRConfig
      value={{
        fallback: {
          connection: connection,
        },
        revalidateOnFocus: true,
        revalidateIfStale: true,
        revalidateOnReconnect: true,
        refreshInterval: !connected ? 1000 : 0,
      }}
    >
      <Detail qrCode={qrCode} />
    </SWRConfig>
  )
}
