"use client"

import { TriangleAlert } from "lucide-react"

interface WhatsappWarningProps {
  className?: string
}

export function WhatsappWarning({ className = "" }: WhatsappWarningProps) {
  return (
    <div
      className={`flex w-full items-start gap-3 rounded-[12px] bg-ambar-fundo px-4 py-3.5 ${className}`}
    >
      <TriangleAlert
        size={17}
        strokeWidth={1.7}
        className="mt-px shrink-0 text-ambar"
        aria-hidden
      />
      <p className="text-[13.5px] leading-relaxed text-ambar">
        <span className="font-semibold">Não utilize seu número pessoal</span> —
        a integração exige um canal dedicado.
      </p>
    </div>
  )
}
