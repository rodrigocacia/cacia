"use client"

import { cn } from "@/lib/utils"
import { MdAccessTime } from "react-icons/md"

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
    <div className="w-full flex items-center gap-4">
      {label && (
        <label className="block text-[#707070] text-lg font-light">
          {label}
        </label>
      )}

      <div className="flex items-center bg-[#FCFCFD] border border-[#F6F6F9] rounded-2xl px-4 py-3 w-full">
        <MdAccessTime className="text-[#348C98] mr-2 h-5 w-5" />
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="HH:MM"
          maxLength={5}
          className={cn(
            "bg-transparent outline-none w-full text-base text-gray-700 font-semibold placeholder:text-gray-400",
            className
          )}
        />
      </div>
    </div>
  )
}
