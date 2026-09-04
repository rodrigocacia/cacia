"use client"

import { Icon } from "@iconify/react/dist/iconify.js"

interface WhatsappWarningProps {
  className?: string
}

export function WhatsappWarning({ className = "" }: WhatsappWarningProps) {
  return (
    <div
      className={`w-full bg-[#FFF3CD] border border-[#FFE69C] rounded-[12px] p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Icon icon="mdi:alert-circle" className="w-5 h-5 text-[#856404]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#856404] leading-relaxed">
            <span className="font-semibold">
              {" "}
              Não utilize seu número pessoal
            </span>{" "}
            — a integração exige um canal dedicado.
          </p>
        </div>
      </div>
    </div>
  )
}
