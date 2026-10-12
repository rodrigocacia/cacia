"use client"

import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface TimeInputProps {
  value?: string
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function TimeInput({
  value = "",
  onChange,
  label,
  className,
}: TimeInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "")
    if (input.length > 4) input = input.slice(0, 4)

    let hours = input.slice(0, 2)
    let minutes = input.slice(2, 4)

    if (parseInt(hours) > 23) hours = "23"
    if (parseInt(minutes) > 59) minutes = "59"

    let formatted = hours
    if (input.length > 2) formatted += `:${minutes}`

    onChange(formatted)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const digits = raw.replace(/\D/g, "")

    if (!digits) {
      onChange("")
      return
    }

    let hours = "00"
    let minutes = "00"

    if (digits.length <= 2) {
      hours = digits.padStart(2, "0")
    } else if (digits.length === 3) {
      hours = digits.slice(0, 1).padStart(2, "0")
      minutes = digits.slice(1, 3).padEnd(2, "0")
    } else {
      hours = digits.slice(0, 2)
      minutes = digits.slice(2, 4).padEnd(2, "0")
    }

    const h = Math.min(23, Math.max(0, parseInt(hours || "0")))
    const m = Math.min(59, Math.max(0, parseInt(minutes || "0")))

    const normalized = `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0"
    )}`
    if (normalized !== value) onChange(normalized)
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label className="block text-xs font-medium text-tinta-2">
          {label}
        </label>
      )}

      <div className="flex h-11 w-full items-center rounded-[10px] border border-filete-forte bg-white px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-acao focus-within:shadow-[0_0_0_3px_#D7EBEE]">
        <Clock
          size={16}
          strokeWidth={1.7}
          aria-hidden
          className="mr-2 shrink-0 text-tinta-3"
        />
        <input
          type="text"
          inputMode="numeric"
          aria-label={label || "Horário"}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="HH:MM"
          maxLength={5}
          className={cn(
            "tabular w-full bg-transparent text-[15px] text-tinta outline-none placeholder:text-gray-400",
            className
          )}
        />
      </div>
    </div>
  )
}
