import { getConnection } from "@/http/connection/get-connection"
import { Steps } from "./steps"
import { getQrCode } from "@/http/connection/qr-code"
import { isConnectionWorking } from "@/utils/connection-status"

export default async function SignIn() {
  const connection = await getConnection()

  let qrCode = null

  try {
    if (connection && !isConnectionWorking(connection)) {
      qrCode = await getQrCode({ connectionId: connection._id })
    }
  } catch {}

  return (
    <div className="w-full h-full">
      <Steps qrCode={qrCode} />
    </div>
  )
}
