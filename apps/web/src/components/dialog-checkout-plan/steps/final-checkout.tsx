"use client"

import { Button } from "@/components/ui/custom-button"
import { Toast } from "@/components/ui/toast"
import { createSignature } from "@/http/plan/create-signature"
import { Icon } from "@/components/icone"
import { ArrowRight, Check } from "lucide-react"
import { useState } from "react"
import { BiLeftArrowAlt } from "react-icons/bi"
import Link from "next/link"
import { benefits } from "@/constants/benefits"
import { trackInitiateCheckout } from "@/utils/facebook-pixel"

interface FinalCheckoutProps {
  setStep: (step: "final-checkout" | "payment-detail") => void
  close: () => void
}

export function FinalCheckout({ setStep, close }: FinalCheckoutProps) {
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [openSuccess, setOpenSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (isProcessing || isLoading) {
      return
    }

    if (!acceptedTerms) {
      setHasError(true)
      setErrorMessage("Você precisa aceitar os termos de uso para continuar")
      return
    }

    try {
      setIsLoading(true)
      setIsProcessing(true)

      const response = await createSignature()

      if (!response.success) {
        setHasError(true)
        setErrorMessage(response.error)
        return
      }

      trackInitiateCheckout()

      setStep("payment-detail")
    } catch (error) {
      console.error(error)
      setHasError(true)
      setErrorMessage("Erro inesperado. Tente novamente.")
    } finally {
      setIsLoading(false)
      setIsProcessing(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col items-center px-4 max-w-full"
    >
      <div className="w-full flex flex-col gap-3.5">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon
              icon="material-symbols:shopping-cart-checkout-rounded"
              className="w-[30px] h-[30px] text-[#BBE2E7]"
            />

            <h1 className="text-2xl text-[#3D3D3D] font-bold">
              Ative seu acesso Beta agora
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

        <p className="text-[18px] leading-[24px] text-[#3D3D3D] font-semibold">
          Pague R$129,90 e libere todos os recursos da CacIA Beta
        </p>
      </div>

      <div className="w-full flex flex-col gap-4 mt-6">
        <div className="w-full flex flex-col gap-2">
          {benefits?.map((benefit) => (
            <div key={benefit.id} className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <Check className="w-12 h-12 font-bold text-[#348C98]" />
              </div>
              <span className="text-base text-[#3D3D3D]">{benefit.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 mt-6">
        <div className="w-full flex flex-col py-4 px-4 gap-3 bg-[#ECF7F8] border border-[#BBE2E7] rounded-[14px]">
          <h2 className="text-lg text-[#3D3D3D] font-semibold">Plano BETA</h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <strong className="text-2xl text-[#348C98] font-bold">
              R$ 129,90
            </strong>
            <span className="text-sm text-[#3D3D3D] font-medium">
              (pagamento único)
            </span>
          </div>
        </div>

        <p className="text-base text-[#3D3D3D] leading-relaxed">
          Acesso válido no período Beta. Após esse ciclo, você será avisado no
          grupo para renovar com condições especiais.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4 mt-6">
        <h4 className="text-base text-[#3D3D3D] font-semibold">
          Forma de pagamento
        </h4>

        <div className="flex items-center gap-2">
          <div className="w-6 flex items-center justify-center h-6 rounded-[6px] bg-[#348C98] border-2 border-[#BBE2E7]">
            <Check className="w-4 h-4 text-white" />
          </div>

          <h3 className="text-sm text-[#3D3D3D] font-semibold">Pix</h3>
        </div>

        <div className="w-full">
          <p className="text-base text-[#3D3D3D]">
            Assim que o pagamento for confirmado, você receberá um e-mail com
            instruções para ativar seu acesso imediato.
          </p>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4 mt-6">
        <div className="flex items-start gap-2">
          <div
            className={`w-6 flex items-center justify-center h-6 rounded-[6px] border-2 cursor-pointer transition-colors flex-shrink-0 mt-0.5 ${
              acceptedTerms
                ? "bg-[#348C98] border-[#BBE2E7]"
                : "bg-white border-gray-300"
            }`}
            onClick={() => setAcceptedTerms(!acceptedTerms)}
          >
            {acceptedTerms && <Check className="w-4 h-4 text-white" />}
          </div>

          <label
            htmlFor="terms"
            className="text-sm text-[#3D3D3D] font-semibold cursor-pointer leading-relaxed"
            onClick={() => setAcceptedTerms(!acceptedTerms)}
          >
            Declaro que li e aceito os{" "}
            <Link
              href="/termos"
              target="_blank"
              className="text-[#348C98] hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Termos de uso
            </Link>{" "}
            e{" "}
            <Link
              href="/politica-pagamento"
              target="_blank"
              className="text-[#348C98] hover:underline font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Política de pagamento
            </Link>
            .
          </label>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-[34px]">
        <Button
          type="button"
          onClick={close}
          className="w-full sm:w-[251px] cursor-pointer order-2 sm:order-1"
          variant="outline"
          iconLeft={<BiLeftArrowAlt size={24} />}
        >
          Voltar
        </Button>

        <Button
          type="submit"
          disabled={isLoading || isProcessing || !acceptedTerms}
          isLoading={isLoading}
          className={`w-full sm:w-[251px] order-1 sm:order-2 ${
            (!acceptedTerms && !isLoading) || isProcessing
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer"
          }`}
          variant="primary"
          iconLeft={<ArrowRight />}
        >
          {isProcessing ? "Processando..." : "Pagamento"}
        </Button>
      </div>

      {hasError && (
        <Toast
          onClose={() => setHasError(false)}
          variant="errorSolid"
          title={errorMessage}
          description={errorMessage}
        />
      )}

      {openSuccess && (
        <Toast
          onClose={() => setOpenSuccess(false)}
          variant="successSolid"
          title="Serviço excluído com sucesso!"
          description="O serviço foi excluído com sucesso."
        />
      )}
    </form>
  )
}
