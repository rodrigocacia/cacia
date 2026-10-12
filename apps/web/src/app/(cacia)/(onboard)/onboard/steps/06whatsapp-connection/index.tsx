"use client"

import { Form } from "./form"
import { GetQrCodeResponse } from "@/http/connection/qr-code"

interface WhatsappConnectionProps {
  qrCode: GetQrCodeResponse | null
}

export function WhatsappConnection({ qrCode }: WhatsappConnectionProps) {
  return <Form qrCode={qrCode} />
}
