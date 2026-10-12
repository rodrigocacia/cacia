"use client"

import { useState } from "react"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ArrowRight } from "lucide-react"

import { plans } from "@/constants/plans"
import { Button } from "@/components/ui/custom-button"
import { DialogCheckoutPlan } from "@/components/dialog-checkout-plan"

import { Card } from "./components/card"

export function SelectPlan() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedPlan, setSelectedPlan] = useState(1)

  const handlePayment = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("signature", "open")

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="w-full h-full pb-4">
      <div className="flex flex-col gap-5">
        <h3 className="text-xl font-semibold text-[#1B1916]">
          Benefícios Beta
        </h3>

        <div className="w-full flex flex-col gap-3.5">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              plan={plan}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center mt-11">
        <Button
          type="button"
          onClick={handlePayment}
          className="w-[251px] cursor-pointer"
          variant="primary"
          iconLeft={<ArrowRight />}
        >
          Finalizar
        </Button>
      </div>

      <DialogCheckoutPlan />
    </div>
  )
}
