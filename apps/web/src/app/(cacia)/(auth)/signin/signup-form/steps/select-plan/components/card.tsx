"use client"

import { Plan } from "@/constants/plans"
import { Check } from "lucide-react"
import { MdStars } from "react-icons/md"

interface CardProps {
  plan: Plan
  selectedPlan: number
  setSelectedPlan(value: number): void
}

export function Card({ plan, selectedPlan, setSelectedPlan }: CardProps) {
  return (
    <div
      key={plan.id}
      className={`cursor-pointer flex justify-between rounded-[14px] ${
        selectedPlan === plan.id
          ? "border-2 border-[#BBE2E7]"
          : "border border-[#E0E6EB]"
      } shadow-sm px-[18px] py-3`}
      onClick={() => setSelectedPlan(plan.id)}
    >
      <div id="left" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {plan.benefits.map((benefit) => (
            <div key={benefit.id} className="flex items-center gap-2">
              <div className="w-5 h-5 flex items-center justify-center">
                <Check className="w-4 h-4 font-bold text-[#348C98]" />
              </div>
              <span className="text-base text-[#1B1916]">{benefit.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="right" className="flex flex-col items-end justify-between">
        <h4>{plan.title}</h4>

        {plan?.mostPopular ? (
          <div className="flex bg-[#348C98] rounded-full px-1.5 py-1.5 gap-1">
            <MdStars className="text-[#EFEFEF]" />

            <p className="text-[12px] text-[#EFEFEF]">MAIS POPULAR</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
