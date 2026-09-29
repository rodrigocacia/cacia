import { useState } from "react"

import { useRouter, useSearchParams } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { FinalCheckout } from "./steps/final-checkout"
import { PaymentDetail } from "./steps/payment-detail"
import { Toast } from "../ui/toast"

export function DialogCheckoutPlan() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [openToast, setOpenToast] = useState(false)

  const [step, setStep] = useState<"final-checkout" | "payment-detail">(
    "final-checkout"
  )

  const open = useSearchParams().get("signature") === "open"

  const close = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("signature")
    params.set("signin", "signin")

    router.push(`/signin?${params.toString()}`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          close()
        }
      }}
    >
      <DialogContent
        className="w-full min-w-[707px] max-lg:min-w-0 px-[30px] max-h-[90vh] overflow-y-auto"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Contratar plano</DialogTitle>
        </DialogHeader>

        {step === "final-checkout" ? (
          <FinalCheckout setStep={setStep} close={close} />
        ) : (
          <PaymentDetail close={close} setOpenToast={setOpenToast} />
        )}

        {openToast && (
          <Toast
            title="Pagamento confirmado"
            description="O pagamento foi confirmado com sucesso"
            onClose={close}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
