"use client"

import Image from "next/image"

import { Form } from "./form"
import { GetQrCodeResponse } from "@/http/connection/qr-code"

interface WhatsappConnectionProps {
  qrCode: GetQrCodeResponse | null
}

export function WhatsappConnection({ qrCode }: WhatsappConnectionProps) {
  return (
    <div className="w-full h-screen px-8 py-10 max-lg:px-0 max-lg:py-0">
      <main className="w-full h-fit max-lg:h-full pb-6 max-lg:pb-0  grid grid-cols-[2fr_1fr] max-lg:flex max-lg max-lg:flex-col max-lg:justify-between">
        <div className="relative flex flex-1 flex-col px-4 pt-10 pb-10 justify-end gap-3.5 bg-[url('/bg-login.png')] bg-cover bg-center h-[260px] w-full lg:hidden -mb-6 z-0">
          <h3 className="text-2xl text-white font-semibold">
            {qrCode ? "Escaneie e conecte" : "Conecte seu WhatsApp"}
          </h3>

          <p className="text-[18px] text-white">
            {qrCode
              ? "Abra o WhatsApp > Aparelhos conectados > Conectar Aparelho"
              : "É por aqui que falo com clientes."}
          </p>
        </div>

        <Form qrCode={qrCode} />

        <div className="relative flex flex-col items-center bg-[url('/bg-login.png')] bg-cover bg-center h-full w-full rounded-r-4xl max-lg:hidden -ml-6 z-0">
          <div className="w-full flex items-start justify-center">
            <Image src="/mockup-pc.png" alt="mockup" width={420} height={425} />
          </div>

          <div className="flex flex-col gap-3.5 mb-20 px-18">
            <div className="flex flex-col items-center justify-center gap-2">
              <h3 className="text-2xl text-[#348C98] font-semibold">
                {qrCode ? "Escaneie e conecte" : "Conecte seu WhatsApp"}
              </h3>
            </div>

            <p className="text-lg text-[#BDBDBD] text-center">
              {qrCode
                ? "Escaneie o QR Code para conectar seu WhatsApp"
                : "É por aqui que falo com clientes."}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
