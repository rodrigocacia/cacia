"use client"

import { useEffect, useState } from "react"

import QRCode from "react-qr-code"

import { Icon } from "@/components/icone"

import { useSignature } from "@/http/hooks/signature"

import { Spinner } from "@/components/ui/sppiner"
import { Check, Copy } from "lucide-react"
import { trackPurchase } from "@/utils/facebook-pixel"

interface PaymentDetailProps {
  close: () => void
  setOpenToast: (open: boolean) => void
}

export function PaymentDetail({ close, setOpenToast }: PaymentDetailProps) {
  const { signature, isLoading } = useSignature()
  const [copied, setCopied] = useState(false)
  const [purchaseTracked, setPurchaseTracked] = useState(false)

  useEffect(() => {
    if (signature?.signature?.status === "active" && !purchaseTracked) {
      trackPurchase()
      setPurchaseTracked(true)
      setOpenToast(true)
    }
  }, [setOpenToast, signature, purchaseTracked])

  const handleCopy = () => {
    if (signature?.transaction?.qr_code) {
      navigator.clipboard.writeText(signature?.transaction?.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (isLoading || !signature) {
    return (
      <div className="w-full flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (signature?.signature?.status === "active") {
    return (
      <div className="w-full h-[350px] flex flex-col items-center justify-center relative">
        <button
          type="button"
          onClick={close}
          className="absolute top-4 right-4 text-[#BDBDBD] hover:text-[#3D3D3D] transition-colors"
        >
          <Icon icon="material-symbols:close" className="w-6 h-6" />
        </button>

        <div className="w-full flex flex-col gap-3.5 items-center justify-center">
          <Icon
            icon="material-symbols:shopping-cart-checkout-rounded"
            className="w-[60px] h-[60px] text-[#BBE2E7]"
          />

          <h1 className="text-2xl text-center text-[#3D3D3D] font-bold">
            Pagamento realizado com sucesso
          </h1>

          <p className="text-[18px] leading-[24px] text-[#BDBDBD] font-semibold">
            O pagamento do seu plano foi realizado com sucesso!
          </p>
        </div>
      </div>
    )
  }

  if (
    !signature?.transaction ||
    !signature?.transaction?.qr_code ||
    Object.keys(signature?.transaction)?.length === 0
  ) {
    return (
      <div className="w-full h-[350px] flex flex-col items-center justify-center">
        <Spinner />
        <p className="mt-4 text-[#BDBDBD]">Gerando código PIX...</p>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-10 items-center">
      <div className="w-full flex flex-col gap-3.5">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon="material-symbols:shopping-cart-checkout-rounded"
              className="w-[30px] h-[30px] text-[#BBE2E7]"
            />

            <h1 className="text-2xl text-center text-[#3D3D3D] font-bold">
              Pague via PIX e ative agora
            </h1>
          </div>

          <button
            type="button"
            onClick={close}
            className="text-[#BDBDBD] hover:text-[#3D3D3D] transition-colors"
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[18px] leading-[24px] text-[#BDBDBD] font-semibold">
          Escaneie o QR Code ou copie o código para ativar seu acesso Beta
        </p>
      </div>

      <div className="w-full flex flex-col gap-[14px]">
        <h3 className="text-base text-[#707070]">Código PIX</h3>

        <div className="w-full relative px-3 py-[18px] gap-2 flex items-center bg-[#FCFCFD] rounded-lg border border-[#F6F6F9]">
          <p className="text-xs text-gray-400 break-all text-wrap">
            {signature?.transaction?.qr_code}
          </p>

          <button onClick={handleCopy}>
            {copied ? (
              <Check className="cursor-pointer w-8 h-8 text-[#3B82F6]" />
            ) : (
              <Copy className="cursor-pointer w-8 h-8 text-[#BDBDBD]" />
            )}
          </button>
        </div>
      </div>

      <div className="w-full flex items-center justify-center">
        <QRCode
          title={signature?.transaction?.qr_code}
          value={signature?.transaction?.qr_code}
          size={191}
        />
      </div>

      <div className="w-full flex flex-col gap-2 items-center">
        <p className="text-sm text-[#3D3D3D] text-center">
          Após confirmação, seu acesso será liberado automaticamente
        </p>
      </div>

      <div className="w-full flex items-center gap-2">
        <Icon
          icon="material-symbols:info"
          className="w-[14px] h-[14px] text-[#3B82F6]"
        />

        <p className="text-sm text-[#3D3D3D]">
          Assim que o pagamento for confirmado, você receberá um e-mail com
          instruções para iniciarmos.
        </p>
      </div>
    </div>
  )
}
